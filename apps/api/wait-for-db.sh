#!/bin/sh
# wait-for-db.sh - Wait for PostgreSQL to be ready

set -e

echo "Waiting for PostgreSQL to be ready..."

# Simple sleep to give PostgreSQL time to start
sleep 5

# Try to run migrations with retries
max_retries=10
retry_count=0

until npx prisma migrate deploy 2>/dev/null; do
  if [ $retry_count -ge $max_retries ]; then
    echo "Timeout waiting for PostgreSQL after $max_retries attempts"
    exit 1
  fi
  echo "PostgreSQL not ready, retrying... (attempt $((retry_count + 1))/$max_retries)"
  sleep 3
  retry_count=$((retry_count + 1))
done

echo "PostgreSQL is up and migrations applied successfully"
