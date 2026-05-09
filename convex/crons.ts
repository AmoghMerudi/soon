import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "auto-escalate blocked tickets",
  { seconds: 60 },
  internal.escalation.checkBlocked,
  {}
);

export default crons;
