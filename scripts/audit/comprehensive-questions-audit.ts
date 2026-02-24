import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Try .env first, then .env.local
dotenv.config({ path: '.env' });
if (!process.env.VITE_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
  dotenv.config({ path: '.env.local' });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'found' : 'missing');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'found' : 'missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface Question {
  id: string;
  product_type: string;
  test_type: string;
  test_mode: string;
  section_name: string;
  question_text: string;
  response_type: string;
  sub_skill: string;
  difficulty: number;
  passage_id: string | null;
  correct_answer: any;
  answer_options: any;
  solution: string;
}

interface SectionRequirement {
  count: number;
  difficulty?: { easy?: number; medium?: number; hard?: number };
  passages?: number;
  questionsPerPassage?: number;
}

// Define expected requirements per test section
// Key structure: product_type -> test_mode -> section_name -> requirements
const SECTION_REQUIREMENTS: Record<string, Record<string, Record<string, SectionRequirement>>> = {
  'NSW Selective Entry (Year 7 Entry)': {
    'practice': {
      'Reading': { count: 40, passages: 4, questionsPerPassage: 10 },
      'Mathematical Reasoning': { count: 35 },
      'Thinking Skills': { count: 40 },
      'Writing': { count: 2 }
    },
    'diagnostic': {
      'Reading': { count: 20, passages: 2, questionsPerPassage: 10 },
      'Mathematical Reasoning': { count: 18 },
      'Thinking Skills': { count: 20 },
      'Writing': { count: 1 }
    }
  },
  'VIC Selective Entry (Year 9 Entry)': {
    'practice': {
      'Numerical Reasoning': { count: 45 },
      'Verbal Reasoning': { count: 45 },
      'Writing': { count: 1 }
    },
    'diagnostic': {
      'Numerical Reasoning': { count: 23 },
      'Verbal Reasoning': { count: 23 },
      'Writing': { count: 1 }
    }
  },
  'Year 5 NAPLAN': {
    'practice': {
      'Reading': { count: 30, passages: 3, questionsPerPassage: 10 },
      'Writing': { count: 1 },
      'Conventions of Language': { count: 30 },
      'Numeracy': { count: 40 }
    },
    'diagnostic': {
      'Reading': { count: 15, passages: 2, questionsPerPassage: 7 },
      'Writing': { count: 1 },
      'Conventions of Language': { count: 15 },
      'Numeracy': { count: 20 }
    }
  },
  'Year 7 NAPLAN': {
    'practice': {
      'Reading': { count: 30, passages: 3, questionsPerPassage: 10 },
      'Writing': { count: 1 },
      'Conventions of Language': { count: 30 },
      'Numeracy': { count: 40 }
    },
    'diagnostic': {
      'Reading': { count: 15, passages: 2, questionsPerPassage: 7 },
      'Writing': { count: 1 },
      'Conventions of Language': { count: 15 },
      'Numeracy': { count: 20 }
    }
  },
  'ACER Scholarship (Year 7 Entry)': {
    'practice': {
      'Mathematics': { count: 30 },
      'Reading Comprehension': { count: 30, passages: 3, questionsPerPassage: 10 },
      'Humanities & Science': { count: 30, passages: 3, questionsPerPassage: 10 },
      'Writing': { count: 1 }
    },
    'diagnostic': {
      'Mathematics': { count: 15 },
      'Reading Comprehension': { count: 15, passages: 2, questionsPerPassage: 7 },
      'Humanities & Science': { count: 15, passages: 2, questionsPerPassage: 7 },
      'Writing': { count: 1 }
    }
  },
  'EduTest Scholarship (Year 7 Entry)': {
    'practice': {
      'Mathematics': { count: 30 },
      'Reading Comprehension': { count: 30, passages: 3, questionsPerPassage: 10 },
      'Humanities & Science': { count: 30, passages: 3, questionsPerPassage: 10 },
      'Writing': { count: 1 }
    },
    'diagnostic': {
      'Mathematics': { count: 15 },
      'Reading Comprehension': { count: 15, passages: 2, questionsPerPassage: 7 },
      'Humanities & Science': { count: 15, passages: 2, questionsPerPassage: 7 },
      'Writing': { count: 1 }
    }
  }
};

