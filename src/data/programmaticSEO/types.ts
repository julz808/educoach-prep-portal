/**
 * TypeScript types for Programmatic SEO School Database
 *
 * These types define the structure of school data used to generate
 * school-specific landing pages for SEO and Answer Engine Optimization (AEO)
 */

export type State = 'NSW' | 'VIC';

export type TestType = 'edutest' | 'acer' | 'nsw-selective' | 'vic-selective';

export type ProductSlug = 'edutest-scholarship' | 'acer-scholarship' | 'nsw-selective' | 'vic-selective';

export type Gender = 'co-ed' | 'boys' | 'girls';

export type SchoolType = 'government-selective' | 'independent' | 'catholic';

export type FAQCategory = 'dates' | 'requirements' | 'preparation' | 'results' | 'general';

/**
 * FAQ for a specific school
 * Designed for Answer Engine Optimization (AEO) - factual, direct answers
 */
export interface SchoolFAQ {
  question: string;              // Direct question parents ask
  answer: string;                // Factual, citation-worthy answer (no fluff)
  category: FAQCategory;
  citationUrl?: string;          // Optional: Link to official source
}

/**
 * Test date information for a school
 */
export interface TestDates {
  year: 2026 | 2027;             // Year of test (may be year before entry)
  applicationOpen: string;       // ISO date: "2026-04-01"
  applicationClose: string;      // ISO date: "2026-05-15"
  testDate: string;              // ISO date: "2026-06-14"
  resultsDate: string;           // ISO date: "2026-09-10"
  interviewRequired: boolean;
}

/**
 * Complete school data for programmatic SEO page generation
 */
export interface School {
  // ===== IDENTITY =====
  id: string;                    // URL slug: "melbourne-high-school"
  name: string;                  // Official school name: "Melbourne High School"
  state: State;
  suburb: string;                // Suburb/Location

  // ===== TEST MAPPING =====
  testType: TestType;
  productSlug: ProductSlug;
  entryYears: number[];          // [9] or [7, 8, 9]

  // ===== SCHOOL DETAILS =====
  gender: Gender;
  schoolType: SchoolType;
  websiteUrl: string;
  icsea?: number;                // Optional: 500-1300 range
  totalEnrollment?: number;      // Optional: total students across all years

  // ===== TEST DATES =====
  testDates: TestDates;

  // ===== MARKET SIZING =====
  placesOffered?: number;        // Annual intake for entry year
  estimatedApplicants?: number;  // Estimated annual applicants
  acceptanceRate?: number;       // Percentage: 7.5 = 7.5%
  marketRank: number;            // 1 = largest market, 2 = second, etc.

  // ===== AEO CONTENT =====
  faqs: SchoolFAQ[];
  keyFacts: string[];            // Bullet points for key facts block

  // ===== SEO METADATA =====
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
}

/**
 * Utility type for CSV import
 */
export interface SchoolCSVRow {
  'School Name': string;
  'State': string;
  'Suburb': string;
  'Test Type': string;
  'Entry Years': string;
  'Gender': string;
  'School Type': string;
  'Total Enrollment': string;
  'Places Offered': string;
  'Est. Applicants': string;
  'ICSEA': string;
  'Acceptance Rate': string;
  'Website URL': string;
  '2026/2027': string;
  'App Open Date': string;
  'App Close Date': string;
  'Test Date': string;
  'Results Date': string;
  'Interview Required': string;
  'Scholarship Type': string;
  'Notes': string;
  'Market Rank': string;
}
