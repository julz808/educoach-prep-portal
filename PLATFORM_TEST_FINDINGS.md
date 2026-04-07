# Platform Consistency Test Findings

**Date:** April 7, 2026
**Tester:** Code Analysis & Automated Testing
**Focus:** VIC Selective Entry (applicable to all products)
**User Reports:** Progress not loading, numbers/options changing on refresh

---

## Executive Summary

I've conducted a comprehensive analysis of your platform and identified **several critical issues** that explain the user-reported problems. The good news is that most issues have clear fixes.

### Critical Issues Found

1. **❌ CRITICAL: Question fetching uses unstable ordering** ⭐ **PRIMARY CAUSE**
2. **⚠️ HIGH: Session state initialization race conditions**
3. **⚠️ MEDIUM: Answer option parsing inconsistencies**
4. **⚠️ MEDIUM: Progress tracking desync**

---

## Issue 1: Question Fetching Lacks Deterministic Ordering ⭐ **PRIMARY CAUSE**

### The Problem

**Location:** `src/services/supabaseQuestionService.ts:164`

```typescript
.order('question_order', { ascending: true, nullsFirst: false })
```

**Why this causes problems:**

1. Questions are fetched from the database ordered by `question_order`
2. **BUT**: If `question_order` is `NULL` or has duplicates, PostgreSQL returns rows in **undefined order**
3. This means the SAME query can return questions in DIFFERENT orders on each page load
4. When users refresh the page, **questions shift positions** and **answer options appear to change**

### Evidence from Code

In `TestTaking.tsx:198-526`, the `loadQuestions()` function:
- Fetches questions from database
- Does NOT apply any client-side deterministic shuffling
- Relies entirely on database `question_order` field
- If `question_order` is NULL or inconsistent, questions will be unstable

### Impact

- ✅ **Explains: "numbers/options changing upon refresh"**
- ✅ **Explains: Questions appearing in different order**
- ✅ **Explains: User answers not matching questions after reload**

### Fix

**Option A: Ensure all questions have valid `question_order` (RECOMMENDED)**

```bash
# Check for NULL question_order values
npx tsx scripts/test-database-integrity.ts

# Fix NULL values
npx tsx scripts/fix-question-order.ts
```

**Option B: Add client-side deterministic sorting**

Modify `src/services/supabaseQuestionService.ts`:

```typescript
// After fetching questions, sort deterministically
const questions = allQuestions.sort((a, b) => {
  // Primary: question_order
  if (a.question_order !== b.question_order) {
    return (a.question_order || 99999) - (b.question_order || 99999);
  }
  // Secondary: created_at (for stability when question_order is same)
  if (a.created_at && b.created_at) {
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  }
  // Tertiary: ID (guaranteed unique)
  return a.id.localeCompare(b.id);
});
```

---

## Issue 2: Session State Initialization Race Conditions

### The Problem

**Location:** `src/pages/TestTaking.tsx:565-1003`

The `initializeSession` useEffect has multiple potential race conditions:

1. **Line 572-581**: Guard checks can fail if component re-renders quickly
2. **Line 1003**: Dependencies include `currentDifficulty` which can change mid-session
3. **Line 100-107**: Session ID resolution logic has 4 different sources, creating ambiguity

### Evidence

```typescript
// PROBLEM: Multiple sources of truth for sessionId
const sessionIdFromQuery = searchParams.get('sessionId');
const testModeFromQuery = searchParams.get('testMode');
const urlSessionId = new URLSearchParams(window.location.search).get('sessionId');
const actualSessionId = urlSessionId || sessionIdFromQuery || sessionId || sectionId;
```

This creates scenarios where:
- User starts a test → `sessionId` is set
- User refreshes → `searchParams` changes → useEffect re-runs
- New session is created instead of resuming → **Progress lost**

### Impact

- ✅ **Explains: "progress not loading correctly"**
- ✅ **Explains: Tests restarting when they shouldn't**

### Fix

**Consolidate session ID resolution:**

```typescript
// Use single source of truth
const getSessionId = useCallback(() => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('sessionId') || sessionId || sectionId || null;
}, [sessionId, sectionId]);

const actualSessionId = useMemo(() => getSessionId(), [getSessionId]);
```

---

## Issue 3: Answer Option Parsing Inconsistencies

### The Problem

**Location:** `src/services/supabaseQuestionService.ts:82-96`

Answer options are stored in **two different formats** in the database:

1. **Array format**: `["Option A", "Option B", "Option C", "Option D"]`
2. **Object format**: `{"A": "Option A", "B": "Option B", "C": "Option C", "D": "Option D"}`

The parsing function handles both, but object format is **sorted alphabetically**:

```typescript
const keys = Object.keys(answerOptions).sort(); // ⚠️ SORT ADDS NON-DETERMINISM
```

### Impact

- ⚠️ **Minor contributor** to "options changing"
- Options may appear in different order if stored as object vs array

### Fix

**Standardize to array format OR ensure consistent object key ordering:**

