#!/bin/bash

# AgriTech-AI Services Startup Script
echo "🌱 Starting AgriTech-AI Services..."

# Function to check if a service is running on a port
check_port() {
    local port=$1
    local service=$2
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port $port is already in use ($service may already be running)"
        return 1
    fi
    return 0
}

# Check ports
echo "📡 Checking available ports..."
check_port 3000 "Frontend (Vite)"
check_port 5000 "Node.js Backend"
check_port 8000 "Django AI Models"

echo ""
echo "📋 Services Overview:"
echo "   Frontend (React + Vite): http://localhost:3000"
echo "   Node.js Backend (Chat): http://localhost:5000"
echo "   Django AI Models: http://localhost:8000"
echo ""

# Check if virtual environment exists
if [ ! -d ".venv" ]; then
    echo "❌ Virtual environment not found. Please create one first:"
    echo "   python3 -m venv .venv"
    echo "   source .venv/bin/activate"
    echo "   pip install -r ai_models/requirements.txt"
    exit 1
fi

# Ask user which services to start
echo "Which services would you like to start?"
echo "1) All services (recommended)"
echo "2) Frontend only"
echo "3) Backend only (Node.js + Django)"
echo "4) Custom selection"
read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo "🚀 Starting all services..."
        
        # Start Django AI Models
        echo "Starting Django AI Models on port 8000..."
        cd ai_models
        source ../.venv/bin/activate
        python manage.py runserver 8000 &
        DJANGO_PID=$!
        cd ..
        
        # Start Node.js Backend
        echo "Starting Node.js Backend on port 5000..."
        cd backend
        npm start &
        BACKEND_PID=$!
        cd ..
        
        # Start Frontend
        echo "Starting Frontend on port 3000..."
        cd frontend
        npm run dev &
        FRONTEND_PID=$!
        cd ..
        
        echo ""
        echo "✅ All services started!"
        echo "🌐 Frontend: http://localhost:3000"
        echo "🔗 Node.js Backend: http://localhost:5000"
        echo "🤖 Django AI: http://localhost:8000"
        echo ""
        echo "Press Ctrl+C to stop all services"
        
        # Wait for interrupt
        trap 'echo ""; echo "🛑 Stopping all services..."; kill $FRONTEND_PID $BACKEND_PID $DJANGO_PID 2>/dev/null; exit' INT
        wait
        ;;
    2)
        echo "🚀 Starting Frontend only..."
        cd frontend && npm run dev
        ;;
    3)
        echo "🚀 Starting Backend services..."
        
        # Start Django AI Models
        echo "Starting Django AI Models..."
        cd ai_models
        source ../.venv/bin/activate
        python manage.py runserver 8000 &
        DJANGO_PID=$!
        cd ..
        
        # Start Node.js Backend
        echo "Starting Node.js Backend..."
        cd backend
        npm start &
        BACKEND_PID=$!
        cd ..
        
        echo "✅ Backend services started!"
        echo "Press Ctrl+C to stop services"
        
        trap 'echo ""; echo "🛑 Stopping services..."; kill $BACKEND_PID $DJANGO_PID 2>/dev/null; exit' INT
        wait
        ;;
    4)
        echo "🔧 Custom service selection..."
        echo "Available services:"
        echo "- frontend: React + Vite development server"
        echo "- backend: Node.js Express server with chat persistence"
        echo "- ai: Django AI models service"
        echo ""
        echo "Start services manually:"
        echo "Frontend: cd frontend && npm run dev"
        echo "Backend:  cd backend && npm start"
        echo "AI:       cd ai_models && source ../.venv/bin/activate && python manage.py runserver 8000"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac
