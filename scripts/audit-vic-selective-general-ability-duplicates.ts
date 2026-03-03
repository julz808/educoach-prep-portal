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
    // Extract just the option values without letters
    return options
      .map(opt => {
        if (typeof opt === 'string') {
          // Remove "A) ", "B) ", etc. and normalize
          const cleaned = opt.replace(/^[A-E]\)\s*/, '');
          return normalizeText(cleaned);
        }
        if (typeof opt === 'object' && opt.text) return normalizeText(opt.text);
        return JSON.stringify(opt);
      })
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

async function auditVicSelectiveDuplicates() {
  console.log('🔍 Auditing VIC Selective Entry General Ability duplicates...\n');

  const sections = [
    'General Ability - Quantitative',
    'General Ability - Verbal'
  ];

  const allDuplicates: any[] = [];
  let totalDuplicateGroups = 0;
  let totalQuestionsToDelete = 0;

  for (const section of sections) {
    console.log(`\n📊 Analyzing ${section}...`);

    const { data: questions, error } = await supabase
      .from('questions_v2')
      .select('*')
      .eq('test_type', 'VIC Selective Entry (Year 9 Entry)')
      .eq('section_name', section)
      .order('created_at', { ascending: true });

    if (error) {
      console.error(`❌ Error fetching questions:`, error);
      continue;
    }

    if (!questions || questions.length === 0) {
      console.log(`   No questions found`);
      continue;
    }

    console.log(`   Found ${questions.length} questions total`);

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
      console.log(`   ⚠️  Found ${duplicateGroups.length} duplicate groups\n`);

      for (const [fingerprint, qs] of duplicateGroups) {
        totalDuplicateGroups++;
        totalQuestionsToDelete += (qs.length - 1);

        console.log(`   📝 Duplicate Group ${totalDuplicateGroups}: ${qs.length} copies`);
        console.log(`      Question: "${qs[0].question_text.substring(0, 150)}"`);
        console.log(`      Modes: ${qs.map(q => q.test_mode).join(', ')}`);
        console.log(`      IDs to keep: ${qs[0].id}`);
        console.log(`      IDs to DELETE: ${qs.slice(1).map(q => q.id).join(', ')}`);

        // Show creation times to detect race conditions
        const creationTimes = qs.map(q => new Date(q.created_at));
        const timeDeltas = creationTimes.slice(1).map((t, i) =>
          Math.abs(t.getTime() - creationTimes[i].getTime()) / 1000
        );

        if (timeDeltas.length > 0) {
          const avgDelta = timeDeltas.reduce((a, b) => a + b, 0) / timeDeltas.length;
          console.log(`      Time between duplicates: ${avgDelta.toFixed(2)}s avg`);
          if (avgDelta < 5) {
            console.log(`      ⚡ RACE CONDITION DETECTED: All created within ${avgDelta.toFixed(2)}s!`);
          }
        }
        console.log();

        allDuplicates.push({
          section,
          duplicateCount: qs.length,
          questionPreview: qs[0].question_text.substring(0, 200),
          testModes: qs.map(q => q.test_mode),
          questionsToKeep: [qs[0].id],
          questionsToDelete: qs.slice(1).map(q => q.id),
          createdTimestamps: qs.map(q => q.created_at),
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
    } else {
      console.log(`   ✅ No duplicates found`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📋 VIC SELECTIVE ENTRY DUPLICATE AUDIT SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total duplicate groups found: ${totalDuplicateGroups}`);
  console.log(`Total questions to DELETE: ${totalQuestionsToDelete}`);
  console.log(`Total unique questions to KEEP: ${totalDuplicateGroups}`);
  console.log();

  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    testType: 'VIC Selective Entry (Year 9 Entry)',
    summary: {
      totalDuplicateGroups,
      totalQuestionsToDelete,
      totalQuestionsToKeep: totalDuplicateGroups
    },
    duplicateGroups: allDuplicates
  };

  const reportPath = '/Users/julz88/Documents/educoach-prep-portal-2/vic-selective-duplicates-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📄 Detailed report saved to: vic-selective-duplicates-report.json`);

  // Generate SQL deletion script
  const idsToDelete = allDuplicates.flatMap(group => group.questionsToDelete);

  if (idsToDelete.length > 0) {
    const sqlScript = `-- VIC Selective Entry Duplicate Questions Deletion Script
-- Generated: ${new Date().toISOString()}
-- Total questions to delete: ${idsToDelete.length}
-- Total unique questions to keep: ${totalDuplicateGroups}

-- STEP 1: Backup duplicates before deletion
CREATE TABLE IF NOT EXISTS deleted_vic_duplicates_backup_${new Date().toISOString().split('T')[0].replace(/-/g, '')} AS
SELECT * FROM questions_v2 WHERE id IN (
${idsToDelete.map(id => `  '${id}'`).join(',\n')}
);

-- STEP 2: Verify backup was created
SELECT
  'Backup created' as status,
  COUNT(*) as backed_up_questions
FROM deleted_vic_duplicates_backup_${new Date().toISOString().split('T')[0].replace(/-/g, '')};

-- STEP 3: Delete duplicate questions (keeping the oldest in each group)
DELETE FROM questions_v2
WHERE id IN (
${idsToDelete.map(id => `  '${id}'`).join(',\n')}
);

-- STEP 4: Verify deletion
SELECT
  'After deletion' as status,
  section_name,
  test_mode,
  COUNT(*) as remaining_count
FROM questions_v2
WHERE test_type = 'VIC Selective Entry (Year 9 Entry)'
  AND section_name IN ('General Ability - Quantitative', 'General Ability - Verbal')
GROUP BY section_name, test_mode
ORDER BY section_name, test_mode;

-- STEP 5: Verify no duplicates remain
WITH question_fingerprints AS (
  SELECT
    id,
    section_name,
    test_mode,
    LOWER(TRIM(REGEXP_REPLACE(question_text, '\\s+', ' ', 'g'))) as normalized_question,
    COUNT(*) OVER (PARTITION BY
      section_name,
      LOWER(TRIM(REGEXP_REPLACE(question_text, '\\s+', ' ', 'g')))
    ) as duplicate_count
  FROM questions_v2
  WHERE test_type = 'VIC Selective Entry (Year 9 Entry)'
    AND section_name IN ('General Ability - Quantitative', 'General Ability - Verbal')
)
SELECT
  section_name,
  test_mode,
  COUNT(*) as remaining_duplicates
FROM question_fingerprints
WHERE duplicate_count > 1
GROUP BY section_name, test_mode;
`;

    const sqlPath = '/Users/julz88/Documents/educoach-prep-portal-2/delete-vic-selective-duplicates.sql';
    fs.writeFileSync(sqlPath, sqlScript);
    console.log(`📝 SQL deletion script saved to: delete-vic-selective-duplicates.sql`);
    console.log();
    console.log('⚠️  IMPORTANT: Review the SQL script before executing!');
    console.log('   Run: npx supabase db < delete-vic-selective-duplicates.sql');
  }

  return report;
}

async function main() {
  try {
    await auditVicSelectiveDuplicates();
    console.log('\n✅ Audit complete!');
  } catch (error) {
    console.error('❌ Error during audit:', error);
    process.exit(1);
  }
}

main();
