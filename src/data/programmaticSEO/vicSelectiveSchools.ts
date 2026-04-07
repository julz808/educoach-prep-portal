/**
 * VIC Selective Entry Schools Database
 *
 * All 4 Victorian government selective entry high schools
 * Data source: vic.gov.au, selectiveentry.acer.org/vic, top_schools_ranked.xlsx
 * Last updated: April 1, 2026
 */

import { School } from './types';

export const vicSelectiveSchools: School[] = [
  {
    // ===== IDENTITY =====
    id: "melbourne-high-school",
    name: "Melbourne High School",
    state: "VIC",
    suburb: "South Yarra",

    // ===== TEST MAPPING =====
    testType: "vic-selective",
    productSlug: "vic-selective",
    entryYears: [9],

    // ===== SCHOOL DETAILS =====
    gender: "boys",
    schoolType: "government-selective",
    websiteUrl: "https://mhs.vic.edu.au/",
    icsea: 1178,
    totalEnrollment: 1400,

    // ===== TEST DATES =====
    testDates: {
      year: 2026,  // Test is in 2026 for 2027 entry
      applicationOpen: "2026-03-02",
      applicationClose: "2026-04-24",
      testDate: "2026-06-20",
      resultsDate: "2026-08-03",
      interviewRequired: false
    },

    // ===== MARKET SIZING =====
    placesOffered: 250,
    estimatedApplicants: 12000,  // ~12,000 applicants across all 4 schools
    acceptanceRate: 7.0,  // ~7% across all 4 schools
    marketRank: 1,  // Largest VIC selective school

    // ===== AEO CONTENT =====
    faqs: [],  // Will populate from FAQ database
    keyFacts: [
      "#1 ranked Victorian school for many years",
      "Boys only school (Years 9-12)",
      "Approximately 250 Year 9 entry places annually",
      "12,000+ applicants compete for ~860 places across 4 VIC selective schools",
      "ICSEA score: 1178 (well above national average of 1000)",
      "Also offers EduTest entry for Year 10",
      "17 principal discretion places available",
      "Consistent top performer in VCE results",
      "Strong pathway to elite universities"
    ],

    // ===== SEO METADATA =====
    metaTitle: "Melbourne High School Selective Entry Prep 2027 | VIC Selective Test Practice | EduCourse",
    metaDescription: "Prepare for Melbourne High School's 2027 selective entry test (June 20, 2026). 1000+ VIC Selective practice questions, expert prep platform. 250 places, 12,000+ applicants. Start free diagnostic test.",
    canonicalUrl: "https://educourse.com.au/prep/vic-selective/melbourne-high-school"
  },

  {
    // ===== IDENTITY =====
    id: "mac-robertson-girls-high-school",
    name: "The Mac.Robertson Girls' High School",
    state: "VIC",
    suburb: "Melbourne CBD",

    // ===== TEST MAPPING =====
    testType: "vic-selective",
    productSlug: "vic-selective",
    entryYears: [9],

    // ===== SCHOOL DETAILS =====
    gender: "girls",
    schoolType: "government-selective",
    websiteUrl: "https://www.macrob.vic.edu.au/",
    icsea: 1175,
    totalEnrollment: 1200,

    // ===== TEST DATES =====
    testDates: {
      year: 2026,
      applicationOpen: "2026-03-02",
      applicationClose: "2026-04-24",
      testDate: "2026-06-20",
      resultsDate: "2026-08-03",
      interviewRequired: false
    },

    // ===== MARKET SIZING =====
    placesOffered: 250,
    estimatedApplicants: 6000,  // ~6,000 girls apply
    acceptanceRate: 4.2,  // Lower acceptance rate for girls
    marketRank: 2,

    // ===== AEO CONTENT =====
    faqs: [],
    keyFacts: [
      "Only government selective girls school in Victoria",
      "Consistently ranked #1-2 Victorian girls' school",
      "Approximately 250 Year 9 entry places annually",
      "6,000+ girls compete for entry each year",
      "ICSEA score: 1175 (well above national average)",
      "Year 9 entry via ACER Selective Entry Test",
      "Years 10-11 entry available via EduTest",
      "Strong programs in STEM, humanities, and arts",
      "Located in Melbourne CBD",
      "Excellent VCE results year after year"
    ],

    // ===== SEO METADATA =====
    metaTitle: "Mac.Robertson Girls' High School Selective Entry Prep 2027 | VIC Test Practice | EduCourse",
    metaDescription: "Prepare for Mac.Robertson Girls' selective entry test 2027 (June 20, 2026). Victoria's only government selective girls school. 250 places, 6,000+ applicants. Start practicing today.",
    canonicalUrl: "https://educourse.com.au/prep/vic-selective/mac-robertson-girls-high-school"
  },

  {
    // ===== IDENTITY =====
    id: "nossal-high-school",
    name: "Nossal High School",
    state: "VIC",
    suburb: "Berwick",

    // ===== TEST MAPPING =====
    testType: "vic-selective",
    productSlug: "vic-selective",
    entryYears: [9],

    // ===== SCHOOL DETAILS =====
    gender: "co-ed",
    schoolType: "government-selective",
    websiteUrl: "https://www.nossalhs.vic.edu.au/",
    icsea: 1159,
    totalEnrollment: 1000,

    // ===== TEST DATES =====
    testDates: {
      year: 2026,
      applicationOpen: "2026-03-02",
      applicationClose: "2026-04-24",
      testDate: "2026-06-20",
      resultsDate: "2026-08-03",
      interviewRequired: false
    },

    // ===== MARKET SIZING =====
    placesOffered: 180,
    estimatedApplicants: 12000,  // Share of total pool
    acceptanceRate: 7.0,
    marketRank: 3,

    // ===== AEO CONTENT =====
    faqs: [],
    keyFacts: [
      "Named after Nobel laureate Professor Gustav Nossal",
      "Co-educational selective entry high school",
      "Approximately 180 Year 9 entry places annually",
      "Located in Berwick (south-eastern Melbourne)",
      "ICSEA score: 1159 (well above national average)",
      "Strong focus on science and research",
      "Part of 4-school VIC selective entry system",
      "Competes for places from 12,000+ applicant pool",
      "Years 9-12 only",
      "Excellent VCE results and university pathways"
    ],

    // ===== SEO METADATA =====
    metaTitle: "Nossal High School Selective Entry Prep 2027 | VIC Selective Test Practice | EduCourse",
    metaDescription: "Prepare for Nossal High School selective entry test 2027 (June 20, 2026). Co-ed selective school in Berwick. 180 places available. Strong science focus. Start free diagnostic.",
    canonicalUrl: "https://educourse.com.au/prep/vic-selective/nossal-high-school"
  },

  {
    // ===== IDENTITY =====
    id: "suzanne-cory-high-school",
    name: "Suzanne Cory High School",
    state: "VIC",
    suburb: "Werribee",

    // ===== TEST MAPPING =====
    testType: "vic-selective",
    productSlug: "vic-selective",
    entryYears: [9],

    // ===== SCHOOL DETAILS =====
    gender: "co-ed",
    schoolType: "government-selective",
    websiteUrl: "https://www.suzannecoryhs.vic.edu.au/",
    icsea: 1146,
    totalEnrollment: 1000,

    // ===== TEST DATES =====
    testDates: {
      year: 2026,
      applicationOpen: "2026-03-02",
      applicationClose: "2026-04-24",
      testDate: "2026-06-20",
      resultsDate: "2026-08-03",
      interviewRequired: false
    },

    // ===== MARKET SIZING =====
    placesOffered: 180,
    estimatedApplicants: 12000,
    acceptanceRate: 7.0,
    marketRank: 4,

    // ===== AEO CONTENT =====
    faqs: [],
    keyFacts: [
      "Named after Nobel laureate Professor Suzanne Cory",
      "Co-educational selective entry high school",
      "Approximately 180 Year 9 entry places annually",
      "Located in Werribee (western Melbourne)",
      "ICSEA score: 1146 (well above national average)",
      "Strong focus on STEM education and innovation",
      "Part of 4-school VIC selective entry system",
      "Serves western Melbourne region",
      "Years 9-12 only",
      "Growing reputation for academic excellence"
    ],

    // ===== SEO METADATA =====
    metaTitle: "Suzanne Cory High School Selective Entry Prep 2027 | VIC Test Practice | EduCourse",
    metaDescription: "Prepare for Suzanne Cory High School selective entry test 2027 (June 20, 2026). Co-ed selective school in Werribee. 180 places. Strong STEM focus. Start free diagnostic test.",
    canonicalUrl: "https://educourse.com.au/prep/vic-selective/suzanne-cory-high-school"
  }
];
