"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Role = "brand" | "influencer";
type View = "overview" | "marketplace" | "creators" | "messages" | "profile";
type Status = "pending" | "accepted" | "rejected";

type User = {
  id: string;
  role: Role;
  name: string;
  email: string;
  company: string;
  niche: string;
  location: string;
  bio: string;
  followers?: number;
  engagement?: number;
  rate?: number;
  tier: "free" | "basic" | "pro";
  verified?: boolean;
};

type Campaign = {
  id: string;
  brandId: string;
  title: string;
  description: string;
  category: string;
  budgetMin: number;
  budgetMax: number;
  timeline: string;
  deliverables: string;
  audience: string;
  featured?: boolean;
};

type Application = {
  id: string;
  campaignId: string;
  brandId: string;
  influencerId: string;
  pitch: string;
  fee: number;
  status: Status;
};

type Conversation = {
  id: string;
  participants: [string, string];
  campaignId?: string;
};

type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: number;
};

type DemoState = {
  users: User[];
  campaigns: Campaign[];
  applications: Application[];
  conversations: Conversation[];
  messages: Message[];
};

const storageKey = "collabhub-polished-demo-v1";
const categories = ["All", "Beauty", "Lifestyle", "Food", "Fitness", "Fashion", "Travel"];

const initialState: DemoState = {
  users: [
    {
      id: "brand-glowhaus",
      role: "brand",
      name: "Maya Chen",
      email: "demo-brand@collabhub.test",
      company: "GlowHaus Labs",
      niche: "Beauty",
      location: "New York, NY",
      bio: "Clean skincare brand building creator-led launch campaigns for premium retail.",
      tier: "basic",
      verified: true,
    },
    {
      id: "brand-nourish",
      role: "brand",
      name: "Leo Grant",
      email: "nourish@collabhub.test",
      company: "Nourish Daily",
      niche: "Food",
      location: "Austin, TX",
      bio: "Protein snack startup looking for warm, useful UGC across TikTok and Instagram.",
      tier: "pro",
      verified: true,
    },
    {
      id: "creator-ava",
      role: "influencer",
      name: "Ava Kim",
      email: "demo-influencer@collabhub.test",
      company: "Ava Creates",
      niche: "Beauty",
      location: "Los Angeles, CA",
      bio: "Beauty creator focused on skincare routines, GRWM content, and honest product education.",
      followers: 84200,
      engagement: 4.8,
      rate: 1500,
      tier: "pro",
      verified: true,
    },
    {
      id: "creator-sam",
      role: "influencer",
      name: "Sam Rivera",
      email: "sam@collabhub.test",
      company: "Everyday Sam",
      niche: "Lifestyle",
      location: "Miami, FL",
      bio: "Lifestyle creator making polished morning routines, travel edits, and family-friendly reels.",
      followers: 126000,
      engagement: 3.9,
      rate: 2200,
      tier: "basic",
      verified: true,
    },
    {
      id: "creator-jules",
      role: "influencer",
      name: "Jules Park",
      email: "jules@collabhub.test",
      company: "Jules Eats",
      niche: "Food",
      location: "Seattle, WA",
      bio: "Recipe developer and food creator with high-performing snack, meal prep, and taste-test videos.",
      followers: 57300,
      engagement: 6.2,
      rate: 950,
      tier: "free",
    },
  ],
  campaigns: [
    {
      id: "campaign-serum",
      brandId: "brand-glowhaus",
      title: "Vitamin C serum UGC launch",
      description: "Create a premium content package for a new vitamin C serum launch.",
      category: "Beauty",
      budgetMin: 900,
      budgetMax: 2400,
      timeline: "14 days",
      deliverables: "1 reel, 3 stories, 5 raw clips",
      audience: "Women 18-34 interested in skincare",
      featured: true,
    },
    {
      id: "campaign-sunscreen",
      brandId: "brand-glowhaus",
      title: "Mineral sunscreen summer push",
      description: "Show daily sunscreen use with texture shots and honest narration.",
      category: "Lifestyle",
      budgetMin: 700,
      budgetMax: 1800,
      timeline: "10 days",
      deliverables: "2 TikToks, 3 stills",
      audience: "Outdoor and beauty shoppers",
    },
    {
      id: "campaign-protein",
      brandId: "brand-nourish",
      title: "Protein snack recipe series",
      description: "Turn protein bites into quick recipe and taste-test content.",
      category: "Food",
      budgetMin: 500,
      budgetMax: 1400,
      timeline: "7 days",
      deliverables: "3 short videos, raw usage rights",
      audience: "Fitness and busy-parent audiences",
      featured: true,
    },
  ],
  applications: [
    {
      id: "application-serum-ava",
      campaignId: "campaign-serum",
      brandId: "brand-glowhaus",
      influencerId: "creator-ava",
      pitch: "I can build a GRWM reel with product education, texture closeups, and usage-rights raw clips.",
      fee: 1500,
      status: "accepted",
    },
    {
      id: "application-protein-jules",
      campaignId: "campaign-protein",
      brandId: "brand-nourish",
      influencerId: "creator-jules",
      pitch: "I can create three snack recipe videos with taste-test hooks and meal-prep positioning.",
      fee: 900,
      status: "pending",
    },
  ],
  conversations: [
    { id: "conversation-glowhaus-ava", participants: ["brand-glowhaus", "creator-ava"], campaignId: "campaign-serum" },
    { id: "conversation-nourish-jules", participants: ["brand-nourish", "creator-jules"], campaignId: "campaign-protein" },
  ],
  messages: [
    {
      id: "message-1",
      conversationId: "conversation-glowhaus-ava",
      senderId: "brand-glowhaus",
      body: "Your pitch fits the launch perfectly. Can you send a shot list today?",
      createdAt: Date.now() - 1000 * 60 * 43,
    },
    {
      id: "message-2",
      conversationId: "conversation-glowhaus-ava",
      senderId: "creator-ava",
      body: "Yes. I will include a hook, texture closeup, GRWM sequence, and CTA variations.",
      createdAt: Date.now() - 1000 * 60 * 38,
    },
    {
      id: "message-3",
      conversationId: "conversation-glowhaus-ava",
      senderId: "brand-glowhaus",
      body: "Great. We accepted the application and can move to contract after the shot list.",
      createdAt: Date.now() - 1000 * 60 * 21,
    },
  ],
};

