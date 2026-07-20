// GMGN API Functions
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type {
  GmgnWalletStats,
  GmgnCreatedTokens,
  GmgnWalletHoldings,
  GmgnWalletActivity,
  GmgnTokenInfo,
  GmgnTokenSecurity,
  GmgnTokenPool,
} from "../types";

const GMGN_API_BASE = "https://gmgn.ai/api";

async function gmgnFetch<T>(
  endpoint: string,
  params?: Record<string, string | number>
): Promise<T> {
  const apiKey = process.env.GMGN_API_KEY;
  if (!apiKey) throw new Error("GMGN_API_KEY not set");

  const url = new URL(`${GMGN_API_BASE}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) =>
      url.searchParams.append(key, String(value))
    );
  }

  const res = await fetch(url.toString(), {
    headers: {
      accept: "application/json",
      "X-API-Key": apiKey,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `GMGN API error ${res.status} on ${endpoint}: ${text.slice(0, 200)}`
    );
  }

  return (await res.json()) as T;
}

const addrSchema = z.object({ address: z.string() });

export const getGmgnWalletStats = createServerFn({ method: "GET" })
  .validator((d: { address: string }) => addrSchema.parse(d))
  .handler(async ({ data }): Promise<GmgnWalletStats | null> => {
    try {
      const res = await gmgnFetch<{ code: number; data: GmgnWalletStats }>(
        "/v1/user/wallet_stats",
        {
          chain: "robinhood",
          wallet_address: data.address,
          period: "30d",
        }
      );
      return res.data;
    } catch (e) {
      console.error("[getGmgnWalletStats]", e);
      return null;
    }
  });

export const getGmgnCreatedTokens = createServerFn({ method: "GET" })
  .validator((d: { address: string }) => addrSchema.parse(d))
  .handler(async ({ data }): Promise<GmgnCreatedTokens | null> => {
    try {
      const res = await gmgnFetch<{ code: number; data: GmgnCreatedTokens }>(
        "/v1/user/created_tokens",
        {
          chain: "robinhood",
          wallet_address: data.address,
          order_by: "market_cap",
          direction: "desc",
        }
      );
      return res.data;
    } catch (e) {
      console.error("[getGmgnCreatedTokens]", e);
      return null;
    }
  });

export const getGmgnWalletHoldings = createServerFn({ method: "GET" })
  .validator((d: { address: string }) => addrSchema.parse(d))
  .handler(async ({ data }): Promise<GmgnWalletHoldings | null> => {
    try {
      const res = await gmgnFetch<{ code: number; data: GmgnWalletHoldings }>(
        "/v1/user/wallet_holdings",
        {
          chain: "robinhood",
          wallet_address: data.address,
          limit: 20,
        }
      );
      return res.data;
    } catch (e) {
      console.error("[getGmgnWalletHoldings]", e);
      return null;
    }
  });

export const getGmgnWalletActivity = createServerFn({ method: "GET" })
  .validator((d: { address: string }) => addrSchema.parse(d))
  .handler(async ({ data }): Promise<GmgnWalletActivity | null> => {
    try {
      const res = await gmgnFetch<{ code: number; data: GmgnWalletActivity }>(
        "/v1/user/wallet_activity",
        {
          chain: "robinhood",
          wallet_address: data.address,
          limit: 20,
        }
      );
      return res.data;
    } catch (e) {
      console.error("[getGmgnWalletActivity]", e);
      return null;
    }
  });

export const getGmgnTokenInfo = createServerFn({ method: "GET" })
  .validator((d: { address: string }) => addrSchema.parse(d))
  .handler(async ({ data }): Promise<GmgnTokenInfo | null> => {
    try {
      const res = await gmgnFetch<{ code: number; data: GmgnTokenInfo }>(
        "/v1/token/info",
        {
          chain: "robinhood",
          token_address: data.address,
        }
      );
      return res.data;
    } catch (e) {
      console.error("[getGmgnTokenInfo]", e);
      return null;
    }
  });

export const getGmgnTokenSecurity = createServerFn({ method: "GET" })
  .validator((d: { address: string }) => addrSchema.parse(d))
  .handler(async ({ data }): Promise<GmgnTokenSecurity | null> => {
    try {
      const res = await gmgnFetch<{ code: number; data: GmgnTokenSecurity }>(
        "/v1/token/security",
        {
          chain: "robinhood",
          token_address: data.address,
        }
      );
      return res.data;
    } catch (e) {
      console.error("[getGmgnTokenSecurity]", e);
      return null;
    }
  });

export const getGmgnTokenPool = createServerFn({ method: "GET" })
  .validator((d: { address: string }) => addrSchema.parse(d))
  .handler(async ({ data }): Promise<GmgnTokenPool | null> => {
    try {
      const res = await gmgnFetch<{ code: number; data: GmgnTokenPool }>(
        "/v1/token/pool",
        {
          chain: "robinhood",
          token_address: data.address,
        }
      );
      return res.data;
    } catch (e) {
      console.error("[getGmgnTokenPool]", e);
      return null;
    }
  });

// Re-export from original files for now to maintain compatibility
export {
  getDevOverview,
  getAddressTxs,
  getDeployedContracts,
} from "@/lib/rhc.functions";

export {
  listReviews,
  postReview,
  deleteMyReview,
  getMyProfile,
} from "@/lib/reviews.functions";
