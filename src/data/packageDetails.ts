// Package details for each test product - what's included in the $199 package
// Data sourced from actual Supabase questions table

export interface PackageSubItem {
  count: number;
  label: string;
}

export interface PackageItem {
  count: number;
  label: string;
  highlight?: boolean;
  subItems?: PackageSubItem[];
}

export interface PackageDetails {
  totalQuestions: number;
  roundedQuestions: number; // Rounded to nearest 100
  drillQuestions: number; // Actual drill count
  roundedDrillQuestions: number; // Rounded to nearest 100
  totalTests: number;
  items: PackageItem[];
}

export const packageDetails: { [key: string]: PackageDetails } = {
  'edutest-scholarship': {
    totalQuestions: 2238,
    roundedQuestions: 2200,
    drillQuestions: 912,
    roundedDrillQuestions: 900,
    totalTests: 5,
    items: [
      { count: 1, label: 'Full-Length Diagnostic Test (All Sections)' },
      {
        count: 25,
        label: 'Total Practice Tests',
        highlight: true,
        subItems: [
          { count: 5, label: 'Mathematics Tests' },
          { count: 5, label: 'Verbal Reasoning Tests' },
          { count: 5, label: 'Numerical Reasoning Tests' },
          { count: 5, label: 'Reading Comprehension Tests' },
          { count: 5, label: 'Writing Tests (Marked with detailed feedback)' }
        ]
      },
      { count: 900, label: 'Drill Questions' },
      { count: 1, label: 'Detailed Answer Explanations' },
      { count: 1, label: 'Detailed Performance Insights Dashboard' },
      { count: 1, label: 'Desktop, Tablet & Mobile Friendly' },
      { count: 365, label: 'Days Validity' }
    ]
  },
  'acer-scholarship': {
    totalQuestions: 849,
    roundedQuestions: 800,
    drillQuestions: 423,
    roundedDrillQuestions: 400,
    totalTests: 5,
    items: [
      { count: 1, label: 'Full-Length Diagnostic Test (All Sections)' },
      {
        count: 15,
        label: 'Total Practice Tests',
        highlight: true,
        subItems: [
          { count: 5, label: 'Mathematics Tests' },
          { count: 5, label: 'Humanities Tests' },
          { count: 5, label: 'Writing Tests (Marked with detailed feedback)' }
        ]
      },
      { count: 400, label: 'Drill Questions' },
      { count: 1, label: 'Detailed Answer Explanations' },
      { count: 1, label: 'Detailed Performance Insights Dashboard' },
      { count: 1, label: 'Desktop, Tablet & Mobile Friendly' },
      { count: 365, label: 'Days Validity' }
    ]
  },
  'vic-selective': {
    totalQuestions: 2037,
    roundedQuestions: 2000,
    drillQuestions: 705,
    roundedDrillQuestions: 700,
    totalTests: 5,
    items: [
      { count: 1, label: 'Full-Length Diagnostic Test (All Sections)' },
      {
        count: 25,
        label: 'Total Practice Tests',
        highlight: true,
        subItems: [
          { count: 5, label: 'Mathematics Reasoning Tests' },
          { count: 5, label: 'Verbal Reasoning Tests' },
          { count: 5, label: 'Quantitative Reasoning Tests' },
          { count: 5, label: 'Reading Reasoning Tests' },
          { count: 5, label: 'Writing Tests (Marked with detailed feedback)' }
        ]
      },
      { count: 700, label: 'Drill Questions' },
      { count: 1, label: 'Detailed Answer Explanations' },
      { count: 1, label: 'Detailed Performance Insights Dashboard' },
      { count: 1, label: 'Desktop, Tablet & Mobile Friendly' },
      { count: 365, label: 'Days Validity' }
    ]
  },
  'nsw-selective': {
    totalQuestions: 1319,
    roundedQuestions: 1300,
    drillQuestions: 684,
    roundedDrillQuestions: 700,
    totalTests: 5,
    items: [
      { count: 1, label: 'Full-Length Diagnostic Test (All Sections)' },
      {
        count: 20,
        label: 'Total Practice Tests',
        highlight: true,
        subItems: [
          { count: 5, label: 'Reading Tests' },
          { count: 5, label: 'Mathematical Reasoning Tests' },
          { count: 5, label: 'Thinking Skills Tests' },
          { count: 5, label: 'Writing Tests (Marked with detailed feedback)' }
        ]
      },
      { count: 700, label: 'Drill Questions' },
      { count: 1, label: 'Detailed Answer Explanations' },
      { count: 1, label: 'Detailed Performance Insights Dashboard' },
      { count: 1, label: 'Desktop, Tablet & Mobile Friendly' },
      { count: 365, label: 'Days Validity' }
    ]
  },
  'year-5-naplan': {
    totalQuestions: 1693,
    roundedQuestions: 1700,
    drillQuestions: 900,
    roundedDrillQuestions: 900,
    totalTests: 5,
    items: [
      { count: 1, label: 'Full-Length Diagnostic Test (All Sections)' },
      {
        count: 25,
        label: 'Total Practice Tests',
        highlight: true,
        subItems: [
          { count: 5, label: 'Reading Tests' },
          { count: 5, label: 'Language Conventions Tests' },
          { count: 5, label: 'Numeracy (No Calculator) Tests' },
          { count: 5, label: 'Numeracy (Calculator) Tests' },
          { count: 5, label: 'Writing Tests (Marked with detailed feedback)' }
        ]
      },
      { count: 900, label: 'Drill Questions' },
      { count: 1, label: 'Detailed Answer Explanations' },
      { count: 1, label: 'Detailed Performance Insights Dashboard' },
      { count: 1, label: 'Desktop, Tablet & Mobile Friendly' },
      { count: 365, label: 'Days Validity' }
    ]
  },
  'year-7-naplan': {
    totalQuestions: 1903,
    roundedQuestions: 1900,
    drillQuestions: 908,
    roundedDrillQuestions: 900,
    totalTests: 5,
    items: [
      { count: 1, label: 'Full-Length Diagnostic Test (All Sections)' },
      {
        count: 25,
        label: 'Total Practice Tests',
        highlight: true,
        subItems: [
          { count: 5, label: 'Reading Tests' },
          { count: 5, label: 'Language Conventions Tests' },
          { count: 5, label: 'Numeracy (No Calculator) Tests' },
          { count: 5, label: 'Numeracy (Calculator) Tests' },
          { count: 5, label: 'Writing Tests (Marked with detailed feedback)' }
        ]
      },
      { count: 900, label: 'Drill Questions' },
      { count: 1, label: 'Detailed Answer Explanations' },
      { count: 1, label: 'Detailed Performance Insights Dashboard' },
      { count: 1, label: 'Desktop, Tablet & Mobile Friendly' },
      { count: 365, label: 'Days Validity' }
    ]
  }
};

export const getPackageDetails = (slug: string): PackageDetails | null => {
  return packageDetails[slug] || null;
};
