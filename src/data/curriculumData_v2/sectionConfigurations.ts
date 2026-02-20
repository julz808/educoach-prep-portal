/**
 * Section-Level Configuration for V2 Question Generation
 * Defines how to generate complete test sections with proper question distribution
 *
 * Created: 2026-02-09
 */

import type { SectionConfigDatabase } from './types';

/**
 * Section configurations for all test types
 *
 * Strategy types:
 * - "balanced": Evenly distribute questions across sub-skills (e.g., 40 Q ÷ 5 sub-skills = 8 Q each)
 * - "passage_based": Generate passages first, then questions (e.g., NSW Selective Reading)
 * - "hybrid": Mix of standalone and passage-based (e.g., VIC Selective Reading, EduTest Reading)
 */
export const SECTION_CONFIGURATIONS: SectionConfigDatabase = {

  // ============================================
  // EDUTEST SCHOLARSHIP (YEAR 7 ENTRY)
  // ============================================

  "EduTest Scholarship (Year 7 Entry) - Verbal Reasoning": {
    test_type: "EduTest Scholarship (Year 7 Entry)",
    section_name: "Verbal Reasoning",
    total_questions: 60,
    time_limit_minutes: 30,

    section_structure: {
      generation_strategy: "balanced",
      balanced_distribution: {
        total_questions: 60,
        sub_skills: [
          "Vocabulary & Semantic Knowledge",
          "Analogical Reasoning & Relationships",
          "Code Breaking & Pattern Recognition",
          "Word Manipulation & Rearrangement",
          "Foreign Language Translation Logic",
          "Logical Deduction & Conditional Reasoning",
          "Sequential Ordering & Position Reasoning",
          "Classification & Categorization (Odd One Out)"
        ],
        distribution_strategy: "even"  // 60 ÷ 8 = 7-8 questions per sub-skill
      }
    }
  },

  "EduTest Scholarship (Year 7 Entry) - Numerical Reasoning": {
    test_type: "EduTest Scholarship (Year 7 Entry)",
    section_name: "Numerical Reasoning",
    total_questions: 50,
    time_limit_minutes: 30,

    section_structure: {
      generation_strategy: "balanced",
      balanced_distribution: {
        total_questions: 50,
        sub_skills: [
          "Number Series & Pattern Recognition",
          "Word Problems & Applied Reasoning",
          "Number Matrices & Grid Patterns",
          "Number Properties & Operations"
        ],
        distribution_strategy: "even"  // 50 ÷ 4 = 12-13 questions per sub-skill
      }
    }
  },

  "EduTest Scholarship (Year 7 Entry) - Mathematics": {
    test_type: "EduTest Scholarship (Year 7 Entry)",
    section_name: "Mathematics",
    total_questions: 60,
    time_limit_minutes: 30,

    section_structure: {
      generation_strategy: "balanced",
      balanced_distribution: {
        total_questions: 60,
        sub_skills: [
          "Fractions & Mixed Numbers",
          "Decimals & Decimal Operations",
          "Algebra & Equation Solving",
          "Geometry & Spatial Reasoning",
          "Statistics & Data Interpretation",
          "Applied Word Problems"
        ],
        distribution_strategy: "even"  // 60 ÷ 6 = 10 questions per sub-skill
      }
    }
  },

  "EduTest Scholarship (Year 7 Entry) - Reading Comprehension": {
    test_type: "EduTest Scholarship (Year 7 Entry)",
    section_name: "Reading Comprehension",
    total_questions: 50,
    time_limit_minutes: 30,

    section_structure: {
      generation_strategy: "hybrid",  // Mostly standalone, some passage-based
      hybrid_blueprint: {
        // 85% standalone (42-43 questions)
        standalone_count: 43,
        standalone_distribution: [
          { sub_skill: "Sentence Transformation", count: 8 },
          { sub_skill: "Grammar & Sentence Correction", count: 8 },
          { sub_skill: "Punctuation & Capitalization", count: 7 },
          { sub_skill: "Vocabulary in Context", count: 12 },  // Micro-context (2-3 sentences)
          { sub_skill: "Figurative Language & Idioms", count: 8 }
        ],

        // 15% passage-based (7 questions = 1 passage with 7 questions)
        passage_based_count: 7,
        passage_distribution: [
          {
            passage_type: "medium",
            count: 1,  // ONE passage only
            word_count_range: [250, 400],
            questions_per_passage: 7,
            sub_skills: ["Passage Comprehension & Inference"]
          }
        ],

        interleaving_strategy: "passages_last"  // Passage at end of test
      }
    }
  },

  "EduTest Scholarship (Year 7 Entry) - Written Expression": {
    test_type: "EduTest Scholarship (Year 7 Entry)",
    section_name: "Written Expression",
    total_questions: 2,  // Generate 2 prompts (student chooses 1 to answer)
    time_limit_minutes: 30,

    section_structure: {
      generation_strategy: "writing_prompt",
      writing_blueprint: {
        total_prompts: 2,  // Generate both prompt types
        prompt_types: [
          "Creative & Imaginative Writing",
          "Persuasive & Argumentative Writing"
        ],
        word_limit: 600,
        time_limit_minutes: 30,
        allow_choice: true  // Student chooses between creative or persuasive
      }
    }
  },

  // ============================================
  // NSW SELECTIVE ENTRY (YEAR 7 ENTRY)
  // ============================================

  "NSW Selective Entry (Year 7 Entry) - Reading": {
    test_type: "NSW Selective Entry (Year 7 Entry)",
    section_name: "Reading",
    total_questions: 30,
    time_limit_minutes: 40,

    section_structure: {
      generation_strategy: "passage_based",  // 100% passage-based
      passage_blueprint: {
        total_passages: 7,  // 6-8 passages typical
        passage_distribution: [
          {
            passage_type: "narrative",
            count: 2,
            word_count_range: [300, 400],
            questions_per_passage: [4, 5],  // 4-5 questions each (8-10 total)
            sub_skills: [
              "Main Idea & Theme Identification",
              "Inference & Conclusion Drawing",
              "Character Analysis & Development"
            ]
          },
          {
            passage_type: "informational",
            count: 3,
            word_count_range: [250, 350],
            questions_per_passage: 4,  // 4 questions each (12 total)
            sub_skills: [
              "Main Idea & Theme Identification",
              "Supporting Details & Evidence",
              "Author's Purpose & Tone"
            ]
          },
          {
            passage_type: "poetry",
            count: 1,
            word_count_range: [100, 200],
            questions_per_passage: 4,  // 4 questions (4 total)
            sub_skills: [
              "Author's Purpose & Tone",
              "Vocabulary in Context"
            ]
          },
          {
            passage_type: "visual",
            count: 1,
            word_count_range: [0, 50],  // Just caption/context
            questions_per_passage: [3, 4],  // 3-4 questions (3-4 total)
            sub_skills: ["Vocabulary in Context"]
          }
        ]
      }
    }
  },

  "NSW Selective Entry (Year 7 Entry) - Mathematical Reasoning": {
    test_type: "NSW Selective Entry (Year 7 Entry)",
    section_name: "Mathematical Reasoning",
    total_questions: 35,
    time_limit_minutes: 40,

    section_structure: {
      generation_strategy: "balanced",
      balanced_distribution: {
        total_questions: 35,
        sub_skills: [
          "Number Operations & Properties",
          "Fractions, Decimals & Percentages",
          "Algebra & Equations",
          "Geometry & Measurement",
          "Ratios & Proportions",
          "Data Interpretation",
          "Word Problems & Applied Reasoning"
        ],
        distribution_strategy: "even"  // 35 ÷ 7 = 5 questions per sub-skill
      }
    }
  },

  "NSW Selective Entry (Year 7 Entry) - Thinking Skills": {
    test_type: "NSW Selective Entry (Year 7 Entry)",
    section_name: "Thinking Skills",
    total_questions: 40,
    time_limit_minutes: 40,

    section_structure: {
      generation_strategy: "balanced",
      balanced_distribution: {
        total_questions: 40,
        sub_skills: [
          "Pattern Recognition & Sequences",
          "Logical Deduction",
          "Analogies & Relationships",
          "Classification & Odd One Out",
          "Spatial Reasoning",
          "Code Breaking & Symbol Logic",
          "Problem Solving & Lateral Thinking"
        ],
        distribution_strategy: "even"  // 40 ÷ 7 = 5-6 questions per sub-skill
      }
    }
  },

  "NSW Selective Entry (Year 7 Entry) - Writing": {
    test_type: "NSW Selective Entry (Year 7 Entry)",
    section_name: "Writing",
    total_questions: 1,  // Student writes 1 response
    time_limit_minutes: 30,

    section_structure: {
      generation_strategy: "writing_prompt",
      writing_blueprint: {
        total_prompts: 1,  // Generate 1 prompt per test
        prompt_types: [
          "Imaginative/Speculative Writing",
          "Informative/Explanatory Writing",
          "Narrative/Creative Writing",
          "Personal/Reflective Writing",
          "Persuasive/Argumentative Writing"
        ],
        word_limit: 600,
        time_limit_minutes: 30,
        allow_choice: false  // Test provides 1 prompt (rotates through 5 types across modes)
      }
    }
  },

  // ============================================
  // VIC SELECTIVE ENTRY (YEAR 9 ENTRY)
  // ============================================

  "VIC Selective Entry (Year 9 Entry) - Reading Reasoning": {
    test_type: "VIC Selective Entry (Year 9 Entry)",
    section_name: "Reading Reasoning",
    total_questions: 50,
    time_limit_minutes: 35,

    section_structure: {
      generation_strategy: "hybrid",  // Mix of standalone and passage-based
      hybrid_blueprint: {
        // 40% standalone (20 questions)
        standalone_count: 20,
        standalone_distribution: [
          { sub_skill: "Vocabulary in Context", count: 5 },
          { sub_skill: "Grammar & Sentence Structure", count: 4 },
          { sub_skill: "Punctuation & Mechanics", count: 4 },
          { sub_skill: "Sentence Transformation", count: 4 },
          { sub_skill: "Idioms & Figurative Language", count: 2 },
          { sub_skill: "Spelling & Word Choice", count: 1 }
        ],

        // 60% passage-based (30 questions)
        passage_based_count: 30,
        passage_distribution: [
          {
            passage_type: "micro",  // 50-150 words
            count: 3,
            word_count_range: [50, 150],
            questions_per_passage: 2,  // 6 total questions
            sub_skills: ["Vocabulary in Context"]
          },
          {
            passage_type: "medium",  // 200-350 words
            count: 4,
            word_count_range: [200, 350],
            questions_per_passage: [3, 4],  // 12-16 total questions
            sub_skills: [
              "Inference & Drawing Conclusions",
              "Main Idea & Central Theme",
              "Supporting Details & Evidence"
            ]
          },
          {
            passage_type: "long",  // 400-600 words
            count: 2,
            word_count_range: [400, 600],
            questions_per_passage: [3, 4],  // 6-8 total questions
            sub_skills: [
              "Author's Purpose & Tone",
              "Inference & Drawing Conclusions",
              "Main Idea & Central Theme"
            ]
          }
        ],

        interleaving_strategy: "mixed"  // Intersperse throughout test
      }
    }
  },

  "VIC Selective Entry (Year 9 Entry) - Mathematics Reasoning": {
    test_type: "VIC Selective Entry (Year 9 Entry)",
    section_name: "Mathematics Reasoning",
    total_questions: 60,
    time_limit_minutes: 30,

    section_structure: {
      generation_strategy: "balanced",
      balanced_distribution: {
        total_questions: 60,
        sub_skills: [
          "Algebraic Equations & Problem Solving",
          "Fractions, Decimals & Percentages",
          "Geometry - Area, Perimeter & Volume",
          "Ratios & Proportions",
          "Data Interpretation - Tables & Graphs",
          "Number Operations & Properties",
          "Time, Money & Measurement",
          "Word Problems & Logical Reasoning"
        ],
        distribution_strategy: "even"  // 60 ÷ 8 = 7-8 questions per sub-skill
      }
    }
  },

  "VIC Selective Entry (Year 9 Entry) - General Ability - Verbal": {
    test_type: "VIC Selective Entry (Year 9 Entry)",
    section_name: "General Ability - Verbal",
    total_questions: 60,
    time_limit_minutes: 30,

    section_structure: {
      generation_strategy: "balanced",
      balanced_distribution: {
        total_questions: 60,
        sub_skills: [
          "Vocabulary & Synonyms/Antonyms",
          "Analogies - Word Relationships",
          "Letter Series & Patterns",
          "Odd One Out - Classification",
          "Code & Symbol Substitution",
          "Word Completion & Context",
          "Logical Deduction & Conditional Reasoning"
        ],
        distribution_strategy: "even"  // 60 ÷ 7 = 8-9 questions per sub-skill
      }
    }
  },

  "VIC Selective Entry (Year 9 Entry) - General Ability - Quantitative": {
    test_type: "VIC Selective Entry (Year 9 Entry)",
    section_name: "General Ability - Quantitative",
    total_questions: 50,
    time_limit_minutes: 30,

    section_structure: {
      generation_strategy: "balanced",
      balanced_distribution: {
        total_questions: 50,
        sub_skills: [
          "Number Series & Sequences",
          "Number Grids & Matrices",
          "Applied Word Problems",
          "Pattern Recognition in Paired Numbers"
        ],
        distribution_strategy: "even"  // 50 ÷ 4 = 12-13 questions per sub-skill
      }
    }
  },

  "VIC Selective Entry (Year 9 Entry) - Writing": {
    test_type: "VIC Selective Entry (Year 9 Entry)",
    section_name: "Writing",
    total_questions: 2,  // Generate 2 prompts (student chooses 1 to answer)
    time_limit_minutes: 40,

    section_structure: {
      generation_strategy: "writing_prompt",
      writing_blueprint: {
        total_prompts: 2,  // Generate both prompt types
        prompt_types: [
          "Creative Writing",
          "Persuasive Writing"
        ],
        word_limit: 600,
        time_limit_minutes: 40,
        allow_choice: true  // Student chooses between creative or persuasive
      }
    }
  },

  // ============================================
  // ACER SCHOLARSHIP (YEAR 7 ENTRY)
  // ============================================

  "ACER Scholarship (Year 7 Entry) - Humanities": {
    test_type: "ACER Scholarship (Year 7 Entry)",
    section_name: "Humanities",
    total_questions: 35,
    time_limit_minutes: 47,

    section_structure: {
      generation_strategy: "passage_based",  // 100% passage-based
      passage_blueprint: {
        total_passages: 7,  // 6-8 passages typical
        passage_distribution: [
          {
            passage_type: "informational",
            count: 2,
            word_count_range: [400, 600],
            questions_per_passage: 5,  // 10 total questions
            sub_skills: [
              "Main Idea & Theme Identification",
              "Literal Comprehension",
              "Vocabulary in Context"
            ]
          },
          {
            passage_type: "persuasive",
            count: 2,
            word_count_range: [400, 500],
            questions_per_passage: [6, 7],  // 12-14 total questions
            sub_skills: [
              "Inference & Interpretation",
              "Analysis & Comparison",
              "Sequencing & Text Organization"
            ]
          },
          {
            passage_type: "narrative",
            count: 1,
            word_count_range: [600, 700],
            questions_per_passage: 6,  // 6 total questions
            sub_skills: [
              "Literal Comprehension",
              "Inference & Interpretation",
              "Analysis & Comparison"
            ]
          },
          {
            passage_type: "poetry",
            count: 1,
            word_count_range: [150, 250],
            questions_per_passage: 4,  // 4 total questions
            sub_skills: [
              "Poetry Analysis",
              "Vocabulary in Context"
            ]
          },
          {
            passage_type: "visual",
            count: 1,
            word_count_range: [0, 100],
            questions_per_passage: 3,  // 3 total questions
            sub_skills: ["Visual Interpretation"]
          }
        ]
      }
    }
  },

  "ACER Scholarship (Year 7 Entry) - Written Expression": {
    test_type: "ACER Scholarship (Year 7 Entry)",
    section_name: "Written Expression",
    total_questions: 2,  // Generate 2 prompts (student chooses 1 to answer)
    time_limit_minutes: 40,

    section_structure: {
      generation_strategy: "writing_prompt",
      writing_blueprint: {
        total_prompts: 2,  // Generate both prompt types
        prompt_types: [
          "Creative & Imaginative Writing",
          "Persuasive & Argumentative Writing"
        ],
        word_limit: 500,
        time_limit_minutes: 40,
        allow_choice: true  // Student chooses between creative or persuasive
      }
    }
  },

  "ACER Scholarship (Year 7 Entry) - Mathematics": {
    test_type: "ACER Scholarship (Year 7 Entry)",
    section_name: "Mathematics",
    total_questions: 35,
    time_limit_minutes: 47,

    section_structure: {
      generation_strategy: "balanced",
      balanced_distribution: {
        total_questions: 35,
        sub_skills: [
          "Set Theory & Venn Diagrams",
          "Probability",
          "Geometry - Perimeter & Area",
          "Spatial Reasoning - Reflections & Transformations",
          "Spatial Reasoning - 3D Visualization",
          "Fractions & Number Lines",
          "Logic Puzzles & Algebraic Reasoning",
          "Data Interpretation & Applied Mathematics"
        ],
        distribution_strategy: "even"  // 35 ÷ 8 = 4-5 questions per sub-skill
      }
    }
  },

  // ============================================
  // YEAR 5 NAPLAN
  // ============================================

  "Year 5 NAPLAN - Writing": {
    test_type: "Year 5 NAPLAN",
    section_name: "Writing",
    total_questions: 1,  // Student writes 1 response
    time_limit_minutes: 42,

    section_structure: {
      generation_strategy: "writing_prompt",
      writing_blueprint: {
        total_prompts: 1,  // Generate 1 prompt per test
        prompt_types: [
          "Narrative Writing",
          "Persuasive Writing"
        ],
        word_limit: 400,
        time_limit_minutes: 42,
        allow_choice: false  // Test provides EITHER Narrative OR Persuasive (alternates across modes)
      }
    }
  },

  "Year 5 NAPLAN - Reading": {
    test_type: "Year 5 NAPLAN",
    section_name: "Reading",
    total_questions: 40,
    time_limit_minutes: 50,

    section_structure: {
      generation_strategy: "passage_based",  // 100% passage-based
      passage_blueprint: {
        total_passages: 5,  // 4-5 passages typical
        passage_distribution: [
          {
            passage_type: "narrative",
            count: 1,
            word_count_range: [250, 350],
            questions_per_passage: 8,  // 8 total questions
            sub_skills: [
              "Literal Comprehension",
              "Inferential Comprehension",
              "Vocabulary in Context"
            ]
          },
          {
            passage_type: "informational",
            count: 2,
            word_count_range: [300, 400],
            questions_per_passage: [7, 8],  // 14-16 total questions
            sub_skills: [
              "Literal Comprehension",
              "Text Structure & Features",
              "Vocabulary in Context"
            ]
          },
          {
            passage_type: "persuasive",
            count: 1,
            word_count_range: [250, 350],
            questions_per_passage: 7,  // 7 total questions
            sub_skills: [
              "Author's Purpose & Perspective",
              "Inferential Comprehension"
            ]
          },
          {
            passage_type: "multimodal",
            count: 1,
            word_count_range: [200, 300],
            questions_per_passage: [7, 9],  // 7-9 total questions
            sub_skills: [
              "Text Structure & Features",
              "Literal Comprehension"
            ]
          }
        ]
      }
    }
  },

  "Year 5 NAPLAN - Language Conventions": {
    test_type: "Year 5 NAPLAN",
    section_name: "Language Conventions",
    total_questions: 40,
    time_limit_minutes: 45,

    section_structure: {
      generation_strategy: "balanced",
      balanced_distribution: {
        total_questions: 40,
        sub_skills: [
          "Grammar & Sentence Structure",
          "Punctuation",
          "Spelling",
          "Parts of Speech & Word Choice"
        ],
        distribution_strategy: "even"  // 40 ÷ 4 = 10 questions per sub-skill
      }
    }
  },

  "Year 5 NAPLAN - Numeracy": {
    test_type: "Year 5 NAPLAN",
    section_name: "Numeracy",
    total_questions: 50,
    time_limit_minutes: 50,

    section_structure: {
      generation_strategy: "balanced",
      balanced_distribution: {
        total_questions: 50,
        sub_skills: [
          "Number Operations & Place Value",
          "Fractions & Basic Fraction Operations",
          "Patterns & Algebra",
          "Measurement, Time & Money",
          "Data & Basic Probability"
        ],
        distribution_strategy: "even"  // 50 ÷ 5 = 10 questions per sub-skill
      }
    }
  },

  // ============================================
  // YEAR 7 NAPLAN
  // ============================================

  "Year 7 NAPLAN - Writing": {
    test_type: "Year 7 NAPLAN",
    section_name: "Writing",
    total_questions: 1,  // Student writes 1 response
    time_limit_minutes: 42,

    section_structure: {
      generation_strategy: "writing_prompt",
      writing_blueprint: {
        total_prompts: 1,  // Generate 1 prompt per test
        prompt_types: [
          "Narrative Writing",
          "Persuasive Writing"
        ],
        word_limit: 500,
        time_limit_minutes: 42,
        allow_choice: false  // Test provides EITHER Narrative OR Persuasive (alternates across modes)
      }
    }
  },

  "Year 7 NAPLAN - Reading": {
    test_type: "Year 7 NAPLAN",
    section_name: "Reading",
    total_questions: 50,
    time_limit_minutes: 65,

    section_structure: {
      generation_strategy: "passage_based",  // 100% passage-based
      passage_blueprint: {
        total_passages: 7,  // 6-8 passages typical
        passage_distribution: [
          {
            passage_type: "narrative",
            count: 2,
            word_count_range: [500, 600],
            questions_per_passage: 6,  // 12 total questions
            sub_skills: [
              "Literal & Inferential Comprehension",
              "Vocabulary & Word Meaning"
            ]
          },
          {
            passage_type: "informational",
            count: 3,
            word_count_range: [500, 550],
            questions_per_passage: [6, 7],  // 18-21 total questions
            sub_skills: [
              "Literal & Inferential Comprehension",
              "Text Structure & Organization",
              "Vocabulary & Word Meaning"
            ]
          },
          {
            passage_type: "persuasive",
            count: 1,
            word_count_range: [450, 550],
            questions_per_passage: 6,  // 6 total questions
            sub_skills: [
              "Evaluating Arguments & Evidence",
              "Literal & Inferential Comprehension"
            ]
          },
          {
            passage_type: "multimodal",
            count: 1,
            word_count_range: [400, 500],
            questions_per_passage: [6, 8],  // 6-8 total questions
            sub_skills: [
              "Text Structure & Organization",
              "Vocabulary & Word Meaning"
            ]
          }
        ]
      }
    }
  },

  "Year 7 NAPLAN - Language Conventions": {
    test_type: "Year 7 NAPLAN",
    section_name: "Language Conventions",
    total_questions: 45,
    time_limit_minutes: 45,

    section_structure: {
      generation_strategy: "balanced",
      balanced_distribution: {
        total_questions: 45,
        sub_skills: [
          "Advanced Grammar & Sentence Structure",
          "Punctuation & Sentence Boundaries",
          "Spelling & Word Formation",
          "Vocabulary Precision & Usage"
        ],
        distribution_strategy: "even"  // 45 ÷ 4 = 11-12 questions per sub-skill
      }
    }
  },

  "Year 7 NAPLAN - Numeracy No Calculator": {
    test_type: "Year 7 NAPLAN",
    section_name: "Numeracy No Calculator",
    total_questions: 30,
    time_limit_minutes: 30,

    section_structure: {
      generation_strategy: "balanced",
      balanced_distribution: {
        total_questions: 30,
        sub_skills: [
          "Integer Operations & Negative Numbers",
          "Fractions, Decimals & Percentages",
          "Algebraic Thinking & Patterns",
          "Measurement & Spatial Reasoning",
          "Ratio, Rate & Proportion"
        ],
        distribution_strategy: "even"  // 30 ÷ 5 = 6 questions per sub-skill
      }
    }
  },

  "Year 7 NAPLAN - Numeracy Calculator": {
    test_type: "Year 7 NAPLAN",
    section_name: "Numeracy Calculator",
    total_questions: 35,
    time_limit_minutes: 35,

    section_structure: {
      generation_strategy: "balanced",
      balanced_distribution: {
        total_questions: 35,
        sub_skills: [
          "Advanced Problem Solving & Multi-Step Calculations",
          "Advanced Percentages & Financial Mathematics",
          "Advanced Measurement & Geometry",
          "Data Analysis, Statistics & Probability",
          "Complex Multi-Step Problem Solving"
        ],
        distribution_strategy: "even"  // 35 ÷ 5 = 7 questions per sub-skill
      }
    }
  }
};

/**
 * Helper function to get section configuration
 */
export function getSectionConfig(testType: string, sectionName: string): any {
  const key = `${testType} - ${sectionName}`;
  return SECTION_CONFIGURATIONS[key];
}

/**
 * Helper function to calculate questions per sub-skill for balanced sections
 */
export function calculateBalancedDistribution(totalQuestions: number, subSkills: string[]): Record<string, number> {
  const baseCount = Math.floor(totalQuestions / subSkills.length);
  const remainder = totalQuestions % subSkills.length;

  const distribution: Record<string, number> = {};

  subSkills.forEach((subSkill, index) => {
    // Distribute remainder questions to first few sub-skills
    distribution[subSkill] = baseCount + (index < remainder ? 1 : 0);
  });

  return distribution;
}
