/**
 * Find ALL duplicate questions in questions_v2
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function findAllDuplicates() {
  console.log('\n🔍 Finding ALL duplicates in questions_v2...\n');

  // Get ALL questions
  const { data: allQuestions, error } = await supabase
    .from('questions_v2')
    .select('id, question_text, correct_answer, sub_skill, test_type, section_name, test_mode, created_at')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ Query error:', error);
    process.exit(1);
  }

  console.log(`✅ Loaded ${allQuestions.length} total questions\n`);

  // Group by exact question text
  const textMap = new Map<string, typeof allQuestions>();
  allQuestions.forEach(q => {
    const normalized = q.question_text.trim();
    if (!textMap.has(normalized)) {
      textMap.set(normalized, []);
    }
    textMap.get(normalized)!.push(q);
  });

  // Find duplicates
  const duplicateSets: Array<typeof allQuestions> = [];
  textMap.forEach((questions) => {
    if (questions.length > 1) {
      duplicateSets.push(questions);
    }
  });

  console.log(`🔴 Found ${duplicateSets.length} duplicate sets\n`);

  if (duplicateSets.length === 0) {
    console.log('✅ No duplicates found!\n');
    return;
  }

  // Group duplicates by test/section/sub-skill
  const byCategory = new Map<string, typeof duplicateSets>();
  duplicateSets.forEach(set => {
    const key = `${set[0].test_type} - ${set[0].section_name} - ${set[0].sub_skill}`;
    if (!byCategory.has(key)) {
      byCategory.set(key, []);
    }
    byCategory.get(key)!.push(set);
  });

  // Show summary
  console.log('━'.repeat(80));
  console.log('DUPLICATE SUMMARY BY CATEGORY:');
  console.log('━'.repeat(80));
  byCategory.forEach((sets, category) => {
    const totalDupes = sets.reduce((sum, set) => sum + set.length, 0);
    console.log(`\n${category}: ${sets.length} duplicate set(s), ${totalDupes} total questions`);
  });

  console.log('\n\n');
  console.log('━'.repeat(80));
  console.log('DETAILED DUPLICATE REPORT:');
  console.log('━'.repeat(80));

  let globalIndex = 0;
  byCategory.forEach((sets, category) => {
    console.log(`\n\n${'═'.repeat(80)}`);
    console.log(`${category}`);
    console.log('═'.repeat(80));

    sets.forEach((questions, setIndex) => {
      globalIndex++;
      console.log(`\n🔴 DUPLICATE SET #${globalIndex} (${questions.length} instances):`);
      console.log(`\nQuestion text (first 300 chars):\n${questions[0].question_text.slice(0, 300)}...`);
      console.log(`\nInstances:`);
      questions.forEach((q, i) => {
        const timeDiff = i > 0
          ? ((new Date(q.created_at).getTime() - new Date(questions[0].created_at).getTime()) / 1000).toFixed(0) + 's after first'
          : 'first';
        console.log(`  ${i + 1}. ID: ${q.id}`);
        console.log(`     Mode: ${q.test_mode}`);
        console.log(`     Answer: ${q.correct_answer}`);
        console.log(`     Created: ${q.created_at} (${timeDiff})`);
      });
    });
  });

  console.log('\n\n');
  console.log('━'.repeat(80));
  console.log(`📊 TOTAL: ${duplicateSets.length} duplicate sets found`);
  console.log('━'.repeat(80));
  console.log('\n');
}

findAllDuplicates()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
  });
