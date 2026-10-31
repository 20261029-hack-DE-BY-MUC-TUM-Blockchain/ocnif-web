import assert from "node:assert/strict";
import { test } from "node:test";
import { encodePaymentRequiredHeader } from "@x402/core/http";
import { IDBFactory, indexedDB } from "fake-indexeddb";
import { nvdRequest, reviewedNvdConfig } from "ocnif-bc-api3-client";
import { policyFor } from "./gate";
import {
  type Attempt,
  beginReviewedAttempt,
  readAttempt,
  refreshReviewedTerms,
  writeAttempt,
} from "./journal";
import { recoveryReason, verifyRecovery } from "./paymentRecovery";
import {
  stoppedSigningAttempt,
  WalletSignatureRejected,
} from "./walletRejection";
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
    state: "signed",
    proof: "synthetic-signed-proof",
  });
  await writeAttempt({
    ...attempt,
    state: "submitting",
    proof: "synthetic-signed-proof",
  });
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

function syntheticAttempt(state: Attempt["state"] = "signing"): Attempt {
  const cve = "CVE-2021-44228";
  const challenge = readChallenge(
    encodePaymentRequiredHeader({
      x402Version: 2,
      resource: { url: `https://example.test/${cve}` },
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
    `/api/v1/vulnerabilities/${cve}`,
  );
  const base: Attempt = {
    id: crypto.randomUUID(),
    state,
    challenge,
    createdAt: Date.now() - 800000,
  };
  if (state === "settled") {
    const policy = policyFor(cve, 600, 70);
    base.proof = "synthetic-proof";
    base.result = {
      delivered: true,
      settlement: {
        success: true,
        network: "eip155:84532",
        transaction: `0x${"5".repeat(64)}`,
      },
      body: {
        verified: true,
        cveId: cve,
        request: nvdRequest(cve),
        requestHash: policy.requestHash,
        evidence: {
          airnode: reviewedNvdConfig.expectedSigner,
          requestHash: policy.requestHash,
          timestamp: String(Math.floor(Date.now() / 1000) - 700),
          data: '{"score":9.8}',
          signature: `0x${"6".repeat(130)}`,
        },
      },
    };
  }
  return base;
}
async function seedLegacy(attempt: Attempt, holdOpen = false) {
  const factory = new IDBFactory();
  Object.defineProperty(globalThis, "indexedDB", {
    value: factory,
    configurable: true,
  });
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const open = factory.open("ocnif-payment-attempts", 1);
    open.onupgradeneeded = () =>
      open.result.createObjectStore("attempts", { keyPath: "id" });
    open.onerror = () => reject(open.error);
    open.onsuccess = () => resolve(open.result);
  });
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("attempts", "readwrite");
    tx.objectStore("attempts").put(attempt);
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error);
  });
  if (!holdOpen) db.close();
  return { db, factory };
}

test("a confirmed synthetic pre-proof wallet rejection permits one explicit fresh review with history", async () => {
  const pending = syntheticAttempt();
  const rejected = stoppedSigningAttempt(
    pending,
    false,
    new WalletSignatureRejected(),
  );
  await seedLegacy(rejected);
  const races = await Promise.allSettled([
    beginReviewedAttempt(rejected, {
      ...pending.challenge,
      requestedAt: Date.now(),
    }),
    beginReviewedAttempt(rejected, {
      ...pending.challenge,
      requestedAt: Date.now(),
    }),
  ]);
  assert.equal(
    races.filter((result) => result.status === "fulfilled").length,
    1,
  );
  const reviewed = await readAttempt(pending.id);
  assert.equal(reviewed?.state, "reviewing");
  assert.equal(reviewed?.generation, 1);
  assert.deepEqual(reviewed?.history, [rejected]);
  assert.equal(reviewed?.proof, undefined);
  assert.ok(reviewed);
  const approvals = await Promise.allSettled([
    writeAttempt({ ...reviewed, state: "signing" }, true),
    writeAttempt({ ...reviewed, state: "signing" }, true),
  ]);
  assert.equal(
    approvals.filter((result) => result.status === "fulfilled").length,
    1,
  );
  await assert.rejects(() =>
    writeAttempt({ ...pending, state: "signed", proof: "late-old-proof" }),
  );
  assert.deepEqual((await readAttempt(pending.id))?.history, [rejected]);
});

