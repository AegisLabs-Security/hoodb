import { ArrowUpRight, CandlestickChart, Droplets, Flame, Sparkles } from "lucide-react";
import { explorerToken, shortAddr } from "@/lib/rhc";
import { cn } from "@/lib/utils";
import type { RobinhoodNewPair } from "@/lib/dexscreener.functions";

type RobinhoodNewPairCardProps = {
  pair: RobinhoodNewPair;
  className?: string;
};

function formatCompactCurrency(value: number | null): string {
  if (value == null || Number.isNaN(value) || value <= 0) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: value >= 1_000_000 ? "compact" : "standard",
    maximumFractionDigits: value >= 1 ? 0 : 6,
  }).format(value);
}

function formatPrice(value: number | null): string {
  if (value == null || Number.isNaN(value) || value <= 0) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: value < 0.01 ? 4 : 2,
    maximumFractionDigits: value < 0.01 ? 8 : 2,
  }).format(value);
}

function initialFromSymbol(symbol: string): string {
  const trimmed = symbol.trim();
  return trimmed.slice(0, 2).toUpperCase() || "RH";
}

export function RobinhoodNewPairCard({
  pair,
  className,
}: RobinhoodNewPairCardProps) {
  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-[28px] border border-neon/20 bg-surface/60 transition-all duration-300 hover:-translate-y-1 hover:border-neon/50 hover:shadow-[0_0_40px_rgba(0,255,136,0.14)]",
        className,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,255,136,0.18),transparent_45%)] opacity-80" />

      <div className="relative">
        <div className="relative h-40 overflow-hidden border-b border-white/5 bg-background/70">
          {pair.headerUrl ? (
            <img
              src={pair.headerUrl}
              alt={`${pair.tokenName} cover`}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,rgba(0,255,136,0.18),rgba(9,15,23,0.95))]">
              <Sparkles className="size-9 text-neon/80" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/45 to-transparent" />

          <div className="absolute left-4 right-4 top-4 flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1 rounded-full border border-neon/30 bg-background/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-neon backdrop-blur">
              <Flame className="size-3" />
              New Pair
            </span>
            <span className="rounded-full border border-white/10 bg-background/75 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground backdrop-blur">
              {pair.ageLabel}
            </span>
          </div>

          <div className="absolute bottom-4 left-4 right-4 flex items-end gap-3">
            {pair.imageUrl ? (
              <img
                src={pair.imageUrl}
                alt={pair.tokenSymbol}
                className="size-14 rounded-2xl border border-white/10 object-cover shadow-lg"
              />
            ) : (
              <div className="flex size-14 items-center justify-center rounded-2xl border border-neon/30 bg-background/80 font-mono text-sm font-bold text-neon">
                {initialFromSymbol(pair.tokenSymbol)}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate font-display text-2xl font-black text-foreground">
                  {pair.tokenName}
                </h3>
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-muted-foreground">
                <span>{pair.tokenSymbol}</span>
                <span className="opacity-30">/</span>
                <span>{pair.quoteSymbol}</span>
                <span className="opacity-30">•</span>
                <span>{pair.dexId}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5 p-5">
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Market Cap" value={formatCompactCurrency(pair.marketCapUsd ?? pair.fdvUsd)} />
            <Stat label="Liquidity" value={formatCompactCurrency(pair.liquidityUsd)} />
            <Stat label="1H Volume" value={formatCompactCurrency(pair.volumeH1Usd)} />
            <Stat label="Price" value={formatPrice(pair.priceUsd)} />
          </div>

          <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/5 bg-background/40 px-4 py-3">
            <div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                1H Trade Flow
              </div>
              <div className="mt-1 font-mono text-sm text-foreground">
                {pair.buysH1} buys / {pair.sellsH1} sells
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                Token
              </div>
              <div className="mt-1 font-mono text-sm text-neon">{shortAddr(pair.tokenAddress)}</div>
            </div>
          </div>

          {pair.description ? (
            <p className="line-clamp-3 min-h-[60px] text-sm text-muted-foreground">
              {pair.description}
            </p>
          ) : (
            <div className="min-h-[60px] text-sm text-muted-foreground">
              Fresh Robinhood pair with live price, liquidity, and transaction flow.
            </div>
          )}

          <div className="flex items-center gap-3">
            <a
              href={pair.pairUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-4 font-semibold text-primary-foreground transition hover:brightness-110"
            >
              <CandlestickChart className="size-4" />
              Open Chart
            </a>
            <a
              href={explorerToken(pair.tokenAddress)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-neon/30 px-4 text-neon transition hover:bg-neon/10"
              title="View token on Blockscout"
            >
              <ArrowUpRight className="size-4" />
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-background/35 p-4">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
        <Droplets className="size-3 text-neon/80" />
        {label}
      </div>
      <div className="mt-2 font-display text-2xl font-black text-foreground">{value}</div>
    </div>
  );
}
