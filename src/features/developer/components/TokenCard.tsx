import { motion } from "framer-motion";
import { TrendingUp, Award, AlertCircle, Clock, ExternalLink, BarChart3, Users, Droplets, DollarSign } from "lucide-react";
import { explorerAddr, timeAgo } from "@/lib/rhc";
import type { GmgnCreatedTokens } from "../types";

type TokenCardProps = {
  token: GmgnCreatedTokens["tokens"][0];
  index: number;
};

export function TokenCard({ token, index }: TokenCardProps) {
  // Determine status based on is_open
  const status: "LIVE" | "GRADUATED" | "DEAD" = token.is_open ? "GRADUATED" : "LIVE";

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

  const StatusIcon = statusIcons[status];

  const marketCap = token.market_cap ? parseFloat(token.market_cap) : 0;
  const athMarketCap = token.token_ath_mc ? parseFloat(token.token_ath_mc) : 0;
  const liquidity = token.liquidity_usd ? parseFloat(token.liquidity_usd) : 0;
  const volume24h = token.volume_24h ? parseFloat(token.volume_24h) : 0;

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
          {token.logo ? (
            <img
              src={token.logo}
              alt={token.symbol}
              className="w-14 h-14 rounded-2xl border border-neon/30 object-cover shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-neon/10 border border-neon/30 flex items-center justify-center shrink-0">
              <span className="font-mono text-xs font-bold text-neon">
                {token.symbol.slice(0, 3).toUpperCase()}
              </span>
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="font-bold text-xl truncate group-hover:text-neon transition">
                {token.name || token.symbol}
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              Launched {timeAgo(token.create_timestamp * 1000)}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1">
              <DollarSign className="w-3 h-3" /> Market Cap
            </span>
            <span className="font-mono font-bold text-neon">
              {marketCap > 0 ? `$${marketCap.toLocaleString()}` : "—"}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1">
              <Award className="w-3 h-3" /> ATH
            </span>
            <span className="font-mono font-bold text-neon/80">
              {athMarketCap > 0 ? `$${athMarketCap.toLocaleString()}` : "—"}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1">
              <Droplets className="w-3 h-3" /> Liquidity
            </span>
            <span className="font-mono font-bold text-neon/60">
              {liquidity > 0 ? `$${liquidity.toLocaleString()}` : "—"}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1">
              <Users className="w-3 h-3" /> Holders
            </span>
            <span className="font-mono font-bold text-neon/40">
              {token.holder_count?.toLocaleString() || "—"}
            </span>
          </div>
        </div>

        {/* Status & Links */}
        <div className="flex flex-col lg:flex-row items-end lg:items-center gap-3 shrink-0">
          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest ${statusColors[status]}`}>
            <StatusIcon className="w-4 h-4" />
            {status}
          </span>
          <div className="flex gap-2">
            <a
              href={explorerAddr(token.token_address)}
              target="_blank"
              rel="noreferrer"
              className="p-3 rounded-xl border border-border hover:border-neon hover:text-neon transition"
              title="View on Blockscout"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <a
              href={`https://gmgn.ai/robinhood/token/${token.token_address}`}
              target="_blank"
              rel="noreferrer"
              className="p-3 rounded-xl border border-border hover:border-neon hover:text-neon transition"
              title="View on GMGN"
            >
              <BarChart3 className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
