#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const errorQuestions = [
  { id: 'cbc46cb1-9a72-4c37-9e99-ed1921ae5a35', name: 'PT1 Q16 D G K P', calculated: 'VC' },
  { id: '8948bac4-0d50-4bf0-aa52-979b1b47b6f9', name: 'PT1 Q17 C F J O', calculated: 'UB' },
  { id: '49d11b3c-7c8e-4304-8eea-e4bc1aed9fc6', name: 'PT1 Q18 F H K O T', calculated: 'ZG' },
  { id: 'fb5a406b-c570-4002-bf45-8e90b59aa5f1', name: 'PT1 Q21 K N R W', calculated: 'CJ' },
  { id: '6f4dbe51-6d5b-48b4-a66d-f3a00b2b0031', name: 'PT1 Q45 E H L Q', calculated: 'WD' },
  { id: 'fb29d71c-520c-4dfd-8137-82bade363947', name: 'PT1 Q52 Z W S N', calculated: 'HA' },
  { id: 'a5ad2430-b4d4-4fba-b6e9-56ff9c6ad803', name: 'PT2 Q6 Z Y W T', calculated: 'PK' },
  { id: '56fb9e17-6e16-4511-a11d-e7bac5b58be2', name: 'PT2 Q8 B C E H L', calculated: 'QW' },
  { id: '23180c3b-615a-42cc-88f2-64dcbb5c4c67', name: 'PT2 Q39 G I L P U', calculated: 'AH' },
];

async function main() {
  for (const q of errorQuestions) {
    const { data, error } = await supabase
      .from('questions_v2')
      .select('answer_options, correct_answer')
      .eq('id', q.id)
      .single();

    if (error || !data) {
      console.log(`❌ Error fetching ${q.name}`);
      continue;
    }

    console.log(`\n${q.name}`);
    console.log(`Calculated answer: ${q.calculated}`);
    console.log(`Stored answer: ${data.correct_answer}`);
    console.log(`Options:`);

    let foundMatch = false;
    data.answer_options.forEach((opt: string, idx: number) => {
      const letter = String.fromCharCode(65 + idx);
      // Extract just the letters from option (remove "A) " prefix)
      const optValue = opt.replace(/^[A-E]\)\s*/, '');
      const isCalculated = optValue === q.calculated;
      const isStored = letter === data.correct_answer;

      console.log(`  ${opt}${isStored ? ' ✓ STORED' : ''}${isCalculated ? ' ← CALCULATED' : ''}`);

      if (isCalculated) foundMatch = true;
    });

    if (!foundMatch) {
      console.log(`⚠️  WARNING: Calculated answer "${q.calculated}" NOT in options!`);
    }
  }
}

main();
