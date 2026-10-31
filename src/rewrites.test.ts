import assert from "node:assert/strict";
import { test } from "node:test";
import nextConfig from "../next.config";

async function bsvRewrites(origin: string | undefined) {
  const previous = process.env.BSV_BASE_URL;
  if (origin === undefined) delete process.env.BSV_BASE_URL;
  else process.env.BSV_BASE_URL = origin;
  try {
    const routes = await nextConfig.rewrites?.();
    assert.ok(Array.isArray(routes));
    return routes.filter((route) =>
      ["/bsv/:path*", "/arc-ingest"].includes(route.source),
    );
  } finally {
    if (previous === undefined) delete process.env.BSV_BASE_URL;
    else process.env.BSV_BASE_URL = previous;
  }
}

test("BSV browser paths strip only their prefix while ARC keeps its root callback", async () => {
  assert.deepEqual(await bsvRewrites("http://bsv.internal:8097"), [
    { source: "/bsv/:path*", destination: "http://bsv.internal:8097/:path*" },
    {
      source: "/arc-ingest",
      destination: "http://bsv.internal:8097/arc-ingest",
    },
  ]);
  assert.deepEqual(await bsvRewrites(undefined), []);
});

test("BSV upstream rejects credentials, arbitrary paths and query parameters", async () => {
  for (const invalid of [
    "http://secret@bsv.internal",
    "https://bsv.internal/redirect",
    "https://bsv.internal/?target=elsewhere",
    "https://bsv.internal/#fragment",
    "file:///tmp/server",
  ]) {
    await assert.rejects(() => bsvRewrites(invalid), /BSV_BASE_URL/);
  }
});
