import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import { supabaseAdmin } from "@/integrations/supabase/client.server";

const X_AUTH_URL = "https://x.com/i/oauth2/authorize";
const X_TOKEN_URL = "https://api.x.com/2/oauth2/token";
const X_ME_URL =
  "https://api.x.com/2/users/me?user.fields=profile_image_url,name,username,verified";
const APP_ORIGIN = "https://hooddb-iota.vercel.app";
const CALLBACK_PATH = "/api/public/auth/x/callback";
const CALLBACK_URL = `${APP_ORIGIN}${CALLBACK_PATH}`;
const OAUTH_SCOPE = "users.read tweet.read offline.access";
const OAUTH_COOKIE_ATTRS = "Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600";
const CLEAR_COOKIE_ATTRS = "Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0";

type TokenResponse = {
  token_type: string;
  expires_in: number;
  access_token: string;
  scope?: string;
  refresh_token?: string;
};

type XProfile = {
  id: string;
  username: string;
  name: string;
  profile_image_url?: string;
  verified?: boolean;
};

type CookieMap = Record<string, string>;

function b64url(buf: Buffer) {
  return buf
    .toString("base64")
    .replace(/=+$/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function redactTokenLike(value: string) {
  if (!value) return value;
  if (value.length <= 10) return "[redacted]";
  return `${value.slice(0, 6)}...[redacted]`;
}

function sanitizeBody(body: string) {
  try {
    const parsed = JSON.parse(body) as Record<string, unknown>;
    for (const key of ["access_token", "refresh_token", "id_token"]) {
      if (typeof parsed[key] === "string") {
        parsed[key] = redactTokenLike(parsed[key] as string);
      }
    }
    return JSON.stringify(parsed);
  } catch {
    return body;
  }
}

function sanitizeHeaders(headers: Headers) {
  const out: Record<string, string> = {};
  headers.forEach((value, key) => {
    out[key] = key.toLowerCase() === "authorization" ? "[redacted]" : value;
  });
  return out;
}

function logOAuth(stage: string, details: Record<string, unknown>) {
  console.info(`[x-oauth] ${stage} ${JSON.stringify(details)}`);
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function normalizeNext(nextParam: string | null | undefined) {
  if (!nextParam) return "/";
  return nextParam.startsWith("/") ? nextParam : "/";
}

export function parseCookies(header: string | null): CookieMap {
  const out: CookieMap = {};
  if (!header) return out;
  for (const part of header.split(/;\s*/)) {
    const idx = part.indexOf("=");
    if (idx <= 0) continue;
    const key = part.slice(0, idx);
    const value = part.slice(idx + 1);
    out[key] = decodeURIComponent(value);
  }
  return out;
}

export function getOAuthCallbackUrl() {
  return CALLBACK_URL;
}

export function createPkcePair() {
  const verifier = b64url(randomBytes(48));
  const challenge = b64url(createHash("sha256").update(verifier).digest());
  return { verifier, challenge };
}

export function createOAuthState() {
  return b64url(randomBytes(16));
}

export function buildAuthorizationURL(input: {
  clientId: string;
  state: string;
  codeChallenge: string;
}) {
  const auth = new URL(X_AUTH_URL);
  auth.searchParams.set("response_type", "code");
  auth.searchParams.set("client_id", input.clientId);
  auth.searchParams.set("redirect_uri", CALLBACK_URL);
  auth.searchParams.set("scope", OAUTH_SCOPE);
  auth.searchParams.set("state", input.state);
  auth.searchParams.set("code_challenge", input.codeChallenge);
  auth.searchParams.set("code_challenge_method", "S256");
  return auth.toString();
}

export function buildOAuthCookies(input: {
  verifier: string;
  state: string;
  nextPath: string;
}) {
  return [
    `x_pkce=${encodeURIComponent(input.verifier)}; ${OAUTH_COOKIE_ATTRS}`,
    `x_state=${encodeURIComponent(input.state)}; ${OAUTH_COOKIE_ATTRS}`,
    `x_next=${encodeURIComponent(input.nextPath)}; ${OAUTH_COOKIE_ATTRS}`,
  ];
}

export function clearOAuthCookies() {
  return [
    `x_pkce=; ${CLEAR_COOKIE_ATTRS}`,
    `x_state=; ${CLEAR_COOKIE_ATTRS}`,
    `x_next=; ${CLEAR_COOKIE_ATTRS}`,
  ];
}

export function appendSetCookies(headers: Headers, cookies: string[]) {
  for (const cookie of cookies) headers.append("Set-Cookie", cookie);
}

export function validateOAuthCallback(input: {
  request: Request;
  code: string | null;
  state: string | null;
  cookies: CookieMap;
}) {
  if (!input.code || !input.state) {
    return { ok: false as const, error: "Missing authorization code or state." };
  }
  const cookieState = input.cookies.x_state;
  if (!cookieState) {
    return { ok: false as const, error: "OAuth state cookie is missing or expired." };
  }
  if (!safeEqual(cookieState, input.state)) {
    return { ok: false as const, error: "OAuth state mismatch. Please try again." };
  }
  const verifier = input.cookies.x_pkce;
  if (!verifier) {
    return { ok: false as const, error: "PKCE verifier is missing or expired." };
  }
  return { ok: true as const, verifier };
}

export async function exchangeAuthorizationCode(input: {
  code: string;
  verifier: string;
  clientId: string;
  clientSecret?: string;
}) {
  const isConfidentialClient = Boolean(input.clientSecret);
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: input.code,
    redirect_uri: CALLBACK_URL,
    code_verifier: input.verifier,
  });

  const headers = new Headers({
    "content-type": "application/x-www-form-urlencoded",
  });

  if (isConfidentialClient) {
    headers.set(
      "authorization",
      `Basic ${Buffer.from(`${input.clientId}:${input.clientSecret}`).toString("base64")}`,
    );
  } else {
    body.set("client_id", input.clientId);
  }

  logOAuth("token_request", {
    grant_type: "authorization_code",
    redirect_uri: CALLBACK_URL,
    pkce_present: true,
    client_type: isConfidentialClient ? "confidential" : "public",
  });

  const response = await fetch(X_TOKEN_URL, {
    method: "POST",
    headers,
    body: body.toString(),
  });

  const responseText = await response.text();
  logOAuth("token_response", {
    status: response.status,
    headers: sanitizeHeaders(response.headers),
    body: sanitizeBody(responseText),
  });

  if (!response.ok) {
    throw new Error(`Token exchange failed (${response.status}): ${sanitizeBody(responseText)}`);
  }

  return JSON.parse(responseText) as TokenResponse;
}

export async function fetchXProfile(accessToken: string) {
  const response = await fetch(X_ME_URL, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  const responseText = await response.text();

  logOAuth("profile_response", {
    status: response.status,
    headers: sanitizeHeaders(response.headers),
    body: sanitizeBody(responseText),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch X profile (${response.status}): ${sanitizeBody(responseText)}`);
  }

  const payload = JSON.parse(responseText) as { data?: XProfile };
  if (!payload.data?.id || !payload.data.username) {
    throw new Error("X profile response is missing required user fields.");
  }

  return payload.data;
}

async function findSupabaseUserIdByEmail(email: string) {
  for (let page = 1; page <= 10; page += 1) {
    const result = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
    if (result.error) throw result.error;
    const match = result.data.users.find((user) => user.email === email);
    if (match) return match.id;
    if ((result.data.users?.length ?? 0) < 200) break;
  }
  return null;
}

export async function createOrUpdateSupabaseUser(profile: XProfile) {
  const email = `x_${profile.id}@x.hooddb.local`;
  const userMeta = {
    x_handle: profile.username,
    x_user_id: profile.id,
    x_name: profile.name,
    x_avatar_url: profile.profile_image_url?.replace("_normal.", "_400x400.") ?? null,
    x_verified: !!profile.verified,
  };

  const existingProfile = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("x_user_id", profile.id)
    .maybeSingle();

  if (existingProfile.error) {
    throw new Error(`Failed to query existing profile: ${existingProfile.error.message}`);
  }

  let userId = existingProfile.data?.id ?? null;

  if (!userId) {
    const created = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: userMeta,
    });

    if (created.error) {
      userId = await findSupabaseUserIdByEmail(email);
      if (!userId) {
        throw new Error(`Failed to create Supabase user: ${created.error.message}`);
      }
    } else if (created.data.user) {
      userId = created.data.user.id;
    }
  }

  if (!userId) {
    throw new Error("Supabase user ID could not be resolved.");
  }

  const updated = await supabaseAdmin.auth.admin.updateUserById(userId, {
    email,
    email_confirm: true,
    user_metadata: userMeta,
  });
  if (updated.error) {
    throw new Error(`Failed to update Supabase user metadata: ${updated.error.message}`);
  }

  const profileUpsert = await supabaseAdmin.from("profiles").upsert(
    {
      id: userId,
      x_handle: profile.username,
      x_user_id: profile.id,
      x_name: profile.name,
      x_avatar_url: userMeta.x_avatar_url,
      x_verified: !!profile.verified,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
  if (profileUpsert.error) {
    throw new Error(`Failed to upsert profile row: ${profileUpsert.error.message}`);
  }

  return { userId, email };
}

export async function createSession(input: { email: string; nextPath: string }) {
  const redirectTo = `${APP_ORIGIN}${normalizeNext(input.nextPath)}`;
  const result = await supabaseAdmin.auth.admin.generateLink({
    type: "magiclink",
    email: input.email,
    options: { redirectTo },
  });
  if (result.error || !result.data.properties?.action_link) {
    throw new Error(result.error?.message || "Failed to generate Supabase magic link.");
  }
  return {
    actionLink: result.data.properties.action_link,
    redirectTo,
  };
}

export function buildAuthErrorRedirect(request: Request, message: string, nextPath?: string) {
  const target = new URL("/auth", APP_ORIGIN);
  target.searchParams.set("error", message);
  if (nextPath) target.searchParams.set("next", normalizeNext(nextPath));
  const headers = new Headers({ Location: target.toString() });
  appendSetCookies(headers, clearOAuthCookies());
  return new Response(null, { status: 302, headers });
}

export function getStartLogContext(request: Request, state: string) {
  const url = new URL(request.url);
  return {
    origin: `${url.protocol}//${url.host}`,
    redirect_uri: CALLBACK_URL,
    state,
  };
}

export function getCallbackLogContext(input: {
  code: string | null;
  state: string | null;
  cookies: CookieMap;
}) {
  return {
    received_code: Boolean(input.code),
    code_length: input.code?.length ?? 0,
    received_state: input.state,
    cookie_state: input.cookies.x_state ?? null,
    cookie_verifier_exists: Boolean(input.cookies.x_pkce),
    pkce_verifier_length: input.cookies.x_pkce?.length ?? 0,
    redirect_uri: CALLBACK_URL,
  };
}

export { logOAuth, normalizeNext };
