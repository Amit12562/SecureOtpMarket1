import { users, transactions, otpRequests } from "@shared/schema";
import type { User, InsertUser, Transaction, InsertTransaction, OtpRequest, InsertOtpRequest } from "@shared/schema";

const MOBILE_NUMBERS = [
  "+916392621695",
  "+916260691879",
  "+919905360468",
  "+918595806274",
  "+917083123589",
  "+919678728181",
  "+918177995686",
  "+919036738920",
  "+918669077428",
  "+919535340856",
  "+917736275076",
  "+919720165149"
];

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(id: number, amount: number): Promise<User>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransactionStatus(id: number, status: string): Promise<Transaction>;
  getTransactionsByUserId(userId: number): Promise<Transaction[]>;
  getAllTransactions(): Promise<Transaction[]>;
  createOtpRequest(userId: number, request: InsertOtpRequest): Promise<OtpRequest>;
  getOtpRequestsByUserId(userId: number): Promise<OtpRequest[]>;
  getAllOtpRequests(): Promise<OtpRequest[]>;
  updateOtpRequest(id: number, data: { adminOtp?: string }): Promise<OtpRequest>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private transactions: Map<number, Transaction>;
  private otpRequests: Map<number, OtpRequest>;
  private currentId: { users: number; transactions: number; otpRequests: number };

  constructor() {
    this.users = new Map();
    this.transactions = new Map();
    this.otpRequests = new Map();
    this.currentId = { users: 1, transactions: 1, otpRequests: 1 };

    // Create default admin user with 5-letter password
    this.createUser({
      username: "noobru",
      password: "boss"
    }).then(user => {
      const adminUser = { ...user, isAdmin: true };
      this.users.set(user.id, adminUser);
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.users++;
    const user: User = { ...insertUser, id, balance: 0, isAdmin: false };
    this.users.set(id, user);
    return user;
  }

  async updateUserBalance(id: number, amount: number): Promise<User> {
    const user = await this.getUser(id);
    if (!user) throw new Error("User not found");

    const updatedUser = { ...user, balance: user.balance + amount };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.currentId.transactions++;
    const transaction: Transaction = {
      ...insertTransaction,
      id,
      status: "pending",
      createdAt: new Date(),
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async updateTransactionStatus(id: number, status: string): Promise<Transaction> {
    const transaction = this.transactions.get(id);
    if (!transaction) throw new Error("Transaction not found");

    const updatedTransaction = { ...transaction, status };
    this.transactions.set(id, updatedTransaction);
    return updatedTransaction;
  }

  async getTransactionsByUserId(userId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      (transaction) => transaction.userId === userId,
    );
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values());
  }

  async createOtpRequest(userId: number, request: InsertOtpRequest): Promise<OtpRequest> {
    const id = this.currentId.otpRequests++;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // Select a random mobile number from the list
    const randomIndex = Math.floor(Math.random() * MOBILE_NUMBERS.length);
    const mobileNumber = MOBILE_NUMBERS[randomIndex];

    const otpRequest: OtpRequest = {
      ...request,
      id,
      userId,
      otp,
      status: "pending",
      mobileNumber,
      adminOtp: null,
      createdAt: new Date(),
    };
    this.otpRequests.set(id, otpRequest);
    return otpRequest;
  }

  async getOtpRequestsByUserId(userId: number): Promise<OtpRequest[]> {
    return Array.from(this.otpRequests.values()).filter(
      (request) => request.userId === userId,
    );
  }

  async getAllOtpRequests(): Promise<OtpRequest[]> {
    return Array.from(this.otpRequests.values());
  }

  async updateOtpRequest(id: number, data: { adminOtp?: string }): Promise<OtpRequest> {
    const request = this.otpRequests.get(id);
    if (!request) throw new Error("OTP request not found");

    const updatedRequest = {
      ...request,
      ...data,
      status: data.adminOtp ? "completed" : "pending"
    };
    this.otpRequests.set(id, updatedRequest);
    return updatedRequest;
  }
}

export const storage = new MemStorage();