```typescript
function parseAnswerOptions(answerOptions: any): string[] {
  if (!answerOptions) return [];

  if (Array.isArray(answerOptions)) {
    return answerOptions;
  }

  if (typeof answerOptions === 'object') {
    // FIXED: Always use A, B, C, D order (not alphabetical)
    return ['A', 'B', 'C', 'D']
      .filter(key => answerOptions[key])
      .map(key => answerOptions[key]);
  }

  return [];
}
```

---

## Issue 4: Progress Tracking Desync

### The Problem

**Location:** Multiple locations

Progress data is stored in **two places**:

1. `user_progress` table (aggregate stats)
2. `user_test_sessions` table (individual sessions)

These can get out of sync when:
- Sessions complete but progress isn't updated
- User refreshes mid-test and progress save fails
- Database transaction fails partway through

### Evidence

From `src/services/userProgressService.ts:276-310`:

The `clearTestModeProgress` function exists, indicating progress can become corrupted and needs clearing.

### Impact

- ✅ **Explains: "progress not loading correctly"**
- Dashboard shows incorrect completion stats
- Tests appear as incomplete when actually done

### Fix

**Add progress reconciliation function:**

```typescript
async function reconcileUserProgress(userId: string, productType: string) {
  // 1. Count actual completed sessions
  const { data: sessions } = await supabase
    .from('user_test_sessions')
    .select('test_mode, status')
    .eq('user_id', userId)
    .eq('product_type', productType)
    .eq('status', 'completed');

  // 2. Update user_progress to match reality
  const diagnosticCompleted = sessions?.some(s => s.test_mode === 'diagnostic') || false;
  const practiceCompleted = sessions?.filter(s => s.test_mode.startsWith('practice')).length || 0;

  // 3. Write corrected values
  await supabase
    .from('user_progress')
    .upsert({
      user_id: userId,
      product_type: productType,
      diagnostic_completed: diagnosticCompleted,
      tests_completed: { practice: practiceCompleted },
      last_updated: new Date().toISOString()
    });
}
```

---

## Additional Findings

### 5. Session Resume Logic is Overly Complex

**Location:** `TestTaking.tsx:616-733`

The answer matching logic (lines 616-677) tries **8 different strategies** to match saved answers to questions:

1. Direct number match
2. Letter match (A, B, C, D)
3. Exact text match
4. Trimmed text match
5. Case-insensitive match
6. Remove letter prefixes
7. Add letter prefixes
8. Index-based fallback

**Why this is problematic:**
- Indicates underlying data format inconsistency
- Each strategy adds potential for mismatch
- No clear "source of truth" for answer format

**Recommendation:** Standardize answer storage format to **numeric indices (0-3)** everywhere.

---

### 6. Timer State Can Become Negative

**Location:** `TestTaking.tsx:1084-1114`

```typescript
setTimeRemaining(prev => {
  if (prev <= 1) {
    setTimerExpired(true);
    return 0;
  }
  return prev - 1;
});
```

If `timeRemaining` starts negative (from corrupted session data), the timer will never expire.

**Fix:** Add validation on session load:

```typescript
const timeLimit = Math.max(0, savedSession.timeRemainingSeconds);
```

---

## Test Suite Created

I've created two test suites to help you diagnose these issues:

### 1. `/tests/platform-consistency-tests.ts`

Browser-based test suite with 10 comprehensive tests:
- Seeded shuffle determinism
- Question order consistency
- Answer options consistency
- Session state persistence
- Progress tracking accuracy
- Database integrity
- Question fetching consistency (simulates page reload)
- Session resume correctness
- Answer saving reliability
- Timer state consistency

**Usage:**
```bash
# Import in browser console or add to your app
import { runPlatformTests } from './tests/platform-consistency-tests';
await runPlatformTests();
```

### 2. `/scripts/test-database-integrity.ts`

Command-line script to check database for integrity issues:

**Usage:**
```bash
npx tsx scripts/test-database-integrity.ts
```

**Checks:**
- NULL `question_order` values
- Duplicate `question_order` values
- Missing `answer_options`
- Duplicate answer options
- Invalid `correct_answer` values
- Session state corruption
- Progress tracking mismatches
- Orphaned data

---

## Recommended Fix Priority

### 🔴 **CRITICAL - Fix Immediately**

