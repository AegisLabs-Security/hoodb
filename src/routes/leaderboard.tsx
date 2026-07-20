import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { DevCard, type DevCardData } from "@/components/dev-card";
import { listTrackedDevs, getReviewAggregates } from "@/lib/reviews.functions";
import { Search } from "lucide-react";

const leaderboardQO = queryOptions({
  queryKey: ["hooddb", "leaderboard"],
  queryFn: async () => {
    const list = await listTrackedDevs();
    if (list.length === 0) return { list, agg: {} as Record<string, { avg: number; count: number }> };
    const agg = await getReviewAggregates({ data: { addresses: list.map((d) => d.address) } });
    return { list, agg };
  },
  refetchInterval: 60_000,
  staleTime: 30_000,
});

export const Route = createFileRoute("/leaderboard")({
  loader: ({ context }) => context.queryClient.ensureQueryData(leaderboardQO),
  component: LeaderboardPage,
  errorComponent: ({ error }) => <div className="p-8 text-red-400">{error.message}</div>,
  head: () => ({
    meta: [
      { title: "Leaderboard — HOODDB" },
      {
        name: "description",
        content: "Ranked list of Robinhood Chain devs by community reputation.",
      },
      { property: "og:title", content: "Leaderboard — HOODDB" },
      { property: "og:description", content: "Ranked Robinhood Chain devs by community reputation." },
      { property: "og:url", content: "/leaderboard" },
    ],
    links: [{ rel: "canonical", href: "/leaderboard" }],
  }),
});

type Sort = "reputation" | "reviews" | "recent";

function LeaderboardPage() {
  const { data } = useSuspenseQuery(leaderboardQO);
  const [sort, setSort] = useState<Sort>("reputation");
  const [q, setQ] = useState("");

  const items = useMemo<DevCardData[]>(() => {
    return data.list.map((d) => {
      const a = data.agg[d.address];
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
  }, [data]);

  const sorted = useMemo(() => {
    return [...items]
      .filter((d) => (q ? d.address.toLowerCase().includes(q.toLowerCase()) : true))
      .sort((a, b) => {
        if (sort === "reputation") return (b.reputation ?? -1) - (a.reputation ?? -1);
        if (sort === "reviews") return b.reviewCount - a.reviewCount;
        return (new Date(b.lastSeenAt ?? 0).getTime() - new Date(a.lastSeenAt ?? 0).getTime());
      });
  }, [items, sort, q]);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <section className="mx-auto max-w-7xl w-full px-4 md:px-8 py-12">
        <div className="text-xs uppercase tracking-[0.3em] text-neon">Rankings</div>
        <h1 className="mt-2 font-display text-4xl md:text-5xl font-black">
          Dev <span className="neon-text">Leaderboard</span>
        </h1>
        <p className="mt-3 text-muted-foreground max-w-2xl">
          Live rankings of every Robinhood Chain wallet the community is tracking.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter by wallet address…"
              className="w-full h-11 rounded-lg bg-surface border border-border pl-9 pr-3 text-sm focus:outline-none focus:border-neon"
            />
          </div>
          <div className="flex gap-1 rounded-lg border border-border p-1 bg-surface/50">
            {(["reputation", "reviews", "recent"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={
                  "px-4 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition " +
                  (sort === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")
                }
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sorted.map((d, i) => (
            <div key={d.address} className="relative">
              <div className="absolute -top-2 -left-2 z-10 rounded-full bg-primary text-primary-foreground text-xs font-black size-8 flex items-center justify-center border-2 border-background">
                #{i + 1}
              </div>
              <DevCard dev={d} />
            </div>
          ))}
          {sorted.length === 0 && (
            <div className="col-span-full text-center text-muted-foreground py-20">
              No tracked devs yet. Scan a wallet on the home page and post a review to start tracking.
            </div>
          )}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
