-- =============================================================================
-- COMPLETE PERFORMANCE TRACKING DEPLOYMENT SCRIPT
-- Paste this entire script into Supabase SQL Editor
-- =============================================================================

-- =============================================================================
-- STEP 1: CREATE PERFORMANCE TRACKING SCHEMA
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
-- CREATE INDEXES
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

-- RLS Policies
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

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for user_progress
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_progress_updated_at') THEN
    CREATE TRIGGER update_user_progress_updated_at 
    BEFORE UPDATE ON user_progress 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- =============================================================================
-- RPC FUNCTIONS
-- =============================================================================

-- Drop existing functions if they exist (to avoid return type conflicts)
DROP FUNCTION IF EXISTS get_user_dashboard_stats(UUID, VARCHAR);
DROP FUNCTION IF EXISTS record_question_response(UUID, UUID, UUID, VARCHAR, TEXT, BOOLEAN, INT4, BOOLEAN, BOOLEAN);
DROP FUNCTION IF EXISTS complete_test_session(UUID, UUID, VARCHAR, VARCHAR, JSONB);
DROP FUNCTION IF EXISTS get_sub_skill_performance(UUID, VARCHAR);
DROP FUNCTION IF EXISTS update_user_streak(UUID, VARCHAR);
DROP FUNCTION IF EXISTS initialize_user_progress(UUID, VARCHAR);

-- Function to record question response
CREATE OR REPLACE FUNCTION record_question_response(
  p_user_id UUID,
  p_question_id UUID,
  p_test_session_id UUID,
  p_product_type VARCHAR,
  p_user_answer TEXT,
  p_is_correct BOOLEAN,
  p_time_spent_seconds INT4 DEFAULT NULL,
  p_is_flagged BOOLEAN DEFAULT FALSE,
  p_is_skipped BOOLEAN DEFAULT FALSE
) RETURNS VOID AS $$
BEGIN
  INSERT INTO user_question_responses (
    user_id, question_id, test_session_id, product_type, 
    user_answer, is_correct, time_spent_seconds, is_flagged, is_skipped
  ) VALUES (
    p_user_id, p_question_id, p_test_session_id, p_product_type,
    p_user_answer, p_is_correct, p_time_spent_seconds, p_is_flagged, p_is_skipped
  );
  
  -- Update user progress
  UPDATE user_progress 
  SET 
    total_questions_completed = total_questions_completed + 1,
    total_study_time_seconds = total_study_time_seconds + COALESCE(p_time_spent_seconds, 0),
    last_activity_at = NOW()
  WHERE user_id = p_user_id AND product_type = p_product_type;
  
  -- Update sub-skill performance if question has sub_skill_id
  UPDATE user_sub_skill_performance 
  SET 
    questions_attempted = questions_attempted + 1,
    questions_correct = questions_correct + CASE WHEN p_is_correct THEN 1 ELSE 0 END,
    accuracy_percentage = ROUND(
      (questions_correct + CASE WHEN p_is_correct THEN 1 ELSE 0 END) * 100.0 / 
      (questions_attempted + 1), 2
    ),
    last_updated = NOW()
  WHERE user_id = p_user_id 
    AND sub_skill_id = (SELECT sub_skill_id FROM questions WHERE id = p_question_id)
    AND product_type = p_product_type;
END;
$$ LANGUAGE plpgsql;

