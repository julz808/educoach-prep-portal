# VIC Selective Diagnostic Questions Deletion Failure Investigation

## Problem Summary
The deletion script found 74 VIC Selective diagnostic questions but deleted 0, indicating a failure in the deletion process.

## Root Cause Analysis

### 1. Foreign Key Constraints
The primary issue is **foreign key constraints** preventing deletion. Based on the database schema analysis:

**Tables with foreign key references to `questions.id`:**
- `question_attempt_history.question_id` → `questions.id`
- `writing_assessments.question_id` → `questions.id`

**Impact:** PostgreSQL prevents deletion of parent records (questions) when child records exist, unless the foreign key is configured with `CASCADE` deletion (which it isn't).

### 2. Row Level Security (RLS) Policies
**Potential Issue:** The questions table may have RLS enabled, requiring authenticated access for deletion operations.

**Evidence:**
- The script uses the public anon key (`SUPABASE_PUBLISHABLE_KEY`)
- RLS policies would block unauthenticated users from deleting records
- No explicit RLS policies found in migration files for questions table

### 3. Authentication Context
**Issue:** The deletion script runs without user authentication, which may be blocked by RLS policies.

## Solutions

### Solution 1: Fix Foreign Key Constraints (Recommended)
**File Updated:** `/scripts/delete-vic-diagnostic-questions.ts`

**Changes Made:**
1. **Step 1:** Delete dependent records from `question_attempt_history`
2. **Step 2:** Delete dependent records from `writing_assessments`  
3. **Step 3:** Delete the questions themselves

**Code Changes:**
```typescript
// Get question IDs first
const questionIds = existingQuestions.map(q => q.id);

// Delete question attempt history
const { error: historyDeleteError, count: historyDeletedCount } = await supabase
  .from('question_attempt_history')
  .delete({ count: 'exact' })
  .in('question_id', questionIds);

// Delete writing assessments
const { error: assessmentDeleteError, count: assessmentDeletedCount } = await supabase
  .from('writing_assessments')
  .delete({ count: 'exact' })
  .in('question_id', questionIds);

// Finally delete questions
const { error: deleteError, count: deletedCount } = await supabase
  .from('questions')
  .delete({ count: 'exact' })
  .eq('test_type', testType)
  .eq('test_mode', testMode);
```

### Solution 2: Use Service Role for Admin Operations
**Alternative:** Use Supabase service role key for admin operations that bypass RLS.

**Implementation:**
1. Add service role key to environment variables
2. Create admin client for deletion operations
3. Use admin client for question deletion

### Solution 3: SQL-Based Deletion
**Files Created:**
- `/investigate-deletion-failure.sql` - Diagnostic queries
- `/fix-deletion-script.sql` - Direct SQL deletion with proper order

**Usage:**
```sql
-- Run in Supabase SQL editor or via psql
BEGIN;
-- Delete dependent records first
DELETE FROM question_attempt_history WHERE question_id IN (...);
DELETE FROM writing_assessments WHERE question_id IN (...);
-- Delete questions
DELETE FROM questions WHERE test_type = '...' AND test_mode = '...';
COMMIT;
```

## Diagnostic Tools Created

### 1. Permission Diagnosis Script
**File:** `/scripts/diagnose-deletion-permissions.ts`

**Purpose:** 
- Check if questions exist
- Identify foreign key dependencies
- Test delete permissions
- Verify authentication status
- Provide specific recommendations

**Usage:**
```bash
npx tsx scripts/diagnose-deletion-permissions.ts
```

### 2. SQL Investigation Scripts
**Files:**
- `investigate-deletion-failure.sql` - Check RLS, constraints, and permissions
- `fix-deletion-script.sql` - Safe deletion with proper ordering

## Verification Steps

### Before Running Fixed Script:
1. **Run diagnosis:** `npx tsx scripts/diagnose-deletion-permissions.ts`
2. **Check dependencies:** Count related records
3. **Verify authentication:** Ensure proper access

### After Running Fixed Script:
1. **Verify deletion:** Check questions table is empty for VIC diagnostic
2. **Check referential integrity:** Ensure no orphaned records
3. **Test generation:** Run new question generation

## Database Schema Insights

### Current Foreign Key Relationships:
```sql
-- question_attempt_history
CONSTRAINT question_attempt_history_question_id_fkey 
FOREIGN KEY (question_id) REFERENCES public.questions(id)

-- writing_assessments  
CONSTRAINT writing_assessments_question_id_fkey
FOREIGN KEY (question_id) REFERENCES public.questions(id)
```

### Recommended Improvements:
1. **Add CASCADE deletion** for admin operations
2. **Implement soft deletion** for question versioning
3. **Add deletion policies** for proper cleanup workflows

## Next Steps

1. **Test the updated deletion script:**
   ```bash
   npx tsx scripts/delete-vic-diagnostic-questions.ts
   ```

2. **If issues persist, run diagnosis:**
   ```bash
   npx tsx scripts/diagnose-deletion-permissions.ts
   ```

3. **Consider SQL-based deletion** as fallback:
   ```bash
   # Run fix-deletion-script.sql in Supabase dashboard
   ```

4. **Verify successful deletion** before regenerating questions

## Prevention for Future

1. **Test deletion scripts** on small datasets first
2. **Check foreign key constraints** before bulk operations  
3. **Use transactions** for multi-table operations
4. **Implement proper error handling** for constraint violations
5. **Consider using database functions** for complex deletion logic

The updated deletion script should now properly handle the foreign key constraints and successfully delete the VIC Selective diagnostic questions.