import { z } from "zod";

// Base schema for GMGN API responses
export const GmgnResponseSchema = z.object({
  code: z.number(),
  data: z.unknown(),
});

// Token Common Schema
export const GmgnTokenCommonSchema = z.object({
  address: z.string(),
  symbol: z.string(),
  name: z.string(),
  logo: z.string().optional(),
});

// Wallet Common Data Schema
export const GmgnCommonWalletDataSchema = z.object({
  avatar: z.string().optional(),
  name: z.string().optional(),
  ens: z.string().optional(),
  tag: z.string().optional(),
  tags: z.array(z.string()).optional(),
  twitter_username: z.string().optional(),
  twitter_name: z.string().optional(),
  followers_count: z.number().optional(),
  is_blue_verified: z.boolean().optional(),
  follow_count: z.number().optional(),
  remark_count: z.number().optional(),
  created_token_count: z.number().optional(),
  created_at: z.number().optional(),
  fund_from: z.string().optional(),
  fund_from_address: z.string().optional(),
  fund_amount: z.string().optional(),
});

// Wallet Stats Schema
export const GmgnWalletStatsSchema = z.object({
  common: GmgnCommonWalletDataSchema.optional(),
  realized_profit: z.number(),
  unrealized_profit: z.number(),
  winrate: z.number(),
  total_cost: z.number(),
  buy_count: z.number(),
  sell_count: z.number(),
  pnl: z.number(),
});

// Created Token Schema
export const GmgnCreatedTokenSchema = z.object({
  token_address: z.string(),
  symbol: z.string(),
  name: z.string().optional(),
  chain: z.string(),
  create_timestamp: z.number(),
  is_open: z.boolean(),
  market_cap: z.string().optional(),
  token_ath_mc: z.string().optional(),
  liquidity: z.string().optional(),
  liquidity_usd: z.string().optional(),
  volume_24h: z.string().optional(),
  holder_count: z.number().optional(),
  price: z.number().optional(),
  logo: z.string().optional(),
});

// Creator ATH Info Schema
export const GmgnCreatorAthInfoSchema = z.object({
  creator: z.string(),
  ath_token: z.string(),
  ath_mc: z.string(),
  token_symbol: z.string(),
  token_name: z.string(),
  token_logo: z.string().optional(),
});

// Created Tokens Schema
export const GmgnCreatedTokensSchema = z.object({
  last_create_timestamp: z.number().optional(),
  inner_count: z.number(),
  open_count: z.number(),
  open_ratio: z.string(),
  creator_ath_info: GmgnCreatorAthInfoSchema.optional(),
  tokens: z.array(GmgnCreatedTokenSchema),
});

// Holding Token Schema
export const GmgnHoldingTokenSchema = z.object({
  address: z.string(),
  symbol: z.string(),
  name: z.string(),
  price: z.number(),
  logo: z.string().optional(),
});

// Holding Schema
export const GmgnHoldingSchema = z.object({
  token: GmgnHoldingTokenSchema,
  balance: z.number(),
  usd_value: z.number(),
  cost: z.number(),
  realized_profit: z.number(),
  unrealized_profit: z.number(),
  total_profit: z.number(),
  profit_change: z.number(),
  avg_cost: z.number(),
  buy_tx_count: z.number(),
  sell_tx_count: z.number(),
  last_active_timestamp: z.number(),
  history_bought_cost: z.number(),
  history_sold_income: z.number(),
});

// Wallet Holdings Schema
export const GmgnWalletHoldingsSchema = z.object({
  holdings: z.array(GmgnHoldingSchema),
  next: z.string().optional(),
});

// Activity Schema
export const GmgnActivitySchema = z.object({
  transaction_hash: z.string(),
  type: z.enum(["buy", "sell", "transferIn", "transferOut", "add", "remove"]),
  token: GmgnHoldingTokenSchema,
  token_amount: z.number(),
  cost_usd: z.number(),
  price: z.number(),
  price_usd: z.number(),
  timestamp: z.number(),
});

// Wallet Activity Schema
export const GmgnWalletActivitySchema = z.object({
  activities: z.array(GmgnActivitySchema),
  next: z.string().optional(),
});

// Token Info Schema
export const GmgnTokenInfoSchema = z.object({
  address: z.string(),
  name: z.string(),
  symbol: z.string(),
  logo: z.string().optional(),
  price: z.number(),
  market_cap: z.number(),
  holder_count: z.number(),
  volume_24h: z.number(),
  price_change_24h: z.number(),
  price_change_1h: z.number(),
  price_change_5m: z.number(),
  created_at: z.number().optional(),
  social_links: z.object({
    twitter: z.string().optional(),
    telegram: z.string().optional(),
    website: z.string().optional(),
  }).optional(),
});

// Token Security Schema
export const GmgnTokenSecuritySchema = z.object({
  is_open_source: z.boolean(),
  is_honeypot: z.boolean(),
  is_mintable: z.boolean(),
  is_proxy: z.boolean(),
  buy_tax: z.number(),
  sell_tax: z.number(),
  renounced_mint: z.boolean(),
  renounced_owner: z.boolean(),
  rug_score: z.number(),
});

// Token Pool Schema
export const GmgnTokenPoolSchema = z.object({
  pool_address: z.string(),
  liquidity: z.number(),
  liquidity_usd: z.number(),
  dex: z.string(),
  is_on_curve: z.boolean(),
});
