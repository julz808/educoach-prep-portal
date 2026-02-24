/**
 * Script to update NAPLAN Year 5 curriculum data from 6 difficulty levels to 3
 *
 * Changes:
 * 1. difficulty_range: [1,2,3,4,5,6] → [1,2,3]
 * 2. Remap existing examples:
 *    - difficulty 2,3 → difficulty 1 (Easy)
 *    - difficulty 4 → difficulty 2 (Medium)
 *    - difficulty 5 → difficulty 3 (Hard)
 * 3. Update difficulty_progression from 6 levels to 3 levels
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const filePath = join(process.cwd(), 'src/data/curriculumData_v2/naplan-year5.ts');

console.log('Reading NAPLAN Year 5 file...\n');
let content = readFileSync(filePath, 'utf-8');

// Step 1: Update all difficulty_range declarations
console.log('Step 1: Updating difficulty_range from [1,2,3,4,5,6] to [1,2,3]...');
content = content.replace(/difficulty_range:\s*\[1,\s*2,\s*3,\s*4,\s*5,\s*6\]/g, 'difficulty_range: [1, 2, 3]');
console.log('✓ Updated all difficulty_range declarations\n');

// Step 2: Remap example difficulties
console.log('Step 2: Remapping example difficulties...');
console.log('  - difficulty: 2 or 3 → difficulty: 1 (Easy)');
console.log('  - difficulty: 4 → difficulty: 2 (Medium)');
console.log('  - difficulty: 5 → difficulty: 3 (Hard)');

// Map difficulty 2 → 1
content = content.replace(/difficulty: 2,\s*\n(\s*)question_text:/g, 'difficulty: 1,  // Easy (mapped from old level 2)\n$1question_text:');

// Map difficulty 3 → 2
content = content.replace(/difficulty: 3,\s*\n(\s*)question_text:/g, 'difficulty: 2,  // Medium (mapped from old level 3)\n$1question_text:');

// Map difficulty 4 → 2
content = content.replace(/difficulty: 4,\s*\n(\s*)question_text:/g, 'difficulty: 2,  // Medium (mapped from old level 4)\n$1question_text:');

// Map difficulty 5 → 3
content = content.replace(/difficulty: 5,\s*\n(\s*)question_text:/g, 'difficulty: 3,  // Hard (mapped from old level 5)\n$1question_text:');

console.log('✓ Remapped all example difficulties\n');

// Step 3: Update difficulty_progression objects from 6 levels to 3
console.log('Step 3: Updating difficulty_progression objects...');

// Create mapping of progressions
const progressionUpdates: Array<{match: RegExp, replacement: string}> = [
  // Narrative Writing
  {
    match: /difficulty_progression: \{[\s\S]*?"1": "Simple, concrete prompts with everyday experiences",[\s\S]*?"6": "Highly abstract or challenging prompts requiring advanced storytelling"[\s\S]*?\}/,
    replacement: `difficulty_progression: {
          "1": "Simple, concrete prompts with everyday experiences (e.g., 'Write about your best day')",
          "2": "Moderately creative prompts with clear focus (e.g., 'Write about discovering something amazing')",
          "3": "Complex prompts requiring sophisticated narrative development and creativity"`
  },

  // Persuasive Writing
  {
    match: /difficulty_progression: \{[\s\S]*?"1": "Simple, familiar topics with obvious positions \(e\.g\., should we have longer lunch breaks\)",[\s\S]*?"6": "Abstract or challenging topics requiring advanced persuasive techniques"[\s\S]*?\}/,
    replacement: `difficulty_progression: {
          "1": "Simple, familiar topics with obvious positions (e.g., should we have longer lunch breaks)",
          "2": "Moderately complex issues requiring developed arguments (e.g., more sport at school)",
          "3": "Complex social or environmental issues requiring sophisticated arguments and evidence"`
  },

  // Literal Comprehension
  {
    match: /difficulty_progression: \{[\s\S]*?"1": "Obvious details, simple sentences, familiar topics",[\s\S]*?"6": "Implicit details requiring very careful reading, challenging texts"[\s\S]*?\}/,
    replacement: `difficulty_progression: {
          "1": "Obvious details, simple sentences, familiar topics",
          "2": "Details requiring careful reading, some complex sentences, common topics",
          "3": "Subtle details embedded in complex text, sophisticated vocabulary, challenging topics"`
  },

  // Inferential Comprehension
  {
    match: /difficulty_progression: \{[\s\S]*?"1": "Simple, obvious inferences with clear clues",[\s\S]*?"6": "Subtle implications, challenging texts, multiple valid interpretations"[\s\S]*?\}/,
    replacement: `difficulty_progression: {
          "1": "Simple, obvious inferences with clear clues, familiar contexts",
          "2": "Moderate inferences requiring connection of multiple clues",
          "3": "Sophisticated inference requiring synthesis of multiple pieces of evidence, subtle implications"`
  },

  // Vocabulary in Context
  {
    match: /difficulty_progression: \{[\s\S]*?"1": "Simple words with obvious context clues",[\s\S]*?"6": "Sophisticated words, minimal context support, figurative usage"[\s\S]*?\}/,
    replacement: `difficulty_progression: {
          "1": "Simple words with obvious context clues, common vocabulary",
          "2": "Less common words requiring inference from context, academic vocabulary",
          "3": "Challenging vocabulary with subtle context clues, figurative usage, sophisticated words"`
  },

  // Text Structure & Features
  {
    match: /difficulty_progression: \{[\s\S]*?"1": "Obvious text types and features, simple structures",[\s\S]*?"6": "Challenging organizational patterns, abstract structures"[\s\S]*?\}/,
    replacement: `difficulty_progression: {
          "1": "Obvious text types and features, simple structures (e.g., numbered lists)",
          "2": "Less obvious structures, understanding feature purpose, multiple text features",
          "3": "Sophisticated structures, complex organizational patterns, abstract relationships"`
  },

  // Author's Purpose & Perspective
  {
    match: /difficulty_progression: \{[\s\S]*?"1": "Obvious purposes, clear text types",[\s\S]*?"6": "Sophisticated analysis, multiple layers of meaning, subtle bias"[\s\S]*?\}/,
    replacement: `difficulty_progression: {
          "1": "Obvious purposes, clear text types (e.g., advertisements)",
          "2": "Moderately clear purposes requiring some inference, recognizing basic bias",
          "3": "Subtle purposes, complex perspectives, balanced views, multiple layers of meaning"`
  },

  // Grammar & Sentence Structure
  {
    match: /difficulty_progression: \{[\s\S]*?"1": "Basic agreement and tense with familiar contexts",[\s\S]*?"6": "Advanced grammar concepts, challenging contexts"[\s\S]*?\}/,
    replacement: `difficulty_progression: {
          "1": "Basic agreement and tense with familiar contexts, simple sentences",
          "2": "Clear grammar rules in moderately complex sentences, less obvious errors",
          "3": "Sophisticated structures, subtle errors, advanced grammar concepts"`
  },

  // Spelling
  {
    match: /difficulty_progression: \{[\s\S]*?"1": "Simple, common words with obvious misspellings",[\s\S]*?"6": "Sophisticated words, very subtle spelling issues"[\s\S]*?\}/,
    replacement: `difficulty_progression: {
          "1": "Simple, common words with obvious misspellings, familiar patterns",
          "2": "Less common words, commonly confused spellings, trickier patterns",
          "3": "Challenging vocabulary, complex patterns, commonly misspelled words"`
  },

  // Punctuation
  {
    match: /difficulty_progression: \{[\s\S]*?"1": "Basic end punctuation, obvious errors",[\s\S]*?"6": "Advanced punctuation, nuanced usage"[\s\S]*?\}/,
    replacement: `difficulty_progression: {
          "1": "Basic end punctuation, obvious errors, simple comma rules",
          "2": "More complex comma usage, quotation marks, apostrophes in context",
          "3": "Sophisticated punctuation, multiple marks in complex sentences, subtle errors"`
  },

  // Parts of Speech & Word Choice
  {
    match: /difficulty_progression: \{[\s\S]*?"1": "Basic parts of speech, obvious choices",[\s\S]*?"6": "Sophisticated vocabulary, advanced grammar concepts"[\s\S]*?\}/,
    replacement: `difficulty_progression: {
          "1": "Basic parts of speech, obvious choices, simple word forms",
          "2": "Adverb/adjective distinctions, comparatives, clear contexts",
          "3": "Irregular forms, subtle differences, complex word choices, nuanced meanings"`
  },

  // Number Operations & Place Value
  {
    match: /difficulty_progression: \{[\s\S]*?"1": "Single-digit operations, basic place value",[\s\S]*?"6": "Very difficult mental arithmetic, complex number understanding"[\s\S]*?\}/,
    replacement: `difficulty_progression: {
          "1": "Single and two-digit operations, basic place value, simple mental math",
          "2": "Multi-digit operations, advanced place value, multi-step problems",
          "3": "Challenging mental computation, complex calculations, sophisticated number concepts"`
  },

  // Fractions & Basic Fraction Operations
  {
    match: /difficulty_progression: \{[\s\S]*?"1": "Basic fraction recognition, simple equivalents",[\s\S]*?"6": "Complex fraction problems, multiple steps"[\s\S]*?\}/,
    replacement: `difficulty_progression: {
          "1": "Basic fraction recognition, simple equivalents, common fractions",
          "2": "Fraction operations with like denominators, comparing fractions, fraction of quantity",
          "3": "Complex equivalents, mixed operations, challenging fraction problems"`
  },

  // Patterns & Algebra
  {
    match: /difficulty_progression: \{[\s\S]*?"1": "Simple repeating patterns, obvious sequences",[\s\S]*?"6": "Sophisticated patterns, algebraic thinking"[\s\S]*?\}/,
    replacement: `difficulty_progression: {
          "1": "Simple repeating patterns, obvious arithmetic sequences, basic patterns",
          "2": "More complex patterns, simple equations with one operation",
          "3": "Challenging patterns, multi-step equations, sophisticated algebraic thinking"`
  },

  // Measurement, Time & Money
  {
    match: /difficulty_progression: \{[\s\S]*?"1": "Basic conversions, simple money, telling time",[\s\S]*?"6": "Sophisticated multi-step problems across different units"[\s\S]*?\}/,
    replacement: `difficulty_progression: {
          "1": "Basic conversions, simple money, telling time, standard measurements",
          "2": "Multiple-step conversions, elapsed time calculations, multi-coin problems",
          "3": "Complex time problems, mixed unit calculations, challenging measurement scenarios"`
  },

  // Data & Basic Probability
  {
    match: /difficulty_progression: \{[\s\S]*?"1": "Simple pictographs, obvious data",[\s\S]*?"6": "Sophisticated data analysis, combined probability"[\s\S]*?\}/,
    replacement: `difficulty_progression: {
          "1": "Simple pictographs and bar graphs, obvious data, basic counting",
          "2": "Multiple data sets, comparison questions, basic probability calculations",
          "3": "Complex graphs, interpreting trends, sophisticated probability concepts"`
  }
];

progressionUpdates.forEach(({match, replacement}, index) => {
  if (content.match(match)) {
    content = content.replace(match, replacement + '\n        }');
    console.log(`✓ Updated difficulty_progression ${index + 1}`);
  } else {
    console.log(`⚠ Could not find difficulty_progression ${index + 1}`);
  }
});

console.log('\n✓ Updated all difficulty_progression objects\n');

// Write updated content back to file
console.log('Writing updated file...');
writeFileSync(filePath, content, 'utf-8');
console.log('✓ Successfully updated naplan-year5.ts\n');

console.log('Summary:');
console.log('  - Changed all difficulty_range from [1,2,3,4,5,6] to [1,2,3]');
console.log('  - Remapped existing example difficulties to 3-level scale');
console.log('  - Updated all 16 difficulty_progression objects');
console.log('\n✅ NAPLAN Year 5 successfully converted to 3-level difficulty system!');
