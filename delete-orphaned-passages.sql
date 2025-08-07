-- ============================================================================
-- DELETE ORPHANED PASSAGES
-- ============================================================================
-- This script identifies and deletes passages that have no associated questions
-- in the questions table. This helps clean up unused passages and reduce
-- database bloat after question generation cleanup operations.
--
-- IMPORTANT: This operation is irreversible. Make sure to backup your database
-- before running this script if you need to preserve the data.
-- ============================================================================

-- First, let's see how many orphaned passages we have
SELECT 
    COUNT(*) as total_orphaned_passages,
    'passages with no questions' as description
FROM passages p
WHERE NOT EXISTS (
    SELECT 1 
    FROM questions q 
    WHERE q.passage_id = p.id
);

-- Show some examples of orphaned passages (first 10)
SELECT 
    p.id,
    p.title,
    p.test_type,
    p.created_at,
    LENGTH(p.content) as content_length
FROM passages p
WHERE NOT EXISTS (
    SELECT 1 
    FROM questions q 
    WHERE q.passage_id = p.passage_id
)
ORDER BY p.created_at DESC
LIMIT 10;

-- Now delete all orphaned passages
-- This deletes passages that have no questions referencing them
DELETE FROM passages 
WHERE id NOT IN (
    SELECT DISTINCT passage_id 
    FROM questions 
    WHERE passage_id IS NOT NULL
);

-- Show the results after deletion
SELECT 
    COUNT(*) as remaining_passages,
    'passages remaining after cleanup' as description
FROM passages;

-- Verify that all remaining passages have at least one question
SELECT 
    COUNT(*) as passages_with_questions,
    'passages that have associated questions' as verification
FROM passages p
WHERE EXISTS (
    SELECT 1 
    FROM questions q 
    WHERE q.passage_id = p.id
);