/**
 * V2 Question Generation Engine - Supabase Storage
 * Stores questions and passages to v2 tables with enhanced metadata
 */

import { createClient } from '@supabase/supabase-js';
import { supabase as clientSupabase } from '@/integrations/supabase/client';
import type { QuestionV2, PassageV2, ValidationResult } from './types';
import { getYearLevel, getProductType, getMaxPoints } from './config';

// Create server-side client with service role key if available (for scripts)
// Falls back to client-side anon key for browser usage
const getSupabaseClient = () => {
  // Check if we have service role key (server-side/script context)
  const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (serviceRoleKey && supabaseUrl) {
    // Use service role client for server-side operations (bypasses RLS)
    return createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  // Fall back to client-side supabase (with RLS policies)
  return clientSupabase;
};

const supabase = getSupabaseClient();

// ============================================================================
// PASSAGE STORAGE
// ============================================================================

export async function storePassageV2(passage: PassageV2): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('passages_v2')
      .insert({
        test_type: passage.test_type,
        year_level: passage.year_level,
        section_name: passage.section_name,
        title: passage.title,
        content: passage.content,
        passage_type: passage.passage_type,
        word_count: passage.word_count,
        difficulty: passage.difficulty,
        australian_context: passage.australian_context,

        // V2 enhancements
        sub_skill: passage.sub_skill || null,
        curriculum_source: passage.curriculum_source,
        generation_method: passage.generation_method,
        quality_score: passage.quality_score || null,
        validated_by: passage.validated_by || null,

        // Metadata
        generation_metadata: passage.generation_metadata,
        validation_metadata: passage.validation_metadata || {}
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to store passage: ${error.message}`);
    }

    if (!data?.id) {
      throw new Error('Failed to get passage ID after storage');
    }

    console.log(`✅ Stored passage v2: "${passage.title}" (ID: ${data.id}) [Quality: ${passage.quality_score || 'N/A'}]`);
    return data.id;
  } catch (error) {
    console.error('❌ Failed to store passage v2:', error);
    throw error;
  }
}

/**
 * Fetch a passage by ID
 */
export async function fetchPassageV2(passageId: string): Promise<PassageV2> {
  try {
    const { data, error } = await supabase
      .from('passages_v2')
      .select('*')
      .eq('id', passageId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch passage: ${error.message}`);
    }

    if (!data) {
      throw new Error(`Passage not found: ${passageId}`);
    }

    // Convert database record to PassageV2 type
    const passage: PassageV2 = {
      id: data.id,
      title: data.title,
      content: data.content,
      passage_type: data.passage_type,
      word_count: data.word_count,
      test_type: data.test_type,
      section_name: data.section_name,
      difficulty: data.difficulty,
      metadata: data.metadata || {},
      created_at: data.created_at,
      updated_at: data.updated_at
    };

    return passage;
  } catch (error) {
    console.error('❌ Failed to fetch passage:', error);
    throw error;
  }
}

// ============================================================================
// QUESTION STORAGE
// ============================================================================

