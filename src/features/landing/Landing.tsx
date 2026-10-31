"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/buttons/Button/Button";
import { GlassCard } from "@/components/ui/cards/GlassCard/GlassCard";
import { Icon, type IconName } from "@/components/ui/data-display/Icon/Icon";
import { demoLogin } from "@/lib/api/client";
import { Header } from "../settings/Header";
import { usePreferences } from "../settings/Preferences";
import { AuthForm } from "./AuthForm";
import styles from "./Landing.module.css";
export function Landing() {
  const { t } = usePreferences();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [auth, setAuth] = useState(false);
  async function enter() {
    setBusy(true);
    setError("");
    try {
      await demoLogin();
      router.push("/workspace");
    } catch {
      setError(t.demoError);
    } finally {
      setBusy(false);
    }
  }
  const features: [IconName, string, string][] = [
    ["eye", t.feature1, t.feature1Body],
    ["shield", t.feature2, t.feature2Body],
    ["activity", t.feature3, t.feature3Body],
  ];
  return (
    <>
      <Header />
      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.copy}>
            <p className={styles.eyebrow}>
              <span />
              {t.heroEyebrow}
            </p>
            <h1>{t.heroTitle}</h1>
            <p className={styles.intro}>{t.heroBody}</p>
            <div className={styles.actions}>
              <Button onClick={enter} disabled={busy}>
                {busy ? t.loading : t.demo}
                <Icon name="arrow" />
              </Button>
              <Button variant="ghost" onClick={() => setAuth(!auth)}>
                {t.signIn}
                <Icon name="chevron" />
              </Button>
            </div>
            {error && (
              <p role="alert" className={styles.error}>
                {error}
              </p>
            )}
            <p className={styles.note}>{t.heroNote}</p>
            {auth && <AuthForm />}
          </div>
          <HeroVisual />
        </section>
        <section className={styles.features}>
          {features.map(([icon, title, body]) => (
            <GlassCard key={title}>
              <div className={styles.featureIcon}>
                <Icon name={icon} />
              </div>
              <h3>{title}</h3>
              <p>{body}</p>
            </GlassCard>
          ))}
        </section>
        <section id="how-it-works" className={styles.how}>
          <p className={styles.eyebrow}>{t.navAbout}</p>
          <h2>{t.howTitle}</h2>
          <div className={styles.steps}>
            {[
              [t.step1, t.step1Body],
              [t.step2, t.step2Body],
              [t.step3, t.step3Body],
            ].map(([title, body], index) => (
              <div key={title}>
                <span className={styles.number}>0{index + 1}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            ))}
          </div>
          <Link className={styles.deckLink} href="/deck/202610311230">
            {t.navDeck}
            <Icon name="arrow" />
          </Link>
        </section>
      </main>
      <footer className={styles.footer}>
        <span>{t.footer}</span>
        <span>
          <Icon name="lock" />
          {t.scope}
        </span>
      </footer>
    </>
  );
}
function HeroVisual() {
  const { t } = usePreferences();
  return (
    <div className={styles.visual} role="img" aria-label={t.heroCaption}>
      <div className={styles.orbit}>
        <div className={styles.orbitInner} />
        <div className={styles.orbitCore}>
          <Icon name="shield" width="94" height="94" />
        </div>
        <span className={styles.orbitNode} />
        <span className={styles.orbitNode2} />
      </div>
      <GlassCard className={styles.floating}>
        <span className={styles.mint}>
          <Icon name="spark" />
          {t.heroBadge}
        </span>
        <h2>{t.heroSignal}</h2>
        <div className={styles.signal}>
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
      </GlassCard>
      <div className={styles.roleStrip}>
        {[t.analyst, t.remediation, t.verifier].map((role, index) => (
          <div key={role}>
            <span>0{index + 1}</span>
            {role}
            <Icon name="check" />
          </div>
        ))}
      </div>
    </div>
  );
}
