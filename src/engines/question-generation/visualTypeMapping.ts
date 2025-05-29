// Visual Type Mapping System
// Provides Claude API with pools of appropriate visual types for each test type/section/sub-skill combination
// This replaces rigid visual type restrictions with creative freedom within educational bounds

export type VisualType = 
  | 'geometric_grid_diagram'
  | 'bar_chart'
  | 'line_graph'
  | 'pie_chart'
  | 'technical_drawing'
  | 'coordinate_plane'
  | 'pattern_sequence'
  | 'measurement_diagram'
  | 'algebra_illustration'
  | 'statistical_display'
  | 'spatial_puzzle'
  | 'number_line'
  | 'scatter_plot'
  | 'histogram'
  | 'box_plot'
  | 'tree_diagram'
  | 'venn_diagram'
  | 'flowchart'
  | 'network_diagram'
  | 'geometric_construction'
  | 'fraction_model'
  | 'probability_model';

// Comprehensive mapping of test type → section → sub-skill → appropriate visual types
export const VISUAL_TYPE_POOLS = {
  
  // ========== NAPLAN TESTS ==========
  "Year 5 NAPLAN": {
    "Numeracy": {
      "Geometry": [
        'geometric_grid_diagram',
        'measurement_diagram', 
        'geometric_construction',
        'coordinate_plane',
        'technical_drawing'
      ],
      "Statistics and probability": [
        'bar_chart',
        'line_graph',
        'pie_chart',
        'statistical_display',
        'probability_model',
        'histogram'
      ]
    }
  },

  "Year 7 NAPLAN": {
    "Numeracy": {
      "Geometry": [
        'geometric_grid_diagram',
        'measurement_diagram',
        'geometric_construction', 
        'coordinate_plane',
        'technical_drawing'
      ],
      "Statistics and probability": [
        'bar_chart',
        'line_graph',
        'pie_chart',
        'statistical_display',
        'scatter_plot',
        'histogram',
        'box_plot',
        'probability_model'
      ],
      "Geometric reasoning": [
        'geometric_grid_diagram',
        'geometric_construction',
        'measurement_diagram',
        'coordinate_plane',
        'technical_drawing'
      ]
    }
  },

  // ========== ACER SCHOLARSHIP ==========
  "ACER Scholarship (Year 7 Entry)": {
    "Reading Comprehension": {
      "Analysis of written and visual material": [
        'technical_drawing',
        'flowchart',
        'venn_diagram',
        'network_diagram',
        'statistical_display',
        'geometric_grid_diagram'
      ],
      "Poetry and diagram analysis": [
        'technical_drawing',
        'flowchart',
        'pattern_sequence',
        'network_diagram'
      ]
    },
    "Mathematics": {
      "Pattern recognition": [
        'pattern_sequence',
        'number_line',
        'geometric_grid_diagram',
        'statistical_display',
        'algebra_illustration'
      ],
      "Spatial reasoning": [
        'geometric_grid_diagram',
        'spatial_puzzle',
        'coordinate_plane',
        'geometric_construction',
        'technical_drawing'
      ]
    },
    "Thinking Skills": {
      "Abstract reasoning": [
        'pattern_sequence',
        'spatial_puzzle',
        'geometric_grid_diagram',
        'network_diagram',
        'venn_diagram'
      ],
      "Visual problem-solving": [
        'spatial_puzzle',
        'geometric_grid_diagram',
        'pattern_sequence',
        'flowchart',
        'technical_drawing'
      ],
      "Spatial visualization": [
        'spatial_puzzle',
        'geometric_grid_diagram',
        'geometric_construction',
        'coordinate_plane',
        'technical_drawing'
      ],
      "Pattern identification": [
        'pattern_sequence',
        'number_line',
        'statistical_display',
        'geometric_grid_diagram'
      ]
    }
  },

  // ========== EDUTEST SCHOLARSHIP ==========
  "EduTest Scholarship (Year 7 Entry)": {
    "Mathematics": {
      "Space and geometry": [
        'geometric_grid_diagram',
        'geometric_construction',
        'coordinate_plane',
        'spatial_puzzle',
        'measurement_diagram',
        'technical_drawing'
      ],
      "Data and statistics": [
        'bar_chart',
        'line_graph',
        'pie_chart',
        'statistical_display',
        'scatter_plot',
        'histogram',
        'box_plot'
      ]
    },
    "Numerical Reasoning": {
      "Data interpretation": [
        'bar_chart',
        'line_graph',
        'pie_chart',
        'statistical_display',
        'scatter_plot',
        'histogram'
      ]
    }
  },

  // ========== NSW SELECTIVE ==========
  "NSW Selective Entry (Year 7 Entry)": {
    "Mathematical Reasoning": {
      "Spatial understanding": [
        'geometric_grid_diagram',
        'spatial_puzzle',
        'coordinate_plane',
        'geometric_construction',
        'measurement_diagram',
        'technical_drawing'
      ],
      "Pattern identification": [
        'pattern_sequence',
        'number_line',
        'algebra_illustration',
        'geometric_grid_diagram',
        'statistical_display'
      ]
    }
  },

  // ========== VIC SELECTIVE ==========
  "VIC Selective Entry (Year 9 Entry)": {
    "Mathematical Reasoning": {
      "Spatial problem solving": [
        'geometric_grid_diagram',
        'spatial_puzzle',
        'coordinate_plane',
        'geometric_construction',
        'measurement_diagram',
        'technical_drawing'
      ]
    },
    "Quantitative Reasoning": {
      // Note: VIC Quantitative Reasoning typically doesn't require visuals per curriculum
      // but if needed, these would be appropriate:
      "Mathematical reasoning": [
        'number_line',
        'algebra_illustration',
        'coordinate_plane',
        'statistical_display'
      ]
    }
  }

} as const;

