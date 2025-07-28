/**
 * CURRICULUM-BASED QUESTION GENERATION ENGINE
 * 
 * This module provides the core generation logic that follows curriculum requirements
 * for passage-to-question ratios, difficulty assignments, and test-specific configurations
 */

import { buildQuestionPrompt, callClaudeAPIWithRetry, parseClaudeResponse } from './claudePrompts';
import { storeQuestion, storePassage } from './supabaseStorage';
import { generatePassage, generateMiniPassage } from './passageGeneration';
import { getTestSectionConfig } from './curriculumBasedConfiguration';
import { getPassageAssignmentForQuestion } from './curriculumBasedPassageSharing';
import { performGapAnalysis, generateGapReport } from './curriculumBasedGapAnalysis';
import { SECTION_TO_SUB_SKILLS } from '../../data/curriculumData';
import { supabase } from '../../integrations/supabase/client';

export interface GenerationOptions {
  testType: string;
  sectionName: string;
  testMode: 'practice' | 'diagnostic' | 'drill';
  targetQuestionsPerTestMode?: number;
  validateOnly?: boolean;
  maxRetries?: number;
}

export interface GenerationResult {
  success: boolean;
  questionsGenerated: number;
  passagesGenerated: number;
  errors: string[];
  warnings: string[];
  duration: number;
  details: {
    questionsByDifficulty: Record<string, number>;
    questionsBySubSkill: Record<string, number>;
    passagesByDifficulty: Record<string, number>;
  };
}

export class CurriculumBasedGenerator {
  private config: any;
  private subSkills: string[];
  private generationContext: any;
  
  constructor(private options: GenerationOptions) {
    this.config = getTestSectionConfig(options.testType, options.sectionName);
    
    const sectionKey = `${options.testType} - ${options.sectionName}`;
    this.subSkills = SECTION_TO_SUB_SKILLS[sectionKey] || [];
    
    this.generationContext = {
      usedTopics: new Set(),
      usedNames: new Set(),
      usedLocations: new Set(),
      usedScenarios: new Set(),
      usedWritingStyles: new Set(),
      questionsGenerated: 0,
      passagesGenerated: 0,
      errorCount: 0,
      startTime: Date.now()
    };
  }

