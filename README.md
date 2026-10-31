# Ocnif Web

Ocnif's Next.js security workspace provides authenticated conversations, streamed agent activity, structured findings, report review and voice access to the same agent workflow.

## Setup

Use Bun 1.4.4, Node.js 24 or newer, and Gitleaks 8.30.1.

```sh
bun install --frozen-lockfile
cp .env.example .env
git config core.hooksPath .githooks
```

Set `PUBLIC_APP_ORIGIN` to the browser-visible app origin and `API_BASE_URL` to the backend origin. Set `VOICE_API_ORIGIN` to the configured voice-provider HTTPS origin. `CARDANO_BASE_URL` enables the `/paid/` Masumi/Sokosumi status proxy. `SOKOSUMI_PREPROD_URL` is the public navigation origin for Personal Workspace setup. These are non-secret origin values; provider keys belong to the core service.

## Build and run

```sh
bun run typecheck
bun run test
bun run lint
bun run secret-scan
bun run build
bun run start
```

The production container runs Next.js standalone output with its static assets and listens on `PORT`. HTTP and WebSocket `/api/` traffic uses a same-origin reverse proxy, so session cookies stay on the web origin. `API_BASE_URL` and `CARDANO_BASE_URL` must be set before building because rewrites are build-time configuration. `VOICE_API_ORIGIN` must also be present at runtime for the per-request content-security policy.

Supply `PUBLIC_APP_ORIGIN` at build and runtime. The CSP's explicit WebSocket source and reporting endpoint use this validated origin, independently of internal container hosts or forwarded request headers. HTTPS maps to WSS; local HTTP maps to WS. Without the setting, the policy retains `'self'` and relative `report-uri` but omits explicit WebSocket and reporting endpoint origins. Configure it for deployment so browsers receive the intended public WebSocket source.

Set build-time `BSV_BASE_URL` to the internal BSV service origin to enable `/bsv/:path*` and the dedicated `/arc-ingest` callback proxy. The first strips `/bsv`; the second preserves the callback path expected by OverlayExpress. These rewrites pass the request body and caller-provided authorization/callback headers to the service without adding credentials; the service must validate them. When using this deployment layout, set the browser's `BSV_OVERLAY_URL` and the BSV service's `OVERLAY_PUBLIC_URL` to the public app origin followed by `/bsv`. The BSV service remains private behind the web ingress.

`docker-compose.yml` is for local development only; production uses Azure Container Apps. Each Docker build uses this repository as its own build context.

```sh
docker compose build
docker compose up -d
```

For Apple Container, build the same Dockerfile with the environment origins passed as build arguments. Do not mount or copy provider keys into this image.

## Interface

- `/` is the landing and authentication page, including one-click demo access.
- `/workspace` loads saved conversations and live WebSocket events.
- `/deck/202610311230` provides the pitch route with keyboard slide navigation.
- `/payments` reviews wallet-specific payment requests and verifier transactions.
- `/health` returns the web process health result.

Presentation uses CSS Modules, with shared tokens in `src/styles/globals.css` and Urbanist typography. Reusable controls live under `src/components/ui/`; API/state wiring lives under `src/features/` and `src/lib/`.

Run tests with `bun test src`. Voice requires a secure context, microphone permission and a configured backend. Its short-lived credentials remain in memory. Optional speaker analysis captures a maximum 20-second window as 16 kHz mono PCM16, discards audio on call end, and shows anonymous labels returned by the configured worker. It does not identify the intended speaker or filter out background speakers. The service worker caches only a public offline page and icons; it never caches authenticated API or conversation responses.

Use `/publish` in the workspace to request explicit publication of the latest completed report. The approval is separate from an active assessment. Only a confirmed publication decision exposes the report identifier and a Cardano setup link carrying the report identifier as context. The identifier does not create a Masumi Task, purchase a service, or substitute for the actual evidence supplied to that Task. Rejected publication stays private.

## Wallet connection

The BSV connection control loads the pinned `ocnif-bc-bsv` source artifact under `vendor/`; `provenance.json` records its source commit and SHA256 hashes. This keeps builds independent of private GitHub access. Signing remains in the user wallet. The interface displays the actual public identity and network; available funds remain in the wallet UI.