-- Function to complete test session
CREATE OR REPLACE FUNCTION complete_test_session(
  p_session_id UUID,
  p_user_id UUID,
  p_product_type VARCHAR,
  p_test_mode VARCHAR,
  p_section_scores JSONB DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  -- Update test_attempts with section scores
  UPDATE test_attempts 
  SET 
    section_scores = p_section_scores,
    completed_at = NOW()
  WHERE id = p_session_id AND user_id = p_user_id;
  
  -- Update user progress for diagnostic completion
  IF p_test_mode = 'diagnostic' THEN
    UPDATE user_progress 
    SET 
      diagnostic_completed = true,
      diagnostic_score = (
        SELECT AVG(CASE WHEN is_correct THEN 100.0 ELSE 0.0 END)
        FROM user_question_responses 
        WHERE test_session_id = p_session_id AND user_id = p_user_id
      ),
      last_activity_at = NOW()
    WHERE user_id = p_user_id AND product_type = p_product_type;
  END IF;
  
  -- Update practice tests completed array
  IF p_test_mode = 'practice' THEN
    UPDATE user_progress 
    SET 
      practice_tests_completed = array_append(
        practice_tests_completed, 
        (SELECT test_template_id FROM test_attempts WHERE id = p_session_id)::INT4
      ),
      last_activity_at = NOW()
    WHERE user_id = p_user_id AND product_type = p_product_type;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get user dashboard stats
CREATE OR REPLACE FUNCTION get_user_dashboard_stats(p_user_id UUID, p_product_type VARCHAR)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_questions_completed', COALESCE(up.total_questions_completed, 0),
    'total_study_time_seconds', COALESCE(up.total_study_time_seconds, 0),
    'diagnostic_completed', COALESCE(up.diagnostic_completed, false),
    'diagnostic_score', up.diagnostic_score,
    'practice_tests_completed', COALESCE(array_length(up.practice_tests_completed, 1), 0),
    'streak_days', COALESCE(up.streak_days, 0),
    'average_accuracy', COALESCE(
      (SELECT AVG(accuracy_percentage) FROM user_sub_skill_performance 
       WHERE user_id = p_user_id AND product_type = p_product_type), 0
    ),
    'weakest_skills', (
      SELECT json_agg(json_build_object('skill_name', ss.name, 'accuracy', ussp.accuracy_percentage))
      FROM user_sub_skill_performance ussp
      JOIN sub_skills ss ON ussp.sub_skill_id = ss.id
      WHERE ussp.user_id = p_user_id AND ussp.product_type = p_product_type
      ORDER BY ussp.accuracy_percentage ASC
      LIMIT 3
    )
  ) INTO result
  FROM user_progress up
  WHERE up.user_id = p_user_id AND up.product_type = p_product_type;
  
  RETURN COALESCE(result, '{}'::json);
END;
$$ LANGUAGE plpgsql;

