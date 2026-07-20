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
} from "lucide-react";

const devQO = (address: string) => ({
  overview: queryOptions({
    queryKey: ["rhc", "overview", address],
    queryFn: () => getDevOverview({ data: { address } }),
    refetchInterval: 30_000,
    staleTime: 15_000,
  }),
  txs: queryOptions({
    queryKey: ["rhc", "txs", address],
    queryFn: () => getAddressTxs({ data: { address } }),
    refetchInterval: 30_000,
    staleTime: 15_000,
  }),
  contracts: queryOptions({
    queryKey: ["rhc", "contracts", address],
    queryFn: () => getDeployedContracts({ data: { address } }),
    refetchInterval: 60_000,
    staleTime: 30_000,
  }),
  reviews: queryOptions({
    queryKey: ["hooddb", "reviews", address],
    queryFn: () => listReviews({ data: { address } }),
    refetchInterval: 30_000,
    staleTime: 15_000,
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

      <section className="relative border-b border-border/60">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="relative mx-auto max-w-6xl px-4 md:px-8 py-10 flex flex-col md:flex-row gap-6 md:items-center">
          <div className="relative">
            <div className="size-24 rounded-2xl border-2 border-neon/50 bg-surface-2 flex items-center justify-center font-mono text-xl text-neon">
              {address.slice(2, 6).toUpperCase()}
            </div>
            <div className="absolute -bottom-2 -right-2 rounded-full bg-background p-1">
              <span className="block size-3 rounded-full bg-neon animate-pulse" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-2 mb-2">
              {overview.isContract && (
                <Chip label="Smart Contract" tone="orange" />
              )}
              {overview.verifiedContractsCount > 0 && (
                <Chip icon={<ShieldCheck className="size-3" />} label={`${overview.verifiedContractsCount} verified`} tone="neon" />
              )}
              {overview.contractsDeployedCount > 5 && (
                <Chip label="Active builder" tone="blue" />
              )}
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-black break-all">
              {shortAddr(address)}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={copy}
                className="font-mono text-xs text-muted-foreground hover:text-neon inline-flex items-center gap-2"
              >
                {address}
                <Copy className="size-3.5" />
                {copied && <span className="text-neon">copied</span>}
              </button>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Balance: <span className="text-foreground font-mono">{overview.balance}</span> · First seen{" "}
              {overview.firstSeenAt ? timeAgo(overview.firstSeenAt) : "unknown"}
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href={explorerAddr(address)}
              target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm hover:border-neon hover:text-neon"
            >
              Blockscout <ExternalLink className="size-3.5" />
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl w-full px-4 md:px-8 py-8 grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatBox icon={<Star className="size-4" />} label="Reputation" value={rep.score.toFixed(2)} sub={`${reviews.length} reviews`} big />
        <StatBox icon={<Rocket className="size-4" />} label="Contracts" value={overview.contractsDeployedCount.toString()} sub={`${overview.verifiedContractsCount} verified`} />
        <StatBox icon={<BarChart3 className="size-4" />} label="Success rate" value={`${overview.successRate}%`} />
        <StatBox icon={<Wallet className="size-4" />} label="Transactions" value={overview.txCount.toLocaleString()} />
      </section>

      <section className="mx-auto max-w-6xl w-full px-4 md:px-8 pb-16 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="neon-panel rounded-xl">
            <div className="p-5 border-b border-border/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Rocket className="size-4 text-neon" />
                <h2 className="font-display text-lg font-bold">Deployed contracts</h2>
              </div>
              <a
                href={`${RHC_EXPLORER}/address/${address}/contract-creations`}
                target="_blank" rel="noreferrer"
                className="text-xs text-muted-foreground hover:text-neon"
              >
                verify on Blockscout →
              </a>
            </div>
            <div className="divide-y divide-border/60">
              {contracts.map((c) => (
                <a
                  key={c.address}
                  href={explorerAddr(c.address)}
                  target="_blank" rel="noreferrer"
                  className="p-5 flex items-center gap-4 hover:bg-neon/5 transition"
                >
                  <div className="size-10 rounded-lg bg-neon/10 border border-neon/30 flex items-center justify-center font-mono text-[10px] font-bold text-neon">
                    {c.tokenSymbol?.slice(0, 3) ?? c.address.slice(2, 5).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">
                      {c.name ?? "Unnamed contract"}{" "}
                      {c.tokenSymbol && <span className="text-muted-foreground font-mono text-xs">${c.tokenSymbol}</span>}
                    </div>
                    <div className="text-xs text-muted-foreground inline-flex items-center gap-1.5 font-mono">
                      <Clock className="size-3" /> {timeAgo(c.deployedAt)} · {shortAddr(c.address)}
                    </div>
                  </div>
                  {c.verified ? (
                    <span className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-neon/15 text-neon">Verified</span>
                  ) : (
                    <span className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-orange-500/15 text-orange-300">Unverified</span>
                  )}
                </a>
              ))}
              {contracts.length === 0 && (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No contracts deployed from this wallet.
                </div>
              )}
            </div>
          </div>

          <div className="neon-panel rounded-xl">
            <div className="p-5 border-b border-border/60 flex items-center gap-2">
              <BarChart3 className="size-4 text-neon" />
              <h2 className="font-display text-lg font-bold">Recent activity</h2>
            </div>
            <div className="divide-y divide-border/60 max-h-[420px] overflow-auto">
              {txs.slice(0, 15).map((t) => (
                <a
                  key={t.hash}
                  href={explorerTx(t.hash)}
                  target="_blank" rel="noreferrer"
                  className="p-4 flex items-center gap-3 text-sm hover:bg-neon/5"
                >
                  <span
                    className={
                      "size-2 rounded-full " +
                      (t.status === "success" ? "bg-neon" : t.status === "pending" ? "bg-orange-400" : "bg-red-500")
                    }
                  />
                  <span className="font-mono text-xs text-muted-foreground w-24 truncate">{shortAddr(t.hash)}</span>
                  <span className="flex-1 truncate">{t.method ?? (t.createdContract ? "Contract deploy" : "Transfer")}</span>
                  <span className="text-xs text-muted-foreground">{timeAgo(t.timestamp)}</span>
                </a>
              ))}
              {txs.length === 0 && (
                <div className="p-8 text-center text-muted-foreground text-sm">No transactions found.</div>
              )}
            </div>
          </div>

          <div className="neon-panel rounded-xl p-5">
            <div className="flex items-center gap-2">
              <BarChart3 className="size-4 text-neon" />
              <h2 className="font-display text-lg font-bold">Reputation breakdown</h2>
            </div>
            <div className="mt-4 space-y-3">
              {rep.parts.map((p) => (
                <div key={p.label} className="flex items-center gap-3 text-sm">
                  <div className="w-40 text-muted-foreground">{p.label}</div>
                  <div className="flex-1 h-2 rounded-full bg-surface-2 overflow-hidden">
                    <div className="h-full bg-neon" style={{ width: `${(p.value / 5) * 100}%` }} />
                  </div>
                  <div className="w-40 text-right text-xs text-muted-foreground">{p.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <ReviewsPanel address={address} onChanged={() => qc.invalidateQueries({ queryKey: ["hooddb", "reviews", address] })} />
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
    <div className="neon-panel rounded-xl">
      <div className="p-5 border-b border-border/60 flex items-center gap-2">
        <Users className="size-4 text-neon" />
        <h2 className="font-display text-lg font-bold">Community reviews</h2>
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
          className="p-5 space-y-3 border-b border-border/60"
        >
          <div className="text-xs text-muted-foreground">
            Posting as{" "}
            <span className="text-neon">@{profileQuery.data?.x_handle ?? "you"}</span>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                type="button"
                key={n}
                onClick={() => setRating(n)}
                className="p-1"
                aria-label={`${n} star`}
              >
                <Star className={"size-6 " + (n <= rating ? "fill-neon text-neon" : "text-muted-foreground")} />
              </button>
            ))}
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your experience with this dev…"
            rows={3}
            maxLength={1000}
            className="w-full rounded-md bg-surface border border-border p-3 text-sm focus:outline-none focus:border-neon"
          />
          <button
            type="submit"
            disabled={post.isPending}
            className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-bold hover:brightness-110 disabled:opacity-50"
          >
            {post.isPending ? "Posting…" : "Post review"}
          </button>
          {post.error && (
            <div className="text-xs text-red-400 flex items-center gap-1">
              <AlertCircle className="size-3" /> {(post.error as Error).message}
            </div>
          )}
        </form>
      ) : (
        <div className="p-5 border-b border-border/60 text-sm text-muted-foreground">
          <Link to="/auth" className="text-neon hover:underline">Sign in with X</Link> to post a
          signed review. Every review is tied to a verified X handle.
        </div>
      )}
      <div className="divide-y divide-border/60 max-h-[520px] overflow-auto">
        {reviews.length === 0 && (
          <div className="p-6 text-center text-muted-foreground text-sm">
            No reviews yet. Be the first.
          </div>
        )}
        {reviews.map((r) => (
          <div key={r.id} className="p-5">
            <div className="flex items-center justify-between">
              <a
                href={r.x_handle ? `https://x.com/${r.x_handle}` : "#"}
                target="_blank" rel="noreferrer"
                className="flex items-center gap-2 hover:text-neon"
              >
                {r.x_avatar_url ? (
                  <img src={r.x_avatar_url} alt="" className="size-7 rounded-full border border-neon/30" />
                ) : (
                  <div className="size-7 rounded-full bg-surface-2 border border-neon/30" />
                )}
                <span className="text-sm font-semibold">@{r.x_handle ?? "anon"}</span>
                {r.x_verified && <ShieldCheck className="size-3.5 text-neon" />}
              </a>
              <div className="flex items-center gap-2">
                <div className="text-neon text-xs font-mono">
                  {"★".repeat(r.rating)}
                  <span className="opacity-30">{"★".repeat(5 - r.rating)}</span>
                </div>
                {profileQuery.data?.id === r.author_id && (
                  <button
                    onClick={() => del.mutate(r.id)}
                    className="p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400"
                    aria-label="Delete review"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{r.content}</p>
            <div className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground/60">
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
