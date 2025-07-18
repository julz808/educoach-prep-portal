-- Add missing RLS policies for user registration
-- This fixes the issue where new users cannot create their profiles during registration

-- Enable RLS on core user data tables if not already enabled
-- (These will be no-ops if already enabled)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_test_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_section_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE drill_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_attempt_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sub_skill_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;

DROP POLICY IF EXISTS "Users can view their own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can insert their own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can update their own progress" ON user_progress;

DROP POLICY IF EXISTS "Authenticated users can read questions" ON questions;

-- User Profiles - Users can only access their own profile
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- User Progress - Users can only access their own progress
CREATE POLICY "Users can view their own progress"
  ON user_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
  ON user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON user_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Questions table - Read-only access for authenticated users
CREATE POLICY "Authenticated users can read questions"
  ON questions FOR SELECT
  TO authenticated
  USING (true);

-- User Test Sessions - Users can only access their own sessions
DROP POLICY IF EXISTS "Users can view their own test sessions" ON user_test_sessions;
DROP POLICY IF EXISTS "Users can insert their own test sessions" ON user_test_sessions;
DROP POLICY IF EXISTS "Users can update their own test sessions" ON user_test_sessions;
DROP POLICY IF EXISTS "Users can delete their own test sessions" ON user_test_sessions;

CREATE POLICY "Users can view their own test sessions"
  ON user_test_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own test sessions"
  ON user_test_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own test sessions"
  ON user_test_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own test sessions"
  ON user_test_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Test Section States - Users can only access states for their own sessions
DROP POLICY IF EXISTS "Users can view their own section states" ON test_section_states;
DROP POLICY IF EXISTS "Users can insert section states for their own sessions" ON test_section_states;
DROP POLICY IF EXISTS "Users can update section states for their own sessions" ON test_section_states;
DROP POLICY IF EXISTS "Users can delete section states for their own sessions" ON test_section_states;

CREATE POLICY "Users can view their own section states"
  ON test_section_states FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_test_sessions 
      WHERE user_test_sessions.id = test_section_states.test_session_id 
      AND user_test_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert section states for their own sessions"
  ON test_section_states FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_test_sessions 
      WHERE user_test_sessions.id = test_section_states.test_session_id 
      AND user_test_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update section states for their own sessions"
  ON test_section_states FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_test_sessions 
      WHERE user_test_sessions.id = test_section_states.test_session_id 
      AND user_test_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete section states for their own sessions"
  ON test_section_states FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_test_sessions 
      WHERE user_test_sessions.id = test_section_states.test_session_id 
      AND user_test_sessions.user_id = auth.uid()
    )
  );

-- Drill Sessions - Users can only access their own drill sessions
DROP POLICY IF EXISTS "Users can view their own drill sessions" ON drill_sessions;
DROP POLICY IF EXISTS "Users can insert their own drill sessions" ON drill_sessions;
DROP POLICY IF EXISTS "Users can update their own drill sessions" ON drill_sessions;
DROP POLICY IF EXISTS "Users can delete their own drill sessions" ON drill_sessions;

CREATE POLICY "Users can view their own drill sessions"
  ON drill_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own drill sessions"
  ON drill_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own drill sessions"
  ON drill_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own drill sessions"
  ON drill_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Question Attempt History - Users can only access their own attempts
DROP POLICY IF EXISTS "Users can view their own question attempts" ON question_attempt_history;
DROP POLICY IF EXISTS "Users can insert their own question attempts" ON question_attempt_history;
DROP POLICY IF EXISTS "Users can update their own question attempts" ON question_attempt_history;

CREATE POLICY "Users can view their own question attempts"
  ON question_attempt_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own question attempts"
  ON question_attempt_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own question attempts"
  ON question_attempt_history FOR UPDATE
  USING (auth.uid() = user_id);

-- User Sub-Skill Performance - Users can only access their own performance data
DROP POLICY IF EXISTS "Users can view their own sub-skill performance" ON user_sub_skill_performance;
DROP POLICY IF EXISTS "Users can insert their own sub-skill performance" ON user_sub_skill_performance;
DROP POLICY IF EXISTS "Users can update their own sub-skill performance" ON user_sub_skill_performance;

CREATE POLICY "Users can view their own sub-skill performance"
  ON user_sub_skill_performance FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sub-skill performance"
  ON user_sub_skill_performance FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sub-skill performance"
  ON user_sub_skill_performance FOR UPDATE
  USING (auth.uid() = user_id);

-- Grant necessary permissions to authenticated users
GRANT SELECT ON user_profiles TO authenticated;
GRANT INSERT ON user_profiles TO authenticated;
GRANT UPDATE ON user_profiles TO authenticated;

GRANT SELECT ON user_progress TO authenticated;
GRANT INSERT ON user_progress TO authenticated;
GRANT UPDATE ON user_progress TO authenticated;

GRANT SELECT ON questions TO authenticated;

