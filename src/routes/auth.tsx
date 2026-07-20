import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useQueryClient } from "@tanstack/react-query";

type Search = { error?: string; next?: string };

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    error: typeof s.error === "string" ? s.error : undefined,
    next: typeof s.next === "string" ? s.next : undefined,
  }),
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Sign in with X — HOODDB" },
      {
        name: "description",
        content:
          "Sign in to HOODDB with your X (Twitter) account to post verified reviews.",
      },
    ],
  }),
});

type Session = {
  handle: string | null;
  name: string | null;
  avatar: string | null;
} | null;

function AuthPage() {
  const { error, next } = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [status, setStatus] = useState<"checking" | "signed-in" | "signed-out">(
    "checking",
  );
  const [session, setSession] = useState<Session>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      if (!data.session) {
        setStatus("signed-out");
        setSession(null);
        return;
      }
      const { data: prof } = await supabase
        .from("profiles")
        .select("x_handle, x_name, x_avatar_url")
        .eq("id", data.session.user.id)
        .maybeSingle();
      if (!mounted) return;
      setSession({
        handle: prof?.x_handle ?? null,
        name: prof?.x_name ?? null,
        avatar: prof?.x_avatar_url ?? null,
      });
      setStatus("signed-in");
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
    setSession(null);
    setStatus("signed-out");
  }

  const startHref = next
    ? `/api/public/auth/x/start?next=${encodeURIComponent(next)}`
    : "/api/public/auth/x/start";

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <section className="flex-1 mx-auto max-w-md w-full px-4 py-16 flex flex-col justify-center">
        <div className="neon-panel rounded-2xl p-8 text-center">
          <div className="text-xs uppercase tracking-[0.3em] text-neon">
            Sign in
          </div>
          <h1 className="mt-2 font-display text-3xl font-black">
            Connect your X account
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            HOODDB uses your X (Twitter) handle so every review is signed and
            impossible to impersonate. We only read your public profile — never
            your DMs.
          </p>

          {error && (
            <div className="mt-6 flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-left text-sm text-red-200">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <div>
                <div className="font-semibold">Sign-in failed</div>
                <div className="text-red-200/80 break-words">{error}</div>
              </div>
            </div>
          )}

          {status === "checking" && (
            <div className="mt-8 text-sm text-muted-foreground">
              Checking session…
            </div>
          )}

          {status === "signed-in" && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-3 rounded-lg border border-neon/40 bg-neon/5 px-3 py-3 text-left">
                {session?.avatar && (
                  <img
                    src={session.avatar}
                    alt=""
                    className="size-10 rounded-full"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-sm font-semibold">
                    <CheckCircle2 className="size-4 text-neon" />
                    Signed in as {session?.name ?? session?.handle ?? "you"}
                  </div>
                  {session?.handle && (
                    <div className="text-xs text-muted-foreground">
                      @{session.handle}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate({ to: next ?? "/" })}
                  className="flex-1 h-11 rounded-lg bg-primary text-primary-foreground font-semibold hover:brightness-110"
                >
                  Continue
                </button>
                <button
                  onClick={signOut}
                  className="inline-flex items-center gap-2 h-11 rounded-lg border border-border px-4 text-sm font-semibold hover:bg-accent"
                >
                  <LogOut className="size-4" />
                  Sign out
                </button>
              </div>
            </div>
          )}

          {status === "signed-out" && (
            <a
              href={startHref}
              className="mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground font-bold uppercase tracking-wider hover:brightness-110 animate-pulse-glow"
            >
              <svg
                viewBox="0 0 24 24"
                className="size-5 fill-current"
                aria-hidden
              >
                <path d="M18.244 2H21.5l-7.5 8.573L22.5 22h-6.906l-5.406-6.994L4.02 22H.765l8.02-9.163L.5 2h7.086l4.88 6.462L18.244 2z" />
              </svg>
              Sign in with X
            </a>
          )}

          <div className="mt-6 text-[10px] uppercase tracking-widest text-muted-foreground">
            <Link to="/" className="hover:text-neon">
              Back to home
            </Link>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
