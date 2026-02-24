import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

interface ReportData {
  fileName: string;
  testType: string;
  section: string;
  questionsGenerated: number;
  totalFailures: number;
  totalReattempts: number;
  totalCost: number;
  failedSubSkills: Array<{ name: string; failureCount: number; successRate: number }>;
}

function parseReport(filePath: string): ReportData | null {
  const content = readFileSync(filePath, 'utf-8');
  const fileName = filePath.split('/').pop() || '';

  // Extract test type and section
  const testTypeMatch = content.match(/\*\*Test Type:\*\* (.+)/);
  const sectionMatch = content.match(/\*\*Section:\*\* (.+)/);

  if (!testTypeMatch || !sectionMatch) return null;

  const testType = testTypeMatch[1].trim();
  const section = sectionMatch[1].trim();

  // Extract summary metrics
  const questionsMatch = content.match(/\| Questions Generated This Run \| (\d+) \|/);
  const failuresMatch = content.match(/\| Total Failures \(exhausted retries\) \| (\d+) \|/);
  const reattemptsMatch = content.match(/\| Total Reattempts \| (\d+) \|/);
  const costMatch = content.match(/\| Total Cost \| \$([0-9.]+) \|/);

  const questionsGenerated = questionsMatch ? parseInt(questionsMatch[1]) : 0;
  const totalFailures = failuresMatch ? parseInt(failuresMatch[1]) : 0;
  const totalReattempts = reattemptsMatch ? parseInt(reattemptsMatch[1]) : 0;
  const totalCost = costMatch ? parseFloat(costMatch[1]) : 0;

  // Extract failed sub-skills
  const failedSubSkills: Array<{ name: string; failureCount: number; successRate: number }> = [];

  // Look for the sub-skill breakdown table
  const subSkillSection = content.match(/## Sub-Skill Breakdown[\s\S]*?(?=\n##|\n---\n|$)/);
  if (subSkillSection) {
    const lines = subSkillSection[0].split('\n');
    for (const line of lines) {
      // Match lines like: | Number Series & Pattern Recognition | 20 | 28 | 8 | 41 | ⚠️  71% (8 failed) |
      const match = line.match(/\| (.+?) \| \d+ \| \d+ \| (\d+) \| \d+ \| ⚠️\s+(\d+)% \((\d+) failed\)/);
      if (match) {
        failedSubSkills.push({
          name: match[1].trim(),
          failureCount: parseInt(match[4]),
          successRate: parseInt(match[3])
        });
      }
    }
  }

  return {
    fileName,
    testType,
    section,
    questionsGenerated,
    totalFailures,
    totalReattempts,
    totalCost,
    failedSubSkills
  };
}

(async () => {
  const reportsDir = './docs/generation-reports';
  const files = readdirSync(reportsDir).filter(f => f.endsWith('.md'));

  console.log('═══════════════════════════════════════════════════════════════════');
  console.log(' DETAILED GENERATION REPORTS ANALYSIS');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  const reports: ReportData[] = [];

  for (const file of files) {
    const filePath = join(reportsDir, file);
    const report = parseReport(filePath);
    if (report) reports.push(report);
  }

  console.log(`📊 Analyzed ${reports.length} reports\n`);

  // Calculate totals
  const totalGenerated = reports.reduce((sum, r) => sum + r.questionsGenerated, 0);
  const totalFailures = reports.reduce((sum, r) => sum + r.totalFailures, 0);
  const totalReattempts = reports.reduce((sum, r) => sum + r.totalReattempts, 0);
  const totalCost = reports.reduce((sum, r) => sum + r.totalCost, 0);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' OVERALL STATISTICS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log(`   Total Questions Generated: ${totalGenerated}`);
  console.log(`   Total Failed (exhausted retries): ${totalFailures}`);
  console.log(`   Total Reattempts: ${totalReattempts}`);
  console.log(`   Total Cost: $${totalCost.toFixed(2)}`);
  console.log(`   Success Rate: ${((totalGenerated / (totalGenerated + totalFailures)) * 100).toFixed(1)}%`);
  console.log(`   Avg Reattempts per Question: ${(totalReattempts / totalGenerated).toFixed(1)}`);
  console.log();

  // Most problematic sections (by failure count)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' MOST PROBLEMATIC SECTIONS (by failures)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const sortedByFailures = [...reports].sort((a, b) => b.totalFailures - a.totalFailures);
  const problematic = sortedByFailures.filter(r => r.totalFailures > 0);

  if (problematic.length === 0) {
    console.log('✅ No sections with failures!\n');
  } else {
    problematic.forEach((r, idx) => {
      console.log(`${idx + 1}. ${r.testType} - ${r.section}`);
      console.log(`   Generated: ${r.questionsGenerated} | Failed: ${r.totalFailures} | Reattempts: ${r.totalReattempts}`);
      console.log(`   Cost: $${r.totalCost.toFixed(4)}`);
      console.log();
    });
  }

  // Most problematic sections (by reattempts)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' SECTIONS WITH MOST REATTEMPTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const sortedByReattempts = [...reports].sort((a, b) => b.totalReattempts - a.totalReattempts);
  const highReattempts = sortedByReattempts.filter(r => r.totalReattempts > 10).slice(0, 10);

  if (highReattempts.length === 0) {
    console.log('✅ All sections generated smoothly!\n');
  } else {
    highReattempts.forEach((r, idx) => {
      console.log(`${idx + 1}. ${r.testType} - ${r.section}`);
      console.log(`   Reattempts: ${r.totalReattempts} | Generated: ${r.questionsGenerated} | Avg: ${(r.totalReattempts / r.questionsGenerated).toFixed(1)} per question`);
      console.log();
    });
  }

  // Problematic sub-skills
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' PROBLEMATIC SUB-SKILLS (with failures)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const allFailedSubSkills: Array<{ testSection: string; subSkill: string; failures: number; successRate: number }> = [];

  reports.forEach(r => {
    r.failedSubSkills.forEach(fs => {
      allFailedSubSkills.push({
        testSection: `${r.testType} - ${r.section}`,
        subSkill: fs.name,
        failures: fs.failureCount,
        successRate: fs.successRate
      });
    });
  });

  const sortedSubSkills = allFailedSubSkills.sort((a, b) => b.failures - a.failures);

  if (sortedSubSkills.length === 0) {
    console.log('✅ No sub-skills with failures!\n');
  } else {
    sortedSubSkills.forEach((fs, idx) => {
      console.log(`${idx + 1}. ${fs.testSection}`);
      console.log(`   Sub-skill: ${fs.subSkill}`);
      console.log(`   Failures: ${fs.failures} | Success Rate: ${fs.successRate}%`);
      console.log();
    });
  }

  console.log('═══════════════════════════════════════════════════════════════════\n');
})();
