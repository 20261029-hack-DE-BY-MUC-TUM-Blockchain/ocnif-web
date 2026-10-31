"use client";
import { useEffect, useState } from "react";
import { type CardanoStatus, parseCardanoStatus } from "./masumi";

export function useCardanoStatus() {
  const [status, setStatus] = useState<CardanoStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    void revision;
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    setStatus(null);
    fetch("/paid/config", {
      credentials: "same-origin",
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Cardano status unavailable");
        const body = await response.text();
        if (new TextEncoder().encode(body).byteLength > 32_768)
          throw new Error("Cardano status exceeds limit");
        return parseCardanoStatus(JSON.parse(body));
      })
      .then((result) => {
        if (!controller.signal.aborted) setStatus(result);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [revision]);
  return {
    status,
    loading,
    error,
    refresh: () => setRevision((value) => value + 1),
  };
}
