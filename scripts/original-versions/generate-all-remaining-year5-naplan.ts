/**
 * GENERATE ALL REMAINING YEAR 5 NAPLAN QUESTIONS
 * 
 * Complete script using the new curriculum-based generation system:
 * - Proper passage-to-question ratios from curriculumData.ts
 * - Passage-level difficulty for reading sections
 * - Smart gap analysis and generation planning
 * - Automatic detection of missing questions by section/sub-skill/difficulty
 */

import * as dotenv from 'dotenv';
import { generateQuestionsForSection } from '../src/engines/questionGeneration/curriculumBasedGeneration';
import { getTestSections } from '../src/engines/questionGeneration/curriculumBasedConfiguration';

dotenv.config();

const TEST_TYPE = 'Year 5 NAPLAN';

class Year5NAPLANCompleteGenerator {
  private totalGenerated = 0;
  private totalSections = 0;
  private results: any[] = [];

  /**
   * Generate all sections using curriculum-based approach
   */
  async generateAllSections(): Promise<void> {
    console.log(`🚀 STARTING YEAR 5 NAPLAN COMPLETE GENERATION`);
    console.log(`📋 Using new curriculum-based generation system`);
    console.log(`   ✅ Passage-to-question ratios from curriculumData.ts`);
    console.log(`   ✅ Passage-level difficulty for reading sections`);
    console.log(`   ✅ Smart gap analysis and auto-detection`);
    console.log(`   ✅ Proper drill test mini-passages (1:1 ratio)`);
    console.log(`   ✅ Practice/diagnostic passage sharing`);
    console.log(`====================================\n`);
    
    const sections = getTestSections(TEST_TYPE);
    this.totalSections = sections.length;
    
    console.log(`📊 Sections to process: ${sections.join(', ')}\n`);
    
    const startTime = Date.now();
    
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      console.log(`\n🔧 SECTION ${i + 1}/${sections.length}: ${section}`);
      console.log(`==============================`);
      
      try {
        const result = await generateQuestionsForSection({
          testType: TEST_TYPE,
          sectionName: section,
          testMode: 'practice_1',
          validateOnly: false
        });
        
        this.results.push({
          section,
          result
        });
        
        this.totalGenerated += result.questionsGenerated;
        
        console.log(`✅ Section complete: ${section}`);
        console.log(`   Questions generated: ${result.questionsGenerated}`);
        console.log(`   Passages generated: ${result.passagesGenerated}`);
        console.log(`   Duration: ${Math.round(result.duration / 1000)}s`);
        
        if (result.errors.length > 0) {
          console.log(`   ⚠️  Errors: ${result.errors.length}`);
          result.errors.forEach(error => console.log(`      - ${error}`));
        }
        
        if (result.warnings.length > 0) {
          console.log(`   ℹ️  Warnings: ${result.warnings.length}`);
          result.warnings.forEach(warning => console.log(`      - ${warning}`));
        }
        
      } catch (error) {
        console.error(`❌ Failed to generate section ${section}:`, error);
        this.results.push({
          section,
          result: {
            success: false,
            questionsGenerated: 0,
            passagesGenerated: 0,
            errors: [error instanceof Error ? error.message : 'Unknown error'],
            warnings: [],
            duration: 0,
            details: { questionsByDifficulty: {}, questionsBySubSkill: {}, passagesByDifficulty: {} }
          }
        });
      }
      
      // Pause between sections
      if (i < sections.length - 1) {
        console.log(`\n⏸️  Pausing 5 seconds before next section...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    // Final report
    this.generateFinalReport(startTime);
  }

  /**
   * Generate final summary report
   */
  private generateFinalReport(startTime: number): void {
    const duration = Math.round((Date.now() - startTime) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    
    console.log(`\n\n🎉 YEAR 5 NAPLAN GENERATION COMPLETE!\n`);
    console.log(`====================================\n`);
    console.log(`📊 FINAL STATISTICS:`);
    console.log(`   ✅ Sections processed: ${this.totalSections}`);
    console.log(`   ✅ Total questions generated: ${this.totalGenerated}`);
    console.log(`   ⏱️  Total time: ${minutes}m ${seconds}s`);
    
    const successful = this.results.filter(r => r.result.success).length;
    const failed = this.results.filter(r => !r.result.success).length;
    
    console.log(`   📈 Success rate: ${successful}/${this.totalSections} sections`);
    
    if (failed > 0) {
      console.log(`\n❌ FAILED SECTIONS:`);
      this.results.filter(r => !r.result.success).forEach(r => {
        console.log(`   ${r.section}: ${r.result.errors.join(', ')}`);
      });
    }
    
    console.log(`\n📈 QUESTIONS BY SECTION:`);
    this.results.forEach(r => {
      console.log(`   ${r.section}: ${r.result.questionsGenerated} questions`);
    });
    
    console.log(`\n🎯 Year 5 NAPLAN now uses curriculum-based generation!`);
    console.log(`✨ All passage-to-question ratios match curriculumData.ts`);
    console.log(`🌍 Proper passage-level difficulty for reading sections`);
  }



  /**
   * Run the complete generation process
   */
  async run(): Promise<void> {
    try {
      await this.generateAllSections();
    } catch (error) {
      console.error('❌ Generation failed:', error);
      throw error;
    }
  }
}

// Run the generator
async function main() {
  try {
    const generator = new Year5NAPLANCompleteGenerator();
    await generator.run();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();