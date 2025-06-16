-- Add missing get_diagnostic_progress function
-- This function is referenced in TypeScript but missing from database

CREATE OR REPLACE FUNCTION get_diagnostic_progress(
  p_user_id UUID,
  p_product_type TEXT
)
RETURNS TABLE (
  section_name TEXT,
  status TEXT,
  questions_completed INTEGER,
  total_questions INTEGER,
  session_id UUID,
  last_updated TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(tss.section_name, uts.section_name) as section_name,
    CASE 
      WHEN uts.status = 'completed' THEN 'completed'
      WHEN uts.status IN ('active', 'paused') THEN 'in-progress'
      ELSE 'not-started'
    END as status,
    COALESCE(uts.questions_answered, 0) as questions_completed,
    COALESCE(uts.total_questions, 0) as total_questions,
    uts.id as session_id,
    COALESCE(tss.last_updated, uts.updated_at, uts.created_at) as last_updated
  FROM user_test_sessions uts
  LEFT JOIN test_section_states tss ON tss.test_session_id = uts.id
  WHERE uts.user_id = p_user_id
    AND uts.product_type = p_product_type
    AND uts.test_mode = 'diagnostic'
  ORDER BY uts.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_diagnostic_progress(UUID, TEXT) TO authenticated;