# Build stage
# Node 22 — @supabase/* packages declare engines.node >=22; Node 20 installs
# fine but prints EBADENGINE warnings on every build.
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application (next.config.ts has output: "standalone", so this
# also produces .next/standalone — a minimal server bundle with only the
# production deps actually used, traced via webpack).
RUN npm run build

# Production stage
FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Copy the standalone server output (includes its own minimal node_modules —
# no separate `npm ci --only=production` needed, avoiding that install
# failing independently of the builder stage's install).
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the standalone server directly (no npm/next CLI needed at runtime)
CMD ["node", "server.js"]
