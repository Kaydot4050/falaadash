import { Router, type IRouter } from "express";
import { createHmac } from "crypto";
import { datamartFetch } from "../lib/datamart";
import { logger } from "../lib/logger";
import { db, ordersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { PaymentService } from "../services/payment-service";

const router: IRouter = Router();

/**
 * POST /paystack/initialize
 * Creates a pending order in the DB, then initializes a Paystack transaction.
 * Returns the Paystack authorization_url for the frontend to redirect to.
 */
router.post("/paystack/initialize", async (req, res): Promise<void> => {
  const { phoneNumber, network, capacity, amount, customerName, recipientName, source } = req.body;
  const finalName = customerName || recipientName || "Valued Customer";
  const finalSource = source || "web";
  
  console.log("DEBUG: Received customerName:", finalName, "Source:", finalSource);
  logger.info({ body: req.body, customerName: finalName, source: finalSource }, "Paystack initialize request");

  if (!phoneNumber || !network || !capacity || !amount) {
    res.status(400).json({ error: "Missing required fields: phoneNumber, network, capacity, amount" });
    return;
  }

  const secretKey = process.env["PAYSTACK_SECRET_KEY"];
  if (!secretKey || secretKey === "PLACEHOLDER_REPLACE_ME") {
    res.status(500).json({ error: "Paystack is not configured. Please set PAYSTACK_SECRET_KEY." });
    return;
  }

  try {
    // 1a. Fetch cost price from DataMart
    let datamartCostPrice: string | null = null;
    try {
      // Map frontend network names to DataMart API internal names
      const netMap: Record<string, string> = {
        "MTN": "YELLO",
        "TELECEL": "TELECEL",
        "AT": "at",
        "AIRTELTIGO": "at"
      };
      const dmNet = netMap[network.toUpperCase()] || network;

      const dmRes = await datamartFetch(`/data-packages`);
      if (dmRes.ok) {
        const dmData = await dmRes.json() as any;
        if (dmData.status === "success" && dmData.data?.[dmNet]) {
          const pkg = dmData.data[dmNet].find((p: any) => String(p.capacity) === String(capacity));
          if (pkg) {
             datamartCostPrice = String(pkg.price);
             logger.info({ network, dmNet, capacity, cost: datamartCostPrice }, "Found cost price from DataMart");
          }
        }
      }
    } catch (e) {
      logger.warn({ error: e, network, capacity }, "Failed to fetch cost price from DataMart, proceeding without it");
    }

    // 1b. Create pending order in database
    const [order] = await db.insert(ordersTable).values({
      customerName: finalName,
      phoneNumber,
      network,
      capacity: String(capacity),
      amount: String(amount),
      costPrice: datamartCostPrice,
      status: "pending",
      source: finalSource,
    }).returning();

    // 2. Initialize Paystack transaction
    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: Math.round(Number(amount) * 100), // Paystack uses kobo/pesewas (amount * 100)
        email: `customer-${phoneNumber}@falaa.deals`,
        currency: "GHS",
        reference: order.id, // Use our order ID as the reference
        callback_url: `${req.headers.origin || "http://localhost:3005"}/payment/callback`,
        metadata: {
          phoneNumber,
          network,
          capacity: String(capacity),
          orderId: order.id,
        },
      }),
    });

    const paystackData = await paystackRes.json() as any;

    if (!paystackData.status) {
      logger.error({ paystackData }, "Paystack initialization failed");
      res.status(400).json({ error: paystackData.message || "Failed to initialize payment" });
      return;
    }

    // 3. Update order with Paystack reference
    await db.update(ordersTable)
      .set({ paystackReference: paystackData.data.reference })
      .where(eq(ordersTable.id, order.id));

    logger.info({ orderId: order.id, reference: paystackData.data.reference }, "Paystack transaction initialized");

    res.json({
      status: "success",
      data: {
        authorizationUrl: paystackData.data.authorization_url,
        reference: paystackData.data.reference,
        orderId: order.id,
      },
    });
  } catch (error) {
    logger.error({ error }, "Error initializing Paystack transaction");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/paystack/webhook", (req, res) => {
  res.send("Paystack Webhook endpoint is reachable via GET. Use POST for actual webhooks.");
});

/**
 * POST /paystack/webhook
 * Receives payment notifications from Paystack.
 * On successful payment, triggers the DataMart purchase to fulfill the order.
 */
router.post("/paystack/webhook", async (req, res): Promise<void> => {
  const secretKey = process.env["PAYSTACK_SECRET_KEY"];
  if (!secretKey) {
    logger.error("Webhook Error: PAYSTACK_SECRET_KEY is not set in environment variables.");
    res.status(500).json({ error: "Paystack not configured" });
    return;
  }

  // Verify Paystack signature
  const signature = req.headers["x-paystack-signature"] as string;
  const rawBody = (req as any).rawBody;
  const hash = createHmac("sha512", secretKey)
    .update(rawBody || JSON.stringify(req.body))
    .digest("hex");

  if (hash !== signature) {
    logger.warn({ 
      receivedSig: signature?.substring(0, 10), 
      calculatedSig: hash.substring(0, 10),
      bodyLength: JSON.stringify(req.body).length,
      bodyPreview: JSON.stringify(req.body).substring(0, 100),
      hasRawBody: !!rawBody
    }, "Paystack webhook signature mismatch - Check PAYSTACK_SECRET_KEY in Netlify");
    res.status(200).json({ error: "Signature mismatch" });
    return;
  }

  const event = req.body;
  logger.info({ event: event.event, reference: event.data?.reference }, "Paystack webhook received");

  if (event.event === "charge.success") {
    const reference = event.data.reference;
    logger.info({ reference }, "Webhook: Payment success event received. Triggering authoritative verification...");
    
    // We trigger verifyAndFulfill which handles the direct API check and fulfillment
    await PaymentService.verifyAndFulfill(reference, "webhook");
  }

  // Always respond 200 to Paystack
  res.sendStatus(200);
});

/**
 * GET /paystack/verify/:reference
 * Verify payment status (used by frontend callback page)
 * Now includes a fallback to Paystack API if local status is pending.
 */
router.get("/paystack/verify/:reference", async (req, res): Promise<void> => {
  const reference = Array.isArray(req.params.reference) ? req.params.reference[0] : req.params.reference;
  if (!reference) {
    res.status(400).json({ error: "Missing reference" });
    return;
  }

  const secretKey = process.env["PAYSTACK_SECRET_KEY"];

  try {
    // Attempt immediate verification and fulfillment
    // This is the "fast-track" for frontend UX
    const result = await PaymentService.verifyAndFulfill(reference, "frontend");

    // Fetch latest order state for response
    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, reference)).limit(1);

    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    res.json({
      status: "success",
      data: {
        orderId: order.id,
        orderStatus: order.status,
        orderReference: order.orderReference,
        phoneNumber: order.phoneNumber,
        network: order.network,
        capacity: order.capacity,
        amount: order.amount,
        verified: result.success
      },
    });
  } catch (error) {
    logger.error({ error, reference }, "Error verifying payment via frontend route");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
