// EduCourse Curriculum Data
// Based on Question Generation System Implementation Guide

export const TEST_STRUCTURES = {
  "Year_5_NAPLAN": {
    "Reading": {"questions": "35-40", "time": 50, "format": "MC, short answer"},
    "Writing": {"questions": 1, "time": 40, "format": "Extended response"},
    "Language_Conventions": {"questions": "50-55", "time": 45, "format": "MC, short answer"},
    "Numeracy": {"questions": "35-40", "time": 50, "format": "MC, short answer"}
  },
  "Year_7_NAPLAN": {
    "Reading": {"questions": "45-50", "time": 65, "format": "MC, short answer"},
    "Writing": {"questions": 1, "time": 40, "format": "Extended response"},
    "Language_Conventions": {"questions": "60-65", "time": 45, "format": "MC, short answer"},
    "Numeracy": {"questions": "45-50", "time": 65, "format": "MC, short answer"}
  },
  "ACER_Year_6": {
    "Verbal_Reasoning": {"questions": "30-35", "time": 30, "format": "MC"},
    "Quantitative_Reasoning": {"questions": "30-35", "time": 30, "format": "MC"},
    "Abstract_Reasoning": {"questions": "30-35", "time": 30, "format": "MC"},
    "Written_Expression": {"questions": 2, "time": 30, "format": "Extended response"}
  },
  "EduTest_Year_6": {
    "Reading_Comprehension": {"questions": "30-35", "time": 30, "format": "MC, short answer"},
    "Mathematics": {"questions": "30-35", "time": 30, "format": "MC, short answer"},
    "Written_Expression": {"questions": "1-2", "time": 25, "format": "Extended response"},
    "Verbal_Reasoning": {"questions": "25-30", "time": 30, "format": "MC"},
    "Non_verbal_Reasoning": {"questions": "25-30", "time": 30, "format": "MC"}
  },
  "NSW_Selective_Year_6": {
    "Reading": {"questions": "40-45", "time": 40, "format": "MC"},
    "Mathematics": {"questions": "40-45", "time": 40, "format": "MC"},
    "Thinking_Skills": {"questions": "40-45", "time": 40, "format": "MC"},
    "Writing": {"questions": 1, "time": 30, "format": "Extended response"}
  },
  "VIC_Selective_Year_8": {
    "Verbal_Reasoning": {"questions": "30-35", "time": 30, "format": "MC"},
    "Numerical_Reasoning": {"questions": "30-35", "time": 30, "format": "MC"},
    "Abstract_Reasoning": {"questions": "30-35", "time": 30, "format": "MC"},
    "Written_Expression": {"questions": "1-2", "time": 30, "format": "Extended response"}
  }
} as const;

export const UNIFIED_SUB_SKILLS = {
  // Text Comprehension
  "Text Comprehension - Explicit": {
    "description": "Interpreting explicit information from text",
    "visual_required": false
  },
  "Text Comprehension - Inferential": {
    "description": "Making inferences and reading between the lines",
    "visual_required": false
  },

  // Text Analysis
  "Text Analysis - Structure": {
    "description": "Analyzing text structure and organization",
    "visual_required": false
  },
  "Text Analysis - Critical": {
    "description": "Critical analysis and author's purpose",
    "visual_required": false
  },
  "Text Analysis - Literary": {
    "description": "Understanding literary devices and techniques",
    "visual_required": false
  },

  // Language Skills
  "Language - Vocabulary": {
    "description": "Word meanings and vocabulary in context",
    "visual_required": false
  },
  "Language - Grammar": {
    "description": "Grammar rules and sentence structure",
    "visual_required": false
  },
  "Language - Spelling": {
    "description": "Correct spelling and word formation",
    "visual_required": false
  },
  "Language - Punctuation": {
    "description": "Punctuation rules and usage",
    "visual_required": false
  },

  // Mathematics
  "Mathematics - Number": {
    "description": "Number operations and number sense",
    "visual_required": false
  },
  "Mathematics - Algebra": {
    "description": "Algebraic thinking and pre-algebraic reasoning",
    "visual_required": true
  },
  "Mathematics - Geometry": {
    "description": "Geometric shapes, spatial relationships, measurement",
    "visual_required": true
  },
  "Mathematics - Measurement": {
    "description": "Units, measurement, and data interpretation",
    "visual_required": true
  },
  "Mathematics - Statistics": {
    "description": "Data analysis, graphs, probability",
    "visual_required": true
  },
  "Mathematics - Patterns": {
    "description": "Number patterns and sequences",
    "visual_required": true
  },
  "Mathematics - Problem Solving": {
    "description": "Multi-step mathematical problem solving",
    "visual_required": false
  },

  // Cognitive Skills
  "Cognitive - Verbal Relations": {
    "description": "Word relationships, analogies, semantic connections",
    "visual_required": false
  },
  "Cognitive - Logical Reasoning": {
    "description": "Logical deduction and reasoning",
    "visual_required": false
  },
  "Cognitive - Pattern Recognition": {
    "description": "Visual and abstract pattern recognition",
    "visual_required": true
  },
  "Cognitive - Spatial": {
    "description": "Spatial visualization and reasoning",
    "visual_required": true
  },
  "Cognitive - Visual Relations": {
    "description": "Visual analogies and relationships",
    "visual_required": true
  },
  "Cognitive - Visual Processing": {
    "description": "Visual problem-solving and processing",
    "visual_required": true
  },
  "Cognitive - Abstract": {
    "description": "Abstract reasoning and conceptual thinking",
    "visual_required": true
  },
  "Cognitive - Critical Analysis": {
    "description": "Critical thinking and analysis",
    "visual_required": false
  },
  "Cognitive - Classification": {
    "description": "Categorization and classification skills",
    "visual_required": false
  },

  // Written Expression
  "Written Expression - Narrative": {
    "description": "Narrative and story writing",
    "visual_required": false
  },
  "Written Expression - Persuasive": {
    "description": "Persuasive and argumentative writing",
    "visual_required": false
  },
  "Written Expression - Creative": {
    "description": "Creative and imaginative writing",
    "visual_required": false
  },
  "Written Expression - Analytical": {
    "description": "Analytical and expository writing",
    "visual_required": false
  }
} as const;

