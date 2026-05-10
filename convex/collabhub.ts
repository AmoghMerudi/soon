import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";

const roleValidator = v.union(v.literal("brand"), v.literal("influencer"));
const tierValidator = v.union(v.literal("free"), v.literal("basic"), v.literal("pro"));
const subscriptionStatusValidator = v.union(
  v.literal("inactive"),
  v.literal("active"),
  v.literal("trialing"),
  v.literal("past_due"),
  v.literal("cancelled")
);
const campaignStatusValidator = v.union(
  v.literal("open"),
  v.literal("reviewing"),
  v.literal("in_progress"),
  v.literal("completed"),
  v.literal("cancelled")
);
const applicationStatusValidator = v.union(
  v.literal("pending"),
  v.literal("accepted"),
  v.literal("rejected"),
  v.literal("withdrawn")
);

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function requireServerSecret(serverSecret: string) {
  const expected =
    process.env.COLLABHUB_AUTH_SECRET ??
    process.env.AUTH_SECRET ??
    (process.env.NODE_ENV === "production" ? undefined : "collabhub-dev-secret-change-me");
  if (!expected || serverSecret !== expected) {
    throw new ConvexError("unauthorized");
  }
}

function requireText(value: string, field: string) {
  const trimmed = value.trim();
  if (!trimmed) throw new ConvexError(`${field} is required`);
  return trimmed;
}

function pairKey(a: Id<"collabUsers">, b: Id<"collabUsers">) {
  return [a, b].sort().join(":");
}

function publicUser(user: Doc<"collabUsers"> | null) {
  if (!user) return null;
  const { passwordHash: _passwordHash, googleSub: _googleSub, appleSub: _appleSub, ...safeUser } = user;
  return safeUser;
}

async function getUserOrThrow(ctx: QueryCtx | MutationCtx, userId: Id<"collabUsers">) {
  const user = await ctx.db.get(userId);
  if (!user) throw new ConvexError("user not found");
  return user;
}

async function getCampaignOrThrow(ctx: QueryCtx | MutationCtx, campaignId: Id<"collabCampaigns">) {
  const campaign = await ctx.db.get(campaignId);
  if (!campaign) throw new ConvexError("campaign not found");
  return campaign;
}

async function getOrCreateConversationRecord(
  ctx: MutationCtx,
  participantA: Id<"collabUsers">,
  participantB: Id<"collabUsers">,
  campaignId?: Id<"collabCampaigns">
) {
  if (participantA === participantB) throw new ConvexError("conversation requires two users");
  const key = pairKey(participantA, participantB);
  const existing = await ctx.db
    .query("collabConversations")
    .withIndex("by_pair", (q) => q.eq("pairKey", key))
    .first();
  if (existing) return existing._id;

  const [participantOneId, participantTwoId] = [participantA, participantB].sort() as [
    Id<"collabUsers">,
    Id<"collabUsers">,
  ];
  const now = Date.now();
  return await ctx.db.insert("collabConversations", {
    participantOneId,
    participantTwoId,
    pairKey: key,
    campaignId,
    createdAt: now,
    updatedAt: now,
  });
}

export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const normalized = normalizeEmail(email);
    if (!normalized) return null;
    const user = await ctx.db
      .query("collabUsers")
      .withIndex("by_email", (q) => q.eq("email", normalized))
      .first();
    return publicUser(user);
  },
});

export const getUser = query({
  args: { userId: v.id("collabUsers") },
  handler: async (ctx, { userId }) => {
    return publicUser(await ctx.db.get(userId));
  },
});

export const getUserForAuth = query({
  args: {
    email: v.string(),
    serverSecret: v.string(),
  },
  handler: async (ctx, { email, serverSecret }) => {
    requireServerSecret(serverSecret);
    const normalized = normalizeEmail(email);
    if (!normalized) return null;
    return await ctx.db
      .query("collabUsers")
      .withIndex("by_email", (q) => q.eq("email", normalized))
      .first();
  },
});

export const upsertUser = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    role: roleValidator,
    companyName: v.optional(v.string()),
    niche: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const email = normalizeEmail(args.email);
    const name = requireText(args.name, "name");
    if (!email.includes("@")) throw new ConvexError("valid email is required");

    const now = Date.now();
    const existing = await ctx.db
      .query("collabUsers")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    const patch = {
      name,
      role: args.role,
      companyName: args.companyName?.trim() || undefined,
      niche: args.niche?.trim() || undefined,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }

    return await ctx.db.insert("collabUsers", {
      email,
      ...patch,
      subscriptionTier: "free",
      subscriptionStatus: "inactive",
      createdAt: now,
    });
  },
});

