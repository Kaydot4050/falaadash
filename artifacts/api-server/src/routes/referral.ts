import { Router, type IRouter } from "express";
import { datamartFetch } from "../lib/datamart";

const router: IRouter = Router();

router.post("/claim-referral-bonus", async (_req, res): Promise<void> => {
  const upstream = await datamartFetch("/claim-referral-bonus", {
    method: "POST",
    body: JSON.stringify({}),
  });

  const data = await upstream.json();
  res.status(upstream.status).json(data);
});

export default router;
