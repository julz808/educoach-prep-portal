// EduCourse Curriculum Data - Authoritative Source of Truth
// Updated with definitive test structures, sections, sub-skills, and requirements

export const TEST_STRUCTURES = {
  "Year 5 NAPLAN": {
    "Reading": {
      "questions": "40-45", 
      "time": 50, 
      "format": "Multiple choice"
    },
    "Writing": {
      "questions": "1", 
      "time": 40, 
      "format": "Extended response"
    },
    "Language Conventions": {
      "questions": "50-55", 
      "time": 45, 
      "format": "Multiple choice"
    },
    "Numeracy": {
      "questions": "35-40", 
      "time": 50, 
      "format": "Multiple choice"
    }
  },
  "Year 7 NAPLAN": {
    "Reading": {
      "questions": "45-50", 
      "time": 65, 
      "format": "Multiple choice"
    },
    "Writing": {
      "questions": "1", 
      "time": 40, 
      "format": "Extended response"
    },
    "Language Conventions": {
      "questions": "60-65", 
      "time": 45, 
      "format": "Multiple choice"
    },
    "Numeracy": {
      "questions": "45-50", 
      "time": 65, 
      "format": "Multiple choice"
    }
  },
  "ACER Scholarship (Year 7 Entry)": {
    "Reading Comprehension": {
      "questions": "30", 
      "time": 30, 
      "format": "Multiple choice"
    },
    "Mathematics": {
      "questions": "25", 
      "time": 30, 
      "format": "Multiple choice"
    },
    "Written Expression": {
      "questions": "2", 
      "time": 30, 
      "format": "Extended response"
    },
    "Thinking Skills": {
      "questions": "30", 
      "time": 30, 
      "format": "Multiple choice"
    }
  },
  "EduTest Scholarship (Year 7 Entry)": {
    "Reading Comprehension": {
      "questions": "40", 
      "time": 30, 
      "format": "Multiple choice"
    },
    "Mathematics": {
      "questions": "30", 
      "time": 30, 
      "format": "Multiple choice"
    },
    "Verbal Reasoning": {
      "questions": "30", 
      "time": 30, 
      "format": "Multiple choice"
    },
    "Numerical Reasoning": {
      "questions": "30", 
      "time": 30, 
      "format": "Multiple choice"
    },
    "Written Expression": {
      "questions": "1-2", 
      "time": 30, 
      "format": "Extended response"
    }
  },
  "NSW Selective Entry (Year 7 Entry)": {
    "Reading": {
      "questions": "40", 
      "time": 40, 
      "format": "Multiple choice"
    },
    "Mathematical Reasoning": {
      "questions": "40", 
      "time": 40, 
      "format": "Multiple choice"
    },
    "Thinking Skills": {
      "questions": "40", 
      "time": 40, 
      "format": "Multiple choice"
    },
    "Writing": {
      "questions": "1", 
      "time": 30, 
      "format": "Extended response"
    }
  },
  "VIC Selective Entry (Year 9 Entry)": {
    "Reading Reasoning": {
      "questions": "30", 
      "time": 45, 
      "format": "Multiple choice"
    },
    "Mathematical Reasoning": {
      "questions": "30", 
      "time": 45, 
      "format": "Multiple choice"
    },
    "Verbal Reasoning": {
      "questions": "30", 
      "time": 45, 
      "format": "Multiple choice"
    },
    "Quantitative Reasoning": {
      "questions": "30", 
      "time": 45, 
      "format": "Multiple choice"
    },
    "Written Expression": {
      "questions": "2", 
      "time": 60, 
      "format": "Extended response"
    }
  }
} as const;

