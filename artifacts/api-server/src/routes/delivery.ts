import { Router, type IRouter } from "express";
import { datamartFetch } from "../lib/datamart";

const router: IRouter = Router();

router.get("/delivery-tracker", async (_req, res): Promise<void> => {
  const upstream = await datamartFetch("/delivery-tracker");
  const data = await upstream.json();
  res.status(upstream.status).json(data);
});

export default router;
