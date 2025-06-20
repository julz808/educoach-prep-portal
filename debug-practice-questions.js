import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugPracticeQuestions() {
  try {
    console.log('🔍 Debugging practice test questions availability...');
    
    // Check all test_mode values in the database
    const { data: allModes, error: modesError } = await supabase
      .from('questions')
      .select('test_mode')
      .eq('product_type', 'VIC Selective Entry (Year 9 Entry)');

    if (modesError) {
      console.error('❌ Error fetching test modes:', modesError);
      return;
    }

    const uniqueModes = [...new Set(allModes?.map(q => q.test_mode))].filter(Boolean);
    console.log('📊 Available test modes for VIC Selective Entry:', uniqueModes);

    // Check question counts by test_mode
    console.log('\n📈 Question counts by test mode:');
    for (const mode of uniqueModes) {
      const { data: questions, error } = await supabase
        .from('questions')
        .select('id, section_name')
        .eq('product_type', 'VIC Selective Entry (Year 9 Entry)')
        .eq('test_mode', mode);

      if (error) {
        console.error(`❌ Error fetching questions for ${mode}:`, error);
        continue;
      }

      const sections = [...new Set(questions?.map(q => q.section_name))].filter(Boolean);
      console.log(`   ${mode}: ${questions?.length || 0} questions in ${sections.length} sections`);
      
      if (sections.length > 0) {
        sections.forEach(section => {
          const count = questions?.filter(q => q.section_name === section).length || 0;
          console.log(`      - ${section}: ${count} questions`);
        });
      }
    }

    // Specifically check practice test modes
    console.log('\n🎯 Checking specific practice test modes:');
    const practiceTestModes = ['practice_1', 'practice_2', 'practice_3', 'practice_4', 'practice_5'];
    
    for (const mode of practiceTestModes) {
      const { data: questions, error } = await supabase
        .from('questions')
        .select('id, section_name')
        .eq('product_type', 'VIC Selective Entry (Year 9 Entry)')
        .eq('test_mode', mode);

      if (error) {
        console.error(`❌ Error fetching questions for ${mode}:`, error);
        continue;
      }

      if (!questions || questions.length === 0) {
        console.log(`   ❌ No questions found for ${mode}`);
      } else {
        const sections = [...new Set(questions.map(q => q.section_name))].filter(Boolean);
        console.log(`   ✅ ${mode}: ${questions.length} questions in ${sections.length} sections`);
      }
    }

  } catch (error) {
    console.error('❌ Error in debug script:', error);
  }
}

debugPracticeQuestions();