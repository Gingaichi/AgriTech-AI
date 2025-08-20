# Multi-stage Dockerfile for AgriTech-AI

# -----------------------------
# Stage 1: Build Frontend
# -----------------------------
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy dependency files and install all deps (including dev)
COPY frontend/package*.json ./
RUN npm ci

# Copy source code and build
COPY frontend/ .
RUN npm run build


# -----------------------------
# Stage 2: Build Backend
# -----------------------------
FROM node:18-alpine AS backend-builder

WORKDIR /app/backend

# Copy dependency files and install all deps (including dev, if backend build tools are needed)
COPY backend/package*.json ./
RUN npm ci

# Copy backend source code
COPY backend/ .

# -----------------------------
# Stage 3: Final Runtime Image
# -----------------------------
FROM node:18-alpine AS backend

WORKDIR /app

# Install only production dependencies for backend
COPY backend/package*.json ./
RUN npm ci --only=production

# Copy backend source (excluding node_modules)
COPY --from=backend-builder /app/backend . 

# Copy built frontend into backend public folder
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
