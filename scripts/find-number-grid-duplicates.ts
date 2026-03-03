import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface Question {
  id: string;
  question_text: string;
  answer_options: any;
  correct_answer: string;
  sub_skill_id: string;
  difficulty: string;
  test_mode: string;
  section_name: string;
  test_type: string;
  created_at: string;
}

// Normalize text for comparison
function normalizeText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

// Normalize answer options
function normalizeOptions(options: any): string {
  if (!options) return '';

  if (Array.isArray(options)) {
    return options
      .map(opt => {
        if (typeof opt === 'string') return normalizeText(opt);
        if (typeof opt === 'object' && opt.text) return normalizeText(opt.text);
        return JSON.stringify(opt);
      })
      .sort()
      .join('|');
  }

  if (typeof options === 'object') {
    return Object.values(options)
      .map(opt => typeof opt === 'string' ? normalizeText(opt) : JSON.stringify(opt))
      .sort()
      .join('|');
  }

  return String(options);
}

// Create question fingerprint
function createQuestionFingerprint(q: Question): string {
  const text = normalizeText(q.question_text);
  const options = normalizeOptions(q.answer_options);
  const answer = normalizeText(q.correct_answer);
  return `${text}|||${options}|||${answer}`;
}

async function findAllDuplicates() {
  console.log('🔍 Searching for duplicate questions across ALL test types...\n');

  // Get all questions
  const { data: allQuestions, error } = await supabase
    .from('questions_v2')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ Error fetching questions:', error);
    return;
  }

  console.log(`Found ${allQuestions?.length || 0} total questions\n`);

  // Group by test type and section
  const byTestType = new Map<string, Question[]>();

  allQuestions?.forEach(q => {
    const key = `${q.test_type}|${q.section_name}`;
    if (!byTestType.has(key)) {
      byTestType.set(key, []);
    }
    byTestType.get(key)!.push(q);
  });

  console.log('📊 Questions by test type and section:');
  byTestType.forEach((questions, key) => {
    console.log(`  ${key}: ${questions.length} questions`);
  });
  console.log();

  // Find duplicates in each group
  const allDuplicates: any[] = [];
  let totalDuplicateGroups = 0;
  let totalQuestionsToDelete = 0;

  for (const [key, questions] of byTestType.entries()) {
    const [testType, sectionName] = key.split('|');

    // Group by fingerprint
    const fingerprints = new Map<string, Question[]>();

    for (const q of questions) {
      const fingerprint = createQuestionFingerprint(q);
      if (!fingerprints.has(fingerprint)) {
        fingerprints.set(fingerprint, []);
      }
      fingerprints.get(fingerprint)!.push(q);
    }

    // Find duplicate groups
    const duplicateGroups = Array.from(fingerprints.entries())
      .filter(([_, qs]) => qs.length > 1);

    if (duplicateGroups.length > 0) {
      console.log(`\n⚠️  ${testType} - ${sectionName}`);
      console.log(`   Found ${duplicateGroups.length} duplicate groups\n`);

      for (const [fingerprint, qs] of duplicateGroups) {
        totalDuplicateGroups++;
        totalQuestionsToDelete += (qs.length - 1);

        console.log(`   📝 Group ${totalDuplicateGroups}: ${qs.length} duplicates`);
        console.log(`      Question preview: "${qs[0].question_text.substring(0, 100)}..."`);
        console.log(`      Test modes: ${qs.map(q => q.test_mode).join(', ')}`);
        console.log(`      IDs: ${qs.map(q => q.id).join(', ')}`);
        console.log(`      Created dates: ${qs.map(q => new Date(q.created_at).toLocaleString()).join(', ')}`);
        console.log();

        allDuplicates.push({
          testType,
          sectionName,
          duplicateCount: qs.length,
          questionPreview: qs[0].question_text.substring(0, 200),
          testModes: qs.map(q => q.test_mode),
          questionsToKeep: [qs[0].id],
          questionsToDelete: qs.slice(1).map(q => q.id),
          allQuestions: qs.map(q => ({
            id: q.id,
            created_at: q.created_at,
            test_mode: q.test_mode,
            sub_skill: q.sub_skill_id,
            difficulty: q.difficulty,
            question_text: q.question_text,
            answer_options: q.answer_options,
            correct_answer: q.correct_answer
          }))
        });
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📋 DUPLICATE AUDIT SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total duplicate groups found: ${totalDuplicateGroups}`);
  console.log(`Total questions to delete: ${totalQuestionsToDelete}`);
  console.log(`Total unique questions to keep: ${totalDuplicateGroups}`);

  // Search for the specific "number grid" question
  console.log('\n🔍 Searching for "number grid" questions...');
  const numberGridQuestions = allQuestions?.filter(q =>
    q.question_text.toLowerCase().includes('number') &&
    q.question_text.toLowerCase().includes('grid')
  );

  if (numberGridQuestions && numberGridQuestions.length > 0) {
    console.log(`\nFound ${numberGridQuestions.length} questions mentioning "number" and "grid":`);
    numberGridQuestions.forEach(q => {
      console.log(`\n  ID: ${q.id}`);
      console.log(`  Test: ${q.test_type}`);
      console.log(`  Section: ${q.section_name}`);
      console.log(`  Mode: ${q.test_mode}`);
      console.log(`  Question: ${q.question_text.substring(0, 150)}...`);
    });
  }

  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalDuplicateGroups,
      totalQuestionsToDelete,
      totalQuestionsToKeep: totalDuplicateGroups,
      totalQuestionsScanned: allQuestions?.length || 0
    },
    duplicateGroups: allDuplicates
  };

  const reportPath = '/Users/julz88/Documents/educoach-prep-portal-2/all-duplicates-audit.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Detailed report saved to: all-duplicates-audit.json`);

  // Generate SQL deletion script
  const idsToDelete = allDuplicates.flatMap(group => group.questionsToDelete);

  if (idsToDelete.length > 0) {
    const sqlScript = `-- All Duplicate Questions Deletion Script
-- Generated: ${new Date().toISOString()}
-- Total questions to delete: ${idsToDelete.length}

-- Backup duplicates before deletion
CREATE TABLE IF NOT EXISTS deleted_duplicates_backup_${new Date().toISOString().split('T')[0].replace(/-/g, '')} AS
SELECT * FROM questions_v2 WHERE id IN (
${idsToDelete.map(id => `  '${id}'`).join(',\n')}
);

-- Delete duplicate questions (keeping the oldest in each group)
DELETE FROM questions_v2
WHERE id IN (
${idsToDelete.map(id => `  '${id}'`).join(',\n')}
);

-- Verify deletion - show remaining counts by test type and section
SELECT
  test_type,
  section_name,
  test_mode,
  COUNT(*) as remaining_count
FROM questions_v2
GROUP BY test_type, section_name, test_mode
ORDER BY test_type, section_name, test_mode;
`;

    const sqlPath = '/Users/julz88/Documents/educoach-prep-portal-2/delete-all-duplicates.sql';
    fs.writeFileSync(sqlPath, sqlScript);
    console.log(`📝 SQL deletion script saved to: delete-all-duplicates.sql`);
  }

  return report;
}

async function main() {
  try {
    await findAllDuplicates();
    console.log('\n✅ Audit complete!');
  } catch (error) {
    console.error('❌ Error during audit:', error);
    process.exit(1);
  }
}

main();
