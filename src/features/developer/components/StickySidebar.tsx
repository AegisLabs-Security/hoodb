import { motion } from "framer-motion";
import { Copy, ExternalLink, BarChart3, Zap, Share2, QrCode } from "lucide-react";
import { explorerAddr } from "@/lib/rhc";

interface StickySidebarProps {
  address: string;
  copied: boolean;
  copy: () => void;
  reputation: number;
  avgRating: number | null;
  latestReview: any;
}

export function StickySidebar({ address, copied, copy, reputation, avgRating, latestReview }: StickySidebarProps) {
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
