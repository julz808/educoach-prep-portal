/**
 * Check VIC section names
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSections() {
  const { data, error } = await supabase
    .from('questions_v2')
    .select('section_name, sub_skill, test_mode, id')
    .eq('test_type', 'VIC Selective Entry (Year 9 Entry)')
    .limit(200);

  if (error) {
    console.error('❌ Query error:', error);
    process.exit(1);
  }

  console.log(`\n📋 Found ${data.length} VIC Selective questions total\n`);

  // Group by section name
  const sections = new Map<string, number>();
  data.forEach(q => {
    sections.set(q.section_name, (sections.get(q.section_name) || 0) + 1);
  });

  console.log('Sections found:');
  sections.forEach((count, name) => {
    console.log(`  - ${name}: ${count} questions`);
  });

  console.log('\n');
}

checkSections()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
  });
