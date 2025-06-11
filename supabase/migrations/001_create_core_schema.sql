-- EduCourse Core Database Schema
-- Based on PRD and Question Generation Implementation Guide

-- Enable RLS and create necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User product access management
CREATE TABLE user_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_type VARCHAR NOT NULL, -- 'Year_5_NAPLAN', 'Year_7_NAPLAN', 'ACER_Year_6', 'EduTest_Year_6', 'NSW_Selective_Year_6', 'VIC_Selective_Year_8'
    purchased_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    stripe_subscription_id VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Reading comprehension passages
CREATE TABLE passages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_type VARCHAR NOT NULL,
    year_level INTEGER NOT NULL,
    section_name VARCHAR NOT NULL, -- 'Reading', 'Reading_Comprehension'
    title VARCHAR NOT NULL,
    content TEXT NOT NULL,
    passage_type VARCHAR NOT NULL, -- 'narrative', 'informational', 'persuasive'
    word_count INTEGER,
    difficulty INTEGER DEFAULT 2 CHECK (difficulty >= 1 AND difficulty <= 3), -- 1=easy, 2=medium, 3=hard
    australian_context BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Core questions table (curriculum-aligned)
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Test classification (exact matches from project data)
    test_type VARCHAR NOT NULL, -- 'Year_5_NAPLAN', 'Year_7_NAPLAN', 'ACER_Year_6', etc.
    year_level INTEGER NOT NULL, -- 5, 6, 7, 8
    section_name VARCHAR NOT NULL, -- 'Reading', 'Mathematics', 'Verbal_Reasoning', etc.
    sub_skill VARCHAR NOT NULL, -- Exact unified sub-skill names from mapping
    difficulty INTEGER NOT NULL CHECK (difficulty >= 1 AND difficulty <= 3), -- 1-3 scale: 1=easy, 2=medium, 3=hard
    
    -- Question grouping (for reading passages)
    passage_id UUID REFERENCES passages(id) ON DELETE SET NULL,
    question_sequence INTEGER, -- Order within passage set
    
    -- Question content
    question_text TEXT NOT NULL,
    has_visual BOOLEAN DEFAULT FALSE,
    visual_type VARCHAR, -- 'chart', 'geometry', 'pattern', null
    visual_data JSONB, -- Rendering specifications
    
    -- Answer handling (based on test structure format requirements)
    response_type VARCHAR NOT NULL CHECK (response_type IN ('multiple_choice', 'extended_response', 'short_answer')),
    answer_options JSONB, -- [{id: "A", content: "Option text"}] or null for extended response
    correct_answer VARCHAR, -- "A", "B", "C", "D" or null for extended response
    
    -- Educational content
    solution TEXT NOT NULL, -- Detailed explanation
    curriculum_aligned BOOLEAN DEFAULT TRUE, -- Australian curriculum compliance
    
    -- Quality metrics
    generated_by VARCHAR DEFAULT 'claude',
    reviewed BOOLEAN DEFAULT FALSE,
    performance_data JSONB,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Test attempts tracking
CREATE TABLE test_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_type VARCHAR NOT NULL,
    test_mode VARCHAR NOT NULL CHECK (test_mode IN ('diagnostic', 'practice', 'drill')),
    section_name VARCHAR,
    test_number INTEGER, -- For practice tests 1-5, NULL for diagnostic/drill
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    total_questions INTEGER,
    correct_answers INTEGER,
    time_spent_minutes INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Individual question responses
CREATE TABLE question_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID REFERENCES test_attempts(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    user_answer TEXT,
    is_correct BOOLEAN,
    time_spent_seconds INTEGER, -- seconds spent on this question
    created_at TIMESTAMP DEFAULT NOW()
);

-- User sub-skill progress tracking
CREATE TABLE user_sub_skill_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_type VARCHAR NOT NULL,
    sub_skill VARCHAR NOT NULL,
    questions_attempted INTEGER DEFAULT 0,
    questions_correct INTEGER DEFAULT 0,
    last_practiced TIMESTAMP,
    mastery_level DECIMAL DEFAULT 0.0 CHECK (mastery_level >= 0.0 AND mastery_level <= 1.0), -- 0.0 to 1.0
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Test structure compliance tracking
CREATE TABLE test_structure_compliance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_type VARCHAR NOT NULL,
    section_name VARCHAR NOT NULL,
    target_questions INTEGER, -- From TEST_STRUCTURES data
    generated_questions INTEGER DEFAULT 0,
    time_allocation INTEGER, -- Minutes from project data
    answer_format VARCHAR, -- From project data
    compliance_percentage DECIMAL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_user_products_user_id ON user_products(user_id);
CREATE INDEX idx_user_products_type ON user_products(product_type);
CREATE INDEX idx_questions_test_type ON questions(test_type);
CREATE INDEX idx_questions_section ON questions(section_name);
CREATE INDEX idx_questions_sub_skill ON questions(sub_skill);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
CREATE INDEX idx_questions_passage ON questions(passage_id);
CREATE INDEX idx_test_attempts_user ON test_attempts(user_id);
CREATE INDEX idx_test_attempts_mode ON test_attempts(test_mode);
CREATE INDEX idx_question_responses_attempt ON question_responses(attempt_id);
CREATE INDEX idx_question_responses_question ON question_responses(question_id);
CREATE INDEX idx_progress_user_skill ON user_sub_skill_progress(user_id, sub_skill);
CREATE INDEX idx_passages_test_type ON passages(test_type);

-- Enable Row Level Security
ALTER TABLE user_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE passages ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sub_skill_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_structure_compliance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_products
CREATE POLICY "Users can view their own products" ON user_products FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own products" ON user_products FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for test_attempts  
CREATE POLICY "Users can view their own test attempts" ON test_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own test attempts" ON test_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own test attempts" ON test_attempts FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for question_responses
CREATE POLICY "Users can view their own question responses" ON question_responses FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM test_attempts WHERE id = attempt_id)
);
CREATE POLICY "Users can insert their own question responses" ON question_responses FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM test_attempts WHERE id = attempt_id)
);

-- RLS Policies for user_sub_skill_progress
CREATE POLICY "Users can view their own progress" ON user_sub_skill_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own progress" ON user_sub_skill_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own progress" ON user_sub_skill_progress FOR UPDATE USING (auth.uid() = user_id);

-- Public read access for educational content
CREATE POLICY "Anyone can read passages" ON passages FOR SELECT USING (true);
CREATE POLICY "Anyone can read questions" ON questions FOR SELECT USING (true);
CREATE POLICY "Anyone can read test structure compliance" ON test_structure_compliance FOR SELECT USING (true);

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_user_products_updated_at BEFORE UPDATE ON user_products FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_passages_updated_at BEFORE UPDATE ON passages FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_progress_updated_at BEFORE UPDATE ON user_sub_skill_progress FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_compliance_updated_at BEFORE UPDATE ON test_structure_compliance FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column(); 