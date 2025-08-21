#!/bin/sh
set -e

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
exec npm start
