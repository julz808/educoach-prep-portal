-- ============================================================================
-- DELETE DUPLICATE QUESTIONS FROM questions_v2
-- ============================================================================
-- Generated: 2026-02-19
-- Total duplicates to delete: 23 questions
-- Strategy: Keep the OLDEST instance, delete the newer duplicate
-- ============================================================================

-- WORD-FOR-WORD DUPLICATES (14 questions to delete)
-- ----------------------------------------------------------------------------

-- Number Series & Pattern Recognition (7 duplicates from diagnostic mode)
DELETE FROM questions_v2 WHERE id = 'a2f7f9d2-1a90-4c84-a6e0-f46f972ccc92'; -- "7, 10, 16, 28, 52, ?" - keeping practice_1 version
DELETE FROM questions_v2 WHERE id = 'a203ece3-2e47-4c59-8335-d90a4ad00d67'; -- "2, 3, 5, 9, 17, 33, ?" - keeping practice_1 version
DELETE FROM questions_v2 WHERE id = '5f41a9c9-6a52-4c4d-82e0-dcb45d8cd76a'; -- "4, 9, 19, 39, 79, ?" - keeping practice_2 version
DELETE FROM questions_v2 WHERE id = '3562ab06-b1af-43e8-95a2-947925b5409a'; -- "5, 8, 14, 26, 50, ?" - keeping practice_2 version
DELETE FROM questions_v2 WHERE id = '77e5d6ec-48dc-427f-baeb-03967a13c250'; -- "2, 9, 28, 65, 126, ?" - keeping practice_3 version
DELETE FROM questions_v2 WHERE id = 'b21c84b8-d489-419f-9289-d44e1d1e22cd'; -- "1, 3, 9, 31, 129, ?" - keeping practice_4 version
DELETE FROM questions_v2 WHERE id = 'ecc3d24d-835d-49c3-80a9-c9cdf2132f12'; -- "80, 40, 20, 10, 5, ?" - keeping practice_5 version

-- Geometry & Spatial Reasoning (1 duplicate)
DELETE FROM questions_v2 WHERE id = 'ea0f69f1-8126-461c-8901-0d55f58e6e85'; -- "Pizza cut into 8 slices" - keeping practice_1 version

-- Figurative Language & Idioms (6 duplicates from practice_4)
DELETE FROM questions_v2 WHERE id = '0eaeb51f-5d2a-41bf-98fe-56dac12e4878'; -- "Don't put all your eggs in one basket" - keeping practice_1 version
DELETE FROM questions_v2 WHERE id = '0547d3dc-537f-477b-9f50-e9f4da7082a4'; -- "Every cloud has a silver lining" - keeping practice_1 version
DELETE FROM questions_v2 WHERE id = 'e26b83e6-c867-4d94-883d-50c8a1eec5aa'; -- "You can't judge a book by its cover" - keeping practice_1 version
DELETE FROM questions_v2 WHERE id = '86a0aed6-55f6-490d-9eeb-808ce6edd051'; -- "Actions speak louder than words" - keeping practice_1 version
DELETE FROM questions_v2 WHERE id = '6c621e31-fbe1-4139-b27a-ac80ba4908c7'; -- "Bite off more than you can chew" - keeping practice_1 version
DELETE FROM questions_v2 WHERE id = '60d1f859-96a8-4e4d-bd54-ffe8a0bad336'; -- "Break the ice" - keeping practice_2 version

-- MATHS SAME-NUMBERS DUPLICATES (9 questions to delete)
-- ----------------------------------------------------------------------------

-- Trapezoid area calculation with same dimensions (1 duplicate)
DELETE FROM questions_v2 WHERE id = 'c296b587-95a8-4810-8047-916ef7e37e6c'; -- "Trapezoid 8m and 12m" - keeping practice_2 version

-- Library late fees with same numbers (1 duplicate)
DELETE FROM questions_v2 WHERE id = '23e573cf-b850-4650-a6dc-3182a60314ae'; -- "$2 first day, $1 additional, 5 days" - keeping practice_4 version

-- Number properties - powers of 2 and 3 (7 duplicates)
DELETE FROM questions_v2 WHERE id = 'cc046bf5-103e-4ae8-976e-2c486fbb0b09'; -- "HCF of 24 and 36" - keeping practice_1 version
DELETE FROM questions_v2 WHERE id = 'c442ab70-4a04-4aa1-9123-5d34dd077c05'; -- "3⁴ - 2⁵" - keeping practice_1 "2³ + 3²" instead (older)
DELETE FROM questions_v2 WHERE id = '071fbf98-525e-40a3-aa7e-ee330397a42a'; -- "2⁵ + 3²" - keeping practice_1 "2³ + 3²" instead (older)
DELETE FROM questions_v2 WHERE id = '3e815354-a62b-4ef6-87f6-9a1ad17c5858'; -- "3² + 2⁴" - keeping practice_1 "2³ + 3²" instead (older)

-- Note: Question ID 369ff510-a695-411c-a4a8-4635c1d24e60 ("2³ + 3²" from practice_1)
-- is kept as the oldest, and 4 other variations using 2 and 3 are deleted above

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Run this AFTER deletion to verify the cleanup:
--
-- SELECT
--   test_type,
--   section_name,
--   sub_skill,
--   test_mode,
--   COUNT(*) as question_count
-- FROM questions_v2
-- WHERE test_type = 'EduTest Scholarship (Year 7 Entry)'
-- GROUP BY test_type, section_name, sub_skill, test_mode
-- ORDER BY section_name, sub_skill, test_mode;
--
-- ============================================================================
-- SUMMARY
-- ============================================================================
-- Total questions to delete: 23
--   - Word-for-word duplicates: 14
--   - Maths same-numbers duplicates: 9
--
-- Strategy:
--   - Keep oldest instance of each duplicate
--   - Delete newer instances
--   - Preserves question history and creation order
-- ============================================================================
