import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const organizations = sqliteTable(
  "organizations",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    shortName: text("short_name").notNull(),
    primaryColor: text("primary_color").notNull(),
    accentColor: text("accent_color").notNull(),
    font: text("font").notNull(),
    status: text("status").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [uniqueIndex("idx_organizations_slug").on(table.slug)],
);

export const organizationSettings = sqliteTable("organization_settings", {
  organizationId: text("organization_id").primaryKey(),
  individualPrice: integer("individual_price").notNull().default(79),
  professionalPrice: integer("professional_price").notNull().default(149),
  foundingPrice: integer("founding_price").notNull().default(249),
  requireApprovedMembership: integer("require_approved_membership", {
    mode: "boolean",
  })
    .notNull()
    .default(true),
  showEventAttendees: integer("show_event_attendees", { mode: "boolean" })
    .notNull()
    .default(true),
  eventReminder: integer("event_reminder", { mode: "boolean" })
    .notNull()
    .default(true),
  followUpPrompt: integer("follow_up_prompt", { mode: "boolean" })
    .notNull()
    .default(true),
  renewalNotice: integer("renewal_notice", { mode: "boolean" })
    .notNull()
    .default(true),
  profileReminder: integer("profile_reminder", { mode: "boolean" })
    .notNull()
    .default(false),
  updatedAt: integer("updated_at").notNull(),
});

export const organizationMessages = sqliteTable(
  "organization_messages",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    audience: text("audience").notNull(),
    channel: text("channel").notNull(),
    subject: text("subject").notNull(),
    message: text("message").notNull(),
    status: text("status").notNull().default("Draft"),
    createdByUserId: text("created_by_user_id").notNull(),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
    queuedAt: integer("queued_at"),
  },
  (table) => [
    index("idx_org_messages_org_updated").on(
      table.organizationId,
      table.updatedAt,
    ),
  ],
);

export const organizationMessageDeliveries = sqliteTable(
  "organization_message_deliveries",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    messageId: text("message_id").notNull(),
    memberId: text("member_id").notNull(),
    recipientEmail: text("recipient_email").notNull(),
    status: text("status").notNull(),
    gmailMessageId: text("gmail_message_id"),
    error: text("error"),
    sentAt: integer("sent_at"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("idx_message_deliveries_message_member").on(table.messageId, table.memberId),
    index("idx_message_deliveries_org_status").on(table.organizationId, table.status),
  ],
);

export const gmailConnections = sqliteTable(
  "gmail_connections",
  {
    organizationId: text("organization_id").primaryKey(),
    senderEmail: text("sender_email").notNull(),
    encryptedRefreshToken: text("encrypted_refresh_token").notNull(),
    encryptedAccessToken: text("encrypted_access_token"),
    accessTokenExpiresAt: integer("access_token_expires_at"),
    connectedByUserId: text("connected_by_user_id").notNull(),
    connectedAt: integer("connected_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [index("idx_gmail_connections_sender").on(table.senderEmail)],
);

export const organizationAdmins = sqliteTable(
  "organization_admins",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    userId: text("user_id").notNull(),
    email: text("email").notNull(),
    role: text("role").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("idx_org_admins_org_user").on(
      table.organizationId,
      table.userId,
    ),
    index("idx_org_admins_user").on(table.userId),
  ],
);

export const memberAccounts = sqliteTable(
  "member_accounts",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    userId: text("user_id").notNull(),
    memberId: text("member_id").notNull(),
    email: text("email").notNull(),
    status: text("status").notNull().default("Active"),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("idx_member_accounts_org_user").on(
      table.organizationId,
      table.userId,
    ),
    uniqueIndex("idx_member_accounts_org_member").on(
      table.organizationId,
      table.memberId,
    ),
    index("idx_member_accounts_email").on(table.email),
  ],
);

export const memberInvitations = sqliteTable(
  "member_invitations",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    memberId: text("member_id").notNull(),
    email: text("email").notNull(),
    role: text("role").notNull().default("Member"),
    status: text("status").notNull().default("Pending"),
    invitedByUserId: text("invited_by_user_id").notNull(),
    claimedByUserId: text("claimed_by_user_id"),
    createdAt: integer("created_at").notNull(),
    claimedAt: integer("claimed_at"),
  },
  (table) => [
    uniqueIndex("idx_member_invitations_org_email").on(
      table.organizationId,
      table.email,
    ),
    index("idx_member_invitations_email_status").on(table.email, table.status),
  ],
);

