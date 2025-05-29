// Visual Image Generation Engine (Engine 2)
// Converts educational visual specifications from Engine 1 into PNG images
// Uses Claude 4 Sonnet API to generate HTML/CSS/JavaScript artifacts

export { processVisualQuestions, generateVisualFromSpec } from './visualImageGenerationEngine';

// Re-export types for convenience
export type { VisualSpecification, VisualData, VisualType } from '../../types/visual'; 