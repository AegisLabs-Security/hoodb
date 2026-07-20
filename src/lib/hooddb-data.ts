export type Review = {
  id: string;
  author: string;
  rating: number; // 1..5
  content: string;
  createdAt: string;
};

export type Launch = {
  id: string;
  name: string;
  symbol: string;
  deployedAt: string;
  status: "live" | "rugged" | "graduated" | "bonding";
  peakMcap: string;
  chain: "Robinhood Chain";
};

export type Dev = {
  address: string;
  handle: string;
  reputation: number | null; // 0..5
  reviewCount: number;
  launches: number;
  successRate: number; // %
  totalVolume: string;
  firstSeen: string;
  bio: string;
  tags: Array<"verified" | "hot" | "flagged" | "new">;
  recent: Launch[];
  reviews: Review[];
};

export const shortAddr = (a: string) =>
  a.length > 10 ? `${a.slice(0, 4)}…${a.slice(-4)}` : a;

const now = Date.now();
const ago = (mins: number) =>
  new Date(now - mins * 60_000).toISOString();

export const devs: Dev[] = [
  {
    address: "HDBx7kY2wLm9pQ4rTnJ8vB1zXc3aN6sE0uYqRfP2Kd5H",
    handle: "hooded_prime",
    reputation: 4.6,
    reviewCount: 42,
    launches: 18,
    successRate: 72,
    totalVolume: "$2.4M",
    firstSeen: "2024-11-02",
    bio: "OG builder shipping utility-first tokens on Robinhood Chain. No rugs, no bundles.",
    tags: ["verified", "hot"],
    recent: [
      { id: "l1", name: "SHADOW", symbol: "SHDW", deployedAt: ago(2), status: "live", peakMcap: "$1.2M", chain: "Robinhood Chain" },
      { id: "l2", name: "Neon Grid", symbol: "GRID", deployedAt: ago(60 * 6), status: "graduated", peakMcap: "$820K", chain: "Robinhood Chain" },
      { id: "l3", name: "HoodPass", symbol: "HPASS", deployedAt: ago(60 * 30), status: "bonding", peakMcap: "$140K", chain: "Robinhood Chain" },
    ],
    reviews: [
      { id: "r1", author: "@degen_maxi", rating: 5, content: "Actually delivers. Locked LP, no team dumps. Rare energy.", createdAt: ago(120) },
      { id: "r2", author: "@onchain_owl", rating: 4, content: "Consistent shipper. Communication could be tighter but trust intact.", createdAt: ago(720) },
      { id: "r3", author: "@chartboi", rating: 5, content: "3 for 3 on my portfolio. Following every launch.", createdAt: ago(1440) },
    ],
  },
  {
    address: "RGx1pQmN7vT4kW9jL2bY5sC8dR6aE0fH3iZuXo9BvKcM",
    handle: "roguesignal",
    reputation: 2.1,
    reviewCount: 27,
    launches: 34,
    successRate: 22,
    totalVolume: "$680K",
    firstSeen: "2025-01-14",
    bio: "High-frequency launcher. Community flagged for insta-rug patterns.",
    tags: ["flagged"],
    recent: [
      { id: "l1", name: "MoonScam", symbol: "MSC", deployedAt: ago(15), status: "rugged", peakMcap: "$48K", chain: "Robinhood Chain" },
      { id: "l2", name: "FastCash", symbol: "FCX", deployedAt: ago(60 * 3), status: "rugged", peakMcap: "$22K", chain: "Robinhood Chain" },
    ],
    reviews: [
      { id: "r1", author: "@rugreport", rating: 1, content: "Bundled snipes on every launch. Avoid.", createdAt: ago(45) },
      { id: "r2", author: "@safehands", rating: 2, content: "Occasional runners but LP always pulled inside 24h.", createdAt: ago(300) },
    ],
  },
  {
    address: "VLd9kJ4mR7pB2xN5cQ8tY1sW6aE3fH0uZiXo2BvGnKpL",
    handle: "vaultkeeper",
    reputation: 3.8,
    reviewCount: 15,
    launches: 9,
    successRate: 55,
    totalVolume: "$310K",
    firstSeen: "2024-12-20",
    bio: "Mid-cap explorer. Focused on infra tokens and staking utilities.",
    tags: ["verified"],
    recent: [
      { id: "l1", name: "VaultCore", symbol: "VLT", deployedAt: ago(60 * 12), status: "live", peakMcap: "$410K", chain: "Robinhood Chain" },
      { id: "l2", name: "StakeHood", symbol: "STHD", deployedAt: ago(60 * 48), status: "bonding", peakMcap: "$95K", chain: "Robinhood Chain" },
    ],
    reviews: [
      { id: "r1", author: "@yield_ape", rating: 4, content: "Solid tokenomics, actual staking utility. Respect.", createdAt: ago(200) },
    ],
  },
  {
    address: "NWa3bC7dE1fG5hJ9kL2mN4pQ6rS8tU0vW1xY2zA3bCdE",
    handle: "newhoodie",
    reputation: null,
    reviewCount: 0,
    launches: 2,
    successRate: 50,
    totalVolume: "$18K",
    firstSeen: "2026-07-10",
    bio: "Fresh wallet. No reputation established yet.",
    tags: ["new"],
    recent: [
      { id: "l1", name: "FirstDrop", symbol: "FDR", deployedAt: ago(60 * 24 * 3), status: "bonding", peakMcap: "$18K", chain: "Robinhood Chain" },
    ],
    reviews: [],
  },
  {
    address: "KZp2mR8qT4vW7xY1nB5cD9eF3gH6jK0lM4pN7qR2sT5u",
    handle: "kozmik",
    reputation: 4.2,
    reviewCount: 31,
    launches: 12,
    successRate: 66,
    totalVolume: "$1.1M",
    firstSeen: "2024-10-08",
    bio: "Meme-fluent builder. Ships fast, communicates faster.",
    tags: ["hot"],
    recent: [
      { id: "l1", name: "PXLHOOD", symbol: "PXL", deployedAt: ago(60 * 2), status: "live", peakMcap: "$520K", chain: "Robinhood Chain" },
      { id: "l2", name: "GhostRun", symbol: "GHST", deployedAt: ago(60 * 20), status: "graduated", peakMcap: "$310K", chain: "Robinhood Chain" },
    ],
    reviews: [
      { id: "r1", author: "@meme_scout", rating: 5, content: "Best comms in the space. Delivers what he says.", createdAt: ago(500) },
    ],
  },
  {
    address: "PHt5vN9mQ2rL7xC4bY8kJ1sW3dE6aF0zH2iUoXBvGnKp",
    handle: "phantomhood",
    reputation: 3.4,
    reviewCount: 11,
    launches: 7,
    successRate: 43,
    totalVolume: "$220K",
    firstSeen: "2025-03-11",
    bio: "Occasional launches. Mixed track record but transparent.",
    tags: [],
    recent: [
      { id: "l1", name: "GhostLP", symbol: "GLP", deployedAt: ago(60 * 8), status: "bonding", peakMcap: "$62K", chain: "Robinhood Chain" },
    ],
    reviews: [],
  },
];

export const activityFeed = [
  { icon: "deploy", label: "Contract deployed by @hooded_prime", meta: "SHDW", time: "2m ago" },
  { icon: "launch", label: "New token launched by @kozmik", meta: "PXL", time: "5m ago" },
  { icon: "liquidity", label: "Liquidity added on GRID", meta: "+$42K", time: "12m ago" },
  { icon: "verified", label: "Contract verified by @vaultkeeper", meta: "VLT", time: "25m ago" },
  { icon: "review", label: "Review posted for @roguesignal", meta: "★ 1.0", time: "38m ago" },
  { icon: "deploy", label: "Contract deployed by @phantomhood", meta: "GLP", time: "1h ago" },
  { icon: "launch", label: "New token launched by @hooded_prime", meta: "HPASS", time: "2h ago" },
  { icon: "review", label: "Review posted for @kozmik", meta: "★ 5.0", time: "3h ago" },
];

export const stats = {
  devs: 3_842,
  launches: 12_704,
  reviews: 8_921,
  volume: "$48.6M",
};

export function findDev(address: string): Dev | undefined {
  const q = address.toLowerCase();
  return devs.find(
    (d) => d.address.toLowerCase() === q || d.handle.toLowerCase() === q,
  );
}
