# Test Plan: Tab Switching Fix for Test Taking Platform

## Bug Report Summary
**Severity: 2** - Data loss and inability to complete tests
**Issue**: Page refreshes and resets when switching tabs, causing:
- Loss of written answers (especially catastrophic for 5+ minute essays)
- Test jumps back to question 1
- Loss of current progress

## Root Cause
The initialization `useEffect` had `searchParams` in its dependency array. When the code added `sessionId` to the URL, it changed `searchParams`, triggering the useEffect to re-run and re-initialize the entire session, causing the page to "refresh".

## Fix Implementation

### Changes Made:

1. **Added `sessionLoadedRef`** (line 147)
   - Tracks whether a session has been successfully loaded
   - Prevents re-initialization when session already exists

2. **Added Early Return Guard** (lines 569-574)
   - Checks if session is already loaded before re-initializing
   - Logs skip message for debugging

3. **Set Session Loaded Flag** (lines 712-714, 919-921, 957-959)
   - Marks session as loaded after successful resume/creation
   - Applied to all three session creation paths:
     - Resume with sessionId
     - Resume existing session found during creation
     - Create new session

4. **Removed `searchParams` from Dependency Array** (line 992)
   - Prevents re-initialization loop
   - Added comment explaining the fix

5. **Added Cleanup Function** (lines 987-991)
   - Resets `sessionLoadedRef` when component unmounts
   - Resets when test type/subject changes
   - Ensures proper behavior when navigating between tests

## Test Scenarios

### Critical Test Cases (Must Pass)

#### Test 1: Tab Switching During Writing Question
**Priority: CRITICAL**
1. Start a test with a writing question (e.g., VIC Selective Writing drill)
2. Navigate to the writing question
3. Type 5 minutes of text (simulate student essay)
4. Switch to another tab (Alt-Tab or open new browser tab)
5. Wait 5 seconds
6. Switch back to the test tab

**Expected Result:**
- ✅ Text should be fully preserved
- ✅ Should remain on the same question
- ✅ No page refresh/reload
- ✅ Timer continues from where it left off

**Previous Behavior:**
- ❌ Text was lost
- ❌ Jumped to question 1
- ❌ Page refreshed

---

#### Test 2: Tab Switching During Multiple Choice
**Priority: HIGH**
1. Start a diagnostic/practice test
2. Answer questions 1-5
3. Navigate to question 5
4. Switch to another tab
5. Switch back

**Expected Result:**
- ✅ Should remain on question 5
- ✅ All answers to questions 1-5 preserved
- ✅ No page refresh
- ✅ Timer continues correctly

---

#### Test 3: Rapid Tab Switching
**Priority: HIGH**
1. Start a test
2. Answer question 1
3. Rapidly switch tabs 10 times (back and forth)

**Expected Result:**
- ✅ No multiple initializations
- ✅ Session remains stable
- ✅ Console shows "🔒 INIT-GUARD: Session already loaded, skipping re-initialization"
- ✅ Answer preserved

---

#### Test 4: Browser Tab Close and Reopen
**Priority: HIGH**
1. Start a test
2. Answer questions 1-3
3. Navigate to question 3
4. Copy the URL
5. Close the tab completely
6. Open new tab and paste URL

**Expected Result:**
- ✅ Session resumes correctly
- ✅ Starts at question 3
- ✅ Answers 1-3 are preserved
- ✅ Console shows "🔒 SESSION-LOADED: Session resumed and marked as loaded"

---

#### Test 5: Minimize Browser
**Priority: MEDIUM**
1. Start a test
2. Answer question 1
3. Minimize browser window
4. Wait 10 seconds
5. Restore browser window

**Expected Result:**
- ✅ Test remains on same question
- ✅ No refresh
- ✅ Visibility change handler saves but doesn't reload

---

#### Test 6: Writing Question Auto-Save During Tab Switch
**Priority: CRITICAL**
1. Start writing question
2. Type 100 words
3. Wait for auto-save (debounced 1 second)
4. Immediately switch tabs
5. Switch back

**Expected Result:**
- ✅ Text is preserved (saved by visibility handler)
- ✅ Console shows "👁️ VISIBILITY: Page hidden, saving text answers"
- ✅ No data loss

---

#### Test 7: Multiple Tests in Sequence
**Priority: MEDIUM**
1. Complete Test 1
2. Navigate back to dashboard
3. Start Test 2
4. Switch tabs
5. Switch back

**Expected Result:**
- ✅ Test 2 loads correctly
- ✅ No interference from Test 1
- ✅ sessionLoadedRef was reset by cleanup
- ✅ Console shows cleanup message when Test 1 unmounted

---

### Edge Cases

#### Edge Case 1: Session ID Already in URL
1. Start test (session ID gets added to URL)
2. Refresh page manually
3. Switch tabs
4. Switch back

**Expected Result:**
- ✅ Session resumes from URL session ID
- ✅ No duplicate initialization
- ✅ Tab switch doesn't cause reload

---

#### Edge Case 2: Network Delay During Save
1. Throttle network to Slow 3G
2. Start writing question
3. Type text
4. Immediately switch tabs (before auto-save completes)

