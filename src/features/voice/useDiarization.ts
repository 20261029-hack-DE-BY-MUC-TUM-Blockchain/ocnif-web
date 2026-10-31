"use client";
import { useCallback, useRef, useState } from "react";
import { record } from "@/lib/types/runtime";
import {
  encodePcm16,
  parseSpeakerSegments,
  type SpeakerSegment,
} from "./audio";
export function useDiarization(enabled: boolean) {
  const context = useRef<AudioContext | null>(null);
  const processor = useRef<AudioWorkletNode | null>(null);
  const chunks = useRef<Float32Array[]>([]);
  const inFlight = useRef<AbortController | null>(null);
  const [segments, setSegments] = useState<SpeakerSegment[]>([]);
  const [status, setStatus] = useState("idle");
  async function capture(stream: MediaStream) {
    if (!enabled) return;
    try {
      const audio = new AudioContext({ sampleRate: 16000 });
      context.current = audio;
      await audio.audioWorklet.addModule("/voice-processor.js");
      if (context.current !== audio) return;
      const source = audio.createMediaStreamSource(stream);
      const worklet = new AudioWorkletNode(audio, "ocnif-audio-capture");
      processor.current = worklet;
      worklet.port.onmessage = (event) => {
        if (!(event.data instanceof Float32Array)) return;
        chunks.current.push(event.data);
        while (chunks.current.length > 312) chunks.current.shift()?.fill(0);
      };
      source.connect(worklet);
      worklet.connect(audio.destination);
      await audio.resume();
      if (context.current !== audio) return;
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }
  async function snapshot() {
    if (!enabled || !chunks.current.length || inFlight.current) return;
    const current = chunks.current;
    chunks.current = [];
    const controller = new AbortController();
    inFlight.current = controller;
    setStatus("working");
    try {
      const response = await fetch("/api/voice/diarize", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consent: true, pcm16: encodePcm16(current) }),
        signal: controller.signal,
      });
      current.forEach((chunk) => {
        chunk.fill(0);
      });
      if (!response.ok) throw new Error("Speaker analysis unavailable");
      const data = record(await response.json());
      setSegments(parseSpeakerSegments(data.segments));
      setStatus("ready");
    } catch {
      if (!controller.signal.aborted) setStatus("error");
    } finally {
      current.forEach((chunk) => {
        chunk.fill(0);
      });
      inFlight.current = null;
    }
  }
  const stop = useCallback(() => {
    inFlight.current?.abort();
    processor.current?.disconnect();
    processor.current = null;
    context.current?.close();
    context.current = null;
    chunks.current.forEach((chunk) => {
      chunk.fill(0);
    });
    chunks.current = [];
    setSegments([]);
    setStatus("idle");
  }, []);
  return { capture, snapshot, stop, segments, status };
}
