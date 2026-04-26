import { pgTable, text, serial, timestamp, decimal, uuid, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import * as z from "zod";

export const ordersTable = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerName: text("customer_name"),
  phoneNumber: text("phone_number").notNull(),
  network: text("network").notNull(),
  capacity: text("capacity").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }), // Price from DataMart
  status: text("status", { enum: ["pending", "processing", "completed", "failed"] }).notNull().default("pending"),
  paystackReference: text("paystack_reference").unique(),
  orderReference: text("order_reference"), // DataMart reference
  source: text("source").default("web").notNull(), // 'web' or 'api'
  auditLogs: jsonb("audit_logs").$type<Array<{ timestamp: string, event: string, data?: any }>>().default([]),
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  retryCount: integer("retry_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertOrderSchema = createInsertSchema(ordersTable);
export type InsertOrder = typeof ordersTable.$inferInsert;
export type Order = typeof ordersTable.$inferSelect;
