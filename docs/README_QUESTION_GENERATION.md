# Question Generation System - Claude 4 Sonnet Integration

## Overview

The EduCourse Prep Portal features **advanced AI-powered question generation** using **Claude 4 Sonnet (`claude-sonnet-4-20250514`)** - the latest and most powerful model from Anthropic, enhanced with **sophisticated visual generation**, **intelligent caching**, and **real-time performance monitoring**.

## 🚀 Latest Features

### 🤖 Claude 4 Sonnet Integration
- **Latest Model**: Uses `claude-sonnet-4-20250514` for superior question quality and reasoning
- **Real-time Generation**: Direct API integration with advanced prompt engineering
- **Enhanced Context**: 20% Australian, 20% trending/engaging, 60% universal content distribution
- **Connection Testing**: Built-in API health monitoring and diagnostics

### 🎨 Advanced Visual Generation System
- **4 Visual Types**: Geometry (SVG), Charts (Recharts), Patterns, Algebra/Diagrams
- **Performance Optimized**: React.memo, useMemo, useCallback for optimal rendering
- **Intelligent Caching**: LRU cache with 30-minute expiration and >80% hit rate targeting
- **Real-time Monitoring**: Live performance dashboard with cache analytics

### 🎯 Multi-Test Mode Support
- **Practice Tests 1-5**: Complete structured practice with mixed difficulties
- **Diagnostic Tests**: Systematic skill assessment (each sub-skill × 3 difficulties)
- **Drill Sets**: Intensive practice (30 questions per sub-skill)
- **Multi-Passage Reading**: Realistic test structures with 3-4 questions per passage

### 🔧 Configuration

#### Environment Variables
```bash
# Required: Your Claude API key from Anthropic
VITE_CLAUDE_API_KEY=sk-ant-api03-your-key-here

# Optional: Supabase configuration (if using database)
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-key
```

