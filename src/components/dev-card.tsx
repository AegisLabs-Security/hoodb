import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { Star, ShieldCheck } from "lucide-react";
import { shortAddr } from "@/lib/rhc";

export type DevCardData = {
  address: string;
  reputation: number | null;
  reviewCount: number;
  contractsDeployed: number;
  successRate: number;
  verified: boolean;
  lastSeenAt?: string | null;
};

export function DevCard({ dev, className }: { dev: DevCardData; className?: string }) {
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
            <div className="size-11 rounded-full border border-neon/40 bg-surface-2 flex items-center justify-center font-mono text-[10px] text-neon">
              {dev.address.slice(2, 4).toUpperCase()}
            </div>
            <span className="absolute -bottom-1 -right-1 rounded-full bg-background p-0.5">
              <span className="block size-2.5 rounded-full bg-neon animate-pulse" />
            </span>
          </div>
          <div className="min-w-0">
            <div className="font-semibold truncate font-mono text-sm">
              {shortAddr(dev.address)}
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest">
              Robinhood Chain
            </div>
          </div>
        </div>
        {dev.verified && (
          <span className="inline-flex items-center gap-1 rounded-full bg-neon/10 text-neon px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
            <ShieldCheck className="size-3" /> Verified
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="Rep" value={dev.reputation != null ? dev.reputation.toFixed(1) : "—"} icon />
        <Stat label="Deploys" value={dev.contractsDeployed.toString()} />
        <Stat label="Success" value={`${dev.successRate}%`} />
      </div>

      <p className="text-xs text-muted-foreground">
        {dev.reviewCount > 0
          ? `${dev.reviewCount} community review${dev.reviewCount === 1 ? "" : "s"}`
          : "No reviews yet"}
      </p>
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
