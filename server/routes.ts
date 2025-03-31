import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { WebSocketServer, WebSocket } from "ws";
import { addDays } from "date-fns";
import {
  insertTransactionSchema,
  insertSubscriptionSchema,
  insertGameBetSchema,
  insertGameSchema,
  insertChatMessageSchema,
} from "@shared/schema";
import { z } from "zod";

// Middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

// Middleware to check if user is admin
const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() && req.user.role === "admin") {
    return next();
  }
  res.status(403).json({ message: "Forbidden" });
};

// Generate a random referral code
function generateReferralCode(length = 8) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  setupAuth(app);

  // Create HTTP server
  const httpServer = createServer(app);

  // Create WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Store active connections
  const connections = new Map<number, WebSocket>();

  wss.on('connection', (ws) => {
    let userId: number | null = null;

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'auth' && data.userId) {
          userId = Number(data.userId);
          connections.set(userId, ws);
        } else if (data.type === 'chat' && userId && data.message) {
          // Save chat message to database
          const chatMessage = await storage.createChatMessage({
            userId,
            message: data.message
          });

          // Broadcast message to all connected clients
          const user = await storage.getUser(userId);
          if (user) {
            const payload = {
              type: 'chat',
              message: {
                id: chatMessage.id,
                userId: chatMessage.userId,
                username: user.username,
                fullName: user.fullName,
                message: chatMessage.message,
                createdAt: chatMessage.createdAt
              }
            };

            wss.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(payload));
              }
            });
          }
        } else if (data.type === 'game_bet' && userId) {
          // Process game bet through the API, not here
          // This keeps game logic in one place
        }
      } catch (error) {
        console.error('Error processing websocket message:', error);
      }
    });

    ws.on('close', () => {
      if (userId) {
        connections.delete(userId);
      }
    });
  });

  // Broadcast message to specific user
  function sendToUser(userId: number, data: any) {
    const ws = connections.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  // Broadcast message to all users
  function broadcastToAll(data: any) {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  }

  // User routes
  app.get('/api/user/wallet', isAuthenticated, async (req, res) => {
    try {
      const wallet = await storage.getWallet(req.user.id);
      res.json(wallet);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get wallet' });
    }
  });

  app.get('/api/user/transactions', isAuthenticated, async (req, res) => {
    try {
      const transactions = await storage.getTransactions(req.user.id);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get transactions' });
    }
  });

  app.post('/api/user/transaction', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertTransactionSchema.parse(req.body);
      
      // Only allow user to create deposit transactions
      if (validatedData.type !== 'deposit') {
        return res.status(400).json({ message: 'Only deposit transactions can be created' });
      }
      
      const transaction = await storage.createTransaction({
        ...validatedData,
        userId: req.user.id
      });
      
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid input data', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Failed to create transaction' });
      }
    }
  });

  // Subscription routes
  app.get('/api/subscriptions', async (req, res) => {
    try {
      const subscriptions = await storage.getSubscriptions();
      res.json(subscriptions);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get subscriptions' });
    }
  });

  app.get('/api/user/subscription', isAuthenticated, async (req, res) => {
    try {
      const userSubscriptions = await storage.getUserSubscriptions(req.user.id);
      res.json(userSubscriptions);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get user subscriptions' });
    }
  });

  app.post('/api/user/subscription', isAuthenticated, async (req, res) => {
    try {
      const { subscriptionId } = req.body;
      
      if (!subscriptionId) {
        return res.status(400).json({ message: 'Subscription ID is required' });
      }
      
      // Get subscription
      const subscription = await storage.getSubscription(subscriptionId);
      if (!subscription) {
        return res.status(404).json({ message: 'Subscription not found' });
      }
      
      // Get user's wallet
      const wallet = await storage.getWallet(req.user.id);
      if (!wallet) {
        return res.status(404).json({ message: 'Wallet not found' });
      }
      
      // Check if user has enough balance
      if (wallet.balance < subscription.price) {
        return res.status(400).json({ message: 'Insufficient balance' });
      }
      
      // Create user subscription
      const startDate = new Date();
      const endDate = addDays(startDate, subscription.duration);
      
      const userSubscription = await storage.createUserSubscription({
        userId: req.user.id,
        subscriptionId,
        startDate,
        endDate,
        isActive: true
      });
      
      // Deduct subscription price from wallet
      await storage.updateWalletBalance(req.user.id, -subscription.price);
      
      // Create transaction record
      await storage.createTransaction({
        userId: req.user.id,
        amount: -subscription.price,
        type: 'subscription',
        status: 'completed',
        description: `Subscription purchase: ${subscription.name}`
      });
      
      res.status(201).json(userSubscription);
    } catch (error) {
      res.status(500).json({ message: 'Failed to purchase subscription' });
    }
  });

  // Game routes
  app.get('/api/games', async (req, res) => {
    try {
      const games = await storage.getGames();
      res.json(games);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get games' });
    }
  });

  app.get('/api/games/:id/rounds', async (req, res) => {
    try {
      const gameId = parseInt(req.params.id);
      const rounds = await storage.getGameRounds(gameId);
      res.json(rounds);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get game rounds' });
    }
  });

  app.get('/api/game-rounds/:id', async (req, res) => {
    try {
      const roundId = parseInt(req.params.id);
      const gameId = parseInt(req.query.gameId as string);
      
      if (!gameId) {
        return res.status(400).json({ message: 'Game ID is required' });
      }
      
      // Create a new round if roundId is 0 (for new games)
      if (roundId === 0) {
        const gameRound = await storage.createGameRound({
          gameId,
          startTime: new Date(),
          isCompleted: false
        });
        
        return res.json(gameRound);
      }
      
      // Get existing rounds for the game
      const rounds = await storage.getGameRounds(gameId);
      const round = rounds.find(r => r.id === roundId);
      
      if (!round) {
        return res.status(404).json({ message: 'Game round not found' });
      }
      
      res.json(round);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get game round' });
    }
  });

  app.post('/api/game-rounds/:id/bet', isAuthenticated, async (req, res) => {
    try {
      const roundId = parseInt(req.params.id);
      const validatedData = insertGameBetSchema.parse({
        ...req.body,
        userId: req.user.id,
        gameRoundId: roundId
      });
      
      // Get user's wallet
      const wallet = await storage.getWallet(req.user.id);
      if (!wallet) {
        return res.status(404).json({ message: 'Wallet not found' });
      }
      
      // Check if user has enough balance
      if (wallet.balance < validatedData.betAmount) {
        return res.status(400).json({ message: 'Insufficient balance' });
      }
      
      // Deduct bet amount from wallet
      await storage.updateWalletBalance(req.user.id, -validatedData.betAmount);
      
      // Create transaction record
      await storage.createTransaction({
        userId: req.user.id,
        amount: -validatedData.betAmount,
        type: 'game_bet',
        status: 'completed',
        description: `Game bet: Round ${roundId}`
      });
      
      // Create bet
      const bet = await storage.createGameBet(validatedData);
      
      res.status(201).json(bet);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid input data', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Failed to place bet' });
      }
    }
  });

  app.post('/api/game-rounds/:id/complete', isAdmin, async (req, res) => {
    try {
      const roundId = parseInt(req.params.id);
      const { winner } = req.body;
      
      if (!winner) {
        return res.status(400).json({ message: 'Winner is required' });
      }
      
      // Update game round
      const gameRound = await storage.updateGameRound(roundId, {
        winner,
        endTime: new Date(),
        isCompleted: true
      });
      
      // Process bets
      const bets = await storage.getGameBets(0, roundId);
      
      for (const bet of bets) {
        const isWin = bet.betChoice === winner;
        let winAmount = 0;
        
        if (isWin) {
          // Calculate win amount (2x for matching color)
          winAmount = bet.betAmount * 2;
          
          // Update user's wallet
          await storage.updateWalletBalance(bet.userId, winAmount);
          
          // Create transaction record
          await storage.createTransaction({
            userId: bet.userId,
            amount: winAmount,
            type: 'game_win',
            status: 'completed',
            description: `Game win: Round ${roundId}`
          });
          
          // Update bet record
          await storage.updateGameBet(bet.id, {
            isWin: true,
            winAmount
          });
          
          // Notify user
          sendToUser(bet.userId, {
            type: 'game_result',
            roundId,
            result: 'win',
            amount: winAmount
          });
        } else {
          // Update bet record
          await storage.updateGameBet(bet.id, {
            isWin: false,
            winAmount: 0
          });
          
          // Notify user
          sendToUser(bet.userId, {
            type: 'game_result',
            roundId,
            result: 'loss',
            amount: 0
          });
        }
      }
      
      // Broadcast game round completion
      broadcastToAll({
        type: 'round_completed',
        roundId,
        winner
      });
      
      res.json(gameRound);
    } catch (error) {
      res.status(500).json({ message: 'Failed to complete game round' });
    }
  });

  // Referral routes
  app.get('/api/user/referrals', isAuthenticated, async (req, res) => {
    try {
      const referrals = await storage.getReferrals(req.user.id);
      res.json(referrals);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get referrals' });
    }
  });

  app.post('/api/user/refer', isAuthenticated, async (req, res) => {
    try {
      const { referredUserId } = req.body;
      
      if (!referredUserId) {
        return res.status(400).json({ message: 'Referred user ID is required' });
      }
      
      // Create referral
      const referral = await storage.createReferral({
        referrerId: req.user.id,
        referredId: referredUserId,
        commission: 5 // 5% commission
      });
      
      res.status(201).json(referral);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create referral' });
    }
  });

  // Chat routes
  app.get('/api/chat/messages', async (req, res) => {
    try {
      const messages = await storage.getChatMessages();
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get chat messages' });
    }
  });

  app.post('/api/chat/messages', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertChatMessageSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const message = await storage.createChatMessage(validatedData);
      
      // Broadcast message to all users
      const user = await storage.getUser(req.user.id);
      broadcastToAll({
        type: 'chat',
        message: {
          id: message.id,
          userId: message.userId,
          username: user.username,
          fullName: user.fullName,
          message: message.message,
          createdAt: message.createdAt
        }
      });
      
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid input data', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Failed to create chat message' });
      }
    }
  });

  // Admin routes
  app.get('/api/admin/users', isAdmin, async (req, res) => {
    try {
      const allUsers = await db.select().from(users);
      res.json(allUsers);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get users' });
    }
  });

  app.get('/api/admin/transactions', isAdmin, async (req, res) => {
    try {
      const allTransactions = await db.select().from(transactions);
      res.json(allTransactions);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get transactions' });
    }
  });

  app.put('/api/admin/transactions/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: 'Status is required' });
      }
      
      const transaction = await storage.updateTransactionStatus(id, status);
      
      // If transaction is approved and it's a deposit
      if (status === 'approved' && transaction.type === 'deposit' && transaction.amount > 0) {
        // Update user's wallet
        await storage.updateWalletBalance(transaction.userId, transaction.amount);
        
        // Notify user
        sendToUser(transaction.userId, {
          type: 'transaction_approved',
          transactionId: transaction.id,
          amount: transaction.amount
        });
      }
      
      // If transaction is approved and it's a withdrawal
      if (status === 'approved' && transaction.type === 'withdrawal' && transaction.amount < 0) {
        // Notify user
        sendToUser(transaction.userId, {
          type: 'withdrawal_approved',
          transactionId: transaction.id,
          amount: Math.abs(transaction.amount)
        });
      }
      
      res.json(transaction);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update transaction' });
    }
  });

  app.post('/api/admin/subscriptions', isAdmin, async (req, res) => {
    try {
      const validatedData = insertSubscriptionSchema.parse(req.body);
      const subscription = await storage.createSubscription(validatedData);
      res.status(201).json(subscription);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid input data', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Failed to create subscription' });
      }
    }
  });

  app.put('/api/admin/subscriptions/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const subscription = await storage.updateSubscription(id, req.body);
      
      // Broadcast subscription update
      broadcastToAll({
        type: 'subscription_updated',
        subscription
      });
      
      res.json(subscription);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update subscription' });
    }
  });

  app.post('/api/admin/games', isAdmin, async (req, res) => {
    try {
      const validatedData = insertGameSchema.parse(req.body);
      const game = await storage.createGame(validatedData);
      res.status(201).json(game);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid input data', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Failed to create game' });
      }
    }
  });

  app.put('/api/admin/games/:id', isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { isActive } = req.body;
      
      const game = await storage.updateGame(id, { isActive });
      res.json(game);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update game' });
    }
  });

  app.get('/api/admin/settings', isAdmin, async (req, res) => {
    try {
      const settings = await storage.getAdminSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get settings' });
    }
  });

  app.put('/api/admin/settings/:key', isAdmin, async (req, res) => {
    try {
      const { key } = req.params;
      const { value } = req.body;
      
      if (!value) {
        return res.status(400).json({ message: 'Value is required' });
      }
      
      const setting = await storage.updateAdminSetting(key, value);
      
      // Broadcast setting update
      broadcastToAll({
        type: 'setting_updated',
        key,
        value
      });
      
      res.json(setting);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update setting' });
    }
  });

  return httpServer;
}
