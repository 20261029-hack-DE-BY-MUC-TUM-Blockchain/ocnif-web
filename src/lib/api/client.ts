import {
  parseCapabilities,
  parseConversation,
  parseEvent,
  parseMessage,
  record,
  string,
} from "../types/runtime";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
async function request(path: string, options?: RequestInit): Promise<unknown> {
  const response = await fetch(`/api${path}`, {
    credentials: "same-origin",
    cache: "no-store",
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!response.ok)
    throw new ApiError(
      response.status,
      `Service request failed (${response.status})`,
    );
  if (response.status === 204) return null;
  return response.json();
}
export async function demoLogin() {
  const data = record(await request("/auth/demo", { method: "POST" }));
  return parseConversation(data.conversation);
}
export async function session() {
  const data = record(await request("/session"));
  const user = record(data.user);
  return {
    user: {
      id: string(user.id),
      name: string(user.name),
      role: string(user.role),
    },
    capabilities: parseCapabilities(data.capabilities),
  };
}
export async function conversations() {
  const data = record(await request("/conversations"));
  if (!Array.isArray(data.conversations))
    throw new Error("Invalid conversation list");
  return data.conversations.map(parseConversation);
}
export async function createConversation() {
  const data = record(
    await request("/conversations", { method: "POST", body: "{}" }),
  );
  return parseConversation(data.conversation);
}
export async function history(id: string) {
  const data = record(
    await request(`/conversations/${encodeURIComponent(id)}/messages`),
  );
  if (!Array.isArray(data.messages) || !Array.isArray(data.events))
    throw new Error("Invalid conversation history");
  return {
    messages: data.messages.map(parseMessage),
    events: data.events.map(parseEvent),
  };
}
export async function logout() {
  await request("/auth/logout", { method: "POST" });
}
export async function voiceSession(locale: string) {
  const data = record(
    await request("/voice/session", {
      method: "POST",
      body: JSON.stringify({ locale }),
    }),
  );
  return {
    value: string(data.value),
    model: string(data.model),
    transcription_model: string(data.transcription_model),
    calls_url: string(data.calls_url),
  };
}
export function socketUrl(id: string): string {
  const url = new URL("/api/ws", window.location.origin);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.searchParams.set("conversation_id", id);
  return url.href;
}
