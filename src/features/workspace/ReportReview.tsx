import Link from "next/link";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/buttons/Button/Button";
import { Icon } from "@/components/ui/data-display/Icon/Icon";
import { bsvCopy } from "@/lib/i18n/bsv";
import { publishedReportPath } from "@/lib/types/publication";
import { usePreferences } from "../settings/Preferences";
import type { RunState } from "./state";
import styles from "./Workspace.module.css";

export function ReportReview({
  approval,
  publishedReportId,
  control,
}: Pick<RunState, "approval" | "publishedReportId"> & {
  control: (payload: Record<string, string>) => void;
}) {
  const { t, locale } = usePreferences();
  const latest = useRef<HTMLDivElement>(null);
  const approvalId = approval?.id;
  useEffect(() => {
    if (approvalId || publishedReportId)
      latest.current?.scrollIntoView({ block: "nearest" });
  }, [approvalId, publishedReportId]);
  return (
    <div ref={latest}>
      {approval && (
        <section className={styles.approval} aria-label={t.approval}>
          <Icon name="shield" />
          <div>
            <h3>{t.approval}</h3>
            <b>{approval.title}</b>
            <p>{approval.description}</p>
            <div>
              <Button
                onClick={() =>
                  control({
                    type: "approval",
                    approval_id: approval.id,
                    decision: "approve",
                  })
                }
              >
                {t.approve}
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  control({
                    type: "approval",
                    approval_id: approval.id,
                    decision: "reject",
                  })
                }
              >
                {t.reject}
              </Button>
            </div>
          </div>
        </section>
      )}
      {publishedReportId && (
        <section className={styles.approval} aria-label={t.publishedReport}>
          <Icon name="file" />
          <div>
            <h3>{t.publishedReport}</h3>
            <output>{t.publishedBody}</output>
            <p>
              {t.reportId}: <code>{publishedReportId}</code>
            </p>
            <Link
              className={styles.publicationLink}
              href={publishedReportPath(publishedReportId)}
            >
              {t.openCardano}
              <Icon name="arrow" />
            </Link>
            <Link
              className={styles.publicationLink}
              href={publishedReportPath(publishedReportId, "bsv")}
            >
              {bsvCopy[locale].title}
              <Icon name="arrow" />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
