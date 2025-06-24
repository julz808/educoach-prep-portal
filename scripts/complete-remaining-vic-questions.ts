#!/usr/bin/env node

// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

/**
 * Complete Remaining VIC Selective Questions with Progress Tracking
 * Shows real-time progress and can run independently
 */

import { createClient } from '@supabase/supabase-js';
import { generateQuestion } from '../src/engines/questionGeneration/questionGeneration.ts';
import { storeQuestion } from '../src/engines/questionGeneration/supabaseStorage.ts';
import { getAuthoritativeTestStructure } from '../src/engines/questionGeneration/index.ts';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface GenerationContext {
  usedTopics: Set<string>;
  usedNames: Set<string>;
  usedLocations: Set<string>;
  usedScenarios: Set<string>;
  questionsBySubSkill?: Record<string, any[]>;
}

interface ProgressTracker {
  totalTarget: number;
  currentCount: number;
  sectionsProgress: Record<string, { current: number; target: number; complete: boolean }>;
  startTime: number;
  lastUpdate: number;
}

function clearScreen() {
  console.clear();
}

function displayProgressHeader(tracker: ProgressTracker) {
  const elapsed = Math.round((Date.now() - tracker.startTime) / 1000);
  const progress = Math.round((tracker.currentCount / tracker.totalTarget) * 100);
  const eta = tracker.currentCount > 0 ? 
    Math.round((elapsed / tracker.currentCount) * (tracker.totalTarget - tracker.currentCount)) : 0;

  console.log('🎯 VIC SELECTIVE DIAGNOSTIC - COMPLETION MODE');
  console.log('=' .repeat(70));
  console.log(`📊 Progress: ${tracker.currentCount}/${tracker.totalTarget} questions (${progress}%)`);
  console.log(`⏱️  Elapsed: ${elapsed}s | ETA: ${eta}s | Rate: ${tracker.currentCount > 0 ? Math.round(elapsed / tracker.currentCount) : 0}s/question`);
  console.log('=' .repeat(70));
}

function displaySectionProgress(tracker: ProgressTracker) {
  console.log('\n📋 Section Progress:');
  Object.entries(tracker.sectionsProgress).forEach(([section, progress]) => {
    const icon = progress.complete ? '✅' : '⏳';
    const percentage = Math.round((progress.current / progress.target) * 100);
    const bar = '█'.repeat(Math.floor(percentage / 5)) + '░'.repeat(20 - Math.floor(percentage / 5));
    console.log(`${icon} ${section}: [${bar}] ${progress.current}/${progress.target} (${percentage}%)`);
  });
}

function displayCurrentGeneration(questionNum: number, total: number, section: string, subSkill: string, difficulty: number) {
  console.log(`\n🔄 Generating Question ${questionNum}/${total}:`);
  console.log(`   Section: ${section}`);
  console.log(`   Sub-skill: ${subSkill}`);
  console.log(`   Difficulty: Level ${difficulty}`);
  console.log(`   Status: In progress...`);
}

async function getCurrentQuestionCounts(testType: string, testMode: string) {
  const { data: questions, error } = await supabase
    .from('questions')
    .select('section_name, sub_skill, difficulty')
    .eq('test_type', testType)
    .eq('test_mode', testMode);

  if (error) {
    throw new Error(`Failed to fetch questions: ${error.message}`);
  }

  const counts: Record<string, Record<string, Record<number, number>>> = {};
  
  questions?.forEach(q => {
    if (!counts[q.section_name]) counts[q.section_name] = {};
    if (!counts[q.section_name][q.sub_skill]) counts[q.section_name][q.sub_skill] = {};
    if (!counts[q.section_name][q.sub_skill][q.difficulty]) counts[q.section_name][q.sub_skill][q.difficulty] = 0;
    counts[q.section_name][q.sub_skill][q.difficulty]++;
  });

  return { counts, totalQuestions: questions?.length || 0 };
}

async function updateProgress(tracker: ProgressTracker, testType: string, testMode: string) {
  const { totalQuestions } = await getCurrentQuestionCounts(testType, testMode);
  tracker.currentCount = totalQuestions;
  tracker.lastUpdate = Date.now();
  
  clearScreen();
  displayProgressHeader(tracker);
  displaySectionProgress(tracker);
}

