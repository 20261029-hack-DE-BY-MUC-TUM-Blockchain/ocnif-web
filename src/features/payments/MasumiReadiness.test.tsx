import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { CardanoPanel } from "./CardanoPanel";
import { MasumiReadiness } from "./MasumiReadiness";
import type { MasumiStatus } from "./masumi";

test("task receipt renders separately from unverified payment state", () => {
  const status: MasumiStatus = {
    integration: "masumi-sokosumi",
    network: "cardano:preprod",
    agentReady: true,
    coworkerConfigured: true,
    executionOnly: { verified: true, taskId: "task-1" },
    paid: {
      enabled: false,
      registrationConfirmed: false,
      settlementVerified: false,
    },
    setupRequired: ["masumi_registration", "paid_task"],
    evidence: {
      source: "local-worker-receipt",
      observedAt: "2026-10-31T12:50:00Z",
    },
  };
  const html = renderToStaticMarkup(<MasumiReadiness status={status} />);
  assert.match(html, /Execution-only Task receipt<\/dt><dd>Verified/);
  assert.match(html, /Payment settlement receipt<\/dt><dd>Not verified/);
  assert.match(html, /task-1/);
  assert.match(html, /local-worker-receipt/);
  assert.match(html, /2026-10-31T12:50:00Z/);
});
test("selected Cardano panel has setup navigation and no legacy purchase or signing controls", () => {
  const html = renderToStaticMarkup(
    <CardanoPanel
      sokosumiUrl="https://preprod.sokosumi.com"
      initialReportId="report-1"
    />,
  );
  assert.match(html, /Personal Workspace/);
  assert.match(html, /href="https:\/\/preprod.sokosumi.com"/);
  assert.match(html, /report-1/);
  assert.match(html, /does not submit, purchase or unlock a report/);
  assert.doesNotMatch(
    html,
    /Connect Cardano wallet|Request payment terms|sign in wallet|Eternl/,
  );
});
