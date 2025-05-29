# 🤖 AI Question Generation Approach
## Technical Implementation Guide - Updated December 2024

### **📋 Overview**

This document outlines the comprehensive approach for AI-powered question generation in the EduCourse Prep Portal, leveraging **Claude 4 Sonnet** (`claude-sonnet-4-20250514`) for creating curriculum-aligned, visually-enhanced educational content with advanced educational visual specifications and dual-system compatibility.

---

## **🏗️ Architecture Overview**

### **System Components**
1. **Frontend Question Generator** (`src/services/questionGenerationService.ts`)
2. **Enhanced Educational Visual Generation Engine** with dual specification system
3. **Educational Visual Specification System** (`VisualSpecification` interface)
4. **Legacy Visual Data Support** (backward compatibility)
5. **Database Integration** (PostgreSQL with JSONB storage and test modes)
6. **Multi-Test Mode Support** (Practice 1-5, Diagnostic, Drill)

### **Data Flow**
```
User Request → Frontend Service → Claude 4 Sonnet API → Dual Visual Generator → Database → Response
                                        ↓
                               Educational Visual Specs + Legacy Visual Data
```

---

## **🎯 Enhanced Question Generation Strategy**

### **1. Multi-Modal Test Generation**

#### **Practice Tests (1-5)**
- **Use Case**: Structured practice with progressive difficulty
- **Content Distribution**: Mixed difficulties (1-3) across all sub-skills
- **Question Count**: Full test structure per test type
- **Visual Enhancement**: Educational specifications for improved accuracy

#### **Diagnostic Tests**
- **Use Case**: Comprehensive skill assessment
- **Content Distribution**: Each sub-skill tested once per difficulty level
- **Question Count**: Systematic coverage of all curriculum areas
- **Analysis**: Detailed performance mapping with visual learning insights

#### **Drill Sets**
- **Use Case**: Intensive practice on specific skills
- **Content Distribution**: 30 questions per sub-skill (10 per difficulty)
- **Question Count**: Large volume for skill mastery
- **Performance**: Optimized for high-volume generation with educational visuals

### **2. Advanced Prompt Engineering**

#### **Claude 4 Sonnet Integration**
```typescript
const CLAUDE_MODEL = 'claude-sonnet-4-20250514'; // Latest model
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

const promptTemplate = `
ROLE: Expert Australian educational content creator specializing in Year 6-9 assessments
MODEL: Claude 4 Sonnet (latest capabilities)
CONTEXT: ${testType} for ${yearLevel} students
TASK: Generate ${questionCount} high-quality questions for ${subSkill}
DIFFICULTY: Level ${difficulty}/3 (1=Easy, 2=Medium, 3=Hard)
VISUAL: ${hasVisual ? 'Include educational visual specifications with detailed descriptions' : 'Text-based questions'}
CONTENT APPROACH: ${contextApproach} (Australian/Trending/Universal)
VISUAL_SPECS: Generate both legacy visualData and new educational visualSpecification
`;
```

#### **Content Context Distribution**
```typescript
function getContextApproach(): 'australian' | 'trending' | 'universal' {
  const rand = Math.random();
  if (rand < 0.20) return 'australian';      // 20% Australian context
  if (rand < 0.20) return 'trending';        // 20% trending/engaging content
  return 'universal';                        // 60% universal approach
}
```

#### **Engaging Topics for Year 6-9**
- **Technology**: Minecraft, Roblox, AI, gaming competitions, social media
- **Pop Culture**: Marvel, TikTok, YouTube creators, streaming shows
- **Science**: Space exploration, climate change, robotics, inventions
- **Real-world**: Sports statistics, fundraising data, temperature trends

---

## **🎨 Revolutionary Educational Visual Generation System**

### **1. Dual Visual Specification System**

#### **Educational Visual Specifications** - New System
```typescript
interface VisualSpecification {
  educational_purpose: string; // Specific skill/concept being tested
  visual_type: VisualType; // Specialized diagram category
  detailed_description: string; // Comprehensive, precise description for Engine 2
  key_elements: string[]; // Essential components that must be present
  expected_student_interaction: string; // Exactly what students need to do
  measurement_precision: string; // Required accuracy specifications
  style_requirements: string; // Visual style matching test type
  dimensions: { width: number; height: number; };
}
```

