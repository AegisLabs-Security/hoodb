import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { isValidAddress, normalizeAddress } from "./rhc";

const DEXSCREENER_API = "https://api.dexscreener.com";
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 2;
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
const MAX_PROFILE_CANDIDATES = 90;

const dexLinkSchema = z.object({
  label: z.string().optional(),
  type: z.string().optional(),
  url: z.string().url(),
});

const tokenProfileSchema = z.object({
  chainId: z.string(),
  tokenAddress: z.string(),
  icon: z.string().url().optional(),
  header: z.string().url().nullable().optional(),
  description: z.string().nullable().optional(),
  links: z.array(dexLinkSchema).nullable().optional(),
  updatedAt: z.string().optional(),
});

const txCountSchema = z.object({
  buys: z.number().int().nonnegative().optional(),
  sells: z.number().int().nonnegative().optional(),
});

const pairSchema = z.object({
  chainId: z.string(),
  dexId: z.string(),
  url: z.string().url(),
  pairAddress: z.string(),
  labels: z.array(z.string()).optional(),
  baseToken: z.object({
    address: z.string(),
    name: z.string(),
    symbol: z.string(),
  }),
  quoteToken: z.object({
    address: z.string(),
    name: z.string(),
    symbol: z.string(),
  }),
  priceUsd: z.string().nullable().optional(),
  txns: z
    .object({
      h1: txCountSchema.optional(),
      h24: txCountSchema.optional(),
    })
    .optional(),
  volume: z
    .object({
      h1: z.number().nullable().optional(),
      h24: z.number().nullable().optional(),
    })
    .optional(),
  liquidity: z
    .object({
      usd: z.number().nullable().optional(),
    })
    .nullable()
    .optional(),
  fdv: z.number().nullable().optional(),
  marketCap: z.number().nullable().optional(),
  pairCreatedAt: z.number().int().nonnegative().optional(),
  info: z
    .object({
      imageUrl: z.string().url().optional(),
      header: z.string().url().optional(),
      websites: z.array(dexLinkSchema).optional(),
      socials: z.array(dexLinkSchema).optional(),
    })
    .optional(),
});

const tokenProfilesSchema = z.array(tokenProfileSchema);
const pairsSchema = z.array(pairSchema);

type DexTokenProfile = z.infer<typeof tokenProfileSchema>;
type DexPair = z.infer<typeof pairSchema>;

export type RobinhoodNewPair = {
  pairAddress: string;
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  quoteSymbol: string;
  dexId: string;
  pairUrl: string;
  imageUrl: string | null;
  headerUrl: string | null;
  description: string | null;
  priceUsd: number | null;
  liquidityUsd: number | null;
  marketCapUsd: number | null;
  fdvUsd: number | null;
  volumeH1Usd: number | null;
  volumeH24Usd: number | null;
  buysH1: number;
  sellsH1: number;
  pairCreatedAt: number;
  ageLabel: string;
  profileUpdatedAt: string | null;
};

export type RobinhoodNewPairsResult =
  | {
      success: true;
      pairs: RobinhoodNewPair[];
      fetchedAt: string;
    }
  | {
      success: false;
      error: string;
      pairs: RobinhoodNewPair[];
      fetchedAt: string;
    };

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function formatAgeLabel(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  if (diffMs < 60_000) return "just now";
  const diffMinutes = Math.floor(diffMs / 60_000);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return new Date(timestamp).toISOString().slice(0, 10);
}

