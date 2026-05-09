import { v } from "convex/values";
import { action, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

const STRIPE_API = "https://api.stripe.com/v1";
const MAX_BALANCE_TX_PAGES = 10;
const MAX_CUSTOMER_PAGES = 10;
const PAGE_SIZE = 100;

export const _getProjectStripeKey = internalQuery({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const project = await ctx.db.get(projectId);
    return project?.stripeApiKey ?? null;
  },
});

type StripeListPage<T> = { data: T[]; has_more: boolean };
type BalanceTx = { id: string; amount: number; created: number; type: string };
type Customer = { id: string };

async function stripeGet<T>(path: string, key: string): Promise<T> {
  const res = await fetch(`${STRIPE_API}${path}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Stripe ${res.status}: ${body.slice(0, 300)}`);
  }
  return (await res.json()) as T;
}

async function fetchAllBalanceTx(key: string): Promise<BalanceTx[]> {
  const all: BalanceTx[] = [];
  let starting_after: string | null = null;
  for (let i = 0; i < MAX_BALANCE_TX_PAGES; i++) {
    const qs = new URLSearchParams({ limit: String(PAGE_SIZE), type: "charge" });
    if (starting_after) qs.set("starting_after", starting_after);
    const page: StripeListPage<BalanceTx> = await stripeGet(
      `/balance_transactions?${qs.toString()}`,
      key,
    );
    all.push(...page.data);
    if (!page.has_more || page.data.length === 0) break;
    starting_after = page.data[page.data.length - 1].id;
  }
  return all;
}

async function countCustomers(key: string): Promise<number> {
  let count = 0;
  let starting_after: string | null = null;
  for (let i = 0; i < MAX_CUSTOMER_PAGES; i++) {
    const qs = new URLSearchParams({ limit: String(PAGE_SIZE) });
    if (starting_after) qs.set("starting_after", starting_after);
    const page: StripeListPage<Customer> = await stripeGet(
      `/customers?${qs.toString()}`,
      key,
    );
    count += page.data.length;
    if (!page.has_more || page.data.length === 0) break;
    starting_after = page.data[page.data.length - 1].id;
  }
  return count;
}

export const getStripeMetrics = action({
  args: { projectId: v.id("projects") },
  handler: async (
    ctx,
    { projectId },
  ): Promise<
    | { configured: false }
    | {
        configured: true;
        error: string;
      }
    | {
        configured: true;
        totalRevenueCents: number;
        last30dRevenueCents: number;
        customerCount: number;
        dailyRevenueCents: number[];
      }
  > => {
    const key: string | null = await ctx.runQuery(
      internal.stripe._getProjectStripeKey,
      { projectId },
    );
    if (!key) return { configured: false };

    try {
      const [txs, customerCount] = await Promise.all([
        fetchAllBalanceTx(key),
        countCustomers(key),
      ]);

      const nowSec = Math.floor(Date.now() / 1000);
      const dayStartUtc = (() => {
        const d = new Date();
        d.setUTCHours(0, 0, 0, 0);
        return Math.floor(d.getTime() / 1000);
      })();
      const windowStart = dayStartUtc - 29 * 86400;

      let totalRevenueCents = 0;
      let last30dRevenueCents = 0;
      const daily = new Array<number>(30).fill(0);

      for (const tx of txs) {
        if (tx.amount <= 0) continue;
        totalRevenueCents += tx.amount;
        if (tx.created >= windowStart && tx.created <= nowSec) {
          last30dRevenueCents += tx.amount;
          const bucket = Math.min(
            29,
            Math.floor((tx.created - windowStart) / 86400),
          );
          daily[bucket] += tx.amount;
        }
      }

      return {
        configured: true,
        totalRevenueCents,
        last30dRevenueCents,
        customerCount,
        dailyRevenueCents: daily,
      };
    } catch (err) {
      return {
        configured: true,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  },
});
