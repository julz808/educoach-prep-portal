/**
 * Audit all questions in questions_v2 to find violations of nuanced duplicate rules
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

// Category mappings
const SECTION_CATEGORIES: Record<string, 'maths' | 'verbal' | 'reading' | 'writing'> = {
  'Mathematics': 'maths',
  'Numerical Reasoning': 'maths',
  'Mathematical Reasoning': 'maths',
  'Numeracy': 'maths',
  'Numeracy No Calculator': 'maths',
  'Numeracy Calculator': 'maths',
  'General Ability - Quantitative': 'maths',
  'Mathematics Reasoning': 'maths',
  'Verbal Reasoning': 'verbal',
  'Thinking Skills': 'verbal',
  'Language Conventions': 'verbal',
  'General Ability - Verbal': 'verbal',
  'Reading': 'reading',
  'Reading Comprehension': 'reading',
  'Reading Reasoning': 'reading',
  'Humanities': 'reading',
  'Writing': 'writing',
  'Written Expression': 'writing',
};

function getSectionCategory(sectionName: string): 'maths' | 'verbal' | 'reading' | 'writing' {
  if (SECTION_CATEGORIES[sectionName]) return SECTION_CATEGORIES[sectionName];
  const lower = sectionName.toLowerCase();
  if (lower.includes('math') || lower.includes('numer') || lower.includes('quantit')) return 'maths';
  if (lower.includes('verbal') || lower.includes('language') || lower.includes('thinking')) return 'verbal';
  if (lower.includes('reading') || lower.includes('humanit') || lower.includes('comprehension')) return 'reading';
  if (lower.includes('writ')) return 'writing';
  return 'verbal';
}

function extractTargetWord(text: string): string | null {
  const patterns = [
    /(?:opposite|similar|synonym|antonym)(?:\s+to|\s+of)?\s+([A-Z]+)/i,
    /(?:meaning|definition)(?:\s+of)?\s+([A-Z]+)/i,
    /word\s+([A-Z]+)/i
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].toLowerCase();
  }
  return null;
}

function extractNumbers(text: string): string {
  const questionPart = text.split(/\n\s*[A-D][\)\.:]/)[0];
  const numbers = questionPart.match(/\d+(?:\.\d+)?/g);
  return numbers ? numbers.sort().join(',') : '';
}

function calculateStringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  if (longer.length === 0) return 1.0;
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[str2.length][str1.length];
}

interface Violation {
  type: 'word-for-word' | 'verbal-same-word' | 'maths-same-numbers' | 'reading-same-question';
  category: string;
  testType: string;
  sectionName: string;
  subSkill: string;
  questions: Array<{
    id: string;
    mode: string;
    created: string;
    questionPreview: string;
    answer: string;
  }>;
  reason: string;
  details: string;
}

async function auditDuplicateRules() {
  console.log('\n🔍 Auditing questions_v2 for duplicate rule violations...\n');

  // Load ALL questions
  const { data: allQuestions, error } = await supabase
    .from('questions_v2')
    .select('id, question_text, correct_answer, sub_skill, test_type, section_name, test_mode, created_at')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ Query error:', error);
    process.exit(1);
  }

  console.log(`✅ Loaded ${allQuestions.length} total questions\n`);

  // Group by test + section + sub-skill
  const groups = new Map<string, typeof allQuestions>();
  allQuestions.forEach(q => {
    const key = `${q.test_type}|||${q.section_name}|||${q.sub_skill}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(q);
  });

  console.log(`📊 Grouped into ${groups.size} sub-skill groups\n`);

  const violations: Violation[] = [];

  // Check each group
  groups.forEach((questions, key) => {
    const [testType, sectionName, subSkill] = key.split('|||');
    const category = getSectionCategory(sectionName);

    // Check for violations within this group
    for (let i = 0; i < questions.length; i++) {
      for (let j = i + 1; j < questions.length; j++) {
        const q1 = questions[i];
        const q2 = questions[j];

        const normalized1 = q1.question_text.trim().toLowerCase();
        const normalized2 = q2.question_text.trim().toLowerCase();

        // Rule 1: Word-for-word identical
        if (normalized1 === normalized2) {
          violations.push({
            type: 'word-for-word',
            category,
            testType,
            sectionName,
            subSkill,
            questions: [
              {
                id: q1.id,
                mode: q1.test_mode,
                created: q1.created_at,
                questionPreview: q1.question_text.slice(0, 100),
                answer: q1.correct_answer || 'N/A'
              },
              {
                id: q2.id,
                mode: q2.test_mode,
                created: q2.created_at,
                questionPreview: q2.question_text.slice(0, 100),
                answer: q2.correct_answer || 'N/A'
              }
            ],
            reason: 'Identical question text word-for-word',
            details: `Question text is character-for-character identical`
          });
          continue;
        }

        // Rule 2: VERBAL - Same target word + same type
        // ONLY apply to vocabulary/synonym/antonym sub-skills, not ALL verbal questions
        if (category === 'verbal') {
          const isVocabSubSkill = subSkill.toLowerCase().includes('vocabulary') ||
                                  subSkill.toLowerCase().includes('semantic') ||
                                  subSkill.toLowerCase().includes('synonym') ||
                                  subSkill.toLowerCase().includes('antonym');

          if (isVocabSubSkill) {
            const word1 = extractTargetWord(normalized1);
            const word2 = extractTargetWord(normalized2);

            if (word1 && word2 && word1 === word2 && word1.length > 2) {
              const type1 = /opposite|antonym/i.test(normalized1) ? 'opposite' : 'similar';
              const type2 = /opposite|antonym/i.test(normalized2) ? 'opposite' : 'similar';

              if (type1 === type2) {
                violations.push({
                  type: 'verbal-same-word',
                  category,
                  testType,
                  sectionName,
                  subSkill,
                  questions: [
                    {
                      id: q1.id,
                      mode: q1.test_mode,
                      created: q1.created_at,
                      questionPreview: q1.question_text.slice(0, 100),
                      answer: q1.correct_answer || 'N/A'
                    },
                    {
                      id: q2.id,
                      mode: q2.test_mode,
                      created: q2.created_at,
                      questionPreview: q2.question_text.slice(0, 100),
                      answer: q2.correct_answer || 'N/A'
                    }
                  ],
                  reason: `Both test ${type1} of "${word1.toUpperCase()}"`,
                  details: `Target word: ${word1.toUpperCase()}, Question type: ${type1}`
                });
              }
            }
          }
        }

        // Rule 3: MATHS - Same numbers in similar calculation
        if (category === 'maths') {
          const numbers1 = extractNumbers(normalized1);
          const numbers2 = extractNumbers(normalized2);

          if (numbers1 && numbers2 && numbers1 === numbers2 && numbers1.split(',').length >= 2) {
            const getStem = (text: string) => text.split(/\n/)[0].replace(/\d+(?:\.\d+)?/g, 'N').toLowerCase();
            const stem1 = getStem(normalized1);
            const stem2 = getStem(normalized2);
            const similarity = calculateStringSimilarity(stem1, stem2);

            if (similarity > 0.8) {
              violations.push({
                type: 'maths-same-numbers',
                category,
                testType,
                sectionName,
                subSkill,
                questions: [
                  {
                    id: q1.id,
                    mode: q1.test_mode,
                    created: q1.created_at,
                    questionPreview: q1.question_text.slice(0, 100),
                    answer: q1.correct_answer || 'N/A'
                  },
                  {
                    id: q2.id,
                    mode: q2.test_mode,
                    created: q2.created_at,
                    questionPreview: q2.question_text.slice(0, 100),
                    answer: q2.correct_answer || 'N/A'
                  }
                ],
                reason: `Same numbers (${numbers1.split(',').join(', ')}) in similar calculation`,
                details: `Numbers: [${numbers1.split(',').join(', ')}], Structure similarity: ${(similarity * 100).toFixed(0)}%`
              });
            }
          }
        }
      }
    }
  });

  console.log(`\n🔴 Found ${violations.length} rule violations\n`);

  // Write report
  await writeReport(violations, allQuestions.length);

  // Console summary
  console.log('━'.repeat(80));
  console.log('SUMMARY BY VIOLATION TYPE:');
  console.log('━'.repeat(80));
  console.log('');

  const byType = violations.reduce((acc, v) => {
    if (!acc[v.type]) acc[v.type] = [];
    acc[v.type].push(v);
    return acc;
  }, {} as Record<string, Violation[]>);

  Object.entries(byType).forEach(([type, viols]) => {
    console.log(`${type}: ${viols.length} violations`);
  });

  console.log('');
  console.log('━'.repeat(80));
  console.log(`📄 Detailed report written to: docs/DUPLICATE_VIOLATIONS_REPORT.md`);
  console.log('━'.repeat(80));
  console.log('');
}

async function writeReport(violations: Violation[], totalQuestions: number) {
  const lines: string[] = [];

  lines.push(`# Duplicate Rule Violations Report`);
  lines.push(``);
  lines.push(`**Generated:** ${new Date().toISOString()}`);
  lines.push(`**Total Questions Analyzed:** ${totalQuestions}`);
  lines.push(`**Violations Found:** ${violations.length}`);
  lines.push(``);
  lines.push(`---`);
  lines.push(``);

  if (violations.length === 0) {
    lines.push(`## ✅ No Violations Found!`);
    lines.push(``);
    lines.push(`All ${totalQuestions} questions comply with the nuanced duplicate detection rules.`);
    lines.push(``);
  } else {
    lines.push(`## Summary`);
    lines.push(``);

    const byType = violations.reduce((acc, v) => {
      if (!acc[v.type]) acc[v.type] = [];
      acc[v.type].push(v);
      return acc;
    }, {} as Record<string, Violation[]>);

    lines.push(`| Violation Type | Count |`);
    lines.push(`|---------------|-------|`);
    Object.entries(byType).forEach(([type, viols]) => {
      lines.push(`| ${type} | ${viols.length} |`);
    });
    lines.push(``);

    lines.push(`---`);
    lines.push(``);

    // Group by test type
    const byTest = violations.reduce((acc, v) => {
      if (!acc[v.testType]) acc[v.testType] = [];
      acc[v.testType].push(v);
      return acc;
    }, {} as Record<string, Violation[]>);

    Object.entries(byTest).forEach(([testType, testViols]) => {
      lines.push(`## ${testType}`);
      lines.push(``);
      lines.push(`**Violations:** ${testViols.length}`);
      lines.push(``);

      // Group by section
      const bySection = testViols.reduce((acc, v) => {
        const key = `${v.sectionName} - ${v.subSkill}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(v);
        return acc;
      }, {} as Record<string, Violation[]>);

      Object.entries(bySection).forEach(([section, sectionViols]) => {
        lines.push(`### ${section}`);
        lines.push(``);

        sectionViols.forEach((v, i) => {
          lines.push(`#### Violation ${i + 1}: ${v.type}`);
          lines.push(``);
          lines.push(`**Reason:** ${v.reason}`);
          lines.push(`**Details:** ${v.details}`);
          lines.push(``);
          lines.push(`**Questions:**`);
          lines.push(``);

          v.questions.forEach((q, j) => {
            lines.push(`${j + 1}. **ID:** \`${q.id}\``);
            lines.push(`   - **Mode:** ${q.mode}`);
            lines.push(`   - **Created:** ${q.created}`);
            lines.push(`   - **Answer:** ${q.answer}`);
            lines.push(`   - **Preview:** ${q.questionPreview}...`);
            lines.push(``);
          });

          lines.push(`---`);
          lines.push(``);
        });
      });
    });

    lines.push(`## Recommended Actions`);
    lines.push(``);
    lines.push(`1. **Review violations** - Check if these are legitimate duplicates or edge cases`);
    lines.push(`2. **Delete duplicates** - Use the generated SQL to remove duplicate questions`);
    lines.push(`3. **Re-run generation** - The new system will prevent future violations`);
    lines.push(``);
  }

  lines.push(`---`);
  lines.push(`*Generated by audit-duplicate-rules.ts*`);

  const content = lines.join('\n');
  const filepath = path.resolve(process.cwd(), 'docs/DUPLICATE_VIOLATIONS_REPORT.md');
  fs.writeFileSync(filepath, content, 'utf8');
}

auditDuplicateRules()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
  });
