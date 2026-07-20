import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Filter, ShieldCheck, Star, Trash2, ThumbsUp, AlertCircle } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { EmptyState } from "@/components/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { getMyProfile, postReview, deleteMyReview } from "../api";
import { timeAgo } from "@/lib/rhc";

interface CommunityReviewsSectionProps {
  address: string;
  reviews: any[];
  onChanged: () => void;
}

export function CommunityReviewsSection({ address, reviews, onChanged }: CommunityReviewsSectionProps) {
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
    onSuccess: () => {
      onChanged();
      setContent("");
    },
  });
  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: onChanged,
  });

  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [filter, setFilter] = useState<"newest" | "highest" | "most-helpful" | "verified">("newest");

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.8, ease: "easeOut" }}
      className="neon-panel rounded-3xl overflow-hidden"
    >
      <div className="p-8 border-b border-border/60 bg-surface/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-neon/10 text-neon">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold">Community Reviews</h2>
            <p className="text-xs text-muted-foreground">{reviews.length} reviews</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="bg-transparent border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-neon"
          >
            <option value="newest">Newest</option>
            <option value="highest">Highest Rating</option>
            <option value="most-helpful">Most Helpful</option>
            <option value="verified">Verified Only</option>
          </select>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* Write Review */}
        {authed ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (content.trim().length < 5) return;
              post.mutate({ rating, content: content.trim() });
            }}
            className="p-6 rounded-2xl border border-border bg-surface/50 space-y-4"
          >
            <div className="text-sm text-muted-foreground">
              Posting as <span className="text-neon font-bold">@{profileQuery.data?.x_handle ?? "you"}</span>
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
                  <Star
                    className={`w-8 h-8 ${
                      n <= rating ? "fill-neon text-neon drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]" : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your experience with this developer..."
              rows={4}
              maxLength={1000}
              className="w-full rounded-xl bg-surface border border-border p-4 text-sm focus:outline-none focus:border-neon focus:ring-2 focus:ring-neon/20 transition resize-none"
            />

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={post.isPending}
                className="px-8 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:brightness-110 disabled:opacity-50 transition"
              >
                {post.isPending ? "Posting..." : "Post Review"}
              </button>
            </div>

            {post.error && (
              <div className="text-sm text-red-400 flex items-center gap-2 bg-red-500/10 rounded-lg p-3">
                <AlertCircle className="w-4 h-4" />
                {(post.error as Error).message}
              </div>
            )}
          </form>
        ) : (
          <div className="p-6 rounded-2xl border border-border bg-surface/50 text-sm">
            <p className="mb-3">Want to leave a review?</p>
            <Link
              to="/auth"
              className="text-neon hover:underline font-bold inline-flex items-center gap-2"
            >
              Sign in with X <ShieldCheck className="w-3 h-3" />
            </Link>
            <p className="mt-2 text-xs text-muted-foreground">
              Every review is tied to a verified X handle to prevent spam.
            </p>
          </div>
        )}

        {/* Reviews List */}
        <div className="space-y-6">
          {reviews.length === 0 ? (
            <EmptyState
              icon={<Star className="w-16 h-16" />}
              title="No Reviews Yet"
              description="Be the first to review this developer!"
            />
          ) : (
            reviews.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.85 + i * 0.05 }}
                className="p-6 rounded-2xl border border-border bg-surface/50 hover:border-neon/30 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {r.x_avatar_url ? (
                      <img
                        src={r.x_avatar_url}
                        alt=""
                        className="w-12 h-12 rounded-full border-2 border-neon/30 object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-surface-2 border-2 border-neon/30" />
                    )}
                    <div>
                      <a
                        href={r.x_handle ? `https://x.com/${r.x_handle}` : "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 font-bold text-lg hover:text-neon transition"
                      >
                        @{r.x_handle ?? "anon"}
                        {r.x_verified && <ShieldCheck className="w-4 h-4 text-neon" />}
                      </a>
                      <div className="text-neon font-mono mt-1">
                        {"★".repeat(r.rating)}
                        <span className="opacity-30">{"★".repeat(5 - r.rating)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {profileQuery.data?.id === r.author_id && (
                      <button
                        onClick={() => del.mutate(r.id)}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition"
                        aria-label="Delete review"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-lg text-muted-foreground/90 leading-relaxed mb-4">
                  {r.content}
                </p>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-mono uppercase tracking-widest">
                    {timeAgo(r.created_at)}
                  </span>
                  <button className="flex items-center gap-2 hover:text-neon transition">
                    <ThumbsUp className="w-4 h-4" />
                    Helpful
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </motion.section>
  );
}
