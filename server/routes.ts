import type { Express, Request } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertTransactionSchema, insertOtpRequestSchema } from "@shared/schema";
import { ZodError } from "zod";

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

export async function registerRoutes(app: Express) {
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(userData.username);
      
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await storage.createUser(userData);
      req.session.userId = user.id;
      res.json({ id: user.id, username: user.username, balance: user.balance });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Invalid input" });
      } else {
        res.status(500).json({ message: "Server error" });
      }
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = insertUserSchema.parse(req.body);
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user.id;
      res.json({ id: user.id, username: user.username, balance: user.balance });
    } catch (error) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    res.json({ id: user.id, username: user.username, balance: user.balance });
  });

  app.post("/api/transactions", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const transactionData = insertTransactionSchema.parse({
        ...req.body,
        userId: req.session.userId,
      });

      const transaction = await storage.createTransaction(transactionData);
      res.json(transaction);
    } catch (error) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.post("/api/otp-requests", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const requestData = insertOtpRequestSchema.parse(req.body);
      const otpRequest = await storage.createOtpRequest(req.session.userId, requestData);
      res.json(otpRequest);
    } catch (error) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
