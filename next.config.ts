import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
  webpack: (config) => {
    config.ignoreWarnings = config.ignoreWarnings || [];
    config.ignoreWarnings.push({
      module: /@supabase\/realtime-js\/dist\/module\/lib\/websocket-factory\.js/,
      message: /Critical dependency: the request of a dependency is an expression/,
    });
    return config;
  },
};

export default nextConfig;
