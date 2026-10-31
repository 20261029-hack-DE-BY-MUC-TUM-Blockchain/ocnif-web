import { Icon } from "@/components/ui/data-display/Icon/Icon";
import type { RuntimeEvent } from "@/lib/types/runtime";
import { usePreferences } from "../settings/Preferences";
import styles from "./Workspace.module.css";
export function TracePanel({ events }: { events: RuntimeEvent[] }) {
  const { t, locale } = usePreferences();
  const visible = events.filter(
    (event) => !["message.delta"].includes(event.type),
  );
  return (
    <section className={styles.trace}>
      <header>
        <h3>{t.traces}</h3>
        <span>
          {visible.length} {t.events}
        </span>
      </header>
      {!visible.length && <p className={styles.muted}>{t.traceEmpty}</p>}
      <div className={styles.traceList}>
        {visible.map((event) => (
          <details key={event.id} className={styles.traceEvent}>
            <summary>
              <Icon
                name={
                  event.type.includes("failed")
                    ? "close"
                    : event.type.includes("completed")
                      ? "check"
                      : "activity"
                }
              />
              <span>
                <b>
                  {typeof event.data.tool === "string"
                    ? event.data.tool
                    : typeof event.data.agent === "string"
                      ? event.data.agent
                      : event.type}
                </b>
                <small>
                  {typeof event.data.summary === "string"
                    ? event.data.summary.slice(0, 120)
                    : event.type}
                </small>
              </span>
              <time>
                {new Date(event.created_at).toLocaleTimeString(locale, {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </time>
            </summary>
            <pre>
              {JSON.stringify(
                {
                  run_id: event.run_id,
                  sequence: event.sequence,
                  ...event.data,
                },
                null,
                2,
              )}
            </pre>
          </details>
        ))}
      </div>
    </section>
  );
}
