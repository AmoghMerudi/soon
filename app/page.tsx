import type { ReactNode } from "react";

const featuredCampaigns = [
  {
    brand: "GlowHaus",
    title: "Skincare launch with creator try-on videos",
    category: "Beauty",
    budget: "$1.5k - $4k",
    applicants: 42,
    match: "94%",
  },
  {
    brand: "TrailKind",
    title: "Outdoor gear capsule for micro-adventurers",
    category: "Lifestyle",
    budget: "$800 - $2.2k",
    applicants: 18,
    match: "88%",
  },
  {
    brand: "Nourish Daily",
    title: "UGC recipe series for protein snacks",
    category: "Food",
    budget: "$500 - $1.5k",
    applicants: 31,
    match: "91%",
  },
];

const brandStats = [
  { label: "Active campaigns", value: "12" },
  { label: "Qualified creators", value: "248" },
  { label: "Avg. response time", value: "1.8h" },
];

const influencerStats = [
  { label: "Open applications", value: "7" },
  { label: "Profile views", value: "3.4k" },
  { label: "Projected earnings", value: "$8.2k" },
];

const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    audience: "Explore the marketplace",
    features: ["View profiles and campaigns", "Limited monthly searches", "Basic profile listing"],
  },
  {
    name: "Basic",
    price: "$9.99",
    audience: "Start collaborating",
    features: ["Post or apply to campaigns", "10 active conversations", "Portfolio and campaign analytics"],
    highlighted: true,
  },
  {
    name: "Pro",
    price: "$29.99",
    audience: "Scale partnerships",
    features: ["Unlimited campaigns and messaging", "Featured creator or brand placement", "Contract templates and priority support"],
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#08080A] text-white">
      <section className="relative border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,120,74,0.28),_transparent_28%),radial-gradient(circle_at_80%_10%,_rgba(119,92,255,0.24),_transparent_30%),linear-gradient(180deg,_rgba(255,255,255,0.08),_transparent_42%)]" />
        <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-6 sm:px-8 lg:px-10">
          <nav className="flex items-center justify-between">
            <a className="flex items-center gap-3" href="#top" aria-label="CollabHub home">
              <span className="grid size-10 place-items-center rounded-2xl bg-white text-lg font-black text-[#111] shadow-[0_18px_60px_rgba(255,255,255,0.18)]">
                C
              </span>
              <span className="text-lg font-semibold tracking-tight">CollabHub</span>
            </a>
            <div className="hidden items-center gap-8 text-sm text-white/68 md:flex">
              <a className="transition hover:text-white" href="#campaigns">
                Campaigns
              </a>
              <a className="transition hover:text-white" href="#dashboards">
                Dashboards
              </a>
              <a className="transition hover:text-white" href="#pricing">
                Pricing
              </a>
            </div>
            <a
              className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/16"
              href="/collabhub"
            >
              Open app
            </a>
          </nav>

          <div className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[1.02fr_0.98fr] lg:py-8">
            <div id="top" className="max-w-3xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1 text-sm text-white/72 backdrop-blur">
                <span className="size-2 rounded-full bg-[#80FFB0]" />
                Brand and influencer partnerships, finally in one place
              </div>
              <h1 className="text-5xl font-semibold tracking-[-0.06em] text-balance sm:text-7xl lg:text-8xl">
                Find, pitch, chat, and close creator deals faster.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/68 sm:text-xl">
                CollabHub helps brands post campaigns and influencers discover paid opportunities,
                manage applications, negotiate in real time, and grow recurring partnerships.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <a
                  className="rounded-full bg-white px-6 py-3 text-center text-sm font-bold text-[#111] transition hover:scale-[1.02]"
                  href="/collabhub"
                >
                  Start building your profile
                </a>
                <a
                  className="rounded-full border border-white/15 px-6 py-3 text-center text-sm font-bold text-white transition hover:bg-white/10"
                  href="#campaigns"
                >
                  Browse sample campaigns
                </a>
              </div>
              <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
                {[
                  ["$9.99/mo", "Basic tier"],
                  ["10x", "Faster shortlists"],
                  ["24/7", "Messaging hub"],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-3xl border border-white/10 bg-white/8 p-4 backdrop-blur">
                    <div className="text-2xl font-semibold tracking-tight">{value}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.18em] text-white/45">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-8 rounded-[3rem] bg-gradient-to-br from-[#FF7A45]/30 via-[#7B61FF]/20 to-[#2DE2A1]/20 blur-3xl" />
              <div className="relative rounded-[2rem] border border-white/12 bg-[#111116]/86 p-4 shadow-2xl shadow-black/40 backdrop-blur">
                <div className="rounded-[1.5rem] border border-white/10 bg-black/40 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/45">Brand workspace</p>
                      <h2 className="mt-1 text-xl font-semibold">Campaign pipeline</h2>
                    </div>
                    <span className="rounded-full bg-[#80FFB0]/14 px-3 py-1 text-xs font-semibold text-[#80FFB0]">
                      Live
                    </span>
                  </div>
                  <div className="mt-5 grid gap-3">
                    {featuredCampaigns.map((campaign) => (
                      <div
                        key={campaign.title}
                        className="rounded-2xl border border-white/8 bg-white/[0.06] p-4 transition hover:bg-white/[0.09]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-[0.16em] text-[#FFB088]">{campaign.brand}</p>
                            <h3 className="mt-1 font-semibold leading-snug">{campaign.title}</h3>
                          </div>
                          <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/72">
                            {campaign.match}
                          </span>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/58">
                          <span className="rounded-full bg-white/8 px-3 py-1">{campaign.category}</span>
                          <span className="rounded-full bg-white/8 px-3 py-1">{campaign.budget}</span>
                          <span className="rounded-full bg-white/8 px-3 py-1">{campaign.applicants} applicants</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="campaigns" className="mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#FFB088]">Campaign discovery</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-balance sm:text-5xl">
              Search by niche, budget, follower fit, and engagement quality.
            </h2>
            <p className="mt-5 text-white/62">
              Brands can build qualified creator shortlists. Influencers can filter paid briefs and
              apply with tailored deliverables, portfolio links, and proposed fees.
            </p>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
            <div className="flex flex-wrap gap-2">
              {["Beauty", "Fitness", "Food", "Travel", "Gaming", "Fashion"].map((filter) => (
                <button
                  className="rounded-full border border-white/10 bg-white/7 px-4 py-2 text-sm text-white/72 transition hover:border-white/25 hover:text-white"
                  key={filter}
                  type="button"
                >
                  {filter}
                </button>
              ))}
            </div>
            <div className="mt-5 grid gap-3">
              {featuredCampaigns.map((campaign) => (
                <article key={campaign.title} className="rounded-3xl bg-[#15151C] p-5">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                      <div className="text-sm text-white/45">{campaign.brand} / {campaign.category}</div>
                      <h3 className="mt-1 text-xl font-semibold">{campaign.title}</h3>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="font-semibold text-[#80FFB0]">{campaign.budget}</div>
                      <div className="text-sm text-white/45">{campaign.applicants} applicants</div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="dashboards" className="border-y border-white/10 bg-white/[0.03]">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 py-24 sm:px-8 lg:grid-cols-2 lg:px-10">
          <DashboardCard
            eyebrow="For brands"
            title="Manage campaigns, applicants, and deal flow."
            stats={brandStats}
            bullets={[
              "Create briefs with budget, deliverables, timeline, and audience fit.",
              "Review applications with creator metrics and portfolio snapshots.",
              "Move candidates from shortlist to contract-ready conversation.",
            ]}
          />
          <DashboardCard
            eyebrow="For influencers"
            title="Track opportunities from pitch to paid partnership."
            stats={influencerStats}
            bullets={[
              "Build a profile with socials, content niches, rates, and case studies.",
              "Apply to relevant campaigns without losing track of status.",
              "Keep brand messages, files, and deal notes in one workspace.",
            ]}
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#80FFB0]">Messaging hub</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              Real-time conversations connected to the campaign.
            </h2>
            <p className="mt-5 max-w-2xl text-white/62">
              Every campaign can open a focused thread so brands and creators can align on
              deliverables, timelines, usage rights, and next steps without switching tools.
            </p>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-[#121218] p-5">
            <div className="mb-4 flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="grid size-11 place-items-center rounded-full bg-[#7B61FF] font-bold">AK</div>
              <div>
                <div className="font-semibold">Ava Kim x GlowHaus</div>
                <div className="text-sm text-white/45">Skincare launch brief</div>
              </div>
            </div>
            <div className="space-y-3">
              <ChatBubble side="left">
                Your past beauty content is a strong fit. Can you include a 30-sec GRWM reel?
              </ChatBubble>
              <ChatBubble side="right">
                Yes. I can do one GRWM reel, three story frames, and usage rights for 60 days.
              </ChatBubble>
              <ChatBubble side="left">
                Perfect. Sending the contract template and final offer now.
              </ChatBubble>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-6 pb-24 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#FFB088]">Subscription model</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
            Simple pricing for brands and influencers.
          </h2>
          <p className="mt-5 text-white/62">
            Start free, upgrade to Basic for $9.99/month, and scale with Pro when the collaboration
            pipeline needs unlimited reach.
          </p>
        </div>
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {pricingPlans.map((plan) => (
            <article
              key={plan.name}
              className={`rounded-[2rem] border p-6 ${
                plan.highlighted
                  ? "border-white/30 bg-white text-[#101014] shadow-2xl shadow-white/10"
                  : "border-white/10 bg-white/[0.04]"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-semibold">{plan.name}</h3>
                  <p className={plan.highlighted ? "text-black/55" : "text-white/48"}>{plan.audience}</p>
                </div>
                {plan.highlighted && (
                  <span className="rounded-full bg-[#101014] px-3 py-1 text-xs font-bold text-white">Popular</span>
                )}
              </div>
              <div className="mt-7 flex items-end gap-1">
                <span className="text-5xl font-semibold tracking-[-0.05em]">{plan.price}</span>
                {plan.price !== "$0" && (
                  <span className={plan.highlighted ? "pb-2 text-black/55" : "pb-2 text-white/48"}>/mo</span>
                )}
              </div>
              <ul className="mt-7 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-3 text-sm">
                    <span className={plan.highlighted ? "text-[#16A56A]" : "text-[#80FFB0]"}>+</span>
                    <span className={plan.highlighted ? "text-black/70" : "text-white/68"}>{feature}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section id="onboarding" className="mx-auto max-w-7xl px-6 pb-12 sm:px-8 lg:px-10">
        <div className="rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-white/14 to-white/[0.04] p-8 text-center sm:p-12">
          <h2 className="text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">
            Ready to launch CollabHub?
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-white/64">
            Next step is wiring this web experience to authentication, campaign data,
            subscriptions, and real messaging APIs.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a className="rounded-full bg-white px-6 py-3 text-sm font-bold text-[#111]" href="/collabhub">
              Open CollabHub app
            </a>
            <a className="rounded-full border border-white/15 px-6 py-3 text-sm font-bold text-white" href="#top">
              Back to top
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

function DashboardCard({
  eyebrow,
  title,
  stats,
  bullets,
}: {
  eyebrow: string;
  title: string;
  stats: { label: string; value: string }[];
  bullets: string[];
}) {
  return (
    <article className="rounded-[2rem] border border-white/10 bg-[#111116] p-6">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#FFB088]">{eyebrow}</p>
      <h3 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">{title}</h3>
      <div className="mt-6 grid grid-cols-3 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl bg-white/[0.06] p-4">
            <div className="text-2xl font-semibold">{stat.value}</div>
            <div className="mt-1 text-xs text-white/45">{stat.label}</div>
          </div>
        ))}
      </div>
      <ul className="mt-6 space-y-3 text-white/66">
        {bullets.map((bullet) => (
          <li key={bullet} className="flex gap-3">
            <span className="mt-2 size-1.5 rounded-full bg-[#80FFB0]" />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function ChatBubble({ side, children }: { side: "left" | "right"; children: ReactNode }) {
  return (
    <div className={`flex ${side === "right" ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[82%] rounded-3xl px-4 py-3 text-sm leading-6 ${
          side === "right" ? "bg-white text-[#101014]" : "bg-white/[0.08] text-white/76"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
