# AgriTech-AI Deployment Guide

## 🐳 Docker Deployment

### Quick Start with Docker Compose

1. **Clone and setup**:
   ```bash
   git clone <repository-url>
   cd AgriTech-AI
   ```

2. **Create environment file**:
   ```bash
   cp .env.example .env
   # Edit .env and add your API keys:
   # COHERE_API_KEY=your_cohere_api_key
   # PLANTID_API_KEY=your_plantid_api_key
   ```

3. **Build and run**:
   ```bash
   docker-compose up --build
   ```

4. **Access the application**:
   - Open http://localhost:5000 in your browser
   - The app combines frontend and backend in a single container

### Production Docker Build

```bash
# Build the image
docker build -t agritech-ai .

# Run the container
docker run -d \
  -p 5000:5000 \
  -v agritech_data:/app/data \
  -e COHERE_API_KEY=your_key \
  -e PLANTID_API_KEY=your_key \
  --name agritech-ai \
  agritech-ai
```

## 🚀 Render Deployment

### One-Click Deploy

1. **Fork this repository** to your GitHub account

2. **Connect to Render**:
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New" → "Web Service"
   - Connect your GitHub repository

3. **Configure the service**:
   - **Runtime**: Docker
   - **Build Command**: `docker build -t agritech-ai .`
   - **Start Command**: `npm start`
   - **Port**: 5000

4. **Add environment variables**:
   ```
   NODE_ENV=production
   PORT=5000
   DATABASE_PATH=/app/data/db.sqlite3
   COHERE_API_KEY=your_cohere_api_key
   PLANTID_API_KEY=your_plantid_api_key
   ```

5. **Add persistent disk**:
   - Name: `agritech-data`
   - Mount Path: `/app/data`
   - Size: 1GB

6. **Deploy**: Click "Create Web Service"

### Alternative: Using render.yaml

1. **Place the `render.yaml` file** in your repository root (already included)

2. **Connect repository** to Render and it will automatically detect the configuration

3. **Set environment variables** in the Render dashboard:
   - `COHERE_API_KEY`
   - `PLANTID_API_KEY`

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment (production/development) | Yes |
| `PORT` | Server port (default: 5000) | No |
| `DATABASE_PATH` | SQLite database file path | No |
| `COHERE_API_KEY` | Cohere AI API key for chat functionality | Yes |
| `PLANTID_API_KEY` | Plant.id API key for plant identification | Yes |

### Health Check

The application includes a health check endpoint:
- **URL**: `/api/health`
- **Method**: GET
- **Response**: `{"status": "healthy", "timestamp": "...", "uptime": 123}`

## 📁 Architecture

The Docker container combines:
- **Frontend**: React app built and served as static files
- **Backend**: Node.js/Express API server
- **Database**: SQLite database with persistent volume
- **Static Assets**: Served by the backend server

```
Container Structure:
├── /app/public/          # Built frontend files
├── /app/data/           # Persistent database storage
├── /app/server.js       # Backend application
└── /app/package.json    # Dependencies
```

## 🔍 Troubleshooting

### Common Issues

1. **Database Connection Issues**:
   - Ensure the `/app/data` directory has write permissions
   - Check that the DATABASE_PATH environment variable is set correctly

2. **API Key Errors**:
   - Verify COHERE_API_KEY is set and valid
   - Check PLANTID_API_KEY for plant identification features

3. **Frontend Not Loading**:
   - Ensure the build process completed successfully
   - Check that static files are being served from `/public`

### Logs

```bash
# View container logs
docker logs agritech-ai

# Follow logs in real-time
docker logs -f agritech-ai
```

### Database Access

```bash
# Access the running container
docker exec -it agritech-ai sh

# Check database file
ls -la /app/data/

# Run SQLite commands
sqlite3 /app/data/db.sqlite3 ".tables"
```

## 🔄 Updates

To update the deployed application:

1. **Push changes** to your repository
2. **Trigger redeploy** in Render dashboard (or it will auto-deploy)
3. **For manual Docker updates**:
   ```bash
   git pull
   docker-compose down
   docker-compose up --build
   ```

## 🛡️ Security

- Environment variables are used for sensitive data
- SQLite database is stored in a persistent volume
- No sensitive information is embedded in the Docker image
- Health checks ensure service availability
