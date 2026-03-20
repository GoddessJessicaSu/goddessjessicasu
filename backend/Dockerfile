FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Dev target
FROM base AS dev
COPY . .
RUN npx prisma generate
CMD ["sh", "-c", "npx prisma migrate dev --skip-generate && npx tsx watch src/index.ts"]

# Production build
FROM base AS build
COPY . .
RUN npx prisma generate
RUN npx tsc

FROM node:22-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
RUN npx prisma generate
RUN addgroup -g 1001 app && adduser -D -u 1001 -G app app
USER app
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
