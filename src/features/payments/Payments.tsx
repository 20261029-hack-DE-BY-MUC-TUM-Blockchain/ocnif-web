"use client";
import { useState } from "react";
import { Button } from "@/components/ui/buttons/Button/Button";
import { Header } from "../settings/Header";
import { usePreferences } from "../settings/Preferences";
import { Api3Panel } from "./Api3Panel";
import { BsvMarketPanel } from "./BsvMarketPanel";
import { CardanoPanel } from "./CardanoPanel";
import styles from "./Payments.module.css";
export function Payments({
  overlayUrl,
  sokosumiUrl,
  initialTab = "api3",
  initialReportId,
}: {
  overlayUrl?: string;
  sokosumiUrl?: string;
  initialTab?: "api3" | "cardano" | "bsv";
  initialReportId?: string;
}) {
  const { t } = usePreferences();
  const [tab, setTab] = useState<string>(initialTab);
  return (
    <>
      <Header />
      <main className={styles.page}>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>OCNIF · PAYMENTS</p>
          <h1>{t.paymentsTitle}</h1>
          <p>{t.paymentsBody}</p>
        </div>
        <div className={styles.tabs}>
          {["api3", "cardano", "bsv"].map((item) => (
            <Button
              key={item}
              aria-pressed={tab === item}
              variant={tab === item ? "primary" : "secondary"}
              onClick={() => setTab(item)}
            >
              {item.toUpperCase()}
            </Button>
          ))}
        </div>
        {tab === "api3" ? (
          <Api3Panel />
        ) : tab === "bsv" ? (
          <BsvMarketPanel
            overlayUrl={overlayUrl}
            initialReportId={initialReportId}
          />
        ) : (
          <CardanoPanel
            sokosumiUrl={sokosumiUrl}
            initialReportId={initialReportId}
          />
        )}
      </main>
    </>
  );
}
