import { 
  users, wallets, transactions, subscriptions, userSubscriptions,
  games, gameRounds, gameBets, referrals, chatMessages, adminSettings,
  type User, type InsertUser, type Wallet, type InsertWallet,
  type Transaction, type InsertTransaction, type Subscription, type InsertSubscription,
  type UserSubscription, type InsertUserSubscription,
  type Game, type InsertGame, type GameRound, type InsertGameRound,
  type GameBet, type InsertGameBet, type Referral, type InsertReferral,
  type ChatMessage, type InsertChatMessage, type AdminSetting, type InsertAdminSetting
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte } from "drizzle-orm";
import session from "express-session";
import createMemoryStore from "memorystore";

// Use MemoryStore for sessions for simplicity
const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User>;
  
  // Wallet methods
  getWallet(userId: number): Promise<Wallet | undefined>;
  createWallet(wallet: InsertWallet): Promise<Wallet>;
  updateWalletBalance(userId: number, amount: number): Promise<Wallet>;
  
  // Transaction methods
  getTransactions(userId: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransactionStatus(id: number, status: string): Promise<Transaction>;
  
  // Subscription methods
  getSubscriptions(): Promise<Subscription[]>;
  getSubscription(id: number): Promise<Subscription | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: number, subscription: Partial<Subscription>): Promise<Subscription>;
  
  // User Subscription methods
  getUserSubscriptions(userId: number): Promise<UserSubscription[]>;
  createUserSubscription(userSubscription: InsertUserSubscription): Promise<UserSubscription>;
  updateUserSubscription(id: number, userSubscription: Partial<UserSubscription>): Promise<UserSubscription>;
  
  // Game methods
  getGames(): Promise<Game[]>;
  getGame(id: number): Promise<Game | undefined>;
  createGame(game: InsertGame): Promise<Game>;
  
  // Game Round methods
  getGameRounds(gameId: number): Promise<GameRound[]>;
  createGameRound(gameRound: InsertGameRound): Promise<GameRound>;
  updateGameRound(id: number, gameRound: Partial<GameRound>): Promise<GameRound>;
  
  // Game Bet methods
  getGameBets(userId: number, gameRoundId?: number): Promise<GameBet[]>;
  createGameBet(gameBet: InsertGameBet): Promise<GameBet>;
  updateGameBet(id: number, gameBet: Partial<GameBet>): Promise<GameBet>;
  
  // Referral methods
  getReferrals(referrerId: number): Promise<Referral[]>;
  createReferral(referral: InsertReferral): Promise<Referral>;
  
  // Chat methods
  getChatMessages(): Promise<ChatMessage[]>;
  createChatMessage(chatMessage: InsertChatMessage): Promise<ChatMessage>;
  
  // Admin Settings methods
  getAdminSettings(): Promise<AdminSetting[]>;
  getAdminSetting(key: string): Promise<AdminSetting | undefined>;
  updateAdminSetting(key: string, value: string): Promise<AdminSetting>;

  // Session store
  sessionStore: any; // Using any to avoid type issues with session store
}

export class DatabaseStorage implements IStorage {
  sessionStore: any; // Using any to avoid type issues with session store

