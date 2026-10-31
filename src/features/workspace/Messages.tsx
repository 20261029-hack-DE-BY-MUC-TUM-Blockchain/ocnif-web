import { Icon } from "@/components/ui/data-display/Icon/Icon";
import { MarkdownText } from "@/components/ui/data-display/MarkdownText/MarkdownText";
import { ResultCard } from "@/components/ui/data-display/ResultCard/ResultCard";
import type { Message } from "@/lib/types/runtime";
import { usePreferences } from "../settings/Preferences";
import styles from "./Workspace.module.css";
export function Messages({
  messages,
  draft,
  active,
  onSample,
}: {
  messages: Message[];
  draft: string;
  active: boolean;
  onSample: (value: string) => void;
}) {
  const { t } = usePreferences();
  if (!messages.length && !draft)
    return (
      <div className={styles.empty}>
        <span className={styles.emptyLogo}>
          <Icon name="spark" width="34" height="34" />
        </span>
        <p className={styles.eyebrow}>OCNIF INTELLIGENCE</p>
        <h1>{t.welcome}</h1>
        <p>{t.welcomeBody}</p>
        <div className={styles.sampleGrid}>
          {[
            [t.suggestion1, t.sampleEmail],
            [t.suggestion2, t.sampleHeaders],
            [t.suggestion3, t.sampleTraining],
          ].map(([label, sample]) => (
            <button type="button" key={label} onClick={() => onSample(sample)}>
              <Icon name="file" />
              <span>
                {label}
                <small>{t.exampleLabel}</small>
              </span>
              <Icon name="arrow" />
            </button>
          ))}
        </div>
        <small>{t.sampleNote}</small>
      </div>
    );
  return (
    <div className={styles.messages} role="log" aria-live="polite">
      {messages.map((message) => (
        <article
          className={styles.message}
          data-role={message.role}
          key={message.id}
        >
          <header>
            <span className={styles.messageAvatar}>
              <Icon name={message.role === "assistant" ? "spark" : "shield"} />
            </span>
            <b>{message.role === "assistant" ? t.assistant : t.you}</b>
            <time>
              {new Date(message.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </time>
          </header>
          {message.cards.length > 0 && (
            <div className={styles.cards}>
              {message.cards.map((card, index) => (
                <ResultCard key={`${message.id}-${index}`} card={card} />
              ))}
            </div>
          )}
          {message.role === "assistant" ? (
            <div className={styles.messageText}>
              {message.cards.length > 0 && message.content.length > 1200 ? (
                <details className={styles.fullReport}>
                  <summary>{t.readReport}</summary>
                  <MarkdownText>{message.content}</MarkdownText>
                </details>
              ) : (
                <MarkdownText>{message.content}</MarkdownText>
              )}
            </div>
          ) : (
            <p className={styles.messageText}>{message.content}</p>
          )}
        </article>
      ))}
      {draft && (
        <article className={styles.message}>
          <header>
            <span className={styles.messageAvatar}>
              <Icon name="spark" />
            </span>
            <b>Ocnif</b>
          </header>
          <p className={styles.messageText}>
            {draft}
            <span className={styles.cursor} />
          </p>
        </article>
      )}
      {active && !draft && (
        <div className={styles.thinking}>
          <span />
          <span />
          <span />
          {t.working}
        </div>
      )}
    </div>
  );
}
