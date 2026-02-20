-- ============================================================================
-- V2 QUESTION ENGINE - DATABASE TABLES
-- ============================================================================
-- Created: February 9, 2026
-- Purpose: Create v2 tables for new question generation engine using
--          curriculumData v2 with pattern-based generation
-- Strategy: Keep v1 tables intact for existing customers, v2 runs in parallel
-- ============================================================================

-- ============================================================================
-- 1. CREATE PASSAGES_V2 TABLE
-- ============================================================================
-- Enhanced passages table with quality tracking and curriculum linking

CREATE TABLE IF NOT EXISTS passages_v2 (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Test identification
  test_type TEXT NOT NULL,
  year_level INTEGER NOT NULL,
  section_name TEXT NOT NULL,

  -- Passage content
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  passage_type TEXT NOT NULL, -- 'narrative' | 'informational' | 'persuasive'
  word_count INTEGER NOT NULL,

  -- Metadata
  difficulty INTEGER NOT NULL, -- 1-3 for selective, 1-6 for NAPLAN
  australian_context BOOLEAN DEFAULT false,

  -- V2 Enhancements (new fields)
  sub_skill TEXT, -- Which sub-skill this passage targets
  curriculum_source TEXT, -- Reference to curriculumData v2
  generation_method TEXT DEFAULT 'pattern-based', -- 'pattern-based', 'example-inspired'
  quality_score INTEGER, -- 0-100 quality rating
  validated_by TEXT, -- 'claude-v2-validator', 'manual'

  -- Tracking
  generation_metadata JSONB DEFAULT '{}'::jsonb,
  validation_metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT passages_v2_difficulty_check CHECK (difficulty >= 1 AND difficulty <= 6),
  CONSTRAINT passages_v2_quality_score_check CHECK (quality_score IS NULL OR (quality_score >= 0 AND quality_score <= 100)),
  CONSTRAINT passages_v2_word_count_check CHECK (word_count > 0)
);

-- Indexes for efficient queries
CREATE INDEX idx_passages_v2_test_section ON passages_v2(test_type, section_name);
CREATE INDEX idx_passages_v2_difficulty ON passages_v2(difficulty);
CREATE INDEX idx_passages_v2_quality ON passages_v2(quality_score) WHERE quality_score IS NOT NULL;
CREATE INDEX idx_passages_v2_created ON passages_v2(created_at DESC);
CREATE INDEX idx_passages_v2_sub_skill ON passages_v2(sub_skill) WHERE sub_skill IS NOT NULL;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_passages_v2_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER passages_v2_updated_at_trigger
  BEFORE UPDATE ON passages_v2
  FOR EACH ROW
  EXECUTE FUNCTION update_passages_v2_updated_at();

-- Comment
COMMENT ON TABLE passages_v2 IS 'V2 passages table using curriculumData v2 - pattern-based generation with enhanced quality tracking';

-- ============================================================================
-- 2. CREATE QUESTIONS_V2 TABLE
-- ============================================================================
-- Enhanced questions table with quality tracking, error rates, and curriculum linking

