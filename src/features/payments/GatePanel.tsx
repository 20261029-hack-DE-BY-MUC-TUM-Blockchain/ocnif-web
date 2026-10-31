"use client";
import { useEffect, useState } from "react";
import { type Address, formatEther, isAddress } from "viem";
import { Button } from "@/components/ui/buttons/Button/Button";
import { usePreferences } from "../settings/Preferences";
import styles from "./Payments.module.css";
import type { EvmConnection } from "./protocol/evm";
import {
  confirmGate,
  evidenceFor,
  type GateReview,
  policyFor,
  reviewGate,
  sendGate,
} from "./protocol/gate";
import { type GateRecord, readGate, writeGate } from "./protocol/gateJournal";
export function GatePanel({
  wallet,
  cve,
  evidence,
}: {
  wallet: EvmConnection | null;
  cve: string;
  evidence: unknown;
}) {
  const { t } = usePreferences();
  const [age, setAge] = useState(600);
  const [threshold, setThreshold] = useState(70);
  const [contract, setContract] = useState("");
  const [review, setReview] = useState<GateReview | null>(null);
  const [attempt, setAttempt] = useState<GateRecord | null>(null);
  const [result, setResult] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const policyKey = `84532:${wallet?.address.toLowerCase()}:${cve}:${age}:${threshold}`;
  useEffect(() => {
    setReview(null);
    setAttempt(null);
    setContract("");
    setResult(null);
    let active = true;
    void readGate(`deploy:${policyKey}`)
      .then((value) => {
        if (active && value) {
          setAttempt(value);
          if (value.address) setContract(value.address);
        }
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [policyKey]);
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(false);
    try {
      await action();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  async function estimate(kind: "deploy" | "submit") {
    if (!wallet) return;
    await run(async () => {
      const policy = policyFor(cve, age, threshold);
      if (kind === "submit" && !isAddress(contract))
        throw new Error("invalid_contract");
      setReview(
        await reviewGate(
          wallet,
          policy,
          kind === "submit" ? (contract as Address) : undefined,
          kind === "submit" ? evidenceFor(evidence, cve, policy) : undefined,
        ),
      );
      setAttempt(
        kind === "deploy"
          ? (await readGate(`deploy:${policyKey}`)) || null
          : null,
      );
    });
  }
  async function finish(current: GateRecord, selected: GateReview) {
    if (!wallet || !current.transaction) return;
    const confirmed = await confirmGate(wallet, selected, current.transaction);
    setResult(confirmed);
    setContract(confirmed.address);
    const updated: GateRecord = {
      ...current,
      state: "confirmed",
      address: confirmed.address,
    };
    await writeGate(updated);
    setAttempt(updated);
  }
  async function authorize() {
    if (!wallet || !review) return;
    await run(async () => {
      const id =
        review.kind === "deploy"
          ? `deploy:${policyKey}`
          : `submit:${policyKey}:${review.address}:${review.evidence?.timestamp}`;
      const existing = await readGate(id);
      if (existing) {
        setAttempt(existing);
        if (existing.transaction) await finish(existing, review);
        return;
      }
      const pending: GateRecord = { id, state: "signing" };
      await writeGate(pending, true);
      setAttempt(pending);
      try {
        const transaction = await sendGate(wallet, review);
        const sent: GateRecord = { ...pending, state: "pending", transaction };
        await writeGate(sent);
        setAttempt(sent);
        await finish(sent, review);
      } catch {
        const saved = await readGate(id);
        if (saved) {
          const stopped = { ...saved, state: "review_required" as const };
          await writeGate(stopped);
          setAttempt(stopped);
        }
        throw new Error("gate_wallet_or_receipt_requires_review");
      }
    });
  }
  async function recheck() {
    if (!wallet || !attempt?.transaction) return;
    await run(async () => {
      const selected = review || {
        kind: "deploy" as const,
        policy: policyFor(cve, age, threshold),
        gas: 0n,
        maxFeePerGas: 0n,
        maxPriorityFeePerGas: 0n,
        createdAt: 0,
      };
      await finish(attempt, selected);
    });
  }
  return (
    <section className={styles.review}>
      <h3>{t.gateTitle}</h3>
      <p>{t.gateBody}</p>
      <div className={styles.actions}>
        <label className={styles.field}>
          {t.gateAge}
          <input
            type="number"
            min={1}
            max={3600}
            value={age}
            disabled={busy}
            onChange={(event) => setAge(Number(event.target.value))}
          />
        </label>
        <label className={styles.field}>
          {t.gateThreshold}
          <input
            type="number"
            min={0}
            max={100}
            value={threshold}
            disabled={busy}
            onChange={(event) => setThreshold(Number(event.target.value))}
          />
        </label>
      </div>
      <Button
        variant="secondary"
        disabled={
          !wallet ||
          busy ||
          wallet.chainId !== 84532 ||
          !/^CVE-\d{4}-\d{4,}$/.test(cve)
        }
        onClick={() => estimate("deploy")}
      >
        {t.gateEstimateDeployment}
      </Button>
      <label className={styles.field}>
        {t.gateContract}
        <input
          value={contract}
          maxLength={42}
          disabled={busy}
          onChange={(event) => {
            setContract(event.target.value);
            setReview(null);
            setAttempt(null);
          }}
        />
      </label>
      <Button
        variant="secondary"
        disabled={!wallet || busy || !isAddress(contract) || !evidence}
        onClick={() => estimate("submit")}
      >
        {t.gateEstimateSubmission}
      </Button>
      {review && (
        <section className={styles.review}>
          <h3>{review.kind === "deploy" ? t.gateDeploy : t.gateSubmit}</h3>
          <p>{t.gateReviewNote}</p>
          <dl>
            <dt>{t.walletNetwork}</dt>
            <dd>Base Sepolia · 84532</dd>
            <dt>{t.gateSigner}</dt>
            <dd>{review.policy.signer}</dd>
            <dt>{t.gateRequestHash}</dt>
            <dd>{review.policy.requestHash}</dd>
            <dt>{t.gateAge}</dt>
            <dd>{review.policy.maximumAge}</dd>
            <dt>{t.gateThreshold}</dt>
            <dd>
              {review.policy.thresholdTenths} / 100 · CVSS{" "}
              {review.policy.thresholdTenths / 10}
            </dd>
            <dt>{t.gateGas}</dt>
            <dd>{String(review.gas)}</dd>
            <dt>{t.gateMaxCost}</dt>
            <dd>{formatEther(review.gas * review.maxFeePerGas)} test ETH</dd>
            <dt>{t.gateTotalEstimate}</dt>
            <dd>
              {review.estimatedTotalFee === undefined
                ? t.unavailable
                : formatEther(review.estimatedTotalFee)}{" "}
              test ETH
            </dd>
            <dt>{t.gateMaxFee}</dt>
            <dd>{String(review.maxFeePerGas)} wei</dd>
          </dl>
          {review.address && (
            <p>
              <code>{review.address}</code>
            </p>
          )}
          {!attempt && (
            <Button onClick={authorize} disabled={busy}>
              {t.gateAuthorize}
            </Button>
          )}
        </section>
      )}
      {attempt && (
        <p>
          {t.gateRecorded} <code>{attempt.state}</code>{" "}
          {attempt.transaction && <code>{attempt.transaction}</code>}
        </p>
      )}
      {attempt?.transaction && attempt.state !== "confirmed" && (
        <Button variant="secondary" onClick={recheck} disabled={busy}>
          {t.gateRecheck}
        </Button>
      )}
      {result !== null && (
        <pre>
          {JSON.stringify(
            result,
            (_, value) =>
              typeof value === "bigint" ? value.toString() : value,
            2,
          )}
        </pre>
      )}
      {error && (
        <p role="alert" className={styles.error}>
          {t.gateError}
        </p>
      )}
    </section>
  );
}
