# School Database Schema

**File:** `src/data/programmaticSEO/schoolsDatabase.ts`
**Purpose:** Central database of all schools for programmatic SEO landing pages

---

## TypeScript Interfaces

### Main School Interface

```typescript
export interface School {
  // ===== IDENTITY =====
  id: string;                    // URL slug: "melbourne-high-school"
  name: string;                  // Full official name: "Melbourne High School"
  state: 'NSW' | 'VIC';
  suburb: string;                // "South Yarra"

  // ===== TEST MAPPING =====
  testType: 'edutest' | 'acer' | 'nsw-selective' | 'vic-selective';
  productSlug: 'edutest-scholarship' | 'acer-scholarship' | 'nsw-selective' | 'vic-selective';
  entryYears: number[];          // [9] or [7, 8, 9]

  // ===== SCHOOL DETAILS =====
  gender: 'co-ed' | 'boys' | 'girls';
  schoolType: 'government-selective' | 'independent' | 'catholic';
  websiteUrl: string;
  icsea?: number;                // Optional: 900-1200 typically
  totalEnrollment?: number;      // Optional: total students

  // ===== TEST DATES =====
  testDates: {
    year: 2026 | 2027;
    applicationOpen: string;     // ISO format: "2026-04-01"
    applicationClose: string;    // ISO format: "2026-05-15"
    testDate: string;            // ISO format: "2026-06-14"
    resultsDate: string;         // ISO format: "2026-09-10"
    interviewRequired: boolean;
  };

  // ===== MARKET SIZING =====
  placesOffered?: number;        // Optional: annual intake
  estimatedApplicants?: number;  // Optional: est. annual applicants
  acceptanceRate?: number;       // Optional: percentage (7.5 = 7.5%)
  marketRank: number;            // 1 = largest, 2 = second largest, etc.

  // ===== AEO CONTENT =====
  faqs: SchoolFAQ[];
  keyFacts: string[];            // Bullet points for key facts section

  // ===== SEO METADATA =====
  metaTitle: string;             // "<School> <Test> Prep 2027 | EduCourse"
  metaDescription: string;
  canonicalUrl: string;          // Full URL
}
```

### FAQ Interface

```typescript
export interface SchoolFAQ {
  question: string;              // "When is the Melbourne High test in 2027?"
  answer: string;                // Direct, factual answer (no fluff)
  category: 'dates' | 'requirements' | 'preparation' | 'results' | 'general';
  citationUrl?: string;          // Optional: Official source URL
}
```

---

## Data Validation Rules

### Required Fields
- ✅ `id` - must be unique, lowercase, hyphenated
- ✅ `name` - official school name
- ✅ `state` - NSW or VIC only
- ✅ `suburb` - cannot be empty
- ✅ `testType` - must match one of 4 types
- ✅ `productSlug` - must match test type
- ✅ `entryYears` - at least one entry year
- ✅ `gender` - must be specified
- ✅ `schoolType` - must be specified
- ✅ `websiteUrl` - must be valid URL
- ✅ `testDates.year` - 2026 or 2027
- ✅ `testDates.applicationOpen/Close/testDate/resultsDate` - valid ISO dates
- ✅ `marketRank` - positive integer
- ✅ `metaTitle` - not empty
- ✅ `metaDescription` - not empty
- ✅ `canonicalUrl` - valid URL

### Optional Fields
- `icsea` - if provided, must be 500-1300
- `totalEnrollment` - if provided, must be positive
- `placesOffered` - if provided, must be positive
- `estimatedApplicants` - if provided, must be positive
- `acceptanceRate` - if provided, must be 0-100

### Calculated Fields
- `acceptanceRate` - auto-calculate if `placesOffered` and `estimatedApplicants` provided
- `canonicalUrl` - auto-generate from `id` and `productSlug`

---

## Example Entry

