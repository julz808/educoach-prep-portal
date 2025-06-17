import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowLeft, AlertCircle } from 'lucide-react';
import { useProduct } from '@/context/ProductContext';
import { useAuth } from '@/context/AuthContext';
import { EnhancedTestInterface } from '@/components/EnhancedTestInterface';
import { 
  fetchDiagnosticModes,
  fetchDrillModes,
  fetchQuestionsFromSupabase,
  type OrganizedQuestion 
} from '@/services/supabaseQuestionService';
import { SessionService, type TestSession } from '@/services/sessionService';
import { TEST_STRUCTURES } from '@/data/curriculumData';

// Map frontend course IDs back to proper display names (same as in TestInstructionsPage)
const PRODUCT_DISPLAY_NAMES: Record<string, string> = {
  'year-5-naplan': 'Year 5 NAPLAN',
  'year-7-naplan': 'Year 7 NAPLAN',
  'acer-scholarship': 'ACER Scholarship (Year 7 Entry)',
  'edutest-scholarship': 'EduTest Scholarship (Year 7 Entry)',
  'vic-selective': 'VIC Selective Entry (Year 9 Entry)',
  'nsw-selective': 'NSW Selective Entry (Year 7 Entry)',
};

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
  format?: 'Multiple Choice' | 'Written Response';
  userTextAnswer?: string; // For written responses
}

interface TestSessionState {
  id: string;
  type: 'diagnostic' | 'practice' | 'drill';
  subjectId: string;
  subjectName: string;
  sectionName: string;
  questions: Question[];
  timeLimit: number;
  currentQuestion: number;
  answers: Record<number, number>;
  textAnswers: Record<number, string>; // For written responses
  flaggedQuestions: Set<number>;
  startTime: Date;
  status: 'in-progress' | 'completed' | 'review';
  isResumed?: boolean;
}

