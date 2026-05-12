"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Role = "brand" | "influencer";
type Tab = "marketplace" | "dashboard" | "messages" | "profile";
type ApplicationStatus = "pending" | "accepted" | "rejected";

type DemoUser = {
  id: string;
  role: Role;
  name: string;
  email: string;
  companyName: string;
  niche: string;
  bio: string;
  followerCount?: number;
  engagementRate?: number;
  subscriptionTier: "free" | "basic" | "pro";
};

type DemoCampaign = {
  id: string;
  brandId: string;
  title: string;
  description: string;
  category: string;
  budgetMin: number;
  budgetMax: number;
  timeline: string;
  deliverables: string;
  status: "open" | "reviewing" | "completed";
};

type DemoApplication = {
  id: string;
  campaignId: string;
  brandId: string;
  influencerId: string;
  pitch: string;
  proposedFee: number;
  status: ApplicationStatus;
};

type DemoConversation = {
  id: string;
  participantIds: [string, string];
  campaignId?: string;
};

type DemoMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: number;
};

type DemoState = {
  users: DemoUser[];
  campaigns: DemoCampaign[];
  applications: DemoApplication[];
  conversations: DemoConversation[];
  messages: DemoMessage[];
};

const storageKey = "collabhub-demo-state-v1";

const initialState: DemoState = {
  users: [
    {
      id: "brand-glowhaus",
      role: "brand",
      name: "Maya Chen",
      email: "demo-brand@collabhub.test",
      companyName: "GlowHaus Labs",
      niche: "Beauty",
      bio: "Clean skincare brand launching creator-led campaigns for high-converting UGC.",
      subscriptionTier: "basic",
    },
    {
      id: "influencer-ava",
      role: "influencer",
      name: "Ava Kim",
      email: "demo-influencer@collabhub.test",
      companyName: "Ava Creates",
      niche: "Beauty",
      bio: "Beauty creator focused on skincare routines, GRWM content, and authentic product education.",
      followerCount: 84200,
      engagementRate: 4.8,
      subscriptionTier: "pro",
    },
  ],
  campaigns: [
    {
      id: "campaign-serum",
      brandId: "brand-glowhaus",
      title: "Vitamin C serum UGC launch",
      description:
        "Create a warm content package for a new vitamin C serum launch across reels and stories.",
      category: "Beauty",
      budgetMin: 900,
      budgetMax: 2400,
      timeline: "14 days",
      deliverables: "1 reel, 3 story frames, 5 raw clips",
      status: "open",
    },
    {
      id: "campaign-sunscreen",
      brandId: "brand-glowhaus",
      title: "Mineral sunscreen summer campaign",
      description:
        "Show everyday sunscreen use with natural light, texture shots, and honest narration.",
      category: "Lifestyle",
      budgetMin: 700,
      budgetMax: 1800,
      timeline: "10 days",
      deliverables: "2 TikTok videos, 3 stills",
      status: "open",
    },
  ],
  applications: [
    {
      id: "application-serum-ava",
      campaignId: "campaign-serum",
      brandId: "brand-glowhaus",
      influencerId: "influencer-ava",
      pitch:
        "I can create a GRWM reel, story sequence, and raw clips with product education and bright natural light.",
      proposedFee: 1500,
      status: "accepted",
    },
  ],
  conversations: [
    {
      id: "conversation-glowhaus-ava",
      participantIds: ["brand-glowhaus", "influencer-ava"],
      campaignId: "campaign-serum",
    },
  ],
  messages: [
    {
      id: "message-1",
      conversationId: "conversation-glowhaus-ava",
      senderId: "brand-glowhaus",
      body: "Thanks for the thoughtful pitch. We accepted your application for the serum launch.",
      createdAt: Date.now() - 120000,
    },
    {
      id: "message-2",
      conversationId: "conversation-glowhaus-ava",
      senderId: "influencer-ava",
      body: "Excited to collaborate. I can send the shot list and timeline today.",
      createdAt: Date.now() - 60000,
    },
  ],
};

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function loadDemoState() {
  if (typeof window === "undefined") return initialState;
  const stored = window.localStorage.getItem(storageKey);
  if (!stored) return initialState;
  try {
    return JSON.parse(stored) as DemoState;
  } catch {
    return initialState;
  }
}

