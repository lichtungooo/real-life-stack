# Der Agent-Dienst des KI-Moduls (DEFINITION 13.10): Claude Code mit den
# Werkzeugen eines MCP-Servers, gestreamt in den Chat der App. Debian statt
# Alpine: Das Agent SDK bringt Claude Code als Programm für glibc mit.
FROM node:22-slim
WORKDIR /src
RUN corepack enable

# Nur die Manifeste zuerst, damit die Abhängigkeiten im Cache bleiben.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/data-interface/package.json packages/data-interface/
COPY packages/td-core/package.json packages/td-core/
COPY packages/td-ki/package.json packages/td-ki/
RUN pnpm install --frozen-lockfile --filter @trustdonation/ki...

COPY packages/data-interface packages/data-interface
COPY packages/td-core packages/td-core
COPY packages/td-ki packages/td-ki
RUN pnpm --filter @trustdonation/ki... build

ENV NODE_ENV=production PORT=8788 HOME=/home/node
EXPOSE 8788
USER node
CMD ["node", "packages/td-ki/dist/src/http.js"]
