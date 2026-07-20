import { Link } from "@tanstack/react-router";
import logoSrc from "@/assets/hooddb-logo.png";

const XIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M18.244 2H21l-6.52 7.45L22 22h-6.828l-4.77-6.24L4.8 22H2l7.02-8.02L2 2h6.914l4.31 5.71L18.244 2Zm-2.394 18h1.65L7.29 4H5.5l10.35 16Z" />
  </svg>
);
const TelegramIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M9.999 15.2 9.86 19.1c.4 0 .58-.17.79-.38l1.9-1.82 3.94 2.88c.72.4 1.24.19 1.44-.67l2.61-12.23c.24-1.09-.4-1.52-1.1-1.26L3.7 9.98c-1.06.41-1.05 1-.18 1.27l3.94 1.23 9.14-5.77c.43-.28.83-.13.5.16" />
  </svg>
);

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 mt-24">
      <div className="mx-auto max-w-7xl px-4 md:px-8 py-12 grid gap-10 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-3">
            <img src={logoSrc} alt="HOODDB" className="h-10 w-10 rounded-md" />
            <div>
              <div className="font-display text-lg font-black tracking-wider">
                HOOD<span className="neon-text">DB</span>
              </div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                On-Chain Dev Tracker
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground max-w-sm">
            Instant on-chain intelligence and community reputation for Robinhood
            Chain developers.
          </p>
        </div>

        <div>
          <div className="text-xs uppercase tracking-widest text-neon">Explore</div>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link to="/" className="hover:text-neon">Scan a wallet</Link></li>
            <li><Link to="/leaderboard" className="hover:text-neon">Leaderboard</Link></li>
            <li><Link to="/about" className="hover:text-neon">About</Link></li>
          </ul>
        </div>

        <div>
          <div className="text-xs uppercase tracking-widest text-neon">Community</div>
          <div className="mt-4 flex gap-3">
            <a
              href="https://x.com/Hooddb_"
              target="_blank"
              rel="noreferrer"
              className="group flex items-center gap-2 rounded-lg border border-border/60 px-4 py-2 text-sm hover:border-neon hover:text-neon transition"
            >
              <XIcon className="size-4" />
              <span>Follow on X</span>
            </a>
            <a
              href="https://t.me/HOODDB"
              target="_blank"
              rel="noreferrer"
              className="group flex items-center gap-2 rounded-lg border border-border/60 px-4 py-2 text-sm hover:border-neon hover:text-neon transition"
            >
              <TelegramIcon className="size-4" />
              <span>Telegram</span>
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="mx-auto max-w-7xl px-4 md:px-8 py-5 text-xs text-muted-foreground flex flex-col md:flex-row items-center justify-between gap-2">
          <div>© {new Date().getFullYear()} HOODDB — All signal, no noise.</div>
          <div className="font-mono">Robinhood Chain • Real-time • Verified</div>
        </div>
      </div>
    </footer>
  );
}
