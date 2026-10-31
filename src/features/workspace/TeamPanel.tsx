import { Icon, type IconName } from "@/components/ui/data-display/Icon/Icon";
import type { Capabilities, RuntimeEvent } from "@/lib/types/runtime";
import { WalletPanel } from "../payments/WalletPanel";
import { usePreferences } from "../settings/Preferences";
import styles from "./Workspace.module.css";
export function TeamPanel({
  events,
  capabilities,
}: {
  events: RuntimeEvent[];
  capabilities: Capabilities | null;
}) {
  const { t } = usePreferences();
  const roles: [string, string, IconName][] = [
    ["manager", t.manager, "layers"],
    ["analyst", t.analyst, "eye"],
    ["remediation", t.remediation, "shield"],
    ["verifier", t.verifier, "check"],
  ];
  return (
    <>
      <section className={styles.team}>
        <h3>{t.team}</h3>
        <p className={styles.muted}>{t.teamCaption}</p>
        <div className={styles.teamRows}>
          {roles.map(([id, label, icon]) => {
            const latest = [...events]
              .reverse()
              .find(
                (event) =>
                  event.type === "agent.status" &&
                  String(event.data.agent).toLowerCase().includes(id),
              );
            const status = String(latest?.data.status || "idle");
            return (
              <div key={id} className={styles.agent}>
                <span
                  className={styles.agentIcon}
                  data-active={status === "working" || status === "running"}
                >
                  <Icon name={icon} />
                </span>
                <span>
                  <b>{label}</b>
                  <small>
                    {status === "idle"
                      ? t.idle
                      : status === "completed" || status === "complete"
                        ? t.complete
                        : status === "working" || status === "running"
                          ? t.working
                          : status}
                  </small>
                </span>
                <i data-active={status === "working" || status === "running"} />
              </div>
            );
          })}
        </div>
      </section>
      <section className={styles.service}>
        <h3>{t.capability}</h3>
        <dl>
          <dt>{t.model}</dt>
          <dd>{capabilities?.model || "—"}</dd>
          <dt>AI</dt>
          <dd data-ready={capabilities?.ai_configured}>
            {capabilities?.ai_configured ? t.connected : t.unavailable}
          </dd>
          <dt>{t.voiceStart}</dt>
          <dd data-ready={capabilities?.voice_configured}>
            {capabilities?.voice_configured ? t.idle : t.unavailable}
          </dd>
          <dt>{t.speakerSnapshot}</dt>
          <dd data-ready={capabilities?.diarization}>
            {capabilities?.diarization ? t.idle : t.unavailable}
          </dd>
        </dl>
        <p className={styles.scope}>
          <Icon name="lock" />
          {t.scopeDetail}
        </p>
      </section>
      <WalletPanel />
    </>
  );
}
