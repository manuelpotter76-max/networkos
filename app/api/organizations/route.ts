import { and, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import {
  memberAccounts,
  memberInvitations,
  members,
  organizationAdmins,
  organizations,
  organizationAdminInvitations,
} from "../../../db/schema";
import { getChatGPTUser } from "../../chatgpt-auth";

const tampa = {
  id: "tbc",
  name: "Tampa Business Club",
  slug: "tampa-business-club",
  shortName: "TB",
  primaryColor: "#0c443a",
  accentColor: "#d9b46d",
  font: "Inter",
  status: "Active",
  createdAt: Date.now(),
};

export async function GET() {
  const user = await getChatGPTUser();
  if (!user)
    return Response.json({ error: "Sign in required" }, { status: 401 });
  const db = getDb();
  await db.insert(organizations).values(tampa).onConflictDoNothing();
  // Bootstrap only the verified founding owner. Other administrators must be
  // explicitly invited; merely visiting the app never grants Tampa access.
  if (user.email.toLowerCase() === "manuelpotter76@gmail.com") {
    await db
      .insert(organizationAdmins)
      .values({
        id: `tbc-${user.userId}`,
        organizationId: "tbc",
        userId: user.userId,
        email: user.email,
        role: "Owner",
        createdAt: Date.now(),
      })
      .onConflictDoNothing();
  }
  const pendingInvitations = await db
    .select()
    .from(memberInvitations)
    .where(
      and(
        eq(memberInvitations.email, user.email.toLowerCase()),
        eq(memberInvitations.status, "Pending"),
      ),
    );
  for (const invitation of pendingInvitations) {
    const now = Date.now();
    await db.batch([
      db
        .insert(memberAccounts)
        .values({
          id: `${invitation.organizationId}-${user.userId}`,
          organizationId: invitation.organizationId,
          userId: user.userId,
          memberId: invitation.memberId,
          email: user.email.toLowerCase(),
          status: "Active",
          createdAt: now,
        })
        .onConflictDoNothing(),
      db
        .update(memberInvitations)
        .set({
          status: "Accepted",
          claimedByUserId: user.userId,
          claimedAt: now,
        })
        .where(eq(memberInvitations.id, invitation.id)),
      db
        .update(members)
        .set({ status: "Active", updatedAt: now })
        .where(
          and(
            eq(members.id, invitation.memberId),
            eq(members.organizationId, invitation.organizationId),
          ),
        ),
    ]);
  }
  const pendingAdminInvitations = await db
    .select()
    .from(organizationAdminInvitations)
    .where(
      and(
        eq(organizationAdminInvitations.email, user.email.toLowerCase()),
        eq(organizationAdminInvitations.status, "Pending"),
      ),
    );
  for (const invitation of pendingAdminInvitations) {
    const now = Date.now();
    await db.batch([
      db
        .insert(organizationAdmins)
        .values({
          id: `${invitation.organizationId}-${user.userId}`,
          organizationId: invitation.organizationId,
          userId: user.userId,
          email: user.email.toLowerCase(),
          role: invitation.role === "Owner" ? "Owner" : "Admin",
          createdAt: now,
        })
        .onConflictDoNothing(),
      db
        .update(organizationAdminInvitations)
        .set({
          status: "Accepted",
          claimedByUserId: user.userId,
          claimedAt: now,
        })
        .where(eq(organizationAdminInvitations.id, invitation.id)),
    ]);
  }
  const adminRows = await db
    .select()
    .from(organizationAdmins)
    .where(eq(organizationAdmins.userId, user.userId));
  const all = await db.select().from(organizations);
  const memberRows = await db
    .select()
    .from(memberAccounts)
    .where(eq(memberAccounts.userId, user.userId));
  const allowed = new Set([
    ...adminRows.map((a) => a.organizationId),
    ...memberRows.map((m) => m.organizationId),
  ]);
  return Response.json({
    organizations: all.filter((o) => allowed.has(o.id)),
    admins: adminRows,
    memberships: memberRows,
    canAdmin: adminRows.length > 0,
  });
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user)
    return Response.json({ error: "Sign in required" }, { status: 401 });
  const body = (await request.json()) as {
    name?: string;
    slug?: string;
    shortName?: string;
    primaryColor?: string;
    accentColor?: string;
  };
  const name = body.name?.trim();
  const slug = body.slug
    ?.trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-");
  if (!name || !slug)
    return Response.json(
      { error: "Name and slug are required" },
      { status: 400 },
    );
  const org = {
    id: `org-${crypto.randomUUID()}`,
    name,
    slug,
    shortName: (
      body.shortName ||
      name
        .split(" ")
        .map((x) => x[0])
        .join("")
    )
      .slice(0, 3)
      .toUpperCase(),
    primaryColor: body.primaryColor || "#173f5f",
    accentColor: body.accentColor || "#e0a458",
    font: "Inter",
    status: "Trial",
    createdAt: Date.now(),
  };
  const db = getDb();
  try {
    await db.batch([
      db.insert(organizations).values(org),
      db.insert(organizationAdmins).values({
        id: `${org.id}-${user.userId}`,
        organizationId: org.id,
        userId: user.userId,
        email: user.email,
        role: "Owner",
        createdAt: Date.now(),
      }),
    ]);
    return Response.json({ organization: org }, { status: 201 });
  } catch {
    return Response.json(
      { error: "That organization URL is already in use" },
      { status: 409 },
    );
  }
}

export async function PATCH(request: Request) {
  const user = await getChatGPTUser();
  if (!user)
    return Response.json({ error: "Sign in required" }, { status: 401 });
  const body = (await request.json()) as {
    id?: string;
    name?: string;
    shortName?: string;
    primaryColor?: string;
    accentColor?: string;
    font?: string;
  };
  if (!body.id)
    return Response.json(
      { error: "Organization is required" },
      { status: 400 },
    );
  const access = await getDb()
    .select()
    .from(organizationAdmins)
    .where(
      and(
        eq(organizationAdmins.organizationId, body.id),
        eq(organizationAdmins.userId, user.userId),
      ),
    )
    .limit(1);
  if (!access.length || !["Owner", "Admin"].includes(access[0].role))
    return Response.json(
      { error: "Administrator access required" },
      { status: 403 },
    );
  const [organization] = await getDb()
    .update(organizations)
    .set({
      name: body.name,
      shortName: body.shortName,
      primaryColor: body.primaryColor,
      accentColor: body.accentColor,
      font: body.font,
    })
    .where(eq(organizations.id, body.id))
    .returning();
  return Response.json({ organization });
}
