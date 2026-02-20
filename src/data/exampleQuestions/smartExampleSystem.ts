/**
 * SMART EXAMPLE SYSTEM
 *
 * Instead of injecting full examples into every prompt (expensive, bloated):
 * 1. Pre-extract patterns from example questions
 * 2. Inject compact pattern descriptions (~100-200 tokens vs 500-1000)
 * 3. Include one condensed example as reference point
 *
 * Benefits:
 * - 5x less prompt bloat
 * - 4x cheaper to run ($0.0008 vs $0.003 per question)
 * - Easier to maintain
 * - Still captures quality and style of examples
 */

export interface QuestionPattern {
  question_type: string;
  test_type: string;
  format_template: string;
  characteristics: string[];
  distractor_strategies: string[];
  style_notes: string[];
  example_refs?: string[];
}

export interface CondensedExample {
  question_snippet: string;
  answer: string;
  explanation_snippet: string;
}

/**
 * Load compact pattern for a question type
 * Returns null if no pattern available yet
 */
export function loadQuestionPattern(
  testType: string,
  subSkill: string
): QuestionPattern | null {
  // TODO: Load from JSON files once created
  // For now, return null - patterns will be created during example extraction phase

  // Example structure for when patterns are created:
  // const patterns = require('./patterns/edutest-verbal-patterns.json');
  // return patterns[subSkill] || null;

  console.log(`Pattern loading not yet implemented for ${testType} - ${subSkill}`);
  return null;
}

/**
 * Get one condensed example (not full example, just key info)
 * Returns null if no examples available yet
 */
export function getCondensedExample(
  testType: string,
  subSkill: string
): CondensedExample | null {
  // TODO: Load from JSON files once created
  // For now, return null - examples will be created during extraction phase

  console.log(`Example loading not yet implemented for ${testType} - ${subSkill}`);
  return null;
}

/**
 * Format smart guidance for prompt injection
 * This is what gets added to prompts - compact and efficient!
 *
 * @param testType - e.g., "EduTest Scholarship (Year 7 Entry)"
 * @param subSkill - e.g., "vocabulary-synonyms"
 * @returns Compact guidance string (~100-200 tokens)
 */
export function formatSmartGuidance(
  testType: string,
  subSkill: string
): string {
  const pattern = loadQuestionPattern(testType, subSkill);
  const example = getCondensedExample(testType, subSkill);

  // If no pattern available yet, return empty string
  // (System will fall back to general guidance)
  if (!pattern) {
    return '';
  }

  // Build compact guidance string
  let guidance = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 AUTHENTIC ${testType} STYLE GUIDE
   ${subSkill}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

QUESTION FORMAT:
"${pattern.format_template}"

KEY CHARACTERISTICS (match these exactly):
${pattern.characteristics.slice(0, 4).map((c, i) => `${i + 1}. ${c}`).join('\n')}

DISTRACTOR STRATEGIES (how to create wrong answers):
${pattern.distractor_strategies.slice(0, 3).map((s, i) => `${i + 1}. ${s}`).join('\n')}

STYLE REQUIREMENTS:
${pattern.style_notes.slice(0, 3).map((n, i) => `• ${n}`).join('\n')}
`;

  // Add condensed example if available
  if (example) {
    guidance += `\nQUICK REFERENCE:
"${example.question_snippet}" → ${example.answer}
${example.explanation_snippet}
`;
  }

  guidance += `\n🚨 CRITICAL: Your question must be indistinguishable from real ${testType} questions.
Generate NEW content matching this exact style.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

  return guidance;
}

/**
 * Check if smart guidance is available for this test type and sub-skill
 * Useful for fallback logic
 */
export function hasSmartGuidance(testType: string, subSkill: string): boolean {
  const pattern = loadQuestionPattern(testType, subSkill);
  return pattern !== null;
}

/**
 * Get statistics about available patterns
 * Useful for monitoring which test types have patterns vs which still need them
 */
export function getPatternCoverage(): {
  testType: string;
  coverage: {
    subSkill: string;
    hasPattern: boolean;
    hasExample: boolean;
  }[];
}[] {
  // TODO: Implement once patterns are created
  // This will help track which test types/sub-skills have patterns defined
  return [];
}
