export function apiBaseUrl(): string | undefined {
  const value = process.env.API_BASE_URL;
  if (!value) return undefined;
  const url = new URL(value);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/"
  )
    throw new Error(
      "API_BASE_URL must be an HTTP origin without credentials or a path",
    );
  return url.origin;
}
export function voiceApiOrigin(): string | undefined {
  const value = process.env.VOICE_API_ORIGIN;
  return value ? new URL(value).origin : undefined;
}

export function cardanoBaseUrl(): string | undefined {
  const value = process.env.CARDANO_BASE_URL;
  if (!value) return undefined;
  const url = new URL(value);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/"
  )
    throw new Error("CARDANO_BASE_URL must be an HTTP origin");
  return url.origin;
}
