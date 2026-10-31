import assert from "node:assert/strict";
import { test } from "node:test";
import {
  appendTextEvidence,
  MAX_SUBMISSION_BYTES,
  submissionBytes,
} from "./submission";

test("submission counts the UTF-8 bytes actually sent after trimming", () => {
  assert.equal(submissionBytes(" \n\t"), 0);
  assert.equal(
    submissionBytes(` ${"a".repeat(16_000)}\n`),
    MAX_SUBMISSION_BYTES,
  );
  assert.equal(submissionBytes("a".repeat(16_001)), 16_001);
  assert.equal(submissionBytes("é".repeat(8_000)), 16_000);
  assert.equal(submissionBytes("é".repeat(8_001)), 16_002);
  assert.equal(submissionBytes("🔐".repeat(4_000)), 16_000);
  assert.equal(submissionBytes("🔐".repeat(4_001)), 16_004);
});

test("attachment budget includes the draft, UTF-8 filename and separator", () => {
  const draft = "Review these headers.";
  const filename = "evidéncia.txt";
  const prefix = `${draft}\n\n[${filename}]\n`;
  const budget =
    MAX_SUBMISSION_BYTES - new TextEncoder().encode(prefix).byteLength;
  const exact = appendTextEvidence(draft, filename, "a".repeat(budget));
  assert.equal(submissionBytes(exact), MAX_SUBMISSION_BYTES);
  assert.equal(exact, prefix + "a".repeat(budget));
  assert.throws(
    () => appendTextEvidence(draft, filename, "a".repeat(budget + 1)),
    RangeError,
  );
  assert.throws(
    () => appendTextEvidence(exact, "next.txt", "extra evidence"),
    RangeError,
  );
});