  /**
   * Generate questions and passages based on curriculum requirements
   */
  async generateContent(): Promise<GenerationResult> {
    console.log(`\n🚀 STARTING CURRICULUM-BASED GENERATION`);
    console.log(`Test Type: ${this.options.testType}`);
    console.log(`Section: ${this.options.sectionName}`);
    console.log(`Test Mode: ${this.options.testMode}`);
    console.log(`Reading Section: ${this.config.isReadingSection}`);
    console.log(`Requires Passages: ${this.config.requiresPassages}`);
    
    if (this.config.requiresPassages) {
      console.log(`Passages Required: ${this.config.totalPassages}`);
      console.log(`Questions per Passage: ${this.config.questionsPerPassage}`);
      console.log(`Words per Passage: ${this.config.wordsPerPassage}`);
    }
    
    const errors: string[] = [];
    const warnings: string[] = [];
    
    try {
      // Perform gap analysis
      console.log('\n📊 Performing gap analysis...');
      const gapAnalysis = await performGapAnalysis(this.options.testType, this.options.sectionName);
      
      if (gapAnalysis.totalGaps === 0) {
        console.log('✅ No gaps found - section is complete!');
        return {
          success: true,
          questionsGenerated: 0,
          passagesGenerated: 0,
          errors: [],
          warnings: ['No gaps found - section is complete'],
          duration: Date.now() - this.generationContext.startTime,
          details: {
            questionsByDifficulty: {},
            questionsBySubSkill: {},
            passagesByDifficulty: {}
          }
        };
      }
      
      // Display detailed gap report
      const gapReport = await generateGapReport(this.options.testType, this.options.sectionName);
      console.log(gapReport);
      
      if (this.options.validateOnly) {
        return {
          success: true,
          questionsGenerated: 0,
          passagesGenerated: 0,
          errors: [],
          warnings: ['Validation mode - no questions generated'],
          duration: Date.now() - this.generationContext.startTime,
          details: {
            questionsByDifficulty: {},
            questionsBySubSkill: {},
            passagesByDifficulty: {}
          }
        };
      }
      
      // Generate missing passages first
      console.log('\n📝 Generating missing passages...');
      await this.generateMissingPassages(gapAnalysis.passageGaps);
      
      // Generate missing questions
      console.log('\n❓ Generating missing questions...');
      await this.generateMissingQuestions(gapAnalysis.questionGaps);
      
      // Calculate final statistics
      const details = {
        questionsByDifficulty: this.calculateQuestionsByDifficulty(),
        questionsBySubSkill: this.calculateQuestionsBySubSkill(),
        passagesByDifficulty: this.calculatePassagesByDifficulty()
      };
      
      console.log('\n✅ GENERATION COMPLETE');
      console.log(`Questions Generated: ${this.generationContext.questionsGenerated}`);
      console.log(`Passages Generated: ${this.generationContext.passagesGenerated}`);
      console.log(`Errors: ${this.generationContext.errorCount}`);
      console.log(`Duration: ${Math.round((Date.now() - this.generationContext.startTime) / 1000)}s`);
      
      return {
        success: true,
        questionsGenerated: this.generationContext.questionsGenerated,
        passagesGenerated: this.generationContext.passagesGenerated,
        errors,
        warnings,
        duration: Date.now() - this.generationContext.startTime,
        details
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Generation failed: ${errorMessage}`);
      
      return {
        success: false,
        questionsGenerated: this.generationContext.questionsGenerated,
        passagesGenerated: this.generationContext.passagesGenerated,
        errors,
        warnings,
        duration: Date.now() - this.generationContext.startTime,
        details: {
          questionsByDifficulty: {},
          questionsBySubSkill: {},
          passagesByDifficulty: {}
        }
      };
    }
  }

  /**
   * Generate missing passages based on gap analysis
   */
  private async generateMissingPassages(passageGaps: any[]): Promise<void> {
    for (const gap of passageGaps) {
      console.log(`\n📝 Generating passage ${gap.passageIndex} for ${gap.testMode}`);
      console.log(`   Difficulty: ${gap.difficulty} | Words: ${gap.wordCount} | Questions: ${gap.questionsExpected}`);
      
      try {
        // For reading sections, difficulty is at passage level
        const passageDifficulty = this.config.isReadingSection ? gap.difficulty : 1;
        
        const passageRequest = {
          testType: this.options.testType,
          sectionName: this.options.sectionName,
          testMode: this.options.testMode,
          wordCount: gap.wordCount,
          difficulty: passageDifficulty,
          passageType: 'informational' as const,
          generationContext: this.generationContext,
          isMiniPassage: gap.wordCount <= 150,
          subSkill: this.subSkills[0] || 'DEFAULT'
        };
        
        const passage = await generatePassage(passageRequest);
        
        if (passage) {
          // Store the passage in the database
          try {
            const passageId = await storePassage(
              passage,
              this.options.testType,
              gap.testMode,
              this.options.sectionName
            );
            console.log(`   ✅ Generated and stored passage: "${passage.title}" (ID: ${passageId})`);
            this.generationContext.passagesGenerated++;
          } catch (storeError) {
            console.error(`   ❌ Failed to store passage: ${storeError instanceof Error ? storeError.message : 'Unknown error'}`);
            this.generationContext.errorCount++;
          }
        } else {
          console.log(`   ❌ Failed to generate passage`);
          this.generationContext.errorCount++;
        }
        
        // Small delay between passages
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`   ❌ Error generating passage: ${error instanceof Error ? error.message : 'Unknown error'}`);
        this.generationContext.errorCount++;
      }
    }
  }

  /**
   * Generate missing questions based on gap analysis
   */
  private async generateMissingQuestions(questionGaps: any[]): Promise<void> {
    for (const gap of questionGaps) {
      console.log(`\n❓ Generating questions for: ${gap.subSkill}`);
      console.log(`   Mode: ${gap.testMode} | Difficulty: ${gap.difficulty} | Needed: ${gap.questionsNeeded}`);
      
      for (let i = 0; i < gap.questionsNeeded; i++) {
        try {
          const questionContext = {
            testType: this.options.testType,
            sectionName: this.options.sectionName,
            testMode: gap.testMode,
            subSkill: gap.subSkill,
            difficulty: gap.difficulty,
            questionIndex: i + 1
          };
          
          // Get passage assignment
          const passageAssignment = await getPassageAssignmentForQuestion(questionContext);
          
          // Generate question
          const success = await this.generateSingleQuestion(
            questionContext,
            passageAssignment
          );
          
          if (success) {
            console.log(`   ✅ Generated question ${i + 1}/${gap.questionsNeeded}`);
            this.generationContext.questionsGenerated++;
          } else {
            console.log(`   ❌ Failed to generate question ${i + 1}/${gap.questionsNeeded}`);
            this.generationContext.errorCount++;
          }
          
          // Small delay between questions
          await new Promise(resolve => setTimeout(resolve, 1500));
          
        } catch (error) {
          console.error(`   ❌ Error generating question: ${error instanceof Error ? error.message : 'Unknown error'}`);
          this.generationContext.errorCount++;
        }
      }
    }
  }

  /**
   * Generate a single question with proper passage assignment
   */
  private async generateSingleQuestion(
    context: any,
    passageAssignment: any
  ): Promise<boolean> {
    try {
      let actualPassageId = passageAssignment.passageId;
      
      // If passage assignment indicates we should generate a passage but passageId is null,
      // we need to create a passage first
      if (passageAssignment.shouldGeneratePassage && !actualPassageId) {
        console.log(`   📝 Creating passage for question (${passageAssignment.wordCount} words)`);
        
        const passageRequest = {
          testType: context.testType,
          sectionName: context.sectionName,
          testMode: context.testMode,
          wordCount: passageAssignment.wordCount,
          difficulty: passageAssignment.passageDifficulty,
          passageType: 'informational' as const,
          generationContext: this.generationContext,
          isMiniPassage: passageAssignment.wordCount <= 150,
          subSkill: context.subSkill
        };
        
        // Use appropriate generation function based on passage type
        const passage = passageAssignment.wordCount <= 150 
          ? await generateMiniPassage(passageRequest)
          : await generatePassage(passageRequest);
        
        if (passage) {
          actualPassageId = await storePassage(
            passage,
            context.testType,
            context.testMode,
            context.sectionName
          );
          console.log(`   ✅ Created passage: "${passage.title}" (ID: ${actualPassageId})`);
        } else {
          console.log(`   ❌ Failed to create passage for question`);
          return false;
        }
      }
      
      // For ALL test modes: fetch passage content from database
      // NEW: All passages are now stored in the database (including drill mini-passages)
      let passageContent: string | undefined = undefined;
      
      if (actualPassageId) {
        // Fetch passage content from database for ALL test modes
        const { data: passage, error } = await supabase
          .from('passages')
          .select('content')
          .eq('id', actualPassageId)
          .single();
          
        if (error) {
          console.error(`Failed to fetch passage content: ${error.message}`);
          return false;
        }
        
        passageContent = passage?.content;
        console.log(`   📖 Using passage content (${passageContent?.length || 0} chars) for question generation`);
      }
      
      // Build question prompt
      const questionPrompt = await buildQuestionPrompt({
        testType: context.testType,
        sectionName: context.sectionName,
        subSkill: context.subSkill,
        difficulty: context.difficulty,
        responseType: this.config.isWritingSection ? 'extended_response' : 'multiple_choice',
        generateVisual: false,
        generationContext: this.generationContext,
        passageContent: passageContent
      });
      
      // Call Claude API
      const response = await callClaudeAPIWithRetry(questionPrompt);
      let parsedResponse = parseClaudeResponse(response);
      
      // Two-stage validation: hallucinations + answer verification
      const { validateAndRegenerateIfNeeded } = await import('./questionValidator');
      const regenerationFunction = async () => {
        const retryResponse = await callClaudeAPIWithRetry(questionPrompt);
        return parseClaudeResponse(retryResponse);
      };
      
      const validationResult = await validateAndRegenerateIfNeeded(
        parsedResponse,
        regenerationFunction,
        3 // max retries
      );
      
      parsedResponse = validationResult.questionData;
      
      if (validationResult.wasRegenerated) {
        console.log(`   🔄 Question regenerated ${validationResult.attempts - 1} times`);
        
        const validation = validationResult.finalValidation;
        if (validation.hasHallucinations) {
          console.log(`     - Hallucinations detected: ${validation.hallucinationIndicators.join(', ')}`);
        }
        if (!validation.answerIsCorrect && validation.answerValidationDetails) {
          console.log(`     - Answer verification failed: Expected ${validation.answerValidationDetails.originalAnswer}, got ${validation.answerValidationDetails.independentAnswer}`);
        }
      } else {
        console.log(`   ✅ Question passed validation on first attempt`);
      }
      
      // Store question with passageId (all questions now have passages in database)
      await storeQuestion(
        parsedResponse,
        context.testType,
        context.testMode,
        context.sectionName,
        context.subSkill,
        context.difficulty,
        actualPassageId
      );
      
      console.log(`   ✅ Generated question linked to passage ${actualPassageId}`);
      
      return true;
      
    } catch (error) {
      console.error(`Failed to generate question: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }

  /**
   * Calculate questions by difficulty distribution
   */
  private calculateQuestionsByDifficulty(): Record<string, number> {
    // This would be calculated from actual generated questions
    return {
      'difficulty_1': 0,
      'difficulty_2': 0,
      'difficulty_3': 0
    };
  }

  /**
   * Calculate questions by sub-skill distribution
   */
  private calculateQuestionsBySubSkill(): Record<string, number> {
    // This would be calculated from actual generated questions
    const result: Record<string, number> = {};
    this.subSkills.forEach(subSkill => {
      result[subSkill] = 0;
    });
    return result;
  }

  /**
   * Calculate passages by difficulty distribution
   */
  private calculatePassagesByDifficulty(): Record<string, number> {
    // This would be calculated from actual generated passages
    return {
      'difficulty_1': 0,
      'difficulty_2': 0,
      'difficulty_3': 0
    };
  }

  /**
   * Get year level from test type
   */
  private getYearLevel(testType: string): number {
    if (testType.includes('Year 5')) return 5;
    if (testType.includes('Year 7')) return 7;
    if (testType.includes('Year 9')) return 9;
    return 7;
  }
}

/**
 * Generate questions for a specific test section using curriculum-based approach
 */
export async function generateQuestionsForSection(
  options: GenerationOptions
): Promise<GenerationResult> {
  const generator = new CurriculumBasedGenerator(options);
  return await generator.generateContent();
}