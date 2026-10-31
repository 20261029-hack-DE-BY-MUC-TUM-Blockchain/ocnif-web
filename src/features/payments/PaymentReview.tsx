import { Button } from "@/components/ui/buttons/Button/Button";
import { usePreferences } from "../settings/Preferences";
import styles from "./Payments.module.css";
import { attemptId } from "./protocol/journal";
import type { usePaymentFlow } from "./usePaymentFlow";
export function PaymentReview({
  flow,
  expectedEndpoint,
  payer,
  approve,
  disabled = false,
}: {
  flow: ReturnType<typeof usePaymentFlow>;
  expectedEndpoint: string;
  payer?: string;
  approve: () => void;
  disabled?: boolean;
}) {
  const { t } = usePreferences();
  const { challenge, attempt, result } = flow;
  const contextMatches = challenge?.endpoint === expectedEndpoint;
  const payerMatches =
    !attempt || (!!payer && attempt.id === attemptId(attempt.challenge, payer));
  return (
    <>
      {challenge && (
        <section className={styles.review}>
          <h3>{t.reviewPayment}</h3>
          <dl>
            <dt>{t.paymentResource}</dt>
            <dd>
              {challenge.resource}
              <br />
              <code>{challenge.endpoint}</code>
            </dd>
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
          {!contextMatches && <p role="alert">{t.paymentContextChanged}</p>}
          <p>{t.paymentApprovalNote}</p>
          {!attempt || attempt.state === "reviewing" ? (
            <Button
              onClick={() => contextMatches && approve()}
              disabled={
                !contextMatches ||
                !payer ||
                !payerMatches ||
                disabled ||
                flow.busy
              }
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
                  onClick={() => contextMatches && flow.retrySameProof()}
                  disabled={
                    flow.busy || !payerMatches || !contextMatches || disabled
                  }
                >
                  {t.retryPayment}
                </Button>
              )}
              {flow.recovery && (
                <>
                  <p>
                    {flow.recovery === "wallet_rejected"
                      ? t.paymentRejectedSafe
                      : t.paymentSettledExpired}
                  </p>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      contextMatches && payer && flow.newAttempt(payer)
                    }
                    disabled={
                      !contextMatches ||
                      !payer ||
                      !payerMatches ||
                      disabled ||
                      flow.busy
                    }
                  >
                    {t.paymentNewReview}
                  </Button>
                </>
              )}
            </>
          )}
          {attempt?.state === "reviewing" && <p>{t.paymentFreshReview}</p>}
          {!!attempt?.history?.length && (
            <details>
              <summary>
                {t.paymentHistory} ({attempt.history.length})
              </summary>
              {attempt.history.map((previous, index) => (
                <article key={previous.generation ?? index}>
                  <p>
                    <code>{previous.state}</code> ·{" "}
                    <time dateTime={new Date(previous.createdAt).toISOString()}>
                      {new Date(previous.createdAt).toISOString()}
                    </time>
                  </p>
                  {previous.result && (
                    <pre>{JSON.stringify(previous.result, null, 2)}</pre>
                  )}
                  {previous.proof && <p>{t.paymentProofRetained}</p>}
                </article>
              ))}
            </details>
          )}
        </section>
      )}
      {flow.error && (
        <p className={styles.error} role="alert">
          {t.paymentError}
          {flow.storageBlocked && <> {t.paymentStorageUpgrade}</>}
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
