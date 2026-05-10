"use client";

import { FormEvent, Suspense, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";

type Role = "brand" | "influencer";
type Tab = "marketplace" | "dashboard" | "messages" | "profile";

const categories = ["Beauty", "Lifestyle", "Food", "Fitness", "Fashion", "Travel", "Gaming"];

export default function CollabHubAppPage() {
  return (
    <Suspense fallback={<CollabHubLoading />}>
      <CollabHubWorkspace />
    </Suspense>
  );
}

function CollabHubLoading() {
  return (
    <main className="min-h-screen bg-[#08080A] px-5 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-7xl rounded-[2rem] border border-white/10 bg-white/[0.05] p-8 text-white/60">
        Loading CollabHub...
      </div>
    </main>
  );
}

function CollabHubWorkspace() {
  const searchParams = useSearchParams();
  const [sessionUserId, setSessionUserId] = useState<Id<"collabUsers"> | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("marketplace");
  const [selectedConversationId, setSelectedConversationId] =
    useState<Id<"collabConversations"> | null>(null);
  const [applyingCampaignId, setApplyingCampaignId] = useState<Id<"collabCampaigns"> | null>(null);
  const [notice, setNotice] = useState("");

  const currentUser = useQuery(
    api.collabhub.getUser,
    sessionUserId ? { userId: sessionUserId } : "skip"
  );
  const loginLookup = useQuery(
    api.collabhub.getUserByEmail,
    loginEmail.includes("@") ? { email: loginEmail } : "skip"
  );
  const campaigns = useQuery(api.collabhub.listCampaigns, {
    currentUserId: sessionUserId ?? undefined,
  });
  const influencers = useQuery(api.collabhub.listInfluencers, {});
  const myCampaigns = useQuery(
    api.collabhub.listMyCampaigns,
    currentUser?.role === "brand" ? { brandId: currentUser._id } : "skip"
  );
  const brandApplications = useQuery(
    api.collabhub.listApplicationsForBrand,
    currentUser?.role === "brand" ? { brandId: currentUser._id } : "skip"
  );
  const influencerApplications = useQuery(
    api.collabhub.listApplicationsForInfluencer,
    currentUser?.role === "influencer" ? { influencerId: currentUser._id } : "skip"
  );
  const conversations = useQuery(
    api.collabhub.listConversations,
    sessionUserId ? { userId: sessionUserId } : "skip"
  );
  const messages = useQuery(
    api.collabhub.listMessages,
    sessionUserId && selectedConversationId
      ? { userId: sessionUserId, conversationId: selectedConversationId }
      : "skip"
  );

  const upsertUser = useMutation(api.collabhub.upsertUser);
  const updateProfile = useMutation(api.collabhub.updateProfile);
  const createCampaign = useMutation(api.collabhub.createCampaign);
  const applyToCampaign = useMutation(api.collabhub.applyToCampaign);
  const updateApplicationStatus = useMutation(api.collabhub.updateApplicationStatus);
  const getOrCreateConversation = useMutation(api.collabhub.getOrCreateConversation);
  const sendMessage = useMutation(api.collabhub.sendMessage);

  const applications = currentUser?.role === "brand" ? brandApplications : influencerApplications;
  const selectedConversation = conversations?.find((item) => item._id === selectedConversationId);
  const billingStatus = searchParams.get("billing");

  const dashboardStats = useMemo(() => {
    if (currentUser?.role === "brand") {
      return [
        { label: "Campaigns", value: String(myCampaigns?.length ?? 0) },
        { label: "Applications", value: String(brandApplications?.length ?? 0) },
        { label: "Conversations", value: String(conversations?.length ?? 0) },
      ];
    }
    return [
      { label: "Applications", value: String(influencerApplications?.length ?? 0) },
      { label: "Open campaigns", value: String(campaigns?.length ?? 0) },
      { label: "Conversations", value: String(conversations?.length ?? 0) },
    ];
  }, [brandApplications, campaigns, conversations, currentUser, influencerApplications, myCampaigns]);

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const role = String(form.get("role") ?? "influencer") as Role;
    const userId = await upsertUser({
      email: String(form.get("email") ?? ""),
      name: String(form.get("name") ?? ""),
      role,
      companyName: String(form.get("companyName") ?? "") || undefined,
      niche: String(form.get("niche") ?? "") || undefined,
    });
    setSessionUserId(userId);
    setNotice("Account ready. You can now manage CollabHub data.");
  }

  function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!loginLookup) {
      setNotice("No CollabHub account found for that email yet.");
      return;
    }
    setSessionUserId(loginLookup._id);
    setNotice(`Welcome back, ${loginLookup.name}.`);
  }

  async function handleCreateCampaign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentUser || currentUser.role !== "brand") return;
    const form = new FormData(event.currentTarget);
    await createCampaign({
      brandId: currentUser._id,
      title: String(form.get("title") ?? ""),
      description: String(form.get("description") ?? ""),
      category: String(form.get("category") ?? "Lifestyle"),
      budgetMin: Number(form.get("budgetMin") ?? 0),
      budgetMax: Number(form.get("budgetMax") ?? 0),
      timeline: String(form.get("timeline") ?? ""),
      deliverables: String(form.get("deliverables") ?? ""),
      requiredFollowers: Number(form.get("requiredFollowers") ?? 0) || undefined,
    });
    event.currentTarget.reset();
    setNotice("Campaign posted to the marketplace.");
  }

  async function handleApply(event: FormEvent<HTMLFormElement>, campaignId: Id<"collabCampaigns">) {
    event.preventDefault();
    if (!currentUser || currentUser.role !== "influencer") return;
    const form = new FormData(event.currentTarget);
    await applyToCampaign({
      campaignId,
      influencerId: currentUser._id,
      pitch: String(form.get("pitch") ?? ""),
      proposedFee: Number(form.get("proposedFee") ?? 0),
      portfolioUrl: String(form.get("portfolioUrl") ?? "") || undefined,
    });
    setApplyingCampaignId(null);
    setActiveTab("dashboard");
    setNotice("Application sent. A conversation was opened with the brand.");
  }

  async function handleProfileUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentUser) return;
    const form = new FormData(event.currentTarget);
    await updateProfile({
      userId: currentUser._id,
      name: String(form.get("name") ?? ""),
      companyName: String(form.get("companyName") ?? "") || undefined,
      bio: String(form.get("bio") ?? "") || undefined,
      niche: String(form.get("niche") ?? "") || undefined,
      websiteUrl: String(form.get("websiteUrl") ?? "") || undefined,
      location: String(form.get("location") ?? "") || undefined,
      followerCount: Number(form.get("followerCount") ?? 0) || undefined,
      engagementRate: Number(form.get("engagementRate") ?? 0) || undefined,
    });
    setNotice("Profile updated.");
  }

  async function handleStartCheckout(tier: "basic" | "pro") {
    if (!currentUser) return;
    const response = await fetch("/api/collabhub/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: currentUser._id,
        email: currentUser.email,
        name: currentUser.name,
        tier,
        stripeCustomerId: currentUser.stripeCustomerId,
      }),
    });
    const result = (await response.json()) as { url?: string; error?: string };
    if (!response.ok || !result.url) {
      setNotice(result.error ?? "Unable to start checkout. Check Stripe environment variables.");
      return;
    }
    window.location.assign(result.url);
  }

  async function handleOpenBillingPortal() {
    if (!currentUser?.stripeCustomerId) {
      setNotice("No Stripe customer exists yet. Upgrade first to create a billing account.");
      return;
    }
    const response = await fetch("/api/collabhub/billing/portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stripeCustomerId: currentUser.stripeCustomerId }),
    });
    const result = (await response.json()) as { url?: string; error?: string };
    if (!response.ok || !result.url) {
      setNotice(result.error ?? "Unable to open billing portal.");
      return;
    }
    window.location.assign(result.url);
  }

  async function handleOpenConversation(otherUserId: Id<"collabUsers">, campaignId?: Id<"collabCampaigns">) {
    if (!currentUser) return;
    const conversationId = await getOrCreateConversation({
      userId: currentUser._id,
      otherUserId,
      campaignId,
    });
    setSelectedConversationId(conversationId);
    setActiveTab("messages");
  }

  async function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentUser || !selectedConversationId) return;
    const form = new FormData(event.currentTarget);
    await sendMessage({
      conversationId: selectedConversationId,
      senderId: currentUser._id,
      body: String(form.get("body") ?? ""),
    });
    event.currentTarget.reset();
  }

  return (
    <main className="min-h-screen bg-[#08080A] px-5 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link href="/" className="text-sm font-semibold uppercase tracking-[0.24em] text-white/45">
              CollabHub
            </Link>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">
              Collaboration workspace
            </h1>
            <p className="mt-3 max-w-2xl text-white/58">
              Create an account, post campaigns, apply as an influencer, review applicants,
              and message partners with live Convex data.
            </p>
          </div>
          {currentUser && (
            <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-4 text-sm">
              <div className="text-white/48">Signed in as</div>
              <div className="mt-1 font-semibold">{currentUser.name}</div>
              <div className="mt-1 capitalize text-[#80FFB0]">
                {currentUser.role} / {currentUser.subscriptionTier}
              </div>
              <button
                className="mt-4 rounded-full border border-white/15 px-4 py-2 text-white/70"
                onClick={() => setSessionUserId(null)}
                type="button"
              >
                Sign out
              </button>
            </div>
          )}
        </header>

        {notice && (
          <div className="mt-6 rounded-2xl border border-[#80FFB0]/25 bg-[#80FFB0]/10 px-4 py-3 text-sm text-[#BFFFF0]">
            {notice}
          </div>
        )}
        {billingStatus && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white/70">
            {billingStatus === "success"
              ? "Checkout completed. Stripe will update your tier after the webhook runs."
              : billingStatus === "cancelled"
                ? "Checkout was cancelled. You can upgrade any time."
                : "Returned from the billing portal."}
          </div>
        )}

        {!currentUser ? (
          <AuthPanels
            loginEmail={loginEmail}
            onLoginEmailChange={setLoginEmail}
            onLogin={handleLogin}
            onRegister={handleRegister}
          />
        ) : (
          <>
            <nav className="mt-8 flex flex-wrap gap-2">
              {[
                ["marketplace", "Marketplace"],
                ["dashboard", "Dashboard"],
                ["messages", "Messages"],
                ["profile", "Profile"],
              ].map(([tab, label]) => (
                <button
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    activeTab === tab ? "bg-white text-[#101014]" : "bg-white/8 text-white/64 hover:text-white"
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
              <MarketplacePanel
                applyingCampaignId={applyingCampaignId}
                campaigns={campaigns}
                currentUser={currentUser}
                influencers={influencers}
                onApply={handleApply}
                onOpenConversation={handleOpenConversation}
                onSetApplyingCampaignId={setApplyingCampaignId}
              />
            )}
            {activeTab === "dashboard" && (
              <DashboardPanel
                applications={applications}
                currentUser={currentUser}
                dashboardStats={dashboardStats}
                myCampaigns={myCampaigns}
                onCreateCampaign={handleCreateCampaign}
                onOpenConversation={handleOpenConversation}
                onUpdateApplicationStatus={async (applicationId, status) => {
                  if (currentUser.role !== "brand") return;
                  await updateApplicationStatus({ applicationId, brandId: currentUser._id, status });
                  setNotice(`Application marked ${status}.`);
                }}
              />
            )}
            {activeTab === "messages" && (
              <MessagesPanel
                conversations={conversations}
                currentUser={currentUser}
                messages={messages}
                onSelectConversation={setSelectedConversationId}
                onSendMessage={handleSendMessage}
                selectedConversation={selectedConversation}
                selectedConversationId={selectedConversationId}
              />
            )}
            {activeTab === "profile" && (
              <ProfilePanel
                currentUser={currentUser}
                onOpenBillingPortal={handleOpenBillingPortal}
                onProfileUpdate={handleProfileUpdate}
                onStartCheckout={handleStartCheckout}
              />
            )}
          </>
        )}
      </div>
    </main>
  );
}

