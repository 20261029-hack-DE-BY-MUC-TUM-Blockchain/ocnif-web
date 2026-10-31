import { type ChangeEvent, type KeyboardEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/buttons/Button/Button";
import { Icon } from "@/components/ui/data-display/Icon/Icon";
import { Tooltip } from "@/components/ui/overlays/Tooltip/Tooltip";
import { usePreferences } from "../settings/Preferences";
import styles from "./Workspace.module.css";

const commands = [
  "/assess",
  "/train",
  "/plan",
  "/verify",
  "/report",
  "/publish",
  "/help",
  "/skills",
];
const agents = ["@analyst", "@remediation", "@verifier"];
export function Composer({
  value,
  setValue,
  send,
  active,
  connected,
  stop,
}: {
  value: string;
  setValue: (value: string) => void;
  send: () => void;
  active: boolean;
  connected: boolean;
  stop: () => void;
}) {
  const { t } = usePreferences();
  const input = useRef<HTMLInputElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const [error, setError] = useState("");
  const token = value.split(/\s/).at(-1) || "";
  const suggestions = token.startsWith("/")
    ? commands.filter((item) => item.startsWith(token))
    : token.startsWith("@")
      ? agents.filter((item) => item.startsWith(token))
      : [];
  function keyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      if (value.trim() && connected) send();
    }
  }
  async function attach(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 262144 || !/\.(txt|md|json|csv|log)$/i.test(file.name)) {
      setError(t.attachmentError);
      return;
    }
    try {
      const content = await file.text();
      setValue(`${value}\n\n[${file.name}]\n${content}`);
      setError("");
    } catch {
      setError(t.attachmentError);
    }
  }
  function complete(item: string) {
    setValue(`${value.slice(0, value.length - token.length)}${item} `);
    textarea.current?.focus();
  }
  return (
    <div className={styles.composer}>
      {suggestions.length > 0 && (
        <fieldset
          className={styles.suggestions}
          aria-label={token.startsWith("@") ? t.agents : t.commands}
        >
          {suggestions.map((item) => (
            <button type="button" key={item} onClick={() => complete(item)}>
              {item}
            </button>
          ))}
        </fieldset>
      )}
      <textarea
        ref={textarea}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={keyDown}
        placeholder={active ? t.steerPrompt : t.prompt}
        aria-label={active ? t.steerPrompt : t.prompt}
        rows={2}
        maxLength={262144}
      />
      <div className={styles.composerActions}>
        <div>
          <Tooltip label={t.attachmentHint}>
            <Button
              variant="icon"
              title={t.attach}
              aria-label={t.attach}
              onClick={() => input.current?.click()}
            >
              <Icon name="paperclip" />
            </Button>
          </Tooltip>
          <Tooltip label={t.commands}>
            <Button
              variant="ghost"
              aria-label={t.commands}
              onClick={() => {
                setValue("/");
                textarea.current?.focus();
              }}
            >
              <Icon name="command" />
            </Button>
          </Tooltip>
          <Tooltip label={t.agents}>
            <Button
              variant="ghost"
              aria-label={t.agents}
              onClick={() => {
                setValue(`${value} @`);
                textarea.current?.focus();
              }}
            >
              @
            </Button>
          </Tooltip>
        </div>
        <div>
          {active && (
            <Button
              variant="icon"
              title={t.stop}
              aria-label={t.stop}
              onClick={stop}
            >
              <Icon name="stop" />
            </Button>
          )}
          <Button
            onClick={send}
            disabled={!value.trim() || !connected}
            aria-label={active ? t.steer : t.send}
          >
            {active ? t.steer : t.send}
            <Icon name="arrow" />
          </Button>
        </div>
      </div>
      <input
        ref={input}
        type="file"
        accept=".txt,.md,.json,.csv,.log"
        onChange={attach}
        hidden
      />
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      <p className={styles.composerHint}>{t.help}</p>
    </div>
  );
}
