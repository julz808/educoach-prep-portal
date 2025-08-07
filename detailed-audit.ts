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

async function detailedAudit() {
  console.log('Running detailed audit...\n');
  
  // Get all unique test types from database
  const { data: allQuestions } = await supabase
    .from('questions')
    .select('test_type, test_mode, section_name');
    
  if (!allQuestions) {
    console.log('No data found');
    return;
  }
  
  // Build counts map
  const counts = new Map<string, number>();
  for (const q of allQuestions) {
    const key = `${q.test_type}|${q.test_mode}|${q.section_name}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  
  console.log('=== DETAILED QUESTION AUDIT ===\n');
  
  // Check each test from CurriculumData
  for (const testProduct of Object.keys(TEST_STRUCTURES)) {
    console.log(`\n📚 ${testProduct}`);
    console.log('=' .repeat(60));
    
    const sections = TEST_STRUCTURES[testProduct as keyof typeof TEST_STRUCTURES];
    
    for (const section of Object.keys(sections)) {
      console.log(`\n  📖 ${section}`);
      
      const sectionData = sections[section as keyof typeof sections];
      const expectedQuestions = sectionData.questions;
      const sectionKey = `${testProduct} - ${section}`;
      const subSkills = SECTION_TO_SUB_SKILLS[sectionKey as keyof typeof SECTION_TO_SUB_SKILLS] || [];
      
      // Calculate expected drill questions
      let expectedDrillQuestions: number;
      if (section.toLowerCase().includes('writing') || section.toLowerCase().includes('written')) {
        expectedDrillQuestions = subSkills.length * 6;
      } else {
        expectedDrillQuestions = subSkills.length * 30;
      }
      
      // Check each test mode
      const modes = ['diagnostic', 'practice_1', 'practice_2', 'practice_3', 'practice_4', 'practice_5', 'drill'];
      
      let hasAnyQuestions = false;
      for (const mode of modes) {
        const key = `${testProduct}|${mode}|${section}`;
        const actual = counts.get(key) || 0;
        
        const expected = mode === 'drill' ? expectedDrillQuestions : expectedQuestions;
        const diff = actual - expected;
        
        if (actual > 0) {
          hasAnyQuestions = true;
          let status = '';
          if (diff > 0) {
            status = `⚠️  TOO MANY (+${diff})`;
          } else if (diff < 0) {
            status = `⚠️  TOO FEW (${diff})`;
          } else {
            status = '✅ CORRECT';
          }
          
          console.log(`    ${mode.padEnd(12)}: ${actual.toString().padStart(4)} / ${expected.toString().padStart(4)} ${status}`);
        }
      }
      
      if (!hasAnyQuestions) {
        console.log(`    ❌ NO QUESTIONS FOUND FOR ANY MODE`);
      }
    }
  }
  
  // Show what's actually in the database that might not match
  console.log('\n\n=== UNMATCHED DATABASE ENTRIES ===\n');
  
  const expectedKeys = new Set<string>();
  for (const testProduct of Object.keys(TEST_STRUCTURES)) {
    const sections = TEST_STRUCTURES[testProduct as keyof typeof TEST_STRUCTURES];
    for (const section of Object.keys(sections)) {
      for (const mode of ['diagnostic', 'practice_1', 'practice_2', 'practice_3', 'practice_4', 'practice_5', 'drill']) {
        expectedKeys.add(`${testProduct}|${mode}|${section}`);
      }
    }
  }
  
  // Find entries in database that don't match our expected structure
  const unmatchedEntries = new Map<string, number>();
  for (const [key, count] of counts.entries()) {
    if (!expectedKeys.has(key)) {
      unmatchedEntries.set(key, count);
    }
  }
  
  if (unmatchedEntries.size > 0) {
    console.log('Found questions that don\'t match expected test/section names:\n');
    for (const [key, count] of unmatchedEntries.entries()) {
      const [test, mode, section] = key.split('|');
      console.log(`  ${test} - ${section} - ${mode}: ${count} questions`);
    }
  }
  
  process.exit(0);
}

detailedAudit().catch(console.error);