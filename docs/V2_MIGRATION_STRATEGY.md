# V2 Database Migration Strategy

## Executive Summary

This document outlines a **zero-downtime, phased migration** from the legacy `questions` and `passages` tables to the new `questions_v2` and `passages_v2` tables. The strategy prioritizes safety, testability, and minimal customer impact.

---

## Current State Analysis

### Architecture Overview

**Data Flow:**
```
Supabase (questions, passages)
    ↓
supabaseQuestionService.ts (fetch & transform)
    ↓
Page Components (PracticeTests, Drill, Diagnostic)
    ↓
EnhancedTestInterface (display)
    ↓
sessionService / userProgressService (tracking)
    ↓
Supabase (user_test_sessions, user_progress)
```

**Critical Files:**
- `/src/services/supabaseQuestionService.ts` - All question loading logic
- `/src/services/testSessionService.ts` - Session management with RPC functions
- `/src/services/sessionService.ts` - Progress persistence
- `/src/components/EnhancedTestInterface.tsx` - Question rendering
- `/src/pages/PracticeTests.tsx`, `/Drill.tsx`, `/Diagnostic.tsx` - Entry points

**Key Functions:**
- `fetchQuestionsFromSupabase()` - Loads all questions for all test types
- `fetchDrillModes(testTypeId)` - Loads skill drills
- `fetchDiagnosticModes(testTypeId)` - Loads diagnostic tests
- `transformQuestion()` - Database → UI transformation layer

---

## Migration Strategy: Phased Rollout

### Phase 0: Preparation (1-2 days)

**Goal:** Create safety infrastructure before any code changes

#### 0.1 Create Feature Flag System

Add to `/src/config/featureFlags.ts`:

```typescript
export const FEATURE_FLAGS = {
  // V2 Migration Flags
  USE_V2_QUESTIONS: import.meta.env.VITE_USE_V2_QUESTIONS === 'true',
  V2_TEST_TYPES: (import.meta.env.VITE_V2_TEST_TYPES || '').split(',').filter(Boolean),
  V2_BETA_USERS: (import.meta.env.VITE_V2_BETA_USERS || '').split(',').filter(Boolean),

  // Existing flags
  VITE_ENABLE_ACCESS_CONTROL: import.meta.env.VITE_ENABLE_ACCESS_CONTROL !== 'false',
  VITE_ENABLE_PAYWALL_UI: import.meta.env.VITE_ENABLE_PAYWALL_UI !== 'false',
} as const;

export function isV2Enabled(): boolean {
  return FEATURE_FLAGS.USE_V2_QUESTIONS;
}

export function isV2EnabledForTestType(testType: string): boolean {
  if (!FEATURE_FLAGS.USE_V2_QUESTIONS) return false;
  if (FEATURE_FLAGS.V2_TEST_TYPES.length === 0) return true; // All test types
  return FEATURE_FLAGS.V2_TEST_TYPES.includes(testType);
}

export function isV2EnabledForUser(userId: string): boolean {
  if (!FEATURE_FLAGS.USE_V2_QUESTIONS) return false;
  if (FEATURE_FLAGS.V2_BETA_USERS.length === 0) return true; // All users
  return FEATURE_FLAGS.V2_BETA_USERS.includes(userId);
}
```

**Environment Variables:**
```bash
# .env.local (for testing)
VITE_USE_V2_QUESTIONS=false                    # Master switch
VITE_V2_TEST_TYPES=year-5-naplan               # Comma-separated test types
VITE_V2_BETA_USERS=user-uuid-1,user-uuid-2    # Comma-separated user IDs

# .env.production (initially)
VITE_USE_V2_QUESTIONS=false
```

#### 0.2 Create Data Validation Script

Create `/scripts/migration/validate-v2-data.ts`:

