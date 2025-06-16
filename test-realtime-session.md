# Real-time Session Management Testing Guide

## Overview
This guide outlines how to test the real-time answer submission and auto-save functionality for all test-taking modes.

## Test Scenarios

### 1. Real-time Answer Submission Test
**What to test:**
- Answers are immediately saved to backend on submission
- UI shows real-time sync status
- Page reload restores exact answers

**Steps:**
1. Start any test (diagnostic/practice/drill)
2. Answer 3-5 questions
3. Watch for "Saved to Backend" indicator after each answer
4. Refresh the page or close/reopen browser
5. Verify all answers are restored exactly

**Expected Results:**
- ✅ Green "Synced" indicator shows after each answer
- ✅ "Saved to Backend" confirmation appears
- ✅ All answers preserved after page reload
- ✅ Question position maintained

### 2. Flag Persistence Test
**What to test:**
- Flagged questions persist to backend immediately
- Flags are restored on resume

**Steps:**
1. Start a test
2. Flag 2-3 questions
3. Watch for backend sync indicators
4. Refresh page or navigate away and back
5. Verify flagged questions are still flagged

**Expected Results:**
- ✅ Flags sync to backend immediately
- ✅ Flagged questions restored on resume

### 3. Timer Persistence Test
**What to test:**
- Timer state is saved every 10 seconds
- Timer resumes from exact position

**Steps:**
1. Start a test
2. Let timer run for 2-3 minutes
3. Watch for "Timer Sync" indicator
4. Refresh page
5. Verify timer continues from correct position

**Expected Results:**
- ✅ Timer sync indicator appears every 10 seconds
- ✅ Timer resumes within 10 seconds of actual position
- ✅ No timer reset on page reload

### 4. Multi-Device Session Test
**What to test:**
- Session state syncs across devices
- Real-time updates across tabs

**Steps:**
1. Start test on Device A
2. Answer some questions
3. Open same session on Device B
4. Verify answers appear on Device B
5. Continue test on Device B
6. Verify progress syncs back to Device A

**Expected Results:**
- ✅ Session state syncs across devices
- ✅ Real-time updates visible

### 5. Network Interruption Test
**What to test:**
- Graceful handling of network failures
- Queue and sync when reconnected

**Steps:**
1. Start test
2. Disable network connection
3. Answer several questions
4. Watch for offline indicators
5. Re-enable network
6. Verify answers sync to backend

**Expected Results:**
- ✅ "Sync Failed" indicator during offline
- ✅ Answers queued locally
- ✅ Auto-sync when reconnected

### 6. Session Exit/Resume Test
**What to test:**
- Complete state preservation on exit
- Perfect resume experience

**Steps:**
1. Start test, answer questions, flag some
2. Close browser tab/window
3. Reopen and navigate to test
4. Verify everything restored exactly

**Expected Results:**
- ✅ All answers restored
- ✅ Flagged questions maintained
- ✅ Timer position preserved
- ✅ Current question position exact

## Testing All Modes

### Diagnostic Tests
- Multi-section persistence
- Section-level state tracking
- Cross-section state preservation

### Practice Tests
- Numbered test sessions (1-5)
- Individual test state isolation
- Progress tracking per test

### Drill Sessions
- Sub-skill specific state
- Difficulty level preservation
- Immediate feedback mode

## Success Criteria

**✅ Real-time Persistence:**
- Every answer saves to backend within 2 seconds
- No data loss on unexpected exit
- Perfect state restoration on resume

**✅ UI Indicators:**
- Clear sync status at all times
- Visual confirmation of saves
- Network status visibility

**✅ Cross-Platform:**
- Works on all devices
- State syncs across tabs
- Consistent experience everywhere

**✅ Error Recovery:**
- Graceful offline handling
- Auto-retry on reconnection
- No duplicate submissions

## Performance Targets

- Answer submission: < 2 seconds
- State restoration: < 3 seconds
- Timer sync frequency: 10 seconds
- Full state save: < 1 second

## Troubleshooting

**If answers don't persist:**
1. Check browser network tab for API errors
2. Verify Supabase connection
3. Check user authentication status
4. Verify database functions exist

**If timer doesn't restore:**
1. Check test_section_states table
2. Verify timer sync interval running
3. Check for JavaScript errors

**If flags don't work:**
1. Check update_flagged_questions function
2. Verify array handling in backend
3. Check RLS policies