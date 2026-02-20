# Question Generation Requirements

## Overview
This document provides comprehensive requirements for generating questions across all test products, sections, and modes in the EduCourse platform. It ensures consistency and proper handling of special cases.

## Test Products

### 1. VIC Selective Entry (Year 9 Entry)
- **Sections:** Reading Reasoning, Mathematics Reasoning, General Ability - Verbal, General Ability - Quantitative, Writing
- **Reading Requirements:** Passages required for diagnostic/practice tests, mini-passages for drills
- **Writing Requirements:** 6 drill questions per sub-skill (not 30)

### 2. NSW Selective Entry (Year 7 Entry)
- **Sections:** Reading, Mathematical Reasoning, Thinking Skills, Writing
- **Reading Requirements:** Passages required for diagnostic/practice tests, mini-passages for drills
- **Writing Requirements:** 6 drill questions per sub-skill (not 30)

### 3. Year 5 NAPLAN
- **Sections:** Writing, Reading, Language Conventions, Numeracy No Calculator, Numeracy Calculator
- **Reading Requirements:** Passages required for diagnostic/practice tests, mini-passages for drills
- **Writing Requirements:** 6 drill questions per sub-skill (not 30)

### 4. Year 7 NAPLAN
- **Sections:** Writing, Reading, Language Conventions, Numeracy No Calculator, Numeracy Calculator
- **Reading Requirements:** Passages required for diagnostic/practice tests, mini-passages for drills
- **Writing Requirements:** 6 drill questions per sub-skill (not 30)

### 5. EduTest Scholarship (Year 7 Entry)
- **Sections:** Reading Comprehension, Verbal Reasoning, Numerical Reasoning, Mathematics, Written Expression
- **Reading Requirements:** Passages required for diagnostic/practice tests, mini-passages for drills
- **Writing Requirements:** 6 drill questions per sub-skill (not 30)

### 6. ACER Scholarship (Year 7 Entry)
- **Sections:** Written Expression, Mathematics, Humanities
- **Reading Requirements:** Humanities treated as reading comprehension with passages
- **Writing Requirements:** 6 drill questions per sub-skill (not 30)
- **Special Note:** Humanities section requires passages like reading comprehension
- **Topic Cycling:** Humanities uses same sequential topic cycling system as reading sections (5 text types, 200 topics each)

## Section Types and Requirements

### Reading/Reading Comprehension/Humanities Sections
**Passages Required:** YES
**Topic Cycling:** All sections use sequential topic cycling system with 5 text types
**Writing Style Cycling:** All passages use diverse writing styles to avoid repetitive patterns
**Passage Types:** Narrative, Informational, Persuasive, Procedural, Descriptive

#### Diagnostic Tests
- **Passage Structure:** Full-length passages as specified in curriculumData
- **Passage Storage:** Passages stored in `passages` table
- **Passage Count:** As per TEST_STRUCTURES (4-8 passages per test)
- **Word Count:** As per curriculumData (150-350 words per passage)
- **Question Distribution:** Multiple questions per passage (typically 10 questions per passage)
- **Question Structure:** Questions reference `passage_id`, NO mini-passage in `question_text`
- **Diversity Requirements:** High diversity across themes, settings, characters, writing styles

#### Practice Tests (practice_1 through practice_5)
- **Passage Structure:** Full-length passages as specified in curriculumData
- **Passage Storage:** Passages stored in `passages` table
- **Passage Count:** As per TEST_STRUCTURES (4-8 passages per test)
- **Word Count:** As per curriculumData (150-350 words per passage)
- **Question Distribution:** Multiple questions per passage (typically 10 questions per passage)
- **Question Structure:** Questions reference `passage_id`, NO mini-passage in `question_text`
- **Diversity Requirements:** CRITICAL - Each practice test must have completely different:
  - Topics/themes
  - Settings/locations
  - Character names and types
  - Writing styles (narrative, informational, persuasive, procedural, descriptive)
  - Cultural contexts
  - Time periods
  - Scenarios

#### Drill Tests
- **Passage Structure:** Mini-passages (50-150 words each) embedded in `question_text`
- **Passage Storage:** NO passages in `passages` table (mini-passages contained in questions)
- **Passage Count:** 1 mini-passage per question (1:1 ratio)
- **Question Distribution:** 1 question per mini-passage
- **Question Structure:** Mini-passage included in `question_text`, `passage_id` is NULL
- **Purpose:** Test specific sub-skills with targeted content
- **Diversity Requirements:** Each mini-passage should be unique with different topics

### Writing/Written Expression Sections
**Passages Required:** NO

