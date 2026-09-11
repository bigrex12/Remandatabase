# Multi-stage Docker build for KAEBS Reman Tracker
FROM node:20-alpine AS builder

WORKDIR /app

# Install build tools for native addons (better-sqlite3)
RUN apk add --no-cache python3 make g++

# Install dependencies
COPY package*.json ./
RUN npm install

COPY client/package*.json ./client/
RUN npm --prefix client install

# Copy source and build frontend
COPY . .
RUN npm --prefix client run build

# Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

# Install runtime dependencies & node-gyp build tools for better-sqlite3
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install --omit=dev

# Copy server and pre-built frontend distribution
COPY server ./server
COPY --from=builder /app/client/dist ./client/dist

# Default persistent storage paths (can be overridden by Cloud Run env vars)
ENV DATA_DIR=/app/server/data
ENV UPLOADS_DIR=/app/server/uploads
ENV SQLITE_JOURNAL_MODE=MEMORY

EXPOSE 8080

CMD ["node", "server/index.js"]
