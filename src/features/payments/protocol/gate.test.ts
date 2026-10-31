import assert from "node:assert/strict";
import { test } from "node:test";
import { nvdRequest, reviewedNvdConfig } from "ocnif-bc-api3-client";
import { evidenceFor, policyFor } from "./gate";

test("gate policy derives the reviewed CVE hash and rejects changed paid intent", () => {
  const policy = policyFor("CVE-2021-44228", 600, 70);
  assert.equal(
    policy.requestHash,
    "0xfb1cc071e090e6151b4cac7ea2319bf836b6abc2b22a1ac98ba3b4deb9b4bf1e",
  );
  assert.equal(policy.signer, reviewedNvdConfig.expectedSigner);
  const body = {
    verified: true,
    cveId: "CVE-2021-44228",
    request: nvdRequest("CVE-2021-44228"),
    requestHash: policy.requestHash,
    evidence: {
      airnode: policy.signer,
      requestHash: policy.requestHash,
      data: '{"score":9.8}',
      timestamp: "1",
      signature: `0x${"1".repeat(130)}`,
    },
  };
  assert.equal(
    evidenceFor(body, "CVE-2021-44228", policy).data,
    '{"score":9.8}',
  );
  assert.throws(() =>
    evidenceFor({ ...body, cveId: "CVE-2022-12345" }, "CVE-2021-44228", policy),
  );
  assert.throws(() =>
    evidenceFor(
      {
        ...body,
        evidence: { ...body.evidence, airnode: `0x${"2".repeat(40)}` },
      },
      "CVE-2021-44228",
      policy,
    ),
  );
  assert.throws(() => policyFor("CVE-2021-44228", 600, 101));
});
