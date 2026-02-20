// EduCourse Curriculum Data V2 - Shared Types and Test Structures
// Created: February 3, 2026

// ============================================
// TEST STRUCTURES - Authoritative Source
// ============================================

export const TEST_STRUCTURES = {
  "Year 5 NAPLAN": {
    "Writing": {
      "questions": 1,
      "time": 42,
      "format": "Written Response",
      "passages": 0,
      "words_per_passage": 0
    },
    "Reading": {
      "questions": 40,
      "time": 50,
      "format": "Multiple Choice",
      "passages": 8,
      "words_per_passage": 150
    },
    "Language Conventions": {
      "questions": 40,
      "time": 45,
      "format": "Multiple Choice",
      "passages": 0,
      "words_per_passage": 0
    },
    "Numeracy": {
      "questions": 50,
      "time": 50,
      "format": "Multiple Choice",
      "passages": 0,
      "words_per_passage": 0
    }
  },
  "Year 7 NAPLAN": {
    "Writing": {
      "questions": 1,
      "time": 42,
      "format": "Written Response",
      "passages": 0,
      "words_per_passage": 0
    },
    "Reading": {
      "questions": 50,
      "time": 65,
      "format": "Multiple Choice",
      "passages": 8,
      "words_per_passage": 200
    },
    "Language Conventions": {
      "questions": 45,
      "time": 45,
      "format": "Multiple Choice",
      "passages": 0,
      "words_per_passage": 0
    },
    "Numeracy No Calculator": {
      "questions": 30,
      "time": 30,
      "format": "Multiple Choice",
      "passages": 0,
      "words_per_passage": 0
    },
    "Numeracy Calculator": {
      "questions": 35,
      "time": 35,
      "format": "Multiple Choice",
      "passages": 0,
      "words_per_passage": 0
    }
  },
  "ACER Scholarship (Year 7 Entry)": {
    "Written Expression": {
      "questions": 1,
      "time": 25,
      "format": "Written Response",
      "passages": 0,
      "words_per_passage": 0
    },
    "Mathematics": {
      "questions": 35,
      "time": 47,
      "format": "Multiple Choice",
      "passages": 0,
      "words_per_passage": 0
    },
    "Humanities": {
      "questions": 35,
      "time": 47,
      "format": "Multiple Choice",
      "passages": 4,
      "words_per_passage": 350
    }
  },
  "EduTest Scholarship (Year 7 Entry)": {
    "Reading Comprehension": {
      "questions": 50,
      "time": 30,
      "format": "Multiple Choice",
      "passages": 5,
      "words_per_passage": 200
    },
    "Verbal Reasoning": {
      "questions": 60,
      "time": 30,
      "format": "Multiple Choice",
      "passages": 0,
      "words_per_passage": 0
    },
    "Numerical Reasoning": {
      "questions": 50,
      "time": 30,
      "format": "Multiple Choice",
      "passages": 0,
      "words_per_passage": 0
    },
    "Mathematics": {
      "questions": 60,
      "time": 30,
      "format": "Multiple Choice",
      "passages": 0,
      "words_per_passage": 0
    },
    "Written Expression": {
      "questions": 2,
      "time": 30,
      "format": "Written Response",
      "passages": 0,
      "words_per_passage": 0
    }
  },
  "NSW Selective Entry (Year 7 Entry)": {
    "Reading": {
      "questions": 30,
      "time": 40,
      "format": "Multiple Choice",
      "passages": 6,
      "words_per_passage": 250
    },
    "Mathematical Reasoning": {
      "questions": 35,
      "time": 40,
      "format": "Multiple Choice",
      "passages": 0,
      "words_per_passage": 0
    },
    "Thinking Skills": {
      "questions": 40,
      "time": 40,
      "format": "Multiple Choice",
      "passages": 0,
      "words_per_passage": 0
    },
    "Writing": {
      "questions": 1,
      "time": 30,
      "format": "Written Response",
      "passages": 0,
      "words_per_passage": 0
    }
  },
  "VIC Selective Entry (Year 9 Entry)": {
    "Reading Reasoning": {
      "questions": 50,
      "time": 35,
      "format": "Multiple Choice",
      "passages": 5,
      "words_per_passage": 300
    },
    "Mathematics Reasoning": {
      "questions": 60,
      "time": 30,
      "format": "Multiple Choice",
      "passages": 0,
      "words_per_passage": 0
    },
    "General Ability - Verbal": {
      "questions": 60,
      "time": 30,
      "format": "Multiple Choice",
      "passages": 0,
      "words_per_passage": 0
    },
    "General Ability - Quantitative": {
      "questions": 50,
      "time": 30,
      "format": "Multiple Choice",
      "passages": 0,
      "words_per_passage": 0
    },
    "Writing": {
      "questions": 2,
      "time": 40,
      "format": "Written Response",
      "passages": 0,
      "words_per_passage": 0
    }
  }
} as const;

// ============================================
// TYPE DEFINITIONS
// ============================================

/**
 * Individual example question with all metadata
 */