function AuthPanels({
  loginEmail,
  onLoginEmailChange,
  onLogin,
  onRegister,
}: {
  loginEmail: string;
  onLoginEmailChange: (value: string) => void;
  onLogin: (event: FormEvent<HTMLFormElement>) => void;
  onRegister: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <section className="mt-10 grid gap-5 lg:grid-cols-2">
      <form className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6" onSubmit={onRegister}>
        <h2 className="text-2xl font-semibold">Create brand or influencer account</h2>
        <div className="mt-6 grid gap-3">
          <Field label="Name" name="name" placeholder="Ava Kim" required />
          <Field label="Email" name="email" placeholder="ava@example.com" required type="email" />
          <label className="text-sm text-white/58">
            Account type
            <select className="mt-2 w-full rounded-2xl border border-white/10 bg-[#111116] px-4 py-3 text-white" name="role">
              <option value="influencer">Influencer</option>
              <option value="brand">Brand</option>
            </select>
          </label>
          <Field label="Company or creator brand" name="companyName" placeholder="GlowHaus or Ava Creates" />
          <Field label="Niche" name="niche" placeholder="Beauty, fitness, food..." />
          <button className="mt-2 rounded-full bg-white px-5 py-3 font-bold text-[#101014]" type="submit">
            Create account
          </button>
        </div>
      </form>

      <form className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6" onSubmit={onLogin}>
        <h2 className="text-2xl font-semibold">Log in by email</h2>
        <p className="mt-2 text-sm text-white/56">
          This MVP uses a lightweight email session while full password/social auth is added.
        </p>
        <div className="mt-6 grid gap-3">
          <label className="text-sm text-white/58">
            Email
            <input
              className="mt-2 w-full rounded-2xl border border-white/10 bg-[#111116] px-4 py-3 text-white outline-none focus:border-white/30"
              onChange={(event) => onLoginEmailChange(event.target.value)}
              placeholder="you@example.com"
              type="email"
              value={loginEmail}
            />
          </label>
          <button className="rounded-full border border-white/15 px-5 py-3 font-bold text-white" type="submit">
            Log in
          </button>
        </div>
      </form>
    </section>
  );
}

