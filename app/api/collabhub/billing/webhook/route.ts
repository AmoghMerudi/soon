import { ConvexHttpClient } from "convex/browser";
import Stripe from "stripe";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

type CollabTier = "free" | "basic" | "pro";
type CollabSubscriptionStatus = "inactive" | "active" | "trialing" | "past_due" | "cancelled";

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(secretKey);
}

function getConvex() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
  return new ConvexHttpClient(url);
}

function toTier(value: string | undefined | null): CollabTier {
  return value === "basic" || value === "pro" ? value : "free";
}

function toStatus(status: Stripe.Subscription.Status): CollabSubscriptionStatus {
  if (status === "active") return "active";
  if (status === "trialing") return "trialing";
  if (status === "past_due") return "past_due";
  if (status === "canceled") return "cancelled";
  return "inactive";
}

async function syncBillingStatus({
  customerId,
  status,
  subscriptionId,
  tier,
  userId,
}: {
  customerId?: string | null;
  status: CollabSubscriptionStatus;
  subscriptionId?: string | null;
  tier: CollabTier;
  userId?: string | null;
}) {
  if (!userId) return;

  await getConvex().mutation(api.collabhub.updateBillingStatus, {
    userId: userId as Id<"collabUsers">,
    subscriptionTier: status === "cancelled" || status === "inactive" ? "free" : tier,
    subscriptionStatus: status,
    stripeCustomerId: customerId ?? undefined,
    stripeSubscriptionId: subscriptionId ?? undefined,
  });
}

async function handleCheckoutCompleted(stripe: Stripe, session: Stripe.Checkout.Session) {
  const subscriptionId =
    typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
  const subscription = subscriptionId ? await stripe.subscriptions.retrieve(subscriptionId) : null;

  await syncBillingStatus({
    customerId: typeof session.customer === "string" ? session.customer : session.customer?.id,
    status: subscription ? toStatus(subscription.status) : "active",
    subscriptionId,
    tier: toTier(subscription?.metadata.tier ?? session.metadata?.tier),
    userId: subscription?.metadata.userId ?? session.client_reference_id ?? session.metadata?.userId,
  });
}

async function handleSubscriptionChanged(subscription: Stripe.Subscription) {
  await syncBillingStatus({
    customerId: typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id,
    status: toStatus(subscription.status),
    subscriptionId: subscription.id,
    tier: toTier(subscription.metadata.tier),
    userId: subscription.metadata.userId,
  });
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return Response.json({ error: "STRIPE_WEBHOOK_SECRET is not configured" }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return Response.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    const rawBody = await request.text();
    const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

    if (event.type === "checkout.session.completed") {
      await handleCheckoutCompleted(stripe, event.data.object);
    }

    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      await handleSubscriptionChanged(event.data.object);
    }

    return Response.json({ received: true });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to process Stripe webhook" },
      { status: 400 }
    );
  }
}
