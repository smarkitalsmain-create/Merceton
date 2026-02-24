#!/bin/bash

# Database Schema Sync Script
# Syncs Prisma schema to database using db push (dev-friendly)

set -e

echo "🔄 Syncing database schema..."
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL is not set"
  echo "   Please set DATABASE_URL in .env.local"
  exit 1
fi

# Ask for confirmation if using force-reset
if [ "$1" = "--force-reset" ] || [ "$1" = "--reset" ]; then
  echo "⚠️  WARNING: This will DELETE ALL DATA in the database!"
  echo "   Database: $(echo $DATABASE_URL | sed 's/:[^:]*@/:***@/')"
  read -p "   Continue? (yes/no): " confirm
  if [ "$confirm" != "yes" ]; then
    echo "   Cancelled."
    exit 0
  fi
  echo ""
  echo "🗑️  Resetting database and syncing schema..."
  npx prisma db push --force-reset
else
  echo "📦 Syncing schema to database (keeping existing data)..."
  npx prisma db push --accept-data-loss
fi

echo ""
echo "🔧 Regenerating Prisma client..."
npx prisma generate

echo ""
echo "✅ Schema sync complete!"
echo ""
echo "Next steps:"
echo "  1. Restart dev server: npm run dev"
echo "  2. Verify tables: npm run db:readiness"
echo ""
