import { encodePaymentSignatureHeader } from "@x402/core/http";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import {
  createPublicClient,
  createWalletClient,
  custom,
  type EIP1193Provider,
} from "viem";
import { baseSepolia } from "viem/chains";
import { assertFresh, type Challenge } from "./x402";
export async function connectEvm() {
  const provider = (window as Window & { ethereum?: EIP1193Provider }).ethereum;
  if (!provider) throw new Error("evm_wallet_unavailable");
  const wallet = createWalletClient({
    chain: baseSepolia,
    transport: custom(provider),
  });
  const [address] = await wallet.requestAddresses();
  if (!address) throw new Error("evm_wallet_unavailable");
  return {
    wallet,
    address,
    chainId: await wallet.getChainId(),
    publicClient: createPublicClient({
      chain: baseSepolia,
      transport: custom(provider),
    }),
  };
}
export type EvmConnection = Awaited<ReturnType<typeof connectEvm>>;
export async function signEvm(
  challenge: Challenge,
  connection: EvmConnection,
): Promise<string> {
  assertFresh(challenge);
  const [address] = await connection.wallet.getAddresses();
  if (
    address?.toLowerCase() !== connection.address.toLowerCase() ||
    (await connection.wallet.getChainId()) !== baseSepolia.id ||
    challenge.selected.network !== "eip155:84532"
  )
    throw new Error("wallet_network_or_account_changed");
  const scheme = new ExactEvmScheme({
    address: connection.address,
    signTypedData: (message) =>
      connection.wallet.signTypedData({
        ...message,
        account: connection.address,
      } as Parameters<typeof connection.wallet.signTypedData>[0]),
  });
  const signed = await scheme.createPaymentPayload(2, challenge.selected, {
    maxAmountPerPayment: challenge.selected.amount,
  });
  return encodePaymentSignatureHeader({
    ...signed,
    resource: challenge.required.resource,
    accepted: challenge.selected,
  });
}