// Enhanced function to get visual type pools for a specific context
export function getVisualTypePool(
  testType: string, 
  sectionName: string, 
  subSkill: string
): VisualType[] {
  const testMapping = VISUAL_TYPE_POOLS[testType as keyof typeof VISUAL_TYPE_POOLS];
  if (!testMapping) {
    return getDefaultVisualTypes(subSkill);
  }

  const sectionMapping = testMapping[sectionName as keyof typeof testMapping];
  if (!sectionMapping) {
    return getDefaultVisualTypes(subSkill);
  }

  const subSkillPool = sectionMapping[subSkill as keyof typeof sectionMapping];
  if (!subSkillPool) {
    return getDefaultVisualTypes(subSkill);
  }

  return subSkillPool as VisualType[];
}

// Fallback function for unmapped combinations
function getDefaultVisualTypes(subSkill: string): VisualType[] {
  // Use intelligent defaults based on sub-skill keywords
  if (subSkill.toLowerCase().includes('geometry') || subSkill.toLowerCase().includes('spatial')) {
    return ['geometric_grid_diagram', 'coordinate_plane', 'measurement_diagram', 'technical_drawing'];
  }
  
  if (subSkill.toLowerCase().includes('statistics') || subSkill.toLowerCase().includes('data')) {
    return ['bar_chart', 'line_graph', 'pie_chart', 'statistical_display', 'histogram'];
  }
  
  if (subSkill.toLowerCase().includes('pattern')) {
    return ['pattern_sequence', 'number_line', 'algebra_illustration'];
  }
  
  if (subSkill.toLowerCase().includes('algebra') || subSkill.toLowerCase().includes('coordinate')) {
    return ['coordinate_plane', 'algebra_illustration', 'number_line'];
  }
  
  // Generic fallback
  return ['technical_drawing', 'geometric_grid_diagram', 'statistical_display'];
}

// Function to get a creative prompt for Claude including the visual type pool
export function getVisualGenerationPrompt(
  testType: string,
  sectionName: string, 
  subSkill: string,
  questionContext: string,
  difficulty: number,
  yearLevel: string,
  questionText?: string
): string {
  const visualPool = getVisualTypePool(testType, sectionName, subSkill);
  
  return `You are generating an educational visual for a ${testType} assessment.

CONTEXT:
- Section: ${sectionName}
- Sub-skill: ${subSkill}
- Year Level: ${yearLevel}
- Difficulty: ${difficulty}/3
- Question Context: ${questionContext}
${questionText ? `- Specific Question: ${questionText}` : ''}

AVAILABLE VISUAL TYPES:
Choose the most appropriate type from: ${visualPool.join(', ')}

REQUIREMENTS:
- Use UK spelling in all text labels
- Professional test paper appearance
- Age-appropriate for ${yearLevel} students
- Clean, functional design (no decorative elements)
- Support the specific learning objective: ${subSkill}

CREATIVE FREEDOM:
- Choose the best visual type from the available options
- Determine appropriate data values and ranges
- Design layout and styling within test standards
- Create meaningful labels and annotations
- Select appropriate colors from the test palette

Generate a complete visual specification that Claude's web app can use to create an accurate, educational visual.`;
}

// Helper function to validate if a visual type is in the pool
export function isVisualTypeValid(
  visualType: VisualType,
  testType: string,
  sectionName: string,
  subSkill: string
): boolean {
  const pool = getVisualTypePool(testType, sectionName, subSkill);
  return pool.includes(visualType);
} 