export async function storeQuestionV2(
  question: QuestionV2,
  validationResult?: ValidationResult
): Promise<string> {
  try {
    // Use validation result if provided, otherwise use question's metadata
    const finalValidationMetadata = validationResult?.metadata || question.validation_metadata;
    const finalQualityScore = validationResult?.qualityScore || question.quality_score;

    const { data, error } = await supabase
      .from('questions_v2')
      .insert({
        // Core content
        question_text: question.question_text,
        answer_options: question.answer_options,
        correct_answer: question.correct_answer,
        solution: question.solution,

        // Test identification
        test_type: question.test_type,
        test_mode: question.test_mode,
        section_name: question.section_name,
        sub_skill: question.sub_skill,
        sub_skill_id: question.sub_skill_id || null,

        // Metadata
        difficulty: question.difficulty,
        response_type: question.response_type,
        max_points: question.max_points,
        year_level: question.year_level,
        product_type: question.product_type,
        question_order: question.question_order || null,
        australian_context: question.australian_context,

        // Visual content
        has_visual: question.has_visual,
        visual_type: question.visual_type || null,
        visual_data: question.visual_data || null,
        visual_svg: question.visual_svg || null,

        // Passage linking
        passage_id: question.passage_id || null,

        // V2 enhancements
        curriculum_source: question.curriculum_source,
        generation_method: question.generation_method,
        quality_score: finalQualityScore || null,
        validated_by: question.validated_by || 'claude-sonnet-4-v2',
        error_rate: question.error_rate || null,

        // Tracking
        generated_by: question.generated_by,
        curriculum_aligned: question.curriculum_aligned,
        generation_metadata: question.generation_metadata,
        validation_metadata: finalValidationMetadata || {}
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to store question: ${error.message}`);
    }

    if (!data?.id) {
      throw new Error('Failed to get question ID after storage');
    }

    const passageInfo = question.passage_id ? ` (linked to passage ${question.passage_id})` : '';
    const pointsInfo = question.max_points > 1 ? ` [${question.max_points} points]` : '';
    const qualityInfo = finalQualityScore ? ` [Quality: ${finalQualityScore}/100]` : '';

    console.log(`✅ Stored question v2: ${question.sub_skill}${passageInfo}${pointsInfo}${qualityInfo} (ID: ${data.id})`);
    return data.id;
  } catch (error) {
    console.error('❌ Failed to store question v2:', error);
    throw error;
  }
}

// ============================================================================
// BATCH STORAGE
// ============================================================================

export async function storePassagesV2(passages: PassageV2[]): Promise<string[]> {
  const passageIds: string[] = [];

  for (const passage of passages) {
    const passageId = await storePassageV2(passage);
    passageIds.push(passageId);
  }

  return passageIds;
}

export async function storeQuestionsV2(
  questions: Array<{
    question: QuestionV2;
    validationResult?: ValidationResult;
  }>
): Promise<string[]> {
  const questionIds: string[] = [];

  for (const item of questions) {
    const questionId = await storeQuestionV2(item.question, item.validationResult);
    questionIds.push(questionId);
  }

  return questionIds;
}

// ============================================================================
// QUERY HELPERS
// ============================================================================

export async function fetchQuestionsForPassageV2(passageId: string): Promise<QuestionV2[]> {
  try {
    const { data: questions, error } = await supabase
      .from('questions_v2')
      .select('*')
      .eq('passage_id', passageId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error(`Error fetching questions for passage ${passageId}:`, error);
      return [];
    }

    return questions || [];
  } catch (error) {
    console.error(`Failed to fetch questions for passage ${passageId}:`, error);
    return [];
  }
}

export async function getExistingPassagesV2(
  testType: string,
  sectionName: string
): Promise<PassageV2[]> {
  try {
    const { data: passages, error } = await supabase
      .from('passages_v2')
      .select('*')
      .eq('test_type', testType)
      .eq('section_name', sectionName)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to query existing passages: ${error.message}`);
    }

    return passages || [];
  } catch (error) {
    console.error('❌ Failed to get existing passages v2:', error);
    throw error;
  }
}

/**
 * Get existing passage counts grouped by passage_type, for a specific test mode.
 * Used for gap detection in passage-based and hybrid sections.
 * Returns: { "narrative": 2, "informational": 3, ... }
 */
export async function getExistingPassageCountsByType(
  testType: string,
  sectionName: string,
  testMode: string
): Promise<Record<string, number>> {
  try {
    // Query passages for this specific test mode by checking which passages have questions in this mode
    // Each test mode should have its own unique set of passages
    const { data: questions, error: qError } = await supabase
      .from('questions_v2')
      .select('passage_id')
      .eq('test_type', testType)
      .eq('section_name', sectionName)
      .eq('test_mode', testMode)
      .not('passage_id', 'is', null);

    if (qError) throw new Error(`Failed to query questions for passage gap check: ${qError.message}`);

    const passageIds = [...new Set((questions || []).map(q => q.passage_id as string))];

    if (passageIds.length === 0) return {};

    const { data: passages, error: pError } = await supabase
      .from('passages_v2')
      .select('id, passage_type')
      .in('id', passageIds);

    if (pError) throw new Error(`Failed to query passage types: ${pError.message}`);

    const counts: Record<string, number> = {};
    (passages || []).forEach(p => {
      counts[p.passage_type] = (counts[p.passage_type] || 0) + 1;
    });

    return counts;
  } catch (error) {
    console.error('❌ Failed to get passage counts by type:', error);
    return {}; // Safe fallback — caller will regenerate all
  }
}

