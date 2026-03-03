import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { SECTION_CONFIGURATIONS, calculateBalancedDistribution } from '../src/data/curriculumData_v2/sectionConfigurations';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface ProductConfig {
  diagnostic: number;
  practice_tests: number; // Number of practice tests
  drills_per_subskill: number;
}

// Configuration for each product based on curriculum
const PRODUCT_CONFIGS: Record<string, ProductConfig> = {
  "Year 5 NAPLAN": {
    diagnostic: 1,
    practice_tests: 5,
    drills_per_subskill: 30
  },
  "Year 7 NAPLAN": {
    diagnostic: 1,
    practice_tests: 5,
    drills_per_subskill: 30
  },
  "EduTest Scholarship (Year 7 Entry)": {
    diagnostic: 1,
    practice_tests: 5,
    drills_per_subskill: 30
  },
  "NSW Selective Entry (Year 7 Entry)": {
    diagnostic: 1,
    practice_tests: 5,
    drills_per_subskill: 30
  },
  "VIC Selective Entry (Year 9 Entry)": {
    diagnostic: 1,
    practice_tests: 5,
    drills_per_subskill: 30
  },
  "ACER Scholarship (Year 7 Entry)": {
    diagnostic: 1,
    practice_tests: 5,
    drills_per_subskill: 30
  }
};

