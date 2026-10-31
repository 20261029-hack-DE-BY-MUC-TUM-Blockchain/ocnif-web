import {
  deriveGatePolicy,
  type GatePolicy,
  gateAbi,
  gateDeployment,
  gateSubmission,
  matchesGateRuntime,
  nvdRequest,
  reviewedNvdConfig,
  type SignedResponse,
} from "ocnif-bc-api3-client";
import {
  type Address,
  decodeEventLog,
  encodeAbiParameters,
  encodeDeployData,
  encodeFunctionData,
  type Hex,
  keccak256,
  toHex,
} from "viem";
import { publicActionsL2 } from "viem/op-stack";
import { record } from "@/lib/types/runtime";
import type { EvmConnection } from "./evm";
export function policyFor(
  cve: string,
  age: number,
  threshold: number,
): GatePolicy {
  if (
    !/^CVE-\d{4}-\d{4,}$/.test(cve) ||
    !Number.isSafeInteger(age) ||
    age < 1 ||
    age > 3600
  )
    throw new Error("invalid_gate_policy");
  return deriveGatePolicy(nvdRequest(cve), {
    signer: reviewedNvdConfig.expectedSigner as Address,
    maximumAge: age,
    thresholdTenths: threshold,
  });
}
export function evidenceFor(
  body: unknown,
  cve: string,
  policy: GatePolicy,
): SignedResponse {
  const data = record(body);
  const request = record(data.request);
  const params = record(request.parameters);
  const projection = record(request.responseProjection);
  const evidence = record(data.evidence);
  if (
    data.verified !== true ||
    typeof data.requestHash !== "string" ||
    data.requestHash.toLowerCase() !== policy.requestHash.toLowerCase() ||
    data.cveId !== cve ||
    request.operation !== reviewedNvdConfig.operation ||
    params.cveId !== cve ||
    projection.score !== reviewedNvdConfig.scorePointer ||
    Object.keys(params).length !== 1 ||
    Object.keys(projection).length !== 1 ||
    typeof evidence.data !== "string" ||
    evidence.data.length > 65536 ||
    typeof evidence.timestamp !== "string" ||
    typeof evidence.signature !== "string" ||
    !/^0x[0-9a-fA-F]{130}$/.test(evidence.signature) ||
    typeof evidence.airnode !== "string" ||
    evidence.airnode.toLowerCase() !==
      reviewedNvdConfig.expectedSigner.toLowerCase() ||
    typeof evidence.requestHash !== "string" ||
    evidence.requestHash.toLowerCase() !== policy.requestHash.toLowerCase()
  )
    throw new Error("gate_evidence_mismatch");
  return evidence as unknown as SignedResponse;
}
export async function checkWallet(connection: EvmConnection) {
  const [account] = await connection.wallet.getAddresses();
  if (
    account?.toLowerCase() !== connection.address.toLowerCase() ||
    (await connection.wallet.getChainId()) !== 84532
  )
    throw new Error("gate_wallet_changed");
}
export async function checkGate(
  connection: EvmConnection,
  address: Address,
  policy: GatePolicy,
) {
  const code = await connection.publicClient.getCode({ address });
  if (!code || !matchesGateRuntime(code))
    throw new Error("gate_runtime_mismatch");
  const values = await Promise.all(
    [
      "expectedAirnode",
      "expectedRequestHash",
      "maxResponseAge",
      "thresholdTenths",
    ].map((functionName) =>
      connection.publicClient.readContract({
        address,
        abi: gateAbi,
        functionName,
      }),
    ),
  );
  if (
    String(values[0]).toLowerCase() !== policy.signer.toLowerCase() ||
    String(values[1]).toLowerCase() !== policy.requestHash.toLowerCase() ||
    String(values[2]) !== String(policy.maximumAge) ||
    String(values[3]) !== String(policy.thresholdTenths)
  )
    throw new Error("gate_policy_mismatch");
}
export type GateReview = {
  kind: "deploy" | "submit";
  policy: GatePolicy;
  gas: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  createdAt: number;
  estimatedTotalFee?: bigint;
  address?: Address;
  evidence?: SignedResponse;
};
export async function reviewGate(
  connection: EvmConnection,
  policy: GatePolicy,
  address?: Address,
  evidence?: SignedResponse,
): Promise<GateReview> {
  await checkWallet(connection);
  const fees = await connection.publicClient.estimateFeesPerGas();
  let gas: bigint;
  let data: Hex;
  if (address) {
    if (!evidence) throw new Error("gate_evidence_required");
    await checkGate(connection, address, policy);
    const submission = await gateSubmission(evidence, policy);
    data = encodeFunctionData(submission);
    await connection.publicClient.simulateContract({
      ...submission,
      address,
      account: connection.address,
    });
    gas = await connection.publicClient.estimateContractGas({
      ...submission,
      address,
      account: connection.address,
    });
  } else {
    data = encodeDeployData(gateDeployment(policy));
    gas = await connection.publicClient.estimateGas({
      account: connection.address,
      data,
    });
  }
  const estimatedTotalFee = await connection.publicClient
    .extend(publicActionsL2())
    .estimateTotalFee({
      account: connection.address,
      data,
      ...(address ? { to: address } : {}),
    });
  return {
    kind: address ? "submit" : "deploy",
    policy,
    gas: (gas * 110n + 99n) / 100n,
    maxFeePerGas: fees.maxFeePerGas,
    maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
    createdAt: Date.now(),
    estimatedTotalFee,
    address,
    evidence,
  };
}
export async function sendGate(
  connection: EvmConnection,
  review: GateReview,
): Promise<Hex> {
  await checkWallet(connection);
  if (Date.now() - review.createdAt > 120000)
    throw new Error("gate_estimate_expired");
  const fees = {
    gas: review.gas,
    maxFeePerGas: review.maxFeePerGas,
    maxPriorityFeePerGas: review.maxPriorityFeePerGas,
    account: connection.address,
    chain: connection.wallet.chain,
  };
  if (review.kind === "deploy")
    return connection.wallet.deployContract({
      ...gateDeployment(review.policy),
      ...fees,
    });
  if (!review.address || !review.evidence)
    throw new Error("gate_evidence_required");
  await checkGate(connection, review.address, review.policy);
  return connection.wallet.writeContract({
    ...(await gateSubmission(review.evidence, review.policy)),
    address: review.address,
    ...fees,
  });
}
export async function confirmGate(
  connection: EvmConnection,
  review: GateReview,
  hash: Hex,
) {
  const receipt = await connection.publicClient.waitForTransactionReceipt({
    hash,
    confirmations: 1,
    timeout: 90000,
  });
  if (receipt.status !== "success")
    throw new Error("gate_transaction_reverted");
  const address = review.address || receipt.contractAddress;
  if (!address) throw new Error("gate_contract_missing");
  await checkGate(connection, address, review.policy);
  if (review.kind === "deploy")
    return { address, transaction: hash, status: "deployment_confirmed" };
  const decision = receipt.logs
    .filter((log) => log.address.toLowerCase() === address.toLowerCase())
    .flatMap((log) => {
      try {
        const event = decodeEventLog({
          abi: gateAbi,
          data: log.data,
          topics: log.topics,
        });
        return event.eventName === "VulnerabilityDecision" ? [event] : [];
      } catch {
        return [];
      }
    });
  if (decision.length !== 1) throw new Error("gate_decision_event_missing");
  const [score, quarantined, timestamp] = await Promise.all([
    connection.publicClient.readContract({
      address,
      abi: gateAbi,
      functionName: "lastScoreTenths",
      blockNumber: receipt.blockNumber,
    }),
    connection.publicClient.readContract({
      address,
      abi: gateAbi,
      functionName: "quarantined",
      blockNumber: receipt.blockNumber,
    }),
    connection.publicClient.readContract({
      address,
      abi: gateAbi,
      functionName: "lastTimestamp",
      blockNumber: receipt.blockNumber,
    }),
  ]);
  if (!review.evidence) throw new Error("gate_evidence_required");
  const args = record(decision[0].args);
  const evidenceHash = keccak256(
    encodeAbiParameters(
      [{ type: "bytes32" }, { type: "uint256" }, { type: "bytes" }],
      [
        review.policy.requestHash,
        BigInt(review.evidence.timestamp),
        toHex(review.evidence.data),
      ],
    ),
  );
  const expectedQuarantine =
    BigInt(String(score)) >= BigInt(review.policy.thresholdTenths);
  if (
    args.evidenceHash !== evidenceHash ||
    String(args.scoreTenths) !== String(score) ||
    args.quarantined !== quarantined ||
    String(timestamp) !== review.evidence.timestamp ||
    quarantined !== expectedQuarantine
  )
    throw new Error("gate_decision_mismatch");
  return {
    address,
    transaction: hash,
    status: "decision_confirmed",
    scoreTenths: String(score),
    quarantined,
    event: decision[0],
  };
}
