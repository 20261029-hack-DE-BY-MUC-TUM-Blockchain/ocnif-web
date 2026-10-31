import type { Hex } from "viem";
export type GateRecord = {
  id: string;
  state: "signing" | "pending" | "review_required" | "confirmed";
  transaction?: Hex;
  address?: Hex;
};
async function db(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("ocnif-gate-transactions", 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore("transactions", { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error("gate_storage_unavailable"));
  });
}
export async function readGate(id: string): Promise<GateRecord | undefined> {
  const database = await db();
  return new Promise((resolve, reject) => {
    const tx = database.transaction("transactions", "readonly");
    const request = tx.objectStore("transactions").get(id);
    request.onsuccess = () => resolve(request.result);
    tx.oncomplete = () => database.close();
    tx.onerror = () => {
      database.close();
      reject(new Error("gate_storage_unavailable"));
    };
  });
}
export async function writeGate(record: GateRecord, reserve = false) {
  const database = await db();
  return new Promise<void>((resolve, reject) => {
    const tx = database.transaction("transactions", "readwrite");
    if (reserve) tx.objectStore("transactions").add(record);
    else tx.objectStore("transactions").put(record);
    tx.oncomplete = () => {
      database.close();
      resolve();
    };
    tx.onabort = () => {
      database.close();
      reject(new Error("gate_existing_transaction_requires_review"));
    };
    tx.onerror = () => {};
  });
}
