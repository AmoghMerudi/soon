# CollabHub Launch Setup

Use `/collabhub/test` after setting these values to confirm the web app is ready before building mobile.

## Convex

1. Create or connect a Convex project.
2. Set:
   - `NEXT_PUBLIC_CONVEX_URL`
   - `CONVEX_DEPLOYMENT`
3. Run codegen from an authenticated environment:

```bash
pnpm exec convex codegen
```

4. Set `COLLABHUB_AUTH_SECRET` in the Convex environment too. It must match the Next.js value.

## Password auth

Set:

```bash
COLLABHUB_AUTH_SECRET=replace-with-a-long-random-secret
```

This signs the HTTP-only session cookie and protects server-only Convex auth functions.

## Google sign-in

1. Create a Google OAuth web client.
2. Add your deployed domain and local dev origin to authorized JavaScript origins.
3. Set:

```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

## Apple sign-in

1. Create a Sign in with Apple Services ID.
2. Add your domain and return URL.
3. Set:

```bash
NEXT_PUBLIC_APPLE_CLIENT_ID=com.yourcompany.collabhub.web
```

## Stripe subscriptions

1. Create two recurring monthly prices in Stripe:
   - Basic: `$9.99/mo`
   - Pro: `$29.99/mo`
2. Set:

```bash
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_key
STRIPE_COLLABHUB_BASIC_PRICE_ID=price_basic_monthly
STRIPE_COLLABHUB_PRO_PRICE_ID=price_pro_monthly
```

3. Point a Stripe webhook endpoint at:

```text
https://your-domain.com/api/collabhub/billing/webhook
```

4. Subscribe it to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

## Web test flow

Open:

```text
/collabhub/test
```

To use the demo-data seed button locally or in a private preview environment, set:

```bash
COLLABHUB_ENABLE_TEST_TOOLS=true
```

Keep this unset or `false` for public production deployments.

Then verify:

1. Environment checks are ready.
2. Optional: click **Seed demo data** to create demo brand/influencer accounts, a campaign, an accepted application, and starter messages.
3. Password auth works with the demo credentials or your own accounts.
4. Google/Apple auth works if configured.
5. Brand can post a campaign.
6. Influencer can apply.
7. Brand can review applications.
8. Messaging persists after refresh.
9. Stripe test checkout updates the subscription after webhook delivery.
