"use client";

import { CSSProperties, FormEvent, useEffect, useMemo, useState } from "react";
import { people } from "../lib/demo";

type Role = "guest" | "member" | "admin";
type MemberTab = "home" | "events" | "network" | "connections" | "profile";
type AdminTab =
  | "overview"
  | "organizations"
  | "analytics"
  | "membership"
  | "members"
  | "events"
  | "communications"
  | "settings";
type BrandSettings = {
  name: string;
  shortName: string;
  primary: string;
  accent: string;
  font: string;
  logo?: string;
  shareImage?: string;
};
type ClubEvent = {
  id: string;
  month: string;
  day: string;
  year: number;
  title: string;
  place: string;
  address: string;
  time: string;
  endTime: string;
  going: number;
  capacity: number;
  matches: number;
  status: "Published" | "Draft";
  description: string;
};
type MemberRecord = {
  id: string;
  name: string;
  initials: string;
  email: string;
  phone: string;
  title: string;
  company: string;
  industry: string;
  plan: string;
  status: string;
  completion: number;
  bio: string;
  lookingFor: string;
  canHelp: string;
  interests: string;
  emailOptOut: boolean;
};
type FollowUp = {
  id: string;
  memberId: string;
  note: string;
  due: string;
  done: boolean;
};
type MemberAction = {
  id: string;
  kind: string;
  memberId: string | null;
  eventId: string | null;
  note: string;
  due: string;
  done: boolean;
};
type IntroductionStatus =
  | "Requested"
  | "Accepted"
  | "Introduced"
  | "Helpful connection"
  | "Business opportunity"
  | "Not a fit";
type NetworkingGoals = {
  idealClients: string;
  referralPartners: string;
  currentGoal: string;
  expertise: string;
  introductions: string;
  geography: string;
  industries: string;
  visibility: string;
};
type OrganizationSettings = {
  individualPrice: number;
  professionalPrice: number;
  foundingPrice: number;
  requireApprovedMembership: boolean;
  showEventAttendees: boolean;
  eventReminder: boolean;
  followUpPrompt: boolean;
  renewalNotice: boolean;
  profileReminder: boolean;
};
const defaultOrganizationSettings: OrganizationSettings = {
  individualPrice: 79,
  professionalPrice: 149,
  foundingPrice: 249,
  requireApprovedMembership: true,
  showEventAttendees: true,
  eventReminder: true,
  followUpPrompt: true,
  renewalNotice: true,
  profileReminder: false,
};
type Activity = {
  id: string;
  kind: string;
  memberId: string | null;
  eventId: string | null;
  createdAt: number;
};
type EventRegistration = {
  id: string;
  organizationId: string;
  eventId: string;
  memberId: string;
  status: "Registered" | "Waitlisted" | "Cancelled";
  checkedIn: boolean;
  registeredAt: number;
  updatedAt: number;
  checkedInAt: number | null;
};
type Organization = {
  id: string;
  name: string;
  slug: string;
  shortName: string;
  primaryColor: string;
  accentColor: string;
  font: string;
  status: string;
  createdAt: number;
};

const initialBrand: BrandSettings = {
  name: "Tampa Business Club",
  shortName: "TB",
  primary: "#0c443a",
  accent: "#d9b46d",
  font: "Inter",
};
const initialEvents: ClubEvent[] = [
  {
    id: "after-hours",
    month: "AUG",
    day: "27",
    year: 2026,
    title: "Business After Hours",
    place: "Oxford Exchange",
    address: "420 W Kennedy Blvd, Tampa, FL 33606",
    time: "6:00 PM",
    endTime: "8:00 PM",
    going: 142,
    capacity: 200,
    matches: 6,
    status: "Published",
    description:
      "An evening of curated introductions and relationship-building with Tampa business leaders.",
  },
  {
    id: "roundtable",
    month: "SEP",
    day: "12",
    year: 2026,
    title: "Executive Roundtable",
    place: "The Tampa Club",
    address: "101 E Kennedy Blvd, Tampa, FL 33602",
    time: "7:30 AM",
    endTime: "9:00 AM",
    going: 48,
    capacity: 60,
    matches: 4,
    status: "Published",
    description:
      "A facilitated discussion for owners and executives navigating growth.",
  },
  {
    id: "connection-lunch",
    month: "SEP",
    day: "24",
    year: 2026,
    title: "Member Connection Lunch",
    place: "Armature Works",
    address: "1910 N Ola Ave, Tampa, FL 33602",
    time: "11:30 AM",
    endTime: "1:00 PM",
    going: 86,
    capacity: 120,
    matches: 8,
    status: "Published",
    description:
      "Small-table conversations built around member needs, offers, and introductions.",
  },
];
const initialMembers: MemberRecord[] = people.map((p, index) => ({
  id: p.id,
  name: p.name,
  initials: p.initials,
  email: `${p.name.toLowerCase().replace(/ /g, ".")}@example.com`,
  phone: `(813) 555-01${String(index + 10).slice(-2)}`,
  title: p.title,
  company: p.company,
  industry: p.industry,
  plan: index === 2 ? "Founding" : index === 4 ? "Individual" : "Professional",
  status: index === 4 ? "Invited" : "Active",
  completion: index === 4 ? 36 : index === 1 ? 82 : 100,
  bio: p.notes.join(" "),
  lookingFor: p.needs.join(", "),
  canHelp: p.offers.join(", "),
  interests: p.notes.join(", "),
  emailOptOut: false,
}));
const registeredCount = (rows: EventRegistration[], eventId: string) =>
  rows.filter((row) => row.eventId === eventId && row.status === "Registered")
    .length;

const words = (value: string) =>
  new Set(
    value
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length > 3),
  );
function smartMatch(member: MemberRecord, goals: NetworkingGoals | null) {
  const target = words(
    goals
      ? `${goals.idealClients} ${goals.referralPartners} ${goals.currentGoal} ${goals.industries} ${goals.geography}`
      : "business owners strategic partners Tampa professional services",
  );
  const profile = words(
    `${member.industry} ${member.title} ${member.company} ${member.bio} ${member.canHelp} ${member.lookingFor} ${member.interests}`,
  );
  const overlap = [...target].filter((word) => profile.has(word));
  const reciprocal = [...words(member.lookingFor)].filter((word) =>
    words(goals?.expertise || "business strategy introductions growth planning").has(word),
  );
  const score = Math.min(96, 58 + overlap.length * 7 + reciprocal.length * 5);
  const reasons = [
    overlap.length ? `Matches your interest in ${overlap.slice(0, 2).join(" and ")}` : `Adds ${member.industry || "new expertise"} to your network`,
    member.canHelp ? `Can help with ${member.canHelp.split(",")[0].toLowerCase()}` : "Offers a new relationship path",
    reciprocal.length ? "Your expertise may also be useful to them" : "Explore where you can create mutual value",
  ];
  return { score, reasons };
}
function relationshipStrength(memberId: string, activities: Activity[]) {
  const rows = activities.filter((row) => row.memberId === memberId);
  const points = rows.reduce(
    (sum, row) =>
      sum +
      (row.kind === "met"
        ? 18
        : row.kind === "follow_up_completed"
          ? 16
          : row.kind === "introduction_accepted"
            ? 20
            : row.kind.includes("introduction")
              ? 12
              : 5),
    0,
  );
  const score = Math.min(100, points);
  return {
    score,
    label: score >= 70 ? "Strong" : score >= 35 ? "Developing" : score ? "New" : "Not started",
    actions: rows.length,
  };
}
function followUpSuggestion(member: MemberRecord, event?: ClubEvent) {
  const topic = member.lookingFor || member.industry || "their current goals";
  return `Hi ${member.name.split(" ")[0]}, it was great connecting${event ? ` at ${event.title}` : " through Tampa Business Club"}. I remembered you’re focused on ${topic.split(",")[0].toLowerCase()}. Would you like to continue the conversation next week?`;
}
function strongMatchCount(
  members: MemberRecord[],
  goals: NetworkingGoals | null,
  currentMemberId?: string,
) {
  return members.filter(
    (member) =>
      member.id !== currentMemberId && smartMatch(member, goals).score >= 70,
  ).length;
}

