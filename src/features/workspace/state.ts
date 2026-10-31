import { isReportId } from "@/lib/types/publication";
import {
  type Message,
  parseMessage,
  type RuntimeEvent,
} from "@/lib/types/runtime";
export type RunState = {
  events: RuntimeEvent[];
  messages: Message[];
  pendingRequestIds: string[];
  active: boolean;
  draft: string;
  error: string | null;
  approval: { id: string; title: string; description: string } | null;
  publishedReportId: string | null;
};
export const initialState: RunState = {
  events: [],
  messages: [],
  pendingRequestIds: [],
  active: false,
  draft: "",
  error: null,
  approval: null,
  publishedReportId: null,
};
const terminalRunEvents = ["run.completed", "run.cancelled", "run.failed"];
function withActivity(state: RunState): RunState {
  const finished = new Set(
    state.events
      .filter((event) => terminalRunEvents.includes(event.type))
      .map((event) => event.run_id),
  );
  const running = state.events.some(
    (event) =>
      ["run.accepted", "run.started"].includes(event.type) &&
      event.run_id !== "" &&
      !finished.has(event.run_id),
  );
  return { ...state, active: running || state.pendingRequestIds.length > 0 };
}
function resolveRequest(state: RunState, event: RuntimeEvent): RunState {
  return {
    ...state,
    pendingRequestIds: state.pendingRequestIds.filter(
      (id) => id !== event.data.request_id,
    ),
  };
}
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
    pendingRequestIds: [...new Set([...state.pendingRequestIds, requestId])],
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
  if (event.type === "run.accepted")
    return withActivity(resolveRequest(next, event));
  if (event.type === "run.started")
    return withActivity({
      ...resolveRequest(next, event),
      draft: "",
      error: null,
    });
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
  if (terminalRunEvents.includes(event.type))
    return withActivity({
      ...resolveRequest(next, event),
      error:
        event.type === "run.failed"
          ? String(event.data.message || event.data.code || "Run failed")
          : null,
    });
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
    return withActivity({
      ...resolveRequest(next, event),
      error: String(event.data.message || "Service error"),
    });
  return next;
}
