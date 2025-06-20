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

async function debugDiagnosticQuestions() {
  try {
    console.log('🔍 Debugging diagnostic questions availability...');
    
    // Check what products are available
    const { data: allQuestions, error: allError } = await supabase
      .from('questions')
      .select('product_type, test_mode, section_name')
      .limit(10);

    if (allError) {
      console.error('❌ Error fetching sample questions:', allError);
      return;
    }

    console.log('📊 Sample questions in database:');
    const unique = new Set();
    allQuestions?.forEach(q => {
      const key = `${q.product_type} | ${q.test_mode} | ${q.section_name}`;
      unique.add(key);
    });
    
    Array.from(unique).sort().forEach(combination => {
      console.log(`   ${combination}`);
    });

    // Check specifically for VIC Selective diagnostic questions (most common test product)
    const productTypes = [
      'VIC Selective Entry (Year 9 Entry)',
      'NSW Selective Entry (Year 7 Entry)',
      'Year 5 NAPLAN',
      'Year 7 NAPLAN'
    ];

    for (const productType of productTypes) {
      console.log(`\n🎯 Checking diagnostic questions for: ${productType}`);
      
      const { data: diagnosticQuestions, error: diagError } = await supabase
        .from('questions')
        .select('section_name, id')
        .eq('product_type', productType)
        .eq('test_mode', 'diagnostic');

      if (diagError) {
        console.error(`❌ Error fetching diagnostic questions for ${productType}:`, diagError);
        continue;
      }

      if (!diagnosticQuestions || diagnosticQuestions.length === 0) {
        console.log(`   ❌ No diagnostic questions found for ${productType}`);
      } else {
        const sections = [...new Set(diagnosticQuestions.map(q => q.section_name))].filter(Boolean);
        console.log(`   ✅ Found ${diagnosticQuestions.length} questions in ${sections.length} sections:`);
        sections.forEach(section => {
          const count = diagnosticQuestions.filter(q => q.section_name === section).length;
          console.log(`      - ${section}: ${count} questions`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error in debug script:', error);
  }
}

debugDiagnosticQuestions();