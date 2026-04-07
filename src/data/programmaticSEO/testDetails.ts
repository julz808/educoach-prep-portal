/**
 * Test Section Details for Programmatic SEO Pages
 *
 * Structured test information for creating AEO-optimized tables
 * Sources: curriculumData.ts, official test documentation
 */

export interface TestSection {
  name: string;
  questions: number;
  timeMinutes: number;
  format: string;
  skillsTested: string[];
}

/**
 * VIC Selective Entry Test structure (ACER)
 */
export const vicSelectiveTestSections: TestSection[] = [
  {
    name: "Numerical Reasoning",
    questions: 50,
    timeMinutes: 30,
    format: "Multiple Choice",
    skillsTested: [
      "Number patterns and sequences",
      "Algebraic reasoning",
      "Geometric problem-solving",
      "Data interpretation",
      "Mathematical logic"
    ]
  },
  {
    name: "Reading Comprehension",
    questions: 50,
    timeMinutes: 35,
    format: "Multiple Choice",
    skillsTested: [
      "Inferential reasoning",
      "Interpretive comprehension",
      "Vocabulary in context",
      "Text structure analysis",
      "Critical analysis",
      "Integration and synthesis"
    ]
  },
  {
    name: "Verbal Reasoning",
    questions: 60,
    timeMinutes: 30,
    format: "Multiple Choice",
    skillsTested: [
      "Analogical reasoning",
      "Word relationships",
      "Vocabulary knowledge",
      "Logical verbal connections",
      "Language patterns"
    ]
  },
  {
    name: "Quantitative Reasoning",
    questions: 50,
    timeMinutes: 30,
    format: "Multiple Choice",
    skillsTested: [
      "Number sense",
      "Pattern recognition",
      "Proportional reasoning",
      "Logical problem-solving",
      "Abstract quantitative thinking"
    ]
  },
  {
    name: "Writing",
    questions: 2,
    timeMinutes: 45,
    format: "Extended Response",
    skillsTested: [
      "Creative narrative writing (15 minutes)",
      "Persuasive/analytical writing (30 minutes)",
      "Vocabulary and expression",
      "Structural organization",
      "Grammar and mechanics"
    ]
  }
];

/**
 * Get test sections by test type
 */
export const getTestSections = (testType: string): TestSection[] => {
  switch (testType) {
    case 'vic-selective':
      return vicSelectiveTestSections;
    // Add NSW Selective, ACER, EduTest when ready
    default:
      return [];
  }
};

/**
 * Calculate total test time and questions
 */
export const getTestTotals = (sections: TestSection[]) => {
  const totalQuestions = sections.reduce((sum, section) => sum + section.questions, 0);
  const totalTime = sections.reduce((sum, section) => sum + section.timeMinutes, 0);

  return {
    totalQuestions,
    totalTime,
    totalTimeFormatted: `${Math.floor(totalTime / 60)} hours ${totalTime % 60} minutes`
  };
};
