import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { parseCard, parseEvent } from "@/lib/types/runtime";
import { applyEvent, initialState } from "./state";

const event = (type: string, data = {}) => ({
  id: crypto.randomUUID(),
  run_id: "run-1",
  sequence: 1,
  type,
  data,
  created_at: new Date().toISOString(),
});
describe("runtime event state", () => {
  test("deduplicates replayed events and renders provider deltas", () => {
    const start = event("run.started");
    const state = applyEvent(initialState, start);
    assert.equal(applyEvent(state, start), state);
    assert.equal(
      applyEvent(state, event("message.delta", { text: "Evidence" })).draft,
      "Evidence",
    );
  });
  test("does not turn failures into successful output", () => {
    const result = applyEvent(
      { ...initialState, active: true },
      event("run.failed", { message: "Model unavailable" }),
    );
    assert.equal(result.active, false);
    assert.equal(result.messages.length, 0);
    assert.equal(result.error, "Model unavailable");
  });
  test("rejects executable and unknown generated UI fields", () => {
    assert.throws(() =>
      parseCard({ type: "report", title: "Unsafe", html: "<script>" }),
    );
    assert.throws(() => parseCard({ type: "iframe", title: "Unsafe" }));
    assert.throws(() => parseEvent({ type: "run.started", sequence: "1" }));
  });
});
