import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Sign in with X — HOODDB" },
      { name: "description", content: "Sign in to HOODDB with your X (Twitter) account to post verified reviews." },
    ],
  }),
});

function AuthPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data.session) navigate({ to: "/", replace: true });
      else setChecking(false);
    });
    return () => {
      mounted = false;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <section className="flex-1 mx-auto max-w-md w-full px-4 py-16 flex flex-col justify-center">
        <div className="neon-panel rounded-2xl p-8 text-center">
          <div className="text-xs uppercase tracking-[0.3em] text-neon">Sign in</div>
          <h1 className="mt-2 font-display text-3xl font-black">Connect your X account</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            HOODDB uses your X (Twitter) handle so every review is signed and impossible to
            impersonate. We only read your public profile — never your DMs.
          </p>
          {checking ? (
            <div className="mt-8 text-sm text-muted-foreground">Checking session…</div>
          ) : (
            <a
              href="/api/public/auth/x/start"
              className="mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground font-bold uppercase tracking-wider hover:brightness-110 animate-pulse-glow"
            >
              <svg viewBox="0 0 24 24" className="size-5 fill-current" aria-hidden>
                <path d="M18.244 2H21.5l-7.5 8.573L22.5 22h-6.906l-5.406-6.994L4.02 22H.765l8.02-9.163L.5 2h7.086l4.88 6.462L18.244 2zm-2.421 18h1.909L7.32 4H5.29l10.533 16z" />
              </svg>
              Sign in with X
            </a>
          )}
          <div className="mt-6 text-[10px] uppercase tracking-widest text-muted-foreground">
            <Link to="/" className="hover:text-neon">Back to home</Link>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
