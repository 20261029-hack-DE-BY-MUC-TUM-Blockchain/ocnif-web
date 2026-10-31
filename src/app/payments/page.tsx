import { Payments } from "@/features/payments/Payments";
import { bsvOverlayUrl, cardanoKoiosUrl } from "@/lib/config";
export default function Page() {
  return <Payments overlayUrl={bsvOverlayUrl()} koiosUrl={cardanoKoiosUrl()} />;
}
