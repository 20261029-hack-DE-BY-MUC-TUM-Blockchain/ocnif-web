import assert from "node:assert/strict";
import { test } from "node:test";
import {
  decodePaymentSignatureHeader,
  encodePaymentRequiredHeader,
} from "@x402/core/http";
import { type EvmConnection, signEvm } from "./evm";
import { readChallenge } from "./x402";

test("synthetic EVM wallet receives the exact reviewed EIP-3009 amount and recipient", async () => {
  const payer = `0x${"3".repeat(40)}`;
  const recipient = `0x${"2".repeat(40)}`;
  let typed: unknown;
  let signatures = 0;
  const connection = {
    address: payer,
    chainId: 84532,
    wallet: {
      getAddresses: async () => [payer],
      getChainId: async () => 84532,
      signTypedData: async (value: unknown) => {
        typed = value;
        signatures++;
        return `0x${"4".repeat(130)}`;
      },
    },
  } as unknown as EvmConnection;
  const challenge = readChallenge(
    encodePaymentRequiredHeader({
      x402Version: 2,
      resource: { url: "https://example.test/report" },
      accepts: [
        {
          scheme: "exact",
          network: "eip155:84532",
          asset: `0x${"1".repeat(40)}`,
          payTo: recipient,
          amount: "10000",
          maxTimeoutSeconds: 60,
          extra: { name: "USDC", version: "2" },
        },
      ],
    }),
    "eip155:84532",
    "/api/example",
  );
  const proof = decodePaymentSignatureHeader(
    await signEvm(challenge, connection),
  );
  assert.equal(signatures, 1);
  assert.equal(proof.accepted.amount, "10000");
  const message = typed as {
    message: { to: string; value: bigint };
    domain: { chainId: number };
  };
  assert.equal(message.message.to, recipient);
  assert.equal(String(message.message.value), "10000");
  assert.equal(message.domain.chainId, 84532);
  connection.wallet.getChainId = async () => 1;
  await assert.rejects(() => signEvm(challenge, connection));
  assert.equal(signatures, 1);
});
