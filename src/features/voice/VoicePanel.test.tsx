import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { dictionaries } from "@/lib/i18n";
import type { useVoice } from "./useVoice";
import { VoicePanel } from "./VoicePanel";

function syntheticVoice(): ReturnType<typeof useVoice> {
  return {
    status: "connected",
    muted: false,
    transcript: "Synthetic microphone transcript. ".repeat(500),
    assistantTranscript: "Synthetic assistant caption.",
    activity: "listening",
    playbackBlocked: false,
    responseError: null,
    start: async () => {},
    end: () => {},
    toggleMute: () => {},
    receiveEvent: () => {},
    resumeAudio: async () => {},
    diarization: {
      status: "ready",
      segments: Array.from({ length: 60 }, (_, index) => ({
        speaker: "speaker_0",
        start: index / 10,
        end: (index + 1) / 10,
      })),
      capture: async () => {},
      snapshot: async () => {},
      stop: () => {},
    },
  };
}

test("long synthetic voice details are collapsed without hiding end or mute controls", () => {
  const html = renderToStaticMarkup(
    <VoicePanel
      voice={syntheticVoice()}
      capabilities={null}
      connection="connected"
    />,
  );
  const details = html.match(/<details\b[^>]*>[\s\S]*<\/details>/)?.[0];
  assert.ok(details);
  assert.doesNotMatch(
    details.match(/^<details[^>]*>/)?.[0] || "",
    /\bopen[=\s>]/,
  );
  assert.match(details, /<summary>Transcript &amp; speaker details<\/summary>/);
  assert.match(
    details,
    /<section[^>]*aria-label="Transcript &amp; speaker details" tabindex="0"/,
  );
  assert.ok(details.includes("Synthetic assistant caption."));
  assert.ok(details.includes("speaker_0: 5.90"));
  const visible = html.slice(0, html.indexOf("<details"));
  assert.match(visible, /aria-label="Mute microphone"/);
  assert.match(visible, />End voice conversation/);
  assert.doesNotMatch(details, /<button/);
});

test("audio recovery, task activity and errors stay visible while details are collapsed", () => {
  const voice = syntheticVoice();
  voice.playbackBlocked = true;
  voice.activity = "working";
  voice.responseError = "task_failed";
  voice.muted = true;
  const html = renderToStaticMarkup(
    <VoicePanel voice={voice} capabilities={null} connection="disconnected" />,
  );
  const visible = html.slice(0, html.indexOf("<details"));
  assert.ok(visible.includes(dictionaries.en.enableAudio));
  assert.ok(visible.includes(dictionaries.en.voiceWorking));
  assert.ok(visible.includes(dictionaries.en.voiceTaskFailed));
  assert.match(visible, /aria-label="Unmute microphone" aria-pressed="true"/);
  assert.doesNotMatch(visible, /disabled=/);
});

test("voice and details controls have complete English, Spanish, German and French labels", () => {
  for (const copy of Object.values(dictionaries)) {
    for (const key of [
      "voiceDetails",
      "detailsTitle",
      "showDetails",
      "hideDetails",
      "enableAudio",
      "voiceThinking",
      "voiceWorking",
      "voiceResponding",
      "assistantTranscript",
      "voiceResponseFailed",
      "voiceTranscriptionFailed",
      "voiceTaskFailed",
      "voiceSessionFailed",
      "voiceMuted",
    ] as const)
      assert.ok(copy[key].trim(), key);
  }
});
