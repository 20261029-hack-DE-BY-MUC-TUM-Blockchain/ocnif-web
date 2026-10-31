"use client";
import { useEffect, useRef, useState } from "react";
import { voiceSession } from "@/lib/api/client";
import { type Locale, type RuntimeEvent, record } from "@/lib/types/runtime";
import { playVoiceAudio } from "./playback";
import {
  VoiceConversation,
  type VoiceResponseState,
  voiceSessionUpdate,
} from "./realtime";
import { advanceTranscript, type TranscriptState } from "./transcript";
import { useDiarization } from "./useDiarization";

const INITIAL_RESPONSE: VoiceResponseState = {
  activity: "listening",
  assistantTranscript: "",
  responseError: null,
};
export function useVoice(
  locale: Locale,
  onRequest: (content: string, id: string) => boolean,
  diarizationEnabled: boolean,
) {
  const diarization = useDiarization(diarizationEnabled);
  const peer = useRef<RTCPeerConnection | null>(null);
  const media = useRef<MediaStream | null>(null);
  const channel = useRef<RTCDataChannel | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const conversation = useRef<VoiceConversation | null>(null);
  const generation = useRef(0);
  const connectionRequest = useRef<AbortController | null>(null);
  const utterance = useRef<TranscriptState>({ itemId: "", text: "" });
  const request = useRef(onRequest);
  request.current = onRequest;
  const [status, setStatus] = useState<
    "idle" | "connecting" | "connected" | "error"
  >("idle");
  const [muted, setMuted] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [responseState, setResponseState] = useState(INITIAL_RESPONSE);
  const [playbackBlocked, setPlaybackBlocked] = useState(false);
  function end() {
    generation.current += 1;
    connectionRequest.current?.abort();
    connectionRequest.current = null;
    conversation.current?.dispose();
    conversation.current = null;
    diarization.stop();
    channel.current?.close();
    peer.current?.close();
    media.current?.getTracks().forEach((track) => {
      track.stop();
    });
    audio.current?.pause();
    if (audio.current) audio.current.srcObject = null;
    peer.current = null;
    media.current = null;
    channel.current = null;
    audio.current = null;
    setStatus("idle");
    setMuted(false);
    setPlaybackBlocked(false);
    setResponseState((state) => ({ ...state, activity: "listening" }));
  }
  useEffect(
    () => () => {
      generation.current += 1;
      connectionRequest.current?.abort();
      conversation.current?.dispose();
      diarization.stop();
      channel.current?.close();
      peer.current?.close();
      media.current?.getTracks().forEach((track) => {
        track.stop();
      });
      audio.current?.pause();
      if (audio.current) audio.current.srcObject = null;
    },
    [diarization.stop],
  );
  async function resumeAudio() {
    const current = audio.current;
    if (!current) return;
    const played = await playVoiceAudio(current);
    if (audio.current === current) setPlaybackBlocked(!played);
  }
  function failConnection() {
    end();
    setStatus("error");
    setResponseState((state) => ({
      ...state,
      responseError: "session_failed",
    }));
  }
  async function start() {
    end();
    const currentGeneration = generation.current;
    const active = () => generation.current === currentGeneration;
    const controller = new AbortController();
    connectionRequest.current = controller;
    utterance.current = { itemId: "", text: "" };
    setStatus("connecting");
    setTranscript("");
    setResponseState(INITIAL_RESPONSE);
    try {
      const session = await voiceSession(locale, controller.signal);
      if (!active()) return;
      const endpoint = new URL(session.calls_url);
      if (
        endpoint.protocol !== "https:" ||
        endpoint.username ||
        endpoint.password ||
        !endpoint.pathname.endsWith("/realtime/calls")
      )
        throw new Error("Invalid voice endpoint");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
      if (!active()) {
        stream.getTracks().forEach((track) => {
          track.stop();
        });
        return;
      }
      media.current = stream;
      // Optional speaker analysis must not delay the primary voice transport.
      void diarization.capture(stream);
      const pc = new RTCPeerConnection();
      peer.current = pc;
      const output = new Audio();
      output.autoplay = true;
      output.setAttribute("playsinline", "");
      audio.current = output;
      pc.ontrack = (event) => {
        if (!active()) return;
        output.srcObject = event.streams[0] ?? new MediaStream([event.track]);
        void playVoiceAudio(output).then((played) => {
          if (active()) setPlaybackBlocked(!played);
        });
      };
      for (const track of stream.getAudioTracks()) pc.addTrack(track, stream);
      const dc = pc.createDataChannel("oai-events");
      channel.current = dc;
      const voice = new VoiceConversation({
        send: (event) => {
          if (!active() || dc.readyState !== "open") return false;
          try {
            dc.send(JSON.stringify(event));
            return true;
          } catch {
            return false;
          }
        },
        request: (content, id) => request.current(content, id),
        changed: (state) => {
          if (active()) setResponseState(state);
        },
      });
      conversation.current = voice;
      let sessionConfirmed = false;
      dc.onmessage = (event) => {
        if (!active()) return;
        try {
          const message = record(JSON.parse(event.data));
          utterance.current = advanceTranscript(utterance.current, message);
          setTranscript(utterance.current.text);
          if (
            message.type ===
            "conversation.item.input_audio_transcription.completed"
          )
            void diarization.snapshot();
          voice.receive(message);
          if (message.type === "error" && !sessionConfirmed)
            throw new Error("Voice configuration refused");
          if (message.type === "session.updated") {
            const updated = record(message.session);
            if (
              !Array.isArray(updated.output_modalities) ||
              !updated.output_modalities.includes("audio")
            )
              throw new Error("Voice audio mode was not confirmed");
            sessionConfirmed = true;
            setStatus("connected");
          }
        } catch {
          failConnection();
        }
      };
      dc.onopen = () => {
        if (active()) dc.send(JSON.stringify(voiceSessionUpdate(locale)));
      };
      dc.onclose = dc.onerror = () => {
        if (active()) failConnection();
      };
      pc.onconnectionstatechange = () => {
        if (active() && ["failed", "disconnected"].includes(pc.connectionState))
          failConnection();
      };
      const offer = await pc.createOffer();
      if (!active()) return;
      await pc.setLocalDescription(offer);
      if (!active()) return;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.value}`,
          "Content-Type": "application/sdp",
        },
        body: offer.sdp,
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("Voice session refused");
      const answer = await response.text();
      if (!active()) return;
      await pc.setRemoteDescription({ type: "answer", sdp: answer });
    } catch {
      if (active()) failConnection();
    }
  }
  function receiveEvent(event: RuntimeEvent) {
    conversation.current?.receiveRuntime(event);
  }
  function toggleMute() {
    const next = !muted;
    media.current?.getAudioTracks().forEach((track) => {
      track.enabled = !next;
    });
    setMuted(next);
  }
  return {
    status,
    muted,
    transcript,
    ...responseState,
    playbackBlocked,
    resumeAudio,
    start,
    end,
    toggleMute,
    receiveEvent,
    diarization,
  };
}
