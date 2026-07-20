export * from "../../../lib/gmgn/gmgnTypes";

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
  type:
    | "TOKEN_LAUNCH"
    | "COMMUNITY_REVIEW"
    | "PROFILE_UPDATED"
    | "TRENDING"
    | "TOP_HOLDER_INCREASE"
    | "LIQUIDITY_CHANGE";
  title: string;
  description: string;
  timestamp: number;
  tokenAddress?: string;
}
