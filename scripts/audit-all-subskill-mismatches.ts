/**
 * Comprehensive Audit: Check ALL test types and sections for sub-skill name mismatches
 *
 * This script compares database sub-skill names against curriculumData_v2 configuration
 * to identify any legacy/incorrect sub-skill names across the entire system.
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';
import { SECTION_CONFIGURATIONS } from '@/data/curriculumData_v2/sectionConfigurations';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

interface SectionAuditResult {
  configKey: string;
  testType: string;
  sectionName: string;
  expectedSubSkills: string[];
  actualSubSkills: string[];
  correctSubSkills: string[];
  oldSubSkills: string[];
  totalQuestions: number;
  questionsWithCorrectNames: number;
  questionsWithOldNames: number;
  hasMismatch: boolean;
}

async function auditAllSections(): Promise<void> {
  console.log('\n🔍 COMPREHENSIVE SUB-SKILL MISMATCH AUDIT');
  console.log('━'.repeat(100));
  console.log('Checking ALL test types and sections for sub-skill name mismatches...\n');

  const results: SectionAuditResult[] = [];
  let totalSectionsChecked = 0;
  let sectionsWithMismatches = 0;
  let totalOldQuestions = 0;

  // Get all unique test_type + section_name combinations from database
  // Use aggregation to get unique combinations without loading all rows
  const { data: dbSections, error: dbError } = await supabase
    .rpc('get_unique_test_sections');

  let uniqueSections: Array<{ test_type: string; section_name: string }> = [];

  if (dbError || !dbSections) {
    // Fallback: manually query and aggregate
    console.log('⚠️  RPC not available, using fallback method...\n');

    // Get count first
    const { count } = await supabase
      .from('questions_v2')
      .select('*', { count: 'exact', head: true });

    console.log(`   Loading ${count} questions from database...\n`);

    const { data: allQuestions } = await supabase
      .from('questions_v2')
      .select('test_type, section_name')
      .limit(20000);  // Set high limit to get all questions

    const uniqueSet = new Set<string>();
    for (const q of allQuestions || []) {
      uniqueSet.add(`${q.test_type}|||${q.section_name}`);
    }

    uniqueSections = Array.from(uniqueSet).map(s => {
      const [test_type, section_name] = s.split('|||');
      return { test_type, section_name };
    });
  } else {
    uniqueSections = dbSections;
  }

  console.log(`📊 Found ${uniqueSections.length} unique test type + section combinations in database\n`);

  // Check each section
  for (const section of uniqueSections) {
    const configKey = `${section.test_type} - ${section.section_name}`;
    const config = SECTION_CONFIGURATIONS[configKey];

    totalSectionsChecked++;

    if (!config) {
      console.log(`⚠️  SKIPPING: "${configKey}" - No configuration found`);
      console.log('   (This section may be deprecated or not yet configured)\n');
      continue;
    }

    // Extract expected sub-skills from configuration
    let expectedSubSkills: string[] = [];

    if (config.section_structure.generation_strategy === 'balanced') {
      expectedSubSkills = config.section_structure.balanced_distribution!.sub_skills;
    } else if (config.section_structure.generation_strategy === 'hybrid') {
      const standaloneSkills = config.section_structure.hybrid_blueprint!.standalone_distribution.map(d => d.sub_skill);
      const passageSkills = config.section_structure.hybrid_blueprint!.passage_distribution.flatMap(d => d.sub_skills);
      expectedSubSkills = Array.from(new Set([...standaloneSkills, ...passageSkills]));
    } else if (config.section_structure.generation_strategy === 'passage_based') {
      expectedSubSkills = Array.from(
        new Set(
          config.section_structure.passage_blueprint!.passage_distribution.flatMap(d => d.sub_skills)
        )
      );
    } else if (config.section_structure.generation_strategy === 'writing_prompt') {
      expectedSubSkills = config.section_structure.writing_blueprint!.prompt_types;
    }

    // Get actual sub-skills from database
    const { data: questions, error: questionsError } = await supabase
      .from('questions_v2')
      .select('sub_skill')
      .eq('test_type', section.test_type)
      .eq('section_name', section.section_name);

    if (questionsError) {
      console.error(`❌ Error querying questions for ${configKey}:`, questionsError);
      continue;
    }

    if (!questions || questions.length === 0) {
      console.log(`⚠️  EMPTY: "${configKey}" - No questions in database\n`);
      continue;
    }

    // Analyze sub-skills
    const actualSubSkills = Array.from(new Set(questions.map(q => q.sub_skill))).sort();
    const correctSubSkills = actualSubSkills.filter(s => expectedSubSkills.includes(s));
    const oldSubSkills = actualSubSkills.filter(s => !expectedSubSkills.includes(s));

    const questionsWithCorrectNames = questions.filter(q => expectedSubSkills.includes(q.sub_skill)).length;
    const questionsWithOldNames = questions.filter(q => !expectedSubSkills.includes(q.sub_skill)).length;

    const hasMismatch = oldSubSkills.length > 0;

    results.push({
      configKey,
      testType: section.test_type,
      sectionName: section.section_name,
      expectedSubSkills,
      actualSubSkills,
      correctSubSkills,
      oldSubSkills,
      totalQuestions: questions.length,
      questionsWithCorrectNames,
      questionsWithOldNames,
      hasMismatch
    });

    if (hasMismatch) {
      sectionsWithMismatches++;
      totalOldQuestions += questionsWithOldNames;

      console.log(`❌ MISMATCH: "${configKey}"`);
      console.log('━'.repeat(100));
      console.log(`   Total questions: ${questions.length}`);
      console.log(`   Questions with CORRECT names: ${questionsWithCorrectNames}`);
      console.log(`   Questions with OLD names: ${questionsWithOldNames} ⚠️\n`);

      console.log(`   ✅ Expected sub-skills (${expectedSubSkills.length}):`);
      expectedSubSkills.forEach(s => {
        const count = questions.filter(q => q.sub_skill === s).length;
        const status = count > 0 ? '✓' : '✗';
        console.log(`      ${status} "${s}" (${count} questions)`);
      });

      console.log(`\n   ❌ OLD/UNEXPECTED sub-skills in database (${oldSubSkills.length}):`);
      oldSubSkills.forEach(s => {
        const count = questions.filter(q => q.sub_skill === s).length;
        console.log(`      • "${s}" (${count} questions) ← TO BE DELETED`);
      });

      console.log('');
    } else {
      console.log(`✅ OK: "${configKey}" - ${questions.length} questions, all with correct sub-skill names`);
    }
  }

  // Summary Report
  console.log('\n');
  console.log('━'.repeat(100));
  console.log('📊 AUDIT SUMMARY');
  console.log('━'.repeat(100));
  console.log(`Total sections checked: ${totalSectionsChecked}`);
  console.log(`Sections with correct sub-skills: ${totalSectionsChecked - sectionsWithMismatches} ✅`);
  console.log(`Sections with mismatches: ${sectionsWithMismatches} ❌`);
  console.log(`Total questions with OLD sub-skill names: ${totalOldQuestions} (to be deleted)`);
  console.log('');

  if (sectionsWithMismatches > 0) {
    console.log('⚠️  ACTION REQUIRED:');
    console.log('   The following sections have questions with OLD/INCORRECT sub-skill names:\n');

    const sectionsWithIssues = results.filter(r => r.hasMismatch);
    sectionsWithIssues.forEach(r => {
      console.log(`   • ${r.configKey}`);
      console.log(`     - ${r.questionsWithOldNames} questions to delete`);
      console.log(`     - Old sub-skills: ${r.oldSubSkills.join(', ')}`);
      console.log('');
    });

    console.log('   💡 RECOMMENDATION:');
    console.log('   1. Review the detailed output above');
    console.log('   2. Create SQL deletion scripts for affected sections');
    console.log('   3. Delete questions with old sub-skill names');
    console.log('   4. Regenerate missing questions with correct sub-skill names');
    console.log('');
  } else {
    console.log('✅ ALL CLEAR! All sections have correct sub-skill names aligned with configuration.');
    console.log('');
  }

  // Export results to JSON for further analysis
  const fs = await import('fs');
  const outputPath = 'subskill-mismatch-audit-report.json';
  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      {
        auditDate: new Date().toISOString(),
        summary: {
          totalSectionsChecked,
          sectionsWithMismatches,
          sectionsOk: totalSectionsChecked - sectionsWithMismatches,
          totalOldQuestions
        },
        sectionsWithMismatches: results.filter(r => r.hasMismatch),
        allResults: results
      },
      null,
      2
    )
  );

  console.log(`📄 Detailed report saved to: ${outputPath}`);
  console.log('');
}

auditAllSections().then(() => {
  console.log('✅ Audit complete\n');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error:', error);
  process.exit(1);
});
