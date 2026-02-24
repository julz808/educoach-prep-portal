import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

interface ReportAnalysis {
  fileName: string;
  testSection: string;
  totalAttempts: number;
  failedAttempts: number;
  successRate: number;
  errorsBySubSkill: Record<string, number>;
  commonErrors: string[];
}

function extractTestSection(fileName: string): string {
  const match = fileName.match(/post-generation-check-(.+?)-\d{4}-\d{2}-\d{2}/);
  return match ? match[1] : fileName;
}

function analyzeReport(filePath: string): ReportAnalysis {
  const content = readFileSync(filePath, 'utf-8');
  const fileName = filePath.split('/').pop() || '';
  const testSection = extractTestSection(fileName);

  let totalAttempts = 0;
  let failedAttempts = 0;
  const errorsBySubSkill: Record<string, number> = {};
  const commonErrors: string[] = [];

  // Count retry attempts
  const retryMatches = content.match(/Retry attempt \d+/g);
  if (retryMatches) {
    totalAttempts += retryMatches.length;
  }

  // Count "Attempt X" mentions
  const attemptMatches = content.match(/Attempt \d+:/g);
  if (attemptMatches) {
    totalAttempts = Math.max(totalAttempts, attemptMatches.length);
  }

  // Look for failed generation indicators
  if (content.includes('❌ Failed') || content.includes('Generation failed')) {
    failedAttempts++;
  }

  // Look for errors by sub-skill
  const subSkillErrorPattern = /Sub-skill:\s*([^\n]+)[\s\S]*?(Error|Failed|Issue)/gi;
  let match;
  while ((match = subSkillErrorPattern.exec(content)) !== null) {
    const subSkill = match[1].trim();
    errorsBySubSkill[subSkill] = (errorsBySubSkill[subSkill] || 0) + 1;
  }

  // Look for common error patterns
  if (content.includes('hallucination') || content.includes('hallucinated')) {
    commonErrors.push('Hallucination issues');
  }
  if (content.includes('passage not found') || content.includes('missing passage')) {
    commonErrors.push('Passage reference issues');
  }
  if (content.includes('validation failed') || content.includes('schema validation')) {
    commonErrors.push('Validation failures');
  }
  if (content.includes('timeout') || content.includes('timed out')) {
    commonErrors.push('Timeout issues');
  }
  if (content.includes('duplicate')) {
    commonErrors.push('Duplicate questions');
  }

  // Count generation cycles
  const generationCycles = content.match(/Generation cycle|Generating questions/gi)?.length || 1;
  totalAttempts = Math.max(totalAttempts, generationCycles);

  const successRate = totalAttempts > 0 ? ((totalAttempts - failedAttempts) / totalAttempts) * 100 : 100;

  return {
    fileName,
    testSection,
    totalAttempts,
    failedAttempts,
    successRate,
    errorsBySubSkill,
    commonErrors
  };
}

(async () => {
  const reportsDir = './docs/generation-reports';
  const files = readdirSync(reportsDir).filter(f => f.endsWith('.md'));

  console.log('═══════════════════════════════════════════════════════════════════');
  console.log(' GENERATION REPORTS ANALYSIS');
  console.log('═══════════════════════════════════════════════════════════════════\n');
  console.log(`📊 Analyzing ${files.length} generation reports...\n`);

  const analyses: ReportAnalysis[] = [];

  for (const file of files) {
    const filePath = join(reportsDir, file);
    const analysis = analyzeReport(filePath);
    analyses.push(analysis);
  }

  // Sort by most problematic (most failed attempts + lowest success rate)
  analyses.sort((a, b) => {
    const scoreA = a.failedAttempts * 100 + (100 - a.successRate);
    const scoreB = b.failedAttempts * 100 + (100 - b.successRate);
    return scoreB - scoreA;
  });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' MOST PROBLEMATIC SECTIONS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const problematic = analyses.filter(a => a.totalAttempts > 1 || a.commonErrors.length > 0);

  if (problematic.length === 0) {
    console.log('✅ No problematic sections found! All generations went smoothly.\n');
  } else {
    problematic.slice(0, 15).forEach((analysis, idx) => {
      console.log(`${idx + 1}. ${analysis.testSection}`);
      console.log(`   Total Attempts: ${analysis.totalAttempts}`);
      if (analysis.failedAttempts > 0) {
        console.log(`   Failed Attempts: ${analysis.failedAttempts}`);
      }
      if (analysis.commonErrors.length > 0) {
        console.log(`   Issues: ${analysis.commonErrors.join(', ')}`);
      }
      if (Object.keys(analysis.errorsBySubSkill).length > 0) {
        console.log(`   Problem Sub-skills: ${Object.keys(analysis.errorsBySubSkill).join(', ')}`);
      }
      console.log();
    });
  }

  // Aggregate common errors across all reports
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' COMMON ISSUES ACROSS ALL REPORTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const allErrors: Record<string, number> = {};
  analyses.forEach(a => {
    a.commonErrors.forEach(err => {
      allErrors[err] = (allErrors[err] || 0) + 1;
    });
  });

  const sortedErrors = Object.entries(allErrors).sort((a, b) => b[1] - a[1]);

  if (sortedErrors.length === 0) {
    console.log('✅ No common issues detected!\n');
  } else {
    sortedErrors.forEach(([error, count]) => {
      console.log(`   ${error}: ${count} reports`);
    });
    console.log();
  }

  // Summary stats
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' SUMMARY STATISTICS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const totalAttempts = analyses.reduce((sum, a) => sum + a.totalAttempts, 0);
  const totalFailed = analyses.reduce((sum, a) => sum + a.failedAttempts, 0);
  const avgSuccessRate = analyses.reduce((sum, a) => sum + a.successRate, 0) / analyses.length;

  console.log(`   Total Reports: ${analyses.length}`);
  console.log(`   Total Generation Attempts: ${totalAttempts}`);
  console.log(`   Total Failed Attempts: ${totalFailed}`);
  console.log(`   Average Success Rate: ${avgSuccessRate.toFixed(1)}%`);
  console.log(`   Reports with Issues: ${problematic.length}`);
  console.log(`   Clean Reports: ${analyses.length - problematic.length}`);
  console.log('\n═══════════════════════════════════════════════════════════════════\n');
})();