test("migrated synthetic stale settled evidence archives its original proof and receipt before a fresh review", async () => {
  const settled = syntheticAttempt("settled");
  const { factory } = await seedLegacy(settled);
  assert.deepEqual(await readAttempt(settled.id), settled);
  assert.equal(recoveryReason(settled), "settled_evidence_expired");
  // Synthetic signature is deliberately invalid: the production recovery entry point must reject it.
  await assert.rejects(() => verifyRecovery(settled));
  await assert.rejects(() => beginReviewedAttempt(settled, settled.challenge));
  const reviewed = await beginReviewedAttempt(
    settled,
    {
      ...settled.challenge,
      requestedAt: Date.now(),
    },
    async (expected) => {
      // Only the cryptographic verifier is a test double for this journal migration test.
      assert.deepEqual(expected, settled);
      return "settled_evidence_expired";
    },
  );
  assert.equal(reviewed.state, "reviewing");
  assert.equal(reviewed.proof, undefined);
  assert.equal(reviewed.history?.[0].proof, settled.proof);
  assert.deepEqual(reviewed.history?.[0].result, settled.result);
  const refreshed = await refreshReviewedTerms(reviewed, {
    ...reviewed.challenge,
    requestedAt: Date.now() + 1,
  });
  assert.equal(refreshed.generation, 1);
  assert.deepEqual(refreshed.history, reviewed.history);
  assert.equal((await readAttempt(settled.id))?.state, "reviewing");
  await new Promise<void>((resolve, reject) => {
    const old = factory.open("ocnif-payment-attempts", 1);
    old.onerror = () => {
      assert.equal(old.error?.name, "VersionError");
      resolve();
    };
    old.onsuccess = () => {
      old.result.close();
      reject(new Error("Older code unexpectedly opened upgraded storage"));
    };
  });
});

test("uncertain old attempts, returned proofs and fresh or incomplete settlement cannot create a new attempt", async () => {
  const pending = syntheticAttempt();
  for (const state of [
    "signing",
    "signed",
    "submitting",
    "review_required",
  ] as const) {
    const uncertain = {
      ...pending,
      state,
      proof: state === "signing" ? undefined : "synthetic-proof",
    };
    await seedLegacy(uncertain);
    assert.equal(recoveryReason(uncertain), null);
    await assert.rejects(() =>
      beginReviewedAttempt(uncertain, pending.challenge),
    );
    assert.deepEqual(await readAttempt(uncertain.id), uncertain);
  }
  const generic = stoppedSigningAttempt(
    pending,
    false,
    Object.assign(new Error("unknown failure"), { code: 4001 }),
  );
  assert.equal(generic.state, "review_required");
  assert.equal(
    stoppedSigningAttempt(pending, true, new WalletSignatureRejected()).state,
    "review_required",
  );
  assert.equal(
    stoppedSigningAttempt(
      { ...pending, proof: "saved" },
      false,
      new WalletSignatureRejected(),
    ).state,
    "review_required",
  );
  const settled = syntheticAttempt("settled");
  assert.ok(settled.result);
  assert.equal(
    recoveryReason({
      ...settled,
      result: { ...settled.result, delivered: false },
    }),
    null,
  );
  assert.equal(
    recoveryReason({
      ...settled,
      result: { ...settled.result, settlement: null },
    }),
    null,
  );
  assert.equal(recoveryReason(settled, Date.now() - 200000), null);
  const forged = {
    ...settled,
    result: {
      ...settled.result,
      body: { ...(settled.result.body as object), cveId: "CVE-2026-0001" },
    },
  };
  assert.equal(recoveryReason(forged), null);
});

test("an open older tab blocks migration visibly until it closes, without losing its record", async () => {
  const old = syntheticAttempt("review_required");
  const { db } = await seedLegacy(old, true);
  await assert.rejects(
    () => readAttempt(old.id),
    /payment_storage_upgrade_blocked/,
  );
  db.close();
  assert.deepEqual(await readAttempt(old.id), old);
});
