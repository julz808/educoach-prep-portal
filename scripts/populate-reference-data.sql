-- Phase 2: Data Migration - Populate Reference Tables
-- Based on CurriculumData.ts structure

-- =============================================================================
-- POPULATE TEST SECTIONS
-- =============================================================================

-- VIC Selective Entry sections (cleaned section names)
INSERT INTO test_sections (product_type, section_name, section_order, time_limit_minutes, question_count) VALUES
('vic_selective', 'Reading Reasoning', 1, 35, 50),
('vic_selective', 'Mathematics Reasoning', 2, 30, 60),
('vic_selective', 'General Ability - Verbal', 3, 30, 60),
('vic_selective', 'General Ability - Quantitative', 4, 30, 50),
('vic_selective', 'Writing', 5, 40, 2)
ON CONFLICT (product_type, section_name) DO NOTHING;

-- NAPLAN Year 5 sections (cleaned section names)
INSERT INTO test_sections (product_type, section_name, section_order, time_limit_minutes, question_count) VALUES
('naplan_yr5', 'Reading', 1, 50, 40),
('naplan_yr5', 'Writing', 2, 42, 1),
('naplan_yr5', 'Language Conventions', 3, 45, 40),
('naplan_yr5', 'Numeracy No Calculator', 4, 25, 25),
('naplan_yr5', 'Numeracy Calculator', 5, 25, 25)
ON CONFLICT (product_type, section_name) DO NOTHING;

-- NAPLAN Year 7 sections (cleaned section names)
INSERT INTO test_sections (product_type, section_name, section_order, time_limit_minutes, question_count) VALUES
('naplan_yr7', 'Reading', 1, 65, 50),
('naplan_yr7', 'Writing', 2, 42, 1),
('naplan_yr7', 'Language Conventions', 3, 45, 45),
('naplan_yr7', 'Numeracy No Calculator', 4, 30, 30),
('naplan_yr7', 'Numeracy Calculator', 5, 35, 35)
ON CONFLICT (product_type, section_name) DO NOTHING;

-- NAPLAN Year 9 sections (mapped to yr7 structure with adjustments)
INSERT INTO test_sections (product_type, section_name, section_order, time_limit_minutes, question_count) VALUES
('naplan_yr9', 'Reading', 1, 65, 50),
('naplan_yr9', 'Writing', 2, 42, 1),
('naplan_yr9', 'Language Conventions', 3, 45, 45),
('naplan_yr9', 'Numeracy No Calculator', 4, 30, 30),
('naplan_yr9', 'Numeracy Calculator', 5, 35, 35)
ON CONFLICT (product_type, section_name) DO NOTHING;

-- EduTest Scholarship sections (cleaned section names)
INSERT INTO test_sections (product_type, section_name, section_order, time_limit_minutes, question_count) VALUES
('edutest', 'Reading Comprehension', 1, 30, 50),
('edutest', 'Verbal Reasoning', 2, 30, 60),
('edutest', 'Numerical Reasoning', 3, 30, 50),
('edutest', 'Mathematics', 4, 30, 60),
('edutest', 'Written Expression', 5, 30, 2)
ON CONFLICT (product_type, section_name) DO NOTHING;

-- ACER Scholarship sections (cleaned section names)
INSERT INTO test_sections (product_type, section_name, section_order, time_limit_minutes, question_count) VALUES
('acer', 'Mathematics', 1, 47, 35),
('acer', 'Humanities', 2, 47, 35),
('acer', 'Written Expression', 3, 25, 1)
ON CONFLICT (product_type, section_name) DO NOTHING;

-- =============================================================================
-- POPULATE SUB-SKILLS
-- =============================================================================

