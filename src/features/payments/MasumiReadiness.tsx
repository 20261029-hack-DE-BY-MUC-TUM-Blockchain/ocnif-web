import { usePreferences } from "../settings/Preferences";
import type { MasumiStatus } from "./masumi";
import styles from "./Payments.module.css";

export function MasumiReadiness({ status }: { status: MasumiStatus }) {
  const { t } = usePreferences();
  const setupLabels = {
    coworker_setup: t.masumiSetupCoworker,
    execution_task: t.masumiSetupExecution,
    masumi_payment_service: t.masumiSetupPayment,
    masumi_registration: t.masumiSetupRegistration,
    paid_task: t.masumiSetupPaid,
    worker_not_attached: t.masumiSetupWorker,
  };
  const rows = [
    [t.masumiAgent, status.agentReady ? t.masumiReady : t.masumiNotReady],
    [
      t.masumiCoworker,
      status.coworkerConfigured ? t.masumiReady : t.masumiNotReady,
    ],
    [
      t.masumiWorkerFresh,
      status.workerFresh === undefined
        ? t.masumiWorkerUnknown
        : status.workerFresh
          ? t.masumiWorkerRecent
          : t.masumiWorkerStale,
    ],
    [
      t.masumiExecution,
      status.executionOnly.verified ? t.masumiVerified : t.masumiUnverified,
    ],
    [
      t.masumiRegistration,
      status.paid.registrationConfirmed ? t.masumiVerified : t.masumiUnverified,
    ],
    [
      t.masumiPaidEnabled,
      status.paid.enabled ? t.masumiEnabled : t.masumiDisabled,
    ],
    [
      t.masumiSettlement,
      status.paid.settlementVerified ? t.masumiVerified : t.masumiUnverified,
    ],
  ];
  return (
    <div className={styles.review}>
      <h3>{t.masumiReadiness}</h3>
      <dl>
        {rows.map(([label, value]) => (
          <div className={styles.statusRow} key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      {status.executionOnly.receiptSHA256 && (
        <>
          <p>{t.masumiHistoryNote}</p>
          <dl>
            <div className={styles.statusRow}>
              <dt>{t.masumiReceiptDigest}</dt>
              <dd>
                <code>{status.executionOnly.receiptSHA256}</code>
              </dd>
            </div>
            <div className={styles.statusRow}>
              <dt>{t.masumiWorkspace}</dt>
              <dd>
                {status.executionOnly.workspaceKind === "personal"
                  ? t.masumiPersonal
                  : t.masumiOrganization}
              </dd>
            </div>
            <div className={styles.statusRow}>
              <dt>{t.masumiCompletedAt}</dt>
              <dd>
                <time dateTime={status.executionOnly.completedAt}>
                  {status.executionOnly.completedAt}
                </time>
              </dd>
            </div>
            <div className={styles.statusRow}>
              <dt>{t.masumiVerifiedAt}</dt>
              <dd>
                <time dateTime={status.executionOnly.verifiedAt}>
                  {status.executionOnly.verifiedAt}
                </time>
              </dd>
            </div>
          </dl>
        </>
      )}
      {status.evidence && (
        <p>
          {t.masumiReceiptSource}: <code>{status.evidence.source}</code> ·{" "}
          <time dateTime={status.evidence.observedAt}>
            {status.evidence.observedAt}
          </time>
          {status.evidence.verification && <> · {t.masumiAttestation}</>}
        </p>
      )}
      {status.setupRequired.length > 0 && (
        <>
          <h3>{t.masumiSetupTitle}</h3>
          <ol className={styles.setupList}>
            {status.setupRequired.map((code) => (
              <li key={code}>{setupLabels[code]}</li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}
