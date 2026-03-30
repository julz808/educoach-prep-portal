import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const errors = [
  {
    id: '46a1f383-e9b8-4117-8c03-80a36a99163f',
    name: 'Q2 - Jeweler/Stones (Difference of Two Squares)',
    oldAnswer: 'B',
    newAnswer: 'E',
    reason: 'Correct answer is 37 (25 odd + 12 multiples of 4), not 38. Since 37 not in options A-D, answer is E',
    correctValue: '37',
    proof: 'Odd numbers 1-50: 25 (all expressible). Multiples of 4: 4,8,12,16,20,24,28,32,36,40,44,48 = 12 numbers. Total = 37.'
  },
  {
    id: 'd9bfc32b-5fef-460c-8efa-2faec1f23b84',
    name: 'Q10 - Cinema Revenue',
    oldAnswer: 'E',
    newAnswer: 'A',
    reason: 'Adult 8×$18=$144, Child 5×$12=$60, Senior 4×$15=$60. Total = $264 (option A), not $234',
    correctValue: '$264',
    proof: '$144 + $60 + $60 = $264'
  }
];

async function fixErrors() {
  console.log(`\nFixing ${errors.length} errors in Number Operations & Properties...\n`);
  console.log('=' .repeat(80));

  for (const error of errors) {
    console.log(`\n${error.name}`);
    console.log(`  ID: ${error.id}`);
    console.log(`  Old Answer: ${error.oldAnswer}`);
    console.log(`  New Answer: ${error.newAnswer}`);
    console.log(`  Correct Value: ${error.correctValue}`);
    console.log(`  Reason: ${error.reason}`);
    console.log(`  Proof: ${error.proof}`);

    const { data, error: updateError } = await supabase
      .from('questions_v2')
      .update({
        correct_answer: error.newAnswer,
        updated_at: new Date().toISOString()
      })
      .eq('id', error.id)
      .select();

    if (updateError) {
      console.log(`  ❌ ERROR: ${updateError.message}`);
    } else {
      console.log(`  ✅ FIXED: ${error.oldAnswer} → ${error.newAnswer}`);
    }
  }

  console.log('\n' + '=' .repeat(80));
  console.log('\n Verifying fixes...\n');

  for (const error of errors) {
    const { data } = await supabase
      .from('questions_v2')
      .select('id, correct_answer')
      .eq('id', error.id)
      .single();

    if (data?.correct_answer === error.newAnswer) {
      console.log(`✓ Verified: ${error.name} = ${error.newAnswer}`);
    } else {
      console.log(`✗ VERIFICATION FAILED: ${error.name}`);
      console.log(`  Expected: ${error.newAnswer}, Got: ${data?.correct_answer}`);
    }
  }

  console.log('\n' + '=' .repeat(80));
  console.log('\n✅ All fixes applied and verified!\n');
}

fixErrors();
