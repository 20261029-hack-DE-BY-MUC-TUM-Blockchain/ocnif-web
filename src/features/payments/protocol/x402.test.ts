import assert from "node:assert/strict";
import { test } from "node:test";
import { encodePaymentRequiredHeader } from "@x402/core/http";
import type { PaymentRequired } from "@x402/core/types";
import { assertFresh, readChallenge } from "./x402";

const fixture: PaymentRequired = {
  x402Version: 2,
  resource: { url: "https://example.test/report" },
  accepts: [
    {
      scheme: "exact",
      network: "eip155:84532",
      asset: `0x${"1".repeat(40)}`,
      amount: "10000",
      payTo: `0x${"2".repeat(40)}`,
      maxTimeoutSeconds: 60,
      extra: { name: "USDC", version: "2" },
    },
  ],
};
test("payment review rejects a different chain or approval mechanism", () => {
  const valid = readChallenge(
    encodePaymentRequiredHeader(fixture),
    "eip155:84532",
    "/api/v1/vulnerabilities/CVE-2021-44228",
  );
  assert.equal(valid.selected.amount, "10000");
  assert.throws(() =>
    readChallenge(
      encodePaymentRequiredHeader(fixture),
      "cardano:preprod",
      "/paid/reports/example",
    ),
  );
  assert.throws(() =>
    readChallenge(
      encodePaymentRequiredHeader({
        ...fixture,
        accepts: [
          { ...fixture.accepts[0], extra: { assetTransferMethod: "permit2" } },
        ],
      }),
      "eip155:84532",
      "/api/example",
    ),
  );
});
test("stale review must not reach wallet signing", () => {
  const challenge = readChallenge(
    encodePaymentRequiredHeader(fixture),
    "eip155:84532",
    "/api/example",
  );
  challenge.requestedAt = 0;
  assert.throws(() => assertFresh(challenge));
});
