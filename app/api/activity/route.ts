import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { activityEvents, organizationAdmins } from "../../../db/schema";
import { getChatGPTUser } from "../../chatgpt-auth";

async function canAccess(organizationId: string, userId: string) {
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
  try {
    const user = await getChatGPTUser();
    if (!user)
      return Response.json({ error: "Sign in required" }, { status: 401 });
    const organizationId =
      new URL(request.url).searchParams.get("organization_id") || "tbc";
    if (!(await canAccess(organizationId, user.userId)))
      return Response.json(
        { error: "Not authorized for this organization" },
        { status: 403 },
      );
    const rows = await getDb()
      .select()
      .from(activityEvents)
      .where(eq(activityEvents.organizationId, organizationId))
      .orderBy(desc(activityEvents.createdAt))
      .limit(1000);
    return Response.json({ activities: rows });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to load activity",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      id?: string;
      kind?: string;
      memberId?: string | null;
      eventId?: string | null;
      organizationId?: string;
      createdAt?: number;
    };
    if (!body.id || !body.kind)
      return Response.json(
        { error: "id and kind are required" },
        { status: 400 },
      );
    const user = await getChatGPTUser();
    if (!user)
      return Response.json({ error: "Sign in required" }, { status: 401 });
    const organizationId = body.organizationId || "tbc";
    if (!(await canAccess(organizationId, user.userId)))
      return Response.json(
        { error: "Not authorized for this organization" },
        { status: 403 },
      );
    const [activity] = await getDb()
      .insert(activityEvents)
      .values({
        id: body.id,
        organizationId,
        kind: body.kind,
        memberId: body.memberId || null,
        eventId: body.eventId || null,
        createdAt: body.createdAt || Date.now(),
      })
      .onConflictDoNothing()
      .returning();
    return Response.json({ activity }, { status: 201 });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to save activity",
      },
      { status: 500 },
    );
  }
}
