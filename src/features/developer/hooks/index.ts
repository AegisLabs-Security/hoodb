import { useSuspenseQuery, useQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import {
  getGmgnWalletStats,
  getGmgnCreatedTokens,
  getGmgnWalletHoldings,
  getGmgnWalletActivity,
  getDevOverview,
  getAddressTxs,
  getDeployedContracts,
  listReviews,
} from "../api";

// Query Options Factory
export const developerQueryOptions = (address: string) => {
  const normalizedAddress = address.toLowerCase();

  return {
    overview: queryOptions({
      queryKey: ["developer", "overview", normalizedAddress],
      queryFn: () => getDevOverview({ data: { address: normalizedAddress } }),
      refetchInterval: 15_000,
      staleTime: 5_000,
    }),
    txs: queryOptions({
      queryKey: ["developer", "txs", normalizedAddress],
      queryFn: () => getAddressTxs({ data: { address: normalizedAddress } }),
      refetchInterval: 10_000,
      staleTime: 5_000,
    }),
    contracts: queryOptions({
      queryKey: ["developer", "contracts", normalizedAddress],
      queryFn: () => getDeployedContracts({ data: { address: normalizedAddress } }),
      refetchInterval: 30_000,
      staleTime: 15_000,
    }),
    reviews: queryOptions({
      queryKey: ["developer", "reviews", normalizedAddress],
      queryFn: () => listReviews({ data: { address: normalizedAddress } }),
      refetchInterval: 60_000,
      staleTime: 30_000,
    }),
    gmgnWalletStats: queryOptions({
      queryKey: ["developer", "gmgnWalletStats", normalizedAddress],
      queryFn: () => getGmgnWalletStats({ data: { address: normalizedAddress } }),
      refetchInterval: 30_000,
      staleTime: 15_000,
    }),
    gmgnCreatedTokens: queryOptions({
      queryKey: ["developer", "gmgnCreatedTokens", normalizedAddress],
      queryFn: () => getGmgnCreatedTokens({ data: { address: normalizedAddress } }),
      refetchInterval: 30_000,
      staleTime: 15_000,
    }),
    gmgnWalletHoldings: queryOptions({
      queryKey: ["developer", "gmgnWalletHoldings", normalizedAddress],
      queryFn: () => getGmgnWalletHoldings({ data: { address: normalizedAddress } }),
      refetchInterval: 30_000,
      staleTime: 15_000,
    }),
    gmgnWalletActivity: queryOptions({
      queryKey: ["developer", "gmgnWalletActivity", normalizedAddress],
      queryFn: () => getGmgnWalletActivity({ data: { address: normalizedAddress } }),
      refetchInterval: 30_000,
      staleTime: 15_000,
    }),
  };
};

// Custom Hooks
export function useDeveloperOverview(address: string) {
  return useSuspenseQuery(developerQueryOptions(address).overview);
}

export function useDeveloperTxs(address: string) {
  return useSuspenseQuery(developerQueryOptions(address).txs);
}

export function useDeveloperContracts(address: string) {
  return useSuspenseQuery(developerQueryOptions(address).contracts);
}

export function useDeveloperReviews(address: string) {
  return useSuspenseQuery(developerQueryOptions(address).reviews);
}

export function useWalletStats(address: string) {
  return useSuspenseQuery(developerQueryOptions(address).gmgnWalletStats);
}

export function useLaunchHistory(address: string) {
  return useSuspenseQuery(developerQueryOptions(address).gmgnCreatedTokens);
}

export function useWalletHoldings(address: string) {
  return useSuspenseQuery(developerQueryOptions(address).gmgnWalletHoldings);
}

export function useWalletActivity(address: string) {
  return useSuspenseQuery(developerQueryOptions(address).gmgnWalletActivity);
}

// Helper hook to invalidate queries
export function useInvalidateDeveloperQueries() {
  const queryClient = useQueryClient();

  return (address: string) => {
    const normalizedAddress = address.toLowerCase();
    queryClient.invalidateQueries({
      queryKey: ["developer", "reviews", normalizedAddress],
    });
  };
}
