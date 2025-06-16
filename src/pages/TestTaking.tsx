import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, CheckCircle, ArrowLeft, ArrowRight, 
  Flag, RotateCcw, Target, BookOpen, Brain, AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProduct } from '@/context/ProductContext';
import { EnhancedTestInterface } from '@/components/EnhancedTestInterface';
import { 
  fetchQuestionsForTest, 
  fetchDiagnosticModes,
  fetchQuestionsFromSupabase,
  fetchDrillModes,
  type OrganizedQuestion 
} from '@/services/supabaseQuestionService';
import { TEST_STRUCTURES } from '@/data/curriculumData';
import { TestSessionService, TestSessionConfig, QuestionResponseData } from '../services/testSessionService';
import { useAuth } from '../context/AuthContext';
import { useOfflineQuestionResponses } from '../hooks/useOfflineQuestionResponses';
import { SessionPersistenceService, type PersistedTestSession } from '@/services/sessionPersistenceService';

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  topic: string;
  subSkill: string;
  difficulty: number;
  userAnswer?: number;
  flagged?: boolean;
  passageContent?: string;
}

interface TestSession {
  id: string;
  type: 'diagnostic' | 'practice' | 'drill';
  subjectId: string;
  subjectName: string;
  sectionId?: string;
  sectionName?: string;
  skillId?: string;
  skillName?: string;
  questions: Question[];
  timeLimit: number; // in minutes
  currentQuestion: number;
  answers: Record<number, number>;
  flaggedQuestions: Set<number>;
  startTime: Date;
  pausedTime?: number; // Time remaining when paused (in seconds)
  status: 'in-progress' | 'completed' | 'review' | 'paused';
  metadata?: {
    productType?: string;
    [key: string]: unknown;
  };
  isResumed?: boolean;
}

// Test type mapping for Supabase
const TEST_TYPE_MAPPING: Record<string, string> = {
  'year-5-naplan': 'Year 5 NAPLAN',
  'year-7-naplan': 'Year 7 NAPLAN', 
  'acer-scholarship': 'ACER Scholarship (Year 7 Entry)',
  'edutest-scholarship': 'EduTest Scholarship (Year 7 Entry)',
  'vic-selective': 'VIC Selective Entry (Year 9 Entry)',
  'nsw-selective': 'NSW Selective Entry (Year 7 Entry)',
};

// Function to get time limit from curriculum data
const getTimeLimit = (testTypeName: string, sectionName: string): number => {
  const testStructure = TEST_STRUCTURES[testTypeName as keyof typeof TEST_STRUCTURES];
  if (!testStructure) {
    console.warn('No test structure found for:', testTypeName);
    return 30; // Default 30 minutes
  }

  // Try to find exact match first
  const exactMatch = testStructure[sectionName as keyof typeof testStructure] as { time?: number } | undefined;
  if (exactMatch && typeof exactMatch === 'object' && exactMatch.time) {
    return exactMatch.time;
  }

  // Try to find partial match (case-insensitive)
  const sectionKeys = Object.keys(testStructure);
  const partialMatch = sectionKeys.find(key => 
    key.toLowerCase().includes(sectionName.toLowerCase()) ||
    sectionName.toLowerCase().includes(key.toLowerCase())
  );

  if (partialMatch) {
    const matchedSection = testStructure[partialMatch as keyof typeof testStructure] as { time?: number } | undefined;
    if (matchedSection && typeof matchedSection === 'object' && matchedSection.time) {
      return matchedSection.time;
    }
  }

  console.warn('No time limit found for section:', sectionName, 'in test:', testTypeName);
  return 30; // Default 30 minutes
};

