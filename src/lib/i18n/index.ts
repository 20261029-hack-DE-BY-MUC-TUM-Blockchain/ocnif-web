import type { Locale } from "../types/runtime";
import { de } from "./de";
import { en } from "./en";
import { es } from "./es";
import { fr } from "./fr";
export const dictionaries = { en, es, de, fr };
export const locales: Locale[] = ["en", "es", "de", "fr"];
export const languageNames = {
  en: "English",
  es: "Español",
  de: "Deutsch",
  fr: "Français",
};
