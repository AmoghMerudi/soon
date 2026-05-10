import type { RoleKey } from "@/lib/dashboard/constants";

// Short scripted lines per role demonstrating real team handoff patterns.
// "→" = outgoing message, "←" = incoming/response.
export const TEAM_COMM: Record<Exclude<RoleKey, "user">, string[]> = {
  ceo: [
    "→ CTO: Lock the MVP scope by Friday — keep it lean.",
    "→ CMO: Spin up a pre-launch waitlist this week.",
    "← CTO: Engineering tickets ready, sprint kicked off.",
    "→ Team: Investor demo Monday 10am — Boardroom.",
  ],
  cto: [
    "← CEO: Scope locked — decompose into engineering tickets.",
    "→ Developer: PR review needed on the auth refactor.",
    "→ Designer: Need final asset spec by EOD.",
    "→ CEO: Architecture spec attached, ready to ship.",
  ],
  cmo: [
    "← CEO: Approve $5k for paid socials this week.",
    "→ Designer: Launch creative needs to land tomorrow.",
    "→ Marketing: Announce on Twitter when CTO ships.",
    "→ Team: Brand voice doc updated in Drive.",
  ],
  developer: [
    "← CTO: Branch protection enabled — push to staging.",
    "→ CTO: Stripe webhooks wired, ready for review.",
    "→ Designer: Component spec passed, awaiting assets.",
    "→ Marketing: Demo video URL is live.",
  ],
  designer: [
    "← CMO: Polish the launch hero before Friday.",
    "→ CMO: Three cover variants in Figma — pick one.",
    "→ Developer: Component tokens exported.",
    "→ Marketing: Final social asset pack uploaded.",
  ],
  marketing: [
    "← CMO: Push the launch post at 9am ET.",
    "→ CMO: Tweet thread drafted, ready for review.",
    "→ Designer: Need an alt-format for LinkedIn carousel.",
    "→ CEO: 12k impressions, 340 signups in first 24h.",
  ],
};