```typescript
/**
 * Validates V2 data quality before migration
 * Checks:
 * - Question count parity between v1 and v2
 * - Required field completeness
 * - Answer format consistency
 * - Passage relationships
 * - Difficulty distribution
 */

import { supabase } from '@/lib/supabase';

interface ValidationReport {
  testType: string;
  v1Count: number;
  v2Count: number;
  missingFields: string[];
  invalidAnswers: number;
  missingPassages: number;
  difficultyDistribution: Record<number, number>;
  issues: string[];
}

export async function validateV2Data(): Promise<ValidationReport[]> {
  const reports: ValidationReport[] = [];

  const testTypes = [
    'year-5-naplan',
    'year-7-naplan',
    'acer-scholarship',
    'edutest-scholarship',
    'nsw-selective',
    'vic-selective'
  ];

  for (const testType of testTypes) {
    const report = await validateTestType(testType);
    reports.push(report);
  }

  return reports;
}

async function validateTestType(testType: string): Promise<ValidationReport> {
  const report: ValidationReport = {
    testType,
    v1Count: 0,
    v2Count: 0,
    missingFields: [],
    invalidAnswers: 0,
    missingPassages: 0,
    difficultyDistribution: { 1: 0, 2: 0, 3: 0 },
    issues: []
  };

  // Count V1 questions
  const { count: v1Count } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })
    .eq('test_type', testType);

  report.v1Count = v1Count || 0;

  // Count and validate V2 questions
  const { data: v2Questions, count: v2Count } = await supabase
    .from('questions_v2')
    .select('*', { count: 'exact' })
    .eq('test_type', testType);

  report.v2Count = v2Count || 0;

  if (!v2Questions) {
    report.issues.push('Failed to fetch V2 questions');
    return report;
  }

  // Validate each question
  for (const q of v2Questions) {
    // Check required fields
    const requiredFields = ['question_text', 'correct_answer', 'difficulty', 'section_name'];
    for (const field of requiredFields) {
      if (!q[field]) {
        if (!report.missingFields.includes(field)) {
          report.missingFields.push(field);
        }
      }
    }

    // Check MCQ answer format
    if (q.response_type === 'mcq' || !q.response_type) {
      if (!q.answer_options || !Array.isArray(q.answer_options) || q.answer_options.length < 2) {
        report.invalidAnswers++;
      }
    }

    // Check passage relationships
    if (q.passage_id) {
      const { data: passage } = await supabase
        .from('passages_v2')
        .select('id')
        .eq('id', q.passage_id)
        .single();

      if (!passage) {
        report.missingPassages++;
      }
    }

    // Track difficulty distribution
    if (q.difficulty >= 1 && q.difficulty <= 3) {
      report.difficultyDistribution[q.difficulty]++;
    }
  }

  // Compare counts
  const countDiff = Math.abs(report.v1Count - report.v2Count);
  const percentDiff = report.v1Count > 0 ? (countDiff / report.v1Count) * 100 : 0;

  if (percentDiff > 10) {
    report.issues.push(`Question count differs by ${percentDiff.toFixed(1)}%`);
  }

  if (report.missingFields.length > 0) {
    report.issues.push(`Missing required fields: ${report.missingFields.join(', ')}`);
  }

  if (report.invalidAnswers > 0) {
    report.issues.push(`${report.invalidAnswers} questions have invalid answer formats`);
  }

  if (report.missingPassages > 0) {
    report.issues.push(`${report.missingPassages} questions reference missing passages`);
  }

  return report;
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  validateV2Data().then(reports => {
    console.log('\n=== V2 DATA VALIDATION REPORT ===\n');

    for (const report of reports) {
      console.log(`\n${report.testType.toUpperCase()}`);
      console.log(`  V1 Count: ${report.v1Count}`);
      console.log(`  V2 Count: ${report.v2Count}`);
      console.log(`  Difficulty: Easy=${report.difficultyDistribution[1]}, Med=${report.difficultyDistribution[2]}, Hard=${report.difficultyDistribution[3]}`);

      if (report.issues.length > 0) {
        console.log(`  ⚠️  ISSUES:`);
        report.issues.forEach(issue => console.log(`     - ${issue}`));
      } else {
        console.log(`  ✅ No issues found`);
      }
    }

    const totalIssues = reports.reduce((sum, r) => sum + r.issues.length, 0);
    console.log(`\n=== SUMMARY: ${totalIssues} total issues ===\n`);
  });
}
```

