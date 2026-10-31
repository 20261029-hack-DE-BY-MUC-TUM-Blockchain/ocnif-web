import { type NextRequest, NextResponse } from "next/server";
import {
  bsvOverlayUrl,
  publicAppOrigin,
  voiceApiOrigin,
  walletConnectOrigins,
} from "@/lib/config";
export function proxy(request: NextRequest) {
  const nonce = Buffer.from(
    crypto.getRandomValues(new Uint8Array(16)),
  ).toString("base64");
  const voice = voiceApiOrigin();
  const origin = publicAppOrigin();
  const websocket = origin?.replace(/^http/, "ws");
  const wallets = walletConnectOrigins().join(" ");
  const chainProviders = [bsvOverlayUrl()]
    .filter((value): value is string => !!value)
    .map((value) => new URL(value).origin)
    .join(" ");
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'nonce-${nonce}'`,
    "img-src 'self' data:",
    "font-src 'self'",
    `connect-src 'self'${websocket ? ` ${websocket}` : ""}${voice ? ` ${voice}` : ""} ${wallets} ${chainProviders}`,
    "media-src 'self' blob:",
    "worker-src 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "report-uri /csp-report",
    "report-to csp",
  ].join("; ");
  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", csp);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("Cache-Control", "no-store");
  if (origin)
    response.headers.set(
      "Reporting-Endpoints",
      `csp="${new URL("/csp-report", origin).href}"`,
    );
  return response;
}
export const config = {
  matcher: [
    "/((?!api|bsv|arc-ingest|cardano-provider|_next/static|_next/image|favicon.ico|icon|manifest.json|sw.js|offline|health|csp-report).*)",
  ],
};
