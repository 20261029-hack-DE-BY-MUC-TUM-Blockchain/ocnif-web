import type {
  AccessChallenge,
  MintIntent,
  PublishedReport,
  ReportOffer,
  ReportQuote,
} from "ocnif-bc-bsv";
import { reportDigest } from "ocnif-bc-bsv";
import { isReportId } from "@/lib/types/publication";
import { parseCard, record } from "@/lib/types/runtime";
import { parseOffer } from "./swapInput";

export type BsvConnection = Awaited<
  ReturnType<typeof import("ocnif-bc-bsv").connectWallet>
>;
export type MarketConfig = {
  network: "mainnet" | "testnet";
  overlayUrl: string;
  merchantIdentityKey: string | null;
  issuerIdentityKey: string | null;
  paymentStatus: "ready" | "setup_required";
  passStatus: "ready" | "setup_required";
};
export type HeldPass = {
  reportId: string;
  reportDigest: string;
  tokenId: string;
  outpoint: string;
  keyIndex: number;
};
export type Registration = {
  tokenId: string;
  reportId: string;
  reportDigest: string;
  status: "registered";
};
const identity = (value: unknown): value is string =>
  typeof value === "string" && /^0[23][a-f0-9]{64}$/i.test(value);
const digest = (value: unknown): value is string =>
  typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
export const validOutpoint = (value: unknown): value is string =>
  typeof value === "string" &&
  /^[a-f0-9]{64}\.(0|[1-9][0-9]{0,9})$/.test(value) &&
  Number(value.split(".")[1]) <= 0xffffffff;
export const validKeyIndex = (value: unknown): value is number =>
  Number.isSafeInteger(value) &&
  Number(value) >= 0 &&
  Number(value) <= 2147483647;

function exact(value: unknown, fields: string[]) {
  const object = record(value);
  if (
    Object.keys(object).length !== fields.length ||
    Object.keys(object).some((key) => !fields.includes(key))
  )
    throw new Error("invalid_market_response");
  return object;
}

export function parseMarketConfig(
  value: unknown,
  expectedOverlay: string,
): MarketConfig {
  const data = exact(value, [
    "network",
    "overlayUrl",
    "merchantIdentityKey",
    "issuerIdentityKey",
    "paymentStatus",
    "passStatus",
  ]);
  if (
    !["mainnet", "testnet"].includes(String(data.network)) ||
    data.overlayUrl !== expectedOverlay ||
    (data.merchantIdentityKey !== null &&
      !identity(data.merchantIdentityKey)) ||
    (data.issuerIdentityKey !== null && !identity(data.issuerIdentityKey)) ||
    data.paymentStatus !==
      (data.merchantIdentityKey ? "ready" : "setup_required") ||
    data.passStatus !== (data.issuerIdentityKey ? "ready" : "setup_required")
  )
    throw new Error("invalid_market_config");
  return data as MarketConfig;
}

export function parseReportQuote(
  value: unknown,
  reportId: string,
  config: MarketConfig,
): ReportQuote {
  const data = exact(value, [
    "id",
    "reportId",
    "title",
    "recipientIdentityKey",
    "satoshis",
    "network",
    "expiresAt",
    "reportDigest",
  ]);
  if (
    !isReportId(data.id) ||
    data.reportId !== reportId ||
    typeof data.title !== "string" ||
    data.title.length > 512 ||
    data.network !== config.network ||
    !identity(data.recipientIdentityKey) ||
    data.recipientIdentityKey !== config.merchantIdentityKey ||
    !Number.isSafeInteger(data.satoshis) ||
    Number(data.satoshis) < 1 ||
    !Number.isSafeInteger(data.expiresAt) ||
    Number(data.expiresAt) <= 0 ||
    !digest(data.reportDigest)
  )
    throw new Error("invalid_report_quote");
  return data as unknown as ReportQuote;
}

export function parseMintIntent(
  value: unknown,
  reportId: string,
  config: MarketConfig,
): MintIntent {
  const data = exact(value, [
    "id",
    "reportId",
    "reportDigest",
    "issuerIdentityKey",
    "network",
    "keyIndex",
  ]);
  if (
    !isReportId(data.id) ||
    data.reportId !== reportId ||
    !digest(data.reportDigest) ||
    data.network !== config.network ||
    !identity(data.issuerIdentityKey) ||
    data.issuerIdentityKey !== config.issuerIdentityKey ||
    !validKeyIndex(data.keyIndex)
  )
    throw new Error("invalid_mint_intent");
  return data as unknown as MintIntent;
}

