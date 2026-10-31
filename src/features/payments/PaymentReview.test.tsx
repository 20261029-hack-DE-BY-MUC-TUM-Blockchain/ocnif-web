import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { PaymentReview } from "./PaymentReview";
import { type Attempt, attemptId } from "./protocol/journal";
import type { Challenge } from "./protocol/x402";
import type { usePaymentFlow } from "./usePaymentFlow";

const challenge: Challenge = {
  resource: "https://example.test/CVE-2021-44228",
  endpoint: "/api/v1/vulnerabilities/CVE-2021-44228",
  requestedAt: Date.now(),
  required: {
    x402Version: 2,
    resource: { url: "https://example.test/CVE-2021-44228" },
    accepts: [],
  },
  selected: {
    scheme: "exact",
    network: "eip155:84532",
    asset: `0x${"1".repeat(40)}`,
    payTo: `0x${"2".repeat(40)}`,
    amount: "10000",
    maxTimeoutSeconds: 60,
    extra: {},
  },
};
const payer = `0x${"3".repeat(40)}`;
const id = attemptId(challenge, payer);
function render(
  attempt: Attempt,
  recovery: ReturnType<typeof usePaymentFlow>["recovery"],
) {
  const flow = {
    challenge,
    attempt,
    recovery,
    busy: false,
    error: false,
    storageBlocked: false,
    result: null,
    newAttempt: async () =>
      assert.fail("Rendering cannot request new payment terms"),
    retrySameProof: async () =>
      assert.fail("Rendering cannot submit a payment proof"),
  } as unknown as ReturnType<typeof usePaymentFlow>;
  return renderToStaticMarkup(
    <PaymentReview
      flow={flow}
      payer={payer}
      approve={() => assert.fail("Rendering cannot sign a payment")}
    />,
  );
}

test("a rejected payment offers fresh terms without exposing a second signing control", () => {
  const attempt: Attempt = {
    id,
    challenge,
    state: "rejected",
    rejection: "wallet_user_rejected_before_proof",
    createdAt: 1,
  };
  const html = render(attempt, "wallet_rejected");
  assert.match(html, /Request a new reviewed attempt/);
  assert.doesNotMatch(html, /Approve these terms and sign in wallet/);
  assert.doesNotMatch(html, /Retry the same signed proof/);
});

test("an uncertain signed attempt only offers its saved proof, never a fresh payment", () => {
  const html = render(
    {
      id,
      challenge,
      state: "review_required",
      proof: "saved-proof",
      createdAt: 1,
    },
    null,
  );
  assert.match(html, /Retry the same signed proof/);
  assert.doesNotMatch(html, /Request a new reviewed attempt/);
  assert.doesNotMatch(html, /Approve these terms and sign in wallet/);
});

test("a persisted fresh review retains old settlement history while requiring a separate signature", () => {
  const previous: Attempt = {
    id,
    challenge,
    state: "settled",
    proof: "private-saved-proof",
    createdAt: 1,
    result: {
      delivered: true,
      body: { synthetic: true },
      settlement: {
        success: true,
        network: "eip155:84532",
        transaction: `0x${"4".repeat(64)}`,
      },
    },
  };
  const html = render(
    {
      id: previous.id,
      challenge,
      state: "reviewing",
      generation: 1,
      createdAt: 2,
      history: [previous],
    },
    null,
  );
  assert.match(html, /Previous attempts/);
  assert.match(html, new RegExp(`0x${"4".repeat(64)}`));
  assert.match(html, /No new signature or payment has been requested/);
  assert.match(html, /Approve these terms and sign in wallet/);
  assert.doesNotMatch(html, /private-saved-proof/);
});
