import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import { InsertLoginAttempt, InsertSecurityAlert, InsertUserSession } from '@shared/schema';

// Rate limiter configuration
const RATE_LIMITS: Record<string, { max: number, windowMs: number }> = {
  '/api/login': { max: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
  '/api/register': { max: 3, windowMs: 60 * 60 * 1000 }, // 3 attempts per hour
  '/api/user/subscription': { max: 10, windowMs: 10 * 60 * 1000 }, // 10 attempts per 10 minutes
  '/api/user/wallet/deposit': { max: 10, windowMs: 15 * 60 * 1000 }, // 10 attempts per 15 minutes
  '/api/user/wallet/withdraw': { max: 5, windowMs: 30 * 60 * 1000 }, // 5 attempts per 30 minutes
  'default': { max: 100, windowMs: 15 * 60 * 1000 } // General rate limit
};

// Login attempt tracking - blocks user after too many failed attempts
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOGIN_ATTEMPT_WINDOW_MINUTES = 15;

/**
 * Rate limiting middleware - restricts number of requests from a single client
 */
export async function rateLimiter(req: Request, res: Response, next: NextFunction) {
  try {
    // Skip rate limiting for certain paths or methods
    if (req.method === 'GET' && !req.path.includes('/api/game-rounds')) {
      return next();
    }
    
    // Get client identifier (IP address or user ID if authenticated)
    const clientKey = req.user 
      ? `user:${req.user.id}` 
      : `ip:${req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress}`;
    
    // Get endpoint-specific rate limit config
    const endpoint = req.path;
    const limitConfig = RATE_LIMITS[endpoint] || RATE_LIMITS['default'];
    
    // Calculate expiration time for this rate limit window
    const now = new Date();
    const expiresAt = new Date(now.getTime() + limitConfig.windowMs);
    
    // Check if client has existing rate limit record
    const rateLimit = await storage.getRateLimit(clientKey, endpoint);
    
    if (rateLimit) {
      // If count exceeds limit, block the request
      if (rateLimit.count >= limitConfig.max) {
        // Create security alert for rate limit violation if not already created
        const alertData: InsertSecurityAlert = {
          userId: req.user?.id,
          type: 'rate_limit_exceeded',
          severity: 'medium',
          description: `Rate limit exceeded for endpoint ${endpoint}`,
          metadata: {
            endpoint,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            count: rateLimit.count,
            limit: limitConfig.max
          },
          ipAddress: req.ip || req.headers['x-forwarded-for'] as string || req.socket.remoteAddress as string
        };
        
        await storage.createSecurityAlert(alertData);
        
        return res.status(429).json({
          error: 'Too many requests',
          retryAfter: Math.ceil((rateLimit.expiresAt.getTime() - now.getTime()) / 1000)
        });
      }
      
      // Update the rate limit count
      await storage.createOrUpdateRateLimit(clientKey, endpoint, expiresAt);
    } else {
      // Create new rate limit record
      await storage.createOrUpdateRateLimit(clientKey, endpoint, expiresAt);
    }
    
    // Clean up expired rate limits occasionally (1% chance)
    if (Math.random() < 0.01) {
      await storage.cleanupExpiredRateLimits();
    }
    
    next();
  } catch (error) {
    console.error('Rate limiter error:', error);
    next(); // Continue even if rate limiter fails
  }
}

/**
 * Track login attempts and block after too many failed attempts
 */
export async function trackLoginAttempt(
  username: string, 
  success: boolean, 
  req: Request
) {
  try {
    // Create login attempt record
    const loginAttemptData: InsertLoginAttempt = {
      username,
      ipAddress: req.ip || req.headers['x-forwarded-for'] as string || req.socket.remoteAddress as string,
      userAgent: req.headers['user-agent'] as string,
      success,
      geoLocation: {} // Would use a geolocation service in production
    };
    
    await storage.createLoginAttempt(loginAttemptData);
    
    // If login failed, check if account should be flagged for too many attempts
    if (!success) {
      const failedAttempts = await storage.getRecentFailedLoginAttempts(
        username, 
        LOGIN_ATTEMPT_WINDOW_MINUTES
      );
      
      if (failedAttempts >= MAX_LOGIN_ATTEMPTS) {
        // Create security alert for too many failed login attempts
        const alertData: InsertSecurityAlert = {
          type: 'excessive_login_attempts',
          severity: 'high',
          description: `Multiple failed login attempts for user ${username}`,
          metadata: {
            username,
            attempts: failedAttempts,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
          },
          ipAddress: req.ip || req.headers['x-forwarded-for'] as string || req.socket.remoteAddress as string
        };
        
        // Get user to associate with alert if exists
        const user = await storage.getUserByUsername(username);
        if (user) {
          alertData.userId = user.id;
        }
        
        await storage.createSecurityAlert(alertData);
      }
    }
  } catch (error) {
    console.error('Error tracking login attempt:', error);
  }
}

/**
 * Track user sessions for device management and suspicious activity detection
 */
export async function trackUserSession(userId: number, sessionId: string, req: Request) {
  try {
    const sessionData: InsertUserSession = {
      userId,
      sessionId,
      ipAddress: req.ip || req.headers['x-forwarded-for'] as string || req.socket.remoteAddress as string,
      userAgent: req.headers['user-agent'] as string,
      geoLocation: {} // Would use a geolocation service in production
    };
    
    // Create session record
    await storage.createUserSession(sessionData);
    
    // Check for multiple active sessions from different locations/devices
    const userSessions = await storage.getUserSessions(userId);
    
    // If user suddenly logs in from a new location or device, create an alert
    if (userSessions.length > 1) {
      const mostRecentSession = userSessions[0];
      const previousSession = userSessions[1];
      
      // Compare IP addresses to detect location changes
      if (mostRecentSession.ipAddress !== previousSession.ipAddress) {
        const alertData: InsertSecurityAlert = {
          userId,
          type: 'new_login_location',
          severity: 'medium',
          description: `New login from different IP address for user ID ${userId}`,
          metadata: {
            currentIp: mostRecentSession.ipAddress,
            previousIp: previousSession.ipAddress,
            userAgent: req.headers['user-agent']
          },
          ipAddress: mostRecentSession.ipAddress
        };
        
        await storage.createSecurityAlert(alertData);
      }
      
      // Could also compare user agents to detect new devices
    }
  } catch (error) {
    console.error('Error tracking user session:', error);
  }
}

/**
 * Detect suspicious transactions (large amounts or unusual patterns)
 */
export async function detectSuspiciousTransaction(
  userId: number,
  amount: number,
  type: string
) {
  try {
    // Get user's typical transaction history
    const transactions = await storage.getTransactions(userId);
    
    // Calculate average transaction amount for this type
    const sameTypeTransactions = transactions.filter(t => t.type === type);
    let avgAmount = 0;
    
    if (sameTypeTransactions.length > 0) {
      avgAmount = sameTypeTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) / sameTypeTransactions.length;
    }
    
    // Get the user for the alert
    const user = await storage.getUser(userId);
    
    // Define thresholds for suspicious activity
    let alertThreshold = 0;
    
    switch (type) {
      case 'withdrawal':
        alertThreshold = 1000; // Alert for withdrawals over 1000
        break;
      case 'deposit':
        alertThreshold = 3000; // Alert for deposits over 3000
        break;
      case 'game_bet':
        alertThreshold = 500; // Alert for bets over 500
        break;
      default:
        alertThreshold = 2000; // Default threshold
    }
    
    // Alert if amount is unusually large
    if (Math.abs(amount) > alertThreshold) {
      const alertData: InsertSecurityAlert = {
        userId,
        type: 'large_transaction',
        severity: 'medium',
        description: `Unusually large ${type} transaction of ${Math.abs(amount)} for user ${user?.username || userId}`,
        metadata: {
          amount: Math.abs(amount),
          avgAmount,
          type,
          username: user?.username
        }
      };
      
      await storage.createSecurityAlert(alertData);
    }
    
    // Alert if amount is significantly larger than user's average
    if (avgAmount > 0 && Math.abs(amount) > avgAmount * 5) {
      const alertData: InsertSecurityAlert = {
        userId,
        type: 'unusual_transaction_pattern',
        severity: 'medium',
        description: `Transaction amount significantly higher than user average for ${user?.username || userId}`,
        metadata: {
          amount: Math.abs(amount),
          avgAmount,
          ratio: Math.abs(amount) / avgAmount,
          type,
          username: user?.username
        }
      };
      
      await storage.createSecurityAlert(alertData);
    }
  } catch (error) {
    console.error('Error detecting suspicious transaction:', error);
  }
}

