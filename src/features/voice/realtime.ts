import type { Locale, RuntimeEvent } from "@/lib/types/runtime";
import { record } from "@/lib/types/runtime";
import { MAX_SUBMISSION_BYTES, submissionBytes } from "../workspace/submission";

export type VoiceActivity = "listening" | "thinking" | "working" | "speaking";
export type VoiceResponseError =
  | "response_failed"
  | "transcription_failed"
  | "task_failed"
  | "session_failed"
  | null;
export type VoiceResponseState = {
  activity: VoiceActivity;
  assistantTranscript: string;
  responseError: VoiceResponseError;
};
type PendingCall = { callId: string; requestId: string; runId?: string };
type Options = {
  send: (event: Record<string, unknown>) => boolean;
  request: (content: string, id: string) => boolean;
  changed: (state: VoiceResponseState) => void;
  newId?: () => string;
};
const CAPTION_LIMIT = 16_000;
export function voiceSessionUpdate(locale: Locale) {
  return {
    type: "session.update",
    session: {
      type: "realtime",
      output_modalities: ["audio"],
      audio: {
        input: {
          turn_detection: {
            type: "server_vad",
            create_response: true,
            interrupt_response: true,
          },
        },
      },
      instructions: `Speak in ${locale}. You are the voice interface of Ocnif. Answer greetings and ordinary conversation directly with brief spoken audio. For a security task, call ocnif_request with the full user request and evidence. Wait for its real result before answering; do not claim an investigation or payment occurred yourself. Read its result faithfully and briefly. Voice is synthetic AI audio.`,
      tools: [
        {
          type: "function",
          name: "ocnif_request",
          description:
            "Run the user's authorized evidence-review or security-training task in Ocnif and receive its actual result.",
          parameters: {
            type: "object",
            properties: { content: { type: "string" } },
            required: ["content"],
            additionalProperties: false,
          },
        },
      ],
      tool_choice: "auto",
    },
  };
}

