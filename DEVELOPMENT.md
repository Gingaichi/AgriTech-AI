# 🛠️ AgriTech-AI Development Guide

This guide contains all the technical details for you guys to work with & update as needed.

## 🏗️ Architecture Overview

AgriTech-AI is built as a multi-service application with three main components:

### 🎨 Frontend (React + TypeScript + Vite)
- **Port**: 3000
- **Location**: `frontend/`
- **Purpose**: User interface with chat functionality and crop analysis
- **Tech Stack**: React 19, TypeScript, Tailwind CSS, Vite

### 🔗 Node.js Backend (Chat Persistence)
- **Port**: 5000  
- **Location**: `backend/`
- **Purpose**: Chat storage, message persistence, Cohere AI integration
- **Tech Stack**: Express.js, SQLite, Cohere AI, Multer (file uploads)

### 🤖 Django AI Models (ML Services)
- **Port**: 8000
- **Location**: `ai_models/`
- **Purpose**: Crop disease detection, weather analysis, ML predictions
- **Tech Stack**: Django, Django REST Framework, Plant.ID API, Open-Meteo

### 🗄️ Shared Database
- **File**: `ai_models/db.sqlite3`
- **Shared By**: Node.js backend (chats) + Django (AI models)
- **Tables**: `chats`, `chat_messages`, Django models

---

## 🚀 Development Setup

### Prerequisites
- Node.js >= 16.0.0
- Python >= 3.8.0
- Git

### Option 1: Automated Setup (Recommended)

```bash
# Clone the repository
git clone https://github.com/Gingaichi/AgriTech-AI.git
cd AgriTech-AI

# Run setup script
./setup-dev.sh

# Add your API keys to .env files (see Environment Variables section)

# Start all services
./start-services.sh
```

### Option 2: Manual Setup

```bash
# 1. Setup Python virtual environment
python3 -m venv .venv
source .venv/bin/activate
pip install -r ai_models/requirements.txt

# 2. Install Node.js dependencies
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 3. Initialize database
cd backend && npm run init-db && cd ..

# 4. Setup environment variables (see below)

# 5. Run Django migrations
cd ai_models && source ../.venv/bin/activate && python manage.py migrate && cd ..
```

### Option 3: Using NPM Scripts

```bash
# Install all dependencies
npm run install:all

# Set up development environment
npm run setup

# Start all services
npm run dev
```

---

## 🔐 Environment Variables

### Main `.env` (Root Directory)
```bash
PLANTID_API_KEY=your_plantid_api_key_here
```

### `backend/.env`
```bash
COHERE_API_KEY=your_cohere_api_key_here
```

### `frontend/.env`
```bash
VITE_BACKEND_URL=http://localhost:5000
```

### 🔑 Getting API Keys

1. **Plant.ID API**: from Jihoon
2. **Cohere AI**: from Gingaichi

---

## 🎮 Running the Services

### Start All Services
```bash
./start-services.sh
# or
npm run dev
```

### Start Individual Services

**Frontend Only:**
```bash
cd frontend && npm run dev
```

**Node.js Backend Only:**
```bash
cd backend && npm start
```

**Django AI Service Only:**
```bash
cd ai_models && source ../.venv/bin/activate && python manage.py runserver 8000
```

### 🌐 Service URLs
- **Frontend**: http://localhost:3000
- **Node.js Backend**: http://localhost:5000
- **Django AI**: http://localhost:8000

---

## 🛠️ Development Commands

### NPM Scripts (Root Directory)
```bash
npm run setup          # Development environment setup
npm run dev            # Start all services
npm run install:all    # Install all dependencies
npm run build:frontend # Build frontend for production
npm run test:backend   # Test Node.js backend API
npm run test:ai        # Test Django AI API
npm run clean          # Clean node_modules and build files
npm run reset:db       # Reset and reinitialize database
```

### Frontend Development
```bash
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
```

### Backend Development
```bash
cd backend
npm run dev          # Start with nodemon (auto-reload)
npm start           # Production start
npm run init-db     # Initialize chat database
```

### AI Models Development
```bash
cd ai_models
source ../.venv/bin/activate
python manage.py runserver 8000    # Start Django server
python manage.py migrate          # Run migrations
python manage.py check            # Check for issues
```

---

## 📡 API Endpoints

### Node.js Backend (Chat) - Port 5000
```bash
POST /api/chats                    # Create new chat
GET  /api/chats                    # Get chat history
GET  /api/chat/:id                 # Get specific chat
POST /api/chat/:id/message         # Send message to chat
```

### Django AI Models - Port 8000
```bash
GET  /api/get-weather/?location=<location>     # Get weather data
POST /api/analyze-crop/                        # Analyze crop images
```

### Example Usage
```bash
# Test weather endpoint
curl "http://localhost:8000/api/get-weather/?location=Nairobi"

# Test chat creation
curl -X POST http://localhost:5000/api/chats -F "message=How can I improve my maize crop?"

# Test backend health
curl http://localhost:5000/api/chats
```

---

## 🗂️ Project Structure

