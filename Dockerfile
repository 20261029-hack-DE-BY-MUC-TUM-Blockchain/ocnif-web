FROM ghcr.io/gitleaks/gitleaks:v8.30.1 AS security
FROM oven/bun:1.4.4 AS build
WORKDIR /app
COPY --from=security /usr/bin/gitleaks /usr/local/bin/gitleaks
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
ARG API_BASE_URL
ARG VOICE_API_ORIGIN
ARG CARDANO_BASE_URL
ENV API_BASE_URL=${API_BASE_URL} VOICE_API_ORIGIN=${VOICE_API_ORIGIN} CARDANO_BASE_URL=${CARDANO_BASE_URL} NEXT_TELEMETRY_DISABLED=1
RUN gitleaks dir . --redact --no-banner && bun audit && bun test src && bunx tsc --noEmit && bun run build
FROM gcr.io/distroless/nodejs26-debian13:nonroot@sha256:a51c5d631b90e1b298e17a88a307b77f0b959b47de942d033acce0c96be3fb83 AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build --chown=65532:65532 /app/.next/standalone ./
COPY --from=build --chown=65532:65532 /app/.next/static ./.next/static
COPY --from=build --chown=65532:65532 /app/public ./public
USER 65532:65532
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s CMD ["/nodejs/bin/node", "-e", "fetch('http://127.0.0.1:'+process.env.PORT+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
CMD ["server.js"]
