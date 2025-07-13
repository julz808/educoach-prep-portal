import { WritingAssessmentService } from './writingAssessmentService';

export interface QuestionScore {
  questionId: string;
  questionIndex: number;
  earnedPoints: number;
  maxPoints: number;
  isCorrect: boolean;
  isWriting: boolean;
}

export interface SectionScore {
  sectionName: string;
  earnedPoints: number;
  maxPoints: number;
  percentageScore: number;
  questionCount: number;
}

export interface TestScore {
  totalEarnedPoints: number;
  totalMaxPoints: number;
  percentageScore: number;
  questionScores: QuestionScore[];
  sectionScores: Record<string, SectionScore>;
  answeredQuestions: number;
  totalQuestions: number;
  correctAnswers: number; // Number of questions answered correctly (for accuracy calculation)
}

interface Question {
  id: string;
  text: string;
  options?: string[];
  correctAnswer: number;
  topic: string;
  subSkill: string;
  format?: 'Multiple Choice' | 'Written Response';
  maxPoints: number;
}

export class ScoringService {
  /**
   * Calculate total test score including writing assessments
   * This is the main scoring function that handles both MC and writing questions
   */
  static async calculateTestScore(
    questions: Question[],
    answers: Record<number, number>,
    textAnswers: Record<number, string>,
    sessionId: string
  ): Promise<TestScore> {
    console.log('📊 SCORING: Starting score calculation for session:', sessionId);
    console.log('📊 SCORING: Total questions:', questions.length);
    console.log('📊 SCORING: Questions details:', questions.map(q => ({ 
      id: q.id, 
      maxPoints: q.maxPoints, 
      subSkill: q.subSkill, 
      format: q.format,
      topic: q.topic 
    })));
    console.log('📊 SCORING: Answers provided:', Object.keys(answers).length);
    console.log('📊 SCORING: Text answers provided:', Object.keys(textAnswers).length);

    const questionScores: QuestionScore[] = [];
    const sectionScores: Record<string, SectionScore> = {};
    
    let totalEarnedPoints = 0;
    let totalMaxPoints = 0;
    let answeredQuestions = 0;

    // Process each question
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const maxPoints = question.maxPoints || 1;
      let earnedPoints = 0;
      let isCorrect = false;
      const isWriting = question.format === 'Written Response' || 
                       question.subSkill?.toLowerCase().includes('writing') ||
                       question.topic?.toLowerCase().includes('writing');

      if (isWriting) {
        // Get writing assessment score
        console.log(`📊 SCORING: Processing writing question ${i} (${question.id}), maxPoints: ${maxPoints}`);
        
        // Check if user provided a response
        if (textAnswers[i] && textAnswers[i].trim().length > 0) {
          answeredQuestions++;
          
          try {
            const assessment = await WritingAssessmentService.getWritingAssessment(
              question.id,
              sessionId
            );
            
            if (assessment) {
              earnedPoints = assessment.total_score || 0;
              isCorrect = earnedPoints > 0;
              console.log(`📊 SCORING: Writing question ${i} scored ${earnedPoints}/${maxPoints} from assessment`);
            } else {
              console.log(`📊 SCORING: No assessment found for writing question ${i}, assuming 0 points`);
              // For writing questions without assessment, give 0 points but still count maxPoints
              earnedPoints = 0;
              isCorrect = false;
            }
          } catch (error) {
            console.error(`📊 SCORING: Error getting writing assessment for question ${i}:`, error);
            // On error, still count the question but give 0 points
            earnedPoints = 0;
            isCorrect = false;
          }
        } else {
          console.log(`📊 SCORING: Writing question ${i} not answered`);
        }
      } else {
        // Multiple choice scoring
        if (answers[i] !== undefined) {
          answeredQuestions++;
          if (answers[i] === question.correctAnswer) {
            earnedPoints = maxPoints;
            isCorrect = true;
          }
        }
      }

      // Track total scores
      totalEarnedPoints += earnedPoints;
      totalMaxPoints += maxPoints;

      // Create question score record
      questionScores.push({
        questionId: question.id,
        questionIndex: i,
        earnedPoints,
        maxPoints,
        isCorrect,
        isWriting
      });

      // Track section scores
      const sectionName = question.topic || 'General';
      if (!sectionScores[sectionName]) {
        sectionScores[sectionName] = {
          sectionName,
          earnedPoints: 0,
          maxPoints: 0,
          percentageScore: 0,
          questionCount: 0
        };
      }
      sectionScores[sectionName].earnedPoints += earnedPoints;
      sectionScores[sectionName].maxPoints += maxPoints;
      sectionScores[sectionName].questionCount += 1;
    }

    // Calculate section percentages
    for (const section in sectionScores) {
      const { earnedPoints, maxPoints } = sectionScores[section];
      sectionScores[section].percentageScore = maxPoints > 0 
        ? Math.round((earnedPoints / maxPoints) * 100) 
        : 0;
    }

    const percentageScore = totalMaxPoints > 0 
      ? Math.round((totalEarnedPoints / totalMaxPoints) * 100) 
      : 0;

    console.log('📊 SCORING: Final scores:', {
      totalEarnedPoints,
      totalMaxPoints,
      percentageScore,
      answeredQuestions,
      sectionCount: Object.keys(sectionScores).length
    });

    const correctAnswers = questionScores.filter(q => q.isCorrect).length;

    return {
      totalEarnedPoints,
      totalMaxPoints,
      percentageScore,
      questionScores,
      sectionScores,
      answeredQuestions,
      totalQuestions: questions.length,
      correctAnswers
    };
  }

  /**
   * Get display score for a question (e.g., "24/30" for writing, "1/1" for MC)
   */
  static getQuestionScoreDisplay(questionScore: QuestionScore): string {
    return `${questionScore.earnedPoints}/${questionScore.maxPoints}`;
  }

  /**
   * Calculate score for completed test (for backward compatibility)
   * This is a simpler version that doesn't need writing assessments
   */
  static calculateCompletedTestScore(
    questions: Question[],
    answers: Record<number, number>
  ): { score: number; total: number; percentage: number } {
    let score = 0;
    let total = 0;

    questions.forEach((question, index) => {
      const maxPoints = question.maxPoints || 1;
      total += maxPoints;
      
      // Only count multiple choice for this simple calculation
      if (question.format !== 'Written Response' && answers[index] === question.correctAnswer) {
        score += maxPoints;
      }
    });

    return {
      score,
      total,
      percentage: total > 0 ? Math.round((score / total) * 100) : 0
    };
  }

  /**
   * Get the correct answer count for multiple choice questions only
   * Used for simple statistics where we just need correct count
   */
  static getCorrectAnswerCount(
    questions: Question[],
    answers: Record<number, number>
  ): number {
    return questions.reduce((count, question, index) => {
      if (question.format !== 'Written Response' && answers[index] === question.correctAnswer) {
        return count + 1;
      }
      return count;
    }, 0);
  }
}