-- Direct deployment script for Performance Tracking System
-- Run this directly in Supabase SQL Editor or via psql

-- =============================================================================
-- PERFORMANCE TRACKING TABLES (NEW)
-- =============================================================================

-- Test sections for all products
CREATE TABLE IF NOT EXISTS test_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_type VARCHAR NOT NULL CHECK (product_type IN ('vic_selective', 'naplan_yr5', 'naplan_yr7', 'naplan_yr9', 'edutest', 'acer')),
  section_name VARCHAR NOT NULL,
  section_order INT4 NOT NULL,
  time_limit_minutes INT4,
  question_count INT4,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_type, section_name)
);

-- Sub-skills within each section
CREATE TABLE IF NOT EXISTS sub_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR NOT NULL,
  section_id UUID REFERENCES test_sections(id),
  product_type VARCHAR NOT NULL,
  skill_category VARCHAR,
  visual_required BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name, section_id)
);

-- Test templates (diagnostic, practice tests, drills)
CREATE TABLE IF NOT EXISTS test_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_type VARCHAR NOT NULL,
  test_mode VARCHAR NOT NULL CHECK (test_mode IN ('diagnostic', 'practice', 'drill')),
  test_number INT4,
  test_name VARCHAR,
  sections JSONB,
  total_questions INT4,
  time_limit_minutes INT4,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_type, test_mode, test_number)
);

-- Individual question responses
CREATE TABLE IF NOT EXISTS user_question_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  question_id UUID REFERENCES questions(id) NOT NULL,
  test_session_id UUID REFERENCES test_attempts(id),
  product_type VARCHAR NOT NULL,
  user_answer TEXT,
  is_correct BOOLEAN NOT NULL,
  time_spent_seconds INT4,
  is_flagged BOOLEAN DEFAULT FALSE,
  is_skipped BOOLEAN DEFAULT FALSE,
  attempt_number INT4 DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User progress per product
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  product_type VARCHAR NOT NULL,
  diagnostic_completed BOOLEAN DEFAULT FALSE,
  diagnostic_score NUMERIC(5,2),
  practice_tests_completed INT4[] DEFAULT '{}',
  total_questions_completed INT4 DEFAULT 0,
  total_study_time_seconds INT4 DEFAULT 0,
  streak_days INT4 DEFAULT 0,
  last_activity_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_type)
);

-- Sub-skill performance tracking
CREATE TABLE IF NOT EXISTS user_sub_skill_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  sub_skill_id UUID REFERENCES sub_skills(id) NOT NULL,
  product_type VARCHAR NOT NULL,
  questions_attempted INT4 DEFAULT 0,
  questions_correct INT4 DEFAULT 0,
  accuracy_percentage NUMERIC(5,2),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, sub_skill_id, product_type)
);

-- =============================================================================
-- ENHANCE EXISTING TABLES
-- =============================================================================

-- Add new columns to questions table
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS sub_skill_id UUID REFERENCES sub_skills(id),
ADD COLUMN IF NOT EXISTS product_type VARCHAR,
ADD COLUMN IF NOT EXISTS question_order INT4,
ADD COLUMN IF NOT EXISTS explanation TEXT,
ADD COLUMN IF NOT EXISTS time_estimate_seconds INT4 DEFAULT 60;

