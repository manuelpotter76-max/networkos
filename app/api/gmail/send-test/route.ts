import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { gmailConnections } from "../../../../db/schema";
import { getChatGPTUser } from "../../../chatgpt-auth";
import { decrypt, encrypt } from "../crypto";
import { gmailEnv, intendedSender, isOrganizationAdmin } from "../shared";

function base64Url(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign in required" }, { status: 401 });
  const body = (await request.json()) as { organizationId?: string; subject?: string; message?: string };
  if (!body.organizationId || !(await isOrganizationAdmin(body.organizationId, user.userId)))
    return Response.json({ error: "Administrator access required" }, { status: 403 });
  if (!body.subject?.trim() || !body.message?.trim())
    return Response.json({ error: "Subject and message are required" }, { status: 400 });
  const [connection] = await getDb()
    .select()
    .from(gmailConnections)
    .where(eq(gmailConnections.organizationId, body.organizationId))
    .limit(1);
  if (!connection) return Response.json({ error: "Connect Gmail before sending" }, { status: 409 });

  let accessToken = connection.encryptedAccessToken
    ? await decrypt(connection.encryptedAccessToken)
    : "";
  if (!accessToken || !connection.accessTokenExpiresAt || connection.accessTokenExpiresAt < Date.now() + 60_000) {
    const { clientId, clientSecret } = gmailEnv();
    const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: await decrypt(connection.encryptedRefreshToken),
        grant_type: "refresh_token",
      }),
    });
    const refreshed = (await refreshResponse.json()) as { access_token?: string; expires_in?: number; error_description?: string };
    if (!refreshResponse.ok || !refreshed.access_token)
      return Response.json({ error: refreshed.error_description || "Gmail authorization expired; reconnect Gmail" }, { status: 502 });
    accessToken = refreshed.access_token;
    await getDb()
      .update(gmailConnections)
      .set({
        encryptedAccessToken: await encrypt(accessToken),
        accessTokenExpiresAt: Date.now() + (refreshed.expires_in || 3600) * 1000,
        updatedAt: Date.now(),
      })
      .where(eq(gmailConnections.organizationId, body.organizationId));
  }

  const subject = body.subject.trim().replace(/[\r\n]+/g, " ");
  const raw = base64Url(
    [
      `From: Tampa Business Club <${intendedSender}>`,
      `To: ${intendedSender}`,
      `Subject: [NetworkOS test] ${subject}`,
      "MIME-Version: 1.0",
      'Content-Type: text/plain; charset="UTF-8"',
      "",
      body.message.trim(),
      "",
      "This test was sent only to the Tampa Business Club administrator.",
    ].join("\r\n"),
  );
  const sendResponse = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { authorization: `Bearer ${accessToken}`, "content-type": "application/json" },
    body: JSON.stringify({ raw }),
  });
  const result = (await sendResponse.json()) as { id?: string; error?: { message?: string } };
  if (!sendResponse.ok || !result.id)
    return Response.json({ error: result.error?.message || "Gmail could not send the test" }, { status: 502 });
  return Response.json({ sent: true, recipient: intendedSender, messageId: result.id });
}