/**
 * Get titles and main themes of existing passages for a test product (all test modes).
 * Used to prevent topic repetition when generating new passages.
 * Returns compact strings like "The Great Barrier Reef — themes: environment, conservation"
 */
export async function getExistingPassageTopics(
  testType: string,
  sectionName: string
): Promise<string[]> {
  try {
    const { data: passages, error } = await supabase
      .from('passages_v2')
      .select('title, passage_type, metadata')
      .eq('test_type', testType)
      .eq('section_name', sectionName)
      .order('created_at', { ascending: false })
      .limit(60); // Cap — enough context without bloating the prompt

    if (error) throw new Error(`Failed to query passage topics: ${error.message}`);

    return (passages || []).map(p => {
      const themes = (p.metadata?.main_themes || []).slice(0, 2).join(', ');
      return themes
        ? `"${p.title}" [${p.passage_type}] — ${themes}`
        : `"${p.title}" [${p.passage_type}]`;
    });
  } catch (error) {
    console.error('❌ Failed to get existing passage topics:', error);
    return []; // Safe fallback
  }
}

export async function getExistingQuestionCountsV2(
  testType: string,
  testMode: string
): Promise<{
  totalQuestions: number;
  sectionCounts: Record<string, {
    total: number;
    subSkillCounts: Record<string, number>;
  }>;
}> {
  try {
    const { data: questions, error } = await supabase
      .from('questions_v2')
      .select('section_name, sub_skill')
      .eq('test_type', testType)
      .eq('test_mode', testMode);

    if (error) {
      throw new Error(`Failed to query existing questions: ${error.message}`);
    }

    const sectionCounts: Record<string, {
      total: number;
      subSkillCounts: Record<string, number>;
    }> = {};

    let totalQuestions = 0;

    (questions || []).forEach(question => {
      const { section_name, sub_skill } = question;

      if (!sectionCounts[section_name]) {
        sectionCounts[section_name] = {
          total: 0,
          subSkillCounts: {}
        };
      }

      if (!sectionCounts[section_name].subSkillCounts[sub_skill]) {
        sectionCounts[section_name].subSkillCounts[sub_skill] = 0;
      }

      sectionCounts[section_name].total++;
      sectionCounts[section_name].subSkillCounts[sub_skill]++;
      totalQuestions++;
    });

    return {
      totalQuestions,
      sectionCounts
    };
  } catch (error) {
    console.error('❌ Failed to get existing question counts v2:', error);
    throw error;
  }
}

/**
 * Get recent questions for a specific sub-skill to avoid duplication
 *
 * @param testMode - If provided, only fetches from this mode. If null, fetches from ALL modes (cross-mode diversity)
 * @param limit - Max number of questions to return
 */
export async function getRecentQuestionsForSubSkill(
  testType: string,
  sectionName: string,
  subSkill: string,
  testMode: string | null = null,
  limit: number = 10
): Promise<Array<{
  question_text: string;
  answer_options: string[];
  correct_answer: string;
  solution: string;
  test_mode: string;
  created_at: string;
}>> {
  try {
    let query = supabase
      .from('questions_v2')
      .select('question_text, answer_options, correct_answer, solution, test_mode, created_at')
      .eq('test_type', testType)
      .eq('section_name', sectionName)
      .eq('sub_skill', subSkill);

    // If testMode is provided, filter by it. Otherwise, load from ALL modes (cross-mode diversity)
    if (testMode) {
      query = query.eq('test_mode', testMode);
    }

    query = query
      .order('created_at', { ascending: false })
      .limit(limit);

    const { data: questions, error } = await query;

    if (error) {
      console.warn(`⚠️  Could not fetch recent questions for ${subSkill}:`, error.message);
      return [];
    }

    return questions || [];
  } catch (error) {
    console.warn('⚠️  Error fetching recent questions:', error);
    return [];
  }
}

