import type { Challenge, PaymentResult } from "./x402";
export type Attempt = {
  id: string;
  state: "signing" | "signed" | "submitting" | "review_required" | "settled";
  challenge: Challenge;
  proof?: string;
  result?: PaymentResult;
  createdAt: number;
};
function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("ocnif-payment-attempts", 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore("attempts", { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
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
  });
}
export async function writeAttempt(
  attempt: Attempt,
  reserve = false,
): Promise<void> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("attempts", "readwrite");
    if (reserve) tx.objectStore("attempts").add(attempt);
    else tx.objectStore("attempts").put(attempt);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onabort = () => {
      db.close();
      reject(
        new Error(
          reserve
            ? "existing_payment_requires_review"
            : "payment_storage_unavailable",
        ),
      );
    };
    tx.onerror = () => {};
  });
}
export const attemptId = (challenge: Challenge, payer: string) =>
  `${challenge.selected.network}:${challenge.endpoint}:${payer.toLowerCase()}`;
