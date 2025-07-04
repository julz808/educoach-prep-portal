// ============================================================================
// CLAUDE API PROMPT TEMPLATES & BUILDERS
// ============================================================================

import { 
  TEST_STRUCTURES, 
  UNIFIED_SUB_SKILLS, 
  SECTION_TO_SUB_SKILLS,
  SUB_SKILL_VISUAL_MAPPING 
} from '../../data/curriculumData.ts';
import { selectRelevantTips, formatTipsForExplanation } from './educationalTips.ts';

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

interface PassageGenerationRequest {
  testType: string;
  sectionName: string;
  wordCount: number;
  difficulty: number;
  passageType: 'narrative' | 'informational' | 'persuasive';
  generationContext: GenerationContext;
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
  currentDifficulty?: number;
  difficultyDistribution?: {
    easy: number;
    medium: number;
    hard: number;
  };
  visualsGenerated?: number;
  lastUpdate?: string;
  preferredApproach?: string;
  randomizationSeed?: number;
  questionIndex?: number;
  questionsBySubSkill?: Record<string, any[]>;
  generatedPassages?: any[];
  usedPassageTypes?: string[];
  recentPassageThemes?: string[];
  recentPassageSettings?: string[];
  recentPassageCharacters?: string[];
  lastPassageType?: string;
  passageTypeRotation?: number;
}

