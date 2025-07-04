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

## Section Types and Requirements

### Reading/Reading Comprehension/Humanities Sections
**Passages Required:** YES

#### Diagnostic Tests
- **Passage Structure:** Full-length passages as specified in curriculumData
- **Passage Count:** As per TEST_STRUCTURES (4-8 passages per test)
- **Word Count:** As per curriculumData (150-350 words per passage)
- **Question Distribution:** Multiple questions per passage
- **Diversity Requirements:** High diversity across themes, settings, characters, writing styles

#### Practice Tests (practice_1 through practice_5)
- **Passage Structure:** Full-length passages as specified in curriculumData
- **Passage Count:** As per TEST_STRUCTURES (4-8 passages per test)
- **Word Count:** As per curriculumData (150-350 words per passage)
- **Question Distribution:** Multiple questions per passage
- **Diversity Requirements:** CRITICAL - Each practice test must have completely different:
  - Topics/themes
  - Settings/locations
  - Character names and types
  - Writing styles (narrative, informational, persuasive)
  - Cultural contexts
  - Time periods
  - Scenarios

#### Drill Tests
- **Passage Structure:** Mini-passages (50-150 words each)
- **Passage Count:** 1 passage per question (1:1 ratio)
- **Question Distribution:** 1 question per mini-passage
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

## Passage Diversity Requirements

### High-Priority Diversity Factors
1. **Topics/Themes:** Science, history, literature, current events, arts, sports, environment, technology
2. **Settings:** Urban, rural, historical, contemporary, Australian cities, international locations
3. **Characters:** Diverse names, ages, backgrounds, professions, cultures
4. **Text Types:** Narrative stories, informational articles, persuasive essays, biographical sketches
5. **Writing Styles:** Formal, informal, academic, journalistic, literary
6. **Time Periods:** Historical, contemporary, futuristic (where appropriate)
7. **Cultural Contexts:** Australian, international, multicultural perspectives

### Implementation Rules
- **Within Product:** No repetition of major themes across practice tests
- **Character Names:** Maintain database of used names to avoid repetition
- **Settings:** Rotate through different Australian and international locations
- **Topics:** Ensure broad coverage across subject areas
- **Text Types:** Balance narrative, informational, and persuasive passages

## Australian Context Requirements

### Mandatory Australian Elements
- **Currency:** Australian dollars (AUD)
- **Geography:** Australian cities, states, landmarks
- **Spelling:** Australian English (colour, centre, realise, etc.)
- **Culture:** Australian holidays, sports, customs
- **Education:** Australian school terms, year levels
- **Wildlife:** Native Australian animals where relevant
- **History:** Australian historical events and figures where appropriate

### Balanced International Content
- **Global Perspectives:** Include international content for broader education
- **Cultural Diversity:** Represent various cultures while maintaining Australian focus
- **Universal Themes:** Use themes that resonate with Australian students

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