// Question Generation Engine (Engine 1)
// Implements AI-powered question generation using Claude 4 Sonnet API with proper visual support

import { config } from 'dotenv';
import { supabase } from '../../integrations/supabase/client';
import EduCourseAPI from '../../services/apiService';
import { 
  TEST_STRUCTURES, 
  UNIFIED_SUB_SKILLS, 
  getSubSkillsForSection,
  isVisualRequired,
  parseQuestionCount,
  getAllDifficultyLevels,
  distributeDifficulties,
  getRandomDifficulty
} from '../../data/curriculumData';
import { visualCacheService } from '../../utils/visualCacheService';
import { 
  getVisualTypePool, 
  getVisualGenerationPrompt, 
  isVisualTypeValid,
  type VisualType as MappedVisualType 
} from './visualTypeMapping';

// Load environment variables
config();

// Define interface for section configuration
interface SectionConfig {
  questions: string | number;
  [key: string]: unknown;
}

// Define interface for import.meta environment
interface ImportMetaEnv {
  VITE_CLAUDE_API_KEY?: string;
  [key: string]: unknown;
}

interface ImportMeta {
  env: ImportMetaEnv;
}

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

// New educational visual specification system
export type VisualType = 
  | 'geometric_grid_diagram'
  | 'bar_chart'
  | 'line_graph'
  | 'pie_chart'
  | 'technical_drawing'
  | 'coordinate_plane'
  | 'pattern_sequence'
  | 'measurement_diagram'
  | 'algebra_illustration'
  | 'statistical_display';

// Define specific types for visual elements
export interface VisualElementProperties {
  width?: string | number;
  height?: string | number;
  labels?: boolean;
  ticks?: boolean;
  scale?: string | number;
  spacing?: number;
  showNumbers?: boolean;
  fillColor?: string;
  strokeColor?: string;
  range?: number[];
  step?: number;
  [key: string]: unknown;
}

export interface VisualElementStyling {
  color?: string;
  fontSize?: string;
  strokeWidth?: number;
  background?: string;
  border?: string;
  [key: string]: unknown;
}

export interface VisualElement {
  type: string;
  properties: VisualElementProperties;
  position?: { x?: number; y?: number; };
  styling?: VisualElementStyling;
}

export interface VisualSpecification {
  // Core specifications for visual generation
  title: string;                    // Brief title for the visual
  description: string;              // Clear, specific description for generation
  visual_type: VisualType;          // Type of visual to create
  dimensions: { width: number; height: number };
  
  // Specific generation details
  elements: {
    [key: string]: VisualElement;
  };
  
  // Additional specifications
  styling: {
    colors: string[];
    fonts?: string[];
    background: string;
    theme: string;
  };
  
  // Data/content for the visual
  data?: Record<string, unknown>;
  
  // Brief constraints
  requirements: string[];
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
  visualSpecification?: VisualSpecification; // New educational specification
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
// Handle both browser (import.meta.env) and Node.js (process.env) environments
const CLAUDE_API_KEY = (() => {
  // Check if we're in Node.js environment (safer check)
  if (typeof window === 'undefined' && typeof process !== 'undefined' && process.env) {
    const viteKey = process.env.VITE_CLAUDE_API_KEY;
    const claudeKey = process.env.CLAUDE_API_KEY;
    console.log('🔍 Debug - Node.js environment detected');
    console.log('🔍 Debug - VITE_CLAUDE_API_KEY:', viteKey ? 'Present' : 'Missing');
    console.log('🔍 Debug - CLAUDE_API_KEY:', claudeKey ? 'Present' : 'Missing');
    return viteKey || claudeKey;
  }
  // Browser environment
  console.log('🔍 Debug - Browser environment detected');
  return (import.meta as ImportMeta).env?.VITE_CLAUDE_API_KEY;
})() as string;
console.log('🔍 Debug - Final CLAUDE_API_KEY:', CLAUDE_API_KEY ? 'Present' : 'Missing');
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
  // Generate diverse topic domains to avoid repetition
  const academicDomains = ['science & technology', 'history & culture', 'arts & literature', 'environment & nature', 'health & sports', 'mathematics & logic'];
  const realWorldDomains = ['transportation & travel', 'food & nutrition', 'architecture & engineering', 'space & astronomy', 'economics & business', 'community & society'];
  const creativeDomains = ['music & performing arts', 'digital media & design', 'innovation & invention', 'adventure & exploration', 'communication & language', 'problem-solving & strategy'];
  
  const randomAcademic = academicDomains[Math.floor(Math.random() * academicDomains.length)];
  const randomRealWorld = realWorldDomains[Math.floor(Math.random() * realWorldDomains.length)];
  const randomCreative = creativeDomains[Math.floor(Math.random() * creativeDomains.length)];

  // Add UK spelling instruction to all approaches
  const ukSpellingInstruction = `
**CRITICAL: USE UK SPELLING THROUGHOUT**
- Use British/UK spelling conventions for ALL content (e.g., "colour" not "color")
- Use "-ise" word endings, not "-ize" (e.g., "organise" not "organize")
- Use UK spelling for all terms (e.g., "centre" not "center", "labelled" not "labeled")
- Double consonants in words like "travelled", "modelling", "cancelled"
- Use UK vocabulary preferences: "autumn" not "fall", "rubbish" not "trash"
- All text including questions, options, explanations, and visuals must use UK spelling consistently
`;

  switch (approach) {
    case 'australian':
      return `
${ukSpellingInstruction}

**Context: Australian Focus**
- Use Australian spelling, terminology, and cultural references when appropriate
- Include Australian locations, sports, wildlife, or cultural elements where relevant
- Maintain curriculum alignment with Australian standards
- Generate age-appropriate Australian content that students can relate to
- Focus on diverse Australian contexts: Indigenous culture, multiculturalism, geography, history, and modern Australian society
- Suggested domains: ${randomAcademic}, ${randomRealWorld}, Australian-specific content`;
    
    case 'trending':
      return `
${ukSpellingInstruction}

**Context: Engaging & Current (DIVERSE TOPICS)**
IMPORTANT: Avoid overusing social media/TikTok themes. Use VARIED current topics including:
- STEM innovations: robotics, renewable energy, medical breakthroughs, space exploration
- Creative industries: game development, animation, music production, digital art
- Real-world applications: smart cities, sustainable living, extreme sports, culinary trends
- Educational technology: coding, maker spaces, virtual reality learning, scientific discoveries
- Youth interests: sports analytics, environmental activism, entrepreneurship, creative writing
- Focus domain for this generation: ${randomCreative}
- Make content fun and engaging while maintaining educational value and TOPIC DIVERSITY
- Use contemporary examples students can connect with across MULTIPLE domains`;
    
    case 'universal':
      return `
${ukSpellingInstruction}

**Context: Diverse & Accessible (BROAD SPECTRUM)**
- Use a variety of interesting, age-appropriate topics from different domains
- Primary focus areas: ${randomAcademic}, ${randomRealWorld}
- Include modern, relevant examples that are globally relatable
- Balance educational content with student engagement across diverse subject areas
- Generate content that is inclusive and accessible to diverse backgrounds
- Focus on universal experiences: problem-solving, discovery, creativity, collaboration
- Avoid concentrating on any single topic area (e.g., social media, technology only)
- Create content that sparks curiosity across MULTIPLE disciplines and interests
- Examples: scientific discoveries, historical mysteries, mathematical patterns, artistic techniques, natural phenomena, human achievements`;
  }
}

// Get passage difficulty guidance for reading comprehension
function getPassageDifficultyGuidance(testType: string, passageDifficulty: number, yearLevel: string, isPoetry: boolean): string {
  const contentType = isPoetry ? 'poem' : 'passage';
  const difficultyLabels = ['', 'Below Average', 'Average', 'Above Average'];
  const currentLabel = difficultyLabels[passageDifficulty] || 'Average';
  
  const baseGuidance = `
**${currentLabel} Difficulty ${contentType.toUpperCase()} (Level ${passageDifficulty}/3):**

**Vocabulary Level:**
${passageDifficulty === 1 ? '- Use familiar, everyday vocabulary appropriate for the year level\n- Include context clues for any challenging words\n- Avoid technical jargon or advanced academic terms\n- Choose accessible synonyms over complex alternatives' :
  passageDifficulty === 2 ? '- Use standard academic vocabulary expected for the year level\n- Include some challenging but grade-appropriate terms\n- Balance familiar and new vocabulary with reasonable context\n- Incorporate subject-specific terms when relevant to content' :
  '- Use sophisticated vocabulary that challenges readers\n- Include advanced academic and technical terminology\n- Employ complex synonyms and nuanced word choices\n- Minimal context clues - expect higher vocabulary knowledge'}

**Sentence Structure:**
${passageDifficulty === 1 ? '- Predominantly simple and compound sentences\n- Clear subject-verb relationships\n- Straightforward syntax with logical flow\n- Shorter sentences averaging 10-15 words' :
  passageDifficulty === 2 ? '- Mix of simple, compound, and some complex sentences\n- Moderate use of subordinate clauses\n- Varied sentence lengths with clear connections\n- Average sentence length 12-20 words' :
  '- Complex and compound-complex sentence structures\n- Multiple subordinate clauses and embedded phrases\n- Sophisticated syntactic relationships\n- Longer, more intricate sentences averaging 15-25 words'}

**Conceptual Complexity:**
${passageDifficulty === 1 ? '- Concrete, straightforward concepts\n- Linear narrative or clear cause-effect relationships\n- Explicit connections between ideas\n- Single main theme with supporting details' :
  passageDifficulty === 2 ? '- Moderate abstract thinking required\n- Some implicit connections between concepts\n- Multiple themes that interconnect\n- Balanced concrete and abstract elements' :
  '- Abstract and sophisticated conceptual content\n- Implicit relationships requiring inference\n- Multiple layered themes and complex ideas\n- Advanced critical thinking concepts'}

**${isPoetry ? 'Poetic' : 'Text'} Features:**
${isPoetry ? 
  (passageDifficulty === 1 ? '- Clear, accessible poetic devices (rhyme, simple metaphors)\n- Straightforward themes and emotions\n- Regular rhythm and structure\n- Obvious literary elements' :
   passageDifficulty === 2 ? '- Moderate use of figurative language\n- Some symbolism and deeper meaning\n- Varied poetic forms and techniques\n- Balanced literal and figurative elements' :
   '- Sophisticated literary devices and symbolism\n- Complex metaphorical language\n- Advanced poetic techniques\n- Multi-layered meaning requiring deep analysis') :
  (passageDifficulty === 1 ? '- Clear organizational structure\n- Explicit topic sentences and transitions\n- Straightforward argumentation or narrative flow\n- Obvious text features and formatting' :
   passageDifficulty === 2 ? '- Standard expository or narrative structure\n- Some implicit connections between paragraphs\n- Moderate use of text features\n- Balanced explicit and implicit information' :
   '- Complex organizational patterns\n- Sophisticated argumentation or narrative techniques\n- Advanced text features and formatting\n- Implicit relationships requiring analysis')}`;

  // Add test-specific considerations
  if (testType.includes('NAPLAN')) {
    return baseGuidance + `

**NAPLAN-Specific Considerations:**
- Align with Australian Curriculum ${yearLevel} reading standards
- Include Australian contexts and cultural references when appropriate
- Match complexity expectations for NAPLAN reading assessments
- Ensure accessibility while maintaining academic rigour`;
  }
  
  if (testType.includes('Selective')) {
    return baseGuidance + `

**Selective Entry Considerations:**
- Content should challenge high-achieving students
- Incorporate sophisticated themes appropriate for academically gifted learners
- Require advanced reading comprehension skills
- Include complex reasoning and analytical demands`;
  }
  
  return baseGuidance + `

**${testType} Alignment:**
- Match the cognitive demands expected for ${testType} assessments
- Ensure passage complexity aligns with test standards
- Balance challenge level with year group capabilities
- Maintain authentic ${testType} passage characteristics`;
}

