import assert from "node:assert/strict";
import { test } from "node:test";
import { type VoiceConversation, voiceSessionUpdate } from "./realtime";
import { fixture, runtime } from "./realtimeFixture";

test("a greeting uses automatic VAD audio and never creates a duplicate response on transcription", () => {
  const config = voiceSessionUpdate("es").session;
  assert.deepEqual(config.output_modalities, ["audio"]);
  assert.equal(config.audio.input.turn_detection.create_response, true);
  assert.equal(config.audio.input.turn_detection.interrupt_response, true);
  const f = fixture();
  f.voice.receive({ type: "input_audio_buffer.speech_started" });
  f.voice.receive({ type: "input_audio_buffer.speech_stopped" });
  f.voice.receive({
    type: "conversation.item.input_audio_transcription.completed",
    transcript: "Hi",
  });
  f.created();
  f.voice.receive({
    type: "response.output_audio_transcript.delta",
    delta: "Hello.",
  });
  f.voice.receive({ type: "output_audio_buffer.started" });
  assert.equal(f.state().activity, "speaking");
  f.done();
  f.voice.receive({ type: "output_audio_buffer.stopped" });
  assert.equal(f.state().assistantTranscript, "Hello.");
  assert.equal(f.state().activity, "listening");
  assert.equal(f.continuations().length, 0);
  assert.equal(f.requests.length, 0);
});

test("a backend request ID binds the actual report to its voice function call", () => {
  const f = fixture();
  f.created();
  f.call();
  f.done();
  f.voice.receiveRuntime(
    runtime("run.started", { request_id: "different-request" }, "other-run"),
  );
  f.voice.receiveRuntime(
    runtime(
      "message.completed",
      { message: { content: "Unrelated" } },
      "other-run",
    ),
  );
  assert.equal(f.continuations().length, 0);
  assert.equal(f.state().activity, "working");
  f.voice.receiveRuntime(
    runtime("run.started", {
      request_id: f.requests[0].id,
      model: "configured-model",
    }),
  );
  f.voice.receiveRuntime(
    runtime("message.completed", {
      message: { content: "The supplied evidence has no CSP header." },
    }),
  );
  const output = f.sent.find(
    (event) => event.type === "conversation.item.create",
  );
  assert.equal((output?.item as Record<string, unknown>).call_id, "call-1");
  assert.match(
    String((output?.item as Record<string, unknown>).output),
    /no CSP header/,
  );
  assert.deepEqual(f.continuations(), [
    { type: "response.create", response: { output_modalities: ["audio"] } },
  ]);
});

test("a fast completed task waits for response.done before asking the model to speak", () => {
  const f = fixture();
  f.created();
  f.call();
  f.voice.receiveRuntime(runtime("run.accepted", { request_id: "request-1" }));
  f.voice.receiveRuntime(
    runtime("message.completed", {
      message: { content: "Actual tool output" },
    }),
  );
  assert.equal(
    f.sent.filter((event) => event.type === "conversation.item.create").length,
    1,
  );
  assert.equal(f.continuations().length, 0);
  f.done();
  assert.equal(f.continuations().length, 1);
});

test("argument, output-item and response events execute one call exactly once", () => {
  const f = fixture();
  const call = {
    type: "function_call",
    name: "ocnif_request",
    call_id: "call-1",
    arguments: JSON.stringify({ content: "Review evidence" }),
  };
  f.created();
  f.voice.receive({ ...call, type: "response.function_call_arguments.done" });
  f.voice.receive({ type: "response.output_item.done", item: call });
  f.done("response-1", "completed", [call]);
  assert.equal(f.requests.length, 1);
});

test("a function call present only in the final response is still dispatched", () => {
  const f = fixture();
  f.created();
  f.done("response-1", "completed", [
    {
      type: "function_call",
      name: "ocnif_request",
      call_id: "call-final",
      arguments: '{"content":"Review evidence"}',
    },
  ]);
  assert.equal(f.requests.length, 1);
});

test("acceptance before core startup lets a cancelled task return without hanging", () => {
  const f = fixture();
  f.created();
  f.call();
  f.done();
  f.voice.receiveRuntime(runtime("run.accepted", { request_id: "request-1" }));
  f.voice.receiveRuntime(
    runtime("run.cancelled", { message: "Cancelled by user" }),
  );
  assert.equal(f.continuations().length, 1);
  assert.match(JSON.stringify(f.sent), /run.cancelled/);
  assert.equal(f.state().activity, "thinking");
});

test("steering waits for the replacement task instead of speaking the old cancellation", () => {
  const f = fixture();
  f.created();
  f.call();
  f.done();
  f.voice.receiveRuntime(runtime("run.accepted", { request_id: "request-1" }));
  f.created("response-2");
  f.call("call-2", "Use the corrected evidence");
  f.done("response-2");
  f.voice.receiveRuntime(runtime("run.cancelled", { message: "Cancelled" }));
  assert.equal(f.continuations().length, 0);
  f.voice.receiveRuntime(
    runtime("run.accepted", { request_id: "request-2" }, "run-2"),
  );
  f.voice.receiveRuntime(
    runtime(
      "message.completed",
      { message: { content: "Corrected result" } },
      "run-2",
    ),
  );
  assert.equal(f.continuations().length, 1);
  assert.equal(
    f.sent.filter((event) => event.type === "conversation.item.create").length,
    2,
  );
});

test("workspace rejection and pre-start runtime failure resolve their exact request", () => {
  for (const type of ["error", "run.failed"]) {
    const f = fixture();
    f.created();
    f.call();
    f.done();
    f.voice.receiveRuntime(
      runtime(type, { request_id: "request-1", message: "Unavailable" }, ""),
    );
    assert.equal(f.continuations().length, 1);
    assert.equal(f.state().responseError, "task_failed");
  }
});

test("synchronous acceptance cannot race pending-call registration", () => {
  let voice: VoiceConversation;
  const f = fixture((_content, id) => {
    voice.receiveRuntime(runtime("run.accepted", { request_id: id }));
    return true;
  });
  voice = f.voice;
  f.created();
  f.call();
  f.done();
  f.voice.receiveRuntime(
    runtime("message.completed", { message: { content: "Result" } }),
  );
  assert.equal(f.continuations().length, 1);
});
