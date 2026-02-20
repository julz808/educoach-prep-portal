# V1 Question Generation Engine - DEPRECATED

⚠️ **WARNING: This directory contains the V1 generation engine which is DEPRECATED.**

## Status: Deprecated (Do Not Use for New Development)

This V1 engine is kept ONLY for backwards compatibility with existing users who have questions stored in the `questions` table in Supabase.

## For New Question Generation

**Use the V2 engine instead:**
- **Location:** `src/engines/questionGeneration/v2/`
- **Documentation:** `docs/V2_QUESTION_ENGINE_MASTER_GUIDE.md`
- **Test Script:** `scripts/generation/test-acer-math-10q-v2-engine.ts`

## V2 vs V1 Comparison

| Feature | V1 (Deprecated) | V2 (Current) |
|---------|-----------------|--------------|
| **Curriculum Data** | curriculumData (old) | curriculumData_v2 |
| **Database Table** | `questions` | `questions_v2` |
| **Visual Generation** | Basic/disabled | Full support with LLM visual generation |
| **Visual Tagging** | Sub-skill level | Individual question level |
| **Validation** | Basic | Two-stage (hallucination + answer verification) |
| **Diversity Tracking** | Limited | Advanced (names, topics, scenarios) |
| **Example Distribution** | Manual | Balanced automatic distribution |
| **Difficulty Control** | Manual | Strategy-based (linear/curved/weighted) |

## V1 Files in This Directory

### Core Generation
- `curriculumBasedGeneration.ts` - Main generation engine (writes to `questions` table)
- `batchGeneration.ts` - Batch processing
- `unifiedSectionGeneration.ts` - Section-level generation

### Storage
- `supabaseStorage.ts` - Database operations (writes to `questions` table)

### Supporting Modules
- `claudePrompts.ts` - Prompt building for Claude API
- `passageGeneration.ts` - Passage generation
- `questionValidator.ts` - Question validation
- Various other helper modules

## Why V1 is Deprecated

1. **Old Database Schema:** Uses `questions` table which lacks fields for:
   - Individual question visual tagging
   - LLM visual appropriateness flags
   - Enhanced curriculum metadata
   - Quality metrics

2. **Limited Visual Support:** Visual requirements only at sub-skill level, not individual questions

3. **Less Sophisticated Validation:** Lacks the two-stage validation pipeline (hallucination + answer verification)

4. **No Balanced Distribution:** Doesn't have automatic example distribution planning

5. **Manual Difficulty Assignment:** No difficulty strategy system

## Migration Path

If you need to use old V1 generation:
1. Import from this directory (but please don't do this for new work)
2. Questions will go to `questions` table
3. Existing users can still access their questions

For all new development:
1. Use `src/engines/questionGeneration/v2/`
2. Questions go to `questions_v2` table
3. Full modern feature set available

## Keeping V1 Around

The `questions` table in Supabase is still being used by current users, so we keep:
- ✅ The V1 codebase (for reference and emergency fixes)
- ✅ The `questions` table in database (for existing user data)
- ❌ No new questions should be generated into V1/questions table

---

**Last Updated:** February 10, 2026
**Status:** Deprecated but maintained for backwards compatibility
