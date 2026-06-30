# Stage 1: Build the Nuxt application and dependencies
FROM node:24-slim AS builder

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm@11.9.0

# Copy package configurations and lockfile
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY workers/package.json ./workers/package.json

# Copy source code and config files
COPY app/ ./app/
COPY public/ ./public/
COPY shared/ ./shared/
COPY types/ ./types/
COPY workers/ ./workers/
COPY nuxt.config.ts tsconfig.json ./

# Install all dependencies (postinstall scripts build workerd and esbuild native binaries)
RUN pnpm install --frozen-lockfile

# Build Nuxt static files into .output/public
RUN pnpm build

# Stage 2: Production runner
FROM node:24-slim AS runner

WORKDIR /app

# Copy only the artifacts needed at runtime
COPY --from=builder /app/.output /app/.output
COPY --from=builder /app/workers /app/workers
COPY --from=builder /app/shared /app/shared
COPY --from=builder /app/types /app/types
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/package.json /app/package.json

ENV NODE_ENV=production
ENV PORT=8787
# Disable wrangler's interactive terminal UI (required when there is no TTY)
ENV CI=1
# Suppress "a new version is available" prompts
ENV WRANGLER_DISABLE_UPDATE_CHECK=1

EXPOSE 8787

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8787/', (r) => process.exit(r.statusCode < 500 ? 0 : 1)).on('error', () => process.exit(1))"

# Run wrangler from the workers directory so wrangler.toml and asset paths resolve correctly
WORKDIR /app/workers

# wrangler dev runs the open-source workerd runtime locally — there is no separate
# "wrangler serve/start" command for self-hosted deployments. --remote would push
# execution to Cloudflare's network, which is not what we want here.
# --no-live-reload disables the file watcher (files never change inside a container).
CMD ["/app/node_modules/.bin/wrangler", "dev", "--ip", "0.0.0.0", "--port", "8787", "--persist-to", "/app/state", "--no-live-reload"]
