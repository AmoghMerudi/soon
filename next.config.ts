import { withWorkflow } from "workflow/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow Cloudflare quick tunnels to reach the Next dev server.
  allowedDevOrigins: ["*.trycloudflare.com"],
  // Packages with CommonJS internals or dynamic require() that the bundler
  // can't statically analyze. Leave them as real Node require()s at runtime.
  serverExternalPackages: [
    "@e2b/code-interpreter",
    "@composio/core",
    "@composio/vercel",
    "mem0ai",
  ],
};

export default withWorkflow(nextConfig);
