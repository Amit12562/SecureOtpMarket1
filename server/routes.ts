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

function requireAdmin(req: Request) {
  if (!req.session.userId) {
    throw new Error("Not authenticated");
  }
  const user = storage.getUser(req.session.userId);
  if (!user || !user.isAdmin) {
    throw new Error("Not authorized");
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
      res.json({ id: user.id, username: user.username, balance: user.balance, isAdmin: user.isAdmin });
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
      res.json({ id: user.id, username: user.username, balance: user.balance, isAdmin: user.isAdmin });
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

    res.json({ id: user.id, username: user.username, balance: user.balance, isAdmin: user.isAdmin });
  });

  app.get("/api/admin/transactions", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const transactions = await storage.getAllTransactions();
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/admin/otp-requests", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const requests = await storage.getAllOtpRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/admin/transactions/:id", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const { id } = req.params;
      const { status } = req.body;

      if (status !== "approved" && status !== "rejected") {
        return res.status(400).json({ message: "Invalid status" });
      }

      const transaction = await storage.updateTransactionStatus(parseInt(id), status);

      if (status === "approved") {
        await storage.updateUserBalance(transaction.userId, transaction.amount);
      }

      res.json(transaction);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/admin/otp-requests/:id", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const { id } = req.params;
      const { mobileNumber, adminOtp } = req.body;

      const request = await storage.updateOtpRequest(parseInt(id), { mobileNumber, adminOtp });
      res.json(request);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
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
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      if (user.balance < 7) {
        return res.status(400).json({ message: "Insufficient balance (Minimum ₹7 required)" });
      }

      const requestData = insertOtpRequestSchema.parse(req.body);
      await storage.updateUserBalance(user.id, -7); // Deduct ₹7 from user's wallet
      const otpRequest = await storage.createOtpRequest(req.session.userId, requestData);
      res.json(otpRequest);
    } catch (error) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.get("/api/otp-requests/history", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const requests = await storage.getOtpRequestsByUserId(req.session.userId);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}