```
AgriTech-AI/
├── 📁 frontend/                 # React + TypeScript UI
│   ├── src/
│   │   ├── components/          # UI components
│   │   ├── pages/              # Page components
│   │   ├── utils/              # API services
│   │   └── ui/svgs/            # SVG icons
│   ├── package.json
│   └── vite.config.ts
├── 📁 backend/                  # Node.js chat backend
│   ├── server.js               # Express server
│   ├── init-db.js              # Database setup
│   └── package.json
├── 📁 ai_models/               # Django AI services
│   ├── ai_models_backend/      # Django settings
│   ├── api/                    # AI endpoints
│   │   ├── views.py            # API views
│   │   └── urls.py             # URL routing
│   ├── db.sqlite3              # Shared database
│   ├── manage.py
│   └── requirements.txt
├── .venv/                      # Python virtual environment
├── setup-dev.sh               # Development setup script
├── start-services.sh           # Service startup script
├── package.json                # Root NPM scripts
├── DEVELOPMENT.md              # This file
└── README.md                   # Project overview
```

---

## 🔄 Chat System Architecture

1. **Frontend** creates chat via React → API service
2. **Node.js Backend** stores chat in SQLite database
3. **Cohere AI** generates intelligent agricultural responses
4. **Django AI** provides crop analysis and weather data
5. **Shared Database** maintains persistence across services

### Chat Flow
```
User Input → Frontend → Node.js Backend → SQLite Database
                                      ↓
Cohere AI ← Response Generation ← Chat Storage
```

### Database Schema
```sql
-- Chat tables (created by Node.js backend)
CREATE TABLE chats (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE chat_messages (
    id TEXT PRIMARY KEY,
    chat_id TEXT NOT NULL,
    content TEXT NOT NULL,
    images TEXT,  -- JSON array of base64 images
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    sender TEXT NOT NULL CHECK (sender IN ('user', 'ai')),
    FOREIGN KEY (chat_id) REFERENCES chats (id)
);
```

---

## 🧪 Testing

### Automated Tests
```bash
# Test all APIs
npm run test:backend    # Test Node.js backend
npm run test:ai         # Test Django AI service
```

### Manual Testing

**Test Chat System:**
```bash
# Start backend
cd backend && npm start

# Test chat creation
curl -X POST http://localhost:5000/api/chats -F "message=Test message"

# Get chat history
curl http://localhost:5000/api/chats
```

**Test AI Services:**
```bash
# Start Django
cd ai_models && source ../.venv/bin/activate && python manage.py runserver 8000

# Test weather endpoint
curl "http://localhost:8000/api/get-weather/?location=Nairobi"
```

**Test Frontend:**
1. Start all services: `npm run dev`
2. Open http://localhost:3000
3. Create a new chat
4. Send a message with/without images
5. Verify response from AI

---

## 🚨 Troubleshooting

### Common Issues

**Port Already in Use:**
```bash
# Check what's using the port
lsof -i :3000  # or :5000, :8000

# Kill the process
kill -9 <PID>
```

**Virtual Environment Issues:**
```bash
# Recreate virtual environment
rm -rf .venv
python3 -m venv .venv
source .venv/bin/activate
pip install -r ai_models/requirements.txt
```

**Database Issues:**
```bash
# Reinitialize database
npm run reset:db
```

**Missing Dependencies:**
```bash
# Reinstall all dependencies
npm run clean
npm run install:all
```

**API Key Issues:**
- Ensure all `.env` files are created and contain valid API keys
- Check that `.env` files are in the correct directories
- Verify API keys are active and have proper permissions

### Development Tips

1. **Hot Reloading**: Frontend and backend support hot reloading during development
2. **Database Changes**: Use `npm run reset:db` when changing database schema
3. **Clean Start**: Use `npm run clean` followed by `npm run setup` for fresh installation
4. **Port Conflicts**: Change ports in service configs if defaults are unavailable
5. **Logs**: Check terminal outputs for each service for debugging information

---

## 🔧 Advanced Configuration

### Environment-Specific Settings

**Development:**
- All services run on localhost
- Hot reloading enabled
- Debug mode on
- CORS configured for cross-origin requests

**Production:**
- Build frontend with `npm run build:frontend`
- Use environment variables for API URLs
- Configure proper database (PostgreSQL recommended)
- Set up proper CORS policies
- Use PM2 or similar for process management

### Database Configuration

**SQLite (Development):**
- File: `ai_models/db.sqlite3`
- Shared between Node.js and Django
- Automatic initialization with scripts

**PostgreSQL (Production):**
```bash
# Update Django settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'agritech_ai',
        'USER': 'your_user',
        'PASSWORD': 'your_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

---

## 🤝 Contributing

### Development Workflow

1. **Fork the repository**
2. **Create feature branch:**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Set up development environment:**
   ```bash
   npm run setup
   ```
4. **Make changes and test:**
   ```bash
   npm run dev  # Start all services
   npm run test:backend
   npm run test:ai
   ```
5. **Commit changes:**
   ```bash
   git commit -m 'Add amazing feature'
   ```
6. **Push to branch:**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open Pull Request**

### Code Style

- **Frontend**: ESLint configuration in `frontend/eslint.config.js`
- **Backend**: Follow Node.js best practices
- **Python**: Follow PEP 8 guidelines
- **Commits**: Use conventional commit messages

### Testing Requirements

- Test all API endpoints before submitting PR
- Ensure frontend builds without errors
- Verify all services start correctly
- Check that database operations work

---

## 📚 Additional Resources

- [React Documentation](https://react.dev/)
- [Django Documentation](https://docs.djangoproject.com/)
- [Express.js Documentation](https://expressjs.com/)
- [Vite Documentation](https://vitejs.dev/)
- [Plant.ID API Documentation](https://plant.id/docs)
- [Cohere AI Documentation](https://docs.cohere.ai/)

---

**Let's code :)**
