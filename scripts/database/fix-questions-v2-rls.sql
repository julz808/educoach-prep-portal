-- Fix RLS Policies for questions_v2 Table
-- This allows service role (used by question generation scripts) to insert questions

-- First, check if RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'questions_v2';

-- Drop any restrictive policies that might exist
DROP POLICY IF EXISTS "Allow service role to insert questions_v2" ON questions_v2;
DROP POLICY IF EXISTS "Allow authenticated inserts" ON questions_v2;

-- Create policy to allow service role to insert
CREATE POLICY "Allow service role full access"
ON questions_v2
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create policy to allow authenticated users to insert their own questions
CREATE POLICY "Allow authenticated users to insert"
ON questions_v2
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create policy to allow authenticated users to read all questions
CREATE POLICY "Allow authenticated users to read"
ON questions_v2
FOR SELECT
TO authenticated
USING (true);

-- Verify policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'questions_v2';
