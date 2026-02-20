# EduCoach Prep Portal - Documentation

**Welcome!** This documentation will help you navigate the project and get started quickly.

**Last Updated:** February 20, 2026
**V2 Engine Version:** 2.3+
**Status:** ✅ Production Ready
**Total Questions:** 4,341 / ~5,500 (79% complete)

---

## 🚀 Quick Start

**New to the project?** Start here:

1. **[Generation Readiness Report](./01-generation/GENERATION_READINESS_REPORT.md)** ⭐ **START HERE**
   - Current status & what questions are missing
   - All your FAQ answered with code examples
   - Priority generation order with cost/time estimates
   - How the system works (gap detection, duplicates, passages, difficulty)

2. **[Generation Scripts Reference](./01-generation/GENERATION_SCRIPTS_REFERENCE.md)**
   - Copy-paste commands for all test types
   - Script usage examples
   - Monitoring and verification

3. **Run an audit to see current gaps:**
   ```bash
   npx tsx scripts/audit/detailed-gap-analysis.ts
   ```

---

## 📁 Documentation Structure

The documentation is organized in numbered folders for easy navigation:

### 🎯 [00-getting-started/](./00-getting-started/) *(Coming Soon)*
**Your starting point**
- Project overview
- Quick start guide
- Development setup

### 🤖 [01-generation/](./01-generation/) ⭐ **MAIN RESOURCE**
**Question generation (V2 engine)**
- **[GENERATION_READINESS_REPORT.md](./01-generation/GENERATION_READINESS_REPORT.md)** - Your main guide
- **[GENERATION_SCRIPTS_REFERENCE.md](./01-generation/GENERATION_SCRIPTS_REFERENCE.md)** - Command reference
- **[SCRIPT_VERIFICATION_REPORT.md](./01-generation/SCRIPT_VERIFICATION_REPORT.md)** - Script verification
- **[V2_ENGINE_COMPLETE_GUIDE.md](./01-generation/V2_ENGINE_COMPLETE_GUIDE.md)** - Technical deep-dive

### 📚 [02-curriculum/](./02-curriculum/)
**Curriculum data and test configurations**
- Test configurations summary
- Sub-skill definitions
- *(Curriculum data source code is in `src/data/curriculumData_v2/`)*

### ✅ [03-validation/](./03-validation/)
**Quality control and validation**
- Solution quality validation
- Visual generation guide (SVG/HTML diagrams)
- Hallucination detection
- Duplicate detection rules

### 🔍 [04-analysis/](./04-analysis/)
**System analysis and audits**
- **[V2_SYSTEM_AUDIT_REPORT.md](./04-analysis/V2_SYSTEM_AUDIT_REPORT.md)** - Latest comprehensive audit
- Historical analysis documents
- Performance analysis
- Gap analysis reports

### 🏗️ [05-architecture/](./05-architecture/)
**System architecture and design**
- Website structure analysis
- Component architecture
- Database schema
- Integration patterns

### ⚙️ [06-operations/](./06-operations/)
**Day-to-day operations**
- Debugging instructions
- Migration guides
- Purchase flow documentation
- Question generation workflows

### 🎨 [07-ui-improvements/](./07-ui-improvements/)
**UI/UX documentation**
- Drill UI mockups
- Skill drills improvements
- UI recommendations

### 📖 [08-passages/](./08-passages/)
**Reading passage generation**
- Passage requirements and specifications
- Passage generation system
- Topic diversity management

### 🚀 [09-deployment/](./09-deployment/)
**Deployment and hosting**
- Deployment guides
- Domain migration
- Production setup

### 📈 [10-marketing/](./10-marketing/)
**Marketing and growth**
- **[google-ads/](./10-marketing/google-ads/)** - Google Ads documentation
- **[strategy/](./10-marketing/strategy/)** - SEO & content strategy
- **[conversion/](./10-marketing/conversion/)** - Conversion optimization

### 🔧 [fixes/](./fixes/)
**Bug fixes and solutions**
- ACER visual sub-skills fix
- Other bug fix documentation

### 📦 [99-archived/](./99-archived/)
**Old documentation (kept for reference)**
- Superseded guides
- Old generation reports (23 historical reports)
- Historical documentation

---

## 🎯 Most Common Tasks

### I want to generate questions
→ **[01-generation/GENERATION_READINESS_REPORT.md](./01-generation/GENERATION_READINESS_REPORT.md)**

### I want to check what questions are missing
```bash
npx tsx scripts/audit/detailed-gap-analysis.ts
```

### I want copy-paste commands for generation
→ **[01-generation/GENERATION_SCRIPTS_REFERENCE.md](./01-generation/GENERATION_SCRIPTS_REFERENCE.md)**

### I want to understand the V2 engine
→ **[01-generation/V2_ENGINE_COMPLETE_GUIDE.md](./01-generation/V2_ENGINE_COMPLETE_GUIDE.md)**

### I want to see the latest audit results
→ **[04-analysis/V2_SYSTEM_AUDIT_REPORT.md](./04-analysis/V2_SYSTEM_AUDIT_REPORT.md)**

### I need to debug something
→ **[06-operations/DEBUG_INSTRUCTIONS.md](./06-operations/DEBUG_INSTRUCTIONS.md)**

