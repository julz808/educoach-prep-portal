# Generate All Remaining Questions - Quick Reference

This guide explains how to use the comprehensive question generation script.

## Quick Start

### Generate EVERYTHING (all test types, all sections)
```bash
npx tsx --env-file=.env scripts/generation/generate-all-remaining.ts
```

This will:
- ✅ Loop through all 6 test types
- ✅ Process all sections in each test type
- ✅ Generate 5 practice tests + 1 diagnostic per section
- ✅ Skip sections that are already complete
- ✅ Show detailed progress and cost estimates
- ✅ Provide a comprehensive summary at the end

---

## Targeted Generation

### Generate specific test type only
```bash
# Year 7 NAPLAN only
npx tsx --env-file=.env scripts/generation/generate-all-remaining.ts \
  --test="Year 7 NAPLAN"

# ACER Scholarship only
npx tsx --env-file=.env scripts/generation/generate-all-remaining.ts \
  --test="ACER Scholarship (Year 7 Entry)"
```

### Generate specific section only
```bash
# Year 7 NAPLAN Reading only
npx tsx --env-file=.env scripts/generation/generate-all-remaining.ts \
  --test="Year 7 NAPLAN" \
  --section="Reading"

# VIC Selective Mathematics only
npx tsx --env-file=.env scripts/generation/generate-all-remaining.ts \
  --test="VIC Selective Entry (Year 9 Entry)" \
  --section="Mathematics Reasoning"
```

---

## What Gets Generated

For each section, the script generates:
- `practice_1` - Practice Test 1 (e.g., 50 questions)
- `practice_2` - Practice Test 2 (e.g., 50 questions)
- `practice_3` - Practice Test 3 (e.g., 50 questions)
- `practice_4` - Practice Test 4 (e.g., 50 questions)
- `practice_5` - Practice Test 5 (e.g., 50 questions)
- `diagnostic` - Diagnostic Test (e.g., 50 questions)

**Total per section:** ~300 questions (6 tests × 50 questions each, varies by section)

---

## All Test Types & Sections

### Year 5 NAPLAN
- Writing (1 question × 6 tests = 6)
- Reading (40 questions × 6 tests = 240)
- Language Conventions (40 questions × 6 tests = 240)
- Numeracy (50 questions × 6 tests = 300)

### Year 7 NAPLAN
- Writing (1 question × 6 tests = 6)
- Reading (50 questions × 6 tests = 300)
- Language Conventions (45 questions × 6 tests = 270)
- Numeracy No Calculator (30 questions × 6 tests = 180)
- Numeracy Calculator (35 questions × 6 tests = 210)

### ACER Scholarship (Year 7 Entry)
- Written Expression (1 question × 6 tests = 6)
- Mathematics (35 questions × 6 tests = 210)
- Humanities (35 questions × 6 tests = 210)

### EduTest Scholarship (Year 7 Entry)
- Reading Comprehension (50 questions × 6 tests = 300)
- Verbal Reasoning (60 questions × 6 tests = 360)
- Numerical Reasoning (50 questions × 6 tests = 300)
- Mathematics (60 questions × 6 tests = 360)
- Written Expression (2 questions × 6 tests = 12)

### NSW Selective Entry (Year 7 Entry)
- Reading (30 questions × 6 tests = 180)
- Mathematical Reasoning (35 questions × 6 tests = 210)
- Thinking Skills (40 questions × 6 tests = 240)
- Writing (1 question × 6 tests = 6)

### VIC Selective Entry (Year 9 Entry)
- Reading Reasoning (50 questions × 6 tests = 300)
- Mathematics Reasoning (60 questions × 6 tests = 360)
- General Ability - Verbal (60 questions × 6 tests = 360)
- General Ability - Quantitative (50 questions × 6 tests = 300)
- Writing (2 questions × 6 tests = 12)

**TOTAL ACROSS ALL TEST TYPES:** ~7,000+ questions

---

## Output & Reports

### Console Output
The script provides:
- Real-time progress for each section
- Questions generated per mode
- Cost per mode and overall
- Time taken
- Gaps remaining after generation

### Example Output
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 GENERATE ALL REMAINING QUESTIONS - V2 ENGINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 Target: ALL test types and sections

