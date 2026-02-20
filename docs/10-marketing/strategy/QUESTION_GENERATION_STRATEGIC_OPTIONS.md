# Question Generation Engine - Strategic Improvement Options

## Executive Summary

**Current Situation**: Parents report questions with errors in explanations/answers, hallucinations, questions not reflective of actual tests, and overly difficult questions decreasing student morale.

**Root Causes Identified**:
1. ❌ No validation that wrong answers are actually wrong
2. ❌ Limited hallucination detection (only 4 patterns)
3. ❌ No difficulty calibration based on real student performance
4. ❌ No comparison to authentic test questions
5. ❌ Excessive prompt length causing quality issues

**Current System**: Claude Sonnet 4 with prompt-based generation (~$0.02/question, ~$2/test)

---

## Strategic Options Analysis

### Option 1: Quick Fixes to Current System ⭐ **RECOMMENDED FIRST STEP**

**Description**: Fix critical gaps in existing prompt-based system

**Implementation**:
- Add distractor validation (verify wrong answers are actually wrong)
- Expand hallucination detection from 4 to 50+ patterns
- Set explicit temperature parameters (0.7 for generation, 0.0 for validation)
- Reduce prompt length by 50% (6,000 → 3,000 tokens)
- Add difficulty calibration feedback loop
- Implement real test comparison framework

**Timeline**: 1-2 weeks

**Cost Impact**:
- Development: 3-5 days of engineering time
- Per question cost: ~$0.021 (minimal increase from $0.02)
- One-time setup: ~$500 for engineer time

**Expected Quality Improvement**: 75% → 95% confidence level

**Pros**:
- ✅ Fastest path to quality improvement
- ✅ Addresses all three parent complaints directly
- ✅ Minimal cost increase
- ✅ No new infrastructure needed
- ✅ Can deploy within 2 weeks
- ✅ Foundation for future improvements

**Cons**:
- ⚠️ Still reliant on general-purpose LLM
- ⚠️ Won't achieve 100% accuracy
- ⚠️ Requires ongoing prompt maintenance

**Recommendation**: **DO THIS IMMEDIATELY** - Addresses critical quality issues with minimal investment

---

### Option 2: Fine-Tune a Custom Model

**Description**: Train a specialized model on high-quality test preparation questions

**Implementation Paths**:

#### 2A: Fine-tune Claude (via Anthropic's fine-tuning program)
- Requires 1,000+ high-quality question examples
- Anthropic charges per training run + per token
- Best for test-specific style and accuracy

#### 2B: Fine-tune Open Source Model (Llama 3.1, Mistral, etc.)
- Requires 5,000+ training examples
- Infrastructure costs (GPU training)
- More control but more maintenance

**Timeline**: 2-3 months

**Cost Breakdown**:
- Training data collection: $10,000-25,000 (hire teachers to write 1,000+ questions)
- Model fine-tuning: $5,000-15,000 (depending on provider)
- Infrastructure/hosting: $500-2,000/month
- Ongoing maintenance: $2,000-5,000/month
- **Total first year**: $40,000-80,000

**Expected Quality Improvement**: 95%+ accuracy on test-specific questions

**Pros**:
- ✅ Best long-term accuracy and consistency
- ✅ Test-specific style matching
- ✅ Lower per-question costs over time
- ✅ Competitive moat (proprietary model)
- ✅ Can encode specific test patterns

**Cons**:
- ⚠️ Expensive upfront investment ($40k-80k)
- ⚠️ Requires high-quality training data (1,000+ questions)
- ⚠️ 2-3 month timeline before deployment
- ⚠️ Ongoing maintenance and retraining needed
- ⚠️ Risk: May not significantly outperform improved prompts

**Recommendation**: **FUTURE PHASE** - Only pursue after Option 1 + collecting student performance data

---

### Option 3: Human-in-the-Loop Hybrid System

**Description**: LLM generates questions, expert teachers review and correct

**Implementation**:
- Claude generates question drafts
- Expert teachers (former test writers) review each question
- Teachers fix errors and mark quality issues
- Build feedback loop into generation system

**Timeline**: 2-4 weeks to set up workflow

**Cost Breakdown**:
- Expert teacher rate: $50-100/hour
- Review time: 5-10 minutes per question
- **Cost per question**: $5-15 (vs. $0.02 for pure LLM)
- For 500 questions/test × 6 tests: $15,000-45,000 one-time

**Expected Quality Improvement**: 98-100% accuracy

**Pros**:
- ✅ Highest quality guarantee
- ✅ Builds training data for future fine-tuning
- ✅ Expert validation on test authenticity
- ✅ Can fix difficulty calibration issues
- ✅ Immediate quality improvement

