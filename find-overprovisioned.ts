import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { TEST_STRUCTURES, SECTION_TO_SUB_SKILLS } from './src/data/CurriculumData';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = 'https://mcxxiunseawojmojikvb.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

async function findOverprovisioned() {
  console.log('Finding over-provisioned test/section combinations...\n');
  
  // Get ALL questions from database
  const { data: allQuestions, error } = await supabase
    .from('questions')
    .select('test_type, test_mode, section_name');
    
  if (error || !allQuestions) {
    console.error('Error fetching questions:', error);
    return;
  }
  
  // Build counts map
  const counts = new Map<string, number>();
  for (const q of allQuestions) {
    const key = `${q.test_type}|${q.test_mode}|${q.section_name}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  
  console.log('=== OVER-PROVISIONED QUESTIONS (TOO MANY) ===\n');
  
  const overProvisionedList: any[] = [];
  
  // Check each test from CurriculumData
  for (const testProduct of Object.keys(TEST_STRUCTURES)) {
    const sections = TEST_STRUCTURES[testProduct as keyof typeof TEST_STRUCTURES];
    
    for (const section of Object.keys(sections)) {
      const sectionData = sections[section as keyof typeof sections];
      const expectedQuestions = sectionData.questions;
      const sectionKey = `${testProduct} - ${section}`;
      const subSkills = SECTION_TO_SUB_SKILLS[sectionKey as keyof typeof SECTION_TO_SUB_SKILLS] || [];
      
      // Calculate expected drill questions
      let expectedDrillQuestions: number;
      if (section.toLowerCase().includes('writing') || section.toLowerCase().includes('written')) {
        expectedDrillQuestions = subSkills.length * 6; // 6 per sub-skill for writing
      } else {
        expectedDrillQuestions = subSkills.length * 30; // 30 per sub-skill for academic
      }
      
      // Check each test mode
      const modes = ['diagnostic', 'practice_1', 'practice_2', 'practice_3', 'practice_4', 'practice_5', 'drill'];
      
      for (const mode of modes) {
        const key = `${testProduct}|${mode}|${section}`;
        const actual = counts.get(key) || 0;
        
        const expected = mode === 'drill' ? expectedDrillQuestions : expectedQuestions;
        const excess = actual - expected;
        
        if (excess > 0) {
          overProvisionedList.push({
            test_type: testProduct,
            test_mode: mode,
            section_name: section,
            actual_count: actual,
            expected_count: expected,
            excess_count: excess
          });
        }
      }
    }
  }
  
  // Sort by excess count (highest first)
  overProvisionedList.sort((a, b) => b.excess_count - a.excess_count);
  
  if (overProvisionedList.length === 0) {
    console.log('No over-provisioned sections found based on exact name matching.');
    console.log('\nChecking for potential mismatches in naming...\n');
    
    // Check what's in database that doesn't match expected structure
    const expectedKeys = new Set<string>();
    const modes = ['diagnostic', 'practice_1', 'practice_2', 'practice_3', 'practice_4', 'practice_5', 'drill'];
    
    for (const testProduct of Object.keys(TEST_STRUCTURES)) {
      const sections = TEST_STRUCTURES[testProduct as keyof typeof TEST_STRUCTURES];
      for (const section of Object.keys(sections)) {
        for (const mode of modes) {
          expectedKeys.add(`${testProduct}|${mode}|${section}`);
        }
      }
    }
    
    console.log('=== UNMATCHED DATABASE ENTRIES (potential over-provisioning) ===\n');
    const unmatchedList: any[] = [];
    
    for (const [key, count] of counts.entries()) {
      if (!expectedKeys.has(key) && count > 0) {
        const [test_type, test_mode, section_name] = key.split('|');
        unmatchedList.push({
          test_type,
          test_mode,
          section_name,
          actual_count: count
        });
      }
    }
    
    // Sort by count (highest first)
    unmatchedList.sort((a, b) => b.actual_count - a.actual_count);
    
    if (unmatchedList.length > 0) {
      console.log('Test Type'.padEnd(40) + 'Mode'.padEnd(15) + 'Section'.padEnd(30) + 'Count');
      console.log('='.repeat(95));
      
      for (const item of unmatchedList) {
        console.log(
          item.test_type.padEnd(40) +
          item.test_mode.padEnd(15) +
          item.section_name.padEnd(30) +
          item.actual_count
        );
      }
      
      console.log(`\nTotal unmatched entries: ${unmatchedList.length}`);
      console.log(`Total unmatched questions: ${unmatchedList.reduce((sum, item) => sum + item.actual_count, 0)}`);
    }
    
  } else {
    console.log('Test Type'.padEnd(40) + 'Mode'.padEnd(15) + 'Section'.padEnd(30) + 'Actual Expected Excess');
    console.log('='.repeat(110));
    
    for (const item of overProvisionedList) {
      console.log(
        item.test_type.padEnd(40) +
        item.test_mode.padEnd(15) +
        item.section_name.padEnd(30) +
        item.actual_count.toString().padEnd(7) +
        item.expected_count.toString().padEnd(9) +
        `+${item.excess_count}`
      );
    }
    
    console.log(`\nTotal over-provisioned combinations: ${overProvisionedList.length}`);
    console.log(`Total excess questions: ${overProvisionedList.reduce((sum, item) => sum + item.excess_count, 0)}`);
  }
  
  // Also check for Writing sections specifically
  console.log('\n\n=== WRITING SECTION ANALYSIS ===\n');
  
  const writingSections = [
    'Writing', 
    'Written Expression',
    'Creative Writing',
    'Narrative Writing',
    'Persuasive Writing'
  ];
  
  for (const section of writingSections) {
    const { data: writingQuestions } = await supabase
      .from('questions')
      .select('test_type, test_mode, section_name')
      .ilike('section_name', `%${section}%`);
      
    if (writingQuestions && writingQuestions.length > 0) {
      const writingCounts = new Map<string, number>();
      for (const q of writingQuestions) {
        const key = `${q.test_type}|${q.test_mode}|${q.section_name}`;
        writingCounts.set(key, (writingCounts.get(key) || 0) + 1);
      }
      
      console.log(`\nFound ${writingQuestions.length} questions with "${section}" in section name:`);
      for (const [key, count] of writingCounts.entries()) {
        const [test_type, test_mode, section_name] = key.split('|');
        if (count > 2) { // Writing sections typically should have 1-2 questions max for non-drill modes
          console.log(`  ⚠️  ${test_type} - ${test_mode} - ${section_name}: ${count} questions (likely over-provisioned)`);
        }
      }
    }
  }
  
  process.exit(0);
}

findOverprovisioned().catch(console.error);