-- Add new columns to test_attempts table
ALTER TABLE test_attempts
ADD COLUMN IF NOT EXISTS test_template_id UUID REFERENCES test_templates(id),
ADD COLUMN IF NOT EXISTS section_scores JSONB,
ADD COLUMN IF NOT EXISTS sub_skill_performance JSONB;

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_user_responses_user_id ON user_question_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_responses_session ON user_question_responses(test_session_id);
CREATE INDEX IF NOT EXISTS idx_user_responses_created ON user_question_responses(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_user_responses_product ON user_question_responses(product_type);

CREATE INDEX IF NOT EXISTS idx_user_progress_user_product ON user_progress(user_id, product_type);
CREATE INDEX IF NOT EXISTS idx_user_progress_activity ON user_progress(last_activity_at);

CREATE INDEX IF NOT EXISTS idx_sub_skill_performance_user ON user_sub_skill_performance(user_id);
CREATE INDEX IF NOT EXISTS idx_sub_skill_performance_skill ON user_sub_skill_performance(sub_skill_id);
CREATE INDEX IF NOT EXISTS idx_sub_skill_performance_product ON user_sub_skill_performance(product_type);

CREATE INDEX IF NOT EXISTS idx_test_sections_product ON test_sections(product_type);
CREATE INDEX IF NOT EXISTS idx_sub_skills_section ON sub_skills(section_id);
CREATE INDEX IF NOT EXISTS idx_sub_skills_product ON sub_skills(product_type);

CREATE INDEX IF NOT EXISTS idx_questions_sub_skill ON questions(sub_skill_id) WHERE sub_skill_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_questions_product_type ON questions(product_type) WHERE product_type IS NOT NULL;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE user_question_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sub_skill_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies (safe creation)
DO $$ 
BEGIN
  -- Policies for user_question_responses
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_question_responses' AND policyname = 'Users can view their own question responses') THEN
    CREATE POLICY "Users can view their own question responses" ON user_question_responses 
    FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_question_responses' AND policyname = 'Users can insert their own question responses') THEN
    CREATE POLICY "Users can insert their own question responses" ON user_question_responses 
    FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Policies for user_progress  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_progress' AND policyname = 'Users can view their own progress') THEN
    CREATE POLICY "Users can view their own progress" ON user_progress 
    FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_progress' AND policyname = 'Users can insert their own progress') THEN
    CREATE POLICY "Users can insert their own progress" ON user_progress 
    FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_progress' AND policyname = 'Users can update their own progress') THEN
    CREATE POLICY "Users can update their own progress" ON user_progress 
    FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  -- Policies for user_sub_skill_performance
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_sub_skill_performance' AND policyname = 'Users can view their own sub-skill performance') THEN
    CREATE POLICY "Users can view their own sub-skill performance" ON user_sub_skill_performance 
    FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_sub_skill_performance' AND policyname = 'Users can insert their own sub-skill performance') THEN
    CREATE POLICY "Users can insert their own sub-skill performance" ON user_sub_skill_performance 
    FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_sub_skill_performance' AND policyname = 'Users can update their own sub-skill performance') THEN
    CREATE POLICY "Users can update their own sub-skill performance" ON user_sub_skill_performance 
    FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  -- Public read access for reference tables
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'test_sections' AND policyname = 'Anyone can read test sections') THEN
    CREATE POLICY "Anyone can read test sections" ON test_sections FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sub_skills' AND policyname = 'Anyone can read sub skills') THEN
    CREATE POLICY "Anyone can read sub skills" ON sub_skills FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'test_templates' AND policyname = 'Anyone can read test templates') THEN
    CREATE POLICY "Anyone can read test templates" ON test_templates FOR SELECT USING (true);
  END IF;
END $$;

-- =============================================================================
-- UPDATE TRIGGERS
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_progress_updated_at ON user_progress;
CREATE TRIGGER update_user_progress_updated_at 
BEFORE UPDATE ON user_progress 
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_sub_skill_performance_updated_at ON user_sub_skill_performance;
CREATE TRIGGER update_sub_skill_performance_updated_at 
BEFORE UPDATE ON user_sub_skill_performance 
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =============================================================================
-- RPC FUNCTIONS
-- =============================================================================

CREATE OR REPLACE FUNCTION record_question_response(
  p_user_id UUID,
  p_question_id UUID,
  p_session_id UUID,
  p_product_type VARCHAR,
  p_answer TEXT,
  p_is_correct BOOLEAN,
  p_time_spent INT4
) RETURNS VOID AS $$
DECLARE
  v_sub_skill_id UUID;