const TestTaking: React.FC = () => {
  const { testType, subjectId, sessionId } = useParams<{ 
    testType: string; 
    subjectId: string; 
    sessionId?: string;
  }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { selectedProduct } = useProduct();
  const { user } = useAuth();
  
  const [session, setSession] = useState<TestSessionState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [initializing, setInitializing] = useState(false);
  const initializingRef = useRef(false);

  const sectionName = searchParams.get('sectionName') || '';
  const isReviewMode = searchParams.get('review') === 'true';
  
  console.log('🔍 REVIEW MODE: isReviewMode =', isReviewMode, 'from searchParams.review =', searchParams.get('review'));

  // Get time limit from curriculum data
  const getSectionTimeLimit = (productType: string, sectionName: string): number => {
    console.log('🕐 TIMER: Getting time for product:', productType, 'section:', sectionName);
    console.log('🕐 TIMER: Available products in TEST_STRUCTURES:', Object.keys(TEST_STRUCTURES));
    
    const testStructure = TEST_STRUCTURES[productType as keyof typeof TEST_STRUCTURES];
    if (!testStructure) {
      console.log('🕐 ERROR: No test structure found for product:', productType);
      console.log('🕐 ERROR: Available products:', Object.keys(TEST_STRUCTURES));
      return 30;
    }
    
    console.log('🕐 TIMER: Found test structure for', productType);

    const availableSections = Object.keys(testStructure);
    console.log('🕐 Available sections:', availableSections);

    // Function to safely get time from section data
    const getTime = (sectionData: any): number | null => {
      if (sectionData && typeof sectionData === 'object' && typeof sectionData.time === 'number') {
        return sectionData.time;
      }
      return null;
    };

    // 1. Try exact match (case-sensitive)
    let sectionData = (testStructure as any)[sectionName];
    let time = getTime(sectionData);
    if (time !== null) {
      console.log('🕐 ✅ EXACT MATCH:', sectionName, '→', time, 'minutes');
      return time;
    }

    // 2. Try exact match (case-insensitive)
    const sectionLower = sectionName.toLowerCase();
    for (const key of availableSections) {
      if (key.toLowerCase() === sectionLower) {
        sectionData = (testStructure as any)[key];
        time = getTime(sectionData);
        if (time !== null) {
          console.log('🕐 ✅ CASE-INSENSITIVE MATCH:', key, '→', time, 'minutes');
          return time;
        }
      }
    }

    // 3. Try partial matches (both directions)
    for (const key of availableSections) {
      const keyLower = key.toLowerCase();
      if (keyLower.includes(sectionLower) || sectionLower.includes(keyLower)) {
        sectionData = (testStructure as any)[key];
        time = getTime(sectionData);
        if (time !== null) {
          console.log('🕐 ✅ PARTIAL MATCH:', key, '→', time, 'minutes');
          return time;
        }
      }
    }

    console.log('🕐 ❌ NO MATCH FOUND for section:', sectionName, 'in product:', productType);
    console.log('🕐 ❌ Available sections were:', availableSections);
    console.log('🕐 ❌ Using default 30 minutes');
    return 30;
  };

  // Load questions for the section
  const loadQuestions = async (): Promise<Question[]> => {
    if (testType === 'diagnostic') {
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

      if (!foundSection || foundSection.questions.length === 0) {
        throw new Error('No questions found for this section');
      }

      // Convert questions to our format and add format detection
      const properDisplayName = PRODUCT_DISPLAY_NAMES[selectedProduct] || selectedProduct;
      const testStructure = TEST_STRUCTURES[properDisplayName as keyof typeof TEST_STRUCTURES];
      let questionFormat: 'Multiple Choice' | 'Written Response' = 'Multiple Choice';
      
      // Detect format from curriculum data
      if (testStructure) {
        const sectionData = Object.entries(testStructure).find(([key]) => {
          const keyLower = key.toLowerCase();
          const sectionLower = sectionName.toLowerCase();
          return keyLower === sectionLower || 
                 keyLower.includes(sectionLower) || 
                 sectionLower.includes(keyLower);
        });
        if (sectionData && sectionData[1] && (sectionData[1] as any).format) {
          questionFormat = (sectionData[1] as any).format;
          console.log('🔍 DIAGNOSTIC: Detected format for', sectionName, '→', questionFormat);
        }
      }
      
      // For reading sections, organize questions by passage to keep related questions together
      let organizedQuestions = foundSection.questions;
      const isReadingSection = sectionName.toLowerCase().includes('reading') || 
                               sectionName.toLowerCase().includes('comprehension');
      
      if (isReadingSection) {
        console.log('📖 READING: Organizing questions by passage for', sectionName);
        
        // Group questions by passage_id, keeping non-passage questions at the end
        const questionsWithPassage = organizedQuestions.filter(q => q.passageContent);
        const questionsWithoutPassage = organizedQuestions.filter(q => !q.passageContent);
        
        // Sort questions with passages by some identifier to group them
        const passageGroups = new Map<string, typeof organizedQuestions>();
        questionsWithPassage.forEach(q => {
          // Use passage content as grouping key (in real app, you'd use passage_id)
          const passageKey = q.passageContent?.substring(0, 50) || 'unknown';
          if (!passageGroups.has(passageKey)) {
            passageGroups.set(passageKey, []);
          }
          passageGroups.get(passageKey)!.push(q);
        });
        
        // Reorganize: all questions from passage 1, then passage 2, etc., then non-passage questions
        organizedQuestions = [
          ...Array.from(passageGroups.values()).flat(),
          ...questionsWithoutPassage
        ];
        
        console.log('📖 READING: Organized into', passageGroups.size, 'passage groups with', questionsWithoutPassage.length, 'non-passage questions');
      }
      
      return organizedQuestions.map((q, index) => ({
        id: q.id || `question-${index}`,
        text: q.text,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        topic: q.topic || 'General',
        subSkill: q.subSkill || 'General',
        difficulty: q.difficulty || 2,
        passageContent: q.passageContent || '',
        format: questionFormat
      }));
    } else if (testType === 'practice') {
      const organizedData = await fetchQuestionsFromSupabase();
      console.log('🔍 Practice: Available test types:', organizedData.testTypes.map(tt => tt.id));
      
      const currentTestType = organizedData.testTypes.find(tt => tt.id === selectedProduct);
      
      if (!currentTestType) {
        console.error('🔍 Practice: No test type found for product:', selectedProduct);
        throw new Error('No test data found for this product');
      }
      
      console.log('🔍 Practice: Found test type with modes:', currentTestType.testModes.map(tm => ({ id: tm.id, name: tm.name, sections: tm.sections.length })));

      // Find the section by ID across all practice modes (practice_1, practice_2, practice_3)
      let foundSection = null;
      for (const testMode of currentTestType.testModes) {
        // Check for practice modes: practice_1, practice_2, practice_3, etc.
        if (testMode.id && (testMode.id.startsWith('practice_') || testMode.name.toLowerCase().includes('practice'))) {
          console.log('🔍 Checking practice mode:', testMode.name, 'with', testMode.sections.length, 'sections');
          foundSection = testMode.sections.find(section => 
            section.id === subjectId || 
            section.name.toLowerCase().includes(subjectId.toLowerCase()) ||
            subjectId.toLowerCase().includes(section.name.toLowerCase())
          );
          if (foundSection && foundSection.questions.length > 0) {
            console.log('✅ Found section in practice mode:', testMode.name, 'section:', foundSection.name, 'questions:', foundSection.questions.length);
            break;
          }
        }
      }

      if (!foundSection || foundSection.questions.length === 0) {
        console.error('🔍 Practice: No section found for subjectId:', subjectId);
        console.error('🔍 Practice: Available sections across all modes:', 
          currentTestType.testModes.flatMap(tm => 
            tm.sections.map(s => ({ mode: tm.name, sectionId: s.id, sectionName: s.name, questions: s.questions.length }))
          )
        );
        throw new Error('No questions found for this section');
      }

      // Convert questions to our format and add format detection
      const properDisplayName = PRODUCT_DISPLAY_NAMES[selectedProduct] || selectedProduct;
      const testStructure = TEST_STRUCTURES[properDisplayName as keyof typeof TEST_STRUCTURES];
      let questionFormat: 'Multiple Choice' | 'Written Response' = 'Multiple Choice';
      
      // Detect format from curriculum data
      if (testStructure) {
        const sectionData = Object.entries(testStructure).find(([key]) => {
          const keyLower = key.toLowerCase();
          const sectionLower = sectionName.toLowerCase();
          return keyLower === sectionLower || 
                 keyLower.includes(sectionLower) || 
                 sectionLower.includes(keyLower);
        });
        if (sectionData && sectionData[1] && (sectionData[1] as any).format) {
          questionFormat = (sectionData[1] as any).format;
          console.log('🔍 PRACTICE: Detected format for', sectionName, '→', questionFormat);
        }
      }
      
      // For reading sections, organize questions by passage to keep related questions together
      let organizedQuestions = foundSection.questions;
      const isReadingSection = sectionName.toLowerCase().includes('reading') || 
                               sectionName.toLowerCase().includes('comprehension');
      
      if (isReadingSection) {
        console.log('📖 READING PRACTICE: Organizing questions by passage for', sectionName);
        
        // Group questions by passage_id, keeping non-passage questions at the end
        const questionsWithPassage = organizedQuestions.filter(q => q.passageContent);
        const questionsWithoutPassage = organizedQuestions.filter(q => !q.passageContent);
        
        // Sort questions with passages by some identifier to group them
        const passageGroups = new Map<string, typeof organizedQuestions>();
        questionsWithPassage.forEach(q => {
          // Use passage content as grouping key (in real app, you'd use passage_id)
          const passageKey = q.passageContent?.substring(0, 50) || 'unknown';
          if (!passageGroups.has(passageKey)) {
            passageGroups.set(passageKey, []);
          }
          passageGroups.get(passageKey)!.push(q);
        });
        
        // Reorganize: all questions from passage 1, then passage 2, etc., then non-passage questions
        organizedQuestions = [
          ...Array.from(passageGroups.values()).flat(),
          ...questionsWithoutPassage
        ];
        
        console.log('📖 READING PRACTICE: Organized into', passageGroups.size, 'passage groups with', questionsWithoutPassage.length, 'non-passage questions');
      }
      
      return organizedQuestions.map((q, index) => ({
        id: q.id || `question-${index}`,
        text: q.text,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        topic: q.topic || 'General',
        subSkill: q.subSkill || 'General',
        difficulty: q.difficulty || 2,
        passageContent: q.passageContent || '',
        format: questionFormat
      }));
    } else if (testType === 'drill') {
      console.log('🔧 DRILL: Loading drill questions for product:', selectedProduct, 'subjectId:', subjectId);
      
      const drillModes = await fetchDrillModes(selectedProduct);
      console.log('🔧 DRILL: Available drill modes:', drillModes.map(dm => dm.name));
      
      // Find the section containing questions by subjectId
      let foundSection = null;
      for (const mode of drillModes) {
        foundSection = mode.sections.find(section => 
          section.id === subjectId || 
          section.name.toLowerCase().includes(subjectId.toLowerCase()) ||
          subjectId.toLowerCase().includes(section.name.toLowerCase())
        );
        if (foundSection && foundSection.questions.length > 0) {
          console.log('✅ DRILL: Found section:', foundSection.name, 'in mode:', mode.name, 'with', foundSection.questions.length, 'questions');
          break;
        }
      }

      if (!foundSection || foundSection.questions.length === 0) {
        console.error('🔧 DRILL: No section found for subjectId:', subjectId);
        console.error('🔧 DRILL: Available sections:', 
          drillModes.flatMap(dm => 
            dm.sections.map(s => ({ mode: dm.name, sectionId: s.id, sectionName: s.name, questions: s.questions.length }))
          )
        );
        throw new Error('No drill questions found for this section');
      }

      // Filter by difficulty if specified in search params
      const difficulty = searchParams.get('difficulty');
      let filteredQuestions = foundSection.questions;
      
      if (difficulty) {
        const difficultyMap = { easy: 1, medium: 2, hard: 3 };
        const targetDifficulty = difficultyMap[difficulty as keyof typeof difficultyMap];
        if (targetDifficulty) {
          filteredQuestions = foundSection.questions.filter(q => q.difficulty === targetDifficulty);
          console.log('🔧 DRILL: Filtered to', difficulty, 'questions:', filteredQuestions.length, 'out of', foundSection.questions.length, 'total');
        }
      }

      if (filteredQuestions.length === 0) {
        throw new Error(`No ${difficulty || ''} drill questions found for this section`);
      }

      // Convert questions to our format - drills are always multiple choice
      const convertedQuestions = filteredQuestions.map((q, index) => ({
        id: q.id || `question-${index}`,
        text: q.text || '',
        options: q.options || [],
        correctAnswer: q.correctAnswer || 0,
        explanation: q.explanation || '',
        topic: q.topic || 'General',
        subSkill: q.subSkill || 'General',
        difficulty: q.difficulty || 2,
        passageContent: q.passageContent || '',
        format: 'Multiple Choice' as const
      }));
      
      console.log('🔧 DRILL: Converted questions:', convertedQuestions.length, 'questions with proper fallbacks');
      
      // Validate that all questions have required properties
      const invalidQuestions = convertedQuestions.filter(q => !q.text || !q.options || q.options.length === 0);
      if (invalidQuestions.length > 0) {
        console.error('🔧 DRILL: Found invalid questions:', invalidQuestions);
      }
      
      return convertedQuestions;
    } else {
      throw new Error(`Test type ${testType} not supported yet`);
    }
  };

  // Initialize session
  useEffect(() => {
    const initializeSession = async () => {
      if (!user || initializing || initializingRef.current) return;

      try {
        initializingRef.current = true;
        setInitializing(true);
        setLoading(true);
        setError(null);

        console.log('🚀 Initializing session with params:', { testType, subjectId, sessionId, sectionName });
        console.log('🚀 Selected product:', selectedProduct);

        const questions = await loadQuestions();
        
        // If we have a sessionId, try to resume
        if (sessionId) {
          console.log('🔄 Attempting to resume session:', sessionId);
          const savedSession = await SessionService.loadSession(sessionId);
          
          if (savedSession) {
            console.log('🔄 RESUME: Loading saved session data:', {
              sessionId: savedSession.id,
              currentQuestionIndex: savedSession.currentQuestionIndex,
              savedAnswers: Object.keys(savedSession.answers).length,
              savedTextAnswers: Object.keys(savedSession.textAnswers || {}).length,
              timeRemaining: savedSession.timeRemainingSeconds,
              rawAnswers: savedSession.answers,
              rawTextAnswers: savedSession.textAnswers
            });

            // Convert saved session to our format
            const answers: Record<number, number> = {};
            Object.entries(savedSession.answers).forEach(([qIndex, optionText]) => {
              const questionIndex = parseInt(qIndex);
              const question = questions[questionIndex];
              if (question && question.options) {
                const answerIndex = question.options.findIndex(opt => opt === optionText);
                if (answerIndex !== -1) {
                  answers[questionIndex] = answerIndex;
                  console.log('🔄 RESUME: Restored answer for question', questionIndex, '→', answerIndex, '(', optionText, ')');
                } else {
                  console.warn('🔄 RESUME: Could not find answer index for:', optionText, 'in options:', question.options);
                }
              } else {
                console.warn('🔄 RESUME: Question', questionIndex, 'not found or has no options');
              }
            });

            // Convert text answers
            const textAnswers: Record<number, string> = {};
            Object.entries(savedSession.textAnswers || {}).forEach(([qIndex, textResponse]) => {
              const questionIndex = parseInt(qIndex);
              textAnswers[questionIndex] = textResponse;
              console.log('🔄 RESUME: Restored text answer for question', questionIndex, '→', textResponse.substring(0, 50) + '...');
            });

            const resumedSession: TestSessionState = {
              id: savedSession.id,
              type: testType as 'diagnostic' | 'practice' | 'drill',
              subjectId: subjectId || '',
              subjectName: sectionName,
              sectionName: savedSession.sectionName,
              questions,
              timeLimit: Math.ceil(savedSession.timeRemainingSeconds / 60),
              currentQuestion: savedSession.currentQuestionIndex,
              answers,
              textAnswers,
              flaggedQuestions: new Set(savedSession.flaggedQuestions.map(q => parseInt(q))),
              startTime: new Date(savedSession.createdAt),
              status: isReviewMode ? 'review' : (savedSession.status === 'completed' ? 'completed' : 'in-progress'),
              isResumed: true
            };

            // Apply answers and text answers to questions
            resumedSession.questions.forEach((question, index) => {
              if (resumedSession.answers[index] !== undefined) {
                question.userAnswer = resumedSession.answers[index];
              }
              if (resumedSession.textAnswers[index] !== undefined) {
                question.userTextAnswer = resumedSession.textAnswers[index];
                console.log('🔄 RESUME: Restored text answer for question', index, '→', resumedSession.textAnswers[index].substring(0, 50) + '...');
              }
              question.flagged = resumedSession.flaggedQuestions.has(index);
            });

            setSession(resumedSession);
            setTimeRemaining(savedSession.timeRemainingSeconds);
            console.log('✅ RESUME: Session resumed successfully with:', {
              currentQuestion: resumedSession.currentQuestion,
              answersRestored: Object.keys(resumedSession.answers).length,
              textAnswersRestored: Object.keys(resumedSession.textAnswers).length,
              timeRemaining: savedSession.timeRemainingSeconds
            });
            return;
          }
        }

        // Create new session (or get existing active session)
        console.log('🆕 Creating/getting session');
        const properDisplayName = PRODUCT_DISPLAY_NAMES[selectedProduct] || selectedProduct;
        console.log('🆕 TIMER: selectedProduct =', selectedProduct);
        console.log('🆕 TIMER: properDisplayName =', properDisplayName);
        console.log('🆕 TIMER: sectionName =', sectionName);
        
        const timeLimitMinutes = getSectionTimeLimit(properDisplayName, sectionName);
        const timeLimitSeconds = timeLimitMinutes * 60;
        
        console.log('🆕 TIMER: Calculated time limit =', timeLimitMinutes, 'minutes (', timeLimitSeconds, 'seconds)');
        
        const sessionIdToUse = await SessionService.createSession(
          user.id,
          selectedProduct,
          testType as 'diagnostic' | 'practice' | 'drill',
          sectionName,
          questions.length,
          timeLimitSeconds
        );

        // Check if this is actually resuming an existing session
        const existingSession = await SessionService.loadSession(sessionIdToUse);
        
        if (existingSession && existingSession.currentQuestionIndex > 0) {
          // This is an existing session we should resume
          console.log('🔄 Resuming found session:', sessionIdToUse);
          
          // Convert saved session to our format
          const answers: Record<number, number> = {};
          Object.entries(existingSession.answers).forEach(([qIndex, optionText]) => {
            const questionIndex = parseInt(qIndex);
            const question = questions[questionIndex];
            if (question && question.options) {
              const answerIndex = question.options.findIndex(opt => opt === optionText);
              if (answerIndex !== -1) {
                answers[questionIndex] = answerIndex;
              }
            }
          });

          // Convert text answers
          const textAnswers: Record<number, string> = {};
          Object.entries(existingSession.textAnswers || {}).forEach(([qIndex, textResponse]) => {
            const questionIndex = parseInt(qIndex);
            textAnswers[questionIndex] = textResponse;
          });

          const resumedSession: TestSessionState = {
            id: existingSession.id,
            type: testType as 'diagnostic' | 'practice' | 'drill',
            subjectId: subjectId || '',
            subjectName: sectionName,
            sectionName: existingSession.sectionName,
            questions,
            timeLimit: Math.ceil(existingSession.timeRemainingSeconds / 60),
            currentQuestion: existingSession.currentQuestionIndex,
            answers,
            textAnswers,
            flaggedQuestions: new Set(existingSession.flaggedQuestions.map(q => parseInt(q))),
            startTime: new Date(existingSession.createdAt),
            status: isReviewMode ? 'review' : (existingSession.status === 'completed' ? 'completed' : 'in-progress'),
            isResumed: true
          };

          // Apply answers and text answers to questions
          resumedSession.questions.forEach((question, index) => {
            if (resumedSession.answers[index] !== undefined) {
              question.userAnswer = resumedSession.answers[index];
            }
            if (resumedSession.textAnswers[index] !== undefined) {
              question.userTextAnswer = resumedSession.textAnswers[index];
              console.log('🔄 RESUME-CREATE: Restored text answer for question', index, '→', resumedSession.textAnswers[index].substring(0, 50) + '...');
            }
            question.flagged = resumedSession.flaggedQuestions.has(index);
          });

          setSession(resumedSession);
          setTimeRemaining(existingSession.timeRemainingSeconds);
          console.log('✅ RESUME: Session resumed from createSession with:', {
            currentQuestion: resumedSession.currentQuestion,
            answersRestored: Object.keys(resumedSession.answers).length,
            textAnswersRestored: Object.keys(resumedSession.textAnswers).length,
            timeRemaining: existingSession.timeRemainingSeconds
          });
          return;
        }

        // This is truly a new session (we already calculated timeLimitMinutes and timeLimitSeconds above)

        const newSession: TestSessionState = {
          id: sessionIdToUse,
          type: testType as 'diagnostic' | 'practice' | 'drill',
          subjectId: subjectId || '',
          subjectName: sectionName,
          sectionName,
          questions,
          timeLimit: timeLimitMinutes,
          currentQuestion: 0,
          answers: {},
          textAnswers: {},
          flaggedQuestions: new Set(),
          startTime: new Date(),
          status: isReviewMode ? 'review' : 'in-progress'
        };

        setSession(newSession);
        setTimeRemaining(timeLimitSeconds);
        console.log('✅ NEW: New session created with', timeLimitMinutes, 'minute time limit (', timeLimitSeconds, 'seconds)');

      } catch (err) {
        console.error('Error initializing session:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize session');
      } finally {
        setLoading(false);
        setInitializing(false);
        initializingRef.current = false;
      }
    };

    initializeSession();
  }, [testType, subjectId, sessionId, searchParams, selectedProduct, user]);

  // Auto-save progress
  const saveProgress = async () => {
    if (!session || !user) {
      console.log('🚫 SAVE: Skipping save - no session or user');
      return;
    }

    console.log('💾 SAVE: Starting saveProgress for current state:', {
      sessionId: session.id,
      currentQuestion: session.currentQuestion,
      answersInState: Object.keys(session.answers).length,
      textAnswersInState: Object.keys(session.textAnswers).length,
      timeRemaining
    });

    try {
      // Convert answers to string format
      const stringAnswers: Record<string, string> = {};
      Object.entries(session.answers).forEach(([qIndex, answerIndex]) => {
        const question = session.questions[parseInt(qIndex)];
        if (question && question.options && question.options[answerIndex]) {
          stringAnswers[qIndex] = question.options[answerIndex];
          console.log('💾 SAVE: Converting answer for question', qIndex, ':', answerIndex, '->', question.options[answerIndex]);
        }
      });

      // Convert text answers to string format
      const stringTextAnswers: Record<string, string> = {};
      Object.entries(session.textAnswers).forEach(([qIndex, textAnswer]) => {
        if (textAnswer && textAnswer.trim().length > 0) {
          stringTextAnswers[qIndex] = textAnswer;
          console.log('💾 SAVE: Converting text answer for question', qIndex, ':', textAnswer.substring(0, 50) + '...');
        }
      });

      const flaggedQuestions = Array.from(session.flaggedQuestions).map(q => q.toString());

      console.log('💾 SAVE: About to save with SessionService.saveProgress:');
      console.log('💾 SAVE: - Session ID:', session.id);
      console.log('💾 SAVE: - Current Question:', session.currentQuestion);
      console.log('💾 SAVE: - String Answers:', stringAnswers);
      console.log('💾 SAVE: - String Text Answers:', stringTextAnswers);
      console.log('💾 SAVE: - Flagged Questions:', flaggedQuestions);
      console.log('💾 SAVE: - Time Remaining:', timeRemaining);

      await SessionService.saveProgress(
        session.id,
        session.currentQuestion,
        stringAnswers,
        flaggedQuestions,
        timeRemaining,
        stringTextAnswers
      );

      console.log('✅ SAVE COMPLETE: Progress saved successfully');
    } catch (error) {
      console.error('❌ SAVE FAILED:', error);
    }
  };

  // Save strategy:
  // - Multiple choice: Save immediately after selection
  // - Written response: Save on next/exit only

  // Timer countdown
  useEffect(() => {
    if (!session || session.status !== 'in-progress') return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [session?.status]);

  const handleAnswer = (answerIndex: number) => {
    if (!session) return;
    
    console.log('📝 ANSWER: User selected answer', answerIndex, 'for question', session.currentQuestion);
    
    setSession(prev => {
      if (!prev) return prev;
      const newAnswers = { ...prev.answers };
      newAnswers[prev.currentQuestion] = answerIndex;
      
      // Update the question's userAnswer
      const updatedQuestions = [...prev.questions];
      updatedQuestions[prev.currentQuestion].userAnswer = answerIndex;
      
      console.log('📝 ANSWER: Updated answers state:', newAnswers);
      console.log('📝 ANSWER: Updated question', prev.currentQuestion, 'userAnswer to:', answerIndex);
      
      return {
        ...prev,
        answers: newAnswers,
        questions: updatedQuestions
      };
    });
    
    // Save immediately after multiple choice answer
    console.log('💾 IMMEDIATE-SAVE: Saving progress after multiple choice answer');
    setTimeout(() => saveProgress(), 100); // Small delay to ensure state is updated
  };

  const handleTextAnswer = (text: string) => {
    if (!session) return;
    
    console.log('📝 TEXT: User entered text for question', session.currentQuestion, ':', text.substring(0, 50) + '...');
    
    setSession(prev => {
      if (!prev) return prev;
      const newTextAnswers = { ...prev.textAnswers };
      newTextAnswers[prev.currentQuestion] = text;
      
      // Update the question's userTextAnswer
      const updatedQuestions = [...prev.questions];
      updatedQuestions[prev.currentQuestion].userTextAnswer = text;
      
      console.log('📝 TEXT: Updated text answers state:', newTextAnswers);
      
      return {
        ...prev,
        textAnswers: newTextAnswers,
        questions: updatedQuestions
      };
    });
  };

  const handleNext = async () => {
    if (!session) return;
    
    // Check if current question is a written response - if so, save before moving
    const currentQuestion = session.questions[session.currentQuestion];
    const isWrittenResponse = currentQuestion?.format === 'Written Response';
    
    if (isWrittenResponse) {
      console.log('💾 NEXT-SAVE: Saving written response before moving to next question');
      await saveProgress();
    }
    
    setSession(prev => {
      if (!prev || prev.currentQuestion >= prev.questions.length - 1) return prev;
      return { ...prev, currentQuestion: prev.currentQuestion + 1 };
    });
  };

  const handlePrevious = () => {
    if (!session) return;
    setSession(prev => {
      if (!prev || prev.currentQuestion <= 0) return prev;
      return { ...prev, currentQuestion: prev.currentQuestion - 1 };
    });
  };

  const handleJumpToQuestion = (questionIndex: number) => {
    if (!session) return;
    setSession(prev => {
      if (!prev) return prev;
      return { ...prev, currentQuestion: questionIndex };
    });
  };

  const handleFlag = (questionIndex: number) => {
    if (!session) return;
    
    setSession(prev => {
      if (!prev) return prev;
      const newFlagged = new Set(prev.flaggedQuestions);
      const updatedQuestions = [...prev.questions];
      
      if (newFlagged.has(questionIndex)) {
        newFlagged.delete(questionIndex);
        updatedQuestions[questionIndex].flagged = false;
      } else {
        newFlagged.add(questionIndex);
        updatedQuestions[questionIndex].flagged = true;
      }
      
      return {
        ...prev,
        flaggedQuestions: newFlagged,
        questions: updatedQuestions
      };
    });
  };

  const handleFinish = async () => {
    if (!session) return;

    try {
      console.log('🏁 FINISH: Saving final progress and completing session');
      // Save final progress with all latest responses
      await saveProgress();
      
      // Mark as completed
      await SessionService.completeSession(session.id);
      
      setSession(prev => prev ? { ...prev, status: 'completed' } : prev);
      console.log('🏁 FINISH: Session completed successfully');
    } catch (error) {
      console.error('Failed to finish session:', error);
    }
  };

  const handleExit = async () => {
    console.log('🚪 EXIT: User exiting test, saving any unsaved responses');
    console.log('🚪 EXIT: Current session status:', session?.status);
    console.log('🚪 EXIT: Session ID:', session?.id);
    
    // Only save progress if not in review mode (review mode should be read-only)
    if (session?.status !== 'review') {
      await saveProgress();
      console.log('🚪 EXIT: Final save complete, navigating to correct page');
    } else {
      console.log('🚪 EXIT: Skipping save in review mode, navigating to correct page');
    }
    
    // Navigate to the correct page based on test type
    if (testType === 'diagnostic') {
      navigate('/dashboard/diagnostic');
    } else if (testType === 'practice') {
      navigate('/dashboard/practice-tests');
    } else if (testType === 'drill') {
      navigate('/dashboard/drill');
    } else {
      // Fallback to general dashboard
      navigate('/dashboard');
    }
  };

  const handleBackToDashboard = () => {
    console.log('🏠 DASHBOARD: Navigating back to dashboard from:', session?.status);
    console.log('🏠 DASHBOARD: Session ID:', session?.id);
    
    // Navigate to the correct page based on test type
    if (testType === 'diagnostic') {
      navigate('/dashboard/diagnostic');
    } else if (testType === 'practice') {
      navigate('/dashboard/practice-tests');
    } else if (testType === 'drill') {
      navigate('/dashboard/drill');
    } else {
      // Fallback to general dashboard
      navigate('/dashboard');
    }
  };

  const handleReview = () => {
    if (!session) return;
    setSession(prev => prev ? { ...prev, status: 'review' } : prev);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-edu-teal mx-auto mb-4"></div>
          <p className="text-gray-600">Loading test...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 max-w-md">
          <CardContent className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error Loading Test</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => navigate('/dashboard/diagnostic')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  // Completed state
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
              <h1 className="text-3xl font-bold text-edu-navy mb-2">Test Completed!</h1>
              <p className="text-edu-navy/70 mb-6">{session.sectionName}</p>
              
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

  // Review mode
  if (session.status === 'review') {
    return (
      <EnhancedTestInterface
        questions={session.questions}
        currentQuestionIndex={session.currentQuestion}
        onAnswer={handleAnswer}
        onTextAnswer={handleTextAnswer}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onJumpToQuestion={handleJumpToQuestion}
        onFlag={handleFlag}
        answers={session.answers}
        textAnswers={session.textAnswers}
        flaggedQuestions={session.flaggedQuestions}
        showFeedback={true}
        isReviewMode={true}
        testTitle={`${session.sectionName} - Review`}
        onFinish={handleBackToDashboard}
        onExit={handleBackToDashboard}
      />
    );
  }

  // Main test interface
  return (
    <EnhancedTestInterface
      questions={session.questions}
      currentQuestionIndex={session.currentQuestion}
      timeRemaining={timeRemaining}
      onAnswer={handleAnswer}
      onTextAnswer={handleTextAnswer}
      onNext={handleNext}
      onPrevious={handlePrevious}
      onJumpToQuestion={handleJumpToQuestion}
      onFlag={handleFlag}
      answers={session.answers}
      textAnswers={session.textAnswers}
      flaggedQuestions={session.flaggedQuestions}
      showFeedback={false}
      isReviewMode={false}
      testTitle={session.sectionName}
      onFinish={handleFinish}
      onExit={handleExit}
    />
  );
};

export default TestTaking;