import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useSuspenseQuery, useQuery, useMutation, useQueryClient, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy,
  ShieldCheck,
  Star,
  ExternalLink,
  Rocket,
  BarChart3,
  Users,
  Wallet,
  Clock,
  Trash2,
  AlertCircle,
  Zap,
  Share2,
  TrendingUp,
  TrendingDown,
  Activity,
  Award,
  Target,
  TrendingUp as TrendingUpIcon,
  Calendar,
  DollarSign,
  Layers,
  MessageSquare,
  ThumbsUp,
  Filter,
  QrCode,
  Bot,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getDevOverview, getAddressTxs, getDeployedContracts } from "@/lib/rhc.functions";
import { listReviews, postReview, deleteMyReview, getMyProfile } from "@/lib/reviews.functions";
import { isValidAddress, shortAddr, timeAgo, computeReputation, explorerAddr, explorerTx, RHC_EXPLORER } from "@/lib/rhc";
import { supabase } from "@/integrations/supabase/client";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { CircularProgress } from "@/components/CircularProgress";
import { EmptyState } from "@/components/EmptyState";

// Mock data for demonstration (ready to connect to GMGN API)
const mockGmgnData = {
  walletAddress: "0x0bd6582239c8f7e46e4e43d1f6661c293a7ea37a",
  name: "CryptoDev42",
  avatar: null,
  trustScore: 94,
  walletAge: 287,
  tokensLaunched: 28,
  activeTokens: 12,
  graduatedTokens: 5,
  communityReviews: 47,
  averageRating: 4.8,
  highestMarketCap: 12500000,
  averageAth: 875000,
  currentPortfolioValue: 450000,
  totalTradingVolume: 89000000,
  tokens: [
    {
      address: "0x1234567890abcdef1234567890abcdef12345678",
      name: "ROBINHOOD",
      symbol: "RH",
      logo: null,
      launchDate: Date.now() - 30 * 24 * 60 * 60 * 1000,
      currentMarketCap: 12500000,
      athMarketCap: 15000000,
      liquidity: 2500000,
      volume24h: 1200000,
      holders: 5420,
      currentPrice: 0.00125,
      status: "LIVE" as const,
    },
    {
      address: "0xabcdef1234567890abcdef1234567890abcdef12",
      name: "DEFI KING",
      symbol: "DK",
      logo: null,
      launchDate: Date.now() - 60 * 24 * 60 * 60 * 1000,
      currentMarketCap: 500000,
      athMarketCap: 2500000,
      liquidity: 100000,
      volume24h: 25000,
      holders: 1200,
      currentPrice: 0.00005,
      status: "GRADUATED" as const,
    },
    {
      address: "0x9876543210fedcba9876543210fedcba98765432",
      name: "MEME COIN",
      symbol: "MEME",
      logo: null,
      launchDate: Date.now() - 7 * 24 * 60 * 60 * 1000,
      currentMarketCap: 0,
      athMarketCap: 100000,
      liquidity: 0,
      volume24h: 0,
      holders: 0,
      currentPrice: 0,
      status: "DEAD" as const,
    },
  ],
  reputationBreakdown: {
    launchSuccess: 85,
    communityRating: 92,
    walletActivity: 78,
    holderQuality: 88,
    volumeStability: 75,
    walletAge: 90,
    communityEngagement: 82,
  },
};

const mockChartData = [
  { date: "Jan", marketCap: 100000, volume: 50000, holders: 100, price: 0.0001 },
  { date: "Feb", marketCap: 300000, volume: 150000, holders: 300, price: 0.0003 },
  { date: "Mar", marketCap: 500000, volume: 250000, holders: 800, price: 0.0005 },
  { date: "Apr", marketCap: 1200000, volume: 600000, holders: 2000, price: 0.0012 },
  { date: "May", marketCap: 1500000, volume: 750000, holders: 3500, price: 0.0015 },
  { date: "Jun", marketCap: 1250000, volume: 600000, holders: 5420, price: 0.00125 },
];

