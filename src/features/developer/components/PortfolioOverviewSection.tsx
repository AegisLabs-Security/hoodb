import { motion } from "framer-motion";
import { Wallet, Layers, DollarSign, TrendingUp, TrendingDown, Award } from "lucide-react";
import type { GmgnWalletHoldings, GmgnCreatedTokens } from "../types";

interface PortfolioOverviewSectionProps {
  gmgnWalletHoldings: GmgnWalletHoldings | null;
  gmgnCreatedTokens: GmgnCreatedTokens | null;
}

export function PortfolioOverviewSection({ gmgnWalletHoldings, gmgnCreatedTokens }: PortfolioOverviewSectionProps) {
  const holdings = gmgnWalletHoldings?.holdings ?? [];
  const totalTokens = gmgnCreatedTokens
    ? (gmgnCreatedTokens.inner_count ?? 0) + (gmgnCreatedTokens.open_count ?? 0)
    : 0;

  const activeValue = holdings.reduce((sum, h) => sum + (h.usd_value ?? 0), 0);

  // Find best performer (highest profit change)
  const bestPerformer = holdings.length
    ? holdings.reduce((best, h) => (h.profit_change > best.profit_change ? h : best), holdings[0])
    : null;

  // Find worst performer
  const worstPerformer = holdings.length
    ? holdings.reduce((worst, h) => (h.profit_change < worst.profit_change ? h : worst), holdings[0])
    : null;

  // Calculate average ROI
  const avgROI = holdings.length
    ? (holdings.reduce((sum, h) => sum + (h.profit_change ?? 0), 0) / holdings.length) * 100
    : 0;

  const bestAth = gmgnCreatedTokens?.creator_ath_info?.ath_mc
    ? parseFloat(gmgnCreatedTokens.creator_ath_info.ath_mc)
    : 0;

  const portfolioItems = [
    {
      label: "Total Tokens",
      value: totalTokens.toString(),
      icon: <Layers className="w-5 h-5" />,
    },
    {
      label: "Active Value",
      value: `$${activeValue.toLocaleString()}`,
      icon: <DollarSign className="w-5 h-5" />,
    },
    {
      label: "Best Performer",
      value: bestPerformer?.token.symbol ?? "—",
      icon: <TrendingUp className="w-5 h-5" />,
    },
    {
      label: "Worst Performer",
      value: worstPerformer?.token.symbol ?? "—",
      icon: <TrendingDown className="w-5 h-5" />,
    },
    {
      label: "Avg ROI",
      value: `${avgROI.toFixed(0)}%`,
      icon: <TrendingUp className="w-5 h-5" />,
    },
    {
      label: "Best ATH",
      value: bestAth ? `$${(bestAth / 1000000).toFixed(1)}M` : "—",
      icon: <Award className="w-5 h-5" />,
    },
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
              {item.icon}
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
