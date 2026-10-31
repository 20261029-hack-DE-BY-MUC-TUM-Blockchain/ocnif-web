import assert from "node:assert/strict";
import { test } from "node:test";
import { encodePcm16, parseSpeakerSegments } from "./audio";

test("speaker capture encodes clamped mono little-endian PCM16", () => {
  const encoded = encodePcm16([new Float32Array([-2, -1, 0, 1, 2])]);
  const data = Buffer.from(encoded, "base64");
  assert.deepEqual(
    [0, 2, 4, 6, 8].map((offset) => data.readInt16LE(offset)),
    [-32768, -32768, 0, 32767, 32767],
  );
});
test("speaker identity labels must be anonymous and timestamped", () => {
  assert.deepEqual(
    parseSpeakerSegments([{ start: 0, end: 1, speaker: "speaker_1" }]),
    [{ start: 0, end: 1, speaker: "speaker_1" }],
  );
  assert.throws(() =>
    parseSpeakerSegments([{ start: 0, end: 1, speaker: "Alice" }]),
  );
  assert.throws(() =>
    parseSpeakerSegments([{ start: 2, end: 1, speaker: "speaker_0" }]),
  );
});
