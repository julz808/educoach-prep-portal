// ============================================================================
// EDUCATIONAL TIPS FRAMEWORK
// ============================================================================
// Subject-specific tip libraries for enhanced question explanations

export interface TipCategory {
  [subSkill: string]: string[];
}

export interface SubjectTips {
  [category: string]: TipCategory;
}

// Verbal Reasoning Tips
export const VERBAL_REASONING_TIPS: SubjectTips = {
  analogies: {
    'Verbal Analogies': [
      "Identify the relationship between the first pair, then find the same relationship in the answer choices",
      "Look for specific relationship types: part-to-whole, cause-and-effect, synonym, antonym, function, or category",
      "Eliminate options that have different relationship types from the original pair",
      "Create a sentence using the first pair to test if it works with your chosen answer"
    ],
    'Word Relationships': [
      "Focus on the connection between words rather than their individual meanings",
      "Consider multiple relationship types: opposite, similar, category, function, or degree",
      "Use elimination - cross out obviously wrong relationships first",
      "Double-check by reversing the relationship to ensure it's consistent"
    ]
  },
  logic: {
    'Logical Reasoning': [
      "Read the question carefully and identify what type of logical reasoning is required",
      "Look for key words like 'if...then', 'all', 'some', 'none' that indicate logical structures",
      "Draw simple diagrams or use process of elimination for complex logic problems",
      "Don't rely on outside knowledge - use only the information given in the question"
    ],
    'Pattern Recognition': [
      "Look for sequences, progressions, or recurring elements in the given information",
      "Identify what changes and what stays the same between elements",
      "Test your pattern by checking if it works for all given examples",
      "Consider multiple types of patterns: numerical, alphabetical, visual, or conceptual"
    ]
  },
  vocabulary: {
    'Vocabulary in Context': [
      "Use context clues from the surrounding words and sentences to determine meaning",
      "Look for definition clues, example clues, or contrast clues in the text",
      "Consider the word's function in the sentence (noun, verb, adjective) to narrow down meaning",
      "Eliminate answer choices that don't fit grammatically or logically in the context"
    ],
    'Word Knowledge': [
      "Break down unfamiliar words into prefixes, roots, and suffixes you recognize",
      "Use process of elimination - cross out options you know are incorrect",
      "Consider multiple meanings a word might have and choose the most appropriate one",
      "Think about word families and related words you already know"
    ]
  }
};

// Reading Comprehension Tips
export const READING_COMPREHENSION_TIPS: SubjectTips = {
  literal: {
    'Literal Comprehension': [
      "Scan the text to find the specific information mentioned in the question",
      "Look for key words from the question in the passage to locate the relevant section",
      "The answer should be directly stated in the text - avoid making inferences",
      "Re-read the relevant section carefully to ensure you haven't missed important details"
    ],
    'Detail Recognition': [
      "Pay attention to specific facts, dates, names, and numbers mentioned in the text",
      "Use your finger or a pencil to track through the text systematically",
      "Check that your answer matches exactly what is stated, not what seems logical",
      "Look for qualifier words like 'some', 'most', 'all', 'never' that affect meaning"
    ]
  },
  inferential: {
    'Inferential Reasoning': [
      "Look for clues in the text that point to the answer without stating it directly",
      "Consider what the author implies through tone, word choice, and context",
      "Combine information from different parts of the text to reach a logical conclusion",
      "Choose the answer most strongly supported by evidence, avoiding wild guesses"
    ],
    'Reading Between the Lines': [
      "Pay attention to what characters do and say to understand their motivations",
      "Notice the author's word choices and tone to understand their attitude or purpose",
      "Look for cause-and-effect relationships that aren't explicitly stated",
      "Use your knowledge of human nature, but stay within what the text supports"
    ]
  },
  critical: {
    'Critical Analysis & Evaluation': [
      "Identify the author's main purpose: to inform, persuade, entertain, or explain",
      "Look for evidence the author uses to support their claims or arguments",
      "Consider whether the author's reasoning is logical and well-supported",
      "Distinguish between facts (can be proven) and opinions (personal beliefs or judgments)"
    ],
    'Author\'s Purpose & Perspective': [
      "Pay attention to the author's tone and word choices to understand their viewpoint",
      "Look for bias indicators - one-sided language or unfair generalizations",
      "Consider what the author emphasizes and what they choose to leave out",
      "Think about the intended audience and how this affects the author's approach"
    ]
  }
};

