import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Target, CheckCircle, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { fetchQuestionsFromSupabase } from '@/services/supabaseQuestionService';

// Helper function to parse answer options (same logic as supabaseQuestionService.ts)
const parseAnswerOptions = (answerOptions: any): string[] => {
  if (!answerOptions) return [];
  
  if (Array.isArray(answerOptions)) {
    return answerOptions;
  }
  
  if (typeof answerOptions === 'object') {
    // Handle object format like { "A": "option1", "B": "option2", ... }
    const keys = Object.keys(answerOptions).sort();
    return keys.map(key => answerOptions[key]);
  }
  
  return [];
};

interface DeveloperToolsProps {
  testType: 'diagnostic' | 'drill' | 'practice';
  selectedProduct: string;
  onDataChanged?: () => void;
}

// Helper function to clean text and remove null characters
const cleanText = (text: any): string => {
  if (!text) return '';
  const str = String(text);
  return str.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim();
};

// Map frontend product IDs to database product_type values - MUST match exactly with Diagnostic.tsx
const getDbProductType = (productId: string): string => {
  const productMap: Record<string, string> = {
    'vic-selective': 'VIC Selective Entry (Year 9 Entry)',
    'nsw-selective': 'NSW Selective Entry (Year 7 Entry)',
    'year-5-naplan': 'Year 5 NAPLAN',
    'year-7-naplan': 'Year 7 NAPLAN',
    'edutest-year-7': 'EduTest Scholarship (Year 7 Entry)',
    'acer-year-7': 'ACER Scholarship (Year 7 Entry)'
  };
  console.log('🗺️ DEV: Mapping productId:', productId, 'to dbProductType:', productMap[productId] || productId);
  return productMap[productId] || productId;
};

