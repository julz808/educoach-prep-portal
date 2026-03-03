/**
 * V2 Question Generation Engine - Gap Detection
 * Detects missing questions at section and sub-skill level
 *
 * Created: 2026-02-12
 */

import { createClient } from '@supabase/supabase-js';

// Create Supabase client with service role key (bypasses RLS)
const getSupabaseClient = () => {
  // Try multiple env var names in order of preference
  const serviceRoleKey =
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  const supabaseUrl =
    process.env.VITE_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceRoleKey || !supabaseUrl) {
    console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
    throw new Error(`Missing Supabase credentials for gap detection. URL: ${supabaseUrl ? 'found' : 'missing'}, Key: ${serviceRoleKey ? 'found' : 'missing'}`);
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

// Lazy initialization - only create client when first used
let supabaseInstance: ReturnType<typeof createClient> | null = null;
const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(target, prop) {
    if (!supabaseInstance) {
      supabaseInstance = getSupabaseClient();
    }
    return (supabaseInstance as any)[prop];
  }
});

// ============================================================================
// TYPES
// ============================================================================

export interface ExistingQuestionCounts {
  [subSkill: string]: number;
}

export interface SectionGap {
  sectionName: string;
  totalTarget: number;
  totalExisting: number;
  totalGaps: number;
  subSkillGaps: {
    [subSkill: string]: {
      target: number;
      existing: number;
      needed: number;
    };
  };
}

export interface TestGapReport {
  testType: string;
  testMode: string;
  totalQuestionsTarget: number;
  totalQuestionsExisting: number;
  totalQuestionsNeeded: number;
  isComplete: boolean;
  sections: SectionGap[];
}

// ============================================================================
// QUERY EXISTING QUESTIONS
// ============================================================================

/**
 * Get count of existing questions for each sub-skill in a section
 */
export async function getExistingQuestionCounts(
  testType: string,
  sectionName: string,
  testMode: string,
  standaloneOnly: boolean = false,
  expectedSubSkills?: string[]  // Optional: validate against expected sub-skills
): Promise<ExistingQuestionCounts> {
  try {
    let query = supabase
      .from('questions_v2')
      .select('sub_skill, passage_id')
      .eq('test_type', testType)
      .eq('section_name', sectionName)
      .eq('test_mode', testMode);

    // If standaloneOnly, filter to only questions without a passage_id
    if (standaloneOnly) {
      query = query.is('passage_id', null);
    }

    const { data, error } = await query;

    if (error) {
      console.warn(`   ⚠️  Failed to query existing questions: ${error.message}`);
      return {};
    }

    if (!data || data.length === 0) {
      return {};
    }

    // Count questions per sub-skill
    const counts: ExistingQuestionCounts = {};
    const unexpectedSubSkills = new Set<string>();

    for (const row of data) {
      const subSkill = row.sub_skill;
      counts[subSkill] = (counts[subSkill] || 0) + 1;

      // Track unexpected sub-skills if validation is enabled
      if (expectedSubSkills && !expectedSubSkills.includes(subSkill)) {
        unexpectedSubSkills.add(subSkill);
      }
    }

    // Warn about unexpected sub-skills
    if (expectedSubSkills && unexpectedSubSkills.size > 0) {
      console.warn('');
      console.warn(`   ⚠️  WARNING: Found questions with UNEXPECTED sub-skill names in database:`);
      unexpectedSubSkills.forEach(skill => {
        console.warn(`      • "${skill}" (${counts[skill]} questions)`);
      });
      console.warn('');
      console.warn('   💡 This may indicate:');
      console.warn('      1. Database contains questions generated with old sub-skill names');
      console.warn('      2. Configuration was updated but database was not');
      console.warn('      3. Questions were manually inserted with incorrect sub-skill names');
      console.warn('');
      console.warn('   ⚠️  RISK: If you continue, the script may generate NEW questions with the');
      console.warn('      expected sub-skill names, resulting in OVER-GENERATION!');
      console.warn('');
      console.warn('   Expected sub-skills:');
      expectedSubSkills.forEach(skill => {
        const hasQuestions = counts[skill] > 0;
        console.warn(`      ${hasQuestions ? '✓' : '✗'} "${skill}" (${counts[skill] || 0} questions)`);
      });
      console.warn('');
    }

    return counts;
  } catch (error) {
    console.warn(`   ⚠️  Error querying existing questions: ${error}`);
    return {};
  }
}

