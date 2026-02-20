# EduCoach Question Generation - Quick Reference

## System Overview
- **AI Model**: Claude Sonnet 4 (claude-sonnet-4-20250514)
- **Generation Method**: Prompt-based with 2-stage validation
- **Supported Tests**: NAPLAN (Years 5, 7), NSW Selective, VIC Selective, EduTest, ACER
- **Database**: Supabase PostgreSQL
- **Codebase**: TypeScript, ~15,000 lines across generation engine

## Generation Pipeline at a Glance

```
1. Gap Analysis     -> Find missing questions in each section
2. Passage Gen      -> Create passages (narrative/informational/persuasive)
3. Question Gen     -> Create questions based on curriculum
4. 2-Stage Valid    -> Hallucination + Answer verification
5. Store            -> Save to Supabase if valid
6. Report           -> Display statistics and results
```

## Key Files

| File | Purpose | Lines | Status |
|------|---------|-------|--------|
| `claudePrompts.ts` | Prompt building & API calls | 1,300 | Core |
| `questionGeneration.ts` | Individual question gen | 400 | Core |
| `batchGeneration.ts` | Full test generation | 1,000 | Core |
| `passageGeneration.ts` | Passage creation | 1,200 | Core |
| `validationPipeline.ts` | Multi-stage validation | 400 | Critical |
| `questionValidator.ts` | Two-stage validation | 250 | Critical |
| `supabaseStorage.ts` | Database operations | 500 | Core |
| `curriculumData.ts` | Test structures | 5,000 | Reference |

## Critical Weaknesses

### CRITICAL (Data Quality Risk)
1. **No Distractor Validation** - Wrong answers not verified
2. **Limited Hallucination Detection** - Only 4 regex patterns

### HIGH (Performance/Cost)
3. **Excessive Prompt Length** - 6,000-7,000 tokens per question
4. **No Temperature Setting** - Unpredictable variation
5. **Simple Diversity Check** - Only tracks 10 recent questions

### MEDIUM (Quality Risk)
6. **No Semantic Similarity** - String matching only
7. **Writing Validation Skipped** - No quality checks on essays
8. **No Distractor Analysis** - Doesn't track effectiveness

## What's Working Well

- Multi-stage validation with automatic regeneration
- Curriculum-based gap analysis
- Context-aware diversity tracking
- Passage type rotation system
- Test-specific authenticity guidance
- Exponential backoff retry logic

## Recommended Quick Wins

### Immediate (High Impact/Low Effort)
1. **Add Distractor Validation**
   - Have Claude verify each wrong answer is actually wrong
   - Cost: ~100 tokens per question
   - Impact: Prevents invalid distractors

2. **Expand Hallucination Patterns**
   - Add 30+ variations to regex patterns
   - Cost: 0 tokens (regex only)
   - Impact: Catch most hallucinations

3. **Set Explicit Temperature**
   - Add `"temperature": 1.0` to API call
   - Cost: 0 (config only)
   - Impact: Predictable generation

### Short-term (Medium Impact)
4. **Semantic Diversity Detection**
   - Use embeddings to find similar questions
   - Cost: ~50 tokens per question
   - Impact: Better diversity assurance

5. **Prompt Optimization**
   - Split into system + few-shot examples
   - Reduce from 6,000 to 3,000 tokens
   - Cost: 50% reduction, slight quality impact
   - Impact: Cost savings, faster generation

6. **Writing Section Validation**
   - Apply basic validation to writing questions
   - Cost: 0 tokens (pattern matching)
   - Impact: Quality assurance for essays

## API Cost Analysis

### Current Cost per Question
- Generation: ~6,000 tokens × $0.003 = $0.018
- Validation: ~400 tokens × $0.003 = $0.001
- **Total: ~$0.02 per question**

### Full Test (100 questions)
- Initial: 600,000 tokens = $1.80
- Validation: 60,000 tokens = $0.18
- **Total: ~$2.00 per test**

### Potential Optimization
- Reduce prompt to 3,000 tokens
- Cost per question: ~$0.010
- Per test: ~$1.00 (50% savings)

## Validation Flow Details

