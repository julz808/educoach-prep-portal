/**
 * Generate Missing Drill Questions
 *
 * This script identifies all drill gaps and generates the missing questions
 * to reach exactly 30 questions per subskill for all drill sections.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { SECTION_CONFIGURATIONS } from '../src/data/curriculumData_v2/sectionConfigurations';
import { generateQuestionV2 } from '../src/engines/questionGeneration/v2';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const TARGET_DRILLS_PER_SUBSKILL = 30;

interface DrillGap {
  productType: string;
  sectionName: string;
  subSkill: string;
  current: number;
  target: number;
  missing: number;
}

async function identifyDrillGaps(): Promise<DrillGap[]> {
  console.log('🔍 Identifying drill gaps...\n');

  // Fetch all drill questions
  let allDrills: any[] = [];
  let from = 0;
  const batchSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('questions_v2')
      .select('product_type, test_type, section_name, sub_skill')
      .eq('test_mode', 'drill')
      .range(from, from + batchSize - 1);

    if (error) {
      console.error('Error fetching drills:', error);
      throw error;
    }

    if (!data || data.length === 0) break;
    allDrills = allDrills.concat(data);
    if (data.length < batchSize) break;
    from += batchSize;
  }

  console.log(`📊 Found ${allDrills.length} total drill questions\n`);

  // Identify gaps
  const gaps: DrillGap[] = [];

  // Get all balanced sections (these are the ones that should have drills)
  const balancedSections = Object.entries(SECTION_CONFIGURATIONS).filter(
    ([_, config]) => config.section_structure.generation_strategy === 'balanced'
  );

  for (const [sectionKey, sectionConfig] of balancedSections) {
    const productType = sectionConfig.test_type;
    const sectionName = sectionConfig.section_name;
    const subSkills = sectionConfig.section_structure.balanced_distribution.sub_skills;

    for (const subSkill of subSkills) {
      const current = allDrills.filter(q =>
        q.product_type === productType &&
        q.section_name === sectionName &&
        q.sub_skill === subSkill
      ).length;

      if (current < TARGET_DRILLS_PER_SUBSKILL) {
        gaps.push({
          productType,
          sectionName,
          subSkill,
          current,
          target: TARGET_DRILLS_PER_SUBSKILL,
          missing: TARGET_DRILLS_PER_SUBSKILL - current
        });
      }
    }
  }

  // Sort by missing count (most critical first)
  gaps.sort((a, b) => b.missing - a.missing);

  return gaps;
}

async function generateMissingDrills() {
  console.log('╔════════════════════════════════════════════════════════════════════════╗');
  console.log('║     GENERATE MISSING DRILL QUESTIONS                                    ║');
  console.log('╚════════════════════════════════════════════════════════════════════════╝\n');

  const gaps = await identifyDrillGaps();

  if (gaps.length === 0) {
    console.log('✅ No drill gaps found! All sections have 30 questions per subskill.\n');
    return;
  }

  console.log(`❌ Found ${gaps.length} subskills with missing drill questions\n`);
  console.log('Missing Drill Questions:\n');

  // Group by product for display
  const gapsByProduct: Record<string, DrillGap[]> = {};
  for (const gap of gaps) {
    if (!gapsByProduct[gap.productType]) {
      gapsByProduct[gap.productType] = [];
    }
    gapsByProduct[gap.productType].push(gap);
  }

  let totalMissing = 0;
  for (const [product, productGaps] of Object.entries(gapsByProduct)) {
    console.log(`\n📦 ${product}`);
    console.log('─'.repeat(70));

    const gapsBySection: Record<string, DrillGap[]> = {};
    for (const gap of productGaps) {
      if (!gapsBySection[gap.sectionName]) {
        gapsBySection[gap.sectionName] = [];
      }
      gapsBySection[gap.sectionName].push(gap);
    }

    for (const [section, sectionGaps] of Object.entries(gapsBySection)) {
      const sectionTotal = sectionGaps.reduce((sum, g) => sum + g.missing, 0);
      console.log(`\n  📂 ${section} (${sectionTotal} missing total)`);

      for (const gap of sectionGaps) {
        console.log(`     ❌ ${gap.subSkill}: ${gap.current}/${gap.target} (-${gap.missing})`);
        totalMissing += gap.missing;
      }
    }
  }

  console.log(`\n\n📊 TOTAL MISSING DRILL QUESTIONS: ${totalMissing}\n`);
  console.log('─'.repeat(70));

  // Ask for confirmation
  console.log('\n⚠️  This will generate drill questions for each gap.');
  console.log('⚠️  Make sure you have sufficient Claude API credits.\n');

  // Generate missing drills
  let generatedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < gaps.length; i++) {
    const gap = gaps[i];

    console.log(`\n[${i + 1}/${gaps.length}] Generating ${gap.missing} drills for:`);
    console.log(`    ${gap.productType} > ${gap.sectionName} > ${gap.subSkill}`);

    try {
      // Generate each missing drill question individually
      let successfulForGap = 0;

      for (let q = 0; q < gap.missing; q++) {
        // Determine difficulty for this question
        // For drills, we want variety: alternate between difficulty 1, 2, and 3
        const difficulty = (q % 3) + 1;

        try {
          const result = await generateQuestionV2(
            {
              testType: gap.productType,
              section: gap.sectionName,
              subSkill: gap.subSkill,
              difficulty,
              testMode: 'drill'
            },
            {
              skipValidation: false,
              skipStorage: false,
              strictValidation: true,
              crossModeDiversity: false  // Only check diversity within drill mode
            }
          );

          if (result.success && result.question) {
            successfulForGap++;
            console.log(`    ✅ [${successfulForGap}/${gap.missing}] Generated difficulty ${difficulty} question`);
          } else {
            console.error(`    ❌ [${q + 1}/${gap.missing}] Failed: ${result.error}`);
          }

          // Small delay between questions to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));

        } catch (questionError) {
          console.error(`    ❌ [${q + 1}/${gap.missing}] Error: ${questionError}`);
        }
      }

      generatedCount += successfulForGap;

      if (successfulForGap < gap.missing) {
        console.warn(`    ⚠️  Only generated ${successfulForGap}/${gap.missing} questions for this subskill`);
        errorCount++;
      }

      // Longer delay between subskills
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.error(`    ❌ Error: ${error}`);
      errorCount++;
    }
  }

  console.log('\n\n╔════════════════════════════════════════════════════════════════════════╗');
  console.log('║     GENERATION COMPLETE                                                 ║');
  console.log('╚════════════════════════════════════════════════════════════════════════╝\n');

  console.log(`✅ Successfully generated: ${generatedCount} questions`);
  console.log(`❌ Errors encountered: ${errorCount}`);
  console.log(`📊 Total attempted: ${totalMissing}`);

  // Verify final counts
  console.log('\n\n🔍 Verifying final drill counts...\n');

  const finalGaps = await identifyDrillGaps();

  if (finalGaps.length === 0) {
    console.log('✅ SUCCESS! All drill sections now have 30 questions per subskill.\n');
  } else {
    console.log(`⚠️  ${finalGaps.length} gaps still remain. You may need to re-run this script.\n`);

    for (const gap of finalGaps.slice(0, 10)) {
      console.log(`   ❌ ${gap.productType} > ${gap.sectionName} > ${gap.subSkill}: ${gap.current}/${gap.target}`);
    }

    if (finalGaps.length > 10) {
      console.log(`   ... and ${finalGaps.length - 10} more`);
    }
  }
}

// Run the script
generateMissingDrills()
  .then(() => {
    console.log('\n✅ Script completed successfully\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
