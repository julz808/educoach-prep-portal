# EduCourse Development Requirements Document
## Updated December 2024 - Current Implementation Status

## Product Overview

EduCourse is an AI-powered test preparation platform for Australian standardized tests. Each product contains diagnostic tests, sub-skill drilling, and practice tests with detailed performance insights and enhanced educational visual generation.

### Product Structure
- **6 Test Products**: Year 5 NAPLAN, Year 7 NAPLAN, ACER Year 7 Entry, EduTest Year 7 Entry, NSW Selective Entry, VIC Selective Entry
- **Per Product Components**:
  - Diagnostic tests (1 question per sub-skill, by test section)
  - Sub-skill drilling (30 questions per sub-skill: 10 per difficulty level 1-3)
  - Practice tests (5 full tests, sectioned format)
  - Performance insights and recommendations
  - Enhanced educational visual specifications

### Difficulty Scale (1-3)
**CRITICAL**: The difficulty scale 1-3 is relative within each test type. Every test type and sub-skill combination supports all three difficulty levels:
- **1 = Accessible**: Easier questions within the specific test type's standards
- **2 = Standard**: Typical questions for the specific test type  
- **3 = Challenging**: Harder questions within the specific test type's standards

A difficulty 2 for NAPLAN Year 5 is different from a difficulty 2 for ACER or NSW Selective. Each test maintains its own internal difficulty progression.

## User Flow

### Core Learning Journey
```
Purchase → Account Creation → Test Selection → Diagnostic (by section) → Insights → Drilling → Practice Tests (by section) → Progress Tracking
```

### Test Structure
- **Diagnostic**: Separate test for each section (Reading, Writing, Mathematics, etc.)
- **Practice Tests**: Each of 5 practice tests broken into sections, not one continuous test
- **Drilling**: Sub-skill specific practice with immediate feedback
- **Enhanced Visuals**: Educational specifications with detailed descriptions for improved accuracy

## Technical Stack & Tools

### Frontend (Existing - Lovable Generated)
- **React** with TypeScript
- **Vite** build tool
- **TanStack Query** for data fetching and state management
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **React Router v6** for navigation

### Backend & Database
- **Supabase** - Database, authentication, real-time subscriptions
- **PostgreSQL** - Database engine via Supabase

### External APIs & Services
- **Anthropic Claude API** - Question generation and AI insights (Claude 4 Sonnet)
- **Stripe** - Payment processing
- **Supabase Auth** - User authentication and management

### Enhanced Question Generation System ✅
- **Dual Visual System**: Educational specifications + legacy support
- **Advanced AI Integration**: Claude 4 Sonnet with enhanced prompts
- **10 Specialized Visual Types**: Comprehensive educational coverage
- **Educational Context**: Test-specific and skill-specific visual requirements
- **Visual Rendering**: Enhanced SVG, charts, and educational diagrams

## Database Schema

### Core Tables
```sql
-- User management
users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE,
  created_at TIMESTAMP,
  stripe_customer_id VARCHAR
)

user_products (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  product_type VARCHAR, -- 'Year_5_NAPLAN', 'NSW_Selective', etc.
  purchased_at TIMESTAMP,
  is_active BOOLEAN
)

-- Enhanced question content with educational visual specifications
questions (
  id UUID PRIMARY KEY,
  test_type VARCHAR NOT NULL,
  year_level INTEGER NOT NULL,
  section_name VARCHAR NOT NULL, -- 'Reading', 'Mathematics', etc.
  sub_skill VARCHAR NOT NULL,
  difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 3),
  question_text TEXT NOT NULL,
  has_visual BOOLEAN DEFAULT FALSE,
  visual_type VARCHAR CHECK (visual_type IN ('geometry', 'chart', 'pattern', 'diagram')),
  visual_data JSONB, -- Enhanced: Contains both legacy and educational specifications
  response_type VARCHAR NOT NULL, -- 'multiple_choice', 'extended_response'
  answer_options JSONB,
  correct_answer VARCHAR,
  solution TEXT NOT NULL,
  test_mode VARCHAR, -- practice_1, practice_2, diagnostic, drill
  australian_context BOOLEAN DEFAULT FALSE,
  generated_by VARCHAR DEFAULT 'claude-sonnet-4',
  reviewed BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
)

passages (
  id UUID PRIMARY KEY,
  test_type VARCHAR,
  year_level INTEGER,
  section_name VARCHAR,
  content TEXT,
  passage_type VARCHAR
)

-- User progress and results
test_attempts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  product_type VARCHAR,
  test_mode VARCHAR, -- 'diagnostic', 'practice', 'drill'
  section_name VARCHAR,
  test_number INTEGER, -- For practice tests 1-5
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  total_questions INTEGER,
  correct_answers INTEGER
)

question_responses (
  id UUID PRIMARY KEY,
  attempt_id UUID REFERENCES test_attempts(id),
  question_id UUID REFERENCES questions(id),
  user_answer TEXT,
  is_correct BOOLEAN,
  time_spent INTEGER, -- seconds
  created_at TIMESTAMP
)

user_sub_skill_progress (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  product_type VARCHAR,
  sub_skill VARCHAR,
  questions_attempted INTEGER,
  questions_correct INTEGER,
  last_practiced TIMESTAMP,
  mastery_level DECIMAL -- 0.0 to 1.0
)
```