/**
 * Get all existing questions for a sub-skill (for diversity context)
 *
 * @param testMode - If provided, only fetches from this mode. If null, fetches from ALL modes (cross-mode diversity)
 */
export async function getExistingQuestionsForSubSkill(
  testType: string,
  sectionName: string,
  subSkill: string,
  testMode: string | null = null
): Promise<any[]> {
  try {
    let query = supabase
      .from('questions_v2')
      .select('id, question_text, answer_options, correct_answer, sub_skill, difficulty, test_mode')
      .eq('test_type', testType)
      .eq('section_name', sectionName)
      .eq('sub_skill', subSkill);

    // If testMode is provided, filter by it. Otherwise, load from ALL modes.
    if (testMode) {
      query = query.eq('test_mode', testMode);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.warn(`   ⚠️  Failed to fetch existing questions for ${subSkill}: ${error.message}`);
      return [];
    }

    return data || [];
  } catch (error) {
    console.warn(`   ⚠️  Error fetching existing questions: ${error}`);
    return [];
  }
}

// ============================================================================
// GAP DETECTION
// ============================================================================

/**
 * Detect gaps for a single section
 */
export function detectSectionGaps(
  targetDistribution: { [subSkill: string]: number },
  existingCounts: ExistingQuestionCounts,
  sectionName: string
): SectionGap {
  const subSkillGaps: SectionGap['subSkillGaps'] = {};
  let totalTarget = 0;
  let totalExisting = 0;
  let totalGaps = 0;

  for (const [subSkill, target] of Object.entries(targetDistribution)) {
    const existing = existingCounts[subSkill] || 0;
    const needed = Math.max(0, target - existing);

    subSkillGaps[subSkill] = {
      target,
      existing,
      needed
    };

    totalTarget += target;
    totalExisting += existing;
    totalGaps += needed;
  }

  return {
    sectionName,
    totalTarget,
    totalExisting,
    totalGaps,
    subSkillGaps
  };
}

/**
 * Generate a gap report for an entire test
 */
export async function generateTestGapReport(
  testType: string,
  testMode: string,
  sectionConfigs: Array<{
    sectionName: string;
    targetDistribution: { [subSkill: string]: number };
  }>
): Promise<TestGapReport> {
  const sections: SectionGap[] = [];
  let totalTarget = 0;
  let totalExisting = 0;
  let totalNeeded = 0;

  for (const config of sectionConfigs) {
    // Extract expected sub-skills from target distribution
    const expectedSubSkills = Object.keys(config.targetDistribution);

    const existingCounts = await getExistingQuestionCounts(
      testType,
      config.sectionName,
      testMode,
      false,  // standaloneOnly
      expectedSubSkills  // Pass expected sub-skills for validation
    );

    // ⭐ SAFETY CHECK: Check total count regardless of sub-skill names
    const totalQuestionsInDb = Object.values(existingCounts).reduce((sum, count) => sum + count, 0);
    const targetTotal = Object.values(config.targetDistribution).reduce((sum, count) => sum + count, 0);

    if (totalQuestionsInDb >= targetTotal) {
      console.warn('');
      console.warn(`   ⚠️  SAFETY CHECK: Section "${config.sectionName}" already has ${totalQuestionsInDb} questions`);
      console.warn(`      (target: ${targetTotal}). This section may be COMPLETE or OVER-GENERATED.`);
      console.warn('');
      console.warn(`   💡 If sub-skill names don't match configuration, consider:`);
      console.warn(`      1. Updating database sub-skill names to match configuration`);
      console.warn(`      2. Updating configuration to match database sub-skill names`);
      console.warn(`      3. Deleting over-generated questions before proceeding`);
      console.warn('');
    }

    const sectionGap = detectSectionGaps(
      config.targetDistribution,
      existingCounts,
      config.sectionName
    );

    sections.push(sectionGap);
    totalTarget += sectionGap.totalTarget;
    totalExisting += sectionGap.totalExisting;
    totalNeeded += sectionGap.totalGaps;
  }

  return {
    testType,
    testMode,
    totalQuestionsTarget: totalTarget,
    totalQuestionsExisting: totalExisting,
    totalQuestionsNeeded: totalNeeded,
    isComplete: totalNeeded === 0,
    sections
  };
}