Run: `npm run tsx scripts/migration/validate-v2-data.ts`

#### 0.3 Create Automated Test Suite

Create `/src/services/__tests__/supabaseQuestionService.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fetchQuestionsFromSupabase, fetchDrillModes } from '../supabaseQuestionService';
import { supabase } from '@/lib/supabase';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn()
  }
}));

describe('Question Service V1/V2 Compatibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load questions from V1 tables when V2 is disabled', async () => {
    // Mock V1 table response
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            data: [
              {
                id: 'q1',
                question_text: 'Test question',
                answer_options: ['A', 'B', 'C', 'D'],
                correct_answer: 'A',
                difficulty: 1,
                test_type: 'year-5-naplan',
                test_mode: 'practice_1'
              }
            ],
            error: null
          })
        })
      })
    });

    (supabase.from as any) = mockFrom;

    const result = await fetchQuestionsFromSupabase();

    expect(mockFrom).toHaveBeenCalledWith('questions');
    expect(result.testTypes).toHaveLength(6);
  });

  it('should transform questions consistently between V1 and V2', async () => {
    // Test that transform logic produces same output
    // regardless of source table
  });

  it('should handle passage relationships in both schemas', async () => {
    // Verify passage loading works for both v1 and v2
  });
});
```

Run: `npm run test` (after setting up Vitest)

#### 0.4 Create Monitoring Dashboard

Create `/scripts/migration/monitor-v2-usage.ts`:

```typescript
/**
 * Monitors V2 usage and error rates
 * Run this during migration to track adoption
 */

import { supabase } from '@/lib/supabase';

export async function getV2UsageStats() {
  // Track which users are using V2
  const { data: sessions } = await supabase
    .from('user_test_sessions')
    .select('user_id, created_at, test_type')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  // Count sessions per test type
  const usageByTestType = sessions?.reduce((acc, session) => {
    acc[session.test_type] = (acc[session.test_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalSessions: sessions?.length || 0,
    uniqueUsers: new Set(sessions?.map(s => s.user_id)).size,
    byTestType: usageByTestType,
    timestamp: new Date().toISOString()
  };
}
```

---

### Phase 1: Create Dual-Mode Service Layer (2-3 days)

**Goal:** Support both V1 and V2 simultaneously without breaking existing functionality

#### 1.1 Create V2 Question Service

Create `/src/services/supabaseQuestionService_v2.ts`:

```typescript
/**
 * V2 Question Service
 * Loads questions from questions_v2 and passages_v2 tables
 * Maintains same interface as V1 service for drop-in replacement
 */

import { supabase } from '@/lib/supabase';
import type { OrganizedTestData, OrganizedQuestion, TestMode } from './supabaseQuestionService';

// Re-export types for compatibility
export type { OrganizedTestData, OrganizedQuestion, TestMode };

/**
 * Fetches all questions from V2 tables
 * Maintains same return structure as V1
 */
export async function fetchQuestionsFromSupabase(): Promise<OrganizedTestData> {
  // Same implementation as V1, but query 'questions_v2' and 'passages_v2'
  // Use identical transformation logic to ensure output compatibility

  // ... implementation
}

export async function fetchDrillModes(testTypeId: string): Promise<TestMode[]> {
  // Same implementation, query 'questions_v2'
  // ... implementation
}

export async function fetchDiagnosticModes(testTypeId: string): Promise<TestMode[]> {
  // Same implementation, query 'questions_v2'
  // ... implementation
}

// All helper functions remain identical
```

#### 1.2 Create Service Factory/Adapter

Create `/src/services/questionServiceFactory.ts`:

