/**
 * Platform Consistency Tests
 *
 * This test suite checks for common errors reported by users:
 * 1. Progress not loading correctly
 * 2. Numbers/options changing upon refresh/reload
 * 3. Session state not persisting
 * 4. Question order inconsistency
 * 5. Answer option ordering issues
 *
 * Focus: VIC Selective Entry (but tests should work across all products)
 */

import { supabase } from '../src/integrations/supabase/client';
import {
  seededShuffle,
  generateQuestionOrderSeed,
  testSeededShuffle
} from '../src/utils/seededShuffle';

interface TestResult {
  testName: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
  details?: any;
}

class PlatformConsistencyTester {
  private results: TestResult[] = [];
  private testUserId: string = '';
  private testProductType: string = 'VIC Selective Entry (Year 9 Entry)';

  /**
   * Run all consistency tests
   */
  async runAllTests(): Promise<TestResult[]> {
    console.log('🧪 Starting Platform Consistency Tests');
    console.log('📦 Product: VIC Selective Entry (Year 9 Entry)');
    console.log('=' .repeat(80));

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        this.addResult('User Authentication', 'FAIL', 'No authenticated user found');
        return this.results;
      }
      this.testUserId = user.id;
      console.log('✅ User authenticated:', this.testUserId);

      // Test 1: Seeded Shuffle Determinism
      await this.testSeededShuffleDeterminism();

      // Test 2: Question Order Consistency
      await this.testQuestionOrderConsistency();

      // Test 3: Answer Options Consistency
      await this.testAnswerOptionsConsistency();

      // Test 4: Session State Persistence
      await this.testSessionStatePersistence();

      // Test 5: Progress Tracking Accuracy
      await this.testProgressTrackingAccuracy();

      // Test 6: Database Integrity
      await this.testDatabaseIntegrity();

      // Test 7: Question Fetching Consistency
      await this.testQuestionFetchingConsistency();

      // Test 8: Session Resume Correctness
      await this.testSessionResumeCorrectness();

      // Test 9: Answer Saving Reliability
      await this.testAnswerSavingReliability();

