# Build stage
FROM node:24.18.1-trixie-slim AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev && npm cache clean --force

# Runtime stage
FROM gcr.io/distroless/nodejs24-debian13:nonroot

WORKDIR /app

COPY --from=builder --chown=nonroot:nonroot /app/node_modules ./node_modules

COPY --chown=nonroot:nonroot app.js server.js ./

COPY --chown=nonroot:nonroot public ./public

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD ["/nodejs/bin/node", "-e", "require('http').get('http://localhost:8080/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"]

CMD ["server.js"]
