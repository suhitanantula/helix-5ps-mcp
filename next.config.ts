import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ship markdown content with the serverless function.
  outputFileTracingIncludes: {
    "/mcp": ["./content/**/*"],
  },
};

export default nextConfig;
