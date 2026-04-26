import { pgTable, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { ordersTable } from "./orders";

export const orderEventsTable = pgTable("order_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => ordersTable.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(), // 'payment_received', 'verification', 'delivery_attempt', 'completion', 'failure'
  eventData: jsonb("event_data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertOrderEventSchema = createInsertSchema(orderEventsTable);
export type InsertOrderEvent = typeof orderEventsTable.$inferInsert;
export type OrderEvent = typeof orderEventsTable.$inferSelect;
