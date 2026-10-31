import { readToken, type TokenOverlay, tokenOwner } from "ocnif-bc-bsv";
import type { HeldPass } from "./bsvMarket";

export async function ownsCurrentPass(
  pass: HeldPass,
  identityKey: string,
  overlay: TokenOverlay,
): Promise<boolean> {
  const output = await overlay.lookup(pass.outpoint);
  if (!output || output.spent) return false;
  const tokenOutput = output.transaction.outputs[output.outputIndex];
  const token =
    tokenOutput && readToken(tokenOutput.lockingScript, pass.outpoint);
  return !!(
    token &&
    tokenOutput.satoshis === 1 &&
    token.id === pass.tokenId &&
    token.amount === "1" &&
    token.ownerPkh === tokenOwner(identityKey, pass.keyIndex)
  );
}
