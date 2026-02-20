import { supabase } from '@/integrations/supabase/client';

// Writing Rubric Types
export interface WritingCriterion {
  name: string;
  description: string;
  maxMarks: number;
  weight: number;
}

export interface WritingRubric {
  testName: string;
  sectionName: string;
  genre: string;
  timeMinutes: number;
  questions: number;
  totalMarks: number;
  criteria: WritingCriterion[];
}

export interface AssessmentResult {
  totalScore: number;
  maxPossibleScore: number;
  percentageScore: number;
  criterionScores: Record<string, {
    score: number;
    maxMarks: number;
    feedback: string;
  }>;
  overallFeedback: string;
  strengths: string[];
  improvements: string[];
  processingMetadata: {
    modelVersion: string;
    processingTimeMs: number;
    promptTokens?: number;
    responseTokens?: number;
  };
}

// Writing Rubrics Data
export const WRITING_RUBRICS = {
  "NSW Selective Entry (Year 7 Entry)": {
    "Narrative Writing": {
      testName: "NSW Selective Entry (Year 7 Entry)",
      sectionName: "Writing",
      genre: "Narrative Writing",
      timeMinutes: 30,
      questions: 1,
      totalMarks: 50,
      criteria: [
        {
          name: "Plot & Story Development",
          description: "Engaging storyline with clear beginning, complication, and resolution",
          maxMarks: 6,
          weight: 12
        },
        {
          name: "Character Development",
          description: "Well-developed characters with clear motivations and personalities",
          maxMarks: 6,
          weight: 12
        },
        {
          name: "Setting & Atmosphere",
          description: "Vivid setting description that enhances the narrative mood",
          maxMarks: 6,
          weight: 12
        },
        {
          name: "Narrative Voice & Style",
          description: "Consistent narrative perspective and engaging storytelling voice",
          maxMarks: 6,
          weight: 12
        },
        {
          name: "Descriptive Language",
          description: "Use of imagery, sensory details, and figurative language",
          maxMarks: 6,
          weight: 12
        },
        {
          name: "Structure & Pacing",
          description: "Effective story structure with appropriate pacing and transitions",
          maxMarks: 5,
          weight: 10
        },
        {
          name: "Sentence Variety",
          description: "Range of sentence structures used for narrative effect",
          maxMarks: 5,
          weight: 10
        },
        {
          name: "Grammar & Syntax",
          description: "Correct grammar, tense consistency, and sentence construction",
          maxMarks: 5,
          weight: 10
        },
        {
          name: "Spelling & Punctuation",
          description: "Accurate spelling and punctuation including dialogue conventions",
          maxMarks: 5,
          weight: 10
        }
      ]
    },
    "Persuasive Writing": {
      testName: "NSW Selective Entry (Year 7 Entry)",
      sectionName: "Writing",
      genre: "Persuasive Writing",
      timeMinutes: 30,
      questions: 1,
      totalMarks: 50,
      criteria: [
        {
          name: "Argument & Position",
          description: "Clear position with compelling arguments and reasoning",
          maxMarks: 8,
          weight: 16
        },
        {
          name: "Evidence & Examples",
          description: "Relevant, convincing evidence supporting arguments",
          maxMarks: 7,
          weight: 14
        },
        {
          name: "Persuasive Techniques",
          description: "Use of rhetorical devices, appeals to emotion/logic/credibility",
          maxMarks: 7,
          weight: 14
        },
        {
          name: "Counter-argument Acknowledgment",
          description: "Recognition and rebuttal of opposing viewpoints",
          maxMarks: 5,
          weight: 10
        },
        {
          name: "Structure & Organisation",
          description: "Logical progression with clear introduction, body, conclusion",
          maxMarks: 6,
          weight: 12
        },
        {
          name: "Formal Tone & Voice",
          description: "Appropriate formal register and authoritative voice",
          maxMarks: 5,
          weight: 10
        },
        {
          name: "Transitions & Cohesion",
          description: "Smooth connections between ideas and paragraphs",
          maxMarks: 4,
          weight: 8
        },
        {
          name: "Grammar & Syntax",
          description: "Correct grammar and sophisticated sentence structures",
          maxMarks: 4,
          weight: 8
        },
        {
          name: "Spelling & Punctuation",
          description: "Accurate spelling and punctuation for formal writing",
          maxMarks: 4,
          weight: 8
        }
      ]
    },
    "Expository Writing": {
      testName: "NSW Selective Entry (Year 7 Entry)",
      sectionName: "Writing",
      genre: "Expository Writing",
      timeMinutes: 30,
      questions: 1,
      totalMarks: 50,
      criteria: [
        {
          name: "Clarity of Explanation",
          description: "Clear, logical explanation of concepts or processes",
          maxMarks: 8,
          weight: 16
        },
        {
          name: "Information & Details",
          description: "Relevant facts, examples, and supporting details",
          maxMarks: 7,
          weight: 14
        },
        {
          name: "Organisation & Logic",
          description: "Logical sequencing and clear paragraph structure",
          maxMarks: 7,
          weight: 14
        },
        {
          name: "Topic Development",
          description: "Thorough exploration and development of the topic",
          maxMarks: 6,
          weight: 12
        },
        {
          name: "Objective Tone",
          description: "Neutral, informative tone appropriate for explanation",
          maxMarks: 5,
          weight: 10
        },
        {
          name: "Transitions & Flow",
          description: "Smooth connections between ideas and sections",
          maxMarks: 5,
          weight: 10
        },
        {
          name: "Technical Vocabulary",
          description: "Appropriate use of subject-specific terminology",
          maxMarks: 4,
          weight: 8
        },
        {
          name: "Grammar & Clarity",
          description: "Clear sentence construction supporting understanding",
          maxMarks: 4,
          weight: 8
        },
        {
          name: "Spelling & Punctuation",
          description: "Accurate spelling and punctuation for clarity",
          maxMarks: 4,
          weight: 8
        }
      ]
    },
    "Imaginative Writing": {
      testName: "NSW Selective Entry (Year 7 Entry)",
      sectionName: "Writing",
      genre: "Imaginative Writing",
      timeMinutes: 30,
      questions: 1,
      totalMarks: 50,
      criteria: [
        {
          name: "Creativity & Originality",
          description: "Unique ideas and innovative approach to the prompt",
          maxMarks: 8,
          weight: 16
        },
        {
          name: "Imaginative Elements",
          description: "Creative use of fantasy, speculation, or unusual perspectives",
          maxMarks: 7,
          weight: 14
        },
        {
          name: "Imagery & Description",
          description: "Vivid, original imagery and sensory details",
          maxMarks: 7,
          weight: 14
        },
        {
          name: "Voice & Style",
          description: "Distinctive, engaging voice suited to imaginative writing",
          maxMarks: 6,
          weight: 12
        },
        {
          name: "Structure & Coherence",
          description: "Clear structure that supports imaginative elements",
          maxMarks: 5,
          weight: 10
        },
        {
          name: "Language Innovation",
          description: "Creative use of language, metaphor, and expression",
          maxMarks: 5,
          weight: 10
        },
        {
          name: "Audience Engagement",
          description: "Ability to captivate and transport the reader",
          maxMarks: 4,
          weight: 8
        },
        {
          name: "Grammar & Fluency",
          description: "Technical control supporting creative expression",
          maxMarks: 4,
          weight: 8
        },
        {
          name: "Spelling & Punctuation",
          description: "Accurate conventions allowing focus on creativity",
          maxMarks: 4,
          weight: 8
        }
      ]
    }
  },

  "VIC Selective Entry (Year 9 Entry)": {
    "Creative Writing": {
      testName: "VIC Selective Entry (Year 9 Entry)",
      sectionName: "Writing",
      genre: "Creative Writing",
      timeMinutes: 20,
      questions: 1,
      totalMarks: 30,
      criteria: [
        {
          name: "Imagination & Originality",
          description: "Creative ideas, unique perspective, and innovative approach",
          maxMarks: 7,
          weight: 23.3
        },
        {
          name: "Story Craft",
          description: "Plot development, characterisation, and narrative techniques",
          maxMarks: 7,
          weight: 23.3
        },
        {
          name: "Language & Imagery",
          description: "Vivid descriptions, figurative language, and sensory details",
          maxMarks: 6,
          weight: 20
        },
        {
          name: "Structure & Coherence",
          description: "Clear narrative arc with effective pacing",
          maxMarks: 5,
          weight: 16.7
        },
        {
          name: "Technical Control",
          description: "Grammar, spelling, punctuation, and sentence fluency",
          maxMarks: 5,
          weight: 16.7
        }
      ]
    },
    "Persuasive Writing": {
      testName: "VIC Selective Entry (Year 9 Entry)",
      sectionName: "Writing",
      genre: "Persuasive Writing",
      timeMinutes: 20,
      questions: 1,
      totalMarks: 30,
      criteria: [
        {
          name: "Argument Development",
          description: "Logical reasoning with clear thesis and supporting points",
          maxMarks: 8,
          weight: 26.7
        },
        {
          name: "Evidence & Support",
          description: "Relevant examples, facts, and reasoning to support claims",
          maxMarks: 6,
          weight: 20
        },
        {
          name: "Persuasive Strategies",
          description: "Effective use of persuasive techniques and appeals",
          maxMarks: 6,
          weight: 20
        },
        {
          name: "Organisation & Flow",
          description: "Logical structure with clear paragraphing and transitions",
          maxMarks: 5,
          weight: 16.7
        },
        {
          name: "Language & Convention",
          description: "Formal tone, precise vocabulary, and technical accuracy",
          maxMarks: 5,
          weight: 16.7
        }
      ]
    }
  },

  "Year 5 NAPLAN": {
    "Narrative Writing": {
      testName: "Year 5 NAPLAN",
      sectionName: "Writing",
      genre: "Narrative Writing",
      timeMinutes: 42,
      questions: 1,
      totalMarks: 48,
      criteria: [
        {
          name: "Audience",
          description: "Engages reader through narrative techniques and language choices",
          maxMarks: 6,
          weight: 12.5
        },
        {
          name: "Text Structure",
          description: "Clear narrative structure with orientation, complication, resolution",
          maxMarks: 4,
          weight: 8.3
        },
        {
          name: "Ideas",
          description: "Imaginative ideas developed through the narrative",
          maxMarks: 5,
          weight: 10.4
        },
        {
          name: "Character & Setting",
          description: "Development of characters and establishment of setting",
          maxMarks: 4,
          weight: 8.3
        },
        {
          name: "Vocabulary",
          description: "Precise and engaging word choices for narrative effect",
          maxMarks: 5,
          weight: 10.4
        },
        {
          name: "Cohesion",
          description: "Smooth flow of narrative events and ideas",
          maxMarks: 4,
          weight: 8.3
        },
        {
          name: "Paragraphing",
          description: "Paragraphs support narrative structure and pacing",
          maxMarks: 3,
          weight: 6.3
        },
        {
          name: "Sentence Structure",
          description: "Varied sentences creating narrative rhythm",
          maxMarks: 6,
          weight: 12.5
        },
        {
          name: "Punctuation",
          description: "Correct punctuation including dialogue where used",
          maxMarks: 5,
          weight: 10.4
        },
        {
          name: "Spelling",
          description: "Accurate spelling of narrative vocabulary",
          maxMarks: 6,
          weight: 12.5
        }
      ]
    },
    "Persuasive Writing": {
      testName: "Year 5 NAPLAN",
      sectionName: "Writing",
      genre: "Persuasive Writing",
      timeMinutes: 42,
      questions: 1,
      totalMarks: 48,
      criteria: [
        {
          name: "Audience",
          description: "Positions and persuades reader through deliberate choices",
          maxMarks: 6,
          weight: 12.5
        },
        {
          name: "Text Structure",
          description: "Clear persuasive structure with introduction, arguments, conclusion",
          maxMarks: 4,
          weight: 8.3
        },
        {
          name: "Ideas",
          description: "Relevant arguments and supporting ideas",
          maxMarks: 5,
          weight: 10.4
        },
        {
          name: "Persuasive Devices",
          description: "Use of persuasive techniques and language features",
          maxMarks: 4,
          weight: 8.3
        },
        {
          name: "Vocabulary",
          description: "Precise vocabulary choices for persuasive impact",
          maxMarks: 5,
          weight: 10.4
        },
        {
          name: "Cohesion",
          description: "Logical connections between arguments and ideas",
          maxMarks: 4,
          weight: 8.3
        },
        {
          name: "Paragraphing",
          description: "Paragraphs organize arguments effectively",
          maxMarks: 3,
          weight: 6.3
        },
        {
          name: "Sentence Structure",
          description: "Controlled sentences for persuasive effect",
          maxMarks: 6,
          weight: 12.5
        },
        {
          name: "Punctuation",
          description: "Accurate punctuation for clarity and emphasis",
          maxMarks: 5,
          weight: 10.4
        },
        {
          name: "Spelling",
          description: "Correct spelling maintaining credibility",
          maxMarks: 6,
          weight: 12.5
        }
      ]
    }
  },

  "Year 7 NAPLAN": {
    "Narrative Writing": {
      testName: "Year 7 NAPLAN",
      sectionName: "Writing",
      genre: "Narrative Writing",
      timeMinutes: 42,
      questions: 1,
      totalMarks: 48,
      criteria: [
        {
          name: "Audience",
          description: "Sophisticated engagement through narrative craft",
          maxMarks: 6,
          weight: 12.5
        },
        {
          name: "Text Structure",
          description: "Complex narrative structure with sophisticated techniques",
          maxMarks: 4,
          weight: 8.3
        },
        {
          name: "Ideas",
          description: "Original, complex ideas with thematic depth",
          maxMarks: 5,
          weight: 10.4
        },
        {
          name: "Character & Setting",
          description: "Multi-dimensional characters and atmospheric settings",
          maxMarks: 4,
          weight: 8.3
        },
        {
          name: "Vocabulary",
          description: "Sophisticated vocabulary creating narrative effects",
          maxMarks: 5,
          weight: 10.4
        },
        {
          name: "Cohesion",
          description: "Seamless narrative flow with sophisticated transitions",
          maxMarks: 4,
          weight: 8.3
        },
        {
          name: "Paragraphing",
          description: "Strategic paragraphing for narrative impact",
          maxMarks: 3,
          weight: 6.3
        },
        {
          name: "Sentence Structure",
          description: "Complex sentences used for stylistic effect",
          maxMarks: 6,
          weight: 12.5
        },
        {
          name: "Punctuation",
          description: "Sophisticated punctuation enhancing narrative",
          maxMarks: 5,
          weight: 10.4
        },
        {
          name: "Spelling",
          description: "Consistent accuracy with challenging vocabulary",
          maxMarks: 6,
          weight: 12.5
        }
      ]
    },
    "Persuasive Writing": {
      testName: "Year 7 NAPLAN",
      sectionName: "Writing",
      genre: "Persuasive Writing",
      timeMinutes: 42,
      questions: 1,
      totalMarks: 48,
      criteria: [
        {
          name: "Audience",
          description: "Sophisticated positioning and persuasion of reader",
          maxMarks: 6,
          weight: 12.5
        },
        {
          name: "Text Structure",
          description: "Sophisticated argumentation structure",
          maxMarks: 4,
          weight: 8.3
        },
        {
          name: "Ideas",
          description: "Complex arguments with nuanced reasoning",
          maxMarks: 5,
          weight: 10.4
        },
        {
          name: "Persuasive Devices",
          description: "Sophisticated rhetorical techniques and appeals",
          maxMarks: 4,
          weight: 8.3
        },
        {
          name: "Vocabulary",
          description: "Precise, sophisticated vocabulary for persuasive power",
          maxMarks: 5,
          weight: 10.4
        },
        {
          name: "Cohesion",
          description: "Sophisticated linking of complex arguments",
          maxMarks: 4,
          weight: 8.3
        },
        {
          name: "Paragraphing",
          description: "Strategic paragraphing enhancing argument flow",
          maxMarks: 3,
          weight: 6.3
        },
        {
          name: "Sentence Structure",
          description: "Rhetorical sentence structures for impact",
          maxMarks: 6,
          weight: 12.5
        },
        {
          name: "Punctuation",
          description: "Strategic punctuation for emphasis and clarity",
          maxMarks: 5,
          weight: 10.4
        },
        {
          name: "Spelling",
          description: "Flawless spelling maintaining authority",
          maxMarks: 6,
          weight: 12.5
        }
      ]
    }
  },

  "EduTest Scholarship (Year 7 Entry)": {
    "Narrative Writing": {
      testName: "EduTest Scholarship (Year 7 Entry)",
      sectionName: "Written Expression",
      genre: "Narrative Writing",
      timeMinutes: 15,
      questions: 1,
      totalMarks: 15,
      criteria: [
        {
          name: "Story Development",
          description: "Engaging plot with clear beginning, middle, and end",
          maxMarks: 5,
          weight: 33.3
        },
        {
          name: "Structure & Organisation",
          description: "Clear narrative structure with logical progression",
          maxMarks: 5,
          weight: 33.3
        },
        {
          name: "Language & Expression",
          description: "Descriptive language, vocabulary, and sentence variety",
          maxMarks: 5,
          weight: 33.3
        }
      ]
    },
    "Persuasive Writing": {
      testName: "EduTest Scholarship (Year 7 Entry)",
      sectionName: "Written Expression",
      genre: "Persuasive Writing",
      timeMinutes: 15,
      questions: 1,
      totalMarks: 15,
      criteria: [
        {
          name: "Argument & Evidence",
          description: "Clear position with supporting reasons and examples",
          maxMarks: 5,
          weight: 33.3
        },
        {
          name: "Structure & Organisation",
          description: "Logical persuasive structure with clear paragraphing",
          maxMarks: 5,
          weight: 33.3
        },
        {
          name: "Language & Expression",
          description: "Persuasive language, formal tone, and vocabulary",
          maxMarks: 5,
          weight: 33.3
        }
      ]
    },
    "Expository Writing": {
      testName: "EduTest Scholarship (Year 7 Entry)",
      sectionName: "Written Expression",
      genre: "Expository Writing",
      timeMinutes: 15,
      questions: 1,
      totalMarks: 15,
      criteria: [
        {
          name: "Information & Explanation",
          description: "Clear explanation with relevant facts and details",
          maxMarks: 5,
          weight: 33.3
        },
        {
          name: "Structure & Organisation",
          description: "Logical organisation with clear topic development",
          maxMarks: 5,
          weight: 33.3
        },
        {
          name: "Language & Expression",
          description: "Clear, informative language with appropriate vocabulary",
          maxMarks: 5,
          weight: 33.3
        }
      ]
    },
    "Creative Writing": {
      testName: "EduTest Scholarship (Year 7 Entry)",
      sectionName: "Written Expression",
      genre: "Creative Writing",
      timeMinutes: 15,
      questions: 1,
      totalMarks: 15,
      criteria: [
        {
          name: "Creativity & Imagination",
          description: "Original ideas and imaginative approach",
          maxMarks: 5,
          weight: 33.3
        },
        {
          name: "Structure & Organisation",
          description: "Coherent structure supporting creative elements",
          maxMarks: 5,
          weight: 33.3
        },
        {
          name: "Language & Expression",
          description: "Vivid language, imagery, and creative expression",
          maxMarks: 5,
          weight: 33.3
        }
      ]
    },
    "Descriptive Writing": {
      testName: "EduTest Scholarship (Year 7 Entry)",
      sectionName: "Written Expression",
      genre: "Descriptive Writing",
      timeMinutes: 15,
      questions: 1,
      totalMarks: 15,
      criteria: [
        {
          name: "Descriptive Detail",
          description: "Rich sensory details and vivid descriptions",
          maxMarks: 5,
          weight: 33.3
        },
        {
          name: "Structure & Organisation",
          description: "Logical organisation of descriptive elements",
          maxMarks: 5,
          weight: 33.3
        },
        {
          name: "Language & Expression",
          description: "Figurative language, imagery, and vocabulary",
          maxMarks: 5,
          weight: 33.3
        }
      ]
    }
  },

  "ACER Scholarship (Year 7 Entry)": {
    "Narrative Writing": {
      testName: "ACER Scholarship (Year 7 Entry)",
      sectionName: "Written Expression",
      genre: "Narrative Writing",
      timeMinutes: 25,
      questions: 1,
      totalMarks: 20,
      criteria: [
        {
          name: "Originality & Imagination",
          description: "Unique story ideas and creative narrative approach",
          maxMarks: 7,
          weight: 35
        },
        {
          name: "Narrative Development",
          description: "Story progression, character development, and engagement",
          maxMarks: 5,
          weight: 25
        },
        {
          name: "Language & Style",
          description: "Descriptive language, imagery, and narrative voice",
          maxMarks: 4,
          weight: 20
        },
        {
          name: "Structure & Flow",
          description: "Coherent narrative structure with smooth progression",
          maxMarks: 3,
          weight: 15
        },
        {
          name: "Technical Accuracy",
          description: "Basic grammar, spelling, and punctuation",
          maxMarks: 1,
          weight: 5
        }
      ]
    },
    "Persuasive Writing": {
      testName: "ACER Scholarship (Year 7 Entry)",
      sectionName: "Written Expression",
      genre: "Persuasive Writing",
      timeMinutes: 25,
      questions: 1,
      totalMarks: 20,
      criteria: [
        {
          name: "Quality of Argument",
          description: "Original thinking and compelling reasoning",
          maxMarks: 7,
          weight: 35
        },
        {
          name: "Evidence & Support",
          description: "Relevant examples and logical support",
          maxMarks: 5,
          weight: 25
        },
        {
          name: "Persuasive Language",
          description: "Appropriate tone and persuasive techniques",
          maxMarks: 4,
          weight: 20
        },
        {
          name: "Organisation",
          description: "Clear structure with logical flow",
          maxMarks: 3,
          weight: 15
        },
        {
          name: "Technical Accuracy",
          description: "Basic grammar, spelling, and punctuation",
          maxMarks: 1,
          weight: 5
        }
      ]
    },
    "Expository Writing": {
      testName: "ACER Scholarship (Year 7 Entry)",
      sectionName: "Written Expression",
      genre: "Expository Writing",
      timeMinutes: 25,
      questions: 1,
      totalMarks: 20,
      criteria: [
        {
          name: "Clarity of Ideas",
          description: "Original approach to explaining concepts clearly",
          maxMarks: 7,
          weight: 35
        },
        {
          name: "Information & Development",
          description: "Thorough explanation with relevant details",
          maxMarks: 5,
          weight: 25
        },
        {
          name: "Explanatory Language",
          description: "Clear, precise language for explanation",
          maxMarks: 4,
          weight: 20
        },
        {
          name: "Organisation",
          description: "Logical structure for clear understanding",
          maxMarks: 3,
          weight: 15
        },
        {
          name: "Technical Accuracy",
          description: "Basic grammar, spelling, and punctuation",
          maxMarks: 1,
          weight: 5
        }
      ]
    },
    "Creative Writing": {
      testName: "ACER Scholarship (Year 7 Entry)",
      sectionName: "Written Expression",
      genre: "Creative Writing",
      timeMinutes: 25,
      questions: 1,
      totalMarks: 20,
      criteria: [
        {
          name: "Originality & Imagination",
          description: "Highly creative and unique ideas",
          maxMarks: 7,
          weight: 35
        },
        {
          name: "Creative Development",
          description: "Development of imaginative elements",
          maxMarks: 5,
          weight: 25
        },
        {
          name: "Language & Style",
          description: "Creative use of language and expression",
          maxMarks: 4,
          weight: 20
        },
        {
          name: "Structure & Flow",
          description: "Structure supporting creative vision",
          maxMarks: 3,
          weight: 15
        },
        {
          name: "Technical Accuracy",
          description: "Basic grammar, spelling, and punctuation",
          maxMarks: 1,
          weight: 5
        }
      ]
    }
  }
} as const;

