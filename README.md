# EduCourse Prep Portal

An AI-powered test preparation platform for Australian standardized tests, featuring a revolutionary dual-engine visual generation system.

## 🏗️ Project Structure

```
educoach-prep-portal-2/
├── 📋 Documentation (Root + docs/)
│   ├── QUESTION_GENERATION_APPROACH.md  # Technical implementation guide
│   ├── PRD_EduCourse.md                 # Product requirements document
│   ├── README.md                        # This file
│   └── docs/                            # Additional documentation
│       ├── archived/                    # Archived/outdated docs
│       ├── VISUAL_GENERATION_UPGRADE.md
│       ├── PRD_EDUCOACH_PREP_PORTAL.md
│       ├── DIFFICULTY_LEVEL_CHANGE.md
│       ├── PRESCRIPTIVE_TOPICS_REMOVAL.md
│       ├── README_QUESTION_GENERATION.md
│       └── expected-question-counts.md
│
├── 🤖 Core Engines
│   └── src/engines/
│       ├── question-generation/         # Engine 1: AI Question Generation
│       │   └── questionGenerationEngine.ts
│       ├── visual-rendering/            # Engine 2: Visual Rendering
│       │   └── visualRenderingEngine.ts
│       └── index.ts                     # Unified engine exports
│
├── 🔧 Application Code
│   └── src/
│       ├── engines/                     # Core engines (above)
│       ├── components/                  # React components
│       ├── pages/                       # Page components  
│       ├── services/                    # API and core services
│       │   └── apiService.ts
│       ├── types/                       # TypeScript type definitions
│       │   └── visual.ts                # Visual system types
│       ├── data/                        # Curriculum and test data
│       │   ├── curriculumData.ts
│       │   ├── dummyData.ts
│       │   └── courses.ts
│       ├── utils/                       # Utility functions
│       │   └── visualCacheService.ts
│       ├── hooks/                       # Custom React hooks
│       ├── lib/                         # Libraries and utilities
│       ├── context/                     # React context providers
│       ├── integrations/                # External service integrations
│       ├── assets/                      # Static assets and generated images
│       │   └── generated-visual-images/
│       ├── tests/                       # Test files (empty)
│       ├── App.tsx                      # Main app component
│       ├── main.tsx                     # App entry point
│       ├── index.css                    # Global styles
│       ├── App.css                      # App-specific styles
│       ├── vite-env.d.ts               # Vite type definitions
│       └── index.html                   # HTML template
│
├── 🛠️ Utilities & Scripts
│   ├── scripts/                         # Generation and utility scripts
│   │   ├── generateEduTestPracticeTest.ts
│   │   ├── generate-visual-images.ts
│   │   ├── debug-visual-data.ts
│   │   ├── run-edutest-diagnostic.ts
│   │   ├── README.md
│   │   ├── SUMMARY.md
│   │   └── examples.md
│   └── supabase/                        # Database migrations and config
│
├── 🏗️ Build & Assets
│   ├── public/                          # Public assets
│   ├── dist/                            # Build output
│   └── node_modules/                    # Dependencies
│
└── ⚙️ Configuration
    ├── package.json                     # Dependencies and scripts
    ├── package-lock.json                # NPM lock file
    ├── bun.lockb                        # Bun lock file
    ├── .env                             # Environment variables
    ├── .gitignore                       # Git ignore rules
    ├── tsconfig.json                    # TypeScript configuration
    ├── tsconfig.app.json                # App-specific TS config
    ├── tsconfig.node.json               # Node-specific TS config
    ├── vite.config.ts                   # Vite build configuration
    ├── tailwind.config.ts               # Tailwind CSS configuration
    ├── postcss.config.js                # PostCSS configuration
    ├── components.json                  # shadcn/ui configuration
    ├── eslint.config.js                 # ESLint configuration
    └── index.html                       # Root HTML file
```

## 🚀 Dual Engine System

