"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/buttons/Button/Button";
import { Icon } from "@/components/ui/data-display/Icon/Icon";
import { Tooltip } from "@/components/ui/overlays/Tooltip/Tooltip";
import type { RuntimeEvent } from "@/lib/types/runtime";
import { Brand, Settings } from "../settings/Header";
import { usePreferences } from "../settings/Preferences";
import { useVoice } from "../voice/useVoice";
import { VoicePanel } from "../voice/VoicePanel";
import { Composer } from "./Composer";
import { Messages } from "./Messages";
import { TeamPanel } from "./TeamPanel";
import { TracePanel } from "./TracePanel";
import { useWorkspace } from "./useWorkspace";
import styles from "./Workspace.module.css";
export function Workspace() {
  const { t, locale } = usePreferences();
  const [value, setValue] = useState("");
  const [details, setDetails] = useState(true);
  const [sidebar, setSidebar] = useState(false);
  const eventRef = useRef<(event: RuntimeEvent) => void>(() => {});
  const workspace = useWorkspace(locale, (event) => eventRef.current(event));
  const voice = useVoice(
    locale,
    workspace.send,
    workspace.capabilities?.diarization || false,
  );
  eventRef.current = voice.receiveEvent;
  function send() {
    if (workspace.send(value)) setValue("");
  }
  function exportChat() {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            messages: workspace.state.messages,
            events: workspace.state.events,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ocnif-conversation.json";
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className={styles.shell} data-details={details}>
      <aside className={styles.sidebar} data-open={sidebar}>
        <Brand />
        <Button
          onClick={() => {
            workspace.newConversation();
            setSidebar(false);
          }}
          variant="secondary"
        >
          <Icon name="plus" />
          {t.newChat}
        </Button>
        <div className={styles.sidebarLabel}>{t.conversations}</div>
        <nav className={styles.chatList} aria-label={t.conversations}>
          {workspace.list.map((item) => (
            <button
              type="button"
              key={item.id}
              aria-current={workspace.selected === item.id ? "page" : undefined}
              onClick={() => {
                voice.end();
                workspace.setSelected(item.id);
                setSidebar(false);
              }}
            >
              <Icon name="chat" />
              <span>{item.title || t.newChat}</span>
            </button>
          ))}
        </nav>
        <div className={styles.sidebarBottom}>
          <Link href="/deck/202610311230">
            <Icon name="play" />
            {t.navDeck}
          </Link>
          <div className={styles.user}>
            <span>{workspace.user?.name?.slice(0, 1) || "O"}</span>
            <div>
              <b>{workspace.user?.name || "Ocnif"}</b>
              <small>{t.scope}</small>
            </div>
            <Tooltip label={t.signOut}>
              <Button
                variant="ghost"
                aria-label={t.signOut}
                onClick={() => {
                  voice.end();
                  workspace.signOut();
                }}
              >
                <Icon name="logout" />
              </Button>
            </Tooltip>
          </div>
        </div>
      </aside>
      <main className={styles.main}>
        <header className={styles.topbar}>
          <div>
            <Button
              variant="ghost"
              className={styles.mobileMenu}
              aria-label={t.conversations}
              onClick={() => setSidebar(!sidebar)}
            >
              <Icon name="menu" />
            </Button>
            <div>
              <h2>{t.workspace}</h2>
              <span
                className={styles.connection}
                data-connected={workspace.connection === "connected"}
              >
                <i />
                {workspace.connection === "connected"
                  ? t.connected
                  : workspace.connection === "connecting"
                    ? t.connecting
                    : t.disconnected}
              </span>
            </div>
          </div>
          <div>
            <Settings />
            <Tooltip label={t.download}>
              <Button
                variant="icon"
                disabled={!workspace.state.messages.length}
                aria-label={t.download}
                onClick={exportChat}
              >
                <Icon name="download" />
              </Button>
            </Tooltip>
            <Tooltip label={t.showTrace}>
              <Button
                variant="icon"
                aria-label={t.showTrace}
                aria-expanded={details}
                onClick={() => setDetails(!details)}
              >
                <Icon name="activity" />
              </Button>
            </Tooltip>
          </div>
        </header>
        <section className={styles.conversation}>
          {workspace.connection === "disconnected" && (
            <div className={styles.banner} role="alert">
              {t.disconnected}
              <Button variant="secondary" onClick={workspace.reconnect}>
                {t.retry}
              </Button>
            </div>
          )}
          {workspace.capabilities && !workspace.capabilities.ai_configured && (
            <output className={styles.banner}>{t.aiUnavailable}</output>
          )}
          <div className={styles.scrollArea}>
            <Messages
              messages={workspace.state.messages}
              draft={workspace.state.draft}
              active={workspace.state.active}
              onSample={setValue}
            />
            {workspace.state.error && (
              <p role="alert" className={styles.error}>
                {workspace.state.error}
              </p>
            )}
            {workspace.state.approval && (
              <div className={styles.approval}>
                <Icon name="shield" />
                <div>
                  <h3>{t.approval}</h3>
                  <b>{workspace.state.approval.title}</b>
                  <p>{workspace.state.approval.description}</p>
                  <div>
                    <Button
                      onClick={() =>
                        workspace.control({
                          type: "approval",
                          approval_id: workspace.state.approval?.id || "",
                          decision: "approve",
                        })
                      }
                    >
                      {t.approve}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() =>
                        workspace.control({
                          type: "approval",
                          approval_id: workspace.state.approval?.id || "",
                          decision: "reject",
                        })
                      }
                    >
                      {t.reject}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className={styles.inputArea}>
            <VoicePanel
              voice={voice}
              capabilities={workspace.capabilities}
              connection={workspace.connection}
            />
            <Composer
              value={value}
              setValue={setValue}
              send={send}
              active={workspace.state.active}
              connected={workspace.connection === "connected"}
              stop={() => workspace.control({ type: "cancel" })}
            />
            <p className={styles.storageNote}>
              <Icon name="lock" />
              {t.memoryNote}
            </p>
          </div>
        </section>
      </main>
      {details && (
        <aside className={styles.details}>
          <TeamPanel
            events={workspace.state.events}
            capabilities={workspace.capabilities}
          />
          <TracePanel events={workspace.state.events} />
        </aside>
      )}
    </div>
  );
}
