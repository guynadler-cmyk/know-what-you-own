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
  type Lead,
} from "@shared/schema";
<<<<<<< Updated upstream
  import { db } from "./db";
  import { eq, or } from "drizzle-orm";


// In-memory lead storage
const leads: Lead[] = [];
=======
import { appDb } from "./db/appDb";
import { eq } from "drizzle-orm";
>>>>>>> Stashed changes

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
  
  // Email deduplication
  isEmailNew(email: string): Promise<boolean>;
  
  // Lead operations (in-memory)
  addLead(lead: Lead): void;
  getLeads(): Lead[];
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
<<<<<<< Updated upstream
    const [user] = await internalDb.select().from(users).where(eq(users.id, id));
=======
    const [user] = await appDb.select().from(users).where(eq(users.id, id));
>>>>>>> Stashed changes
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
<<<<<<< Updated upstream
    const [user] = await internalDb
=======
    const [user] = await appDb
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
    const [signup] = await internalDb
=======
    const [signup] = await appDb
>>>>>>> Stashed changes
      .insert(waitlistSignups)
      .values({ ...data, email: data.email.toLowerCase().trim() })
      .returning();
    return signup;
  }

  async getWaitlistSignups(): Promise<WaitlistSignup[]> {
<<<<<<< Updated upstream
    return await internalDb.select().from(waitlistSignups);
=======
    return await appDb.select().from(waitlistSignups);
>>>>>>> Stashed changes
  }

  // Scheduled checkup operations
  async createScheduledCheckup(data: InsertScheduledCheckup): Promise<ScheduledCheckupEmail> {
<<<<<<< Updated upstream
    const [checkup] = await internalDb
=======
    const [checkup] = await appDb
>>>>>>> Stashed changes
      .insert(scheduledCheckupEmails)
      .values({ ...data, email: data.email.toLowerCase().trim() })
      .returning();
    return checkup;
  }

  async getScheduledCheckups(): Promise<ScheduledCheckupEmail[]> {
<<<<<<< Updated upstream
    return await internalDb.select().from(scheduledCheckupEmails);
  }

  async isEmailNew(email: string): Promise<boolean> {
    const normalizedEmail = email.toLowerCase().trim();
    const [waitlistMatch] = await db
      .select({ email: waitlistSignups.email })
      .from(waitlistSignups)
      .where(eq(waitlistSignups.email, normalizedEmail))
      .limit(1);
    if (waitlistMatch) return false;

    const [checkupMatch] = await db
      .select({ email: scheduledCheckupEmails.email })
      .from(scheduledCheckupEmails)
      .where(eq(scheduledCheckupEmails.email, normalizedEmail))
      .limit(1);
    if (checkupMatch) return false;

    return true;
  }

  // Lead operations (in-memory)
  addLead(lead: Lead): void {
    leads.push(lead);
  }

  getLeads(): Lead[] {
    return [...leads];
=======
    return await appDb.select().from(scheduledCheckupEmails);
>>>>>>> Stashed changes
  }
}

export const storage = new DatabaseStorage();
