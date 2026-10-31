import type { SwapOffer } from "ocnif-bc-bsv";
import { usePreferences } from "../settings/Preferences";
import styles from "./Payments.module.css";
export function SwapReview({
  offer,
  buyer,
}: {
  offer: SwapOffer;
  buyer?: string;
}) {
  const { t } = usePreferences();
  return (
    <section className={styles.review}>
      <h3>{t.reviewSwap}</h3>
      <dl>
        <dt>{t.walletNetwork}</dt>
        <dd>{offer.network}</dd>
        <dt>{t.seller}</dt>
        <dd>{offer.sellerIdentityKey}</dd>
        <dt>{t.buyer}</dt>
        <dd>{buyer || t.unavailable}</dd>
        <dt>{t.tokenId}</dt>
        <dd>{offer.tokenId}</dd>
        <dt>{t.tokenAmount}</dt>
        <dd>{offer.tokenAmount}</dd>
        <dt>{t.tokenOutpoint}</dt>
        <dd>{offer.outpoint}</dd>
        <dt>{t.paymentAmount}</dt>
        <dd>{offer.priceSatoshis} satoshis</dd>
      </dl>
      <p>{t.swapApprovalNote}</p>
    </section>
  );
}
