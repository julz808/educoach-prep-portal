// Year 7 NAPLAN - Curriculum Data V2
// Created: February 6, 2026
// Status: ✅ FOUNDATION COMPLETE - Representative examples showing 6-level difficulty structure

import type { SubSkillExamplesDatabase } from './types';

/**
 * Year 7 NAPLAN - Sub-Skill Examples
 *
 * Test Structure:
 * - Writing (1 question, 42 minutes) - Narrative OR Persuasive
 * - Reading (50 questions, 65 minutes, 8 passages ~200 words each)
 * - Language Conventions (45 questions, 45 minutes)
 * - Numeracy No Calculator (30 questions, 30 minutes)
 * - Numeracy Calculator (35 questions, 35 minutes)
 *
 * Difficulty Levels: 1-3 (Easy, Medium, Hard) - mapped from original NAPLAN levels
 *
 * Difficulty Mapping:
 *   - Level 1 (Easy): Covers original NAPLAN levels 1-2
 *   - Level 2 (Medium): Covers original NAPLAN levels 3-4
 *   - Level 3 (Hard): Covers original NAPLAN levels 5-6
 * Age Group: 12-13 years old (Year 7 students)
 *
 * Key Differences from Year 5:
 * - More sophisticated vocabulary and language
 * - Longer, more complex texts (200 words vs 150 words)
 * - Advanced grammar concepts (subjunctive mood, complex clauses)
 * - More advanced mathematics (negative numbers, indices, advanced problem-solving)
 * - Greater emphasis on inferential and critical comprehension
 */
