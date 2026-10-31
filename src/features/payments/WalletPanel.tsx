"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/buttons/Button/Button";
import { Icon } from "@/components/ui/data-display/Icon/Icon";
import { usePreferences } from "../settings/Preferences";
import { type Merchant, parseMerchant } from "./merchant";
import styles from "./WalletPanel.module.css";

type WalletConnection = Awaited<
  ReturnType<typeof import("ocnif-bc-bsv").connectWallet>
>;
export function WalletPanel() {
  const { t } = usePreferences();
  const [wallet, setWallet] = useState<WalletConnection | null>(null);
  const [walletStatus, setWalletStatus] = useState("idle");
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [merchantStatus, setMerchantStatus] = useState("checking");
  const active = useRef(true);
  const walletAttempt = useRef(0);
  const checkMerchant = useCallback(async (signal?: AbortSignal) => {
    setMerchantStatus("checking");
    try {
      const response = await fetch("/paid/config", {
        credentials: "same-origin",
        cache: "no-store",
        signal,
      });
      if (!response.ok) throw new Error("Merchant unavailable");
      const result = parseMerchant(await response.json());
      if (active.current) {
        setMerchant(result);
        setMerchantStatus(result.configured ? "ready" : "setup");
      }
    } catch {
      if (active.current && !signal?.aborted) setMerchantStatus("unavailable");
    }
  }, []);
  useEffect(() => {
    active.current = true;
    const controller = new AbortController();
    void checkMerchant(controller.signal);
    return () => {
      active.current = false;
      walletAttempt.current += 1;
      controller.abort();
    };
  }, [checkMerchant]);
  async function connect() {
    const attempt = ++walletAttempt.current;
    setWalletStatus("connecting");
    try {
      const { connectWallet } = await import("ocnif-bc-bsv");
      const result = await connectWallet();
      if (active.current && attempt === walletAttempt.current) {
        setWallet(result);
        setWalletStatus("connected");
      }
    } catch {
      if (active.current && attempt === walletAttempt.current)
        setWalletStatus("error");
    }
  }
  function disconnect() {
    walletAttempt.current += 1;
    setWallet(null);
    setWalletStatus("idle");
  }
  return (
    <section className={styles.panel}>
      <h3>
        <Icon name="wallet" />
        {t.payments}
      </h3>
      <div className={styles.network}>
        <b>BSV · BRC-100</b>
        <p>{t.walletIntro}</p>
        {wallet ? (
          <>
            <dl>
              <dt>{t.walletNetwork}</dt>
              <dd>{wallet.network}</dd>
              <dt>{t.walletIdentity}</dt>
              <dd>
                <code>{wallet.identityKey}</code>
              </dd>
            </dl>
            <p className={styles.status}>{t.walletConnected}</p>
            <p>{t.walletFunds}</p>
            <Button variant="ghost" onClick={disconnect}>
              {t.walletDisconnect}
            </Button>
          </>
        ) : (
          <Button
            variant="secondary"
            onClick={connect}
            disabled={walletStatus === "connecting"}
          >
            {walletStatus === "connecting"
              ? t.walletDiscovering
              : t.walletConnect}
          </Button>
        )}
        {walletStatus === "error" && <p role="alert">{t.walletError}</p>}
      </div>
      <div className={styles.network}>
        <b>Cardano · x402</b>
        <output className={styles.merchantStatus}>
          {merchantStatus === "checking"
            ? t.serviceChecking
            : merchantStatus === "ready"
              ? t.merchantReady
              : merchantStatus === "setup"
                ? t.merchantSetup
                : t.merchantUnavailable}
        </output>
        {merchant && (
          <dl>
            <dt>{t.walletNetwork}</dt>
            <dd>{merchant.network}</dd>
            <dt>{t.merchantPrice}</dt>
            <dd>{merchant.amount} lovelace</dd>
            {merchant.payTo && (
              <>
                <dt>{t.merchantRecipient}</dt>
                <dd>
                  <code>{merchant.payTo}</code>
                </dd>
              </>
            )}
          </dl>
        )}
        <Button
          variant="ghost"
          onClick={() => checkMerchant()}
          disabled={merchantStatus === "checking"}
        >
          {t.refreshStatus}
        </Button>
      </div>
      <p>{t.paymentEmpty}</p>
      <p>{t.paymentNote}</p>
    </section>
  );
}