export const registerPasswordUser = mutation({
  args: {
    email: v.string(),
    passwordHash: v.string(),
    name: v.string(),
    role: roleValidator,
    companyName: v.optional(v.string()),
    niche: v.optional(v.string()),
    serverSecret: v.string(),
  },
  handler: async (ctx, args) => {
    requireServerSecret(args.serverSecret);
    const email = normalizeEmail(args.email);
    const name = requireText(args.name, "name");
    const passwordHash = requireText(args.passwordHash, "password hash");
    if (!email.includes("@")) throw new ConvexError("valid email is required");

    const now = Date.now();
    const existing = await ctx.db
      .query("collabUsers")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (existing?.passwordHash) {
      throw new ConvexError("account already exists");
    }

    const userFields = {
      email,
      passwordHash,
      name,
      role: args.role,
      companyName: args.companyName?.trim() || undefined,
      niche: args.niche?.trim() || undefined,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, userFields);
      return existing._id;
    }

    return await ctx.db.insert("collabUsers", {
      ...userFields,
      subscriptionTier: "free",
      subscriptionStatus: "inactive",
      createdAt: now,
    });
  },
});

export const upsertSocialUser = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    role: roleValidator,
    provider: v.union(v.literal("google"), v.literal("apple")),
    providerSub: v.string(),
    serverSecret: v.string(),
  },
  handler: async (ctx, args) => {
    requireServerSecret(args.serverSecret);
    const email = normalizeEmail(args.email);
    const name = requireText(args.name, "name");
    const providerSub = requireText(args.providerSub, "provider subject");
    if (!email.includes("@")) throw new ConvexError("valid email is required");

    const existing = await ctx.db
      .query("collabUsers")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    const now = Date.now();
    const providerPatch =
      args.provider === "google" ? { googleSub: providerSub } : { appleSub: providerSub };

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...providerPatch,
        name: existing.name || name,
        role: existing.role || args.role,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("collabUsers", {
      email,
      ...providerPatch,
      name,
      role: args.role,
      subscriptionTier: "free",
      subscriptionStatus: "inactive",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateProfile = mutation({
  args: {
    userId: v.id("collabUsers"),
    name: v.string(),
    companyName: v.optional(v.string()),
    bio: v.optional(v.string()),
    niche: v.optional(v.string()),
    websiteUrl: v.optional(v.string()),
    location: v.optional(v.string()),
    followerCount: v.optional(v.number()),
    engagementRate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await getUserOrThrow(ctx, args.userId);
    await ctx.db.patch(args.userId, {
      name: requireText(args.name, "name"),
      companyName: args.companyName?.trim() || undefined,
      bio: args.bio?.trim() || undefined,
      niche: args.niche?.trim() || undefined,
      websiteUrl: args.websiteUrl?.trim() || undefined,
      location: args.location?.trim() || undefined,
      followerCount: args.followerCount,
      engagementRate: args.engagementRate,
      updatedAt: Date.now(),
    });
    return { ok: true };
  },
});

export const updateBillingStatus = mutation({
  args: {
    userId: v.id("collabUsers"),
    subscriptionTier: tierValidator,
    subscriptionStatus: subscriptionStatusValidator,
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await getUserOrThrow(ctx, args.userId);
    await ctx.db.patch(args.userId, {
      subscriptionTier: args.subscriptionTier,
      subscriptionStatus: args.subscriptionStatus,
      stripeCustomerId: args.stripeCustomerId,
      stripeSubscriptionId: args.stripeSubscriptionId,
      updatedAt: Date.now(),
    });
    return { ok: true };
  },
});

export const listInfluencers = query({
  args: {
    niche: v.optional(v.string()),
    minFollowers: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const influencers = await ctx.db
      .query("collabUsers")
      .withIndex("by_role", (q) => q.eq("role", "influencer"))
      .collect();

    return influencers
      .filter((user) => !args.niche || user.niche === args.niche)
      .filter((user) => !args.minFollowers || (user.followerCount ?? 0) >= args.minFollowers)
      .sort((a, b) => (b.followerCount ?? 0) - (a.followerCount ?? 0))
      .map(publicUser);
  },
});

export const listCampaigns = query({
  args: {
    category: v.optional(v.string()),
    status: v.optional(campaignStatusValidator),
    currentUserId: v.optional(v.id("collabUsers")),
  },
  handler: async (ctx, args) => {
    const campaigns = args.category
      ? await ctx.db
          .query("collabCampaigns")
          .withIndex("by_category_status", (q) =>
            q.eq("category", args.category!).eq("status", args.status ?? "open")
          )
          .collect()
      : await ctx.db
          .query("collabCampaigns")
          .withIndex("by_status", (q) => q.eq("status", args.status ?? "open"))
          .collect();

    const enriched = await Promise.all(
      campaigns.map(async (campaign) => {
        const brand = await ctx.db.get(campaign.brandId);
        const existingApplication = args.currentUserId
          ? await ctx.db
              .query("collabApplications")
              .withIndex("by_campaign_influencer", (q) =>
                q.eq("campaignId", campaign._id).eq("influencerId", args.currentUserId!)
              )
              .first()
          : null;
        return { ...campaign, brand: publicUser(brand), existingApplication };
      })
    );

    return enriched.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const listMyCampaigns = query({
  args: { brandId: v.id("collabUsers") },
  handler: async (ctx, { brandId }) => {
    const campaigns = await ctx.db
      .query("collabCampaigns")
      .withIndex("by_brand", (q) => q.eq("brandId", brandId))
      .collect();
    return campaigns.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const createCampaign = mutation({
  args: {
    brandId: v.id("collabUsers"),
    title: v.string(),
    description: v.string(),
    category: v.string(),
    budgetMin: v.number(),
    budgetMax: v.number(),
    timeline: v.string(),
    deliverables: v.string(),
    requiredFollowers: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const brand = await getUserOrThrow(ctx, args.brandId);
    if (brand.role !== "brand") throw new ConvexError("only brands can create campaigns");
    if (args.budgetMin < 0 || args.budgetMax < args.budgetMin) {
      throw new ConvexError("budget range is invalid");
    }

    const now = Date.now();
    return await ctx.db.insert("collabCampaigns", {
      brandId: args.brandId,
      title: requireText(args.title, "title"),
      description: requireText(args.description, "description"),
      category: requireText(args.category, "category"),
      budgetMin: args.budgetMin,
      budgetMax: args.budgetMax,
      timeline: requireText(args.timeline, "timeline"),
      deliverables: requireText(args.deliverables, "deliverables"),
      requiredFollowers: args.requiredFollowers,
      status: "open",
      applicationsCount: 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const listApplicationsForBrand = query({
  args: { brandId: v.id("collabUsers") },
  handler: async (ctx, { brandId }) => {
    const applications = await ctx.db
      .query("collabApplications")
      .withIndex("by_brand", (q) => q.eq("brandId", brandId))
      .collect();
    return await enrichApplications(ctx, applications);
  },
});

export const listApplicationsForInfluencer = query({
  args: { influencerId: v.id("collabUsers") },
  handler: async (ctx, { influencerId }) => {
    const applications = await ctx.db
      .query("collabApplications")
      .withIndex("by_influencer", (q) => q.eq("influencerId", influencerId))
      .collect();
    return await enrichApplications(ctx, applications);
  },
});

async function enrichApplications(
  ctx: QueryCtx,
  applications: Doc<"collabApplications">[]
) {
  const enriched = await Promise.all(
    applications.map(async (application) => ({
      ...application,
      campaign: await ctx.db.get(application.campaignId),
      brand: publicUser(await ctx.db.get(application.brandId)),
      influencer: publicUser(await ctx.db.get(application.influencerId)),
    }))
  );
  return enriched.sort((a, b) => b.createdAt - a.createdAt);
}

export const applyToCampaign = mutation({
  args: {
    campaignId: v.id("collabCampaigns"),
    influencerId: v.id("collabUsers"),
    pitch: v.string(),
    proposedFee: v.number(),
    portfolioUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const [campaign, influencer] = await Promise.all([
      getCampaignOrThrow(ctx, args.campaignId),
      getUserOrThrow(ctx, args.influencerId),
    ]);
    if (influencer.role !== "influencer") {
      throw new ConvexError("only influencers can apply to campaigns");
    }
    if (campaign.status !== "open") throw new ConvexError("campaign is not open");

    const existing = await ctx.db
      .query("collabApplications")
      .withIndex("by_campaign_influencer", (q) =>
        q.eq("campaignId", args.campaignId).eq("influencerId", args.influencerId)
      )
      .first();
    if (existing) throw new ConvexError("you already applied to this campaign");

    const now = Date.now();
    const applicationId = await ctx.db.insert("collabApplications", {
      campaignId: args.campaignId,
      brandId: campaign.brandId,
      influencerId: args.influencerId,
      pitch: requireText(args.pitch, "pitch"),
      proposedFee: Math.max(0, args.proposedFee),
      portfolioUrl: args.portfolioUrl?.trim() || undefined,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.patch(args.campaignId, {
      applicationsCount: campaign.applicationsCount + 1,
      updatedAt: now,
    });
    await getOrCreateConversationRecord(ctx, campaign.brandId, args.influencerId, args.campaignId);

    return applicationId;
  },
});

export const updateApplicationStatus = mutation({
  args: {
    applicationId: v.id("collabApplications"),
    brandId: v.id("collabUsers"),
    status: applicationStatusValidator,
  },
  handler: async (ctx, { applicationId, brandId, status }) => {
    const application = await ctx.db.get(applicationId);
    if (!application) throw new ConvexError("application not found");
    if (application.brandId !== brandId) throw new ConvexError("only the brand can review this application");
    await ctx.db.patch(applicationId, { status, updatedAt: Date.now() });
    return { ok: true };
  },
});

export const listConversations = query({
  args: { userId: v.id("collabUsers") },
  handler: async (ctx, { userId }) => {
    const [asOne, asTwo] = await Promise.all([
      ctx.db
        .query("collabConversations")
        .withIndex("by_participant_one", (q) => q.eq("participantOneId", userId))
        .collect(),
      ctx.db
        .query("collabConversations")
        .withIndex("by_participant_two", (q) => q.eq("participantTwoId", userId))
        .collect(),
    ]);

    const conversations = await Promise.all(
      [...asOne, ...asTwo].map(async (conversation) => ({
        ...conversation,
        participantOne: publicUser(await ctx.db.get(conversation.participantOneId)),
        participantTwo: publicUser(await ctx.db.get(conversation.participantTwoId)),
        campaign: conversation.campaignId ? await ctx.db.get(conversation.campaignId) : null,
      }))
    );
    return conversations.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const getOrCreateConversation = mutation({
  args: {
    userId: v.id("collabUsers"),
    otherUserId: v.id("collabUsers"),
    campaignId: v.optional(v.id("collabCampaigns")),
  },
  handler: async (ctx, args) => {
    await Promise.all([getUserOrThrow(ctx, args.userId), getUserOrThrow(ctx, args.otherUserId)]);
    return await getOrCreateConversationRecord(ctx, args.userId, args.otherUserId, args.campaignId);
  },
});

export const listMessages = query({
  args: {
    conversationId: v.id("collabConversations"),
    userId: v.id("collabUsers"),
  },
  handler: async (ctx, { conversationId, userId }) => {
    const conversation = await ctx.db.get(conversationId);
    if (!conversation) return [];
    if (conversation.participantOneId !== userId && conversation.participantTwoId !== userId) {
      throw new ConvexError("not a participant in this conversation");
    }
    return await ctx.db
      .query("collabMessages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", conversationId))
      .collect();
  },
});

export const sendMessage = mutation({
  args: {
    conversationId: v.id("collabConversations"),
    senderId: v.id("collabUsers"),
    body: v.string(),
  },
  handler: async (ctx, { conversationId, senderId, body }) => {
    const conversation = await ctx.db.get(conversationId);
    if (!conversation) throw new ConvexError("conversation not found");
    if (conversation.participantOneId !== senderId && conversation.participantTwoId !== senderId) {
      throw new ConvexError("not a participant in this conversation");
    }
    const trimmed = requireText(body, "message");
    const now = Date.now();
    const messageId = await ctx.db.insert("collabMessages", {
      conversationId,
      senderId,
      body: trimmed,
      createdAt: now,
    });
    await ctx.db.patch(conversationId, {
      lastMessage: trimmed,
      lastMessageAt: now,
      updatedAt: now,
    });
    return messageId;
  },
});
