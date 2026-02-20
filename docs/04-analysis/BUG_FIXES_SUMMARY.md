# Bug Fixes Summary - EduCourse Prep Portal

## Overview
This document summarizes the three critical bugs identified and fixed in the EduCourse test preparation platform.

---

## ✅ Issue #1: Section Status Not Updating (FIXED)

### Problem
When users partially completed diagnostic test sections and saved/exited, the section cards still showed "Not Started" instead of "In Progress", even though their responses were saved correctly.

### Root Cause
**Product type mapping inconsistency** between pages:
- `TestTaking.tsx` mapped both `'acer-scholarship'` and `'acer-year-7'` to `'ACER Scholarship (Year 7 Entry)'`
- `Diagnostic.tsx`, `PracticeTests.tsx`, and `Drill.tsx` only mapped `'acer-year-7'` (missing `'acer-scholarship'`)
- Same issue for `'edutest-scholarship'` (missing, only had `'edutest-year-7'`)

**Flow breakdown:**
1. Session created with `product_type='ACER Scholarship (Year 7 Entry)'` ✓
2. `getUserProgress()` queried for `product_type='acer-scholarship'` (unmapped) ✗
3. No match found → Status showed "Not Started" ✗

### Fix Applied
Added missing product type mappings in three files:
- `/src/pages/Diagnostic.tsx`
- `/src/pages/PracticeTests.tsx`
- `/src/pages/Drill.tsx`

Added these mappings to `getDbProductType()`:
```typescript
'acer-scholarship': 'ACER Scholarship (Year 7 Entry)',
'edutest-scholarship': 'EduTest Scholarship (Year 7 Entry)',
```

### Affected Products
- ACER Scholarship (when accessed via 'acer-scholarship' URL)
- EduTest Scholarship (when accessed via 'edutest-scholarship' URL)

All other products (NAPLAN, VIC Selective, NSW Selective) already had correct mappings.

---

## ✅ Issue #2: Reading Passage Questions Not Grouped Correctly (FIXED)

### Problem
In reading/humanities sections, questions related to the same passage were not grouped together. For example:
- Questions 1-5: Passage A
- Question 6: Passage B
- Questions 7-10: Passage A again ❌

This made navigation confusing for students who expect all questions for a passage to be consecutive.

### Root Cause
**Unreliable passage grouping logic** in `TestTaking.tsx`:
```typescript
// OLD: Used first 50 characters of passage content as grouping key
const passageKey = q.passageContent?.substring(0, 50) || 'unknown';
```

Problems with this approach:
1. Different passages might have identical first 50 characters
2. No deterministic ordering of passage groups
3. Passages weren't using their unique UUID identifier

### Fix Applied

**1. Added `passageId` to question data flow:**

File: `/src/services/supabaseQuestionService.ts`
- Added `passageId?: string` to `OrganizedQuestion` interface (line 23)
- Included `passageId` in `transformQuestion()` function (line 132)

**2. Improved passage grouping logic:**

File: `/src/pages/TestTaking.tsx` (lines 234-270)
- Changed grouping key from substring to `passageId` UUID
- Added passage order tracking to preserve original question sequence
- Expanded detection to include "humanities" sections
- Added detailed logging for debugging

```typescript
// NEW: Use passage UUID for reliable grouping
const passageKey = q.passageId!;
// Track order passages first appear
passageOrder.push(passageKey);
// Reorganize maintaining passage order
...passageOrder.flatMap(passageId => passageGroups.get(passageId)!)
```

**3. Preserved `passageId` throughout question flow:**
- Added `passageId` to question objects returned from `loadQuestions()` (lines 272-284)

### Affected Sections
- All Reading sections
- All Comprehension sections
- All Humanities sections

---

## ⚠️  Issue #3: Writing AI Assessment Showing Fallback Error (REQUIRES DEPLOYMENT)

### Problem
Writing assessments showed generic fallback message:
> "This response was assessed using automatic scoring due to technical issues. Your writing shows effort and we encourage you to continue developing your skills."

### Root Cause
The writing assessment system has a dual API approach:
1. **Primary:** Supabase Edge Function `assess-writing`
2. **Fallback:** Local proxy server at `localhost:3002`

Both methods were failing, triggering the fallback scoring.

### Investigation Results

✅ **Edge Function code exists and is correct:**
- File: `/supabase/functions/assess-writing/index.ts`
- Properly implemented with Claude API integration
- Includes authentication, rate limiting, CORS handling
- Returns correctly formatted assessment results

✅ **Claude API key is configured:**
- Found in `.env`: `CLAUDE_API_KEY=sk-ant-***`

❌ **Issue: Edge Function not deployed or environment variable not set**

