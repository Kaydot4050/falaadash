import { Router, type IRouter } from "express";
import { datamartFetch } from "../lib/datamart";
import { GetPurchaseHistoryQueryParams } from "@workspace/api-zod";
import { db, ordersTable } from "@workspace/db";
import { desc, sql } from "drizzle-orm";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.get("/purchase-history", async (req, res): Promise<void> => {
  try {
    const parsed = GetPurchaseHistoryQueryParams.safeParse(req.query);
    const page = parsed.success ? parsed.data.page ?? 1 : 1;
    const limit = parsed.success ? parsed.data.limit ?? 20 : 20;

    // 1. Fetch upstream orders
    let upstreamPurchases: any[] = [];
    let upstreamTotal = 0;
    
    try {
      const upstream = await datamartFetch(`/purchase-history?page=${page}&limit=${limit}`);
      if (upstream.ok) {
        const data = await upstream.json() as any;
        upstreamPurchases = data.data?.purchases || [];
        upstreamTotal = data.data?.pagination?.total || 0;
      }
    } catch (err) {
      logger.warn({ err }, "Failed to fetch upstream purchase history");
    }

    // 2. Fetch local orders (Show all orders, newest first)
    const offset = (page - 1) * limit;
    const localOrders = await db.select()
      .from(ordersTable)
      .orderBy(desc(ordersTable.createdAt))
      .limit(limit)
      .offset(offset);

    // 3. Map local orders to the API format
    const mappedLocal = localOrders.map(order => ({
      id: order.id,
      customerName: order.customerName || "Valued Customer",
      phoneNumber: order.phoneNumber,
      network: order.network,
      capacity: parseFloat(order.capacity),
      price: parseFloat(order.amount.toString()),
      orderStatus: order.status,
      orderReference: order.orderReference || order.paystackReference,
      paystackReference: order.paystackReference,
      costPrice: order.costPrice,
      createdAt: order.createdAt.toISOString(),
      isLocal: true
    }));

    // 4. Merge and Deduplicate by Reference
    // We use a Map to keep uniquely by reference, prioritizing local data for customer names
    const mergedMap = new Map();
    
    // 1. Add upstream first as base
    upstreamPurchases.forEach(p => {
      const ref = (p.orderReference || p.reference || "").toString();
      mergedMap.set(ref, {
        ...p,
        customerName: "Valued Customer"
      });
    });

    // 2. Overlay local data (which has names)
    // We try both the full reference and a truncated 8-character version for matching
    mappedLocal.forEach(p => {
      const fullRef = (p.orderReference || p.paystackReference || "").toString();
      const shortRef = fullRef.substring(0, 8);
      
      // Look for any variation of the reference in the map
      let matchedRef = null;
      if (mergedMap.has(fullRef)) matchedRef = fullRef;
      else if (mergedMap.has(shortRef)) matchedRef = shortRef;
      // Also try reverse: if an upstream ref is a prefix of our local ref
      else {
        for (const upRef of mergedMap.keys()) {
          if (fullRef.startsWith(upRef) || upRef.startsWith(shortRef)) {
            matchedRef = upRef;
            break;
          }
        }
      }

      if (matchedRef) {
        logger.info({ fullRef, matchedRef, name: p.customerName }, "Merging local name into upstream record");
        // Merge - keep local customerName
        const existing = mergedMap.get(matchedRef);
        mergedMap.set(matchedRef, {
          ...existing,
          customerName: p.customerName || existing.customerName || "Valued Customer"
        });
      } else {
        // Not in upstream history yet, add as new entry
        mergedMap.set(fullRef, p);
      }
    });

    const purchases = Array.from(mergedMap.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({
      status: "success",
      data: {
        purchases,
        pagination: {
          total: Math.max(mergedMap.size, upstreamTotal), // Rough estimate for now
          pages: Math.ceil(Math.max(mergedMap.size, upstreamTotal) / limit),
          currentPage: page,
          limit
        }
      }
    });

  } catch (error) {
    logger.error({ error }, "Error in purchase-history route");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