```typescript
/**
 * Factory that returns the correct question service based on feature flags
 * Provides single import point for all components
 */

import { isV2Enabled, isV2EnabledForTestType } from '@/config/featureFlags';
import * as v1Service from './supabaseQuestionService';
import * as v2Service from './supabaseQuestionService_v2';

export type { OrganizedTestData, OrganizedQuestion, TestMode } from './supabaseQuestionService';

/**
 * Fetch questions with automatic V1/V2 routing
 */
export async function fetchQuestionsFromSupabase() {
  const useV2 = isV2Enabled();

  console.log(`[QuestionService] Using ${useV2 ? 'V2' : 'V1'} question service`);

  if (useV2) {
    return await v2Service.fetchQuestionsFromSupabase();
  }

  return await v1Service.fetchQuestionsFromSupabase();
}

/**
 * Fetch drill modes with per-test-type V2 routing
 */
export async function fetchDrillModes(testTypeId: string) {
  const useV2 = isV2EnabledForTestType(testTypeId);

  console.log(`[QuestionService] Drill modes for ${testTypeId}: Using ${useV2 ? 'V2' : 'V1'}`);

  if (useV2) {
    return await v2Service.fetchDrillModes(testTypeId);
  }

  return await v1Service.fetchDrillModes(testTypeId);
}

/**
 * Fetch diagnostic modes with per-test-type V2 routing
 */
export async function fetchDiagnosticModes(testTypeId: string) {
  const useV2 = isV2EnabledForTestType(testTypeId);

  console.log(`[QuestionService] Diagnostic for ${testTypeId}: Using ${useV2 ? 'V2' : 'V1'}`);

  if (useV2) {
    return await v2Service.fetchDiagnosticModes(testTypeId);
  }

  return await v1Service.fetchDiagnosticModes(testTypeId);
}
```

#### 1.3 Update All Import Statements

Update these files to import from factory instead of direct service:

- `/src/pages/PracticeTests.tsx`
- `/src/pages/Drill.tsx`
- `/src/pages/Diagnostic.tsx`

```typescript
// Before:
import { fetchQuestionsFromSupabase } from '@/services/supabaseQuestionService';

// After:
import { fetchQuestionsFromSupabase } from '@/services/questionServiceFactory';
```

This is a **search-and-replace** operation across 3 files. No logic changes.

#### 1.4 Deploy to Development

```bash
# Ensure V2 is disabled by default
echo "VITE_USE_V2_QUESTIONS=false" >> .env.local

# Build and test locally
npm run build
npm run preview

# Manual testing checklist:
# - Load practice tests for all 6 test types
# - Start drill sessions (easy, medium, hard)
# - Complete diagnostic test
# - Resume interrupted session
# - Check browser console for "Using V1" logs
```

---

### Phase 2: Internal Testing (3-5 days)

**Goal:** Validate V2 works correctly in isolated environment

#### 2.1 Enable V2 for Single Test Type

```bash
# .env.local
VITE_USE_V2_QUESTIONS=true
VITE_V2_TEST_TYPES=year-5-naplan  # Start with smallest/simplest
```

**Test Checklist:**
- [ ] Practice test loads all sections correctly
- [ ] Drill mode shows all skill areas
- [ ] Diagnostic test functions end-to-end
- [ ] Question navigation works (next/prev/jump)
- [ ] Flagging questions persists
- [ ] Timer counts down correctly
- [ ] Submit test generates results
- [ ] Review mode shows correct answers and explanations
- [ ] Progress is saved and can be resumed
- [ ] Performance metrics update in profile
- [ ] Passage-based questions display passages
- [ ] Visual questions render SVGs
- [ ] Writing prompts show correctly

#### 2.2 Compare V1 vs V2 Output

Create `/scripts/migration/compare-v1-v2-output.ts`:

