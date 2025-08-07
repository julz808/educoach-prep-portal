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

interface QuestionCount {
  test_type: string;
  test_mode: string;
  section_name: string;
  question_count: number;
}

async function auditQuestions() {
  console.log('Fetching question counts from database...\n');
  
  // Get all questions with the columns we need
  const { data, error } = await supabase
    .from('questions')
    .select('test_type, test_mode, section_name')
    .order('test_type')
    .order('test_mode')
    .order('section_name');

  if (error) {
    console.error('Error fetching questions:', error);
    return;
  }

  // Count questions manually since Supabase doesn't support GROUP BY with COUNT easily
  const counts: Map<string, number> = new Map();
  
  for (const row of data || []) {
    const key = `${row.test_type}|${row.test_mode}|${row.section_name}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  // Convert to array format
  const questionCounts: QuestionCount[] = [];
  for (const [key, count] of counts.entries()) {
    const [test_type, test_mode, section_name] = key.split('|');
    questionCounts.push({ test_type, test_mode, section_name, question_count: count });
  }

  console.log('=== QUESTION AUDIT REPORT ===\n');
  
  // Analyze each test product
  for (const testProduct of Object.keys(TEST_STRUCTURES)) {
    console.log(`\n📚 ${testProduct}`);
    console.log('=' .repeat(60));
    
    const sections = TEST_STRUCTURES[testProduct as keyof typeof TEST_STRUCTURES];
    
    for (const section of Object.keys(sections)) {
      console.log(`\n  📖 ${section}`);
      console.log('  ' + '-'.repeat(40));
      
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
        const actual = questionCounts.find(
          q => q.test_type === testProduct && 
               q.test_mode === mode && 
               q.section_name === section
        )?.question_count || 0;
        
        const expected = mode === 'drill' ? expectedDrillQuestions : expectedQuestions;
        const diff = actual - expected;
        
        let status = '';
        if (actual === 0) {
          status = '❌ MISSING';
        } else if (diff > 0) {
          status = `⚠️  TOO MANY (+${diff})`;
        } else if (diff < 0) {
          status = `⚠️  TOO FEW (${diff})`;
        } else {
          status = '✅ CORRECT';
        }
        
        if (status !== '✅ CORRECT') {
          console.log(`    ${mode.padEnd(12)}: ${actual.toString().padStart(4)} / ${expected.toString().padStart(4)} ${status}`);
        }
      }
    }
  }

  console.log('\n\n=== SUMMARY ===\n');
  
  // Generate summary statistics
  let totalMissing = 0;
  let totalOverProvisioned = 0;
  let totalUnderProvisioned = 0;
  
  for (const testProduct of Object.keys(TEST_STRUCTURES)) {
    const sections = TEST_STRUCTURES[testProduct as keyof typeof TEST_STRUCTURES];
    
    for (const section of Object.keys(sections)) {
      const sectionData = sections[section as keyof typeof sections];
      const expectedQuestions = sectionData.questions;
      const sectionKey = `${testProduct} - ${section}`;
      const subSkills = SECTION_TO_SUB_SKILLS[sectionKey as keyof typeof SECTION_TO_SUB_SKILLS] || [];
      
      let expectedDrillQuestions: number;
      if (section.toLowerCase().includes('writing') || section.toLowerCase().includes('written')) {
        expectedDrillQuestions = subSkills.length * 6;
      } else {
        expectedDrillQuestions = subSkills.length * 30;
      }
      
      const modes = ['diagnostic', 'practice_1', 'practice_2', 'practice_3', 'practice_4', 'practice_5', 'drill'];
      
      for (const mode of modes) {
        const actual = questionCounts.find(
          q => q.test_type === testProduct && 
               q.test_mode === mode && 
               q.section_name === section
        )?.question_count || 0;
        
        const expected = mode === 'drill' ? expectedDrillQuestions : expectedQuestions;
        
        if (actual === 0) {
          totalMissing++;
        } else if (actual > expected) {
          totalOverProvisioned++;
        } else if (actual < expected) {
          totalUnderProvisioned++;
        }
      }
    }
  }
  
  console.log(`Total Missing Combinations: ${totalMissing}`);
  console.log(`Total Over-Provisioned: ${totalOverProvisioned}`);
  console.log(`Total Under-Provisioned: ${totalUnderProvisioned}`);
  
  process.exit(0);
}

auditQuestions().catch(console.error);