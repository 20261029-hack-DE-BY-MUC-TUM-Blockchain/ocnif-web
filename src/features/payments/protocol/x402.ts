import {
  decodePaymentRequiredHeader,
  decodePaymentResponseHeader,
} from "@x402/core/http";
import type {
  PaymentRequired,
  PaymentRequirements,
  SettleResponse,
} from "@x402/core/types";
import { record } from "@/lib/types/runtime";
export type Challenge = {
  required: PaymentRequired;
  selected: PaymentRequirements;
  endpoint: string;
  resource: string;
  requestedAt: number;
};
export type PaymentResult = {
  body: unknown;
  settlement: SettleResponse | null;
  delivered: boolean;
};
export function readChallenge(
  header: string,
  network: "eip155:84532" | "cardano:preprod",
  endpoint: string,
): Challenge {
  if (header.length > 65536) throw new Error("payment_challenge_too_large");
  const required = decodePaymentRequiredHeader(header);
  if (
    required.x402Version !== 2 ||
    !Array.isArray(required.accepts) ||
    required.accepts.length > 12
  )
    throw new Error("unsupported_payment_challenge");
  const selected = required.accepts.find(
    (item) => item.network === network && item.scheme === "exact",
  );
  if (
    !selected ||
    typeof selected.amount !== "string" ||
    !/^[1-9][0-9]{0,19}$/.test(selected.amount) ||
    !Number.isSafeInteger(selected.maxTimeoutSeconds) ||
    selected.maxTimeoutSeconds < 1 ||
    selected.maxTimeoutSeconds > 900 ||
    typeof selected.asset !== "string" ||
    typeof selected.payTo !== "string"
  )
    throw new Error("invalid_payment_requirements");
  const resource = required.resource?.url;
  if (
    typeof resource !== "string" ||
    resource.length > 2048 ||
    !/^https?:\/\//.test(resource)
  )
    throw new Error("invalid_payment_resource");
  if (
    network === "eip155:84532" &&
    (!/^0x[0-9a-fA-F]{40}$/.test(selected.asset) ||
      !/^0x[0-9a-fA-F]{40}$/.test(selected.payTo) ||
      ![undefined, "eip3009"].some(
        (value) => value === selected.extra?.assetTransferMethod,
      ))
  )
    throw new Error("unsupported_evm_payment");
  if (
    network === "cardano:preprod" &&
    (selected.asset !== "lovelace" ||
      !/^addr_test1[0-9a-z]{20,200}$/.test(selected.payTo) ||
      ![undefined, "default"].some(
        (value) => value === selected.extra?.assetTransferMethod,
      ))
  )
    throw new Error("unsupported_cardano_payment");
  return { required, selected, endpoint, resource, requestedAt: Date.now() };
}
export async function requestChallenge(
  endpoint: string,
  network: "eip155:84532" | "cardano:preprod",
) {
  const response = await fetch(endpoint, {
    credentials: "same-origin",
    cache: "no-store",
  });
  const body: unknown = await response.json();
  if (response.status !== 402)
    return {
      challenge: null,
      result: {
        body,
        settlement: null,
        delivered: response.ok,
      } as PaymentResult,
    };
  const header =
    response.headers.get("PAYMENT-REQUIRED") || record(body).paymentRequired;
  if (typeof header !== "string") throw new Error("missing_payment_challenge");
  return { challenge: readChallenge(header, network, endpoint), result: null };
}
export async function submitProof(
  challenge: Challenge,
  proof: string,
): Promise<PaymentResult> {
  const response = await fetch(challenge.endpoint, {
    method: challenge.endpoint.startsWith("/api/") ? "POST" : "GET",
    credentials: "same-origin",
    cache: "no-store",
    headers: { "PAYMENT-SIGNATURE": proof },
  });
  const body: unknown = await response.json();
  const encoded = response.headers.get("PAYMENT-RESPONSE");
  const settlement = encoded ? decodePaymentResponseHeader(encoded) : null;
  if (
    settlement &&
    (typeof settlement.success !== "boolean" ||
      typeof settlement.transaction !== "string" ||
      ((settlement.success || settlement.transaction) &&
        (settlement.network !== challenge.selected.network ||
          !/^(?:0x)?[0-9a-fA-F]{64}$/.test(settlement.transaction))))
  )
    throw new Error("invalid_settlement_receipt");
  return { body, settlement, delivered: response.ok };
}
export function assertFresh(challenge: Challenge) {
  if (
    Date.now() - challenge.requestedAt >
    Math.min(challenge.selected.maxTimeoutSeconds, 300) * 1000
  )
    throw new Error("payment_review_expired");
}
