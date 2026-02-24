// Year 5 NAPLAN - Curriculum Data V2
// Created: February 6, 2026

import type { SubSkillExamplesDatabase } from './types';

/**
 * Year 5 NAPLAN - Complete Sub-Skill Examples
 *
 * Sections:
 * - Writing (2 sub-skills: Narrative & Persuasive)
 * - Reading (5 sub-skills, examples across 3 difficulty levels)
 * - Language Conventions (4 sub-skills, examples across 3 difficulty levels)
 * - Numeracy (5 sub-skills, examples across 3 difficulty levels)
 *
 * Total: 16 sub-skills
 *
 * NOTE: Year 5 NAPLAN now uses 3 difficulty levels (1-3) for consistency across all products.
 *  *   - Level 1 (Easy): Covers original NAPLAN levels 1-2
 *  *   - Level 2 (Medium): Covers original NAPLAN levels 3-4
 *  *   - Level 3 (Hard): Covers original NAPLAN levels 5-6
 * NOTE: Year 5 NAPLAN does NOT have separate calculator/non-calculator sections (unlike Year 7).
 */
export const NAPLAN_YEAR5_SUB_SKILLS: SubSkillExamplesDatabase = {

  // ============================================
  // YEAR 5 NAPLAN - WRITING
  // ============================================

  "Year 5 NAPLAN - Writing": {

    // SUB-SKILL 1: Narrative Writing
    "Narrative Writing": {
      description: "Writing creative narratives with clear structure, engaging characters, and descriptive language appropriate for Year 5 level",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,  // LLM can generate the writing prompt text
      difficulty_range: [1, 2, 3],
      question_format: "Write a narrative based on the given prompt",

      examples: [
        {
          difficulty: 1,  // Easy
          question_text: "NAPLAN WRITING TASK:\n\nWrite a story about your best day at school.\n\nYou have 42 minutes to plan and write your story.\n\nYour story should:\n• Have a clear beginning, middle, and end\n• Include interesting characters and descriptive details\n• Be written in sentences and paragraphs\n• Use correct spelling and punctuation",
          answer_options: [],
          correct_answer: "Open-ended narrative writing response",
          explanation: "This simple narrative prompt asks Year 5 students to write about a familiar, concrete experience. Students can draw on personal memories to create a story with basic narrative structure. The topic is straightforward and accessible to all students.",
          characteristics: [
            "Narrative writing",
            "Personal experience theme",
            "Familiar everyday topic",
            "Time-limited (42 mins)",
            "Planning encouraged",
            "Clear structure required"
          ]
        },
        {
          difficulty: 2,  // Medium (mapped from old level 3)
          question_text: "NAPLAN WRITING TASK:\n\nWrite a story about a time when you discovered something amazing.\n\nYou have 42 minutes to plan and write your story.\n\nYour story should:\n• Have a clear beginning, middle, and end\n• Include interesting characters and descriptive details\n• Be written in sentences and paragraphs\n• Use correct spelling and punctuation",
          answer_options: [],
          correct_answer: "Open-ended narrative writing response",
          explanation: "This narrative prompt asks Year 5 students to write about discovering something amazing. Students should develop a story with a clear narrative structure, create engaging characters, use descriptive language to bring the discovery to life, and organize their writing into proper paragraphs. The prompt is open enough to allow for creative interpretation while providing a clear focus.",
          characteristics: [
            "Narrative writing",
            "Personal discovery theme",
            "Age-appropriate topic",
            "Time-limited (42 mins)",
            "Planning encouraged",
            "Clear structure required"
          ]
        },
        {
          difficulty: 3,  // Hard
          question_text: "NAPLAN WRITING TASK:\n\nWrite a story that begins with this sentence: 'I never expected that one small decision would change everything.'\n\nYou have 42 minutes to plan and write your story.\n\nYour story should:\n• Have a clear beginning, middle, and end\n• Include well-developed characters and descriptive details\n• Use a variety of sentence structures\n• Be written in paragraphs\n• Use correct spelling and punctuation",
          answer_options: [],
          correct_answer: "Open-ended narrative writing response",
          explanation: "This challenging narrative prompt requires Year 5 students to build a sophisticated story from an abstract opening sentence. Students must demonstrate creativity in developing a plot around the theme of consequences and decision-making, create believable character development, and use advanced narrative techniques including varied sentence structures and descriptive language.",
          characteristics: [
            "Narrative writing",
            "Abstract theme (consequences/decisions)",
            "Opening sentence provided",
            "Requires sophisticated development",
            "Time-limited (42 mins)",
            "Planning encouraged",
            "Advanced structure required"
          ]
        }
      ],

      pattern: {
        format_template: "Write a story about [prompt/scenario]. Your story should: [criteria]",
        key_characteristics: [
          "Narrative genre",
          "Age-appropriate prompts for Year 5 (10-11 years)",
          "42 minutes (includes planning time)",
          "Assessed on: ideas, structure, vocabulary, sentence structure, spelling, punctuation",
          "Should include: beginning/middle/end, characters, setting, descriptive language",
          "Organized in paragraphs"
        ],
        distractor_strategies: [
          "N/A - Open-ended writing task"
        ],
        difficulty_progression: {
          "1": "Simple, concrete prompts with everyday experiences",
          "2": "Moderately creative prompts with clear focus",
          "3": "Complex prompts requiring sophisticated narrative development",
        }
      }
    },

    // SUB-SKILL 2: Persuasive Writing
    "Persuasive Writing": {
      description: "Writing persuasive texts that present a clear viewpoint with reasons and evidence appropriate for Year 5 level",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,  // LLM can generate the writing prompt text
      difficulty_range: [1, 2, 3],
      question_format: "Write a persuasive piece on the given topic",

      examples: [
        {
          difficulty: 1,  // Easy
          question_text: "NAPLAN WRITING TASK:\n\nDo you think students should have longer lunch breaks?\n\nWrite to persuade others to agree with your point of view.\n\nYou have 42 minutes to plan and write your persuasive text.\n\nYour writing should:\n• State your opinion clearly\n• Give reasons to support your view\n• Try to convince the reader\n• Be written in sentences and paragraphs\n• Use correct spelling and punctuation",
          answer_options: [],
          correct_answer: "Open-ended persuasive writing response",
          explanation: "This simple persuasive prompt asks Year 5 students to take a position on a familiar school topic. The issue is concrete and straightforward with obvious arguments on either side. Students can easily draw on personal experience to support their opinion.",
          characteristics: [
            "Persuasive writing",
            "Simple school-related topic",
            "Familiar everyday issue",
            "Time-limited (42 mins)",
            "Planning encouraged",
            "Clear opinion required"
          ]
        },
        {
          difficulty: 2,  // Medium (mapped from old level 3)
          question_text: "NAPLAN WRITING TASK:\n\nDo you think students should have more time for sport and physical activity at school?\n\nWrite to persuade others to agree with your point of view.\n\nYou have 42 minutes to plan and write your persuasive text.\n\nYour writing should:\n• State your opinion clearly\n• Give reasons to support your view\n• Try to convince the reader\n• Be written in sentences and paragraphs\n• Use correct spelling and punctuation",
          answer_options: [],
          correct_answer: "Open-ended persuasive writing response",
          explanation: "This persuasive prompt asks Year 5 students to take a position on physical activity at school and convince readers to agree. Students should state their opinion clearly in an introduction, provide 2-3 supporting reasons in body paragraphs, and write a concluding statement. The topic is relevant to students' lives and allows them to draw on personal experience while building a logical argument.",
          characteristics: [
            "Persuasive writing",
            "School-related topic",
            "Age-appropriate issue",
            "Time-limited (42 mins)",
            "Planning encouraged",
            "Clear opinion required"
          ]
        },
        {
          difficulty: 3,  // Hard
          question_text: "NAPLAN WRITING TASK:\n\nShould all schools have a 'no homework' policy to give students more time for family, hobbies, and rest?\n\nWrite to persuade others to agree with your point of view.\n\nYou have 42 minutes to plan and write your persuasive text.\n\nYour writing should:\n• State your opinion clearly\n• Give strong reasons and evidence to support your view\n• Consider different perspectives\n• Use persuasive language to convince the reader\n• Be written in well-organized paragraphs\n• Use correct spelling and punctuation",
          answer_options: [],
          correct_answer: "Open-ended persuasive writing response",
          explanation: "This complex persuasive prompt requires Year 5 students to consider a nuanced educational issue with multiple perspectives. Students must develop sophisticated arguments that balance the benefits of homework (learning reinforcement, study habits) against the need for rest and family time. The topic requires students to think beyond simple personal preference and consider broader educational and social implications.",
          characteristics: [
            "Persuasive writing",
            "Complex social issue",
            "Multiple perspectives",
            "Requires sophisticated reasoning",
            "Time-limited (42 mins)",
            "Planning encouraged",
            "Advanced persuasive techniques expected"
          ]
        }
      ],

      pattern: {
        format_template: "Do you think [issue]? Write to persuade others. Your writing should: [criteria]",
        key_characteristics: [
          "Persuasive genre",
          "Age-appropriate topics for Year 5",
          "42 minutes (includes planning time)",
          "Assessed on: opinion clarity, reasons/evidence, persuasive language, structure, conventions",
          "Should include: clear position, supporting reasons, persuasive techniques, conclusion",
          "Organized in paragraphs"
        ],
        distractor_strategies: [
          "N/A - Open-ended writing task"
        ],
        difficulty_progression: {
          "1": "Simple, familiar topics with obvious positions (e.g., should we have longer lunch breaks)",
          "2": "Moderately complex issues requiring developed arguments",
          "3": "Complex social or environmental issues requiring sophisticated arguments",
        }
      }
    }

  },

  // ============================================
  // YEAR 5 NAPLAN - READING
  // ============================================

  "Year 5 NAPLAN - Reading": {

    // SUB-SKILL 1: Literal Comprehension
    "Literal Comprehension": {
      description: "Understanding explicitly stated information in texts, retrieving specific details and facts",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [1, 2, 3],
      question_format: "Answer literal comprehension questions about the passage",

      examples: [
        {
          difficulty: 1,  // Easy (mapped from old level 2)
          question_text: "Read this passage:\n\n'The platypus is one of Australia's most unusual animals. It has a duck-like bill, webbed feet, and a beaver-like tail. Platypuses live in freshwater streams and rivers along the eastern coast of Australia. They are excellent swimmers and spend most of their time in the water.'\n\nWhere do platypuses live?",
          answer_options: [
            "A: In the ocean",
            "B: In freshwater streams and rivers",
            "C: In trees",
            "D: In the desert"
          ],
          correct_answer: "B",
          explanation: "The passage explicitly states that 'Platypuses live in freshwater streams and rivers along the eastern coast of Australia.'",
          distractor_strategy: "Includes habitat types (A: ocean, C: trees, D: desert) that are incorrect",
          characteristics: [
            "Explicit information retrieval",
            "Factual detail",
            "Direct statement in text",
            "Animal/nature topic"
          ]
        },
        {
          difficulty: 2,  // Medium (mapped from old level 4)
          question_text: "Read this passage:\n\n'The invention of the printing press in 1440 by Johannes Gutenberg revolutionized the spread of information. Before this invention, books were copied by hand, a process that took months or even years. The printing press allowed books to be produced quickly and in large quantities, making them more affordable and accessible to ordinary people.'\n\nHow long did it take to copy a book by hand?",
          answer_options: [
            "A: Days",
            "B: Weeks",
            "C: Months or years",
            "D: The passage doesn't say"
          ],
          correct_answer: "C",
          explanation: "The passage states that copying books by hand 'took months or even years.'",
          distractor_strategy: "Includes shorter timeframes (A, B) and a trap answer (D) for students who miss the detail",
          characteristics: [
            "Historical context",
            "Specific detail retrieval",
            "Requires careful reading",
            "Multi-clause sentence"
          ]
        },
        {
          difficulty: 3,  // Hard
          question_text: "Read this passage:\n\n'The Antarctic krill, despite being only 6 centimetres long, is one of the most important creatures in the Southern Ocean ecosystem. These tiny crustaceans form enormous swarms, sometimes covering several square kilometres of ocean. Scientists estimate that the total biomass of Antarctic krill exceeds that of humans. They serve as a crucial food source for whales, seals, penguins, and numerous fish species. However, climate change and commercial fishing pose significant threats to krill populations, which could have devastating consequences throughout the entire food web.'\n\nAccording to the passage, what makes Antarctic krill particularly important to the Southern Ocean ecosystem?",
          answer_options: [
            "A: They are 6 centimetres long",
            "B: They form enormous swarms",
            "C: They serve as a crucial food source for many animals",
            "D: Their biomass exceeds that of humans"
          ],
          correct_answer: "C",
          explanation: "While the passage mentions multiple facts about krill, the key detail about their ecosystem importance is explicitly stated: 'They serve as a crucial food source for whales, seals, penguins, and numerous fish species.' The other options are facts mentioned but don't directly answer what makes them important to the ecosystem.",
          distractor_strategy: "Includes other true facts from the passage that don't answer the specific question about ecosystem importance",
          characteristics: [
            "Complex scientific text",
            "Multiple facts to process",
            "Requires identifying relevant detail among many",
            "Sophisticated vocabulary (biomass, ecosystem, crustaceans)"
          ]
        }
      ],

      pattern: {
        format_template: "[Passage] [Question asking for explicit information]",
        key_characteristics: [
          "Explicit information in text",
          "Who, what, where, when questions",
          "Direct retrieval of facts",
          "4 answer options",
          "Various text types: narratives, information texts, procedural"
        ],
        distractor_strategies: [
          "Plausible but incorrect details",
          "Information from other parts of text",
          "'Not stated' when it is stated",
          "Common misconceptions",
          "Similar but inaccurate information"
        ],
        difficulty_progression: {
          "1": "Obvious details, simple sentences, familiar topics",
          "2": "Details requiring careful reading, some complex sentences",
          "3": "Subtle details, sophisticated vocabulary, less familiar topics",
        }
      }
    },

    // SUB-SKILL 2: Inferential Comprehension
    "Inferential Comprehension": {
      description: "Making logical inferences and drawing conclusions based on textual evidence",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [1, 2, 3],
      question_format: "Make inferences based on passage content",

      examples: [
        {
          difficulty: 1,  // Easy
          question_text: "Read this passage:\n\n'Sarah walked into the kitchen and saw a big cake on the table with candles on top. Colorful balloons were hanging from the ceiling, and wrapped presents were stacked in the corner.'\n\nWhat can you infer is happening?",
          answer_options: [
            "A: It's a regular Tuesday",
            "B: Someone is having a birthday party",
            "C: The family is moving to a new house",
            "D: Sarah is going to school"
          ],
          correct_answer: "B",
          explanation: "The obvious clues (birthday cake with candles, balloons, wrapped presents) all point to a birthday celebration. This is a simple inference with very clear, familiar context clues that Year 5 students can easily recognize.",
          distractor_strategy: "Includes everyday scenarios that don't match the celebration clues",
          characteristics: [
            "Very clear context clues",
            "Familiar celebration scenario",
            "Simple inference",
            "Obvious birthday indicators"
          ]
        },
        {
          difficulty: 2,  // Medium (mapped from old level 3)
          question_text: "Read this passage:\n\n'Tom hurried to put on his raincoat and grabbed his umbrella from the stand. He looked out the window one more time before leaving, sighing deeply.'\n\nWhat can you infer about the weather?",
          answer_options: [
            "A: It was sunny",
            "B: It was raining or about to rain",
            "C: It was snowing",
            "D: It was very hot"
          ],
          correct_answer: "B",
          explanation: "The clues (raincoat, umbrella, looking out window, sighing) suggest rainy weather. Students must infer this from the actions rather than being told directly.",
          distractor_strategy: "Includes other weather types that don't match the contextual clues",
          characteristics: [
            "Character actions as clues",
            "Inferring weather/setting",
            "No explicit statement",
            "Contextual reasoning"
          ]
        },
        {
          difficulty: 3,  // Hard (mapped from old level 5)
          question_text: "Read this passage:\n\n'The stadium erupted in cheers as Maria crossed the finish line, her face flushed and arms raised high. Months of early morning training sessions had finally paid off. Her coach rushed over, eyes glistening with pride.'\n\nWhat can you infer about Maria's result in the race?",
          answer_options: [
            "A: She came in last place",
            "B: She had to withdraw from the race",
            "C: She won or did very well in the race",
            "D: She was disqualified"
          ],
          correct_answer: "C",
          explanation: "Multiple clues suggest success: stadium cheering, arms raised (victory gesture), coach's pride, and the reference to her training 'paying off.' Students must synthesize multiple pieces of evidence.",
          distractor_strategy: "Includes negative outcomes that contradict the positive emotional context",
          characteristics: [
            "Multiple inference clues",
            "Emotional context",
            "Achievement theme",
            "Synthesis of evidence"
          ]
        }
      ],

      pattern: {
        format_template: "[Passage with implicit information] [Question requiring inference]",
        key_characteristics: [
          "Reading between the lines",
          "Using context clues",
          "Drawing logical conclusions",
          "Character emotions/motivations",
          "Cause and effect relationships"
        ],
        distractor_strategies: [
          "Literal but incorrect information",
          "Conclusions unsupported by text",
          "Opposite of what's implied",
          "Partial inferences",
          "Over-generalizations"
        ],
        difficulty_progression: {
          "1": "Simple, obvious inferences with clear clues",
          "2": "Moderate inferences requiring connection of clues",
          "3": "Sophisticated inference, synthesis of multiple clues",
        }
      }
    },

    // SUB-SKILL 3: Vocabulary in Context
    "Vocabulary in Context": {
      description: "Determining word meanings from context and understanding how words function in sentences",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [1, 2, 3],
      question_format: "Determine word meaning from context",

      examples: [
        {
          difficulty: 1,  // Easy (mapped from old level 2)
          question_text: "Read this sentence:\n\n'The enormous elephant towered over the other animals at the waterhole.'\n\nWhat does 'enormous' mean in this sentence?",
          answer_options: [
            "A: Very large",
            "B: Very small",
            "C: Very fast",
            "D: Very loud"
          ],
          correct_answer: "A",
          explanation: "The context 'towered over the other animals' suggests the elephant is much bigger than the others, indicating 'enormous' means very large.",
          distractor_strategy: "Includes other qualities an elephant might have (D: loud) and opposites (B: small)",
          characteristics: [
            "Context clues present",
            "Common vocabulary word",
            "Size description",
            "Animal context"
          ]
        },
        {
          difficulty: 2,  // Medium (mapped from old level 4)
          question_text: "Read this sentence:\n\n'The scientist's hypothesis was controversial, causing heated debates among her colleagues.'\n\nWhat does 'controversial' mean?",
          answer_options: [
            "A: Widely accepted by everyone",
            "B: Causing disagreement or debate",
            "C: Easy to understand",
            "D: Scientifically proven"
          ],
          correct_answer: "B",
          explanation: "The phrase 'causing heated debates' directly explains that controversial means causing disagreement.",
          distractor_strategy: "Includes opposite meaning (A: accepted) and related but incorrect concepts",
          characteristics: [
            "Academic vocabulary",
            "Context provides definition",
            "Scientific context",
            "Abstract concept"
          ]
        },
        {
          difficulty: 3,  // Hard
          question_text: "Read this sentence:\n\n'Despite the team's valiant effort in the final quarter, they succumbed to their opponent's relentless pressure and lost by three points.'\n\nWhat does 'succumbed' mean in this context?",
          answer_options: [
            "A: Celebrated their victory",
            "B: Gave in or yielded to something",
            "C: Improved their performance",
            "D: Requested additional time"
          ],
          correct_answer: "B",
          explanation: "The context shows the team made a 'valiant effort' but ultimately lost, indicating they 'gave in' to the pressure. The word 'succumbed' is sophisticated vocabulary requiring students to infer meaning from the contrast between their effort and the outcome.",
          distractor_strategy: "Includes positive outcomes (A, C) that contradict the loss, and an unrelated option (D)",
          characteristics: [
            "Sophisticated vocabulary",
            "Subtle context clues",
            "Sports context",
            "Requires inference from outcome",
            "Challenging word with minimal direct support"
          ]
        }
      ],

      pattern: {
        format_template: "[Sentence with target word] What does [word] mean?",
        key_characteristics: [
          "Word meaning from context",
          "Context clues: definition, example, contrast, inference",
          "Grade-appropriate vocabulary",
          "Various contexts",
          "Both common and challenging words"
        ],
        distractor_strategies: [
          "Opposite meanings",
          "Related but incorrect meanings",
          "Other common meanings of word",
          "Words that sound similar",
          "Meanings from different contexts"
        ],
        difficulty_progression: {
          "1": "Simple words with obvious context clues",
          "2": "Less common words, moderate context support",
          "3": "Challenging vocabulary, subtle context clues",
        }
      }
    },

    // SUB-SKILL 4: Text Structure & Features
    "Text Structure & Features": {
      description: "Understanding how texts are organized and recognizing text features like headings, captions, and diagrams",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [1, 2, 3],
      question_format: "Identify text structure and purpose of text features",

      examples: [
        {
          difficulty: 1,  // Easy (mapped from old level 2)
          question_text: "Look at this text structure:\n\nTitle: 'How to Make a Paper Airplane'\n1. Fold the paper in half lengthwise\n2. Unfold and fold the top corners to the center\n3. Fold the sides to the center line\n4. Fold in half and create wings\n\nWhat type of text is this?",
          answer_options: [
            "A: A story",
            "B: A set of instructions",
            "C: A poem",
            "D: A letter"
          ],
          correct_answer: "B",
          explanation: "The numbered steps and 'How to' title indicate this is a procedural text with instructions.",
          distractor_strategy: "Includes other text types that Year 5 students would recognize",
          characteristics: [
            "Procedural text",
            "Numbered steps",
            "'How to' title",
            "Sequential structure"
          ]
        },
        {
          difficulty: 2,  // Medium (mapped from old level 4)
          question_text: "A science textbook has a section with this structure:\n\n- Main heading: 'The Water Cycle'\n- Subheadings: 'Evaporation', 'Condensation', 'Precipitation'\n- A labeled diagram\n- A caption under the diagram\n\nWhat is the main purpose of the subheadings?",
          answer_options: [
            "A: To make the page look pretty",
            "B: To organize information about different parts of the water cycle",
            "C: To show where to draw pictures",
            "D: To tell you what chapter comes next"
          ],
          correct_answer: "B",
          explanation: "Subheadings organize information by breaking down the main topic into smaller, related sections.",
          distractor_strategy: "Includes superficial or incorrect purposes for text features",
          characteristics: [
            "Information text features",
            "Hierarchical structure",
            "Science content",
            "Understanding organizational purpose"
          ]
        },
        {
          difficulty: 3,  // Hard
          question_text: "Read this passage structure:\n\n'Many Australian farmers face significant challenges. On one hand, periods of drought reduce crop yields and strain water supplies. On the other hand, when heavy rains finally arrive, they can cause flooding and soil erosion. Both extremes create economic hardship for farming communities. Therefore, developing sustainable water management strategies has become essential for Australia's agricultural future.'\n\nHow is this passage organized?",
          answer_options: [
            "A: Chronologically, showing events in time order",
            "B: As a comparison of two different farming methods",
            "C: By presenting a problem and hinting at a solution",
            "D: As a cause and effect sequence"
          ],
          correct_answer: "C",
          explanation: "The passage presents the problem (drought and flooding challenges facing farmers) and then hints at a solution (developing sustainable water management strategies). While there are cause-effect elements, the overall organizational pattern is problem-solution.",
          distractor_strategy: "Includes other organizational patterns that partially fit (D has some cause-effect) but don't capture the main structure",
          characteristics: [
            "Complex organizational pattern",
            "Problem-solution structure",
            "Environmental/agricultural content",
            "Requires understanding overall structure, not just details",
            "Sophisticated analysis of text organization"
          ]
        }
      ],

      pattern: {
        format_template: "[Text excerpt showing structure] [Question about organization or features]",
        key_characteristics: [
          "Text types: narrative, information, procedural, persuasive",
          "Features: headings, captions, diagrams, bold text, bullet points",
          "Chronological, cause-effect, problem-solution, compare-contrast structures",
          "Purpose of features"
        ],
        distractor_strategies: [
          "Confusing text types",
          "Superficial feature purposes",
          "Incorrect organizational patterns",
          "Misidentifying structure types"
        ],
        difficulty_progression: {
          "1": "Obvious text types and features, simple structures",
          "2": "Less obvious structures, understanding feature purpose",
          "3": "Sophisticated structures, nuanced feature purposes",
        }
      }
    },

    // SUB-SKILL 5: Author's Purpose & Perspective
    "Author's Purpose & Perspective": {
      description: "Identifying why an author wrote a text and recognizing their point of view or bias",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [1, 2, 3],
      question_format: "Determine author's purpose or perspective",

      examples: [
        {
          difficulty: 1,  // Easy
          question_text: "Read this passage:\n\n'Once upon a time, there was a brave little mouse named Pip who loved to explore. One day, Pip discovered a magical garden full of talking flowers and singing birds.'\n\nWhat is the author's main purpose?",
          answer_options: [
            "A: To teach you how to grow a garden",
            "B: To tell an entertaining story",
            "C: To persuade you to get a pet mouse",
            "D: To explain facts about mice"
          ],
          correct_answer: "B",
          explanation: "The phrase 'Once upon a time' and the imaginative elements (talking flowers, singing birds) clearly indicate this is a fictional story meant to entertain readers. This is an obvious narrative text with familiar story elements.",
          distractor_strategy: "Includes other purposes (teach, persuade, inform) that don't match the obvious entertainment purpose",
          characteristics: [
            "Clear story opening ('Once upon a time')",
            "Fictional/fantasy elements",
            "Simple narrative",
            "Obvious entertainment purpose"
          ]
        },
        {
          difficulty: 2,  // Medium (mapped from old level 3)
          question_text: "Read this passage:\n\n'Visit Sunny Beach Resort! With crystal-clear water, soft white sand, and amazing restaurants, it's the perfect family vacation spot. Book now and save 20%!'\n\nWhat is the author's main purpose?",
          answer_options: [
            "A: To tell a story about a family vacation",
            "B: To persuade readers to visit the resort",
            "C: To explain how resorts work",
            "D: To describe what beaches are like"
          ],
          correct_answer: "B",
          explanation: "The enthusiastic language, call to action ('Book now'), and special offer indicate the purpose is to persuade/advertise.",
          distractor_strategy: "Includes other common purposes (inform, entertain, describe) that don't match the persuasive intent",
          characteristics: [
            "Advertisement/persuasive text",
            "Clear persuasive language",
            "Call to action",
            "Identifying purpose"
          ]
        },
        {
          difficulty: 3,  // Hard (mapped from old level 5)
          question_text: "Read this passage:\n\n'While some people claim video games are harmful, research shows that certain games can improve problem-solving skills and hand-eye coordination. However, moderation is important, as too much screen time can affect sleep and physical health.'\n\nWhat is the author's perspective on video games?",
          answer_options: [
            "A: Video games are completely bad",
            "B: Video games are completely good",
            "C: Video games have both benefits and drawbacks",
            "D: The author doesn't have an opinion"
          ],
          correct_answer: "C",
          explanation: "The author presents both positive aspects (problem-solving, coordination) and negatives (screen time, health), showing a balanced perspective.",
          distractor_strategy: "Includes extreme positions (A, B) and neutral stance (D) that don't reflect the balanced view",
          characteristics: [
            "Balanced perspective",
            "Both sides presented",
            "Complex viewpoint",
            "Nuanced thinking"
          ]
        }
      ],

      pattern: {
        format_template: "[Passage] What is the author's purpose/perspective?",
        key_characteristics: [
          "Purposes: entertain, inform, persuade, explain, describe",
          "Identifying bias or point of view",
          "Tone and word choice clues",
          "Recognizing persuasive language",
          "Understanding balanced vs. biased perspectives"
        ],
        distractor_strategies: [
          "Confusing different purposes",
          "Missing persuasive intent",
          "Assuming extreme positions when balanced",
          "Identifying topic instead of purpose",
          "Missing subtle bias"
        ],
        difficulty_progression: {
          "1": "Obvious purposes, clear text types",
          "2": "Moderately clear purposes, some inference needed",
          "3": "Subtle purposes, complex perspectives, balanced views",
        }
      }
    }

  },

  // ============================================
  // YEAR 5 NAPLAN - LANGUAGE CONVENTIONS
  // ============================================

  "Year 5 NAPLAN - Language Conventions": {

    // SUB-SKILL 1: Grammar & Sentence Structure
    "Grammar & Sentence Structure": {
      description: "Understanding and applying correct grammar, including subject-verb agreement, tense consistency, and sentence construction",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [1, 2, 3],
      question_format: "Identify correct grammar usage or sentence structure",

      examples: [
        {
          difficulty: 1,  // Easy (mapped from old level 2)
          question_text: "Which sentence is written correctly?",
          answer_options: [
            "A: The dogs is playing in the park.",
            "B: The dogs are playing in the park.",
            "C: The dogs was playing in the park.",
            "D: The dogs be playing in the park."
          ],
          correct_answer: "B",
          explanation: "The subject 'dogs' is plural, so it requires the plural verb 'are'. The other options use incorrect subject-verb agreement.",
          distractor_strategy: "Includes common subject-verb agreement errors with singular verbs (A, C) and incorrect verb form (D)",
          characteristics: [
            "Subject-verb agreement",
            "Plural subject",
            "Present continuous tense",
            "Common error patterns"
          ]
        },
        {
          difficulty: 2,  // Medium (mapped from old level 4)
          question_text: "Choose the sentence with correct verb tense:",
          answer_options: [
            "A: Yesterday, I go to the beach and swim in the ocean.",
            "B: Yesterday, I went to the beach and swim in the ocean.",
            "C: Yesterday, I went to the beach and swam in the ocean.",
            "D: Yesterday, I go to the beach and swam in the ocean."
          ],
          correct_answer: "C",
          explanation: "The time marker 'Yesterday' requires past tense throughout. Both verbs should be in past tense: 'went' and 'swam'.",
          distractor_strategy: "Includes mixed tenses (B, D) and present tense with past time marker (A)",
          characteristics: [
            "Tense consistency",
            "Compound verb usage",
            "Past tense",
            "Time markers"
          ]
        },
        {
          difficulty: 3,  // Hard
          question_text: "Which sentence uses pronouns correctly?",
          answer_options: [
            "A: Between you and I, the test was easier than expected.",
            "B: Between you and me, the test was easier than expected.",
            "C: Between you and myself, the test was easier than expected.",
            "D: Between yourself and I, the test was easier than expected."
          ],
          correct_answer: "B",
          explanation: "After the preposition 'between', the objective pronoun 'me' is required, not the subjective 'I'. This is a sophisticated grammar concept that many students (and adults) get wrong. 'Myself' is a reflexive pronoun used incorrectly here.",
          distractor_strategy: "Includes the very common error 'between you and I' (A) and incorrect use of reflexive pronouns (C, D)",
          characteristics: [
            "Pronoun case (objective vs. subjective)",
            "Prepositional phrase",
            "Sophisticated grammar rule",
            "Common error even among adults",
            "Reflexive pronoun misuse"
          ]
        }
      ],

      pattern: {
        format_template: "Which sentence is correct? / Choose the correct [grammar element]",
        key_characteristics: [
          "Grammar rules application",
          "Subject-verb agreement, tenses, pronouns, articles",
          "Sentence-level errors",
          "4 answer options",
          "Focus on common Year 5 grammar concepts"
        ],
        distractor_strategies: [
          "Common grammatical errors",
          "Confusing similar structures",
          "Mixed tenses",
          "Agreement errors",
          "Pronoun case errors"
        ],
        difficulty_progression: {
          "1": "Basic agreement and tense with familiar contexts",
          "2": "Moderately complex sentences, less obvious errors",
          "3": "Sophisticated structures, subtle errors",
        }
      }
    },

    // SUB-SKILL 2: Spelling
    "Spelling": {
      description: "Identifying correctly spelled words and recognizing common spelling patterns",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [1, 2, 3],
      question_format: "Identify correct spelling",

      examples: [
        {
          difficulty: 1,  // Easy (mapped from old level 2)
          question_text: "Which word is spelled correctly?",
          answer_options: [
            "A: frend",
            "B: friend",
            "C: freind",
            "D: frien"
          ],
          correct_answer: "B",
          explanation: "'Friend' is the correct spelling. This tests the 'i before e' rule exception.",
          distractor_strategy: "Includes common misspellings and near-misses",
          characteristics: [
            "Common word",
            "Spelling pattern (i before e exception)",
            "Frequently misspelled",
            "Basic vocabulary"
          ]
        },
        {
          difficulty: 2,  // Medium (mapped from old level 4)
          question_text: "Which word is spelled correctly?",
          answer_options: [
            "A: seperate",
            "B: separete",
            "C: seprate",
            "D: separate"
          ],
          correct_answer: "D",
          explanation: "'Separate' is correct. This is commonly misspelled as 'seperate' (A).",
          distractor_strategy: "Includes the most common misspelling (A: seperate) and other variations",
          characteristics: [
            "Commonly misspelled word",
            "Academic vocabulary",
            "Vowel confusion",
            "Multi-syllable word"
          ]
        },
        {
          difficulty: 3,  // Hard
          question_text: "Which word is spelled correctly?",
          answer_options: [
            "A: accomodate",
            "B: acommodate",
            "C: accommodate",
            "D: acomodate"
          ],
          correct_answer: "C",
          explanation: "'Accommodate' is the correct spelling with double 'c' and double 'm'. This is one of the most commonly misspelled words in English, requiring knowledge of the pattern of doubled consonants.",
          distractor_strategy: "Includes all common misspelling variations (single c, single m, both single)",
          characteristics: [
            "Very challenging spelling",
            "Double consonant pattern",
            "Frequently misspelled by adults",
            "Academic/formal vocabulary",
            "Complex pattern recognition"
          ]
        }
      ],

      pattern: {
        format_template: "Which word is spelled correctly?",
        key_characteristics: [
          "Age-appropriate vocabulary",
          "Common spelling patterns and rules",
          "Frequently misspelled words",
          "Homophones",
          "Compound words, contractions, plurals"
        ],
        distractor_strategies: [
          "Common misspellings",
          "Phonetic spellings",
          "Letter reversals",
          "Extra or missing letters",
          "Homophone confusions"
        ],
        difficulty_progression: {
          "1": "Simple, common words with obvious misspellings",
          "2": "Less common words, trickier patterns",
          "3": "Challenging vocabulary, complex patterns",
        }
      }
    },

    // SUB-SKILL 3: Punctuation
    "Punctuation": {
      description: "Using and recognizing correct punctuation including periods, commas, apostrophes, and quotation marks",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [1, 2, 3],
      question_format: "Identify correct punctuation",

      examples: [
        {
          difficulty: 1,  // Easy (mapped from old level 2)
          question_text: "Which sentence has correct punctuation?",
          answer_options: [
            "A: The dog ate its food",
            "B: The dog ate it's food",
            "C: The dog ate its, food",
            "D: The dog ate its food."
          ],
          correct_answer: "D",
          explanation: "Option D is correct - it uses the possessive 'its' (not it's) and ends with a period.",
          distractor_strategy: "Includes common errors: it's/its confusion (B), unnecessary comma (C), missing period (A)",
          characteristics: [
            "End punctuation",
            "Its/it's distinction",
            "Simple sentence",
            "Common error"
          ]
        },
        {
          difficulty: 2,  // Medium (mapped from old level 4)
          question_text: "Which sentence uses commas correctly?",
          answer_options: [
            "A: I bought apples oranges and bananas.",
            "B: I bought apples, oranges, and bananas.",
            "C: I bought apples oranges, and bananas.",
            "D: I bought, apples oranges and bananas."
          ],
          correct_answer: "B",
          explanation: "Commas should separate items in a list. Option B correctly places commas after 'apples' and 'oranges'.",
          distractor_strategy: "Includes missing commas (A), inconsistent comma use (C), and incorrect comma placement (D)",
          characteristics: [
            "Commas in series",
            "List of items",
            "Oxford comma usage",
            "Common punctuation rule"
          ]
        }
      ],

      pattern: {
        format_template: "Which sentence has correct punctuation?",
        key_characteristics: [
          "End marks: periods, question marks, exclamation points",
          "Commas: lists, introductory words, compound sentences",
          "Apostrophes: contractions, possessives",
          "Quotation marks: dialogue",
          "Sentence-level punctuation"
        ],
        distractor_strategies: [
          "Missing punctuation",
          "Extra or unnecessary punctuation",
          "Wrong punctuation type",
          "Apostrophe errors (it's/its, they're/their)",
          "Comma splices or run-ons"
        ],
        difficulty_progression: {
          "1": "Basic end punctuation, obvious errors",
          "2": "More complex comma usage, quotation marks",
          "3": "Sophisticated punctuation, complex sentences",
        }
      }
    },

    // SUB-SKILL 4: Parts of Speech & Word Choice
    "Parts of Speech & Word Choice": {
      description: "Identifying and using appropriate parts of speech and choosing the best word for context",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [1, 2, 3],
      question_format: "Choose the correct word or part of speech",

      examples: [
        {
          difficulty: 1,  // Easy
          question_text: "Choose the word that best completes the sentence:\n\nThe dog is very _____.",
          answer_options: [
            "A: run",
            "B: running",
            "C: friendly",
            "D: friend"
          ],
          correct_answer: "C",
          explanation: "The adjective 'friendly' is needed after 'is' to describe what the dog is like. 'Run' and 'running' are verb forms, and 'friend' is a noun.",
          distractor_strategy: "Includes verb forms (A, B) and related noun (D) that don't work grammatically",
          characteristics: [
            "Basic adjective usage",
            "Simple sentence structure",
            "Obvious correct choice",
            "Common vocabulary"
          ]
        },
        {
          difficulty: 2,  // Medium (mapped from old level 3)
          question_text: "Choose the word that best completes the sentence:\n\nThe children played _____ in the park all afternoon.",
          answer_options: [
            "A: happy",
            "B: happily",
            "C: happiness",
            "D: happier"
          ],
          correct_answer: "B",
          explanation: "The adverb 'happily' is needed to modify the verb 'played.' The other options are adjective (A), noun (C), or comparative adjective (D).",
          distractor_strategy: "Includes other forms of the same word that are incorrect parts of speech for this context",
          characteristics: [
            "Adverb usage",
            "Modifying verb",
            "Word forms",
            "Parts of speech"
          ]
        },
        {
          difficulty: 2,  // Medium (mapped from old level 4)
          question_text: "Which word best completes this sentence?\n\nThe weather today is _____ than yesterday.",
          answer_options: [
            "A: good",
            "B: better",
            "C: best",
            "D: more good"
          ],
          correct_answer: "B",
          explanation: "'Better' is the correct comparative form. 'More good' (D) is grammatically incorrect, and 'best' (C) is superlative, not comparative.",
          distractor_strategy: "Includes incorrect forms: base form (A), superlative (C), and grammatically wrong construction (D)",
          characteristics: [
            "Comparative adjectives",
            "Irregular forms",
            "Comparison context",
            "Common error (more good)"
          ]
        },
        {
          difficulty: 3,  // Hard
          question_text: "Choose the word that best completes the sentence:\n\nThe athlete performed _____ despite her injury, earning respect from everyone.",
          answer_options: [
            "A: good",
            "B: well",
            "C: best",
            "D: better"
          ],
          correct_answer: "B",
          explanation: "'Well' is the correct adverb to modify the verb 'performed.' This is a sophisticated distinction because 'good' is often incorrectly used in spoken English. Students must recognize that 'performed' is a verb requiring an adverb ('well'), not an adjective ('good').",
          distractor_strategy: "Includes the very common error 'good' (A) and comparative/superlative forms that don't fit the context",
          characteristics: [
            "Good vs. well distinction",
            "Adverb modifying verb",
            "Sophisticated grammar concept",
            "Common error in spoken English",
            "Requires understanding part of speech function"
          ]
        }
      ],

      pattern: {
        format_template: "Choose the word that best completes the sentence: [sentence with blank]",
        key_characteristics: [
          "Adjectives vs. adverbs",
          "Comparative and superlative forms",
          "Nouns, verbs, adjectives, adverbs",
          "Word forms and usage",
          "Context-appropriate vocabulary"
        ],
        distractor_strategies: [
          "Wrong part of speech",
          "Incorrect word form",
          "Confused comparatives/superlatives",
          "Double negatives",
          "Commonly confused words (good/well, bad/badly)"
        ],
        difficulty_progression: {
          "1": "Basic parts of speech, obvious choices",
          "2": "Adverb/adjective distinctions, comparatives",
          "3": "Complex word choices, nuanced meanings",
        }
      }
    }

  },

  // ============================================
  // YEAR 5 NAPLAN - NUMERACY
  // ============================================

  "Year 5 NAPLAN - Numeracy": {

    // SUB-SKILL 1: Number Operations & Place Value
    "Number Operations & Place Value": {
      description: "Understanding place value and performing mental arithmetic with whole numbers",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [1, 2, 3],
      question_format: "Solve number problems using mental strategies",

      examples: [
        {
          difficulty: 1,  // Easy (mapped from old level 2)
          question_text: "What is 45 + 38?",
          answer_options: [
            "A: 73",
            "B: 83",
            "C: 93",
            "D: 103"
          ],
          correct_answer: "B",
          explanation: "45 + 38 = 45 + 30 + 8 = 75 + 8 = 83. Or: 45 + 40 - 2 = 85 - 2 = 83.",
          distractor_strategy: "Includes nearby sums and common addition errors",
          characteristics: [
            "Two-digit addition",
            "Mental computation",
            "No regrouping needed across tens boundary",
            "Basic arithmetic"
          ]
        },
        {
          difficulty: 2,  // Medium (mapped from old level 4)
          question_text: "What is the value of the digit 7 in the number 47,325?",
          answer_options: [
            "A: 7",
            "B: 70",
            "C: 700",
            "D: 7,000"
          ],
          correct_answer: "D",
          explanation: "The digit 7 is in the thousands place, so its value is 7,000.",
          distractor_strategy: "Includes the digit itself (A) and incorrect place values (B, C)",
          characteristics: [
            "Place value understanding",
            "Five-digit number",
            "Thousands place",
            "Conceptual understanding"
          ]
        },
        {
          difficulty: 3,  // Hard
          question_text: "What is 8 × 125?",
          answer_options: [
            "A: 900",
            "B: 1,000",
            "C: 1,100",
            "D: 1,250"
          ],
          correct_answer: "B",
          explanation: "8 × 125 can be solved mentally by recognizing that 8 × 125 = 8 × (1000 ÷ 8) = 1,000. Alternatively, 125 = 100 + 25, so 8 × 100 = 800 and 8 × 25 = 200, giving 800 + 200 = 1,000. This requires sophisticated mental computation strategies.",
          distractor_strategy: "Includes results from common calculation errors and approximations",
          characteristics: [
            "Challenging mental multiplication",
            "Strategic thinking required",
            "Pattern recognition (125 × 8 = 1000)",
            "Multi-step mental computation",
            "Sophisticated number sense"
          ]
        }
      ],

      pattern: {
        format_template: "[Arithmetic problem or place value question]",
        key_characteristics: [
          "Mental arithmetic focus",
          "Whole numbers primarily",
          "Place value concepts",
          "4 answer options",
          "No calculator allowed strategies emphasized"
        ],
        distractor_strategies: [
          "Off-by-one errors",
          "Place value confusions",
          "Arithmetic mistakes",
          "Incorrect operation applied",
          "Nearby values"
        ],
        difficulty_progression: {
          "1": "Single-digit operations, basic place value",
          "2": "Larger numbers, multi-step problems",
          "3": "Challenging mental computation, sophisticated concepts",
        }
      }
    },

    // SUB-SKILL 2: Fractions & Basic Fraction Operations
    "Fractions & Basic Fraction Operations": {
      description: "Understanding fractions, equivalent fractions, and simple fraction operations suitable for mental calculation",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [1, 2, 3],
      question_format: "Solve fraction problems using mental strategies",

      examples: [
        {
          difficulty: 1,  // Easy (mapped from old level 2)
          question_text: "Which fraction is equivalent to 1/2?",
          answer_options: [
            "A: 2/3",
            "B: 2/4",
            "C: 1/4",
            "D: 3/4"
          ],
          correct_answer: "B",
          explanation: "2/4 is equivalent to 1/2 because both numerator and denominator are doubled. 2/4 simplifies to 1/2.",
          distractor_strategy: "Includes other common fractions that are not equivalent",
          characteristics: [
            "Equivalent fractions",
            "Simple fractions",
            "Mental calculation",
            "Basic fraction concept"
          ]
        },
        {
          difficulty: 2,  // Medium (mapped from old level 4)
          question_text: "What is 3/4 + 1/4?",
          answer_options: [
            "A: 4/8",
            "B: 4/4",
            "C: 3/8",
            "D: 1"
          ],
          correct_answer: "D",
          explanation: "3/4 + 1/4 = 4/4 = 1 whole. When adding fractions with the same denominator, add the numerators.",
          distractor_strategy: "Includes incorrect addition (A), the unreduced answer (B), and incorrect numerator (C)",
          characteristics: [
            "Adding fractions",
            "Like denominators",
            "Simplifying to whole",
            "Mental computation"
          ]
        },
        {
          difficulty: 3,  // Hard
          question_text: "A recipe calls for 2/3 cup of flour. If you want to make 1 1/2 times the recipe, how much flour do you need?",
          answer_options: [
            "A: 1/2 cup",
            "B: 2/3 cup",
            "C: 1 cup",
            "D: 1 1/3 cups"
          ],
          correct_answer: "C",
          explanation: "To find 1 1/2 times 2/3, multiply: (3/2) × (2/3) = 6/6 = 1 cup. This can also be solved by finding half of 2/3 (which is 1/3) and adding it to the original 2/3: 2/3 + 1/3 = 3/3 = 1. This requires sophisticated fraction multiplication and understanding of mixed numbers.",
          distractor_strategy: "Includes common errors from incorrect operations or partial calculations",
          characteristics: [
            "Fraction multiplication",
            "Mixed numbers",
            "Real-world context",
            "Multi-step problem",
            "Sophisticated fraction operations"
          ]
        }
      ],

      pattern: {
        format_template: "[Fraction problem for mental calculation]",
        key_characteristics: [
          "Equivalent fractions",
          "Comparing fractions",
          "Simple addition/subtraction with like denominators",
          "Fraction of a quantity",
          "Fractions on number line"
        ],
        distractor_strategies: [
          "Adding denominators incorrectly",
          "Not simplifying",
          "Confusing numerator and denominator",
          "Incorrect equivalents",
          "Improper comparisons"
        ],
        difficulty_progression: {
          "1": "Basic fraction recognition, simple equivalents",
          "2": "Fraction operations with like denominators, fraction of quantity",
          "3": "Challenging fraction operations, mixed numbers",
        }
      }
    },

    // SUB-SKILL 3: Patterns & Algebra
    "Patterns & Algebra": {
      description: "Identifying number patterns, completing sequences, and solving simple algebraic problems",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [1, 2, 3],
      question_format: "Identify patterns and solve algebraic problems",

      examples: [
        {
          difficulty: 1,  // Easy (mapped from old level 2)
          question_text: "What is the next number in this pattern?\n\n2, 4, 6, 8, ___",
          answer_options: [
            "A: 9",
            "B: 10",
            "C: 12",
            "D: 16"
          ],
          correct_answer: "B",
          explanation: "The pattern increases by 2 each time (even numbers). 8 + 2 = 10.",
          distractor_strategy: "Includes numbers that follow other patterns or common mistakes",
          characteristics: [
            "Simple arithmetic pattern",
            "Adding 2",
            "Even numbers",
            "Mental calculation"
          ]
        },
        {
          difficulty: 2,  // Medium (mapped from old level 4)
          question_text: "If n + 7 = 15, what is the value of n?",
          answer_options: [
            "A: 7",
            "B: 8",
            "C: 15",
            "D: 22"
          ],
          correct_answer: "B",
          explanation: "To find n, subtract 7 from both sides: n = 15 - 7 = 8. Check: 8 + 7 = 15 ✓",
          distractor_strategy: "Includes the added number (A), the sum (C), and adding instead of subtracting (D)",
          characteristics: [
            "Simple equation",
            "One variable",
            "Basic algebra",
            "Inverse operation"
          ]
        },
        {
          difficulty: 3,  // Hard
          question_text: "Look at this pattern:\n\n1, 4, 9, 16, 25, ___\n\nWhat is the next number?",
          answer_options: [
            "A: 30",
            "B: 32",
            "C: 36",
            "D: 49"
          ],
          correct_answer: "C",
          explanation: "This is the pattern of square numbers: 1² = 1, 2² = 4, 3² = 9, 4² = 16, 5² = 25, so the next is 6² = 36. Students must recognize this sophisticated pattern beyond simple addition or multiplication sequences.",
          distractor_strategy: "Includes results from incorrect patterns (adding 5, adding 6, or next square after 36)",
          characteristics: [
            "Square number pattern",
            "Non-linear sequence",
            "Pattern recognition",
            "Sophisticated mathematical thinking",
            "Requires knowledge of multiplication facts"
          ]
        }
      ],

      pattern: {
        format_template: "[Pattern or algebraic equation]",
        key_characteristics: [
          "Number patterns (arithmetic, geometric)",
          "Shape patterns",
          "Simple equations with one variable",
          "Finding missing numbers",
          "Input-output rules"
        ],
        distractor_strategies: [
          "Following wrong pattern",
          "Arithmetic errors",
          "Using wrong operation",
          "Off-by-one errors",
          "Confusing variables"
        ],
        difficulty_progression: {
          "1": "Simple repeating patterns, obvious sequences",
          "2": "More complex patterns, simple equations",
          "3": "Complex sequences, multi-step equations",
        }
      }
    },

    // SUB-SKILL 4: Measurement, Time & Money
    "Measurement, Time & Money": {
      description: "Solving problems involving measurement units, time calculations, and money (mental computation)",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [1, 2, 3],
      question_format: "Solve measurement, time, or money problems",

      examples: [
        {
          difficulty: 1,  // Easy (mapped from old level 2)
          question_text: "How many centimeters are in 2 meters?",
          answer_options: [
            "A: 2 cm",
            "B: 20 cm",
            "C: 200 cm",
            "D: 2000 cm"
          ],
          correct_answer: "C",
          explanation: "1 meter = 100 cm, so 2 meters = 2 × 100 = 200 cm.",
          distractor_strategy: "Includes powers of 10 errors and place value confusions",
          characteristics: [
            "Metric conversion",
            "Meters to centimeters",
            "Multiplication by 100",
            "Standard unit conversion"
          ]
        },
        {
          difficulty: 2,  // Medium (mapped from old level 4)
          question_text: "A movie starts at 2:45 PM and runs for 2 hours and 30 minutes. What time does it end?",
          answer_options: [
            "A: 4:15 PM",
            "B: 4:75 PM",
            "C: 5:15 PM",
            "D: 5:30 PM"
          ],
          correct_answer: "C",
          explanation: "2:45 + 2 hours = 4:45, then + 30 minutes = 5:15 PM.",
          distractor_strategy: "Includes errors in time addition and 60-minute conversion",
          characteristics: [
            "Time addition",
            "Duration calculation",
            "12-hour format",
            "Mental time computation"
          ]
        },
        {
          difficulty: 3,  // Hard
          question_text: "Emma left home at 8:35 AM and arrived at her grandmother's house at 11:20 AM. If she stopped for a 25-minute break along the way, how long did she actually spend traveling (not including the break)?",
          answer_options: [
            "A: 2 hours 20 minutes",
            "B: 2 hours 45 minutes",
            "C: 2 hours 50 minutes",
            "D: 3 hours 10 minutes"
          ],
          correct_answer: "A",
          explanation: "Total time from 8:35 AM to 11:20 AM is 2 hours and 45 minutes (8:35 to 11:35 is 3 hours, minus 15 minutes = 2 hours 45 minutes). Subtract the 25-minute break: 2 hours 45 minutes - 25 minutes = 2 hours 20 minutes of actual travel time. This requires multiple steps and careful time calculation.",
          distractor_strategy: "Includes the total time without subtracting break (B), and results from calculation errors",
          characteristics: [
            "Multi-step time problem",
            "Elapsed time calculation",
            "Subtraction of time intervals",
            "Complex mental computation",
            "Real-world context"
          ]
        }
      ],

      pattern: {
        format_template: "[Problem involving measurement, time, or money]",
        key_characteristics: [
          "Metric conversions (m/cm, kg/g, L/mL)",
          "Time calculations and duration",
          "Money calculations (simple addition/subtraction)",
          "Perimeter and area (simple shapes)",
          "Reading scales and gauges"
        ],
        distractor_strategies: [
          "Unit conversion errors",
          "Decimal place errors",
          "Time calculation mistakes",
          "Incorrect operations",
          "Rounding errors"
        ],
        difficulty_progression: {
          "1": "Basic conversions, simple money, telling time",
          "2": "Multiple-step conversions, elapsed time, multi-coin problems",
          "3": "Challenging measurement scenarios, complex time/money problems",
        }
      }
    },

    // SUB-SKILL 5: Data & Basic Probability
    "Data & Basic Probability": {
      description: "Interpreting simple data displays and understanding basic probability concepts",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [1, 2, 3],
      question_format: "Answer questions about data or probability",

      examples: [
        {
          difficulty: 1,  // Easy (mapped from old level 2)
          question_text: "A bag contains 3 red marbles and 2 blue marbles. What is the total number of marbles?",
          answer_options: [
            "A: 2",
            "B: 3",
            "C: 5",
            "D: 6"
          ],
          correct_answer: "C",
          explanation: "Total marbles = 3 red + 2 blue = 5 marbles.",
          distractor_strategy: "Includes individual quantities (A, B) and a calculation error (D)",
          characteristics: [
            "Simple counting",
            "Probability setup",
            "Basic addition",
            "Data context"
          ]
        },
        {
          difficulty: 2,  // Medium (mapped from old level 4)
          question_text: "A spinner has 4 equal sections: red, blue, green, and yellow. What is the chance of spinning red?",
          answer_options: [
            "A: 1 out of 2",
            "B: 1 out of 3",
            "C: 1 out of 4",
            "D: 1 out of 5"
          ],
          correct_answer: "C",
          explanation: "There are 4 equal sections and red is 1 of them, so the probability is 1 out of 4.",
          distractor_strategy: "Includes other fractions that might result from miscounting or misunderstanding",
          characteristics: [
            "Basic probability",
            "Equal outcomes",
            "Fraction language",
            "Conceptual understanding"
          ]
        },
        {
          difficulty: 3,  // Hard
          question_text: "This table shows the number of books read by students in a class over one month:\n\nBooks Read: 0, 1, 2, 3, 4, 5\nNumber of Students: 2, 5, 8, 6, 3, 1\n\nHow many more students read 2 books than students who read 4 or 5 books combined?",
          answer_options: [
            "A: 2 students",
            "B: 4 students",
            "C: 5 students",
            "D: 8 students"
          ],
          correct_answer: "B",
          explanation: "Students who read 2 books: 8. Students who read 4 or 5 books: 3 + 1 = 4. Difference: 8 - 4 = 4 students. This requires interpreting the table, combining data from multiple categories, and performing subtraction.",
          distractor_strategy: "Includes the number who read 4+5 books (A), just those who read 2 books (D), and other calculation errors",
          characteristics: [
            "Complex data interpretation",
            "Multi-step calculation",
            "Combining categories",
            "Table reading",
            "Comparison question"
          ]
        }
      ],

      pattern: {
        format_template: "[Data display or probability scenario with question]",
        key_characteristics: [
          "Reading simple graphs (bar, picture, line plots)",
          "Tables and charts",
          "Basic probability (equally likely outcomes)",
          "Counting and comparing data",
          "Mode, median concepts"
        ],
        distractor_strategies: [
          "Reading wrong part of graph",
          "Calculation errors",
          "Misunderstanding probability",
          "Confusing total with parts",
          "Scale reading errors"
        ],
        difficulty_progression: {
          "1": "Simple pictographs, obvious data",
          "2": "Multiple data sets, comparison questions",
          "3": "Interpreting trends, complex probability",
        }
      }
    }

  }

} as const;