## Enhanced Visual Data Structure

### Educational Visual Specifications ✅
```json
{
  "legacy": {
    "type": "geometry",
    "data": { /* traditional visual data structure */ },
    "renderingSpecs": { /* rendering specifications */ },
    "description": "Traditional visual description"
  },
  "educational": {
    "educational_purpose": "Calculate area using grid counting method",
    "visual_type": "geometric_grid_diagram",
    "detailed_description": "A rectangular garden plot on a coordinate grid with clearly marked dimensions...",
    "key_elements": ["grid overlay", "labeled dimensions", "measurement units"],
    "expected_student_interaction": "Count grid squares to determine area",
    "measurement_precision": "Exact grid unit counting required",
    "style_requirements": "Clean educational diagram with clear labeling",
    "dimensions": { "width": 400, "height": 300 }
  }
}
```

### Supported Visual Types ✅
- `geometric_grid_diagram` - Grid-based geometry problems
- `bar_chart` - Statistical data representation  
- `line_graph` - Trend and change analysis
- `pie_chart` - Proportion and percentage problems
- `technical_drawing` - Engineering and design problems
- `coordinate_plane` - Algebra and graphing
- `pattern_sequence` - Mathematical pattern recognition
- `measurement_diagram` - Real-world measurement scenarios
- `algebra_illustration` - Visual algebra concepts
- `statistical_display` - Advanced statistical presentations

## Component Architecture

### Key React Components to Build/Enhance

```typescript
// Main test interface with enhanced visual support
<TestInterface 
  testMode="diagnostic" | "practice" | "drill"
  section={currentSection}
  questions={questions}
  onComplete={handleTestComplete}
  visualSupport={true} // Enhanced visual rendering
/>

// Enhanced question renderer with dual visual system
<QuestionRenderer 
  question={questionData}
  passage={passageData}
  onAnswer={handleAnswer}
  showFeedback={boolean}
  timeLimit={seconds}
  visualData={legacyVisualData} // Backward compatibility
  visualSpecification={educationalSpecification} // Enhanced accuracy
/>

// Test section selector
<SectionSelector 
  sections={availableSections}
  progress={sectionProgress}
  onSectionSelect={handleSectionSelect}
/>

// Enhanced results and insights dashboard
<InsightsDashboard 
  diagnosticResults={results}
  subSkillBreakdown={breakdown}
  recommendations={aiRecommendations}
  visualLearningInsights={visualAnalytics} // New feature
/>

// Sub-skill drilling interface with visual enhancement
<DrillingInterface 
  subSkill={selectedSubSkill}
  difficultyLevel={currentDifficulty}
  progress={skillProgress}
  visualSupport={enhancedVisuals} // Educational specifications
/>
```

### API Endpoints to Implement

```typescript
// Authentication & Products
POST /api/auth/signup
POST /api/auth/login
GET /api/user/products

// Enhanced Test Management
GET /api/tests/:productType/sections - Get available test sections
POST /api/tests/start - Start new test attempt
GET /api/tests/:attemptId - Get test attempt details
POST /api/tests/:attemptId/complete - Complete test attempt

// Enhanced Question Delivery with Visual Specifications
GET /api/questions/diagnostic/:productType/:section - Get diagnostic questions (1 per sub-skill)
GET /api/questions/practice/:productType/:testNumber/:section - Get practice test questions
GET /api/questions/drill/:subSkill/:difficulty - Get drilling questions
GET /api/questions/:questionId/visual-specs - Get educational visual specifications

// Response Handling
POST /api/responses - Submit question response
GET /api/progress/:userId/:productType - Get user progress
GET /api/insights/:userId/:productType - Get AI-generated insights

// Visual System Endpoints
GET /api/visual/specifications/:questionId - Get educational visual specs
POST /api/visual/generate - Generate new visual specifications
GET /api/visual/types - Get supported visual types
```

## Current Implementation Status

### ✅ Completed Features (December 2024)

