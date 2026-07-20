import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  useSuspenseQuery,
  useQuery,
  useMutation,
  useQueryClient,
  queryOptions,
} from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import {
  getDevOverview,
  getAddressTxs,
  getDeployedContracts,
} from "@/lib/rhc.functions";
import {
  listReviews,
  postReview,
  deleteMyReview,
  getMyProfile,
} from "@/lib/reviews.functions";
import {
  isValidAddress,
  shortAddr,
  timeAgo,
  computeReputation,
  explorerAddr,
  explorerTx,
  RHC_EXPLORER,
} from "@/lib/rhc";
import { supabase } from "@/integrations/supabase/client";
import {
  Copy,
  ShieldCheck,
  Star,
  ExternalLink,
  Rocket,
  BarChart3,
  Users,
  Wallet,
  Clock,
  Trash2,
  AlertCircle,
  Zap,
} from "lucide-react";

const devQO = (address: string) => ({
  overview: queryOptions({
    queryKey: ["rhc", "overview", address],
    queryFn: () => getDevOverview({ data: { address } }),
    refetchInterval: 15_000,
    staleTime: 5_000,
  }),
  txs: queryOptions({
    queryKey: ["rhc", "txs", address],
    queryFn: () => getAddressTxs({ data: { address } }),
    refetchInterval: 10_000,
    staleTime: 5_000,
  }),
  contracts: queryOptions({
    queryKey: ["rhc", "contracts", address],
    queryFn: () => getDeployedContracts({ data: { address } }),
    refetchInterval: 30_000,
    staleTime: 15_000,
  }),
  reviews: queryOptions({
    queryKey: ["hooddb", "reviews", address],
    queryFn: () => listReviews({ data: { address } }),
    // We're using Supabase realtime for reviews, so polling is a fallback
    refetchInterval: 60_000,
    staleTime: 30_000,
  }),
});

export const Route = createFileRoute("/dev/$address")({
  beforeLoad: ({ params }) => {
    if (!isValidAddress(params.address)) {
      throw new Error("Invalid Robinhood Chain address");
    }
  },
  loader: ({ params, context }) => {
    const q = devQO(params.address.toLowerCase());
    context.queryClient.ensureQueryData(q.overview);
    context.queryClient.ensureQueryData(q.txs);
    context.queryClient.ensureQueryData(q.contracts);
    context.queryClient.ensureQueryData(q.reviews);
  },
  head: ({ params }) => ({
    meta: [
      { title: `${shortAddr(params.address)} — HOODDB` },
      {
        name: "description",
        content: `Live on-chain profile & community reviews for ${shortAddr(params.address)} on Robinhood Chain.`,
      },
      { property: "og:title", content: `${shortAddr(params.address)} — HOODDB` },
      { property: "og:description", content: "On-chain reputation on Robinhood Chain, verifiable via Blockscout." },
    ],
  }),
  component: DevPage,
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="flex-1 mx-auto max-w-3xl w-full px-4 py-24 text-center">
        <h1 className="font-display text-4xl font-black">Address unreadable</h1>
        <p className="mt-3 text-muted-foreground">{error.message}</p>
        <Link to="/" className="mt-6 inline-flex rounded-lg bg-primary px-6 py-3 text-sm font-bold text-primary-foreground">
          Back to Scan
        </Link>
      </div>
      <SiteFooter />
    </div>
  ),
});

