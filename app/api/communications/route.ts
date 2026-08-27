import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { organizationAdmins, organizationMessages } from "../../../db/schema";
import { getChatGPTUser } from "../../chatgpt-auth";

async function isAdmin(organizationId: string, userId: string) {
  const rows = await getDb()
    .select({ id: organizationAdmins.id })
    .from(organizationAdmins)
    .where(
      and(
        eq(organizationAdmins.organizationId, organizationId),
        eq(organizationAdmins.userId, userId),
      ),
    )
    .limit(1);
  return rows.length > 0;
}

export async function GET(request: Request) {
  const user = await getChatGPTUser();
  if (!user)
    return Response.json({ error: "Sign in required" }, { status: 401 });
  const organizationId = new URL(request.url).searchParams.get(
    "organization_id",
  );
  if (!organizationId || !(await isAdmin(organizationId, user.userId)))
    return Response.json(
      { error: "Administrator access required" },
      { status: 403 },
    );
  const messages = await getDb()
    .select()
    .from(organizationMessages)
    .where(eq(organizationMessages.organizationId, organizationId))
    .orderBy(desc(organizationMessages.updatedAt))
    .limit(100);
  return Response.json({ messages });
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user)
    return Response.json({ error: "Sign in required" }, { status: 401 });
  const body = (await request.json()) as {
    id?: string;
    organizationId?: string;
    audience?: string;
    channel?: string;
    subject?: string;
    message?: string;
    status?: string;
  };
  if (!body.organizationId || !body.subject?.trim() || !body.message?.trim())
    return Response.json(
      { error: "Organization, subject, and message are required" },
      { status: 400 },
    );
  if (!(await isAdmin(body.organizationId, user.userId)))
    return Response.json(
      { error: "Administrator access required" },
      { status: 403 },
    );
  const now = Date.now();
  const status = body.status === "Ready for Gmail" ? "Ready for Gmail" : "Draft";
  const record = {
    id: body.id || `message-${crypto.randomUUID()}`,
    organizationId: body.organizationId,
    audience: body.audience || "All active members",
    channel: body.channel || "Email + in-app",
    subject: body.subject.trim(),
    message: body.message.trim(),
    status,
    createdByUserId: user.userId,
    createdAt: now,
    updatedAt: now,
    queuedAt: status === "Ready for Gmail" ? now : null,
  };
  await getDb()
    .insert(organizationMessages)
    .values(record)
    .onConflictDoUpdate({
      target: organizationMessages.id,
      set: {
        audience: record.audience,
        channel: record.channel,
        subject: record.subject,
        message: record.message,
        status,
        updatedAt: now,
        queuedAt: record.queuedAt,
      },
    });
  return Response.json({ message: record });
}