export class WritingRubricService {
  /**
   * Map V2 sub-skill names to rubric genre names
   */
  private static normalizeGenreName(subSkill: string, productType: string): string {
    // Direct mappings for V2 sub-skill names → rubric genres
    const mappings: Record<string, string> = {
      // ACER
      "Creative & Imaginative Writing": "Creative Writing",
      "Persuasive & Argumentative Writing": "Persuasive Writing",

      // NSW Selective
      "Imaginative/Speculative Writing": "Imaginative Writing",
      "Informative/Explanatory Writing": "Expository Writing",
      "Narrative/Creative Writing": "Narrative Writing",
      "Personal/Reflective Writing": "Narrative Writing", // Fallback
      "Persuasive/Argumentative Writing": "Persuasive Writing",

      // VIC, NAPLAN (already match exactly)
      "Creative Writing": "Creative Writing",
      "Persuasive Writing": "Persuasive Writing",
      "Narrative Writing": "Narrative Writing",
    };

    return mappings[subSkill] || subSkill;
  }

  /**
   * Get rubric for specific product and genre
   * Supports both exact genre names and V2 sub-skill names
   */
  static getRubric(productType: string, genreOrSubSkill: string): WritingRubric | null {
    try {
      const productRubrics = WRITING_RUBRICS[productType as keyof typeof WRITING_RUBRICS];
      if (!productRubrics) {
        console.warn(`No rubrics found for product: ${productType}`);
        return null;
      }

      // Normalize the genre name (handles V2 sub-skill → rubric genre mapping)
      const normalizedGenre = this.normalizeGenreName(genreOrSubSkill, productType);

      const rubric = productRubrics[normalizedGenre as keyof typeof productRubrics];
      if (!rubric) {
        console.warn(`No rubric found for genre: ${normalizedGenre} (from: ${genreOrSubSkill}) in product: ${productType}`);
        return null;
      }

      return rubric as WritingRubric;
    } catch (error) {
      console.error('Error getting rubric:', error);
      return null;
    }
  }

