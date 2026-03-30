#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const errors = [
  {
    id: '6c8cd620-5b5b-43f7-99f1-3b86f79ab816',
    name: 'Mountain Climb',
    oldAnswer: 'A',
    newAnswer: 'E',
    reason: 'Actual height is 1076.92m, not in options'
  },
  {
    id: 'ba02743e-35ac-453a-8a5e-4bf1bb825f1c',
    name: 'Car Rental',
    oldAnswer: 'C',
    newAnswer: 'B',
    reason: '$45×3 + $0.20×350 = $205, not $215'
  },
  {
    id: '327a7bf4-644d-463b-bffe-eb492fb2d30e',
    name: 'Steel Beams',
    oldAnswer: 'D',
    newAnswer: 'E',
    reason: 'Savings $1,800, not in options'
  }
];

async function fixAppliedWordProblemsErrors() {
  console.log('FIXING APPLIED WORD PROBLEMS ERRORS');
  console.log('='.repeat(80));
  console.log();

  for (const error of errors) {
    console.log(`Fixing: ${error.name}`);
    console.log(`ID: ${error.id}`);
    console.log(`Change: ${error.oldAnswer} → ${error.newAnswer}`);
    console.log(`Reason: ${error.reason}`);

    const { data: before } = await supabase
      .from('questions_v2')
      .select('correct_answer')
      .eq('id', error.id)
      .single();

    if (before?.correct_answer !== error.oldAnswer) {
      console.log(`⚠️  WARNING: Expected ${error.oldAnswer}, found ${before?.correct_answer}`);
    }

    const { error: updateError } = await supabase
      .from('questions_v2')
      .update({ correct_answer: error.newAnswer })
      .eq('id', error.id);

    if (updateError) {
      console.log(`❌ FAILED: ${updateError.message}`);
    } else {
      console.log(`✅ SUCCESS`);
    }
    console.log();
  }

  // Verify all fixes
  console.log('='.repeat(80));
  console.log('VERIFICATION');
  console.log('='.repeat(80));
  console.log();

  for (const error of errors) {
    const { data } = await supabase
      .from('questions_v2')
      .select('correct_answer')
      .eq('id', error.id)
      .single();

    const status = data?.correct_answer === error.newAnswer ? '✅' : '❌';
    console.log(`${status} ${error.name}: ${data?.correct_answer} (expected ${error.newAnswer})`);
  }

  console.log();
  console.log('='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`✅ Fixed 3 errors in Applied Word Problems`);
  console.log(`📊 Total VIC Selective errors fixed this session: 4`);
  console.log(`   - Algebraic Equations: 1`);
  console.log(`   - Applied Word Problems: 3`);
  console.log(`📊 Grand total VIC Selective errors fixed: 64`);
  console.log(`   - Previous sessions: 60`);
  console.log(`   - This session: 4`);
  console.log();
}

fixAppliedWordProblemsErrors();
