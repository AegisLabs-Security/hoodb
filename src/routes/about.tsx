import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import bannerAsset from "@/assets/hooddb-banner.png.asset.json";
import { ShieldCheck, Users, Globe2, BarChart3, Rocket, Code2 } from "lucide-react";

export const Route = createFileRoute("/about")({
  component: About,
  head: () => ({
    meta: [
      { title: "About — HOODDB" },
      {
        name: "description",
        content: "HOODDB is the on-chain dev tracker for Robinhood Chain — on-chain data, community reviews, transparent reputation.",
      },
      { property: "og:title", content: "About HOODDB" },
      { property: "og:description", content: "The on-chain dev tracker for Robinhood Chain." },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
});

function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <section className="mx-auto max-w-5xl w-full px-4 md:px-8 py-12">
        <div className="text-xs uppercase tracking-[0.3em] text-neon">About HOODDB</div>
        <h1 className="mt-2 font-display text-5xl font-black">
          The hood knows <span className="neon-text">who ships.</span>
        </h1>
        <p className="mt-5 text-lg text-muted-foreground max-w-3xl">
          HOODDB is instant on-chain intelligence and community reputation for
          Robinhood Chain developers. Attach a wallet to explore launch history,
          deployed contracts, token creations, and authentic community reviews —
          all in one place.
        </p>

        <div className="mt-10 rounded-2xl overflow-hidden neon-border">
          <img src={bannerAsset.url} alt="HOODDB banner" className="w-full" />
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {[
            { icon: <Globe2 className="size-5" />, title: "On-chain, real-time", body: "Indexed directly from Robinhood Chain. No middlemen, no delays." },
            { icon: <Users className="size-5" />, title: "Community-owned", body: "Every review is signed by an X handle. No astroturf, no anon spam." },
            { icon: <ShieldCheck className="size-5" />, title: "Transparent scoring", body: "Reputation combines verified on-chain patterns with community verdicts." },
          ].map((f) => (
            <div key={f.title} className="neon-panel rounded-xl p-6">
              <div className="inline-flex size-11 items-center justify-center rounded-lg bg-neon/10 text-neon border border-neon/30">{f.icon}</div>
              <h3 className="mt-4 font-display text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl font-bold">How reputation is calculated</h2>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-3"><BarChart3 className="size-4 mt-0.5 text-neon shrink-0" /><span>Weighted average of community reviews from verified X handles.</span></li>
              <li className="flex gap-3"><Rocket className="size-4 mt-0.5 text-neon shrink-0" /><span>Launch success rate: tokens that graduated vs rugged or abandoned.</span></li>
              <li className="flex gap-3"><Code2 className="size-4 mt-0.5 text-neon shrink-0" /><span>Contract verification, LP lock, and post-launch behaviour signals.</span></li>
              <li className="flex gap-3"><ShieldCheck className="size-4 mt-0.5 text-neon shrink-0" /><span>Bundle/snipe detection reduces score for suspicious patterns.</span></li>
            </ul>
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold">What you can do</h2>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li>• Paste a wallet and get an instant dev profile.</li>
              <li>• Browse the leaderboard of top Robinhood Chain devs.</li>
              <li>• Post signed reviews to reward legit builders and flag rugs.</li>
              <li>• Track new launches in real time from the community ticker.</li>
            </ul>
            <Link
              to="/"
              className="mt-6 inline-flex rounded-lg bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:brightness-110"
            >
              Scan a wallet →
            </Link>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
