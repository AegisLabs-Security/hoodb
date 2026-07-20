import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { findDev, shortAddr, type Review } from "@/lib/hooddb-data";
import {
  Copy,
  ShieldCheck,
  Flame,
  AlertTriangle,
  Sparkles,
  Star,
  ExternalLink,
  Rocket,
  BarChart3,
  Users,
  Wallet,
  Clock,
} from "lucide-react";

export const Route = createFileRoute("/dev/$address")({
  loader: ({ params }) => {
    const dev = findDev(params.address);
    if (!dev) throw notFound();
    return { dev };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `@${loaderData.dev.handle} — HOODDB` : "Dev — HOODDB" },
      {
        name: "description",
        content: loaderData
          ? `On-chain profile & community reviews for @${loaderData.dev.handle} on Robinhood Chain.`
          : "Dev profile on HOODDB.",
      },
      { property: "og:title", content: loaderData ? `@${loaderData.dev.handle} — HOODDB` : "Dev — HOODDB" },
      { property: "og:description", content: "On-chain profile & community reviews on Robinhood Chain." },
    ],
  }),
  component: DevPage,
  notFoundComponent: () => (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="flex-1 mx-auto max-w-3xl w-full px-4 py-24 text-center">
        <h1 className="font-display text-4xl font-black">Wallet not indexed</h1>
        <p className="mt-3 text-muted-foreground">
          This address hasn't been scanned yet. Submit it to the community
          for tracking.
        </p>
        <Link to="/" className="mt-6 inline-flex rounded-lg bg-primary px-6 py-3 text-sm font-bold text-primary-foreground">
          Back to Scan
        </Link>
      </div>
      <SiteFooter />
    </div>
  ),
});

