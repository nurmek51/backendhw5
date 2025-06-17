#!/bin/bash

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL..."
while ! nc -z db 5432; do   
  sleep 0.1
done
echo "PostgreSQL is up!"

# Run database migrations/schema creation (now here, after DB is ready)
python -c "from src.database import Base, engine; Base.metadata.create_all(bind=engine)"

# Start Uvicorn
exec uvicorn src.main:app --host 0.0.0.0 --port 8000 