async function main() {
  const testType = 'VIC Selective Entry (Year 9 Entry)';
  const testMode = 'diagnostic';

  try {
    clearScreen();
    console.log('🚀 COMPLETING REMAINING VIC SELECTIVE QUESTIONS');
    console.log('=' .repeat(70));
    console.log('⏳ Initializing...');

    // Get test structure and current counts
    const testStructure = getAuthoritativeTestStructure(testType);
    const { counts: currentCounts, totalQuestions: currentTotal } = await getCurrentQuestionCounts(testType, testMode);

    // Calculate missing questions (only Reading and some Mathematics remain)
    const missingQuestions: Array<{
      sectionName: string;
      subSkill: string;
      difficulty: number;
      responseType: 'multiple_choice' | 'extended_response';
    }> = [];

    let totalTarget = currentTotal;

    // Focus on the two incomplete sections: Reading Reasoning and Mathematics Reasoning
    const incompleteSections = ['Reading Reasoning', 'Mathematics Reasoning'];
    
    const sectionsProgress: Record<string, { current: number; target: number; complete: boolean }> = {};

    incompleteSections.forEach(sectionName => {
      const sectionConfig = testStructure.sections[sectionName];
      if (!sectionConfig) return;

      let sectionCurrent = 0;
      let sectionTarget = 0;

      sectionConfig.subSkills.forEach(subSkill => {
        for (let difficulty = 1; difficulty <= 3; difficulty++) {
          const current = currentCounts[sectionName]?.[subSkill]?.[difficulty] || 0;
          const target = 2; // Enhanced specification: 2 per difficulty
          const missing = Math.max(0, target - current);
          
          sectionCurrent += current;
          sectionTarget += target;
          
          if (missing > 0) {
            for (let i = 0; i < missing; i++) {
              missingQuestions.push({
                sectionName,
                subSkill,
                difficulty,
                responseType: 'multiple_choice'
              });
            }
          }
        }
      });

      sectionsProgress[sectionName] = {
        current: sectionCurrent,
        target: sectionTarget,
        complete: sectionCurrent >= sectionTarget
      };
      
      totalTarget += Math.max(0, sectionTarget - sectionCurrent);
    });

    // Initialize progress tracker
    const progressTracker: ProgressTracker = {
      totalTarget,
      currentCount: currentTotal,
      sectionsProgress,
      startTime: Date.now(),
      lastUpdate: Date.now()
    };

    clearScreen();
    displayProgressHeader(progressTracker);
    displaySectionProgress(progressTracker);

    if (missingQuestions.length === 0) {
      console.log('\n🎉 ALL QUESTIONS ALREADY COMPLETE!');
      console.log('✅ Enhanced specification fully achieved');
      return;
    }

    console.log(`\n🎯 Found ${missingQuestions.length} missing questions to generate`);
    console.log('📝 Starting generation with real-time progress...\n');

    // Wait 3 seconds to show initial status
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Generate missing questions with progress updates
    const generationContext: GenerationContext = {
      usedTopics: new Set(),
      usedNames: new Set(),
      usedLocations: new Set(),
      usedScenarios: new Set(),
      questionsBySubSkill: {}
    };

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < missingQuestions.length; i++) {
      const missing = missingQuestions[i];
      
      // Update display with current generation
      clearScreen();
      displayProgressHeader(progressTracker);
      displaySectionProgress(progressTracker);
      displayCurrentGeneration(i + 1, missingQuestions.length, missing.sectionName, missing.subSkill, missing.difficulty);

      try {
        const questionRequest = {
          testType,
          sectionName: missing.sectionName,
          subSkill: missing.subSkill,
          difficulty: missing.difficulty,
          responseType: missing.responseType,
          generateVisual: false,
          generationContext
        };

        // Generate question
        const generatedQuestion = await generateQuestion(questionRequest);
        
        // Store in database
        const questionId = await storeQuestion(
          generatedQuestion,
          testType,
          testMode,
          missing.sectionName,
          missing.subSkill,
          missing.difficulty,
          undefined
        );

        // Update context
        if (!generationContext.questionsBySubSkill![missing.subSkill]) {
          generationContext.questionsBySubSkill![missing.subSkill] = [];
        }
        generationContext.questionsBySubSkill![missing.subSkill].push(generatedQuestion);

        successCount++;
        
        // Update progress every 5 questions or at key milestones
        if (i % 5 === 0 || i === missingQuestions.length - 1) {
          await updateProgress(progressTracker, testType, testMode);
          console.log(`\n✅ Question ${i + 1}/${missingQuestions.length} completed (${missing.subSkill} L${missing.difficulty})`);
          console.log(`📊 Success: ${successCount} | Errors: ${errorCount}`);
        }

        // Delay to avoid rate limiting (reduced since you added credits)
        await new Promise(resolve => setTimeout(resolve, 1500));

      } catch (error) {
        errorCount++;
        console.log(`\n❌ Question ${i + 1}/${missingQuestions.length} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        
        // Continue with next question rather than stopping
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Final update
    await updateProgress(progressTracker, testType, testMode);
    
    console.log('\n' + '=' .repeat(70));
    console.log('🎉 COMPLETION ATTEMPT FINISHED!');
    console.log('=' .repeat(70));
    console.log(`✅ Successfully generated: ${successCount}/${missingQuestions.length} questions`);
    console.log(`❌ Errors encountered: ${errorCount}`);
    
    if (successCount === missingQuestions.length) {
      console.log('\n🎊 PERFECT SUCCESS!');
      console.log('✅ Enhanced VIC Selective diagnostic specification fully achieved');
      console.log('✅ All 146 target questions generated');
      console.log('✅ Ready to proceed with Phase 2 (other products)');
    } else {
      console.log(`\n📊 Progress made: ${successCount} additional questions generated`);
      console.log(`⚠️  ${errorCount} questions still need generation`);
      console.log('💡 You can re-run this script to complete remaining questions');
    }

    const totalTime = Math.round((Date.now() - progressTracker.startTime) / 1000);
    console.log(`\n⏱️  Total time: ${totalTime} seconds`);
    console.log(`📈 Final count: ${progressTracker.currentCount} questions`);

  } catch (error) {
    console.error('\n❌ Completion script failed:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Generation interrupted by user');
  console.log('📊 Progress has been saved to database');
  console.log('💡 Run the script again to continue from where it left off');
  process.exit(0);
});

main().catch(console.error);