export const organizationAdminInvitations = sqliteTable(
  "organization_admin_invitations",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    email: text("email").notNull(),
    role: text("role").notNull().default("Admin"),
    status: text("status").notNull().default("Pending"),
    invitedByUserId: text("invited_by_user_id").notNull(),
    claimedByUserId: text("claimed_by_user_id"),
    createdAt: integer("created_at").notNull(),
    claimedAt: integer("claimed_at"),
  },
  (table) => [
    uniqueIndex("idx_org_admin_invites_org_email").on(
      table.organizationId,
      table.email,
    ),
    index("idx_org_admin_invites_email_status").on(table.email, table.status),
  ],
);

export const activityEvents = sqliteTable(
  "activity_events",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull().default("tbc"),
    kind: text("kind").notNull(),
    memberId: text("member_id"),
    eventId: text("event_id"),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [
    index("idx_activity_org_created").on(table.organizationId, table.createdAt),
  ],
);

export const members = sqliteTable(
  "members",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    name: text("name").notNull(),
    initials: text("initials").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull().default(""),
    title: text("title").notNull().default(""),
    company: text("company").notNull().default(""),
    industry: text("industry").notNull().default(""),
    plan: text("plan").notNull().default("Individual"),
    status: text("status").notNull().default("Invited"),
    completion: integer("completion").notNull().default(20),
    bio: text("bio").notNull().default(""),
    lookingFor: text("looking_for").notNull().default(""),
    canHelp: text("can_help").notNull().default(""),
    interests: text("interests").notNull().default(""),
    emailOptOut: integer("email_opt_out", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    index("idx_members_org_name").on(table.organizationId, table.name),
    uniqueIndex("idx_members_org_email").on(table.organizationId, table.email),
  ],
);

export const events = sqliteTable(
  "events",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    month: text("month").notNull(),
    day: text("day").notNull(),
    year: integer("year").notNull(),
    title: text("title").notNull(),
    place: text("place").notNull().default(""),
    address: text("address").notNull().default(""),
    time: text("time").notNull(),
    endTime: text("end_time").notNull(),
    going: integer("going").notNull().default(0),
    capacity: integer("capacity").notNull().default(100),
    matches: integer("matches").notNull().default(0),
    status: text("status").notNull().default("Draft"),
    description: text("description").notNull().default(""),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    index("idx_events_org_date").on(
      table.organizationId,
      table.year,
      table.month,
      table.day,
    ),
  ],
);

export const eventRegistrations = sqliteTable(
  "event_registrations",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    eventId: text("event_id").notNull(),
    memberId: text("member_id").notNull(),
    status: text("status").notNull().default("Registered"),
    checkedIn: integer("checked_in", { mode: "boolean" })
      .notNull()
      .default(false),
    registeredAt: integer("registered_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
    checkedInAt: integer("checked_in_at"),
  },
  (table) => [
    uniqueIndex("idx_event_registrations_org_event_member").on(
      table.organizationId,
      table.eventId,
      table.memberId,
    ),
    index("idx_event_registrations_org_event_status").on(
      table.organizationId,
      table.eventId,
      table.status,
    ),
    index("idx_event_registrations_org_member").on(
      table.organizationId,
      table.memberId,
    ),
  ],
);

export const memberActions = sqliteTable(
  "member_actions",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    userId: text("user_id").notNull(),
    kind: text("kind").notNull(),
    memberId: text("member_id"),
    eventId: text("event_id"),
    note: text("note").notNull().default(""),
    due: text("due").notNull().default(""),
    done: integer("done", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    index("idx_member_actions_org_user").on(table.organizationId, table.userId),
    index("idx_member_actions_kind_event").on(
      table.organizationId,
      table.kind,
      table.eventId,
    ),
  ],
);

export const networkingGoals = sqliteTable(
  "networking_goals",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    userId: text("user_id").notNull(),
    idealClients: text("ideal_clients").notNull().default(""),
    referralPartners: text("referral_partners").notNull().default(""),
    currentGoal: text("current_goal").notNull().default(""),
    expertise: text("expertise").notNull().default(""),
    introductions: text("introductions").notNull().default(""),
    geography: text("geography").notNull().default(""),
    industries: text("industries").notNull().default(""),
    visibility: text("visibility").notNull().default("members"),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("idx_networking_goals_org_user").on(
      table.organizationId,
      table.userId,
    ),
  ],
);
