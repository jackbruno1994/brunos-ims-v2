#!/bin/sh
# wait-for-db.sh - Wait for PostgreSQL to be ready

set -e

host="${DB_HOST:-db}"
port="${DB_PORT:-5432}"
timeout="${DB_TIMEOUT:-30}"

echo "Waiting for PostgreSQL at $host:$port..."

waited=0
until nc -z "$host" "$port" || [ $waited -ge $timeout ]; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 1
  waited=$((waited + 1))
done

if [ $waited -ge $timeout ]; then
  echo "Timeout waiting for PostgreSQL"
  exit 1
fi

echo "PostgreSQL is up - executing command"
