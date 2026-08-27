import { getChatGPTUser } from "../../../chatgpt-auth";
import { createState } from "../crypto";
import { gmailEnv, intendedSender, isOrganizationAdmin } from "../shared";

export async function GET(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign in required" }, { status: 401 });
  const url = new URL(request.url);
  const organizationId = url.searchParams.get("organization_id");
  if (!organizationId || !(await isOrganizationAdmin(organizationId, user.userId)))
    return Response.json({ error: "Administrator access required" }, { status: 403 });
  const { clientId, clientSecret } = gmailEnv();
  if (!clientId || !clientSecret)
    return Response.json({ error: "Google OAuth credentials are not configured yet" }, { status: 503 });
  const redirectUri = `${url.origin}/api/gmail/callback`;
  const state = await createState({ organizationId, userId: user.userId, expiresAt: Date.now() + 10 * 60 * 1000 });
  const authorize = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authorize.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email https://www.googleapis.com/auth/gmail.send",
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    login_hint: intendedSender,
    state,
  }).toString();
  return Response.redirect(authorize.toString(), 302);
}
