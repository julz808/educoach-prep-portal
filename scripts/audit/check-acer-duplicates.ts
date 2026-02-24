import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Question {
  id: string;
  product_type: string;
  test_mode: string;
  section_name: string;
  question_text: string;
  sub_skill: string;
  difficulty: number;
}

async function checkACERDuplicates() {
  console.log('🔍 Checking ACER Scholarship Questions for Duplicates...\n');

  // Fetch all ACER questions
  let allQuestions: Question[] = [];
  let from = 0;
  const batchSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('questions_v2')
      .select('id, product_type, test_mode, section_name, question_text, sub_skill, difficulty')
      .eq('product_type', 'ACER Scholarship (Year 7 Entry)')
      .range(from, from + batchSize - 1);

    if (error) {
      console.error('Error:', error);
      return;
    }

    if (!data || data.length === 0) break;
    allQuestions = allQuestions.concat(data);
    from += batchSize;
    if (data.length < batchSize) break;
  }

  console.log(`Total ACER questions: ${allQuestions.length}\n`);

  // Group by section
  const sections = allQuestions.reduce((acc, q) => {
    const key = `${q.test_mode} > ${q.section_name}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(q);
    return acc;
  }, {} as Record<string, Question[]>);

  console.log('═══════════════════════════════════════════════════════');
  console.log('DUPLICATE DETECTION');
  console.log('═══════════════════════════════════════════════════════\n');

  let totalDuplicates = 0;

  for (const [sectionKey, questions] of Object.entries(sections)) {
    const duplicates: Array<{ q1: Question; q2: Question; similarity: number }> = [];

    // Check for duplicates within this section
    for (let i = 0; i < questions.length; i++) {
      for (let j = i + 1; j < questions.length; j++) {
        const q1 = questions[i];
        const q2 = questions[j];

        // Exact match
        if (q1.question_text === q2.question_text) {
          duplicates.push({ q1, q2, similarity: 1.0 });
        }
        // High similarity
        else {
          const similarity = calculateSimilarity(
            q1.question_text.toLowerCase().replace(/[^a-z0-9]/g, ''),
            q2.question_text.toLowerCase().replace(/[^a-z0-9]/g, '')
          );
          if (similarity > 0.85) {
            duplicates.push({ q1, q2, similarity });
          }
        }
      }
    }

    if (duplicates.length > 0) {
      console.log(`\n📦 ${sectionKey}`);
      console.log(`   Questions: ${questions.length}`);
      console.log(`   Duplicates found: ${duplicates.length}\n`);

      // Show first 3 examples
      duplicates.slice(0, 3).forEach((dup, idx) => {
        const simPct = (dup.similarity * 100).toFixed(1);
        console.log(`   Example ${idx + 1} - ${simPct}% match:`);
        console.log(`   ────────────────────────────────────────`);
        console.log(`   Question 1 (${dup.q1.id.substring(0, 8)}):`);
        console.log(`   ${dup.q1.question_text.substring(0, 200)}...`);
        console.log(``);
        console.log(`   Question 2 (${dup.q2.id.substring(0, 8)}):`);
        console.log(`   ${dup.q2.question_text.substring(0, 200)}...`);
        console.log(``);
        console.log(`   Same sub-skill? ${dup.q1.sub_skill === dup.q2.sub_skill ? 'YES' : 'NO'}`);
        console.log(`   Same difficulty? ${dup.q1.difficulty === dup.q2.difficulty ? 'YES' : 'NO'}`);
        console.log(``);
      });

      if (duplicates.length > 3) {
        console.log(`   ... and ${duplicates.length - 3} more duplicates in this section\n`);
      }

      totalDuplicates += duplicates.length;
    }
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log(`TOTAL DUPLICATES FOUND: ${totalDuplicates}`);
  console.log('═══════════════════════════════════════════════════════\n');

  if (totalDuplicates === 0) {
    console.log('✅ No duplicates detected!');
  } else {
    console.log('⚠️  Duplicates detected. These may need review.');
    console.log('Note: Some "duplicates" may be legitimate questions from');
    console.log('the same passage with different focus areas.');
  }
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

checkACERDuplicates()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
