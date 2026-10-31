"use client";
import Link from "next/link";
import { Button } from "@/components/ui/buttons/Button/Button";
import { Icon } from "@/components/ui/data-display/Icon/Icon";
import { languageNames, locales } from "@/lib/i18n";
import type { Locale } from "@/lib/types/runtime";
import styles from "./Header.module.css";
import { usePreferences } from "./Preferences";
export function Brand() {
  return (
    <Link href="/" aria-label="Ocnif" className={styles.brand}>
      <span className={styles.mark}>
        <Icon name="shield" />
      </span>
      ocnif<span className={styles.brandDot}>.</span>
    </Link>
  );
}
export function Settings() {
  const { locale, setLocale, theme, toggleTheme, t } = usePreferences();
  return (
    <div className={styles.settings}>
      <label className={styles.language}>
        <Icon name="globe" />
        <span className={styles.hidden}>{t.language}</span>
        <select
          value={locale}
          onChange={(event) => setLocale(event.target.value as Locale)}
          aria-label={t.language}
        >
          {locales.map((item) => (
            <option key={item} value={item}>
              {languageNames[item]}
            </option>
          ))}
        </select>
      </label>
      <Button
        variant="icon"
        onClick={toggleTheme}
        title={t.theme}
        aria-label={t.theme}
      >
        <Icon name={theme === "dark" ? "sun" : "moon"} />
      </Button>
    </div>
  );
}
export function Header() {
  const { t } = usePreferences();
  return (
    <header className={styles.header}>
      <Brand />
      <nav className={styles.nav} aria-label="Main">
        <Link href="/#how-it-works">{t.navAbout}</Link>
        <Link href="/deck/202610311230">{t.navDeck}</Link>
        <Link href="/workspace">{t.navWorkspace}</Link>
      </nav>
      <Settings />
    </header>
  );
}
