import { Router, type IRouter } from "express";
import { createHmac } from "crypto";
import { datamartFetch } from "../lib/datamart";
import { CreateWithdrawalBody } from "@workspace/api-zod";
import { logger } from "../lib/logger";
import { v4 as uuidv4 } from "uuid";

const WITHDRAWAL_BASE_PATH = "/api/developer/v1/withdrawals";
const DATAMART_FULL_BASE = "https://api.datamartgh.shop";

function getSigningSecret(): string {
  const secret = process.env["DATAMART_SIGNING_SECRET"];
  if (!secret) {
    logger.warn("DATAMART_SIGNING_SECRET is not set — withdrawal requests will fail signature verification");
    return "";
  }
  return secret;
}

function buildSignature(timestamp: string, method: string, path: string, body: string): string {
  const secret = getSigningSecret();
  const payload = `${timestamp}.${method}.${path}.${body}`;
  return createHmac("sha256", secret).update(payload).digest("hex");
}

const router: IRouter = Router();

router.post("/withdrawals", async (req, res): Promise<void> => {
  const parsed = CreateWithdrawalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const apiKey = process.env["DATAMART_API_KEY"] ?? "";
  const timestamp = String(Date.now());
  const idempotencyKey = uuidv4();
  const rawBody = JSON.stringify(parsed.data);
  const signature = buildSignature(timestamp, "POST", WITHDRAWAL_BASE_PATH, rawBody);

  const upstream = await fetch(`${DATAMART_FULL_BASE}${WITHDRAWAL_BASE_PATH}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
      "X-Idempotency-Key": idempotencyKey,
      "X-Signature": signature,
      "X-Timestamp": timestamp,
    },
    body: rawBody,
  });

  const data = await upstream.json();
  res.status(upstream.status).json(data);
});

router.get("/withdrawals/:reference", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.reference) ? req.params.reference[0] : req.params.reference;

  if (!raw) {
    res.status(400).json({ error: "Missing withdrawal reference" });
    return;
  }

  const upstream = await datamartFetch(`/v1/withdrawals/${encodeURIComponent(raw)}`);
  const data = await upstream.json();
  res.status(upstream.status).json(data);
});

export default router;
