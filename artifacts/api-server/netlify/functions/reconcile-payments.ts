import { schedule } from "@netlify/functions";
import { db, ordersTable } from "@workspace/db";
import { and, eq, lt, or } from "drizzle-orm";
import { PaymentService } from "../../src/services/payment-service";
import { logger } from "../../src/lib/logger";

const reconciliationHandler = async (event: any) => {
  logger.info({}, "Running payment reconciliation...");

  try {
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);

    // Find orders that are:
    // 1. 'pending' and more than 5 minutes old
    // 2. 'processing' and more than 15 minutes old (likely stuck)
    const staleOrders = await db.select().from(ordersTable).where(
      or(
        and(sql`${ordersTable.status} = 'pending'`, lt(ordersTable.createdAt, fiveMinsAgo)),
        and(sql`${ordersTable.status} = 'processing'`, lt(ordersTable.updatedAt, fifteenMinsAgo))
      )
    ).limit(20);

    logger.info({ count: staleOrders.length }, `Found ${staleOrders.length} stale orders to reconcile`);

    let reconciledCount = 0;
    for (const order of staleOrders) {
      try {
        const result = await PaymentService.verifyAndFulfill(order.id, "reconciler");
        if (result.success) reconciledCount++;
      } catch (err) {
        logger.error({ orderId: order.id, err: (err as Error).message }, "Failed to reconcile order");
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        total_stale: staleOrders.length,
        reconciled_successfully: reconciledCount 
      }),
    };
  } catch (error) {
    logger.error({ error: (error as Error).message }, "Critical error in reconciliation worker");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};

// Netlify Scheduled Function Config
// This runs every 10 minutes
export const handler = schedule("*/10 * * * *", reconciliationHandler);
