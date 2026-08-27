import { and, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import {
  events,
  memberAccounts,
  memberActions,
  memberInvitations,
  members,
  networkingGoals,
  organizationSettings,
  organizationAdmins,
} from "../../../db/schema";
import { getChatGPTUser } from "../../chatgpt-auth";
import { people } from "../../../lib/demo";

async function authorized(organizationId: string, userId: string) {
  const adminRows = await getDb()
    .select({ id: organizationAdmins.id })
    .from(organizationAdmins)
    .where(
      and(
        eq(organizationAdmins.organizationId, organizationId),
        eq(organizationAdmins.userId, userId),
      ),
    )
    .limit(1);
  if (adminRows.length > 0) return true;
  const memberRows = await getDb()
    .select({ id: memberAccounts.id })
    .from(memberAccounts)
    .where(
      and(
        eq(memberAccounts.organizationId, organizationId),
        eq(memberAccounts.userId, userId),
        eq(memberAccounts.status, "Active"),
      ),
    )
    .limit(1);
  return memberRows.length > 0;
}

async function isAdministrator(organizationId: string, userId: string) {
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

function publicMember(row: typeof members.$inferSelect) {
  const {
    organizationId: _organizationId,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...member
  } = row;
  return member;
}

function publicEvent(row: typeof events.$inferSelect) {
  const {
    organizationId: _organizationId,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...event
  } = row;
  return event;
}

export async function GET(request: Request) {
  const user = await getChatGPTUser();
  if (!user)
    return Response.json({ error: "Sign in required" }, { status: 401 });
  const organizationId =
    new URL(request.url).searchParams.get("organization_id") || "tbc";
  if (!(await authorized(organizationId, user.userId)))
    return Response.json({ error: "Not authorized" }, { status: 403 });
  const db = getDb();
  let [memberRows, eventRows, actionRows, goalRows, settingsRows] =
    await Promise.all([
      db
        .select()
        .from(members)
        .where(eq(members.organizationId, organizationId)),
      db.select().from(events).where(eq(events.organizationId, organizationId)),
      db
        .select()
        .from(memberActions)
        .where(
          and(
            eq(memberActions.organizationId, organizationId),
            eq(memberActions.userId, user.userId),
          ),
        ),
      db
        .select()
        .from(networkingGoals)
        .where(
          and(
            eq(networkingGoals.organizationId, organizationId),
            eq(networkingGoals.userId, user.userId),
          ),
        )
        .limit(1),
      db
        .select()
        .from(organizationSettings)
        .where(eq(organizationSettings.organizationId, organizationId))
        .limit(1),
    ]);
  if (organizationId === "tbc" && memberRows.length === 0) {
    const now = Date.now();
    await db.batch(
      people.map((person, index) =>
        db
          .insert(members)
          .values({
            id: person.id,
            organizationId,
            name: person.name,
            initials: person.initials,
            email: `${person.name.toLowerCase().replace(/ /g, ".")}@example.com`,
            phone: `(813) 555-01${String(index + 10).slice(-2)}`,
            title: person.title,
            company: person.company,
            industry: person.industry,
            plan:
              index === 2
                ? "Founding"
                : index === 4
                  ? "Individual"
                  : "Professional",
            status: index === 4 ? "Invited" : "Active",
            completion: index === 4 ? 36 : index === 1 ? 82 : 100,
            bio: person.notes.join(" "),
            lookingFor: person.needs.join(", "),
            canHelp: person.offers.join(", "),
            interests: person.notes.join(", "),
            createdAt: now,
            updatedAt: now,
          })
          .onConflictDoNothing(),
      ),
    );
    memberRows = await db
      .select()
      .from(members)
      .where(eq(members.organizationId, organizationId));
  }
  if (organizationId === "tbc" && eventRows.length === 0) {
    const now = Date.now();
    const seedEvents = [
      [
        "after-hours",
        "AUG",
        "27",
        "Business After Hours",
        "Oxford Exchange",
        "420 W Kennedy Blvd, Tampa, FL 33606",
        "6:00 PM",
        "8:00 PM",
        142,
        200,
        6,
        "An evening of curated introductions and relationship-building with Tampa business leaders.",
      ],
      [
        "roundtable",
        "SEP",
        "12",
        "Executive Roundtable",
        "The Tampa Club",
        "101 E Kennedy Blvd, Tampa, FL 33602",
        "7:30 AM",
        "9:00 AM",
        48,
        60,
        4,
        "A facilitated discussion for owners and executives navigating growth.",
      ],
      [
        "connection-lunch",
        "SEP",
        "24",
        "Member Connection Lunch",
        "Armature Works",
        "1910 N Ola Ave, Tampa, FL 33602",
        "11:30 AM",
        "1:00 PM",
        86,
        120,
        8,
        "Small-table conversations built around member needs, offers, and introductions.",
      ],
    ] as const;
    await db.batch(
      seedEvents.map((e) =>
        db
          .insert(events)
          .values({
            id: e[0],
            organizationId,
            month: e[1],
            day: e[2],
            year: 2026,
            title: e[3],
            place: e[4],
            address: e[5],
            time: e[6],
            endTime: e[7],
            going: e[8],
            capacity: e[9],
            matches: e[10],
            status: "Published",
            description: e[11],
            createdAt: now,
            updatedAt: now,
          })
          .onConflictDoNothing(),
      ),
    );
    eventRows = await db
      .select()
      .from(events)
      .where(eq(events.organizationId, organizationId));
  }
  let accountRows = await db
    .select()
    .from(memberAccounts)
    .where(
      and(
        eq(memberAccounts.organizationId, organizationId),
        eq(memberAccounts.userId, user.userId),
      ),
    )
    .limit(1);
  if (accountRows.length === 0) {
    const now = Date.now();
    const memberId = `profile-${organizationId}-${user.userId}`;
    const displayName = user.fullName || user.email.split("@")[0];
    const initials = displayName
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    await db.batch([
      db
        .insert(members)
        .values({
          id: memberId,
          organizationId,
          name: displayName,
          initials: initials || "ME",
          email: user.email,
          phone: "",
          title: "",
          company: "",
          industry: "",
          plan: "Professional",
          status: "Active",
          completion: 30,
          bio: "",
          lookingFor: "",
          canHelp: "",
          interests: "",
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoNothing(),
      db
        .insert(memberAccounts)
        .values({
          id: `${organizationId}-${user.userId}`,
          organizationId,
          userId: user.userId,
          memberId,
          email: user.email,
          status: "Active",
          createdAt: now,
        })
        .onConflictDoNothing(),
    ]);
    accountRows = await db
      .select()
      .from(memberAccounts)
      .where(
        and(
          eq(memberAccounts.organizationId, organizationId),
          eq(memberAccounts.userId, user.userId),
        ),
      )
      .limit(1);
    memberRows = await db
      .select()
      .from(members)
      .where(eq(members.organizationId, organizationId));
  }
  const currentMember = memberRows.find(
    (member) => member.id === accountRows[0]?.memberId,
  );
  if (!settingsRows.length) {
    await db
      .insert(organizationSettings)
      .values({ organizationId, updatedAt: Date.now() })
      .onConflictDoNothing();
    settingsRows = await db
      .select()
      .from(organizationSettings)
      .where(eq(organizationSettings.organizationId, organizationId))
      .limit(1);
  }
  return Response.json({
    members: memberRows.map(publicMember),
    events: eventRows.map(publicEvent),
    actions: actionRows,
    goals: goalRows[0] || null,
    currentMember: currentMember ? publicMember(currentMember) : null,
    settings: settingsRows[0],
  });
}

export async function PUT(request: Request) {
  const user = await getChatGPTUser();
  if (!user)
    return Response.json({ error: "Sign in required" }, { status: 401 });
  const body = (await request.json()) as {
    organizationId?: string;
    type?: "member" | "event" | "action" | "goals" | "settings";
    record?: Record<string, unknown>;
  };
  if (
    !body.organizationId ||
    !body.type ||
    !body.record ||
    (!["goals", "settings"].includes(body.type) && !body.record.id)
  )
    return Response.json(
      { error: "Organization, type, and record are required" },
      { status: 400 },
    );
  if (!(await authorized(body.organizationId, user.userId)))
    return Response.json({ error: "Not authorized" }, { status: 403 });
  const now = Date.now();
  const db = getDb();
  if (body.type === "member") {
    const record = body.record as typeof members.$inferInsert;
    if (!(await isAdministrator(body.organizationId, user.userId))) {
      const account = await db
        .select({ memberId: memberAccounts.memberId })
        .from(memberAccounts)
        .where(
          and(
            eq(memberAccounts.organizationId, body.organizationId),
            eq(memberAccounts.userId, user.userId),
          ),
        )
        .limit(1);
      if (!account.length || account[0].memberId !== record.id)
        return Response.json(
          { error: "Members may update only their own profile" },
          { status: 403 },
        );
    }
    const existing = await db
      .select({ id: members.id })
      .from(members)
      .where(
        and(
          eq(members.id, String(record.id)),
          eq(members.organizationId, body.organizationId),
        ),
      )
      .limit(1);
    if (existing.length) {
      await db
        .update(members)
        .set({ ...record, organizationId: body.organizationId, updatedAt: now })
        .where(
          and(
            eq(members.id, String(record.id)),
            eq(members.organizationId, body.organizationId),
          ),
        );
    } else {
      await db.insert(members).values({
        ...record,
        organizationId: body.organizationId,
        createdAt: now,
        updatedAt: now,
      });
    }
    if (
      record.status === "Invited" &&
      (await isAdministrator(body.organizationId, user.userId))
    ) {
      const email = String(record.email).trim().toLowerCase();
      await db
        .insert(memberInvitations)
        .values({
          id: `invite-${crypto.randomUUID()}`,
          organizationId: body.organizationId,
          memberId: String(record.id),
          email,
          role: "Member",
          status: "Pending",
          invitedByUserId: user.userId,
          claimedByUserId: null,
          createdAt: now,
          claimedAt: null,
        })
        .onConflictDoUpdate({
          target: [memberInvitations.organizationId, memberInvitations.email],
          set: {
            memberId: String(record.id),
            status: "Pending",
            invitedByUserId: user.userId,
            claimedByUserId: null,
            claimedAt: null,
          },
        });
    }
  } else if (body.type === "event") {
    if (!(await isAdministrator(body.organizationId, user.userId)))
      return Response.json(
        { error: "Administrator access required" },
        { status: 403 },
      );
    const record = body.record as typeof events.$inferInsert;
    const existing = await db
      .select({ id: events.id })
      .from(events)
      .where(
        and(
          eq(events.id, String(record.id)),
          eq(events.organizationId, body.organizationId),
        ),
      )
      .limit(1);
    if (existing.length) {
      await db
        .update(events)
        .set({ ...record, organizationId: body.organizationId, updatedAt: now })
        .where(
          and(
            eq(events.id, String(record.id)),
            eq(events.organizationId, body.organizationId),
          ),
        );
    } else {
      await db.insert(events).values({
        ...record,
        organizationId: body.organizationId,
        createdAt: now,
        updatedAt: now,
      });
    }
  } else if (body.type === "action") {
    const record = body.record as typeof memberActions.$inferInsert;
    const existing = await db
      .select({ id: memberActions.id })
      .from(memberActions)
      .where(
        and(
          eq(memberActions.id, String(record.id)),
          eq(memberActions.organizationId, body.organizationId),
          eq(memberActions.userId, user.userId),
        ),
      )
      .limit(1);
    const values = {
      ...record,
      organizationId: body.organizationId,
      userId: user.userId,
      updatedAt: now,
    };
    if (existing.length)
      await db
        .update(memberActions)
        .set(values)
        .where(
          and(
            eq(memberActions.id, String(record.id)),
            eq(memberActions.organizationId, body.organizationId),
            eq(memberActions.userId, user.userId),
          ),
        );
    else await db.insert(memberActions).values({ ...values, createdAt: now });
  } else if (body.type === "goals") {
    const record = body.record as typeof networkingGoals.$inferInsert;
    const id = `${body.organizationId}-${user.userId}`;
    await db
      .insert(networkingGoals)
      .values({
        ...record,
        id,
        organizationId: body.organizationId,
        userId: user.userId,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: networkingGoals.id,
        set: {
          ...record,
          organizationId: body.organizationId,
          userId: user.userId,
          updatedAt: now,
        },
      });
  } else {
    if (!(await isAdministrator(body.organizationId, user.userId)))
      return Response.json(
        { error: "Administrator access required" },
        { status: 403 },
      );
    const record = body.record as typeof organizationSettings.$inferInsert;
    await db
      .insert(organizationSettings)
      .values({
        ...record,
        organizationId: body.organizationId,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: organizationSettings.organizationId,
        set: { ...record, organizationId: body.organizationId, updatedAt: now },
      });
  }
  return Response.json({ ok: true });
}
