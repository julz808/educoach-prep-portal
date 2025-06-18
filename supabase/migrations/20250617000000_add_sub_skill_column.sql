-- Add sub_skill column to questions table and populate it from sub_skills table
-- This will provide the actual sub-skill names directly in the questions table for easier access

-- Step 1: Add the sub_skill column to questions table
ALTER TABLE public.questions 
ADD COLUMN sub_skill text;

-- Step 2: Update the sub_skill column with names from the sub_skills table
UPDATE public.questions 
SET sub_skill = sub_skills.name
FROM public.sub_skills 
WHERE questions.sub_skill_id = sub_skills.id;

-- Step 3: Add comment to clarify the column purpose
COMMENT ON COLUMN public.questions.sub_skill IS 'Sub-skill name populated from sub_skills.name based on sub_skill_id. This provides direct access to sub-skill names for drill organization.';

-- Step 4: Create index for better performance on sub_skill queries
CREATE INDEX IF NOT EXISTS idx_questions_sub_skill ON public.questions(sub_skill);

-- Step 5: Optional - Create a trigger to keep sub_skill in sync when sub_skill_id changes
-- This ensures the sub_skill column stays updated if sub_skill_id is modified
CREATE OR REPLACE FUNCTION update_question_sub_skill()
RETURNS TRIGGER AS $$
BEGIN
    -- Update sub_skill when sub_skill_id changes
    IF NEW.sub_skill_id IS DISTINCT FROM OLD.sub_skill_id THEN
        SELECT name INTO NEW.sub_skill 
        FROM public.sub_skills 
        WHERE id = NEW.sub_skill_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update sub_skill when sub_skill_id changes
DROP TRIGGER IF EXISTS trigger_update_question_sub_skill ON public.questions;
CREATE TRIGGER trigger_update_question_sub_skill
    BEFORE UPDATE ON public.questions
    FOR EACH ROW
    EXECUTE FUNCTION update_question_sub_skill();