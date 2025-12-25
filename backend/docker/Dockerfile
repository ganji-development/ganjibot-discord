# =============================================================================
# Ganjibot-Discord Dockerfile
# Multi-stage build for production
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Builder
# -----------------------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies required for native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Prune devDependencies
RUN npm prune --production

# -----------------------------------------------------------------------------
# Stage 2: Runner
# -----------------------------------------------------------------------------
FROM node:22-alpine AS runner

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 ganjibot

# Copy built application
COPY --from=builder --chown=ganjibot:nodejs /app/dist ./dist
COPY --from=builder --chown=ganjibot:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=ganjibot:nodejs /app/prisma ./prisma
COPY --from=builder --chown=ganjibot:nodejs /app/package.json ./

# Set environment
ENV NODE_ENV=production

# Switch to non-root user
USER ganjibot

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Expose API port
EXPOSE 3000

# Start the application
CMD ["node", "dist/index.js"]