═════════════════════════════════════════════════════════════════════════════════
📚 Year 7 NAPLAN
═════════════════════════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────────────────────────────────┐
  │ 📂 Year 7 NAPLAN - Reading                                                   │
  └──────────────────────────────────────────────────────────────────────────────┘

  📊 Status: 245/300 questions (81.7%)
  🎯 Generating 55 missing questions...

    ⚙️  practice_3: Generating 12 questions...
    ✅ practice_3: Generated 12 questions ($0.2345)
    ⚙️  practice_5: Generating 8 questions...
    ✅ practice_5: Generated 8 questions ($0.1567)
    ...

  📊 Section Summary:
     Generated: 55 questions
     Cost: $1.2345
     Time: 245s
     Remaining gaps: 0
```

---

## Cost Estimates

**Approximate costs per question:**
- Multiple Choice: ~$0.02 - $0.04
- Written Response: ~$0.05 - $0.10
- Passage-based: ~$0.03 - $0.06

**Total cost for all 7,000+ questions:** ~$150 - $300

---

## Smart Features

### Gap Detection
- ✅ Automatically detects which questions are missing
- ✅ Skips sections that are already complete
- ✅ Only generates what's needed

### Cross-Mode Diversity
- ✅ Ensures questions across all 6 modes are diverse
- ✅ No duplicate questions between practice tests
- ✅ Maximum variety in the question bank

### Error Handling
- ✅ Retries failed questions up to 3 times
- ✅ Continues even if some questions fail
- ✅ Provides detailed error reports

### Progress Tracking
- ✅ Shows completion % for each section
- ✅ Displays cost and time estimates
- ✅ Identifies sections still needing work

---

## What to Do After Generation

### 1. Review the Output
Check for any sections with remaining gaps:
```
⚠️  Sections Still Needing Questions:
   • Year 7 NAPLAN - Reading: 5 gaps remaining
   • EduTest Scholarship - Mathematics: 12 gaps remaining
```

### 2. Re-run for Incomplete Sections
If gaps remain, re-run the script:
```bash
npx tsx --env-file=.env scripts/generation/generate-all-remaining.ts \
  --test="Year 7 NAPLAN" \
  --section="Reading"
```

### 3. Generate Drills
Once all practice/diagnostic tests are complete, generate drill questions:
```bash
npx tsx --env-file=.env scripts/generation/generate-drills-for-section.ts \
  --test="Year 7 NAPLAN" \
  --section="Reading" \
  --drills-per-subskill=20
```

### 4. Quality Check
Query the database to verify:
```sql
SELECT test_type, section_name, test_mode, COUNT(*) as count
FROM questions_v2
GROUP BY test_type, section_name, test_mode
ORDER BY test_type, section_name, test_mode;
```

---

## Troubleshooting

### "No configuration found for: X"
**Problem:** Section doesn't have a configuration in `sectionConfigurations.ts`

**Solution:** Add configuration for that section in `/src/data/curriculumData_v2/sectionConfigurations.ts`

### "API Rate Limit"
**Problem:** Too many requests to OpenAI API

**Solution:**
- Wait a few minutes
- The script has built-in rate limiting
- Re-run to continue from where it stopped

### "Some questions failed all retries"
**Problem:** Certain sub-skills consistently fail to generate

**Solution:**
- Check the error messages in console
- Review sub-skill examples in curriculum data
- May need to adjust generation parameters
- Re-run the script (gap detection will retry failures)

---

## Advanced Usage

### Skip Drill Generation Reminder
```bash
npx tsx --env-file=.env scripts/generation/generate-all-remaining.ts --skip-drills
```

### Combine Multiple Filters
```bash
# Year 7 NAPLAN Reading only, skip drill reminder
npx tsx --env-file=.env scripts/generation/generate-all-remaining.ts \
  --test="Year 7 NAPLAN" \
  --section="Reading" \
  --skip-drills
```

---

## Performance Tips

### For Faster Generation
1. **Use specific test/section filters** - Don't generate everything at once
2. **Run during off-peak hours** - API responses are faster
3. **Monitor progress** - Check console output for any issues
4. **Generate in batches** - One test type at a time

### For Cost Optimization
1. **Check existing questions first** - Script automatically skips complete sections
2. **Review failed questions** - May need curriculum data adjustments
3. **Use targeted generation** - Only generate what you need

---

## Summary

✅ **Comprehensive** - Generates all missing questions across all test types
✅ **Smart** - Automatically detects and fills gaps
✅ **Efficient** - Skips complete sections, cross-mode diversity
✅ **Reliable** - Error handling, retries, detailed progress tracking
✅ **Flexible** - Target specific tests or sections as needed

**Run the script and watch your question bank grow! 🚀**
