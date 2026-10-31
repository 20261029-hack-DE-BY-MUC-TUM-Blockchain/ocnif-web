import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { DetailsToggle, WorkspaceDetails } from "./WorkspaceDetails";

test("details toggle stays a direct accessible control with matching expanded state", () => {
  for (const open of [false, true]) {
    const html = renderToStaticMarkup(
      <DetailsToggle open={open} onClick={() => {}} />,
    );
    assert.ok(html.startsWith("<button"));
    assert.ok(html.includes(`aria-expanded="${open}"`));
    assert.match(html, /aria-controls="workspace-details"/);
    assert.ok(
      html.includes(open ? "Hide workspace details" : "Show workspace details"),
    );
  }
});

test("details sidebar provides its own close control before scrollable content", () => {
  const html = renderToStaticMarkup(
    <WorkspaceDetails onClose={() => {}}>
      <p>Synthetic activity content</p>
    </WorkspaceDetails>,
  );
  assert.match(html, /<aside[^>]*id="workspace-details"/);
  assert.match(
    html,
    /aria-labelledby="workspace-details-heading" tabindex="-1"/,
  );
  assert.match(
    html,
    /<h2 id="workspace-details-heading">Workspace details<\/h2>/,
  );
  assert.ok(
    html.indexOf('aria-label="Hide workspace details"') <
      html.indexOf("Synthetic activity content"),
  );
});
