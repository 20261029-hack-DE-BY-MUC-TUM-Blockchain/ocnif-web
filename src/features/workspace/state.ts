import { isReportId } from "@/lib/types/publication";
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
  publishedReportId: string | null;
};
export const initialState: RunState = {
  events: [],
  messages: [],
  active: false,
  draft: "",
  error: null,
  approval: null,
  publishedReportId: null,
};
export function applySubmission(
  state: RunState,
  content: string,
  requestId: string,
  createdAt: string,
): RunState {
  // Publication requests have their own approval events, not an agent run.
  if (content.trim() === "/publish") return { ...state, error: null };
  return {
    ...state,
    active: true,
    error: null,
    messages: [
      ...state.messages,
      {
        id: requestId,
        role: "user",
        content: content.trim(),
        cards: [],
        created_at: createdAt,
      },
    ],
  };
}
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
  if (event.type === "approval.resolved") {
    const { approval_id, decision, scope, report_id } = event.data;
    const request = state.events.find(
      (item) =>
        item.type === "approval.required" &&
        item.data.approval_id === approval_id,
    );
    const published =
      decision === "approve" &&
      scope === "public report" &&
      request?.data.kind === "public-share" &&
      request.data.report_id === report_id &&
      isReportId(report_id);
    return {
      ...next,
      approval: state.approval?.id === approval_id ? null : state.approval,
      publishedReportId: published ? report_id : state.publishedReportId,
    };
  }
  if (event.type === "error")
    return { ...next, error: String(event.data.message || "Service error") };
  return next;
}
