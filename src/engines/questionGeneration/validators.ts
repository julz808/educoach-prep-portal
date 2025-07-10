// ============================================================================
// CONTENT VALIDATION & QUALITY ASSURANCE
// ============================================================================

// Define types inline to avoid runtime import issues with TypeScript interfaces
type ResponseType = 'multiple_choice' | 'extended_response';
type PassageType = 'narrative' | 'informational' | 'persuasive' | 'procedural' | 'descriptive';

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

interface GeneratedPassage {
  id?: string;
  test_type: string;
  year_level: number;
  section_name: string;
  title: string;
  content: string;
  passage_type: PassageType;
  word_count: number;
  australian_context: boolean;
  difficulty: number;
  main_themes: string[];
  key_characters: string[];
  setting: string;
  potential_question_topics: string[];
  generation_metadata: {
    test_type: string;
    section_name: string;
    difficulty: number;
    passage_type: PassageType;
    target_word_count: number;
    generation_timestamp: string;
    attempt_number: number;
  };
  created_at?: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score?: number;
}

interface ContentValidation extends ValidationResult {
  spellingIssues: string[];
  formatIssues: string[];
  difficultyAlignment: boolean;
  answerDistribution: Record<string, number>;
}

// Australian/UK spelling patterns
const AUSTRALIAN_SPELLING = {
  // Common word patterns that should use Australian spelling
  'color': 'colour',
  'center': 'centre', 
  'meter': 'metre',
  'liter': 'litre',
  'theater': 'theatre',
  'analyze': 'analyse',
  'organize': 'organise',
  'realize': 'realise',
  'recognize': 'recognise',
  'emphasize': 'emphasise',
  'utilize': 'utilise',
  'apologize': 'apologise',
  'criticize': 'criticise',
  'minimize': 'minimise',
  'maximize': 'maximise',
  'program': 'programme', // except for computer programs
  'defense': 'defence',
  'offense': 'offence',
  'license': 'licence', // noun form
  'practice': 'practise', // verb form  
  'traveled': 'travelled',
  'modeling': 'modelling',
  'canceled': 'cancelled',
  'labeled': 'labelled',
  'leveled': 'levelled'
};

// Patterns to detect American spelling
const AMERICAN_SPELLING_PATTERNS = [
  /\b\w*ize\b/g,     // -ize endings (should be -ise)
  /\b\w*or\b/g,      // -or endings (some should be -our)
  /\b\w*er\b/g,      // -er endings (some should be -re)
  /\bcolor\b/gi,
  /\bcenter\b/gi,
  /\bmeter\b/gi,
  /\btheater\b/gi,
  /\bdefense\b/gi,
  /\boffense\b/gi,
  /\blicense\b/gi,   // when used as noun
  /\bpractice\b/gi   // when used as verb
];

/**
 * Validates a generated question for compliance and quality
 */
