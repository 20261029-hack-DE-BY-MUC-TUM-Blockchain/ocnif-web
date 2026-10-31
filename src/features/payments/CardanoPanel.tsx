"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/buttons/Button/Button";
import { isReportId } from "@/lib/types/publication";
import { usePreferences } from "../settings/Preferences";
import { type Merchant, parseMerchant } from "./merchant";
import { PaymentReview } from "./PaymentReview";
import styles from "./Payments.module.css";
import {
  type CardanoConnection,
  type CardanoProvider,
  cardanoWallets,
  connectCardano,
  signCardano,
} from "./protocol/cardano";
import { usePaymentFlow } from "./usePaymentFlow";
export function CardanoPanel({
  providerConfigured,
  initialReportId = "",
}: {
  providerConfigured: boolean;
  initialReportId?: string;
}) {
  const { t } = usePreferences();
  const flow = usePaymentFlow("cardano:preprod");
  const [providers, setProviders] = useState<CardanoProvider[]>([]);
  const [selected, setSelected] = useState(0);
  const [wallet, setWallet] = useState<CardanoConnection | null>(null);
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [report, setReport] = useState(initialReportId);
  const [fee, setFee] = useState("500000");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    setProviders(cardanoWallets());
    let active = true;
    fetch("/paid/config", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        return parseMerchant(await response.json());
      })
      .then((data) => {
        if (active) setMerchant(data);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, []);
  async function connect() {
    const provider = providers[selected];
    if (!provider) return;
    setBusy(true);
    setError(false);
    try {
      setWallet(await connectCardano(provider));
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className={styles.flow}>
      <p className={styles.eyebrow}>CARDANO · PREPROD</p>
      <h2>{t.cardanoTitle}</h2>
      <p>{t.cardanoBody}</p>
      {merchant && (
        <dl>
          <dt>{t.merchantRecipient}</dt>
          <dd>{merchant.payTo || t.merchantSetup}</dd>
          <dt>{t.paymentAmount}</dt>
          <dd>{merchant.amount} lovelace</dd>
        </dl>
      )}
      {(!providerConfigured || !merchant?.configured || !providers.length) && (
        <p>{t.cardanoUnavailable}</p>
      )}
      {providers.length > 0 && (
        <label className={styles.field}>
          {t.cardanoWallet}
          <select
            value={selected}
            disabled={busy}
            onChange={(event) => setSelected(Number(event.target.value))}
          >
            {providers.map((provider, index) => (
              <option key={provider.name} value={index}>
                {provider.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <Button
        variant="secondary"
        disabled={!providers.length || busy}
        onClick={connect}
      >
        {wallet ? t.connectedWallet : t.connectCardano}
      </Button>
      {wallet && (
        <p>
          {wallet.name} · <code>{wallet.address}</code>
        </p>
      )}
      <label className={styles.field}>
        {t.reportId}
        <input
          value={report}
          maxLength={100}
          onChange={(event) => setReport(event.target.value.trim())}
        />
      </label>
      <label className={styles.field}>
        {t.feeBudget}
        <input
          inputMode="numeric"
          value={fee}
          maxLength={9}
          onChange={(event) => setFee(event.target.value)}
        />
      </label>
      <Button
        disabled={!isReportId(report) || flow.busy || !merchant?.configured}
        onClick={() => flow.load(`/paid/reports/${report}`, wallet?.address)}
      >
        {t.requestChallenge}
      </Button>
      <PaymentReview
        flow={flow}
        payer={wallet?.address}
        disabled={
          !providerConfigured ||
          !merchant?.configured ||
          !/^[1-9][0-9]{0,8}$/.test(fee)
        }
        approve={() => {
          if (wallet)
            void flow.approve(wallet.address, (challenge) =>
              signCardano(challenge, wallet, fee),
            );
        }}
      />
      {error && (
        <p role="alert" className={styles.error}>
          {t.cardanoError}
        </p>
      )}
    </section>
  );
}
