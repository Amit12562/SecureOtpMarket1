import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  balance: integer("balance").notNull().default(0),
  isAdmin: boolean("is_admin").notNull().default(false),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  utrNumber: text("utr_number").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const otpRequests = pgTable("otp_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  appName: text("app_name").notNull(),
  otp: text("otp").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, balance: true, isAdmin: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, status: true, createdAt: true });
export const insertOtpRequestSchema = createInsertSchema(otpRequests).pick({ appName: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type InsertOtpRequest = z.infer<typeof insertOtpRequestSchema>;

export type User = typeof users.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type OtpRequest = typeof otpRequests.$inferSelect;