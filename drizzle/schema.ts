import { decimal, integer, pgEnum, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/**
 * Enums
 */
export const roleEnum = pgEnum("role", ["user", "admin"]);
export const vehicleTypeEnum = pgEnum("vehicleType", ["car", "motorcycle", "suv", "truck", "other"]);
export const paymentMethodEnum = pgEnum("paymentMethod", ["pix", "cash", "card", "other"]);

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = pgTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum().default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Services table - stores all vehicle washing records
 */
export const services = pgTable("services", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("userId").notNull(),
  vehicleType: vehicleTypeEnum().notNull(),
  clientName: varchar("clientName", { length: 255 }),
  description: text("description"),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: paymentMethodEnum().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Service = typeof services.$inferSelect;
export type InsertService = typeof services.$inferInsert;

/**
 * Relations
 */
export const usersRelations = relations(users, ({ many }) => ({
  services: many(services),
}));

export const servicesRelations = relations(services, ({ one }) => ({
  user: one(users, {
    fields: [services.userId],
    references: [users.id],
  }),
}));

/**
 * Expenses table - stores business expenses/costs
 */
export const expenses = pgTable("expenses", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("userId").notNull(),
  category: varchar("category", { length: 100 }).notNull(), // e.g., "Produtos", "Aluguel", "Funcionário"
  description: text("description"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = typeof expenses.$inferInsert;

/**
 * Owner profile - stores business owner information
 */
export const ownerProfile = pgTable("ownerProfile", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("userId").notNull().unique(),
  businessName: varchar("businessName", { length: 255 }),
  ownerFirstName: varchar("ownerFirstName", { length: 100 }),
  ownerLastName: varchar("ownerLastName", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type OwnerProfile = typeof ownerProfile.$inferSelect;
export type InsertOwnerProfile = typeof ownerProfile.$inferInsert;

/**
 * Relations updated
 */
export const expensesRelations = relations(expenses, ({ one }) => ({
  user: one(users, {
    fields: [expenses.userId],
    references: [users.id],
  }),
}));

export const ownerProfileRelations = relations(ownerProfile, ({ one }) => ({
  user: one(users, {
    fields: [ownerProfile.userId],
    references: [users.id],
  }),
}));

export const usersRelationsUpdated = relations(users, ({ many, one }) => ({
  services: many(services),
  expenses: many(expenses),
  ownerProfile: one(ownerProfile),
}));
