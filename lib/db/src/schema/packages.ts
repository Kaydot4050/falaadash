import { pgTable, text, boolean, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/**
 * Table to store overrides for data packages (pricing, stock, visibility)
 * Each package is unique by network + capacity (e.g., YELLO_1GB)
 */
export const packageOverridesTable = pgTable("package_overrides", {
  id: text("id").primaryKey(), // Format: {network}_{capacity}GB/MB (e.g. YELLO_1GB)
  network: text("network").notNull(),
  capacity: text("capacity").notNull(),
  customPrice: numeric("custom_price"),
  customOldPrice: numeric("custom_old_price"),
  showOldPrice: boolean("show_old_price").default(true).notNull(),
  inStock: boolean("in_stock").default(true).notNull(),
  isHidden: boolean("is_hidden").default(false).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPackageOverrideSchema = createInsertSchema(packageOverridesTable);
export type PackageOverride = typeof packageOverridesTable.$inferSelect;
export type InsertPackageOverride = typeof packageOverridesTable.$inferInsert;
