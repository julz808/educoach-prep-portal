# EduCoach Prep Portal - Product Requirements Document (PRD)

## 1. Product Overview

### 1.1 Mission Statement
EduCoach Prep Portal is a comprehensive AI-powered educational assessment platform designed to help Year 5-9 students prepare for standardized tests including NAPLAN, scholarship exams, and selective school entry tests through personalized question generation and adaptive practice.

### 1.2 Target Users
- **Primary**: Year 5-9 students preparing for standardized tests
- **Secondary**: Parents seeking quality test preparation resources
- **Tertiary**: Tutors and educators looking for assessment tools

### 1.3 Core Value Proposition
- AI-generated questions that match official test standards and difficulty levels
- Comprehensive coverage of all major Australian educational assessments
- Adaptive difficulty scaling (1-3) relative to each test type's standards
- Visual component support for geometry, data interpretation, and pattern recognition
- Authentic test experience with proper timing and format simulation

## 2. Supported Test Types and Specifications

### 2.1 NAPLAN Tests

#### Year 5 NAPLAN
- **Reading**: 40-45 questions, 50 minutes, Multiple choice
  - Text comprehension, Identifying main ideas, Making inferences
  - Understanding vocabulary in context, Analyzing text structure
  - Cause and effect relationships, Drawing conclusions

- **Writing**: 1 question, 40 minutes, Extended response
  - Narrative writing, Persuasive writing

- **Language Conventions**: 50-55 questions, 45 minutes, Multiple choice
  - Spelling, Grammar, Punctuation, Sentence structure, Vocabulary knowledge

- **Numeracy**: 35-40 questions, 50 minutes, Multiple choice
  - Number and place value, Number operations, Fractions and decimals
  - Patterns and algebra, Measurement, Geometry*, Statistics and probability*
  - Problem solving (*Visual components required)

#### Year 7 NAPLAN
- **Reading**: 45-50 questions, 65 minutes, Multiple choice
  - Text comprehension, Inferential reasoning, Critical analysis
  - Literary device recognition, Vocabulary in context
  - Text structure analysis, Author's purpose and perspective

- **Writing**: 1 question, 40 minutes, Extended response
  - Narrative writing, Persuasive writing

- **Language Conventions**: 60-65 questions, 45 minutes, Multiple choice
  - Advanced spelling patterns, Complex grammar structures
  - Punctuation rules, Sentence construction, Academic vocabulary

- **Numeracy**: 45-50 questions, 65 minutes, Multiple choice
  - Number operations with integers, Algebraic thinking, Advanced measurement
  - Geometric reasoning*, Statistics and probability*
  - Mathematical modeling, Problem solving and reasoning (*Visual components required)

### 2.2 Scholarship Tests

#### ACER Scholarship (Year 7 Entry)
- **Reading Comprehension**: 30 questions, 30 minutes, Multiple choice
  - Comprehension and interpretation, Critical thinking, Inference and deduction
  - Analysis of written and visual material*, Cross-curricular content analysis
  - Fiction and non-fiction interpretation, Poetry and diagram analysis*

- **Mathematics**: 25 questions, 30 minutes, Multiple choice
  - Mathematical reasoning, Quantitative problem solving, Pattern recognition*
  - Spatial reasoning*, Mathematical analysis and interpretation
  - Information selection and transformation, Relationship identification

- **Written Expression**: 2 questions, 30 minutes, Extended response
  - Creative writing, Analytical writing

- **Thinking Skills**: 30 questions, 30 minutes, Multiple choice
  - Abstract reasoning*, Logical deduction, Pattern recognition*
  - Visual problem-solving*, Critical thinking
  - Spatial visualization*, Verbal analogies

#### EduTest Scholarship (Year 7 Entry)
- **Reading Comprehension**: 40 questions, 30 minutes, Multiple choice
  - Text interpretation, Reading comprehension, Inference making
  - Sentence completion, Punctuation correction
  - Fiction and non-fiction analysis, Poetry interpretation

- **Mathematics**: 30 questions, 30 minutes, Multiple choice
  - Year-level mathematical knowledge, Number operations, Measurement
  - Algebra, Space and geometry*, Data and statistics*
  - Problem solving (*Visual components required)

- **Verbal Reasoning**: 30 questions, 30 minutes, Multiple choice
  - Word analogies, Logical deduction, Semantic relationships
  - Verbal classification, Language pattern recognition, Vocabulary reasoning

- **Numerical Reasoning**: 30 questions, 30 minutes, Multiple choice
  - Number pattern recognition, Quantitative relationships
  - Mathematical problem solving, Data interpretation*
  - Logical reasoning with numbers, Sequence completion

- **Written Expression**: 1-2 questions, 30 minutes, Extended response
  - Creative writing, Persuasive writing, Descriptive writing
  - Narrative writing, Expository writing

### 2.3 Selective School Entry Tests

#### NSW Selective Entry (Year 7 Entry)
- **Reading**: 40 questions, 40 minutes, Multiple choice
  - Reading comprehension, Text analysis, Inference making
  - Vocabulary understanding, Main idea identification
  - Author's purpose, Fiction and non-fiction interpretation, Poetry analysis

- **Mathematical Reasoning**: 40 questions, 40 minutes, Multiple choice
  - Mathematical problem solving, Numerical reasoning, Conceptual understanding
  - Problem-solving strategies, Mathematical applications
  - Spatial understanding*, Pattern identification*, Logical mathematical thinking

