-- VIC Selective Verbal & Reading Reasoning - SQL Fixes
-- Generated: 2026-03-24
-- Practice Tests 1-5 Audit

-- ============================================================================
-- ISSUE #1: Letter Series Y V T S S T (from drill, not practice test)
-- ============================================================================
-- Question ID: 4e74077a-a68c-40fe-904d-b922660e59f5
-- Pattern: -3, -2, -1, 0, +1, [+2], [+3] → T(20)+2=V(22), V(22)+3=Y(25)
-- Correct answer: A (VY), not D (UV)

UPDATE questions_v2
SET
  correct_answer = 'A',
  solution = '• Y(25)→V(22) is -3
• V(22)→T(20) is -2
• T(20)→S(19) is -1
• S(19)→S(19) is 0
• S(19)→T(20) is +1
• The pattern shows increments of -3, -2, -1, 0, +1, so continuing the pattern gives +2, then +3
• T(20)+2 = V(22)
• V(22)+3 = Y(25)
• Therefore, the answer is A because the next two letters following the pattern are V and Y, making VY',
  updated_at = NOW()
WHERE id = '4e74077a-a68c-40fe-904d-b922660e59f5';

-- ============================================================================
-- ISSUE #2: Letter Series C F J O (Practice Test 1, Q17)
-- ============================================================================
-- Question ID: 8948bac4-0d50-4bf0-aa52-979b1b47b6f9
-- Pattern: +3, +4, +5, [+6], [+7] → O(15)+6=U(21), U(21)+7=28→B(2)
-- Stored answer: B (UZ) - NEEDS VERIFICATION
-- My calculation: UB
-- NOTE: Need to verify if there's an alternative valid pattern that gives UZ

-- HOLDING THIS FIX - Need to verify the pattern more carefully
-- The solution is very confused, might indicate the question itself needs review

-- ============================================================================
-- ISSUE #3: Letter Series K N R W (Practice Test 1, Q21)
-- ============================================================================
-- Question ID: fb5a406b-c570-4002-bf45-8e90b59aa5f1
-- Pattern: +3, +4, +5, [+6], [+7] → W(23)+6=C(3), C(3)+7=J(10)
-- Correct answer should be: CJ (no matching option - this is a CRITICAL ERROR)
-- Stored answer: D (AC)
-- Solution even says "C(3)→J(10) is +7" but marks AC as correct!

-- CRITICAL: The correct answer "CJ" is NOT in the options!
-- This question needs to either:
-- 1. Change the answer options to include CJ, OR
-- 2. Change the series to produce AC as the correct answer

-- Option 1: Fix by changing answer to match what exists in options
-- If we need to keep options as-is, need to determine which is closest
-- For now, documenting this as BROKEN - cannot fix with simple SQL

-- Let's check if ANY of the options match a valid pattern:
-- If pattern is +3, +4, +5, +6, +7: Answer = CJ (not in options)
-- Need to investigate what pattern would give AC

-- ============================================================================
-- ISSUES TO INVESTIGATE FURTHER
-- ============================================================================

-- Q17 (C F J O → UZ stored, UB calculated): Need to determine correct pattern
-- Q21 (K N R W → AC stored, CJ calculated): CRITICAL - correct answer not in options

-- ============================================================================
-- EXECUTION NOTES
-- ============================================================================
-- RUN ISSUE #1 fix immediately - this is confirmed wrong
-- HOLD Issue #2 and #3 pending further investigation
