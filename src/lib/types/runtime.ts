export type Locale = "en" | "es" | "de" | "fr";
export type Card = {
  type: "finding" | "checklist" | "metric" | "report" | "approval";
  title: string;
  body?: string;
  severity?: "low" | "medium" | "high" | "info";
  items?: string[];
  value?: string;
  approval_id?: string;
};
export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  cards: Card[];
  created_at: string;
};
export type Conversation = { id: string; title: string; created_at: string };
export type RuntimeEvent = {
  id: string;
  run_id: string;
  sequence: number;
  type: string;
  data: Record<string, unknown>;
  created_at: string;
};
export type Capabilities = {
  ai_configured: boolean;
  model: string;
  voice_configured: boolean;
  realtime_model: string;
  transcription_model: string;
  diarization: boolean;
  scope: string;
};
export type User = { id: string; name: string; role: string };

export function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid server response");
  return value as Record<string, unknown>;
}
export function string(value: unknown): string {
  if (typeof value !== "string") throw new Error("Invalid server text");
  return value;
}
export function parseCard(value: unknown): Card {
  const item = record(value);
  const types = ["finding", "checklist", "metric", "report", "approval"];
  if (
    !types.includes(string(item.type)) ||
    Object.keys(item).some(
      (key) =>
        ![
          "type",
          "title",
          "body",
          "severity",
          "items",
          "value",
          "approval_id",
        ].includes(key),
    )
  )
    throw new Error("Unsupported result card");
  const card: Card = {
    type: item.type as Card["type"],
    title: string(item.title),
  };
  for (const key of ["body", "value", "approval_id"] as const)
    if (item[key] !== undefined) card[key] = string(item[key]);
  if (item.severity !== undefined) {
    if (!["low", "medium", "high", "info"].includes(string(item.severity)))
      throw new Error("Invalid severity");
    card.severity = item.severity as Card["severity"];
  }
  if (item.items !== undefined) {
    if (!Array.isArray(item.items) || item.items.length > 100)
      throw new Error("Invalid card items");
    card.items = item.items.map(string);
  }
  return card;
}
export function parseMessage(value: unknown): Message {
  const item = record(value);
  if (item.role !== "user" && item.role !== "assistant")
    throw new Error("Invalid message role");
  if (!Array.isArray(item.cards)) throw new Error("Invalid result cards");
  return {
    id: string(item.id),
    role: item.role,
    content: string(item.content),
    cards: item.cards.map(parseCard),
    created_at: string(item.created_at),
  };
}
export function parseEvent(value: unknown): RuntimeEvent {
  const item = record(value);
  if (typeof item.sequence !== "number" || !Number.isSafeInteger(item.sequence))
    throw new Error("Invalid event sequence");
  return {
    id: string(item.id),
    run_id: string(item.run_id),
    sequence: item.sequence,
    type: string(item.type),
    data: record(item.data),
    created_at: string(item.created_at),
  };
}
export function parseConversation(value: unknown): Conversation {
  const item = record(value);
  return {
    id: string(item.id),
    title: string(item.title),
    created_at: string(item.created_at),
  };
}
export function parseCapabilities(value: unknown): Capabilities {
  const item = record(value);
  for (const key of ["ai_configured", "voice_configured", "diarization"])
    if (typeof item[key] !== "boolean")
      throw new Error("Invalid capability status");
  return {
    ai_configured: item.ai_configured as boolean,
    voice_configured: item.voice_configured as boolean,
    diarization: item.diarization as boolean,
    model: string(item.model),
    realtime_model: string(item.realtime_model),
    transcription_model: string(item.transcription_model),
    scope: string(item.scope),
  };
}