// ============================================================================
// QUALITY METRICS
// ============================================================================

export async function getQualityMetricsV2(
  testType: string,
  testMode?: string
): Promise<{
  averageQualityScore: number;
  totalQuestions: number;
  questionsByQuality: Record<string, number>; // "Excellent", "Good", "Fair", "Poor"
  averageBySubSkill: Record<string, number>;
}> {
  try {
    let query = supabase
      .from('questions_v2')
      .select('quality_score, sub_skill')
      .eq('test_type', testType)
      .not('quality_score', 'is', null);

    if (testMode) {
      query = query.eq('test_mode', testMode);
    }

    const { data: questions, error } = await query;

    if (error) {
      throw new Error(`Failed to query quality metrics: ${error.message}`);
    }

    if (!questions || questions.length === 0) {
      return {
        averageQualityScore: 0,
        totalQuestions: 0,
        questionsByQuality: {},
        averageBySubSkill: {}
      };
    }

    let totalScore = 0;
    const questionsByQuality: Record<string, number> = {
      'Excellent (90-100)': 0,
      'Good (80-89)': 0,
      'Fair (70-79)': 0,
      'Poor (<70)': 0
    };
    const subSkillScores: Record<string, { total: number; count: number }> = {};

    questions.forEach(q => {
      const score = q.quality_score!;
      totalScore += score;

      // Categorize by quality
      if (score >= 90) questionsByQuality['Excellent (90-100)']++;
      else if (score >= 80) questionsByQuality['Good (80-89)']++;
      else if (score >= 70) questionsByQuality['Fair (70-79)']++;
      else questionsByQuality['Poor (<70)']++;

      // Track by sub-skill
      if (!subSkillScores[q.sub_skill]) {
        subSkillScores[q.sub_skill] = { total: 0, count: 0 };
      }
      subSkillScores[q.sub_skill].total += score;
      subSkillScores[q.sub_skill].count++;
    });

    const averageBySubSkill: Record<string, number> = {};
    Object.entries(subSkillScores).forEach(([subSkill, { total, count }]) => {
      averageBySubSkill[subSkill] = Math.round(total / count);
    });

    return {
      averageQualityScore: Math.round(totalScore / questions.length),
      totalQuestions: questions.length,
      questionsByQuality,
      averageBySubSkill
    };
  } catch (error) {
    console.error('❌ Failed to get quality metrics v2:', error);
    throw error;
  }
}

// ============================================================================
// DATABASE VALIDATION
// ============================================================================

