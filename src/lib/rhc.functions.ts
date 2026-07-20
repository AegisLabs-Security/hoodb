// Server functions that fetch live data from Blockscout (Robinhood Chain).
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  RHC_API,
  isValidAddress,
  normalizeAddress,
  formatWei,
  type ChainTx,
  type DeployedContract,
  type DevOverview,
} from "./rhc";

async function bs<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${RHC_API}${path}`, {
    ...init,
    headers: { accept: "application/json", ...(init?.headers || {}) },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Blockscout ${res.status} on ${path}: ${body.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

const addrSchema = z.object({ address: z.string().refine(isValidAddress, "Invalid EVM address") });

/* ---------- Global stats ---------- */
export const getGlobalStats = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const s = await bs<{
      total_transactions?: string;
      total_addresses?: string;
      total_blocks?: string;
      average_block_time?: number;
      coin_price?: string;
    }>("/stats");
    return {
      totalTxs: s.total_transactions ? Number(s.total_transactions) : null,
      totalAddresses: s.total_addresses ? Number(s.total_addresses) : null,
      totalBlocks: s.total_blocks ? Number(s.total_blocks) : null,
      avgBlockTime: s.average_block_time ?? null,
      coinPrice: s.coin_price ?? null,
    };
  } catch (e) {
    console.error("[getGlobalStats]", e);
    return {
      totalTxs: null,
      totalAddresses: null,
      totalBlocks: null,
      avgBlockTime: null,
      coinPrice: null,
    };
  }
});

/* ---------- Latest network activity (ticker) ---------- */
export const getLatestNetworkTxs = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const j = await bs<{ items?: any[] } | any[]>("/main-page/transactions");
    const items = Array.isArray(j) ? j : j.items ?? [];
    return items.slice(0, 20).map((t: any) => ({
      hash: t.hash,
      timestamp: t.timestamp,
      method: t.method ?? null,
      from: t.from?.hash ?? "",
      to: t.to?.hash ?? null,
      status: (t.status === "ok" || t.result === "success" ? "success" : t.result === "pending" ? "pending" : "error") as ChainTx["status"],
      value: formatWei(t.value, 18, 4),
      createdContract: t.created_contract?.hash ?? null,
    })) as ChainTx[];
  } catch (e) {
    console.error("[getLatestNetworkTxs]", e);
    return [];
  }
});

/* ---------- Address overview ---------- */
export const getDevOverview = createServerFn({ method: "GET" })
  .inputValidator((d: { address: string }) => addrSchema.parse(d))
  .handler(async ({ data }) => {
    const addr = normalizeAddress(data.address);
    const info = await bs<{
      hash: string;
      is_contract: boolean;
      coin_balance: string | null;
      creator_address_hash?: string | null;
      creation_tx_hash?: string | null;
    }>(`/addresses/${addr}`);

    const counters = await bs<{
      transactions_count?: string;
      token_transfers_count?: string;
      gas_usage_count?: string;
      validations_count?: string;
    }>(`/addresses/${addr}/counters`).catch(
      () => ({}) as { transactions_count?: string },
    );

    // Fetch a page of transactions to derive first-seen, success rate, contract creations
    const txPage = await bs<{ items?: any[] }>(
      `/addresses/${addr}/transactions?filter=from`,
    ).catch(() => ({ items: [] as any[] }));

    const items = txPage.items ?? [];
    const sampleSize = items.length;
    const successes = items.filter(
      (t) => t.status === "ok" || t.result === "success",
    ).length;
    const createdContracts = items
      .filter((t) => t.created_contract?.hash)
      .map((t) => t.created_contract.hash as string);

    let verifiedCount = 0;
    if (createdContracts.length) {
      const checks = await Promise.all(
        createdContracts.slice(0, 10).map((c) =>
          bs<{ is_verified?: boolean }>(`/smart-contracts/${c}`)
            .then((s) => (s.is_verified ? 1 : 0))
            .catch(() => 0),
        ),
      );
      verifiedCount = checks.reduce((a, b) => a + b, 0);
    }

    // First seen: oldest tx we can see quickly
    let firstSeenAt: string | null = null;
    if (items.length) {
      firstSeenAt = items[items.length - 1].timestamp ?? null;
    }

    const overview: DevOverview = {
      address: addr,
      isContract: !!info.is_contract,
      balance: formatWei(info.coin_balance ?? "0", 18, 4),
      txCount: counters.transactions_count ? Number(counters.transactions_count) : sampleSize,
      firstSeenAt,
      contractsDeployedCount: createdContracts.length,
      tokensCreatedCount: 0,
      verifiedContractsCount: verifiedCount,
      successRate: sampleSize ? Math.round((successes / sampleSize) * 100) : 0,
    };
    return overview;
  });

/* ---------- Recent transactions of an address ---------- */
export const getAddressTxs = createServerFn({ method: "GET" })
  .inputValidator((d: { address: string }) => addrSchema.parse(d))
  .handler(async ({ data }) => {
    const addr = normalizeAddress(data.address);
    const j = await bs<{ items?: any[] }>(`/addresses/${addr}/transactions`).catch(
      () => ({ items: [] as any[] }),
    );
    return (j.items ?? []).slice(0, 30).map(
      (t: any): ChainTx => ({
        hash: t.hash,
        timestamp: t.timestamp,
        method: t.method ?? null,
        from: t.from?.hash ?? "",
        to: t.to?.hash ?? null,
        status: (t.status === "ok" || t.result === "success"
          ? "success"
          : t.result === "pending"
          ? "pending"
          : "error") as ChainTx["status"],
        value: formatWei(t.value, 18, 4),
        createdContract: t.created_contract?.hash ?? null,
      }),
    );
  });

/* ---------- Deployed contracts of an address ---------- */
export const getDeployedContracts = createServerFn({ method: "GET" })
  .inputValidator((d: { address: string }) => addrSchema.parse(d))
  .handler(async ({ data }): Promise<DeployedContract[]> => {
    const addr = normalizeAddress(data.address);
    const j = await bs<{ items?: any[] }>(`/addresses/${addr}/transactions?filter=from`).catch(
      () => ({ items: [] as any[] }),
    );
    const creates = (j.items ?? []).filter((t: any) => t.created_contract?.hash);
    const results = await Promise.all(
      creates.slice(0, 30).map(async (t: any): Promise<DeployedContract> => {
        const cAddr = t.created_contract.hash as string;
        const [info, token] = await Promise.all([
          bs<{ name?: string | null; is_verified?: boolean }>(`/smart-contracts/${cAddr}`).catch(() => ({})),
          bs<{ name?: string | null; symbol?: string | null }>(`/tokens/${cAddr}`).catch(() => null),
        ]);
        return {
          address: cAddr,
          name: info.name ?? token?.name ?? null,
          verified: !!info.is_verified,
          deployedAt: t.timestamp,
          txHash: t.hash,
          isToken: !!token,
          tokenSymbol: token?.symbol ?? null,
        };
      }),
    );
    return results;
  });
