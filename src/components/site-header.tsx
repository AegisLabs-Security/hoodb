import { Link } from "@tanstack/react-router";
import logoAsset from "@/assets/hooddb-logo.png.asset.json";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const links = [
    { to: "/", label: "Scan" },
    { to: "/leaderboard", label: "Leaderboard" },
    { to: "/about", label: "About" },
  ] as const;

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 backdrop-blur-xl bg-background/70">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8">
        <Link to="/" className="flex items-center gap-3 group">
          <img
            src={logoAsset.url}
            alt="HOODDB"
            className="h-10 w-10 rounded-md transition-transform group-hover:scale-105"
          />
          <div className="leading-tight">
            <div className="font-display text-lg font-black tracking-wider">
              HOOD<span className="neon-text">DB</span>
            </div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              On-Chain Dev Tracker
            </div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-accent/40"
              activeProps={{ className: "text-neon" }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
            </Link>
          ))}
          <a
            href="https://x.com/hooddb"
            target="_blank"
            rel="noreferrer"
            className="ml-3 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110 transition"
          >
            Launch App
          </a>
        </nav>

        <button
          className="md:hidden p-2 rounded-md hover:bg-accent"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border/60 px-4 py-3 space-y-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="block rounded-md px-3 py-2 text-sm hover:bg-accent"
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
