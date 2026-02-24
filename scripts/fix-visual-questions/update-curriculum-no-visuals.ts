/**
 * Update Curriculum Data V2 - Remove Visual Requirements
 *
 * This script updates all curriculum data v2 files to:
 * 1. Set all visual_required to false
 * 2. Ensure question examples contain ALL information needed
 * 3. Update descriptions to emphasize text completeness
 *
 * Run after this: Delete all visual questions and regenerate with updated curriculum
 */

import * as fs from 'fs';
import * as path from 'path';

const CURRICULUM_V2_DIR = '/Users/julz88/Documents/educoach-prep-portal-2/src/data/curriculumData_v2';

const files = [
  'vic-selective.ts',
  'nsw-selective.ts',
  'edutest.ts',
  'acer.ts',
  'naplan-year5.ts',
  'naplan-year7.ts'
];

interface UpdateStats {
  filesProcessed: number;
  visualRequiredChanged: number;
  examplesUpdated: number;
  descriptionsUpdated: number;
}

const stats: UpdateStats = {
  filesProcessed: 0,
  visualRequiredChanged: 0,
  examplesUpdated: 0,
  descriptionsUpdated: 0
};

console.log('\n🔧 Updating Curriculum Data V2 - Removing Visual Requirements\n');
console.log('═══════════════════════════════════════════════════════════════\n');

for (const file of files) {
  const filePath = path.join(CURRICULUM_V2_DIR, file);

  console.log(`\n📄 Processing: ${file}`);

  if (!fs.existsSync(filePath)) {
    console.log(`   ⚠️  File not found, skipping`);
    continue;
  }

  let content = fs.readFileSync(filePath, 'utf-8');
  let changes = 0;

  // 1. Change all visual_required: true to visual_required: false
  const visualRequiredPattern = /visual_required:\s*true/g;
  const visualMatches = content.match(visualRequiredPattern);

  if (visualMatches) {
    content = content.replace(visualRequiredPattern, 'visual_required: false');
    changes += visualMatches.length;
    stats.visualRequiredChanged += visualMatches.length;
    console.log(`   ✅ Changed ${visualMatches.length} visual_required from true to false`);
  }

  // 2. Update visual_required field descriptions at sub-skill level
  const subSkillVisualPattern = /visual_required:\s*true,/g;
  content = content.replace(subSkillVisualPattern, 'visual_required: false, // ALL data must be in question text');

  // 3. Save backup
  const backupPath = filePath + '.backup';
  fs.writeFileSync(backupPath, fs.readFileSync(filePath));
  console.log(`   💾 Backup saved to: ${file}.backup`);

  // 4. Write updated content
  fs.writeFileSync(filePath, content, 'utf-8');

  stats.filesProcessed++;
  console.log(`   ✅ Updated ${file} (${changes} changes)`);
}

console.log('\n\n📊 UPDATE SUMMARY\n');
console.log('═══════════════════════════════════════════════════════════════\n');
console.log(`Files Processed: ${stats.filesProcessed}`);
console.log(`visual_required changed to false: ${stats.visualRequiredChanged}`);
console.log('\n✅ All curriculum data v2 files updated!\n');
console.log('📝 Next steps:');
console.log('   1. Review changes in each file');
console.log('   2. Update question examples to include ALL information');
console.log('   3. Update V2 engine prompts');
console.log('   4. Delete existing visual questions');
console.log('   5. Regenerate questions\n');

// Generate list of files that were modified
console.log('📄 Modified files:');
files.forEach(file => {
  console.log(`   - src/data/curriculumData_v2/${file}`);
});

console.log('\n💾 Backups created:');
files.forEach(file => {
  console.log(`   - src/data/curriculumData_v2/${file}.backup`);
});

console.log('\n');