```typescript
{
  // Identity
  id: "melbourne-high-school",
  name: "Melbourne High School",
  state: "VIC",
  suburb: "South Yarra",

  // Test mapping
  testType: "vic-selective",
  productSlug: "vic-selective",
  entryYears: [9],

  // School details
  gender: "boys",
  schoolType: "government-selective",
  websiteUrl: "https://www.mhs.vic.edu.au",
  icsea: 1150,
  totalEnrollment: 660,

  // Test dates (2027 entry)
  testDates: {
    year: 2026,  // Test is in 2026 for 2027 entry
    applicationOpen: "2026-05-01",
    applicationClose: "2026-05-29",
    testDate: "2026-06-14",
    resultsDate: "2026-09-08",
    interviewRequired: false
  },

  // Market sizing
  placesOffered: 300,
  estimatedApplicants: 4000,
  acceptanceRate: 7.5,  // 300/4000 * 100
  marketRank: 1,  // Largest VIC selective school

  // FAQs
  faqs: [
    {
      question: "When is the Melbourne High School test in 2027?",
      answer: "The Victorian Selective Entry Test for 2027 entry to Melbourne High School will be held on June 14, 2026. Applications open May 1, 2026 and close May 29, 2026. Results are released on September 8, 2026.",
      category: "dates",
      citationUrl: "https://www.vic.gov.au/selective-schools"
    },
    {
      question: "What score do you need to get into Melbourne High?",
      answer: "While exact cutoffs aren't published, successful applicants typically score in the Superior band (top 5%) across all test sections. Historical data suggests a minimum composite score of approximately 250/300 is needed for competitive entry.",
      category: "requirements"
    }
    // ... more FAQs
  ],

  // Key facts
  keyFacts: [
    "One of 4 Victorian selective entry high schools",
    "Accepts 300 Year 9 students annually",
    "Approximately 4,000 applicants each year (7.5% acceptance rate)",
    "All-boys government school in South Yarra",
    "Consistently ranks in top 10 VCE schools statewide"
  ],

  // SEO
  metaTitle: "Melbourne High School Selective Entry Prep 2027 | Practice Tests & Study Guide | EduCourse",
  metaDescription: "Prepare for Melbourne High School's 2027 selective entry test with 1000+ practice questions. Test date: June 14, 2026. Expert-designed prep platform trusted by 300+ families.",
  canonicalUrl: "https://educourse.com.au/prep/vic-selective/melbourne-high-school"
}
```

---

## Data Import Process

### From Perplexity CSV

1. **Export Perplexity results** as CSV
2. **Run conversion script:**
   ```bash
   npx tsx scripts/programmatic-seo/import-schools-from-csv.ts
   ```
3. **Script will:**
   - Parse CSV
   - Generate school IDs (slugify names)
   - Map test types to product slugs
   - Generate SEO metadata
   - Validate all fields
   - Output TypeScript file

4. **Manual review:**
   - Check for duplicate IDs
   - Verify test type mapping
   - Validate dates make sense
   - Ensure URLs are correct

---

## Maintenance

### Annual Updates (Each Year)
- Update `testDates.year` to next year
- Update all dates (application, test, results)
- Update `estimatedApplicants` if new data available
- Update `acceptanceRate` if changed
- Review and update FAQs

### Data Sources
- **NSW Selective:** https://education.nsw.gov.au/public-schools/selective-high-schools-and-opportunity-classes
- **VIC Selective:** https://www.vic.gov.au/selective-entry-high-schools
- **ACER:** https://www.acer.org/au/scholarship
- **EduTest:** https://edutest.com.au/test-calendar
- **Individual school websites** for specific details

---

## Future Enhancements

**Potential additions:**
- `schoolRanking` - VCE/HSC ranking if available
- `notableAlumni` - for credibility
- `specialPrograms` - (IB, extension programs)
- `catchmentArea` - for location-based searches
- `transportOptions` - practical info for families
- `uniformCosts` - practical info

**Keep it focused on test prep for now - can expand later.**

---

**Last updated:** March 31, 2026
