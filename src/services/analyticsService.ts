import { supabase } from '@/integrations/supabase/client';
import { TEST_STRUCTURES } from '@/data/curriculumData';

// Map frontend product IDs to database product types
const PRODUCT_ID_TO_TYPE: Record<string, string> = {
  'year-5-naplan': 'Year 5 NAPLAN',
  'year-7-naplan': 'Year 7 NAPLAN',
  'acer-year-7': 'ACER Scholarship (Year 7 Entry)',
  'edutest-year-7': 'EduTest Scholarship (Year 7 Entry)',
  'nsw-selective': 'NSW Selective Entry (Year 7 Entry)',
  'vic-selective': 'VIC Selective Entry (Year 9 Entry)',
};

// Map database section names to curriculumData.ts names to ensure consistency
function mapSectionNameToCurriculum(sectionName: string, productType: string): string {
  // Section name mappings for each product based on curriculumData.ts
  const sectionMappings: Record<string, Record<string, string>> = {
    'EduTest Scholarship (Year 7 Entry)': {
      'Reading Reasoning': 'Reading Comprehension',
      'General Ability - Quantitative': 'Numerical Reasoning',
      'General Ability - Verbal': 'Verbal Reasoning',
      'Mathematics Reasoning': 'Mathematics',
      'Writing': 'Written Expression',
      // Keep correct names as-is
      'Reading Comprehension': 'Reading Comprehension',
      'Numerical Reasoning': 'Numerical Reasoning', 
      'Verbal Reasoning': 'Verbal Reasoning',
      'Mathematics': 'Mathematics',
      'Written Expression': 'Written Expression'
    },
    'ACER Scholarship (Year 7 Entry)': {
      'Mathematics Reasoning': 'Mathematics',
      'General Ability - Verbal': 'Humanities',
      'Writing': 'Written Expression',
      // Keep correct names as-is
      'Mathematics': 'Mathematics',
      'Humanities': 'Humanities',
      'Written Expression': 'Written Expression'
    },
    'NSW Selective Entry (Year 7 Entry)': {
      'Reading Reasoning': 'Reading',
      'Mathematics Reasoning': 'Mathematical Reasoning',
      'General Ability - Verbal': 'Thinking Skills',
      // Keep correct names as-is
      'Reading': 'Reading',
      'Mathematical Reasoning': 'Mathematical Reasoning',
      'Thinking Skills': 'Thinking Skills',
      'Writing': 'Writing'
    },
    'VIC Selective Entry (Year 9 Entry)': {
      'Reading Reasoning': 'Verbal Reasoning',
      'Mathematics Reasoning': 'Numerical Reasoning',
      'General Ability - Verbal': 'Verbal Reasoning',
      'General Ability - Quantitative': 'Numerical Reasoning',
      // Keep correct names as-is
      'Verbal Reasoning': 'Verbal Reasoning',
      'Numerical Reasoning': 'Numerical Reasoning',
      'Writing': 'Writing'
    },
    'Year 5 NAPLAN': {
      'Reading Reasoning': 'Reading',
      'Mathematics Reasoning': 'Numeracy Calculator',
      'General Ability - Quantitative': 'Numeracy No Calculator',
      'Language': 'Language Conventions',
      // Keep correct names as-is
      'Reading': 'Reading',
      'Language Conventions': 'Language Conventions',
      'Numeracy No Calculator': 'Numeracy No Calculator',
      'Numeracy Calculator': 'Numeracy Calculator',
      'Writing': 'Writing'
    },
    'Year 7 NAPLAN': {
      'Reading Reasoning': 'Reading',
      'Mathematics Reasoning': 'Numeracy Calculator',
      'General Ability - Quantitative': 'Numeracy No Calculator',
      'Language': 'Language Conventions',
      // Keep correct names as-is
      'Reading': 'Reading',
      'Language Conventions': 'Language Conventions',
      'Numeracy No Calculator': 'Numeracy No Calculator',
      'Numeracy Calculator': 'Numeracy Calculator',
      'Writing': 'Writing'
    }
  };

  const productMappings = sectionMappings[productType];
  if (productMappings && productMappings[sectionName]) {
    return productMappings[sectionName];
  }
  
  // Return original name if no mapping found
  return sectionName;
}

// Helper function to get total questions available for a practice test
async function getTotalQuestionsAvailable(productType: string, testType: string, testNumber?: number) {
  try {
    const testMode = testNumber ? `${testType}_${testNumber}` : testType;
    
    const { data: allQuestions, error } = await supabase
      .from('questions')
      .select(`
        id,
        section_name,
        sub_skill,
        max_points
      `)
      .eq('product_type', productType)
      .eq('test_mode', testMode);
    
    if (error) {
      console.error('❌ Error fetching total questions:', error);
      return { sectionTotals: new Map(), subSkillTotals: new Map(), totalAvailable: 0 };
    }
    
    const sectionTotals = new Map<string, number>();
    const subSkillTotals = new Map<string, { total: number, section: string }>();
    
    // First, count questions by section and create a mapping of sub-skills to sections
    const sectionSubSkillCounts = new Map<string, Map<string, number>>();
    
    allQuestions?.forEach(question => {
      const sectionName = question.section_name || 'Unknown Section';
      const subSkillName = question.sub_skill || 'Unknown Sub-skill';
      const points = question.max_points || 1; // Use max_points, default to 1 if not set
      
      // Sum max_points by section instead of counting questions
      sectionTotals.set(sectionName, (sectionTotals.get(sectionName) || 0) + points);
      
      // Sum max_points by sub-skill within each section
      if (!sectionSubSkillCounts.has(sectionName)) {
        sectionSubSkillCounts.set(sectionName, new Map());
      }
      const sectionMap = sectionSubSkillCounts.get(sectionName)!;
      sectionMap.set(subSkillName, (sectionMap.get(subSkillName) || 0) + points);
    });
    
    // Build sub-skill totals from section-specific points
    sectionSubSkillCounts.forEach((subSkillMap, sectionName) => {
      subSkillMap.forEach((points, subSkillName) => {
        subSkillTotals.set(subSkillName, { 
          total: points, 
          section: sectionName 
        });
      });
    });
    
    // Calculate total max_points across all questions
    const totalMaxPoints = allQuestions?.reduce((sum, q) => sum + (q.max_points || 1), 0) || 0;
    
    return { sectionTotals, subSkillTotals, totalAvailable: totalMaxPoints };
  } catch (error) {
    console.error('❌ Error in getTotalQuestionsAvailable:', error);
    return { sectionTotals: new Map(), subSkillTotals: new Map(), totalAvailable: 0 };
  }
}