### I want to deploy to production
→ **[09-deployment/](./09-deployment/)**

---

## 📊 Current Status (Feb 20, 2026)

### Questions Generated
**4,341 questions** generated (79% complete)

| Test Type | Questions | Completion |
|-----------|-----------|------------|
| ACER Scholarship | 297 | 68% ✅ |
| EduTest Scholarship | 1,158 | 87% ✅ |
| NSW Selective Entry | 403 | 63% ⚠️ |
| VIC Selective Entry | 905 | 60% ⚠️ |
| Year 5 NAPLAN | 708 | 67% ⚠️ |
| Year 7 NAPLAN | 870 | 60% ⚠️ |

**~1,151 questions remaining** to reach 100% completion

### System Features
✅ **Cross-mode diversity checking** - Prevents duplicates across all modes
✅ **Hallucination detection** - Rejects confused LLM responses
✅ **Solution quality validation** - Flags overly long solutions
✅ **Pattern-based leniency** - Appropriate validation for pattern questions
✅ **Section-aware duplicate detection** - Different rules for maths/verbal/reading
✅ **Passage quotas** - Won't over-generate passages
✅ **Visual generation** - SVG/HTML diagrams via Opus 4.5
✅ **Writing system** - 85 writing questions operational

---

## 🚀 Quick Commands

### Generate Questions (Practice + Diagnostic)

```bash
# Example: EduTest Verbal Reasoning
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="EduTest Scholarship (Year 7 Entry)" \
  --section="Verbal Reasoning" \
  --modes="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"
```

### Generate Drills

```bash
# Example: EduTest Verbal Reasoning drills
npx tsx --env-file=.env scripts/generation/generate-drills-for-section.ts \
  --test="EduTest Scholarship (Year 7 Entry)" \
  --section="Verbal Reasoning"
```

### Audit & Verify

```bash
# See detailed gap analysis
npx tsx scripts/audit/detailed-gap-analysis.ts

# Get full v2 status
npx tsx scripts/audit/full-v2-status.ts
```

---

## 🔗 Quick Links

### Scripts
- **Generation:** `scripts/generation/`
- **Audit:** `scripts/audit/`
- **Database:** `scripts/database/`
- **Testing:** `scripts/testing/`
- **Maintenance:** `scripts/maintenance/`

### Source Code
- **Question generation engine:** `src/engines/questionGeneration/v2/`
- **Curriculum data:** `src/data/curriculumData_v2/`
- **Components:** `src/components/`
- **Services:** `src/services/`

### Database
- **Questions table:** `questions_v2`
- **Passages table:** `passages_v2`
- **Migrations:** `supabase/migrations/`

---

## 💡 Navigation Tips

- **Use the numbered folders (00-10)** to find documentation in logical order
- **Start with 00-getting-started** if you're brand new to the project
- **01-generation is your main resource** for question generation tasks
- **Check 04-analysis for latest audit reports** and system analysis
- **Old docs are in 99-archived** - kept for reference but superseded by newer versions

---

## 🔄 Recent Updates

### February 20, 2026
- ✅ Reorganized documentation into numbered folders
- ✅ Created comprehensive generation readiness report
- ✅ Verified all generation scripts use latest V2 engine
- ✅ Completed comprehensive system audit
- ✅ Archived old documentation (not deleted - kept for reference)
- ✅ Moved test scripts to `scripts/testing/`
- ✅ Cleaned up backup files

### February 19, 2026
- ✅ Nuanced duplicate detection with category-specific rules
- ✅ Load up to 1000 questions for duplicate checking
- ✅ Sub-skill filtering for verbal duplicate detection
- ✅ Comprehensive documentation update

---

## 📊 Key Metrics (V2.3+)

| Metric | Status | Notes |
|--------|--------|-------|
| **Error Rate** | <0.5% | Down from 5-10% in V1 |
| **Duplicate Rate** | <0.1% | Section-aware detection |
| **Questions Loaded** | Up to 1,000 | 50x more context than V1 |
| **Validation Layers** | 3 layers | Structure + LLM + Duplicate |
| **Cost per Question** | ~$0.02 | Including all validation |
| **Visual Questions** | 311 generated | Using Opus 4.5 |
| **Writing Questions** | 85 generated | Extended response system |

---

## 🆘 Getting Help

**Can't find something?**

1. Check **[01-generation/GENERATION_READINESS_REPORT.md](./01-generation/GENERATION_READINESS_REPORT.md)** first (most practical)
2. Look at **[01-generation/V2_ENGINE_COMPLETE_GUIDE.md](./01-generation/V2_ENGINE_COMPLETE_GUIDE.md)** for technical details
3. Review **[04-analysis/V2_SYSTEM_AUDIT_REPORT.md](./04-analysis/V2_SYSTEM_AUDIT_REPORT.md)** for system status
4. Check **[PROJECT_CLEANUP_PLAN.md](./PROJECT_CLEANUP_PLAN.md)** for recent reorganization details

---

**System Status:** ✅ Production Ready - V2.3+
**Documentation Status:** ✅ Organized & Up-to-Date
**Last Updated:** February 20, 2026