export default function CollabHubDemoPage() {
  const [state, setState] = useState<DemoState>(() => loadDemoState());
  const [currentUserId, setCurrentUserId] = useState("brand-glowhaus");
  const [activeTab, setActiveTab] = useState<Tab>("marketplace");
  const [selectedConversationId, setSelectedConversationId] = useState("conversation-glowhaus-ava");
  const [notice, setNotice] = useState("Demo mode uses browser localStorage. No external setup required.");

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state]);

  const currentUser = state.users.find((user) => user.id === currentUserId) ?? state.users[0];
  const brands = state.users.filter((user) => user.role === "brand");
  const influencers = state.users.filter((user) => user.role === "influencer");
  const myCampaigns = state.campaigns.filter((campaign) => campaign.brandId === currentUser.id);
  const myApplications =
    currentUser.role === "brand"
      ? state.applications.filter((application) => application.brandId === currentUser.id)
      : state.applications.filter((application) => application.influencerId === currentUser.id);
  const conversations = state.conversations.filter((conversation) =>
    conversation.participantIds.includes(currentUser.id)
  );
  const selectedConversation = conversations.find((conversation) => conversation.id === selectedConversationId);
  const selectedMessages = state.messages.filter(
    (message) => message.conversationId === selectedConversation?.id
  );
  const stats = useMemo(
    () =>
      currentUser.role === "brand"
        ? [
            ["Campaigns", myCampaigns.length],
            ["Applications", myApplications.length],
            ["Creators", influencers.length],
          ]
        : [
            ["Applications", myApplications.length],
            ["Open campaigns", state.campaigns.length],
            ["Messages", conversations.length],
          ],
    [conversations.length, currentUser.role, influencers.length, myApplications.length, myCampaigns.length, state.campaigns.length]
  );

  function updateState(next: DemoState) {
    setState(next);
  }

  function resetDemo() {
    updateState(initialState);
    setCurrentUserId("brand-glowhaus");
    setSelectedConversationId("conversation-glowhaus-ava");
    setNotice("Demo data reset.");
  }

  function handleCreateCampaign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (currentUser.role !== "brand") return;
    const form = new FormData(event.currentTarget);
    const campaign: DemoCampaign = {
      id: makeId("campaign"),
      brandId: currentUser.id,
      title: String(form.get("title") ?? ""),
      description: String(form.get("description") ?? ""),
      category: String(form.get("category") ?? "Lifestyle"),
      budgetMin: Number(form.get("budgetMin") ?? 0),
      budgetMax: Number(form.get("budgetMax") ?? 0),
      timeline: String(form.get("timeline") ?? ""),
      deliverables: String(form.get("deliverables") ?? ""),
      status: "open",
    };
    updateState({ ...state, campaigns: [campaign, ...state.campaigns] });
    event.currentTarget.reset();
    setNotice("Demo campaign created.");
  }

  function handleApply(campaign: DemoCampaign) {
    if (currentUser.role !== "influencer") return;
    const existing = state.applications.find(
      (application) => application.campaignId === campaign.id && application.influencerId === currentUser.id
    );
    if (existing) {
      setNotice("You already applied to that campaign.");
      return;
    }
    const application: DemoApplication = {
      id: makeId("application"),
      campaignId: campaign.id,
      brandId: campaign.brandId,
      influencerId: currentUser.id,
      pitch: `I am a strong fit for ${campaign.title} and can deliver ${campaign.deliverables}.`,
      proposedFee: Math.round((campaign.budgetMin + campaign.budgetMax) / 2),
      status: "pending",
    };
    const nextConversation =
      findConversation(state.conversations, campaign.brandId, currentUser.id) ?? {
        id: makeId("conversation"),
        participantIds: [campaign.brandId, currentUser.id] as [string, string],
        campaignId: campaign.id,
      };
    updateState({
      ...state,
      applications: [application, ...state.applications],
      conversations: state.conversations.some((conversation) => conversation.id === nextConversation.id)
        ? state.conversations
        : [nextConversation, ...state.conversations],
    });
    setSelectedConversationId(nextConversation.id);
    setActiveTab("dashboard");
    setNotice("Demo application submitted and conversation opened.");
  }

  function handleReview(applicationId: string, status: ApplicationStatus) {
    updateState({
      ...state,
      applications: state.applications.map((application) =>
        application.id === applicationId ? { ...application, status } : application
      ),
    });
    setNotice(`Application marked ${status}.`);
  }

  function findConversation(conversationsToCheck: DemoConversation[], userA: string, userB: string) {
    return conversationsToCheck.find((conversation) =>
      conversation.participantIds.includes(userA) && conversation.participantIds.includes(userB)
    );
  }

  function openConversation(otherUserId: string, campaignId?: string) {
    const conversation =
      findConversation(state.conversations, currentUser.id, otherUserId) ?? {
        id: makeId("conversation"),
        participantIds: [currentUser.id, otherUserId] as [string, string],
        campaignId,
      };
    updateState({
      ...state,
      conversations: state.conversations.some((item) => item.id === conversation.id)
        ? state.conversations
        : [conversation, ...state.conversations],
    });
    setSelectedConversationId(conversation.id);
    setActiveTab("messages");
  }

  function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedConversation) return;
    const form = new FormData(event.currentTarget);
    const body = String(form.get("body") ?? "").trim();
    if (!body) return;
    updateState({
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

  function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    updateState({
      ...state,
      users: state.users.map((user) =>
        user.id === currentUser.id
          ? {
              ...user,
              name: String(form.get("name") ?? user.name),
              companyName: String(form.get("companyName") ?? user.companyName),
              niche: String(form.get("niche") ?? user.niche),
              bio: String(form.get("bio") ?? user.bio),
              followerCount: Number(form.get("followerCount") ?? user.followerCount ?? 0) || undefined,
              engagementRate: Number(form.get("engagementRate") ?? user.engagementRate ?? 0) || undefined,
            }
          : user
      ),
    });
    setNotice("Demo profile updated.");
  }

  return (
    <main className="min-h-screen bg-[#08080A] px-5 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link href="/" className="text-sm font-semibold uppercase tracking-[0.24em] text-white/45">
              CollabHub demo
            </Link>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">
              Test the web app now
            </h1>
            <p className="mt-3 max-w-2xl text-white/58">
              This route runs entirely in your browser with localStorage, so you can test the full
              brand/influencer workflow before connecting real services.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className="rounded-full border border-white/15 px-5 py-3 text-sm font-bold" href="/collabhub/test">
              Setup test center
            </Link>
            <button className="rounded-full bg-white px-5 py-3 text-sm font-bold text-[#101014]" onClick={resetDemo} type="button">
              Reset demo
            </button>
          </div>
        </header>

        <section className="mt-6 grid gap-4 rounded-[2rem] border border-white/10 bg-white/[0.05] p-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="text-sm text-white/45">Current demo account</div>
            <div className="mt-1 text-2xl font-semibold">{currentUser.name}</div>
            <div className="mt-1 text-sm capitalize text-[#80FFB0]">
              {currentUser.role} / {currentUser.subscriptionTier}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {[...brands, ...influencers].map((user) => (
              <button
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  currentUser.id === user.id ? "bg-white text-[#101014]" : "bg-white/[0.08] text-white/65"
                }`}
                key={user.id}
                onClick={() => {
                  setCurrentUserId(user.id);
                  setNotice(`Switched to ${user.name}.`);
                }}
                type="button"
              >
                {user.role}: {user.name}
              </button>
            ))}
          </div>
        </section>

        {notice && (
          <div className="mt-5 rounded-2xl border border-[#80FFB0]/25 bg-[#80FFB0]/10 px-4 py-3 text-sm text-[#BFFFF0]">
            {notice}
          </div>
        )}

        <nav className="mt-8 flex flex-wrap gap-2">
          {[
            ["marketplace", "Marketplace"],
            ["dashboard", "Dashboard"],
            ["messages", "Messages"],
            ["profile", "Profile"],
          ].map(([tab, label]) => (
            <button
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                activeTab === tab ? "bg-white text-[#101014]" : "bg-white/[0.08] text-white/65"
              }`}
              key={tab}
              onClick={() => setActiveTab(tab as Tab)}
              type="button"
            >
              {label}
            </button>
          ))}
        </nav>

        {activeTab === "marketplace" && (
          <Marketplace
            campaigns={state.campaigns}
            currentUser={currentUser}
            applications={state.applications}
            users={state.users}
            onApply={handleApply}
            onOpenConversation={openConversation}
          />
        )}
        {activeTab === "dashboard" && (
          <Dashboard
            applications={myApplications}
            campaigns={myCampaigns}
            currentUser={currentUser}
            stats={stats}
            users={state.users}
            allCampaigns={state.campaigns}
            onCreateCampaign={handleCreateCampaign}
            onOpenConversation={openConversation}
            onReview={handleReview}
          />
        )}
        {activeTab === "messages" && (
          <Messages
            conversations={conversations}
            currentUser={currentUser}
            messages={selectedMessages}
            selectedConversationId={selectedConversationId}
            users={state.users}
            campaigns={state.campaigns}
            onSelect={setSelectedConversationId}
            onSend={handleSendMessage}
          />
        )}
        {activeTab === "profile" && <Profile currentUser={currentUser} onUpdate={updateProfile} />}
      </div>
    </main>
  );
}

