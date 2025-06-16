# Diagnostic Progress Analysis & Fix Plan

## Current Issues Identified

### 1. Missing Database Functions
The frontend code calls many database functions that don't exist yet:
- `create_or_resume_test_session` ✅ **CREATED**
- `get_session_for_resume` ✅ **CREATED** 
- `record_question_response` ✅ **CREATED**
- `update_session_progress` ✅ **CREATED**
- `complete_test_session` ✅ **CREATED**
- `get_session_question_order` ✅ **CREATED**
- `rebuild_session_answers` ✅ **CREATED**

### 2. Status Mapping Issues
**Database Status Values:**
- `user_test_sessions.status`: 'active', 'paused', 'completed', 'abandoned'
- `test_section_states.status`: 'not_started', 'in_progress', 'completed'

**Frontend Expected Values:**
- 'not-started', 'in-progress', 'completed' (with hyphens)

**Fix:** Updated `get_diagnostic_progress` function to properly map status values with hyphens.

### 3. Missing Database Constraint
The `test_section_states` table was missing a unique constraint on `(test_session_id, section_name)`, which prevented the `ON CONFLICT` clauses from working in update functions.

**Fix:** Added unique constraint in migration.

### 4. Session Creation Flow Issues

**Current Flow Problems:**
1. When user starts diagnostic test, `TestSessionService.createOrResumeSession` is called
2. This calls `create_or_resume_test_session` function (was missing)
3. Session should be created in `user_test_sessions` with status 'active'
4. Section state should be created in `test_section_states` with status 'in_progress'
5. Progress should be queryable via `get_diagnostic_progress`

### 5. Session Completion Flow Issues

**What Should Happen:**
1. When test is completed, `TestSessionService.completeSession` is called
2. This calls `complete_test_session` function (was missing)
3. Session status should be updated to 'completed' in `user_test_sessions`
4. Section status should be updated to 'completed' in `test_section_states`
5. `user_progress.diagnostic_completed` should be set to `true`
6. Frontend should then show "View Results" instead of "Start Section"

## Data Flow Analysis

### When User Starts Diagnostic Test:

1. **Frontend:** User clicks "Start Section" on Diagnostic page
2. **Navigation:** Goes to `/test/diagnostic/{sectionId}?sectionName={sectionName}`
3. **TestTaking Component:** Loads and calls `SessionPersistenceService.createOrResumeSession`
4. **Database:** Creates new session in `user_test_sessions` with status 'active'
5. **Database:** Creates section state in `test_section_states` with status 'in_progress'

### When User Takes Test:

1. **Frontend:** User answers questions in `EnhancedTestInterface`
2. **Real-time:** Each answer is saved via `TestSessionService.recordQuestionResponse`
3. **Database:** Answers stored in `question_attempt_history`
4. **Database:** Session progress updated in both tables via auto-save

### When User Completes Test:

1. **Frontend:** Test completion triggers `SessionPersistenceService.completeSession`
2. **Database:** Session status updated to 'completed' in `user_test_sessions`
3. **Database:** Section status updated to 'completed' in `test_section_states`
4. **Database:** `user_progress.diagnostic_completed` set to `true`

### When User Returns to Diagnostic Page:

1. **Frontend:** `SessionPersistenceService.getDiagnosticProgress` called
2. **Database:** `get_diagnostic_progress` function queries both tables
3. **Frontend:** Section shows "View Results" if status = 'completed'
4. **Frontend:** Section shows "Resume Section" if status = 'in-progress'

## Fixes Applied

### ✅ 1. Created Missing Database Functions
- All missing RPC functions have been created in new migration file
- Functions handle session creation, progress tracking, and completion
- Proper error handling and data validation included

### ✅ 2. Fixed Status Mapping
- Updated `get_diagnostic_progress` to return hyphenated status values
- Proper mapping from database status values to frontend expectations
- Handles both session and section status combinations

### ✅ 3. Added Database Constraints
- Added unique constraint on `test_section_states(test_session_id, section_name)`
- This enables proper `ON CONFLICT` handling in update functions

### ✅ 4. Enhanced Progress Tracking
- Session completion now properly updates `user_progress` table
- Progress function returns session IDs for resuming tests
- Proper handling of multiple diagnostic attempts

## Testing Plan

### 1. Start New Diagnostic Test
- Verify session is created with 'active' status
- Verify section state is created with 'in_progress' status
- Verify progress shows as 'in-progress' on dashboard

### 2. Answer Questions During Test
- Verify answers are recorded in `question_attempt_history`
- Verify session progress is auto-saved
- Verify section state is updated with current progress

### 3. Complete Diagnostic Test
- Verify session status changes to 'completed'
- Verify section status changes to 'completed'
- Verify `user_progress.diagnostic_completed` becomes `true`

### 4. Return to Diagnostic Page
- Verify completed section shows "View Results"
- Verify completed sections don't show "Start Section"
- Verify progress data is correctly displayed

## Next Steps

1. **Apply Database Migration**
   - Run the new migration to create all missing functions
   - Verify all functions are created successfully

2. **Test Session Creation**
   - Start a new diagnostic test
   - Verify database entries are created correctly

3. **Test Session Progress**
   - Answer some questions
   - Verify progress is saved and retrievable

4. **Test Session Completion**
   - Complete a diagnostic test
   - Verify status updates and progress marking

5. **Test Dashboard Display**
   - Return to diagnostic page
   - Verify correct button text and status display

## Common Issues to Watch

1. **Status Mismatch:** Ensure status values match between database and frontend
2. **Session ID Missing:** Verify session IDs are properly returned and stored
3. **Progress Not Updating:** Check that auto-save is working correctly
4. **Completion Not Detected:** Verify completion function updates all necessary tables