/**
 * Detect rapid sequential betting that could indicate bot or script usage
 */
export async function detectAutomatedBetting(userId: number, gameRoundId: number) {
  try {
    // Get all recent bets from this user
    const bets = await storage.getGameBets(userId);
    
    // Look at the last 10 bets
    const recentBets = bets.slice(0, 10);
    
    if (recentBets.length < 5) {
      return; // Not enough data to analyze
    }
    
    // Check time intervals between bets
    const intervals: number[] = [];
    for (let i = 0; i < recentBets.length - 1; i++) {
      const timeDiff = recentBets[i].createdAt.getTime() - recentBets[i + 1].createdAt.getTime();
      intervals.push(timeDiff);
    }
    
    // Calculate standard deviation of intervals
    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    
    // If standard deviation is very low, it suggests automated, uniform betting
    if (stdDev < 500 && avgInterval < 5000) { // Less than 500ms std dev and average time less than 5 seconds
      const alertData: InsertSecurityAlert = {
        userId,
        type: 'automated_betting',
        severity: 'high',
        description: `Possible automated betting detected for user ID ${userId}`,
        metadata: {
          avgInterval,
          stdDev,
          numBets: recentBets.length,
          gameRoundId
        }
      };
      
      await storage.createSecurityAlert(alertData);
    }
  } catch (error) {
    console.error('Error detecting automated betting:', error);
  }
}