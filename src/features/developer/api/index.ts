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
  GmgnResult,
} from "../types";
import {
  getGmgnWalletStats,
  getGmgnCreatedTokens,
  getGmgnWalletHoldings,
  getGmgnWalletActivity,
  getGmgnTokenInfo,
  getGmgnTokenSecurity,
  getGmgnTokenPool,
} from "../../../lib/gmgn/gmgnClient";
import { gmgnLogger } from "../../../lib/gmgn/gmgnLogger";

const addrSchema = z.object({ address: z.string().min(1) });

export const getGmgnWalletStatsFn = createServerFn({ method: "GET" })
  .validator((d: { address: string }) => addrSchema.parse(d))
  .handler(async ({ data }): Promise<GmgnResult<GmgnWalletStats>> => {
    gmgnLogger.info("getGmgnWalletStats called for:", data.address);
    return getGmgnWalletStats(data.address);
  });

export const getGmgnCreatedTokensFn = createServerFn({ method: "GET" })
  .validator((d: { address: string }) => addrSchema.parse(d))
  .handler(async ({ data }): Promise<GmgnResult<GmgnCreatedTokens>> => {
    gmgnLogger.info("getGmgnCreatedTokens called for:", data.address);
    return getGmgnCreatedTokens(data.address);
  });

export const getGmgnWalletHoldingsFn = createServerFn({ method: "GET" })
  .validator((d: { address: string }) => addrSchema.parse(d))
  .handler(async ({ data }): Promise<GmgnResult<GmgnWalletHoldings>> => {
    gmgnLogger.info("getGmgnWalletHoldings called for:", data.address);
    return getGmgnWalletHoldings(data.address);
  });

export const getGmgnWalletActivityFn = createServerFn({ method: "GET" })
  .validator((d: { address: string }) => addrSchema.parse(d))
  .handler(async ({ data }): Promise<GmgnResult<GmgnWalletActivity>> => {
    gmgnLogger.info("getGmgnWalletActivity called for:", data.address);
    return getGmgnWalletActivity(data.address);
  });

export const getGmgnTokenInfoFn = createServerFn({ method: "GET" })
  .validator((d: { address: string }) => addrSchema.parse(d))
  .handler(async ({ data }): Promise<GmgnResult<GmgnTokenInfo>> => {
    gmgnLogger.info("getGmgnTokenInfo called for:", data.address);
    return getGmgnTokenInfo(data.address);
  });

export const getGmgnTokenSecurityFn = createServerFn({ method: "GET" })
  .validator((d: { address: string }) => addrSchema.parse(d))
  .handler(async ({ data }): Promise<GmgnResult<GmgnTokenSecurity>> => {
    gmgnLogger.info("getGmgnTokenSecurity called for:", data.address);
    return getGmgnTokenSecurity(data.address);
  });

export const getGmgnTokenPoolFn = createServerFn({ method: "GET" })
  .validator((d: { address: string }) => addrSchema.parse(d))
  .handler(async ({ data }): Promise<GmgnResult<GmgnTokenPool>> => {
    gmgnLogger.info("getGmgnTokenPool called for:", data.address);
    return getGmgnTokenPool(data.address);
  });

// Re-export from original files to maintain compatibility
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
