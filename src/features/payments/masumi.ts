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
  workerFresh?: boolean;
  executionOnly: {
    verified: boolean;
    taskId: string | null;
    receiptSHA256?: string;
    workspaceKind?: "personal" | "organization";
    completedAt?: string;
    verifiedAt?: string;
  };
  paid: {
    enabled: boolean;
    registrationConfirmed: boolean;
    settlementVerified: boolean;
  };
  setupRequired: MasumiSetupCode[];
  evidence?: {
    source: "local-worker-receipt";
    observedAt: string;
    verification?: "authenticated-local-worker-attestation";
  };
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
function timestamp(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length <= 40 &&
    /^\d{4}-\d{2}-\d{2}T/.test(value) &&
    Number.isFinite(Date.parse(value))
  );
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
  const hasReceiptMetadata = [
    "receiptSHA256",
    "workspaceKind",
    "completedAt",
    "verifiedAt",
  ].some((key) => execution[key] !== undefined);
  if (
    hasReceiptMetadata &&
    (typeof execution.receiptSHA256 !== "string" ||
      !/^[a-f0-9]{64}$/.test(execution.receiptSHA256) ||
      !["personal", "organization"].includes(String(execution.workspaceKind)) ||
      !timestamp(execution.completedAt) ||
      !timestamp(execution.verifiedAt))
  )
    throw new Error("Invalid execution receipt metadata");
  if (
    execution.verified === true &&
    execution.taskId === null &&
    !hasReceiptMetadata
  )
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
  if (data.workerFresh !== undefined)
    result.workerFresh = boolean(data.workerFresh);
  if (hasReceiptMetadata) {
    result.executionOnly.receiptSHA256 = execution.receiptSHA256 as string;
    result.executionOnly.workspaceKind = execution.workspaceKind as
      | "personal"
      | "organization";
    result.executionOnly.completedAt = execution.completedAt as string;
    result.executionOnly.verifiedAt = execution.verifiedAt as string;
  }
  if (data.evidence !== undefined) {
    const evidence = record(data.evidence);
    if (
      evidence.source !== "local-worker-receipt" ||
      !timestamp(evidence.observedAt) ||
      (evidence.verification !== undefined &&
        evidence.verification !== "authenticated-local-worker-attestation")
    )
      throw new Error("Invalid receipt observation metadata");
    result.evidence = {
      source: evidence.source,
      observedAt: evidence.observedAt,
    };
    if (evidence.verification !== undefined)
      result.evidence.verification = evidence.verification;
  }
  return result;
}