function MarketplacePanel({
  applyingCampaignId,
  campaigns,
  currentUser,
  influencers,
  onApply,
  onOpenConversation,
  onSetApplyingCampaignId,
}: {
  applyingCampaignId: Id<"collabCampaigns"> | null;
  campaigns: CampaignWithBrand[] | undefined;
  currentUser: Doc<"collabUsers">;
  influencers: Doc<"collabUsers">[] | undefined;
  onApply: (event: FormEvent<HTMLFormElement>, campaignId: Id<"collabCampaigns">) => Promise<void>;
  onOpenConversation: (otherUserId: Id<"collabUsers">, campaignId?: Id<"collabCampaigns">) => Promise<void>;
  onSetApplyingCampaignId: (campaignId: Id<"collabCampaigns"> | null) => void;
}) {
  return (
    <section className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
      <div>
        <SectionHeader
          eyebrow="Campaign marketplace"
          title="Browse open briefs and apply with a tailored pitch."
        />
        <div className="mt-5 grid gap-4">
          {(campaigns ?? []).map((campaign) => (
            <article className="rounded-[2rem] border border-white/10 bg-[#111116] p-5" key={campaign._id}>
              <div className="flex flex-col justify-between gap-4 md:flex-row">
                <div>
                  <div className="text-sm text-white/45">
                    {campaign.brand?.companyName || campaign.brand?.name || "Brand"} / {campaign.category}
                  </div>
                  <h3 className="mt-1 text-2xl font-semibold">{campaign.title}</h3>
                  <p className="mt-3 text-white/62">{campaign.description}</p>
                </div>
                <div className="min-w-36 rounded-3xl bg-white/[0.06] p-4">
                  <div className="text-sm text-white/45">Budget</div>
                  <div className="mt-1 font-semibold text-[#80FFB0]">
                    ${campaign.budgetMin} - ${campaign.budgetMax}
                  </div>
                  <div className="mt-3 text-sm text-white/45">{campaign.applicationsCount} applications</div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/56">
                <span className="rounded-full bg-white/[0.07] px-3 py-1">{campaign.timeline}</span>
                <span className="rounded-full bg-white/[0.07] px-3 py-1">{campaign.deliverables}</span>
                {campaign.requiredFollowers ? (
                  <span className="rounded-full bg-white/[0.07] px-3 py-1">
                    {campaign.requiredFollowers.toLocaleString()}+ followers
                  </span>
                ) : null}
              </div>

              {currentUser.role === "influencer" && (
                <div className="mt-5">
                  {campaign.existingApplication ? (
                    <div className="rounded-2xl bg-[#80FFB0]/10 px-4 py-3 text-sm text-[#BFFFF0]">
                      Applied: {campaign.existingApplication.status}
                    </div>
                  ) : applyingCampaignId === campaign._id ? (
                    <form className="grid gap-3 rounded-2xl bg-white/[0.05] p-4" onSubmit={(event) => onApply(event, campaign._id)}>
                      <textarea
                        className="min-h-28 rounded-2xl border border-white/10 bg-[#08080A] px-4 py-3 text-white outline-none"
                        name="pitch"
                        placeholder="Explain why you are a strong fit..."
                        required
                      />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Proposed fee" name="proposedFee" placeholder="1200" required type="number" />
                        <Field label="Portfolio URL" name="portfolioUrl" placeholder="https://..." />
                      </div>
                      <div className="flex gap-2">
                        <button className="rounded-full bg-white px-5 py-2 font-bold text-[#101014]" type="submit">
                          Send application
                        </button>
                        <button
                          className="rounded-full border border-white/15 px-5 py-2"
                          onClick={() => onSetApplyingCampaignId(null)}
                          type="button"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      className="rounded-full bg-white px-5 py-2 font-bold text-[#101014]"
                      onClick={() => onSetApplyingCampaignId(campaign._id)}
                      type="button"
                    >
                      Apply to campaign
                    </button>
                  )}
                </div>
              )}
              {currentUser.role === "brand" && campaign.brandId !== currentUser._id && campaign.brand && (
                <button
                  className="mt-5 rounded-full border border-white/15 px-5 py-2"
                  onClick={() => onOpenConversation(campaign.brandId, campaign._id)}
                  type="button"
                >
                  Message brand
                </button>
              )}
            </article>
          ))}
          {campaigns?.length === 0 && <EmptyState message="No open campaigns yet. Brand accounts can post the first one." />}
        </div>
      </div>
      <aside>
        <SectionHeader eyebrow="Creator discovery" title="Influencer profiles" />
        <div className="mt-5 grid gap-3">
          {(influencers ?? []).slice(0, 8).map((influencer) => (
            <article className="rounded-3xl border border-white/10 bg-white/[0.05] p-4" key={influencer._id}>
              <div className="font-semibold">{influencer.name}</div>
              <div className="mt-1 text-sm text-white/45">{influencer.niche || "General creator"}</div>
              <div className="mt-3 flex gap-2 text-xs text-white/58">
                <span className="rounded-full bg-white/[0.07] px-2.5 py-1">
                  {(influencer.followerCount ?? 0).toLocaleString()} followers
                </span>
                <span className="rounded-full bg-white/[0.07] px-2.5 py-1">
                  {influencer.engagementRate ?? 0}% engagement
                </span>
              </div>
              {currentUser.role === "brand" && (
                <button
                  className="mt-4 rounded-full border border-white/15 px-4 py-2 text-sm"
                  onClick={() => onOpenConversation(influencer._id)}
                  type="button"
                >
                  Message creator
                </button>
              )}
            </article>
          ))}
          {influencers?.length === 0 && <EmptyState message="No influencer profiles yet." />}
        </div>
      </aside>
    </section>
  );
}

