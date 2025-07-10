/**
 * PROSE STYLE CYCLING SYSTEM
 * 
 * Provides diverse prose writing styles, sentence structures, and literary techniques
 * for reading passages to eliminate repetitive patterns and create authentic variety.
 * Focuses on writing craft rather than thematic content, with styles properly matched to text types.
 */

// Prose styles organized by text type and appropriately matched to reading comprehension needs
const PROSE_STYLES = {
  narrative: {
    // Year 5-7 narrative prose styles
    elementary: [
      { 
        style: "roald_dahl_inspired", 
        description: "Short, punchy sentences with vivid descriptors and playful language",
        prose_technique: "Short declarative sentences, imaginative adjectives, child-friendly vocabulary",
        sentence_pattern: "simple_vivid",
        opening_approach: "character_action"
      },
      { 
        style: "beverly_cleary_inspired", 
        description: "Clear, conversational prose with natural dialogue and relatable situations",
        prose_technique: "Conversational tone, realistic dialogue, everyday language",
        sentence_pattern: "natural_flowing",
        opening_approach: "character_thought"
      },
      { 
        style: "classic_fable_style", 
        description: "Simple, direct storytelling with clear moral lessons",
        prose_technique: "Straightforward narrative, cause-and-effect structure, accessible vocabulary",
        sentence_pattern: "sequential_clear",
        opening_approach: "setting_description"
      },
      { 
        style: "adventure_chapter_style", 
        description: "Engaging action sequences with suspenseful pacing",
        prose_technique: "Active voice, varied sentence lengths, sensory details",
        sentence_pattern: "action_focused",
        opening_approach: "in_medias_res"
      },
      { 
        style: "gentle_realism_style", 
        description: "Thoughtful, gentle prose exploring relationships and emotions",
        prose_technique: "Emotional depth with simple language, introspective moments",
        sentence_pattern: "reflective_warm",
        opening_approach: "emotional_moment"
      }
    ],
    
    // Year 7-9 narrative prose styles
    intermediate: [
      { 
        style: "steinbeck_inspired", 
        description: "Rich descriptive prose with strong sense of place and character",
        prose_technique: "Detailed descriptions, metaphorical language, character depth",
        sentence_pattern: "descriptive_layered",
        opening_approach: "atmospheric_setting"
      },
      { 
        style: "orwell_inspired", 
        description: "Clear, precise prose with subtle complexity and social awareness",
        prose_technique: "Precise word choice, understated emotion, social observation",
        sentence_pattern: "precise_observational",
        opening_approach: "social_context"
      },
      { 
        style: "tolkien_inspired", 
        description: "Elevated prose with rich world-building and formal register",
        prose_technique: "Formal register, detailed world-building, archaic touches",
        sentence_pattern: "formal_elaborate",
        opening_approach: "world_establishment"
      },
      { 
        style: "contemporary_ya_style", 
        description: "Modern, authentic voice with realistic dialogue and current themes",
        prose_technique: "Authentic teen voice, contemporary language, realistic situations",
        sentence_pattern: "modern_authentic",
        opening_approach: "dialogue_driven"
      },
      { 
        style: "literary_fiction_style", 
        description: "Sophisticated prose with varied sentence structures and literary devices",
        prose_technique: "Complex syntax, literary devices, nuanced characterization",
        sentence_pattern: "sophisticated_varied",
        opening_approach: "symbolic_opening"
      }
    ]
  },

  informational: {
    // Year 5-7 informational prose styles
    elementary: [
      { 
        style: "national_geographic_kids", 
        description: "Engaging, fact-filled prose with active voice and vivid descriptions",
        prose_technique: "Active voice, exciting facts, sensory descriptions, exclamation points",
        sentence_pattern: "engaging_factual",
        opening_approach: "amazing_fact"
      },
      { 
        style: "magic_school_bus_style", 
        description: "Enthusiastic, educational prose that makes learning fun",
        prose_technique: "Enthusiastic tone, question-answer format, simple explanations",
        sentence_pattern: "educational_fun",
        opening_approach: "curious_question"
      },
      { 
        style: "field_guide_style", 
        description: "Clear, systematic descriptions with technical accuracy",
        prose_technique: "Systematic organization, precise terminology, descriptive categories",
        sentence_pattern: "systematic_precise",
        opening_approach: "classification_intro"
      },
      { 
        style: "how_things_work_style", 
        description: "Step-by-step explanations with logical sequencing",
        prose_technique: "Sequential structure, transitional phrases, clear causation",
        sentence_pattern: "sequential_logical",
        opening_approach: "process_introduction"
      },
      { 
        style: "biography_for_kids_style", 
        description: "Narrative informational writing about real people and events",
        prose_technique: "Story-driven facts, chronological structure, human interest",
        sentence_pattern: "narrative_informational",
        opening_approach: "person_introduction"
      }
    ],
    
    // Year 7-9 informational prose styles
    intermediate: [
      { 
        style: "mary_roach_inspired", 
        description: "Witty, engaging science writing with humor and accessibility",
        prose_technique: "Humorous observations, conversational explanations, surprising facts",
        sentence_pattern: "witty_accessible",
        opening_approach: "humorous_hook"
      },
      { 
        style: "malcolm_gladwell_inspired", 
        description: "Narrative-driven analysis with compelling examples and insights",
        prose_technique: "Story-driven analysis, compelling examples, thought-provoking insights",
        sentence_pattern: "narrative_analytical",
        opening_approach: "anecdotal_example"
      },
      { 
        style: "bbc_documentary_style", 
        description: "Authoritative yet accessible prose with rich detail and scope",
        prose_technique: "Authoritative tone, detailed descriptions, broad perspective",
        sentence_pattern: "authoritative_detailed",
        opening_approach: "panoramic_view"
      },
      { 
        style: "scientific_american_style", 
        description: "Technical precision balanced with clear explanations",
        prose_technique: "Technical accuracy, clear explanations, logical progression",
        sentence_pattern: "technical_clear",
        opening_approach: "research_finding"
      },
      { 
        style: "atlantic_magazine_style", 
        description: "Thoughtful analysis with sophisticated vocabulary and complex ideas",
        prose_technique: "Analytical depth, sophisticated vocabulary, complex synthesis",
        sentence_pattern: "analytical_sophisticated",
        opening_approach: "thesis_statement"
      }
    ]
  },

  persuasive: {
    // Year 5-7 persuasive prose styles
    elementary: [
      { 
        style: "student_newspaper_style", 
        description: "Clear, direct arguments with simple reasoning and examples",
        prose_technique: "Direct statements, simple reasoning, relatable examples",
        sentence_pattern: "direct_clear",
        opening_approach: "problem_statement"
      },
      { 
        style: "environmental_poster_style", 
        description: "Urgent, action-oriented language with emotional appeal",
        prose_technique: "Action verbs, emotional appeal, call-to-action statements",
        sentence_pattern: "urgent_action",
        opening_approach: "urgent_call"
      },
      { 
        style: "safety_campaign_style", 
        description: "Protective, caring tone with clear consequences and benefits",
        prose_technique: "Caring tone, clear consequences, benefit statements",
        sentence_pattern: "protective_logical",
        opening_approach: "safety_scenario"
      },
      { 
        style: "letter_to_editor_style", 
        description: "Respectful but firm arguments with personal experience",
        prose_technique: "Respectful tone, personal examples, structured arguments",
        sentence_pattern: "respectful_firm",
        opening_approach: "personal_experience"
      },
      { 
        style: "school_debate_style", 
        description: "Structured arguments with clear points and simple evidence",
        prose_technique: "Structured points, simple evidence, logical transitions",
        sentence_pattern: "structured_logical",
        opening_approach: "position_statement"
      }
    ],
    
    // Year 7-9 persuasive prose styles
    intermediate: [
      { 
        style: "op_ed_columnist_style", 
        description: "Sophisticated argumentation with complex reasoning and evidence",
        prose_technique: "Complex reasoning, multiple evidence types, counterargument acknowledgment",
        sentence_pattern: "sophisticated_reasoned",
        opening_approach: "provocative_thesis"
      },
      { 
        style: "investigative_journalist_style", 
        description: "Fact-based persuasion with investigative depth and credible sources",
        prose_technique: "Investigative depth, credible sources, fact-based arguments",
        sentence_pattern: "investigative_credible",
        opening_approach: "revealing_investigation"
      },
      { 
        style: "policy_advocate_style", 
        description: "Formal, authoritative arguments with statistical support",
        prose_technique: "Formal register, statistical support, policy implications",
        sentence_pattern: "formal_authoritative",
        opening_approach: "policy_context"
      },
      { 
        style: "social_commentator_style", 
        description: "Thoughtful social analysis with cultural awareness and nuance",
        prose_technique: "Cultural awareness, nuanced arguments, social implications",
        sentence_pattern: "thoughtful_nuanced",
        opening_approach: "social_observation"
      },
      { 
        style: "debate_champion_style", 
        description: "Logical, structured arguments with strategic counterpoints",
        prose_technique: "Logical structure, strategic counterpoints, rhetorical devices",
        sentence_pattern: "logical_strategic",
        opening_approach: "strategic_framework"
      }
    ]
  },

  procedural: {
    // Year 5-7 procedural prose styles
    elementary: [
      { 
        style: "simple_instructions_style", 
        description: "Clear, step-by-step instructions with simple language",
        prose_technique: "Sequential steps, imperative verbs, simple vocabulary",
        sentence_pattern: "instructional_clear",
        opening_approach: "materials_overview"
      },
      { 
        style: "cooking_recipe_style", 
        description: "Friendly, encouraging instructional prose with helpful tips",
        prose_technique: "Encouraging tone, helpful tips, clear measurements",
        sentence_pattern: "friendly_instructional",
        opening_approach: "preparation_introduction"
      },
      { 
        style: "craft_project_style", 
        description: "Engaging, creative instructions with visual descriptions",
        prose_technique: "Visual descriptions, creative language, encouraging tone",
        sentence_pattern: "creative_instructional",
        opening_approach: "creative_motivation"
      },
      { 
        style: "science_experiment_style", 
        description: "Precise, safety-focused instructions with scientific vocabulary",
        prose_technique: "Precise language, safety emphasis, scientific terms",
        sentence_pattern: "scientific_precise",
        opening_approach: "safety_overview"
      },
      { 
        style: "game_rules_style", 
        description: "Fun, clear explanations of rules and procedures",
        prose_technique: "Clear rules, playful tone, logical sequence",
        sentence_pattern: "playful_structured",
        opening_approach: "game_introduction"
      }
    ],
    
    // Year 7-9 procedural prose styles
    intermediate: [
      { 
        style: "technical_manual_style", 
        description: "Detailed, precise instructions with technical terminology",
        prose_technique: "Technical terminology, detailed specifications, logical flow",
        sentence_pattern: "technical_detailed",
        opening_approach: "technical_overview"
      },
      { 
        style: "professional_guide_style", 
        description: "Authoritative, comprehensive instructions with expert insights",
        prose_technique: "Expert insights, comprehensive coverage, professional tone",
        sentence_pattern: "professional_comprehensive",
        opening_approach: "expert_introduction"
      },
      { 
        style: "troubleshooting_guide_style", 
        description: "Problem-solving approach with conditional instructions",
        prose_technique: "Conditional logic, problem-solving approach, alternative solutions",
        sentence_pattern: "problem_solving",
        opening_approach: "problem_identification"
      },
      { 
        style: "advanced_tutorial_style", 
        description: "Sophisticated instructions with theoretical background",
        prose_technique: "Theoretical background, sophisticated techniques, nuanced explanations",
        sentence_pattern: "sophisticated_instructional",
        opening_approach: "theoretical_foundation"
      },
      { 
        style: "policy_procedure_style", 
        description: "Formal, structured procedures with official language",
        prose_technique: "Formal language, structured procedures, official tone",
        sentence_pattern: "formal_procedural",
        opening_approach: "policy_context"
      }
    ]
  },

  descriptive: {
    // Year 5-7 descriptive prose styles
    elementary: [
      { 
        style: "nature_documentary_style", 
        description: "Vivid, sensory-rich descriptions of natural settings",
        prose_technique: "Sensory details, vivid imagery, natural vocabulary",
        sentence_pattern: "sensory_vivid",
        opening_approach: "scenic_overview"
      },
      { 
        style: "travel_journal_style", 
        description: "Personal, engaging descriptions of places and experiences",
        prose_technique: "Personal perspective, engaging details, experiential language",
        sentence_pattern: "personal_engaging",
        opening_approach: "arrival_moment"
      },
      { 
        style: "museum_guide_style", 
        description: "Informative, accessible descriptions with historical context",
        prose_technique: "Historical context, accessible language, informative tone",
        sentence_pattern: "informative_accessible",
        opening_approach: "exhibit_introduction"
      },
      { 
        style: "children_book_style", 
        description: "Gentle, imaginative descriptions with simple beauty",
        prose_technique: "Gentle imagery, imaginative language, simple beauty",
        sentence_pattern: "gentle_imaginative",
        opening_approach: "wonder_introduction"
      },
      { 
        style: "sports_commentary_style", 
        description: "Dynamic, action-focused descriptions with energy",
        prose_technique: "Action focus, dynamic language, energetic tone",
        sentence_pattern: "dynamic_energetic",
        opening_approach: "action_moment"
      }
    ],
    
    // Year 7-9 descriptive prose styles
    intermediate: [
      { 
        style: "literary_landscape_style", 
        description: "Sophisticated, atmospheric descriptions with literary depth",
        prose_technique: "Literary devices, atmospheric depth, sophisticated imagery",
        sentence_pattern: "literary_atmospheric",
        opening_approach: "atmospheric_establishment"
      },
      { 
        style: "architectural_review_style", 
        description: "Detailed, technical descriptions with aesthetic analysis",
        prose_technique: "Technical detail, aesthetic analysis, architectural vocabulary",
        sentence_pattern: "technical_aesthetic",
        opening_approach: "structural_overview"
      },
      { 
        style: "scientific_observation_style", 
        description: "Precise, objective descriptions with scientific accuracy",
        prose_technique: "Scientific accuracy, objective tone, precise observations",
        sentence_pattern: "scientific_objective",
        opening_approach: "observation_setup"
      },
      { 
        style: "art_critique_style", 
        description: "Analytical, sophisticated descriptions with cultural context",
        prose_technique: "Cultural context, analytical depth, sophisticated vocabulary",
        sentence_pattern: "analytical_sophisticated",
        opening_approach: "artistic_context"
      },
      { 
        style: "historical_account_style", 
        description: "Detailed, contextual descriptions with historical perspective",
        prose_technique: "Historical perspective, contextual details, period language",
        sentence_pattern: "historical_contextual",
        opening_approach: "historical_setting"
      }
    ]
  }
};

