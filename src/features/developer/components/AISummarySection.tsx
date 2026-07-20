import { motion } from "framer-motion";
import { Bot, AlertTriangle } from "lucide-react";
import type { DevOverview, DeployedContract } from "@/lib/rhc";
import type { GmgnWalletStats, GmgnCreatedTokens, GmgnWalletHoldings, GmgnResult } from "../types";
import { getGmgnErrorMessage, unwrapGmgnResult } from "../utils";

interface AISummarySectionProps {
  gmgnWalletStats: GmgnResult<GmgnWalletStats>;
  gmgnCreatedTokens: GmgnResult<GmgnCreatedTokens>;
  gmgnWalletHoldings: GmgnResult<GmgnWalletHoldings>;
  overview: DevOverview;
  contracts: DeployedContract[];
  avgRating: number | null;
  reviewCount: number;
}

export function AISummarySection({
  gmgnWalletStats,
  gmgnCreatedTokens,
  gmgnWalletHoldings,
  overview,
  contracts,
  avgRating,
  reviewCount,
}: AISummarySectionProps) {
  const statsData = unwrapGmgnResult(gmgnWalletStats);
  const createdTokensData = unwrapGmgnResult(gmgnCreatedTokens);
  const holdingsData = unwrapGmgnResult(gmgnWalletHoldings);
  const gmgnMessage =
    getGmgnErrorMessage(gmgnWalletStats) ??
    getGmgnErrorMessage(gmgnCreatedTokens) ??
    getGmgnErrorMessage(gmgnWalletHoldings);
  const totalTokens = createdTokensData
    ? (createdTokensData.inner_count ?? 0) + (createdTokensData.open_count ?? 0)
    : 0;

  const highMarketCapCount = createdTokensData?.tokens?.filter((t) => t.market_cap && parseFloat(t.market_cap) > 100000).length ?? 0;
  const veryHighMarketCapCount = createdTokensData?.tokens?.filter((t) => t.token_ath_mc && parseFloat(t.token_ath_mc) > 1000000).length ?? 0;

  // Derive risk level from wallet stats (win rate and other factors)
  const winRate = statsData?.winrate ?? 0;
  let riskLevel = "Low";
  if (winRate < 0.3) riskLevel = "High";
  else if (winRate < 0.6) riskLevel = "Medium";

  if (!statsData && !createdTokensData && !holdingsData) {
    const verifiedRatio =
      overview.contractsDeployedCount > 0
        ? Math.round((overview.verifiedContractsCount / overview.contractsDeployedCount) * 100)
        : 0;
    const tokenContracts = contracts.filter((contract) => contract.isToken).length;

    return (
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        className="neon-panel rounded-3xl overflow-hidden border-neon/30"
      >
        <div className="p-8 border-b border-border/60 bg-surface/50 flex items-center gap-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-400/10 text-amber-300">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold">AI Developer Summary</h2>
            <p className="text-xs text-muted-foreground">External provider is currently unavailable</p>
          </div>
        </div>
        <div className="p-8">
          <div className="space-y-4 text-lg leading-relaxed text-muted-foreground/90">
            <p>
              This wallet has been active on Robinhood Chain for{" "}
              <span className="text-neon font-bold">
                {overview.firstSeenAt
                  ? Math.max(0, Math.floor((Date.now() - new Date(overview.firstSeenAt).getTime()) / 86400000))
                  : 0}{" "}
                days
              </span>{" "}
              with <span className="text-neon font-bold">{overview.txCount}</span> on-chain transactions recorded.
            </p>
            <p>
              This developer has deployed{" "}
              <span className="text-neon font-bold">{overview.contractsDeployedCount}</span> contracts, including{" "}
              <span className="text-neon font-bold">{tokenContracts}</span> detected token contracts and{" "}
              <span className="text-neon font-bold">{overview.verifiedContractsCount}</span> verified contracts.
            </p>
            <p>
              The observed transaction success rate is{" "}
              <span className="text-neon font-bold">{overview.successRate}%</span>
              {reviewCount > 0 && avgRating
                ? `, with a community rating of ${avgRating.toFixed(1)}/5 across ${reviewCount} reviews.`
                : "."}
            </p>
            {verifiedRatio > 0 && (
              <p>
                The current contract verification ratio is{" "}
                <span className="text-neon font-bold">{verifiedRatio}%</span>, which indicates a stronger builder reputation profile.
              </p>
            )}
          </div>
          {gmgnMessage && (
            <p className="mt-4 text-xs font-mono text-muted-foreground/80">{gmgnMessage}</p>
          )}
        </div>
      </motion.section>
    );
  }

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
            This developer has launched <span className="text-neon font-bold">{totalTokens} tokens</span> on Robinhood Chain.
          </p>
          {highMarketCapCount > 0 && (
            <p>
              <span className="text-neon font-bold">{highMarketCapCount} tokens</span> reached over $100K market cap
              {veryHighMarketCapCount > 0 && (
                <>
                  , with <span className="text-neon font-bold">{veryHighMarketCapCount} tokens</span> exceeding $1M at their peak
                </>
              )}
              .
            </p>
          )}
          <p>
            Win rate of <span className="text-neon font-bold">{Math.round(winRate * 100)}%</span>. Risk Level: <span className="text-neon font-bold">{riskLevel}</span>.
          </p>
        </div>
      </div>
    </motion.section>
  );
}
