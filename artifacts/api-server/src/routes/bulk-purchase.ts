import { Router, type IRouter } from "express";
import { datamartFetch } from "../lib/datamart";
import { BulkPurchaseBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/bulk-purchase", async (req, res): Promise<void> => {
  const parsed = BulkPurchaseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const upstream = await datamartFetch("/bulk-purchase", {
    method: "POST",
    body: JSON.stringify(parsed.data),
  });

  const data = await upstream.json();
  res.status(upstream.status).json(data);
});

export default router;
