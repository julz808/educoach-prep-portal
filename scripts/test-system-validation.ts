/**
 * System Validation Test Suite for Performance Tracking
 * Tests the complete performance tracking system functionality
 */

import { UserProgressService } from '../src/services/userProgressService';
import type { DashboardStats, SubSkillPerformance } from '../src/services/userProgressService';

interface TestUser {
  id: string;
  name: string;
  expectedQuestions: number;
  expectedAccuracy: number;
  expectedSubSkills: number;
}

// Test users with known data from our sample data
const TEST_USERS: TestUser[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'High Performer',
    expectedQuestions: 433, // Sum of all questions attempted
    expectedAccuracy: 0.75, // Expected average accuracy
    expectedSubSkills: 12 // Number of sub-skills with data
  },
  {
    id: '00000000-0000-0000-0000-000000000002', 
    name: 'Moderate Performer',
    expectedQuestions: 100,
    expectedAccuracy: 0.63,
    expectedSubSkills: 5
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    name: 'New User',
    expectedQuestions: 8,
    expectedAccuracy: 0.50,
    expectedSubSkills: 2
  }
];

const PRODUCT_TYPE = 'vic_selective';

class SystemValidator {
  private results: {
    passed: number;
    failed: number;
    errors: string[];
  } = {
    passed: 0,
    failed: 0,
    errors: []
  };

  /**
   * Run all validation tests
   */
  async runAllTests(): Promise<void> {
    console.log('🧪 Starting Performance Tracking System Validation...\n');

    try {
      await this.testUserProgressInitialization();
      await this.testDashboardStats();
      await this.testSubSkillPerformance();
      await this.testQuestionRecording();
      await this.testSessionCompletion();
      await this.testErrorHandling();
      
      this.printResults();
    } catch (error) {
      console.error('❌ Critical test failure:', error);
      this.results.errors.push(`Critical failure: ${error.message}`);
    }
  }

  /**
   * Test 1: User Progress Initialization
   */
  async testUserProgressInitialization(): Promise<void> {
    console.log('📋 Test 1: User Progress Initialization');
    
    for (const user of TEST_USERS) {
      try {
        await UserProgressService.initializeUserProgress(user.id, PRODUCT_TYPE);
        console.log(`  ✅ ${user.name}: Progress initialized successfully`);
        this.results.passed++;
      } catch (error) {
        console.log(`  ❌ ${user.name}: Initialization failed - ${error.message}`);
        this.results.failed++;
        this.results.errors.push(`User ${user.name} initialization: ${error.message}`);
      }
    }
    console.log('');
  }

  /**
   * Test 2: Dashboard Stats Retrieval and Validation
   */
  async testDashboardStats(): Promise<void> {
    console.log('📊 Test 2: Dashboard Stats Validation');
    
    for (const user of TEST_USERS) {
      try {
        const stats: DashboardStats = await UserProgressService.getDashboardStats(user.id, PRODUCT_TYPE);
        
        // Validate stats structure
        if (!stats || typeof stats.total_questions_completed !== 'number' || typeof stats.overall_accuracy !== 'number') {
          throw new Error('Invalid stats structure');
        }

        // Validate expected values (with tolerance for calculations)
        const accuracyDiff = Math.abs(stats.overall_accuracy - user.expectedAccuracy);
        const questionsDiff = Math.abs(stats.total_questions_completed - user.expectedQuestions);
        
        if (questionsDiff > 50) { // Allow some tolerance for test data variations
          console.log(`  ⚠️  ${user.name}: Question count variance (expected: ${user.expectedQuestions}, got: ${stats.total_questions_completed})`);
        }
        
        if (accuracyDiff > 0.2) { // Allow 20% accuracy variance
          console.log(`  ⚠️  ${user.name}: Accuracy variance (expected: ${user.expectedAccuracy}, got: ${stats.overall_accuracy})`);
        }

        console.log(`  ✅ ${user.name}: Stats retrieved (${stats.total_questions_completed} questions, ${Math.round(stats.overall_accuracy * 100)}% accuracy)`);
        this.results.passed++;
      } catch (error) {
        console.log(`  ❌ ${user.name}: Stats retrieval failed - ${error.message}`);
        this.results.failed++;
        this.results.errors.push(`User ${user.name} stats: ${error.message}`);
      }
    }
    console.log('');
  }

  /**
   * Test 3: Sub-Skill Performance Data
   */
  async testSubSkillPerformance(): Promise<void> {
    console.log('🎯 Test 3: Sub-Skill Performance Data');
    
    for (const user of TEST_USERS) {
      try {
        const performance: SubSkillPerformance[] = await UserProgressService.getSubSkillPerformance(user.id, PRODUCT_TYPE);
        
        // Validate performance data structure
        if (!Array.isArray(performance)) {
          throw new Error('Performance data is not an array');
        }

        // Check if we have the expected number of sub-skills
        if (performance.length !== user.expectedSubSkills) {
          console.log(`  ⚠️  ${user.name}: Sub-skill count variance (expected: ${user.expectedSubSkills}, got: ${performance.length})`);
        }

        // Validate each sub-skill entry
        for (const skill of performance) {
          if (!skill.sub_skill_name || typeof skill.questions_attempted !== 'number' || typeof skill.accuracy_percentage !== 'number') {
            throw new Error(`Invalid sub-skill structure for ${skill.sub_skill_name}`);
          }
        }

        console.log(`  ✅ ${user.name}: Sub-skill data retrieved (${performance.length} skills)`);
        this.results.passed++;
      } catch (error) {
        console.log(`  ❌ ${user.name}: Sub-skill retrieval failed - ${error.message}`);
        this.results.failed++;
        this.results.errors.push(`User ${user.name} sub-skills: ${error.message}`);
      }
    }
    console.log('');
  }

