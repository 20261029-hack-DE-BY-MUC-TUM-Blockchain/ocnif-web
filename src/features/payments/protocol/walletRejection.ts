import type { Attempt } from "./journal";

export class WalletSignatureRejected extends Error {
  constructor() {
    super("wallet_user_rejected_before_proof");
  }
}

export function isUserRejection(error: unknown): boolean {
  const visited = new Set<object>();
  let current = error;
  for (let depth = 0; depth < 8; depth++) {
    if (!current || typeof current !== "object" || visited.has(current))
      return false;
    visited.add(current);
    const value = current as { code?: unknown; cause?: unknown };
    if (value.code === 4001) return true;
    current = value.cause;
  }
  return false;
}

export function stoppedSigningAttempt(
  saved: Attempt,
  proofReturned: boolean,
  cause: unknown,
): Attempt {
  const rejected =
    saved.state === "signing" &&
    !proofReturned &&
    !saved.proof &&
    !saved.result &&
    cause instanceof WalletSignatureRejected;
  return {
    ...saved,
    state: rejected ? "rejected" : "review_required",
    ...(rejected
      ? { rejection: "wallet_user_rejected_before_proof" as const }
      : {}),
  };
}
