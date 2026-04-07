-- =====================================================
-- VIC SELECTIVE ENTRY - SESSION 1 FIXES
-- =====================================================
-- Date: 2026-04-07
-- Section: Mathematics Reasoning
-- Mode: practice_1
-- Questions Reviewed: 20
-- Errors Found: 1
-- Errors Fixed: 1
-- =====================================================

BEGIN;

-- =====================================================
-- FIXES
-- =====================================================

-- Error #1: Wrong Solution (E4)
-- Question ID: edde0299-1763-4d87-b9bd-1055fa9c05d9
-- Section: Mathematics Reasoning, practice_1, Order 19
-- Issue: Solution text says "answer is B (10 members)" but correct_answer
--        field correctly shows E. Actual answer is 6 members.
UPDATE questions_v2
SET solution = '• Let n = current number of members and C = total cost of parts
• Current cost per person: C/n
• If 3 join: C/(n+3) = C/n - 8
  → Rearranging: Cn = C(n+3) - 8n(n+3)
  → 0 = 3C - 8n² - 24n
  → C = (8n² + 24n)/3
• If 2 leave: C/(n-2) = C/n + 12
  → Rearranging: Cn = C(n-2) + 12n(n-2)
  → 2C = 12n² - 24n
  → C = 6n² - 12n
• Setting equal: (8n² + 24n)/3 = 6n² - 12n
  → 8n² + 24n = 18n² - 36n
  → 10n² - 60n = 0
  → 10n(n - 6) = 0
  → n = 6 (since n > 0)
• Verification: If n = 6, then C = 144
  → Current: 144/6 = $24
  → If 3 join (9 total): 144/9 = $16, which is $8 less ✓
  → If 2 leave (4 total): 144/4 = $36, which is $12 more ✓
• Therefore, the answer is E because the actual number of members is 6, which is not among options A-D'
WHERE id = 'edde0299-1763-4d87-b9bd-1055fa9c05d9';


-- =====================================================
-- VERIFICATION
-- =====================================================

-- SELECT COUNT(*) as session_1_fixes
-- FROM questions_v2
-- WHERE updated_at > '2026-04-07'::timestamp;

-- =====================================================
-- COMMIT OR ROLLBACK
-- =====================================================

-- COMMIT;
-- ROLLBACK;
