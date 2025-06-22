-- Add missing DELETE policy for writing_assessments
-- This was causing DeveloperTools deletion to fail with foreign key constraints

-- Policy: Users can delete their own writing assessments
CREATE POLICY "Users can delete their own writing assessments"
  ON writing_assessments FOR DELETE
  USING (auth.uid() = user_id);