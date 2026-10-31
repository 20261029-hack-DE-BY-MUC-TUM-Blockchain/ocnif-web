import {
  type Message,
  parseMessage,
  type RuntimeEvent,
} from "@/lib/types/runtime";
export type RunState = {
  events: RuntimeEvent[];
  messages: Message[];
  active: boolean;
  draft: string;
  error: string | null;
  approval: { id: string; title: string; description: string } | null;
};
export const initialState: RunState = {
  events: [],
  messages: [],
  active: false,
  draft: "",
  error: null,
  approval: null,
};
export function applyEvent(state: RunState, event: RuntimeEvent): RunState {
  if (state.events.some((item) => item.id === event.id)) return state;
  const next = { ...state, events: [...state.events, event] };
  if (event.type === "run.started")
    return { ...next, active: true, draft: "", error: null };
  if (event.type === "message.delta" && typeof event.data.text === "string")
    return { ...next, draft: state.draft + event.data.text };
  if (event.type === "message.completed") {
    const message = parseMessage(event.data.message);
    return {
      ...next,
      draft: "",
      messages: [
        ...state.messages.filter((item) => item.id !== message.id),
        message,
      ],
    };
  }
  if (event.type === "approval.required") {
    const { approval_id, title, description } = event.data;
    if (
      typeof approval_id !== "string" ||
      typeof title !== "string" ||
      typeof description !== "string"
    )
      throw new Error("Invalid approval request");
    return { ...next, approval: { id: approval_id, title, description } };
  }
  if (["run.completed", "run.cancelled", "run.failed"].includes(event.type))
    return {
      ...next,
      active: false,
      error:
        event.type === "run.failed"
          ? String(event.data.message || event.data.code || "Run failed")
          : null,
    };
  if (event.type === "approval.resolved") return { ...next, approval: null };
  if (event.type === "error")
    return { ...next, error: String(event.data.message || "Service error") };
  return next;
}