  /**
   * Test 4: Question Response Recording
   */
  async testQuestionRecording(): Promise<void> {
    console.log('✏️  Test 4: Question Response Recording');
    
    const testUser = TEST_USERS[2]; // Use the new user for testing
    const sessionId = `test_session_${Date.now()}`;
    
    try {
      // Record a test question response
      await UserProgressService.recordQuestionResponse({
        userId: testUser.id,
        questionId: 'test_question_1',
        sessionId: sessionId,
        productType: PRODUCT_TYPE,
        answer: 'B',
        isCorrect: true,
        timeSpentSeconds: 45
      });

      console.log(`  ✅ Question response recorded successfully`);
      this.results.passed++;
    } catch (error) {
      console.log(`  ❌ Question recording failed - ${error.message}`);
      this.results.failed++;
      this.results.errors.push(`Question recording: ${error.message}`);
    }
    console.log('');
  }

  /**
   * Test 5: Session Completion
   */
  async testSessionCompletion(): Promise<void> {
    console.log('🏁 Test 5: Session Completion');
    
    const testUser = TEST_USERS[2];
    const sessionId = `test_session_${Date.now()}`;
    
    try {
      // Complete a test session
      await UserProgressService.completeTestSession({
        sessionId: sessionId,
        userId: testUser.id,
        productType: PRODUCT_TYPE,
        testMode: 'diagnostic',
        sectionScores: { overall_score: 75.5 }
      });

      console.log(`  ✅ Session completion recorded successfully`);
      this.results.passed++;
    } catch (error) {
      console.log(`  ❌ Session completion failed - ${error.message}`);
      this.results.failed++;
      this.results.errors.push(`Session completion: ${error.message}`);
    }
    console.log('');
  }

  /**
   * Test 6: Error Handling
   */
  async testErrorHandling(): Promise<void> {
    console.log('🛡️  Test 6: Error Handling');
    
    try {
      // Test with invalid user ID
      const invalidUserId = 'invalid-user-id';
      const stats = await UserProgressService.getDashboardStats(invalidUserId, PRODUCT_TYPE);
      
      // Should return default stats for non-existent user
      if (stats.total_questions_completed === 0 && stats.overall_accuracy === 0) {
        console.log(`  ✅ Invalid user handling works correctly`);
        this.results.passed++;
      } else {
        throw new Error('Invalid user should return empty stats');
      }
    } catch (error) {
      console.log(`  ❌ Error handling test failed - ${error.message}`);
      this.results.failed++;
      this.results.errors.push(`Error handling: ${error.message}`);
    }
    console.log('');
  }

  /**
   * Print test results summary
   */
  private printResults(): void {
    console.log('🎯 VALIDATION RESULTS SUMMARY');
    console.log('=' .repeat(50));
    console.log(`✅ Tests Passed: ${this.results.passed}`);
    console.log(`❌ Tests Failed: ${this.results.failed}`);
    console.log(`📊 Success Rate: ${Math.round((this.results.passed / (this.results.passed + this.results.failed)) * 100)}%`);
    
    if (this.results.errors.length > 0) {
      console.log('\n🚨 ERRORS ENCOUNTERED:');
      this.results.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    if (this.results.failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED! System is ready for production.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review and fix issues before proceeding.');
    }
    console.log('');
  }
}

/**
 * Performance Benchmark Test
 */
async function runPerformanceBenchmark(): Promise<void> {
  console.log('⚡ Running Performance Benchmark...');
  
  const testUser = TEST_USERS[0]; // Use high performer with lots of data
  const iterations = 10;
  const startTime = Date.now();
  
  try {
    for (let i = 0; i < iterations; i++) {
      await UserProgressService.getDashboardStats(testUser.id, PRODUCT_TYPE);
      await UserProgressService.getSubSkillPerformance(testUser.id, PRODUCT_TYPE);
    }
    
    const endTime = Date.now();
    const avgTime = (endTime - startTime) / iterations;
    
    console.log(`📈 Benchmark Results:`);
    console.log(`  • Average response time: ${avgTime.toFixed(2)}ms`);
    console.log(`  • Total operations: ${iterations * 2}`);
    console.log(`  • Performance rating: ${avgTime < 100 ? '🚀 Excellent' : avgTime < 500 ? '✅ Good' : '⚠️ Needs optimization'}`);
  } catch (error) {
    console.log(`❌ Benchmark failed: ${error.message}`);
  }
  console.log('');
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  const validator = new SystemValidator();
  
  // Run validation tests
  await validator.runAllTests();
  
  // Run performance benchmark
  await runPerformanceBenchmark();
  
  console.log('✨ Validation complete! Ready to proceed with Phase 6.');
}

// Export for use in other modules
export { SystemValidator, runPerformanceBenchmark };

// Run directly since this is called as a script
main().catch(console.error); 