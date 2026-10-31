import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "node:http";
import { test } from "node:test";
import { Transaction, Utils } from "@bsv/sdk";
import { HttpTokenOverlay, transferScript } from "ocnif-bc-bsv";

test("overlay HTTP 200 cannot certify a token rejected by the admission rules", async () => {
  const token = {
    id: `${"aa".repeat(32)}_0`,
    amount: "1",
    ownerPkh: "bb".repeat(20),
  };
  const transaction = new Transaction(
    1,
    [],
    [{ satoshis: 1, lockingScript: transferScript(token) }],
  );
  let exists = false;
  const server = createServer(async (request, response) => {
    for await (const _chunk of request) {
      // Drain the transport fixture; no real chain or wallet is involved.
    }
    response.setHeader("Content-Type", "application/json");
    response.end(
      JSON.stringify(
        request.url === "/submit"
          ? { tm_tokenkit: { outputsToAdmit: [] } }
          : {
              type: "output-list",
              outputs: exists
                ? [
                    {
                      beef: transaction.toBEEF(),
                      outputIndex: 0,
                      context: Utils.toArray(
                        JSON.stringify({
                          tokenId: token.id,
                          amt: token.amount,
                          ownerPkh: token.ownerPkh,
                          spent: false,
                        }),
                        "utf8",
                      ),
                    },
                  ]
                : [],
            },
      ),
    );
  }).listen(0, "127.0.0.1");
  await once(server, "listening");
  try {
    const address = server.address();
    assert.ok(address && typeof address === "object");
    const overlay = new HttpTokenOverlay(`http://127.0.0.1:${address.port}`);
    await assert.rejects(
      () => overlay.submit(transaction.toAtomicBEEF()),
      /token_overlay_output_not_admitted/,
    );
    exists = true;
    await overlay.submit(transaction.toAtomicBEEF());
  } finally {
    server.close();
    await once(server, "close");
  }
});
