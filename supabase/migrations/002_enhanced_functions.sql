-- Enhanced Database Functions for EduCourse Platform
-- Includes RPC functions, triggers, and advanced query capabilities

-- =====================================
-- PROGRESS TRACKING FUNCTIONS
-- =====================================

-- Function to update user progress after answering questions
CREATE OR REPLACE FUNCTION update_user_progress(
    p_user_id UUID,
    p_product_type VARCHAR,
    p_sub_skill VARCHAR,
    p_is_correct BOOLEAN
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO user_sub_skill_progress (
        user_id,
        product_type,
        sub_skill,
        questions_attempted,
        questions_correct,
        last_practiced,
        mastery_level
    )
    VALUES (
        p_user_id,
        p_product_type,
        p_sub_skill,
        1,
        CASE WHEN p_is_correct THEN 1 ELSE 0 END,
        NOW(),
        CASE WHEN p_is_correct THEN 0.1 ELSE 0.0 END
    )
    ON CONFLICT (user_id, product_type, sub_skill) 
    DO UPDATE SET
        questions_attempted = user_sub_skill_progress.questions_attempted + 1,
        questions_correct = user_sub_skill_progress.questions_correct + CASE WHEN p_is_correct THEN 1 ELSE 0 END,
        last_practiced = NOW(),
        mastery_level = LEAST(1.0, 
            GREATEST(0.0, 
                user_sub_skill_progress.mastery_level + 
                CASE 
                    WHEN p_is_correct THEN 0.1 
                    ELSE -0.05 
                END
            )
        ),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get comprehensive user mastery overview
CREATE OR REPLACE FUNCTION get_user_mastery_overview(
    p_user_id UUID,
    p_product_type VARCHAR
)
RETURNS TABLE(
    sub_skill VARCHAR,
    mastery_level DECIMAL,
    questions_attempted INTEGER,
    questions_correct INTEGER,
    last_practiced TIMESTAMP,
    accuracy_percentage DECIMAL,
    improvement_trend VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        usp.sub_skill,
        COALESCE(usp.mastery_level, 0.0) as mastery_level,
        COALESCE(usp.questions_attempted, 0) as questions_attempted,
        COALESCE(usp.questions_correct, 0) as questions_correct,
        usp.last_practiced,
        CASE 
            WHEN usp.questions_attempted > 0 
            THEN ROUND((usp.questions_correct::DECIMAL / usp.questions_attempted::DECIMAL) * 100, 2)
            ELSE 0.0 
        END as accuracy_percentage,
        CASE 
            WHEN usp.mastery_level >= 0.8 THEN 'excellent'
            WHEN usp.mastery_level >= 0.6 THEN 'good'
            WHEN usp.mastery_level >= 0.4 THEN 'improving'
            WHEN usp.mastery_level >= 0.2 THEN 'developing'
            ELSE 'needs_focus'
        END as improvement_trend
    FROM user_sub_skill_progress usp
    WHERE usp.user_id = p_user_id 
      AND usp.product_type = p_product_type
    ORDER BY usp.mastery_level ASC, usp.last_practiced DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================
-- DIAGNOSTIC TEST GENERATION
-- =====================================

-- Function to generate a diagnostic test (1 question per sub-skill)
CREATE OR REPLACE FUNCTION generate_diagnostic_test(
    p_user_id UUID,
    p_product_type VARCHAR
)
RETURNS TABLE(
    question_id UUID,
    sub_skill VARCHAR,
    difficulty INTEGER,
    mastery_level DECIMAL,
    question_text TEXT,
    answer_options JSONB,
    has_visual BOOLEAN
) AS $$
DECLARE
    sub_skill_record RECORD;
    selected_question RECORD;
BEGIN
    -- Get all sub-skills for this product type from existing questions
    FOR sub_skill_record IN 
        SELECT DISTINCT q.sub_skill
        FROM questions q
        WHERE q.test_type = p_product_type
        ORDER BY q.sub_skill
    LOOP
        -- Get user's current mastery level for this sub-skill
        SELECT COALESCE(usp.mastery_level, 0.0) INTO selected_question.user_mastery
        FROM user_sub_skill_progress usp
        WHERE usp.user_id = p_user_id 
          AND usp.product_type = p_product_type
          AND usp.sub_skill = sub_skill_record.sub_skill;
        
        -- Select appropriate difficulty based on mastery level
        WITH difficulty_target AS (
            SELECT CASE 
                WHEN COALESCE(selected_question.user_mastery, 0.0) >= 0.8 THEN 4
                WHEN COALESCE(selected_question.user_mastery, 0.0) >= 0.6 THEN 3
                WHEN COALESCE(selected_question.user_mastery, 0.0) >= 0.4 THEN 2
                ELSE 1
            END as target_difficulty
        ),
        available_questions AS (
            SELECT q.*
            FROM questions q, difficulty_target dt
            WHERE q.test_type = p_product_type
              AND q.sub_skill = sub_skill_record.sub_skill
              AND q.difficulty = dt.target_difficulty
              AND q.reviewed = true
            ORDER BY RANDOM()
            LIMIT 1
        )
        SELECT aq.id, aq.sub_skill, aq.difficulty, aq.question_text, 
               aq.answer_options, aq.has_visual,
               COALESCE(selected_question.user_mastery, 0.0) as mastery_level
        INTO selected_question
        FROM available_questions aq;
        
        -- If no question found at target difficulty, get any question for this sub-skill
        IF selected_question.id IS NULL THEN
            SELECT q.id, q.sub_skill, q.difficulty, q.question_text, 
                   q.answer_options, q.has_visual,
                   COALESCE(selected_question.user_mastery, 0.0) as mastery_level
            INTO selected_question
            FROM questions q
            WHERE q.test_type = p_product_type
              AND q.sub_skill = sub_skill_record.sub_skill
              AND q.reviewed = true
            ORDER BY RANDOM()
            LIMIT 1;
        END IF;
        
        -- Return the selected question
        IF selected_question.id IS NOT NULL THEN
            question_id := selected_question.id;
            sub_skill := selected_question.sub_skill;
            difficulty := selected_question.difficulty;
            mastery_level := selected_question.mastery_level;
            question_text := selected_question.question_text;
            answer_options := selected_question.answer_options;
            has_visual := selected_question.has_visual;
            
            RETURN NEXT;
        END IF;
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================
-- ADAPTIVE PRACTICE RECOMMENDATIONS
-- =====================================

-- Function to get recommended practice questions based on mastery levels
CREATE OR REPLACE FUNCTION get_recommended_practice(
    p_user_id UUID,
    p_product_type VARCHAR,
    p_target_count INTEGER DEFAULT 10
)
RETURNS TABLE(
    question_id UUID,
    sub_skill VARCHAR,
    difficulty INTEGER,
    mastery_level DECIMAL,
    priority_score DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH user_mastery AS (
        SELECT 
            usp.sub_skill,
            COALESCE(usp.mastery_level, 0.0) as mastery_level,
            COALESCE(usp.questions_attempted, 0) as questions_attempted
        FROM user_sub_skill_progress usp
        WHERE usp.user_id = p_user_id 
          AND usp.product_type = p_product_type
    ),
    priority_questions AS (
        SELECT 
            q.id as question_id,
            q.sub_skill,
            q.difficulty,
            COALESCE(um.mastery_level, 0.0) as mastery_level,
            -- Priority score: lower mastery = higher priority
            -- Also consider if user has never attempted this sub-skill
            (1.0 - COALESCE(um.mastery_level, 0.0)) + 
            CASE WHEN um.questions_attempted = 0 THEN 0.5 ELSE 0.0 END as priority_score
        FROM questions q
        LEFT JOIN user_mastery um ON um.sub_skill = q.sub_skill
        WHERE q.test_type = p_product_type
          AND q.reviewed = true
          -- Focus on areas where mastery is below 0.8
          AND COALESCE(um.mastery_level, 0.0) < 0.8
    )
    SELECT 
        pq.question_id,
        pq.sub_skill,
        pq.difficulty,
        pq.mastery_level,
        pq.priority_score
    FROM priority_questions pq
    ORDER BY pq.priority_score DESC, RANDOM()
    LIMIT p_target_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================
-- QUESTION BANK MANAGEMENT
-- =====================================

-- Function to get questions for a specific test section
CREATE OR REPLACE FUNCTION get_test_section_questions(
    p_test_type VARCHAR,
    p_section_name VARCHAR,
    p_target_count INTEGER DEFAULT 10,
    p_difficulty_filter INTEGER DEFAULT NULL
)
RETURNS TABLE(
    question_id UUID,
    question_text TEXT,
    sub_skill VARCHAR,
    difficulty INTEGER,
    answer_options JSONB,
    correct_answer VARCHAR,
    has_visual BOOLEAN,
    visual_data JSONB,
    passage_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        q.id,
        q.question_text,
        q.sub_skill,
        q.difficulty,
        q.answer_options,
        q.correct_answer,
        q.has_visual,
        q.visual_data,
        q.passage_id
    FROM questions q
    WHERE q.test_type = p_test_type
      AND q.section_name = p_section_name
      AND q.reviewed = true
      AND (p_difficulty_filter IS NULL OR q.difficulty = p_difficulty_filter)
    ORDER BY q.sub_skill, q.difficulty, RANDOM()
    LIMIT p_target_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check test structure compliance
CREATE OR REPLACE FUNCTION check_test_structure_compliance(
    p_test_type VARCHAR
)
RETURNS TABLE(
    section_name VARCHAR,
    target_questions INTEGER,
    available_questions INTEGER,
    compliance_percentage DECIMAL,
    missing_sub_skills TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    WITH section_targets AS (
        SELECT 
            tsc.section_name,
            tsc.target_questions
        FROM test_structure_compliance tsc
        WHERE tsc.test_type = p_test_type
    ),
    available_counts AS (
        SELECT 
            q.section_name,
            COUNT(*) as available_questions,
            array_agg(DISTINCT q.sub_skill) as available_sub_skills
        FROM questions q
        WHERE q.test_type = p_test_type
          AND q.reviewed = true
        GROUP BY q.section_name
    )
    SELECT 
        st.section_name,
        st.target_questions,
        COALESCE(ac.available_questions, 0)::INTEGER as available_questions,
        CASE 
            WHEN st.target_questions > 0 
            THEN ROUND((COALESCE(ac.available_questions, 0)::DECIMAL / st.target_questions::DECIMAL) * 100, 2)
            ELSE 0.0 
        END as compliance_percentage,
        COALESCE(
            ARRAY(
                SELECT DISTINCT q.sub_skill 
                FROM questions q 
                WHERE q.test_type = p_test_type 
                  AND q.section_name = st.section_name
                  AND q.reviewed = false
            ), 
            ARRAY[]::TEXT[]
        ) as missing_sub_skills
    FROM section_targets st
    LEFT JOIN available_counts ac ON ac.section_name = st.section_name
    ORDER BY st.section_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================
-- AUTOMATIC TRIGGERS
-- =====================================

-- Trigger function to automatically update progress when question_responses is inserted
CREATE OR REPLACE FUNCTION trigger_update_progress()
RETURNS TRIGGER AS $$
DECLARE
    attempt_info RECORD;
    question_info RECORD;
BEGIN
    -- Get test attempt info
    SELECT ta.user_id, ta.product_type 
    INTO attempt_info
    FROM test_attempts ta 
    WHERE ta.id = NEW.attempt_id;
    
    -- Get question info
    SELECT q.sub_skill 
    INTO question_info
    FROM questions q 
    WHERE q.id = NEW.question_id;
    
    -- Update user progress
    IF attempt_info.user_id IS NOT NULL AND question_info.sub_skill IS NOT NULL THEN
        PERFORM update_user_progress(
            attempt_info.user_id,
            attempt_info.product_type,
            question_info.sub_skill,
            NEW.is_correct
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS auto_update_progress ON question_responses;
CREATE TRIGGER auto_update_progress
    AFTER INSERT ON question_responses
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_progress();

-- Trigger function to update test_attempts summary when completed
CREATE OR REPLACE FUNCTION trigger_update_test_summary()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update if completed_at is being set (test is being completed)
    IF OLD.completed_at IS NULL AND NEW.completed_at IS NOT NULL THEN
        UPDATE test_attempts 
        SET 
            total_questions = (
                SELECT COUNT(*) 
                FROM question_responses qr 
                WHERE qr.attempt_id = NEW.id
            ),
            correct_answers = (
                SELECT COUNT(*) 
                FROM question_responses qr 
                WHERE qr.attempt_id = NEW.id 
                  AND qr.is_correct = true
            )
        WHERE id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS auto_update_test_summary ON test_attempts;
CREATE TRIGGER auto_update_test_summary
    AFTER UPDATE ON test_attempts
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_test_summary();

-- =====================================
-- ANALYTICS FUNCTIONS
-- =====================================

-- Function to get user performance analytics
CREATE OR REPLACE FUNCTION get_user_analytics(
    p_user_id UUID,
    p_product_type VARCHAR,
    p_days_back INTEGER DEFAULT 30
)
RETURNS TABLE(
    total_questions_attempted INTEGER,
    total_correct INTEGER,
    overall_accuracy DECIMAL,
    total_time_spent INTEGER,
    avg_time_per_question DECIMAL,
    tests_completed INTEGER,
    strongest_sub_skill VARCHAR,
    weakest_sub_skill VARCHAR,
    daily_activity JSONB
) AS $$
DECLARE
    analytics_result RECORD;
BEGIN
    -- Calculate comprehensive analytics
    SELECT 
        COUNT(qr.id)::INTEGER as total_questions,
        SUM(CASE WHEN qr.is_correct THEN 1 ELSE 0 END)::INTEGER as total_correct,
        CASE 
            WHEN COUNT(qr.id) > 0 
            THEN ROUND((SUM(CASE WHEN qr.is_correct THEN 1 ELSE 0 END)::DECIMAL / COUNT(qr.id)::DECIMAL) * 100, 2)
            ELSE 0.0 
        END as overall_accuracy,
        COALESCE(SUM(qr.time_spent_seconds), 0)::INTEGER as total_time,
        CASE 
            WHEN COUNT(qr.id) > 0 
            THEN ROUND(SUM(qr.time_spent_seconds)::DECIMAL / COUNT(qr.id)::DECIMAL, 2)
            ELSE 0.0 
        END as avg_time,
        COUNT(DISTINCT ta.id)::INTEGER as tests_completed
    INTO analytics_result
    FROM test_attempts ta
    JOIN question_responses qr ON qr.attempt_id = ta.id
    WHERE ta.user_id = p_user_id 
      AND ta.product_type = p_product_type
      AND ta.created_at >= NOW() - INTERVAL '%s days' % p_days_back;
    
    -- Get strongest and weakest sub-skills
    WITH sub_skill_performance AS (
        SELECT 
            usp.sub_skill,
            usp.mastery_level,
            ROW_NUMBER() OVER (ORDER BY usp.mastery_level DESC) as strength_rank,
            ROW_NUMBER() OVER (ORDER BY usp.mastery_level ASC) as weakness_rank
        FROM user_sub_skill_progress usp
        WHERE usp.user_id = p_user_id 
          AND usp.product_type = p_product_type
          AND usp.questions_attempted > 0
    ),
    daily_stats AS (
        SELECT 
            DATE(ta.created_at) as activity_date,
            COUNT(qr.id) as questions_answered,
            SUM(CASE WHEN qr.is_correct THEN 1 ELSE 0 END) as correct_answers
        FROM test_attempts ta
        JOIN question_responses qr ON qr.attempt_id = ta.id
        WHERE ta.user_id = p_user_id 
          AND ta.product_type = p_product_type
          AND ta.created_at >= NOW() - INTERVAL '%s days' % p_days_back
        GROUP BY DATE(ta.created_at)
        ORDER BY activity_date
    )
    SELECT 
        analytics_result.total_questions,
        analytics_result.total_correct,
        analytics_result.overall_accuracy,
        analytics_result.total_time,
        analytics_result.avg_time,
        analytics_result.tests_completed,
        (SELECT sub_skill FROM sub_skill_performance WHERE strength_rank = 1),
        (SELECT sub_skill FROM sub_skill_performance WHERE weakness_rank = 1),
        (SELECT jsonb_agg(
            jsonb_build_object(
                'date', activity_date,
                'questions', questions_answered,
                'correct', correct_answers
            )
        ) FROM daily_stats)
    INTO total_questions_attempted, total_correct, overall_accuracy, 
         total_time_spent, avg_time_per_question, tests_completed,
         strongest_sub_skill, weakest_sub_skill, daily_activity;
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION update_user_progress TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_mastery_overview TO authenticated;
GRANT EXECUTE ON FUNCTION generate_diagnostic_test TO authenticated;
GRANT EXECUTE ON FUNCTION get_recommended_practice TO authenticated;
GRANT EXECUTE ON FUNCTION get_test_section_questions TO authenticated;
GRANT EXECUTE ON FUNCTION check_test_structure_compliance TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_analytics TO authenticated; 