import { parseMerchant } from "./merchant";

export const MASUMI_SETUP_CODES = [
  "coworker_setup",
  "execution_task",
  "masumi_payment_service",
  "masumi_registration",
  "paid_task",
  "worker_not_attached",
] as const;
export type MasumiSetupCode = (typeof MASUMI_SETUP_CODES)[number];
export type MasumiStatus = {
  integration: "masumi-sokosumi";
  network: "cardano:preprod";
  agentReady: boolean;
  coworkerConfigured: boolean;
  executionOnly: { verified: boolean; taskId: string | null };
  paid: {
    enabled: boolean;
    registrationConfirmed: boolean;
    settlementVerified: boolean;
  };
  setupRequired: MasumiSetupCode[];
  evidence?: { source: "local-worker-receipt"; observedAt: string };
};
export type CardanoStatus = MasumiStatus | { integration: "legacy-x402" };

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid Cardano service status");
  return value as Record<string, unknown>;
}
function boolean(value: unknown): boolean {
  if (typeof value !== "boolean") throw new Error("Invalid readiness flag");
  return value;
}
export function parseCardanoStatus(value: unknown): CardanoStatus {
  const data = record(value);
  if (data.integration === undefined) {
    parseMerchant(data);
    return { integration: "legacy-x402" };
  }
  if (
    data.integration !== "masumi-sokosumi" ||
    data.network !== "cardano:preprod"
  )
    throw new Error("Unexpected Cardano integration");
  const execution = record(data.executionOnly);
  const paid = record(data.paid);
  if (
    execution.taskId !== null &&
    (typeof execution.taskId !== "string" ||
      !/^[a-zA-Z0-9_-]{1,120}$/.test(execution.taskId))
  )
    throw new Error("Invalid completed task identifier");
  if (execution.verified === true && execution.taskId === null)
    throw new Error("Verified execution requires a task receipt");
  if (
    !Array.isArray(data.setupRequired) ||
    data.setupRequired.length > MASUMI_SETUP_CODES.length ||
    data.setupRequired.some((code) => !MASUMI_SETUP_CODES.includes(code))
  )
    throw new Error("Unknown Cardano setup requirement");
  const result: MasumiStatus = {
    integration: "masumi-sokosumi",
    network: "cardano:preprod",
    agentReady: boolean(data.agentReady),
    coworkerConfigured: boolean(data.coworkerConfigured),
    executionOnly: {
      verified: boolean(execution.verified),
      taskId: execution.taskId as string | null,
    },
    paid: {
      enabled: boolean(paid.enabled),
      registrationConfirmed: boolean(paid.registrationConfirmed),
      settlementVerified: boolean(paid.settlementVerified),
    },
    setupRequired: [...new Set(data.setupRequired)] as MasumiSetupCode[],
  };
  if (data.evidence !== undefined) {
    const evidence = record(data.evidence);
    if (
      evidence.source !== "local-worker-receipt" ||
      typeof evidence.observedAt !== "string" ||
      !/^\d{4}-\d{2}-\d{2}T/.test(evidence.observedAt) ||
      !Number.isFinite(Date.parse(evidence.observedAt))
    )
      throw new Error("Invalid receipt observation metadata");
    result.evidence = {
      source: evidence.source,
      observedAt: evidence.observedAt,
    };
  }
  return result;
}
