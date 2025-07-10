/**
 * FIXED EDUTEST GENERATION WITH PROPER QUOTA LIMITS
 * 
 * This version implements proper quota distribution to prevent over-generation
 */

import * as dotenv from 'dotenv';
import { supabase } from '../src/integrations/supabase/client';
import { TEST_STRUCTURES } from '../src/data/curriculumData';

dotenv.config();

const TEST_TYPE = 'EduTest Scholarship (Year 7 Entry)';

// Proper quota distribution per test mode
const PROPER_QUOTAS = {
  "Reading Comprehension": {
    practice_1: 6, practice_2: 6, practice_3: 6, practice_4: 6, practice_5: 6,
    diagnostic: 10, drill: 10
  },
  "Verbal Reasoning": {
    practice_1: 7, practice_2: 7, practice_3: 7, practice_4: 7, practice_5: 7,
    diagnostic: 12, drill: 13
  },
  "Numerical Reasoning": {
    practice_1: 6, practice_2: 6, practice_3: 6, practice_4: 6, practice_5: 6,
    diagnostic: 10, drill: 10
  },
  "Mathematics": {
    practice_1: 7, practice_2: 7, practice_3: 7, practice_4: 7, practice_5: 7,
    diagnostic: 12, drill: 13
  },
  "Written Expression": {
    practice_1: 0, practice_2: 0, practice_3: 0, practice_4: 0, practice_5: 0,
    diagnostic: 0, drill: 2
  }
};

class FixedEduTestGenerator {
  
  /**
   * Check if a section/mode is already at or over quota
   */
  async checkQuota(sectionName: string, testMode: string): Promise<{
    current: number;
    quota: number;
    isOverQuota: boolean;
    needsGeneration: boolean;
  }> {
    const { data: questions, error } = await supabase
      .from('questions')
      .select('id')
      .eq('test_type', TEST_TYPE)
      .eq('section_name', sectionName)
      .eq('test_mode', testMode);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    const current = questions?.length || 0;
    const quota = PROPER_QUOTAS[sectionName as keyof typeof PROPER_QUOTAS][testMode as keyof typeof PROPER_QUOTAS['Reading Comprehension']];
    const isOverQuota = current >= quota;
    const needsGeneration = current < quota;

    return { current, quota, isOverQuota, needsGeneration };
  }

  /**
   * Audit all sections and show quota status
   */
  async auditAllSections(): Promise<void> {
    console.log('🔍 EDUTEST QUOTA AUDIT - WITH PROPER LIMITS');
    console.log('===========================================\n');

    const sections = Object.keys(PROPER_QUOTAS);
    const testModes = ['practice_1', 'practice_2', 'practice_3', 'practice_4', 'practice_5', 'diagnostic', 'drill'];

    for (const section of sections) {
      console.log(`📝 ${section}:`);
      
      let sectionTotal = 0;
      let sectionQuota = 0;
      
      for (const mode of testModes) {
        const status = await this.checkQuota(section, mode);
        sectionTotal += status.current;
        sectionQuota += status.quota;
        
        const statusIcon = status.isOverQuota ? '🔴 OVER' : status.needsGeneration ? '⚠️ UNDER' : '✅ OK';
        console.log(`   ${mode}: ${status.current}/${status.quota} ${statusIcon}`);
      }
      
      const curriculumTotal = TEST_STRUCTURES[TEST_TYPE][section].questions;
      const totalStatus = sectionTotal > curriculumTotal ? '🔴 OVER TOTAL' : sectionTotal === curriculumTotal ? '✅ COMPLETE' : '⚠️ UNDER TOTAL';
      console.log(`   TOTAL: ${sectionTotal}/${curriculumTotal} ${totalStatus}\n`);
    }
  }

  /**
   * Generate only what's needed (respecting quotas)
   */
  async generateWithQuotaLimits(): Promise<void> {
    console.log('🚀 STARTING QUOTA-LIMITED GENERATION');
    console.log('====================================\n');

    const sections = Object.keys(PROPER_QUOTAS);
    const testModes = ['practice_1', 'practice_2', 'practice_3', 'practice_4', 'practice_5', 'diagnostic', 'drill'];

    let totalGenerated = 0;
    let totalSkipped = 0;

    for (const section of sections) {
      console.log(`🔧 CHECKING: ${section}`);
      
      for (const mode of testModes) {
        const status = await this.checkQuota(section, mode);
        
        if (status.isOverQuota) {
          console.log(`   ⏭️  SKIPPING ${mode}: Already at quota (${status.current}/${status.quota})`);
          totalSkipped++;
        } else if (status.needsGeneration) {
          const needed = status.quota - status.current;
          console.log(`   📝 WOULD GENERATE ${mode}: ${needed} questions needed (${status.current}/${status.quota})`);
          // TODO: Implement actual generation here with proper limits
          totalGenerated += needed;
        } else {
          console.log(`   ✅ ${mode}: At quota (${status.current}/${status.quota})`);
        }
      }
      console.log('');
    }

    console.log(`📊 SUMMARY:`);
    console.log(`   Would generate: ${totalGenerated} questions`);
    console.log(`   Skipped (over quota): ${totalSkipped} test modes`);
    console.log(`\n⚠️  GENERATION DISABLED TO PREVENT OVER-QUOTA`);
    console.log(`   Fix the gap analysis first, then enable generation.`);
  }

  async run(): Promise<void> {
    await this.auditAllSections();
    await this.generateWithQuotaLimits();
  }
}

// Run the fixed generator
async function main() {
  try {
    const generator = new FixedEduTestGenerator();
    await generator.run();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();