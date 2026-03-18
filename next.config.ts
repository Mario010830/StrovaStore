import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    // Raíz del proyecto (donde están package.json y node_modules)
    root: ".",
  },
};

export default nextConfig;
