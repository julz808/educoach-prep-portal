import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const errors = [
  {
    id: '696bc8bd-13f0-4723-bafd-f30196b32cbc',
    name: 'Q15 - Meteorological Rainfall',
    oldAnswer: 'A',
    newAnswer: 'E',
    reason: 'Actual answer is 67.5mm, not in options A-D, should be E (None of these)'
  },
  {
    id: 'b7fc9827-aa39-418e-9e55-808eb4fb3824',
    name: 'Q25 - Marathon Race',
    oldAnswer: 'B',
    newAnswer: 'C',
    reason: 'Calculated 29.29%, closest to C (30%) not B (28%)'
  },
  {
    id: '3edf6568-e19a-48ef-9a0f-f37a11692692',
    name: 'Q26 - Music Subscribers',
    oldAnswer: 'A',
    newAnswer: 'B',
    reason: 'Difference is 1800 (option B), not 1200 (option A)'
  }
];

async function fixFractionsDecimalsPercentagesErrors() {
  console.log('='.repeat(80));
  console.log('FIXING FRACTIONS, DECIMALS & PERCENTAGES ERRORS');
  console.log('='.repeat(80));
  console.log(`\nFixing ${errors.length} errors...\n`);

  for (const error of errors) {
    console.log(`Fixing ${error.name}...`);
    console.log(`  ID: ${error.id}`);
    console.log(`  Change: ${error.oldAnswer} → ${error.newAnswer}`);
    console.log(`  Reason: ${error.reason}`);

    const { data, error: updateError } = await supabase
      .from('questions_v2')
      .update({ correct_answer: error.newAnswer })
      .eq('id', error.id)
      .select();

    if (updateError) {
      console.log(`  ❌ ERROR: ${updateError.message}`);
    } else {
      console.log(`  ✅ Fixed successfully`);
    }
    console.log();
  }

  // Verify all fixes
  console.log('='.repeat(80));
  console.log('VERIFYING FIXES IN DATABASE');
  console.log('='.repeat(80));

  const errorIds = errors.map(e => e.id);
  const { data: verifyData } = await supabase
    .from('questions_v2')
    .select('id, correct_answer')
    .in('id', errorIds);

  let allCorrect = true;
  for (const error of errors) {
    const dbRecord = verifyData?.find(d => d.id === error.id);
    const isCorrect = dbRecord?.correct_answer === error.newAnswer;
    console.log(`\n${error.name}:`);
    console.log(`  Expected: ${error.newAnswer}`);
    console.log(`  Database: ${dbRecord?.correct_answer}`);
    console.log(`  Status: ${isCorrect ? '✅ CORRECT' : '❌ MISMATCH'}`);
    if (!isCorrect) allCorrect = false;
  }

  console.log('\n' + '='.repeat(80));
  if (allCorrect) {
    console.log('✅ ALL 3 FIXES VERIFIED IN LIVE DATABASE');
  } else {
    console.log('❌ SOME FIXES FAILED - PLEASE REVIEW');
  }
  console.log('='.repeat(80));

  console.log('\n⚠️  NOTE: Q20 (ID: 518f2370-f938-4ae1-91d8-446f7b7bca9f) was NOT fixed');
  console.log('   Calculated answer (60) is not in the provided options.');
  console.log('   This question requires manual review of question text or options.\n');
}

fixFractionsDecimalsPercentagesErrors();
