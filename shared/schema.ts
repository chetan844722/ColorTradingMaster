import { pgTable, text, serial, integer, boolean, timestamp, real, primaryKey, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  email: text("email"),
  role: text("role").notNull().default("user"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  phone: true,
  email: true,
});

// Wallet model
export const wallets = pgTable("wallets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  balance: real("balance").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertWalletSchema = createInsertSchema(wallets).pick({
  userId: true,
  balance: true,
});

// Transaction model
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: real("amount").notNull(),
  type: text("type").notNull(), // deposit, withdrawal, game_win, game_loss, referral, subscription
  status: text("status").notNull().default("pending"), // pending, approved, rejected, completed
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  userId: true,
  amount: true,
  type: true,
  status: true,
  description: true,
});

// Subscription model
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  price: real("price").notNull(),
  dailyReward: real("daily_reward").notNull(),
  totalReward: real("total_reward").notNull(),
  duration: integer("duration").notNull(), // in days
  level: integer("level").notNull().default(1), // Subscription level (1, 2, 3)
  features: text("features").array().notNull(),
  isActive: boolean("is_active").notNull().default(true),
  withdrawalWaitDays: integer("withdrawal_wait_days").notNull().default(15), // Days before withdrawal is allowed
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).pick({
  name: true,
  price: true,
  dailyReward: true,
  totalReward: true,
  duration: true,
  level: true,
  features: true,
  isActive: true,
  withdrawalWaitDays: true,
});

// User Subscription model
export const userSubscriptions = pgTable("user_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  subscriptionId: integer("subscription_id").notNull().references(() => subscriptions.id),
  startDate: timestamp("start_date").notNull().defaultNow(),
  endDate: timestamp("end_date").notNull(),
  lastRewardDate: timestamp("last_reward_date"),
  isActive: boolean("is_active").notNull().default(true),
  
  // New fields for tracking rewards and earnings
  totalEarned: real("total_earned").notNull().default(0), // Total earned from daily rewards
  totalWithdrawn: real("total_withdrawn").notNull().default(0), // Total amount withdrawn
  accumulatedWinnings: real("accumulated_winnings").notNull().default(0), // Total won from games
  nextWithdrawalDate: timestamp("next_withdrawal_date"), // Date when withdrawal is allowed
});

export const insertUserSubscriptionSchema = createInsertSchema(userSubscriptions).pick({
  userId: true,
  subscriptionId: true,
  startDate: true,
  endDate: true,
  isActive: true,
  lastRewardDate: true,
  totalEarned: true,
  totalWithdrawn: true,
  accumulatedWinnings: true,
  nextWithdrawalDate: true,
});

// Game model
export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  minBet: real("min_bet").notNull(),
  icon: text("icon").notNull(),
  color1: text("color1").notNull(),
  color2: text("color2").notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertGameSchema = createInsertSchema(games).pick({
  name: true,
  description: true,
  minBet: true,
  icon: true,
  color1: true,
  color2: true,
  isActive: true,
});

// Game Round model
export const gameRounds = pgTable("game_rounds", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull().references(() => games.id),
  startTime: timestamp("start_time").notNull().defaultNow(),
  endTime: timestamp("end_time"),
  winner: text("winner"), // red, green, violet, etc.
  isCompleted: boolean("is_completed").notNull().default(false),
});

export const insertGameRoundSchema = createInsertSchema(gameRounds).pick({
  gameId: true,
  startTime: true,
  endTime: true,
  winner: true,
  isCompleted: true,
});

