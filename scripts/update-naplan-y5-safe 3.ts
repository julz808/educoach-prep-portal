/**
 * SAFE script to update NAPLAN Year 5 curriculum data from 6 difficulty levels to 3
 * This version uses line-by-line processing to avoid greedy regex issues
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const filePath = join(process.cwd(), 'src/data/curriculumData_v2/naplan-year5.ts');

console.log('Reading NAPLAN Year 5 file...\n');
const originalContent = readFileSync(filePath, 'utf-8');
const lines = originalContent.split('\n');

const newLines: string[] = [];
let insideDifficultyProgression = false;
let progressionLevel = 0;

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];

  // Update header comment
  if (line.includes('examples across 6 difficulty levels')) {
    line = line.replace('6 difficulty levels', '3 difficulty levels');
  }

  if (line.includes('NOTE: Year 5 NAPLAN uses 6 difficulty levels')) {
    newLines.push(line.replace('NOTE: Year 5 NAPLAN uses 6 difficulty levels (1-6) based on sample question tags.',
      'NOTE: Year 5 NAPLAN now uses 3 difficulty levels (1-3) for consistency across all products.'));
    newLines.push(line.substring(0, line.indexOf('NOTE')) + ' *   - Level 1 (Easy): Covers original NAPLAN levels 1-2');
    newLines.push(line.substring(0, line.indexOf('NOTE')) + ' *   - Level 2 (Medium): Covers original NAPLAN levels 3-4');
    newLines.push(line.substring(0, line.indexOf('NOTE')) + ' *   - Level 3 (Hard): Covers original NAPLAN levels 5-6');
    continue;
  }

  // Update difficulty_range
  if (line.includes('difficulty_range: [1, 2, 3, 4, 5, 6]')) {
    line = line.replace('[1, 2, 3, 4, 5, 6]', '[1, 2, 3]');
  }

  // Update example difficulties
  if (line.trim().startsWith('difficulty: 2,')) {
    line = line.replace('difficulty: 2,', 'difficulty: 1,  // Easy (mapped from old level 2)');
  }
  if (line.trim().startsWith('difficulty: 3,')) {
    line = line.replace('difficulty: 3,', 'difficulty: 2,  // Medium (mapped from old level 3)');
  }
  if (line.trim().startsWith('difficulty: 4,')) {
    line = line.replace('difficulty: 4,', 'difficulty: 2,  // Medium (mapped from old level 4)');
  }
  if (line.trim().startsWith('difficulty: 5,')) {
    line = line.replace('difficulty: 5,', 'difficulty: 3,  // Hard (mapped from old level 5)');
  }

  // Handle difficulty_progression - skip old 6-level entries and add 3-level ones
  if (line.includes('difficulty_progression: {')) {
    insideDifficultyProgression = true;
    progressionLevel = 0;
    newLines.push(line);
    continue;
  }

  if (insideDifficultyProgression) {
    // Count levels
    if (line.includes('"1":') || line.includes('"2":') || line.includes('"3":') ||
        line.includes('"4":') || line.includes('"5":') || line.includes('"6":')) {
      progressionLevel++;

      // Only keep levels 1, 3, 5 and rename them to 1, 2, 3
      if (progressionLevel === 1) {
        // Level 1 stays as level 1
        newLines.push(line);
      } else if (progressionLevel === 3) {
        // Level 3 becomes level 2
        newLines.push(line.replace('"3":', '"2":'));
      } else if (progressionLevel === 5) {
        // Level 5 becomes level 3
        newLines.push(line.replace('"5":', '"3":'));
      }
      // Skip levels 2, 4, 6
      continue;
    }

    // Check if we're at the closing brace
    if (line.trim() === '}' && progressionLevel > 0) {
      insideDifficultyProgression = false;
      progressionLevel = 0;
      newLines.push(line);
      continue;
    }

    // Skip other lines inside difficulty_progression (they're part of skipped levels)
    if (progressionLevel === 2 || progressionLevel === 4 || progressionLevel === 6) {
      continue;
    }
  }

  newLines.push(line);
}

const newContent = newLines.join('\n');

console.log('Writing updated file...');
writeFileSync(filePath, newContent, 'utf-8');

console.log('✅ Successfully updated naplan-year5.ts!');
console.log('\nChanges made:');
console.log('  ✓ Updated header comments');
console.log('  ✓ Changed all difficulty_range from [1,2,3,4,5,6] to [1,2,3]');
console.log('  ✓ Remapped example difficulties (2→1, 3/4→2, 5→3)');
console.log('  ✓ Updated difficulty_progression to 3 levels (kept levels 1, 3, 5 as new 1, 2, 3)');