-- VIC Selective Entry sub-skills
-- Reading Reasoning
INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Inferential Reasoning', ts.id, 'vic_selective', false
FROM test_sections ts WHERE ts.product_type = 'vic_selective' AND ts.section_name = 'Reading Reasoning'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Interpretive Comprehension', ts.id, 'vic_selective', false
FROM test_sections ts WHERE ts.product_type = 'vic_selective' AND ts.section_name = 'Reading Reasoning'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Vocabulary in Context', ts.id, 'vic_selective', false
FROM test_sections ts WHERE ts.product_type = 'vic_selective' AND ts.section_name = 'Reading Reasoning'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Text Structure Analysis', ts.id, 'vic_selective', false
FROM test_sections ts WHERE ts.product_type = 'vic_selective' AND ts.section_name = 'Reading Reasoning'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Critical Analysis & Evaluation', ts.id, 'vic_selective', false
FROM test_sections ts WHERE ts.product_type = 'vic_selective' AND ts.section_name = 'Reading Reasoning'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Integration & Synthesis', ts.id, 'vic_selective', false
FROM test_sections ts WHERE ts.product_type = 'vic_selective' AND ts.section_name = 'Reading Reasoning'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Character Analysis', ts.id, 'vic_selective', false
FROM test_sections ts WHERE ts.product_type = 'vic_selective' AND ts.section_name = 'Reading Reasoning'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Theme & Message Analysis', ts.id, 'vic_selective', false
FROM test_sections ts WHERE ts.product_type = 'vic_selective' AND ts.section_name = 'Reading Reasoning'
ON CONFLICT (name, section_id) DO NOTHING;

-- Mathematics Reasoning
INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Algebraic Reasoning', ts.id, 'vic_selective', false
FROM test_sections ts WHERE ts.product_type = 'vic_selective' AND ts.section_name = 'Mathematics Reasoning'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Geometric & Spatial Reasoning', ts.id, 'vic_selective', true
FROM test_sections ts WHERE ts.product_type = 'vic_selective' AND ts.section_name = 'Mathematics Reasoning'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Data Interpretation and Statistics', ts.id, 'vic_selective', true
FROM test_sections ts WHERE ts.product_type = 'vic_selective' AND ts.section_name = 'Mathematics Reasoning'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Numerical Operations', ts.id, 'vic_selective', false
FROM test_sections ts WHERE ts.product_type = 'vic_selective' AND ts.section_name = 'Mathematics Reasoning'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Logical Mathematical Deduction', ts.id, 'vic_selective', false
FROM test_sections ts WHERE ts.product_type = 'vic_selective' AND ts.section_name = 'Mathematics Reasoning'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Conceptual Understanding', ts.id, 'vic_selective', false
FROM test_sections ts WHERE ts.product_type = 'vic_selective' AND ts.section_name = 'Mathematics Reasoning'
ON CONFLICT (name, section_id) DO NOTHING;

-- General Ability - Verbal
INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Logical Reasoning & Deduction', ts.id, 'vic_selective', false
FROM test_sections ts WHERE ts.product_type = 'vic_selective' AND ts.section_name = 'General Ability - Verbal'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Verbal Reasoning & Analogies', ts.id, 'vic_selective', false
FROM test_sections ts WHERE ts.product_type = 'vic_selective' AND ts.section_name = 'General Ability - Verbal'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Critical Thinking & Problem-Solving', ts.id, 'vic_selective', false
FROM test_sections ts WHERE ts.product_type = 'vic_selective' AND ts.section_name = 'General Ability - Verbal'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Information Processing & Filtering', ts.id, 'vic_selective', false
FROM test_sections ts WHERE ts.product_type = 'vic_selective' AND ts.section_name = 'General Ability - Verbal'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Vocabulary in Context', ts.id, 'vic_selective', false
FROM test_sections ts WHERE ts.product_type = 'vic_selective' AND ts.section_name = 'General Ability - Verbal'
ON CONFLICT (name, section_id) DO NOTHING;

