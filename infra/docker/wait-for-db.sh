#!/bin/sh
# wait-for-db.sh - Wait for database to be ready

set -e

host="$1"
port="${2:-5432}"
shift 2

echo "Waiting for database at $host:$port..."

max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
  if nc -z "$host" "$port" 2>/dev/null; then
    echo "Database is ready!"
    sleep 2  # Give it a couple more seconds to fully initialize
    exit 0
  fi
  
  attempt=$((attempt + 1))
  echo "Waiting for database... (attempt $attempt/$max_attempts)"
  sleep 2
done

echo "ERROR: Database not ready after $max_attempts attempts"
exit 1
