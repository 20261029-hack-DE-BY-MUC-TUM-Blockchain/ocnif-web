import assert from "node:assert/strict";
import { test } from "node:test";
import { advanceTranscript } from "./transcript";

test("a new utterance never concatenates the previous transcript", () => {
  const previous = { itemId: "utterance-1", text: "First request." };
  const next = advanceTranscript(previous, {
    type: "conversation.item.input_audio_transcription.delta",
    item_id: "utterance-2",
    delta: "Second",
  });
  assert.equal(next.text, "Second");
  assert.equal(
    advanceTranscript(next, {
      type: "conversation.item.input_audio_transcription.delta",
      item_id: "utterance-2",
      delta: " request.",
    }).text,
    "Second request.",
  );
});
test("speech start clears the completed transcript when item id is absent", () => {
  const reset = advanceTranscript(
    { itemId: "old", text: "Old words" },
    { type: "input_audio_buffer.speech_started" },
  );
  assert.equal(
    advanceTranscript(reset, {
      type: "conversation.item.input_audio_transcription.delta",
      delta: "New words",
    }).text,
    "New words",
  );
});
