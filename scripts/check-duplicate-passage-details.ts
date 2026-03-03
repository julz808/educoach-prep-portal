import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkDetails() {
  const questionIds = [
    'e783cc47-ab9f-440c-8d78-1dd585e118b5',
    'b124194c-8be8-46ef-879b-208ea325f16f',
    '8f7b9928-0f30-49e0-8929-7c564f092e26',
    'a1137866-348c-4603-a96f-bbcedd2263ef',
    '53e26748-dd01-454b-ba81-6306729ae643',
    '2d03185e-0ab0-4444-b9db-3e3b28302f6f',
    '4da12ea5-60b1-4c0b-a26b-807435612267',
    '3b17f1ff-d713-40d3-9f63-d646e0316301',
    '9a5a9cbe-df58-4e06-ae6d-25fdbeac8418',
    '44619b8c-5863-45c1-a587-eed7fa238f33',
    '47a67a58-5fde-4398-bf8a-8232fa397fa5',
    'a21adfd6-5283-4d89-b31c-4d002dc2ce63',
    '07291ff9-3b1c-4ca7-818f-20fe5fa19ef4',
    '45ea52c7-c1ed-4850-8ac7-6e5d30f83ef5',
    '0558d7c4-1c3f-4ef0-bc01-a1d1df555d42'
  ];

  const { data: questions, error } = await supabase
    .from('questions_v2')
    .select('id, question_text, passage_id, test_type, section_name')
    .in('id', questionIds);

  if (error) {
    console.error('Error:', error);
    return;
  }

  // Get unique passage IDs
  const passageIds = [...new Set(questions?.map((q: any) => q.passage_id).filter(Boolean))];

  const { data: passages } = await supabase
    .from('passages_v2')
    .select('id, content, title')
    .in('id', passageIds);

  console.log('DETAILED ANALYSIS OF 15 FLAGGED QUESTIONS');
  console.log('='.repeat(80));
  console.log();

  let actualDuplicates = 0;
  let justTitleReferences = 0;

  for (const q of questions as any[]) {
    const passage = passages?.find((p: any) => p.id === q.passage_id);
    if (!passage) continue;

    console.log(`Question ID: ${q.id}`);
    console.log(`Test: ${q.test_type} - ${q.section_name}`);
    console.log(`Passage Title: "${passage.title}"`);
    console.log();
    console.log('QUESTION TEXT:');
    console.log('-'.repeat(80));
    console.log(q.question_text);
    console.log();

    // Check if passage content is actually embedded
    const hasPassageContent = q.question_text.includes(passage.content.substring(0, 100));
    const hasPassageKeyword = /Passage:|Read the passage and answer/i.test(q.question_text);
    const questionLength = q.question_text.length;

    console.log('ANALYSIS:');
    console.log(`- Question length: ${questionLength} chars`);
    console.log(`- Passage content length: ${passage.content.length} chars`);
    console.log(`- Contains actual passage content: ${hasPassageContent}`);
    console.log(`- Has "Passage:" or "Read the passage": ${hasPassageKeyword}`);
    console.log(`- Just references title: ${!hasPassageContent && q.question_text.includes(passage.title)}`);

    if (hasPassageContent || (hasPassageKeyword && questionLength > 500)) {
      console.log('⚠️  ACTUAL DUPLICATE - Passage content is embedded in question_text');
      actualDuplicates++;
    } else {
      console.log('✅ OK - Just references the passage title, no duplicate content');
      justTitleReferences++;
    }

    console.log();
    console.log('='.repeat(80));
    console.log();
  }

  console.log('FINAL VERDICT:');
  console.log('='.repeat(80));
  console.log(`Actual duplicates (passage content in question_text): ${actualDuplicates}`);
  console.log(`Just title references (OK): ${justTitleReferences}`);
  console.log();
}

checkDetails();
