"use client";
import { useEffect, useRef, useState } from "react";
import { voiceSession } from "@/lib/api/client";
import { type Locale, type RuntimeEvent, record } from "@/lib/types/runtime";
import { advanceTranscript, type TranscriptState } from "./transcript";
import { useDiarization } from "./useDiarization";

type VoiceRequest = { callId: string; requestId: string; runId?: string };
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
  const pending = useRef<VoiceRequest[]>([]);
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
  function end() {
    generation.current += 1;
    connectionRequest.current?.abort();
    connectionRequest.current = null;
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
    pending.current = [];
    setStatus("idle");
    setMuted(false);
  }
  useEffect(
    () => () => {
      generation.current += 1;
      connectionRequest.current?.abort();
      diarization.stop();
      channel.current?.close();
      peer.current?.close();
      media.current?.getTracks().forEach((track) => {
        track.stop();
      });
      if (audio.current) audio.current.srcObject = null;
    },
    [diarization.stop],
  );
  function reply(callId: string, output: string) {
    if (channel.current?.readyState !== "open") return;
    channel.current.send(
      JSON.stringify({
        type: "conversation.item.create",
        item: { type: "function_call_output", call_id: callId, output },
      }),
    );
    channel.current.send(JSON.stringify({ type: "response.create" }));
  }
  function handleMessage(raw: string) {
    try {
      const message = record(JSON.parse(raw));
      utterance.current = advanceTranscript(utterance.current, message);
      setTranscript(utterance.current.text);
      if (
        message.type === "conversation.item.input_audio_transcription.completed"
      )
        void diarization.snapshot();
      if (
        message.type === "response.function_call_arguments.done" &&
        message.name === "ocnif_request" &&
        typeof message.call_id === "string" &&
        typeof message.arguments === "string"
      ) {
        const args = record(JSON.parse(message.arguments));
        if (typeof args.content !== "string") return;
        const id = crypto.randomUUID();
        if (request.current(args.content, id))
          pending.current.push({ callId: message.call_id, requestId: id });
        else
          reply(
            message.call_id,
            "The workspace is disconnected. No task was executed.",
          );
      }
      if (message.type === "error") {
        end();
        setStatus("error");
      }
    } catch {
      end();
      setStatus("error");
    }
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
    try {
      const session = await voiceSession(locale);
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
      await diarization.capture(stream);
      if (!active()) return;
      const pc = new RTCPeerConnection();
      peer.current = pc;
      audio.current = new Audio();
      audio.current.autoplay = true;
      pc.ontrack = (event) => {
        if (audio.current) audio.current.srcObject = event.streams[0];
      };
      for (const track of stream.getAudioTracks()) pc.addTrack(track, stream);
      const dc = pc.createDataChannel("oai-events");
      channel.current = dc;
      dc.onmessage = (event) => {
        if (active()) handleMessage(event.data);
      };
      dc.onopen = () => {
        if (!active()) return;
        setStatus("connected");
        dc.send(
          JSON.stringify({
            type: "session.update",
            session: {
              type: "realtime",
              instructions: `Speak in ${locale}. You are the voice interface of Ocnif. For every security task, call ocnif_request with the full user request and evidence. Wait for its result; do not claim an investigation or payment occurred yourself. Read its result faithfully and briefly.`,
              tools: [
                {
                  type: "function",
                  name: "ocnif_request",
                  description:
                    "Run the user's authorized evidence-review or security-training task in Ocnif and receive its actual result.",
                  parameters: {
                    type: "object",
                    properties: { content: { type: "string" } },
                    required: ["content"],
                    additionalProperties: false,
                  },
                },
              ],
              tool_choice: "auto",
            },
          }),
        );
      };
      pc.onconnectionstatechange = () => {
        if (
          active() &&
          ["failed", "disconnected"].includes(pc.connectionState)
        ) {
          end();
          setStatus("error");
        }
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
      if (active()) {
        end();
        setStatus("error");
      }
    }
  }
  function receiveEvent(event: RuntimeEvent) {
    if (event.type === "run.started") {
      const item = pending.current.find(
        (item) => item.requestId === event.data.request_id,
      );
      if (item) item.runId = event.run_id;
    }
    if (
      event.type === "message.completed" ||
      event.type === "run.failed" ||
      event.type === "run.cancelled"
    ) {
      const matches = pending.current.filter(
        (item) => item.runId === event.run_id,
      );
      for (const item of matches)
        reply(item.callId, JSON.stringify(event.data));
      pending.current = pending.current.filter(
        (item) => item.runId !== event.run_id,
      );
    }
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
    start,
    end,
    toggleMute,
    receiveEvent,
    diarization,
  };
}
