"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/buttons/Button/Button";
import { usePreferences } from "../settings/Preferences";
import styles from "./InstallPrompt.module.css";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
export function InstallPrompt() {
  const { t } = usePreferences();
  const [install, setInstall] = useState<InstallEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    if ("serviceWorker" in navigator)
      navigator.serviceWorker.register("/sw.js").catch(() => {
        setDismissed(true);
      });
    const handler = (event: Event) => {
      event.preventDefault();
      setInstall(event as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);
  async function prompt() {
    await install?.prompt();
    await install?.userChoice;
    setInstall(null);
  }
  if (!install || dismissed) return null;
  return (
    <div className={styles.prompt}>
      <Button onClick={prompt}>{t.install}</Button>
      <Button
        variant="ghost"
        onClick={() => setDismissed(true)}
        aria-label={t.reject}
      >
        ×
      </Button>
    </div>
  );
}
