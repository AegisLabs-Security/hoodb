import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { Star, ShieldCheck, Flame, AlertTriangle, Sparkles } from "lucide-react";
import type { Dev } from "@/lib/hooddb-data";
import { shortAddr } from "@/lib/hooddb-data";

export function DevCard({ dev, className }: { dev: Dev; className?: string }) {
  return (
    <Link
      to="/dev/$address"
      params={{ address: dev.address }}
      className={cn(
        "group relative flex flex-col gap-3 rounded-xl neon-panel p-5 transition-all hover:-translate-y-0.5 hover:border-neon/60",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <img
              src={`https://unavatar.io/x/${dev.handle}`}
              alt={dev.handle}
              className="size-11 rounded-full border border-neon/40 bg-surface-2"
              loading="lazy"
            />
            <span className="absolute -bottom-1 -right-1 rounded-full bg-background p-0.5">
              <span className="block size-2.5 rounded-full bg-neon animate-pulse" />
            </span>
          </div>
          <div className="min-w-0">
            <div className="font-semibold truncate">@{dev.handle}</div>
            <div className="font-mono text-xs text-muted-foreground truncate">
              {shortAddr(dev.address)}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-1">
          {dev.tags.includes("verified") && (
            <span className="inline-flex items-center gap-1 rounded-full bg-neon/10 text-neon px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
              <ShieldCheck className="size-3" /> Verified
            </span>
          )}
          {dev.tags.includes("hot") && (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/15 text-orange-300 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
              <Flame className="size-3" /> Hot
            </span>
          )}
          {dev.tags.includes("flagged") && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 text-red-300 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
              <AlertTriangle className="size-3" /> Flagged
            </span>
          )}
          {dev.tags.includes("new") && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-400/15 text-blue-300 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
              <Sparkles className="size-3" /> New
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="Rep" value={dev.reputation != null ? dev.reputation.toFixed(1) : "—"} icon />
        <Stat label="Launches" value={dev.launches.toString()} />
        <Stat label="Success" value={`${dev.successRate}%`} />
      </div>

      {dev.reviews[0] ? (
        <p className="text-sm text-muted-foreground line-clamp-2 border-l-2 border-neon/40 pl-3">
          "{dev.reviews[0].content}"
        </p>
      ) : (
        <p className="text-sm text-muted-foreground italic">No reviews yet</p>
      )}
    </Link>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: boolean }) {
  return (
    <div className="rounded-lg bg-background/40 py-2">
      <div className="flex items-center justify-center gap-1 text-sm font-bold">
        {icon && <Star className="size-3.5 fill-neon text-neon" />}
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
