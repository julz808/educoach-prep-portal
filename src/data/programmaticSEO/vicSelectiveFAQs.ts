/**
 * VIC Selective Entry FAQs
 *
 * School-specific and general FAQs for Victorian Selective Entry high schools
 * Designed for Answer Engine Optimization (AEO) - factual, citation-worthy answers
 *
 * Sources:
 * - vic.gov.au/selective-entry-high-schools
 * - selectiveentry.acer.org/vic
 * - Individual school websites
 */

import { SchoolFAQ } from './types';

/**
 * General VIC Selective FAQs (apply to all 4 schools)
 */
export const vicSelectiveGeneralFAQs: SchoolFAQ[] = [
  {
    question: "What is the VIC Selective Entry Test?",
    answer: "The Victorian Selective Entry High School Placement Test is an ACER-developed exam for entry into Victoria's 4 government selective entry high schools: Melbourne High School, The Mac.Robertson Girls' High School, Nossal High School, and Suzanne Cory High School. The test assesses students' abilities in numerical reasoning, reading comprehension, verbal reasoning, and writing (both creative and persuasive). All four schools use the same test administered on the same day.",
    category: "general",
    citationUrl: "https://www.vic.gov.au/selective-entry-high-schools"
  },
  {
    question: "When is the VIC Selective Entry Test in 2027?",
    answer: "For 2027 entry (Year 9 starting in 2027), the Victorian Selective Entry Test is held on June 20, 2026. Applications open March 2, 2026 and close April 24, 2026. First round offers are released August 3, 2026. These dates are consistent across all four selective entry schools.",
    category: "dates",
    citationUrl: "https://www.vic.gov.au/selective-entry-high-schools"
  },
  {
    question: "What sections are on the VIC Selective Entry Test?",
    answer: "The test consists of 5 sections: (1) Numerical Reasoning - 30 questions in 30 minutes testing number patterns, algebra, and problem-solving; (2) Reading Comprehension - 35 questions in 35 minutes across fiction and non-fiction texts; (3) Verbal Reasoning - 25 questions in 25 minutes testing analogies and word relationships; (4) Creative Writing - 1 prompt in 15 minutes for narrative writing; (5) Persuasive Writing - 1 prompt in 30 minutes for argumentative writing. Total test time is approximately 3 hours.",
    category: "general",
    citationUrl: "https://selectiveentry.acer.org/vic"
  },
  {
    question: "How competitive is VIC Selective Entry?",
    answer: "VIC Selective Entry is extremely competitive, with approximately 12,000 students applying for around 860 total Year 9 places across the 4 schools (approximately 7% acceptance rate). Melbourne High and Mac.Robertson Girls' typically have the highest demand, with Mac.Robertson having the lowest acceptance rate of approximately 4% (250 places for 6,000 girls). Successful students typically score in the Superior band (top 5% statewide).",
    category: "general",
    citationUrl: "https://www.vic.gov.au/selective-entry-high-schools"
  },
  {
    question: "What score do you need for VIC Selective Entry?",
    answer: "While exact cutoff scores are not published, successful applicants typically achieve scores in the Superior band, which represents the top 5% of test-takers statewide. The test is scored out of 300 points total (combining all sections). Historical data suggests competitive scores are typically 240-270+, though this varies by year and by school. Melbourne High and Mac.Robertson generally require the highest scores.",
    category: "requirements",
    citationUrl: "https://selectiveentry.acer.org/vic"
  },
  {
    question: "Can you apply to multiple VIC Selective schools?",
    answer: "Yes. Students can list up to 3 school preferences on their application, ranking them in order of preference. Your highest-preference school for which you qualify will make an offer. For example, if you list Melbourne High as first preference, Nossal as second, and Suzanne Cory as third, and you qualify for Nossal and Suzanne Cory, you'll receive an offer from Nossal (your higher preference).",
    category: "general",
    citationUrl: "https://www.vic.gov.au/selective-entry-high-schools"
  },
  {
    question: "Can you retake the VIC Selective Entry Test?",
    answer: "No. Students can only sit the Victorian Selective Entry Test once for Year 9 entry. If unsuccessful, you cannot retake the test for the same entry year. However, some schools (like Melbourne High and Mac.Robertson) offer limited Year 10 or Year 11 entry through EduTest scholarship exams, providing a second pathway.",
    category: "general",
    citationUrl: "https://www.vic.gov.au/selective-entry-high-schools"
  },
  {
    question: "What is the application process for VIC Selective Entry?",
    answer: "The application process involves: (1) Online application opens March 2, 2026 through the Victorian Selective Entry portal; (2) Submit application with up to 3 school preferences by April 24, 2026; (3) Sit the ACER test on June 20, 2026 at your assigned testing center; (4) Results and first round offers released August 3, 2026; (5) Accept or decline your offer; (6) Second round offers (if available) released later in August if positions become available.",
    category: "general",
    citationUrl: "https://www.vic.gov.au/selective-entry-high-schools"
  },
  {
    question: "How should I prepare for the VIC Selective Entry Test?",
    answer: "Effective preparation typically includes: (1) Start 6-12 months before the test date; (2) Practice all 5 test sections regularly (numerical reasoning, reading, verbal reasoning, creative writing, persuasive writing); (3) Take full-length practice tests under timed conditions; (4) Identify weak areas and focus targeted practice there; (5) Read widely to improve vocabulary and comprehension; (6) Practice writing to time limits; (7) Review basic mathematics concepts (algebra, geometry, number patterns). Most families use a combination of practice materials, online platforms like EduCourse, and/or tutoring.",
    category: "preparation"
  }
];

