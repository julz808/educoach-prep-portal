# DEPRECATED: Client-Side Question Generation

⚠️ **This directory contains DEPRECATED code**

## Status: LEGACY CODE - DO NOT USE

The files in this directory were used for client-side question generation, which exposed API keys in the browser. This has been replaced with secure server-side Edge Functions.

## Migration Complete ✅

**Old approach (INSECURE):**
- Client-side API calls to Claude
- API key exposed in browser bundle
- Files: `claudePrompts.ts`, `questionGeneration.ts`, etc.

**New approach (SECURE):**
- Server-side Edge Functions in `/supabase/functions/`
- API key protected in Supabase environment
- Files: `generate-questions/index.ts`, `assess-writing/index.ts`

## How to Use New System

Instead of importing from this directory, use the secure service:

```typescript
// OLD (don't use):
import { callClaudeAPI } from '../engines/questionGeneration/claudePrompts';

// NEW (secure):
import { secureQuestionGenerationService } from '../services/secureQuestionGenerationService';
const result = await secureQuestionGenerationService.generateQuestions(request);
```

## Files in This Directory

All files here are kept for reference but should NOT be used:
- `claudePrompts.ts` - Legacy API calling functions
- `questionGeneration.ts` - Old generation logic
- `validationPipeline.ts` - Old validation
- etc.

**Last Updated:** July 13, 2025  
**Migration Completed:** ✅ API keys secured in Edge Functions