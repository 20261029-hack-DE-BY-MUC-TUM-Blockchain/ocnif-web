import assert from "node:assert/strict";
import { test } from "node:test";
import { parseCardanoStatus } from "./masumi";

const status = {
  integration: "masumi-sokosumi",
  network: "cardano:preprod",
  agentReady: true,
  coworkerConfigured: true,
  executionOnly: { verified: true, taskId: "completed-task-1" },
  paid: {
    enabled: false,
    registrationConfirmed: false,
    settlementVerified: false,
  },
  setupRequired: ["masumi_registration", "paid_task"],
};
test("a completed execution-only task never implies paid settlement", () => {
  const parsed = parseCardanoStatus(status);
  assert.equal(parsed.integration, "masumi-sokosumi");
  if (parsed.integration !== "masumi-sokosumi")
    throw new Error("Wrong integration");
  assert.equal(parsed.executionOnly.verified, true);
  assert.deepEqual(parsed.paid, {
    enabled: false,
    registrationConfirmed: false,
    settlementVerified: false,
  });
});
test("status rejects missing receipts, unknown setup codes and invented readiness flags", () => {
  assert.throws(() =>
    parseCardanoStatus({
      ...status,
      executionOnly: { verified: true, taskId: null },
    }),
  );
  assert.throws(() => parseCardanoStatus({ ...status, agentReady: "true" }));
  assert.throws(() =>
    parseCardanoStatus({ ...status, setupRequired: ["send_private_key"] }),
  );
  assert.throws(() =>
    parseCardanoStatus({ ...status, network: "cardano:mainnet" }),
  );
});
test("legacy x402 status can only identify the obsolete integration", () => {
  assert.deepEqual(
    parseCardanoStatus({
      configured: false,
      payTo: null,
      network: "cardano:preprod",
      amount: "2000000",
    }),
    { integration: "legacy-x402" },
  );
  assert.throws(() =>
    parseCardanoStatus({ ...status, integration: "another-provider" }),
  );
});
test("worker receipt provenance and observation time are retained", () => {
  const evidence = {
    source: "local-worker-receipt",
    observedAt: "2026-10-31T12:50:00Z",
  };
  const parsed = parseCardanoStatus({ ...status, evidence });
  assert.ok(parsed.integration === "masumi-sokosumi");
  assert.deepEqual(parsed.evidence, evidence);
  assert.throws(() =>
    parseCardanoStatus({
      ...status,
      evidence: { ...evidence, source: "unverified" },
    }),
  );
});
