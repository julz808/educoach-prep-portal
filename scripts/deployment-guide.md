# EduCoach Performance Tracking Deployment Guide

## Overview
This guide outlines the step-by-step process to deploy the new performance tracking system to production.

## Prerequisites
- Supabase CLI installed and configured
- Production database access
- Admin privileges on the database

## Deployment Steps

### Phase 1: Deploy Database Schema
Execute the performance tracking schema deployment:

```bash
# Connect to production database (adjust connection string as needed)
psql "postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres" -f scripts/deploy-performance-tracking.sql
```

**What this script does:**
- Creates new tables: `test_sections`, `sub_skills`, `test_templates`, etc.
- Adds new columns to existing tables (`questions`, `test_attempts`)
- Creates indexes for performance optimization
- Sets up Row Level Security policies
- Creates RPC functions for atomic operations

### Phase 2: Populate Reference Data
Execute the data migration to populate lookup tables:

```bash
# Populate test sections, sub-skills, and test templates
psql "postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres" -f scripts/populate-reference-data.sql
```

**What this script does:**
- Populates `test_sections` with all product sections
- Populates `sub_skills` with curriculum-aligned skills
- Creates `test_templates` for diagnostic and practice tests
- Uses `ON CONFLICT DO NOTHING` to prevent duplicate data

### Phase 3: Verification
After deployment, verify the data integrity:

```sql
-- Check test sections
SELECT product_type, COUNT(*) as section_count 
FROM test_sections 
GROUP BY product_type;

-- Check sub-skills
SELECT ts.product_type, COUNT(ss.*) as subskill_count
FROM test_sections ts
LEFT JOIN sub_skills ss ON ss.section_id = ts.id
GROUP BY ts.product_type;

-- Check test templates
SELECT product_type, test_mode, COUNT(*) as template_count
FROM test_templates
GROUP BY product_type, test_mode
ORDER BY product_type, test_mode;

-- Verify RPC functions exist
SELECT proname FROM pg_proc WHERE proname LIKE 'record_question_response';
```

## Expected Results

### Test Sections Count by Product:
- `vic_selective`: 5 sections
- `naplan_yr5`: 4 sections  
- `naplan_yr7`: 4 sections
- `naplan_yr9`: 4 sections
- `edutest`: 5 sections
- `acer`: 3 sections

### Sub-Skills Count by Product:
- `vic_selective`: ~15 sub-skills
- `naplan_yr5`: ~10 sub-skills
- `naplan_yr7`: ~3 sub-skills (sample)
- `edutest`: ~5 sub-skills (sample)
- `acer`: ~4 sub-skills

### Test Templates:
- Each product has 1 diagnostic test
- Practice test counts vary by product (3-5 tests)

## Rollback Plan
If issues occur, you can rollback using:

```sql
-- Drop new tables (in reverse dependency order)
DROP TABLE IF EXISTS user_sub_skill_performance CASCADE;
DROP TABLE IF EXISTS user_question_responses CASCADE;
DROP TABLE IF EXISTS user_progress CASCADE;
DROP TABLE IF EXISTS test_templates CASCADE;
DROP TABLE IF EXISTS sub_skills CASCADE;
DROP TABLE IF EXISTS test_sections CASCADE;

-- Remove added columns (if needed)
ALTER TABLE questions DROP COLUMN IF EXISTS sub_skill_id;
ALTER TABLE questions DROP COLUMN IF EXISTS product_type;
ALTER TABLE questions DROP COLUMN IF EXISTS explanation;
-- etc.
```

## Post-Deployment Tasks

1. **Update Frontend Services**: Ensure all TypeScript types align with new schema
2. **Test Question Assignment**: Verify questions can be properly assigned to sub-skills
3. **Performance Monitoring**: Monitor query performance with new indexes
4. **User Testing**: Test the complete user flow from diagnostic to practice tests

## Troubleshooting

### Common Issues:
1. **Foreign key violations**: Ensure questions table has valid `sub_skill_id` references
2. **RLS policy conflicts**: Check existing policies don't conflict with new ones
3. **Index creation timeouts**: Large tables may require maintenance windows

### Debug Commands:
```sql
-- Check for constraint violations
SELECT conname, conrelid::regclass FROM pg_constraint WHERE NOT convalidated;

-- Monitor query performance
EXPLAIN ANALYZE SELECT * FROM user_progress WHERE user_id = 'test-user';
```

## Success Criteria
- [ ] All tables created successfully
- [ ] Reference data populated correctly
- [ ] RPC functions operational
- [ ] No constraint violations
- [ ] Performance tracking queries execute under 100ms
- [ ] Frontend can fetch user progress data

---

**Note**: Always test in a staging environment before deploying to production. 