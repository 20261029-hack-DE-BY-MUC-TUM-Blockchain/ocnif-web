import { Button } from "@/components/ui/buttons/Button/Button";
import { MarkdownText } from "@/components/ui/data-display/MarkdownText/MarkdownText";
import { ResultCard } from "@/components/ui/data-display/ResultCard/ResultCard";
import { bsvCopy } from "@/lib/i18n/bsv";
import { parseCard } from "@/lib/types/runtime";
import { usePreferences } from "../settings/Preferences";
import styles from "./Payments.module.css";
import type { BsvMarketState } from "./useBsvMarket";

type ReportControlsState = Pick<
  BsvMarketState,
  | "quote"
  | "busy"
  | "purchaseOperation"
  | "purchaseRecord"
  | "buy"
  | "intent"
  | "wallet"
  | "mintOperation"
  | "mintRecord"
  | "mint"
  | "reconcileMint"
  | "register"
>;
export function BsvReportControls({
  market: m,
}: {
  market: ReportControlsState;
}) {
  const { t, locale } = usePreferences();
  const b = bsvCopy[locale];
  return (
    <>
      {m.quote && (
        <section className={styles.review}>
          <h3>{b.purchase}</h3>
          <p>{b.buyNote}</p>
          <dl>
            <dt>{t.reportId}</dt>
            <dd>{m.quote.reportId}</dd>
            <dt>{t.walletNetwork}</dt>
            <dd>{m.quote.network}</dd>
            <dt>{b.merchant}</dt>
            <dd>{m.quote.recipientIdentityKey}</dd>
            <dt>{t.paymentAmount}</dt>
            <dd>{m.quote.satoshis} satoshis</dd>
            <dt>{b.digest}</dt>
            <dd>{m.quote.reportDigest}</dd>
            <dt>{b.expires}</dt>
            <dd>{new Date(m.quote.expiresAt).toLocaleString(locale)}</dd>
          </dl>
          <Button
            onClick={m.buy}
            disabled={
              m.busy || !!m.purchaseOperation || Date.now() >= m.quote.expiresAt
            }
          >
            {b.buy}
          </Button>
          {m.purchaseOperation && (
            <>
              <p>{b.savedNote}</p>
              <p>
                {b.saved}:{" "}
                <code>{m.purchaseRecord?.status ?? "review_required"}</code>
              </p>
              <details>
                <summary>{b.inspect}</summary>
                <pre>
                  {JSON.stringify(
                    m.purchaseRecord ?? m.purchaseOperation,
                    null,
                    2,
                  )}
                </pre>
              </details>
            </>
          )}
        </section>
      )}
      {m.intent && (
        <section className={styles.review}>
          <h3>{b.mint}</h3>
          <p>{b.mintNote}</p>
          <dl>
            <dt>{t.reportId}</dt>
            <dd>{m.intent.reportId}</dd>
            <dt>{t.walletNetwork}</dt>
            <dd>{m.intent.network}</dd>
            <dt>{b.issuer}</dt>
            <dd>{m.intent.issuerIdentityKey}</dd>
            <dt>{b.digest}</dt>
            <dd>{m.intent.reportDigest}</dd>
            <dt>{b.keyIndex}</dt>
            <dd>{m.intent.keyIndex}</dd>
          </dl>
          {m.wallet?.identityKey !== m.intent.issuerIdentityKey && (
            <p>{b.issuerOnly}</p>
          )}
          <Button
            onClick={m.mint}
            disabled={
              m.busy ||
              !!m.mintOperation ||
              m.wallet?.identityKey !== m.intent.issuerIdentityKey ||
              m.wallet?.network !== m.intent.network
            }
          >
            {b.mintApprove}
          </Button>
          <p>{b.registrationNote}</p>
          {m.mintOperation && (
            <>
              <p>{b.savedNote}</p>
              <p>
                {b.saved}:{" "}
                <code>{m.mintRecord?.status ?? "review_required"}</code>
              </p>
              <details>
                <summary>{b.inspect}</summary>
                <pre>
                  {JSON.stringify(m.mintRecord ?? m.mintOperation, null, 2)}
                </pre>
              </details>
            </>
          )}
          {m.mintRecord?.receipt && (
            <>
              <p>
                {t.tokenId}: <code>{m.mintRecord.receipt.tokenId}</code>
              </p>
              <p>
                {t.tokenOutpoint}: <code>{m.mintRecord.receipt.outpoint}</code>
              </p>
              <p>{b.unconfirmed}</p>
              <div className={styles.actions}>
                {m.mintRecord.receipt.status === "overlay_pending" && (
                  <Button
                    variant="secondary"
                    disabled={m.busy}
                    onClick={m.reconcileMint}
                  >
                    {b.reconcile}
                  </Button>
                )}
                {m.mintRecord.receipt.status === "overlay_admitted" &&
                  !m.mintOperation?.registration && (
                    <Button disabled={m.busy} onClick={m.register}>
                      {b.register}
                    </Button>
                  )}
              </div>
            </>
          )}
          {m.mintOperation?.registration && <output>{b.registered}</output>}
        </section>
      )}
    </>
  );
}

export function BsvDeliveredReport({ market: m }: { market: BsvMarketState }) {
  const { locale } = usePreferences();
  const b = bsvCopy[locale];
  if (!m.report) return null;
  return (
    <section className={styles.review}>
      <p>
        {m.deliveryKind === "purchase" ? b.merchantAccepted : b.accessVerified}
      </p>
      <p>{b.unconfirmed}</p>
      <h3>
        {b.report}: {m.report.title}
      </h3>
      <div className={styles.reportCards}>
        {m.report.cards.map((value, index) => (
          <ResultCard
            key={`${m.report?.id}-${index}`}
            card={parseCard(value)}
          />
        ))}
      </div>
      <MarkdownText>{m.report.content}</MarkdownText>
    </section>
  );
}
