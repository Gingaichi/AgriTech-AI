#!/bin/bash

# AgriTech-AI Development Setup Script
echo "🌱 AgriTech-AI Development Setup"
echo "================================="

# Check if we're in the right directory
if [ ! -f "README.md" ] || [ ! -d "frontend" ] || [ ! -d "backend" ] || [ ! -d "ai_models" ]; then
    echo "❌ Please run this script from the AgriTech-AI root directory"
    exit 1
fi

echo "📦 Setting up development environment..."

# 1. Setup Python virtual environment
echo ""
echo "🐍 Setting up Python virtual environment..."
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv .venv
else
    echo "Virtual environment already exists"
fi

# Activate virtual environment and install Python dependencies
echo "Installing Python dependencies..."
source .venv/bin/activate
pip install -r ai_models/requirements.txt

# 2. Setup Node.js dependencies
echo ""
echo "📦 Installing Node.js dependencies..."

# Backend dependencies
echo "Installing backend dependencies..."
cd backend
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "Backend dependencies already installed"
fi
cd ..

# Frontend dependencies  
echo "Installing frontend dependencies..."
cd frontend
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "Frontend dependencies already installed"
fi
cd ..

# 3. Setup database
echo ""
echo "🗄️  Setting up database..."
cd backend
if [ ! -f "../ai_models/db.sqlite3" ]; then
    echo "Initializing chat database..."
    npm run init-db
else
    echo "Database already exists"
fi
cd ..

# 4. Environment variables check
echo ""
echo "🔐 Checking environment variables..."

# Check main .env
if [ ! -f ".env" ]; then
    echo "Creating main .env file..."
    echo "PLANTID_API_KEY=your_plantid_api_key_here" > .env
    echo "⚠️  Please add your Plant.ID API key to .env"
else
    echo "Main .env file exists"
fi

# Check backend .env
if [ ! -f "backend/.env" ]; then
    echo "Creating backend .env file..."
    echo "COHERE_API_KEY=your_cohere_api_key_here" > backend/.env
    echo "⚠️  Please add your Cohere API key to backend/.env"
else
    echo "Backend .env file exists"
fi

# Check frontend .env
if [ ! -f "frontend/.env" ]; then
    echo "Creating frontend .env file..."
    echo "VITE_BACKEND_URL=http://localhost:5000" > frontend/.env
    echo "✅ Frontend .env file created"
else
    echo "Frontend .env file exists"
fi

# 5. Run Django migrations
echo ""
echo "📋 Running Django migrations..."
cd ai_models
source ../.venv/bin/activate
python manage.py migrate
cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Add your API keys to the .env files:"
echo "      - Plant.ID API key in .env"
echo "      - Cohere API key in backend/.env"
echo ""
echo "   2. Start the services:"
echo "      ./start-services.sh"
echo ""
echo "🌐 Service URLs (when running):"
echo "   - Frontend: http://localhost:3000"
echo "   - Node.js Backend: http://localhost:5000"
echo "   - Django AI: http://localhost:8000"
echo ""
echo "📚 For more information, see README.md"
