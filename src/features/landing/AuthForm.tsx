"use client";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/buttons/Button/Button";
import { usePreferences } from "../settings/Preferences";
import styles from "./Landing.module.css";
export function AuthForm() {
  const { t } = usePreferences();
  const router = useRouter();
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const payload = register
      ? {
          email: data.get("email"),
          password: data.get("password"),
          name: data.get("name"),
        }
      : { email: data.get("email"), password: data.get("password") };
    try {
      const result = await fetch(
        `/api/auth/${register ? "register" : "login"}`,
        {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!result.ok) throw new Error("Authentication failed");
      router.push("/workspace");
    } catch {
      setError(t.authError);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className={styles.auth}>
      {register && (
        <label>
          {t.name}
          <input name="name" autoComplete="name" required maxLength={100} />
        </label>
      )}
      <label>
        {t.email}
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
        />
      </label>
      <label>
        {t.password}
        <input
          name="password"
          type="password"
          autoComplete={register ? "new-password" : "current-password"}
          required
          minLength={12}
          maxLength={128}
        />
      </label>
      {error && <p role="alert">{error}</p>}
      <Button disabled={busy}>
        {busy ? t.loading : register ? t.register : t.signIn}
      </Button>
      <Button
        type="button"
        variant="ghost"
        onClick={() => setRegister(!register)}
      >
        {register ? t.signIn : t.register}
      </Button>
    </form>
  );
}