// Mathematics Tips
export const MATHEMATICS_TIPS: SubjectTips = {
  number_operations: {
    'Number Operations & Problem Solving': [
      "Read the problem twice - once for understanding, once to identify what you need to find",
      "Identify the key information and what operation(s) you need to perform",
      "Estimate your answer first, then solve - this helps catch major errors",
      "Check your answer by working backwards or using a different method"
    ],
    'Word Problems': [
      "Underline or circle the important numbers and what you need to find",
      "Look for key words that indicate operations: 'total' (add), 'difference' (subtract), 'times' (multiply), 'share' (divide)",
      "Draw pictures or diagrams when helpful to visualize the problem",
      "Make sure your answer makes sense in the context of the problem"
    ]
  },
  algebraic: {
    'Algebraic Reasoning': [
      "Work systematically through the problem, showing each step clearly",
      "Use substitution to check your answer - replace variables with your solution",
      "When solving equations, perform the same operation on both sides",
      "Look for patterns in number sequences or relationships between variables"
    ],
    'Patterns & Relationships': [
      "Look for what changes and what stays the same in number or shape patterns",
      "Try extending the pattern by a few more terms to confirm you understand the rule",
      "Express the pattern rule in words first, then try to write it as an equation if needed",
      "Check your pattern rule works for all the given examples"
    ]
  },
  geometric: {
    'Geometric & Spatial Reasoning': [
      "Draw or sketch the problem when working with shapes and measurements",
      "Remember key formulas: area of rectangle = length × width, perimeter = add all sides",
      "Pay attention to units of measurement and include them in your answer",
      "Use logical reasoning - if you don't know a formula, think about what makes sense"
    ],
    'Measurement & Geometry': [
      "Convert units carefully when needed (e.g., metres to centimetres: multiply by 100)",
      "For area and perimeter problems, identify the shape first, then apply the appropriate method",
      "Use symmetry and geometric properties to solve problems efficiently",
      "Check that your measurements make sense in real-world contexts"
    ]
  },
  data: {
    'Data Interpretation': [
      "Read the title and labels on graphs and charts to understand what data is shown",
      "Pay attention to the scale on graphs - check what each unit represents",
      "Look for trends, patterns, or significant differences in the data",
      "Answer only what the question asks - avoid making conclusions beyond the data shown"
    ],
    'Statistics & Probability': [
      "For averages, add all values and divide by how many values you have",
      "For probability, think about favorable outcomes compared to total possible outcomes",
      "Use tables or organized lists to count possibilities systematically",
      "Express probability as a fraction, decimal, or percentage as requested"
    ]
  }
};

// Language Conventions Tips
export const LANGUAGE_CONVENTIONS_TIPS: SubjectTips = {
  grammar: {
    'Grammar & Parts of Speech': [
      "Read the sentence aloud (in your head) to hear if it sounds correct",
      "Identify the subject and verb first, then check they agree in number (singular/plural)",
      "For pronoun questions, make sure the pronoun matches its antecedent in number and gender",
      "When in doubt, try each answer choice in the sentence to see which sounds most natural"
    ],
    'Sentence Structure': [
      "Look for sentence fragments (incomplete sentences) and run-on sentences (too many ideas joined incorrectly)",
      "Make sure each sentence has at least one complete subject and predicate",
      "Check that connecting words (and, but, because, etc.) are used appropriately",
      "Ensure all parts of the sentence work together logically and grammatically"
    ]
  },
  punctuation: {
    'Punctuation Usage & Application': [
      "Use commas to separate items in a list and before 'and', 'but', 'or' in compound sentences",
      "Use apostrophes for contractions (don't, can't) and to show possession (Sarah's book)",
      "Use question marks for direct questions and exclamation marks for strong emotions",
      "Remember that periods end statements and abbreviations"
    ],
    'Capitalization': [
      "Capitalize the first word of sentences and the pronoun 'I'",
      "Capitalize proper nouns: names of people, places, months, days, holidays",
      "Capitalize the first word and important words in titles",
      "Don't capitalize common nouns unless they start a sentence or are part of a proper noun"
    ]
  },
  spelling: {
    'Spelling Patterns & Orthographic Knowledge': [
      "Sound out the word and think about spelling patterns you know",
      "Remember common rules: 'i before e except after c' (but watch for exceptions)",
      "For plurals, most words add 's', but words ending in 's', 'sh', 'ch', 'x' add 'es'",
      "When adding suffixes, consider if you need to double letters or change 'y' to 'i'"
    ],
    'Word Formation': [
      "Break complex words into parts: prefix + root + suffix",
      "Learn common prefixes (un-, re-, pre-) and suffixes (-ing, -ed, -ly) and their meanings",
      "Use your knowledge of word families to spell related words correctly",
      "When unsure, think of other words that sound similar and follow similar patterns"
    ]
  }
};

