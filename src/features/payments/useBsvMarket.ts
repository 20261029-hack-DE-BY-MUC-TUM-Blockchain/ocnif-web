"use client";
import type {
  MintIntent,
  MintRecord,
  PublishedReport,
  PurchaseRecord,
  ReportOffer,
  ReportQuote,
} from "ocnif-bc-bsv";
import { useEffect, useRef, useState } from "react";
import { isReportId } from "@/lib/types/publication";
import {
  type BsvConnection,
  type HeldPass,
  type MarketConfig,
  marketBaseUrl,
  marketRequest,
  parseMarketConfig,
  parseMintIntent,
  parsePublishedReport,
  parseRegistration,
  parseReportOffers,
  parseReportQuote,
} from "./protocol/bsvMarket";
import {
  BsvOperationStore,
  type ReportOperation,
  reportOperationKey,
} from "./protocol/bsvOperationStore";
import { ownsCurrentPass } from "./protocol/bsvOwnership";

export function useBsvMarket(overlayUrl?: string, initialReportId?: string) {
  const [config, setConfig] = useState<MarketConfig | null>(null);
  const [checking, setChecking] = useState(true);
  const [revision, setRevision] = useState(0);
  const [wallet, setWallet] = useState<BsvConnection | null>(null);
  const [reportId, setReportId] = useState(initialReportId ?? "");
  const [activeReportId, setActiveReportId] = useState("");
  const [quote, setQuote] = useState<ReportQuote | null>(null);
  const [intent, setIntent] = useState<MintIntent | null>(null);
  const [offers, setOffers] = useState<ReportOffer[]>([]);
  const [purchaseOperation, setPurchaseOperation] = useState<
    ReportOperation | undefined
  >();
  const [mintOperation, setMintOperation] = useState<
    ReportOperation | undefined
  >();
  const [purchaseRecord, setPurchaseRecord] = useState<
    PurchaseRecord | undefined
  >();
  const [mintRecord, setMintRecord] = useState<MintRecord | undefined>();
  const [report, setReport] = useState<PublishedReport | null>(null);
  const [heldPass, setHeldPass] = useState<HeldPass | null>(null);
  const [deliveryKind, setDeliveryKind] = useState<
    "purchase" | "access" | null
  >(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const locked = useRef(false);
  const configRevision = useRef(0);

  useEffect(() => {
    configRevision.current = revision;
    const currentRevision = revision;
    const controller = new AbortController();
    setChecking(true);
    setConfig(null);
    if (!overlayUrl || overlayUrl !== marketBaseUrl()) {
      setChecking(false);
      return () => controller.abort();
    }
    marketRequest("/v1/config", undefined, controller.signal)
      .then((value) => {
        if (
          !controller.signal.aborted &&
          configRevision.current === currentRevision
        )
          setConfig(parseMarketConfig(value, overlayUrl));
      })
      .catch(() => {
        if (!controller.signal.aborted) setConfig(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) setChecking(false);
      });
    return () => controller.abort();
  }, [overlayUrl, revision]);

  async function run(action: () => Promise<void>) {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError(false);
    try {
      await action();
    } catch {
      setError(true);
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }

  function clearReport() {
    setActiveReportId("");
    setQuote(null);
    setIntent(null);
    setOffers([]);
    setPurchaseOperation(undefined);
    setMintOperation(undefined);
    setPurchaseRecord(undefined);
    setMintRecord(undefined);
    setReport(null);
    setHeldPass(null);
    setDeliveryKind(null);
  }

  async function connect() {
    await run(async () => {
      const sdk = await import("ocnif-bc-bsv");
      const connection = await sdk.connectWallet();
      clearReport();
      setWallet(connection);
    });
  }

  async function load() {
    if (
      !wallet ||
      !config ||
      !isReportId(reportId) ||
      wallet.network !== config.network
    )
      return;
    await run(async () => {
      clearReport();
      const store = new BsvOperationStore();
      const sdk = await import("ocnif-bc-bsv");
      const [savedPurchase, savedMint, fetchedOffers] = await Promise.all([
        store.get(
          reportOperationKey(
            "purchase",
            wallet.network,
            wallet.identityKey,
            reportId,
          ),
        ),
        store.get(
          reportOperationKey(
            "mint",
            wallet.network,
            wallet.identityKey,
            reportId,
          ),
        ),
        marketRequest(`/v1/reports/${reportId}/offers`),
      ]);
      const [quoteValue, mintValue] = await Promise.all([
        savedPurchase?.quote ??
          (config.paymentStatus === "ready"
            ? marketRequest(`/v1/reports/${reportId}/quote`)
            : null),
        savedMint?.intent ??
          (config.passStatus === "ready"
            ? marketRequest(`/v1/reports/${reportId}/pass-intent`)
            : null),
      ]);
      const loadedQuote = quoteValue
        ? parseReportQuote(quoteValue, reportId, config)
        : null;
      const loadedIntent = mintValue
        ? parseMintIntent(mintValue, reportId, config)
        : null;
      setQuote(loadedQuote);
      setIntent(loadedIntent);
      setPurchaseOperation(savedPurchase);
      setMintOperation(savedMint);
      setOffers(parseReportOffers(fetchedOffers, reportId, config));
      if (savedPurchase && loadedQuote) {
        setPurchaseRecord(
          await new sdk.IndexedDBPurchaseJournal().get(
            `purchase:${wallet.identityKey}:${loadedQuote.id}`,
          ),
        );
        if (savedPurchase.delivery) {
          setReport(
            parsePublishedReport(
              savedPurchase.delivery.report,
              reportId,
              loadedQuote.reportDigest,
            ),
          );
          setDeliveryKind("purchase");
        }
      }
      if (savedMint && loadedIntent) {
        const saved = await new sdk.IndexedDBMintJournal().get(
          `mint:${wallet.identityKey}:${loadedIntent.id}`,
        );
        setMintRecord(saved);
        if (saved?.receipt && savedMint.registration) {
          const pass = passFromReceipt(saved.receipt);
          parseRegistration(savedMint.registration, pass);
          if (
            await ownsCurrentPass(
              pass,
              wallet.identityKey,
              new sdk.HttpTokenOverlay(marketBaseUrl()),
            )
          )
            setHeldPass(pass);
        }
      }
      setActiveReportId(reportId);
    });
  }

  async function buy() {
    if (
      !wallet ||
      !quote ||
      purchaseOperation ||
      !config ||
      config.paymentStatus !== "ready"
    )
      return;
    await run(async () => {
      const sdk = await import("ocnif-bc-bsv");
      const store = new BsvOperationStore();
      const approval = {
        id: quote.id,
        recipientIdentityKey: quote.recipientIdentityKey,
        maxSatoshis: quote.satoshis,
        network: quote.network,
        reportDigest: quote.reportDigest,
      };
      sdk.validatePayment(quote, approval);
      const operation: ReportOperation = {
        key: reportOperationKey(
          "purchase",
          wallet.network,
          wallet.identityKey,
          quote.reportId,
        ),
        kind: "purchase",
        quote,
      };
      await store.write(operation, true);
      setPurchaseOperation(operation);
      const journal = new sdk.IndexedDBPurchaseJournal();
      try {
        const delivery = await sdk.purchasePublishedReport(
          wallet.wallet,
          marketBaseUrl(),
          quote,
          approval,
          journal,
        );
        const verified = parsePublishedReport(
          delivery.report,
          quote.reportId,
          quote.reportDigest,
        );
        const saved = { ...operation, delivery };
        await store.write(saved);
        setPurchaseOperation(saved);
        setReport(verified);
        setDeliveryKind("purchase");
      } finally {
        setPurchaseRecord(
          await journal.get(`purchase:${wallet.identityKey}:${quote.id}`),
        );
      }
    });
  }

  async function mint() {
    if (
      !wallet ||
      !intent ||
      config?.passStatus !== "ready" ||
      config.issuerIdentityKey !== intent.issuerIdentityKey ||
      mintOperation ||
      wallet.identityKey !== intent.issuerIdentityKey ||
      wallet.network !== intent.network
    )
      return;
    await run(async () => {
      const sdk = await import("ocnif-bc-bsv");
      const operation: ReportOperation = {
        key: reportOperationKey(
          "mint",
          wallet.network,
          wallet.identityKey,
          intent.reportId,
        ),
        kind: "mint",
        intent,
      };
      await new BsvOperationStore().write(operation, true);
      setMintOperation(operation);
      const journal = new sdk.IndexedDBMintJournal();
      try {
        await sdk.mintReportPass(
          wallet.wallet,
          intent,
          { ...intent },
          new sdk.HttpTokenOverlay(marketBaseUrl()),
          journal,
        );
      } finally {
        setMintRecord(
          await journal.get(`mint:${wallet.identityKey}:${intent.id}`),
        );
      }
    });
  }

  async function reconcileMint() {
    if (!wallet || !mintRecord?.receipt) return;
    const recordedReceipt = mintRecord.receipt;
    await run(async () => {
      const sdk = await import("ocnif-bc-bsv");
      const receipt = await sdk.reconcileMint(
        wallet.wallet,
        recordedReceipt,
        new sdk.HttpTokenOverlay(marketBaseUrl()),
        new sdk.IndexedDBMintJournal(),
      );
      setMintRecord({
        status: receipt.status,
        intent: receipt.intent,
        receipt,
      });
    });
  }

  async function register() {
    if (
      !wallet ||
      !mintRecord?.receipt ||
      mintRecord.receipt.status !== "overlay_admitted" ||
      !mintOperation
    )
      return;
    const recordedReceipt = mintRecord.receipt;
    await run(async () => {
      const sdk = await import("ocnif-bc-bsv");
      const pass = passFromReceipt(recordedReceipt);
      const body = await sdk.signPassRegistration(
        wallet.wallet,
        recordedReceipt,
      );
      const registration = parseRegistration(
        await marketRequest("/v1/passes", body),
        pass,
      );
      const operation = { ...mintOperation, registration };
      await new BsvOperationStore().write(operation);
      setMintOperation(operation);
      setHeldPass(pass);
    });
  }

  return {
    config,
    checking,
    refresh: () => setRevision((value) => value + 1),
    wallet,
    connect,
    reportId,
    setReportId: (value: string) => {
      clearReport();
      setReportId(value);
    },
    activeReportId,
    quote,
    intent,
    offers,
    setOffers,
    purchaseOperation,
    mintOperation,
    purchaseRecord,
    mintRecord,
    report,
    setReport,
    heldPass,
    setHeldPass,
    deliveryKind,
    setDeliveryKind,
    busy,
    error,
    run,
    load,
    buy,
    mint,
    reconcileMint,
    register,
  };
}

function passFromReceipt(
  receipt: NonNullable<MintRecord["receipt"]>,
): HeldPass {
  return {
    reportId: receipt.intent.reportId,
    reportDigest: receipt.intent.reportDigest,
    tokenId: receipt.tokenId,
    outpoint: receipt.outpoint,
    keyIndex: receipt.intent.keyIndex,
  };
}

export type BsvMarketState = ReturnType<typeof useBsvMarket>;
