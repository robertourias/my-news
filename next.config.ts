import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["rss-parser", "node-cron"],
  // Garante que o prompt fixo seja incluído no build standalone (Docker)
  outputFileTracingIncludes: {
    "/**": ["./prompts/**"],
  },
};

export default nextConfig;
