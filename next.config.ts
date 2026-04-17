  import { loadEnvConfig } from "@next/env";
  import type { NextConfig } from "next";

  loadEnvConfig(process.cwd());

  const nextConfig: NextConfig = {
    /** Lets HMR / dev assets load when you open the app via LAN IP (e.g. phone), not only localhost. */
    allowedDevOrigins: ["172.20.10.4","172.20.10.3","172.20.80.1"],
    /** Dev proxy is `app/api/v1/[[...path]]/route.ts` (more reliable than rewrites for LAN testing). */
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
        {
          protocol: "https",
          hostname: "res.cloudinary.com",
        },
      ],
    },
  };

  export default nextConfig;
