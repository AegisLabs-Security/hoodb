import { ArrowUpRight, RadioTower } from "lucide-react";
import type { RobinhoodNewPairsResult } from "@/lib/dexscreener.functions";
import { RobinhoodNewPairCard } from "./robinhood-new-pair-card";

type RobinhoodNewPairsSectionProps = {
  result: RobinhoodNewPairsResult;
};

export function RobinhoodNewPairsSection({
  result,
}: RobinhoodNewPairsSectionProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-neon">
            <RadioTower className="size-4" />
            Robinhood New Pairs
          </div>
          <h2 className="mt-3 font-display text-4xl font-black md:text-5xl">
            Fresh market flow, straight from the chain.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Discover newly active Robinhood trading pairs with live liquidity,
            price action, and launch-time visibility before they disappear into
            the noise.
          </p>
        </div>

        <a
          href="https://dexscreener.com/robinhood"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-sm font-semibold text-neon transition hover:underline underline-offset-4"
        >
          Open live market view
          <ArrowUpRight className="size-4" />
        </a>
      </div>

      {!result.success && result.pairs.length === 0 ? (
        <div className="mt-10 rounded-[28px] border border-amber-400/20 bg-amber-400/5 p-8">
          <div className="text-xs uppercase tracking-[0.3em] text-amber-300">
            Live Feed Limited
          </div>
          <h3 className="mt-3 font-display text-2xl font-black text-foreground">
            Market discovery is temporarily unavailable.
          </h3>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            {result.error} Refresh in a moment to retry the live market query.
          </p>
        </div>
      ) : (
        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {result.pairs.map((pair) => (
            <RobinhoodNewPairCard key={pair.pairAddress} pair={pair} />
          ))}
        </div>
      )}
    </section>
  );
}