CREATE TABLE IF NOT EXISTS questions_v2 (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Test identification
  test_type TEXT NOT NULL,
  test_mode TEXT NOT NULL, -- 'practice_1', 'practice_2', 'drill', 'diagnostic'
  section_name TEXT NOT NULL,
  sub_skill TEXT NOT NULL,
  sub_skill_id UUID, -- Optional FK to sub_skills table (can be null)

  -- Question content
  question_text TEXT NOT NULL,
  answer_options TEXT[], -- NULL for extended_response
  correct_answer TEXT, -- NULL for extended_response
  solution TEXT NOT NULL,
  response_type TEXT NOT NULL, -- 'multiple_choice' | 'extended_response'

  -- Difficulty & scoring
  difficulty INTEGER NOT NULL,
  max_points INTEGER NOT NULL DEFAULT 1,

  -- Visual content
  has_visual BOOLEAN DEFAULT false,
  visual_type TEXT, -- 'SVG' | 'HTML' | 'Image Generation' | NULL
  visual_data JSONB,
  visual_svg TEXT,

  -- Passage linking (for reading comprehension)
  passage_id UUID REFERENCES passages_v2(id) ON DELETE SET NULL,

  -- Metadata
  year_level INTEGER NOT NULL,
  product_type TEXT NOT NULL,
  question_order INTEGER, -- Position within test
  australian_context BOOLEAN DEFAULT false,

  -- V2 Enhancements (new fields)
  curriculum_source TEXT, -- Reference to curriculumData v2 (e.g., "EduTest - Verbal Reasoning - Analogies")
  generation_method TEXT DEFAULT 'pattern-based', -- 'pattern-based', 'example-inspired'
  quality_score INTEGER, -- 0-100 quality rating from validation
  validated_by TEXT, -- 'claude-v2-validator', 'distractor-checked', 'manual'
  error_rate NUMERIC(5,2), -- Track real-world error rate (updated by feedback)

  -- Generation tracking
  generated_by TEXT DEFAULT 'claude-sonnet-4-v2',
  curriculum_aligned BOOLEAN DEFAULT true,
  generation_metadata JSONB DEFAULT '{}'::jsonb,
  validation_metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT questions_v2_difficulty_check CHECK (difficulty >= 1 AND difficulty <= 6),
  CONSTRAINT questions_v2_response_type_check CHECK (response_type IN ('multiple_choice', 'extended_response')),
  CONSTRAINT questions_v2_quality_score_check CHECK (quality_score IS NULL OR (quality_score >= 0 AND quality_score <= 100)),
  CONSTRAINT questions_v2_error_rate_check CHECK (error_rate IS NULL OR (error_rate >= 0 AND error_rate <= 100)),
  CONSTRAINT questions_v2_max_points_check CHECK (max_points > 0),

  -- Multiple choice must have answer_options and correct_answer
  CONSTRAINT questions_v2_mc_check CHECK (
    (response_type = 'multiple_choice' AND answer_options IS NOT NULL AND correct_answer IS NOT NULL)
    OR
    (response_type = 'extended_response')
  )
);

-- Indexes for efficient queries
CREATE INDEX idx_questions_v2_test_section ON questions_v2(test_type, section_name);
CREATE INDEX idx_questions_v2_sub_skill ON questions_v2(sub_skill);
CREATE INDEX idx_questions_v2_difficulty ON questions_v2(difficulty);
CREATE INDEX idx_questions_v2_test_mode ON questions_v2(test_mode);
CREATE INDEX idx_questions_v2_passage ON questions_v2(passage_id) WHERE passage_id IS NOT NULL;
CREATE INDEX idx_questions_v2_quality ON questions_v2(quality_score) WHERE quality_score IS NOT NULL;
CREATE INDEX idx_questions_v2_error_rate ON questions_v2(error_rate) WHERE error_rate IS NOT NULL;
CREATE INDEX idx_questions_v2_created ON questions_v2(created_at DESC);
CREATE INDEX idx_questions_v2_product ON questions_v2(product_type);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_questions_v2_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER questions_v2_updated_at_trigger
  BEFORE UPDATE ON questions_v2
  FOR EACH ROW
  EXECUTE FUNCTION update_questions_v2_updated_at();

-- Comment
COMMENT ON TABLE questions_v2 IS 'V2 questions table using curriculumData v2 - pattern-based generation with enhanced quality tracking and error rate monitoring';

-- ============================================================================
-- 3. CREATE SUB_SKILLS_V2 TABLE (OPTIONAL)
-- ============================================================================
-- Enhanced sub-skills reference table linked to curriculumData v2

CREATE TABLE IF NOT EXISTS sub_skills_v2 (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identification
  test_type TEXT NOT NULL,
  section_name TEXT NOT NULL,
  sub_skill_name TEXT NOT NULL,

  -- CurriculumData v2 reference
  curriculum_key TEXT NOT NULL, -- e.g., "EduTest Scholarship (Year 7 Entry) - Verbal Reasoning"

  -- Metadata from curriculumData
  description TEXT,
  visual_required BOOLEAN DEFAULT false,
  image_type TEXT, -- 'SVG' | 'HTML' | 'Image Generation' | NULL
  llm_appropriate BOOLEAN DEFAULT true,
  difficulty_range INTEGER[] DEFAULT ARRAY[1,2,3], -- e.g., [1,2,3] or [1,2,3,4,5,6]

  -- Statistics
  total_examples INTEGER DEFAULT 0, -- Count from curriculumData v2
  generated_questions INTEGER DEFAULT 0, -- Count from questions_v2

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint
  CONSTRAINT sub_skills_v2_unique UNIQUE (test_type, section_name, sub_skill_name)
);

