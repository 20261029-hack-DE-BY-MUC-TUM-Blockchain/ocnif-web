import assert from "node:assert/strict";
import { test } from "node:test";
import "fake-indexeddb/auto";
import { BsvOperationStore, reportOperationKey } from "./bsvOperationStore";

test("concurrent tabs cannot replace a report's saved payment with a fresh server quote", async () => {
  const name = `synthetic-report-journal-${crypto.randomUUID()}`;
  const tabA = new BsvOperationStore(name);
  const tabB = new BsvOperationStore(name);
  const key = reportOperationKey(
    "purchase",
    "testnet",
    "synthetic-wallet",
    "report-1",
  );
  const quote = {
    id: "quote-one",
    reportId: "report-1",
    title: "Synthetic",
    recipientIdentityKey: "public-key",
    satoshis: 5,
    network: "testnet" as const,
    expiresAt: 1,
    reportDigest: "aa".repeat(32),
  };
  const attempts = await Promise.allSettled([
    tabA.write({ key, kind: "purchase", quote }, true),
    tabB.write(
      { key, kind: "purchase", quote: { ...quote, id: "quote-two" } },
      true,
    ),
  ]);
  assert.equal(
    attempts.filter((attempt) => attempt.status === "fulfilled").length,
    1,
  );
  const saved = await new BsvOperationStore(name).get(key);
  assert.ok(saved?.quote);
  await assert.rejects(
    () =>
      tabB.write(
        {
          key,
          kind: "purchase",
          quote: { ...quote, id: "quote-after-reload" },
        },
        true,
      ),
    /existing_report_operation/,
  );
  assert.deepEqual(await tabB.get(key), saved);
  assert.notEqual(
    key,
    reportOperationKey("purchase", "mainnet", "synthetic-wallet", "report-1"),
  );
  assert.notEqual(
    key,
    reportOperationKey("purchase", "testnet", "another-wallet", "report-1"),
  );
});
