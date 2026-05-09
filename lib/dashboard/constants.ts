export const STATUS = {
  backlog:     { label: "Backlog",     bg: "#26241F", fg: "#BFBCB1", dot: "#8E8B82" },
  in_progress: { label: "In progress", bg: "#F2C744", fg: "#1A1404", dot: "#1A1404" },
  in_review:   { label: "In review",   bg: "#1F2A45", fg: "#9DB4F0", dot: "#6E8FE5" },
  resolved:    { label: "Resolved",    bg: "#16321F", fg: "#7FCFA0", dot: "#2E8B57" },
  blocked:     { label: "Blocked",     bg: "#3A1A14", fg: "#F0A097", dot: "#C8483A" },
} as const;

export type StatusKey = keyof typeof STATUS;

export const ROLES = {
  ceo:       { label: "CEO",       initial: "C", color: "#F2C744", fg: "#0F0E0C" },
  cto:       { label: "CTO",       initial: "T", color: "#6FBFA0", fg: "#0F0E0C" },
  cmo:       { label: "CMO",       initial: "M", color: "#9D7AC9", fg: "#FAFAF7" },
  developer: { label: "Developer", initial: "D", color: "#6E8FE5", fg: "#FAFAF7" },
  designer:  { label: "Designer",  initial: "D", color: "#C97AB0", fg: "#FAFAF7" },
  marketing: { label: "Marketing", initial: "M", color: "#E08A3C", fg: "#FAFAF7" },
} as const;

export type RoleKey = keyof typeof ROLES;

export const MANAGER: Partial<Record<RoleKey, RoleKey>> = {
  cto: "ceo",
  cmo: "ceo",
  developer: "cto",
  designer: "cmo",
  marketing: "cmo",
};

export const PRIORITY = {
  critical: { label: "Critical", bg: "#F2C744", fg: "#0F0E0C" },
  high:     { label: "High",     bg: "#3D3B36", fg: "#FAFAF7", border: "#5E5C56" },
  medium:   { label: "Medium",   bg: "#3D3B36", fg: "#FAFAF7" },
  low:      { label: "Low",      bg: "transparent", fg: "#8E8B82", border: "#3D3B36" },
} as const;

export type PriorityKey = keyof typeof PRIORITY;

export const THREAD_STATUS = {
  active:    { label: "Active",    bg: "#1F2D24", fg: "#7FC9A0", dot: "#7FC9A0", pulse: true },
  in_review: { label: "In review", bg: "#2A2618", fg: "#F2C744", dot: "#F2C744", pulse: false },
  resolved:  { label: "Resolved",  bg: "#1B2330", fg: "#8FAACB", dot: "#8FAACB", pulse: false },
  blocked:   { label: "Blocked",   bg: "#2D1A18", fg: "#E89A8E", dot: "#E89A8E", pulse: false },
} as const;

export type ThreadStatusKey = keyof typeof THREAD_STATUS;

export interface AgentSeed {
  role: RoleKey;
  state: "working" | "idle" | "blocked";
  tools: string[];
  currentTicket: { id: string; title: string } | null;
  stats: { resolved: number; active: number; blocked: number };
}

export const SEED_AGENTS: AgentSeed[] = [
  { role: "ceo",       state: "working", tools: ["convex", "analytics", "strategy"],  currentTicket: { id: "TKT-0150", title: "Q1 hiring plan + capital allocation" }, stats: { resolved: 7, active: 1, blocked: 0 } },
  { role: "cto",       state: "working", tools: ["github", "convex", "vercel"],       currentTicket: { id: "TKT-0142", title: "Reviewing Developer's Stripe webhook PR" }, stats: { resolved: 4, active: 1, blocked: 0 } },
  { role: "cmo",       state: "working", tools: ["analytics", "brand", "posthog"],    currentTicket: { id: "TKT-0149", title: "Approve launch creative" }, stats: { resolved: 5, active: 1, blocked: 0 } },
  { role: "developer", state: "working", tools: ["e2b", "github", "vercel"],          currentTicket: { id: "TKT-0142", title: "Wire Stripe webhooks" }, stats: { resolved: 5, active: 1, blocked: 1 } },
  { role: "designer",  state: "working", tools: ["google-ai-studio", "cloudinary"],   currentTicket: { id: "TKT-0141", title: "Generate first 3 book covers" }, stats: { resolved: 3, active: 1, blocked: 0 } },
  { role: "marketing", state: "idle",    tools: ["twitter", "linkedin", "email"],      currentTicket: null, stats: { resolved: 2, active: 0, blocked: 0 } },
];

export interface ThreadSeed {
  id: string;
  from: RoleKey;
  to: RoleKey;
  topic: string;
  status: ThreadStatusKey;
  parentTicket: string;
  startedAt: string;
  lastAt: string;
  turns: { role: RoleKey; ts: string; body: string }[];
}

