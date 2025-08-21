# Docker Deployment Guide

## Architecture Overview

The AgriTech-AI platform consists of two main services in Docker:

1. **ai-models**: Django AI models service (Python) - Port 8000
   - Plant disease detection via Plant.ID API
   - Weather prediction and crop analysis
   - Shared SQLite database

2. **agritech-ai**: Node.js backend + React frontend - Port 5000
   - Serves built React frontend as static files
   - Express.js API with Cohere AI integration
   - Proxies requests to Django AI models
   - Shared SQLite database

## Service Communication

```
Frontend (React) → Node.js Backend → Django AI Models → Plant.ID API
                    ↓
                 SQLite Database (shared volume)
```

### Environment Variables Required

Create a `.env` file in the root directory:

```bash
# Required for Plant.ID API integration
PLANTID_API_KEY=your_plantid_api_key_here

# Required for Cohere AI chat functionality  
COHERE_API_KEY=your_cohere_api_key_here
```

## Deployment Commands

### Build and Start All Services
```bash
# Build and start both services
docker-compose up --build

# Run in background
docker-compose up -d --build

# View logs
docker-compose logs -f
```

### Individual Service Management
```bash
# Start only Django AI models
docker-compose up ai-models

# Start only Node.js backend (depends on ai-models)
docker-compose up agritech-ai

# Restart a service
docker-compose restart ai-models
```

### Database Management
```bash
# The database is automatically shared between services via volume
# Database location in containers: /app/data/db.sqlite3
# Volume name: agritech_data

# Access database (if needed)
docker-compose exec agritech-ai ls -la /app/data/
```

## Service Health Checks

Both services include health checks:

- **Django AI Models**: `http://localhost:8000/api/health/`
- **Node.js Backend**: `http://localhost:5000/api/health`

## Development vs Production

### Development (recommended)
Use the individual service commands for development:
```bash
# Terminal 1: Django AI models
cd ai_models && python manage.py runserver

# Terminal 2: Node.js backend  
cd backend && npm run dev

# Terminal 3: React frontend
cd frontend && npm run dev
```

### Production (Docker)
Use Docker Compose for production deployment:
```bash
docker-compose up -d --build
```

## Troubleshooting

### Service Communication Issues
- Ensure both services are running before testing
- Check service logs: `docker-compose logs ai-models` or `docker-compose logs agritech-ai`
- Verify environment variables are set correctly

### Database Issues
- Database is automatically created and shared between services
- If database corruption occurs, remove the volume: `docker-compose down -v`

### Image Analysis Not Working
- Verify `PLANTID_API_KEY` environment variable is set
- Check Django AI models service health: `curl http://localhost:8000/api/health/`
- Image analysis has graceful fallbacks when Plant.ID API is unavailable

## Access Points

- **Main Application**: http://localhost:5000
- **Django AI Models API**: http://localhost:8000 (internal use)
- **Health Checks**: 
  - http://localhost:5000/api/health
  - http://localhost:8000/api/health/