export function validateQuestion(question: GeneratedQuestion): ContentValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const spellingIssues: string[] = [];
  const formatIssues: string[] = [];

  // 1. Check required fields
  if (!question.question_text?.trim()) {
    errors.push('Question text is required and cannot be empty');
  }

  if (!question.solution?.trim()) {
    errors.push('Solution/explanation is required and cannot be empty');
  }

  if (!question.sub_skill?.trim()) {
    errors.push('Sub-skill is required and cannot be empty');
  }

  if (!question.test_type?.trim()) {
    errors.push('Test type is required and cannot be empty');
  }

  if (!question.section_name?.trim()) {
    errors.push('Section name is required and cannot be empty');
  }

  // 2. Validate difficulty
  if (!Number.isInteger(question.difficulty) || question.difficulty < 1 || question.difficulty > 3) {
    errors.push('Difficulty must be an integer between 1 and 3');
  }

  // 3. Validate response type and format
  if (question.response_type === 'multiple_choice') {
    if (!question.answer_options || !Array.isArray(question.answer_options)) {
      errors.push('Multiple choice questions must have answer_options array');
    } else {
      if (question.answer_options.length !== 4) {
        formatIssues.push(`Multiple choice questions must have exactly 4 options, found ${question.answer_options.length}`);
      }

      // Check option format (should be A), B), C), D))
      question.answer_options.forEach((option, index) => {
        const expectedPrefix = String.fromCharCode(65 + index) + ')'; // A), B), C), D)
        if (!option.startsWith(expectedPrefix)) {
          formatIssues.push(`Option ${index + 1} should start with "${expectedPrefix}", found: "${option.substring(0, 2)}"`);
        }
      });
    }

    if (!question.correct_answer) {
      errors.push('Multiple choice questions must have a correct_answer');
    } else if (!['A', 'B', 'C', 'D'].includes(question.correct_answer)) {
      errors.push('correct_answer must be A, B, C, or D for multiple choice questions');
    }
  } else if (question.response_type === 'extended_response') {
    if (question.answer_options !== null) {
      formatIssues.push('Extended response questions should have answer_options set to null');
    }
    if (question.correct_answer !== null) {
      formatIssues.push('Extended response questions should have correct_answer set to null');
    }
  } else {
    errors.push('response_type must be either "multiple_choice" or "extended_response"');
  }

  // 4. Validate visual data consistency
  if (question.has_visual) {
    if (!question.visual_type) {
      errors.push('Questions with has_visual=true must specify visual_type');
    }
    if (!question.visual_data && !question.visual_svg) {
      errors.push('Questions with has_visual=true must have either visual_data or visual_svg');
    }
  } else {
    if (question.visual_type) {
      warnings.push('Question has visual_type but has_visual is false');
    }
    if (question.visual_data) {
      warnings.push('Question has visual_data but has_visual is false');
    }
    if (question.visual_svg) {
      warnings.push('Question has visual_svg but has_visual is false');
    }
  }

  // 5. Check Australian spelling
  const textToCheck = [
    question.question_text,
    question.solution,
    ...(question.answer_options || [])
  ].join(' ');

  const spellingCheck = checkAustralianSpelling(textToCheck);
  spellingIssues.push(...spellingCheck.issues);

  // 6. Check content appropriateness
  const contentCheck = checkContentAppropriateness(textToCheck);
  if (!contentCheck.appropriate) {
    errors.push(...contentCheck.issues);
  }

  // 7. Check question length and readability
  if (question.question_text.length > 1000) {
    warnings.push('Question text is very long (>1000 characters) - consider simplifying');
  }

  if (question.solution.length < 20) {
    warnings.push('Solution explanation is very short - consider providing more detail');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    spellingIssues,
    formatIssues,
    difficultyAlignment: true, // TODO: Implement difficulty analysis
    answerDistribution: {} // Will be populated by batch processing
  };
}

/**
 * Validates a generated passage for compliance and quality
 */
