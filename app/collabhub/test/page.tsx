"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ConfigCheck = {
  name: string;
  configured: boolean;
  help: string;
  required: boolean;
};

type ConfigResponse = {
  ready: boolean;
  testToolsEnabled: boolean;
  checks: ConfigCheck[];
};

type SeedResponse =
  | {
      ok: true;
      credentials: {
        brand: { email: string; password: string };
        influencer: { email: string; password: string };
      };
    }
  | { error: string };

const testFlows = [
  {
    title: "1. Password auth",
    steps: [
      "Create one brand account with a password.",
      "Sign out, then log back in with the same password.",
      "Create one influencer account in another browser/profile.",
    ],
  },
  {
    title: "2. Campaign marketplace",
    steps: [
      "As the brand, post a campaign from Dashboard.",
      "As the influencer, browse Marketplace and submit an application.",
      "As the brand, accept or reject the application.",
    ],
  },
  {
    title: "3. Messaging",
    steps: [
      "Open the conversation created by the application.",
      "Send messages from both accounts.",
      "Refresh the page and confirm messages persist.",
    ],
  },
  {
    title: "4. Billing",
    steps: [
      "Set Stripe env vars and restart the app.",
      "Open Profile, click Upgrade to Basic or Pro.",
      "Complete Stripe test checkout and confirm webhook updates the plan.",
    ],
  },
  {
    title: "5. Social auth",
    steps: [
      "Set Google and/or Apple client IDs.",
      "Use Continue with Google or Apple on the auth screen.",
      "Confirm the account appears as brand or influencer based on the selected role.",
    ],
  },
];

export default function CollabHubTestPage() {
  const [config, setConfig] = useState<ConfigResponse | null>(null);
  const [sessionStatus, setSessionStatus] = useState<"checking" | "signed-in" | "signed-out" | "error">(
    "checking"
  );
  const [seedResult, setSeedResult] = useState<SeedResponse | null>(null);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [configResponse, sessionResponse] = await Promise.all([
          fetch("/api/collabhub/config"),
          fetch("/api/collabhub/auth/me"),
        ]);
        setConfig((await configResponse.json()) as ConfigResponse);
        const session = (await sessionResponse.json()) as { userId?: string | null };
        setSessionStatus(session.userId ? "signed-in" : "signed-out");
      } catch {
        setSessionStatus("error");
      }
    }
    void load();
  }, []);

  async function handleSeedDemoData() {
    setSeeding(true);
    setSeedResult(null);
    try {
      const response = await fetch("/api/collabhub/test/seed", { method: "POST" });
      setSeedResult((await response.json()) as SeedResponse);
    } catch (error) {
      setSeedResult({ error: error instanceof Error ? error.message : "Unable to seed demo data" });
    } finally {
      setSeeding(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#08080A] px-5 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link href="/collabhub" className="text-sm font-semibold uppercase tracking-[0.24em] text-white/45">
              Back to CollabHub
            </Link>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">
              Pre-mobile test center
            </h1>
            <p className="mt-3 max-w-2xl text-white/58">
              Use this page to verify the web MVP, environment setup, auth, billing,
              and core marketplace flows before investing in the mobile app.
            </p>
          </div>
          <Link
            className="rounded-full bg-white px-5 py-3 text-center text-sm font-bold text-[#101014]"
            href="/collabhub"
          >
            Open web app
          </Link>
        </header>

        <section className="mt-8 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#80FFB0]">
              Environment readiness
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
              {config?.ready ? "All configured" : "Setup still needed"}
            </h2>
            <div className="mt-5 grid gap-3">
              {(config?.checks ?? []).map((check) => (
                <div className="rounded-2xl bg-white/[0.05] p-4" key={check.name}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold">{check.name}</div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        check.configured ? "bg-[#80FFB0]/15 text-[#80FFB0]" : "bg-[#FFB088]/15 text-[#FFB088]"
                      }`}
                    >
                      {check.configured ? "Ready" : check.required ? "Missing" : "Optional"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-white/48">{check.help}</p>
                </div>
              ))}
              {!config && <div className="rounded-2xl bg-white/[0.05] p-4 text-white/48">Loading checks...</div>}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#FFB088]">
              Current session
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] capitalize">
              {sessionStatus.replace("-", " ")}
            </h2>
            <p className="mt-3 text-white/56">
              If signed out, open the web app and create a test brand or influencer account first.
            </p>
            <div className="mt-5 rounded-3xl border border-white/10 bg-[#111116] p-5">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h3 className="font-semibold">Seed demo marketplace data</h3>
                  <p className="mt-1 text-sm text-white/50">
                    Creates demo brand/influencer accounts, one campaign, an accepted application,
                    and starter messages.
                  </p>
                </div>
                <button
                  className="rounded-full bg-white px-5 py-3 text-sm font-bold text-[#101014] disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/35"
                  disabled={!config?.testToolsEnabled || seeding}
                  onClick={handleSeedDemoData}
                  type="button"
                >
                  {seeding ? "Seeding..." : "Seed demo data"}
                </button>
              </div>
              {!config?.testToolsEnabled && (
                <p className="mt-3 text-xs text-[#FFB088]">
                  Disabled. Set COLLABHUB_ENABLE_TEST_TOOLS=true and restart the app to enable this.
                </p>
              )}
              {seedResult && "error" in seedResult && (
                <p className="mt-3 rounded-2xl bg-[#FFB088]/10 p-3 text-sm text-[#FFB088]">
                  {seedResult.error}
                </p>
              )}
              {seedResult && "ok" in seedResult && (
                <div className="mt-3 grid gap-3 rounded-2xl bg-[#80FFB0]/10 p-4 text-sm text-[#BFFFF0] sm:grid-cols-2">
                  <div>
                    <div className="font-semibold">Demo brand</div>
                    <div>{seedResult.credentials.brand.email}</div>
                    <div>Password: {seedResult.credentials.brand.password}</div>
                  </div>
                  <div>
                    <div className="font-semibold">Demo influencer</div>
                    <div>{seedResult.credentials.influencer.email}</div>
                    <div>Password: {seedResult.credentials.influencer.password}</div>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-6 grid gap-3">
              {testFlows.map((flow) => (
                <article className="rounded-3xl bg-[#111116] p-5" key={flow.title}>
                  <h3 className="font-semibold">{flow.title}</h3>
                  <ul className="mt-3 space-y-2 text-sm text-white/58">
                    {flow.steps.map((step) => (
                      <li className="flex gap-3" key={step}>
                        <span className="mt-2 size-1.5 rounded-full bg-[#80FFB0]" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
