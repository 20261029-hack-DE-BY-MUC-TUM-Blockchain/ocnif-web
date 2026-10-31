import assert from "node:assert/strict";
import { test } from "node:test";
import { playVoiceAudio } from "./playback";

test("blocked autoplay is reported and a later user-initiated retry can succeed", async () => {
  let blocked = true;
  const audio = {
    play: async () => {
      if (blocked)
        throw new DOMException("User interaction required", "NotAllowedError");
    },
  };
  assert.equal(await playVoiceAudio(audio), false);
  blocked = false;
  assert.equal(await playVoiceAudio(audio), true);
});