**Cons**:
- ⚠️ Very expensive ($5-15 per question vs $0.02)
- ⚠️ Doesn't scale well
- ⚠️ Slow (manual review bottleneck)
- ⚠️ Requires hiring/managing expert teachers
- ⚠️ Not sustainable for ongoing generation

**Recommendation**: **HYBRID APPROACH** - Use for initial batch to fix current issues, then switch to Option 1

---

### Option 4: Ensemble/Multi-Model Approach

**Description**: Use multiple AI models and cross-validate answers

**Implementation**:
- Generate question with Claude Sonnet 4
- Validate answer with GPT-4o
- Cross-check with Gemini 1.5 Pro
- Accept only if all models agree

**Timeline**: 1 week to implement

**Cost Breakdown**:
- Claude generation: $0.018/question
- GPT-4o validation: $0.015/question
- Gemini cross-check: $0.010/question
- **Total per question**: $0.043 (2x current cost)

**Expected Quality Improvement**: 90-95% accuracy

**Pros**:
- ✅ Higher accuracy through consensus
- ✅ Quick to implement
- ✅ Catches model-specific errors
- ✅ No training data needed

**Cons**:
- ⚠️ 2x API costs
- ⚠️ Slower generation (multiple API calls)
- ⚠️ Still doesn't guarantee test authenticity
- ⚠️ Diminishing returns vs Option 1

**Recommendation**: **OPTIONAL ENHANCEMENT** - Consider for high-stakes sections only

---

### Option 5: License/Purchase Real Test Questions

**Description**: Buy authentic questions from test providers or prep companies

**Implementation Paths**:

#### 5A: Official Test Provider Partnership
- Contact ACER, EduTest, NSW Education, etc.
- License past test questions
- Most authentic possible

#### 5B: Acquire Existing Test Prep Content
- Buy question banks from competitors
- Partner with established prep companies

**Timeline**: 3-6 months (negotiations)

**Cost Breakdown**:
- License fees: $50,000-200,000+ per test type
- Ongoing royalties: 10-30% of revenue
- **Total**: Potentially $300,000-1,200,000 for 6 test types

**Expected Quality Improvement**: 100% authentic (by definition)

**Pros**:
- ✅ Most authentic questions possible
- ✅ No generation errors
- ✅ Immediate credibility with parents
- ✅ Competitive advantage