// Unified sub-skills with visual requirements as specified in the authoritative data
export const UNIFIED_SUB_SKILLS = {
  // Year 5 NAPLAN - Reading
  "Text comprehension": {
    "description": "Understanding and interpreting written text",
    "visual_required": false
  },
  "Identifying main ideas": {
    "description": "Recognizing the central themes and key points in text",
    "visual_required": false
  },
  "Making inferences": {
    "description": "Drawing logical conclusions from textual evidence",
    "visual_required": false
  },
  "Understanding vocabulary in context": {
    "description": "Determining word meanings within textual context",
    "visual_required": false
  },
  "Analyzing text structure": {
    "description": "Understanding how texts are organized and structured",
    "visual_required": false
  },
  "Cause and effect relationships": {
    "description": "Identifying causal connections in text",
    "visual_required": false
  },
  "Drawing conclusions": {
    "description": "Making logical deductions from textual information",
    "visual_required": false
  },

  // Year 5 NAPLAN - Writing
  "Narrative writing": {
    "description": "Creating stories and narrative texts",
    "visual_required": false
  },
  "Persuasive writing": {
    "description": "Writing to convince and influence readers",
    "visual_required": false
  },

  // Year 5 NAPLAN - Language Conventions
  "Spelling": {
    "description": "Correct spelling of words",
    "visual_required": false
  },
  "Grammar": {
    "description": "Understanding and applying grammatical rules",
    "visual_required": false
  },
  "Punctuation": {
    "description": "Correct use of punctuation marks",
    "visual_required": false
  },
  "Sentence structure": {
    "description": "Building well-formed sentences",
    "visual_required": false
  },
  "Vocabulary knowledge": {
    "description": "Understanding word meanings and usage",
    "visual_required": false
  },

  // Year 5 NAPLAN - Numeracy
  "Number and place value": {
    "description": "Understanding number concepts and place value",
    "visual_required": false
  },
  "Number operations": {
    "description": "Performing mathematical operations with numbers",
    "visual_required": false
  },
  "Fractions and decimals": {
    "description": "Working with fractional and decimal numbers",
    "visual_required": false
  },
  "Patterns and algebra": {
    "description": "Recognizing patterns and algebraic thinking",
    "visual_required": false
  },
  "Measurement": {
    "description": "Understanding and applying measurement concepts",
    "visual_required": false
  },
  "Geometry": {
    "description": "Understanding shapes, space, and geometric relationships",
    "visual_required": true
  },
  "Statistics and probability": {
    "description": "Analyzing data and understanding probability",
    "visual_required": true
  },
  "Problem solving": {
    "description": "Applying mathematical knowledge to solve problems",
    "visual_required": false
  },

  // Year 7 NAPLAN - Reading (additional/different skills)
  "Inferential reasoning": {
    "description": "Making complex inferences from text",
    "visual_required": false
  },
  "Critical analysis": {
    "description": "Critically evaluating and analyzing text",
    "visual_required": false
  },
  "Literary device recognition": {
    "description": "Identifying and understanding literary techniques",
    "visual_required": false
  },
  "Vocabulary in context": {
    "description": "Understanding vocabulary within textual context",
    "visual_required": false
  },
  "Text structure analysis": {
    "description": "Analyzing how texts are organized and structured",
    "visual_required": false
  },
  "Author's purpose and perspective": {
    "description": "Understanding why authors write and their viewpoints",
    "visual_required": false
  },

  // Year 7 NAPLAN - Language Conventions (advanced)
  "Advanced spelling patterns": {
    "description": "Complex spelling rules and patterns",
    "visual_required": false
  },
  "Complex grammar structures": {
    "description": "Advanced grammatical concepts and structures",
    "visual_required": false
  },
  "Punctuation rules": {
    "description": "Advanced punctuation usage",
    "visual_required": false
  },
  "Sentence construction": {
    "description": "Building complex sentence structures",
    "visual_required": false
  },
  "Academic vocabulary": {
    "description": "Understanding academic and specialized vocabulary",
    "visual_required": false
  },

  // Year 7 NAPLAN - Numeracy (advanced)
  "Number operations with integers": {
    "description": "Mathematical operations including negative numbers",
    "visual_required": false
  },
  "Algebraic thinking": {
    "description": "Understanding algebraic concepts and reasoning",
    "visual_required": false
  },
  "Advanced measurement": {
    "description": "Complex measurement concepts and applications",
    "visual_required": false
  },
  "Geometric reasoning": {
    "description": "Logical reasoning about geometric concepts",
    "visual_required": true
  },
  "Mathematical modeling": {
    "description": "Using mathematics to model real-world situations",
    "visual_required": false
  },
  "Problem solving and reasoning": {
    "description": "Advanced mathematical problem-solving skills",
    "visual_required": false
  },

  // ACER Skills
  "Comprehension and interpretation": {
    "description": "Understanding and interpreting complex information",
    "visual_required": false
  },
  "Critical thinking": {
    "description": "Analyzing information critically and making judgments",
    "visual_required": false
  },
  "Inference and deduction": {
    "description": "Drawing logical conclusions from given information",
    "visual_required": false
  },
  "Analysis of written and visual material": {
    "description": "Analyzing both text and visual information",
    "visual_required": true
  },
  "Cross-curricular content analysis": {
    "description": "Analyzing content across different subject areas",
    "visual_required": false
  },
  "Fiction and non-fiction interpretation": {
    "description": "Understanding different types of texts",
    "visual_required": false
  },
  "Poetry and diagram analysis": {
    "description": "Analyzing poetry and visual diagrams",
    "visual_required": true
  },
  "Mathematical reasoning": {
    "description": "Logical reasoning in mathematical contexts",
    "visual_required": false
  },
  "Quantitative problem solving": {
    "description": "Solving problems involving quantities and numbers",
    "visual_required": false
  },
  "Pattern recognition": {
    "description": "Identifying patterns in various contexts",
    "visual_required": true
  },
  "Spatial reasoning": {
    "description": "Understanding spatial relationships and visualization",
    "visual_required": true
  },
  "Mathematical analysis and interpretation": {
    "description": "Analyzing and interpreting mathematical information",
    "visual_required": false
  },
  "Information selection and transformation": {
    "description": "Selecting and transforming information appropriately",
    "visual_required": false
  },
  "Relationship identification": {
    "description": "Identifying relationships between concepts",
    "visual_required": false
  },
  "Creative writing": {
    "description": "Creating original written content",
    "visual_required": false
  },
  "Analytical writing": {
    "description": "Writing that analyzes and evaluates information",
    "visual_required": false
  },
  "Abstract reasoning": {
    "description": "Reasoning with abstract concepts and relationships",
    "visual_required": true
  },
  "Logical deduction": {
    "description": "Making logical deductions from given premises",
    "visual_required": false
  },
  "Visual problem-solving": {
    "description": "Solving problems using visual information",
    "visual_required": true
  },
  "Spatial visualization": {
    "description": "Visualizing and manipulating spatial information",
    "visual_required": true
  },
  "Verbal analogies": {
    "description": "Understanding relationships between words and concepts",
    "visual_required": false
  },

  // EduTest Skills
  "Text interpretation": {
    "description": "Interpreting meaning from written text",
    "visual_required": false
  },
  "Reading comprehension": {
    "description": "Understanding written material",
    "visual_required": false
  },
  "Inference making": {
    "description": "Making logical inferences from text",
    "visual_required": false
  },
  "Sentence completion": {
    "description": "Completing sentences appropriately",
    "visual_required": false
  },
  "Punctuation correction": {
    "description": "Correcting punctuation errors",
    "visual_required": false
  },
  "Poetry interpretation": {
    "description": "Understanding and interpreting poetry",
    "visual_required": false
  },
  "Year-level mathematical knowledge": {
    "description": "Mathematical concepts appropriate for year level",
    "visual_required": false
  },
  "Algebra": {
    "description": "Algebraic concepts and operations",
    "visual_required": false
  },
  "Space and geometry": {
    "description": "Geometric and spatial concepts",
    "visual_required": true
  },
  "Data and statistics": {
    "description": "Working with data and statistical concepts",
    "visual_required": true
  },
  "Word analogies": {
    "description": "Understanding word relationships and analogies",
    "visual_required": false
  },
  "Semantic relationships": {
    "description": "Understanding meaning relationships between words",
    "visual_required": false
  },
  "Verbal classification": {
    "description": "Classifying words and concepts",
    "visual_required": false
  },
  "Language pattern recognition": {
    "description": "Recognizing patterns in language",
    "visual_required": false
  },
  "Vocabulary reasoning": {
    "description": "Reasoning about word meanings and usage",
    "visual_required": false
  },
  "Number pattern recognition": {
    "description": "Identifying patterns in numbers",
    "visual_required": false
  },
  "Quantitative relationships": {
    "description": "Understanding relationships between quantities",
    "visual_required": false
  },
  "Mathematical problem solving": {
    "description": "Solving mathematical problems",
    "visual_required": false
  },
  "Data interpretation": {
    "description": "Interpreting data and information",
    "visual_required": true
  },
  "Logical reasoning with numbers": {
    "description": "Applying logic to numerical problems",
    "visual_required": false
  },
  "Sequence completion": {
    "description": "Completing numerical or logical sequences",
    "visual_required": false
  },
  "Descriptive writing": {
    "description": "Writing that describes people, places, or things",
    "visual_required": false
  },
  "Expository writing": {
    "description": "Writing that explains or informs",
    "visual_required": false
  },

  // NSW Selective Skills
  "Text analysis": {
    "description": "Analyzing and evaluating text",
    "visual_required": false
  },
  "Vocabulary understanding": {
    "description": "Understanding word meanings and usage",
    "visual_required": false
  },
  "Main idea identification": {
    "description": "Identifying the main ideas in text",
    "visual_required": false
  },
  "Author's purpose": {
    "description": "Understanding why authors write",
    "visual_required": false
  },
  "Poetry analysis": {
    "description": "Analyzing poetic texts and techniques",
    "visual_required": false
  },
  "Numerical reasoning": {
    "description": "Reasoning with numbers and quantities",
    "visual_required": false
  },
  "Conceptual understanding": {
    "description": "Understanding underlying mathematical concepts",
    "visual_required": false
  },
  "Problem-solving strategies": {
    "description": "Applying strategies to solve problems",
    "visual_required": false
  },
  "Mathematical applications": {
    "description": "Applying mathematics in various contexts",
    "visual_required": false
  },
  "Spatial understanding": {
    "description": "Understanding spatial concepts and relationships",
    "visual_required": true
  },
  "Logical mathematical thinking": {
    "description": "Applying logic to mathematical problems",
    "visual_required": false
  },
  "Logical reasoning": {
    "description": "Using logic to solve problems",
    "visual_required": false
  },
  "Verbal reasoning": {
    "description": "Reasoning with words and language",
    "visual_required": false
  },
  "Pattern identification": {
    "description": "Identifying patterns and relationships",
    "visual_required": true
  },
  "Deductive reasoning": {
    "description": "Making logical deductions",
    "visual_required": false
  },
  "Multi-step problem solving": {
    "description": "Solving complex, multi-step problems",
    "visual_required": false
  },
  "Imaginative writing": {
    "description": "Writing that uses imagination and creativity",
    "visual_required": false
  },

  // VIC Selective Skills
  "Critical interpretation": {
    "description": "Interpreting information critically",
    "visual_required": false
  },
  "Implicit meaning understanding": {
    "description": "Understanding implied meanings in text",
    "visual_required": false
  },
  "Deductive reasoning from text": {
    "description": "Making deductions from textual information",
    "visual_required": false
  },
  "Academic knowledge application": {
    "description": "Applying academic knowledge across contexts",
    "visual_required": false
  },
  "Multi-step reasoning": {
    "description": "Complex reasoning involving multiple steps",
    "visual_required": false
  },
  "Complex mathematical concepts": {
    "description": "Understanding advanced mathematical concepts",
    "visual_required": false
  },
  "Advanced numerical reasoning": {
    "description": "Advanced reasoning with numbers",
    "visual_required": false
  },
  "Spatial problem solving": {
    "description": "Solving problems involving spatial concepts",
    "visual_required": true
  },
  "Mathematical application": {
    "description": "Applying mathematical knowledge",
    "visual_required": false
  },
  "Pattern detection with words": {
    "description": "Detecting patterns in language and words",
    "visual_required": false
  },
  "Word relationships": {
    "description": "Understanding relationships between words",
    "visual_required": false
  },
  "Odd word identification": {
    "description": "Identifying words that don't fit patterns",
    "visual_required": false
  },
  "Word meaning analysis": {
    "description": "Analyzing word meanings and usage",
    "visual_required": false
  },
  "Letter manipulation": {
    "description": "Working with letters and letter patterns",
    "visual_required": false
  },
  "Logical word consequences": {
    "description": "Understanding logical consequences with words",
    "visual_required": false
  },
  "Mathematical sequence analysis": {
    "description": "Analyzing mathematical sequences",
    "visual_required": false
  },
  "Numerical relationships": {
    "description": "Understanding relationships between numbers",
    "visual_required": false
  },
  "Word problem solving": {
    "description": "Solving mathematical word problems",
    "visual_required": false
  },
  "Quantitative analysis": {
    "description": "Analyzing quantitative information",
    "visual_required": false
  }
} as const;

