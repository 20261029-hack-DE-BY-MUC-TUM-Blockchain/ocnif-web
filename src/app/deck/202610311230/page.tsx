import { Deck } from "@/features/deck/Deck";
export default async function PitchDeck({
  searchParams,
}: {
  searchParams: Promise<{ slide?: string | string[] }>;
}) {
  const { slide } = await searchParams;
  return <Deck initialSlide={typeof slide === "string" ? slide : undefined} />;
}