export default function Page() {
  const [role, setRole] = useState<Role>("guest");
  const [memberTab, setMemberTab] = useState<MemberTab>("home");
  const [adminTab, setAdminTab] = useState<AdminTab>("overview");
  const [signIn, setSignIn] = useState(false);
  const [members, setMembers] = useState(initialMembers);
  const [events, setEvents] = useState(initialEvents);
  const [brand, setBrand] = useState(initialBrand);
  const [modal, setModal] = useState<
    null | "my-profile" | "invite" | "create-event" | "create-organization"
  >(null);
  const [selectedMember, setSelectedMember] = useState<MemberRecord | null>(
    null,
  );
  const [planEvent, setPlanEvent] = useState<ClubEvent | null>(null);
  const [manageEvent, setManageEvent] = useState<ClubEvent | null>(null);
  const [attendeeEvent, setAttendeeEvent] = useState<ClubEvent | null>(null);
  const [publicEvent, setPublicEvent] = useState<ClubEvent | null>(null);
  const [eventMode, setEventMode] = useState<ClubEvent | null>(null);
  const [onboarding, setOnboarding] = useState(false);
  const [rsvps, setRsvps] = useState<string[]>([]);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [metIds, setMetIds] = useState<string[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [introductions, setIntroductions] = useState<string[]>([]);
  const [introductionStatuses, setIntroductionStatuses] = useState<
    Record<string, IntroductionStatus>
  >({});
  const [goals, setGoals] = useState<NetworkingGoals | null>(null);
  const [organizationSettings, setOrganizationSettings] = useState(
    defaultOrganizationSettings,
  );
  const [activities, setActivities] = useState<Activity[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [canAdmin, setCanAdmin] = useState(false);
  const [currentMember, setCurrentMember] = useState<MemberRecord | null>(null);
  const [currentOrganizationId, setCurrentOrganizationId] = useState("tbc");
  const [campaignAudience, setCampaignAudience] =
    useState("All active members");
  const [toast, setToast] = useState("");

  useEffect(() => {
    if ("serviceWorker" in navigator)
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    const id = new URLSearchParams(window.location.search).get("event");
    if (id) setPublicEvent(initialEvents.find((e) => e.id === id) || null);
    fetch("/api/organizations")
      .then((r) => (r.ok ? r.json() : { organizations: [] }))
      .then((data) => {
        setOrganizations(data.organizations || []);
        setCanAdmin(Boolean(data.canAdmin));
      })
      .catch(() => undefined);
  }, []);
  useEffect(() => {
    const org = organizations.find((o) => o.id === currentOrganizationId);
    if (org) {
      setBrand({
        name: org.name,
        shortName: org.shortName,
        primary: org.primaryColor,
        accent: org.accentColor,
        font: org.font,
      });
      Promise.all([
        fetch(
          `/api/workspace?organization_id=${encodeURIComponent(currentOrganizationId)}`,
        ).then((r) => (r.ok ? r.json() : { members: [], events: [] })),
        fetch(
          `/api/activity?organization_id=${encodeURIComponent(currentOrganizationId)}`,
        ).then((r) => (r.ok ? r.json() : { activities: [] })),
        fetch(
          `/api/registrations?organization_id=${encodeURIComponent(currentOrganizationId)}`,
        ).then((r) => (r.ok ? r.json() : { registrations: [] })),
      ])
        .then(([workspace, activity, registrationData]) => {
          setMembers(workspace.members || []);
          setEvents(workspace.events || []);
          const actions = (workspace.actions || []) as MemberAction[];
          const savedRegistrations = (registrationData.registrations || []) as EventRegistration[];
          setRegistrations(savedRegistrations);
          setRsvps(savedRegistrations.filter((row) => row.memberId === workspace.currentMember?.id && row.status !== "Cancelled").map((row) => row.eventId));
          setMetIds(
            actions
              .filter((a) => a.kind === "met" && a.done && a.memberId)
              .map((a) => a.memberId as string),
          );
          setIntroductions(
            actions
              .filter(
                (a) =>
                  a.kind === "introduction_requested" && a.done && a.memberId,
              )
              .map((a) => a.memberId as string),
          );
          const statuses: Record<string, IntroductionStatus> = {};
          for (const action of actions) {
            if (!action.memberId || !action.kind.startsWith("introduction_")) continue;
            const status =
              action.kind === "introduction_requested"
                ? "Requested"
                : action.kind === "introduction_accepted"
                  ? "Accepted"
                  : action.kind === "introduction_completed"
                    ? "Introduced"
                    : action.kind === "introduction_outcome"
                      ? (action.note as IntroductionStatus)
                      : null;
            if (status) statuses[action.memberId] = status;
          }
          setIntroductionStatuses(statuses);
          setFollowUps(
            actions
              .filter((a) => a.kind === "follow_up" && a.memberId)
              .map((a) => ({
                id: a.id,
                memberId: a.memberId as string,
                note: a.note,
                due: a.due,
                done: a.done,
              })),
          );
          setGoals(workspace.goals || null);
          setCurrentMember(workspace.currentMember || null);
          setOrganizationSettings(
            workspace.settings || defaultOrganizationSettings,
          );
          setActivities(activity.activities || []);
        })
        .catch(() => {
          setMembers([]);
          setEvents([]);
          setActivities([]);
          setRegistrations([]);
        });
    } else if (organizations.length > 0) {
      setCurrentOrganizationId(organizations[0].id);
    } else {
      setMembers([]);
      setEvents([]);
      setActivities([]);
      setRegistrations([]);
      setRsvps([]);
      setMetIds([]);
      setIntroductions([]);
      setIntroductionStatuses({});
      setFollowUps([]);
      setGoals(null);
      setCurrentMember(null);
      setOrganizationSettings(defaultOrganizationSettings);
    }
  }, [currentOrganizationId, organizations]);
  useEffect(() => {
    document.documentElement.style.setProperty("--green", brand.primary);
    document.documentElement.style.setProperty("--gold", brand.accent);
    document.body.style.fontFamily = `${brand.font}, ui-sans-serif, sans-serif`;
  }, [brand]);
  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  }
  function recordActivity(
    kind: string,
    memberId?: string | null,
    eventId?: string | null,
  ) {
    const activity = {
      id: `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      kind,
      memberId: memberId || null,
      eventId: eventId || null,
      createdAt: Date.now(),
    };
    setActivities((v) => [activity, ...v]);
    fetch("/api/activity", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...activity,
        organizationId: currentOrganizationId,
      }),
    }).catch(() => undefined);
  }
  async function persistWorkspaceRecord(
    type: "member" | "event" | "action" | "goals" | "settings",
    record:
      | MemberRecord
      | ClubEvent
      | MemberAction
      | NetworkingGoals
      | OrganizationSettings,
  ) {
    const response = await fetch("/api/workspace", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        organizationId: currentOrganizationId,
        type,
        record,
      }),
    });
    if (!response.ok) throw new Error("Unable to save workspace record");
  }
  async function persistAction(action: MemberAction) {
    await persistWorkspaceRecord("action", action);
  }
  async function updateRegistration(
    eventId: string,
    action: "rsvp" | "cancel" | "promote" | "toggle_checkin",
    memberId?: string,
  ) {
    const response = await fetch("/api/registrations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ organizationId: currentOrganizationId, eventId, action, memberId }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to update registration");
    const row = data.registration as EventRegistration;
    setRegistrations((rows) => [row, ...rows.filter((item) => item.id !== row.id)]);
    if (row.memberId === currentMember?.id) {
      setRsvps((ids) => row.status === "Cancelled" ? ids.filter((id) => id !== eventId) : ids.includes(eventId) ? ids : [...ids, eventId]);
    }
    return row;
  }

  const common = {
    brand,
    members,
    events,
    setMembers,
    setEvents,
    notify,
    setSelectedMember,
    setPlanEvent,
    setManageEvent,
    setAttendeeEvent,
    setModal,
    setEventMode,
    setOnboarding,
    rsvps,
    setRsvps,
    registrations,
    setRegistrations,
    updateRegistration,
    metIds,
    setMetIds,
    followUps,
    setFollowUps,
    introductions,
    setIntroductions,
    introductionStatuses,
    setIntroductionStatuses,
    activities,
    recordActivity,
    setAdminTab,
    campaignAudience,
    setCampaignAudience,
    organizations,
    currentOrganizationId,
    setCurrentOrganizationId,
    persistWorkspaceRecord,
    persistAction,
    goals,
    setGoals,
    currentMember,
    organizationSettings,
    setOrganizationSettings,
  };
  return (
    <div style={{ "--app-font": brand.font } as CSSProperties}>
      {role === "guest" && publicEvent && (
        <PublicEvent
          event={publicEvent}
          brand={brand}
          members={members}
          registered={rsvps.includes(publicEvent.id)}
          back={() => {
            history.replaceState({}, "", window.location.pathname);
            setPublicEvent(null);
          }}
          signIn={() => setSignIn(true)}
          rsvp={() => {
            setRsvps((v) =>
              v.includes(publicEvent.id) ? v : [...v, publicEvent.id],
            );
            notify("You're registered — confirmation sent");
          }}
          notify={notify}
        />
      )}
      {role === "guest" && !publicEvent && (
        <Welcome brand={brand} open={() => setSignIn(true)} />
      )}
      {role === "member" && (
        <MemberApp
          {...common}
          tab={memberTab}
          setTab={setMemberTab}
          signOut={() => setRole("guest")}
        />
      )}
      {role === "admin" && (
        <AdminApp
          {...common}
          tab={adminTab}
          setTab={setAdminTab}
          setBrand={setBrand}
          signOut={() => setRole("guest")}
        />
      )}
      {signIn && (
        <SignIn
          brand={brand}
          canAdmin={canAdmin}
          close={() => setSignIn(false)}
          enter={(r) => {
            setRole(r);
            setSignIn(false);
          }}
        />
      )}
      {modal === "my-profile" && (
        <MyProfileEditor
          member={currentMember}
          close={() => setModal(null)}
          save={async (member) => {
            await persistWorkspaceRecord("member", member);
            setCurrentMember(member);
            setMembers((rows) =>
              rows.map((row) => (row.id === member.id ? member : row)),
            );
            setModal(null);
            notify("Member profile saved");
          }}
        />
      )}
      {modal === "invite" && (
        <InviteMember
          close={() => setModal(null)}
          add={async (m) => {
            await persistWorkspaceRecord("member", m);
            setMembers((v) => [m, ...v]);
            setModal(null);
            notify("Pending membership invitation created");
          }}
        />
      )}
      {modal === "create-event" && (
        <EventEditor
          close={() => setModal(null)}
          save={async (e) => {
            await persistWorkspaceRecord("event", e);
            setEvents((v) => [e, ...v]);
            setModal(null);
            notify("Event created");
          }}
        />
      )}
      {modal === "create-organization" && (
        <OrganizationWizard
          close={() => setModal(null)}
          created={(org) => {
            setOrganizations((v) => [...v, org]);
            setCurrentOrganizationId(org.id);
            setModal(null);
            setAdminTab("organizations");
            notify(`${org.name} workspace created`);
          }}
        />
      )}
      {selectedMember && (
        <MemberProfile
          member={selectedMember}
          goals={goals}
          activities={activities}
          admin={role === "admin"}
          close={() => setSelectedMember(null)}
          requestIntro={(m) => {
            void persistAction({
              id: `intro-${m.id}`,
              kind: "introduction_requested",
              memberId: m.id,
              eventId: null,
              note: "",
              due: "",
              done: true,
            });
            setIntroductions((v) => (v.includes(m.id) ? v : [...v, m.id]));
            setIntroductionStatuses((rows) => ({ ...rows, [m.id]: "Requested" }));
            recordActivity("introduction_requested", m.id);
            setSelectedMember(null);
            notify("Introduction request sent");
          }}
          save={async (m) => {
            await persistWorkspaceRecord("member", m);
            setMembers((v) => v.map((x) => (x.id === m.id ? m : x)));
            setSelectedMember(m);
            notify("Member profile updated");
          }}
        />
      )}
      {planEvent && (
        <NetworkingPlan
          event={planEvent}
          members={members}
          goals={goals}
          currentMemberId={currentMember?.id}
          attendeeCount={registeredCount(registrations, planEvent.id)}
          brand={brand}
          close={() => setPlanEvent(null)}
          notify={notify}
          persistAction={persistAction}
        />
      )}
      {manageEvent && (
        <ManageEvent
          event={manageEvent}
          members={members}
          brand={brand}
          registrations={registrations}
          updateRegistration={updateRegistration}
          notify={notify}
          prepareAttendeeMessage={() => {
            setCampaignAudience(`Event:${manageEvent.id}`);
            setAdminTab("communications");
            setManageEvent(null);
            notify("Attendee audience selected — review recipients before sending");
          }}
          close={() => setManageEvent(null)}
          save={async (e) => {
            await persistWorkspaceRecord("event", e);
            setEvents((v) => v.map((x) => (x.id === e.id ? e : x)));
            setManageEvent(e);
            notify("Event updated");
          }}
        />
      )}
      {attendeeEvent && (
        <AttendeeList
          event={attendeeEvent}
          members={members}
          registrations={registrations}
          currentMemberId={currentMember?.id}
          close={() => setAttendeeEvent(null)}
          open={(member) => {
            setAttendeeEvent(null);
            setSelectedMember(member);
          }}
        />
      )}
      {eventMode && (
        <EventMode
          event={eventMode}
          members={members}
          goals={goals}
          metIds={metIds}
          setMetIds={setMetIds}
          persistAction={persistAction}
          recordActivity={recordActivity}
          addFollowUp={(f) => {
            void persistAction({
              ...f,
              kind: "follow_up",
              eventId: eventMode.id,
            });
            setFollowUps((v) => [f, ...v]);
          }}
          close={() => setEventMode(null)}
          notify={notify}
        />
      )}
      {onboarding && (
        <Onboarding
          goals={goals}
          close={() => setOnboarding(false)}
          save={(updatedGoals) => {
            void persistWorkspaceRecord("goals", updatedGoals);
            setGoals(updatedGoals);
            setOnboarding(false);
            notify("Networking goals saved — matches updated");
          }}
        />
      )}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}

function Welcome({ brand, open }: { brand: BrandSettings; open: () => void }) {
  return (
    <main className="welcome-shell">
      <header className="welcome-nav">
        <Brand brand={brand} />
        <button className="text-button" onClick={open}>
          Member sign in
        </button>
      </header>
      <section className="welcome-hero">
        <div className="hero-orbit">
          <span>JR</span>
          <span>RC</span>
          <span>MG</span>
          <i />
        </div>
        <div className="welcome-copy">
          <span className="kicker">
            TAMPA&apos;S RELATIONSHIP-DRIVEN BUSINESS COMMUNITY
          </span>
          <h1>
            Make the room
            <br />
            <em>work for you.</em>
          </h1>
          <p>
            {brand.name} helps members meet the right people, build real
            relationships, and turn every event into meaningful next steps.
          </p>
          <button className="primary jumbo" onClick={open}>
            Enter the member app <span>→</span>
          </button>
          <div className="trust-row">
            <span>✓ Curated members</span>
            <span>✓ Smarter events</span>
            <span>✓ Real introductions</span>
          </div>
        </div>
      </section>
      <section className="how-row">
        <div>
          <b>01</b>
          <span>Tell us who you want to meet</span>
        </div>
        <div>
          <b>02</b>
          <span>Get a plan before every event</span>
        </div>
        <div>
          <b>03</b>
          <span>Follow through after the room</span>
        </div>
      </section>
    </main>
  );
}
function SignIn({
  brand,
  canAdmin,
  close,
  enter,
}: {
  brand: BrandSettings;
  canAdmin: boolean;
  close: () => void;
  enter: (r: Role) => void;
}) {
  const [mode, setMode] = useState<"member" | "admin">("member");
  return (
    <Modal close={close}>
      <Brand brand={brand} />
      <div className="role-switch">
        <button
          className={mode === "member" ? "active" : ""}
          onClick={() => setMode("member")}
        >
          Member
        </button>
        <button
          className={mode === "admin" ? "active" : ""}
          onClick={() => setMode("admin")}
          disabled={!canAdmin}
          title={!canAdmin ? "Administrator invitation required" : undefined}
        >
          Club admin
        </button>
      </div>
      <h2>{mode === "member" ? "Welcome back" : "Manage your club"}</h2>
      <p>
        {mode === "member"
          ? "Your next valuable connection is waiting."
          : "Members, events, branding, and engagement in one place."}
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (mode === "admin" && !canAdmin) return;
          enter(mode);
        }}
      >
        <label>
          Email address
          <input
            type="email"
            defaultValue={
              mode === "member"
                ? "manuel@example.com"
                : "admin@tampabusinessclub.com"
            }
          />
        </label>
        <label>
          Password
          <input type="password" defaultValue="networkos" />
        </label>
        <button
          className="primary wide"
          disabled={mode === "admin" && !canAdmin}
        >
          Continue as {mode}
        </button>
      </form>
      <small>
        {mode === "admin"
          ? "Administrator access is limited to approved organization owners."
          : "Private pilot access — member identity will be connected before launch."}
      </small>
    </Modal>
  );
}

type Common = {
  brand: BrandSettings;
  members: MemberRecord[];
  events: ClubEvent[];
  setMembers: React.Dispatch<React.SetStateAction<MemberRecord[]>>;
  setEvents: React.Dispatch<React.SetStateAction<ClubEvent[]>>;
  notify: (s: string) => void;
  setSelectedMember: (m: MemberRecord | null) => void;
  setPlanEvent: (e: ClubEvent | null) => void;
  setManageEvent: (e: ClubEvent | null) => void;
  setAttendeeEvent: (e: ClubEvent | null) => void;
  setModal: (
    m: null | "my-profile" | "invite" | "create-event" | "create-organization",
  ) => void;
  setEventMode: (e: ClubEvent | null) => void;
  setOnboarding: (v: boolean) => void;
  rsvps: string[];
  setRsvps: React.Dispatch<React.SetStateAction<string[]>>;
  registrations: EventRegistration[];
  setRegistrations: React.Dispatch<React.SetStateAction<EventRegistration[]>>;
  updateRegistration: (
    eventId: string,
    action: "rsvp" | "cancel" | "promote" | "toggle_checkin",
    memberId?: string,
  ) => Promise<EventRegistration>;
  metIds: string[];
  setMetIds: React.Dispatch<React.SetStateAction<string[]>>;
  followUps: FollowUp[];
  setFollowUps: React.Dispatch<React.SetStateAction<FollowUp[]>>;
  introductions: string[];
  setIntroductions: React.Dispatch<React.SetStateAction<string[]>>;
  introductionStatuses: Record<string, IntroductionStatus>;
  setIntroductionStatuses: React.Dispatch<
    React.SetStateAction<Record<string, IntroductionStatus>>
  >;
  activities: Activity[];
  recordActivity: (
    kind: string,
    memberId?: string | null,
    eventId?: string | null,
  ) => void;
  setAdminTab: (tab: AdminTab) => void;
  campaignAudience: string;
  setCampaignAudience: (audience: string) => void;
  organizations: Organization[];
  currentOrganizationId: string;
  setCurrentOrganizationId: (id: string) => void;
  persistWorkspaceRecord: (
    type: "member" | "event" | "action" | "goals" | "settings",
    record:
      | MemberRecord
      | ClubEvent
      | MemberAction
      | NetworkingGoals
      | OrganizationSettings,
  ) => Promise<void>;
  persistAction: (action: MemberAction) => Promise<void>;
  goals: NetworkingGoals | null;
  setGoals: React.Dispatch<React.SetStateAction<NetworkingGoals | null>>;
  currentMember: MemberRecord | null;
  organizationSettings: OrganizationSettings;
  setOrganizationSettings: React.Dispatch<
    React.SetStateAction<OrganizationSettings>
  >;
};
function MemberApp(
  p: Common & {
    tab: MemberTab;
    setTab: (t: MemberTab) => void;
    signOut: () => void;
  },
) {
  return (
    <div className="app-shell">
      <header className="mobile-header">
        <Brand brand={p.brand} />
        <button className="avatar-button" onClick={() => p.setTab("profile")}>
          {p.currentMember?.initials || "ME"}
        </button>
      </header>
      <aside className="desktop-sidebar">
        <Brand brand={p.brand} />
        <nav>
          {[
            ["home", "Home"],
            ["events", "Events"],
            ["network", "Members"],
            ["connections", "Connections"],
            ["profile", "My profile"],
          ].map(([id, label]) => (
            <button
              key={id}
              className={p.tab === id ? "active" : ""}
              onClick={() => p.setTab(id as MemberTab)}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="side-user">
          <span className="avatar">{p.currentMember?.initials || "ME"}</span>
          <div>
            <strong>{p.currentMember?.name || "Member"}</strong>
            <small>{p.currentMember?.plan || "Professional"} member</small>
          </div>
        </div>
      </aside>
      <main className="member-main">
        {p.tab === "home" && <MemberHome {...p} />}{" "}
        {p.tab === "events" && <Events {...p} />}{" "}
        {p.tab === "network" && (
          <Network members={p.members} open={p.setSelectedMember} />
        )}{" "}
        {p.tab === "connections" && <Connections {...p} />}{" "}
        {p.tab === "profile" && (
          <Profile
            goals={p.goals}
            member={p.currentMember}
            edit={() => p.setModal("my-profile")}
            onboarding={() => p.setOnboarding(true)}
            signOut={p.signOut}
          />
        )}
      </main>
      <nav className="bottom-nav">
        {[
          ["home", "⌂", "Home"],
          ["events", "◫", "Events"],
          ["network", "◎", "Members"],
          ["connections", "✓", "Follow-ups"],
          ["profile", "○", "Profile"],
        ].map(([id, icon, label]) => (
          <button
            key={id}
            className={p.tab === id ? "active" : ""}
            onClick={() => p.setTab(id as MemberTab)}
          >
            <b>{icon}</b>
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
function MemberHome(p: Common & { setTab: (t: MemberTab) => void }) {
  const top = p.members
    .filter((member) => member.id !== p.currentMember?.id)
    .map((member) => ({ ...member, ...smartMatch(member, p.goals) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  const event = p.events[0];
  return (
    <div className="page member-home">
      <header className="page-heading">
        <div>
          <span className="kicker">YOUR CLUB TODAY</span>
          <h1>
            Good morning, {p.currentMember?.name.split(" ")[0] || "member"}.
          </h1>
          <p>Here&apos;s how to move your network forward today.</p>
        </div>
        <span className="member-pill">PRO MEMBER</span>
      </header>
      <section className="next-action">
        <span className="light-kicker">YOUR NEXT BEST ACTION</span>
        <h2>Prepare for {event.title}</h2>
        <p>
          {registeredCount(p.registrations, event.id)} members are attending. We found {strongMatchCount(p.members, p.goals, p.currentMember?.id)} people
          aligned with your current goals.
        </p>
        <div className="event-meta">
          <span>
            {event.month} {event.day}
          </span>
          <span>{event.time}</span>
          <span>{event.place}</span>
        </div>
        <div className="hero-actions">
          <button
            className="cream-button"
            onClick={() => p.setPlanEvent(event)}
          >
            View my networking plan <span>→</span>
          </button>
          <button
            className="event-mode-button"
            onClick={() => p.setEventMode(event)}
          >
            Open Event Mode
          </button>
        </div>
      </section>
      <div className="section-title">
        <div>
          <span className="kicker">RECOMMENDED FOR YOU</span>
          <h2>People worth meeting</h2>
        </div>
        <button className="text-button" onClick={() => p.setTab("network")}>
          View all
        </button>
      </div>
      <div className="people-scroll">
        {top.map((person) => (
          <article className="person-card" key={person.id}>
            <div className="person-top">
              <span className="avatar lg">{person.initials}</span>
              <span className="match-score">{person.score}% match</span>
            </div>
            <h3>{person.name}</h3>
            <span>
              {person.title} · {person.company}
            </span>
            <p>{person.reasons[0]}. {person.reasons[1]}.</p>
            <button
              className="secondary wide"
              onClick={() => p.setSelectedMember(person)}
            >
              View member profile
            </button>
          </article>
        ))}
      </div>
      <section className="quick-grid">
        <button onClick={() => p.setTab("connections")}>
          <b>{p.introductions.length}</b>
          <span>Introduction requests</span>
          <i>→</i>
        </button>
        <button onClick={() => p.setTab("connections")}>
          <b>{p.followUps.filter((f) => !f.done).length}</b>
          <span>Follow-ups due</span>
          <i>→</i>
        </button>
      </section>
    </div>
  );
}
function Events(p: Common) {
  return (
    <div className="page">
      <header className="page-heading">
        <div>
          <span className="kicker">{p.brand.name.toUpperCase()}</span>
          <h1>Events</h1>
          <p>Register, see who&apos;s going, and arrive with a plan.</p>
        </div>
      </header>
      <div className="event-list">
        {p.events.map((e, index) => (
          <article className="event-card" key={e.id}>
            <div className="date-tile">
              <b>{e.day}</b>
              <span>{e.month}</span>
            </div>
            <div className="event-info">
              <span className="kicker">
                {p.rsvps.includes(e.id)
                  ? "YOU'RE REGISTERED"
                  : index === 0
                    ? "YOUR NEXT EVENT"
                    : e.status.toUpperCase()}
              </span>
              <h2>{e.title}</h2>
              <p>
                {e.time}–{e.endTime} · {e.place}
              </p>
              <div>
                <span>{registeredCount(p.registrations, e.id)} attending</span>
                <span>{strongMatchCount(p.members, p.goals, p.currentMember?.id)} strong matches</span>
              </div>
            </div>
            <div className="event-card-actions">
              <button
                className="secondary"
                onClick={() => shareEvent(e, p.brand, p.notify)}
              >
                ↗ Share
              </button>
              <button
                className="secondary"
                disabled={!p.organizationSettings.showEventAttendees}
                onClick={() => p.setAttendeeEvent(e)}
              >
                {p.organizationSettings.showEventAttendees
                  ? "View attendees"
                  : "Attendees private"}
              </button>
              <button
                className="secondary"
                onClick={async () => {
                  const attending = !p.rsvps.includes(e.id);
                  try {
                    const row = await p.updateRegistration(e.id, attending ? "rsvp" : "cancel");
                    p.recordActivity(attending ? "rsvp_created" : "rsvp_cancelled", row.memberId, e.id);
                    p.notify(attending ? row.status === "Waitlisted" ? "Event is full — you joined the waitlist" : "You're registered" : "RSVP cancelled");
                  } catch (error) {
                    p.notify(error instanceof Error ? error.message : "Unable to update RSVP");
                  }
                }}
              >
                {p.rsvps.includes(e.id) ? p.registrations.some((row) => row.eventId === e.id && row.memberId === p.currentMember?.id && row.status === "Waitlisted") ? "Leave waitlist" : "Cancel RSVP" : "RSVP"}
              </button>
              <button className="primary" onClick={() => p.setEventMode(e)}>
                Event Mode
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
function Network({
  members,
  open,
}: {
  members: MemberRecord[];
  open: (m: MemberRecord) => void;
}) {
  const [q, setQ] = useState("");
  const results = useMemo(
    () =>
      members.filter((m) =>
        Object.values(m).join(" ").toLowerCase().includes(q.toLowerCase()),
      ),
    [q, members],
  );
  return (
    <div className="page">
      <header className="page-heading">
        <div>
          <span className="kicker">YOUR COMMUNITY</span>
          <h1>Member network</h1>
          <p>Find expertise, opportunities, and people you can help.</p>
        </div>
      </header>
      <div className="search-box">
        <span>⌕</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, company, industry, or expertise"
        />
      </div>
      <div className="member-list">
        {results.map((m) => (
          <button
            className="member-list-button"
            key={m.id}
            onClick={() => open(m)}
          >
            <span className="avatar lg">{m.initials}</span>
            <div>
              <h3>{m.name}</h3>
              <p>
                {m.title} · {m.company}
              </p>
              <span>{m.industry}</span>
            </div>
            <b>View →</b>
          </button>
        ))}
      </div>
    </div>
  );
}
function Connections(p: Common) {
  return (
    <div className="page">
      <header className="page-heading">
        <div>
          <span className="kicker">KEEP MOMENTUM</span>
          <h1>Connections</h1>
          <p>Your private follow-ups and introduction requests in one place.</p>
        </div>
      </header>
      <div className="privacy-note">
        <b>Private by design</b>
        <span>
          No audio, recording, transcription, or microphone access. Only notes
          you type are saved.
        </span>
      </div>
      <div className="connection-grid">
        <section className="panel">
          <div className="section-title">
            <div>
              <span className="kicker">FOLLOW-UPS</span>
              <h2>Next actions</h2>
            </div>
            <span className="member-pill">
              {p.followUps.filter((f) => !f.done).length} DUE
            </span>
          </div>
          {p.followUps.length === 0 ? (
            <p>No follow-ups yet. Use Event Mode after meeting someone.</p>
          ) : (
            p.followUps.map((f) => {
              const m = p.members.find((x) => x.id === f.memberId);
              return (
                <article
                  className={`follow-row ${f.done ? "done" : ""}`}
                  key={f.id}
                >
                  <span className="avatar">{m?.initials || "?"}</span>
                  <div>
                    <strong>{m?.name || "Member"}</strong>
                    <p>{f.note}</p>
                    <small>{f.due}</small>
                  </div>
                  <button
                    className="secondary"
                    onClick={() => {
                      const done = !f.done;
                      void p.persistAction({
                        id: f.id,
                        kind: "follow_up",
                        memberId: f.memberId,
                        eventId: null,
                        note: f.note,
                        due: f.due,
                        done,
                      });
                      if (!f.done)
                        p.recordActivity("follow_up_completed", f.memberId);
                      p.setFollowUps((v) =>
                        v.map((x) =>
                          x.id === f.id ? { ...x, done: !x.done } : x,
                        ),
                      );
                    }}
                  >
                    {f.done ? "Reopen" : "Done"}
                  </button>
                </article>
              );
            })
          )}
        </section>
        <section className="panel">
          <div className="section-title">
            <div>
              <span className="kicker">INTRODUCTIONS</span>
              <h2>Requests</h2>
            </div>
          </div>
          {Object.keys(p.introductionStatuses).length === 0 ? (
            <p>Request an introduction from any member profile.</p>
          ) : (
            Object.entries(p.introductionStatuses).map(([id, status]) => {
              const m = p.members.find((x) => x.id === id);
              const next =
                status === "Requested"
                  ? "Accepted"
                  : status === "Accepted"
                    ? "Introduced"
                    : null;
              return (
                <article className="follow-row intro-journey" key={id}>
                  <span className="avatar">{m?.initials}</span>
                  <div>
                    <strong>{m?.name}</strong>
                    <p>{status}</p>
                    <small>
                      {status === "Requested"
                        ? "Awaiting response"
                        : status === "Accepted"
                          ? "Ready to connect"
                          : status === "Introduced"
                            ? "How did it turn out?"
                            : "Outcome saved"}
                    </small>
                  </div>
                  {next && (
                    <button
                      className="status"
                      onClick={() => {
                        const kind = next === "Accepted" ? "introduction_accepted" : "introduction_completed";
                        void p.persistAction({
                          id: `${kind}-${id}`,
                          kind,
                          memberId: id,
                          eventId: null,
                          note: "",
                          due: "",
                          done: true,
                        });
                        p.setIntroductionStatuses((rows) => ({ ...rows, [id]: next }));
                        p.recordActivity(kind, id);
                      }}
                    >
                      {next === "Accepted" ? "Accept" : "Mark introduced"}
                    </button>
                  )}
                  {status === "Introduced" && (
                    <select
                      aria-label={`Outcome for ${m?.name || "introduction"}`}
                      defaultValue=""
                      onChange={(event) => {
                        const outcome = event.target.value as IntroductionStatus;
                      void p.persistAction({
                        id: `introduction-outcome-${id}`,
                        kind: "introduction_outcome",
                        memberId: id,
                        eventId: null,
                        note: outcome,
                        due: "",
                        done: true,
                      });
                        p.setIntroductionStatuses((rows) => ({ ...rows, [id]: outcome }));
                        p.recordActivity("introduction_outcome", id);
                        p.notify("Introduction outcome saved");
                      }}
                    >
                      <option value="" disabled>Choose outcome</option>
                      <option>Helpful connection</option>
                      <option>Business opportunity</option>
                      <option>Not a fit</option>
                    </select>
                  )}
                </article>
              );
            })
          )}
        </section>
      </div>
    </div>
  );
}

function AttendeeList({
  event,
  members,
  registrations,
  currentMemberId,
  close,
  open,
}: {
  event: ClubEvent;
  members: MemberRecord[];
  registrations: EventRegistration[];
  currentMemberId?: string;
  close: () => void;
  open: (member: MemberRecord) => void;
}) {
  const attendees = registrations
    .filter((row) => row.eventId === event.id && row.status !== "Cancelled")
    .map((row) => ({ row, member: members.find((member) => member.id === row.memberId) }))
    .filter((item): item is { row: EventRegistration; member: MemberRecord } => Boolean(item.member));
  return (
    <Modal close={close} wide>
      <span className="kicker">EVENT ATTENDEES</span>
      <h2>{event.title}</h2>
      <p>{attendees.length} member{attendees.length === 1 ? "" : "s"} registered or waitlisted.</p>
      {attendees.length === 0 ? (
        <div className="empty-state">No members are registered yet.</div>
      ) : (
        <div className="registration-list">
          {attendees.map(({ row, member }) => (
            <button key={row.id} onClick={() => open(member)}>
              <span className="avatar">{member.initials}</span>
              <div>
                <strong>{member.name}{member.id === currentMemberId ? " (You)" : ""}</strong>
                <small>{member.company} · {member.title}</small>
              </div>
              <span className={row.status === "Registered" ? "status" : "status muted"}>
                {row.status}
              </span>
            </button>
          ))}
        </div>
      )}
      <div className="form-actions">
        <button className="secondary" onClick={close}>Close</button>
      </div>
    </Modal>
  );
}

function PublicEvent({
  event,
  brand,
  members,
  registered,
  back,
  signIn,
  rsvp,
  notify,
}: {
  event: ClubEvent;
  brand: BrandSettings;
  members: MemberRecord[];
  registered: boolean;
  back: () => void;
  signIn: () => void;
  rsvp: () => void;
  notify: (s: string) => void;
}) {
  return (
    <main className="public-event">
      <header>
        <Brand brand={brand} />
        <button className="text-button" onClick={signIn}>
          Member sign in
        </button>
      </header>
      <section className="public-event-hero">
        <button className="back-link" onClick={back}>
          ← All events
        </button>
        <span className="kicker">
          {event.month} {event.day}, {event.year}
        </span>
        <h1>{event.title}</h1>
        <p>{event.description}</p>
        <div className="public-meta">
          <span>
            <b>
              {event.time}–{event.endTime}
            </b>
            Event time
          </span>
          <span>
            <b>{event.place}</b>
            {event.address}
          </span>
          <span>
            <b>{event.going} attending</b>
            {event.capacity - event.going} places remain
          </span>
        </div>
        <div className="public-actions">
          <button className="primary jumbo" onClick={rsvp}>
            {registered ? "You’re registered ✓" : "Reserve my place"}
          </button>
          <button
            className="secondary"
            onClick={() => addToCalendar(event, notify)}
          >
            + Add to calendar
          </button>
          <button
            className="secondary"
            onClick={() => shareEvent(event, brand, notify)}
          >
            ↗ Share
          </button>
        </div>
      </section>
      <section className="public-attendees">
        <div>
          <span className="kicker">WHO YOU&apos;LL MEET</span>
          <h2>Tampa leaders building real relationships.</h2>
          <p>
            Members can see the complete attendee list and receive personalized
            recommendations.
          </p>
          <button className="text-button" onClick={signIn}>
            Sign in to see your matches →
          </button>
        </div>
        <div className="attendee-stack">
          {members.slice(0, 5).map((m) => (
            <span className="avatar lg" key={m.id}>
              {m.initials}
            </span>
          ))}
        </div>
      </section>
    </main>
  );
}

function EventMode({
  event,
  members,
  goals,
  currentMemberId,
  metIds,
  setMetIds,
  persistAction,
  recordActivity,
  addFollowUp,
  close,
  notify,
}: {
  event: ClubEvent;
  members: MemberRecord[];
  goals: NetworkingGoals | null;
  currentMemberId?: string;
  metIds: string[];
  setMetIds: React.Dispatch<React.SetStateAction<string[]>>;
  persistAction: (action: MemberAction) => Promise<void>;
  recordActivity: (
    kind: string,
    memberId?: string | null,
    eventId?: string | null,
  ) => void;
  addFollowUp: (f: FollowUp) => void;
  close: () => void;
  notify: (s: string) => void;
}) {
  const [q, setQ] = useState("");
  const [noteFor, setNoteFor] = useState<MemberRecord | null>(null);
  const [note, setNote] = useState("");
  const matches = members
    .filter((member) => member.id !== currentMemberId)
    .filter((m) =>
      Object.values(m).join(" ").toLowerCase().includes(q.toLowerCase()),
    )
    .map((member) => ({ ...member, match: smartMatch(member, goals) }))
    .sort((a, b) => b.match.score - a.match.score)
    .slice(0, 6);
  return (
    <Modal close={close} wide>
      <span className="kicker">LIVE EVENT MODE</span>
      <h2>{event.title}</h2>
      <p className="privacy-line">
        Private and manual: the app never records or listens to conversations.
      </p>
      <div className="search-box">
        <span>⌕</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Find an attendee"
        />
      </div>
      <div className="event-mode-list">
        {matches.map((m) => (
          <article key={m.id}>
            <span className="avatar lg">{m.initials}</span>
            <div>
              <strong>{m.name}</strong>
              <small>
                {m.title} · {m.company}
              </small>
              <p>{m.match.reasons[0]} · {m.match.score}% match</p>
            </div>
            <button
              className={
                metIds.includes(m.id) ? "met-button active" : "met-button"
              }
              onClick={() => {
                const met = !metIds.includes(m.id);
                void persistAction({
                  id: `met-${event.id}-${m.id}`,
                  kind: "met",
                  memberId: m.id,
                  eventId: event.id,
                  note: "",
                  due: "",
                  done: met,
                });
                if (met) recordActivity("met", m.id, event.id);
                setMetIds((v) =>
                  v.includes(m.id) ? v.filter((x) => x !== m.id) : [...v, m.id],
                );
                setNoteFor(m);
                setNote(followUpSuggestion(m, event));
              }}
            >
              {metIds.includes(m.id) ? "Met ✓" : "We met"}
            </button>
          </article>
        ))}
      </div>
      {noteFor && (
        <section className="private-note">
          <b>Optional private follow-up for {noteFor.name}</b>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="A suggested follow-up will appear here for you to review"
          />
          <div>
            <button className="text-button" onClick={() => setNoteFor(null)}>
              Skip note
            </button>
            <button
              className="primary"
              onClick={() => {
                addFollowUp({
                  id: `fu-${Date.now()}`,
                  memberId: noteFor.id,
                  note: note || "Follow up after the event",
                  due: "Next week",
                  done: false,
                });
                recordActivity("follow_up_created", noteFor.id, event.id);
                setNoteFor(null);
                setNote("");
                notify("Private follow-up added");
              }}
            >
              Save reviewed follow-up
            </button>
          </div>
        </section>
      )}
    </Modal>
  );
}

function Onboarding({
  goals,
  close,
  save,
}: {
  goals: NetworkingGoals | null;
  close: () => void;
  save: (goals: NetworkingGoals) => void;
}) {
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<NetworkingGoals>(
    goals || {
      idealClients: "Established Tampa business owners preparing to grow",
      referralPartners: "Commercial real estate, banking, legal",
      currentGoal: "Build five strategic partnerships",
      expertise: "Business strategy, growth planning, relationship development",
      introductions: "Tampa business owners, advisors, community leaders",
      geography: "Tampa Bay",
      industries: "Professional services, real estate",
      visibility: "members",
    },
  );
  const field = (key: keyof NetworkingGoals, value: string) =>
    setDraft((current) => ({ ...current, [key]: value }));
  return (
    <Modal close={close} wide>
      <span className="kicker">NETWORKING GOALS · {step} OF 3</span>
      <h2>
        {step === 1
          ? "Who do you want to meet?"
          : step === 2
            ? "What can you offer?"
            : "Set your preferences"}
      </h2>
      <div className="onboarding-progress">
        <i style={{ width: `${(step / 3) * 100}%` }} />
      </div>
      {step === 1 && (
        <div className="fields-grid">
          <label className="full">
            Ideal clients
            <textarea
              rows={3}
              value={draft.idealClients}
              onChange={(e) => field("idealClients", e.target.value)}
            />
          </label>
          <label>
            Referral partners
            <input
              value={draft.referralPartners}
              onChange={(e) => field("referralPartners", e.target.value)}
            />
          </label>
          <label>
            Current goal
            <input
              value={draft.currentGoal}
              onChange={(e) => field("currentGoal", e.target.value)}
            />
          </label>
        </div>
      )}
      {step === 2 && (
        <div className="fields-grid">
          <label className="full">
            Services and expertise
            <textarea
              rows={3}
              value={draft.expertise}
              onChange={(e) => field("expertise", e.target.value)}
            />
          </label>
          <label className="full">
            Introductions you can make
            <textarea
              rows={3}
              value={draft.introductions}
              onChange={(e) => field("introductions", e.target.value)}
            />
          </label>
        </div>
      )}
      {step === 3 && (
        <div className="fields-grid">
          <label>
            Geographic reach
            <input
              value={draft.geography}
              onChange={(e) => field("geography", e.target.value)}
            />
          </label>
          <label>
            Preferred industries
            <input
              value={draft.industries}
              onChange={(e) => field("industries", e.target.value)}
            />
          </label>
          <label className="full">
            Profile visibility
            <select
              value={draft.visibility}
              onChange={(e) => field("visibility", e.target.value)}
            >
              <option value="members">Club members only</option>
              <option value="events">Members attending my events</option>
            </select>
          </label>
        </div>
      )}
      <div className="privacy-note">
        <b>You control your information</b>
        <span>
          Contact visibility can be changed anytime. Private notes are never
          shared.
        </span>
      </div>
      <div className="form-actions">
        <button
          className="text-button"
          onClick={step === 1 ? close : () => setStep(step - 1)}
        >
          {step === 1 ? "Save for later" : "Back"}
        </button>
        <button
          className="primary"
          onClick={step === 3 ? () => save(draft) : () => setStep(step + 1)}
        >
          {step === 3 ? "Save goals" : "Continue"}
        </button>
      </div>
    </Modal>
  );
}
function Profile({
  goals,
  member,
  edit,
  onboarding,
  signOut,
}: {
  goals: NetworkingGoals | null;
  member: MemberRecord | null;
  edit: () => void;
  onboarding: () => void;
  signOut: () => void;
}) {
  return (
    <div className="page">
      <header className="profile-hero">
        <span className="avatar xl">{member?.initials || "ME"}</span>
        <div>
          <span className="kicker">
            {(member?.plan || "Professional").toUpperCase()} MEMBER
          </span>
          <h1>{member?.name || "Your member profile"}</h1>
          <p>
            {[member?.title, member?.company].filter(Boolean).join(" · ") ||
              "Complete your title and business information"}
          </p>
        </div>
        <button className="secondary" onClick={edit}>
          Edit contact profile
        </button>
      </header>
      <section className="profile-score">
        <div className="ring">{member?.completion || 30}%</div>
        <div>
          <h3>Your networking profile</h3>
          <p>Tell us who you need to meet so recommendations get smarter.</p>
        </div>
        <button className="cream-button compact" onClick={onboarding}>
          Complete goals
        </button>
      </section>
      <div className="profile-columns">
        <section className="panel">
          <span className="kicker">CONTACT</span>
          <h3>{member?.email || "Email unavailable"}</h3>
          <p>{member?.phone || "Add a phone number"}</p>
        </section>
        <section className="panel">
          <span className="kicker">I&apos;M LOOKING FOR</span>
          <div className="tags">
            {(goals
              ? [goals.idealClients, goals.referralPartners, goals.currentGoal]
              : [
                  "Business owners",
                  "Strategic partners",
                  "Commercial real estate",
                ]
            ).map((value) => (
              <span key={value}>{value}</span>
            ))}
          </div>
        </section>
        <section className="panel">
          <span className="kicker">I CAN HELP WITH</span>
          <div className="tags">
            {(goals
              ? [goals.expertise, goals.introductions]
              : ["Business strategy", "Introductions", "Growth planning"]
            ).map((value) => (
              <span key={value}>{value}</span>
            ))}
          </div>
        </section>
        <section className="panel">
          <span className="kicker">PRIVACY</span>
          <p>
            Your meeting notes are private. This app never records audio or uses
            your microphone.
          </p>
        </section>
      </div>
      <button className="signout" onClick={signOut}>
        Sign out of pilot
      </button>
    </div>
  );
}

function NetworkingPlan({
  event,
  members,
  goals,
  currentMemberId,
  attendeeCount,
  brand,
  close,
  notify,
  persistAction,
}: {
  event: ClubEvent;
  members: MemberRecord[];
  goals: NetworkingGoals | null;
  currentMemberId?: string;
  attendeeCount: number;
  brand: BrandSettings;
  close: () => void;
  notify: (s: string) => void;
  persistAction: (action: MemberAction) => Promise<void>;
}) {
  const recs = members
    .filter((member) => member.id !== currentMemberId)
    .map((member) => ({ m: member, r: smartMatch(member, goals) }))
    .sort((a, b) => b.r.score - a.r.score)
    .slice(0, event.id === "after-hours" ? 4 : 3);
  return (
    <Modal close={close} wide>
      <span className="kicker">YOUR NETWORKING PLAN</span>
      <h2>{event.title}</h2>
      <p>
        {event.month} {event.day} · {event.time} · {event.place}
      </p>
      <div className="plan-summary">
        <div>
          <b>{strongMatchCount(members, goals, currentMemberId)}</b>
          <span>strong matches</span>
        </div>
        <div>
          <b>{attendeeCount}</b>
          <span>attending</span>
        </div>
        <button
          className="secondary"
          onClick={() => shareEvent(event, brand, notify)}
        >
          ↗ Share event
        </button>
        <button
          className="secondary"
          onClick={() => addToCalendar(event, notify)}
        >
          + Add to calendar
        </button>
      </div>
      <h3>Priority people to meet</h3>
      <div className="plan-list">
        {recs.map(({ r, m }, i) => (
          <article key={m.id}>
            <span className="plan-rank">{i + 1}</span>
            <span className="avatar">{m.initials}</span>
            <div>
              <strong>{m.name}</strong>
              <small>{m.company}</small>
              <p>{r.reasons[0]}. {r.reasons[1]}.</p>
            </div>
            <span className="match-score">{r.score}%</span>
          </article>
        ))}
      </div>
      <div className="form-actions">
        <button className="text-button" onClick={close}>
          Close
        </button>
        <button
          className="primary"
          onClick={async () => {
            await persistAction({
              id: `plan-${event.id}`,
              kind: "networking_plan_saved",
              memberId: null,
              eventId: event.id,
              note: "",
              due: "",
              done: true,
            });
            notify("Networking plan saved");
            close();
          }}
        >
          Save my plan
        </button>
      </div>
    </Modal>
  );
}
function MemberProfile({
  member,
  goals,
  activities,
  admin,
  close,
  save,
  requestIntro,
}: {
  member: MemberRecord;
  goals: NetworkingGoals | null;
  activities: Activity[];
  admin: boolean;
  close: () => void;
  save: (m: MemberRecord) => void;
  requestIntro: (m: MemberRecord) => void;
}) {
  const [edit, setEdit] = useState(false);
  const [draft, setDraft] = useState(member);
  const match = smartMatch(member, goals);
  const relationship = relationshipStrength(member.id, activities);
  return (
    <Modal close={close} wide>
      <header className="profile-modal-head">
        <span className="avatar xl">{member.initials}</span>
        <div>
          <span className="kicker">{member.plan.toUpperCase()} MEMBER</span>
          <h2>{member.name}</h2>
          <p>
            {member.title} · {member.company}
          </p>
        </div>
        {admin && (
          <button className="secondary" onClick={() => setEdit(!edit)}>
            {edit ? "Cancel edit" : "Edit member"}
          </button>
        )}
      </header>
      {edit ? (
        <MemberFields value={draft} setValue={setDraft} />
      ) : (
        <div className="member-detail-grid">
          <section>
            <span className="kicker">CONTACT</span>
            <h3>{member.email}</h3>
            <p>{member.phone}</p>
          </section>
          <section>
            <span className="kicker">BUSINESS</span>
            <h3>{member.company}</h3>
            <p>{member.industry}</p>
          </section>
          <section>
            <span className="kicker">LOOKING FOR</span>
            <p>{member.lookingFor}</p>
          </section>
          <section>
            <span className="kicker">CAN HELP WITH</span>
            <p>{member.canHelp}</p>
          </section>
          <section>
            <span className="kicker">ABOUT</span>
            <p>{member.bio}</p>
          </section>
          <section>
            <span className="kicker">INTERESTS</span>
            <p>{member.interests}</p>
          </section>
        </div>
      )}
      {!edit && (
        <div className="smart-profile-grid">
          <section className="smart-card">
            <span className="kicker">SMART MATCH</span>
            <strong>{match.score}%</strong>
            <p>{match.reasons[0]}.</p>
            <ul>
              {match.reasons.slice(1).map((reason) => <li key={reason}>{reason}</li>)}
            </ul>
          </section>
          <section className="smart-card">
            <span className="kicker">RELATIONSHIP</span>
            <strong>{relationship.label}</strong>
            <p>{relationship.score}/100 · {relationship.actions} saved actions</p>
            <small>Calculated only from actions you choose to record—not conversations, messages, or audio.</small>
          </section>
        </div>
      )}
      <div className="form-actions">
        <button className="text-button" onClick={close}>
          Close
        </button>
        {edit ? (
          <button
            className="primary"
            onClick={() => {
              save(draft);
              setEdit(false);
            }}
          >
            Save member
          </button>
        ) : (
          <button className="primary" onClick={() => requestIntro(member)}>
            Request introduction
          </button>
        )}
      </div>
    </Modal>
  );
}

function MyProfileEditor({
  member,
  close,
  save,
}: {
  member: MemberRecord | null;
  close: () => void;
  save: (member: MemberRecord) => void;
}) {
  const base: MemberRecord = member || {
    id: "unavailable",
    name: "",
    initials: "ME",
    email: "",
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
    emailOptOut: false,
  };
  const [draft, setDraft] = useState(base);
  return (
    <Modal close={close} wide>
      <span className="kicker">MY MEMBER PROFILE</span>
      <h2>Keep your information current.</h2>
      <p>
        Your contact details and answers power member discovery and
        recommendations.
      </p>
      <MemberFields value={draft} setValue={setDraft} />
      <div className="form-actions">
        <button className="text-button" onClick={close}>
          Save later
        </button>
        <button
          className="primary"
          disabled={!member}
          onClick={() =>
            save({
              ...draft,
              initials: draft.name
                .split(/\s+/)
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase(),
              completion: Math.round(
                ([
                  draft.name,
                  draft.email,
                  draft.phone,
                  draft.title,
                  draft.company,
                  draft.industry,
                  draft.bio,
                  draft.lookingFor,
                  draft.canHelp,
                  draft.interests,
                ].filter(Boolean).length /
                  10) *
                  100,
              ),
            })
          }
        >
          Save profile
        </button>
      </div>
    </Modal>
  );
}
function MemberFields({
  value,
  setValue,
}: {
  value: MemberRecord;
  setValue: (m: MemberRecord) => void;
}) {
  const field = (key: keyof MemberRecord, val: string | number | boolean) =>
    setValue({ ...value, [key]: val });
  return (
    <div className="fields-grid">
      <label>
        Full name
        <input
          value={value.name}
          onChange={(e) => field("name", e.target.value)}
        />
      </label>
      <label>
        Email address
        <input
          type="email"
          value={value.email}
          onChange={(e) => field("email", e.target.value)}
        />
      </label>
      <label>
        Phone number
        <input
          value={value.phone}
          onChange={(e) => field("phone", e.target.value)}
        />
      </label>
      <label>
        Business name
        <input
          value={value.company}
          onChange={(e) => field("company", e.target.value)}
        />
      </label>
      <label>
        Title
        <input
          value={value.title}
          onChange={(e) => field("title", e.target.value)}
        />
      </label>
      <label>
        Industry
        <input
          value={value.industry}
          onChange={(e) => field("industry", e.target.value)}
        />
      </label>
      <label className="full checkbox-row">
        <input
          type="checkbox"
          checked={!value.emailOptOut}
          onChange={(e) => field("emailOptOut", !e.target.checked)}
        />
        Receive Tampa Business Club announcements and event emails
      </label>
      <label className="full">
        About
        <textarea
          rows={3}
          value={value.bio}
          onChange={(e) => field("bio", e.target.value)}
        />
      </label>
      <label className="full">
        Who do you want to meet?
        <textarea
          rows={3}
          value={value.lookingFor}
          onChange={(e) => field("lookingFor", e.target.value)}
        />
      </label>
      <label className="full">
        How can you help other members?
        <textarea
          rows={3}
          value={value.canHelp}
          onChange={(e) => field("canHelp", e.target.value)}
        />
      </label>
      <label className="full">
        Personal interests
        <input
          value={value.interests}
          onChange={(e) => field("interests", e.target.value)}
        />
      </label>
    </div>
  );
}

function AdminApp(
  p: Common & {
    tab: AdminTab;
    setTab: (t: AdminTab) => void;
    setBrand: (b: BrandSettings) => void;
    signOut: () => void;
  },
) {
  const tabs: [[AdminTab, string], ...[AdminTab, string][]] = [
    ["overview", "Overview"],
    ["organizations", "Organizations"],
    ["analytics", "Analytics"],
    ["membership", "Membership"],
    ["members", "Members"],
    ["events", "Events"],
    ["communications", "Communications"],
    ["settings", "Organization"],
  ];
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Brand brand={p.brand} />
        <span className="admin-badge">ADMIN CONSOLE</span>
        <label className="org-switcher">
          Workspace
          <select
            value={p.currentOrganizationId}
            onChange={(e) => p.setCurrentOrganizationId(e.target.value)}
          >
            {p.organizations.map((o) => (
              <option value={o.id} key={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </label>
        <nav>
          {tabs.map(([id, label]) => (
            <button
              key={id}
              className={p.tab === id ? "active" : ""}
              onClick={() => p.setTab(id)}
            >
              {label}
            </button>
          ))}
        </nav>
        <button className="signout" onClick={p.signOut}>
          Sign out
        </button>
      </aside>
      <header className="admin-mobile">
        <Brand brand={p.brand} />
        <select
          value={p.tab}
          onChange={(e) => p.setTab(e.target.value as AdminTab)}
        >
          {tabs.map(([id, label]) => (
            <option value={id} key={id}>
              {label}
            </option>
          ))}
        </select>
      </header>
      <main className="admin-main">
        {p.tab === "overview" && <AdminOverview {...p} />}{" "}
        {p.tab === "organizations" && <AdminOrganizations {...p} />}{" "}
        {p.tab === "analytics" && <AdminAnalytics {...p} />}{" "}
        {p.tab === "membership" && <AdminMembership {...p} />}{" "}
        {p.tab === "members" && <AdminMembers {...p} />}{" "}
        {p.tab === "events" && <AdminEvents {...p} />}{" "}
        {p.tab === "communications" && <AdminCommunications {...p} />}{" "}
        {p.tab === "settings" && <AdminSettings {...p} setBrand={p.setBrand} />}
      </main>
    </div>
  );
}
function AdminOrganizations(p: Common) {
  return (
    <div className="admin-page">
      <header className="page-heading">
        <div>
          <span className="kicker">WHITE-LABEL PLATFORM</span>
          <h1>Organizations</h1>
          <p>Create and manage isolated networking-group workspaces.</p>
        </div>
        <button
          className="primary"
          onClick={() => p.setModal("create-organization")}
        >
          Add organization
        </button>
      </header>
      <div className="tenant-summary">
        <Stat
          value={String(p.organizations.length)}
          label="Organizations"
          note="Separate workspaces"
        />
        <Stat
          value={String(
            p.organizations.filter((o) => o.status === "Active").length,
          )}
          label="Active"
          note="Live customers"
        />
        <Stat
          value={String(
            p.organizations.filter((o) => o.status === "Trial").length,
          )}
          label="Trials"
          note="Onboarding"
        />
      </div>
      <div className="organization-list">
        {p.organizations.map((org) => (
          <article
            className={
              org.id === p.currentOrganizationId
                ? "panel org-card selected"
                : "panel org-card"
            }
            key={org.id}
          >
            <div
              className="org-mark"
              style={{
                background: org.primaryColor,
                color: "white",
                borderColor: org.accentColor,
              }}
            >
              {org.shortName}
            </div>
            <div>
              <span className="kicker">{org.status.toUpperCase()}</span>
              <h2>{org.name}</h2>
              <p>{org.slug}.networkos.app</p>
            </div>
            <span className="role-chip">Owner</span>
            <button
              className="secondary"
              onClick={() => p.setCurrentOrganizationId(org.id)}
            >
              {org.id === p.currentOrganizationId
                ? "Current workspace"
                : "Open workspace"}
            </button>
          </article>
        ))}
      </div>
      <section className="panel isolation-panel">
        <div>
          <span className="kicker">DATA SEPARATION</span>
          <h2>Every organization stays independent.</h2>
          <p>
            Activity records, analytics, branding, administrators, members, and
            events are scoped to the selected organization.
          </p>
        </div>
        <div className="isolation-checks">
          <span>✓ Organization-scoped database records</span>
          <span>✓ Server-side administrator access checks</span>
          <span>✓ Independent brand and workspace</span>
        </div>
      </section>
      <AdminAccess organizationId={p.currentOrganizationId} notify={p.notify} />
    </div>
  );
}

function AdminAccess({
  organizationId,
  notify,
}: {
  organizationId: string;
  notify: (message: string) => void;
}) {
  type AdminRow = {
    id: string;
    userId: string;
    email: string;
    role: string;
  };
  type InviteRow = { id: string; email: string; role: string; status: string };
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Admin");
  const [error, setError] = useState("");
  const owner =
    admins.find((admin) => admin.userId === currentUserId)?.role === "Owner";
  const load = () =>
    fetch(
      `/api/administrators?organization_id=${encodeURIComponent(organizationId)}`,
    )
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data) => {
        setAdmins(data.admins || []);
        setInvites(data.invitations || []);
        setCurrentUserId(data.currentUserId || "");
      })
      .catch(() => setError("Unable to load administrator access."));
  useEffect(() => {
    void load();
  }, [organizationId]);
  async function update(
    adminId: string,
    action: "role" | "revoke",
    nextRole?: string,
  ) {
    setError("");
    const response = await fetch("/api/administrators", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ organizationId, adminId, action, role: nextRole }),
    });
    const data = await response.json();
    if (!response.ok) return setError(data.error || "Unable to update access.");
    notify(
      action === "revoke"
        ? "Administrator access revoked"
        : "Administrator role updated",
    );
    load();
  }
  return (
    <section className="panel admin-access-panel">
      <div className="section-title">
        <div>
          <span className="kicker">ADMINISTRATOR ACCESS</span>
          <h2>Owners and administrators</h2>
          <p>Only owners can invite, change roles, or revoke access.</p>
        </div>
      </div>
      <div className="admin-access-list">
        {admins.map((admin) => (
          <article className="admin-access-row" key={admin.id}>
            <div>
              <strong>{admin.email}</strong>
              <small>
                {admin.userId === currentUserId
                  ? "You"
                  : "Active administrator"}
              </small>
            </div>
            {owner ? (
              <select
                value={admin.role}
                onChange={(event) =>
                  update(admin.id, "role", event.target.value)
                }
              >
                <option>Owner</option>
                <option>Admin</option>
              </select>
            ) : (
              <span className="role-chip">{admin.role}</span>
            )}
            {owner && (
              <button
                className="text-button danger-text"
                onClick={() => update(admin.id, "revoke")}
              >
                Revoke
              </button>
            )}
          </article>
        ))}
      </div>
      {owner && (
        <form
          className="admin-invite-form"
          onSubmit={async (event) => {
            event.preventDefault();
            setError("");
            const response = await fetch("/api/administrators", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ organizationId, email, role }),
            });
            const data = await response.json();
            if (!response.ok)
              return setError(data.error || "Unable to create invitation.");
            setEmail("");
            notify("Administrator invitation created");
            load();
          }}
        >
          <label>
            Administrator email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            Role
            <select
              value={role}
              onChange={(event) => setRole(event.target.value)}
            >
              <option>Admin</option>
              <option>Owner</option>
            </select>
          </label>
          <button className="primary">Create invitation</button>
        </form>
      )}
      {invites.filter((invite) => invite.status === "Pending").length > 0 && (
        <div className="pending-admin-invites">
          <strong>Pending invitations</strong>
          {invites
            .filter((invite) => invite.status === "Pending")
            .map((invite) => (
              <span key={invite.id}>
                {invite.email} · {invite.role}
              </span>
            ))}
        </div>
      )}
      {error && <p className="form-error">{error}</p>}
    </section>
  );
}

function AdminOverview(p: Common & { setTab: (t: AdminTab) => void }) {
  const e = p.events[0];
  if (!e)
    return (
      <div className="admin-page empty-workspace">
        <span className="kicker">NEW ORGANIZATION</span>
        <h1>{p.brand.name} is ready.</h1>
        <p>
          This workspace is isolated from Tampa Business Club. Invite the first
          members or create the organization&apos;s first event.
        </p>
        <div>
          <button className="primary" onClick={() => p.setModal("invite")}>
            Invite members
          </button>
          <button
            className="secondary"
            onClick={() => p.setModal("create-event")}
          >
            Create event
          </button>
        </div>
      </div>
    );
  return (
    <div className="admin-page">
      <header className="page-heading">
        <div>
          <span className="kicker">ORGANIZATION OVERVIEW</span>
          <h1>Good morning, club team.</h1>
          <p>Here&apos;s what&apos;s happening across {p.brand.name}.</p>
        </div>
        <button className="primary" onClick={() => p.setModal("create-event")}>
          Create event
        </button>
      </header>
      <div className="stats-grid">
        <Stat
          value={String(p.members.filter((m) => m.status === "Active").length)}
          label="Active members"
          note={`${p.members.filter((m) => m.status !== "Active").length} pending`}
        />
        <Stat
          value={`${p.members.length ? Math.round(p.members.reduce((sum, m) => sum + m.completion, 0) / p.members.length) : 0}%`}
          label="Profile completion"
          note={`${p.members.filter((m) => m.completion < 100).length} need attention`}
        />
        <Stat
          value={String(p.registrations.filter((row) => row.status === "Registered").length)}
          label="Event registrations"
          note="Upcoming events"
        />
        <Stat
          value={String(
            p.activities.filter((a) => a.kind === "introduction_requested")
              .length,
          )}
          label="Introductions"
          note="Recorded requests"
        />
      </div>
      <div className="admin-columns">
        <section className="panel">
          <div className="section-title">
            <div>
              <span className="kicker">NEXT EVENT</span>
              <h2>{e.title}</h2>
            </div>
            <span className="status">{e.status.toUpperCase()}</span>
          </div>
          <div className="admin-event-progress">
            <b>{registeredCount(p.registrations, e.id)}</b>
            <span>members registered</span>
            <div>
              <i style={{ width: `${(registeredCount(p.registrations, e.id) / e.capacity) * 100}%` }} />
            </div>
            <small>
              {e.capacity} capacity · {e.month} {e.day} at {e.time}
            </small>
          </div>
          <button
            className="secondary wide"
            onClick={() => p.setManageEvent(e)}
          >
            Manage event
          </button>
        </section>
        <section className="panel">
          <div className="section-title">
            <div>
              <span className="kicker">MEMBER HEALTH</span>
              <h2>Needs attention</h2>
            </div>
          </div>
          {p.members
            .filter((m) => m.completion < 100)
            .slice(0, 2)
            .map((m) => (
              <button
                className="attention-row button-reset"
                key={m.id}
                onClick={() => p.setSelectedMember(m)}
              >
                <span className="avatar">{m.initials}</span>
                <div>
                  <strong>{m.name}</strong>
                  <small>Profile {m.completion}% complete</small>
                </div>
                <b>View</b>
              </button>
            ))}
        </section>
      </div>
    </div>
  );
}
function Stat({
  value,
  label,
  note,
}: {
  value: string;
  label: string;
  note: string;
}) {
  return (
    <article className="stat-card">
      <strong>{value}</strong>
      <span>{label}</span>
      <small>{note}</small>
    </article>
  );
}
function AdminAnalytics(p: Common) {
  const [period, setPeriod] = useState("90 days");
  const days = period === "30 days" ? 30 : period === "12 months" ? 365 : 90;
  const recent = p.activities.filter(
    (a) => a.createdAt >= Date.now() - days * 86400000,
  );
  const count = (kind: string) => recent.filter((a) => a.kind === kind).length;
  const registrations = p.registrations.filter((row) => row.status === "Registered").length;
  const registrationCheckIns = p.registrations.filter((row) => row.checkedIn).length;
  const recordedCheckIns = Math.max(registrationCheckIns, count("check_in"));
  const met = count("met");
  const followCreated = count("follow_up_created");
  const followCompleted = count("follow_up_completed");
  const introRequested = count("introduction_requested");
  const introAccepted = count("introduction_accepted");
  const activeMemberIds = new Set(
    recent.map((a) => a.memberId).filter(Boolean),
  );
  const activeMembers = p.members.filter((m) => m.status === "Active");
  const engagedActiveIds = new Set(
    activeMembers
      .map((member) => member.id)
      .filter((memberId) => activeMemberIds.has(memberId)),
  );
  const engagement = activeMembers.length
    ? Math.round((engagedActiveIds.size / activeMembers.length) * 100)
    : 0;
  const retention = p.members.length
    ? Math.round((activeMembers.length / p.members.length) * 100)
    : 0;
  const metrics = [
    {
      value: `${engagement}%`,
      label: "Member engagement",
      note: `${engagedActiveIds.size} of ${activeMembers.length} active members took action`,
    },
    {
      value: String(recordedCheckIns),
      label: "Recorded check-ins",
      note: registrations
        ? `${Math.round((registrationCheckIns / registrations) * 100)}% verified attendance rate`
        : "Historical activity; no matching registrations",
    },
    {
      value: String(introRequested),
      label: "Introduction requests",
      note: `${introAccepted} accepted`,
    },
    {
      value: `${followCreated ? Math.round((followCompleted / followCreated) * 100) : 0}%`,
      label: "Follow-ups completed",
      note: `${followCompleted} of ${followCreated} completed`,
    },
    {
      value: `${retention}%`,
      label: "Active-member rate",
      note: `${activeMembers.length} active of ${p.members.length}`,
    },
  ];
  const monthKeys = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    return `${date.getFullYear()}-${date.getMonth()}`;
  });
  const bars = monthKeys.map((key) => {
    const actions = recent.filter((a) => {
      const date = new Date(a.createdAt);
      return `${date.getFullYear()}-${date.getMonth()}` === key;
    }).length;
    return Math.min(100, Math.max(actions ? 12 : 2, actions * 12));
  });
  const inactiveMembers = p.members
    .filter((m) => !activeMemberIds.has(m.id) || m.completion < 100)
    .slice(0, 4);
  return (
    <div className="admin-page analytics-page">
      <header className="page-heading">
        <div>
          <span className="kicker">CLUB IMPACT</span>
          <h1>Analytics</h1>
          <p>
            Measure participation, introductions, follow-through, and
            retention—not private conversations.
          </p>
        </div>
        <div className="analytics-actions">
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option>30 days</option>
            <option>90 days</option>
            <option>12 months</option>
          </select>
          <button
            className="secondary"
            onClick={() =>
              downloadCsv(
                "tbc-impact-report.csv",
                metrics.map((m) => [
                  m.label,
                  m.value,
                  m.note,
                  "Action data only",
                ]),
                ["Metric", "Value", "Detail", "Privacy"],
              )
            }
          >
            Download report
          </button>
        </div>
      </header>
      <div className="analytics-stats">
        {metrics.map((m) => (
          <Stat key={m.label} {...m} />
        ))}
      </div>
      <div className="analytics-grid">
        <section className="panel trend-panel">
          <div className="section-title">
            <div>
              <span className="kicker">ENGAGEMENT TREND</span>
              <h2>Members taking meaningful action</h2>
            </div>
            <span className="status">{recent.length} actions</span>
          </div>
          <div
            className="bar-chart"
            aria-label="Six month member engagement chart"
          >
            {bars.map((v, i) => (
              <div key={i}>
                <i style={{ height: `${v}%` }} />
                <span>{["Mar", "Apr", "May", "Jun", "Jul", "Aug"][i]}</span>
              </div>
            ))}
          </div>
          <div className="chart-legend">
            <span>
              <i />
              Attended an event
            </span>
            <span>
              <i />
              Completed a follow-up
            </span>
          </div>
        </section>
        <section className="panel funnel-panel">
          <span className="kicker">RELATIONSHIP FUNNEL</span>
          <h2>From RSVP to follow-through</h2>
          {[
            ["Event registrations", registrations, 100],
            [
              "Attended",
              recordedCheckIns,
              registrations ? Math.round((registrationCheckIns / registrations) * 100) : 0,
            ],
            [
              "Marked “We met”",
              met,
              recordedCheckIns ? Math.round((met / recordedCheckIns) * 100) : 0,
            ],
            [
              "Follow-up created",
              followCreated,
              met ? Math.round((followCreated / met) * 100) : 0,
            ],
            [
              "Follow-up completed",
              followCompleted,
              followCreated
                ? Math.round((followCompleted / followCreated) * 100)
                : 0,
            ],
          ].map((x) => (
            <div className="funnel-row" key={x[0]}>
              <div>
                <strong>{x[0]}</strong>
                <span>{x[1]}</span>
              </div>
              <i>
                <b style={{ width: `${x[2]}%` }} />
              </i>
            </div>
          ))}
        </section>
        <section className="panel event-performance">
          <div className="section-title">
            <div>
              <span className="kicker">EVENT PERFORMANCE</span>
              <h2>What creates connections</h2>
            </div>
            <button
              className="text-button"
              onClick={() =>
                downloadCsv(
                  "tbc-event-performance.csv",
                  p.events.map((e) => [
                    e.title,
                    registeredCount(p.registrations, e.id),
                    p.registrations.filter((row) => row.eventId === e.id && row.checkedIn).length,
                    p.activities.filter(
                      (a) =>
                        a.kind === "follow_up_created" && a.eventId === e.id,
                    ).length,
                  ]),
                  ["Event", "Registered", "Check-ins", "Follow-ups"],
                )
              }
            >
              Export
            </button>
          </div>
          {p.events.map((e) => {
            const eventRegistrations = registeredCount(p.registrations, e.id);
            const eventCheckIns = p.registrations.filter((row) => row.eventId === e.id && row.checkedIn).length;
            const eventFollowUps = p.activities.filter(
              (a) => a.kind === "follow_up_created" && a.eventId === e.id,
            ).length;
            return (
              <article key={e.id}>
                <div>
                  <strong>{e.title}</strong>
                  <small>
                    {e.month} {e.day} · {eventRegistrations} registered
                  </small>
                </div>
                <span>
                  <b>
                    {eventRegistrations ? Math.round((eventCheckIns / eventRegistrations) * 100) : 0}%
                  </b>{" "}
                  attendance
                </span>
                <span>
                  <b>{eventFollowUps}</b> follow-ups
                </span>
              </article>
            );
          })}
        </section>
        <section className="panel inactive-panel">
          <div className="section-title">
            <div>
              <span className="kicker">MEMBER HEALTH</span>
              <h2>Needs re-engagement</h2>
            </div>
            <span className="member-pill">
              {inactiveMembers.length} MEMBERS
            </span>
          </div>
          <p>
            Based on attendance and app actions—not message or note content.
          </p>
          {inactiveMembers.slice(0, 3).map((m) => (
            <article key={m.id}>
              <span className="avatar">{m.initials}</span>
              <div>
                <strong>{m.name}</strong>
                <small>
                  {m.completion < 100
                    ? `Profile ${m.completion}% complete`
                    : `No activity in the selected ${period}`}
                </small>
              </div>
              <button
                className="text-button"
                onClick={() => p.setSelectedMember(m)}
              >
                Review
              </button>
            </article>
          ))}
          <button
            className="secondary wide"
            onClick={() => {
              p.setCampaignAudience("Needs re-engagement");
              p.setAdminTab("communications");
              p.notify("Re-engagement audience selected");
            }}
          >
            Create re-engagement campaign
          </button>
        </section>
      </div>
      <section className="panel report-center">
        <div>
          <span className="kicker">REPORT CENTER</span>
          <h2>Share the club&apos;s impact</h2>
          <p>
            Download action-based summaries for leadership and event planning.
          </p>
        </div>
        {[
          ["Monthly impact", "Attendance, meetings, follow-ups"],
          ["Membership health", "Retention and engagement"],
          ["Event comparison", "Registration and outcomes"],
        ].map((x, i) => (
          <button
            className="report-card"
            key={x[0]}
            onClick={() =>
              downloadCsv(
                `tbc-${x[0].toLowerCase().replace(/ /g, "-")}.csv`,
                [
                  ["Period", period],
                  ["Members", p.members.length],
                  ["Metric", x[1]],
                  ["Generated", new Date().toLocaleDateString()],
                ],
                ["Field", "Value"],
              )
            }
          >
            <b>{i === 0 ? "↗" : i === 1 ? "◎" : "▥"}</b>
            <span>
              <strong>{x[0]}</strong>
              <small>{x[1]}</small>
            </span>
            <i>Download ↓</i>
          </button>
        ))}
      </section>
    </div>
  );
}
function AdminMembership(p: Common) {
  const [approved, setApproved] = useState<string[]>([]);
  const [editing, setEditing] = useState(false);
  const [prices, setPrices] = useState({
    Individual: p.organizationSettings.individualPrice,
    Professional: p.organizationSettings.professionalPrice,
    Founding: p.organizationSettings.foundingPrice,
  });
  useEffect(() => {
    setPrices({
      Individual: p.organizationSettings.individualPrice,
      Professional: p.organizationSettings.professionalPrice,
      Founding: p.organizationSettings.foundingPrice,
    });
  }, [p.organizationSettings]);
  const applicants = p.members.filter((m) => m.status === "Invited");
  const activeCount = p.members.filter((m) => m.status === "Active").length;
  return (
    <div className="admin-page">
      <header className="page-heading">
        <div>
          <span className="kicker">MEMBERSHIP OPERATIONS</span>
          <h1>Membership</h1>
          <p>Applications, plans, renewals, and account standing.</p>
        </div>
        <button className="primary" onClick={() => p.setModal("invite")}>
          Invite applicant
        </button>
      </header>
      <div className="stats-grid">
        <Stat
          value={String(
            applicants.filter((m) => !approved.includes(m.id)).length,
          )}
          label="Applications"
          note="Need review"
        />
        <Stat value="—" label="Renewals due" note="Billing not connected" />
        <Stat value="—" label="Recurring dues" note="Payments not connected" />
        <Stat
          value={`${p.members.length ? Math.round((activeCount / p.members.length) * 100) : 0}%`}
          label="Good standing"
          note={`${activeCount} active members`}
        />
      </div>
      <div className="admin-columns">
        <section className="panel">
          <div className="section-title">
            <div>
              <span className="kicker">APPLICATIONS</span>
              <h2>Needs review</h2>
            </div>
          </div>
          {applicants.map((m) => (
            <article className="application-row" key={m.id}>
              <span className="avatar">{m.initials}</span>
              <div>
                <strong>{m.name}</strong>
                <small>
                  {m.company} · {m.plan} plan
                </small>
              </div>
              <button
                className="text-button"
                onClick={() => p.setSelectedMember(m)}
              >
                Review
              </button>
              <button
                className="primary mini"
                disabled={approved.includes(m.id)}
                onClick={async () => {
                  const updated = { ...m, status: "Active" };
                  await p.persistWorkspaceRecord("member", updated);
                  p.setMembers((rows) =>
                    rows.map((row) => (row.id === m.id ? updated : row)),
                  );
                  setApproved((v) => [...v, m.id]);
                  p.notify(`${m.name} approved`);
                }}
              >
                {approved.includes(m.id) ? "Approved ✓" : "Approve"}
              </button>
            </article>
          ))}
        </section>
        <section className="panel">
          <div className="section-title">
            <div>
              <span className="kicker">MEMBERSHIP PLANS</span>
              <h2>Current offers</h2>
            </div>
            <button
              className="text-button"
              onClick={() => {
                if (editing) {
                  const settings = {
                    ...p.organizationSettings,
                    individualPrice: prices.Individual,
                    professionalPrice: prices.Professional,
                    foundingPrice: prices.Founding,
                  };
                  p.setOrganizationSettings(settings);
                  void p.persistWorkspaceRecord("settings", settings);
                  p.notify("Membership prices saved");
                }
                setEditing(!editing);
              }}
            >
              {editing ? "Save prices" : "Edit plans"}
            </button>
          </div>
          {(["Individual", "Professional", "Founding"] as const).map((name) => (
            <div className="plan-admin" key={name}>
              <strong>{name}</strong>
              {editing ? (
                <label className="price-input">
                  $
                  <input
                    type="number"
                    value={prices[name]}
                    onChange={(e) =>
                      setPrices({ ...prices, [name]: Number(e.target.value) })
                    }
                  />
                  /mo
                </label>
              ) : (
                <span>${prices[name]}/mo</span>
              )}
              <small>
                {p.members.filter((m) => m.plan === name).length} members
              </small>
            </div>
          ))}
        </section>
      </div>
      <section className="panel renewal-panel">
        <div>
          <span className="kicker">UPCOMING RENEWALS</span>
          <h2>Renewal tracking requires billing</h2>
          <p>Connect payment and renewal-date data before reminders can be calculated or sent.</p>
        </div>
        <button className="secondary" disabled>Reminders unavailable</button>
        <button className="primary" disabled>Billing not connected</button>
      </section>
    </div>
  );
}

function AdminMembers(p: Common) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [segment, setSegment] = useState("All");
  const rows = p.members.filter(
    (m) =>
      Object.values(m).join(" ").toLowerCase().includes(q.toLowerCase()) &&
      (status === "All" || m.status === status) &&
      (segment === "All" ||
        (segment === "Needs attention" && m.completion < 100) ||
        (segment === "Highly engaged" && m.completion === 100) ||
        (segment === "New members" && m.status === "Invited")),
  );
  return (
    <div className="admin-page">
      <header className="page-heading">
        <div>
          <span className="kicker">MEMBER DIRECTORY</span>
          <h1>Members</h1>
          <p>Search, segment, tag, and manage member profiles.</p>
        </div>
        <button className="primary" onClick={() => p.setModal("invite")}>
          Invite members
        </button>
      </header>
      <div className="table-panel">
        <div className="table-toolbar">
          <div className="search-box">
            <span>⌕</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, email, company, or plan"
            />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option>All</option>
            <option>Active</option>
            <option>Invited</option>
          </select>
          <button
            className="secondary"
            onClick={() =>
              downloadCsv(
                "tbc-members.csv",
                rows.map((m) => [m.name, m.email, m.company, m.plan, m.status]),
              )
            }
          >
            Export
          </button>
        </div>
        <div className="member-tags">
          {["All", "New members", "Needs attention", "Highly engaged"].map(
            (x) => (
              <button
                className={segment === x ? "active" : ""}
                key={x}
                onClick={() => setSegment(x)}
              >
                {x}
              </button>
            ),
          )}
        </div>
        <small className="result-count">{rows.length} members shown</small>
        {rows.map((m) => (
          <button
            className="member-table-row member-row-button"
            key={m.id}
            onClick={() => p.setSelectedMember(m)}
          >
            <div>
              <strong>{m.name}</strong>
              <small>
                {m.email} · {m.company}
              </small>
            </div>
            <span>{m.plan}</span>
            <span className={m.status === "Active" ? "status" : "status muted"}>
              {m.status}
            </span>
            <div className="completion">
              <i style={{ width: `${m.completion}%` }} />
              <small>{m.completion}% profile</small>
            </div>
            <b>Open →</b>
          </button>
        ))}
      </div>
    </div>
  );
}
function AdminEvents(p: Common) {
  return (
    <div className="admin-page">
      <header className="page-heading">
        <div>
          <span className="kicker">PROGRAMMING</span>
          <h1>Events</h1>
          <p>
            Create events, manage registrations, and prepare attendee matches.
          </p>
        </div>
        <button className="primary" onClick={() => p.setModal("create-event")}>
          Create event
        </button>
      </header>
      <div className="admin-event-grid">
        {p.events.map((e) => (
          <article className="panel" key={e.id}>
            <div className="section-title">
              <span className="kicker">
                {e.month} {e.day}, {e.year}
              </span>
              <span
                className={e.status === "Published" ? "status" : "status muted"}
              >
                {e.status}
              </span>
            </div>
            <h2>{e.title}</h2>
            <p>
              {e.time}–{e.endTime} · {e.place}
            </p>
            <div className="event-admin-stats">
              <span>
                <b>{registeredCount(p.registrations, e.id)}</b> registered
              </span>
              <span>
                <b>{strongMatchCount(p.members, p.goals, p.currentMember?.id)}</b> strong matches
              </span>
              <span>
                <b>{Math.max(0, e.capacity - registeredCount(p.registrations, e.id))}</b> spaces
              </span>
            </div>
            <button
              className="secondary wide"
              onClick={() => p.setManageEvent(e)}
            >
              Manage event
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
function AdminCommunications(p: Common) {
  type MessageRow = {
    id: string;
    audience: string;
    channel: string;
    subject: string;
    message: string;
    status: string;
    updatedAt: number;
  };
  const [audience, setAudience] = useState(p.campaignAudience);
  const [subject, setSubject] = useState("Your next Tampa Business Club event");
  const [message, setMessage] = useState(
    "Join us for an evening of curated introductions and meaningful business relationships.",
  );
  const [channel, setChannel] = useState("Email only");
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [draftSaved, setDraftSaved] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [reviewMessageId, setReviewMessageId] = useState<string | null>(null);
  const [sendingCampaign, setSendingCampaign] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [gmailStatus, setGmailStatus] = useState({
    configured: false,
    connected: false,
    senderEmail: "admin@tampabusinessclub.com",
  });
  const automationNames = [
    ["Event reminder", "24 hours before"],
    ["Follow-up prompt", "1 day after event"],
    ["Renewal notice", "30 days before"],
    ["Profile reminder", "Monthly"],
  ];
  const loadMessages = () =>
    fetch(
      `/api/communications?organization_id=${encodeURIComponent(p.currentOrganizationId)}`,
    )
      .then((response) => (response.ok ? response.json() : { messages: [] }))
      .then((data) => setMessages(data.messages || []))
      .catch(() => setMessages([]));
  useEffect(() => {
    void loadMessages();
  }, [p.currentOrganizationId]);
  useEffect(() => {
    void fetch(
      `/api/gmail/status?organization_id=${encodeURIComponent(p.currentOrganizationId)}`,
    )
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data) => setGmailStatus(data))
      .catch(() =>
        setGmailStatus({
          configured: false,
          connected: false,
          senderEmail: "admin@tampabusinessclub.com",
        }),
      );
  }, [p.currentOrganizationId]);
  const recipientMembers = p.members.filter((member) => {
    if (!member.email || member.status !== "Active" || member.emailOptOut) return false;
    if (audience.startsWith("Event:")) {
      const eventId = audience.slice("Event:".length);
      return p.registrations.some(
        (row) =>
          row.eventId === eventId &&
          row.memberId === member.id &&
          row.status === "Registered",
      );
    }
    if (audience === "Incomplete profiles") return member.completion < 100;
    if (audience === "Needs re-engagement") return member.completion < 70;
    if (audience === "Renewals due this month") return false;
    if (audience === "Business After Hours attendees")
      return p.registrations.some(
        (row) =>
          row.eventId === "after-hours" &&
          row.memberId === member.id &&
          row.status === "Registered",
      );
    return true;
  });
  async function saveMessage(status: "Draft" | "Ready for Gmail") {
    const response = await fetch("/api/communications", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: draftId,
        organizationId: p.currentOrganizationId,
        audience,
        channel,
        subject,
        message,
        status,
      }),
    });
    const data = await response.json();
    if (!response.ok) return p.notify(data.error || "Unable to save message");
    setDraftId(status === "Draft" ? data.message.id : null);
    setDraftSaved(status === "Draft");
    if (status === "Ready for Gmail") {
      setReviewMessageId(data.message.id);
      p.notify("Message saved — review recipients before sending");
    } else p.notify("Draft saved");
    loadMessages();
  }
  async function sendTest() {
    setSendingTest(true);
    try {
      const response = await fetch("/api/gmail/send-test", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          organizationId: p.currentOrganizationId,
          subject,
          message,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to send the Gmail test");
      p.notify(`Test email sent to ${data.recipient}`);
    } catch (error) {
      p.notify(error instanceof Error ? error.message : "Unable to send the Gmail test");
    } finally {
      setSendingTest(false);
    }
  }
  async function sendCampaign() {
    if (!reviewMessageId) return;
    setSendingCampaign(true);
    try {
      const response = await fetch("/api/gmail/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          organizationId: p.currentOrganizationId,
          messageId: reviewMessageId,
          confirmed: true,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to send this message");
      p.notify(`${data.sent} sent${data.failed ? ` · ${data.failed} failed` : ""}${data.skipped ? ` · ${data.skipped} already sent` : ""}`);
      setReviewMessageId(null);
      setDraftId(null);
      setSubject("");
      setMessage("");
      void loadMessages();
    } catch (error) {
      p.notify(error instanceof Error ? error.message : "Unable to send this message");
    } finally {
      setSendingCampaign(false);
    }
  }
  return (
    <div className="admin-page">
      <header className="page-heading">
        <div>
          <span className="kicker">MEMBER COMMUNICATIONS</span>
          <h1>Communications</h1>
          <p>Send announcements, event reminders, and membership notices.</p>
        </div>
      </header>
      <div className="gmail-handoff">
        <div>
          <span className="kicker">
            {gmailStatus.connected ? "GMAIL CONNECTED" : "GMAIL SETUP REQUIRED"}
          </span>
          <strong>{gmailStatus.senderEmail}</strong>
          <p>
            {gmailStatus.connected
              ? "Review-first delivery is ready. Messages are sent only after an administrator approves them."
              : gmailStatus.configured
                ? "Google is configured. Connect the sender account to authorize delivery."
                : "NetworkOS can prepare messages, but Google authorization must be completed before this account can send them."}
          </p>
        </div>
        {gmailStatus.connected ? (
          <span className="status">CONNECTED</span>
        ) : gmailStatus.configured ? (
          <button
            className="primary"
            onClick={() => {
              window.location.href = `/api/gmail/connect?organization_id=${encodeURIComponent(p.currentOrganizationId)}`;
            }}
          >
            Connect Gmail
          </button>
        ) : (
          <span className="status muted">NOT CONNECTED</span>
        )}
      </div>
      <div className="communication-layout">
        <section className="panel composer">
          <h2>Create announcement</h2>
          <label>
            Audience
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
            >
              <option>All active members</option>
              <option>Incomplete profiles</option>
              <option>Needs re-engagement</option>
              {p.events.map((event) => (
                <option key={event.id} value={`Event:${event.id}`}>
                  {event.title} attendees
                </option>
              ))}
            </select>
          </label>
          <div className="recipient-preview">
            <span className="kicker">RECIPIENT REVIEW</span>
            <strong>{recipientMembers.length} eligible recipient{recipientMembers.length === 1 ? "" : "s"}</strong>
            {recipientMembers.length ? (
              <p>
                {recipientMembers.slice(0, 4).map((member) => member.email).join(", ")}
                {recipientMembers.length > 4 ? ` +${recipientMembers.length - 4} more` : ""}
              </p>
            ) : (
              <p>No members currently meet this audience rule.</p>
            )}
          </div>
          <label>
            Channel
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
            >
              <option>Email only</option>
            </select>
          </label>
          <label>
            Subject
            <input
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                setDraftSaved(false);
              }}
            />
          </label>
          <label>
            Message
            <textarea
              rows={7}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setDraftSaved(false);
              }}
            />
          </label>
          {draftSaved && (
            <small className="saved-line">Draft saved in this session ✓</small>
          )}
          <div className="form-actions">
            <button
              className="text-button"
              onClick={() => {
                void saveMessage("Draft");
              }}
            >
              Save draft
            </button>
            <button
              className="secondary"
              onClick={() => setPreviewOpen(true)}
            >
              Preview
            </button>
            {gmailStatus.connected && (
              <button
                className="secondary"
                disabled={!subject.trim() || !message.trim() || sendingTest}
                onClick={() => void sendTest()}
              >
                {sendingTest ? "Sending test…" : "Send test to admin"}
              </button>
            )}
            <button
              className="primary"
              disabled={!subject.trim() || !message.trim() || recipientMembers.length === 0}
              onClick={() => void saveMessage("Ready for Gmail")}
            >
              Review recipients
            </button>
          </div>
        </section>
        <aside>
          <section className="panel">
            <span className="kicker">AUTOMATIONS</span>
            <h2>Member reminders</h2>
            <p>Scheduling is not active yet. These options will become available after background delivery is connected.</p>
            {automationNames.map((x) => (
              <button
                className="automation-row automation-button"
                key={x[0]}
                disabled
              >
                <div>
                  <strong>{x[0]}</strong>
                  <small>{x[1]}</small>
                </div>
                <span className="status muted">Setup needed</span>
              </button>
            ))}
          </section>
          <section className="panel recent-sends">
            <span className="kicker">RECENT</span>
            <h2>Message history</h2>
            {messages.length === 0 && <p>No saved messages yet.</p>}
            {messages.map((item) => (
              <button
                className="message-history-row"
                key={item.id}
                onClick={() => {
                  setDraftId(item.id);
                  setAudience(item.audience);
                  setChannel(item.channel);
                  setSubject(item.subject);
                  setMessage(item.message);
                  setDraftSaved(item.status === "Draft");
                }}
              >
                <b>{item.subject}</b>
                <span>
                  {item.audience} · {item.channel}
                </span>
                <small>
                  {item.status} ·{" "}
                  {new Date(item.updatedAt).toLocaleDateString()}
                </small>
              </button>
            ))}
          </section>
        </aside>
      </div>
      {reviewMessageId && (
        <Modal close={() => setReviewMessageId(null)} wide>
          <span className="kicker">FINAL DELIVERY REVIEW</span>
          <h2>Approve this Gmail send?</h2>
          <p>
            NetworkOS will send one private email to each eligible member. Email
            addresses will never be exposed to other recipients.
          </p>
          <section className="recipient-preview">
            <strong>{recipientMembers.length} recipient{recipientMembers.length === 1 ? "" : "s"}</strong>
            <p>{recipientMembers.map((member) => `${member.name} <${member.email}>`).join(", ") || "No eligible recipients"}</p>
          </section>
          <section className="panel">
            <span className="kicker">SUBJECT</span>
            <h3>{subject}</h3>
            <p>{message}</p>
          </section>
          <div className="privacy-note">
            <b>Final approval required</b>
            <span>Members who opted out are excluded. Previously successful deliveries are never sent twice.</span>
          </div>
          <div className="form-actions">
            <button className="text-button" disabled={sendingCampaign} onClick={() => setReviewMessageId(null)}>
              Go back
            </button>
            <button className="primary" disabled={sendingCampaign || recipientMembers.length === 0} onClick={() => void sendCampaign()}>
              {sendingCampaign ? "Sending…" : `Approve and send ${recipientMembers.length}`}
            </button>
          </div>
        </Modal>
      )}
      {previewOpen && (
        <Modal close={() => setPreviewOpen(false)} wide>
          <span className="kicker">EMAIL PREVIEW</span>
          <h2>{subject || "Untitled message"}</h2>
          <p>To: {recipientMembers.length} eligible member{recipientMembers.length === 1 ? "" : "s"}</p>
          <section className="panel">
            <p>{message || "No message content yet."}</p>
          </section>
          <div className="form-actions">
            <button className="primary" onClick={() => setPreviewOpen(false)}>Close preview</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
function AdminSettings({
  brand,
  setBrand,
  notify,
  currentOrganizationId,
  organizations,
  organizationSettings,
  setOrganizationSettings,
  persistWorkspaceRecord,
}: {
  brand: BrandSettings;
  setBrand: (b: BrandSettings) => void;
  notify: (s: string) => void;
  currentOrganizationId: string;
  organizations: Organization[];
  organizationSettings: OrganizationSettings;
  setOrganizationSettings: React.Dispatch<
    React.SetStateAction<OrganizationSettings>
  >;
  persistWorkspaceRecord: Common["persistWorkspaceRecord"];
}) {
  const [draft, setDraft] = useState(brand);
  function file(key: "logo" | "shareImage", f?: File) {
    if (f) setDraft({ ...draft, [key]: URL.createObjectURL(f) });
  }
  return (
    <div className="admin-page">
      <header className="page-heading">
        <div>
          <span className="kicker">WHITE-LABEL SETTINGS</span>
          <h1>Brand experience</h1>
          <p>
            Preview the logo, colors, font, and share image members will see.
          </p>
        </div>
        <button
          className="primary"
          onClick={async () => {
            setBrand(draft);
            const response = await fetch("/api/organizations", {
              method: "PATCH",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                id: currentOrganizationId,
                name: draft.name,
                shortName: draft.shortName,
                primaryColor: draft.primary,
                accentColor: draft.accent,
                font: draft.font,
              }),
            });
            await persistWorkspaceRecord("settings", organizationSettings);
            notify(
              response.ok
                ? "Organization branding and access settings saved"
                : "Unable to save branding",
            );
          }}
        >
          Save branding
        </button>
      </header>
      <div className="settings-grid">
        <section className="panel">
          <h2>Club identity</h2>
          <label>
            Organization name
            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </label>
          <label>
            Short mark
            <input
              maxLength={3}
              value={draft.shortName}
              onChange={(e) =>
                setDraft({ ...draft, shortName: e.target.value.toUpperCase() })
              }
            />
          </label>
          <label>
            Logo image
            <input
              type="file"
              accept="image/*"
              onChange={(e) => file("logo", e.target.files?.[0])}
            />
          </label>
        </section>
        <section className="panel">
          <h2>Brand appearance</h2>
          <div className="brand-preview" style={{ background: draft.primary }}>
            <Brand brand={draft} />
            <small>Member app preview</small>
          </div>
          <label>
            Primary color
            <input
              type="color"
              value={draft.primary}
              onChange={(e) => setDraft({ ...draft, primary: e.target.value })}
            />
          </label>
          <label>
            Accent color
            <input
              type="color"
              value={draft.accent}
              onChange={(e) => setDraft({ ...draft, accent: e.target.value })}
            />
          </label>
          <label>
            Heading and interface font
            <select
              value={draft.font}
              onChange={(e) => setDraft({ ...draft, font: e.target.value })}
            >
              <option>Inter</option>
              <option>Georgia</option>
              <option>Arial</option>
              <option>Trebuchet MS</option>
            </select>
          </label>
        </section>
        <section className="panel span-two">
          <h2>Shareable image</h2>
          <p>This image appears when an event or member app link is shared.</p>
          <div
            className="share-preview"
            style={{ backgroundImage: `url(${draft.shareImage || "/og.png"})` }}
          />
          <label>
            Replace share image
            <input
              type="file"
              accept="image/*"
              onChange={(e) => file("shareImage", e.target.files?.[0])}
            />
          </label>
        </section>
        <section className="panel span-two">
          <h2>Member access</h2>
          <label className="check-row">
            <input
              type="checkbox"
              checked={organizationSettings.requireApprovedMembership}
              onChange={(e) =>
                setOrganizationSettings((settings) => ({
                  ...settings,
                  requireApprovedMembership: e.target.checked,
                }))
              }
            />
            <span>
              <strong>Require approved membership</strong>
              <small>Only active members can access the community.</small>
            </span>
          </label>
          <label className="check-row">
            <input
              type="checkbox"
              checked={organizationSettings.showEventAttendees}
              onChange={(e) =>
                setOrganizationSettings((settings) => ({
                  ...settings,
                  showEventAttendees: e.target.checked,
                }))
              }
            />
            <span>
              <strong>Show event attendee lists</strong>
              <small>Registered members can see who plans to attend.</small>
            </span>
          </label>
          <p className="pilot-note">
            Branding is saved to this organization and remains separate from
            every other workspace.
          </p>
        </section>
      </div>
    </div>
  );
}

function OrganizationWizard({
  close,
  created,
}: {
  close: () => void;
  created: (org: Organization) => void;
}) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [shortName, setShortName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#173f5f");
  const [accentColor, setAccentColor] = useState("#e0a458");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function create() {
    setSaving(true);
    setError("");
    const response = await fetch("/api/organizations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name,
        slug,
        shortName,
        primaryColor,
        accentColor,
      }),
    });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) {
      setError(data.error || "Unable to create organization");
      return;
    }
    created(data.organization);
  }
  return (
    <Modal close={close} wide>
      <span className="kicker">ORGANIZATION SETUP · {step} OF 3</span>
      <h2>
        {step === 1
          ? "Create the workspace"
          : step === 2
            ? "Set the brand"
            : "Confirm ownership"}
      </h2>
      <div className="onboarding-progress">
        <i style={{ width: `${(step / 3) * 100}%` }} />
      </div>
      {step === 1 && (
        <div className="fields-grid">
          <label className="full">
            Organization name
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSlug(
                  e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-|-$/g, ""),
                );
                setShortName(
                  e.target.value
                    .split(" ")
                    .map((x) => x[0])
                    .join("")
                    .slice(0, 3)
                    .toUpperCase(),
                );
              }}
              placeholder="Example: Orlando Executive Network"
            />
          </label>
          <label>
            Workspace URL
            <input
              value={slug}
              onChange={(e) =>
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
              }
            />
          </label>
          <label>
            Short mark
            <input
              maxLength={3}
              value={shortName}
              onChange={(e) => setShortName(e.target.value.toUpperCase())}
            />
          </label>
        </div>
      )}
      {step === 2 && (
        <div className="brand-setup">
          <div className="brand-preview" style={{ background: primaryColor }}>
            <span
              className="org-mark"
              style={{ background: primaryColor, borderColor: accentColor }}
            >
              {shortName || "ORG"}
            </span>
            <strong>{name || "Your organization"}</strong>
          </div>
          <div className="fields-grid">
            <label>
              Primary color
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
              />
            </label>
            <label>
              Accent color
              <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
              />
            </label>
          </div>
        </div>
      )}
      {step === 3 && (
        <div className="owner-confirm">
          <span
            className="org-mark lg"
            style={{ background: primaryColor, borderColor: accentColor }}
          >
            {shortName}
          </span>
          <h3>{name}</h3>
          <p>{slug}.networkos.app</p>
          <div className="privacy-note">
            <b>Your role: Owner</b>
            <span>
              You can manage branding, administrators, members, events,
              communications, and reports for this organization.
            </span>
          </div>
        </div>
      )}
      {error && <p className="form-error">{error}</p>}
      <div className="form-actions">
        <button
          className="text-button"
          onClick={step === 1 ? close : () => setStep(step - 1)}
        >
          {step === 1 ? "Cancel" : "Back"}
        </button>
        <button
          className="primary"
          disabled={saving || !name || !slug}
          onClick={step === 3 ? create : () => setStep(step + 1)}
        >
          {saving
            ? "Creating…"
            : step === 3
              ? "Create organization"
              : "Continue"}
        </button>
      </div>
    </Modal>
  );
}

function InviteMember({
  close,
  add,
}: {
  close: () => void;
  add: (m: MemberRecord) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [plan, setPlan] = useState("Individual");
  return (
    <Modal close={close}>
      <span className="kicker">INVITE MEMBER</span>
      <h2>Add someone to the club.</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          add({
            id: `member-${Date.now()}`,
            name,
            initials: name
              .split(" ")
              .map((x) => x[0])
              .join("")
              .slice(0, 2)
              .toUpperCase(),
            email,
            phone: "",
            title: "",
            company,
            industry: "",
            plan,
            status: "Invited",
            completion: 20,
            bio: "",
            lookingFor: "",
            canHelp: "",
            interests: "",
            emailOptOut: false,
          });
        }}
      >
        <label>
          Full name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <label>
          Email address
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Business name
          <input value={company} onChange={(e) => setCompany(e.target.value)} />
        </label>
        <label>
          Membership plan
          <select value={plan} onChange={(e) => setPlan(e.target.value)}>
            <option>Individual</option>
            <option>Professional</option>
            <option>Founding</option>
          </select>
        </label>
        <button className="primary wide">Create invitation</button>
      </form>
    </Modal>
  );
}
function EventEditor({
  close,
  save,
}: {
  close: () => void;
  save: (e: ClubEvent) => void;
}) {
  const [title, setTitle] = useState("");
  const [place, setPlace] = useState("");
  const [address, setAddress] = useState("");
  const [date, setDate] = useState("2026-10-08");
  const [startTime, setStartTime] = useState("18:00");
  const [capacity, setCapacity] = useState(100);
  const [status, setStatus] = useState<ClubEvent["status"]>("Draft");
  return (
    <Modal close={close} wide>
      <span className="kicker">CREATE EVENT</span>
      <h2>Plan the next member experience.</h2>
      <form
        className="fields-grid"
        onSubmit={(e) => {
          e.preventDefault();
          save({
            id: `event-${Date.now()}`,
            month: new Date(`${date}T12:00:00`)
              .toLocaleString("en-US", {
                month: "short",
              })
              .toUpperCase(),
            day: date.slice(8, 10),
            year: Number(date.slice(0, 4)),
            title,
            place,
            address,
            time: new Date(`2000-01-01T${startTime}`).toLocaleTimeString(
              "en-US",
              { hour: "numeric", minute: "2-digit" },
            ),
            endTime: "8:00 PM",
            going: 0,
            capacity,
            matches: 0,
            status,
            description: "New Tampa Business Club member event.",
          });
        }}
      >
        <label>
          Event name
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </label>
        <label>
          Venue
          <input
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            required
          />
        </label>
        <label className="full">
          Address
          <input value={address} onChange={(e) => setAddress(e.target.value)} />
        </label>
        <label>
          Date
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <label>
          Start time
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </label>
        <label>
          Capacity
          <input
            type="number"
            min="1"
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
          />
        </label>
        <label>
          Status
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ClubEvent["status"])}
          >
            <option>Draft</option>
            <option>Published</option>
          </select>
        </label>
        <div className="form-actions full">
          <button type="button" className="text-button" onClick={close}>
            Cancel
          </button>
          <button className="primary">Create event</button>
        </div>
      </form>
    </Modal>
  );
}
function ManageEvent({
  event,
  members,
  brand,
  registrations,
  updateRegistration,
  notify,
  prepareAttendeeMessage,
  close,
  save,
}: {
  event: ClubEvent;
  members: MemberRecord[];
  brand: BrandSettings;
  registrations: EventRegistration[];
  updateRegistration: Common["updateRegistration"];
  notify: (s: string) => void;
  prepareAttendeeMessage: () => void;
  close: () => void;
  save: (e: ClubEvent) => void;
}) {
  const [draft, setDraft] = useState(event);
  const eventRows = registrations.filter((row) => row.eventId === event.id);
  const registeredMembers = eventRows
    .filter((row) => row.status === "Registered")
    .map((row) => members.find((member) => member.id === row.memberId))
    .filter(Boolean) as MemberRecord[];
  const waitlist = eventRows
    .filter((row) => row.status === "Waitlisted")
    .sort((a, b) => a.registeredAt - b.registeredAt)
    .map((row) => members.find((member) => member.id === row.memberId))
    .filter(Boolean) as MemberRecord[];
  const checkedIn = eventRows.filter((row) => row.checkedIn).map((row) => row.memberId);
  const [operation, setOperation] = useState<null | "waitlist">(null);
  return (
    <Modal close={close} wide>
      <header className="manage-head">
        <div>
          <span className="kicker">MANAGE EVENT</span>
          <h2>{event.title}</h2>
          <p>
            {event.month} {event.day} · {event.place}
          </p>
        </div>
        <span
          className={draft.status === "Published" ? "status" : "status muted"}
        >
          {draft.status}
        </span>
      </header>
      <div className="manage-stats">
        <Stat
          value={String(registeredMembers.length)}
          label="Registered"
          note={`${Math.max(0, event.capacity - registeredMembers.length)} spaces left`}
        />
        <Stat
          value={String(waitlist.length)}
          label="Waitlisted"
          note="Auto-promote enabled"
        />
        <Stat
          value={String(checkedIn.length)}
          label="Checked in"
          note="Event-day count"
        />
      </div>
      <div className="event-ops">
        <button
          onClick={prepareAttendeeMessage}
        >
          <b>✉</b>
          <span>Message attendees</span>
        </button>
        <button
          onClick={() => {
            downloadCsv(
              `${event.id}-guests.csv`,
              [...registeredMembers, ...waitlist].map((m) => [
                m.name,
                m.email,
                m.company,
                checkedIn.includes(m.id) ? "Checked in" : waitlist.some((row) => row.id === m.id) ? "Waitlisted" : "Registered",
              ]),
            );
            notify("Guest list downloaded");
          }}
        >
          <b>↓</b>
          <span>Export guest list</span>
        </button>
        <button disabled title="Recurring event creation is not available yet">
          <b>↻</b>
          <span>Recurring · Coming soon</span>
        </button>
        <button
          onClick={() =>
            setOperation(operation === "waitlist" ? null : "waitlist")
          }
        >
          <b>{waitlist.length}</b>
          <span>Manage waitlist</span>
        </button>
      </div>
      {operation === "waitlist" && (
        <section className="operation-panel">
          <b>Waitlist order</b>
          {waitlist.map((m, i) => (
            <div className="waitlist-row" key={m.id}>
              <span>{i + 1}</span>
              <strong>{m.name}</strong>
              <button
                className="text-button"
                onClick={async () => {
                  try {
                    await updateRegistration(event.id, "promote", m.id);
                    notify(`${m.name} moved to registered`);
                  } catch (error) {
                    notify(error instanceof Error ? error.message : "Unable to promote member");
                  }
                }}
              >
                Promote
              </button>
            </div>
          ))}
        </section>
      )}
      <div className="fields-grid">
        <label>
          Event name
          <input
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
        </label>
        <label>
          Venue
          <input
            value={draft.place}
            onChange={(e) => setDraft({ ...draft, place: e.target.value })}
          />
        </label>
        <label className="full">
          Address
          <input
            value={draft.address}
            onChange={(e) => setDraft({ ...draft, address: e.target.value })}
          />
        </label>
        <label>
          Capacity
          <input
            type="number"
            value={draft.capacity}
            onChange={(e) =>
              setDraft({ ...draft, capacity: Number(e.target.value) })
            }
          />
        </label>
        <label>
          Status
          <select
            value={draft.status}
            onChange={(e) =>
              setDraft({
                ...draft,
                status: e.target.value as ClubEvent["status"],
              })
            }
          >
            <option>Published</option>
            <option>Draft</option>
          </select>
        </label>
      </div>
      <div className="section-title">
        <div>
          <span className="kicker">EVENT DAY</span>
          <h3>Attendee check-in</h3>
        </div>
        <span className="member-pill">{checkedIn.length} CHECKED IN</span>
      </div>
      <div className="registration-list">
        {registeredMembers.map((m) => (
          <button
            key={m.id}
            onClick={async () => {
              try {
                const row = await updateRegistration(event.id, "toggle_checkin", m.id);
                notify(row.checkedIn ? `${m.name} checked in` : `${m.name} check-in removed`);
              } catch (error) {
                notify(error instanceof Error ? error.message : "Unable to update check-in");
              }
            }}
          >
            <span className="avatar">{m.initials}</span>
            <div>
              <strong>{m.name}</strong>
              <small>{m.company}</small>
            </div>
            <span
              className={checkedIn.includes(m.id) ? "status" : "status muted"}
            >
              {checkedIn.includes(m.id) ? "Checked in ✓" : "Check in"}
            </span>
          </button>
        ))}
      </div>
      <div className="form-actions">
        <button
          className="text-button"
          onClick={() => shareEvent(draft, brand, notify)}
        >
          ↗ Share event
        </button>
        <button className="text-button" onClick={close}>
          Close
        </button>
        <button className="primary" onClick={() => save(draft)}>
          Save event
        </button>
      </div>
    </Modal>
  );
}

function Modal({
  children,
  close,
  wide = false,
}: {
  children: React.ReactNode;
  close: () => void;
  wide?: boolean;
}) {
  return (
    <div className="modal-backdrop">
      <section
        className={`signin-card ${wide ? "modal-wide" : ""}`}
        role="dialog"
        aria-modal="true"
      >
        <button className="close" onClick={close} aria-label="Close">
          ×
        </button>
        {children}
      </section>
    </div>
  );
}
function Brand({ brand }: { brand: BrandSettings }) {
  return (
    <div className="brand">
      {brand.logo ? (
        <img className="brand-logo" src={brand.logo} alt="" />
      ) : (
        <span
          className="brand-mark"
          style={{
            background: brand.primary,
            color: "white",
            borderColor: brand.accent,
          }}
        >
          {brand.shortName}
        </span>
      )}
      <div>
        <strong>{brand.name.replace(/ Club$/i, "")}</strong>
        <small style={{ color: brand.accent }}>CLUB</small>
      </div>
    </div>
  );
}
function addToCalendar(e: ClubEvent, notify: (s: string) => void) {
  const months: Record<string, string> = { AUG: "08", SEP: "09", OCT: "10" };
  const start = `${e.year}${months[e.month]}${e.day}T180000`;
  const end = `${e.year}${months[e.month]}${e.day}T200000`;
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//NetworkOS//Tampa Business Club//EN",
    "BEGIN:VEVENT",
    `UID:${e.id}@tampabusinessclub.com`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${e.title}`,
    `LOCATION:${e.place}, ${e.address}`,
    `DESCRIPTION:${e.description}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  a.download = `${e.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.ics`;
  a.click();
  URL.revokeObjectURL(a.href);
  notify("Calendar file downloaded");
}
async function shareEvent(
  e: ClubEvent,
  brand: BrandSettings,
  notify: (s: string) => void,
) {
  const url = `${window.location.origin}/?event=${encodeURIComponent(e.id)}`;
  const data = {
    title: `${e.title} | ${brand.name}`,
    text: `Join us for ${e.title} on ${e.month} ${e.day} at ${e.time}, ${e.place}.`,
    url,
  };
  try {
    if (navigator.share) {
      await navigator.share(data);
      notify("Event shared");
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(`${data.text} ${url}`);
      notify("Event link copied");
    } else {
      const input = document.createElement("textarea");
      input.value = `${data.text} ${url}`;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
      notify("Event link copied");
    }
  } catch (error) {
    if ((error as Error).name !== "AbortError")
      notify("Unable to share this event");
  }
}
function downloadCsv(
  name: string,
  rows: (string | number)[][],
  headers = ["Name", "Email", "Company", "Plan / Status"],
) {
  const csv = [headers, ...rows]
    .map((row) =>
      row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","),
    )
    .join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}
