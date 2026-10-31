"use client";
import { useState } from "react";
import { Button } from "@/components/ui/buttons/Button/Button";
import { usePreferences } from "../settings/Preferences";
import { GatePanel } from "./GatePanel";
import { PaymentReview } from "./PaymentReview";
import styles from "./Payments.module.css";
import { connectEvm, type EvmConnection, signEvm } from "./protocol/evm";
import { usePaymentFlow } from "./usePaymentFlow";
export function Api3Panel() {
  const { t } = usePreferences();
  const [wallet, setWallet] = useState<EvmConnection | null>(null);
  const [cve, setCve] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const flow = usePaymentFlow("eip155:84532");
  async function connect() {
    setBusy(true);
    setError(false);
    try {
      setWallet(await connectEvm());
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  async function switchNetwork() {
    if (!wallet) return;
    setBusy(true);
    try {
      await wallet.wallet.switchChain({ id: 84532 });
      setWallet({ ...wallet, chainId: await wallet.wallet.getChainId() });
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className={styles.flow}>
      <p className={styles.eyebrow}>API3 · BASE SEPOLIA</p>
      <h2>{t.api3Title}</h2>
      <p>{t.api3Body}</p>
      <div className={styles.actions}>
        <Button variant="secondary" disabled={busy} onClick={connect}>
          {wallet ? t.connectedWallet : t.connectEvm}
        </Button>
        {wallet && wallet.chainId !== 84532 && (
          <Button onClick={switchNetwork} disabled={busy}>
            {t.switchBase}
          </Button>
        )}
      </div>
      {wallet && (
        <p>
          <code>{wallet.address}</code> · {wallet.chainId}
        </p>
      )}
      {error && <p role="alert">{t.evmError}</p>}
      <label className={styles.field}>
        {t.cveLabel}
        <input
          value={cve}
          onChange={(event) => setCve(event.target.value.toUpperCase())}
          disabled={flow.busy}
          maxLength={30}
          placeholder="CVE-2021-44228"
        />
      </label>
      <Button
        disabled={!/^CVE-\d{4}-\d{4,}$/.test(cve) || flow.busy}
        onClick={() =>
          flow.load(`/api/v1/vulnerabilities/${cve}`, wallet?.address)
        }
      >
        {t.requestChallenge}
      </Button>
      <PaymentReview
        flow={flow}
        expectedEndpoint={`/api/v1/vulnerabilities/${cve}`}
        payer={wallet?.address}
        disabled={wallet?.chainId !== 84532}
        approve={() => {
          if (
            wallet &&
            flow.challenge?.endpoint === `/api/v1/vulnerabilities/${cve}`
          )
            void flow.approve(wallet.address, (challenge) =>
              signEvm(challenge, wallet),
            );
        }}
      />
      <GatePanel
        wallet={wallet}
        cve={cve}
        evidence={flow.result?.delivered ? flow.result.body : undefined}
      />
    </section>
  );
}
