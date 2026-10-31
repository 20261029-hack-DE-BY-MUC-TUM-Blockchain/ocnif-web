export function publicAppOrigin(): string | undefined {
  const value = process.env.PUBLIC_APP_ORIGIN;
  if (!value) return undefined;
  const url = new URL(value);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw new Error(
      "PUBLIC_APP_ORIGIN must be an HTTP origin without credentials, path, query or fragment",
    );
  return url.origin;
}

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

export function sokosumiPreprodUrl(): string | undefined {
  const value = process.env.SOKOSUMI_PREPROD_URL;
  if (!value) return undefined;
  const url = new URL(value);
  if (
    url.origin !== "https://preprod.sokosumi.com" ||
    url.pathname !== "/" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw new Error("SOKOSUMI_PREPROD_URL must be the official Preprod origin");
  return url.origin;
}

export function walletConnectOrigins(): string[] {
  const raw = process.env.WALLET_CONNECT_ORIGINS;
  if (!raw) return [];
  return raw.split(",").map((item) => {
    const url = new URL(item.trim());
    if (
      !["http:", "https:"].includes(url.protocol) ||
      !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    )
      throw new Error(
        "WALLET_CONNECT_ORIGINS must contain explicit loopback origins",
      );
    return url.origin;
  });
}

export function bsvOverlayUrl(): string | undefined {
  const value = process.env.BSV_OVERLAY_URL;
  if (!value) return undefined;
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw new Error("BSV_OVERLAY_URL must be a public HTTPS service URL");
  return url.href.replace(/\/$/, "");
}
export function cardanoKoiosUrl(): string | undefined {
  const value = process.env.CARDANO_KOIOS_URL;
  if (!value) return undefined;
  const url = new URL(value);
  if (
    url.origin !== "https://preprod.koios.rest" ||
    url.pathname.replace(/\/$/, "") !== "/api/v1" ||
    url.search ||
    url.hash ||
    url.username ||
    url.password
  )
    throw new Error(
      "CARDANO_KOIOS_URL must be the official Preprod Koios API endpoint",
    );
  return "https://preprod.koios.rest/api/v1";
}
