/**
 * Simple Diversity Tracker
 * Prevents repetition with in-memory tracking (no database queries during generation)
 */

import type { Question, DiversityGuidance } from '../types';

/**
 * Simple diversity tracker using rolling window + name pool
 */
export class SimpleDiversityTracker {
  private last50Questions: Question[] = [];
  private usedNames: Set<string> = new Set();
  private usedTopics: Set<string> = new Set();
  private nameIndex: number = 0;

  // Pre-defined name pool (Australian/common names)
  private readonly namePool: string[] = [
    // Traditional Australian names
    'Alex', 'Ben', 'Chloe', 'Diana', 'Emma', 'Felix', 'Grace', 'Harry',
    'Isla', 'Jack', 'Kate', 'Liam', 'Mia', 'Noah', 'Olivia', 'Peter',
    'Quinn', 'Ruby', 'Sam', 'Tara', 'Uma', 'Violet', 'Will', 'Xander',
    'Yasmin', 'Zoe',
    // Multicultural names (reflecting Australian diversity)
    'Aisha', 'Arjun', 'Chen', 'Fatima', 'Giovanni', 'Hassan', 'Indira',
    'James', 'Kenji', 'Leila', 'Marco', 'Nina', 'Omar', 'Priya',
    'Raj', 'Sofia', 'Tao', 'Yuki', 'Zara',
    // Additional common names
    'Ethan', 'Charlotte', 'Lucas', 'Amelia', 'Mason', 'Harper',
    'Logan', 'Evelyn', 'Jackson', 'Abigail', 'Aiden', 'Emily',
    'Sebastian', 'Madison', 'Matthew', 'Scarlett', 'Daniel', 'Victoria',
    'Henry', 'Aria', 'Michael', 'Luna', 'Alexander', 'Grace'
  ];

  /**
   * Get next name from pool (rotates through)
   */
  getNextName(): string {
    const name = this.namePool[this.nameIndex];
    this.nameIndex = (this.nameIndex + 1) % this.namePool.length;
    return name;
  }

  /**
   * Get least-used names (for more sophisticated selection)
   */
  getLeastUsedNames(count: number = 5): string[] {
    // Return names that haven't been used recently
    const unusedNames = this.namePool.filter(name => !this.usedNames.has(name));

    if (unusedNames.length >= count) {
      return unusedNames.slice(0, count);
    }

    // If we've used most names, return least recently used
    return this.namePool.slice(0, count);
  }

  /**
   * Track a successfully generated question
   */
  trackQuestion(question: Question): void {
    // Add to rolling window
    this.last50Questions.push(question);
    if (this.last50Questions.length > 50) {
      this.last50Questions.shift(); // Keep only last 50
    }

    // Extract and track names from question text
    const names = this.extractNames(question.question_text);
    names.forEach(name => this.usedNames.add(name));

    // Keep usedNames set reasonable size (clear if > 100)
    if (this.usedNames.size > 100) {
      // Keep only names from last 30 questions
      const recentNames = new Set<string>();
      this.last50Questions.slice(-30).forEach(q => {
        this.extractNames(q.question_text).forEach(n => recentNames.add(n));
      });
      this.usedNames = recentNames;
    }

    // Track topics (if provided)
    if (question.passage_topic) {
      this.usedTopics.add(question.passage_topic);

      // Keep usedTopics reasonable size
      if (this.usedTopics.size > 50) {
        const recentTopics = new Set<string>();
        this.last50Questions.slice(-30).forEach(q => {
          if (q.passage_topic) recentTopics.add(q.passage_topic);
        });
        this.usedTopics = recentTopics;
      }
    }
  }

  /**
   * Check if question is too similar to recent questions
   */
  isDuplicate(question: Question, threshold: number = 0.9): boolean {
    // Check against last 10 questions only (most recent)
    const recent10 = this.last50Questions.slice(-10);

    for (const recent of recent10) {
      const similarity = this.calculateSimilarity(
        question.question_text,
        recent.question_text
      );

      if (similarity > threshold) {
        console.log(`Duplicate detected: ${(similarity * 100).toFixed(0)}% similar to recent question`);
        return true;
      }
    }

    return false;
  }

  /**
   * Get diversity guidance to inject into prompt
   */
  getDiversityGuidance(): DiversityGuidance {
    const recentNames = Array.from(this.usedNames).slice(-10);
    const recentTopics = Array.from(this.usedTopics).slice(-5);
    const suggestedName = this.getNextName();

    const guidance = `
DIVERSITY REQUIREMENTS:
- Recently used names: ${recentNames.length > 0 ? recentNames.join(', ') : 'none yet'}
- Recently used topics: ${recentTopics.length > 0 ? recentTopics.join(', ') : 'none yet'}
- YOU MUST use different names and topics from the recent ones
- Suggested name for this question: ${suggestedName}
`.trim();

    return {
      recentNames,
      recentTopics,
      suggestedName,
      guidance
    };
  }

  /**
   * Extract names from question text (simple heuristic)
   * Looks for capitalized words that are in our name pool
   */
  private extractNames(text: string): string[] {
    const words = text.split(/\s+/);
    const names: string[] = [];

    for (const word of words) {
      // Remove punctuation
      const cleanWord = word.replace(/[^a-zA-Z]/g, '');

      // Check if it's in our name pool (case-insensitive)
      if (this.namePool.some(name => name.toLowerCase() === cleanWord.toLowerCase())) {
        names.push(cleanWord);
      }
    }

    return names;
  }

  /**
   * Calculate text similarity using Jaccard similarity (word overlap)
   * Returns value between 0 (no overlap) and 1 (identical)
   */
  private calculateSimilarity(text1: string, text2: string): number {
    // Normalize: lowercase, split into words
    const words1 = new Set(
      text1.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') // Remove punctuation
        .split(/\s+/)
        .filter(w => w.length > 2) // Ignore short words (a, an, is, etc.)
    );

    const words2 = new Set(
      text2.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 2)
    );

    // Jaccard similarity: intersection / union
    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    if (union.size === 0) return 0;

    return intersection.size / union.size;
  }

  /**
   * Get statistics for monitoring
   */
  getStats(): {
    totalTracked: number;
    uniqueNames: number;
    uniqueTopics: number;
    currentNameIndex: number;
  } {
    return {
      totalTracked: this.last50Questions.length,
      uniqueNames: this.usedNames.size,
      uniqueTopics: this.usedTopics.size,
      currentNameIndex: this.nameIndex
    };
  }

  /**
   * Reset tracker (use when starting a new batch)
   */
  reset(): void {
    this.last50Questions = [];
    this.usedNames.clear();
    this.usedTopics.clear();
    this.nameIndex = 0;
  }
}
