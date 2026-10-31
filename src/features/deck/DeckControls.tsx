import { Button } from "@/components/ui/buttons/Button/Button";
import { Icon } from "@/components/ui/data-display/Icon/Icon";
import type { DeckCopy } from "@/lib/i18n/deck";
import { usePreferences } from "../settings/Preferences";
import styles from "./Deck.module.css";
import type { DeckSlide } from "./slides";

export function DeckControls({
  slides,
  index,
  change,
  copy,
}: {
  slides: DeckSlide[];
  index: number;
  change: (index: number) => void;
  copy: DeckCopy;
}) {
  const { t } = usePreferences();
  return (
    <nav className={styles.controls} aria-label={copy.navigation}>
      <Button
        variant="secondary"
        disabled={index === 0}
        onClick={() => change(index - 1)}
        aria-label={t.previous}
      >
        ←
      </Button>
      <label className={styles.slidePicker}>
        <span>{copy.contents}</span>
        <select
          value={index}
          onChange={(event) => change(Number(event.target.value))}
        >
          {slides.map((slide, number) => (
            <option key={slide.id} value={number}>
              {String(number + 1).padStart(2, "0")} · {slide.title}
            </option>
          ))}
        </select>
      </label>
      <span className={styles.counter}>
        <b>{String(index + 1).padStart(2, "0")}</b> / {slides.length}
      </span>
      <Button
        variant="secondary"
        disabled={index === slides.length - 1}
        onClick={() => change(index + 1)}
        aria-label={t.next}
      >
        <Icon name="arrow" />
      </Button>
      <p className={styles.keyboardHint}>{copy.keyboard}</p>
    </nav>
  );
}
