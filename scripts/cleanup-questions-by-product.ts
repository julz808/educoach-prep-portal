#!/usr/bin/env tsx

// ============================================================================
// QUESTION CLEANUP SCRIPT
// ============================================================================
// Safely removes questions by product, section, or test mode
// with comprehensive logging and safety checks

import { config } from 'dotenv';
config();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface CleanupOptions {
  testType: string;
  sectionName?: string;
  testMode?: string;
  dryRun?: boolean;
  batchSize?: number;
}

interface CleanupResult {
  found: number;
  deleted: number;
  errors: string[];
  duration: number;
}

/**
 * Main cleanup function with comprehensive safety checks
 */
export async function cleanupQuestions(options: CleanupOptions): Promise<CleanupResult> {
  const startTime = Date.now();
  const result: CleanupResult = {
    found: 0,
    deleted: 0,
    errors: [],
    duration: 0
  };
  
  console.log(`🧹 QUESTION CLEANUP TOOL`);
  console.log(`========================`);
  console.log(`Test Type: ${options.testType}`);
  if (options.sectionName) console.log(`Section: ${options.sectionName}`);
  if (options.testMode) console.log(`Test Mode: ${options.testMode}`);
  console.log(`Mode: ${options.dryRun ? 'DRY RUN (no deletion)' : 'LIVE DELETION'}`);
  console.log(`Started: ${new Date().toISOString()}`);
  console.log('');
  
  try {
    // Step 1: Build query to find questions
    let query = supabase
      .from('questions')
      .select('id, question_text, test_mode, section_name, sub_skill, difficulty, created_at')
      .eq('test_type', options.testType);
    
    if (options.sectionName) {
      query = query.eq('section_name', options.sectionName);
    }
    
    if (options.testMode) {
      query = query.eq('test_mode', options.testMode);
    }
    
    // Step 2: Fetch questions to be deleted
    console.log('🔍 Finding questions to cleanup...');
    const { data: questionsToDelete, error: fetchError } = await query;
    
    if (fetchError) {
      result.errors.push(`Failed to fetch questions: ${fetchError.message}`);
      return result;
    }
    
    result.found = questionsToDelete?.length || 0;
    console.log(`📊 Found ${result.found} questions to process`);
    
    if (result.found === 0) {
      console.log('✅ No questions found matching criteria - nothing to cleanup');
      result.duration = Date.now() - startTime;
      return result;
    }
    
    // Step 3: Show breakdown of what will be deleted
    console.log('\n📋 BREAKDOWN OF QUESTIONS TO BE PROCESSED:');
    const breakdown = analyzeQuestionsBreakdown(questionsToDelete || []);
    
    Object.entries(breakdown.byTestMode).forEach(([mode, count]) => {
      console.log(`   ${mode}: ${count} questions`);
    });
    
    console.log('\nBy Section:');
    Object.entries(breakdown.bySection).forEach(([section, count]) => {
      console.log(`   ${section}: ${count} questions`);
    });
    
    console.log('\nBy Sub-Skill:');
    Object.entries(breakdown.bySubSkill).forEach(([subSkill, count]) => {
      console.log(`   ${subSkill}: ${count} questions`);
    });
    
    // Step 4: Safety confirmation for live runs
    if (!options.dryRun) {
      console.log('\n⚠️  WARNING: This will permanently delete questions from the database!');
      console.log('   - User progress referencing these questions may be affected');
      console.log('   - This action cannot be undone');
      console.log('   - Consider running with dryRun: true first');
      console.log('');
    }
    
    if (options.dryRun) {
      console.log('🔍 DRY RUN MODE - No questions will be deleted');
      console.log('   This is a preview of what would be deleted in live mode');
      result.duration = Date.now() - startTime;
      return result;
    }
    
    // Step 5: Perform deletion in batches
    console.log(`\n🗑️  Starting deletion process...`);
    const batchSize = options.batchSize || 100;
    let deletedCount = 0;
    
    for (let i = 0; i < result.found; i += batchSize) {
      const batch = questionsToDelete!.slice(i, i + batchSize);
      const batchIds = batch.map(q => q.id);
      
      console.log(`   Processing batch ${Math.ceil((i + 1) / batchSize)} of ${Math.ceil(result.found / batchSize)} (${batch.length} questions)...`);
      
      try {
        const { error: deleteError } = await supabase
          .from('questions')
          .delete()
          .in('id', batchIds);
        
        if (deleteError) {
          const errorMsg = `Batch ${Math.ceil((i + 1) / batchSize)} failed: ${deleteError.message}`;
          result.errors.push(errorMsg);
          console.error(`   ❌ ${errorMsg}`);
          continue;
        }
        
        deletedCount += batch.length;
        result.deleted = deletedCount;
        
        const progress = Math.round((deletedCount / result.found) * 100);
        console.log(`   ✅ Batch completed (${deletedCount}/${result.found} - ${progress}%)`);
        
        // Brief pause between batches to avoid overwhelming the database
        if (i + batchSize < result.found) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
      } catch (error) {
        const errorMsg = `Unexpected error in batch ${Math.ceil((i + 1) / batchSize)}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        result.errors.push(errorMsg);
        console.error(`   ❌ ${errorMsg}`);
      }
    }
    
    result.duration = Date.now() - startTime;
    
    // Step 6: Summary report
    console.log('\n📊 CLEANUP SUMMARY:');
    console.log(`   Questions Found: ${result.found}`);
    console.log(`   Questions Deleted: ${result.deleted}`);
    console.log(`   Success Rate: ${result.found > 0 ? Math.round((result.deleted / result.found) * 100) : 0}%`);
    console.log(`   Duration: ${Math.round(result.duration / 1000)}s`);
    console.log(`   Errors: ${result.errors.length}`);
    
    if (result.errors.length > 0) {
      console.log('\n❌ ERRORS ENCOUNTERED:');
      result.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    if (result.deleted === result.found && result.errors.length === 0) {
      console.log('\n🎉 Cleanup completed successfully!');
    } else if (result.deleted > 0) {
      console.log('\n⚠️  Cleanup completed with some issues - see errors above');
    } else {
      console.log('\n❌ Cleanup failed - no questions were deleted');
    }
    
  } catch (error) {
    const errorMsg = `Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    result.errors.push(errorMsg);
    console.error(`❌ ${errorMsg}`);
  }
  
  result.duration = Date.now() - startTime;
  return result;
}

/**
 * Analyze questions to provide detailed breakdown
 */
function analyzeQuestionsBreakdown(questions: any[]): {
  byTestMode: Record<string, number>;
  bySection: Record<string, number>;
  bySubSkill: Record<string, number>;
  byDifficulty: Record<string, number>;
} {
  
  const breakdown = {
    byTestMode: {} as Record<string, number>,
    bySection: {} as Record<string, number>,
    bySubSkill: {} as Record<string, number>,
    byDifficulty: {} as Record<string, number>
  };
  
  questions.forEach(question => {
    // Count by test mode
    const testMode = question.test_mode || 'unknown';
    breakdown.byTestMode[testMode] = (breakdown.byTestMode[testMode] || 0) + 1;
    
    // Count by section
    const section = question.section_name || 'unknown';
    breakdown.bySection[section] = (breakdown.bySection[section] || 0) + 1;
    
    // Count by sub-skill
    const subSkill = question.sub_skill || 'unknown';
    breakdown.bySubSkill[subSkill] = (breakdown.bySubSkill[subSkill] || 0) + 1;
    
    // Count by difficulty
    const difficulty = `Level ${question.difficulty || 'unknown'}`;
    breakdown.byDifficulty[difficulty] = (breakdown.byDifficulty[difficulty] || 0) + 1;
  });
  
  return breakdown;
}

/**
 * Command-line interface
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
🧹 QUESTION CLEANUP TOOL

Usage: npm run cleanup-questions -- --test-type "Test Type" [options]

Required:
  --test-type          Test type to cleanup (e.g., "EduTest Scholarship (Year 7 Entry)")

Optional:
  --section           Specific section to cleanup
  --test-mode         Specific test mode to cleanup (practice_1, drill, diagnostic, etc.)
  --dry-run           Preview what would be deleted without actually deleting
  --batch-size        Number of questions to delete per batch (default: 100)

Examples:
  # Preview cleanup for entire EduTest product
  npm run cleanup-questions -- --test-type "EduTest Scholarship (Year 7 Entry)" --dry-run

  # Cleanup only Verbal Reasoning section
  npm run cleanup-questions -- --test-type "EduTest Scholarship (Year 7 Entry)" --section "Verbal Reasoning"

  # Cleanup only drill questions
  npm run cleanup-questions -- --test-type "EduTest Scholarship (Year 7 Entry)" --test-mode "drill"

Available Test Types:
  - "EduTest Scholarship (Year 7 Entry)"
  - "ACER Scholarship (Year 7 Entry)"
  - "VIC Selective Entry (Year 9 Entry)"
  - "NSW Selective Entry (Year 7 Entry)"
  - "Year 5 NAPLAN"
  - "Year 7 NAPLAN"
`);
    process.exit(0);
  }
  
  // Parse command line arguments
  const options: CleanupOptions = {
    testType: '',
    dryRun: false,
    batchSize: 100
  };
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--test-type':
        options.testType = args[++i];
        break;
      case '--section':
        options.sectionName = args[++i];
        break;
      case '--test-mode':
        options.testMode = args[++i];
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--batch-size':
        options.batchSize = parseInt(args[++i]);
        break;
    }
  }
  
  // Validate required arguments
  if (!options.testType) {
    console.error('❌ Error: --test-type is required');
    console.log('Use --help for usage information');
    process.exit(1);
  }
  
  // Run cleanup
  const result = await cleanupQuestions(options);
  
  // Exit with appropriate code
  process.exit(result.errors.length > 0 ? 1 : 0);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}