import { Payments } from "@/features/payments/Payments";
import { bsvOverlayUrl, sokosumiPreprodUrl } from "@/lib/config";
import { isReportId } from "@/lib/types/publication";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const reportId = isReportId(query.report) ? query.report : undefined;
  return (
    <Payments
      overlayUrl={bsvOverlayUrl()}
      sokosumiUrl={sokosumiPreprodUrl()}
      initialTab={
        query.network === "cardano"
          ? "cardano"
          : query.network === "bsv"
            ? "bsv"
            : "api3"
      }
      initialReportId={reportId}
    />
  );
}
