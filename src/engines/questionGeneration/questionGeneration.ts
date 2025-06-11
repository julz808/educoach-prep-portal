// ============================================================================
// INDIVIDUAL QUESTION GENERATION ENGINE
// ============================================================================

import { 
  TEST_STRUCTURES, 
  UNIFIED_SUB_SKILLS, 
  SECTION_TO_SUB_SKILLS,
  SUB_SKILL_VISUAL_MAPPING
} from '../../data/curriculumData.ts';
import { buildQuestionPrompt, callClaudeAPIWithRetry, parseClaudeResponse } from './claudePrompts.ts';
import { validateQuestion } from './validators.ts';

// Define types inline to avoid runtime import issues with TypeScript interfaces
type ResponseType = 'multiple_choice' | 'extended_response';

interface SingleQuestionRequest {
  testType: string;
  sectionName: string;
  subSkill: string;
  difficulty: number;
  responseType: ResponseType;
  generateVisual: boolean;
  generationContext: GenerationContext;
  passageContent?: string;
}

interface GeneratedQuestion {
  id?: string;
  question_text: string;
  answer_options: string[] | null;
  correct_answer: string | null;
  solution: string;
  has_visual: boolean;
  visual_type: string | null;
  visual_data: any;
  visual_svg: string | null;
  test_type: string;
  section_name: string;
  sub_skill: string;
  difficulty: number;
  response_type: ResponseType;
  passage_reference: boolean;
  australian_context: boolean;
  generation_metadata: {
    generation_timestamp: string;
    attempt_number?: number;
    prompt_length?: number;
    response_time_ms?: number;
  };
  created_at?: string;
}

interface GenerationContext {
  sessionId?: string;
  testType?: string;
  usedTopics: Set<string>;
  usedNames: Set<string>;
  usedLocations: Set<string>;
  usedScenarios: Set<string>;
  passageBank?: any[];
  questionBank?: any[];
  generatedQuestions?: any[];
  questionsBySubSkill?: Record<string, any[]>;
  currentDifficulty?: number;
  difficultyDistribution?: {
    easy: number;
    medium: number;
    hard: number;
  };
  visualsGenerated?: number;
  lastUpdate?: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score?: number;
}

/**
 * Selects appropriate difficulty based on test type and distribution
 */
function selectQuestionDifficulty(testType: string): number {
  // Difficulty distributions for different test types
  const difficultyDistributions = {
    'Year 5 NAPLAN': [0.45, 0.45, 0.1], // 45% easy, 45% medium, 10% hard
    'Year 7 NAPLAN': [0.35, 0.5, 0.15], // 35% easy, 50% medium, 15% hard
    'VIC Selective Entry (Year 9 Entry)': [0.1, 0.35, 0.55], // 10% easy, 35% medium, 55% hard
    'NSW Selective Entry (Year 7 Entry)': [0.15, 0.5, 0.35], // 15% easy, 50% medium, 35% hard
    'EduTest Scholarship (Year 7 Entry)': [0.2, 0.5, 0.3], // 20% easy, 50% medium, 30% hard
    'ACER Scholarship (Year 7 Entry)': [0.15, 0.45, 0.4] // 15% easy, 45% medium, 40% hard
  };
  
  const distribution = difficultyDistributions[testType as keyof typeof difficultyDistributions] || [0.3, 0.5, 0.2];
  const random = Math.random();
  
  if (random < distribution[0]) return 1;
  if (random < distribution[0] + distribution[1]) return 2;
  return 3;
}

/**
 * Determines if question should have visual component
 */
