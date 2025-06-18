# Naming Convention Audit Report

## Executive Summary

There are **significant naming inconsistencies** between `CurriculumData.ts` (frontend) and the database schema. The timer matching is failing because the frontend looks for section names that don't match what's stored in the database.

## Key Findings

### 1. VIC Selective Entry (Year 9 Entry) - CRITICAL ISSUE
- **CurriculumData.ts:** `"VIC Writing"`
- **Database:** `"Writing"`
- **Impact:** Timer fails to find time limits for writing section

### 2. Year 5 NAPLAN - MAJOR MISMATCHES
- **CurriculumData.ts:** `"NAPLAN Y5 Writing"`, `"NAPLAN Y5 Reading"`
- **Database:** `"Writing"`, `"Reading"`

### 3. Year 7 NAPLAN - MAJOR MISMATCHES
- **CurriculumData.ts:** All sections prefixed with `"NAPLAN Y7"`
- **Database:** Simple names without prefixes

### 4. ACER Scholarship - MAJOR MISMATCHES
- **CurriculumData.ts:** `"ACER Written Expression"`, `"ACER Mathematics"`
- **Database:** `"Written Expression"`, `"Mathematics"`

### 5. EduTest Scholarship - MAJOR MISMATCHES
- **CurriculumData.ts:** `"EduTest Mathematics"`, `"EduTest Written Expression"`
- **Database:** `"Mathematics"`, `"Written Expression"`

### 6. NSW Selective Entry - COMPLETE MISMATCH
- **CurriculumData.ts:** Custom names like `"NSW Reading"`, `"Mathematical Reasoning"`, `"Thinking Skills"`, `"NSW Writing"`
- **Database:** Generic NAPLAN-style names

## Root Cause Analysis

1. **Database was populated with simplified section names** (likely from early data generation scripts)
2. **CurriculumData.ts was created later** with more descriptive, product-specific section names
3. **No validation exists** to ensure consistency between frontend and backend
4. **Generation scripts use different naming** than CurriculumData.ts

## Authoritative Source Determination

Based on the code structure and documentation, **CurriculumData.ts should be the authoritative source** because:

1. It's explicitly labeled as "Authoritative Source of Truth" in comments
2. It contains detailed test structures with time limits, question counts, and sub-skills
3. Frontend timer logic expects these names
4. It aligns with actual test specifications

## Recommended Solution

### Option 1: Update Database to Match CurriculumData.ts (RECOMMENDED)
**Pros:**
- CurriculumData.ts remains authoritative
- Frontend timer logic works immediately
- Maintains product-specific naming conventions
- Aligns with documentation

**Cons:**
- Requires database migration
- Need to update existing questions/test_sections

### Option 2: Update CurriculumData.ts to Match Database
**Pros:**
- No database changes needed
- Existing data remains unchanged

**Cons:**
- Loses descriptive section names
- Generic names don't distinguish between test types
- Makes CurriculumData.ts no longer authoritative

## Implementation Plan (Option 1)

### Phase 1: Database Updates
1. Create migration script to update section names in:
   - `questions.section_name`
   - `test_sections.section_name`
   - `test_section_states.section_name`

### Phase 2: Code Updates
1. Update question generation scripts to use CurriculumData.ts names
2. Add validation to ensure consistency
3. Update any hardcoded section references

### Phase 3: Validation
1. Create automated tests to verify naming consistency
2. Add runtime validation in frontend components
3. Test timer functionality across all products

## Migration Script Preview

```sql
-- VIC Selective Entry
UPDATE questions SET section_name = 'VIC Writing' WHERE section_name = 'Writing' AND product_type = 'VIC Selective Entry (Year 9 Entry)';
UPDATE test_sections SET section_name = 'VIC Writing' WHERE section_name = 'Writing' AND product_type = 'VIC Selective Entry (Year 9 Entry)';

-- Year 5 NAPLAN
UPDATE questions SET section_name = 'NAPLAN Y5 Writing' WHERE section_name = 'Writing' AND product_type = 'Year 5 NAPLAN';
UPDATE questions SET section_name = 'NAPLAN Y5 Reading' WHERE section_name = 'Reading' AND product_type = 'Year 5 NAPLAN';
-- ... continue for all sections
```

## Impact Assessment

### High Priority (Immediate Fix Needed)
- **VIC Selective Entry Writing timer** - Currently broken
- **All NAPLAN tests** - Timer matching will fail
- **All Scholarship tests** - Timer matching will fail

### Medium Priority
- Question generation consistency
- Test session state management
- Analytics and reporting accuracy

### Low Priority
- Historical data consistency (can be handled gradually)

## Conclusion

The naming inconsistency is a **critical issue** affecting core functionality. **CurriculumData.ts should remain the authoritative source**, and the database should be updated to match. This requires careful migration but will ensure long-term consistency and maintainability.

The VIC Selective Entry writing timer issue is just the tip of the iceberg - this affects all products and will cause failures across the entire platform as more features are implemented.