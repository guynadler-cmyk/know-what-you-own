// Referenced from Replit Auth blueprint
import {
  users,
  waitlistSignups,
  scheduledCheckupEmails,
  watchlistItems,
  type User,
  type UpsertUser,
  type InsertWaitlistSignup,
  type WaitlistSignup,
  type InsertScheduledCheckup,
  type ScheduledCheckupEmail,
  type Lead,
  type WatchlistItem,
  type WatchlistSnapshot,
  type HistoricalSnapshot,
} from "@shared/schema";
import { db } from "./db";
import { internalDb } from "./internalDb";
import { eq, or, and, like, desc } from "drizzle-orm";


// In-memory lead storage
const leads: Lead[] = [];

// Storage interface
export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Waitlist operations
  createWaitlistSignup(data: InsertWaitlistSignup): Promise<WaitlistSignup>;
  getWaitlistSignups(): Promise<WaitlistSignup[]>;
  checkWaitlistEmail(email: string): Promise<boolean>;
  checkEmailTickerFollowed(email: string, ticker: string): Promise<boolean>;
  
  // Scheduled checkup operations
  createScheduledCheckup(data: InsertScheduledCheckup): Promise<ScheduledCheckupEmail>;
  getScheduledCheckups(): Promise<ScheduledCheckupEmail[]>;
  
  // Email deduplication
  isEmailNew(email: string): Promise<boolean>;
  
  // Watchlist operations
  getWatchlistItems(userId: string): Promise<WatchlistItem[]>;
  addWatchlistItem(userId: string, data: { ticker: string; companyName: string; notes?: string | null; snapshot: WatchlistSnapshot }): Promise<WatchlistItem>;
  updateWatchlistNotes(id: string, userId: string, notes: string | null): Promise<WatchlistItem | undefined>;
  updateWatchlistSnapshot(id: string, userId: string, newSnapshot: WatchlistSnapshot): Promise<WatchlistItem | undefined>;
  removeWatchlistItem(id: string, userId: string): Promise<boolean>;
  getWatchlistItem(userId: string, ticker: string): Promise<WatchlistItem | undefined>;
  
  // Lead operations (in-memory)
  addLead(lead: Lead): void;
  getLeads(): Lead[];
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
      .values({ ...data, email: data.email.toLowerCase().trim() })
      .returning();
    return signup;
  }

  async getWaitlistSignups(): Promise<WaitlistSignup[]> {
    return await internalDb.select().from(waitlistSignups);
  }

  async checkWaitlistEmail(email: string): Promise<boolean> {
    const normalizedEmail = email.toLowerCase().trim();
    const [match] = await internalDb
      .select({ email: waitlistSignups.email })
      .from(waitlistSignups)
      .where(eq(waitlistSignups.email, normalizedEmail))
      .limit(1);
    return !!match;
  }

  async checkEmailTickerFollowed(email: string, ticker: string): Promise<boolean> {
    const normalizedEmail = email.toLowerCase().trim();
    const upperTicker = ticker.toUpperCase();
    const [match] = await internalDb
      .select({ id: waitlistSignups.id })
      .from(waitlistSignups)
      .where(
        and(
          eq(waitlistSignups.email, normalizedEmail),
          like(waitlistSignups.stageName, `%${upperTicker}%`)
        )
      )
      .limit(1);
    return !!match;
  }

  // Scheduled checkup operations
  async createScheduledCheckup(data: InsertScheduledCheckup): Promise<ScheduledCheckupEmail> {
    const [checkup] = await internalDb
      .insert(scheduledCheckupEmails)
      .values({ ...data, email: data.email.toLowerCase().trim() })
      .returning();
    return checkup;
  }

  async getScheduledCheckups(): Promise<ScheduledCheckupEmail[]> {
    return await internalDb.select().from(scheduledCheckupEmails);
  }

  async isEmailNew(email: string): Promise<boolean> {
    const normalizedEmail = email.toLowerCase().trim();
    const [waitlistMatch] = await internalDb
      .select({ email: waitlistSignups.email })
      .from(waitlistSignups)
      .where(eq(waitlistSignups.email, normalizedEmail))
      .limit(1);
    if (waitlistMatch) return false;

    const [checkupMatch] = await internalDb
      .select({ email: scheduledCheckupEmails.email })
      .from(scheduledCheckupEmails)
      .where(eq(scheduledCheckupEmails.email, normalizedEmail))
      .limit(1);
    if (checkupMatch) return false;

    return true;
  }

  // Watchlist operations
  async getWatchlistItems(userId: string): Promise<WatchlistItem[]> {
    return await internalDb
      .select()
      .from(watchlistItems)
      .where(eq(watchlistItems.userId, userId))
      .orderBy(desc(watchlistItems.createdAt));
  }

  async addWatchlistItem(userId: string, data: { ticker: string; companyName: string; notes?: string | null; snapshot: WatchlistSnapshot }): Promise<WatchlistItem> {
    const [item] = await internalDb
      .insert(watchlistItems)
      .values({
        userId,
        ticker: data.ticker.toUpperCase(),
        companyName: data.companyName,
        notes: data.notes || null,
        snapshot: data.snapshot,
      })
      .returning();
    return item;
  }

  async updateWatchlistNotes(id: string, userId: string, notes: string | null): Promise<WatchlistItem | undefined> {
    const [item] = await internalDb
      .update(watchlistItems)
      .set({ notes, updatedAt: new Date() })
      .where(and(eq(watchlistItems.id, id), eq(watchlistItems.userId, userId)))
      .returning();
    return item;
  }

  async updateWatchlistSnapshot(id: string, userId: string, newSnapshot: WatchlistSnapshot): Promise<WatchlistItem | undefined> {
    const existing = await internalDb
      .select()
      .from(watchlistItems)
      .where(and(eq(watchlistItems.id, id), eq(watchlistItems.userId, userId)))
      .limit(1);
    if (!existing.length) return undefined;

    const currentItem = existing[0];
    const history: HistoricalSnapshot[] = (currentItem.snapshotHistory as HistoricalSnapshot[] || []);
    history.push({
      snapshot: currentItem.snapshot,
      savedAt: (currentItem.updatedAt || new Date()).toISOString(),
    });

    const [item] = await internalDb
      .update(watchlistItems)
      .set({
        snapshot: newSnapshot,
        snapshotHistory: history,
        updatedAt: new Date(),
      })
      .where(and(eq(watchlistItems.id, id), eq(watchlistItems.userId, userId)))
      .returning();
    return item;
  }

  async removeWatchlistItem(id: string, userId: string): Promise<boolean> {
    const result = await internalDb
      .delete(watchlistItems)
      .where(and(eq(watchlistItems.id, id), eq(watchlistItems.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async getWatchlistItem(userId: string, ticker: string): Promise<WatchlistItem | undefined> {
    const [item] = await internalDb
      .select()
      .from(watchlistItems)
      .where(and(eq(watchlistItems.userId, userId), eq(watchlistItems.ticker, ticker.toUpperCase())))
      .limit(1);
    return item;
  }

  // Lead operations (in-memory)
  addLead(lead: Lead): void {
    leads.push(lead);
  }

  getLeads(): Lead[] {
    return [...leads];
  }
}

export const storage = new DatabaseStorage();
