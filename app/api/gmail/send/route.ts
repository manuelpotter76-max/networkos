import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import {
  eventRegistrations,
  gmailConnections,
  members,
  organizationMessageDeliveries,
  organizationMessages,
} from "../../../../db/schema";
import { getChatGPTUser } from "../../../chatgpt-auth";
import { decrypt, encrypt } from "../crypto";
import { gmailEnv, intendedSender, isOrganizationAdmin } from "../shared";

function base64Url(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

async function accessToken(connection: typeof gmailConnections.$inferSelect) {
  let token = connection.encryptedAccessToken ? await decrypt(connection.encryptedAccessToken) : "";
  if (token && connection.accessTokenExpiresAt && connection.accessTokenExpiresAt >= Date.now() + 60_000) return token;
  const { clientId, clientSecret } = gmailEnv();
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: await decrypt(connection.encryptedRefreshToken),
      grant_type: "refresh_token",
    }),
  });
  const data = (await response.json()) as { access_token?: string; expires_in?: number; error_description?: string };
  if (!response.ok || !data.access_token) throw new Error(data.error_description || "Gmail authorization expired; reconnect Gmail");
  token = data.access_token;
  await getDb().update(gmailConnections).set({
    encryptedAccessToken: await encrypt(token),
    accessTokenExpiresAt: Date.now() + (data.expires_in || 3600) * 1000,
    updatedAt: Date.now(),
  }).where(eq(gmailConnections.organizationId, connection.organizationId));
  return token;
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign in required" }, { status: 401 });
  const body = (await request.json()) as { organizationId?: string; messageId?: string; confirmed?: boolean };
  if (!body.organizationId || !body.messageId || !body.confirmed)
    return Response.json({ error: "A confirmed message is required" }, { status: 400 });
  if (!(await isOrganizationAdmin(body.organizationId, user.userId)))
    return Response.json({ error: "Administrator access required" }, { status: 403 });
  const db = getDb();
  const [message] = await db.select().from(organizationMessages).where(and(
    eq(organizationMessages.id, body.messageId),
    eq(organizationMessages.organizationId, body.organizationId),
  )).limit(1);
  if (!message) return Response.json({ error: "Message not found" }, { status: 404 });
  const [connection] = await db.select().from(gmailConnections).where(eq(gmailConnections.organizationId, body.organizationId)).limit(1);
  if (!connection) return Response.json({ error: "Connect Gmail before sending" }, { status: 409 });

  let recipients = await db.select().from(members).where(and(
    eq(members.organizationId, body.organizationId),
    eq(members.status, "Active"),
    eq(members.emailOptOut, false),
  ));
  if (message.audience === "Incomplete profiles") recipients = recipients.filter((member) => member.completion < 100);
  if (message.audience === "Needs re-engagement") recipients = recipients.filter((member) => member.completion < 70);
  if (message.audience === "Renewals due this month") recipients = [];
  if (message.audience.startsWith("Event:")) {
    const eventId = message.audience.slice("Event:".length);
    const registrations = await db.select({ memberId: eventRegistrations.memberId }).from(eventRegistrations).where(and(
      eq(eventRegistrations.organizationId, body.organizationId),
      eq(eventRegistrations.eventId, eventId),
      eq(eventRegistrations.status, "Registered"),
    ));
    const allowed = new Set(registrations.map((row) => row.memberId));
    recipients = recipients.filter((member) => allowed.has(member.id));
  }
  if (message.audience === "Business After Hours attendees") {
    const registrations = await db.select({ memberId: eventRegistrations.memberId }).from(eventRegistrations).where(and(
      eq(eventRegistrations.organizationId, body.organizationId),
      eq(eventRegistrations.eventId, "after-hours"),
      eq(eventRegistrations.status, "Registered"),
    ));
    const allowed = new Set(registrations.map((row) => row.memberId));
    recipients = recipients.filter((member) => allowed.has(member.id));
  }
  const previous = await db.select({ memberId: organizationMessageDeliveries.memberId }).from(organizationMessageDeliveries).where(and(
    eq(organizationMessageDeliveries.messageId, message.id),
    eq(organizationMessageDeliveries.status, "Sent"),
  ));
  const alreadySent = new Set(previous.map((row) => row.memberId));
  const pending = recipients.filter((member) => !alreadySent.has(member.id));
  if (!pending.length) return Response.json({ sent: 0, failed: 0, skipped: recipients.length, total: recipients.length });
  const token = await accessToken(connection);
  let sent = 0;
  let failed = 0;
  for (const member of pending) {
    const now = Date.now();
    const subject = message.subject.replace(/[\r\n]+/g, " ");
    const raw = base64Url([
      `From: Tampa Business Club <${intendedSender}>`,
      `To: ${member.email}`,
      `Subject: ${subject}`,
      "MIME-Version: 1.0",
      'Content-Type: text/plain; charset="UTF-8"',
      "",
      `Hello ${member.name.split(" ")[0]},`,
      "",
      message.message,
      "",
      "You are receiving this because you are an active Tampa Business Club member. Reply with ‘unsubscribe’ or update your member profile to stop announcement emails.",
    ].join("\r\n"));
    let status = "Failed";
    let gmailMessageId: string | null = null;
    let error: string | null = null;
    try {
      const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({ raw }),
      });
      const result = (await response.json()) as { id?: string; error?: { message?: string } };
      if (!response.ok || !result.id) throw new Error(result.error?.message || "Gmail rejected this recipient");
      status = "Sent";
      gmailMessageId = result.id;
      sent += 1;
    } catch (reason) {
      error = reason instanceof Error ? reason.message : "Unknown Gmail error";
      failed += 1;
    }
    await db.insert(organizationMessageDeliveries).values({
      id: `delivery-${crypto.randomUUID()}`,
      organizationId: body.organizationId,
      messageId: message.id,
      memberId: member.id,
      recipientEmail: member.email,
      status,
      gmailMessageId,
      error,
      sentAt: status === "Sent" ? now : null,
      createdAt: now,
      updatedAt: now,
    }).onConflictDoUpdate({
      target: [organizationMessageDeliveries.messageId, organizationMessageDeliveries.memberId],
      set: { recipientEmail: member.email, status, gmailMessageId, error, sentAt: status === "Sent" ? now : null, updatedAt: now },
    });
  }
  await db.update(organizationMessages).set({
    status: failed ? "Partially sent" : "Sent",
    updatedAt: Date.now(),
  }).where(eq(organizationMessages.id, message.id));
  return Response.json({ sent, failed, skipped: alreadySent.size, total: recipients.length });
}
