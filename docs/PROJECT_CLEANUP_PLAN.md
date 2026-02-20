# Project Cleanup Plan

**Date:** 2026-02-20
**Goal:** Organize project structure, remove obsolete files, create clear documentation hierarchy

---

## Current Issues

1. **Root directory cluttered** - 3 markdown files should be in docs/
2. **docs/ has flat structure** - 26 files/folders without clear organization
3. **Backup files in content/blog/** - 6 .backup files from old versions
4. **Test scripts in scripts root** - 9 test/debug scripts mixed with production scripts
5. **Duplicate documentation** - Some docs superseded by newer versions
6. **docs/generation-reports/** - 23 old generation reports (historical data)

---

## Safe Cleanup Actions

### Phase 1: Root Directory (SAFE)

**Move to docs/:**
```bash
./DRILL_UI_MOCKUP.md → docs/ui/DRILL_UI_MOCKUP.md
./GENERATE_TESTS_QUICK_REFERENCE.md → docs/archived/GENERATE_TESTS_QUICK_REFERENCE.md (old)
./GENERATION_STRATEGY.md → docs/archived/GENERATION_STRATEGY.md (old)
```

**Result:** Clean root, only package.json, tsconfig, etc.

---

### Phase 2: Reorganize docs/ (SAFE - MOVES ONLY)

**Current structure (FLAT):**
```
docs/
├── analysis/                    (23 files)
├── architecture/               (9 files)
├── conversion/                 (6 files)
├── deployment/                 (6 files)
├── fixes/                      (9 files)
├── google-ads/                 (8 files)
├── operations/                 (6 files)
├── strategy/                   (10 files)
├── 15+ markdown files at root level
└── generation-reports/         (23 old reports)
```

**NEW structure (ORGANIZED):**
```
docs/
├── README.md                           (NEW - Navigation guide)
│
├── 00-getting-started/                 (NEW)
│   ├── README.md                       (Project overview)
│   └── QUICK_START.md                  (How to generate questions)
│
├── 01-generation/                      (Core V2 generation docs)
│   ├── GENERATION_READINESS_REPORT.md  (MAIN - Current gaps & FAQ)
│   ├── GENERATION_SCRIPTS_REFERENCE.md (Command reference)
│   ├── SCRIPT_VERIFICATION_REPORT.md   (Script verification)
│   └── V2_ENGINE_COMPLETE_GUIDE.md     (Technical deep-dive)
│
├── 02-curriculum/                      (Curriculum & sub-skills)
│   ├── TEST_CONFIGURATIONS_SUMMARY.md
│   └── (curriculum data is in src/data/curriculumData_v2/)
│
├── 03-validation/                      (Quality & validation)
│   ├── SOLUTION_QUALITY_VALIDATION.md
│   └── VISUAL_GENERATION_GUIDE.md
│
├── 04-analysis/                        (Historical analysis - KEEP)
│   ├── V2_SYSTEM_AUDIT_REPORT.md       (Latest audit)
│   ├── V2_GENERATION_COMPLETE_AUDIT_AND_FIX_PLAN.md
│   ├── CURRICULUM_V2_GAP_ANALYSIS.md
│   └── (other analysis files)
│
├── 05-architecture/                    (System design)
│   ├── WEBSITE_STRUCTURE_ANALYSIS.md
│   ├── SECTION_BREAKDOWN.md
│   └── (other architecture docs)
│
├── 06-operations/                      (Day-to-day operations)
│   ├── DEBUG_INSTRUCTIONS.md
│   ├── MIGRATION_GUIDE.md
│   └── PURCHASE_FLOWS_DOCUMENTATION.md
│
├── 07-ui-improvements/                 (UI/UX docs)
│   ├── DRILL_UI_MOCKUP.md
│   ├── SKILL_DRILLS_UI_IMPROVEMENTS.md
│   └── RECOMMENDATIONS_TOP_3_UPDATE.md
│
├── 08-passages/                        (Passage generation)
│   ├── PASSAGE_REQUIREMENTS_UPDATE.md
│   └── PASSAGE_FIX_SUMMARY.md
│
├── 09-deployment/                      (Deployment & hosting)
│   └── (existing deployment docs)
│
├── 10-marketing/                       (Marketing & ads)
│   ├── google-ads/                     (Google Ads docs)
│   ├── strategy/                       (Marketing strategy)
│   └── conversion/                     (Conversion optimization)
│
├── 99-archived/                        (OLD - Keep for reference)
│   ├── GENERATE_TESTS_QUICK_REFERENCE.md  (superseded by GENERATION_SCRIPTS_REFERENCE)
│   ├── GENERATION_STRATEGY.md             (old strategy doc)
│   ├── GENERATION_SCRIPTS_GUIDE.md        (superseded by REFERENCE)
│   ├── generation-reports/                (23 old generation reports)
│   └── analysis/                          (old analysis files if superseded)
│
└── fixes/                              (Bug fix documentation)
    └── ACER_VISUAL_SUBSKILLS_FIX.md
```

---

### Phase 3: Delete Backup Files (SAFE)

**Content blog backups (can be deleted - in git history):**
```bash
content/blog/EduCourse Blog/ACER/01-complete-guide-acer-scholarship-test-2026.txt.backup
content/blog/EduCourse Blog/EduTest/01-complete-guide-edutest-2026.txt.backup
content/blog/EduCourse Blog/NSW Selective/01-nsw-selective-test-complete-guide-2026.txt.backup
content/blog/EduCourse Blog/VIC Selective/01-vic-selective-entry-complete-guide-2026.txt.backup
content/blog/EduCourse Blog/Year 5 NAPLAN/01-year-5-naplan-complete-guide-2026.txt.backup
content/blog/EduCourse Blog/Year 7 NAPLAN/01-year-7-naplan-complete-guide-2026.txt.backup
```

**Action:** Delete (originals exist, git has history)

---

### Phase 4: Organize Test Scripts (SAFE - MOVE)

**Current test/debug scripts in scripts/ root:**
```
scripts/check-acer-writing.ts
scripts/test-all-questions-loading.ts
scripts/test-cross-mode-loading.ts
scripts/test-duplicate-learning-forced.ts
scripts/test-duplicate-learning.ts
scripts/test-duplicate-rules.ts
scripts/test-hallucination-fix.ts
scripts/test-vic-reading-duplicates.ts
```

**NEW location:**
```
scripts/testing/
├── check-acer-writing.ts
├── test-all-questions-loading.ts
├── test-cross-mode-loading.ts
├── test-duplicate-learning-forced.ts
├── test-duplicate-learning.ts
├── test-duplicate-rules.ts
├── test-hallucination-fix.ts
└── test-vic-reading-duplicates.ts
```

**Keep in scripts/ root:**
- `generate-sitemap.ts` (production utility)
- `dev-learning.cjs` (development server)
- `dev-marketing.cjs` (development server)

---

### Phase 5: Archive Old Generation Reports (SAFE)

**docs/generation-reports/** - 23 files from old generation runs

These are historical data logs. Useful for debugging history but not needed day-to-day.

**Action:** Move to `docs/99-archived/generation-reports/`

---

## Files Analysis: Keep or Archive?

### ROOT LEVEL - Proposed Actions

| File | Status | Action | Reason |
|------|--------|--------|--------|
| DRILL_UI_MOCKUP.md | OLD | Move to docs/07-ui-improvements/ | UI design doc |
| GENERATE_TESTS_QUICK_REFERENCE.md | SUPERSEDED | Move to docs/99-archived/ | Replaced by GENERATION_SCRIPTS_REFERENCE.md |
| GENERATION_STRATEGY.md | OLD | Move to docs/99-archived/ | Old strategy, superseded by V2 docs |

### DOCS/ ROOT LEVEL - Proposed Actions

| File | Status | Action | Reason |
|------|--------|--------|--------|
| GENERATION_READINESS_REPORT.md | ⭐ CURRENT | Move to docs/01-generation/ | Main generation guide |
| GENERATION_SCRIPTS_REFERENCE.md | ⭐ CURRENT | Move to docs/01-generation/ | Command reference |
| SCRIPT_VERIFICATION_REPORT.md | ⭐ CURRENT | Move to docs/01-generation/ | Script verification |
| V2_ENGINE_COMPLETE_GUIDE.md | ⭐ CURRENT | Move to docs/01-generation/ | Technical guide |
| VISUAL_GENERATION_GUIDE.md | ⭐ CURRENT | Move to docs/03-validation/ | Visual gen docs |
| SOLUTION_QUALITY_VALIDATION.md | ⭐ CURRENT | Move to docs/03-validation/ | Validation docs |
| TEST_CONFIGURATIONS_SUMMARY.md | ⭐ CURRENT | Move to docs/02-curriculum/ | Test configs |
| PASSAGE_REQUIREMENTS_UPDATE.md | ⭐ CURRENT | Move to docs/08-passages/ | Passage generation |
| PASSAGE_FIX_SUMMARY.md | ⭐ CURRENT | Move to docs/08-passages/ | Passage fixes |
| SKILL_DRILLS_UI_IMPROVEMENTS.md | CURRENT | Move to docs/07-ui-improvements/ | UI improvements |
| RECOMMENDATIONS_TOP_3_UPDATE.md | CURRENT | Move to docs/07-ui-improvements/ | UI recommendations |
| GENERATION_SCRIPTS_GUIDE.md | SUPERSEDED | Move to docs/99-archived/ | Replaced by REFERENCE |
| README.md | CURRENT | Keep (navigation) | Main docs readme |

### DOCS/ANALYSIS/ - Keep All (Historical Reference)

All analysis files are valuable historical documentation. Keep in docs/04-analysis/.

**Mark superseded files:**
- Add `[SUPERSEDED]` prefix to old files if newer versions exist
- Keep for historical reference

---

## Implementation Order

### Step 1: Create New Directory Structure ✅ SAFE
```bash
mkdir -p docs/00-getting-started
mkdir -p docs/01-generation
mkdir -p docs/02-curriculum
mkdir -p docs/03-validation
mkdir -p docs/04-analysis
mkdir -p docs/05-architecture
mkdir -p docs/06-operations
mkdir -p docs/07-ui-improvements
mkdir -p docs/08-passages
mkdir -p docs/09-deployment
mkdir -p docs/10-marketing
mkdir -p docs/99-archived
mkdir -p scripts/testing
```

### Step 2: Move Documentation Files ✅ SAFE (git tracks moves)
```bash
# Root to docs
mv ./DRILL_UI_MOCKUP.md docs/07-ui-improvements/
mv ./GENERATE_TESTS_QUICK_REFERENCE.md docs/99-archived/
mv ./GENERATION_STRATEGY.md docs/99-archived/

# Organize docs/ root files
mv docs/GENERATION_READINESS_REPORT.md docs/01-generation/
mv docs/GENERATION_SCRIPTS_REFERENCE.md docs/01-generation/
mv docs/SCRIPT_VERIFICATION_REPORT.md docs/01-generation/
mv docs/V2_ENGINE_COMPLETE_GUIDE.md docs/01-generation/
mv docs/VISUAL_GENERATION_GUIDE.md docs/03-validation/
mv docs/SOLUTION_QUALITY_VALIDATION.md docs/03-validation/
mv docs/TEST_CONFIGURATIONS_SUMMARY.md docs/02-curriculum/
mv docs/PASSAGE_REQUIREMENTS_UPDATE.md docs/08-passages/
mv docs/PASSAGE_FIX_SUMMARY.md docs/08-passages/
mv docs/SKILL_DRILLS_UI_IMPROVEMENTS.md docs/07-ui-improvements/
mv docs/RECOMMENDATIONS_TOP_3_UPDATE.md docs/07-ui-improvements/
mv docs/GENERATION_SCRIPTS_GUIDE.md docs/99-archived/

# Rename existing directories
mv docs/analysis docs/04-analysis
mv docs/architecture docs/05-architecture
mv docs/operations docs/06-operations
mv docs/deployment docs/09-deployment
mv docs/strategy docs/10-marketing/strategy
mv docs/conversion docs/10-marketing/conversion
mv docs/google-ads docs/10-marketing/google-ads

# Archive old generation reports
mv docs/generation-reports docs/99-archived/generation-reports
```

### Step 3: Move Test Scripts ✅ SAFE
```bash
mv scripts/check-acer-writing.ts scripts/testing/
mv scripts/test-*.ts scripts/testing/
```

### Step 4: Delete Backup Files ✅ SAFE (in git history)
```bash
rm content/blog/EduCourse\ Blog/ACER/*.backup
rm content/blog/EduCourse\ Blog/EduTest/*.backup
rm content/blog/EduCourse\ Blog/NSW\ Selective/*.backup
rm content/blog/EduCourse\ Blog/VIC\ Selective/*.backup
rm content/blog/EduCourse\ Blog/Year\ 5\ NAPLAN/*.backup
rm content/blog/EduCourse\ Blog/Year\ 7\ NAPLAN/*.backup
```

### Step 5: Create Navigation READMEs ✅ SAFE
```bash
# Create docs/README.md with navigation
# Create docs/00-getting-started/README.md with project overview
# Create docs/00-getting-started/QUICK_START.md
```

---

## Files NOT to Touch (Production Code)

✅ Keep untouched:
- `src/` - All source code
- `public/` - All public assets
- `supabase/` - Database migrations
- `node_modules/` - Dependencies
- `.git/` - Git history
- Config files (package.json, tsconfig.json, vite.config.ts, etc.)
- `scripts/generation/` - Production generation scripts
- `scripts/audit/` - Production audit scripts
- `scripts/database/` - Database scripts
- `scripts/maintenance/` - Maintenance utilities

---

## Risk Assessment

| Action | Risk Level | Safety Net |
|--------|-----------|------------|
| Move documentation files | 🟢 SAFE | Git tracks moves, easy to undo |
| Delete .backup files | 🟢 SAFE | Originals exist, git has history |
| Move test scripts | 🟢 SAFE | Git tracks moves |
| Archive old reports | 🟢 SAFE | Moving, not deleting |
| Create new directories | 🟢 SAFE | No data loss |

**Overall Risk:** 🟢 **VERY SAFE** - All actions are reversible via git

---

## Benefits

✅ **Clear navigation** - Numbered folders show priority/order
✅ **Easy onboarding** - Start at 00-getting-started
✅ **Logical grouping** - Related docs together
✅ **Clean root** - Only essential config files
✅ **Preserved history** - All old docs archived, not deleted
✅ **Better discoverability** - Know where to find things

---

## Post-Cleanup Actions

1. ✅ Update any import paths in code (if needed)
2. ✅ Create navigation README in docs/
3. ✅ Test that generation scripts still work
4. ✅ Commit with clear message: "refactor: reorganize project structure"

---

**Ready to execute? All actions are safe and reversible via git.**
