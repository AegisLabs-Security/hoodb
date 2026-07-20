// Robinhood Chain / Blockscout shared types & helpers (client-safe).

export const RHC_EXPLORER = "https://robinhoodchain.blockscout.com";
export const RHC_API = "https://robinhoodchain.blockscout.com/api/v2";
export const RHC_CHAIN_NAME = "Robinhood Chain";

export function shortAddr(a: string): string {
  if (!a) return "";
  return a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a;
}

export function isValidAddress(a: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(a.trim());
}

export function normalizeAddress(a: string): string {
  return a.trim().toLowerCase();
}

export function explorerAddr(a: string): string {
  return `${RHC_EXPLORER}/address/${a}`;
}
export function explorerTx(hash: string): string {
  return `${RHC_EXPLORER}/tx/${hash}`;
}
export function explorerToken(a: string): string {
  return `${RHC_EXPLORER}/token/${a}`;
}

export function timeAgo(iso: string | number | Date): string {
  const d = typeof iso === "string" || typeof iso === "number" ? new Date(iso) : iso;
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)}d ago`;
  return d.toISOString().slice(0, 10);
}

export function formatWei(wei: string | null | undefined, decimals = 18, precision = 4): string {
  if (!wei) return "0";
  try {
    const bi = BigInt(wei);
    const base = 10n ** BigInt(decimals);
    const whole = bi / base;
    const frac = bi % base;
    if (frac === 0n) return whole.toString();
    const fracStr = frac.toString().padStart(decimals, "0").slice(0, precision).replace(/0+$/, "");
    return fracStr ? `${whole}.${fracStr}` : whole.toString();
  } catch {
    return "0";
  }
}

export type DevOverview = {
  address: string;
  isContract: boolean;
  balance: string; // ETH decimal string
  txCount: number;
  firstSeenAt: string | null;
  contractsDeployedCount: number;
  tokensCreatedCount: number;
  verifiedContractsCount: number;
  successRate: number; // 0-100
};

export type ChainTx = {
  hash: string;
  timestamp: string;
  method: string | null;
  from: string;
  to: string | null;
  status: "success" | "error" | "pending";
  value: string;
  createdContract: string | null;
};

export type DeployedContract = {
  address: string;
  name: string | null;
  verified: boolean;
  deployedAt: string;
  txHash: string;
  isToken: boolean;
  tokenSymbol?: string | null;
};

export type ReputationBreakdown = {
  score: number; // 0-5
  parts: {
    label: string;
    weight: number;
    value: number; // 0-5
    detail: string;
  }[];
};

export type ReviewWithProfile = {
  id: string;
  dev_address: string;
  author_id: string;
  rating: number;
  content: string;
  created_at: string;
  x_handle: string | null;
  x_name: string | null;
  x_avatar_url: string | null;
  x_verified: boolean;
};

export function computeReputation(
  o: DevOverview,
  ratingAvg: number | null,
  reviewCount: number,
): ReputationBreakdown {
  const ageDays = o.firstSeenAt
    ? Math.max(0, (Date.now() - new Date(o.firstSeenAt).getTime()) / 86400000)
    : 0;
  const ageScore = Math.min(5, ageDays / 30); // 5 stars at ~150 days
  const deployScore = Math.min(5, o.contractsDeployedCount * 0.5);
  const verifyRatio =
    o.contractsDeployedCount > 0
      ? o.verifiedContractsCount / o.contractsDeployedCount
      : 0;
  const verifyScore = verifyRatio * 5;
  const successScore = (o.successRate / 100) * 5;
  const communityScore = ratingAvg ?? 0;

  const parts = [
    { label: "Wallet age", weight: 0.15, value: ageScore, detail: `${Math.floor(ageDays)} days on-chain` },
    { label: "Deploy activity", weight: 0.2, value: deployScore, detail: `${o.contractsDeployedCount} contracts` },
    { label: "Contract verification", weight: 0.2, value: verifyScore, detail: `${o.verifiedContractsCount}/${o.contractsDeployedCount} verified on Blockscout` },
    { label: "TX success rate", weight: 0.15, value: successScore, detail: `${o.successRate}% successful txs` },
    {
      label: "Community rating",
      weight: 0.3,
      value: communityScore,
      detail: reviewCount ? `${ratingAvg?.toFixed(1)} avg from ${reviewCount} reviews` : "No reviews yet",
    },
  ];

  const score = parts.reduce((s, p) => s + p.value * p.weight, 0);
  return { score, parts };
}