// Get real test data using unified approach for all test types (diagnostic, practice, drill)
async function getRealTestData(userId: string, productType: string, sessionId: string, testType: string = 'practice', testNumber?: number) {
  console.log(`\n🔄 ${testType.toUpperCase()} INSIGHTS: Getting real data for session ${sessionId}`);
  try {
    // Get ALL question attempts for this specific session
    let { data: questionAttempts, error: attemptsError } = await supabase
      .from('question_attempt_history')
      .select(`
        question_id,
        user_answer,
        is_correct,
        time_spent_seconds,
        session_id,
        user_id
      `)
      .eq('user_id', userId)
      .eq('session_id', sessionId);
    
    if (attemptsError) {
      console.error('❌ Error fetching question attempts:', attemptsError);
      return null;
    }
    
    if (!questionAttempts || questionAttempts.length === 0) {
      console.log(`⚠️ No question attempts found for session ${sessionId}`);
      // Return null for old sessions without individual question attempts
      return null;
    }
    
    // Get total questions available for this test to calculate correct denominators
    const { sectionTotals, subSkillTotals, totalAvailable } = await getTotalQuestionsAvailable(productType, testType, testNumber);
    
    // CRITICAL FIX: If questions table has no data, fall back to session-based calculations
    const useSessionBasedCalculation = totalAvailable === 0;
    if (useSessionBasedCalculation) {
      console.log('⚠️ Questions table has no data for this test mode, using session-based calculation fallback');
    }
    
    // Get question details for all attempted questions
    const questionIds = questionAttempts.map(attempt => attempt.question_id);
    let { data: questionDetails, error: questionsError } = await supabase
      .from('questions')
      .select(`
        id,
        section_name,
        sub_skill,
        test_mode,
        max_points
      `)
      .in('id', questionIds);
    
    if (questionsError) {
      console.error('❌ Error fetching question details:', questionsError);
      return null;
    }
    
    // Create a map for quick lookup
    const questionDetailsMap = new Map();
    questionDetails?.forEach(q => {
      questionDetailsMap.set(q.id, q);
    });
    
    // Group question attempts by sub-skill for analysis
    const subSkillStats = new Map();
    const sectionStats = new Map();
    
    let totalQuestionsAttempted = 0;
    let totalQuestionsCorrect = 0;
    let totalMaxPoints = 0;
    let totalEarnedPoints = 0;
    
    // Check for writing sections in this session and get writing assessments
    const writingSections = new Set();
    const writingAssessmentsBySection = new Map();
    
    // Find unique writing sections
    questionAttempts.forEach(attempt => {
      const question = questionDetailsMap.get(attempt.question_id);
      if (question) {
        const sectionName = question.section_name || 'Unknown Section';
        const isWritingSection = sectionName.toLowerCase().includes('writing') || 
                                sectionName.toLowerCase().includes('written expression');
        if (isWritingSection) {
          writingSections.add(sectionName);
        }
      }
    });
    
    // Get writing assessments for writing sections
    if (writingSections.size > 0) {
      console.log(`✍️ Found ${writingSections.size} writing sections, fetching writing assessments for session ${sessionId}`);
      const { data: writingAssessments, error: writingError } = await supabase
        .from('writing_assessments')
        .select('total_score, max_possible_score, percentage_score, question_id')
        .eq('session_id', sessionId);
      
      if (!writingError && writingAssessments && writingAssessments.length > 0) {
        console.log(`✍️ Found ${writingAssessments.length} writing assessments for session ${sessionId}`);
        
        // Group assessments by section
        writingAssessments.forEach(assessment => {
          // Find which section this assessment belongs to
          const question = questionDetailsMap.get(assessment.question_id);
          if (question) {
            const sectionName = question.section_name;
            if (!writingAssessmentsBySection.has(sectionName)) {
              writingAssessmentsBySection.set(sectionName, []);
            }
            writingAssessmentsBySection.get(sectionName).push(assessment);
          }
        });
        
        console.log(`✍️ Writing assessments grouped by section:`, 
          Array.from(writingAssessmentsBySection.entries()).map(([section, assessments]) => 
            ({ section, count: assessments.length, totalScore: assessments.reduce((sum, a) => sum + (a.total_score || 0), 0) })
          )
        );
      }
    }

    questionAttempts.forEach(attempt => {
      const question = questionDetailsMap.get(attempt.question_id);
      if (!question) {
        console.warn(`⚠️ No question details found for question ${attempt.question_id}`);
        return;
      }
      
      const subSkillName = question.sub_skill || 'Unknown Sub-skill';
      const sectionName = question.section_name || 'Unknown Section';
      let maxPoints = question.max_points || 1;
      let earnedPoints = attempt.is_correct ? maxPoints : 0;
      
      // For writing questions, use actual assessment scores
      const isWritingQuestion = sectionName.toLowerCase().includes('writing') || 
                               sectionName.toLowerCase().includes('written expression');
      if (isWritingQuestion && writingAssessmentsBySection.has(sectionName)) {
        const sectionAssessments = writingAssessmentsBySection.get(sectionName);
        const questionAssessment = sectionAssessments.find(a => a.question_id === attempt.question_id);
        if (questionAssessment) {
          earnedPoints = questionAssessment.total_score || 0;
          maxPoints = questionAssessment.max_possible_score || maxPoints;
        }
      }

      // Track overall totals
      totalQuestionsAttempted++;
      totalMaxPoints += maxPoints;
      totalEarnedPoints += earnedPoints;
      if (attempt.is_correct) {
        totalQuestionsCorrect++;
      }
      
      // Track by sub-skill
      if (!subSkillStats.has(subSkillName)) {
        subSkillStats.set(subSkillName, {
          subSkillName,
          sectionName,
          questionsTotal: 0,
          questionsAttempted: 0,
          questionsCorrect: 0,
          maxPoints: 0,
          earnedPoints: 0
        });
      }

      const subSkillData = subSkillStats.get(subSkillName);
      subSkillData.questionsAttempted++;
      subSkillData.maxPoints += maxPoints;
      subSkillData.earnedPoints += earnedPoints;
      if (attempt.is_correct) {
        subSkillData.questionsCorrect++;
      }
      
      // Track by section
      if (!sectionStats.has(sectionName)) {
        sectionStats.set(sectionName, {
          sectionName,
          questionsTotal: 0,
          questionsAttempted: 0,
          questionsCorrect: 0,
          maxPoints: 0,
          earnedPoints: 0
        });
      }
      
      const sectionData = sectionStats.get(sectionName);
      sectionData.questionsAttempted++;
      sectionData.maxPoints += maxPoints;
      sectionData.earnedPoints += earnedPoints;
      if (attempt.is_correct) {
        sectionData.questionsCorrect++;
      }
    });
    
    // Update totals to account for writing sections with assessments
    writingAssessmentsBySection.forEach((assessments, sectionName) => {
      const totalPossibleScore = assessments.reduce((sum, a) => sum + (a.max_possible_score || 0), 0);
      const totalEarnedScore = assessments.reduce((sum, a) => sum + (a.total_score || 0), 0);
      
      console.log(`✍️ Updating totals for writing section ${sectionName}: earned=${totalEarnedScore}, possible=${totalPossibleScore}`);
      
      // Find the section's stats to subtract the question-level counts
      const sectionData = sectionStats.get(sectionName);
      if (sectionData) {
        // Subtract the question-level counts and add the assessment-level counts
        totalQuestionsCorrect -= sectionData.questionsCorrect;
        totalQuestionsCorrect += totalEarnedScore;
        
        totalMaxPoints -= sectionData.maxPoints;
        totalMaxPoints += totalPossibleScore;
        
        totalEarnedPoints -= sectionData.earnedPoints;
        totalEarnedPoints += totalEarnedScore;
        
        console.log(`✍️ Updated totals after writing section adjustment:`, {
          totalQuestionsCorrect,
          totalMaxPoints,
          totalEarnedPoints
        });
      }
    });
    
    // Build section breakdown
    const sectionBreakdown = Array.from(sectionStats.values()).map(section => {
      const totalQuestions = sectionTotals.get(section.sectionName) || section.questionsAttempted;
      
      // Check if this is a writing section with assessments
      const isWritingSection = section.sectionName.toLowerCase().includes('writing') || 
                              section.sectionName.toLowerCase().includes('written expression');
      const writingAssessments = writingAssessmentsBySection.get(section.sectionName);
      
      let score, accuracy, questionsCorrect, actualTotalQuestions, questionsAttempted;
      
      if (isWritingSection && writingAssessments && writingAssessments.length > 0) {
        // For writing sections with assessments, use the actual weighted scores
        const totalPossibleScore = writingAssessments.reduce((sum, a) => sum + (a.max_possible_score || 0), 0);
        const totalEarnedScore = writingAssessments.reduce((sum, a) => sum + (a.total_score || 0), 0);
        
        // Use actual point values for writing sections
        actualTotalQuestions = totalPossibleScore;
        questionsAttempted = totalPossibleScore; // All questions attempted if assessments exist
        questionsCorrect = totalEarnedScore;
        
        score = totalPossibleScore > 0 ? Math.round((totalEarnedScore / totalPossibleScore) * 100) : 0;
        accuracy = score; // For writing, score and accuracy are the same
        
        console.log(`✍️ Writing section ${section.sectionName} - Using assessment scores: ${totalEarnedScore}/${totalPossibleScore} = ${score}% (assessments: ${writingAssessments.length})`);
      } else {
        // For non-writing sections, use simple percentage (questionsCorrect/questionsTotal)
        // This matches user expectations: 3/60 = 5%, not weighted point values
        score = totalQuestions > 0 ? Math.round((section.questionsCorrect / totalQuestions) * 100) : 0;
        accuracy = section.questionsAttempted > 0 ? Math.round((section.questionsCorrect / section.questionsAttempted) * 100) : 0;
        questionsCorrect = section.questionsCorrect;
        actualTotalQuestions = totalQuestions;
        questionsAttempted = section.questionsAttempted;
        
        }
      
      return {
        sectionName: mapSectionNameToCurriculum(section.sectionName, productType),
        score,
        accuracy,
        questionsCorrect,
        questionsTotal: actualTotalQuestions,
        questionsAttempted
      };
    });

    // Build sub-skill breakdown
    const subSkillBreakdown = Array.from(subSkillStats.values()).map(subSkill => {
      // For practice tests, use max points as the total (like diagnostic) to properly handle written expression
      const totalQuestions = subSkill.maxPoints || subSkillTotals.get(subSkill.subSkillName)?.total || subSkill.questionsAttempted;

      // Calculate score using max points (earned points / max points)
      const score = subSkill.maxPoints > 0 ? Math.round((subSkill.earnedPoints / subSkill.maxPoints) * 100) : 0;
      
      // For accuracy: use max points for written expression, attempted for others
      const sectionName = mapSectionNameToCurriculum(subSkill.sectionName, productType);
      const isWritingSection = sectionName.toLowerCase().includes('written expression') || 
                              sectionName.toLowerCase().includes('writing') ||
                              subSkill.subSkillName.toLowerCase().includes('writing') ||
                              subSkill.subSkillName.toLowerCase().includes('narrative');
      
      const accuracy = isWritingSection 
        ? score // For writing, accuracy equals score (both use max points)
        : (subSkill.questionsAttempted > 0 ? Math.round((subSkill.questionsCorrect / subSkill.questionsAttempted) * 100) : 0);
      
      return {
        sectionName,
        subSkillName: subSkill.subSkillName,
        score,
        accuracy,
        questionsCorrect: subSkill.earnedPoints || subSkill.questionsCorrect, // Use earned points for written expression
        questionsTotal: totalQuestions,
        questionsAttempted: subSkill.questionsAttempted
      };
    });
    
    // Build section scores map
    const sectionScores = Object.fromEntries(
      sectionBreakdown.map(section => [section.sectionName, section.score])
    );
    
    // Calculate overall score using max points (to properly account for written expression)
    const overallScore = totalMaxPoints > 0 ? Math.round((totalEarnedPoints / totalMaxPoints) * 100) : 0;
    // For accuracy: use earned points / max points to properly account for written expression
    const overallAccuracy = totalMaxPoints > 0 ? Math.round((totalEarnedPoints / totalMaxPoints) * 100) : 0;
    
    // Calculate correct total questions for display
    const displayTotalQuestions = useSessionBasedCalculation 
      ? totalQuestionsAttempted  // For session-based, use attempted as total
      : (totalAvailable || totalQuestionsAttempted); // For questions table, use available or attempted
    
    return {
      totalQuestions: displayTotalQuestions,
      questionsAttempted: totalQuestionsAttempted,
      questionsCorrect: totalQuestionsCorrect,
      totalMaxPoints,
      totalEarnedPoints,
      overallScore,
      overallAccuracy,
      sectionScores,
      sectionBreakdown,
      subSkillBreakdown,
    };
    
  } catch (error) {
    console.error(`❌ Error in getRealTestData for ${testType}:`, error);
    console.error(`❌ Error details:`, {
      name: error?.name,
      message: error?.message,
      stack: error?.stack
    });
    return null;
  }
}

// Fallback function to get practice test data from session data when no question attempts exist
async function getSessionBasedPracticeData(userId: string, productType: string, testNumber: number, session: any) {
  try {
    const practiceTestMode = `practice_${testNumber}`;
    
    // Get the questions for this practice test mode to have structure info
    let { data: practiceQuestions, error: questionsError } = await supabase
      .from('questions')
      .select(`
        id,
        section_name,
        sub_skill,
        test_mode,
        format,
        max_points,
        correct_answer,
        sub_skills!inner(
          name,
          test_sections!inner(section_name)
        )
      `)
      .eq('product_type', productType)
      .eq('test_mode', practiceTestMode);
    
    if (questionsError || !practiceQuestions || practiceQuestions.length === 0) {
      console.error('❌ Error fetching practice questions:', questionsError);
      // Fallback to generic practice mode
      const { data: genericQuestions, error: genericError } = await supabase
        .from('questions')
        .select(`
          id,
          section_name,
          sub_skill,
          test_mode,
          format,
          max_points,
          correct_answer,
          sub_skills!inner(
            name,
            test_sections!inner(section_name)
          )
        `)
        .eq('product_type', productType)
        .eq('test_mode', 'practice');
      
      if (genericError || !genericQuestions || genericQuestions.length === 0) {
        console.error('❌ No practice questions found at all');
        return null;
      }
      
      practiceQuestions = genericQuestions;
    }
    
    // Use session data for calculations
    const questionOrder = session.question_order || [];
    const answersData = session.answers_data || {};
    const totalQuestions = session.total_questions || questionOrder.length || practiceQuestions.length;
    const questionsAnswered = session.questions_answered || Object.keys(answersData).length;
    const correctAnswers = session.correct_answers || 0;
    const finalScore = session.final_score || 0;
    
    // For existing sessions without detailed data, use the practice questions structure
    const totalMaxPoints = practiceQuestions.reduce((sum, q) => sum + (q.max_points || 1), 0);
    const estimatedCorrectPoints = Math.round((finalScore / 100) * totalMaxPoints);
    
    // Create section breakdown using available questions and session score
    const sectionStats = new Map();
    
    // Group questions by section
    practiceQuestions.forEach(question => {
      const sectionName = question.section_name || question.sub_skills?.test_sections?.section_name || 'Unknown Section';
      const maxPoints = question.max_points || 1;
      
      if (!sectionStats.has(sectionName)) {
        sectionStats.set(sectionName, {
          sectionName,
          totalQuestions: 0,
          maxPoints: 0,
          questionIds: []
        });
      }
      
      const stats = sectionStats.get(sectionName);
      stats.totalQuestions++;
      stats.maxPoints += maxPoints;
      stats.questionIds.push(question.id);
    });
    
    // Distribute the session's performance across sections proportionally
    const sectionBreakdown = Array.from(sectionStats.values()).map(section => {
      const sectionProportion = section.maxPoints / totalMaxPoints;
      const sectionCorrectPoints = Math.round(estimatedCorrectPoints * sectionProportion);
      const estimatedAttempted = Math.round(questionsAnswered * sectionProportion);
      const score = section.maxPoints > 0 ? Math.round((sectionCorrectPoints / section.maxPoints) * 100) : 0;
      const accuracy = estimatedAttempted > 0 ? Math.round((sectionCorrectPoints / estimatedAttempted) * 100) : 0;
      
      return {
        sectionName: mapSectionNameToCurriculum(section.sectionName, productType),
        score,
        accuracy,
        questionsCorrect: sectionCorrectPoints,
        questionsTotal: section.maxPoints,
        questionsAttempted: estimatedAttempted
      };
    });
    
    // Create sub-skill breakdown
    const subSkillStats = new Map();
    
    practiceQuestions.forEach(question => {
      const subSkillName = question.sub_skills?.name || question.sub_skill || 'Unknown Sub-skill';
      const sectionName = question.section_name || question.sub_skills?.test_sections?.section_name || 'Unknown Section';
      const maxPoints = question.max_points || 1;
      
      if (!subSkillStats.has(subSkillName)) {
        subSkillStats.set(subSkillName, {
          subSkillName,
          sectionName,
          totalQuestions: 0,
          maxPoints: 0
        });
      }
      
      const stats = subSkillStats.get(subSkillName);
      stats.totalQuestions++;
      stats.maxPoints += maxPoints;
    });
    
    const subSkillBreakdown = Array.from(subSkillStats.values()).map(subSkill => {
      const subSkillProportion = subSkill.maxPoints / totalMaxPoints;
      const subSkillCorrectPoints = Math.round(estimatedCorrectPoints * subSkillProportion);
      const estimatedAttempted = Math.round(questionsAnswered * subSkillProportion);
      const score = subSkill.maxPoints > 0 ? Math.round((subSkillCorrectPoints / subSkill.maxPoints) * 100) : 0;
      const accuracy = estimatedAttempted > 0 ? Math.round((subSkillCorrectPoints / estimatedAttempted) * 100) : 0;
      
      return {
        sectionName: mapSectionNameToCurriculum(subSkill.sectionName, productType),
        subSkillName: subSkill.subSkillName,
        score,
        accuracy,
        questionsCorrect: subSkillCorrectPoints,
        questionsTotal: subSkill.maxPoints,
        questionsAttempted: estimatedAttempted
      };
    });
    
    const sectionScores = Object.fromEntries(
      sectionBreakdown.map(section => [section.sectionName, section.score])
    );
    
    const overallAccuracy = questionsAnswered > 0 ? Math.round((estimatedCorrectPoints / questionsAnswered) * 100) : 0;
    
    return {
      totalQuestions: totalMaxPoints,
      questionsAttempted: questionsAnswered,
      questionsCorrect: estimatedCorrectPoints,
      overallScore: finalScore,
      overallAccuracy,
      sectionScores,
      sectionBreakdown,
      subSkillBreakdown,
    };
    
  } catch (error) {
    console.error(`❌ Error in session-based approach for test ${testNumber}:`, error);
    return null;
  }
}