function DashboardPanel({
  applications,
  currentUser,
  dashboardStats,
  myCampaigns,
  onCreateCampaign,
  onOpenConversation,
  onUpdateApplicationStatus,
}: {
  applications: ApplicationWithRelations[] | undefined;
  currentUser: Doc<"collabUsers">;
  dashboardStats: { label: string; value: string }[];
  myCampaigns: Doc<"collabCampaigns">[] | undefined;
  onCreateCampaign: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onOpenConversation: (otherUserId: Id<"collabUsers">, campaignId?: Id<"collabCampaigns">) => Promise<void>;
  onUpdateApplicationStatus: (
    applicationId: Id<"collabApplications">,
    status: "accepted" | "rejected"
  ) => Promise<void>;
}) {
  return (
    <section className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <div>
        <SectionHeader eyebrow="Dashboard" title={currentUser.role === "brand" ? "Brand command center" : "Influencer pipeline"} />
        <div className="mt-5 grid grid-cols-3 gap-3">
          {dashboardStats.map((stat) => (
            <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-4" key={stat.label}>
              <div className="text-2xl font-semibold">{stat.value}</div>
              <div className="mt-1 text-xs text-white/45">{stat.label}</div>
            </div>
          ))}
        </div>

        {currentUser.role === "brand" && (
          <form className="mt-5 grid gap-3 rounded-[2rem] border border-white/10 bg-white/[0.05] p-5" onSubmit={onCreateCampaign}>
            <h3 className="text-xl font-semibold">Post a campaign</h3>
            <Field label="Title" name="title" placeholder="Skincare launch videos" required />
            <label className="text-sm text-white/58">
              Category
              <select className="mt-2 w-full rounded-2xl border border-white/10 bg-[#111116] px-4 py-3 text-white" name="category">
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <textarea
              className="min-h-28 rounded-2xl border border-white/10 bg-[#111116] px-4 py-3 text-white outline-none"
              name="description"
              placeholder="Campaign description"
              required
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Budget min" name="budgetMin" placeholder="500" required type="number" />
              <Field label="Budget max" name="budgetMax" placeholder="2500" required type="number" />
            </div>
            <Field label="Timeline" name="timeline" placeholder="2 weeks" required />
            <Field label="Deliverables" name="deliverables" placeholder="1 reel, 3 stories" required />
            <Field label="Required followers" name="requiredFollowers" placeholder="10000" type="number" />
            <button className="rounded-full bg-white px-5 py-3 font-bold text-[#101014]" type="submit">
              Post campaign
            </button>
          </form>
        )}
      </div>

      <div className="grid gap-5">
        {currentUser.role === "brand" && (
          <div className="rounded-[2rem] border border-white/10 bg-[#111116] p-5">
            <h3 className="text-xl font-semibold">Your campaigns</h3>
            <div className="mt-4 grid gap-3">
              {(myCampaigns ?? []).map((campaign) => (
                <div className="rounded-2xl bg-white/[0.05] p-4" key={campaign._id}>
                  <div className="font-semibold">{campaign.title}</div>
                  <div className="mt-1 text-sm text-white/45">
                    {campaign.status} / {campaign.applicationsCount} applications
                  </div>
                </div>
              ))}
              {myCampaigns?.length === 0 && <EmptyState message="Post your first campaign to start collecting applications." />}
            </div>
          </div>
        )}

        <div className="rounded-[2rem] border border-white/10 bg-[#111116] p-5">
          <h3 className="text-xl font-semibold">
            {currentUser.role === "brand" ? "Applications to review" : "Your applications"}
          </h3>
          <div className="mt-4 grid gap-3">
            {(applications ?? []).map((application) => (
              <article className="rounded-2xl bg-white/[0.05] p-4" key={application._id}>
                <div className="flex flex-col justify-between gap-3 md:flex-row">
                  <div>
                    <div className="font-semibold">{application.campaign?.title ?? "Campaign"}</div>
                    <div className="mt-1 text-sm text-white/45">
                      {currentUser.role === "brand"
                        ? application.influencer?.name
                        : application.brand?.companyName || application.brand?.name}
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
                      <button
                        className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#101014]"
                        onClick={() => onUpdateApplicationStatus(application._id, "accepted")}
                        type="button"
                      >
                        Accept
                      </button>
                      <button
                        className="rounded-full border border-white/15 px-4 py-2 text-sm"
                        onClick={() => onUpdateApplicationStatus(application._id, "rejected")}
                        type="button"
                      >
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
            ))}
            {applications?.length === 0 && <EmptyState message="No applications yet." />}
          </div>
        </div>
      </div>
    </section>
  );
}

