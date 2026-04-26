import { Router, type IRouter } from "express";
import { datamartFetch } from "../lib/datamart";
import { db, ordersTable } from "@workspace/db";
import { count, sum, eq, sql } from "drizzle-orm";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.get("/stats", async (_req, res): Promise<void> => {
  try {
    // 2. Fallback: Calculate from local DB
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allSuccessful = await db.select({
      amount: ordersTable.amount,
      costPrice: ordersTable.costPrice,
      network: ordersTable.network,
      capacity: ordersTable.capacity,
    }).from(ordersTable).where(sql`${ordersTable.status} = 'completed' AND ${ordersTable.createdAt} >= ${today}`);

    const [totalOrdersResult] = await db.select({ value: count() }).from(ordersTable).where(sql`${ordersTable.status} = 'completed' AND ${ordersTable.createdAt} >= ${today}`);
    const [totalSpentResult] = await (db.select({ value: sum(ordersTable.amount) })
      .from(ordersTable)
      .where(sql`${ordersTable.status} = 'completed' AND ${ordersTable.createdAt} >= ${today}`) as any);

    const [pendingSpentResult] = await (db.select({ value: sum(ordersTable.amount) })
      .from(ordersTable)
      .where(sql`${ordersTable.status} = 'pending' AND ${ordersTable.createdAt} >= ${today}`) as any);
    
    // Calculate precise profit
    const totalProfit = allSuccessful.reduce((acc, order) => {
      const price = Number(order.amount);
      let cost = order.costPrice ? Number(order.costPrice) : null;
      
      // Heuristic Fallback for legacy orders
      if (cost === null) {
        if (order.network?.toLowerCase().includes('mtn') || order.network?.toLowerCase().includes('yello')) {
           const cap = parseFloat(String(order.capacity || 1));
           cost = cap * 4;
        } else {
           cost = price * 0.88;
        }
      }
      return acc + (price - cost);
    }, 0);

    // All-time stats
    const [allTimeOrdersResult] = await db.select({ value: count() }).from(ordersTable).where(eq(ordersTable.status, 'completed'));
    const [allTimeSpentResult] = await (db.select({ value: sum(ordersTable.amount) })
      .from(ordersTable)
      .where(eq(ordersTable.status, 'completed')) as any);
    const allSuccessfulAllTime = await db.select({
      amount: ordersTable.amount,
      costPrice: ordersTable.costPrice,
      network: ordersTable.network,
      capacity: ordersTable.capacity
    }).from(ordersTable).where(eq(ordersTable.status, 'completed'));

    const allTimeProfit = allSuccessfulAllTime.reduce((acc, order) => {
      const price = Number(order.amount);
      let cost = order.costPrice ? Number(order.costPrice) : null;
      if (cost === null) {
        if (order.network?.toLowerCase().includes('mtn') || order.network?.toLowerCase().includes('yello')) {
          const cap = parseFloat(String(order.capacity || 1));
          cost = cap * 4;
        } else {
          cost = price * 0.88;
        }
      }
      return acc + (price - cost);
    }, 0);

    const totalOrders = Number(totalOrdersResult?.value || 0);
    const totalSpent = Number(totalSpentResult?.value || 0);
    const successOrders = allSuccessful.length;

    // Aggregate by network
    const networkStats = await (db.select({
      network: ordersTable.network,
      totalOrders: count(),
      totalSpent: sum(ordersTable.amount),
    }).from(ordersTable).where(eq(ordersTable.status, 'completed')).groupBy(ordersTable.network) as any);

    // Heuristic: Sum of capacities for totalGB
    const totalGB = totalOrders * 2;

    // Count unique customers
    const [customerCountResult] = await db.select({ value: count(sql`DISTINCT ${ordersTable.phoneNumber}`) }).from(ordersTable).where(eq(ordersTable.status, 'completed'));
    const totalCustomers = Number(customerCountResult?.value || 0);

    res.json({
      status: "success",
      data: {
        totalOrders,
        totalSpent,
        totalProfit,
        totalGB,
        totalCustomers,
        allTimeOrders: Number(allTimeOrdersResult?.value || 0),
        allTimeSpent: Number(allTimeSpentResult?.value || 0),
        allTimeProfit,
        pendingSpent: Number(pendingSpentResult?.value || 0),
        successRate: totalOrders > 0 ? successOrders / totalOrders : 1.0, 
        networkBreakdown: networkStats.map((ns: any) => ({
          network: ns.network,
          totalOrders: Number(ns.totalOrders),
          totalSpent: Number(ns.totalSpent),
          totalGB: Number(ns.totalOrders) * 2
        })),
        recentActivity: []
      }
    });
  } catch (error) {
    logger.error({ error }, "Failed to generate stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
