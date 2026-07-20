import { motion } from "framer-motion";
import { Award, Rocket, Star, Activity, Calendar } from "lucide-react";
import type { GmgnWalletStats, GmgnCreatedTokens, GmgnResult } from "../types";
import { unwrapGmgnResult } from "../utils";

interface DeveloperReputationSectionProps {
  gmgnWalletStats: GmgnResult<GmgnWalletStats>;
  gmgnCreatedTokens: GmgnResult<GmgnCreatedTokens>;
}

export function DeveloperReputationSection({ gmgnWalletStats, gmgnCreatedTokens }: DeveloperReputationSectionProps) {
  const statsData = unwrapGmgnResult(gmgnWalletStats);
  const createdTokensData = unwrapGmgnResult(gmgnCreatedTokens);
  // Derive reputation scores from GMGN data
  const winRate = statsData?.winrate ?? 0;
  const launchSuccess = Math.round(winRate * 100);

  const totalTokens = createdTokensData
    ? (createdTokensData.inner_count ?? 0) + (createdTokensData.open_count ?? 0)
    : 0;
  const openRatio = createdTokensData?.open_ratio ? parseFloat(createdTokensData.open_ratio) : 0;
  const communityRating = Math.min(95, Math.round(openRatio * 100 + 50));

  const buyCount = statsData?.buy_count ?? 0;
  const sellCount = statsData?.sell_count ?? 0;

  const totalActivity = buyCount + sellCount;

  const walletActivity =
    totalActivity > 0
      ? Math.min(
          100,
          Math.round(Math.log10(totalActivity + 1) * 20)
        )
      : 50;

  const walletCreationTime = statsData?.common?.created_at;
  let walletAgeScore = 0;
  if (walletCreationTime) {
    const walletAgeDays = Math.floor((Date.now() / 1000 - walletCreationTime) / (60 * 60 * 24));
    walletAgeScore = Math.min(100, Math.round(walletAgeDays / 10));
  }

  const items = [
    { label: "Launch Success", value: launchSuccess, icon: <Rocket className="w-5 h-5" /> },
    { label: "Community Rating", value: communityRating, icon: <Star className="w-5 h-5" /> },
    { label: "Wallet Activity", value: walletActivity, icon: <Activity className="w-5 h-5" /> },
    { label: "Wallet Age", value: walletAgeScore, icon: <Calendar className="w-5 h-5" /> },
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
                {item.icon}
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
                  filter: `drop-shadow(0 0 8px oklch(0.88 0.26 135 / 0.4))`,
                }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