// Difficulty mappings from project data
export const SUB_SKILL_DIFFICULTIES: Record<string, number> = {
  // Year 5 NAPLAN
  "Year_5_NAPLAN,Text Comprehension - Explicit": 1,
  "Year_5_NAPLAN,Text Comprehension - Inferential": 2,
  "Year_5_NAPLAN,Text Analysis - Structure": 2,
  "Year_5_NAPLAN,Language - Vocabulary": 2,
  "Year_5_NAPLAN,Text Analysis - Critical": 3,
  "Year_5_NAPLAN,Written Expression - Narrative": 2,
  "Year_5_NAPLAN,Written Expression - Persuasive": 2,
  "Year_5_NAPLAN,Language - Spelling": 1,
  "Year_5_NAPLAN,Language - Grammar": 2,
  "Year_5_NAPLAN,Language - Punctuation": 1,
  "Year_5_NAPLAN,Mathematics - Number": 1,
  "Year_5_NAPLAN,Mathematics - Patterns": 2,
  "Year_5_NAPLAN,Mathematics - Measurement": 2,
  "Year_5_NAPLAN,Mathematics - Geometry": 2,
  "Year_5_NAPLAN,Mathematics - Statistics": 2,
  "Year_5_NAPLAN,Mathematics - Problem Solving": 3,

  // Year 7 NAPLAN
  "Year_7_NAPLAN,Text Comprehension - Explicit": 2,
  "Year_7_NAPLAN,Text Comprehension - Inferential": 3,
  "Year_7_NAPLAN,Text Analysis - Critical": 3,
  "Year_7_NAPLAN,Text Analysis - Literary": 3,
  "Year_7_NAPLAN,Language - Vocabulary": 3,
  "Year_7_NAPLAN,Text Analysis - Structure": 3,
  "Year_7_NAPLAN,Written Expression - Narrative": 3,
  "Year_7_NAPLAN,Written Expression - Persuasive": 3,
  "Year_7_NAPLAN,Language - Spelling": 2,
  "Year_7_NAPLAN,Language - Grammar": 3,
  "Year_7_NAPLAN,Language - Punctuation": 2,
  "Year_7_NAPLAN,Mathematics - Number": 2,
  "Year_7_NAPLAN,Mathematics - Algebra": 3,
  "Year_7_NAPLAN,Mathematics - Measurement": 3,
  "Year_7_NAPLAN,Mathematics - Geometry": 3,
  "Year_7_NAPLAN,Mathematics - Statistics": 3,
  "Year_7_NAPLAN,Mathematics - Problem Solving": 3,

  // ACER Year 6 (Difficulty 3-4)
  "ACER_Year_6,Language - Vocabulary": 3,
  "ACER_Year_6,Cognitive - Verbal Relations": 3,
  "ACER_Year_6,Text Comprehension - Inferential": 3,
  "ACER_Year_6,Cognitive - Critical Analysis": 4,
  "ACER_Year_6,Mathematics - Patterns": 3,
  "ACER_Year_6,Mathematics - Algebra": 4,
  "ACER_Year_6,Mathematics - Problem Solving": 4,
  "ACER_Year_6,Mathematics - Statistics": 3,
  "ACER_Year_6,Cognitive - Spatial": 3,
  "ACER_Year_6,Cognitive - Pattern Recognition": 3,
  "ACER_Year_6,Cognitive - Visual Relations": 4,
  "ACER_Year_6,Cognitive - Logical Reasoning": 4,
  "ACER_Year_6,Written Expression - Creative": 3,
  "ACER_Year_6,Written Expression - Analytical": 4,

  // EduTest Year 6 (Difficulty 3-4)
  "EduTest_Year_6,Text Comprehension - Inferential": 3,
  "EduTest_Year_6,Text Analysis - Critical": 3,
  "EduTest_Year_6,Language - Vocabulary": 3,
  "EduTest_Year_6,Mathematics - Problem Solving": 4,
  "EduTest_Year_6,Mathematics - Algebra": 3,
  "EduTest_Year_6,Mathematics - Number": 3,
  "EduTest_Year_6,Mathematics - Statistics": 3,
  "EduTest_Year_6,Mathematics - Geometry": 3,
  "EduTest_Year_6,Written Expression - Creative": 3,
  "EduTest_Year_6,Written Expression - Persuasive": 3,
  "EduTest_Year_6,Cognitive - Verbal Relations": 3,
  "EduTest_Year_6,Cognitive - Logical Reasoning": 4,
  "EduTest_Year_6,Cognitive - Classification": 3,
  "EduTest_Year_6,Cognitive - Pattern Recognition": 3,
  "EduTest_Year_6,Cognitive - Abstract": 4,
  "EduTest_Year_6,Cognitive - Spatial": 3,
  "EduTest_Year_6,Cognitive - Visual Processing": 4,

  // NSW Selective Year 6 (Difficulty 3-4)
  "NSW_Selective_Year_6,Text Comprehension - Inferential": 3,
  "NSW_Selective_Year_6,Language - Vocabulary": 3,
  "NSW_Selective_Year_6,Text Analysis - Structure": 3,
  "NSW_Selective_Year_6,Text Analysis - Critical": 3,
  "NSW_Selective_Year_6,Mathematics - Number": 3,
  "NSW_Selective_Year_6,Mathematics - Problem Solving": 4,
  "NSW_Selective_Year_6,Mathematics - Patterns": 3,
  "NSW_Selective_Year_6,Mathematics - Measurement": 3,
  "NSW_Selective_Year_6,Mathematics - Statistics": 3,
  "NSW_Selective_Year_6,Mathematics - Geometry": 3,
  "NSW_Selective_Year_6,Cognitive - Logical Reasoning": 4,
  "NSW_Selective_Year_6,Cognitive - Pattern Recognition": 3,
  "NSW_Selective_Year_6,Cognitive - Verbal Relations": 3,
  "NSW_Selective_Year_6,Cognitive - Visual Processing": 3,
  "NSW_Selective_Year_6,Written Expression - Persuasive": 3,
  "NSW_Selective_Year_6,Written Expression - Creative": 3,

  // VIC Selective Year 8 (Difficulty 4-5)
  "VIC_Selective_Year_8,Language - Vocabulary": 4,
  "VIC_Selective_Year_8,Cognitive - Verbal Relations": 4,
  "VIC_Selective_Year_8,Text Comprehension - Inferential": 4,
  "VIC_Selective_Year_8,Text Analysis - Critical": 4,
  "VIC_Selective_Year_8,Mathematics - Patterns": 4,
  "VIC_Selective_Year_8,Mathematics - Algebra": 4,
  "VIC_Selective_Year_8,Mathematics - Problem Solving": 5,
  "VIC_Selective_Year_8,Mathematics - Statistics": 4,
  "VIC_Selective_Year_8,Cognitive - Spatial": 4,
  "VIC_Selective_Year_8,Cognitive - Pattern Recognition": 4,
  "VIC_Selective_Year_8,Cognitive - Visual Relations": 5,
  "VIC_Selective_Year_8,Cognitive - Logical Reasoning": 5,
  "VIC_Selective_Year_8,Written Expression - Analytical": 4,
  "VIC_Selective_Year_8,Written Expression - Creative": 4
};