### Engine 1: Question Generation
**Location**: `src/engines/question-generation/`
- **Purpose**: AI-powered question generation using Claude 4 Sonnet
- **Features**: 
  - Educational visual specifications
  - Multi-test mode support (Practice, Diagnostic, Drill)
  - Australian curriculum alignment
  - Dual visual system (legacy + educational)

### Engine 2: Visual Image Generation  
**Location**: `src/engines/visual-image-generation/`
- **Purpose**: Converts visual specifications from Engine 1 into PNG images
- **Features**:
  - Claude 4 Sonnet artifact generation
  - HTML/CSS/JavaScript to image conversion
  - Supabase Storage integration
  - Batch processing with rate limiting

### Visual Renderer Components
**Location**: `src/components/visual-rendering/`
- **Purpose**: Renders educational visuals in the application UI
- **Features**:
  - 10 specialized visual types
  - Educational context-aware rendering
  - Legacy visual support for backward compatibility
  - Interactive student engagement elements

## 🎯 Supported Test Types

- **Year 5 NAPLAN** (Reading, Writing, Language Conventions, Numeracy)
- **Year 7 NAPLAN** (Reading, Writing, Language Conventions, Numeracy)  
- **ACER Scholarship** (Year 7 Entry)
- **EduTest Scholarship** (Year 7 Entry)
- **NSW Selective Entry** (Year 7 Entry)
- **VIC Selective Entry** (Year 9 Entry)

## 🎨 Visual System Features

### Educational Visual Types
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

### Dual Specification System
- **Educational Specifications**: Detailed descriptions for enhanced accuracy
- **Legacy Visual Data**: Backward compatibility during transition
- **Test-Specific Styling**: Tailored visual requirements per test type

## 🛠️ Development

### Getting Started
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Key Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production  
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Using the Engines
```typescript
// Import Engine 1 and visual components
import { 
  generateQuestions,
  processVisualQuestions 
} from './src/engines';
import { VisualRenderingEngine } from './src/components/visual-rendering';

// Generate questions with Engine 1
const questions = await generateQuestions({
  testType: 'NSW Selective Entry',
  yearLevel: '7',
  sectionName: 'Mathematical Reasoning',
  subSkill: 'Geometry',
  difficulty: 2,
  questionCount: 5
});

// Process visuals with Engine 2 (converts to images)
await processVisualQuestions(10);

// Render visuals in UI with Visual Renderer
const visual = await VisualRenderingEngine.renderEducationalVisual(
  questions[0].visualSpecification
);
```

## 📊 Technical Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: PostgreSQL (Supabase)
- **AI**: Claude 4 Sonnet API
- **State Management**: TanStack Query
- **Build Tool**: Vite
- **Package Manager**: npm

## 🔧 Configuration

### Environment Variables
```bash
ANTHROPIC_API_KEY=your_claude_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
```

### Database Setup
Database schema and migrations are located in the `supabase/` directory.

## 📈 Current Status

### ✅ Completed Features
- ✅ Dual Visual System (Educational + Legacy)
- ✅ Claude 4 Sonnet Integration
- ✅ 10 Specialized Visual Types
- ✅ Enhanced Database Schema
- ✅ Test Mode Support (Practice/Diagnostic/Drill)
- ✅ Educational Context Mapping

### 🔄 In Progress  
- 🔄 Frontend Visual Renderer
- 🔄 API Integration
- 🔄 User Authentication
- 🔄 Payment Processing

### 📋 Next Priorities
- 📋 Engine 2 Implementation
- 📋 Advanced Analytics
- 📋 Mobile Optimization
- 📋 Performance Enhancements

## 📚 Documentation

- **[Technical Implementation Guide](QUESTION_GENERATION_APPROACH.md)** - Comprehensive technical documentation
- **[Product Requirements](PRD_EduCourse.md)** - Product specifications and requirements
- **[Documentation Archive](docs/archived/)** - Historical documentation and deprecated guides

## 🤝 Contributing

This is a specialized educational platform. Please refer to the technical documentation for implementation details and architectural decisions.

---

**Version**: 2.0  
**Last Updated**: December 2024  
**Engine Status**: Production Ready ✅ 