// Referenced from Replit Auth blueprint
import {
  users,
  waitlistSignups,
  scheduledCheckupEmails,
  type User,
  type UpsertUser,
  type InsertWaitlistSignup,
  type WaitlistSignup,
  type InsertScheduledCheckup,
  type ScheduledCheckupEmail,
} from "@shared/schema";
import { internalDb } from "./internalDb";
import { eq } from "drizzle-orm";

// Storage interface
export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Waitlist operations
  createWaitlistSignup(data: InsertWaitlistSignup): Promise<WaitlistSignup>;
  getWaitlistSignups(): Promise<WaitlistSignup[]>;
  
  // Scheduled checkup operations
  createScheduledCheckup(data: InsertScheduledCheckup): Promise<ScheduledCheckupEmail>;
  getScheduledCheckups(): Promise<ScheduledCheckupEmail[]>;
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await internalDb.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await internalDb
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Waitlist operations
  async createWaitlistSignup(data: InsertWaitlistSignup): Promise<WaitlistSignup> {
    const [signup] = await internalDb
      .insert(waitlistSignups)
      .values(data)
      .returning();
    return signup;
  }

  async getWaitlistSignups(): Promise<WaitlistSignup[]> {
    return await internalDb.select().from(waitlistSignups);
  }

  // Scheduled checkup operations
  async createScheduledCheckup(data: InsertScheduledCheckup): Promise<ScheduledCheckupEmail> {
    const [checkup] = await internalDb
      .insert(scheduledCheckupEmails)
      .values(data)
      .returning();
    return checkup;
  }

  async getScheduledCheckups(): Promise<ScheduledCheckupEmail[]> {
    return await internalDb.select().from(scheduledCheckupEmails);
  }
}

export const storage = new DatabaseStorage();
