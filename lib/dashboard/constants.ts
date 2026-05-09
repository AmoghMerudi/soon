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
  user:      { label: "You",       initial: "U", color: "#FAFAF7", fg: "#0F0E0C" },
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

export const SEED_REVENUE_TICKS = [12.50, 24.95, 24.95, 49.90, 49.90, 74.85, 99.80, 99.80, 124.75, 174.65, 199.60, 249.50, 274.45, 299.40, 349.30, 374.25, 404.20, 429.13];
