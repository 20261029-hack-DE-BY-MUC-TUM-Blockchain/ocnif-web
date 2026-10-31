import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { isReportId, publishedReportPath } from "@/lib/types/publication";
import { parseCard, parseEvent } from "@/lib/types/runtime";
import { applyEvent, applySubmission, initialState } from "./state";

const event = (type: string, data = {}) => ({
  id: crypto.randomUUID(),
  run_id: "run-1",
  sequence: 1,
  type,
  data,
  created_at: new Date().toISOString(),
});
describe("runtime event state", () => {
  test("deduplicates replayed events and renders provider deltas", () => {
    const start = event("run.started");
    const state = applyEvent(initialState, start);
    assert.equal(applyEvent(state, start), state);
    assert.equal(
      applyEvent(state, event("message.delta", { text: "Evidence" })).draft,
      "Evidence",
    );
  });
  test("does not turn failures into successful output", () => {
    const result = applyEvent(
      { ...initialState, active: true },
      event("run.failed", { message: "Model unavailable" }),
    );
    assert.equal(result.active, false);
    assert.equal(result.messages.length, 0);
    assert.equal(result.error, "Model unavailable");
  });
  test("rejects executable and unknown generated UI fields", () => {
    assert.throws(() =>
      parseCard({ type: "report", title: "Unsafe", html: "<script>" }),
    );
    assert.throws(() => parseCard({ type: "iframe", title: "Unsafe" }));
    assert.throws(() => parseEvent({ type: "run.started", sequence: "1" }));
  });
  test("publication approval or rejection never creates a busy agent run", () => {
    for (const decision of ["approve", "reject"]) {
      const submitted = applySubmission(
        initialState,
        " /publish ",
        "request",
        "now",
      );
      assert.equal(submitted.active, false);
      assert.equal(submitted.messages.length, 0);
      const required = applyEvent(
        submitted,
        event("approval.required", {
          approval_id: "publish-1",
          kind: "public-share",
          report_id: "report-1",
          title: "Publish?",
          description: "Review public disclosure.",
        }),
      );
      const resolved = applyEvent(
        required,
        event("approval.resolved", {
          approval_id: "publish-1",
          decision,
          scope: "public report",
          report_id: "report-1",
        }),
      );
      assert.equal(resolved.active, false);
      assert.equal(resolved.approval, null);
      assert.equal(
        resolved.publishedReportId,
        decision === "approve" ? "report-1" : null,
      );
      assert.equal(
        applyEvent(resolved, event("error", { message: "Already reviewed" }))
          .active,
        false,
      );
    }
  });
  test("publication decisions preserve a live assessment until its cancellation", () => {
    const running = applyEvent(initialState, event("run.started"));
    const submitted = applySubmission(running, "/publish", "request", "now");
    const pending = applyEvent(
      submitted,
      event("approval.required", {
        approval_id: "publish-2",
        kind: "public-share",
        report_id: "report-2",
        title: "Publish?",
        description: "Review public disclosure.",
      }),
    );
    const unrelated = applyEvent(
      pending,
      event("approval.resolved", {
        approval_id: "older-review",
        decision: "approve",
        scope: "workspace report only",
      }),
    );
    assert.equal(unrelated.approval?.id, "publish-2");
    const rejected = applyEvent(
      unrelated,
      event("approval.resolved", {
        approval_id: "publish-2",
        decision: "reject",
        scope: "public report",
        report_id: "report-2",
      }),
    );
    assert.equal(rejected.active, true);
    assert.equal(rejected.approval, null);
    const cancelled = applyEvent(rejected, event("run.cancelled"));
    assert.equal(cancelled.active, false);
    assert.equal(
      applySubmission(cancelled, "Continue assessment", "request-2", "now")
        .active,
      true,
    );
  });
  test("only the approved report can form the Cardano handoff", () => {
    const pending = applyEvent(
      initialState,
      event("approval.required", {
        approval_id: "publish-3",
        kind: "public-share",
        report_id: "report-3",
        title: "Publish?",
        description: "Review public disclosure.",
      }),
    );
    for (const reportId of [
      "other-report",
      "../private",
      "https://example.com",
    ]) {
      const resolved = applyEvent(
        pending,
        event("approval.resolved", {
          approval_id: "publish-3",
          decision: "approve",
          scope: "public report",
          report_id: reportId,
        }),
      );
      assert.equal(resolved.publishedReportId, null);
    }
    assert.equal(
      publishedReportPath("report-3"),
      "/payments?network=cardano&report=report-3",
    );
    assert.equal(isReportId(["report-3"]), false);
    assert.throws(() => publishedReportPath("../private"));
  });
});
