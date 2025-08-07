// ============================================================================
// SUPABASE STORAGE ENGINE
// ============================================================================
// Handles all database storage operations for generated content
// Integrates with the main generation engine as the authoritative storage layer

import { supabase } from '../../integrations/supabase/client.ts';
import { validateQuestionWithPipeline } from './validationPipeline.ts';

// Define types inline to avoid runtime import issues with TypeScript interfaces
type ResponseType = 'multiple_choice' | 'extended_response';
type PassageType = 'narrative' | 'informational' | 'persuasive';

interface GeneratedPassage {
  id?: string;
  test_type: string;
  year_level: number;
  section_name: string;
  title: string;
  content: string;
  passage_type: PassageType;
  word_count: number;
  australian_context: boolean;
  difficulty: number;
  main_themes: string[];
  key_characters: string[];
  setting: string;
  potential_question_topics: string[];
  generation_metadata: {
    test_type: string;
    section_name: string;
    difficulty: number;
    passage_type: PassageType;
    target_word_count: number;
    generation_timestamp: string;
    attempt_number: number;
  };
  created_at?: string;
}

interface GeneratedQuestion {
  id?: string;
  question_text: string;
  answer_options: string[] | null;
  correct_answer: string | null;
  solution: string;
  has_visual: boolean;
  visual_type: string | null;
  visual_data: any;
  visual_svg: string | null;
  test_type: string;
  section_name: string;
  sub_skill: string;
  difficulty: number;
  response_type: ResponseType;
  passage_reference: boolean;
  australian_context: boolean;
  max_points: number; // NEW: Maximum points for this question
  product_type?: string; // NEW: Product type derived from test_type
  question_order?: number; // NEW: Sequential order within section
  generation_metadata: {
    generation_timestamp: string;
    attempt_number?: number;
    prompt_length?: number;
    response_time_ms?: number;
  };
  created_at?: string;
}

interface DatabasePassage {
  id: string;
  test_type: string;
  year_level: number;
  section_name: string;
  title: string;
  content: string;
  passage_type: string;
  word_count: number;
  australian_context: boolean;
  difficulty?: number; // May not exist in older records
  created_at: string;
  updated_at: string;
}

/**
 * Helper function to get year level from test type
 */
function getYearLevelFromTestType(testType: string): number {
  if (testType.includes('Year 5')) return 5;
  if (testType.includes('Year 7')) return 7;
  if (testType.includes('Year 9')) return 9;
  return 7; // Default fallback
}

/**
 * Fetch existing questions for a specific passage
 */