-- General Ability - Quantitative
INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Pattern Recognition & Sequences', ts.id, 'vic_selective', false
FROM test_sections ts WHERE ts.product_type = 'vic_selective' AND ts.section_name = 'General Ability - Quantitative'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Numerical Reasoning', ts.id, 'vic_selective', false
FROM test_sections ts WHERE ts.product_type = 'vic_selective' AND ts.section_name = 'General Ability - Quantitative'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Logical Reasoning & Deduction', ts.id, 'vic_selective', false
FROM test_sections ts WHERE ts.product_type = 'vic_selective' AND ts.section_name = 'General Ability - Quantitative'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Spatial Reasoning (2D & 3D)', ts.id, 'vic_selective', true
FROM test_sections ts WHERE ts.product_type = 'vic_selective' AND ts.section_name = 'General Ability - Quantitative'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Critical Thinking & Problem-Solving', ts.id, 'vic_selective', false
FROM test_sections ts WHERE ts.product_type = 'vic_selective' AND ts.section_name = 'General Ability - Quantitative'
ON CONFLICT (name, section_id) DO NOTHING;

-- Writing
INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Creative Writing', ts.id, 'vic_selective', false
FROM test_sections ts WHERE ts.product_type = 'vic_selective' AND ts.section_name = 'Writing'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Persuasive Writing', ts.id, 'vic_selective', false
FROM test_sections ts WHERE ts.product_type = 'vic_selective' AND ts.section_name = 'Writing'
ON CONFLICT (name, section_id) DO NOTHING;

-- NAPLAN Year 5 sub-skills
-- Reading
INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Literal Comprehension', ts.id, 'naplan_yr5', false
FROM test_sections ts WHERE ts.product_type = 'naplan_yr5' AND ts.section_name = 'Reading'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Inferential Reasoning', ts.id, 'naplan_yr5', false
FROM test_sections ts WHERE ts.product_type = 'naplan_yr5' AND ts.section_name = 'Reading'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Interpretive Comprehension', ts.id, 'naplan_yr5', false
FROM test_sections ts WHERE ts.product_type = 'naplan_yr5' AND ts.section_name = 'Reading'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Vocabulary in Context', ts.id, 'naplan_yr5', false
FROM test_sections ts WHERE ts.product_type = 'naplan_yr5' AND ts.section_name = 'Reading'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Text Structure Analysis', ts.id, 'naplan_yr5', false
FROM test_sections ts WHERE ts.product_type = 'naplan_yr5' AND ts.section_name = 'Reading'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Critical Analysis & Evaluation', ts.id, 'naplan_yr5', false
FROM test_sections ts WHERE ts.product_type = 'naplan_yr5' AND ts.section_name = 'Reading'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Integration & Synthesis', ts.id, 'naplan_yr5', false
FROM test_sections ts WHERE ts.product_type = 'naplan_yr5' AND ts.section_name = 'Reading'
ON CONFLICT (name, section_id) DO NOTHING;

-- Language Conventions
INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Spelling Patterns & Orthographic Knowledge', ts.id, 'naplan_yr5', false
FROM test_sections ts WHERE ts.product_type = 'naplan_yr5' AND ts.section_name = 'Language Conventions'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Grammar & Parts of Speech', ts.id, 'naplan_yr5', false
FROM test_sections ts WHERE ts.product_type = 'naplan_yr5' AND ts.section_name = 'Language Conventions'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Punctuation Usage & Application', ts.id, 'naplan_yr5', false
FROM test_sections ts WHERE ts.product_type = 'naplan_yr5' AND ts.section_name = 'Language Conventions'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Syntax & Sentence Construction', ts.id, 'naplan_yr5', false
FROM test_sections ts WHERE ts.product_type = 'naplan_yr5' AND ts.section_name = 'Language Conventions'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Vocabulary Usage & Word Choice', ts.id, 'naplan_yr5', false
FROM test_sections ts WHERE ts.product_type = 'naplan_yr5' AND ts.section_name = 'Language Conventions'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Proofreading & Error Recognition', ts.id, 'naplan_yr5', false
FROM test_sections ts WHERE ts.product_type = 'naplan_yr5' AND ts.section_name = 'Language Conventions'
ON CONFLICT (name, section_id) DO NOTHING;

