/**
 * Database Integrity Test Script
 *
 * Checks for data integrity issues that could cause:
 * - Questions changing order on refresh
 * - Answer options shuffling
 * - Progress not loading
 * - Session state corruption
 *
 * Run with: npx tsx scripts/test-database-integrity.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface IntegrityIssue {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  issue: string;
  count?: number;
  details?: any;
  fix?: string;
}

const issues: IntegrityIssue[] = [];

async function checkQuestionOrderIntegrity() {
  console.log('\n🔍 Checking question_order integrity...');

  const testTypes = [
    'VIC Selective Entry (Year 9 Entry)',
    'NSW Selective Entry (Year 7 Entry)',
    'Year 5 NAPLAN',
    'Year 7 NAPLAN',
    'ACER Scholarship (Year 7 Entry)',
    'EduTest Scholarship (Year 7 Entry)'
  ];

  for (const testType of testTypes) {
    // Check for NULL question_order values
    const { data: nullOrders, error } = await supabase
      .from('questions_v2')
      .select('id, test_type, mode, section_name')
      .eq('test_type', testType)
      .is('question_order', null);

    if (error) {
      console.error(`Error checking ${testType}:`, error);
      continue;
    }

    if (nullOrders && nullOrders.length > 0) {
      issues.push({
        severity: 'CRITICAL',
        category: 'Question Order',
        issue: `${nullOrders.length} questions have NULL question_order in ${testType}`,
        count: nullOrders.length,
        details: nullOrders.slice(0, 5), // Show first 5
        fix: 'Run: npx tsx scripts/fix-question-order.ts'
      });
    }

    // Check for duplicate question_order values within same section
    const { data: questions } = await supabase
      .from('questions_v2')
      .select('id, mode, section_name, question_order')
      .eq('test_type', testType)
      .not('question_order', 'is', null);

    if (questions) {
      const orderMap = new Map<string, Map<number, number>>();

      for (const q of questions) {
        const key = `${q.mode}|${q.section_name}`;
        if (!orderMap.has(key)) {
          orderMap.set(key, new Map());
        }
        const sectionOrders = orderMap.get(key)!;
        sectionOrders.set(q.question_order, (sectionOrders.get(q.question_order) || 0) + 1);
      }

      // Find duplicates
      for (const [key, orders] of orderMap.entries()) {
        const duplicates = Array.from(orders.entries()).filter(([_, count]) => count > 1);
        if (duplicates.length > 0) {
          issues.push({
            severity: 'HIGH',
            category: 'Question Order',
            issue: `Duplicate question_order values in ${testType} - ${key}`,
            count: duplicates.length,
            details: duplicates,
            fix: 'Run: npx tsx scripts/fix-question-order.ts'
          });
        }
      }
    }
  }
}

async function checkAnswerOptionsIntegrity() {
  console.log('\n🔍 Checking answer_options integrity...');

  const { data: questions, error } = await supabase
    .from('questions_v2')
    .select('id, test_type, question_text, answer_options, correct_answer')
    .limit(1000); // Sample first 1000

  if (error) {
    console.error('Error fetching questions:', error);
    return;
  }

  if (!questions) return;

  let missingOptions = 0;
  let duplicateOptions = 0;
  let invalidCorrectAnswer = 0;
  let inconsistentFormat = 0;

  for (const q of questions) {
    // Check 1: Missing answer_options
    if (!q.answer_options) {
      missingOptions++;
      continue;
    }

    // Check 2: Duplicate options
    if (Array.isArray(q.answer_options)) {
      const unique = new Set(q.answer_options);
      if (unique.size !== q.answer_options.length) {
        duplicateOptions++;
      }
    }

    // Check 3: Invalid correct_answer
    if (!q.correct_answer) {
      invalidCorrectAnswer++;
    } else {
      // Verify correct answer exists in options
      if (Array.isArray(q.answer_options)) {
        if (typeof q.correct_answer === 'string' && q.correct_answer.length === 1) {
          // Letter format (A, B, C, D)
          const index = q.correct_answer.charCodeAt(0) - 65;
          if (index < 0 || index >= q.answer_options.length) {
            invalidCorrectAnswer++;
          }
        } else {
          // Text format - check if it exists in options
          if (!q.answer_options.includes(q.correct_answer)) {
            invalidCorrectAnswer++;
          }
        }
      }
    }

    // Check 4: Inconsistent format (mix of object and array)
    if (typeof q.answer_options === 'object' && !Array.isArray(q.answer_options)) {
      inconsistentFormat++;
    }
  }

  if (missingOptions > 0) {
    issues.push({
      severity: 'CRITICAL',
      category: 'Answer Options',
      issue: `${missingOptions} questions have missing answer_options`,
      count: missingOptions,
      fix: 'Investigate and fix questions with missing options'
    });
  }

  if (duplicateOptions > 0) {
    issues.push({
      severity: 'HIGH',
      category: 'Answer Options',
      issue: `${duplicateOptions} questions have duplicate answer options`,
      count: duplicateOptions,
      fix: 'Review and fix duplicate options'
    });
  }

  if (invalidCorrectAnswer > 0) {
    issues.push({
      severity: 'CRITICAL',
      category: 'Answer Options',
      issue: `${invalidCorrectAnswer} questions have invalid correct_answer`,
      count: invalidCorrectAnswer,
      fix: 'Verify correct_answer matches an option'
    });
  }

  if (inconsistentFormat > 0) {
    issues.push({
      severity: 'MEDIUM',
      category: 'Answer Options',
      issue: `${inconsistentFormat} questions use object format instead of array`,
      count: inconsistentFormat,
      fix: 'Standardize to array format'
    });
  }
}

async function checkSessionIntegrity() {
  console.log('\n🔍 Checking session integrity...');

  // Check for sessions with invalid state
  const { data: sessions, error } = await supabase
    .from('user_test_sessions')
    .select('id, user_id, product_type, test_mode, total_questions, current_question_index, question_order, session_data')
    .eq('status', 'active')
    .limit(100);

  if (error) {
    console.error('Error fetching sessions:', error);
    return;
  }

  if (!sessions || sessions.length === 0) {
    console.log('  ✅ No active sessions to check');
    return;
  }

  let missingQuestionOrder = 0;
  let invalidCurrentIndex = 0;
  let missingSessionData = 0;
  let questionOrderMismatch = 0;

  for (const session of sessions) {
    // Check 1: Missing question_order
    if (!session.question_order || session.question_order.length === 0) {
      missingQuestionOrder++;
    }

    // Check 2: Invalid current_question_index
    if (session.current_question_index < 0 || session.current_question_index > session.total_questions) {
      invalidCurrentIndex++;
    }

    // Check 3: Missing session_data
    if (!session.session_data) {
      missingSessionData++;
    }

    // Check 4: question_order length mismatch
    if (session.question_order && session.question_order.length !== session.total_questions) {
      questionOrderMismatch++;
    }
  }

  if (missingQuestionOrder > 0) {
    issues.push({
      severity: 'CRITICAL',
      category: 'Session State',
      issue: `${missingQuestionOrder} active sessions have missing question_order`,
      count: missingQuestionOrder,
      fix: 'These sessions may fail to resume correctly'
    });
  }

  if (invalidCurrentIndex > 0) {
    issues.push({
      severity: 'HIGH',
      category: 'Session State',
      issue: `${invalidCurrentIndex} sessions have invalid current_question_index`,
      count: invalidCurrentIndex,
      fix: 'Reset to valid index (0 to total_questions)'
    });
  }

  if (missingSessionData > 0) {
    issues.push({
      severity: 'HIGH',
      category: 'Session State',
      issue: `${missingSessionData} sessions have missing session_data`,
      count: missingSessionData,
      fix: 'Session may lose timer and answer data'
    });
  }

  if (questionOrderMismatch > 0) {
    issues.push({
      severity: 'MEDIUM',
      category: 'Session State',
      issue: `${questionOrderMismatch} sessions have question_order length mismatch`,
      count: questionOrderMismatch,
      fix: 'Verify question_order matches total_questions'
    });
  }
}

async function checkProgressTrackingIntegrity() {
  console.log('\n🔍 Checking progress tracking integrity...');

  // Sample 10 users
  const { data: progress, error } = await supabase
    .from('user_progress')
    .select('user_id, product_type, total_questions_answered, tests_completed, diagnostic_completed')
    .limit(10);

  if (error) {
    console.error('Error fetching progress:', error);
    return;
  }

  if (!progress || progress.length === 0) {
    console.log('  ✅ No progress records to check');
    return;
  }

  for (const userProgress of progress) {
    // Verify against actual sessions
    const { data: sessions } = await supabase
      .from('user_test_sessions')
      .select('test_mode, status')
      .eq('user_id', userProgress.user_id)
      .eq('product_type', userProgress.product_type);

    if (sessions) {
      const completedSessions = sessions.filter(s => s.status === 'completed');
      const diagnosticCompleted = completedSessions.some(s => s.test_mode === 'diagnostic');

      if (userProgress.diagnostic_completed !== diagnosticCompleted) {
        issues.push({
          severity: 'MEDIUM',
          category: 'Progress Tracking',
          issue: 'Progress diagnostic_completed mismatch with actual sessions',
          details: {
            userId: userProgress.user_id,
            tracked: userProgress.diagnostic_completed,
            actual: diagnosticCompleted
          },
          fix: 'Recalculate user progress from sessions'
        });
      }
    }
  }
}

async function checkOrphanedData() {
  console.log('\n🔍 Checking for orphaned data...');

  // Check for question responses with no matching session
  const { data: responses, error } = await supabase
    .from('user_question_responses')
    .select('test_session_id')
    .limit(100);

  if (error || !responses) return;

  const sessionIds = new Set(responses.map(r => r.test_session_id));
  const uniqueSessionIds = Array.from(sessionIds);

  if (uniqueSessionIds.length > 0) {
    const { data: existingSessions } = await supabase
      .from('user_test_sessions')
      .select('id')
      .in('id', uniqueSessionIds);

    const existingIds = new Set(existingSessions?.map(s => s.id) || []);
    const orphanedCount = uniqueSessionIds.filter(id => !existingIds.has(id)).length;

    if (orphanedCount > 0) {
      issues.push({
        severity: 'MEDIUM',
        category: 'Data Integrity',
        issue: `${orphanedCount} question responses reference non-existent sessions`,
        count: orphanedCount,
        fix: 'Clean up orphaned response records'
      });
    }
  }
}

async function printReport() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 DATABASE INTEGRITY REPORT');
  console.log('='.repeat(80));

  if (issues.length === 0) {
    console.log('\n✅ No integrity issues found! Database is healthy.');
    return;
  }

  const critical = issues.filter(i => i.severity === 'CRITICAL');
  const high = issues.filter(i => i.severity === 'HIGH');
  const medium = issues.filter(i => i.severity === 'MEDIUM');
  const low = issues.filter(i => i.severity === 'LOW');

  console.log(`\n🔴 Critical: ${critical.length}`);
  console.log(`🟠 High: ${high.length}`);
  console.log(`🟡 Medium: ${medium.length}`);
  console.log(`🟢 Low: ${low.length}`);
  console.log(`📝 Total: ${issues.length}`);

  if (critical.length > 0) {
    console.log('\n🔴 CRITICAL ISSUES (Fix immediately):');
    critical.forEach((issue, idx) => {
      console.log(`\n${idx + 1}. ${issue.category}: ${issue.issue}`);
      if (issue.count) console.log(`   Count: ${issue.count}`);
      if (issue.fix) console.log(`   Fix: ${issue.fix}`);
      if (issue.details) console.log(`   Details:`, JSON.stringify(issue.details, null, 2).slice(0, 200));
    });
  }

  if (high.length > 0) {
    console.log('\n🟠 HIGH PRIORITY ISSUES:');
    high.forEach((issue, idx) => {
      console.log(`\n${idx + 1}. ${issue.category}: ${issue.issue}`);
      if (issue.count) console.log(`   Count: ${issue.count}`);
      if (issue.fix) console.log(`   Fix: ${issue.fix}`);
    });
  }

  if (medium.length > 0) {
    console.log('\n🟡 MEDIUM PRIORITY ISSUES:');
    medium.forEach((issue, idx) => {
      console.log(`${idx + 1}. ${issue.category}: ${issue.issue} (Count: ${issue.count || 'N/A'})`);
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log('💡 Recommendation:');
  console.log('   1. Fix CRITICAL issues first');
  console.log('   2. Address HIGH priority issues');
  console.log('   3. Monitor MEDIUM/LOW issues');
  console.log('='.repeat(80));
}

async function main() {
  console.log('🧪 Running Database Integrity Tests...\n');

  await checkQuestionOrderIntegrity();
  await checkAnswerOptionsIntegrity();
  await checkSessionIntegrity();
  await checkProgressTrackingIntegrity();
  await checkOrphanedData();

  await printReport();

  process.exit(issues.filter(i => i.severity === 'CRITICAL').length > 0 ? 1 : 0);
}

main().catch(console.error);
