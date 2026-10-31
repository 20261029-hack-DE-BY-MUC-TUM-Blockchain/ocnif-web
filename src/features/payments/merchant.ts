export type Merchant = {
  configured: boolean;
  payTo: string | null;
  network: "cardano:preprod";
  amount: string;
};
export function parseMerchant(value: unknown): Merchant {
  if (!value || typeof value !== "object") throw new Error("Invalid merchant");
  const data = value as Record<string, unknown>;
  if (
    typeof data.configured !== "boolean" ||
    data.network !== "cardano:preprod" ||
    typeof data.amount !== "string" ||
    !/^[1-9][0-9]{0,15}$/.test(data.amount)
  )
    throw new Error("Invalid merchant");
  const payTo = data.payTo;
  if (
    payTo !== null &&
    (typeof payTo !== "string" || !/^addr_test1[0-9a-z]{20,200}$/.test(payTo))
  )
    throw new Error("Invalid recipient");
  if (data.configured !== Boolean(payTo))
    throw new Error("Contradictory merchant state");
  return {
    configured: data.configured,
    payTo: payTo as string | null,
    network: "cardano:preprod",
    amount: data.amount,
  };
}