function parseTimestamp(value: string | undefined): number {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

async function fetchDexscreener<T>(
  path: string,
  schema: z.ZodSchema<T>,
  attempt = 0,
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${DEXSCREENER_API}${path}`, {
      headers: { accept: "application/json" },
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      if (attempt < MAX_RETRIES && RETRYABLE_STATUS.has(res.status)) {
        await wait(400 * 2 ** attempt);
        return fetchDexscreener(path, schema, attempt + 1);
      }
      throw new Error(
        `DexScreener ${res.status} on ${path}: ${body.slice(0, 200) || res.statusText}`,
      );
    }

    const json: unknown = await res.json();
    return schema.parse(json);
  } catch (error) {
    const shouldRetry =
      attempt < MAX_RETRIES &&
      error instanceof Error &&
      (error.name === "AbortError" || error instanceof TypeError);

    if (shouldRetry) {
      await wait(400 * 2 ** attempt);
      return fetchDexscreener(path, schema, attempt + 1);
    }

    throw error instanceof Error ? error : new Error("Unknown DexScreener request failure");
  } finally {
    clearTimeout(timeoutId);
  }
}

function buildPair(profileMap: Map<string, DexTokenProfile>, pair: DexPair): RobinhoodNewPair | null {
  const createdAt = pair.pairCreatedAt;
  if (!createdAt) return null;

  const profile = profileMap.get(normalizeAddress(pair.baseToken.address));
  const imageUrl = pair.info?.imageUrl ?? profile?.icon ?? null;
  const headerUrl = pair.info?.header ?? profile?.header ?? null;

  return {
    pairAddress: pair.pairAddress,
    tokenAddress: pair.baseToken.address,
    tokenName: pair.baseToken.name,
    tokenSymbol: pair.baseToken.symbol,
    quoteSymbol: pair.quoteToken.symbol,
    dexId: pair.dexId,
    pairUrl: pair.url,
    imageUrl,
    headerUrl,
    description: profile?.description ?? null,
    priceUsd: pair.priceUsd ? Number(pair.priceUsd) : null,
    liquidityUsd: pair.liquidity?.usd ?? null,
    marketCapUsd: pair.marketCap ?? null,
    fdvUsd: pair.fdv ?? null,
    volumeH1Usd: pair.volume?.h1 ?? null,
    volumeH24Usd: pair.volume?.h24 ?? null,
    buysH1: pair.txns?.h1?.buys ?? 0,
    sellsH1: pair.txns?.h1?.sells ?? 0,
    pairCreatedAt: createdAt,
    ageLabel: formatAgeLabel(createdAt),
    profileUpdatedAt: profile?.updatedAt ?? null,
  };
}

async function getRobinhoodProfiles(): Promise<DexTokenProfile[]> {
  const [latestProfiles, recentProfiles] = await Promise.all([
    fetchDexscreener("/token-profiles/latest/v1", tokenProfilesSchema),
    fetchDexscreener("/token-profiles/recent-updates/v1", tokenProfilesSchema).catch(() => []),
  ]);

  const merged = new Map<string, DexTokenProfile>();
  const robinhoodProfiles = [...latestProfiles, ...recentProfiles]
    .filter((profile) => profile.chainId === "robinhood" && isValidAddress(profile.tokenAddress))
    .sort((left, right) => parseTimestamp(right.updatedAt) - parseTimestamp(left.updatedAt));

  for (const profile of robinhoodProfiles) {
    const key = normalizeAddress(profile.tokenAddress);
    const current = merged.get(key);
    if (!current || parseTimestamp(profile.updatedAt) > parseTimestamp(current.updatedAt)) {
      merged.set(key, profile);
    }
  }

  return Array.from(merged.values())
    .sort((left, right) => parseTimestamp(right.updatedAt) - parseTimestamp(left.updatedAt))
    .slice(0, MAX_PROFILE_CANDIDATES);
}

export const getRobinhoodNewPairs = createServerFn({ method: "GET" }).handler(
  async (): Promise<RobinhoodNewPairsResult> => {
    const fetchedAt = new Date().toISOString();

    try {
      const robinhoodProfiles = await getRobinhoodProfiles();

      const uniqueAddresses = Array.from(
        new Set(robinhoodProfiles.map((profile) => normalizeAddress(profile.tokenAddress))),
      );

      if (uniqueAddresses.length === 0) {
        return {
          success: false,
          error: "No live Robinhood pair data is available right now.",
          pairs: [],
          fetchedAt,
        };
      }

      const profileMap = new Map<string, DexTokenProfile>();
      for (const profile of robinhoodProfiles) {
        const key = normalizeAddress(profile.tokenAddress);
        if (!profileMap.has(key)) {
          profileMap.set(key, profile);
        }
      }

      const pairGroups = await Promise.all(
        chunk(uniqueAddresses, 30).map((addresses) =>
          fetchDexscreener(`/tokens/v1/robinhood/${addresses.join(",")}`, pairsSchema),
        ),
      );

      const seenPairs = new Set<string>();
      const pairs = pairGroups
        .flat()
        .filter((pair) => pair.chainId === "robinhood")
        .sort((left, right) => {
          const createdDiff = (right.pairCreatedAt ?? 0) - (left.pairCreatedAt ?? 0);
          if (createdDiff !== 0) return createdDiff;
          const updatedDiff =
            parseTimestamp(
              profileMap.get(normalizeAddress(right.baseToken.address))?.updatedAt,
            ) -
            parseTimestamp(
              profileMap.get(normalizeAddress(left.baseToken.address))?.updatedAt,
            );
          if (updatedDiff !== 0) return updatedDiff;
          return (right.liquidity?.usd ?? 0) - (left.liquidity?.usd ?? 0);
        })
        .map((pair) => buildPair(profileMap, pair))
        .filter((pair): pair is RobinhoodNewPair => {
          if (!pair) return false;
          const key = normalizeAddress(pair.pairAddress);
          if (seenPairs.has(key)) return false;
          seenPairs.add(key);
          return true;
        })
        .slice(0, 8);

      if (pairs.length === 0) {
        return {
          success: false,
          error: "No live Robinhood pair data is available right now.",
          pairs: [],
          fetchedAt,
        };
      }

      return { success: true, pairs, fetchedAt };
    } catch (error) {
      console.error("[getRobinhoodNewPairs]", error);
      return {
        success: false,
        error: "Live market discovery is temporarily unavailable.",
        pairs: [],
        fetchedAt,
      };
    }
  },
);
