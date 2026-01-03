
import { type Course } from '@/types';

export const courses: Course[] = [
  {
    id: 'edutest-scholarship',
    title: 'EduTest Scholarship',
    shortDescription: 'Covers all 5 sections of the EduTest exam: Verbal Reasoning, Numerical Reasoning, Reading, Mathematics, and Written Expression.',
    fullDescription: 'Our comprehensive EduTest Scholarship preparation program is designed specifically for the unique format and requirements of EduTest examinations. With focused practice and strategic guidance, students will build confidence and competence across all test sections.',
    price: 199,
    target: 'Students applying to independent schools (Year 9 entry)',
    skills: [
      'Verbal reasoning and vocabulary',
      'Numerical reasoning and problem solving',
      'Reading comprehension strategies',
      'Mathematical applications',
      'Written expression techniques'
    ],
    image: '/images/courses/edutest.jpg',
    slug: 'edutest-scholarship'
  },
  {
    id: 'acer-scholarship',
    title: 'ACER Scholarship',
    shortDescription: 'Prepare for ACER\'s Scholarship Test (Year 7 Entry). Includes reading, mathematics, writing prompts, and high-order reasoning.',
    fullDescription: 'Our ACER Scholarship Exam preparation course gives students the competitive edge needed to excel in this challenging assessment. Covering all test components with specialised practice materials, we help students develop the advanced skills required for success.',
    price: 199,
    target: 'Students in Year 5–9 applying for private school scholarships',
    skills: [
      'Abstract reasoning and pattern recognition',
      'Advanced mathematical reasoning',
      'Critical reading and comprehension',
      'Creative and analytical writing',
      'Problem solving under time pressure'
    ],
    image: '/images/courses/acer.jpg',
    slug: 'acer-scholarship'
  },
  {
    id: 'vic-selective',
    title: 'VIC Selective Entry',
    shortDescription: 'Full prep for Victoria\'s Year 9 selective exam (Melbourne High, Mac.Robertson, etc.). Includes reading, mathematics, verbal/quant reasoning, and dual writing tasks.',
    fullDescription: 'Our Victoria Selective Entry preparation course provides comprehensive coverage of all components needed for success in this competitive examination. With targeted practice materials and expert guidance, students will develop the advanced skills required for Victoria\'s prestigious selective high schools.',
    price: 199,
    target: 'Year 8 students sitting the VIC selective test',
    skills: [
      'Verbal and quantitative reasoning',
      'Advanced mathematics',
      'Analytical reading comprehension',
      'Dual writing tasks - creative and analytical',
      'Test-taking strategies for time management'
    ],
    image: '/images/courses/vic-selective.jpg',
    slug: 'vic-selective'
  },
  {
    id: 'nsw-selective',
    title: 'NSW Selective Entry',
    shortDescription: 'Master the NSW Selective High School Placement Test. Includes Reading, Mathematical Reasoning, Thinking Skills, and Writing.',
    fullDescription: 'Our NSW Selective Entry preparation course is specially designed for students aiming to secure placement in NSW\'s competitive selective high schools. Covering all test components with extensive practice materials, we help students develop the advanced skills and confidence needed to excel.',
    price: 199,
    target: 'Year 6 students preparing for Year 7 entry to NSW Selective Schools',
    skills: [
      'Reading comprehension and interpretation',
      'Mathematical reasoning and problem solving',
      'Critical and creative thinking skills',
      'Persuasive and narrative writing',
      'Strategies for managing exam pressure'
    ],
    image: '/images/courses/nsw-selective.jpg',
    slug: 'nsw-selective'
  },
  {
    id: 'year-5-naplan',
    title: 'Year 5 NAPLAN',
    shortDescription: 'Build foundational skills in reading, writing, language conventions, and numeracy. Practice real-style adaptive questions and timed tests.',
    fullDescription: 'Our comprehensive Year 5 NAPLAN preparation course provides students with the essential skills and confidence needed to excel in their NAPLAN tests. Through adaptive learning technology and personalised practice, students will master key concepts while building test-taking strategies.',
    price: 199,
    target: 'Year 5 students (or Year 4 preparing early)',
    skills: [
      'Reading comprehension and analysis',
      'Basic to intermediate numeracy',
      'Grammar and punctuation',
      'Spelling and vocabulary',
      'Narrative and persuasive writing'
    ],
    image: '/images/courses/naplan-5.jpg',
    slug: 'year-5-naplan'
  },
  {
    id: 'year-7-naplan',
    title: 'Year 7 NAPLAN',
    shortDescription: 'Advanced practice for high-performing students preparing for Year 7 NAPLAN. Covers harder numeracy, grammar, inference, and essay writing.',
    fullDescription: 'Our Year 7 NAPLAN preparation course is designed for students aiming for excellence in their NAPLAN assessment. With challenging content and comprehensive coverage of all test domains, students will develop advanced skills and strategies.',
    price: 199,
    target: 'Year 7 students and ambitious Year 6s',
    skills: [
      'Complex reading comprehension',
      'Advanced numeracy and problem solving',
      'Advanced grammar and language conventions',
      'Critical thinking and analysis',
      'Sophisticated essay structure and vocabulary'
    ],
    image: '/images/courses/naplan-7.jpg',
    slug: 'year-7-naplan'
  }
];

