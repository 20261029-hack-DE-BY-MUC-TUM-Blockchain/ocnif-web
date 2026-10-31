export function isReportId(value: unknown): value is string {
  return typeof value === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(value);
}

export function publishedReportPath(
  reportId: string,
  network: "cardano" | "bsv" = "cardano",
): string {
  if (!isReportId(reportId))
    throw new Error("Invalid published report identifier");
  return `/payments?network=${network}&report=${encodeURIComponent(reportId)}`;
}
