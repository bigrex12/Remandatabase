# Multi-stage Docker build for KAEBS Reman Tracker
FROM node:20-alpine AS builder

WORKDIR /app

# Install root & client dependencies
COPY package*.json ./
RUN npm ci

COPY client/package*.json ./client/
RUN npm --prefix client ci

# Copy source and build frontend
COPY . .
RUN npm --prefix client run build

# Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

# Install production dependencies for server
COPY package*.json ./
RUN npm ci --omit=dev

# Copy server and pre-built frontend distribution
COPY server ./server
COPY --from=builder /app/client/dist ./client/dist

# Default persistent directories
ENV DATA_DIR=/app/server/data
ENV UPLOADS_DIR=/app/server/uploads

EXPOSE 8080

CMD ["node", "server/index.js"]
