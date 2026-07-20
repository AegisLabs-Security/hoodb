export interface GmgnToken {
  address: string;
  name: string;
  symbol: string;
  logo?: string;
  launchDate: number;
  currentMarketCap: number;
  athMarketCap: number;
  liquidity: number;
  volume24h: number;
  holders: number;
  currentPrice: number;
  status: "LIVE" | "DEAD" | "GRADUATED";
}

export interface GmgnDeveloperProfile {
  walletAddress: string;
  name: string;
  avatar?: string;
  trustScore: number;
  walletAge: number; // days
  tokensLaunched: number;
  activeTokens: number;
  graduatedTokens: number;
  communityReviews: number;
  averageRating: number;
  highestMarketCap: number;
  averageAth: number;
  currentPortfolioValue: number;
  totalTradingVolume: number;
  tokens: GmgnToken[];
  reputationBreakdown: {
    launchSuccess: number;
    communityRating: number;
    walletActivity: number;
    holderQuality: number;
    volumeStability: number;
    walletAge: number;
    communityEngagement: number;
  };
}

export interface Review {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorXHandle?: string;
  authorVerified: boolean;
  rating: number;
  content: string;
  helpfulCount: number;
  createdAt: number;
}

export interface ActivityEvent {
  id: string;
  type: "TOKEN_LAUNCH" | "COMMUNITY_REVIEW" | "PROFILE_UPDATED" | "TRENDING" | "TOP_HOLDER_INCREASE" | "LIQUIDITY_CHANGE";
  title: string;
  description: string;
  timestamp: number;
  tokenAddress?: string;
}
