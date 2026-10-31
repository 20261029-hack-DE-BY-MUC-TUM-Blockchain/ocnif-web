"use client";
import type { ReportOffer } from "ocnif-bc-bsv";
import { useState } from "react";
import { Button } from "@/components/ui/buttons/Button/Button";
import { bsvCopy } from "@/lib/i18n/bsv";
import { usePreferences } from "../settings/Preferences";
import styles from "./Payments.module.css";
import {
  marketBaseUrl,
  marketRequest,
  parseListingResult,
  parseReportOffers,
} from "./protocol/bsvMarket";
import { ownsCurrentPass } from "./protocol/bsvOwnership";
import { SwapReview } from "./SwapReview";
import type { BsvMarketState } from "./useBsvMarket";

export function BsvListings({
  market: m,
  onSelect,
}: {
  market: BsvMarketState;
  onSelect: (offer: ReportOffer) => void;
}) {
  const { t, locale } = usePreferences();
  const b = bsvCopy[locale];
  const [price, setPrice] = useState(1);
  const [listing, setListing] = useState<ReportOffer | null>(null);
  const [listed, setListed] = useState(false);
  const priceValid =
    Number.isSafeInteger(price) && price >= 1 && price <= 100000000;

  async function review() {
    if (!m.wallet || !m.heldPass || !priceValid) return;
    const pass = m.heldPass;
    const wallet = m.wallet;
    await m.run(async () => {
      const sdk = await import("ocnif-bc-bsv");
      if (
        !(await ownsCurrentPass(
          pass,
          wallet.identityKey,
          new sdk.HttpTokenOverlay(marketBaseUrl()),
        ))
      ) {
        m.setHeldPass(null);
        setListing(null);
        throw new Error("holder_output_mismatch");
      }
      setListing({
        reportId: pass.reportId,
        reportDigest: pass.reportDigest,
        offer: {
          id: crypto.randomUUID(),
          outpoint: pass.outpoint,
          tokenId: pass.tokenId,
          tokenAmount: "1",
          priceSatoshis: price,
          sellerIdentityKey: wallet.identityKey,
          sellerKeyIndex: pass.keyIndex,
          network: wallet.network,
        },
      });
      setListed(false);
    });
  }
  async function publish() {
    if (!m.wallet || !listing || !m.config || listed) return;
    const wallet = m.wallet;
    const config = m.config;
    await m.run(async () => {
      const sdk = await import("ocnif-bc-bsv");
      const body = await sdk.signReportOffer(wallet.wallet, listing);
      parseListingResult(await marketRequest("/v1/offers", body), listing);
      setListed(true);
      m.setOffers(
        parseReportOffers(
          await marketRequest(`/v1/reports/${listing.reportId}/offers`),
          listing.reportId,
          config,
        ),
      );
    });
  }
  return (
    <>
      {m.heldPass && (
        <section className={styles.review}>
          <h3>{b.list}</h3>
          <p>{b.listNote}</p>
          <label className={styles.field}>
            {t.paymentAmount} (satoshis)
            <input
              type="number"
              min={1}
              max={100000000}
              step={1}
              value={price}
              disabled={m.busy}
              onChange={(event) => {
                setPrice(Number(event.target.value));
                setListing(null);
                setListed(false);
              }}
            />
          </label>
          <Button
            variant="secondary"
            onClick={review}
            disabled={m.busy || !priceValid}
          >
            {b.listReview}
          </Button>
          {listing && (
            <>
              <p>
                {t.reportId}: <code>{listing.reportId}</code>
              </p>
              <p>
                {b.digest}: <code>{listing.reportDigest}</code>
              </p>
              <SwapReview offer={listing.offer} />
              <Button onClick={publish} disabled={m.busy || listed}>
                {b.listApprove}
              </Button>
            </>
          )}
          {listed && <output>{b.listed}</output>}
        </section>
      )}
      <section className={styles.review}>
        <h3>{b.offers}</h3>
        {m.offers.length === 0 && <p>{b.noOffers}</p>}
        {m.offers.map((offer) => (
          <article className={styles.review} key={offer.offer.id}>
            <dl>
              <dt>{t.seller}</dt>
              <dd>{offer.offer.sellerIdentityKey}</dd>
              <dt>{t.tokenId}</dt>
              <dd>{offer.offer.tokenId}</dd>
              <dt>{t.tokenOutpoint}</dt>
              <dd>{offer.offer.outpoint}</dd>
              <dt>{t.paymentAmount}</dt>
              <dd>{offer.offer.priceSatoshis} satoshis</dd>
              <dt>{b.digest}</dt>
              <dd>{offer.reportDigest}</dd>
            </dl>
            <Button
              variant="secondary"
              onClick={() => onSelect(offer)}
              disabled={m.busy}
            >
              {b.offerReview}
            </Button>
          </article>
        ))}
      </section>
    </>
  );
}