async function comprehensiveAudit() {
  console.log('🔍 Starting Comprehensive Questions Audit...\n');

  const issues: string[] = [];
  const warnings: string[] = [];
  const summary: any = {};

  // Fetch all questions (no limit - get everything!)
  let allQuestions: Question[] = [];
  let from = 0;
  const batchSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('questions_v2')
      .select('*')
      .range(from, from + batchSize - 1)
      .order('product_type, test_mode, section_name');

    if (error) {
      console.error('❌ Error fetching questions:', error);
      return;
    }

    if (!data || data.length === 0) break;

    allQuestions = allQuestions.concat(data);
    from += batchSize;

    if (data.length < batchSize) break;
  }

  console.log(`📊 Total questions in database: ${allQuestions.length}\n`);

  // Group questions by product_type, test_mode, section_name
  const grouped: Record<string, Record<string, Record<string, Question[]>>> = {};

  allQuestions.forEach(q => {
    if (!grouped[q.product_type]) grouped[q.product_type] = {};
    if (!grouped[q.product_type][q.test_mode]) grouped[q.product_type][q.test_mode] = {};
    if (!grouped[q.product_type][q.test_mode][q.section_name]) {
      grouped[q.product_type][q.test_mode][q.section_name] = [];
    }
    grouped[q.product_type][q.test_mode][q.section_name].push(q);
  });

  // 1. CHECK QUESTION COUNTS
  console.log('═══════════════════════════════════════════════════════');
  console.log('📋 CHECK 1: QUESTION COUNTS PER TEST SECTION');
  console.log('═══════════════════════════════════════════════════════\n');

  for (const [productType, testModes] of Object.entries(grouped)) {
    console.log(`\n📦 ${productType}`);
    console.log('─'.repeat(60));

    for (const [testMode, sections] of Object.entries(testModes)) {
      console.log(`\n  📝 ${testMode}`);

      for (const [section, questions] of Object.entries(sections)) {
        const expected = SECTION_REQUIREMENTS[productType]?.[testMode]?.[section];
        const actual = questions.length;
        const status = expected && actual === expected.count ? '✅' :
                      expected && actual > expected.count ? '⚠️ OVER' :
                      expected && actual < expected.count ? '❌ UNDER' : '❓';

        console.log(`    ${status} ${section}: ${actual} questions${expected ? ` (expected: ${expected.count})` : ' (no requirement defined)'}`);

        if (expected) {
          if (actual < expected.count) {
            issues.push(`${productType} > ${testMode} > ${section}: Missing ${expected.count - actual} questions (has ${actual}, needs ${expected.count})`);
          } else if (actual > expected.count) {
            warnings.push(`${productType} > ${testMode} > ${section}: Over-generated by ${actual - expected.count} questions (has ${actual}, needs ${expected.count})`);
          }
        }
      }
    }
  }

  // 2. CHECK DIFFICULTY BALANCE
  console.log('\n\n═══════════════════════════════════════════════════════');
  console.log('⚖️ CHECK 2: DIFFICULTY & SUB-SKILL BALANCE');
  console.log('═══════════════════════════════════════════════════════\n');

  for (const [productType, testModes] of Object.entries(grouped)) {
    console.log(`\n📦 ${productType}`);
    console.log('─'.repeat(60));

    for (const [testMode, sections] of Object.entries(testModes)) {
      console.log(`\n  📝 ${testMode}`);

      for (const [section, questions] of Object.entries(sections)) {
        if (section.toLowerCase() === 'writing') continue; // Skip writing sections

        const difficulties = questions.map(q => q.difficulty);
        const diffCount = {
          easy: difficulties.filter(d => d === 1).length,
          medium: difficulties.filter(d => d === 2).length,
          hard: difficulties.filter(d => d === 3).length
        };

        const subSkills = questions.reduce((acc, q) => {
          acc[q.sub_skill] = (acc[q.sub_skill] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        console.log(`    ${section}:`);
        console.log(`      Difficulty: Easy=${diffCount.easy}, Medium=${diffCount.medium}, Hard=${diffCount.hard}`);
        console.log(`      Sub-skills (${Object.keys(subSkills).length} unique):`);

        const sortedSkills = Object.entries(subSkills).sort((a, b) => b[1] - a[1]);
        sortedSkills.slice(0, 5).forEach(([skill, count]) => {
          console.log(`        - ${skill}: ${count}`);
        });

        if (sortedSkills.length > 5) {
          console.log(`        ... and ${sortedSkills.length - 5} more`);
        }

        // Check for imbalance
        const total = questions.length;
        const easyPct = (diffCount.easy / total) * 100;
        const mediumPct = (diffCount.medium / total) * 100;
        const hardPct = (diffCount.hard / total) * 100;

        if (easyPct < 20 || easyPct > 50) {
          warnings.push(`${productType} > ${testMode} > ${section}: Easy difficulty at ${easyPct.toFixed(1)}% (expected 25-40%)`);
        }
        if (mediumPct < 30 || mediumPct > 60) {
          warnings.push(`${productType} > ${testMode} > ${section}: Medium difficulty at ${mediumPct.toFixed(1)}% (expected 35-50%)`);
        }
        if (hardPct < 10 || hardPct > 30) {
          warnings.push(`${productType} > ${testMode} > ${section}: Hard difficulty at ${hardPct.toFixed(1)}% (expected 15-25%)`);
        }
      }
    }
  }

  // 3. CHECK READING PASSAGES
  console.log('\n\n═══════════════════════════════════════════════════════');
  console.log('📖 CHECK 3: READING PASSAGE COUNTS & RATIOS');
  console.log('═══════════════════════════════════════════════════════\n');

  for (const [productType, testModes] of Object.entries(grouped)) {
    for (const [testMode, sections] of Object.entries(testModes)) {
      for (const [section, questions] of Object.entries(sections)) {
        const expected = SECTION_REQUIREMENTS[productType]?.[testMode]?.[section];

        if (expected?.passages) {
          const passageIds = new Set(questions.filter(q => q.passage_id).map(q => q.passage_id));
          const actualPassages = passageIds.size;
          const questionsWithPassage = questions.filter(q => q.passage_id).length;

          const status = actualPassages === expected.passages ? '✅' : '❌';
          console.log(`${status} ${productType} > ${testMode} > ${section}:`);
          console.log(`   Passages: ${actualPassages} (expected: ${expected.passages})`);
          console.log(`   Questions with passage: ${questionsWithPassage}/${questions.length}`);

          if (expected.questionsPerPassage && actualPassages > 0) {
            const avgPerPassage = questionsWithPassage / actualPassages;
            console.log(`   Avg questions per passage: ${avgPerPassage.toFixed(1)} (expected: ~${expected.questionsPerPassage})`);

            if (Math.abs(avgPerPassage - expected.questionsPerPassage) > 2) {
              warnings.push(`${productType} > ${testMode} > ${section}: Questions per passage ratio is ${avgPerPassage.toFixed(1)} (expected ~${expected.questionsPerPassage})`);
            }
          }

          if (actualPassages !== expected.passages) {
            issues.push(`${productType} > ${testMode} > ${section}: Has ${actualPassages} passages but needs ${expected.passages}`);
          }
        }
      }
    }
  }

  // 4. CHECK WRITING PROMPTS
  console.log('\n\n═══════════════════════════════════════════════════════');
  console.log('✍️ CHECK 4: WRITING PROMPTS');
  console.log('═══════════════════════════════════════════════════════\n');

  for (const [productType, testModes] of Object.entries(grouped)) {
    for (const [testMode, sections] of Object.entries(testModes)) {
      const writingSection = Object.keys(sections).find(s => s.toLowerCase() === 'writing');
      if (writingSection) {
        const prompts = sections[writingSection];
        const expected = SECTION_REQUIREMENTS[productType]?.[testMode]?.[writingSection];

        console.log(`${productType} > ${testMode} > ${writingSection}: ${prompts.length} prompt(s)${expected ? ` (expected: ${expected.count})` : ''}`);

        prompts.forEach(p => {
          console.log(`  - ${p.question_text.substring(0, 80)}...`);
        });

        if (expected && prompts.length !== expected.count) {
          issues.push(`${productType} > ${testMode} > ${writingSection}: Has ${prompts.length} prompts but needs ${expected.count}`);
        }
      }
    }
  }

  // 5. CHECK FOR DUPLICATES
  console.log('\n\n═══════════════════════════════════════════════════════');
  console.log('🔄 CHECK 5: DUPLICATE DETECTION');
  console.log('═══════════════════════════════════════════════════════\n');

  const duplicates: Array<{ q1: Question; q2: Question; similarity: string }> = [];

  for (const [productType, testModes] of Object.entries(grouped)) {
    for (const [testMode, sections] of Object.entries(testModes)) {
      for (const [section, questions] of Object.entries(sections)) {
        if (section.toLowerCase() === 'writing') continue;

        for (let i = 0; i < questions.length; i++) {
          for (let j = i + 1; j < questions.length; j++) {
            const q1 = questions[i];
            const q2 = questions[j];

            // Exact match
            if (q1.question_text === q2.question_text) {
              duplicates.push({ q1, q2, similarity: 'exact' });
            }
            // Very similar (same sub_skill and similar text)
            else if (q1.sub_skill === q2.sub_skill) {
              const text1 = q1.question_text.toLowerCase().replace(/[^a-z0-9]/g, '');
              const text2 = q2.question_text.toLowerCase().replace(/[^a-z0-9]/g, '');

              if (text1.length > 20 && text2.length > 20) {
                const similarity = calculateSimilarity(text1, text2);
                if (similarity > 0.8) {
                  duplicates.push({ q1, q2, similarity: `${(similarity * 100).toFixed(0)}%` });
                }
              }
            }
          }
        }
      }
    }
  }

  if (duplicates.length > 0) {
    console.log(`⚠️ Found ${duplicates.length} potential duplicates:\n`);
    duplicates.slice(0, 10).forEach(d => {
      console.log(`  ${d.similarity} match: ${d.q1.product_type} > ${d.q1.test_mode} > ${d.q1.section_name}`);
      console.log(`    Q1 (${d.q1.id.substring(0, 8)}): ${d.q1.question_text.substring(0, 60)}...`);
      console.log(`    Q2 (${d.q2.id.substring(0, 8)}): ${d.q2.question_text.substring(0, 60)}...`);
      console.log('');
    });

    if (duplicates.length > 10) {
      console.log(`  ... and ${duplicates.length - 10} more potential duplicates`);
    }
  } else {
    console.log('✅ No duplicates found\n');
  }

  // 6. SPOT CHECK FOR HALLUCINATIONS
  console.log('\n\n═══════════════════════════════════════════════════════');
  console.log('🔬 CHECK 6: SPOT CHECK FOR HALLUCINATIONS');
  console.log('═══════════════════════════════════════════════════════\n');

  const highRiskSubSkills = [
    'numerical-reasoning',
    'pattern-recognition',
    'sequences',
    'problem-solving',
    'advanced-mathematics'
  ];

  for (const subSkill of highRiskSubSkills) {
    const questions = allQuestions.filter(q =>
      q.sub_skill?.toLowerCase().includes(subSkill.toLowerCase()) &&
      q.response_type !== 'writing'
    );

    if (questions.length > 0) {
      console.log(`\n🎯 ${subSkill}: ${questions.length} questions`);

      // Sample 3 random questions
      const samples = questions
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      samples.forEach((q, idx) => {
        console.log(`\n  Sample ${idx + 1} (${q.id.substring(0, 8)}):`);
        console.log(`    ${q.product_type} > ${q.test_mode} > ${q.section_name}`);
        console.log(`    Q: ${q.question_text.substring(0, 100)}...`);

        if (q.answer_options && Array.isArray(q.answer_options)) {
          console.log(`    Options: ${q.answer_options.length} choices`);
        }

        console.log(`    Correct: ${JSON.stringify(q.correct_answer)}`);
        console.log(`    Solution: ${q.solution?.substring(0, 80) || 'N/A'}...`);

        // Basic validation checks
        if (!q.correct_answer) {
          warnings.push(`Question ${q.id}: Missing correct answer`);
        }
        if (!q.solution || q.solution.length < 20) {
          warnings.push(`Question ${q.id}: Solution text too short or missing`);
        }
        if (q.response_type === 'multiple_choice' && (!q.answer_options || q.answer_options.length < 3)) {
          warnings.push(`Question ${q.id}: Multiple choice with insufficient options`);
        }
      });
    }
  }

  // FINAL SUMMARY
  console.log('\n\n═══════════════════════════════════════════════════════');
  console.log('📊 AUDIT SUMMARY');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log(`Total Questions: ${allQuestions.length}`);
  console.log(`Test Packages: ${Object.keys(grouped).length}`);
  console.log(`Critical Issues: ${issues.length}`);
  console.log(`Warnings: ${warnings.length}`);
  console.log(`Potential Duplicates: ${duplicates.length}\n`);

  if (issues.length > 0) {
    console.log('❌ CRITICAL ISSUES:\n');
    issues.forEach((issue, idx) => {
      console.log(`${idx + 1}. ${issue}`);
    });
  }

  if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:\n');
    warnings.forEach((warning, idx) => {
      console.log(`${idx + 1}. ${warning}`);
    });
  }

  if (issues.length === 0 && warnings.length === 0 && duplicates.length === 0) {
    console.log('✅ All checks passed! Database is in good shape.\n');
  }

  console.log('\n═══════════════════════════════════════════════════════\n');
}

function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = getEditDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function getEditDistance(str1: string, str2: string): number {
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

comprehensiveAudit()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
