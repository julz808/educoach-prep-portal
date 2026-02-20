// EduCourse Curriculum Data V2 - Main Export
// Created: February 3, 2026

// ============================================
// EXPORTS - Types and Test Structures
// ============================================

export * from './types';

// ============================================
// EXPORTS - Individual Test Type Data
// ============================================

export { EDUTEST_SUB_SKILLS } from './edutest';
export { ACER_SUB_SKILLS } from './acer';
export { NSW_SELECTIVE_SUB_SKILLS } from './nsw-selective';
export { VIC_SELECTIVE_SUB_SKILLS } from './vic-selective';
export { NAPLAN_YEAR5_SUB_SKILLS } from './naplan-year5';
export { NAPLAN_YEAR7_SUB_SKILLS } from './naplan-year7';

// ============================================
// EXPORTS - Section-Level Configurations
// ============================================

export {
  SECTION_CONFIGURATIONS,
  getSectionConfig,
  calculateBalancedDistribution
} from './sectionConfigurations';

// ============================================
// COMBINED EXPORT - For Backward Compatibility
// ============================================

import { EDUTEST_SUB_SKILLS } from './edutest';
import { ACER_SUB_SKILLS } from './acer';
import { NSW_SELECTIVE_SUB_SKILLS } from './nsw-selective';
import { VIC_SELECTIVE_SUB_SKILLS } from './vic-selective';
import { NAPLAN_YEAR5_SUB_SKILLS } from './naplan-year5';
import { NAPLAN_YEAR7_SUB_SKILLS } from './naplan-year7';
import type { SubSkillExamplesDatabase } from './types';

/**
 * Combined database of all test types
 *
 * Use this for accessing all curriculum data at once, or import individual
 * test type modules for better performance and code splitting.
 *
 * @example
 * // Import everything
 * import { SUB_SKILL_EXAMPLES } from '@/data/curriculumData_v2';
 *
 * @example
 * // Import specific test type
 * import { EDUTEST_SUB_SKILLS } from '@/data/curriculumData_v2/edutest';
 */
export const SUB_SKILL_EXAMPLES: SubSkillExamplesDatabase = {
  ...EDUTEST_SUB_SKILLS,
  ...ACER_SUB_SKILLS,
  ...NSW_SELECTIVE_SUB_SKILLS,
  ...VIC_SELECTIVE_SUB_SKILLS,
  ...NAPLAN_YEAR5_SUB_SKILLS,
  ...NAPLAN_YEAR7_SUB_SKILLS,
} as const;

// Export type for use in generation engine
export type CurriculumDatabase = typeof SUB_SKILL_EXAMPLES;

// ============================================
// USAGE GUIDE
// ============================================

/**
 * ## Import Patterns
 *
 * ### 1. Import Everything (simple but larger bundle)
 * ```typescript
 * import { SUB_SKILL_EXAMPLES, TEST_STRUCTURES } from '@/data/curriculumData_v2';
 * ```
 *
 * ### 2. Import Specific Test Type (recommended for performance)
 * ```typescript
 * import { EDUTEST_SUB_SKILLS } from '@/data/curriculumData_v2/edutest';
 * import { TEST_STRUCTURES } from '@/data/curriculumData_v2';
 * ```
 *
 * ### 3. Import Only Types (for type checking)
 * ```typescript
 * import type { SubSkillExample, SubSkillPattern } from '@/data/curriculumData_v2';
 * ```
 *
 * ## File Organization
 *
 * - `types.ts` - Shared TypeScript interfaces and TEST_STRUCTURES constant
 * - `edutest.ts` - EduTest Scholarship (COMPLETE - 103 examples)
 * - `acer.ts` - ACER Scholarship (COMPLETE - 40 examples)
 * - `nsw-selective.ts` - NSW Selective Entry (PLACEHOLDER)
 * - `vic-selective.ts` - VIC Selective Entry (PLACEHOLDER)
 * - `naplan-year5.ts` - Year 5 NAPLAN (PLACEHOLDER)
 * - `naplan-year7.ts` - Year 7 NAPLAN (PLACEHOLDER)
 * - `index.ts` - This file, exports everything
 *
 * ## Population Status
 *
 * ✅ **EduTest** - Complete with 4 sections, 22 sub-skills, 103 examples
 * ✅ **ACER** - Complete with 3 sections, 18 sub-skills, 40 examples
 * 📝 **NSW Selective** - Placeholder, ready for population
 * 📝 **VIC Selective** - Placeholder, ready for population
 * 📝 **NAPLAN Year 5** - Placeholder, ready for population
 * 📝 **NAPLAN Year 7** - Placeholder, ready for population
 */
