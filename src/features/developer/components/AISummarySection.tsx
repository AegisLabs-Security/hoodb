import { motion } from "framer-motion";
import { Bot } from "lucide-react";
import type { GmgnWalletStats, GmgnCreatedTokens, GmgnWalletHoldings, GmgnResult } from "../types";
import { unwrapGmgnResult } from "../utils";

interface AISummarySectionProps {
  gmgnWalletStats: GmgnResult<GmgnWalletStats>;
  gmgnCreatedTokens: GmgnResult<GmgnCreatedTokens>;
  gmgnWalletHoldings: GmgnResult<GmgnWalletHoldings>;
}

export function AISummarySection({ gmgnWalletStats, gmgnCreatedTokens, gmgnWalletHoldings }: AISummarySectionProps) {
  const statsData = unwrapGmgnResult(gmgnWalletStats);
  const createdTokensData = unwrapGmgnResult(gmgnCreatedTokens);
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
