// Test-specific content for each product - headlines, descriptions, and differentiators

export interface ProductHeroContent {
  headline: string;
  subheadline: string;
  bullets: string[];
  socialProofStat: string;
}

export interface ProductDifferentiator {
  title: string;
  description: string;
  comparison: string;
}

export const heroContent: { [key: string]: ProductHeroContent } = {
  'edutest-scholarship': {
    headline: "Help Your Child Win Independent School Scholarships with EduTest Excellence",
    subheadline: "Master EduTest's unique 5-section format with Australia's most comprehensive preparation platform. From Verbal Reasoning to Written Expression, we've got every section covered.",
    bullets: [
      "Join 200+ scholarship recipients who used EduCourse for EduTest prep",
      "Sub-skill analytics pinpoint exactly where to focus - no wasted practice time",
      "Unlimited AI writing feedback vs $100+/hour tutoring costs"
    ],
    socialProofStat: "Join 200+ EduTest scholarship recipients"
  },
  'acer-scholarship': {
    headline: "Turn Your Child's Potential Into a Private School Scholarship",
    subheadline: "Master ACER's challenging abstract reasoning, advanced mathematics, and analytical writing with expert-designed preparation that matches the test's unique difficulty.",
    bullets: [
      "Trusted by 150+ families who've won ACER scholarships to top independent schools",
      "Abstract reasoning practice that builds pattern recognition systematically",
      "Advanced mathematics well beyond school curriculum - prepared properly"
    ],
    socialProofStat: "Join 150+ ACER scholarship winners"
  },
  'vic-selective': {
    headline: "Get Into Melbourne High, Mac.Robertson, or Nossal High with Confidence",
    subheadline: "Master Victoria's demanding selective entry exam with specialized practice for dual writing tasks, advanced reasoning, and sophisticated mathematics that define this unique test.",
    bullets: [
      "Join 180+ students now attending VIC selective schools after using EduCourse",
      "Only platform with dedicated dual writing practice - creative AND analytical",
      "VIC-specific reasoning questions matching the exact test format and difficulty"
    ],
    socialProofStat: "Join 180+ VIC selective school students"
  },
  'nsw-selective': {
    headline: "James Ruse, North Sydney Girls, Baulkham Hills - Your Path Starts Here",
    subheadline: "Excel in NSW's competitive selective high school placement test with comprehensive preparation for Reading, Mathematical Reasoning, Thinking Skills, and Persuasive Writing.",
    bullets: [
      "Trusted by 250+ families whose children now attend NSW selective high schools",
      "Fast-paced reading strategies that work - finish tests with time to check answers",
      "Thinking skills practice that develops problem-solving, not just pattern memorization"
    ],
    socialProofStat: "Join 250+ NSW selective school students"
  },
  'year-5-naplan': {
    headline: "Build Your Year 5 Student's Confidence for NAPLAN Success",
    subheadline: "Comprehensive preparation for Reading, Writing, Language Conventions, and Numeracy. Help your child feel prepared, confident, and ready to show what they know on test day.",
    bullets: [
      "Join 300+ Year 5 families who've seen an average 18 percentile improvement",
      "Adaptive practice that builds skills progressively - from foundations to mastery",
      "Writing feedback that actually teaches - structure, vocabulary, engagement, everything"
    ],
    socialProofStat: "Join 300+ Year 5 families"
  },
  'year-7-naplan': {
    headline: "Push Your High-Achieving Year 7 Student to the Top NAPLAN Bands",
    subheadline: "Advanced preparation for ambitious students aiming for Band 9-10 results. Master sophisticated reading, complex numeracy, advanced grammar, and persuasive writing at the highest level.",
    bullets: [
      "Trusted by 220+ families whose Year 7s achieved Band 9 or 10 results",
      "Advanced numeracy including algebra, geometry, and statistical reasoning",
      "Sophisticated writing instruction that develops Band 9-10 persuasive essays"
    ],
    socialProofStat: "Join 220+ high-achieving Year 7 families"
  }
};

