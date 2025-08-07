-- ============================================================================
-- RESET TOPIC CYCLING STATE
-- ============================================================================
-- This script resets the topic cycling state to start fresh with the new topics.
-- This is necessary after refreshing the topic arrays to ensure the system
-- starts using the new topics from the beginning instead of continuing
-- from where it left off with the old topics.
-- ============================================================================

-- First, let's see the current state
SELECT 
    test_product,
    test_mode,
    narrative_index,
    informational_index,
    persuasive_index,
    procedural_index,
    descriptive_index,
    updated_at
FROM topic_cycling_state
ORDER BY updated_at DESC;

-- Delete all existing topic cycling state to start fresh
DELETE FROM topic_cycling_state;

-- Verify the state has been cleared
SELECT COUNT(*) as remaining_state_records FROM topic_cycling_state;

-- The system will now start fresh with index 0 for all text types
-- and begin using the new topics from the beginning of each array
SELECT 'Topic cycling state has been reset. The system will now start using the new topics from the beginning.' as status;