GRANT SELECT ON user_test_sessions TO authenticated;
GRANT INSERT ON user_test_sessions TO authenticated;
GRANT UPDATE ON user_test_sessions TO authenticated;
GRANT DELETE ON user_test_sessions TO authenticated;

GRANT SELECT ON test_section_states TO authenticated;
GRANT INSERT ON test_section_states TO authenticated;
GRANT UPDATE ON test_section_states TO authenticated;
GRANT DELETE ON test_section_states TO authenticated;

GRANT SELECT ON drill_sessions TO authenticated;
GRANT INSERT ON drill_sessions TO authenticated;
GRANT UPDATE ON drill_sessions TO authenticated;
GRANT DELETE ON drill_sessions TO authenticated;

GRANT SELECT ON question_attempt_history TO authenticated;
GRANT INSERT ON question_attempt_history TO authenticated;
GRANT UPDATE ON question_attempt_history TO authenticated;

GRANT SELECT ON user_sub_skill_performance TO authenticated;
GRANT INSERT ON user_sub_skill_performance TO authenticated;
GRANT UPDATE ON user_sub_skill_performance TO authenticated;

-- Handle reference tables if they exist
DO $$ 
BEGIN
    -- Sub-skills reference table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sub_skills') THEN
        EXECUTE 'ALTER TABLE sub_skills ENABLE ROW LEVEL SECURITY';
        EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can read sub_skills" ON sub_skills';
        EXECUTE 'CREATE POLICY "Authenticated users can read sub_skills" ON sub_skills FOR SELECT TO authenticated USING (true)';
        EXECUTE 'GRANT SELECT ON sub_skills TO authenticated';
    END IF;

    -- Subjects reference table  
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subjects') THEN
        EXECUTE 'ALTER TABLE subjects ENABLE ROW LEVEL SECURITY';
        EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can read subjects" ON subjects';
        EXECUTE 'CREATE POLICY "Authenticated users can read subjects" ON subjects FOR SELECT TO authenticated USING (true)';
        EXECUTE 'GRANT SELECT ON subjects TO authenticated';
    END IF;

    -- Skill areas reference table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'skill_areas') THEN
        EXECUTE 'ALTER TABLE skill_areas ENABLE ROW LEVEL SECURITY';
        EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can read skill_areas" ON skill_areas';
        EXECUTE 'CREATE POLICY "Authenticated users can read skill_areas" ON skill_areas FOR SELECT TO authenticated USING (true)';
        EXECUTE 'GRANT SELECT ON skill_areas TO authenticated';
    END IF;

    -- Test sections reference table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'test_sections') THEN
        EXECUTE 'ALTER TABLE test_sections ENABLE ROW LEVEL SECURITY';
        EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can read test_sections" ON test_sections';
        EXECUTE 'CREATE POLICY "Authenticated users can read test_sections" ON test_sections FOR SELECT TO authenticated USING (true)';
        EXECUTE 'GRANT SELECT ON test_sections TO authenticated';
    END IF;

    -- Passages reference table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'passages') THEN
        EXECUTE 'ALTER TABLE passages ENABLE ROW LEVEL SECURITY';
        EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can read passages" ON passages';
        EXECUTE 'CREATE POLICY "Authenticated users can read passages" ON passages FOR SELECT TO authenticated USING (true)';
        EXECUTE 'GRANT SELECT ON passages TO authenticated';
    END IF;

    -- Writing assessments table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'writing_assessments') THEN
        EXECUTE 'ALTER TABLE writing_assessments ENABLE ROW LEVEL SECURITY';
        EXECUTE 'DROP POLICY IF EXISTS "Users can view their own writing assessments" ON writing_assessments';
        EXECUTE 'DROP POLICY IF EXISTS "Users can insert their own writing assessments" ON writing_assessments';
        EXECUTE 'DROP POLICY IF EXISTS "Users can update their own writing assessments" ON writing_assessments';
        EXECUTE 'DROP POLICY IF EXISTS "Users can delete their own writing assessments" ON writing_assessments';
        
        EXECUTE 'CREATE POLICY "Users can view their own writing assessments" ON writing_assessments FOR SELECT USING (auth.uid() = user_id)';
        EXECUTE 'CREATE POLICY "Users can insert their own writing assessments" ON writing_assessments FOR INSERT WITH CHECK (auth.uid() = user_id)';
        EXECUTE 'CREATE POLICY "Users can update their own writing assessments" ON writing_assessments FOR UPDATE USING (auth.uid() = user_id)';
        EXECUTE 'CREATE POLICY "Users can delete their own writing assessments" ON writing_assessments FOR DELETE USING (auth.uid() = user_id)';
        
        EXECUTE 'GRANT SELECT ON writing_assessments TO authenticated';
        EXECUTE 'GRANT INSERT ON writing_assessments TO authenticated';
        EXECUTE 'GRANT UPDATE ON writing_assessments TO authenticated';
        EXECUTE 'GRANT DELETE ON writing_assessments TO authenticated';
    END IF;
END $$;