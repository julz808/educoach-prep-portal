// EduCourse Engines - Centralized Export
// Engine 1: Question Generation (creates visual specifications)
// Engine 2: Visual Image Generation (converts specifications to PNG images)

export * from './question-generation/questionGenerationEngine';
export { processVisualQuestions, generateVisualFromSpec } from './visual-image-generation/visualImageGenerationEngine';

// Re-export visual types for convenience
export type { VisualSpecification, VisualData, VisualType } from '../types/visual'; 