function shouldGenerateVisual(subSkill: string, testType: string, sectionName: string): boolean {
  // Check visual mapping configuration for specific probability
  const visualMapping = SUB_SKILL_VISUAL_MAPPING[testType as keyof typeof SUB_SKILL_VISUAL_MAPPING];
  if (visualMapping && typeof visualMapping === 'object') {
    const sectionMapping = (visualMapping as any)[sectionName];
    if (sectionMapping && typeof sectionMapping === 'object') {
      const subSkillMapping = sectionMapping[subSkill];
      if (subSkillMapping && typeof subSkillMapping === 'object') {
        // Use the configured probability from the mapping
        const probability = subSkillMapping.probability || 0.0;
        return Math.random() < probability;
      }
    }
  }
  
  // Fallback: Check if sub-skill generally requires visual (for non-mapped sub-skills)
  const subSkillData = UNIFIED_SUB_SKILLS[subSkill];
  if (subSkillData?.visual_required) {
    // For MVP, default to 0% chance even for visual_required sub-skills
    // This can be changed later when visual generation is fully implemented
    return false;
  }
  
  // Some probability for visual even if not required (for variety)
  const visualProbabilities = {
    'Year 5 NAPLAN': 0.0,
    'Year 7 NAPLAN': 0.0,
    'VIC Selective Entry (Year 9 Entry)': 0.0,
    'NSW Selective Entry (Year 7 Entry)': 0.0,
    'EduTest Scholarship (Year 7 Entry)': 0.0,
    'ACER Scholarship (Year 7 Entry)': 0.0
  };
  
  const probability = visualProbabilities[testType as keyof typeof visualProbabilities] || 0.1;
  return Math.random() < probability;
}

/**
 * Gets appropriate response type for section
 */
function getResponseType(testType: string, sectionName: string): ResponseType {
  // Check if this is a writing section (includes "Writing" or "Written Expression")
  const isWritingSection = sectionName.toLowerCase().includes('writing') || 
                          sectionName.toLowerCase().includes('written expression') ||
                          sectionName.toLowerCase().includes('written_expression');
  
  if (isWritingSection) {
    return 'extended_response';
  }
  
  return 'multiple_choice';
}

/**
 * Updates generation context with question elements
 */
