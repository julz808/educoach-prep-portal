-- Enable RLS on questions_v2 and passages_v2 if not already enabled
ALTER TABLE questions_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE passages_v2 ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON questions_v2;
DROP POLICY IF EXISTS "Enable read access for all users" ON passages_v2;

-- Create SELECT policies to allow anyone to read questions and passages
-- This matches the access pattern of the V1 tables which are publicly readable
CREATE POLICY "Enable read access for all users"
  ON questions_v2 FOR SELECT
  USING (true);

CREATE POLICY "Enable read access for all users"
  ON passages_v2 FOR SELECT
  USING (true);

-- Note: INSERT, UPDATE, DELETE policies remain restrictive
-- Only authenticated users with proper permissions can modify data
