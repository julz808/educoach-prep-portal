# Regeneration vs Manual Fix - Decision Analysis

## The Question

Should we **regenerate all 344 visual questions from scratch** with improved curriculum data OR **manually fix existing questions**?

---

## Option 1: Regenerate All Visual Questions

### How It Would Work

1. **Delete all 344 visual questions** from database
2. **Update curriculum data v2** with improvements
3. **Add visual generation rules** to ensure text completeness
4. **Regenerate all questions** using V2 engine
5. **Validate** each question automatically

### Pros ✅

1. **Clean slate** - No legacy issues or hallucinations
2. **Consistent quality** - All questions follow same improved standards
3. **Automated process** - Less manual work overall
4. **V2 engine improvements included:**
   - Better validation (structure, correctness, duplicates)
   - Opus 4.5 for visual generation (superior spatial reasoning)
   - Haiku 4.5 for answer verification
   - Hallucination detection built-in
   - Quality scoring for each question

5. **Can enforce text-first approach:**
   - Curriculum data specifies table data in text
   - Visual is generated FROM the text data
   - Text is always complete and sufficient

6. **Cost effective:**
   - Generation is automated
   - V2 engine already built and tested
   - No manual data entry needed

7. **Future-proof:**
   - Establishes pattern for all future questions
   - Curriculum data becomes source of truth
   - Easy to regenerate if issues found

### Cons ❌

1. **Lose existing questions** (though they have issues)
2. **Need to update curriculum data first** (additional work)
3. **Generation cost:**
   - 344 questions × $0.10-0.20 per question = **$34-68**
   - Plus validation costs
   - **Total: ~$50-100**

4. **Time required:**
   - Update curriculum data: 1-2 days
   - Generate 344 questions: 3-4 hours (automated)
   - Validate and review: 2-3 days
   - **Total: 4-6 days**

5. **Risk of new issues:**
   - Generation might create different problems
   - Need to spot-check quality
   - May need multiple regeneration cycles

---

## Option 2: Manual Fix Existing Questions

### How It Would Work

1. **Install markdown table renderer** (frontend)
2. **Fix 89 table questions** (already have data)
3. **Fix 107 problematic questions** (add data manually)
4. **Verify 148 good questions** (quick check)

### Pros ✅

1. **Incremental** - Can fix over time
2. **Keep existing questions** - Don't lose work already done
3. **More control** - Manual review of each fix
4. **No generation cost** - Just development time

### Cons ❌

1. **Labor intensive:**
   - 107 questions need manual data entry
   - Each requires review and editing
   - 5-10 minutes per question
   - **Total: 9-18 hours of manual work**

2. **Timeline longer:**
   - Frontend: 2 days
   - Manual fixes: 2-3 weeks
   - **Total: 2.5-3.5 weeks**

3. **Inconsistent quality:**
   - Different people may fix differently
   - Hard to ensure uniformity
   - Legacy issues may persist

4. **Doesn't solve root cause:**
   - Future questions may have same issues
   - No systematic improvement
   - Band-aid solution

5. **More expensive long-term:**
   - Manual labor costs more than $50-100
   - Opportunity cost of dev time
   - Ongoing maintenance burden

---

## Curriculum Data V2 Capabilities

### Current State

Your V2 curriculum data supports:
- `visualRequirement`: Specify if visual needed
- `visualType`: Type of visual (table, grid, geometry, etc.)
- `visualConfig`: Parameters for visual generation
- `difficultyLevel`: 1-6 scale
- `maxPoints`: Points per question
- `responseType`: multiple_choice or extended_response

### What We Can Add for Text-Complete Questions

```typescript
interface SubSkillDataV2 {
  // ... existing fields ...

  // NEW: Ensure text completeness
  visualStrategy: 'text_first' | 'visual_first' | 'both_needed';

  // NEW: For tables - specify data format
  tableDataInText?: boolean;  // Force table data in question text
  tableFormat?: 'markdown' | 'html';

  // NEW: For geometry - require measurements in text
  requireMeasurementsInText?: boolean;

  // NEW: For grids - specify data format
  gridDataFormat?: 'inline' | 'table' | 'description';

  // NEW: Validation rules
  textCompletenessRequired?: boolean;  // Must be answerable from text alone
}
```

### Updated Generation Approach

```typescript
// In promptBuilder.ts
if (subSkillData.textCompletenessRequired) {
  prompt += `
CRITICAL: This question MUST be answerable from the text alone.
- If generating a table: Include complete table data in markdown format in question text
- If generating a grid: Include all grid values in question text
- If generating geometry: Include ALL measurements in question text
- Visual should enhance but not be required

The visual is supplementary only. Student must be able to solve using text.
`;
}
```

---

## Cost-Benefit Analysis

### Regeneration Approach

| Cost Type | Amount |
|-----------|--------|
| **Development Time** | 1-2 days (update curriculum) |
| **Generation Cost** | $50-100 (API calls) |
| **Validation Time** | 2-3 days (review outputs) |
| **TOTAL COST** | **4-6 days + $50-100** |

### Manual Fix Approach

| Cost Type | Amount |
|-----------|--------|
| **Frontend Development** | 2 days (markdown renderer) |
| **Manual Data Entry** | 9-18 hours (107 questions) |
| **Verification** | 3-5 days (check all fixes) |
| **TOTAL COST** | **2.5-3.5 weeks** |

---

## Recommendation

### ✅ **REGENERATE ALL VISUAL QUESTIONS**

