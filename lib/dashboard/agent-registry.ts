import type { RoleKey } from "./constants";

export type ToolCategory = "ticket" | "sandbox" | "search" | "communication" | "skill";

export interface ToolMeta {
  name: string;
  description: string;
  category: ToolCategory;
}

export interface SkillMeta {
  name: string;
  description: string;
}

export interface AgentDetail {
  id: RoleKey;
  model: string;
  maxSteps: number;
  entryType: "ticket" | "chat";
  composioIntegrations: string[];
  tools: ToolMeta[];
  skills: SkillMeta[];
}

const EXA_SEARCH: ToolMeta = {
  name: "exaSearch",
  description:
    "Search the web for market research, competitor analysis, technical documentation, and current information.",
  category: "search",
};

const LOAD_SKILL: ToolMeta = {
  name: "loadSkill",
  description:
    "Load a skill's full instructions by name. Use when a task matches an available skill.",
  category: "skill",
};

export const AGENT_REGISTRY: Record<string, AgentDetail> = {
  ceo: {
    id: "ceo",
    model: "gpt-5.4",
    maxSteps: 20,
    entryType: "chat",
    composioIntegrations: ["slack", "googlesheets", "googledocs", "linear"],
    tools: [
      {
        name: "createTicket",
        description:
          "Create a new ticket. Assign engineering tickets to CTO, design/marketing tickets to CMO. Status is always backlog.",
        category: "ticket",
      },
      {
        name: "assignTicket",
        description:
          "Assign or reassign a ticket to an agent. CEO delegates to CTO or CMO only.",
        category: "ticket",
      },
      {
        name: "updateTicketStatus",
        description:
          "Move a ticket through workflow states: backlog → in_progress → in_review → resolved.",
        category: "ticket",
      },
      {
        name: "addComment",
        description:
          "Add strategic context, feedback, or review notes to a ticket.",
        category: "ticket",
      },
      {
        name: "getTicketsByStatus",
        description:
          "Query tickets by status for pipeline visibility. Use to understand workload and progress.",
        category: "ticket",
      },
      {
        name: "getTicketsByAssignee",
        description:
          "See what a specific agent is working on. Check workload before assigning new work.",
        category: "ticket",
      },
      {
        name: "reviewArtifact",
        description:
          "Review completed work on a ticket — fetches ticket details, all comments, and attached artifacts.",
        category: "ticket",
      },
      {
        name: "createSubTicket",
        description:
          "Break a ticket into sub-tasks. Max depth: 3 levels. Use for large work items that need decomposition.",
        category: "ticket",
      },
      LOAD_SKILL,
      {
        name: "askQuestion",
        description:
          "Present a structured question to the user with selectable options. The workflow pauses until the user answers.",
        category: "communication",
      },
      EXA_SEARCH,
    ],
    skills: [
      {
        name: "business-idea-intake",
        description:
          "Structured deep-dive for understanding a new business idea before planning. Use when the user first describes what they want to build.",
      },
    ],
  },

  cto: {
    id: "cto",
    model: "gpt-4o",
    maxSteps: 15,
    entryType: "ticket",
    composioIntegrations: ["github", "sentry", "slack", "linear"],
    tools: [
      {
        name: "getTicketDetails",
        description:
          "Fetch full ticket context including description, parent ticket, sub-tickets, comments, and artifacts. Always call this first when assigned a ticket.",
        category: "ticket",
      },
      {
        name: "createSubTicket",
        description:
          "Break a ticket into implementation sub-tasks. Assign to 'Developer' only. Max 5 sub-tickets per decomposition. Include clear acceptance criteria.",
        category: "ticket",
      },
      {
        name: "assignTicket",
        description: "Assign or reassign a ticket. CTO delegates to 'Developer' only.",
        category: "ticket",
      },
      {
        name: "updateTicketStatus",
        description:
          "Move a ticket through workflow states: backlog → in_progress → in_review → resolved.",
        category: "ticket",
      },
      {
        name: "addComment",
        description:
          "Add architecture guidance, technical feedback, or review notes to a ticket.",
        category: "ticket",
      },
      {
        name: "reviewArtifact",
        description:
          "Review completed work on a ticket — fetches ticket details, all comments, and attached artifacts. Use to approve or request changes.",
        category: "ticket",
      },
      {
        name: "getTicketsByAssignee",
        description:
          "See what a specific agent is working on. Check Developer workload before assigning new tasks.",
        category: "ticket",
      },
      {
        name: "getTicketsByTag",
        description:
          "Query tickets by domain tag to understand engineering workload and priorities.",
        category: "ticket",
      },
      LOAD_SKILL,
      EXA_SEARCH,
    ],
    skills: [
      {
        name: "architecture-review",
        description:
          "Used when CTO needs to review technical feasibility of a ticket. Reviews ticket, assesses complexity, identifies risks, defines architecture approach, adds guidance comment, creates sub-tickets for Developer.",
      },
      {
        name: "ticket-decomposition",
        description:
          "Used when breaking a large engineering ticket into implementation tasks. Analyzes scope, identifies subtasks (max 5), assigns each to Developer with clear acceptance criteria.",
      },
    ],
  },

  cmo: {
    id: "cmo",
    model: "gpt-5.4",
    maxSteps: 15,
    entryType: "ticket",
    composioIntegrations: ["googleanalytics", "slack"],
    tools: [
      {
        name: "getTicketDetails",
        description:
          "Fetch full ticket context including description, parent ticket, sub-tickets, comments, and artifacts. Always call this first when assigned a ticket.",
        category: "ticket",
      },
      {
        name: "createTicket",
        description:
          "Create a new marketing or design ticket. Assign design work to 'Designer', content/distribution work to 'Marketing'.",
        category: "ticket",
      },
      {
        name: "assignTicket",
        description:
          "Assign or reassign a ticket. CMO delegates to 'Designer' or 'Marketing' only.",
        category: "ticket",
      },
      {
        name: "updateTicketStatus",
        description:
          "Move a ticket through workflow states: backlog → in_progress → in_review → resolved.",
        category: "ticket",
      },
      {
        name: "addComment",
        description:
          "Add marketing strategy, campaign briefs, feedback, or review notes to a ticket.",
        category: "ticket",
      },
      {
        name: "reviewArtifact",
        description:
          "Review completed work on a ticket — fetches ticket details, all comments, and attached artifacts.",
        category: "ticket",
      },
      {
        name: "getTicketsByAssignee",
        description:
          "See what a specific agent is working on. Check Designer and Marketing workload before assigning new tasks.",
        category: "ticket",
      },
      {
        name: "getTicketsByTag",
        description:
          "Query tickets by domain tag to understand marketing and design workload.",
        category: "ticket",
      },
      LOAD_SKILL,
      EXA_SEARCH,
    ],
    skills: [
      {
        name: "go-to-market-planning",
        description:
          "Used when CMO receives a marketing strategy ticket. Analyzes the product/feature, defines target audience, identifies channels, drafts campaign strategy, creates sub-tickets for Designer and Marketing.",
      },
      {
        name: "content-strategy",
        description:
          "Used when CMO needs to plan content around a theme or launch. Defines content pillars, plans formats (blog, social, email), sets KPIs, creates sub-tickets.",
      },
      {
        name: "campaign-design",
        description:
          "Used when designing a specific marketing campaign — defines goal, audience, channels, messaging hierarchy, KPIs, and creates briefs for Designer and Marketing agents.",
      },
    ],
  },

  developer: {
    id: "developer",
    model: "gpt-5.4",
    maxSteps: 30,
    entryType: "ticket",
    composioIntegrations: ["github", "vercel"],
    tools: [
      {
        name: "getTicketDetails",
        description:
          "Read full ticket context including parent ticket, sub-tickets, comments, artifacts, and agent logs.",
        category: "ticket",
      },
      {
        name: "updateTicketStatus",
        description:
          "Move a ticket through the workflow: in_progress when starting, in_review when handing off. Set reason if blocked.",
        category: "ticket",
      },
      {
        name: "addComment",
        description:
          "Add a progress note, decision, or hand-off comment to a ticket.",
        category: "ticket",
      },
      {
        name: "addArtifact",
        description:
          "Attach a deliverable to a ticket. Use type 'pr' for pull requests, 'deployment' for preview URLs, 'document' for docs.",
        category: "ticket",
      },
      {
        name: "markBlocked",
        description:
          "Mark a ticket as blocked with a clear reason. Auto-escalates to the CTO after 5 minutes. Use only when truly stuck.",
        category: "ticket",
      },
      LOAD_SKILL,
      {
        name: "runShell",
        description:
          "Run a shell command inside the isolated E2B sandbox. Use for build/test/lint, package installs, git clone/push, and file system operations.",
        category: "sandbox",
      },
      {
        name: "runCode",
        description:
          "Execute a code snippet in the sandbox's interpreter. Use for quick computations, data processing, or generating output.",
        category: "sandbox",
      },
      {
        name: "readFile",
        description:
          "Read a file from the sandbox file system. Use to inspect output or verify code.",
        category: "sandbox",
      },
      {
        name: "writeFile",
        description:
          "Write a file to the sandbox file system. Overwrites if the file exists. Use to scaffold code or test fixtures.",
        category: "sandbox",
      },
    ],
    skills: [
      {
        name: "feature-implementation",
        description:
          "End-to-end process for implementing a new feature from a ticket. Use when assigned a ticket that requires building something new.",
      },
      {
        name: "bug-fix",
        description:
          "Systematic process for diagnosing and fixing bugs. Use when assigned a ticket that describes broken behavior or an error.",
      },
      {
        name: "code-review-response",
        description:
          "Process for addressing code review feedback on a PR. Use when a ticket's comments contain review feedback that needs to be resolved.",
      },
    ],
  },

  designer: {
    id: "designer",
    model: "gpt-5.4",
    maxSteps: 20,
    entryType: "ticket",
    composioIntegrations: ["figma", "cloudinary"],
    tools: [
      {
        name: "getTicketDetails",
        description:
          "Fetch full details of a ticket including comments, artifacts, and logs.",
        category: "ticket",
      },
      {
        name: "updateTicketStatus",
        description: "Update the status of a ticket and log the action.",
        category: "ticket",
      },
      {
        name: "addComment",
        description: "Add a comment to a ticket.",
        category: "ticket",
      },
      {
        name: "addArtifact",
        description:
          "Add an artifact (design file, image, document, etc.) to a ticket.",
        category: "ticket",
      },
      {
        name: "markBlocked",
        description: "Mark a ticket as blocked with a reason.",
        category: "ticket",
      },
      EXA_SEARCH,
    ],
    skills: [
      {
        name: "design-workflow",
        description:
          "Used when Designer picks up a design ticket. Guides the full design process from ticket intake through design decisions, accessibility, and responsive behavior to review-ready artifacts.",
      },
    ],
  },

  marketing: {
    id: "marketing",
    model: "gpt-5.4",
    maxSteps: 20,
    entryType: "ticket",
    composioIntegrations: ["twitter", "linkedin", "mailchimp"],
    tools: [
      {
        name: "getTicketDetails",
        description:
          "Fetch full details of a ticket including comments, artifacts, and logs.",
        category: "ticket",
      },
      {
        name: "updateTicketStatus",
        description: "Update the status of a ticket and log the action.",
        category: "ticket",
      },
      {
        name: "addComment",
        description: "Add a comment to a ticket.",
        category: "ticket",
      },
      {
        name: "addArtifact",
        description:
          "Add an artifact (published URL, document, image, etc.) to a ticket.",
        category: "ticket",
      },
      {
        name: "markBlocked",
        description: "Mark a ticket as blocked with a reason.",
        category: "ticket",
      },
      EXA_SEARCH,
    ],
    skills: [
      {
        name: "content-workflow",
        description:
          "Used when Marketing picks up a content ticket. Covers blog posts, social copy, and email campaigns from intake to review.",
      },
      {
        name: "seo-workflow",
        description:
          "Used for SEO-focused content tickets. Covers keyword research, SEO-optimized writing, and meta data.",
      },
    ],
  },
};

export const TOOL_CATEGORY_STYLES: Record<
  ToolCategory,
  { label: string; bg: string; fg: string }
> = {
  ticket:        { label: "Ticket",        bg: "#1F2A45", fg: "#9DB4F0" },
  sandbox:       { label: "Sandbox",       bg: "#2A1F0F", fg: "#E08A3C" },
  search:        { label: "Search",        bg: "#16321F", fg: "#7FCFA0" },
  communication: { label: "Communication", bg: "#281A3F", fg: "#C09AE8" },
  skill:         { label: "Skill",         bg: "#2A2208", fg: "#F2C744" },
};
