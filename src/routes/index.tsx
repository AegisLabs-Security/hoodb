import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import bgSrc from "@/assets/hooddb-web-backgroud.png";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { DevCard, type DevCardData } from "@/components/dev-card";
import { getGlobalStats, getLatestNetworkTxs } from "@/lib/rhc.functions";
import { listTrackedDevs, getReviewAggregates } from "@/lib/reviews.functions";
import { isValidAddress, shortAddr, timeAgo, RHC_EXPLORER } from "@/lib/rhc";
import {
  Search,
  ScanLine,
  Rocket,
  ShieldCheck,
  Star,
  Box,
  Code2,
  BarChart3,
  Users,
  Zap,
  Globe2,
} from "lucide-react";

function ClientOnly({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);
  return isClient ? <>{children}</> : null;
}

const globalStatsQO = queryOptions({
  queryKey: ["rhc", "stats"],
  queryFn: () => getGlobalStats(),
  refetchInterval: 30_000,
  staleTime: 15_000,
});
const latestTxsQO = queryOptions({
  queryKey: ["rhc", "latest-txs"],
  queryFn: () => getLatestNetworkTxs(),
  refetchInterval: 15_000,
  staleTime: 10_000,
});
const trackedDevsQO = queryOptions({
  queryKey: ["hooddb", "tracked"],
  queryFn: async () => {
    const list = await listTrackedDevs();
    if (list.length === 0) return { list, agg: {} as Record<string, { avg: number; count: number }> };
    const agg = await getReviewAggregates({ data: { addresses: list.map((d) => d.address) } });
    return { list, agg };
  },
  refetchInterval: 60_000,
  staleTime: 30_000,
});

export const Route = createFileRoute("/")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(globalStatsQO);
    context.queryClient.ensureQueryData(latestTxsQO);
    context.queryClient.ensureQueryData(trackedDevsQO);
  },
  component: Home,
  errorComponent: ({ error }) => <div className="p-8 text-red-400">{error.message}</div>,
  head: () => ({
    meta: [
      { title: "HOODDB — Track Robinhood Chain Devs & Reputation" },
      {
        name: "description",
        content:
          "Paste a Robinhood Chain wallet to instantly see launch history, deployed contracts, and community reviews — all verifiable on Blockscout.",
      },
      { property: "og:title", content: "HOODDB — On-Chain Dev Intel for Robinhood Chain" },
      { property: "og:description", content: "Live on-chain reputation, verified via Blockscout + X." },
      { property: "og:url", content: "/" },
    ],
  }),
});

function iconForMethod(method: string | null, createdContract: string | null) {
  if (createdContract) return <Box className="size-4 text-neon" />;
  if (!method) return <Zap className="size-4 text-neon" />;
  const m = method.toLowerCase();
  if (m.includes("mint") || m.includes("deploy")) return <Rocket className="size-4 text-neon" />;
  if (m.includes("approve") || m.includes("verify")) return <ShieldCheck className="size-4 text-neon" />;
  return <Zap className="size-4 text-neon" />;
}

