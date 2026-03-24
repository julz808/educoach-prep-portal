-- ============================================================================
-- VIC SELECTIVE - EXECUTABLE SQL FIXES
-- Generated: 2026-03-24
-- Total Executable Fixes: 1 confirmed (need to identify which one)
-- Status: NEEDS MANUAL VERIFICATION BEFORE EXECUTION
-- ============================================================================

-- IMPORTANT: These are the ONLY fixes that can be done via SQL
-- 26 other errors require complete question regeneration

-- ============================================================================
-- SUMMARY OF AUDIT RESULTS
-- ============================================================================
--
-- Letter Series Questions Audited: 45
-- Errors Found: 27 (60% error rate)
-- Errors where correct answer EXISTS in options: 1 (need to identify)
-- Errors where correct answer NOT in options: 26 (CANNOT FIX WITH SQL)
--
-- ============================================================================

-- ============================================================================
-- DRILL QUESTION FIX (Tentative - need verification)
-- ============================================================================
-- ID: 4e74077a-a68c-40fe-904d-b922660e59f5
-- Series: Y V T S S T
-- Pattern: -3, -2, -1, 0, +1, +2, +3
-- Stored: D (UV) | Correct: A (VY)
-- Status: NEED TO VERIFY VY is option A

BEGIN;

UPDATE questions_v2
SET
  correct_answer = 'A',
  solution = '• Y(25)→V(22) is -3
• V(22)→T(20) is -2
• T(20)→S(19) is -1
• S(19)→S(19) is 0
• S(19)→T(20) is +1
• The pattern shows increments of -3, -2, -1, 0, +1, so continuing gives +2, then +3
• T(20)+2 = V(22)
• V(22)+3 = Y(25)
• Therefore, the answer is A because the next two letters are VY',
  updated_at = NOW()
WHERE id = '4e74077a-a68c-40fe-904d-b922660e59f5'
  AND test_type = 'VIC Selective Entry (Year 9 Entry)'
  AND sub_skill = 'Letter Series & Patterns';

-- VERIFICATION: Check that this update affected exactly 1 row
-- If it affected 0 rows, the question may have been deleted or ID is wrong

COMMIT;

-- ============================================================================
-- CANNOT FIX WITH SQL - NEED REGENERATION (26 questions)
-- ============================================================================
--
-- These questions have correct answers that DO NOT EXIST in their options.
-- They require either:
--   1. Complete regeneration with fixed generator, OR
--   2. Manual creation of new option sets that include correct answers
--
-- IDs requiring regeneration:
--
-- Practice Test 1:
--   • cbc46cb1-9a72-4c37-9e99-ed1921ae5a35 (Q16: D G K P → needs VC, has VB)
--   • 8948bac4-0d50-4bf0-aa52-979b1b47b6f9 (Q17: C F J O → needs UB, has UZ)
--   • 49d11b3c-7c8e-4304-8eea-e4bc1aed9fc6 (Q18: F H K O T → needs ZG, has ZC)
--   • fb5a406b-c570-4002-bf45-8e90b59aa5f1 (Q21: K N R W → needs CJ, has AC) **CRITICAL**
--   • 6f4dbe51-6d5b-48b4-a66d-f3a00b2b0031 (Q45: E H L Q → needs WD, has WB)
--   • fb29d71c-520c-4dfd-8137-82bade363947 (Q52: Z W S N → needs HA, has HC)
--
-- Practice Test 2:
--   • a5ad2430-b4d4-4fba-b6e9-56ff9c6ad803 (Q6: Z Y W T → needs PK, has PN)
--   • 56fb9e17-6e16-4511-a11d-e7bac5b58be2 (Q8: B C E H L → needs QW, has QV)
--   • 47874786-eaf5-4cb1-aec6-c1d89fd63810 (Q28: Y V R M → needs GZ, has HA)
--   • 23180c3b-615a-42cc-88f2-64dcbb5c4c67 (Q39: G I L P U → needs AH, has ZE)
--
-- Practice Test 3:
--   • 208c82f9-9e0b-4726-a053-f7f40e5cf495 (Q7: W T P K → needs EX, has EA)
--   • fe195e23-24e3-4a0c-8bde-08ec51803c9b (Q15: B E I N → needs TA, has TU)
--   • 66f9cf83-730b-4cf2-b8cf-71716cfa9a4b (Q26: M K H D → needs YS, has ZV)
--   • 0567caa4-da00-42aa-9609-919fd7aa32bc (Q57: J M Q V → needs BI, has AB)
--   • e31024d4-4ba6-4c84-a6a5-d95519021265 (Q59: R O K F → needs ZS, has AV)
--
-- Practice Test 4:
--   • 8b00f7ce-a0eb-441e-84a4-fe1074b6e81b (Q0: C E I Q → needs GM, has AG)
--   • 5885b2cc-7360-4252-a1e8-7f2f9a29b448 (Q15: V S O J → needs DW, has EA)
--   • fd181245-faf2-4def-84bf-217f07ee9fd4 (Q22: Q N K H → needs EB, has EC)
--   • 1a035ea1-3e1e-4681-8f1e-691a7c9b1502 (Q23: C E H L Q → needs WD, has WB)
--   • 7e1027c0-94cd-456e-bf98-136a186fcdd8 (Q50: A C F J O → needs UB, has UV)
--
-- Practice Test 5:
--   • 9a80eab9-4139-4cd0-9afe-85f40a87fbf3 (Q0: Z W S N → needs HA, has HC)
--   • 86f24fd1-f531-4a67-adcd-23764cc21d64 (Q3: C F I L → needs OR, has OP)
--   • 9c0d672b-d36d-47ab-bd89-337efa713db9 (Q13: G J N S → needs YF, has YC)
--   • c4b71347-8dd8-4bb9-997f-9b058f74888b (Q25: C F J O → needs UB, has UV)
--   • c2f99d9b-5829-4c9b-9545-3c49d50652e2 (Q29: T R O K → needs FZ, has GE)
--   • 03cdd445-743a-4591-ad8f-2624d100d6be (Q59: D G K P → needs VC, has UW)
--
-- ============================================================================
-- RECOMMENDATION
-- ============================================================================
--
-- DO NOT attempt to manually fix these 26 questions by creating new options.
-- Instead:
--   1. Fix the Letter Series question generator algorithm
--   2. Regenerate ALL 45 Letter Series questions with the fixed generator
--   3. Manually verify each regenerated question
--   4. Run automated validation to ensure correct answers exist in options
--
-- This approach:
--   • Fixes root cause (prevents future errors)
--   • Ensures consistent quality across all questions
--   • Faster than manual fixes (26 questions × 30 min each = 13 hours)
--   • More reliable (automated generation + validation)
--
-- ============================================================================
-- DETAILED ERROR DATA
-- ============================================================================
--
-- Full audit results available in:
--   /tmp/letter_series_complete_audit.json
--
-- Each error entry contains:
--   • Question ID
--   • Test mode and question order
--   • Letter series
--   • Stored answer and value
--   • Calculated correct answer
--   • Whether correct answer exists in options
--
-- ============================================================================
