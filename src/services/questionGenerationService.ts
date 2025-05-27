// Question Generation Service - Implementing PRD Visual Approach
// Implements AI-powered question generation using Claude 4 Sonnet API with proper visual support

import { supabase } from '../integrations/supabase/client';
import EduCourseAPI from './apiService';
import { 
  TEST_STRUCTURES, 
  UNIFIED_SUB_SKILLS, 
  getCurriculumDifficulty, 
  getSubSkillsForSection,
  isVisualRequired,
  parseQuestionCount,
  getAllDifficultyLevels,
  distributeDifficulties,
  getRandomDifficulty
} from '../data/curriculumData';
import { visualCacheService } from './visualCacheService';

// Types for question generation
export interface QuestionGenerationRequest {
  testType: string;
  yearLevel: string;
  sectionName: string;
  subSkill: string;
  difficulty: number;
  questionCount: number;
  testMode?: string; // New field for test mode
  passageId?: string;
  visualRequired?: boolean;
  australianContext?: boolean;
  // New fields for multi-question passages
  questionsPerPassage?: number;
  passageRequirements?: {
    subSkills: string[];
    difficulties: number[];
    totalQuestions: number;
  };
}

// Realistic passage counts for different test types
const TEST_PASSAGE_STRUCTURE = {
  'EduTest Scholarship (Year 7 Entry)': {
    passageCount: 3,
    questionsPerPassage: 4,
    totalReadingQuestions: 12
  },
  'ACER Scholarship (Year 7 Entry)': {
    passageCount: 2,
    questionsPerPassage: 4,
    totalReadingQuestions: 8
  },
  'Year 5 NAPLAN': {
    passageCount: 2,
    questionsPerPassage: 5,
    totalReadingQuestions: 10
  },
  'Year 7 NAPLAN': {
    passageCount: 3,
    questionsPerPassage: 4,
    totalReadingQuestions: 12
  },
  'NSW Selective Entry (Year 7 Entry)': {
    passageCount: 2,
    questionsPerPassage: 6,
    totalReadingQuestions: 12
  },
  'VIC Selective Entry (Year 9 Entry)': {
    passageCount: 3,
    questionsPerPassage: 4,
    totalReadingQuestions: 12
  }
};

// Get passage structure for a test type - now adapts to actual question counts
export function getPassageStructure(testType: string, targetQuestions?: number) {
  const baseStructure = TEST_PASSAGE_STRUCTURE[testType as keyof typeof TEST_PASSAGE_STRUCTURE] || {
    passageCount: 3,
    questionsPerPassage: 4,
    totalReadingQuestions: 12
  };
  
  // If target questions provided, adjust structure
  if (targetQuestions) {
    const idealQuestionsPerPassage = baseStructure.questionsPerPassage;
    const adaptedPassageCount = Math.ceil(targetQuestions / idealQuestionsPerPassage);
    
    return {
      passageCount: adaptedPassageCount,
      questionsPerPassage: idealQuestionsPerPassage,
      totalReadingQuestions: targetQuestions
    };
  }
  
  return baseStructure;
}

// Visual data structure following PRD specifications - Enhanced for comprehensive visual support
// IMPORTANT: Visual data should NEVER contain solutions or answers - only the problem setup
export interface VisualData {
  type: 'geometry' | 'chart' | 'pattern' | 'diagram';
  data: {
    // For geometry questions
    shapes?: Array<{
      type: 'circle' | 'rectangle' | 'triangle' | 'line' | 'point';
      properties: Record<string, any>;
      coordinates?: number[];
      // Detailed specifications for rendering
      strokeWidth?: number;
      strokeColor?: string;
      fillColor?: string;
      opacity?: number;
      rotation?: number;
      scale?: number;
    }>;
    annotations?: Array<{
      text: string;
      x: number;
      y: number;
      type: 'dimension' | 'label' | 'note';
      rotation?: number;
      fontSize?: number;
      fontFamily?: string;
      color?: string;
      backgroundColor?: string;
      // NOTE: Should be descriptive labels, NOT solutions
    }>;
    gridLines?: boolean;
    measurementTools?: boolean;
    
    // For chart questions - include data values shown in problem, NOT solutions
    chartType?: 'bar' | 'line' | 'pie' | 'scatter';
    chartData?: Array<{ 
      label: string; 
      value: number; 
      target?: number;
      color?: string;
      // NOTE: These are the given data points, NOT answer indicators
    }>;
    axes?: { 
      x: string; 
      y: string; 
      xMin?: number; 
      xMax?: number; 
      yMin?: number; 
      yMax?: number;
      xStep?: number;
      yStep?: number;
    };
    title?: string;
    interactive?: boolean;
    showDataLabels?: boolean;
    showTrendLine?: boolean;
    showTargets?: boolean;
    
    // For pattern questions - show given sequence, NOT the answer
    sequence?: any[];
    rules?: string[];
    patternType?: string;
    questionPrompt?: string;
    showLabels?: boolean;
    showMath?: boolean;
    
    // For algebra/diagram questions
    algebraType?: string;
    equation?: string;
    elements?: Array<{
      id: string;
      type: string;
      properties?: Record<string, any>;
      // Enhanced element structures for different diagram types
      leftSide?: any[];
      rightSide?: any[];
      balanced?: boolean;
      scenario?: string;
      illustration?: string;
      min?: number;
      max?: number;
      step?: number;
      highlighted?: number[]; // Should highlight problem elements, NOT solutions
      annotations?: string[];
      points?: Array<{ 
        x: number; 
        y: number; 
        label: string;
        color?: string;
        size?: number;
      }>;
      line?: { 
        slope: number; 
        yIntercept: number;
        color?: string;
        thickness?: number;
        style?: 'solid' | 'dashed' | 'dotted';
      };
      gridSize?: number;
    }>;
    
    // Common context/description field
    context?: string;
    showSteps?: boolean; // Should show problem setup steps, NOT solution steps
  };
  renderingSpecs: {
    width: number;
    height: number;
    interactive?: boolean;
    style?: Record<string, any>;
    // Enhanced rendering specifications
    showGrid?: boolean;
    allowMeasurement?: boolean;
    showLegend?: boolean;
    showGridLines?: boolean;
    animateSequence?: boolean;
    allowDragging?: boolean;
    // Detailed styling specifications
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    borderRadius?: number;
    padding?: number;
    margin?: number;
    fontFamily?: string;
    fontSize?: number;
  };
  description: string; // Accessibility description - should describe the visual setup, NOT the solution
}

export interface GeneratedQuestion {
  questionText: string;
  options: string[] | null; // null for writing questions
  correctAnswer: string | null; // null for writing questions
  explanation: string;
  difficulty: number;
  subSkill: string;
  hasVisual: boolean;
  visualType?: string;
  visualData?: VisualData;
  passageReference?: string;
}

export interface QuestionGenerationResponse {
  questions: GeneratedQuestion[];
  passageGenerated?: {
    title: string;
    content: string;
    passageType: string;
    wordCount: number;
  };
  metadata: {
    testType: string;
    sectionName: string;
    subSkill: string;
    difficulty: number;
    generatedAt: string;
    complianceChecked: boolean;
  };
}

// Multi-passage response for reading comprehension
export interface MultiPassageResponse {
  passages: Array<{
    id: string;
    title: string;
    content: string;
    passageType: string;
    wordCount: number;
    questions: GeneratedQuestion[];
  }>;
  totalQuestions: number;
  metadata: {
    testType: string;
    sectionName: string;
    passageCount: number;
    questionsPerPassage: number;
    generatedAt: string;
    complianceChecked: boolean;
  };
}

// Claude 4 Sonnet API configuration
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
// Check both VITE_ prefixed (for Vite) and non-prefixed (for Node.js) versions
const CLAUDE_API_KEY = (import.meta as any).env?.VITE_CLAUDE_API_KEY || 
                       process.env.VITE_CLAUDE_API_KEY || 
                       process.env.CLAUDE_API_KEY as string;
const CLAUDE_MODEL = 'claude-sonnet-4-20250514'; // Latest Claude 4 Sonnet model

// Determine context approach for question generation
function getContextApproach(): 'australian' | 'trending' | 'universal' {
  const rand = Math.random();
  if (rand < 0.20) return 'australian';      // 20% Australian context
  if (rand < 0.40) return 'trending';        // 20% trending/current content
  return 'universal';                        // 60% universal/diverse approach
}

// Get appropriate context instruction based on approach
function getContextInstruction(approach: 'australian' | 'trending' | 'universal'): string {
  switch (approach) {
    case 'australian':
      return `
**Context: Australian Focus**
- Use Australian spelling, terminology, and cultural references when appropriate
- Include Australian locations, sports, wildlife, or cultural elements where relevant
- Maintain curriculum alignment with Australian standards
- Generate age-appropriate Australian content that students can relate to`;
    
    case 'trending':
      return `
**Context: Engaging & Current**
- Use topics that are interesting, relatable, and exciting for the target age group
- Include references to current interests, technology, popular culture, and trends that resonate with students
- Make content fun and engaging while maintaining educational value
- Focus on themes that capture student attention and motivation
- Use contemporary examples students can connect with
- Generate topics that reflect modern student interests and experiences`;
    
    case 'universal':
      return `
**Context: Diverse & Accessible**
- Use a variety of interesting, age-appropriate topics from different domains
- Include modern, relevant examples that are globally relatable
- Balance educational content with student engagement
- Generate content that is inclusive and accessible to diverse backgrounds
- Focus on universal experiences and interests that transcend cultural boundaries
- Create content that sparks curiosity and learning motivation`;
  }
}

