import { boundedText, koiosRequest } from "@/features/payments/protocol/koios";
import { cardanoKoiosUrl } from "@/lib/config";

const headers = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};
async function handle(
  request: Request,
  context: { params: Promise<{ operation: string }> },
) {
  const provider = cardanoKoiosUrl();
  if (!provider)
    return Response.json(
      { error: "cardano_provider_unavailable" },
      { status: 503, headers },
    );
  const url = new URL(request.url);
  try {
    let body: unknown;
    if (request.method === "POST") {
      if (
        new URL(request.headers.get("origin") || "about:blank").host !==
          request.headers.get("host") ||
        !request.headers.get("content-type")?.startsWith("application/json")
      )
        return Response.json(
          { error: "invalid_provider_request" },
          { status: 403, headers },
        );
      body = JSON.parse(await boundedText(request.body, 10000));
    }
    const { operation } = await context.params;
    const lookup = koiosRequest(operation, request.method, url.search, body);
    const response = await fetch(provider + lookup.path, {
      method: request.method,
      headers: {
        Accept: "application/json",
        ...(lookup.body ? { "Content-Type": "application/json" } : {}),
      },
      body: lookup.body,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(10000),
    });
    const text = await boundedText(response.body, 2000000);
    JSON.parse(text);
    return new Response(text, { status: response.status, headers });
  } catch {
    return Response.json(
      { error: "provider_request_failed" },
      { status: 502, headers },
    );
  }
}
export { handle as GET, handle as POST };