export interface SubSkillExample {
  difficulty: number;
  question_text: string;
  answer_options?: string[];
  correct_answer: string;
  explanation: string;
  distractor_strategy?: string;
  characteristics: string[];
  passage_text?: string;
  visual_description?: string;
  requires_visual: boolean;  // REQUIRED: true if this question needs a visual to be answered
  visual_prompt?: string;     // REQUIRED if requires_visual=true: Prompt for visual LLM describing what to generate
  llm_visual_appropriate?: boolean;  // REQUIRED if requires_visual=true: true if LLM can accurately generate this visual (vs. needs image generation)
}

/**
 * Pattern definition for generating questions of a specific sub-skill
 */
export interface SubSkillPattern {
  format_template: string;
  key_characteristics: string[];
  distractor_strategies: string[];
  difficulty_progression: {
    "1": string;
    "2": string;
    "3": string;
  };
  common_mistakes?: string[];
  style_notes?: string[];
}

/**
 * Complete sub-skill data including examples and generation patterns
 */
export interface SubSkillExampleData {
  description: string;
  visual_required: boolean;
  image_type: "SVG" | "HTML" | "Image Generation" | "HTML/SVG" | null;
  llm_appropriate: boolean;
  difficulty_range: number[];
  question_format: string;
  examples: SubSkillExample[];
  pattern: SubSkillPattern;

  // NEW: Passage requirements for reading/comprehension sub-skills
  passage_requirements?: {
    passage_required: boolean;
    passage_dependency: "none" | "optional" | "always";
    passage_config?: {
      length: "micro" | "short" | "medium" | "long";
      word_count_range: [number, number];
      passage_types: ("narrative" | "informational" | "persuasive" | "poetry" | "visual")[];
      questions_per_passage: number | [number, number];
    };
    generation_workflow: "standalone" | "passage_first" | "hybrid";
  };
}

export type TestSection = string;
export type SubSkill = string;

/**
 * Database structure for all sub-skill examples
 */
export interface SubSkillExamplesDatabase {
  [testSection: TestSection]: {
    [subSkill: SubSkill]: SubSkillExampleData;
  };
}

// ============================================
// SECTION-LEVEL CONFIGURATION
// ============================================

/**
 * Passage distribution specification for passage-based sections
 */
export interface PassageDistributionSpec {
  passage_type: "narrative" | "informational" | "persuasive" | "poetry" | "visual" | "multimodal" | "micro" | "medium" | "long";
  count: number;  // Number of this passage type to generate
  word_count_range: [number, number];
  questions_per_passage: number | [number, number];
  sub_skills: string[];  // Which sub-skills to test with this passage type
}

/**
 * Blueprint for 100% passage-based sections (e.g., NSW Selective Reading)
 */
export interface PassageBlueprint {
  total_passages: number;
  passage_distribution: PassageDistributionSpec[];
}

/**
 * Standalone question distribution for hybrid sections
 */
export interface StandaloneDistributionSpec {
  sub_skill: string;
  count: number;
}

/**
 * Blueprint for hybrid sections (mix of standalone and passage-based)
 */
export interface HybridBlueprint {
  standalone_count: number;
  standalone_distribution: StandaloneDistributionSpec[];

  passage_based_count: number;
  passage_distribution: PassageDistributionSpec[];

  interleaving_strategy: "blocks" | "mixed" | "passages_first" | "passages_last";
}

/**
 * Balanced distribution for non-reading sections (e.g., Verbal Reasoning)
 * Distributes questions evenly across sub-skills
 */
export interface BalancedDistribution {
  total_questions: number;
  sub_skills: string[];  // List of sub-skills to distribute across
  distribution_strategy: "even" | "weighted";

  // Optional: custom weights for uneven distribution
  weights?: {
    [subSkill: string]: number;  // e.g., { "Analogies": 2, "Word Meanings": 1 }
  };
}

/**
 * Section structure configuration - defines how to generate an entire test section
 */
export interface SectionStructure {
  generation_strategy: "passage_based" | "standalone" | "hybrid" | "balanced" | "writing_prompt";

  // For 100% passage-based sections (e.g., NSW Selective Reading)
  passage_blueprint?: PassageBlueprint;

  // For hybrid sections (e.g., VIC Selective Reading, EduTest Reading)
  hybrid_blueprint?: HybridBlueprint;

  // For balanced sections (e.g., Verbal Reasoning, Math)
  balanced_distribution?: BalancedDistribution;

  // For writing prompt sections (e.g., ACER Written Expression, NAPLAN Writing)
  writing_blueprint?: WritingBlueprint;
}

/**
 * Writing prompt configuration for extended response questions
 */
export interface WritingBlueprint {
  total_prompts: number; // Usually 1
  prompt_types: string[]; // Sub-skills like "Creative & Imaginative Writing", "Persuasive & Argumentative Writing"
  word_limit?: number;
  time_limit_minutes?: number;
  allow_choice?: boolean; // If true, student can choose between prompt types
}

/**
 * Complete section configuration
 */
export interface TestSectionConfiguration {
  test_type: string;
  section_name: string;
  total_questions: number;
  time_limit_minutes: number;
  section_structure: SectionStructure;
}

/**
 * Database of all section configurations
 */
export interface SectionConfigDatabase {
  [testTypeAndSection: string]: TestSectionConfiguration;
}
