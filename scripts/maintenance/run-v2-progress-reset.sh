#!/bin/bash

# ============================================================================
# V2 PROGRESS RESET EXECUTION SCRIPT
# ============================================================================
# This script safely executes the V2 progress reset
#
# WHAT IT DOES:
#   ✅ Resets all user progress (sessions, attempts, scores)
#   ✅ Preserves all user accounts and profiles
#   ✅ Preserves all product access and subscriptions
#   ✅ Gives everyone a fresh start with V2 questions
#
# USAGE:
#   chmod +x scripts/maintenance/run-v2-progress-reset.sh
#   ./scripts/maintenance/run-v2-progress-reset.sh
# ============================================================================

set -e  # Exit on error

echo "============================================================================"
echo "V2 PROGRESS RESET SCRIPT"
echo "============================================================================"
echo ""
echo "⚠️  WARNING: This will delete ALL user progress data!"
echo ""
echo "What will be DELETED:"
echo "  ❌ All test sessions (practice, drill, diagnostic)"
echo "  ❌ All question attempts and responses"
echo "  ❌ All performance metrics and insights"
echo "  ❌ All writing assessments"
echo ""
echo "What will be PRESERVED:"
echo "  ✅ User accounts and authentication"
echo "  ✅ User profiles (names, emails, details)"
echo "  ✅ Product access and subscriptions"
echo "  ✅ Payment records"
echo "  ✅ All V2 questions and passages"
echo ""
echo "============================================================================"
echo ""

# Ask for confirmation
read -p "Are you sure you want to proceed? Type 'RESET' to confirm: " confirmation

if [ "$confirmation" != "RESET" ]; then
    echo ""
    echo "❌ Reset cancelled. No changes made."
    exit 0
fi

echo ""
echo "🔄 Starting reset process..."
echo ""

# Check if connected to Supabase
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npx not found. Please install Node.js"
    exit 1
fi

# Execute the SQL script
echo "📝 Executing SQL script..."
npx supabase db query -f scripts/maintenance/reset-all-user-progress-v2.sql

# Check if successful
if [ $? -eq 0 ]; then
    echo ""
    echo "============================================================================"
    echo "✅ SUCCESS!"
    echo "============================================================================"
    echo ""
    echo "All user progress has been reset!"
    echo ""
    echo "Next steps:"
    echo "  1. All users will start fresh with V2 questions"
    echo "  2. Dashboard metrics will reset to 0"
    echo "  3. Users will see the announcement banner on next login"
    echo "  4. All new progress will be tracked against V2 questions"
    echo ""
    echo "============================================================================"
else
    echo ""
    echo "❌ ERROR: Reset failed. Please check the error messages above."
    echo ""
    exit 1
fi
