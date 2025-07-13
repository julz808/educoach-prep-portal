-- RLS Policies Implementation for EduCourse Production Readiness
-- Run this AFTER running rls-audit.sql to identify missing policies

-- Enable RLS on all critical user data tables
-- (Run each ALTER TABLE individually to see which ones are missing)

-- 1. Enable RLS on core user data tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_test_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_section_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE drill_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_attempt_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sub_skill_performance ENABLE ROW LEVEL SECURITY;

-- 2. Questions table - Read-only access for authenticated users
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Policy for questions: authenticated users can read all questions
CREATE POLICY "Authenticated users can read questions"
  ON questions FOR SELECT
  TO authenticated
  USING (true);

-- 3. User Profiles - Users can only access their own profile
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- 4. User Progress - Users can only access their own progress
CREATE POLICY "Users can view their own progress"
  ON user_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
  ON user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON user_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- 5. User Test Sessions - Users can only access their own sessions
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

-- 6. Test Section States - Users can only access states for their own sessions
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

-- 7. Drill Sessions - Users can only access their own drill sessions
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

-- 8. Question Attempt History - Users can only access their own attempts
CREATE POLICY "Users can view their own question attempts"
  ON question_attempt_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own question attempts"
  ON question_attempt_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own question attempts"
  ON question_attempt_history FOR UPDATE
  USING (auth.uid() = user_id);

-- 9. User Sub-Skill Performance - Users can only access their own performance data
CREATE POLICY "Users can view their own sub-skill performance"
  ON user_sub_skill_performance FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sub-skill performance"
  ON user_sub_skill_performance FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sub-skill performance"
  ON user_sub_skill_performance FOR UPDATE
  USING (auth.uid() = user_id);

-- 10. Reference tables - Read-only access for authenticated users
-- (Apply these if the tables exist)

-- Sub-skills reference table
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sub_skills') THEN
        EXECUTE 'ALTER TABLE sub_skills ENABLE ROW LEVEL SECURITY';
        EXECUTE 'CREATE POLICY "Authenticated users can read sub_skills" ON sub_skills FOR SELECT TO authenticated USING (true)';
    END IF;
END $$;

-- Subjects reference table  
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subjects') THEN
        EXECUTE 'ALTER TABLE subjects ENABLE ROW LEVEL SECURITY';
        EXECUTE 'CREATE POLICY "Authenticated users can read subjects" ON subjects FOR SELECT TO authenticated USING (true)';
    END IF;
END $$;

-- Skill areas reference table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'skill_areas') THEN
        EXECUTE 'ALTER TABLE skill_areas ENABLE ROW LEVEL SECURITY';
        EXECUTE 'CREATE POLICY "Authenticated users can read skill_areas" ON skill_areas FOR SELECT TO authenticated USING (true)';
    END IF;
END $$;

-- 11. Verify all policies are in place
SELECT 
    'VERIFICATION COMPLETE' as status,
    'Run rls-audit.sql again to verify all policies are in place' as next_step;