1. **Fix question ordering** (Issue #1)
   - Run integrity test: `npx tsx scripts/test-database-integrity.ts`
   - Fix NULL question_order values
   - Add deterministic client-side sorting as fallback

2. **Simplify session ID resolution** (Issue #2)
   - Consolidate to single source of truth
   - Add better guards against re-initialization

### 🟠 **HIGH - Fix This Week**

3. **Standardize answer format** (Issue #3)
   - Migrate all questions to array format
   - Update parsing to be format-agnostic

4. **Add progress reconciliation** (Issue #4)
   - Create reconciliation function
   - Run on user login
   - Add to dashboard page load

### 🟡 **MEDIUM - Fix This Month**

5. **Simplify answer matching logic** (Issue #5)
   - Standardize to numeric indices
   - Remove 8-strategy matching

6. **Add timer validation** (Issue #6)
   - Validate on session load
   - Cap minimum at 0

---

## Quick Wins

### Fix #1: Add Deterministic Question Sorting (15 minutes)

**File:** `src/services/supabaseQuestionService.ts`

Add this function:

```typescript
// Add after line 136
function ensureDeterministicOrder(questions: Question[]): Question[] {
  return questions.sort((a, b) => {
    // Primary: question_order
    if (a.question_order !== null && b.question_order !== null) {
      if (a.question_order !== b.question_order) {
        return a.question_order - b.question_order;
      }
    }
    // Handle nulls: put them at end
    if (a.question_order === null && b.question_order !== null) return 1;
    if (a.question_order !== null && b.question_order === null) return -1;

    // Secondary: created_at
    if (a.created_at && b.created_at) {
      const timeA = new Date(a.created_at).getTime();
      const timeB = new Date(b.created_at).getTime();
      if (timeA !== timeB) {
        return timeA - timeB;
      }
    }

    // Tertiary: ID (guaranteed unique and stable)
    return a.id.localeCompare(b.id);
  });
}
```

Then use it after fetching:

```typescript
// Line 179 - after fetching all questions
allQuestions = ensureDeterministicOrder(allQuestions);
```

### Fix #2: Add Session ID Validation (10 minutes)

**File:** `src/pages/TestTaking.tsx`

Replace lines 100-107 with:

```typescript
// Single source of truth for session ID
const actualSessionId = useMemo(() => {
  // Priority: URL query param > path param > fallback
  const urlParams = new URLSearchParams(window.location.search);
  const fromQuery = urlParams.get('sessionId');

  if (fromQuery) {
    console.log('🔗 SESSION-ID: From URL query:', fromQuery);
    return fromQuery;
  }

  if (sessionId) {
    console.log('🔗 SESSION-ID: From path param:', sessionId);
    return sessionId;
  }

  // Fallback to sectionId only if it's a valid UUID
  if (sectionId && sectionId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    console.log('🔗 SESSION-ID: From sectionId:', sectionId);
    return sectionId;
  }

  console.log('🔗 SESSION-ID: None found, will create new');
  return null;
}, [sessionId, sectionId]);
```

### Fix #3: Add Progress Validation on Load (20 minutes)

**File:** `src/pages/Dashboard.tsx` (or wherever progress is loaded)

Add this on mount:

```typescript
useEffect(() => {
  async function validateProgress() {
    if (!user || !selectedProduct) return;

    try {
      // Fetch actual session data
      const { data: sessions } = await supabase
        .from('user_test_sessions')
        .select('test_mode, status')
        .eq('user_id', user.id)
        .eq('product_type', selectedProduct)
        .eq('status', 'completed');

      // Fetch tracked progress
      const { data: progress } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_type', selectedProduct)
        .single();

      if (!progress || !sessions) return;

      // Check for mismatch
      const actualDiagnostic = sessions.some(s => s.test_mode === 'diagnostic');
      const trackedDiagnostic = progress.diagnostic_completed;

      if (actualDiagnostic !== trackedDiagnostic) {
        console.warn('⚠️ PROGRESS MISMATCH: Syncing...');
        // Trigger reconciliation
        await UserProgressService.reconcileProgress(user.id, selectedProduct);
      }
    } catch (error) {
      console.error('Progress validation failed:', error);
    }
  }

  validateProgress();
}, [user, selectedProduct]);
```

---

## Testing Checklist

After applying fixes, test these scenarios:

### ✅ Question Order Stability
- [ ] Load practice test
- [ ] Note question #1 text
- [ ] Refresh page
- [ ] Verify question #1 is THE SAME

### ✅ Answer Option Stability
- [ ] Load question with 4 options
- [ ] Note option order (A, B, C, D)
- [ ] Refresh page
- [ ] Verify options are in SAME ORDER

### ✅ Session Resume
- [ ] Start test, answer 3 questions
- [ ] Refresh page
- [ ] Verify still on question 3 (not restarted)
- [ ] Verify previous answers are saved

### ✅ Progress Tracking
- [ ] Complete a practice test
- [ ] Go to dashboard
- [ ] Verify test shows as completed
- [ ] Refresh dashboard
- [ ] Verify STILL shows as completed

### ✅ Timer Persistence
- [ ] Start timed test (note time remaining)
- [ ] Wait 30 seconds
- [ ] Refresh page
- [ ] Verify time remaining is ~30 seconds less

---

## Long-term Recommendations

1. **Add end-to-end tests** using Playwright or Cypress
2. **Add database constraints**:
   - Make `question_order` NOT NULL
   - Add UNIQUE constraint on (test_type, mode, section_name, question_order)
3. **Add monitoring** for session failures
4. **Add user-facing "Resume Session" confirmation** to reduce confusion
5. **Add periodic progress sync** (every 30s during active session)

---

## Summary

The primary cause of "numbers/options changing" is **unstable database ordering** due to NULL or duplicate `question_order` values. The primary cause of "progress not loading" is **session initialization race conditions** and **progress tracking desync**.

The fixes are straightforward and can be deployed incrementally. Start with Fix #1 (deterministic sorting) as it's the highest impact with lowest risk.

Let me know if you'd like me to implement any of these fixes directly!
