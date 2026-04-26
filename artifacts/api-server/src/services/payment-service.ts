import { db, ordersTable, orderEventsTable } from "@workspace/db";
import { eq, and, ne, sql } from "drizzle-orm";
import { datamartFetch } from "../lib/datamart";
import { logger } from "../lib/logger";

export type PaymentStatus = "pending" | "processing" | "completed" | "failed";

export class PaymentService {
  /**
   * Authoritative function to verify and fulfill an order.
   * Handles locking, idempotency, and state transitions.
   */
  static async verifyAndFulfill(orderId: string, source: "webhook" | "frontend" | "reconciler"): Promise<{ success: boolean; message: string; status?: string }> {
    const logPrefix = `[PaymentService:${source}] [Order:${orderId}]`;
    
    try {
      // 1. Fetch current order state
      const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId)).limit(1);
      
      if (!order) {
        logger.error({ orderId, source }, `${logPrefix} Order not found`);
        return { success: false, message: "Order not found" };
      }

      // 2. Check if already completed or processing
      if (order.status === "completed") {
        logger.info({ orderId, source }, `${logPrefix} Order already completed, skipping`);
        return { success: true, message: "Order already completed", status: "completed" };
      }

      if (order.status === "processing" && source !== "reconciler") {
        // If it's already processing by another trigger, we wait/skip
        // Reconciler is allowed to retry "stuck" processing orders
        logger.info({ orderId, source }, `${logPrefix} Order is already being processed by another channel`);
        return { success: true, message: "Order is processing", status: "processing" };
      }

      // 3. Atomically acquire lock (transition to 'processing')
      // For reconciler, we only pick it up if it's been 'processing' for too long, 
      // but here we just ensure we transition it if it's 'pending'.
      // If it's already 'processing' and source is 'reconciler', we continue but we should log it.
      
      const updateCondition = source === "reconciler" 
        ? eq(ordersTable.id, orderId) // Reconciler can override to retry
        : and(
            eq(ordersTable.id, orderId), 
            sql`${ordersTable.status} != 'completed'`, 
            sql`${ordersTable.status} != 'processing'`
          );

      const [lockedOrder] = await db.update(ordersTable)
        .set({ 
          status: "processing", 
          updatedAt: new Date(),
          auditLogs: sql`${ordersTable.auditLogs} || ${JSON.stringify([{ timestamp: new Date().toISOString(), event: `Transition to processing via ${source}` }])}::jsonb` as any
        })
        .where(updateCondition)
        .returning();

      if (!lockedOrder) {
        logger.info({ orderId, source }, `${logPrefix} Could not acquire lock, likely already processed`);
        return { success: true, message: "Order processed by another channel", status: "completed" };
      }

      await this.recordEvent(orderId, "verification_started", { source });

      // 4. Verify payment with Paystack
      const secretKey = process.env["PAYSTACK_SECRET_KEY"];
      if (!secretKey) {
        throw new Error("PAYSTACK_SECRET_KEY not configured");
      }

