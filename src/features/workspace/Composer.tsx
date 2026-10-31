import {
  type ChangeEvent,
  type KeyboardEvent,
  useId,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/buttons/Button/Button";
import { Icon } from "@/components/ui/data-display/Icon/Icon";
import { Tooltip } from "@/components/ui/overlays/Tooltip/Tooltip";
import { usePreferences } from "../settings/Preferences";
import {
  appendTextEvidence,
  MAX_SUBMISSION_BYTES,
  submissionBytes,
} from "./submission";
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
  const bytesId = useId();
  const errorId = useId();
  const byteCount = submissionBytes(value);
  const tooLarge = byteCount > MAX_SUBMISSION_BYTES;
  const visibleError = tooLarge ? t.messageTooLarge : error;
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
      if (byteCount > 0 && !tooLarge && connected) send();
    }
  }
  async function attach(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!/\.(txt|md|json|csv|log)$/i.test(file.name)) {
      setError(t.attachmentError);
      return;
    }
    if (file.size > MAX_SUBMISSION_BYTES) {
      setError(t.attachmentTooLarge);
      return;
    }
    try {
      const content = await file.text();
      setValue(appendTextEvidence(value, file.name, content));
      setError("");
    } catch (failure) {
      setError(
        failure instanceof RangeError
          ? t.attachmentTooLarge
          : t.attachmentError,
      );
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
        onChange={(event) => {
          setValue(event.target.value);
          setError("");
        }}
        onKeyDown={keyDown}
        placeholder={active ? t.steerPrompt : t.prompt}
        aria-label={active ? t.steerPrompt : t.prompt}
        aria-invalid={tooLarge || undefined}
        aria-describedby={`${bytesId}${visibleError ? ` ${errorId}` : ""}`}
        rows={2}
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
            disabled={byteCount === 0 || tooLarge || !connected}
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
      {visibleError && (
        <p id={errorId} role="alert" className={styles.error}>
          {visibleError}
        </p>
      )}
      <p id={bytesId} className={styles.composerHint}>
        {t.messageBytes.replace("{used}", String(byteCount))}
      </p>
      <p className={styles.composerHint}>{t.help}</p>
    </div>
  );
}
