# EduCourse Question Generation System

## Overview

The EduCourse Question Generation System is an AI-powered platform that creates curriculum-aligned questions for Australian standardized tests. It leverages Claude 4 API to generate high-quality, contextually appropriate questions that align with Australian educational standards.

## Features

### 🎯 Curriculum Alignment
- **Test Types Supported**: Year 5 NAPLAN, Year 7 NAPLAN, ACER Year 6, EduTest Year 6, NSW Selective Year 6, VIC Selective Year 8
- **Sub-Skills Coverage**: Text Comprehension, Language Skills, Mathematics, Cognitive Skills, Written Expression
- **Difficulty Mapping**: Automatic difficulty assignment based on curriculum standards
- **Australian Context**: Questions incorporate Australian cultural references and contexts

### 🤖 AI-Powered Generation
- **Claude 4 Integration**: Advanced language model for high-quality question generation
- **Multiple Question Types**: Multiple choice, short answer, and comprehension questions
- **Visual Support**: Automatic detection and description of visual requirements
- **Passage Generation**: Creates reading passages when needed for comprehension questions

### 📊 Admin Interface
- **Interactive Dashboard**: Real-time statistics and generation metrics
- **Batch Generation**: Generate entire test sections or individual questions
- **Preview System**: Review generated questions before saving to database
- **Quality Control**: Built-in validation and curriculum compliance checking

## System Architecture

### Database Schema

The system uses the following key tables:

```sql
-- Questions table
CREATE TABLE questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_type text NOT NULL,
  year_level integer NOT NULL,
  section_name text NOT NULL,
  sub_skill text NOT NULL,
  difficulty integer NOT NULL,
  passage_id uuid REFERENCES passages(id),
  question_text text NOT NULL,
  answer_options jsonb NOT NULL,
  correct_answer text NOT NULL,
  explanation text,
  has_visual boolean DEFAULT false,
  visual_data jsonb,
  created_at timestamptz DEFAULT now()
);

-- Passages table
CREATE TABLE passages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_type text NOT NULL,
  year_level integer NOT NULL,
  section_name text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  passage_type text NOT NULL,
  word_count integer NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

### Core Components

#### 1. Curriculum Data (`src/data/curriculumData.ts`)
- **TEST_STRUCTURES**: Defines test specifications and requirements
- **UNIFIED_SUB_SKILLS**: Maps sub-skills across different test types
- **SUB_SKILL_DIFFICULTIES**: Difficulty levels for each sub-skill by test type
- **AUSTRALIAN_CONTEXT_TOPICS**: Context topics for question generation

#### 2. Question Generation Service (`src/services/questionGenerationService.ts`)
- **generateQuestions()**: Main function for generating individual questions
- **generateTestSection()**: Batch generation for entire test sections
- **saveGeneratedQuestions()**: Database persistence with validation
- **getGenerationStats()**: Analytics and reporting

#### 3. Admin Interface (`src/components/QuestionGenerationAdmin.tsx`)
- **Test Type Selection**: Choose from available Australian tests
- **Section Management**: Select specific test sections
- **Sub-Skill Targeting**: Focus on particular curriculum areas
- **Real-time Preview**: Review questions before saving

## Usage Guide

### Basic Question Generation

1. **Select Test Type**: Choose from Year 5 NAPLAN, Year 7 NAPLAN, etc.
2. **Choose Section**: Pick the relevant test section (Reading, Language, etc.)
3. **Select Sub-Skill**: Target specific curriculum areas
4. **Set Quantity**: Choose number of questions (1, 3, 5, or 10)
5. **Generate**: Click to create questions using AI
6. **Review**: Preview generated questions and passages
7. **Save**: Store approved questions to database

### Batch Generation

For generating entire test sections:

1. Select test type and section
2. Click "Generate Full Section"
3. System automatically distributes questions across all sub-skills
4. Review and approve generated content
5. Save to database with compliance tracking

### API Integration

The system integrates with Claude 4 API for question generation:

```typescript
const request: QuestionGenerationRequest = {
  testType: 'Year_5_NAPLAN',
  yearLevel: 'Year 5',
  sectionName: 'Reading',
  subSkill: 'Text Comprehension - Explicit',
  difficulty: 3,
  questionCount: 5,
  australianContext: true
};

const response = await generateQuestions(request);
```

## Configuration

### Environment Variables

```env
VITE_CLAUDE_API_KEY=your_claude_api_key_here
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Curriculum Customization

The curriculum data can be customized by modifying:

- **Test structures** in `TEST_STRUCTURES`
- **Sub-skill definitions** in `UNIFIED_SUB_SKILLS`
- **Difficulty mappings** in `SUB_SKILL_DIFFICULTIES`
- **Context topics** in `AUSTRALIAN_CONTEXT_TOPICS`

## Quality Assurance

### Curriculum Compliance

- **Automatic Validation**: Questions are validated against curriculum standards
- **Difficulty Verification**: Ensures appropriate difficulty levels
- **Context Checking**: Validates Australian cultural relevance
- **Format Compliance**: Ensures questions match test format requirements

### Content Quality

- **AI Review**: Claude 4 provides built-in quality assessment
- **Human Review**: Admin interface allows manual review and editing
- **Feedback Loop**: System learns from approved/rejected questions
- **Version Control**: Tracks question revisions and improvements

## Analytics and Reporting

### Generation Statistics

- **Total Questions**: Track overall question bank size
- **Recent Activity**: Monitor generation trends
- **Test Type Distribution**: Analyze coverage across different tests
- **Sub-Skill Coverage**: Ensure balanced curriculum representation

### Performance Metrics

- **Generation Speed**: Monitor API response times
- **Success Rates**: Track successful question generation
- **Quality Scores**: Measure question approval rates
- **Usage Patterns**: Analyze admin interface usage

## Troubleshooting

### Common Issues

1. **API Rate Limits**: Implement delays between batch generations
2. **Quality Concerns**: Review and adjust prompts for better output
3. **Curriculum Misalignment**: Update difficulty mappings and sub-skill definitions
4. **Database Errors**: Check schema compliance and data validation

### Error Handling

The system includes comprehensive error handling:

- **API Failures**: Graceful degradation with retry logic
- **Validation Errors**: Clear feedback on data issues
- **Database Constraints**: Proper error messages for constraint violations
- **User Interface**: Informative error and success messages

## Future Enhancements

### Planned Features

- **Multi-language Support**: Extend beyond English
- **Advanced Analytics**: Deeper insights into question performance
- **Collaborative Review**: Multi-user approval workflows
- **Integration APIs**: External system integration capabilities
- **Mobile Interface**: Responsive design for mobile devices

### Scalability Considerations

- **Caching Layer**: Implement Redis for frequently accessed data
- **Load Balancing**: Distribute API calls across multiple endpoints
- **Database Optimization**: Index optimization for large question banks
- **CDN Integration**: Faster content delivery for global users

## Support

For technical support or questions about the question generation system:

1. Check the troubleshooting section above
2. Review the error logs in the admin interface
3. Consult the API documentation for Claude 4
4. Contact the development team for assistance

## License

This question generation system is part of the EduCourse platform and is subject to the platform's licensing terms. 