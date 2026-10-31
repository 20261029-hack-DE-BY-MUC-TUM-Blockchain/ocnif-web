"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/buttons/Button/Button";
import { Icon } from "@/components/ui/data-display/Icon/Icon";
import { Header } from "../settings/Header";
import { usePreferences } from "../settings/Preferences";
import styles from "./Deck.module.css";
export function Deck() {
  const { t } = usePreferences();
  const [index, setIndex] = useState(0);
  const slides = [
    [t.deckTitle, t.deckSubtitle],
    [t.deckProblem, t.deckProblemBody],
    [t.deckSolution, t.deckSolutionBody],
    [t.deckWorkflow, t.deckWorkflowBody],
    [t.deckCustomer, t.deckCustomerBody],
    [t.deckCommerce, t.deckCommerceBody],
    [t.deckProof, t.deckProofBody],
    [t.deckAsk, t.deckAskBody],
  ];
  useEffect(() => {
    function key(event: KeyboardEvent) {
      if (
        event.target instanceof HTMLSelectElement ||
        event.target instanceof HTMLInputElement
      )
        return;
      if (event.key === "ArrowRight")
        setIndex((value) => Math.min(value + 1, 7));
      if (event.key === "ArrowLeft")
        setIndex((value) => Math.max(value - 1, 0));
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  return (
    <>
      <Header />
      <main className={styles.deck}>
        <section className={styles.slide} aria-live="polite">
          <p className={styles.eyebrow}>
            OCNIF · TUM BLOCKCHAIN & AI HACKATHON
          </p>
          <span className={styles.symbol}>
            <Icon
              name={
                index === 1 ? "activity" : index === 5 ? "wallet" : "shield"
              }
              width="130"
              height="130"
            />
          </span>
          <h1>{slides[index][0]}</h1>
          <p className={styles.body}>{slides[index][1]}</p>
          {index === 7 && (
            <Link className={styles.launch} href="/workspace">
              {t.heroCta}
              <Icon name="arrow" />
            </Link>
          )}
          <span className={styles.watermark}>0{index + 1}</span>
        </section>
        <nav className={styles.controls} aria-label={t.navDeck}>
          <Button
            variant="secondary"
            disabled={index === 0}
            onClick={() => setIndex(index - 1)}
            aria-label={t.previous}
          >
            ←
          </Button>
          <div className={styles.dots}>
            {slides.map((slide, number) => (
              <button
                type="button"
                key={slide[0]}
                aria-label={`${t.slide} ${number + 1}`}
                aria-current={index === number ? "step" : undefined}
                onClick={() => setIndex(number)}
              />
            ))}
          </div>
          <span>
            {index + 1} / {slides.length}
          </span>
          <Button
            variant="secondary"
            disabled={index === slides.length - 1}
            onClick={() => setIndex(index + 1)}
            aria-label={t.next}
          >
            →
          </Button>
        </nav>
      </main>
    </>
  );
}