-- Numeracy No Calculator
INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Number Sense & Operations', ts.id, 'naplan_yr5', false
FROM test_sections ts WHERE ts.product_type = 'naplan_yr5' AND ts.section_name = 'Numeracy No Calculator'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Algebraic Thinking & Patterns', ts.id, 'naplan_yr5', false
FROM test_sections ts WHERE ts.product_type = 'naplan_yr5' AND ts.section_name = 'Numeracy No Calculator'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Measurement Concepts', ts.id, 'naplan_yr5', false
FROM test_sections ts WHERE ts.product_type = 'naplan_yr5' AND ts.section_name = 'Numeracy No Calculator'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Geometric Reasoning', ts.id, 'naplan_yr5', true
FROM test_sections ts WHERE ts.product_type = 'naplan_yr5' AND ts.section_name = 'Numeracy No Calculator'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Data Interpretation', ts.id, 'naplan_yr5', false
FROM test_sections ts WHERE ts.product_type = 'naplan_yr5' AND ts.section_name = 'Numeracy No Calculator'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Mathematical Reasoning', ts.id, 'naplan_yr5', false
FROM test_sections ts WHERE ts.product_type = 'naplan_yr5' AND ts.section_name = 'Numeracy No Calculator'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Mental Mathematics Fluency', ts.id, 'naplan_yr5', false
FROM test_sections ts WHERE ts.product_type = 'naplan_yr5' AND ts.section_name = 'Numeracy No Calculator'
ON CONFLICT (name, section_id) DO NOTHING;

-- Numeracy Calculator  
INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Complex Number Operations', ts.id, 'naplan_yr5', false
FROM test_sections ts WHERE ts.product_type = 'naplan_yr5' AND ts.section_name = 'Numeracy Calculator'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Algebraic Problem Solving', ts.id, 'naplan_yr5', false
FROM test_sections ts WHERE ts.product_type = 'naplan_yr5' AND ts.section_name = 'Numeracy Calculator'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Advanced Measurement Applications', ts.id, 'naplan_yr5', false
FROM test_sections ts WHERE ts.product_type = 'naplan_yr5' AND ts.section_name = 'Numeracy Calculator'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Geometric Problem Solving', ts.id, 'naplan_yr5', true
FROM test_sections ts WHERE ts.product_type = 'naplan_yr5' AND ts.section_name = 'Numeracy Calculator'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Statistical Analysis', ts.id, 'naplan_yr5', true
FROM test_sections ts WHERE ts.product_type = 'naplan_yr5' AND ts.section_name = 'Numeracy Calculator'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Multi-Step Problem Solving', ts.id, 'naplan_yr5', false
FROM test_sections ts WHERE ts.product_type = 'naplan_yr5' AND ts.section_name = 'Numeracy Calculator'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Technology Integration', ts.id, 'naplan_yr5', false
FROM test_sections ts WHERE ts.product_type = 'naplan_yr5' AND ts.section_name = 'Numeracy Calculator'
ON CONFLICT (name, section_id) DO NOTHING;

-- Writing
INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Narrative Writing', ts.id, 'naplan_yr5', false
FROM test_sections ts WHERE ts.product_type = 'naplan_yr5' AND ts.section_name = 'Writing'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Persuasive Writing', ts.id, 'naplan_yr5', false
FROM test_sections ts WHERE ts.product_type = 'naplan_yr5' AND ts.section_name = 'Writing'
ON CONFLICT (name, section_id) DO NOTHING;

