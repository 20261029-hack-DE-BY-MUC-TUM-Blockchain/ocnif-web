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
      {status.executionOnly.taskId && (
        <p>
          {t.masumiTaskId}: <code>{status.executionOnly.taskId}</code>
        </p>
      )}
      {status.evidence && (
        <p>
          {t.masumiReceiptSource}: <code>{status.evidence.source}</code> ·{" "}
          <time dateTime={status.evidence.observedAt}>
            {status.evidence.observedAt}
          </time>
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
