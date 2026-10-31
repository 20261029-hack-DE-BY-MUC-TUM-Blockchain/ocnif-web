import assert from "node:assert/strict";
import { test } from "node:test";
import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { bsvCopy, bsvEnglish } from "@/lib/i18n/bsv";
import { BsvReportControls } from "./BsvReportControls";

function syntheticState(): ComponentProps<typeof BsvReportControls>["market"] {
  return {
    quote: null,
    intent: null,
    wallet: null,
    busy: false,
    purchaseOperation: undefined,
    purchaseRecord: undefined,
    mintOperation: undefined,
    mintRecord: undefined,
    buy: async () => {},
    mint: async () => {},
    reconcileMint: async () => {},
    register: async () => {},
  };
}

test("saved synthetic purchase keeps the payment button disabled without another wallet invocation", () => {
  const state = syntheticState();
  const quote = {
    id: "quote-1",
    reportId: "report-1",
    title: "Synthetic report",
    recipientIdentityKey: `02${"11".repeat(32)}`,
    satoshis: 5,
    network: "testnet" as const,
    expiresAt: Date.now() + 60000,
    reportDigest: "ab".repeat(32),
  };
  state.quote = quote;
  state.purchaseOperation = {
    key: "synthetic-attempt",
    kind: "purchase",
    quote,
  };
  state.purchaseRecord = { status: "review_required", quote };
  let actions = 0;
  state.buy = async () => {
    actions += 1;
  };
  const html = renderToStaticMarkup(<BsvReportControls market={state} />);
  assert.match(html, /disabled=""[^>]*>Approve this report payment in wallet/);
  assert.match(html, /A second payment or mint is blocked/);
  assert.match(html, /review_required/);
  assert.equal(actions, 0);
});

test("pending synthetic mint offers reconciliation but cannot claim registration or block confirmation", () => {
  const state = syntheticState();
  const intent = {
    id: "mint-1",
    reportId: "report-1",
    reportDigest: "ab".repeat(32),
    issuerIdentityKey: `02${"11".repeat(32)}`,
    network: "testnet" as const,
    keyIndex: 0,
  };
  state.intent = intent;
  state.mintOperation = { key: "synthetic-mint", kind: "mint", intent };
  state.mintRecord = {
    status: "overlay_pending",
    intent,
    receipt: {
      intent,
      status: "overlay_pending",
      confirmed: false,
      tokenId: `${"cd".repeat(32)}_0`,
      outpoint: `${"cd".repeat(32)}.0`,
      txid: "cd".repeat(32),
      transaction: [],
    },
  };
  const html = renderToStaticMarkup(<BsvReportControls market={state} />);
  assert.match(html, /Reconcile the same minted transaction/);
  assert.match(html, /does not establish block confirmation/);
  assert.doesNotMatch(
    html,
    /Sign issuer registration for this pass|Pass registration verified by the service/,
  );
});

test("BSV English, Spanish, German and French copy covers every market control", () => {
  for (const [locale, copy] of Object.entries(bsvCopy)) {
    assert.deepEqual(Object.keys(copy).sort(), Object.keys(bsvEnglish).sort());
    assert.ok(Object.values(copy).every((value) => value.trim().length > 0));
    if (locale !== "en") assert.notEqual(copy.mintNote, bsvEnglish.mintNote);
  }
});
