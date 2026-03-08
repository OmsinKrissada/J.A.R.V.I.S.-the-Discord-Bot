FROM node:25-alpine AS base

WORKDIR /app

RUN apk add --no-cache openssl

FROM base AS build
RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
COPY src src
COPY prisma prisma
RUN apk add --no-cache python3 make gcc g++
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm prisma generate
RUN pnpm build

FROM base
WORKDIR /app
COPY --from=build /app/bundle /app

USER node

CMD [ "node", "Main.js" ]