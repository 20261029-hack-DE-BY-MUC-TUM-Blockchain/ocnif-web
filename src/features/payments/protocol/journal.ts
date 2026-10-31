import { recoveryReason, verifyRecovery } from "./paymentRecovery";
import type { Challenge, PaymentResult } from "./x402";
import { assertFresh } from "./x402";
export type AttemptEntry = {
  id: string;
  state:
    | "reviewing"
    | "signing"
    | "signed"
    | "submitting"
    | "review_required"
    | "settled"
    | "rejected";
  challenge: Challenge;
  proof?: string;
  result?: PaymentResult;
  createdAt: number;
  generation?: number;
  rejection?: "wallet_user_rejected_before_proof";
};
export type Attempt = AttemptEntry & { history?: AttemptEntry[] };
function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("ocnif-payment-attempts", 2);
    let blocked = false;
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains("attempts"))
        request.result.createObjectStore("attempts", { keyPath: "id" });
    };
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => db.close();
      if (blocked) db.close();
      else resolve(db);
    };
    request.onblocked = () => {
      blocked = true;
      reject(new Error("payment_storage_upgrade_blocked"));
    };
    request.onerror = () => reject(new Error("payment_storage_unavailable"));
  });
}
export async function readAttempt(id: string): Promise<Attempt | undefined> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("attempts", "readonly");
    const request = tx.objectStore("attempts").get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error("payment_storage_unavailable"));
    tx.oncomplete = () => db.close();
    tx.onabort = () => {
      db.close();
      reject(new Error("payment_storage_unavailable"));
    };
  });
}
async function mutateAttempt(
  id: string,
  change: (current: Attempt | undefined) => Attempt,
): Promise<Attempt> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("attempts", "readwrite");
    const store = tx.objectStore("attempts");
    const request = store.get(id);
    let next: Attempt;
    let failure = new Error("payment_storage_unavailable");
    request.onsuccess = () => {
      try {
        next = change(request.result);
        store.put(next);
      } catch (error) {
        if (error instanceof Error) failure = error;
        tx.abort();
      }
    };
    tx.oncomplete = () => {
      db.close();
      resolve(next);
    };
    tx.onabort = () => {
      db.close();
      reject(failure);
    };
    tx.onerror = () => {};
  });
}
function sameGeneration(current: Attempt, expected: Attempt) {
  return (
    current.id === expected.id &&
    (current.generation ?? 0) === (expected.generation ?? 0) &&
    current.createdAt === expected.createdAt &&
    JSON.stringify(current.challenge) === JSON.stringify(expected.challenge)
  );
}
export async function writeAttempt(
  attempt: Attempt,
  reserve = false,
): Promise<void> {
  await mutateAttempt(attempt.id, (current) => {
    if (!current) {
      if (
        reserve &&
        attempt.state === "signing" &&
        (attempt.generation ?? 0) === 0
      )
        return attempt;
      throw new Error("existing_payment_requires_review");
    }
    const allowed: Record<Attempt["state"], Attempt["state"][]> = {
      reviewing: reserve ? ["signing"] : [],
      signing: ["signed", "review_required", "rejected"],
      signed: ["submitting"],
      submitting: ["submitting", "settled", "review_required"],
      review_required: current.proof ? ["submitting"] : [],
      settled: [],
      rejected: [],
    };
    if (
      !sameGeneration(current, attempt) ||
      !allowed[current.state]?.includes(attempt.state) ||
      (reserve && current.state !== "reviewing") ||
      (current.proof && current.proof !== attempt.proof) ||
      (attempt.state === "rejected" &&
        (attempt.proof ||
          attempt.result ||
          attempt.rejection !== "wallet_user_rejected_before_proof"))
    )
      throw new Error("existing_payment_requires_review");
    return { ...attempt, history: current.history };
  });
}

export async function refreshReviewedTerms(
  expected: Attempt,
  challenge: Challenge,
): Promise<Attempt> {
  assertFresh(challenge);
  return mutateAttempt(expected.id, (current) => {
    if (
      !current ||
      current.state !== "reviewing" ||
      !sameGeneration(current, expected) ||
      challenge.endpoint !== current.challenge.endpoint ||
      challenge.selected.network !== current.challenge.selected.network
    )
      throw new Error("existing_payment_requires_review");
    return { ...current, challenge };
  });
}

export async function beginReviewedAttempt(
  expected: Attempt,
  challenge: Challenge,
  verify: typeof verifyRecovery = verifyRecovery,
): Promise<Attempt> {
  await verify(expected);
  assertFresh(challenge);
  return mutateAttempt(expected.id, (current) => {
    if (
      !current ||
      current.state !== expected.state ||
      !sameGeneration(current, expected) ||
      !recoveryReason(current) ||
      JSON.stringify(current) !== JSON.stringify(expected) ||
      challenge.endpoint !== current.challenge.endpoint ||
      challenge.selected.network !== current.challenge.selected.network
    )
      throw new Error("existing_payment_requires_review");
    const { history, ...previous } = current;
    return {
      id: current.id,
      state: "reviewing",
      challenge,
      createdAt: Date.now(),
      generation: (current.generation ?? 0) + 1,
      history: [...(history ?? []), previous],
    };
  });
}
export const attemptId = (challenge: Challenge, payer: string) =>
  `${challenge.selected.network}:${challenge.endpoint}:${payer.toLowerCase()}`;
