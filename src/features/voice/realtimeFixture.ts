import type { RuntimeEvent } from "@/lib/types/runtime";
import { VoiceConversation, type VoiceResponseState } from "./realtime";

export function runtime(
  type: string,
  data: Record<string, unknown>,
  run_id = "run-1",
): RuntimeEvent {
  return {
    id: "event",
    sequence: 1,
    created_at: "2026-10-31T00:00:00Z",
    type,
    data,
    run_id,
  };
}
export function fixture(
  accept: (content: string, id: string) => boolean = () => true,
) {
  const sent: Record<string, unknown>[] = [];
  const requests: { content: string; id: string }[] = [];
  let state: VoiceResponseState = {
    activity: "listening",
    assistantTranscript: "",
    responseError: null,
  };
  const voice = new VoiceConversation({
    send: (message) => {
      sent.push(message);
      return true;
    },
    request: (content, id) => {
      requests.push({ content, id });
      return accept(content, id);
    },
    changed: (next) => {
      state = next;
    },
    newId: () => `request-${requests.length + 1}`,
  });
  const created = (id = "response-1") =>
    voice.receive({ type: "response.created", response: { id } });
  const done = (
    id = "response-1",
    status = "completed",
    output: unknown[] = [],
  ) =>
    voice.receive({ type: "response.done", response: { id, status, output } });
  const call = (callId = "call-1", content = "Review the supplied headers.") =>
    voice.receive({
      type: "response.function_call_arguments.done",
      name: "ocnif_request",
      call_id: callId,
      arguments: JSON.stringify({ content }),
    });
  const continuations = () =>
    sent.filter((event) => event.type === "response.create");
  return {
    voice,
    sent,
    requests,
    created,
    done,
    call,
    continuations,
    state: () => state,
  };
}
