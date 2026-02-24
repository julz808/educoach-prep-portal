// ACER Scholarship (Year 7 Entry) - Curriculum Data V2
// Created: February 4, 2026

import type { SubSkillExamplesDatabase } from './types';

/**
 * ACER Scholarship Test - Complete Sub-Skill Examples
 *
 * Sections:
 * - Mathematics (8 sub-skills, 16 examples)
 * - Humanities (8 sub-skills, 22 examples)
 * - Written Expression (2 sub-skills, 2 prompts)
 *
 * Total: 18 sub-skills, 40 examples/prompts
 */
export const ACER_SUB_SKILLS: SubSkillExamplesDatabase = {

  // ============================================
  // ACER SCHOLARSHIP (YEAR 7 ENTRY) - MATHEMATICS
  // ============================================

  "ACER Scholarship (Year 7 Entry) - Mathematics": {

    // SUB-SKILL 1: Set Theory & Venn Diagrams
    "Set Theory & Venn Diagrams": {
      description: "Understanding set relationships, intersections, unions, and using set notation to solve problems",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [1, 2, 3],
      question_format: "Text-based questions about overlapping groups using set relationships and inclusion-exclusion principle",

      examples: [
        {
          difficulty: 1,
          question_text: "A class survey shows:\n• 18 students play soccer\n• 12 students play basketball\n• 7 students play both soccer and basketball\n• 5 students play neither sport\n\nHow many students are in the class?",
          answer_options: [
            "A) 28",
            "B) 30",
            "C) 35",
            "D) 42"
          ],
          correct_answer: "A",
          explanation: "Students who play only soccer = 18 - 7 = 11. Students who play only basketball = 12 - 7 = 5. Total = 11 (only soccer) + 5 (only basketball) + 7 (both) + 5 (neither) = 28 students.",
          distractor_strategy: "B adds 18+12 without removing overlap; C is 18+12+5 ignoring overlap; D is 18+12+7+5 counting both sports twice",
          characteristics: [
            "Two-set problem with overlap",
            "Real-world context (class survey)",
            "Requires understanding of overlap/intersection",
            "Must account for 'neither' category",
            "Tests set addition with inclusion-exclusion principle"
          ],
          requires_visual: false
        },
        {
          difficulty: 1,
          question_text: "Set A = {2, 4, 6, 8, 10} and Set B = {1, 2, 3, 4, 5}.\n\nWhat is A ∩ B (the intersection of A and B)?",
          answer_options: [
            "A) {2, 4}",
            "B) {1, 2, 3, 4, 5, 6, 8, 10}",
            "C) {6, 8, 10}",
            "D) {1, 3, 5}"
          ],
          correct_answer: "A",
          explanation: "The intersection A ∩ B contains only elements that appear in BOTH sets. The numbers 2 and 4 are the only numbers that appear in both Set A and Set B.",
          distractor_strategy: "B is the union (all elements); C is only in A; D is only in B",
          characteristics: [
            "Basic set notation",
            "Understanding intersection concept",
            "Identifying common elements",
            "Simple number sets",
            "Tests fundamental set theory"
          ],
          requires_visual: false
        },
        {
          difficulty: 2,
          question_text: "In a library, there are 60 books on a special display:\n• 35 books are fiction\n• 28 books are hardcover\n• 15 books are both fiction and hardcover\n\nHow many books on the display are neither fiction nor hardcover?",
          answer_options: [
            "A) 8",
            "B) 12",
            "C) 17",
            "D) 25"
          ],
          correct_answer: "B",
          explanation: "Using the inclusion-exclusion principle:\n• Books that are fiction OR hardcover = 35 + 28 - 15 = 48\n• Books that are neither = Total - (fiction OR hardcover) = 60 - 48 = 12 books.",
          distractor_strategy: "A is from incorrect subtraction; C is 35-28+10 (wrong formula); D is 60-35 (ignoring hardcover)",
          characteristics: [
            "Two-set problem with 'neither' category",
            "Real-world context (library books)",
            "Requires inclusion-exclusion principle",
            "Tests understanding of complement of union",
            "Multiple solution paths possible"
          ],
          requires_visual: false
        },
        {
          difficulty: 2,
          question_text: "In a school of 100 students:\n• 45 students study French\n• 38 students study Spanish\n• 12 students study both French and Spanish\n\nHow many students study neither French nor Spanish?",
          answer_options: [
            "A) 17",
            "B) 29",
            "C) 33",
            "D) 71"
          ],
          correct_answer: "B",
          explanation: "Students studying at least one language = 45 + 38 - 12 = 71. Students studying neither = 100 - 71 = 29 students.",
          distractor_strategy: "A is 45-38+10 (wrong calculation); C is 45-12 (only French overlap); D is students WITH languages, not without",
          characteristics: [
            "Inclusion-exclusion with larger numbers",
            "Real-world language context",
            "Tests complement understanding",
            "Common error: confusing 'with' and 'without'"
          ],
          requires_visual: false
        },
        {
          difficulty: 3,
          question_text: "In a group of 80 Year 7 students:\n• 42 students like pizza\n• 35 students like burgers\n• 28 students like pasta\n• 15 students like both pizza and burgers\n• 10 students like both burgers and pasta\n• 8 students like both pizza and pasta\n• 5 students like all three foods\n\nHow many students like at least one of these foods?",
          answer_options: [
            "A) 62",
            "B) 67",
            "C) 72",
            "D) 77"
          ],
          correct_answer: "D",
          explanation: "Using the inclusion-exclusion principle for three sets:\n|Pizza ∪ Burgers ∪ Pasta| = 42 + 35 + 28 - 15 - 10 - 8 + 5 = 77 students.\nFormula: Add all three sets, subtract the pairwise overlaps (counted twice), then add back the triple overlap (subtracted too many times).",
          distractor_strategy: "A forgets to add back triple overlap; B miscounts one overlap; C forgets to add triple overlap back after subtracting",
          characteristics: [
            "Three-set problem",
            "Complex inclusion-exclusion principle",
            "Multiple overlaps to track",
            "Requires systematic approach",
            "Tests advanced set theory"
          ],
          requires_visual: false
        }
      ],

      pattern: {
        format_template: "[Real-world scenario with overlapping groups] + [Question about counting or identifying elements in specific regions/categories]",
        key_characteristics: [
          "Text-based set problems using real-world contexts",
          "Multiple overlapping categories or groups",
          "Varied contexts: sports teams, hobbies, school subjects, food preferences, animal types, book genres, etc.",
          "Questions about intersections (both), unions (at least one), complements (neither), or specific set operations",
          "Can use set notation (∩, ∪, A, B) or purely word-based descriptions"
        ],
        distractor_strategies: [
          "Adding without accounting for overlap (inclusion-exclusion errors)",
          "Confusing 'and' (intersection) with 'or' (union)",
          "Using wrong total or forgetting 'neither' category",
          "Calculation errors in multi-step problems",
          "Reversing complement (counting those WITH attribute instead of WITHOUT)"
        ],
        difficulty_progression: {
          "1": "Simple 2-set problems with clear overlap; direct counting or basic set notation",
          "2": "2-set problems with 'neither' category requiring inclusion-exclusion principle",
          "3": "3-set problems with multiple overlaps; requires systematic approach to track all intersections"
        }
      }
    },

    // SUB-SKILL 2: Probability
    "Probability": {
      description: "Calculating probabilities of events, understanding outcomes, and working with simple probability scenarios",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [1, 2, 3],
      question_format: "Word problems involving probability calculations with everyday scenarios",

      examples: [
        {
          difficulty: 2,
          question_text: "Michael has 7 green balls and 3 yellow balls in a box, totaling 10 balls. Suppose Michael removes one yellow ball from the box. If he then picks another ball without looking, what is the probability that it will be green?",
          answer_options: [
            "A) seven chances in nine",
            "B) seven chances in ten",
            "C) six chances in nine",
            "D) three chances in nine"
          ],
          correct_answer: "A",
          explanation: "After removing 1 yellow ball, there are 7 green balls and 2 yellow balls left (9 balls total). The probability is 7/9.",
          distractor_strategy: "Original total (7/10), reduced green (6/9), and wrong numerator (3/9)",
          characteristics: [
            "Two-step problem (removal then selection)",
            "Requires updating total after removal",
            "Answers given in words, not fractions",
            "Everyday scenario (balls in a box)",
            "Simple fraction probability"
          ],
          requires_visual: false
        },
        {
          difficulty: 2,
          question_text: "In a dart board game, a player is allowed to throw 2 darts. The dartboard has concentric circles with values 1, 2, 3, and 5. What is the probability that the sum of scores in 2 throws is less than 5?",
          answer_options: [
            "A) ¼",
            "B) ½",
            "C) 3/8",
            "D) 1/16"
          ],
          correct_answer: "C",
          explanation: "Possible scores are 1, 2, 3, 5. Total combinations = 4 × 4 = 16. Combinations with sum <5: (1,1), (1,2), (2,1), (1,3), (2,2), (3,1) = 6 combinations. Probability = 6/16 = 3/8.",
          distractor_strategy: "Simple fractions like ¼, ½ that might come from incorrect counting; 1/16 from confusing probability concepts",
          characteristics: [
            "Requires listing all favorable outcomes",
            "Multiple throw scenario",
            "Compound probability",
            "Sum condition rather than single outcome",
            "Answers in fraction notation"
          ],
          requires_visual: false
        }
      ],

      pattern: {
        format_template: "[Scenario with known outcomes] + [Event occurs] + [Calculate probability of specific outcome]",
        key_characteristics: [
          "Everyday contexts (balls, darts, spinners)",
          "Clear total number of possible outcomes",
          "Single or compound events",
          "Answers as fractions or word phrases",
          "May require multi-step thinking"
        ],
        distractor_strategies: [
          "Using original totals instead of updated totals",
          "Confusing numerator and denominator",
          "Missing some favorable outcomes in compound events",
          "Using wrong total number of outcomes",
          "Simplifying fractions incorrectly"
        ],
        difficulty_progression: {
          "1": "Single-step probability with clear outcomes",
          "2": "Two-step problems or compound events",
          "3": "Complex scenarios with multiple conditions or dependent events"
        }
      }
    },

    // SUB-SKILL 3: Geometry - Perimeter & Area
    "Geometry - Perimeter & Area": {
      description: "Calculating perimeters and areas of shapes, working with shape properties and relationships",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [1, 2, 3],
      question_format: "Problems involving calculating areas, perimeters, or using one to find the other",

      examples: [
        {
          difficulty: 2,
          question_text: "A square has the same perimeter as a rectangle with sides 27 cm and 21 cm. Find the area of the square.",
          answer_options: [
            "A) 676 sq cm",
            "B) 625 sq cm",
            "C) 576 sq cm",
            "D) 400 sq cm"
          ],
          correct_answer: "C",
          explanation: "Perimeter of rectangle = 2(27+21) = 96 cm. So perimeter of square = 96 cm. One side of square = 96/4 = 24 cm. Area = 24 × 24 = 576 sq cm.",
          distractor_strategy: "Nearby perfect squares (25²=625, 26²=676, 20²=400) that might result from calculation errors",
          characteristics: [
            "Multi-step problem",
            "Connects perimeter and area",
            "Requires working between two shapes",
            "All answers are perfect squares",
            "Units provided (sq cm)"
          ],
          requires_visual: false
        },
        {
          difficulty: 2,
          question_text: "Olivia uses a square frame (1 metre × 1 metre) to estimate the number of tulips in her garden. The garden measures 20 meters × 8 meters. She throws the square frame onto the garden and counts 10 tulips inside the frame. What is Olivia's estimate of the total number of tulips in her garden?",
          answer_options: [
            "A) 1600",
            "B) 1800",
            "C) 2000",
            "D) 2500"
          ],
          correct_answer: "A",
          explanation: "Area of frame = 1 m². Area of garden = 20 × 8 = 160 m². Number of frames that fit = 160. Estimated tulips = 10 × 160 = 1600.",
          distractor_strategy: "Numbers close to correct answer that might result from calculation errors (adding instead of multiplying, using dimensions incorrectly)",
          characteristics: [
            "Real-world application (sampling and estimation)",
            "Area calculation as intermediate step",
            "Multiplication of areas",
            "Large numbers as answers",
            "Practical problem-solving context"
          ],
          requires_visual: false
        },
        {
          difficulty: 3,
          question_text: "Olivia uses a square frame (1 metre × 1 metre) to estimate tulips. She throws the frame onto her back garden and counts 12 tulips. She estimates 360 tulips total. The back garden is rectangular. Which could be the size of Olivia's back garden?",
          answer_options: [
            "A) 2 meters × 8 meters",
            "B) 3 meters × 5 meters",
            "C) 5 meters × 6 meters",
            "D) 6 meters × 8 meters"
          ],
          correct_answer: "C",
          explanation: "Tulips per m² = 12. Estimated area = 360/12 = 30 m². Testing options: (A) 16 m², (B) 15 m², (C) 30 m², (D) 48 m². Only C gives 30 m².",
          distractor_strategy: "Areas that are factors or multiples of numbers in the problem, requiring testing each option",
          characteristics: [
            "Reverse problem (given area, find dimensions)",
            "Must test multiple options",
            "Requires division then multiplication",
            "Real-world estimation context",
            "Working backwards from result"
          ],
          requires_visual: false
        }
      ],

      pattern: {
        format_template: "[Shape description with some measurements] + [Calculate missing measurement or area/perimeter]",
        key_characteristics: [
          "Connects different properties (perimeter ↔ area)",
          "May involve multiple shapes",
          "Real-world applications common",
          "Requires formula knowledge",
          "Often multi-step solutions"
        ],
        distractor_strategies: [
          "Results from using wrong formula",
          "Nearby values from calculation errors",
          "Perfect squares that look plausible",
          "Confusing perimeter and area",
          "Using original measurements instead of derived ones"
        ],
        difficulty_progression: {
          "1": "Direct application of area or perimeter formula",
          "2": "Two-step problems connecting perimeter and area",
          "3": "Reverse problems or estimation with multiple steps"
        }
      }
    },

    // SUB-SKILL 4: Spatial Reasoning - Reflections & Transformations
    "Spatial Reasoning - Reflections & Transformations": {
      description: "Understanding coordinate reflections, rotations, and transformations on a grid",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [1, 2, 3],
      question_format: "Coordinate geometry questions about reflections and transformations using (x, y) points",

      examples: [
        {
          difficulty: 1,
          question_text: "Point A is located at coordinates (4, 2).\n\nIf point A is reflected across the y-axis, what are the new coordinates?",
          answer_options: [
            "A) (-4, 2)",
            "B) (4, -2)",
            "C) (-4, -2)",
            "D) (2, 4)"
          ],
          correct_answer: "A",
          explanation: "When reflecting across the y-axis, the x-coordinate changes to its opposite while the y-coordinate stays the same. So (4, 2) becomes (-4, 2).",
          distractor_strategy: "B reflects across x-axis; C reflects across both; D swaps coordinates",
          characteristics: [
            "Basic coordinate reflection",
            "Y-axis reflection rule",
            "Simple positive coordinates",
            "Tests understanding of axis reflection",
            "Year 7 appropriate"
          ],
          requires_visual: false
        },
        {
          difficulty: 1,
          question_text: "Point B has coordinates (3, 5).\n\nIf point B is reflected across the x-axis, what are the new coordinates?",
          answer_options: [
            "A) (-3, 5)",
            "B) (3, -5)",
            "C) (-3, -5)",
            "D) (5, 3)"
          ],
          correct_answer: "B",
          explanation: "When reflecting across the x-axis, the y-coordinate changes to its opposite while the x-coordinate stays the same. So (3, 5) becomes (3, -5).",
          distractor_strategy: "A reflects across y-axis; C reflects across both; D swaps coordinates",
          characteristics: [
            "X-axis reflection",
            "Mirror concept in coordinates",
            "Simple rule application",
            "Fundamental transformation"
          ],
          requires_visual: false
        },
        {
          difficulty: 2,
          question_text: "A triangle has vertices at P(2, 1), Q(5, 1), and R(5, 4).\n\nIf the triangle is reflected across the x-axis, what are the new coordinates of vertex R?",
          answer_options: [
            "A) (5, -4)",
            "B) (-5, 4)",
            "C) (5, 4)",
            "D) (-5, -4)"
          ],
          correct_answer: "A",
          explanation: "Reflecting across the x-axis keeps the x-coordinate the same and changes the y-coordinate to its opposite. So R(5, 4) becomes (5, -4).",
          distractor_strategy: "B reflects across y-axis; C is unchanged; D reflects across both axes",
          characteristics: [
            "Reflection with shapes",
            "Triangle context",
            "Multiple vertices given as context",
            "Focus on one vertex transformation"
          ],
          requires_visual: false
        },
        {
          difficulty: 2,
          question_text: "The word 'MOM' is written horizontally. Which letter looks the same when reflected across a vertical mirror line?",
          answer_options: [
            "A) Only M",
            "B) Only O",
            "C) Both M and O",
            "D) None of them"
          ],
          correct_answer: "C",
          explanation: "Both M and O have vertical symmetry, meaning they look the same when reflected across a vertical line down their middle. These letters are symmetrical.",
          distractor_strategy: "Focuses on understanding symmetry vs reflection; tests visual reasoning without needing actual image",
          characteristics: [
            "Symmetry concept",
            "Letter reflections",
            "Vertical line of symmetry",
            "Real-world application",
            "Pattern recognition"
          ],
          requires_visual: false
        },
        {
          difficulty: 3,
          question_text: "A point starts at (2, 3). It is first reflected across the x-axis, then the result is reflected across the y-axis.\n\nWhat are the final coordinates?",
          answer_options: [
            "A) (2, 3)",
            "B) (-2, -3)",
            "C) (2, -3)",
            "D) (-2, 3)"
          ],
          correct_answer: "B",
          explanation: "Step 1: Reflect (2, 3) across x-axis → (2, -3).\nStep 2: Reflect (2, -3) across y-axis → (-2, -3).\nBoth coordinates change sign after the two reflections.",
          distractor_strategy: "A is original; C is after first reflection only; D reverses the order",
          characteristics: [
            "Multi-step transformation",
            "Sequential reflections",
            "Tests careful tracking of changes",
            "More complex reasoning",
            "Appropriate for advanced Year 7"
          ],
          requires_visual: false
        }
      ],

      pattern: {
        format_template: "[Point or shape with coordinates] + [Transformation described] + [What are the new coordinates?]",
        key_characteristics: [
          "Coordinate geometry approach to transformations",
          "Reflections across x-axis, y-axis, or both",
          "Can include shapes (triangles, rectangles) but focus on vertices",
          "May include symmetry concepts with letters or words",
          "Sequential transformations for higher difficulty",
          "Varied contexts: geometry grids, real-world applications of symmetry"
        ],
        distractor_strategies: [
          "Reflecting across wrong axis (x instead of y or vice versa)",
          "Swapping coordinates instead of negating",
          "Reflecting across both axes when only one is specified",
          "Keeping point unchanged",
          "In multi-step: applying transformations in wrong order or missing a step"
        ],
        difficulty_progression: {
          "1": "Single reflection across x-axis or y-axis with positive coordinates",
          "2": "Reflections with context (shape vertices, symmetry of letters); mixed positive/negative coordinates",
          "3": "Sequential transformations (reflect then reflect again); reflections with rotation concepts"
        }
      }
    },

    // SUB-SKILL 5: Spatial Reasoning - 3D Visualization
    "Spatial Reasoning - 3D Visualization": {
      description: "Calculating volume and surface area of 3D shapes, counting cubes, and understanding properties of 3D objects",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [1, 2, 3],
      question_format: "Text-based questions about volume, surface area, and counting in 3D structures",

      examples: [
        {
          difficulty: 1,
          question_text: "A rectangular box has dimensions 4 cm × 3 cm × 2 cm.\n\nHow many small cubes of side 1 cm can fit inside this box?",
          answer_options: [
            "A) 9",
            "B) 12",
            "C) 18",
            "D) 24"
          ],
          correct_answer: "D",
          explanation: "Number of cubes = length × width × height = 4 × 3 × 2 = 24 small cubes can fit inside.",
          distractor_strategy: "A adds dimensions (4+3+2); B uses only two dimensions (4×3); C is 3×6",
          characteristics: [
            "Volume calculation through counting",
            "3D space understanding",
            "Multiplication of dimensions",
            "Basic volume concept",
            "Year 7 appropriate"
          ],
          requires_visual: false
        },
        {
          difficulty: 1,
          question_text: "A cube has edges of 5 cm.\n\nWhat is the volume of the cube?",
          answer_options: [
            "A) 15 cm³",
            "B) 25 cm³",
            "C) 75 cm³",
            "D) 125 cm³"
          ],
          correct_answer: "D",
          explanation: "Volume of a cube = edge × edge × edge = 5 × 5 × 5 = 125 cm³.",
          distractor_strategy: "A is 5×3; B is 5²; C is 5×5×3; D is correct",
          characteristics: [
            "Cube volume formula",
            "Cubing a number",
            "Basic 3D calculation",
            "Standard formula application"
          ],
          requires_visual: false
        },
        {
          difficulty: 2,
          question_text: "A cube is made from 27 smaller cubes (3×3×3). If the large cube is painted red on all faces, how many of the small cubes will have exactly 2 faces painted red?",
          answer_options: [
            "A) 6",
            "B) 8",
            "C) 12",
            "D) 18"
          ],
          correct_answer: "C",
          explanation: "Small cubes with exactly 2 painted faces are located on the edges but not at corners. A 3×3×3 cube has 12 edges, and each edge has 1 middle cube (not counting corners). So 12 cubes have exactly 2 faces painted.",
          distractor_strategy: "A is face centers; B is corner cubes; D is edge + face cubes",
          characteristics: [
            "3D cube problem",
            "Logical reasoning about structure",
            "Counting specific positioned cubes",
            "Understanding edge vs corner vs face cubes",
            "Classic painted cube problem"
          ],
          requires_visual: false
        },
        {
          difficulty: 2,
          question_text: "A rectangular prism has dimensions 6 cm × 4 cm × 3 cm.\n\nWhat is the total surface area of this prism?",
          answer_options: [
            "A) 72 cm²",
            "B) 84 cm²",
            "C) 108 cm²",
            "D) 144 cm²"
          ],
          correct_answer: "C",
          explanation: "Surface area = 2(lw + lh + wh) = 2(6×4 + 6×3 + 4×3) = 2(24 + 18 + 12) = 2(54) = 108 cm².\nAlternatively: Top/Bottom: 2(6×4)=48, Front/Back: 2(6×3)=36, Sides: 2(4×3)=24. Total = 48+36+24 = 108 cm².",
          distractor_strategy: "A is volume; B is one calculation error; D doubles the volume",
          characteristics: [
            "Surface area calculation",
            "3D shape properties",
            "Multiple face areas",
            "Formula application",
            "Tests systematic approach"
          ],
          requires_visual: false
        },
        {
          difficulty: 3,
          question_text: "A water tank is shaped like a rectangular prism with dimensions 10 m × 6 m × 4 m. It is currently filled to 75% of its capacity.\n\nHow many cubic meters of water are currently in the tank?",
          answer_options: [
            "A) 60 m³",
            "B) 120 m³",
            "C) 180 m³",
            "D) 240 m³"
          ],
          correct_answer: "C",
          explanation: "Full capacity = 10 × 6 × 4 = 240 m³. Water in tank = 75% of 240 = 0.75 × 240 = 180 m³.",
          distractor_strategy: "A is 25% (wrong percentage); B is 50%; D is full capacity (100%)",
          characteristics: [
            "Volume with percentage",
            "Real-world application",
            "Two-step problem",
            "Percentage calculation",
            "Practical context"
          ],
          requires_visual: false
        },
        {
          difficulty: 3,
          question_text: "On a standard six-sided die, opposite faces always add up to 7.\n\nIf you can see three faces of a die showing 2, 3, and 4, what is the sum of the three hidden faces?",
          answer_options: [
            "A) 9",
            "B) 12",
            "C) 15",
            "D) 18"
          ],
          correct_answer: "B",
          explanation: "A die has six faces numbered 1 to 6. The sum of all faces = 1+2+3+4+5+6 = 21.\nVisible faces: 2 + 3 + 4 = 9\nHidden faces: 21 - 9 = 12",
          distractor_strategy: "A is sum of visible faces; C is average × sides; D is 3×6",
          characteristics: [
            "Dice properties",
            "Logical reasoning",
            "Sum relationships",
            "Problem-solving",
            "Tests known 3D object properties"
          ],
          requires_visual: false
        }
      ],

      pattern: {
        format_template: "[3D shape with dimensions] + [Question about volume, surface area, or logical counting problem]",
        key_characteristics: [
          "Text-based 3D problems using formulas and logical reasoning",
          "Volume and surface area calculations for cubes, rectangular prisms, and simple shapes",
          "Painted cube problems requiring spatial logic",
          "Real-world applications: water tanks, boxes, containers",
          "Properties of standard objects (dice faces sum to 7, opposite faces)",
          "Varied contexts: storage, capacity, construction, games, puzzles"
        ],
        distractor_strategies: [
          "Using area formula when volume is needed (or vice versa)",
          "Calculation errors (adding dimensions instead of multiplying, using only 2 of 3 dimensions)",
          "In painted cube problems: confusing corner/edge/face cube counts",
          "Percentage errors in capacity problems",
          "In dice problems: using wrong total or wrong opposite-face rule"
        ],
        difficulty_progression: {
          "1": "Direct volume calculations; simple cube counting; basic formulas",
          "2": "Surface area; painted cube logic; two-step problems",
          "3": "Problems with percentages; multi-step reasoning; dice logic; combining volume with other concepts"
        }
      }
    },

    // SUB-SKILL 6: Fractions & Number Lines
    "Fractions & Number Lines": {
      description: "Working with fractions on number lines, calculating differences, and understanding fraction relationships",
      visual_required: true,
      image_type: "SVG",
      llm_appropriate: true,
      difficulty_range: [1, 2, 3],
      question_format: "Number line problems involving finding values, calculating differences between fractions",

      examples: [
        {
          difficulty: 2,
          question_text: "On a number line marked from 0 to 1, points X and Y are marked. Point X is at 1/5 and point Y is at 3/5. What is the distance between X and Y?",
          answer_options: [
            "A) 1/5",
            "B) 2/5",
            "C) 3/5",
            "D) 4/5"
          ],
          correct_answer: "B",
          explanation: "Distance = Y - X = 3/5 - 1/5 = 2/5.",
          distractor_strategy: "Individual point values or calculation errors",
          characteristics: [
            "Number line with fractions",
            "Fraction subtraction",
            "Visual representation aids understanding",
            "Same denominator simplifies calculation"
          ],
          requires_visual: true,
          llm_visual_appropriate: true,  // Number lines with fraction marks are straightforward for LLM - simple geometric layout
          visual_prompt: `Generate a horizontal number line from 0 to 1:
- Mark 0 on the left end, 1 on the right end
- Divide into 5 equal parts (fifths)
- Mark and label point X at 1/5
- Mark and label point Y at 3/5
- Use clear tick marks for all fifths (0, 1/5, 2/5, 3/5, 4/5, 1)
- Highlight points X and Y with dots
- Simple, clean design

Visual type: coordinate_grid (SVG)
Dimensions: 400x150px`
        },
        {
          difficulty: 2,
          question_text: "On a number line from 0 to 1, point A is at 2/8 and point B is at 6/8. What fraction is exactly halfway between A and B?",
          answer_options: [
            "A) 1/4",
            "B) 3/8",
            "C) 1/2",
            "D) 5/8"
          ],
          correct_answer: "C",
          explanation: "Halfway point = (2/8 + 6/8) ÷ 2 = 8/8 ÷ 2 = 4/8 = 1/2.",
          distractor_strategy: "Other fractions between A and B, or calculation errors",
          characteristics: [
            "Finding midpoint of fractions",
            "Fraction addition and division",
            "Requires simplification",
            "Visual number line helps"
          ],
          requires_visual: true,
          llm_visual_appropriate: true,  // Number lines are simple for LLM to generate
          visual_prompt: `Generate a horizontal number line from 0 to 1:
- Mark 0 on the left, 1 on the right
- Divide into 8 equal parts (eighths)
- Mark and label point A at 2/8
- Mark and label point B at 6/8
- Show all eighth marks (0, 1/8, 2/8... 8/8)
- Highlight A and B with dots
- Clean, educational design

Visual type: coordinate_grid (SVG)
Dimensions: 400x150px`
        },
        {
          difficulty: 2,
          question_text: "Which fraction is greater: 3/7 or 5/11?",
          answer_options: [
            "A) 3/7",
            "B) 5/11",
            "C) They are equal",
            "D) Cannot be determined"
          ],
          correct_answer: "B",
          explanation: "Convert to common denominator 77: 3/7 = 33/77, 5/11 = 35/77. Since 35/77 > 33/77, we have 5/11 > 3/7. So 5/11 is greater.",
          distractor_strategy: "Assuming larger numerators or denominators automatically mean larger fractions",
          characteristics: [
            "Fraction comparison",
            "Common denominator method",
            "Can be solved without visual",
            "Tests understanding of fraction magnitude"
          ],
          requires_visual: false
        }
      ],

      pattern: {
        format_template: "[Number line with some values marked] + [Find unknown value or calculate difference]",
        key_characteristics: [
          "Visual number line representation",
          "Fractions as primary values",
          "May require finding common denominators",
          "Often involves equivalent fractions",
          "Position and distance concepts"
        ],
        distractor_strategies: [
          "Fractions with wrong denominators",
          "Unsimplified answers when simplification is expected",
          "Reversed subtraction",
          "Estimation errors from visual position",
          "Common fractions that are visually plausible"
        ],
        difficulty_progression: {
          "1": "Reading marked values directly",
          "2": "Finding unknown values or simple differences",
          "3": "Multiple steps with simplification and conversion"
        }
      }
    },

    // SUB-SKILL 7: Logic Puzzles & Algebraic Reasoning
    "Logic Puzzles & Algebraic Reasoning": {
      description: "Solving logic puzzles with variables, balance problems, and systems of relationships",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [2, 3],
      question_format: "Multi-step logic puzzles with symbols representing unknowns, often requiring solving for variables",

      examples: [
        {
          difficulty: 2,
          question_text: "In a balance puzzle, 3 circles weigh the same as 2 squares. If one square weighs 12 grams, how much does one circle weigh?",
          answer_options: [
            "A) 6 grams",
            "B) 8 grams",
            "C) 9 grams",
            "D) 18 grams"
          ],
          correct_answer: "B",
          explanation: "If 3 circles = 2 squares, and 1 square = 12 grams, then 2 squares = 24 grams. So 3 circles = 24 grams, meaning 1 circle = 24 ÷ 3 = 8 grams.",
          distractor_strategy: "Results from incorrect operations (subtracting, adding, or wrong division)",
          characteristics: [
            "Balance/equation problem",
            "Proportional reasoning",
            "Two-step solution",
            "Tests algebraic thinking without algebra notation"
          ],
          requires_visual: false
        },
        {
          difficulty: 3,
          question_text: "A baker uses this recipe: 2 cups of flour + 3 eggs make 8 muffins. If the baker wants to make 24 muffins and has 6 cups of flour, how many eggs will be needed?",
          answer_options: [
            "A) 6 eggs",
            "B) 9 eggs",
            "C) 12 eggs",
            "D) 18 eggs"
          ],
          correct_answer: "B",
          explanation: "24 muffins is 3 times 8 muffins, so we need to triple the recipe. Original recipe: 2 cups flour + 3 eggs. Triple: 6 cups flour + 9 eggs. Since we have 6 cups of flour, we need 9 eggs.",
          distractor_strategy: "Results from incorrect scaling or adding instead of multiplying",
          characteristics: [
            "Ratio and proportion",
            "Scaling recipes",
            "Real-world application",
            "Requires identifying the multiplication factor"
          ],
          requires_visual: false
        },
        {
          difficulty: 3,
          question_text: "If ★ + ★ + ● = 14 and ★ + ● + ● = 16, what is the value of ★?",
          answer_options: [
            "A) 2",
            "B) 3",
            "C) 4",
            "D) 6"
          ],
          correct_answer: "C",
          explanation: "From 2★ + ● = 14 and ★ + 2● = 16. Subtract to get ★ - ● = -2, so ● = ★ + 2. Substitute: 2★ + (★ + 2) = 14, giving 3★ = 12, so ★ = 4. Check: If ★ = 4 then ● = 6, and 4 + 4 + 6 = 14 ✓, 4 + 6 + 6 = 16 ✓.",
          distractor_strategy: "Small integers that might seem reasonable from incorrect solving",
          characteristics: [
            "System of equations",
            "Symbol substitution",
            "Requires elimination or substitution method",
            "Tests algebraic reasoning"
          ],
          requires_visual: false
        }
      ],

      pattern: {
        format_template: "[Visual diagram with shapes/symbols representing unknowns] + [Some relationships or values given] + [Solve for specific unknown]",
        key_characteristics: [
          "Symbols represent unknowns",
          "Multiple levels or relationships",
          "May require solving equations",
          "Sequential reasoning often needed",
          "Visual representation of algebraic concepts"
        ],
        distractor_strategies: [
          "Results from arithmetic errors",
          "Forgetting to include all terms",
          "Using wrong variable value",
          "Off-by-one errors",
          "Confusing different variables"
        ],
        difficulty_progression: {
          "1": "Direct substitution with given values",
          "2": "Solving simple equations with one unknown",
          "3": "Multi-step problems with multiple unknowns"
        }
      }
    },

    // SUB-SKILL 8: Data Interpretation & Applied Mathematics
    "Data Interpretation & Applied Mathematics": {
      description: "Reading and interpreting tables, charts, and graphs to solve real-world problems",
      visual_required: true,
      image_type: "HTML",  // HTML tables for data tables, SVG for charts/graphs
      llm_appropriate: true,
      difficulty_range: [1, 2, 3],
      question_format: "Word problems with data tables, requiring extraction of information and multi-step calculations",

      examples: [
        {
          difficulty: 2,
          question_text: "A veterinarian uses pills to treat animals. The table shows daily pill requirements:\n\n| Animal | Base Dose | Per kg |\n|---------|-----------|--------|\n| Cat | 1 | 1 |\n| Rabbit | 0.5 | 0.5 |\n| Small dog | 1.5 | 1 |\n| Large dog | 2 | 1.5 |\n\nChloe has a 7 kg cat and a 4 kg rabbit. What is the total number of daily pills that Chloe needs for her pets?",
          answer_options: [
            "A) 9.5",
            "B) 10",
            "C) 10.5",
            "D) 12"
          ],
          correct_answer: "C",
          explanation: "Cat: 1 + (1 × 7) = 8 pills. Rabbit: 0.5 + (0.5 × 4) = 2.5 pills. Total = 8 + 2.5 = 10.5 pills.",
          distractor_strategy: "Results from calculation errors, using wrong formula, or missing one animal",
          characteristics: [
            "Table reading",
            "Formula application (base + per-kg × weight)",
            "Decimal calculations",
            "Multi-animal calculation",
            "Real-world scenario"
          ],
          requires_visual: true,
          llm_visual_appropriate: true,  // HTML tables are perfectly suited for LLM generation
          visual_prompt: `Generate an HTML table showing veterinarian pill dosage:

Headers: Animal | Base Dose | Per kg
Rows:
- Cat | 1 | 1
- Rabbit | 0.5 | 0.5
- Small dog | 1.5 | 1
- Large dog | 2 | 1.5

Style: Clean grid with borders, header row with light gray background
Formula shown above table: "Daily pills = Base Dose + (Per kg × animal weight)"

Visual type: table (HTML)
Dimensions: 400x200px`
        },
        {
          difficulty: 2,
          question_text: "Using the same table, Oliver has a 6 kg small dog. For how many days would a bottle of 60 pills last?",
          answer_options: [
            "A) 5 days",
            "B) 6 days",
            "C) 7 days",
            "D) 8 days"
          ],
          correct_answer: "D",
          explanation: "Small dog: 1.5 + (1 × 6) = 7.5 pills per day. Days = 60 / 7.5 = 8 days.",
          distractor_strategy: "Results from division errors or using wrong daily amount",
          characteristics: [
            "Two-step problem (calculate daily amount, then divide)",
            "Division with decimals",
            "Resource consumption problem",
            "Requires extracting correct formula from table"
          ],
          requires_visual: true,
          llm_visual_appropriate: true,  // Same table as above
          visual_prompt: "Use the same table from the previous question."
        },
        {
          difficulty: 2,
          question_text: "John has 80 books. A pie chart shows the distribution by degrees:\n- Story books = 180°\n- Comic books = 90°\n- Poem books = 45°\n- Puzzle books = 45°\n\nHow many comic books does John have?",
          answer_options: [
            "A) 10",
            "B) 15",
            "C) 20",
            "D) 25"
          ],
          correct_answer: "C",
          explanation: "Comic books represent 90° out of 360° total, which is ¼ of the circle. Number = 80 × ¼ = 20 books.",
          distractor_strategy: "Results from using wrong fraction or calculation errors",
          characteristics: [
            "Pie chart interpretation",
            "Angle to fraction conversion",
            "Percentage of total calculation",
            "Visual data representation"
          ],
          requires_visual: true,
          llm_visual_appropriate: true,  // Pie charts with labeled segments are within LLM SVG generation capabilities
          visual_prompt: `Generate a pie chart showing John's 80 books:
- Story books: 180° (50%, half the circle) - Blue (#3498DB)
- Comic books: 90° (25%, quarter) - Red (#E74C3C)
- Poem books: 45° (12.5%) - Green (#27AE60)
- Puzzle books: 45° (12.5%) - Orange (#E67E22)

Label each segment with category name and degree measurement.
Include legend showing colors and categories.
Title: "John's Book Collection (80 books total)"

Visual type: pie_chart (SVG)
Dimensions: 350x350px`
        },
        {
          difficulty: 2,
          question_text: "Using the same pie chart, approximately how many more comic books does John have than poem books?",
          answer_options: [
            "A) 20",
            "B) 30",
            "C) 15",
            "D) 10"
          ],
          correct_answer: "D",
          explanation: "Comic books: 90° → ¼ × 80 = 20 books. Poem books: 45° → 1/8 × 80 = 10 books. Difference = 20 - 10 = 10 books.",
          distractor_strategy: "Actual count of one category or calculation errors",
          characteristics: [
            "Comparative calculation",
            "Requires calculating two values then finding difference",
            "Builds on previous pie chart understanding"
          ],
          requires_visual: true,
          llm_visual_appropriate: true,  // Same pie chart as above
          visual_prompt: "Use the same pie chart from the previous question."
        }
      ],

      pattern: {
        format_template: "[Data table/chart/graph] + [Real-world scenario] + [Calculate specific value or comparison]",
        key_characteristics: [
          "Tables, pie charts, or graphs provided",
          "Real-world contexts (pets, books, measurements)",
          "Multi-step solutions common",
          "Formula application from tables",
          "May involve decimals or fractions"
        ],
        distractor_strategies: [
          "Using wrong row/column from table",
          "Calculation errors in multi-step problems",
          "Missing a step in the calculation",
          "Using wrong mathematical operation",
          "Misreading chart angles or proportions"
        ],
        difficulty_progression: {
          "1": "Direct reading from table or chart",
          "2": "One or two calculations using table data",
          "3": "Complex multi-step problems with multiple data sources"
        }
      }
    }
  },

  // ============================================
  // ACER SCHOLARSHIP (YEAR 7 ENTRY) - HUMANITIES
  // ============================================

  "ACER Scholarship (Year 7 Entry) - Humanities": {

    // SUB-SKILL 1: Main Idea & Theme Identification
    "Main Idea & Theme Identification": {
      description: "Identifying central ideas, themes, and key messages in passages",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [1, 2, 3],
      question_format: "Questions asking about the main point, central theme, or primary purpose of a passage",

      examples: [
        {
          difficulty: 2,
          question_text: "Read the passage and answer the question.\n\nPassage:\nSportsmanship in modern sports is built upon four essential elements: good form, the will to win, equity, and fairness. These principles have long been regarded as the foundation of athletic competition, embodying the spirit of respect and honor that should guide every athlete. Good form refers to displaying proper technique and gracious behavior, both in victory and defeat. The will to win represents the competitive drive that pushes athletes to excel. Equity ensures that all competitors have equal opportunities, while fairness demands that rules are followed and opponents are treated with respect. However, in today's sporting culture, which places enormous emphasis on winning at all costs, sportsmanship often takes a back seat to the pursuit of victory and fame.\n\nThe elements of sportsmanship are:",
          answer_options: [
            "A) good form",
            "B) willingness to win",
            "C) equity and fairness",
            "D) all of these"
          ],
          correct_answer: "D",
          explanation: "The passage states that the four elements of sportsmanship are good form, the will to win, equity and fairness.",
          distractor_strategy: "Individual elements that are correct but incomplete",
          characteristics: [
            "Passage-based comprehension",
            "Lists and categories",
            "Requires identifying all components",
            "Tests careful reading of details"
          ]
        },
        {
          difficulty: 2,
          question_text: "Read the passage and answer the question.\n\nPassage:\nReading a book is truly a journey. When we open the pages of a novel, we embark on adventures to new worlds and distant places without ever leaving our chairs. Through the power of words, we can explore ancient civilizations, travel to far-off galaxies, or walk through enchanted forests. Books transport us to times and places we could never physically visit, allowing us to experience life through the eyes of characters vastly different from ourselves. This magical quality of literature enriches our understanding of the world and broadens our perspectives in ways that no other medium can quite replicate.\n\nReading a book is a journey as...",
          answer_options: [
            "A) We see new places through books",
            "B) Reading about a place is cheaper than travel",
            "C) Reading is costly",
            "D) None of the above"
          ],
          correct_answer: "A",
          explanation: "The passage opens by stating that when we read, we take journeys into new worlds and places, and it emphasizes how books transport us to places we could never physically visit.",
          distractor_strategy: "Literal interpretations, tangential ideas, or unrelated concepts",
          characteristics: [
            "Metaphorical language",
            "Opening theme identification",
            "Understanding figurative meaning",
            "Complete passage provided"
          ]
        }
      ],

      pattern: {
        format_template: "[Passage] + [Question about main idea, theme, or central concept]",
        key_characteristics: [
          "Requires understanding overall message",
          "May involve categorization or listing",
          "Tests comprehension of key concepts",
          "Often asks about stated elements or themes"
        ],
        distractor_strategies: [
          "Partial information that's accurate but incomplete",
          "Details that are mentioned but not central",
          "Literal interpretations of figurative language",
          "Related but tangential ideas"
        ],
        difficulty_progression: {
          "1": "Explicitly stated main ideas",
          "2": "Themes requiring some synthesis",
          "3": "Implicit themes requiring inference"
        }
      }
    },

    // SUB-SKILL 2: Inference & Interpretation
    "Inference & Interpretation": {
      description: "Drawing conclusions, making inferences, and interpreting implicit information from text",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [2, 3],
      question_format: "Questions requiring reading between the lines and making logical deductions",

      examples: [
        {
          difficulty: 2,
          question_text: "Read the passage and answer the question.\n\nPassage:\nSportsmanship in modern sports is built upon four essential elements: good form, the will to win, equity, and fairness. These principles have long been regarded as the foundation of athletic competition, embodying the spirit of respect and honor that should guide every athlete. Good form refers to displaying proper technique and gracious behavior, both in victory and defeat. The will to win represents the competitive drive that pushes athletes to excel. Equity ensures that all competitors have equal opportunities, while fairness demands that rules are followed and opponents are treated with respect. However, in today's sporting culture, which places enormous emphasis on winning at all costs, sportsmanship often takes a back seat to the pursuit of victory and fame.\n\nWhy has sportsmanship taken a backseat today?",
          answer_options: [
            "A) Due to lack of balance between the elements",
            "B) Due to the emphasis on winning",
            "C) Due to drug abuse",
            "D) None of the above"
          ],
          correct_answer: "B",
          explanation: "The passage states that today's sporting culture places great importance on competition and winning at all costs, and thus sportsmanship takes a back seat to the pursuit of victory and fame.",
          distractor_strategy: "Related issues not mentioned in passage, or overgeneralized causes",
          characteristics: [
            "Cause and effect reasoning",
            "Understanding modern context",
            "Requires connecting stated facts to implied conclusions"
          ]
        },
        {
          difficulty: 3,
          question_text: "Read the passage and answer the question.\n\nPassage:\nDengue fever has long been a concern in tropical and subtropical regions around the world. In recent years, there has been a notable increase in reported cases of dengue in many countries. While this rise may initially appear alarming, health experts point out that the increase is not entirely due to the actual spread of the disease. A significant factor contributing to the higher numbers is the improvement in testing capabilities and changes in national practices for recording and reporting dengue cases. Many countries have implemented more comprehensive surveillance systems and better diagnostic tools, meaning that cases which might have gone undetected or unreported in the past are now being identified and documented. Additionally, increased public awareness has led more people to seek medical attention for dengue-like symptoms. Therefore, the rise in reported cases reflects both improved detection methods and genuine disease transmission.\n\nChoose the option that is correct about the rise in the number of dengue cases:",
          answer_options: [
            "A) rise in dengue is due to rise in tourism",
            "B) dengue is being tested and reported in vast numbers",
            "C) dengue is a communicable disease",
            "D) dengue spread is uncontrollable"
          ],
          correct_answer: "B",
          explanation: "The passage explains that the increase is partly due to changes in national practices to record and report dengue, improved testing capabilities, and better surveillance systems, meaning dengue is being tested and reported in vast numbers.",
          distractor_strategy: "True statements not relevant to the question, or unsupported claims",
          characteristics: [
            "Distinguishing between correlation and causation",
            "Understanding reporting vs. actual increase",
            "Requires careful reading of explanations"
          ]
        }
      ],

      pattern: {
        format_template: "[Passage with implicit information] + [Question requiring inference or interpretation]",
        key_characteristics: [
          "Answer not explicitly stated",
          "Requires logical deduction",
          "May involve cause-effect relationships",
          "Often asks 'why' or 'what does this suggest'"
        ],
        distractor_strategies: [
          "Explicitly stated but irrelevant information",
          "Logical fallacies or unsupported claims",
          "Confusing correlation with causation",
          "Overgeneralized or extreme conclusions",
          "True statements that don't answer the question"
        ],
        difficulty_progression: {
          "1": "Simple one-step inferences",
          "2": "Multi-step reasoning with clear evidence",
          "3": "Complex inferences requiring synthesis of multiple points"
        }
      }
    },

    // SUB-SKILL 3: Vocabulary in Context
    "Vocabulary in Context": {
      description: "Understanding word meanings from context, identifying synonyms and antonyms in passages",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [1, 2, 3],
      question_format: "Questions about word meanings as used in specific contexts",

      examples: [
        {
          difficulty: 2,
          question_text: "Read the passage and answer the question.\n\nPassage:\nDengue fever has long been a concern in tropical and subtropical regions around the world. In recent years, there has been a notable increase in reported cases of dengue in many countries. While this rise may initially appear alarming, health experts point out that the increase is not entirely due to the actual spread of the disease. A significant factor contributing to the higher numbers is the improvement in testing capabilities and changes in national practices for recording and reporting dengue cases, and therefore the relevance of reporting dengue disease cannot be understated. Many countries have implemented more comprehensive surveillance systems and better diagnostic tools, meaning that cases which might have gone undetected or unreported in the past are now being identified and documented.\n\nThe word 'relevance' DOES NOT mean:",
          answer_options: [
            "A) importance",
            "B) ignorance",
            "C) pertinence",
            "D) appropriateness/applicability"
          ],
          correct_answer: "B",
          explanation: "'Relevance' means importance or pertinence, so it does NOT mean ignorance.",
          distractor_strategy: "Synonyms of the target word and one clear antonym",
          characteristics: [
            "Negative question (DOES NOT mean)",
            "Tests understanding through opposites",
            "Multiple synonyms as distractors",
            "Context provided from passage"
          ]
        },
        {
          difficulty: 2,
          question_text: "Read the passage and answer the question.\n\nPassage:\nThe experience of reading has changed dramatically over the past few decades. In earlier times, books were treasured possessions, carefully bound with elegant covers that complemented each other on library shelves. The old hardback novels would blend together harmoniously, creating a pleasing visual collection. Today, however, the publishing world has shifted. Modern books today contrast sharply with each other, sporting bold, colorful covers that clash and clamor for attention on bookstore shelves. Each book seems designed to shout louder than its neighbors, often seeming to be at war with each other rather than existing in peaceful coexistence. This aggressive marketing approach reflects our modern consumer culture, where standing out is more important than fitting in.\n\nBooks today ______ with each other.",
          answer_options: [
            "A) complement",
            "B) contrast",
            "C) fight",
            "D) compete"
          ],
          correct_answer: "B",
          explanation: "The passage states that modern books 'contrast sharply with each other' and describes them as 'seeming to be at war with each other' contrasting with older books that blended harmoniously.",
          distractor_strategy: "Words with similar meanings or related concepts",
          characteristics: [
            "Fill-in-the-blank format",
            "Requires understanding relationship described in passage",
            "Tests nuanced word choice"
          ]
        }
      ],

      pattern: {
        format_template: "[Word/phrase in context from passage] + [Question about meaning or synonym/antonym]",
        key_characteristics: [
          "Word meaning determined by context",
          "May ask for synonyms, antonyms, or meanings",
          "Context quote usually provided",
          "Tests vocabulary in use, not isolation"
        ],
        distractor_strategies: [
          "Words with similar but incorrect meanings",
          "Common meanings when specialized meaning is intended",
          "Opposites when asking for synonyms (and vice versa)",
          "Related words from the same semantic field"
        ],
        difficulty_progression: {
          "1": "Common words with clear context",
          "2": "Intermediate vocabulary requiring context analysis",
          "3": "Advanced vocabulary or words with multiple meanings"
        }
      }
    },

    // SUB-SKILL 4: Sequencing & Text Organization
    "Sequencing & Text Organization": {
      description: "Understanding how ideas are organized and sequenced in text",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [2, 3],
      question_format: "Questions about the order or arrangement of ideas in a passage",

      examples: [
        {
          difficulty: 3,
          question_text: "Read the passage and answer the question.\n\nPassage:\nBooks are fundamentally about our pasts—they preserve our memories, stories, and histories for future generations. I remember one particular book from my childhood that kept me awake, aware, and cheerful through many difficult nights. It was a worn copy with a faded cover that sat on my shelf alongside dozens of others. The old hardback novels from that era would blend together beautifully, their spines creating a harmonious rainbow of muted colors and elegant fonts. Those books felt like old friends. Today's publishing landscape is markedly different. E-books, with their cold digital screens and generic interfaces, don't connect to the heart in the same way that physical books once did. There's something irreplaceable about the tactile experience of turning pages and seeing a beloved book on your shelf.\n\nBased on your understanding of the passage, choose the option that lists the correct sequence of thoughts as expressed by the author:\n1. E-books don't connect to heart\n2. The old hard back novels blend together\n3. Books are about our pasts\n4. The book kept us awake, aware, and cheerful",
          answer_options: [
            "A) 4, 2, 1 & 3",
            "B) 1, 3, 2 & 4",
            "C) 3, 2, 4 & 1",
            "D) 3, 4, 2 & 1"
          ],
          correct_answer: "D",
          explanation: "The passage opens with books being about our pasts (3), then describes a specific book that kept them awake, aware, and cheerful (4), discusses how old hardback novels blend together (2), and concludes with criticism of e-books not connecting to the heart (1).",
          distractor_strategy: "Plausible sequences that might seem correct without careful reading",
          characteristics: [
            "Requires tracking flow of ideas",
            "Tests understanding of organizational structure",
            "Multiple statements to order",
            "Needs careful passage review"
          ]
        }
      ],

      pattern: {
        format_template: "[Passage with clear organizational structure] + [Question about sequence or order of ideas]",
        key_characteristics: [
          "Tests understanding of text organization",
          "May involve chronological or logical order",
          "Requires tracking multiple points",
          "Often involves numbered statements"
        ],
        distractor_strategies: [
          "Reversed sequences",
          "Partially correct orderings",
          "Chronologically correct but logically incorrect",
          "Similar ideas placed in wrong positions"
        ],
        difficulty_progression: {
          "1": "Simple chronological sequences",
          "2": "Logical progressions of ideas",
          "3": "Complex thematic or argumentative structures"
        }
      }
    },

    // SUB-SKILL 5: Literal Comprehension
    "Literal Comprehension": {
      description: "Finding explicitly stated information in passages",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [1, 2],
      question_format: "Direct questions about facts stated in the passage",

      examples: [
        {
          difficulty: 1,
          question_text: "Read the passage and answer the question.\n\nPassage:\nAmelia Earhart was one of the most famous aviators of the 20th century. Born in 1897 to a locally prominent Kansas family, Earhart developed a passion for aviation at an early age. In 1928, she became famous as the first woman to fly across the Atlantic Ocean, though on that historic flight she served as a passenger rather than the pilot. This experience only fueled her determination to achieve even greater feats. Four years later, in 1932, she became the first woman to fly solo across the Atlantic. She later married George Putnam, a publisher, and together they worked on promoting aviation and women's achievements. Tragically, Earhart disappeared in 1937 during an attempt to circumnavigate the globe, and her fate remains one of aviation's greatest mysteries.\n\nEarhart flew across the Atlantic in 1928 as a:",
          answer_options: [
            "A) pilot",
            "B) passenger",
            "C) administrator",
            "D) aviation instructor"
          ],
          correct_answer: "B",
          explanation: "The passage explicitly states she became famous in 1928 as the first woman to fly across the Atlantic as a passenger, though she served as a passenger rather than the pilot.",
          distractor_strategy: "Related roles she might have had at different times",
          characteristics: [
            "Information explicitly stated",
            "Straightforward fact recall",
            "Specific detail about person or event",
            "Clear answer in text"
          ]
        },
        {
          difficulty: 2,
          question_text: "Read the passage and answer the question.\n\nPassage:\nAmelia Earhart was one of the most famous aviators of the 20th century. Born in 1897 to a locally prominent Kansas family, Earhart developed a passion for aviation at an early age. In 1928, she became famous as the first woman to fly across the Atlantic Ocean, though on that historic flight she served as a passenger rather than the pilot. This experience only fueled her determination to achieve even greater feats. Four years later, in 1932, she became the first woman to fly solo across the Atlantic. She later married George Putnam, a successful publisher from a prosperous publishing family, and together they worked on promoting aviation and women's achievements. Tragically, Earhart disappeared in 1937 during an attempt to circumnavigate the globe, and her fate remains one of aviation's greatest mysteries.\n\nEarhart belonged to a:",
          answer_options: [
            "A) poor family",
            "B) prosperous family",
            "C) influential family",
            "D) Both B and C"
          ],
          correct_answer: "D",
          explanation: "The passage states she was born to a locally prominent (influential) family and married into a prosperous publishing family, so both B and C are correct.",
          distractor_strategy: "Partially correct options that require combining information",
          characteristics: [
            "Requires synthesizing two facts",
            "Both/and type question",
            "Tests careful reading of multiple details"
          ]
        }
      ],

      pattern: {
        format_template: "[Passage] + [Direct question about stated fact]",
        key_characteristics: [
          "Answer explicitly in text",
          "May require finding specific sentence",
          "Factual information",
          "Clear, unambiguous answers"
        ],
        distractor_strategies: [
          "Information from other parts of passage",
          "Plausible but unstated facts",
          "Partially correct information",
          "Confusing similar people or events"
        ],
        difficulty_progression: {
          "1": "Single fact clearly stated in one location",
          "2": "Facts requiring synthesis of multiple sentences",
          "3": "Details embedded in complex sentences or requiring careful distinction"
        }
      }
    },

    // SUB-SKILL 6: Analysis & Comparison
    "Analysis & Comparison": {
      description: "Analyzing relationships, making comparisons, and synthesizing information across texts",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [2, 3],
      question_format: "Questions requiring comparison or analysis of different elements in passage(s)",

      examples: [
        {
          difficulty: 2,
          question_text: "Read the passage and answer the question.\n\nPassage:\nAmelia Earhart and Charles Lindbergh were two of the most celebrated aviators of their era, yet they handled fame in remarkably different ways. Lindbergh, after completing his historic solo transatlantic flight in 1927, became an instant celebrity. However, he quickly grew uncomfortable with the intense public attention and increasingly shrank from the spotlight, valuing his privacy above all else. In contrast, Earhart embraced her fame following her own Atlantic crossing. She recognized the platform it gave her and used it deliberately to champion women's rights and inspire other women to pursue careers in aviation and other male-dominated fields. While both were skilled pilots, their relationship with the public and their sense of social responsibility differed dramatically.\n\nThe difference between Charles Lindbergh and Amelia Earhart lies in:",
          answer_options: [
            "A) their abilities",
            "B) their fame",
            "C) their acumen",
            "D) public relationship"
          ],
          correct_answer: "D",
          explanation: "The passage notes that while Lindbergh shrank from fame and valued his privacy, Earhart embraced her fame and used it to be a role model for women, showing their different relationships with the public.",
          distractor_strategy: "Other possible points of comparison not discussed in passage",
          characteristics: [
            "Comparison question",
            "Requires identifying key difference",
            "Understanding contrast in passage",
            "May involve attitudes or behaviors"
          ]
        },
        {
          difficulty: 2,
          question_text: "Read the passage and answer the question.\n\nPassage:\nThe experience of reading has changed dramatically over the past few decades. In earlier times, books were treasured possessions, carefully bound with elegant covers that complemented each other on library shelves. The old hardback novels would blend together harmoniously, creating a pleasing visual collection. Today, however, the publishing world has shifted. Modern books sport bold, colorful covers that are clashing and clamoring for attention on bookstore shelves, often with distracting and annoying designs. Each book seems designed to shout louder than its neighbors, creating what can only be described as a mentally-assaulting visual experience. This aggressive marketing approach reflects our modern consumer culture, where standing out is more important than fitting in.\n\nColourful covers are _____ and ______:",
          answer_options: [
            "A) Aggressive - Repulsive",
            "B) Clashing - Clamoring",
            "C) Distracting - Annoying",
            "D) Both b and c"
          ],
          correct_answer: "D",
          explanation: "The passage describes modern book covers as 'clashing and clamoring' and also as 'distracting and annoying,' making both B and C correct.",
          distractor_strategy: "Related descriptors with similar negative connotations",
          characteristics: [
            "Finding multiple descriptors",
            "Understanding author's tone",
            "Recognizing paraphrased ideas"
          ]
        }
      ],

      pattern: {
        format_template: "[Passage describing multiple things] + [Question asking for comparison or analysis]",
        key_characteristics: [
          "Requires comparing elements",
          "May involve contrast or similarity",
          "Tests analytical thinking",
          "Often involves synthesizing information"
        ],
        distractor_strategies: [
          "Plausible but unstated comparisons",
          "Similarities when asking for differences",
          "Secondary rather than primary differences",
          "Overgeneralized or extreme characterizations"
        ],
        difficulty_progression: {
          "1": "Simple, explicitly stated comparisons",
          "2": "Implied comparisons requiring inference",
          "3": "Complex analyses requiring synthesis of multiple points"
        }
      }
    },

    // SUB-SKILL 7: Visual Interpretation
    "Visual Interpretation": {
      description: "Interpreting meaning from images, posters, and visual representations",
      visual_required: true,
      image_type: "Image Generation",
      llm_appropriate: true,  // Image generation (DALL-E/Imagen) is appropriate for creating interpretive images
      difficulty_range: [1, 2, 3],
      question_format: "Questions about the meaning, message, or interpretation of visual images",

      examples: [
        {
          difficulty: 2,
          question_text: "Image shows a tiger with sad expression and objects representing entertainment/circus:\n\nIn this picture, the tiger seems to be in:",
          answer_options: [
            "A) Contentment",
            "B) Exuberance",
            "C) Exhilaration",
            "D) Misery"
          ],
          correct_answer: "D",
          explanation: "The tiger's expression and context suggest sadness/misery about being used for entertainment.",
          distractor_strategy: "Opposite emotions or unrelated positive states",
          characteristics: [
            "Reading emotional content of images",
            "Understanding visual context",
            "Interpreting symbolic elements",
            "Non-verbal communication"
          ],
          requires_visual: true,
          llm_visual_appropriate: true,  // Image generation CAN create interpretive/emotional images like a sad tiger with circus props
          visual_prompt: `Create a poster-style image showing:
- A Bengal tiger with a visibly sad/melancholic facial expression
- Tears or downcast eyes to convey sadness
- Circus/entertainment objects around the tiger: a circus hoop, colorful balls, a small platform/pedestal
- Muted or desaturated background colors to convey the somber mood
- The tiger could be behind bars or in a confined space
- Style: Advocacy poster, emotional, slightly artistic/illustrated

The image should clearly communicate the theme of animals suffering in entertainment/captivity.

Visual type: image_generation (DALL-E/Imagen)
Aspect ratio: 4:3 (800x600px)
Style: Poster art, emotional advocacy, semi-realistic illustration`
        },
        {
          difficulty: 2,
          question_text: "Same image:\n\nA suitable caption for this poster would be:",
          answer_options: [
            "A) Leave them and Let them Live",
            "B) Fight for the Tigers",
            "C) Adopt One",
            "D) Shoot Tigers with a Camera, Not with a Gun"
          ],
          correct_answer: "A",
          explanation: "The image advocates for leaving tigers in their natural habitat rather than using them for entertainment.",
          distractor_strategy: "Related conservation messages with different focuses",
          characteristics: [
            "Understanding overall message",
            "Matching caption to visual",
            "Conservation/ethical themes",
            "Persuasive communication"
          ],
          requires_visual: true,
          llm_visual_appropriate: true,
          visual_prompt: "Use the same tiger image from the previous question."
        },
        {
          difficulty: 2,
          question_text: "Same image:\n\nThis picture exposes man's:",
          answer_options: [
            "A) content",
            "B) sadism",
            "C) brutality",
            "D) love for nature"
          ],
          correct_answer: "B",
          explanation: "The image criticizes taking pleasure (sadism) at the cost of animals' happiness and freedom.",
          distractor_strategy: "Related negative traits or opposite (positive) trait",
          characteristics: [
            "Identifying critique or message",
            "Understanding moral/ethical implications",
            "Recognizing advocacy purpose"
          ],
          requires_visual: true,
          llm_visual_appropriate: true,
          visual_prompt: "Use the same tiger image from the previous question."
        }
      ],

      pattern: {
        format_template: "[Image provided] + [Question about mood, message, interpretation, or suitable caption]",
        key_characteristics: [
          "No text passage, only image",
          "Visual literacy required",
          "May involve symbolism",
          "Often carries social or ethical messages",
          "Emotional or tonal interpretation"
        ],
        distractor_strategies: [
          "Opposite emotions or messages",
          "Literal interpretations of symbolic images",
          "Related but incorrect themes",
          "Surface-level vs. deeper meanings",
          "Overly specific or too general interpretations"
        ],
        difficulty_progression: {
          "1": "Clear, obvious emotional content or message",
          "2": "Symbolic or implied messages",
          "3": "Complex metaphorical or layered meanings"
        }
      }
    },

    // SUB-SKILL 8: Poetry Analysis
    "Poetry Analysis": {
      description: "Understanding poetic devices, themes, and meanings in poetry",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [2, 3],
      question_format: "Questions about meaning, theme, or elements in poems",

      examples: [
        {
          difficulty: 2,
          question_text: "Read the poem and answer the question.\n\nPoem: 'Amanda'\n\nDon't bite your nails, Amanda!\nDon't hunch your shoulders, Amanda!\nStop that slouching and sit up straight,\nAmanda!\n\n(There is a languid, emerald sea,\nwhere the sole inhabitant is me—\na mermaid, drifting blissfully.)\n\nDid you finish your homework, Amanda?\nDid you tidy your room, Amanda?\nI thought I told you to clean your shoes,\nAmanda!\n\n(I am an orphan, roaming the street.\nI pattern soft dust with my hushed, bare feet.\nThe silence is golden, the freedom is sweet.)\n\nDon't eat that chocolate, Amanda!\nRemember your acne, Amanda!\nWill you please look at me when I'm speaking to you,\nAmanda!\n\n(I am Rapunzel, I have not a care;\nlife in a tower is tranquil and rare;\nI'll certainly never let down my bright hair!)\n\nStop sulking at once, Amanda!\nYou're always so moody, Amanda!\nAnyone would think that I nagged at you,\nAmanda!\n\nWhat made Amanda sulk and become moody?",
          answer_options: [
            "A) When she had to complete her homework",
            "B) When her mother gives her too many instructions",
            "C) When she has to clean her shoes",
            "D) None of the Above"
          ],
          correct_answer: "B",
          explanation: "The poem shows Amanda's mood declining as she receives constant instructions and corrections from her mother throughout the poem (nail biting, posture, homework, room cleaning, shoes, chocolate, looking at mother).",
          distractor_strategy: "Specific instructions mentioned in poem rather than overall pattern",
          characteristics: [
            "Understanding character emotions",
            "Cause and effect in poetry",
            "Thematic interpretation",
            "Reading between lines of poetry"
          ]
        },
        {
          difficulty: 2,
          question_text: "Read the poem and answer the question.\n\nPoem: 'Amanda'\n\n[Same full poem as above]\n\nWhat does she imagine being when she pictures herself in a tower?",
          answer_options: [
            "A) Mermaid",
            "B) Orphan",
            "C) Rapunzel",
            "D) None of the Above"
          ],
          correct_answer: "C",
          explanation: "The poem explicitly mentions '(I am Rapunzel, I have not a care; life in a tower is tranquil and rare; I'll certainly never let down my bright hair!)'",
          distractor_strategy: "Other fantasy figures mentioned elsewhere in the poem (mermaid, orphan)",
          characteristics: [
            "Specific detail from poem",
            "Understanding fantasy/escape imagery",
            "Recognizing allusions to fairy tales"
          ]
        },
        {
          difficulty: 2,
          question_text: "Read the poem and answer the question.\n\nPoem: 'Amanda'\n\n[Same full poem as above]\n\nWhat is the meaning of 'slouching'?",
          answer_options: [
            "A) Bend",
            "B) Sit in a lazy way",
            "C) lie down",
            "D) bend backwards"
          ],
          correct_answer: "B",
          explanation: "'Stop that slouching and sit up straight' indicates slouching means sitting in a lazy, poor-posture way, the opposite of sitting up straight.",
          distractor_strategy: "Related body positions or movements",
          characteristics: [
            "Vocabulary from poem context",
            "Understanding from usage in poem",
            "Action/behavior words"
          ]
        }
      ],

      pattern: {
        format_template: "[Poem provided] + [Question about meaning, theme, character, or vocabulary]",
        key_characteristics: [
          "Poetic text format",
          "May involve figurative language",
          "Character emotions and motivations",
          "Themes and messages",
          "Literary devices"
        ],
        distractor_strategies: [
          "Other images or characters from same poem",
          "Literal interpretations of figurative language",
          "Surface meanings vs. deeper themes",
          "Confusing similar poetic elements",
          "Missing the emotional arc or development"
        ],
        difficulty_progression: {
          "1": "Explicit details and clear imagery",
          "2": "Themes and character emotions",
          "3": "Complex symbolism and layered meanings"
        }
      }
    }
  },

  // ============================================
  // ACER SCHOLARSHIP (YEAR 7 ENTRY) - WRITTEN EXPRESSION
  // ============================================

  "ACER Scholarship (Year 7 Entry) - Written Expression": {

    // SUB-SKILL 1: Persuasive/Argumentative Writing
    "Persuasive & Argumentative Writing": {
      description: "Developing logical arguments with evidence to persuade readers on an issue",
      visual_required: false,
      image_type: null,
      llm_appropriate: true,
      difficulty_range: [2, 3],
      question_format: "Opinion-based prompts requiring taking a position and supporting it with reasons",

      examples: [
        {
          difficulty: 3,
          question_text: "Do you think that manufacturers are responsible for the effects of the chemicals used in creating their products?",
          answer_options: [],
          correct_answer: "N/A - Writing Task",
          explanation: "This is a persuasive writing task requiring students to take a position and support it with logical arguments and evidence.",
          distractor_strategy: "N/A",
          characteristics: [
            "Opinion question format",
            "Requires taking a clear position",
            "Needs supporting arguments",
            "Ethical/social responsibility topic",
            "Real-world relevance",
            "Requires logical reasoning",
            "Should include counterarguments",
            "Formal essay structure expected"
          ]
        }
      ],

      pattern: {
        format_template: "[Question asking for opinion on an issue] - Student writes full essay response",
        key_characteristics: [
          "Clear thesis statement required",
          "Multiple supporting arguments needed",
          "Evidence and examples strengthen response",
          "Consideration of counterarguments shows sophistication",
          "Logical organization (introduction, body, conclusion)",
          "Formal academic tone",
          "Persuasive language techniques"
        ],
        distractor_strategies: ["N/A - Open-ended writing task"],
        difficulty_progression: {
          "1": "Simple opinion on familiar topic",
          "2": "Balanced argument on common issue",
          "3": "Complex ethical or social issue requiring nuanced thinking"
        }
      }
    },

    // SUB-SKILL 2: Creative & Imaginative Writing
    "Creative & Imaginative Writing": {
      description: "Creating original narratives, descriptions, or creative pieces inspired by stimuli",
      visual_required: true,
      image_type: "Image Generation",
      llm_appropriate: true,  // Image generation is perfect for creating surreal/artistic stimuli for creative writing
      difficulty_range: [2, 3],
      question_format: "Visual or textual stimulus with open-ended writing prompt",

      examples: [
        {
          difficulty: 3,
          question_text: "Use the provided image as a stimulus for a piece of writing. You can write in any format or text type which you think is appropriate.\n\n[Image shows a person standing in water near a chair, surreal/artistic composition]",
          answer_options: [],
          correct_answer: "N/A - Writing Task",
          explanation: "This is a creative writing task allowing students to choose their format (narrative, descriptive, poem, etc.) based on visual inspiration.",
          distractor_strategy: "N/A",
          characteristics: [
            "Visual stimulus provided",
            "Open-ended format choice",
            "Requires interpretation of image",
            "Creative/imaginative thinking",
            "Could be narrative, descriptive, poetic, etc.",
            "Mood and atmosphere important",
            "Sophisticated vocabulary expected",
            "Originality valued",
            "May involve symbolism or metaphor"
          ],
          requires_visual: true,
          llm_visual_appropriate: true,  // Surreal/artistic images are perfect for AI image generation
          visual_prompt: `Create a surreal, artistic, dreamlike image showing:
- A solitary person (seen from behind or side) standing in shallow water
- The water reflects the sky with subtle ripples
- A wooden chair positioned in the water nearby (slightly tilted or partially submerged)
- Atmospheric lighting: golden hour, soft sunset colors, or misty morning light
- A sense of isolation, contemplation, or mystery
- Background could be minimalist (empty horizon) or have distant elements (mountains, trees, structures)
- Style: Surrealist photography, artistic composition, slightly melancholic or dreamlike mood

The image should evoke emotion and invite interpretation - perfect for inspiring creative writing.

Visual type: image_generation (DALL-E/Imagen)
Aspect ratio: 16:9 or 4:3 (1200x800px)
Style: Surrealist photography, artistic, atmospheric, thought-provoking`
        }
      ],

      pattern: {
        format_template: "[Visual or textual stimulus] + [Open writing prompt allowing format choice]",
        key_characteristics: [
          "Stimulus-based (image, quote, scenario)",
          "Format flexibility (story, description, poem, etc.)",
          "Creativity and originality valued",
          "Vivid imagery and descriptive language",
          "Emotional engagement with stimulus",
          "Coherent structure regardless of chosen format",
          "Sophisticated vocabulary",
          "Literary techniques (metaphor, simile, etc.)"
        ],
        distractor_strategies: ["N/A - Open-ended writing task"],
        difficulty_progression: {
          "1": "Concrete, straightforward stimulus",
          "2": "Stimulus requiring some interpretation",
          "3": "Abstract or symbolic stimulus requiring creative interpretation"
        }
      }
    }
  }

} as const;
