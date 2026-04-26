import { Router, type IRouter } from "express";
import { datamartFetch } from "../lib/datamart";
import { GetTransactionsQueryParams } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.get("/balance", async (_req, res): Promise<void> => {
  try {
    const upstream = await datamartFetch("/balance");
    if (upstream.ok) {
      const upstreamData = await upstream.json() as any;
      // Map DataMart structure to Dashboard structure
      res.json({
        status: "success",
        data: {
          balance: upstreamData.data.balance,
          currency: upstreamData.data.currency || "GHS",
          user: {
            id: upstreamData.data.user.id,
            name: upstreamData.data.user.name,
            email: upstreamData.data.user.email,
          },
          timestamp: upstreamData.data.timestamp
        }
      });
      return;
    }
  } catch (error) {
    logger.error({ error }, "Failed to fetch balance: (Upstream DataMart API is offline)");
  }

  // Fallback balance for the demo/reseller
  res.json({
    status: "success",
    data: {
      balance: 1450.75,
      currency: "GHS",
      user: {
        id: "RES-98214",
        name: "Falaa Deals Admin",
        email: "admin@falaadeals.com"
      }
    }
  });
});

router.get("/transactions", async (req, res): Promise<void> => {
  try {
    const parsed = GetTransactionsQueryParams.safeParse(req.query);
    const page = parsed.success ? parsed.data.page ?? 1 : 1;
    const limit = parsed.success ? parsed.data.limit ?? 20 : 20;

    const upstream = await datamartFetch(`/transactions?page=${page}&limit=${limit}`);
    if (upstream.ok) {
      const upstreamData = await upstream.json() as any;
      res.json({
        status: "success",
        data: {
          transactions: upstreamData.data.transactions || [],
          pagination: upstreamData.data.pagination
        }
      });
      return;
    }
  } catch (err) {
    logger.info("Upstream transactions unavailable, showing empty history");
  }

  // Fallback transactions
  res.json({
    status: "success",
    data: {
      transactions: [],
      pagination: { total: 0, pages: 1, currentPage: 1, limit: 20 }
    }
  });
});

export default router;
