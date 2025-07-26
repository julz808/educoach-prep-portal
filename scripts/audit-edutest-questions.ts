/**
 * AUDIT EDUTEST QUESTIONS FOR HALLUCINATED CONTENT
 * 
 * This script examines all EduTest questions in verbal reasoning, numerical reasoning, 
 * and mathematics sections to identify potentially hallucinated solutions.
 * 
 * It looks for telltale signs like:
 * - "wait", "let me", "recalculate", "recalculating"
 * - Other indicators of AI thinking process leaking into solutions
 */

import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

// Problematic phrases that indicate hallucinated content (most critical AI thinking artifacts only)
const HALLUCINATION_INDICATORS = [
  'wait, let me',
  'wait let me',
  'wait, that',
  'wait that',
  'recalculate',
  'recalculating'
];

// Target sections to audit
const TARGET_SECTIONS = [
  'verbal reasoning',
  'numerical reasoning', 
  'mathematics'
];

interface SuspiciousQuestion {
  id: string;
  questionText: string;
  section: string;
  subSkill: string;
  testType: string;
  solution: string;
  indicators: string[];
  severity: 'high' | 'medium' | 'low';
}

class EduTestQuestionAuditor {
  private suspiciousQuestions: SuspiciousQuestion[] = [];
  private totalQuestionsAudited = 0;

  async auditAllQuestions() {
    console.log('🔍 Starting EduTest question audit...');
    console.log('🎯 Target sections:', TARGET_SECTIONS.join(', '));
    console.log('🚨 Looking for indicators:', HALLUCINATION_INDICATORS.join(', '));
    console.log('');

    try {
      // Query all EduTest questions in target sections
      const { data: questions, error } = await supabase
        .from('questions')
        .select('*')
        .eq('test_type', 'EduTest Scholarship (Year 7 Entry)')
        .not('solution', 'is', null);

      if (error) {
        throw error;
      }

      console.log(`📊 Found ${questions.length} EduTest questions to audit`);
      console.log('');

      // Filter and audit questions in target sections
      const targetQuestions = questions.filter(q => 
        TARGET_SECTIONS.some(section => 
          q.section_name?.toLowerCase().includes(section) ||
          q.sub_skills?.test_sections?.section_name?.toLowerCase().includes(section)
        )
      );

      console.log(`🎯 Filtering to ${targetQuestions.length} questions in target sections`);
      console.log('');

      // Audit each question
      for (const question of targetQuestions) {
        this.auditQuestion(question);
      }

      this.totalQuestionsAudited = targetQuestions.length;

      // Generate report
      this.generateReport();

    } catch (error) {
      console.error('❌ Error during audit:', error);
    }
  }

  private auditQuestion(question: any) {
    const solution = question.solution?.toLowerCase() || '';
    const questionText = question.question_text || '';
    
    // Check for hallucination indicators
    const foundIndicators = HALLUCINATION_INDICATORS.filter(indicator => 
      solution.includes(indicator.toLowerCase())
    );

    if (foundIndicators.length > 0) {
      // Determine severity based on indicators found
      let severity: 'high' | 'medium' | 'low' = 'low';
      
      const highSeverityIndicators = ['recalculate', 'recalculating'];
      const mediumSeverityIndicators = ['wait, let me', 'wait let me', 'wait, that', 'wait that'];
      
      if (foundIndicators.some(indicator => highSeverityIndicators.includes(indicator))) {
        severity = 'high';
      } else if (foundIndicators.some(indicator => mediumSeverityIndicators.includes(indicator))) {
        severity = 'medium';
      }

      this.suspiciousQuestions.push({
        id: question.id,
        questionText: questionText.substring(0, 100) + '...',
        section: question.section_name || question.sub_skills?.test_sections?.section_name || 'Unknown',
        subSkill: question.sub_skill || 'Unknown',
        testType: question.test_type,
        solution: question.solution,
        indicators: foundIndicators,
        severity
      });

      console.log(`🚨 [${severity.toUpperCase()}] Found suspicious question:`, {
        id: question.id,
        section: question.section_name,
        subSkill: question.sub_skill,
        indicators: foundIndicators,
        preview: questionText.substring(0, 80) + '...'
      });
    }
  }

