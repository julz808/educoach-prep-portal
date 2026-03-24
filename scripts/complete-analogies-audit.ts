#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface AnalogiesQuestion {
  id: string;
  test_mode: string;
  question_order: number;
  question_text: string;
  answer_options: string[];
  correct_answer: string;
  solution: string;
}

function extractLetters(optionText: string): string {
  return optionText.replace(/^[A-E]\)\s*/, '').trim();
}

function parseAnalogy(questionText: string): { word1: string; word2: string; word3: string } | null {
  // Match patterns like "CAT is to KITTEN as DOG is to"
  const match1 = questionText.match(/(\w+)\s+is\s+to\s+(\w+)\s+as\s+(\w+)\s+is\s+to/i);
  if (match1) {
    return { word1: match1[1], word2: match1[2], word3: match1[3] };
  }

  // Match patterns like "TEACHER : SCHOOL :: DOCTOR :"
  const match2 = questionText.match(/(\w+)\s*:\s*(\w+)\s*::\s*(\w+)\s*:/i);
  if (match2) {
    return { word1: match2[1], word2: match2[2], word3: match2[3] };
  }

  // Match patterns with parentheses like "(HOT : COLD) :: (UP : ?)"
  const match3 = questionText.match(/\(?\s*(\w+)\s*:\s*(\w+)\s*\)?\s*::\s*\(?\s*(\w+)\s*:\s*\??/i);
  if (match3) {
    return { word1: match3[1], word2: match3[2], word3: match3[3] };
  }

  return null;
}

function determineRelationship(word1: string, word2: string): string {
  // Convert to uppercase for consistency
  const w1 = word1.toUpperCase();
  const w2 = word2.toUpperCase();

  // Common relationships (this is a basic heuristic - real analogies need domain knowledge)
  const relationships: { [key: string]: string } = {
    // Antonyms
    'HOT:COLD': 'antonym',
    'UP:DOWN': 'antonym',
    'HAPPY:SAD': 'antonym',
    'BIG:SMALL': 'antonym',
    'LIGHT:DARK': 'antonym',
    'FAST:SLOW': 'antonym',

    // Part-whole
    'WHEEL:CAR': 'part_of',
    'PAGE:BOOK': 'part_of',
    'FINGER:HAND': 'part_of',

    // Category/Type
    'CAT:KITTEN': 'adult_to_young',
    'DOG:PUPPY': 'adult_to_young',
    'COW:CALF': 'adult_to_young',
    'HORSE:FOAL': 'adult_to_young',

    // Location
    'TEACHER:SCHOOL': 'person_to_place',
    'DOCTOR:HOSPITAL': 'person_to_place',
    'PILOT:PLANE': 'person_to_vehicle',
    'CHEF:KITCHEN': 'person_to_place',

    // Tool/Function
    'HAMMER:NAIL': 'tool_to_object',
    'PEN:WRITE': 'tool_to_action',
    'KNIFE:CUT': 'tool_to_action',
  };

  const key = `${w1}:${w2}`;
  return relationships[key] || 'unknown';
}

async function main() {
  const { data: questions, error } = await supabase
    .from('questions_v2')
    .select('*')
    .eq('test_type', 'VIC Selective Entry (Year 9 Entry)')
    .eq('sub_skill', 'Analogies - Word Relationships')
    .in('test_mode', ['practice_1', 'practice_2', 'practice_3', 'practice_4', 'practice_5'])
    .order('test_mode')
    .order('question_order');

  if (error || !questions) {
    console.error('Error:', error);
    return;
  }

  const results = [];
  let totalErrors = 0;
  let cannotAnalyze = 0;

  console.log(`Auditing ${questions.length} Analogies questions...\n`);
  console.log('⚠️  NOTE: Analogies require semantic/domain knowledge.');
  console.log('This audit will flag questions for MANUAL REVIEW.\n');
  console.log('='.repeat(80));

  for (const q of questions as AnalogiesQuestion[]) {
    const parsed = parseAnalogy(q.question_text);

    if (!parsed) {
      cannotAnalyze++;
      console.log(`⚠️  CANNOT PARSE: ${q.test_mode} Q${q.question_order}`);
      console.log(`   Question: ${q.question_text.substring(0, 100)}...`);
      console.log(`   ID: ${q.id}`);
      console.log('');

      results.push({
        id: q.id,
        test_mode: q.test_mode,
        question_order: q.question_order,
        question_text: q.question_text,
        stored_answer: q.correct_answer,
        parsed: false,
        needs_manual_review: true
      });
      continue;
    }

    const { word1, word2, word3 } = parsed;
    const relationship = determineRelationship(word1, word2);

    // Get stored answer value
    const storedIndex = q.correct_answer.charCodeAt(0) - 65;
    let storedValue = '';
    if (storedIndex >= 0 && storedIndex < q.answer_options.length) {
      storedValue = extractLetters(q.answer_options[storedIndex]);
    }

    console.log(`📝 ${q.test_mode} Q${q.question_order}: ${word1} : ${word2} :: ${word3} : ?`);
    console.log(`   Relationship detected: ${relationship}`);
    console.log(`   Stored answer: ${q.correct_answer} (${storedValue})`);
    console.log(`   Options: ${q.answer_options.map(extractLetters).join(', ')}`);

    // Flag for manual review if relationship unknown
    if (relationship === 'unknown') {
      console.log(`   ⚠️  NEEDS MANUAL REVIEW - Unknown relationship pattern`);
      console.log(`   Solution says: ${q.solution.substring(0, 150)}...`);
      totalErrors++;
    }

    console.log('');

    results.push({
      id: q.id,
      test_mode: q.test_mode,
      question_order: q.question_order,
      question_text: q.question_text,
      word1,
      word2,
      word3,
      relationship,
      stored_answer: q.correct_answer,
      stored_value: storedValue,
      options: q.answer_options.map(extractLetters),
      solution: q.solution,
      needs_manual_review: relationship === 'unknown',
      parsed: true
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log('ANALOGIES AUDIT SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total questions: ${questions.length}`);
  console.log(`Successfully parsed: ${questions.length - cannotAnalyze}`);
  console.log(`Could not parse: ${cannotAnalyze}`);
  console.log(`Flagged for manual review: ${results.filter(r => r.needs_manual_review).length}`);
  console.log('\n⚠️  IMPORTANT: All analogies questions require expert manual review.');
  console.log('This script identifies parsing issues and flags unusual patterns.');
  console.log('A subject matter expert should verify the semantic relationships.\n');

  // Save results
  fs.writeFileSync(
    '/tmp/analogies_complete_audit.json',
    JSON.stringify({
      summary: {
        total: questions.length,
        cannot_parse: cannotAnalyze,
        needs_review: results.filter(r => r.needs_manual_review).length
      },
      results
    }, null, 2)
  );
  console.log('Results saved to /tmp/analogies_complete_audit.json');

  // Create manual review list
  const reviewList = results
    .filter(r => r.needs_manual_review || !r.parsed)
    .map(r => ({
      id: r.id,
      test_mode: r.test_mode,
      question_order: r.question_order,
      question: r.question_text,
      stored_answer: r.stored_answer,
      reason: !r.parsed ? 'Cannot parse question format' : 'Unknown relationship pattern'
    }));

  fs.writeFileSync(
    '/tmp/analogies_manual_review_needed.json',
    JSON.stringify(reviewList, null, 2)
  );
  console.log(`Manual review list saved: ${reviewList.length} questions need expert verification`);
}

main();
