// Test-specific testimonials - 5 per test, varied length and realistic tone

export interface Testimonial {
  quote: string;
  name: string;
  details: string;
  stars: 5;
  test: string;
}

export const productTestimonials: { [key: string]: Testimonial[] } = {
  'edutest-scholarship': [
    {
      quote: "My daughter got scholarship offers from three schools after using this. The verbal reasoning questions were really similar to what came up on the actual test. Better value than the tutor we were using before.",
      name: "Rebecca M.",
      details: "Parent of Year 6 student, VIC",
      stars: 5,
      test: "edutest-scholarship"
    },
    {
      quote: "Tom went from around 68th percentile on the diagnostic to 94th on the real test. Took about 9 weeks. The numerical reasoning drills made the biggest difference - he actually understood the patterns instead of just guessing.",
      name: "Michael T.",
      details: "Parent of Year 6 student, NSW",
      stars: 5,
      test: "edutest-scholarship"
    },
    {
      quote: "The writing feedback was honestly better than waiting days for her tutor to review essays. She'd get detailed notes within seconds. Her writing improved heaps and she ended up with a 50% scholarship at her first choice school.",
      name: "Linda K.",
      details: "Parent of Year 5 student, VIC",
      stars: 5,
      test: "edutest-scholarship"
    },
    {
      quote: "Worth every cent. Jake said the practice tests were almost identical to the real thing. The sub-skill tracking helped us focus on what actually needed work instead of practicing everything.",
      name: "David L.",
      details: "Parent of Year 6 student, Brisbane",
      stars: 5,
      test: "edutest-scholarship"
    },
    {
      quote: "We were skeptical about online prep but this worked really well. The reading comprehension section with instant feedback helped Emma develop actual strategies for the time pressure. She scored top 8% and got offers from all four schools.",
      name: "Sarah P.",
      details: "Parent of Year 5 student, NSW",
      stars: 5,
      test: "edutest-scholarship"
    }
  ],

  'acer-scholarship': [
    {
      quote: "Oliver got a full scholarship after 10 weeks with this platform. The abstract reasoning practice was excellent - went from completely lost on pattern questions to getting them consistently right.",
      name: "Amanda H.",
      details: "Parent of Year 6 student, Melbourne",
      stars: 5,
      test: "acer-scholarship"
    },
    {
      quote: "ACER maths is way harder than school. These questions matched that difficulty perfectly. Our son improved from 71st to 93rd percentile. The visual dashboards showing his progress kept him motivated too.",
      name: "Robert C.",
      details: "Parent of Year 6 student, Sydney",
      stars: 5,
      test: "acer-scholarship"
    },
    {
      quote: "Tried two tutors first, spent over $1200 with not much improvement. Within 6 weeks of using this Chloe's scores jumped heaps. The diagnostic showed exactly which pattern types she struggled with. Now she's at her dream school on a 75% scholarship.",
      name: "Michelle W.",
      details: "Parent of Year 7 student, Brisbane",
      stars: 5,
      test: "acer-scholarship"
    },
    {
      quote: "Writing feedback was really detailed - covered argument structure, evidence, vocabulary, everything. Helped James write essays that actually made a point instead of just filling space.",
      name: "Andrew K.",
      details: "Parent of Year 6 student, Perth",
      stars: 5,
      test: "acer-scholarship"
    },
    {
      quote: "The reading comp is so fast-paced in ACER. Unlimited timed drills helped her build speed without losing accuracy. She finished the real test with time to spare and got 96th percentile. Definitely recommend.",
      name: "Jennifer L.",
      details: "Parent of Year 5 student, Adelaide",
      stars: 5,
      test: "acer-scholarship"
    }
  ],

  'vic-selective': [
    {
      quote: "Emma got into Mac.Robertson! The dual writing practice was perfect - one creative, one analytical, both in the same session just like the real test. Can't find this format anywhere else.",
      name: "Catherine S.",
      details: "Parent of Year 8 student, Kew",
      stars: 5,
      test: "vic-selective"
    },
    {
      quote: "We spent nearly $2000 on tutoring with minimal improvement. Switched to this and within 6 weeks his numerical reasoning jumped 22 percentile points. He's at Melbourne High now. Wish we'd started here.",
      name: "Robert M.",
      details: "Parent of Year 8 student, Brighton",
      stars: 5,
      test: "vic-selective"
    },
    {
      quote: "The analytical writing for VIC selective is really specific - you have to analyse a text, not just write an essay. This was the only platform that actually practiced that skill properly. She's thriving at Mac.Rob now.",
      name: "Michelle D.",
      details: "Parent of Year 8 student, Camberwell",
      stars: 5,
      test: "vic-selective"
    },
    {
      quote: "VIC verbal reasoning is brutal. Analogies and word relationships at Year 11 level. The drills built Leo's vocabulary systematically. Went from 65th to 89th percentile, got into Nossal.",
      name: "Daniel T.",
      details: "Parent of Year 8 student, Berwick",
      stars: 5,
      test: "vic-selective"
    },
    {
      quote: "My daughter was strong in maths but weak in reading. The diagnostic pinpointed exactly which reading skills needed work. Six weeks of targeted practice and she's at Suzanne Cory. The sub-skill analytics are genuinely unique.",
      name: "Lisa W.",
      details: "Parent of Year 8 student, Werribee",
      stars: 5,
      test: "vic-selective"
    }
  ],

  'nsw-selective': [
    {
      quote: "Harrison got into James Ruse! Still can't believe it. The maths reasoning was spot on to the real test. He got 97th percentile in maths, 92nd overall.",
      name: "Rachel K.",
      details: "Parent of Year 6 student, Carlingford",
      stars: 5,
      test: "nsw-selective"
    },
    {
      quote: "The reading section is incredibly fast. These timed drills taught Sophie to skim and scan properly without losing comprehension. She went from not finishing practice tests to completing the real one with time to check. She's at North Sydney Girls now.",
      name: "David H.",
      details: "Parent of Year 6 student, Chatswood",
      stars: 5,
      test: "nsw-selective"
    },
    {
      quote: "We're single income so expensive tutoring wasn't an option. This gave us quality prep for way less. The thinking skills section was particularly good. Lucas improved from 58th to 84th percentile and got into Baulkham Hills.",
      name: "Maria G.",
      details: "Parent of Year 6 student, Parramatta",
      stars: 5,
      test: "nsw-selective"
    },
    {
      quote: "Persuasive writing feedback was really thorough - structure, argument quality, evidence, language features, all of it. Chloe learned to write arguments that actually convince. Top 10% for writing, got Hornsby Girls.",
      name: "Andrew C.",
      details: "Parent of Year 6 student, Hornsby",
      stars: 5,
      test: "nsw-selective"
    },
    {
      quote: "My son gets anxious about tests. The unlimited practice helped him get so familiar with the format that the actual test felt routine. Scored 15 percentile points higher than diagnostic. At Fort Street now and loving it.",
      name: "Jennifer T.",
      details: "Parent of Year 6 student, Petersham",
      stars: 5,
      test: "nsw-selective"
    }
  ],

  'year-5-naplan': [
    {
      quote: "Our daughter went from Band 5 to Band 8 in reading between diagnostic and actual NAPLAN. The adaptive questions kept her challenged without overwhelming her. We could see her progress week by week.",
      name: "Sarah L.",
      details: "Parent of Year 5 student, Brisbane",
      stars: 5,
      test: "year-5-naplan"
    },
    {
      quote: "Tom went from 60% on language conventions practice to 92% in about 8 weeks. The instant feedback helped him understand why answers were right or wrong. His NAPLAN put him in top 15% nationally.",
      name: "Michael R.",
      details: "Parent of Year 5 student, Perth",
      stars: 5,
      test: "year-5-naplan"
    },
    {
      quote: "NAPLAN numeracy tests application, not just computation. The word problems prepared Emma really well. She improved from 65th to 88th percentile. Having calculator and non-calculator sections separate matched the real format.",
      name: "Linda M.",
      details: "Parent of Year 5 student, Adelaide",
      stars: 5,
      test: "year-5-naplan"
    },
    {
      quote: "The narrative writing feedback was so helpful. Instead of just marking grammar it looked at story structure, character development, descriptive language. Jack's writing improved dramatically and he actually enjoys it now.",
      name: "David K.",
      details: "Parent of Year 5 student, Sydney",
      stars: 5,
      test: "year-5-naplan"
    },
    {
      quote: "Started prep only 6 weeks before NAPLAN thinking it was too late. The diagnostic focused our efforts perfectly - skipped what she knew, drilled weak areas. She jumped 18 percentile points overall. Even short-term prep works when it's targeted.",
      name: "Rebecca W.",
      details: "Parent of Year 5 student, Melbourne",
      stars: 5,
      test: "year-5-naplan"
    }
  ],

  'year-7-naplan': [
    {
      quote: "Year 7 NAPLAN is significantly harder than Year 5. Our son needed serious prep for top bands. The advanced reading comprehension with inference and analysis was perfect. He got Band 10 in reading, Band 9 in writing.",
      name: "Catherine H.",
      details: "Parent of Year 7 student, Sydney",
      stars: 5,
      test: "year-7-naplan"
    },
    {
      quote: "Numeracy includes algebra, geometry, statistical reasoning - well beyond basic arithmetic. The calculator and non-calculator sections being separated helped. James went Band 7 to Band 10 in numeracy.",
      name: "Robert D.",
      details: "Parent of Year 7 student, Melbourne",
      stars: 5,
      test: "year-7-naplan"
    },
    {
      quote: "Persuasive writing at Year 7 requires sophisticated argument structure. The AI feedback helped Emma develop a formula that works - thesis, three evidenced points, counter-argument, conclusion. Went from Band 6 to Band 9.",
      name: "Michelle K.",
      details: "Parent of Year 7 student, Brisbane",
      stars: 5,
      test: "year-7-naplan"
    },
    {
      quote: "Language conventions tests complex grammar and advanced punctuation. The unlimited drills built automatic recognition - Alex was spotting errors instantly by test day. Top 8% nationally.",
      name: "Andrew T.",
      details: "Parent of Year 7 student, Adelaide",
      stars: 5,
      test: "year-7-naplan"
    },
    {
      quote: "We have three kids so value matters. At $199 for 12 months this was a no-brainer compared to tutoring. Our daughter practiced consistently for 10 weeks, improved across all domains, scored Band 9 or 10 in everything. Highly recommend.",
      name: "Jennifer M.",
      details: "Parent of Year 7 student, Perth",
      stars: 5,
      test: "year-7-naplan"
    }
  ]
};

// Helper function to get testimonials for a specific test
export const getTestimonialsForTest = (slug: string): Testimonial[] => {
  return productTestimonials[slug] || [];
};