// Section to sub-skill mappings based on the authoritative data
export const SECTION_TO_SUB_SKILLS = {
  // Year 5 NAPLAN
  "Reading": [
    "Text comprehension",
    "Identifying main ideas", 
    "Making inferences",
    "Understanding vocabulary in context",
    "Analyzing text structure",
    "Cause and effect relationships",
    "Drawing conclusions"
  ],
  "Writing": [
    "Narrative writing",
    "Persuasive writing"
  ],
  "Language Conventions": [
    "Spelling",
    "Grammar", 
    "Punctuation",
    "Sentence structure",
    "Vocabulary knowledge"
  ],
  "Numeracy": [
    "Number and place value",
    "Number operations",
    "Fractions and decimals", 
    "Patterns and algebra",
    "Measurement",
    "Geometry",
    "Statistics and probability",
    "Problem solving"
  ],

  // Year 7 NAPLAN - Reading uses different/additional skills
  // "Reading": [...] - handled by year level logic

  // ACER Scholarship
  "Reading Comprehension": [
    "Comprehension and interpretation",
    "Critical thinking",
    "Inference and deduction",
    "Analysis of written and visual material",
    "Cross-curricular content analysis", 
    "Fiction and non-fiction interpretation",
    "Poetry and diagram analysis"
  ],
  "Mathematics": [
    "Mathematical reasoning",
    "Quantitative problem solving",
    "Pattern identification",
    "Spatial reasoning",
    "Mathematical analysis and interpretation",
    "Information selection and transformation",
    "Relationship identification"
  ],
  "Written Expression": [
    "Creative writing",
    "Analytical writing"
  ],
  "Thinking Skills": [
    "Abstract reasoning",
    "Logical deduction", 
    "Pattern identification",
    "Visual problem-solving",
    "Critical thinking",
    "Spatial visualization",
    "Verbal analogies"
  ],

  // EduTest Scholarship
  "EduTest_Verbal_Reasoning": [
    "Word analogies",
    "Logical deduction",
    "Semantic relationships",
    "Verbal classification",
    "Language pattern recognition",
    "Vocabulary reasoning"
  ],
  "Numerical Reasoning": [
    "Number pattern recognition",
    "Quantitative relationships", 
    "Mathematical problem solving",
    "Data interpretation",
    "Logical reasoning with numbers",
    "Sequence completion"
  ],

  // NSW Selective
  "Mathematical Reasoning": [
    "Mathematical problem solving",
    "Numerical reasoning",
    "Conceptual understanding",
    "Problem-solving strategies",
    "Mathematical applications",
    "Spatial understanding",
    "Pattern identification",
    "Logical mathematical thinking"
  ],

  // VIC Selective
  "Reading Reasoning": [
    "Reading comprehension",
    "Inferential reasoning",
    "Text analysis",
    "Critical interpretation",
    "Implicit meaning understanding",
    "Deductive reasoning from text",
    "Academic knowledge application"
  ],
  "Verbal Reasoning": [
    "Pattern detection with words",
    "Vocabulary reasoning",
    "Word relationships",
    "Odd word identification", 
    "Word meaning analysis",
    "Letter manipulation",
    "Logical word consequences"
  ],
  "Quantitative Reasoning": [
    "Number pattern recognition",
    "Quantitative problem solving",
    "Mathematical sequence analysis",
    "Numerical relationships",
    "Word problem solving",
    "Mathematical reasoning",
    "Quantitative analysis"
  ]
} as const;