export const SEED_THREADS: ThreadSeed[] = [
  {
    id: "THR-014", from: "developer", to: "designer",
    topic: "Final cover dimensions for Stripe checkout preview",
    status: "active", parentTicket: "TKT-0142", startedAt: "14:18", lastAt: "14:24",
    turns: [
      { role: "developer", ts: "14:18", body: "Hey — building the checkout preview card. What aspect ratio + max file size should I assume for cover renders? I'm currently fitting 600x900 @ <=180kb." },
      { role: "designer",  ts: "14:21", body: "600x900 is fine for the preview. For print we're rendering at 1800x2700, so make sure the source URL is the high-res one and the preview is a Cloudinary transform." },
      { role: "developer", ts: "14:23", body: "Got it. I'll use the cover_lg and cover_print named transforms. One more — do you want the preview cropped or letterboxed if the user uploads a square photo?" },
      { role: "designer",  ts: "14:24", body: "Letterbox with the brand cream (#F4ECDC) bars top/bottom. Never crop a kid's face." },
    ],
  },
  {
    id: "THR-013", from: "cto", to: "developer",
    topic: "Refactor: extract Stripe webhook into its own module",
    status: "in_review", parentTicket: "TKT-0142", startedAt: "14:02", lastAt: "14:19",
    turns: [
      { role: "cto",       ts: "14:02", body: "Reviewing your PR. The webhook handler is inlined in the route file — pull it into lib/stripe/webhooks.ts and export a typed dispatcher." },
      { role: "developer", ts: "14:11", body: "Makes sense. Splitting now. Should I also move signature verification into the same module, or keep that as middleware?" },
      { role: "cto",       ts: "14:19", body: "Same module. One entry point, one place to audit. Re-request review when ready." },
    ],
  },
  {
    id: "THR-012", from: "designer", to: "cmo",
    topic: "Cover variant approval — The Brave Little Mouse",
    status: "resolved", parentTicket: "TKT-0141", startedAt: "13:46", lastAt: "14:08",
    turns: [
      { role: "designer", ts: "13:46", body: "Three covers attached. A is the moodiest, B is the warmest, C is most kid-readable. My pick is B." },
      { role: "cmo",      ts: "13:52", body: "Agree on B. A reads too YA-thriller for a 6-year-old. Push B to print, archive A and C." },
      { role: "designer", ts: "13:55", body: "Pushing B. Quick Q — should I add the kid's name to the cover or only the title page?" },
      { role: "cmo",      ts: "14:01", body: "Cover too. Personalisation is the whole product — make it visible the moment they unbox it." },
      { role: "designer", ts: "14:08", body: "Done. Cover with name in 28pt Caslon, centered below title. Resolved." },
    ],
  },
  {
    id: "THR-011", from: "cmo", to: "marketing",
    topic: "Launch tweet thread — final copy review",
    status: "active", parentTicket: "TKT-0149", startedAt: "14:05", lastAt: "14:24",
    turns: [
      { role: "cmo",       ts: "14:05", body: "Read the draft. Strong hook, but tweet 2 is doing too much — split it into a 2a/2b. Also drop the exclamation mark, you know the rule." },
      { role: "marketing", ts: "14:14", body: "Splitting now. Re: exclamation — it's in the customer quote we pulled from the beta. Keep or rewrite the quote?" },
      { role: "cmo",       ts: "14:17", body: "Keep the quote verbatim. Rule is for our voice, not theirs. Just don't lead with it." },
      { role: "marketing", ts: "14:20", body: "Updated. Now reads: hook -> product shot -> customer quote -> CTA. Want to glance before I schedule?" },
      { role: "cmo",       ts: "14:22", body: "Send the link. Approving inline if it's clean." },
      { role: "marketing", ts: "14:24", body: "Posted to the review channel. Standing by." },
    ],
  },
  {
    id: "THR-010", from: "developer", to: "cto",
    topic: "Stripe webhook signature verification failing",
    status: "blocked", parentTicket: "TKT-0142", startedAt: "13:31", lastAt: "14:07",
    turns: [
      { role: "developer", ts: "13:31", body: "Hitting StripeSignatureVerificationError on every webhook in staging. Local works fine. I checked the secret env var, it's loaded." },
      { role: "cto",       ts: "13:38", body: "Probably your body parser. Stripe needs the raw bytes — if Next.js parses to JSON before verification, the signature breaks." },
      { role: "developer", ts: "13:52", body: "That was it on local, but staging still fails even with bodyParser: false. Vercel might be re-parsing." },
      { role: "cto",       ts: "14:00", body: "Confirmed — Vercel edge runtime parses by default. Switch the route to runtime: nodejs and read the raw stream." },
      { role: "developer", ts: "14:07", body: "Switched. Still failing — getting a different error now: stream reads as empty. Blocking on this; opened an issue with Vercel support." },
    ],
  },
  {
    id: "THR-009", from: "ceo", to: "cto",
    topic: "Capacity check — ship personalisation by Fri?",
    status: "active", parentTicket: "TKT-0151", startedAt: "13:20", lastAt: "13:44",
    turns: [
      { role: "ceo", ts: "13:20", body: "Investor call Friday. Can personalisation v1 (name on cover + dedication page) be live by EOD Thursday?" },
      { role: "cto", ts: "13:44", body: "Cover-name is done modulo Designer's last review. Dedication page needs a new template + a flag in the print job — 1.5 days of Developer time. Tight but doable if we cut the audio narration scope." },
    ],
  },
  {
    id: "THR-008", from: "marketing", to: "designer",
    topic: "Need 1080x1920 hero for launch story",
    status: "active", parentTicket: "TKT-0146", startedAt: "13:55", lastAt: "14:12",
    turns: [
      { role: "marketing", ts: "13:55", body: "Need a vertical hero for the IG/TikTok launch — 1080x1920, focal point in the upper third." },
      { role: "designer",  ts: "14:02", body: "Reusing cover art for Brave Little Mouse? Or want a brand-only composition?" },
      { role: "marketing", ts: "14:08", body: "Cover art, but with the kid's photo composited in. We're leaning on the personalisation angle." },
      { role: "designer",  ts: "14:12", body: "Got it. Pulling a stock kid photo as placeholder — you'll swap in real customer photos at send time. EOD." },
    ],
  },
];

export const SEED_REVENUE_TICKS = [12.50, 24.95, 24.95, 49.90, 49.90, 74.85, 99.80, 99.80, 124.75, 174.65, 199.60, 249.50, 274.45, 299.40, 349.30, 374.25, 404.20, 429.13];