// Opening pattern templates to avoid repetitive structures
const OPENING_PATTERNS = {
  // Narrative patterns
  diary_entry: [
    "Day {number} of our expedition to {location}.",
    "Today marked a turning point in {character}'s journey.",
    "The old leather journal revealed {character}'s secret.",
    "Week {number}: Something extraordinary happened today."
  ],
  
  character_action: [
    "{character} pressed their ear against the wooden door.",
    "The morning sun caught {character} off guard as they stepped outside.",
    "{character} had never seen anything quite like it before.",
    "With trembling hands, {character} opened the mysterious package."
  ],
  
  mysterious_event: [
    "The lighthouse keeper noticed something unusual that {day}.",
    "Nobody could explain why all the {objects} had vanished overnight.",
    "Detective {character} arrived at the scene to find {mystery_element}.",
    "Strange sounds echoed from the {location} every night at {time}."
  ],
  
  family_scene: [
    "Around the dinner table, {character}'s family shared {event}.",
    "Grandmother's attic held more treasures than {character} expected.",
    "The family tradition of {activity} began when {character} was young.",
    "Every {day}, {character} and their {relative} would {activity}."
  ],
  
  // Informational patterns
  discovery_question: [
    "What makes {subject} so remarkably {quality}?",
    "Scientists have discovered that {subject} {action} in ways never before understood.",
    "Deep in the {location}, researchers uncovered evidence of {discovery}.",
    "The mystery of {phenomenon} has puzzled experts for {time_period}."
  ],
  
  process_introduction: [
    "The intricate process of {process} begins with {first_step}.",
    "Understanding how {system} works requires examining {component}.",
    "From {starting_point} to {end_point}, the journey of {subject} involves {process}.",
    "The remarkable transformation of {subject} occurs through {method}."
  ],
  
  surprising_fact: [
    "Few people realize that {subject} {surprising_action}.",
    "Against all expectations, {phenomenon} actually {action}.",
    "The most astonishing feature of {subject} is its ability to {capability}.",
    "Recent research reveals that {subject} {unexpected_behavior}."
  ],
  
  // Persuasive patterns
  student_concern: [
    "As a student at {school}, I've witnessed firsthand how {issue} affects {affected_group}.",
    "Every day, students like me face the challenge of {problem}.",
    "The time has come for our school community to address {issue}.",
    "Walking through our school halls, you can't help but notice {observation}."
  ],
  
  environmental_urgency: [
    "The {ecosystem} faces an unprecedented threat that demands immediate action.",
    "Climate scientists warn that {location} will experience {consequence} unless we act now.",
    "The delicate balance of {environment} hangs in the balance.",
    "Future generations will inherit {consequence} if we fail to protect {resource}."
  ],
  
  policy_analysis: [
    "The proposed {policy} raises important questions about {issue}.",
    "Current regulations regarding {subject} fail to address {problem}.",
    "Evidence suggests that {policy_approach} would benefit {affected_group}.",
    "A comprehensive analysis of {policy} reveals both opportunities and challenges."
  ]
};

