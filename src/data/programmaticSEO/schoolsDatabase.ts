/**
 * Schools Database for Programmatic SEO
 *
 * This file contains all schools for generating school-specific landing pages.
 *
 * Current coverage:
 * - VIC Selective: 4 schools ✅
 * - NSW Selective: Coming soon
 * - ACER Scholarship: Coming soon
 * - EduTest Scholarship: Coming soon
 */

import { School } from './types';
import { vicSelectiveSchools } from './vicSelectiveSchools';
import { getFAQsForSchool } from './vicSelectiveFAQs';

// Populate FAQs for each school
const schoolsWithFAQs = vicSelectiveSchools.map(school => ({
  ...school,
  faqs: getFAQsForSchool(school.id)
}));

/**
 * Complete database of all schools
 * Sorted by marketRank (1 = highest priority)
 */
export const schools: School[] = [
  ...schoolsWithFAQs,
  // NSW Selective, ACER, EduTest schools will be added here
];

/**
 * Helper functions for querying schools
 */

/**
 * Get school by ID (slug)
 */
export const getSchoolById = (id: string): School | undefined => {
  return schools.find(school => school.id === id);
};

/**
 * Get school by product slug and school slug
 */
export const getSchoolBySlug = (productSlug: string, schoolSlug: string): School | undefined => {
  return schools.find(school =>
    school.productSlug === productSlug && school.id === schoolSlug
  );
};

/**
 * Get all schools for a specific product
 */
export const getSchoolsByProduct = (productSlug: string): School[] => {
  return schools
    .filter(school => school.productSlug === productSlug)
    .sort((a, b) => a.marketRank - b.marketRank); // Sort by market rank
};

/**
 * Get all schools for a specific test type
 */
export const getSchoolsByTestType = (testType: string): School[] => {
  return schools
    .filter(school => school.testType === testType)
    .sort((a, b) => a.marketRank - b.marketRank);
};

/**
 * Get all schools in a specific state
 */
export const getSchoolsByState = (state: 'NSW' | 'VIC'): School[] => {
  return schools
    .filter(school => school.state === state)
    .sort((a, b) => a.marketRank - b.marketRank);
};

/**
 * Get top N schools by market rank
 */
export const getTopSchools = (limit: number = 10): School[] => {
  return schools
    .sort((a, b) => a.marketRank - b.marketRank)
    .slice(0, limit);
};

/**
 * Get related schools (same test type, different school)
 */
export const getRelatedSchools = (schoolId: string, limit: number = 6): School[] => {
  const school = getSchoolById(schoolId);
  if (!school) return [];

  return schools
    .filter(s => s.testType === school.testType && s.id !== schoolId)
    .sort((a, b) => a.marketRank - b.marketRank)
    .slice(0, limit);
};

/**
 * Search schools by name
 */
export const searchSchools = (query: string): School[] => {
  const lowerQuery = query.toLowerCase();
  return schools.filter(school =>
    school.name.toLowerCase().includes(lowerQuery) ||
    school.suburb.toLowerCase().includes(lowerQuery)
  );
};

/**
 * Get statistics about the database
 */
export const getStats = () => {
  return {
    total: schools.length,
    byTestType: {
      'vic-selective': schools.filter(s => s.testType === 'vic-selective').length,
      'nsw-selective': schools.filter(s => s.testType === 'nsw-selective').length,
      'acer': schools.filter(s => s.testType === 'acer').length,
      'edutest': schools.filter(s => s.testType === 'edutest').length,
    },
    byState: {
      'NSW': schools.filter(s => s.state === 'NSW').length,
      'VIC': schools.filter(s => s.state === 'VIC').length,
    }
  };
};
