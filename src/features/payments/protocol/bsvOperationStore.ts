import type { MintIntent, PurchaseResult, ReportQuote } from "ocnif-bc-bsv";
import type { Registration } from "./bsvMarket";

export type ReportOperation = {
  key: string;
  kind: "purchase" | "mint";
  quote?: ReportQuote;
  intent?: MintIntent;
  delivery?: PurchaseResult;
  registration?: Registration;
};

export function reportOperationKey(
  kind: ReportOperation["kind"],
  network: string,
  identity: string,
  reportId: string,
): string {
  return `${kind}:${network}:${identity}:${reportId}`;
}

export class BsvOperationStore {
  constructor(private name = "ocnif-report-operations") {}
  private open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.name, 1);
      request.onupgradeneeded = () =>
        request.result.createObjectStore("operations", { keyPath: "key" });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error("report_storage_unavailable"));
    });
  }
  async get(key: string): Promise<ReportOperation | undefined> {
    const database = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction("operations", "readonly");
      const request = transaction.objectStore("operations").get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error("report_storage_unavailable"));
      transaction.oncomplete = () => database.close();
    });
  }
  async write(operation: ReportOperation, reserve = false): Promise<void> {
    const database = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction("operations", "readwrite");
      const store = transaction.objectStore("operations");
      if (reserve) store.add(operation);
      else store.put(operation);
      transaction.oncomplete = () => {
        database.close();
        resolve();
      };
      transaction.onabort = () => {
        database.close();
        reject(
          new Error(
            reserve
              ? "existing_report_operation"
              : "report_storage_unavailable",
          ),
        );
      };
      transaction.onerror = () => {};
    });
  }
}
