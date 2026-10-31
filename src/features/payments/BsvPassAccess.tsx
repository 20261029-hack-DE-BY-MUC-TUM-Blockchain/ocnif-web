"use client";
import type { AccessChallenge } from "ocnif-bc-bsv";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/buttons/Button/Button";
import { bsvCopy } from "@/lib/i18n/bsv";
import { usePreferences } from "../settings/Preferences";
import styles from "./Payments.module.css";
import {
  marketBaseUrl,
  marketRequest,
  parseAccessChallenge,
  parseAccessDelivery,
  validKeyIndex,
  validOutpoint,
} from "./protocol/bsvMarket";
import type { BsvMarketState } from "./useBsvMarket";

export function BsvPassAccess({
  market: m,
  transferred,
}: {
  market: BsvMarketState;
  transferred?: { outpoint: string; keyIndex: number };
}) {
  const { t, locale } = usePreferences();
  const b = bsvCopy[locale];
  const [outpoint, setOutpoint] = useState("");
  const [keyIndex, setKeyIndex] = useState(0);
  const [challenge, setChallenge] = useState<AccessChallenge | null>(null);
  const defaultOutpoint = transferred?.outpoint ?? m.heldPass?.outpoint ?? "";
  const defaultKeyIndex = transferred?.keyIndex ?? m.heldPass?.keyIndex ?? 0;
  useEffect(() => {
    setOutpoint(defaultOutpoint);
    setKeyIndex(defaultKeyIndex);
    setChallenge(null);
  }, [defaultOutpoint, defaultKeyIndex]);

  async function review() {
    if (
      !m.wallet ||
      !validOutpoint(outpoint) ||
      !validKeyIndex(keyIndex) ||
      !m.activeReportId
    )
      return;
    const wallet = m.wallet;
    await m.run(async () => {
      const expected = {
        reportId: m.activeReportId,
        outpoint,
        holderIdentityKey: wallet.identityKey,
        keyIndex,
      };
      const value = await marketRequest(
        `/v1/reports/${m.activeReportId}/token-challenge`,
        { outpoint, holderIdentityKey: wallet.identityKey, keyIndex },
      );
      setChallenge(parseAccessChallenge(value, expected));
    });
  }

  async function access() {
    if (!m.wallet || !challenge) return;
    const wallet = m.wallet;
    await m.run(async () => {
      const sdk = await import("ocnif-bc-bsv");
      const signature = await sdk.signReportAccess(wallet.wallet, challenge);
      const report = parseAccessDelivery(
        await marketRequest(
          `/v1/reports/${challenge.reportId}/token-access`,
          signature,
        ),
        challenge,
      );
      const output = await new sdk.HttpTokenOverlay(marketBaseUrl()).lookup(
        challenge.outpoint,
      );
      const token =
        output &&
        sdk.readToken(
          output.transaction.outputs[output.outputIndex].lockingScript,
          challenge.outpoint,
        );
      if (
        !output ||
        output.spent ||
        !token ||
        token.amount !== "1" ||
        token.ownerPkh !==
          sdk.tokenOwner(wallet.identityKey, challenge.keyIndex)
      )
        throw new Error("holder_output_mismatch");
      m.setHeldPass({
        reportId: challenge.reportId,
        reportDigest: challenge.reportDigest,
        tokenId: token.id,
        outpoint: challenge.outpoint,
        keyIndex: challenge.keyIndex,
      });
      m.setReport(report);
      m.setDeliveryKind("access");
      setChallenge(null);
    });
  }
  return (
    <section className={styles.review}>
      <h3>{b.access}</h3>
      <p>{b.accessNote}</p>
      {transferred && <p>{b.transferNote}</p>}
      <label className={styles.field}>
        {t.tokenOutpoint}
        <input
          value={outpoint}
          maxLength={80}
          disabled={m.busy}
          onChange={(event) => {
            setOutpoint(event.target.value);
            setChallenge(null);
          }}
        />
      </label>
      <label className={styles.field}>
        {b.keyIndex}
        <input
          type="number"
          min={0}
          max={2147483647}
          value={keyIndex}
          disabled={m.busy}
          onChange={(event) => {
            setKeyIndex(Number(event.target.value));
            setChallenge(null);
          }}
        />
      </label>
      <Button
        variant="secondary"
        onClick={review}
        disabled={
          m.busy || !validOutpoint(outpoint) || !validKeyIndex(keyIndex)
        }
      >
        {b.accessReview}
      </Button>
      {challenge && (
        <>
          <dl>
            <dt>{t.reportId}</dt>
            <dd>{challenge.reportId}</dd>
            <dt>{t.walletIdentity}</dt>
            <dd>{challenge.holderIdentityKey}</dd>
            <dt>{t.tokenOutpoint}</dt>
            <dd>{challenge.outpoint}</dd>
            <dt>{b.digest}</dt>
            <dd>{challenge.reportDigest}</dd>
            <dt>{b.expires}</dt>
            <dd>{new Date(challenge.expiresAt).toLocaleString(locale)}</dd>
          </dl>
          <Button
            onClick={access}
            disabled={m.busy || Date.now() >= challenge.expiresAt}
          >
            {b.accessApprove}
          </Button>
        </>
      )}
    </section>
  );
}