export const faqs = [
  {
    question: "How long do I have access to the course?",
    answer: "You have 12 months of unlimited access from the date of purchase. This gives you plenty of time to prepare at your own pace, practice multiple times, and track your progress leading up to your test date."
  },
  {
    question: "Are the practice tests similar to the real exams?",
    answer: "Yes! Our practice tests are carefully designed to closely mimic the format, difficulty level, timing, and question types of the actual exams. All questions are created by experienced teachers familiar with test formats and aligned to official test structures."
  },
  {
    question: "Can I use this course on multiple devices?",
    answer: "Yes, you can access your course on any device with internet and a web browser - desktop computers, laptops, tablets (including iPad), and even smartphones. Your progress syncs automatically across all devices."
  },
  {
    question: "What happens after I purchase?",
    answer: "You'll receive immediate access! After completing your purchase, you'll get an email with login instructions within minutes. You can start with the diagnostic test right away to identify your strengths and areas for improvement."
  },
  {
    question: "Do you offer refunds if I'm not satisfied?",
    answer: "Yes! We offer a 7-day money-back guarantee. If you're not completely satisfied with your purchase for any reason, simply contact us within 7 days for a full refund - no questions asked."
  },
  {
    question: "How do the diagnostic tests work?",
    answer: "Our diagnostic tests assess your child's current knowledge and skills across all test sections and sub-skills. After completion, you'll receive a detailed breakdown showing strengths and gaps, along with personalised recommendations for which areas to practice most."
  },
  {
    question: "Do you provide feedback on writing tasks?",
    answer: "Yes! Our AI-powered system provides instant, detailed feedback on all writing responses - including structure, content quality, grammar, vocabulary usage, and specific suggestions for improvement. It's like having a personal writing tutor available 24/7."
  },
  {
    question: "Can siblings share one account?",
    answer: "Each purchase is designed for one student to ensure accurate progress tracking and personalised analytics. If you have multiple children preparing for tests, please contact us at learning@educourse.com.au for family discount options."
  },
  {
    question: "How is this different from hiring a private tutor?",
    answer: "Private tutors cost $80-150/hour and typically require 8-12 sessions ($640-1,800 total) for adequate preparation. With EduCourse, you get unlimited practice questions, instant AI feedback, detailed analytics, and full practice tests for just $199 - less than 2 tutor sessions. Plus, your child can practice anytime, get immediate feedback, and work at their own pace without scheduling constraints."
  },
  {
    question: "Will this actually improve my child's test score?",
    answer: "Our approach is proven: diagnostic testing identifies exact gaps, targeted drills strengthen weak areas, and full practice tests build confidence. Families using our platform see an average 20+ percentile improvement. The key is our sub-skill analytics - instead of generic practice, your child focuses precisely on question types they struggle with. It's the same methodology top tutors use, available 24/7."
  },
  {
    question: "My child already does well in school - do they need test prep?",
    answer: "School performance and test performance require different skills. Tests like NAPLAN, selective entry, and scholarship exams assess problem-solving, abstract reasoning, and time-pressured comprehension - skills not typically taught in regular classrooms. Even high-achieving students benefit from learning test-specific strategies, practicing under timed conditions, and understanding question formats they won't see in school."
  },
  {
    question: "Is online practice as effective as face-to-face tutoring?",
    answer: "Online practice offers several advantages: (1) Instant feedback vs waiting days for tutor notes, (2) Unlimited practice vs limited tutoring hours, (3) Detailed analytics showing progress across 50+ sub-skills vs general tutor feedback, (4) Practice anytime vs scheduled appointments, (5) Consistent quality vs tutor variability. Plus, at $199 vs $800-1,800 for tutoring, you can invest the savings in additional resources if needed."
  },
  {
    question: "What if my child doesn't like practicing online?",
    answer: "That's exactly why we offer a 7-day money-back guarantee - try it risk-free! Most students actually prefer our platform because: (1) they can work at their own pace without pressure, (2) instant feedback is motivating, (3) progress charts show improvement visually, (4) they can practice when it suits them, not when tutoring is scheduled. If your child genuinely doesn't engage with it after trying, we'll refund you fully."
  },
  {
    question: "How much time should my child spend practicing each week?",
    answer: "We recommend 3-4 practice sessions per week, 30-45 minutes each, for 8-12 weeks before the test. This balanced approach prevents burnout while building skills progressively. Our analytics dashboard helps you track whether practice time is being used effectively - if scores aren't improving, you'll know to adjust focus areas, not just add more hours."
  }
];
