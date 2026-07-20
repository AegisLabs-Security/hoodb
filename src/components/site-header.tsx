import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import logoAsset from "@/assets/hooddb-logo.png.asset.json";
import { Menu, X, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

type Profile = {
  x_handle: string | null;
  x_avatar_url: string | null;
  x_name: string | null;
} | null;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<Profile>(null);
  const [authed, setAuthed] = useState(false);
  const navigate = useNavigate();
  const router = useRouter();
  const qc = useQueryClient();

  useEffect(() => {
    let mounted = true;
    async function load() {
      const { data: s } = await supabase.auth.getSession();
      if (!mounted) return;
      if (!s.session) {
        setAuthed(false);
        setProfile(null);
        return;
      }
      setAuthed(true);
      const { data } = await supabase
        .from("profiles")
        .select("x_handle, x_avatar_url, x_name")
        .eq("id", s.session.user.id)
        .maybeSingle();
      if (mounted) setProfile(data as Profile);
    }
    load();
    const sub = supabase.auth.onAuthStateChange(() => load());
    return () => {
      mounted = false;
      sub.data.subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
    router.invalidate();
  }

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
          {authed ? (
            <div className="ml-3 flex items-center gap-2 rounded-md border border-border pl-2 pr-1 py-1">
              {profile?.x_avatar_url && (
                <img src={profile.x_avatar_url} alt="" className="size-6 rounded-full" />
              )}
              <span className="text-sm font-semibold">@{profile?.x_handle ?? "you"}</span>
              <button
                onClick={signOut}
                className="ml-1 p-1.5 rounded hover:bg-accent"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/auth"
              className="ml-3 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110 transition"
            >
              Sign in with X
            </Link>
          )}
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
          {authed ? (
            <button
              onClick={() => {
                setOpen(false);
                signOut();
              }}
              className="block w-full text-left rounded-md px-3 py-2 text-sm hover:bg-accent"
            >
              Sign out (@{profile?.x_handle ?? "you"})
            </button>
          ) : (
            <Link
              to="/auth"
              onClick={() => setOpen(false)}
              className="block rounded-md px-3 py-2 text-sm bg-primary text-primary-foreground font-semibold"
            >
              Sign in with X
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