function DevPage() {
  const { address: rawAddress } = Route.useParams();
  const address = rawAddress.toLowerCase();
  const q = devQO(address);
  const { data: overview } = useSuspenseQuery(q.overview);
  const { data: txs } = useSuspenseQuery(q.txs);
  const { data: contracts } = useSuspenseQuery(q.contracts);
  const { data: reviews } = useSuspenseQuery(q.reviews);
  const qc = useQueryClient();

  // Realtime subscription for reviews
  useEffect(() => {
    const channel = supabase
      .channel(`reviews:${address}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reviews",
          filter: `address=eq.${address}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ["hooddb", "reviews", address] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [address, qc]);

  const [copied, setCopied] = useState(false);

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;
  const rep = computeReputation(overview, avg, reviews.length);

  const copy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      {/* Hero Section */}
      <section className="relative border-b border-border/60">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="relative mx-auto max-w-7xl px-4 md:px-8 py-12 flex flex-col md:flex-row gap-8 md:items-center">
          <div className="relative shrink-0">
            <div className="size-28 md:size-32 rounded-2xl border-2 border-neon/50 bg-surface-2 flex items-center justify-center font-mono text-2xl md:text-3xl text-neon">
              {address.slice(2, 6).toUpperCase()}
            </div>
            <div className="absolute -bottom-3 -right-3 rounded-full bg-background p-1">
              <span className="block size-4 rounded-full bg-neon animate-pulse" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="inline-flex items-center gap-1 rounded-full border border-neon/30 bg-neon/10 px-3 py-1 text-xs uppercase tracking-widest text-neon">
                <span className="size-1.5 rounded-full bg-neon animate-pulse" /> Live
              </span>
              {overview.isContract && <Chip label="Smart Contract" tone="orange" />}
              {overview.verifiedContractsCount > 0 && (
                <Chip icon={<ShieldCheck className="size-3" />} label={`${overview.verifiedContractsCount} Verified`} tone="neon" />
              )}
              {overview.contractsDeployedCount > 5 && <Chip label="Active Builder" tone="blue" />}
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-black break-all leading-tight">
              {shortAddr(address)}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <button
                onClick={copy}
                className="font-mono text-sm text-muted-foreground hover:text-neon inline-flex items-center gap-2 transition"
              >
                {address}
                <Copy className="size-4" />
                {copied && <span className="text-neon font-bold">copied</span>}
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-6 text-sm text-muted-foreground">
              <span>
                <span className="text-foreground font-bold">Balance:</span> <span className="font-mono">{overview.balance}</span>
              </span>
              <span>
                <span className="text-foreground font-bold">First Seen:</span> {overview.firstSeenAt ? timeAgo(overview.firstSeenAt) : "Unknown"}
              </span>
              <span>
                <span className="text-foreground font-bold">Last Activity:</span> {txs[0] ? timeAgo(txs[0].timestamp) : "N/A"}
              </span>
            </div>
          </div>
          <div className="flex gap-3 shrink-0">
            <a
              href={explorerAddr(address)}
              target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-3 text-sm font-bold hover:border-neon hover:text-neon transition"
            >
              Blockscout <ExternalLink className="size-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="mx-auto max-w-7xl w-full px-4 md:px-8 py-10 grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBox icon={<Star className="size-5" />} label="Reputation" value={rep.score.toFixed(2)} sub={`${reviews.length} Reviews`} big />
        <StatBox icon={<Rocket className="size-5" />} label="Contracts" value={overview.contractsDeployedCount.toString()} sub={`${overview.verifiedContractsCount} Verified`} />
        <StatBox icon={<BarChart3 className="size-5" />} label="Success Rate" value={`${overview.successRate}%`} />
        <StatBox icon={<Wallet className="size-5" />} label="Transactions" value={overview.txCount.toLocaleString()} />
      </section>

      {/* Main Content */}
      <section className="mx-auto max-w-7xl w-full px-4 md:px-8 pb-20 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          {/* Deployed Contracts */}
          <div className="neon-panel rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-border/60 flex items-center justify-between bg-surface/50">
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center justify-center size-10 rounded-lg bg-neon/10 border border-neon/30">
                  <Rocket className="size-5 text-neon" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold">Deployed Contracts</h2>
                  <p className="text-xs text-muted-foreground">All contracts deployed from this wallet</p>
                </div>
              </div>
              <a
                href={`${RHC_EXPLORER}/address/${address}/contract-creations`}
                target="_blank" rel="noreferrer"
                className="text-sm text-muted-foreground hover:text-neon font-semibold transition"
              >
                View on Blockscout →
              </a>
            </div>
            <div className="divide-y divide-border/60">
              {contracts.map((c, i) => (
                <a
                  key={c.address}
                  href={explorerAddr(c.address)}
                  target="_blank" rel="noreferrer"
                  className="p-6 flex items-center gap-4 hover:bg-neon/5 transition group"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="size-12 rounded-xl bg-neon/10 border border-neon/30 flex items-center justify-center font-mono text-sm font-bold text-neon shrink-0">
                    {c.tokenSymbol?.slice(0, 3) ?? c.address.slice(2, 5).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-lg truncate group-hover:text-neon transition">
                      {c.name ?? "Unnamed Contract"}{" "}
                      {c.tokenSymbol && <span className="text-muted-foreground font-mono text-sm">${c.tokenSymbol}</span>}
                    </div>
                    <div className="text-xs text-muted-foreground inline-flex items-center gap-2 font-mono mt-1">
                      <Clock className="size-3" /> {timeAgo(c.deployedAt)} · {shortAddr(c.address)}
                    </div>
                  </div>
                  {c.verified ? (
                    <span className="rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider bg-neon/15 text-neon shrink-0">
                      Verified
                    </span>
                  ) : (
                    <span className="rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider bg-orange-500/15 text-orange-300 shrink-0">
                      Unverified
                    </span>
                  )}
                </a>
              ))}
              {contracts.length === 0 && (
                <div className="p-12 text-center text-muted-foreground">
                  <div className="text-4xl mb-3">🚀</div>
                  <p className="text-lg font-semibold">No contracts deployed yet</p>
                  <p className="text-sm">Check back later for deployments</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="neon-panel rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-border/60 flex items-center gap-3 bg-surface/50">
              <div className="inline-flex items-center justify-center size-10 rounded-lg bg-neon/10 border border-neon/30">
                <BarChart3 className="size-5 text-neon" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold">Recent Activity</h2>
                <p className="text-xs text-muted-foreground">Latest transactions from this wallet</p>
              </div>
            </div>
            <div className="divide-y divide-border/60 max-h-[500px] overflow-auto">
              {txs.slice(0, 20).map((t, i) => (
                <a
                  key={t.hash}
                  href={explorerTx(t.hash)}
                  target="_blank" rel="noreferrer"
                  className="p-5 flex items-center gap-4 text-sm hover:bg-neon/5 transition group"
                >
                  <span
                    className={
                      "size-3 rounded-full shrink-0 " +
                      (t.status === "success" ? "bg-neon" : t.status === "pending" ? "bg-orange-400 animate-pulse" : "bg-red-500")
                    }
                  />
                  <span className="font-mono text-xs text-muted-foreground w-28 truncate shrink-0">{shortAddr(t.hash)}</span>
                  <span className="flex-1 truncate font-medium group-hover:text-neon transition">
                    {t.method ?? (t.createdContract ? "Contract Deployment" : "Transfer")}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">{timeAgo(t.timestamp)}</span>
                </a>
              ))}
              {txs.length === 0 && (
                <div className="p-12 text-center text-muted-foreground">
                  <div className="text-4xl mb-3">📊</div>
                  <p className="text-lg font-semibold">No transactions found</p>
                </div>
              )}
            </div>
          </div>

          {/* Reputation Breakdown */}
          <div className="neon-panel rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="inline-flex items-center justify-center size-10 rounded-lg bg-neon/10 border border-neon/30">
                <BarChart3 className="size-5 text-neon" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold">Reputation Breakdown</h2>
                <p className="text-xs text-muted-foreground">How the reputation score is calculated</p>
              </div>
            </div>
            <div className="space-y-5">
              {rep.parts.map((p, i) => (
                <div key={p.label} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground font-medium">{p.label}</span>
                    <span className="text-neon font-bold">{p.detail}</span>
                  </div>
                  <div className="h-3 rounded-full bg-surface-2 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-neon/80 to-neon transition-all duration-500 ease-out" 
                      style={{ width: `${Math.min((p.value / 5) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-8">
          <ReviewsPanel address={address} onChanged={() => qc.invalidateQueries({ queryKey: ["hooddb", "reviews", address] })} />
          
          {/* Quick Stats Card */}
          <div className="neon-panel rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="inline-flex items-center justify-center size-10 rounded-lg bg-neon/10 border border-neon/30">
                <Zap className="size-5 text-neon" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold">Quick Stats</h2>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Verified Ratio</span>
                <span className="font-bold text-neon">
                  {overview.contractsDeployedCount > 0 
                    ? `${Math.round((overview.verifiedContractsCount / overview.contractsDeployedCount) * 100)}%` 
                    : "0%"}
                </span>
              </div>
              <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
                <div 
                  className="h-full bg-neon" 
                  style={{ width: `${overview.contractsDeployedCount > 0 ? (overview.verifiedContractsCount / overview.contractsDeployedCount) * 100 : 0}%` }}
                />
              </div>
              
              <div className="pt-2 border-t border-border/60 flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Avg Rating</span>
                <span className="font-bold text-neon">
                  {avg ? `${avg.toFixed(1)} ★` : "No reviews"}
                </span>
              </div>
              
              <div className="pt-2 border-t border-border/60 flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Last Contract</span>
                <span className="font-mono text-xs">
                  {contracts[0] ? timeAgo(contracts[0].deployedAt) : "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function ReviewsPanel({ address, onChanged }: { address: string; onChanged: () => void }) {
  const q = devQO(address);
  const { data: reviews } = useSuspenseQuery(q.reviews);

  const [authed, setAuthed] = useState<boolean | null>(null);
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setAuthed(!!data.session);
    });
    const sub = supabase.auth.onAuthStateChange((_e, s) => setAuthed(!!s));
    return () => {
      mounted = false;
      sub.data.subscription.unsubscribe();
    };
  }, []);

  const profileQuery = useQuery({
    queryKey: ["profile", "me"],
    queryFn: () => getMyProfile(),
    enabled: !!authed,
    retry: false,
  });

  const postFn = useServerFn(postReview);
  const delFn = useServerFn(deleteMyReview);
  const post = useMutation({
    mutationFn: (input: { rating: number; content: string }) =>
      postFn({ data: { address, ...input } }),
    onSuccess: onChanged,
  });
  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: onChanged,
  });

  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");

  return (
    <div className="neon-panel rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-border/60 flex items-center gap-3 bg-surface/50">
        <div className="inline-flex items-center justify-center size-10 rounded-lg bg-neon/10 border border-neon/30">
          <Users className="size-5 text-neon" />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold">Community Reviews</h2>
          <p className="text-xs text-muted-foreground">{reviews.length} review{reviews.length !== 1 ? 's' : ''} from verified users</p>
        </div>
      </div>
      
      {authed ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (content.trim().length < 5) return;
            post.mutate({ rating, content: content.trim() }, {
              onSuccess: () => setContent(""),
            });
          }}
          className="p-6 space-y-4 border-b border-border/60"
        >
          <div className="text-sm text-muted-foreground">
            Posting as{" "}
            <span className="text-neon font-bold">@{profileQuery.data?.x_handle ?? "you"}</span>
          </div>
          
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                type="button"
                key={n}
                onClick={() => setRating(n)}
                className="p-2 rounded-lg hover:bg-neon/10 transition"
                aria-label={`${n} star`}
              >
                <Star className={"size-8 " + (n <= rating ? "fill-neon text-neon drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" : "text-muted-foreground")} />
              </button>
            ))}
          </div>
          
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your experience with this developer…"
            rows={4}
            maxLength={1000}
            className="w-full rounded-xl bg-surface border border-border p-4 text-sm focus:outline-none focus:border-neon focus:ring-2 focus:ring-neon/20 transition resize-none"
          />
          
          <button
            type="submit"
            disabled={post.isPending}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:brightness-110 disabled:opacity-50 transition"
          >
            {post.isPending ? "Posting Review…" : "Post Review"}
          </button>
          
          {post.error && (
            <div className="text-sm text-red-400 flex items-center gap-2 bg-red-500/10 rounded-lg p-3">
              <AlertCircle className="size-4" /> {(post.error as Error).message}
            </div>
          )}
        </form>
      ) : (
        <div className="p-6 border-b border-border/60 text-sm text-muted-foreground">
          <p className="mb-3">Want to leave a review?</p>
          <Link 
            to="/auth" 
            className="text-neon hover:underline font-bold inline-flex items-center gap-2"
          >
            Sign in with X <ExternalLink className="size-3" />
          </Link>
          <p className="mt-2 text-xs">Every review is tied to a verified X handle to prevent spam.</p>
        </div>
      )}
      
      <div className="divide-y divide-border/60 max-h-[600px] overflow-auto">
        {reviews.length === 0 && (
          <div className="p-12 text-center text-muted-foreground">
            <div className="text-4xl mb-3">⭐</div>
            <p className="text-lg font-semibold">No reviews yet</p>
            <p className="text-sm mt-1">Be the first to review this developer!</p>
          </div>
        )}
        
        {reviews.map((r) => (
          <div key={r.id} className="p-6 hover:bg-surface/30 transition">
            <div className="flex items-center justify-between mb-3">
              <a
                href={r.x_handle ? `https://x.com/${r.x_handle}` : "#"}
                target="_blank" rel="noreferrer"
                className="flex items-center gap-3 hover:text-neon transition"
              >
                {r.x_avatar_url ? (
                  <img 
                    src={r.x_avatar_url} 
                    alt="" 
                    className="size-10 rounded-full border-2 border-neon/30 object-cover" 
                  />
                ) : (
                  <div className="size-10 rounded-full bg-surface-2 border-2 border-neon/30" />
                )}
                <div className="flex flex-col">
                  <span className="text-base font-bold flex items-center gap-2">
                    @{r.x_handle ?? "anon"}
                    {r.x_verified && <ShieldCheck className="size-4 text-neon" />}
                  </span>
                </div>
              </a>
              
              <div className="flex items-center gap-3">
                <div className="text-neon font-mono">
                  {"★".repeat(r.rating)}
                  <span className="opacity-30">{"★".repeat(5 - r.rating)}</span>
                </div>
                
                {profileQuery.data?.id === r.author_id && (
                  <button
                    onClick={() => del.mutate(r.id)}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition"
                    aria-label="Delete review"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
            </div>
            
            <p className="text-base text-foreground/90 leading-relaxed">{r.content}</p>
            
            <div className="mt-3 text-xs uppercase tracking-widest text-muted-foreground/70 font-mono">
              {timeAgo(r.created_at)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatBox({
  icon, label, value, sub, big,
}: { icon: React.ReactNode; label: string; value: string; sub?: string; big?: boolean }) {
  return (
    <div className="neon-panel rounded-2xl p-6 hover:border-neon/40 transition-all duration-300">
      <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground mb-3">
        <div className="inline-flex items-center justify-center size-8 rounded-lg bg-neon/10 text-neon">
          {icon}
        </div>
        {label}
      </div>
      <div className={"font-display font-black transition-all duration-300 " + (big ? "text-5xl neon-text" : "text-4xl")}>
        {value}
      </div>
      {sub && <div className="text-xs uppercase tracking-widest text-muted-foreground mt-2 font-semibold">{sub}</div>}
    </div>
  );
}

function Chip({ icon, label, tone }: { icon?: React.ReactNode; label: string; tone: "neon" | "orange" | "red" | "blue" }) {
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
