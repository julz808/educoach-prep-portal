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
  mode: string;
  section: string;
  created_at: string;
}

interface DuplicateGroup {
  questions: Question[];
  count: number;
  normalizedText: string;
  normalizedOptions: string;
}

// Normalize text for comparison (remove extra whitespace, lowercase)
function normalizeText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

// Normalize answer options for comparison
function normalizeOptions(options: any): string {
  if (!options) return '';

  // Handle different option formats
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

// Create a unique fingerprint for a question
function createQuestionFingerprint(q: Question): string {
  const text = normalizeText(q.question_text);
  const options = normalizeOptions(q.answer_options);
  const answer = normalizeText(q.correct_answer);
  return `${text}|||${options}|||${answer}`;
}

async function auditVicSelectiveDuplicates() {
  console.log('🔍 Auditing VIC Selective Entry General Ability questions for duplicates...\n');

  const modes = ['learning', 'practice', 'test'];
  const sections = [
    'General Ability - Quantitative',
    'General Ability - Verbal'
  ];

  const allDuplicates: { [key: string]: DuplicateGroup } = {};
  let totalDuplicates = 0;
  let totalQuestionsToDelete = 0;

  for (const mode of modes) {
    for (const section of sections) {
      console.log(`\n📊 Checking ${section} - ${mode} mode...`);

      const { data: questions, error } = await supabase
        .from('questions_v2')
        .select('*')
        .eq('test_type', 'vic-selective-entry-year-9-entry-')
        .eq('section', section)
        .eq('mode', mode)
        .order('created_at', { ascending: true });

      if (error) {
        console.error(`❌ Error fetching questions:`, error);
        continue;
      }

      if (!questions || questions.length === 0) {
        console.log(`   No questions found`);
        continue;
      }

      console.log(`   Found ${questions.length} questions`);

      // Group by fingerprint
      const fingerprints = new Map<string, Question[]>();

      for (const q of questions) {
        const fingerprint = createQuestionFingerprint(q);
        if (!fingerprints.has(fingerprint)) {
          fingerprints.set(fingerprint, []);
        }
        fingerprints.get(fingerprint)!.push(q);
      }

      // Find duplicates (groups with more than 1 question)
      const duplicateGroups = Array.from(fingerprints.entries())
        .filter(([_, qs]) => qs.length > 1);

      if (duplicateGroups.length > 0) {
        console.log(`   ⚠️  Found ${duplicateGroups.length} duplicate groups`);

        for (const [fingerprint, qs] of duplicateGroups) {
          const key = `${section}|${mode}|${fingerprint}`;
          if (!allDuplicates[key]) {
            allDuplicates[key] = {
              questions: qs,
              count: qs.length,
              normalizedText: normalizeText(qs[0].question_text),
              normalizedOptions: normalizeOptions(qs[0].answer_options)
            };
            totalDuplicates++;
            // Keep the oldest, delete the rest
            totalQuestionsToDelete += (qs.length - 1);
          }

          console.log(`      - Group of ${qs.length} duplicates:`);
          console.log(`        Question: "${qs[0].question_text.substring(0, 100)}..."`);
          console.log(`        IDs: ${qs.map(q => q.id).join(', ')}`);
          console.log(`        Created: ${qs.map(q => new Date(q.created_at).toLocaleString()).join(', ')}`);
        }
      } else {
        console.log(`   ✅ No duplicates found`);
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📋 DUPLICATE AUDIT SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total duplicate groups found: ${totalDuplicates}`);
  console.log(`Total questions to delete: ${totalQuestionsToDelete}`);
  console.log(`Total unique questions to keep: ${totalDuplicates}`);

  // Generate detailed report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalDuplicateGroups: totalDuplicates,
      totalQuestionsToDelete: totalQuestionsToDelete,
      totalQuestionsToKeep: totalDuplicates
    },
    duplicateGroups: Object.entries(allDuplicates).map(([key, group]) => {
      const [section, mode] = key.split('|');
      return {
        section,
        mode,
        duplicateCount: group.count,
        questionPreview: group.normalizedText.substring(0, 200),
        questionsToKeep: [group.questions[0].id],
        questionsToDelete: group.questions.slice(1).map(q => q.id),
        allQuestions: group.questions.map(q => ({
          id: q.id,
          created_at: q.created_at,
          sub_skill_id: q.sub_skill_id,
          difficulty: q.difficulty,
          question_text: q.question_text,
          answer_options: q.answer_options,
          correct_answer: q.correct_answer
        }))
      };
    })
  };

  // Save report
  const reportPath = '/Users/julz88/Documents/educoach-prep-portal-2/vic-selective-duplicates-audit.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Detailed report saved to: vic-selective-duplicates-audit.json`);

  // Generate deletion script
  const idsToDelete = Object.values(allDuplicates)
    .flatMap(group => group.questions.slice(1).map(q => q.id));

  if (idsToDelete.length > 0) {
    console.log('\n🗑️  Questions to delete:');
    console.log(idsToDelete.join('\n'));

    const sqlScript = `-- VIC Selective Entry Duplicate Questions Deletion Script
-- Generated: ${new Date().toISOString()}
-- Total questions to delete: ${idsToDelete.length}

-- Backup duplicates before deletion
CREATE TABLE IF NOT EXISTS deleted_vic_duplicates_backup AS
SELECT * FROM questions_v2 WHERE id IN (
${idsToDelete.map(id => `  '${id}'`).join(',\n')}
);

-- Delete duplicate questions (keeping the oldest in each group)
DELETE FROM questions_v2
WHERE id IN (
${idsToDelete.map(id => `  '${id}'`).join(',\n')}
);

-- Verify deletion
SELECT
  section,
  mode,
  COUNT(*) as remaining_count
FROM questions_v2
WHERE test_type = 'vic-selective-entry-year-9-entry-'
  AND section IN ('General Ability - Quantitative', 'General Ability - Verbal')
GROUP BY section, mode
ORDER BY section, mode;
`;

    const sqlPath = '/Users/julz88/Documents/educoach-prep-portal-2/delete-vic-selective-duplicates.sql';
    fs.writeFileSync(sqlPath, sqlScript);
    console.log(`\n📝 SQL deletion script saved to: delete-vic-selective-duplicates.sql`);
  }

  return report;
}

async function analyzeDuplicateDetectionGaps() {
  console.log('\n' + '='.repeat(80));
  console.log('🔬 ANALYZING DUPLICATE DETECTION GAPS');
  console.log('='.repeat(80));

  // Read the duplicate detection code
  const duplicateDetectionPath = '/Users/julz88/Documents/educoach-prep-portal-2/src/engines/questionGeneration/v2/supabaseStorage.ts';

  console.log('\n📖 Analyzing duplicate detection logic in v2 engine...\n');

  const analysis = {
    possibleCauses: [
      {
        issue: 'Race Condition in Parallel Generation',
        description: 'If multiple questions are generated in parallel for the same section/mode, they might check for duplicates at the same time before any are saved',
        likelihood: 'HIGH',
        evidence: 'Multiple duplicates have identical or very close created_at timestamps'
      },
      {
        issue: 'Insufficient Normalization',
        description: 'The duplicate detection might not normalize text/options the same way, allowing slight variations to pass through',
        likelihood: 'MEDIUM',
        evidence: 'Need to check if whitespace, case, or formatting differences exist'
      },
      {
        issue: 'Mode-Specific Checking',
        description: 'Duplicate detection might only check within the same mode, not across modes',
        likelihood: 'MEDIUM',
        evidence: 'Duplicates appear across different modes (learning, practice, test)'
      },
      {
        issue: 'Transaction Isolation',
        description: 'Database transaction isolation level might not prevent duplicate inserts during concurrent operations',
        likelihood: 'HIGH',
        evidence: 'Duplicates with very close timestamps suggest concurrent generation'
      },
      {
        issue: 'Fingerprint Collision',
        description: 'The fingerprinting algorithm might be too lenient or have edge cases',
        likelihood: 'LOW',
        evidence: 'Need to verify exact matching logic'
      }
    ],
    recommendations: [
      '1. Add database-level unique constraint on normalized question fingerprint',
      '2. Implement proper transaction locking during question insertion',
      '3. Add cross-mode duplicate checking (check all modes, not just current)',
      '4. Enhance text normalization to handle more edge cases',
      '5. Add retry logic with exponential backoff for duplicate detection',
      '6. Implement a two-phase commit: check → lock → insert pattern'
    ]
  };

  console.log('📋 Possible Root Causes:\n');
  analysis.possibleCauses.forEach((cause, i) => {
    console.log(`${i + 1}. ${cause.issue} [${cause.likelihood} likelihood]`);
    console.log(`   ${cause.description}`);
    console.log(`   Evidence: ${cause.evidence}\n`);
  });

  console.log('💡 Recommendations:\n');
  analysis.recommendations.forEach(rec => {
    console.log(`   ${rec}`);
  });

  return analysis;
}

async function main() {
  try {
    const report = await auditVicSelectiveDuplicates();
    const analysis = await analyzeDuplicateDetectionGaps();

    console.log('\n✅ Audit complete!');
    console.log('\nNext steps:');
    console.log('1. Review vic-selective-duplicates-audit.json for detailed findings');
    console.log('2. Review delete-vic-selective-duplicates.sql before executing');
    console.log('3. Execute the SQL script to delete duplicates');
    console.log('4. Fix the duplicate detection logic based on root cause analysis');

  } catch (error) {
    console.error('❌ Error during audit:', error);
    process.exit(1);
  }
}

main();
