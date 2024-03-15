# Separate build stage to compile node-gyp native modules
FROM node:21-alpine AS build
RUN apk add --no-cache python3 build-base
WORKDIR /app
COPY package.json .
COPY package-lock.json .
RUN npm ci

# Ship only runtime dependencies
FROM node:21-alpine
WORKDIR /app
COPY . .
COPY --from=build /app/node_modules/ node_modules/

LABEL org.opencontainers.image.source=https://github.com/mesmere/plantbot
LABEL org.opencontainers.image.description="A lightweight general-purpose moderation bot for Discord mod teams. 100% plant-based."
LABEL org.opencontainers.image.licenses=BSD-2-Clause-Patent

ENV NODE_ENV=production
ENTRYPOINT ["node", "src/main.js"]
