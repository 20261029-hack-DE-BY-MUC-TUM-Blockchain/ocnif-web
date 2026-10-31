import { encodePaymentSignatureHeader } from "@x402/core/http";
import type { CardanoSigningRecord, Cip30Api } from "ocnif-bc-cardano-client";
import { assertFresh, type Challenge } from "./x402";
export type CardanoProvider = { name: string; enable: () => Promise<Cip30Api> };
export function cardanoWallets(): CardanoProvider[] {
  const injected = (window as Window & { cardano?: Record<string, unknown> })
    .cardano;
  return Object.entries(injected || {}).flatMap(([key, value]) => {
    if (!value || typeof value !== "object") return [];
    const provider = value as Partial<CardanoProvider>;
    const enable = provider.enable;
    return typeof enable === "function"
      ? [
          {
            name:
              typeof provider.name === "string"
                ? provider.name.slice(0, 80)
                : key,
            enable: () => enable.call(provider),
          },
        ]
      : [];
  });
}
export async function connectCardano(provider: CardanoProvider) {
  const api = await provider.enable();
  if ((await api.getNetworkId()) !== 0)
    throw new Error("cardano_test_network_required");
  const [hex] = (await api.getUsedAddresses()).concat(
    await api.getUnusedAddresses(),
  );
  const { Address } = await import("@evolution-sdk/evolution");
  const address = Address.toBech32(Address.fromHex(hex));
  return { api, address, name: provider.name };
}
export type CardanoConnection = Awaited<ReturnType<typeof connectCardano>>;
async function signingRecord(
  key: string,
  record: CardanoSigningRecord,
  reserve: boolean,
) {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("ocnif-cardano-signatures", 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore("signatures");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error("cardano_storage_unavailable"));
  });
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("signatures", "readwrite");
    const store = tx.objectStore("signatures");
    if (reserve) store.add(record, key);
    else store.put(record, key);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onabort = () => {
      db.close();
      reject(new Error("cardano_existing_signature_requires_review"));
    };
    tx.onerror = () => {};
  });
}
export async function signCardano(
  challenge: Challenge,
  wallet: CardanoConnection,
  maxFeeLovelace: string,
) {
  assertFresh(challenge);
  if (!/^[1-9][0-9]{0,8}$/.test(maxFeeLovelace))
    throw new Error("cardano_invalid_fee_budget");
  const [{ createCip30Signer }, { ExactCardanoScheme }] = await Promise.all([
    import("ocnif-bc-cardano-client"),
    import("@x402/cardano"),
  ]);
  const signer = await createCip30Signer(wallet.api, {
    koiosUrl: `${location.origin}/cardano-provider`,
    approval: {
      network: "cardano:preprod",
      payTo: challenge.selected.payTo,
      amount: challenge.selected.amount,
      maxFeeLovelace,
      resourceUrl: challenge.resource,
    },
    journal: {
      reserve: (key, record) => signingRecord(key, record, true),
      update: (key, record) => signingRecord(key, record, false),
    },
  });
  if (signer.getAddress() !== wallet.address)
    throw new Error("cardano_wallet_changed");
  const scheme = new ExactCardanoScheme(signer);
  const signed = await scheme.createPaymentPayload(2, challenge.selected);
  return encodePaymentSignatureHeader({
    ...signed,
    accepted: challenge.selected,
    resource: challenge.required.resource,
  });
}