export async function fetchQuestionsForPassage(passageId: string): Promise<GeneratedQuestion[]> {
  try {
    const { data: questions, error } = await supabase
      .from('questions')
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

/**
 * Helper function to calculate max_points based on sub_skill and test_type
 * Based on migration: 20240622000001_populate_max_points.sql
 */
function calculateMaxPoints(testType: string, subSkill: string, responseType: ResponseType): number {
  // Writing questions have higher point values based on product type
  if (responseType === 'extended_response' || 
      subSkill.toLowerCase().includes('writing') ||
      subSkill.toLowerCase().includes('narrative') ||
      subSkill.toLowerCase().includes('persuasive') ||
      subSkill.toLowerCase().includes('expository') ||
      subSkill.toLowerCase().includes('imaginative') ||
      subSkill.toLowerCase().includes('creative') ||
      subSkill.toLowerCase().includes('descriptive')) {
    
    // NSW Selective Entry (50 points per writing task)
    if (testType === 'NSW Selective Entry (Year 7 Entry)') {
      return 50;
    }
    
    // VIC Selective Entry (30 points per writing task)
    if (testType === 'VIC Selective Entry (Year 9 Entry)') {
      return 30;
    }
    
    // Year 5 & 7 NAPLAN (48 points per writing task)
    if (testType === 'Year 5 NAPLAN' || testType === 'Year 7 NAPLAN') {
      return 48;
    }
    
    // EduTest Scholarship (15 points per writing task)
    if (testType === 'EduTest Scholarship (Year 7 Entry)') {
      return 15;
    }
    
    // ACER Scholarship (20 points per writing task)
    if (testType === 'ACER Scholarship (Year 7 Entry)') {
      return 20;
    }
  }
  
  // Default for multiple choice and other questions
  return 1;
}

/**
 * Helper function to derive product_type from test_type
 * Ensures consistency with database product_type field
 */
function getProductTypeFromTestType(testType: string): string {
  // Return the exact test_type as it should match the database product_type field
  return testType;
}

/**
 * Helper function to get sub_skill_id from sub_skill name
 * This would ideally query the sub_skills table, but for now we'll use null
 * TODO: Implement sub_skills table lookup
 */
async function getSubSkillId(subSkillName: string, sectionName: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('sub_skills')
      .select('id')
      .eq('name', subSkillName)
      .single();

    if (error || !data) {
      // Sub-skill lookup is optional - generation can continue without it
      // console.debug(`Sub-skill ID not found for "${subSkillName}" in section "${sectionName}"`);
      return null;
    }

    return data.id;
  } catch (error) {
    console.warn(`⚠️  Error looking up sub_skill_id for "${subSkillName}":`, error);
    return null;
  }
}

/**
 * Helper function to determine passage type from generation metadata
 */
function getPassageType(passage: GeneratedPassage): string {
  // Use the actual passage_type from the passage object first
  if (passage.passage_type) {
    return passage.passage_type;
  }
  
  // Fall back to metadata
  if (passage.generation_metadata && typeof passage.generation_metadata === 'object') {
    const metadata = passage.generation_metadata as any;
    return metadata.passage_type || 'informational';
  }
  
  return 'informational';
}

/**
 * Stores a generated passage in Supabase and returns the passage ID
 */
export async function storePassage(
  passage: GeneratedPassage,
  testType: string,
  testMode: string,
  sectionName: string
): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('passages')
      .insert({
        title: passage.title,
        content: passage.content,
        word_count: passage.word_count,
        difficulty: passage.difficulty,
        australian_context: passage.australian_context,
        passage_type: getPassageType(passage),
        section_name: sectionName,
        test_type: testType,
        year_level: getYearLevelFromTestType(testType)
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to store passage: ${error.message}`);
    }

    if (!data?.id) {
      throw new Error('Failed to get passage ID after storage');
    }

    console.log(`✅ Stored passage: "${passage.title}" (ID: ${data.id})`);
    return data.id;
  } catch (error) {
    console.error('❌ Failed to store passage:', error);
    throw error;
  }
}

/**
 * Stores a generated question in Supabase with optional passage linking
 * Now includes max_points and other missing database fields
 */
export async function storeQuestion(
  question: GeneratedQuestion,
  testType: string,
  testMode: string,
  sectionName: string,
  subSkill: string,
  difficulty: number,
  passageId?: string,
  questionOrder?: number
): Promise<string> {
  try {
    // Determine response type
    const responseType: ResponseType = question.answer_options ? 'multiple_choice' : 'extended_response';
    
    // Validate question before storage
    const questionToValidate = {
      question_text: question.question_text,
      answer_options: question.answer_options,
      correct_answer: question.correct_answer,
      solution: question.solution,
      response_type: responseType,
      sub_skill: subSkill,
      section_name: sectionName,
      test_type: testType,
      difficulty: difficulty
    };
    
    const validationResult = await validateQuestionWithPipeline(questionToValidate);
    
    if (!validationResult.isValid) {
      console.error(`❌ Question validation failed: ${validationResult.errors.join(', ')}`);
      throw new Error(`Question validation failed: ${validationResult.errors.join(', ')}`);
    }
    
    if (validationResult.confidence < 85) {
      console.warn(`⚠️  Low confidence question (${validationResult.confidence}%): ${validationResult.warnings.join(', ')}`);
    }
    
    // Calculate max_points based on question type and test type
    const maxPoints = calculateMaxPoints(testType, subSkill, responseType);
    
    // Get product type
    const productType = getProductTypeFromTestType(testType);
    
    // Try to get sub_skill_id (optional - will be null if not found)
    const subSkillId = await getSubSkillId(subSkill, sectionName);

    const { data, error } = await supabase
      .from('questions')
      .insert({
        test_type: testType,
        test_mode: testMode,
        section_name: sectionName,
        sub_skill: subSkill,
        sub_skill_id: subSkillId,
        difficulty: difficulty,
        question_text: question.question_text,
        answer_options: question.answer_options,
        correct_answer: question.correct_answer,
        solution: question.solution,
        response_type: responseType,
        has_visual: question.has_visual || false,
        visual_type: question.visual_type || null,
        visual_data: question.visual_data || null,
        visual_svg: question.visual_svg || null,
        passage_id: passageId || null,
        year_level: getYearLevelFromTestType(testType),
        product_type: productType,
        max_points: maxPoints,
        question_order: questionOrder || null,
        generated_by: 'claude-sonnet-4',
        curriculum_aligned: true
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to store question: ${error.message}`);
    }

    if (!data?.id) {
      throw new Error('Failed to get question ID after storage');
    }

    const passageInfo = passageId ? ` (linked to passage ${passageId})` : '';
    const pointsInfo = maxPoints > 1 ? ` [${maxPoints} points]` : '';
    console.log(`✅ Stored question: ${subSkill}${passageInfo}${pointsInfo} (ID: ${data.id})`);
    return data.id;
  } catch (error) {
    console.error('❌ Failed to store question:', error);
    throw error;
  }
}

