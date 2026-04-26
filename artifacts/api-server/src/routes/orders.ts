import { Router, type IRouter } from "express";
import { datamartFetch } from "../lib/datamart";
import { db, ordersTable } from "@workspace/db";
import { eq, desc, or } from "drizzle-orm";
import { logger } from "../lib/logger";

const router: IRouter = Router();

/**
 * GET /order/:reference
 * Smart lookup: Checks local DB for Paystack OR DataMart refs first, then falls back to DataMart API.
 */
router.get("/order/:reference", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.reference)
    ? req.params.reference[0]
    : req.params.reference;

  if (!raw) {
    res.status(400).json({ error: "Missing order reference" });
    return;
  }

  try {
    // 1. Check local DB first for either reference type
    const local = await (db.query.ordersTable as any).findFirst({
      where: or(
        eq(ordersTable.orderReference, raw),
        eq(ordersTable.paystackReference, raw)
      )
    });

    // 2. If found in local DB and has a DataMart reference, get live status
    if (local?.orderReference) {
      const upstream = await datamartFetch(`/order-status/${encodeURIComponent(local.orderReference)}`);
      if (upstream.ok) {
        const data = await upstream.json();
        res.json(data);
        return;
      }
    }

    // 3. If found locally but no DataMart ref yet (pending/failed), return local data
    if (local) {
      res.json({
        reference: local.orderReference || local.paystackReference,
        phoneNumber: local.phoneNumber,
        network: local.network,
        capacity: local.capacity,
        price: parseFloat(local.amount.toString()),
        orderStatus: local.status,
        createdAt: local.createdAt.toISOString()
      });
      return;
    }

    // 4. Fallback: Try DataMart directly (for legacy/external orders)
    const fallback = await datamartFetch(`/order-status/${encodeURIComponent(raw)}`);
    if (fallback.ok) {
      const data = await fallback.json();
      res.json(data);
    } else {
      res.status(fallback.status).json({ error: "Order not found" });
    }
  } catch (error) {
    logger.error({ error, raw }, "Error in smart order lookup");
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /order/phone/:phoneNumber
 * Find recent orders for a given phone number from local DB.
 */
router.get("/order/phone/:phoneNumber", async (req, res): Promise<void> => {
  const phone = Array.isArray(req.params.phoneNumber)
    ? req.params.phoneNumber[0]
    : req.params.phoneNumber;

  if (!phone) {
    res.status(400).json({ error: "Missing phone number" });
    return;
  }

  try {
    const orders = await db.select()
      .from(ordersTable)
      .where(eq(ordersTable.phoneNumber, phone))
      .orderBy(desc(ordersTable.createdAt));

    res.json({
      status: "success",
      data: orders
    });
  } catch (error) {
    logger.error({ error, phone }, "Error searching orders by phone");
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * DELETE /api/order/:reference
 * Removes an order from local tracking history.
 */
router.delete("/order/:reference", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.reference)
    ? req.params.reference[0]
    : req.params.reference;

  if (!raw) {
    res.status(400).json({ error: "Missing reference" });
    return;
  }

  try {
    const result = await db.delete(ordersTable)
      .where(or(
        eq(ordersTable.orderReference, raw),
        eq(ordersTable.paystackReference, raw)
      ));

    res.json({ status: "success", message: "Order removed from history" });
  } catch (error) {
    logger.error({ error, raw }, "Error deleting order");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
