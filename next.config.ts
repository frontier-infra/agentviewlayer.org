import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  poweredByHeader: false,
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
