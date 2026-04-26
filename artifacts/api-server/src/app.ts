import express, { type Express } from "express";
import cors from "cors";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use((req, res, next) => {
  // Strip Netlify function path prefix if present
  const netlifyPrefix = "/.netlify/functions/api";
  if (req.url.startsWith(netlifyPrefix)) {
    req.url = req.url.slice(netlifyPrefix.length) || "/";
  }

  // Enhanced logging for webhooks to debug "stuck at pending" issues
  if (req.url.toLowerCase().includes("webhook")) {
    logger.info({ 
      method: req.method, 
      url: req.url,
      headers: {
        "x-paystack-signature": req.headers["x-paystack-signature"] ? "PRESENT" : "MISSING",
        "content-type": req.headers["content-type"]
      },
      hasBody: !!req.body,
      bodyType: typeof req.body
    }, "Webhook Request Captured");
  }

  logger.info({ 
    method: req.method, 
    url: req.url?.split("?")[0],
    originalUrl: req.originalUrl 
  }, "Incoming Request");
  next();
});

app.use(cors());
app.use(express.json({
  verify: (req: any, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);
app.use("/", router);

export default app;
