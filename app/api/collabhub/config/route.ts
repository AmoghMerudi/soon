function configured(value: string | undefined) {
  return Boolean(value && value.trim());
}

function item(name: string, isConfigured: boolean, help: string) {
  return { name, configured: isConfigured, help };
}

export async function GET() {
  const basicPrice =
    process.env.STRIPE_COLLABHUB_BASIC_PRICE_ID ?? process.env.STRIPE_BASIC_PRICE_ID;
  const proPrice = process.env.STRIPE_COLLABHUB_PRO_PRICE_ID ?? process.env.STRIPE_PRO_PRICE_ID;

  const checks = [
    item(
      "Convex URL",
      configured(process.env.NEXT_PUBLIC_CONVEX_URL),
      "Set NEXT_PUBLIC_CONVEX_URL to your Convex deployment URL."
    ),
    item(
      "Auth secret",
      configured(process.env.COLLABHUB_AUTH_SECRET ?? process.env.AUTH_SECRET),
      "Set COLLABHUB_AUTH_SECRET in Next.js and Convex environments."
    ),
    item(
      "Stripe secret key",
      configured(process.env.STRIPE_SECRET_KEY),
      "Set STRIPE_SECRET_KEY for checkout and billing portal routes."
    ),
    item(
      "Stripe webhook secret",
      configured(process.env.STRIPE_WEBHOOK_SECRET),
      "Set STRIPE_WEBHOOK_SECRET and point Stripe webhooks to /api/collabhub/billing/webhook."
    ),
    item(
      "Stripe Basic price",
      configured(basicPrice),
      "Set STRIPE_COLLABHUB_BASIC_PRICE_ID or STRIPE_BASIC_PRICE_ID."
    ),
    item(
      "Stripe Pro price",
      configured(proPrice),
      "Set STRIPE_COLLABHUB_PRO_PRICE_ID or STRIPE_PRO_PRICE_ID."
    ),
    item(
      "Google client ID",
      configured(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? process.env.GOOGLE_CLIENT_ID),
      "Set NEXT_PUBLIC_GOOGLE_CLIENT_ID to enable Continue with Google."
    ),
    item(
      "Apple client ID",
      configured(process.env.NEXT_PUBLIC_APPLE_CLIENT_ID ?? process.env.APPLE_CLIENT_ID),
      "Set NEXT_PUBLIC_APPLE_CLIENT_ID to enable Continue with Apple."
    ),
  ];

  return Response.json({
    ready: checks.every((check) => check.configured),
    checks,
  });
}