```
QUESTION VALIDATION:

1. Hallucination Check (Stage 1)
   ├─> Search for: "let me", "my mistake", etc.
   ├─> If found: FAIL + Regenerate
   └─> If clear: Continue

2. Answer Verification (Stage 2)
   ├─> Call Claude API: "Solve this independently"
   ├─> Compare original answer to independent
   ├─> If different: FAIL + Regenerate
   └─> If match: PASS

3. Regeneration Loop (Max 5 attempts)
   ├─> On failure: Wait 2 seconds
   ├─> Call API to generate new question
   ├─> Re-validate
   └─> Accept or reject
```

**Result**: Valid questions have passed both checks
**Cost**: Each validation round adds ~400 tokens

## Common Issues & Solutions

### Issue: High Regeneration Rate
**Symptom**: Many questions fail validation
**Root Cause**: 
- Prompt too complex
- Distractor guidance unclear
- Difficult sub-skill

**Solution**:
- Simplify prompt section
- Provide concrete examples
- Adjust difficulty distribution

### Issue: Timeout on Batch Generation
**Symptom**: Generation stalls after N questions
**Root Cause**:
- API rate limit
- Supabase connection issue
- Failed JSON parsing loop

**Solution**:
- Add rate limiting (1 req/sec)
- Check Supabase status
- Add timeout to validation loop

### Issue: Questions Too Similar
**Symptom**: Users report duplicates
**Root Cause**:
- Diversity tracking only 10 questions
- No semantic similarity detection
- Random distribution ignores history

**Solution**:
- Increase tracking window to 50
- Add embedding-based similarity
- Implement weighted random selection

## Debugging Commands

```bash
# Generate ACER questions with validation enabled
npx ts-node scripts/generation/generate-all-remaining-acer-scholarship-v2.ts

# Check validation statistics
grep "Validation Statistics:" output.log

# Count questions by difficulty
psql "postgresql://..." -c "SELECT difficulty, COUNT(*) FROM questions GROUP BY difficulty;"

# Find problematic sub-skills
grep "❌ Question validation failed" output.log | sort | uniq -c | sort -rn
```

## Database Schema (Key Tables)

```sql
-- Questions table
CREATE TABLE questions (
  id uuid PRIMARY KEY,
  test_type text,
  section_name text,
  sub_skill text,
  question_text text,
  answer_options text[],
  correct_answer text,
  solution text,
  difficulty integer (1-3),
  response_type text,
  has_visual boolean,
  visual_data jsonb,
  visual_svg text,
  created_at timestamp
);

-- Passages table
CREATE TABLE passages (
  id uuid PRIMARY KEY,
  test_type text,
  section_name text,
  title text,
  content text,
  word_count integer,
  passage_type text,
  main_themes text[],
  difficulty integer,
  created_at timestamp
);
```

## Environment Variables Required

```
VITE_CLAUDE_API_KEY=sk-ant-...          # Claude API key
VITE_SUPABASE_URL=https://...           # Supabase project URL
VITE_SUPABASE_ANON_KEY=eyJhbGc...       # Supabase anon key
VITE_SUPABASE_SERVICE_ROLE_KEY=...      # Service role (for scripts)
```

## Performance Metrics

### Typical Execution Times
- Single question generation: 2-4 seconds
- Single question validation: 1-2 seconds
- Full test (100 questions): 5-10 minutes
- Batch generation (6 test types): 30-60 minutes

### Success Rates
- Initial generation: ~85-90% pass validation
- After 1 regeneration: ~95%+
- Questions rejected (after 5 attempts): <1%

## Next Steps for Improvement

**Phase 1 (Week 1)**: Quick wins
- Add distractor validation
- Expand hallucination patterns
- Set temperature parameter

**Phase 2 (Week 2)**: Medium-term
- Reduce prompt length
- Add semantic similarity
- Improve writing validation

**Phase 3 (Month 1)**: Long-term
- Implement learning loop
- Add A/B testing framework
- Distractor effectiveness tracking

## Related Documentation Files

- `/tmp/question_generation_analysis.md` - Comprehensive analysis
- `/tmp/question_generation_technical_deepdive.md` - Code-level details
- Project README: `docs/architecture/WEBSITE_STRUCTURE_ANALYSIS.md`

---

**Last Updated**: 2026-01-30
**Analyzed By**: Claude Code
**Codebase**: EduCoach Prep Portal v2