#### API Key Setup
1. Get your Claude API key from [Anthropic Console](https://console.anthropic.com/)
2. Add it to your `.env` file as `VITE_CLAUDE_API_KEY`
3. The key should start with `sk-ant-`

### 🚀 Enhanced Usage

#### Test API Connection
```typescript
import { testClaudeConnection } from '../services/questionGenerationService';

const result = await testClaudeConnection();
console.log(result); // { success: true, model: 'claude-sonnet-4-20250514' }
```

#### Generate Individual Questions
```typescript
import { generateQuestions } from '../services/questionGenerationService';

const request = {
  testType: 'Year_5_NAPLAN',
  yearLevel: 'Year 5',
  sectionName: 'Numeracy',
  subSkill: 'Number and Place Value',
  difficulty: 2,
  questionCount: 3,
  testMode: 'practice_1' // practice_1-5, diagnostic, drill
};

const result = await generateQuestions(request);
```

#### Generate Complete Practice Tests
```typescript
import { generateFullPracticeTest } from '../services/questionGenerationService';

// Generate Practice Test 1 for Year 6 ACER
const practiceTest = await generateFullPracticeTest('ACER_Year_6', 1);

console.log(`Generated ${practiceTest.totalQuestions} questions across ${practiceTest.sections.length} sections`);
```

#### Generate Diagnostic Assessment
```typescript
import { generateFullDiagnosticTest } from '../services/questionGenerationService';

// Comprehensive diagnostic covering all sub-skills at all difficulty levels
const diagnostic = await generateFullDiagnosticTest('NSW_Selective_Year_6');
```

#### Generate Drill Sets
```typescript
import { generateFullDrillSet } from '../services/questionGenerationService';

// 30 questions per sub-skill for intensive practice
const drillSet = await generateFullDrillSet('EduTest_Year_6');
```

### 📊 Performance Monitoring Dashboard

Access real-time performance metrics for the visual generation system:

```typescript
import VisualPerformanceMonitor from '../components/VisualPerformanceMonitor';

// Component provides:
// - Cache hit rate monitoring (target: >80%)
// - Memory usage tracking
// - Performance efficiency scoring
// - Automatic refresh and cleanup controls
```

### 🎨 Enhanced Visual Components

The system generates sophisticated visual content:

#### **Geometry Visuals**
- **Progressive Complexity**: Basic shapes → Composite shapes → Complex problems
- **Annotations**: Dimension labels, measurement tools, grid lines
- **Educational Context**: Area calculation, perimeter, spatial reasoning

#### **Chart Visuals**
- **Real-world Data**: Video game preferences, temperature trends, fundraising results
- **Interactive Elements**: Hover tooltips, trend lines, target comparisons
- **Australian Context**: Sydney weather, Melbourne events, Perth activities

#### **Pattern Visuals**
- **Mathematical Sequences**: Perfect squares, Fibonacci, geometric progressions
- **Visual Representation**: Color/shape alternation, size progression
- **Engaging Scenarios**: Game patterns, design sequences, logical reasoning

#### **Algebra/Diagram Visuals**
- **Interactive Elements**: Balance scales, number lines, coordinate systems
- **Real-world Context**: Shopping scenarios, measurement problems
- **Progressive Learning**: Basic equations → Multi-step problems → Advanced concepts

### 📈 Performance Optimization Features

#### **Intelligent Caching System**
- **LRU Eviction**: Automatic removal of least recently used visuals
- **30-minute Expiration**: Fresh content while maintaining performance
- **1000-item Capacity**: Optimal memory usage with high hit rates
- **Performance Metrics**: Real-time hit rate and efficiency monitoring

#### **React Performance Optimization**
```typescript
// Optimized visual rendering with memoization
const VisualRenderer = React.memo(({ visualData }) => {
  const memoizedShapes = useMemo(() => visualData.data.shapes, [visualData.data]);
  const renderGeometry = useCallback(() => {
    // Optimized SVG rendering
  }, [memoizedShapes]);
  
  return renderVisual();
});
```

#### **Cache Performance Targets**
- **Hit Rate**: >80% for optimal performance
- **Memory Usage**: <100MB cache size
- **Response Time**: <100ms for cached visuals
- **Generation Time**: <3s for new visuals

### 🛡️ Enhanced Error Handling

The system includes comprehensive error handling and recovery:

- **API Key Validation**: Real-time validation of Claude API credentials
- **Network Resilience**: Automatic retry with exponential backoff
- **Rate Limiting**: Intelligent request throttling and queuing
- **Cache Fallback**: Graceful degradation with cached content
- **Performance Monitoring**: Automatic detection of performance issues

### 🎯 Content Quality & Engagement

#### **Content Distribution Strategy**
- **20% Australian Context**: Local curriculum, geography, cultural references
- **20% Trending/Engaging**: Gaming, social media, technology, pop culture
- **60% Universal**: Globally relatable educational content

#### **Engaging Topics for Year 6-9**
- **Technology**: Minecraft, Roblox, AI, gaming competitions, social media platforms
- **Pop Culture**: Marvel, TikTok, YouTube creators, streaming shows, anime
- **Science**: Space exploration, climate change, robotics, inventions
- **Real-world**: Sports statistics, fundraising data, weather patterns

### 📊 Test Structure Support

#### **Realistic Test Formats**
```typescript
const TEST_PASSAGE_STRUCTURE = {
  'EduTest_Year_6': {
    passageCount: 3,
    questionsPerPassage: 4,
    totalReadingQuestions: 12
  },
  'ACER_Year_6': {
    passageCount: 2,
    questionsPerPassage: 4,
    totalReadingQuestions: 8
  },
  'NSW_Selective_Year_6': {
    passageCount: 2,
    questionsPerPassage: 6,
    totalReadingQuestions: 12
  }
};
```

#### **Complete Test Generation**
- **Practice Tests**: Full test structure with mixed difficulties
- **Diagnostic Tests**: Comprehensive skill coverage
- **Drill Sets**: High-volume targeted practice
- **Multi-Passage Reading**: Realistic comprehension assessments

### 🔧 Technical Implementation

#### **Key Components:**
- `questionGenerationService.ts`: Enhanced service with Claude 4 Sonnet integration
- `visualCacheService.ts`: Intelligent caching system with performance monitoring
- `VisualRenderer.tsx`: Performance-optimized visual component with React.memo
- `VisualPerformanceMonitor.tsx`: Real-time performance dashboard

#### **Enhanced API Configuration:**
- **Model**: `claude-sonnet-4-20250514` (latest)
- **API Version**: `2023-06-01`
- **Max Tokens**: 4000
- **Temperature**: 0.7
- **Performance Optimization**: Intelligent prompt engineering

#### **Database Integration:**
```sql
-- Enhanced question storage with test modes
CREATE TABLE questions (
  id UUID PRIMARY KEY,
  test_type VARCHAR NOT NULL,
  test_mode VARCHAR, -- practice_1, practice_2, diagnostic, drill
  visual_data JSONB, -- Comprehensive visual specifications
  australian_context BOOLEAN DEFAULT FALSE,
  generated_by VARCHAR DEFAULT 'claude-sonnet-4'
);
```

### 🚨 Troubleshooting

#### **Common Issues:**

1. **"Claude API key not found"**
   - Ensure `VITE_CLAUDE_API_KEY` is set in `.env`
   - Key should start with `sk-ant-`
   - Verify API key has sufficient credits

2. **"Cache performance degraded"**
   - Check cache hit rate in performance monitor
   - Clear cache if efficiency drops below 60%
   - Increase cache size if memory allows

3. **"Visual rendering slow"**
   - Monitor performance dashboard
   - Check for memory leaks in browser dev tools
   - Verify React optimization patterns are working

4. **"Generation timeout"**
   - Check network connection and API status
   - Verify prompt complexity isn't exceeding limits
   - Monitor rate limiting and adjust request patterns

### 📊 Performance Monitoring

#### **Real-time Metrics Available:**
- **Cache Hit Rate**: Target >80% for optimal performance
- **Memory Usage**: Live tracking with optimization alerts
- **Generation Success Rate**: >98% successful API calls
- **Response Time**: <3s for new content, <100ms for cached
- **Visual Rendering**: Optimized component performance

#### **Performance Dashboard Features:**
- **Live Metrics**: 5-second auto-refresh capability
- **Cache Management**: Manual clear/cleanup controls
- **Efficiency Scoring**: Color-coded performance indicators
- **Optimization Tips**: Automatic suggestions for improvement

### 📚 API Documentation & Resources

For comprehensive documentation:
- [Anthropic Claude API Docs](https://docs.anthropic.com/claude/reference)
- [Claude 4 Model Information](https://www.anthropic.com/claude)
- [Visual Generation Approach](./QUESTION_GENERATION_APPROACH.md)

### 🎯 Expected Performance

#### **Question Generation Volumes:**
- **Practice Tests**: 45-75 questions per complete test
- **Diagnostic Tests**: 60-90 questions (systematic coverage)
- **Drill Sets**: 300+ questions (intensive practice)
- **Individual Requests**: 1-10 questions per API call

#### **Performance Targets:**
- **Generation Speed**: <3s for individual questions
- **Cache Performance**: >80% hit rate
- **Visual Quality**: 100% rendering success rate
- **User Experience**: Seamless, responsive interface

---

**System Version**: 3.0  
**Last Updated**: December 2024  
**Claude Model**: claude-sonnet-4-20250514 ✅  
**Performance Optimized**: Advanced ✅  
**Visual Caching**: Intelligent ✅  
**Production Ready**: Yes ✅

**Note**: This system uses real AI generation with Claude 4 Sonnet. Ensure you have proper API credits and monitor usage through the performance dashboard. The system is optimized for production use with comprehensive error handling and performance monitoring. 