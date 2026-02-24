/**
 * Simplified Question Generation System - Core Types
 * Based on SIMPLIFIED_PRACTICAL_APPROACH.md
 */

export interface GenerationRequest {
  testType: string;
  section: string;
  subSkill: string;
  difficulty: number; // 1 = easy, 2 = medium, 3 = hard
  yearLevel: number;
}

export interface Question {
  question_text: string;
  answer_options: string[];
  correct_answer: string;
  solution: string;
  sub_skill: string;
  difficulty: number;
  test_type: string;
  section: string;
  passage_topic?: string;
  passage_text?: string;
}

export interface QuestionTemplate {
  type: string;
  prompt: string;
  examples: QuestionExample[];
  requirements: string[];
  needsVerification: boolean; // Should we independently verify the answer?
}

export interface QuestionExample {
  question_text: string;
  answer_options: string[];
  correct_answer: string;
  explanation: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface DiversityGuidance {
  recentNames: string[];
  recentTopics: string[];
  suggestedName: string;
  guidance: string;
}
