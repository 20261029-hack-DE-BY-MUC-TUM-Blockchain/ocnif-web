import assert from "node:assert/strict";
import { test } from "node:test";
import { PrivateKey, Transaction } from "@bsv/sdk";
import { type TokenOverlay, tokenOwner, transferScript } from "ocnif-bc-bsv";
import { ownsCurrentPass } from "./bsvOwnership";

test("a historical pass receipt does not restore ownership after an overlay spend or owner change", async () => {
  const identity = new PrivateKey(1).toPublicKey().toString();
  const pass = {
    reportId: "synthetic-report",
    reportDigest: "ab".repeat(32),
    tokenId: `${"cd".repeat(32)}_0`,
    outpoint: `${"ef".repeat(32)}.0`,
    keyIndex: 0,
  };
  const token = {
    id: pass.tokenId,
    amount: "1",
    ownerPkh: tokenOwner(identity, 0),
  };
  let spent = false;
  let exists = true;
  const overlay: TokenOverlay = {
    async lookup() {
      return exists
        ? {
            transaction: new Transaction(
              1,
              [],
              [{ satoshis: 1, lockingScript: transferScript(token) }],
            ),
            outputIndex: 0,
            beef: [],
            spent,
          }
        : null;
    },
    async submit() {
      assert.fail("Read-only ownership recovery must not broadcast");
    },
  };
  assert.equal(await ownsCurrentPass(pass, identity, overlay), true);
  spent = true;
  assert.equal(await ownsCurrentPass(pass, identity, overlay), false);
  spent = false;
  token.ownerPkh = tokenOwner(new PrivateKey(2).toPublicKey().toString(), 0);
  assert.equal(await ownsCurrentPass(pass, identity, overlay), false);
  token.ownerPkh = tokenOwner(identity, 0);
  token.id = `${"aa".repeat(32)}_0`;
  assert.equal(await ownsCurrentPass(pass, identity, overlay), false);
  exists = false;
  assert.equal(await ownsCurrentPass(pass, identity, overlay), false);
});
