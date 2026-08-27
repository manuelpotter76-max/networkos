import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { gmailConnections } from "../../../../db/schema";
import { getChatGPTUser } from "../../../chatgpt-auth";
import { gmailEnv, intendedSender, isOrganizationAdmin } from "../shared";

export async function GET(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign in required" }, { status: 401 });
  const organizationId = new URL(request.url).searchParams.get("organization_id");
  if (!organizationId || !(await isOrganizationAdmin(organizationId, user.userId)))
    return Response.json({ error: "Administrator access required" }, { status: 403 });
  const [connection] = await getDb()
    .select({ senderEmail: gmailConnections.senderEmail, connectedAt: gmailConnections.connectedAt })
    .from(gmailConnections)
    .where(eq(gmailConnections.organizationId, organizationId))
    .limit(1);
  const configured = Boolean(gmailEnv().clientId && gmailEnv().clientSecret);
  return Response.json({
    configured,
    connected: Boolean(connection),
    senderEmail: connection?.senderEmail || intendedSender,
    connectedAt: connection?.connectedAt || null,
  });
}
