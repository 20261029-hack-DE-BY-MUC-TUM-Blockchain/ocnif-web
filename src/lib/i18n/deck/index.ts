import type { Locale } from "@/lib/types/runtime";
import { deckGerman } from "./de";
import { type DeckCopy, deckEnglish } from "./en";
import { deckSpanish } from "./es";
import { deckFrench } from "./fr";
export const deckDictionaries: Record<Locale, DeckCopy> = {
  en: deckEnglish,
  es: deckSpanish,
  de: deckGerman,
  fr: deckFrench,
};
export type { DeckCopy } from "./en";
