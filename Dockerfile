# syntax=docker/dockerfile:1

# ---- Builder Stage ----
FROM node:22-alpine AS builder
WORKDIR /app

# Install build dependencies
COPY package*.json .
RUN npm ci --omit=dev && npm install -g bun && bun install

# Copy source files
COPY . .

# Build the application
RUN npm run build

# ---- Runtime Stage ----
FROM node:22-slim AS runtime
WORKDIR /app

# Copy only production dependencies and built assets
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

# Expose application port (adjust if needed)
EXPOSE 3000

# Start the server
CMD ["node", "dist/server.cjs"]
