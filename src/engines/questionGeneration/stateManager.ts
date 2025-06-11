// ============================================================================
// GENERATION STATE MANAGER
// ============================================================================

import { GenerationState } from './types.ts';

// In-memory state storage for generation sessions
const generationStates = new Map<string, GenerationState>();

/**
 * Initialize a new generation state for a session
 */
export function initializeGenerationState(sessionId: string): GenerationState {
  const state: GenerationState = {
    sessionId,
    status: 'initializing',
    startTime: Date.now(),
    stage: 'initializing',
    progress: {
      stage: 'initializing',
      completed: 0,
      total: 0,
      currentOperation: 'Initializing',
      currentItem: '',
      stageProgress: 0,
      overallProgress: 0,
      estimatedTimeRemaining: 0,
      errors: [],
      warnings: []
    },
    context: {
      sessionId,
      testType: '',
      usedTopics: new Set(),
      usedNames: new Set(),
      usedLocations: new Set(),
      usedScenarios: new Set(),
      passageBank: [],
      questionBank: [],
      currentDifficulty: 1,
      difficultyDistribution: {
        easy: 0,
        medium: 0,
        hard: 0
      },
      visualsGenerated: 0,
      lastUpdate: new Date().toISOString()
    },
    errors: [],
    warnings: []
  };
  
  generationStates.set(sessionId, state);
  return state;
}

/**
 * Get the generation state for a session
 */
export function getGenerationState(sessionId: string): GenerationState | undefined {
  return generationStates.get(sessionId);
}

/**
 * Update the progress of a generation session
 */
export function updateGenerationProgress(sessionId: string, progress: Partial<GenerationState['progress']>): void {
  const state = generationStates.get(sessionId);
  if (state) {
    state.progress = { ...state.progress, ...progress };
    generationStates.set(sessionId, state);
  }
}

/**
 * Update the status of a generation session
 */
export function updateGenerationStatus(sessionId: string, status: GenerationState['status']): void {
  const state = generationStates.get(sessionId);
  if (state) {
    state.status = status;
    generationStates.set(sessionId, state);
  }
}

/**
 * Clean up old generation states (optional cleanup function)
 */
export function cleanupOldStates(maxAgeMs: number = 24 * 60 * 60 * 1000): void {
  const now = Date.now();
  for (const [sessionId, state] of generationStates.entries()) {
    if (now - state.startTime > maxAgeMs) {
      generationStates.delete(sessionId);
    }
  }
}

/**
 * Adds error to generation state
 */
export function addGenerationError(sessionId: string, error: string): void {
  const state = generationStates.get(sessionId);
  if (state) {
    if (!state.errors) {
      state.errors = [];
    }
    state.errors.push(error);
  }
}

/**
 * Adds warning to generation state
 */
export function addGenerationWarning(sessionId: string, warning: string): void {
  const state = generationStates.get(sessionId);
  if (state) {
    if (!state.warnings) {
      state.warnings = [];
    }
    state.warnings.push(warning);
  }
}

/**
 * Removes generation state (cleanup)
 */
export function removeGenerationState(sessionId: string): void {
  generationStates.delete(sessionId);
}

/**
 * Gets all active generation sessions
 */
export function getActiveGenerations(): GenerationState[] {
  return Array.from(generationStates.values());
} 