```typescript
/**
 * Loads same test type from both V1 and V2
 * Compares structure and content
 */

import * as v1 from '@/services/supabaseQuestionService';
import * as v2 from '@/services/supabaseQuestionService_v2';

async function compareServices() {
  console.log('Loading from V1...');
  const v1Data = await v1.fetchQuestionsFromSupabase();

  console.log('Loading from V2...');
  const v2Data = await v2.fetchQuestionsFromSupabase();

  // Compare structure
  console.log('\n=== STRUCTURE COMPARISON ===');
  console.log(`V1 test types: ${v1Data.testTypes.length}`);
  console.log(`V2 test types: ${v2Data.testTypes.length}`);

  // Compare each test type
  for (let i = 0; i < v1Data.testTypes.length; i++) {
    const v1Type = v1Data.testTypes[i];
    const v2Type = v2Data.testTypes.find(t => t.id === v1Type.id);

    if (!v2Type) {
      console.log(`❌ Missing test type in V2: ${v1Type.id}`);
      continue;
    }

    console.log(`\n${v1Type.id}:`);
    console.log(`  Practice tests: V1=${v1Type.testModes.length}, V2=${v2Type.testModes.length}`);
    console.log(`  Drill modes: V1=${v1Type.drillModes.length}, V2=${v2Type.drillModes.length}`);
    console.log(`  Diagnostics: V1=${v1Type.diagnosticModes.length}, V2=${v2Type.diagnosticModes.length}`);

    // Sample question comparison
    if (v1Type.testModes[0] && v2Type.testModes[0]) {
      const v1Questions = v1Type.testModes[0].questions || [];
      const v2Questions = v2Type.testModes[0].questions || [];

      console.log(`  Sample question count: V1=${v1Questions.length}, V2=${v2Questions.length}`);

      if (v1Questions[0] && v2Questions[0]) {
        console.log(`  Sample question structure matches: ${
          JSON.stringify(Object.keys(v1Questions[0]).sort()) ===
          JSON.stringify(Object.keys(v2Questions[0]).sort()) ? '✅' : '❌'
        }`);
      }
    }
  }
}

compareServices();
```

#### 2.3 Load Testing

```typescript
/**
 * Measure V2 performance vs V1
 */

async function benchmarkServices() {
  console.log('Benchmarking V1...');
  const v1Start = performance.now();
  await v1.fetchQuestionsFromSupabase();
  const v1Time = performance.now() - v1Start;

  console.log('Benchmarking V2...');
  const v2Start = performance.now();
  await v2.fetchQuestionsFromSupabase();
  const v2Time = performance.now() - v2Start;

  console.log(`\nV1: ${v1Time.toFixed(0)}ms`);
  console.log(`V2: ${v2Time.toFixed(0)}ms`);
  console.log(`Difference: ${((v2Time - v1Time) / v1Time * 100).toFixed(1)}%`);
}
```

#### 2.4 Expand to All Test Types

Once Year 5 NAPLAN passes all tests:

```bash
# .env.local
VITE_USE_V2_QUESTIONS=true
VITE_V2_TEST_TYPES=  # Empty = all test types
```

Repeat full test checklist for all 6 test types.

---

### Phase 3: Beta Testing (5-7 days)

**Goal:** Test with real users in production environment

#### 3.1 Select Beta Users

Criteria:
- Active users (completed at least 1 test in last 7 days)
- Mix of all 6 test products
- Willing to provide feedback
- Have admin contact info

Recommended: 5-10 users per test type (30-60 total)

#### 3.2 Enable V2 for Beta Users

```bash
# .env.production
VITE_USE_V2_QUESTIONS=true
VITE_V2_BETA_USERS=uuid1,uuid2,uuid3,...

# Or: Enable for single test type first
VITE_V2_TEST_TYPES=year-5-naplan
```

#### 3.3 Add User Feedback UI

Add subtle indicator in app header:

```typescript
// src/components/Header.tsx

import { isV2Enabled } from '@/config/featureFlags';

export function Header() {
  const usingV2 = isV2Enabled();

  return (
    <header>
      {/* Existing header content */}

      {usingV2 && (
        <div className="beta-badge">
          <span>🧪 Testing New Question Engine</span>
          <a href="mailto:support@educoach.com?subject=V2 Feedback">
            Send Feedback
          </a>
        </div>
      )}
    </header>
  );
}
```

#### 3.4 Monitor Beta Period

Daily checks:
- Run `/scripts/migration/monitor-v2-usage.ts`
- Check for error rate increases in logs
- Review user feedback emails
- Compare completion rates V1 vs V2
- Check session resume success rate

