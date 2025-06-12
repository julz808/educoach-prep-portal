-- Phase 1: Product-Agnostic Performance Tracking Schema
-- EduCourse Performance Tracking Implementation
-- This migration creates a scalable architecture for all 6 test products

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- CORE REFERENCE TABLES (Product-Agnostic)
-- =============================================================================

-- Test sections for all products
CREATE TABLE test_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_type VARCHAR NOT NULL CHECK (product_type IN ('vic_selective', 'naplan_yr5', 'naplan_yr7', 'naplan_yr9', 'edutest', 'acer', 'selective_entry')),
  section_name VARCHAR NOT NULL,
  section_order INT4 NOT NULL,
  time_limit_minutes INT4,
  question_count INT4,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_type, section_name)
);

-- Sub-skills within each section
CREATE TABLE sub_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR NOT NULL,
  section_id UUID REFERENCES test_sections(id),
  product_type VARCHAR NOT NULL,
  skill_category VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name, section_id)
);

-- Test templates (diagnostic, practice tests, drills)
CREATE TABLE test_templates (
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

-- =============================================================================
-- PERFORMANCE TRACKING TABLES
-- =============================================================================

-- Individual question responses (replaces question_responses)
CREATE TABLE user_question_responses (
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
CREATE TABLE user_progress (
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
CREATE TABLE user_sub_skill_performance (
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

-- Enhance questions table with new columns
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS sub_skill_id UUID REFERENCES sub_skills(id),
ADD COLUMN IF NOT EXISTS product_type VARCHAR,
ADD COLUMN IF NOT EXISTS question_order INT4,
ADD COLUMN IF NOT EXISTS explanation TEXT,
ADD COLUMN IF NOT EXISTS time_estimate_seconds INT4 DEFAULT 60;

-- Enhance test_attempts table (renamed to user_test_sessions for clarity)
ALTER TABLE test_attempts
ADD COLUMN IF NOT EXISTS test_template_id UUID REFERENCES test_templates(id),
ADD COLUMN IF NOT EXISTS section_scores JSONB,
ADD COLUMN IF NOT EXISTS sub_skill_performance JSONB;

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

CREATE INDEX idx_user_responses_user_id ON user_question_responses(user_id);
CREATE INDEX idx_user_responses_session ON user_question_responses(test_session_id);
CREATE INDEX idx_user_responses_created ON user_question_responses(user_id, created_at);
CREATE INDEX idx_user_responses_product ON user_question_responses(product_type);

CREATE INDEX idx_user_progress_user_product ON user_progress(user_id, product_type);
CREATE INDEX idx_user_progress_activity ON user_progress(last_activity_at);

CREATE INDEX idx_sub_skill_performance_user ON user_sub_skill_performance(user_id);
CREATE INDEX idx_sub_skill_performance_skill ON user_sub_skill_performance(sub_skill_id);
CREATE INDEX idx_sub_skill_performance_product ON user_sub_skill_performance(product_type);

CREATE INDEX idx_test_sections_product ON test_sections(product_type);
CREATE INDEX idx_sub_skills_section ON sub_skills(section_id);
CREATE INDEX idx_sub_skills_product ON sub_skills(product_type);

CREATE INDEX idx_questions_sub_skill ON questions(sub_skill_id) WHERE sub_skill_id IS NOT NULL;
CREATE INDEX idx_questions_product_type ON questions(product_type) WHERE product_type IS NOT NULL;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE user_question_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sub_skill_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_question_responses
CREATE POLICY "Users can view their own question responses" ON user_question_responses 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own question responses" ON user_question_responses 
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_progress
CREATE POLICY "Users can view their own progress" ON user_progress 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" ON user_progress 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" ON user_progress 
FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for user_sub_skill_performance
CREATE POLICY "Users can view their own sub-skill performance" ON user_sub_skill_performance 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sub-skill performance" ON user_sub_skill_performance 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sub-skill performance" ON user_sub_skill_performance 
FOR UPDATE USING (auth.uid() = user_id);

-- Public read access for reference tables
CREATE POLICY "Anyone can read test sections" ON test_sections FOR SELECT USING (true);
CREATE POLICY "Anyone can read sub skills" ON sub_skills FOR SELECT USING (true);
CREATE POLICY "Anyone can read test templates" ON test_templates FOR SELECT USING (true);

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

CREATE TRIGGER update_user_progress_updated_at 
BEFORE UPDATE ON user_progress 
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_sub_skill_performance_updated_at 
BEFORE UPDATE ON user_sub_skill_performance 
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column(); 