import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { Composer } from "./Composer";

test("oversized Unicode draft stays intact while send is disabled with an explanation", () => {
  const draft = "é".repeat(8_001);
  const html = renderToStaticMarkup(
    <Composer
      value={draft}
      setValue={() => {}}
      send={() => {}}
      active={false}
      connected
      stop={() => {}}
    />,
  );
  assert.ok(html.includes(draft));
  assert.match(html, /aria-invalid="true"/);
  assert.match(html, /16002 \/ 16,000 UTF-8 bytes/);
  assert.match(html, /Shorten the text or remove evidence before sending/);
  const sendButton = html.match(
    /<button[^>]*aria-label="Send message"[^>]*>/,
  )?.[0];
  assert.ok(sendButton?.includes('disabled=""'));
  assert.doesNotMatch(html, /maxLength/i);
});
