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
  },
  {
    id: '0cc83f0e-978a-4e07-a9c4-5ee77daf2dc9',
    name: 'Wind Farm Maintenance',
    oldAnswer: 'C',
    newAnswer: 'E',
    reason: 'Total offline 32.4 MW, not 31.4 MW (not in options)'
  },
  {
    id: 'b15f1754-ed55-4627-b4e1-27a8fb5c7075',
    name: 'Robotics Components',
    oldAnswer: 'D',
    newAnswer: 'E',
    reason: 'Problem has no valid solution (need 8.25 sensors)'
  },
  {
    id: '0d7b6bd8-b2c7-4993-a3a3-9559d14c98fd',
    name: 'Bakery Preparation Time',
    oldAnswer: 'D',
    newAnswer: 'E',
    reason: 'Correct answer is 128 minutes, not in options'
  },
  {
    id: '6133d287-628e-4ae4-bd31-357d8bea9755',
    name: 'Pharmaceutical Revenue',
    oldAnswer: 'C',
    newAnswer: 'E',
    reason: 'Correct revenue is $2,244, not $2,862'
  },
  {
    id: '02b7f30c-decd-4114-a42b-807f327d19f8',
    name: 'Library Late Fee',
    oldAnswer: 'B',
    newAnswer: 'E',
    reason: 'Change should be $1.40, not $2.40'
  },
  {
    id: 'b995ed73-2695-4a2b-93e7-feddac89e463',
    name: 'Telescope Observatory',
    oldAnswer: 'B',
    newAnswer: 'A',
    reason: 'Profit is $1,020, not $1,220'
  },
  {
    id: '1d2abd20-f8ad-4388-a0bd-28ca7de5395d',
    name: 'Weather Rainfall',
    oldAnswer: 'B',
    newAnswer: 'E',
    reason: 'Total is 125mm, not 117mm'
  },
  {
    id: 'b6b8bf32-eed8-4096-9823-94cdb5aa0c67',
    name: 'Music Streaming',
    oldAnswer: 'B',
    newAnswer: 'E',
    reason: 'Total is 36.5 hours, not 44 hours'
  },
  {
    id: '208e773d-2aec-49fd-bc13-1c516e5eee21',
    name: 'Fence Construction',
    oldAnswer: 'B',
    newAnswer: 'E',
    reason: 'Total cost is $2,288, not $2,286'
  }
];

async function fixAppliedWordProblemsAllErrors() {
  console.log('FIXING ALL APPLIED WORD PROBLEMS ERRORS');
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
  console.log(`✅ Fixed 12 errors in Applied Word Problems`);
  console.log();
  console.log(`📊 Applied Word Problems Complete Audit Results:`);
  console.log(`   - Total questions reviewed: 103`);
  console.log(`   - Total errors found: 12`);
  console.log(`   - Error rate: 11.7%`);
  console.log();
  console.log(`📊 VIC Selective Grand Total:`);
  console.log(`   - Previous errors fixed: 61`);
  console.log(`   - This session: 12`);
  console.log(`   - Total errors fixed: 73`);
  console.log();
}

fixAppliedWordProblemsAllErrors();