**Expected Result:**
- ✅ Visibility handler triggers immediate save
- ✅ Text preserved even with slow network
- ✅ User sees loading state if applicable

---

#### Edge Case 3: Different Difficulty Levels (Drills)
1. Start drill at Easy difficulty
2. Answer 2 questions
3. Change difficulty to Hard
4. Switch tabs
5. Switch back

**Expected Result:**
- ✅ New session created for Hard difficulty
- ✅ Easy session saved separately
- ✅ No interference between sessions

---

## Console Monitoring

### Expected Console Messages (Happy Path)

**Initial Load:**
```
🆕 Creating/getting session
🔥 TIMER DEBUG: About to calculate time for: {...}
🔒 SESSION-LOADED: New session created and marked as loaded
🔗 URL-UPDATE: Added sessionId to URL via setSearchParams: [uuid]
```

**Tab Switch:**
```
👁️ VISIBILITY: Page hidden, saving text answers
[On return, should NOT see initialization messages]
🔒 INIT-GUARD: Session already loaded, skipping re-initialization
```

**Component Unmount:**
```
🧹 CLEANUP: Resetting sessionLoadedRef on unmount/test change
```

### Console Messages to Watch For (Potential Issues)

❌ **Bad**: Multiple "Creating/getting session" messages without user action
❌ **Bad**: Initialization running after "Session already loaded" guard
❌ **Bad**: "Error initializing session" messages
❌ **Bad**: Missing "SESSION-LOADED" flag messages

---

## Verification Checklist

### Code Review
- [x] sessionLoadedRef declared as useRef
- [x] Early return guard added at start of initializeSession
- [x] sessionLoadedRef.current = true in all 3 session creation paths
- [x] searchParams removed from dependency array
- [x] Cleanup function resets sessionLoadedRef
- [x] No TypeScript errors
- [x] Build succeeds

### Functional Testing
- [ ] Test 1: Writing question tab switching (CRITICAL)
- [ ] Test 2: Multiple choice tab switching
- [ ] Test 3: Rapid tab switching
- [ ] Test 4: Browser close/reopen
- [ ] Test 5: Minimize browser
- [ ] Test 6: Auto-save during tab switch
- [ ] Test 7: Multiple tests in sequence

### Edge Case Testing
- [ ] Edge Case 1: Session ID in URL
- [ ] Edge Case 2: Network delay
- [ ] Edge Case 3: Difficulty changes

---

## Rollback Plan

If issues occur:
1. Revert commit with this fix
2. Previous behavior: page refreshes but at least initializes
3. Known issue: students will still lose writing

**Git Revert Command:**
```bash
git revert HEAD
```

---

## Success Criteria

✅ **Fix is successful if:**
1. Students can switch tabs without losing writing
2. Current question position is preserved
3. Timer continues correctly
4. No duplicate initializations
5. Session resumes properly from URL
6. Console shows guard messages preventing re-initialization

❌ **Fix has issues if:**
1. Writing is still lost on tab switch
2. Questions reset to Q1
3. Initialization runs multiple times
4. Session doesn't resume from URL
5. Memory leaks from refs not cleaning up

---

## Performance Impact

**Expected Improvements:**
- Fewer database queries (no re-initialization)
- Fewer component re-renders
- Better memory usage (session loaded once)
- Faster tab switching response

**Monitoring:**
- Check React DevTools for unnecessary re-renders
- Monitor Supabase query counts
- Check browser console for excessive logging

---

## Additional Notes

### Why This Fix Works

1. **sessionLoadedRef** provides a stable reference that doesn't trigger re-renders
2. **Early return guard** prevents expensive re-initialization
3. **Removing searchParams** from dependencies breaks the re-initialization loop:
   - Before: URL change → searchParams change → useEffect runs → URL change → infinite loop
   - After: URL change → searchParams change → (not in dependencies) → no re-run
4. **Cleanup function** ensures proper behavior across navigation

### Auto-Save Strategy

The fix preserves the existing auto-save mechanisms:
- **Multiple choice**: Saves immediately on answer (handleAnswer)
- **Writing**: Debounced save after 1s of no typing
- **Writing**: Periodic save every 5s if typing continues
- **Writing**: Immediate save on visibility change (tab switch)
- **Writing**: Immediate save on beforeunload

### Future Improvements

Consider for future:
1. Add visual indicator when auto-save completes
2. Add offline support with local storage backup
3. Add retry logic for failed saves
4. Add "unsaved changes" warning before navigation
5. Implement optimistic UI updates

---

## Testing Checklist for Parent's Scenario

**Exact reproduction of parent's report:**

1. ✅ Open a test in Chrome
2. ✅ Start writing question
3. ✅ Type for 5 minutes
4. ✅ Open a new tab (empty is fine)
5. ✅ Go back using Alt-Tab from another app
6. ✅ **VERIFY**: Screen doesn't refresh
7. ✅ **VERIFY**: Writing isn't lost
8. ✅ **VERIFY**: Still on same question

**This is THE critical test case.**
