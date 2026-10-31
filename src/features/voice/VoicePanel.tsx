"use client";
import { Button } from "@/components/ui/buttons/Button/Button";
import { Icon } from "@/components/ui/data-display/Icon/Icon";
import { Tooltip } from "@/components/ui/overlays/Tooltip/Tooltip";
import type { Capabilities } from "@/lib/types/runtime";
import { usePreferences } from "../settings/Preferences";
import styles from "../workspace/Workspace.module.css";
import type { useVoice } from "./useVoice";
export function VoicePanel({
  voice,
  capabilities,
  connection,
}: {
  voice: ReturnType<typeof useVoice>;
  capabilities: Capabilities | null;
  connection: string;
}) {
  const { t } = usePreferences();
  const isVoice = voice.status === "connected" || voice.status === "connecting";
  return (
    <>
      <div className={styles.voiceBar}>
        <div>
          <Icon name={isVoice ? "activity" : "mic"} />
          <span>
            {voice.status === "connecting"
              ? t.voiceConnecting
              : voice.status === "connected"
                ? t.voiceActive
                : t.voiceReady}
          </span>
        </div>
        <div>
          {isVoice && (
            <Tooltip label={voice.muted ? t.unmute : t.mute}>
              <Button
                variant="icon"
                aria-label={voice.muted ? t.unmute : t.mute}
                onClick={voice.toggleMute}
              >
                <Icon name={voice.muted ? "muted" : "mic"} />
              </Button>
            </Tooltip>
          )}
          <Tooltip
            label={
              !capabilities?.voice_configured
                ? t.voiceUnavailable
                : isVoice
                  ? t.voiceEnd
                  : t.voiceStart
            }
          >
            <Button
              variant={isVoice ? "secondary" : "ghost"}
              disabled={
                !isVoice &&
                (!capabilities?.voice_configured || connection !== "connected")
              }
              onClick={() => (isVoice ? voice.end() : voice.start())}
            >
              {isVoice ? t.voiceEnd : t.voiceStart}
              <Icon name={isVoice ? "close" : "mic"} />
            </Button>
          </Tooltip>
        </div>
      </div>
      {!isVoice && (
        <p className={styles.voiceDisclosure}>{t.voiceDisclosure}</p>
      )}
      {voice.status === "error" && (
        <p className={styles.error} role="alert">
          {t.voiceError}
        </p>
      )}
      {isVoice && (
        <div className={styles.voiceTranscript}>
          <p>{t.voiceDisclosure}</p>
          <span>
            {capabilities?.diarization ? t.speakerCaveat : t.noDiarization}
          </span>
          <div>
            {voice.diarization.status === "working" && (
              <span>{t.speakerBusy}</span>
            )}
            {voice.diarization.status === "error" && (
              <span>{t.noDiarization}</span>
            )}
            {voice.diarization.segments.length > 0 && (
              <div>
                <b>{t.speakerSnapshot}</b>
                {voice.diarization.segments.map((segment, index) => (
                  <p key={`${index}-${segment.speaker}`}>
                    {segment.speaker}: {segment.start.toFixed(2)}–
                    {segment.end.toFixed(2)} s
                  </p>
                ))}
              </div>
            )}
          </div>
          <div aria-live="polite">
            <b>
              {t.speaker} · {t.transcript}
            </b>
            <p>{voice.transcript || t.voiceSpeaking}</p>
          </div>
        </div>
      )}
    </>
  );
}