// Generate multiple questions for a single passage
export async function generatePassageWithMultipleQuestions(
  testType: string,
  yearLevel: string,
  subSkills: string[],
  passageDifficulty: number,
  questionsPerPassage: number,
  sectionName?: string // Add optional sectionName parameter
): Promise<QuestionGenerationResponse> {
  try {
    const contextApproach = getContextApproach();
    const contextInstruction = getContextInstruction(contextApproach);
    
    // Get sub-skill descriptions from the curriculum data
    const subSkillDescriptions = subSkills.map(skill => {
      const skillInfo = UNIFIED_SUB_SKILLS[skill as keyof typeof UNIFIED_SUB_SKILLS];
      return `${skill}: ${skillInfo?.description || 'No description available'}`;
    }).join('\n    - ');
    
    // Check if Poetry interpretation is one of the subSkills
    const isPoetryPassage = subSkills.some(skill => skill.includes('Poetry interpretation'));
    
    // Build the passage type instruction based on whether it's a poetry passage
    const passageTypeInstruction = isPoetryPassage 
      ? '**IMPORTANT: This passage must be a POEM.** Create an age-appropriate poem that students can analyze for poetic elements, literary devices, and meaning.'
      : 'Generate an engaging informational, narrative, or argumentative passage appropriate for the test type and year level.';
    
    // Generate passage difficulty guidance
    const passageDifficultyGuidance = getPassageDifficultyGuidance(testType, passageDifficulty, yearLevel, isPoetryPassage);
    
    // Add authenticity guidance
    const authenticityGuidance = getPassageAuthenticityGuidance(testType, isPoetryPassage);
    
    // **CRITICAL FIX**: Ensure each question gets a different sub-skill
    const questionsWithSubSkills = [];
    for (let i = 0; i < questionsPerPassage; i++) {
      const subSkill = subSkills[i % subSkills.length]; // Cycle through sub-skills
      questionsWithSubSkills.push(`Question ${i + 1}: ${subSkill}`);
    }
    
    const prompt = `You are an expert educational content creator specializing in creating authentic ${testType} assessment materials. Your task is to create a reading ${isPoetryPassage ? 'poem' : 'passage'} with questions that students would believe came directly from an official ${testType} exam paper.

**CRITICAL: USE UK SPELLING THROUGHOUT**
- Use British/UK spelling conventions for ALL content (e.g., "colour" not "color")
- Use "-ise" word endings, not "-ize" (e.g., "organise" not "organize") 
- Use UK spelling for all terms (e.g., "centre" not "center", "labelled" not "labeled")
- Double consonants in words like "travelled", "modelling", "cancelled"
- Use UK vocabulary preferences: "autumn" not "fall", "rubbish" not "trash"
- All text including passage content, questions, options, explanations must use UK spelling consistently

**TEST AUTHENTICITY REQUIREMENTS:**
- The ${isPoetryPassage ? 'poem' : 'passage'} and questions should match the style of official ${testType} materials
- Match the style, format, and presentation standards of real ${testType} reading assessments
- Use vocabulary, complexity, and questioning patterns authentic to ${testType} at this year level
- Questions must follow the format and cognitive demand expected in ${testType}
- Create content that students who have practiced with real ${testType} papers would recognize as authentic

${authenticityGuidance}

**PASSAGE AND QUESTIONS REQUIREMENTS:**
- Test Type: ${testType}
- Year Level: ${yearLevel}
- Sub-skills to assess: ${subSkills.join(', ')}
- Sub-skill Descriptions:
  - ${subSkillDescriptions}
- **PASSAGE DIFFICULTY: ${passageDifficulty}/3** (controls vocabulary, sentence structure, and complexity)
- **QUESTIONS DIFFICULTY: Aligned to passage difficulty ${passageDifficulty}/3**
- Total Questions: ${questionsPerPassage}

**CRITICAL: EACH QUESTION MUST TEST A DIFFERENT SUB-SKILL**
${questionsWithSubSkills.join('\n    ')}

**CRITICAL: PASSAGE-DRIVEN DIFFICULTY SYSTEM**
The passage difficulty ${passageDifficulty}/3 determines both:
1. **Passage Characteristics**: Vocabulary level, sentence complexity, conceptual sophistication
2. **Question Alignment**: All questions should be appropriate for a difficulty ${passageDifficulty} passage

**PASSAGE DIFFICULTY SPECIFICATIONS:**
${passageDifficultyGuidance}

**PASSAGE TYPE: ${isPoetryPassage ? 'POETRY' : 'PROSE'}**
${passageTypeInstruction}

**SUB-SKILL ALIGNMENT:**
Each question must specifically target one of the listed sub-skills. Use the provided descriptions to ensure questions accurately assess the intended cognitive abilities while matching the passage difficulty level.

${contextInstruction}

**Requirements:**
1. Generate ONE engaging ${isPoetryPassage ? 'poem' : 'passage'} (${isPoetryPassage ? '150-300' : '300-500'} words) at difficulty level ${passageDifficulty}/3
2. Create ${questionsPerPassage} questions that test DIFFERENT sub-skills from: ${subSkills.join(', ')}
3. All questions should be aligned to difficulty ${passageDifficulty}/3 (matching the passage complexity)
4. Each question must have exactly 4 multiple-choice options (A, B, C, D)
5. Provide clear explanations for correct answers
6. Make content engaging and relatable for Year ${yearLevel.replace('Year ', '')} students
7. Ensure questions comprehensively test the ${isPoetryPassage ? 'poem' : 'passage'} content

**Response Format:**
Return a valid JSON object with this exact structure:

{
  "questions": [
    {
      "questionText": "Question 1 text",
      "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
      "correctAnswer": "A",
      "explanation": "Detailed explanation",
      "difficulty": ${passageDifficulty},
      "subSkill": "${subSkills[0] || 'Text Comprehension - Explicit'}",
      "hasVisual": false,
      "passageReference": "passage_1"
    }${questionsPerPassage > 1 ? `,
    {
      "questionText": "Question 2 text",
      "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
      "correctAnswer": "B",
      "explanation": "Detailed explanation",
      "difficulty": ${passageDifficulty},
      "subSkill": "${subSkills[1] || 'Text Comprehension - Inferential'}",
      "hasVisual": false,
      "passageReference": "passage_1"
    }` : ''}
    // ... continue for all ${questionsPerPassage} questions, each with a different subSkill
  ],
  "passageGenerated": {
    "title": "Engaging ${isPoetryPassage ? 'Poem' : 'Passage'} Title",
    "content": "Full ${isPoetryPassage ? 'poem' : 'passage'} content...",
    "passageType": "${isPoetryPassage ? 'poetry' : 'informational|narrative|argumentative'}",
    "wordCount": ${isPoetryPassage ? 200 : 400},
    "passageDifficulty": ${passageDifficulty}
  },
  "metadata": {
    "testType": "${testType}",
    "sectionName": "${sectionName || 'Reading_Comprehension'}", 
    "subSkill": "Multiple",
    "difficulty": ${passageDifficulty},
    "passageDifficulty": ${passageDifficulty},
    "generatedAt": "${new Date().toISOString()}",
    "complianceChecked": true,
    "contextApproach": "${contextApproach}",
    "questionsPerPassage": ${questionsPerPassage}
  }
}

Ensure you generate exactly ${questionsPerPassage} questions, each testing a different sub-skill from the list: ${subSkills.join(', ')}. All questions should be aligned to difficulty ${passageDifficulty}/3. The JSON must be valid and complete.`;

    const claudeResponse = await callClaudeAPIWithRetry(prompt);
    
    // Rest of the function remains the same
    // Parse the JSON response
    let parsedResponse: QuestionGenerationResponse;
    try {
      // Extract content from Claude API response structure
      let responseText: string;
      if (claudeResponse.content && Array.isArray(claudeResponse.content) && claudeResponse.content[0]?.text) {
        responseText = claudeResponse.content[0].text;
      } else if (typeof claudeResponse === 'string') {
        responseText = claudeResponse;
      } else {
        responseText = JSON.stringify(claudeResponse);
      }
      
      let cleanedResponse = responseText.trim();
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
    
    // **CRITICAL FIX**: Ensure questions have different sub-skills as intended
    for (let i = 0; i < parsedResponse.questions.length; i++) {
      const question = parsedResponse.questions[i];
      const intendedSubSkill = subSkills[i % subSkills.length];
      if (question.subSkill !== intendedSubSkill) {
        console.warn(`⚠️ Question ${i + 1} has sub-skill "${question.subSkill}", correcting to intended "${intendedSubSkill}"`);
        question.subSkill = intendedSubSkill;
      }
    }

    console.log('Successfully generated passage with multiple questions:', {
      questionsCount: parsedResponse.questions.length,
      passageTitle: parsedResponse.passageGenerated?.title,
      passageType: isPoetryPassage ? 'poetry' : parsedResponse.passageGenerated?.passageType,
      passageDifficulty: passageDifficulty,
      subSkillsCovered: parsedResponse.questions.map(q => q.subSkill),
      questionDifficulties: parsedResponse.questions.map(q => q.difficulty)
    });

    return parsedResponse;

  } catch (error) {
    console.error('Multi-question passage generation failed:', error);
    throw new Error(`Claude API passage generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Function to get passage authenticity guidance
function getPassageAuthenticityGuidance(testType: string, isPoetry: boolean): string {
  if (testType.includes('NAPLAN')) {
    return `
**NAPLAN READING ASSESSMENT AUTHENTICITY:**
- Match the exact NAPLAN reading ${isPoetry ? 'poetry' : 'passage'} presentation format
- Use the characteristic NAPLAN question stems and patterns
- Follow NAPLAN's standardized multiple-choice formatting exactly
- Maintain NAPLAN's balanced mix of explicit and inferential questions
- Use practical, Australian contexts relevant to students
- Questions should directly align with NAPLAN reading assessment framework
- Focus on clear, unambiguous language in questions and answer options
- Use vocabulary and complexity precisely calibrated to year level standards
`;
  } else if (testType.includes('Selective')) {
    return `
**SELECTIVE ENTRY READING ASSESSMENT AUTHENTICITY:**
- Match the distinctive selective schools ${isPoetry ? 'poetry' : 'passage'} structure and length
- Use the more sophisticated vocabulary characteristic of selective tests
- Follow selective entry question patterns that require deeper analysis
- Include the multi-step reasoning typically found in selective tests
- Create questions that effectively differentiate higher-ability students
- Balance literal comprehension with advanced inferential reasoning
- Use the precise, formal language style typical of selective entry tests
- Ensure complexity appropriately challenges academically advanced students
`;
  } else if (testType.includes('ACER')) {
    return `
**ACER READING ASSESSMENT AUTHENTICITY:**
- Match ACER's distinctive ${isPoetry ? 'poetry' : 'passage'} presentation format
- Use ACER's characteristic question stems and analytical focus
- Follow ACER's progressive difficulty pattern within question sets
- Include questions that assess deeper comprehension and critical thinking
- Maintain ACER's precise, clear language in all questions
- Use ACER's balanced mix of concrete and abstract reasoning requirements
- Create questions that assess underlying reading aptitude
- Match ACER's approach to vocabulary and language sophistication
`;
  } else if (testType.includes('EduTest')) {
    return `
**EDUTEST READING ASSESSMENT AUTHENTICITY:**
- Match EduTest's ${isPoetry ? 'poetry' : 'passage'} length and formatting conventions
- Use EduTest's characteristic question patterns and complexity
- Follow EduTest's balance between knowledge and reasoning
- Include appropriate EduTest-style vocabulary and language complexity
- Create the mix of comprehension types typical in EduTest materials
- Maintain EduTest's clear but challenging question structures
- Ensure questions mirror EduTest's approach to reading assessment
- Balance direct recall with analytical and inferential questions
`;
  } else {
    return `
**READING ASSESSMENT AUTHENTICITY:**
- Match typical standardized test ${isPoetry ? 'poetry' : 'passage'} presentation
- Use question patterns typical for formal reading assessments
- Create appropriate balance of question types and complexity
- Maintain clear, precise language in questions and options
- Ensure content and questions are calibrated to year level standards
`;
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
      // Distribute sub-skills across passages
      const passageSubSkills = allSubSkills.slice(
        (i * 2) % allSubSkills.length, 
        ((i * 2) + questionsPerPassage) % allSubSkills.length || questionsPerPassage
      );
      
      // Ensure we have enough sub-skills, cycle through if needed
      while (passageSubSkills.length < questionsPerPassage) {
        passageSubSkills.push(allSubSkills[passageSubSkills.length % allSubSkills.length]);
      }
      
      // Assign passage difficulty - cycle through 1, 2, 3 for variety
      const passageDifficulty = (i % 3) + 1;
      
      const yearLevel = testType.includes('Year 5') ? 'Year 5' : 
                        testType.includes('Year 7') ? 'Year 7' :
                        testType.includes('Year 6') ? 'Year 6' : 
                        testType.includes('Year 9') ? 'Year 9' : 'Year 8';
      
      const passageResponse = await generatePassageWithMultipleQuestions(
        testType,
        yearLevel,
        passageSubSkills.slice(0, questionsPerPassage),
        passageDifficulty,
        passageSubSkills.length,
        'Reading_Comprehension'  // Add the sectionName parameter
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
async function generateVisualDataForQuestion(subSkill: string, questionContext: string, difficulty: number): Promise<VisualSpecification | undefined> {
  return await generateEducationalVisualSpec(subSkill, questionContext, difficulty, 'generic', '9');
}

// Helper function to check if sub-skill requires visuals
function isSubSkillVisualRequired(subSkill: string): boolean {
  return isVisualRequired(subSkill);
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
      const targetQuestionCount = parseQuestionCount((sectionConfig as SectionConfig).questions);
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
            questions: existing,
            questionCount: existing.length
          });
          totalQuestions += existing.length;
          continue; // proceed to next section
        }
      } catch (resumeErr) {
        console.warn(`Resume check failed for ${sectionName}:`, resumeErr);
      }

      console.log(`Generating section: ${sectionName} with ${subSkills.length} sub-skills (${targetQuestionCount} questions)`);

      // 🔥 CRITICAL FIX: Only generate passages for reading-related sections
      const isReadingSection = sectionName.toLowerCase().includes('reading') || 
                              sectionName === 'Reading_Comprehension' ||
                              sectionName === 'Reading Comprehension';

      if (isReadingSection) {
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

          // 🔥 CRITICAL FIX: Properly cycle through DIFFERENT sub-skills for each question
          const passageSubSkills = [];
          for (let q = 0; q < questionsForThisPassage; q++) {
            const subSkillIndex = ((i * questionsPerPassage) + q) % subSkills.length;
            passageSubSkills.push(subSkills[subSkillIndex]);
          }

          // Ensure we have unique sub-skills in each passage (no repetition)
          const uniquePassageSubSkills = [];
          const usedSubSkills = new Set();
          for (const skill of passageSubSkills) {
            if (!usedSubSkills.has(skill)) {
              uniquePassageSubSkills.push(skill);
              usedSubSkills.add(skill);
            }
          }
          
          // If we don't have enough unique skills, fill with remaining ones
          while (uniquePassageSubSkills.length < questionsForThisPassage) {
            const remainingSkills = subSkills.filter(skill => !usedSubSkills.has(skill));
            if (remainingSkills.length > 0) {
              const nextSkill = remainingSkills[0];
              uniquePassageSubSkills.push(nextSkill);
              usedSubSkills.add(nextSkill);
            } else {
              // If we've used all skills, start cycling again but avoid immediate repetition
              const differentSkill = subSkills.find(skill => skill !== uniquePassageSubSkills[uniquePassageSubSkills.length - 1]);
              uniquePassageSubSkills.push(differentSkill || subSkills[0]);
              break;
            }
          }

          // Assign passage difficulty - cycle through difficulties (1, 2, 3, 1, 2, 3, ...)
          const passageDifficulty = (i % 3) + 1;

          const yearLevel = testType.includes('Year 5') ? 'Year 5' : 
                            testType.includes('Year 7') ? 'Year 7' :
                            testType.includes('Year 6') ? 'Year 6' : 
                            testType.includes('Year 9') ? 'Year 9' : 'Year 8';

          console.log(`  📖 Passage ${i + 1}: Using sub-skills [${uniquePassageSubSkills.join(', ')}], difficulty ${passageDifficulty}`);

          const passageResponse = await generatePassageWithMultipleQuestions(
            testType,
            yearLevel,
            uniquePassageSubSkills.slice(0, questionsForThisPassage),
            passageDifficulty,
            questionsForThisPassage,
            sectionName  // 🔥 Use exact section name from curriculumData
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

      } else if (sectionName === 'Written Expression' || sectionName === 'Writing') {
        // Writing section - generate exact number specified (usually 1-2 tasks)
        console.log(`📝 Generating ${targetQuestionCount} writing task(s) for ${sectionName}`);
        
        const writingSubSkills = getSubSkillsForSection(sectionName, testType);
        const difficulties = getAllDifficultyLevels();
        const allQuestions = [];
        
        // Distribute writing tasks across available sub-skills and difficulties
        for (let i = 0; i < targetQuestionCount; i++) {
          const subSkill = writingSubSkills[i % writingSubSkills.length];
          const difficulty = difficulties[i % difficulties.length];
          
          const writingRequest: QuestionGenerationRequest = {
            testType,
            yearLevel: testType.includes('Year 5') ? 'Year 5' : 
                      testType.includes('Year 7') ? 'Year 7' :
                      testType.includes('Year 6') ? 'Year 6' : 
                      testType.includes('Year 9') ? 'Year 9' : 'Year 8',
            sectionName,
            subSkill,
            difficulty,
            questionCount: 1, // One writing task at a time
            testMode
          };

          const writingResponse = await generateQuestions(writingRequest);
          await saveGeneratedQuestions(writingResponse, undefined, testMode);
          allQuestions.push(...writingResponse.questions);

          // Add delay between writing task generations
          if (i < targetQuestionCount - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
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
        // 🔥 CRITICAL FIX: Non-reading sections (Mathematics, Verbal Reasoning, etc.) - NO PASSAGES
        const yearLevel = testType.includes('Year 5') ? 'Year 5' : 
                          testType.includes('Year 7') ? 'Year 7' :
                          testType.includes('Year 6') ? 'Year 6' : 
                          testType.includes('Year 9') ? 'Year 9' : 'Year 8';

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
          // Ensure each sub-skill has a balanced mix of difficulty levels (1, 2, 3)
          const difficulties = distributeDifficulties(questionsForThisSubSkill);
          
          // Count questions per difficulty level for logging
          const difficultyCount = difficulties.reduce((acc, diff) => {
            acc[diff] = (acc[diff] || 0) + 1;
            return acc;
          }, {} as Record<number, number>);
          
          console.log(`     Difficulty distribution: Level 1: ${difficultyCount[1] || 0}, Level 2: ${difficultyCount[2] || 0}, Level 3: ${difficultyCount[3] || 0}`);
          
          // Generate questions for each difficulty level separately to ensure balanced distribution
          for (let difficulty = 1; difficulty <= 3; difficulty++) {
            const questionsWithThisDifficulty = difficulties.filter(d => d === difficulty).length;
            
            if (questionsWithThisDifficulty > 0) {
              const request: QuestionGenerationRequest = {
                testType,
                yearLevel,
                sectionName, // 🔥 Use exact section name from curriculumData
                subSkill,
                difficulty,
                questionCount: questionsWithThisDifficulty,
                testMode
              };
              
              console.log(`     Generating ${questionsWithThisDifficulty} questions with difficulty ${difficulty} for ${subSkill}`);
              
              const response = await generateQuestions(request);
              await saveGeneratedQuestions(response, undefined, testMode);
              allQuestions.push(...response.questions);
              
              // Rate limiting between requests
              await new Promise(resolve => setTimeout(resolve, 500));
            }
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
      const subSkills = getSubSkillsForSection(sectionName, testType);
      if (subSkills.length === 0) continue;

      console.log(`Generating diagnostic section: ${sectionName}`);

      // 🔥 CRITICAL FIX: Only generate passages for reading-related sections
      const isReadingSection = sectionName.toLowerCase().includes('reading') || 
                              sectionName === 'Reading_Comprehension' ||
                              sectionName === 'Reading Comprehension';

      if (isReadingSection) {
        // Reading: Each sub-skill tested at each difficulty (1-3) with 3-4 questions per passage
        const questionsPerPassage = 4;
        const totalDiagnosticQuestions = subSkills.length * 3; // 3 difficulties per sub-skill
        const passageCount = Math.ceil(totalDiagnosticQuestions / questionsPerPassage);
        
        const passages = [];
        const allQuestions = [];

        for (let i = 0; i < passageCount; i++) {
          const questionsInThisPassage = Math.min(questionsPerPassage, totalDiagnosticQuestions - (i * questionsPerPassage));
          
          // 🔥 CRITICAL FIX: Properly cycle through DIFFERENT sub-skills for each question
          const passageSubSkills = [];
          for (let q = 0; q < questionsInThisPassage; q++) {
            const subSkillIndex = ((i * questionsPerPassage) + q) % subSkills.length;
            passageSubSkills.push(subSkills[subSkillIndex]);
          }

          // Ensure we have unique sub-skills in each passage (no repetition)
          const uniquePassageSubSkills = [];
          const usedSubSkills = new Set();
          for (const skill of passageSubSkills) {
            if (!usedSubSkills.has(skill)) {
              uniquePassageSubSkills.push(skill);
              usedSubSkills.add(skill);
            }
          }
          
          // If we don't have enough unique skills, fill with remaining ones
          while (uniquePassageSubSkills.length < questionsInThisPassage) {
            const remainingSkills = subSkills.filter(skill => !usedSubSkills.has(skill));
            if (remainingSkills.length > 0) {
              const nextSkill = remainingSkills[0];
              uniquePassageSubSkills.push(nextSkill);
              usedSubSkills.add(nextSkill);
            } else {
              // If we've used all skills, start cycling again but avoid immediate repetition
              const differentSkill = subSkills.find(skill => skill !== uniquePassageSubSkills[uniquePassageSubSkills.length - 1]);
              uniquePassageSubSkills.push(differentSkill || subSkills[0]);
              break;
            }
          }

          // Assign passage difficulty - cycle through difficulties (1, 2, 3, 1, 2, 3, ...)
          const passageDifficulty = (i % 3) + 1;

          const yearLevel = testType.includes('Year 5') ? 'Year 5' : 
                            testType.includes('Year 7') ? 'Year 7' :
                            testType.includes('Year 6') ? 'Year 6' : 
                            testType.includes('Year 9') ? 'Year 9' : 'Year 8';

          const passageResponse = await generatePassageWithMultipleQuestions(
            testType,
            yearLevel,
            uniquePassageSubSkills,
            passageDifficulty,
            uniquePassageSubSkills.length,
            sectionName  // 🔥 Use exact section name from curriculumData
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

      } else if (sectionName === 'Written Expression' || sectionName === 'Writing') {
        // Writing: Just one diagnostic task
        const yearLevel = testType.includes('Year 5') ? 'Year 5' : 
                          testType.includes('Year 7') ? 'Year 7' :
                          testType.includes('Year 6') ? 'Year 6' : 
                          testType.includes('Year 9') ? 'Year 9' : 'Year 8';

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
        // 🔥 CRITICAL FIX: Non-reading sections - NO PASSAGES
        const yearLevel = testType.includes('Year 5') ? 'Year 5' : 
                          testType.includes('Year 7') ? 'Year 7' :
                          testType.includes('Year 6') ? 'Year 6' : 
                          testType.includes('Year 9') ? 'Year 9' : 'Year 8';

        const allQuestions = [];

        for (const subSkill of subSkills) {
          for (let difficulty = 1; difficulty <= 3; difficulty++) {
            const request: QuestionGenerationRequest = {
              testType,
              yearLevel,
              sectionName, // 🔥 Use exact section name from curriculumData
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
            
            // Assign passage difficulty based on the question index
            const passageDifficulty = Math.floor((p * questionsPerPassage) / 10) + 1; // 10 questions per difficulty

            const yearLevel = testType.includes('Year 5') ? 'Year 5' : 
                              testType.includes('Year 7') ? 'Year 7' :
                              testType.includes('Year 6') ? 'Year 6' : 
                              testType.includes('Year 9') ? 'Year 9' : 'Year 8';

            const passageResponse = await generatePassageWithMultipleQuestions(
              testType,
              yearLevel,
              passageSubSkills,
              Math.min(passageDifficulty, 3),
              questionsInThisPassage,
              sectionName  // Add the sectionName parameter
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

      } else if (sectionName === 'Written Expression' || sectionName === 'Writing') {
        // Writing drills: 2 prompts per sub-skill (4 total for VIC Selective Entry)
        const yearLevel = testType.includes('Year 5') ? 'Year 5' : 
                          testType.includes('Year 7') ? 'Year 7' :
                          testType.includes('Year 6') ? 'Year 6' : 
                          testType.includes('Year 9') ? 'Year 9' : 'Year 8';

        const allQuestions = [];

        for (const subSkill of subSkills) {
          const writingRequest: QuestionGenerationRequest = {
            testType,
            yearLevel,
            sectionName,
            subSkill,
            difficulty: 2, // Standard difficulty for writing prompts
            questionCount: 2, // 2 prompts per sub-skill
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
                          testType.includes('Year 6') ? 'Year 6' : 
                          testType.includes('Year 9') ? 'Year 9' : 'Year 8';

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

// Claude API response structure
interface ClaudeAPIResponse {
  content?: Array<{ text: string }>;
  [key: string]: unknown;
}

// Direct Claude API call function
async function callClaudeAPI(prompt: string): Promise<ClaudeAPIResponse> {
  if (!CLAUDE_API_KEY) {
    throw new Error('Claude API key is not configured');
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
      max_tokens: 8000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
  }

  return await response.json() as ClaudeAPIResponse;
}

// Enhanced Claude API wrapper with built-in exponential back-off / retry
async function callClaudeAPIWithRetry(
  prompt: string,
  retries: number = 4,
  baseDelayMs: number = 2000
): Promise<ClaudeAPIResponse> {
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
  const difficultyLabels = ['', 'Below Average', 'Average', 'Above Average'];
  const currentLabel = difficultyLabels[difficulty] || 'Average';
  
  if (testType.includes('NAPLAN')) {
    return `NAPLAN ${currentLabel} (${difficulty}/3):
${difficulty === 1 ? '- **SIMPLER**: Direct, straightforward questions with minimal steps\n- Clear context clues and familiar vocabulary\n- Single-concept application with obvious solution paths\n- Requires basic recall and simple application of learned concepts' : 
  difficulty === 2 ? '- **STANDARD**: Typical NAPLAN complexity representing grade-level expectations\n- May require 1-2 step reasoning or connecting related concepts\n- Standard academic vocabulary appropriate for year level\n- Balanced mix of recall, application, and light analysis' : 
  '- **MORE COMPLEX**: Multi-step reasoning requiring deeper understanding\n- Less obvious solution paths requiring strategic thinking\n- Advanced vocabulary and more sophisticated contexts\n- Requires synthesis of multiple concepts or extended analysis'}`;
  }
  
  if (testType.includes('ACER')) {
    return `ACER ${currentLabel} (${difficulty}/3):
${difficulty === 1 ? '- **CLEARER PATTERNS**: More obvious logical connections and relationships\n- Straightforward pattern recognition with clear visual cues\n- Direct application of reasoning principles\n- Simpler abstract concepts with concrete examples' : 
  difficulty === 2 ? '- **TYPICAL ACER**: Standard reasoning complexity expected for this test\n- Moderate pattern complexity requiring focused analysis\n- Balanced abstract and concrete thinking demands\n- Representative of average ACER question sophistication' : 
  '- **ADVANCED REASONING**: Complex multi-layered logical relationships\n- Subtle patterns requiring sophisticated analysis\n- High-level abstract thinking with minimal concrete support\n- Challenges that distinguish top-performing students'}`;
  }
  
  if (testType.includes('EduTest')) {
    return `EduTest ${currentLabel} (${difficulty}/3):
${difficulty === 1 ? '- **MORE GUIDED**: Clear reasoning structure with supportive context\n- Direct application of analytical skills with obvious pathways\n- Accessible complex thinking with helpful scaffolding\n- Single-focus problems with clear solution approaches' : 
  difficulty === 2 ? '- **STANDARD EDUTEST**: Typical multi-concept integration expected\n- Moderate inference and critical analysis requirements\n- Balanced complexity representing EduTest norms\n- Standard academic reasoning appropriate for selective preparation' : 
  '- **HIGHLY SOPHISTICATED**: Advanced synthesis requiring multiple reasoning strategies\n- Complex critical thinking with minimal guidance\n- Multi-layered problems requiring strategic problem-solving\n- Designed to challenge academically exceptional students'}`;
  }
  
  if (testType.includes('Selective')) {
    return `Selective Entry ${currentLabel} (${difficulty}/3):
${difficulty === 1 ? '- **ACCESSIBLE ADVANCED**: Sophisticated content presented clearly\n- Advanced vocabulary with sufficient context support\n- Complex thinking with more transparent reasoning paths\n- Challenging but achievable for well-prepared students' : 
  difficulty === 2 ? '- **TYPICAL SELECTIVE**: Standard selective-level cognitive demands\n- High-level analysis representing expected selective complexity\n- Sophisticated reasoning characteristic of these assessments\n- Benchmark difficulty for selective entry preparation' : 
  '- **EXCEPTIONALLY DEMANDING**: Elite-level analytical and critical thinking\n- Highly complex multi-concept integration with minimal support\n- Advanced reasoning designed to identify top 1-3% of students\n- Maximum cognitive complexity within selective entry standards'}`;
  }
  
  return `${testType} ${currentLabel} (${difficulty}/3):
${difficulty === 1 ? '- **BELOW AVERAGE**: Clearer, more direct questions within this test type\n- Simpler cognitive demands relative to test standards\n- More obvious solution paths and supportive context\n- Accessible entry point while maintaining test authenticity' : 
  difficulty === 2 ? '- **AVERAGE BASELINE**: Represents typical difficulty for this test type\n- Standard cognitive complexity expected for this assessment\n- Balanced challenge appropriate for target student population\n- Authentic representation of test difficulty norms' : 
  '- **ABOVE AVERAGE**: More challenging within this test type\'s scope\n- Increased cognitive complexity and reasoning demands\n- Less obvious solution approaches requiring deeper analysis\n- Designed to differentiate stronger performers within test standards'}`;
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

    const targetQuestionCount = parseQuestionCount((sectionConfig as SectionConfig).questions);
    
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

// Remove the specialized visual generation functions
// Removed old synchronous generateEducationalVisualSpec function - now using async version


// New dynamic visual specification generator that creates practical specs for Claude web app
async function generateDynamicVisualSpec(
  subSkill: string, 
  questionContext: string, 
  difficulty: number, 
  testType: string,
  yearLevel: string,
  dimensions: { width: number; height: number },
  questionText?: string
): Promise<VisualSpecification> {
  // Determine the most appropriate visual type
  const visualType = determineAppropriateVisualType(subSkill, questionContext, testType, extractSectionFromContext(testType, subSkill));
  
  // Create a concise title
  const title = `${testType} ${subSkill} Visual`;
  
  // Create specific description for Claude web app generation
  const description = generateVisualDescription(visualType, subSkill, questionContext, difficulty, testType, yearLevel, questionText);
  
  // Generate specific elements based on visual type
  const elements = generateVisualElements(visualType, testType);
  
  // Define styling based on test type and visual type
  const styling = generateVisualStyling(testType, visualType);
  
  // Generate any data needed for the visual
  const data = questionText 
    ? await generateQuestionSpecificVisualData(visualType, subSkill, questionText, difficulty, testType, yearLevel)
    : generateFallbackVisualData(visualType, subSkill, questionContext, difficulty);
  
  // Define key requirements
  const requirements = [
    `Must be ${dimensions.width}×${dimensions.height}px`,
    `Clean, professional test paper appearance`,
    `Use UK spelling in all text labels`,
    `Appropriate for ${yearLevel} students`,
    `Match ${testType} visual standards`,
    'No decorative elements'
  ];
  
  return {
    title,
    description,
    visual_type: visualType,
    dimensions,
    elements,
    styling,
    data,
    requirements
  };
}

// Generate specific description for Claude web app
function generateVisualDescription(
  visualType: VisualType,
  subSkill: string,
  questionContext: string,
  difficulty: number,
  testType: string,
  yearLevel: string,
  questionText?: string
): string {
  const baseContext = questionText || questionContext;
  
  switch (visualType) {
    case 'bar_chart':
      return `Create a clean bar chart for ${testType} assessment. Display data clearly with labeled axes, appropriate scale, and professional styling. Include title and legend if needed. All text must use UK spelling. Chart should support ${subSkill} question analysis at difficulty level ${difficulty}.`;
      
    case 'line_graph':
      return `Create a line graph for ${testType} assessment. Show clear data trends with labeled axes, grid lines, and professional styling. Include title and legend. All text must use UK spelling. Graph should enable ${subSkill} analysis at difficulty level ${difficulty}.`;
      
    case 'pie_chart':
      return `Create a pie chart for ${testType} assessment. Display percentages clearly with labeled segments, legend, and professional styling. All text must use UK spelling. Chart should facilitate ${subSkill} analysis at difficulty level ${difficulty}.`;
      
    case 'geometric_grid_diagram':
      return `Create a geometric diagram on grid for ${testType} assessment. Show shapes, measurements, and coordinates clearly. Include ruler markings and labels as needed. All text must use UK spelling. Diagram should support ${subSkill} problem-solving at difficulty level ${difficulty}.`;
      
    case 'coordinate_plane':
      return `Create a coordinate plane for ${testType} assessment. Include numbered axes, grid lines, and any plotted points or lines. Label axes clearly. All text must use UK spelling. Plane should enable ${subSkill} work at difficulty level ${difficulty}.`;
      
    case 'pattern_sequence':
      return `Create a pattern sequence visual for ${testType} assessment. Show clear pattern progression with consistent styling. Include numbered positions if needed. All text must use UK spelling. Pattern should test ${subSkill} at difficulty level ${difficulty}.`;
      
    case 'measurement_diagram':
      return `Create a measurement diagram for ${testType} assessment. Show clear measurements, units, and labels. Include ruler or measuring tools as appropriate. All text must use UK spelling. Diagram should support ${subSkill} at difficulty level ${difficulty}.`;
      
    case 'technical_drawing':
      return `Create a technical diagram for ${testType} assessment. Show clear technical details with precise labeling and professional styling. All text must use UK spelling. Drawing should facilitate ${subSkill} analysis at difficulty level ${difficulty}.`;
      
    case 'statistical_display':
      return `Create a statistical display for ${testType} assessment. Present data clearly with appropriate charts, tables, or graphs. Include clear labels and legends. All text must use UK spelling. Display should enable ${subSkill} analysis at difficulty level ${difficulty}.`;
      
    default:
      return `Create a clean educational visual for ${testType} ${subSkill} assessment. Professional styling appropriate for ${yearLevel} students. All text must use UK spelling. Visual should support question analysis at difficulty level ${difficulty}.`;
  }
}

// Generate visual elements based on type
function generateVisualElements(visualType: VisualType, testType: string): { [key: string]: VisualElement } {
  // Get consistent styling for this test type and visual
  const styling = generateVisualStyling(testType, visualType);
  
  // Determine primary and secondary colors based on styling theme
  const primaryColor = styling.theme === 'professional_monochrome' ? '#404040' : styling.colors[0];
  const secondaryColor = styling.theme === 'professional_monochrome' ? '#cccccc' : styling.colors[1];
  const backgroundColor = styling.background;

  const elements: { [key: string]: VisualElement } = {};

  switch (visualType) {
    case 'bar_chart':
      elements.chart_area = {
        type: 'rectangle',
        properties: { width: '80%', height: '70%' },
        position: { x: 60, y: 40 },
        styling: { background: backgroundColor, border: `1px solid ${secondaryColor}` }
      };
      elements.x_axis = {
        type: 'line',
        properties: { labels: true, ticks: true },
        styling: { color: primaryColor, fontSize: '12px' }
      };
      elements.y_axis = {
        type: 'line', 
        properties: { labels: true, ticks: true, scale: 'auto' },
        styling: { color: primaryColor, fontSize: '12px' }
      };
      break;

    case 'line_graph':
      elements.graph_area = {
        type: 'rectangle',
        properties: { width: '80%', height: '70%' },
        position: { x: 60, y: 40 },
        styling: { background: backgroundColor, border: `1px solid ${secondaryColor}` }
      };
      elements.grid = {
        type: 'grid',
        properties: { spacing: 20 },
        styling: { color: styling.colors[styling.colors.length - 1], strokeWidth: 1 }
      };
      break;
       
    case 'geometric_grid_diagram':
      elements.grid = {
        type: 'grid',
        properties: { spacing: 20, showNumbers: true },
        styling: { color: styling.colors[styling.colors.length - 1], strokeWidth: 1 }
      };
      elements.shapes = {
        type: 'geometric_shapes',
        properties: { 
          fillColor: styling.theme === 'professional_monochrome' ? '#f5f5f5' : styling.colors[styling.colors.length - 1],
          strokeColor: primaryColor 
        },
        styling: { strokeWidth: 2 }
      };
      break;
       
    case 'coordinate_plane':
      elements.x_axis = {
        type: 'axis',
        properties: { range: [-10, 10], step: 1 },
        styling: { color: primaryColor, strokeWidth: 2 }
      };
      elements.y_axis = {
        type: 'axis', 
        properties: { range: [-10, 10], step: 1 },
        styling: { color: primaryColor, strokeWidth: 2 }
      };
      elements.grid = {
        type: 'grid',
        properties: { spacing: 20 },
        styling: { color: styling.colors[styling.colors.length - 1], strokeWidth: 1 }
      };
      break;

    case 'pie_chart':
      elements.chart_area = {
        type: 'circle',
        properties: { width: '60%', height: '60%' },
        position: { x: 100, y: 60 },
        styling: { background: backgroundColor, border: `1px solid ${primaryColor}` }
      };
      elements.legend = {
        type: 'legend',
        properties: { labels: true },
        styling: { color: primaryColor, fontSize: '11px' }
      };
      break;

    case 'technical_drawing':
      elements.drawing_area = {
        type: 'rectangle',
        properties: { width: '90%', height: '80%' },
        position: { x: 20, y: 30 },
        styling: { background: backgroundColor, border: `1px solid ${primaryColor}` }
      };
      elements.measurements = {
        type: 'text',
        properties: { labels: true },
        styling: { color: primaryColor, fontSize: '10px' }
      };
      break;

    default:
      elements.container = {
        type: 'container',
        properties: { width: '100%', height: '100%' },
        styling: { background: backgroundColor, border: `1px solid ${secondaryColor}` }
      };
   }
   
   return elements;
}

// Generate visual styling
function generateVisualStyling(testType: string, visualType: VisualType): {
  colors: string[];
  fonts?: string[];
  background: string;
  theme: string;
} {
  // For spatial reasoning and geometric questions, use professional monochrome
  const isSpatialGeometric = visualType === 'geometric_grid_diagram' || 
                            visualType === 'coordinate_plane' || 
                            visualType === 'measurement_diagram' ||
                            visualType === 'technical_drawing';
  
  // Professional monochrome for spatial/geometric questions
  if (isSpatialGeometric) {
    return {
      colors: ['#000000', '#404040', '#808080', '#cccccc'], // Black to light grey progression
      fonts: ['Arial', 'sans-serif'],
      background: 'white',
      theme: 'professional_monochrome'
    };
  }
  
  // Test-specific color schemes for data visualization
  const testColors = {
    'NAPLAN': {
      colors: ['#0066cc', '#ff6b35', '#4CAF50', '#FF9800'],
      theme: 'educational_bright'
    },
    'Selective': {
      colors: ['#1976D2', '#388E3C', '#F57C00', '#7B1FA2'],
      theme: 'selective_professional'
    },
    'ACER': {
      colors: ['#2196F3', '#4CAF50', '#FF9800', '#E91E63'],
      theme: 'acer_standard'
    },
    'EduTest': {
      colors: ['#3F51B5', '#009688', '#FFC107', '#9C27B0'],
      theme: 'edutest_modern'
    }
  };
  
  let selectedColors = ['#0066cc', '#ff6b35', '#4CAF50', '#FF9800']; // Default
  let selectedTheme = 'clean_educational';
  
  for (const [key, value] of Object.entries(testColors)) {
    if (testType.includes(key)) {
      selectedColors = value.colors;
      selectedTheme = value.theme;
      break;
    }
  }
  
  return {
    colors: selectedColors,
    fonts: ['Arial', 'sans-serif'],
    background: 'white',
    theme: selectedTheme
  };
}

// Generate visual data based on type
function generateVisualData(
  visualType: VisualType,
  subSkill: string,
  questionContext: string,
  difficulty: number
): Record<string, unknown> {
  switch (visualType) {
    case 'bar_chart':
      return {
        categories: ['Category A', 'Category B', 'Category C', 'Category D'],
        values: [25, 40, 30, 35],
        title: 'Data Chart',
        xLabel: 'Categories',
        yLabel: 'Values'
      };
      
    case 'line_graph':
      return {
        points: [[0, 10], [1, 15], [2, 12], [3, 20], [4, 18]],
        title: 'Trend Graph',
        xLabel: 'Time',
        yLabel: 'Value'
      };
      
    case 'pie_chart':
  return {
        segments: [
          { label: 'Section A', value: 30, color: '#0066cc' },
          { label: 'Section B', value: 25, color: '#ff6b35' },
          { label: 'Section C', value: 20, color: '#4CAF50' },
          { label: 'Section D', value: 25, color: '#FF9800' }
        ],
        title: 'Distribution Chart'
      };
      
    case 'geometric_grid_diagram':
      return {
        shapes: [
          { type: 'rectangle', x: 2, y: 2, width: 4, height: 3 },
          { type: 'circle', x: 8, y: 4, radius: 2 }
        ],
        measurements: { unit: 'cm', showGrid: true }
      };
      
    case 'coordinate_plane':
      return {
        points: [[2, 3], [-1, 4], [0, -2]],
        lines: [{ start: [-2, -2], end: [3, 3] }],
        xRange: [-5, 5],
        yRange: [-5, 5]
      };
      
    default:
      return {};
  }
}

// Full test generation request
export interface FullTestGenerationRequest {
  testType: string;
  mode: 'practice' | 'diagnostic' | 'drill';
  practiceTestNumber?: number;
}

// Full test response
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

// Add a function to get test-specific authenticity guidance
function getTestSpecificAuthenticityGuidance(testType: string, sectionName: string, subSkill: string): string {
  // Base guidance for all test types
  let guidance = `
**${testType} AUTHENTICITY GUIDANCE:**
- Create questions that match the style of official ${testType} materials
- Use question structures, vocabulary, and complexity authentic to real ${testType} assessments
- Match official ${testType} question wording patterns and formatting conventions
- Ensure questions reflect the expected cognitive demand for ${testType}
`;

  // Test-specific guidance
  if (testType.includes('NAPLAN')) {
    guidance += `
**NAPLAN-SPECIFIC AUTHENTICITY:**
- Follow ACARA's NAPLAN question format conventions exactly
- Use straightforward, clear language with precise phrasing
- For ${sectionName}, match the exact question style found in NAPLAN papers
- ${subSkill} questions should mirror official NAPLAN examples
- Include practical, real-world contexts relevant to Australian students
- Maintain the direct, unambiguous style characteristic of NAPLAN assessments
- Questions should be diagnostic of specific skills rather than tricky
`;
  } else if (testType.includes('Selective')) {
    guidance += `
**SELECTIVE ENTRY-SPECIFIC AUTHENTICITY:**
- Match the increased complexity and cognitive demand of selective schools testing
- Use the precise vocabulary level expected in selective tests
- For ${sectionName}, replicate the characteristic selective test questioning approach
- ${subSkill} questions should challenge higher-ability students while remaining fair
- Create multi-step problems requiring careful reasoning
- Maintain the sophisticated but clear style of selective entrance exams
- Questions should differentiate high-achieving students through nuanced challenges
`;
  } else if (testType.includes('ACER')) {
    guidance += `
**ACER-SPECIFIC AUTHENTICITY:**
- Replicate ACER's distinctive question structure and presentation
- Follow ACER's progressive difficulty patterns within each skill area
- For ${sectionName}, use ACER's characteristic question framing
- ${subSkill} questions should match ACER's approach to concept assessment
- Include ACER's typical abstract reasoning elements where appropriate
- Maintain the clean, precise style characteristic of ACER assessments
- Questions should assess underlying aptitude rather than just learned content
`;
  } else if (testType.includes('EduTest')) {
    guidance += `
**EDUTEST-SPECIFIC AUTHENTICITY:**
- Match EduTest's balanced approach to knowledge and reasoning
- Use vocabulary and contexts appropriate for EduTest materials
- For ${sectionName}, follow EduTest's standard question patterns
- ${subSkill} questions should mirror EduTest's specific approach
- Include EduTest's characteristic problem-solving frameworks
- Maintain the clear, structured style typical of EduTest assessments
- Questions should blend knowledge testing with reasoning skills
`;
  }
  
  return guidance;
}

// Update generateStandaloneQuestions function with enhanced prompting
export async function generateStandaloneQuestions(
  testType: string,
  yearLevel: string,
  sectionName: string,
  subSkill: string,
  difficulty: number,
  questionCount: number
): Promise<QuestionGenerationResponse> {
  try {
    const contextApproach = getContextApproach();
    const contextInstruction = getContextInstruction(contextApproach);
    const difficultyGuidance = getTestSpecificDifficultyGuidance(testType, difficulty);
    const authenticityGuidance = getTestSpecificAuthenticityGuidance(testType, sectionName, subSkill);

    // Check if this is a writing section
    const isWritingSection = sectionName === 'Written Expression' || sectionName === 'Writing' || 
                            sectionName.toLowerCase().includes('writing') || 
                            sectionName.toLowerCase().includes('written');

    // Check if visual is required for this sub-skill (not applicable for writing sections)
    const visualRequired = !isWritingSection && isSubSkillVisualRequired(subSkill);
    
    // Temporarily disable visuals for spatial problem solving to prevent token overflow
    const actualVisualRequired = subSkill === "Spatial problem solving" ? false : visualRequired;
    
    const visualInstruction = actualVisualRequired ? `
    VISUAL REQUIREMENTS:
    - This sub-skill requires a visual that should be very close / similar to what appears in real ${testType} tests
    - Visuals should be simple and clean in design
    - Only include visuals TYPICAL for this sub-skill in ${testType} tests
    - Create visuals students would EXPECT to see in a real test
    - Keep visuals free from unnecessary complexity or decoration
    - Remember difficulty ${difficulty} refers to cognitive challenge, not visual complexity
    - All text labels in visuals MUST use UK spelling (e.g., "colour", "centre", "metre")
    
    VISUAL SPECIFICATION REQUIREMENTS:
    When creating the visualSpecification object, ensure it contains:
    - title: Brief descriptive title for the visual
    - description: Clear, specific instructions for generating the visual (optimized for Claude web app)
    - visual_type: Appropriate type (bar_chart, line_graph, geometric_grid_diagram, etc.)
    - dimensions: Standard test dimensions (width: 500, height: 350)
    - elements: Specific visual components with properties and positioning
    - styling: Colors, fonts, and theme appropriate for ${testType}
    - data: Any data points, measurements, or content needed for the visual
    - requirements: Brief list of key requirements for the visual
    
    The visual specification should be detailed enough that Claude web app can generate the visual as an HTML/SVG artifact.
    ` : '';

    // Different prompts for writing vs non-writing sections
    let prompt: string;
    
    if (isWritingSection) {
      // Writing prompt generation
      prompt = `You are an expert educational assessment designer specializing in creating authentic ${testType} writing prompts. Your task is to create ${questionCount} writing prompt(s) that students would believe came directly from an official ${testType} exam paper.

**CRITICAL: USE UK SPELLING THROUGHOUT**
- Use British/UK spelling conventions for ALL content (e.g., "colour" not "color")
- Use "-ise" word endings, not "-ize" (e.g., "organise" not "organize") 
- Use UK spelling for all terms (e.g., "centre" not "center", "labelled" not "labeled")
- Double consonants in words like "travelled", "modelling", "cancelled"
- Use UK vocabulary preferences: "autumn" not "fall", "rubbish" not "trash"
- All text including prompts and instructions must use UK spelling consistently

TEST TYPE: ${testType}
SECTION: ${sectionName}
SUB-SKILL: ${subSkill}
DIFFICULTY: ${difficulty} (${difficultyGuidance})
YEAR LEVEL: ${yearLevel}

${authenticityGuidance}

${contextInstruction}

CRITICAL WRITING PROMPT REQUIREMENTS:
- Create engaging writing prompts that match the style of official ${testType} writing tasks
- Prompts should inspire creative, thoughtful, or informative writing appropriate for ${yearLevel}
- Match the exact prompt style, format, and wording patterns of official ${testType} materials
- Use vocabulary and complexity level appropriate for ${testType} at this year level
- Create prompts that students who have practiced with real ${testType} papers would recognize as authentic
- Each prompt must be completely self-contained with clear instructions
- NO multiple choice options - this is a writing/extended response task
- Include appropriate time allocations and word count guidance where typical for ${testType}
- Australian educational standards compliance
- Age-appropriate content for ${yearLevel} students

WRITING PROMPT STRUCTURE:
- Clear, engaging topic or scenario
- Specific writing instructions and requirements
- Appropriate audience and purpose guidance
- Length expectations appropriate for ${testType} and ${yearLevel}

Return ONLY a valid JSON object with this exact structure:
{
  "questions": [
    {
      "questionText": "Clear writing prompt with specific instructions and requirements",
      "options": null,
      "correctAnswer": null,
      "explanation": "Brief guidance on what makes a strong response to this prompt",
      "difficulty": ${difficulty},
      "subSkill": "${subSkill}",
      "hasVisual": false
    }
  ],
  "metadata": {
    "testType": "${testType}",
    "sectionName": "${sectionName}",
    "subSkill": "${subSkill}",
    "difficulty": ${difficulty},
    "generatedAt": "${new Date().toISOString()}",
    "complianceChecked": true
  }
}`;
    } else {
      // Multiple choice question generation (existing logic)
      prompt = `You are an expert educational assessment designer specializing in creating authentic ${testType} questions. Your task is to create ${questionCount} multiple-choice question(s) that students would believe came directly from an official ${testType} exam paper.

**CRITICAL: USE UK SPELLING THROUGHOUT**
- Use British/UK spelling conventions for ALL content (e.g., "colour" not "color")
- Use "-ise" word endings, not "-ize" (e.g., "organise" not "organize") 
- Use UK spelling for all terms (e.g., "centre" not "center", "labelled" not "labeled")
- Double consonants in words like "travelled", "modelling", "cancelled"
- Use UK vocabulary preferences: "autumn" not "fall", "rubbish" not "trash"
- All text including questions, options, explanations, and visuals must use UK spelling consistently

TEST TYPE: ${testType}
SECTION: ${sectionName}
SUB-SKILL: ${subSkill}
DIFFICULTY: ${difficulty} (${difficultyGuidance})
YEAR LEVEL: ${yearLevel}
VISUAL REQUIRED: ${actualVisualRequired}

${authenticityGuidance}

${visualInstruction}

${contextInstruction}

CRITICAL AUTHENTICITY REQUIREMENTS:
- Questions should match the style of official ${testType} questions
- Match the exact question style, format, and wording patterns of official ${testType} materials
- Use vocabulary and complexity level appropriate for ${testType} at this year level
- Create questions that students who have practiced with real ${testType} papers would recognize as authentic
- NO PASSAGES - Questions must be completely self-contained
- Do NOT use phrases like "based on the passage", "according to the text", "the passage mentions", etc.
- Each question must contain ALL necessary information
- Exactly 4 multiple choice options (A, B, C, D)
- One clearly correct answer
- **Keep explanations BRIEF (1-2 sentences maximum)** - Do NOT write lengthy explanations
- **Do NOT include quotes or complex punctuation in explanations**
- Australian educational standards compliance
- Age-appropriate content for ${yearLevel} students
${actualVisualRequired ? '- Include authentic test-appropriate visual matching real test standards' : ''}
${subSkill === "Spatial problem solving" ? '- DO NOT include any visualSpecification object - questions must be purely text-based' : ''}

Return ONLY a valid JSON object with this exact structure:
{
  "questions": [
    {
      "questionText": "Self-contained question with all necessary information",
      "options": ["A) First option", "B) Second option", "C) Third option", "D) Fourth option"],
      "correctAnswer": "A",
      "explanation": "Brief explanation of why A is correct",
      "difficulty": ${difficulty},
      "subSkill": "${subSkill}",
      "hasVisual": ${actualVisualRequired}${subSkill === "Spatial problem solving" ? '' : actualVisualRequired ? ',\n      "visualSpecification": { /* visual spec here */ }' : ''}
    }
  ],
  "metadata": {
    "testType": "${testType}",
    "sectionName": "${sectionName}",
    "subSkill": "${subSkill}",
    "difficulty": ${difficulty},
    "generatedAt": "${new Date().toISOString()}",
    "complianceChecked": true
  }
}`;
    }

    console.log(`🤖 Sending ${isWritingSection ? 'writing prompt' : 'standalone question'} prompt to Claude API...`);
    const response = await callClaudeAPIWithRetry(prompt);

    // Rest of the function remains the same...
    if (!response) {
      throw new Error('No response from Claude API');
    }

    let parsedResponse;
    try {
      const content = response.content?.[0]?.text || (response as unknown as string);
      let jsonMatch = typeof content === 'string' ? content.match(/\{[\s\S]*\}/) : null;
      
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      let jsonString = jsonMatch[0];
      
      // Try to parse the JSON, but if it fails due to malformed content (like embedded quotes),
      // attempt to fix common issues
      try {
        parsedResponse = JSON.parse(jsonString);
      } catch (firstParseError) {
        console.warn('🔧 Initial JSON parse failed, attempting to fix malformed JSON...');
        
        // Common fix: if the explanation field contains unescaped quotes, try to fix them
        // This is a simplified fix for the most common case
        const fixedJsonString = jsonString.replace(
          /"explanation":\s*"([^"]*(?:"[^"]*)*[^"]*)"/g, 
          (match, explanation) => {
            // If the explanation contains quotes, escape them properly
            const escapedExplanation = explanation
              .replace(/\\"/g, '\\"')  // Keep already escaped quotes
              .replace(/(?<!\\)"/g, '\\"'); // Escape unescaped quotes
            return `"explanation": "${escapedExplanation}"`;
          }
        );
        
        try {
          parsedResponse = JSON.parse(fixedJsonString);
          console.log('✅ Successfully fixed malformed JSON');
        } catch (secondParseError) {
          console.warn('🔧 Advanced JSON fix attempt...');
          
          // If that doesn't work, try to extract key components manually
          try {
            // Extract the essential parts using regex
            const questionTextMatch = jsonString.match(/"questionText":\s*"([^"]+(?:\\.[^"]*)*)"/);
            const optionsMatch = jsonString.match(/"options":\s*(\[[^\]]*\])/);
            const correctAnswerMatch = jsonString.match(/"correctAnswer":\s*"([^"]+)"/);
            const difficultyMatch = jsonString.match(/"difficulty":\s*(\d+)/);
            const subSkillMatch = jsonString.match(/"subSkill":\s*"([^"]+)"/);
            
            if (questionTextMatch && optionsMatch && correctAnswerMatch && difficultyMatch && subSkillMatch) {
              console.log('✅ Manually extracted question components');
              parsedResponse = {
                questions: [{
                  questionText: questionTextMatch[1].replace(/\\"/g, '"'),
                  options: JSON.parse(optionsMatch[1]),
                  correctAnswer: correctAnswerMatch[1],
                  explanation: "Explanation extracted but was malformed. This question needs manual review.",
                  difficulty: parseInt(difficultyMatch[1]),
                  subSkill: subSkillMatch[1],
                  hasVisual: false
                }],
                metadata: {
                  testType,
                  sectionName,
                  subSkill,
                  difficulty,
                  generatedAt: new Date().toISOString(),
                  complianceChecked: false // Mark as needing review
                }
              };
            } else {
              throw new Error('Could not extract essential question components');
            }
          } catch (extractionError) {
            console.error('❌ All JSON parsing attempts failed');
            console.error('Original response content:', content);
            throw new Error('Invalid JSON response from Claude API - all parsing attempts failed');
          }
        }
      }
    } catch (parseError) {
      console.error('Failed to parse Claude response:', response);
      throw new Error('Invalid JSON response from Claude API');
    }

    // Validate the response structure
    if (!parsedResponse.questions || !Array.isArray(parsedResponse.questions)) {
      throw new Error('Invalid response structure: missing questions array');
    }

    // Process each question to add visuals if needed (only for non-writing sections)
    if (!isWritingSection) {
    for (const question of parsedResponse.questions) {
      if (actualVisualRequired) {
        // Now we pass the actual question text to the visual generator
        // This ensures the visual is tailored to the specific question
        const visualSpec = await generateEducationalVisualSpec(
          subSkill, 
          `${testType} ${sectionName}`, 
          difficulty, 
          testType, 
          yearLevel,
          question.questionText // Pass the generated question text
        );
        
        if (visualSpec) {
          question.visualType = visualSpec.visual_type;
          question.visualSpecification = visualSpec;
          }
        }
      }
    }

    // 🔧 CRITICAL FIX: Ensure all questions have proper difficulty values
    parsedResponse.questions.forEach((question: any, index: number) => {
      // If difficulty is missing or invalid, assign the requested difficulty
      if (question.difficulty === undefined || question.difficulty === null || 
          typeof question.difficulty !== 'number' || 
          question.difficulty < 1 || question.difficulty > 3) {
        console.warn(`⚠️ Question ${index + 1} missing/invalid difficulty (${question.difficulty}), assigning ${difficulty}`);
        question.difficulty = difficulty;
      }
      
      // Ensure subSkill is properly assigned
      if (!question.subSkill) {
        question.subSkill = subSkill;
      }
      
      // Ensure hasVisual is boolean
      if (typeof question.hasVisual !== 'boolean') {
        question.hasVisual = actualVisualRequired || false;
      }
    });

    console.log(`✅ Successfully generated ${parsedResponse.questions.length} ${isWritingSection ? 'writing prompts' : 'standalone questions'}${!isWritingSection && actualVisualRequired ? ' (with visuals)' : ''}`);

    return {
      questions: parsedResponse.questions,
      metadata: parsedResponse.metadata
    };

  } catch (error) {
    console.error(`${sectionName.includes('Writing') ? 'Writing prompt' : 'Standalone question'} generation failed:`, error);
    throw new Error(`Claude API ${sectionName.includes('Writing') ? 'writing prompt' : 'standalone'} generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Main question generation function - chooses appropriate method based on section type
export async function generateQuestions(request: QuestionGenerationRequest): Promise<QuestionGenerationResponse> {
  const isReadingSection = request.sectionName.toLowerCase().includes('reading') || 
                          request.sectionName === 'Reading_Comprehension' ||
                          request.sectionName === 'Reading Comprehension';

  if (isReadingSection) {
    // Use passage-based generation for reading sections
    return await generatePassageWithMultipleQuestions(
      request.testType,
      request.yearLevel,
      [request.subSkill],
      request.difficulty,
      request.questionCount,
      request.sectionName
    );
  } else {
    // Use standalone generation for non-reading sections
    return await generateStandaloneQuestions(
      request.testType,
      request.yearLevel,
      request.sectionName,
      request.subSkill,
      request.difficulty,
      request.questionCount
    );
  }
}

// Save generated questions to database
export async function saveGeneratedQuestions(
  response: QuestionGenerationResponse,
  passageId?: string,
  testMode?: string
): Promise<{ questionIds: string[]; passageId?: string }> {
  const questionIds: string[] = [];
  let savedPassageId = passageId;
  
  try {
    // 🔥 CRITICAL FIX: Only save passages for reading-related sections
    const isReadingSection = response.metadata.sectionName.toLowerCase().includes('reading') || 
                             response.metadata.sectionName === 'Reading_Comprehension' ||
                             response.metadata.sectionName === 'Reading Comprehension';

    // Check if this is a writing section
    const isWritingSection = response.metadata.sectionName === 'Written Expression' || 
                            response.metadata.sectionName === 'Writing' || 
                            response.metadata.sectionName.toLowerCase().includes('writing') || 
                            response.metadata.sectionName.toLowerCase().includes('written');

    // First, save the passage if one was generated AND it's a reading section
    if (response.passageGenerated && !passageId && isReadingSection) {
      const yearLevel = response.metadata.testType.includes('Year 9') ? 9 :
                       response.metadata.testType.includes('Year 7') ? 7 : 
                       response.metadata.testType.includes('Year 5') ? 5 : 7;

      const passageData = {
        test_type: response.metadata.testType,
        year_level: yearLevel,
        section_name: response.metadata.sectionName, // 🔥 Use exact section name without normalization
        title: response.passageGenerated.title,
        content: response.passageGenerated.content,
        passage_type: response.passageGenerated.passageType,
        word_count: response.passageGenerated.wordCount,
        australian_context: true,
        created_at: new Date().toISOString()
      };

      console.log('💾 Saving passage:', {
        title: passageData.title,
        test_type: passageData.test_type,
        section_name: passageData.section_name,
        word_count: passageData.word_count
      });

      const { data: savedPassage, error: passageError } = await supabase
        .from('passages')
        .insert(passageData)
        .select('id')
        .single();

      if (passageError) {
        console.error('❌ Error saving passage to Supabase:', passageError);
        throw passageError;
      }

      if (savedPassage?.id) {
        savedPassageId = savedPassage.id;
        console.log('✅ Successfully saved passage with ID:', savedPassage.id);
      }
    } else if (response.passageGenerated && !isReadingSection) {
      console.warn(`⚠️ Skipping passage save for non-reading section: ${response.metadata.sectionName}`);
    }

    // Now save the questions with the passage_id if available (and it's a reading section)
    for (let i = 0; i < response.questions.length; i++) {
      const question = response.questions[i];
      
      const questionData = {
        test_type: response.metadata.testType,
        year_level: response.metadata.testType.includes('Year 9') ? 9 :
                   response.metadata.testType.includes('Year 7') ? 7 : 
                   response.metadata.testType.includes('Year 5') ? 5 : 7,
        section_name: response.metadata.sectionName, // 🔥 Use exact section name without normalization
        sub_skill: question.subSkill,
        difficulty: question.difficulty,
        passage_id: (isReadingSection && savedPassageId) ? savedPassageId : null, // 🔥 Only link to passage for reading sections
        question_sequence: (isReadingSection && savedPassageId) ? i + 1 : null, // 🔥 Only set sequence for reading sections
        question_text: question.questionText,
        has_visual: question.hasVisual || false,
        visual_type: question.visualType,
        visual_data: question.visualSpecification ? JSON.stringify(question.visualSpecification) : null,
        // 🔥 CRITICAL FIX: Properly set response_type based on section type
        response_type: isWritingSection ? 'extended_response' : (question.options ? 'multiple_choice' : 'extended_response'),
        // 🔥 CRITICAL FIX: Handle writing sections with null values
        answer_options: isWritingSection ? null : question.options,  
        correct_answer: isWritingSection ? null : question.correctAnswer,
        solution: isWritingSection ? question.explanation : question.explanation,
        test_mode: testMode || 'practice',
        created_at: new Date().toISOString()
      };

      console.log('💾 Attempting to save question:', {
        test_type: questionData.test_type,
        section_name: questionData.section_name, // Will now show exact name from curriculumData
        sub_skill: questionData.sub_skill,
        difficulty: questionData.difficulty,
        test_mode: questionData.test_mode,
        passage_id: questionData.passage_id,
        question_sequence: questionData.question_sequence,
        is_reading_section: isReadingSection,
        is_writing_section: isWritingSection,
        response_type: questionData.response_type
      });

      const { data, error } = await supabase
        .from('questions')
        .insert(questionData)
        .select('id')
        .single();

      if (error) {
        console.error('❌ Error saving question to Supabase:', error);
        console.error('❌ Question data that failed:', questionData);
        throw error;
      }

      if (data?.id) {
        questionIds.push(data.id);
        console.log('✅ Successfully saved question with ID:', data.id);
      } else {
        console.warn('⚠️ No ID returned from Supabase insert');
      }
    }

    console.log(`✅ Successfully saved ${questionIds.length} questions to database`);
    if (savedPassageId && isReadingSection) {
      console.log(`✅ Questions linked to passage ID: ${savedPassageId}`);
    } else if (isWritingSection) {
      console.log(`✅ Writing prompts saved as extended_response questions`);
    } else if (!isReadingSection) {
      console.log(`✅ Questions saved without passage (non-reading section: ${response.metadata.sectionName})`);
    }
    
    return { questionIds, passageId: savedPassageId };
  } catch (error) {
    console.error('❌ Error in saveGeneratedQuestions:', error);
    throw error;
  }
}

// Generate adaptive practice questions based on diagnostic results
export async function generateAdaptivePracticeQuestions(
  testType: string,
  weakSubSkills: string[],
  targetDifficulty: number = 2,
  questionCount: number = 10
): Promise<FullTestResponse> {
  try {
    console.log(`Generating adaptive practice for ${testType} with ${weakSubSkills.length} weak sub-skills...`);
    
    const testStructure = TEST_STRUCTURES[testType as keyof typeof TEST_STRUCTURES];
    if (!testStructure) {
      throw new Error(`Unknown test type: ${testType}`);
    }

    const testMode = 'practice';
    const sections = [];
    let totalQuestions = 0;

    // Group weak sub-skills by section
    const subSkillsBySection: { [section: string]: string[] } = {};
    
    for (const [sectionName] of Object.entries(testStructure)) {
      const sectionSubSkills = getSubSkillsForSection(sectionName, testType);
      const weakSkillsInSection = weakSubSkills.filter(skill => sectionSubSkills.includes(skill));
      
      if (weakSkillsInSection.length > 0) {
        subSkillsBySection[sectionName] = weakSkillsInSection;
      }
    }

    for (const [sectionName, sectionWeakSkills] of Object.entries(subSkillsBySection)) {
      console.log(`Generating adaptive practice for section: ${sectionName}`);

      // 🔥 CRITICAL FIX: Only generate passages for reading-related sections
      const isReadingSection = sectionName.toLowerCase().includes('reading') || 
                              sectionName === 'Reading_Comprehension' ||
                              sectionName === 'Reading Comprehension';

      if (isReadingSection) {
        // Reading: Generate passages with questions targeting weak sub-skills
        const questionsPerPassage = 4;
        const sectionQuestionCount = Math.min(questionCount, sectionWeakSkills.length * 3);
        const passageCount = Math.ceil(sectionQuestionCount / questionsPerPassage);
        
        const passages = [];
        const allQuestions = [];

        for (let i = 0; i < passageCount; i++) {
          const questionsInThisPassage = Math.min(questionsPerPassage, sectionQuestionCount - (i * questionsPerPassage));
          
          // 🔥 CRITICAL FIX: Properly cycle through DIFFERENT weak sub-skills for each question
          const passageSubSkills = [];
          for (let q = 0; q < questionsInThisPassage; q++) {
            const subSkillIndex = ((i * questionsPerPassage) + q) % sectionWeakSkills.length;
            passageSubSkills.push(sectionWeakSkills[subSkillIndex]);
          }

          // Ensure we have unique sub-skills in each passage (no repetition)
          const uniquePassageSubSkills = [];
          const usedSubSkills = new Set();
          for (const skill of passageSubSkills) {
            if (!usedSubSkills.has(skill)) {
              uniquePassageSubSkills.push(skill);
              usedSubSkills.add(skill);
            }
          }
          
          // If we don't have enough unique skills, fill with remaining ones
          while (uniquePassageSubSkills.length < questionsInThisPassage) {
            const remainingSkills = sectionWeakSkills.filter(skill => !usedSubSkills.has(skill));
            if (remainingSkills.length > 0) {
              const nextSkill = remainingSkills[0];
              uniquePassageSubSkills.push(nextSkill);
              usedSubSkills.add(nextSkill);
            } else {
              // If we've used all skills, start cycling again but avoid immediate repetition
              const differentSkill = sectionWeakSkills.find(skill => skill !== uniquePassageSubSkills[uniquePassageSubSkills.length - 1]);
              uniquePassageSubSkills.push(differentSkill || sectionWeakSkills[0]);
              break;
            }
          }

          const yearLevel = testType.includes('Year 5') ? 'Year 5' : 
                            testType.includes('Year 7') ? 'Year 7' :
                            testType.includes('Year 6') ? 'Year 6' : 
                            testType.includes('Year 9') ? 'Year 9' : 'Year 8';

          const passageResponse = await generatePassageWithMultipleQuestions(
            testType,
            yearLevel,
            uniquePassageSubSkills,
            targetDifficulty,
            uniquePassageSubSkills.length,
            sectionName  // 🔥 Use exact section name from curriculumData
          );

          if (passageResponse.passageGenerated) {
            const passage = {
              id: `adaptive_passage_${i + 1}`,
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

      } else {
        // 🔥 CRITICAL FIX: Non-reading sections - NO PASSAGES
        const yearLevel = testType.includes('Year 5') ? 'Year 5' : 
                          testType.includes('Year 7') ? 'Year 7' :
                          testType.includes('Year 6') ? 'Year 6' : 
                          testType.includes('Year 9') ? 'Year 9' : 'Year 8';

        const allQuestions = [];

        for (const subSkill of sectionWeakSkills) {
          const request: QuestionGenerationRequest = {
            testType,
            yearLevel,
            sectionName, // 🔥 Use exact section name from curriculumData
            subSkill,
            difficulty: targetDifficulty,
            questionCount: Math.ceil(questionCount / sectionWeakSkills.length),
            testMode
          };

          const response = await generateQuestions(request);
          await saveGeneratedQuestions(response, undefined, testMode);
          allQuestions.push(...response.questions);

          await new Promise(resolve => setTimeout(resolve, 300));
        }

        sections.push({
          sectionName,
          questions: allQuestions,
          questionCount: allQuestions.length
        });
        totalQuestions += allQuestions.length;
      }
    }

    console.log(`Successfully generated adaptive practice with ${totalQuestions} questions`);

    return {
      testId: `adaptive_practice_${testType}_${Date.now()}`,
      testType,
      mode: 'practice',
      sections,
      totalQuestions,
      metadata: {
        generatedAt: new Date().toISOString(),
        estimatedTimeMinutes: Math.ceil(totalQuestions * 1.5), // 1.5 minutes per practice question
        complianceChecked: true
      }
    };

  } catch (error) {
    console.error('Adaptive practice generation failed:', error);
    throw new Error(`Adaptive practice generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Helper to determine appropriate visual type based on sub-skill and context
function determineAppropriateVisualType(subSkill: string, questionContext: string, testType?: string, sectionName?: string): VisualType {
  // Use the new pool-based system if we have test type and section
  if (testType && sectionName) {
    const visualPool = getVisualTypePool(testType, sectionName, subSkill);
    if (visualPool.length > 0) {
      // Let Claude choose from the pool, but for now select the first appropriate one
      // This gives Claude the flexibility to choose within the pool
      return visualPool[0] as VisualType;
    }
  }

  // Fallback to original logic for backward compatibility
  if (subSkill.includes('Statistics') || subSkill.includes('Data')) {
    return questionContext.includes('bar') ? 'bar_chart' : 
          questionContext.includes('line') ? 'line_graph' : 
          questionContext.includes('pie') ? 'pie_chart' : 'statistical_display';
  } else if (subSkill.includes('Geometry') || subSkill.includes('Area') || subSkill.includes('Perimeter')) {
    return 'geometric_grid_diagram';
  } else if (subSkill.includes('Algebra') || subSkill.includes('Linear')) {
    return 'coordinate_plane';
  } else if (subSkill.includes('Pattern')) {
    return 'pattern_sequence';
  } else if (subSkill.includes('Measurement')) {
    return 'measurement_diagram';
  } else {
    return 'technical_drawing';
  }
}

// Generate question-specific visual data using Claude API
async function generateQuestionSpecificVisualData(
  visualType: VisualType,
  subSkill: string,
  questionText: string,
  difficulty: number,
  testType: string,
  yearLevel: string
): Promise<Record<string, unknown>> {
  try {
    // Get the consistent styling for this visual type and test
    const styling = generateVisualStyling(testType, visualType);
    const colorGuidance = styling.theme === 'professional_monochrome' 
      ? "COLORS: Use ONLY black (#000000), dark grey (#404040), medium grey (#808080), light grey (#cccccc), and white (#ffffff). NO other colors allowed."
      : `COLORS: Use ONLY these test-appropriate colors: ${styling.colors.join(', ')}. Background: ${styling.background}.`;

    const visualDataPrompt = `
You are generating a visual specification for Claude Sonnet 4 (web app) to create an accurate educational visual.

Question: ${questionText}
Test Type: ${testType}
Sub-skill: ${subSkill}
Year Level: ${yearLevel}
Difficulty: ${difficulty}
Visual Type: ${visualType}

${colorGuidance}

CRITICAL: Generate a specification that describes exactly what visual Claude should create for THIS SPECIFIC QUESTION.

Requirements:
- Be question-specific, not generic
- Provide precise drawing instructions
- Include exact spatial relationships, positioning, and dimensions
- Specify all labels, text content, and measurements needed
- Keep it simple and authentic to ${testType} test standards
- Focus on what students need to see to solve THIS question
- Use UK spelling throughout (colour, centre, metre, etc.)
- FOLLOW THE COLOR RESTRICTIONS ABOVE - no other colors permitted

ESSENTIAL: This specification must be tailored to the exact question content and use ONLY the approved colors.

For example, if the question is about:
- Cubic modules: Describe the specific cube arrangement, dimensions, and spatial relationships
- Bar charts: Include the exact data values, labels, and chart structure from the question  
- Geometric shapes: Specify the precise shapes, measurements, and spatial positioning required
- Coordinate planes: Detail the specific points, lines, or functions to be plotted

DO NOT generate generic templates. Generate specific instructions for THIS question only.

This specification will be used by Claude Sonnet 4 (web app) to generate an SVG visual.
Provide information that allows Claude to:
- Understand the exact educational context
- Create precise spatial arrangements with ONLY approved colors
- Include appropriate labels and measurements
- Generate clean, test-appropriate styling
- Avoid educational overreach or extra content

Be specific about:
- Exact positioning and coordinates
- ONLY approved colors from the color guidance above
- Precise text content and labels
- Mathematical relationships and proportions
- Spatial arrangements and perspectives

Generate a JSON object with this structure:
{
  "visual_overview": "Brief description of what to draw, student task, style constraints including COLOR RESTRICTIONS, and what NOT to include",
  "detailed_description": "Step-by-step drawing instructions with specific coordinates, dimensions, ONLY APPROVED COLORS, and positioning for THIS question",
  "specific_elements": {
    "element1": "Description of key component 1",
    "element2": "Description of key component 2"
  },
  "constraints": [
    "What NOT to include",
    "Use ONLY the approved colors specified above",
    "Style limitations", 
    "Simplicity requirements"
  ]
}

Make this specification so detailed and question-specific that Claude could create the exact visual needed without any guesswork about the question content. REMEMBER: Use ONLY the approved colors specified in the color guidance.
`;

    console.log(`🎨 Generating question-specific visual data for ${visualType}...`);
    const response = await callClaudeAPIWithRetry(visualDataPrompt);

    if (!response) {
      console.warn('No response from Claude API for visual data generation, using fallback');
      return generateFallbackVisualData(visualType, subSkill, questionText, difficulty);
    }

    try {
      const content = response.content?.[0]?.text || (response as unknown as string);
      const jsonMatch = typeof content === 'string' ? content.match(/\{[\s\S]*\}/) : null;
      
      if (!jsonMatch) {
        console.warn('No JSON found in visual data response, using fallback');
        return generateFallbackVisualData(visualType, subSkill, questionText, difficulty);
      }
      
      const parsedVisualData = JSON.parse(jsonMatch[0]);
      
      // Validate that the visual data is question-specific
      if (validateVisualData(parsedVisualData, questionText)) {
        console.log(`✅ Generated question-specific visual data for ${visualType}`);
        return parsedVisualData;
      } else {
        console.warn('Generated visual data failed validation, using fallback');
        return generateFallbackVisualData(visualType, subSkill, questionText, difficulty);
      }
    } catch (parseError) {
      console.warn('Failed to parse visual data response, using fallback:', parseError);
      return generateFallbackVisualData(visualType, subSkill, questionText, difficulty);
    }

  } catch (error) {
    console.warn('Visual data generation failed, using fallback:', error);
    return generateFallbackVisualData(visualType, subSkill, questionText, difficulty);
  }
}

// Validation to ensure generated visual_data is question-specific
function validateVisualData(visualData: Record<string, unknown>, questionText: string): boolean {
  try {
    // Check if detailed_description contains question-specific content
    if (!visualData.detailed_description || typeof visualData.detailed_description !== 'string') {
      return false;
    }

    const description = visualData.detailed_description as string;

    // Verify no generic template language
    const genericTerms = ['sample', 'example', 'generic', 'template', 'placeholder', 'Category A', 'Category B'];
    const hasGenericTerms = genericTerms.some(term => 
      description.toLowerCase().includes(term.toLowerCase())
    );

    if (hasGenericTerms) {
      return false;
    }

    // Ensure specific elements relate to the actual question
    if (visualData.specific_elements && typeof visualData.specific_elements === 'object') {
      const elementCount = Object.keys(visualData.specific_elements).length;
      if (elementCount === 0) {
        return false;
      }
    }

    // Check if the description is sufficiently detailed (minimum length)
    if (description.length < 50) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

// Fallback visual data generation for when Claude API fails
function generateFallbackVisualData(
  visualType: VisualType,
  subSkill: string,
  questionText: string,
  difficulty: number
): Record<string, unknown> {
  // Extract key elements from the question text to make it more specific
  const questionWords = questionText.toLowerCase().split(' ');
  const hasNumbers = /\d+/.test(questionText);
  const hasMeasurements = /\b(cm|mm|m|km|kg|g|ml|l)\b/.test(questionText);
  
  return {
    visual_overview: `Question-specific ${visualType} for: ${subSkill} at difficulty ${difficulty}`,
    detailed_description: `Create a ${visualType} that directly supports answering this question: "${questionText.substring(0, 100)}..."`,
    specific_elements: {
      main_focus: `Element that helps solve the specific problem in the question`,
      labels: `Text labels extracted from or implied by the question content`,
      measurements: hasMeasurements ? `Include measurements and units mentioned in the question` : `Standard educational measurements`,
      data_points: hasNumbers ? `Use numerical values from the question where appropriate` : `Question-relevant data points`
    },
    constraints: [
      'Must relate directly to the question content',
      'No generic or template elements',
      'Clean test-appropriate styling only',
      'Focus on educational clarity'
    ]
  };
}

// Enhanced educational visual generation with flexible type selection
async function generateEducationalVisualSpec(
  subSkill: string, 
  questionContext: string, 
  difficulty: number, 
  testType: string,
  yearLevel: string,
  questionText?: string
): Promise<VisualSpecification | undefined> {
  if (!isSubSkillVisualRequired(subSkill)) return undefined;

  // Get appropriate visual types for this context from the pool
  const visualPool = getVisualTypePool(testType, extractSectionFromContext(testType, subSkill), subSkill);
  
  if (visualPool.length === 0) {
    // Fallback to old determination logic if no pool exists
    console.log(`No visual pool found for ${testType}/${subSkill}, using fallback`);
    return generateDynamicVisualSpec(subSkill, questionContext, difficulty, testType, yearLevel, { width: 500, height: 350 }, questionText);
  }

  // Determine standard dimensions based on common test formats
  let dimensions = { width: 500, height: 350 }; // Standard dimensions
  
  // Modify dimensions based on test type for authenticity
  if (testType.includes('NAPLAN')) {
    dimensions = { width: 450, height: 300 }; // NAPLAN tends to use smaller visuals
  } else if (testType.includes('Selective')) {
    dimensions = { width: 500, height: 400 }; // Selective tests often have more detailed visuals
  } else if (testType.includes('EduTest')) {
    dimensions = { width: 480, height: 320 }; // EduTest standard size
  }

  // For now, select the first appropriate visual type from the pool
  // In future, this could be enhanced to let Claude choose from the entire pool
  const selectedVisualType = visualPool[0];
  
  // Generate an enhanced prompt using the new prompt system
  const enhancedPrompt = getVisualGenerationPrompt(
    testType, 
    extractSectionFromContext(testType, subSkill), 
    subSkill, 
    questionContext,
    difficulty,
    yearLevel,
    questionText
  );
  
  console.log(`Using visual type: ${selectedVisualType} from pool: [${visualPool.join(', ')}] for ${subSkill}`);
  
  // Generate visual with the selected type and enhanced prompt context
  return generateDynamicVisualSpec(subSkill, questionContext + '\n\n' + enhancedPrompt, difficulty, testType, yearLevel, dimensions, questionText);
}

// Helper function to extract section name from test type and sub-skill context
function extractSectionFromContext(testType: string, subSkill: string): string {
  // Map sub-skills to likely section names based on curriculum data
  if (subSkill.includes('Reading') || subSkill.includes('Comprehension')) return 'Reading';
  if (subSkill.includes('Writing') || subSkill.includes('Language')) return 'Writing';
  if (subSkill.includes('Algebra') || subSkill.includes('Number') || subSkill.includes('Geometry') || 
      subSkill.includes('Statistics') || subSkill.includes('Probability') || subSkill.includes('Measurement')) {
    return 'Mathematics';
  }
  if (subSkill.includes('Thinking') || subSkill.includes('Reasoning')) return 'Thinking Skills';
  
  // Default fallback
  return 'Mathematics';
}