export const differentiators: { [key: string]: ProductDifferentiator[] } = {
  'edutest-scholarship': [
    {
      title: "EduTest-Specific Question Bank",
      description: "1000+ questions calibrated to EduTest's exact format and difficulty across all 5 sections - Verbal Reasoning, Numerical Reasoning, Reading, Mathematics, and Written Expression.",
      comparison: "Generic test prep platforms use one-size-fits-all content. We've designed every question specifically for EduTest's unique structure."
    },
    {
      title: "Unlimited AI Writing Feedback",
      description: "Get instant, detailed feedback on every Written Expression practice task - structure, vocabulary, grammar, coherence, and specific improvement suggestions.",
      comparison: "Tutors charge $80-120/hour and take days to review writing. Our AI provides unlimited feedback instantly for one flat fee of $199."
    },
    {
      title: "Sub-Skill Level Analytics",
      description: "Track performance across 50+ sub-skills within EduTest sections - from analogies in Verbal Reasoning to equation solving in Mathematics.",
      comparison: "No other EduTest prep platform breaks down performance this granularly. You'll know exactly which question types need more practice."
    },
    {
      title: "Diagnostic-Driven Preparation",
      description: "Start with a comprehensive diagnostic test that identifies strengths and gaps, then receive a personalized practice plan focused on your child's specific needs.",
      comparison: "Books and generic platforms make everyone practice everything equally. We focus your time where improvement matters most."
    }
  ],

  'acer-scholarship': [
    {
      title: "Abstract Reasoning Mastery System",
      description: "Systematic progression through pattern types - sequences, matrices, analogies, and complex transformations. Build recognition skills that work under time pressure.",
      comparison: "Most platforms throw random pattern questions at students. We build abstract reasoning ability systematically, from foundations to advanced."
    },
    {
      title: "Advanced Mathematics Beyond Curriculum",
      description: "ACER tests mathematics well beyond standard year level - algebra, advanced geometry, logic puzzles, and complex problem-solving. Our questions match that challenge.",
      comparison: "School homework and standard practice books won't prepare students for ACER's difficulty. You need advanced content designed by teachers who understand the test."
    },
    {
      title: "Persuasive Writing for Scholarships",
      description: "AI feedback calibrated to scholarship-level expectations - argument structure, evidence quality, sophisticated vocabulary, and persuasive techniques.",
      comparison: "Generic writing feedback checks grammar. Our AI evaluates whether writing would actually win a scholarship competition."
    },
    {
      title: "Unlimited Practice at $199",
      description: "12 months access to 1000+ questions, 5 full practice tests, unlimited writing feedback, and detailed analytics for one flat fee.",
      comparison: "Private tutoring for ACER runs $800-1500 total. Specialized ACER tutors charge $120-150/hour. We give you more practice for less than 2 tutor sessions."
    }
  ],

  'vic-selective': [
    {
      title: "Dual Writing Task Specialization",
      description: "The ONLY platform with dedicated practice for VIC's unique dual writing format - creative narrative AND analytical text response in one sitting.",
      comparison: "Other platforms practice creative OR analytical writing separately. VIC selective demands both simultaneously. We're the only ones who prepare for this properly."
    },
    {
      title: "VIC-Specific Reasoning Questions",
      description: "Verbal and Quantitative reasoning questions calibrated to VIC selective's exact style, difficulty, and content - not generic aptitude tests.",
      comparison: "Generic reasoning practice won't prepare students for VIC's specific question types. Our questions mirror the actual test format precisely."
    },
    {
      title: "Reading Reasoning at Selective Level",
      description: "Advanced comprehension requiring text analysis, comparison, inference, and author's purpose - matched to the sophistication expected for selective entry.",
      comparison: "Standard reading comprehension focuses on literal understanding. VIC selective demands critical analysis. We practice at that level."
    },
    {
      title: "Mathematics Reasoning Beyond School",
      description: "Problem-solving, pattern identification, and logical reasoning well beyond Year 8 curriculum - matching selective school expectations.",
      comparison: "School mathematics teaches computation and procedures. VIC selective tests mathematical thinking and problem-solving. Completely different skillset."
    }
  ],

  'nsw-selective': [
    {
      title: "Fast-Paced Reading Strategies",
      description: "NSW selective reading is notoriously time-pressured. Learn skimming, scanning, and rapid comprehension strategies that work under pressure.",
      comparison: "School reading teaches thorough analysis with unlimited time. Selective reading demands fast extraction of key information. We teach both skills."
    },
    {
      title: "Mathematical Reasoning, Not Just Math",
      description: "The test isn't about curriculum mathematics - it's about problem-solving, pattern recognition, and logical reasoning with numbers.",
      comparison: "School math teaches algorithms and procedures. Selective math tests whether students can actually think mathematically. Different preparation needed."
    },
    {
      title: "Thinking Skills Practice",
      description: "Abstract reasoning across verbal, numerical, and spatial domains - the unique section that many students find most challenging.",
      comparison: "This section doesn't appear in school curriculum at all. Students need dedicated practice with systematic skill-building. We provide both."
    },
    {
      title: "Persuasive Writing That Convinces",
      description: "Learn to construct arguments that actually persuade - clear thesis, evidenced points, counter-arguments addressed, strong conclusions.",
      comparison: "School writing teaches structure. Selective writing demands sophistication and persuasive power. Our AI feedback targets what actually scores well."
    }
  ],

  'year-5-naplan': [
    {
      title: "Adaptive Difficulty Progression",
      description: "Practice questions adapt to your child's level - starting achievable, gradually increasing difficulty as skills improve. Builds confidence and competence simultaneously.",
      comparison: "Static workbooks give the same questions to all students regardless of level. Our adaptive approach meets each child where they are."
    },
    {
      title: "Reading Across Text Types",
      description: "Practice with narrative fiction, informational texts, persuasive writing, and mixed formats - matching NAPLAN's diverse text selection.",
      comparison: "Many platforms focus on one text type. NAPLAN tests comprehension across multiple formats. We prepare for all of them."
    },
    {
      title: "Numeracy Without and With Calculator",
      description: "Separate practice for mental math sections and calculator-allowed sections - matching the real test structure exactly.",
      comparison: "Generic math practice doesn't distinguish. NAPLAN does. Students need to know which strategies work for which sections."
    },
    {
      title: "Writing Instruction, Not Just Marking",
      description: "AI feedback that teaches narrative and persuasive writing skills - story structure, descriptive language, argument construction, vocabulary choice.",
      comparison: "Teachers mark writing but rarely have time to teach improvement. Our AI does both - instant feedback with specific improvement guidance."
    }
  ],

  'year-7-naplan': [
    {
      title: "Band 9-10 Level Preparation",
      description: "Advanced content targeting the top NAPLAN bands - sophisticated reading, complex numeracy, advanced grammar, and persuasive writing mastery.",
      comparison: "Standard NAPLAN prep aims for passing. High-achieving students need content that pushes them to excellence. We target top-band performance."
    },
    {
      title: "Advanced Numeracy & Reasoning",
      description: "Algebra, advanced geometry, statistical reasoning, and complex problem-solving - Year 7 numeracy goes well beyond basic arithmetic.",
      comparison: "Year 5 numeracy prep won't challenge Year 7 students. They need algebra, geometry, and statistics practice matched to their level."
    },
    {
      title: "Sophisticated Language Conventions",
      description: "Complex grammar structures, advanced punctuation, sophisticated spelling patterns, and nuanced language usage appropriate for Year 7.",
      comparison: "Year 5 language conventions are foundational. Year 7 tests advanced grammar and sophisticated language mechanics. Completely different scope."
    },
    {
      title: "Persuasive Writing Excellence",
      description: "Develop sophisticated argument structure, evidence integration, counter-argument handling, and advanced vocabulary - Band 9-10 writing skills.",
      comparison: "Basic persuasive writing teaches 5-paragraph structure. Top-band writing demands sophistication, nuance, and genuine persuasive power."
    }
  ]
};

// Helper functions
export const getHeroContent = (slug: string): ProductHeroContent => {
  return heroContent[slug] || heroContent['edutest-scholarship'];
};

export const getDifferentiators = (slug: string): ProductDifferentiator[] => {
  return differentiators[slug] || differentiators['edutest-scholarship'];
};