**Cons**:
- ⚠️ Extremely expensive
- ⚠️ Limited question pool (can't generate new)
- ⚠️ Copyright/licensing restrictions
- ⚠️ Test providers unlikely to license to competitors
- ⚠️ Outdated as tests evolve

**Recommendation**: **EXPLORE OPPORTUNISTICALLY** - Worth inquiring but likely not viable

---

### Option 6: Progressive Improvement Loop ⭐ **RECOMMENDED LONG-TERM STRATEGY**

**Description**: Systematic improvement using real student data

**Implementation Phases**:

#### Phase 1 (Weeks 1-2): Quick Fixes
- Implement Option 1 improvements
- Deploy to production
- Cost: ~$500 dev time, $0.021/question

#### Phase 2 (Weeks 3-8): Data Collection
- Track student performance on every question
- Identify questions students struggle with vs. real test performance
- Flag questions with unusual patterns
- Build dataset of validated questions
- Cost: Analytics infrastructure ~$2,000

#### Phase 3 (Weeks 9-12): Calibration
- Use student data to calibrate difficulty
- Adjust prompts based on error patterns
- A/B test prompt variations
- Cost: 1-2 weeks engineering time

#### Phase 4 (Months 4-6): Human Validation
- Use Option 3 for problematic sub-skills only
- Expert review of flagged questions
- Build gold-standard question dataset
- Cost: $5,000-10,000 for targeted review

#### Phase 5 (Months 6-12): Consider Fine-Tuning
- Evaluate if fine-tuning is warranted
- Use collected data as training set
- Make decision based on actual performance gap
- Cost: TBD based on need

**Total First Year Cost**: $7,500-15,000

**Expected Quality Trajectory**: 75% → 85% → 92% → 95%+

**Pros**:
- ✅ Data-driven decision making
- ✅ Incremental investment based on results
- ✅ Builds valuable student performance data
- ✅ Flexible - can pivot based on what works
- ✅ Most cost-effective path to high quality

**Cons**:
- ⚠️ Takes 6-12 months for full implementation
- ⚠️ Requires discipline to follow process

**Recommendation**: **THIS IS THE SMART PATH** - Balanced approach that minimizes risk

---

## Decision Matrix

| Option | Timeline | Upfront Cost | Ongoing Cost/Q | Quality Target | Risk Level | Recommended? |
|--------|----------|--------------|----------------|----------------|------------|--------------|
| **1. Quick Fixes** | 1-2 weeks | $500 | $0.021 | 95% | Low | ✅ YES - Do Now |
| **2. Fine-Tuning** | 2-3 months | $40k-80k | $0.01 | 95%+ | High | ⚠️ Maybe Later |
| **3. Human Review** | 2-4 weeks | $15k-45k | $5-15 | 98-100% | Low | ⚠️ Targeted Use |
| **4. Ensemble** | 1 week | $1,000 | $0.043 | 90-95% | Low | ⚠️ Optional |
| **5. License** | 3-6 months | $300k-1.2M | High | 100% | Very High | ❌ No |
| **6. Progressive** | 6-12 months | $7.5k-15k | $0.021-0.03 | 95%+ | Low | ✅ YES - Strategy |

---

## Specific Answers to Your Questions

### "Do we need to train an LLM?"

**Short answer**: No, not yet.

**Detailed answer**:
- Your current LLM (Claude Sonnet 4) is state-of-the-art and capable
- The issues are in **validation**, **prompting**, and **calibration** - not model capability
- Training a custom LLM costs $40k-80k upfront + ongoing maintenance
- **First** fix the validation gaps (Option 1) - this will likely solve 80% of issues
- **Then** collect student performance data for 3-6 months
- **Finally** evaluate if a custom model is worth the investment based on actual remaining gap

**Recommendation**: Don't train a model now. Fix validation first, measure results, then decide.

---

### "Do we need to feed an engine data?"

**Short answer**: Yes, but not the way you might think.

**What you DON'T need**:
- ❌ Large corpus of existing test questions for training
- ❌ Massive datasets for machine learning
- ❌ Historical student performance (nice to have, not required)

**What you DO need**:
- ✅ Better validation data (real test examples for comparison)
- ✅ Curriculum-aligned difficulty benchmarks
- ✅ Student performance feedback loop (collect going forward)
- ✅ Expert teacher review on sample questions (for calibration)

**Implementation**:
1. Get 10-20 real questions per test type (for style comparison)
2. Have 2-3 expert teachers rate 50 generated questions for authenticity
3. Start tracking which generated questions students struggle with
4. Use this data to improve prompts and validation

**Cost**: $2,000-5,000 one-time for expert review + real test samples

---

### "What are my various options?"

See detailed analysis above. **Summary**:

1. **Quick Wins** (Option 1) - Fix validation gaps → 2 weeks, $500
2. **Fine-Tuning** (Option 2) - Train custom model → 3 months, $40k-80k
3. **Human Review** (Option 3) - Expert validation → 4 weeks, $15k-45k one-time
4. **Ensemble** (Option 4) - Multi-model validation → 1 week, 2x costs
5. **License Real Questions** (Option 5) - Buy authentic content → 6 months, $300k+
6. **Progressive Loop** (Option 6) - Systematic improvement → 12 months, $7.5k-15k

---

## Recommended Action Plan

### 🚨 IMMEDIATE (This Week)
1. Implement **Option 1** critical fixes:
   - Add distractor validation
   - Expand hallucination detection
   - Set temperature parameters
   - Start work on prompt reduction

**Cost**: 3-5 days engineering time
**Impact**: Should fix 70-80% of parent complaints

### 📊 SHORT-TERM (Weeks 2-8)
2. Implement **Option 6 Phase 2** - Data collection:
   - Track student performance on every question
   - Flag questions with issues
   - A/B test improved vs old questions

**Cost**: ~$2,000 analytics infrastructure
**Impact**: Build data foundation for decisions

### 🎯 MEDIUM-TERM (Weeks 9-16)
3. **Targeted human review** (Option 3) for problem areas:
   - Identify 2-3 most problematic sub-skills from data
   - Hire expert teacher to review/rewrite those questions
   - Use as gold standard for prompt improvement

**Cost**: $2,000-5,000 for targeted review
**Impact**: Fix specific quality issues, build training data

### 🔮 LONG-TERM (Months 4-12)
4. **Evaluate fine-tuning** (Option 2) based on results:
   - If quality gap remains after Option 1 + 3, consider fine-tuning
   - Use collected student data + expert-reviewed questions as training set
   - Make data-driven decision

**Cost**: TBD based on actual need
**Impact**: Only invest if justified by data

---

## Cost Comparison

### Immediate Fix (Option 1)
- **Total cost**: ~$500 engineering + $0.001/question increase
- **For 3,000 questions**: $500 + $3 = **$503**
- **Quality improvement**: 75% → 95%

### Full Human Review (Option 3)
- **Total cost**: $5-15 per question
- **For 3,000 questions**: **$15,000-45,000**
- **Quality improvement**: 75% → 98%

### Fine-Tuning (Option 2)
- **Total cost**: $40,000-80,000 first year
- **Ongoing**: $2,000-5,000/month
- **Quality improvement**: 75% → 95%+

### Progressive Approach (Option 6) ⭐
- **Year 1 total**: $7,500-15,000
- **Ongoing**: Minimal
- **Quality improvement**: 75% → 95%+ over time

---

## What Best-in-Class Looks Like

### Top-Tier Test Prep Companies (e.g., Kaplan, Princeton Review)
- **Approach**: Hybrid - LLM drafts + expert teacher review
- **Quality**: 98%+ accuracy
- **Cost**: $10-20 per question (justified by scale)
- **Timeline**: Years to build question banks

### Educational AI Companies (e.g., Khan Academy, Duolingo)
- **Approach**: Custom fine-tuned models + extensive student data
- **Quality**: 95%+ accuracy
- **Cost**: Millions in R&D investment
- **Timeline**: Multi-year development

### Your Optimal Path (Startup with MVP)
- **Approach**: Option 6 - Progressive improvement
- **Quality**: 95% target (good enough for $199 price point)
- **Cost**: $7.5k-15k first year
- **Timeline**: 6-12 months to excellence

---

## Addressing Parent Complaints Directly

### Complaint 1: "Errors in explanations and correct answers"
**Root cause**: No distractor validation, limited hallucination detection
**Solution**: Option 1 - Add distractor validation + expand hallucination patterns
**Timeline**: 1-2 weeks
**Expected fix**: 90% reduction in errors

### Complaint 2: "Questions aren't reflective of actual test style"
**Root cause**: No comparison to real tests, subjective authenticity assessment
**Solution**:
- Get 10-20 real questions per test (legal samples/past papers)
- Have Claude compare generated questions to real examples
- Score authenticity objectively
**Timeline**: 2-3 weeks
**Cost**: $500-1,000 for real test samples + engineering
**Expected fix**: 80% improvement in style matching

### Complaint 3: "Questions too difficult, decrease student morale"
**Root cause**: No difficulty calibration based on real student performance
**Solution**:
- Track which questions students get wrong
- Compare to stated difficulty level
- Re-calibrate prompts based on actual data
- Add "confidence builder" easy questions
**Timeline**: 4-6 weeks (need data collection period)
**Expected fix**: Proper difficulty distribution based on real performance

---

## Final Recommendation

### DO THIS NOW (Week 1-2):
✅ **Option 1**: Implement critical validation fixes
- Cost: $500
- Impact: Fix 70-80% of quality issues
- Risk: Very low

### DO THIS NEXT (Week 3-8):
✅ **Option 6 Phase 2**: Collect student performance data
- Cost: $2,000
- Impact: Foundation for all future decisions
- Risk: Low

### EVALUATE LATER (Month 3-6):
⚠️ **Targeted Option 3**: Human review of problem areas
- Cost: $2,000-5,000
- Impact: Fix specific quality gaps
- Decision: Based on data from Phase 2

### DECIDE IN MONTH 6-12:
🔮 **Option 2**: Fine-tuning (only if needed)
- Cost: $40,000-80,000
- Impact: Competitive moat, long-term quality
- Decision: Make data-driven choice based on actual remaining quality gap

---

## Success Metrics

Track these metrics to measure improvement:

### Quality Metrics
- Error rate (wrong correct answers): Target <2%
- Hallucination rate: Target <1%
- Distractor quality (parent complaints): Target <3%
- Test style authenticity score: Target >85%

### Business Metrics
- Parent satisfaction (NPS): Target >50
- Question regeneration rate: Target <10%
- Support tickets about question quality: Target 50% reduction
- Student completion rates: Target >80%

### Cost Metrics
- Cost per question: Target <$0.03
- Engineering time on quality issues: Target 50% reduction
- Parent refund rate: Target <2%

---

## Timeline Summary

| Month | Action | Cost | Expected Quality |
|-------|--------|------|------------------|
| 0 (Now) | Current state | - | 75% |
| 1 | Option 1 fixes | $500 | 85% |
| 2-3 | Data collection | $2,000 | 87% |
| 4-5 | Prompt calibration | $1,000 | 90% |
| 6-8 | Targeted human review | $5,000 | 93% |
| 9-12 | Refinement + decide on fine-tuning | TBD | 95%+ |

**Total Year 1 Investment**: $8,500 + potential fine-tuning
**Expected Outcome**: 95%+ quality, happy parents, sustainable system

---

*Created: January 30, 2026*
*Analysis based on: Comprehensive codebase review, industry best practices, cost-benefit analysis*
