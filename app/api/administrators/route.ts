import { and, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import {
  organizationAdminInvitations,
  organizationAdmins,
} from "../../../db/schema";
import { getChatGPTUser } from "../../chatgpt-auth";

async function access(organizationId: string, userId: string) {
  const rows = await getDb()
    .select()
    .from(organizationAdmins)
    .where(
      and(
        eq(organizationAdmins.organizationId, organizationId),
        eq(organizationAdmins.userId, userId),
      ),
    )
    .limit(1);
  return rows[0] || null;
}

export async function GET(request: Request) {
  const user = await getChatGPTUser();
  if (!user)
    return Response.json({ error: "Sign in required" }, { status: 401 });
  const organizationId = new URL(request.url).searchParams.get(
    "organization_id",
  );
  if (!organizationId || !(await access(organizationId, user.userId)))
    return Response.json(
      { error: "Administrator access required" },
      { status: 403 },
    );
  const db = getDb();
  const [admins, invitations] = await Promise.all([
    db
      .select()
      .from(organizationAdmins)
      .where(eq(organizationAdmins.organizationId, organizationId)),
    db
      .select()
      .from(organizationAdminInvitations)
      .where(eq(organizationAdminInvitations.organizationId, organizationId)),
  ]);
  return Response.json({ admins, invitations, currentUserId: user.userId });
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user)
    return Response.json({ error: "Sign in required" }, { status: 401 });
  const body = (await request.json()) as {
    organizationId?: string;
    email?: string;
    role?: string;
  };
  if (!body.organizationId || !body.email)
    return Response.json(
      { error: "Organization and email are required" },
      { status: 400 },
    );
  const current = await access(body.organizationId, user.userId);
  if (current?.role !== "Owner")
    return Response.json({ error: "Owner access required" }, { status: 403 });
  const email = body.email.trim().toLowerCase();
  const role = body.role === "Owner" ? "Owner" : "Admin";
  const now = Date.now();
  await getDb()
    .insert(organizationAdminInvitations)
    .values({
      id: `admin-invite-${crypto.randomUUID()}`,
      organizationId: body.organizationId,
      email,
      role,
      status: "Pending",
      invitedByUserId: user.userId,
      claimedByUserId: null,
      createdAt: now,
      claimedAt: null,
    })
    .onConflictDoUpdate({
      target: [
        organizationAdminInvitations.organizationId,
        organizationAdminInvitations.email,
      ],
      set: {
        role,
        status: "Pending",
        invitedByUserId: user.userId,
        claimedByUserId: null,
        claimedAt: null,
      },
    });
  return Response.json({ ok: true });
}

export async function PATCH(request: Request) {
  const user = await getChatGPTUser();
  if (!user)
    return Response.json({ error: "Sign in required" }, { status: 401 });
  const body = (await request.json()) as {
    organizationId?: string;
    adminId?: string;
    action?: "role" | "revoke";
    role?: string;
  };
  if (!body.organizationId || !body.adminId || !body.action)
    return Response.json(
      { error: "Missing administrator operation" },
      { status: 400 },
    );
  const current = await access(body.organizationId, user.userId);
  if (current?.role !== "Owner")
    return Response.json({ error: "Owner access required" }, { status: 403 });
  const db = getDb();
  const admins = await db
    .select()
    .from(organizationAdmins)
    .where(eq(organizationAdmins.organizationId, body.organizationId));
  const target = admins.find((admin) => admin.id === body.adminId);
  if (!target)
    return Response.json({ error: "Administrator not found" }, { status: 404 });
  const owners = admins.filter((admin) => admin.role === "Owner");
  const removesOwner =
    target.role === "Owner" &&
    (body.action === "revoke" || body.role !== "Owner");
  if (removesOwner && owners.length === 1)
    return Response.json(
      { error: "Every organization must retain at least one owner" },
      { status: 409 },
    );
  if (body.action === "revoke")
    await db
      .delete(organizationAdmins)
      .where(eq(organizationAdmins.id, target.id));
  else
    await db
      .update(organizationAdmins)
      .set({ role: body.role === "Owner" ? "Owner" : "Admin" })
      .where(eq(organizationAdmins.id, target.id));
  return Response.json({ ok: true });
}
