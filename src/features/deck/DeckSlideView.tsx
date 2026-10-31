import Link from "next/link";
import { Icon } from "@/components/ui/data-display/Icon/Icon";
import type { DeckCopy } from "@/lib/i18n/deck";
import { usePreferences } from "../settings/Preferences";
import styles from "./Deck.module.css";
import { DeckVisual } from "./DeckVisual";
import type { DeckSlide } from "./slides";

export function DeckSlideView({
  slide,
  copy,
  number,
  count,
}: {
  slide: DeckSlide;
  copy: DeckCopy;
  number: number;
  count: number;
}) {
  const { t } = usePreferences();
  return (
    <section
      className={styles.slide}
      aria-labelledby="deck-slide-title"
      aria-roledescription={t.slide}
    >
      <div className={styles.slideHeading}>
        <div>
          <p className={styles.eyebrow}>{slide.section}</p>
          <h1 id="deck-slide-title">{slide.title}</h1>
        </div>
        <p className={styles.body}>{slide.body}</p>
      </div>
      {slide.media && (
        <DeckVisual key={slide.id} media={slide.media} copy={copy} />
      )}
      {slide.cards && (
        <div className={styles.cards}>
          {slide.cards.map((card, index) => (
            <article className={styles.card} key={card.title}>
              <span className={styles.cardIndex}>
                {String(index + 1).padStart(2, "0")}
              </span>
              <h2>{card.title}</h2>
              <p>{card.body}</p>
            </article>
          ))}
        </div>
      )}
      {(slide.status || slide.note) && (
        <div className={styles.slideNote}>
          {slide.status && (
            <p className={styles.status}>
              <Icon name="activity" />
              {slide.status}
            </p>
          )}
          {slide.note && <p>{slide.note}</p>}
        </div>
      )}
      {slide.closing && (
        <div className={styles.launches}>
          <Link className={styles.launch} href="/workspace">
            {copy.openWorkspace}
            <Icon name="arrow" />
          </Link>
          <Link href="/payments">
            {copy.openPayments}
            <Icon name="wallet" />
          </Link>
        </div>
      )}
      <footer className={styles.slideFooter}>
        <span>ocnif.</span>
        <span>{copy.event}</span>
        <span>
          {String(number).padStart(2, "0")} / {count}
        </span>
      </footer>
    </section>
  );
}
