import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { gmailConnections } from "../../../../db/schema";
import { getChatGPTUser } from "../../../chatgpt-auth";
import { encrypt, readState } from "../crypto";
import { gmailEnv, intendedSender, isOrganizationAdmin } from "../shared";

type OAuthState = { organizationId: string; userId: string; expiresAt: number };

function finish(request: Request, result: "connected" | "error", detail?: string) {
  const target = new URL("/", request.url);
  target.searchParams.set("gmail", result);
  if (detail) target.searchParams.set("detail", detail);
  return Response.redirect(target.toString(), 302);
}

export async function GET(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return finish(request, "error", "Sign in to NetworkOS and try again");
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const stateValue = url.searchParams.get("state");
  if (!code || !stateValue) return finish(request, "error", "Google authorization was cancelled");
  try {
    const state = await readState<OAuthState>(stateValue);
    if (state.expiresAt < Date.now() || state.userId !== user.userId)
      return finish(request, "error", "The connection request expired; please try again");
    if (!(await isOrganizationAdmin(state.organizationId, user.userId)))
      return finish(request, "error", "Administrator access is required");
    const { clientId, clientSecret } = gmailEnv();
    const redirectUri = `${url.origin}/api/gmail/callback`;
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: "authorization_code" }),
    });
    const tokens = (await tokenResponse.json()) as { access_token?: string; refresh_token?: string; expires_in?: number; error_description?: string };
    if (!tokenResponse.ok || !tokens.access_token || !tokens.refresh_token)
      return finish(request, "error", tokens.error_description || "Google did not return a reusable connection");
    const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { authorization: `Bearer ${tokens.access_token}` },
    });
    const profile = (await profileResponse.json()) as { email?: string };
    if (!profileResponse.ok || profile.email?.toLowerCase() !== intendedSender)
      return finish(request, "error", `Please authorize ${intendedSender}`);
    const now = Date.now();
    await getDb()
      .insert(gmailConnections)
      .values({
        organizationId: state.organizationId,
        senderEmail: intendedSender,
        encryptedRefreshToken: await encrypt(tokens.refresh_token),
        encryptedAccessToken: await encrypt(tokens.access_token),
        accessTokenExpiresAt: now + (tokens.expires_in || 3600) * 1000,
        connectedByUserId: user.userId,
        connectedAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: gmailConnections.organizationId,
        set: {
          senderEmail: intendedSender,
          encryptedRefreshToken: await encrypt(tokens.refresh_token),
          encryptedAccessToken: await encrypt(tokens.access_token),
          accessTokenExpiresAt: now + (tokens.expires_in || 3600) * 1000,
          connectedByUserId: user.userId,
          connectedAt: now,
          updatedAt: now,
        },
      });
    return finish(request, "connected");
  } catch {
    return finish(request, "error", "Unable to complete the Gmail connection");
  }
}
