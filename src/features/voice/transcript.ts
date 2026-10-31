export type TranscriptState = { itemId: string; text: string };
export function advanceTranscript(
  current: TranscriptState,
  event: Record<string, unknown>,
): TranscriptState {
  if (event.type === "input_audio_buffer.speech_started")
    return { itemId: "", text: "" };
  const itemId =
    typeof event.item_id === "string" ? event.item_id : current.itemId;
  if (
    event.type === "conversation.item.input_audio_transcription.delta" &&
    typeof event.delta === "string"
  ) {
    return {
      itemId,
      text: (itemId === current.itemId ? current.text : "") + event.delta,
    };
  }
  if (
    event.type === "conversation.item.input_audio_transcription.completed" &&
    typeof event.transcript === "string"
  ) {
    return { itemId, text: event.transcript };
  }
  return current;
}
