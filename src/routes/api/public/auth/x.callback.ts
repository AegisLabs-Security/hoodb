import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/auth/x/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const oauth = await import("@/lib/x-oauth.server");
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const err = url.searchParams.get("error");
        const cookies = oauth.parseCookies(request.headers.get("cookie"));
        const nextPath = oauth.normalizeNext(cookies.x_next);

        if (err) {
          oauth.logOAuth("callback_error", {
            error: err,
            redirect_uri: oauth.getOAuthCallbackUrl(),
          });
          return oauth.buildAuthErrorRedirect(request, `X returned error: ${err}`, nextPath);
        }

        oauth.logOAuth(
          "callback_received",
          oauth.getCallbackLogContext({
            code,
            state,
            cookies,
          }),
        );

        const validation = oauth.validateOAuthCallback({
          request,
          code,
          state,
          cookies,
        });
        if (!validation.ok) {
          return oauth.buildAuthErrorRedirect(request, validation.error, nextPath);
        }

        const clientId = process.env.X_CLIENT_ID;
        const clientSecret = process.env.X_CLIENT_SECRET;
        if (!clientId) {
          return oauth.buildAuthErrorRedirect(
            request,
            "X sign-in is not configured. Missing X_CLIENT_ID.",
            nextPath,
          );
        }

        try {
          const token = await oauth.exchangeAuthorizationCode({
            code: code!,
            verifier: validation.verifier,
            clientId,
            clientSecret: clientSecret || undefined,
          });
          const profile = await oauth.fetchXProfile(token.access_token);
          const { email } = await oauth.createOrUpdateSupabaseUser(profile);
          const session = await oauth.createSession({
            email,
            nextPath,
          });

          const headers = new Headers({ Location: session.actionLink });
          oauth.appendSetCookies(headers, oauth.clearOAuthCookies());
          return new Response(null, { status: 302, headers });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unexpected X OAuth callback failure.";
          oauth.logOAuth("callback_failure", {
            message,
            redirect_uri: oauth.getOAuthCallbackUrl(),
          });
          return oauth.buildAuthErrorRedirect(request, message, nextPath);
        }
      },
    },
  },
});
