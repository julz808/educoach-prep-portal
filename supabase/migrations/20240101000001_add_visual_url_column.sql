-- Add visual_url column to questions table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'questions' AND column_name = 'visual_url'
    ) THEN
        ALTER TABLE questions ADD COLUMN visual_url TEXT;
        
        -- Add comment to describe the column
        COMMENT ON COLUMN questions.visual_url IS 'URL to the generated static image for visual questions stored in Supabase Storage';
        
        -- Create index for faster queries on visual questions
        CREATE INDEX IF NOT EXISTS idx_questions_visual_url ON questions(visual_url) WHERE visual_url IS NOT NULL;
        
        RAISE NOTICE 'Added visual_url column to questions table';
    ELSE
        RAISE NOTICE 'visual_url column already exists in questions table';
    END IF;
END $$; 