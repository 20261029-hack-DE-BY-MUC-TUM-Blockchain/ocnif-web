"use client";
import type { PreparedSwap, SwapOffer, SwapReceipt } from "ocnif-bc-bsv";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/buttons/Button/Button";
import { usePreferences } from "../settings/Preferences";
import styles from "./Payments.module.css";
import { parseOffer, parsePrepared } from "./protocol/swapInput";
import { SellerReceipt } from "./SellerReceipt";
import { SwapReview } from "./SwapReview";

type Connection = Awaited<
  ReturnType<typeof import("ocnif-bc-bsv").connectWallet>
>;
export function BsvSwapPanel({
  overlayUrl,
  connection,
  initialOffer,
  blocked = false,
  onBusyChange,
  onReceipt,
}: {
  overlayUrl?: string;
  connection?: Connection;
  initialOffer?: SwapOffer;
  blocked?: boolean;
  onBusyChange?: (busy: boolean) => void;
  onReceipt?: (receipt: SwapReceipt) => void;
}) {
  const { t } = usePreferences();
  const [localWallet, setWallet] = useState<Connection | null>(null);
  const wallet = connection ?? localWallet;
  const [mode, setMode] = useState<"buyer" | "seller">("buyer");
  const [input, setInput] = useState(
    initialOffer ? JSON.stringify(initialOffer) : "",
  );
  const [signature, setSignature] = useState("");
  const [keyIndex, setKeyIndex] = useState(0);
  const [offer, setOffer] = useState<SwapOffer | null>(initialOffer ?? null);
  const [prepared, setPrepared] = useState<PreparedSwap | null>(null);
  const [receipt, setReceipt] = useState<SwapReceipt | null>(null);
  const [localBusy, setBusy] = useState(false);
  const busy = localBusy || blocked;
  const locked = useRef(false);
  const [error, setError] = useState(false);
  const [state, setState] = useState("");
  async function run(action: () => Promise<void>) {
    if (locked.current || blocked) return;
    locked.current = true;
    setBusy(true);
    onBusyChange?.(true);
    setError(false);
    try {
      await action();
    } catch {
      setError(true);
    } finally {
      locked.current = false;
      setBusy(false);
      onBusyChange?.(false);
    }
  }
  async function connect() {
    await run(async () => {
      const sdk = await import("ocnif-bc-bsv");
      setWallet(await sdk.connectWallet());
    });
  }
  function review() {
    setError(false);
    try {
      if (mode === "buyer") {
        setOffer(parseOffer(JSON.parse(input)));
        setPrepared(null);
      } else {
        const data = parsePrepared(input);
        setPrepared(data);
        setOffer(data.offer);
      }
      setReceipt(null);
      setSignature("");
      setState("");
    } catch {
      setError(true);
    }
  }
  async function prepare() {
    if (!wallet || !offer || !overlayUrl) return;
    await run(async () => {
      const sdk = await import("ocnif-bc-bsv");
      const journal = new sdk.IndexedDBSwapJournal();
      const existing = await journal.get(
        `swap:${wallet.identityKey}:${offer.outpoint}`,
      );
      if (existing) {
        setPrepared(existing.prepared || null);
        setReceipt(existing.receipt || null);
        if (existing.receipt) onReceipt?.(existing.receipt);
        setState(existing.status);
        return;
      }
      const data = await sdk.prepareSwap(
        wallet.wallet,
        offer,
        { ...offer, buyerIdentityKey: wallet.identityKey },
        keyIndex,
        new sdk.HttpTokenOverlay(overlayUrl),
        journal,
      );
      setPrepared(data);
      setState("prepared");
    });
  }
  async function approveSeller() {
    if (!wallet || !prepared || !overlayUrl) return;
    await run(async () => {
      const sdk = await import("ocnif-bc-bsv");
      setSignature(
        await sdk.approveSwap(
          wallet.wallet,
          prepared,
          { ...prepared.offer, buyerIdentityKey: prepared.buyerIdentityKey },
          new sdk.HttpTokenOverlay(overlayUrl),
        ),
      );
      setState("seller_signed");
    });
  }
  async function complete() {
    if (
      !wallet ||
      !prepared ||
      !overlayUrl ||
      !/^[a-f0-9]{100,4096}$/i.test(signature)
    )
      return;
    await run(async () => {
      const sdk = await import("ocnif-bc-bsv");
      const result = await sdk.completeSwap(
        wallet.wallet,
        prepared,
        signature,
        { ...prepared.offer, buyerIdentityKey: prepared.buyerIdentityKey },
        new sdk.HttpTokenOverlay(overlayUrl),
        new sdk.IndexedDBSwapJournal(),
      );
      setReceipt(result);
      onReceipt?.(result);
      setState(result.status);
    });
  }
  async function reconcile() {
    if (!wallet || !receipt || !overlayUrl) return;
    await run(async () => {
      const sdk = await import("ocnif-bc-bsv");
      const result = await sdk.reconcileSwap(
        wallet.wallet,
        receipt,
        new sdk.HttpTokenOverlay(overlayUrl),
        new sdk.IndexedDBSwapJournal(),
      );
      setReceipt(result);
      onReceipt?.(result);
      setState(result.status);
    });
  }
  return (
    <section className={styles.flow}>
      <p className={styles.eyebrow}>BSV · ATOMIC DVP</p>
      <h2>{t.bsvTitle}</h2>
      <p>{t.bsvBody}</p>
      {!overlayUrl ? (
        <p>{t.overlayUnavailable}</p>
      ) : (
        <p>
          {t.overlayLabel}: <code>{overlayUrl}</code>
        </p>
      )}
      {!connection && (
        <Button variant="secondary" onClick={connect} disabled={busy}>
          {wallet ? t.connectedWallet : t.walletConnect}
        </Button>
      )}
      {wallet && (
        <p>
          <code>{wallet.identityKey}</code> · {wallet.network}
        </p>
      )}
      <div className={styles.actions}>
        <Button
          variant={mode === "buyer" ? "primary" : "ghost"}
          disabled={busy}
          onClick={() => {
            setMode("buyer");
            setPrepared(null);
            setOffer(null);
            setSignature("");
          }}
        >
          {t.buyer}
        </Button>
        <Button
          variant={mode === "seller" ? "primary" : "ghost"}
          disabled={busy}
          onClick={() => {
            setMode("seller");
            setPrepared(null);
            setOffer(null);
            setSignature("");
          }}
        >
          {t.seller}
        </Button>
      </div>
      <label className={styles.field}>
        {mode === "buyer" ? t.offerJson : t.preparedJson}
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          maxLength={4000000}
          disabled={busy}
        />
      </label>
      {mode === "buyer" && (
        <label className={styles.field}>
          {t.buyerKeyIndex}
          <input
            type="number"
            min={0}
            max={2147483647}
            value={keyIndex}
            onChange={(event) => setKeyIndex(Number(event.target.value))}
            disabled={busy}
          />
        </label>
      )}
      <Button variant="secondary" onClick={review} disabled={!input || busy}>
        {t.reviewSwap}
      </Button>
      {offer && (
        <>
          <SwapReview
            offer={offer}
            buyer={prepared?.buyerIdentityKey || wallet?.identityKey}
          />
          {mode === "buyer" ? (
            <Button onClick={prepare} disabled={!wallet || !overlayUrl || busy}>
              {t.prepareSwap}
            </Button>
          ) : (
            <Button
              onClick={approveSeller}
              disabled={
                !wallet ||
                wallet.identityKey !== offer.sellerIdentityKey ||
                !overlayUrl ||
                busy
              }
            >
              {t.signAsSeller}
            </Button>
          )}
        </>
      )}
      {prepared && mode === "buyer" && (
        <>
          <label className={styles.field}>
            {t.preparedJson}
            <textarea value={JSON.stringify(prepared)} readOnly />
          </label>
          <p>{t.swapHandoff}</p>
          <label className={styles.field}>
            {t.sellerSignature}
            <textarea
              value={signature}
              onChange={(event) => setSignature(event.target.value.trim())}
              maxLength={4096}
              disabled={busy}
            />
          </label>
          <Button
            onClick={complete}
            disabled={
              !signature ||
              !wallet ||
              !overlayUrl ||
              busy ||
              !!receipt ||
              state !== "prepared"
            }
          >
            {t.completeSwap}
          </Button>
        </>
      )}
      {signature && mode === "seller" && (
        <label className={styles.field}>
          {t.sellerSignature}
          <textarea value={signature} readOnly />
        </label>
      )}
      {state && (
        <p>
          {t.swapState}: <code>{state}</code>
        </p>
      )}
      {receipt && (
        <section className={styles.review}>
          <h3>{t.transactionEvidence}</h3>
          <p>{t.bsvReceiptNote}</p>
          <pre>{JSON.stringify(receipt, null, 2)}</pre>
          {receipt.status !== "overlay_admitted" && (
            <Button variant="secondary" onClick={reconcile} disabled={busy}>
              {t.reconcileSwap}
            </Button>
          )}
        </section>
      )}
      {mode === "seller" && <SellerReceipt wallet={wallet} />}
      {error && (
        <p className={styles.error} role="alert">
          {t.swapError}
        </p>
      )}
    </section>
  );
}
