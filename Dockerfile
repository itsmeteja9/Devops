FROM node:24.18.1-trixie-slim AS dependencies

ENV NODE_ENV=production
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM gcr.io/distroless/nodejs24-debian13:nonroot

ENV NODE_ENV=production
WORKDIR /app

COPY --from=dependencies --chown=nonroot:nonroot \
    /app/node_modules ./node_modules

COPY --chown=nonroot:nonroot app.js server.js ./
COPY --chown=nonroot:nonroot public ./public

EXPOSE 8080

CMD ["server.js"]
