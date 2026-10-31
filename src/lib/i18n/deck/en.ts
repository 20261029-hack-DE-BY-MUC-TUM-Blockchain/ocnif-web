export const deckEnglish = {
  event: "TUM Blockchain & AI Hackathon · 31 October 2026",
  live: "Live product",
  architecture: "System architecture",
  workflow: "User workflow",
  capture: "Actual application capture",
  diagram: "Architecture diagram",
  capturedSteps: "Captured step preview",
  previewNote:
    "Timestamped screenshots from real interactions, assembled into a short preview. This is not a continuous screen recording.",
  captureLanguage:
    "Visuals retain the English interface and architecture labels.",
  playPreview: "Play captured steps",
  pausePreview: "Pause preview",
  openVisual: "Open visual at full size",
  navigation: "Pitch navigation",
  contents: "Choose a slide",
  keyboard: "← → to navigate · Home / End",
  snapshot: "Evidence snapshot · 31 October 2026",
  verified: "Observed",
  pending: "Still to verify",
  designed: "Implemented path",
  heroTitle: "A security team you can question.",
  heroBody:
    "Ocnif turns supplied evidence into a reviewable assessment—with specialist agents, visible tool activity, and a human decision at the end.",
  heroCaption:
    "The deployed Ocnif workspace: conversation, findings, activity, and service status in one place.",
  heroPoint1: "Investigate in natural language",
  heroPoint2: "Inspect the evidence behind the answer",
  heroPoint3: "Approve publication and wallet actions separately",
  problemTitle: "From scattered signals to an actionable review.",
  problemBody:
    "Built for small security teams, platform engineers, and organizations that need to understand their exposure without adding another alert queue.",
  problem1Title: "Context is scattered",
  problem1Body:
    "Headers, logs, suspicious messages, and questions arrive in different places.",
  problem2Title: "Answers need a trail",
  problem2Body:
    "Teams need to see what an agent did, what evidence supports a finding, and what remains uncertain.",
  problem3Title: "Action needs an owner",
  problem3Body:
    "Report acceptance, public sharing, payment, and contract transactions each need an explicit human decision.",
  workflowTitle: "One conversation. A visible chain of work.",
  workflowBody:
    "Bring evidence, choose a task, steer the specialist agents, then review the result. Publication and network workflows follow their own approval steps.",
  workflowCaption:
    "The complete user journey, including the decision points that separate assessment, sharing, and payment.",
  workflowNote:
    "Assessment scope is the evidence supplied by the user. This demo does not establish an authorized scan of an external system.",
  assessmentTitle: "Watch an assessment take shape.",
  assessmentBody:
    "A real request produces live agent and tool events, a written response, and structured findings. The user can steer or cancel the running task.",
  assessmentCaption:
    "Captured from the deployed application using a bounded synthetic security-evidence prompt.",
  assessmentNote:
    "The evidence is synthetic; the application interaction and model execution are real.",
  architectureTitle: "Shared reasoning. Explicit trust boundaries.",
  architectureBody:
    "The web workspace connects to a Rust backend and shared model runtime. Persistence, voice, and sponsor adapters have distinct responsibilities.",
  architectureCaption:
    "How the application, agent runtime, data store, optional voice services, and three network integrations fit together.",
  architectureNote:
    "Provider credentials remain on the server. Browser wallets keep their keys and require the user's approval.",
  reportTitle: "A finding becomes useful when it can be reviewed.",
  reportBody:
    "Structured cards keep the assessment readable. Activity events retain the process behind it. The user reviews the report and separately decides whether to publish it.",
  reportCaption:
    "An actual generated report and its review controls in the Ocnif workspace.",
  reportNote:
    "Accepting a report records a workspace decision. It does not prove remediation, publish automatically, or execute a payment.",
  cardanoTitle: "Cardano: a paid agent task with a receipt.",
  cardanoBody:
    "Sokosumi provides the Personal workspace task flow. Masumi coordinates the Cardano Preprod payment lifecycle, while the Ocnif worker runs the requested security task.",
  cardanoCaption:
    "The selected Masumi + Sokosumi integration, from task creation through result submission and eventual seller withdrawal.",
  cardanoStatus: "Personal paid Task completed · seller withdrawal confirmed",
  cardanoProofTitle: "Make each payment checkpoint visible.",
  cardanoProofBody:
    "A completed task, locked funds, a submitted result, and a seller withdrawal are different events. The deck keeps their evidence separate.",
  cardanoProofCaption:
    "Actual interface steps. The cloud panel shows execution-only readiness; the separately verified Personal paid Task ran through the native Ocnif worker. Private identifiers are omitted.",
  cardanoProofNote:
    "Observed: 1 test USDM / 100 credits; FundsLocked, ResultSubmitted, and seller withdrawal confirmed. Seller net: +1 test USDM. The Personal workspace result does not establish an organization workspace result.",
  api3Title: "API3: signed evidence before an on-chain decision.",
  api3Body:
    "Request an NVD vulnerability attestation, review the Base Sepolia payment terms, and verify the signed response before a separately approved verifier-contract transaction.",
  api3Caption:
    "The x402 challenge and EIP-3009 payment path, signed NVD evidence verification, and CVSS policy gate.",
  api3Status:
    "Real unpaid challenge verified · paid attestation and contract execution pending",
  api3ProofTitle: "Review the exact CVE, recipient, and policy.",
  api3ProofBody:
    "The interface binds approval to the selected CVE and preserves prior payment attempts. A changed CVE invalidates the old review; uncertain outcomes cannot silently create a new payment.",
  api3ProofCaption:
    "Actual API3 interface steps. The preview does not claim that a payment settled or a verifier contract was deployed.",
  api3ProofNote:
    "Base Sepolia uses the quoted aUSD asset. The user reviews wallet signatures, deployment gas, evidence freshness, and the CVSS threshold independently.",
  bsvTitle: "BSV: purchase a report or transfer a report pass.",
  bsvBody:
    "A published report can use a BRC-121 purchase or a registered BSV-21 pass. Overlay ownership controls pass access, and an atomic swap requires both parties to review the offer.",
  bsvCaption:
    "Report publication, explicit payment or mint approval, overlay admission, ownership checks, and the two-wallet swap path.",
  bsvStatus: "Overlay and issuer configured · real wallet execution pending",
  bsvProofTitle: "Wallet control stays with the user.",
  bsvProofBody:
    "The UI checks the configured network, report digest, recipient, amount, and holder. A saved uncertain transaction can be reconciled without creating another mint or payment.",
  bsvProofCaption:
    "Actual BSV interface steps and setup state. No funded purchase, mint, swap, or chain confirmation is claimed by this preview.",
  bsvProofNote:
    "Overlay admission is distinct from block confirmation. A new pass has fixed supply one, but minting does not make a report globally unique. Direct report purchases still require merchant setup.",
  closingTitle: "Try the product. Inspect the proof.",
  closingBody:
    "The next step is a pilot with a real team: bring a bounded evidence set, review the assessment, and evaluate whether the workflow reduces the work between a signal and a decision.",
  deliveredTitle: "Available to evaluate",
  deliveredBody:
    "Deployed workspace; real agent runs; persisted messages and events; structured reports; explicit sharing and payment reviews; four-language UI.",
  provenTitle: "Verified in bounded checks",
  provenBody:
    "Real cloud assessment and synthetic WebRTC journey; Cardano Personal paid Task and confirmed withdrawal; API3 unpaid challenge; BSV SDK and mock-chain workflows.",
  nextTitle: "Next acceptance work",
  nextBody:
    "Real API3 and BSV wallet execution; native microphone and assistive-technology acceptance; complete model and voice journeys in all four languages.",
  closingNote:
    "This is a hackathon implementation and evidence snapshot, not a claim that the full roadmap or every integration journey is complete.",
  openWorkspace: "Open the live workspace",
  openPayments: "Inspect network workflows",
} as const;
export type DeckCopy = { [Key in keyof typeof deckEnglish]: string };