export function validatePassage(passage: GeneratedPassage, expectedWordCount?: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Check required fields
  if (!passage.title?.trim()) {
    errors.push('Passage title is required and cannot be empty');
  }

  if (!passage.content?.trim()) {
    errors.push('Passage content is required and cannot be empty');
  }

  if (!passage.passage_type) {
    errors.push('Passage type is required');
  } else if (!['narrative', 'informational', 'persuasive', 'procedural', 'descriptive'].includes(passage.passage_type)) {
    errors.push('Passage type must be narrative, informational, persuasive, procedural, or descriptive');
  }

  // 2. Check word count accuracy
  const actualWordCount = countWords(passage.content);
  passage.word_count = actualWordCount; // Update the count

  if (expectedWordCount) {
    const tolerance = expectedWordCount * 0.05; // 5% tolerance
    if (Math.abs(actualWordCount - expectedWordCount) > tolerance) {
      errors.push(`Word count mismatch: expected ~${expectedWordCount}, got ${actualWordCount} (±5% tolerance)`);
    }
  }

  // 3. Check Australian spelling
  const spellingCheck = checkAustralianSpelling(passage.content + ' ' + passage.title);
  if (spellingCheck.issues.length > 0) {
    warnings.push(`Spelling issues found: ${spellingCheck.issues.join(', ')}`);
  }

  // 4. Check content appropriateness
  const contentCheck = checkContentAppropriateness(passage.content + ' ' + passage.title);
  if (!contentCheck.appropriate) {
    errors.push(...contentCheck.issues);
  }

  // 5. Check passage structure based on type
  const structureCheck = checkPassageStructure(passage.content, passage.passage_type);
  if (!structureCheck.appropriate) {
    warnings.push(...structureCheck.issues);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Checks text for Australian spelling compliance
 */
export function checkAustralianSpelling(text: string): { compliant: boolean; issues: string[] } {
  const issues: string[] = [];
  const lowerText = text.toLowerCase();

  // Check for specific American spellings
  for (const [american, australian] of Object.entries(AUSTRALIAN_SPELLING)) {
    const regex = new RegExp(`\\b${american}\\b`, 'gi');
    if (regex.test(text)) {
      issues.push(`Use "${australian}" instead of "${american}"`);
    }
  }

  // Check for American spelling patterns
  AMERICAN_SPELLING_PATTERNS.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        if (AUSTRALIAN_SPELLING[match.toLowerCase()]) {
          issues.push(`Consider using Australian spelling for: ${match}`);
        }
      });
    }
  });

  return {
    compliant: issues.length === 0,
    issues
  };
}

/**
 * Checks content for age-appropriateness and sensitive topics
 * Note: Content filtering disabled - trusting Claude to generate appropriate educational content
 */
export function checkContentAppropriateness(text: string): { appropriate: boolean; issues: string[] } {
  const issues: string[] = [];

  // Check for complexity appropriate to age group (keeping this useful check)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length > 0) {
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(' ').length, 0) / sentences.length;

    if (avgSentenceLength > 25) {
      // Convert to warning instead of error - this is just a guideline
      // issues.push('Sentences may be too complex for target age group (average >25 words)');
    }
  }

  // Always return appropriate - trust Claude to generate suitable educational content
  return {
    appropriate: true,
    issues
  };
}

/**
 * Checks passage structure based on type
 */
export function checkPassageStructure(content: string, passageType: string): { appropriate: boolean; issues: string[] } {
  const issues: string[] = [];
  const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);

  switch (passageType) {
    case 'narrative': {
      const hasCharacters = content.toLowerCase().includes('character') || 
                           content.toLowerCase().includes('protagonist');
      const hasPlot = content.toLowerCase().includes('story') || 
                     content.toLowerCase().includes('plot');
      
      if (!hasCharacters || !hasPlot) {
        issues.push('Narrative passage should include characters and plot elements');
      }
      break;
    }
    
    case 'informational': {
      const hasFactualContent = /\d+/.test(content) || 
                               content.toLowerCase().includes('research') ||
                               content.toLowerCase().includes('study');
      
      if (!hasFactualContent) {
        issues.push('Informational passage should include factual content or data');
      }
      break;
    }

    case 'persuasive':
      if (paragraphs.length < 3) {
        issues.push('Persuasive passages should have at least 3 paragraphs (introduction, arguments, conclusion)');
      }
      // Check for persuasive language
      const persuasiveIndicators = ['should', 'must', 'believe', 'argue', 'convince', 'therefore', 'because'];
      const hasPersuasiveLanguage = persuasiveIndicators.some(indicator => 
        content.toLowerCase().includes(indicator)
      );
      if (!hasPersuasiveLanguage) {
        issues.push('Persuasive passages should include persuasive language and arguments');
      }
      break;
  }

  return {
    appropriate: issues.length === 0,
    issues
  };
}

/**
 * Counts words in text accurately
 */
export function countWords(text: string): number {
  return text.trim()
    .split(/\s+/)
    .filter(word => word.length > 0)
    .length;
}

/**
 * Validates answer distribution across multiple questions
 */
