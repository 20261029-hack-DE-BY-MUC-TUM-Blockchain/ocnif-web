"use client";
import { useCallback, useRef, useState } from "react";
import { record } from "@/lib/types/runtime";
import {
  encodePcm16,
  parseSpeakerSegments,
  type SpeakerSegment,
} from "./audio";

function closeContext(context: AudioContext | null) {
  void context?.close().catch(() => {
    console.warn("Speaker capture context did not close.");
  });
}
export function useDiarization(enabled: boolean) {
  const context = useRef<AudioContext | null>(null);
  const generation = useRef(0);
  const processor = useRef<AudioWorkletNode | null>(null);
  const chunks = useRef<Float32Array[]>([]);
  const inFlight = useRef<AbortController | null>(null);
  const [segments, setSegments] = useState<SpeakerSegment[]>([]);
  const [status, setStatus] = useState("idle");
  async function capture(stream: MediaStream) {
    if (!enabled) return;
    const currentGeneration = generation.current;
    const active = () => generation.current === currentGeneration;
    let audio: AudioContext | null = null;
    try {
      audio = new AudioContext({ sampleRate: 16000 });
      context.current = audio;
      await audio.audioWorklet.addModule("/voice-processor.js");
      if (!active() || context.current !== audio) return;
      const source = audio.createMediaStreamSource(stream);
      const worklet = new AudioWorkletNode(audio, "ocnif-audio-capture");
      processor.current = worklet;
      worklet.port.onmessage = (event) => {
        if (!(event.data instanceof Float32Array)) return;
        if (!active()) {
          event.data.fill(0);
          return;
        }
        chunks.current.push(event.data);
        while (chunks.current.length > 312) chunks.current.shift()?.fill(0);
      };
      source.connect(worklet);
      worklet.connect(audio.destination);
      await audio.resume();
      if (!active() || context.current !== audio) return;
      setStatus("ready");
    } catch {
      closeContext(audio);
      if (active()) {
        context.current = null;
        setStatus("error");
      }
    }
  }
  async function snapshot() {
    if (!enabled || !chunks.current.length || inFlight.current) return;
    const current = chunks.current;
    chunks.current = [];
    const controller = new AbortController();
    const currentGeneration = generation.current;
    const active = () =>
      generation.current === currentGeneration && !controller.signal.aborted;
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
      if (!active()) return;
      setSegments(parseSpeakerSegments(data.segments));
      setStatus("ready");
    } catch {
      if (active()) setStatus("error");
    } finally {
      current.forEach((chunk) => {
        chunk.fill(0);
      });
      if (inFlight.current === controller) inFlight.current = null;
    }
  }
  const stop = useCallback(() => {
    generation.current += 1;
    inFlight.current?.abort();
    inFlight.current = null;
    processor.current?.disconnect();
    processor.current = null;
    closeContext(context.current);
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
