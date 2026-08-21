"use client";

import { useMemo, useState } from "react";
import { eventRecommendations, events, people, Person, Recommendation } from "../lib/demo";

type View = "home" | "network" | "person" | "events" | "plan" | "eventmode" | "recap" | "connections" | "insights" | "ask";

type Intro = { id: string; a: string; b: string; reason: string; status: "Promised" | "Sent" | "Connected" };

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export default function Page() {
  const [view, setView] = useState<View>("home");
  const [selectedPerson, setSelectedPerson] = useState<Person>(people[0]);
  const [met, setMet] = useState<string[]>(["robert"]);
  const [saved, setSaved] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [askQuery, setAskQuery] = useState("");
  const [voiceText, setVoiceText] = useState("");
  const [captureOpen, setCaptureOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [introductions, setIntroductions] = useState<Intro[]>([
    { id: "i1", a: "Jessica Rodriguez", b: "David Thompson", reason: "Commercial financing", status: "Promised" },
    { id: "i2", a: "Michael Grant", b: "Sarah Williams", reason: "Commercial real estate HR support", status: "Connected" }
  ]);

  const showToast = (text: string) => {
    setToast(text);
    window.setTimeout(() => setToast(""), 2200);
  };

  const filteredPeople = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return people;
    return people.filter((p) => [p.name, p.company, p.industry, p.relationship, ...p.needs, ...p.offers].join(" ").toLowerCase().includes(q));
  }, [query]);

  const askResults = useMemo(() => {
    const q = askQuery.toLowerCase();
    if (!q) return [];
    return people.filter((p) => [p.name, p.company, p.industry, ...p.needs, ...p.offers, ...p.notes].join(" ").toLowerCase().includes(q.replace(/who|do|i|know|that|works|with|in|can|help|me|find/g, "").trim()) ||
      (q.includes("restaurant") && p.offers.some((x) => x.toLowerCase().includes("restaurant"))) ||
      (q.includes("financ") && p.offers.some((x) => x.toLowerCase().includes("financ"))) ||
      (q.includes("real estate") && (p.industry.toLowerCase().includes("real estate") || p.offers.join(" ").toLowerCase().includes("property"))));
  }, [askQuery]);

  const openPerson = (person: Person) => {
    setSelectedPerson(person);
    setView("person");
  };

  const markMet = (id: string) => {
    setMet((current) => current.includes(id) ? current : [...current, id]);
    showToast("Added to tonight's meetings");
  };

  const toggleSaved = (id: string) => {
    setSaved((current) => current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
  };

  const completeIntro = (id: string) => {
    setIntroductions((items) => items.map((x) => x.id === id ? { ...x, status: "Sent" } : x));
    showToast("Introduction marked as sent");
  };

  const parseVoice = () => {
    const lower = voiceText.toLowerCase();
    const needsFinancing = lower.includes("financ");
    const golf = lower.includes("golf");
    const david = lower.includes("david");
    return { needsFinancing, golf, david };
  };

  const navItems: { id: View; label: string }[] = [
    { id: "home", label: "Home" },
    { id: "network", label: "Network" },
    { id: "events", label: "Events" },
    { id: "connections", label: "Connections" },
    { id: "insights", label: "Insights" },
    { id: "ask", label: "Ask NetworkOS" }
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand" onClick={() => setView("home")}><span className="brand-mark">N</span><span>NetworkOS</span></button>
        <nav>
          {navItems.map((item) => <button key={item.id} className={view === item.id ? "nav-item active" : "nav-item"} onClick={() => setView(item.id)}>{item.label}</button>)}
        </nav>
        <div className="sidebar-foot">
          <div className="avatar small">MP</div>
          <div><strong>Demo User</strong><span>Professional Networker</span></div>
        </div>
      </aside>

      <main className="main">
        <header className="mobile-header"><button className="brand" onClick={() => setView("home")}><span className="brand-mark">N</span><span>NetworkOS</span></button></header>

        {view === "home" && <Home setView={setView} openPerson={openPerson} completeIntro={completeIntro} />}
        {view === "network" && <Network query={query} setQuery={setQuery} people={filteredPeople} openPerson={openPerson} />}
        {view === "person" && <PersonProfile person={selectedPerson} setView={setView} showToast={showToast} />}
        {view === "events" && <Events setView={setView} />}
        {view === "plan" && <Plan setView={setView} openPerson={openPerson} markMet={markMet} toggleSaved={toggleSaved} met={met} saved={saved} />}
        {view === "eventmode" && <EventMode setView={setView} markMet={markMet} met={met} setCaptureOpen={setCaptureOpen} />}
        {view === "recap" && <Recap setView={setView} openPerson={openPerson} met={met} />}
        {view === "connections" && <Connections introductions={introductions} completeIntro={completeIntro} />}
        {view === "insights" && <Insights />}
        {view === "ask" && <Ask askQuery={askQuery} setAskQuery={setAskQuery} results={askResults} openPerson={openPerson} />}
      </main>

      <nav className="mobile-nav">
        {[{id:"home" as View,label:"Home"},{id:"network" as View,label:"Network"},{id:"events" as View,label:"Events"},{id:"ask" as View,label:"Ask"}].map((item) => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => setView(item.id)}>{item.label}</button>)}
      </nav>

      {captureOpen && <VoiceCapture voiceText={voiceText} setVoiceText={setVoiceText} close={() => setCaptureOpen(false)} parsed={parseVoice()} showToast={showToast} />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function Header({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: React.ReactNode }) {
  return <div className="page-header"><div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h1>{title}</h1>{description && <p>{description}</p>}</div>{action}</div>;
}

function Home({ setView, openPerson, completeIntro }: { setView: (v: View) => void; openPerson: (p: Person) => void; completeIntro: (id: string) => void }) {
  const robert = people.find((p) => p.id === "robert")!;
  return <div className="page"><Header eyebrow="Thursday, August 20" title="Your network today" description="A few high-value actions are worth your attention." />
    <section className="hero-card"><div><span className="pill">Upcoming event</span><h2>Tampa Business After Hours</h2><p>NetworkOS found <strong>6 people worth prioritizing</strong> from 142 attendees.</p></div><button className="primary" onClick={() => setView("plan")}>View networking plan</button></section>
    <div className="grid two">
      <ActionCard label="Reconnect" title="Robert Chen" text="Your relationship is strong, but it has been 83 days since your last meaningful interaction." meta="4 introductions received" action="View Robert" onClick={() => openPerson(robert)} />
      <ActionCard label="Help someone" title="Jessica Rodriguez needs financing" text="David Thompson is one of your strongest commercial-lending relationships." meta="Strong give-first opportunity" action="Introduce them" onClick={() => completeIntro("i1")} />
      <ActionCard label="Promise overdue" title="Michael → Sarah" text="You promised this introduction 9 days ago. NetworkOS has the context ready." meta="Commercial real estate HR support" action="Complete introduction" onClick={() => setView("connections")} />
      <ActionCard label="Network insight" title="1-to-1 follow-up matters" text="Relationships that move to a one-to-one meeting within 30 days are generating stronger outcomes." meta="Early behavioral pattern" action="View insights" onClick={() => setView("insights")} />
    </div>
  </div>;
}

function ActionCard({ label, title, text, meta, action, onClick }: { label: string; title: string; text: string; meta: string; action: string; onClick: () => void }) {
  return <article className="card"><span className="eyebrow">{label}</span><h3>{title}</h3><p>{text}</p><div className="card-bottom"><span>{meta}</span><button className="link-button" onClick={onClick}>{action} →</button></div></article>;
}

function Network({ query, setQuery, people, openPerson }: { query: string; setQuery: (s: string) => void; people: Person[]; openPerson: (p: Person) => void }) {
  return <div className="page"><Header title="My Network" description="Relationships, not just contacts." action={<button className="secondary">+ Add person</button>} />
    <div className="search-wrap"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search people, industries, needs, offers..." /></div>
    <div className="chip-row"><span className="chip active">All</span><span className="chip">Strong</span><span className="chip">Cooling</span><span className="chip">New</span><span className="chip">Needs help</span></div>
    <div className="list">{people.map((p) => <button className="person-row" key={p.id} onClick={() => openPerson(p)}><div className="avatar">{p.initials}</div><div className="person-main"><strong>{p.name}</strong><span>{p.title} · {p.company}</span></div><div className="person-meta"><span className={`relationship ${p.relationship.toLowerCase().replace(" ", "-")}`}>{p.relationship}</span><small>Last: {p.lastInteraction}</small></div><span className="chevron">›</span></button>)}</div>
  </div>;
}

function PersonProfile({ person, setView, showToast }: { person: Person; setView: (v: View) => void; showToast: (s: string) => void }) {
  return <div className="page"><button className="back" onClick={() => setView("network")}>← Back to network</button>
    <div className="profile-head"><div className="avatar xl">{person.initials}</div><div><span className={`relationship ${person.relationship.toLowerCase().replace(" ", "-")}`}>{person.relationship} relationship</span><h1>{person.name}</h1><p>{person.title} · {person.company}</p></div><div className="profile-actions"><button className="secondary" onClick={() => showToast("Interaction added to demo history")}>Add interaction</button><button className="primary" onClick={() => setView("connections")}>Introduce</button></div></div>
    <div className="grid three profile-grid">
      <section className="card span2"><span className="eyebrow">Relationship intelligence</span><h3>What {person.name.split(" ")[0]} needs</h3><div className="tag-list">{person.needs.map((x) => <span key={x} className="tag">{x}</span>)}</div><h3 className="mt">What they can offer</h3><div className="tag-list">{person.offers.map((x) => <span key={x} className="tag muted">{x}</span>)}</div></section>
      <section className="card"><span className="eyebrow">Network value</span><Metric label="Introductions received" value={String(person.introductionsReceived)} /><Metric label="Referrals received" value={String(person.referralsReceived)} /><Metric label="Revenue influenced" value={money.format(person.influencedRevenue)} /></section>
      <section className="card span2"><span className="eyebrow">Relationship memory</span><div className="timeline"><TimelineItem date="Latest" title={person.lastInteraction === "Never" ? "No interaction yet" : `Last meaningful interaction · ${person.lastInteraction}`} text={person.notes[0] || "No notes yet."} /><TimelineItem date="First met" title={person.metAt} text="Origin of this relationship in NetworkOS." /></div></section>
      <section className="card"><span className="eyebrow">Suggested next step</span><h3>{person.id === "robert" ? "Reconnect over coffee" : "Create value first"}</h3><p>{person.id === "robert" ? "This relationship is strong but cooling. A one-to-one is a better next step than a generic check-in." : "Look for an introduction or resource that helps this person before asking for anything."}</p><button className="link-button" onClick={() => showToast("Follow-up added")}>Add follow-up →</button></section>
    </div>
  </div>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="metric"><strong>{value}</strong><span>{label}</span></div>; }
function TimelineItem({ date, title, text }: { date: string; title: string; text: string }) { return <div className="timeline-item"><span>{date}</span><div><strong>{title}</strong><p>{text}</p></div></div>; }

function Events({ setView }: { setView: (v: View) => void }) {
  return <div className="page"><Header title="Events" description="Turn every room into a focused networking plan." action={<button className="primary">+ Add event</button>} />
    <h2 className="section-title">Upcoming</h2><div className="grid two">{events.filter((e) => e.status === "upcoming").map((e) => <article className="card event-card" key={e.id}><span className="eyebrow">{e.org}</span><h3>{e.name}</h3><p>{e.date} · {e.time}</p><div className="event-stats"><Metric label="Attendees" value={String(e.attendees)} /><Metric label="Matches" value={e.matches ? String(e.matches) : "—"} /><Metric label="Priority" value={e.priorities ? String(e.priorities) : "—"} /></div><button className={e.id === "tampa-mixer" ? "primary wide" : "secondary wide"} onClick={() => e.id === "tampa-mixer" ? setView("plan") : undefined}>{e.id === "tampa-mixer" ? "View networking plan" : "Add attendees"}</button></article>)}</div>
    <h2 className="section-title">Past</h2>{events.filter((e) => e.status === "past").map((e) => <article className="card compact" key={e.id}><div><span className="eyebrow">{e.org}</span><h3>{e.name}</h3><p>{e.date}</p></div><div className="mini-stats"><span><strong>8</strong> met</span><span><strong>5</strong> follow-ups</span><span><strong>3</strong> intros</span></div><button className="secondary">View recap</button></article>)}
  </div>;
}

function Plan({ setView, openPerson, markMet, toggleSaved, met, saved }: { setView: (v: View) => void; openPerson: (p: Person) => void; markMet: (id: string) => void; toggleSaved: (id: string) => void; met: string[]; saved: string[] }) {
  return <div className="page"><button className="back" onClick={() => setView("events")}>← Back to events</button><Header eyebrow="Tampa Business After Hours" title="Your networking plan" description="142 attendees analyzed · 21 relevant · 6 priority connections" action={<button className="primary" onClick={() => setView("eventmode")}>Enter Event Mode</button>} />
    <div className="recommendations">{eventRecommendations.map((r, idx) => <RecommendationCard key={r.id} recommendation={r} rank={idx + 1} openPerson={openPerson} markMet={markMet} toggleSaved={toggleSaved} isMet={met.includes(r.personId)} isSaved={saved.includes(r.personId)} />)}</div>
  </div>;
}

function RecommendationCard({ recommendation: r, rank, openPerson, markMet, toggleSaved, isMet, isSaved }: { recommendation: Recommendation; rank: number; openPerson: (p: Person) => void; markMet: (id: string) => void; toggleSaved: (id: string) => void; isMet: boolean; isSaved: boolean }) {
  const p = people.find((x) => x.id === r.personId)!;
  return <article className="recommendation"><div className="rec-top"><div className="rank">#{rank}</div><div className="avatar lg">{p.initials}</div><div className="rec-person"><button onClick={() => openPerson(p)}><h2>{p.name}</h2></button><p>{p.title} · {p.company}</p></div><div className="match"><strong>{r.score}</strong><span>match</span></div></div>
    <div className="rec-grid"><RecReason label="Why meet" text={r.why} /><RecReason label="How you can help" text={r.help} /><RecReason label="Network value" text={r.value} /><RecReason label="Connection" text={r.connection} /></div>
    <div className="opener"><span>Conversation idea</span><strong>{r.opener}</strong></div><div className="button-row"><button className={isMet ? "secondary success" : "primary"} onClick={() => markMet(p.id)}>{isMet ? "Met ✓" : "I met them"}</button><button className="secondary" onClick={() => toggleSaved(p.id)}>{isSaved ? "Saved ✓" : "Save for tonight"}</button><button className="ghost">Not relevant</button></div>
  </article>;
}
function RecReason({ label, text }: { label: string; text: string }) { return <div><span className="eyebrow">{label}</span><p>{text}</p></div>; }

function EventMode({ setView, markMet, met, setCaptureOpen }: { setView: (v: View) => void; markMet: (id: string) => void; met: string[]; setCaptureOpen: (v: boolean) => void }) {
  return <div className="event-mode"><div className="event-mode-head"><div><span className="live-dot"></span><span>Event Mode · 6:47 PM</span><h1>Tampa Business After Hours</h1></div><button className="secondary inverse" onClick={() => setView("recap")}>Finish event</button></div>
    <div className="progress-card"><span>Priority people met</span><strong>{met.length} / {eventRecommendations.length}</strong><div className="progress"><i style={{ width: `${Math.min(100, (met.length / eventRecommendations.length) * 100)}%` }} /></div></div>
    <div className="event-people">{eventRecommendations.map((r) => { const p = people.find((x) => x.id === r.personId)!; const done = met.includes(p.id); return <button key={p.id} className={done ? "event-person done" : "event-person"} onClick={() => markMet(p.id)}><div className="avatar lg">{p.initials}</div><div><strong>{p.name}</strong><span>{p.company}</span></div><b>{done ? "MET ✓" : "MARK MET"}</b></button>; })}</div>
    <div className="event-actions"><button className="event-action primary-action" onClick={() => setCaptureOpen(true)}>Quick voice note</button><button className="event-action">+ Add person</button><button className="event-action">Scan card</button></div>
  </div>;
}

function VoiceCapture({ voiceText, setVoiceText, close, parsed, showToast }: { voiceText: string; setVoiceText: (s: string) => void; close: () => void; parsed: { needsFinancing: boolean; golf: boolean; david: boolean }; showToast: (s: string) => void }) {
  const defaultText = "Met Jessica. She's opening an Orlando location and needs commercial financing. She loves golf. I told her I'd connect her with David. Follow up Tuesday about coffee.";
  return <div className="modal-backdrop"><div className="modal"><button className="modal-close" onClick={close}>×</button><span className="eyebrow">Quick capture</span><h2>What happened?</h2><p>Speak naturally. For this prototype, type or load the sample note and NetworkOS will structure it.</p><textarea value={voiceText} onChange={(e) => setVoiceText(e.target.value)} placeholder="Met Jessica..." rows={5} /><button className="secondary wide" onClick={() => setVoiceText(defaultText)}>Load sample voice note</button>{voiceText && <div className="extraction"><span className="eyebrow">NetworkOS extracted</span><div className="extraction-row"><span>Person</span><strong>Jessica Rodriguez</strong></div>{parsed.needsFinancing && <div className="extraction-row"><span>Need</span><strong>Commercial financing</strong></div>}{parsed.golf && <div className="extraction-row"><span>Personal context</span><strong>Enjoys golf</strong></div>}{parsed.david && <div className="extraction-row"><span>Commitment</span><strong>Introduce Jessica → David</strong></div>}<div className="extraction-row"><span>Follow-up</span><strong>Tuesday · Coffee</strong></div></div>}<div className="button-row end"><button className="ghost" onClick={close}>Cancel</button><button className="primary" disabled={!voiceText} onClick={() => { showToast("Relationship memory saved"); close(); }}>Save to relationship</button></div></div></div>;
}

function Recap({ setView, openPerson, met }: { setView: (v: View) => void; openPerson: (p: Person) => void; met: string[] }) {
  const jessica = people[0]; const robert = people[1];
  return <div className="page"><Header eyebrow="Tampa Business After Hours" title="Your event recap" description="NetworkOS organized the night into next actions." />
    <div className="stat-strip"><Metric label="People met" value={String(Math.max(met.length, 3))} /><Metric label="Follow-ups" value="5" /><Metric label="People you can help" value="3" /><Metric label="Introductions promised" value="2" /><Metric label="Potential opportunities" value="1" /></div>
    <div className="grid two"><article className="card standout"><span className="eyebrow">Most important next action</span><h2>Introduce Jessica to David</h2><p>Jessica needs commercial financing and David specializes in expansion financing for businesses like hers.</p><button className="primary" onClick={() => setView("connections")}>Make introduction</button></article><article className="card"><span className="eyebrow">Relationship to develop</span><h2>Robert Chen</h2><p>Robert has strong relationships in industries you're trying to enter. Your relationship is strong but cooling.</p><button className="secondary" onClick={() => openPerson(robert)}>View Robert</button></article></div>
    <section className="card"><span className="eyebrow">Follow-ups</span><div className="follow-list"><Follow name={jessica.name} when="Tuesday" action="Invite to coffee" /><Follow name={robert.name} when="Friday" action="Reconnect" /><Follow name="Maria Gonzalez" when="Next week" action="1-to-1 meeting" /></div></section>
  </div>;
}
function Follow({ name, when, action }: { name: string; when: string; action: string }) { return <div className="follow"><strong>{name}</strong><span>{action}</span><b>{when}</b></div>; }

function Connections({ introductions, completeIntro }: { introductions: Intro[]; completeIntro: (id: string) => void }) {
  return <div className="page"><Header title="Connections" description="Track the value moving through your network." />
    <div className="tabs"><button className="tab active">Introductions</button><button className="tab">Referrals</button><button className="tab">Commitments</button></div>
    <div className="list">{introductions.map((i) => <article className="card compact" key={i.id}><div><span className="eyebrow">{i.status}</span><h3>{i.a} ↔ {i.b}</h3><p>{i.reason}</p></div><button className={i.status === "Promised" ? "primary" : "secondary"} onClick={() => i.status === "Promised" ? completeIntro(i.id) : undefined}>{i.status === "Promised" ? "Make introduction" : i.status}</button></article>)}</div>
    <section className="card mt-card"><span className="eyebrow">Referral snapshot</span><div className="stat-strip mini"><Metric label="Given" value="4" /><Metric label="Received" value="6" /><Metric label="Open opportunities" value="3" /><Metric label="Influenced revenue" value="$126K" /></div></section>
  </div>;
}

function Insights() {
  return <div className="page"><Header title="Network insights" description="Learn what is actually making your relationships stronger." />
    <div className="stat-strip"><Metric label="Events attended" value="4" /><Metric label="People met" value="27" /><Metric label="1-to-1 meetings" value="11" /><Metric label="Introductions" value="8" /><Metric label="Referrals received" value="6" /></div>
    <div className="grid three"><article className="card"><span className="eyebrow">Strongest source</span><h2>Tampa Chamber</h2><p>Most meaningful new relationships in the last 90 days.</p></article><article className="card"><span className="eyebrow">Strongest connector</span><h2>Robert Chen</h2><p>4 introductions · $62K influenced revenue.</p></article><article className="card"><span className="eyebrow">Needs attention</span><h2>7 relationships</h2><p>Previously active relationships are beginning to cool.</p></article></div>
    <article className="hero-card insight"><div><span className="pill">NetworkOS insight</span><h2>Your best relationships are happening after the event.</h2><p>Contacts you meet at networking events and then meet one-to-one within 30 days are developing into stronger referral relationships.</p></div></article>
  </div>;
}

function Ask({ askQuery, setAskQuery, results, openPerson }: { askQuery: string; setAskQuery: (s: string) => void; results: Person[]; openPerson: (p: Person) => void }) {
  const examples = ["Who do I know in commercial real estate?", "Who can help with financing?", "Who knows restaurant owners?"];
  return <div className="page ask-page"><Header title="Ask NetworkOS" description="Search your relationships like you remember every conversation." />
    <div className="ask-box"><input autoFocus value={askQuery} onChange={(e) => setAskQuery(e.target.value)} placeholder="Who can my network help me reach?" /><button className="primary">Ask</button></div>
    {!askQuery && <div className="example-row">{examples.map((x) => <button key={x} className="chip" onClick={() => setAskQuery(x)}>{x}</button>)}</div>}
    {askQuery && <div className="ask-results"><span className="eyebrow">Best matches</span>{results.length ? results.slice(0,5).map((p) => <button className="answer-card" key={p.id} onClick={() => openPerson(p)}><div className="avatar">{p.initials}</div><div><strong>{p.name}</strong><span>{p.title} · {p.company}</span><p>{p.offers[0] || p.notes[0]}</p></div><span>View →</span></button>) : <div className="empty">No strong matches in the demo network. Try “commercial real estate”, “financing”, or “restaurant owners”.</div>}</div>}
  </div>;
}
