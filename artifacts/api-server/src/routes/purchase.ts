import { Router, type IRouter } from "express";
import { datamartFetch } from "../lib/datamart";
import { PurchaseDataBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/purchase", async (req, res): Promise<void> => {
  const parsed = PurchaseDataBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const body = {
    phoneNumber: parsed.data.phoneNumber,
    network: parsed.data.network,
    capacity: parsed.data.capacity,
    gateway: parsed.data.gateway ?? "wallet",
    email: (parsed.data as any).email || `customer-${parsed.data.phoneNumber}@datamartgh.shop`,
  };

  const upstream = await datamartFetch("/purchase", {
    method: "POST",
    body: JSON.stringify(body),
  });

  const data = await upstream.json();
  res.status(upstream.status).json(data);
});

export default router;