  private generateReport() {
    console.log('');
    console.log('=' .repeat(80));
    console.log('🔍 EDUTEST QUESTION AUDIT REPORT');
    console.log('=' .repeat(80));
    console.log('');

    console.log(`📊 SUMMARY:`);
    console.log(`   Total questions audited: ${this.totalQuestionsAudited}`);
    console.log(`   Suspicious questions found: ${this.suspiciousQuestions.length}`);
    console.log(`   Clean questions: ${this.totalQuestionsAudited - this.suspiciousQuestions.length}`);
    console.log(`   Success rate: ${((this.totalQuestionsAudited - this.suspiciousQuestions.length) / this.totalQuestionsAudited * 100).toFixed(1)}%`);
    console.log('');

    // Breakdown by severity
    const bySeverity = {
      high: this.suspiciousQuestions.filter(q => q.severity === 'high').length,
      medium: this.suspiciousQuestions.filter(q => q.severity === 'medium').length,
      low: this.suspiciousQuestions.filter(q => q.severity === 'low').length
    };

    console.log(`🚨 SEVERITY BREAKDOWN:`);
    console.log(`   High severity: ${bySeverity.high} questions`);
    console.log(`   Medium severity: ${bySeverity.medium} questions`);
    console.log(`   Low severity: ${bySeverity.low} questions`);
    console.log('');

    // Breakdown by section
    const bySection = this.suspiciousQuestions.reduce((acc, q) => {
      const section = q.section.toLowerCase();
      acc[section] = (acc[section] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log(`📚 BREAKDOWN BY SECTION:`);
    Object.entries(bySection).forEach(([section, count]) => {
      console.log(`   ${section}: ${count} suspicious questions`);
    });
    console.log('');

    // Most common indicators
    const indicatorCounts = this.suspiciousQuestions
      .flatMap(q => q.indicators)
      .reduce((acc, indicator) => {
        acc[indicator] = (acc[indicator] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    console.log(`🎯 MOST COMMON INDICATORS:`);
    Object.entries(indicatorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .forEach(([indicator, count]) => {
        console.log(`   "${indicator}": ${count} occurrences`);
      });
    console.log('');

    // Detailed suspicious questions (high severity first)
    if (this.suspiciousQuestions.length > 0) {
      console.log(`🚨 DETAILED SUSPICIOUS QUESTIONS:`);
      console.log('');

      const sortedQuestions = this.suspiciousQuestions.sort((a, b) => {
        const severityOrder = { high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });

      sortedQuestions.forEach((q, index) => {
        console.log(`${index + 1}. [${q.severity.toUpperCase()}] Question ID: ${q.id}`);
        console.log(`   Section: ${q.section}`);
        console.log(`   Sub-skill: ${q.subSkill}`);
        console.log(`   Preview: ${q.questionText}`);
        console.log(`   Indicators found: ${q.indicators.join(', ')}`);
        console.log(`   Solution excerpt: "${q.solution.substring(0, 200)}..."`);
        console.log('');
      });
    }

    console.log('=' .repeat(80));
    console.log('✅ Audit complete!');
    
    if (this.suspiciousQuestions.length > 0) {
      console.log(`⚠️  Found ${this.suspiciousQuestions.length} questions that may need review`);
      console.log('💡 Consider regenerating questions with high/medium severity issues');
    } else {
      console.log('🎉 No suspicious questions found - all solutions look clean!');
    }
  }
}

// Run the audit
async function main() {
  const auditor = new EduTestQuestionAuditor();
  await auditor.auditAllQuestions();
}

main().catch(console.error);