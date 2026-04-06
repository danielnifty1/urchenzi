  import type { NextConfig } from "next";

  const nextConfig: NextConfig = {
    turbopack: {
      root: process.cwd(),
    },
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