**Success Criteria:**
- No increase in error rates
- No user complaints about missing questions
- Session completion rate ≥ V1 baseline
- Resume functionality works 100%
- All test types represented in usage

---

### Phase 4: Gradual Rollout (7-14 days)

**Goal:** Migrate all users to V2 in controlled stages

#### 4.1 Rollout Schedule

**Week 1:**
- Day 1-2: 10% of users
- Day 3-4: 25% of users
- Day 5-7: 50% of users

**Week 2:**
- Day 8-10: 75% of users
- Day 11-12: 90% of users
- Day 13-14: 100% of users

#### 4.2 Implement Percentage-Based Rollout

Update `/src/config/featureFlags.ts`:

```typescript
export function isV2EnabledForUser(userId: string): boolean {
  if (!FEATURE_FLAGS.USE_V2_QUESTIONS) return false;

  // Beta users always get V2
  if (FEATURE_FLAGS.V2_BETA_USERS.includes(userId)) return true;

  // Percentage-based rollout
  const rolloutPercent = parseInt(import.meta.env.VITE_V2_ROLLOUT_PERCENT || '0', 10);

  // Deterministic hash of user ID to percentage
  const hash = Array.from(userId).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const userPercent = hash % 100;

  return userPercent < rolloutPercent;
}
```

```bash
# .env.production - Update each stage
VITE_V2_ROLLOUT_PERCENT=10   # Day 1-2
VITE_V2_ROLLOUT_PERCENT=25   # Day 3-4
VITE_V2_ROLLOUT_PERCENT=50   # Day 5-7
# ... etc
```

#### 4.3 Rollback Plan

If issues detected at ANY stage:

```bash
# Immediate rollback
VITE_USE_V2_QUESTIONS=false

# Or: Reduce rollout percentage
VITE_V2_ROLLOUT_PERCENT=0
```

#### 4.4 Complete Rollout

When 100% rollout is stable for 48 hours:

```bash
# .env.production - Final state
VITE_USE_V2_QUESTIONS=true
VITE_V2_ROLLOUT_PERCENT=100
VITE_V2_BETA_USERS=  # Clear beta list
VITE_V2_TEST_TYPES=  # All test types
```

---

### Phase 5: Cleanup (2-3 days)

**Goal:** Remove V1 code and simplify architecture

#### 5.1 Deprecate V1 Service

```typescript
// src/services/supabaseQuestionService.ts

/**
 * @deprecated Use questionServiceFactory instead
 * This file will be removed in v3.0
 */

export function fetchQuestionsFromSupabase() {
  console.warn('DEPRECATED: Direct import of V1 service. Use questionServiceFactory.');
  // ... existing implementation
}
```

#### 5.2 Update All Imports to V2

Replace factory with direct V2 imports:

```typescript
// Before:
import { fetchQuestionsFromSupabase } from '@/services/questionServiceFactory';

// After:
import { fetchQuestionsFromSupabase } from '@/services/supabaseQuestionService_v2';
```

#### 5.3 Remove V1 Files

After 30 days of 100% V2 usage:

```bash
# Move to archive
mkdir -p src/services/deprecated
git mv src/services/supabaseQuestionService.ts src/services/deprecated/
git mv src/services/questionServiceFactory.ts src/services/deprecated/

# Rename V2 to be primary
git mv src/services/supabaseQuestionService_v2.ts src/services/supabaseQuestionService.ts

# Update all imports (automated with find/replace)
```

#### 5.4 Database Table Deprecation

**DO NOT DELETE V1 TABLES YET** - Keep for rollback safety

After 90 days of stable V2:
1. Create read-only view of V1 tables
2. Rename tables: `questions` → `questions_deprecated_v1`
3. Keep for 1 year for audit purposes

---

## Testing Strategy

### Automated Tests

**Unit Tests:**
- Question transformation consistency
- Answer format parsing
- Difficulty mapping
- Passage relationship handling

**Integration Tests:**
- Full test session lifecycle
- Session resume functionality
- Progress tracking accuracy
- Analytics recording

