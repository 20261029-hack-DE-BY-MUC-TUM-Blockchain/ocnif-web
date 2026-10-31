export const MAX_SUBMISSION_BYTES = 16_000;

export function submissionBytes(content: string): number {
  return new TextEncoder().encode(content.trim()).byteLength;
}

export function appendTextEvidence(
  draft: string,
  filename: string,
  content: string,
): string {
  const combined = `${draft}\n\n[${filename}]\n${content}`;
  if (submissionBytes(combined) > MAX_SUBMISSION_BYTES)
    throw new RangeError("Combined evidence exceeds the submission byte limit");
  return combined;
}
