import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function investigate() {
  console.log('INVESTIGATING FINAL 115 REMAINING ISSUES');
  console.log('='.repeat(100));
  console.log();

  // Sample IDs from the verification output
  const sampleIds = [
    'd69c03b4-609d-4f17-b375-71a416d05184',
    'f49c1984-f42d-4fb1-a092-ff1f5dfa1f04',
    '25030c92-bcf1-438e-9f06-20cf7ff5a4de',
    '8851176d-69ef-4d67-831a-c2f80fcaaa06',
    '036fa469-a8da-4da5-b93b-5fe40c8f43bb'
  ];

  for (const id of sampleIds) {
    const { data: question } = await supabase
      .from('questions_v2')
      .select('*')
      .eq('id', id)
      .single();

    if (!question) continue;

    console.log('Question ID:', question.id);
    console.log('Test:', question.test_type, '|', question.section_name);
    console.log('Question length:', question.question_text.length, 'chars');
    console.log();
    console.log('FULL QUESTION TEXT:');
    console.log('='.repeat(100));
    console.log(question.question_text);
    console.log('='.repeat(100));
    console.log();

    if (question.passage_id) {
      const { data: passage } = await supabase
        .from('passages_v2')
        .select('*')
        .eq('id', question.passage_id)
        .single();

      if (passage) {
        console.log('PASSAGE INFO:');
        console.log('  Title:', passage.title);
        console.log('  Length:', passage.content.length, 'chars');
        console.log();
        console.log('PASSAGE CONTENT:');
        console.log('-'.repeat(100));
        console.log(passage.content);
        console.log('-'.repeat(100));
        console.log();

        // Analyze the structure
        console.log('ANALYSIS:');

        // Check if passage is quoted in question
        const hasQuotes = question.question_text.includes('"');
        console.log('  - Has quotes:', hasQuotes);

        // Check if it starts with "Read the following passage:"
        const startsWithRead = question.question_text.startsWith('Read the following passage:');
        console.log('  - Starts with "Read the following passage":', startsWithRead);

        // Check format
        const hasPassageKeyword = /Passage:/i.test(question.question_text);
        console.log('  - Has "Passage:" keyword:', hasPassageKeyword);

        // Check if entire passage is embedded
        const passageInQuestion = question.question_text.includes(passage.content.substring(0, 100));
        console.log('  - Full passage embedded:', passageInQuestion);

        // Try to identify where the actual question is
        const lines = question.question_text.split('\n');
        console.log('  - Number of lines:', lines.length);
        console.log('  - Last line:', lines[lines.length - 1]);

        console.log();
      }
    }

    console.log('\n' + '='.repeat(100) + '\n');
  }

  // Now scan ALL remaining to find patterns
  console.log('SCANNING ALL REMAINING ISSUES FOR PATTERNS...');
  console.log('='.repeat(100));
  console.log();

  // Fetch all questions with passages
  let allQuestions: any[] = [];
  let from = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data } = await supabase
      .from('questions_v2')
      .select('id, question_text, passage_id, test_type, section_name')
      .not('passage_id', 'is', null)
      .range(from, from + pageSize - 1);

    if (data && data.length > 0) {
      allQuestions = allQuestions.concat(data);
      from += pageSize;
      hasMore = data.length === pageSize;
    } else {
      hasMore = false;
    }
  }

  // Get passages
  const passageIds = [...new Set(allQuestions.map((q: any) => q.passage_id))];
  const passageMap = new Map();

  const batchSize = 100;
  for (let i = 0; i < passageIds.length; i += batchSize) {
    const batch = passageIds.slice(i, i + batchSize);
    const { data: passages } = await supabase
      .from('passages_v2')
      .select('id, content, title')
      .in('id', batch);

    if (passages) {
      passages.forEach((p: any) => passageMap.set(p.id, p));
    }
  }

  // Find remaining issues
  const remaining: any[] = [];

  for (const q of allQuestions) {
    const passage = passageMap.get(q.passage_id);
    if (!passage) continue;

    const questionText = q.question_text || '';
    const passageContent = passage.content || '';

    const passageStart = passageContent.substring(0, 150).trim();
    const hasPassageContent = passageStart.length > 50 && questionText.includes(passageStart);

    const hasPassageIndicator = /Passage:|Read the passage and answer|Read the following passage/i.test(questionText);
    const isVeryLong = questionText.length > 600;

    if (hasPassageContent || (hasPassageIndicator && isVeryLong)) {
      remaining.push({
        id: q.id,
        questionText: q.question_text,
        passageContent: passage.content,
        testType: q.test_type,
        sectionName: q.section_name,
        questionLength: questionText.length,
        passageLength: passageContent.length
      });
    }
  }

  console.log(`Total remaining: ${remaining.length}\n`);

  // Analyze patterns
  const patterns: any = {
    'has_quotes': 0,
    'starts_with_read_following': 0,
    'has_passage_keyword': 0,
    'vic_reading': 0,
    'nsw_reading': 0,
    'other': 0
  };

  for (const r of remaining) {
    if (r.questionText.includes('"')) patterns.has_quotes++;
    if (r.questionText.startsWith('Read the following passage:')) patterns.starts_with_read_following++;
    if (/Passage:/i.test(r.questionText)) patterns.has_passage_keyword++;
    if (r.testType.includes('VIC') && r.sectionName.includes('Reading')) patterns.vic_reading++;
    if (r.testType.includes('NSW') && r.sectionName.includes('Reading')) patterns.nsw_reading++;
  }

  console.log('PATTERNS IN REMAINING ISSUES:');
  console.log('  - Has quotes: ', patterns.has_quotes);
  console.log('  - Starts with "Read the following passage": ', patterns.starts_with_read_following);
  console.log('  - Has "Passage:" keyword: ', patterns.has_passage_keyword);
  console.log('  - VIC Reading: ', patterns.vic_reading);
  console.log('  - NSW Reading: ', patterns.nsw_reading);
  console.log();

  // Group by test type and section
  const byType: any = {};
  for (const r of remaining) {
    const key = `${r.testType} | ${r.sectionName}`;
    byType[key] = (byType[key] || 0) + 1;
  }

  console.log('BREAKDOWN BY TEST TYPE:');
  for (const [key, count] of Object.entries(byType).sort((a: any, b: any) => b[1] - a[1])) {
    console.log(`  ${key}: ${count}`);
  }
  console.log();
}

investigate();