function Marketplace({
  applications,
  campaigns,
  currentUser,
  onApply,
  onOpenConversation,
  users,
}: {
  applications: DemoApplication[];
  campaigns: DemoCampaign[];
  currentUser: DemoUser;
  onApply: (campaign: DemoCampaign) => void;
  onOpenConversation: (otherUserId: string, campaignId?: string) => void;
  users: DemoUser[];
}) {
  return (
    <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div>
        <SectionHeader eyebrow="Marketplace" title="Open campaigns" />
        <div className="mt-5 grid gap-4">
          {campaigns.map((campaign) => {
            const brand = users.find((user) => user.id === campaign.brandId);
            const applied = applications.some(
              (application) => application.campaignId === campaign.id && application.influencerId === currentUser.id
            );
            return (
              <article className="rounded-[2rem] border border-white/10 bg-[#111116] p-5" key={campaign.id}>
                <div className="flex flex-col justify-between gap-4 md:flex-row">
                  <div>
                    <div className="text-sm text-white/45">
                      {brand?.companyName} / {campaign.category}
                    </div>
                    <h3 className="mt-1 text-2xl font-semibold">{campaign.title}</h3>
                    <p className="mt-3 text-white/62">{campaign.description}</p>
                  </div>
                  <div className="rounded-3xl bg-white/[0.06] p-4 text-sm">
                    <div className="text-white/45">Budget</div>
                    <div className="font-semibold text-[#80FFB0]">
                      ${campaign.budgetMin} - ${campaign.budgetMax}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/56">
                  <span className="rounded-full bg-white/[0.07] px-3 py-1">{campaign.timeline}</span>
                  <span className="rounded-full bg-white/[0.07] px-3 py-1">{campaign.deliverables}</span>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  {currentUser.role === "influencer" && (
                    <button
                      className="rounded-full bg-white px-5 py-2 text-sm font-bold text-[#101014] disabled:bg-white/20 disabled:text-white/35"
                      disabled={applied}
                      onClick={() => onApply(campaign)}
                      type="button"
                    >
                      {applied ? "Applied" : "Apply"}
                    </button>
                  )}
                  {brand && brand.id !== currentUser.id && (
                    <button
                      className="rounded-full border border-white/15 px-5 py-2 text-sm font-bold"
                      onClick={() => onOpenConversation(brand.id, campaign.id)}
                      type="button"
                    >
                      Message brand
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
      <div>
        <SectionHeader eyebrow="Discovery" title="Influencers" />
        <div className="mt-5 grid gap-3">
          {users
            .filter((user) => user.role === "influencer")
            .map((user) => (
              <article className="rounded-3xl border border-white/10 bg-white/[0.05] p-4" key={user.id}>
                <div className="font-semibold">{user.name}</div>
                <div className="mt-1 text-sm text-white/45">{user.niche}</div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/58">
                  <span className="rounded-full bg-white/[0.07] px-2.5 py-1">
                    {(user.followerCount ?? 0).toLocaleString()} followers
                  </span>
                  <span className="rounded-full bg-white/[0.07] px-2.5 py-1">
                    {user.engagementRate ?? 0}% engagement
                  </span>
                </div>
                {currentUser.role === "brand" && (
                  <button
                    className="mt-4 rounded-full border border-white/15 px-4 py-2 text-sm"
                    onClick={() => onOpenConversation(user.id)}
                    type="button"
                  >
                    Message creator
                  </button>
                )}
              </article>
            ))}
        </div>
      </div>
    </section>
  );
}

function Dashboard({
  allCampaigns,
  applications,
  campaigns,
  currentUser,
  onCreateCampaign,
  onOpenConversation,
  onReview,
  stats,
  users,
}: {
  allCampaigns: DemoCampaign[];
  applications: DemoApplication[];
  campaigns: DemoCampaign[];
  currentUser: DemoUser;
  onCreateCampaign: (event: FormEvent<HTMLFormElement>) => void;
  onOpenConversation: (otherUserId: string, campaignId?: string) => void;
  onReview: (applicationId: string, status: ApplicationStatus) => void;
  stats: (string | number)[][];
  users: DemoUser[];
}) {
  return (
    <section className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <div>
        <SectionHeader eyebrow="Dashboard" title={currentUser.role === "brand" ? "Brand controls" : "Influencer pipeline"} />
        <div className="mt-5 grid grid-cols-3 gap-3">
          {stats.map(([label, value]) => (
            <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-4" key={label}>
              <div className="text-2xl font-semibold">{value}</div>
              <div className="mt-1 text-xs text-white/45">{label}</div>
            </div>
          ))}
        </div>
        {currentUser.role === "brand" && (
          <form className="mt-5 grid gap-3 rounded-[2rem] border border-white/10 bg-white/[0.05] p-5" onSubmit={onCreateCampaign}>
            <h3 className="text-xl font-semibold">Create demo campaign</h3>
            <Field label="Title" name="title" placeholder="New product launch" required />
            <Field label="Description" name="description" placeholder="What creators should make" required />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Category" name="category" placeholder="Beauty" required />
              <Field label="Timeline" name="timeline" placeholder="2 weeks" required />
              <Field label="Budget min" name="budgetMin" placeholder="500" required type="number" />
              <Field label="Budget max" name="budgetMax" placeholder="2000" required type="number" />
            </div>
            <Field label="Deliverables" name="deliverables" placeholder="1 reel, 3 stories" required />
            <button className="rounded-full bg-white px-5 py-3 font-bold text-[#101014]" type="submit">
              Create campaign
            </button>
          </form>
        )}
      </div>
      <div className="grid gap-5">
        {currentUser.role === "brand" && (
          <div className="rounded-[2rem] border border-white/10 bg-[#111116] p-5">
            <h3 className="text-xl font-semibold">Your campaigns</h3>
            <div className="mt-4 grid gap-3">
              {campaigns.map((campaign) => (
                <div className="rounded-2xl bg-white/[0.05] p-4" key={campaign.id}>
                  <div className="font-semibold">{campaign.title}</div>
                  <div className="mt-1 text-sm text-white/45">{campaign.status}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="rounded-[2rem] border border-white/10 bg-[#111116] p-5">
          <h3 className="text-xl font-semibold">
            {currentUser.role === "brand" ? "Applications" : "Your applications"}
          </h3>
          <div className="mt-4 grid gap-3">
            {applications.map((application) => {
              const campaign = allCampaigns.find((item) => item.id === application.campaignId);
              const influencer = users.find((user) => user.id === application.influencerId);
              const brand = users.find((user) => user.id === application.brandId);
              return (
                <article className="rounded-2xl bg-white/[0.05] p-4" key={application.id}>
                  <div className="flex flex-col justify-between gap-3 md:flex-row">
                    <div>
                      <div className="font-semibold">{campaign?.title}</div>
                      <div className="mt-1 text-sm text-white/45">
                        {currentUser.role === "brand" ? influencer?.name : brand?.companyName}
                      </div>
                      <p className="mt-3 text-sm text-white/62">{application.pitch}</p>
                    </div>
                    <div className="text-sm">
                      <div className="rounded-full bg-white/[0.08] px-3 py-1 text-center capitalize">
                        {application.status}
                      </div>
                      <div className="mt-2 text-center text-[#80FFB0]">${application.proposedFee}</div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {currentUser.role === "brand" && application.status === "pending" && (
                      <>
                        <button className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#101014]" onClick={() => onReview(application.id, "accepted")} type="button">
                          Accept
                        </button>
                        <button className="rounded-full border border-white/15 px-4 py-2 text-sm" onClick={() => onReview(application.id, "rejected")} type="button">
                          Reject
                        </button>
                      </>
                    )}
                    <button
                      className="rounded-full border border-white/15 px-4 py-2 text-sm"
                      onClick={() =>
                        onOpenConversation(
                          currentUser.role === "brand" ? application.influencerId : application.brandId,
                          application.campaignId
                        )
                      }
                      type="button"
                    >
                      Open conversation
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function Messages({
  campaigns,
  conversations,
  currentUser,
  messages,
  onSelect,
  onSend,
  selectedConversationId,
  users,
}: {
  campaigns: DemoCampaign[];
  conversations: DemoConversation[];
  currentUser: DemoUser;
  messages: DemoMessage[];
  onSelect: (conversationId: string) => void;
  onSend: (event: FormEvent<HTMLFormElement>) => void;
  selectedConversationId: string;
  users: DemoUser[];
}) {
  return (
    <section className="mt-8 grid gap-5 lg:grid-cols-[0.42fr_0.58fr]">
      <div className="rounded-[2rem] border border-white/10 bg-[#111116] p-5">
        <h2 className="text-2xl font-semibold">Conversations</h2>
        <div className="mt-4 grid gap-2">
          {conversations.map((conversation) => {
            const otherId = conversation.participantIds.find((id) => id !== currentUser.id);
            const other = users.find((user) => user.id === otherId);
            const campaign = campaigns.find((item) => item.id === conversation.campaignId);
            return (
              <button
                className={`rounded-2xl p-4 text-left ${
                  selectedConversationId === conversation.id ? "bg-white text-[#101014]" : "bg-white/[0.05]"
                }`}
                key={conversation.id}
                onClick={() => onSelect(conversation.id)}
                type="button"
              >
                <div className="font-semibold">{other?.name}</div>
                <div className={selectedConversationId === conversation.id ? "text-black/55" : "text-white/45"}>
                  {campaign?.title ?? "General conversation"}
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <div className="rounded-[2rem] border border-white/10 bg-[#111116] p-5">
        <div className="grid min-h-72 content-end gap-3">
          {messages.map((message) => (
            <div className={`flex ${message.senderId === currentUser.id ? "justify-end" : "justify-start"}`} key={message.id}>
              <div className={`max-w-[78%] rounded-3xl px-4 py-3 text-sm ${message.senderId === currentUser.id ? "bg-white text-[#101014]" : "bg-white/[0.08] text-white/72"}`}>
                {message.body}
              </div>
            </div>
          ))}
        </div>
        <form className="mt-5 flex gap-2" onSubmit={onSend}>
          <input className="flex-1 rounded-full border border-white/10 bg-[#08080A] px-4 py-3 text-white outline-none" name="body" placeholder="Write a demo message..." required />
          <button className="rounded-full bg-white px-5 py-3 font-bold text-[#101014]" type="submit">
            Send
          </button>
        </form>
      </div>
    </section>
  );
}

function Profile({ currentUser, onUpdate }: { currentUser: DemoUser; onUpdate: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <section className="mt-8 grid gap-6 lg:grid-cols-[0.62fr_0.38fr]">
      <form className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6" onSubmit={onUpdate}>
        <SectionHeader eyebrow="Profile" title="Edit demo profile" />
        <div className="mt-6 grid gap-3">
          <Field defaultValue={currentUser.name} label="Name" name="name" required />
          <Field defaultValue={currentUser.companyName} label="Company or creator brand" name="companyName" />
          <Field defaultValue={currentUser.niche} label="Niche" name="niche" />
          <label className="text-sm text-white/58">
            Bio
            <textarea className="mt-2 min-h-28 w-full rounded-2xl border border-white/10 bg-[#111116] px-4 py-3 text-white outline-none" defaultValue={currentUser.bio} name="bio" />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field defaultValue={currentUser.followerCount} label="Follower count" name="followerCount" type="number" />
            <Field defaultValue={currentUser.engagementRate} label="Engagement rate" name="engagementRate" type="number" />
          </div>
          <button className="rounded-full bg-white px-5 py-3 font-bold text-[#101014]" type="submit">
            Save demo profile
          </button>
        </div>
      </form>
      <div className="rounded-[2rem] border border-white/10 bg-[#111116] p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#80FFB0]">Billing demo</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] capitalize">
          {currentUser.subscriptionTier}
        </h2>
        <p className="mt-3 text-white/56">
          Production billing uses Stripe in the real `/collabhub` app. This demo keeps plan state as sample data.
        </p>
      </div>
    </section>
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
      <input className="mt-2 w-full rounded-2xl border border-white/10 bg-[#111116] px-4 py-3 text-white outline-none focus:border-white/30" defaultValue={defaultValue} name={name} placeholder={placeholder} required={required} type={type} />
    </label>
  );
}

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#FFB088]">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">{title}</h2>
    </div>
  );
}
