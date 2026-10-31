import assert from "node:assert/strict";
import { test } from "node:test";
import { fixture, runtime } from "./realtimeFixture";

test("invalid UTF-8 size and extra tool fields never reach the workspace", () => {
  const f = fixture();
  f.created();
  f.call("large", "😀".repeat(4001));
  f.voice.receive({
    type: "response.function_call_arguments.done",
    name: "ocnif_request",
    call_id: "extra",
    arguments: '{"content":"Review","execute":true}',
  });
  f.done();
  assert.equal(f.requests.length, 0);
  assert.equal(f.state().responseError, "task_failed");
  assert.match(JSON.stringify(f.sent), /not_executed/);
});

test("a workspace send failure clears the pending call and is spoken truthfully", () => {
  for (const accept of [
    () => false,
    () => {
      throw new Error("Closed");
    },
  ]) {
    const f = fixture(accept);
    f.created();
    f.call();
    f.done();
    assert.equal(f.continuations().length, 1);
    assert.equal(f.state().responseError, "task_failed");
  }
});

test("tool continuation does not race a new automatic voice turn", () => {
  const f = fixture();
  f.created();
  f.call();
  f.done();
  f.voice.receiveRuntime(runtime("run.accepted", { request_id: "request-1" }));
  f.voice.receive({ type: "input_audio_buffer.speech_started" });
  f.voice.receive({ type: "input_audio_buffer.speech_stopped" });
  f.voice.receiveRuntime(
    runtime("message.completed", { message: { content: "Result" } }),
  );
  assert.equal(f.continuations().length, 0);
  f.created("response-2");
  f.done("response-2");
  assert.equal(f.continuations().length, 1);
});

test("provider failures and transcription failures are visible; normal interruption is not an error", () => {
  const f = fixture();
  f.created();
  f.done("response-1", "cancelled");
  assert.equal(f.state().responseError, null);
  f.created("response-2");
  f.done("response-2", "failed");
  assert.equal(f.state().responseError, "response_failed");
  f.voice.receive({
    type: "conversation.item.input_audio_transcription.failed",
  });
  assert.equal(f.state().responseError, "transcription_failed");
  f.voice.receive({ type: "error", error: { code: "invalid_request" } });
  assert.equal(f.state().responseError, "session_failed");
});

test("the final response supplies the assistant caption even without delta events", () => {
  const f = fixture();
  f.created();
  f.done("response-1", "completed", [
    {
      type: "message",
      content: [{ type: "output_audio", transcript: "Hello, how can I help?" }],
    },
  ]);
  assert.equal(f.state().assistantTranscript, "Hello, how can I help?");
});

test("publication returns an approval requirement without claiming a payment or executing it", () => {
  const f = fixture();
  f.created();
  f.call("publish", "/publish");
  f.done();
  f.voice.receiveRuntime(
    runtime(
      "approval.required",
      {
        kind: "public-share",
        request_id: "request-1",
        title: "Review before publication",
      },
      "",
    ),
  );
  assert.equal(f.continuations().length, 1);
  assert.match(JSON.stringify(f.sent), /approval.required/);
});

test("a disposed session ignores late provider and workspace events", () => {
  const f = fixture();
  f.created();
  f.call();
  f.done();
  f.voice.dispose();
  f.voice.receiveRuntime(runtime("run.failed", { request_id: "request-1" }));
  f.call("late-call");
  assert.equal(f.requests.length, 1);
  assert.equal(f.sent.length, 0);
});

test("a provider error before response.created releases the VAD wait without retrying the utterance", () => {
  const f = fixture();
  f.created();
  f.call();
  f.done();
  f.voice.receiveRuntime(runtime("run.accepted", { request_id: "request-1" }));
  f.voice.receive({ type: "input_audio_buffer.speech_started" });
  f.voice.receive({ type: "input_audio_buffer.speech_stopped" });
  f.voice.receive({ type: "error", error: { code: "invalid_request" } });
  assert.equal(f.state().responseError, "session_failed");
  assert.equal(f.state().activity, "working");
  assert.equal(f.continuations().length, 0);
  f.voice.receiveRuntime(
    runtime("message.completed", {
      message: { content: "Actual completed task" },
    }),
  );
  assert.equal(f.continuations().length, 1);
  const greeting = fixture();
  greeting.voice.receive({ type: "input_audio_buffer.speech_stopped" });
  greeting.voice.receive({ type: "error", error: { code: "invalid_request" } });
  assert.equal(greeting.state().activity, "listening");
  assert.equal(greeting.continuations().length, 0);
});