BEGIN
  -- Get sub_skill_id from question
  SELECT sub_skill_id INTO v_sub_skill_id FROM questions WHERE id = p_question_id;
  
  -- Insert response
  INSERT INTO user_question_responses (
    user_id, question_id, test_session_id, product_type,
    user_answer, is_correct, time_spent_seconds
  ) VALUES (
    p_user_id, p_question_id, p_session_id, p_product_type,
    p_answer, p_is_correct, p_time_spent
  );
  
  -- Update user_progress
  INSERT INTO user_progress (user_id, product_type, total_questions_completed, total_study_time_seconds, last_activity_at)
  VALUES (p_user_id, p_product_type, 1, p_time_spent, NOW())
  ON CONFLICT (user_id, product_type) 
  DO UPDATE SET 
    total_questions_completed = user_progress.total_questions_completed + 1,
    total_study_time_seconds = user_progress.total_study_time_seconds + p_time_spent,
    last_activity_at = NOW(),
    updated_at = NOW();
  
  -- Update sub_skill performance
  IF v_sub_skill_id IS NOT NULL THEN
    INSERT INTO user_sub_skill_performance (
      user_id, sub_skill_id, product_type, questions_attempted, questions_correct
    ) VALUES (
      p_user_id, v_sub_skill_id, p_product_type, 1, CASE WHEN p_is_correct THEN 1 ELSE 0 END
    )
    ON CONFLICT (user_id, sub_skill_id, product_type)
    DO UPDATE SET
      questions_attempted = user_sub_skill_performance.questions_attempted + 1,
      questions_correct = user_sub_skill_performance.questions_correct + CASE WHEN p_is_correct THEN 1 ELSE 0 END,
      accuracy_percentage = (user_sub_skill_performance.questions_correct + CASE WHEN p_is_correct THEN 1 ELSE 0 END)::NUMERIC / 
                           (user_sub_skill_performance.questions_attempted + 1) * 100,
      last_updated = NOW();
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION complete_test_session(
  p_session_id UUID,
  p_user_id UUID,
  p_product_type VARCHAR,
  p_test_mode VARCHAR,
  p_section_scores JSONB DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_total_correct INT4;
  v_total_questions INT4;
  v_session_score NUMERIC(5,2);
BEGIN
  -- Calculate session statistics
  SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE is_correct = true) as correct
  INTO v_total_questions, v_total_correct
  FROM user_question_responses 
  WHERE test_session_id = p_session_id;
  
  -- Calculate percentage score
  v_session_score := CASE 
    WHEN v_total_questions > 0 THEN (v_total_correct::NUMERIC / v_total_questions) * 100
    ELSE 0
  END;
  
  -- Update test session
  UPDATE test_attempts 
  SET 
    completed_at = NOW(),
    correct_answers = v_total_correct,
    total_questions = v_total_questions,
    section_scores = p_section_scores
  WHERE id = p_session_id;
  
  -- Update user progress for diagnostic completion
  IF p_test_mode = 'diagnostic' THEN
    UPDATE user_progress 
    SET 
      diagnostic_completed = true,
      diagnostic_score = v_session_score,
      updated_at = NOW()
    WHERE user_id = p_user_id AND product_type = p_product_type;
  END IF;
  
  -- Update practice test completion
  IF p_test_mode = 'practice' THEN
    UPDATE user_progress 
    SET 
      practice_tests_completed = array_append(
        COALESCE(practice_tests_completed, '{}'),
        (SELECT test_number FROM test_attempts WHERE id = p_session_id)
      ),
      updated_at = NOW()
    WHERE user_id = p_user_id AND product_type = p_product_type;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_user_dashboard_stats(
  p_user_id UUID,
  p_product_type VARCHAR
) RETURNS TABLE (
  total_questions_completed INT4,
  total_study_time_seconds INT4,
  overall_accuracy NUMERIC(5,2),
  streak_days INT4,
  diagnostic_completed BOOLEAN,
  diagnostic_score NUMERIC(5,2),
  practice_tests_completed INT4[],
  last_activity_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.total_questions_completed,
    up.total_study_time_seconds,
    CASE 
      WHEN up.total_questions_completed > 0 THEN
        (SELECT (COUNT(*) FILTER (WHERE is_correct = true)::NUMERIC / COUNT(*)) * 100
         FROM user_question_responses 
         WHERE user_id = p_user_id AND product_type = p_product_type)
      ELSE 0::NUMERIC(5,2)
    END as overall_accuracy,
    up.streak_days,
    up.diagnostic_completed,
    up.diagnostic_score,
    up.practice_tests_completed,
    up.last_activity_at
  FROM user_progress up
  WHERE up.user_id = p_user_id AND up.product_type = p_product_type;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_sub_skill_performance(
  p_user_id UUID,
  p_product_type VARCHAR
) RETURNS TABLE (
  section_name VARCHAR,
  sub_skill_name VARCHAR,
  questions_attempted INT4,
  questions_correct INT4,
  accuracy_percentage NUMERIC(5,2),
  last_updated TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ts.section_name,
    ss.name as sub_skill_name,
    ussp.questions_attempted,
    ussp.questions_correct,
    ussp.accuracy_percentage,
    ussp.last_updated
  FROM user_sub_skill_performance ussp
  JOIN sub_skills ss ON ss.id = ussp.sub_skill_id
  JOIN test_sections ts ON ts.id = ss.section_id
  WHERE ussp.user_id = p_user_id 
    AND ussp.product_type = p_product_type
    AND ussp.questions_attempted > 0
  ORDER BY ts.section_order, ss.name;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_user_streak(
  p_user_id UUID,
  p_product_type VARCHAR
) RETURNS VOID AS $$
DECLARE
  v_last_activity DATE;
  v_today DATE := CURRENT_DATE;
  v_yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
  v_current_streak INT4;
BEGIN
  -- Get current progress
  SELECT 
    DATE(last_activity_at),
    streak_days
  INTO v_last_activity, v_current_streak
  FROM user_progress 
  WHERE user_id = p_user_id AND product_type = p_product_type;
  
  -- Update streak logic
  IF v_last_activity IS NULL THEN
    -- First activity
    v_current_streak := 1;
  ELSIF v_last_activity = v_yesterday THEN
    -- Consecutive day
    v_current_streak := v_current_streak + 1;
  ELSIF v_last_activity = v_today THEN
    -- Same day, no change
    RETURN;
  ELSE
    -- Streak broken
    v_current_streak := 1;
  END IF;
  
  -- Update the streak
  UPDATE user_progress 
  SET 
    streak_days = v_current_streak,
    last_activity_at = NOW(),
    updated_at = NOW()
  WHERE user_id = p_user_id AND product_type = p_product_type;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION initialize_user_progress(
  p_user_id UUID,
  p_product_type VARCHAR
) RETURNS VOID AS $$
BEGIN
  INSERT INTO user_progress (
    user_id, 
    product_type, 
    created_at, 
    updated_at
  ) VALUES (
    p_user_id, 
    p_product_type, 
    NOW(), 
    NOW()
  )
  ON CONFLICT (user_id, product_type) DO NOTHING;
END;
$$ LANGUAGE plpgsql; 