// Define Claude API types inline to avoid runtime import issues
interface ClaudeAPIRequest {
  model: string;
  max_tokens: number;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

interface ClaudeAPIResponse {
  content?: Array<{
    text: string;
    type: string;
  }>;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
  stop_reason?: string;
}

/**
 * Gets the appropriate year level for a test type
 */
function getYearLevel(testType: string): number {
  if (testType.includes('Year 5')) return 5;
  if (testType.includes('Year 7')) return 7;
  if (testType.includes('Year 9')) return 9;
  return 7; // Default fallback
}

/**
 * Gets difficulty calibration description
 */
function getDifficultyCalibration(testType: string, difficulty: number): string {
  const calibrations = {
    1: "65-80th percentile performance (easier than average for this test)",
    2: "40-60th percentile performance (typical performance for this test)",
    3: "10-30th percentile performance (challenging for most students taking this test)"
  };

  return calibrations[difficulty as keyof typeof calibrations] || calibrations[2];
}

/**
 * Gets test-specific authenticity guidance
 */
function getTestAuthenticityGuidance(testType: string): string {
  const testGuidance = {
    'Year 5 NAPLAN': `
      - Use simple, clear language appropriate for Year 5 students
      - Focus on basic literacy and numeracy concepts
      - Include familiar, everyday contexts (home, school, playground)
      - Use concrete examples rather than abstract concepts
      - Keep questions concise and avoid complex sentence structures`,
    
    'Year 7 NAPLAN': `
      - Use more sophisticated vocabulary and concepts than Year 5
      - Include academic and real-world contexts
      - Questions can have multi-step thinking requirements
      - Use diverse text types and mathematical applications
      - Balance concrete and abstract thinking`,
    
    'VIC Selective Entry (Year 9 Entry)': `
      - Highly competitive academic standard - questions should challenge top students
      - Complex reasoning and multi-step problem solving required
      - Sophisticated vocabulary and abstract thinking
      - Include diverse academic and real-world contexts
      - Precision and efficiency in problem-solving approach`,
    
    'NSW Selective Entry (Year 7 Entry)': `
      - Competitive academic standard for high-achieving Year 6 students
      - Questions require analytical thinking and logical reasoning
      - Include both academic and practical contexts
      - Clear, efficient problem-solving with multiple valid approaches
      - Appropriate complexity for gifted 12-year-olds`,
    
    'EduTest Scholarship (Year 7 Entry)': `
      - Private school scholarship standard - well-rounded academic assessment
      - Questions should differentiate among high-achieving students
      - Include cultural, academic, and practical contexts
      - Reward creativity and lateral thinking alongside accuracy
      - Sophisticated but accessible to motivated students`,
    
    'ACER Scholarship (Year 7 Entry)': `
      - Research-based assessment design with academic rigour
      - Questions should assess deep understanding over memorization
      - Include cross-curricular connections and real-world applications
      - Reward analytical thinking and evidence-based reasoning
      - Professional, academic tone throughout`
  };

  return testGuidance[testType as keyof typeof testGuidance] || testGuidance['Year 7 NAPLAN'];
}

/**
 * Gets visual generation instructions
 */
function getVisualInstructions(shouldGenerateVisual: boolean, subSkill: string, visualTypes?: string[]): string {
  if (!shouldGenerateVisual) {
    // Check if this sub-skill normally requires visuals
    const subSkillData = UNIFIED_SUB_SKILLS[subSkill];
    const normallyRequiresVisual = subSkillData?.visual_required || false;
    
    if (normallyRequiresVisual) {
      // This sub-skill normally needs visuals but we're creating text-only version
      return `
VISUAL GENERATION: FALSE
- Create a text-only question that can be fully answered without any visual aid
- This sub-skill normally requires visuals, so provide all necessary data within the question text
- Describe any shapes, charts, or spatial relationships clearly in words
- Include all numerical data, measurements, and relationships in the question text

🚫 CRITICAL: AVOID OVERLY VERBOSE VISUAL DESCRIPTIONS
When describing visual elements in text, follow these guidelines:

**CONCISE DESCRIPTION PRINCIPLES:**
- Keep visual descriptions SHORT and FOCUSED - maximum 2-3 sentences
- Use BULLET POINTS or STRUCTURED FORMAT for complex data instead of long paragraphs
- Present only ESSENTIAL visual information needed to answer the question
- Avoid lengthy descriptions that overwhelm students

**PREFERRED FORMATS for different visual types (EXAMPLES ONLY - adapt to your question topic):**

**For GEOMETRIC SHAPES:**
❌ BAD: "Imagine a complex geometric figure where there is a large rectangle positioned horizontally with dimensions that measure 12 centimetres in length and 8 centimetres in width, and attached to this rectangle is a triangular shape..."
✅ GOOD: "A rectangle (12cm × 8cm) has a triangle attached to its right side. The triangle has a base of 8cm and height of 6cm."
*Note: Your question doesn't have to be about rectangles - use any appropriate geometric shape for your question*

**For DATA/CHARTS:**
❌ BAD: "Consider a detailed bar chart showing multiple data points where the first bar represents 45 students who chose mathematics, the second bar shows 32 students who selected science, the third bar indicates 28 students who picked..."
✅ GOOD: "Student subject preferences: Mathematics (45), Science (32), English (28), Art (15)."
*Note: Your question doesn't have to be about student preferences - use any appropriate data set for your question*

**For TABLES:**
❌ BAD: "Examine the following complex table which displays information in rows and columns where the first row contains headers and subsequent rows show..."
✅ GOOD: Use a simple formatted table or list the key data points clearly.
*Note: Adapt table format to whatever data your question requires*

**STRUCTURE GUIDELINES:**
1. **Lead with the question concept**, not the visual description
2. **Integrate data naturally** into the question flow
3. **Use formatting** (parentheses, colons, bullet points) to organize information clearly
4. **Focus on mathematical relationships** rather than visual appearance

**EXAMPLE TRANSFORMATIONS (adapt the approach, not the specific topic):**
❌ "Look at this rectangular garden bed which has been designed with specific measurements where the length is exactly three times longer than the width, and if you were to calculate the width as being 4 metres, then you would need to determine..."
✅ "A rectangular garden bed has a width of 4m and a length three times the width. What is the perimeter?"
*Note: Use this concise approach for ANY topic - doesn't have to be garden beds*`;
    } else {
      // This sub-skill doesn't normally require visuals, so simple guidance is sufficient
      return `
VISUAL GENERATION: FALSE
- Create a text-only question that can be fully answered without any visual aid
- Focus on the core sub-skill without visual components`;
    }
  }

  return `
VISUAL GENERATION: TRUE
- Create a question that requires the visual component to be answered
- Use one of these visual types: ${visualTypes?.join(', ') || 'any appropriate type'}

CRITICAL VISUAL REQUIREMENTS:
- visual_data: A detailed written description of the visual that explains what is shown, including all data points, labels, measurements, and visual elements
- visual_svg: Complete, precise SVG code that can be rendered exactly as intended with zero ambiguity

SVG CODE REQUIREMENTS:
- Must be completely self-contained with all necessary styling and definitions
- Include ALL data, labels, measurements, and visual elements needed to answer the question
- Do NOT include answers, solutions, clues, or guidance within the visual
- Include only what students need to see to solve the question independently
- Must be detailed enough that any graphic designer or AI system can render it perfectly without asking clarification questions
- Leave absolutely no room for interpretation or guesswork in the SVG implementation

VISUAL DESIGN SPECIFICATIONS:
- Dimensions: Width 300-450px, Height 250-350px
- Use Australian/UK spelling in any text within visuals
- Professional color scheme: Primary (#3498DB), Accent (#E74C3C), Text (#2C3E50)
- Clear, readable labels and measurements when referenced in question
- No assessment branding, meta-information, or identifying marks
- Use Arial/sans-serif fonts, sizes 11-14px for optimal readability
- Ensure high contrast and professional appearance
- Include proper CSS styles within <style> tags in the SVG

DATA COMPLETENESS:
- All numerical values must be clearly labeled and positioned
- All axes, gridlines, and reference points must be precisely defined
- All shapes, angles, and measurements must be exact and clearly marked
- Colors and styling must be consistent and purposeful`;
}

/**
 * Gets context diversity instructions based on generation context
 */
function getContextDiversityInstructions(context: GenerationContext, subSkill?: string): string {
  if (!context) {
    return '';
  }

  // Get recent questions for this sub-skill from the context
  // First check questionsBySubSkill (which is actually being populated)
  let recentQuestions: any[] = [];
  
  if (subSkill && context.questionsBySubSkill && context.questionsBySubSkill[subSkill]) {
    recentQuestions = context.questionsBySubSkill[subSkill].slice(-10);
  } else {
    // Fallback to generatedQuestions if available
    recentQuestions = context.generatedQuestions?.slice(-10) || [];
  }
  
  const questionExamples = recentQuestions.length > 0 
    ? recentQuestions.map((q, i) => `${i + 1}. ${(q.question_text || q.text || String(q)).substring(0, 150)}...`).join('\n')
    : 'No recent questions recorded yet';

  if (recentQuestions.length === 0) {
    return `
## 📝 QUESTION DIVERSITY
No recent questions in this sub-skill yet. Create an authentic, engaging question that fits the test requirements.`;
  }

  const diversityInstructions = `
## 🎯 INTELLIGENT QUESTION DIVERSITY

**RECENT QUESTIONS IN THIS SUB-SKILL:**
${questionExamples}

**💡 SMART DIVERSITY STRATEGY:**
Look at the recent questions above and consciously choose a completely different approach for:
- Main scenario/context 
- Opening phrase/structure
- Character names or abstract references
- Professional domain or subject matter
- Question format and presentation

**🎨 CREATIVITY MANDATE:**
Create something that would make a teacher say "This is refreshingly different from the other questions!" Focus on authentic variety while maintaining test appropriateness. Trust your intelligence to naturally vary elements like names, scenarios, contexts, examples, and numbers to create fresh, engaging questions.`;

  return diversityInstructions;
}

/**
 * Gets passage diversity instructions to prevent repetitive passage generation
 */
function getPassageDiversityInstructions(context: GenerationContext, requestedType: string): string {
  if (!context) {
    return '';
  }

  // Get recent passages from context
  const recentPassages = context.generatedPassages?.slice(-5) || [];
  const recentThemes = context.recentPassageThemes || [];
  const recentSettings = context.recentPassageSettings || [];
  const recentCharacters = context.recentPassageCharacters || [];
  const lastPassageType = context.lastPassageType;

  if (recentPassages.length === 0) {
    return `
## 📚 PASSAGE CREATION - FRESH START
This is the first passage in this generation session. Create an engaging ${requestedType} passage that establishes variety for future passages.`;
  }

  // Create preview of recent passages
  const passageExamples = recentPassages.length > 0 
    ? recentPassages.map((p, i) => {
        const content = p.content || p.text || String(p);
        const firstSentence = content.split('.')[0] + '.';
        return `${i + 1}. [${p.passage_type || p.type || 'unknown'}] "${p.title || 'Untitled'}" - ${firstSentence}`;
      }).join('\n')
    : 'No recent passages recorded yet';

  const avoidanceInstructions = `
## 🎯 PASSAGE DIVERSITY - AVOID REPETITION

**RECENT PASSAGES GENERATED:**
${passageExamples}

**🚫 CRITICAL AVOIDANCE - DO NOT REPEAT:**
${lastPassageType === requestedType ? `
⚠️  ALERT: The previous passage was also ${requestedType}! You MUST create something completely different.` : ''}

**THEMES TO AVOID:** ${recentThemes.length > 0 ? recentThemes.join(', ') : 'None recorded yet'}
**SETTINGS TO AVOID:** ${recentSettings.length > 0 ? recentSettings.join(', ') : 'None recorded yet'}  
**CHARACTER TYPES TO AVOID:** ${recentCharacters.length > 0 ? recentCharacters.join(', ') : 'None recorded yet'}

**✅ DIVERSITY REQUIREMENTS FOR ${requestedType.toUpperCase()}:**

1. **DIFFERENT OPENING:** Never start with similar phrases to recent passages
2. **FRESH THEMES:** Choose themes completely different from: ${recentThemes.slice(-3).join(', ') || 'previous passages'}
3. **NEW SETTINGS:** Avoid recently used settings like: ${recentSettings.slice(-3).join(', ') || 'previous locations'}
4. **VARIED CHARACTERS:** Use different character types from: ${recentCharacters.slice(-3).join(', ') || 'previous characters'}
5. **DISTINCT TONE/STYLE:** Create a noticeably different voice and approach

**🎨 CREATIVE MANDATE:**
Create a ${requestedType} passage that would make an educator say "This is refreshingly different from the others!" Focus on authentic variety in every element - topic, style, structure, and content approach.

**📝 SPECIFIC GUIDANCE:**
- Choose a completely different subject domain/topic area
- Use different character demographics and backgrounds
- Select a distinct geographical or cultural setting
- Employ varied sentence structures and paragraph organization
- Ensure the opening paragraph feels fresh and engaging`;

  return avoidanceInstructions;
}

/**
 * Gets approach-specific guidance based on the preferred approach
 */
function getApproachSpecificGuidance(approach: string, seed: number): { title: string; instruction: string } {
  const approaches = {
    abstract: {
      title: "ABSTRACT/CONCEPTUAL FOCUS",
      instruction: `Create a purely conceptual question without characters or stories. Focus on mathematical relationships, formulas, or logical reasoning. Examples: "Simplify the expression...", "Calculate the area of...", "What is the value of..."`
    },
    data_focused: {
      title: "DATA/MEASUREMENT FOCUS", 
      instruction: `Create a question based on data, measurements, or technical specifications. Use tables, graphs, or numerical relationships without personal contexts. Examples: "The table shows...", "A shape has dimensions...", "The graph displays..."`
    },
    minimal_context: {
      title: "MINIMAL CONTEXT APPROACH",
      instruction: `Use minimal, functional context that aids understanding without elaborate stories. Keep it simple and direct. Examples: "A recipe requires...", "Tickets cost...", "A cyclist travels..."`
    },
    real_world: {
      title: "REAL-WORLD APPLICATION",
      instruction: `Create a practical, real-world context that adds meaningful value to the question. The scenario should enhance understanding, not just provide decoration.`
    }
  };

  return approaches[approach as keyof typeof approaches] || approaches.abstract;
}

/**
 * Gets randomization directive to break patterns
 */
function getRandomizationDirective(seed: number, questionIndex: number): string {
  const directives = [
    "Use completely different numbers and measurements than typical examples",
    "Vary the question structure - start with data, a scenario, or a direct mathematical statement", 
    "Choose an unusual but appropriate context if using real-world elements",
    "Focus on a different mathematical operation or concept approach",
    "Use different units of measurement or scale (small vs large numbers)",
    "Vary the complexity level within the difficulty - some simple, some multi-step"
  ];
  
  const directiveIndex = (seed + questionIndex) % directives.length;
  return directives[directiveIndex];
}

/**
 * Gets question structure variety guidance to prevent formulaic patterns
 */
function getQuestionStructureGuidance(testType: string, sectionName: string): string {
  return `
📝 QUESTION STRUCTURE VARIETY - EMBRACE AUTHENTIC DIVERSITY:

🚫 NEVER USE REPETITIVE PATTERNS:
- Avoid "[Name] is [verb] in a [place]" format
- Don't force characters into every question
- Vary between abstract and contextual approaches
- Mix question types and structures naturally

✅ AUTHENTIC QUESTION STRUCTURES for ${testType}:

MATHEMATICS REASONING - Mix these approaches:

**ABSTRACT/CONCEPTUAL (often the clearest approach):**
• "Simplify the expression: 4x² - 3x + 7 - (2x² + x - 1)"
• "What is the value of 3/4 ÷ 2/3?"
• "A regular hexagon has a perimeter of 42 cm. What is the length of each side?"
• "If f(x) = 2x + 5, what is the value of f(3)?"

**DATA/MEASUREMENT (clear and practical):**
• "The table shows rainfall measurements for each month. What is the median rainfall?"
• "A rectangular prism has dimensions 8cm × 5cm × 3cm. Calculate its volume."
• "The graph displays population growth over 10 years. What was the percentage increase from Year 2 to Year 5?"

**MINIMAL CONTEXT (when story helps understanding):**
• "A recipe requires 3/4 cup of flour. How much flour is needed for 2.5 batches?"
• "Concert tickets cost $45 each. If 180 tickets are sold, what is the total revenue?"
• "A cyclist travels 24km in 90 minutes. What is their average speed in km/h?"

**REAL-WORLD APPLICATION (when context adds value):**
• "The local council plans to fence a rectangular park. If the park measures 80m by 45m and fencing costs $12 per metre, what is the total cost?"

READING REASONING - Based on passage content:
• "What is the main argument presented in paragraph 3?"
• "How does the author's use of metaphor contribute to the overall theme?"
• "Based on the evidence provided, what can be inferred about the character's motivation?"
• "Which statement best summarises the relationship between the two concepts discussed?"

KEY PRINCIPLES:
1. **Choose the clearest approach** - Don't add unnecessary complexity
2. **Abstract when possible** - Many math questions are cleaner without stories
3. **Context when helpful** - Use stories/characters only when they aid understanding
4. **Data-focused** - Tables, graphs, measurements often work well
5. **Variety in difficulty** - Simple direct questions AND multi-step problems
6. **Natural language** - Avoid artificial or forced scenarios

AUTHENTICITY CHECK:
Does this sound like a real ${testType} question? Is it as clear and direct as possible while testing the required skill?`;
}

/**
 * Gets writing-specific guidance to create simple task instructions
 */
function getWritingPromptGuidance(subSkill: string, testType: string): string {
  const taskInstructions = {
    'Creative Writing': 'Write a creative piece',
    'Persuasive Writing': 'Write a persuasive piece',
    'Narrative Writing': 'Write a narrative piece',
    'Expository Writing': 'Write an expository piece',
    'Descriptive Writing': 'Write a descriptive piece',
    'Reflective Writing': 'Write a reflective piece'
  };
  
  const simpleTask = taskInstructions[subSkill as keyof typeof taskInstructions] || 'Write a piece';
  
  return `
📝 WRITING SECTION REQUIREMENTS - SIMPLIFIED PROMPTS:

CRITICAL: This is a writing section. Create a simple, clear task instruction ONLY.

**WRITING PROMPT STYLE:**
- Provide ONLY the basic task instruction (e.g., "${simpleTask}")
- DO NOT include word count guidance
- DO NOT include content suggestions or what to include
- DO NOT provide structure guidance or tips
- DO NOT mention assessment criteria
- Keep the prompt minimal and task-focused

**TASK CLARITY:**
- The question_text should be a clear, simple writing task
- Students should understand exactly what type of writing is required
- No additional guidance beyond the basic task

**EXAMPLE FORMAT:**
"${simpleTask} about a topic of your choice."

**WHAT TO AVOID:**
- Word count requirements (e.g., "Write 300-400 words")
- Content guidance (e.g., "Include characters, setting, dialogue")
- Structure tips (e.g., "Use introduction, body, conclusion")
- Assessment criteria mentions
- Multiple instructions or complex requirements
`;
}

/**
 * Builds a prompt for individual question generation
 */
export function buildQuestionPrompt(request: SingleQuestionRequest): string {
  const {
    testType,
    sectionName,
    subSkill,
    difficulty,
    passageContent,
    generateVisual,
    generationContext
  } = request;

  const yearLevel = getYearLevel(testType);
  const difficultyCalibration = getDifficultyCalibration(testType, difficulty);
  const subSkillDescription = UNIFIED_SUB_SKILLS[subSkill]?.description || 'No description available';
  const visualRequired = UNIFIED_SUB_SKILLS[subSkill]?.visual_required || false;
  const testStructure = TEST_STRUCTURES[testType as keyof typeof TEST_STRUCTURES];
  const sectionStructure = testStructure?.[sectionName as keyof typeof testStructure];
  const responseType = sectionStructure && typeof sectionStructure === 'object' && 'format' in sectionStructure 
    ? ((sectionStructure as any).format === 'Written Response' ? 'extended_response' : 'multiple_choice')
    : 'multiple_choice';
  
  // Check if this is a writing section
  const isWritingSection = responseType === 'extended_response';
  
  // Get allowed visual types for this test/section/sub-skill
  const visualMapping = SUB_SKILL_VISUAL_MAPPING[testType as keyof typeof SUB_SKILL_VISUAL_MAPPING];
  const sectionMapping = visualMapping?.[sectionName as keyof typeof visualMapping];
  const subSkillMapping = sectionMapping && typeof sectionMapping === 'object' && subSkill in sectionMapping
    ? sectionMapping[subSkill as keyof typeof sectionMapping]
    : null;
  const allowedVisualTypes = subSkillMapping && typeof subSkillMapping === 'object' && 'visualTypes' in subSkillMapping
    ? subSkillMapping.visualTypes
    : [];

  const prompt = `You are an expert designer of Australian educational assessments with deep knowledge of ${testType}. Your task is to generate an authentic question that precisely replicates the difficulty, style, and format of real ${testType} examinations.

${getContextDiversityInstructions(generationContext, subSkill)}

CRITICAL REQUIREMENTS:
- Generate a question indistinguishable from real ${testType} questions
- Use UK/Australian spelling throughout ("colour", "realise", "centre", "metre", "analyse")
- Difficulty ${difficulty}: ${difficultyCalibration}
- Follow ${testType} question style and complexity exactly
- Create diverse, authentic question structures (NO formulaic patterns)

TEST SPECIFICATIONS:
- Test Type: ${testType}
- Year Level: ${yearLevel}
- Section: ${sectionName}
- Sub-skill: ${subSkill}
- Sub-skill Description: ${subSkillDescription}
- Difficulty Level: ${difficulty}
- Response Type: ${responseType}
- Visual Required: ${visualRequired}
- Generate Visual: ${generateVisual}
- Allowed Visual Types: ${allowedVisualTypes.join(', ') || 'none'}

${getTestAuthenticityGuidance(testType)}

${getQuestionStructureGuidance(testType, sectionName)}

${isWritingSection ? getWritingPromptGuidance(subSkill, testType) : ''}

${getVisualInstructions(generateVisual, subSkill, allowedVisualTypes)}

${passageContent ? `
PASSAGE REFERENCE:
This question must reference the following passage. Students will have read this passage and the question should test their understanding of it.

PASSAGE CONTENT:
${passageContent}

PASSAGE-BASED QUESTION REQUIREMENTS:
- Question must specifically reference content from the passage
- Cannot be answered without reading the passage
- Test the specific sub-skill in relation to the passage content
- Reference specific details, characters, events, or information from the passage
` : ''}

ANSWER OPTIONS & DISTRACTOR GENERATION (Multiple Choice Only):
- Exactly 4 options formatted as: A) option, B) option, C) option, D) option
- Ensure roughly even distribution of correct answers across A, B, C, D
- Avoid "All of the above" or "None of the above" unless authentic to this test type

🎯 DISTRACTOR QUALITY MANDATE - CRITICAL FOR VALID ASSESSMENT:
For each wrong answer option, you MUST ensure it is:
1. ✅ Plausible enough that a student might reasonably choose it
2. ✅ Definitively wrong - cannot be defended as correct under any interpretation
3. ✅ Based on common student errors, misconceptions, or logical mistakes
4. ✅ Clear and unambiguous in its incorrectness

🚫 FORBIDDEN DISTRACTOR TYPES - NEVER CREATE THESE:
- Answers that could be correct under different interpretations of the question
- Options that are "technically correct" in some contexts but wrong for this specific question
- Answers that require specialized outside knowledge to eliminate
- Mathematical results from reasonable alternative methods that could also be valid
- Partial answers that are "somewhat correct" or "on the right track"

✅ HIGH-QUALITY DISTRACTOR STRATEGIES BY SUBJECT:

**Mathematics:** Common calculation errors (wrong order of operations, sign errors, formula mistakes), reversed operations, using wrong formulas that seem logical
**Reading Comprehension:** Details from wrong parts of text, reasonable but unsupported inferences, confusing similar concepts from the passage
**Verbal Reasoning:** Relationships that sound logical but don't match the actual pattern, reversed analogies, category confusion
**Language Conventions:** Grammar rules that apply in other contexts but not this specific case, common spelling mistakes, punctuation confusion

🔍 MANDATORY SELF-CHECK BEFORE FINALIZING:
Before completing your response, ask yourself for each wrong option:
"Could a knowledgeable teacher or student defend this answer as potentially correct?"
If YES to any option: Revise that distractor until it's clearly wrong but still plausible.

DISTRACTOR AUTHENTICITY FOR ${testType}:
- Use errors that Year ${yearLevel} students commonly make in ${sectionName}
- Avoid obvious "throwaway" options that no student would choose
- Make distractors challenging enough to differentiate student ability levels

${!isWritingSection ? `
FINAL QUALITY CONTROL - MANDATORY SELF-VERIFICATION:
Before completing your response, work through this checklist:

🔍 ANSWER UNIQUENESS CHECK:
✅ EXACTLY ONE CORRECT ANSWER: Verify only one option is definitively correct
✅ DISTRACTOR VERIFICATION: Re-read each wrong answer and confirm it cannot be defended as correct
✅ NO AMBIGUITY: Question has only one reasonable interpretation
✅ AUTHENTIC FOR ${testType}: Question style, difficulty, and content match real ${testType} standards

🔍 MATHEMATICAL/LOGICAL ACCURACY CHECK (if applicable):
✅ CALCULATION VERIFICATION: Double-check all mathematical work step-by-step
✅ FORMULA ACCURACY: Ensure correct formulas and procedures are used
✅ LOGICAL CONSISTENCY: Answer follows logically from given information
✅ REASONABLE RESULT: Answer makes sense in the context of the problem

🚨 REGENERATION FLAGS (use "VALIDATION_FLAG" if ANY apply):
- You cannot confidently verify that exactly one answer is correct
- Your calculated answer doesn't match any of the 4 options you created
- You feel uncertain about the mathematical or logical correctness
- The question seems to have no valid solution or multiple valid solutions
- You notice any contradictions between question, options, and solution

ENHANCED SOLUTION FORMAT - MANDATORY STRUCTURE:
Your solution must follow this EXACT format to provide educational value:

**Correct Answer: [Letter]**
[Brief, clear explanation of why this answer is correct]

**Why Other Options Are Wrong:**
- A: [Specific reason why this option is incorrect]
- B: [Specific reason why this option is incorrect]  
- C: [Specific reason why this option is incorrect]
- D: [Specific reason why this option is incorrect]
(Note: Skip the letter that is correct)

**Tips for Similar Questions:**
• [Specific strategy or technique for this type of question]
• [Pattern recognition or approach that helps with similar problems]  
• [Common mistake to avoid or verification method]

EDUCATIONAL TIP EXAMPLES FOR ${sectionName} - ${subSkill}:
${formatTipsForExplanation(selectRelevantTips(sectionName, subSkill))}

SOLUTION REQUIREMENTS:
- Start with "VALIDATION_FLAG" if any validation issues detected
- Use the structured format above for ALL solutions
- Provide specific, actionable tips that transfer to similar questions
- Focus on teaching strategy, not just explaining this specific answer
- Make tips appropriate for Year ${yearLevel} students taking ${testType}
` : `
WRITING SECTION REQUIREMENTS:
- Provide a simple, clear task instruction only
- Do not include validation flags for writing prompts
- Keep the prompt focused and appropriate for the target year level
`}

OUTPUT FORMAT:
Return ONLY a valid JSON object with these exact fields:
{
  "question_text": "Complete question text",
  "answer_options": ${responseType === 'multiple_choice' ? '["A) option", "B) option", "C) option", "D) option"]' : 'null'},
  "correct_answer": ${responseType === 'multiple_choice' ? '"A"' : 'null'},
  "solution": "Clear explanation of the correct answer and reasoning",
  "has_visual": ${generateVisual},
  "visual_type": ${generateVisual ? '"chart_type or null"' : 'null'},
  "visual_data": ${generateVisual ? '"Detailed written description of what the visual shows - all data points, labels, measurements, and visual elements described in words"' : 'null'},
  "visual_svg": ${generateVisual ? '"Complete, precise SVG code that renders exactly as intended with all data, labels, and measurements but NO answers or clues"' : 'null'}
}

IMPORTANT: Return ONLY the JSON object, no additional text or formatting.`;

  return prompt;
}

/**
 * Builds a prompt for passage generation
 */
export function buildPassagePrompt(request: PassageGenerationRequest): string {
  const {
    testType,
    sectionName,
    wordCount,
    difficulty,
    passageType,
    generationContext
  } = request;

  const yearLevel = getYearLevel(testType);
  const difficultyCalibration = getDifficultyCalibration(testType, difficulty);

  // Get style-specific guidance
  let styleGuidance = '';
  let contentRequirements = '';
  
  if (passageType === 'narrative') {
    styleGuidance = `
NARRATIVE STYLE REQUIREMENTS FOR ${testType} (Year ${yearLevel}):
- Write engaging narrative text with story elements
- Use descriptive language and sensory details where appropriate  
- May include dialogue, character thoughts, or interactions
- Can be a complete story, story excerpt, or narrative account
- Use narrative techniques suitable for Year ${yearLevel} reading level
- Include literary devices as appropriate (imagery, metaphor, etc.)
- Create engaging content that draws readers into the narrative world`;

    contentRequirements = `
NARRATIVE CONTENT FOR ${testType}:
- Characters in interesting or meaningful situations
- Clear sense of setting and context
- Engaging content appropriate for Year ${yearLevel} students
- Themes and situations that resonate with the target age group
- Natural character development or plot progression as appropriate`;

  } else if (passageType === 'informational') {
    styleGuidance = `
INFORMATIONAL STYLE REQUIREMENTS FOR ${testType} (Year ${yearLevel}):
- Present information clearly and objectively
- Use authoritative tone appropriate for educational content
- Organize information logically with clear structure
- Include facts, examples, or evidence as relevant
- Use vocabulary and complexity suitable for Year ${yearLevel}
- Explain concepts and relationships clearly`;

    contentRequirements = `
INFORMATIONAL CONTENT FOR ${testType}:
- Educational topics appropriate for Year ${yearLevel} comprehension
- Factual information about processes, discoveries, or phenomena
- Content that can support analytical and comprehension questions
- Topics that engage and inform the target age group
- Clear explanations and relevant examples`;

  } else { // persuasive
    styleGuidance = `
PERSUASIVE STYLE REQUIREMENTS FOR ${testType} (Year ${yearLevel}):
- Present a clear viewpoint or argument
- Use persuasive language and techniques appropriately
- Build arguments with supporting evidence or reasoning
- Engage readers with the topic and position
- Use tone and approach suitable for Year ${yearLevel} audience`;

    contentRequirements = `
PERSUASIVE CONTENT FOR ${testType}:
- Issues or topics relevant to Year ${yearLevel} students
- Clear position that can be supported with reasoning
- Arguments that appeal to the target age group
- Content that encourages critical thinking about the topic
- Viewpoints that are engaging and thought-provoking`;
  }

  const prompt = `You are an expert creator of educational assessment passages with deep knowledge of ${testType}. Your task is to create an authentic reading passage that precisely matches the style, complexity, and content of real ${testType} examinations.

PASSAGE TYPE: ${passageType.toUpperCase()}
TARGET WORD COUNT: ${wordCount} words (±10% tolerance = ${Math.floor(wordCount * 0.9)}-${Math.ceil(wordCount * 1.1)} words)
TEST TYPE: ${testType}
YEAR LEVEL: ${yearLevel}
DIFFICULTY ${difficulty}: ${difficultyCalibration}

${styleGuidance}

${contentRequirements}

CRITICAL REQUIREMENTS:
- Create a passage indistinguishable from real ${testType} reading passages
- Match the authentic style and complexity expected for ${testType}
- Use UK/Australian spelling throughout ("colour", "realise", "centre", "metre", "analyse")
- Write authentic ${passageType} text that naturally fits the style
- Content must be engaging and appropriate for Year ${yearLevel} students
- Must support multiple comprehension question types
- WORD COUNT: Must be between ${Math.floor(wordCount * 0.9)} and ${Math.ceil(wordCount * 1.1)} words (±10% of ${wordCount})

${getTestAuthenticityGuidance(testType)}

${getPassageDiversityInstructions(generationContext, passageType)}

CONTENT FLEXIBILITY:
- Draw from diverse global settings, cultures, and perspectives
- Use topics and contexts that are engaging and relevant
- Include diverse character names from various cultural backgrounds
- Focus on universal themes and concepts
- Ensure content is accessible to diverse readers

QUALITY STANDARDS:
- Age-appropriate content for Year ${yearLevel} students
- Engaging and intellectually stimulating topics
- Clear, well-structured writing
- Content that naturally supports comprehension questions
- Authentic voice and style for the chosen passage type

OUTPUT FORMAT:
Return ONLY a valid JSON object with these exact fields:
{
  "title": "Engaging ${passageType} passage title",
  "content": "Complete passage content between ${Math.floor(wordCount * 0.9)}-${Math.ceil(wordCount * 1.1)} words written in authentic ${passageType} style",
  "word_count": [actual_word_count_of_content],
  "main_themes": ["specific theme1", "specific theme2", "specific theme3"],
  "key_characters": ["character1", "character2"] or [],
  "setting": "Description of time and place",
  "potential_question_topics": ["comprehension topic1", "analysis topic2", "vocabulary topic3", "inference topic4", "structure topic5"]
}

IMPORTANT: 
- Count the actual words in your content carefully
- Ensure word_count field matches the actual word count of the content
- Stay within the ${Math.floor(wordCount * 0.9)}-${Math.ceil(wordCount * 1.1)} word range
- Return ONLY the JSON object, no additional text or formatting.`;

  return prompt;
}

/**
 * Gets the Claude API key from environment variables
 * Works in both Vite (import.meta.env) and Node.js (process.env) environments
 */
function getClaudeAPIKey(): string | undefined {
  // Check Vite environment first
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.VITE_CLAUDE_API_KEY;
  }
  
