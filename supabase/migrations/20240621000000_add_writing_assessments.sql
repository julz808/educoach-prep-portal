-- Migration: Add writing assessments table for AI scoring of writing tasks
-- This table stores detailed assessment results from Claude API

CREATE TABLE writing_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  session_id UUID REFERENCES user_test_sessions(id) NOT NULL,
  question_id UUID REFERENCES questions(id) NOT NULL,
  
  -- Assessment Metadata
  product_type TEXT NOT NULL,
  writing_genre TEXT NOT NULL,
  rubric_used JSONB NOT NULL,
  
  -- User Response
  user_response TEXT NOT NULL,
  word_count INTEGER,
  
  -- AI Scoring Results
  total_score INTEGER NOT NULL,
  max_possible_score INTEGER NOT NULL,
  percentage_score DECIMAL(5,2) NOT NULL,
  
  -- Individual Criterion Scores (JSONB for flexibility)
  criterion_scores JSONB NOT NULL, -- {criterionName: {score: X, maxMarks: Y, feedback: "..."}}
  
  -- Overall Feedback
  overall_feedback TEXT NOT NULL,
  strengths JSONB, -- Array of strength points
  improvements JSONB, -- Array of improvement suggestions
  
  -- AI Processing Metadata
  claude_model_version TEXT DEFAULT 'claude-sonnet-4-20250514',
  processing_time_ms INTEGER,
  prompt_tokens INTEGER,
  response_tokens INTEGER,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_writing_assessments_user_session ON writing_assessments(user_id, session_id);
CREATE INDEX idx_writing_assessments_question ON writing_assessments(question_id);
CREATE INDEX idx_writing_assessments_product_genre ON writing_assessments(product_type, writing_genre);
CREATE INDEX idx_writing_assessments_created_at ON writing_assessments(created_at);

-- Add writing prompt field to questions table if it doesn't exist
ALTER TABLE questions ADD COLUMN IF NOT EXISTS writing_prompt TEXT;

-- Row Level Security (RLS)
ALTER TABLE writing_assessments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own writing assessments
CREATE POLICY "Users can view their own writing assessments"
  ON writing_assessments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own writing assessments"
  ON writing_assessments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own writing assessments"
  ON writing_assessments FOR UPDATE
  USING (auth.uid() = user_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_writing_assessments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_writing_assessments_updated_at
  BEFORE UPDATE ON writing_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_writing_assessments_updated_at();

-- Add comment for documentation
COMMENT ON TABLE writing_assessments IS 'Stores AI-powered assessments of student writing responses using Claude API';
COMMENT ON COLUMN writing_assessments.criterion_scores IS 'JSONB object containing detailed scores and feedback for each assessment criterion';
COMMENT ON COLUMN writing_assessments.rubric_used IS 'JSONB snapshot of the rubric used for assessment to maintain historical accuracy';