// Section to sub-skill mappings for curriculum alignment
export const SECTION_TO_SUB_SKILLS = {
  "Reading": ["Text Comprehension - Explicit", "Text Comprehension - Inferential", "Text Analysis - Structure", "Text Analysis - Critical", "Text Analysis - Literary", "Language - Vocabulary"],
  "Writing": ["Written Expression - Narrative", "Written Expression - Persuasive", "Written Expression - Creative", "Written Expression - Analytical"],
  "Language_Conventions": ["Language - Grammar", "Language - Spelling", "Language - Punctuation"],
  "Numeracy": ["Mathematics - Number", "Mathematics - Algebra", "Mathematics - Patterns", "Mathematics - Measurement", "Mathematics - Geometry", "Mathematics - Statistics", "Mathematics - Problem Solving"],
  "Mathematics": ["Mathematics - Number", "Mathematics - Algebra", "Mathematics - Patterns", "Mathematics - Measurement", "Mathematics - Geometry", "Mathematics - Statistics", "Mathematics - Problem Solving"],
  "Verbal_Reasoning": ["Cognitive - Verbal Relations", "Language - Vocabulary", "Text Comprehension - Inferential", "Cognitive - Logical Reasoning"],
  "Quantitative_Reasoning": ["Mathematics - Number", "Mathematics - Problem Solving", "Mathematics - Patterns", "Mathematics - Algebra"],
  "Numerical_Reasoning": ["Mathematics - Number", "Mathematics - Problem Solving", "Mathematics - Patterns", "Mathematics - Algebra"],
  "Abstract_Reasoning": ["Cognitive - Pattern Recognition", "Cognitive - Abstract", "Cognitive - Visual Relations", "Cognitive - Visual Processing"],
  "Non_verbal_Reasoning": ["Cognitive - Pattern Recognition", "Cognitive - Spatial", "Cognitive - Visual Processing", "Cognitive - Abstract"],
  "Thinking_Skills": ["Cognitive - Logical Reasoning", "Cognitive - Critical Analysis", "Cognitive - Pattern Recognition", "Cognitive - Verbal Relations"],
  "Reading_Comprehension": ["Text Comprehension - Explicit", "Text Comprehension - Inferential", "Text Analysis - Critical", "Language - Vocabulary"],
  "Written_Expression": ["Written Expression - Creative", "Written Expression - Persuasive", "Written Expression - Analytical", "Written Expression - Narrative"]
} as const;

