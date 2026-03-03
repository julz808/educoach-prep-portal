import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function analyzeRemaining() {
  console.log('ANALYZING REMAINING 366 DUPLICATE PASSAGE ISSUES');
  console.log('='.repeat(100));
  console.log();

  // Fetch ALL questions with passage_id
  let allQuestions: any[] = [];
  let from = 0;
  const pageSize = 1000;
  let hasMore = true;

  console.log('Fetching questions...');

  while (hasMore) {
    const { data, error } = await supabase
      .from('questions_v2')
      .select('id, question_text, passage_id, test_type, section_name')
      .not('passage_id', 'is', null)
      .range(from, from + pageSize - 1);

    if (error) {
      console.error('Error:', error);
      return;
    }

    if (data && data.length > 0) {
      allQuestions = allQuestions.concat(data);
      from += pageSize;
      hasMore = data.length === pageSize;
    } else {
      hasMore = false;
    }
  }

  console.log(`Fetched ${allQuestions.length} questions with passages\n`);

  // Get unique passage IDs
  const passageIds = [...new Set(allQuestions.map(q => q.passage_id))];

  // Fetch passages
  const { data: passages } = await supabase
    .from('passages_v2')
    .select('id, content, title')
    .in('id', passageIds);

  const passageMap = new Map();
  passages?.forEach((p: any) => passageMap.set(p.id, p));

  console.log(`Fetched ${passages?.length || 0} passages\n`);

  // Find remaining issues
  const remainingIssues: any[] = [];

  for (const q of allQuestions) {
    const passage = passageMap.get(q.passage_id);
    if (!passage) continue;

    const questionText = q.question_text || '';
    const passageContent = passage.content || '';

    const passageStart = passageContent.substring(0, 150).trim();
    const hasPassageContent = passageStart.length > 50 && questionText.includes(passageStart);

    const hasPassageIndicator = /Passage:|Read the passage and answer/i.test(questionText);
    const isVeryLong = questionText.length > 600;

    if (hasPassageContent || (hasPassageIndicator && isVeryLong)) {
      remainingIssues.push({
        id: q.id,
        questionText: q.question_text,
        passageId: q.passage_id,
        passageTitle: passage.title,
        passageContent: passage.content,
        testType: q.test_type,
        sectionName: q.section_name,
        questionLength: questionText.length
      });
    }
  }

  console.log(`Found ${remainingIssues.length} remaining issues\n`);

  // Analyze characteristics
  console.log('CHARACTERISTICS OF REMAINING ISSUES:');
  console.log('='.repeat(100));
  console.log();

  // Length distribution
  const lengthDistribution: any = {
    '600-800': 0,
    '800-1000': 0,
    '1000-1500': 0,
    '1500-2000': 0,
    '2000+': 0
  };

  for (const issue of remainingIssues) {
    const len = issue.questionLength;
    if (len < 800) lengthDistribution['600-800']++;
    else if (len < 1000) lengthDistribution['800-1000']++;
    else if (len < 1500) lengthDistribution['1000-1500']++;
    else if (len < 2000) lengthDistribution['1500-2000']++;
    else lengthDistribution['2000+']++;
  }

  console.log('Length Distribution:');
  for (const [range, count] of Object.entries(lengthDistribution)) {
    console.log(`  ${range} chars: ${count} questions`);
  }
  console.log();

  // Sample questions
  console.log('SAMPLE QUESTIONS (showing structure):');
  console.log('='.repeat(100));
  console.log();

  for (let i = 0; i < Math.min(3, remainingIssues.length); i++) {
    const issue = remainingIssues[i];
    console.log(`Question ID: ${issue.id}`);
    console.log(`Test: ${issue.testType} | ${issue.sectionName}`);
    console.log(`Passage: ${issue.passageTitle}`);
    console.log(`Question length: ${issue.questionLength} chars`);
    console.log(`Passage length: ${issue.passageContent.length} chars`);
    console.log();
    console.log('Full question text:');
    console.log('-'.repeat(100));
    console.log(issue.questionText);
    console.log();
    console.log('='.repeat(100));
    console.log();
  }

  // Save remaining IDs
  fs.writeFileSync(
    'remaining-duplicate-passage-ids.txt',
    remainingIssues.map(i => i.id).join('\n')
  );

  console.log('✓ Saved remaining IDs to: remaining-duplicate-passage-ids.txt');
  console.log();
}

analyzeRemaining();
