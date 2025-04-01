#!/bin/sh
set -e

# Wait for database to be available
echo "🔍 Checking database connectivity..."
node ./scripts/db-check.js

# Run database migrations if needed
if [ "$MIGRATE_ON_STARTUP" = "true" ]; then
  echo "🔄 Running database migrations..."
  npm run db:push
else
  echo "⏭️ Skipping automatic migrations (MIGRATE_ON_STARTUP not set to true)"
fi

# Check for daily rewards script 
if [ "$PROCESS_REWARDS_ON_STARTUP" = "true" ]; then
  echo "💰 Processing daily rewards..."
  node ./scripts/process-rewards.js
fi

# Execute the main command
echo "🚀 Starting application..."
exec "$@"