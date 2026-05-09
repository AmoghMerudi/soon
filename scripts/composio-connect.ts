/**
 * Connect a Composio entity (agent) to a toolkit (e.g. github).
 *
 * Usage:
 *   bun run scripts/composio-connect.ts <agentEntityId> <toolkitSlug>
 *
 * Example:
 *   bun run scripts/composio-connect.ts developer github
 *
 * Prints the OAuth URL the user must open in a browser. Once granted, the
 * connection becomes active and the agent's tools start working.
 */

import { authorizeAgentToolkit } from "@/lib/agents/composio";

async function main() {
  const [, , agentEntityId, toolkitSlug] = process.argv;
  if (!agentEntityId || !toolkitSlug) {
    console.error("Usage: bun run scripts/composio-connect.ts <agentEntityId> <toolkitSlug>");
    process.exit(1);
  }

  const req = await authorizeAgentToolkit(agentEntityId, toolkitSlug);
  console.log(`\nOpen this URL to grant ${toolkitSlug} access to entity "${agentEntityId}":\n`);
  console.log(req.redirectUrl ?? req);
  console.log("\nWaiting for connection to become active... (Ctrl+C to skip)\n");

  try {
    const connection = await req.waitForConnection();
    console.log(`Connection active: id=${connection.id} status=${connection.status}`);
  } catch (err) {
    console.error("Wait failed:", err);
    process.exit(1);
  }
}

main();
