import assert from "node:assert/strict";
import { test } from "node:test";
import { encodePaymentRequiredHeader } from "@x402/core/http";
import { indexedDB } from "fake-indexeddb";
import { type Attempt, readAttempt, writeAttempt } from "./journal";
import { readChallenge } from "./x402";

Object.defineProperty(globalThis, "indexedDB", {
  value: indexedDB,
  configurable: true,
});
test("concurrent payment tabs reserve one attempt and retain exactly the same signed proof", async () => {
  const challenge = readChallenge(
    encodePaymentRequiredHeader({
      x402Version: 2,
      resource: { url: "https://example.test/report" },
      accepts: [
        {
          scheme: "exact",
          network: "eip155:84532",
          asset: `0x${"1".repeat(40)}`,
          payTo: `0x${"2".repeat(40)}`,
          amount: "10000",
          maxTimeoutSeconds: 60,
          extra: {},
        },
      ],
    }),
    "eip155:84532",
    "/api/example",
  );
  const attempt: Attempt = {
    id: "concurrent-synthetic-attempt",
    state: "signing",
    challenge,
    createdAt: Date.now(),
  };
  const races = await Promise.allSettled([
    writeAttempt(attempt, true),
    writeAttempt(attempt, true),
  ]);
  assert.equal(
    races.filter((result) => result.status === "fulfilled").length,
    1,
  );
  await writeAttempt({
    ...attempt,
    state: "review_required",
    proof: "synthetic-signed-proof",
  });
  assert.equal(
    (await readAttempt(attempt.id))?.proof,
    "synthetic-signed-proof",
  );
  await assert.rejects(() => writeAttempt(attempt, true));
});
