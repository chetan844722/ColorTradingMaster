# ---- Base Node ----
FROM node:20-slim AS base
WORKDIR /app

# Set to production for best performance
ENV NODE_ENV=production
ENV PORT=5000

# ---- Dependencies ----
FROM base AS dependencies
# Copy package files
COPY package*.json ./
# Install production dependencies only
RUN npm ci --quiet --only=production && npm cache clean --force
# Copy production dependencies to a separate layer for prod image
RUN cp -R node_modules prod_modules
# Install ALL dependencies for build
RUN npm ci --quiet

# ---- Build ----
FROM dependencies AS builder
# Copy app source
COPY . .
# Build the application
RUN npm run build
# Optionally run tests - uncomment if needed
# RUN npm test -- --passWithNoTests

# ---- Production ----
FROM node:20-alpine AS production
LABEL maintainer="support@colortrading.io"
LABEL org.opencontainers.image.source="https://github.com/colortrading/platform"
LABEL org.opencontainers.image.description="Color Trading Platform - A dynamic trading platform with color-based games"

WORKDIR /app

# Set NODE_ENV to production
ENV NODE_ENV=production
ENV PORT=5000
ENV TZ=UTC

# Custom health check path using the new health endpoint
ENV HEALTH_CHECK_PATH="/api/health"

# Copy production dependencies and built app
COPY --from=dependencies /app/prod_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/netlify ./netlify

# Install only the minimal tools needed for the health check
RUN apk --no-cache add curl ca-certificates tzdata

# Expose application port
EXPOSE 5000

# Better health check using the dedicated health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:${PORT}${HEALTH_CHECK_PATH} || exit 1

# Create a non-root user and set ownership
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app
USER appuser

# Set up scripts for improved entrypoint workflow
COPY --from=builder /app/scripts/db-check.js ./scripts/db-check.js
COPY --from=builder /app/scripts/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# Use entrypoint script to handle startup logic
ENTRYPOINT ["./entrypoint.sh"]

# Startup command - can be overridden when running container
CMD ["npm", "start"]