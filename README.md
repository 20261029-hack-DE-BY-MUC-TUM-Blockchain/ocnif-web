# Ocnif Web

Ocnif's Next.js security workspace provides authenticated conversations, streamed agent activity, structured findings, report review and voice access to the same agent workflow.

## Setup

Use Bun 1.4.4, Node.js 24 or newer, and Gitleaks 8.30.1.

```sh
bun install --frozen-lockfile
cp .env.example .env
git config core.hooksPath .githooks
```

Set `API_BASE_URL` to the backend origin. Set `VOICE_API_ORIGIN` to the configured voice-provider HTTPS origin. `CARDANO_BASE_URL` optionally enables the `/paid/` seller proxy. These are non-secret origin values; provider keys belong to the core service.

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
- `/health` returns the web process health result.

Presentation uses CSS Modules, with shared tokens in `src/styles/globals.css` and Urbanist typography. Reusable controls live under `src/components/ui/`; API/state wiring lives under `src/features/` and `src/lib/`.

Run tests with `bun test src`. Voice requires a secure context, microphone permission and a configured backend. Its short-lived credentials remain in memory. Optional speaker analysis captures a maximum 20-second window as 16 kHz mono PCM16, discards audio on call end, and shows anonymous labels returned by the configured worker. It does not infer personal identity. The service worker caches only a public offline page and icons; it never caches authenticated API or conversation responses.
