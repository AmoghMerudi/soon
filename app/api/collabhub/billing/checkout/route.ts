import Stripe from "stripe";

type CheckoutRequest = {
  userId?: string;
  email?: string;
  name?: string;
  tier?: "basic" | "pro";
  stripeCustomerId?: string;
};

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(secretKey);
}

function getPriceId(tier: "basic" | "pro") {
  const priceId =
    tier === "basic"
      ? process.env.STRIPE_COLLABHUB_BASIC_PRICE_ID ?? process.env.STRIPE_BASIC_PRICE_ID
      : process.env.STRIPE_COLLABHUB_PRO_PRICE_ID ?? process.env.STRIPE_PRO_PRICE_ID;

  if (!priceId) {
    throw new Error(`Stripe price ID for ${tier} tier is not configured`);
  }
  return priceId;
}

function getBaseUrl(request: Request) {
  const configured = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL;
  if (configured) return configured.replace(/\/$/, "");

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`;

  return new URL(request.url).origin;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CheckoutRequest;
    if (!body.userId || !body.email || !body.tier) {
      return Response.json({ error: "userId, email, and tier are required" }, { status: 400 });
    }

    const stripe = getStripe();
    const baseUrl = getBaseUrl(request);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: body.stripeCustomerId,
      customer_email: body.stripeCustomerId ? undefined : body.email,
      client_reference_id: body.userId,
      line_items: [{ price: getPriceId(body.tier), quantity: 1 }],
      allow_promotion_codes: true,
      metadata: {
        userId: body.userId,
        tier: body.tier,
      },
      subscription_data: {
        metadata: {
          userId: body.userId,
          tier: body.tier,
        },
      },
      success_url: `${baseUrl}/collabhub?billing=success`,
      cancel_url: `${baseUrl}/collabhub?billing=cancelled`,
      customer_creation: body.stripeCustomerId ? undefined : "always",
      customer_update: body.stripeCustomerId ? { name: "auto" } : undefined,
    });

    return Response.json({ url: session.url });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to create checkout session" },
      { status: 500 }
    );
  }
}
