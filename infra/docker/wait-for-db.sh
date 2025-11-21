#!/bin/sh
# wait-for-db.sh - Wait for database to be ready

set -e

host="$1"
port="${2:-5432}"
shift 2

echo "Waiting for database at $host:$port..."

# Simple wait loop - let Prisma handle the actual connection testing
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
  attempt=$((attempt + 1))
  echo "Waiting for database... (attempt $attempt/$max_attempts)"
  sleep 2
  
  # After a reasonable wait, assume DB is up and let Prisma handle errors
  if [ $attempt -ge 10 ]; then
    echo "Proceeding after $attempt attempts - Prisma will handle connection issues"
    exit 0
  fi
done

echo "Proceeding after waiting - Prisma will handle connection issues"
exit 0
