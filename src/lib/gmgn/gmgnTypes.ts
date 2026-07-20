// Result type for GMGN API calls
export type GmgnResult<T> =
  | { success: true; data: T }
  | { success: false; error: GmgnError };

// Custom GMGN Error interface (serializable plain object)
export interface GmgnError {
  code: string;
  message: string;
  status?: number;
  endpoint?: string;
}

// Individual response types
export interface GmgnTokenCommon {
  address: string;
  symbol: string;
  name: string;
  logo?: string;
}

export interface GmgnCommonWalletData {
  avatar?: string;
  name?: string;
  ens?: string;
  tag?: string;
  tags?: string[];
  twitter_username?: string;
  twitter_name?: string;
  followers_count?: number;
  is_blue_verified?: boolean;
  follow_count?: number;
  remark_count?: number;
  created_token_count?: number;
  created_at?: number;
  fund_from?: string;
  fund_from_address?: string;
  fund_amount?: string;
}

export interface GmgnWalletStats {
  common?: GmgnCommonWalletData;
  realized_profit: number;
  unrealized_profit: number;
  winrate: number;
  total_cost: number;
  buy_count: number;
  sell_count: number;
  pnl: number;
}

export interface GmgnCreatedToken {
  token_address: string;
  symbol: string;
  name?: string;
  chain: string;
  create_timestamp: number;
  is_open: boolean;
  market_cap?: string;
  token_ath_mc?: string;
  liquidity?: string;
  liquidity_usd?: string;
  volume_24h?: string;
  holder_count?: number;
  price?: number;
  logo?: string;
}

export interface GmgnCreatorAthInfo {
  creator: string;
  ath_token: string;
  ath_mc: string;
  token_symbol: string;
  token_name: string;
  token_logo?: string;
}

export interface GmgnCreatedTokens {
  last_create_timestamp?: number;
  inner_count: number;
  open_count: number;
  open_ratio: string;
  creator_ath_info?: GmgnCreatorAthInfo;
  tokens: GmgnCreatedToken[];
}

export interface GmgnHoldingToken {
  address: string;
  symbol: string;
  name: string;
  price: number;
  logo?: string;
}

export interface GmgnHolding {
  token: GmgnHoldingToken;
  balance: number;
  usd_value: number;
  cost: number;
  realized_profit: number;
  unrealized_profit: number;
  total_profit: number;
  profit_change: number;
  avg_cost: number;
  buy_tx_count: number;
  sell_tx_count: number;
  last_active_timestamp: number;
  history_bought_cost: number;
  history_sold_income: number;
}

export interface GmgnWalletHoldings {
  holdings: GmgnHolding[];
  next?: string;
}

export interface GmgnActivity {
  transaction_hash: string;
  type: "buy" | "sell" | "transferIn" | "transferOut" | "add" | "remove";
  token: GmgnHoldingToken;
  token_amount: number;
  cost_usd: number;
  price: number;
  price_usd: number;
  timestamp: number;
}

export interface GmgnWalletActivity {
  activities: GmgnActivity[];
  next?: string;
}

export interface GmgnTokenInfo {
  address: string;
  name: string;
  symbol: string;
  logo?: string;
  price: number;
  market_cap: number;
  holder_count: number;
  volume_24h: number;
  price_change_24h: number;
  price_change_1h: number;
  price_change_5m: number;
  created_at?: number;
  social_links?: {
    twitter?: string;
    telegram?: string;
    website?: string;
  };
}

export interface GmgnTokenSecurity {
  is_open_source: boolean;
  is_honeypot: boolean;
  is_mintable: boolean;
  is_proxy: boolean;
  buy_tax: number;
  sell_tax: number;
  renounced_mint: boolean;
  renounced_owner: boolean;
  rug_score: number;
}

export interface GmgnTokenPool {
  pool_address: string;
  liquidity: number;
  liquidity_usd: number;
  dex: string;
  is_on_curve: boolean;
}