**E2E Tests (Playwright/Cypress):**
- Complete practice test flow
- Drill mode easy → medium → hard
- Diagnostic test completion
- Review mode navigation

### Manual Testing Checklist

**For Each Test Type:**
- [ ] Browse available tests
- [ ] Start practice test
- [ ] Answer mix of questions
- [ ] Flag 2-3 questions
- [ ] Save and exit mid-test
- [ ] Resume saved test
- [ ] Complete test
- [ ] Review results
- [ ] Check profile progress updates
- [ ] Start drill mode
- [ ] Complete 5 questions
- [ ] Try all difficulty levels
- [ ] Complete diagnostic test

### Monitoring Metrics

**Key Metrics to Track:**
- Test session start rate
- Test session completion rate
- Average questions answered per session
- Error rate (client-side exceptions)
- API response times (p50, p95, p99)
- User-reported issues
- Refund/complaint rate

**Red Flags:**
- Completion rate drops > 10%
- Error rate increases > 5%
- Load time increases > 20%
- Multiple users report same issue
- Any data loss incidents

---

## Risk Mitigation

### High-Risk Areas

1. **Session Resume Failure**
   - Risk: Users lose progress mid-test
   - Mitigation: Extensive testing of `testSessionService.ts`
   - Rollback trigger: Any data loss report

2. **Question Count Mismatch**
   - Risk: Users see fewer questions than before
   - Mitigation: Run validation script before each phase
   - Rollback trigger: Count difference > 5%

3. **Performance Regression**
   - Risk: V2 loads slower, poor UX
   - Mitigation: Load testing before production
   - Rollback trigger: Load time > 2x baseline

4. **Passage Display Issues**
   - Risk: Reading comprehension passages missing/broken
   - Mitigation: Visual regression testing
   - Rollback trigger: Multiple reports of missing content

5. **Answer Format Incompatibility**
   - Risk: Correct answers marked wrong
   - Mitigation: Extensive transform function testing
   - Rollback trigger: User reports wrong scoring

### Rollback Procedures

**Immediate Rollback (<5 minutes):**
```bash
# Update .env.production
VITE_USE_V2_QUESTIONS=false

# Redeploy (no code changes needed)
npm run build
# Deploy to hosting
```

**Partial Rollback:**
```bash
# Disable for specific test type
VITE_V2_TEST_TYPES=year-5-naplan,year-7-naplan  # Remove problematic type

# Or: Reduce rollout percentage
VITE_V2_ROLLOUT_PERCENT=25  # Down from 50%
```

---

## Timeline Summary

| Phase | Duration | Tasks | Success Criteria |
|-------|----------|-------|------------------|
| **Phase 0: Preparation** | 1-2 days | Feature flags, validation script, tests | All scripts run successfully |
| **Phase 1: Dual-Mode Service** | 2-3 days | Create V2 service, factory, update imports | Build succeeds, V1 still works |
| **Phase 2: Internal Testing** | 3-5 days | Test all test types, compare output | All manual tests pass |
| **Phase 3: Beta Testing** | 5-7 days | 30-60 beta users, collect feedback | No critical issues reported |
| **Phase 4: Gradual Rollout** | 7-14 days | 10% → 100% over 2 weeks | Metrics stable at each stage |
| **Phase 5: Cleanup** | 2-3 days | Remove V1 code, rename files | Simplified codebase |
| **Total** | **20-34 days** | | **100% V2 production** |

---

## Communication Plan

### Internal Team

- **Daily standups:** Share migration progress
- **Incident channel:** Slack/Discord for immediate issues
- **Weekly summary:** Metrics dashboard + blockers

### Beta Users

- **Onboarding email:** Explain beta participation, set expectations
- **Feedback form:** Google Forms or Typeform for structured input
- **Thank you reward:** Free month extension or bonus content

### All Customers

- **Pre-announcement (1 week before):** "We're improving our question engine"
- **Rollout notice (day of):** "New features rolling out gradually"
- **Completion announcement:** "Upgrade complete, here's what's new"

### Support Team

- **Training doc:** How to identify V1 vs V2 issues
- **FAQ:** Common migration questions
- **Escalation path:** When to involve engineering

