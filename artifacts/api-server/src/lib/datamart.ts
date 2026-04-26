import { logger } from "./logger";

const DATAMART_BASE_URL = "https://api.datamartgh.shop/api/developer";

function getApiKey(): string {
  const key = process.env["DATAMART_API_KEY"];
  if (!key) {
    logger.warn("DATAMART_API_KEY is not set — DataMart requests will fail");
    return "";
  }
  return key;
}

export async function datamartFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const apiKey = getApiKey();
  const url = `${DATAMART_BASE_URL}${path}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-API-Key": apiKey,
    ...(options.headers as Record<string, string> | undefined),
  };

  // Add 15 second timeout to prevent hanging
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 9000);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      cache: "no-store",
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}