#### All Test Modes (Diagnostic, Practice, Drill)
- **Question Type:** Extended response questions with writing prompts
- **Drill Quantity:** 6 questions per sub-skill (2 Easy + 2 Medium + 2 Hard)
- **Response Type:** extended_response
- **Special Requirements:** 
  - Australian context where appropriate
  - Age-appropriate topics
  - Clear writing prompts
  - Varied prompt types (narrative, persuasive, informational)

### Mathematics/Numerical/Quantitative Sections
**Passages Required:** NO

#### All Test Modes (Diagnostic, Practice, Drill)
- **Question Type:** Multiple choice mathematical problems
- **Drill Quantity:** 30 questions per sub-skill (10 Easy + 10 Medium + 10 Hard)
- **Response Type:** multiple_choice
- **Special Requirements:**
  - Clear mathematical notation
  - Appropriate difficulty progression
  - Australian context for word problems
  - Varied problem types within sub-skills

### Language Conventions/Verbal Reasoning Sections
**Passages Required:** NO (unless specifically noted)

#### All Test Modes (Diagnostic, Practice, Drill)
- **Question Type:** Multiple choice grammar/language questions
- **Drill Quantity:** 30 questions per sub-skill (10 Easy + 10 Medium + 10 Hard)
- **Response Type:** multiple_choice
- **Special Requirements:**
  - Australian spelling and grammar conventions
  - Age-appropriate vocabulary
  - Varied question formats (sentence completion, error identification, etc.)

## Test Mode Specifications

### Diagnostic Tests
- **Purpose:** Assess current skill level across all sub-skills
- **Structure:** Representative sample of all sub-skills
- **Question Count:** As per TEST_STRUCTURES
- **Difficulty:** Mixed difficulties to assess range

### Practice Tests (practice_1 through practice_5)
- **Purpose:** Full test simulation
- **Structure:** Complete test experience matching real exam format
- **Question Count:** As per TEST_STRUCTURES
- **Difficulty:** Realistic test difficulty distribution
- **Critical Requirement:** Each practice test must be completely unique in content

### Drill Tests
- **Purpose:** Focused skill development
- **Structure:** Targeted practice for specific sub-skills
- **Question Count:** 
  - Writing sections: 6 per sub-skill (2 Easy + 2 Medium + 2 Hard)
  - Academic sections: 30 per sub-skill (10 Easy + 10 Medium + 10 Hard)
- **Difficulty:** Systematic progression within each sub-skill

## Quota Distribution System

### Overview
The quota distribution system ensures correct question generation quantities for each test mode and section. All quotas are defined in `curriculumBasedGapAnalysis.ts`.

### Quota Calculation Rules
- **Practice/Diagnostic Tests:** Question count from TEST_STRUCTURES in curriculumData.ts
- **Drill Tests:**
  - Academic sections (reading, math, reasoning): Sub-skill count × 30 questions
  - Writing sections: Sub-skill count × 6 questions

### Example Quotas

#### EduTest Scholarship (Year 7 Entry)
- **Reading Comprehension:** 50 per practice/diagnostic, 210 drill (7 sub-skills × 30)
- **Verbal Reasoning:** 60 per practice/diagnostic, 240 drill (8 sub-skills × 30)
- **Numerical Reasoning:** 50 per practice/diagnostic, 240 drill (8 sub-skills × 30)
- **Mathematics:** 60 per practice/diagnostic, 240 drill (8 sub-skills × 30)
- **Written Expression:** 2 per practice/diagnostic, 30 drill (5 sub-skills × 6)

### Gap Analysis Features
- **Automatic Detection:** Identifies missing questions by test mode, section, sub-skill
- **Smart Passage Generation:** Only generates passages for practice/diagnostic tests
- **Drill Handling:** No passages generated for drills (mini-passages in question_text)
- **Quota Enforcement:** Prevents over-generation by checking existing questions

## Enhanced Topic Cycling System

### Sequential Topic Selection
- **1,000 Total Topics:** 200 topics per text type (no random selection)
- **5 Text Types:** Narrative, Informational, Persuasive, Procedural, Descriptive
- **Sequential Cycling:** Each text type and topic used in order, preventing repetition
- **Sub-skill Compatibility:** Only compatible text types selected for each sub-skill

### Text Type Definitions and Compatibility

#### Text Type Compatibility Matrix
```
Universal Sub-skills (all text types):
- Literal Comprehension & Detail Extraction
- Main Idea & Theme Identification  
- Vocabulary in Context & Word Meaning
- Text Structure & Organisation

Specific Compatibility:
- Author's Purpose & Intent Analysis: narrative, informational, persuasive, descriptive
- Procedural Understanding & Sequence: procedural only
- Persuasive Techniques & Bias Detection: persuasive only
- Character Analysis & Development: narrative only
```