Set `WALLET_CONNECT_ORIGINS` to the explicit loopback wallet endpoints in `.env.example` to permit the SDK’s HTTP discovery. The browser may still require local network permission, and the wallet must authorize the app origin. `payment=()` disables the browser Payment Request API; BRC-100 uses its own wallet transport. Selected Cardano readiness comes from the configured `CARDANO_BASE_URL` through `/paid/config`; it must report `integration: masumi-sokosumi`.

## Payment review and verification

`/payments` exposes three independent protocols. API3 uses the real authenticated `/api/v1/vulnerabilities/{CVE}` challenge, followed by a signed POST retry. Its EIP-3009 client requires Base Sepolia and shows the exact merchant, asset, amount and resource. Paid evidence is rechecked against the reviewed NVD signer and exact CVE request. The verifier deployment and submission controls estimate gas, show the CVSS policy, and require separate wallet transactions. Receipt validation checks runtime bytecode, four immutable getters, the decision event and the contract state at the receipt block. The interface never deploys a contract merely by connecting a wallet.

Cardano uses the selected Masumi/Sokosumi flow. The interface shows Rust-core service health, Coworker configuration, execution-only Task evidence, Masumi registration, paid-Task enablement, and settlement as independent checkpoints. Service health does not prove a completed inference; an execution-only Task does not prove payment. Completed Task identifiers and optional local-worker receipt provenance/time are shown only when returned by the service.

`SOKOSUMI_PREPROD_URL=https://preprod.sokosumi.com` links to the official Personal Workspace setup. Account and worker setup remain external; no credential, vault, merchant key or payment secret is entered into this app. The published-report handoff is a reference only: a Sokosumi Task needs its actual service inputs and separate authorization. A historical x402 configuration is explicitly identified as obsolete and exposes no purchase/signing controls. The pinned x402 adapter and restricted Koios proxy remain historical source; `CARDANO_KOIOS_URL` is not required for the selected Masumi flow.

BSV uses a BRC-100 wallet with an explicitly configured BSV-21 overlay. Keep `BSV_OVERLAY_URL` empty until a reviewed `tm_tokenkit`/`ls_tokenkit` service and actual seller offer exist. Buyer and seller review the exact token, outpoint, amount and identities. Prepared transactions and seller signatures are exchanged explicitly; completion broadcasts through the buyer wallet. Receipt recovery resubmits the same transaction to the overlay, and the seller can import the resulting proceeds. Broadcast and overlay admission do not claim chain confirmation.

Payment proofs and transaction hashes are retained in IndexedDB before transport. Interrupted attempts require review; retries use the same saved proof or transaction. The adapters are immutable source snapshots under `vendor/`, with commit and SHA256 provenance. No private repository access is needed during a clean build.

`WALLET_CONNECT_ORIGINS`, `VOICE_API_ORIGIN`, `BSV_OVERLAY_URL`, `SOKOSUMI_PREPROD_URL` and the historical `CARDANO_KOIOS_URL` are public configuration supplied at both build and runtime. API and seller origins are build-time rewrite targets. No wallet seed, private key or provider credential belongs in web configuration.

## Verification boundary

The source checks cover event replay, safe generated cards/Markdown, audio encoding, payment challenge validation, duplicate attempts, restricted provider operations, and reviewed wallet/contract payloads. Synthetic signer tests are explicitly named. Local browser checks exercised the actual unpaid API3 challenge, Cardano service/setup status, unavailable wallet behavior, language/theme controls and responsive layouts. Wallet signing, paid settlement and mainnet transactions require the user's wallet and approval; a connection or a test double is not settlement evidence. Native human microphone, assistive-technology and installation acceptance remain separate from the automated checks. Four-language UI controls are verified; complete AI and voice journeys in all of English, Spanish, German and French are not yet accepted. Theme and language preferences are stored in this browser’s local storage, not the workspace database.

Text attachments accept `.txt`, `.md`, `.json`, `.csv` and `.log`. The complete submitted message is limited to 16,000 UTF-8 bytes, including existing text, filenames and all appended evidence. The composer shows the byte count, rejects an attachment that would exceed the total while preserving the draft, and blocks oversized pasted or voice tool requests before WebSocket transport. It does not truncate input silently. Images, PDFs and office documents are not parsed. The public offline page does not provide offline conversations. The four sibling `ocnif-web-ui-*` repositories remain inactive scaffolds; reusable production controls are local to this application.
