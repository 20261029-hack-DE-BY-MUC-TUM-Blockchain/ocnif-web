"use client";
import type { SwapReceipt } from "ocnif-bc-bsv";
import { useState } from "react";
import { Button } from "@/components/ui/buttons/Button/Button";
import { usePreferences } from "../settings/Preferences";
import styles from "./Payments.module.css";
import { parseReceipt } from "./protocol/swapInput";
import { SwapReview } from "./SwapReview";

type Connection = Awaited<
  ReturnType<typeof import("ocnif-bc-bsv").connectWallet>
>;
export function SellerReceipt({ wallet }: { wallet: Connection | null }) {
  const { t } = usePreferences();
  const [input, setInput] = useState("");
  const [receipt, setReceipt] = useState<SwapReceipt | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [imported, setImported] = useState(false);
  function review() {
    setError(false);
    setImported(false);
    try {
      setReceipt(parseReceipt(input));
    } catch {
      setError(true);
      setReceipt(null);
    }
  }
  async function receive() {
    if (!wallet || !receipt) return;
    setBusy(true);
    setError(false);
    try {
      const sdk = await import("ocnif-bc-bsv");
      await sdk.receiveSwapProceeds(wallet.wallet, receipt);
      setImported(true);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className={styles.review}>
      <h3>{t.receiveProceeds}</h3>
      <p>{t.receiveProceedsNote}</p>
      <label className={styles.field}>
        {t.receiptJson}
        <textarea
          value={input}
          maxLength={4000000}
          disabled={busy}
          onChange={(event) => {
            setInput(event.target.value);
            setReceipt(null);
            setImported(false);
          }}
        />
      </label>
      <Button variant="secondary" onClick={review} disabled={!input || busy}>
        {t.reviewSwap}
      </Button>
      {receipt && (
        <>
          <SwapReview offer={receipt.offer} buyer={receipt.buyerIdentityKey} />
          <code>{receipt.txid}</code>
          <Button
            onClick={receive}
            disabled={
              !wallet ||
              wallet.identityKey !== receipt.offer.sellerIdentityKey ||
              busy ||
              imported
            }
          >
            {t.receiveProceeds}
          </Button>
        </>
      )}
      {imported && <output>{t.proceedsImported}</output>}
      {error && (
        <p role="alert" className={styles.error}>
          {t.swapError}
        </p>
      )}
    </section>
  );
}
