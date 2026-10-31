import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { MarkdownText } from "./MarkdownText";

test("untrusted reports render formatting without executable HTML, remote images or links", () => {
  const output = renderToStaticMarkup(
    <MarkdownText>
      {
        "# Finding\n\n**Evidence**\n\n<script>alert(1)</script>\n\n![tracking](https://evil.example/pixel)\n\n[click](javascript:alert(1))"
      }
    </MarkdownText>,
  );
  assert.match(output, /<h1>Finding<\/h1>/);
  assert.match(output, /<strong>Evidence<\/strong>/);
  assert.doesNotMatch(output, /<script|<img|href=|javascript:/);
});
