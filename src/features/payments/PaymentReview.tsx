import { Button } from "@/components/ui/buttons/Button/Button";
import { usePreferences } from "../settings/Preferences";
import styles from "./Payments.module.css";
import type { usePaymentFlow } from "./usePaymentFlow";
export function PaymentReview({
  flow,
  payer,
  approve,
  disabled = false,
}: {
  flow: ReturnType<typeof usePaymentFlow>;
  payer?: string;
  approve: () => void;
  disabled?: boolean;
}) {
  const { t } = usePreferences();
  const { challenge, attempt, result } = flow;
  return (
    <>
      {challenge && (
        <section className={styles.review}>
          <h3>{t.reviewPayment}</h3>
          <dl>
            <dt>{t.paymentResource}</dt>
            <dd>{challenge.resource}</dd>
            <dt>{t.walletNetwork}</dt>
            <dd>{challenge.selected.network}</dd>
            <dt>{t.merchantRecipient}</dt>
            <dd>{challenge.selected.payTo}</dd>
            <dt>{t.paymentAsset}</dt>
            <dd>{challenge.selected.asset}</dd>
            <dt>{t.paymentAmount}</dt>
            <dd>{challenge.selected.amount}</dd>
            <dt>{t.paymentPayer}</dt>
            <dd>{payer || t.unavailable}</dd>
          </dl>
          <p>{t.paymentApprovalNote}</p>
          {!attempt ? (
            <Button
              onClick={approve}
              disabled={!payer || disabled || flow.busy}
            >
              {flow.busy ? t.working : t.approvePayment}
            </Button>
          ) : (
            <>
              <p>
                {t.paymentExisting} <code>{attempt.state}</code>
              </p>
              {attempt.proof && attempt.state !== "settled" && (
                <Button
                  variant="secondary"
                  onClick={flow.retrySameProof}
                  disabled={flow.busy}
                >
                  {t.retryPayment}
                </Button>
              )}
            </>
          )}
        </section>
      )}
      {flow.error && (
        <p className={styles.error} role="alert">
          {t.paymentError}
        </p>
      )}
      {result && (
        <section className={styles.review}>
          <h3>
            {result.settlement?.success
              ? t.settlementReported
              : result.delivered
                ? t.responseReceived
                : t.paymentNotCompleted}
          </h3>
          {!result.delivered && <p>{t.paymentNotCompleted}</p>}
          {result.settlement && (
            <>
              <p>{t.receiptCaveat}</p>
              <pre>{JSON.stringify(result.settlement, null, 2)}</pre>
            </>
          )}
          <details>
            <summary>{t.inspectResponse}</summary>
            <pre>{JSON.stringify(result.body, null, 2)}</pre>
          </details>
        </section>
      )}
    </>
  );
}