// Function to randomize questions with special handling for reading comprehension
const randomizeQuestions = (questions: Question[], sectionName: string): Question[] => {
  // Check if this is a reading comprehension section
  const isReadingSection = sectionName.toLowerCase().includes('reading') || 
                          sectionName.toLowerCase().includes('comprehension');
  
  if (!isReadingSection) {
    // For non-reading sections, simple randomization
    const shuffled = [...questions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
  
  // For reading sections, group questions by passage and randomize groups
  const passageGroups = new Map<string, Question[]>();
  const questionsWithoutPassage: Question[] = [];
  
  // Group questions by passage content
  questions.forEach(question => {
    if (question.passageContent && question.passageContent.trim()) {
      const passageKey = question.passageContent.substring(0, 100); // Use first 100 chars as key
      if (!passageGroups.has(passageKey)) {
        passageGroups.set(passageKey, []);
      }
      passageGroups.get(passageKey)!.push(question);
    } else {
      questionsWithoutPassage.push(question);
    }
  });
  
  // Convert groups to array and randomize the order of groups
  const groupsArray = Array.from(passageGroups.values());
  for (let i = groupsArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [groupsArray[i], groupsArray[j]] = [groupsArray[j], groupsArray[i]];
  }
  
  // Randomize questions without passages
  const shuffledWithoutPassage = [...questionsWithoutPassage];
  for (let i = shuffledWithoutPassage.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledWithoutPassage[i], shuffledWithoutPassage[j]] = [shuffledWithoutPassage[j], shuffledWithoutPassage[i]];
  }
  
  // Combine: randomized groups + randomized individual questions
  const result = [...groupsArray.flat(), ...shuffledWithoutPassage];
  
  console.log('🎲 Question randomization for', sectionName, ':', {
    isReadingSection,
    originalCount: questions.length,
    passageGroups: passageGroups.size,
    questionsWithoutPassage: questionsWithoutPassage.length,
    finalCount: result.length
  });
  
  return result;
};

const TestTaking: React.FC = () => {
  const { testType, subjectId, sectionId, sessionId } = useParams<{ 
    testType: string; 
    subjectId: string; 
    sectionId?: string;
    sessionId?: string;
  }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { selectedProduct } = useProduct();
  const [session, setSession] = useState<TestSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const { user } = useAuth();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [recordingEnabled, setRecordingEnabled] = useState<boolean>(false);
  const [progressSaved, setProgressSaved] = useState<boolean>(false);
  const [autoSaveInterval, setAutoSaveInterval] = useState<number | null>(null);
  const [exitHandlers, setExitHandlers] = useState<(() => void) | null>(null);
  
  // Offline responses management
  const {
    isOnline,
    isSyncing,
    offlineResponseCount,
    recordQuestionResponse: recordOfflineQuestionResponse
  } = useOfflineQuestionResponses({
    userId: user?.id || '',
    productType: session?.metadata?.productType || 'default',
    onSyncComplete: (syncedCount) => {
      console.log(`✅ Synced ${syncedCount} offline responses`);
      setProgressSaved(true);
      setTimeout(() => setProgressSaved(false), 3000);
    },
    onSyncError: (error) => {
      console.error('Failed to sync offline responses:', error);
    }
  });

  // Enhanced function to save session progress with auto-save
  const saveSessionProgress = async (currentSession: TestSession) => {
    if (!user || !currentSession.id) {
      console.warn('Cannot save session: missing user or session ID');
      return;
    }

    try {
      // Convert answers to string format for persistence
      const stringAnswers: Record<number, string> = {};
      Object.entries(currentSession.answers).forEach(([questionIndex, answerIndex]) => {
        const question = currentSession.questions[parseInt(questionIndex)];
        if (question && question.options[answerIndex]) {
          stringAnswers[parseInt(questionIndex)] = question.options[answerIndex];
        }
      });

      // Extract question IDs in order
      const questionIds = currentSession.questions.map(q => q.id);

      const persistedSession: PersistedTestSession = {
        id: currentSession.id,
        userId: user.id,
        productType: currentSession.metadata?.productType || selectedProduct,
        testType: currentSession.type,
        sectionName: currentSession.sectionName || 'Unknown',
        currentQuestionIndex: currentSession.currentQuestion,
        answers: stringAnswers,
        flaggedQuestions: Array.from(currentSession.flaggedQuestions),
        timeRemaining: timeRemaining,
        totalQuestions: currentSession.questions.length,
        startedAt: currentSession.startTime.toISOString(),
        lastUpdatedAt: new Date().toISOString(),
        status: currentSession.status === 'review' ? 'completed' : currentSession.status,
        sessionData: {
          questionIds: questionIds, // Store question IDs for proper restoration
          questions: currentSession.questions.map(q => q.id), // Backward compatibility
          metadata: currentSession.metadata
        }
      };

      // Use enhanced auto-save that persists to both tables
      await SessionPersistenceService.saveSession(persistedSession);
      console.log('💾 Enhanced session progress saved successfully:', {
        sessionId: currentSession.id,
        currentQuestion: currentSession.currentQuestion,
        answersCount: Object.keys(stringAnswers).length,
        status: currentSession.status,
        questionIdsCount: questionIds.length,
        sectionName: currentSession.sectionName
      });
      
      setProgressSaved(true);
      setTimeout(() => setProgressSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save session progress:', error);
      // Don't throw error to avoid disrupting user experience
    }
  };

  // Setup auto-save when session starts
  const setupAutoSave = (currentSession: TestSession) => {
    if (!currentSession || !user) return;

    const saveCallback = async () => {
      await saveSessionProgress(currentSession);
    };

    // Setup auto-save with window exit handlers
    const { intervalId, cleanupHandlers } = SessionPersistenceService.setupAutoSave(
      {
        id: currentSession.id,
        userId: user.id,
        productType: currentSession.metadata?.productType || selectedProduct,
        testType: currentSession.type,
        sectionName: currentSession.sectionName || 'Unknown',
        currentQuestionIndex: currentSession.currentQuestion,
        answers: {},
        flaggedQuestions: [],
        timeRemaining: timeRemaining,
        totalQuestions: currentSession.questions.length,
        startedAt: currentSession.startTime.toISOString(),
        lastUpdatedAt: new Date().toISOString(),
        status: 'in-progress'
      },
      saveCallback
    );

    setAutoSaveInterval(intervalId);
    setExitHandlers(() => cleanupHandlers);
    
    console.log('📱 Auto-save setup completed for session:', currentSession.id);
  };

  // Cleanup auto-save on component unmount or session change
  const cleanupAutoSave = () => {
    if (autoSaveInterval && exitHandlers) {
      SessionPersistenceService.stopAutoSave(autoSaveInterval, exitHandlers);
      setAutoSaveInterval(null);
      setExitHandlers(null);
      console.log('🧹 Auto-save cleanup completed');
    }
  };

  // Function to load existing session
  const loadExistingSession = async (sessionId: string): Promise<TestSession | null> => {
    if (!user) return null;

    try {
      const persistedSession = await SessionPersistenceService.loadSession(sessionId);
      if (!persistedSession) return null;

      // Load questions for this session - need to define loadQuestions in this scope
      const loadQuestionsForSession = async () => {
        if (!subjectId || !testType) {
          setError('Missing test parameters');
          setLoading(false);
          return null;
        }

        try {
          setLoading(true);
          
          // Get test parameters from URL
          const sectionName = searchParams.get('sectionName') || '';
          const skillId = searchParams.get('skill') || '';
          
          console.log('🔧 Loading questions for resumed session:', {
            testType,
            subjectId,
            sectionId,
            sectionName,
            selectedProduct,
            sessionId: persistedSession.id
          });

          // Map frontend product to database test type
          const dbTestType = TEST_TYPE_MAPPING[selectedProduct];
          if (!dbTestType) {
            console.error('No database test type found for product:', selectedProduct);
            setError(`Unsupported test type: ${selectedProduct}`);
            setLoading(false);
            return null;
          }

          console.log('🔧 Mapped to database test type:', dbTestType);

          let questions: OrganizedQuestion[] = [];

          if (testType === 'diagnostic') {
            // For diagnostic tests, load questions by section
            console.log('🔧 Loading diagnostic questions...');
            const diagnosticModes = await fetchDiagnosticModes(selectedProduct);
            
            // Find the section containing questions
            let foundSection = null;
            for (const mode of diagnosticModes) {
              foundSection = mode.sections.find(section => 
                section.id === subjectId || 
                section.name.toLowerCase().includes(subjectId.toLowerCase())
              );
              if (foundSection) break;
            }

            if (foundSection && foundSection.questions.length > 0) {
              questions = foundSection.questions;
              console.log('🔧 Found diagnostic questions:', questions.length);
            }
          } else if (testType === 'practice') {
            // For practice tests, load questions by test mode and section
            console.log('🔧 Loading practice questions...');
            
            // Try to find the right practice mode (practice_1, practice_2, etc.)
            const organizedData = await fetchQuestionsFromSupabase();
            const currentTestType = organizedData.testTypes.find(tt => tt.id === selectedProduct);
            
            if (currentTestType) {
              // Find the section by ID across all practice modes
              let foundSection = null;
              for (const testMode of currentTestType.testModes) {
                foundSection = testMode.sections.find(section => 
                  section.id === subjectId || 
                  section.name.toLowerCase().includes(subjectId.toLowerCase())
                );
                if (foundSection && foundSection.questions.length > 0) {
                  questions = foundSection.questions;
                  console.log('🔧 Found practice questions from mode:', testMode.name, '- Count:', questions.length);
                  break;
                }
              }
            }
          } else if (testType === 'drill') {
            // For drill tests, load questions by sub-skill and filter by difficulty
            console.log('🔧 Loading drill questions...');
            
            const difficulty = searchParams.get('difficulty') || 'easy';
            const skillArea = searchParams.get('skillArea') || '';
            const skillName = searchParams.get('skill') || '';
            
            console.log('🔧 Drill parameters:', { difficulty, skillArea, skillName, subjectId });
            
            // Load drill modes and find the sub-skill questions
            const drillModes = await fetchDrillModes(selectedProduct);
            console.log('🔧 Available drill modes:', drillModes.length);
            
            // Find the skill area and sub-skill
            let foundQuestions: OrganizedQuestion[] = [];
            for (const mode of drillModes) {
              if (mode.name.toLowerCase().includes(skillArea.toLowerCase()) || 
                  skillArea.toLowerCase().includes(mode.name.toLowerCase())) {
                for (const section of mode.sections) {
                  if (section.id === subjectId || 
                      section.name.toLowerCase().includes(skillName.toLowerCase()) ||
                      skillName.toLowerCase().includes(section.name.toLowerCase())) {
                    foundQuestions = section.questions;
                    console.log('🔧 Found drill section:', section.name, 'with', foundQuestions.length, 'questions');
                    break;
                  }
                }
                if (foundQuestions.length > 0) break;
              }
            }
            
            // Filter by difficulty if specified
            if (foundQuestions.length > 0 && difficulty !== 'all') {
              const difficultyMap = { 'easy': 1, 'medium': 2, 'hard': 3 };
              const targetDifficulty = difficultyMap[difficulty as keyof typeof difficultyMap];
              if (targetDifficulty) {
                foundQuestions = foundQuestions.filter(q => q.difficulty === targetDifficulty);
                console.log('🔧 Filtered to', difficulty, 'difficulty:', foundQuestions.length, 'questions');
              }
            }
            
            questions = foundQuestions;
          }

          if (questions.length === 0) {
            setError('No questions found for this test section');
            setLoading(false);
            return null;
          }

          // Convert questions but DO NOT randomize for resumed sessions
          const convertedQuestions: Question[] = questions.map((q, index) => ({
            id: q.id || `question-${index}`,
            text: q.text,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            topic: q.topic || 'General',
            subSkill: q.subSkill || 'General',
            difficulty: q.difficulty || 2,
            passageContent: q.passageContent || ''
          }));

          // DO NOT randomize questions for resumed sessions - this breaks answer mapping
          console.log('🔧 Skipping randomization for resumed session to preserve answer mapping');
          
          // Set up the timing
          const timeLimitMinutes = getTimeLimit(selectedProduct, sectionName);
          
          return { questions: convertedQuestions, timeLimit: timeLimitMinutes };
        } catch (err) {
          console.error('Error loading questions:', err);
          setError('Failed to load questions');
          setLoading(false);
          return null;
        }
      };

      const questionsResponse = await loadQuestionsForSession();
      if (!questionsResponse) return null;

      // For resumed sessions, restore the original question order using stored question IDs
      let finalQuestions = questionsResponse.questions;
      
      // If we have stored question IDs, restore the exact order
      if (persistedSession.sessionData?.questionIds && Array.isArray(persistedSession.sessionData.questionIds)) {
        const savedQuestionIds = persistedSession.sessionData.questionIds;
        const reorderedQuestions: Question[] = [];
        
        console.log('🔄 Restoring question order from stored IDs:', {
          savedIdsCount: savedQuestionIds.length,
          loadedQuestionsCount: questionsResponse.questions.length
        });
        
        // Try to match questions by ID to restore original order
        for (const savedId of savedQuestionIds) {
          const matchingQuestion = questionsResponse.questions.find(q => q.id === savedId);
          if (matchingQuestion) {
            reorderedQuestions.push(matchingQuestion);
          } else {
            console.warn(`⚠️ Could not find question with ID: ${savedId}`);
          }
        }
        
        // If we successfully matched all questions, use the reordered list
        if (reorderedQuestions.length === savedQuestionIds.length && reorderedQuestions.length > 0) {
          finalQuestions = reorderedQuestions;
          console.log('✅ Successfully restored original question order');
        } else {
          console.warn('⚠️ Could not restore complete question order, using current order');
          console.log('Matched:', reorderedQuestions.length, 'Expected:', savedQuestionIds.length);
        }
      } else {
        console.log('ℹ️ No stored question IDs found, using current question order');
      }

      // Convert answers back to number format
      const numberAnswers: Record<number, number> = {};
      console.log('🔄 Restoring answers from persisted session:', {
        persistedAnswers: persistedSession.answers,
        questionsCount: finalQuestions.length
      });
      
      Object.entries(persistedSession.answers).forEach(([questionIndex, answerValue]) => {
        const qIndex = parseInt(questionIndex);
        const question = finalQuestions[qIndex];
        if (question) {
          const answerIndex = question.options.findIndex(option => option === answerValue);
          if (answerIndex !== -1) {
            numberAnswers[qIndex] = answerIndex;
            console.log(`✅ Restored answer for Q${qIndex + 1}: "${answerValue}" (index ${answerIndex})`);
          } else {
            console.warn(`⚠️ Could not find answer "${answerValue}" in options for Q${qIndex + 1}:`, question.options);
          }
        } else {
          console.warn(`⚠️ No question found at index ${qIndex}`);
        }
      });

      console.log('🔄 Final restored answers:', numberAnswers);

      // Restore session state
      const loadedSession: TestSession = {
        id: persistedSession.id,
        type: persistedSession.testType,
        subjectId: subjectId || 'default',
        subjectName: searchParams.get('subjectName') || 'Test',
        sectionId: sectionId,
        sectionName: persistedSession.sectionName,
        questions: finalQuestions,
        timeLimit: Math.ceil(persistedSession.timeRemaining / 60), // Convert seconds to minutes for display
        currentQuestion: persistedSession.currentQuestionIndex,
        answers: numberAnswers,
        flaggedQuestions: new Set(persistedSession.flaggedQuestions),
        startTime: new Date(persistedSession.startedAt),
        status: 'in-progress',
        metadata: {
          productType: persistedSession.productType,
          ...persistedSession.sessionData?.metadata
        },
        isResumed: true
      };

      // Apply existing answers to questions
      console.log('🔄 Applying restored answers to questions...');
      loadedSession.questions.forEach((question, index) => {
        if (loadedSession.answers[index] !== undefined) {
          question.userAnswer = loadedSession.answers[index];
          console.log(`✅ Applied answer to Q${index + 1}: option ${loadedSession.answers[index]} (${question.options[loadedSession.answers[index]]})`);
        }
        question.flagged = loadedSession.flaggedQuestions.has(index);
        if (question.flagged) {
          console.log(`🚩 Question ${index + 1} is flagged`);
        }
      });

      // Set the time remaining from the persisted session (backend is source of truth)
      setTimeRemaining(persistedSession.timeRemaining);
      setBackendSynced(true); // Mark as synced since we just loaded from backend
      
      console.log('✅ Complete session state restored from backend:', {
        sessionId: persistedSession.id,
        currentQuestion: persistedSession.currentQuestionIndex,
        answersCount: Object.keys(numberAnswers).length,
        timeRemaining: persistedSession.timeRemaining,
        questionsCount: finalQuestions.length,
        flaggedQuestions: persistedSession.flaggedQuestions.length,
        sectionStates: persistedSession.sessionData?.sectionStates?.length || 0,
        backendSynced: true,
        restoredAnswers: Object.keys(numberAnswers).map(idx => `Q${parseInt(idx) + 1}: ${numberAnswers[parseInt(idx)]}`).join(', ')
      });
      
      return loadedSession;
    } catch (error) {
      console.error('Failed to load existing session:', error);
      return null;
    }
  };

  // Initialize test session
  useEffect(() => {
    const loadQuestions = async () => {
      if (!subjectId || !testType) {
        setError('Missing test parameters');
        setLoading(false);
        return null;
      }

      try {
        setLoading(true);
        
        // Get test parameters from URL
        const sectionName = searchParams.get('sectionName') || '';
        const skillId = searchParams.get('skill') || '';
        
        console.log('🔧 Loading questions for:', {
          testType,
          subjectId,
          sectionId,
          sectionName,
          selectedProduct
        });

        // Map frontend product to database test type
        const dbTestType = TEST_TYPE_MAPPING[selectedProduct];
        if (!dbTestType) {
          console.error('No database test type found for product:', selectedProduct);
          setError(`Unsupported test type: ${selectedProduct}`);
          setLoading(false);
          return null;
        }

        console.log('🔧 Mapped to database test type:', dbTestType);

        let questions: OrganizedQuestion[] = [];

        if (testType === 'diagnostic') {
          // For diagnostic tests, load questions by section
          console.log('🔧 Loading diagnostic questions...');
          const diagnosticModes = await fetchDiagnosticModes(selectedProduct);
          
          // Find the section containing questions
          let foundSection = null;
          for (const mode of diagnosticModes) {
            foundSection = mode.sections.find(section => 
              section.id === subjectId || 
              section.name.toLowerCase().includes(subjectId.toLowerCase())
            );
            if (foundSection) break;
          }

          if (foundSection && foundSection.questions.length > 0) {
            questions = foundSection.questions;
            console.log('🔧 Found diagnostic questions:', questions.length);
          }
        } else if (testType === 'practice') {
          // For practice tests, load questions by test mode and section
          console.log('🔧 Loading practice questions...');
          
          // Try to find the right practice mode (practice_1, practice_2, etc.)
          const organizedData = await fetchQuestionsFromSupabase();
          const currentTestType = organizedData.testTypes.find(tt => tt.id === selectedProduct);
          
          if (currentTestType) {
            // Find the section by ID across all practice modes
            let foundSection = null;
            for (const testMode of currentTestType.testModes) {
              foundSection = testMode.sections.find(section => 
                section.id === subjectId || 
                section.name.toLowerCase().includes(subjectId.toLowerCase())
              );
              if (foundSection && foundSection.questions.length > 0) {
                questions = foundSection.questions;
                console.log('🔧 Found practice questions from mode:', testMode.name, '- Count:', questions.length);
                break;
              }
            }
          }
        } else if (testType === 'drill') {
          // For drill tests, load questions by sub-skill and filter by difficulty
          console.log('🔧 Loading drill questions...');
          
          const difficulty = searchParams.get('difficulty') || 'easy';
          const skillArea = searchParams.get('skillArea') || '';
          const skillName = searchParams.get('skill') || '';
          
          console.log('🔧 Drill parameters:', { difficulty, skillArea, skillName, subjectId });
          
          // Load drill modes and find the sub-skill questions
          const drillModes = await fetchDrillModes(selectedProduct);
          console.log('🔧 Available drill modes:', drillModes.length);
          
          // Find the skill area and sub-skill
          let foundQuestions: OrganizedQuestion[] = [];
          for (const mode of drillModes) {
            if (mode.name.toLowerCase().includes(skillArea.toLowerCase()) || 
                skillArea.toLowerCase().includes(mode.name.toLowerCase())) {
              for (const section of mode.sections) {
                if (section.id === subjectId || 
                    section.name.toLowerCase().includes(skillName.toLowerCase()) ||
                    skillName.toLowerCase().includes(section.name.toLowerCase())) {
                  foundQuestions = section.questions;
                  console.log('🔧 Found drill section:', section.name, 'with', foundQuestions.length, 'questions');
                  break;
                }
              }
              if (foundQuestions.length > 0) break;
            }
          }
          
          // Filter by difficulty if specified
          if (foundQuestions.length > 0 && difficulty !== 'all') {
            const difficultyMap = { 'easy': 1, 'medium': 2, 'hard': 3 };
            const targetDifficulty = difficultyMap[difficulty as keyof typeof difficultyMap];
            if (targetDifficulty) {
              foundQuestions = foundQuestions.filter(q => q.difficulty === targetDifficulty);
              console.log('🔧 Filtered to', difficulty, 'difficulty:', foundQuestions.length, 'questions');
            }
          }
          
          questions = foundQuestions;
        }

        if (questions.length === 0) {
          setError('No questions found for this test section');
          setLoading(false);
          return null;
        }

        // Convert and randomize questions
        const convertedQuestions: Question[] = questions.map((q, index) => ({
          id: q.id || `question-${index}`,
          text: q.text,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          topic: q.topic || 'General',
          subSkill: q.subSkill || 'General',
          difficulty: q.difficulty || 2,
          passageContent: q.passageContent || ''
        }));

        const randomizedQuestions = randomizeQuestions(convertedQuestions, sectionName);
        
        // Set up the timing
        const timeLimitMinutes = getTimeLimit(selectedProduct, sectionName);
        
        return { questions: randomizedQuestions, timeLimit: timeLimitMinutes };
      } catch (err) {
        console.error('Error loading questions:', err);
        setError('Failed to load questions');
        setLoading(false);
        return null;
      }
    };

    const initializeSession = async () => {
      try {
        // Check if we're resuming an existing session
        if (sessionId) {
          console.log('🔄 Attempting to resume session:', sessionId);
          const existingSession = await loadExistingSession(sessionId);
          if (existingSession) {
            // Check if this should be in review mode
            const mode = searchParams.get('mode');
            if (mode === 'review') {
              existingSession.status = 'review';
            }
            setSession(existingSession);
            setActiveSessionId(existingSession.id);
            setLoading(false);
            return;
          }
        }

        // Check if we should start in review mode
        const mode = searchParams.get('mode');
        if (mode === 'review') {
          // Create new session
          const questionsResponse = await loadQuestions();
          if (!questionsResponse) return;

          const { questions: randomizedQuestions, timeLimit: timeLimitMinutes } = questionsResponse;
          
          // Use a temporary ID first, will be replaced by TestSessionService
          const tempSessionId = crypto.randomUUID();
          const newSession: TestSession = {
            id: tempSessionId,
            type: testType as 'diagnostic' | 'practice' | 'drill',
            subjectId,
            subjectName: searchParams.get('subjectName') || subjectId,
            sectionId,
            sectionName: searchParams.get('sectionName') || '',
            skillId: searchParams.get('skill') || undefined,
            skillName: searchParams.get('skillName') || undefined,
            questions: randomizedQuestions,
            timeLimit: timeLimitMinutes,
            currentQuestion: 0,
            answers: {},
            flaggedQuestions: new Set(),
            startTime: new Date(),
            status: 'review',
            metadata: {
              productType: selectedProduct
            }
          };

          setSession(newSession);
          setTimeRemaining(timeLimitMinutes * 60); // Convert to seconds

          // Don't save initial session here - let initializeTestSession handle it
          setLoading(false);
          return;
        }

        // Create new session
        const questionsResponse = await loadQuestions();
        if (!questionsResponse) return;

        const { questions: randomizedQuestions, timeLimit: timeLimitMinutes } = questionsResponse;
        
        // Use a temporary ID first, will be replaced by TestSessionService  
        const tempSessionId = crypto.randomUUID();
        const newSession: TestSession = {
          id: tempSessionId,
          type: testType as 'diagnostic' | 'practice' | 'drill',
          subjectId,
          subjectName: searchParams.get('subjectName') || subjectId,
          sectionId,
          sectionName: searchParams.get('sectionName') || '',
          skillId: searchParams.get('skill') || undefined,
          skillName: searchParams.get('skillName') || undefined,
          questions: randomizedQuestions,
          timeLimit: timeLimitMinutes,
          currentQuestion: 0,
          answers: {},
          flaggedQuestions: new Set(),
          startTime: new Date(),
          status: 'in-progress',
          metadata: {
            productType: selectedProduct
          }
        };

        setSession(newSession);
        setTimeRemaining(timeLimitMinutes * 60); // Convert to seconds
        setLoading(false);
      } catch (err) {
        console.error('Error initializing session:', err);
        setError('Failed to initialize test session');
        setLoading(false);
      }
    };

    initializeSession();
  }, [testType, subjectId, sectionId, searchParams, selectedProduct, user, sessionId]);

  // Cleanup auto-save on unmount
  useEffect(() => {
    return () => {
      cleanupAutoSave();
    };
  }, [autoSaveInterval, exitHandlers]);

  // Update auto-save when session changes
  useEffect(() => {
    if (session && session.status === 'in-progress' && activeSessionId && recordingEnabled) {
      // Cleanup previous auto-save
      cleanupAutoSave();
      // Setup new auto-save with current session
      setupAutoSave(session);
    }
  }, [session?.currentQuestion, session?.answers, session?.flaggedQuestions, timeRemaining]);

  // Timer effect with auto-finish when reaching 0
  useEffect(() => {
    if (!session || session.status !== 'in-progress') return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Auto-finish test when timer reaches 0
          console.log('⏰ Time is up! Auto-finishing test...');
          setSession(prevSession => 
            prevSession ? { ...prevSession, status: 'completed' } : prevSession
          );
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [session]);

  // Check for paused session on load and resume if needed
  useEffect(() => {
    if (session && session.status === 'paused' && session.pausedTime !== undefined) {
      console.log('🔄 Resuming paused test with', session.pausedTime, 'seconds remaining');
      setTimeRemaining(session.pausedTime);
      setSession(prev => prev ? { ...prev, status: 'in-progress', pausedTime: undefined } : prev);
    }
  }, [session]);

  // Initialize test session when starting (only for non-review sessions)
  useEffect(() => {
    if (session && user && !activeSessionId && session.status === 'in-progress') {
      initializeTestSession();
    }
  }, [session, user, activeSessionId]);

  const initializeTestSession = async () => {
    if (!session || !user) return;
    
    try {
      // Extract question IDs for session creation
      const questionIds = session.questions.map(q => q.id);
      
      const sessionConfig: TestSessionConfig = {
        type: session.type === 'diagnostic' ? 'diagnostic' : 'practice',
        productType: session.metadata?.productType || 'default',
        subjectId: session.subjectId || '',
        subjectName: session.subjectName || '',
        sectionId: session.sectionId,
        sectionName: session.sectionName,
        skillId: session.skillId,
        skillName: session.skillName,
        questionCount: session.questions?.length || 0,
        timeLimit: session.timeLimit || 60,
        metadata: {
          questionOrder: questionIds // Pass question order in metadata
        }
      };

      const testSessionId = await TestSessionService.startSession(user.id, sessionConfig);
      
      // Update the session with the proper session ID from TestSessionService
      const updatedSession = { ...session, id: testSessionId };
      setSession(updatedSession);
      setActiveSessionId(testSessionId);
      
      // CRITICAL: Save the session to database BEFORE enabling recording
      console.log('💾 Saving session to database before enabling recording...');
      await saveSessionProgress(updatedSession);
      
      // Setup auto-save with window exit handlers
      setupAutoSave(updatedSession);
      
      // Add a small delay to ensure database transaction is complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Only enable recording after session is confirmed saved
      setRecordingEnabled(true);
      
      // Start timing for first question
      TestSessionService.startQuestion();
      
      console.log('✅ Test session initialized with coordinated ID:', testSessionId);
      console.log('🔓 Recording enabled after session save');
      console.log('📝 Question IDs stored:', questionIds.length);
      console.log('📱 Auto-save and exit handlers configured');
    } catch (error) {
      console.error('Failed to initialize test session:', error);
      setRecordingEnabled(false);
    }
  };

  const handleAnswer = async (answerIndex: number) => {
    if (!session || session.currentQuestion >= session.questions.length) return;

    const updatedAnswers = { ...session.answers };
    updatedAnswers[session.currentQuestion] = answerIndex; // Store answer as number

    // Calculate time spent on this question
    const timeSpent = TestSessionService.getQuestionTimeSpent();
    
    // Update session with new answer
    const updatedSession = {
      ...session,
      answers: updatedAnswers
    };
    
    setSession(updatedSession);
    
    // Record the question response with offline support
    if (activeSessionId && user && recordingEnabled) {
      try {
        const currentQuestion = session.questions[session.currentQuestion];
        const isCorrect = answerIndex === currentQuestion.correctAnswer;
        
        const responseData: QuestionResponseData = {
          questionId: currentQuestion.id,
          questionIndex: session.currentQuestion,
          answerIndex,
          isCorrect,
          timeSpentSeconds: timeSpent,
          subSkill: currentQuestion.subSkill || 'Unknown',
          difficulty: currentQuestion.difficulty || 1
        };

        // Use offline-capable recording
        const wasRecordedOnline = await recordOfflineQuestionResponse(
          activeSessionId,
          responseData
        );
        
        setProgressSaved(true);
        setTimeout(() => setProgressSaved(false), wasRecordedOnline ? 2000 : 4000);
        
      } catch (error) {
        console.error('Failed to record question response:', error);
        // Continue with test even if recording fails
      }
    }

    // Save session progress automatically after each answer
    try {
      await saveSessionProgress(updatedSession);
    } catch (error) {
      console.error('Failed to save session progress:', error);
    }
  };

  const handleNext = async () => {
    if (session && session.currentQuestion < session.questions.length - 1) {
      const updatedSession = {
        ...session,
        currentQuestion: session.currentQuestion + 1
      };
      
      setSession(updatedSession);
      
      // Start timing for next question
      TestSessionService.startQuestion();
      
      // Save progress
      try {
        await saveSessionProgressRealtime(updatedSession);
      } catch (error) {
        console.error('Failed to save session progress:', error);
      }
    }
  };

  const handlePrevious = async () => {
    if (session && session.currentQuestion > 0) {
      const updatedSession = {
        ...session,
        currentQuestion: session.currentQuestion - 1
      };
      
      setSession(updatedSession);
      
      // Start timing for previous question
      TestSessionService.startQuestion();
      
      // Save progress
      try {
        await saveSessionProgressRealtime(updatedSession);
      } catch (error) {
        console.error('Failed to save session progress:', error);
      }
    }
  };

  const handleJumpToQuestion = (questionIndex: number) => {
    if (!session) return;
    
    setSession(prev => prev ? ({
      ...prev,
      currentQuestion: questionIndex
    }) : prev);
  };

  const handleFlag = (questionIndex: number) => {
    if (!session) return;
    
    setSession(prev => {
      if (!prev) return prev;
      const newFlagged = new Set(prev.flaggedQuestions);
      if (newFlagged.has(questionIndex)) {
        newFlagged.delete(questionIndex);
      } else {
        newFlagged.add(questionIndex);
      }
      return {
        ...prev,
        flaggedQuestions: newFlagged
      };
    });
  };

  const handleFinish = async () => {
    if (!session) return;

    // Cleanup auto-save before finishing
    cleanupAutoSave();

    // Convert answers to string format for session completion
    const stringAnswers: Record<number, string> = {};
    Object.entries(session.answers).forEach(([questionIndex, answerIndex]) => {
      const question = session.questions[parseInt(questionIndex)];
      if (question && question.options[answerIndex]) {
        stringAnswers[parseInt(questionIndex)] = question.options[answerIndex];
      }
    });

    // Mark session as completed
    const completedSession = { ...session, status: 'completed' as const };
    setSession(completedSession);
    
    // Complete session in database
    if (session.id) {
      try {
        await SessionPersistenceService.completeSession(
          session.id,
          user?.id || '',
          session.metadata?.productType || 'default',
          session.type === 'diagnostic' ? 'diagnostic' : 'practice'
        );
        console.log('✅ Session marked as completed in database');
      } catch (error) {
        console.error('Failed to complete session in database:', error);
      }
    }
    
    // Record session completion for analytics
    if (activeSessionId && user && recordingEnabled) {
      try {
        const correctAnswers = Object.values(session.answers).filter(
          (answer, index) => answer === session.questions[index]?.correctAnswer
        ).length;

        const totalTime = TestSessionService.getTotalSessionTime();
        
        // Calculate section-wise scores
        const sectionScores: Record<string, any> = {};
        if (session.sectionName) {
          sectionScores[session.sectionName] = {
            correct: correctAnswers,
            total: session.questions.length,
            accuracy: correctAnswers / session.questions.length
          };
        }

        await TestSessionService.completeSession({
          sessionId: activeSessionId,
          userId: user.id,
          productType: session.metadata?.productType || 'default',
          testMode: session.type === 'diagnostic' ? 'diagnostic' : 'practice',
          totalQuestions: session.questions.length,
          correctAnswers,
          totalTimeSeconds: totalTime,
          sectionScores
        });

        // Update user streak
        await TestSessionService.updateUserStreak(
          user.id,
          session.metadata?.productType || 'default'
        );

        console.log('✅ Test session completed and recorded');
      } catch (error) {
        console.error('Failed to complete test session:', error);
      }
    }
  };

  const handleExit = async () => {
    // Save current progress before exiting
    if (session && user) {
      try {
        // Mark session as paused and save current progress
        const pausedSession = {
          ...session,
          status: 'paused' as const,
          pausedTime: timeRemaining
        };
        
        await saveSessionProgress(pausedSession);
        console.log('💾 Session progress saved before exit');
      } catch (error) {
        console.error('Failed to save progress on exit:', error);
      }
    }

    // Cleanup auto-save
    cleanupAutoSave();

    // Reset session tracking
    TestSessionService.resetSession();
    setActiveSessionId(null);

    // Navigate back to appropriate dashboard
    if (session?.type === 'diagnostic') {
      navigate('/diagnostic');
    } else {
      navigate('/practice-tests');
    }
  };

  const handleTimeUp = async () => {
    if (!session) return;
    
    // Auto-finish when time is up
    await handleFinish();
  };

  const handleReview = () => {
    if (!session) return;
    
    setSession(prev => prev ? ({ ...prev, status: 'review' }) : prev);
  };

  const handleBackToDashboard = () => {
    const basePath = session?.type === 'diagnostic' ? '/dashboard/diagnostic' :
                    session?.type === 'practice' ? '/dashboard/practice-tests' :
                    session?.type === 'drill' ? '/dashboard/drill' :
                    '/dashboard';
    navigate(basePath);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTestTitle = () => {
    if (!session) return 'Test';
    
    const sectionDisplay = session.sectionName || session.subjectId;
    
    if (session.type === 'drill') {
      return `${session.subjectName} - ${session.skillName || sectionDisplay}`;
    } else if (session.type === 'practice') {
      return `Practice Test - ${sectionDisplay}`;
    } else {
      return `Diagnostic - ${sectionDisplay}`;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-edu-teal mx-auto mb-4"></div>
          <p className="text-edu-navy">Loading test questions...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error || 'Failed to load test session'}</p>
          <div className="space-y-2">
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
            <Button onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Completed state - show results/review options
  if (session.status === 'completed') {
    const totalQuestions = session.questions.length;
    const answeredQuestions = Object.keys(session.answers).length;
    const score = Object.entries(session.answers).reduce((correct, [qIndex, answer]) => {
      return session.questions[parseInt(qIndex)].correctAnswer === answer ? correct + 1 : correct;
    }, 0);
    const percentage = Math.round((score / totalQuestions) * 100);

    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-edu-navy mb-2">
                {timeRemaining === 0 ? 'Time is Up!' : 'Test Completed!'}
              </h1>
              <p className="text-edu-navy/70 mb-6">{getTestTitle()}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-edu-teal">{score}/{totalQuestions}</div>
                  <div className="text-sm text-gray-600">Questions Correct</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-edu-coral">{percentage}%</div>
                  <div className="text-sm text-gray-600">Score</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-edu-navy">{answeredQuestions}</div>
                  <div className="text-sm text-gray-600">Answered</div>
                </div>
              </div>

              <div className="flex justify-center space-x-4">
                <Button onClick={handleReview} variant="outline">
                  Review Answers
                </Button>
                <Button onClick={handleBackToDashboard}>
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Review mode - use enhanced interface with feedback
  if (session.status === 'review') {
    return (
      <EnhancedTestInterface
        questions={session.questions}
        currentQuestionIndex={session.currentQuestion}
        onAnswer={handleAnswer}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onJumpToQuestion={handleJumpToQuestion}
        onFlag={handleFlag}
        answers={session.answers}
        flaggedQuestions={session.flaggedQuestions}
        showFeedback={true}
        isReviewMode={true}
        testTitle={`${getTestTitle()} - Review`}
        onFinish={handleBackToDashboard}
      />
    );
  }

  // Main test taking interface
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Real-time Status Indicators */}
      {recordingEnabled && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {/* Backend Sync Status */}
          <div className={`px-3 py-1 rounded-lg text-sm flex items-center ${
            backendSynced ? 'bg-green-500' : 'bg-red-500'
          } text-white`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${
              backendSynced ? 'bg-green-200' : 'bg-red-200'
            }`} />
            {backendSynced ? 'Synced' : 'Sync Failed'}
          </div>
          
          {/* Connection Status */}
          <div className={`px-3 py-1 rounded-lg text-sm flex items-center ${
            isOnline ? 'bg-green-500' : 'bg-orange-500'
          } text-white`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${
              isOnline ? 'bg-green-200' : 'bg-orange-200'
            }`} />
            {isOnline ? 'Online' : 'Offline'}
          </div>
          
          {/* Real-time Sync Status */}
          {isSyncing && (
            <div className="bg-blue-500 text-white px-3 py-1 rounded-lg text-sm flex items-center">
              <svg className="animate-spin w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm6 3a3 3 0 100 6 3 3 0 000-6z" />
              </svg>
              Syncing...
            </div>
          )}
          
          {/* Offline Queue */}
          {offlineResponseCount > 0 && (
            <div className="bg-orange-500 text-white px-3 py-1 rounded-lg text-sm">
              {offlineResponseCount} queued
            </div>
          )}
          
          {/* Real-time Save Confirmation */}
          {progressSaved && (
            <div className="bg-green-500 text-white px-3 py-1 rounded-lg text-sm flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Saved to Backend
            </div>
          )}
          
          {/* Timer Sync Indicator */}
          {timerSyncInterval && (
            <div className="bg-purple-500 text-white px-3 py-1 rounded-lg text-sm flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              Timer Sync
            </div>
          )}
          
          {/* Session ID */}
          {activeSessionId && (
            <div className="bg-blue-500 text-white px-3 py-1 rounded-lg text-sm">
              Session: {activeSessionId.substring(0, 8)}...
            </div>
          )}
        </div>
      )}
      
      <EnhancedTestInterface
        questions={session.questions}
        currentQuestionIndex={session.currentQuestion}
        timeRemaining={timeRemaining}
        onAnswer={handleAnswer}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onJumpToQuestion={handleJumpToQuestion}
        onFlag={handleFlag}
        answers={session.answers}
        flaggedQuestions={session.flaggedQuestions}
        showFeedback={false}
        isReviewMode={false}
        testTitle={getTestTitle()}
        onFinish={handleFinish}
        onExit={handleExit}
      />
    </div>
  );
};

export default TestTaking; 