import { withWorkflow } from "workflow/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow Cloudflare quick tunnels to reach the Next dev server.
  allowedDevOrigins: ["*.trycloudflare.com"],
};

export default withWorkflow(nextConfig);