// MOCK DATA MODE: Set to false to use real database queries
const USE_MOCK_DATA = false;

export interface OverallPerformance {
  questionsCompleted: number;
  questionsAttempted: number;
  questionsCorrect: number;
  overallAccuracy: number;
  studyTimeHours: number;
  averageTestScore: number | null;
  diagnosticCompleted: boolean;
  practiceTestsCompleted: number[];
}

export interface DiagnosticResults {
  overallScore: number;
  totalQuestionsCorrect: number;
  totalQuestions: number;
  totalQuestionsAttempted: number;
  overallAccuracy: number;
  sectionBreakdown: {
    sectionName: string;
    score: number;
    questionsCorrect: number;
    questionsTotal: number;
    questionsAttempted: number;
    accuracy: number;
  }[];
  strengths: {
    subSkill: string;
    accuracy: number;
    questionsAttempted: number;
  }[];
  weaknesses: {
    subSkill: string;
    accuracy: number;
    questionsAttempted: number;
  }[];
  allSubSkills: {
    subSkill: string;
    accuracy: number;
    questionsAttempted: number;
    questionsTotal: number;
    questionsCorrect: number;
    sectionName: string;
  }[];
}

export interface PracticeTestResults {
  tests: {
    testNumber: number;
    score: number | null;
    status: 'not-started' | 'in-progress' | 'completed';
    completedAt: string | null;
    sectionScores: Record<string, number>;
    // Real data fields for practice test insights
    totalQuestions?: number | null;
    questionsAttempted?: number | null;
    questionsCorrect?: number | null;
    sectionBreakdown?: {
      sectionName: string;
      score: number;
      questionsCorrect: number;
      questionsTotal: number;
      questionsAttempted: number;
      accuracy: number;
    }[];
    subSkillBreakdown?: {
      sectionName: string;
      subSkillName: string;
      score: number;
      questionsCorrect: number;
      questionsTotal: number;
      questionsAttempted: number;
      accuracy: number;
    }[];
  }[];
  progressOverTime: {
    testNumber: number;
    score: number;
    date: string;
  }[];
  sectionAnalysis: {
    sectionName: string;
    averageScore: number;
    bestScore: number;
    improvementTrend: number; // positive = improving, negative = declining
  }[];
}

export interface DrillResults {
  totalQuestions: number;
  overallAccuracy: number;
  subSkillBreakdown: {
    sectionName: string;
    subSkills: {
      subSkillName: string;
      questionsCompleted: number;
      accuracy: number;
      difficulty1Accuracy: number;
      difficulty2Accuracy: number;
      difficulty3Accuracy: number;
      difficulty1Questions: number;
      difficulty1Correct: number;
      difficulty2Questions: number;
      difficulty2Correct: number;
      difficulty3Questions: number;
      difficulty3Correct: number;
      recommendedLevel: 1 | 2 | 3;
    }[];
  }[];
  recentActivity: {
    subSkillName: string;
    difficulty: number;
    accuracy: number;
    completedAt: string;
  }[];
}

export class AnalyticsService {
  static async getOverallPerformance(userId: string, productId: string): Promise<OverallPerformance> {
    const productType = PRODUCT_ID_TO_TYPE[productId] || productId;
    // Return mock data for demo purposes if enabled
    if (USE_MOCK_DATA) {
      console.log('🎭 Returning mock overall performance data');
      return {
        questionsCompleted: 847,
        questionsAttempted: 892,
        questionsCorrect: 634,
        overallAccuracy: 75,
        studyTimeHours: 18.5,
        averageTestScore: 78,
        diagnosticCompleted: true,
        practiceTestsCompleted: [1, 2, 3],
      };
    }

    try {
      // Get user progress data
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('product_type', productType)
        .single();

      if (progressError) {
        console.error('❌ Error fetching user progress:', progressError);
        // If no progress record exists, create a default one
        if (progressError.code === 'PGRST116') {
          return {
            questionsCompleted: 0,
            questionsAttempted: 0,
            questionsCorrect: 0,
            overallAccuracy: 0,
            studyTimeHours: 0,
            averageTestScore: null,
            diagnosticCompleted: false,
            practiceTestsCompleted: [],
          };
        }
        throw progressError;
      }

      // Get average test score (diagnostic + practice tests)
      const { data: testSessions, error: testError } = await supabase
        .from('user_test_sessions')
        .select('final_score, test_mode')
        .eq('user_id', userId)
        .eq('product_type', productType)
        .eq('status', 'completed')
        .in('test_mode', ['diagnostic', 'practice']);

      if (testError) {
        console.error('❌ Error fetching test sessions:', testError);
        throw testError;
      }

      const averageTestScore = testSessions && testSessions.length > 0
        ? Math.round(testSessions.reduce((sum, test) => sum + (test.final_score || 0), 0) / testSessions.length)
        : null;

      return {
        questionsCompleted: progressData?.total_questions_completed || 0,
        questionsAttempted: progressData?.total_questions_attempted || 0,
        questionsCorrect: progressData?.total_questions_correct || 0,
        overallAccuracy: progressData?.overall_accuracy || 0,
        studyTimeHours: Math.round((progressData?.total_study_time_seconds || 0) / 3600 * 2) / 2,
        averageTestScore,
        diagnosticCompleted: progressData?.diagnostic_completed || false,
        practiceTestsCompleted: progressData?.practice_tests_completed || [],
      };

    } catch (error) {
      console.error('❌ Error in getOverallPerformance:', error);
      throw error;
    }
  }

  // Helper function to process sub-skills from questions table
  private static async processSubSkillFromQuestions(
    subSkillName: string, 
    sectionName: string, 
    productType: string, 
    userId: string, 
    subSkillPerformance: any[],
    testMode: string = 'diagnostic',
    sectionTotals?: Map<string, {questionsCorrect: number, questionsTotal: number, questionsAttempted: number}>
  ) {
    // Get all questions for this sub-skill and test mode
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('id, section_name, max_points')
      .eq('sub_skill', subSkillName)
      .eq('test_mode', testMode)
      .eq('product_type', productType);

    if (questionsError) {
      console.error(`❌ Error fetching questions for sub-skill ${subSkillName}:`, questionsError);
      return;
    }

    // Check if this is a writing sub-skill
    const isWritingSubSkill = subSkillName.toLowerCase().includes('writing') || 
                              sectionName?.toLowerCase().includes('writing');
    
    // Calculate total max_points for this sub-skill
    const totalPoints = questions?.reduce((sum, q) => sum + (q.max_points || 1), 0) || 0;
    
    if (totalPoints === 0) {
      console.log(`⚠️ Sub-skill "${subSkillName}" has no diagnostic questions`);
      return;
    }
    
    // Note: We now use actual max_points from database instead of manual conversion

    // Get user responses for these questions
    const questionIds = questions?.map(q => q.id) || [];
    
    const sessionType = testMode === 'diagnostic' ? 'diagnostic' : 'practice';
    const { data: responses, error: responsesError } = await supabase
      .from('question_attempt_history')
      .select('question_id, is_correct, user_answer')
      .eq('user_id', userId)
      .eq('session_type', sessionType)
      .in('question_id', questionIds);

    if (responsesError) {
      console.error(`❌ Error fetching responses for sub-skill ${subSkillName}:`, responsesError);
      return;
    }
    
    let questionsAttempted = 0;
    let questionsCorrect = 0;
    
    if (isWritingSubSkill) {
      console.log(`✍️ Processing writing sub-skill: ${subSkillName}`);
      
      // For writing questions, get scores from writing_assessments table
      // Verify user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('User not authenticated for writing assessments query');
        return { score: 0, maxScore: 0, accuracy: 0 };
      }
      
      const { data: writingAssessments, error: writingError } = await supabase
        .from('writing_assessments')
        .select('question_id, total_score, max_possible_score, percentage_score')
        .eq('user_id', userId)
        .in('question_id', questionIds);
      
      if (writingError) {
        console.error(`❌ Error fetching writing assessments for ${subSkillName}:`, writingError);
      }
      
      // Use weighted scoring for writing assessments
      if (writingAssessments && writingAssessments.length > 0) {
        const totalPossiblePoints = writingAssessments.reduce((sum, w) => sum + (w.max_possible_score || 0), 0);
        const totalEarnedPoints = writingAssessments.reduce((sum, w) => sum + (w.total_score || 0), 0);
        
        questionsAttempted = totalPossiblePoints;
        questionsCorrect = totalEarnedPoints;
        
        console.log(`✍️ Writing sub-skill ${subSkillName} WEIGHTED:`, {
          earnedPoints: totalEarnedPoints,
          possiblePoints: totalPossiblePoints,
          percentage: totalPossiblePoints > 0 ? Math.round((totalEarnedPoints / totalPossiblePoints) * 100) : 0,
          numAssessments: writingAssessments.length
        });
      } else {
        // Fallback: Use responses but apply weighted scoring for writing
        const responseCount = responses?.length || 0;
        const correctResponses = responses?.filter(r => r.is_correct).length || 0;
        
        const pointsPerTask = 30;
        questionsAttempted = responseCount * pointsPerTask;
        questionsCorrect = correctResponses * pointsPerTask;
        
        console.log(`✍️ Writing sub-skill ${subSkillName} FALLBACK WEIGHTED:`, {
          originalResponses: responseCount,
          originalCorrect: correctResponses,
          weightedAttempted: questionsAttempted,
          weightedCorrect: questionsCorrect
        });
      }
    } else {
      // Non-writing questions use standard calculation
      questionsAttempted = responses?.length || 0;
      questionsCorrect = responses?.filter(r => r.is_correct).length || 0;
    }
    
    const accuracy = questionsAttempted > 0 ? Math.round((questionsCorrect / questionsAttempted) * 100) : 0;
    const score = totalPoints > 0 ? Math.round((questionsCorrect / totalPoints) * 100) : 0;

    subSkillPerformance.push({
      subSkill: subSkillName,
      subSkillName: subSkillName,  // Add subSkillName for frontend compatibility
      subSkillId: null, // No ID when coming from questions table
      questionsTotal: totalPoints,
      questionsAttempted,
      questionsCorrect,
      accuracy,
      score,
      sectionName
    });

