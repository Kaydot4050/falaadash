import { Router } from "express";
import { db, ordersTable } from "@workspace/db";
import { count, sum, max, eq, desc, and, or, sql } from "drizzle-orm";
import { logger } from "../lib/logger";

const router = Router();

// GET all customers (aggregated from orders)
router.get("/admin/customers", async (req, res) => {
  try {
    logger.info("Fetching Admin Customers (All Time)...");
    const customers = await db.select({
      phoneNumber: ordersTable.phoneNumber,
      customerName: max(ordersTable.customerName),
      totalOrders: count(ordersTable.id),
      totalSpent: sum(ordersTable.amount),
      lastOrderAt: max(ordersTable.createdAt),
    })
    .from(ordersTable)
    .where(or(
      eq(ordersTable.status, "fulfilled"),
      eq(ordersTable.status, "success"),
      eq(ordersTable.status, "complete"),
      sql`${ordersTable.status} ILIKE '%success%'`,
      sql`${ordersTable.status} ILIKE '%fulfil%'`
    ))
    .groupBy(ordersTable.phoneNumber)
    .orderBy(desc(max(ordersTable.createdAt)));

    logger.info({ count: customers.length }, "Admin Customers Fetched");

    res.json({
      status: "success",
      data: customers.map(c => ({
        ...c,
        totalSpent: Number(c.totalSpent || 0).toFixed(2),
        totalOrders: Number(c.totalOrders || 0)
      }))
    });
  } catch (error) {
    logger.error({ error }, "Failed to fetch customers:");
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
});

export default router;
