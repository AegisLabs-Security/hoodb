import { motion } from "framer-motion";
import { Calendar, Rocket, Activity, Award, Star, TrendingUp, DollarSign, AlertTriangle } from "lucide-react";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import type { DevOverview, DeployedContract } from "@/lib/rhc";
import type { GmgnWalletStats, GmgnCreatedTokens, GmgnWalletHoldings, GmgnResult } from "../types";
import { getGmgnErrorMessage, unwrapGmgnResult } from "../utils";

interface QuickStatsSectionProps {
  gmgnWalletStats: GmgnResult<GmgnWalletStats>;
  gmgnCreatedTokens: GmgnResult<GmgnCreatedTokens>;
  gmgnWalletHoldings: GmgnResult<GmgnWalletHoldings>;
  overview: DevOverview;
  contracts: DeployedContract[];
  avgRating: number | null;
}

export function QuickStatsSection({
  gmgnWalletStats,
  gmgnCreatedTokens,
  gmgnWalletHoldings,
  overview,
  contracts,
  avgRating,
}: QuickStatsSectionProps) {
  const statsData = unwrapGmgnResult(gmgnWalletStats);
  const createdTokensData = unwrapGmgnResult(gmgnCreatedTokens);
  const holdingsData = unwrapGmgnResult(gmgnWalletHoldings);
  const gmgnMessage =
    getGmgnErrorMessage(gmgnWalletStats) ??
    getGmgnErrorMessage(gmgnCreatedTokens) ??
    getGmgnErrorMessage(gmgnWalletHoldings);

  // Calculate wallet age from created_at (if available)
  let walletAgeDays = 0;
  if (statsData?.common?.created_at) {
    const createdAt = new Date(statsData.common.created_at * 1000); // convert to ms
    walletAgeDays = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
  } else if (overview.firstSeenAt) {
    walletAgeDays = Math.floor((Date.now() - new Date(overview.firstSeenAt).getTime()) / (1000 * 60 * 60 * 24));
  }

  // Calculate total tokens launched
  const tokensLaunched = createdTokensData
    ? (createdTokensData.inner_count ?? 0) + (createdTokensData.open_count ?? 0)
    : 0;

  const activeTokens = createdTokensData?.open_count ?? 0;
  const graduatedTokens = createdTokensData?.open_count ?? 0;

  // Calculate portfolio value from holdings
  const portfolioValue = holdingsData?.holdings?.reduce((sum, h) => sum + (h.usd_value ?? 0), 0) ?? 0;

  // Get highest ATH from created tokens
  let highestAth = 0;
  if (createdTokensData?.creator_ath_info?.ath_mc) {
    highestAth = parseFloat(createdTokensData.creator_ath_info.ath_mc);
  }

  const fallbackStats = [
    {
      label: "Wallet Age",
      value: walletAgeDays,
      suffix: " days",
      icon: <Calendar className="w-5 h-5" />,
    },
    {
      label: "Transactions",
      value: overview.txCount,
      icon: <Activity className="w-5 h-5" />,
    },
    {
      label: "Contracts",
      value: contracts.length || overview.contractsDeployedCount,
      icon: <Rocket className="w-5 h-5" />,
    },
    {
      label: "Verified",
      value: overview.verifiedContractsCount,
      icon: <Award className="w-5 h-5" />,
    },
    {
      label: "Success Rate",
      value: overview.successRate,
      suffix: "%",
      icon: <TrendingUp className="w-5 h-5" />,
    },
    {
      label: "Balance",
      value: Number(overview.balance),
      suffix: " RHC",
      icon: <DollarSign className="w-5 h-5" />,
      decimals: Number(overview.balance) < 10 ? 4 : 2,
    },
    {
      label: "Avg Rating",
      value: avgRating ?? 0,
      suffix: avgRating ? " ★" : "",
      icon: <Star className="w-5 h-5" />,
      decimals: avgRating ? 1 : 0,
    },
  ];

  const stats = [
    {
      label: "Wallet Age",
      value: walletAgeDays,
      suffix: " days",
      icon: <Calendar className="w-5 h-5" />,
    },
    {
      label: "Tokens Launched",
      value: tokensLaunched,
      icon: <Rocket className="w-5 h-5" />,
    },
    {
      label: "Active Tokens",
      value: activeTokens,
      icon: <Activity className="w-5 h-5" />,
    },
    {
      label: "Graduated Tokens",
      value: graduatedTokens,
      icon: <Award className="w-5 h-5" />,
    },
    {
      label: "Avg Rating",
      value: statsData?.winrate ? statsData.winrate * 5 : 0,
      suffix: " ★",
      icon: <Star className="w-5 h-5" />,
      decimals: 1,
    },
    {
      label: "Highest Market Cap",
      value: highestAth / 1000000,
      suffix: "M",
      icon: <TrendingUp className="w-5 h-5" />,
      decimals: 2,
    },
    {
      label: "Portfolio Value",
      value: portfolioValue / 1000,
      suffix: "K",
      icon: <DollarSign className="w-5 h-5" />,
      decimals: 1,
    },
  ];
  const displayStats =
    statsData || createdTokensData || holdingsData ? stats : fallbackStats;

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
    >
      {!statsData && !createdTokensData && !holdingsData && gmgnMessage && (
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-sm text-muted-foreground">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
          <span>{gmgnMessage}</span>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {displayStats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 + i * 0.05 }}
            className="neon-panel rounded-2xl p-6 hover:border-neon/40 transition-all duration-300"
          >
            <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground mb-4">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-neon/10 text-neon">
                {stat.icon}
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
