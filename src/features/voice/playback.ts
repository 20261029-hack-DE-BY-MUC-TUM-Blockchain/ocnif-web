export async function playVoiceAudio(
  audio: Pick<HTMLAudioElement, "play">,
): Promise<boolean> {
  try {
    await audio.play();
    return true;
  } catch {
    return false;
  }
}