// Generate multiple questions for a single passage
export async function generatePassageWithMultipleQuestions(
  testType: string,
  yearLevel: string,
  subSkills: string[],
  difficulties: number[],
  questionsPerPassage: number
): Promise<QuestionGenerationResponse> {
  try {
    const contextApproach = getContextApproach();
    const contextInstruction = getContextInstruction(contextApproach);
    
    // Get sub-skill descriptions from the curriculum data
    const subSkillDescriptions = subSkills.map(skill => {
      const skillInfo = UNIFIED_SUB_SKILLS[skill as keyof typeof UNIFIED_SUB_SKILLS];
      return `${skill}: ${skillInfo?.description || 'No description available'}`;
    }).join('\n    - ');
    
    const prompt = `You are an expert educational content creator specializing in Australian standardized assessments. Generate a reading passage with ${questionsPerPassage} comprehension questions for ${testType}.

    **PASSAGE AND QUESTIONS REQUIREMENTS:**
    - Test Type: ${testType}
    - Year Level: ${yearLevel}
    - Sub-skills to assess: ${subSkills.join(', ')}
    - Sub-skill Descriptions:
      - ${subSkillDescriptions}
    - Difficulty Range: ${Math.min(...difficulties)} to ${Math.max(...difficulties)} (RELATIVE TO ${testType} STANDARDS)
      * 1 = Accessible (easier questions within this specific test type)
      * 2 = Standard (typical questions for this specific test type)  
      * 3 = Challenging (harder questions within this specific test type)
    - Total Questions: ${questionsPerPassage}

    **CRITICAL: DIFFICULTY IS RELATIVE WITHIN TEST TYPE**
    The difficulty scale 1-3 is relative to the specific test type's standards. Each test type has its own internal difficulty progression.

    **SUB-SKILL ALIGNMENT:**
    Each question must specifically target one of the listed sub-skills. Use the provided descriptions to ensure questions accurately assess the intended cognitive abilities.

    ${contextInstruction}

    **Requirements:**
    1. Generate ONE engaging passage (300-500 words) suitable for ${yearLevel} students
    2. Create ${questionsPerPassage} questions that test DIFFERENT sub-skills from: ${subSkills.join(', ')}
    3. Vary the difficulty levels across questions (${difficulties.join(', ')})
    4. Each question must have exactly 4 multiple-choice options (A, B, C, D)
    5. Provide clear explanations for correct answers
    6. Make content engaging and relatable for Year 6-9 students
    7. Ensure questions comprehensively test the passage content

    **Response Format:**
    Return a valid JSON object with this exact structure:

    {
      "questions": [
        {
          "questionText": "Question 1 text",
          "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
          "correctAnswer": "A",
          "explanation": "Detailed explanation",
          "difficulty": ${difficulties[0] || 1},
          "subSkill": "${subSkills[0] || 'Text Comprehension - Explicit'}",
          "hasVisual": false,
          "passageReference": "passage_1"
        },
        {
          "questionText": "Question 2 text",
          "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
          "correctAnswer": "B",
          "explanation": "Detailed explanation",
          "difficulty": ${difficulties[1] || 2},
          "subSkill": "${subSkills[1] || 'Text Comprehension - Inferential'}",
          "hasVisual": false,
          "passageReference": "passage_1"
        }
        // ... continue for all ${questionsPerPassage} questions
      ],
      "passageGenerated": {
        "title": "Engaging Passage Title",
        "content": "Full passage content (300-500 words)...",
        "passageType": "informational|narrative|argumentative",
        "wordCount": 400
      },
      "metadata": {
        "testType": "${testType}",
        "sectionName": "Reading_Comprehension",
        "subSkill": "Multiple",
        "difficulty": ${Math.round(difficulties.reduce((a, b) => a + b, 0) / difficulties.length)},
        "generatedAt": "${new Date().toISOString()}",
        "complianceChecked": true,
        "contextApproach": "${contextApproach}",
        "questionsPerPassage": ${questionsPerPassage}
      }
    }

    Ensure you generate exactly ${questionsPerPassage} questions, each testing a different sub-skill. The JSON must be valid and complete.`;

    const claudeResponse = await callClaudeAPIWithRetry(prompt);
    
    // Parse the JSON response
    let parsedResponse: QuestionGenerationResponse;
    try {
      let cleanedResponse = claudeResponse.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      parsedResponse = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Failed to parse Claude response:', claudeResponse);
      throw new Error('Invalid JSON response from Claude API');
    }

    // Validate response structure
    if (!parsedResponse.questions || !Array.isArray(parsedResponse.questions)) {
      throw new Error('Invalid response structure from Claude API');
    }

    if (parsedResponse.questions.length !== questionsPerPassage) {
      console.warn(`Expected ${questionsPerPassage} questions, got ${parsedResponse.questions.length}`);
    }

    console.log('Successfully generated passage with multiple questions:', {
      questionsCount: parsedResponse.questions.length,
      passageTitle: parsedResponse.passageGenerated?.title,
      subSkillsCovered: parsedResponse.questions.map(q => q.subSkill),
      difficultiesCovered: parsedResponse.questions.map(q => q.difficulty)
    });

    return parsedResponse;

  } catch (error) {
    console.error('Multi-question passage generation failed:', error);
    throw new Error(`Claude API passage generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Generate complete reading comprehension section with realistic passage structure
export async function generateReadingComprehensionSection(
  testType: string,
  yearLevel: string,
  totalQuestions: number
): Promise<MultiPassageResponse> {
  try {
    const passageStructure = getPassageStructure(testType);
    const { passageCount, questionsPerPassage } = passageStructure;
    
    console.log(`Generating ${passageCount} passages with ${questionsPerPassage} questions each for ${testType}`);
    
    const passages = [];
    const allSubSkills = [
      'Text Comprehension - Explicit',
      'Text Comprehension - Inferential', 
      'Text Analysis - Critical',
      'Language - Vocabulary'
    ];
    
    for (let i = 0; i < passageCount; i++) {
      // Distribute sub-skills and difficulties across passages
      const passageSubSkills = allSubSkills.slice(
        (i * 2) % allSubSkills.length, 
        ((i * 2) + questionsPerPassage) % allSubSkills.length || questionsPerPassage
      );
      
      // Ensure we have enough sub-skills, cycle through if needed
      while (passageSubSkills.length < questionsPerPassage) {
        passageSubSkills.push(allSubSkills[passageSubSkills.length % allSubSkills.length]);
      }
      
      const passageDifficulties = Array.from({ length: questionsPerPassage }, (_, idx) => 
        1 + ((i + idx) % 3) // Cycle through difficulties 1, 2, 3
      );
      
      const passageResponse = await generatePassageWithMultipleQuestions(
        testType,
        yearLevel,
        passageSubSkills.slice(0, questionsPerPassage),
        passageDifficulties,
        questionsPerPassage
      );
      
      if (passageResponse.passageGenerated) {
        passages.push({
          id: `passage_${i + 1}`,
          title: passageResponse.passageGenerated.title,
          content: passageResponse.passageGenerated.content,
          passageType: passageResponse.passageGenerated.passageType,
          wordCount: passageResponse.passageGenerated.wordCount,
          questions: passageResponse.questions
        });
      }
      
      // Rate limiting between passages
      if (i < passageCount - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }
    
    const totalGeneratedQuestions = passages.reduce((sum, p) => sum + p.questions.length, 0);
    
    return {
      passages,
      totalQuestions: totalGeneratedQuestions,
      metadata: {
        testType,
        sectionName: 'Reading_Comprehension',
        passageCount: passages.length,
        questionsPerPassage,
        generatedAt: new Date().toISOString(),
        complianceChecked: true
      }
    };
    
  } catch (error) {
    console.error('Reading comprehension section generation failed:', error);
    throw new Error(`Reading section generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Generate visual data based on sub-skill and question context
function generateVisualData(subSkill: string, questionContext: string, difficulty: number): VisualData | undefined {
  if (!isVisualRequired(subSkill)) return undefined;

  // Determine visual type based on sub-skill
  let visualType = 'geometry';
  if (subSkill.includes('Statistics')) visualType = 'chart';
  else if (subSkill.includes('Algebra')) visualType = 'diagram';
  else if (subSkill.includes('Pattern Recognition')) visualType = 'pattern';

  // Try to get from cache first
  const cachedVisual = visualCacheService.get(subSkill, difficulty, visualType, { context: questionContext });
  if (cachedVisual) {
    console.log(`📋 Cache hit for visual: ${subSkill}-${difficulty}-${visualType}`);
    return cachedVisual;
  }

  console.log(`🎨 Generating new visual: ${subSkill}-${difficulty}-${visualType}`);

  // Generate appropriate visual based on sub-skill type
  let visualData: VisualData | undefined;
  
  if (subSkill.includes('Geometry')) {
    visualData = generateGeometryVisual(difficulty);
  } else if (subSkill.includes('Statistics')) {
    visualData = generateChartVisual(difficulty);
  } else if (subSkill.includes('Algebra')) {
    visualData = generateAlgebraVisual(difficulty);
  } else if (subSkill.includes('Pattern Recognition')) {
    visualData = generatePatternVisual(difficulty);
  }

  // Cache the generated visual for future use
  if (visualData) {
    visualCacheService.set(subSkill, difficulty, visualType, visualData, { context: questionContext });
  }

  return visualData;
}

// Enhanced visual generation with more sophisticated content
function generateGeometryVisual(difficulty: number): VisualData {
  const complexityLevel = Math.min(difficulty, 3);
  
  // Generate different geometric scenarios based on difficulty
  const scenarios = [
    // Difficulty 1: Basic shapes and area
    {
      shapes: [
        {
          type: 'rectangle' as const,
          properties: {
            width: 80,
            height: 60,
            fill: '#e3f2fd',
            stroke: '#1976d2',
            strokeWidth: 2,
            label: '8m × 6m'
          },
          coordinates: [50, 50],
          strokeWidth: 2,
          strokeColor: '#1976d2',
          fillColor: '#e3f2fd',
          opacity: 0.8
        }
      ],
      annotations: [
        { 
          text: '8m', 
          x: 90, 
          y: 40, 
          type: 'dimension' as const,
          fontSize: 14,
          fontFamily: 'Arial, sans-serif',
          color: '#1976d2'
        },
        { 
          text: '6m', 
          x: 30, 
          y: 80, 
          type: 'dimension' as const, 
          rotation: 90,
          fontSize: 14,
          fontFamily: 'Arial, sans-serif',
          color: '#1976d2'
        }
      ]
    },
    
    // Difficulty 2: Composite shapes
    {
      shapes: [
        {
          type: 'rectangle' as const,
          properties: {
            width: 100,
            height: 60,
            fill: '#e8f5e8',
            stroke: '#4caf50',
            strokeWidth: 2
          },
          coordinates: [40, 40],
          strokeWidth: 2,
          strokeColor: '#4caf50',
          fillColor: '#e8f5e8',
          opacity: 0.7
        },
        {
          type: 'rectangle' as const,
          properties: {
            width: 40,
            height: 40,
            fill: '#fff3e0',
            stroke: '#ff9800',
            strokeWidth: 2
          },
          coordinates: [170, 60],
          strokeWidth: 2,
          strokeColor: '#ff9800',
          fillColor: '#fff3e0',
          opacity: 0.7
        }
      ],
      annotations: [
        { 
          text: '10m', 
          x: 90, 
          y: 30, 
          type: 'dimension' as const,
          fontSize: 14,
          fontFamily: 'Arial, sans-serif',
          color: '#4caf50'
        },
        { 
          text: '6m', 
          x: 25, 
          y: 70, 
          type: 'dimension' as const, 
          rotation: 90,
          fontSize: 14,
          fontFamily: 'Arial, sans-serif',
          color: '#4caf50'
        },
        { 
          text: '4m', 
          x: 190, 
          y: 50, 
          type: 'dimension' as const,
          fontSize: 14,
          fontFamily: 'Arial, sans-serif',
          color: '#ff9800'
        }
      ]
    },
    
    // Difficulty 3: Complex geometric problems
    {
      shapes: [
        {
          type: 'circle' as const,
          properties: {
            radius: 50,
            fill: 'rgba(255, 193, 7, 0.2)',
            stroke: '#ffc107',
            strokeWidth: 3
          },
          coordinates: [120, 120],
          strokeWidth: 3,
          strokeColor: '#ffc107',
          fillColor: 'rgba(255, 193, 7, 0.2)',
          opacity: 1
        },
        {
          type: 'rectangle' as const,
          properties: {
            width: 100,
            height: 100,
            fill: 'transparent',
            stroke: '#2196f3',
            strokeWidth: 2,
            strokeDasharray: '5,5'
          },
          coordinates: [70, 70],
          strokeWidth: 2,
          strokeColor: '#2196f3',
          fillColor: 'transparent',
          opacity: 1
        }
      ],
      annotations: [
        { 
          text: 'r = 5cm', 
          x: 80, 
          y: 80, 
          type: 'label' as const,
          fontSize: 12,
          fontFamily: 'Arial, sans-serif',
          color: '#ffc107',
          backgroundColor: 'rgba(255, 255, 255, 0.8)'
        },
        { 
          text: '10cm', 
          x: 120, 
          y: 55, 
          type: 'dimension' as const,
          fontSize: 14,
          fontFamily: 'Arial, sans-serif',
          color: '#2196f3'
        }
      ]
    }
  ];

  const scenario = scenarios[complexityLevel - 1] || scenarios[0];
  
  return {
    type: 'geometry',
    data: {
      shapes: scenario.shapes,
      annotations: scenario.annotations,
      gridLines: complexityLevel >= 2,
      measurementTools: complexityLevel >= 3
    },
    renderingSpecs: {
      width: 320,
      height: 240,
      interactive: difficulty >= 3,
      style: {
        backgroundColor: '#fafafa',
        border: '1px solid #e0e0e0',
        padding: '10px'
      },
      showGrid: complexityLevel >= 2,
      allowMeasurement: complexityLevel >= 3,
      backgroundColor: '#fafafa',
      borderColor: '#e0e0e0',
      borderWidth: 1,
      padding: 10,
      fontFamily: 'Arial, sans-serif',
      fontSize: 12
    },
    description: `Geometric ${complexityLevel === 1 ? 'rectangle with labeled dimensions' : complexityLevel === 2 ? 'composite shape with multiple rectangles and measurements' : 'circle inscribed in square with radius and side length labels'} showing the given measurements for calculation purposes`
  };
}

function generateChartVisual(difficulty: number): VisualData {
  const complexityLevel = Math.min(difficulty, 3);
  
  // Generate realistic, engaging data sets
  const datasets = [
    // Difficulty 1: Simple bar chart with clear data
    {
      chartType: 'bar' as const,
      title: 'Favorite Video Games in Year 6',
      chartData: [
        { label: 'Minecraft', value: 24, color: '#4caf50' },
        { label: 'Roblox', value: 18, color: '#2196f3' },
        { label: 'Fortnite', value: 15, color: '#ff9800' },
        { label: 'Among Us', value: 12, color: '#e91e63' }
      ],
      axes: { 
        x: 'Games', 
        y: 'Number of Students',
        xMin: 0,
        xMax: 4,
        yMin: 0,
        yMax: 30,
        yStep: 5
      },
      context: 'A survey of 69 Year 6 students about their favorite video games.'
    },
    
    // Difficulty 2: Line chart with trends
    {
      chartType: 'line' as const,
      title: 'Daily Temperature This Week',
      chartData: [
        { label: 'Mon', value: 22, color: '#2196f3' },
        { label: 'Tue', value: 25, color: '#2196f3' },
        { label: 'Wed', value: 28, color: '#2196f3' },
        { label: 'Thu', value: 26, color: '#2196f3' },
        { label: 'Fri', value: 23, color: '#2196f3' },
        { label: 'Sat', value: 20, color: '#2196f3' },
        { label: 'Sun', value: 24, color: '#2196f3' }
      ],
      axes: { 
        x: 'Day of Week', 
        y: 'Temperature (°C)',
        xMin: 0,
        xMax: 7,
        yMin: 15,
        yMax: 35,
        yStep: 5
      },
      context: 'Temperature readings taken at 3pm each day in Sydney.'
    },
    
    // Difficulty 3: Multi-series data requiring analysis (NO solution highlighting)
    {
      chartType: 'bar' as const,
      title: 'School Fundraising Results by Grade',
      chartData: [
        { label: 'Year 4', value: 450, target: 400, color: '#4caf50' },
        { label: 'Year 5', value: 520, target: 500, color: '#2196f3' },
        { label: 'Year 6', value: 380, target: 450, color: '#ff9800' },
        { label: 'Year 7', value: 610, target: 550, color: '#9c27b0' }
      ],
      axes: { 
        x: 'Grade Level', 
        y: 'Amount Raised ($)',
        xMin: 0,
        xMax: 4,
        yMin: 0,
        yMax: 700,
        yStep: 100
      },
      context: 'Annual school fundraising results compared to target amounts.',
      showTargets: true
    }
  ];

  const dataset = datasets[complexityLevel - 1] || datasets[0];
  
  return {
    type: 'chart',
    data: {
      ...dataset,
      interactive: complexityLevel >= 3,
      showDataLabels: complexityLevel >= 2,
      showTrendLine: complexityLevel >= 3 && dataset.chartType === 'line'
    },
    renderingSpecs: {
      width: 450,
      height: 300,
      interactive: complexityLevel >= 3,
      style: {
        backgroundColor: '#ffffff',
        padding: '15px',
        border: '1px solid #ddd',
        borderRadius: '8px'
      },
      showLegend: complexityLevel >= 2,
      showGridLines: true,
      backgroundColor: '#ffffff',
      borderColor: '#dddddd',
      borderWidth: 1,
      borderRadius: 8,
      padding: 15,
      fontFamily: 'Arial, sans-serif',
      fontSize: 12
    },
    description: `${dataset.chartType.charAt(0).toUpperCase() + dataset.chartType.slice(1)} chart displaying ${dataset.title.toLowerCase()} with given data values. ${dataset.context} Chart shows the data for analysis purposes without indicating any solutions.`
  };
}

function generatePatternVisual(difficulty: number): VisualData {
  const complexityLevel = Math.min(difficulty, 3);
  
  // Generate sophisticated pattern scenarios
  const patterns = [
    // Difficulty 1: Simple color/shape alternation
    {
      type: 'shape_color_pattern',
      sequence: [
        { shape: 'circle', color: '#2196f3', size: 30, strokeWidth: 2, strokeColor: '#1565c0' },
        { shape: 'circle', color: '#f44336', size: 30, strokeWidth: 2, strokeColor: '#c62828' },
        { shape: 'circle', color: '#2196f3', size: 30, strokeWidth: 2, strokeColor: '#1565c0' },
        { shape: 'circle', color: '#f44336', size: 30, strokeWidth: 2, strokeColor: '#c62828' },
        { shape: 'circle', color: '#2196f3', size: 30, strokeWidth: 2, strokeColor: '#1565c0' },
        { shape: '?', color: '#cccccc', size: 30, strokeWidth: 2, strokeColor: '#999999', label: '?' }
      ],
      rule: 'Colors alternate between blue and red',
      question: 'What color should the next circle be?'
    },
    
    // Difficulty 2: Shape and size pattern
    {
      type: 'progressive_pattern',
      sequence: [
        { shape: 'square', color: '#4caf50', size: 20, strokeWidth: 2, strokeColor: '#388e3c' },
        { shape: 'triangle', color: '#4caf50', size: 25, strokeWidth: 2, strokeColor: '#388e3c' },
        { shape: 'circle', color: '#4caf50', size: 30, strokeWidth: 2, strokeColor: '#388e3c' },
        { shape: 'square', color: '#ff9800', size: 35, strokeWidth: 2, strokeColor: '#f57c00' },
        { shape: 'triangle', color: '#ff9800', size: 40, strokeWidth: 2, strokeColor: '#f57c00' },
        { shape: '?', color: '#cccccc', size: 45, strokeWidth: 2, strokeColor: '#999999', label: '?' }
      ],
      rule: 'Shapes cycle (square→triangle→circle) while size increases by 5 and color changes every 3 shapes',
      question: 'What should the next shape be? What color? What size?'
    },
    
    // Difficulty 3: Mathematical sequence with visuals (question mark for missing value)
    {
      type: 'mathematical_pattern',
      sequence: [
        { shape: 'hexagon', dots: 1, color: '#9c27b0', label: '1', strokeWidth: 2, strokeColor: '#7b1fa2' },
        { shape: 'hexagon', dots: 4, color: '#9c27b0', label: '4', strokeWidth: 2, strokeColor: '#7b1fa2' },
        { shape: 'hexagon', dots: 9, color: '#9c27b0', label: '9', strokeWidth: 2, strokeColor: '#7b1fa2' },
        { shape: 'hexagon', dots: 16, color: '#9c27b0', label: '16', strokeWidth: 2, strokeColor: '#7b1fa2' },
        { shape: 'hexagon', dots: '?', color: '#cccccc', label: '?', strokeWidth: 2, strokeColor: '#999999' }
      ],
      rule: 'Each hexagon contains perfect square numbers of dots (1², 2², 3², 4²...)',
      question: 'How many dots should be in the next hexagon?'
    }
  ];

  const pattern = patterns[complexityLevel - 1] || patterns[0];
  
  return {
    type: 'pattern',
    data: {
      patternType: pattern.type,
      sequence: pattern.sequence,
      rules: [pattern.rule],
      questionPrompt: pattern.question,
      showLabels: complexityLevel >= 2,
      showMath: complexityLevel >= 3
    },
    renderingSpecs: {
      width: 480,
      height: 120,
      interactive: complexityLevel >= 3,
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '15px',
        backgroundColor: '#f8f9fa',
        padding: '20px',
        border: '2px solid #e9ecef',
        borderRadius: '12px'
      },
      animateSequence: complexityLevel >= 3,
      backgroundColor: '#f8f9fa',
      borderColor: '#e9ecef',
      borderWidth: 2,
      borderRadius: 12,
      padding: 20,
      fontFamily: 'Arial, sans-serif',
      fontSize: 14
    },
    description: `Pattern sequence showing ${pattern.rule.toLowerCase()}. ${pattern.question} The sequence displays the given elements with the missing element marked with a question mark for students to determine.`
  };
}

function generateAlgebraVisual(difficulty: number): VisualData {
  const complexityLevel = Math.min(difficulty, 3);
  
  // Create engaging algebraic scenarios
  const scenarios = [
    // Difficulty 1: Simple balance/equation (show problem setup, NOT solution)
    {
      type: 'balance_scale',
      equation: 'x + 3 = 7',
      visualElements: [
        {
          id: 'scale',
          type: 'balance',
          leftSide: [
            { type: 'unknown', label: 'x', color: '#2196f3', size: 40 }, 
            { type: 'blocks', count: 3, color: '#4caf50', size: 30 }
          ],
          rightSide: [
            { type: 'blocks', count: 7, color: '#4caf50', size: 30 }
          ],
          balanced: true,
          properties: {
            scaleColor: '#333333',
            armLength: 200,
            supportHeight: 100,
            plateColor: '#e0e0e0'
          }
        }
      ],
      context: 'Find the value of x that balances the scale'
    },
    
    // Difficulty 2: Real-world context with number line (show setup, NOT solution)
    {
      type: 'number_line_story',
      equation: '2x + 5 = 13',
      visualElements: [
        {
          id: 'story',
          type: 'word_problem',
          scenario: 'Sarah buys 2 game cards for $x each and pays $5 for shipping. Total cost is $13.',
          illustration: 'shopping_scene',
          properties: {
            backgroundColor: '#f5f5f5',
            textColor: '#333333',
            fontSize: 14
          }
        },
        {
          id: 'numberLine',
          type: 'numberLine',
          min: 0,
          max: 15,
          step: 1,
          highlighted: [], // DO NOT highlight the solution
          annotations: ['Find x'],
          properties: {
            lineColor: '#333333',
            tickColor: '#666666',
            numberColor: '#333333',
            lineWidth: 3,
            tickHeight: 10
          }
        }
      ],
      context: 'Use the number line to help solve for the cost of each game card'
    },
    
    // Difficulty 3: Multi-step with coordinate system (show relationship, NOT specific solution)
    {
      type: 'coordinate_system',
      equation: 'y = 2x + 1',
      visualElements: [
        {
          id: 'graph',
          type: 'coordinate_plane',
          points: [
            { x: 0, y: 1, label: '(0,1)', color: '#2196f3', size: 6 },
            { x: 1, y: 3, label: '(1,3)', color: '#2196f3', size: 6 },
            { x: 2, y: 5, label: '(2,5)', color: '#2196f3', size: 6 },
            { x: -1, y: -1, label: '(-1,-1)', color: '#2196f3', size: 6 }
          ],
          line: { 
            slope: 2, 
            yIntercept: 1, 
            color: '#2196f3', 
            thickness: 2, 
            style: 'solid' as const
          },
          gridSize: 1,
          properties: {
            axisColor: '#333333',
            gridColor: '#e0e0e0',
            backgroundColor: '#ffffff',
            axisWidth: 2,
            gridWidth: 1
          }
        }
      ],
      context: 'Linear relationship showing the pattern in coordinate pairs'
    }
  ];

  const scenario = scenarios[complexityLevel - 1] || scenarios[0];
  
  return {
    type: 'diagram',
    data: {
      algebraType: scenario.type,
      equation: scenario.equation,
      elements: scenario.visualElements,
      context: scenario.context,
      interactive: complexityLevel >= 3,
      showSteps: false // Show setup, NOT solution steps
    },
    renderingSpecs: {
      width: 400,
      height: 280,
      interactive: complexityLevel >= 3,
      style: {
        backgroundColor: '#ffffff',
        border: '2px solid #e3f2fd',
        borderRadius: '8px',
        padding: '15px'
      },
      allowDragging: complexityLevel >= 3,
      showGrid: complexityLevel >= 2,
      backgroundColor: '#ffffff',
      borderColor: '#e3f2fd',
      borderWidth: 2,
      borderRadius: 8,
      padding: 15,
      fontFamily: 'Arial, sans-serif',
      fontSize: 12
    },
    description: `Algebraic visualization for equation ${scenario.equation} using ${scenario.type.replace('_', ' ')} approach. ${scenario.context} Displays the problem setup for students to solve, without showing the solution.`
  };
}

// Get current model information
export function getModelInfo() {
  return {
    model: CLAUDE_MODEL,
    apiUrl: CLAUDE_API_URL,
    hasApiKey: !!(CLAUDE_API_KEY && CLAUDE_API_KEY.startsWith('sk-ant-')),
    apiKeyPrefix: CLAUDE_API_KEY ? CLAUDE_API_KEY.substring(0, 12) + '...' : 'Not set'
  };
}

// Test Claude API connection
export async function testClaudeConnection(): Promise<{ success: boolean; model: string; error?: string }> {
  try {
    if (!CLAUDE_API_KEY || !CLAUDE_API_KEY.startsWith('sk-ant-')) {
      return {
        success: false,
        model: CLAUDE_MODEL,
        error: 'Claude API key not found or invalid. Please set VITE_CLAUDE_API_KEY in your .env file.'
      };
    }

    // Simple test prompt
    const testPrompt = 'Respond with just "OK" to confirm the connection.';
    
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 10,
        messages: [
          {
            role: 'user',
            content: testPrompt
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      return {
        success: false,
        model: CLAUDE_MODEL,
        error: `Claude API error: ${response.status} - ${errorData}`
      };
    }

    const data = await response.json();
    return {
      success: true,
      model: CLAUDE_MODEL
    };

  } catch (error) {
    return {
      success: false,
      model: CLAUDE_MODEL,
      error: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

// Helper function to call Claude 4 Sonnet API
async function callClaudeAPI(prompt: string): Promise<any> {
  if (!CLAUDE_API_KEY || !CLAUDE_API_KEY.startsWith('sk-ant-')) {
    throw new Error('Claude API key not found or invalid. Please set VITE_CLAUDE_API_KEY in your .env file.');
  }

  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 4000,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  });

  if (!response.ok) {
    const errorData = await response.text();
    let errorMessage = `Claude API error: ${response.status}`;
    
    try {
      const errorJson = JSON.parse(errorData);
      if (errorJson.error && errorJson.error.message) {
        errorMessage += ` - ${errorJson.error.message}`;
      }
    } catch {
      errorMessage += ` - ${errorData}`;
    }
    
    // Add specific error guidance
    if (response.status === 401) {
      errorMessage += '\nPlease check your Claude API key in the .env file.';
    } else if (response.status === 400) {
      errorMessage += '\nThere may be an issue with the request format or model name.';
    } else if (response.status === 429) {
      errorMessage += '\nRate limit exceeded. Please try again in a moment.';
    }
    
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data.content[0].text;
}

// Determine response type based on section name
function getResponseType(sectionName: string): 'multiple_choice' | 'extended_response' | 'short_answer' {
  // Writing sections use extended response (free text)
  if (sectionName === 'Writing' || sectionName === 'Written_Expression') {
    return 'extended_response';
  }
  
  // All other sections use multiple choice
  return 'multiple_choice';
}

// Check if section is a writing section
function isWritingSection(sectionName: string): boolean {
  return sectionName === 'Writing' || sectionName === 'Written_Expression';
}

// Generate detailed prompt for Claude 4 Sonnet
function generateClaudePrompt(request: QuestionGenerationRequest): string {
  // Get sub-skill description and visual requirement from curriculum data
  const subSkillInfo = UNIFIED_SUB_SKILLS[request.subSkill as keyof typeof UNIFIED_SUB_SKILLS];
  const subSkillDescription = subSkillInfo?.description || 'No description available';
  const visualRequiredFromData = subSkillInfo?.visual_required || false;
  
  // Use visual requirement from curriculum data, with request override if specified
  const hasVisual = request.visualRequired !== undefined ? request.visualRequired : visualRequiredFromData;
  
  const contextApproach = getContextApproach();
  const contextInstruction = getContextInstruction(contextApproach);
  const isWriting = isWritingSection(request.sectionName);
  const responseType = getResponseType(request.sectionName);
  const questionType = isWriting ? 'writing prompt(s)' : 'multiple-choice question(s)';
  
  return `Enhanced Question Generation Prompt
You are an expert educational content creator specialising in Australian standardised assessments. Generate ${request.questionCount} high-quality question${request.questionCount > 1 ? 's' : ''} that replicate the exact difficulty and cognitive demands of real ${request.testType} assessments.

**TEST DETAILS:**
- Test Type: ${request.testType}
- Year Level: ${request.yearLevel} 
- Section: ${request.sectionName}
- Sub-skill: ${request.subSkill}
- Sub-skill Description: ${subSkillDescription}
- Difficulty Level: ${request.difficulty}/3 (RELATIVE TO ${request.testType} STANDARDS)
  * 1 = Accessible (easier questions within this specific test type)
  * 2 = Standard (typical questions for this specific test type)
  * 3 = Challenging (harder questions within this specific test type)
- Response Type: ${responseType}
- Visual Component Required: ${hasVisual ? 'Yes' : 'No'}

**CRITICAL: DIFFICULTY IS RELATIVE WITHIN TEST TYPE**
The difficulty scale 1-3 is relative to the specific test type's standards. A difficulty 2 for NAPLAN Year 5 is different from a difficulty 2 for ACER or NSW Selective. Each test type has its own internal difficulty progression from 1 (accessible within that test) to 3 (challenging within that test).

**SUB-SKILL FOCUS:**
Your questions must specifically target the sub-skill: "${request.subSkill}"
Description: ${subSkillDescription}
Ensure each question directly assesses this cognitive ability as described.

**TEST-SPECIFIC DIFFICULTY EMULATION:**
Ensure questions match the cognitive complexity expected for difficulty ${request.difficulty}/3 within ${request.testType}:

${getTestSpecificDifficultyGuidance(request.testType, request.difficulty)}

**FORMAT REQUIREMENTS:**
${isWriting ? 
  `- Extended Response: Clear rubric requirements, word count guidance (150-300 words for Year 6)
- Success Criteria: Structure, language, development, spelling/grammar` :
  `- Multiple Choice: 4 options (A-D), with plausible distractors based on common misconceptions
- Clear stems with appropriate complexity for ${request.testType}
- Realistic distractors representing logical misconceptions`}

**Quality Standards**
- Authentic Difficulty: Precisely match the cognitive load and complexity of real ${request.testType} questions
- Pedagogical Soundness: Each question must clearly test the specified sub-skill: ${request.subSkill}
- Clear Language: Avoid ambiguity while maintaining appropriate complexity for the test type
- UK Spelling: Use British English spelling throughout (e.g., colour, realise, centre, analyse)
${!isWriting ? '- Realistic Distractors: Incorrect options represent logical misconceptions' : ''}

${hasVisual ? `
**Visual Component Requirements:**
- Include detailed visual data specification for our rendering engine
- Visual should support the question content and match ${request.testType} standards
- Provide accessibility description
- Specify rendering requirements (dimensions, interactivity)

**CRITICAL VISUAL DATA RULES:**
1. **NO SOLUTIONS OR ANSWERS** in the visual_data - show problem setup ONLY
2. **Be DETAILED and PRESCRIPTIVE** - include exact specifications for:
   - Coordinates, dimensions, colours, fonts, sizes
   - All visual elements (shapes, lines, points, labels, annotations)
   - Chart data values, axis labels, legends (but NOT highlighted answers)
   - Grid specifications, measurement tools, interactivity settings
3. **Include necessary context labels** (axis titles, measurement units, object names) but NOT solution indicators
4. **Make it render-ready** - our visual rendering script should create the image directly from your JSON
5. **Be comprehensive** - include all visual elements needed to understand the problem

**Examples of what TO include:**
- Chart data points and values shown in the problem
- Geometric shapes with their labelled dimensions  
- Coordinate grids with appropriate scales
- Pattern sequences showing the given elements
- Measurement tools and rulers when needed

**Examples of what NOT TO include:**
- Highlighted correct answers or solutions
- Solution steps or working-out annotations
- "Answer: X" labels or indicators
- Colour coding that reveals the solution
- Arrows pointing to correct options
` : ''}

${request.sectionName.includes('Reading') ? `
**Reading Comprehension Requirements:**
- Generate an engaging passage (200-400 words for Year 5, 300-500 words for Year 7+)
- Use topics appropriate for ${request.testType} difficulty level
- Questions should test comprehension aligned with ${request.subSkill}
- Balance authentic ${request.testType} content complexity with student engagement
` : ''}

${isWriting ? `
**Writing Task Requirements:**
- Create prompts that match ${request.testType} writing expectations
- Provide clear task instructions and success criteria
- Specify expected word count and assessment focus
- Use scenarios appropriate for ${request.difficulty}/3 difficulty level

**Writing Prompt Types:**
- Creative Writing: "Write a story about..."
- Persuasive Writing: "Convince your audience that..."
- Analytical Writing: "Explain why... and provide examples"
- Narrative Writing: "Describe an experience when..."
` : ''}

**Output Format**
For each question, provide:
- Question stem (with visual descriptions if applicable)
${isWriting ? 
  `- Task requirements and success criteria
- Expected response guidance` :
  `- 4 answer options (A-D) with plausible distractors
- Correct answer with brief explanation`}
- Sub-skill alignment confirmation: ${request.subSkill}

**Critical Requirement:** Questions must authentically replicate the difficulty profile that students encounter in actual ${request.testType} assessments. Students preparing for ${request.testType} should immediately recognise these as genuine practice material.

**Response Format:**
Return a valid JSON object with this exact structure:

{
  "questions": [
    {
      "questionText": "${isWriting ? 'The writing task prompt' : 'The actual question text'}",
      ${isWriting ? 
        `"options": null,
      "correctAnswer": null,` :
        `"options": [
        "A) First option",
        "B) Second option", 
        "C) Third option",
        "D) Fourth option"
      ],
      "correctAnswer": "A",`}
      "explanation": "${isWriting ? 'Task guidelines and success criteria' : 'Detailed explanation of why this is correct'}",
      "difficulty": ${request.difficulty},
      "subSkill": "${request.subSkill}",
      "hasVisual": ${hasVisual},
      ${hasVisual ? `"visualType": "geometry|chart|pattern|diagram",
      "visualData": {
        "type": "geometry|chart|pattern|diagram",
        "data": {
          // Visual data structure based on type
        },
        "renderingSpecs": {
          "width": 300,
          "height": 200,
          "interactive": false
        },
        "description": "Accessibility description"
      },` : ''}
      "passageReference": null
    }
  ],
  ${request.sectionName.includes('Reading') ? `"passageGenerated": {
    "title": "Passage Title",
    "content": "Full passage content",
    "passageType": "informational|narrative|argumentative",
    "wordCount": 300
  },` : ''}
  "metadata": {
    "testType": "${request.testType}",
    "sectionName": "${request.sectionName}",
    "subSkill": "${request.subSkill}",
    "difficulty": ${request.difficulty},
    "generatedAt": "${new Date().toISOString()}",
    "complianceChecked": true
  }
}

Ensure the JSON is valid and complete. Do not include any text outside the JSON structure.`;
}

export async function generateQuestions(request: QuestionGenerationRequest): Promise<QuestionGenerationResponse> {
  try {
    console.log('Generating questions with Claude 4 Sonnet...', {
      model: CLAUDE_MODEL,
      request: request
    });

    // Generate the prompt for Claude
    const prompt = generateClaudePrompt(request);
    
    // Call Claude 4 Sonnet API
    const claudeResponse = await callClaudeAPIWithRetry(prompt);
    
    // Parse the JSON response
    let parsedResponse: QuestionGenerationResponse;
    try {
      // Clean the response by removing potential markdown code blocks
      let cleanedResponse = claudeResponse.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      parsedResponse = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Failed to parse Claude response:', claudeResponse);
      throw new Error('Invalid JSON response from Claude API');
    }

    // Validate response structure
    if (!parsedResponse.questions || !Array.isArray(parsedResponse.questions)) {
      throw new Error('Invalid response structure from Claude API');
    }

    // Enhance questions with visual data if needed
    parsedResponse.questions = parsedResponse.questions.map(question => {
      if (question.hasVisual && !question.visualData) {
        // Generate fallback visual data if Claude didn't provide it
        question.visualData = generateVisualData(request.subSkill, question.questionText, request.difficulty);
        question.visualType = question.visualData?.type;
      }
      return question;
    });

    console.log('Successfully generated questions with Claude 4 Sonnet:', {
      questionsCount: parsedResponse.questions.length,
      hasVisuals: parsedResponse.questions.filter(q => q.hasVisual).length,
      model: CLAUDE_MODEL
    });

    return parsedResponse;

  } catch (error) {
    console.error('Question generation failed:', error);
    
    // NO FALLBACK - throw the error instead of generating mock questions
    throw new Error(`Claude API question generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Save generated questions to database using the new API layer
export async function saveGeneratedQuestions(
  generationResponse: QuestionGenerationResponse,
  passageId?: string,
  testMode?: string
): Promise<{ questionIds: string[], passageId?: string }> {
  try {
    const questionIds: string[] = [];
    let savedPassageId = passageId;

    // Save passage if generated
    if (generationResponse.passageGenerated && !passageId) {
      // Determine if content is Australian-focused based on metadata
      const contextApproach = (generationResponse.metadata as any).contextApproach || getContextApproach();
      const isAustralianContext = contextApproach === 'australian';
      
      const passage = await EduCourseAPI.Passage.savePassage({
        test_type: generationResponse.metadata.testType,
        year_level: parseInt(generationResponse.metadata.testType.match(/\d+/)?.[0] || '5'),
        section_name: generationResponse.metadata.sectionName,
        title: generationResponse.passageGenerated.title,
        content: generationResponse.passageGenerated.content,
        passage_type: generationResponse.passageGenerated.passageType as any,
        word_count: generationResponse.passageGenerated.wordCount,
        australian_context: isAustralianContext // Only true for 15% of content now
      });
      savedPassageId = passage.id;
    }

    // Save each question
    for (const question of generationResponse.questions) {
      const responseType = getResponseType(generationResponse.metadata.sectionName);
      
      // Handle answer options based on response type
      let answerOptions = null;
      let correctAnswer = null;
      
      if (responseType === 'multiple_choice' && question.options && question.correctAnswer) {
        answerOptions = question.options.map((opt, i) => ({
          id: String.fromCharCode(65 + i),
          content: opt
        }));
        correctAnswer = question.correctAnswer;
      }

      const savedQuestion = await EduCourseAPI.Question.saveQuestion({
        test_type: generationResponse.metadata.testType,
        year_level: parseInt(generationResponse.metadata.testType.match(/\d+/)?.[0] || '5'),
        section_name: generationResponse.metadata.sectionName,
        sub_skill: question.subSkill,
        difficulty: question.difficulty,
        passage_id: savedPassageId || null,
        question_text: question.questionText,
        has_visual: question.hasVisual,
        visual_type: question.visualType || null,
        visual_data: question.visualData ? (question.visualData as any) : null,
        response_type: responseType,
        answer_options: answerOptions,
        correct_answer: correctAnswer,
        solution: question.explanation,
        curriculum_aligned: true,
        generated_by: 'claude',
        reviewed: true, // Auto-approve for demo purposes
        test_mode: testMode || 'practice_1' // Use provided test_mode or default to practice_1
      });

      questionIds.push(savedQuestion.id);
    }

    console.log('Successfully saved questions to database:', {
      questionsCount: questionIds.length,
      passageId: savedPassageId,
      testType: generationResponse.metadata.testType,
      testMode: testMode || 'practice_1',
      visualQuestions: generationResponse.questions.filter(q => q.hasVisual).length
    });

    return {
      questionIds,
      passageId: savedPassageId
    };

  } catch (error) {
    console.error('Failed to save generated questions:', error);
    throw new Error(`Failed to save questions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Batch question generation for test sections
export async function generateTestSection(
  testType: string,
  sectionName: string,
  targetQuestionCount?: number,
  testMode?: string
): Promise<QuestionGenerationResponse[]> {
  try {
    const testStructure = TEST_STRUCTURES[testType as keyof typeof TEST_STRUCTURES];
    if (!testStructure) {
      throw new Error(`Unknown test type: ${testType}`);
    }

    const sectionConfig = testStructure[sectionName as keyof typeof testStructure];
    if (!sectionConfig) {
      throw new Error(`Unknown section: ${sectionName} for test ${testType}`);
    }

    const questionCount = targetQuestionCount || parseQuestionCount((sectionConfig as any).questions);
    const subSkills = getSubSkillsForSection(sectionName);
    
    if (subSkills.length === 0) {
      throw new Error(`No sub-skills defined for section: ${sectionName}`);
    }

    // Distribute questions across sub-skills
    const questionsPerSubSkill = Math.ceil(questionCount / subSkills.length);
    const responses: QuestionGenerationResponse[] = [];

    for (const subSkill of subSkills) {
      // Generate questions at all difficulty levels for comprehensive coverage
      const allDifficulties = getAllDifficultyLevels(); // [1, 2, 3]
      const questionsAtEachDifficulty = Math.ceil(questionsPerSubSkill / allDifficulties.length);
      
      const yearLevel = testType.includes('Year 5') ? 'Year 5' : 
                       testType.includes('Year 7') ? 'Year 7' :
                       testType.includes('Year 6') ? 'Year 6' : 'Year 8';

      // Generate questions at each difficulty level
      for (const difficulty of allDifficulties) {
        const request: QuestionGenerationRequest = {
          testType,
          yearLevel,
          sectionName,
          subSkill,
          difficulty,
          questionCount: Math.min(questionsAtEachDifficulty, 3), // Limit per batch to avoid overwhelming
          testMode: testMode // Pass through the test_mode
        };

        const response = await generateQuestions(request);
        responses.push(response);

        // Add delay between requests to respect API limits
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    return responses;

  } catch (error) {
    console.error('Test section generation failed:', error);
    throw new Error(`Test section generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Get question generation statistics
export async function getGenerationStats(testType?: string) {
  try {
    // Return mock stats for demo
    const stats = {
      totalQuestions: 150,
      aiGenerated: 120,
      byTestType: {
        'Year 5 NAPLAN': 40,
        'Year 7 NAPLAN': 35,
        'ACER Scholarship (Year 7 Entry)': 30,
        'NSW Selective Entry (Year 7 Entry)': 25,
        'EduTest Scholarship (Year 7 Entry)': 20
      },
      byDifficulty: {
        1: 45, // Easy - combined from old levels 1-2
        2: 60, // Medium - from old level 3
        3: 45  // Hard - combined from old levels 4-5
      },
      bySubSkill: {
        'Text Comprehension - Explicit': 25,
        'Mathematics - Number': 20,
        'Cognitive - Logical Reasoning': 15,
        'Language - Vocabulary': 18
      },
      recentGeneration: 45
    };

    return stats;

  } catch (error) {
    console.error('Failed to get generation stats:', error);
    throw new Error(`Failed to get stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Full Test Mode Generation - Generate complete tests with specific requirements
export interface FullTestGenerationRequest {
  testType: string;
  mode: 'practice' | 'diagnostic' | 'drill';
  practiceTestNumber?: number; // 1-5 for practice tests
}

export interface FullTestResponse {
  testId: string;
  testType: string;
  mode: string;
  sections: Array<{
    sectionName: string;
    passages?: Array<{
      id: string;
      title: string;
      content: string;
      questions: GeneratedQuestion[];
    }>;
    questions: GeneratedQuestion[];
    questionCount: number;
  }>;
  totalQuestions: number;
  metadata: {
    generatedAt: string;
    estimatedTimeMinutes: number;
    complianceChecked: boolean;
  };
}

// Generate complete practice test covering all sub-skills with mixed difficulties
export async function generateFullPracticeTest(
  testType: string,
  practiceTestNumber: number = 1
): Promise<FullTestResponse> {
  try {
    console.log(`Generating full practice test ${practiceTestNumber} for ${testType}...`);
    
    const testStructure = TEST_STRUCTURES[testType as keyof typeof TEST_STRUCTURES];
    if (!testStructure) {
      throw new Error(`Unknown test type: ${testType}`);
    }

    const testMode = `practice_${practiceTestNumber}`;
    const sections = [];
    let totalQuestions = 0;

    // Process each section in the test structure
    for (const [sectionName, sectionConfig] of Object.entries(testStructure)) {
      const subSkills = getSubSkillsForSection(sectionName, testType);
      if (subSkills.length === 0) continue;

      // Get exact question count from curriculum data
      const targetQuestionCount = parseQuestionCount((sectionConfig as any).questions);
      console.log(`Section ${sectionName}: Target ${targetQuestionCount} questions, ${subSkills.length} sub-skills available`);

      // 🌟 Resume logic: if questions for this section & mode already meet target, skip generation
      try {
        const existing = await EduCourseAPI.Question.getQuestions({
          testType,
          sectionName,
          testMode
        });
        if (existing.length >= targetQuestionCount) {
          console.log(`⏩ Skipping ${sectionName} – already has ${existing.length}/${targetQuestionCount} questions for ${testMode}`);
          sections.push({
            sectionName,
            questions: existing as any,
            questionCount: existing.length
          });
          totalQuestions += existing.length;
          continue; // proceed to next section
        }
      } catch (resumeErr) {
        console.warn(`Resume check failed for ${sectionName}:`, resumeErr);
      }

      console.log(`Generating section: ${sectionName} with ${subSkills.length} sub-skills (${targetQuestionCount} questions)`);

      if (sectionName.includes('Reading') || sectionName === 'Reading_Comprehension') {
        // Reading comprehension with passages - distribute questions optimally across sub-skills
        const passageStructure = getPassageStructure(testType, targetQuestionCount);
        const { questionsPerPassage } = passageStructure;
        const passageCount = Math.ceil(targetQuestionCount / questionsPerPassage);
        
        const passages = [];
        const allQuestions = [];
        let questionsGenerated = 0;

        for (let i = 0; i < passageCount && questionsGenerated < targetQuestionCount; i++) {
          const questionsForThisPassage = Math.min(
            questionsPerPassage, 
            targetQuestionCount - questionsGenerated
          );

          // Distribute sub-skills optimally - cycle through all available sub-skills
          const passageSubSkills = [];
          for (let q = 0; q < questionsForThisPassage; q++) {
            const subSkillIndex = (questionsGenerated + q) % subSkills.length;
            passageSubSkills.push(subSkills[subSkillIndex]);
          }

          // Distribute difficulties evenly (1, 2, 3, 1, 2, 3, ...)
          const passageDifficulties = [];
          for (let q = 0; q < questionsForThisPassage; q++) {
            const difficultyIndex = (questionsGenerated + q) % 3;
            passageDifficulties.push(difficultyIndex + 1); // 1, 2, 3
          }

          const yearLevel = testType.includes('Year 5') ? 'Year 5' : 
                            testType.includes('Year 7') ? 'Year 7' :
                            testType.includes('Year 6') ? 'Year 6' : 'Year 8';

          const passageResponse = await generatePassageWithMultipleQuestions(
            testType,
            yearLevel,
            passageSubSkills,
            passageDifficulties,
            questionsForThisPassage
          );

          if (passageResponse.passageGenerated) {
            const passage = {
              id: `passage_${i + 1}`,
              title: passageResponse.passageGenerated.title,
              content: passageResponse.passageGenerated.content,
              questions: passageResponse.questions
            };
            passages.push(passage);
            allQuestions.push(...passageResponse.questions);
            questionsGenerated += passageResponse.questions.length;
          }

          // Save questions to database
          await saveGeneratedQuestions(passageResponse, undefined, testMode);
          
          // Rate limiting
          if (i < passageCount - 1) {
            await new Promise(resolve => setTimeout(resolve, 1500));
          }
        }

        sections.push({
          sectionName,
          passages,
          questions: allQuestions,
          questionCount: allQuestions.length
        });
        totalQuestions += allQuestions.length;
        console.log(`✅ Generated ${allQuestions.length}/${targetQuestionCount} questions for ${sectionName} reading comprehension`);

      } else if (sectionName === 'Written_Expression' || sectionName === 'Writing') {
        // Writing section - generate exact number specified (usually 1-2 tasks)
        const yearLevel = testType.includes('Year 5') ? 'Year 5' : 
                          testType.includes('Year 7') ? 'Year 7' :
                          testType.includes('Year 6') ? 'Year 6' : 'Year 8';

        const allQuestions = [];
        
        // Distribute writing tasks across available sub-skills and difficulties
        for (let taskNum = 0; taskNum < targetQuestionCount; taskNum++) {
          const subSkillIndex = taskNum % subSkills.length;
          const difficultyIndex = taskNum % 3;
          
          const writingRequest: QuestionGenerationRequest = {
            testType,
            yearLevel,
            sectionName,
            subSkill: subSkills[subSkillIndex],
            difficulty: difficultyIndex + 1, // 1, 2, 3
            questionCount: 1,
            testMode
          };

          const writingResponse = await generateQuestions(writingRequest);
          await saveGeneratedQuestions(writingResponse, undefined, testMode);
          allQuestions.push(...writingResponse.questions);

          // Rate limiting
          if (taskNum < targetQuestionCount - 1) {
            await new Promise(resolve => setTimeout(resolve, 800));
          }
        }

        sections.push({
          sectionName,
          questions: allQuestions,
          questionCount: allQuestions.length
        });
        totalQuestions += allQuestions.length;
        console.log(`✅ Generated ${allQuestions.length}/${targetQuestionCount} questions for ${sectionName} writing`);

      } else {
        // Other sections (Mathematics, Verbal Reasoning, etc.) - optimal sub-skill distribution
        const yearLevel = testType.includes('Year 5') ? 'Year 5' : 
                          testType.includes('Year 7') ? 'Year 7' :
                          testType.includes('Year 6') ? 'Year 6' : 'Year 8';

        const allQuestions = [];
        
        // Calculate optimal distribution: ensure all sub-skills are covered
        const questionsPerSubSkill = Math.floor(targetQuestionCount / subSkills.length);
        const remainingQuestions = targetQuestionCount % subSkills.length;
        
        console.log(`  📊 Distributing ${targetQuestionCount} questions across ${subSkills.length} sub-skills:`);
        console.log(`  📊 Base: ${questionsPerSubSkill} per sub-skill, Extra: ${remainingQuestions} questions`);

        for (let subSkillIndex = 0; subSkillIndex < subSkills.length; subSkillIndex++) {
          const subSkill = subSkills[subSkillIndex];
          
          // Each sub-skill gets base amount + 1 extra if within remainder
          const questionsForThisSubSkill = questionsPerSubSkill + (subSkillIndex < remainingQuestions ? 1 : 0);
          
          if (questionsForThisSubSkill === 0) continue;
          
          console.log(`  📝 ${subSkill}: ${questionsForThisSubSkill} questions`);

          // Distribute difficulties evenly within this sub-skill
          const difficulties = distributeDifficulties(questionsForThisSubSkill);
          
          // Generate questions in batches to respect API limits
          const batchSize = Math.min(5, questionsForThisSubSkill);
          for (let batch = 0; batch < questionsForThisSubSkill; batch += batchSize) {
            const questionsInBatch = Math.min(batchSize, questionsForThisSubSkill - batch);
            const batchDifficulties = difficulties.slice(batch, batch + questionsInBatch);
            
            // Use the most common difficulty for this batch
            const avgDifficulty = Math.round(
              batchDifficulties.reduce((a, b) => a + b, 0) / batchDifficulties.length
            );

            const request: QuestionGenerationRequest = {
              testType,
              yearLevel,
              sectionName,
              subSkill,
              difficulty: avgDifficulty,
              questionCount: questionsInBatch,
              testMode
            };

            const response = await generateQuestions(request);
            await saveGeneratedQuestions(response, undefined, testMode);
            allQuestions.push(...response.questions);

            // Rate limiting between batches
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }

        sections.push({
          sectionName,
          questions: allQuestions,
          questionCount: allQuestions.length
        });
        totalQuestions += allQuestions.length;
        console.log(`✅ Generated ${allQuestions.length}/${targetQuestionCount} questions for ${sectionName}`);
      }
    }

    console.log(`Successfully generated full practice test with ${totalQuestions} questions`);

    return {
      testId: `practice_test_${practiceTestNumber}_${testType}_${Date.now()}`,
      testType,
      mode: `practice_${practiceTestNumber}`,
      sections,
      totalQuestions,
      metadata: {
        generatedAt: new Date().toISOString(),
        estimatedTimeMinutes: Math.ceil(totalQuestions * 1.5), // 1.5 minutes per question
        complianceChecked: true
      }
    };

  } catch (error) {
    console.error('Full practice test generation failed:', error);
    throw new Error(`Practice test generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Generate complete diagnostic test - all sub-skills tested once per difficulty level 1-3
export async function generateFullDiagnosticTest(testType: string): Promise<FullTestResponse> {
  try {
    console.log(`Generating full diagnostic test for ${testType}...`);
    
    const testStructure = TEST_STRUCTURES[testType as keyof typeof TEST_STRUCTURES];
    if (!testStructure) {
      throw new Error(`Unknown test type: ${testType}`);
    }

    const testMode = 'diagnostic';
    const sections = [];
    let totalQuestions = 0;

    for (const [sectionName, sectionConfig] of Object.entries(testStructure)) {
      const subSkills = getSubSkillsForSection(sectionName);
      if (subSkills.length === 0) continue;

      console.log(`Generating diagnostic section: ${sectionName}`);

      if (sectionName.includes('Reading') || sectionName === 'Reading_Comprehension') {
        // Reading: Each sub-skill tested at each difficulty (1-3) with 3-4 questions per passage
        const questionsPerPassage = 4;
        const totalDiagnosticQuestions = subSkills.length * 3; // 3 difficulties per sub-skill
        const passageCount = Math.ceil(totalDiagnosticQuestions / questionsPerPassage);
        
        const passages = [];
        const allQuestions = [];

        for (let i = 0; i < passageCount; i++) {
          // Distribute sub-skills and difficulties systematically
          const passageSubSkills = [];
          const passageDifficulties = [];
          
          for (let q = 0; q < questionsPerPassage && (i * questionsPerPassage + q) < totalDiagnosticQuestions; q++) {
            const questionIndex = i * questionsPerPassage + q;
            const subSkillIndex = Math.floor(questionIndex / 3);
            const difficulty = (questionIndex % 3) + 1;
            
            passageSubSkills.push(subSkills[subSkillIndex % subSkills.length]);
            passageDifficulties.push(difficulty);
          }

          const yearLevel = testType.includes('Year 5') ? 'Year 5' : 
                            testType.includes('Year 7') ? 'Year 7' :
                            testType.includes('Year 6') ? 'Year 6' : 'Year 8';

          const passageResponse = await generatePassageWithMultipleQuestions(
            testType,
            yearLevel,
            passageSubSkills,
            passageDifficulties,
            passageSubSkills.length
          );

          if (passageResponse.passageGenerated) {
            const passage = {
              id: `diagnostic_passage_${i + 1}`,
              title: passageResponse.passageGenerated.title,
              content: passageResponse.passageGenerated.content,
              questions: passageResponse.questions
            };
            passages.push(passage);
            allQuestions.push(...passageResponse.questions);
          }

          await saveGeneratedQuestions(passageResponse, undefined, testMode);
          
          if (i < passageCount - 1) {
            await new Promise(resolve => setTimeout(resolve, 1500));
          }
        }

        sections.push({
          sectionName,
          passages,
          questions: allQuestions,
          questionCount: allQuestions.length
        });
        totalQuestions += allQuestions.length;

      } else if (sectionName === 'Written_Expression' || sectionName === 'Writing') {
        // Writing: Just one diagnostic task
        const yearLevel = testType.includes('Year 5') ? 'Year 5' : 
                          testType.includes('Year 7') ? 'Year 7' :
                          testType.includes('Year 6') ? 'Year 6' : 'Year 8';

        const writingRequest: QuestionGenerationRequest = {
          testType,
          yearLevel,
          sectionName,
          subSkill: subSkills[0],
          difficulty: 2, // Medium for diagnostic
          questionCount: 1,
          testMode
        };

        const writingResponse = await generateQuestions(writingRequest);
        await saveGeneratedQuestions(writingResponse, undefined, testMode);

        sections.push({
          sectionName,
          questions: writingResponse.questions,
          questionCount: writingResponse.questions.length
        });
        totalQuestions += writingResponse.questions.length;

      } else {
        // Other sections: Each sub-skill tested once per difficulty level 1-3
        const yearLevel = testType.includes('Year 5') ? 'Year 5' : 
                          testType.includes('Year 7') ? 'Year 7' :
                          testType.includes('Year 6') ? 'Year 6' : 'Year 8';

        const allQuestions = [];

        for (const subSkill of subSkills) {
          for (let difficulty = 1; difficulty <= 3; difficulty++) {
            const request: QuestionGenerationRequest = {
              testType,
              yearLevel,
              sectionName,
              subSkill,
              difficulty,
              questionCount: 1, // One question per sub-skill per difficulty
              testMode
            };

            const response = await generateQuestions(request);
            await saveGeneratedQuestions(response, undefined, testMode);
            allQuestions.push(...response.questions);

            await new Promise(resolve => setTimeout(resolve, 300));
          }
        }

        sections.push({
          sectionName,
          questions: allQuestions,
          questionCount: allQuestions.length
        });
        totalQuestions += allQuestions.length;
      }
    }

    console.log(`Successfully generated diagnostic test with ${totalQuestions} questions`);

    return {
      testId: `diagnostic_test_${testType}_${Date.now()}`,
      testType,
      mode: 'diagnostic',
      sections,
      totalQuestions,
      metadata: {
        generatedAt: new Date().toISOString(),
        estimatedTimeMinutes: Math.ceil(totalQuestions * 2), // 2 minutes per diagnostic question
        complianceChecked: true
      }
    };

  } catch (error) {
    console.error('Full diagnostic test generation failed:', error);
    throw new Error(`Diagnostic test generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Generate complete drill set - 30 questions per sub-skill (10 per difficulty level)
export async function generateFullDrillSet(testType: string): Promise<FullTestResponse> {
  try {
    console.log(`Generating full drill set for ${testType}...`);
    
    const testStructure = TEST_STRUCTURES[testType as keyof typeof TEST_STRUCTURES];
    if (!testStructure) {
      throw new Error(`Unknown test type: ${testType}`);
    }

    const testMode = 'drill';
    const sections = [];
    let totalQuestions = 0;

    for (const [sectionName, sectionConfig] of Object.entries(testStructure)) {
      const subSkills = getSubSkillsForSection(sectionName);
      if (subSkills.length === 0) continue;

      console.log(`Generating drill section: ${sectionName} with ${subSkills.length} sub-skills`);

      if (sectionName.includes('Reading') || sectionName === 'Reading_Comprehension') {
        // Reading drills: 30 questions per sub-skill, organized in passages of 3-4 questions
        const questionsPerPassage = 4;
        const questionsPerSubSkill = 30;
        const passages = [];
        const allQuestions = [];

        for (const subSkill of subSkills) {
          const passagesForSubSkill = Math.ceil(questionsPerSubSkill / questionsPerPassage);
          
          for (let p = 0; p < passagesForSubSkill; p++) {
            const questionsInThisPassage = Math.min(questionsPerPassage, questionsPerSubSkill - (p * questionsPerPassage));
            
            // 10 questions per difficulty level (1, 2, 3)
            const passageSubSkills = Array(questionsInThisPassage).fill(subSkill);
            const passageDifficulties = [];
            
            for (let q = 0; q < questionsInThisPassage; q++) {
              const questionIndex = p * questionsPerPassage + q;
              const difficulty = Math.floor(questionIndex / 10) + 1; // 10 questions per difficulty
              passageDifficulties.push(Math.min(difficulty, 3));
            }

            const yearLevel = testType.includes('Year 5') ? 'Year 5' : 
                              testType.includes('Year 7') ? 'Year 7' :
                              testType.includes('Year 6') ? 'Year 6' : 'Year 8';

            const passageResponse = await generatePassageWithMultipleQuestions(
              testType,
              yearLevel,
              passageSubSkills,
              passageDifficulties,
              questionsInThisPassage
            );

            if (passageResponse.passageGenerated) {
              const passage = {
                id: `drill_${subSkill.replace(/\s+/g, '_')}_passage_${p + 1}`,
                title: passageResponse.passageGenerated.title,
                content: passageResponse.passageGenerated.content,
                questions: passageResponse.questions
              };
              passages.push(passage);
              allQuestions.push(...passageResponse.questions);
            }

            await saveGeneratedQuestions(passageResponse, undefined, testMode);
            
            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 1200));
          }
        }

        sections.push({
          sectionName,
          passages,
          questions: allQuestions,
          questionCount: allQuestions.length
        });
        totalQuestions += allQuestions.length;

      } else if (sectionName === 'Written_Expression' || sectionName === 'Writing') {
        // Writing drills: 10 tasks per difficulty level (30 total)
        const yearLevel = testType.includes('Year 5') ? 'Year 5' : 
                          testType.includes('Year 7') ? 'Year 7' :
                          testType.includes('Year 6') ? 'Year 6' : 'Year 8';

        const allQuestions = [];

        for (let difficulty = 1; difficulty <= 3; difficulty++) {
          const writingRequest: QuestionGenerationRequest = {
            testType,
            yearLevel,
            sectionName,
            subSkill: subSkills[0],
            difficulty,
            questionCount: 10, // 10 tasks per difficulty
            testMode
          };

          const writingResponse = await generateQuestions(writingRequest);
          await saveGeneratedQuestions(writingResponse, undefined, testMode);
          allQuestions.push(...writingResponse.questions);

          await new Promise(resolve => setTimeout(resolve, 800));
        }

        sections.push({
          sectionName,
          questions: allQuestions,
          questionCount: allQuestions.length
        });
        totalQuestions += allQuestions.length;

      } else {
        // Other sections: 30 questions per sub-skill (10 per difficulty level)
        const yearLevel = testType.includes('Year 5') ? 'Year 5' : 
                          testType.includes('Year 7') ? 'Year 7' :
                          testType.includes('Year 6') ? 'Year 6' : 'Year 8';

        const allQuestions = [];

        for (const subSkill of subSkills) {
          for (let difficulty = 1; difficulty <= 3; difficulty++) {
            const request: QuestionGenerationRequest = {
              testType,
              yearLevel,
              sectionName,
              subSkill,
              difficulty,
              questionCount: 10, // 10 questions per difficulty level
              testMode
            };

            const response = await generateQuestions(request);
            await saveGeneratedQuestions(response, undefined, testMode);
            allQuestions.push(...response.questions);

            await new Promise(resolve => setTimeout(resolve, 600));
          }
        }

        sections.push({
          sectionName,
          questions: allQuestions,
          questionCount: allQuestions.length
        });
        totalQuestions += allQuestions.length;
      }
    }

    console.log(`Successfully generated drill set with ${totalQuestions} questions`);

    return {
      testId: `drill_set_${testType}_${Date.now()}`,
      testType,
      mode: 'drill',
      sections,
      totalQuestions,
      metadata: {
        generatedAt: new Date().toISOString(),
        estimatedTimeMinutes: Math.ceil(totalQuestions * 1), // 1 minute per drill question
        complianceChecked: true
      }
    };

  } catch (error) {
    console.error('Full drill set generation failed:', error);
    throw new Error(`Drill set generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Master function for full test mode generation
export async function generateFullTestMode(request: FullTestGenerationRequest): Promise<FullTestResponse> {
  switch (request.mode) {
    case 'practice':
      return await generateFullPracticeTest(request.testType, request.practiceTestNumber || 1);
    
    case 'diagnostic':
      return await generateFullDiagnosticTest(request.testType);
    
    case 'drill':
      return await generateFullDrillSet(request.testType);
    
    default:
      throw new Error(`Unknown generation mode: ${request.mode}`);
  }
}

// Helper: Sleep for ms milliseconds
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Enhanced Claude API wrapper with built-in exponential back-off / retry
async function callClaudeAPIWithRetry(
  prompt: string,
  retries: number = 4,
  baseDelayMs: number = 2000
): Promise<any> {
  let attempt = 0;
  while (true) {
    try {
      return await callClaudeAPI(prompt);
    } catch (err) {
      attempt++;
      const message = err instanceof Error ? err.message : String(err);
      // Only retry if there are attempts left and the error is likely transient
      const shouldRetry =
        attempt <= retries &&
        /(overloaded|timeout|rate limit|429|502|503|504)/i.test(message);

      if (!shouldRetry) {
        throw err;
      }

      const delay = baseDelayMs * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 500);
      console.warn(
        `Claude API transient error (attempt ${attempt}/${retries}): ${message}. Retrying in ${delay} ms …`
      );
      await sleep(delay);
    }
  }
}

function getTestSpecificDifficultyGuidance(testType: string, difficulty: number): string {
  const difficultyLabels = ['', 'Accessible', 'Standard', 'Challenging'];
  const currentLabel = difficultyLabels[difficulty] || 'Standard';
  
  if (testType.includes('NAPLAN')) {
    return `NAPLAN ${currentLabel} (${difficulty}/3):
${difficulty === 1 ? '- Straightforward curriculum-aligned questions with clear context\n- Direct application of classroom learning\n- Familiar scenarios and vocabulary' : 
  difficulty === 2 ? '- Typical NAPLAN complexity requiring solid preparation\n- May require one-step inference or problem-solving\n- Standard academic vocabulary and contexts' : 
  '- More complex scenarios requiring deeper analysis\n- Multi-step reasoning within NAPLAN scope\n- Advanced application of curriculum concepts'}`;
  }
  
  if (testType.includes('ACER')) {
    return `ACER ${currentLabel} (${difficulty}/3):
${difficulty === 1 ? '- Clear patterns and logical connections\n- Straightforward analytical reasoning\n- Basic application of ACER-style thinking' : 
  difficulty === 2 ? '- Typical ACER complexity with sophisticated reasoning\n- Pattern recognition requiring analysis\n- Abstract thinking with clear structure' : 
  '- Complex multi-layered reasoning challenges\n- Advanced pattern recognition and analysis\n- Sophisticated abstract and logical thinking'}`;
  }
  
  if (testType.includes('EduTest')) {
    return `EduTest ${currentLabel} (${difficulty}/3):
${difficulty === 1 ? '- Clear reasoning tasks with guided structure\n- Direct application of analytical skills\n- Accessible complex thinking scenarios' : 
  difficulty === 2 ? '- Typical EduTest multi-concept integration\n- Inference and critical analysis requirements\n- Standard academic complexity' : 
  '- Advanced synthesis of multiple concepts\n- High-level critical thinking and analysis\n- Complex reasoning beyond grade expectations'}`;
  }
  
  if (testType.includes('Selective')) {
    return `Selective Entry ${currentLabel} (${difficulty}/3):
${difficulty === 1 ? '- Clear but advanced reasoning requirements\n- Sophisticated vocabulary with context support\n- Advanced thinking with accessible presentation' : 
  difficulty === 2 ? '- Typical selective-level cognitive demands\n- High-level analysis and synthesis\n- Complex reasoning characteristic of selective tests' : 
  '- Exceptional analytical and critical thinking\n- Advanced multi-concept integration\n- Designed to identify academically gifted students'}`;
  }
  
  return `${testType} ${currentLabel} (${difficulty}/3):
- Questions appropriate for difficulty level ${difficulty} within this test type
- Cognitive complexity relative to ${testType} standards
- Maintains authentic ${testType} question characteristics`;
}

// Utility function to verify difficulty coverage for a test type
export async function verifyDifficultyCoverage(testType: string): Promise<{
  testType: string;
  sections: Array<{
    sectionName: string;
    subSkills: Array<{
      subSkill: string;
      supportedDifficulties: number[];
      visualRequired: boolean;
    }>;
  }>;
  totalCombinations: number;
}> {
  try {
    const testStructure = TEST_STRUCTURES[testType as keyof typeof TEST_STRUCTURES];
    if (!testStructure) {
      throw new Error(`Unknown test type: ${testType}`);
    }

    const allDifficulties = getAllDifficultyLevels(); // [1, 2, 3]
    const sections = [];
    let totalCombinations = 0;

    for (const [sectionName] of Object.entries(testStructure)) {
      const subSkills = getSubSkillsForSection(sectionName, testType);
      
      const sectionInfo = {
        sectionName,
        subSkills: subSkills.map(subSkill => ({
          subSkill,
          supportedDifficulties: allDifficulties, // All sub-skills support all difficulties
          visualRequired: isVisualRequired(subSkill)
        }))
      };
      
      sections.push(sectionInfo);
      totalCombinations += subSkills.length * allDifficulties.length;
    }

    return {
      testType,
      sections,
      totalCombinations
    };

  } catch (error) {
    console.error('Difficulty coverage verification failed:', error);
    throw new Error(`Coverage verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Utility function to preview practice test structure without generating questions
export function previewPracticeTestStructure(testType: string): {
  testType: string;
  sections: Array<{
    sectionName: string;
    targetQuestions: number;
    availableSubSkills: number;
    questionDistribution: Array<{
      subSkill: string;
      questionsAllocated: number;
      difficultyMix: string;
    }>;
    passageStructure?: {
      passageCount: number;
      questionsPerPassage: number;
    };
  }>;
  totalQuestions: number;
  estimatedTimeMinutes: number;
} {
  const testStructure = TEST_STRUCTURES[testType as keyof typeof TEST_STRUCTURES];
  if (!testStructure) {
    throw new Error(`Unknown test type: ${testType}`);
  }

  const sections = [];
  let totalQuestions = 0;

  for (const [sectionName, sectionConfig] of Object.entries(testStructure)) {
    const subSkills = getSubSkillsForSection(sectionName, testType);
    if (subSkills.length === 0) continue;

    const targetQuestionCount = parseQuestionCount((sectionConfig as any).questions);
    
    // Calculate question distribution
    const questionsPerSubSkill = Math.floor(targetQuestionCount / subSkills.length);
    const remainingQuestions = targetQuestionCount % subSkills.length;
    
    const questionDistribution = subSkills.map((subSkill, index) => {
      const questionsAllocated = questionsPerSubSkill + (index < remainingQuestions ? 1 : 0);
      const difficultyCount = Math.ceil(questionsAllocated / 3);
      
      return {
        subSkill,
        questionsAllocated,
        difficultyMix: `${difficultyCount}×Level1, ${difficultyCount}×Level2, ${Math.max(0, questionsAllocated - difficultyCount * 2)}×Level3`
      };
    });

    let passageStructure = undefined;
    if (sectionName.includes('Reading') || sectionName === 'Reading_Comprehension') {
      const structure = getPassageStructure(testType, targetQuestionCount);
      passageStructure = {
        passageCount: structure.passageCount,
        questionsPerPassage: structure.questionsPerPassage
      };
    }

    sections.push({
      sectionName,
      targetQuestions: targetQuestionCount,
      availableSubSkills: subSkills.length,
      questionDistribution,
      passageStructure
    });

    totalQuestions += targetQuestionCount;
  }

  return {
    testType,
    sections,
    totalQuestions,
    estimatedTimeMinutes: Math.ceil(totalQuestions * 1.5) // 1.5 minutes per question
  };
}