-- Indexes
CREATE INDEX idx_sub_skills_v2_test ON sub_skills_v2(test_type);
CREATE INDEX idx_sub_skills_v2_section ON sub_skills_v2(section_name);
CREATE INDEX idx_sub_skills_v2_curriculum ON sub_skills_v2(curriculum_key);

-- Comment
COMMENT ON TABLE sub_skills_v2 IS 'V2 sub-skills reference table linked to curriculumData v2 for tracking and statistics';

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- Match existing patterns from v1 tables

-- Enable RLS
ALTER TABLE passages_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_skills_v2 ENABLE ROW LEVEL SECURITY;

-- Public read access for authenticated users
CREATE POLICY "Public read access on passages_v2"
  ON passages_v2 FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Public read access on questions_v2"
  ON questions_v2 FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Public read access on sub_skills_v2"
  ON sub_skills_v2 FOR SELECT
  TO authenticated
  USING (true);

-- Service role full access (for generation scripts)
CREATE POLICY "Service role full access on passages_v2"
  ON passages_v2 FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on questions_v2"
  ON questions_v2 FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on sub_skills_v2"
  ON sub_skills_v2 FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 5. HELPER FUNCTIONS
-- ============================================================================

-- Function to get question statistics
CREATE OR REPLACE FUNCTION get_questions_v2_stats(
  p_test_type TEXT DEFAULT NULL,
  p_section_name TEXT DEFAULT NULL
)
RETURNS TABLE (
  test_type TEXT,
  section_name TEXT,
  total_questions BIGINT,
  avg_quality_score NUMERIC,
  avg_error_rate NUMERIC,
  high_quality_count BIGINT,
  low_quality_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    q.test_type,
    q.section_name,
    COUNT(*) as total_questions,
    AVG(q.quality_score) as avg_quality_score,
    AVG(q.error_rate) as avg_error_rate,
    COUNT(*) FILTER (WHERE q.quality_score >= 90) as high_quality_count,
    COUNT(*) FILTER (WHERE q.quality_score < 70) as low_quality_count
  FROM questions_v2 q
  WHERE (p_test_type IS NULL OR q.test_type = p_test_type)
    AND (p_section_name IS NULL OR q.section_name = p_section_name)
  GROUP BY q.test_type, q.section_name
  ORDER BY q.test_type, q.section_name;
END;
$$ LANGUAGE plpgsql;

-- Function to get generation progress
CREATE OR REPLACE FUNCTION get_generation_progress_v2(
  p_test_type TEXT,
  p_test_mode TEXT
)
RETURNS TABLE (
  section_name TEXT,
  sub_skill TEXT,
  total_questions BIGINT,
  difficulty_distribution JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    q.section_name,
    q.sub_skill,
    COUNT(*) as total_questions,
    jsonb_object_agg(q.difficulty::text, count) as difficulty_distribution
  FROM questions_v2 q,
       LATERAL (SELECT COUNT(*) FROM questions_v2 WHERE test_type = q.test_type AND section_name = q.section_name AND sub_skill = q.sub_skill AND difficulty = q.difficulty) AS count_table(count)
  WHERE q.test_type = p_test_type
    AND q.test_mode = p_test_mode
  GROUP BY q.section_name, q.sub_skill
  ORDER BY q.section_name, q.sub_skill;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. GRANTS
-- ============================================================================

-- Grant access to authenticated users
GRANT SELECT ON passages_v2 TO authenticated;
GRANT SELECT ON questions_v2 TO authenticated;
GRANT SELECT ON sub_skills_v2 TO authenticated;

-- Grant full access to service role
GRANT ALL ON passages_v2 TO service_role;
GRANT ALL ON questions_v2 TO service_role;
GRANT ALL ON sub_skills_v2 TO service_role;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION get_questions_v2_stats TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_generation_progress_v2 TO authenticated, service_role;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ V2 tables created successfully!';
  RAISE NOTICE '   - passages_v2';
  RAISE NOTICE '   - questions_v2';
  RAISE NOTICE '   - sub_skills_v2';
  RAISE NOTICE '';
  RAISE NOTICE '📊 V1 tables remain intact for existing customers';
  RAISE NOTICE '🚀 Ready to build v2 engine with curriculumData v2 integration';
END $$;
