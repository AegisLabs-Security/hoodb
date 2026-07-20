// X OAuth 2.0 callback: exchange code -> user info, upsert Supabase user, sign the user in.
import { createFileRoute } from "@tanstack/react-router";

const CALLBACK_PATH = "/api/public/auth/x/callback";

function parseCookies(header: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(/;\s*/)) {
    const idx = part.indexOf("=");
    if (idx > 0) out[part.slice(0, idx)] = decodeURIComponent(part.slice(idx + 1));
  }
  return out;
}

function errRedirect(request: Request, message: string) {
  const url = new URL(request.url);
  const target = `${url.protocol}//${url.host}/auth?error=${encodeURIComponent(message)}`;
  const headers = new Headers({ Location: target });
  const clear = "Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0";
  headers.append("Set-Cookie", `x_pkce=; ${clear}`);
  headers.append("Set-Cookie", `x_state=; ${clear}`);
  headers.append("Set-Cookie", `x_next=; ${clear}`);
  return new Response(null, { status: 302, headers });
}

export const Route = createFileRoute("/api/public/auth/x/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const err = url.searchParams.get("error");
        if (err) return errPage(`X returned error: ${err}`);
        if (!code || !state) return errPage("Missing authorization code.");

        const cookies = parseCookies(request.headers.get("cookie"));
        if (cookies.x_state !== state) return errPage("State mismatch. Please try again.");
        const verifier = cookies.x_pkce;
        if (!verifier) return errPage("PKCE verifier expired. Please try again.");

        const clientId = process.env.X_CLIENT_ID;
        const clientSecret = process.env.X_CLIENT_SECRET;
        if (!clientId || !clientSecret) return errPage("X sign-in is not configured.");

        const origin = `${url.protocol}//${url.host}`;
        const redirectUri = `${origin}${CALLBACK_PATH}`;

        // 1. Exchange code for access token
        const tokenRes = await fetch("https://api.twitter.com/2/oauth2/token", {
          method: "POST",
          headers: {
            "content-type": "application/x-www-form-urlencoded",
            authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
          },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            code,
            redirect_uri: redirectUri,
            code_verifier: verifier,
            client_id: clientId,
          }).toString(),
        });
        if (!tokenRes.ok) {
          const t = await tokenRes.text();
          console.error("[x/callback token]", t);
          return errPage(`Token exchange failed: ${t.slice(0, 200)}`);
        }
        const tok = (await tokenRes.json()) as { access_token: string };

        // 2. Fetch X user
        const meRes = await fetch(
          "https://api.twitter.com/2/users/me?user.fields=profile_image_url,name,verified",
          { headers: { authorization: `Bearer ${tok.access_token}` } },
        );
        if (!meRes.ok) {
          const t = await meRes.text();
          console.error("[x/callback me]", t);
          return errPage("Failed to fetch X profile.");
        }
        const me = (await meRes.json()) as {
          data: { id: string; username: string; name: string; profile_image_url?: string; verified?: boolean };
        };
        const xUser = me.data;

        // 3. Upsert Supabase user via admin API
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const email = `x_${xUser.id}@x.hooddb.local`;
        const userMeta = {
          x_handle: xUser.username,
          x_user_id: xUser.id,
          x_name: xUser.name,
          x_avatar_url: xUser.profile_image_url?.replace("_normal.", "_400x400.") ?? null,
          x_verified: !!xUser.verified,
        };

        // Try to find existing user
        let userId: string | null = null;
        const list = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
        for (const u of list.data.users ?? []) {
          if (u.email === email) {
            userId = u.id;
            break;
          }
        }
        if (!userId) {
          const created = await supabaseAdmin.auth.admin.createUser({
            email,
            email_confirm: true,
            user_metadata: userMeta,
          });
          if (created.error || !created.data.user) {
            console.error("[x/callback createUser]", created.error);
            return errPage("Failed to create account.");
          }
          userId = created.data.user.id;
        } else {
          await supabaseAdmin.auth.admin.updateUserById(userId, { user_metadata: userMeta });
        }
        // Sync profile row
        await supabaseAdmin.from("profiles").upsert(
          {
            id: userId,
            x_handle: xUser.username,
            x_user_id: xUser.id,
            x_name: xUser.name,
            x_avatar_url: userMeta.x_avatar_url,
            x_verified: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" },
        );

        // 4. Generate magic link and redirect user through it to establish session
        const nextRaw = cookies.x_next || "/";
        const next = nextRaw.startsWith("/") ? nextRaw : "/";
        const link = await supabaseAdmin.auth.admin.generateLink({
          type: "magiclink",
          email,
          options: { redirectTo: `${origin}${next}` },
        });
        if (link.error || !link.data.properties?.action_link) {
          console.error("[x/callback generateLink]", link.error);
          return errPage("Failed to create sign-in link.");
        }

        const headers = new Headers({ Location: link.data.properties.action_link });
        // Clear PKCE cookies
        const clear = "Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0";
        headers.append("Set-Cookie", `x_pkce=; ${clear}`);
        headers.append("Set-Cookie", `x_state=; ${clear}`);
        headers.append("Set-Cookie", `x_next=; ${clear}`);
        return new Response(null, { status: 302, headers });
      },
    },
  },
});