// Writing Tips  
export const WRITING_TIPS: SubjectTips = {
  narrative: {
    'Narrative Writing': [
      "Start with a clear setting (where and when) and introduce your main character",
      "Include a problem or conflict that the character needs to resolve",
      "Use descriptive language to help readers visualize the scene and characters",
      "End with a satisfying resolution that solves the problem or completes the story"
    ],
    'Creative Writing': [
      "Use your imagination, but make sure your story makes sense and is believable",
      "Include dialogue to make characters come alive and move the story forward",
      "Show, don't just tell - use actions and descriptions to reveal character feelings",
      "Vary your sentence lengths and types to make your writing more interesting"
    ]
  },
  persuasive: {
    'Persuasive Writing': [
      "State your position clearly in the introduction and restate it in the conclusion",
      "Support your arguments with specific examples, facts, or logical reasoning",
      "Consider the opposing viewpoint and explain why your position is stronger",
      "Use persuasive language techniques like rhetorical questions and strong adjectives"
    ],
    'Argumentative Writing': [
      "Organize your points from strongest to weakest or weakest to strongest",
      "Use connecting words (furthermore, however, in addition) to link your ideas",
      "Include specific evidence to support each main point you make",
      "Address potential counterarguments to show you've considered different perspectives"
    ]
  },
  expository: {
    'Expository Writing': [
      "Organize your information logically - consider using time order, importance, or categories",
      "Use topic sentences to introduce each main idea in your paragraphs",
      "Include specific details, examples, and explanations to support your main points",
      "Use transitional words and phrases to help readers follow your ideas"
    ],
    'Informational Writing': [
      "Begin with an introduction that tells readers what they will learn",
      "Present information clearly and accurately, avoiding personal opinions",
      "Use headings, lists, or other organizational features when appropriate",
      "End with a conclusion that summarizes the key information or its importance"
    ]
  }
};

/**
 * Gets appropriate tips for a given subject area and sub-skill
 */
export function getTipsForSubSkill(sectionName: string, subSkill: string): string[] {
  // Determine subject area from section name
  let subjectTips: SubjectTips;
  
  if (sectionName.toLowerCase().includes('verbal') || sectionName.toLowerCase().includes('reasoning')) {
    subjectTips = VERBAL_REASONING_TIPS;
  } else if (sectionName.toLowerCase().includes('reading') || sectionName.toLowerCase().includes('humanities')) {
    subjectTips = READING_COMPREHENSION_TIPS;
  } else if (sectionName.toLowerCase().includes('math') || sectionName.toLowerCase().includes('numerical') || sectionName.toLowerCase().includes('numeracy') || sectionName.toLowerCase().includes('quantitative')) {
    subjectTips = MATHEMATICS_TIPS;
  } else if (sectionName.toLowerCase().includes('language') || sectionName.toLowerCase().includes('conventions')) {
    subjectTips = LANGUAGE_CONVENTIONS_TIPS;
  } else if (sectionName.toLowerCase().includes('writing') || sectionName.toLowerCase().includes('written')) {
    subjectTips = WRITING_TIPS;
  } else {
    // Default to general learning tips
    return [
      "Read the question carefully and identify exactly what is being asked",
      "Use process of elimination to remove obviously incorrect answers",
      "Check your work by reviewing your reasoning and ensuring your answer makes sense"
    ];
  }
  
  // Find the most appropriate category and sub-skill match
  for (const [category, categoryTips] of Object.entries(subjectTips)) {
    for (const [tipSubSkill, tips] of Object.entries(categoryTips)) {
      if (subSkill.toLowerCase().includes(tipSubSkill.toLowerCase()) || 
          tipSubSkill.toLowerCase().includes(subSkill.toLowerCase())) {
        return tips;
      }
    }
  }
  
  // If no specific match found, return general tips for the subject area
  const firstCategory = Object.values(subjectTips)[0];
  if (firstCategory) {
    const firstTips = Object.values(firstCategory)[0];
    if (firstTips) {
      return firstTips;
    }
  }
  
  // Ultimate fallback
  return [
    "Break down the problem into smaller, manageable parts",
    "Look for key words and information that will help you find the correct answer",
    "Use logical reasoning and eliminate options that don't make sense"
  ];
}

/**
 * Selects 2-3 most relevant tips for a specific question context
 */
export function selectRelevantTips(sectionName: string, subSkill: string, questionContext?: string): string[] {
  const allTips = getTipsForSubSkill(sectionName, subSkill);
  
  // If we have context about the question, we could do smart selection here
  // For now, return the first 3 tips as they're ordered by importance
  return allTips.slice(0, 3);
}

/**
 * Formats tips for inclusion in question explanations
 */
export function formatTipsForExplanation(tips: string[]): string {
  if (tips.length === 0) {
    return "";
  }
  
  return tips.map(tip => `• ${tip}`).join('\n');
}