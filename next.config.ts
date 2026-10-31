import type { NextConfig } from "next";
import { apiBaseUrl, bsvBaseUrl, cardanoBaseUrl } from "./src/lib/config";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: [
    "ocnif-bc-bsv",
    "ocnif-bc-cardano-client",
    "ocnif-bc-api3-client",
  ],
  reactCompiler: true,
  productionBrowserSourceMaps: false,
  async rewrites() {
    const api = apiBaseUrl();
    const cardano = cardanoBaseUrl();
    const bsv = bsvBaseUrl();
    return [
      ...(api
        ? [{ source: "/api/:path*", destination: `${api}/api/:path*` }]
        : []),
      ...(cardano
        ? [{ source: "/paid/:path*", destination: `${cardano}/v1/:path*` }]
        : []),
      ...(bsv
        ? [
            { source: "/bsv/:path*", destination: `${bsv}/:path*` },
            { source: "/arc-ingest", destination: `${bsv}/arc-ingest` },
          ]
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