// Realtime and workspace events arrive independently. Keep tool continuation tied
// to both the backend request and the provider response that issued the call.
export class VoiceConversation {
  private pending: PendingCall[] = [];
  private seenCalls = new Set<string>();
  private responses = new Set<string>();
  private continuation = false;
  private responseRequested = false;
  private userSpeaking = false;
  private awaitingVadResponse = false;
  private playing = false;
  private caption = "";
  private error: VoiceResponseError = null;
  private disposed = false;
  constructor(private options: Options) {}
  dispose() {
    this.disposed = true;
    this.pending = [];
    this.seenCalls.clear();
    this.responses.clear();
  }
  private notify() {
    if (this.disposed) return;
    this.options.changed({
      activity: this.playing
        ? "speaking"
        : this.pending.length
          ? "working"
          : this.responses.size ||
              this.responseRequested ||
              this.awaitingVadResponse
            ? "thinking"
            : "listening",
      assistantTranscript: this.caption,
      responseError: this.error,
    });
  }
  private send(event: Record<string, unknown>) {
    if (this.disposed) return false;
    if (this.options.send(event)) return true;
    this.error = "session_failed";
    return false;
  }
  private reply(callId: string, output: unknown) {
    if (
      this.send({
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: callId,
          output: JSON.stringify(output),
        },
      })
    )
      this.continuation = true;
  }
  private continueResponse() {
    if (
      !this.continuation ||
      this.responses.size ||
      this.responseRequested ||
      this.pending.length ||
      this.userSpeaking ||
      this.awaitingVadResponse
    )
      return;
    this.continuation = false;
    this.responseRequested = this.send({
      type: "response.create",
      response: { output_modalities: ["audio"] },
    });
  }
  private call(item: Record<string, unknown>) {
    if (item.name !== "ocnif_request" || typeof item.call_id !== "string")
      return;
    if (this.seenCalls.has(item.call_id)) return;
    this.seenCalls.add(item.call_id);
    let submitted: PendingCall | undefined;
    try {
      if (typeof item.arguments !== "string")
        throw new Error("Missing arguments");
      const args = record(JSON.parse(item.arguments));
      if (
        Object.keys(args).some((key) => key !== "content") ||
        typeof args.content !== "string" ||
        !args.content.trim() ||
        submissionBytes(args.content) > MAX_SUBMISSION_BYTES
      )
        throw new Error("Invalid request");
      const requestId = (this.options.newId ?? (() => crypto.randomUUID()))();
      submitted = { callId: item.call_id, requestId };
      this.pending.push(submitted);
      this.error = null;
      if (!this.options.request(args.content, requestId))
        throw new Error("Workspace unavailable");
    } catch {
      this.pending = this.pending.filter((call) => call !== submitted);
      this.error = "task_failed";
      this.reply(item.call_id, {
        status: "not_executed",
        message:
          "The workspace could not accept this request. Check its connection and keep the request within 16,000 UTF-8 bytes. No task was executed.",
      });
    }
  }
  receive(message: Record<string, unknown>) {
    if (this.disposed) return;
    const type = message.type;
    if (type === "input_audio_buffer.speech_started") {
      this.userSpeaking = true;
      this.playing = false;
      this.error = null;
    }
    if (type === "input_audio_buffer.speech_stopped") {
      this.userSpeaking = false;
      this.awaitingVadResponse = true;
    }
    if (type === "response.created") {
      const response = record(message.response);
      if (typeof response.id === "string") this.responses.add(response.id);
      this.responseRequested = false;
      this.awaitingVadResponse = false;
      this.caption = "";
    }
    if (type === "output_audio_buffer.started") this.playing = true;
    if (
      type === "output_audio_buffer.stopped" ||
      type === "output_audio_buffer.cleared"
    )
      this.playing = false;
    if (
      (type === "response.output_audio_transcript.delta" ||
        type === "response.output_text.delta") &&
      typeof message.delta === "string"
    )
      this.caption = (this.caption + message.delta).slice(-CAPTION_LIMIT);
    if (
      type === "response.output_audio_transcript.done" &&
      typeof message.transcript === "string"
    )
      this.caption = message.transcript.slice(-CAPTION_LIMIT);
    if (
      type === "response.output_text.done" &&
      typeof message.text === "string"
    )
      this.caption = message.text.slice(-CAPTION_LIMIT);
    if (type === "response.function_call_arguments.done") this.call(message);
    if (type === "response.output_item.done") {
      const item = record(message.item);
      if (item.type === "function_call") this.call(item);
    }
    if (type === "response.done") {
      const response = record(message.response);
      if (typeof response.id === "string") this.responses.delete(response.id);
      this.responseRequested = false;
      if (response.status === "failed" || response.status === "incomplete") {
        this.error = "response_failed";
        this.playing = false;
      }
      if (response.status === "completed" && Array.isArray(response.output)) {
        const transcripts: string[] = [];
        for (const output of response.output) {
          const item = record(output);
          if (item.type === "function_call") this.call(item);
          if (item.type === "message" && Array.isArray(item.content)) {
            for (const raw of item.content) {
              const content = record(raw);
              if (typeof content.transcript === "string")
                transcripts.push(content.transcript);
              else if (typeof content.text === "string")
                transcripts.push(content.text);
            }
          }
        }
        if (transcripts.length)
          this.caption = transcripts.join("\n").slice(-CAPTION_LIMIT);
      }
    }
    if (type === "conversation.item.input_audio_transcription.failed") {
      this.error = "transcription_failed";
    }
    if (type === "error") {
      this.error = "session_failed";
      this.responseRequested = false;
      this.awaitingVadResponse = false;
      this.userSpeaking = false;
    }
    this.continueResponse();
    this.notify();
  }
  receiveRuntime(event: RuntimeEvent) {
    if (this.disposed) return;
    if (event.type === "run.accepted" || event.type === "run.started") {
      const pending = this.pending.find(
        (call) => call.requestId === event.data.request_id,
      );
      if (pending) pending.runId = event.run_id;
    }
    const publication =
      event.type === "approval.required" && event.data.kind === "public-share";
    if (
      ["message.completed", "run.failed", "run.cancelled", "error"].includes(
        event.type,
      ) ||
      publication
    ) {
      const matches = this.pending.filter(
        (call) =>
          (call.runId && call.runId === event.run_id) ||
          call.requestId === event.data.request_id,
      );
      for (const call of matches) {
        if (event.type === "run.failed" || event.type === "error")
          this.error = "task_failed";
        this.reply(call.callId, { status: event.type, ...event.data });
      }
      this.pending = this.pending.filter((call) => !matches.includes(call));
    }
    this.continueResponse();
    this.notify();
  }
}
