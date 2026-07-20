import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/auth/x/start")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const oauth = await import("@/lib/x-oauth.server");
        const clientId = process.env.X_CLIENT_ID;
        if (!clientId) {
          return new Response(
            "X sign-in is not configured yet. Ask the admin to set X_CLIENT_ID and X_CLIENT_SECRET.",
            { status: 503 },
          );
        }
        const url = new URL(request.url);
        const nextPath = oauth.normalizeNext(url.searchParams.get("next"));
        const { verifier, challenge } = oauth.createPkcePair();
        const state = oauth.createOAuthState();
        const authorizationUrl = oauth.buildAuthorizationURL({
          clientId,
          state,
          codeChallenge: challenge,
        });

        oauth.logOAuth("start", oauth.getStartLogContext(request, state));

        const headers = new Headers({ Location: authorizationUrl });
        oauth.appendSetCookies(
          headers,
          oauth.buildOAuthCookies({
            verifier,
            state,
            nextPath,
          }),
        );
        return new Response(null, { status: 302, headers });
      },
    },
  },
});
