#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface FetchOptions {
  section?: string;
  mode?: string;
  limit?: number;
  offset?: number;
  outputFile?: string;
}

async function fetchQuestions(options: FetchOptions) {
  console.log('\n📥 FETCHING VIC SELECTIVE QUESTIONS');
  console.log('=====================================\n');

  // Build query
  let query = supabase
    .from('questions_v2')
    .select(`
      id,
      test_type,
      test_mode,
      section_name,
      sub_skill,
      question_text,
      answer_options,
      correct_answer,
      solution,
      difficulty,
      passage_id,
      has_visual,
      visual_data,
      visual_svg,
      question_order,
      response_type,
      created_at
    `)
    .eq('test_type', 'VIC Selective Entry (Year 9 Entry)')
    .order('section_name', { ascending: true })
    .order('test_mode', { ascending: true })
    .order('question_order', { ascending: true });

  // Apply filters
  if (options.section) {
    query = query.eq('section_name', options.section);
    console.log(`🔍 Filtering by section: ${options.section}`);
  }

  if (options.mode) {
    query = query.eq('test_mode', options.mode);
    console.log(`🔍 Filtering by mode: ${options.mode}`);
  }

  if (options.limit) {
    query = query.limit(options.limit);
    console.log(`🔢 Limit: ${options.limit} questions`);
  }

  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 1000) - 1);
    console.log(`⏭️  Offset: ${options.offset}`);
  }

  // Execute query
  const { data: questions, error } = await query;

  if (error) {
    console.error('❌ Error fetching questions:', error);
    return;
  }

  if (!questions || questions.length === 0) {
    console.log('⚠️  No questions found matching criteria');
    return;
  }

  console.log(`\n✅ Fetched ${questions.length} questions\n`);

  // Fetch passages for questions that have passage_id
  const passageIds = [...new Set(questions
    .filter((q) => q.passage_id)
    .map((q) => q.passage_id))];

  let passages: any[] = [];
  if (passageIds.length > 0) {
    console.log(`📖 Fetching ${passageIds.length} passages...\n`);
    const { data: passageData, error: passageError } = await supabase
      .from('passages_v2')
      .select('*')
      .in('id', passageIds);

    if (passageError) {
      console.error('❌ Error fetching passages:', passageError);
    } else {
      passages = passageData || [];
    }
  }

  // Create passages map for easy lookup
  const passageMap = new Map(passages.map((p) => [p.id, p]));

  // Display questions
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  questions.forEach((q, index) => {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`QUESTION ${index + 1} of ${questions.length}`);
    console.log(`${'='.repeat(70)}`);
    console.log(`\n📌 ID: ${q.id}`);
    console.log(`📝 Section: ${q.section_name}`);
    console.log(`🎯 Mode: ${q.test_mode}`);
    console.log(`📊 Order: ${q.question_order}`);
    console.log(`🎓 Sub-skill: ${q.sub_skill || 'N/A'}`);
    console.log(`⭐ Difficulty: ${q.difficulty}/5`);
    console.log(`📋 Response Type: ${q.response_type}`);

    // Show passage if exists
    if (q.passage_id) {
      const passage = passageMap.get(q.passage_id);
      if (passage) {
        console.log(`\n${'─'.repeat(70)}`);
        console.log('📖 PASSAGE:');
        console.log(`${'─'.repeat(70)}`);
        console.log(passage.passage_text);
        console.log(`${'─'.repeat(70)}`);
      }
    }

    // Show visual indicator
    if (q.has_visual) {
      console.log(`\n🎨 HAS VISUAL CONTENT`);
      if (q.visual_svg) {
        console.log(`\n${q.visual_svg}`);
      } else if (q.visual_data) {
        console.log(`\nVisual Data: ${JSON.stringify(q.visual_data, null, 2)}`);
      }
    }

    console.log(`\n${'─'.repeat(70)}`);
    console.log('❓ QUESTION:');
    console.log(`${'─'.repeat(70)}`);
    console.log(q.question_text);

    console.log(`\n${'─'.repeat(70)}`);
    console.log('📝 OPTIONS:');
    console.log(`${'─'.repeat(70)}`);
    if (Array.isArray(q.answer_options)) {
      q.answer_options.forEach((option: string) => {
        const isCorrect = option.charAt(0) === q.correct_answer;
        console.log(`${isCorrect ? '✓' : ' '} ${option}`);
      });
    } else {
      console.log('⚠️  Options not properly formatted');
      console.log(JSON.stringify(q.answer_options, null, 2));
    }

    console.log(`\n${'─'.repeat(70)}`);
    console.log('✅ CORRECT ANSWER (DATABASE):');
    console.log(`${'─'.repeat(70)}`);
    console.log(`➤ ${q.correct_answer}`);

    console.log(`\n${'─'.repeat(70)}`);
    console.log('💡 SOLUTION (DATABASE):');
    console.log(`${'─'.repeat(70)}`);
    console.log(q.solution || '⚠️  No solution provided');

    console.log(`\n${'='.repeat(70)}\n`);
  });

  // Save to file if requested
  if (options.outputFile) {
    const outputPath = path.join(
      __dirname,
      '../logs',
      options.outputFile
    );

    const output = {
      metadata: {
        fetched_at: new Date().toISOString(),
        section: options.section || 'all',
        mode: options.mode || 'all',
        total_questions: questions.length,
        total_passages: passages.length,
      },
      questions: questions.map((q) => ({
        ...q,
        passage: q.passage_id ? passageMap.get(q.passage_id) : null,
      })),
    };

    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log(`\n💾 Saved to: ${outputPath}\n`);
  }

  // Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📊 SUMMARY');
  console.log(`   Total Questions: ${questions.length}`);
  console.log(`   Passage-Based Questions: ${questions.filter((q) => q.passage_id).length}`);
  console.log(`   Visual Questions: ${questions.filter((q) => q.has_visual).length}`);
  console.log(`   Unique Passages: ${passages.length}`);
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// Parse command line arguments
const args = process.argv.slice(2);
const options: FetchOptions = {};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg.startsWith('--section=')) {
    options.section = arg.split('=')[1];
  } else if (arg.startsWith('--mode=')) {
    options.mode = arg.split('=')[1];
  } else if (arg.startsWith('--limit=')) {
    options.limit = parseInt(arg.split('=')[1]);
  } else if (arg.startsWith('--offset=')) {
    options.offset = parseInt(arg.split('=')[1]);
  } else if (arg.startsWith('--output=')) {
    options.outputFile = arg.split('=')[1];
  }
}

