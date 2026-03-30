#!/bin/bash
# Test Phase 1 data collection script

echo "🧪 Testing SEO Agent Phase 1: Data Collection"
echo "=============================================="
echo ""

# Check environment variables
echo "📋 Checking environment variables..."
if [ -z "$VITE_SUPABASE_URL" ]; then
  echo "❌ VITE_SUPABASE_URL not set"
  exit 1
fi
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "❌ SUPABASE_SERVICE_ROLE_KEY not set"
  exit 1
fi
if [ -z "$GHOST_API_URL" ]; then
  echo "❌ GHOST_API_URL not set"
  exit 1
fi
echo "✅ Environment variables OK"
echo ""

# Run the script
echo "🚀 Running collect-seo-snapshots.ts..."
echo ""
npx tsx "SEO Agent/scripts/collect-seo-snapshots.ts"