// Special handling for test-specific Reading sections with different skills
const YEAR_7_READING_SKILLS = [
  "Text comprehension",
  "Inferential reasoning", 
  "Critical analysis",
  "Literary device recognition",
  "Vocabulary in context",
  "Text structure analysis",
  "Author's purpose and perspective"
];

const YEAR_7_NUMERACY_SKILLS = [
  "Number operations with integers",
  "Algebraic thinking",
  "Advanced measurement",
  "Geometric reasoning",
  "Statistics and probability",
  "Mathematical modeling",
  "Problem solving and reasoning"
];

const YEAR_7_LANGUAGE_SKILLS = [
  "Advanced spelling patterns",
  "Complex grammar structures",
  "Punctuation rules",
  "Sentence construction",
  "Academic vocabulary"
];

const EDUTEST_READING_SKILLS = [
  "Text interpretation",
  "Inference making",
  "Sentence completion",
  "Punctuation correction",
  "Fiction and non-fiction interpretation",
  "Poetry interpretation"
];

const EDUTEST_MATH_SKILLS = [
  "Year-level mathematical knowledge",
  "Number operations",
  "Measurement",
  "Algebra",
  "Space and geometry",
  "Data and statistics",
  "Problem solving"
];

const EDUTEST_WRITING_SKILLS = [
  "Creative writing",
  "Persuasive writing",
  "Descriptive writing",
  "Narrative writing",
  "Expository writing"
];

