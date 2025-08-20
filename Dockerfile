# Multi-stage Dockerfile for AgriTech-AI
# Stage 1: Build Frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --only=production

COPY frontend/ .
RUN npm run build

# Stage 2: Build Backend and Final Image
FROM node:18-alpine AS backend

WORKDIR /app

# Install backend dependencies
COPY backend/package*.json ./
RUN npm ci --only=production

# Copy backend source
COPY backend/ .

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist ./public

# Create database directory
RUN mkdir -p /app/data

# Expose port
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000
ENV DATABASE_PATH=/app/data/db.sqlite3

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Start the application
CMD ["npm", "start"]