  constructor() {
    // Use in-memory session store for simplicity
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, user: Partial<User>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set(user)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Wallet methods
  async getWallet(userId: number): Promise<Wallet | undefined> {
    const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId));
    return wallet;
  }

  async createWallet(wallet: InsertWallet): Promise<Wallet> {
    const [newWallet] = await db.insert(wallets).values(wallet).returning();
    return newWallet;
  }

  async updateWalletBalance(userId: number, amount: number): Promise<Wallet> {
    const wallet = await this.getWallet(userId);
    if (!wallet) {
      throw new Error("Wallet not found");
    }

    const [updatedWallet] = await db
      .update(wallets)
      .set({
        balance: wallet.balance + amount,
        updatedAt: new Date(),
      })
      .where(eq(wallets.userId, userId))
      .returning();
    
    return updatedWallet;
  }

  // Transaction methods
  async getTransactions(userId: number): Promise<Transaction[]> {
    return db.select().from(transactions).where(eq(transactions.userId, userId));
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db.insert(transactions).values(transaction).returning();
    return newTransaction;
  }

  async updateTransactionStatus(id: number, status: string): Promise<Transaction> {
    const [updatedTransaction] = await db
      .update(transactions)
      .set({ status })
      .where(eq(transactions.id, id))
      .returning();
    
    return updatedTransaction;
  }

  // Subscription methods
  async getSubscriptions(): Promise<Subscription[]> {
    return db.select().from(subscriptions).where(eq(subscriptions.isActive, true));
  }

  async getSubscription(id: number): Promise<Subscription | undefined> {
    const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.id, id));
    return subscription;
  }

  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const [newSubscription] = await db.insert(subscriptions).values(subscription).returning();
    return newSubscription;
  }

  async updateSubscription(id: number, subscription: Partial<Subscription>): Promise<Subscription> {
    const [updatedSubscription] = await db
      .update(subscriptions)
      .set(subscription)
      .where(eq(subscriptions.id, id))
      .returning();
    
    return updatedSubscription;
  }

  // User Subscription methods
  async getUserSubscriptions(userId: number): Promise<UserSubscription[]> {
    return db.select().from(userSubscriptions).where(eq(userSubscriptions.userId, userId));
  }

  async getActiveUserSubscription(userId: number): Promise<UserSubscription | undefined> {
    const [subscription] = await db
      .select()
      .from(userSubscriptions)
      .where(
        and(
          eq(userSubscriptions.userId, userId),
          eq(userSubscriptions.isActive, true),
          gte(userSubscriptions.endDate, new Date())
        )
      );
    
    return subscription;
  }

  async createUserSubscription(userSubscription: InsertUserSubscription): Promise<UserSubscription> {
    const [newUserSubscription] = await db.insert(userSubscriptions).values(userSubscription).returning();
    return newUserSubscription;
  }

  async updateUserSubscription(id: number, userSubscription: Partial<UserSubscription>): Promise<UserSubscription> {
    const [updatedUserSubscription] = await db
      .update(userSubscriptions)
      .set(userSubscription)
      .where(eq(userSubscriptions.id, id))
      .returning();
    
    return updatedUserSubscription;
  }

  // Game methods
  async getGames(): Promise<Game[]> {
    return db.select().from(games).where(eq(games.isActive, true));
  }

  async getGame(id: number): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.id, id));
    return game;
  }

  async createGame(game: InsertGame): Promise<Game> {
    const [newGame] = await db.insert(games).values(game).returning();
    return newGame;
  }

  // Game Round methods
  async getGameRounds(gameId: number): Promise<GameRound[]> {
    return db.select().from(gameRounds).where(eq(gameRounds.gameId, gameId));
  }

  async createGameRound(gameRound: InsertGameRound): Promise<GameRound> {
    const [newGameRound] = await db.insert(gameRounds).values(gameRound).returning();
    return newGameRound;
  }

  async updateGameRound(id: number, gameRound: Partial<GameRound>): Promise<GameRound> {
    const [updatedGameRound] = await db
      .update(gameRounds)
      .set(gameRound)
      .where(eq(gameRounds.id, id))
      .returning();
    
    return updatedGameRound;
  }

  // Game Bet methods
  async getGameBets(userId: number, gameRoundId?: number): Promise<GameBet[]> {
    if (gameRoundId) {
      return db.select().from(gameBets).where(
        and(
          eq(gameBets.userId, userId),
          eq(gameBets.gameRoundId, gameRoundId)
        )
      );
    } else {
      return db.select().from(gameBets).where(eq(gameBets.userId, userId));
    }
  }

  async createGameBet(gameBet: InsertGameBet): Promise<GameBet> {
    const [newGameBet] = await db.insert(gameBets).values(gameBet).returning();
    return newGameBet;
  }

  async updateGameBet(id: number, gameBet: Partial<GameBet>): Promise<GameBet> {
    const [updatedGameBet] = await db
      .update(gameBets)
      .set(gameBet)
      .where(eq(gameBets.id, id))
      .returning();
    
    return updatedGameBet;
  }

  // Referral methods
  async getReferrals(referrerId: number): Promise<Referral[]> {
    return db.select().from(referrals).where(eq(referrals.referrerId, referrerId));
  }

  async createReferral(referral: InsertReferral): Promise<Referral> {
    const [newReferral] = await db.insert(referrals).values(referral).returning();
    return newReferral;
  }

  // Chat methods
  async getChatMessages(): Promise<ChatMessage[]> {
    return db.select().from(chatMessages).orderBy(chatMessages.createdAt);
  }

  async createChatMessage(chatMessage: InsertChatMessage): Promise<ChatMessage> {
    const [newChatMessage] = await db.insert(chatMessages).values(chatMessage).returning();
    return newChatMessage;
  }

  // Admin Settings methods
  async getAdminSettings(): Promise<AdminSetting[]> {
    return db.select().from(adminSettings);
  }

  async getAdminSetting(key: string): Promise<AdminSetting | undefined> {
    const [setting] = await db.select().from(adminSettings).where(eq(adminSettings.key, key));
    return setting;
  }

  async updateAdminSetting(key: string, value: string): Promise<AdminSetting> {
    const setting = await this.getAdminSetting(key);
    
    if (setting) {
      const [updatedSetting] = await db
        .update(adminSettings)
        .set({ value, updatedAt: new Date() })
        .where(eq(adminSettings.key, key))
        .returning();
      
      return updatedSetting;
    } else {
      const [newSetting] = await db
        .insert(adminSettings)
        .values({ key, value })
        .returning();
      
      return newSetting;
    }
  }
}

export const storage = new DatabaseStorage();
