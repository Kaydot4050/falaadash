import { Router, type IRouter } from "express";
import { createHmac } from "crypto";
import { logger } from "../lib/logger";
import { db, ordersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

/**
 * POST /datamart/webhook
 * Receives order status updates from DataMart.
 * Events: order.created, order.processing, order.completed, order.failed
 */
router.post("/datamart/webhook", async (req, res): Promise<void> => {
  const webhookSecret = process.env["DATAMART_WEBHOOK_SECRET"];
  if (!webhookSecret) {
    logger.error("DATAMART_WEBHOOK_SECRET is not set");
    res.status(500).json({ error: "Webhook not configured" });
    return;
  }

  // Verify DataMart HMAC-SHA256 signature
  const signature = req.headers["x-datamart-signature"] as string;
  const rawBody = (req as any).rawBody;
  const expected = createHmac("sha256", webhookSecret)
    .update(rawBody || JSON.stringify(req.body))
    .digest("hex");

  if (signature !== expected) {
    logger.warn({
      receivedSig: signature,
      expectedSig: expected,
    }, "Invalid DataMart webhook signature");
    res.status(401).json({ error: "Invalid signature" });
    return;
  }

  const { event, data } = req.body;
  logger.info({ event, orderReference: data?.orderReference, status: data?.status }, "DataMart webhook received");

  // We can use this to update local order status if needed
  // For now, just log the events for monitoring
  if (data?.orderReference) {
    try {
      // Try to find the order by DataMart reference and update its status
      const statusMap: Record<string, string> = {
        "order.completed": "completed",
        "order.failed": "failed",
        "order.processing": "processing",
        "order.created": "pending",
      };

      const newStatus = statusMap[event];
      if (newStatus) {
        const result = await db.update(ordersTable)
          .set({ status: newStatus as any, updatedAt: new Date() })
          .where(eq(ordersTable.orderReference, data.orderReference))
          .returning();

        if (result.length > 0) {
          logger.info({ orderId: result[0].id, event, newStatus }, "Order status updated via DataMart webhook");
        } else {
          logger.debug({ orderReference: data.orderReference }, "No matching order found for DataMart webhook (may be a direct purchase)");
        }
      }
    } catch (error) {
      logger.error({ error, event, orderReference: data.orderReference }, "Error processing DataMart webhook");
    }
  }

  res.json({ received: true });
});

export default router;