async function comprehensiveAudit() {
  console.log('╔════════════════════════════════════════════════════════════════════════╗');
  console.log('║     COMPREHENSIVE QUESTIONS & PASSAGES AUDIT - CURRICULUM V2            ║');
  console.log('╚════════════════════════════════════════════════════════════════════════╝\n');

  // Fetch all questions
  let allQuestions: any[] = [];
  let from = 0;
  const batchSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('questions_v2')
      .select('product_type, test_type, test_mode, section_name, sub_skill')
      .range(from, from + batchSize - 1);

    if (error) {
      console.error('Error fetching questions:', error);
      return;
    }

    if (!data || data.length === 0) break;
    allQuestions = allQuestions.concat(data);
    if (data.length < batchSize) break;
    from += batchSize;
  }

  // Fetch all passages
  let allPassages: any[] = [];
  from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('passages_v2')
      .select('test_type, section_name')
      .range(from, from + batchSize - 1);

    if (error) {
      console.error('Error fetching passages:', error);
      return;
    }

    if (!data || data.length === 0) break;
    allPassages = allPassages.concat(data);
    if (data.length < batchSize) break;
    from += batchSize;
  }

  console.log(`📊 ACTUAL TOTALS:`);
  console.log(`   Questions: ${allQuestions.length}`);
  console.log(`   Passages:  ${allPassages.length}\n`);

  // Calculate expected totals
  let expectedQuestions = 0;
  let expectedPassages = 0;

  const products = Object.keys(PRODUCT_CONFIGS);

  for (const productType of products) {
    const config = PRODUCT_CONFIGS[productType];

    // Get all sections for this product
    const sectionsForProduct = Object.keys(SECTION_CONFIGURATIONS).filter(key =>
      key.startsWith(productType)
    );

    for (const sectionKey of sectionsForProduct) {
      const sectionConfig = SECTION_CONFIGURATIONS[sectionKey];
      const totalQuestionsPerTest = sectionConfig.total_questions;

      // Calculate for diagnostic
      expectedQuestions += totalQuestionsPerTest;

      // Calculate for practice tests
      expectedQuestions += totalQuestionsPerTest * config.practice_tests;

      // Calculate for drills (balanced sections only)
      if (sectionConfig.section_structure.generation_strategy === 'balanced') {
        const subSkills = sectionConfig.section_structure.balanced_distribution.sub_skills;
        expectedQuestions += subSkills.length * config.drills_per_subskill;
      }

      // Calculate passages for passage_based and hybrid sections
      if (sectionConfig.section_structure.generation_strategy === 'passage_based') {
        const passageBlueprint = sectionConfig.section_structure.passage_blueprint;
        const passagesPerTest = passageBlueprint.passage_distribution.reduce((sum: number, dist: any) => {
          return sum + dist.count;
        }, 0);
        expectedPassages += passagesPerTest * (config.diagnostic + config.practice_tests);
      } else if (sectionConfig.section_structure.generation_strategy === 'hybrid') {
        const hybridBlueprint = sectionConfig.section_structure.hybrid_blueprint;
        const passagesPerTest = hybridBlueprint.passage_distribution.reduce((sum: number, dist: any) => {
          return sum + dist.count;
        }, 0);
        expectedPassages += passagesPerTest * (config.diagnostic + config.practice_tests);
      }
    }
  }

  console.log(`📋 EXPECTED TOTALS:`);
  console.log(`   Questions: ${expectedQuestions}`);
  console.log(`   Passages:  ${expectedPassages}\n`);

  console.log(`📈 VARIANCE:`);
  console.log(`   Questions: ${allQuestions.length - expectedQuestions} (${allQuestions.length > expectedQuestions ? '+' : ''}${((allQuestions.length - expectedQuestions) / expectedQuestions * 100).toFixed(1)}%)`);
  console.log(`   Passages:  ${allPassages.length - expectedPassages} (${allPassages.length > expectedPassages ? '+' : ''}${((allPassages.length - expectedPassages) / expectedPassages * 100).toFixed(1)}%)\n`);

  console.log('\n╔════════════════════════════════════════════════════════════════════════╗');
  console.log('║     DETAILED BREAKDOWN BY PRODUCT                                       ║');
  console.log('╚════════════════════════════════════════════════════════════════════════╝\n');

  // Detailed breakdown for each product
  for (const productType of products) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📦 PRODUCT: ${productType}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    const config = PRODUCT_CONFIGS[productType];
    const sectionsForProduct = Object.keys(SECTION_CONFIGURATIONS).filter(key =>
      key.startsWith(productType)
    );

    for (const sectionKey of sectionsForProduct) {
      const sectionConfig = SECTION_CONFIGURATIONS[sectionKey];
      const sectionName = sectionConfig.section_name;

      console.log(`\n  📂 SECTION: ${sectionName}`);
      console.log(`  ${'─'.repeat(70)}`);

      // Calculate expected for this section
      const totalQuestionsPerTest = sectionConfig.total_questions;
      const expectedDiagnostic = totalQuestionsPerTest;
      const expectedPracticeTotal = totalQuestionsPerTest * config.practice_tests;

      // Get actual counts
      const actualDiagnostic = allQuestions.filter(q =>
        q.product_type === productType &&
        q.section_name === sectionName &&
        q.test_mode === 'diagnostic'
      ).length;

      const actualPractice1 = allQuestions.filter(q =>
        q.product_type === productType &&
        q.section_name === sectionName &&
        q.test_mode === 'practice_1'
      ).length;

      const actualPractice2 = allQuestions.filter(q =>
        q.product_type === productType &&
        q.section_name === sectionName &&
        q.test_mode === 'practice_2'
      ).length;

      const actualPractice3 = allQuestions.filter(q =>
        q.product_type === productType &&
        q.section_name === sectionName &&
        q.test_mode === 'practice_3'
      ).length;

      const actualPractice4 = allQuestions.filter(q =>
        q.product_type === productType &&
        q.section_name === sectionName &&
        q.test_mode === 'practice_4'
      ).length;

      const actualPractice5 = allQuestions.filter(q =>
        q.product_type === productType &&
        q.section_name === sectionName &&
        q.test_mode === 'practice_5'
      ).length;

      const actualPracticeTotal = actualPractice1 + actualPractice2 + actualPractice3 + actualPractice4 + actualPractice5;

      const actualDrills = allQuestions.filter(q =>
        q.product_type === productType &&
        q.section_name === sectionName &&
        q.test_mode === 'drill'
      ).length;

      // Print diagnostic
      const diagDiff = actualDiagnostic - expectedDiagnostic;
      const diagStatus = diagDiff === 0 ? '✅' : diagDiff > 0 ? '⚠️ ' : '❌';
      console.log(`    ${diagStatus} Diagnostic:     Expected ${expectedDiagnostic}, Actual ${actualDiagnostic} (${diagDiff >= 0 ? '+' : ''}${diagDiff})`);

      // Print practice tests
      const pracDiff = actualPracticeTotal - expectedPracticeTotal;
      const pracStatus = pracDiff === 0 ? '✅' : pracDiff > 0 ? '⚠️ ' : '❌';
      console.log(`    ${pracStatus} Practice Tests: Expected ${expectedPracticeTotal}, Actual ${actualPracticeTotal} (${pracDiff >= 0 ? '+' : ''}${pracDiff})`);
      console.log(`       - Practice 1: ${actualPractice1}/${totalQuestionsPerTest}`);
      console.log(`       - Practice 2: ${actualPractice2}/${totalQuestionsPerTest}`);
      console.log(`       - Practice 3: ${actualPractice3}/${totalQuestionsPerTest}`);
      console.log(`       - Practice 4: ${actualPractice4}/${totalQuestionsPerTest}`);
      console.log(`       - Practice 5: ${actualPractice5}/${totalQuestionsPerTest}`);

      // Print drills (if applicable)
      if (sectionConfig.section_structure.generation_strategy === 'balanced') {
        const subSkills = sectionConfig.section_structure.balanced_distribution.sub_skills;
        const expectedDrills = subSkills.length * config.drills_per_subskill;
        const drillsDiff = actualDrills - expectedDrills;
        const drillsStatus = drillsDiff === 0 ? '✅' : drillsDiff > 0 ? '⚠️ ' : '❌';
        console.log(`    ${drillsStatus} Drills:         Expected ${expectedDrills}, Actual ${actualDrills} (${drillsDiff >= 0 ? '+' : ''}${drillsDiff})`);

        // Subskill breakdown for drills
        console.log(`\n       📊 Drill Questions by Subskill:`);
        for (const subSkill of subSkills) {
          const actualSubskill = allQuestions.filter(q =>
            q.product_type === productType &&
            q.section_name === sectionName &&
            q.test_mode === 'drill' &&
            q.sub_skill === subSkill
          ).length;
          const subskillDiff = actualSubskill - config.drills_per_subskill;
          const subskillStatus = subskillDiff === 0 ? '✅' : subskillDiff > 0 ? '⚠️ ' : '❌';
          console.log(`          ${subskillStatus} ${subSkill}: ${actualSubskill}/${config.drills_per_subskill} (${subskillDiff >= 0 ? '+' : ''}${subskillDiff})`);
        }
      } else {
        console.log(`    ℹ️  Drills:         N/A (${sectionConfig.section_structure.generation_strategy} section)`);
      }

      // Print passages (if applicable)
      if (sectionConfig.section_structure.generation_strategy === 'passage_based' ||
          sectionConfig.section_structure.generation_strategy === 'hybrid') {
        const actualSectionPassages = allPassages.filter(p =>
          p.test_type === productType &&
          p.section_name === sectionName
        ).length;

        let expectedSectionPassages = 0;
        if (sectionConfig.section_structure.generation_strategy === 'passage_based') {
          const passageBlueprint = sectionConfig.section_structure.passage_blueprint;
          const passagesPerTest = passageBlueprint.passage_distribution.reduce((sum: number, dist: any) => {
            return sum + dist.count;
          }, 0);
          expectedSectionPassages = passagesPerTest * (config.diagnostic + config.practice_tests);
        } else if (sectionConfig.section_structure.generation_strategy === 'hybrid') {
          const hybridBlueprint = sectionConfig.section_structure.hybrid_blueprint;
          const passagesPerTest = hybridBlueprint.passage_distribution.reduce((sum: number, dist: any) => {
            return sum + dist.count;
          }, 0);
          expectedSectionPassages = passagesPerTest * (config.diagnostic + config.practice_tests);
        }

        const passageDiff = actualSectionPassages - expectedSectionPassages;
        const passageStatus = passageDiff === 0 ? '✅' : passageDiff > 0 ? '⚠️ ' : '❌';
        console.log(`    ${passageStatus} Passages:       Expected ${expectedSectionPassages}, Actual ${actualSectionPassages} (${passageDiff >= 0 ? '+' : ''}${passageDiff})`);
      }
    }
  }

  console.log('\n\n╔════════════════════════════════════════════════════════════════════════╗');
  console.log('║     AUDIT COMPLETE                                                      ║');
  console.log('╚════════════════════════════════════════════════════════════════════════╝\n');
}

comprehensiveAudit()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
