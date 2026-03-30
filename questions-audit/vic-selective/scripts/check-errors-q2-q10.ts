import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkErrors() {
  console.log('Checking Q2 (jeweler/stones) and Q10 (cinema) errors...\n');

  // Q2: Jeweler question (ID from earlier: 46a1f383-e9b8-4117-8c03-80a36a99163f)
  const { data: q2 } = await supabase
    .from('questions_v2')
    .select('*')
    .eq('id', '46a1f383-e9b8-4117-8c03-80a36a99163f')
    .single();

  // Q10: Cinema question (ID from earlier: d9bfc32b-5fef-460c-8efa-2faec1f23b84)
  const { data: q10 } = await supabase
    .from('questions_v2')
    .select('*')
    .eq('id', 'd9bfc32b-5fef-460c-8efa-2faec1f23b84')
    .single();

  console.log('=' .repeat(80));
  console.log('Q2: JEWELER/STONES - Difference of Two Squares');
  console.log('=' .repeat(80));
  console.log('Question:', q2?.question_text?.substring(0, 100) + '...');
  console.log('\nOptions:');
  q2?.options?.forEach((opt: string, i: number) => {
    console.log(`  ${String.fromCharCode(65 + i)}. ${opt}`);
  });
  console.log('\nStored Answer:', q2?.correct_answer);
  console.log('\n✓ CORRECT CALCULATION:');
  console.log('  - Odd numbers 1-50: 25 numbers (all work)');
  console.log('  - Multiples of 4: 12 numbers (4,8,12,16,20,24,28,32,36,40,44,48)');
  console.log('  - Total: 25 + 12 = 37');
  console.log('\n❌ ERROR: Stored answer is', q2?.correct_answer, 'but should be 37 or E');

  console.log('\n' + '=' .repeat(80));
  console.log('Q10: CINEMA TICKETS - Revenue Calculation');
  console.log('=' .repeat(80));
  console.log('Question:', q10?.question_text?.substring(0, 100) + '...');
  console.log('\nOptions:');
  q10?.options?.forEach((opt: string, i: number) => {
    console.log(`  ${String.fromCharCode(65 + i)}. ${opt}`);
  });
  console.log('\nStored Answer:', q10?.correct_answer);
  console.log('\n✓ CORRECT CALCULATION:');
  console.log('  - Adult: 8 × $18 = $144');
  console.log('  - Child: 5 × $12 = $60');
  console.log('  - Senior: 4 × $15 = $60');
  console.log('  - Total: $144 + $60 + $60 = $264');
  console.log('\n❌ ERROR: Stored answer is', q10?.correct_answer, 'but should be $264');
}

checkErrors();