  /**
   * Get year level from product type
   */
  static getYearLevel(productType: string): string {
    const yearMapping: Record<string, string> = {
      "NSW Selective Entry (Year 7 Entry)": "Year 6-7",
      "VIC Selective Entry (Year 9 Entry)": "Year 8-9", 
      "Year 5 NAPLAN": "Year 5",
      "Year 7 NAPLAN": "Year 7",
      "EduTest Scholarship (Year 7 Entry)": "Year 6-7",
      "ACER Scholarship (Year 7 Entry)": "Year 6-7"
    };

    return yearMapping[productType] || "Year 7";
  }

  /**
   * Generate Claude API prompt for assessment
   */
  static generateAssessmentPrompt(
    userResponse: string, 
    writingPrompt: string, 
    rubric: WritingRubric,
    yearLevel: string
  ): string {
    const criteriaList = rubric.criteria.map(criterion => 
      `- ${criterion.name} (${criterion.maxMarks} marks): ${criterion.description}`
    ).join('\n');

    return `You are an experienced Australian educator assessing ${rubric.genre.toLowerCase()} for ${rubric.testName}.

CONTEXT:
- Year Level: ${yearLevel}
- Time Allocated: ${rubric.timeMinutes} minutes
- Writing Genre: ${rubric.genre}
- Total Possible Score: ${rubric.totalMarks} marks

WRITING PROMPT:
"${writingPrompt}"

STUDENT RESPONSE:
"${userResponse}"

ASSESSMENT CRITERIA (Total: ${rubric.totalMarks} marks):
${criteriaList}

ASSESSMENT GUIDELINES:
- Apply realistic scoring for ${yearLevel} students under ${rubric.timeMinutes}-minute time pressure
- Consider age-appropriate expectations for vocabulary, complexity, and technical accuracy
- Be fair but maintain Australian educational standards
- Provide constructive, specific feedback for improvement
- Score whole numbers only (no decimals)
- Consider the time constraints when evaluating - don't expect perfection in short timeframes

REQUIRED JSON RESPONSE:
{
  "totalScore": <number 0-${rubric.totalMarks}>,
  "criterionScores": {
    ${rubric.criteria.map(c => `"${c.name}": {"score": <0-${c.maxMarks}>, "feedback": "<specific 1-2 sentence feedback>"}`).join(',\n    ')}
  },
  "overallFeedback": "<2-3 sentences overall assessment>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"]
}`;
  }