#### **Supported Educational Visual Types**
```typescript
export type VisualType = 
  | 'geometric_grid_diagram'     // Grid-based geometry problems
  | 'bar_chart'                  // Statistical data representation
  | 'line_graph'                 // Trend and change analysis
  | 'pie_chart'                  // Proportion and percentage problems
  | 'technical_drawing'          // Engineering and design problems
  | 'coordinate_plane'           // Algebra and graphing
  | 'pattern_sequence'           // Mathematical pattern recognition
  | 'measurement_diagram'        // Real-world measurement scenarios
  | 'algebra_illustration'       // Visual algebra concepts
  | 'statistical_display';       // Advanced statistical presentations
```

#### **Legacy Visual Data** - Backward Compatibility
```typescript
interface VisualData {
  type: 'geometry' | 'chart' | 'pattern' | 'diagram';
  data: {
    shapes?: Array<{
      type: 'circle' | 'rectangle' | 'triangle' | 'line' | 'point';
      properties: Record<string, any>;
      coordinates?: number[];
    }>;
    annotations?: Array<{
      text: string;
      x: number;
      y: number;
      type: 'dimension' | 'label' | 'note';
    }>;
    // Enhanced chart specifications
    chartType?: 'bar' | 'line' | 'pie' | 'scatter';
    chartData?: Array<{ label: string; value: number; }>;
    // Pattern and algebra elements
    sequence?: any[];
    elements?: any[];
  };
  renderingSpecs: {
    width: number;
    height: number;
    interactive?: boolean;
  };
  description: string;
}
```

### **2. Educational Visual Generation Functions**

#### **Geometric Grid Diagrams**
```typescript
function generateGeometricGridSpec(
  subSkill: string,
  questionContext: string,
  difficulty: number,
  styleRequirements: string,
  dimensions: { width: number; height: number }
): VisualSpecification {
  // Generates precise geometric specifications for area, perimeter, and volume problems
  // Includes grid overlay, measurement annotations, and student interaction guidance
}
```

#### **Statistical Charts**
```typescript
function generateBarChartSpec(
  subSkill: string,
  questionContext: string,
  difficulty: number,
  styleRequirements: string,
  dimensions: { width: number; height: number }
): VisualSpecification {
  // Creates educational bar chart specifications with clear data representation
  // Includes axis labeling, data accuracy, and analytical requirements
}
```

#### **Pattern Recognition Visuals**
```typescript
function generatePatternSequenceSpec(
  subSkill: string,
  questionContext: string,
  difficulty: number,
  styleRequirements: string,
  dimensions: { width: number; height: number }
): VisualSpecification {
  // Develops mathematical pattern visualization with clear sequence rules
  // Includes progression indicators and pattern identification guidance
}
```

### **3. Enhanced Question Integration**

#### **Dual Generation Process**
```typescript
export async function generateQuestions(request: QuestionGenerationRequest): Promise<QuestionGenerationResponse> {
  // Generate questions with both legacy and educational visual specifications
  // Legacy visualData for backward compatibility
  // New visualSpecification for enhanced Engine 2 accuracy
  
  const response = await callClaudeAPI(enhancedPrompt);
  
  // Parse and validate both visual systems
  questions.forEach(q => {
    if (q.hasVisual) {
      q.visualData = generateVisualData(q.subSkill, q.questionText, q.difficulty);
      q.visualSpecification = generateEducationalVisualSpec(
        q.subSkill, q.questionText, q.difficulty, request.testType, request.yearLevel
      );
    }
  });
}
```

---

## **📊 Enhanced Database Integration**

### **1. Updated Database Schema**

#### **Question Storage with Educational Visuals**
```sql
CREATE TABLE questions (
  id UUID PRIMARY KEY,
  test_type VARCHAR NOT NULL,
  year_level INTEGER NOT NULL,
  section_name VARCHAR NOT NULL,
  sub_skill VARCHAR NOT NULL,
  difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 3),
  question_text TEXT NOT NULL,
  has_visual BOOLEAN DEFAULT FALSE,
  visual_type VARCHAR CHECK (visual_type IN ('geometry', 'chart', 'pattern', 'diagram')),
  visual_data JSONB, -- Contains both legacy and educational specifications
  response_type VARCHAR NOT NULL,
  answer_options JSONB,
  correct_answer VARCHAR,
  solution TEXT NOT NULL,
  test_mode VARCHAR, -- practice_1, practice_2, diagnostic, drill
  australian_context BOOLEAN DEFAULT FALSE,
  generated_by VARCHAR DEFAULT 'claude-sonnet-4',
  reviewed BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### **Enhanced Visual Data Storage**
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
    "detailed_description": "A rectangular garden plot on a coordinate grid...",
    "key_elements": ["grid overlay", "labeled dimensions", "measurement units"],
    "expected_student_interaction": "Count grid squares to determine area",
    "measurement_precision": "Exact grid unit counting required",
    "style_requirements": "Clean educational diagram with clear labeling",
    "dimensions": { "width": 400, "height": 300 }
  }
}
```

