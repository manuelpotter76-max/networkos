import { and, eq } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { getDb } from "../../../db";
import { organizationAdmins } from "../../../db/schema";

export const intendedSender = "admin@tampabusinessclub.com";

export function gmailEnv() {
  const values = env as unknown as {
    GOOGLE_GMAIL_CLIENT_ID?: string;
    GOOGLE_GMAIL_CLIENT_SECRET?: string;
  };
  return {
    clientId: values.GOOGLE_GMAIL_CLIENT_ID || "",
    clientSecret: values.GOOGLE_GMAIL_CLIENT_SECRET || "",
  };
}

export async function isOrganizationAdmin(organizationId: string, userId: string) {
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
