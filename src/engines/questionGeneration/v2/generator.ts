/**
 * V2 Question Generation Engine - Core Generator
 * Orchestrates question generation using pattern-based approach
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  GenerationRequestV2,
  QuestionV2,
  GenerationResultV2,
  GenerationMetadata,
  PromptContext,
  ValidationOptions
} from './types';
import type { SubSkillExampleData } from '@/data/curriculumData_v2/types';
import { SUB_SKILL_EXAMPLES } from '@/data/curriculumData_v2';
import { buildPromptWithExamples, buildWritingPrompt } from './promptBuilder';
import { validateQuestionV2 } from './validator';
import { storeQuestionV2, getRecentQuestionsForSubSkill } from './supabaseStorage';
import {
  CLAUDE_CONFIG,
  GENERATION_CONFIG,
  FEATURE_FLAGS,
  getYearLevel,
  getProductType,
  getMaxPoints
} from './config';

const anthropic = new Anthropic({
  apiKey: CLAUDE_CONFIG.apiKey
});

// ============================================================================
// MAIN GENERATION FUNCTION
// ============================================================================

export async function generateQuestionV2(
  request: GenerationRequestV2,
  options: {
    skipValidation?: boolean;
    skipStorage?: boolean;
    strictValidation?: boolean;
    crossModeDiversity?: boolean;  // If true, loads questions from ALL modes for diversity
  } = {}
): Promise<GenerationResultV2> {
  const startTime = Date.now();
  let attempts = 0;
  let lastError: string | undefined;
  let previousFailures: Array<{ question: string; reason: string }> = [];

  console.log(`\n🎯 Generating v2 question: ${request.testType} - ${request.section} - ${request.subSkill} (Difficulty ${request.difficulty})`);

  try {
    // 1. Load sub-skill data from curriculumData v2
    const subSkillData = loadSubSkillData(request.testType, request.section, request.subSkill);
    if (!subSkillData) {
      throw new Error(`Sub-skill not found in curriculumData v2: ${request.testType} - ${request.section} - ${request.subSkill}`);
    }

    // 2. Check if this sub-skill is appropriate for LLM generation
    if (!subSkillData.llm_appropriate) {
      throw new Error(`Sub-skill "${request.subSkill}" is not appropriate for LLM generation`);
    }

    // 3. Load ALL existing questions for this sub-skill from DB (cross-mode if enabled)
    //    This is fetched ONCE before the retry loop — same context for all attempts.
    //    The prompt shows these (latest 20) so Claude avoids repeating them.
    //    The validator uses ALL of them for duplicate checking (ensuring zero duplicates).
    const testModeForDiversity = options.crossModeDiversity ? null : request.testMode;
    const recentQuestions = await getRecentQuestionsForSubSkill(
      request.testType,
      request.section,
      request.subSkill,
      testModeForDiversity,
      1000  // Load ALL questions (up to 1000) for comprehensive duplicate checking
    );

    if (recentQuestions.length > 0) {
      console.log(`   📚 Loaded ${recentQuestions.length} existing ${request.subSkill} questions for diversity & duplicate checking`);
    }

    // 4. Fetch passage once (only for reading comprehension)
    let passage;
    if (request.passageId) {
      console.log(`   📖 Fetching passage: ${request.passageId}`);
      try {
        const { fetchPassageV2 } = await import('./supabaseStorage');
        passage = await fetchPassageV2(request.passageId);
        console.log(`   ✅ Passage loaded: "${passage.title}" (${passage.word_count} words)`);
      } catch (error) {
        console.warn(`   ⚠️  Failed to fetch passage: ${error}. Continuing without passage.`);
      }
    }

    // 5. Generate with retries
    while (attempts < GENERATION_CONFIG.maxGenerationAttempts) {
      attempts++;

      try {
        console.log(`   Attempt ${attempts}/${GENERATION_CONFIG.maxGenerationAttempts}...`);

        // Build lean prompt — recent questions are the diversity mechanism
        // NEW: Include previous failures so Claude can learn and pivot
        const promptContext: PromptContext = {
          testType: request.testType,
          section: request.section,
          subSkill: request.subSkill,
          difficulty: request.difficulty,
          subSkillData,
          examples: subSkillData.examples,
          pattern: subSkillData.pattern,
          passage,
          passageId: request.passageId,
          recentQuestions,  // Up to 20 DB questions shown in prompt
          previousFailures  // NEW: Pass failed attempts so Claude can avoid them
        };

        const builtPrompt = isWritingSubSkill(request.subSkill, request.section)
          ? buildWritingPrompt(promptContext)
          : buildPromptWithExamples(promptContext);

        if (FEATURE_FLAGS.logPrompts) {
          console.log('\n--- PROMPT ---');
          console.log(builtPrompt.prompt);
          console.log('--- END PROMPT ---\n');
        }

        // Call Claude API (Sonnet for generation)
        const claudeResponse = await callClaudeAPI(builtPrompt.prompt, attempts);

        // Parse response
        const parsedQuestion = parseClaudeResponse(
          claudeResponse.text,
          request,
          subSkillData
        );

        // Add generation metadata
        parsedQuestion.generation_metadata = {
          generation_timestamp: new Date().toISOString(),
          attempt_number: attempts,
          prompt_tokens: claudeResponse.inputTokens,
          response_tokens: claudeResponse.outputTokens,
          response_time_ms: claudeResponse.responseTimeMs,
          model: CLAUDE_CONFIG.model,
          temperature: CLAUDE_CONFIG.temperature,
          examples_used: builtPrompt.metadata.examples_included,
          pattern_type: builtPrompt.metadata.pattern_type
        };

        // Validate: structure + correctness (haiku) + duplicate (haiku)
        let validationResult;
        if (!options.skipValidation) {
          validationResult = await validateQuestionV2(
            parsedQuestion,
            subSkillData,
            {},  // options no longer needed — checks are hardcoded
            recentQuestions  // pass for duplicate check
          );

          if (!validationResult.isValid) {
            lastError = `Validation failed: ${validationResult.errors.join(', ')}`;
            console.log(`   ❌ ${lastError}`);

            // NEW: Capture the failed question so Claude can learn and avoid it
            previousFailures.push({
              question: parsedQuestion.question_text.length > 150
                ? parsedQuestion.question_text.slice(0, 150) + '...'
                : parsedQuestion.question_text,
              reason: validationResult.errors.join(', ')
            });

            if (attempts < GENERATION_CONFIG.maxGenerationAttempts) {
              await sleep(GENERATION_CONFIG.retryDelayMs);
              continue;
            } else {
              throw new Error(lastError);
            }
          }

          parsedQuestion.quality_score = validationResult.qualityScore;
          parsedQuestion.validation_metadata = validationResult.metadata;
          parsedQuestion.validated_by = 'claude-haiku-4-v2';
        }

        // Generate visual if needed
        let visualCost = 0;
        if (parsedQuestion.visual_data && parsedQuestion.visual_data.type !== 'none') {
          console.log(`   🎨 Generating visual (${parsedQuestion.visual_data.type})...`);

          const { generateVisual } = await import('./visualGenerator');
          const visualTimeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Visual generation timed out after ${GENERATION_CONFIG.visualTimeout / 1000}s`)), GENERATION_CONFIG.visualTimeout)
          );
          const visualResult = await Promise.race([
            generateVisual(parsedQuestion.visual_data),
            visualTimeout
          ]).catch(err => ({
            success: false as const,
            error: err instanceof Error ? err.message : String(err),
            cost: 0,
            timeMs: GENERATION_CONFIG.visualTimeout
          }));

          // Accept either svg (most types) or html (html_table type)
          const visualContent = visualResult.svg || visualResult.html;
          if (visualResult.success && visualContent) {
            parsedQuestion.visual_svg = visualContent;
            parsedQuestion.has_visual = true;
            visualCost = visualResult.cost || 0;
            console.log(`   ✅ Visual generated (+$${visualCost.toFixed(4)} cost)`);
          } else {
            // Generation failed — ensure has_visual is false so the UI doesn't show a broken placeholder
            parsedQuestion.has_visual = false;
            console.warn(`   ⚠️  Visual generation failed: ${visualResult.error}`);
            console.warn(`   ℹ️  Question will use text description only`);
          }
        }

        // Store question
        let questionId: string | undefined;
        if (!options.skipStorage) {
          questionId = await storeQuestionV2(parsedQuestion, validationResult);
          parsedQuestion.id = questionId;
          console.log(`   💾 Stored to DB with ID: ${questionId?.slice(0, 8)}...`);
        }

        // Calculate cost (generation + haiku validation calls)
        // Haiku correctness + duplicate checks cost roughly $0.0002 combined
        const haikuValidationCost = options.skipValidation ? 0 : 0.0002;
        const cost = calculateCost(
          claudeResponse.inputTokens,
          claudeResponse.outputTokens
        ) + visualCost + haikuValidationCost;

        // Success!
        const timeMs = Date.now() - startTime;
        console.log(`   ✅ Generated successfully in ${timeMs}ms (Cost: $${cost.toFixed(4)})`);

        return {
          success: true,
          question: parsedQuestion,
          attempts,
          timeMs,
          cost,
          validationResult
        };

      } catch (attemptError) {
        lastError = attemptError instanceof Error ? attemptError.message : 'Unknown error';
        console.log(`   ❌ Attempt ${attempts} failed: ${lastError}`);

        if (attempts < GENERATION_CONFIG.maxGenerationAttempts) {
          await sleep(GENERATION_CONFIG.retryDelayMs);
        }
      }
    }

    // All attempts failed
    throw new Error(`Failed after ${attempts} attempts. Last error: ${lastError}`);

  } catch (error) {
    const timeMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.log(`   ❌ Generation failed: ${errorMessage}`);

    return {
      success: false,
      error: errorMessage,
      attempts,
      timeMs,
      cost: 0
    };
  }
}

// ============================================================================
// CLAUDE API CALL
// ============================================================================

async function callClaudeAPI(
  prompt: string,
  attemptNumber: number
): Promise<{
  text: string;
  inputTokens: number;
  outputTokens: number;
  responseTimeMs: number;
}> {
  const startTime = Date.now();

  // Escalate temperature on retries to increase creativity and avoid duplicates
  // Attempt 1: 0.7 (standard), Attempt 2: 0.9 (more creative), Attempt 3: 1.0 (maximum creativity)
  const temperatureByAttempt = [0.7, 0.9, 1.0];
  const temperature = temperatureByAttempt[attemptNumber - 1] || CLAUDE_CONFIG.temperature;

  if (attemptNumber > 1) {
    console.log(`   🌡️  Increasing temperature to ${temperature} for retry attempt ${attemptNumber}`);
  }

  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_CONFIG.model,
      max_tokens: CLAUDE_CONFIG.maxTokens,
      temperature,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const responseTimeMs = Date.now() - startTime;

    // Extract text content
    const textContent = response.content.find(block => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in Claude response');
    }

    return {
      text: textContent.text,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      responseTimeMs
    };

  } catch (error) {
    console.error('Claude API error:', error);
    throw new Error(`Claude API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ============================================================================
// RESPONSE PARSING
// ============================================================================

function parseClaudeResponse(
  responseText: string,
  request: GenerationRequestV2,
  subSkillData: SubSkillExampleData
): QuestionV2 {
  try {
    // Extract JSON from response (Claude sometimes adds extra text)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in Claude response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate required fields
    if (!parsed.question_text) {
      throw new Error('Missing question_text in response');
    }
    if (!parsed.solution) {
      throw new Error('Missing solution in response');
    }

    // Determine response type
    const responseType = parsed.answer_options && parsed.answer_options.length > 0
      ? 'multiple_choice'
      : 'extended_response';

    // Build curriculum source
    const curriculumSource = `${request.testType} - ${request.section} - ${request.subSkill}`;

    // Build complete question object
    const question: QuestionV2 = {
      // Core content
      question_text: parsed.question_text,
      answer_options: parsed.answer_options || null,
      correct_answer: parsed.correct_answer || null,
      solution: parsed.solution,

      // Test identification
      test_type: request.testType,
      test_mode: request.testMode,
      section_name: request.section,
      sub_skill: request.subSkill,
      sub_skill_id: undefined, // Will be populated by storage layer

      // Metadata
      difficulty: request.difficulty,
      response_type: responseType,
      max_points: getMaxPoints(request.testType, request.subSkill, responseType),
      year_level: getYearLevel(request.testType),
      product_type: getProductType(request.testType),
      question_order: request.questionOrder,
      australian_context: true, // All v2 questions use Australian context

      // Visual content — has_visual starts false, set to true only after successful generation
      has_visual: false,
      visual_type: parsed.visual_spec?.type || subSkillData.image_type || null,
      visual_data: parsed.visual_spec || null,
      visual_svg: null, // Will be populated after generateVisual() succeeds

      // Passage linking
      passage_id: request.passageId || null,

      // V2 enhancements
      curriculum_source: curriculumSource,
      generation_method: 'pattern-based',
      quality_score: undefined, // Will be set by validator
      validated_by: undefined, // Will be set by validator
      error_rate: undefined, // Will be tracked over time

      // Tracking
      generated_by: 'claude-sonnet-4-v2',
      curriculum_aligned: true,
      generation_metadata: {} as GenerationMetadata, // Will be populated after this
      validation_metadata: undefined
    };

    return question;

  } catch (error) {
    console.error('Failed to parse Claude response:', responseText);
    throw new Error(`Response parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function loadSubSkillData(
  testType: string,
  section: string,
  subSkill: string
): SubSkillExampleData | null {
  const key = `${testType} - ${section}`;
  const sectionData = SUB_SKILL_EXAMPLES[key];

  if (!sectionData) {
    console.error(`Section not found: ${key}`);
    console.error('Available keys:', Object.keys(SUB_SKILL_EXAMPLES));
    return null;
  }

  const subSkillData = sectionData[subSkill];
  if (!subSkillData) {
    console.error(`Sub-skill not found: ${subSkill}`);
    console.error('Available sub-skills:', Object.keys(sectionData));
    return null;
  }

  return subSkillData;
}

function isWritingSubSkill(subSkill: string, sectionName?: string): boolean {
  // Primary check: is the section itself a writing section?
  // This avoids misclassifying "Narrative Comprehension" (reading) as a writing sub-skill.
  const WRITING_SECTIONS = ['Writing', 'Written Expression'];
  if (sectionName && WRITING_SECTIONS.includes(sectionName)) {
    return true;
  }

  // Secondary fallback: sub-skill name explicitly contains 'writing'
  // This avoids matching reading sub-skills like "Narrative Comprehension" or "Persuasive Techniques"
  return subSkill.toLowerCase().includes('writing');
}

function calculateCost(
  inputTokens: number,
  outputTokens: number
): number {
  const inputCost = inputTokens * GENERATION_CONFIG.costPerInputToken;
  const outputCost = outputTokens * GENERATION_CONFIG.costPerOutputToken;
  return inputCost + outputCost;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// BATCH GENERATION
// ============================================================================

export async function generateQuestionsV2(
  requests: GenerationRequestV2[],
  options: {
    skipValidation?: boolean;
    skipStorage?: boolean;
    strictValidation?: boolean;
    concurrency?: number; // How many to generate in parallel
  } = {}
): Promise<{
  results: GenerationResultV2[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    totalCost: number;
    averageQualityScore: number;
    totalTimeMs: number;
  };
}> {
  const startTime = Date.now();
  const concurrency = options.concurrency || 1; // Default to sequential
  const results: GenerationResultV2[] = [];

  console.log(`\n🚀 BATCH GENERATION: ${requests.length} questions (concurrency: ${concurrency})`);
  console.log('=' .repeat(80));

  // Process in batches based on concurrency
  for (let i = 0; i < requests.length; i += concurrency) {
    const batch = requests.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(request => generateQuestionV2(request, options))
    );
    results.push(...batchResults);
  }

  // Calculate summary
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const totalCost = results.reduce((sum, r) => sum + r.cost, 0);
  const qualityScores = results
    .filter(r => r.success && r.validationResult)
    .map(r => r.validationResult!.qualityScore);
  const averageQualityScore = qualityScores.length > 0
    ? Math.round(qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length)
    : 0;
  const totalTimeMs = Date.now() - startTime;

  const summary = {
    total: requests.length,
    successful,
    failed,
    totalCost,
    averageQualityScore,
    totalTimeMs
  };

  console.log('\n' + '=' .repeat(80));
  console.log('📊 BATCH GENERATION SUMMARY');
  console.log('=' .repeat(80));
  console.log(`Total: ${summary.total}`);
  console.log(`✅ Successful: ${summary.successful}`);
  console.log(`❌ Failed: ${summary.failed}`);
  console.log(`💰 Total Cost: $${summary.totalCost.toFixed(4)}`);
  console.log(`⭐ Average Quality: ${summary.averageQualityScore}/100`);
  console.log(`⏱️  Total Time: ${Math.round(summary.totalTimeMs / 1000)}s`);
  console.log('=' .repeat(80));

  return { results, summary };
}

// ============================================================================
// EXPORT UTILITY: Generate single question with convenience
// ============================================================================

export async function generateSingleQuestion(
  testType: string,
  section: string,
  subSkill: string,
  difficulty: number,
  testMode: string = 'practice_1'
): Promise<GenerationResultV2> {
  const request: GenerationRequestV2 = {
    testType,
    section,
    subSkill,
    difficulty,
    testMode
  };

  return generateQuestionV2(request);
}

