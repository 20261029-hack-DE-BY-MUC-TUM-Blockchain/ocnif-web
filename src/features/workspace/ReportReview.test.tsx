import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ReportReview } from "./ReportReview";

test("confirmed publication renders report-specific Cardano and BSV handoffs", () => {
  const html = renderToStaticMarkup(
    <ReportReview
      approval={null}
      publishedReportId="published-report-1"
      control={() => {}}
    />,
  );
  assert.match(html, /Published report identifier/);
  assert.match(html, /published-report-1/);
  assert.match(
    html,
    /href="\/payments\?network=cardano&amp;report=published-report-1"/,
  );
  assert.match(html, /does not create a Masumi task or prove a payment/);
  assert.match(
    html,
    /href="\/payments\?network=bsv&amp;report=published-report-1"/,
  );
});

test("pending publication never renders a paid report handoff", () => {
  const html = renderToStaticMarkup(
    <ReportReview
      approval={{
        id: "approval-1",
        title: "Publish?",
        description: "Review first.",
      }}
      publishedReportId={null}
      control={() => {}}
    />,
  );
  assert.match(html, /Review first/);
  assert.doesNotMatch(html, /\/payments\?/);
});
