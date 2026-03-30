#!/bin/bash

echo "🔧 Installing Telegram Bot Dependencies..."
echo ""

# Remove problematic lock files
echo "1. Cleaning npm cache and lock files..."
rm -rf node_modules/.cache
rm -f package-lock.json

# Install dependencies
echo ""
echo "2. Installing dependencies (this may take a minute)..."
npm install --legacy-peer-deps

echo ""
echo "✅ Installation complete!"
echo ""
echo "To test Telegram bot, run:"
echo "  npx tsx \"Google Ads Agent/scripts/test-telegram.ts\""