const EDUTEST_VERBAL_SKILLS = [
  "Word analogies",
  "Logical deduction",
  "Semantic relationships",
  "Verbal classification",
  "Language pattern recognition",
  "Vocabulary reasoning"
];

const NSW_READING_SKILLS = [
  "Reading comprehension",
  "Text analysis",
  "Inference making",
  "Vocabulary understanding",
  "Main idea identification",
  "Author's purpose",
  "Fiction and non-fiction interpretation",
  "Poetry analysis"
];

const NSW_WRITING_SKILLS = [
  "Creative writing",
  "Imaginative writing"
];

export const VIC_MATH_SKILLS = [
  "Mathematical problem solving",
  "Multi-step reasoning",
  "Complex mathematical concepts",
  "Mathematical modeling",
  "Advanced numerical reasoning",
  "Spatial problem solving",
  "Mathematical application"
];

const VIC_WRITING_SKILLS = [
  "Creative writing",
  "Analytical writing"
];

// Helper function to get sub-skills for a section, with test-specific handling
export const getSubSkillsForSection = (sectionName: string, testType?: string): readonly string[] => {
  // Handle test-specific variations
  if (testType === "Year 7 NAPLAN") {
    if (sectionName === "Reading") return YEAR_7_READING_SKILLS;
    if (sectionName === "Numeracy") return YEAR_7_NUMERACY_SKILLS;
    if (sectionName === "Language Conventions") return YEAR_7_LANGUAGE_SKILLS;
  }
  
  if (testType === "EduTest Scholarship (Year 7 Entry)") {
    if (sectionName === "Reading Comprehension") return EDUTEST_READING_SKILLS;
    if (sectionName === "Mathematics") return EDUTEST_MATH_SKILLS;
    if (sectionName === "Written Expression") return EDUTEST_WRITING_SKILLS;
    if (sectionName === "Verbal Reasoning") return EDUTEST_VERBAL_SKILLS;
  }

  if (testType === "NSW Selective Entry (Year 7 Entry)") {
    if (sectionName === "Reading") return NSW_READING_SKILLS;
    if (sectionName === "Writing") return NSW_WRITING_SKILLS;
  }

  if (testType === "VIC Selective Entry (Year 9 Entry)") {
    if (sectionName === "Reading Reasoning") return SECTION_TO_SUB_SKILLS["Reading Reasoning"];
    if (sectionName === "Mathematical Reasoning") return VIC_MATH_SKILLS;
    if (sectionName === "Verbal Reasoning") return SECTION_TO_SUB_SKILLS["Verbal Reasoning"];
    if (sectionName === "Quantitative Reasoning") return SECTION_TO_SUB_SKILLS["Quantitative Reasoning"];
    if (sectionName === "Written Expression") return VIC_WRITING_SKILLS;
  }

  // Default mapping
  return SECTION_TO_SUB_SKILLS[sectionName as keyof typeof SECTION_TO_SUB_SKILLS] || [];
};