export async function validateDatabaseConnectionV2(): Promise<{
  valid: boolean;
  errors: string[]
}> {
  const errors: string[] = [];

  try {
    // Test passages_v2 table
    const { error: passagesError } = await supabase
      .from('passages_v2')
      .select('id')
      .limit(1);

    if (passagesError) {
      errors.push(`Passages v2 table error: ${passagesError.message}`);
    }

    // Test questions_v2 table
    const { error: questionsError } = await supabase
      .from('questions_v2')
      .select('id')
      .limit(1);

    if (questionsError) {
      errors.push(`Questions v2 table error: ${questionsError.message}`);
    }

    // Test sub_skills_v2 table (optional)
    const { error: subSkillsError } = await supabase
      .from('sub_skills_v2')
      .select('id')
      .limit(1);

    if (subSkillsError) {
      // Sub-skills table is optional, just log warning
      console.warn('⚠️  Sub-skills v2 table not available:', subSkillsError.message);
    }

  } catch (error) {
    errors.push(`Database connection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// ============================================================================
// STATISTICS & REPORTING
// ============================================================================

export async function getStorageStatsV2(
  testType: string,
  testMode: string
): Promise<{
  passages: number;
  questions: number;
  questionsBySection: Record<string, number>;
  averageQualityScore: number;
}> {
  try {
    // Count passages
    const { count: passageCount } = await supabase
      .from('passages_v2')
      .select('*', { count: 'exact', head: true })
      .eq('test_type', testType);

    // Count questions
    const { count: questionCount } = await supabase
      .from('questions_v2')
      .select('*', { count: 'exact', head: true })
      .eq('test_type', testType)
      .eq('test_mode', testMode);

    // Count questions by section
    const { data: sectionData } = await supabase
      .from('questions_v2')
      .select('section_name')
      .eq('test_type', testType)
      .eq('test_mode', testMode);

    const questionsBySection: Record<string, number> = {};
    sectionData?.forEach(row => {
      const section = row.section_name;
      questionsBySection[section] = (questionsBySection[section] || 0) + 1;
    });

    // Get average quality score
    const qualityMetrics = await getQualityMetricsV2(testType, testMode);

    return {
      passages: passageCount || 0,
      questions: questionCount || 0,
      questionsBySection,
      averageQualityScore: qualityMetrics.averageQualityScore
    };
  } catch (error) {
    console.error('Failed to get storage stats v2:', error);
    return {
      passages: 0,
      questions: 0,
      questionsBySection: {},
      averageQualityScore: 0
    };
  }
}

export async function printGenerationReportV2(
  testType: string,
  testMode: string
): Promise<void> {
  try {
    console.log(`\n📊 V2 GENERATION REPORT: ${testType} (${testMode})`);
    console.log('=' .repeat(80));

    const stats = await getStorageStatsV2(testType, testMode);
    const qualityMetrics = await getQualityMetricsV2(testType, testMode);

    console.log(`\n📈 TOTALS:`);
    console.log(`   Questions: ${stats.questions}`);
    console.log(`   Passages: ${stats.passages}`);
    console.log(`   Average Quality Score: ${stats.averageQualityScore}/100`);

    console.log(`\n📊 QUESTIONS BY SECTION:`);
    Object.entries(stats.questionsBySection).forEach(([section, count]) => {
      console.log(`   ${section}: ${count} questions`);
    });

    console.log(`\n⭐ QUALITY DISTRIBUTION:`);
    Object.entries(qualityMetrics.questionsByQuality).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} questions`);
    });

    if (Object.keys(qualityMetrics.averageBySubSkill).length > 0) {
      console.log(`\n🎯 AVERAGE QUALITY BY SUB-SKILL:`);
      Object.entries(qualityMetrics.averageBySubSkill)
        .sort(([, a], [, b]) => b - a) // Sort by score descending
        .forEach(([subSkill, avgScore]) => {
          console.log(`   ${subSkill}: ${avgScore}/100`);
        });
    }

    console.log('=' .repeat(80));
  } catch (error) {
    console.error('❌ Failed to print generation report v2:', error);
    throw error;
  }
}

// ============================================================================
// CLEANUP (Use with caution!)
// ============================================================================

export async function clearTestDataV2(
  testType: string,
  testMode: string
): Promise<{
  success: boolean;
  deletedCounts: { passages: number; questions: number }
}> {
  try {
    console.warn(`⚠️  CLEARING V2 TEST DATA: ${testType} - ${testMode}`);

    // Delete questions first (they reference passages)
    const { count: deletedQuestions } = await supabase
      .from('questions_v2')
      .delete({ count: 'exact' })
      .eq('test_type', testType)
      .eq('test_mode', testMode);

    // Delete passages
    const { count: deletedPassages } = await supabase
      .from('passages_v2')
      .delete({ count: 'exact' })
      .eq('test_type', testType);

    console.log(`🗑️  Cleared v2 test data:`);
    console.log(`   - Questions deleted: ${deletedQuestions || 0}`);
    console.log(`   - Passages deleted: ${deletedPassages || 0}`);

    return {
      success: true,
      deletedCounts: {
        passages: deletedPassages || 0,
        questions: deletedQuestions || 0
      }
    };
  } catch (error) {
    console.error('Failed to clear test data v2:', error);
    return {
      success: false,
      deletedCounts: { passages: 0, questions: 0 }
    };
  }
}
