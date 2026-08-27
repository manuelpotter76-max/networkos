import { and, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import {
  eventRegistrations,
  events,
  memberAccounts,
  organizationAdmins,
  organizationSettings,
} from "../../../db/schema";
import { getChatGPTUser } from "../../chatgpt-auth";

async function access(organizationId: string, userId: string) {
  const db = getDb();
  const [admins, accounts] = await Promise.all([
    db.select().from(organizationAdmins).where(and(eq(organizationAdmins.organizationId, organizationId), eq(organizationAdmins.userId, userId))).limit(1),
    db.select().from(memberAccounts).where(and(eq(memberAccounts.organizationId, organizationId), eq(memberAccounts.userId, userId), eq(memberAccounts.status, "Active"))).limit(1),
  ]);
  return { admin: admins.length > 0, account: accounts[0] || null };
}

export async function GET(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign in required" }, { status: 401 });
  const organizationId = new URL(request.url).searchParams.get("organization_id") || "tbc";
  const { admin, account } = await access(organizationId, user.userId);
  if (!admin && !account) return Response.json({ error: "Not authorized" }, { status: 403 });
  const settings = await getDb().select().from(organizationSettings).where(eq(organizationSettings.organizationId, organizationId)).limit(1);
  const rows = await getDb().select().from(eventRegistrations).where(
    admin || settings[0]?.showEventAttendees
      ? eq(eventRegistrations.organizationId, organizationId)
      : and(eq(eventRegistrations.organizationId, organizationId), eq(eventRegistrations.memberId, account!.memberId)),
  );
  return Response.json({ registrations: rows });
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign in required" }, { status: 401 });
  const body = (await request.json()) as { organizationId?: string; eventId?: string; memberId?: string; action?: "rsvp" | "cancel" | "promote" | "toggle_checkin" };
  if (!body.organizationId || !body.eventId || !body.action) return Response.json({ error: "Organization, event, and action are required" }, { status: 400 });
  const { admin, account } = await access(body.organizationId, user.userId);
  if (!admin && !account) return Response.json({ error: "Not authorized" }, { status: 403 });
  const memberId = admin && body.memberId ? body.memberId : account?.memberId;
  if (!memberId) return Response.json({ error: "Member profile required" }, { status: 400 });
  if ((body.action === "promote" || body.action === "toggle_checkin") && !admin) return Response.json({ error: "Administrator access required" }, { status: 403 });
  const db = getDb();
  const eventRows = await db.select().from(events).where(and(eq(events.organizationId, body.organizationId), eq(events.id, body.eventId))).limit(1);
  if (!eventRows.length) return Response.json({ error: "Event not found" }, { status: 404 });
  const existing = await db.select().from(eventRegistrations).where(and(eq(eventRegistrations.organizationId, body.organizationId), eq(eventRegistrations.eventId, body.eventId), eq(eventRegistrations.memberId, memberId))).limit(1);
  const now = Date.now();
  let status = existing[0]?.status || "Registered";
  let checkedIn = existing[0]?.checkedIn || false;
  if (body.action === "cancel") { status = "Cancelled"; checkedIn = false; }
  if (body.action === "rsvp" || body.action === "promote") {
    const registered = await db.select({ id: eventRegistrations.id }).from(eventRegistrations).where(and(eq(eventRegistrations.organizationId, body.organizationId), eq(eventRegistrations.eventId, body.eventId), eq(eventRegistrations.status, "Registered")));
    const currentAlreadyRegistered = existing[0]?.status === "Registered";
    if (body.action === "promote" && registered.length >= eventRows[0].capacity && !currentAlreadyRegistered) return Response.json({ error: "Event capacity is full" }, { status: 409 });
    status = registered.length >= eventRows[0].capacity && !currentAlreadyRegistered ? "Waitlisted" : "Registered";
    checkedIn = false;
  }
  if (body.action === "toggle_checkin") {
    if (!existing.length || existing[0].status !== "Registered") return Response.json({ error: "Only registered attendees can check in" }, { status: 409 });
    checkedIn = !existing[0].checkedIn;
  }
  const id = existing[0]?.id || `registration-${crypto.randomUUID()}`;
  await db.insert(eventRegistrations).values({ id, organizationId: body.organizationId, eventId: body.eventId, memberId, status, checkedIn, registeredAt: existing[0]?.registeredAt || now, updatedAt: now, checkedInAt: checkedIn ? now : null }).onConflictDoUpdate({ target: eventRegistrations.id, set: { status, checkedIn, updatedAt: now, checkedInAt: checkedIn ? now : null } });
  const registration = await db.select().from(eventRegistrations).where(eq(eventRegistrations.id, id)).limit(1);
  return Response.json({ registration: registration[0] });
}
