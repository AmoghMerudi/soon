import { recallMemories, saveMemory, memoryUserId } from "@/lib/agents/mem0";

const PROJECT_A = "k97adakkkj5mvsyd0tgkr9zg5n86dc5b";
const PROJECT_B = "zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz";
const AGENT = "ceo";
const FACT = `Mem0 isolation test ${Date.now()}: I prefer git branches named "feat/" prefixed when working on features.`;

const log = (s: string) => console.log(s);

async function pollRecall(
  projectId: string,
  query: string,
  predicate: (memories: { memory: string }[]) => boolean,
  maxWaitMs: number
) {
  const start = Date.now();
  let attempt = 0;
  let last: { memory: string }[] = [];
  while (Date.now() - start < maxWaitMs) {
    attempt++;
    last = await recallMemories(projectId, AGENT, query, 10);
    if (predicate(last)) return { memories: last, attempt };
    await new Promise((r) => setTimeout(r, 3000));
  }
  return { memories: last, attempt };
}

async function main() {
  if (!process.env.MEM0_API_KEY) {
    console.error("MEM0_API_KEY not set");
    process.exit(1);
  }

  log(`save → user_id=${memoryUserId(PROJECT_A, AGENT)}`);
  const id = await saveMemory(PROJECT_A, AGENT, FACT, { category: "preference" });
  log(`  eventId=${id ?? "(null)"}`);
  if (!id) {
    console.error("save returned null");
    process.exit(1);
  }

  log(`recall A (polling up to 120s)…`);
  const { memories: inA, attempt } = await pollRecall(
    PROJECT_A,
    "git branch naming convention",
    (mems) =>
      mems.some(
        (m) =>
          m.memory.toLowerCase().includes("feat/") ||
          m.memory.toLowerCase().includes("branch")
      ),
    120_000
  );
  log(`  attempts=${attempt}, found ${inA.length} memories`);
  for (const m of inA) log(`  - ${m.memory}`);

  log(`recall B (should be empty) → user_id=${memoryUserId(PROJECT_B, AGENT)}`);
  const inB = await recallMemories(PROJECT_B, AGENT, "git branch naming convention", 10);
  for (const m of inB) log(`  - LEAK: ${m.memory}`);
  if (inB.length === 0) log("  (empty — isolation OK)");

  const hit = inA.some(
    (m) => m.memory.toLowerCase().includes("feat/") || m.memory.toLowerCase().includes("branch")
  );
  if (!hit) {
    console.error("FAIL: project A did not surface the saved memory in 120s");
    process.exit(1);
  }
  if (inB.length > 0) {
    console.error("FAIL: project B leaked memories from project A");
    process.exit(1);
  }
  log("\nOK — save, recall, and (project, agent) isolation all working.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
