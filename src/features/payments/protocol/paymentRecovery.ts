import { reviewedNvdConfig, verifyAttestation } from "ocnif-bc-api3-client";
import { evidenceFor, policyFor } from "./gate";
import type { Attempt } from "./journal";

export type RecoveryReason = "wallet_rejected" | "settled_evidence_expired";

function settledEvidence(attempt: Attempt) {
  if (
    attempt.state !== "settled" ||
    !attempt.result?.delivered ||
    attempt.result.settlement?.success !== true ||
    attempt.result.settlement.network !== "eip155:84532" ||
    !/^(?:0x)?[a-f0-9]{64}$/i.test(attempt.result.settlement.transaction) ||
    attempt.challenge.selected.network !== "eip155:84532"
  )
    return null;
  const cve = /^\/api\/v1\/vulnerabilities\/(CVE-\d{4}-\d{4,})$/.exec(
    attempt.challenge.endpoint,
  )?.[1];
  if (!cve) return null;
  try {
    const policy = policyFor(cve, reviewedNvdConfig.defaultMaximumAge, 70);
    const evidence = evidenceFor(attempt.result.body, cve, policy);
    const timestamp = Number(evidence.timestamp);
    if (
      !/^\d+$/.test(evidence.timestamp) ||
      !Number.isSafeInteger(timestamp) ||
      timestamp <= 0
    )
      return null;
    return { policy, evidence, timestamp };
  } catch {
    return null;
  }
}

export function recoveryReason(
  attempt: Attempt,
  now = Date.now(),
): RecoveryReason | null {
  if (
    attempt.state === "rejected" &&
    attempt.rejection === "wallet_user_rejected_before_proof" &&
    !attempt.proof &&
    !attempt.result
  )
    return "wallet_rejected";
  const settled = settledEvidence(attempt);
  return settled &&
    Math.floor(now / 1000) > settled.timestamp + settled.policy.maximumAge
    ? "settled_evidence_expired"
    : null;
}

export async function verifyRecovery(
  attempt: Attempt,
): Promise<RecoveryReason> {
  const reason = recoveryReason(attempt);
  if (!reason) throw new Error("existing_payment_requires_review");
  if (reason === "settled_evidence_expired") {
    const settled = settledEvidence(attempt);
    if (!settled) throw new Error("invalid_historical_evidence");
    // Verify the original signature at its own timestamp; expiry is checked above.
    await verifyAttestation(
      settled.evidence,
      settled.policy.signer,
      settled.policy.requestHash,
      settled.timestamp,
      settled.policy.maximumAge,
    );
  }
  return reason;
}
