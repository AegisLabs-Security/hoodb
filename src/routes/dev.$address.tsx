import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { computeReputation, isValidAddress } from "@/lib/rhc";
import { supabase } from "@/integrations/supabase/client";
import {
  developerQueryOptions,
  useDeveloperOverview,
  useDeveloperTxs,
  useDeveloperContracts,
  useDeveloperReviews,
  useWalletStats,
  useLaunchHistory,
  useWalletHoldings,
  useWalletActivity,
  useInvalidateDeveloperQueries,
} from "@/features/developer/hooks";
import {
  HeaderSection,
  QuickStatsSection,
  AISummarySection,
  LaunchHistorySection,
  DeveloperReputationSection,
  PortfolioOverviewSection,
  RecentActivityTimeline,
  CommunityReviewsSection,
  StickySidebar,
} from "@/features/developer/components";
import { getGmgnErrorMessage } from "@/features/developer/utils";

export const Route = createFileRoute("/dev/$address")({
  beforeLoad: ({ params }) => {
    if (!isValidAddress(params.address)) {
      throw new Error("Invalid Robinhood Chain address");
    }
  },
  loader: ({ params, context }) => {
    const q = developerQueryOptions(params.address.toLowerCase());
    context.queryClient.ensureQueryData(q.overview);
    context.queryClient.ensureQueryData(q.txs);
    context.queryClient.ensureQueryData(q.contracts);
    context.queryClient.ensureQueryData(q.reviews);
    context.queryClient.ensureQueryData(q.gmgnWalletStats);
    context.queryClient.ensureQueryData(q.gmgnCreatedTokens);
    context.queryClient.ensureQueryData(q.gmgnWalletHoldings);
    context.queryClient.ensureQueryData(q.gmgnWalletActivity);
  },
  head: ({ params }) => {
    // Use a temporary function to get short address since we can't import hooks here
    const shortAddr = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    return {
      meta: [
        { title: `${shortAddr(params.address)} — HOODDB` },
        {
          name: "description",
          content: `Live on-chain profile & community reviews for ${shortAddr(params.address)} on Robinhood Chain.`,
        },
        { property: "og:title", content: `${shortAddr(params.address)} — HOODDB` },
        { property: "og:description", content: "On-chain reputation on Robinhood Chain, verifiable via Blockscout." },
      ],
    };
  },
  component: DevPage,
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="flex-1 mx-auto max-w-3xl w-full px-4 py-24 text-center">
        <h1 className="font-display text-4xl font-black">Address unreadable</h1>
        <p className="mt-3 text-muted-foreground">{error.message}</p>
        <a href="/" className="mt-6 inline-flex rounded-lg bg-primary px-6 py-3 text-sm font-bold text-primary-foreground">
          Back to Scan
        </a>
      </div>
      <SiteFooter />
    </div>
  ),
});

function DevPage() {
  const { address: rawAddress } = Route.useParams();
  const address = rawAddress.toLowerCase();

  const { data: overview } = useDeveloperOverview(address);
  const { data: txs } = useDeveloperTxs(address);
  const { data: contracts } = useDeveloperContracts(address);
  const { data: reviews } = useDeveloperReviews(address);
  const { data: gmgnWalletStats } = useWalletStats(address);
  const { data: gmgnCreatedTokens } = useLaunchHistory(address);
  const { data: gmgnWalletHoldings } = useWalletHoldings(address);
  const { data: gmgnWalletActivity } = useWalletActivity(address);
  const gmgnMessage =
    getGmgnErrorMessage(gmgnWalletStats) ??
    getGmgnErrorMessage(gmgnCreatedTokens) ??
    getGmgnErrorMessage(gmgnWalletHoldings) ??
    getGmgnErrorMessage(gmgnWalletActivity);

  const invalidateQueries = useInvalidateDeveloperQueries();
  const qc = useQueryClient();

  // Realtime subscription for reviews
  useEffect(() => {
    const channel = supabase
      .channel(`reviews:${address}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reviews",
          filter: `address=eq.${address}`,
        },
        () => {
          invalidateQueries(address);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [address, invalidateQueries]);

  const [copied, setCopied] = useState(false);

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;
  const rep = computeReputation(overview, avg, reviews.length);

  const copy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <div className="relative">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="relative">
          {/* Header Section */}
          <HeaderSection
            address={address}
            copied={copied}
            copy={copy}
            gmgnWalletStats={gmgnWalletStats}
            overview={overview}
          />

          {/* Main Content */}
          <div className="mx-auto max-w-7xl w-full px-4 md:px-8 py-12">
            {gmgnMessage && (
              <div className="mb-8 flex items-start gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-5 py-4 text-sm text-amber-100">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold">GMGN provider sedang tidak tersedia</p>
                  <p className="mt-1 text-amber-100/80">
                    HOODDB tetap menampilkan data on-chain dan review komunitas. Detail enrichment dari GMGN disembunyikan agar tidak memunculkan angka palsu.
                  </p>
                  <p className="mt-2 font-mono text-xs text-amber-100/70">{gmgnMessage}</p>
                </div>
              </div>
            )}
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-10">
                {/* Quick Stats Grid */}
                <QuickStatsSection
                  gmgnWalletStats={gmgnWalletStats}
                  gmgnCreatedTokens={gmgnCreatedTokens}
                  gmgnWalletHoldings={gmgnWalletHoldings}
                  overview={overview}
                  contracts={contracts}
                  avgRating={avg}
                />

                {/* AI Summary */}
                <AISummarySection
                  gmgnWalletStats={gmgnWalletStats}
                  gmgnCreatedTokens={gmgnCreatedTokens}
                  gmgnWalletHoldings={gmgnWalletHoldings}
                  overview={overview}
                  contracts={contracts}
                  avgRating={avg}
                  reviewCount={reviews.length}
                />

                {/* Launch History */}
                <LaunchHistorySection
                  gmgnCreatedTokens={gmgnCreatedTokens}
                  deployedContracts={contracts}
                />

                {/* Developer Reputation */}
                <DeveloperReputationSection
                  gmgnWalletStats={gmgnWalletStats}
                  gmgnCreatedTokens={gmgnCreatedTokens}
                  reputationBreakdown={rep}
                />

                {/* Portfolio Overview */}
                <PortfolioOverviewSection
                  gmgnWalletHoldings={gmgnWalletHoldings}
                  gmgnCreatedTokens={gmgnCreatedTokens}
                  overview={overview}
                  txs={txs}
                  contracts={contracts}
                />

                {/* Recent Activity Timeline */}
                <RecentActivityTimeline
                  gmgnWalletActivity={gmgnWalletActivity}
                  txs={txs}
                />

                {/* Community Reviews */}
                <CommunityReviewsSection
                  address={address}
                  reviews={reviews}
                  onChanged={() => invalidateQueries(address)}
                />
              </div>

              {/* Right Sticky Sidebar */}
              <div className="lg:col-span-1">
                <StickySidebar
                  address={address}
                  copied={copied}
                  copy={copy}
                  reputation={rep.score}
                  avgRating={avg}
                  latestReview={reviews[0]}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
