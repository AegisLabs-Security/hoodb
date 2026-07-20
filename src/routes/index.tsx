import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import bgAsset from "@/assets/hooddb-bg.png.asset.json";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { DevCard } from "@/components/dev-card";
import { activityFeed, devs, findDev, stats } from "@/lib/hooddb-data";
import {
  Search,
  ScanLine,
  Rocket,
  Droplets,
  ShieldCheck,
  Star,
  Box,
  Code2,
  BarChart3,
  Users,
  Zap,
  Globe2,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "HOODDB — Track Robinhood Chain Devs & Reputation" },
      {
        name: "description",
        content:
          "Paste a wallet to instantly see launch history, deployed contracts, and community reviews for any Robinhood Chain developer.",
      },
      { property: "og:url", content: "/" },
    ],
  }),
});

function iconFor(kind: string) {
  switch (kind) {
    case "deploy": return <Box className="size-4 text-neon" />;
    case "launch": return <Rocket className="size-4 text-neon" />;
    case "liquidity": return <Droplets className="size-4 text-neon" />;
    case "verified": return <ShieldCheck className="size-4 text-neon" />;
    case "review": return <Star className="size-4 text-neon" />;
    default: return <Zap className="size-4 text-neon" />;
  }
}

function Home() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const scan = (e: React.FormEvent) => {
    e.preventDefault();
    const v = q.trim();
    if (!v) return setErr("Enter a wallet address or handle");
    const dev = findDev(v);
    if (dev) {
      navigate({ to: "/dev/$address", params: { address: dev.address } });
    } else if (v.length >= 20) {
      navigate({ to: "/dev/$address", params: { address: v } });
    } else {
      setErr("No match. Try a full wallet address or a known handle.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden scanline">
        <div
          className="absolute inset-0 opacity-40 bg-cover bg-center"
          style={{ backgroundImage: `url(${bgAsset.url})` }}
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
              Instant on-chain intelligence and community reputation for
              Robinhood Chain developers. Attach a wallet to explore launch
              history, deployed contracts, token creations, and authentic
              community reviews — all in one place.
            </p>

            <form onSubmit={scan} className="mt-8 flex flex-col sm:flex-row gap-2 max-w-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  value={q}
                  onChange={(e) => { setQ(e.target.value); setErr(null); }}
                  placeholder="Paste wallet address or @handle…"
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

            <div className="mt-6 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="opacity-70">Try:</span>
              {devs.slice(0, 3).map((d) => (
                <button
                  key={d.address}
                  onClick={() => { setQ(d.handle); setErr(null); }}
                  className="rounded-md border border-border px-2 py-1 hover:border-neon hover:text-neon transition"
                >
                  @{d.handle}
                </button>
              ))}
            </div>
          </div>

          {/* Stats strip */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { l: "Devs tracked", v: stats.devs.toLocaleString(), i: <Users className="size-4" /> },
              { l: "Launches indexed", v: stats.launches.toLocaleString(), i: <Rocket className="size-4" /> },
              { l: "Community reviews", v: stats.reviews.toLocaleString(), i: <Star className="size-4" /> },
              { l: "Total volume seen", v: stats.volume, i: <BarChart3 className="size-4" /> },
            ].map((s) => (
              <div key={s.l} className="neon-panel rounded-xl p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-neon">
                  {s.i}{s.l}
                </div>
                <div className="mt-2 font-display text-3xl font-black">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live activity ticker */}
      <section className="border-y border-border/60 bg-surface/30 overflow-hidden">
        <div className="flex animate-ticker whitespace-nowrap py-3">
          {[...activityFeed, ...activityFeed].map((a, i) => (
            <div key={i} className="flex items-center gap-2 px-6 text-sm text-muted-foreground">
              {iconFor(a.icon)}
              <span>{a.label}</span>
              <span className="font-mono text-neon">{a.meta}</span>
              <span className="text-xs opacity-60">• {a.time}</span>
              <span className="mx-4 opacity-30">|</span>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
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
            {
              icon: <Code2 className="size-5" />,
              title: "Developer Tracking",
              body: "Every wallet, every deployment. Watch what any Robinhood Chain dev ships in real time.",
            },
            {
              icon: <Rocket className="size-5" />,
              title: "Launch History",
              body: "Complete token launch timeline with peak market cap, status, and post-launch behaviour.",
            },
            {
              icon: <ShieldCheck className="size-5" />,
              title: "Reputation Score",
              body: "Weighted score from verified on-chain patterns and community-authored reviews.",
            },
            {
              icon: <Users className="size-5" />,
              title: "Community Reviews",
              body: "Real people, real opinions. Post reviews signed by X handles — no astroturfing.",
            },
            {
              icon: <BarChart3 className="size-5" />,
              title: "Deep Analytics",
              body: "Success rate, volume moved, holder distributions, and rug pattern detection.",
            },
            {
              icon: <Globe2 className="size-5" />,
              title: "On-Chain Data",
              body: "Real-time, verified. Directly indexed from Robinhood Chain — no middlemen.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="neon-panel rounded-xl p-6 group hover:border-neon/60 transition"
            >
              <div className="inline-flex items-center justify-center size-11 rounded-lg bg-neon/10 text-neon border border-neon/30 group-hover:animate-pulse-glow">
                {f.icon}
              </div>
              <h3 className="mt-4 font-display text-xl font-bold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* COMMUNITY DIRECTORY */}
      <section className="mx-auto max-w-7xl px-4 md:px-8 pb-20">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-neon">Community Directory</div>
            <h2 className="mt-2 font-display text-3xl md:text-4xl font-black">
              Devs on the radar
            </h2>
          </div>
          <Link
            to="/leaderboard"
            className="text-sm text-neon hover:underline underline-offset-4"
          >
            View full leaderboard →
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {devs.map((d) => <DevCard key={d.address} dev={d} />)}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-4 md:px-8 pb-24">
        <div className="relative overflow-hidden rounded-2xl neon-panel p-10 md:p-14 text-center animate-pulse-glow">
          <div className="absolute inset-0 grid-bg opacity-30" />
          <div className="relative">
            <h3 className="font-display text-3xl md:text-5xl font-black">
              Know a dev worth <span className="neon-text">tracking?</span>
            </h3>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Submit a wallet and let the community verify. All submissions are
              public and cross-checked with on-chain data.
            </p>
            <a
              href="https://t.me/hooddb"
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex h-12 px-8 items-center rounded-lg bg-primary text-primary-foreground font-bold uppercase tracking-wider hover:brightness-110"
            >
              Submit a Dev
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