/**
 * Melbourne High School specific FAQs
 */
export const melbourneHighFAQs: SchoolFAQ[] = [
  {
    question: "What makes Melbourne High School different from other VIC Selective schools?",
    answer: "Melbourne High School is Victoria's only government boys-only selective entry high school and has been consistently ranked #1 in the state for many years. Key differentiators include: its all-boys environment (Years 9-12 only), location in South Yarra (inner Melbourne), the largest intake of the 4 schools (250 places), and a long-standing reputation as Victoria's premier academic institution. It also offers 17 principal discretion places and limited Year 10 entry via EduTest. Melbourne High consistently achieves top VCE results and has strong alumni networks.",
    category: "general",
    citationUrl: "https://mhs.vic.edu.au/"
  },
  {
    question: "Does Melbourne High School accept girls?",
    answer: "No. Melbourne High School is an all-boys school accepting only male students for Years 9-12. Girls seeking government selective entry in Victoria should apply to The Mac.Robertson Girls' High School (girls-only), Nossal High School (co-ed), or Suzanne Cory High School (co-ed).",
    category: "requirements"
  }
];

/**
 * Mac.Robertson Girls' High School specific FAQs
 */
export const macRobertsonFAQs: SchoolFAQ[] = [
  {
    question: "What makes Mac.Robertson Girls' High School different from other VIC Selective schools?",
    answer: "Mac.Robertson Girls' High School is Victoria's only government girls-only selective entry high school. Key differentiators include: its all-girls environment, location in Melbourne CBD, consistently ranking #1-2 among Victorian girls' schools, and having the most competitive acceptance rate (approximately 4% - 250 places for 6,000 girls). The school offers strong programs across STEM, humanities, and arts, and provides Year 10-11 entry pathways via EduTest in addition to Year 9 ACER entry.",
    category: "general",
    citationUrl: "https://www.macrob.vic.edu.au/"
  },
  {
    question: "Does Mac.Robertson accept boys?",
    answer: "No. The Mac.Robertson Girls' High School is an all-girls school accepting only female students for Years 9-12. Boys seeking government selective entry in Victoria should apply to Melbourne High School (boys-only), Nossal High School (co-ed), or Suzanne Cory High School (co-ed).",
    category: "requirements"
  }
];

/**
 * Nossal High School specific FAQs
 */
export const nossalFAQs: SchoolFAQ[] = [
  {
    question: "What makes Nossal High School different from other VIC Selective schools?",
    answer: "Nossal High School is one of two co-educational government selective schools in Victoria (along with Suzanne Cory). Named after Nobel laureate Professor Gustav Nossal, the school is known for its strong focus on science and research. Key differentiators include: co-ed environment, location in Berwick (south-eastern Melbourne, serving that region), 180 Year 9 entry places, and strong science programs. It's often the preferred choice for families in Melbourne's south-east.",
    category: "general",
    citationUrl: "https://www.nossalhs.vic.edu.au/"
  },
  {
    question: "Where is Nossal High School located?",
    answer: "Nossal High School is located in Berwick, in south-eastern Melbourne. It serves families in Melbourne's south-east region and is accessible from suburbs including Berwick, Narre Warren, Dandenong, Pakenham, and surrounding areas. The school was strategically placed to provide selective education access to this growing region of Melbourne.",
    category: "general"
  }
];

/**
 * Suzanne Cory High School specific FAQs
 */
export const suzanneCoryFAQs: SchoolFAQ[] = [
  {
    question: "What makes Suzanne Cory High School different from other VIC Selective schools?",
    answer: "Suzanne Cory High School is one of two co-educational government selective schools in Victoria (along with Nossal). Named after Nobel laureate Professor Suzanne Cory, the school emphasizes STEM education and innovation. Key differentiators include: co-ed environment, location in Werribee (western Melbourne, serving that region), 180 Year 9 entry places, strong STEM focus, and a growing reputation for academic excellence. It's the preferred choice for families in Melbourne's west.",
    category: "general",
    citationUrl: "https://www.suzannecoryhs.vic.edu.au/"
  },
  {
    question: "Where is Suzanne Cory High School located?",
    answer: "Suzanne Cory High School is located in Werribee, in western Melbourne. It serves families in Melbourne's west region and is accessible from suburbs including Werribee, Point Cook, Hoppers Crossing, Wyndham Vale, Tarneit, and surrounding areas. The school provides selective education access to this rapidly growing region of Melbourne.",
    category: "general"
  }
];

/**
 * Helper function to get all FAQs for a specific school
 */
export const getFAQsForSchool = (schoolId: string): SchoolFAQ[] => {
  const generalFAQs = vicSelectiveGeneralFAQs;

  let schoolSpecificFAQs: SchoolFAQ[] = [];

  switch (schoolId) {
    case 'melbourne-high-school':
      schoolSpecificFAQs = melbourneHighFAQs;
      break;
    case 'mac-robertson-girls-high-school':
      schoolSpecificFAQs = macRobertsonFAQs;
      break;
    case 'nossal-high-school':
      schoolSpecificFAQs = nossalFAQs;
      break;
    case 'suzanne-cory-high-school':
      schoolSpecificFAQs = suzanneCoryFAQs;
      break;
  }

  return [...schoolSpecificFAQs, ...generalFAQs];
};