  // Fall back to Node.js environment
  if (typeof process !== 'undefined' && process.env) {
    return process.env.VITE_CLAUDE_API_KEY || process.env.CLAUDE_API_KEY;
  }
  
  return undefined;
}

/**
 * Makes a call to Claude API with proper error handling
 */
export async function callClaudeAPI(prompt: string): Promise<ClaudeAPIResponse> {
  const API_KEY = getClaudeAPIKey();
  
  if (!API_KEY) {
    throw new Error('Claude API key not found in environment variables');
  }

  const request: ClaudeAPIRequest = {
    model: "claude-sonnet-4-20250514",
    max_tokens: 6000,
    messages: [
      {
        role: "user",
        content: prompt
      }
    ]
  };

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    return data as ClaudeAPIResponse;
  } catch (error) {
    console.error('Claude API call failed:', error);
    throw error;
  }
}

/**
 * Makes a Claude API call with retry logic
 */
export async function callClaudeAPIWithRetry(
  prompt: string,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<ClaudeAPIResponse> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await callClaudeAPI(prompt);
      return response;
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        break;
      }

      // Exponential backoff
      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      console.warn(`Claude API attempt ${attempt} failed, retrying in ${delay}ms:`, error);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error(`Claude API failed after ${maxRetries} attempts. Last error: ${lastError.message}`);
}

