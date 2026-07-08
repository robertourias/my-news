import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["rss-parser", "node-cron"],
  // permite acessar o dev server (next dev) via localhost:3030 e via o subdomínio
  // (ex.: tunnel/proxy apontando pra máquina local) sem o bloqueio de cross-origin
  allowedDevOrigins: ["localhost:3030", "news.nico.dev.br"],
  // Garante que o prompt fixo seja incluído no build standalone (Docker)
  outputFileTracingIncludes: {
    "/**": ["./prompts/**"],
  },
};

export default nextConfig;
