import { and, desc, eq, gte, like, lte, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { InsertUser, users, services, InsertService, expenses, InsertExpense, ownerProfile, InsertOwnerProfile } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const client = postgres(process.env.DATABASE_URL);
      _db = drizzle(client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    // PostgreSQL upsert syntax
    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getAllServices(userId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  return await db
    .select()
    .from(services)
    .where(eq(services.userId, userId))
    .orderBy(desc(services.createdAt));
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createService(service: InsertService): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  await db.insert(services).values(service);
}

export async function getServicesByDate(userId: number, date: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  const startOfDay = new Date(`${date}T00:00:00Z`);
  const endOfDay = new Date(`${date}T23:59:59Z`);
  return await db
    .select()
    .from(services)
    .where(
      and(
        eq(services.userId, userId),
        gte(services.createdAt, startOfDay),
        lte(services.createdAt, endOfDay)
      )
    )
    .orderBy(desc(services.createdAt));
}

export async function getServicesByPeriod(
  userId: number,
  startDate: string,
  endDate: string
) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T23:59:59Z`);
  return await db
    .select()
    .from(services)
    .where(
      and(
        eq(services.userId, userId),
        gte(services.createdAt, start),
        lte(services.createdAt, end)
      )
    )
    .orderBy(desc(services.createdAt));
}

export async function searchServices(
  userId: number,
  query: string
) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  return await db
    .select()
    .from(services)
    .where(
      and(
        eq(services.userId, userId),
        or(
          like(services.clientName, `%${query}%`),
          like(services.description, `%${query}%`)
        )
      )
    )
    .orderBy(desc(services.createdAt));
}

export async function deleteService(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  await db
    .delete(services)
    .where(and(eq(services.id, id), eq(services.userId, userId)));
}

// Expense queries
export async function createExpense(expense: InsertExpense): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  await db.insert(expenses).values(expense);
}

export async function getExpensesByPeriod(
  userId: number,
  startDate: string,
  endDate: string
) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T23:59:59Z`);
  return await db
    .select()
    .from(expenses)
    .where(
      and(
        eq(expenses.userId, userId),
        gte(expenses.createdAt, start),
        lte(expenses.createdAt, end)
      )
    )
    .orderBy(desc(expenses.createdAt));
}

export async function getAllExpenses(userId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  return await db
    .select()
    .from(expenses)
    .where(eq(expenses.userId, userId))
    .orderBy(desc(expenses.createdAt));
}

export async function deleteExpense(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  await db
    .delete(expenses)
    .where(and(eq(expenses.id, id), eq(expenses.userId, userId)));
}

// Owner profile queries
export async function getOrCreateOwnerProfile(userId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  const existing = await db
    .select()
    .from(ownerProfile)
    .where(eq(ownerProfile.userId, userId))
    .limit(1);
  
  if (existing.length > 0) {
    return existing[0];
  }
  
  // Create default profile
  await db.insert(ownerProfile).values({
    userId,
    businessName: "Pare e Lave",
    ownerFirstName: "Senhor",
    ownerLastName: "Matos",
  });
  
  return await db
    .select()
    .from(ownerProfile)
    .where(eq(ownerProfile.userId, userId))
    .limit(1)
    .then(result => result[0]);
}

export async function updateOwnerProfile(
  userId: number,
  data: Partial<InsertOwnerProfile>
): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  await db
    .update(ownerProfile)
    .set(data)
    .where(eq(ownerProfile.userId, userId));
}

// TODO: add more feature queries here as your schema grows.
