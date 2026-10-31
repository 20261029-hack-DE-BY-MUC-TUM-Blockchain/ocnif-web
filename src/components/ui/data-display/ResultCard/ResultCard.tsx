import type { Card } from "@/lib/types/runtime";
import { Icon } from "../Icon/Icon";
import { MarkdownText } from "../MarkdownText/MarkdownText";
import styles from "./ResultCard.module.css";
export function ResultCard({ card }: { card: Card }) {
  return (
    <article className={styles.card} data-severity={card.severity}>
      <header>
        <Icon
          name={
            card.type === "finding"
              ? "shield"
              : card.type === "checklist"
                ? "check"
                : card.type === "metric"
                  ? "activity"
                  : "file"
          }
        />
        <h3>{card.title}</h3>
        {card.severity && (
          <span className={styles.severity}>{card.severity}</span>
        )}
      </header>
      {card.value && (
        <p className={card.type === "metric" ? styles.value : styles.context}>
          {card.value}
        </p>
      )}
      {card.body &&
        (card.type === "report" && card.body.length > 400 ? (
          <details className={styles.report}>
            <summary>{card.title}</summary>
            <MarkdownText>{card.body}</MarkdownText>
          </details>
        ) : (
          <p className={styles.body}>{card.body}</p>
        ))}
      {card.items && (
        <ul>
          {card.items.map((item, index) => (
            <li key={`${index}-${item}`}>
              <Icon name="chevron" />
              {item}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