    // Update section totals if provided (for practice tests)
    if (sectionTotals) {
      if (!sectionTotals.has(sectionName)) {
        sectionTotals.set(sectionName, {questionsCorrect: 0, questionsTotal: 0, questionsAttempted: 0});
      }
      const sectionData = sectionTotals.get(sectionName)!;
      sectionData.questionsCorrect += questionsCorrect;
      sectionData.questionsTotal += totalPoints;
      sectionData.questionsAttempted += questionsAttempted;
    }

    }

  static async getDiagnosticResults(userId: string, productId: string): Promise<DiagnosticResults | null> {
    const productType = PRODUCT_ID_TO_TYPE[productId] || productId;
    // Return mock diagnostic data for demo purposes if enabled
    if (USE_MOCK_DATA) {
      console.log('🎭 Returning mock diagnostic results data');
      return {
      overallScore: 76,
      totalQuestionsCorrect: 76,
      totalQuestions: 100,
      totalQuestionsAttempted: 85,
      overallAccuracy: 89,
      sectionBreakdown: [
        {
          sectionName: 'General Ability - Verbal',
          score: 82,
          questionsCorrect: 16,
          questionsTotal: 20,
          questionsAttempted: 19,
          accuracy: 84,
        },
        {
          sectionName: 'General Ability - Quantitative',
          score: 78,
          questionsCorrect: 15,
          questionsTotal: 20,
          questionsAttempted: 18,
          accuracy: 83,
        },
        {
          sectionName: 'Mathematics Reasoning',
          score: 71,
          questionsCorrect: 14,
          questionsTotal: 20,
          questionsAttempted: 17,
          accuracy: 82,
        },
        {
          sectionName: 'Reading Reasoning',
          score: 85,
          questionsCorrect: 17,
          questionsTotal: 20,
          questionsAttempted: 20,
          accuracy: 85,
        },
        {
          sectionName: 'Writing',
          score: 68,
          questionsCorrect: 7,
          questionsTotal: 10,
          questionsAttempted: 8,
          accuracy: 87,
        },
      ],
      strengths: [
        { subSkill: 'Vocabulary in Context', accuracy: 92, questionsAttempted: 12 },
        { subSkill: 'Inferential Reasoning', accuracy: 89, questionsAttempted: 9 },
        { subSkill: 'Logical Reasoning & Deduction', accuracy: 87, questionsAttempted: 15 },
        { subSkill: 'Pattern Recognition & Sequences', accuracy: 85, questionsAttempted: 11 },
        { subSkill: 'Critical Thinking & Problem-Solving', accuracy: 84, questionsAttempted: 18 },
      ],
      weaknesses: [
        { subSkill: 'Creative Writing', accuracy: 45, questionsAttempted: 4 },
        { subSkill: 'Persuasive Writing', accuracy: 52, questionsAttempted: 6 },
        { subSkill: 'Algebraic Reasoning', accuracy: 58, questionsAttempted: 12 },
        { subSkill: 'Data Interpretation and Statistics', accuracy: 61, questionsAttempted: 13 },
        { subSkill: 'Geometric & Spatial Reasoning', accuracy: 64, questionsAttempted: 14 },
      ],
    };
    }

    try {
      // Get all diagnostic test sessions (multiple sections)
      const { data: diagnosticSessions, error: sessionError } = await supabase
        .from('user_test_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('product_type', productType)
        .eq('test_mode', 'diagnostic')
        .eq('status', 'completed');

      if (sessionError) {
        console.error('❌ Error fetching diagnostic sessions:', sessionError);
        throw sessionError;
      }

      if (!diagnosticSessions || diagnosticSessions.length === 0) {
        console.log('ℹ️ No completed diagnostic sessions found');
        return null;
      }

      // Check if ALL diagnostic sections are completed before showing insights
      const expectedSections = Object.keys(TEST_STRUCTURES[productType as keyof typeof TEST_STRUCTURES] || {});
      const completedSectionNames = diagnosticSessions.map(s => s.section_name);
      const missingSections = expectedSections.filter(section => !completedSectionNames.includes(section));
      
      if (missingSections.length > 0) {
        console.log(`ℹ️ Diagnostic insights not available - missing ${missingSections.length} sections: ${missingSections.join(', ')}`);
        return null;
      }
      
      if (diagnosticSessions.length === 0) {
        console.log('ℹ️ No completed diagnostic sections found');
        return null;
      }

      // COMPLETELY REBUILD sub-skill performance calculation
      // Step 1: Try to get sub-skills from sub_skills table first
      const { data: subSkillsData, error: subSkillsError } = await supabase
        .from('sub_skills')
        .select(`
          id,
          name,
          product_type,
          test_sections!inner(section_name)
        `)
        .eq('product_type', productType);

      if (subSkillsError) {
        console.error('❌ Error fetching sub-skills:', subSkillsError);
        throw subSkillsError;
      }

      // Step 2: If no sub-skills found in sub_skills table, get them directly from questions
      const subSkillPerformance = [];
      
      if (!subSkillsData || subSkillsData.length === 0) {
        // Get unique sub-skills directly from diagnostic questions
        const { data: questionSubSkills, error: questionError } = await supabase
          .from('questions')
          .select('sub_skill, section_name')
          .eq('product_type', productType)
          .eq('test_mode', 'diagnostic')
          .not('sub_skill', 'is', null);

        if (questionError) {
          console.error('❌ Error fetching sub-skills from questions:', questionError);
          throw questionError;
        }

        // Create unique sub-skills from questions
        const uniqueSubSkills = new Map<string, string>();
        questionSubSkills?.forEach(q => {
          if (q.sub_skill) {
            uniqueSubSkills.set(q.sub_skill, q.section_name);
          }
        });

        // Process each unique sub-skill
        for (const [subSkillName, sectionName] of uniqueSubSkills) {
          await this.processSubSkillFromQuestions(subSkillName, sectionName, productType, userId, subSkillPerformance);
        }
      } else {
        // Process sub-skills from sub_skills table (original logic)
      
      for (const subSkill of subSkillsData || []) {
        // Get all diagnostic questions for this sub-skill
        const { data: questions, error: questionsError } = await supabase
          .from('questions')
          .select('id, section_name, max_points')
          .eq('sub_skill_id', subSkill.id)
          .eq('test_mode', 'diagnostic')
          .eq('product_type', productType);

        if (questionsError) {
          console.error(`❌ Error fetching questions for sub-skill ${subSkill.name}:`, questionsError);
          continue;
        }

        // Calculate total max_points for this sub-skill
        const totalPoints = questions?.reduce((sum, q) => sum + (q.max_points || 1), 0) || 0;
        
        if (totalPoints === 0) {
          console.log(`⚠️ Sub-skill "${subSkill.name}" has no diagnostic questions`);
          continue;
        }
        
        // Note: We now use actual max_points from database instead of manual conversion

        // Get user responses for these questions
        const questionIds = questions?.map(q => q.id) || [];
        
        const { data: responses, error: responsesError } = await supabase
          .from('question_attempt_history')
          .select('question_id, is_correct, user_answer')
          .eq('user_id', userId)
          .eq('session_type', 'diagnostic')
          .in('question_id', questionIds);

        if (responsesError) {
          console.error(`❌ Error fetching responses for sub-skill ${subSkill.name}:`, responsesError);
          continue;
        }
        
        let questionsAttempted = 0;
        let questionsCorrect = 0;
        
        // Check if this is a writing sub-skill (like practice test processing)
        const isWritingSubSkill = subSkill.name.toLowerCase().includes('writing') || 
                                  subSkill.name.toLowerCase().includes('narrative') || 
                                  subSkill.name.toLowerCase().includes('persuasive') ||
                                  questions?.[0]?.section_name?.toLowerCase().includes('written expression');
        
        if (isWritingSubSkill) {
          console.log(`✍️ Processing writing sub-skill: ${subSkill.name}`);
          
          // For writing questions, we need to get scores from writing_assessments table
          const { data: writingAssessments, error: writingError } = await supabase
            .from('writing_assessments')
            .select('question_id, total_score, max_possible_score, percentage_score')
            .eq('user_id', userId)
            .in('question_id', questionIds);
          
          if (writingError) {
            console.error(`❌ Error fetching writing assessments for ${subSkill.name}:`, writingError);
          }
          
          // For writing sub-skills, use weighted scoring based on actual points
          if (writingAssessments && writingAssessments.length > 0) {
            // Use actual point values for writing assessments
            const totalPossiblePoints = writingAssessments.reduce((sum, w) => sum + (w.max_possible_score || 0), 0);
            const totalEarnedPoints = writingAssessments.reduce((sum, w) => sum + (w.total_score || 0), 0);
            
            questionsAttempted = totalPossiblePoints;  // Use total possible points as "questions attempted"
            questionsCorrect = totalEarnedPoints;      // Use earned points as "questions correct"
            
            console.log(`✍️ Writing sub-skill ${subSkill.name} WEIGHTED:`, {
              earnedPoints: totalEarnedPoints,
              possiblePoints: totalPossiblePoints,
              percentage: totalPossiblePoints > 0 ? Math.round((totalEarnedPoints / totalPossiblePoints) * 100) : 0,
              numAssessments: writingAssessments.length
            });
          } else {
            // Fallback: Use responses but apply weighted scoring for writing
            const responseCount = responses?.length || 0;
            const correctResponses = responses?.filter(r => r.is_correct).length || 0;
            
            // Convert to weighted points (assume 30 points per writing task for VIC selective)
            const pointsPerTask = 30;
            questionsAttempted = responseCount * pointsPerTask;
            questionsCorrect = correctResponses * pointsPerTask;
            
            console.log(`✍️ Writing sub-skill ${subSkill.name} FALLBACK WEIGHTED:`, {
              originalResponses: responseCount,
              originalCorrect: correctResponses,
              weightedAttempted: questionsAttempted,
              weightedCorrect: questionsCorrect
            });
          }
        } else {
          // Non-writing questions use standard calculation
          questionsAttempted = responses?.length || 0;
          questionsCorrect = responses?.filter(r => r.is_correct).length || 0;
        }
        
        const accuracy = questionsAttempted > 0 ? Math.round((questionsCorrect / questionsAttempted) * 100) : 0;
        const score = totalPoints > 0 ? Math.round((questionsCorrect / totalPoints) * 100) : 0;

        // Get section name (use first question's section, they should all be the same)
        const sectionName = questions?.[0]?.section_name || subSkill.test_sections?.section_name || 'Unknown';

        subSkillPerformance.push({
          subSkill: subSkill.name,
          subSkillName: subSkill.name,  // Add subSkillName for frontend compatibility
          subSkillId: subSkill.id,
          questionsTotal: totalPoints,
          questionsAttempted,
          questionsCorrect,
          accuracy,
          score,
          sectionName
        });

        }
      } // End of else block for sub_skills table processing

      // Create a map for easy lookup in debugging
      const subSkillStats = new Map(
        subSkillPerformance.map(skill => [skill.subSkill, {
          subSkillName: skill.subSkill,
          questionsTotal: skill.questionsTotal,
          questionsAttempted: skill.questionsAttempted,
          questionsCorrect: skill.questionsCorrect,
          sectionName: skill.sectionName
        }])
      );

      // Debug: Show question count breakdown by section
      const sectionQuestionCounts = new Map<string, number>();
      const sectionSubSkillCounts = new Map<string, number>();
      const sectionCorrectCounts = new Map<string, number>();
      const sectionAttemptedCounts = new Map<string, number>();
      
      subSkillPerformance.forEach(skill => {
        const section = skill.sectionName;
        
        const currentCount = sectionQuestionCounts.get(section) || 0;
        sectionQuestionCounts.set(section, currentCount + skill.questionsTotal);
        
        const currentSubSkills = sectionSubSkillCounts.get(section) || 0;
        sectionSubSkillCounts.set(section, currentSubSkills + 1);
        
        const currentCorrect = sectionCorrectCounts.get(section) || 0;
        sectionCorrectCounts.set(section, currentCorrect + skill.questionsCorrect);
        
        const currentAttempted = sectionAttemptedCounts.get(section) || 0;
        sectionAttemptedCounts.set(section, currentAttempted + skill.questionsAttempted);
      });
      
      // Process section breakdown from multiple sessions using REAL-TIME calculation
      // This matches the exact calculation used in TestTaking.tsx View Results
      const sectionBreakdownPromises = diagnosticSessions.map(async session => {
        const sessionId = session.id;
        
        // USE THE EXACT SAME CALCULATION AS VIEW RESULTS PAGE
        // View Results uses: questions.filter((q, index) => answers[index] === q.correctAnswer).length / questions.length
        
        let actualTotalQuestions = 0;
        let questionsCorrect = 0;
        let questionsAttempted = 0;
        
        try {
          // Check if this is a writing section and needs special handling
          const isWritingSection = session.section_name?.toLowerCase().includes('writing') || 
                                  session.section_name?.toLowerCase().includes('written expression');
          
          if (isWritingSection) {
            console.log(`✍️ Processing writing section: ${session.section_name}`);
            
            // Get writing assessments for this session
            const { data: writingAssessments, error: writingError } = await supabase
              .from('writing_assessments')
              .select('total_score, max_possible_score, percentage_score')
              .eq('session_id', sessionId);
            
            if (!writingError && writingAssessments && writingAssessments.length > 0) {
              // For writing sections, use the actual point values instead of treating as individual questions
              const totalPossibleScore = writingAssessments.reduce((sum, a) => sum + (a.max_possible_score || 0), 0);
              const totalEarnedScore = writingAssessments.reduce((sum, a) => sum + (a.total_score || 0), 0);
              
              // Use the actual point totals for writing sections (e.g., 60 points for VIC selective)
              actualTotalQuestions = totalPossibleScore;
              questionsAttempted = totalPossibleScore; // All questions were attempted if assessments exist
              questionsCorrect = totalEarnedScore;
              
              console.log(`✍️ Writing section ${session.section_name} WEIGHTED scores:`, {
                totalEarnedScore,
                totalPossibleScore,
                questionsCorrect,
                actualTotalQuestions,
                calculatedPercentage: totalPossibleScore > 0 ? Math.round((totalEarnedScore / totalPossibleScore) * 100) : 0,
                numAssessments: writingAssessments.length
              });
              
              // CRITICAL: Ensure we don't accidentally zero out writing scores
              if (questionsCorrect === 0 && totalEarnedScore > 0) {
                questionsCorrect = totalEarnedScore;
              }
            } else {
              // Fallback to stored session data for writing sections without assessments
              console.log(`⚠️ No writing assessments found for section ${session.section_name}, using question-level scoring`);
              
              // When no writing assessments exist, use the same calculation as other sections
              // This ensures consistency with sub-skill breakdowns
              
              // Get real-time correct answers from question_attempt_history
              const { data: sessionAttempts, error: attemptsError } = await supabase
                .from('question_attempt_history')
                .select('is_correct, question_id')
                .eq('user_id', userId)
                .eq('session_id', sessionId);

              if (!attemptsError && sessionAttempts) {
                questionsCorrect = sessionAttempts.filter(attempt => attempt.is_correct).length;
                questionsAttempted = sessionAttempts.length;
                
                console.log(`✍️ Writing section ${session.section_name} - Using question attempts: ${questionsCorrect}/${questionsAttempted}`);
              } else {
                // Final fallback to session data
                questionsCorrect = session.correct_answers || 0;
                questionsAttempted = session.questions_answered || 0;
                
                console.log(`✍️ Writing section ${session.section_name} - Using session data: ${questionsCorrect}/${questionsAttempted}`);
              }
              
              // For total questions, use actual question count from question_order or database
              if (session.question_order && Array.isArray(session.question_order)) {
                actualTotalQuestions = session.question_order.length;
              } else {
                // Query actual questions in database
                const { data: sectionQuestions, error: sectionQError } = await supabase
                  .from('questions')
                  .select('id')
                  .eq('product_type', productType)
                  .eq('test_mode', 'diagnostic')
                  .eq('section_name', session.section_name);
                  
                actualTotalQuestions = sectionQuestions?.length || session.total_questions || 0;
              }
              
              console.log(`✍️ Writing section ${session.section_name} CORRECTED to match sub-skills:`, {
                questionsCorrect,
                questionsAttempted,
                actualTotalQuestions,
                originalSessionCorrect: session.correct_answers,
                originalSessionTotal: session.total_questions
              });
            }
          } else {
            // Non-writing sections use standard calculation
            // CRITICAL FIX: Get real-time correct answers from question_attempt_history table
            // instead of relying on session.correct_answers which appears to be 0
            const { data: sessionAttempts, error: attemptsError } = await supabase
              .from('question_attempt_history')
              .select('is_correct, question_id')
              .eq('user_id', userId)
              .eq('session_id', session.id);
            
            if (!attemptsError && sessionAttempts && sessionAttempts.length > 0) {
              questionsCorrect = sessionAttempts.filter(attempt => attempt.is_correct).length;
              questionsAttempted = sessionAttempts.length; // Use actual attempts count
              } else {
              console.log(`⚠️ No question attempts found for session ${session.id}, using answers_data calculation...`);
              
              // FALLBACK: Calculate from session's answers_data (same method as individual test reviews)
              const answersData = session.answers_data || {};
              let correctFromAnswers = 0;
              let attemptedFromAnswers = 0;
              
              // Get question IDs for this session to validate answers
              if (session.question_order && Array.isArray(session.question_order)) {
                for (const questionId of session.question_order) {
                  const userAnswer = answersData[questionId];
                  if (userAnswer !== undefined && userAnswer !== null) {
                    attemptedFromAnswers++;
                    
                    // Get correct answer from questions table
                    const { data: questionData } = await supabase
                      .from('questions')
                      .select('correct_answer')
                      .eq('id', questionId)
                      .single();
                    
                    if (questionData && questionData.correct_answer === userAnswer) {
                      correctFromAnswers++;
                    }
                  }
                }
              }
              
              questionsCorrect = correctFromAnswers;
              questionsAttempted = attemptedFromAnswers;
              }
          }
          
          // For total points, get actual max_points from questions in this section
          // BUT only for non-writing sections (writing sections already have weighted totals calculated)
          if (!isWritingSection) {
            // Query the actual questions for this section to get real max_points total
            const { data: sectionQuestions, error: sectionQError } = await supabase
              .from('questions')
              .select('max_points')
              .eq('product_type', productType)
              .eq('test_mode', 'diagnostic')
              .eq('section_name', session.section_name);
              
            if (!sectionQError && sectionQuestions && sectionQuestions.length > 0) {
              actualTotalQuestions = sectionQuestions.reduce((sum, q) => sum + (q.max_points || 1), 0);
              } else {
              // Fallback to question count if max_points query fails
              if (session.question_order && Array.isArray(session.question_order) && session.question_order.length > 0) {
                actualTotalQuestions = session.question_order.length;
              } else {
                actualTotalQuestions = session.total_questions || 0;
              }
              }
          }
          // For writing sections, actualTotalQuestions is already set to weighted values above
          
          // If for some reason answers_data exists but questions_answered is 0, count answers_data
          if (questionsAttempted === 0 && session.answers_data && typeof session.answers_data === 'object') {
            questionsAttempted = Object.keys(session.answers_data).length;
          }
          
          } catch (error) {
          console.error('Error in VIEW RESULTS calculation:', error);
          
          // Final fallback - try to get actual max_points, otherwise use question count
          if (actualTotalQuestions === 0) {
            try {
              const { data: sectionQuestions, error: sectionQError } = await supabase
                .from('questions')
                .select('max_points')
                .eq('product_type', productType)
                .eq('test_mode', 'diagnostic')
                .eq('section_name', session.section_name);
                
              if (!sectionQError && sectionQuestions && sectionQuestions.length > 0) {
                actualTotalQuestions = sectionQuestions.reduce((sum, q) => sum + (q.max_points || 1), 0);
                } else {
                // Last resort: use question count
                if (session.question_order && Array.isArray(session.question_order)) {
                  actualTotalQuestions = session.question_order.length;
                } else {
                  actualTotalQuestions = session.total_questions || 0;
                }
                }
            } catch (fallbackError) {
              console.error(`❌ Fallback max_points query failed for ${session.section_name}:`, fallbackError);
              // Ultimate fallback
              if (session.question_order && Array.isArray(session.question_order)) {
                actualTotalQuestions = session.question_order.length;
              } else {
                actualTotalQuestions = session.total_questions || 0;
              }
            }
          }
          
          questionsCorrect = session.correct_answers || session.questions_correct || 0;
          questionsAttempted = session.questions_answered || actualTotalQuestions;
        }
        
        // Final safety check - ensure we have a valid total
        if (!actualTotalQuestions || actualTotalQuestions === 0) {
          console.log(`⚠️ Section ${session.section_name}: No valid total found, defaulting to standard test sizes`);
          // Use standard test sizes based on section name
          // For writing sections, use weighted point totals (60 points for VIC selective)
          // Test-type-aware question counts from actual database analysis
          const getStandardSizeForSection = (sectionName: string, productType: string): number => {
            // Define section max_points by test type (based on actual database values)
            const sectionPoints: Record<string, Record<string, number>> = {
              'VIC Selective Entry (Year 9 Entry)': {
                'Mathematics Reasoning': 36,
                'General Ability - Verbal': 30,
                'General Ability - Quantitative': 31,
                'Writing': 60
              },
              'NSW Selective Entry (Year 7 Entry)': {
                'Mathematical Reasoning': 42,
                'Thinking Skills': 48,
                'Writing': 600
              },
              'EduTest Scholarship (Year 7 Entry)': {
                'Mathematics': 60,
                'Verbal Reasoning': 60,
                'Reading Comprehension': 50,
                'Numerical Reasoning': 50,
                'Written Expression': 30
              },
              'ACER Scholarship (Year 7 Entry)': {
                'Mathematics': 42,
                'Written Expression': 240
              },
              'Year 5 NAPLAN': {
                'Writing': 576,
                'Language Conventions': 36,
                'Numeracy No Calculator': 42,
                'Numeracy Calculator': 42
              },
              'Year 7 NAPLAN': {
                'Numeracy No Calculator': 48,
                'Numeracy Calculator': 48,
                'Writing': 576,
                'Language Conventions': 36
              }
            };
            
            return sectionPoints[productType]?.[sectionName] || 20; // Default fallback
          };
          
          actualTotalQuestions = getStandardSizeForSection(session.section_name, productType);
        }
        
        // Calculate final scores
        const score = actualTotalQuestions > 0 ? Math.round((questionsCorrect / actualTotalQuestions) * 100) : 0;
        const accuracy = questionsAttempted > 0 ? Math.round((questionsCorrect / questionsAttempted) * 100) : 0;
        
        const mappedName = mapSectionNameToCurriculum(session.section_name || 'Unknown Section', productType);
        // Check if this is a writing section for logging
        const isWritingSectionForLog = session.section_name?.toLowerCase().includes('writing') || 
                                       session.section_name?.toLowerCase().includes('written expression');
        
        // EXTRA DEBUG: Log if this is a writing section with zero score
        if (isWritingSectionForLog && score === 0) {
          console.warn(`⚠️ WRITING ZERO SCORE DEBUG: Section "${session.section_name}" -> "${mappedName}" has score=0. This might be incorrect!`);
        }
        
        return {
          sectionName: mapSectionNameToCurriculum(session.section_name || 'Unknown Section', productType),
          score, // Score based on total questions (for Score view)
          questionsCorrect,
          questionsTotal: actualTotalQuestions, // Use actual total, not DB value
          questionsAttempted,
          accuracy, // Accuracy based on attempted questions (for Accuracy view)
        };
      });
      
      const sectionBreakdown = await Promise.all(sectionBreakdownPromises);

      // Debug: Compare section totals with sub-skill totals
      sectionBreakdown.forEach(section => {
        const subSkillTotal = sectionQuestionCounts.get(section.sectionName) || 0;
        const subSkillCorrect = sectionCorrectCounts.get(section.sectionName) || 0;
        const subSkillAttempted = sectionAttemptedCounts.get(section.sectionName) || 0;
        });

      // Calculate overall score from all completed sections
      const totalQuestions = sectionBreakdown.reduce((sum, section) => sum + section.questionsTotal, 0);
      const totalCorrect = sectionBreakdown.reduce((sum, section) => sum + section.questionsCorrect, 0);
      const overallScore = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

      // Calculate total questions attempted from section breakdown (ensures consistency with weighted scores)
      let totalQuestionsAttempted = sectionBreakdown.reduce((sum, section) => sum + section.questionsAttempted, 0);
      
      // If still 0, use total questions as attempted (all questions were attempted)
      if (totalQuestionsAttempted === 0 && totalQuestions > 0) {
        console.log('⚠️ No attempted questions found, using total questions as fallback');
        totalQuestionsAttempted = totalQuestions;
      }

      // Calculate overall accuracy based on attempted questions (excludes skipped/timed-out questions)
      const overallAccuracy = totalQuestionsAttempted > 0 
        ? Math.round((totalCorrect / totalQuestionsAttempted) * 100) 
        : 0;

      // Sort sub-skills by accuracy and prepare for return
      const sortedSkills = subSkillPerformance
        .filter(skill => skill.questionsTotal >= 1) // Include all sub-skills that have questions
        .sort((a, b) => b.accuracy - a.accuracy);

      // Keep strengths and weaknesses for backwards compatibility, but also return all skills
      const strengths = sortedSkills.slice(0, 5); // Top 5 performing sub-skills
      const weaknesses = sortedSkills.slice(-5).reverse(); // Bottom 5 performing sub-skills, reversed to show worst first
      const allSubSkills = sortedSkills; // All sub-skills for comprehensive display

      return {
        overallScore,
        totalQuestionsCorrect: totalCorrect,
        totalQuestions,
        totalQuestionsAttempted,
        overallAccuracy,
        sectionBreakdown,
        strengths,
        weaknesses,
        allSubSkills, // Include all sub-skills for comprehensive display
      };

    } catch (error) {
      console.error('❌ Error in getDiagnosticResults:', error);
      throw error;
    }
  }

  static async getPracticeTestResults(userId: string, productId: string): Promise<PracticeTestResults> {
    const productType = PRODUCT_ID_TO_TYPE[productId] || productId;
    console.log('📚 Analytics: Fetching practice test results for', userId, productType, `(mapped from ${productId})`);

    // Return mock practice test data for demo purposes if enabled
    if (USE_MOCK_DATA) {
      console.log('🎭 Returning mock practice test results data');
      return {
      tests: [
        {
          testNumber: 1,
          score: 72,
          status: 'completed',
          completedAt: '2024-06-10T14:30:00Z',
          sectionScores: {
            'General Ability - Verbal': 75,
            'General Ability - Quantitative': 68,
            'Mathematics Reasoning': 70,
            'Reading Reasoning': 78,
            'Writing': 69,
          },
        },
        {
          testNumber: 2,
          score: 78,
          status: 'completed',
          completedAt: '2024-06-12T16:15:00Z',
          sectionScores: {
            'General Ability - Verbal': 82,
            'General Ability - Quantitative': 74,
            'Mathematics Reasoning': 76,
            'Reading Reasoning': 81,
            'Writing': 75,
          },
        },
        {
          testNumber: 3,
          score: 81,
          status: 'completed',
          completedAt: '2024-06-15T10:45:00Z',
          sectionScores: {
            'General Ability - Verbal': 85,
            'General Ability - Quantitative': 79,
            'Mathematics Reasoning': 78,
            'Reading Reasoning': 84,
            'Writing': 79,
          },
        },
        {
          testNumber: 4,
          score: null,
          status: 'in-progress',
          completedAt: null,
          sectionScores: {},
        },
        {
          testNumber: 5,
          score: null,
          status: 'not-started',
          completedAt: null,
          sectionScores: {},
        },
      ],
      progressOverTime: [
        { testNumber: 1, score: 72, date: '2024-06-10T14:30:00Z' },
        { testNumber: 2, score: 78, date: '2024-06-12T16:15:00Z' },
        { testNumber: 3, score: 81, date: '2024-06-15T10:45:00Z' },
      ],
      sectionAnalysis: [
        {
          sectionName: 'General Ability - Verbal',
          averageScore: 81,
          bestScore: 85,
          improvementTrend: 3.3,
        },
        {
          sectionName: 'General Ability - Quantitative',
          averageScore: 74,
          bestScore: 79,
          improvementTrend: 3.7,
        },
        {
          sectionName: 'Mathematics Reasoning',
          averageScore: 75,
          bestScore: 78,
          improvementTrend: 2.7,
        },
        {
          sectionName: 'Reading Reasoning',
          averageScore: 81,
          bestScore: 84,
          improvementTrend: 2.0,
        },
        {
          sectionName: 'Writing',
          averageScore: 74,
          bestScore: 79,
          improvementTrend: 3.3,
        },
      ],
    };
    }

    try {
      // Get practice test sessions - check both specific modes and generic 'practice'
      const { data: practiceSessions, error: sessionsError } = await supabase
        .from('user_test_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('product_type', productType)
        .in('test_mode', ['practice', 'practice_1', 'practice_2', 'practice_3', 'practice_4', 'practice_5'])
        .order('created_at');

      if (sessionsError) {
        console.error('❌ Error fetching practice sessions:', sessionsError);
        throw sessionsError;
      }

      // Separate sessions by test_mode type
      const specificModeSessions = practiceSessions?.filter(s => s.test_mode?.startsWith('practice_')) || [];
      const genericModeSessions = practiceSessions?.filter(s => s.test_mode === 'practice') || [];
      
      // Determine which practice tests actually exist in the database
      const { data: practiceQuestions } = await supabase
        .from('questions')
        .select('test_mode')
        .eq('product_type', productType)
        .like('test_mode', 'practice_%');
      
      const availablePracticeTests = [...new Set(practiceQuestions?.map(q => q.test_mode) || [])]
        .filter(mode => mode.startsWith('practice_'))
        .map(mode => parseInt(mode.split('_')[1]))
        .filter(num => !isNaN(num))
        .sort();
      
      // Create test results for available practice tests with REAL data
      const tests = [];
      
      // Sort generic sessions by creation date to ensure consistent assignment
      const sortedGenericSessions = genericModeSessions.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      
      // Use DIAGNOSTIC APPROACH for practice tests - get data directly from sub_skills table like diagnostic insights
      // Get sub-skills from sub_skills table (exactly like diagnostic)
      const { data: subSkillsData, error: subSkillsError } = await supabase
        .from('sub_skills')
        .select(`
          id,
          name,
          product_type,
          test_sections!inner(section_name)
        `)
        .eq('product_type', productType);

      if (subSkillsError) {
        console.error('❌ Error fetching sub-skills:', subSkillsError);
        throw subSkillsError;
      }

      // Loop through all possible test numbers (1-5) but only process those that exist in database
      for (let i = 1; i <= 5; i++) {
        // Skip if this practice test doesn't exist in the database
        if (!availablePracticeTests.includes(i)) {
          continue;
        }
        
        const testMode = `practice_${i}`;
        const testSessions = specificModeSessions.filter(s => 
          s.test_mode === testMode && s.status === 'completed'
        );
        
        let aggregatedTestData = null;
        
        if (testSessions.length > 0) {
          // Check if ALL sections of this practice test are completed
          const expectedSections = Object.keys(TEST_STRUCTURES[productType as keyof typeof TEST_STRUCTURES] || {});
          const completedSectionsForThisTest = testSessions.map(s => s.section_name);
          const missingSectionsForThisTest = expectedSections.filter(section => !completedSectionsForThisTest.includes(section));
          
          if (missingSectionsForThisTest.length > 0) {
            console.log(`ℹ️ Test ${i} insights not available - missing ${missingSectionsForThisTest.length} sections: ${missingSectionsForThisTest.join(', ')}`);
            continue;
          }
          
          // Process sub-skills using DIAGNOSTIC APPROACH
          const subSkillPerformance = [];
          const sectionTotals = new Map<string, {questionsCorrect: number, questionsTotal: number, questionsAttempted: number}>();
          
          // If no sub-skills found in sub_skills table, get them directly from questions (fallback like diagnostic)
          if (!subSkillsData || subSkillsData.length === 0) {
            // Get unique sub-skills directly from practice questions for this test
            const { data: questionSubSkills, error: questionError } = await supabase
              .from('questions')
              .select('sub_skill, section_name')
              .eq('product_type', productType)
              .eq('test_mode', testMode)
              .not('sub_skill', 'is', null);

            if (questionError) {
              console.error('❌ Error fetching sub-skills from questions:', questionError);
              throw questionError;
            }

            // Create unique sub-skills from questions
            const uniqueSubSkills = new Map<string, string>();
            questionSubSkills?.forEach(q => {
              if (q.sub_skill) {
                uniqueSubSkills.set(q.sub_skill, q.section_name);
              }
            });

            // Process each unique sub-skill using diagnostic approach
            for (const [subSkillName, sectionName] of uniqueSubSkills) {
              await this.processSubSkillFromQuestions(subSkillName, sectionName, productType, userId, subSkillPerformance, testMode, sectionTotals);
            }
          } else {
            // Process sub-skills from sub_skills table (exactly like diagnostic)
            for (const subSkill of subSkillsData || []) {
              // Get all practice questions for this sub-skill in this specific test
              const { data: questions, error: questionsError } = await supabase
                .from('questions')
                .select('id, section_name, max_points')
                .eq('sub_skill_id', subSkill.id)
                .eq('test_mode', testMode)
                .eq('product_type', productType);

              if (questionsError) {
                console.error(`❌ Error fetching questions for sub-skill ${subSkill.name}:`, questionsError);
                continue;
              }

              if (!questions || questions.length === 0) {
                console.log(`⚠️ Sub-skill "${subSkill.name}" has no questions in Test ${i}`);
                continue;
              }

              // Calculate total max_points for this sub-skill (like diagnostic)
              const totalPoints = questions?.reduce((sum, q) => sum + (q.max_points || 1), 0) || 0;
              
              // Get user responses for these questions (like diagnostic)
              const questionIds = questions?.map(q => q.id) || [];
              
              const { data: responses, error: responsesError } = await supabase
                .from('question_attempt_history')
                .select('question_id, is_correct, user_answer')
                .eq('user_id', userId)
                .eq('session_type', 'practice')
                .in('question_id', questionIds);

              if (responsesError) {
                console.error(`❌ Error fetching responses for sub-skill ${subSkill.name}:`, responsesError);
                continue;
              }
              
              let questionsAttempted = 0;
              let questionsCorrect = 0;
              
              // Check if this is a writing sub-skill (like diagnostic)
              const isWritingSubSkill = subSkill.name.toLowerCase().includes('writing') || 
                                       subSkill.name.toLowerCase().includes('narrative') || 
                                       subSkill.name.toLowerCase().includes('persuasive') ||
                                       questions?.[0]?.section_name?.toLowerCase().includes('written expression');
              
              if (isWritingSubSkill) {
                console.log(`✍️ Processing writing sub-skill: ${subSkill.name} for Test ${i}`);
                
                // For writing questions, get scores from writing_assessments table (exactly like diagnostic)
                const { data: writingAssessments, error: writingError } = await supabase
                  .from('writing_assessments')
                  .select('question_id, total_score, max_possible_score, percentage_score')
                  .eq('user_id', userId)
                  .in('question_id', questionIds);
                
                if (writingError) {
                  console.error(`❌ Error fetching writing assessments for ${subSkill.name}:`, writingError);
                }
                
                // Use weighted scoring based on actual points (exactly like diagnostic)
                if (writingAssessments && writingAssessments.length > 0) {
                  const totalPossiblePoints = writingAssessments.reduce((sum, w) => sum + (w.max_possible_score || 0), 0);
                  const totalEarnedPoints = writingAssessments.reduce((sum, w) => sum + (w.total_score || 0), 0);
                  
                  questionsAttempted = totalPossiblePoints;  
                  questionsCorrect = totalEarnedPoints;      
                  
                  console.log(`✍️ Writing sub-skill ${subSkill.name} Test ${i} WEIGHTED:`, {
                    earnedPoints: totalEarnedPoints,
                    possiblePoints: totalPossiblePoints,
                    percentage: totalPossiblePoints > 0 ? Math.round((totalEarnedPoints / totalPossiblePoints) * 100) : 0,
                    numAssessments: writingAssessments.length
                  });
                }
              } else {
                // Non-writing questions use standard calculation (like diagnostic)
                questionsAttempted = responses?.length || 0;
                questionsCorrect = responses?.filter(r => r.is_correct).length || 0;
              }
              
              const accuracy = questionsAttempted > 0 ? Math.round((questionsCorrect / questionsAttempted) * 100) : 0;
              const score = totalPoints > 0 ? Math.round((questionsCorrect / totalPoints) * 100) : 0;

              // Get section name (like diagnostic)
              const sectionName = questions?.[0]?.section_name || subSkill.test_sections?.section_name || 'Unknown';

              subSkillPerformance.push({
                subSkill: subSkill.name,
                subSkillName: subSkill.name,  // Add subSkillName for frontend compatibility
                subSkillId: subSkill.id,
                questionsTotal: totalPoints,
                questionsAttempted,
                questionsCorrect,
                accuracy,
                score,
                sectionName
              });

              // Aggregate by section (like diagnostic)
              if (!sectionTotals.has(sectionName)) {
                sectionTotals.set(sectionName, {questionsCorrect: 0, questionsTotal: 0, questionsAttempted: 0});
              }
              const sectionData = sectionTotals.get(sectionName)!;
              sectionData.questionsCorrect += questionsCorrect;
              sectionData.questionsTotal += totalPoints;
              sectionData.questionsAttempted += questionsAttempted;
            }
          }
          
          // Build section breakdown from aggregated data (like diagnostic)
          const sectionBreakdown = Array.from(sectionTotals.entries()).map(([sectionName, data]) => ({
            sectionName,
            questionsCorrect: data.questionsCorrect,
            questionsTotal: data.questionsTotal,
            questionsAttempted: data.questionsAttempted,
            score: data.questionsTotal > 0 ? Math.round((data.questionsCorrect / data.questionsTotal) * 100) : 0,
            accuracy: data.questionsAttempted > 0 ? Math.round((data.questionsCorrect / data.questionsAttempted) * 100) : 0
          }));
          
          // Calculate totals (like diagnostic)
          const totalQuestionsCorrect = Array.from(sectionTotals.values()).reduce((sum, s) => sum + s.questionsCorrect, 0);
          const totalQuestions = Array.from(sectionTotals.values()).reduce((sum, s) => sum + s.questionsTotal, 0);
          const totalQuestionsAttempted = Array.from(sectionTotals.values()).reduce((sum, s) => sum + s.questionsAttempted, 0);
          
          const overallScore = totalQuestions > 0 ? Math.round((totalQuestionsCorrect / totalQuestions) * 100) : 0;
          const overallAccuracy = totalQuestions > 0 ? Math.round((totalQuestionsCorrect / totalQuestions) * 100) : 0; // Use totalQuestions like diagnostic for writing sections
          
          // Build section scores object
          const sectionScores = {};
          sectionBreakdown.forEach(section => {
            sectionScores[section.sectionName] = section.score;
          });
          
          aggregatedTestData = {
            testNumber: i,
            score: overallScore,
            status: 'completed',
            completedAt: testSessions[testSessions.length - 1]?.completed_at,
            sectionScores: sectionScores,
            sectionBreakdown: sectionBreakdown,
            subSkillBreakdown: subSkillPerformance,
            totalQuestions: totalQuestions,
            questionsAttempted: totalQuestionsAttempted,
            questionsCorrect: totalQuestionsCorrect,
            overallAccuracy: overallAccuracy,
            totalMaxPoints: totalQuestions, // Use totalQuestions as totalMaxPoints for consistency
            totalEarnedPoints: totalQuestionsCorrect
          };
          
          } else {
          // No completed sessions found for this test
          aggregatedTestData = {
            testNumber: i,
            score: null,
            status: 'not-started',
            completedAt: null,
            sectionScores: {},
            sectionBreakdown: [],
            subSkillBreakdown: [],
            totalQuestions: null,
            questionsAttempted: null,
            questionsCorrect: null
          };
        }
        
        tests.push(aggregatedTestData);
      }

      // Progress over time (only completed tests)
      const progressOverTime = practiceSessions
        ?.filter(s => s.status === 'completed' && s.final_score !== null)
        .map(s => {
          // Extract test number from test_mode (practice_1 -> 1, practice_2 -> 2, etc.)
          const testNumber = s.test_mode?.startsWith('practice_') ? 
            parseInt(s.test_mode.split('_')[1]) : 0;
          return {
            testNumber,
            score: s.final_score || 0,
            date: s.completed_at || s.updated_at,
          };
        })
        .sort((a, b) => a.testNumber - b.testNumber) || [];

      // Section analysis
      const sectionAnalysis: Record<string, number[]> = {};
      practiceSessions?.forEach(session => {
        if (session.status === 'completed' && session.section_scores) {
          const scores = session.section_scores as Record<string, number>;
          Object.entries(scores).forEach(([sectionName, score]) => {
            if (!sectionAnalysis[sectionName]) {
              sectionAnalysis[sectionName] = [];
            }
            sectionAnalysis[sectionName].push(score);
          });
        }
      });

      const sectionAnalysisResult = Object.entries(sectionAnalysis).map(([sectionName, scores]) => {
        const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        const bestScore = Math.max(...scores);
        
        // Calculate improvement trend (simple linear regression slope)
        let improvementTrend = 0;
        if (scores.length > 1) {
          const n = scores.length;
          const sumX = (n * (n - 1)) / 2; // 0 + 1 + 2 + ... + (n-1)
          const sumY = scores.reduce((sum, score) => sum + score, 0);
          const sumXY = scores.reduce((sum, score, index) => sum + score * index, 0);
          const sumXX = (n * (n - 1) * (2 * n - 1)) / 6; // 0² + 1² + 2² + ... + (n-1)²
          
          improvementTrend = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        }

        return {
          sectionName,
          averageScore: Math.round(averageScore),
          bestScore,
          improvementTrend: Math.round(improvementTrend * 100) / 100,
        };
      });

      return {
        tests,
        progressOverTime,
        sectionAnalysis: sectionAnalysisResult,
      };

    } catch (error) {
      console.error('❌ Error in getPracticeTestResults:', error);
      throw error;
    }
  }

  static async getDrillResults(userId: string, productId: string): Promise<DrillResults> {
    const productType = PRODUCT_ID_TO_TYPE[productId] || productId;
    // Return mock drill data for demo purposes if enabled
    if (USE_MOCK_DATA) {
      console.log('🎭 Returning mock drill results data');
      return {
      totalQuestions: 420,
      overallAccuracy: 73,
      subSkillBreakdown: [
        {
          sectionName: 'General Ability - Verbal',
          subSkills: [
            {
              subSkillName: 'Vocabulary in Context',
              questionsCompleted: 45,
              accuracy: 82,
              difficulty1Accuracy: 91,
              difficulty2Accuracy: 78,
              difficulty3Accuracy: 72,
              recommendedLevel: 3,
            },
            {
              subSkillName: 'Logical Reasoning & Deduction',
              questionsCompleted: 38,
              accuracy: 76,
              difficulty1Accuracy: 85,
              difficulty2Accuracy: 74,
              difficulty3Accuracy: 68,
              recommendedLevel: 2,
            },
            {
              subSkillName: 'Verbal Reasoning & Analogies',
              questionsCompleted: 42,
              accuracy: 71,
              difficulty1Accuracy: 83,
              difficulty2Accuracy: 67,
              difficulty3Accuracy: 62,
              recommendedLevel: 2,
            },
          ],
        },
        {
          sectionName: 'General Ability - Quantitative',
          subSkills: [
            {
              subSkillName: 'Pattern Recognition & Sequences',
              questionsCompleted: 36,
              accuracy: 79,
              difficulty1Accuracy: 89,
              difficulty2Accuracy: 75,
              difficulty3Accuracy: 71,
              recommendedLevel: 3,
            },
            {
              subSkillName: 'Spatial Reasoning (2D & 3D)',
              questionsCompleted: 33,
              accuracy: 68,
              difficulty1Accuracy: 78,
              difficulty2Accuracy: 65,
              difficulty3Accuracy: 58,
              recommendedLevel: 2,
            },
            {
              subSkillName: 'Critical Thinking & Problem-Solving',
              questionsCompleted: 41,
              accuracy: 75,
              difficulty1Accuracy: 84,
              difficulty2Accuracy: 72,
              difficulty3Accuracy: 67,
              recommendedLevel: 2,
            },
          ],
        },
        {
          sectionName: 'Mathematics Reasoning',
          subSkills: [
            {
              subSkillName: 'Algebraic Reasoning',
              questionsCompleted: 35,
              accuracy: 64,
              difficulty1Accuracy: 74,
              difficulty2Accuracy: 61,
              difficulty3Accuracy: 54,
              recommendedLevel: 2,
            },
            {
              subSkillName: 'Geometric & Spatial Reasoning',
              questionsCompleted: 38,
              accuracy: 69,
              difficulty1Accuracy: 79,
              difficulty2Accuracy: 66,
              difficulty3Accuracy: 59,
              recommendedLevel: 2,
            },
            {
              subSkillName: 'Data Interpretation and Statistics',
              questionsCompleted: 32,
              accuracy: 72,
              difficulty1Accuracy: 81,
              difficulty2Accuracy: 69,
              difficulty3Accuracy: 65,
              recommendedLevel: 2,
            },
            {
              subSkillName: 'Numerical Operations',
              questionsCompleted: 40,
              accuracy: 77,
              difficulty1Accuracy: 86,
              difficulty2Accuracy: 74,
              difficulty3Accuracy: 70,
              recommendedLevel: 3,
            },
          ],
        },
        {
          sectionName: 'Reading Reasoning',
          subSkills: [
            {
              subSkillName: 'Inferential Reasoning',
              questionsCompleted: 28,
              accuracy: 81,
              difficulty1Accuracy: 89,
              difficulty2Accuracy: 78,
              difficulty3Accuracy: 74,
              recommendedLevel: 3,
            },
            {
              subSkillName: 'Character Analysis',
              questionsCompleted: 25,
              accuracy: 74,
              difficulty1Accuracy: 84,
              difficulty2Accuracy: 71,
              difficulty3Accuracy: 65,
              recommendedLevel: 2,
            },
            {
              subSkillName: 'Theme & Message Analysis',
              questionsCompleted: 22,
              accuracy: 69,
              difficulty1Accuracy: 77,
              difficulty2Accuracy: 66,
              difficulty3Accuracy: 61,
              recommendedLevel: 2,
            },
          ],
        },
      ],
      recentActivity: [
        {
          subSkillName: 'Vocabulary in Context',
          difficulty: 3,
          accuracy: 80,
          completedAt: '2024-06-16T15:30:00Z',
        },
        {
          subSkillName: 'Numerical Operations',
          difficulty: 2,
          accuracy: 85,
          completedAt: '2024-06-16T14:15:00Z',
        },
        {
          subSkillName: 'Pattern Recognition & Sequences',
          difficulty: 3,
          accuracy: 75,
          completedAt: '2024-06-16T11:45:00Z',
        },
        {
          subSkillName: 'Inferential Reasoning',
          difficulty: 2,
          accuracy: 90,
          completedAt: '2024-06-15T18:20:00Z',
        },
        {
          subSkillName: 'Algebraic Reasoning',
          difficulty: 1,
          accuracy: 70,
          completedAt: '2024-06-15T16:10:00Z',
        },
      ],
    };
    }

    try {
      // Get completed sessions from both drill_sessions (regular drills) and user_test_sessions (writing drills)
      const [drillSessionsResult, userTestSessionsResult] = await Promise.all([
        supabase
          .from('drill_sessions')
          .select('*')
          .eq('user_id', userId)
          .eq('product_type', productType)
          .eq('status', 'completed'),
        supabase
          .from('user_test_sessions')
          .select('*')
          .eq('user_id', userId)
          .eq('product_type', productType)
          .eq('test_mode', 'drill')
          .eq('status', 'completed')
      ]);

      if (drillSessionsResult.error) {
        console.error('❌ Error fetching drill sessions:', drillSessionsResult.error);
        throw drillSessionsResult.error;
      }
      
      if (userTestSessionsResult.error) {
        console.error('❌ Error fetching writing drill sessions:', userTestSessionsResult.error);
        throw userTestSessionsResult.error;
      }

      const drillSessions = drillSessionsResult.data || [];
      const writingDrillSessions = userTestSessionsResult.data || [];

      if (drillSessions.length === 0 && writingDrillSessions.length === 0) {
        return {
          totalQuestions: 0,
          overallAccuracy: 0,
          subSkillBreakdown: [],
          recentActivity: [],
        };
      }

      // Process regular drill sessions
      const regularDrillSessionsWithInfo = await Promise.all(
        drillSessions.map(async (session) => {
          if (!session.question_ids || session.question_ids.length === 0) {
            return { ...session, subSkillName: 'Unknown', sectionName: 'Unknown' };
          }

          // Get the first question to extract sub-skill and section info
          const { data: questionData, error: questionError } = await supabase
            .from('questions')
            .select('sub_skill, section_name')
            .eq('id', session.question_ids[0])
            .single();

          if (questionError || !questionData) {
            console.log(`❌ Could not get question info for session ${session.id}:`, questionError);
            return { ...session, subSkillName: 'Unknown', sectionName: 'Unknown' };
          }

          return {
            ...session,
            subSkillName: questionData.sub_skill || 'Unknown',
            sectionName: questionData.section_name || 'Unknown'
          };
        })
      );
      
      // Process writing drill sessions from user_test_sessions
      const writingDrillSessionsWithInfo = writingDrillSessions.map(session => {
        const sectionName = session.section_name || '';
        
        // Check if this is a writing drill session
        const isWritingSession = sectionName.toLowerCase().includes('writing') || 
                                sectionName.toLowerCase().includes('written') ||
                                sectionName.toLowerCase().includes('expression');
        
        if (isWritingSession) {
          // For writing drills, extract section from section_name
          const subSkillName = sectionName;
          
          return {
            ...session,
            subSkillName: subSkillName,
            sectionName: sectionName,
            // Map user_test_sessions fields to drill_sessions format
            questions_answered: Math.max(session.current_question_index + 1, 1),
            questions_correct: Math.max(session.current_question_index + 1, 1), // For writing, attempted = correct for analytics
            questions_total: session.total_questions || 1,
            difficulty: (() => {
              // Parse essay number from section name to determine difficulty
              // Format: "Narrative Writing - Essay 1" -> Essay 1 = difficulty 1, Essay 2 = difficulty 2, Essay 3 = difficulty 3
              const essayMatch = session.section_name?.match(/Essay\s*(\d+)/i);
              if (essayMatch) {
                const essayNumber = parseInt(essayMatch[1]);
                return essayNumber; // Essay 1 -> difficulty 1, Essay 2 -> difficulty 2, Essay 3 -> difficulty 3
              }
              return 2; // Default to medium if no essay number found
            })(),
            isWritingDrill: true
          };
        }
        
        return null;
      }).filter(Boolean);
      
      // Combine both types of sessions
      const allSessionsWithSubSkillInfo = [...regularDrillSessionsWithInfo, ...writingDrillSessionsWithInfo];

      // Calculate totals
      const totalQuestions = allSessionsWithSubSkillInfo.reduce((sum, session) => sum + (session.questions_answered || 0), 0);
      const totalCorrect = allSessionsWithSubSkillInfo.reduce((sum, session) => sum + (session.questions_correct || 0), 0);
      const overallAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

      // Group by section and sub-skill
      const sectionMap = new Map<string, Map<string, {
        sessions: Array<any>;
        totalQuestions: number;
        totalCorrect: number;
        totalMaxPoints: number;
        totalEarnedPoints: number;
        isWritingDrill: boolean;
        difficultyStats: Record<number, { questions: number; correct: number; maxPoints: number; earnedPoints: number }>;
      }>>();

      // Process each session and handle writing drills specially
      const processedSessions = await Promise.all(
        allSessionsWithSubSkillInfo.map(async (session) => {
          const sectionName = session.sectionName;
          const subSkillName = session.subSkillName;
          const difficulty = session.difficulty || 1;
          
          // Check if this is a writing drill - use the flag if it exists, otherwise check by name
          const isWritingDrill = session.isWritingDrill || 
                                subSkillName.toLowerCase().includes('writing') ||
                                subSkillName.toLowerCase().includes('written') ||
                                subSkillName.toLowerCase().includes('expression');
          
          let totalQuestions = session.questions_answered || 0;
          let totalCorrect = session.questions_correct || 0;
          let totalMaxPoints = totalQuestions; // Default assumption for non-writing
          let totalEarnedPoints = totalCorrect;
          
          if (isWritingDrill && session.text_answers_data) {
            // For writing drills, get the actual scoring from writing assessments
            try {
              // Get question IDs from this session
              // For user_test_sessions, check both question_ids and question_order
              let questionIds = session.question_ids || session.question_order || [];
              
              // If no question IDs found, try to look up questions by section name
              if (questionIds.length === 0 && session.section_name) {
                const { data: sectionQuestions, error: sectionError } = await supabase
                  .from('questions')
                  .select('id')
                  .eq('product_type', productType)
                  .ilike('sub_skill', `%${session.section_name}%`)
                  .limit(session.total_questions || 1);
                
                if (!sectionError && sectionQuestions && sectionQuestions.length > 0) {
                  questionIds = sectionQuestions.map(q => q.id);
                  }
              }
              
              if (questionIds.length > 0) {
                // Get questions to find max points
                const { data: questions, error: questionsError } = await supabase
                  .from('questions')
                  .select('id, max_points')
                  .in('id', questionIds);
                
                if (!questionsError && questions) {
                  totalMaxPoints = questions.reduce((sum, q) => sum + (q.max_points || 1), 0);
                  
                  // Get writing assessments for this session
                  const { data: assessments, error: assessmentsError } = await supabase
                    .from('writing_assessments')
                    .select('total_score, max_possible_score')
                    .in('question_id', questionIds);
                  
                  if (!assessmentsError && assessments && assessments.length > 0) {
                    totalEarnedPoints = assessments.reduce((sum, a) => sum + (a.total_score || 0), 0);
                    // Use max points from assessments if available
                    const assessmentMaxPoints = assessments.reduce((sum, a) => sum + (a.max_possible_score || 0), 0);
                    if (assessmentMaxPoints > 0) {
                      totalMaxPoints = assessmentMaxPoints;
                    }
                    
                    } else {
                    // Fallback: if no writing assessments exist yet, use a default scoring
                    // This can happen if the essay hasn't been graded yet
                    totalEarnedPoints = Math.round(totalMaxPoints * 0.75); // Default to 75% score for completed writing
                  }
                }
              }
            } catch (error) {
              console.error(`❌ Error getting writing assessment data for drill session ${session.id}:`, error);
            }
          }
          
          return {
            ...session,
            isWritingDrill,
            totalQuestions,
            totalCorrect,
            totalMaxPoints,
            totalEarnedPoints
          };
        })
      );
      
      // Now group by section and sub-skill using processed data
      processedSessions.forEach(session => {
        const sectionName = session.sectionName;
        const subSkillName = session.subSkillName;
        const difficulty = session.difficulty || 1;

        if (!sectionMap.has(sectionName)) {
          sectionMap.set(sectionName, new Map());
        }

        const subSkillMap = sectionMap.get(sectionName)!;
        if (!subSkillMap.has(subSkillName)) {
          subSkillMap.set(subSkillName, {
            sessions: [],
            totalQuestions: 0,
            totalCorrect: 0,
            totalMaxPoints: 0,
            totalEarnedPoints: 0,
            isWritingDrill: session.isWritingDrill,
            difficultyStats: { 
              1: { questions: 0, correct: 0, maxPoints: 0, earnedPoints: 0 }, 
              2: { questions: 0, correct: 0, maxPoints: 0, earnedPoints: 0 }, 
              3: { questions: 0, correct: 0, maxPoints: 0, earnedPoints: 0 } 
            },
          });
        }

        const subSkillData = subSkillMap.get(subSkillName)!;
        subSkillData.sessions.push(session);
        subSkillData.totalQuestions += session.totalQuestions;
        subSkillData.totalCorrect += session.totalCorrect;
        subSkillData.totalMaxPoints += session.totalMaxPoints;
        subSkillData.totalEarnedPoints += session.totalEarnedPoints;
        
        // Update difficulty stats
        subSkillData.difficultyStats[difficulty].questions += session.totalQuestions;
        subSkillData.difficultyStats[difficulty].correct += session.totalCorrect;
        subSkillData.difficultyStats[difficulty].maxPoints += session.totalMaxPoints;
        subSkillData.difficultyStats[difficulty].earnedPoints += session.totalEarnedPoints;
      });

      // Transform to expected format
      const subSkillBreakdown = Array.from(sectionMap.entries()).map(([sectionName, subSkillMap]) => ({
        sectionName,
        subSkills: Array.from(subSkillMap.entries()).map(([subSkillName, data]) => {
          // For writing drills, use earned points / max points for accuracy
          // For regular drills, use correct / questions
          const accuracy = data.isWritingDrill 
            ? (data.totalMaxPoints > 0 ? Math.round((data.totalEarnedPoints / data.totalMaxPoints) * 100) : 0)
            : (data.totalQuestions > 0 ? Math.round((data.totalCorrect / data.totalQuestions) * 100) : 0);
          
          const difficulty1Accuracy = data.isWritingDrill
            ? (data.difficultyStats[1].maxPoints > 0 
                ? Math.round((data.difficultyStats[1].earnedPoints / data.difficultyStats[1].maxPoints) * 100) 
                : 0)
            : (data.difficultyStats[1].questions > 0 
                ? Math.round((data.difficultyStats[1].correct / data.difficultyStats[1].questions) * 100) 
                : 0);
                
          const difficulty2Accuracy = data.isWritingDrill
            ? (data.difficultyStats[2].maxPoints > 0 
                ? Math.round((data.difficultyStats[2].earnedPoints / data.difficultyStats[2].maxPoints) * 100) 
                : 0)
            : (data.difficultyStats[2].questions > 0 
                ? Math.round((data.difficultyStats[2].correct / data.difficultyStats[2].questions) * 100) 
                : 0);
                
          const difficulty3Accuracy = data.isWritingDrill
            ? (data.difficultyStats[3].maxPoints > 0 
                ? Math.round((data.difficultyStats[3].earnedPoints / data.difficultyStats[3].maxPoints) * 100) 
                : 0)
            : (data.difficultyStats[3].questions > 0 
                ? Math.round((data.difficultyStats[3].correct / data.difficultyStats[3].questions) * 100) 
                : 0);

          // Recommend next difficulty level
          let recommendedLevel: 1 | 2 | 3 = 1;
          if (difficulty1Accuracy >= 80 && difficulty2Accuracy >= 80) {
            recommendedLevel = 3;
          } else if (difficulty1Accuracy >= 80) {
            recommendedLevel = 2;
          }

          return {
            subSkillName,
            questionsCompleted: data.totalQuestions,
            accuracy,
            difficulty1Accuracy,
            difficulty2Accuracy,
            difficulty3Accuracy,
            difficulty1Questions: data.difficultyStats[1].questions,
            difficulty1Correct: data.isWritingDrill ? data.difficultyStats[1].earnedPoints : data.difficultyStats[1].correct,
            difficulty2Questions: data.difficultyStats[2].questions,
            difficulty2Correct: data.isWritingDrill ? data.difficultyStats[2].earnedPoints : data.difficultyStats[2].correct,
            difficulty3Questions: data.difficultyStats[3].questions,
            difficulty3Correct: data.isWritingDrill ? data.difficultyStats[3].earnedPoints : data.difficultyStats[3].correct,
            // Add max points fields for writing drills
            difficulty1MaxPoints: data.isWritingDrill ? data.difficultyStats[1].maxPoints : undefined,
            difficulty2MaxPoints: data.isWritingDrill ? data.difficultyStats[2].maxPoints : undefined,
            difficulty3MaxPoints: data.isWritingDrill ? data.difficultyStats[3].maxPoints : undefined,
            totalMaxPoints: data.isWritingDrill ? data.totalMaxPoints : undefined,
            totalEarnedPoints: data.isWritingDrill ? data.totalEarnedPoints : undefined,
            isWritingDrill: data.isWritingDrill,
            recommendedLevel,
          };
        }),
      }));

      // Recent activity (last 10 drill sessions)
      const recentActivity = processedSessions
        .sort((a, b) => new Date(b.completed_at || b.started_at).getTime() - new Date(a.completed_at || a.started_at).getTime())
        .slice(0, 10)
        .map(session => ({
          subSkillName: session.subSkillName,
          difficulty: session.difficulty || 1,
          accuracy: session.isWritingDrill
            ? (session.totalMaxPoints > 0 ? Math.round((session.totalEarnedPoints / session.totalMaxPoints) * 100) : 0)
            : (session.totalQuestions > 0 ? Math.round((session.totalCorrect / session.totalQuestions) * 100) : 0),
          completedAt: session.completed_at || session.started_at,
        }));

      return {
        totalQuestions,
        overallAccuracy,
        subSkillBreakdown,
        recentActivity,
      };

    } catch (error) {
      console.error('❌ Error in getDrillResults:', error);
      throw error;
    }
  }
}