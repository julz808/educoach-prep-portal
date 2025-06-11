-- Add difficulty column to passages table
ALTER TABLE passages 
ADD COLUMN IF NOT EXISTS difficulty INTEGER DEFAULT 2 CHECK (difficulty >= 1 AND difficulty <= 3);

-- Update any existing passages to have default difficulty of 2 (medium)
UPDATE passages 
SET difficulty = 2 
WHERE difficulty IS NULL; 