function loadState() {
  if (typeof window === "undefined") return initialState;
  const saved = window.localStorage.getItem(storageKey);
  if (!saved) return initialState;
  try {
    return JSON.parse(saved) as DemoState;
  } catch {
    return initialState;
  }
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function money(value: number) {
  return `$${value.toLocaleString()}`;
}

function timeAgo(value: number) {
  const minutes = Math.max(1, Math.round((Date.now() - value) / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.round(minutes / 60)}h ago`;
}

export default function CollabHubDemoPage() {
  const [state, setState] = useState<DemoState>(() => loadState());
  const [currentUserId, setCurrentUserId] = useState("brand-glowhaus");
  const [view, setView] = useState<View>("overview");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("featured");
  const [selectedConversationId, setSelectedConversationId] = useState("conversation-glowhaus-ava");
  const [notice, setNotice] = useState("Instant demo ready. Switch accounts to test both sides.");

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state]);

  const currentUser = state.users.find((user) => user.id === currentUserId) ?? state.users[0];
  const creators = state.users.filter((user) => user.role === "influencer");
  const brands = state.users.filter((user) => user.role === "brand");
  const conversations = state.conversations.filter((conversation) => conversation.participants.includes(currentUser.id));
  const selectedConversation = conversations.find((conversation) => conversation.id === selectedConversationId) ?? conversations[0];
  const selectedMessages = state.messages.filter((message) => message.conversationId === selectedConversation?.id);
  const myApplications = state.applications.filter((application) =>
    currentUser.role === "brand" ? application.brandId === currentUser.id : application.influencerId === currentUser.id
  );
  const myCampaigns = state.campaigns.filter((campaign) => campaign.brandId === currentUser.id);

  const filteredCampaigns = useMemo(() => {
    const q = query.toLowerCase();
    return [...state.campaigns]
      .filter((campaign) => category === "All" || campaign.category === category)
      .filter((campaign) =>
        [campaign.title, campaign.description, campaign.category, campaign.audience].join(" ").toLowerCase().includes(q)
      )
      .sort((a, b) => {
        if (sort === "budget") return b.budgetMax - a.budgetMax;
        if (sort === "newest") return b.id.localeCompare(a.id);
        return Number(b.featured) - Number(a.featured);
      });
  }, [category, query, sort, state.campaigns]);

  const profileCompletion = [
    ["Profile bio", Boolean(currentUser.bio)],
    ["Niche selected", Boolean(currentUser.niche)],
    ["Plan selected", currentUser.tier !== "free"],
    ["First conversation", conversations.length > 0],
  ];

  const stats =
    currentUser.role === "brand"
      ? [
          ["Active campaigns", myCampaigns.length],
          ["Applications", myApplications.length],
          ["Creator pool", creators.length],
          ["Projected spend", money(myCampaigns.reduce((sum, campaign) => sum + campaign.budgetMax, 0))],
        ]
      : [
          ["Applications", myApplications.length],
          ["Open briefs", state.campaigns.length],
          ["Avg. fee", money(currentUser.rate ?? 0)],
          ["Engagement", `${currentUser.engagement ?? 0}%`],
        ];

  function update(next: DemoState) {
    setState(next);
  }

  function resetDemo() {
    update(initialState);
    setCurrentUserId("brand-glowhaus");
    setSelectedConversationId("conversation-glowhaus-ava");
    setNotice("Demo data reset.");
  }

  function findConversation(a: string, b: string) {
    return state.conversations.find((conversation) => conversation.participants.includes(a) && conversation.participants.includes(b));
  }

  function openConversation(otherUserId: string, campaignId?: string) {
    const conversation =
      findConversation(currentUser.id, otherUserId) ?? {
        id: makeId("conversation"),
        participants: [currentUser.id, otherUserId] as [string, string],
        campaignId,
      };
    update({
      ...state,
      conversations: state.conversations.some((item) => item.id === conversation.id)
        ? state.conversations
        : [conversation, ...state.conversations],
    });
    setSelectedConversationId(conversation.id);
    setView("messages");
  }

  function applyToCampaign(campaign: Campaign) {
    if (currentUser.role !== "influencer") return;
    if (state.applications.some((application) => application.campaignId === campaign.id && application.influencerId === currentUser.id)) {
      setNotice("You already applied to this campaign.");
      return;
    }
    const conversation =
      findConversation(campaign.brandId, currentUser.id) ?? {
        id: makeId("conversation"),
        participants: [campaign.brandId, currentUser.id] as [string, string],
        campaignId: campaign.id,
      };
    update({
      ...state,
      applications: [
        {
          id: makeId("application"),
          campaignId: campaign.id,
          brandId: campaign.brandId,
          influencerId: currentUser.id,
          pitch: `I can deliver ${campaign.deliverables} for ${campaign.title} with strong audience fit.`,
          fee: Math.round((campaign.budgetMin + campaign.budgetMax) / 2),
          status: "pending",
        },
        ...state.applications,
      ],
      conversations: state.conversations.some((item) => item.id === conversation.id)
        ? state.conversations
        : [conversation, ...state.conversations],
      messages: [
        ...state.messages,
        {
          id: makeId("message"),
          conversationId: conversation.id,
          senderId: currentUser.id,
          body: `I just applied to ${campaign.title}. Happy to tailor deliverables to your launch goals.`,
          createdAt: Date.now(),
        },
      ],
    });
    setSelectedConversationId(conversation.id);
    setNotice("Application sent and conversation started.");
    setView("messages");
  }

  function reviewApplication(applicationId: string, status: Status) {
    update({
      ...state,
      applications: state.applications.map((application) =>
        application.id === applicationId ? { ...application, status } : application
      ),
    });
    setNotice(`Application marked ${status}.`);
  }

  function createCampaign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (currentUser.role !== "brand") return;
    const form = new FormData(event.currentTarget);
    update({
      ...state,
      campaigns: [
        {
          id: makeId("campaign"),
          brandId: currentUser.id,
          title: String(form.get("title") ?? ""),
          description: String(form.get("description") ?? ""),
          category: String(form.get("category") ?? "Lifestyle"),
          budgetMin: Number(form.get("budgetMin") ?? 500),
          budgetMax: Number(form.get("budgetMax") ?? 1500),
          timeline: String(form.get("timeline") ?? "14 days"),
          deliverables: String(form.get("deliverables") ?? "1 reel, 3 stories"),
          audience: String(form.get("audience") ?? "Gen Z and millennial shoppers"),
          featured: true,
        },
        ...state.campaigns,
      ],
    });
    event.currentTarget.reset();
    setNotice("Campaign created.");
  }

  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedConversation) return;
    const form = new FormData(event.currentTarget);
    const body = String(form.get("message") ?? "").trim();
    if (!body) return;
    update({
      ...state,
      messages: [
        ...state.messages,
        {
          id: makeId("message"),
          conversationId: selectedConversation.id,
          senderId: currentUser.id,
          body,
          createdAt: Date.now(),
        },
      ],
    });
    event.currentTarget.reset();
  }

  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    update({
      ...state,
      users: state.users.map((user) =>
        user.id === currentUser.id
          ? {
              ...user,
              name: String(form.get("name") ?? user.name),
              company: String(form.get("company") ?? user.company),
              niche: String(form.get("niche") ?? user.niche),
              location: String(form.get("location") ?? user.location),
              bio: String(form.get("bio") ?? user.bio),
              followers: Number(form.get("followers") ?? user.followers ?? 0) || undefined,
              engagement: Number(form.get("engagement") ?? user.engagement ?? 0) || undefined,
            }
          : user
      ),
    });
    setNotice("Profile saved.");
  }

  return (
    <main className="min-h-screen bg-[#08070A] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,122,69,0.22),_transparent_28%),radial-gradient(circle_at_80%_0%,_rgba(124,92,255,0.22),_transparent_26%)]" />
      <div className="relative grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="border-b border-white/10 bg-black/25 p-5 backdrop-blur-xl lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-white font-black text-[#101014]">C</span>
            <span>
              <span className="block text-lg font-semibold tracking-tight">CollabHub</span>
              <span className="text-xs uppercase tracking-[0.2em] text-white/40">Demo workspace</span>
            </span>
          </Link>

          <div className="mt-7 rounded-3xl border border-white/10 bg-white/[0.06] p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-white/40">Testing as</div>
            <select
              className="mt-3 w-full rounded-2xl border border-white/10 bg-[#121018] px-3 py-3 text-sm text-white"
              value={currentUserId}
              onChange={(event) => {
                setCurrentUserId(event.target.value);
                setNotice("Account switched.");
              }}
            >
              {[...brands, ...creators].map((user) => (
                <option key={user.id} value={user.id}>
                  {user.role}: {user.name}
                </option>
              ))}
            </select>
          </div>

          <nav className="mt-6 grid gap-2">
            {[
              ["overview", "Overview", "Command center"],
              ["marketplace", "Marketplace", "Find campaigns"],
              ["creators", "Creators", "Discover talent"],
              ["messages", "Messages", "Negotiate deals"],
              ["profile", "Profile", "Polish account"],
            ].map(([id, label, description]) => (
              <button
                key={id}
                className={`rounded-2xl px-4 py-3 text-left transition ${
                  view === id ? "bg-white text-[#101014]" : "text-white/68 hover:bg-white/[0.08] hover:text-white"
                }`}
                onClick={() => setView(id as View)}
                type="button"
              >
                <span className="block text-sm font-semibold">{label}</span>
                <span className={view === id ? "text-xs text-black/55" : "text-xs text-white/36"}>{description}</span>
              </button>
            ))}
          </nav>

          <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.05] p-4">
            <div className="text-sm font-semibold">Profile checklist</div>
            <div className="mt-3 space-y-2">
              {profileCompletion.map(([label, done]) => (
                <div key={label as string} className="flex items-center justify-between text-xs">
                  <span className="text-white/55">{label}</span>
                  <span className={done ? "text-[#80FFB0]" : "text-[#FFB088]"}>{done ? "Done" : "Todo"}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex gap-2">
            <Link className="flex-1 rounded-full border border-white/15 px-4 py-2 text-center text-sm font-semibold" href="/collabhub/test">
              Test center
            </Link>
            <button className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#101014]" onClick={resetDemo} type="button">
              Reset
            </button>
          </div>
        </aside>

        <section className="p-5 sm:p-8">
          <header className="grid gap-5 rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="inline-flex rounded-full border border-[#80FFB0]/25 bg-[#80FFB0]/10 px-3 py-1 text-xs font-semibold text-[#BFFFF0]">
                Instant demo - no setup needed
              </div>
              <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.055em] sm:text-6xl">
                Premium creator marketplace for brand partnerships.
              </h1>
              <p className="mt-4 max-w-2xl text-white/60">
                Search campaigns, review creators, manage applications, and negotiate in a polished workflow.
              </p>
            </div>
            <div className="grid gap-3 rounded-3xl bg-black/25 p-4 sm:grid-cols-2 lg:min-w-80">
              <Metric label="Role" value={currentUser.role} />
              <Metric label="Plan" value={currentUser.tier} />
              <Metric label="Niche" value={currentUser.niche} />
              <Metric label="Location" value={currentUser.location.split(",")[0]} />
            </div>
          </header>

          {notice && (
            <div className="mt-5 rounded-2xl border border-[#80FFB0]/20 bg-[#80FFB0]/10 px-4 py-3 text-sm text-[#BFFFF0]">
              {notice}
            </div>
          )}

          {view === "overview" && (
            <Overview
              applications={myApplications}
              campaigns={state.campaigns}
              currentUser={currentUser}
              creators={creators}
              onView={setView}
              stats={stats}
            />
          )}
          {view === "marketplace" && (
            <Marketplace
              applications={state.applications}
              campaigns={filteredCampaigns}
              category={category}
              currentUser={currentUser}
              onApply={applyToCampaign}
              onCategory={setCategory}
              onOpenConversation={openConversation}
              onQuery={setQuery}
              onSort={setSort}
              query={query}
              sort={sort}
              users={state.users}
            />
          )}
          {view === "creators" && <Creators creators={creators} currentUser={currentUser} onOpenConversation={openConversation} />}
          {view === "messages" && (
            <Messages
              campaigns={state.campaigns}
              conversations={conversations}
              currentUser={currentUser}
              messages={selectedMessages}
              onSelect={setSelectedConversationId}
              onSend={sendMessage}
              selectedConversation={selectedConversation}
              selectedConversationId={selectedConversation?.id}
              users={state.users}
            />
          )}
          {view === "profile" && <Profile currentUser={currentUser} onSave={saveProfile} />}

          {view === "overview" && currentUser.role === "brand" && (
            <CreateCampaignForm onCreate={createCampaign} />
          )}
          {view === "overview" && (
            <Applications
              applications={myApplications}
              campaigns={state.campaigns}
              currentUser={currentUser}
              onOpenConversation={openConversation}
              onReview={reviewApplication}
              users={state.users}
            />
          )}
        </section>
      </div>
    </main>
  );
}

function Overview({
  applications,
  campaigns,
  creators,
  currentUser,
  onView,
  stats,
}: {
  applications: Application[];
  campaigns: Campaign[];
  creators: User[];
  currentUser: User;
  onView: (view: View) => void;
  stats: (string | number)[][];
}) {
  return (
    <div className="mt-6 grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-5">
            <div className="text-3xl font-semibold capitalize">{value}</div>
            <div className="mt-1 text-xs uppercase tracking-[0.16em] text-white/40">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
          <div className="flex items-center justify-between">
            <SectionTitle eyebrow="Featured campaigns" title="High-fit briefs" />
            <button className="rounded-full border border-white/15 px-4 py-2 text-sm" onClick={() => onView("marketplace")} type="button">
              View all
            </button>
          </div>
          <div className="mt-5 grid gap-3">
            {campaigns.filter((campaign) => campaign.featured).map((campaign) => (
              <CampaignMini key={campaign.id} campaign={campaign} />
            ))}
          </div>
        </div>
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
          <div className="flex items-center justify-between">
            <SectionTitle eyebrow={currentUser.role === "brand" ? "Talent" : "Pipeline"} title={currentUser.role === "brand" ? "Featured creators" : "Your applications"} />
            <button className="rounded-full border border-white/15 px-4 py-2 text-sm" onClick={() => onView(currentUser.role === "brand" ? "creators" : "marketplace")} type="button">
              Explore
            </button>
          </div>
          <div className="mt-5 grid gap-3">
            {currentUser.role === "brand"
              ? creators.slice(0, 3).map((creator) => <CreatorMini key={creator.id} creator={creator} />)
              : applications.map((application) => (
                  <div key={application.id} className="rounded-2xl bg-black/20 p-4">
                    <div className="font-semibold capitalize">{application.status}</div>
                    <div className="mt-1 text-sm text-white/50">{application.pitch}</div>
                  </div>
                ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Marketplace({
  applications,
  campaigns,
  category,
  currentUser,
  onApply,
  onCategory,
  onOpenConversation,
  onQuery,
  onSort,
  query,
  sort,
  users,
}: {
  applications: Application[];
  campaigns: Campaign[];
  category: string;
  currentUser: User;
  onApply: (campaign: Campaign) => void;
  onCategory: (category: string) => void;
  onOpenConversation: (otherUserId: string, campaignId?: string) => void;
  onQuery: (query: string) => void;
  onSort: (sort: string) => void;
  query: string;
  sort: string;
  users: User[];
}) {
  return (
    <div className="mt-6">
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
          <input
            className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none"
            onChange={(event) => onQuery(event.target.value)}
            placeholder="Search campaigns, audiences, categories..."
            value={query}
          />
          <select className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-white" onChange={(event) => onCategory(event.target.value)} value={category}>
            {categories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-white" onChange={(event) => onSort(event.target.value)} value={sort}>
            <option value="featured">Featured</option>
            <option value="budget">Highest budget</option>
            <option value="newest">Newest</option>
          </select>
        </div>
      </div>
      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {campaigns.map((campaign) => {
          const brand = users.find((user) => user.id === campaign.brandId);
          const applied = applications.some((application) => application.campaignId === campaign.id && application.influencerId === currentUser.id);
          return (
            <article key={campaign.id} className="group rounded-[2rem] border border-white/10 bg-[#121018] p-5 transition hover:-translate-y-1 hover:border-white/25">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    {campaign.featured && <Badge tone="green">Featured</Badge>}
                    <Badge>{campaign.category}</Badge>
                  </div>
                  <h3 className="mt-4 text-2xl font-semibold tracking-[-0.03em]">{campaign.title}</h3>
                  <p className="mt-2 text-sm text-white/58">{brand?.company} - {brand?.location}</p>
                </div>
                <div className="rounded-2xl bg-white text-right text-[#101014] px-4 py-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-black/45">Budget</div>
                  <div className="font-bold">{money(campaign.budgetMin)}-{money(campaign.budgetMax)}</div>
                </div>
              </div>
              <p className="mt-4 text-white/64">{campaign.description}</p>
              <div className="mt-4 grid gap-2 text-sm text-white/48 sm:grid-cols-3">
                <Info label="Timeline" value={campaign.timeline} />
                <Info label="Deliverables" value={campaign.deliverables} />
                <Info label="Audience" value={campaign.audience} />
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {currentUser.role === "influencer" && (
                  <button className="rounded-full bg-white px-5 py-2 text-sm font-bold text-[#101014] disabled:bg-white/20 disabled:text-white/35" disabled={applied} onClick={() => onApply(campaign)} type="button">
                    {applied ? "Applied" : "Apply now"}
                  </button>
                )}
                {brand && brand.id !== currentUser.id && (
                  <button className="rounded-full border border-white/15 px-5 py-2 text-sm font-bold" onClick={() => onOpenConversation(brand.id, campaign.id)} type="button">
                    Message brand
                  </button>
                )}
              </div>
            </article>
          );
        })}
        {campaigns.length === 0 && <EmptyState title="No matching campaigns" body="Try another search or category." />}
      </div>
    </div>
  );
}

function Creators({ creators, currentUser, onOpenConversation }: { creators: User[]; currentUser: User; onOpenConversation: (id: string) => void }) {
  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {creators.map((creator) => (
        <article key={creator.id} className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-[#FFB088] to-[#7B61FF] font-bold">
                {creator.name.split(" ").map((part) => part[0]).join("")}
              </div>
              <div>
                <div className="font-semibold">{creator.name}</div>
                <div className="text-sm text-white/45">{creator.location}</div>
              </div>
            </div>
            {creator.verified && <Badge tone="green">Verified</Badge>}
          </div>
          <p className="mt-4 text-sm text-white/62">{creator.bio}</p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Metric label="Followers" value={(creator.followers ?? 0).toLocaleString()} />
            <Metric label="Engage" value={`${creator.engagement ?? 0}%`} />
            <Metric label="Rate" value={money(creator.rate ?? 0)} />
          </div>
          {currentUser.role === "brand" && (
            <button className="mt-5 w-full rounded-full bg-white px-5 py-2 text-sm font-bold text-[#101014]" onClick={() => onOpenConversation(creator.id)} type="button">
              Invite creator
            </button>
          )}
        </article>
      ))}
    </div>
  );
}

function Messages({
  campaigns,
  conversations,
  currentUser,
  messages,
  onSelect,
  onSend,
  selectedConversation,
  selectedConversationId,
  users,
}: {
  campaigns: Campaign[];
  conversations: Conversation[];
  currentUser: User;
  messages: Message[];
  onSelect: (id: string) => void;
  onSend: (event: FormEvent<HTMLFormElement>) => void;
  selectedConversation?: Conversation;
  selectedConversationId?: string;
  users: User[];
}) {
  const otherId = selectedConversation?.participants.find((id) => id !== currentUser.id);
  const other = users.find((user) => user.id === otherId);
  const campaign = campaigns.find((item) => item.id === selectedConversation?.campaignId);
  return (
    <div className="mt-6 grid gap-5 xl:grid-cols-[360px_1fr]">
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-4">
        <SectionTitle eyebrow="Inbox" title="Deal conversations" />
        <div className="mt-4 grid gap-2">
          {conversations.map((conversation) => {
            const partner = users.find((user) => user.id === conversation.participants.find((id) => id !== currentUser.id));
            const last = [...messages].reverse().find((message) => message.conversationId === conversation.id);
            return (
              <button
                className={`rounded-2xl p-4 text-left ${selectedConversationId === conversation.id ? "bg-white text-[#101014]" : "bg-black/20 hover:bg-white/[0.08]"}`}
                key={conversation.id}
                onClick={() => onSelect(conversation.id)}
                type="button"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{partner?.name}</span>
                  <span className={selectedConversationId === conversation.id ? "text-xs text-black/45" : "text-xs text-white/35"}>{last ? timeAgo(last.createdAt) : "new"}</span>
                </div>
                <div className={selectedConversationId === conversation.id ? "mt-1 text-sm text-black/55" : "mt-1 text-sm text-white/45"}>
                  {last?.body ?? "Start the conversation"}
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <div className="rounded-[2rem] border border-white/10 bg-[#111016] p-5">
        <div className="border-b border-white/10 pb-4">
          <div className="text-sm text-white/45">{campaign?.title ?? "General partnership"}</div>
          <h2 className="mt-1 text-2xl font-semibold">{other?.name ?? "Select a conversation"}</h2>
          <div className="mt-2 text-sm text-[#80FFB0]">Typing indicators, deal notes, and file attachments can plug in here.</div>
        </div>
        <div className="grid min-h-96 content-end gap-3 py-5">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.senderId === currentUser.id ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[78%] rounded-3xl px-4 py-3 text-sm ${message.senderId === currentUser.id ? "bg-white text-[#101014]" : "bg-white/[0.08] text-white/72"}`}>
                <div>{message.body}</div>
                <div className={message.senderId === currentUser.id ? "mt-1 text-xs text-black/40" : "mt-1 text-xs text-white/35"}>{timeAgo(message.createdAt)}</div>
              </div>
            </div>
          ))}
        </div>
        <form className="flex gap-2" onSubmit={onSend}>
          <input className="flex-1 rounded-full border border-white/10 bg-black/25 px-4 py-3 text-white outline-none" name="message" placeholder="Write a polished partnership reply..." required />
          <button className="rounded-full bg-white px-5 py-3 font-bold text-[#101014]" type="submit">Send</button>
        </form>
      </div>
    </div>
  );
}