export const DeveloperTools: React.FC<DeveloperToolsProps> = ({
  testType,
  selectedProduct,
  onDataChanged
}) => {
  const { user } = useAuth();

  if (!user || import.meta.env.PROD) {
    return null;
  }

  // Helper function to clear all data without confirmation
  const clearAllData = async (dbProductType: string) => {
    console.log(`🧹 DEV: Starting clearAllData - testType: ${testType}, dbProductType: ${dbProductType}, userId: ${user?.id}`);

    if (!user?.id) {
      throw new Error('User ID not found');
    }

    try {
      // First, let's see what data actually exists
      console.log('🔍 DEV: Checking existing data...');
      
      const { data: existingSessions } = await supabase
        .from('user_test_sessions')
        .select('*')
        .eq('user_id', user.id);
      
      console.log('🔍 DEV: Existing user_test_sessions:', existingSessions);

      if (testType === 'drill') {
        console.log('🧹 DEV: Clearing drill_sessions...');
        const { data: existingDrills } = await supabase
          .from('drill_sessions')
          .select('*')
          .eq('user_id', user.id);
        
        console.log('🔍 DEV: Existing drill_sessions:', existingDrills);

        const { error: drillSessionsError } = await supabase
          .from('drill_sessions')
          .delete()
          .eq('user_id', user.id);

        console.log('🧹 DEV: Cleared drill_sessions');
        if (drillSessionsError) {
          console.warn('Warning clearing drill sessions:', drillSessionsError);
        }
      }

      // Step 1: Clear all question_attempt_history for this user
      console.log('🧹 DEV: Step 1 - Clearing all question_attempt_history...');
      try {
        const { error: attemptsError } = await supabase
          .from('question_attempt_history')
          .delete()
          .eq('user_id', user.id);

        console.log('🧹 DEV: Cleared question attempts');
        if (attemptsError) {
          console.warn('Warning clearing attempt history:', attemptsError);
        }
      } catch (e) {
        console.warn('Error clearing question_attempt_history:', e);
      }

      // Step 2: Get all session IDs first for foreign key references
      console.log('🧹 DEV: Step 2 - Getting session IDs for foreign key cleanup...');
      const { data: allSessionIds } = await supabase
        .from('user_test_sessions')
        .select('id')
        .eq('user_id', user.id);
      
      const sessionIdArray = allSessionIds?.map(s => s.id) || [];
      console.log(`🧹 DEV: Found ${sessionIdArray.length} sessions to clean references for`);

      // Step 3: Clear writing_assessments by session_id
      if (sessionIdArray.length > 0) {
        console.log('🧹 DEV: Step 3 - Clearing writing_assessments by session_id...');
        try {
          const { error: writingError } = await supabase
            .from('writing_assessments')
            .delete()
            .in('session_id', sessionIdArray);

          console.log('🧹 DEV: Cleared writing_assessments');
          if (writingError && writingError.code !== '42P01') {
            console.warn('Warning clearing writing assessments:', writingError);
          }
        } catch (e) {
          console.warn('Error clearing writing_assessments:', e);
        }

        // Step 4: Clear test_section_states by test_session_id
        console.log('🧹 DEV: Step 4 - Clearing test_section_states by test_session_id...');
        try {
          const { error: sectionStatesError } = await supabase
            .from('test_section_states')
            .delete()
            .in('test_session_id', sessionIdArray);

          console.log('🧹 DEV: Cleared test_section_states');
          if (sectionStatesError) {
            console.warn('Warning clearing section states:', sectionStatesError);
          }
        } catch (e) {
          console.warn('Error clearing test_section_states:', e);
        }
      } else {
        console.log('🧹 DEV: No sessions found, skipping foreign key cleanup');
      }

      // Step 5: Clear all user_test_sessions for this user
      console.log('🧹 DEV: Step 5 - Clearing all user_test_sessions...');
      
      // First check how many sessions exist
      const { data: sessionsToDelete, error: checkError } = await supabase
        .from('user_test_sessions')
        .select('id')
        .eq('user_id', user.id);
        
      if (checkError) {
        console.warn('Warning checking existing sessions:', checkError);
      }
      
      console.log(`🧹 DEV: Found ${sessionsToDelete?.length || 0} sessions to delete`);
      
      if (sessionsToDelete && sessionsToDelete.length > 0) {
        // Delete without count to avoid RLS issues with count queries
        const { error: sessionsError } = await supabase
          .from('user_test_sessions')
          .delete()
          .eq('user_id', user.id);

        if (sessionsError) {
          console.error('🧹 DEV: Error deleting sessions:', sessionsError);
          throw new Error(`Failed to clear user_test_sessions: ${sessionsError.message}`);
        } else {
          console.log(`🧹 DEV: Successfully deleted ${sessionsToDelete.length} user_test_sessions`);
        }
      } else {
        console.log('🧹 DEV: No sessions to delete');
      }

      // Step 6: Clear user_progress data
      console.log('🧹 DEV: Step 6 - Clearing user_progress...');
      try {
        const { error: progressError } = await supabase
          .from('user_progress')
          .delete()
          .eq('user_id', user.id);

        console.log('🧹 DEV: Cleared user_progress records');
        if (progressError) {
          console.warn('Warning clearing user progress:', progressError);
        }
      } catch (e) {
        console.warn('Error clearing user_progress:', e);
      }

      // Step 7: Clear user_sub_skill_performance data
      console.log('🧹 DEV: Step 7 - Clearing user_sub_skill_performance...');
      try {
        const { error: skillError } = await supabase
          .from('user_sub_skill_performance')
          .delete()
          .eq('user_id', user.id);

        console.log('🧹 DEV: Cleared user_sub_skill_performance records');
        if (skillError) {
          console.warn('Warning clearing skill performance:', skillError);
        }
      } catch (e) {
        console.warn('Error clearing user_sub_skill_performance:', e);
      }

      console.log('🧹 DEV: Successfully cleared all data');
    } catch (error) {
      console.error('🧹 DEV: Error in clearAllData:', error);
      throw error;
    }
  };

  const createSimpleHalfCompleteData = async (dbProductType: string) => {
    console.log(`🎯 DEV: Creating simple half-complete data for ${testType} with product ${dbProductType}`);
    
    try {
      // Get available sections/questions from the database with more detailed logging
      const testModeQuery = testType === 'practice' ? 'practice_1' : testType;
      console.log(`🎯 DEV: Querying questions with product_type='${dbProductType}', test_mode='${testModeQuery}'`);
      
      const { data: availableQuestions, error: queryError } = await supabase
        .from('questions')
        .select('section_name, sub_skill_id, difficulty, id')
        .eq('product_type', dbProductType)
        .eq('test_mode', testModeQuery);

      if (queryError) {
        console.error(`❌ DEV: Error querying questions:`, queryError);
        throw queryError;
      }

      console.log(`🎯 DEV: Found ${availableQuestions?.length || 0} questions for ${testType}`);
      console.log(`🎯 DEV: Sample questions:`, availableQuestions?.slice(0, 3));

      if (!availableQuestions || availableQuestions.length === 0) {
        console.warn(`❌ DEV: No questions found for ${testType} with product ${dbProductType}`);
        
        // Let's also check what products and test modes exist
        const { data: allQuestions } = await supabase
          .from('questions')
          .select('product_type, test_mode')
          .limit(10);
        console.log(`🔍 DEV: Available products/modes in database:`, allQuestions);
        return;
      }

      if (testType === 'diagnostic' || testType === 'practice') {
        // Get unique sections and filter out null/undefined
        const sections = [...new Set(availableQuestions.map(q => q.section_name))].filter(Boolean);
        console.log(`🎯 DEV: Creating sessions for ${sections.length} sections:`, sections);

        for (let i = 0; i < sections.length; i++) {
          const sectionName = sections[i];
          console.log(`🎯 DEV: Processing section ${i+1}/${sections.length}: "${sectionName}"`);
          
          if (i < Math.floor(sections.length * 0.4)) {
            // 40% completed
            console.log(`🎯 DEV: Creating COMPLETED session for "${sectionName}"`);
            await createBasicSession(dbProductType, sectionName, 'completed', testType);
          } else if (i < Math.floor(sections.length * 0.7)) {
            // 30% in-progress
            console.log(`🎯 DEV: Creating ACTIVE session for "${sectionName}"`);
            await createBasicSession(dbProductType, sectionName, 'active', testType);
          } else {
            console.log(`🎯 DEV: Leaving "${sectionName}" as NOT STARTED`);
          }
        }
      } else if (testType === 'drill') {
        // Get unique sub-skills and filter out null/undefined
        const subSkills = [...new Set(availableQuestions.map(q => q.sub_skill_id))].filter(Boolean);
        console.log(`🎯 DEV: Creating drill sessions for ${subSkills.length} sub-skills:`, subSkills);

        for (let i = 0; i < subSkills.length; i++) {
          const subSkillId = subSkills[i];
          console.log(`🎯 DEV: Processing sub-skill ${i+1}/${subSkills.length}: ${subSkillId}`);
          
          if (i < Math.floor(subSkills.length * 0.4)) {
            // 40% of sub-skills: complete ALL difficulties
            console.log(`🎯 DEV: Creating COMPLETED drill sessions for all difficulties of ${subSkillId}`);
            for (const difficulty of [1, 2, 3]) {
              await createBasicDrillSession(dbProductType, subSkillId, difficulty, 'completed');
            }
          } else if (i < Math.floor(subSkills.length * 0.7)) {
            // 30% of sub-skills: partially complete (only some difficulties)
            console.log(`🎯 DEV: Creating PARTIAL drill sessions for ${subSkillId}`);
            await createBasicDrillSession(dbProductType, subSkillId, 1, 'completed'); // Easy completed
            await createBasicDrillSession(dbProductType, subSkillId, 2, 'active'); // Medium in-progress
            // Hard not started (no session created)
          } else {
            console.log(`🎯 DEV: Leaving all difficulties of ${subSkillId} as NOT STARTED`);
          }
        }
      }

      console.log(`✅ DEV: Successfully created half-complete data for ${testType}`);
    } catch (error) {
      console.error(`❌ DEV: Error creating half-complete data:`, error);
      throw error;
    }
  };

  const createSimpleFinishAllData = async (dbProductType: string) => {
    console.log(`🏁 DEV: Creating simple finish-all data for ${testType} with product ${dbProductType}`);
    
    try {
      // Get available sections/questions from the database with detailed logging
      const testModeQuery = testType === 'practice' ? 'practice_1' : testType;
      console.log(`🏁 DEV: Querying questions with product_type='${dbProductType}', test_mode='${testModeQuery}'`);
      
      const { data: availableQuestions, error: queryError } = await supabase
        .from('questions')
        .select('section_name, sub_skill_id, difficulty, id')
        .eq('product_type', dbProductType)
        .eq('test_mode', testModeQuery);

      if (queryError) {
        console.error(`❌ DEV: Error querying questions:`, queryError);
        throw queryError;
      }

      console.log(`🏁 DEV: Found ${availableQuestions?.length || 0} questions for ${testType}`);
      console.log(`🏁 DEV: Sample questions:`, availableQuestions?.slice(0, 3));

      if (!availableQuestions || availableQuestions.length === 0) {
        console.warn(`❌ DEV: No questions found for ${testType} with product ${dbProductType}`);
        
        // Let's also check what products and test modes exist
        const { data: allQuestions } = await supabase
          .from('questions')
          .select('product_type, test_mode')
          .limit(10);
        console.log(`🔍 DEV: Available products/modes in database:`, allQuestions);
        return;
      }

      if (testType === 'diagnostic' || testType === 'practice') {
        // Get unique sections and complete them all
        const sections = [...new Set(availableQuestions.map(q => q.section_name))].filter(Boolean);
        console.log(`🏁 DEV: Completing all ${sections.length} sections with realistic test data:`, sections);

        for (let i = 0; i < sections.length; i++) {
          const sectionName = sections[i];
          console.log(`🏁 DEV: Creating COMPLETED session for "${sectionName}" (${i+1}/${sections.length})`);
          await createRealisticSession(dbProductType, sectionName, 'completed', testType);
        }
      } else if (testType === 'drill') {
        // Get unique sub-skills and complete them all
        const subSkills = [...new Set(availableQuestions.map(q => q.sub_skill_id))].filter(Boolean);
        console.log(`🏁 DEV: Completing all drill sessions for ${subSkills.length} sub-skills:`, subSkills);

        // Let's also look at what the questions structure looks like
        console.log(`🏁 DEV: Sample questions for debugging:`, availableQuestions.slice(0, 3).map(q => ({
          id: q.id,
          sub_skill_id: q.sub_skill_id,
          section_name: q.section_name,
          difficulty: q.difficulty
        })));

        let sessionCount = 0;
        for (const subSkillId of subSkills) {
          console.log(`🏁 DEV: Processing sub-skill: "${subSkillId}" (type: ${typeof subSkillId}, length: ${subSkillId?.length})`);
          for (const difficulty of [1, 2, 3]) {
            sessionCount++;
            console.log(`🏁 DEV: Creating COMPLETED drill session for ${subSkillId}-${difficulty} (${sessionCount})`);
            await createBasicDrillSession(dbProductType, subSkillId, difficulty, 'completed');
          }
        }
      }

      console.log(`✅ DEV: Successfully created finish-all data for ${testType}`);
    } catch (error) {
      console.error(`❌ DEV: Error creating finish-all data:`, error);
      throw error;
    }
  };

  const createRealisticSession = async (dbProductType: string, sectionName: string, status: string, mode: string) => {
    console.log(`📝 DEV: Creating REALISTIC ${status} session for ${sectionName}...`);
    
    let questions: any[] = [];
    
    try {
      if (mode === 'practice') {
        // Use fetchQuestionsFromSupabase for practice tests (works correctly)
        const organizedData = await fetchQuestionsFromSupabase();
        const currentTestType = organizedData.testTypes.find(tt => tt.id === selectedProduct);
        
        if (!currentTestType) {
          console.warn(`No test type found for ${selectedProduct}, creating basic session anyway`);
          return;
        }

        // Find the section by name in practice modes
        let foundSection = null;
        for (const testMode of currentTestType.testModes) {
          if (testMode.id && testMode.id.startsWith('practice_')) {
            foundSection = testMode.sections.find(section => section.name === sectionName);
            if (foundSection && foundSection.questions.length > 0) {
              console.log(`📝 DEV: Found section in mode: ${testMode.name}`);
              break;
            }
          }
        }

        if (!foundSection || foundSection.questions.length === 0) {
          console.warn(`No practice questions found for ${sectionName}, creating basic session anyway`);
          return;
        }

        questions = foundSection.questions;
        console.log(`📝 DEV: Found ${questions.length} practice questions for ${sectionName}`);
        
        // Apply same Reading section reorganization as for diagnostic tests
        const isReadingSection = sectionName.toLowerCase().includes('reading') || 
                                 sectionName.toLowerCase().includes('comprehension');
        
        if (isReadingSection) {
          console.log(`📝 DEV: Applying Reading section reorganization for practice ${sectionName}`);
          
          // Group questions by passage content, keeping non-passage questions at the end
          const questionsWithPassage = questions.filter(q => q.passageContent);
          const questionsWithoutPassage = questions.filter(q => !q.passageContent);
          
          // Sort questions with passages by some identifier to group them
          const passageGroups = new Map();
          questionsWithPassage.forEach(q => {
            // Use passage content as grouping key (same logic as diagnostic)
            const passageKey = q.passageContent?.substring(0, 50) || 'unknown';
            if (!passageGroups.has(passageKey)) {
              passageGroups.set(passageKey, []);
            }
            passageGroups.get(passageKey).push(q);
          });
          
          // Reorganize: all questions from passage 1, then passage 2, etc., then non-passage questions
          questions = [
            ...Array.from(passageGroups.values()).flat(),
            ...questionsWithoutPassage
          ];
          
          console.log(`📝 DEV: Reorganized Practice Reading section into ${passageGroups.size} passage groups with ${questionsWithoutPassage.length} non-passage questions`);
        }
        
      } else if (mode === 'diagnostic') {
        // Use direct Supabase query for diagnostic (more reliable)  
        const { data: rawQuestions, error: questionsError } = await supabase
          .from('questions')
          .select('id, question_text, answer_options, correct_answer, solution, question_order, passage_id')
          .eq('product_type', dbProductType)
          .eq('section_name', sectionName)
          .eq('test_mode', 'diagnostic')
          .order('question_order')
          .limit(50); // Get more questions to ensure we have enough

        if (questionsError || !rawQuestions || rawQuestions.length === 0) {
          console.warn(`No diagnostic questions found for ${sectionName}, creating basic session anyway`);
          return;
        }

        // Fetch passage data for questions that have passage_id
        const passageIds = rawQuestions
          .filter(q => q.passage_id)
          .map(q => q.passage_id);
          
        let passages: any[] = [];
        if (passageIds.length > 0) {
          const { data: passageData } = await supabase
            .from('passages')
            .select('*')
            .in('id', passageIds);
          passages = passageData || [];
        }
        
        const passageMap = new Map(passages.map(p => [p.id, p]));

        // Convert to the same format as fetchQuestionsFromSupabase (using same parseAnswerOptions logic)
        questions = rawQuestions.map((q: any) => {
          const options = parseAnswerOptions(q.answer_options);
          const correctAnswer = q.correct_answer && q.correct_answer.length === 1 ? 
            q.correct_answer.charCodeAt(0) - 65 : 0; // Convert A,B,C,D to 0,1,2,3
          const passage = q.passage_id ? passageMap.get(q.passage_id) : undefined;
          
          return {
            id: q.id,
            text: q.question_text,
            options,
            correctAnswer,
            explanation: q.solution || 'No explanation provided',
            passageContent: passage?.content
          };
        });
        
        console.log(`📝 DEV: Found ${questions.length} diagnostic questions for ${sectionName}`);
        
        // Apply same Reading section reorganization as TestTaking.tsx
        const isReadingSection = sectionName.toLowerCase().includes('reading') || 
                                 sectionName.toLowerCase().includes('comprehension');
        
        if (isReadingSection) {
          console.log(`📝 DEV: Applying Reading section reorganization for ${sectionName}`);
          
          // Group questions by passage_id, keeping non-passage questions at the end
          const questionsWithPassage = questions.filter(q => q.passageContent);
          const questionsWithoutPassage = questions.filter(q => !q.passageContent);
          
          // Sort questions with passages by some identifier to group them
          const passageGroups = new Map();
          questionsWithPassage.forEach(q => {
            // Use passage content as grouping key (same logic as TestTaking.tsx)
            const passageKey = q.passageContent?.substring(0, 50) || 'unknown';
            if (!passageGroups.has(passageKey)) {
              passageGroups.set(passageKey, []);
            }
            passageGroups.get(passageKey).push(q);
          });
          
          // Reorganize: all questions from passage 1, then passage 2, etc., then non-passage questions
          questions = [
            ...Array.from(passageGroups.values()).flat(),
            ...questionsWithoutPassage
          ];
          
          console.log(`📝 DEV: Reorganized Reading section into ${passageGroups.size} passage groups with ${questionsWithoutPassage.length} non-passage questions`);
        }
      }

      if (questions.length === 0) {
        console.warn(`No questions found for ${sectionName} in ${mode} mode, creating basic session anyway`);
        return;
      }
    
      const totalQuestions = questions.length;
      
      // NEW RULES FOR REALISTIC TEST DATA
      console.log(`🎯 DEV: Creating realistic test data for ${sectionName} with ${totalQuestions} questions`);
      
      // 1. Random number of blank questions (0 to 5 max, strictly enforced)
      const blankQuestions = Math.floor(Math.random() * 6); // 0 to 5, exactly as specified
      const questionsAttempted = totalQuestions - blankQuestions;
      
      // 2. Calculate correct answers to ensure overall score is 50-100%
      // Overall score = correctAnswers / totalQuestions * 100
      // So correctAnswers = (desiredScore / 100) * totalQuestions
      const desiredOverallScore = Math.floor(Math.random() * 51) + 50; // 50-100%
      const correctAnswers = Math.floor((desiredOverallScore / 100) * totalQuestions);
      
      // Ensure we don't have more correct answers than attempted questions
      const finalCorrectAnswers = Math.min(correctAnswers, questionsAttempted);
      
      console.log(`🎯 DEV: ${sectionName} realistic data:`, {
        totalQuestions,
        questionsAttempted,
        blankQuestions,
        desiredOverallScore: desiredOverallScore + '%',
        correctAnswers: finalCorrectAnswers,
        calculation: `${finalCorrectAnswers}/${questionsAttempted} attempted, ${finalCorrectAnswers}/${totalQuestions} total = ${Math.round((finalCorrectAnswers/totalQuestions)*100)}% overall score`
      });
      
      // Create realistic answer data with some blank answers
      const answersData: Record<string, string> = {};
      const flaggedQuestions: string[] = []; // Store as strings for TestTaking compatibility
      
      // Create array of question indices and shuffle to randomize which questions are left blank
      const questionIndices = Array.from({ length: totalQuestions }, (_, i) => i);
      const shuffledIndices = questionIndices.sort(() => Math.random() - 0.5);
      
      // First group: questions to leave blank
      const blankQuestionIndices = new Set(shuffledIndices.slice(0, blankQuestions));
      
      // Second group: questions to answer
      const answeredQuestionIndices = shuffledIndices.slice(blankQuestions);
      
      // Create answers for attempted questions
      for (let i = 0; i < answeredQuestionIndices.length; i++) {
        const qIndex = answeredQuestionIndices[i];
        const question = questions[qIndex];
        const isCorrect = i < finalCorrectAnswers; // First N answers are correct
        
        let selectedAnswerIndex: number;
        if (isCorrect) {
          selectedAnswerIndex = question.correctAnswer; // Use the correct answer index
        } else {
          // Pick a random incorrect answer
          const availableOptions = question.options.length;
          const incorrectOptions = [];
          for (let j = 0; j < availableOptions; j++) {
            if (j !== question.correctAnswer) {
              incorrectOptions.push(j);
            }
          }
          selectedAnswerIndex = incorrectOptions[Math.floor(Math.random() * incorrectOptions.length)];
        }
        
        // Store the full option text (same format as what TestTaking expects)
        if (question.options && question.options[selectedAnswerIndex]) {
          answersData[qIndex.toString()] = question.options[selectedAnswerIndex];
        }
        
        // Random flagging (5% chance)
        if (Math.random() < 0.05) {
          flaggedQuestions.push(qIndex.toString()); // Store as string for compatibility
        }
      }
      
      console.log(`📝 DEV: Created realistic answers:`, {
        totalAnswers: Object.keys(answersData).length,
        expectedAttempted: questionsAttempted,
        blankQuestionIndices: Array.from(blankQuestionIndices).sort(),
        sampleAnswers: Object.entries(answersData).slice(0, 3),
        flaggedQuestions: flaggedQuestions,
        sampleQuestions: questions.slice(0, 2).map((q, i) => ({
          index: i,
          id: q.id,
          text: q.text?.substring(0, 50) + '...',
          options: q.options,
          correctAnswer: q.correctAnswer
        }))
      });
      
      const sessionData = {
        user_id: user.id,
        product_type: dbProductType,
        test_mode: mode,
        section_name: sectionName,
        status: status,
        current_question_index: questionsAttempted, // Index of last attempted question
        total_questions: totalQuestions,
        questions_answered: questionsAttempted, // Total questions with answers
        correct_answers: finalCorrectAnswers, // Actual correct answers count
        final_score: Math.round((finalCorrectAnswers / totalQuestions) * 100), // Overall score including blanks
        completed_at: status === 'completed' ? new Date().toISOString() : null,
        answers_data: answersData,
        flagged_questions: flaggedQuestions,
        time_remaining_seconds: status === 'active' ? Math.floor(1800 * 0.4) : 0,
        question_order: questions.map(q => q.id) // Store the question order for accurate calculations
      };

      const { data: sessionResult, error } = await supabase
        .from('user_test_sessions')
        .insert(sessionData)
        .select('id')
        .single();

      if (error) {
        console.error(`❌ DEV: Error creating session for ${sectionName}:`, error);
        throw error;
      }

      console.log(`✅ DEV: Created realistic ${status} session for ${sectionName}:`, {
        sessionId: sessionResult.id,
        totalQuestions,
        questionsAttempted,
        correctAnswers: finalCorrectAnswers,
        overallScore: Math.round((finalCorrectAnswers / totalQuestions) * 100) + '%',
        accuracyOfAttempted: Math.round((finalCorrectAnswers / questionsAttempted) * 100) + '%'
      });
      
      // Create individual question attempt records for attempted questions only
      for (const [qIndexStr, userAnswerText] of Object.entries(answersData)) {
        const qIndex = parseInt(qIndexStr);
        const question = questions[qIndex];
        
        // Convert answer text back to letter format for attempt history
        let userAnswerLetter = '';
        let optionIndex = -1;
        if (userAnswerText && question.options) {
          optionIndex = question.options.findIndex(opt => opt === userAnswerText);
          if (optionIndex !== -1) {
            userAnswerLetter = String.fromCharCode(65 + optionIndex); // 0=A, 1=B, 2=C, 3=D
          }
        }
        
        const isCorrect = optionIndex === question.correctAnswer;
        
        const attemptData = {
          user_id: user.id,
          question_id: question.id,
          session_id: sessionResult.id,
          session_type: mode, // 'diagnostic', 'practice', or 'drill'
          user_answer: userAnswerLetter,
          is_correct: isCorrect,
          is_flagged: flaggedQuestions.includes(qIndex.toString()),
          is_skipped: false,
          time_spent_seconds: Math.floor(Math.random() * 180) + 60 // 60-240 seconds
        };

        const { error: attemptError } = await supabase
          .from('question_attempt_history')
          .insert(attemptData);

        if (attemptError) {
          console.warn(`Warning creating attempt for question ${question.id}:`, attemptError);
        }
      }
      
    } catch (error) {
      console.error(`❌ DEV: Error in createRealisticSession:`, error);
      throw error;
    }
  };

  const createBasicSession = async (dbProductType: string, sectionName: string, status: string, mode: string) => {
    console.log(`📝 DEV: Creating ${status} session for ${sectionName} with real answers...`);
    
    let questions: any[] = [];
    
    try {
      if (mode === 'practice') {
        // Use fetchQuestionsFromSupabase for practice tests (works correctly)
        const organizedData = await fetchQuestionsFromSupabase();
        const currentTestType = organizedData.testTypes.find(tt => tt.id === selectedProduct);
        
        if (!currentTestType) {
          console.warn(`No test type found for ${selectedProduct}, creating basic session anyway`);
          return;
        }

        // Find the section by name in practice modes
        let foundSection = null;
        for (const testMode of currentTestType.testModes) {
          if (testMode.id && testMode.id.startsWith('practice_')) {
            foundSection = testMode.sections.find(section => section.name === sectionName);
            if (foundSection && foundSection.questions.length > 0) {
              console.log(`📝 DEV: Found section in mode: ${testMode.name}`);
              break;
            }
          }
        }

        if (!foundSection || foundSection.questions.length === 0) {
          console.warn(`No practice questions found for ${sectionName}, creating basic session anyway`);
          return;
        }

        questions = foundSection.questions;
        console.log(`📝 DEV: Found ${questions.length} practice questions for ${sectionName}`);
        
        // Apply same Reading section reorganization as for diagnostic tests
        const isReadingSection = sectionName.toLowerCase().includes('reading') || 
                                 sectionName.toLowerCase().includes('comprehension');
        
        if (isReadingSection) {
          console.log(`📝 DEV: Applying Reading section reorganization for practice ${sectionName} (basic session)`);
          
          // Group questions by passage content, keeping non-passage questions at the end
          const questionsWithPassage = questions.filter(q => q.passageContent);
          const questionsWithoutPassage = questions.filter(q => !q.passageContent);
          
          // Sort questions with passages by some identifier to group them
          const passageGroups = new Map();
          questionsWithPassage.forEach(q => {
            // Use passage content as grouping key (same logic as diagnostic)
            const passageKey = q.passageContent?.substring(0, 50) || 'unknown';
            if (!passageGroups.has(passageKey)) {
              passageGroups.set(passageKey, []);
            }
            passageGroups.get(passageKey).push(q);
          });
          
          // Reorganize: all questions from passage 1, then passage 2, etc., then non-passage questions
          questions = [
            ...Array.from(passageGroups.values()).flat(),
            ...questionsWithoutPassage
          ];
          
          console.log(`📝 DEV: Reorganized Practice Reading section into ${passageGroups.size} passage groups with ${questionsWithoutPassage.length} non-passage questions (basic session)`);
        }
        
      } else if (mode === 'diagnostic') {
        // Use direct Supabase query for diagnostic (more reliable)
        const { data: rawQuestions, error: questionsError } = await supabase
          .from('questions')
          .select('id, question_text, answer_options, correct_answer, solution, question_order')
          .eq('product_type', dbProductType)
          .eq('section_name', sectionName)
          .eq('test_mode', 'diagnostic')
          .order('question_order')
          .limit(20);

        if (questionsError || !rawQuestions || rawQuestions.length === 0) {
          console.warn(`No diagnostic questions found for ${sectionName}, creating basic session anyway`);
          return;
        }

        // Convert to the same format as fetchQuestionsFromSupabase
        questions = rawQuestions.map((q: any) => ({
          id: q.id,
          text: q.question_text,
          options: Array.isArray(q.answer_options) ? q.answer_options : [],
          correctAnswer: q.correct_answer && q.correct_answer.length === 1 ? 
            q.correct_answer.charCodeAt(0) - 65 : 0, // Convert A,B,C,D to 0,1,2,3
          explanation: q.solution || 'No explanation provided'
        }));
        
        console.log(`📝 DEV: Found ${questions.length} diagnostic questions for ${sectionName}`);
      }

      if (questions.length === 0) {
        console.warn(`No questions found for ${sectionName} in ${mode} mode, creating basic session anyway`);
        return;
      }
    
      const totalQuestions = questions.length;
    // Ensure active sessions are truly incomplete and completed sessions are truly complete
    let questionsAnswered: number;
    if (status === 'completed') {
      questionsAnswered = totalQuestions; // All questions answered for completed sessions
    } else {
      // For active sessions, ensure we never answer all questions (leave at least 1 unanswered)
      // Handle inconsistent database question counts by ensuring we always have incomplete sessions
      const targetPercentage = 0.6; // Answer 60% of questions
      const maxAnswered = Math.max(1, totalQuestions - 1); // Always leave at least 1 question unanswered
      let calculatedAnswered = Math.floor(totalQuestions * targetPercentage);
      
      // Additional safety: if calculated would be all questions, reduce by 1-2 questions
      if (calculatedAnswered >= totalQuestions) {
        calculatedAnswered = Math.max(1, totalQuestions - 2);
      }
      
      questionsAnswered = Math.min(calculatedAnswered, maxAnswered);
      console.log(`📝 DEV: ACTIVE session - calculation: totalQuestions=${totalQuestions}, targetPercentage=${targetPercentage}, calculatedAnswered=${calculatedAnswered}, maxAnswered=${maxAnswered}, final questionsAnswered=${questionsAnswered}`);
    }
    // Use a higher score range for better test data (80-95%)
    const mockScore = Math.floor(Math.random() * 15) + 80; // 80-95%
    const correctAnswers = Math.floor(questionsAnswered * (mockScore / 100));
    
    console.log(`📝 DEV: ${sectionName} - mockScore: ${mockScore}%, questionsAnswered: ${questionsAnswered}, correctAnswers: ${correctAnswers}`);
    
    // Create realistic answer data with actual question responses
    const answersData: Record<string, string> = {};
    const flaggedQuestions: number[] = [];
    
    for (let qIndex = 0; qIndex < questionsAnswered; qIndex++) {
      const question = questions[qIndex];
      const isCorrect = qIndex < correctAnswers;
      
      let selectedAnswerIndex: number;
      if (isCorrect) {
        selectedAnswerIndex = question.correctAnswer; // Use the correct answer index
      } else {
        // Pick a random incorrect answer
        const availableOptions = question.options.length;
        const incorrectOptions = [];
        for (let i = 0; i < availableOptions; i++) {
          if (i !== question.correctAnswer) {
            incorrectOptions.push(i);
          }
        }
        selectedAnswerIndex = incorrectOptions[Math.floor(Math.random() * incorrectOptions.length)];
      }
      
      // Store the full option text (same format as what TestTaking expects)
      if (question.options && question.options[selectedAnswerIndex]) {
        answersData[qIndex.toString()] = question.options[selectedAnswerIndex];
        console.log(`📝 DEV: Question ${qIndex}: selected "${question.options[selectedAnswerIndex]}" (index ${selectedAnswerIndex})`);
      }
      
      // Random flagging (5% chance)
      if (Math.random() < 0.05) {
        flaggedQuestions.push(qIndex);
      }
    }
    
    console.log(`📝 DEV: Created ${Object.keys(answersData).length} realistic answers for ${sectionName}`);
    
    const sessionData = {
      user_id: user.id,
      product_type: dbProductType,
      test_mode: mode, // Use the original mode parameter for database storage
      section_name: sectionName,
      status: status,
      current_question_index: questionsAnswered,
      total_questions: totalQuestions,
      questions_answered: questionsAnswered,
      correct_answers: status === 'completed' ? correctAnswers : null, // Add the actual correct answers count
      final_score: status === 'completed' ? mockScore : null,
      completed_at: status === 'completed' ? new Date().toISOString() : null,
      answers_data: answersData,
      flagged_questions: flaggedQuestions,
      time_remaining_seconds: status === 'active' ? Math.floor(1800 * 0.4) : 0
    };

    const { data: sessionResult, error } = await supabase
      .from('user_test_sessions')
      .insert(sessionData)
      .select('id')
      .single();

    if (error) {
      console.error(`❌ DEV: Error creating session for ${sectionName}:`, error);
      throw error;
    }

    console.log(`✅ DEV: Created ${status} session for ${sectionName} with ${questionsAnswered} answered questions`);
    
    // Create individual question attempt records with realistic data
    for (let qIndex = 0; qIndex < questionsAnswered; qIndex++) {
      const question = questions[qIndex];
      const userAnswerText = answersData[qIndex.toString()];
      
      // Convert answer text back to letter format for attempt history
      let userAnswerLetter = '';
      let optionIndex = -1;
      if (userAnswerText && question.options) {
        optionIndex = question.options.findIndex(opt => opt === userAnswerText);
        if (optionIndex !== -1) {
          userAnswerLetter = String.fromCharCode(65 + optionIndex); // 0=A, 1=B, 2=C, 3=D
        }
      }
      
      const isCorrect = optionIndex === question.correctAnswer;
      
      const attemptData = {
        user_id: user.id,
        question_id: question.id,
        session_id: sessionResult.id,
        session_type: mode,
        user_answer: userAnswerLetter,
        is_correct: isCorrect,
        is_flagged: flaggedQuestions.includes(qIndex),
        is_skipped: false,
        time_spent_seconds: Math.floor(Math.random() * 180) + 60 // 60-240 seconds
      };

      const { error: attemptError } = await supabase
        .from('question_attempt_history')
        .insert(attemptData);

      if (attemptError) {
        console.warn(`Warning creating attempt for question ${question.id}:`, attemptError);
      }
    }
    
    console.log(`✅ DEV: Created ${questionsAnswered} question attempts for ${sectionName}`);
    
    } catch (error) {
      console.error(`❌ DEV: Error in createBasicSession:`, error);
      throw error;
    }
  };

  const createBasicDrillSession = async (dbProductType: string, subSkillId: string, difficulty: number, status: string) => {
    console.log(`🔧 DEV: Creating ${status} drill session for sub-skill "${subSkillId}", difficulty ${difficulty} with real answers...`);
    console.log(`🔧 DEV: subSkillId type:`, typeof subSkillId, 'length:', subSkillId?.length);
    
    // Safety check and clean up sub_skill_id
    if (!subSkillId || typeof subSkillId !== 'string') {
      console.error(`🔧 DEV: Invalid subSkillId:`, subSkillId);
      return;
    }
    
    // Clean up any problematic Unicode characters or escape sequences
    const cleanSubSkillId = subSkillId.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim();
    if (cleanSubSkillId !== subSkillId) {
      console.log(`🔧 DEV: Cleaned subSkillId from "${subSkillId}" to "${cleanSubSkillId}"`);
    }
    
    console.log(`🔧 DEV: Using clean subSkillId: "${cleanSubSkillId}"`);
    
    try {
      // Get real questions using direct Supabase query (since drills work with sub_skill_id)
      const { data: rawQuestions, error: questionsError } = await supabase
        .from('questions')
        .select('id, question_text, answer_options, correct_answer, solution')
        .eq('product_type', dbProductType)
        .eq('sub_skill_id', cleanSubSkillId)
        .eq('difficulty', difficulty)
        .eq('test_mode', 'drill')
        .limit(10);

      if (questionsError || !rawQuestions || rawQuestions.length === 0) {
        console.warn(`No real drill questions found for sub-skill "${cleanSubSkillId}", difficulty ${difficulty}`);
        return;
      }


      // Helper function to parse and clean answer options
      const parseAnswerOptions = (answerOptions: any): string[] => {
        console.log('🔧 DEV: Raw answer_options:', answerOptions, 'type:', typeof answerOptions);
        
        if (!answerOptions) return [];
        
        let options: string[] = [];
        
        if (Array.isArray(answerOptions)) {
          options = answerOptions.map(opt => cleanText(opt)).filter(Boolean);
        } else if (typeof answerOptions === 'object') {
          // Handle object format like { "A": "option1", "B": "option2", ... }
          const keys = Object.keys(answerOptions).sort();
          options = keys.map(key => cleanText(answerOptions[key])).filter(Boolean);
        } else if (typeof answerOptions === 'string') {
          try {
            const parsed = JSON.parse(answerOptions);
            if (Array.isArray(parsed)) {
              options = parsed.map(opt => cleanText(opt)).filter(Boolean);
            } else if (typeof parsed === 'object') {
              const keys = Object.keys(parsed).sort();
              options = keys.map(key => cleanText(parsed[key])).filter(Boolean);
            }
          } catch (e) {
            console.warn('Failed to parse answer_options as JSON:', answerOptions);
            options = [cleanText(answerOptions)].filter(Boolean);
          }
        }
        
        console.log('🔧 DEV: Parsed options:', options);
        return options;
      };

      // Convert to the same format as fetchQuestionsFromSupabase
      const questions = rawQuestions.map((q: any) => {
        const options = parseAnswerOptions(q.answer_options);
        const cleanCorrectAnswer = cleanText(q.correct_answer);
        
        return {
          id: q.id,
          text: cleanText(q.question_text),
          options: options,
          correctAnswer: cleanCorrectAnswer && cleanCorrectAnswer.length === 1 ? 
            cleanCorrectAnswer.charCodeAt(0) - 65 : 0, // Convert A,B,C,D to 0,1,2,3
          explanation: cleanText(q.solution) || 'No explanation provided'
        };
      });

      // Filter out questions with no valid options
      const validQuestions = questions.filter(q => q.options && q.options.length > 0);
      console.log(`🔧 DEV: Found ${validQuestions.length} valid drill questions (${questions.length - validQuestions.length} filtered out) for sub-skill "${cleanSubSkillId}"`);
    
      if (validQuestions.length === 0) {
        console.warn(`No valid drill questions found for sub-skill "${cleanSubSkillId}", difficulty ${difficulty}`);
        return;
      }

      const totalQuestions = validQuestions.length;
      // Ensure active sessions are truly incomplete and completed sessions are truly complete
      let questionsAnswered: number;
      if (status === 'completed') {
        questionsAnswered = totalQuestions; // All questions answered for completed sessions
        console.log(`🔧 DEV: COMPLETED session - answering ALL ${questionsAnswered} questions`);
      } else {
        // For active sessions, ensure we never answer all questions (leave at least 1 unanswered)
        // Handle inconsistent database question counts by ensuring we always have incomplete sessions
        const targetPercentage = 0.6; // Answer 60% of questions
        const maxAnswered = Math.max(1, totalQuestions - 1); // Always leave at least 1 question unanswered
        let calculatedAnswered = Math.floor(totalQuestions * targetPercentage);
        
        // Additional safety: if calculated would be all questions, reduce by 1-2 questions
        if (calculatedAnswered >= totalQuestions) {
          calculatedAnswered = Math.max(1, totalQuestions - 2);
        }
        
        questionsAnswered = Math.min(calculatedAnswered, maxAnswered);
        console.log(`🔧 DEV: ACTIVE session - calculation: totalQuestions=${totalQuestions}, targetPercentage=${targetPercentage}, calculatedAnswered=${calculatedAnswered}, maxAnswered=${maxAnswered}, final questionsAnswered=${questionsAnswered}`);
      }
      const mockScore = Math.floor(Math.random() * 30) + 70; // 70-100%
      const correctAnswers = Math.floor(questionsAnswered * (mockScore / 100));
      
      // Create realistic answer data with actual question responses
      const answersData: Record<string, string> = {};
      const questionIds = validQuestions.map(q => q.id);
      
      for (let qIndex = 0; qIndex < questionsAnswered; qIndex++) {
        const question = validQuestions[qIndex];
        
        // Validate question has options
        if (!question.options || question.options.length === 0) {
          console.warn(`Question ${question.id} has no valid options, skipping`);
          continue;
        }
        
        const isCorrect = qIndex < correctAnswers;
        
        let selectedAnswerIndex: number;
        if (isCorrect && question.correctAnswer < question.options.length) {
          selectedAnswerIndex = question.correctAnswer; // Use the correct answer index
        } else {
          // Pick a random incorrect answer (or random if correct answer is invalid)
          const availableOptions = question.options.length;
          const incorrectOptions = [];
          for (let i = 0; i < availableOptions; i++) {
            if (i !== question.correctAnswer) {
              incorrectOptions.push(i);
            }
          }
          selectedAnswerIndex = incorrectOptions.length > 0 ? 
            incorrectOptions[Math.floor(Math.random() * incorrectOptions.length)] :
            Math.floor(Math.random() * availableOptions);
        }
        
        // Validate selectedAnswerIndex
        if (selectedAnswerIndex >= question.options.length || selectedAnswerIndex < 0) {
          selectedAnswerIndex = 0; // Default to first option
        }
        
        // Convert answer index back to letter format for drill sessions (they expect letters)
        const selectedAnswerLetter = String.fromCharCode(65 + selectedAnswerIndex); // 0=A, 1=B, 2=C, 3=D
        answersData[question.id] = selectedAnswerLetter;
        
        console.log(`🔧 DEV: Drill Question ${qIndex}: selected index ${selectedAnswerIndex} (${selectedAnswerLetter}) for "${question.options[selectedAnswerIndex] || 'N/A'}"`);
      }
    
    console.log(`🔧 DEV: Created ${Object.keys(answersData).length} realistic drill answers`);

    // Clean all string data that goes to the database
    const cleanAnswersData: Record<string, string> = {};
    Object.entries(answersData).forEach(([key, value]) => {
      cleanAnswersData[cleanText(key)] = cleanText(value);
    });

    const drillData = {
      user_id: user.id,
      sub_skill_id: cleanSubSkillId,
      product_type: cleanText(dbProductType),
      difficulty: difficulty,
      status: cleanText(status),
      questions_total: totalQuestions,
      questions_answered: questionsAnswered,
      questions_correct: correctAnswers,
      question_ids: questionIds, // Array of UUIDs should be safe
      answers_data: cleanAnswersData,
      completed_at: status === 'completed' ? new Date().toISOString() : null
    };

    console.log('🔧 DEV: Final drill data (cleaned):', {
      sub_skill_id: drillData.sub_skill_id,
      product_type: drillData.product_type,
      status: drillData.status,
      questions_total: drillData.questions_total,
      questions_answered: drillData.questions_answered,
      answers_data_keys: Object.keys(drillData.answers_data).length,
      question_ids_count: drillData.question_ids.length,
      is_truly_incomplete: drillData.questions_answered < drillData.questions_total
    });

    const { data: sessionResult, error } = await supabase
      .from('drill_sessions')
      .insert(drillData)
      .select('id')
      .single();

    if (error) {
      console.error(`❌ DEV: Error creating drill session for "${cleanSubSkillId}"-${difficulty}:`, error);
      throw error;
    }

    console.log(`✅ DEV: Created ${status} drill session for sub-skill "${cleanSubSkillId}", difficulty ${difficulty}`);
    
      // Create individual question attempt records with realistic data
      for (let qIndex = 0; qIndex < questionsAnswered; qIndex++) {
        const question = questions[qIndex];
        const userAnswerLetter = answersData[question.id]; // This is already in letter format (A, B, C, D)
        
        // Convert letter back to index to check correctness
        const userAnswerIndex = userAnswerLetter.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
        const isCorrect = userAnswerIndex === question.correctAnswer;
        
        const attemptData = {
          user_id: user.id,
          question_id: question.id,
          session_id: sessionResult.id,
          session_type: 'drill',
          user_answer: userAnswerLetter,
          is_correct: isCorrect,
          is_flagged: Math.random() < 0.08, // 8% chance of flagging
          is_skipped: false,
          time_spent_seconds: Math.floor(Math.random() * 120) + 30 // 30-150 seconds
        };

        const { error: attemptError } = await supabase
          .from('question_attempt_history')
          .insert(attemptData);

        if (attemptError) {
          console.warn(`Warning creating drill attempt for question ${question.id}:`, attemptError);
        }
      }
      
      console.log(`✅ DEV: Created ${questionsAnswered} drill question attempts for sub-skill "${cleanSubSkillId}"`);
      
    } catch (error) {
      console.error(`❌ DEV: Error in createBasicDrillSession:`, error);
      throw error;
    }
  };

  const handleClearAll = async () => {
    if (!user?.id) {
      alert('User not found. Please refresh and try again.');
      return;
    }

    const dbProductType = getDbProductType(selectedProduct);
    console.log(`🚨 DEV: Clear All clicked - testType: ${testType}, selectedProduct: ${selectedProduct}, dbProductType: ${dbProductType}, userId: ${user.id}`);
    
    if (confirm(`🚨 DEV: Clear all ${testType} progress? This will delete all sessions and progress data.`)) {
      try {
        await clearAllData(dbProductType);
        
        console.log(`✅ DEV: Cleared all ${testType} data successfully`);
        
        // Notify parent component and refresh
        if (onDataChanged) onDataChanged();
        setTimeout(() => window.location.reload(), 500);
      } catch (error) {
        console.error(`❌ DEV: Failed to clear ${testType} progress:`, error);
        alert(`Failed to clear ${testType} progress: ${error.message}. Check console for details.`);
      }
    }
  };

  const handleHalfComplete = async () => {
    if (!user?.id) {
      alert('User not found. Please refresh and try again.');
      return;
    }

    const dbProductType = getDbProductType(selectedProduct);
    console.log(`🎯 DEV: Half Complete clicked - testType: ${testType}, selectedProduct: ${selectedProduct}, dbProductType: ${dbProductType}`);
    
    if (confirm(`🚨 DEV: Set ${testType} to half-complete state with mixed progress?`)) {
      try {
        console.log(`🎯 DEV: Starting half complete for ${testType} - ${dbProductType}`);
        
        // First clear existing data
        await clearAllData(dbProductType);
        
        // Wait for clear to complete
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log(`🎯 DEV: Creating half-complete data for ${testType}...`);
        await createSimpleHalfCompleteData(dbProductType);
        
        console.log(`✅ DEV: Set ${testType} to half-complete state successfully`);
        
        if (onDataChanged) {
          console.log(`🔄 DEV: Calling onDataChanged callback`);
          onDataChanged();
        }
        
        console.log(`🔄 DEV: Scheduling page reload in 500ms`);
        setTimeout(() => {
          console.log(`🔄 DEV: Reloading page now!`);
          window.location.reload();
        }, 500);
      } catch (error) {
        console.error(`❌ DEV: Failed to set ${testType} half-complete:`, error);
        alert(`Failed to set ${testType} half-complete: ${error.message}. Check console for details.`);
      }
    }
  };

  const handleFinishAll = async () => {
    if (!user?.id) {
      alert('User not found. Please refresh and try again.');
      return;
    }

    const dbProductType = getDbProductType(selectedProduct);
    console.log(`🏁 DEV: Finish All clicked - testType: ${testType}, selectedProduct: ${selectedProduct}, dbProductType: ${dbProductType}`);
    
    if (confirm(`🚨 DEV: Complete all ${testType} exercises with real data?`)) {
      try {
        console.log(`🏁 DEV: Starting finish all for ${testType} - ${dbProductType}`);
        
        // First clear existing data
        await clearAllData(dbProductType);
        
        // Wait for clear to complete
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log(`🏁 DEV: Creating finish-all data for ${testType}...`);
        await createSimpleFinishAllData(dbProductType);
        
        console.log(`✅ DEV: Completed all ${testType} exercises successfully`);
        
        if (onDataChanged) {
          console.log(`🔄 DEV: Calling onDataChanged callback`);
          onDataChanged();
        }
        
        console.log(`🔄 DEV: Scheduling page reload in 500ms`);
        setTimeout(() => {
          console.log(`🔄 DEV: Reloading page now!`);
          window.location.reload();
        }, 500);
      } catch (error) {
        console.error(`❌ DEV: Failed to complete all ${testType}:`, error);
        alert(`Failed to complete all ${testType}: ${error.message}. Check console for details.`);
      }
    }
  };

  return (
    <Card className="border-2 border-red-200 bg-red-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-red-800 flex items-center space-x-2">
          <Zap size={16} />
          <span>Development Tools - {testType.charAt(0).toUpperCase() + testType.slice(1)}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-3">
          <Button
            size="sm"
            variant="outline"
            onClick={handleClearAll}
            className="border-red-300 text-red-700 hover:bg-red-100"
          >
            <Trash2 size={14} className="mr-1" />
            Clear All
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleHalfComplete}
            className="border-amber-300 text-amber-700 hover:bg-amber-100"
          >
            <Target size={14} className="mr-1" />
            Half Complete
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleFinishAll}
            className="border-green-300 text-green-700 hover:bg-green-100"
          >
            <CheckCircle size={14} className="mr-1" />
            Finish All
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};