// Australian cultural elements to weave into passages
const AUSTRALIAN_CONTEXT_ELEMENTS = {
  locations: [
    "Blue Mountains", "Great Barrier Reef", "Uluru", "Tasmania's wilderness", "Perth's coastline",
    "Sydney Harbour", "Melbourne's laneways", "Kakadu National Park", "Fraser Island", "Grampians"
  ],
  
  cultural_references: [
    "ANZAC Day ceremony", "school sports carnival", "Australia Day celebration", "local footy match",
    "community BBQ", "school camp", "rural show", "surf lifesaving", "bush telegraph", "mateship"
  ],
  
  natural_elements: [
    "eucalyptus trees", "kangaroo sighting", "cockatoo calls", "bushland trail", "billabong",
    "coastal dunes", "rainforest canopy", "outback landscape", "reef ecosystem", "native wildlife"
  ]
};

interface WritingStyleContext {
  textType: 'narrative' | 'informational' | 'persuasive';
  difficulty: 1 | 2 | 3;
  yearLevel: number;
  usedStyles: Set<string>;
  subSkill?: string;
}

interface SelectedStyle {
  style: string;
  description: string;
  prose_technique: string;
  sentence_pattern: string;
  opening_approach: string;
  opening_template?: string;
  australian_elements: {
    location?: string;
    cultural_reference?: string;
    natural_element?: string;
  };
}

