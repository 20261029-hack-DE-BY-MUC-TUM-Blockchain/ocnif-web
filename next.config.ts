import type { NextConfig } from "next";
import { apiBaseUrl, cardanoBaseUrl } from "./src/lib/config";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["ocnif-bc-bsv"],
  reactCompiler: true,
  productionBrowserSourceMaps: false,
  async rewrites() {
    const api = apiBaseUrl();
    const cardano = cardanoBaseUrl();
    return [
      ...(api
        ? [{ source: "/api/:path*", destination: `${api}/api/:path*` }]
        : []),
      ...(cardano
        ? [{ source: "/paid/:path*", destination: `${cardano}/v1/:path*` }]
        : []),
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(self), geolocation=(), payment=(), usb=(), browsing-topics=()",
          },
        ],
      },
    ];
  },
};
// Microphone access is limited to this origin for the explicit voice-start control.
export default nextConfig;
