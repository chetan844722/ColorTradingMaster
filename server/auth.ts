import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User } from "@shared/schema";
import { rateLimiter, trackLoginAttempt, trackUserSession, MAX_LOGIN_ATTEMPTS, LOGIN_ATTEMPT_WINDOW_MINUTES } from "./middlewares/security";

// Fix TypeScript declaration for Express.User
declare global {
  namespace Express {
    // Define the User interface properly with explicit type matching our DB schema
    interface User {
      id: number;
      username: string;
      password: string;
      fullName: string;
      phone: string | null;
      email: string | null;
      role: string;
      createdAt: Date;
    }
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

/**
 * Check recent failed login attempts before allowing login
 */
async function loginSecurityCheck(req: Request, res: Response, next: NextFunction) {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ message: "Username is required" });
    }
    
    // Check for excessive failed login attempts
    const failedAttempts = await storage.getRecentFailedLoginAttempts(
      username, 
      LOGIN_ATTEMPT_WINDOW_MINUTES
    );
    
    if (failedAttempts >= MAX_LOGIN_ATTEMPTS) {
      // Track this attempt as well
      await trackLoginAttempt(username, false, req);
      
      return res.status(429).json({
        message: "Too many failed login attempts. Please try again later.",
        retryAfter: LOGIN_ATTEMPT_WINDOW_MINUTES * 60 // seconds
      });
    }
    
    next();
  } catch (error) {
    console.error("Login security check error:", error);
    next(); // Continue in case of error to avoid blocking legitimate login attempts
  }
}

/**
 * Custom authentication handler with login attempt tracking
 */
function authenticateWithTracking(req: Request, res: Response, next: NextFunction) {
  const { username } = req.body;
  
  // Use custom callback to track login attempts
  // @ts-ignore - Types for passport.authenticate callback are difficult to specify correctly
  passport.authenticate('local', async (err: any, user: Express.User | false, info: any) => {
    // Track login attempt (success or failure)
    await trackLoginAttempt(username, !!user, req);
    
    if (err) {
      return next(err);
    }
    
    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }
    
    // Track successful login session for the user
    req.login(user, async (err) => {
      if (err) {
        return next(err);
      }
      
      // Track user session for the successful login
      if (req.sessionID) {
        await trackUserSession(user.id, req.sessionID, req);
      }
      
      return res.status(200).json(user);
    });
  })(req, res, next);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "colortrade-session-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: 'lax' // Improves CSRF protection
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Apply rate limiter to all routes
  app.use(rateLimiter);

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  // Type the user parameter correctly
  passport.serializeUser((user: Express.User, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Validate input
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Create new user with hashed password
      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      // Create wallet for the user
      await storage.createWallet({ userId: user.id, balance: 0 });

      // Login the user
      req.login(user, async (err) => {
        if (err) return next(err);
        
        // Track user session for the successful registration
        if (req.sessionID) {
          await trackUserSession(user.id, req.sessionID, req);
        }
        
        res.status(201).json(user);
      });
    } catch (error) {
      next(error);
    }
  });

  // Enhanced login endpoint with security checks
  app.post("/api/login", loginSecurityCheck, authenticateWithTracking);

  app.post("/api/logout", (req, res, next) => {
    // Deactivate the session in our tracking
    if (req.sessionID && req.user) {
      storage.deactivateUserSession(req.sessionID)
        .catch(err => console.error("Error deactivating user session:", err));
    }
    
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}