/**
 * Stores multiple passages and returns their IDs
 */
export async function storePassages(
  passages: GeneratedPassage[],
  testType: string,
  testMode: string,
  sectionName: string
): Promise<string[]> {
  const passageIds: string[] = [];
  
  for (const passage of passages) {
    const passageId = await storePassage(passage, testType, testMode, sectionName);
    passageIds.push(passageId);
  }
  
  return passageIds;
}

/**
 * Stores multiple questions with optional passage linking and question ordering
 */
export async function storeQuestions(
  questions: Array<{
    question: GeneratedQuestion;
    subSkill: string;
    difficulty: number;
    passageId?: string;
    questionOrder?: number;
  }>,
  testType: string,
  testMode: string,
  sectionName: string
): Promise<string[]> {
  const questionIds: string[] = [];
  
  for (let i = 0; i < questions.length; i++) {
    const item = questions[i];
    const questionOrder = item.questionOrder ?? (i + 1); // Default to 1-based ordering
    
    const questionId = await storeQuestion(
      item.question,
      testType,
      testMode,
      sectionName,
      item.subSkill,
      item.difficulty,
      item.passageId,
      questionOrder
    );
    questionIds.push(questionId);
  }
  
  return questionIds;
}

/**
 * Validates database connection and required tables
 */
