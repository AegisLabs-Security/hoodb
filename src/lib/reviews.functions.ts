import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { isValidAddress, normalizeAddress, type ReviewWithProfile } from "./rhc";

function serverPublicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

/* ---------- Public: list reviews for a dev address ---------- */
export const listReviews = createServerFn({ method: "GET" })
  .inputValidator((d: { address: string }) =>
    z.object({ address: z.string().refine(isValidAddress) }).parse(d),
  )
  .handler(async ({ data }): Promise<ReviewWithProfile[]> => {
    const supabase = serverPublicClient();
    const addr = normalizeAddress(data.address);
    const { data: rows, error } = await supabase
      .from("reviews")
      .select(
        "id, dev_address, author_id, rating, content, created_at, profiles:profiles!reviews_author_id_fkey(x_handle, x_name, x_avatar_url, x_verified)",
      )
      .eq("dev_address", addr)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) {
      console.error("[listReviews]", error);
      return [];
    }
    return (rows ?? []).map((r: any) => ({
      id: r.id,
      dev_address: r.dev_address,
      author_id: r.author_id,
      rating: r.rating,
      content: r.content,
      created_at: r.created_at,
      x_handle: r.profiles?.x_handle ?? null,
      x_name: r.profiles?.x_name ?? null,
      x_avatar_url: r.profiles?.x_avatar_url ?? null,
      x_verified: !!r.profiles?.x_verified,
    }));
  });

/* ---------- Auth: post a review ---------- */
export const postReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { address: string; rating: number; content: string }) =>
    z
      .object({
        address: z.string().refine(isValidAddress),
        rating: z.number().int().min(1).max(5),
        content: z.string().min(5).max(1000),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const addr = normalizeAddress(data.address);
    const { error } = await context.supabase.from("reviews").upsert(
      {
        dev_address: addr,
        author_id: context.userId,
        rating: data.rating,
        content: data.content.trim(),
      },
      { onConflict: "dev_address,author_id" },
    );
    if (error) throw new Error(error.message);
    // Track this dev address publicly
    await context.supabase.from("tracked_devs").upsert(
      { address: addr, last_seen_at: new Date().toISOString() },
      { onConflict: "address" },
    );
    return { ok: true };
  });

/* ---------- Auth: delete own review ---------- */
export const deleteMyReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("reviews")
      .delete()
      .eq("id", data.id)
      .eq("author_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------- Public: list tracked devs for leaderboard ---------- */
export const listTrackedDevs = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = serverPublicClient();
  const { data, error } = await supabase
    .from("tracked_devs")
    .select("address, first_tracked_at, last_seen_at")
    .order("last_seen_at", { ascending: false })
    .limit(60);
  if (error) {
    console.error("[listTrackedDevs]", error);
    return [] as { address: string; first_tracked_at: string; last_seen_at: string }[];
  }
  return data ?? [];
});

/* ---------- Public: aggregate rating for a set of addresses ---------- */
export const getReviewAggregates = createServerFn({ method: "POST" })
  .inputValidator((d: { addresses: string[] }) =>
    z.object({ addresses: z.array(z.string().refine(isValidAddress)).max(100) }).parse(d),
  )
  .handler(async ({ data }) => {
    const supabase = serverPublicClient();
    const addrs = data.addresses.map(normalizeAddress);
    if (!addrs.length) return {} as Record<string, { avg: number; count: number }>;
    const { data: rows, error } = await supabase
      .from("reviews")
      .select("dev_address, rating")
      .in("dev_address", addrs);
    if (error) {
      console.error("[getReviewAggregates]", error);
      return {} as Record<string, { avg: number; count: number }>;
    }
    const out: Record<string, { avg: number; count: number; sum: number }> = {};
    for (const r of rows ?? []) {
      const k = (r as any).dev_address as string;
      const rating = (r as any).rating as number;
      const cur = out[k] || { avg: 0, count: 0, sum: 0 };
      cur.sum += rating;
      cur.count += 1;
      cur.avg = cur.sum / cur.count;
      out[k] = cur;
    }
    const result: Record<string, { avg: number; count: number }> = {};
    for (const k of Object.keys(out)) result[k] = { avg: out[k].avg, count: out[k].count };
    return result;
  });

/* ---------- Auth: current profile ---------- */
export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("id, x_handle, x_name, x_avatar_url, x_verified")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });
