-- Sample Data Generation for Performance Tracking System
-- This script creates realistic test data for validating the performance tracking functionality

BEGIN;

-- Insert sample users (assuming they already exist from auth, but we'll reference them)
-- We'll use placeholder user IDs that should be replaced with actual user IDs

-- Sample user progress initialization for VIC Selective
INSERT INTO user_progress (user_id, product_type, progress_data, created_at, updated_at) VALUES
('00000000-0000-0000-0000-000000000001', 'vic_selective', '{"diagnostic_completed": true, "practice_tests_completed": 3, "drills_completed": 45}', NOW() - INTERVAL '30 days', NOW()),
('00000000-0000-0000-0000-000000000002', 'vic_selective', '{"diagnostic_completed": true, "practice_tests_completed": 1, "drills_completed": 12}', NOW() - INTERVAL '15 days', NOW()),
('00000000-0000-0000-0000-000000000003', 'vic_selective', '{"diagnostic_completed": false, "practice_tests_completed": 0, "drills_completed": 0}', NOW() - INTERVAL '2 days', NOW())
ON CONFLICT (user_id, product_type) DO UPDATE SET
  progress_data = EXCLUDED.progress_data,
  updated_at = EXCLUDED.updated_at;

-- Sample sub-skill performance data
INSERT INTO user_sub_skill_performance (user_id, product_type, sub_skill, questions_attempted, questions_correct, accuracy_rate, last_attempted, created_at, updated_at) VALUES
-- User 1 - High performer with comprehensive data
('00000000-0000-0000-0000-000000000001', 'vic_selective', 'Reading comprehension', 45, 38, 0.844, NOW() - INTERVAL '1 day', NOW() - INTERVAL '30 days', NOW() - INTERVAL '1 day'),
('00000000-0000-0000-0000-000000000001', 'vic_selective', 'Inferential reasoning', 35, 28, 0.800, NOW() - INTERVAL '2 days', NOW() - INTERVAL '28 days', NOW() - INTERVAL '2 days'),
('00000000-0000-0000-0000-000000000001', 'vic_selective', 'Text analysis', 40, 32, 0.800, NOW() - INTERVAL '3 days', NOW() - INTERVAL '25 days', NOW() - INTERVAL '3 days'),
('00000000-0000-0000-0000-000000000001', 'vic_selective', 'Critical interpretation', 30, 26, 0.867, NOW() - INTERVAL '1 day', NOW() - INTERVAL '20 days', NOW() - INTERVAL '1 day'),
('00000000-0000-0000-0000-000000000001', 'vic_selective', 'Mathematical problem solving', 42, 30, 0.714, NOW() - INTERVAL '1 day', NOW() - INTERVAL '30 days', NOW() - INTERVAL '1 day'),
('00000000-0000-0000-0000-000000000001', 'vic_selective', 'Multi-step reasoning', 38, 24, 0.632, NOW() - INTERVAL '2 days', NOW() - INTERVAL '27 days', NOW() - INTERVAL '2 days'),
('00000000-0000-0000-0000-000000000001', 'vic_selective', 'Mathematical modeling', 35, 26, 0.743, NOW() - INTERVAL '4 days', NOW() - INTERVAL '24 days', NOW() - INTERVAL '4 days'),
('00000000-0000-0000-0000-000000000001', 'vic_selective', 'Pattern detection with words', 40, 32, 0.800, NOW() - INTERVAL '2 days', NOW() - INTERVAL '26 days', NOW() - INTERVAL '2 days'),
('00000000-0000-0000-0000-000000000001', 'vic_selective', 'Vocabulary reasoning', 36, 30, 0.833, NOW() - INTERVAL '3 days', NOW() - INTERVAL '23 days', NOW() - INTERVAL '3 days'),
('00000000-0000-0000-0000-000000000001', 'vic_selective', 'Number pattern recognition', 44, 28, 0.636, NOW() - INTERVAL '1 day', NOW() - INTERVAL '29 days', NOW() - INTERVAL '1 day'),
('00000000-0000-0000-0000-000000000001', 'vic_selective', 'Mathematical sequence analysis', 40, 22, 0.550, NOW() - INTERVAL '5 days', NOW() - INTERVAL '22 days', NOW() - INTERVAL '5 days'),
('00000000-0000-0000-0000-000000000001', 'vic_selective', 'Creative writing', 8, 6, 0.750, NOW() - INTERVAL '7 days', NOW() - INTERVAL '21 days', NOW() - INTERVAL '7 days'),

-- User 2 - Moderate performer with some gaps
('00000000-0000-0000-0000-000000000002', 'vic_selective', 'Reading comprehension', 25, 18, 0.720, NOW() - INTERVAL '3 days', NOW() - INTERVAL '15 days', NOW() - INTERVAL '3 days'),
('00000000-0000-0000-0000-000000000002', 'vic_selective', 'Mathematical problem solving', 20, 12, 0.600, NOW() - INTERVAL '5 days', NOW() - INTERVAL '12 days', NOW() - INTERVAL '5 days'),
('00000000-0000-0000-0000-000000000002', 'vic_selective', 'Pattern detection with words', 18, 11, 0.611, NOW() - INTERVAL '4 days', NOW() - INTERVAL '10 days', NOW() - INTERVAL '4 days'),
('00000000-0000-0000-0000-000000000002', 'vic_selective', 'Number pattern recognition', 22, 10, 0.455, NOW() - INTERVAL '6 days', NOW() - INTERVAL '8 days', NOW() - INTERVAL '6 days'),
('00000000-0000-0000-0000-000000000002', 'vic_selective', 'Vocabulary reasoning', 15, 12, 0.800, NOW() - INTERVAL '2 days', NOW() - INTERVAL '7 days', NOW() - INTERVAL '2 days'),

-- User 3 - New user with minimal data
('00000000-0000-0000-0000-000000000003', 'vic_selective', 'Reading comprehension', 5, 3, 0.600, NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),
('00000000-0000-0000-0000-000000000003', 'vic_selective', 'Mathematical problem solving', 3, 1, 0.333, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day')

ON CONFLICT (user_id, product_type, sub_skill) DO UPDATE SET
  questions_attempted = user_sub_skill_performance.questions_attempted + EXCLUDED.questions_attempted,
  questions_correct = user_sub_skill_performance.questions_correct + EXCLUDED.questions_correct,
  accuracy_rate = (user_sub_skill_performance.questions_correct + EXCLUDED.questions_correct)::DECIMAL / 
                  (user_sub_skill_performance.questions_attempted + EXCLUDED.questions_attempted),
  last_attempted = EXCLUDED.last_attempted,
  updated_at = EXCLUDED.updated_at;

-- Sample question responses for detailed tracking
INSERT INTO user_question_responses (user_id, product_type, session_id, question_id, sub_skill, user_answer, correct_answer, is_correct, time_taken_seconds, created_at) VALUES
-- User 1 diagnostic session
('00000000-0000-0000-0000-000000000001', 'vic_selective', 'diag_session_1', 'q_reading_1', 'Reading comprehension', 'B', 'B', true, 45, NOW() - INTERVAL '30 days'),
('00000000-0000-0000-0000-000000000001', 'vic_selective', 'diag_session_1', 'q_reading_2', 'Reading comprehension', 'A', 'C', false, 60, NOW() - INTERVAL '30 days'),
('00000000-0000-0000-0000-000000000001', 'vic_selective', 'diag_session_1', 'q_math_1', 'Mathematical problem solving', 'D', 'D', true, 120, NOW() - INTERVAL '30 days'),
('00000000-0000-0000-0000-000000000001', 'vic_selective', 'diag_session_1', 'q_math_2', 'Mathematical problem solving', 'A', 'B', false, 150, NOW() - INTERVAL '30 days'),
('00000000-0000-0000-0000-000000000001', 'vic_selective', 'diag_session_1', 'q_verbal_1', 'Pattern detection with words', 'C', 'C', true, 90, NOW() - INTERVAL '30 days'),

-- User 1 practice test sessions
('00000000-0000-0000-0000-000000000001', 'vic_selective', 'practice_session_1', 'q_reading_3', 'Reading comprehension', 'B', 'B', true, 40, NOW() - INTERVAL '20 days'),
('00000000-0000-0000-0000-000000000001', 'vic_selective', 'practice_session_1', 'q_reading_4', 'Text analysis', 'C', 'C', true, 55, NOW() - INTERVAL '20 days'),
('00000000-0000-0000-0000-000000000001', 'vic_selective', 'practice_session_1', 'q_math_3', 'Multi-step reasoning', 'A', 'D', false, 180, NOW() - INTERVAL '20 days'),

-- User 1 recent drill sessions
('00000000-0000-0000-0000-000000000001', 'vic_selective', 'drill_session_1', 'q_drill_1', 'Mathematical sequence analysis', 'B', 'C', false, 85, NOW() - INTERVAL '5 days'),
('00000000-0000-0000-0000-000000000001', 'vic_selective', 'drill_session_1', 'q_drill_2', 'Mathematical sequence analysis', 'D', 'D', true, 70, NOW() - INTERVAL '5 days'),
('00000000-0000-0000-0000-000000000001', 'vic_selective', 'drill_session_1', 'q_drill_3', 'Mathematical sequence analysis', 'A', 'A', true, 65, NOW() - INTERVAL '5 days'),

-- User 2 diagnostic session
('00000000-0000-0000-0000-000000000002', 'vic_selective', 'diag_session_2', 'q_reading_1', 'Reading comprehension', 'C', 'B', false, 75, NOW() - INTERVAL '15 days'),
('00000000-0000-0000-0000-000000000002', 'vic_selective', 'diag_session_2', 'q_math_1', 'Mathematical problem solving', 'B', 'B', true, 140, NOW() - INTERVAL '15 days'),
('00000000-0000-0000-0000-000000000002', 'vic_selective', 'diag_session_2', 'q_verbal_1', 'Pattern detection with words', 'A', 'C', false, 95, NOW() - INTERVAL '15 days'),

-- User 3 initial attempts
('00000000-0000-0000-0000-000000000003', 'vic_selective', 'initial_session_1', 'q_reading_1', 'Reading comprehension', 'B', 'B', true, 80, NOW() - INTERVAL '2 days'),
('00000000-0000-0000-0000-000000000003', 'vic_selective', 'initial_session_1', 'q_reading_2', 'Reading comprehension', 'A', 'C', false, 90, NOW() - INTERVAL '2 days'),
('00000000-0000-0000-0000-000000000003', 'vic_selective', 'initial_session_1', 'q_math_1', 'Mathematical problem solving', 'D', 'A', false, 200, NOW() - INTERVAL '1 day')

ON CONFLICT (user_id, product_type, session_id, question_id) DO NOTHING;

-- Create test data verification queries
-- These will be used to validate the data was inserted correctly

COMMIT;

-- Verification queries (run these separately to check data)
/*
-- Check user progress data
SELECT 
    user_id,
    product_type,
    progress_data,
    created_at,
    updated_at
FROM user_progress 
WHERE product_type = 'vic_selective'
ORDER BY created_at;

-- Check sub-skill performance summary
SELECT 
    user_id,
    sub_skill,
    questions_attempted,
    questions_correct,
    ROUND(accuracy_rate * 100, 1) as accuracy_percentage,
    last_attempted
FROM user_sub_skill_performance 
WHERE product_type = 'vic_selective'
ORDER BY user_id, accuracy_rate DESC;

-- Check question response details
SELECT 
    user_id,
    session_id,
    sub_skill,
    COUNT(*) as total_questions,
    SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_answers,
    ROUND(AVG(CASE WHEN is_correct THEN 1.0 ELSE 0.0 END) * 100, 1) as session_accuracy,
    ROUND(AVG(time_taken_seconds), 1) as avg_time_seconds
FROM user_question_responses 
WHERE product_type = 'vic_selective'
GROUP BY user_id, session_id, sub_skill
ORDER BY user_id, session_id;

-- Test the dashboard stats function
SELECT * FROM get_dashboard_stats('00000000-0000-0000-0000-000000000001', 'vic_selective');
SELECT * FROM get_dashboard_stats('00000000-0000-0000-0000-000000000002', 'vic_selective');
SELECT * FROM get_dashboard_stats('00000000-0000-0000-0000-000000000003', 'vic_selective');

-- Test the sub-skill performance view
SELECT * FROM get_sub_skill_performance('00000000-0000-0000-0000-000000000001', 'vic_selective');
*/ 