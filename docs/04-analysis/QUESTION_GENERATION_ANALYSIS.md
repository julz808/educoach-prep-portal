# EduCoach Question Generation Engine - Comprehensive Analysis

## Executive Summary

The EduCoach platform uses Claude AI (Claude Sonnet 4) to generate educational assessment questions across multiple test types (NAPLAN, Selective Entry, ACER, EduTest). The generation system is sophisticated with multi-stage validation, curriculum-based generation, and automatic regeneration mechanisms.

---

## 1. ARCHITECTURE OVERVIEW

### Current LLM/AI System
- **Model**: Claude Sonnet 4 (claude-sonnet-4-20250514)
- **API**: Anthropic Claude API (https://api.anthropic.com/v1/messages)
- **Max Tokens**: 6000 per request
- **Temperature**: Default (unspecified, likely 1.0)
- **Deployment**: Direct API calls from generation scripts + Supabase Edge Functions for secure access

### Key Components
1. **Question Generation Engine** (`src/engines/questionGeneration/`)
   - Individual question generation
   - Batch/test generation
   - Passage generation
   - Validation pipeline

2. **Prompt Building System** (`claudePrompts.ts` - 1,300+ lines)
   - Context-aware prompt templates
   - Test-specific authenticity guidance
   - Visual generation specifications
   - Difficulty calibration

3. **Validation Pipeline**
   - Hallucination detection
   - Independent answer verification
   - Mathematical validation
   - Confidence analysis

4. **Storage & Context Management** (`supabaseStorage.ts`)
   - Supabase PostgreSQL database
   - Generation context tracking
   - Question/passage persistence

---

## 2. GENERATION FLOW (End-to-End)

### Phase 1: Initialization
```
User/Script initiates generation → Load test structure from curriculumData.ts
→ Determine sections, sub-skills, and requirements → Initialize generation context
```

### Phase 2: Curriculum-Based Gap Analysis
```
Analyze existing questions in database → Identify gaps in:
  - Difficulty levels (1, 2, 3)
  - Sub-skills coverage
  - Passage requirements
→ Generate detailed gap report
```

### Phase 3: Passage Generation (if applicable)
```
For each missing passage:
  1. Determine passage type (narrative/informational/persuasive) with rotation
  2. Build passage generation prompt with:
     - Topic selection from topic cycling system
     - Writing style selection
     - Diversity instructions
     - Test-specific authenticity requirements
  3. Call Claude API → parseClaudeResponse → JSON extraction
  4. Validate passage (word count, structure, themes)
  5. Store in Supabase
```

### Phase 4: Question Generation
```
For each missing question:
  1. Select difficulty and sub-skill
  2. Build comprehensive prompt with:
     - Sub-skill description
     - Difficulty calibration (65-80th, 40-60th, 10-30th percentiles)
     - Test-specific guidance
     - Passage reference (if applicable)
     - Distractor quality requirements
     - Visual specifications (if needed)
     - Diversity instructions based on recent questions
  3. Call Claude API with retry logic
  4. Parse JSON response
  5. TWO-STAGE VALIDATION:
     a) Hallucination Detection (Stage 1)
     b) Independent Answer Verification (Stage 2)
  6. If invalid: Regenerate (up to 5 attempts)
  7. If valid: Store in Supabase
```

### Phase 5: Completion & Reporting
```
Generate statistics → Display completion report → Output validation metrics
```

---

## 3. COMPREHENSIVE PROMPT SYSTEM

### Key Sections of Question Prompt (~865 lines)

#### A. Context Diversity Instructions
- Analyzes recent 10 questions in sub-skill
- Provides examples of recent questions
- Mandates completely different approach for:
  - Main scenario/context
  - Opening phrase/structure
  - Character names
  - Professional domain
  - Question format

#### B. Mathematical Validation Requirements
```
MANDATORY VERIFICATION CHECKLIST:
1. Work through problem from scratch
2. Double-check each calculation independently
3. Verify final answer matches exactly ONE option
4. Confirm no mathematical errors

CRITICAL STOP CONDITIONS (regenerate if any apply):
- Calculated answer doesn't match any option
- Uncertainty about calculation steps
- Multiple potentially correct options
- Need to "recalculate" or "try again"
- Contradictions between question, options, solution
```

#### C. Question Structure Variety
```
Mix these approaches:
- ABSTRACT/CONCEPTUAL (often clearest)
- DATA/MEASUREMENT (clear and practical)
- MINIMAL CONTEXT (when story helps)
- REAL-WORLD APPLICATION (when context adds value)

FORBIDDEN patterns:
- "[Name] is [verb] in a [place]" format
- Forcing characters into every question
- Repetitive structures
```

#### D. Test-Specific Authenticity Guidance
Examples for different test types:
- **Year 5 NAPLAN**: Simple language, familiar contexts, concrete examples
- **Year 7 NAPLAN**: More sophisticated vocabulary, multi-step thinking
- **VIC Selective Entry**: Highly competitive standard, complex reasoning
- **NSW Selective Entry**: Analytical thinking, efficient problem-solving
- **EduTest Scholarship**: Private school standard, creativity + accuracy
- **ACER Scholarship**: Academic rigor, deep understanding, evidence-based reasoning

#### E. Distractor Generation (Critical Section)
```
For EACH wrong answer option:
✅ MUST BE:
  1. Plausible enough a student might choose it
  2. Definitively wrong - cannot be defended as correct
  3. Based on common student errors/misconceptions
  4. Clear and unambiguous in incorrectness

🚫 FORBIDDEN DISTRACTOR TYPES:
  - Answers correct under different interpretations
  - "Technically correct" in some contexts but wrong for this question
  - Require specialized knowledge to eliminate
  - Mathematical results from reasonable alternative methods
  - "Somewhat correct" or "on the right track" answers

✅ HIGH-QUALITY STRATEGIES BY SUBJECT:
  - Mathematics: Common calculation errors, wrong order of operations, sign errors, formula mistakes
  - Reading: Details from wrong parts, unsupported inferences, confusing similar concepts
  - Verbal: Relationships that sound logical but don't match, reversed analogies
  - Language: Grammar rules from other contexts, common spelling mistakes
```

#### F. Visual Generation Specifications
- SVG constraints: 300-450px width, 250-350px height
- Color scheme: Primary (#3498DB), Accent (#E74C3C), Text (#2C3E50)
- Font: Arial/sans-serif, 11-14px
- Concise descriptions (max 2-3 sentences for text-only variants)
- Professional appearance, high contrast

#### G. Writing Section Requirements
```
SIMPLIFIED PROMPTS:
- Provide ONLY basic task instruction
- NO word count guidance
- NO content suggestions
- NO structure guidance
- NO assessment criteria
```

### Key Structural Features
1. **Prompt Length**: ~6,000-7,000 tokens per question generation
2. **Retry Logic**: Exponential backoff (1s, 2s, 4s, 8s, 16s)
3. **Max Retries**: 3 for generation, 5 for validation
4. **Temperature**: Not explicitly set (defaults to 1.0)

---

## 4. VALIDATION MECHANISMS

### Stage 1: Hallucination Detection (Optional)
```
Patterns to detect:
- "let me", "my mistake", "upon reflection", "on second thought"
- "VALIDATION_FLAG" in solution
- "recalculate" or "re-calculate"
- Other uncertainty phrases
```

### Stage 2: Logical Structure Validation
```
Required fields check:
- Question text (min 10 characters)
- Solution (min 10 characters)
- For multiple choice:
  - 4 answer options
  - Correct answer matches one option exactly
  - No duplicate options
  - Answer can be:
    * Exact match (case-sensitive or insensitive)
    * Letter answer (A, B, C, D)
    * Option text match
```

### Stage 3: Confidence Analysis
```
Scans solution for uncertainty phrases:
- "doesn't match any option"
- "may be an error"
- "appears to be"
- "closest option"
- "since this isn't listed"
- "there may be"
- "probably", "assuming", "it's possible that"

CONFIDENCE SCORING: 100 - (issues × 20)
Threshold: 75% minimum confidence
```

### Stage 4: Mathematical Validation (When Applicable)
```
For math questions, uses Claude API to:
1. Independently solve the problem
2. Calculate exact answer
3. Check which option matches
4. Flag if no option matches ("NONE" response)
5. Compare original vs. independent answer
```

### Stage 5: Logical Consistency Check
```
Validates:
- Question logic and coherence
- Answer feasibility
- Solution coherence
- Absence of contradictions
```

### Stage 6: Cross-Validation (for critical questions)
```
Fresh solve of question by Claude
Results compared to original answer
Confidence calculated across validations
```

**Overall Validation Result**: 
- Valid = No errors + Confidence ≥ 75%
- Regenerate = Has errors OR Confidence < 75%
- Manual Review = Warnings OR Confidence < 60%

---

## 5. IDENTIFIED WEAKNESSES

### A. Prompt Design Issues

#### 1. Excessive Prompt Length
- **Issue**: Main question prompt exceeds 6,000 tokens before response
- **Impact**: 
  - High API costs
  - Longer response times
  - Potential information loss for LLM
  - Less room for complex reasoning
- **Evidence**: `buildQuestionPrompt()` returns ~6,000-7,000 token prompts

#### 2. Contradictory Guidance
- **Issue**: Multiple conflicting instructions about question structure
  - Promotes "diverse, authentic structures" but then provides highly specific formula examples
  - Emphasizes avoiding formulaic patterns while providing formulaic templates
- **Impact**: Claude may struggle to balance competing requirements

#### 3. Ambiguous Distractor Requirements
- **Issue**: "Plausible enough but definitely wrong" is inherently contradictory
  - Something that is plausible CAN be defended as correct in some interpretations
  - No objective criteria for "common student errors"
- **Impact**: Potential for generating ambiguous distractors

#### 4. Visual Description Instructions Unclear
- **Issue**: Text-only variant instructions say "avoid overly verbose" but then show 3-4 sentence examples
  - Examples of BAD vs GOOD don't clearly show the boundary
  - SVG specifications say "complete, precise" but "no interpretation needed" is subjective
- **Impact**: Inconsistent visual specifications

#### 5. Diversity Instructions Lack Specificity
- **Issue**: "Consciously choose a completely different approach" is vague
  - No quantitative metrics for "different enough"
  - Relies on recent questions which may not be representative
  - Only tracks last 10 questions per sub-skill
- **Impact**: Potential for similar questions within the 10-question window

#### 6. Temperature Setting Missing
- **Issue**: No explicit temperature setting in API calls
  - Defaults to 1.0 (maximum randomness)
  - No balance specification between creativity and consistency
- **Impact**: Less predictable/consistent generation, higher variance in quality

### B. Validation Logic Weaknesses

#### 1. Confidence Analysis Too Simplistic
- **Issue**: Just counts uncertainty phrases (100 - phrases×20)
  - Linear scoring doesn't capture context
  - "probably" in a certainty statement gets flagged same as genuine uncertainty
  - Exact phrase matching misses paraphrases
- **Impact**: False positives/negatives in confidence scoring

#### 2. Mathematical Validation Only Spot-Check
- **Issue**: Only calls Claude API to verify answer for multiple choice
  - Doesn't validate question setup/logic independently
  - Doesn't check if wrong answers are actually wrong
  - Extended response (writing) questions skip intensive validation
- **Impact**: 
  - Math errors in question setup missed
  - Invalid distractors not detected
  - Writing questions not validated at all

#### 3. Hallucination Detection Too Narrow
- **Issue**: Only 4 specific patterns checked
  - Misses many hallucination forms ("actually, wait", "I think", "let me see", etc.)
  - Only checks solution text, not question text
- **Impact**: Some hallucinations slip through

#### 4. No Distractor Validation
- **Issue**: Validation doesn't verify that distractors are:
  - Actually different from each other
  - Genuinely incorrect
  - Plausible
- **Impact**: Low-quality distractors not caught

#### 5. Limited Cross-Validation
- **Issue**: Cross-validation only used "for critical questions" (undefined criteria)
  - Threshold for "critical" not clear
  - Not applied consistently
  - Only regenerates up to 3 times for cross-validation
- **Impact**: Some bad questions may persist

### C. Data & Context Management Issues

#### 1. Limited Generation Context
- **Issue**: 
  - Only tracks "used topics", "used names" (simple string sets)
  - No semantic similarity detection
  - No tracking of question difficulty distribution
  - No learning from past failures
- **Impact**: Limited diversity assurance

#### 2. Passage Diversity Tracking Incomplete
- **Issue**: Tracks recent passages but:
  - Only saves last 5 passages
  - Character/theme/setting tracking is basic
  - No detection of semantic similarity
- **Impact**: Potential repetitive passages

#### 3. Topic Cycling System External
- **Issue**: Relies on external `enhanced-topic-cycling-system.ts` script
  - Requires dynamic import (error-prone)
  - Fallback is generic guidance if import fails
  - No error logging for cycling failures
- **Impact**: Fragile topic selection, silent failures possible

### D. Architectural Issues

#### 1. Distributed Validation
- **Issue**: Validation scattered across multiple files:
  - `questionValidator.ts` (two-stage validation)
  - `validators.ts` (field validation)
  - `validationPipeline.ts` (multi-step pipeline)
  - Hallucination checks in generation scripts
- **Impact**: 
  - Inconsistent validation applied in different contexts
  - Difficult to maintain single source of truth

#### 2. API Key Management
- **Issue**: Checks both `VITE_CLAUDE_API_KEY` and `CLAUDE_API_KEY`
  - Mixed environment variable naming conventions
  - Keys exposed in client-side code (via VITE prefix)
- **Impact**: Security risk if keys get committed

#### 3. No Rate Limiting
- **Issue**: Batch generation scripts don't implement rate limiting
  - Could trigger API throttling
  - 5-second pause between sections is arbitrary
- **Impact**: Potential for API errors, wasted requests

#### 4. Limited Error Recovery
- **Issue**: 
  - Failed questions just logged, not analyzed for patterns
  - No rollback mechanism
  - No compensation strategy (e.g., use simpler question if generation fails 5 times)
- **Impact**: Incomplete test generation if many failures occur

### E. Prompt Engineering Issues

#### 1. Excessive Hedge Language
```
"should be", "try to", "aim to", "do your best"
instead of direct requirements
```
- **Impact**: Less firm guidance for model

#### 2. Inconsistent Examples
- **Issue**: 
  - Examples often don't match the guidance they're supposed to illustrate
  - "GOOD" example is still somewhat verbose per other guidance
  - Test-specific examples may not apply to all tests
- **Impact**: Confusing instruction to Claude

#### 3. Unrealistic Writing Section Guidance
```
"Provide ONLY the basic task instruction"
But example shows: "Write a creative piece about a topic of your choice"
```
- **Issue**: Real writing prompts need more guidance
- **Impact**: Oversimplified writing prompts

### F. Quality Control Gaps

#### 1. No Coverage Metrics
- **Issue**: 
  - Doesn't track which combinations of (test_type, section, difficulty, sub_skill) exist
  - Can't guarantee comprehensive test coverage
- **Impact**: Tests may have gaps not caught by gap analysis

#### 2. No Historical Quality Tracking
- **Issue**: 
  - Doesn't track question quality over time
  - No metrics on regeneration rates per sub-skill
  - No learning from past failures
- **Impact**: Can't identify systematically problematic sub-skills

#### 3. No Distractor Analysis
- **Issue**: 
  - Doesn't track which distractors were commonly selected
  - No A/B testing or student response validation
  - Distractors generated once and assumed good
- **Impact**: May create ineffective distractors

#### 4. Limited Visual Validation
- **Issue**: 
  - SVGs not validated for rendering correctness
  - No check if visual actually helps answer question
  - No accessibility validation (alt text, color contrast)
- **Impact**: Poor quality visuals may reach students

### G. Test-Specific Issues

#### 1. Difficulty Calibration Vague
- **Issue**: "65-80th percentile performance" is aspirational, not measurable
  - No reference to actual student performance data
  - Difficulty distribution hardcoded in code
- **Impact**: Difficulty calibration may not match real tests

#### 2. Australian Context Not Enforced
- **Issue**: 
  - Prompt says "use Australian spelling"
  - But validation doesn't check spelling
  - Prompt says "Australian context" but doesn't define what counts
- **Impact**: American spellings and contexts may slip through

---

## 6. SPECIFIC VULNERABILITIES

### A. Hallucination-Related
1. **Undetected Hallucination Forms**
   - "Wait, I need to reconsider"
   - "Actually, thinking about this more..."
   - "The correct answer is actually..."
   - These slip past the simple regex patterns

2. **Question Setup Hallucinations Not Caught**
   - Question might contain made-up facts
   - Validation only checks solution text
   - No fact-checking against curriculum

### B. Mathematical Quality
1. **Silently Wrong Distractors**
   - If distractor generation is wrong (math error), goes undetected
   - Only final answer verified, not distractors

2. **Ambiguous Math Problems**
   - Problem might be solvable multiple ways
   - Validation only checks if answer matches one option
   - Doesn't verify uniqueness of answer

### C. Repetition Risks
1. **Semantic Repetition Not Detected**
   - Tracking exact names but not similar scenarios
   - "Ali goes to the store" vs "Ahmed goes to the market" treated as different
   - No semantic hashing or similarity detection

2. **Question Bank Size Not Considered**
   - As question bank grows, "recent 10" represents smaller % of total
   - Same question might already exist elsewhere in database

### D. Test Authenticity
1. **No Comparison to Real Tests**
   - Prompts reference "authentic test" but don't provide reference samples
   - Generation judges authenticity subjectively
   - No objective metrics

2. **Curriculum Data May Be Incomplete**
   - `curriculumData.ts` is "source of truth" but may be outdated
   - No version control on curriculum changes
   - Tests evolve but data may not

---

## 7. EXISTING QUALITY CONTROL MECHANISMS

### What IS Working Well

#### 1. Two-Stage Validation Framework
- Hallucination detection as first pass
- Independent answer verification as second pass
- Clear regeneration logic (up to 5 attempts)
- Questions rejected if validation fails

#### 2. Curriculum-Based Generation
- Gap analysis identifies missing content
- Structured approach to coverage
- Respects curriculum requirements
- Prevents over-generation

#### 3. Comprehensive Prompt Engineering
- Detailed instructions across 800+ lines
- Test-specific guidance
- Section-specific requirements
- Difficulty calibration built in

#### 4. Context Awareness
- Tracks generation context during session
- Diversity instructions based on recent questions
- Passage type rotation to prevent repetition
- Writing style cycling system

#### 5. Retry Logic with Exponential Backoff
- Automatic regeneration on failure
- Intelligent retry strategy
- Multiple validation stages before acceptance

#### 6. Database Persistence & Storage
- All questions stored in Supabase
- Validates questions before storage
- Can query for duplicates
- Supports versioning/tracking

---

## 8. RECOMMENDATIONS FOR IMPROVEMENT

### High-Priority Fixes

1. **Optimize Prompt Length**
   - Split into system prompt + few-shot examples + user request
   - Reduce from ~6,000 tokens to ~3,000 tokens
   - Measure impact on quality vs. cost

2. **Implement Semantic Diversity Detection**
   - Use embedding model to detect similar questions
   - Not just exact string matching on names/topics
   - Semantic similarity threshold of 0.85+

3. **Add Comprehensive Distractor Validation**
   - Independently verify each distractor is wrong
   - Check plausibility (e.g., common misconception test)
   - Flag distractors that could be defended

4. **Set Explicit Temperature**
   - For generation: temperature=1.0 (creative)
   - For validation: temperature=0.0 (deterministic)
   - Allow adjustment by test type

5. **Implement Distractor Analysis**
   - Track which options students select
   - Use to improve future distractor generation
   - Identify ineffective distractors

### Medium-Priority Improvements

6. **Enhance Hallucination Detection**
   - Expand pattern matching to 50+ variations
   - Check question text, not just solution
   - Add machine learning confidence scoring

7. **Strengthen Mathematical Validation**
   - Always validate answer uniqueness
   - Verify question setup is mathematically sound
   - Check for multiple valid solutions

8. **Improve Context Management**
   - Increase recent questions from 10 to 50
   - Add semantic similarity tracking
   - Historical performance metrics

9. **Standardize Validation Framework**
   - Single source of truth for validation rules
   - Apply consistently across all generation types
   - Clear logging of validation decisions

10. **Add Coverage Metrics Dashboard**
    - Visual representation of test coverage
    - Identify coverage gaps by sub-skill
    - Track completion progress

### Lower-Priority Enhancements

11. **Implement A/B Testing Framework**
    - Compare different prompt variations
    - Test difficulty calibration
    - Measure student performance on generated questions

12. **Add Real Test Comparison**
    - Store reference questions from official tests
    - Compare generated vs. reference using embeddings
    - Authenticity scoring system

13. **Implement Learning Loop**
    - Track which questions get regenerated most
    - Identify problematic sub-skills
    - Adjust prompt guidance based on patterns

14. **Add Accessibility Validation**
    - Check color contrast in visuals
    - Verify alt text for images
    - Language complexity analysis

---

## 9. SUMMARY TABLE

| Aspect | Current Approach | Weakness Level | Impact |
|--------|------------------|-----------------|--------|
| LLM Model | Claude Sonnet 4 | LOW | Capable but general-purpose |
| Prompt Length | 6,000-7,000 tokens | HIGH | Cost, response quality |
| Temperature Setting | Not specified (defaults 1.0) | MEDIUM | Unpredictable variation |
| Hallucination Detection | 4 regex patterns | HIGH | Many forms slip through |
| Distractor Validation | NOT DONE | CRITICAL | Invalid options may exist |
| Diversity Detection | String matching on names | MEDIUM | Semantic repetition possible |
| Mathematical Validation | Answer-only validation | MEDIUM | Setup errors missed |
| Writing Section Validation | Skipped | MEDIUM | No quality assurance |
| Error Recovery | Regeneration with retry | MEDIUM | Limited fallback options |
| Test Authenticity | Subjective guidance | MEDIUM | No objective metrics |

---

## 10. CONCLUSION

The EduCoach question generation engine is **sophisticated and well-engineered** with multiple validation layers. However, it has several **critical gaps** primarily around:

1. **Distractor Quality** - No validation that wrong answers are actually wrong
2. **Hallucination Detection** - Limited pattern matching
3. **Semantic Diversity** - Relies on simple string matching
4. **Cost Efficiency** - Oversized prompts

The system is **production-ready** but would benefit significantly from the recommended improvements, particularly around distractor validation and prompt optimization.

