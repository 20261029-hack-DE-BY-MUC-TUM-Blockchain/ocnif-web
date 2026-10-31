import assert from "node:assert/strict";
import { test } from "node:test";
import { parseMerchant } from "./merchant";

test("an unconfigured merchant never renders payment availability", () => {
  assert.equal(
    parseMerchant({
      configured: false,
      payTo: null,
      network: "cardano:preprod",
      amount: "2000000",
    }).configured,
    false,
  );
  assert.throws(() =>
    parseMerchant({
      configured: true,
      payTo: null,
      network: "cardano:preprod",
      amount: "2000000",
    }),
  );
});
test("merchant status rejects another network and untrusted recipient text", () => {
  assert.throws(() =>
    parseMerchant({
      configured: true,
      payTo: "javascript:alert(1)",
      network: "cardano:preprod",
      amount: "2000000",
    }),
  );
  assert.throws(() =>
    parseMerchant({
      configured: false,
      payTo: null,
      network: "cardano:mainnet",
      amount: "2000000",
    }),
  );
});
