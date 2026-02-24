# Question Generation Scripts - Usage Guide

## 📋 Overview

Convenient bash scripts to generate all remaining questions for each test product. Scripts run section-by-section and provide progress updates.

**Total Remaining:** 228 questions across 6 test products

---

## 🚀 Quick Start

### Option 1: Generate ALL Remaining Questions (All Tests)

```bash
./scripts/generation/generate-all-remaining.sh
```

This master script will:
- Generate all 228 remaining questions
- Run tests in order from smallest to largest gaps
- Take approximately 45-60 minutes total
- Save reports to `docs/generation-reports/`

---

### Option 2: Generate by Test Product (Individual)

Run individual test scripts to generate only that test's remaining questions:

#### 1. EduTest Scholarship (6 questions) - **EASIEST - START HERE**
```bash
./scripts/generation/generate-all-edutest-scholarship.sh
```
**Time:** ~3-5 minutes
**Sections:** Verbal Reasoning (4), Numerical Reasoning (2)
**Note:** Includes fixes for Number Series (was 71% success, now 85%+ expected)

---

#### 2. NSW Selective Entry (8 questions)
```bash
./scripts/generation/generate-all-nsw-selective.sh
```
**Time:** ~3-5 minutes
**Sections:** Reading (1), Mathematical Reasoning (2), Thinking Skills (5)

---

#### 3. ACER Scholarship (30 questions)
```bash
./scripts/generation/generate-all-acer-scholarship.sh
```
**Time:** ~8-12 minutes
**Sections:** Humanities (25), Mathematics (5)

---

#### 4. Year 5 NAPLAN (33 questions)
```bash
./scripts/generation/generate-all-year5-naplan.sh
```
**Time:** ~10-15 minutes
**Sections:** Reading (18), Language Conventions (15)
**Note:** Includes fixes for Punctuation (was 54% success, now 80%+ expected)

---

#### 5. Year 7 NAPLAN (53 questions)
```bash
./scripts/generation/generate-all-year7-naplan.sh
```
**Time:** ~15-20 minutes
**Sections:** Reading (43), Language Conventions (5), Numeracy Calculator (5)

---

#### 6. VIC Selective Entry (98 questions) - **LARGEST GAP**
```bash
./scripts/generation/generate-all-vic-selective.sh
```
**Time:** ~25-35 minutes
**Sections:** Reading Reasoning (69), Mathematics Reasoning (9), General Ability - Verbal (13), General Ability - Quantitative (7)
**Note:** Includes fixes for Letter Series (was 35% success, now 75%+ expected)

---

## 📊 Gap Summary

| Test | Questions Needed | Priority | Estimated Time |
|------|-----------------|----------|----------------|
| EduTest Scholarship | 6 | ⭐ Low | 3-5 min |
| NSW Selective | 8 | ⭐ Low | 3-5 min |
| ACER Scholarship | 30 | ⭐⭐ Medium | 8-12 min |
| Year 5 NAPLAN | 33 | ⭐⭐ Medium | 10-15 min |
| Year 7 NAPLAN | 53 | ⭐⭐⭐ High | 15-20 min |
| VIC Selective | 98 | ⭐⭐⭐ High | 25-35 min |
| **TOTAL** | **228** | | **~45-60 min** |

---

## 🎯 Recommended Approach

### Strategy 1: Quick Wins First (Recommended)
Start with the easiest tests to build confidence:

```bash
# 1. Quick wins (14 questions, ~8 minutes)
./scripts/generation/generate-all-edutest-scholarship.sh
./scripts/generation/generate-all-nsw-selective.sh

# 2. Medium gaps (63 questions, ~20 minutes)
./scripts/generation/generate-all-acer-scholarship.sh
./scripts/generation/generate-all-year5-naplan.sh

# 3. Large gaps (151 questions, ~40 minutes)
./scripts/generation/generate-all-year7-naplan.sh
./scripts/generation/generate-all-vic-selective.sh
```

### Strategy 2: All at Once
Run the master script and let it complete everything:

```bash
./scripts/generation/generate-all-remaining.sh
```

---

## 📁 Output & Reports

### Generation Reports Location
```
docs/generation-reports/
└── post-generation-check-[test]-[section]-[timestamp].md
```