-- Function to get sub-skill performance
CREATE OR REPLACE FUNCTION get_sub_skill_performance(p_user_id UUID, p_product_type VARCHAR)
RETURNS TABLE(
  skill_name VARCHAR,
  section_name VARCHAR,
  questions_attempted INT4,
  questions_correct INT4,
  accuracy_percentage NUMERIC,
  visual_required BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ss.name as skill_name,
    ts.section_name,
    COALESCE(ussp.questions_attempted, 0) as questions_attempted,
    COALESCE(ussp.questions_correct, 0) as questions_correct,
    COALESCE(ussp.accuracy_percentage, 0) as accuracy_percentage,
    ss.visual_required
  FROM sub_skills ss
  JOIN test_sections ts ON ss.section_id = ts.id
  LEFT JOIN user_sub_skill_performance ussp ON (
    ussp.sub_skill_id = ss.id 
    AND ussp.user_id = p_user_id 
    AND ussp.product_type = p_product_type
  )
  WHERE ss.product_type = p_product_type
  ORDER BY ts.section_order, ss.name;
END;
$$ LANGUAGE plpgsql;

-- Function to update user streak
CREATE OR REPLACE FUNCTION update_user_streak(
  p_user_id UUID,
  p_product_type VARCHAR
) RETURNS VOID AS $$
DECLARE
  last_activity DATE;
  today DATE := CURRENT_DATE;
BEGIN
  SELECT DATE(last_activity_at) INTO last_activity
  FROM user_progress 
  WHERE user_id = p_user_id AND product_type = p_product_type;
  
  IF last_activity IS NULL THEN
    -- First activity
    UPDATE user_progress 
    SET streak_days = 1, last_activity_at = NOW()
    WHERE user_id = p_user_id AND product_type = p_product_type;
  ELSIF last_activity = today THEN
    -- Same day, no change to streak
    UPDATE user_progress 
    SET last_activity_at = NOW()
    WHERE user_id = p_user_id AND product_type = p_product_type;
  ELSIF last_activity = today - INTERVAL '1 day' THEN
    -- Consecutive day, increment streak
    UPDATE user_progress 
    SET streak_days = streak_days + 1, last_activity_at = NOW()
    WHERE user_id = p_user_id AND product_type = p_product_type;
  ELSE
    -- Streak broken, reset to 1
    UPDATE user_progress 
    SET streak_days = 1, last_activity_at = NOW()
    WHERE user_id = p_user_id AND product_type = p_product_type;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to initialize user progress
CREATE OR REPLACE FUNCTION initialize_user_progress(
  p_user_id UUID,
  p_product_type VARCHAR
) RETURNS VOID AS $$
BEGIN
  INSERT INTO user_progress (user_id, product_type)
  VALUES (p_user_id, p_product_type)
  ON CONFLICT (user_id, product_type) DO NOTHING;
  
  -- Initialize sub-skill performance records
  INSERT INTO user_sub_skill_performance (user_id, sub_skill_id, product_type)
  SELECT p_user_id, ss.id, p_product_type
  FROM sub_skills ss
  WHERE ss.product_type = p_product_type
  ON CONFLICT (user_id, sub_skill_id, product_type) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- STEP 2: POPULATE REFERENCE DATA
-- =============================================================================

-- VIC Selective Entry sections
INSERT INTO test_sections (product_type, section_name, section_order, time_limit_minutes, question_count) VALUES
('vic_selective', 'Reading Reasoning', 1, 35, 50),
('vic_selective', 'Mathematics Reasoning', 2, 30, 60),
('vic_selective', 'General Ability - Verbal', 3, 30, 60),
('vic_selective', 'General Ability - Quantitative', 4, 30, 50),
('vic_selective', 'Writing', 5, 40, 2)
ON CONFLICT (product_type, section_name) DO NOTHING;

-- NAPLAN Year 5 sections
INSERT INTO test_sections (product_type, section_name, section_order, time_limit_minutes, question_count) VALUES
('naplan_yr5', 'Reading', 1, 50, 40),
('naplan_yr5', 'Writing', 2, 42, 1),
('naplan_yr5', 'Language Conventions', 3, 45, 40),
('naplan_yr5', 'Numeracy No Calculator', 4, 25, 25),
('naplan_yr5', 'Numeracy Calculator', 5, 25, 25)
ON CONFLICT (product_type, section_name) DO NOTHING;

-- NAPLAN Year 7 sections
INSERT INTO test_sections (product_type, section_name, section_order, time_limit_minutes, question_count) VALUES
('naplan_yr7', 'Reading', 1, 65, 50),
('naplan_yr7', 'Writing', 2, 42, 1),
('naplan_yr7', 'Language Conventions', 3, 45, 45),
('naplan_yr7', 'Numeracy No Calculator', 4, 30, 30),
('naplan_yr7', 'Numeracy Calculator', 5, 35, 35)
ON CONFLICT (product_type, section_name) DO NOTHING;

-- NAPLAN Year 9 sections
INSERT INTO test_sections (product_type, section_name, section_order, time_limit_minutes, question_count) VALUES
('naplan_yr9', 'Reading', 1, 65, 50),
('naplan_yr9', 'Writing', 2, 42, 1),
('naplan_yr9', 'Language Conventions', 3, 45, 45),
('naplan_yr9', 'Numeracy No Calculator', 4, 30, 30),
('naplan_yr9', 'Numeracy Calculator', 5, 35, 35)
ON CONFLICT (product_type, section_name) DO NOTHING;

-- EduTest sections
INSERT INTO test_sections (product_type, section_name, section_order, time_limit_minutes, question_count) VALUES
('edutest', 'Reading Comprehension', 1, 30, 50),
('edutest', 'Verbal Reasoning', 2, 30, 60),
('edutest', 'Numerical Reasoning', 3, 30, 50),
('edutest', 'Mathematics', 4, 30, 60),
('edutest', 'Written Expression', 5, 30, 2)
ON CONFLICT (product_type, section_name) DO NOTHING;

-- ACER sections
INSERT INTO test_sections (product_type, section_name, section_order, time_limit_minutes, question_count) VALUES
('acer', 'Mathematics', 1, 47, 35),
('acer', 'Humanities', 2, 47, 35),
('acer', 'Written Expression', 3, 25, 1)
ON CONFLICT (product_type, section_name) DO NOTHING;

-- =============================================================================
-- POPULATE SUB-SKILLS (Key sub-skills only for initial deployment)
-- =============================================================================

-- VIC Selective Entry sub-skills
INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Inferential Reasoning', ts.id, 'vic_selective', false
FROM test_sections ts WHERE ts.product_type = 'vic_selective' AND ts.section_name = 'Reading Reasoning'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Vocabulary in Context', ts.id, 'vic_selective', false
FROM test_sections ts WHERE ts.product_type = 'vic_selective' AND ts.section_name = 'Reading Reasoning'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Algebraic Reasoning', ts.id, 'vic_selective', false
FROM test_sections ts WHERE ts.product_type = 'vic_selective' AND ts.section_name = 'Mathematics Reasoning'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Geometric & Spatial Reasoning', ts.id, 'vic_selective', true
FROM test_sections ts WHERE ts.product_type = 'vic_selective' AND ts.section_name = 'Mathematics Reasoning'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Creative Writing', ts.id, 'vic_selective', false
FROM test_sections ts WHERE ts.product_type = 'vic_selective' AND ts.section_name = 'Writing'
ON CONFLICT (name, section_id) DO NOTHING;

-- NAPLAN Year 5 key sub-skills
INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Literal Comprehension', ts.id, 'naplan_yr5', false
FROM test_sections ts WHERE ts.product_type = 'naplan_yr5' AND ts.section_name = 'Reading'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Spelling Patterns & Orthographic Knowledge', ts.id, 'naplan_yr5', false
FROM test_sections ts WHERE ts.product_type = 'naplan_yr5' AND ts.section_name = 'Language Conventions'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Number Sense & Operations', ts.id, 'naplan_yr5', false
FROM test_sections ts WHERE ts.product_type = 'naplan_yr5' AND ts.section_name = 'Numeracy No Calculator'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Narrative Writing', ts.id, 'naplan_yr5', false
FROM test_sections ts WHERE ts.product_type = 'naplan_yr5' AND ts.section_name = 'Writing'
ON CONFLICT (name, section_id) DO NOTHING;

-- =============================================================================
-- POPULATE TEST TEMPLATES
-- =============================================================================

-- VIC Selective Entry test templates
INSERT INTO test_templates (product_type, test_mode, test_number, test_name, total_questions, time_limit_minutes) VALUES
('vic_selective', 'diagnostic', 1, 'VIC Selective Diagnostic Test', 50, 120),
('vic_selective', 'practice', 1, 'VIC Selective Practice Test 1', 222, 165),
('vic_selective', 'practice', 2, 'VIC Selective Practice Test 2', 222, 165)
ON CONFLICT (product_type, test_mode, test_number) DO NOTHING;

-- NAPLAN Year 5 test templates
INSERT INTO test_templates (product_type, test_mode, test_number, test_name, total_questions, time_limit_minutes) VALUES
('naplan_yr5', 'diagnostic', 1, 'NAPLAN Year 5 Diagnostic Test', 30, 90),
('naplan_yr5', 'practice', 1, 'NAPLAN Year 5 Practice Test 1', 132, 187)
ON CONFLICT (product_type, test_mode, test_number) DO NOTHING;

-- NAPLAN Year 7 test templates
INSERT INTO test_templates (product_type, test_mode, test_number, test_name, total_questions, time_limit_minutes) VALUES
('naplan_yr7', 'diagnostic', 1, 'NAPLAN Year 7 Diagnostic Test', 35, 100),
('naplan_yr7', 'practice', 1, 'NAPLAN Year 7 Practice Test 1', 161, 217)
ON CONFLICT (product_type, test_mode, test_number) DO NOTHING;

-- EduTest test templates
INSERT INTO test_templates (product_type, test_mode, test_number, test_name, total_questions, time_limit_minutes) VALUES
('edutest', 'diagnostic', 1, 'EduTest Diagnostic Test', 40, 100),
('edutest', 'practice', 1, 'EduTest Practice Test 1', 222, 150)
ON CONFLICT (product_type, test_mode, test_number) DO NOTHING;

-- ACER test templates
INSERT INTO test_templates (product_type, test_mode, test_number, test_name, total_questions, time_limit_minutes) VALUES
('acer', 'diagnostic', 1, 'ACER Diagnostic Test', 25, 90),
('acer', 'practice', 1, 'ACER Practice Test 1', 71, 119)
ON CONFLICT (product_type, test_mode, test_number) DO NOTHING;

-- =============================================================================
-- VERIFICATION QUERIES (Optional - comment out if not needed)
-- =============================================================================

-- Verify the deployment
-- SELECT 'test_sections' as table_name, COUNT(*) as record_count FROM test_sections
-- UNION ALL
-- SELECT 'sub_skills', COUNT(*) FROM sub_skills  
-- UNION ALL
-- SELECT 'test_templates', COUNT(*) FROM test_templates;

-- =============================================================================
-- DEPLOYMENT COMPLETE
-- ============================================================================= 