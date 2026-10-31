import type { PreparedSwap, SwapOffer, SwapReceipt } from "ocnif-bc-bsv";
import { record } from "@/lib/types/runtime";
export function parseOffer(value: unknown): SwapOffer {
  const item = record(value);
  const fields = [
    "id",
    "outpoint",
    "tokenId",
    "tokenAmount",
    "priceSatoshis",
    "sellerIdentityKey",
    "sellerKeyIndex",
    "network",
  ];
  if (
    Object.keys(item).some((key) => !fields.includes(key)) ||
    typeof item.id !== "string" ||
    !/^[a-zA-Z0-9_-]{1,100}$/.test(item.id) ||
    typeof item.outpoint !== "string" ||
    !/^[a-f0-9]{64}\.\d+$/.test(item.outpoint) ||
    typeof item.tokenId !== "string" ||
    !/^[a-f0-9]{64}_\d+$/.test(item.tokenId) ||
    typeof item.tokenAmount !== "string" ||
    !/^[1-9][0-9]{0,19}$/.test(item.tokenAmount) ||
    BigInt(item.tokenAmount) > 18446744073709551615n ||
    !Number.isSafeInteger(item.priceSatoshis) ||
    Number(item.priceSatoshis) < 1 ||
    typeof item.sellerIdentityKey !== "string" ||
    !/^0[23][a-f0-9]{64}$/i.test(item.sellerIdentityKey) ||
    !Number.isSafeInteger(item.sellerKeyIndex) ||
    Number(item.sellerKeyIndex) < 0 ||
    Number(item.sellerKeyIndex) > 2147483647 ||
    !["testnet", "mainnet"].includes(String(item.network))
  )
    throw new Error("invalid_swap_offer");
  return item as unknown as SwapOffer;
}
export function parsePrepared(text: string): PreparedSwap {
  if (text.length > 4000000) throw new Error("swap_package_too_large");
  const data = record(JSON.parse(text));
  const offer = parseOffer(data.offer);
  if (
    typeof data.buyerIdentityKey !== "string" ||
    !/^0[23][a-f0-9]{64}$/i.test(data.buyerIdentityKey) ||
    !Number.isSafeInteger(data.buyerKeyIndex) ||
    Number(data.buyerKeyIndex) < 0 ||
    !Array.isArray(data.transaction) ||
    data.transaction.length > 1000000 ||
    data.transaction.some(
      (value) =>
        !Number.isInteger(value) || Number(value) < 0 || Number(value) > 255,
    )
  )
    throw new Error("invalid_swap_package");
  for (const key of [
    "reference",
    "derivationPrefix",
    "derivationSuffix",
    "paymentScript",
  ])
    if (typeof data[key] !== "string" || String(data[key]).length > 4096)
      throw new Error("invalid_swap_package");
  return { ...data, offer } as unknown as PreparedSwap;
}

export function parseReceipt(text: string): SwapReceipt {
  if (text.length > 4000000) throw new Error("swap_package_too_large");
  const data = record(JSON.parse(text));
  const checked = parsePrepared(
    JSON.stringify({
      ...data,
      reference: "receipt",
      paymentScript: "receipt",
    }),
  );
  if (
    typeof data.txid !== "string" ||
    !/^[a-f0-9]{64}$/i.test(data.txid) ||
    data.confirmed !== false ||
    !["wallet_broadcast", "overlay_pending", "overlay_admitted"].includes(
      String(data.status),
    )
  )
    throw new Error("invalid_swap_receipt");
  return { ...data, offer: checked.offer } as unknown as SwapReceipt;
}