export async function validateDatabaseConnection(): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];
  
  try {
    // Test passages table
    const { error: passagesError } = await supabase
      .from('passages')
      .select('id')
      .limit(1);
    
    if (passagesError) {
      errors.push(`Passages table error: ${passagesError.message}`);
    }
    
    // Test questions table
    const { error: questionsError } = await supabase
      .from('questions')
      .select('id')
      .limit(1);
    
    if (questionsError) {
      errors.push(`Questions table error: ${questionsError.message}`);
    }
    
  } catch (error) {
    errors.push(`Database connection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Gets storage statistics for a test type and mode
 */
export async function getStorageStats(testType: string, testMode: string): Promise<{
  passages: number;
  questions: number;
  questionsBySection: Record<string, number>;
}> {
  try {
    // Count passages
    const { count: passageCount } = await supabase
      .from('passages')
      .select('*', { count: 'exact', head: true })
      .eq('test_type', testType);
    
    // Count questions
    const { count: questionCount } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('test_type', testType)
      .eq('test_mode', testMode);
    
    // Count questions by section
    const { data: sectionData } = await supabase
      .from('questions')
      .select('section_name')
      .eq('test_type', testType)
      .eq('test_mode', testMode);
    
    const questionsBySection: Record<string, number> = {};
    sectionData?.forEach(row => {
      const section = row.section_name;
      questionsBySection[section] = (questionsBySection[section] || 0) + 1;
    });
    
    return {
      passages: passageCount || 0,
      questions: questionCount || 0,
      questionsBySection
    };
  } catch (error) {
    console.error('Failed to get storage stats:', error);
    return {
      passages: 0,
      questions: 0,
      questionsBySection: {}
    };
  }
}

/**
 * Clears all generated content for a specific test type and mode
 * Use with caution - this is permanent!
 */
export async function clearTestData(testType: string, testMode: string): Promise<{ success: boolean; deletedCounts: { passages: number; questions: number } }> {
  try {
    // Delete questions first (they reference passages)
    const { count: deletedQuestions } = await supabase
      .from('questions')
      .delete({ count: 'exact' })
      .eq('test_type', testType)
      .eq('test_mode', testMode);
    
    // Delete passages (filter by test_type since there's no test_mode field)
    const { count: deletedPassages } = await supabase
      .from('passages')
      .delete({ count: 'exact' })
      .eq('test_type', testType);
    
    console.log(`🗑️  Cleared test data for ${testType} - ${testMode}:`);
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
    console.error('Failed to clear test data:', error);
    return {
      success: false,
      deletedCounts: { passages: 0, questions: 0 }
    };
  }
}

/**
 * Gets existing question counts by section and sub-skill for a specific test
 */
export async function getExistingQuestionCounts(
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
      .from('questions')
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

    // Process each question
    (questions || []).forEach(question => {
      const { section_name, sub_skill } = question;
      
      // Initialize section if not exists
      if (!sectionCounts[section_name]) {
        sectionCounts[section_name] = {
          total: 0,
          subSkillCounts: {}
        };
      }

      // Initialize sub-skill count if not exists
      if (!sectionCounts[section_name].subSkillCounts[sub_skill]) {
        sectionCounts[section_name].subSkillCounts[sub_skill] = 0;
      }

      // Increment counts
      sectionCounts[section_name].total++;
      sectionCounts[section_name].subSkillCounts[sub_skill]++;
      totalQuestions++;
    });

    return {
      totalQuestions,
      sectionCounts
    };

  } catch (error) {
    console.error('❌ Failed to get existing question counts:', error);
    throw error;
  }
}

/**
 * Analyzes gaps in test structure compared to what exists in database
 */
export async function analyzeTestGaps(
  testType: string,
  testMode: string,
  targetStructure: any
): Promise<{
  completedSections: string[];
  incompleteSections: Array<{
    sectionName: string;
    targetQuestions: number;
    existingQuestions: number;
    missingQuestions: number;
    subSkillGaps: Array<{
      subSkill: string;
      targetQuestions: number;
      existingQuestions: number;
      missingQuestions: number;
    }>;
  }>;
  totalMissing: number;
}> {
  try {
    const existingCounts = await getExistingQuestionCounts(testType, testMode);
    
    const completedSections: string[] = [];
    const incompleteSections: Array<{
      sectionName: string;
      targetQuestions: number;
      existingQuestions: number;
      missingQuestions: number;
      subSkillGaps: Array<{
        subSkill: string;
        targetQuestions: number;
        existingQuestions: number;
        missingQuestions: number;
      }>;
    }> = [];

    let totalMissing = 0;

    // Analyze each section in the target structure
    Object.entries(targetStructure.sections).forEach(([sectionName, sectionConfig]: [string, any]) => {
      const existingSection = existingCounts.sectionCounts[sectionName];
      const existingTotal = existingSection?.total || 0;
      const targetTotal = sectionConfig.totalQuestions;

      if (existingTotal >= targetTotal) {
        // Section is complete
        completedSections.push(sectionName);
      } else {
        // Section is incomplete - analyze sub-skill gaps
        const subSkillGaps: Array<{
          subSkill: string;
          targetQuestions: number;
          existingQuestions: number;
          missingQuestions: number;
        }> = [];

        sectionConfig.subSkills.forEach((subSkill: string) => {
          const existingSubSkillCount = existingSection?.subSkillCounts[subSkill] || 0;
          const targetSubSkillCount = sectionConfig.questionsPerSubSkill;
          const missingSubSkillCount = Math.max(0, targetSubSkillCount - existingSubSkillCount);

          if (missingSubSkillCount > 0) {
            subSkillGaps.push({
              subSkill,
              targetQuestions: targetSubSkillCount,
              existingQuestions: existingSubSkillCount,
              missingQuestions: missingSubSkillCount
            });
          }
        });

        const sectionMissing = targetTotal - existingTotal;
        totalMissing += sectionMissing;

        incompleteSections.push({
          sectionName,
          targetQuestions: targetTotal,
          existingQuestions: existingTotal,
          missingQuestions: sectionMissing,
          subSkillGaps
        });
      }
    });

    return {
      completedSections,
      incompleteSections,
      totalMissing
    };

  } catch (error) {
    console.error('❌ Failed to analyze test gaps:', error);
    throw error;
  }
}

/**
 * Gets existing passage counts for sections that require passages
 */
export async function getExistingPassageCounts(
  testType: string,
  testMode: string
): Promise<Record<string, number>> {
  try {
    const { data: passages, error } = await supabase
      .from('passages')
      .select('section_name')
      .eq('test_type', testType);

    if (error) {
      throw new Error(`Failed to query existing passages: ${error.message}`);
    }

    const passageCounts: Record<string, number> = {};

    (passages || []).forEach(passage => {
      const { section_name } = passage;
      passageCounts[section_name] = (passageCounts[section_name] || 0) + 1;
    });

    return passageCounts;

  } catch (error) {
    console.error('❌ Failed to get existing passage counts:', error);
    throw error;
  }
}

/**
 * Prints a detailed report of test completion status
 */
export async function printTestCompletionReport(
  testType: string,
  testMode: string,
  targetStructure: any
): Promise<void> {
  try {
    console.log(`\n📊 CHECKING EXISTING TEST PROGRESS FOR ${testType} (${testMode})`);
    console.log('=' .repeat(80));

    const gapAnalysis = await analyzeTestGaps(testType, testMode, targetStructure);
    const existingCounts = await getExistingQuestionCounts(testType, testMode);
    const passageCounts = await getExistingPassageCounts(testType, testMode);

    console.log(`\n📈 OVERALL PROGRESS:`);
    console.log(`   Total Target Questions: ${targetStructure.totalQuestions}`);
    console.log(`   Total Existing Questions: ${existingCounts.totalQuestions}`);
    console.log(`   Total Missing Questions: ${gapAnalysis.totalMissing}`);
    console.log(`   Progress: ${Math.round((existingCounts.totalQuestions / targetStructure.totalQuestions) * 100)}%`);

    if (gapAnalysis.completedSections.length > 0) {
      console.log(`\n✅ COMPLETED SECTIONS (${gapAnalysis.completedSections.length}):`);
      gapAnalysis.completedSections.forEach(section => {
        const sectionConfig = targetStructure.sections[section];
        const existingPassages = passageCounts[section] || 0;
        const requiredPassages = sectionConfig.passages || 0;
        const passageStatus = requiredPassages > 0 ? ` | Passages: ${existingPassages}/${requiredPassages}` : '';
        console.log(`   ✅ ${section}: ${existingCounts.sectionCounts[section]?.total || 0}/${sectionConfig.totalQuestions} questions${passageStatus}`);
      });
    }

    if (gapAnalysis.incompleteSections.length > 0) {
      console.log(`\n⏳ INCOMPLETE SECTIONS (${gapAnalysis.incompleteSections.length}):`);
      gapAnalysis.incompleteSections.forEach(section => {
        const sectionConfig = targetStructure.sections[section.sectionName];
        const existingPassages = passageCounts[section.sectionName] || 0;
        const requiredPassages = sectionConfig.passages || 0;
        const passageStatus = requiredPassages > 0 ? ` | Passages: ${existingPassages}/${requiredPassages}` : '';
        
        console.log(`   ⏳ ${section.sectionName}: ${section.existingQuestions}/${section.targetQuestions} questions (${section.missingQuestions} missing)${passageStatus}`);
        
        if (section.subSkillGaps.length > 0) {
          section.subSkillGaps.forEach(subSkillGap => {
            console.log(`      - ${subSkillGap.subSkill}: ${subSkillGap.existingQuestions}/${subSkillGap.targetQuestions} (${subSkillGap.missingQuestions} missing)`);
          });
        }
      });
    }

    console.log('=' .repeat(80));

  } catch (error) {
    console.error('❌ Failed to print test completion report:', error);
    throw error;
  }
}

/**
 * Gets existing passages for a test type and section with their full details including difficulty
 */
export async function getExistingPassages(
  testType: string,
  sectionName: string
): Promise<DatabasePassage[]> {
  try {
    const { data: passages, error } = await supabase
      .from('passages')
      .select('*')
      .eq('test_type', testType)
      .eq('section_name', sectionName);

    if (error) {
      throw new Error(`Failed to query existing passages: ${error.message}`);
    }

    return passages || [];

  } catch (error) {
    console.error('❌ Failed to get existing passages:', error);
    throw error;
  }
} 