/**
 * Parses Claude API response and extracts JSON content
 */
export function parseClaudeResponse(response: ClaudeAPIResponse): any {
  if (!response.content || response.content.length === 0) {
    throw new Error('Claude API response contains no content');
  }

  const textContent = response.content[0]?.text;
  if (!textContent) {
    throw new Error('Claude API response text content is empty');
  }

  try {
    // Try to extract JSON from the response
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON object found in Claude response');
    }

    const jsonString = jsonMatch[0];
    const parsedJson = JSON.parse(jsonString);
    
    return parsedJson;
  } catch (error) {
    console.error('Failed to parse Claude response as JSON:', textContent);
    throw new Error(`Failed to parse Claude response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Gets usage statistics from Claude API response
 */
export function getClaudeUsageStats(response: ClaudeAPIResponse): {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
} {
  const usage = response.usage;
  
  return {
    inputTokens: usage?.input_tokens || 0,
    outputTokens: usage?.output_tokens || 0,
    totalTokens: (usage?.input_tokens || 0) + (usage?.output_tokens || 0)
  };
}

/**
 * Validates Claude API configuration
 */
export function validateClaudeConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const apiKey = getClaudeAPIKey();
  if (!apiKey) {
    errors.push('VITE_CLAUDE_API_KEY environment variable is not set');
  }

  // Test API key format (should start with 'sk-')
  if (apiKey && !apiKey.startsWith('sk-ant-')) {
    errors.push('Claude API key format appears invalid (should start with sk-ant-)');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Estimates token count for a prompt (rough approximation)
 */
export function estimateTokenCount(text: string): number {
  // Rough approximation: 1 token ≈ 4 characters for English text
  return Math.ceil(text.length / 4);
}

/**
 * Builds a test prompt for verifying Claude API connectivity
 */
export function buildTestPrompt(): string {
  return `Please respond with exactly this JSON object:
{
  "status": "connected",
  "timestamp": "${new Date().toISOString()}"
}`;
}

/**
 * Gets specific prompt enhancements based on test type and section
 */
export function getTestSpecificEnhancements(testType: string, sectionName: string): string {
  const enhancements = {
    'VIC Selective Entry (Year 9 Entry)': {
      'Mathematics Reasoning': 'Include sophisticated mathematical reasoning with multi-step solutions',
      'Reading Reasoning': 'Use complex literary and informational texts with nuanced comprehension',
      'General Ability - Verbal': 'Include advanced vocabulary and abstract reasoning',
      'General Ability - Quantitative': 'Focus on pattern recognition and logical mathematical thinking',
      'Writing': 'Expect sophisticated written expression with complex ideas and structure'
    },
    'NSW Selective Entry (Year 7 Entry)': {
      'Mathematical Reasoning': 'Balance computational skills with problem-solving strategies',
      'Reading': 'Include both literary and informational texts with analytical questions',
      'Thinking Skills': 'Emphasize logical reasoning and spatial thinking',
      'Writing': 'Focus on clear communication and structured argument development'
    }
  };

  const testEnhancements = enhancements[testType as keyof typeof enhancements];
  if (testEnhancements) {
    const sectionEnhancement = testEnhancements[sectionName as keyof typeof testEnhancements];
    if (sectionEnhancement) {
      return `\nTEST-SPECIFIC ENHANCEMENT: ${sectionEnhancement}`;
    }
  }

  return '';
}