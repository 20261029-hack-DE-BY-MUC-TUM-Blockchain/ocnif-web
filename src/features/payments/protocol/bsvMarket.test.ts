import assert from "node:assert/strict";
import { test } from "node:test";
import { reportDigest } from "ocnif-bc-bsv";
import {
  parseAccessChallenge,
  parseAccessDelivery,
  parseMarketConfig,
  parseMintIntent,
  parsePublishedReport,
  parseReportOffers,
  parseReportQuote,
} from "./bsvMarket";

const issuer = `02${"11".repeat(32)}`;
const merchant = `03${"22".repeat(32)}`;
const config = {
  network: "testnet" as const,
  overlayUrl: "https://app.example/bsv",
  issuerIdentityKey: issuer,
  merchantIdentityKey: merchant,
  paymentStatus: "ready" as const,
  passStatus: "ready" as const,
};
const report = {
  id: "report-1",
  title: "Synthetic report",
  content: "Provided evidence only.",
  cards: [],
  created_at: 1,
  published_at: 2,
  source: "user-approved" as const,
};
const digest = reportDigest(report);

test("market readiness never substitutes a missing identity or a foreign overlay", () => {
  assert.equal(
    parseMarketConfig(config, config.overlayUrl).passStatus,
    "ready",
  );
  assert.throws(() =>
    parseMarketConfig(
      { ...config, issuerIdentityKey: null },
      config.overlayUrl,
    ),
  );
  assert.throws(() =>
    parseMarketConfig(
      { ...config, merchantIdentityKey: null },
      config.overlayUrl,
    ),
  );
  assert.throws(() => parseMarketConfig(config, "https://other.example/bsv"));
  assert.throws(() =>
    parseMarketConfig({ ...config, funded: true }, config.overlayUrl),
  );
});

test("report quote and mint intent remain bound to the selected report, network and public identities", () => {
  const quote = {
    id: "quote-1",
    reportId: report.id,
    title: report.title,
    recipientIdentityKey: merchant,
    satoshis: 5,
    network: "testnet",
    expiresAt: Date.now() + 60000,
    reportDigest: digest,
  };
  assert.equal(parseReportQuote(quote, report.id, config).satoshis, 5);
  for (const changed of [
    { reportId: "other" },
    { network: "mainnet" },
    { recipientIdentityKey: issuer },
    { satoshis: -1 },
  ])
    assert.throws(() =>
      parseReportQuote({ ...quote, ...changed }, report.id, config),
    );
  const intent = {
    id: "mint-1",
    reportId: report.id,
    reportDigest: digest,
    issuerIdentityKey: issuer,
    network: "testnet",
    keyIndex: 0,
  };
  assert.equal(
    parseMintIntent(intent, report.id, config).issuerIdentityKey,
    issuer,
  );
  for (const changed of [
    { issuerIdentityKey: merchant },
    { keyIndex: -1 },
    { reportId: "other" },
    { network: "mainnet" },
  ])
    assert.throws(() =>
      parseMintIntent({ ...intent, ...changed }, report.id, config),
    );
});

test("holder challenge and delivered report reject changed ownership, confirmation and executable card claims", () => {
  const expected = {
    reportId: report.id,
    outpoint: `${"ab".repeat(32)}.0`,
    holderIdentityKey: issuer,
    keyIndex: 0,
  };
  const challenge = {
    ...expected,
    id: "challenge-1",
    reportDigest: digest,
    expiresAt: Date.now() + 60000,
  };
  assert.deepEqual(parseAccessChallenge(challenge, expected), challenge);
  assert.throws(() =>
    parseAccessChallenge(
      { ...challenge, holderIdentityKey: merchant },
      expected,
    ),
  );
  assert.throws(() =>
    parseAccessChallenge({ ...challenge, expiresAt: 1 }, expected),
  );
  const delivery = {
    report,
    access: { status: "overlay_owner_verified", outpoint: expected.outpoint },
    confirmed: false,
  };
  assert.deepEqual(parseAccessDelivery(delivery, challenge), report);
  assert.throws(() =>
    parseAccessDelivery({ ...delivery, confirmed: true }, challenge),
  );
  assert.throws(() =>
    parseAccessDelivery(
      { ...delivery, report: { ...report, content: "Changed" } },
      challenge,
    ),
  );
  const injected = {
    ...report,
    cards: [
      { type: "finding", title: "Unsafe", html: "<script>bad()</script>" },
    ],
  };
  assert.throws(() =>
    parsePublishedReport(injected, report.id, reportDigest(injected)),
  );
});

test("report offers require one pass, a bounded price and both wallet approvals", () => {
  const listing = {
    reportId: report.id,
    reportDigest: digest,
    offer: {
      id: "offer-1",
      outpoint: `${"ab".repeat(32)}.0`,
      tokenId: `${"ab".repeat(32)}_0`,
      tokenAmount: "1",
      priceSatoshis: 20,
      sellerIdentityKey: issuer,
      sellerKeyIndex: 0,
      network: "testnet",
    },
  };
  assert.equal(
    parseReportOffers(
      { offers: [listing], requiresBothWallets: true },
      report.id,
      config,
    ).length,
    1,
  );
  assert.throws(() =>
    parseReportOffers(
      { offers: [listing], requiresBothWallets: false },
      report.id,
      config,
    ),
  );
  for (const changed of [
    { tokenAmount: "2" },
    { priceSatoshis: 100000001 },
    { network: "mainnet" },
  ])
    assert.throws(() =>
      parseReportOffers(
        {
          offers: [{ ...listing, offer: { ...listing.offer, ...changed } }],
          requiresBothWallets: true,
        },
        report.id,
        config,
      ),
    );
});