-- NAPLAN Year 7 sub-skills (enhanced versions)
-- Reading
INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Advanced Literal Comprehension', ts.id, 'naplan_yr7', false
FROM test_sections ts WHERE ts.product_type = 'naplan_yr7' AND ts.section_name = 'Reading'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Complex Inferential Reasoning', ts.id, 'naplan_yr7', false
FROM test_sections ts WHERE ts.product_type = 'naplan_yr7' AND ts.section_name = 'Reading'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Advanced Vocabulary Analysis', ts.id, 'naplan_yr7', false
FROM test_sections ts WHERE ts.product_type = 'naplan_yr7' AND ts.section_name = 'Reading'
ON CONFLICT (name, section_id) DO NOTHING;

-- Language Conventions
INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Advanced Spelling & Orthography', ts.id, 'naplan_yr7', false
FROM test_sections ts WHERE ts.product_type = 'naplan_yr7' AND ts.section_name = 'Language Conventions'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Sophisticated Grammar', ts.id, 'naplan_yr7', false
FROM test_sections ts WHERE ts.product_type = 'naplan_yr7' AND ts.section_name = 'Language Conventions'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Advanced Punctuation', ts.id, 'naplan_yr7', false
FROM test_sections ts WHERE ts.product_type = 'naplan_yr7' AND ts.section_name = 'Language Conventions'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Complex Syntax Analysis', ts.id, 'naplan_yr7', false
FROM test_sections ts WHERE ts.product_type = 'naplan_yr7' AND ts.section_name = 'Language Conventions'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Advanced Vocabulary & Usage', ts.id, 'naplan_yr7', false
FROM test_sections ts WHERE ts.product_type = 'naplan_yr7' AND ts.section_name = 'Language Conventions'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Advanced Editing Skills', ts.id, 'naplan_yr7', false
FROM test_sections ts WHERE ts.product_type = 'naplan_yr7' AND ts.section_name = 'Language Conventions'
ON CONFLICT (name, section_id) DO NOTHING;

-- Numeracy No Calculator
INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Advanced Number Operations', ts.id, 'naplan_yr7', false
FROM test_sections ts WHERE ts.product_type = 'naplan_yr7' AND ts.section_name = 'Numeracy No Calculator'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Algebraic Reasoning', ts.id, 'naplan_yr7', false
FROM test_sections ts WHERE ts.product_type = 'naplan_yr7' AND ts.section_name = 'Numeracy No Calculator'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Advanced Measurement', ts.id, 'naplan_yr7', false
FROM test_sections ts WHERE ts.product_type = 'naplan_yr7' AND ts.section_name = 'Numeracy No Calculator'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Geometric Analysis', ts.id, 'naplan_yr7', true
FROM test_sections ts WHERE ts.product_type = 'naplan_yr7' AND ts.section_name = 'Numeracy No Calculator'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Advanced Data Analysis', ts.id, 'naplan_yr7', true
FROM test_sections ts WHERE ts.product_type = 'naplan_yr7' AND ts.section_name = 'Numeracy No Calculator'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Mathematical Modelling', ts.id, 'naplan_yr7', false
FROM test_sections ts WHERE ts.product_type = 'naplan_yr7' AND ts.section_name = 'Numeracy No Calculator'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Logical Mathematical Thinking', ts.id, 'naplan_yr7', false
FROM test_sections ts WHERE ts.product_type = 'naplan_yr7' AND ts.section_name = 'Numeracy No Calculator'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Mental Mathematics Mastery', ts.id, 'naplan_yr7', false
FROM test_sections ts WHERE ts.product_type = 'naplan_yr7' AND ts.section_name = 'Numeracy No Calculator'
ON CONFLICT (name, section_id) DO NOTHING;

