"use client";
import type { ReportOffer } from "ocnif-bc-bsv";
import { useState } from "react";
import { Button } from "@/components/ui/buttons/Button/Button";
import { bsvCopy } from "@/lib/i18n/bsv";
import { isReportId } from "@/lib/types/publication";
import { usePreferences } from "../settings/Preferences";
import { BsvListings } from "./BsvListings";
import { BsvPassAccess } from "./BsvPassAccess";
import { BsvDeliveredReport, BsvReportControls } from "./BsvReportControls";
import { BsvSwapPanel } from "./BsvSwapPanel";
import styles from "./Payments.module.css";
import { useBsvMarket } from "./useBsvMarket";

export function BsvMarketPanel({
  overlayUrl,
  initialReportId,
}: {
  overlayUrl?: string;
  initialReportId?: string;
}) {
  const { t, locale } = usePreferences();
  const b = bsvCopy[locale];
  const state = useBsvMarket(overlayUrl, initialReportId);
  const [swapBusy, setSwapBusy] = useState(false);
  const m = { ...state, busy: state.busy || swapBusy || state.checking };
  const [selection, setSelection] = useState<ReportOffer | null>(null);
  const [transferred, setTransferred] = useState<{
    outpoint: string;
    keyIndex: number;
  }>();
  const selectionActive =
    selection?.reportId === m.activeReportId ? selection : null;
  return (
    <section className={styles.flow}>
      <p className={styles.eyebrow}>BSV · BRC-121 · BSV-21</p>
      <h2>{b.title}</h2>
      <p>{b.intro}</p>
      {m.checking ? (
        <output>{b.checking}</output>
      ) : !m.config ? (
        <output>{b.unavailable}</output>
      ) : (
        <section className={styles.review}>
          <h3>{b.readiness}</h3>
          <dl>
            <dt>{t.walletNetwork}</dt>
            <dd>{m.config.network}</dd>
            <dt>{t.overlayLabel}</dt>
            <dd>{m.config.overlayUrl}</dd>
            <dt>{b.merchant}</dt>
            <dd>
              {m.config.paymentStatus === "ready" ? b.configured : b.setup}
              {m.config.merchantIdentityKey && (
                <>
                  <br />
                  <code>{m.config.merchantIdentityKey}</code>
                </>
              )}
            </dd>
            <dt>{b.issuer}</dt>
            <dd>
              {m.config.passStatus === "ready" ? b.configured : b.setup}
              {m.config.issuerIdentityKey && (
                <>
                  <br />
                  <code>{m.config.issuerIdentityKey}</code>
                </>
              )}
            </dd>
          </dl>
          <p>{b.readinessNote}</p>
        </section>
      )}
      <div className={styles.actions}>
        <Button
          variant="secondary"
          onClick={m.refresh}
          disabled={m.checking || m.busy}
        >
          {t.refreshStatus}
        </Button>
        <Button
          onClick={() => {
            setSelection(null);
            setTransferred(undefined);
            void m.connect();
          }}
          disabled={m.busy}
        >
          {m.wallet ? t.connectedWallet : t.walletConnect}
        </Button>
      </div>
      {m.wallet && (
        <p>
          <code>{m.wallet.identityKey}</code> · {m.wallet.network} ·{" "}
          {t.walletFunds}
        </p>
      )}
      <label className={styles.field}>
        {t.reportId}
        <input
          value={m.reportId}
          maxLength={100}
          disabled={m.busy}
          onChange={(event) => {
            m.setReportId(event.target.value);
            setSelection(null);
            setTransferred(undefined);
          }}
        />
      </label>
      <p>{b.loadNote}</p>
      <Button
        variant="secondary"
        onClick={m.load}
        disabled={
          m.busy ||
          !m.wallet ||
          !m.config ||
          m.wallet.network !== m.config.network ||
          !isReportId(m.reportId)
        }
      >
        {b.load}
      </Button>
      {m.activeReportId && m.config && (
        <>
          <BsvReportControls market={m} />
          {m.config?.passStatus === "ready" && (
            <BsvPassAccess
              key={`${m.activeReportId}:${m.wallet?.identityKey}`}
              market={m}
              transferred={transferred}
            />
          )}
          <BsvDeliveredReport market={m} />
          <BsvListings
            key={`${m.activeReportId}:${m.wallet?.identityKey}`}
            market={m}
            onSelect={setSelection}
          />
        </>
      )}
      <details className={styles.review} open={!!selectionActive}>
        <summary>{b.swap}</summary>
        {selectionActive && (
          <p>
            {t.reportId}: <code>{selectionActive.reportId}</code> · {b.digest}:{" "}
            <code>{selectionActive.reportDigest}</code>
          </p>
        )}
        {m.wallet && (
          <BsvSwapPanel
            key={`${selectionActive?.offer.id ?? "manual"}:${m.wallet?.identityKey ?? "none"}`}
            overlayUrl={m.config ? overlayUrl : undefined}
            connection={m.wallet ?? undefined}
            initialOffer={selectionActive?.offer}
            blocked={state.busy}
            onBusyChange={setSwapBusy}
            onReceipt={(receipt) => {
              if (m.heldPass?.outpoint === receipt.offer.outpoint)
                m.setHeldPass(null);
              if (
                selectionActive &&
                receipt.buyerIdentityKey === m.wallet?.identityKey
              )
                setTransferred({
                  outpoint: `${receipt.txid}.1`,
                  keyIndex: receipt.buyerKeyIndex,
                });
            }}
          />
        )}
      </details>
      {m.error && (
        <p className={styles.error} role="alert">
          {b.requestFailed}
        </p>
      )}
    </section>
  );
}
