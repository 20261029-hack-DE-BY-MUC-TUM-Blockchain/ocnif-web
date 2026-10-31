"use client";
import { Button } from "@/components/ui/buttons/Button/Button";
import { isReportId } from "@/lib/types/publication";
import { usePreferences } from "../settings/Preferences";
import { MasumiReadiness } from "./MasumiReadiness";
import styles from "./Payments.module.css";
import { useCardanoStatus } from "./useCardanoStatus";

export function CardanoPanel({
  sokosumiUrl,
  initialReportId,
}: {
  sokosumiUrl?: string;
  initialReportId?: string;
}) {
  const { t } = usePreferences();
  const service = useCardanoStatus();
  return (
    <section className={styles.flow}>
      <p className={styles.eyebrow}>CARDANO · MASUMI + SOKOSUMI · PREPROD</p>
      <h2>{t.cardanoTitle}</h2>
      <p>{t.cardanoBody}</p>
      <p>{t.masumiExecutionNote}</p>
      {isReportId(initialReportId) && (
        <div className={styles.review}>
          <h3>{t.reportId}</h3>
          <p>
            <code>{initialReportId}</code>
          </p>
          <p>{t.masumiReportReference}</p>
        </div>
      )}
      {service.loading && <output>{t.masumiChecking}</output>}
      {service.error && (
        <p role="alert" className={styles.error}>
          {t.masumiUnavailable}
        </p>
      )}
      {service.status?.integration === "legacy-x402" && (
        <p role="alert">{t.masumiLegacy}</p>
      )}
      {service.status?.integration === "masumi-sokosumi" && (
        <MasumiReadiness status={service.status} />
      )}
      <div className={styles.actions}>
        {sokosumiUrl && (
          <a
            className={styles.externalLink}
            href={sokosumiUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t.openSokosumi}
          </a>
        )}
        <Button
          variant="secondary"
          onClick={service.refresh}
          disabled={service.loading}
        >
          {t.refreshStatus}
        </Button>
      </div>
      <p>{t.masumiPersonalWorkspace}</p>
    </section>
  );
}
