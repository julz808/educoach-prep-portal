#!/usr/bin/env tsx

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  console.log('🔍 Checking visual questions...\n');

  const { data, error } = await supabase
    .from('questions_v2')
    .select('id, sub_skill, question_text, visual_type, visual_svg, visual_data')
    .eq('has_visual', true)
    .order('created_at', { ascending: false })
    .limit(2);

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('ℹ️  No visual questions found');
    return;
  }

  console.log(`Found ${data.length} questions with visuals:\n`);

  data.forEach((q, idx) => {
    console.log(`${'='.repeat(60)}`);
    console.log(`${idx + 1}. ${q.sub_skill}`);
    console.log(`${'='.repeat(60)}`);
    console.log(`\nQuestion: ${q.question_text.substring(0, 150)}...\n`);
    console.log(`Visual Type: ${q.visual_type}`);
    console.log(`\nVisual SVG/HTML (first 500 chars):`);
    console.log(q.visual_svg?.substring(0, 500) || 'None');
    console.log('\n');
  });
}

main();