      // Test 10: Timer State Consistency
      await this.testTimerStateConsistency();

    } catch (error) {
      this.addResult('Test Suite', 'FAIL', `Test suite crashed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Print results
    this.printResults();
    return this.results;
  }

  /**
   * Test 1: Verify seeded shuffle is deterministic
   */
  async testSeededShuffleDeterminism(): Promise<void> {
    console.log('\n🧪 Test 1: Seeded Shuffle Determinism');

    try {
      const testArray = Array.from({ length: 50 }, (_, i) => i + 1);
      const seed = generateQuestionOrderSeed(
        'VIC Selective Entry (Year 9 Entry)',
        'practice_1',
        'Numerical Reasoning'
      );

      // Shuffle 5 times with same seed
      const shuffles = Array.from({ length: 5 }, () => seededShuffle(testArray, seed));

      // Check all shuffles are identical
      const allIdentical = shuffles.every((shuffle, idx) =>
        idx === 0 || shuffle.every((val, pos) => val === shuffles[0][pos])
      );

      if (allIdentical) {
        this.addResult(
          'Seeded Shuffle Determinism',
          'PASS',
          'Shuffle produces identical results across multiple runs'
        );
      } else {
        this.addResult(
          'Seeded Shuffle Determinism',
          'FAIL',
          'Shuffle produces different results - questions will change order on refresh!',
          { shuffles }
        );
      }

      // Also run built-in test
      const builtInTest = testSeededShuffle();
      if (!builtInTest) {
        this.addResult(
          'Seeded Shuffle Built-in Test',
          'FAIL',
          'Built-in test failed'
        );
      }

    } catch (error) {
      this.addResult(
        'Seeded Shuffle Determinism',
        'FAIL',
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Test 2: Question order consistency across fetches
   */
  async testQuestionOrderConsistency(): Promise<void> {
    console.log('\n🧪 Test 2: Question Order Consistency');

    try {
      const testMode = 'practice_1';
      const sectionName = 'Numerical Reasoning';

      // Fetch questions twice
      const fetch1 = await supabase
        .from('questions_v2')
        .select('id, question_order')
        .eq('test_type', this.testProductType)
        .eq('mode', testMode)
        .eq('section_name', sectionName)
        .order('question_order', { ascending: true });

      const fetch2 = await supabase
        .from('questions_v2')
        .select('id, question_order')
        .eq('test_type', this.testProductType)
        .eq('mode', testMode)
        .eq('section_name', sectionName)
        .order('question_order', { ascending: true });

      if (fetch1.error || fetch2.error) {
        this.addResult(
          'Question Order Consistency',
          'FAIL',
          `Database error: ${fetch1.error?.message || fetch2.error?.message}`
        );
        return;
      }

      // Compare question IDs are in same order
      const ids1 = fetch1.data?.map(q => q.id) || [];
      const ids2 = fetch2.data?.map(q => q.id) || [];

      const orderMatches = ids1.length === ids2.length &&
        ids1.every((id, idx) => id === ids2[idx]);

      if (orderMatches) {
        this.addResult(
          'Question Order Consistency',
          'PASS',
          `Question order is consistent across fetches (${ids1.length} questions)`
        );
      } else {
        this.addResult(
          'Question Order Consistency',
          'FAIL',
          'Question order CHANGES between fetches - this causes questions to shift!',
          {
            fetch1Count: ids1.length,
            fetch2Count: ids2.length,
            firstMismatch: ids1.findIndex((id, idx) => id !== ids2[idx])
          }
        );
      }

      // Check if question_order values are properly set
      const hasNullOrders = fetch1.data?.some(q => q.question_order === null) || false;
      if (hasNullOrders) {
        this.addResult(
          'Question Order NULL Check',
          'WARNING',
          'Some questions have NULL question_order - these will be unstable!'
        );
      }

    } catch (error) {
      this.addResult(
        'Question Order Consistency',
        'FAIL',
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Test 3: Answer options consistency
   */
  async testAnswerOptionsConsistency(): Promise<void> {
    console.log('\n🧪 Test 3: Answer Options Consistency');

    try {
      // Fetch a sample question multiple times
      const { data: questions, error } = await supabase
        .from('questions_v2')
        .select('id, answer_options, correct_answer')
        .eq('test_type', this.testProductType)
        .eq('mode', 'practice_1')
        .limit(10);

      if (error || !questions || questions.length === 0) {
        this.addResult(
          'Answer Options Consistency',
          'FAIL',
          'Could not fetch questions for testing'
        );
        return;
      }

      let issuesFound = 0;
      const issueDetails: any[] = [];

      for (const question of questions) {
        // Check 1: answer_options should be an array or object
        if (!question.answer_options) {
          issuesFound++;
          issueDetails.push({
            questionId: question.id,
            issue: 'Missing answer_options'
          });
          continue;
        }

        // Check 2: If it's an object, keys should be consistent (A, B, C, D)
        if (typeof question.answer_options === 'object' && !Array.isArray(question.answer_options)) {
          const keys = Object.keys(question.answer_options).sort();
          const expectedKeys = ['A', 'B', 'C', 'D'].slice(0, keys.length);

          if (JSON.stringify(keys) !== JSON.stringify(expectedKeys)) {
            issuesFound++;
            issueDetails.push({
              questionId: question.id,
              issue: 'Inconsistent option keys',
              keys,
              expectedKeys
            });
          }
        }

        // Check 3: Correct answer should be valid
        if (!question.correct_answer) {
          issuesFound++;
          issueDetails.push({
            questionId: question.id,
            issue: 'Missing correct_answer'
          });
        }

        // Check 4: If array, ensure no duplicate options
        if (Array.isArray(question.answer_options)) {
          const uniqueOptions = new Set(question.answer_options);
          if (uniqueOptions.size !== question.answer_options.length) {
            issuesFound++;
            issueDetails.push({
              questionId: question.id,
              issue: 'Duplicate answer options',
              options: question.answer_options
            });
          }
        }
      }

      if (issuesFound === 0) {
        this.addResult(
          'Answer Options Consistency',
          'PASS',
          `All ${questions.length} sampled questions have consistent answer options`
        );
      } else {
        this.addResult(
          'Answer Options Consistency',
          'FAIL',
          `Found ${issuesFound} questions with answer option issues`,
          issueDetails
        );
      }

    } catch (error) {
      this.addResult(
        'Answer Options Consistency',
        'FAIL',
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Test 4: Session state persistence
   */
  async testSessionStatePersistence(): Promise<void> {
    console.log('\n🧪 Test 4: Session State Persistence');

    try {
      // Check for any active sessions
      const { data: sessions, error } = await supabase
        .from('user_test_sessions')
        .select('*')
        .eq('user_id', this.testUserId)
        .eq('product_type', this.testProductType)
        .order('started_at', { ascending: false })
        .limit(5);

      if (error) {
        this.addResult(
          'Session State Persistence',
          'FAIL',
          `Database error: ${error.message}`
        );
        return;
      }

      if (!sessions || sessions.length === 0) {
        this.addResult(
          'Session State Persistence',
          'WARNING',
          'No sessions found - unable to test session persistence'
        );
        return;
      }

      // Check each session for data integrity
      let issuesFound = 0;
      const issueDetails: any[] = [];

      for (const session of sessions) {
        // Check 1: Session has required fields
        if (!session.session_data) {
          issuesFound++;
          issueDetails.push({
            sessionId: session.id,
            issue: 'Missing session_data'
          });
        }

        // Check 2: Question order is preserved
        if (!session.question_order || session.question_order.length === 0) {
          issuesFound++;
          issueDetails.push({
            sessionId: session.id,
            issue: 'Missing or empty question_order'
          });
        }

        // Check 3: Current question index is valid
        if (session.current_question_index < 0 ||
            session.current_question_index > session.total_questions) {
          issuesFound++;
          issueDetails.push({
            sessionId: session.id,
            issue: 'Invalid current_question_index',
            value: session.current_question_index,
            maxValid: session.total_questions
          });
        }
      }

      if (issuesFound === 0) {
        this.addResult(
          'Session State Persistence',
          'PASS',
          `All ${sessions.length} recent sessions have valid state data`
        );
      } else {
        this.addResult(
          'Session State Persistence',
          'FAIL',
          `Found ${issuesFound} sessions with state issues`,
          issueDetails
        );
      }

    } catch (error) {
      this.addResult(
        'Session State Persistence',
        'FAIL',
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Test 5: Progress tracking accuracy
   */
  async testProgressTrackingAccuracy(): Promise<void> {
    console.log('\n🧪 Test 5: Progress Tracking Accuracy');

    try {
      // Get user progress
      const { data: progress, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', this.testUserId)
        .eq('product_type', this.testProductType)
        .single();

      if (error && error.code !== 'PGRST116') {
        this.addResult(
          'Progress Tracking Accuracy',
          'FAIL',
          `Database error: ${error.message}`
        );
        return;
      }

      if (!progress) {
        this.addResult(
          'Progress Tracking Accuracy',
          'WARNING',
          'No progress record found - user may not have started yet'
        );
        return;
      }

      // Verify progress data matches actual session data
      const { data: sessions, error: sessionsError } = await supabase
        .from('user_test_sessions')
        .select('*')
        .eq('user_id', this.testUserId)
        .eq('product_type', this.testProductType)
        .eq('status', 'completed');

      if (sessionsError) {
        this.addResult(
          'Progress Tracking Accuracy',
          'FAIL',
          `Error fetching sessions: ${sessionsError.message}`
        );
        return;
      }

      // Count completed tests by mode
      const completedPractice = sessions?.filter(s => s.test_mode.startsWith('practice')).length || 0;
      const completedDiagnostic = sessions?.filter(s => s.test_mode === 'diagnostic').length || 0;

      // Check if progress matches
      const progressPractice = progress.tests_completed?.practice || 0;
      const progressDiagnostic = progress.diagnostic_completed ? 1 : 0;

      if (completedPractice === progressPractice && completedDiagnostic === progressDiagnostic) {
        this.addResult(
          'Progress Tracking Accuracy',
          'PASS',
          'Progress data matches completed sessions'
        );
      } else {
        this.addResult(
          'Progress Tracking Accuracy',
          'WARNING',
          'Progress data may be out of sync with actual sessions',
          {
            actual: { practice: completedPractice, diagnostic: completedDiagnostic },
            tracked: { practice: progressPractice, diagnostic: progressDiagnostic }
          }
        );
      }

    } catch (error) {
      this.addResult(
        'Progress Tracking Accuracy',
        'FAIL',
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Test 6: Database integrity checks
   */
  async testDatabaseIntegrity(): Promise<void> {
    console.log('\n🧪 Test 6: Database Integrity');

    try {
      const issues: any[] = [];

      // Check 1: Questions have unique IDs
      const { data: duplicateIds, error: dupError } = await supabase
        .rpc('check_duplicate_question_ids', {
          p_test_type: this.testProductType
        })
        .single();

      if (!dupError && duplicateIds && duplicateIds > 0) {
        issues.push({
          check: 'Duplicate Question IDs',
          count: duplicateIds
        });
      }

      // Check 2: Foreign key integrity (sessions -> questions)
      const { data: orphanedSessions, error: orphanError } = await supabase
        .from('user_test_sessions')
        .select('id, question_order')
        .eq('user_id', this.testUserId)
        .eq('product_type', this.testProductType)
        .limit(10);

      if (!orphanError && orphanedSessions) {
        for (const session of orphanedSessions) {
          if (session.question_order && session.question_order.length > 0) {
            // Check if questions exist
            const { data: questions, error: qError } = await supabase
              .from('questions_v2')
              .select('id')
              .in('id', session.question_order);

            if (!qError && questions) {
              const foundIds = new Set(questions.map(q => q.id));
              const missingCount = session.question_order.filter((id: string) => !foundIds.has(id)).length;

              if (missingCount > 0) {
                issues.push({
                  check: 'Orphaned Question References',
                  sessionId: session.id,
                  missingQuestions: missingCount
                });
              }
            }
          }
        }
      }

      // Check 3: NULL question_order values
      const { data: nullOrders, error: nullError } = await supabase
        .from('questions_v2')
        .select('id')
        .eq('test_type', this.testProductType)
        .is('question_order', null)
        .limit(1);

      if (!nullError && nullOrders && nullOrders.length > 0) {
        issues.push({
          check: 'NULL question_order',
          message: 'Some questions have NULL question_order - will cause inconsistency'
        });
      }

      if (issues.length === 0) {
        this.addResult(
          'Database Integrity',
          'PASS',
          'No integrity issues detected'
        );
      } else {
        this.addResult(
          'Database Integrity',
          'WARNING',
          `Found ${issues.length} potential integrity issues`,
          issues
        );
      }

    } catch (error) {
      this.addResult(
        'Database Integrity',
        'FAIL',
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Test 7: Question fetching consistency (simulate page reload)
   */
  async testQuestionFetchingConsistency(): Promise<void> {
    console.log('\n🧪 Test 7: Question Fetching Consistency (Simulated Reload)');

    try {
      const testMode = 'practice_1';
      const sectionName = 'Numerical Reasoning';

      // Simulate 3 "page loads" by fetching the same questions 3 times
      const fetches = await Promise.all([
        supabase
          .from('questions_v2')
          .select('id, question_text, answer_options, correct_answer, question_order')
          .eq('test_type', this.testProductType)
          .eq('mode', testMode)
          .eq('section_name', sectionName)
          .order('question_order', { ascending: true }),

        supabase
          .from('questions_v2')
          .select('id, question_text, answer_options, correct_answer, question_order')
          .eq('test_type', this.testProductType)
          .eq('mode', testMode)
          .eq('section_name', sectionName)
          .order('question_order', { ascending: true }),

        supabase
          .from('questions_v2')
          .select('id, question_text, answer_options, correct_answer, question_order')
          .eq('test_type', this.testProductType)
          .eq('mode', testMode)
          .eq('section_name', sectionName)
          .order('question_order', { ascending: true })
      ]);

      if (fetches.some(f => f.error)) {
        this.addResult(
          'Question Fetching Consistency',
          'FAIL',
          'Database error during fetching'
        );
        return;
      }

      const [fetch1, fetch2, fetch3] = fetches.map(f => f.data || []);

      // Check counts match
      if (fetch1.length !== fetch2.length || fetch2.length !== fetch3.length) {
        this.addResult(
          'Question Fetching Consistency',
          'FAIL',
          'Different question counts across fetches!',
          { counts: [fetch1.length, fetch2.length, fetch3.length] }
        );
        return;
      }

      // Check question IDs and order are identical
      const orderConsistent = fetch1.every((q1, idx) => {
        const q2 = fetch2[idx];
        const q3 = fetch3[idx];
        return q1.id === q2.id && q2.id === q3.id &&
               q1.question_order === q2.question_order && q2.question_order === q3.question_order;
      });

      // Check answer options are identical
      const optionsConsistent = fetch1.every((q1, idx) => {
        const q2 = fetch2[idx];
        const q3 = fetch3[idx];
        return JSON.stringify(q1.answer_options) === JSON.stringify(q2.answer_options) &&
               JSON.stringify(q2.answer_options) === JSON.stringify(q3.answer_options);
      });

      if (orderConsistent && optionsConsistent) {
        this.addResult(
          'Question Fetching Consistency',
          'PASS',
          `Questions are identical across 3 simulated page loads (${fetch1.length} questions)`
        );
      } else {
        this.addResult(
          'Question Fetching Consistency',
          'FAIL',
          'Questions CHANGE between page loads - this is a critical bug!',
          {
            orderConsistent,
            optionsConsistent
          }
        );
      }

    } catch (error) {
      this.addResult(
        'Question Fetching Consistency',
        'FAIL',
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Test 8: Session resume correctness
   */
  async testSessionResumeCorrectness(): Promise<void> {
    console.log('\n🧪 Test 8: Session Resume Correctness');

    try {
      // Find a recent active session
      const { data: sessions, error } = await supabase
        .from('user_test_sessions')
        .select('*')
        .eq('user_id', this.testUserId)
        .eq('product_type', this.testProductType)
        .eq('status', 'active')
        .order('started_at', { ascending: false })
        .limit(1);

      if (error) {
        this.addResult(
          'Session Resume Correctness',
          'FAIL',
          `Database error: ${error.message}`
        );
        return;
      }

      if (!sessions || sessions.length === 0) {
        this.addResult(
          'Session Resume Correctness',
          'WARNING',
          'No active sessions found - unable to test resume'
        );
        return;
      }

      const session = sessions[0];

      // Check session data completeness
      const issues: string[] = [];

      if (!session.session_data) {
        issues.push('Missing session_data');
      } else {
        if (!session.session_data.answers || typeof session.session_data.answers !== 'object') {
          issues.push('Invalid or missing answers in session_data');
        }
        if (session.session_data.timeRemainingSeconds === undefined) {
          issues.push('Missing timeRemainingSeconds in session_data');
        }
      }

      if (!session.question_order || session.question_order.length === 0) {
        issues.push('Missing or empty question_order');
      }

      if (session.question_order && session.total_questions !== session.question_order.length) {
        issues.push(`Mismatch: total_questions (${session.total_questions}) != question_order.length (${session.question_order.length})`);
      }

      if (session.current_question_index < 0 || session.current_question_index > session.total_questions) {
        issues.push(`Invalid current_question_index: ${session.current_question_index}`);
      }

      if (issues.length === 0) {
        this.addResult(
          'Session Resume Correctness',
          'PASS',
          'Session data is complete and valid for resume'
        );
      } else {
        this.addResult(
          'Session Resume Correctness',
          'FAIL',
          'Session data has issues that may prevent correct resume',
          issues
        );
      }

    } catch (error) {
      this.addResult(
        'Session Resume Correctness',
        'FAIL',
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Test 9: Answer saving reliability
   */
  async testAnswerSavingReliability(): Promise<void> {
    console.log('\n🧪 Test 9: Answer Saving Reliability');

    try {
      // Check recent sessions for answer completeness
      const { data: sessions, error } = await supabase
        .from('user_test_sessions')
        .select('id, session_data, total_questions')
        .eq('user_id', this.testUserId)
        .eq('product_type', this.testProductType)
        .order('started_at', { ascending: false })
        .limit(5);

      if (error) {
        this.addResult(
          'Answer Saving Reliability',
          'FAIL',
          `Database error: ${error.message}`
        );
        return;
      }

      if (!sessions || sessions.length === 0) {
        this.addResult(
          'Answer Saving Reliability',
          'WARNING',
          'No sessions found - unable to test answer saving'
        );
        return;
      }

      let totalAnswersMissing = 0;
      const issueDetails: any[] = [];

      for (const session of sessions) {
        if (!session.session_data?.answers) {
          issueDetails.push({
            sessionId: session.id,
            issue: 'No answers object in session_data'
          });
          continue;
        }

        const answersCount = Object.keys(session.session_data.answers).length;

        // If session has some progress but very few answers saved, flag it
        if (answersCount === 0 && session.total_questions > 0) {
          issueDetails.push({
            sessionId: session.id,
            issue: 'Zero answers saved despite having questions',
            totalQuestions: session.total_questions
          });
          totalAnswersMissing++;
        }
      }

      if (totalAnswersMissing === 0) {
        this.addResult(
          'Answer Saving Reliability',
          'PASS',
          'All recent sessions have answer data saved'
        );
      } else {
        this.addResult(
          'Answer Saving Reliability',
          'WARNING',
          `${totalAnswersMissing} sessions have missing answer data`,
          issueDetails
        );
      }

    } catch (error) {
      this.addResult(
        'Answer Saving Reliability',
        'FAIL',
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Test 10: Timer state consistency
   */
  async testTimerStateConsistency(): Promise<void> {
    console.log('\n🧪 Test 10: Timer State Consistency');

    try {
      // Find active sessions with timers
      const { data: sessions, error } = await supabase
        .from('user_test_sessions')
        .select('id, session_data, started_at, test_mode')
        .eq('user_id', this.testUserId)
        .eq('product_type', this.testProductType)
        .eq('status', 'active')
        .limit(5);

      if (error) {
        this.addResult(
          'Timer State Consistency',
          'FAIL',
          `Database error: ${error.message}`
        );
        return;
      }

      if (!sessions || sessions.length === 0) {
        this.addResult(
          'Timer State Consistency',
          'WARNING',
          'No active sessions found - unable to test timer state'
        );
        return;
      }

      const issues: any[] = [];

      for (const session of sessions) {
        // Only practice and diagnostic tests have timers
        if (session.test_mode === 'drill') continue;

        if (!session.session_data?.timeRemainingSeconds && session.session_data?.timeRemainingSeconds !== 0) {
          issues.push({
            sessionId: session.id,
            issue: 'Missing timeRemainingSeconds in session_data',
            testMode: session.test_mode
          });
        } else if (session.session_data.timeRemainingSeconds < 0) {
          issues.push({
            sessionId: session.id,
            issue: 'Negative timeRemainingSeconds',
            value: session.session_data.timeRemainingSeconds
          });
        }
      }

      if (issues.length === 0) {
        this.addResult(
          'Timer State Consistency',
          'PASS',
          'All active sessions have valid timer state'
        );
      } else {
        this.addResult(
          'Timer State Consistency',
          'WARNING',
          `Found ${issues.length} sessions with timer issues`,
          issues
        );
      }

    } catch (error) {
      this.addResult(
        'Timer State Consistency',
        'FAIL',
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Helper methods
  private addResult(testName: string, status: 'PASS' | 'FAIL' | 'WARNING', message: string, details?: any): void {
    this.results.push({ testName, status, message, details });

    const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${emoji} ${testName}: ${message}`);

    if (details) {
      console.log('   Details:', details);
    }
  }

  private printResults(): void {
    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(80));

    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const warnings = this.results.filter(r => r.status === 'WARNING').length;

    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️  Warnings: ${warnings}`);
    console.log(`📝 Total: ${this.results.length}`);

    if (failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => {
          console.log(`   - ${r.testName}: ${r.message}`);
        });
    }

    if (warnings > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.results
        .filter(r => r.status === 'WARNING')
        .forEach(r => {
          console.log(`   - ${r.testName}: ${r.message}`);
        });
    }

    console.log('\n' + '='.repeat(80));
  }
}

// Export for use in browser console or test runners
export async function runPlatformTests(): Promise<TestResult[]> {
  const tester = new PlatformConsistencyTester();
  return await tester.runAllTests();
}

// Auto-run if loaded in browser
if (typeof window !== 'undefined') {
  (window as any).runPlatformTests = runPlatformTests;
  console.log('🧪 Platform Consistency Tests loaded');
  console.log('📝 Run tests with: runPlatformTests()');
}
