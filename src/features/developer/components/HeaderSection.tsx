import { motion } from "framer-motion";
import { Copy, ShieldCheck, Rocket, Award, Share2, ExternalLink } from "lucide-react";
import { CircularProgress } from "@/components/CircularProgress";
import { Chip } from "./Chip.tsx";
import { shortAddr, explorerAddr } from "@/lib/rhc";
import type { GmgnWalletStats, GmgnResult } from "../types";
import { unwrapGmgnResult } from "../utils";

interface HeaderSectionProps {
  address: string;
  copied: boolean;
  copy: () => void;
  gmgnWalletStats: GmgnResult<GmgnWalletStats>;
}

export function HeaderSection({ address, copied, copy, gmgnWalletStats }: HeaderSectionProps) {
  const statsData = unwrapGmgnResult(gmgnWalletStats);
  // Derive trust score from GMGN data (fallback to 0 if data not available)
  const winRate = statsData?.winrate ?? 0; // 0-1
  const trustScore = Math.round(winRate * 100);

  // Determine badges based on GMGN common data
  const badges = [];
  if (statsData?.common?.is_blue_verified) {
    badges.push({ label: "X Verified", icon: <ShieldCheck className="w-3 h-3" />, tone: "neon" as const });
  }
  if (statsData?.common?.created_token_count && statsData.common.created_token_count > 1) {
    badges.push({ label: "Token Creator", icon: <Rocket className="w-3 h-3" />, tone: "neon" as const });
  }
  if (statsData?.common?.tags?.includes("smart_money")) {
    badges.push({ label: "Smart Money", icon: <Award className="w-3 h-3" />, tone: "blue" as const });
  }
  // Always have at least one badge for visual appeal
  if (badges.length === 0) {
    badges.push({ label: "On-Chain", icon: <ShieldCheck className="w-3 h-3" />, tone: "neon" as const });
  }

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
              {statsData?.common?.avatar ? (
                <img
                  src={statsData.common.avatar}
                  alt=""
                  className="w-28 h-28 rounded-3xl border-2 border-neon/50 object-cover"
                />
              ) : (
                <div className="w-28 h-28 rounded-3xl border-2 border-neon/50 bg-surface-2 flex items-center justify-center font-mono text-3xl text-neon">
                  {address.slice(2, 6).toUpperCase()}
                </div>
              )}
              <div className="absolute -bottom-3 -right-3 rounded-full bg-background p-2">
                <span className="block w-5 h-5 rounded-full bg-neon animate-pulse" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-2 mb-3">
                {badges.map((badge, i) => (
                  <Chip key={i} icon={badge.icon} label={badge.label} tone={badge.tone} />
                ))}
              </div>

              <h1 className="font-display text-3xl md:text-5xl font-black break-all mb-3">
                {statsData?.common?.name ?? shortAddr(address)}
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
