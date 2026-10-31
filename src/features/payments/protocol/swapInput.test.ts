import assert from "node:assert/strict";
import { test } from "node:test";
import { parseOffer, parsePrepared, parseReceipt } from "./swapInput";

const offer = {
  id: "fixture",
  outpoint: `${"1".repeat(64)}.0`,
  tokenId: `${"2".repeat(64)}_0`,
  tokenAmount: "1",
  priceSatoshis: 100,
  sellerIdentityKey: `02${"3".repeat(64)}`,
  sellerKeyIndex: 0,
  network: "testnet",
};
test("swap review rejects unknown fields and out of range token quantities", () => {
  assert.equal(parseOffer(offer).priceSatoshis, 100);
  assert.throws(() => parseOffer({ ...offer, secret: "never accepted" }));
  assert.throws(() =>
    parseOffer({ ...offer, tokenAmount: "18446744073709551616" }),
  );
  assert.throws(() =>
    parsePrepared(JSON.stringify({ offer, transaction: [256] })),
  );
});
test("imported swap receipts cannot claim chain confirmation", () => {
  const receipt = {
    offer,
    transaction: [1],
    buyerIdentityKey: `03${"4".repeat(64)}`,
    buyerKeyIndex: 0,
    derivationPrefix: "fixture",
    derivationSuffix: "fixture",
    txid: "5".repeat(64),
    status: "wallet_broadcast",
    confirmed: false,
  };
  assert.equal(parseReceipt(JSON.stringify(receipt)).confirmed, false);
  assert.throws(() =>
    parseReceipt(JSON.stringify({ ...receipt, confirmed: true })),
  );
});