function Applications({
  applications,
  campaigns,
  currentUser,
  onOpenConversation,
  onReview,
  users,
}: {
  applications: Application[];
  campaigns: Campaign[];
  currentUser: User;
  onOpenConversation: (id: string, campaignId?: string) => void;
  onReview: (id: string, status: Status) => void;
  users: User[];
}) {
  return (
    <div className="mt-5 rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
      <SectionTitle eyebrow="Applications" title={currentUser.role === "brand" ? "Creator pitches" : "Your pipeline"} />
      <div className="mt-5 grid gap-3">
        {applications.map((application) => {
          const campaign = campaigns.find((item) => item.id === application.campaignId);
          const creator = users.find((user) => user.id === application.influencerId);
          const brand = users.find((user) => user.id === application.brandId);
          return (
            <article key={application.id} className="rounded-2xl bg-black/20 p-4">
              <div className="flex flex-col justify-between gap-4 lg:flex-row">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone={application.status === "accepted" ? "green" : application.status === "rejected" ? "red" : "gold"}>{application.status}</Badge>
                    <Badge>{campaign?.category ?? "Campaign"}</Badge>
                  </div>
                  <h3 className="mt-3 font-semibold">{campaign?.title}</h3>
                  <p className="mt-1 text-sm text-white/45">{currentUser.role === "brand" ? creator?.name : brand?.company}</p>
                  <p className="mt-3 text-sm text-white/62">{application.pitch}</p>
                </div>
                <div className="min-w-40">
                  <div className="text-2xl font-semibold text-[#80FFB0]">{money(application.fee)}</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {currentUser.role === "brand" && application.status === "pending" && (
                      <>
                        <button className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#101014]" onClick={() => onReview(application.id, "accepted")} type="button">Accept</button>
                        <button className="rounded-full border border-white/15 px-4 py-2 text-sm" onClick={() => onReview(application.id, "rejected")} type="button">Reject</button>
                      </>
                    )}
                    <button className="rounded-full border border-white/15 px-4 py-2 text-sm" onClick={() => onOpenConversation(currentUser.role === "brand" ? application.influencerId : application.brandId, application.campaignId)} type="button">
                      Message
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
        {applications.length === 0 && <EmptyState title="No applications yet" body="Applications will appear here as creators pitch campaigns." />}
      </div>
    </div>
  );
}

function CreateCampaignForm({ onCreate }: { onCreate: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <form className="mt-5 rounded-[2rem] border border-white/10 bg-white/[0.05] p-5" onSubmit={onCreate}>
      <SectionTitle eyebrow="Create" title="Post a premium campaign brief" />
      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <Field label="Title" name="title" placeholder="Hydrating cleanser launch" required />
        <Field label="Category" name="category" placeholder="Beauty" required />
        <Field label="Description" name="description" placeholder="Campaign goal and creative angle" required />
        <Field label="Audience" name="audience" placeholder="Skincare shoppers, 18-34" required />
        <Field label="Budget min" name="budgetMin" placeholder="800" required type="number" />
        <Field label="Budget max" name="budgetMax" placeholder="2200" required type="number" />
        <Field label="Timeline" name="timeline" placeholder="14 days" required />
        <Field label="Deliverables" name="deliverables" placeholder="1 reel, 3 stories, raw clips" required />
      </div>
      <button className="mt-4 rounded-full bg-white px-5 py-3 font-bold text-[#101014]" type="submit">Publish demo brief</button>
    </form>
  );
}

function Profile({ currentUser, onSave }: { currentUser: User; onSave: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <form className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.05] p-6" onSubmit={onSave}>
      <SectionTitle eyebrow="Profile" title="Polish marketplace presence" />
      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <Field defaultValue={currentUser.name} label="Name" name="name" required />
        <Field defaultValue={currentUser.company} label="Company / creator brand" name="company" required />
        <Field defaultValue={currentUser.niche} label="Niche" name="niche" required />
        <Field defaultValue={currentUser.location} label="Location" name="location" required />
        <Field defaultValue={currentUser.followers} label="Followers" name="followers" type="number" />
        <Field defaultValue={currentUser.engagement} label="Engagement %" name="engagement" type="number" />
      </div>
      <label className="mt-3 block text-sm text-white/58">
        Bio
        <textarea className="mt-2 min-h-32 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none" defaultValue={currentUser.bio} name="bio" />
      </label>
      <button className="mt-4 rounded-full bg-white px-5 py-3 font-bold text-[#101014]" type="submit">Save profile</button>
    </form>
  );
}

function CampaignMini({ campaign }: { campaign: Campaign }) {
  return (
    <div className="rounded-2xl bg-black/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-semibold">{campaign.title}</div>
          <div className="mt-1 text-sm text-white/45">{campaign.category} - {campaign.timeline}</div>
        </div>
        <div className="text-sm font-semibold text-[#80FFB0]">{money(campaign.budgetMin)}+</div>
      </div>
    </div>
  );
}

function CreatorMini({ creator }: { creator: User }) {
  return (
    <div className="rounded-2xl bg-black/20 p-4">
      <div className="font-semibold">{creator.name}</div>
      <div className="mt-1 text-sm text-white/45">{creator.niche} - {(creator.followers ?? 0).toLocaleString()} followers</div>
    </div>
  );
}

function Field({
  defaultValue,
  label,
  name,
  placeholder,
  required,
  type = "text",
}: {
  defaultValue?: string | number;
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="text-sm text-white/58">
      {label}
      <input className="mt-2 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none focus:border-white/30" defaultValue={defaultValue} name={name} placeholder={placeholder} required={required} type={type} />
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-white/[0.06] p-3">
      <div className="text-lg font-semibold capitalize">{value}</div>
      <div className="mt-1 text-[10px] uppercase tracking-[0.16em] text-white/38">{label}</div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/[0.05] p-3">
      <div className="text-[10px] uppercase tracking-[0.16em] text-white/35">{label}</div>
      <div className="mt-1 text-white/70">{value}</div>
    </div>
  );
}

function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "green" | "gold" | "red" }) {
  const colors = {
    neutral: "bg-white/[0.08] text-white/65",
    green: "bg-[#80FFB0]/12 text-[#80FFB0]",
    gold: "bg-[#FFB088]/12 text-[#FFB088]",
    red: "bg-red-400/12 text-red-200",
  };
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${colors[tone]}`}>{children}</span>;
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FFB088]">{eyebrow}</p>
      <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em]">{title}</h2>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[2rem] border border-dashed border-white/15 p-8 text-center">
      <div className="text-lg font-semibold">{title}</div>
      <div className="mt-2 text-sm text-white/45">{body}</div>
    </div>
  );
}
