import { z } from "zod";
import type { GmgnError, GmgnResult } from "./gmgnTypes";
import {
  GmgnResponseSchema,
  GmgnWalletStatsSchema,
  GmgnCreatedTokensSchema,
  GmgnWalletHoldingsSchema,
  GmgnWalletActivitySchema,
  GmgnTokenInfoSchema,
  GmgnTokenSecuritySchema,
  GmgnTokenPoolSchema,
} from "./gmgnSchemas";
import { gmgnLogger } from "./gmgnLogger";
import type {
  GmgnWalletStats,
  GmgnCreatedTokens,
  GmgnWalletHoldings,
  GmgnWalletActivity,
  GmgnTokenInfo,
  GmgnTokenSecurity,
  GmgnTokenPool,
} from "./gmgnTypes";

const GMGN_API_BASE = "https://gmgn.ai/api";
const GMGN_CHAIN = (process.env.GMGN_CHAIN ?? "robinhood").toLowerCase();
const GMGN_SUPPORTED_CHAINS = new Set([
  "sol",
  "bsc",
  "base",
  "eth",
  "monad",
  "tron",
]);
const TIMEOUT_MS = 15000;
const MAX_RETRIES = 3;
const PROVIDER_COOLDOWN_MS = 5 * 60 * 1000;

let providerBlockedUntil = 0;
let providerBlockedReason = "";

// Utility: Sleep function for retries
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper to create GmgnError object
const createGmgnError = (params: {
  code: string;
  message: string;
  status?: number;
  endpoint?: string;
}): GmgnError => ({
  code: params.code,
  message: params.message,
  status: params.status,
  endpoint: params.endpoint,
});

const isCloudflareBlockResponse = (status: number, bodyText: string) =>
  status === 403 &&
  (bodyText.includes("Attention Required! | Cloudflare") ||
    bodyText.includes("Sorry, you have been blocked"));

const getUnavailableError = (endpoint: string): GmgnError => {
  if (!GMGN_SUPPORTED_CHAINS.has(GMGN_CHAIN)) {
    return createGmgnError({
      code: "UNSUPPORTED_CHAIN",
      message: `GMGN HTTP integration is not enabled for chain "${GMGN_CHAIN}".`,
      endpoint,
    });
  }

  if (Date.now() < providerBlockedUntil && providerBlockedReason) {
    return createGmgnError({
      code: "PROVIDER_UNAVAILABLE",
      message: providerBlockedReason,
      endpoint,
    });
  }

  return createGmgnError({
    code: "PROVIDER_UNAVAILABLE",
    message: "GMGN is temporarily unavailable.",
    endpoint,
  });
};