function DevPage() {
  const { dev } = Route.useLoaderData();
  const [copied, setCopied] = useState(false);
  const [reviews, setReviews] = useState<Review[]>(dev.reviews);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");

  const copy = async () => {
    await navigator.clipboard.writeText(dev.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !author.trim()) return;
    const nr: Review = {
      id: crypto.randomUUID(),
      author: author.startsWith("@") ? author : `@${author}`,
      rating,
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };
    setReviews([nr, ...reviews]);
    setContent("");
    setAuthor("");
  };

  const avg =
    reviews.length === 0
      ? null
      : reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      {/* Profile header */}
      <section className="relative border-b border-border/60">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="relative mx-auto max-w-6xl px-4 md:px-8 py-10 flex flex-col md:flex-row gap-6 md:items-center">
          <div className="relative">
            <img
              src={`https://unavatar.io/x/${dev.handle}`}
              alt={dev.handle}
              className="size-24 rounded-2xl border-2 border-neon/50 bg-surface-2"
            />
            <div className="absolute -bottom-2 -right-2 rounded-full bg-background p-1">
              <span className="block size-3 rounded-full bg-neon animate-pulse" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-2 mb-2">
              {dev.tags.includes("verified") && (
                <Chip icon={<ShieldCheck className="size-3" />} label="Verified" tone="neon" />
              )}
              {dev.tags.includes("hot") && (
                <Chip icon={<Flame className="size-3" />} label="Hot streak" tone="orange" />
              )}
              {dev.tags.includes("flagged") && (
                <Chip icon={<AlertTriangle className="size-3" />} label="Community flagged" tone="red" />
              )}
              {dev.tags.includes("new") && (
                <Chip icon={<Sparkles className="size-3" />} label="New wallet" tone="blue" />
              )}
            </div>
            <h1 className="font-display text-4xl font-black">@{dev.handle}</h1>
            <button
              onClick={copy}
              className="mt-2 font-mono text-sm text-muted-foreground hover:text-neon inline-flex items-center gap-2"
            >
              {shortAddr(dev.address)}
              <Copy className="size-3.5" />
              {copied && <span className="text-neon text-xs">copied</span>}
            </button>
            <p className="mt-3 text-sm max-w-2xl text-muted-foreground">{dev.bio}</p>
          </div>
          <div className="flex gap-2">
            <a
              href={`https://x.com/${dev.handle}`}
              target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm hover:border-neon hover:text-neon"
            >
              X profile <ExternalLink className="size-3.5" />
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-6xl w-full px-4 md:px-8 py-8 grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatBox icon={<Star className="size-4" />} label="Reputation" value={avg != null ? avg.toFixed(1) : "—"} sub={`${reviews.length} reviews`} big />
        <StatBox icon={<Rocket className="size-4" />} label="Launches" value={dev.launches.toString()} />
        <StatBox icon={<BarChart3 className="size-4" />} label="Success rate" value={`${dev.successRate}%`} />
        <StatBox icon={<Wallet className="size-4" />} label="Total volume" value={dev.totalVolume} />
      </section>

      {/* Grid */}
      <section className="mx-auto max-w-6xl w-full px-4 md:px-8 pb-16 grid gap-8 lg:grid-cols-3">
        {/* Launches + Analytics */}
        <div className="lg:col-span-2 space-y-6">
          <div className="neon-panel rounded-xl">
            <div className="p-5 border-b border-border/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Rocket className="size-4 text-neon" />
                <h2 className="font-display text-lg font-bold">Launch history</h2>
              </div>
              <span className="text-xs text-muted-foreground">First seen {dev.firstSeen}</span>
            </div>
            <div className="divide-y divide-border/60">
              {dev.recent.map((l) => (
                <div key={l.id} className="p-5 flex items-center gap-4">
                  <div className="size-10 rounded-lg bg-neon/10 border border-neon/30 flex items-center justify-center font-mono text-xs font-bold text-neon">
                    {l.symbol.slice(0, 3)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{l.name} <span className="text-muted-foreground font-mono text-xs">${l.symbol}</span></div>
                    <div className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                      <Clock className="size-3" /> {timeAgo(l.deployedAt)} • Peak {l.peakMcap}
                    </div>
                  </div>
                  <StatusBadge status={l.status} />
                </div>
              ))}
              {dev.recent.length === 0 && (
                <div className="p-8 text-center text-muted-foreground text-sm">No launches indexed yet.</div>
              )}
            </div>
          </div>

          <div className="neon-panel rounded-xl p-5">
            <div className="flex items-center gap-2">
              <BarChart3 className="size-4 text-neon" />
              <h2 className="font-display text-lg font-bold">Reputation breakdown</h2>
            </div>
            <div className="mt-4 space-y-3">
              {[5, 4, 3, 2, 1].map((n) => {
                const count = reviews.filter((r) => r.rating === n).length;
                const pct = reviews.length ? (count / reviews.length) * 100 : 0;
                return (
                  <div key={n} className="flex items-center gap-3 text-sm">
                    <div className="w-8 text-neon font-mono">{n}★</div>
                    <div className="flex-1 h-2 rounded-full bg-surface-2 overflow-hidden">
                      <div className="h-full bg-neon" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="w-8 text-right text-muted-foreground text-xs">{count}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div className="space-y-6">
          <div className="neon-panel rounded-xl">
            <div className="p-5 border-b border-border/60 flex items-center gap-2">
              <Users className="size-4 text-neon" />
              <h2 className="font-display text-lg font-bold">Community reviews</h2>
            </div>
            <form onSubmit={submit} className="p-5 space-y-3 border-b border-border/60">
              <input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="@your_x_handle"
                className="w-full h-10 rounded-md bg-surface border border-border px-3 text-sm focus:outline-none focus:border-neon"
              />
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    type="button"
                    key={n}
                    onClick={() => setRating(n)}
                    className="p-1"
                    aria-label={`${n} star`}
                  >
                    <Star
                      className={
                        "size-6 " +
                        (n <= rating ? "fill-neon text-neon" : "text-muted-foreground")
                      }
                    />
                  </button>
                ))}
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share your experience with this dev…"
                rows={3}
                className="w-full rounded-md bg-surface border border-border p-3 text-sm focus:outline-none focus:border-neon"
              />
              <button
                type="submit"
                className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-bold hover:brightness-110"
              >
                Post review
              </button>
            </form>
            <div className="divide-y divide-border/60 max-h-[520px] overflow-auto">
              {reviews.length === 0 && (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  No reviews yet. Be the first.
                </div>
              )}
              {reviews.map((r) => (
                <div key={r.id} className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img
                        src={`https://unavatar.io/x/${r.author.replace("@", "")}`}
                        alt={r.author}
                        className="size-7 rounded-full border border-neon/30"
                      />
                      <span className="text-sm font-semibold">{r.author}</span>
                    </div>
                    <div className="text-neon text-xs font-mono">
                      {"★".repeat(r.rating)}
                      <span className="opacity-30">{"★".repeat(5 - r.rating)}</span>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{r.content}</p>
                  <div className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground/60">
                    {timeAgo(r.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function StatBox({
  icon, label, value, sub, big,
}: { icon: React.ReactNode; label: string; value: string; sub?: string; big?: boolean }) {
  return (
    <div className="neon-panel rounded-xl p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
        {icon}{label}
      </div>
      <div className={"mt-1 font-display font-black " + (big ? "text-4xl neon-text" : "text-3xl")}>
        {value}
      </div>
      {sub && <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{sub}</div>}
    </div>
  );
}

function Chip({ icon, label, tone }: { icon: React.ReactNode; label: string; tone: "neon" | "orange" | "red" | "blue" }) {
  const tones = {
    neon: "bg-neon/10 text-neon",
    orange: "bg-orange-500/15 text-orange-300",
    red: "bg-red-500/15 text-red-300",
    blue: "bg-blue-400/15 text-blue-300",
  } as const;
  return (
    <span className={"inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider " + tones[tone]}>
      {icon}{label}
    </span>
  );
}

function StatusBadge({ status }: { status: "live" | "rugged" | "graduated" | "bonding" }) {
  const map = {
    live: "bg-neon/15 text-neon",
    graduated: "bg-blue-400/15 text-blue-300",
    bonding: "bg-orange-400/15 text-orange-300",
    rugged: "bg-red-500/15 text-red-300",
  } as const;
  return (
    <span className={"rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider " + map[status]}>
      {status}
    </span>
  );
}