export function updateContextFromQuestion(context: GenerationContext, question: GeneratedQuestion, subSkill?: string): GenerationContext {
  const updated = { ...context };
  
  // Initialize questionsBySubSkill if it doesn't exist
  if (!updated.questionsBySubSkill) {
    updated.questionsBySubSkill = {};
  }
  
  // Track this question by sub-skill for intelligent diversity
  // Use the passed subSkill parameter, fallback to question.sub_skill if available
  const actualSubSkill = subSkill || question.sub_skill;
  if (!actualSubSkill) {
    console.warn('⚠️  No sub-skill provided for question tracking');
    return updated;
  }
  
  if (!updated.questionsBySubSkill[actualSubSkill]) {
    updated.questionsBySubSkill[actualSubSkill] = [];
  }
  
  // Add this question to the sub-skill tracking (keep last 10 per sub-skill)
  updated.questionsBySubSkill[actualSubSkill].push({
    question_text: question.question_text,
    sub_skill: actualSubSkill, // Use the correct sub-skill
    difficulty: question.difficulty,
    text: question.question_text // Alternative field name for compatibility
  });
  
  // Keep only last 10 questions per sub-skill to prevent memory bloat
  if (updated.questionsBySubSkill[actualSubSkill].length > 10) {
    updated.questionsBySubSkill[actualSubSkill] = updated.questionsBySubSkill[actualSubSkill].slice(-10);
  }
  
  // Extract text for analysis
  const questionLower = question.question_text.toLowerCase();
  const fullText = question.question_text + ' ' + (question.solution || '');
  
  // Enhanced name extraction with better patterns and filtering
  const namePattern = /\b[A-Z][a-z]{2,}\b/g; // Names at least 3 letters
  const potentialNames = question.question_text.match(namePattern) || [];
  
  // Expanded list of common words to filter out
  const commonWords = new Set([
    'The', 'This', 'That', 'Which', 'What', 'When', 'Where', 'How', 'Why', 
    'Who', 'Will', 'Can', 'Could', 'Would', 'Should', 'May', 'Must', 'Let',
    'First', 'Second', 'Third', 'Next', 'Last', 'Final', 'Each', 'Every',
    'Many', 'Some', 'All', 'Most', 'Few', 'Several', 'Both', 'Either',
    'Year', 'Grade', 'Level', 'Class', 'School', 'Student', 'Teacher',
    'Question', 'Answer', 'Problem', 'Solution', 'Example', 'Test',
    'Mathematics', 'Reading', 'Writing', 'English', 'Science', 'History',
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
    'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December',
    'Australia', 'Australian', 'Melbourne', 'Sydney', 'Brisbane', 'Perth',
    'Adelaide', 'Darwin', 'Canberra', 'Hobart', 'Victoria', 'Queensland',
    'Garden', 'Gardens', 'Botanical', 'Traditional', 'Japanese', 'Chinese',
    'Energy', 'System', 'Conference', 'Workshop', 'Project', 'Research',
    'Design', 'Designing', 'Planning', 'Building', 'Creating', 'Making',
    'Centre', 'Center', 'University', 'College', 'Institute', 'Academy',
    'Company', 'Business', 'Organisation', 'Organization', 'Department'
  ]);
  
  // More sophisticated name filtering
  const actualNames = potentialNames.filter(name => {
    // Filter out common words
    if (commonWords.has(name)) return false;
    
    // Filter out gerunds and past participles
    if (/^[A-Z][a-z]*ing$/.test(name)) return false;
    if (/^[A-Z][a-z]*ed$/.test(name)) return false;
    
    // Filter out words that are likely not names
    if (/^[A-Z][a-z]*ly$/.test(name)) return false; // Adverbs
    if (/^[A-Z][a-z]*tion$/.test(name)) return false; // Abstract nouns
    if (/^[A-Z][a-z]*ness$/.test(name)) return false; // Abstract nouns
    
    // Must be at least 3 characters and not all caps
    if (name.length < 3 || name === name.toUpperCase()) return false;
    
    return true;
  });
  
  // Extract unique names only
  const uniqueNames = [...new Set(actualNames)];
  uniqueNames.forEach(name => updated.usedNames.add(name));
  
  // Enhanced location extraction with more comprehensive patterns
  const locationPatterns = [
    // Specific cities and places (case insensitive)
    /\b(Sydney|Melbourne|Brisbane|Perth|Adelaide|Darwin|Canberra|Hobart|Alice Springs|Cairns|Townsville|Newcastle|Wollongong|Gold Coast|Sunshine Coast|Geelong|Ballarat|Bendigo|Launceston|Fremantle|Mount Gambier|Port Augusta|Broken Hill|Broome)\b/gi,
    /\b(London|Paris|Tokyo|Beijing|Mumbai|Cairo|Lagos|São Paulo|Mexico City|New York|Los Angeles|Toronto|Vancouver|Auckland|Wellington|Helsinki|Copenhagen|Reykjavik|Prague|Budapest|Krakow|Lisbon|Valencia|Edinburgh|Geneva)\b/gi,
    
    // Geographic regions and states
    /\b(NSW|VIC|QLD|WA|SA|NT|ACT|TAS|New South Wales|Victoria|Queensland|Western Australia|South Australia|Northern Territory|Australian Capital Territory|Tasmania)\b/gi,
    
    // Generic location types with better context
    /\b(observatory|aquarium|planetarium|conservatory|laboratory|workshop|studio|gallery|amphitheatre|marina|botanical gardens|archaeological site|research station|innovation hub|cultural center|maker space|art studio|recording studio)\b/gi,
    /\b(school|university|college|library|museum|park|beach|mountain|forest|desert|city|town|village|farm|factory|hospital|airport|station|market|shop|store|cafe|restaurant|cinema|theatre|stadium|gym|pool|playground|garden)\b/gi,
    
    // Geographic features
    /\b(river|lake|ocean|sea|bay|valley|hill|plateau|island|coast|harbour|harbor|creek|stream|gorge|cliff|reef|wetland)\b/gi
  ];
  
  locationPatterns.forEach(pattern => {
    const matches = fullText.match(pattern) || [];
    matches.forEach(location => {
      const cleanLocation = location.toLowerCase().trim();
      if (cleanLocation.length > 2) {
        updated.usedLocations.add(cleanLocation);
      }
    });
  });
  
  // Enhanced topic extraction with more specific patterns
  const topicPatterns = [
    // Academic subjects and disciplines
    /\b(mathematics|algebra|geometry|calculus|statistics|probability|trigonometry|arithmetic|physics|chemistry|biology|botany|zoology|ecology|astronomy|geography|geology|history|literature|poetry|drama|philosophy|psychology|economics|politics|sociology|anthropology)\b/gi,
    
    // Activities and skills
    /\b(robotics|programming|coding|engineering|architecture|construction|manufacturing|agriculture|farming|gardening|cooking|baking|photography|filming|painting|drawing|sculpting|dancing|singing|playing|composing|writing|reading|teaching|learning)\b/gi,
    
    // Technology and innovation
    /\b(artificial intelligence|machine learning|virtual reality|3D printing|renewable energy|solar panels|wind turbines|hydroelectric|sustainable design|biotechnology|nanotechnology|blockchain|cryptocurrency|app development|web design|database|algorithm)\b/gi,
    
    // Environmental and scientific themes
    /\b(conservation|sustainability|climate change|global warming|ecosystem|biodiversity|pollution|recycling|wildlife|endangered species|marine biology|oceanography|meteorology|seismology|volcanology|paleontology|archaeology)\b/gi,
    
    // Cultural and social themes
    /\b(festival|celebration|tradition|heritage|culture|language|music|art|literature|film|theatre|dance|sport|recreation|community|volunteer|charity|social enterprise|entrepreneurship|leadership|teamwork|collaboration)\b/gi,
    
    // Industry and career areas
    /\b(healthcare|medicine|nursing|veterinary|education|journalism|media|broadcasting|publishing|tourism|hospitality|retail|finance|banking|insurance|legal|law|consulting|marketing|advertising|design|fashion|entertainment)\b/gi
  ];
  
  topicPatterns.forEach(pattern => {
    const matches = fullText.match(pattern) || [];
    matches.forEach(topic => {
      const cleanTopic = topic.toLowerCase().trim();
      if (cleanTopic.length > 2) {
        updated.usedTopics.add(cleanTopic);
      }
    });
  });
  
  // Enhanced scenario extraction with more comprehensive contexts
  const scenarioPatterns = [
    // Educational and academic contexts
    /\b(classroom|lesson|homework|assignment|project|experiment|field trip|excursion|presentation|research|study|exam|test|quiz|assessment|lecture|tutorial|seminar|conference|workshop|symposium|competition|olympiad)\b/gi,
    
    // Work and professional contexts
    /\b(office|workplace|factory|laboratory|hospital|clinic|restaurant|retail|customer service|management|leadership|internship|apprenticeship|career|job|employment|business|startup|entrepreneur|innovation|invention)\b/gi,
    
    // Social and community contexts
    /\b(party|celebration|festival|wedding|birthday|anniversary|holiday|vacation|picnic|barbecue|gathering|meeting|reunion|fundraiser|charity|volunteer|community service|cultural exchange|international program)\b/gi,
    
    // Creative and artistic contexts
    /\b(concert|performance|recital|exhibition|gallery|art show|film festival|theatre production|musical|opera|dance performance|poetry reading|literary event|book launch|art installation|sculpture|mural)\b/gi,
    
    // Sports and recreational contexts
    /\b(tournament|championship|match|game|training|coaching|fitness|exercise|hiking|camping|fishing|sailing|skiing|surfing|climbing|cycling|running|swimming|team sport|individual sport|recreational activity)\b/gi,
    
    // Technology and digital contexts
    /\b(app development|website creation|software design|programming competition|hackathon|tech startup|digital innovation|online platform|virtual meeting|video conference|social media|digital art|computer graphics|animation)\b/gi,
    
    // Environmental and scientific contexts
    /\b(field research|data collection|scientific study|environmental monitoring|conservation project|sustainability initiative|renewable energy project|wildlife tracking|space exploration|archaeological excavation|geological survey)\b/gi,
    
    // Problem-solving and analytical contexts
    /\b(mystery investigation|problem solving|critical thinking|analysis|evaluation|comparison|decision making|strategic planning|risk assessment|quality control|troubleshooting|debugging|optimization)\b/gi
  ];
  
  scenarioPatterns.forEach(pattern => {
    const matches = fullText.match(pattern) || [];
    matches.forEach(scenario => {
      const cleanScenario = scenario.toLowerCase().trim();
      if (cleanScenario.length > 2) {
        updated.usedScenarios.add(cleanScenario);
      }
    });
  });
  
  // Extract key phrases that indicate scenarios (multi-word contexts)
  const phrasePatterns = [
    // CRITICAL: Add the specific phrases that keep repeating in questions
    /\b(garden bed|rectangular garden bed|swimming pool|mobile phone plan|phone plan|prism has|rectangular prism|clothing manufacturer|marine research|taxi service|laboratory table)\b/gi,
    /\b(courtyard|decorative border|concrete path|uniform border|tracking devices|whale migration|text message|kilometre travelled|expanded by adding)\b/gi,
    
    // Mathematical context phrases that repeat
    /\b(perimeter of.*metres|area of.*square metres|total cost.*dollars|monthly bill.*dollars|value of x|expression.*represents|equation.*modelled)\b/gi,
    /\b(length.*more than twice|width.*height.*cm|radius.*cm|vertices at coordinates|centroid of.*triangle|surface area.*two|fixed fee.*plus)\b/gi,
    
    // Original patterns
    /\b(traditional japanese garden|renewable energy conference|botanical garden|art exhibition|film festival|music collaboration|cultural exchange|heritage preservation|treasure hunt|mystery investigation|survival challenge)\b/gi,
    /\b(startup accelerator|innovation hub|maker space|research facility|cultural center|community project|volunteer initiative|social enterprise|design competition|invention workshop)\b/gi,
    /\b(space mission|archaeological dig|field research|environmental study|laboratory discovery|technology showcase|creative workshop|art installation|heritage project)\b/gi
  ];
  
  phrasePatterns.forEach(pattern => {
    const matches = fullText.match(pattern) || [];
    matches.forEach(phrase => {
      const cleanPhrase = phrase.toLowerCase().trim().replace(/\s+/g, '_');
      updated.usedScenarios.add(cleanPhrase);
    });
  });
  
  // Track question sub-skill as a scenario to avoid repetition
  if (question.sub_skill) {
    updated.usedScenarios.add(question.sub_skill.toLowerCase().replace(/\s+/g, '_'));
  }
  
  // Clean up sets to prevent excessive memory usage (keep only last 30 items each for better tracking)
  if (updated.usedTopics.size > 30) {
    const topicsArray = Array.from(updated.usedTopics);
    updated.usedTopics = new Set(topicsArray.slice(-30));
  }
  if (updated.usedNames.size > 30) {
    const namesArray = Array.from(updated.usedNames);
    updated.usedNames = new Set(namesArray.slice(-30));
  }
  if (updated.usedLocations.size > 30) {
    const locationsArray = Array.from(updated.usedLocations);
    updated.usedLocations = new Set(locationsArray.slice(-30));
  }
  if (updated.usedScenarios.size > 30) {
    const scenariosArray = Array.from(updated.usedScenarios);
    updated.usedScenarios = new Set(scenariosArray.slice(-30));
  }
  
  // Debug logging to verify extraction is working
  if (uniqueNames.length > 0) {
    console.log(`🔍 Extracted names: ${uniqueNames.join(', ')}`);
  }
  
  return updated;
}