      const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(orderId)}`, {
        headers: { "Authorization": `Bearer ${secretKey}` }
      });
      
      const paystackData = await paystackRes.json() as any;
      
      if (!paystackData.status || paystackData.data.status !== "success") {
        const paystackStatus = paystackData.data?.status || "unknown";
        logger.warn({ orderId, paystackStatus, source }, `${logPrefix} Paystack verification failed: ${paystackStatus}`);
        
        await this.recordEvent(orderId, "verification_failed", { paystackData });
        
        // If it's not success, we revert to pending (unless it's a hard failure like 'abandoned' or 'failed')
        const finalStatus = (paystackStatus === "failed" || paystackStatus === "reversed") ? "failed" : "pending";
        
        await db.update(ordersTable)
          .set({ 
            status: finalStatus, 
            updatedAt: new Date(),
            auditLogs: sql`${ordersTable.auditLogs} || ${JSON.stringify([{ timestamp: new Date().toISOString(), event: `Verification failed (${paystackStatus}), reverted to ${finalStatus}` }])}::jsonb` as any
          })
          .where(eq(ordersTable.id, orderId));

        return { success: false, message: `Payment not confirmed: ${paystackStatus}`, status: finalStatus };
      }

      // Verify amount (Paystack uses kobo/pesewas)
      const expectedAmountKobo = Math.round(Number(order.amount) * 100);
      const actualAmountKobo = paystackData.data.amount;
      
      if (actualAmountKobo < expectedAmountKobo) {
         logger.error({ orderId, expected: expectedAmountKobo, actual: actualAmountKobo }, `${logPrefix} Amount mismatch!`);
         await this.recordEvent(orderId, "amount_mismatch", { expected: expectedAmountKobo, actual: actualAmountKobo });
         
         await db.update(ordersTable)
          .set({ 
            status: "failed", 
            updatedAt: new Date(),
            auditLogs: sql`${ordersTable.auditLogs} || ${JSON.stringify([{ timestamp: new Date().toISOString(), event: "Amount mismatch detected" }])}::jsonb` as any
          })
          .where(eq(ordersTable.id, orderId));
          
         return { success: false, message: "Amount mismatch", status: "failed" };
      }

      await this.recordEvent(orderId, "payment_verified", { paystackRef: paystackData.data.reference });

      // 5. Fulfill Order via DataMart
      logger.info({ orderId, phone: order.phoneNumber }, `${logPrefix} Triggering fulfillment via DataMart`);
      
      const purchaseBody = {
        phoneNumber: order.phoneNumber,
        network: order.network,
        capacity: order.capacity,
        gateway: "wallet",
      };

      const dmRes = await datamartFetch("/purchase", {
        method: "POST",
        body: JSON.stringify(purchaseBody),
      });

      const dmData = await dmRes.json() as any;
      const isDuplicate = dmRes.status === 409 || dmData.code === "DUPLICATE_ORDER" || dmData.message?.toLowerCase().includes("similar order");

      if (dmRes.ok || isDuplicate) {
        const orderRef = dmData.data?.orderReference || dmData.data?.existingReference || "ALREADY_FULFILLED";
        
        await db.update(ordersTable)
          .set({
            status: "completed",
            orderReference: orderRef,
            updatedAt: new Date(),
            auditLogs: sql`${ordersTable.auditLogs} || ${JSON.stringify([{ timestamp: new Date().toISOString(), event: isDuplicate ? "Fulfillment confirmed (duplicate)" : "Fulfillment successful" }])}::jsonb` as any
          })
          .where(eq(ordersTable.id, orderId));

        await this.recordEvent(orderId, "completion", { orderReference: orderRef, isDuplicate });
        
        logger.info({ orderId, orderRef }, `${logPrefix} Order completed successfully`);
        return { success: true, message: "Order completed", status: "completed" };
      } else {
        // Fulfillment failed
        logger.error({ orderId, dmStatus: dmRes.status, dmData }, `${logPrefix} DataMart fulfillment failed`);
        
        await this.recordEvent(orderId, "delivery_failed", { dmStatus: dmRes.status, dmData });

        await db.update(ordersTable)
          .set({ 
            status: "failed", 
            updatedAt: new Date(),
            auditLogs: sql`${ordersTable.auditLogs} || ${JSON.stringify([{ timestamp: new Date().toISOString(), event: "Fulfillment failed at DataMart" }])}::jsonb` as any
          })
          .where(eq(ordersTable.id, orderId));

        return { success: false, message: "Fulfillment failed", status: "failed" };
      }

    } catch (error) {
      logger.error({ orderId, error: (error as Error).message }, `${logPrefix} Critical error in verifyAndFulfill`);
      
      // Attempt to record failure
      try {
        await this.recordEvent(orderId, "system_error", { error: (error as Error).message });
      } catch (e) {}

      return { success: false, message: "Internal system error" };
    }
  }

  private static async recordEvent(orderId: string, eventType: string, eventData: any) {
    try {
      await db.insert(orderEventsTable).values({
        orderId,
        eventType,
        eventData: eventData || {},
      });
    } catch (err) {
      logger.error({ err, orderId, eventType }, "Failed to record order event");
    }
  }
}