// Game Bet model
export const gameBets = pgTable("game_bets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  gameRoundId: integer("game_round_id").notNull().references(() => gameRounds.id),
  betAmount: real("bet_amount").notNull(),
  betChoice: text("bet_choice").notNull(), // red, green, violet, etc.
  winAmount: real("win_amount"),
  isWin: boolean("is_win"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertGameBetSchema = createInsertSchema(gameBets).pick({
  userId: true,
  gameRoundId: true,
  betAmount: true,
  betChoice: true,
});

// Referral model
export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id").notNull().references(() => users.id),
  referredId: integer("referred_id").notNull().references(() => users.id),
  commission: real("commission").notNull().default(5), // percentage commission
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertReferralSchema = createInsertSchema(referrals).pick({
  referrerId: true,
  referredId: true,
  commission: true,
});

// Chat message model
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  userId: true,
  message: true,
});

// Admin settings model
export const adminSettings = pgTable("admin_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAdminSettingSchema = createInsertSchema(adminSettings).pick({
  key: true,
  value: true,
});

// Login attempts for security tracking
export const loginAttempts = pgTable("login_attempts", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  ipAddress: text("ip_address").notNull(),
  userAgent: text("user_agent"),
  success: boolean("success").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  geoLocation: jsonb("geo_location"), // Store country, city, etc.
});

export const insertLoginAttemptSchema = createInsertSchema(loginAttempts).pick({
  username: true,
  ipAddress: true,
  userAgent: true,
  success: true,
  geoLocation: true,
});

// User sessions for tracking active users
export const userSessions = pgTable("user_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  sessionId: text("session_id").notNull(),
  ipAddress: text("ip_address").notNull(),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastActiveAt: timestamp("last_active_at").notNull().defaultNow(),
  geoLocation: jsonb("geo_location"), // Store country, city, etc.
  isActive: boolean("is_active").notNull().default(true),
});

export const insertUserSessionSchema = createInsertSchema(userSessions).pick({
  userId: true,
  sessionId: true,
  ipAddress: true,
  userAgent: true,
  geoLocation: true,
});

// Security alerts for fraud detection
export const securityAlerts = pgTable("security_alerts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  type: text("type").notNull(), // login_attempt, suspicious_bet, large_withdrawal, etc.
  severity: text("severity").notNull(), // low, medium, high
  description: text("description").notNull(),
  metadata: jsonb("metadata"), // Additional details about the alert
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  isResolved: boolean("is_resolved").notNull().default(false),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: integer("resolved_by").references(() => users.id),
  resolution: text("resolution"),
});

export const insertSecurityAlertSchema = createInsertSchema(securityAlerts).pick({
  userId: true,
  type: true,
  severity: true,
  description: true,
  metadata: true,
  ipAddress: true,
});

// Rate limiting to prevent abuse
export const rateLimits = pgTable("rate_limits", {
  id: serial("id").primaryKey(),
  key: text("key").notNull(), // The resource being limited (IP, user ID, endpoint)
  endpoint: text("endpoint").notNull(), // The API endpoint being accessed
  count: integer("count").notNull().default(1), // Number of requests
  firstRequest: timestamp("first_request").notNull().defaultNow(),
  lastRequest: timestamp("last_request").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(), // When this rate limit record expires
});

// Composite types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Wallet = typeof wallets.$inferSelect;
export type InsertWallet = z.infer<typeof insertWalletSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;

export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = z.infer<typeof insertUserSubscriptionSchema>;

export type Game = typeof games.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;

export type GameRound = typeof gameRounds.$inferSelect;
export type InsertGameRound = z.infer<typeof insertGameRoundSchema>;

export type GameBet = typeof gameBets.$inferSelect;
export type InsertGameBet = z.infer<typeof insertGameBetSchema>;

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = z.infer<typeof insertReferralSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type AdminSetting = typeof adminSettings.$inferSelect;
export type InsertAdminSetting = z.infer<typeof insertAdminSettingSchema>;

export type LoginAttempt = typeof loginAttempts.$inferSelect;
export type InsertLoginAttempt = z.infer<typeof insertLoginAttemptSchema>;

export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;

export type SecurityAlert = typeof securityAlerts.$inferSelect;
export type InsertSecurityAlert = z.infer<typeof insertSecurityAlertSchema>;

export type RateLimit = typeof rateLimits.$inferSelect;
