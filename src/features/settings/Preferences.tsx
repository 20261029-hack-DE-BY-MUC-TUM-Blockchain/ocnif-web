"use client";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { dictionaries, locales } from "@/lib/i18n";
import type { Locale } from "@/lib/types/runtime";

const PreferencesContext = createContext({
  locale: "en" as Locale,
  theme: "dark",
  setLocale: (_locale: Locale) => {},
  toggleTheme: () => {},
  t: dictionaries.en,
});
export function Preferences({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [theme, setTheme] = useState("dark");
  useEffect(() => {
    const savedLocale = localStorage.getItem("ocnif-locale");
    const savedTheme = localStorage.getItem("ocnif-theme");
    if (locales.includes(savedLocale as Locale))
      setLocaleState(savedLocale as Locale);
    setTheme(savedTheme === "light" ? "light" : "dark");
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.lang = locale;
  }, [theme, locale]);
  function setLocale(value: Locale) {
    localStorage.setItem("ocnif-locale", value);
    setLocaleState(value);
  }
  function toggleTheme() {
    const value = theme === "dark" ? "light" : "dark";
    localStorage.setItem("ocnif-theme", value);
    setTheme(value);
  }
  return (
    <PreferencesContext.Provider
      value={{ locale, theme, setLocale, toggleTheme, t: dictionaries[locale] }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}
export function usePreferences() {
  return useContext(PreferencesContext);
}
