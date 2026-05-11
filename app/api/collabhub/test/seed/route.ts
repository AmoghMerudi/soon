import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { getConvexServerSecret, hashPassword } from "@/lib/collabhub/auth";

const demoPassword = "CollabHubDemo123!";
const brandEmail = "demo-brand@collabhub.test";
const influencerEmail = "demo-influencer@collabhub.test";

function assertTestToolsEnabled() {
  if (process.env.COLLABHUB_ENABLE_TEST_TOOLS !== "true") {
    throw new Error("Set COLLABHUB_ENABLE_TEST_TOOLS=true to enable demo data seeding.");
  }
}

function getConvex() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
  return new ConvexHttpClient(url);
}

async function ensureDemoUser(
  convex: ConvexHttpClient,
  input: {
    email: string;
    name: string;
    role: "brand" | "influencer";
    companyName?: string;
    niche?: string;
  }
) {
  const existing = await convex.query(api.collabhub.getUserForAuth, {
    email: input.email,
    serverSecret: getConvexServerSecret(),
  });

  if (existing?.passwordHash) return existing._id as Id<"collabUsers">;

  return await convex.mutation(api.collabhub.registerPasswordUser, {
    email: input.email,
    passwordHash: hashPassword(demoPassword),
    name: input.name,
    role: input.role,
    companyName: input.companyName,
    niche: input.niche,
    serverSecret: getConvexServerSecret(),
  });
}

export async function POST() {
  try {
    assertTestToolsEnabled();
    const convex = getConvex();

    const brandId = await ensureDemoUser(convex, {
      email: brandEmail,
      name: "Maya Chen",
      role: "brand",
      companyName: "GlowHaus Labs",
      niche: "Beauty",
    });
    const influencerId = await ensureDemoUser(convex, {
      email: influencerEmail,
      name: "Ava Kim",
      role: "influencer",
      companyName: "Ava Creates",
      niche: "Beauty",
    });

    await convex.mutation(api.collabhub.updateProfile, {
      userId: influencerId,
      name: "Ava Kim",
      companyName: "Ava Creates",
      bio: "Beauty creator focused on skincare routines, UGC launch videos, and authentic GRWM content.",
      niche: "Beauty",
      websiteUrl: "https://example.com/ava-creates",
      location: "Los Angeles, CA",
      followerCount: 84200,
      engagementRate: 4.8,
    });

    const campaignId = await convex.mutation(api.collabhub.createCampaign, {
      brandId,
      title: `Demo skincare launch - ${new Date().toISOString().slice(0, 10)}`,
      description:
        "Create a warm, conversion-focused content package for a new vitamin C serum launch.",
      category: "Beauty",
      budgetMin: 900,
      budgetMax: 2400,
      timeline: "14 days",
      deliverables: "1 reel, 3 story frames, 5 raw UGC clips",
      requiredFollowers: 10000,
    });

    const applicationId = await convex.mutation(api.collabhub.applyToCampaign, {
      campaignId,
      influencerId,
      pitch:
        "I can produce a GRWM reel, before/after story sequence, and raw UGC clips with bright natural light and clear product education.",
      proposedFee: 1500,
      portfolioUrl: "https://example.com/ava-portfolio",
    });

    await convex.mutation(api.collabhub.updateApplicationStatus, {
      applicationId,
      brandId,
      status: "accepted",
    });

    const conversationId = await convex.mutation(api.collabhub.getOrCreateConversation, {
      userId: brandId,
      otherUserId: influencerId,
      campaignId,
    });

    await convex.mutation(api.collabhub.sendMessage, {
      conversationId,
      senderId: brandId,
      body: "Thanks for the thoughtful pitch. We accepted your application for the demo launch.",
    });
    await convex.mutation(api.collabhub.sendMessage, {
      conversationId,
      senderId: influencerId,
      body: "Excited to collaborate. I can send the shot list and production timeline today.",
    });

    return Response.json({
      ok: true,
      credentials: {
        brand: { email: brandEmail, password: demoPassword },
        influencer: { email: influencerEmail, password: demoPassword },
      },
      ids: { brandId, influencerId, campaignId, applicationId, conversationId },
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to seed demo data" },
      { status: 400 }
    );
  }
}
