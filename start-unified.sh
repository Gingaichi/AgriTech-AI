#!/bin/sh
set -e

# Set environment variables
export PYTHONPATH=/app
export DJANGO_SETTINGS_MODULE=ai_models_backend.settings
export DATABASE_PATH=${DATABASE_PATH:-/app/data/db.sqlite3}

# Initialize databases
echo "Initializing Django database..."
cd /app/ai_models && python manage.py migrate

echo "Initializing Node.js database..."
cd /app/backend && node init-db.js

# Start Django in background
echo "Starting Django AI models service..."
cd /app/ai_models
python manage.py runserver 0.0.0.0:8000 &
DJANGO_PID=$!

# Wait for Django to start
sleep 5

# Start Node.js backend in foreground
echo "Starting Node.js backend..."
cd /app/backend
exec node server.js