#### Text Type Examples (200 each)

**Narrative Topics (200)**:
- "The AI that learned to paint like a human"
- "The underground city discovered beneath the school"  
- "Following bioluminescent creatures through dark caves"
- "Building a robot that develops its own personality"

**Informational Topics (200)**:
- "How CRISPR technology is editing genes to cure diseases"
- "The immortal jellyfish that can reverse aging"
- "Why some animals can regenerate lost body parts"
- "The science behind quantum computers and parallel universes"

**Persuasive Topics (200)**:
- "Mars colonization should be our top priority"
- "AI should have rights once it becomes self-aware"
- "Lab-grown meat will save the planet"
- "Video games are the best way to learn problem-solving"

**Procedural Topics (200)**:
- "How to tie different types of knots for various purposes"
- "Steps to create and maintain a terrarium ecosystem"
- "The process of growing vegetables from kitchen scraps"
- "How to perform CPR and basic first aid"

**Descriptive Topics (200)**:
- "The abandoned amusement park reclaimed by nature"
- "A city built entirely in the treetops"
- "The underground lake with glowing walls"
- "A desert that blooms once every decade"

### Implementation Rules
- **Sequential Order:** Topics used in order, cycling through text types
- **Sub-skill Filtering:** Only compatible text types selected for each sub-skill
- **Zero Random Selection:** Eliminates accidental repetition
- **Automatic Reset:** Cycles back to start when all topics exhausted

## Content Standards and Context Requirements

### Mandatory Language Standards
- **Spelling:** UK/Australian English consistently (colour, centre, realise, metre, analyse)
- **Grammar:** Standard Australian English conventions
- **Currency:** Use context-appropriate currency (not restricted to AUD)
- **Measurements:** Metric system with Australian terminology

### Content Diversity and International Perspective
- **Global Settings:** Use diverse international and Australian locations
- **Cultural Variety:** Include characters and scenarios from various cultural backgrounds
- **Universal Themes:** Focus on content that engages and educates students globally
- **Local Relevance:** Include some Australian content as part of natural diversity
- **Accessibility:** Ensure content is accessible to students from diverse backgrounds

### Balanced Content Approach
- **No Geographic Restrictions:** Questions can be set anywhere in the world
- **Cultural Inclusivity:** Represent various cultures, ethnicities, and perspectives
- **Educational Value:** Prioritize learning outcomes over geographic specificity
- **Student Engagement:** Use scenarios and contexts that resonate with the target age group
- **Content Flexibility:** Allow international examples while maintaining language standards

## Writing Style Cycling System

### Overview
To eliminate repetitive writing patterns and ensure authentic diversity in reading passages, the system uses a sophisticated writing style cycling approach that varies:
- **Opening patterns** (avoiding overused phrases like "Imagine..." or "[Character full name]...")
- **Writing styles** (adventure diary, historical fiction, scientific analysis, etc.)
- **Narrative structures** (diary entries, third-person narratives, investigative reports, etc.)
- **Tone and voice** (excited discovery, thoughtful mature, analytical thorough, etc.)

### Style Categories by Text Type

#### Narrative Styles
**Elementary Level (Year 5-7):**
- Adventure diary entries
- Friendship stories
- Age-appropriate mysteries
- Family-centered tales
- School adventures

**Intermediate Level (Year 7-9):**
- Coming-of-age narratives
- Historical fiction
- Contemporary realism
- Adventure quests
- Cross-cultural stories

#### Informational Styles
**Elementary Level (Year 5-7):**
- Nature exploration
- "How it works" explanations
- Amazing facts presentations
- Person/place profiles
- Problem-solution explanations

**Intermediate Level (Year 7-9):**
- Investigative reports
- Scientific analysis
- Historical examination
- Comparative studies
- Trend exploration

#### Persuasive Styles
**Elementary Level (Year 5-7):**
- Student advocacy
- Community voice
- Environmental calls to action
- Safety campaigns
- Positive change advocacy

**Intermediate Level (Year 7-9):**
- Policy arguments
- Social justice advocacy
- Innovation proposals
- Ethical debates
- Cultural preservation

### Opening Pattern Diversity
The system includes diverse opening templates to avoid repetitive structures:
- **Narrative:** Character actions, diary entries, mysterious events, family scenes
- **Informational:** Discovery questions, process introductions, surprising facts, investigations
- **Persuasive:** Student concerns, environmental urgency, policy analysis, justice calls

### Australian Context Integration
Each style naturally incorporates Australian elements:
- **Locations:** Blue Mountains, Great Barrier Reef, local settings
- **Cultural References:** School sports carnivals, community BBQs, ANZAC Day
- **Natural Elements:** Eucalyptus trees, native wildlife, coastal environments