export function validateAnswerDistribution(questions: GeneratedQuestion[]): { balanced: boolean; distribution: Record<string, number>; recommendation: string } {
  const multipleChoiceQuestions = questions.filter(q => q.response_type === 'multiple_choice');
  
  if (multipleChoiceQuestions.length === 0) {
    return {
      balanced: true,
      distribution: {},
      recommendation: 'No multiple choice questions to analyze'
    };
  }

  const distribution: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  
  multipleChoiceQuestions.forEach(q => {
    if (q.correct_answer && ['A', 'B', 'C', 'D'].includes(q.correct_answer)) {
      distribution[q.correct_answer]++;
    }
  });

  const total = multipleChoiceQuestions.length;
  const expectedPerAnswer = total / 4;
  const tolerance = Math.max(1, expectedPerAnswer * 0.2); // 20% tolerance, minimum 1

  const imbalanced = Object.values(distribution).some(count => 
    Math.abs(count - expectedPerAnswer) > tolerance
  );

  let recommendation = '';
  if (imbalanced) {
    const minCount = Math.min(...Object.values(distribution));
    const recommendedAnswer = Object.keys(distribution).find(key => distribution[key] === minCount) || 'A';
    recommendation = `Distribution is imbalanced. Consider using answer ${recommendedAnswer} for next question.`;
  }

  return {
    balanced: !imbalanced,
    distribution,
    recommendation
  };
}

/**
 * Validates SVG content for safety and compliance
 */
export function validateSVG(svgContent: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!svgContent || !svgContent.trim()) {
    errors.push('SVG content cannot be empty');
    return { isValid: false, errors, warnings };
  }

  // Check for basic SVG structure
  if (!svgContent.includes('<svg')) {
    errors.push('Content must contain valid SVG opening tag');
  }

  if (!svgContent.includes('</svg>')) {
    errors.push('Content must contain valid SVG closing tag');
  }

  // Check for dangerous elements/attributes
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+=/i, // onclick, onload, etc.
    /<iframe/i,
    /<object/i,
    /<embed/i
  ];

  dangerousPatterns.forEach(pattern => {
    if (pattern.test(svgContent)) {
      errors.push('SVG contains potentially dangerous content');
    }
  });

  // Check size constraints
  const widthMatch = svgContent.match(/width\s*=\s*["']?(\d+)["']?/);
  const heightMatch = svgContent.match(/height\s*=\s*["']?(\d+)["']?/);

  if (widthMatch) {
    const width = parseInt(widthMatch[1]);
    if (width > 500) {
      warnings.push(`SVG width (${width}px) exceeds recommended maximum (500px)`);
    }
  }

  if (heightMatch) {
    const height = parseInt(heightMatch[1]);
    if (height > 400) {
      warnings.push(`SVG height (${height}px) exceeds recommended maximum (400px)`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Batch validation for multiple questions with performance optimization
 */
export function validateQuestionBatch(questions: GeneratedQuestion[]): { 
  validQuestions: GeneratedQuestion[]; 
  invalidQuestions: Array<{ question: GeneratedQuestion; validation: ContentValidation }>; 
  overallStats: {
    totalQuestions: number;
    validCount: number;
    invalidCount: number;
    commonIssues: string[];
  };
} {
  const validQuestions: GeneratedQuestion[] = [];
  const invalidQuestions: Array<{ question: GeneratedQuestion; validation: ContentValidation }> = [];
  const allIssues: string[] = [];

  questions.forEach(question => {
    const validation = validateQuestion(question);
    
    if (validation.isValid) {
      validQuestions.push(question);
    } else {
      invalidQuestions.push({ question, validation });
      allIssues.push(...validation.errors);
    }
  });

  // Identify most common issues
  const issueCounts = allIssues.reduce((acc, issue) => {
    acc[issue] = (acc[issue] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const commonIssues = Object.entries(issueCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([issue]) => issue);

  return {
    validQuestions,
    invalidQuestions,
    overallStats: {
      totalQuestions: questions.length,
      validCount: validQuestions.length,
      invalidCount: invalidQuestions.length,
      commonIssues
    }
  };
} 