---

## Success Criteria

### Technical Success
- ✅ 0 data loss incidents
- ✅ Error rate ≤ V1 baseline
- ✅ Load time ≤ 1.2x V1 baseline
- ✅ 100% session resume success rate
- ✅ All automated tests passing

### Business Success
- ✅ User satisfaction ≥ 4.5/5
- ✅ Complaint rate ≤ 1%
- ✅ Refund requests ≤ 0.5%
- ✅ Completion rate ≥ V1 baseline
- ✅ Support ticket volume ≤ V1 baseline

### Operational Success
- ✅ Simplified codebase (single service)
- ✅ Improved maintainability
- ✅ Better data quality
- ✅ Easier to add new test types

---

## Appendix A: File Changes Checklist

### New Files
- [ ] `/src/config/featureFlags.ts`
- [ ] `/src/services/supabaseQuestionService_v2.ts`
- [ ] `/src/services/questionServiceFactory.ts`
- [ ] `/src/services/__tests__/supabaseQuestionService.test.ts`
- [ ] `/scripts/migration/validate-v2-data.ts`
- [ ] `/scripts/migration/compare-v1-v2-output.ts`
- [ ] `/scripts/migration/monitor-v2-usage.ts`

### Modified Files
- [ ] `/src/pages/PracticeTests.tsx` (import change)
- [ ] `/src/pages/Drill.tsx` (import change)
- [ ] `/src/pages/Diagnostic.tsx` (import change)
- [ ] `/src/components/Header.tsx` (beta badge)
- [ ] `.env.local` (feature flags)
- [ ] `.env.production` (feature flags)

### Deprecated Files (Phase 5)
- [ ] `/src/services/supabaseQuestionService.ts` → `deprecated/`
- [ ] `/src/services/questionServiceFactory.ts` → `deprecated/`

---

## Appendix B: Environment Variables Reference

```bash
# Feature Flags
VITE_USE_V2_QUESTIONS=true|false           # Master switch
VITE_V2_TEST_TYPES=type1,type2             # Comma-separated test types
VITE_V2_BETA_USERS=uuid1,uuid2             # Comma-separated user UUIDs
VITE_V2_ROLLOUT_PERCENT=0-100              # Percentage of users

# Existing (unchanged)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
VITE_ENABLE_ACCESS_CONTROL=true
VITE_ENABLE_PAYWALL_UI=true
```

---

## Questions & Concerns

**Q: What if a user starts a test on V1 and we switch to V2 mid-session?**
A: Session data is tied to specific question IDs. The feature flag is checked on load, not during session. Users who started on V1 will complete on V1.

**Q: Can we migrate test-by-test instead of all-or-nothing?**
A: Yes! Use `VITE_V2_TEST_TYPES=year-5-naplan` to enable for specific tests.

**Q: What happens to historical user progress data?**
A: User progress is stored separately from questions. Analytics continue to work regardless of question source.

**Q: How do we handle emergency rollback?**
A: Set `VITE_USE_V2_QUESTIONS=false` and redeploy. Takes <5 minutes.

**Q: What if V2 tables get out of sync with V1?**
A: Run validation script daily during migration. If drift detected, pause rollout and investigate.

---

## Conclusion

This phased migration strategy prioritizes **safety and testability** above speed. By building dual-mode infrastructure, we can:

1. **Test thoroughly** before exposing to customers
2. **Roll out gradually** to detect issues early
3. **Rollback instantly** if problems arise
4. **Maintain service** throughout migration
5. **Simplify codebase** once complete

The entire migration takes 3-5 weeks, with most of that time spent on testing and gradual rollout. The actual code changes are minimal (~500 lines total) and low-risk.

**Recommended Next Steps:**
1. Review and approve this strategy
2. Begin Phase 0 (preparation)
3. Schedule daily check-ins during migration
4. Assign team member to monitor metrics
5. Prepare communication templates

---

**Document Version:** 1.0
**Last Updated:** 2026-02-26
**Author:** Claude
**Status:** Draft - Awaiting Approval