-- Numeracy Calculator
INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Complex Computational Applications', ts.id, 'naplan_yr7', false
FROM test_sections ts WHERE ts.product_type = 'naplan_yr7' AND ts.section_name = 'Numeracy Calculator'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Advanced Algebraic Problem Solving', ts.id, 'naplan_yr7', false
FROM test_sections ts WHERE ts.product_type = 'naplan_yr7' AND ts.section_name = 'Numeracy Calculator'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Sophisticated Measurement Applications', ts.id, 'naplan_yr7', false
FROM test_sections ts WHERE ts.product_type = 'naplan_yr7' AND ts.section_name = 'Numeracy Calculator'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Advanced Geometric Problem Solving', ts.id, 'naplan_yr7', true
FROM test_sections ts WHERE ts.product_type = 'naplan_yr7' AND ts.section_name = 'Numeracy Calculator'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Complex Statistical Analysis', ts.id, 'naplan_yr7', true
FROM test_sections ts WHERE ts.product_type = 'naplan_yr7' AND ts.section_name = 'Numeracy Calculator'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Multi-Variable Problem Solving', ts.id, 'naplan_yr7', false
FROM test_sections ts WHERE ts.product_type = 'naplan_yr7' AND ts.section_name = 'Numeracy Calculator'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Mathematical Modelling & Applications', ts.id, 'naplan_yr7', false
FROM test_sections ts WHERE ts.product_type = 'naplan_yr7' AND ts.section_name = 'Numeracy Calculator'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Advanced Technology Integration', ts.id, 'naplan_yr7', false
FROM test_sections ts WHERE ts.product_type = 'naplan_yr7' AND ts.section_name = 'Numeracy Calculator'
ON CONFLICT (name, section_id) DO NOTHING;

-- Writing
INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Narrative Writing', ts.id, 'naplan_yr7', false
FROM test_sections ts WHERE ts.product_type = 'naplan_yr7' AND ts.section_name = 'Writing'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Persuasive Writing', ts.id, 'naplan_yr7', false
FROM test_sections ts WHERE ts.product_type = 'naplan_yr7' AND ts.section_name = 'Writing'
ON CONFLICT (name, section_id) DO NOTHING;

-- EduTest sub-skills
-- Reading Comprehension
INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Literal Comprehension & Detail Extraction', ts.id, 'edutest', false
FROM test_sections ts WHERE ts.product_type = 'edutest' AND ts.section_name = 'Reading Comprehension'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Inferential Reasoning & Implied Meaning', ts.id, 'edutest', false
FROM test_sections ts WHERE ts.product_type = 'edutest' AND ts.section_name = 'Reading Comprehension'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Main Idea & Theme Identification', ts.id, 'edutest', false
FROM test_sections ts WHERE ts.product_type = 'edutest' AND ts.section_name = 'Reading Comprehension'
ON CONFLICT (name, section_id) DO NOTHING;

-- Verbal Reasoning
INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Analogical Reasoning & Word Relationships', ts.id, 'edutest', false
FROM test_sections ts WHERE ts.product_type = 'edutest' AND ts.section_name = 'Verbal Reasoning'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Vocabulary & Semantic Knowledge', ts.id, 'edutest', false
FROM test_sections ts WHERE ts.product_type = 'edutest' AND ts.section_name = 'Verbal Reasoning'
ON CONFLICT (name, section_id) DO NOTHING;

-- ACER sub-skills
-- Mathematics
INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Mathematical Reasoning and Logic', ts.id, 'acer', false
FROM test_sections ts WHERE ts.product_type = 'acer' AND ts.section_name = 'Mathematics'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Spatial and Geometric Reasoning', ts.id, 'acer', true
FROM test_sections ts WHERE ts.product_type = 'acer' AND ts.section_name = 'Mathematics'
ON CONFLICT (name, section_id) DO NOTHING;

-- Humanities
INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Reading Comprehension and Analysis', ts.id, 'acer', false
FROM test_sections ts WHERE ts.product_type = 'acer' AND ts.section_name = 'Humanities'
ON CONFLICT (name, section_id) DO NOTHING;

INSERT INTO sub_skills (name, section_id, product_type, visual_required) 
SELECT 'Critical Interpretation Skills', ts.id, 'acer', false
FROM test_sections ts WHERE ts.product_type = 'acer' AND ts.section_name = 'Humanities'
ON CONFLICT (name, section_id) DO NOTHING;