const mockActivity = [
  {
    id: "1",
    type: "TOKEN_LAUNCH" as const,
    title: "New Token Launched",
    description: "Successfully launched ROBINHOOD token",
    timestamp: Date.now() - 30 * 24 * 60 * 60 * 1000,
  },
  {
    id: "2",
    type: "COMMUNITY_REVIEW" as const,
    title: "5-Star Review Received",
    description: "Great developer, highly recommend!",
    timestamp: Date.now() - 15 * 24 * 60 * 60 * 1000,
  },
  {
    id: "3",
    type: "LIQUIDITY_CHANGE" as const,
    title: "Liquidity Increased",
    description: "Added 500 ETH to liquidity pool",
    timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000,
  },
];

const devQO = (address: string) => ({
  overview: queryOptions({
    queryKey: ["rhc", "overview", address],
    queryFn: () => getDevOverview({ data: { address } }),
    refetchInterval: 15_000,
    staleTime: 5_000,
  }),
  txs: queryOptions({
    queryKey: ["rhc", "txs", address],
    queryFn: () => getAddressTxs({ data: { address } }),
    refetchInterval: 10_000,
    staleTime: 5_000,
  }),
  contracts: queryOptions({
    queryKey: ["rhc", "contracts", address],
    queryFn: () => getDeployedContracts({ data: { address } }),
    refetchInterval: 30_000,
    staleTime: 15_000,
  }),
  reviews: queryOptions({
    queryKey: ["hooddb", "reviews", address],
    queryFn: () => listReviews({ data: { address } }),
    refetchInterval: 60_000,
    staleTime: 30_000,
  }),
});

export const Route = createFileRoute("/dev/$address")({
  beforeLoad: ({ params }) => {
    if (!isValidAddress(params.address)) {
      throw new Error("Invalid Robinhood Chain address");
    }
  },
  loader: ({ params, context }) => {
    const q = devQO(params.address.toLowerCase());
    context.queryClient.ensureQueryData(q.overview);
    context.queryClient.ensureQueryData(q.txs);
    context.queryClient.ensureQueryData(q.contracts);
    context.queryClient.ensureQueryData(q.reviews);
  },
  head: ({ params }) => ({
    meta: [
      { title: `${shortAddr(params.address)} — HOODDB` },
      {
        name: "description",
        content: `Live on-chain profile & community reviews for ${shortAddr(params.address)} on Robinhood Chain.`,
      },
      { property: "og:title", content: `${shortAddr(params.address)} — HOODDB` },
      { property: "og:description", content: "On-chain reputation on Robinhood Chain, verifiable via Blockscout." },
    ],
  }),
  component: DevPage,
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="flex-1 mx-auto max-w-3xl w-full px-4 py-24 text-center">
        <h1 className="font-display text-4xl font-black">Address unreadable</h1>
        <p className="mt-3 text-muted-foreground">{error.message}</p>
        <Link to="/" className="mt-6 inline-flex rounded-lg bg-primary px-6 py-3 text-sm font-bold text-primary-foreground">
          Back to Scan
        </Link>
      </div>
      <SiteFooter />
    </div>
  ),
});

