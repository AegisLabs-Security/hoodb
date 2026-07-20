import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { DevCard } from "@/components/dev-card";
import { devs } from "@/lib/hooddb-data";
import { Search } from "lucide-react";

export const Route = createFileRoute("/leaderboard")({
  component: LeaderboardPage,
  head: () => ({
    meta: [
      { title: "Leaderboard — HOODDB" },
      {
        name: "description",
        content: "Ranked list of Robinhood Chain devs by reputation, launches, and community reviews.",
      },
      { property: "og:title", content: "Leaderboard — HOODDB" },
      { property: "og:description", content: "Ranked list of Robinhood Chain devs by reputation and community reviews." },
      { property: "og:url", content: "/leaderboard" },
    ],
    links: [{ rel: "canonical", href: "/leaderboard" }],
  }),
});

type Sort = "reputation" | "launches" | "reviews";

function LeaderboardPage() {
  const [sort, setSort] = useState<Sort>("reputation");
  const [q, setQ] = useState("");

  const sorted = [...devs]
    .filter((d) =>
      !q
        ? true
        : d.handle.toLowerCase().includes(q.toLowerCase()) ||
          d.address.toLowerCase().includes(q.toLowerCase()),
    )
    .sort((a, b) => {
      if (sort === "reputation") return (b.reputation ?? -1) - (a.reputation ?? -1);
      if (sort === "launches") return b.launches - a.launches;
      return b.reviewCount - a.reviewCount;
    });

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <section className="mx-auto max-w-7xl w-full px-4 md:px-8 py-12">
        <div className="text-xs uppercase tracking-[0.3em] text-neon">Rankings</div>
        <h1 className="mt-2 font-display text-4xl md:text-5xl font-black">
          Dev <span className="neon-text">Leaderboard</span>
        </h1>
        <p className="mt-3 text-muted-foreground max-w-2xl">
          Ranked by weighted reputation. Combines on-chain success signals with
          community reviews.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter by handle or wallet…"
              className="w-full h-11 rounded-lg bg-surface border border-border pl-9 pr-3 text-sm focus:outline-none focus:border-neon"
            />
          </div>
          <div className="flex gap-1 rounded-lg border border-border p-1 bg-surface/50">
            {(["reputation", "launches", "reviews"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={
                  "px-4 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition " +
                  (sort === s
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground")
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
              No devs match your filter.
            </div>
          )}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
