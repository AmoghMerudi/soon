import Stripe from "stripe";

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(secretKey);
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
    const { stripeCustomerId } = (await request.json()) as { stripeCustomerId?: string };
    if (!stripeCustomerId) {
      return Response.json({ error: "stripeCustomerId is required" }, { status: 400 });
    }

    const session = await getStripe().billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${getBaseUrl(request)}/collabhub?billing=portal-return`,
    });

    return Response.json({ url: session.url });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to create billing portal session" },
      { status: 500 }
    );
  }
}
