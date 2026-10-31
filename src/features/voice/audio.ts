export type SpeakerSegment = { start: number; end: number; speaker: string };
export function encodePcm16(chunks: Float32Array[]): string {
  const count = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const bytes = new Uint8Array(count * 2);
  const view = new DataView(bytes.buffer);
  let offset = 0;
  for (const chunk of chunks)
    for (const sample of chunk) {
      const clamped = Math.max(-1, Math.min(1, sample));
      view.setInt16(
        offset,
        clamped < 0 ? clamped * 32768 : clamped * 32767,
        true,
      );
      offset += 2;
    }
  let binary = "";
  for (let index = 0; index < bytes.length; index += 8192)
    binary += String.fromCharCode(...bytes.subarray(index, index + 8192));
  return btoa(binary);
}
export function parseSpeakerSegments(value: unknown): SpeakerSegment[] {
  if (!Array.isArray(value)) throw new Error("Invalid speaker segments");
  return value.map((item) => {
    if (
      !item ||
      typeof item !== "object" ||
      typeof item.start !== "number" ||
      typeof item.end !== "number" ||
      !Number.isFinite(item.start) ||
      !Number.isFinite(item.end) ||
      item.start < 0 ||
      item.end <= item.start ||
      typeof item.speaker !== "string" ||
      !/^speaker_[0-7]$/.test(item.speaker)
    )
      throw new Error("Invalid anonymous speaker segment");
    return { start: item.start, end: item.end, speaker: item.speaker };
  });
}
