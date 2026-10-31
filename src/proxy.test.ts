import assert from "node:assert/strict";
import { test } from "node:test";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";

function responseFor(origin: string | undefined) {
  const previous = process.env.PUBLIC_APP_ORIGIN;
  if (origin === undefined) delete process.env.PUBLIC_APP_ORIGIN;
  else process.env.PUBLIC_APP_ORIGIN = origin;
  try {
    return proxy(
      new NextRequest("http://0.0.0.0:3000/workspace", {
        headers: {
          host: "untrusted.example",
          "x-forwarded-host": "untrusted.example",
          "x-forwarded-proto": "http",
        },
      }),
    );
  } finally {
    if (previous === undefined) delete process.env.PUBLIC_APP_ORIGIN;
    else process.env.PUBLIC_APP_ORIGIN = previous;
  }
}

test("public HTTPS origin controls WebSocket and reporting URLs behind a proxy", () => {
  const response = responseFor("https://app.example.com");
  const policy = response.headers.get("Content-Security-Policy") ?? "";
  assert.ok(policy.includes("connect-src 'self' wss://app.example.com"));
  assert.ok(!policy.includes("0.0.0.0"));
  assert.ok(!policy.includes("untrusted.example"));
  assert.match(policy, /script-src 'self' 'nonce-[^']+' 'strict-dynamic'/);
  assert.equal(
    response.headers.get("Reporting-Endpoints"),
    'csp="https://app.example.com/csp-report"',
  );
});

test("configured local HTTP origin preserves its WebSocket port", () => {
  const response = responseFor("http://localhost:3000");
  assert.ok(
    response.headers
      .get("Content-Security-Policy")
      ?.includes("connect-src 'self' ws://localhost:3000"),
  );
  assert.equal(
    response.headers.get("Reporting-Endpoints"),
    'csp="http://localhost:3000/csp-report"',
  );
});

test("missing public origin never exposes internal or forwarded hosts", () => {
  const response = responseFor(undefined);
  const policy = response.headers.get("Content-Security-Policy") ?? "";
  assert.ok(policy.includes("connect-src 'self'"));
  assert.ok(!policy.includes("0.0.0.0"));
  assert.ok(!policy.includes("untrusted.example"));
  assert.ok(policy.includes("report-uri /csp-report"));
  assert.equal(response.headers.get("Reporting-Endpoints"), null);
});

test("public origin rejects credentials, non-HTTP schemes and URL suffixes", () => {
  for (const invalid of [
    "https://user:password@app.example.com",
    "wss://app.example.com",
    "https://app.example.com/workspace",
    "https://app.example.com/?host=untrusted.example",
    "https://app.example.com/#fragment",
  ]) {
    assert.throws(() => responseFor(invalid), /PUBLIC_APP_ORIGIN/);
  }
});
