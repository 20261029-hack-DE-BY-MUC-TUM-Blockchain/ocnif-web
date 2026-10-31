"use client";
import { useState } from "react";
import {
  type Attempt,
  attemptId,
  readAttempt,
  writeAttempt,
} from "./protocol/journal";
import {
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
  async function load(endpoint: string, payer?: string) {
    setBusy(true);
    setError(false);
    setResult(null);
    setChallenge(null);
    setAttempt(null);
    try {
      const response = await requestChallenge(endpoint, network);
      if (response.challenge) {
        const existing = payer
          ? await readAttempt(attemptId(response.challenge, payer))
          : undefined;
        setChallenge(existing?.challenge || response.challenge);
        setAttempt(existing || null);
        if (existing?.result) setResult(existing.result);
      } else setResult(response.result);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
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
    if (!challenge || !payer || busy) return;
    setBusy(true);
    setError(false);
    const pending: Attempt = {
      id: attemptId(challenge, payer),
      state: "signing",
      challenge,
      createdAt: Date.now(),
    };
    let reserved = false;
    try {
      await writeAttempt(pending, true);
      reserved = true;
      setAttempt(pending);
      const proof = await signer(challenge);
      const signed: Attempt = { ...pending, state: "signed", proof };
      await writeAttempt(signed);
      setAttempt(signed);
      await submit(signed);
    } catch {
      if (reserved) {
        const saved = await readAttempt(pending.id);
        if (saved?.state === "signing") {
          const stopped: Attempt = { ...saved, state: "review_required" };
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
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  async function retrySameProof() {
    if (!attempt?.proof || busy) return;
    setBusy(true);
    setError(false);
    try {
      await submit(attempt);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  return {
    challenge,
    result,
    attempt,
    busy,
    error,
    load,
    approve,
    retrySameProof,
  };
}