  /**
   * Validate and clean API response
   */
  static validateAssessmentResponse(response: any, rubric: WritingRubric): AssessmentResult {
    // Ensure all required fields exist
    const totalScore = Math.max(0, Math.min(response.totalScore || 0, rubric.totalMarks));
    const criterionScores: Record<string, { score: number; maxMarks: number; feedback: string }> = {};
    
    // Validate each criterion score
    for (const criterion of rubric.criteria) {
      const criterionResponse = response.criterionScores?.[criterion.name];
      const score = Math.max(0, Math.min(criterionResponse?.score || 0, criterion.maxMarks));
      
      criterionScores[criterion.name] = {
        score,
        maxMarks: criterion.maxMarks,
        feedback: criterionResponse?.feedback || 'No specific feedback provided.'
      };
    }

    // Calculate percentage
    const percentageScore = rubric.totalMarks > 0 ? Math.round((totalScore / rubric.totalMarks) * 100) : 0;

    return {
      totalScore,
      maxPossibleScore: rubric.totalMarks,
      percentageScore,
      criterionScores,
      overallFeedback: response.overallFeedback || 'Assessment completed.',
      strengths: Array.isArray(response.strengths) ? response.strengths.slice(0, 5) : [],
      improvements: Array.isArray(response.improvements) ? response.improvements.slice(0, 5) : [],
      processingMetadata: {
        modelVersion: 'claude-sonnet-4-20250514',
        processingTimeMs: 0
      }
    };
  }

