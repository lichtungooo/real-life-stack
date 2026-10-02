# Die Begleitung eines Netzwerks als Dienst (DEFINITION 13.7): td-mcp über
# HTTP, zustandslos. Ein Image für alle Netzwerke; welches Netzwerk und
# wohin der Link führt, sagen TD_NETZWERK und TD_APP_URL zur Laufzeit.
FROM node:22-alpine
WORKDIR /src
RUN corepack enable

# Nur die Manifeste zuerst, damit die Abhängigkeiten im Cache bleiben.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/data-interface/package.json packages/data-interface/
COPY packages/td-core/package.json packages/td-core/
COPY packages/td-mcp/package.json packages/td-mcp/
RUN pnpm install --frozen-lockfile --filter @trustdonation/mcp...

COPY packages/data-interface packages/data-interface
COPY packages/td-core packages/td-core
COPY packages/td-mcp packages/td-mcp
RUN pnpm --filter @trustdonation/mcp... build

ENV NODE_ENV=production PORT=8787
EXPOSE 8787
USER node
CMD ["node", "packages/td-mcp/dist/src/http.js"]