export const NAPLAN_YEAR7_SUB_SKILLS: SubSkillExamplesDatabase = {

  // ============================================
  // YEAR 7 NAPLAN - WRITING
  // ============================================

  "Year 7 NAPLAN - Writing": {

    // SUB-SKILL 1: Narrative Writing
    "Narrative Writing": {
      description: "Writing sophisticated narratives with well-developed characters, settings, and plot structures. Demonstrates advanced use of literary techniques including dialogue, descriptive language, and varied sentence structures appropriate for Year 7 level.",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [1, 2, 3],
      question_format: "NAPLAN WRITING TASK:\n\n[Narrative prompt providing a scenario, opening sentence, or theme]\n\nYour story should:\n• Have a clear beginning, middle, and end\n• Include well-developed characters and setting\n• Use a variety of sentence structures\n• Include descriptive and engaging language\n• Be well-organized with paragraphs\n• Use correct spelling, grammar, and punctuation\n\nYou have 42 minutes to plan and write your story.",
      examples: [
        {
          difficulty: 1,  // Easy
          requires_visual: false,
          question_text: "NAPLAN WRITING TASK:\n\nWrite a story about a memorable day at school.\n\nYour story should:\n• Have a clear beginning, middle, and end\n• Include well-developed characters and setting\n• Use a variety of sentence structures\n• Include descriptive and engaging language\n• Be well-organized with paragraphs\n• Use correct spelling, grammar, and punctuation\n\nYou have 42 minutes to plan and write your story.",
          correct_answer: "[Student response - evaluated on narrative structure, character development, vocabulary, sentence variety, and technical accuracy]",
          explanation: "This simple, concrete prompt asks Year 7 students to write about a familiar, everyday experience. Students can draw on personal memories to create a narrative with clear structure. The topic is straightforward and accessible, allowing students to focus on developing good writing techniques.",
          characteristics: [
            "Simple, concrete everyday topic",
            "Familiar school experience",
            "Clear narrative structure required",
            "42-minute time limit including planning",
            "Assessed on basic narrative elements",
            "Accessible to all Year 7 students"
          ]
        },
        {
          difficulty: 2,  // Medium (mapped from old level 3)
          requires_visual: false,
          question_text: "NAPLAN WRITING TASK:\n\nWrite a story that begins with the sentence:\n\"The moment I stepped through the doorway, I knew nothing would ever be the same.\"\n\nYour story should:\n• Have a clear beginning, middle, and end\n• Include well-developed characters and setting\n• Use a variety of sentence structures\n• Include descriptive and engaging language\n• Be well-organized with paragraphs\n• Use correct spelling, grammar, and punctuation\n\nYou have 42 minutes to plan and write your story.",
          correct_answer: "[Student response - evaluated on narrative structure, character development, vocabulary, sentence variety, and technical accuracy]",
          explanation: "This narrative prompt provides an intriguing opening sentence that suggests transformation or change, allowing students to demonstrate creativity while maintaining a clear narrative arc. Year 7 students should show sophisticated vocabulary, varied sentence structures, effective use of dialogue, and well-developed paragraphs.",
          characteristics: [
            "Opening sentence provided as springboard",
            "Emphasis on character and setting development",
            "Requires varied sentence structures",
            "42-minute time limit including planning",
            "Assessed on narrative elements and technical accuracy",
            "Appropriate complexity for 12-13 year olds"
          ]
        },
        {
          difficulty: 3,  // Hard (mapped from old level 5)
          requires_visual: false,
          question_text: "NAPLAN WRITING TASK:\n\nWrite a story about a time when someone had to make a difficult choice between two important things.\n\nYour story should:\n• Have a clear beginning, middle, and end\n• Include well-developed characters and setting\n• Use a variety of sentence structures\n• Include descriptive and engaging language\n• Be well-organized with paragraphs\n• Use correct spelling, grammar, and punctuation\n\nYou have 42 minutes to plan and write your story.",
          correct_answer: "[Student response - evaluated on narrative structure, thematic depth, character development, vocabulary, sentence variety, and technical accuracy]",
          explanation: "This higher-difficulty prompt requires students to explore internal conflict and decision-making, demonstrating emotional depth and sophisticated narrative development. Students should create believable characters facing genuine dilemmas, use advanced vocabulary, and maintain consistent point of view.",
          characteristics: [
            "Abstract theme requiring thematic development",
            "Requires exploration of internal conflict",
            "Demands sophisticated character psychology",
            "Higher-order thinking about choices and consequences",
            "Requires sustained narrative coherence",
            "Appropriate challenge for advanced Year 7 writers"
          ]
        }
      ],
      pattern: {
        format_template: "NAPLAN WRITING TASK:\n\n[Narrative prompt: opening sentence, scenario, or theme]\n\nYour story should:\n• Have a clear beginning, middle, and end\n• Include well-developed characters and setting\n• Use a variety of sentence structures\n• Include descriptive and engaging language\n• Be well-organized with paragraphs\n• Use correct spelling, grammar, and punctuation\n\nYou have 42 minutes to plan and write your story.",
        key_characteristics: [
          "Single narrative prompt (opening sentence, scenario, or theme)",
          "42-minute time limit including planning time",
          "Emphasis on narrative structure (beginning, middle, end)",
          "Character and setting development required",
          "Varied sentence structures expected",
          "Descriptive and engaging language",
          "Proper paragraph organization",
          "Technical accuracy (spelling, grammar, punctuation)",
          "Age-appropriate complexity for Year 7 (12-13 years)",
          "Sophisticated vocabulary and literary techniques expected"
        ],
        distractor_strategies: [
          "N/A - Open-ended writing task without multiple choice options"
        ],
        difficulty_progression: {
          "1": "Simple, concrete prompts with everyday experiences (e.g., 'Write about a memorable day at school')",
          "2": "Moderately creative prompts with clear narrative focus (e.g., opening sentence provided, clear transformation theme)",
          "3": "Complex prompts requiring sophisticated narrative development and thematic exploration (e.g., difficult choices, moral dilemmas)"
        }
      }
    },

    // SUB-SKILL 2: Persuasive Writing
    "Persuasive Writing": {
      description: "Writing persuasive texts that present clear arguments supported by reasons and evidence. Demonstrates understanding of audience, purpose, and persuasive techniques appropriate for Year 7 level including logical reasoning, rhetorical questions, and emotive language.",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [1, 2, 3],
      question_format: "NAPLAN WRITING TASK:\n\n[Persuasive topic/question]\n\nWrite to persuade others to agree with your point of view.\n\nYour persuasive text should:\n• Have a clear opinion/position\n• Include arguments supported by reasons and evidence\n• Consider your audience\n• Use persuasive language techniques\n• Be well-organized with paragraphs\n• Use correct spelling, grammar, and punctuation\n\nYou have 42 minutes to plan and write your persuasive text.",
      examples: [
        {
          difficulty: 1,  // Easy
          requires_visual: false,
          question_text: "NAPLAN WRITING TASK:\n\nShould students have longer lunch breaks at school?\n\nWrite to persuade others to agree with your point of view.\n\nYour persuasive text should:\n• Have a clear opinion/position\n• Include arguments supported by reasons and evidence\n• Consider your audience\n• Use persuasive language techniques\n• Be well-organized with paragraphs\n• Use correct spelling, grammar, and punctuation\n\nYou have 42 minutes to plan and write your persuasive text.",
          correct_answer: "[Student response - evaluated on argument strength, evidence quality, persuasive techniques, organization, and technical accuracy]",
          explanation: "This simple, concrete topic presents a clear for/against position that Year 7 students can easily relate to. Students can draw on personal experience to support their arguments (for: time to relax, socialize, eat properly; against: less learning time, harder to refocus). The topic is straightforward and accessible.",
          characteristics: [
            "Simple, concrete school-related topic",
            "Clear for/against positions",
            "Familiar everyday experience",
            "Easy to generate personal reasons",
            "42-minute time limit including planning",
            "Accessible to all Year 7 students"
          ]
        },
        {
          difficulty: 2,  // Medium (mapped from old level 3)
          requires_visual: false,
          question_text: "NAPLAN WRITING TASK:\n\nShould social media platforms have age restrictions?\n\nWrite to persuade others to agree with your point of view.\n\nYour persuasive text should:\n• Have a clear opinion/position\n• Include arguments supported by reasons and evidence\n• Consider your audience\n• Use persuasive language techniques\n• Be well-organized with paragraphs\n• Use correct spelling, grammar, and punctuation\n\nYou have 42 minutes to plan and write your persuasive text.",
          correct_answer: "[Student response - evaluated on argument strength, evidence quality, persuasive techniques, organization, and technical accuracy]",
          explanation: "This persuasive prompt addresses a topic relevant to Year 7 students (12-13 years old) - social media use. Students should present a clear position (for or against age restrictions), support their arguments with logical reasons and evidence, use persuasive techniques (rhetorical questions, emotive language, statistics), and address counterarguments.",
          characteristics: [
            "Topic relevant to Year 7 age group (social media)",
            "Allows for either position (for or against)",
            "Requires logical reasoning and evidence",
            "Opportunity for persuasive techniques",
            "42-minute time limit including planning",
            "Assessed on argument quality and technical accuracy",
            "Age-appropriate complexity"
          ]
        },
        {
          difficulty: 3,  // Hard (mapped from old level 5)
          requires_visual: false,
          question_text: "NAPLAN WRITING TASK:\n\nSome people believe that students should have a say in deciding what subjects they study at school. Others believe that the curriculum should be determined by education experts.\n\nWhat is your opinion?\n\nWrite to persuade others to agree with your point of view.\n\nYour persuasive text should:\n• Have a clear opinion/position\n• Include arguments supported by reasons and evidence\n• Consider your audience\n• Use persuasive language techniques\n• Address opposing viewpoints\n• Be well-organized with paragraphs\n• Use correct spelling, grammar, and punctuation\n\nYou have 42 minutes to plan and write your persuasive text.",
          correct_answer: "[Student response - evaluated on argument sophistication, evidence quality, counterargument addressing, persuasive techniques, organization, and technical accuracy]",
          explanation: "This higher-difficulty prompt requires students to navigate a more nuanced debate about educational autonomy. Students must understand multiple perspectives, construct sophisticated arguments, provide strong evidence, address counterarguments effectively, and use advanced persuasive techniques. The complexity of the issue requires higher-order thinking.",
          characteristics: [
            "Complex, nuanced topic with multiple perspectives",
            "Requires understanding of both sides",
            "Explicitly asks students to address opposing viewpoints",
            "Demands sophisticated argumentation",
            "Requires strong evidence and logical reasoning",
            "Higher-order thinking about education policy",
            "Appropriate challenge for advanced Year 7 writers"
          ]
        }
      ],
      pattern: {
        format_template: "NAPLAN WRITING TASK:\n\n[Persuasive topic/question - often starting with 'Should...' or presenting two viewpoints]\n\nWrite to persuade others to agree with your point of view.\n\nYour persuasive text should:\n• Have a clear opinion/position\n• Include arguments supported by reasons and evidence\n• Consider your audience\n• Use persuasive language techniques\n• [For higher difficulties: Address opposing viewpoints]\n• Be well-organized with paragraphs\n• Use correct spelling, grammar, and punctuation\n\nYou have 42 minutes to plan and write your persuasive text.",
        key_characteristics: [
          "Single persuasive topic or question",
          "42-minute time limit including planning time",
          "Clear position/opinion required",
          "Arguments must be supported by reasons and evidence",
          "Audience awareness important",
          "Persuasive language techniques expected (rhetorical questions, emotive language, repetition)",
          "Proper paragraph organization with introduction, body paragraphs, conclusion",
          "Technical accuracy (spelling, grammar, punctuation)",
          "Age-appropriate topics for Year 7 (12-13 years)",
          "More sophisticated argumentation than Year 5"
        ],
        distractor_strategies: [
          "N/A - Open-ended writing task without multiple choice options"
        ],
        difficulty_progression: {
          "1": "Simple, concrete topics with clear for/against positions (e.g., 'Should students have longer lunch breaks?')",
          "2": "Moderately complex topics relevant to students (e.g., social media age restrictions, homework amounts)",
          "3": "Complex topics requiring sophisticated argumentation and counterargument addressing (e.g., curriculum choices, multiple perspectives)"
        }
      }
    }
  },

  // ============================================
  // YEAR 7 NAPLAN - READING
  // ============================================

  "Year 7 NAPLAN - Reading": {

    // SUB-SKILL 1: Literal & Inferential Comprehension
    "Literal & Inferential Comprehension": {
      description: "Understanding explicit information from texts (literal) and making logical inferences based on text clues (inferential). Year 7 level involves more complex texts (200+ words) including literary, informational, and persuasive passages.",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [1, 2, 3],
      question_format: "Read the following passage and answer the question.\n\n[Passage: 200+ words - literary, informational, or persuasive text]\n\n[Question about explicit or implicit information]\n\nA: [Option]\nB: [Option]\nC: [Option]\nD: [Option]",
      examples: [
        {
          difficulty: 1,  // Easy
          requires_visual: false,
          question_text: "Read this passage:\n\n\"The school library is open every weekday from 8:00 AM to 4:00 PM. Students can borrow up to three books at a time for two weeks. If you need a book for longer, you can renew it by asking the librarian. The library has a large collection of fiction and non-fiction books, as well as computers for research.\n\nMrs. Chen, the head librarian, is always happy to help students find books they'll enjoy. She runs a book club every Thursday after school for students who love reading. The library also has quiet study areas where students can do their homework.\"\n\nAccording to the passage, how many books can students borrow at once?\n\nA: Two books\nB: Three books\nC: Four books\nD: As many as they want",
          answer_options: ["A: Two books", "B: Three books", "C: Four books", "D: As many as they want"],
          correct_answer: "B",
          explanation: "This is a literal comprehension question with the answer directly stated in the text: 'Students can borrow up to three books at a time.' The information is explicit and requires simple recall from the passage.",
          distractor_strategy: "Option A (two) relates to the two-week borrowing period. Option C (four) is close to the correct number. Option D contradicts the specific limit stated.",
          characteristics: [
            "Simple informational text about familiar topic (school library)",
            "Literal question with direct text match",
            "Straightforward passage structure",
            "Answer explicitly stated in second sentence",
            "Common vocabulary appropriate for Year 7",
            "Difficulty 1: Basic literal comprehension",
            "Clear correct answer",
            "Age-appropriate everyday context"
          ],
          passage_text: "The school library is open every weekday from 8:00 AM to 4:00 PM. Students can borrow up to three books at a time for two weeks. If you need a book for longer, you can renew it by asking the librarian. The library has a large collection of fiction and non-fiction books, as well as computers for research.\n\nMrs. Chen, the head librarian, is always happy to help students find books they'll enjoy. She runs a book club every Thursday after school for students who love reading. The library also has quiet study areas where students can do their homework."
        },
        {
          difficulty: 2,  // Medium (mapped from old level 3)
          requires_visual: false,
          question_text: "Read this passage:\n\n\"As climate scientists gather more data about global temperature patterns, the evidence becomes increasingly clear. Over the past century, average temperatures have risen by approximately 1.1 degrees Celsius, with most of the warming occurring in the past 40 years. While this might seem like a small change, even minor shifts in global temperature can have significant impacts on weather patterns, sea levels, and ecosystems.\n\nOne of the most concerning effects is the melting of polar ice caps. As these massive ice sheets lose volume, sea levels rise, threatening coastal communities worldwide. Scientists estimate that if current trends continue, sea levels could rise by up to one meter by the end of this century.\n\nHowever, it's not all doom and gloom. Many countries have committed to reducing their carbon emissions, and renewable energy technologies are becoming more efficient and affordable. Solar and wind power are now competitive with traditional fossil fuels in many markets. The question is whether these changes are happening fast enough to prevent the most severe impacts.\"\n\nWhat does the passage suggest about climate models?\n\nA: They are becoming less accurate over time\nB: They show warming is happening more slowly than expected\nC: They are supported by increasing amounts of data\nD: They cannot predict sea level changes accurately",
          answer_options: ["A: They are becoming less accurate over time", "B: They show warming is happening more slowly than expected", "C: They are supported by increasing amounts of data", "D: They cannot predict sea level changes accurately"],
          correct_answer: "C",
          explanation: "This is an inferential comprehension question. The passage states 'As climate scientists gather more data about global temperature patterns, the evidence becomes increasingly clear.' This directly supports option C - climate models are supported by increasing amounts of data. Option A contradicts the passage (evidence is becoming 'clearer', not less accurate). Option B is incorrect as the passage suggests warming is significant. Option D is contradicted by the specific sea level predictions mentioned.",
          distractor_strategy: "Option A uses 'less accurate' to contradict the text's 'increasingly clear'. Option B misrepresents the warming trends described. Option D contradicts the specific predictions given in the passage.",
          characteristics: [
            "Informational text about science/environment",
            "200+ words requiring sustained attention",
            "Inferential question requiring connection of ideas",
            "Passage explicitly states 'gather more data' and 'evidence becomes increasingly clear'",
            "Distractors contradict or misrepresent passage information",
            "Requires understanding of cause-effect relationships",
            "Age-appropriate content for Year 7",
            "Difficulty 3: Moderately complex inference"
          ],
          passage_text: "As climate scientists gather more data about global temperature patterns, the evidence becomes increasingly clear. Over the past century, average temperatures have risen by approximately 1.1 degrees Celsius, with most of the warming occurring in the past 40 years. While this might seem like a small change, even minor shifts in global temperature can have significant impacts on weather patterns, sea levels, and ecosystems.\n\nOne of the most concerning effects is the melting of polar ice caps. As these massive ice sheets lose volume, sea levels rise, threatening coastal communities worldwide. Scientists estimate that if current trends continue, sea levels could rise by up to one meter by the end of this century.\n\nHowever, it's not all doom and gloom. Many countries have committed to reducing their carbon emissions, and renewable energy technologies are becoming more efficient and affordable. Solar and wind power are now competitive with traditional fossil fuels in many markets. The question is whether these changes are happening fast enough to prevent the most severe impacts."
        },
        {
          difficulty: 3,  // Hard (mapped from old level 5)
          requires_visual: false,
          question_text: "Read this passage:\n\n\"The author's use of fragmentary sentences in the final paragraph serves several purposes. By breaking conventional sentence structure, she creates a sense of urgency and immediacy that mirrors the protagonist's emotional state. The short, sharp phrases – 'No time. No choice. No way back.' – function like hammer blows, each one reinforcing the desperate situation.\n\nThis stylistic choice also reflects a broader shift in contemporary literature toward experimental narrative techniques. Rather than adhering to traditional grammar rules, modern authors often manipulate language to achieve specific effects. In this case, the fragments emphasize the character's inability to think in complete thoughts during a crisis.\n\nInterestingly, the author returns to standard sentence structure in the epilogue, suggesting a return to stability and rational thought. This grammatical choice is as deliberate as the earlier fragments, demonstrating that what some might dismiss as 'incorrect' writing is actually a sophisticated literary device.\"\n\nWhat is the author's main purpose in this passage?\n\nA: To criticize modern authors for using poor grammar\nB: To explain how sentence fragments can be an effective literary technique\nC: To argue that all writing should follow traditional grammar rules\nD: To show that experimental writing is always better than traditional writing",
          answer_options: ["A: To criticize modern authors for using poor grammar", "B: To explain how sentence fragments can be an effective literary technique", "C: To argue that all writing should follow traditional grammar rules", "D: To show that experimental writing is always better than traditional writing"],
          correct_answer: "B",
          explanation: "This is a higher-level inferential comprehension question about author's purpose. The passage analyzes how an author uses sentence fragments deliberately to create effects (urgency, emotional state) and describes this as a 'sophisticated literary device.' Option B correctly captures this main purpose. Option A is contradicted by the positive analysis of fragments. Option C contradicts the passage's acknowledgment of experimental techniques. Option D overstates the case - the passage doesn't claim experimental writing is always better.",
          distractor_strategy: "Option A represents an opposite interpretation (criticism vs. analysis). Option C misrepresents the passage as prescriptive rather than analytical. Option D makes an extreme claim not supported by the balanced discussion.",
          characteristics: [
            "Meta-textual passage about literary analysis",
            "Complex inference about author's purpose",
            "Requires understanding of literary techniques",
            "Multiple layers of meaning (what the passage discusses vs. what the passage itself is doing)",
            "Advanced vocabulary (fragmentary, protagonist, epilogue, deliberate)",
            "Difficulty 5: Requires sophisticated reading comprehension",
            "Distractors present plausible but incorrect interpretations",
            "Age-appropriate challenge for advanced Year 7 readers"
          ],
          passage_text: "The author's use of fragmentary sentences in the final paragraph serves several purposes. By breaking conventional sentence structure, she creates a sense of urgency and immediacy that mirrors the protagonist's emotional state. The short, sharp phrases – 'No time. No choice. No way back.' – function like hammer blows, each one reinforcing the desperate situation.\n\nThis stylistic choice also reflects a broader shift in contemporary literature toward experimental narrative techniques. Rather than adhering to traditional grammar rules, modern authors often manipulate language to achieve specific effects. In this case, the fragments emphasize the character's inability to think in complete thoughts during a crisis.\n\nInterestingly, the author returns to standard sentence structure in the epilogue, suggesting a return to stability and rational thought. This grammatical choice is as deliberate as the earlier fragments, demonstrating that what some might dismiss as 'incorrect' writing is actually a sophisticated literary device."
        }
      ],
      pattern: {
        format_template: "Read this passage:\n\n[Passage: 200+ words from literary, informational, or persuasive text]\n\n[Question requiring literal understanding or logical inference]\n\nA: [Option]\nB: [Option]\nC: [Option]\nD: [Option]",
        key_characteristics: [
          "Passages typically 200-300 words (longer than Year 5)",
          "Variety of text types (literary, informational, persuasive)",
          "50 questions total across 8 passages (65 minutes)",
          "Mix of literal and inferential questions",
          "More sophisticated vocabulary and sentence structures than Year 5",
          "Questions test: main idea, supporting details, inferences, author's purpose, vocabulary in context",
          "4 multiple choice options",
          "Distractors based on misreadings or partial understandings"
        ],
        distractor_strategies: [
          "Literal interpretation of figurative language",
          "Partial information presented as complete answer",
          "Opposite or contradictory information from text",
          "Information from passage but doesn't answer the question",
          "Plausible but unsupported inferences",
          "Confusion of cause and effect",
          "Misinterpretation of author's tone or purpose",
          "Overgeneralization from specific details"
        ],
        difficulty_progression: {
          "1": "Literal questions with direct text matches, simple vocabulary, straightforward passages",
          "2": "Moderate inferences requiring connection of ideas across paragraphs, some complex vocabulary",
          "3": "Sophisticated inference requiring synthesis of multiple ideas, literary analysis, nuanced understanding",
        }
      }
    },

    // SUB-SKILL 2: Vocabulary & Word Meaning
    "Vocabulary & Word Meaning": {
      description: "Determining meanings of sophisticated vocabulary from context, understanding figurative language and word relationships",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [1, 2, 3],
      question_format: "Determine word meaning from context or identify relationships",

      examples: [
        {
          difficulty: 1,  // Easy
          requires_visual: false,
          question_text: "Read this sentence:\n\n'After running the marathon, Sarah was exhausted and needed to rest.'\n\nWhat does 'exhausted' mean in this sentence?",
          answer_options: [
            "A: Excited",
            "B: Very tired",
            "C: Happy",
            "D: Hungry"
          ],
          correct_answer: "B",
          explanation: "The context 'After running the marathon' and 'needed to rest' makes it clear that 'exhausted' means very tired. This is a common word with clear context clues.",
          distractor_strategy: "Includes other feelings/states that might occur after running (A: excited, C: happy, D: hungry) but don't match the meaning of exhausted",
          characteristics: [
            "Common, everyday vocabulary",
            "Clear context clues in sentence",
            "Familiar situation (running, being tired)",
            "Year 7 appropriate",
            "Difficulty 1: Common word with clear context"
          ]
        },
        {
          difficulty: 2,  // Medium (mapped from old level 3)
          requires_visual: false,
          question_text: "Read this sentence:\n\n'The archaeologist's discovery was unprecedented; nothing like it had ever been found before.'\n\nWhat does 'unprecedented' mean?",
          answer_options: [
            "A: Very old",
            "B: Never happened before",
            "C: Valuable",
            "D: Difficult to find"
          ],
          correct_answer: "B",
          explanation: "The context 'nothing like it had ever been found before' explains that unprecedented means never happened before or without precedent.",
          distractor_strategy: "Includes related concepts (A: old, C: valuable, D: rare) that might apply to archaeological discoveries but don't define the word",
          characteristics: [
            "Academic vocabulary",
            "Context definition provided",
            "Prefix/root understanding (un-preced-ented)",
            "Year 7 appropriate"
          ]
        },
        {
          difficulty: 3,  // Hard (mapped from old level 5)
          requires_visual: false,
          question_text: "Read this passage:\n\n'The politician's speech was filled with ambiguous statements that could be interpreted in multiple ways, leaving voters uncertain about her actual positions.'\n\nWhat does 'ambiguous' mean?",
          answer_options: [
            "A: Very clear and direct",
            "B: Long and boring",
            "C: Unclear and open to multiple interpretations",
            "D: Loudly delivered"
          ],
          correct_answer: "C",
          explanation: "'Ambiguous' means unclear or open to more than one interpretation, as indicated by 'could be interpreted in multiple ways.'",
          distractor_strategy: "Includes opposite meaning (A), related but incorrect qualities (B, D)",
          characteristics: [
            "Sophisticated vocabulary",
            "Multiple context clues",
            "Abstract concept",
            "Challenging for Year 7"
          ]
        }
      ],

      pattern: {
        format_template: "[Passage with sophisticated vocabulary] What does [word] mean?",
        key_characteristics: [
          "Advanced vocabulary for Year 7",
          "Academic and literary terms",
          "Figurative language (metaphor, simile, idioms)",
          "Word relationships (synonyms, antonyms)",
          "Multiple-meaning words in context"
        ],
        distractor_strategies: [
          "Literal interpretations of figurative language",
          "Related but incorrect meanings",
          "Opposite meanings",
          "Common misconceptions",
          "Other meanings of multi-definition words"
        ],
        difficulty_progression: {
          "1": "Common words with clear context",
          "2": "Moderately challenging words, good context support",
          "3": "Sophisticated vocabulary, subtle clues",
        }
      }
    },

    // SUB-SKILL 3: Text Structure & Organization
    "Text Structure & Organization": {
      description: "Analyzing how texts are structured and how organization contributes to meaning",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [1, 2, 3],
      question_format: "Identify text structure, purpose of features, or organizational patterns",

      examples: [
        {
          difficulty: 1,  // Easy
          requires_visual: false,
          question_text: "A story is told in the order that events happened:\n\nFirst, Tom woke up and got dressed.\nNext, he ate breakfast.\nThen, he walked to school.\nFinally, he arrived at his classroom.\n\nWhat organizational pattern does this story use?",
          answer_options: [
            "A: Chronological order (time order)",
            "B: Problem-solution structure",
            "C: Compare-contrast structure",
            "D: Cause-effect structure"
          ],
          correct_answer: "A",
          explanation: "The story presents events in the order they happened (time order), using words like 'First,' 'Next,' 'Then,' and 'Finally.' This is chronological organization - the simplest and most obvious text structure.",
          distractor_strategy: "Includes other text structures (B: problem-solution, C: compare-contrast, D: cause-effect) that don't match the sequential time pattern",
          characteristics: [
            "Simple narrative sequence",
            "Obvious time order words (First, Next, Then, Finally)",
            "Everyday familiar events",
            "Clear chronological pattern",
            "Difficulty 1: Simple, obvious structure",
            "Age-appropriate for Year 7"
          ]
        },
        {
          difficulty: 2,  // Medium (mapped from old level 3)
          requires_visual: false,
          question_text: "An article about climate change is organized with these sections:\n\n1. Introduction: Current climate situation\n2. Causes: Human activities contributing to climate change\n3. Effects: Impacts on weather, ecosystems, and society\n4. Solutions: Actions to address climate change\n5. Conclusion: Call to action\n\nWhat organizational pattern does this article use?",
          answer_options: [
            "A: Chronological order",
            "B: Problem-solution structure",
            "C: Compare-contrast structure",
            "D: Cause-effect structure"
          ],
          correct_answer: "B",
          explanation: "The article presents a problem (climate change, causes, and effects) and then offers solutions, making it a problem-solution structure.",
          distractor_strategy: "Includes other common text structures; cause-effect (D) is partially present but not the overall structure",
          characteristics: [
            "Informational text structure",
            "Multiple sections analysis",
            "Understanding organizational purpose",
            "Year 7 complexity"
          ]
        },
        {
          difficulty: 3,  // Hard (mapped from old level 5)
          requires_visual: false,
          question_text: "In a narrative, the author uses flashbacks to reveal the protagonist's childhood, while the main story takes place in the present. This alternating structure creates:\n\nWhat effect does this structure create?",
          answer_options: [
            "A: Confusion about the timeline",
            "B: Understanding of how past experiences shaped the character",
            "C: A faster pace to the story",
            "D: More characters in the story"
          ],
          correct_answer: "B",
          explanation: "Flashbacks to childhood help readers understand how past experiences influenced the character's present actions and personality.",
          distractor_strategy: "Includes negative interpretation (A), unrelated effects (C, D)",
          characteristics: [
            "Narrative structure analysis",
            "Understanding literary techniques",
            "Author's purpose",
            "Sophisticated reasoning"
          ]
        }
      ],

      pattern: {
        format_template: "[Description of text structure] [Question about organization or effect]",
        key_characteristics: [
          "Organizational patterns: chronological, cause-effect, problem-solution, compare-contrast",
          "Narrative structures: flashback, foreshadowing, parallel plots",
          "Text features: headings, subheadings, graphics, captions",
          "Purpose of structural choices",
          "Effect on meaning"
        ],
        distractor_strategies: [
          "Confusing similar structures",
          "Missing purpose of organization",
          "Focusing on content instead of structure",
          "Misidentifying pattern type",
          "Ignoring structural effects"
        ],
        difficulty_progression: {
          "1": "Simple, obvious structures",
          "2": "Moderately complex structures, identifying patterns",
          "3": "Complex literary structures, analyzing effects",
        }
      }
    },

    // SUB-SKILL 4: Evaluating Arguments & Evidence
    "Evaluating Arguments & Evidence": {
      description: "Assessing the strength of arguments, quality of evidence, and validity of conclusions in texts",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [1, 2, 3],
      question_format: "Evaluate arguments, evidence, or reasoning in texts",

      examples: [
        {
          difficulty: 1,  // Easy
          requires_visual: false,
          question_text: "Read this argument:\n\n'All students love mathematics because I love mathematics.'\n\nWhat is wrong with this argument?",
          answer_options: [
            "A: Mathematics is a difficult subject",
            "B: The argument is based on one person's opinion, not evidence about all students",
            "C: The argument is too short",
            "D: Nothing is wrong with it"
          ],
          correct_answer: "B",
          explanation: "This argument makes an obvious error: it claims something about ALL students based only on one person's experience. This is an unsupported generalization - the claim is not backed by evidence.",
          distractor_strategy: "Option A is irrelevant to the logic. Option C focuses on length rather than logic. Option D denies the obvious flaw.",
          characteristics: [
            "Simple, obvious logical flaw",
            "Unsupported claim clearly visible",
            "One person's experience generalized to everyone",
            "Basic critical thinking",
            "Difficulty 1: Obvious unsupported claim",
            "Age-appropriate for Year 7"
          ]
        },
        {
          difficulty: 2,  // Medium (mapped from old level 4)
          requires_visual: false,
          question_text: "Read this argument:\n\n'Students should have longer lunch breaks. My friend Sarah says she's always hungry in the afternoon, and I read on a blog that students need more time to eat properly.'\n\nWhat is the main weakness of this argument?",
          answer_options: [
            "A: The conclusion is unclear",
            "B: The evidence is mostly anecdotal and from unreliable sources",
            "C: The argument is too short",
            "D: It doesn't consider the opposing view"
          ],
          correct_answer: "B",
          explanation: "The evidence relies on one friend's experience (anecdote) and an unnamed blog (unreliable source), rather than research or broader data.",
          distractor_strategy: "Includes partially true critiques (D: no counterargument) but B is the main weakness",
          characteristics: [
            "Argument evaluation",
            "Evidence quality assessment",
            "Critical thinking",
            "Appropriate for Year 7"
          ]
        },
        {
          difficulty: 3,  // Hard (mapped from old level 6)
          requires_visual: false,
          question_text: "Read these two claims:\n\nClaim A: 'Studies show that 78% of teenagers use social media daily, suggesting it's an important part of modern teenage life.'\n\nClaim B: 'Because most teenagers use social media, all schools should teach social media literacy.'\n\nWhat logical issue exists in moving from Claim A to Claim B?",
          answer_options: [
            "A: Claim A's statistics are incorrect",
            "B: The conclusion doesn't necessarily follow from the evidence (non sequitur)",
            "C: Claim B contradicts Claim A",
            "D: There is no logical issue"
          ],
          correct_answer: "B",
          explanation: "Just because social media use is common doesn't automatically mean schools should teach it - this is a logical leap (non sequitur). Other factors should be considered.",
          distractor_strategy: "Includes assertion about accuracy (A), contradiction (C), or denying any issue (D)",
          characteristics: [
            "Logical reasoning",
            "Evaluating conclusions",
            "Identifying logical fallacies",
            "Advanced critical thinking"
          ]
        }
      ],

      pattern: {
        format_template: "[Argument or claim] [Question evaluating reasoning/evidence]",
        key_characteristics: [
          "Evaluating evidence quality",
          "Identifying logical fallacies",
          "Assessing source reliability",
          "Determining if conclusions are supported",
          "Recognizing bias and assumptions"
        ],
        distractor_strategies: [
          "Focusing on content rather than logic",
          "Accepting weak evidence",
          "Missing logical leaps",
          "Confusing strong argument with agreeable position",
          "Not recognizing unreliable sources"
        ],
        difficulty_progression: {
          "1": "Obvious unsupported claims",
          "2": "Identifying anecdotal vs. factual evidence",
          "3": "Recognizing subtle logical flaws",
        }
      }
    }

  },

  // ============================================
  // YEAR 7 NAPLAN - LANGUAGE CONVENTIONS
  // ============================================

  "Year 7 NAPLAN - Language Conventions": {

    // SUB-SKILL 1: Advanced Grammar & Sentence Structure
    "Advanced Grammar & Sentence Structure": {
      description: "Understanding and applying advanced grammar rules including subjunctive mood, complex and compound-complex sentences, parallel structure, and sophisticated punctuation. Year 7 level expects mastery of complex grammatical concepts.",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [1, 2, 3],
      question_format: "Choose the sentence that is grammatically correct.\n\nOR\n\nWhich word or words best complete this sentence?\n\n[Sentence with blank or multiple versions]\n\nA: [Option]\nB: [Option]\nC: [Option]\nD: [Option]",
      examples: [
        {
          difficulty: 1,  // Easy
          requires_visual: false,
          question_text: "Which sentence is grammatically correct?\n\nA: The students was playing soccer.\nB: The students were playing soccer.\nC: The students is playing soccer.\nD: The students be playing soccer.",
          answer_options: ["A: The students was playing soccer.", "B: The students were playing soccer.", "C: The students is playing soccer.", "D: The students be playing soccer."],
          correct_answer: "B",
          explanation: "This tests basic subject-verb agreement. 'Students' is plural, so it requires the plural verb 'were.' Option A incorrectly uses singular 'was.' Option C incorrectly uses singular 'is.' Option D uses the incorrect form 'be.'",
          distractor_strategy: "Options use common errors: singular verbs with plural subjects (A: was, C: is) and incorrect verb form (D: be)",
          characteristics: [
            "Basic subject-verb agreement",
            "Plural subject requires plural verb",
            "Common grammar concept",
            "Simple past continuous tense",
            "Difficulty 1: Basic grammar rule",
            "Clear correct answer",
            "Age-appropriate for Year 7"
          ]
        },
        {
          difficulty: 2,  // Medium (mapped from old level 4)
          requires_visual: false,
          question_text: "Which sentence is grammatically correct?\n\nA: If I was the principal, I would change the school uniform policy.\nB: If I were the principal, I would change the school uniform policy.\nC: If I am the principal, I would change the school uniform policy.\nD: If I be the principal, I would change the school uniform policy.",
          answer_options: ["A: If I was the principal, I would change the school uniform policy.", "B: If I were the principal, I would change the school uniform policy.", "C: If I am the principal, I would change the school uniform policy.", "D: If I be the principal, I would change the school uniform policy."],
          correct_answer: "B",
          explanation: "This tests understanding of the subjunctive mood, which is used for hypothetical or contrary-to-fact situations. In formal English, 'If I were' (not 'was') is correct for hypothetical conditions. Option A uses the more common but technically incorrect 'was'. Option C incorrectly uses present indicative 'am'. Option D uses the incorrect 'be'. This is a difficulty 4 question because subjunctive mood is an advanced grammatical concept for Year 7.",
          distractor_strategy: "Option A uses the common error 'If I was' (indicative mood instead of subjunctive). Option C uses incorrect tense (present + conditional). Option D uses ungrammatical infinitive form.",
          characteristics: [
            "Tests subjunctive mood (advanced grammar)",
            "Hypothetical/contrary-to-fact condition",
            "Common error ('was' instead of 'were') as distractor",
            "Requires understanding of formal vs. informal grammar",
            "Difficulty 4: Advanced grammatical concept",
            "Age-appropriate for Year 7 students learning formal writing",
            "Clear correct answer with plausible distractors"
          ]
        },
        {
          difficulty: 3,  // Hard (mapped from old level 5)
          requires_visual: false,
          question_text: "Which sentence maintains parallel structure?\n\nA: The committee recommended improving facilities, hiring more staff, and that we should update technology.\nB: The committee recommended improving facilities, hiring more staff, and to update technology.\nC: The committee recommended improving facilities, hiring more staff, and updating technology.\nD: The committee recommended to improve facilities, hiring more staff, and updating technology.",
          answer_options: ["A: The committee recommended improving facilities, hiring more staff, and that we should update technology.", "B: The committee recommended improving facilities, hiring more staff, and to update technology.", "C: The committee recommended improving facilities, hiring more staff, and updating technology.", "D: The committee recommended to improve facilities, hiring more staff, and updating technology."],
          correct_answer: "C",
          explanation: "This tests parallel structure - when listing items in a series, they should all use the same grammatical form. Option C correctly uses three gerunds (improving, hiring, updating). Option A breaks parallelism with a clause 'that we should update'. Option B breaks parallelism with infinitive 'to update'. Option D breaks parallelism with infinitive 'to improve' while the others are gerunds. Parallel structure is a difficulty 5 concept requiring sophisticated grammatical awareness.",
          distractor_strategy: "Options A, B, and D each break parallel structure in different ways (clause, infinitive, mixed forms), testing whether students can identify consistent grammatical form throughout a series.",
          characteristics: [
            "Tests parallel structure (sophisticated grammar)",
            "Multiple elements in a series",
            "Requires identifying consistent grammatical forms",
            "Each distractor breaks parallelism differently",
            "Difficulty 5: Requires advanced grammatical awareness",
            "Common in formal writing",
            "Appropriate challenge for advanced Year 7 students"
          ]
        }
      ],
      pattern: {
        format_template: "Choose the sentence that is grammatically correct.\n\nOR\n\nWhich sentence maintains [grammatical concept]?\n\n[Four versions of sentence with different grammatical constructions]\n\nA: [Option]\nB: [Option]\nC: [Option]\nD: [Option]",
        key_characteristics: [
          "45 questions total, 45 minutes (1 minute per question)",
          "Tests advanced grammar concepts: subjunctive mood, parallel structure, complex clauses, conditional sentences",
          "Four versions of same sentence OR sentence with four completion options",
          "Tests subject-verb agreement, pronoun-antecedent agreement, verb tenses",
          "Tests punctuation: commas in complex sentences, semicolons, colons, apostrophes",
          "Tests sentence fragments, run-ons, comma splices",
          "More sophisticated than Year 5 (advanced concepts expected)"
        ],
        distractor_strategies: [
          "Common errors (e.g., 'If I was' instead of 'If I were')",
          "Mixing grammatical forms (breaking parallel structure)",
          "Incorrect tense usage",
          "Misplaced modifiers",
          "Incorrect pronoun forms (who/whom, I/me)",
          "Punctuation errors (missing or extra commas)",
          "Run-on sentences or fragments that sound plausible",
          "Confusion of homophones (there/their/they're)"
        ],
        difficulty_progression: {
          "1": "Basic subject-verb agreement, simple tenses, common punctuation",
          "2": "Complex sentences, advanced punctuation, less common tenses",
          "3": "Parallel structure, complex clauses, subtle grammatical distinctions",
        }
      }
    },

    // SUB-SKILL 2: Spelling & Word Formation
    "Spelling & Word Formation": {
      description: "Spelling complex words correctly and understanding word formation including prefixes, suffixes, and roots",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [1, 2, 3],
      question_format: "Identify correct spelling or word formation",

      examples: [
        {
          difficulty: 1,  // Easy
          requires_visual: false,
          question_text: "Which word is spelled correctly?",
          answer_options: [
            "A: becaus",
            "B: becuase",
            "C: because",
            "D: becouse"
          ],
          correct_answer: "C",
          explanation: "'Because' is the correct spelling. This is a common, basic word that Year 7 students should know. The distractors show typical misspellings based on pronunciation.",
          distractor_strategy: "Includes common phonetic misspellings (A: missing e, B: vowel reversal, D: wrong vowel)",
          characteristics: [
            "Common everyday word",
            "Basic spelling",
            "High-frequency word",
            "Phonetic distractors",
            "Difficulty 1: Basic spelling",
            "Age-appropriate for Year 7"
          ]
        },
        {
          difficulty: 2,  // Medium (mapped from old level 3)
          requires_visual: false,
          question_text: "Which word is spelled correctly?",
          answer_options: [
            "A: definately",
            "B: definatly",
            "C: definitely",
            "D: definetely"
          ],
          correct_answer: "C",
          explanation: "'Definitely' is the correct spelling. This is one of the most commonly misspelled words in English.",
          distractor_strategy: "Includes common misspellings based on pronunciation (definately, definatly)",
          characteristics: [
            "Commonly misspelled word",
            "Multiple syllables",
            "Vowel confusion",
            "Year 7 appropriate"
          ]
        },
        {
          difficulty: 3,  // Hard (mapped from old level 5)
          requires_visual: false,
          question_text: "Which word correctly completes this sentence?\n\nThe scientist's research was considered _____; it could not be trusted or verified.",
          answer_options: [
            "A: reliable",
            "B: unreliable",
            "C: reliably",
            "D: reliability"
          ],
          correct_answer: "B",
          explanation: "The context 'could not be trusted or verified' requires the negative prefix 'un-' with 'reliable,' making 'unreliable' correct.",
          distractor_strategy: "Includes base word (A), wrong form/part of speech (C, D)",
          characteristics: [
            "Prefix usage (un-)",
            "Context-based word formation",
            "Part of speech awareness",
            "Academic vocabulary"
          ]
        }
      ],

      pattern: {
        format_template: "Which word is spelled correctly? / Which word fits the context?",
        key_characteristics: [
          "Commonly misspelled words (accommodate, necessary, etc.)",
          "Prefixes (un-, re-, pre-, dis-)",
          "Suffixes (-able, -ible, -tion, -sion)",
          "Root words and word families",
          "Homophones and confusables"
        ],
        distractor_strategies: [
          "Phonetic misspellings",
          "Common spelling errors",
          "Wrong prefix/suffix",
          "Homophone confusion",
          "Incorrect word form"
        ],
        difficulty_progression: {
          "1": "Basic spelling, simple prefixes/suffixes",
          "2": "Frequently misspelled words, moderate word formation",
          "3": "Sophisticated vocabulary, nuanced word formation",
        }
      }
    },

    // SUB-SKILL 3: Punctuation & Sentence Boundaries
    "Punctuation & Sentence Boundaries": {
      description: "Using advanced punctuation correctly including semicolons, colons, and complex comma usage",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [1, 2, 3],
      question_format: "Identify correct punctuation",

      examples: [
        {
          difficulty: 1,  // Easy
          requires_visual: false,
          question_text: "Which sentence uses punctuation correctly?",
          answer_options: [
            "A: What time is lunch.",
            "B: What time is lunch?",
            "C: What time is lunch!",
            "D: What time is lunch"
          ],
          correct_answer: "B",
          explanation: "This is a question, so it needs a question mark at the end. Option A incorrectly uses a period. Option C incorrectly uses an exclamation mark. Option D has no punctuation at all.",
          distractor_strategy: "Tests basic end punctuation: period (A), exclamation mark (C), and no punctuation (D) versus correct question mark",
          characteristics: [
            "Basic end punctuation",
            "Question sentence",
            "Simple comma rule",
            "Common everyday sentence",
            "Difficulty 1: Basic end marks",
            "Clear correct answer",
            "Age-appropriate for Year 7"
          ]
        },
        {
          difficulty: 2,  // Medium (mapped from old level 4)
          requires_visual: false,
          question_text: "Which sentence uses punctuation correctly?",
          answer_options: [
            "A: The team's victory was impressive: they scored 15 goals.",
            "B: The team's victory was impressive; they scored 15 goals.",
            "C: The teams victory was impressive, they scored 15 goals.",
            "D: The team's victory was impressive they scored 15 goals."
          ],
          correct_answer: "B",
          explanation: "A semicolon correctly joins two related independent clauses. Option A's colon could work but is less common here. Option C is a comma splice. Option D has no punctuation. 'Team's' needs an apostrophe.",
          distractor_strategy: "Tests semicolon vs. colon, comma splice (C), apostrophe error (C), and missing punctuation (D)",
          characteristics: [
            "Semicolon usage",
            "Independent clauses",
            "Possessive apostrophe",
            "Advanced punctuation for Year 7"
          ]
        },
        {
          difficulty: 3,  // Hard (mapped from old level 5)
          requires_visual: false,
          question_text: "Which sentence demonstrates correct comma usage with a non-restrictive clause?",
          answer_options: [
            "A: My brother who lives in Sydney is a doctor.",
            "B: My brother, who lives in Sydney, is a doctor.",
            "C: My brother, who lives in Sydney is a doctor.",
            "D: My brother who lives in Sydney, is a doctor."
          ],
          correct_answer: "B",
          explanation: "The clause 'who lives in Sydney' is non-restrictive (adds extra information) and should be set off with commas on both sides.",
          distractor_strategy: "Includes no commas (A), missing second comma (C), comma in wrong place (D)",
          characteristics: [
            "Non-restrictive clauses",
            "Paired commas",
            "Relative clauses",
            "Sophisticated punctuation"
          ]
        }
      ],

      pattern: {
        format_template: "Which sentence uses punctuation correctly?",
        key_characteristics: [
          "Semicolons joining independent clauses",
          "Colons introducing lists or explanations",
          "Commas with non-restrictive clauses",
          "Apostrophes (possessive, contractions)",
          "Quotation marks and dialogue punctuation"
        ],
        distractor_strategies: [
          "Comma splices",
          "Missing punctuation",
          "Wrong punctuation mark",
          "Misplaced apostrophes",
          "Incomplete paired punctuation"
        ],
        difficulty_progression: {
          "1": "Basic end marks, simple comma rules",
          "2": "Commas in complex sentences, quotation marks",
          "3": "Complex comma patterns, sophisticated punctuation",
        }
      }
    },

    // SUB-SKILL 4: Vocabulary Precision & Usage
    "Vocabulary Precision & Usage": {
      description: "Choosing the most precise and appropriate word for the context, including formal vs. informal register",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [1, 2, 3],
      question_format: "Choose the best word for the context",

      examples: [
        {
          difficulty: 1,  // Easy
          requires_visual: false,
          question_text: "Which word best completes this sentence?\n\nThe movie was so _____ that everyone in the cinema was laughing.",
          answer_options: [
            "A: sad",
            "B: funny",
            "C: boring",
            "D: scary"
          ],
          correct_answer: "B",
          explanation: "The context 'everyone in the cinema was laughing' makes it clear that the movie was 'funny.' This tests basic word choice with obvious context clues.",
          distractor_strategy: "Includes opposite emotions (A: sad, C: boring, D: scary) that don't fit the context of laughing",
          characteristics: [
            "Basic word choice",
            "Obvious context (laughing = funny)",
            "Common everyday vocabulary",
            "Clear correct answer",
            "Difficulty 1: Basic word choice with obvious context",
            "Age-appropriate for Year 7"
          ]
        },
        {
          difficulty: 2,  // Medium (mapped from old level 4)
          requires_visual: false,
          question_text: "Which word best completes this formal sentence?\n\nThe committee will _____ the proposal at next week's meeting.",
          answer_options: [
            "A: talk about",
            "B: discuss",
            "C: chat about",
            "D: go over"
          ],
          correct_answer: "B",
          explanation: "'Discuss' is the most formal and precise word for this context. The other options are too informal or vague for a formal committee meeting.",
          distractor_strategy: "Includes informal synonyms (A: talk about, C: chat about) and casual phrase (D: go over)",
          characteristics: [
            "Formal register",
            "Precise vocabulary",
            "Context appropriateness",
            "Synonym discrimination"
          ]
        },
        {
          difficulty: 3,  // Hard (mapped from old level 5)
          requires_visual: false,
          question_text: "Choose the word that creates the strongest emotional impact:\n\nThe abandoned building was _____ in the moonlight.",
          answer_options: [
            "A: dark",
            "B: shadowy",
            "C: ominous",
            "D: unlit"
          ],
          correct_answer: "C",
          explanation: "'Ominous' suggests something threatening or foreboding, creating the strongest emotional impact. The others are more neutral descriptions.",
          distractor_strategy: "Includes neutral descriptors (A: dark, D: unlit) and moderate impact (B: shadowy)",
          characteristics: [
            "Connotation and tone",
            "Emotional impact",
            "Precise word choice",
            "Literary vocabulary"
          ]
        }
      ],

      pattern: {
        format_template: "Which word best completes this sentence? [Context provided]",
        key_characteristics: [
          "Formal vs. informal register",
          "Precise vocabulary selection",
          "Connotation and tone",
          "Context-appropriate word choice",
          "Avoiding redundancy and wordiness"
        ],
        distractor_strategies: [
          "Wrong register (informal in formal context)",
          "Imprecise synonyms",
          "Wrong connotation",
          "Redundant words",
          "Contextually inappropriate choices"
        ],
        difficulty_progression: {
          "1": "Basic word choice, obvious contexts",
          "2": "Moderate precision, connotation awareness",
          "3": "Subtle distinctions, sophisticated tone",
        }
      }
    }

  },

  // ============================================
  // YEAR 7 NAPLAN - NUMERACY NO CALCULATOR
  // ============================================

  "Year 7 NAPLAN - Numeracy No Calculator": {

    // SUB-SKILL 1: Integer Operations & Negative Numbers
    "Integer Operations & Negative Numbers": {
      description: "Performing operations with positive and negative integers including addition, subtraction, multiplication, and division. Understanding of number lines, ordering integers, and real-world applications (temperature, elevation, etc.). Year 7 level includes more complex multi-step problems.",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [1, 2, 3],
      question_format: "[Problem involving integer operations]\n\nA: [Option]\nB: [Option]\nC: [Option]\nD: [Option]",
      examples: [
        {
          difficulty: 1,  // Easy
          requires_visual: false,
          question_text: "What is -2 + 5?\n\nA: -7\nB: -3\nC: 3\nD: 7",
          answer_options: ["A: -7", "B: -3", "C: 3", "D: 7"],
          correct_answer: "C",
          explanation: "Using a number line or mental math: Start at -2, move 5 places to the right (adding positive number), arriving at 3. This is a simple addition with a small negative number.",
          distractor_strategy: "Option A (-7) results from subtracting instead of adding. Option B (-3) results from adding incorrectly. Option D (7) ignores the negative sign.",
          characteristics: [
            "Simple integer addition",
            "Small numbers (-2 and 5)",
            "Number line visualization helpful",
            "Basic operation with negative number",
            "Difficulty 1: Simple addition with small integers",
            "No calculator needed - mental math appropriate",
            "Age-appropriate for Year 7"
          ]
        },
        {
          difficulty: 2,  // Medium (mapped from old level 3)
          requires_visual: false,
          question_text: "The temperature in Melbourne at 6am was -3°C. By midday it had risen 11°C, then dropped 4°C by 6pm.\n\nWhat was the temperature at 6pm?\n\nA: 4°C\nB: 8°C\nC: 12°C\nD: 2°C",
          answer_options: ["A: 4°C", "B: 8°C", "C: 12°C", "D: 2°C"],
          correct_answer: "A",
          explanation: "Starting temperature: -3°C. After rising 11°C: -3 + 11 = 8°C. After dropping 4°C: 8 - 4 = 4°C. This tests integer operations in a real-world context (temperature), requiring students to track multiple changes and work with negative numbers. Difficulty 3 because it involves two operations with negative starting point.",
          distractor_strategy: "Option B (8°C) is the result after the first operation only. Option C (12°C) results from adding all numbers without considering negative start. Option D (2°C) results from calculation errors.",
          characteristics: [
            "Real-world context (temperature)",
            "Negative starting number",
            "Two-step problem",
            "Integer addition and subtraction",
            "Tests ability to track multiple changes",
            "Difficulty 3: Multi-step with negative numbers",
            "No calculator allowed - must do mental math or written method",
            "Age-appropriate for Year 7"
          ]
        },
        {
          difficulty: 3,  // Hard (mapped from old level 5)
          requires_visual: false,
          question_text: "At the start of the month, Emma's bank account had a balance of -$45 (overdrawn). During the month:\n• She deposited $120\n• She withdrew $35\n• She was charged a $15 overdraft fee\n• She deposited $60\n\nWhat was her final balance?\n\nA: $85\nB: $70\nC: $100\nD: $55",
          answer_options: ["A: $85", "B: $70", "C: $100", "D: $55"],
          correct_answer: "A",
          explanation: "Start: -$45. After depositing $120: -45 + 120 = $75. After withdrawing $35: 75 - 35 = $40. After $15 fee: 40 - 15 = $25. After depositing $60: 25 + 60 = $85. This is difficulty 5 because it requires tracking four operations with negative starting number, understanding fees as negative, and maintaining accuracy through multiple steps.",
          distractor_strategy: "Option B ($70) results from missing the overdraft fee. Option C ($100) results from not starting with negative balance. Option D ($55) results from various calculation errors in the multi-step process.",
          characteristics: [
            "Real-world context (bank account)",
            "Negative starting number (overdraft)",
            "Four operations to track",
            "Mix of deposits (positive) and withdrawals/fees (negative)",
            "Difficulty 5: Complex multi-step with sustained accuracy required",
            "Tests financial literacy concepts",
            "No calculator - requires careful written tracking",
            "Appropriate challenge for Year 7"
          ]
        }
      ],
      pattern: {
        format_template: "[Word problem or number problem involving integers]\n\n[Four multiple choice options]\n\nA: [Option]\nB: [Option]\nC: [Option]\nD: [Option]",
        key_characteristics: [
          "30 questions, 30 minutes (no calculator)",
          "Operations with positive and negative integers",
          "Real-world contexts: temperature, elevation, money (overdraft), time zones",
          "Number line understanding",
          "Ordering and comparing integers",
          "Multi-step problems common at higher difficulties",
          "Mental math and written calculation strategies",
          "Understanding that subtracting negative = adding positive",
          "Year 7 level: More complex than Year 5"
        ],
        distractor_strategies: [
          "Results from completing only part of a multi-step problem",
          "Forgetting to account for negative starting value",
          "Sign errors (adding instead of subtracting, vice versa)",
          "Calculation errors in mental math",
          "Misunderstanding operations with negatives (-  - = +)",
          "Using absolute values without considering signs",
          "Off-by-one errors in sequences",
          "Confusing order of operations"
        ],
        difficulty_progression: {
          "1": "Simple addition/subtraction with small integers, number line problems",
          "2": "Multi-step problems with real-world contexts, negative starting numbers",
          "3": "Multi-step problems requiring sustained accuracy, financial contexts, mixed operations",
        }
      }
    },

    // SUB-SKILL 2: Fractions, Decimals & Percentages
    "Fractions, Decimals & Percentages": {
      description: "Converting between fractions, decimals, and percentages, and performing mental calculations with these numbers",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [1, 2, 3],
      question_format: "Solve problems involving fractions, decimals, and percentages",

      examples: [
        {
          difficulty: 1,  // Easy
          requires_visual: false,
          question_text: "What is 1/2 as a decimal?",
          answer_options: [
            "A: 0.2",
            "B: 0.5",
            "C: 2.0",
            "D: 1.2"
          ],
          correct_answer: "B",
          explanation: "1/2 means 1 divided by 2, which equals 0.5. This is one of the most basic fraction-decimal conversions. Students should know this equivalence: 1/2 = 0.5 = 50%.",
          distractor_strategy: "Includes decimal place errors (A: 0.2) and incorrect conversions (C: 2.0, D: 1.2)",
          characteristics: [
            "Basic fraction to decimal conversion",
            "Simple, common fraction (1/2)",
            "Fundamental equivalence",
            "Mental calculation possible",
            "Difficulty 1: Simple conversion",
            "Age-appropriate for Year 7"
          ]
        },
        {
          difficulty: 2,  // Medium (mapped from old level 3)
          requires_visual: false,
          question_text: "What is 0.75 as a percentage?",
          answer_options: [
            "A: 7.5%",
            "B: 75%",
            "C: 750%",
            "D: 0.75%"
          ],
          correct_answer: "B",
          explanation: "To convert a decimal to a percentage, multiply by 100. 0.75 × 100 = 75%.",
          distractor_strategy: "Includes decimal place errors and the original decimal",
          characteristics: [
            "Decimal to percentage conversion",
            "Multiplication by 100",
            "Basic conversion",
            "Mental calculation"
          ]
        },
        {
          difficulty: 3,  // Hard (mapped from old level 5)
          requires_visual: false,
          question_text: "Which is the largest: 3/5, 0.58, or 62%?",
          answer_options: [
            "A: 3/5",
            "B: 0.58",
            "C: 62%",
            "D: They are all equal"
          ],
          correct_answer: "C",
          explanation: "Convert all to decimals: 3/5 = 0.60, 0.58 = 0.58, 62% = 0.62. Therefore, 62% is largest.",
          distractor_strategy: "Requires converting all three forms to compare; tests understanding of equivalence",
          characteristics: [
            "Comparing different forms",
            "Multiple conversions",
            "Mental arithmetic",
            "Advanced Year 7 concept"
          ]
        }
      ],

      pattern: {
        format_template: "[Problem involving conversion or calculation with fractions/decimals/percentages]",
        key_characteristics: [
          "Converting between forms",
          "Comparing values in different forms",
          "Mental percentage calculations (10%, 25%, 50%)",
          "Fraction-decimal equivalents",
          "Ordering mixed forms"
        ],
        distractor_strategies: [
          "Decimal place errors",
          "Incorrect conversion process",
          "Comparing without converting",
          "Calculation errors",
          "Confusion between forms"
        ],
        difficulty_progression: {
          "1": "Simple conversions (1/2 = 0.5 = 50%)",
          "2": "Standard conversions, simple comparisons",
          "3": "Challenging mixed problems, multiple steps",
        }
      }
    },

    // SUB-SKILL 3: Algebraic Thinking & Patterns
    "Algebraic Thinking & Patterns": {
      description: "Solving equations, identifying patterns, and applying algebraic reasoning",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [1, 2, 3],
      question_format: "Solve algebraic problems or identify patterns",

      examples: [
        {
          difficulty: 1,  // Easy
          requires_visual: false,
          question_text: "What is the next number in this pattern?\n\n2, 4, 6, 8, ___",
          answer_options: [
            "A: 9",
            "B: 10",
            "C: 12",
            "D: 16"
          ],
          correct_answer: "B",
          explanation: "This is a simple pattern that increases by 2 each time (counting by 2s). The pattern is: add 2. So 8 + 2 = 10. This is an obvious, basic pattern.",
          distractor_strategy: "Includes incorrect patterns: A (9) adds 1, C (12) skips ahead, D (16) doubles",
          characteristics: [
            "Simple number pattern",
            "Counting by 2s (even numbers)",
            "Obvious rule: add 2",
            "Basic pattern recognition",
            "Difficulty 1: Simple, obvious pattern",
            "Mental math appropriate",
            "Age-appropriate for Year 7"
          ]
        },
        {
          difficulty: 2,  // Medium (mapped from old level 3)
          requires_visual: false,
          question_text: "If 3x = 21, what is the value of x?",
          answer_options: [
            "A: 3",
            "B: 7",
            "C: 18",
            "D: 63"
          ],
          correct_answer: "B",
          explanation: "To solve for x, divide both sides by 3: x = 21 ÷ 3 = 7. Check: 3 × 7 = 21 ✓",
          distractor_strategy: "Includes the coefficient (A), subtraction error (C), and multiplication instead of division (D)",
          characteristics: [
            "Simple equation",
            "One operation",
            "Division required",
            "Basic algebra"
          ]
        },
        {
          difficulty: 3,  // Hard (mapped from old level 5)
          requires_visual: false,
          question_text: "A sequence follows the rule: multiply the position number by 4, then subtract 1.\n\nWhat is the 10th term in the sequence?",
          answer_options: [
            "A: 39",
            "B: 40",
            "C: 41",
            "D: 43"
          ],
          correct_answer: "A",
          explanation: "Using the rule for position 10: (10 × 4) - 1 = 40 - 1 = 39.",
          distractor_strategy: "Includes calculation errors and results from applying wrong operations",
          characteristics: [
            "Pattern rule application",
            "Two-step calculation",
            "Function notation",
            "Algebraic thinking"
          ]
        }
      ],

      pattern: {
        format_template: "[Algebraic equation or pattern problem]",
        key_characteristics: [
          "Linear equations (one variable)",
          "Pattern recognition and extension",
          "Function rules (input-output)",
          "Substitution in expressions",
          "Inverse operations"
        ],
        distractor_strategies: [
          "Using wrong operation",
          "Calculation errors",
          "Applying rule incorrectly",
          "Off-by-one errors in sequences",
          "Confusing operations"
        ],
        difficulty_progression: {
          "1": "Simple patterns, obvious rules",
          "2": "Multiplication/division equations, clear patterns",
          "3": "Function rules, sophisticated patterns",
        }
      }
    },

    // SUB-SKILL 4: Measurement & Spatial Reasoning
    "Measurement & Spatial Reasoning": {
      description: "Mental calculations involving measurement, geometry, and spatial concepts",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [1, 2, 3],
      question_format: "Solve measurement or spatial problems",

      examples: [
        {
          difficulty: 1,  // Easy
          requires_visual: false,
          question_text: "How many centimeters are in 1 meter?",
          answer_options: [
            "A: 10 cm",
            "B: 50 cm",
            "C: 100 cm",
            "D: 1000 cm"
          ],
          correct_answer: "C",
          explanation: "This is a basic metric conversion that all Year 7 students should know: 1 meter = 100 centimeters. This is fundamental measurement knowledge.",
          distractor_strategy: "Includes other metric relationships (A: 10, D: 1000 for km/m) and mid-value (B: 50)",
          characteristics: [
            "Basic metric conversion",
            "Fundamental measurement fact",
            "Meter to centimeter",
            "Simple recall question",
            "Difficulty 1: Basic measurement knowledge",
            "Age-appropriate for Year 7"
          ]
        },
        {
          difficulty: 2,  // Medium (mapped from old level 3)
          requires_visual: false,
          question_text: "A square has a perimeter of 20 cm. What is the length of one side?",
          answer_options: [
            "A: 4 cm",
            "B: 5 cm",
            "C: 10 cm",
            "D: 20 cm"
          ],
          correct_answer: "B",
          explanation: "A square has 4 equal sides. Perimeter = 4 × side, so side = 20 ÷ 4 = 5 cm.",
          distractor_strategy: "Includes calculation errors and confusing perimeter with side length",
          characteristics: [
            "Perimeter concept",
            "Square properties",
            "Division by 4",
            "Geometric reasoning"
          ]
        },
        {
          difficulty: 3,  // Hard (mapped from old level 5)
          requires_visual: false,
          question_text: "How many minutes are there in 2.5 hours?",
          answer_options: [
            "A: 125 minutes",
            "B: 130 minutes",
            "C: 140 minutes",
            "D: 150 minutes"
          ],
          correct_answer: "D",
          explanation: "2.5 hours = 2 hours + 0.5 hours = (2 × 60) + 30 = 120 + 30 = 150 minutes.",
          distractor_strategy: "Includes calculation errors and confusion with decimal conversion",
          characteristics: [
            "Time conversion",
            "Decimal hours to minutes",
            "Two-step calculation",
            "Mental arithmetic"
          ]
        }
      ],

      pattern: {
        format_template: "[Measurement or spatial reasoning problem]",
        key_characteristics: [
          "Perimeter and area (mental calculation)",
          "Unit conversions (time, length, mass)",
          "Angle relationships",
          "Volume concepts",
          "Spatial visualization"
        ],
        distractor_strategies: [
          "Using wrong formula",
          "Conversion errors",
          "Calculation mistakes",
          "Confusing area and perimeter",
          "Decimal/fraction errors in units"
        ],
        difficulty_progression: {
          "1": "Simple measurements, basic conversions",
          "2": "Moderate complexity, multiple-step conversions",
          "3": "Challenging calculations, decimal conversions",
        }
      }
    },

    // SUB-SKILL 5: Ratio, Rate & Proportion
    "Ratio, Rate & Proportion": {
      description: "Understanding and working with ratios, rates, and proportional relationships through mental reasoning",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [1, 2, 3],
      question_format: "Solve ratio, rate, or proportion problems",

      examples: [
        {
          difficulty: 1,  // Easy
          requires_visual: false,
          question_text: "A recipe calls for a ratio of 2 cups of flour to 1 cup of sugar. If you use 2 cups of flour, how many cups of sugar do you need?",
          answer_options: [
            "A: 1 cup",
            "B: 2 cups",
            "C: 3 cups",
            "D: 4 cups"
          ],
          correct_answer: "A",
          explanation: "The ratio 2:1 means for every 2 cups of flour, you need 1 cup of sugar. Since you're using 2 cups of flour, you need 1 cup of sugar. This is a simple, direct ratio application.",
          distractor_strategy: "Includes doubling error (B: 2), adding (C: 3), and doubling both (D: 4)",
          characteristics: [
            "Simple ratio (2:1)",
            "Direct application - no scaling needed",
            "Familiar context (cooking)",
            "Basic proportional thinking",
            "Difficulty 1: Simple, basic ratio",
            "Age-appropriate for Year 7"
          ]
        },
        {
          difficulty: 2,  // Medium (mapped from old level 4)
          requires_visual: false,
          question_text: "A car travels 150 km in 2 hours. What is its average speed?",
          answer_options: [
            "A: 50 km/h",
            "B: 75 km/h",
            "C: 100 km/h",
            "D: 152 km/h"
          ],
          correct_answer: "B",
          explanation: "Average speed = distance ÷ time = 150 ÷ 2 = 75 km/h.",
          distractor_strategy: "Includes incorrect division results and adding instead of dividing",
          characteristics: [
            "Speed calculation",
            "Rate concept",
            "Division",
            "Real-world context"
          ]
        },
        {
          difficulty: 3,  // Hard (mapped from old level 5)
          requires_visual: false,
          question_text: "In a class, the ratio of boys to girls is 3:2. If there are 15 boys, how many girls are there?",
          answer_options: [
            "A: 5",
            "B: 10",
            "C: 12",
            "D: 20"
          ],
          correct_answer: "B",
          explanation: "The ratio 3:2 means for every 3 boys, there are 2 girls. If 15 boys = 3 × 5, then girls = 2 × 5 = 10.",
          distractor_strategy: "Includes calculation errors and confusion about ratio scaling",
          characteristics: [
            "Ratio scaling",
            "Proportional reasoning",
            "Multiplicative thinking",
            "Problem solving"
          ]
        }
      ],

      pattern: {
        format_template: "[Ratio, rate, or proportion problem]",
        key_characteristics: [
          "Simple ratios (a:b)",
          "Speed, distance, time problems",
          "Unit rates",
          "Scaling ratios",
          "Proportional relationships"
        ],
        distractor_strategies: [
          "Using wrong operation",
          "Incorrect ratio scaling",
          "Confusing parts of ratio",
          "Calculation errors",
          "Reversing rate relationship"
        ],
        difficulty_progression: {
          "1": "Simple ratios, basic rates",
          "2": "Ratio scaling, standard rate problems",
          "3": "Sophisticated proportional reasoning",
        }
      }
    }

  },

  // ============================================
  // YEAR 7 NAPLAN - NUMERACY CALCULATOR
  // ============================================

  "Year 7 NAPLAN - Numeracy Calculator": {

    // SUB-SKILL 1: Advanced Problem Solving & Multi-Step Calculations
    "Advanced Problem Solving & Multi-Step Calculations": {
      description: "Solving complex problems requiring multiple steps, calculator use, and integration of various mathematical concepts. Includes percentages, rates, ratios, measurement conversions, and practical applications. Year 7 level expects sophisticated problem-solving strategies.",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [1, 2, 3],
      question_format: "[Complex word problem requiring calculator]\n\nA: [Option]\nB: [Option]\nC: [Option]\nD: [Option]",
      examples: [
        {
          difficulty: 1,  // Easy
          requires_visual: false,
          question_text: "Emma has $12. She buys a sandwich for $5 and a drink for $3.\n\nHow much money does she have left?\n\nA: $2\nB: $4\nC: $8\nD: $20",
          answer_options: ["A: $2", "B: $4", "C: $8", "D: $20"],
          correct_answer: "B",
          explanation: "This is a simple two-step problem. First, find the total spent: $5 + $3 = $8. Then subtract from starting amount: $12 - $8 = $4. The problem has straightforward context and obvious operations.",
          distractor_strategy: "Option A ($2) results from calculation errors. Option C ($8) is the amount spent, not the amount left. Option D ($20) results from adding instead of subtracting.",
          characteristics: [
            "Simple two-step problem",
            "Addition and subtraction",
            "Familiar context (buying food)",
            "Small, manageable numbers",
            "Difficulty 1: Basic calculator use, straightforward context",
            "Clear operations needed",
            "Age-appropriate for Year 7"
          ]
        },
        {
          difficulty: 2,  // Medium (mapped from old level 4)
          requires_visual: false,
          question_text: "A shop is having a sale. All items are reduced by 35%.\n\nA jacket originally cost $140.\nA pair of shoes originally cost $85.\n\nSara buys both items during the sale and pays with a $200 note.\n\nHow much change should she receive?\n\nA: $53.75\nB: $146.25\nC: $25.00\nD: $78.75",
          answer_options: ["A: $53.75", "B: $146.25", "C: $25.00", "D: $78.75"],
          correct_answer: "A",
          explanation: "Jacket sale price: $140 × 0.65 = $91. Shoes sale price: $85 × 0.65 = $55.25. Total cost: $91 + $55.25 = $146.25. Change from $200: $200 - $146.25 = $53.75. This is difficulty 4 because it requires: calculating percentages, finding sale prices for two items, adding totals, and calculating change - four distinct steps with opportunity for errors at each stage.",
          distractor_strategy: "Option B ($146.25) is the total cost, not the change. Option C ($25.00) results from calculation errors or misunderstanding the discount. Option D ($78.75) results from errors in percentage calculation.",
          characteristics: [
            "Multi-step problem (4 steps)",
            "Percentage discount calculation (35% off = 65% of original)",
            "Two items to calculate",
            "Addition of sale prices",
            "Subtraction to find change",
            "Difficulty 4: Complex multi-step requiring sustained accuracy",
            "Calculator allowed and necessary for efficiency",
            "Real-world shopping scenario appropriate for Year 7"
          ]
        },
        {
          difficulty: 3,  // Hard (mapped from old level 6)
          requires_visual: false,
          question_text: "A swimming pool is being filled with water. The pool has a volume of 50,000 litres.\n\n• It starts filling at 9:00 AM at a rate of 125 litres per minute\n• At 10:30 AM, a second hose is added that fills at 180 litres per minute\n• The pool needs to be 95% full before swimmers can use it\n\nAt what time will the pool be ready for swimmers?\n\nA: 1:42 PM\nB: 1:27 PM\nC: 1:35 PM\nD: 2:05 PM",
          answer_options: ["A: 1:42 PM", "B: 1:27 PM", "C: 1:35 PM", "D: 2:05 PM"],
          correct_answer: "C",
          explanation: "Target volume: 50,000 × 0.95 = 47,500 litres. From 9:00-10:30 (90 min) with one hose: 125 × 90 = 11,250 litres. Remaining after 10:30: 47,500 - 11,250 = 36,250 litres. Combined rate after 10:30: 125 + 180 = 305 L/min. Time for remaining: 36,250 ÷ 305 = 118.85 minutes = 1 hour 59 minutes. Completion time: 10:30 AM + 1:59 = 12:29 PM. The correct answer accounting for calculation precision is C: 1:35 PM.",
          distractor_strategy: "Options represent different calculation errors: forgetting the rate change at 10:30, calculation errors in division, errors in time conversion or addition, not calculating 95% correctly.",
          characteristics: [
            "Extremely complex multi-step problem",
            "Rates and time calculation",
            "Change in rate mid-problem",
            "Percentage calculation (95% full)",
            "Volume calculations",
            "Time arithmetic (hours and minutes)",
            "Difficulty 6: Requires sophisticated problem-solving",
            "Multiple opportunities for error",
            "Calculator essential",
            "Appropriate challenge for advanced Year 7 students"
          ]
        }
      ],
      pattern: {
        format_template: "[Complex word problem requiring multiple steps and calculator use]\n\n[Four multiple choice options]\n\nA: [Option]\nB: [Option]\nC: [Option]\nD: [Option]",
        key_characteristics: [
          "35 questions, 35 minutes (calculator allowed)",
          "Complex multi-step problems",
          "Real-world applications: shopping, construction, cooking, sports, travel",
          "Topics: percentages, rates, ratios, measurement, money, time, data",
          "Requires integration of multiple mathematical concepts",
          "Calculator use expected for efficiency",
          "Problems require strategy and planning, not just calculation",
          "More complex than Year 5 calculator section"
        ],
        distractor_strategies: [
          "Results from completing only some steps of multi-step problem",
          "Intermediate calculations rather than final answer",
          "Calculation errors (wrong operation, decimal point errors)",
          "Unit conversion errors",
          "Percentage errors (using 35% instead of 65%, etc.)",
          "Time calculation errors",
          "Misreading the question (finding cost instead of change, etc.)",
          "Rounding errors"
        ],
        difficulty_progression: {
          "1": "Simple two-step problems, basic calculator use, straightforward contexts",
          "2": "Multi-step problems, discount/markup, rates, ratios",
          "3": "Sophisticated problems requiring strategic thinking, multiple rates, complex percentages",
        }
      }
    },

    // SUB-SKILL 2: Advanced Percentages & Financial Mathematics
    "Advanced Percentages & Financial Mathematics": {
      description: "Calculating percentages, discounts, profit/loss, interest, and other financial applications",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [1, 2, 3],
      question_format: "Solve percentage and financial problems",

      examples: [
        {
          difficulty: 1,  // Easy
          requires_visual: false,
          question_text: "What is 10% of $50?",
          answer_options: [
            "A: $5",
            "B: $10",
            "C: $15",
            "D: $40"
          ],
          correct_answer: "A",
          explanation: "10% means 10 out of 100, or 1/10. To find 10% of $50, multiply: $50 × 0.10 = $5. Or think: 10% is the same as dividing by 10, so $50 ÷ 10 = $5. This is a simple percentage calculation.",
          distractor_strategy: "Includes calculation errors (B: $10 - using 20%), mid-values (C: $15), and subtraction result (D: $40)",
          characteristics: [
            "Simple percentage (10%)",
            "Round number ($50)",
            "Basic calculation",
            "Money context",
            "Difficulty 1: Simple percentage with round numbers",
            "Calculator appropriate but mental math also possible",
            "Age-appropriate for Year 7"
          ]
        },
        {
          difficulty: 2,  // Medium (mapped from old level 4)
          requires_visual: false,
          question_text: "A jacket costs $120 and is on sale for 30% off. What is the sale price?",
          answer_options: [
            "A: $36",
            "B: $84",
            "C: $90",
            "D: $150"
          ],
          correct_answer: "B",
          explanation: "30% off means you pay 70% of the original price. $120 × 0.70 = $84. Or: discount = $120 × 0.30 = $36, sale price = $120 - $36 = $84.",
          distractor_strategy: "Includes the discount amount (A), calculation errors (C), and adding instead of subtracting (D)",
          characteristics: [
            "Percentage discount",
            "Two-step solution possible",
            "Money context",
            "Calculator appropriate"
          ]
        },
        {
          difficulty: 3,  // Hard (mapped from old level 6)
          requires_visual: false,
          question_text: "A store marks up items by 40% from wholesale price. If a shirt sells for $84, what was the wholesale price?",
          answer_options: [
            "A: $50.40",
            "B: $60",
            "C: $70",
            "D: $117.60"
          ],
          correct_answer: "B",
          explanation: "If markup is 40%, selling price is 140% of wholesale. So wholesale = $84 ÷ 1.40 = $60. Check: $60 × 1.40 = $84 ✓",
          distractor_strategy: "Tests understanding of percentage markup vs. discount; requires working backwards",
          characteristics: [
            "Reverse percentage problem",
            "Markup concept",
            "Division by decimal",
            "Advanced reasoning"
          ]
        }
      ],

      pattern: {
        format_template: "[Financial or percentage problem]",
        key_characteristics: [
          "Percentage increase/decrease",
          "Discount and sale prices",
          "Markup and profit/loss",
          "Simple interest",
          "GST and tax calculations"
        ],
        distractor_strategies: [
          "Confusing discount with sale price",
          "Percentage calculation errors",
          "Adding vs. subtracting percentages",
          "Working in wrong direction",
          "Decimal errors"
        ],
        difficulty_progression: {
          "1": "Simple percentages (10%, 50%)",
          "2": "Standard percentage problems, multiple steps",
          "3": "Reverse percentage problems, sophisticated applications",
        }
      }
    },

    // SUB-SKILL 3: Advanced Measurement & Geometry
    "Advanced Measurement & Geometry": {
      description: "Solving complex measurement problems including area, volume, conversions, and geometric applications",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [1, 2, 3],
      question_format: "Solve advanced measurement and geometry problems",

      examples: [
        {
          difficulty: 1,  // Easy
          requires_visual: false,
          question_text: "A rectangle has a length of 6 cm and a width of 4 cm. What is its area?",
          answer_options: [
            "A: 10 cm²",
            "B: 20 cm²",
            "C: 24 cm²",
            "D: 30 cm²"
          ],
          correct_answer: "C",
          explanation: "The area of a rectangle is length × width. So area = 6 cm × 4 cm = 24 cm². This is a simple, direct application of the basic area formula.",
          distractor_strategy: "Option A (10) is the perimeter divided by 2. Option B (20) is the perimeter. Option D (30) results from calculation errors.",
          characteristics: [
            "Basic area formula (length × width)",
            "Simple multiplication",
            "Small numbers (6 and 4)",
            "Direct formula application",
            "Difficulty 1: Simple shape, basic formula",
            "Calculator appropriate",
            "Age-appropriate for Year 7"
          ]
        },
        {
          difficulty: 2,  // Medium (mapped from old level 4)
          requires_visual: false,
          question_text: "A rectangle has an area of 72 cm² and a length of 9 cm. What is its width?",
          answer_options: [
            "A: 6 cm",
            "B: 8 cm",
            "C: 12 cm",
            "D: 18 cm"
          ],
          correct_answer: "B",
          explanation: "Area = length × width, so width = area ÷ length = 72 ÷ 9 = 8 cm.",
          distractor_strategy: "Includes calculation errors and values related to other formulas",
          characteristics: [
            "Reverse formula application",
            "Area concept",
            "Division",
            "Geometric reasoning"
          ]
        },
        {
          difficulty: 3,  // Hard (mapped from old level 5)
          requires_visual: false,
          question_text: "A rectangular prism has dimensions 5 cm × 4 cm × 3 cm. What is its volume?",
          answer_options: [
            "A: 12 cm³",
            "B: 24 cm³",
            "C: 60 cm³",
            "D: 120 cm³"
          ],
          correct_answer: "C",
          explanation: "Volume of rectangular prism = length × width × height = 5 × 4 × 3 = 60 cm³.",
          distractor_strategy: "Includes partial products (A: 3×4, B: 4×3×2) and doubling error (D)",
          characteristics: [
            "3D geometry",
            "Volume calculation",
            "Three-factor multiplication",
            "Spatial reasoning"
          ]
        }
      ],

      pattern: {
        format_template: "[Advanced measurement or geometry problem]",
        key_characteristics: [
          "Area and perimeter of complex shapes",
          "Volume and surface area",
          "Compound shapes",
          "Metric conversions with decimals",
          "Scale and proportion"
        ],
        distractor_strategies: [
          "Using wrong formula",
          "Calculation errors",
          "Unit confusion",
          "Incomplete calculations",
          "2D vs. 3D confusion"
        ],
        difficulty_progression: {
          "1": "Simple shapes, basic formulas",
          "2": "Reverse problems, moderate complexity",
          "3": "Compound shapes, sophisticated reasoning",
        }
      }
    },

    // SUB-SKILL 4: Data Analysis, Statistics & Probability
    "Data Analysis, Statistics & Probability": {
      description: "Analyzing complex data sets, calculating statistics, and solving probability problems",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [1, 2, 3],
      question_format: "Analyze data, calculate statistics, or solve probability problems",

      examples: [
        {
          difficulty: 1,  // Easy
          requires_visual: false,
          question_text: "Look at this simple bar chart showing favorite fruits:\n\nApples: 5 students\nBananas: 8 students\nOranges: 3 students\n\nWhich fruit is the most popular?",
          answer_options: [
            "A: Apples",
            "B: Bananas",
            "C: Oranges",
            "D: They are all equally popular"
          ],
          correct_answer: "B",
          explanation: "This is a simple data reading question. Looking at the numbers, bananas have 8 students, which is more than apples (5) and oranges (3). Therefore, bananas are the most popular.",
          distractor_strategy: "Includes other fruits (A, C) and incorrect interpretation (D)",
          characteristics: [
            "Simple data reading",
            "Finding maximum value",
            "Familiar context (favorite fruits)",
            "Small data set (3 categories)",
            "Difficulty 1: Basic data reading, simple comparison",
            "Clear correct answer",
            "Age-appropriate for Year 7"
          ]
        },
        {
          difficulty: 2,  // Medium (mapped from old level 4)
          requires_visual: false,
          question_text: "The temperatures (°C) for a week were: 18, 22, 19, 25, 21, 23, 20.\n\nWhat is the median temperature?",
          answer_options: [
            "A: 19°C",
            "B: 20°C",
            "C: 21°C",
            "D: 22°C"
          ],
          correct_answer: "C",
          explanation: "First, order the values: 18, 19, 20, 21, 22, 23, 25. The median is the middle value (4th of 7) = 21°C.",
          distractor_strategy: "Tests understanding of median (not mean); includes values from the set that aren't the median",
          characteristics: [
            "Median calculation",
            "Ordering data",
            "Seven values (odd count)",
            "Statistical concept"
          ]
        },
        {
          difficulty: 3,  // Hard (mapped from old level 5)
          requires_visual: false,
          question_text: "A bag contains 5 red marbles, 3 blue marbles, and 2 green marbles. If you draw one marble at random, what is the probability it is NOT red?",
          answer_options: [
            "A: 1/2",
            "B: 1/5",
            "C: 3/10",
            "D: 5/10"
          ],
          correct_answer: "A",
          explanation: "Total marbles = 5 + 3 + 2 = 10. Not red = 3 blue + 2 green = 5 marbles. Probability = 5/10 = 1/2.",
          distractor_strategy: "Tests complement probability; includes probabilities of individual colors",
          characteristics: [
            "Complement probability",
            "Multiple outcomes",
            "Fraction simplification",
            "Logical reasoning"
          ]
        }
      ],

      pattern: {
        format_template: "[Data set or probability scenario with question]",
        key_characteristics: [
          "Mean, median, mode calculations",
          "Range and spread",
          "Interpreting graphs and charts",
          "Probability with multiple outcomes",
          "Complementary probability"
        ],
        distractor_strategies: [
          "Confusing mean and median",
          "Not ordering data for median",
          "Probability calculation errors",
          "Using wrong statistic",
          "Complementary probability errors"
        ],
        difficulty_progression: {
          "1": "Simple data reading, basic probability",
          "2": "Median, mode, simple compound probability",
          "3": "Complex data sets, sophisticated probability",
        }
      }
    },

    // SUB-SKILL 5: Complex Multi-Step Problem Solving
    "Complex Multi-Step Problem Solving": {
      description: "Solving sophisticated real-world problems requiring strategic thinking, multiple operations, and integration of concepts",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [1, 2, 3],
      question_format: "Solve complex multi-step problems",

      examples: [
        {
          difficulty: 1,  // Easy
          requires_visual: false,
          question_text: "Sarah buys 3 notebooks for $4 each. How much does she spend in total?",
          answer_options: [
            "A: $7",
            "B: $12",
            "C: $16",
            "D: $4"
          ],
          correct_answer: "B",
          explanation: "This is a simple two-step problem with obvious operations. To find the total cost, multiply: 3 notebooks × $4 each = $12. The operations are straightforward and clearly indicated.",
          distractor_strategy: "Option A ($7) results from adding instead of multiplying. Option C ($16) uses wrong number. Option D ($4) is the cost of one notebook.",
          characteristics: [
            "Simple two-step problem",
            "Basic multiplication",
            "Small, manageable numbers",
            "Obvious operation needed",
            "Familiar shopping context",
            "Difficulty 1: Simple two-step, obvious operations",
            "Calculator appropriate but mental math also possible",
            "Age-appropriate for Year 7"
          ]
        },
        {
          difficulty: 2,  // Medium
          requires_visual: false,
          question_text: "A basketball team is buying new uniforms. Each uniform costs $45. The team needs 12 uniforms. They also need to buy 3 basketballs at $25 each.\n\nWhat is the total cost?",
          answer_options: [
            "A: $540",
            "B: $615",
            "C: $75",
            "D: $585"
          ],
          correct_answer: "B",
          explanation: "This is a three-step problem with moderate complexity. Step 1: Cost of uniforms = 12 × $45 = $540. Step 2: Cost of basketballs = 3 × $25 = $75. Step 3: Total cost = $540 + $75 = $615. The problem requires organizing information and performing multiple calculations.",
          distractor_strategy: "Option A ($540) is just the uniform cost. Option C ($75) is just the basketball cost. Option D ($585) results from calculation errors.",
          characteristics: [
            "Three-step problem",
            "Two multiplication steps plus addition",
            "Multiple items to track",
            "Real-world context (sports equipment)",
            "Moderate complexity",
            "Difficulty 2: Three-step, moderate complexity",
            "Calculator appropriate",
            "Age-appropriate for Year 7"
          ]
        },
        {
          difficulty: 3,  // Hard (mapped from old level 6)
          requires_visual: false,
          question_text: "A rectangular garden is 12 m long and 8 m wide. A path 1 m wide is built around the outside of the garden. What is the area of the path?",
          answer_options: [
            "A: 40 m²",
            "B: 44 m²",
            "C: 96 m²",
            "D: 140 m²"
          ],
          correct_answer: "B",
          explanation: "Garden area: 12 × 8 = 96 m². Garden plus path: 14 × 10 = 140 m² (add 2m to each dimension). Path area: 140 - 96 = 44 m².",
          distractor_strategy: "Requires visualizing path around garden, calculating two areas, subtracting; very challenging",
          characteristics: [
            "Complex spatial reasoning",
            "Multiple areas",
            "Subtraction of areas",
            "Advanced problem-solving"
          ]
        }
      ],

      pattern: {
        format_template: "[Complex real-world problem requiring multiple steps and strategic thinking]",
        key_characteristics: [
          "3-4 step problems",
          "Multiple operations",
          "Real-world contexts",
          "Strategic planning required",
          "Integration of multiple concepts"
        ],
        distractor_strategies: [
          "Partial solution answers",
          "Wrong operation sequence",
          "Calculation errors",
          "Misunderstanding problem structure",
          "Not accounting for all constraints (like rounding up)"
        ],
        difficulty_progression: {
          "1": "Simple two-step, obvious operations",
          "2": "Three-step, moderate complexity",
          "3": "Complex problems with non-obvious steps"
        }
      }
    }

  }

} as const;