-- =============================================================================
-- POPULATE TEST TEMPLATES
-- =============================================================================

-- VIC Selective Entry test templates
INSERT INTO test_templates (product_type, test_mode, test_number, test_name, total_questions, time_limit_minutes) VALUES
('vic_selective', 'diagnostic', 1, 'VIC Selective Diagnostic Test', 50, 120),
('vic_selective', 'practice', 1, 'VIC Selective Practice Test 1', 222, 165),
('vic_selective', 'practice', 2, 'VIC Selective Practice Test 2', 222, 165),
('vic_selective', 'practice', 3, 'VIC Selective Practice Test 3', 222, 165),
('vic_selective', 'practice', 4, 'VIC Selective Practice Test 4', 222, 165),
('vic_selective', 'practice', 5, 'VIC Selective Practice Test 5', 222, 165)
ON CONFLICT (product_type, test_mode, test_number) DO NOTHING;

-- NAPLAN Year 5 test templates (updated to reflect total: 50 numeracy + 82 others = 132)
INSERT INTO test_templates (product_type, test_mode, test_number, test_name, total_questions, time_limit_minutes) VALUES
('naplan_yr5', 'diagnostic', 1, 'NAPLAN Year 5 Diagnostic Test', 30, 90),
('naplan_yr5', 'practice', 1, 'NAPLAN Year 5 Practice Test 1', 132, 187),
('naplan_yr5', 'practice', 2, 'NAPLAN Year 5 Practice Test 2', 132, 187),
('naplan_yr5', 'practice', 3, 'NAPLAN Year 5 Practice Test 3', 132, 187)
ON CONFLICT (product_type, test_mode, test_number) DO NOTHING;

-- NAPLAN Year 7 test templates (updated to reflect total: 65 numeracy + 96 others = 161)
INSERT INTO test_templates (product_type, test_mode, test_number, test_name, total_questions, time_limit_minutes) VALUES
('naplan_yr7', 'diagnostic', 1, 'NAPLAN Year 7 Diagnostic Test', 35, 100),
('naplan_yr7', 'practice', 1, 'NAPLAN Year 7 Practice Test 1', 161, 217),
('naplan_yr7', 'practice', 2, 'NAPLAN Year 7 Practice Test 2', 161, 217),
('naplan_yr7', 'practice', 3, 'NAPLAN Year 7 Practice Test 3', 161, 217)
ON CONFLICT (product_type, test_mode, test_number) DO NOTHING;

-- EduTest test templates
INSERT INTO test_templates (product_type, test_mode, test_number, test_name, total_questions, time_limit_minutes) VALUES
('edutest', 'diagnostic', 1, 'EduTest Diagnostic Test', 40, 100),
('edutest', 'practice', 1, 'EduTest Practice Test 1', 222, 150),
('edutest', 'practice', 2, 'EduTest Practice Test 2', 222, 150),
('edutest', 'practice', 3, 'EduTest Practice Test 3', 222, 150),
('edutest', 'practice', 4, 'EduTest Practice Test 4', 222, 150)
ON CONFLICT (product_type, test_mode, test_number) DO NOTHING;

-- ACER test templates
INSERT INTO test_templates (product_type, test_mode, test_number, test_name, total_questions, time_limit_minutes) VALUES
('acer', 'diagnostic', 1, 'ACER Diagnostic Test', 25, 90),
('acer', 'practice', 1, 'ACER Practice Test 1', 71, 119),
('acer', 'practice', 2, 'ACER Practice Test 2', 71, 119),
('acer', 'practice', 3, 'ACER Practice Test 3', 71, 119),
('acer', 'practice', 4, 'ACER Practice Test 4', 71, 119)
ON CONFLICT (product_type, test_mode, test_number) DO NOTHING; 