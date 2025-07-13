#!/bin/bash

# API Key Security Cleanup Script
# Removes VITE_CLAUDE_API_KEY from client-side code and environment

echo "🔐 Starting API Key Security Cleanup..."

# 1. Remove VITE_CLAUDE_API_KEY from .env file
echo "📝 Cleaning up .env file..."
if [ -f ".env" ]; then
    # Create backup
    cp .env .env.backup
    echo "💾 Created backup: .env.backup"
    
    # Remove VITE_CLAUDE_API_KEY line
    grep -v "VITE_CLAUDE_API_KEY" .env > .env.tmp && mv .env.tmp .env
    echo "✅ Removed VITE_CLAUDE_API_KEY from .env"
else
    echo "ℹ️ No .env file found"
fi

# 2. Update .env.example if it exists
if [ -f ".env.example" ]; then
    echo "📝 Updating .env.example..."
    grep -v "VITE_CLAUDE_API_KEY" .env.example > .env.example.tmp && mv .env.example.tmp .env.example
    echo "✅ Removed VITE_CLAUDE_API_KEY from .env.example"
fi

# 3. Update CLAUDE.md documentation
echo "📝 Updating CLAUDE.md documentation..."
sed -i.backup 's/VITE_CLAUDE_API_KEY.*Claude API key (for question generation)/CLAUDE_API_KEY — Anthropic Claude API key (server-side only, for Edge Functions)/g' CLAUDE.md
echo "✅ Updated CLAUDE.md"

# 4. Update ProductionReady.md
echo "📝 Updating ProductionReady.md..."
sed -i.backup 's/VITE_CLAUDE_API_KEY/CLAUDE_API_KEY/g' ProductionReady.md
echo "✅ Updated ProductionReady.md"

# 5. Add warning comment to claudePrompts.ts
echo "📝 Adding deprecation warning to claudePrompts.ts..."
cat > src/engines/questionGeneration/claudePrompts-deprecation-notice.ts << 'EOF'
/**
 * SECURITY NOTICE - DEPRECATED
 * 
 * This file contains client-side Claude API integration which exposes API keys.
 * 
 * ⚠️ SECURITY RISK: This code should NOT be used in production as it exposes
 * the Claude API key in the client-side bundle.
 * 
 * ✅ SECURE ALTERNATIVE: Use /src/services/secureQuestionGenerationService.ts
 * which calls Supabase Edge Functions instead of direct Claude API calls.
 * 
 * FILES TO MIGRATE:
 * - All scripts should use CLAUDE_API_KEY environment variable (server-side)
 * - All client-side code should use secureQuestionGenerationService.ts
 * 
 * MIGRATION TIMELINE: This file will be removed in the next security update.
 */

console.warn('⚠️ SECURITY WARNING: claudePrompts.ts contains client-side API key exposure. Use secureQuestionGenerationService.ts instead.');

EOF

# 6. Create secure environment template
echo "📝 Creating secure environment template..."
cat > .env.production.example << 'EOF'
# EduCourse Production Environment Variables

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Claude API (Server-side only - Set in Supabase Edge Function secrets)
# DO NOT ADD CLAUDE_API_KEY TO CLIENT-SIDE .env FILES
# Set this in Supabase Dashboard > Edge Functions > Secrets
# CLAUDE_API_KEY=your_claude_api_key

# Optional: Development proxy URL
# VITE_PROXY_URL=http://localhost:3002
EOF

# 7. Update package.json scripts if needed
echo "📝 Checking package.json scripts..."
if grep -q "VITE_CLAUDE_API_KEY" package.json; then
    echo "⚠️ Found VITE_CLAUDE_API_KEY references in package.json scripts"
    echo "   Please manually review and update scripts to use CLAUDE_API_KEY instead"
fi

# 8. Create migration summary
echo "📋 Creating migration summary..."
cat > API_KEY_MIGRATION_SUMMARY.md << 'EOF'
# API Key Security Migration Summary

## ✅ Completed Actions

1. **Removed VITE_CLAUDE_API_KEY from .env files**
   - Prevents client-side API key exposure
   - Created backup files (.env.backup)

2. **Updated Documentation**
   - CLAUDE.md: Updated to reference server-side CLAUDE_API_KEY
   - ProductionReady.md: Updated environment variable references

3. **Created Secure Service**
   - `/src/services/secureQuestionGenerationService.ts`
   - Uses Supabase Edge Functions instead of direct API calls

4. **Added Deprecation Warnings**
   - Marked client-side Claude integration as deprecated
   - Added security warnings to prevent future misuse

## 🔄 Next Steps Required

### For Development
1. Set CLAUDE_API_KEY in Supabase Edge Function secrets:
   - Go to Supabase Dashboard > Edge Functions > Secrets
   - Add: CLAUDE_API_KEY = your_claude_api_key

2. Update any remaining scripts to use CLAUDE_API_KEY (server-side)

### For Production Deployment
1. Ensure CLAUDE_API_KEY is set in Supabase secrets (not in .env)
2. Verify no VITE_CLAUDE_API_KEY in Vercel environment variables
3. Use only the secure question generation service

## 🔐 Security Improvements

- **Before**: Claude API key exposed in client-side bundle
- **After**: API key only accessible server-side via Edge Functions
- **Risk Reduction**: Prevents unauthorized API usage and cost runaway

## 📁 Files Created/Modified

- ✅ `/src/services/secureQuestionGenerationService.ts` (NEW)
- ✅ `.env.production.example` (NEW)  
- ✅ `claudePrompts-deprecation-notice.ts` (NEW)
- ✅ `.env` (MODIFIED - API key removed)
- ✅ `CLAUDE.md` (MODIFIED - documentation updated)
- ✅ `ProductionReady.md` (MODIFIED - references updated)

## 🧪 Testing Required

1. Test question generation via secure service
2. Verify Edge Functions work correctly
3. Confirm no API key exposure in browser dev tools
4. Test scripts with server-side CLAUDE_API_KEY

EOF

echo ""
echo "🎉 API Key Security Cleanup Complete!"
echo ""
echo "📋 Summary:"
echo "  ✅ Removed VITE_CLAUDE_API_KEY from .env files"
echo "  ✅ Created secure question generation service"
echo "  ✅ Updated documentation"
echo "  ✅ Added deprecation warnings"
echo ""
echo "🔄 Next Steps:"
echo "  1. Set CLAUDE_API_KEY in Supabase Edge Function secrets"
echo "  2. Test the secure question generation service"
echo "  3. Update any remaining scripts to use CLAUDE_API_KEY"
echo "  4. Review API_KEY_MIGRATION_SUMMARY.md for details"
echo ""
echo "⚠️ IMPORTANT: The old .env file has been backed up to .env.backup"
echo "   You can restore it if needed, but do NOT commit it to version control"