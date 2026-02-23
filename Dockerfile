FROM node:20-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY patches ./patches
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
ARG DATABASE_URL
ARG BETTER_AUTH_URL
ARG S3_ENDPOINT
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN DATABASE_URL="${DATABASE_URL:?DATABASE_URL build arg is required}" \
    BETTER_AUTH_SECRET=build-time-placeholder-secret-123456789012345 \
    BETTER_AUTH_URL="${BETTER_AUTH_URL:?BETTER_AUTH_URL build arg is required}" \
    AUTH_SIGNUP_MODE=invite_only \
    S3_ENDPOINT="${S3_ENDPOINT:?S3_ENDPOINT build arg is required}" \
    S3_REGION=us-east-1 \
    S3_BUCKET=open-expense \
    S3_ACCESS_KEY=minioadmin \
    S3_SECRET_KEY=minioadmin \
    pnpm build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["pnpm", "start"]