  /**
   * Get word count from text
   */
  static getWordCount(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Generate fallback score for API failures
   */
  static getFallbackScore(userResponse: string, rubric: WritingRubric): AssessmentResult {
    const wordCount = this.getWordCount(userResponse);
    const hasContent = wordCount > 20;
    const hasStructure = userResponse.includes('\n') || userResponse.length > 200;
    
    // Simple rule-based fallback scoring (40% base + 20% for structure)
    const baseScore = hasContent ? Math.floor(rubric.totalMarks * 0.4) : 0;
    const structureBonus = hasStructure ? Math.floor(rubric.totalMarks * 0.2) : 0;
    const totalScore = Math.min(baseScore + structureBonus, rubric.totalMarks);
    
    // Generate basic criterion scores
    const criterionScores: Record<string, { score: number; maxMarks: number; feedback: string }> = {};
    for (const criterion of rubric.criteria) {
      const score = Math.floor((totalScore / rubric.totalMarks) * criterion.maxMarks);
      criterionScores[criterion.name] = {
        score,
        maxMarks: criterion.maxMarks,
        feedback: 'Automatic assessment - detailed feedback unavailable.'
      };
    }

    return {
      totalScore,
      maxPossibleScore: rubric.totalMarks,
      percentageScore: Math.round((totalScore / rubric.totalMarks) * 100),
      criterionScores,
      overallFeedback: 'This response was assessed using automatic scoring due to technical issues. Your writing shows effort and we encourage you to continue developing your skills.',
      strengths: hasContent ? ['Response shows engagement with the prompt'] : [],
      improvements: wordCount < 50 ? ['Consider developing ideas with more detail'] : ['Continue practicing to improve writing skills'],
      processingMetadata: {
        modelVersion: 'fallback-scoring',
        processingTimeMs: 0,
        promptTokens: undefined,
        responseTokens: undefined
      }
    };
  }
}