  import { loadEnvConfig } from "@next/env";
  import type { NextConfig } from "next";

  loadEnvConfig(process.cwd());

  const nextConfig: NextConfig = {
    async headers() {
      return [
        {
          source: "/:path*",
          headers: [
            {
              key: "Cross-Origin-Opener-Policy",
              value: "same-origin-allow-popups",
            },
          ],
        },
      ];
    },
    images: {
      remotePatterns: [
        {
          protocol: "https",
          hostname: "images.unsplash.com",
        },
      ],
    },
  };

  export default nextConfig;
