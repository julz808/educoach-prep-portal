-- Fix RLS policies for questions table to allow INSERT and UPDATE operations
-- This is needed for the diagnostic test generation to store questions

-- Add policy to allow authenticated users to insert questions
CREATE POLICY "Authenticated users can insert questions" ON questions FOR INSERT 
WITH CHECK (true);

-- Add policy to allow authenticated users to update questions
CREATE POLICY "Authenticated users can update questions" ON questions FOR UPDATE 
USING (true);

-- Add policy to allow public insert for test/demo purposes (can be removed in production)
CREATE POLICY "Public can insert questions for testing" ON questions FOR INSERT 
WITH CHECK (true);

-- Add similar policies for passages table to support reading comprehension questions
CREATE POLICY "Authenticated users can insert passages" ON passages FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update passages" ON passages FOR UPDATE 
USING (true);

-- Add similar policies for test_structure_compliance table
CREATE POLICY "Authenticated users can insert compliance records" ON test_structure_compliance FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update compliance records" ON test_structure_compliance FOR UPDATE 
USING (true);

-- Add public insert policy for demo purposes
CREATE POLICY "Public can insert compliance records for testing" ON test_structure_compliance FOR INSERT 
WITH CHECK (true); 