// Main fetch function (with retry, timeout) that returns Result type
async function gmgnFetchRaw(
  endpoint: string,
  params?: Record<string, string | number>,
  options: { attempt: number } = { attempt: 0 }
): Promise<GmgnResult<unknown>> {
  const startTime = Date.now();
  const apiKey = process.env.GMGN_API_KEY;

  if (!GMGN_SUPPORTED_CHAINS.has(GMGN_CHAIN)) {
    return { success: false, error: getUnavailableError(endpoint) };
  }

  if (Date.now() < providerBlockedUntil && providerBlockedReason) {
    gmgnLogger.info("Skipping GMGN request during provider cooldown:", {
      endpoint,
      chain: GMGN_CHAIN,
      retryAt: new Date(providerBlockedUntil).toISOString(),
    });
    return { success: false, error: getUnavailableError(endpoint) };
  }

  if (!apiKey) {
    const error = createGmgnError({
      code: "MISSING_API_KEY",
      message: "GMGN_API_KEY is not set in environment variables",
      endpoint,
    });
    gmgnLogger.error("GMGN Fetch Error:", error);
    return { success: false, error };
  }

  const url = new URL(`${GMGN_API_BASE}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, String(value));
    });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  gmgnLogger.debug("Calling GMGN API:", {
    url: url.toString(),
    method: "GET",
    attempt: options.attempt,
  });

  try {
    const res = await fetch(url.toString(), {
      headers: {
        accept: "application/json",
        "X-API-Key": apiKey,
      },
      signal: controller.signal,
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Log all response details
    const responseHeaders: Record<string, string> = {};
    res.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    let bodyText = "";
    // Clone response to read body without consuming the stream
    const clonedRes = res.clone();
    try {
      bodyText = await clonedRes.text();
    } catch (e) {
      bodyText = "(failed to read body)";
    }

    gmgnLogger.debug("GMGN API full response:", {
      url: url.toString(),
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
      body: bodyText,
      duration: `${duration}ms`,
    });

    // Check response status
    if (!res.ok) {
      if (isCloudflareBlockResponse(res.status, bodyText)) {
        providerBlockedUntil = Date.now() + PROVIDER_COOLDOWN_MS;
        providerBlockedReason =
          "GMGN upstream is blocked by Cloudflare for direct HTTP access. Data is temporarily unavailable.";
        gmgnLogger.warn("GMGN provider blocked direct HTTP access:", {
          endpoint,
          chain: GMGN_CHAIN,
          status: res.status,
          retryAt: new Date(providerBlockedUntil).toISOString(),
        });
        return {
          success: false,
          error: getUnavailableError(endpoint),
        };
      }

      gmgnLogger.error("GMGN API error response:", {
        status: res.status,
        statusText: res.statusText,
        headers: responseHeaders,
        body: bodyText,
      });

      // Check if retryable
      const isRetryable =
        res.status === 429 || (res.status >= 500 && res.status < 600);

      if (isRetryable && options.attempt < MAX_RETRIES - 1) {
        const waitMs = Math.pow(2, options.attempt) * 1000;
        gmgnLogger.info(
          `Retrying GMGN API (attempt ${options.attempt + 2}) after ${waitMs}ms`
        );
        await sleep(waitMs);
        return gmgnFetchRaw(endpoint, params, { attempt: options.attempt + 1 });
      }

      const error = createGmgnError({
        code: `HTTP_${res.status}`,
        message: `GMGN API error ${res.status}: ${res.statusText}`,
        status: res.status,
        endpoint,
      });
      return { success: false, error };
    }

    gmgnLogger.debug("GMGN API raw response body:", bodyText);

    try {
      const json = JSON.parse(bodyText);
      gmgnLogger.debug("GMGN API parsed response:", json);
      return { success: true, data: json };
    } catch (parseError) {
      gmgnLogger.error("GMGN JSON parse error:", parseError);
      const error = createGmgnError({
        code: "INVALID_JSON",
        message: "Failed to parse GMGN API response JSON",
        endpoint,
      });
      return { success: false, error };
    }
  } catch (e) {
    if (e instanceof Error) {
      if (e.name === "AbortError") {
        const error = createGmgnError({
          code: "TIMEOUT",
          message: "GMGN API request timed out after 15 seconds",
          endpoint,
        });
        gmgnLogger.error("GMGN Timeout Error:", error);
        return { success: false, error };
      }

      if (
        e.name === "TypeError" &&
        (e.message.toLowerCase().includes("network") ||
          e.message.toLowerCase().includes("fetch"))
      ) {
        if (options.attempt < MAX_RETRIES - 1) {
          const waitMs = Math.pow(2, options.attempt) * 1000;
          gmgnLogger.info(
            `Retrying GMGN API (attempt ${options.attempt + 2}) after ${waitMs}ms`
          );
          await sleep(waitMs);
          return gmgnFetchRaw(endpoint, params, { attempt: options.attempt + 1 });
        }
        const error = createGmgnError({
          code: "NETWORK_ERROR",
          message: "Failed to connect to GMGN API",
          endpoint,
        });
        gmgnLogger.error("GMGN Network Error:", error);
        return { success: false, error };
      }

      const error = createGmgnError({
        code: "UNKNOWN",
        message: e.message,
        endpoint,
      });
      gmgnLogger.error("GMGN Unknown Error:", error);
      return { success: false, error };
    }

    // Fallback if not an Error object
    const error = createGmgnError({
      code: "UNKNOWN",
      message: "An unknown error occurred during GMGN API call",
      endpoint,
    });
    gmgnLogger.error("GMGN Unknown Non-Error:", e);
    return { success: false, error };
  } finally {
    clearTimeout(timeoutId);
  }
}

// Helper: validate response against schema and return Result type
async function gmgnFetchValidated<T>(
  endpoint: string,
  params: Record<string, string | number>,
  schema: z.ZodSchema<T>
): Promise<GmgnResult<T>> {
  const rawResult = await gmgnFetchRaw(endpoint, params);

  if (!rawResult.success) {
    return rawResult;
  }

  const parsedResponse = GmgnResponseSchema.safeParse(rawResult.data);
  if (!parsedResponse.success) {
    gmgnLogger.error(
      "GMGN API response validation failed (base):",
      parsedResponse.error
    );
    const error = createGmgnError({
      code: "INVALID_RESPONSE",
      message: "Invalid GMGN API base response format",
      endpoint,
    });
    return { success: false, error };
  }

  // Check if API returned non-zero code
  if (parsedResponse.data.code && parsedResponse.data.code !== 0) {
    gmgnLogger.error(
      "GMGN API returned non-zero code:",
      parsedResponse.data.code
    );
    const error = createGmgnError({
      code: `API_${parsedResponse.data.code}`,
      message: `GMGN API returned error code ${parsedResponse.data.code}`,
      endpoint,
    });
    return { success: false, error };
  }

  const parsedData = schema.safeParse(parsedResponse.data.data);
  if (!parsedData.success) {
    gmgnLogger.error(
      "GMGN API data validation failed:",
      parsedData.error
    );
    const error = createGmgnError({
      code: "INVALID_DATA",
      message: "GMGN API data failed validation",
      endpoint,
    });
    return { success: false, error };
  }

  gmgnLogger.debug("GMGN API validated successfully!");
  return { success: true, data: parsedData.data };
}

// --- API Functions ---
export async function getGmgnWalletStats(walletAddress: string): Promise<GmgnResult<GmgnWalletStats>> {
  return gmgnFetchValidated(
    "/v1/user/wallet_stats",
    { chain: GMGN_CHAIN, wallet_address: walletAddress.toLowerCase(), period: "30d" },
    GmgnWalletStatsSchema
  );
}

export async function getGmgnCreatedTokens(walletAddress: string): Promise<GmgnResult<GmgnCreatedTokens>> {
  return gmgnFetchValidated(
    "/v1/user/created_tokens",
    { chain: GMGN_CHAIN, wallet_address: walletAddress.toLowerCase(), order_by: "market_cap", direction: "desc" },
    GmgnCreatedTokensSchema
  );
}

export async function getGmgnWalletHoldings(walletAddress: string): Promise<GmgnResult<GmgnWalletHoldings>> {
  return gmgnFetchValidated(
    "/v1/user/wallet_holdings",
    { chain: GMGN_CHAIN, wallet_address: walletAddress.toLowerCase(), limit: 20 },
    GmgnWalletHoldingsSchema
  );
}

export async function getGmgnWalletActivity(walletAddress: string): Promise<GmgnResult<GmgnWalletActivity>> {
  return gmgnFetchValidated(
    "/v1/user/wallet_activity",
    { chain: GMGN_CHAIN, wallet_address: walletAddress.toLowerCase(), limit: 20 },
    GmgnWalletActivitySchema
  );
}

export async function getGmgnTokenInfo(tokenAddress: string): Promise<GmgnResult<GmgnTokenInfo>> {
  return gmgnFetchValidated(
    "/v1/token/info",
    { chain: GMGN_CHAIN, token_address: tokenAddress.toLowerCase() },
    GmgnTokenInfoSchema
  );
}

export async function getGmgnTokenSecurity(tokenAddress: string): Promise<GmgnResult<GmgnTokenSecurity>> {
  return gmgnFetchValidated(
    "/v1/token/security",
    { chain: GMGN_CHAIN, token_address: tokenAddress.toLowerCase() },
    GmgnTokenSecuritySchema
  );
}

export async function getGmgnTokenPool(tokenAddress: string): Promise<GmgnResult<GmgnTokenPool>> {
  return gmgnFetchValidated(
    "/v1/token/pool",
    { chain: GMGN_CHAIN, token_address: tokenAddress.toLowerCase() },
    GmgnTokenPoolSchema
  );
}