function MessagesPanel({
  conversations,
  currentUser,
  messages,
  onSelectConversation,
  onSendMessage,
  selectedConversation,
  selectedConversationId,
}: {
  conversations: ConversationWithRelations[] | undefined;
  currentUser: Doc<"collabUsers">;
  messages: Doc<"collabMessages">[] | undefined;
  onSelectConversation: (conversationId: Id<"collabConversations">) => void;
  onSendMessage: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  selectedConversation: ConversationWithRelations | undefined;
  selectedConversationId: Id<"collabConversations"> | null;
}) {
  return (
    <section className="mt-8 grid gap-5 lg:grid-cols-[0.42fr_0.58fr]">
      <div className="rounded-[2rem] border border-white/10 bg-[#111116] p-5">
        <h2 className="text-2xl font-semibold">Conversations</h2>
        <div className="mt-4 grid gap-2">
          {(conversations ?? []).map((conversation) => {
            const other =
              conversation.participantOneId === currentUser._id
                ? conversation.participantTwo
                : conversation.participantOne;
            return (
              <button
                className={`rounded-2xl p-4 text-left transition ${
                  selectedConversationId === conversation._id ? "bg-white text-[#101014]" : "bg-white/[0.05] hover:bg-white/[0.08]"
                }`}
                key={conversation._id}
                onClick={() => onSelectConversation(conversation._id)}
                type="button"
              >
                <div className="font-semibold">{other?.name ?? "Partner"}</div>
                <div className={selectedConversationId === conversation._id ? "text-black/55" : "text-white/45"}>
                  {conversation.campaign?.title ?? "General conversation"}
                </div>
                <div className={selectedConversationId === conversation._id ? "mt-2 text-sm text-black/55" : "mt-2 text-sm text-white/45"}>
                  {conversation.lastMessage ?? "No messages yet"}
                </div>
              </button>
            );
          })}
          {conversations?.length === 0 && <EmptyState message="Apply to a campaign or message a profile to start chatting." />}
        </div>
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-[#111116] p-5">
        {selectedConversation ? (
          <>
            <div className="border-b border-white/10 pb-4">
              <h2 className="text-2xl font-semibold">
                {selectedConversation.participantOneId === currentUser._id
                  ? selectedConversation.participantTwo?.name
                  : selectedConversation.participantOne?.name}
              </h2>
              <p className="mt-1 text-sm text-white/45">
                {selectedConversation.campaign?.title ?? "General conversation"}
              </p>
            </div>
            <div className="mt-5 grid min-h-72 content-end gap-3">
              {(messages ?? []).map((message) => (
                <div
                  className={`flex ${message.senderId === currentUser._id ? "justify-end" : "justify-start"}`}
                  key={message._id}
                >
                  <div
                    className={`max-w-[78%] rounded-3xl px-4 py-3 text-sm ${
                      message.senderId === currentUser._id ? "bg-white text-[#101014]" : "bg-white/[0.08] text-white/72"
                    }`}
                  >
                    {message.body}
                  </div>
                </div>
              ))}
            </div>
            <form className="mt-5 flex gap-2" onSubmit={onSendMessage}>
              <input
                className="flex-1 rounded-full border border-white/10 bg-[#08080A] px-4 py-3 text-white outline-none"
                name="body"
                placeholder="Write a message..."
                required
              />
              <button className="rounded-full bg-white px-5 py-3 font-bold text-[#101014]" type="submit">
                Send
              </button>
            </form>
          </>
        ) : (
          <EmptyState message="Select a conversation to view messages." />
        )}
      </div>
    </section>
  );
}

function ProfilePanel({
  currentUser,
  onOpenBillingPortal,
  onProfileUpdate,
  onStartCheckout,
}: {
  currentUser: Doc<"collabUsers">;
  onOpenBillingPortal: () => Promise<void>;
  onProfileUpdate: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onStartCheckout: (tier: "basic" | "pro") => Promise<void>;
}) {
  return (
    <section className="mt-8 grid gap-6 lg:grid-cols-[0.62fr_0.38fr]">
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6">
        <SectionHeader eyebrow="Profile" title="Keep your marketplace profile current." />
        <form className="mt-6 grid gap-3" onSubmit={onProfileUpdate}>
          <Field defaultValue={currentUser.name} label="Name" name="name" required />
          <Field defaultValue={currentUser.companyName} label="Company or creator brand" name="companyName" />
          <label className="text-sm text-white/58">
            Bio
            <textarea
              className="mt-2 min-h-28 w-full rounded-2xl border border-white/10 bg-[#111116] px-4 py-3 text-white outline-none"
              defaultValue={currentUser.bio}
              name="bio"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field defaultValue={currentUser.niche} label="Niche" name="niche" />
            <Field defaultValue={currentUser.location} label="Location" name="location" />
            <Field defaultValue={currentUser.websiteUrl} label="Website" name="websiteUrl" />
            <Field defaultValue={currentUser.followerCount} label="Follower count" name="followerCount" type="number" />
            <Field defaultValue={currentUser.engagementRate} label="Engagement rate" name="engagementRate" type="number" />
          </div>
          <button className="rounded-full bg-white px-5 py-3 font-bold text-[#101014]" type="submit">
            Save profile
          </button>
        </form>
      </div>

      <BillingPanel
        currentUser={currentUser}
        onOpenBillingPortal={onOpenBillingPortal}
        onStartCheckout={onStartCheckout}
      />
    </section>
  );
}

function BillingPanel({
  currentUser,
  onOpenBillingPortal,
  onStartCheckout,
}: {
  currentUser: Doc<"collabUsers">;
  onOpenBillingPortal: () => Promise<void>;
  onStartCheckout: (tier: "basic" | "pro") => Promise<void>;
}) {
  const plans = [
    {
      tier: "basic" as const,
      name: "Basic",
      price: "$9.99/mo",
      description: currentUser.role === "brand" ? "Post campaigns and manage up to 10 conversations." : "Apply without limits and unlock portfolio visibility.",
    },
    {
      tier: "pro" as const,
      name: "Pro",
      price: "$29.99/mo",
      description: "Unlimited messaging, featured placement, contract templates, and priority support.",
    },
  ];

  return (
    <aside className="rounded-[2rem] border border-white/10 bg-[#111116] p-6">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#80FFB0]">Billing</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Subscription</h2>
      <div className="mt-5 rounded-3xl bg-white/[0.06] p-4">
        <div className="text-sm text-white/45">Current plan</div>
        <div className="mt-1 text-2xl font-semibold capitalize">{currentUser.subscriptionTier}</div>
        <div className="mt-1 text-sm text-white/45">
          Status: {currentUser.subscriptionStatus ?? "inactive"}
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {plans.map((plan) => (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4" key={plan.tier}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold">{plan.name}</div>
                <div className="mt-1 text-sm text-white/50">{plan.description}</div>
              </div>
              <div className="whitespace-nowrap text-sm font-semibold text-[#80FFB0]">{plan.price}</div>
            </div>
            <button
              className="mt-4 w-full rounded-full bg-white px-4 py-2 text-sm font-bold text-[#101014] disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/35"
              disabled={currentUser.subscriptionTier === plan.tier}
              onClick={() => onStartCheckout(plan.tier)}
              type="button"
            >
              {currentUser.subscriptionTier === plan.tier ? "Current plan" : `Upgrade to ${plan.name}`}
            </button>
          </div>
        ))}
      </div>

      <button
        className="mt-4 w-full rounded-full border border-white/15 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:text-white/35"
        disabled={!currentUser.stripeCustomerId}
        onClick={onOpenBillingPortal}
        type="button"
      >
        Manage billing
      </button>
      <p className="mt-3 text-xs leading-5 text-white/42">
        Requires Stripe env vars: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, and Basic/Pro price IDs.
      </p>
    </aside>
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
      <input
        className="mt-2 w-full rounded-2xl border border-white/10 bg-[#111116] px-4 py-3 text-white outline-none focus:border-white/30"
        defaultValue={defaultValue}
        name={name}
        placeholder={placeholder}
        required={required}
        type={type}
      />
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

function EmptyState({ message }: { message: string }) {
  return <div className="rounded-2xl border border-dashed border-white/12 p-5 text-sm text-white/45">{message}</div>;
}

type CampaignWithBrand = Doc<"collabCampaigns"> & {
  brand: Doc<"collabUsers"> | null;
  existingApplication: Doc<"collabApplications"> | null;
};

type ApplicationWithRelations = Doc<"collabApplications"> & {
  campaign: Doc<"collabCampaigns"> | null;
  brand: Doc<"collabUsers"> | null;
  influencer: Doc<"collabUsers"> | null;
};

type ConversationWithRelations = Doc<"collabConversations"> & {
  participantOne: Doc<"collabUsers"> | null;
  participantTwo: Doc<"collabUsers"> | null;
  campaign: Doc<"collabCampaigns"> | null;
};