// Show usage if no arguments
if (args.length === 0) {
  console.log(`
VIC SELECTIVE QUESTIONS FETCHER
================================

Usage:
  npx tsx --env-file=.env questions-audit/AUDIT_v2/scripts/fetch-questions.ts [OPTIONS]

Options:
  --section=<name>    Filter by section name
  --mode=<mode>       Filter by test mode
  --limit=<number>    Limit number of questions
  --offset=<number>   Skip first N questions
  --output=<file>     Save results to file in logs/

Examples:
  # Fetch Mathematics Reasoning - Practice Test 1
  npx tsx --env-file=.env questions-audit/AUDIT_v2/scripts/fetch-questions.ts \\
    --section="Mathematics Reasoning" \\
    --mode="practice_1"

  # Fetch first 10 questions from any section
  npx tsx --env-file=.env questions-audit/AUDIT_v2/scripts/fetch-questions.ts \\
    --limit=10

  # Fetch and save to file
  npx tsx --env-file=.env questions-audit/AUDIT_v2/scripts/fetch-questions.ts \\
    --section="Mathematics Reasoning" \\
    --mode="practice_1" \\
    --output="math_p1.json"

Valid Sections:
  - "Mathematics Reasoning"
  - "General Ability - Quantitative"
  - "General Ability - Verbal"
  - "Reading Reasoning"

Valid Modes:
  - "practice_1", "practice_2", "practice_3", "practice_4", "practice_5"
  - "diagnostic"
  - "drill"
  `);
  process.exit(0);
}

fetchQuestions(options);
