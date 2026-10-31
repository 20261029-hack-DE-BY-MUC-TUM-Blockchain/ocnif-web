"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/buttons/Button/Button";
import { Icon } from "@/components/ui/data-display/Icon/Icon";
import { usePreferences } from "../settings/Preferences";
import { useCardanoStatus } from "./useCardanoStatus";
import styles from "./WalletPanel.module.css";

type WalletConnection = Awaited<
  ReturnType<typeof import("ocnif-bc-bsv").connectWallet>
>;
export function WalletPanel() {
  const { t } = usePreferences();
  const [wallet, setWallet] = useState<WalletConnection | null>(null);
  const [walletStatus, setWalletStatus] = useState("idle");
  const cardano = useCardanoStatus();
  const active = useRef(true);
  const walletAttempt = useRef(0);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      walletAttempt.current += 1;
    };
  }, []);
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
      <Link href="/payments" className={styles.link}>
        {t.managePayments}
      </Link>
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
        <b>Cardano · Masumi + Sokosumi</b>
        <output className={styles.merchantStatus}>
          {cardano.loading
            ? t.masumiChecking
            : cardano.error
              ? t.masumiUnavailable
              : cardano.status?.integration === "legacy-x402"
                ? t.masumiLegacy
                : cardano.status?.executionOnly.verified
                  ? t.masumiExecutionVerified
                  : t.masumiExecutionPending}
        </output>
        <p>{t.masumiExecutionNote}</p>
        <Link href="/payments?network=cardano" className={styles.link}>
          {t.masumiViewSetup}
        </Link>
        <Button
          variant="ghost"
          onClick={cardano.refresh}
          disabled={cardano.loading}
        >
          {t.refreshStatus}
        </Button>
      </div>
      <p>{t.paymentEmpty}</p>
      <p>{t.paymentNote}</p>
    </section>
  );
}