### **2. Migration Strategy**

#### **Gradual Transition Approach**
1. **Phase 1**: Generate both legacy and educational specifications (current)
2. **Phase 2**: Update database schema to separate fields
3. **Phase 3**: Engine 2 integration with educational specifications
4. **Phase 4**: Gradual phase-out of legacy system

---

## **🚀 Performance & Quality Enhancements**

### **1. Educational Context Integration**

#### **Test-Specific Visual Requirements**
```typescript
function getStyleRequirements(testType: string): string {
  switch (testType) {
    case 'NAPLAN':
      return 'Simple, clear educational diagrams with minimal decoration';
    case 'NSW_Selective':
      return 'Precise technical diagrams with detailed measurements';
    case 'ACER':
      return 'Professional academic-style visuals with clear annotations';
    default:
      return 'Standard educational diagram format';
  }
}
```

#### **Skill-Specific Visual Mapping**
- **Geometry**: Grid-based diagrams with measurement precision
- **Statistics**: Clean chart representations with clear data points
- **Algebra**: Coordinate planes with precise mathematical notation
- **Patterns**: Sequential visual elements with clear progression rules

### **2. Quality Assurance Framework**

#### **Educational Visual Validation**
```typescript
interface EducationalValidation {
  curriculumAlignment: boolean;     // Australian curriculum compliance
  ageAppropriateness: boolean;      // Year 6-9 targeting
  visualClarity: boolean;           // Clear educational purpose
  measurementAccuracy: boolean;     // Precise specifications
  studentInteractionClear: boolean; // Clear interaction expectations
  engineCompatibility: boolean;     // Engine 2 rendering compatibility
}
```

---

## **📈 Advanced Feature Implementation**

### **1. Full Test Mode Generation**

#### **Enhanced Practice Tests**
```typescript
export async function generateFullPracticeTest(
  testType: string,
  practiceTestNumber: number = 1
): Promise<FullTestResponse> {
  // Generate complete test with educational visual specifications
  // Includes reading comprehension with passage analysis
  // Mathematics with enhanced visual accuracy
  // Writing tasks with supporting diagrams where appropriate
}
```

#### **Comprehensive Diagnostic Assessment**
```typescript
export async function generateFullDiagnosticTest(testType: string): Promise<FullTestResponse> {
  // Systematic skill assessment with educational visuals
  // One question per sub-skill per difficulty level
  // Enhanced visual specifications for accurate assessment
}
```

### **2. AI-Enhanced Insights**

#### **Visual Learning Analytics**
- **Visual Effectiveness Tracking**: Monitor which visual types improve student performance
- **Educational Context Analysis**: Analyze the impact of detailed visual specifications
- **Adaptive Visual Selection**: AI-driven selection of optimal visual types per student

---

## **🎯 Current Implementation Status**

### **✅ Completed Features**
- ✅ **Dual Visual System**: Legacy + Educational specifications
- ✅ **10 Specialized Visual Types**: Comprehensive educational coverage
- ✅ **Enhanced Claude Integration**: Updated prompts for dual generation
- ✅ **Database Integration**: Unified storage for both visual systems
- ✅ **Educational Context Mapping**: Test-specific and skill-specific requirements
- ✅ **Backward Compatibility**: Maintained during transition period

### **🔄 In Progress**
- 🔄 **Engine 2 Integration**: Enhanced visual generation with educational specs
- 🔄 **Performance Monitoring**: Visual generation effectiveness tracking
- 🔄 **Database Schema Migration**: Separate fields for visual specifications

### **📋 Future Enhancements**
- 📋 **Advanced Analytics**: Visual learning effectiveness measurement
- 📋 **Adaptive Visual Selection**: AI-driven visual type optimization
- 📋 **Real-time Feedback**: Visual clarity and educational impact analysis
- 📋 **Multi-modal Integration**: Enhanced interactive visual elements

---

**Document Version**: 4.0  
**Last Updated**: December 2024  
**Implementation Status**: Educational Visual System ✅  
**Claude 4 Sonnet**: Integrated ✅  
**Dual Visual System**: Production Ready ✅  
**Educational Specifications**: Comprehensive ✅ 