/**
 * Validates question content against requirements
 */
function validateQuestionContent(question: GeneratedQuestion, request: SingleQuestionRequest): ValidationResult {
  const validation = validateQuestion(question);
  const errors = [...validation.errors];
  const warnings = [...validation.warnings];
  
  // Check response type consistency
  if (request.responseType === 'multiple_choice') {
    if (!question.answer_options || question.answer_options.length !== 4) {
      errors.push('Multiple choice question must have exactly 4 answer options');
    }
    if (!question.correct_answer || !['A', 'B', 'C', 'D'].includes(question.correct_answer)) {
      errors.push('Multiple choice question must have correct answer A, B, C, or D');
    }
  } else {
    if (question.answer_options || question.correct_answer) {
      warnings.push('Written response question should not have multiple choice options');
    }
  }
  
  // Check visual consistency
  if (request.generateVisual) {
    if (!question.has_visual || !question.visual_svg) {
      errors.push('Question was requested with visual but no visual content provided');
    }
  } else {
    if (question.has_visual || question.visual_svg) {
      warnings.push('Question has visual content but was not requested');
    }
  }
  
  // Check sub-skill alignment
  const subSkillData = UNIFIED_SUB_SKILLS[request.subSkill];
  if (subSkillData?.visual_required && !question.has_visual) {
    // Check if this is MVP mode (probability = 0.0 in visual mapping)
    const visualMapping = SUB_SKILL_VISUAL_MAPPING[request.testType as keyof typeof SUB_SKILL_VISUAL_MAPPING];
    let isMVPMode = false;
    
    if (visualMapping && typeof visualMapping === 'object') {
      const sectionMapping = (visualMapping as any)[request.sectionName];
      if (sectionMapping && typeof sectionMapping === 'object') {
        const subSkillMapping = sectionMapping[request.subSkill];
        if (subSkillMapping && typeof subSkillMapping === 'object') {
          // If probability is 0.0, we're in MVP mode - skip visual requirement
          isMVPMode = (subSkillMapping.probability === 0.0);
        }
      }
    }
    
    if (!isMVPMode) {
      errors.push(`Sub-skill ${request.subSkill} requires visual component but question has none`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    score: Math.max(0, 100 - (errors.length * 20) - (warnings.length * 5))
  };
}

/**
 * Generates a single question
 */
export async function generateQuestion(request: SingleQuestionRequest): Promise<GeneratedQuestion> {
  const maxAttempts = 3;
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Build the prompt
      const prompt = buildQuestionPrompt(request);
      
      // Call Claude API
      const response = await callClaudeAPIWithRetry(prompt);
      
      // Parse response
      const parsedQuestion = parseClaudeResponse(response);
      
      // Create question object
      const question: GeneratedQuestion = {
        question_text: parsedQuestion.question_text || '',
        answer_options: parsedQuestion.answer_options || null,
        correct_answer: parsedQuestion.correct_answer || null,
        solution: parsedQuestion.solution || '',
        has_visual: parsedQuestion.has_visual || false,
        visual_type: parsedQuestion.visual_type || null,
        visual_data: parsedQuestion.visual_data || null,
        visual_svg: parsedQuestion.visual_svg || null,
        test_type: request.testType,
        section_name: request.sectionName,
        sub_skill: request.subSkill,
        difficulty: request.difficulty,
        response_type: request.responseType,
        passage_reference: request.passageContent ? true : false,
        australian_context: false, // Will be determined by validation
        generation_metadata: {
          generation_timestamp: new Date().toISOString(),
          attempt_number: attempt,
          prompt_length: prompt.length,
          response_time_ms: 0 // Would be measured if needed
        }
      };
      
      // Validate question
      const validation = validateQuestionContent(question, request);
      
      if (validation.isValid) {
        return question;
      } else {
        console.warn(`Question validation failed on attempt ${attempt}:`, validation.errors);
        if (attempt === maxAttempts) {
          throw new Error(`Question validation failed after ${maxAttempts} attempts: ${validation.errors.join(', ')}`);
        }
      }
      
    } catch (error) {
      lastError = error as Error;
      console.error(`Question generation attempt ${attempt} failed:`, error);
      
      if (attempt === maxAttempts) {
        break;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  throw new Error(`Failed to generate question after ${maxAttempts} attempts. Last error: ${lastError?.message}`);
}

/**
 * Generates multiple questions for a specific sub-skill
 */
export async function generateQuestionsForSubSkill(
  testType: string,
  sectionName: string,
  subSkill: string,
  count: number,
  generationContext: GenerationContext,
  passageContent?: string
): Promise<{ questions: GeneratedQuestion[]; updatedContext: GenerationContext }> {
  const questions: GeneratedQuestion[] = [];
  let currentContext = { ...generationContext };
  
  const responseType = getResponseType(testType, sectionName);
  
  for (let i = 0; i < count; i++) {
    try {
      // Create question generation request
      const request: SingleQuestionRequest = {
        testType,
        sectionName,
        subSkill,
        difficulty: selectQuestionDifficulty(testType),
        responseType,
        generateVisual: shouldGenerateVisual(subSkill, testType, sectionName),
        generationContext: currentContext,
        passageContent
      };
      
      // Generate the question
      const question = await generateQuestion(request);
      questions.push(question);
      
      // Update context with elements from this question
      currentContext = updateContextFromQuestion(currentContext, question, subSkill);
      
      // Small delay between questions to avoid rate limiting
      if (i < count - 1) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
    } catch (error) {
      console.error(`Failed to generate question ${i + 1}/${count} for sub-skill ${subSkill}:`, error);
      throw error;
    }
  }
  
  return {
    questions,
    updatedContext: currentContext
  };
}

/**
 * Gets available sub-skills for a test section
 */
export function getAvailableSubSkills(testType: string, sectionName: string): string[] {
  const sectionSubSkills = SECTION_TO_SUB_SKILLS[testType as keyof typeof SECTION_TO_SUB_SKILLS];
  
  if (!sectionSubSkills) {
    return [];
  }
  
  // Handle the case where section sub-skills might be an array directly
  if (Array.isArray(sectionSubSkills)) {
    return sectionSubSkills;
  }
  
  // Handle the case where it's an object with section names as keys
  const subSkills = (sectionSubSkills as any)[sectionName];
  
  if (Array.isArray(subSkills)) {
    return subSkills;
  }
  
  return [];
}

/**
 * Gets question generation requirements for a section
 */
export function getQuestionRequirements(testType: string, sectionName: string): {
  totalQuestions: number;
  responseType: ResponseType;
  timeLimit: number;
  requiresPassages: boolean;
} {
  const testStructure = TEST_STRUCTURES[testType as keyof typeof TEST_STRUCTURES];
  const sectionStructure = testStructure?.[sectionName as keyof typeof testStructure];
  
  if (sectionStructure && typeof sectionStructure === 'object') {
    const structure = sectionStructure as any;
    return {
      totalQuestions: structure.questions || 0,
      responseType: structure.format === 'Written Response' ? 'extended_response' : 'multiple_choice',
      timeLimit: structure.time || 0,
      requiresPassages: (structure.passages || 0) > 0
    };
  }
  
  return {
    totalQuestions: 0,
    responseType: 'multiple_choice',
    timeLimit: 0,
    requiresPassages: false
  };
}

/**
 * Estimates question generation time
 */
export function estimateQuestionGenerationTime(count: number, hasVisuals: boolean = false): number {
  // Base time per question: 15 seconds
  // Visual questions: additional 10 seconds
  const baseTime = count * 15;
  const visualTime = hasVisuals ? count * 10 : 0;
  
  return baseTime + visualTime;
}

/**
 * Creates a question preview for validation
 */
export function createQuestionPreview(question: GeneratedQuestion): string {
  const preview = question.question_text.substring(0, 150);
  const ellipsis = question.question_text.length > 150 ? '...' : '';
  
  let optionsPreview = '';
  if (question.answer_options) {
    optionsPreview = `\n${question.answer_options.slice(0, 2).join('\n')}...`;
  }
  
  const visualIndicator = question.has_visual ? ' 📊' : '';
  
  return `**${question.sub_skill}** (Difficulty ${question.difficulty})${visualIndicator}\n\n${preview}${ellipsis}${optionsPreview}`;
}

/**
 * Analyzes question distribution across difficulties
 */
export function analyzeQuestionDistribution(questions: GeneratedQuestion[]): {
  byDifficulty: Record<number, number>;
  bySubSkill: Record<string, number>;
  byVisual: { withVisual: number; withoutVisual: number };
  averageDifficulty: number;
} {
  const byDifficulty: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
  const bySubSkill: Record<string, number> = {};
  let withVisual = 0;
  let withoutVisual = 0;
  let totalDifficulty = 0;
  
  questions.forEach(question => {
    // Count by difficulty
    byDifficulty[question.difficulty]++;
    totalDifficulty += question.difficulty;
    
    // Count by sub-skill
    bySubSkill[question.sub_skill] = (bySubSkill[question.sub_skill] || 0) + 1;
    
    // Count visual vs non-visual
    if (question.has_visual) {
      withVisual++;
    } else {
      withoutVisual++;
    }
  });
  
  return {
    byDifficulty,
    bySubSkill,
    byVisual: { withVisual, withoutVisual },
    averageDifficulty: questions.length > 0 ? totalDifficulty / questions.length : 0
  };
}

/**
 * Gets question complexity score
 */
export function getQuestionComplexity(question: GeneratedQuestion): {
  score: number;
  factors: string[];
} {
  const factors: string[] = [];
  let score = question.difficulty * 25; // Base score from difficulty
  
  // Visual component adds complexity
  if (question.has_visual) {
    score += 15;
    factors.push('Visual component');
  }
  
  // Passage reference adds complexity
  if (question.passage_reference) {
    score += 10;
    factors.push('Passage reference');
  }
  
  // Question length factor
  const wordCount = question.question_text.split(' ').length;
  if (wordCount > 50) {
    score += 10;
    factors.push('Long question');
  } else if (wordCount < 20) {
    score -= 5;
    factors.push('Short question');
  }
  
  // Multiple choice vs written response
  if (question.response_type === 'extended_response') {
    score += 20;
    factors.push('Written response');
  }
  
  // Sub-skill complexity (rough estimate)
  if (question.sub_skill.includes('Analysis') || question.sub_skill.includes('Evaluation')) {
    score += 15;
    factors.push('High-order thinking');
  }
  
  return {
    score: Math.max(0, Math.min(100, score)),
    factors
  };
} 