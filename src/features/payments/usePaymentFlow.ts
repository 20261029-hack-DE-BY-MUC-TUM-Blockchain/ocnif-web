"use client";
import { useEffect, useRef, useState } from "react";
import {
  type Attempt,
  attemptId,
  beginReviewedAttempt,
  readAttempt,
  refreshReviewedTerms,
  writeAttempt,
} from "./protocol/journal";
import { recoveryReason } from "./protocol/paymentRecovery";
import { stoppedSigningAttempt } from "./protocol/walletRejection";
import {
  assertFresh,
  type Challenge,
  type PaymentResult,
  requestChallenge,
  submitProof,
} from "./protocol/x402";
export function usePaymentFlow(network: "eip155:84532" | "cardano:preprod") {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [result, setResult] = useState<PaymentResult | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [storageBlocked, setStorageBlocked] = useState(false);
  const [now, setNow] = useState(Date.now());
  const locked = useRef(false);
  useEffect(() => {
    if (attempt?.state !== "settled") return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [attempt?.state]);
  function start() {
    if (locked.current) return false;
    locked.current = true;
    setBusy(true);
    setError(false);
    setStorageBlocked(false);
    return true;
  }
  function stop() {
    locked.current = false;
    setBusy(false);
    setNow(Date.now());
  }
  function fail(cause: unknown) {
    setError(true);
    setStorageBlocked(
      cause instanceof Error &&
        cause.message === "payment_storage_upgrade_blocked",
    );
  }
  async function load(endpoint: string, payer?: string) {
    if (!start()) return;
    setResult(null);
    setChallenge(null);
    setAttempt(null);
    try {
      const response = await requestChallenge(endpoint, network);
      if (response.challenge) {
        let existing = payer
          ? await readAttempt(attemptId(response.challenge, payer))
          : undefined;
        if (existing?.state === "reviewing")
          existing = await refreshReviewedTerms(existing, response.challenge);
        setChallenge(existing?.challenge || response.challenge);
        setAttempt(existing || null);
        if (existing?.result) setResult(existing.result);
      } else setResult(response.result);
    } catch (cause) {
      fail(cause);
    } finally {
      stop();
    }
  }
  async function submit(current: Attempt) {
    if (!current.proof) throw new Error("payment_proof_unavailable");
    const submitting: Attempt = { ...current, state: "submitting" };
    await writeAttempt(submitting);
    setAttempt(submitting);
    try {
      const response = await submitProof(current.challenge, current.proof);
      const finished: Attempt = {
        ...current,
        state: response.settlement?.success ? "settled" : "review_required",
        result: response,
      };
      await writeAttempt(finished);
      setAttempt(finished);
      setResult(response);
    } catch {
      const interrupted: Attempt = { ...current, state: "review_required" };
      await writeAttempt(interrupted);
      setAttempt(interrupted);
      throw new Error("payment_outcome_unknown");
    }
  }
  async function approve(
    payer: string,
    signer: (challenge: Challenge) => Promise<string>,
  ) {
    if (
      !challenge ||
      !payer ||
      (attempt && attempt.state !== "reviewing") ||
      (attempt && attempt.id !== attemptId(challenge, payer)) ||
      !start()
    )
      return;
    const pending: Attempt = {
      ...attempt,
      id: attemptId(challenge, payer),
      state: "signing",
      challenge,
      createdAt: attempt?.createdAt ?? Date.now(),
    };
    let reserved = false;
    let proofReturned = false;
    try {
      assertFresh(challenge);
      await writeAttempt(pending, true);
      reserved = true;
      setAttempt(pending);
      const proof = await signer(challenge);
      proofReturned = true;
      const signed: Attempt = { ...pending, state: "signed", proof };
      await writeAttempt(signed);
      setAttempt(signed);
      await submit(signed);
    } catch (cause) {
      try {
        if (reserved) {
          const saved = await readAttempt(pending.id);
          if (saved?.state === "signing") {
            const stopped = stoppedSigningAttempt(saved, proofReturned, cause);
            await writeAttempt(stopped);
            setAttempt(stopped);
          }
        } else {
          const saved = await readAttempt(pending.id);
          if (saved) {
            setAttempt(saved);
            setChallenge(saved.challenge);
          }
        }
      } catch (storageCause) {
        fail(storageCause);
        return;
      }
      fail(cause);
    } finally {
      stop();
    }
  }
  async function retrySameProof() {
    if (!attempt?.proof || attempt.state === "settled" || !start()) return;
    try {
      await submit(attempt);
    } catch (cause) {
      fail(cause);
    } finally {
      stop();
    }
  }
  async function newAttempt(payer: string) {
    if (
      !attempt ||
      attempt.id !== attemptId(attempt.challenge, payer) ||
      !start()
    )
      return;
    try {
      const current = await readAttempt(attempt.id);
      if (!current || JSON.stringify(current) !== JSON.stringify(attempt))
        throw new Error("existing_payment_requires_review");
      if (!recoveryReason(current))
        throw new Error("existing_payment_requires_review");
      const response = await requestChallenge(
        current.challenge.endpoint,
        network,
      );
      if (!response.challenge) throw new Error("missing_payment_challenge");
      const reviewed = await beginReviewedAttempt(current, response.challenge);
      setAttempt(reviewed);
      setChallenge(reviewed.challenge);
      setResult(null);
    } catch (cause) {
      fail(cause);
    } finally {
      stop();
    }
  }
  return {
    challenge,
    result,
    attempt,
    busy,
    error,
    storageBlocked,
    recovery: attempt ? recoveryReason(attempt, now) : null,
    load,
    approve,
    retrySameProof,
    newAttempt,
  };
}