// ============================================================================
// REPORTING
// ============================================================================

/**
 * Print a formatted gap report to console
 */
export function printGapReport(report: TestGapReport): void {
  console.log('');
  console.log('━'.repeat(80));
  console.log('📊 GAP DETECTION REPORT');
  console.log('━'.repeat(80));
  console.log('');
  console.log(`Test Type: ${report.testType}`);
  console.log(`Test Mode: ${report.testMode}`);
  console.log('');
  console.log(`Overall Progress:`);
  console.log(`   Target Questions: ${report.totalQuestionsTarget}`);
  console.log(`   Existing Questions: ${report.totalQuestionsExisting}`);
  console.log(`   Gaps to Fill: ${report.totalQuestionsNeeded}`);
  console.log(`   Completion: ${((report.totalQuestionsExisting / report.totalQuestionsTarget) * 100).toFixed(1)}%`);
  console.log('');

  if (report.isComplete) {
    console.log('✅ TEST COMPLETE - All questions generated!');
    console.log('');
    console.log('━'.repeat(80));
    return;
  }

  console.log('📋 Section Breakdown:');
  console.log('');

  for (const section of report.sections) {
    const completionPct = ((section.totalExisting / section.totalTarget) * 100).toFixed(1);
    const statusIcon = section.totalGaps === 0 ? '✅' : section.totalExisting === 0 ? '❌' : '⚠️';

    console.log(`${statusIcon} ${section.sectionName}`);
    console.log(`   Progress: ${section.totalExisting}/${section.totalTarget} (${completionPct}%)`);

    if (section.totalGaps > 0) {
      console.log(`   Missing: ${section.totalGaps} questions`);
      console.log('');
      console.log('   Sub-skill gaps:');

      for (const [subSkill, gap] of Object.entries(section.subSkillGaps)) {
        if (gap.needed > 0) {
          console.log(`      • ${subSkill}: ${gap.existing}/${gap.target} (need ${gap.needed} more)`);
        } else {
          console.log(`      ✓ ${subSkill}: ${gap.existing}/${gap.target} (complete)`);
        }
      }
    } else {
      console.log(`   ✅ Section complete!`);
    }

    console.log('');
  }

  console.log('━'.repeat(80));
  console.log('');
}

/**
 * Print a concise section gap summary
 */
export function printSectionGapSummary(gap: SectionGap): void {
  if (gap.totalGaps === 0) {
    console.log(`   ✅ Section already complete! (${gap.totalExisting}/${gap.totalTarget} questions)`);
    return;
  }

  console.log(`   📊 Section Status: ${gap.totalExisting}/${gap.totalTarget} questions (${gap.totalGaps} gaps)`);
  console.log('');
  console.log('   Sub-skill gaps to fill:');

  for (const [subSkill, gapInfo] of Object.entries(gap.subSkillGaps)) {
    if (gapInfo.needed > 0) {
      console.log(`      📝 ${subSkill}: need ${gapInfo.needed} more (${gapInfo.existing}/${gapInfo.target})`);
    }
  }

  console.log('');
}
