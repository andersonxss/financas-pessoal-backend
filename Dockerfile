FROM node:22-bookworm-slim AS development
WORKDIR /app

ENV NODE_ENV=development
ENV PORT=3333

COPY package.json package-lock.json ./
RUN npm ci

COPY nest-cli.json tsconfig.json tsconfig.build.json ./
COPY src ./src

EXPOSE 3333
CMD ["npm", "run", "start:dev"]

FROM development AS build
RUN npm run build

FROM node:22-bookworm-slim AS production-dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM node:22-bookworm-slim AS production
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3333

COPY --from=production-dependencies --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./

RUN mkdir -p uploads && chown node:node uploads
USER node

EXPOSE 3333
CMD ["node", "dist/main.js"]
