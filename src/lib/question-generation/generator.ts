/**
 * Simplified Question Generator
 * Main orchestrator for question generation with smart prompting and minimal validation
 */

import Anthropic from '@anthropic-ai/sdk';
import type { GenerationRequest, Question, QuestionTemplate } from './types';
import { SimpleDiversityTracker } from './diversity/tracker';
import { runAllQuickChecks } from './validation/quick-checks';
import { needsVerification, verifyAnswerWithRetry } from './validation/answer-verification';
import {
  edutestVerbalTemplates,
  getDifficultyDescriptor,
  getDifficultyGuidance,
  formatExamples
} from './templates/edutest-verbal';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

export interface GenerationResult {
  success: boolean;
  question?: Question;
  error?: string;
  attempts: number;
  timeMs: number;
  cost: number;
}

export class SimplifiedQuestionGenerator {
  private templates: Map<string, QuestionTemplate>;
  private diversity: SimpleDiversityTracker;
  private readonly MAX_ATTEMPTS = 3;

  constructor() {
    // For now, only EduTest Verbal templates
    // TODO: Add templates for other products/sections
    this.templates = edutestVerbalTemplates;
    this.diversity = new SimpleDiversityTracker();
  }

  /**
   * Generate a single question with validation and retry logic
   */
  async generateQuestion(request: GenerationRequest): Promise<GenerationResult> {
    const startTime = Date.now();
    let totalCost = 0;
    let lastError = '';

    for (let attempt = 1; attempt <= this.MAX_ATTEMPTS; attempt++) {
      console.log(`\n[Attempt ${attempt}/${this.MAX_ATTEMPTS}] Generating ${request.subSkill} question...`);

      try {
        // 1. Build smart prompt (includes diversity guidance)
        const prompt = this.buildSmartPrompt(request);

        // 2. Generate with Claude
        console.log('  → Calling Claude API...');
        const { question, cost } = await this.callClaude(prompt);
        totalCost += cost;
        console.log(`  → Generated question (cost: $${cost.toFixed(4)})`);

        // 3. Quick validation (instant)
        console.log('  → Running quick validation...');
        const quickCheck = runAllQuickChecks(question);
        if (!quickCheck.valid) {
          lastError = `Quick validation failed: ${quickCheck.errors.join(', ')}`;
          console.log(`  ✗ ${lastError}`);
          continue;
        }
        console.log('  ✓ Quick validation passed');

        // 4. Diversity check
        console.log('  → Checking for duplicates...');
        if (this.diversity.isDuplicate(question)) {
          lastError = 'Question too similar to recent questions';
          console.log(`  ✗ ${lastError}`);
          continue;
        }
        console.log('  ✓ Diversity check passed');

        // 5. Critical validation (only for objective questions)
        if (needsVerification(request.subSkill)) {
          console.log('  → Verifying correct answer...');
          const { isCorrect, reasoning } = await verifyAnswerWithRetry(question);
          const verificationCost = 0.005; // Approximate cost per verification
          totalCost += verificationCost;

          if (!isCorrect) {
            lastError = `Answer verification failed: ${reasoning}`;
            console.log(`  ✗ ${lastError}`);
            continue;
          }
          console.log(`  ✓ Answer verified: ${reasoning}`);
        } else {
          console.log('  ⊘ Skipping answer verification (subjective question type)');
        }

        // SUCCESS!
        console.log(`  ✓ Question generation successful!`);
        this.diversity.trackQuestion(question);

        const timeMs = Date.now() - startTime;
        return {
          success: true,
          question,
          attempts: attempt,
          timeMs,
          cost: totalCost
        };

      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';
        console.error(`  ✗ Error on attempt ${attempt}:`, lastError);

        // If it's an API error, wait before retry
        if (attempt < this.MAX_ATTEMPTS) {
          const waitMs = 1000 * attempt;
          console.log(`  → Waiting ${waitMs}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitMs));
        }
      }
    }

    // All attempts failed
    const timeMs = Date.now() - startTime;
    console.error(`\n✗ Question generation failed after ${this.MAX_ATTEMPTS} attempts`);
    console.error(`  Last error: ${lastError}`);

    return {
      success: false,
      error: lastError,
      attempts: this.MAX_ATTEMPTS,
      timeMs,
      cost: totalCost
    };
  }

  /**
   * Build smart prompt with all context injected
   */
  private buildSmartPrompt(request: GenerationRequest): string {
    // Get template for this question type
    const template = this.templates.get(request.subSkill);
    if (!template) {
      throw new Error(`No template found for sub-skill: ${request.subSkill}`);
    }

    // Get diversity guidance
    const diversityGuidance = this.diversity.getDiversityGuidance();

    // Get difficulty guidance
    const difficultyGuidance = getDifficultyGuidance(request.subSkill, request.difficulty);
    const difficultyDescriptor = getDifficultyDescriptor(request.difficulty);

    // Format examples
    const examplesText = formatExamples(template.examples);

    // Build final prompt by replacing placeholders
    const prompt = template.prompt
      .replace(/{TEST_TYPE}/g, request.testType)
      .replace(/{SECTION}/g, request.section)
      .replace(/{DIFFICULTY}/g, request.difficulty.toString())
      .replace(/{DIFFICULTY_DESCRIPTOR}/g, difficultyDescriptor)
      .replace(/{DIFFICULTY_GUIDANCE}/g, difficultyGuidance)
      .replace(/{YEAR_LEVEL}/g, request.yearLevel.toString())
      .replace(/{EXAMPLES}/g, examplesText)
      .replace(/{DIVERSITY_GUIDANCE}/g, diversityGuidance.guidance)
      .replace(/{NUM_SENTENCES}/g, request.difficulty === 1 ? '2-3' : '3')
      .replace(/{APPEARANCES}/g, request.difficulty === 1 ? 'all' : request.difficulty === 2 ? '2' : '1-2');

    return prompt;
  }

  /**
   * Call Claude API with structured output parsing
   */
  private async callClaude(prompt: string): Promise<{ question: Question; cost: number }> {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      temperature: 0.8, // Creative but not too random
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    // Calculate cost (approximate)
    // Sonnet 4: $3 per 1M input tokens, $15 per 1M output tokens
    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;
    const cost = (inputTokens / 1_000_000 * 3) + (outputTokens / 1_000_000 * 15);

    // Parse response
    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    // Extract JSON from response (Claude might wrap it in markdown)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in Claude response');
    }

    const questionData = JSON.parse(jsonMatch[0]);

    // Map to our Question interface
    const question: Question = {
      question_text: questionData.question_text,
      answer_options: questionData.answer_options,
      correct_answer: questionData.correct_answer,
      solution: questionData.solution,
      sub_skill: questionData.sub_skill || '',
      difficulty: questionData.difficulty || 1,
      test_type: questionData.test_type || 'edutest',
      section: questionData.section || 'verbal',
      passage_topic: questionData.passage_topic,
      passage_text: questionData.passage_text
    };

    return { question, cost };
  }

  /**
   * Get diversity tracker stats
   */
  getDiversityStats() {
    return this.diversity.getStats();
  }

  /**
   * Reset diversity tracker (use between different test types)
   */
  resetDiversity() {
    this.diversity.reset();
  }
}
