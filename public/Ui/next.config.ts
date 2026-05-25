import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: __dirname
  },
  async rewrites() {
    const agentOrigin = process.env.AGENT_ORIGIN || "http://localhost:3000";
    const naukriAgentOrigin = process.env.NAUKRI_AGENT_ORIGIN || agentOrigin;

    return [
      {
        source: "/legacy-agent",
        destination: agentOrigin
      },
      {
        source: "/api/naukri/:path*",
        destination: `${naukriAgentOrigin}/api/naukri/:path*`
      },
      {
        source: "/styles.css",
        destination: `${agentOrigin}/styles.css`
      },
      {
        source: "/app.js",
        destination: `${agentOrigin}/app.js`
      },
      {
        source: "/api/:path*",
        destination: `${agentOrigin}/api/:path*`
      }
    ];
  }
};

export default nextConfig;
