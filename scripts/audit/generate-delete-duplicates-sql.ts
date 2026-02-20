/**
 * Generate SQL to delete duplicate questions (keeps the oldest instance)
 */

import * as dotenv from 'dotenv';
dotenv.config();

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function generateDeleteSQL() {
  console.log('\n🔍 Finding duplicates and generating DELETE SQL...\n');

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

  // Find duplicates (keep oldest, delete rest)
  const idsToDelete: string[] = [];
  const duplicateSets: Array<{ keep: typeof allQuestions[0], delete: typeof allQuestions }> = [];

  textMap.forEach((questions) => {
    if (questions.length > 1) {
      // Sort by created_at (oldest first)
      questions.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      const keep = questions[0];
      const toDelete = questions.slice(1);

      duplicateSets.push({ keep, delete: toDelete });
      idsToDelete.push(...toDelete.map(q => q.id));
    }
  });

  console.log(`🔴 Found ${duplicateSets.length} duplicate sets`);
  console.log(`🗑️  Will delete ${idsToDelete.length} duplicate questions (keeping oldest instances)\n`);

  if (idsToDelete.length === 0) {
    console.log('✅ No duplicates to delete!\n');
    return;
  }

  // Generate SQL
  const sqlLines: string[] = [];
  sqlLines.push('-- ============================================================================');
  sqlLines.push('-- DELETE DUPLICATE QUESTIONS FROM questions_v2');
  sqlLines.push('-- ============================================================================');
  sqlLines.push('-- Generated: ' + new Date().toISOString());
  sqlLines.push(`-- Total duplicates to delete: ${idsToDelete.length}`);
  sqlLines.push(`-- Total duplicate sets: ${duplicateSets.length}`);
  sqlLines.push('-- Strategy: Keep oldest instance, delete newer duplicates');
  sqlLines.push('-- ============================================================================');
  sqlLines.push('');
  sqlLines.push('BEGIN;');
  sqlLines.push('');

  // Add detailed comments for each duplicate set
  duplicateSets.forEach((set, i) => {
    sqlLines.push(`-- Duplicate Set #${i + 1}: ${set.keep.test_type} - ${set.keep.section_name} - ${set.keep.sub_skill}`);
    sqlLines.push(`--   Question: ${set.keep.question_text.slice(0, 80).replace(/\n/g, ' ')}...`);
    sqlLines.push(`--   KEEP: ${set.keep.id} (created ${set.keep.created_at}, mode: ${set.keep.test_mode})`);
    set.delete.forEach((q, j) => {
      sqlLines.push(`--   DELETE: ${q.id} (created ${q.created_at}, mode: ${q.test_mode})`);
    });
    sqlLines.push('');
  });

  sqlLines.push('-- Delete all duplicates in one statement');
  sqlLines.push(`DELETE FROM questions_v2 WHERE id IN (`);
  idsToDelete.forEach((id, i) => {
    const comma = i < idsToDelete.length - 1 ? ',' : '';
    sqlLines.push(`  '${id}'${comma}`);
  });
  sqlLines.push(');');
  sqlLines.push('');
  sqlLines.push('COMMIT;');
  sqlLines.push('');
  sqlLines.push(`-- Expected result: DELETE ${idsToDelete.length}`);

  const sqlContent = sqlLines.join('\n');

  // Write to file
  const outputPath = path.resolve(process.cwd(), 'scripts/database/delete-duplicates-questions-v2.sql');
  fs.writeFileSync(outputPath, sqlContent, 'utf8');

  console.log('━'.repeat(80));
  console.log('📄 SQL file generated:');
  console.log(`   ${outputPath}`);
  console.log('━'.repeat(80));
  console.log('');
  console.log('To execute:');
  console.log('  1. Review the SQL file to ensure it looks correct');
  console.log('  2. Run in Supabase SQL Editor, or:');
  console.log(`     npx supabase db query --file ${outputPath}`);
  console.log('');
  console.log(`📊 Summary:`);
  console.log(`   - Total questions: ${allQuestions.length}`);
  console.log(`   - Duplicate sets: ${duplicateSets.length}`);
  console.log(`   - Questions to delete: ${idsToDelete.length}`);
  console.log(`   - Questions remaining: ${allQuestions.length - idsToDelete.length}`);
  console.log('');
}

generateDeleteSQL()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
  });