### Report Contents
Each report includes:
- ✅ Questions successfully generated
- ❌ Failed attempts (if any)
- 📊 Success rate per sub-skill
- 💰 Cost breakdown
- ⏱️ Time taken
- 🎯 Gap status (complete/incomplete)

### Example Report:
```markdown
# Post-Generation Check

**Test Type:** VIC Selective Entry (Year 9 Entry)
**Section:** General Ability - Verbal
**Status:** ✅ COMPLETE

## Summary
| Questions Generated | 13 |
| Total Failures | 0 |
| Success Rate | 100% |
| Total Cost | $0.12 |
```

---

## ✅ After Generation - Verification

### 1. Check Completion Status
```bash
npx tsx scripts/audit/detailed-gap-analysis.ts
```

This will show:
- Total questions generated vs needed
- Breakdown by test and section
- Remaining gaps (if any)

### 2. Review Generation Reports
```bash
ls -lt docs/generation-reports/ | head -20
```

Look for:
- ✅ Status: COMPLETE
- ❌ High failure rates (indicates issues)
- 💰 Costs per section

### 3. Handle Failures (if any)

If a section has failures, re-run just that section:
```bash
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="[TEST NAME]" \
  --section="[SECTION NAME]" \
  --modes="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"
```

---

## 🔧 Troubleshooting

### Issue: Script won't run
**Solution:** Make sure scripts are executable:
```bash
chmod +x scripts/generation/*.sh
```

### Issue: "command not found: npx"
**Solution:** Install Node.js and npm:
```bash
# Check if installed
node --version
npm --version

# If not installed, install from nodejs.org
```

### Issue: High failure rates (>30%)
**Solution:** The fixes implemented should reduce failures. If still high:
1. Check generation reports for error patterns
2. Review curriculum examples for that sub-skill
3. Consider adding more examples or adjusting guidance

### Issue: Out of memory errors
**Solution:** Run tests one at a time instead of using the master script

---

## 💡 Tips

1. **Start Small:** Test with EduTest (6 questions) first to verify everything works
2. **Monitor Progress:** Generation reports update in real-time - check `docs/generation-reports/`
3. **Costs:** Expect ~$10-15 total for all 228 questions (~$0.05/question average)
4. **Time:** Run during off-hours if generating all at once (~1 hour)
5. **Failures:** Some failures are normal - the system will retry. < 15% failure rate is good.

---

## 🎓 Understanding the Generation Process

Each script:
1. **Gap Detection:** Checks what's needed per mode (practice_1-5, diagnostic)
2. **Generation:** Creates questions using V2 engine with curriculum examples
3. **Validation:**
   - Structure check (required fields)
   - Correctness check (Haiku LLM verifies answer)
   - Duplicate check (compares to recent questions)
4. **Retry:** Up to 3 attempts if validation fails
5. **Storage:** Saves to `questions_v2` table in Supabase
6. **Reporting:** Creates detailed markdown report

---

## 🚨 Important Notes

- **Do Not Interrupt:** Let scripts complete fully - interrupting may leave partial data
- **Cost Tracking:** Each run shows costs - monitor to avoid surprises
- **Backups:** Database has automatic backups, but verify critical sections
- **Drill Generation:** Run AFTER practice tests are complete (not included in these scripts)

---

## 📞 Need Help?

If you encounter issues:
1. Check generation reports in `docs/generation-reports/`
2. Run gap analysis: `npx tsx scripts/audit/detailed-gap-analysis.ts`
3. Review error messages in console output
4. Check `docs/fixes-implemented-2026-02-20.md` for recent improvements

---

## ⏭️ Next Steps After Generation

1. ✅ Verify completion with gap analysis
2. 📊 Review success rates in generation reports
3. 🔄 Re-run any sections with high failure rates
4. 🎯 Generate drills for each section:
   ```bash
   npx tsx --env-file=.env scripts/generation/generate-drills-for-section.ts \
     --test="[TEST NAME]" \
     --section="[SECTION NAME]" \
     --drills-per-subskill=20
   ```
5. 🎉 Celebrate - you'll have 5,500+ questions ready!

---

*Last updated: February 20, 2026*
*Scripts location: `scripts/generation/`*
*Reports location: `docs/generation-reports/`*