- **Thinking Skills**: 40 questions, 40 minutes, Multiple choice
  - Critical thinking, Logical reasoning, Problem solving
  - Verbal reasoning, Spatial reasoning*, Pattern identification*
  - Deductive reasoning, Multi-step problem solving

- **Writing**: 1 question, 30 minutes, Extended response
  - Creative writing, Imaginative writing

#### VIC Selective Entry (Year 9 Entry)
- **Reading Reasoning**: 30 questions, 45 minutes, Multiple choice
  - Reading comprehension, Inferential reasoning, Text analysis
  - Critical interpretation, Implicit meaning understanding
  - Deductive reasoning from text, Academic knowledge application

- **Mathematical Reasoning**: 30 questions, 45 minutes, Multiple choice
  - Mathematical problem solving, Multi-step reasoning
  - Complex mathematical concepts, Mathematical modeling
  - Advanced numerical reasoning, Spatial problem solving*
  - Mathematical application (*Visual components required)

- **Verbal Reasoning**: 30 questions, 45 minutes, Multiple choice
  - Pattern detection with words, Vocabulary reasoning, Word relationships
  - Odd word identification, Word meaning analysis
  - Letter manipulation, Logical word consequences

- **Quantitative Reasoning**: 30 questions, 45 minutes, Multiple choice
  - Number pattern recognition, Quantitative problem solving
  - Mathematical sequence analysis, Numerical relationships
  - Word problem solving, Mathematical reasoning, Quantitative analysis

- **Written Expression**: 2 questions, 60 minutes, Extended response
  - Creative writing, Analytical writing

## 3. Core Features and Functionality

### 3.1 Question Generation System
- **AI-Powered Generation**: Claude 4 Sonnet integration for authentic question creation
- **Difficulty Scaling**: 1-3 difficulty levels relative to each test type's standards
  - Level 1: Accessible (easier questions within the test type)
  - Level 2: Standard (typical difficulty for the test type)
  - Level 3: Challenging (harder questions within the test type)
- **Visual Component Support**: Automatic generation of geometry diagrams, charts, patterns
- **Sub-skill Targeting**: Precise alignment with curriculum-specific learning objectives

### 3.2 Test Modes
- **Practice Mode**: Individual section practice with immediate feedback
- **Diagnostic Mode**: Comprehensive assessment to identify strengths/weaknesses
- **Drill Mode**: Focused practice on specific sub-skills
- **Full Test Mode**: Complete test simulation with official timing

### 3.3 Assessment Features
- **Authentic Timing**: Official test duration simulation
- **Format Compliance**: Multiple choice and extended response formats
- **Progress Tracking**: Detailed analytics on performance by sub-skill
- **Adaptive Feedback**: Personalized recommendations based on results

## 4. Technical Architecture

### 4.1 Core Technologies
- **Frontend**: React with TypeScript
- **Backend**: Node.js with TypeScript
- **AI Integration**: Claude 4 Sonnet API
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Secure user management system

### 4.2 Data Structure
- **Unified Sub-Skills**: Comprehensive taxonomy of all test sub-skills
- **Visual Requirements**: Automated identification of questions requiring diagrams
- **Question Metadata**: Difficulty, sub-skill, test type, timing information
- **Performance Analytics**: Detailed tracking of student progress

## 5. Quality Assurance

### 5.1 Content Standards
- **Curriculum Alignment**: Strict adherence to official test specifications
- **Difficulty Calibration**: Relative difficulty scaling within each test type
- **Visual Accuracy**: Proper geometric and chart representations
- **Language Appropriateness**: Age-appropriate vocabulary and complexity

### 5.2 Technical Standards
- **Response Times**: Sub-second question generation
- **Scalability**: Support for concurrent users
- **Data Security**: Encryption and privacy protection
- **Accessibility**: WCAG compliance for inclusive design

## 6. Success Metrics

### 6.1 Educational Outcomes
- **Score Improvement**: Measurable gains in practice test performance
- **Skill Development**: Progress across individual sub-skills
- **Test Readiness**: Confidence and familiarity with test formats

### 6.2 Product Metrics
- **User Engagement**: Session duration and return rates
- **Content Quality**: Question accuracy and appropriateness ratings
- **System Performance**: Uptime and response reliability

## 7. Future Enhancements

### 7.1 Content Expansion
- **Additional Test Types**: State-specific and international assessments
- **Advanced Analytics**: Predictive performance modeling
- **Collaborative Features**: Teacher/parent dashboards

### 7.2 Technology Evolution
- **Enhanced AI**: More sophisticated question generation algorithms
- **Mobile Optimization**: Native mobile application development
- **Offline Capability**: Download practice tests for offline use

---

*This PRD reflects the authoritative test structure data and serves as the definitive specification for the EduCoach Prep Portal platform.*

```sql
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_type VARCHAR(50) NOT NULL,
  year_level INTEGER NOT NULL,
  section_name VARCHAR(100) NOT NULL,
  sub_skill VARCHAR(100) NOT NULL,
  difficulty INTEGER, -- 1-3
  response_type VARCHAR(20) NOT NULL,
  question_text TEXT NOT NULL,
  answer_options JSONB,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  has_visual BOOLEAN DEFAULT FALSE,
  visual_data JSONB,
  passage_id UUID REFERENCES passages(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
``` 