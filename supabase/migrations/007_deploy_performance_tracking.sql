-- Deploy Performance Tracking Schema to Production
-- Only creates new tables, avoids conflicts with existing tables

-- Enable required extensions (safe if already exists)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

-- Individual question responses (replaces question_responses)
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
-- ENHANCE EXISTING TABLES (SAFE)
-- =============================================================================

-- Add new columns to questions table (safe if already exists)
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS sub_skill_id UUID REFERENCES sub_skills(id),
ADD COLUMN IF NOT EXISTS product_type VARCHAR,
ADD COLUMN IF NOT EXISTS question_order INT4,
ADD COLUMN IF NOT EXISTS explanation TEXT,
ADD COLUMN IF NOT EXISTS time_estimate_seconds INT4 DEFAULT 60;

-- Add new columns to test_attempts table (safe if already exists)
ALTER TABLE test_attempts
ADD COLUMN IF NOT EXISTS test_template_id UUID REFERENCES test_templates(id),
ADD COLUMN IF NOT EXISTS section_scores JSONB,
ADD COLUMN IF NOT EXISTS sub_skill_performance JSONB;

-- =============================================================================
-- INDEXES FOR PERFORMANCE
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

-- RLS Policies (using IF NOT EXISTS pattern for safety)
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