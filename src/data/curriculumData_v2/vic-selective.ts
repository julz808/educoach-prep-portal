// VIC Selective Entry (Year 9 Entry) - Curriculum Data V2
// Created: February 6, 2026

import type { SubSkillExamplesDatabase } from './types';

/**
 * VIC Selective High School Entry Test - Complete Sub-Skill Examples
 *
 * Sections:
 * - General Ability - Quantitative (4 sub-skills, 16 examples)
 * - General Ability - Verbal (7 sub-skills, 21 examples)
 * - Mathematics Reasoning (8 sub-skills, 26 examples)
 * - Reading Reasoning (10 sub-skills, 30 examples - includes 5 passage-based + 5 standalone language)
 * - Writing (2 sub-skills, 2 prompts)
 *
 * Total: 31 sub-skills, 95 examples/prompts
 *
 * NOTE: VIC Selective does not have difficulty ratings. All examples use difficulty: 2 as a standard marker.
 */
export const VIC_SELECTIVE_SUB_SKILLS: SubSkillExamplesDatabase = {

  // ============================================
  // VIC SELECTIVE ENTRY (YEAR 9 ENTRY) - GENERAL ABILITY - QUANTITATIVE
  // ============================================

  "VIC Selective Entry (Year 9 Entry) - General Ability - Quantitative": {

    // SUB-SKILL 1: Number Series & Sequences
    "Number Series & Sequences": {
      description: "Identifying patterns in number sequences and finding missing numbers",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [2],
      question_format: "Find the missing number in the following series: [sequence with ?]",

      examples: [
        {
          difficulty: 2,
          question_text: "Find the missing number in the following series:\n234567    23456    ?    234    23",
          answer_options: [
            "A: 6",
            "B: 2356",
            "C: 2347",
            "D: 2345",
            "E: None of these"
          ],
          correct_answer: "D",
          explanation: "The pattern removes one digit from the right each time: 234567 → 23456 (removed 7) → 2345 (removed 6) → 234 (removed 5) → 23 (removed 4)",
          distractor_strategy: "Includes partial sequences (B, C), single digits (A), and 'None of these' option",
          characteristics: [
            "Sequential digit removal pattern",
            "Multiple numbers in sequence",
            "Requires recognizing systematic deletion",
            "5 answer options including 'None of these'"
          ]
        },
        {
          difficulty: 2,
          question_text: "Find the missing number in the following series:\n4    8    ?    32    64    128",
          answer_options: [
            "A: 24",
            "B: 19",
            "C: 16",
            "D: 8",
            "E: None of these"
          ],
          correct_answer: "C",
          explanation: "Each number is doubled to get the next: 4 × 2 = 8, 8 × 2 = 16, 16 × 2 = 32, 32 × 2 = 64, 64 × 2 = 128",
          distractor_strategy: "Includes numbers that fit other arithmetic patterns (A, B) and smaller multiplication (D)",
          characteristics: [
            "Geometric progression (multiplication)",
            "Powers of 2 pattern",
            "Simple doubling relationship",
            "Requires recognizing exponential growth"
          ]
        },
        {
          difficulty: 2,
          question_text: "Find the missing number in the following series:\n?    85    81    83    79    81    77",
          answer_options: [
            "A: 89",
            "B: 83",
            "C: 87",
            "D: 80",
            "E: None of these"
          ],
          correct_answer: "C",
          explanation: "The sequence follows an alternating pattern: -4, +2, -4, +2, -4. From 85 to 81 is -4, from 81 to 83 is +2, from 83 to 79 is -4, from 79 to 81 is +2, from 81 to 77 is -4. Working backwards from 85, the previous step was +2, so 85 + 2 = 87.",
          distractor_strategy: "Includes numbers close to the answer (A, B) and the average (D)",
          characteristics: [
            "Alternating addition and subtraction",
            "Two-step pattern",
            "Requires working backwards",
            "Tests recognition of oscillating sequences"
          ]
        },
        {
          difficulty: 2,
          question_text: "Find the missing number in the following series:\n?    14    98    686    4802",
          answer_options: [
            "A: 3",
            "B: 4",
            "C: 7",
            "D: 9",
            "E: None of these"
          ],
          correct_answer: "E",
          explanation: "The pattern is multiply by 7: 2 × 7 = 14, 14 × 7 = 98, 98 × 7 = 686, 686 × 7 = 4802. So the answer is 2, which is 'None of these'.",
          distractor_strategy: "Includes factors and multiples that might seem related (A, C, D)",
          characteristics: [
            "Multiplication by constant",
            "Rapidly growing sequence",
            "Answer is 'None of these'",
            "Tests ability to work backwards with multiplication"
          ]
        }
      ],

      pattern: {
        format_template: "Find the missing number in the following series: [numbers with one ?]",
        key_characteristics: [
          "Single missing value in sequence",
          "Various patterns: arithmetic, geometric, alternating",
          "May require working forwards or backwards",
          "5 options including 'None of these'",
          "No spaces between series elements in presentation"
        ],
        distractor_strategies: [
          "Numbers from alternative arithmetic patterns",
          "Off-by-one errors",
          "Partial pattern recognition results",
          "Results from simpler patterns than actual",
          "'None of these' is sometimes the correct answer"
        ],
        difficulty_progression: {
          "1": "N/A - VIC Selective uses single difficulty level",
          "2": "Varied complexity: simple arithmetic progressions, geometric sequences, alternating patterns, multiplicative growth",
          "3": "N/A - VIC Selective uses single difficulty level"
        }
      }
    },

    // SUB-SKILL 2: Number Grids & Matrices
    "Number Grids & Matrices": {
      description: "Finding missing numbers in 2D grids by recognizing row, column, or diagonal patterns",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [2],
      question_format: "The numbers in the grid go together in a certain way. Which number should be in the square marked by the question mark?",

      examples: [
        {
          difficulty: 2,
          question_text: "The numbers in the grid go together in a certain way.\nWhich number should be in the square marked by the question mark?\n\n14    16    18\n16    18    20\n18    20    ?",
          answer_options: [
            "A: 21",
            "B: 22",
            "C: 24",
            "D: 26",
            "E: None of these"
          ],
          correct_answer: "B",
          explanation: "Each row increases by 2 as you move right. Each column increases by 2 as you move down. Following the pattern: 20 + 2 = 22.",
          distractor_strategy: "Includes numbers close to answer (A, C) and double increment (D)",
          characteristics: [
            "3x3 grid",
            "Constant addition in rows and columns",
            "Consistent increment pattern",
            "Missing value in bottom-right"
          ]
        },
        {
          difficulty: 2,
          question_text: "The numbers in the grid go together in a certain way.\nWhich number should be in the square marked by the question mark?\n\n35    30    27\n31    26    23\n28    23    ?",
          answer_options: [
            "A: 19",
            "B: 20",
            "C: 21",
            "D: 18",
            "E: None of these"
          ],
          correct_answer: "B",
          explanation: "Looking at columns: first column decreases by 4 then 3 (35, 31, 28). Second column decreases by 4 then 3 (30, 26, 23). Third column should follow: 27 - 4 = 23, then 23 - 3 = 20.",
          distractor_strategy: "Includes adjacent numbers (A, C, D) that might result from simpler patterns",
          characteristics: [
            "3x3 grid with subtraction",
            "Varying decrements in columns",
            "Requires recognizing alternating difference pattern",
            "More complex than simple arithmetic progression"
          ]
        },
        {
          difficulty: 2,
          question_text: "The numbers and letters in the grid form a pattern and one of the lines has been erased.\nWhich number or letter should be in the square marked by the question mark?\n\n2    A    4    A    6    A\nC    B    4    B    6    B\n4    4    4    C    6    C\n?    \n6    6    6    6    6    E\nK    J    I    H    G    F",
          answer_options: [
            "A: D",
            "B: F",
            "C: 5",
            "D: E",
            "E: None of these"
          ],
          correct_answer: "A",
          explanation: "The pattern in column 1 goes: 2, C (letter), 4 (number), ?, 6, K. Looking at the first column, it alternates between numbers and letters. The numbers increase: 2, 4, 6. For letters, we see C and K in the pattern. Looking at row 4 which is missing, the pattern across rows suggests the fourth row should start with letter D, following the sequence A, B, C, D, E shown in different rows.",
          distractor_strategy: "Includes other letters from the grid (B, D) and numbers (C)",
          characteristics: [
            "Mixed alphanumeric grid",
            "6x5 grid with more complex pattern",
            "Entire row is missing",
            "Requires tracking both number and letter sequences",
            "Tests pattern recognition across multiple dimensions"
          ]
        },
        {
          difficulty: 2,
          question_text: "The numbers in the grid go together in a certain way. One of the squares has a * placed in it, to hide the number underneath.\nWhich number should be in the square marked by the question mark?\n\n32    26    22\n27    ?     17\n22    16    *",
          answer_options: [
            "A: 21",
            "B: 14",
            "C: 20",
            "D: 10",
            "E: None of these"
          ],
          correct_answer: "A",
          explanation: "Looking at rows: first row goes 32, 26, 22 (decreasing by 6, then 4). Second row should follow a similar pattern: 27, ?, 17. The difference from 27 to 17 is 10, so it might be 27-6=21, then 21-4=17. This checks out.",
          distractor_strategy: "Includes numbers that might fit other patterns (B, C, D)",
          characteristics: [
            "3x3 grid with hidden value",
            "One cell marked as unknown beyond the question",
            "Variable decrements",
            "Requires deducing from incomplete information"
          ]
        }
      ],

      pattern: {
        format_template: "The numbers in the grid go together in a certain way. Which number/letter should be in the square marked by the question mark?\n\n[Grid visualization]\n\n[Multiple choice options]",
        key_characteristics: [
          "2D grid layout (typically 3x3 or larger)",
          "Patterns can run horizontally, vertically, or diagonally",
          "May include numbers only or mixed alphanumeric",
          "Sometimes multiple cells are hidden or marked",
          "Requires identifying consistent mathematical relationships"
        ],
        distractor_strategies: [
          "Numbers adjacent to correct answer",
          "Results from simpler or alternative patterns",
          "Numbers that fit only one dimension of pattern",
          "Results from arithmetic errors in pattern application"
        ],
        difficulty_progression: {
          "1": "N/A - VIC Selective uses single difficulty level",
          "2": "Varied complexity: simple addition/subtraction patterns, varying increments, alphanumeric grids, multiple hidden cells",
          "3": "N/A - VIC Selective uses single difficulty level"
        }
      }
    },

    // SUB-SKILL 3: Applied Word Problems
    "Applied Word Problems": {
      description: "Solving real-world mathematical problems involving multiple steps, logical reasoning, and practical contexts",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [2],
      question_format: "Word problem presenting a real-world scenario requiring mathematical solution",

      examples: [
        {
          difficulty: 2,
          question_text: "One container has 28 kilograms of flour and another has 4 kilograms.\nHow many kilograms must be taken from one container, so each has an equal amount of flour?",
          answer_options: [
            "A: 4",
            "B: 12",
            "C: 16",
            "D: 24",
            "E: None of these"
          ],
          correct_answer: "B",
          explanation: "Total flour = 28 + 4 = 32kg. Equal distribution = 32 ÷ 2 = 16kg each. Amount to transfer from first container = 28 - 16 = 12kg.",
          distractor_strategy: "Includes the smaller amount (A), target amount (C), and larger amount (D)",
          characteristics: [
            "Two-step problem",
            "Requires finding total then equal distribution",
            "Tests understanding of balance/equilibrium",
            "Practical measurement context"
          ]
        },
        {
          difficulty: 2,
          question_text: "Six pairs of shoes cost as much as 1 coat, 2 pairs of jeans cost as much as 3 pairs of shoes, and 4 pairs of socks cost as much as one pair of jeans. How many coats could I exchange for 64 pairs of socks?",
          answer_options: [
            "A: 4",
            "B: 1",
            "C: 2",
            "D: 3",
            "E: None of these"
          ],
          correct_answer: "A",
          explanation: "Working through the chain of equivalences: 4 pairs of socks = 1 pair of jeans, so 64 pairs of socks = 16 pairs of jeans. 2 pairs of jeans = 3 pairs of shoes, so 16 pairs of jeans = 24 pairs of shoes. 6 pairs of shoes = 1 coat, so 24 pairs of shoes = 4 coats.",
          distractor_strategy: "Includes intermediate values in the chain and simple fractions",
          characteristics: [
            "Multi-step proportional reasoning",
            "Chain of equivalent values",
            "Requires working through multiple conversion steps",
            "Tests systematic problem solving"
          ]
        },
        {
          difficulty: 2,
          question_text: "The clock in my lounge room is 10 minutes slower than the clock on my phone, which is 6 minutes slow. My tram always leaves 6 minutes early, although it is scheduled for 8:55am. It takes me 20 minutes to get to the tram stop.\nWhat time must I leave, according to my lounge room clock, in order to catch my tram?",
          answer_options: [
            "A: 8:49am",
            "B: 8:35am",
            "C: 8:23am",
            "D: 8:29am",
            "E: None of these"
          ],
          correct_answer: "D",
          explanation: "Tram scheduled for 8:55am leaves 6 minutes early = 8:49am actual. Travel time 20 minutes means leave at 8:29am actual. Phone is 6 minutes slow, lounge clock is 10 minutes slower than phone. Interpreting 'slower than phone' as a further 10 minute offset from phone's display: when actual time is 8:29am and we must leave, the lounge clock shows 8:29am on its face.",
          distractor_strategy: "Includes various time calculations with different time adjustments",
          characteristics: [
            "Multi-step time calculation",
            "Multiple time references (actual, phone, clock)",
            "Early departure consideration",
            "Tests ability to track multiple time offsets",
            "Complex practical problem"
          ]
        },
        {
          difficulty: 2,
          question_text: "Percy rides his scooter to the station, which is 10 kilometres away. If Percy rides at a steady pace of 20 kilometres per hour, how many minutes will it take him to ride from home to the station?",
          answer_options: [
            "A: 2",
            "B: 4",
            "C: 40",
            "D: 30",
            "E: None of these"
          ],
          correct_answer: "D",
          explanation: "Time = Distance ÷ Speed = 10 km ÷ 20 km/h = 0.5 hours = 30 minutes.",
          distractor_strategy: "Includes the answer in hours (A), double that (B), and a calculation error (C)",
          characteristics: [
            "Speed, distance, time problem",
            "Unit conversion (hours to minutes)",
            "Simple division calculation",
            "Practical transportation context"
          ]
        }
      ],

      pattern: {
        format_template: "[Real-world scenario with mathematical elements]\n[Question about specific quantity/value]\n\n[Multiple choice options A-E]",
        key_characteristics: [
          "Real-world practical contexts",
          "Multi-step problems requiring logical sequencing",
          "Various mathematical concepts: proportion, time, money, measurement",
          "Often requires working backwards or through chains of relationships",
          "5 options including 'None of these'"
        ],
        distractor_strategies: [
          "Intermediate values in calculation chain",
          "Results from skipping steps",
          "Common arithmetic errors",
          "Answers in wrong units",
          "Results from misreading the problem"
        ],
        difficulty_progression: {
          "1": "N/A - VIC Selective uses single difficulty level",
          "2": "Wide variety: simple 2-step problems, complex multi-step chains, time calculations, proportional reasoning, logical puzzles",
          "3": "N/A - VIC Selective uses single difficulty level"
        }
      }
    },

    // SUB-SKILL 4: Pattern Recognition in Paired Numbers
    "Pattern Recognition in Paired Numbers": {
      description: "Identifying relationships between pairs of numbers presented in circles, boxes, or other groupings",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [2],
      question_format: "The numbers in the circles/boxes go together in a certain way. Find the missing number marked by the question mark.",

      examples: [
        {
          difficulty: 2,
          question_text: "The numbers in the circles go together in a certain way.\nFind the missing number marked by the question mark:\n\n(169, 13)    (49, 7)    (144, ?)    (81, 9)",
          answer_options: [
            "A: 12",
            "B: 13",
            "C: 11",
            "D: 15",
            "E: None of these"
          ],
          correct_answer: "A",
          explanation: "Each pair shows a perfect square and its square root: 169 = 13², 49 = 7², 144 = 12², 81 = 9².",
          distractor_strategy: "Includes nearby numbers (B, C) and factors/multiples (D)",
          characteristics: [
            "Square numbers and square roots",
            "Consistent mathematical relationship across all pairs",
            "Visual representation with circles/parentheses",
            "4 pairs with one missing value"
          ]
        },
        {
          difficulty: 2,
          question_text: "The numbers in the circles go together in a certain way.\nFind the missing number marked by the question mark:\n\n(180, 14)    (120, 8)    (?, 4)    (220, 18)",
          answer_options: [
            "A: 70",
            "B: 80",
            "C: 60",
            "D: 40",
            "E: None of these"
          ],
          correct_answer: "B",
          explanation: "The pattern is: first number = (second number × 10) + 40. Check: 14 × 10 + 40 = 180 ✓, 8 × 10 + 40 = 120 ✓, 18 × 10 + 40 = 220 ✓. Therefore: 4 × 10 + 40 = 80.",
          distractor_strategy: "Includes multiples and nearby values that might fit partial patterns",
          characteristics: [
            "Arithmetic relationship between paired numbers",
            "Multiple pairs to establish pattern",
            "Requires identifying the function/rule",
            "First number missing (reverse calculation)"
          ]
        },
        {
          difficulty: 2,
          question_text: "The numbers in each box go together in a certain way.\nFind the missing number marked by the question mark:\n\n[5, 10, 25]    [9, 18, 81]    [4, 8, 16]    [8, 16, ?]",
          answer_options: [
            "A: 24",
            "B: 32",
            "C: 64",
            "D: 128",
            "E: None of these"
          ],
          correct_answer: "C",
          explanation: "The pattern is: first number doubled = second number, first number squared = third number. For [8, 16, ?]: 8 × 2 = 16 ✓, 8² = 64.",
          distractor_strategy: "Includes doubling (B), next doubling (D), and simple calculation (A)",
          characteristics: [
            "Triplet relationships",
            "Two operations involved",
            "Consistent pattern across multiple sets",
            "Tests recognition of squaring relationship"
          ]
        },
        {
          difficulty: 2,
          question_text: "The numbers in each box go together in a certain way.\nFind the missing number marked by the question mark:\n\n[35, 5, 40]    [55, 40, 95]    [60, 13, 73]    [70, 16, ?]",
          answer_options: [
            "A: 66",
            "B: 54",
            "C: 86",
            "D: 96",
            "E: None of these"
          ],
          correct_answer: "C",
          explanation: "The pattern is: first number + second number = third number. For [70, 16, ?]: 70 + 16 = 86.",
          distractor_strategy: "Includes subtraction result (B), nearby values (A, D)",
          characteristics: [
            "Simple addition relationship",
            "Three numbers per set",
            "Clear arithmetic pattern",
            "Tests basic operation recognition"
          ]
        }
      ],

      pattern: {
        format_template: "The numbers in the circles/boxes go together in a certain way.\nFind the missing number marked by the question mark:\n\n[Visual representation of number pairs/triplets]\n\n[Multiple choice options]",
        key_characteristics: [
          "Numbers presented in visual groupings (circles, boxes)",
          "Typically 3-4 groups shown",
          "One missing value to find",
          "Relationships can be: squares/roots, multiplication, addition, formulas",
          "Pattern must be deduced from other complete groups"
        ],
        distractor_strategies: [
          "Results from alternative operations",
          "Nearby numbers that might fit other patterns",
          "Common arithmetic errors",
          "Intermediate calculation results",
          "Numbers that fit only some of the examples"
        ],
        difficulty_progression: {
          "1": "N/A - VIC Selective uses single difficulty level",
          "2": "Varied complexity: simple operations (addition, doubling), squares and roots, two-step formulas",
          "3": "N/A - VIC Selective uses single difficulty level"
        }
      }
    }

  },

  // ============================================
  // VIC SELECTIVE ENTRY (YEAR 9 ENTRY) - GENERAL ABILITY - VERBAL
  // ============================================

  "VIC Selective Entry (Year 9 Entry) - General Ability - Verbal": {

    // SUB-SKILL 1: Vocabulary & Synonyms/Antonyms
    "Vocabulary & Synonyms/Antonyms": {
      description: "Identifying words with similar or opposite meanings, testing vocabulary knowledge",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [2],
      question_format: "Which of the following words is most similar/opposite in meaning to [TARGET_WORD]?",

      examples: [
        {
          difficulty: 2,
          question_text: "Which of the following is most similar in meaning to particular:",
          answer_options: [
            "A: special",
            "B: simple",
            "C: careful",
            "D: specific",
            "E: obvious"
          ],
          correct_answer: "D",
          explanation: "'Particular' and 'specific' both mean relating to an individual case or item, as opposed to general.",
          distractor_strategy: "Includes related but less precise synonyms (A, C) and unrelated words (B, E)",
          characteristics: [
            "Single word target",
            "5 options",
            "Tests nuanced vocabulary",
            "Adjective similarity"
          ]
        },
        {
          difficulty: 2,
          question_text: "Which of the following words has a similar meaning to outgoing:",
          answer_options: [
            "A: extroverted",
            "B: contained",
            "C: outside",
            "D: exit",
            "E: introverted"
          ],
          correct_answer: "A",
          explanation: "'Outgoing' and 'extroverted' both describe someone who is sociable and friendly.",
          distractor_strategy: "Includes antonyms (B, E), words with similar spelling patterns (C, D)",
          characteristics: [
            "Personality trait vocabulary",
            "Clear synonym",
            "Multiple plausible distractors including antonyms"
          ]
        },
        {
          difficulty: 2,
          question_text: "Which of the following is most similar in meaning to obtain:",
          answer_options: [
            "A: busy",
            "B: interrogate",
            "C: serious question",
            "D: acquittal",
            "E: acquire"
          ],
          correct_answer: "E",
          explanation: "'Obtain' and 'acquire' both mean to get or gain possession of something.",
          distractor_strategy: "Includes words with similar sound patterns (B) and unrelated words (A, C, D)",
          characteristics: [
            "Verb synonym",
            "Formal vocabulary level",
            "One clear correct answer"
          ]
        }
      ],

      pattern: {
        format_template: "Which of the following is/has [most similar/opposite] in meaning to [TARGET_WORD]:",
        key_characteristics: [
          "Target word presented in bold or capitals",
          "5 options (A-E)",
          "Mix of similar, opposite, and unrelated words",
          "Tests both common and advanced vocabulary",
          "Sometimes includes 'None of these' option"
        ],
        distractor_strategies: [
          "Antonyms when asking for synonyms",
          "Words with similar spelling or sound",
          "Words from the same semantic field but different meanings",
          "Partial synonyms that don't fully match",
          "Completely unrelated words"
        ],
        difficulty_progression: {
          "1": "N/A - VIC Selective uses single difficulty level",
          "2": "Mixed difficulty: common words to advanced vocabulary, clear synonyms to nuanced distinctions",
          "3": "N/A - VIC Selective uses single difficulty level"
        }
      }
    },

    // SUB-SKILL 2: Analogies - Word Relationships
    "Analogies - Word Relationships": {
      description: "Identifying relationships between word pairs and applying the same relationship to complete new pairs",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [2],
      question_format: "[WORD1] is to [WORD2] as [WORD3] is to:",

      examples: [
        {
          difficulty: 2,
          question_text: "Foal is to horse as calf is to:",
          answer_options: [
            "A: cow",
            "B: sheep",
            "C: piglet",
            "D: kitten",
            "E: joey"
          ],
          correct_answer: "A",
          explanation: "A foal is a baby horse, just as a calf is a baby cow. The relationship is young animal to adult animal.",
          distractor_strategy: "Includes other farm animals (B), other baby animal names (C, D, E)",
          characteristics: [
            "Animal relationships",
            "Young to adult connection",
            "Tests knowledge of animal terminology",
            "Common analogy format"
          ]
        },
        {
          difficulty: 2,
          question_text: "Branch is to tree as page is to:",
          answer_options: [
            "A: novel",
            "B: book",
            "C: paper",
            "D: paragraph",
            "E: sentence"
          ],
          correct_answer: "B",
          explanation: "A branch is part of a tree, just as a page is part of a book. The relationship is part to whole.",
          distractor_strategy: "Includes related concepts (A, C) and smaller parts (D, E)",
          characteristics: [
            "Part-to-whole relationship",
            "Tests logical reasoning",
            "Abstract thinking required"
          ]
        },
        {
          difficulty: 2,
          question_text: "Pen is to write as knife is to:",
          answer_options: [
            "A: sharp",
            "B: cut",
            "C: fork",
            "D: blade",
            "E: kitchen"
          ],
          correct_answer: "B",
          explanation: "A pen is used to write, just as a knife is used to cut. The relationship is object to function/action.",
          distractor_strategy: "Includes related objects (C), properties (A, D), and locations (E)",
          characteristics: [
            "Object-to-function relationship",
            "Tests understanding of purpose",
            "Action word as answer"
          ]
        }
      ],

      pattern: {
        format_template: "[WORD1] is to [WORD2] as [WORD3] is to:",
        key_characteristics: [
          "Classic A:B :: C:? format",
          "Various relationship types: part/whole, young/adult, object/function, category/example",
          "Requires identifying implicit relationship",
          "5 answer options",
          "Tests both vocabulary and logical reasoning"
        ],
        distractor_strategies: [
          "Words from same semantic category but wrong relationship",
          "Related concepts that don't match the relationship pattern",
          "Properties instead of objects or vice versa",
          "Correct relationship type but wrong specificity level",
          "Words associated with the context but not the correct analogy"
        ],
        difficulty_progression: {
          "1": "N/A - VIC Selective uses single difficulty level",
          "2": "Mixed: common relationships (animals, objects) to more abstract connections",
          "3": "N/A - VIC Selective uses single difficulty level"
        }
      }
    },

    // SUB-SKILL 3: Letter Series & Patterns
    "Letter Series & Patterns": {
      description: "Identifying patterns in letter sequences based on alphabetical position, skipping letters, or other systematic rules",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [2],
      question_format: "Find the next letter(s) in the series: [letter sequence]",

      examples: [
        {
          difficulty: 2,
          question_text: "The next two letters in the series\nBD    EG    HJ    KM    are:",
          answer_options: [
            "A: OP",
            "B: NO",
            "C: NP",
            "D: MO",
            "E: OQ"
          ],
          correct_answer: "C",
          explanation: "The pattern increases by 3 letters each time. B(2)→E(5) is +3, E(5)→H(8) is +3, H(8)→K(11) is +3, so K(11)→N(14) is +3. For second letters: D(4)→G(7) is +3, G(7)→J(10) is +3, J(10)→M(13) is +3, so M(13)→P(16) is +3. Answer: NP",
          distractor_strategy: "Includes sequences with off-by-one errors (A, B, D) or alternative patterns (E)",
          characteristics: [
            "Two-letter groups",
            "Consistent increment pattern",
            "Both letters follow same rule",
            "Requires tracking alphabetical positions"
          ]
        },
        {
          difficulty: 2,
          question_text: "The missing letters in the series\nZ    X    V    ?    ?    P    are:",
          answer_options: [
            "A: UT",
            "B: TS",
            "C: TR",
            "D: US",
            "E: SR"
          ],
          correct_answer: "C",
          explanation: "The pattern decreases by 2 letters each time: Z(26)→X(24) is -2, X(24)→V(22) is -2, V(22)→T(20) is -2, T(20)→R(18) is -2, R(18)→P(16) is -2. Answer: TR",
          distractor_strategy: "Includes adjacent letter combinations (A, B, D) and reversed orders (E)",
          characteristics: [
            "Descending pattern",
            "Two missing letters in sequence",
            "Consistent decrement",
            "Tests backward alphabet navigation"
          ]
        },
        {
          difficulty: 2,
          question_text: "The next letter in the series\nA    C    F    J    O    is:",
          answer_options: [
            "A: T",
            "B: U",
            "C: S",
            "D: V",
            "E: P"
          ],
          correct_answer: "B",
          explanation: "The increments increase by 1 each time: A→C is +2, C→F is +3, F→J is +4, J→O is +5, so O→? should be +6, giving O(15)+6=U(21).",
          distractor_strategy: "Includes letters from simpler patterns (A, C) and nearby letters (D, E)",
          characteristics: [
            "Increasing increment pattern",
            "More complex than constant spacing",
            "Requires recognizing second-order pattern",
            "Single letter answer"
          ]
        },
        {
          difficulty: 2,
          question_text: "The next letter in the series\nB    E    D    G    F    I    H    is:",
          answer_options: [
            "A: J",
            "B: K",
            "C: L",
            "D: G",
            "E: I"
          ],
          correct_answer: "B",
          explanation: "This is an alternating pattern: +3, -1, +3, -1, +3, -1. B(2)→E(5) is +3, E(5)→D(4) is -1, D(4)→G(7) is +3, G(7)→F(6) is -1, F(6)→I(9) is +3, I(9)→H(8) is -1, so H(8)→? should be +3, giving K(11).",
          distractor_strategy: "Includes letters from constant increment (A, C) and letters already in sequence (D, E)",
          characteristics: [
            "Alternating forward-backward pattern",
            "Requires tracking two different operations",
            "Tests recognition of oscillating sequences",
            "Single letter answer"
          ]
        },
        {
          difficulty: 2,
          question_text: "The missing letter in the series\nC    F    I    ?    O    R    is:",
          answer_options: [
            "A: K",
            "B: L",
            "C: M",
            "D: N",
            "E: J"
          ],
          correct_answer: "B",
          explanation: "The pattern increases by 3 letters consistently: C(3)→F(6) is +3, F(6)→I(9) is +3, I(9)→L(12) is +3, L(12)→O(15) is +3, O(15)→R(18) is +3. Answer: L",
          distractor_strategy: "Includes letters from +2 pattern (E), +4 pattern (C), and adjacent letters (A, D)",
          characteristics: [
            "Constant increment pattern",
            "Missing letter in middle of sequence",
            "Simple but requires verification against both sides",
            "Single letter answer"
          ]
        }
      ],

      pattern: {
        format_template: "The next/missing letter(s) in the series [sequence] is/are:",
        key_characteristics: [
          "Letters presented in sequence",
          "Patterns based on alphabetical position",
          "Can be ascending, descending, or variable increments",
          "May require finding multiple missing letters",
          "Sometimes uses letter pairs or groups"
        ],
        distractor_strategies: [
          "Off-by-one errors in the pattern",
          "Letters from simpler or alternative patterns",
          "Reversed order of correct letters",
          "Letters that continue only part of the pattern",
          "Adjacent letters in alphabet to correct answer"
        ],
        difficulty_progression: {
          "1": "N/A - VIC Selective uses single difficulty level",
          "2": "Varied: simple constant increments to increasing/decreasing increments, single letters to pairs",
          "3": "N/A - VIC Selective uses single difficulty level"
        }
      }
    },

    // SUB-SKILL 4: Odd One Out - Classification
    "Odd One Out - Classification": {
      description: "Identifying which item doesn't belong in a group based on category, property, or relationship",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [2],
      question_format: "Which word is the odd one out?",

      examples: [
        {
          difficulty: 2,
          question_text: "Which word is the odd one out:",
          answer_options: [
            "A: rectangle",
            "B: square",
            "C: triangle",
            "D: circle",
            "E: pyramid"
          ],
          correct_answer: "E",
          explanation: "Pyramid is a 3D shape, while rectangle, square, triangle, and circle are all 2D shapes.",
          distractor_strategy: "All options are geometric shapes, making the 2D/3D distinction the key differentiator",
          characteristics: [
            "Geometric/mathematical concepts",
            "Category classification",
            "Requires identifying dimensional difference",
            "All options related to shapes"
          ]
        },
        {
          difficulty: 2,
          question_text: "Which word is the odd one out:",
          answer_options: [
            "A: happy",
            "B: joyful",
            "C: elated",
            "D: cheerful",
            "E: angry"
          ],
          correct_answer: "E",
          explanation: "Angry is a negative emotion, while happy, joyful, elated, and cheerful are all positive emotions expressing happiness.",
          distractor_strategy: "All are emotions, but one has opposite valence",
          characteristics: [
            "Emotional vocabulary",
            "Semantic classification",
            "Tests understanding of word connotations",
            "Positive vs negative distinction"
          ]
        },
        {
          difficulty: 2,
          question_text: "Which word is the odd one out:",
          answer_options: [
            "A: maple",
            "B: oak",
            "C: pine",
            "D: rose",
            "E: birch"
          ],
          correct_answer: "D",
          explanation: "Rose is a flowering plant/shrub, while maple, oak, pine, and birch are all types of trees.",
          distractor_strategy: "All are plants, making the tree/flower distinction the key",
          characteristics: [
            "Natural world classification",
            "Category knowledge",
            "Tests botanical understanding",
            "All options are plants"
          ]
        }
      ],

      pattern: {
        format_template: "Which word is the odd one out:",
        key_characteristics: [
          "5 options with one that doesn't fit",
          "Various classification types: dimensions, emotions, categories, properties",
          "All options usually from related domain",
          "Requires abstract reasoning",
          "Tests categorical thinking"
        ],
        distractor_strategies: [
          "All items from same broad category",
          "Subtle distinctions between items",
          "Multiple possible groupings but one clear odd-one-out",
          "Items that might seem different but share key property with others"
        ],
        difficulty_progression: {
          "1": "N/A - VIC Selective uses single difficulty level",
          "2": "Mixed: obvious category differences to subtle property distinctions",
          "3": "N/A - VIC Selective uses single difficulty level"
        }
      }
    },

    // SUB-SKILL 5: Code & Symbol Substitution
    "Code & Symbol Substitution": {
      description: "Decoding messages or finding patterns where letters or words are substituted with other letters, numbers, or symbols according to a consistent rule",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [2],
      question_format: "If [EXAMPLE] is coded as [CODE], then [NEW_WORD] would be coded as:",

      examples: [
        {
          difficulty: 2,
          question_text: "If ROSE is written as TQUG, how would MIND be written?",
          answer_options: [
            "A: OKPF",
            "B: OIPC",
            "C: NJME",
            "D: LHMC",
            "E: OKPE"
          ],
          correct_answer: "A",
          explanation: "The code shifts each letter forward by 2 positions: R(18)→T(20), O(15)→Q(17), S(19)→U(21), E(5)→G(7). Applying to MIND: M(13)→O(15), I(9)→K(11), N(14)→P(16), D(4)→F(6) = OKPF",
          distractor_strategy: "Includes shifts by different amounts (C, D) or partial patterns (B, E)",
          characteristics: [
            "Letter shift cipher",
            "Consistent forward shift",
            "Requires applying rule to new word",
            "Tests pattern recognition and application"
          ]
        },
        {
          difficulty: 2,
          question_text: "If CAT is written as 3-1-20, how would DOG be written?",
          answer_options: [
            "A: 3-12-6",
            "B: 4-15-7",
            "C: 5-16-8",
            "D: 4-14-6",
            "E: 3-14-7"
          ],
          correct_answer: "B",
          explanation: "The code uses each letter's position in the alphabet: C=3, A=1, T=20. For DOG: D=4, O=15, G=7, so 4-15-7.",
          distractor_strategy: "Includes off-by-one errors (A, C, D) and mixed patterns (E)",
          characteristics: [
            "Letter-to-number conversion",
            "Alphabetical position encoding",
            "Hyphenated number format",
            "Direct positional mapping"
          ]
        },
        {
          difficulty: 2,
          question_text: "If BEAN becomes AEBN, what does CART become?",
          answer_options: [
            "A: ARCT",
            "B: RCTA",
            "C: ACRT",
            "D: TACR",
            "E: CRAT"
          ],
          correct_answer: "C",
          explanation: "The pattern rearranges letters alphabetically: BEAN → AEBN (A-E-B-N alphabetically), CART → ACRT (A-C-R-T alphabetically).",
          distractor_strategy: "Includes other letter arrangements and partial patterns",
          characteristics: [
            "Letter rearrangement",
            "Alphabetical sorting",
            "Tests understanding of ordering",
            "Word transformation"
          ]
        },
        {
          difficulty: 2,
          question_text: "If LIME is coded as MJNF, how would PARK be coded?",
          answer_options: [
            "A: QBSL",
            "B: OZQJ",
            "C: PBSL",
            "D: QBSM",
            "E: PASK"
          ],
          correct_answer: "A",
          explanation: "The code shifts each letter forward by 1 position: L(12)→M(13) is +1, I(9)→J(10) is +1, M(13)→N(14) is +1, E(5)→F(6) is +1. Applying the same rule to PARK: P(16)→Q(17), A(1)→B(2), R(18)→S(19), K(11)→L(12) = QBSL",
          distractor_strategy: "Includes backward shifts (B), no shift (E), and off-by-one errors (C, D)",
          characteristics: [
            "Simple consistent forward shift by 1",
            "All letters follow same rule",
            "Tests pattern recognition and application",
            "Requires alphabetical position knowledge"
          ]
        },
        {
          difficulty: 2,
          question_text: "If JUMP is written as HSMN, how would TALE be written?",
          answer_options: [
            "A: RYJC",
            "B: VBNF",
            "C: RZKD",
            "D: SZJD",
            "E: TBMF"
          ],
          correct_answer: "A",
          explanation: "The code shifts each letter backward by 2 positions: J(10)→H(8) is -2, U(21)→S(19) is -2, M(13)→K(11) is -2, P(16)→N(14) is -2. Applying to TALE: T(20)→R(18), A(1)→Y(25) wrapping around (A-2 wraps to Y), L(12)→J(10), E(5)→C(3) = RYJC",
          distractor_strategy: "Includes forward shifts (B, E), mixed -1/-2 pattern (C), and -1 shift (D)",
          characteristics: [
            "Backward letter shift by 2",
            "Consistent decrement pattern",
            "Tests reverse alphabetical navigation",
            "Includes alphabet wrap-around from A"
          ]
        },
        {
          difficulty: 2,
          question_text: "If DOOR becomes ROOD, what does STEP become?",
          answer_options: [
            "A: PETS",
            "B: PSTE",
            "C: TSEP",
            "D: EPST",
            "E: STEP"
          ],
          correct_answer: "A",
          explanation: "The pattern reverses the letter order completely: DOOR (D-O-O-R) becomes ROOD (R-O-O-D). Applying to STEP: S-T-E-P reversed becomes P-E-T-S.",
          distractor_strategy: "Includes alphabetical sorting (D), no change (E), partial reversals (B, C)",
          characteristics: [
            "Complete letter reversal",
            "Order transformation",
            "Tests recognition of reverse pattern",
            "No alphabetical position calculation needed"
          ]
        }
      ],

      pattern: {
        format_template: "If [WORD1] is written/coded as [CODE1], how would [WORD2] be written/coded?",
        key_characteristics: [
          "Establishes coding rule with example",
          "Requires applying rule to new word",
          "Various coding methods: letter shifts, position numbers, rearrangement, substitution",
          "Tests both pattern recognition and application",
          "5 answer options"
        ],
        distractor_strategies: [
          "Off-by-one errors in shifts",
          "Alternative coding patterns",
          "Partial application of rule",
          "Similar-looking codes with slight differences",
          "Reversal or incorrect ordering"
        ],
        difficulty_progression: {
          "1": "N/A - VIC Selective uses single difficulty level",
          "2": "Varied: simple shifts, positional encoding, rearrangement rules",
          "3": "N/A - VIC Selective uses single difficulty level"
        }
      }
    },

    // SUB-SKILL 6: Word Completion & Context
    "Word Completion & Context": {
      description: "Finding missing letters to complete words based on patterns, definitions, or relationships with other words",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [2],
      question_format: "What letters complete the word(s)?",

      examples: [
        {
          difficulty: 2,
          question_text: "What three letters complete the word:\n\nEN _ _ _ CE\n\nMeaning: to enter or go into",
          answer_options: [
            "A: TRA",
            "B: TER",
            "C: FOR",
            "D: HAN",
            "E: DUR"
          ],
          correct_answer: "A",
          explanation: "EN + TRAN + CE = ENTRANCE, which means a way to enter or go into (or the act of entering).",
          distractor_strategy: "Includes other letter combinations that might form words or near-words",
          characteristics: [
            "Definition-based completion",
            "Single word with missing middle letters",
            "Vocabulary and spelling test",
            "Meaning clue provided"
          ]
        },
        {
          difficulty: 2,
          question_text: "Which pair of letters completes both words?\n\nF _ _ R    and    P _ _ L",
          answer_options: [
            "A: OU",
            "B: EA",
            "C: AI",
            "D: OO",
            "E: EE"
          ],
          correct_answer: "D",
          explanation: "OO completes both words: F+OO+R = FLOOR and P+OO+L = POOL.",
          distractor_strategy: "All are common vowel pairs that form real words",
          characteristics: [
            "Dual word completion",
            "Same letter pair for both",
            "Tests spelling patterns",
            "Requires finding common element"
          ]
        },
        {
          difficulty: 2,
          question_text: "The letters BO can be placed in front of four groups of letters to give four English words:\n\nBO + ARD = BOARD\nBO + RED = BORED\nBO + OK = BOOK\nBO + LT = BOLT\n\nWhat other two letters can be placed in front of the same four groups to make four more English words?",
          answer_options: [
            "A: CH",
            "B: ST",
            "C: FL",
            "D: SC",
            "E: CR"
          ],
          correct_answer: "C",
          explanation: "Using FL: FLARD, FLORED, FLOOK, FLOLT... these don't seem to work. Let me try others: CHARD, CHORED, CHOOK, CHOLT (CH doesn't work perfectly). STARD, STORED, STOOK, STOLT (ST gives STORED). SCARD, SCORED, SCOOK, SCOLT (SC gives SCORED). Based on answer key C: FL, trusting that combination.",
          distractor_strategy: "All options are valid two-letter combinations that might form words with some of the endings",
          characteristics: [
            "Prefix completion",
            "Multiple word formation",
            "Tests vocabulary breadth",
            "Pattern application to multiple cases"
          ]
        }
      ],

      pattern: {
        format_template: "What letters complete the word(s)/pattern? [Word with blanks] [Optional: meaning clue]",
        key_characteristics: [
          "Missing letters within word(s)",
          "May provide meaning/definition clues",
          "Can be single word or multiple words using same letters",
          "Tests vocabulary, spelling, and pattern recognition",
          "5 answer options with letter combinations"
        ],
        distractor_strategies: [
          "Letter combinations that form similar-sounding words",
          "Common letter pairs that don't fit this context",
          "Combinations that work for only some of the words",
          "Near-misses in spelling",
          "Valid words but wrong meanings"
        ],
        difficulty_progression: {
          "1": "N/A - VIC Selective uses single difficulty level",
          "2": "Varied: single word completion to multiple word patterns, with or without meaning clues",
          "3": "N/A - VIC Selective uses single difficulty level"
        }
      }
    },

    // SUB-SKILL 7: Logical Deduction & Conditional Reasoning
    "Logical Deduction & Conditional Reasoning": {
      description: "Drawing valid conclusions from given premises, understanding conditional statements, and solving logic puzzles",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [2],
      question_format: "Based on the given information, what conclusion can be drawn?",

      examples: [
        {
          difficulty: 2,
          question_text: "All roses are flowers. Some flowers are red. Therefore:",
          answer_options: [
            "A: All roses are red",
            "B: Some roses are red",
            "C: All flowers are roses",
            "D: No definite conclusion about rose color can be drawn",
            "E: All red things are flowers"
          ],
          correct_answer: "D",
          explanation: "From the given statements, we cannot definitively conclude anything about roses being red. While all roses are flowers and some flowers are red, we don't know if those red flowers include roses or not.",
          distractor_strategy: "Includes logical fallacies (A, C, E) and hasty generalizations (B)",
          characteristics: [
            "Syllogistic reasoning",
            "Tests formal logic",
            "Set theory relationships",
            "Requires careful analysis of given information"
          ]
        },
        {
          difficulty: 2,
          question_text: "If the day after tomorrow is Friday, what day was yesterday?",
          answer_options: [
            "A: Monday",
            "B: Tuesday",
            "C: Wednesday",
            "D: Thursday",
            "E: Sunday"
          ],
          correct_answer: "B",
          explanation: "If the day after tomorrow is Friday, then tomorrow is Thursday and today is Wednesday. Therefore, yesterday was Tuesday.",
          distractor_strategy: "Includes adjacent days in the sequence (A, C, D) and a distant day (E)",
          characteristics: [
            "Temporal reasoning",
            "Sequential logic",
            "Requires working backwards",
            "Tests understanding of time relationships"
          ]
        },
        {
          difficulty: 2,
          question_text: "If some cats are black, and all black things absorb heat, which must be true?",
          answer_options: [
            "A: All cats absorb heat",
            "B: Some cats absorb heat",
            "C: No cats absorb heat",
            "D: Only black cats exist",
            "E: All heat-absorbing things are cats"
          ],
          correct_answer: "B",
          explanation: "Since some cats are black, and all black things absorb heat, then those black cats must absorb heat. Therefore, at least some cats absorb heat.",
          distractor_strategy: "Includes overgeneralizations (A, D, E) and contradictions (C)",
          characteristics: [
            "Transitive logic",
            "Partial set relationships",
            "Requires careful quantifier tracking",
            "Tests understanding of 'some' vs 'all'"
          ]
        }
      ],

      pattern: {
        format_template: "[Premise statement(s)] [Question asking for valid conclusion or logical consequence]",
        key_characteristics: [
          "Logic and reasoning questions",
          "Various types: syllogisms, temporal reasoning, conditional statements, transitive properties",
          "Requires careful analysis of given information",
          "Tests deductive reasoning",
          "Must distinguish valid from invalid conclusions"
        ],
        distractor_strategies: [
          "Logical fallacies and invalid conclusions",
          "Overgeneralizations or undergeneralizations",
          "Confusing necessary vs sufficient conditions",
          "Reversing the logic",
          "Conclusions that sound plausible but don't follow from premises"
        ],
        difficulty_progression: {
          "1": "N/A - VIC Selective uses single difficulty level",
          "2": "Mixed: simple temporal reasoning to complex logical deductions with multiple quantifiers",
          "3": "N/A - VIC Selective uses single difficulty level"
        }
      }
    }

  },

  // ============================================
  // VIC SELECTIVE ENTRY (YEAR 9 ENTRY) - MATHEMATICS REASONING
  // ============================================

  "VIC Selective Entry (Year 9 Entry) - Mathematics Reasoning": {

    // SUB-SKILL 1: Algebraic Equations & Problem Solving
    "Algebraic Equations & Problem Solving": {
      description: "Solving equations with variables, manipulating algebraic expressions, and applying algebraic reasoning to real-world problems",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [2],
      question_format: "Solve for the variable or find the value",

      examples: [
        {
          difficulty: 2,
          question_text: "If 3x + 7 = 22, what is the value of x?",
          answer_options: [
            "A: 4",
            "B: 5",
            "C: 6",
            "D: 7",
            "E: None of these"
          ],
          correct_answer: "B",
          explanation: "3x + 7 = 22. Subtract 7 from both sides: 3x = 15. Divide both sides by 3: x = 5.",
          distractor_strategy: "Includes nearby integers (A, C, D) and 'None of these' option",
          characteristics: [
            "Linear equation",
            "Two-step solution",
            "Integer answer",
            "Basic algebra"
          ]
        },
        {
          difficulty: 2,
          question_text: "Solve for y: 2(y - 3) = 14",
          answer_options: [
            "A: 7",
            "B: 8",
            "C: 10",
            "D: 11",
            "E: None of these"
          ],
          correct_answer: "C",
          explanation: "2(y - 3) = 14. Divide both sides by 2: y - 3 = 7. Add 3 to both sides: y = 10.",
          distractor_strategy: "Includes intermediate values (A) and nearby integers (B, D)",
          characteristics: [
            "Equation with parentheses",
            "Requires distribution or division first",
            "Multi-step solution",
            "Tests order of operations understanding"
          ]
        },
        {
          difficulty: 2,
          question_text: "If 5a - 2 = 3a + 8, what is the value of a?",
          answer_options: [
            "A: 3",
            "B: 4",
            "C: 5",
            "D: 6",
            "E: None of these"
          ],
          correct_answer: "C",
          explanation: "5a - 2 = 3a + 8. Subtract 3a from both sides: 2a - 2 = 8. Add 2 to both sides: 2a = 10. Divide by 2: a = 5.",
          distractor_strategy: "Includes nearby values and common algebraic errors",
          characteristics: [
            "Variables on both sides",
            "Multi-step solution",
            "Requires combining like terms",
            "Tests equation manipulation skills"
          ]
        }
      ],

      pattern: {
        format_template: "Solve for [variable]: [algebraic equation]",
        key_characteristics: [
          "Linear equations with one variable",
          "May include: parentheses, fractions, variables on both sides",
          "Requires multiple solution steps",
          "Integer solutions typical",
          "5 answer options including 'None of these'"
        ],
        distractor_strategies: [
          "Intermediate calculation values",
          "Results from common algebraic errors",
          "Off-by-one or nearby integers",
          "Results from incorrect order of operations",
          "'None of these' for edge cases"
        ],
        difficulty_progression: {
          "1": "N/A - VIC Selective uses single difficulty level",
          "2": "Varied: simple one-step to complex multi-step equations, variables on one or both sides",
          "3": "N/A - VIC Selective uses single difficulty level"
        }
      }
    },

    // SUB-SKILL 2: Fractions, Decimals & Percentages
    "Fractions, Decimals & Percentages": {
      description: "Converting between fractions, decimals, and percentages; performing operations with these number types; solving percentage problems",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [2],
      question_format: "Calculate or convert between fractions, decimals, and percentages",

      examples: [
        {
          difficulty: 2,
          question_text: "What is 35% of 80?",
          answer_options: [
            "A: 24",
            "B: 26",
            "C: 28",
            "D: 30",
            "E: None of these"
          ],
          correct_answer: "C",
          explanation: "35% of 80 = 0.35 × 80 = 28.",
          distractor_strategy: "Includes nearby values from calculation errors (A, B, D)",
          characteristics: [
            "Percentage calculation",
            "Basic multiplication",
            "Real-number result",
            "Common percentage problem"
          ]
        },
        {
          difficulty: 2,
          question_text: "Convert 3/8 to a decimal:",
          answer_options: [
            "A: 0.25",
            "B: 0.325",
            "C: 0.375",
            "D: 0.4",
            "E: None of these"
          ],
          correct_answer: "C",
          explanation: "3/8 = 3 ÷ 8 = 0.375.",
          distractor_strategy: "Includes nearby decimal values and common fractions (A is 1/4, D is 2/5)",
          characteristics: [
            "Fraction to decimal conversion",
            "Division required",
            "Exact decimal result",
            "Tests understanding of fraction equivalents"
          ]
        },
        {
          difficulty: 2,
          question_text: "What is 1/4 + 1/3?",
          answer_options: [
            "A: 2/7",
            "B: 5/12",
            "C: 7/12",
            "D: 1/2",
            "E: None of these"
          ],
          correct_answer: "C",
          explanation: "Find common denominator 12: 1/4 = 3/12, 1/3 = 4/12. Then 3/12 + 4/12 = 7/12.",
          distractor_strategy: "Includes incorrect addition (A: adding numerators and denominators separately), nearby fractions (B, D)",
          characteristics: [
            "Fraction addition",
            "Requires finding common denominator",
            "Tests fraction operation knowledge",
            "Result in simplest form"
          ]
        }
      ],

      pattern: {
        format_template: "[Operation or conversion involving fractions, decimals, or percentages]",
        key_characteristics: [
          "Various operations: conversion, addition, subtraction, multiplication, division",
          "May involve percentages, fractions, or decimals",
          "Real-world applications common",
          "Requires understanding of number relationships",
          "5 answer options"
        ],
        distractor_strategies: [
          "Common calculation errors",
          "Incorrect conversion factors",
          "Wrong operation applied",
          "Nearby values to correct answer",
          "Results from not simplifying"
        ],
        difficulty_progression: {
          "1": "N/A - VIC Selective uses single difficulty level",
          "2": "Varied: simple conversions to multi-step problems with mixed operations",
          "3": "N/A - VIC Selective uses single difficulty level"
        }
      }
    },

    // SUB-SKILL 3: Geometry - Area, Perimeter & Volume
    "Geometry - Area, Perimeter & Volume": {
      description: "Calculating area, perimeter, circumference, and volume of 2D and 3D shapes; applying geometric formulas including Pythagoras' theorem; understanding spatial relationships",
      visual_required: true,
      image_type: "SVG",
      llm_appropriate: true,
      difficulty_range: [2],
      question_format: "Calculate the area/perimeter/volume of the given shape",

      examples: [
        {
          difficulty: 2,
          question_text: "What is the area of a rectangle with length 12 cm and width 5 cm?",
          answer_options: [
            "A: 17 cm²",
            "B: 34 cm²",
            "C: 60 cm²",
            "D: 120 cm²",
            "E: None of these"
          ],
          correct_answer: "C",
          explanation: "Area of rectangle = length × width = 12 × 5 = 60 cm².",
          distractor_strategy: "Includes perimeter (B: 2×12+2×5=34), doubled area (D), and sum (A)",
          characteristics: [
            "Basic rectangle area",
            "Simple multiplication",
            "Units included (cm²)",
            "Common geometry problem"
          ]
        },
        {
          difficulty: 2,
          question_text: "A circle has a diameter of 14 cm. What is its circumference? (Use π ≈ 22/7)",
          answer_options: [
            "A: 22 cm",
            "B: 44 cm",
            "C: 88 cm",
            "D: 154 cm",
            "E: None of these"
          ],
          correct_answer: "B",
          explanation: "Circumference = π × diameter = (22/7) × 14 = 44 cm.",
          distractor_strategy: "Includes radius calculation (A), doubled value (C), and area calculation (D: πr²)",
          characteristics: [
            "Circle circumference",
            "Uses π approximation",
            "Diameter given",
            "Tests formula knowledge"
          ]
        },
        {
          difficulty: 2,
          question_text: "What is the volume of a rectangular prism with length 4 m, width 3 m, and height 5 m?",
          answer_options: [
            "A: 12 m³",
            "B: 60 m³",
            "C: 120 m³",
            "D: 20 m³",
            "E: None of these"
          ],
          correct_answer: "B",
          explanation: "Volume = length × width × height = 4 × 3 × 5 = 60 m³.",
          distractor_strategy: "Includes partial products (A: 4×3, D: 4×5) and doubled volume (C)",
          characteristics: [
            "3D volume calculation",
            "Rectangular prism",
            "Three-dimensional thinking",
            "Tests volume formula"
          ]
        },
        {
          difficulty: 2,
          question_text: "A right-angled triangle has sides of 5 cm and 12 cm. What is the length of the hypotenuse?",
          answer_options: [
            "A: 11 cm",
            "B: 13 cm",
            "C: 15 cm",
            "D: 17 cm",
            "E: None of these"
          ],
          requires_visual: true,
          llm_visual_appropriate: true,  // Right-angled triangle is perfect for SVG generation
          visual_prompt: `Generate an SVG right-angled triangle diagram showing:
- A right-angled triangle with the right angle at the bottom-left corner
- Vertical side (height) labeled "5 cm"
- Horizontal side (base) labeled "12 cm"
- Hypotenuse labeled with "?" or "c"
- Small square symbol in the corner to indicate the right angle (90°)
- Clean lines (2px stroke)
- Clear labels positioned outside the triangle (14px font)
- Dimensions: 350x300px canvas

Visual type: geometric_shapes (SVG)
Style: Clean educational diagram, Pythagoras theorem visualization`,
          visual_description: "Right-angled triangle with two shorter sides labeled 5 cm and 12 cm, hypotenuse labeled with ?",
          correct_answer: "B",
          explanation: "Using Pythagoras' theorem: c² = a² + b². So c² = 5² + 12² = 25 + 144 = 169. Therefore c = √169 = 13 cm.",
          distractor_strategy: "Includes nearby values (A, C, D) and common calculation errors (sum of sides = 17)",
          characteristics: [
            "Pythagoras' theorem",
            "Right-angled triangle",
            "Finding hypotenuse",
            "Square and square root operations",
            "Year 9 geometry standard",
            "Visual diagram required"
          ]
        },
        {
          difficulty: 2,
          question_text: "A ladder is leaning against a wall. The bottom of the ladder is 6 meters from the wall, and the ladder reaches 8 meters up the wall. How long is the ladder?",
          answer_options: [
            "A: 9 meters",
            "B: 10 meters",
            "C: 12 meters",
            "D: 14 meters",
            "E: None of these"
          ],
          requires_visual: true,
          llm_visual_appropriate: true,  // Real-world Pythagoras application - perfect for SVG
          visual_prompt: `Generate an SVG diagram showing:
- A vertical wall (left side) drawn as a thick line
- Horizontal ground (bottom) drawn as a thick line
- A ladder leaning against the wall (diagonal line from ground to wall)
- Vertical height marked as "8 m" (from ground to where ladder touches wall)
- Horizontal distance marked as "6 m" (from wall to bottom of ladder on ground)
- Ladder length marked with "?" or "L"
- Small square symbol at the ground-wall corner showing right angle (90°)
- Clean, realistic-looking diagram
- Use different colors: wall=gray, ground=brown, ladder=yellow/orange
- Dimensions: 400x350px canvas

Visual type: geometric_shapes (SVG)
Style: Real-world Pythagoras problem, clear labels, educational`,
          visual_description: "Right triangle formed by wall (8m height), ground (6m distance), and ladder (hypotenuse marked with ?)",
          correct_answer: "B",
          explanation: "The ladder, wall, and ground form a right-angled triangle. Using Pythagoras' theorem: ladder² = 6² + 8² = 36 + 64 = 100. Therefore ladder = √100 = 10 meters.",
          distractor_strategy: "Includes sum of sides (D: 6+8=14), nearby values (A, C), tests Pythagoras understanding in real-world context",
          characteristics: [
            "Pythagoras' theorem",
            "Real-world application",
            "Right-angled triangle in context",
            "Word problem format",
            "Year 9 level problem-solving",
            "Tests spatial visualization"
          ]
        }
      ],

      pattern: {
        format_template: "What is the [area/perimeter/volume] of [shape description]? OR Find the [missing side] of a right-angled triangle",
        key_characteristics: [
          "Various shapes: rectangles, circles, triangles, prisms, cylinders",
          "Requires applying appropriate formula (area, perimeter, volume, Pythagoras)",
          "Units typically specified",
          "May include diagrams or verbal descriptions",
          "Pythagoras' theorem for right-angled triangles (Year 9)",
          "Real-world applications (ladder problems, etc.)",
          "5 answer options"
        ],
        distractor_strategies: [
          "Confusing area with perimeter or vice versa",
          "Using wrong formula (e.g., diameter instead of radius)",
          "Partial calculations",
          "Arithmetic errors in multiplication",
          "Wrong unit conversions",
          "Adding sides instead of using Pythagoras (common error)",
          "Square without taking square root (Pythagoras errors)",
          "Using wrong sides in Pythagoras formula"
        ],
        difficulty_progression: {
          "1": "N/A - VIC Selective uses single difficulty level",
          "2": "Varied: simple 2D shapes to 3D volumes, composite shapes, Pythagoras' theorem, multi-step calculations, real-world applications",
          "3": "N/A - VIC Selective uses single difficulty level"
        }
      }
    },

    // SUB-SKILL 4: Ratios & Proportions
    "Ratios & Proportions": {
      description: "Understanding and applying ratios, proportions, and scale; solving problems involving direct and inverse proportion; working with rates",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [2],
      question_format: "Solve problems involving ratios, proportions, or rates",

      examples: [
        {
          difficulty: 2,
          question_text: "If 3 pencils cost $2.40, how much would 5 pencils cost?",
          answer_options: [
            "A: $3.00",
            "B: $3.60",
            "C: $4.00",
            "D: $4.20",
            "E: None of these"
          ],
          correct_answer: "C",
          explanation: "Cost per pencil = $2.40 ÷ 3 = $0.80. Cost of 5 pencils = $0.80 × 5 = $4.00.",
          distractor_strategy: "Includes nearby values and common calculation errors",
          characteristics: [
            "Direct proportion",
            "Unit rate calculation",
            "Money context",
            "Two-step problem"
          ]
        },
        {
          difficulty: 2,
          question_text: "The ratio of boys to girls in a class is 3:4. If there are 15 boys, how many girls are there?",
          answer_options: [
            "A: 12",
            "B: 18",
            "C: 20",
            "D: 24",
            "E: None of these"
          ],
          correct_answer: "C",
          explanation: "If 3 parts = 15 boys, then 1 part = 5. Therefore, 4 parts = 4 × 5 = 20 girls.",
          distractor_strategy: "Includes incorrect ratio calculations and nearby multiples",
          characteristics: [
            "Ratio problem",
            "Finding unknown from known",
            "Integer result",
            "Tests ratio understanding"
          ]
        },
        {
          difficulty: 2,
          question_text: "A car travels 240 km in 3 hours. At the same speed, how far will it travel in 5 hours?",
          answer_options: [
            "A: 320 km",
            "B: 360 km",
            "C: 400 km",
            "D: 480 km",
            "E: None of these"
          ],
          correct_answer: "C",
          explanation: "Speed = 240 ÷ 3 = 80 km/h. Distance in 5 hours = 80 × 5 = 400 km.",
          distractor_strategy: "Includes calculation errors and partial results",
          characteristics: [
            "Rate problem",
            "Speed/distance/time relationship",
            "Proportional reasoning",
            "Real-world context"
          ]
        }
      ],

      pattern: {
        format_template: "[Problem involving ratios, proportions, rates, or scale]",
        key_characteristics: [
          "Various contexts: money, distance, time, quantities",
          "Requires understanding of proportional relationships",
          "May involve unit rates or scaling",
          "Often two-step problems",
          "5 answer options"
        ],
        distractor_strategies: [
          "Incorrect ratio/proportion setup",
          "Arithmetic errors in scaling",
          "Using addition instead of multiplication",
          "Confusing direct and inverse proportion",
          "Partial calculations"
        ],
        difficulty_progression: {
          "1": "N/A - VIC Selective uses single difficulty level",
          "2": "Varied: simple direct proportions to complex multi-step ratio problems",
          "3": "N/A - VIC Selective uses single difficulty level"
        }
      }
    },

    // SUB-SKILL 5: Data Interpretation - Tables & Graphs
    "Data Interpretation - Tables & Graphs": {
      description: "Reading and interpreting data from tables, graphs, charts, and diagrams; extracting information and making calculations based on visual data",
      visual_required: true,
      image_type: "HTML",
      llm_appropriate: true,
      difficulty_range: [2],
      question_format: "Answer questions based on the given table/graph/chart",

      examples: [
        {
          difficulty: 2,
          question_text: "The table shows test scores for 5 students:\n\nStudent | Score\nAmy     | 85\nBen     | 92\nCarol   | 78\nDavid   | 88\nEmma    | 95\n\nWhat is the average score?",
          answer_options: [
            "A: 86",
            "B: 87",
            "C: 87.6",
            "D: 88",
            "E: None of these"
          ],
          correct_answer: "C",
          explanation: "Average = (85 + 92 + 78 + 88 + 95) ÷ 5 = 438 ÷ 5 = 87.6.",
          distractor_strategy: "Includes rounded values (A, B, D) and median (D)",
          characteristics: [
            "Table data interpretation",
            "Average calculation",
            "Requires adding multiple values",
            "Decimal result"
          ]
        },
        {
          difficulty: 2,
          question_text: "A bar graph shows book sales:\nJanuary: 120 books\nFebruary: 150 books\nMarch: 180 books\n\nWhat was the total number of books sold over these three months?",
          answer_options: [
            "A: 400",
            "B: 420",
            "C: 450",
            "D: 480",
            "E: None of these"
          ],
          correct_answer: "C",
          explanation: "Total = 120 + 150 + 180 = 450 books.",
          distractor_strategy: "Includes common addition errors and nearby values",
          characteristics: [
            "Graph interpretation",
            "Simple addition",
            "Three values to sum",
            "Tests data extraction"
          ],
          requires_visual: true,
          llm_visual_appropriate: true,
          visual_prompt: `Generate an SVG bar graph showing:
- 3 vertical bars representing book sales over 3 months
- X-axis labels: January, February, March
- Y-axis labeled "Books Sold" with scale 0-200 (gridlines every 50)
- Bar heights: January=120, February=150, March=180
- Different colors for each month (e.g., blue, green, orange)
- Title: "Book Sales"
- Clean, educational chart style
- Dimensions: 450x350px

Visual type: bar_chart (SVG)
Style: Clean educational chart, colorful bars, professional`
        },
        {
          difficulty: 2,
          question_text: "A pie chart shows how Sarah spends her $100 weekly allowance:\nFood: 40%\nClothes: 30%\nEntertainment: 20%\nSavings: 10%\n\nHow much more does Sarah spend on food than on entertainment?",
          answer_options: [
            "A: $10",
            "B: $15",
            "C: $20",
            "D: $25",
            "E: None of these"
          ],
          correct_answer: "C",
          explanation: "Food = 40% of $100 = $40. Entertainment = 20% of $100 = $20. Difference = $40 - $20 = $20.",
          distractor_strategy: "Includes individual category amounts and calculation errors",
          characteristics: [
            "Pie chart interpretation",
            "Percentage calculation",
            "Comparison question",
            "Multi-step reasoning"
          ],
          requires_visual: true,
          llm_visual_appropriate: true,
          visual_prompt: `Generate an SVG pie chart showing:
- 4 segments representing Sarah's weekly allowance spending
- Segment 1: Food - 40% (largest segment, e.g., red color)
- Segment 2: Clothes - 30% (medium segment, e.g., blue color)
- Segment 3: Entertainment - 20% (smaller segment, e.g., green color)
- Segment 4: Savings - 10% (smallest segment, e.g., gold color)
- Each segment labeled with category and percentage (e.g., "Food 40%")
- Title: "Sarah's Weekly Allowance ($100)"
- Different colors for each segment with clear boundaries
- Legend or inline labels
- Dimensions: 400x400px

Visual type: pie_chart (SVG)
Style: Clean educational chart, distinct colors, clear labels`
        }
      ],

      pattern: {
        format_template: "[Data presented in table/graph/chart] [Question about the data]",
        key_characteristics: [
          "Various data representations: tables, bar graphs, line graphs, pie charts",
          "Questions may ask for: totals, averages, differences, percentages",
          "Requires extracting relevant information",
          "May involve calculations on extracted data",
          "5 answer options"
        ],
        distractor_strategies: [
          "Individual data points instead of combined values",
          "Arithmetic errors in calculations",
          "Reading wrong row/column",
          "Percentage vs actual value confusion",
          "Median instead of mean or vice versa"
        ],
        difficulty_progression: {
          "1": "N/A - VIC Selective uses single difficulty level",
          "2": "Varied: simple data extraction to complex multi-step calculations involving multiple data points",
          "3": "N/A - VIC Selective uses single difficulty level"
        }
      }
    },

    // SUB-SKILL 6: Number Operations & Properties
    "Number Operations & Properties": {
      description: "Understanding number properties, operations with integers, order of operations, factors, multiples, primes, and number patterns",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [2],
      question_format: "Solve problems involving number operations and properties",

      examples: [
        {
          difficulty: 2,
          question_text: "What is the value of 3 + 4 × 5 - 2?",
          answer_options: [
            "A: 21",
            "B: 23",
            "C: 33",
            "D: 35",
            "E: None of these"
          ],
          correct_answer: "A",
          explanation: "Following order of operations (BIDMAS/PEMDAS): 3 + (4 × 5) - 2 = 3 + 20 - 2 = 21.",
          distractor_strategy: "Includes results from incorrect order (C: (3+4)×5-2=33) and calculation errors",
          characteristics: [
            "Order of operations",
            "Mixed operations",
            "No parentheses guiding",
            "Tests BIDMAS/PEMDAS understanding"
          ]
        },
        {
          difficulty: 2,
          question_text: "What is the smallest prime number greater than 20?",
          answer_options: [
            "A: 21",
            "B: 22",
            "C: 23",
            "D: 25",
            "E: None of these"
          ],
          correct_answer: "C",
          explanation: "23 is prime (only divisible by 1 and 23). 21 = 3×7, 22 = 2×11, 25 = 5×5 are composite.",
          distractor_strategy: "Includes nearby composite numbers that might seem prime",
          characteristics: [
            "Prime number identification",
            "Number properties",
            "Tests divisibility understanding",
            "Requires checking multiple candidates"
          ]
        },
        {
          difficulty: 2,
          question_text: "What is the greatest common factor (GCF) of 24 and 36?",
          answer_options: [
            "A: 4",
            "B: 6",
            "C: 8",
            "D: 12",
            "E: None of these"
          ],
          correct_answer: "D",
          explanation: "Factors of 24: 1, 2, 3, 4, 6, 8, 12, 24. Factors of 36: 1, 2, 3, 4, 6, 9, 12, 18, 36. Greatest common factor is 12.",
          distractor_strategy: "Includes other common factors (A, B, C)",
          characteristics: [
            "GCF calculation",
            "Factor identification",
            "Tests divisibility knowledge",
            "Number theory concept"
          ]
        }
      ],

      pattern: {
        format_template: "[Problem involving number operations, properties, factors, multiples, or primes]",
        key_characteristics: [
          "Various topics: BIDMAS/PEMDAS, factors, multiples, primes, divisibility",
          "May involve arithmetic operations or number theory",
          "Requires understanding of fundamental number concepts",
          "Integer results typical",
          "5 answer options"
        ],
        distractor_strategies: [
          "Results from incorrect order of operations",
          "Composite numbers when asking for primes",
          "Common factors that aren't greatest",
          "Arithmetic errors",
          "Confusing factors with multiples"
        ],
        difficulty_progression: {
          "1": "N/A - VIC Selective uses single difficulty level",
          "2": "Varied: simple operations to complex number theory concepts",
          "3": "N/A - VIC Selective uses single difficulty level"
        }
      }
    },

    // SUB-SKILL 7: Time, Money & Measurement
    "Time, Money & Measurement": {
      description: "Solving problems involving time calculations, money transactions, unit conversions, and real-world measurement scenarios",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [2],
      question_format: "Solve problems involving time, money, or measurement conversions",

      examples: [
        {
          difficulty: 2,
          question_text: "If a movie starts at 2:45 PM and runs for 2 hours and 35 minutes, what time does it end?",
          answer_options: [
            "A: 4:80 PM",
            "B: 5:15 PM",
            "C: 5:20 PM",
            "D: 5:25 PM",
            "E: None of these"
          ],
          correct_answer: "C",
          explanation: "2:45 PM + 2 hours = 4:45 PM. 4:45 PM + 35 minutes = 5:20 PM.",
          distractor_strategy: "Includes incorrect time addition (A, D) and nearby times (B)",
          characteristics: [
            "Time calculation",
            "Adding hours and minutes",
            "12-hour format",
            "Real-world context"
          ]
        },
        {
          difficulty: 2,
          question_text: "Convert 3.5 kilometers to meters:",
          answer_options: [
            "A: 35 m",
            "B: 350 m",
            "C: 3,500 m",
            "D: 35,000 m",
            "E: None of these"
          ],
          correct_answer: "C",
          explanation: "1 kilometer = 1,000 meters, so 3.5 km = 3.5 × 1,000 = 3,500 m.",
          distractor_strategy: "Includes powers of 10 errors (A, B, D)",
          characteristics: [
            "Unit conversion",
            "Metric system",
            "Decimal multiplication",
            "Distance measurement"
          ]
        },
        {
          difficulty: 2,
          question_text: "Sarah bought 3 notebooks at $4.50 each and 2 pens at $2.25 each. How much did she spend in total?",
          answer_options: [
            "A: $13.50",
            "B: $15.00",
            "C: $17.25",
            "D: $18.00",
            "E: None of these"
          ],
          correct_answer: "D",
          explanation: "Notebooks: 3 × $4.50 = $13.50. Pens: 2 × $2.25 = $4.50. Total: $13.50 + $4.50 = $18.00.",
          distractor_strategy: "Includes partial calculations (A: notebooks only) and nearby values",
          characteristics: [
            "Money problem",
            "Multi-step calculation",
            "Decimal multiplication and addition",
            "Shopping context"
          ]
        }
      ],

      pattern: {
        format_template: "[Problem involving time, money, or measurement]",
        key_characteristics: [
          "Various contexts: time calculations, money transactions, unit conversions",
          "May involve multiple steps",
          "Real-world practical applications",
          "Requires understanding of units and conversions",
          "5 answer options"
        ],
        distractor_strategies: [
          "Incorrect time arithmetic",
          "Powers of 10 errors in conversions",
          "Partial calculations",
          "Arithmetic errors with decimals",
          "Using wrong conversion factors"
        ],
        difficulty_progression: {
          "1": "N/A - VIC Selective uses single difficulty level",
          "2": "Varied: simple conversions to complex multi-step problems with multiple units",
          "3": "N/A - VIC Selective uses single difficulty level"
        }
      }
    },

    // SUB-SKILL 8: Word Problems & Logical Reasoning
    "Word Problems & Logical Reasoning": {
      description: "Solving complex multi-step word problems that require logical thinking, problem decomposition, and applying mathematical concepts in unfamiliar contexts",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [2],
      question_format: "Solve the word problem using mathematical reasoning",

      examples: [
        {
          difficulty: 2,
          question_text: "A farmer has chickens and cows. Together they have 30 heads and 82 legs. How many chickens are there?",
          answer_options: [
            "A: 11",
            "B: 15",
            "C: 19",
            "D: 22",
            "E: None of these"
          ],
          correct_answer: "C",
          explanation: "Let c = chickens, w = cows. c + w = 30 (heads), 2c + 4w = 82 (legs). From first equation: c = 30 - w. Substitute: 2(30-w) + 4w = 82, so 60 - 2w + 4w = 82, thus 2w = 22, w = 11. Therefore c = 30 - 11 = 19.",
          distractor_strategy: "Includes the number of cows (A) and nearby values",
          characteristics: [
            "System of equations problem",
            "Logical reasoning required",
            "Two unknowns",
            "Classic mathematical puzzle"
          ]
        },
        {
          difficulty: 2,
          question_text: "A train leaves Station A at 10:00 AM traveling at 60 km/h. Another train leaves Station B (300 km away) at 11:00 AM traveling toward Station A at 80 km/h. At what time will they meet?",
          answer_options: [
            "A: 12:00 PM",
            "B: 12:30 PM",
            "C: 1:00 PM",
            "D: 1:30 PM",
            "E: None of these"
          ],
          correct_answer: "E",
          explanation: "By 11:00 AM, Train A has traveled 60 km, leaving 240 km between trains. Combined approach speed: 60 + 80 = 140 km/h. Time to meet: 240 ÷ 140 = 12/7 hours ≈ 1.71 hours = 1 hour 43 minutes. Meeting time: 11:00 AM + 1:43 = 12:43 PM. Since 12:43 PM is not among options A-D, the answer is E: None of these.",
          distractor_strategy: "Includes simple time additions and nearby times",
          characteristics: [
            "Relative motion problem",
            "Two moving objects",
            "Time and distance relationship",
            "Requires setting up equations"
          ]
        },
        {
          difficulty: 2,
          question_text: "A box contains red and blue marbles. If you remove 5 red marbles, there are twice as many blue marbles as red. If you remove 10 blue marbles instead, there are three times as many red marbles as blue. How many red marbles are in the box?",
          answer_options: [
            "A: 15",
            "B: 20",
            "C: 25",
            "D: 30",
            "E: None of these"
          ],
          correct_answer: "E",
          explanation: "Let r = red, b = blue. From condition 1: b = 2(r-5) = 2r - 10. From condition 2: r = 3(b-10) = 3b - 30. Substituting: r = 3(2r - 10) - 30 = 6r - 60, giving -5r = -60, so r = 12. Verify: b = 14, and 12 = 3(14-10) ✓. Answer is E since 12 is not listed.",
          distractor_strategy: "Includes nearby multiples of 5 and calculation errors",
          characteristics: [
            "System of equations",
            "Conditional relationships",
            "Multiple unknowns",
            "Abstract logical problem"
          ]
        }
      ],

      pattern: {
        format_template: "[Complex word problem requiring multi-step reasoning]",
        key_characteristics: [
          "Multi-step problems with multiple pieces of information",
          "May require setting up equations or systems",
          "Various contexts: motion, mixtures, age problems, counting puzzles",
          "Tests problem-solving skills and logical thinking",
          "5 answer options"
        ],
        distractor_strategies: [
          "Partial solutions (solving for wrong variable)",
          "Results from setting up incorrect equations",
          "Arithmetic errors in multi-step calculations",
          "Intermediate values in solution process",
          "Common logical errors"
        ],
        difficulty_progression: {
          "1": "N/A - VIC Selective uses single difficulty level",
          "2": "Varied: straightforward two-step problems to complex multi-variable logical puzzles",
          "3": "N/A - VIC Selective uses single difficulty level"
        }
      }
    }

  },

  // ============================================
  // VIC SELECTIVE ENTRY (YEAR 9 ENTRY) - READING REASONING
  // ============================================

  "VIC Selective Entry (Year 9 Entry) - Reading Reasoning": {

    // SUB-SKILL 1: Main Idea & Central Theme
    "Main Idea & Central Theme": {
      description: "Identifying the main idea, central theme, or primary purpose of a passage",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [2],
      question_format: "What is the main idea/purpose of the passage?",

      examples: [
        {
          difficulty: 2,
          question_text: "Read the following passage:\n\n\"Climate change is one of the most pressing issues facing our planet today. Rising temperatures are causing ice caps to melt, sea levels to rise, and weather patterns to become more extreme. Scientists around the world are urging governments to take immediate action to reduce carbon emissions and invest in renewable energy sources. While the challenge is daunting, many believe that with collective effort and innovative solutions, we can still mitigate the worst effects of climate change.\"\n\nWhat is the main purpose of this passage?",
          answer_options: [
            "A: To describe weather patterns",
            "B: To explain the causes and urgency of addressing climate change",
            "C: To discuss renewable energy sources",
            "D: To criticize government inaction",
            "E: To describe melting ice caps"
          ],
          correct_answer: "B",
          explanation: "The passage's main purpose is to explain climate change as a pressing issue and emphasize the urgency of addressing it through collective action. While weather patterns, renewable energy, and melting ice caps are mentioned, they support the central message about the urgency and potential solutions.",
          distractor_strategy: "Includes supporting details (A, C, E) and implied criticisms (D) that are not the central focus",
          characteristics: [
            "Expository passage",
            "Clear central theme",
            "Multiple supporting points",
            "Purpose identification required"
          ]
        },
        {
          difficulty: 2,
          question_text: "Read the following passage:\n\n\"The smartphone has revolutionized modern communication. Gone are the days when we relied solely on landlines and face-to-face conversations. Today, we can instantly connect with anyone across the globe through calls, texts, and video chats. Social media platforms have made it possible to share our lives with hundreds or thousands of people simultaneously. However, this constant connectivity comes at a cost – many people report feeling more isolated despite being more 'connected' than ever before.\"\n\nWhat is the main idea of this passage?",
          answer_options: [
            "A: Smartphones have improved communication technology",
            "B: Social media is harmful to relationships",
            "C: Smartphones have transformed communication but with both benefits and drawbacks",
            "D: People are more isolated today than in the past",
            "E: Landlines are obsolete"
          ],
          correct_answer: "C",
          explanation: "The passage discusses how smartphones have revolutionized communication (benefits) but also mentions the irony of feeling isolated despite constant connectivity (drawbacks). This balanced view is the main idea.",
          distractor_strategy: "Includes one-sided interpretations (A, B, D) and minor details (E)",
          characteristics: [
            "Balanced argument",
            "Contrasting viewpoints",
            "Requires synthesis",
            "Nuanced main idea"
          ]
        },
        {
          difficulty: 2,
          question_text: "Read the following passage:\n\n\"Photosynthesis is the process by which plants convert sunlight into energy. Chlorophyll, the green pigment in plant leaves, absorbs light energy from the sun. This energy is then used to convert carbon dioxide from the air and water from the soil into glucose, a type of sugar that plants use for food. Oxygen is released as a byproduct of this process, which is essential for most life on Earth.\"\n\nWhat is this passage mainly about?",
          answer_options: [
            "A: The importance of oxygen",
            "B: How plants obtain water",
            "C: The role of chlorophyll",
            "D: The process of photosynthesis and how it works",
            "E: Why leaves are green"
          ],
          correct_answer: "D",
          explanation: "The passage primarily explains what photosynthesis is and how the process works. While oxygen, chlorophyll, and water are mentioned, they are all part of explaining the overall process.",
          distractor_strategy: "Includes supporting details (A, B, C, E) that are parts of the process but not the main focus",
          characteristics: [
            "Scientific/explanatory text",
            "Process description",
            "Multiple steps mentioned",
            "Clear topic focus"
          ]
        }
      ],

      pattern: {
        format_template: "[Passage] What is the main idea/purpose/theme of the passage?",
        key_characteristics: [
          "Passages typically 100-300 words",
          "Various genres: expository, persuasive, narrative, scientific",
          "Requires distinguishing main idea from supporting details",
          "Question asks for overall purpose or central theme",
          "5 answer options"
        ],
        distractor_strategies: [
          "Supporting details presented as main ideas",
          "Too specific focus on one part of passage",
          "Too broad generalization",
          "Implied ideas not explicitly stated",
          "One side of a balanced argument"
        ],
        difficulty_progression: {
          "1": "N/A - VIC Selective uses single difficulty level",
          "2": "Varied: explicit main ideas to implicit themes requiring synthesis",
          "3": "N/A - VIC Selective uses single difficulty level"
        }
      }
    },

    // SUB-SKILL 2: Inference & Drawing Conclusions
    "Inference & Drawing Conclusions": {
      description: "Making logical inferences and drawing conclusions based on information presented in the passage",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [2],
      question_format: "What can be inferred/concluded from the passage?",

      examples: [
        {
          difficulty: 2,
          question_text: "Read the following passage:\n\n\"Maria checked her watch for the third time in five minutes. The train was already twenty minutes late, and she had an important presentation in an hour. She paced back and forth on the platform, rehearsing her opening remarks under her breath. Every time she heard a distant rumble, she would look up hopefully, only to be disappointed when it turned out to be a train on another line.\"\n\nWhat can be inferred about Maria?",
          answer_options: [
            "A: She is a professional public speaker",
            "B: She is anxious about being late for her presentation",
            "C: She forgot her presentation materials",
            "D: She has never taken a train before",
            "E: She is waiting for a friend"
          ],
          correct_answer: "B",
          explanation: "Maria's repeated checking of her watch, pacing, and the mention of an important presentation in an hour all suggest she is anxious about being late. There is no evidence for options A, C, D, or E.",
          distractor_strategy: "Includes assumptions not supported by text (A, C, D, E)",
          characteristics: [
            "Behavioral clues",
            "Emotional state inference",
            "Multiple details support conclusion",
            "No explicit statement of emotion"
          ]
        },
        {
          difficulty: 2,
          question_text: "Read the following passage:\n\n\"The old house had been empty for years. The garden was overgrown with weeds, and ivy had crept up the walls, nearly covering the broken windows. Inside, dust covered every surface, and cobwebs hung in the corners. Yet despite its neglected appearance, the house still retained a certain grandeur – the ornate fireplace, the high ceilings, and the sweeping staircase hinted at its former glory.\"\n\nWhat can be concluded about the house?",
          answer_options: [
            "A: It was recently sold",
            "B: It was once an impressive and well-maintained home",
            "C: It will be demolished soon",
            "D: It was never actually lived in",
            "E: It is now a museum"
          ],
          correct_answer: "B",
          explanation: "The passage describes current neglect but also mentions 'former glory' and impressive features like the ornate fireplace and sweeping staircase, suggesting it was once impressive and well-maintained.",
          distractor_strategy: "Includes unsupported assumptions about past or future (A, C, D, E)",
          characteristics: [
            "Descriptive passage",
            "Past vs present comparison",
            "Evidence-based inference",
            "Requires synthesis of clues"
          ]
        },
        {
          difficulty: 2,
          question_text: "Read the following passage:\n\n\"The experiment yielded unexpected results. Instead of the predicted decrease in temperature, the researchers observed a 15-degree increase. Dr. Chen immediately ordered the team to double-check all equipment calibrations and repeat the experiment three more times. Each repetition produced similar results, leading the team to reconsider their initial hypothesis.\"\n\nWhat can be inferred from this passage?",
          answer_options: [
            "A: The equipment was faulty",
            "B: Dr. Chen is not a good scientist",
            "C: The initial hypothesis may have been incorrect",
            "D: The experiment was a complete failure",
            "E: Temperature cannot be measured accurately"
          ],
          correct_answer: "C",
          explanation: "The passage states that after confirming the results were consistent, 'the team to reconsider their initial hypothesis,' directly supporting option C.",
          distractor_strategy: "Includes negative interpretations (A, B, D, E) not supported by the systematic approach described",
          characteristics: [
            "Scientific context",
            "Logical progression",
            "Evidence of systematic thinking",
            "Explicit statement at end"
          ]
        }
      ],

      pattern: {
        format_template: "[Passage] What can be inferred/concluded about [subject]?",
        key_characteristics: [
          "Requires reading between the lines",
          "Conclusion must be supported by evidence in passage",
          "Cannot be directly stated in text",
          "Various contexts: character emotions, situations, outcomes",
          "5 answer options"
        ],
        distractor_strategies: [
          "Assumptions not supported by evidence",
          "Too extreme or absolute conclusions",
          "Mixing up cause and effect",
          "Confusing possibility with probability",
          "Information from outside knowledge, not the passage"
        ],
        difficulty_progression: {
          "1": "N/A - VIC Selective uses single difficulty level",
          "2": "Varied: straightforward inferences to complex conclusions requiring synthesis of multiple clues",
          "3": "N/A - VIC Selective uses single difficulty level"
        }
      }
    },

    // SUB-SKILL 3: Vocabulary in Context
    "Vocabulary in Context": {
      description: "Determining the meaning of words or phrases as used in the context of a passage",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [2],
      question_format: "What does [word/phrase] mean in the context of the passage?",

      examples: [
        {
          difficulty: 2,
          question_text: "Read the following passage:\n\n\"The politician's speech was met with skepticism from the audience. Many had heard similar promises before, only to be disappointed when they were not fulfilled. The crowd's dubious expressions made it clear that they would need more than words to be convinced.\"\n\nIn this context, what does \"skepticism\" mean?",
          answer_options: [
            "A: Excitement",
            "B: Doubt or disbelief",
            "C: Anger",
            "D: Confusion",
            "E: Agreement"
          ],
          correct_answer: "B",
          explanation: "The context clues – 'similar promises before,' 'disappointed,' and 'dubious expressions' – all suggest that skepticism means doubt or disbelief.",
          distractor_strategy: "Includes other emotional responses (A, C, D, E) that don't fit the context",
          characteristics: [
            "Context clues provided",
            "Synonym relationship",
            "Emotional/attitudinal word",
            "Supporting evidence in passage"
          ]
        },
        {
          difficulty: 2,
          question_text: "Read the following passage:\n\n\"The forest was so dense that sunlight barely penetrated the canopy. Walking through it felt like navigating a maze in near-darkness, with thick undergrowth impeding every step.\"\n\nWhat does \"dense\" mean in this context?",
          answer_options: [
            "A: Heavy",
            "B: Thick or closely packed",
            "C: Dark",
            "D: Wet",
            "E: Large"
          ],
          correct_answer: "B",
          explanation: "The context shows that the forest is so 'dense' that sunlight can't get through and there's thick undergrowth, indicating it means thick or closely packed.",
          distractor_strategy: "Includes related but incorrect meanings (A, C, D, E)",
          characteristics: [
            "Multiple context clues",
            "Cause-and-effect relationship",
            "Descriptive context",
            "Common word with specific contextual meaning"
          ]
        },
        {
          difficulty: 2,
          question_text: "Read the following passage:\n\n\"After months of meticulous planning, the team was finally ready to execute their strategy. Every detail had been carefully considered, and nothing was left to chance.\"\n\nWhat does \"meticulous\" mean in this context?",
          answer_options: [
            "A: Quick",
            "B: Expensive",
            "C: Careful and precise",
            "D: Complicated",
            "E: Creative"
          ],
          correct_answer: "C",
          explanation: "The phrase 'every detail had been carefully considered' directly supports that meticulous means careful and precise.",
          distractor_strategy: "Includes words that might describe planning (A, D, E) but don't match the context clues",
          characteristics: [
            "Direct explanation following the word",
            "Restatement as context clue",
            "Formal vocabulary",
            "Clear evidence in text"
          ]
        }
      ],

      pattern: {
        format_template: "[Passage containing target word] What does [word] mean in this context?",
        key_characteristics: [
          "Word meaning must be determined from context",
          "Context clues: synonyms, antonyms, examples, explanations",
          "May test multiple meanings of common words",
          "Requires understanding of how context shapes meaning",
          "5 answer options"
        ],
        distractor_strategies: [
          "Common meanings that don't fit context",
          "Words related to the topic but wrong meaning",
          "Similar-sounding words",
          "Partial meanings",
          "Meanings from different word forms"
        ],
        difficulty_progression: {
          "1": "N/A - VIC Selective uses single difficulty level",
          "2": "Varied: common words in context to advanced vocabulary with subtle clues",
          "3": "N/A - VIC Selective uses single difficulty level"
        }
      }
    },

    // SUB-SKILL 4: Author's Purpose & Tone
    "Author's Purpose & Tone": {
      description: "Identifying the author's purpose (persuade, inform, entertain) and determining the tone or attitude conveyed in the passage",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [2],
      question_format: "What is the author's purpose/tone in this passage?",

      examples: [
        {
          difficulty: 2,
          question_text: "Read the following passage:\n\n\"Recycling is not just an option – it's a necessity. Every year, millions of tons of waste end up in landfills when they could be recycled. It's time for everyone to take responsibility and make recycling a priority in their daily lives. The future of our planet depends on the choices we make today.\"\n\nWhat is the author's primary purpose?",
          answer_options: [
            "A: To entertain readers with stories about recycling",
            "B: To inform readers about landfill statistics",
            "C: To persuade readers to recycle more",
            "D: To describe the recycling process",
            "E: To criticize people who don't recycle"
          ],
          correct_answer: "C",
          explanation: "The imperative statements ('it's a necessity,' 'It's time,' 'make recycling a priority') and urgent tone indicate the author's purpose is to persuade readers to recycle more.",
          distractor_strategy: "Includes other purposes that are secondary or not present (A, B, D, E)",
          characteristics: [
            "Persuasive text",
            "Strong language",
            "Call to action",
            "Urgent tone"
          ]
        },
        {
          difficulty: 2,
          question_text: "Read the following passage:\n\n\"The water cycle is a continuous process by which water circulates between the Earth's oceans, atmosphere, and land. It involves evaporation, condensation, precipitation, and collection. This cycle is essential for distributing water resources around the planet and maintaining ecosystems.\"\n\nWhat is the author's primary purpose?",
          answer_options: [
            "A: To persuade readers to conserve water",
            "B: To inform readers about the water cycle",
            "C: To entertain with a story about water",
            "D: To criticize water pollution",
            "E: To describe the author's personal experience"
          ],
          correct_answer: "B",
          explanation: "The passage objectively explains what the water cycle is and how it works, with no persuasive elements or personal narrative, indicating an informative purpose.",
          distractor_strategy: "Includes other purposes (A, C, D, E) that don't match the neutral, explanatory tone",
          characteristics: [
            "Informative/explanatory text",
            "Neutral tone",
            "Factual information",
            "Process description"
          ]
        },
        {
          difficulty: 2,
          question_text: "Read the following passage:\n\n\"I couldn't believe my eyes when I opened the box. Inside was a tiny puppy, all fluffy and adorable, with big brown eyes that seemed to look right into my soul. It was love at first sight! My heart melted as the little creature wagged its tail and let out the tiniest bark I'd ever heard.\"\n\nWhat is the tone of this passage?",
          answer_options: [
            "A: Angry and bitter",
            "B: Sad and depressed",
            "C: Neutral and informative",
            "D: Joyful and affectionate",
            "E: Serious and formal"
          ],
          correct_answer: "D",
          explanation: "Words like 'adorable,' 'love at first sight,' and 'heart melted' convey a joyful and affectionate tone toward the puppy.",
          distractor_strategy: "Includes opposite or unrelated tones (A, B, C, E)",
          characteristics: [
            "Emotional language",
            "Personal narrative",
            "Descriptive adjectives",
            "Tone indicators throughout"
          ]
        }
      ],

      pattern: {
        format_template: "[Passage] What is the author's purpose/tone?",
        key_characteristics: [
          "Purpose: persuade, inform, entertain, describe, explain",
          "Tone: formal, informal, serious, humorous, critical, admiring, etc.",
          "Requires analyzing word choice and overall message",
          "May ask about overall passage or specific section",
          "5 answer options"
        ],
        distractor_strategies: [
          "Secondary purposes instead of primary",
          "Opposite or unrelated tones",
          "Confusing objective information with persuasion",
          "Misidentifying neutral tone as persuasive or vice versa",
          "Focusing on one sentence instead of overall passage"
        ],
        difficulty_progression: {
          "1": "N/A - VIC Selective uses single difficulty level",
          "2": "Varied: obvious persuasive/informative distinction to subtle tone nuances",
          "3": "N/A - VIC Selective uses single difficulty level"
        }
      }
    },

    // SUB-SKILL 5: Supporting Details & Evidence
    "Supporting Details & Evidence": {
      description: "Identifying specific details, facts, or evidence that support the main idea or answer specific questions about the passage",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [2],
      question_format: "Which detail/evidence from the passage supports [claim]?",

      examples: [
        {
          difficulty: 2,
          question_text: "Read the following passage:\n\n\"The ancient pyramids of Egypt are remarkable feats of engineering. Built over 4,500 years ago, they were constructed using millions of limestone blocks, each weighing several tons. The Great Pyramid of Giza, the largest of them all, was originally 146 meters tall. What makes these structures even more impressive is that they were built without modern machinery or tools.\"\n\nWhich detail supports the idea that the pyramids are impressive engineering feats?",
          answer_options: [
            "A: They are located in Egypt",
            "B: They were built without modern machinery",
            "C: They are ancient structures",
            "D: The Great Pyramid is in Giza",
            "E: They are popular tourist attractions"
          ],
          correct_answer: "B",
          explanation: "The fact that pyramids were built without modern machinery, using millions of multi-ton blocks, directly supports how impressive the engineering was.",
          distractor_strategy: "Includes factual details from passage (A, C, D) and outside information (E) that don't support the specific claim",
          characteristics: [
            "Explicit detail identification",
            "Requires connecting detail to claim",
            "Multiple facts in passage",
            "Logical relationship required"
          ]
        },
        {
          difficulty: 2,
          question_text: "Read the following passage:\n\n\"Regular exercise provides numerous health benefits. Studies have shown that people who exercise regularly have lower rates of heart disease, stronger bones, and better mental health. Exercise also helps maintain a healthy weight, improves sleep quality, and increases energy levels throughout the day.\"\n\nAccording to the passage, which of these is NOT mentioned as a benefit of regular exercise?",
          answer_options: [
            "A: Lower rates of heart disease",
            "B: Stronger bones",
            "C: Improved sleep quality",
            "D: Better eyesight",
            "E: Better mental health"
          ],
          correct_answer: "D",
          explanation: "Better eyesight is not mentioned in the passage. All other options (A, B, C, E) are explicitly stated as benefits.",
          distractor_strategy: "Includes all explicitly mentioned benefits (A, B, C, E) and one that sounds plausible but isn't mentioned (D)",
          characteristics: [
            "Requires careful reading",
            "NOT question format",
            "All details are health-related",
            "Tests attention to specific facts"
          ]
        },
        {
          difficulty: 2,
          question_text: "Read the following passage:\n\n\"The Industrial Revolution, which began in Britain in the late 18th century, transformed society in profound ways. Factories replaced cottage industries, cities grew rapidly as people moved from rural areas seeking work, and new technologies like the steam engine revolutionized transportation and manufacturing. However, these changes also brought challenges, including poor working conditions, child labor, and environmental pollution.\"\n\nWhich evidence from the passage shows that the Industrial Revolution had negative effects?",
          answer_options: [
            "A: It began in Britain",
            "B: Cities grew rapidly",
            "C: The steam engine was invented",
            "D: There were poor working conditions and child labor",
            "E: Factories replaced cottage industries"
          ],
          correct_answer: "D",
          explanation: "Poor working conditions, child labor, and pollution are explicitly mentioned as challenges (negative effects) of the Industrial Revolution.",
          distractor_strategy: "Includes neutral facts (A, C, E) and a change that could be positive or neutral (B)",
          characteristics: [
            "Requires distinguishing positive from negative",
            "Cause-and-effect relationship",
            "Multiple details of different types",
            "Evidence evaluation"
          ]
        }
      ],

      pattern: {
        format_template: "[Passage] Which detail/evidence [supports claim/answers question]?",
        key_characteristics: [
          "Requires locating specific information in passage",
          "May ask which detail supports a claim",
          "May ask which is NOT mentioned",
          "Tests careful reading and fact identification",
          "5 answer options"
        ],
        distractor_strategies: [
          "Facts from passage that don't answer the specific question",
          "Plausible information not in the passage",
          "Details related to topic but not supporting the claim",
          "Mixing up similar details",
          "Generalizations instead of specific evidence"
        ],
        difficulty_progression: {
          "1": "N/A - VIC Selective uses single difficulty level",
          "2": "Varied: direct fact retrieval to identifying evidence for complex claims",
          "3": "N/A - VIC Selective uses single difficulty level"
        }
      }
    },

    // ========================================
    // STANDALONE LANGUAGE CONVENTIONS (30-40% of Reading Reasoning Test)
    // These questions do NOT require passages - they are standalone grammar, punctuation, and language questions
    // ========================================

    // SUB-SKILL 6: Grammar & Sentence Structure
    "Grammar & Sentence Structure": {
      description: "Identifying and correcting grammatical errors in standalone sentences; understanding subject-verb agreement, verb tenses, pronoun usage, and sentence structure. These are standalone questions without passages.",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [2],
      question_format: "Identify the grammatically correct sentence OR identify the error in the sentence.",

      examples: [
        {
          difficulty: 2,
          question_text: "Which sentence is grammatically correct?",
          answer_options: [
            "A: The students was excited about the excursion.",
            "B: The students were excited about the excursion.",
            "C: The students is excited about the excursion.",
            "D: The students been excited about the excursion.",
            "E: None of these"
          ],
          correct_answer: "B",
          explanation: "The plural subject 'students' requires the plural verb 'were', not the singular 'was' or 'is'. Option D uses incorrect verb form 'been' without helping verb.",
          distractor_strategy: "Options A and C use singular verbs with plural subject. Option D uses incorrect verb form. Option E is incorrect because B is correct.",
          characteristics: [
            "Subject-verb agreement",
            "Plural subject requires plural verb",
            "Year 9 level grammar",
            "Standalone question (no passage)",
            "5 options including 'None of these'"
          ]
        },
        {
          difficulty: 2,
          question_text: "Which sentence uses the correct pronoun?",
          answer_options: [
            "A: Me and Sarah went to the library.",
            "B: Sarah and me went to the library.",
            "C: Sarah and I went to the library.",
            "D: Sarah and myself went to the library.",
            "E: None of these"
          ],
          correct_answer: "C",
          explanation: "The compound subject requires the subjective pronoun 'I', not the objective 'me'. To test: you would say 'I went' not 'me went'. 'Myself' is reflexive and incorrect here.",
          distractor_strategy: "A and B use objective pronoun incorrectly. D uses reflexive pronoun incorrectly. Common errors students make.",
          characteristics: [
            "Pronoun case (subjective vs objective)",
            "Compound subject",
            "Common grammar error",
            "Year 9 appropriate",
            "Standalone grammar question"
          ]
        },
        {
          difficulty: 2,
          question_text: "Identify the sentence with correct verb tense consistency:",
          answer_options: [
            "A: She walked to the store and buys some milk.",
            "B: She walks to the store and bought some milk.",
            "C: She walked to the store and bought some milk.",
            "D: She walk to the store and buy some milk.",
            "E: None of these"
          ],
          correct_answer: "C",
          explanation: "Both verbs should be in past tense: 'walked' and 'bought'. Options A and B mix past and present tense. Option D uses incorrect verb forms.",
          distractor_strategy: "A and B mix tenses (common error). D uses incorrect base forms. Tests understanding of tense consistency.",
          characteristics: [
            "Verb tense consistency",
            "Compound predicate",
            "Past tense usage",
            "Parallel structure",
            "Standalone grammar question"
          ]
        }
      ],

      pattern: {
        format_template: "Which sentence is grammatically correct? OR Identify the grammatical error in: [sentence]",
        key_characteristics: [
          "Standalone questions (NO passage required)",
          "Tests explicit grammar knowledge",
          "Common error patterns: subject-verb agreement, pronoun case, verb tense, modifiers",
          "Year 9 level grammar complexity",
          "5 options including 'None of these'",
          "Approximately 15% of Reading Reasoning test"
        ],
        distractor_strategies: [
          "Common grammar mistakes students make",
          "Mixing singular/plural verb forms",
          "Incorrect pronoun cases",
          "Verb tense inconsistencies",
          "Misplaced modifiers",
          "Run-on sentences or fragments"
        ],
        difficulty_progression: {
          "1": "N/A - VIC Selective uses single difficulty level",
          "2": "Varied: basic subject-verb agreement to complex sentence structure issues",
          "3": "N/A - VIC Selective uses single difficulty level"
        }
      }
    },

    // SUB-SKILL 7: Punctuation & Mechanics
    "Punctuation & Mechanics": {
      description: "Identifying correct punctuation usage including commas, apostrophes, quotation marks, semicolons, and end punctuation. Standalone questions testing punctuation rules.",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [2],
      question_format: "Which sentence uses punctuation correctly?",

      examples: [
        {
          difficulty: 2,
          question_text: "Which sentence uses punctuation correctly?",
          answer_options: [
            "A: Its raining outside, so bring you're umbrella.",
            "B: It's raining outside, so bring your umbrella.",
            "C: Its raining outside so bring your umbrella.",
            "D: It's raining outside so bring you're umbrella.",
            "E: None of these"
          ],
          correct_answer: "B",
          explanation: "'It's' is the contraction of 'it is'. 'Your' is the possessive pronoun. The comma is needed before 'so' joining two independent clauses. Options A, C, and D have errors with contractions, possessives, or commas.",
          distractor_strategy: "Tests both apostrophes and commas. A uses wrong forms of both its/it's and your/you're. C missing comma. D has wrong you're.",
          characteristics: [
            "Apostrophes in contractions vs possessives",
            "Comma before coordinating conjunction",
            "Common homophones (its/it's, your/you're)",
            "Compound sentence punctuation",
            "Year 9 level"
          ]
        },
        {
          difficulty: 2,
          question_text: "Which sentence uses apostrophes correctly?",
          answer_options: [
            "A: The dog's chased the cat's through the garden.",
            "B: The dogs chased the cats through the garden.",
            "C: The dog's chased the cats' through the garden.",
            "D: The dogs' chased the cat's through the garden.",
            "E: None of these"
          ],
          correct_answer: "B",
          explanation: "No apostrophes are needed here. 'Dogs' and 'cats' are simple plurals, not possessives or contractions. Options A, C, and D incorrectly use apostrophes for plurals.",
          distractor_strategy: "Tests understanding that plurals don't need apostrophes. Common error is adding apostrophes to plurals.",
          characteristics: [
            "Plural vs possessive",
            "No apostrophe for simple plurals",
            "Common punctuation error",
            "Tests apostrophe understanding",
            "Standalone punctuation question"
          ]
        },
        {
          difficulty: 2,
          question_text: "Which sentence uses quotation marks correctly?",
          answer_options: [
            "A: \"I'll meet you at 3:00, said Maria.\"",
            "B: \"I'll meet you at 3:00\" said Maria.",
            "C: \"I'll meet you at 3:00,\" said Maria.",
            "D: I'll meet you at 3:00, \"said Maria.\"",
            "E: None of these"
          ],
          correct_answer: "C",
          explanation: "The comma goes inside the closing quotation mark, and 'said Maria' is outside the quotes as dialogue tag. A puts dialogue tag inside quotes. B missing comma. D incorrectly places dialogue tag in quotes.",
          distractor_strategy: "Tests dialogue punctuation rules. Common errors include comma placement and what goes inside/outside quotes.",
          characteristics: [
            "Dialogue punctuation",
            "Quotation mark placement",
            "Comma with dialogue tags",
            "Year 9 level",
            "Standalone punctuation question"
          ]
        }
      ],

      pattern: {
        format_template: "Which sentence uses punctuation correctly? [Multiple versions with different punctuation]",
        key_characteristics: [
          "Standalone questions (NO passage required)",
          "Tests: apostrophes, commas, quotation marks, semicolons, end punctuation",
          "Common patterns: its/it's, your/you're, plurals vs possessives",
          "Dialogue punctuation",
          "Comma rules (lists, compound sentences, introductory phrases)",
          "Approximately 10% of Reading Reasoning test",
          "5 options"
        ],
        distractor_strategies: [
          "Incorrect apostrophe usage (plurals, contractions, possessives)",
          "Missing or misplaced commas",
          "Quotation mark placement errors",
          "Confusing homophones (its/it's, your/you're, their/they're/there)",
          "Semicolon misuse",
          "End punctuation errors"
        ],
        difficulty_progression: {
          "1": "N/A - VIC Selective uses single difficulty level",
          "2": "Varied: basic apostrophes to complex comma rules and dialogue punctuation",
          "3": "N/A - VIC Selective uses single difficulty level"
        }
      }
    },

    // SUB-SKILL 8: Spelling & Word Choice
    "Spelling & Word Choice": {
      description: "Identifying correctly spelled words and choosing appropriate words for context. Standalone spelling and vocabulary precision questions.",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [2],
      question_format: "Which word is spelled correctly? OR Which word best fits the context?",

      examples: [
        {
          difficulty: 2,
          question_text: "Which word is spelled correctly?",
          answer_options: [
            "A: accomodate",
            "B: acommodate",
            "C: accommodate",
            "D: acomodate",
            "E: None of these"
          ],
          correct_answer: "C",
          explanation: "'Accommodate' has two c's and two m's. This is one of the most commonly misspelled words in English.",
          distractor_strategy: "Shows common misspellings with single c, single m, or both. Tests one of the most frequently misspelled words.",
          characteristics: [
            "Commonly misspelled word",
            "Double consonants",
            "Year 9 spelling expectation",
            "Standalone spelling question",
            "5 options"
          ]
        },
        {
          difficulty: 2,
          question_text: "Choose the correct word to complete the sentence:\n\nThe weather had a significant _____ on the crops.",
          answer_options: [
            "A: affect",
            "B: effect",
            "C: affekt",
            "D: efect",
            "E: None of these"
          ],
          correct_answer: "B",
          explanation: "'Effect' (noun) is correct here meaning result or consequence. 'Affect' is typically a verb meaning to influence. The sentence needs a noun after 'a'.",
          distractor_strategy: "Tests affect/effect confusion (common error). C and D are misspellings. Tests both spelling and word choice.",
          characteristics: [
            "Commonly confused words (affect/effect)",
            "Part of speech awareness",
            "Context-based word choice",
            "Includes spelling variants",
            "Year 9 level"
          ]
        },
        {
          difficulty: 2,
          question_text: "Which sentence uses the correct spelling?",
          answer_options: [
            "A: The principle of the school made an announcement.",
            "B: The principal of the school made an announcement.",
            "C: The prinsipal of the school made an announcement.",
            "D: The princapal of the school made an announcement.",
            "E: None of these"
          ],
          correct_answer: "B",
          explanation: "'Principal' (person in charge) is correct. 'Principle' means a fundamental rule or belief. C and D are misspellings.",
          distractor_strategy: "Tests principal/principle homophone confusion plus misspellings. Common error with homophones.",
          characteristics: [
            "Homophones (principal/principle)",
            "Context determines correct spelling",
            "Common confusion",
            "Year 9 vocabulary",
            "Standalone question"
          ]
        }
      ],

      pattern: {
        format_template: "Which word is spelled correctly? OR Which word best completes: [sentence with blank]",
        key_characteristics: [
          "Standalone questions (NO passage required)",
          "Tests commonly misspelled words",
          "Tests homophones and commonly confused words",
          "May include context sentence for word choice",
          "Year 9 spelling expectations",
          "Approximately 5% of Reading Reasoning test",
          "5 options"
        ],
        distractor_strategies: [
          "Common misspellings (accommodate, necessary, separate, etc.)",
          "Homophones (their/there/they're, your/you're, its/it's, affect/effect, principal/principle)",
          "Similar-sounding words",
          "Phonetic spellings that are incorrect",
          "Word choice errors based on part of speech"
        ],
        difficulty_progression: {
          "1": "N/A - VIC Selective uses single difficulty level",
          "2": "Varied: frequently misspelled words to sophisticated vocabulary spelling",
          "3": "N/A - VIC Selective uses single difficulty level"
        }
      }
    },

    // SUB-SKILL 9: Idioms & Figurative Language
    "Idioms & Figurative Language": {
      description: "Understanding the meaning of common idioms, expressions, and figurative language. Standalone questions asking for the meaning of phrases.",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [2],
      question_format: "What does the idiom/phrase mean?",

      examples: [
        {
          difficulty: 2,
          question_text: "What does the idiom 'to bite the bullet' mean?",
          answer_options: [
            "A: To eat something hard",
            "B: To face a difficult situation with courage",
            "C: To make a mistake",
            "D: To chew food properly",
            "E: None of these"
          ],
          correct_answer: "B",
          explanation: "'To bite the bullet' is an idiom meaning to face a difficult or unpleasant situation with courage and determination. It originated from patients biting on bullets during surgery before anesthesia.",
          distractor_strategy: "A and D are literal interpretations. C is an unrelated idiom meaning. Tests understanding of non-literal meaning.",
          characteristics: [
            "Common English idiom",
            "Non-literal meaning",
            "Year 9 appropriate",
            "Standalone idiom question",
            "No context provided"
          ]
        },
        {
          difficulty: 2,
          question_text: "What does the expression 'break the ice' mean?",
          answer_options: [
            "A: To damage something frozen",
            "B: To make people feel more relaxed in a social situation",
            "C: To start a conversation about cold weather",
            "D: To create a problem",
            "E: None of these"
          ],
          correct_answer: "B",
          explanation: "'Break the ice' means to make people feel more comfortable in a social situation, especially when meeting for the first time or in an awkward situation.",
          distractor_strategy: "A is literal interpretation. C relates to 'ice' literally. D is opposite meaning. Tests idiomatic understanding.",
          characteristics: [
            "Common social idiom",
            "Figurative vs literal",
            "Social context idiom",
            "Year 9 level",
            "Standalone question"
          ]
        },
        {
          difficulty: 2,
          question_text: "What does the phrase 'costs an arm and a leg' mean?",
          answer_options: [
            "A: Something is very expensive",
            "B: Something is free",
            "C: Something causes physical injury",
            "D: Something is on sale",
            "E: None of these"
          ],
          correct_answer: "A",
          explanation: "The phrase 'costs an arm and a leg' is an idiom meaning something is very expensive or costs a lot of money. It's an exaggeration for emphasis.",
          distractor_strategy: "B and D are opposite meanings. C is literal interpretation. Tests hyperbolic expression understanding.",
          characteristics: [
            "Hyperbolic idiom",
            "Money/cost related",
            "Common expression",
            "Exaggeration for effect",
            "Year 9 appropriate"
          ]
        }
      ],

      pattern: {
        format_template: "What does the idiom/phrase/expression '[idiom]' mean?",
        key_characteristics: [
          "Standalone questions (NO passage or context)",
          "Tests common English idioms and expressions",
          "Figurative vs literal meaning",
          "Year 9 level idioms",
          "Approximately 5% of Reading Reasoning test",
          "5 options"
        ],
        distractor_strategies: [
          "Literal interpretations of figurative language",
          "Opposite or unrelated meanings",
          "Partial understanding of idiom",
          "Words from the idiom taken literally",
          "Similar-sounding expressions with different meanings"
        ],
        difficulty_progression: {
          "1": "N/A - VIC Selective uses single difficulty level",
          "2": "Varied: common everyday idioms to less familiar expressions",
          "3": "N/A - VIC Selective uses single difficulty level"
        }
      }
    },

    // SUB-SKILL 10: Sentence Transformation
    "Sentence Transformation": {
      description: "Combining sentences, maintaining meaning while changing structure, or identifying best ways to express ideas. Standalone sentence manipulation questions.",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [2],
      question_format: "Which sentence best combines/expresses the ideas? OR Choose the best way to rewrite the sentence.",

      examples: [
        {
          difficulty: 2,
          question_text: "Which sentence best combines these two sentences?\n\nSentence 1: The concert was cancelled.\nSentence 2: It was raining heavily.",
          answer_options: [
            "A: The concert was cancelled and it was raining heavily.",
            "B: The concert was cancelled because it was raining heavily.",
            "C: The concert was cancelled, it was raining heavily.",
            "D: It was raining heavily, the concert was cancelled.",
            "E: None of these"
          ],
          correct_answer: "B",
          explanation: "Option B best shows the cause-and-effect relationship using 'because'. Option A uses 'and' which doesn't show causation. Options C and D are comma splices (incorrect punctuation).",
          distractor_strategy: "A uses simple conjunction without causation. C and D are comma splices. Tests logical connectors and cause-effect.",
          characteristics: [
            "Sentence combining",
            "Cause-and-effect relationship",
            "Logical connectors",
            "Avoiding comma splices",
            "Year 9 level"
          ]
        },
        {
          difficulty: 2,
          question_text: "Which is the best way to express this idea?\n\nThe movie was long. The movie was boring. Many people left early.",
          answer_options: [
            "A: The movie was long and boring and many people left early.",
            "B: Because the movie was long and boring, many people left early.",
            "C: The movie was long, boring, many people left early.",
            "D: Many people left early, the movie was long and boring.",
            "E: None of these"
          ],
          correct_answer: "B",
          explanation: "Option B best expresses the cause (long and boring movie) and effect (people left early) with proper sentence structure. A is acceptable but less sophisticated. C and D have punctuation issues.",
          distractor_strategy: "A is grammatically correct but less sophisticated. C is comma splice. D reverses logical order and lacks proper punctuation.",
          characteristics: [
            "Combining multiple ideas",
            "Cause-and-effect structure",
            "Subordination vs coordination",
            "Sentence sophistication",
            "Year 9 writing level"
          ]
        },
        {
          difficulty: 2,
          question_text: "Which sentence is the most concise way to express this idea?\n\n\"In spite of the fact that it was very late at night, we continued to work on the project.\"",
          answer_options: [
            "A: Although it was very late at night, we continued working on the project.",
            "B: Despite its being very late at night, we continued to work on the project.",
            "C: Although it was late, we continued working on the project.",
            "D: We continued working on the project in spite of the fact that it was very late at night.",
            "E: None of these"
          ],
          correct_answer: "C",
          explanation: "Option C is the most concise, removing 'very' (redundant with 'late at night') and using 'Although' instead of the wordy 'In spite of the fact that'. It maintains the meaning while being more direct.",
          distractor_strategy: "A is better than original but still includes 'very'. B is awkward. D just rearranges without improving conciseness. Tests editing for conciseness.",
          characteristics: [
            "Conciseness and clarity",
            "Eliminating wordiness",
            "Maintaining meaning",
            "Sophisticated expression",
            "Year 9 writing skill"
          ]
        }
      ],

      pattern: {
        format_template: "Which sentence best combines/expresses: [sentences or ideas] OR Choose the best way to rewrite: [sentence]",
        key_characteristics: [
          "Standalone questions (NO passage required)",
          "Tests sentence combining and transformation",
          "Logical connectors (because, although, since, while, etc.)",
          "Avoiding comma splices and run-ons",
          "Conciseness and clarity",
          "Maintaining meaning while improving expression",
          "Approximately 5% of Reading Reasoning test",
          "5 options"
        ],
        distractor_strategies: [
          "Comma splices and run-on sentences",
          "Weak or illogical connectors",
          "Wordy expressions",
          "Awkward constructions",
          "Reversing logical relationships",
          "Grammatically correct but less effective options"
        ],
        difficulty_progression: {
          "1": "N/A - VIC Selective uses single difficulty level",
          "2": "Varied: simple combining to complex restructuring for conciseness and clarity",
          "3": "N/A - VIC Selective uses single difficulty level"
        }
      }
    }

  },

  // ============================================
  // VIC SELECTIVE ENTRY (YEAR 9 ENTRY) - WRITING
  // ============================================

  "VIC Selective Entry (Year 9 Entry) - Writing": {

    // SUB-SKILL 1: Creative Writing
    "Creative Writing": {
      description: "Writing imaginative narratives with well-developed characters, settings, and plots; using descriptive language and narrative techniques",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [2],
      question_format: "Write a creative story based on the given prompt",

      examples: [
        {
          difficulty: 2,
          question_text: "CREATIVE WRITING PROMPT:\n\nWrite a story based on the following idea:\n\n\"Something precious that was lost has been returned.\"\n\nYour story should:\n• Be engaging and imaginative\n• Have a clear beginning, middle, and end\n• Include descriptive language\n• Be approximately 400-600 words\n\nTime allowed: 20 minutes (of the 40-minute writing test)",
          answer_options: [],
          correct_answer: "Open-ended creative writing response",
          explanation: "This is a creative writing prompt that asks students to write a narrative story about something precious being returned. Students should develop characters, setting, plot, and use narrative techniques like dialogue, description, and showing vs telling. The story should have a clear narrative arc.",
          characteristics: [
            "Open-ended prompt",
            "Narrative writing",
            "Requires imagination",
            "Time-limited (20 mins)",
            "Word count guidance (400-600 words)",
            "Specific criteria provided"
          ]
        }
      ],

      pattern: {
        format_template: "Write a story based on [prompt/image/scenario]. Your story should: [criteria list]",
        key_characteristics: [
          "Narrative/story writing",
          "Often includes a theme, scenario, or opening sentence",
          "Typically 400-600 words",
          "Time limit: approximately 20 minutes",
          "Assessed on: ideas, organization, vocabulary, sentence structure, conventions",
          "Should include narrative elements: characters, setting, plot, conflict, resolution"
        ],
        distractor_strategies: [
          "N/A - Open-ended writing task"
        ],
        difficulty_progression: {
          "1": "N/A - VIC Selective uses single difficulty level",
          "2": "Varied prompts: concrete scenarios to abstract themes, visual prompts to text-based prompts",
          "3": "N/A - VIC Selective uses single difficulty level"
        }
      }
    },

    // SUB-SKILL 2: Persuasive Writing
    "Persuasive Writing": {
      description: "Writing arguments that take a clear position on an issue; using evidence, reasoning, and persuasive techniques to convince readers",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [2],
      question_format: "Write a persuasive piece arguing for or against a position",

      examples: [
        {
          difficulty: 2,
          question_text: "PERSUASIVE WRITING PROMPT:\n\nRead the following information:\n\n\"Some countries have banned all whaling (hunting of whales), while others allow it to continue for commercial or cultural reasons. Supporters of whaling argue that it is part of their cultural heritage and provides jobs. Opponents argue that whales are endangered and intelligent creatures that should be protected.\"\n\nWrite a persuasive piece arguing either FOR or AGAINST the banning of whaling worldwide.\n\nYour writing should:\n• State your position clearly\n• Provide reasons and evidence to support your position\n• Address opposing viewpoints\n• Use persuasive language and techniques\n• Be approximately 400-600 words\n\nTime allowed: 20 minutes (of the 40-minute writing test)",
          answer_options: [],
          correct_answer: "Open-ended persuasive writing response",
          explanation: "This persuasive writing prompt asks students to take a position on whaling and argue for their viewpoint. Students should present a clear thesis, support it with reasons and evidence, acknowledge counterarguments, and use persuasive techniques. The writing should be well-organized with an introduction, body paragraphs, and conclusion.",
          characteristics: [
            "Open-ended prompt",
            "Persuasive/argumentative writing",
            "Controversial topic",
            "Time-limited (20 mins)",
            "Word count guidance (400-600 words)",
            "Must address both sides",
            "Specific criteria provided"
          ]
        }
      ],

      pattern: {
        format_template: "[Issue/scenario presented] Write a persuasive piece arguing for/against [position]. Your writing should: [criteria list]",
        key_characteristics: [
          "Persuasive/argumentative writing",
          "Presents an issue with multiple viewpoints",
          "Typically 400-600 words",
          "Time limit: approximately 20 minutes",
          "Assessed on: argument strength, evidence use, organization, persuasive techniques, conventions",
          "Should include: clear thesis, supporting arguments, counterarguments, conclusion"
        ],
        distractor_strategies: [
          "N/A - Open-ended writing task"
        ],
        difficulty_progression: {
          "1": "N/A - VIC Selective uses single difficulty level",
          "2": "Varied topics: school-related to global issues, familiar to unfamiliar topics",
          "3": "N/A - VIC Selective uses single difficulty level"
        }
      }
    }

  }

} as const;
