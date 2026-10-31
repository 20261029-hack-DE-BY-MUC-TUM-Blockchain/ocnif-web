import assert from "node:assert/strict";
import { test } from "node:test";
import { boundedText, koiosRequest } from "./koios";

test("Cardano provider permits only bounded read-only operations", () => {
  assert.equal(
    koiosRequest("epoch_params", "GET", "").path,
    "/epoch_params?limit=1&order=epoch_no.desc",
  );
  assert.throws(() => koiosRequest("submittx", "POST", "", {}));
  assert.throws(() => koiosRequest("epoch_params", "GET", "?limit=100000"));
  const ref = `${"a".repeat(64)}#0`;
  assert.ok(
    koiosRequest("utxo_info", "POST", "", {
      _utxo_refs: [ref],
      _extended: true,
    }).body,
  );
  assert.throws(() =>
    koiosRequest("utxo_info", "POST", "", {
      _utxo_refs: [ref],
      _extended: true,
      url: "https://example.test",
    }),
  );
  assert.throws(() =>
    koiosRequest("utxo_info", "POST", "", {
      _utxo_refs: Array(101).fill(ref),
      _extended: true,
    }),
  );
});
test("provider response body has a strict byte bound", async () => {
  await assert.rejects(() => boundedText(new Response("123456").body, 5));
  assert.equal(await boundedText(new Response("12345").body, 5), "12345");
});