/**
 * Get the appropriate difficulty level based on year level and question difficulty
 */
function getDifficultyLevel(yearLevel: number, questionDifficulty: number): 'elementary' | 'intermediate' {
  // Year 5-7 with easy/medium difficulty = elementary
  // Year 7+ with hard difficulty or Year 8-9 = intermediate
  if (yearLevel <= 7 && questionDifficulty <= 2) {
    return 'elementary';
  }
  return 'intermediate';
}

/**
 * Select a writing style that hasn't been used recently
 */
export function selectWritingStyle(context: WritingStyleContext): SelectedStyle {
  const difficultyLevel = getDifficultyLevel(context.yearLevel, context.difficulty);
  const availableStyles = PROSE_STYLES[context.textType][difficultyLevel];
  
  // Filter out recently used styles
  const unusedStyles = availableStyles.filter(style => 
    !context.usedStyles.has(`${context.textType}_${style.style}`)
  );
  
  // If all styles have been used, reset and use any style
  const stylesToChooseFrom = unusedStyles.length > 0 ? unusedStyles : availableStyles;
  
  // Select style (with some randomization)
  const selectedStyle = stylesToChooseFrom[Math.floor(Math.random() * stylesToChooseFrom.length)];
  
  // Get opening pattern templates based on opening approach
  const patternTemplates = OPENING_PATTERNS[selectedStyle.opening_approach] || [];
  const selectedTemplate = patternTemplates[Math.floor(Math.random() * patternTemplates.length)] || "";
  
  // Select Australian context elements
  const location = AUSTRALIAN_CONTEXT_ELEMENTS.locations[
    Math.floor(Math.random() * AUSTRALIAN_CONTEXT_ELEMENTS.locations.length)
  ];
  const culturalRef = AUSTRALIAN_CONTEXT_ELEMENTS.cultural_references[
    Math.floor(Math.random() * AUSTRALIAN_CONTEXT_ELEMENTS.cultural_references.length)
  ];
  const naturalElement = AUSTRALIAN_CONTEXT_ELEMENTS.natural_elements[
    Math.floor(Math.random() * AUSTRALIAN_CONTEXT_ELEMENTS.natural_elements.length)
  ];
  
  // Mark this style as used
  context.usedStyles.add(`${context.textType}_${selectedStyle.style}`);
  
  return {
    style: selectedStyle.style,
    description: selectedStyle.description,
    prose_technique: selectedStyle.prose_technique,
    sentence_pattern: selectedStyle.sentence_pattern,
    opening_approach: selectedStyle.opening_approach,
    opening_template: selectedTemplate,
    australian_elements: {
      location,
      cultural_reference: culturalRef,
      natural_element: naturalElement
    }
  };
}

