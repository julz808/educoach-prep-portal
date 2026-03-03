# Profile Progress Reset Fix - 2026-02-28

## Issues Fixed

### 1. Clear Progress UI Showing Paywalled Tests
**Problem:** The reset progress section displayed all 6 test types regardless of what the user purchased, making it confusing and too large.

**Solution:**
- Now fetches user's purchased products from `user_products` table
- Only displays tests the user has access to
- Shows friendly empty state if no products purchased

### 2. Reset UI Too Messy/Large
**Problem:** Each test had 4 separate buttons (Practice, Drills, Diagnostic, All), creating a cluttered interface with 24 buttons total.

**Solution:**
- Replaced with clean dropdown interface:
  - Dropdown 1: Select which test (only purchased)
  - Dropdown 2: Select what to reset (Practice 1-5, Drills, Diagnostic, or All)
  - Single "Reset Selected Progress" button
- Much more compact and user-friendly

### 3. Reset Functionality Not Working Properly
**Problem:** Resetting progress for one test would affect ALL tests. For example, clearing drills for "Year 7 NAPLAN" would also clear drill progress for "ACER Scholarship", etc.

**Root Cause:** SQL functions were not filtering by `product_type`, so they deleted ALL user data regardless of which product was selected.

**Solution:**
- Updated `clear_test_mode_progress()` to filter by product_type
- Updated `clear_product_progress()` to only affect specified product
- Now properly scoped per product

## Files Modified

### Frontend
- `src/pages/Profile.tsx`
  - Added `purchasedProducts` state
  - Fetch purchased products from `user_products` table
  - New dropdown-based UI for reset selection
  - Updated reset handlers to use product's `dbProductType`

### Database
- `supabase/migrations/20260228000001_fix_clear_progress_functions.sql`
  - Fixed `clear_test_mode_progress()` - now filters by `product_type`
  - Fixed `clear_product_progress()` - now scoped to single product
  - Both functions now properly delete only data for specified product

## Database Schema Assumptions

The fix assumes these tables have `product_type` column:
- ✅ `user_test_sessions.product_type`
- ✅ `user_sub_skill_performance.product_type`
- ✅ `user_progress.product_type`
- ✅ `user_products.product_type` (used for access check)

## Product Type Mapping

Frontend product IDs map to database product types:
```typescript
'year-5-naplan'         → 'Year 5 NAPLAN'
'year-7-naplan'         → 'Year 7 NAPLAN'
'acer-scholarship'      → 'ACER Scholarship (Year 7 Entry)'
'edutest-scholarship'   → 'EduTest Scholarship (Year 7 Entry)'
'nsw-selective'         → 'NSW Selective Entry (Year 7 Entry)'
'vic-selective'         → 'VIC Selective Entry (Year 9 Entry)'
```

## Testing Checklist

### UI Testing
- [ ] Profile page loads without errors
- [ ] "Reset Progress" section only shows purchased tests
- [ ] Dropdowns display correct test names
- [ ] "What to Reset" dropdown is disabled until test selected
- [ ] Empty state shows when user has no purchased products
- [ ] Reset button is disabled until both dropdowns selected
- [ ] Confirmation dialog shows correct test name and reset type

### Functional Testing
- [ ] Reset "Practice Tests (1-5)" - clears only practice sessions
- [ ] Reset "Skill Drills" - clears drill sessions and sub_skill_performance
- [ ] Reset "Diagnostic Test" - clears diagnostic session and sub_skill_performance
- [ ] Reset "All Progress for This Test" - clears everything for that product only
- [ ] Verify other products are NOT affected when resetting one product

### Database Verification
After reset, check that:
```sql
-- Example: After clearing Year 7 NAPLAN drills
SELECT COUNT(*) FROM user_test_sessions
WHERE user_id = 'xxx'
AND product_type = 'Year 7 NAPLAN'
AND test_mode = 'drill';
-- Should be 0

SELECT COUNT(*) FROM user_test_sessions
WHERE user_id = 'xxx'
AND product_type = 'ACER Scholarship (Year 7 Entry)'
AND test_mode = 'drill';
-- Should be unchanged
```

## Known Behaviors

1. **Page Reload After Reset:** The page reloads after successful reset to ensure all progress displays are updated
2. **Product Type Matching:** Reset operations use exact database product type strings from `user_products` table
3. **No "Clear All" Option:** The "Danger Zone" clear all progress button has been removed - users must reset each product individually for safety

## Migration Applied

The SQL migration has been applied on: 2026-02-28

Function signatures:
- `clear_test_mode_progress(p_user_id UUID, p_product_type TEXT, p_test_mode TEXT)`
- `clear_product_progress(p_user_id UUID, p_product_type TEXT)`
- `clear_all_user_progress(p_user_id UUID)` (unchanged)
