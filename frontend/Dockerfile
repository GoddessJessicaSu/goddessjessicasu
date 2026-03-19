FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Dev target
FROM base AS dev
COPY . .
CMD ["npm", "run", "dev"]

# Production build
FROM base AS build
COPY . .
ARG NEXT_PUBLIC_SITE_NAME
ARG NEXT_PUBLIC_TOKEN_NAME
ARG NEXT_PUBLIC_PRIMARY_COLOR
ARG NEXT_PUBLIC_ACCENT_COLOR
ARG NEXT_PUBLIC_SITE_TAGLINE
ARG NEXT_PUBLIC_API_URL
ENV NODE_OPTIONS="--max-old-space-size=512"
RUN npm run build

FROM node:22-alpine AS production
WORKDIR /app
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
ENV PORT=3000
CMD ["node", "server.js"]