/**
 * Generate prose style-specific instructions for Claude
 */
export function generateStyleInstructions(selectedStyle: SelectedStyle, wordCount: number): string {
  const instructions = [
    `PROSE STYLE: ${selectedStyle.style.replace(/_/g, ' ').toUpperCase()}`,
    `Description: ${selectedStyle.description}`,
    ``,
    `PROSE TECHNIQUE REQUIREMENTS:`,
    `- ${selectedStyle.prose_technique}`,
    `- Sentence pattern: ${selectedStyle.sentence_pattern.replace(/_/g, ' ')}`,
    `- Opening approach: ${selectedStyle.opening_approach.replace(/_/g, ' ')}`,
    ``,
    `TARGET WORD COUNT: ${wordCount} words`,
    ``,
    'AUSTRALIAN CONTEXT INTEGRATION:',
    selectedStyle.australian_elements.location ? `- Setting consideration: ${selectedStyle.australian_elements.location}` : '',
    selectedStyle.australian_elements.cultural_reference ? `- Cultural element: ${selectedStyle.australian_elements.cultural_reference}` : '',
    selectedStyle.australian_elements.natural_element ? `- Natural reference: ${selectedStyle.australian_elements.natural_element}` : '',
    '',
    'CRITICAL PROSE REQUIREMENTS:',
    '- Focus on sentence structure and prose craft over content themes',
    '- Avoid formulaic openings like "Imagine..." or "Have you ever..."',
    '- Do NOT start narratives with "[Character full name] was..." patterns',
    '- Vary sentence lengths and structures according to the selected style',
    '- Use vocabulary and complexity appropriate for the target year level',
    '- Maintain the specific prose techniques outlined above',
    '- The writing style should feel natural and authentic to the text type',
    '',
    'EXAMPLE TECHNIQUES TO AVOID:',
    '- Repetitive sentence starters',
    '- Formulaic paragraph structures', 
    '- Overused transitional phrases',
    '- Generic character introductions',
    '- Clichéd opening questions or statements'
  ].filter(Boolean).join('\n');
  
  return instructions;
}

/**
 * Reset the used styles cache (useful for long generation runs)
 */
export function resetUsedStyles(context: WritingStyleContext): void {
  context.usedStyles.clear();
}

/**
 * Get cache statistics for debugging
 */
export function getStyleCacheStats(context: WritingStyleContext): { used: number; available: number; styles: string[] } {
  const difficultyLevel = getDifficultyLevel(context.yearLevel, context.difficulty);
  const availableStyles = PROSE_STYLES[context.textType][difficultyLevel];
  
  return {
    used: context.usedStyles.size,
    available: availableStyles.length,
    styles: Array.from(context.usedStyles)
  };
}