function Home() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const { data: stats } = useSuspenseQuery(globalStatsQO);
  const { data: latest } = useSuspenseQuery(latestTxsQO);
  const { data: tracked } = useSuspenseQuery(trackedDevsQO);

  const scan = (e: React.FormEvent) => {
    e.preventDefault();
    const v = q.trim();
    if (!v) return setErr("Enter a Robinhood Chain wallet address");
    if (!isValidAddress(v)) return setErr("Not a valid EVM address (0x… 42 chars).");
    navigate({ to: "/dev/$address", params: { address: v.toLowerCase() } });
  };

  const cards: DevCardData[] = tracked.list.slice(0, 9).map((d) => {
    const a = tracked.agg[d.address];
    return {
      address: d.address,
      reputation: a?.count ? a.avg : null,
      reviewCount: a?.count ?? 0,
      contractsDeployed: 0,
      successRate: 0,
      verified: false,
      lastSeenAt: d.last_seen_at,
    };
  });

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <section className="relative overflow-hidden scanline">
        <div
          className="absolute inset-0 opacity-40 bg-cover bg-center"
          style={{ backgroundImage: `url(${bgSrc})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
        <div className="absolute inset-0 grid-bg opacity-40" />

        <div className="relative mx-auto max-w-7xl px-4 md:px-8 pt-16 md:pt-24 pb-16 md:pb-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-neon/30 bg-neon/10 px-3 py-1 text-xs uppercase tracking-widest text-neon">
              <span className="size-1.5 rounded-full bg-neon animate-pulse" />
              Live on Robinhood Chain
            </div>
            <h1 className="mt-6 font-display text-5xl md:text-7xl font-black leading-[0.95]">
              On-chain <span className="neon-text">dev intel</span>,<br />
              community verdicts.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl">
              Paste any Robinhood Chain wallet to see live launch history,
              deployed contracts, and community reviews — every data point
              linked back to Blockscout for you to verify yourself.
            </p>

            <form onSubmit={scan} className="mt-8 flex flex-col sm:flex-row gap-2 max-w-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  value={q}
                  onChange={(e) => { setQ(e.target.value); setErr(null); }}
                  placeholder="Paste wallet address (0x…)"
                  className="w-full h-14 rounded-lg bg-surface/80 border border-neon/30 pl-11 pr-4 font-mono text-sm focus:outline-none focus:border-neon focus:ring-2 focus:ring-neon/30 backdrop-blur"
                />
              </div>
              <button
                type="submit"
                className="h-14 px-8 rounded-lg bg-primary text-primary-foreground font-bold uppercase tracking-wider hover:brightness-110 animate-pulse-glow inline-flex items-center gap-2 justify-center"
              >
                <ScanLine className="size-4" /> Scan
              </button>
            </form>
            {err && <div className="mt-2 text-sm text-red-400">{err}</div>}
          </div>

          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { l: "Total transactions", v: stats.totalTxs?.toLocaleString("en-US") ?? "—", i: <BarChart3 className="size-4" /> },
              { l: "Addresses", v: stats.totalAddresses?.toLocaleString("en-US") ?? "—", i: <Users className="size-4" /> },
              { l: "Blocks", v: stats.totalBlocks?.toLocaleString("en-US") ?? "—", i: <Box className="size-4" /> },
              { l: "Avg block time", v: stats.avgBlockTime ? `${(stats.avgBlockTime / 1000).toFixed(1)}s` : "—", i: <Zap className="size-4" /> },
            ].map((s) => (
              <div key={s.l} className="neon-panel rounded-xl p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-neon">
                  {s.i}{s.l}
                </div>
                <div className="mt-2 font-display text-3xl font-black">
                  <ClientOnly>{s.v}</ClientOnly>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border/60 bg-surface/30 overflow-hidden">
        <div className="flex animate-ticker whitespace-nowrap py-3">
          {[...latest, ...latest].map((t, i) => (
            <a
              key={i}
              href={`${RHC_EXPLORER}/tx/${t.hash}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-6 text-sm text-muted-foreground hover:text-neon"
            >
              {iconForMethod(t.method, t.createdContract)}
              <span>{t.method ?? (t.createdContract ? "Contract deployed" : "Transaction")}</span>
              <span className="font-mono text-neon">{shortAddr(t.from)}</span>
              <span className="text-xs opacity-60">• {timeAgo(t.timestamp)}</span>
              <span className="mx-4 opacity-30">|</span>
            </a>
          ))}
          {latest.length === 0 && (
            <div className="px-6 text-sm text-muted-foreground">Waiting for live activity…</div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 md:px-8 py-20">
        <div className="text-center max-w-2xl mx-auto">
          <div className="text-xs uppercase tracking-[0.3em] text-neon">What you get</div>
          <h2 className="mt-3 font-display text-4xl md:text-5xl font-black">
            Every signal, one dashboard.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Track dev activity. Analyze reputation. Discover legit builders.
          </p>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: <Code2 className="size-5" />, title: "Developer Tracking", body: "Every wallet, every deployment — pulled live from Blockscout." },
            { icon: <Rocket className="size-5" />, title: "Launch History", body: "Complete deployment timeline with verification status and success signals." },
            { icon: <ShieldCheck className="size-5" />, title: "Reputation Score", body: "Weighted score from on-chain patterns + X-verified community reviews." },
            { icon: <Users className="size-5" />, title: "X-Signed Reviews", body: "Every review is tied to a real X handle. No astroturfing, no bots." },
            { icon: <BarChart3 className="size-5" />, title: "Deep Analytics", body: "Success rate, verification ratio, contract count — all cross-checked." },
            { icon: <Globe2 className="size-5" />, title: "Fully Verifiable", body: "Every data point links back to the block explorer. Trust nothing — check everything." },
          ].map((f) => (
            <div key={f.title} className="neon-panel rounded-xl p-6 group hover:border-neon/60 transition">
              <div className="inline-flex items-center justify-center size-11 rounded-lg bg-neon/10 text-neon border border-neon/30 group-hover:animate-pulse-glow">
                {f.icon}
              </div>
              <h3 className="mt-4 font-display text-xl font-bold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 md:px-8 pb-20">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-neon">Community Directory</div>
            <h2 className="mt-2 font-display text-3xl md:text-4xl font-black">Devs on the radar</h2>
          </div>
          <Link to="/leaderboard" className="text-sm text-neon hover:underline underline-offset-4">
            View full leaderboard →
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((d) => <DevCard key={d.address} dev={d} />)}
          {cards.length === 0 && (
            <div className="col-span-full neon-panel rounded-xl p-10 text-center text-muted-foreground">
              No devs tracked yet. Sign in with X, scan a wallet, and post the first review.
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 md:px-8 pb-24">
        <div className="relative overflow-hidden rounded-2xl neon-panel p-10 md:p-14 text-center animate-pulse-glow">
          <div className="absolute inset-0 grid-bg opacity-30" />
          <div className="relative">
            <h3 className="font-display text-3xl md:text-5xl font-black">
              Know a dev worth <span className="neon-text">tracking?</span>
            </h3>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Scan their wallet, verify their contracts on-chain, and post a signed review.
            </p>
            <a
              href="https://t.me/hooddb"
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex h-12 px-8 items-center rounded-lg bg-primary text-primary-foreground font-bold uppercase tracking-wider hover:brightness-110"
            >
              Join the community
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