// Australian context topics for question generation
export const AUSTRALIAN_CONTEXT_TOPICS = {
  "informational": [
    "The Great Barrier Reef ecosystem",
    "Australian Federation history",
    "Unique Australian animals",
    "Aboriginal and Torres Strait Islander culture",
    "Australian weather patterns and climate zones",
    "Australian mining industry",
    "Uluru and sacred sites",
    "Australian Parliament and government",
    "States and territories of Australia",
    "Australian agricultural exports"
  ],
  "narrative": [
    "A day at the Melbourne Cricket Ground",
    "Exploring the Australian Outback",
    "School holidays adventure in Tasmania",
    "A visit to Parliament House, Canberra",
    "Surfing at Bondi Beach",
    "Camping in the Blue Mountains",
    "Wildlife spotting in Kakadu National Park",
    "AFL Grand Final experience"
  ],
  "persuasive": [
    "Why Australia should protect its native wildlife",
    "The importance of water conservation in Australia",
    "Benefits of learning Indigenous languages",
    "Supporting Australian-made products",
    "Protecting the Great Barrier Reef",
    "Importance of Anzac Day commemorations"
  ]
} as const;

// Helper functions for curriculum alignment
export const getCurriculumDifficulty = (testType: string, subSkill: string): number => {
  const key = `${testType},${subSkill}`;
  return SUB_SKILL_DIFFICULTIES[key] || 3;
};

export const getSubSkillsForSection = (sectionName: string): readonly string[] => {
  return SECTION_TO_SUB_SKILLS[sectionName as keyof typeof SECTION_TO_SUB_SKILLS] || [];
};

export const isVisualRequired = (subSkill: string): boolean => {
  return UNIFIED_SUB_SKILLS[subSkill as keyof typeof UNIFIED_SUB_SKILLS]?.visual_required || false;
};

export const getTestStructure = (testType: string) => {
  return TEST_STRUCTURES[testType as keyof typeof TEST_STRUCTURES];
};

export const parseQuestionCount = (questionCountStr: string | number): number => {
  if (typeof questionCountStr === 'number') return questionCountStr;
  
  if (questionCountStr.includes('-')) {
    const [min, max] = questionCountStr.split('-').map(Number);
    return max; // Use maximum for comprehensive practice
  }
  
  return parseInt(questionCountStr.toString());
}; 