// Check if visual is required for a sub-skill
export const isVisualRequired = (subSkill: string): boolean => {
  return UNIFIED_SUB_SKILLS[subSkill as keyof typeof UNIFIED_SUB_SKILLS]?.visual_required || false;
};

// Get test structure
export const getTestStructure = (testType: string) => {
  return TEST_STRUCTURES[testType as keyof typeof TEST_STRUCTURES];
};

// Parse question count from string format
export const parseQuestionCount = (questionCountStr: string | number): number => {
  if (typeof questionCountStr === 'number') return questionCountStr;
  
  if (questionCountStr.includes('-')) {
    const [min, max] = questionCountStr.split('-').map(Number);
    return max; // Use maximum for comprehensive practice
  }
  
  return parseInt(questionCountStr.toString());
};

// Test-specific difficulty mappings (Updated to 1-3 scale)
// Difficulty is relative within each test type - all test types support difficulties 1-3
export function getCurriculumDifficulty(testType: string, subSkill: string, requestedDifficulty?: number): number {
  // All test types support difficulties 1-3, relative to their own standards
  // 1 = Accessible (easier questions within this test type)
  // 2 = Standard (typical questions for this test type) 
  // 3 = Challenging (harder questions within this test type)
  
  // If a specific difficulty is requested, validate and return it
  if (requestedDifficulty !== undefined) {
    const difficulty = Math.max(1, Math.min(3, Math.floor(requestedDifficulty)));
    return difficulty;
  }
  
  // Return 2 as default (Standard difficulty for any test type)
  // The actual difficulty (1, 2, or 3) should be specified when generating questions
  return 2;
}

// Utility function to get all difficulty levels for comprehensive generation
export function getAllDifficultyLevels(): number[] {
  return [1, 2, 3];
}

// Utility function to distribute difficulties evenly across questions
export function distributeDifficulties(totalQuestions: number): number[] {
  const difficulties: number[] = [];
  const difficultyLevels = getAllDifficultyLevels();
  
  for (let i = 0; i < totalQuestions; i++) {
    const difficultyIndex = i % difficultyLevels.length;
    difficulties.push(difficultyLevels[difficultyIndex]);
  }
  
  return difficulties;
}

// Utility function to get random difficulty for variety
export function getRandomDifficulty(): number {
  const levels = getAllDifficultyLevels();
  return levels[Math.floor(Math.random() * levels.length)];
} 