**Why:**

1. **Faster overall** - 4-6 days vs 2.5-3.5 weeks
2. **Cheaper** - $50-100 + 6 days vs 3.5 weeks of labor
3. **Higher quality** - V2 engine has built-in validation
4. **Future-proof** - Establishes correct pattern
5. **Systematic solution** - Fixes root cause, not symptoms
6. **Consistent** - All questions follow same standard
7. **Scalable** - Easy to regenerate if needed

**The V2 engine is specifically built for this:**
- Opus 4.5 for visual generation (best spatial reasoning)
- Haiku 4.5 for validation (cheap, fast)
- Built-in duplicate detection
- Built-in answer verification
- Built-in hallucination checking
- Quality scoring

---

## Regeneration Implementation Plan

### Phase 1: Update Curriculum Data (Days 1-2)

**For each test type with visual questions:**

1. **Review existing visual configurations**
2. **Add text-completeness requirements**
3. **Specify table data in markdown format**
4. **Add measurement requirements for geometry**
5. **Add grid data format specifications**

**Files to update:**
- `src/data/curriculumData_v2/vic-selective.ts`
- `src/data/curriculumData_v2/nsw-selective.ts`
- `src/data/curriculumData_v2/acer-scholarship.ts`
- `src/data/curriculumData_v2/edutest-scholarship.ts`

### Phase 2: Update Generation Prompts (Day 2)

**File:** `src/engines/questionGeneration/v2/promptBuilder.ts`

Add instructions to enforce text completeness:
- Tables: "Include complete table data in markdown format in question_text"
- Grids: "Include all grid values as 'Row 1: [values], Row 2: [values]...'"
- Geometry: "Include ALL shape measurements in question_text"
- Description: "Visual description must include all numerical data"

### Phase 3: Delete Existing Visual Questions (Day 3)

```sql
-- Backup first!
CREATE TABLE questions_v2_visual_backup AS
SELECT * FROM questions_v2
WHERE has_visual = true;

-- Then delete
DELETE FROM questions_v2
WHERE has_visual = true;
```

**Result:** 344 questions removed, backed up

### Phase 4: Regenerate Questions (Day 3-4)

Use existing generation scripts with updated curriculum:

```bash
# VIC Selective (85 visual questions)
npm run generate:vic

# NSW Selective (66 visual questions)
npm run generate:nsw

# EduTest (145 visual questions)
npm run generate:edutest

# ACER (48 visual questions)
npm run generate:acer
```

**Time:** ~3-4 hours automated generation
**Cost:** $50-100 in API calls

### Phase 5: Validation & Review (Days 5-6)

1. **Automated validation** - V2 engine checks all questions
2. **Manual spot-checking** - Review 20 random questions per test type
3. **Text completeness check** - Verify all can be answered from text
4. **Visual quality check** - Ensure visuals enhance but aren't required

### Phase 6: Deploy (Day 6)

1. **Frontend:** Deploy markdown table renderer
2. **Database:** New questions already in place
3. **Monitor:** Check for any issues
4. **Adjust:** Regenerate specific sections if needed

---

## Risk Mitigation

### Risk 1: Generated Questions Still Have Issues

**Mitigation:**
- Update curriculum data carefully
- Add strict validation rules
- Spot-check outputs during generation
- Can regenerate specific sections easily

**Rollback Plan:**
- Keep backup of old questions
- Can restore if regeneration fails
- Only costs time + ~$50-100

### Risk 2: Generation Takes Longer Than Expected

**Mitigation:**
- Run in batches
- Monitor progress
- Parallelize where possible

### Risk 3: Cost Overruns

**Mitigation:**
- Estimate: 344 questions × $0.15 = $52
- Worst case: 344 × $0.30 = $103
- Budget $150 to be safe
- Still cheaper than manual labor

---

## Decision Matrix

| Criteria | Regeneration | Manual Fix | Winner |
|----------|--------------|------------|---------|
| **Speed** | 4-6 days | 2.5-3.5 weeks | ✅ Regeneration |
| **Cost** | $50-100 + 6 days | 3.5 weeks labor | ✅ Regeneration |
| **Quality** | Consistent, validated | Variable | ✅ Regeneration |
| **Future-proof** | Yes | No | ✅ Regeneration |
| **Risk** | Low (can rollback) | Low | ➡️ Tie |
| **Effort** | Automated | Manual | ✅ Regeneration |

**Clear Winner: REGENERATION** 🏆

---

## Next Steps if We Regenerate

1. **Day 1-2:** Update curriculum data with text-completeness requirements
2. **Day 2:** Update generation prompts to enforce text-first approach
3. **Day 3:** Backup and delete existing visual questions
4. **Day 3-4:** Run regeneration scripts (automated)
5. **Day 5-6:** Validate outputs and spot-check quality
6. **Day 6:** Deploy to production

**Total: 6 days, $50-100, clean solution**

---

## Conclusion

**Recommendation: Delete all 344 visual questions and regenerate with improved curriculum data and generation prompts.**

This approach is:
- ✅ **Faster** (6 days vs 3.5 weeks)
- ✅ **Cheaper** ($50-100 vs weeks of labor)
- ✅ **Higher quality** (consistent, validated)
- ✅ **Future-proof** (establishes correct pattern)
- ✅ **Lower risk** (can rollback, can regenerate)

The V2 engine is specifically designed for this. We should use it!

**Ready to proceed with regeneration?**
