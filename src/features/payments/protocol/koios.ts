import { record } from "@/lib/types/runtime";
export function koiosRequest(
  operation: string,
  method: string,
  query: string,
  input?: unknown,
): { path: string; body?: string } {
  if (method === "GET" && operation === "tip" && !query)
    return { path: "/tip" };
  if (
    method === "GET" &&
    operation === "epoch_params" &&
    (!query || query === "?limit=1&order=epoch_no.desc")
  )
    return { path: "/epoch_params?limit=1&order=epoch_no.desc" };
  if (method !== "POST" || operation !== "utxo_info" || query)
    throw new Error("provider_operation_not_allowed");
  const data = record(input);
  if (
    Object.keys(data).some(
      (key) => !["_utxo_refs", "_extended"].includes(key),
    ) ||
    data._extended !== true ||
    !Array.isArray(data._utxo_refs) ||
    data._utxo_refs.length < 1 ||
    data._utxo_refs.length > 100 ||
    data._utxo_refs.some(
      (ref) =>
        typeof ref !== "string" ||
        !/^([a-f0-9]{64})#(0|[1-9][0-9]{0,9})$/.test(ref) ||
        Number(ref.split("#")[1]) > 4294967295,
    )
  )
    throw new Error("invalid_provider_lookup");
  return {
    path: "/utxo_info",
    body: JSON.stringify({ _utxo_refs: data._utxo_refs, _extended: true }),
  };
}
export async function boundedText(
  stream: ReadableStream<Uint8Array> | null,
  limit: number,
): Promise<string> {
  if (!stream) return "";
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) throw new Error("provider_message_too_large");
      chunks.push(value);
    }
  } finally {
    await reader.cancel();
    reader.releaseLock();
  }
  const output = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(output);
}