### Implementation
- **Automatic Selection:** System automatically cycles through styles based on difficulty and year level
- **Anti-Repetition:** Tracks used styles to prevent immediate repetition
- **Age Appropriateness:** Ensures style complexity matches target year level
- **Test Authenticity:** Maintains appropriate difficulty while varying style

## Quality Validation Rules

### Passage Quality Checks
- **Readability:** Appropriate for target year level
- **Accuracy:** Factually correct information
- **Engagement:** Interesting and relevant content
- **Length:** Meets specified word count requirements
- **Coherence:** Logical flow and clear structure

### Question Quality Checks
- **Clarity:** Unambiguous question text
- **Difficulty:** Appropriate for specified level
- **Validity:** Tests intended sub-skill
- **Accuracy:** Correct answers and explanations
- **Australian Standards:** Meets curriculum requirements

## Special Cases and Exceptions

### ACER Humanities
- **Treatment:** Handle as reading comprehension section
- **Passages Required:** YES (4 passages for diagnostic/practice)
- **Content Focus:** Historical, cultural, and social studies topics
- **Question Types:** Comprehension and analysis questions
- **Topic Cycling:** Uses sequential topic cycling system with all 5 text types (narrative, informational, persuasive, procedural, descriptive)
- **Sub-skill Compatibility:** Supports same sub-skills as reading comprehension sections
- **Passage Lengths:** Same as reading sections (120 words for drills, curriculum data for practice/diagnostic)

### Writing Sections Across All Products
- **Drill Quantity:** Always 6 questions per sub-skill (never 30)
- **No Passages:** Writing sections never require reading passages
- **Prompt Variety:** Ensure diverse writing prompts across difficulty levels

### Numeracy Calculator vs No Calculator
- **Distinction:** Maintain appropriate question types for each mode
- **Calculator:** Allow for more complex calculations
- **No Calculator:** Focus on mental math and basic operations

## Implementation Guidelines

### For Developers
1. Always check section type before applying generation rules
2. Use helper functions to determine passage requirements
3. Implement diversity tracking across generation sessions
4. Validate content against Australian context requirements
5. Apply appropriate question quantities based on section type

### For Content Reviewers
1. Verify passage diversity across practice tests
2. Check Australian context compliance
3. Ensure appropriate difficulty progression
4. Validate sub-skill alignment
5. Review for cultural sensitivity and inclusivity

## File Structure References
- **Test Structures:** `/src/data/curriculumData.ts` - TEST_STRUCTURES
- **Sub-Skills:** `/src/data/curriculumData.ts` - SECTION_TO_SUB_SKILLS
- **Generation Engine:** `/src/engines/questionGeneration/`
- **Validation:** `/src/engines/questionGeneration/validators.ts`

## Critical Implementation Details

### Passage Handling for Reading Sections
**Practice/Diagnostic Tests:**
- Passages stored in `passages` table with proper UUIDs
- Questions reference `passage_id` (foreign key to passages table)
- NO mini-passage content in `question_text`
- Question text contains only the question itself
- Claude API receives full passage content when generating questions

**Drill Tests:**
- NO passages stored in `passages` table
- Mini-passages (50-150 words) embedded directly in `question_text`
- `passage_id` is NULL for all drill questions
- Self-contained questions with passage and question in one field
- Claude API generates both mini-passage and question together

### Recent Fixes and Improvements

#### UUID Error Resolution
- Fixed: String-based passage IDs causing UUID type errors
- Solution: Removed pre-generated passage IDs from gap analysis
- Passages now get proper UUIDs when stored in database

#### Passage Type Validation
- Fixed: Only accepting 3 passage types instead of 5
- Solution: Updated validators to accept all 5 types (narrative, informational, persuasive, procedural, descriptive)
- All passage types now properly validated and stored

#### Quota Distribution
- Fixed: Incorrect drill quotas (was using fractions of total)
- Solution: Implemented proper quota calculation based on sub-skill counts
- All test products now have correct quotas in `curriculumBasedGapAnalysis.ts`

#### Passage Content Duplication
- Fixed: Both full passage and mini-passage appearing in questions
- Solution: Conditional passage handling based on test mode
- Practice/diagnostic use passage_id, drills use embedded mini-passages

### Generation Scripts
All test product scripts use the centralized curriculum-based generation system:
- `generate-all-remaining-vic-selective.ts`
- `generate-all-remaining-nsw-selective.ts`
- `generate-all-remaining-year5-naplan.ts`
- `generate-all-remaining-year7-naplan.ts`
- `generate-all-remaining-edutest.ts`
- `generate-all-remaining-acer-scholarship.ts`

These scripts automatically inherit all fixes and improvements from the core generation engine.