**Core Question Generation System**
- ✅ **Dual Visual System**: Educational specifications + legacy support
- ✅ **Claude 4 Sonnet Integration**: Advanced AI question generation
- ✅ **10 Specialized Visual Types**: Comprehensive educational coverage
- ✅ **Enhanced Database Schema**: Support for educational specifications
- ✅ **Backward Compatibility**: Maintained during transition period
- ✅ **Test Mode Support**: Practice tests, diagnostic tests, drill sets
- ✅ **Multi-passage Reading**: Complex passage-based question generation
- ✅ **Educational Context**: Test-specific and skill-specific requirements

**Visual Generation Enhancements**
- ✅ **Educational Visual Specifications**: Detailed descriptions for Engine 2
- ✅ **Skill-Specific Visual Mapping**: Geometry, statistics, algebra, patterns
- ✅ **Test-Specific Style Requirements**: NAPLAN, NSW Selective, ACER variations
- ✅ **Measurement Precision Standards**: Exact specifications for visual accuracy
- ✅ **Student Interaction Guidelines**: Clear expectations for visual engagement

**Database & Storage**
- ✅ **Enhanced Question Schema**: Support for both visual systems
- ✅ **JSONB Visual Storage**: Flexible storage for complex specifications
- ✅ **Test Mode Tracking**: Practice/diagnostic/drill differentiation
- ✅ **Generation Metadata**: Tracking and quality assurance

### 🔄 In Progress Features

**Frontend Development**
- 🔄 **Visual Renderer Component**: Enhanced rendering for educational specifications
- 🔄 **Test Interface Components**: Section-based test flow
- 🔄 **Dashboard Enhancement**: Real progress tracking and insights
- 🔄 **Mobile Optimization**: Responsive design for tablet use

**Backend Integration**
- 🔄 **API Endpoint Implementation**: RESTful API for frontend integration
- 🔄 **Authentication System**: Supabase Auth integration
- 🔄 **Payment Processing**: Stripe integration for product purchases
- 🔄 **Real-time Updates**: Live progress tracking

### 📋 Pending Implementation

**User Experience**
- 📋 **Account Management**: User registration and product access
- 📋 **Progress Tracking**: Detailed performance analytics
- 📋 **Recommendation Engine**: AI-driven study suggestions
- 📋 **Offline Capability**: Downloaded content for practice

**Quality Assurance**
- 📋 **Content Validation**: Automated quality checks
- 📋 **Visual Testing**: Cross-browser compatibility
- 📋 **Performance Optimization**: Loading and rendering optimization
- 📋 **Accessibility Features**: WCAG 2.1 AA compliance

**Advanced Features**
- 📋 **Adaptive Difficulty**: Performance-based question selection
- 📋 **Visual Learning Analytics**: Track visual effectiveness
- 📋 **Personalization Engine**: Customized learning paths
- 📋 **Advanced Reporting**: Detailed performance insights

## Development Priority Order

### Phase 1: Frontend Integration (Current Priority)
- **Visual Renderer Component**: Implement dual visual system display
- **Test Interface**: Section-based test flow with enhanced visuals
- **API Integration**: Connect frontend to existing question generation system
- **Basic User Flow**: Registration through test completion

### Phase 2: Enhanced User Experience
- **Dashboard Development**: Real-time progress and insights
- **Payment Integration**: Stripe product purchases
- **Mobile Optimization**: Responsive design refinement
- **Performance Optimization**: Loading and rendering improvements

### Phase 3: Advanced Features
- **AI Insights Integration**: Claude API for personalized recommendations
- **Visual Analytics**: Track visual learning effectiveness
- **Adaptive Systems**: Performance-based content delivery
- **Advanced Reporting**: Comprehensive progress analysis

## Key Technical Considerations

### Visual System Integration
- **Dual Rendering**: Support both legacy and educational specifications
- **Engine 2 Preparation**: Enhanced specifications ready for advanced rendering
- **Browser Compatibility**: SVG and chart rendering across devices
- **Performance**: Optimized visual loading and display

### Data Management
- **Real-time Sync**: Supabase real-time for live progress updates
- **Efficient Caching**: Question and visual content optimization
- **Data Security**: Protected user progress and assessment data
- **Scalability**: Support for multiple concurrent users

### Quality Assurance
- **Content Accuracy**: Educational alignment and difficulty consistency
- **Visual Quality**: Clear, educational visual specifications
- **Performance Standards**: Fast loading and responsive interaction
- **Accessibility**: Inclusive design for all learners

---

**Document Version**: 2.0  
**Last Updated**: December 2024  
**Implementation Status**: Advanced Question Generation ✅  
**Visual System**: Educational Specifications ✅  
**Frontend Development**: In Progress 🔄  
**Production Ready**: Core Features ✅ 