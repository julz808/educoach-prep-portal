/**
 * Seeded Randomization Utility
 *
 * Provides deterministic shuffling for consistent question ordering across all users.
 * Uses a seed based on (test_type, test_mode, section_name) to ensure:
 * - Same question is always at the same position for everyone
 * - Order persists across sessions and page reloads
 * - Can be regenerated if needed by changing the seed
 */

/**
 * Simple seeded pseudo-random number generator (LCG algorithm)
 * This is deterministic - same seed always produces same sequence
 */
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed % 2147483647; // Keep seed in valid range
    if (this.seed <= 0) this.seed += 2147483646;
  }

  /**
   * Generate next random number between 0 and 1
   */
  next(): number {
    // Linear Congruential Generator (LCG) algorithm
    // Using parameters from Numerical Recipes (glibc)
    this.seed = (this.seed * 48271) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }

  /**
   * Generate random integer between min (inclusive) and max (exclusive)
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min)) + min;
  }
}

/**
 * Generate a numeric seed from a string
 * Same string always produces same seed
 */
export function generateSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Generate seed for question ordering based on test configuration
 *
 * @param testType - e.g., "Year 7 NAPLAN"
 * @param testMode - e.g., "practice_1", "diagnostic"
 * @param sectionName - e.g., "Language Conventions"
 * @returns Numeric seed for reproducible randomization
 */
export function generateQuestionOrderSeed(
  testType: string,
  testMode: string,
  sectionName: string
): number {
  // Create a unique string for this test configuration
  const seedString = `${testType}|${testMode}|${sectionName}`;
  return generateSeed(seedString);
}

/**
 * Shuffle an array using Fisher-Yates algorithm with a seeded RNG
 * Returns a NEW array (does not modify original)
 *
 * @param array - Array to shuffle
 * @param seed - Numeric seed for reproducible shuffling
 * @returns New shuffled array
 */
export function seededShuffle<T>(array: T[], seed: number): T[] {
  const shuffled = [...array]; // Create copy
  const rng = new SeededRandom(seed);

  // Fisher-Yates shuffle algorithm
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = rng.nextInt(0, i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

/**
 * Generate question_order values for a list of questions
 * Returns an array of order values (0, 1, 2, ...) in shuffled sequence
 *
 * @param questionCount - Number of questions to order
 * @param seed - Numeric seed for reproducible ordering
 * @returns Array of shuffled indices
 */
export function generateQuestionOrders(questionCount: number, seed: number): number[] {
  // Create array [0, 1, 2, 3, ..., n-1]
  const orders = Array.from({ length: questionCount }, (_, i) => i);

  // Shuffle using seeded algorithm
  return seededShuffle(orders, seed);
}

/**
 * Check if a section should have randomized question order
 *
 * Sections that should NOT be randomized (passage-based):
 * - Reading
 * - Reading Comprehension
 * - Reading Reasoning
 * - Humanities
 *
 * @param sectionName - Name of the section
 * @returns true if section should be randomized, false if it should stay ordered
 */
export function shouldRandomizeSection(sectionName: string): boolean {
  const normalizedName = sectionName.toLowerCase();

  // Sections that should remain ordered (passage-based sections)
  const orderedSections = [
    'reading',
    'comprehension',
    'humanities'
  ];

  // Check if section name contains any of the ordered section keywords
  const isOrderedSection = orderedSections.some(keyword =>
    normalizedName.includes(keyword)
  );

  return !isOrderedSection;
}

/**
 * Test the seeded shuffle to verify it's working correctly
 * Returns true if seeded shuffle is deterministic
 */
export function testSeededShuffle(): boolean {
  const testArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const testSeed = 12345;

  // Shuffle twice with same seed
  const shuffle1 = seededShuffle(testArray, testSeed);
  const shuffle2 = seededShuffle(testArray, testSeed);

  // Results should be identical
  const isIdentical = shuffle1.every((val, idx) => val === shuffle2[idx]);

  // Results should be different from original (very unlikely to be same)
  const isDifferent = !shuffle1.every((val, idx) => val === testArray[idx]);

  if (isIdentical && isDifferent) {
    console.log('✅ Seeded shuffle test passed');
    console.log('   Original:', testArray);
    console.log('   Shuffled:', shuffle1);
    return true;
  } else {
    console.error('❌ Seeded shuffle test failed');
    console.error('   Identical:', isIdentical);
    console.error('   Different:', isDifferent);
    return false;
  }
}

/**
 * Example usage:
 *
 * // During question generation:
 * const seed = generateQuestionOrderSeed('Year 7 NAPLAN', 'practice_1', 'Language Conventions');
 * const orders = generateQuestionOrders(45, seed); // For 45 questions
 * // Assign orders[0] to first question, orders[1] to second question, etc.
 *
 * // When fetching questions:
 * const questions = await fetchQuestions(...);
 * questions.sort((a, b) => a.question_order - b.question_order);
 */