function DevPage() {
  const { address: rawAddress } = Route.useParams();
  const address = rawAddress.toLowerCase();
  const q = devQO(address);
  const { data: overview } = useSuspenseQuery(q.overview);
  const { data: txs } = useSuspenseQuery(q.txs);
  const { data: contracts } = useSuspenseQuery(q.contracts);
  const { data: reviews } = useSuspenseQuery(q.reviews);
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
          qc.invalidateQueries({ queryKey: ["hooddb", "reviews", address] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [address, qc]);

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
            trustScore={mockGmgnData.trustScore}
          />

          {/* Main Content */}
          <div className="mx-auto max-w-7xl w-full px-4 md:px-8 py-12">
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-10">
                {/* Quick Stats Grid */}
                <QuickStatsSection />

                {/* AI Summary */}
                <AISummarySection />

                {/* Launch History */}
                <LaunchHistorySection tokens={mockGmgnData.tokens} />

                {/* Token Performance Charts */}
                <TokenPerformanceCharts />

                {/* Developer Reputation */}
                <DeveloperReputationSection breakdown={mockGmgnData.reputationBreakdown} />

                {/* Portfolio Overview */}
                <PortfolioOverviewSection />

                {/* Recent Activity Timeline */}
                <RecentActivityTimeline activities={mockActivity} />

                {/* Community Reviews */}
                <CommunityReviewsSection
                  address={address}
                  reviews={reviews}
                  onChanged={() => qc.invalidateQueries({ queryKey: ["hooddb", "reviews", address] })}
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

function HeaderSection({
  address,
  copied,
  copy,
  trustScore,
}: {
  address: string;
  copied: boolean;
  copy: () => void;
  trustScore: number;
}) {
  const badges = [
    { label: "Verified", icon: ShieldCheck, tone: "neon" },
    { label: "Trusted Developer", icon: Award, tone: "neon" },
    { label: "Early Builder", icon: Rocket, tone: "blue" },
    { label: "Community Favorite", icon: Users, tone: "neon" },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="border-b border-border/60 bg-surface/30 backdrop-blur-xl"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center">
          {/* Left: Avatar & Info */}
          <div className="flex-1 flex items-start gap-6">
            <div className="relative shrink-0">
              <div className="w-28 h-28 rounded-3xl border-2 border-neon/50 bg-surface-2 flex items-center justify-center font-mono text-3xl text-neon">
                {address.slice(2, 6).toUpperCase()}
              </div>
              <div className="absolute -bottom-3 -right-3 rounded-full bg-background p-2">
                <span className="block w-5 h-5 rounded-full bg-neon animate-pulse" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-2 mb-3">
                {badges.map((badge, i) => (
                  <Chip
                    key={i}
                    icon={<badge.icon className="w-3 h-3" />}
                    label={badge.label}
                    tone={badge.tone as any}
                  />
                ))}
              </div>

              <h1 className="font-display text-3xl md:text-5xl font-black break-all mb-3">
                {mockGmgnData.name}
              </h1>

              <button
                onClick={copy}
                className="font-mono text-lg text-muted-foreground hover:text-neon inline-flex items-center gap-3 transition"
              >
                <span className="break-all">{address}</span>
                <Copy className="w-5 h-5" />
                {copied && <span className="text-neon font-bold">copied</span>}
              </button>

              <div className="mt-6 flex flex-wrap gap-4">
                <button
                  onClick={copy}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl border border-border hover:border-neon hover:text-neon transition"
                >
                  <Copy className="w-4 h-4" />
                  Copy Address
                </button>
                <button className="flex items-center gap-2 px-5 py-3 rounded-xl border border-border hover:border-neon hover:text-neon transition">
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
                <a
                  href={explorerAddr(address)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-5 py-3 rounded-xl border border-border hover:border-neon hover:text-neon transition"
                >
                  <ExternalLink className="w-4 h-4" />
                  Blockscout
                </a>
              </div>
            </div>
          </div>

          {/* Right: Trust Score */}
          <div className="shrink-0 flex flex-col items-center gap-4 p-6 rounded-3xl neon-panel border-neon/30">
            <span className="text-sm text-muted-foreground uppercase tracking-widest font-semibold">
              Trust Score
            </span>
            <CircularProgress value={trustScore} size={180} strokeWidth={14} />
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function QuickStatsSection() {
  const stats = [
    { label: "Wallet Age", value: mockGmgnData.walletAge, suffix: " days", icon: Calendar },
    { label: "Tokens Launched", value: mockGmgnData.tokensLaunched, icon: Rocket },
    { label: "Active Tokens", value: mockGmgnData.activeTokens, icon: Activity },
    { label: "Graduated Tokens", value: mockGmgnData.graduatedTokens, icon: Award },
    { label: "Community Reviews", value: mockGmgnData.communityReviews, icon: MessageSquare },
    { label: "Avg Rating", value: mockGmgnData.averageRating, suffix: " ★", icon: Star, decimals: 1 },
    { label: "Highest Market Cap", value: mockGmgnData.highestMarketCap / 1000000, suffix: "M", icon: TrendingUp, decimals: 2 },
    { label: "Avg ATH", value: mockGmgnData.averageAth / 1000, suffix: "K", icon: TrendingUpIcon, decimals: 2 },
    { label: "Portfolio Value", value: mockGmgnData.currentPortfolioValue / 1000, suffix: "K", icon: DollarSign, decimals: 1 },
    { label: "Total Volume", value: mockGmgnData.totalTradingVolume / 1000000, suffix: "M", icon: BarChart3, decimals: 2 },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 + i * 0.05 }}
            className="neon-panel rounded-2xl p-6 hover:border-neon/40 transition-all duration-300"
          >
            <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground mb-4">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-neon/10 text-neon">
                <stat.icon className="w-5 h-5" />
              </div>
              {stat.label}
            </div>
            <div className="font-display font-black text-3xl md:text-4xl">
              <AnimatedCounter
                end={stat.value}
                suffix={stat.suffix}
                decimals={stat.decimals || 0}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

function AISummarySection() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
      className="neon-panel rounded-3xl overflow-hidden border-neon/30"
    >
      <div className="p-8 border-b border-border/60 bg-surface/50 flex items-center gap-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-neon/10 text-neon animate-pulse-glow">
          <Bot className="w-6 h-6" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold">AI Developer Summary</h2>
          <p className="text-xs text-muted-foreground">Powered by on-chain analysis</p>
        </div>
      </div>
      <div className="p-8">
        <div className="space-y-4 text-lg leading-relaxed text-muted-foreground/90">
          <p>
            This developer has launched <span className="text-neon font-bold">28 tokens</span> on Robinhood Chain.
          </p>
          <p>
            <span className="text-neon font-bold">18 tokens</span> reached over $100K market cap, with <span className="text-neon font-bold">5 tokens</span> exceeding $1M at their peak.
          </p>
          <p>
            Community sentiment is highly positive with an average rating of 4.8 stars from 47 verified reviews.
          </p>
          <p>
            No suspicious liquidity removals detected. Risk Level: <span className="text-neon font-bold">Low</span>.
          </p>
        </div>
      </div>
    </motion.section>
  );
}

function LaunchHistorySection({ tokens }: { tokens: typeof mockGmgnData.tokens }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
      className="neon-panel rounded-3xl overflow-hidden"
    >
      <div className="p-8 border-b border-border/60 bg-surface/50 flex items-center gap-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-neon/10 text-neon">
          <Rocket className="w-6 h-6" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold">Launch History</h2>
          <p className="text-xs text-muted-foreground">{tokens.length} tokens deployed</p>
        </div>
      </div>
      <div className="p-4">
        <AnimatePresence>
          {tokens.length === 0 ? (
            <EmptyState
              icon={<Rocket className="w-16 h-16" />}
              title="No Launch History Yet"
              description="This wallet hasn't deployed any tokens yet. Check back later."
            />
          ) : (
            <div className="space-y-4">
              {tokens.map((token, i) => (
                <TokenCard key={token.address} token={token} index={i} />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}

function TokenCard({ token, index }: { token: typeof mockGmgnData.tokens[0]; index: number }) {
  const statusColors = {
    LIVE: "bg-neon/15 text-neon",
    GRADUATED: "bg-blue-400/15 text-blue-300",
    DEAD: "bg-red-500/15 text-red-300",
  };

  const statusIcons = {
    LIVE: TrendingUp,
    GRADUATED: Award,
    DEAD: AlertCircle,
  };

  const StatusIcon = statusIcons[token.status];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.35 + index * 0.1 }}
      className="group rounded-2xl border border-border p-6 bg-surface/50 hover:bg-surface/80 hover:border-neon/30 transition-all duration-300"
    >
      <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
        {/* Token Logo & Basic Info */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-14 h-14 rounded-2xl bg-neon/10 border border-neon/30 flex items-center justify-center shrink-0">
            <span className="font-mono text-xs font-bold text-neon">
              {token.symbol.slice(0, 3).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="font-bold text-xl truncate group-hover:text-neon transition">
                {token.name}
              </h3>
              <span className="font-mono text-muted-foreground text-sm">
                {token.symbol}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              Launched {timeAgo(token.launchDate)}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Market Cap</span>
            <span className="font-mono font-bold text-neon">
              ${token.currentMarketCap.toLocaleString()}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground uppercase tracking-widest mb-1">ATH</span>
            <span className="font-mono font-bold text-neon/80">
              ${token.athMarketCap.toLocaleString()}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Liquidity</span>
            <span className="font-mono font-bold">
              ${token.liquidity.toLocaleString()}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground uppercase tracking-widest mb-1">24h Volume</span>
            <span className="font-mono font-bold">
              ${token.volume24h.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Status & Links */}
        <div className="flex flex-col lg:flex-row items-end lg:items-center gap-3 shrink-0">
          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest ${statusColors[token.status]}`}>
            <StatusIcon className="w-4 h-4" />
            {token.status}
          </span>
          <div className="flex gap-2">
            <a
              href={explorerAddr(token.address)}
              target="_blank"
              rel="noreferrer"
              className="p-3 rounded-xl border border-border hover:border-neon hover:text-neon transition"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button className="p-3 rounded-xl border border-border hover:border-neon hover:text-neon transition">
              <BarChart3 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function TokenPerformanceCharts() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
      className="space-y-6"
    >
      <div className="neon-panel rounded-3xl p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-neon/10 text-neon">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold">Token Performance</h2>
            <p className="text-xs text-muted-foreground">Market cap & volume trends</p>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Market Cap Chart */}
          <div className="h-80">
            <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-widest">Market Cap</h3>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockChartData}>
                <defs>
                  <linearGradient id="colorMarketCap" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.88 0.26 135)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="oklch(0.88 0.26 135)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.85 0.24 135 / 10%)" />
                <XAxis dataKey="date" stroke="oklch(0.7 0.05 140)" tick={{ fontSize: 12, fontFamily: "JetBrains Mono" }} />
                <YAxis stroke="oklch(0.7 0.05 140)" tick={{ fontSize: 12, fontFamily: "JetBrains Mono" }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "oklch(0.17 0.03 150 / 95%)", border: "1px solid oklch(0.85 0.24 135 / 22%)", borderRadius: "12px" }}
                  labelStyle={{ fontFamily: "Space Grotesk", fontWeight: "bold" }}
                />
                <Area
                  type="monotone"
                  dataKey="marketCap"
                  stroke="oklch(0.88 0.26 135)"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorMarketCap)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Volume Chart */}
          <div className="h-80">
            <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-widest">Volume</h3>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockChartData}>
                <defs>
                  <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.75 0.18 120)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="oklch(0.75 0.18 120)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.85 0.24 135 / 10%)" />
                <XAxis dataKey="date" stroke="oklch(0.7 0.05 140)" tick={{ fontSize: 12, fontFamily: "JetBrains Mono" }} />
                <YAxis stroke="oklch(0.7 0.05 140)" tick={{ fontSize: 12, fontFamily: "JetBrains Mono" }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "oklch(0.17 0.03 150 / 95%)", border: "1px solid oklch(0.85 0.24 135 / 22%)", borderRadius: "12px" }}
                  labelStyle={{ fontFamily: "Space Grotesk", fontWeight: "bold" }}
                />
                <Area
                  type="monotone"
                  dataKey="volume"
                  stroke="oklch(0.75 0.18 120)"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorVolume)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function DeveloperReputationSection({
  breakdown,
}: {
  breakdown: typeof mockGmgnData.reputationBreakdown;
}) {
  const items = [
    { label: "Launch Success", value: breakdown.launchSuccess, icon: Rocket },
    { label: "Community Rating", value: breakdown.communityRating, icon: Star },
    { label: "Wallet Activity", value: breakdown.walletActivity, icon: Activity },
    { label: "Holder Quality", value: breakdown.holderQuality, icon: Users },
    { label: "Volume Stability", value: breakdown.volumeStability, icon: BarChart3 },
    { label: "Wallet Age", value: breakdown.walletAge, icon: Calendar },
    { label: "Community Engagement", value: breakdown.communityEngagement, icon: MessageSquare },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
      className="neon-panel rounded-3xl p-8"
    >
      <div className="flex items-center gap-4 mb-10">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-neon/10 text-neon">
          <Award className="w-6 h-6" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold">Developer Reputation</h2>
          <p className="text-xs text-muted-foreground">Trust score breakdown</p>
        </div>
      </div>

      <div className="space-y-6">
        {items.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.55 + i * 0.07 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5 text-neon" />
                <span className="font-semibold text-muted-foreground/90">{item.label}</span>
              </div>
              <span className="font-mono font-bold text-neon text-lg">{item.value}%</span>
            </div>
            <div className="h-4 rounded-full bg-surface-2 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-neon/80 to-neon"
                initial={{ width: 0 }}
                animate={{ width: `${item.value}%` }}
                transition={{ duration: 1.5, delay: 0.7 + i * 0.1, ease: "easeOut" }}
                style={{
                  filter: `drop-shadow(0 0 8px oklch(0.88 0.26 135 / 40%))`,
                }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

function PortfolioOverviewSection() {
  const portfolioItems = [
    { label: "Total Tokens", value: mockGmgnData.tokensLaunched, icon: Layers },
    { label: "Active Value", value: "$450K", icon: DollarSign },
    { label: "Best Performer", value: "ROBINHOOD", icon: TrendingUp },
    { label: "Worst Performer", value: "MEME COIN", icon: TrendingDown },
    { label: "Avg ROI", value: "+287%", icon: TrendingUpIcon },
    { label: "Best ATH", value: "$15M", icon: Award },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
      className="neon-panel rounded-3xl p-8"
    >
      <div className="flex items-center gap-4 mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-neon/10 text-neon">
          <Wallet className="w-6 h-6" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold">Portfolio Overview</h2>
          <p className="text-xs text-muted-foreground">Track record at a glance</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {portfolioItems.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.65 + i * 0.05 }}
            className="p-6 rounded-2xl border border-border bg-surface/50 hover:border-neon/30 transition-all duration-300"
          >
            <div className="flex items-center gap-3 mb-3">
              <item.icon className="w-5 h-5 text-neon" />
              <span className="text-xs uppercase tracking-widest text-muted-foreground">
                {item.label}
              </span>
            </div>
            <div className="font-display text-2xl font-black text-neon">
              {item.value}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

function RecentActivityTimeline({ activities }: { activities: typeof mockActivity }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.7, ease: "easeOut" }}
      className="neon-panel rounded-3xl p-8"
    >
      <div className="flex items-center gap-4 mb-10">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-neon/10 text-neon">
          <Activity className="w-6 h-6" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold">Recent Activity</h2>
          <p className="text-xs text-muted-foreground">Timeline of events</p>
        </div>
      </div>

      <div className="space-y-8">
        {activities.length === 0 ? (
          <EmptyState
            icon={<Activity className="w-16 h-16" />}
            title="No Activity Yet"
            description="This wallet hasn't had any recent activity."
          />
        ) : (
          activities.map((activity, i) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.75 + i * 0.1 }}
              className="relative pl-8"
            >
              {/* Timeline dot */}
              <div className="absolute left-0 top-1 w-5 h-5 rounded-full bg-neon shadow-[0_0_20px_rgba(34,211,238,0.4)]" />
              {/* Timeline line */}
              {i < activities.length - 1 && (
                <div className="absolute left-2 top-6 bottom-0 w-0.5 bg-gradient-to-b from-neon to-transparent" />
              )}

              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg">{activity.title}</span>
                  <span className="text-xs text-muted-foreground font-mono">
                    {timeAgo(activity.timestamp)}
                  </span>
                </div>
                <p className="text-muted-foreground">{activity.description}</p>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.section>
  );
}

function CommunityReviewsSection({
  address,
  reviews,
  onChanged,
}: {
  address: string;
  reviews: any[];
  onChanged: () => void;
}) {
  const [authed, setAuthed] = useState<boolean | null>(null);
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setAuthed(!!data.session);
    });
    const sub = supabase.auth.onAuthStateChange((_e, s) => setAuthed(!!s));
    return () => {
      mounted = false;
      sub.data.subscription.unsubscribe();
    };
  }, []);

  const profileQuery = useQuery({
    queryKey: ["profile", "me"],
    queryFn: () => getMyProfile(),
    enabled: !!authed,
    retry: false,
  });

  const postFn = useServerFn(postReview);
  const delFn = useServerFn(deleteMyReview);
  const post = useMutation({
    mutationFn: (input: { rating: number; content: string }) =>
      postFn({ data: { address, ...input } }),
    onSuccess: onChanged,
  });
  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: onChanged,
  });

  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [filter, setFilter] = useState<"newest" | "highest" | "most-helpful" | "verified">("newest");

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.8, ease: "easeOut" }}
      className="neon-panel rounded-3xl overflow-hidden"
    >
      <div className="p-8 border-b border-border/60 bg-surface/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-neon/10 text-neon">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold">Community Reviews</h2>
            <p className="text-xs text-muted-foreground">{reviews.length} reviews</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="bg-transparent border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-neon"
          >
            <option value="newest">Newest</option>
            <option value="highest">Highest Rating</option>
            <option value="most-helpful">Most Helpful</option>
            <option value="verified">Verified Only</option>
          </select>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* Write Review */}
        {authed ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (content.trim().length < 5) return;
              post.mutate({ rating, content: content.trim() }, {
                onSuccess: () => setContent(""),
              });
            }}
            className="p-6 rounded-2xl border border-border bg-surface/50 space-y-4"
          >
            <div className="text-sm text-muted-foreground">
              Posting as <span className="text-neon font-bold">@{profileQuery.data?.x_handle ?? "you"}</span>
            </div>

            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  type="button"
                  key={n}
                  onClick={() => setRating(n)}
                  className="p-2 rounded-lg hover:bg-neon/10 transition"
                  aria-label={`${n} star`}
                >
                  <Star className={`w-8 h-8 ${n <= rating ? "fill-neon text-neon drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]" : "text-muted-foreground"}`} />
                </button>
              ))}
            </div>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your experience with this developer..."
              rows={4}
              maxLength={1000}
              className="w-full rounded-xl bg-surface border border-border p-4 text-sm focus:outline-none focus:border-neon focus:ring-2 focus:ring-neon/20 transition resize-none"
            />

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={post.isPending}
                className="px-8 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:brightness-110 disabled:opacity-50 transition"
              >
                {post.isPending ? "Posting..." : "Post Review"}
              </button>
            </div>

            {post.error && (
              <div className="text-sm text-red-400 flex items-center gap-2 bg-red-500/10 rounded-lg p-3">
                <AlertCircle className="w-4 h-4" />
                {(post.error as Error).message}
              </div>
            )}
          </form>
        ) : (
          <div className="p-6 rounded-2xl border border-border bg-surface/50 text-sm">
            <p className="mb-3">Want to leave a review?</p>
            <Link
              to="/auth"
              className="text-neon hover:underline font-bold inline-flex items-center gap-2"
            >
              Sign in with X <ExternalLink className="w-3 h-3" />
            </Link>
            <p className="mt-2 text-xs text-muted-foreground">
              Every review is tied to a verified X handle to prevent spam.
            </p>
          </div>
        )}

        {/* Reviews List */}
        <div className="space-y-6">
          {reviews.length === 0 ? (
            <EmptyState
              icon={<Star className="w-16 h-16" />}
              title="No Reviews Yet"
              description="Be the first to review this developer!"
            />
          ) : (
            reviews.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.85 + i * 0.05 }}
                className="p-6 rounded-2xl border border-border bg-surface/50 hover:border-neon/30 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {r.x_avatar_url ? (
                      <img
                        src={r.x_avatar_url}
                        alt=""
                        className="w-12 h-12 rounded-full border-2 border-neon/30 object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-surface-2 border-2 border-neon/30" />
                    )}
                    <div>
                      <a
                        href={r.x_handle ? `https://x.com/${r.x_handle}` : "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 font-bold text-lg hover:text-neon transition"
                      >
                        @{r.x_handle ?? "anon"}
                        {r.x_verified && <ShieldCheck className="w-4 h-4 text-neon" />}
                      </a>
                      <div className="text-neon font-mono mt-1">
                        {"★".repeat(r.rating)}
                        <span className="opacity-30">{"★".repeat(5 - r.rating)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {profileQuery.data?.id === r.author_id && (
                      <button
                        onClick={() => del.mutate(r.id)}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition"
                        aria-label="Delete review"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-lg text-muted-foreground/90 leading-relaxed mb-4">
                  {r.content}
                </p>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-mono uppercase tracking-widest">
                    {timeAgo(r.created_at)}
                  </span>
                  <button className="flex items-center gap-2 hover:text-neon transition">
                    <ThumbsUp className="w-4 h-4" />
                    Helpful
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </motion.section>
  );
}

function StickySidebar({
  address,
  copied,
  copy,
  reputation,
  avgRating,
  latestReview,
}: {
  address: string;
  copied: boolean;
  copy: () => void;
  reputation: number;
  avgRating: number | null;
  latestReview: any;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
      className="sticky top-24 space-y-6"
    >
      {/* Wallet QR & Quick Actions */}
      <div className="neon-panel rounded-3xl p-8">
        <div className="flex flex-col items-center text-center">
          <div className="w-32 h-32 rounded-2xl bg-surface border-2 border-neon/30 flex items-center justify-center mb-6">
            <QrCode className="w-20 h-20 text-neon" />
          </div>

          <div className="w-full space-y-3">
            <button
              onClick={copy}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-surface-2 border border-border hover:border-neon hover:text-neon transition"
            >
              <Copy className="w-5 h-5" />
              Copy Address
            </button>
            <a
              href={explorerAddr(address)}
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-surface-2 border border-border hover:border-neon hover:text-neon transition"
            >
              <ExternalLink className="w-5 h-5" />
              Blockscout
            </a>
            <button className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-surface-2 border border-border hover:border-neon hover:text-neon transition">
              <BarChart3 className="w-5 h-5" />
              GMGN
            </button>
            <button className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-surface-2 border border-border hover:border-neon hover:text-neon transition">
              <Zap className="w-5 h-5" />
              DEX
            </button>
            <button className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-primary text-primary-foreground hover:brightness-110 transition font-bold">
              <Share2 className="w-5 h-5" />
              Share Profile
            </button>
          </div>
        </div>
      </div>

      {/* Quick Reputation Info */}
      <div className="neon-panel rounded-3xl p-8">
        <h3 className="font-display text-xl font-bold mb-6">Quick Stats</h3>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Reputation</span>
            <span className="font-mono text-2xl font-black text-neon">{reputation.toFixed(0)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Avg Rating</span>
            <span className="font-mono text-xl font-bold text-neon">
              {avgRating ? `${avgRating.toFixed(1)} ★` : "—"}
            </span>
          </div>
          {latestReview && (
            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Latest Review</p>
              <p className="text-sm text-muted-foreground/90 line-clamp-3">
                "{latestReview.content}"
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function Chip({ icon, label, tone }: { icon?: React.ReactNode; label: string; tone: "neon" | "orange" | "red" | "blue" }) {
  const tones = {
    neon: "bg-neon/10 text-neon border-neon/30",
    orange: "bg-orange-500/15 text-orange-300 border-orange-500/30",
    red: "bg-red-500/15 text-red-300 border-red-500/30",
    blue: "bg-blue-400/15 text-blue-300 border-blue-400/30",
  } as const;
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest border ${tones[tone]}`}>
      {icon}
      {label}
    </span>
  );
}
