# Question Generation Upgrade - Critical Reading Comprehension Fixes

## Overview

This document outlines the critical issues discovered in the current question generation system and the comprehensive fixes needed to ensure proper handling of reading comprehension passages, difficulty assignments, and passage-to-question ratios.

## Critical Issues Identified

### 1. Incorrect Passage-to-Question Ratios
**Problem**: The current system is generating too many questions per passage for diagnostic and practice tests in reading comprehension sections.

**Root Cause**: The system is not properly using the ratios specified in `curriculumData.ts` TEST_STRUCTURES.

**Example from curriculumData.ts**:
```typescript
"Year 7 NAPLAN": {
  "Reading": {
    "questions": 50, 
    "passages": 8,
    "words_per_passage": 200
  }
}
```
This means: 50 questions across 8 passages = ~6.25 questions per passage

### 2. Incorrect Difficulty Assignment
**Problem**: Questions are being assigned different difficulty levels for the same passage.

**Root Cause**: The system is treating difficulty as a question-level property for reading comprehension, when it should be passage-level.

**Correct Behavior**: For reading/reading comprehension/humanities sections:
- **Passage difficulty** determines the complexity of the text
- **All questions** based on that passage should have the same difficulty level

### 3. Missing Test-Specific Configurations
**Problem**: The generation scripts are not properly detecting and applying test-specific requirements from curriculumData.ts.

**Root Cause**: Generic logic instead of test-specific logic based on curriculum data.

## Required Fixes

### Phase 1: Core Engine Fixes

#### 1.1 Fix Passage-to-Question Ratio Logic
- Read passage counts and question counts from curriculumData.ts TEST_STRUCTURES
- Calculate correct questions-per-passage ratio for each test type
- Implement proper passage sharing for diagnostic/practice tests
- Maintain 1:1 ratio for drill tests (mini-passages)

#### 1.2 Fix Difficulty Assignment for Reading Sections
- Identify reading/reading comprehension/humanities sections
- Assign difficulty at passage level, not question level
- Ensure all questions from the same passage have the same difficulty
- Distribute passage difficulties evenly across easy/medium/hard

#### 1.3 Implement Test-Specific Configuration System
- Create configuration objects for each test type based on curriculumData.ts
- Implement automatic detection of section types and requirements
- Add validation to ensure generated content matches curriculum specifications

### Phase 2: Script Updates

#### 2.1 Update All Generation Scripts
- VIC Selective Entry
- NSW Selective Entry  
- Year 5 NAPLAN
- Year 7 NAPLAN
- EduTest Scholarship
- ACER Scholarship

#### 2.2 Implement Smart Gap Detection
- Scripts should automatically detect missing questions based on:
  - Test section type (reading vs math vs writing)
  - Passage requirements (passages needed vs passages available)
  - Difficulty distribution requirements
  - Question-to-passage ratios

### Phase 3: Validation and Testing

#### 3.1 Implement Comprehensive Validation
- Validate passage-to-question ratios match curriculumData.ts
- Validate difficulty assignments are consistent per passage
- Validate total question counts match curriculum requirements
- Validate passage counts match curriculum requirements

#### 3.2 Create Test Verification Scripts
- Scripts to audit existing questions against curriculum requirements
- Scripts to verify passage-to-question ratios
- Scripts to verify difficulty distributions

## Implementation Plan

### Step 1: Analyze Current State
- Audit curriculumData.ts for all test types and sections
- Document required passage-to-question ratios for each test type
- Identify all reading/reading comprehension/humanities sections

### Step 2: Fix Core Generation Engine
- Update passage generation logic to handle test-specific ratios
- Fix difficulty assignment for reading sections
- Implement curriculum-based configuration system

### Step 3: Update Generation Scripts
- Update all 6 test product scripts to use new engine
- Implement smart gap detection based on curriculum requirements
- Add comprehensive validation and reporting

### Step 4: Update Documentation
- Update QUESTION_GENERATION_FLOW.md with new process
- Update all relevant documentation to reflect changes
- Create verification and maintenance procedures

## Success Criteria

### For Reading Comprehension Sections:
- ✅ Passage-to-question ratios match curriculumData.ts exactly
- ✅ All questions from the same passage have the same difficulty
- ✅ Passage difficulty is assigned at passage level
- ✅ Total questions and passages match curriculum requirements
- ✅ Drill tests maintain 1:1 question-to-passage ratio

### For All Test Types:
- ✅ Generation scripts automatically detect missing content
- ✅ Scripts generate exactly what's needed based on curriculum
- ✅ All test-specific requirements are properly implemented
- ✅ Validation ensures compliance with curriculum specifications

## Timeline

- **Analysis**: Complete analysis of curriculumData.ts and requirements
- **Engine Fixes**: Implement core engine improvements
- **Script Updates**: Update all 6 generation scripts
- **Testing**: Comprehensive testing and validation
- **Documentation**: Update all documentation

This upgrade will ensure the question generation system properly handles reading comprehension requirements and maintains consistency with the curriculum specifications.