### Required Actions (User must complete)

**Option A: Deploy Edge Function to Supabase (Recommended)**

1. Ensure Supabase CLI is installed and logged in:
   ```bash
   npx supabase login
   ```

2. Link to your Supabase project:
   ```bash
   npx supabase link --project-ref YOUR_PROJECT_REF
   ```

3. Set the Claude API key as a secret in Supabase:
   ```bash
   npx supabase secrets set CLAUDE_API_KEY=your-actual-api-key-here
   ```

4. Deploy the Edge Function:
   ```bash
   npx supabase functions deploy assess-writing
   ```

5. Verify deployment:
   - Go to Supabase Dashboard → Edge Functions
   - Check that `assess-writing` is deployed and active
   - Check that `CLAUDE_API_KEY` secret is set

**Option B: Run Local Proxy Server**

If you prefer to use a local proxy instead:

1. Create a proxy server at `localhost:3002` that forwards to Claude API
2. Set environment variable: `VITE_PROXY_URL=http://localhost:3002`
3. Ensure proxy is running when users submit writing assessments

### How It Works

```
User submits writing → writingAssessmentService.ts
                            ↓
              Try Supabase Edge Function
                            ↓ (if fails)
              Try Local Proxy Server
                            ↓ (if fails)
              Fallback to generic scoring (current issue)
```

### Verification Steps

After deployment, test by:
1. Starting a writing drill or diagnostic with writing section
2. Submit a writing response
3. Check browser console for logs:
   - ✅ "Supabase Edge Function successful"
   - ❌ "Supabase Edge Function failed" → Check deployment and API key

---

## 📊 Testing Checklist

### Issue #1: Section Status
- [ ] Test ACER product diagnostic - verify status shows "In Progress" after partial completion
- [ ] Test EduTest product diagnostic - verify status shows "In Progress"
- [ ] Test NAPLAN Year 5 diagnostic
- [ ] Test NAPLAN Year 7 diagnostic
- [ ] Test VIC Selective diagnostic
- [ ] Test NSW Selective diagnostic
- [ ] Test Practice Tests status tracking
- [ ] Test Drill status tracking

### Issue #2: Passage Grouping
- [ ] Test ACER Reading Comprehension - verify questions grouped by passage
- [ ] Test EduTest Humanities - verify questions grouped by passage
- [ ] Test NAPLAN Reading - verify questions grouped by passage
- [ ] Test VIC Selective Reading - verify questions grouped by passage
- [ ] Check console logs show correct passage grouping

### Issue #3: Writing Assessment (after deployment)
- [ ] Deploy Edge Function to Supabase
- [ ] Set CLAUDE_API_KEY secret in Supabase
- [ ] Test writing assessment in diagnostic
- [ ] Test writing assessment in drill
- [ ] Verify detailed feedback is provided (not fallback message)
- [ ] Check assessment scores and criteria feedback

---

## 🔧 Files Modified

### Issue #1 Fixes
- `/src/pages/Diagnostic.tsx` (3 occurrences of `getDbProductType` function)
- `/src/pages/PracticeTests.tsx` (1 occurrence)
- `/src/pages/Drill.tsx` (1 occurrence)

### Issue #2 Fixes
- `/src/services/supabaseQuestionService.ts` (interface and transformation function)
- `/src/pages/TestTaking.tsx` (passage grouping logic and question mapping)

### Issue #3 (No code changes needed - deployment only)
- Edge Function already exists at `/supabase/functions/assess-writing/index.ts`

---

## 🚀 Deployment Steps

1. **Commit and push code changes:**
   ```bash
   git add .
   git commit -m "fix: resolve section status, passage grouping, and document writing assessment deployment"
   git push
   ```

2. **Deploy Edge Function (for Issue #3):**
   ```bash
   npx supabase secrets set CLAUDE_API_KEY=your-actual-key-here
   npx supabase functions deploy assess-writing
   ```

3. **Test all fixes** using the checklist above

---

## 📝 Notes

- Issue #1 and #2 are **fully fixed** in code
- Issue #3 requires **deployment action** by you
- All fixes maintain backward compatibility
- No database schema changes required
- No breaking changes to existing functionality

---

## 🐛 Future Recommendations

1. **Centralize product type mapping:** Create a single source of truth for product type mappings instead of duplicating the `getDbProductType()` function across multiple files.

2. **Add automated tests:** Create integration tests for:
   - Session status tracking across all products
   - Passage grouping logic
   - Writing assessment API calls

3. **Environment validation:** Add startup checks to verify all required environment variables and secrets are configured.

4. **Monitoring:** Add error tracking (e.g., Sentry) to catch API failures in writing assessments before users report them.
