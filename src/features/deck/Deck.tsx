"use client";
import { useEffect, useState } from "react";
import { deckDictionaries } from "@/lib/i18n/deck";
import { Header } from "../settings/Header";
import { usePreferences } from "../settings/Preferences";
import styles from "./Deck.module.css";
import { DeckControls } from "./DeckControls";
import { DeckSlideView } from "./DeckSlideView";
import { deckSlides, initialSlideIndex, keyboardSlide } from "./slides";

export function Deck({ initialSlide }: { initialSlide?: string }) {
  const { locale } = usePreferences();
  const copy = deckDictionaries[locale];
  const slides = deckSlides(copy);
  const [index, setIndex] = useState(() =>
    initialSlideIndex(slides, initialSlide),
  );
  const requestedIndex = initialSlideIndex(slides, initialSlide);
  useEffect(() => setIndex(requestedIndex), [requestedIndex]);
  useEffect(() => {
    function key(event: KeyboardEvent) {
      if (
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        (event.target instanceof HTMLElement &&
          event.target.closest(
            "input, select, textarea, [contenteditable='true']",
          ))
      )
        return;
      const next = keyboardSlide(index, event.key, slides.length);
      if (next !== undefined) {
        event.preventDefault();
        setIndex(next);
      }
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [index, slides.length]);
  return (
    <>
      <Header />
      <main className={styles.deck}>
        <DeckSlideView
          slide={slides[index]}
          copy={copy}
          number={index + 1}
          count={slides.length}
        />
        <DeckControls
          slides={slides}
          index={index}
          change={setIndex}
          copy={copy}
        />
      </main>
    </>
  );
}
