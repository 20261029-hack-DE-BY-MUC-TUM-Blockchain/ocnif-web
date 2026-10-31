import type { DeckCopy } from "@/lib/i18n/deck";

export type DeckMedia = {
  src: string;
  preview?: string;
  caption: string;
  diagram?: boolean;
};
export type DeckCard = { title: string; body: string };
export type DeckSlide = {
  id: string;
  section: string;
  title: string;
  body: string;
  media?: DeckMedia;
  cards?: DeckCard[];
  note?: string;
  status?: string;
  closing?: boolean;
};
const asset = (name: string) => `/deck/20261031/${name}`;
export function deckSlides(t: DeckCopy): DeckSlide[] {
  return [
    {
      id: "product",
      section: t.live,
      title: t.heroTitle,
      body: t.heroBody,
      media: { src: asset("workspace.png"), caption: t.heroCaption },
      note: `${t.heroPoint1} · ${t.heroPoint2} · ${t.heroPoint3}`,
    },
    {
      id: "problem",
      section: "OCNIF",
      title: t.problemTitle,
      body: t.problemBody,
      cards: [
        { title: t.problem1Title, body: t.problem1Body },
        { title: t.problem2Title, body: t.problem2Body },
        { title: t.problem3Title, body: t.problem3Body },
      ],
    },
    {
      id: "user-workflow",
      section: t.workflow,
      title: t.workflowTitle,
      body: t.workflowBody,
      media: {
        src: asset("overview-workflow.svg"),
        caption: t.workflowCaption,
        diagram: true,
      },
      note: t.workflowNote,
    },
    {
      id: "assessment",
      section: t.capture,
      title: t.assessmentTitle,
      body: t.assessmentBody,
      media: {
        src: asset("workspace.png"),
        preview: asset("assessment-workflow.gif"),
        caption: t.assessmentCaption,
      },
      note: t.assessmentNote,
    },
    {
      id: "architecture",
      section: t.architecture,
      title: t.architectureTitle,
      body: t.architectureBody,
      media: {
        src: asset("overview-architecture.svg"),
        caption: t.architectureCaption,
        diagram: true,
      },
      note: t.architectureNote,
    },
    {
      id: "report",
      section: t.capture,
      title: t.reportTitle,
      body: t.reportBody,
      media: { src: asset("report.png"), caption: t.reportCaption },
      note: t.reportNote,
    },
    {
      id: "cardano",
      section: "CARDANO · MASUMI + SOKOSUMI",
      title: t.cardanoTitle,
      body: t.cardanoBody,
      media: {
        src: asset("cardano-workflow.svg"),
        caption: t.cardanoCaption,
        diagram: true,
      },
      status: t.cardanoStatus,
    },
    {
      id: "cardano-proof",
      section: "CARDANO · PREPROD",
      title: t.cardanoProofTitle,
      body: t.cardanoProofBody,
      media: {
        src: asset("cardano.png"),
        preview: asset("cardano-workflow.gif"),
        caption: t.cardanoProofCaption,
      },
      note: t.cardanoProofNote,
      status: t.cardanoStatus,
    },
    {
      id: "api3",
      section: "API3 · BASE SEPOLIA",
      title: t.api3Title,
      body: t.api3Body,
      media: {
        src: asset("api3-workflow.svg"),
        caption: t.api3Caption,
        diagram: true,
      },
      status: t.api3Status,
    },
    {
      id: "api3-proof",
      section: "API3 · BASE SEPOLIA",
      title: t.api3ProofTitle,
      body: t.api3ProofBody,
      media: {
        src: asset("api3.png"),
        preview: asset("api3-workflow.gif"),
        caption: t.api3ProofCaption,
      },
      note: t.api3ProofNote,
      status: t.api3Status,
    },
    {
      id: "bsv",
      section: "BSV · BRC-121 + BSV-21",
      title: t.bsvTitle,
      body: t.bsvBody,
      media: {
        src: asset("bsv-workflow.svg"),
        caption: t.bsvCaption,
        diagram: true,
      },
      status: t.bsvStatus,
    },
    {
      id: "bsv-proof",
      section: "BSV · WALLET + OVERLAY",
      title: t.bsvProofTitle,
      body: t.bsvProofBody,
      media: {
        src: asset("bsv.png"),
        preview: asset("bsv-workflow.gif"),
        caption: t.bsvProofCaption,
      },
      note: t.bsvProofNote,
      status: t.bsvStatus,
    },
    {
      id: "next",
      section: t.snapshot,
      title: t.closingTitle,
      body: t.closingBody,
      cards: [
        { title: t.deliveredTitle, body: t.deliveredBody },
        { title: t.provenTitle, body: t.provenBody },
        { title: t.nextTitle, body: t.nextBody },
      ],
      note: t.closingNote,
      closing: true,
    },
  ];
}

export function initialSlideIndex(slides: DeckSlide[], requested?: string) {
  return Math.max(
    0,
    slides.findIndex((slide) => slide.id === requested),
  );
}
export function keyboardSlide(index: number, key: string, count: number) {
  if (key === "ArrowRight") return Math.min(index + 1, count - 1);
  if (key === "ArrowLeft") return Math.max(index - 1, 0);
  if (key === "Home") return 0;
  if (key === "End") return count - 1;
  return undefined;
}
