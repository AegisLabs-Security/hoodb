// X (Twitter) OAuth 2.0 with PKCE.
// Redirects the user to X, callback exchanges code -> access token -> user info,
// then creates/updates a Supabase user and returns a magic-link so the client can sign in.
import { createFileRoute } from "@tanstack/react-router";
import { createHash, randomBytes } from "node:crypto";

const CALLBACK_PATH = "/api/public/auth/x/callback";
const X_AUTH_URL = "https://x.com/i/oauth2/authorize";

function b64url(buf: Buffer) {
  return buf.toString("base64").replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

export const Route = createFileRoute("/api/public/auth/x/start")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const clientId = process.env.X_CLIENT_ID;
        if (!clientId) {
          return new Response(
            "X sign-in is not configured yet. Ask the admin to set X_CLIENT_ID and X_CLIENT_SECRET.",
            { status: 503 },
          );
        }
        const url = new URL(request.url);
        const origin = `${url.protocol}//${url.host}`;
        const redirectUri = `${origin}${CALLBACK_PATH}`;
        const nextParam = url.searchParams.get("next") || "/";

        const verifier = b64url(randomBytes(48));
        const challenge = b64url(createHash("sha256").update(verifier).digest());
        const state = b64url(randomBytes(16));

        const auth = new URL(X_AUTH_URL);
        auth.searchParams.set("response_type", "code");
        auth.searchParams.set("client_id", clientId);
        auth.searchParams.set("redirect_uri", redirectUri);
        auth.searchParams.set("scope", "users.read tweet.read offline.access");
        auth.searchParams.set("state", state);
        auth.searchParams.set("code_challenge", challenge);
        auth.searchParams.set("code_challenge_method", "S256");

        // Stash verifier + next in short-lived cookies
        const cookieAttrs = "Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600";
        const headers = new Headers({ Location: auth.toString() });
        headers.append("Set-Cookie", `x_pkce=${verifier}; ${cookieAttrs}`);
        headers.append("Set-Cookie", `x_state=${state}; ${cookieAttrs}`);
        headers.append(
          "Set-Cookie",
          `x_next=${encodeURIComponent(nextParam)}; ${cookieAttrs}`,
        );
        return new Response(null, { status: 302, headers });
      },
    },
  },
});