export function parseReportOffers(
  value: unknown,
  reportId: string,
  config: MarketConfig,
): ReportOffer[] {
  const data = exact(value, ["offers", "requiresBothWallets"]);
  if (
    data.requiresBothWallets !== true ||
    !Array.isArray(data.offers) ||
    data.offers.length > 10
  )
    throw new Error("invalid_report_offers");
  return data.offers.map((value) => {
    const listing = exact(value, ["reportId", "reportDigest", "offer"]);
    const offer = parseOffer(listing.offer);
    if (
      listing.reportId !== reportId ||
      !digest(listing.reportDigest) ||
      offer.tokenAmount !== "1" ||
      offer.priceSatoshis > 100000000 ||
      offer.network !== config.network
    )
      throw new Error("invalid_report_offer");
    return { reportId, reportDigest: listing.reportDigest, offer };
  });
}

export function parseAccessChallenge(
  value: unknown,
  expected: {
    reportId: string;
    outpoint: string;
    holderIdentityKey: string;
    keyIndex: number;
  },
): AccessChallenge {
  const data = exact(value, [
    "id",
    "reportId",
    "reportDigest",
    "outpoint",
    "holderIdentityKey",
    "keyIndex",
    "expiresAt",
  ]);
  if (
    !isReportId(data.id) ||
    !digest(data.reportDigest) ||
    !validOutpoint(data.outpoint) ||
    !validKeyIndex(data.keyIndex) ||
    Object.entries(expected).some(([key, value]) => data[key] !== value) ||
    !Number.isSafeInteger(data.expiresAt) ||
    Number(data.expiresAt) <= Date.now()
  )
    throw new Error("invalid_access_challenge");
  return data as unknown as AccessChallenge;
}

export function parsePublishedReport(
  value: unknown,
  reportId: string,
  expectedDigest: string,
): PublishedReport {
  const data = exact(value, [
    "id",
    "title",
    "content",
    "cards",
    "created_at",
    "published_at",
    "source",
  ]);
  if (
    data.id !== reportId ||
    data.source !== "user-approved" ||
    typeof data.title !== "string" ||
    data.title.length > 512 ||
    typeof data.content !== "string" ||
    data.content.length > 500000 ||
    !Array.isArray(data.cards) ||
    data.cards.length > 100 ||
    !["string", "number"].includes(typeof data.created_at) ||
    !["string", "number"].includes(typeof data.published_at)
  )
    throw new Error("invalid_published_report");
  data.cards.forEach(parseCard);
  const report = data as unknown as PublishedReport;
  if (reportDigest(report) !== expectedDigest)
    throw new Error("published_report_digest_mismatch");
  return report;
}

export function parseRegistration(
  value: unknown,
  pass: HeldPass,
): Registration {
  const data = exact(value, ["tokenId", "reportId", "reportDigest", "status"]);
  if (
    data.status !== "registered" ||
    data.tokenId !== pass.tokenId ||
    data.reportId !== pass.reportId ||
    data.reportDigest !== pass.reportDigest
  )
    throw new Error("registration_mismatch");
  return data as Registration;
}

export function parseAccessDelivery(
  value: unknown,
  challenge: AccessChallenge,
): PublishedReport {
  const data = exact(value, ["report", "access", "confirmed"]);
  const access = exact(data.access, ["status", "outpoint"]);
  if (
    data.confirmed !== false ||
    access.status !== "overlay_owner_verified" ||
    access.outpoint !== challenge.outpoint
  )
    throw new Error("access_delivery_mismatch");
  return parsePublishedReport(
    data.report,
    challenge.reportId,
    challenge.reportDigest,
  );
}

export function parseListingResult(value: unknown, listing: ReportOffer): void {
  const data = exact(value, ["id", "status", "requiresBothWallets"]);
  if (
    data.id !== listing.offer.id ||
    data.status !== "listed" ||
    data.requiresBothWallets !== true
  )
    throw new Error("listing_response_mismatch");
}

export function marketBaseUrl(): string {
  return new URL("/bsv", window.location.origin).href;
}

export async function marketRequest(
  path: string,
  body?: unknown,
  signal?: AbortSignal,
): Promise<unknown> {
  if (
    !/^\/v1\/(config|reports\/[A-Za-z0-9_-]{1,100}\/(quote|pass-intent|offers|token-challenge|token-access)|passes|offers)$/.test(
      path,
    )
  )
    throw new Error("invalid_market_path");
  const response = await fetch(`/bsv${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers:
      body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
    redirect: "error",
    signal: signal ?? AbortSignal.timeout(30000),
  });
  if (!response.ok)
    throw new Error(
      response.status === 404
        ? "published_report_not_found"
        : response.status === 503
          ? "setup_required"
          : "market_request_rejected",
    );
  if (!response.body) throw new Error("empty_market_response");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.length;
      if (size > 2000000) throw new Error("market_response_too_large");
      chunks.push(chunk.value);
    }
  } finally {
    await reader.cancel();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return JSON.parse(new TextDecoder().decode(bytes));
}
