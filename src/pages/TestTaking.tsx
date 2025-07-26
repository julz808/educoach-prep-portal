import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowLeft, AlertCircle } from 'lucide-react';
import { useProduct } from '@/context/ProductContext';
import { useAuth } from '@/context/AuthContext';
import { PaywallComponent } from '@/components/PaywallComponent';
import { isPaywallUIEnabled } from '@/config/stripeConfig';
import { EnhancedTestInterface } from '@/components/EnhancedTestInterface';
import { 
  fetchDiagnosticModes,
  fetchDrillModes,
  fetchQuestionsFromSupabase,
  type OrganizedQuestion 
} from '@/services/supabaseQuestionService';
import { SessionService, type TestSession } from '@/services/sessionService';
import { TestSessionService } from '@/services/testSessionService';
import { DrillSessionService } from '@/services/drillSessionService';
import { WritingAssessmentService } from '@/services/writingAssessmentService';
import { ScoringService } from '@/services/scoringService';
import { DeveloperToolsReplicaService } from '@/services/developerToolsReplicaService';
import { supabase } from '@/integrations/supabase/client';
import { TEST_STRUCTURES } from '@/data/curriculumData';
import { calculateTimeAllocation, shouldShowImmediateAnswerFeedback, shouldHaveTimer } from '@/utils/timeAllocation';
import { getOrCreateSubSkillUUID } from '@/utils/uuidUtils';

// Map frontend course IDs back to proper display names (same as in TestInstructionsPage)
const PRODUCT_DISPLAY_NAMES: Record<string, string> = {
  'year-5-naplan': 'Year 5 NAPLAN',
  'year-7-naplan': 'Year 7 NAPLAN',
  'acer-scholarship': 'ACER Scholarship (Year 7 Entry)',
  'acer-year-7': 'ACER Scholarship (Year 7 Entry)',
  'edutest-scholarship': 'EduTest Scholarship (Year 7 Entry)',
  'edutest-year-7': 'EduTest Scholarship (Year 7 Entry)',
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
  maxPoints: number; // Maximum points for this question (1 for MC, varies for writing)
}

// Map frontend product IDs to database product_type values
const getDbProductType = (productId: string): string => {
  const productMap: Record<string, string> = {
    'vic-selective': 'VIC Selective Entry (Year 9 Entry)',
    'nsw-selective': 'NSW Selective Entry (Year 7 Entry)',
    'year-5-naplan': 'Year 5 NAPLAN',
    'year-7-naplan': 'Year 7 NAPLAN',
    'edutest-year-7': 'EduTest Scholarship (Year 7 Entry)',
    'acer-year-7': 'ACER Scholarship (Year 7 Entry)'
  };
  return productMap[productId] || productId;
};

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
  const { testType, subjectId, sectionId, sessionId } = useParams<{ 
    testType: string; 
    subjectId: string; 
    sectionId?: string;
    sessionId?: string;
  }>();
  
  // Handle the case where sessionId might be in the sectionId parameter
  // This happens when the URL is /test/practice/subjectId/sessionId (3 params)
  // instead of /test/practice/subjectId/sectionId/sessionId (4 params)
  // Also check for sessionId in query parameters (for drill sessions)
  const [searchParams, setSearchParams] = useSearchParams();
  const sessionIdFromQuery = searchParams.get('sessionId');
  const testModeFromQuery = searchParams.get('testMode'); // Get specific practice test mode
  
  // Also check current URL directly in case searchParams is stale
  const urlSessionId = new URLSearchParams(window.location.search).get('sessionId');
  const actualSessionId = urlSessionId || sessionIdFromQuery || sessionId || sectionId;
  
  console.log('🔍 SESSION-ID-DEBUG: searchParams sessionId:', sessionIdFromQuery);
  console.log('🔍 SESSION-ID-DEBUG: URL sessionId:', urlSessionId);
  console.log('🔍 SESSION-ID-DEBUG: Final actualSessionId:', actualSessionId);
  const navigate = useNavigate();
  const { selectedProduct, currentProduct, hasAccessToCurrentProduct } = useProduct();
  const { user } = useAuth();

  // Check if paywall should be shown
  if (isPaywallUIEnabled() && !hasAccessToCurrentProduct && currentProduct) {
    return (
      <div className="min-h-screen bg-edu-light-blue">
        <PaywallComponent 
          product={currentProduct} 
          className="min-h-screen"
        />
      </div>
    );
  }
  
  // Determine the actual test mode to use for database operations
  const actualTestMode = testModeFromQuery || testType;
  console.log('🔍 TEST MODE: URL testType:', testType, 'Query testMode:', testModeFromQuery, 'Final testMode:', actualTestMode);
  console.log('🔍 TEST MODE: Full URL:', window.location.href);
  console.log('🔍 TEST MODE: All search params:', Object.fromEntries(searchParams));
  
  console.log('🔗 URL PARAMS: testType:', testType, 'subjectId:', subjectId, 'sectionId:', sectionId, 'sessionId:', sessionId);
  console.log('🔗 QUERY PARAMS: sessionId:', sessionIdFromQuery);
  console.log('🔗 ACTUAL SESSION ID:', actualSessionId);
  console.log('🔗 CURRENT URL:', window.location.href);
  
  const [session, setSession] = useState<TestSessionState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [initializing, setInitializing] = useState(false);
  const initializingRef = useRef(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [isProcessingWriting, setIsProcessingWriting] = useState(false);
  const [writingProcessingStatus, setWritingProcessingStatus] = useState<string>('');
  const [testScore, setTestScore] = useState<any>(null);
  const [calculatingScore, setCalculatingScore] = useState(false);
  const textAutoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const periodicSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTextChangeTimeRef = useRef<number>(0);

  const sectionName = searchParams.get('sectionName') || '';
  const isReviewMode = searchParams.get('review') === 'true';

  // Calculate test score when entering review mode
  useEffect(() => {
    const calculateReviewScore = async () => {
      if (session && session.status === 'review' && !testScore && !calculatingScore) {
        try {
          setCalculatingScore(true);
          console.log('📊 REVIEW: Calculating test score for review mode');
          console.log('📊 REVIEW: Questions:', session.questions.map(q => ({ id: q.id, maxPoints: q.maxPoints, subSkill: q.subSkill })));
          console.log('📊 REVIEW: Answers:', session.answers);
          console.log('📊 REVIEW: Text answers:', session.textAnswers);
          
          const reviewScore = await ScoringService.calculateTestScore(
            session.questions,
            session.answers,
            session.textAnswers,
            session.id
          );
          setTestScore(reviewScore);
          console.log('📊 REVIEW: Score calculated:', reviewScore);
        } catch (error) {
          console.error('📊 REVIEW: Failed to calculate score:', error);
        } finally {
          setCalculatingScore(false);
        }
      }
    };

    calculateReviewScore();
  }, [session?.status, session?.id, testScore]);
  
  console.log('🔍 REVIEW MODE: isReviewMode =', isReviewMode, 'from searchParams.review =', searchParams.get('review'));

  // Get time limit using new time allocation system
  // NEW TIME ALLOCATION RULES:
  // - Practice tests: Use curriculumData.ts times
  // - Diagnostic tests: Pro-rate from practice, round up to nearest 5 min
  // - Drill tests: No timer (null), immediate answer reveal
  const getTimeAllocation = (productType: string, sectionName: string, testMode: string, questionCount?: number): { timeMinutes: number | null; reason: string } => {
    console.log('⏰ TIME ALLOCATION: Getting time for:', { productType, sectionName, testMode, questionCount });
    
    return calculateTimeAllocation(productType, sectionName, testMode, questionCount);
  };

  // Load questions for the section
  const loadQuestions = async (): Promise<Question[]> => {
    if (testType === 'diagnostic') {
      console.log('🔍 DIAGNOSTIC LOAD: Starting question load for subjectId:', subjectId, 'sectionName:', sectionName);
      const diagnosticModes = await fetchDiagnosticModes(selectedProduct);
      console.log('🔍 DIAGNOSTIC LOAD: Fetched diagnostic modes:', diagnosticModes.length);
      
      // Find the section containing questions
      let foundSection = null;
      for (const mode of diagnosticModes) {
        console.log('🔍 DIAGNOSTIC LOAD: Checking mode:', mode.name, 'with sections:', mode.sections.map(s => s.id + ' (' + s.name + ')'));
        foundSection = mode.sections.find(section => 
          section.id === subjectId || 
          section.name.toLowerCase().includes(subjectId.toLowerCase())
        );
        if (foundSection) {
          console.log('🔍 DIAGNOSTIC LOAD: Found section:', foundSection.name, 'with', foundSection.questions.length, 'questions');
          break;
        }
      }

      if (!foundSection || foundSection.questions.length === 0) {
        console.error('🔍 DIAGNOSTIC LOAD: No section found! Available sections:', 
          diagnosticModes.flatMap(m => m.sections).map(s => ({ id: s.id, name: s.name, questions: s.questions.length }))
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
        format: questionFormat,
        maxPoints: q.maxPoints || 1 // Add maxPoints with default of 1
      }));
    } else if (testType === 'practice') {
      console.log('🔍 Practice: Loading practice questions for product:', selectedProduct, 'subjectId:', subjectId);
      console.log('🔍 Practice: Section name from params:', sectionName);
      
      const organizedData = await fetchQuestionsFromSupabase();
      console.log('🔍 Practice: Available test types:', organizedData.testTypes.map(tt => tt.id));
      
      const currentTestType = organizedData.testTypes.find(tt => tt.id === selectedProduct);
      
      if (!currentTestType) {
        console.error('🔍 Practice: No test type found for product:', selectedProduct);
        throw new Error('No test data found for this product');
      }
      
      console.log('🔍 Practice: Found test type with modes:', currentTestType.testModes.map(tm => ({ id: tm.id, name: tm.name, sections: tm.sections.length })));

      // Find the section in the SPECIFIC practice mode requested (actualTestMode)
      let foundSection = null;
      const targetTestMode = currentTestType.testModes.find(mode => mode.id === actualTestMode);
      
      if (targetTestMode) {
        console.log('🔍 Loading specific practice mode:', targetTestMode.name, 'with', targetTestMode.sections.length, 'sections');
        foundSection = targetTestMode.sections.find(section => 
          section.id === subjectId || 
          section.name.toLowerCase().includes(subjectId.toLowerCase()) ||
          subjectId.toLowerCase().includes(section.name.toLowerCase())
        );
        if (foundSection && foundSection.questions.length > 0) {
          console.log('✅ Found section in specific practice mode:', targetTestMode.name, 'section:', foundSection.name, 'questions:', foundSection.questions.length);
        }
      } else {
        console.error('🔍 Practice: Target test mode not found:', actualTestMode);
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
        format: questionFormat,
        maxPoints: q.maxPoints || 1 // Add maxPoints with default of 1
      }));
    } else if (testType === 'drill') {
      console.log('🔧 DRILL: Loading drill questions for product:', selectedProduct, 'subjectId:', subjectId);
      
      const drillModes = await fetchDrillModes(selectedProduct);
      console.log('🔧 DRILL: Available drill modes:', drillModes.map(dm => dm.name));
      
      // Find the section containing questions by subjectId or sectionName
      let foundSection = null;
      for (const mode of drillModes) {
        foundSection = mode.sections.find(section => {
          // First try exact matches
          if (section.id === subjectId || section.name === sectionName) {
            return true;
          }
          
          // Then try case-insensitive matches
          const sectionNameLower = section.name.toLowerCase();
          const subjectIdLower = subjectId.toLowerCase();
          const sectionNameFromParams = sectionName.toLowerCase();
          
          // Remove special characters and normalize for comparison
          const normalizeString = (str: string) => str.replace(/[-_\s]+/g, ' ').trim();
          
          const normalizedSectionName = normalizeString(sectionNameLower);
          const normalizedSubjectId = normalizeString(subjectIdLower);
          const normalizedSectionNameFromParams = normalizeString(sectionNameFromParams);
          
          return normalizedSectionName === normalizedSubjectId ||
                 normalizedSectionName === normalizedSectionNameFromParams ||
                 normalizedSectionName.includes(normalizedSubjectId) ||
                 normalizedSubjectId.includes(normalizedSectionName) ||
                 normalizedSectionName.includes(normalizedSectionNameFromParams) ||
                 normalizedSectionNameFromParams.includes(normalizedSectionName);
        });
        
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

      // Convert questions to our format and determine if this is a writing drill
      const isWritingDrill = sectionName.toLowerCase().includes('writing') || 
                             sectionName.toLowerCase().includes('written') || 
                             sectionName.toLowerCase().includes('expression');
      
      // Determine maxPoints based on product type for writing drills
      const getMaxPointsForWriting = (productType: string): number => {
        const dbProductType = getDbProductType(selectedProduct);
        switch (dbProductType) {
          case 'VIC Selective Entry (Year 9 Entry)': return 30;
          case 'NSW Selective Entry (Year 7 Entry)': return 50;
          case 'Year 5 NAPLAN':
          case 'Year 7 NAPLAN': return 48;
          case 'EduTest Scholarship (Year 7 Entry)': return 15;
          case 'ACER Scholarship (Year 7 Entry)': return 20;
          default: return 30;
        }
      };
      
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
        format: isWritingDrill ? 'Written Response' as const : 'Multiple Choice' as const,
        maxPoints: isWritingDrill ? getMaxPointsForWriting(selectedProduct) : 1
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

  // Load drill session from drill_sessions table
  const loadDrillSession = async (sessionId: string) => {
    console.log('🎯 DRILL: Loading drill session using DrillSessionService:', sessionId);
    
    try {
      console.log('🎯 DRILL: Calling DrillSessionService.getSessionForResume with:', sessionId);
      const drillSessionData = await DrillSessionService.getSessionForResume(sessionId);
      console.log('🎯 DRILL: DrillSessionService returned:', drillSessionData);
      
      if (!drillSessionData) {
        console.log('🎯 DRILL: No drill session found:', sessionId);
        return null;
      }

      console.log('🎯 DRILL: Drill session data loaded:', {
        questionsTotal: drillSessionData.questionsTotal,
        questionsAnswered: drillSessionData.questionsAnswered,
        questionsCorrect: drillSessionData.questionsCorrect,
        status: drillSessionData.status,
        sessionCompleteRatio: `${drillSessionData.questionsAnswered}/${drillSessionData.questionsTotal}`
      });

      // Get the skill name from URL parameters for a better display name
      const skillName = searchParams.get('skill') || 'Drill Practice';
      
      // Convert drill session to TestSession format
      console.log('🎯 DRILL: Raw drill session answers data:', drillSessionData.answersData);
      console.log('🎯 DRILL: Drill session status:', drillSessionData.status);
      console.log('🎯 DRILL: Questions answered/total:', drillSessionData.questionsAnswered, '/', drillSessionData.questionsTotal);
      
      const drillSession: TestSession = {
        id: drillSessionData.sessionId,
        userId: drillSessionData.userId,
        productType: drillSessionData.productType,
        testMode: 'drill',
        sectionName: skillName, // Use the readable skill name instead of UUID
        currentQuestionIndex: drillSessionData.questionsAnswered || 0,
        answers: drillSessionData.answersData || {},
        textAnswers: drillSessionData.textAnswersData || {},
        flaggedQuestions: [],
        timeRemainingSeconds: 1800, // Default 30 minutes for drills
        totalQuestions: drillSessionData.questionsTotal || 0,
        status: drillSessionData.status === 'completed' ? 'completed' : 'active',
        createdAt: drillSessionData.startedAt,
        updatedAt: drillSessionData.startedAt
      };

      console.log('🎯 DRILL: Converted drill session:', drillSession);
      return drillSession;
    } catch (error) {
      console.error('🎯 DRILL: Error loading drill session:', error);
      return null;
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

        console.log('🚀 Initializing session with params:', { testType, subjectId, sessionId, actualSessionId, sectionName });
        console.log('🚀 Selected product:', selectedProduct);

        const questions = await loadQuestions();
        
        // If we have a sessionId, try to resume
        console.log('🔍 CONDITIONAL-DEBUG: Checking actualSessionId for resume...', {
          actualSessionId,
          type: typeof actualSessionId,
          truthy: !!actualSessionId,
          length: actualSessionId?.length,
          isEmpty: actualSessionId === '',
          isUndefined: actualSessionId === undefined,
          isNull: actualSessionId === null
        });
        
        if (actualSessionId) {
          console.log('🔄 Attempting to resume session:', actualSessionId, 'for testType:', testType);
          console.log('🔄 Is drill session?', testType === 'drill');
          console.log('🔄 CRITICAL: actualSessionId value and type:', actualSessionId, typeof actualSessionId);
          
          // Check if this is a writing drill - writing drills use TestSessionService like diagnostic/practice
          const isWritingDrillForResume = testType === 'drill' && (
            sectionName.toLowerCase().includes('writing') ||
            sectionName.toLowerCase().includes('written') ||
            sectionName.toLowerCase().includes('expression')
          );
          
          console.log('🔄 Is writing drill for resume?', isWritingDrillForResume);
          
          // Load session based on test type and drill type
          console.log('🔄 LOAD-DEBUG: About to load session...', {
            testType,
            isWritingDrillForResume,
            actualSessionId,
            loadMethod: (testType === 'drill' && !isWritingDrillForResume) ? 'loadDrillSession' : 'SessionService.loadSession'
          });
          
          const savedSession = (testType === 'drill' && !isWritingDrillForResume) ? 
            await loadDrillSession(actualSessionId) : 
            await SessionService.loadSession(actualSessionId);
            
          console.log('🔄 Session loaded result:', savedSession);
          console.log('🔄 LOAD-DEBUG: Session load completed:', {
            found: !!savedSession,
            sessionId: savedSession?.id,
            status: savedSession?.status,
            actualSessionIdUsed: actualSessionId
          });
          console.log('🔄 RESUME: Session loaded?', !!savedSession);
          console.log('🔄 RESUME: Session answers:', savedSession?.answers);
          console.log('🔄 RESUME: Session status:', savedSession?.status);
          
          if (savedSession) {
            console.log('🔄 RESUME: Found existing session, proceeding with resume...');
            console.log('🔄 RESUME: Loading saved session data:', {
              sessionId: savedSession.id,
              status: savedSession.status,
              currentQuestionIndex: savedSession.currentQuestionIndex,
              savedAnswers: Object.keys(savedSession.answers).length,
              savedTextAnswers: Object.keys(savedSession.textAnswers || {}).length,
              timeRemaining: savedSession.timeRemainingSeconds,
              rawAnswers: savedSession.answers,
              rawTextAnswers: savedSession.textAnswers
            });

            // Check if this is a completed session - if so, go to review mode
            console.log('🔄 RESUME: Checking session status for review mode...', {
              sessionId: savedSession.sessionId,
              status: savedSession.status,
              testMode: savedSession.testMode,
              sectionName: savedSession.sectionName,
              isWritingDrill: (savedSession.testMode === 'drill' && (
                savedSession.sectionName.toLowerCase().includes('writing') ||
                savedSession.sectionName.toLowerCase().includes('written') ||
                savedSession.sectionName.toLowerCase().includes('expression')
              ))
            });
            
            if (savedSession.status === 'completed') {
              console.log('🔄 RESUME: Session is completed, should go to review mode');
              console.log('🔄 RESUME: Setting review=true in URL...');
              // Set review mode in URL
              const currentUrl = new URL(window.location.href);
              currentUrl.searchParams.set('review', 'true');
              setSearchParams(new URLSearchParams(currentUrl.search), { replace: true });
            } else {
              console.log('🔄 RESUME: Session is not completed, status:', savedSession.status);
            }

            // Convert saved session to our format
            const answers: Record<number, number> = {};
            console.log('🔄 RESUME: Converting saved answers. Total questions loaded:', questions.length);
            console.log('🔄 RESUME: Saved answers to convert:', savedSession.answers);
            
            Object.entries(savedSession.answers).forEach(([qIndex, optionText]) => {
              // Both drill sessions and regular sessions use question index as key
              const questionIndex = parseInt(qIndex);
              const question = questions[questionIndex];
              
              console.log(`🔄 RESUME: Processing answer for question ${questionIndex}:`, {
                savedOptionText: optionText,
                questionExists: !!question,
                questionText: question?.text?.substring(0, 50) + '...',
                testType: testType
              });
              
              if (question && question.options && questionIndex >= 0) {
                let answerIndex = -1;
                
                // Handle different answer formats
                if (typeof optionText === 'number') {
                  // If optionText is already a number, use it directly as the answer index
                  answerIndex = optionText;
                  console.log('🔄 RESUME: Numeric answer used directly:', optionText, '→', answerIndex);
                } else if (testType === 'drill' && typeof optionText === 'string' && optionText.length === 1 && /[A-D]/.test(optionText)) {
                  // For drill sessions, optionText might be a letter (A, B, C, D)
                  answerIndex = optionText.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
                  console.log('🔧 DRILL: Letter answer conversion:', optionText, '→', answerIndex);
                } else {
                  // Try exact match first
                  answerIndex = question.options.findIndex(opt => opt === optionText);
                  console.log('🔄 RESUME: Exact match result:', answerIndex);
                  
                  // If no exact match, try trimmed comparison
                  if (answerIndex === -1) {
                    answerIndex = question.options.findIndex(opt => opt.trim() === optionText.trim());
                    console.log('🔄 RESUME: Trimmed match result:', answerIndex);
                  }
                }
                
                // If still no match, try case-insensitive
                if (answerIndex === -1) {
                  answerIndex = question.options.findIndex(opt => 
                    opt.toLowerCase().trim() === optionText.toLowerCase().trim()
                  );
                  console.log('🔄 RESUME: Case-insensitive match result:', answerIndex);
                }
                
                // If still no match, try removing letter prefixes (A), B), etc.)
                if (answerIndex === -1) {
                  const cleanedOptionText = optionText.replace(/^[A-Z]\)\s*/, '').trim();
                  answerIndex = question.options.findIndex(opt => 
                    opt.toLowerCase().trim() === cleanedOptionText.toLowerCase().trim()
                  );
                  console.log('🔄 RESUME: Cleaned option text match (removed A), B), etc.):', answerIndex, 'cleaned text:', cleanedOptionText);
                }
                
                // If still no match, try the other way - add letter prefixes to question options
                if (answerIndex === -1) {
                  answerIndex = question.options.findIndex((opt, idx) => {
                    const prefixedOption = `${String.fromCharCode(65 + idx)}) ${opt}`;
                    return prefixedOption.toLowerCase().trim() === optionText.toLowerCase().trim();
                  });
                  console.log('🔄 RESUME: Prefixed option match:', answerIndex);
                }
                
                if (answerIndex !== -1) {
                  answers[questionIndex] = answerIndex;
                  console.log('🔄 RESUME: ✅ Restored answer for question', questionIndex, '→', answerIndex, '(', optionText, ')');
                } else {
                  console.error('🔄 RESUME: ❌ Could not find answer for question', questionIndex);
                  console.error('🔄 RESUME: Saved text:', `"${optionText}"`);
                  console.error('🔄 RESUME: Available options:', question.options);
                  console.error('🔄 RESUME: Options with indices:', question.options.map((opt, idx) => `${idx}: "${opt}"`));
                  console.error('🔄 RESUME: Saved text length:', optionText.length);
                  console.error('🔄 RESUME: Option lengths:', question.options.map(opt => opt.length));
                }
              } else {
                console.warn('🔄 RESUME: ❌ Question', questionIndex, 'not found or has no options');
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
              timeLimit: savedSession.timeRemainingSeconds > 0 ? Math.ceil(savedSession.timeRemainingSeconds / 60) : 0,
              currentQuestion: isReviewMode ? 0 : savedSession.currentQuestionIndex, // Start from first question in review mode
              answers,
              textAnswers,
              flaggedQuestions: new Set(savedSession.flaggedQuestions.map(q => parseInt(q))),
              startTime: new Date(savedSession.createdAt),
              status: isReviewMode ? 'review' : (savedSession.status === 'completed' ? 'completed' : 'in-progress'),
              isResumed: true
            };
            
            console.log('🔄 RESUME: Final session state - currentQuestion:', resumedSession.currentQuestion, 'totalQuestions:', resumedSession.questions.length, 'isReviewMode:', isReviewMode);

            // Apply answers and text answers to questions
            console.log('🔄 RESUME: Applying answers to questions. Total answers restored:', Object.keys(resumedSession.answers).length);
            console.log('🔄 RESUME: Answers object:', resumedSession.answers);
            resumedSession.questions.forEach((question, index) => {
              if (resumedSession.answers[index] !== undefined) {
                question.userAnswer = resumedSession.answers[index];
                console.log(`🔄 RESUME: Applied answer to question ${index}: userAnswer = ${question.userAnswer}, option text = "${question.options[question.userAnswer]}"`);
              } else {
                console.log(`🔄 RESUME: No answer found for question ${index}`);
              }
              if (resumedSession.textAnswers[index] !== undefined) {
                question.userTextAnswer = resumedSession.textAnswers[index];
                console.log('🔄 RESUME: Applied text answer to question', index, '→', resumedSession.textAnswers[index].substring(0, 50) + '...');
              }
              question.flagged = resumedSession.flaggedQuestions.has(index);
              if (question.flagged) {
                console.log(`🔄 RESUME: Question ${index} is flagged`);
              }
            });
            console.log('🔄 RESUME: Final session state:', {
              totalQuestions: resumedSession.questions.length,
              answersRestored: Object.keys(resumedSession.answers).length,
              questionsWithUserAnswer: resumedSession.questions.filter(q => q.userAnswer !== undefined).length
            });

            setSession(resumedSession);
            setTimeRemaining(savedSession.timeRemainingSeconds);
            
            // Ensure URL has session ID for future resumes
            if (!searchParams.get('sessionId')) {
              const newSearchParams = new URLSearchParams(searchParams);
              newSearchParams.set('sessionId', actualSessionId);
              setSearchParams(newSearchParams, { replace: true });
              console.log('🔗 URL-UPDATE: Added sessionId to initial resume URL via setSearchParams:', actualSessionId);
            }
            
            console.log('✅ RESUME: Session resumed successfully with:', {
              currentQuestion: resumedSession.currentQuestion,
              answersRestored: Object.keys(resumedSession.answers).length,
              textAnswersRestored: Object.keys(resumedSession.textAnswers).length,
              timeRemaining: savedSession.timeRemainingSeconds
            });
            console.log('🔍 DEBUG: Questions maxPoints:', resumedSession.questions.map(q => ({ 
              id: q.id, 
              maxPoints: q.maxPoints, 
              subSkill: q.subSkill, 
              topic: q.topic 
            })));
            return;
          } else {
            console.log('🔄 RESUME: No existing session found for ID:', actualSessionId, 'proceeding to create new session');
          }
        } else {
          console.log('🔄 RESUME: No sessionId provided, creating new session');
          console.log('🔍 ELSE-DEBUG: actualSessionId in else block:', {
            actualSessionId,
            type: typeof actualSessionId,
            truthy: !!actualSessionId,
            comparison: actualSessionId === undefined || actualSessionId === null || actualSessionId === ''
          });
        }

        // Create new session (or get existing active session)
        console.log('🆕 Creating/getting session');
        const properDisplayName = PRODUCT_DISPLAY_NAMES[selectedProduct] || selectedProduct;
        console.log('🆕 TIMER: selectedProduct =', selectedProduct);
        console.log('🆕 TIMER: properDisplayName =', properDisplayName);
        console.log('🆕 TIMER: sectionName =', sectionName);
        
        const timeAllocation = getTimeAllocation(properDisplayName, sectionName, actualTestMode, questions.length);
        const timeLimitMinutes = timeAllocation.timeMinutes;
        const timeLimitSeconds = timeLimitMinutes ? timeLimitMinutes * 60 : 0;
        
        console.log('⏰ TIME ALLOCATION: Result:', timeAllocation);
        console.log('⏰ TIME ALLOCATION: Final time limit =', timeLimitMinutes, 'minutes (', timeLimitSeconds, 'seconds)');
        
        console.log('🆕 TIMER: Calculated time limit =', timeLimitMinutes, 'minutes (', timeLimitSeconds, 'seconds)');
        
        let sessionIdToUse: string;
        let existingSession: any = null;

        // Check if this is a writing drill - writing drills MUST use TestSessionService 
        // because writing_assessments table has foreign key to user_test_sessions
        const isWritingDrill = testType === 'drill' && (
          sectionName.toLowerCase().includes('writing') ||
          sectionName.toLowerCase().includes('written') ||
          sectionName.toLowerCase().includes('expression') ||
          questions.some(q => q.format === 'Written Response' || q.format === 'extended_response')
        );
        
        if (testType === 'drill' && !isWritingDrill) {
          // For NON-WRITING drill sessions, use DrillSessionService
          const subSkillText = questions[0]?.subSkill || sectionName;
          const firstQuestionWithUUID = questions.find(q => q.subSkillId && q.subSkillId.trim() !== '');
          
          const actualSubSkillId = getOrCreateSubSkillUUID(subSkillText, firstQuestionWithUUID?.subSkillId);
          console.log('🎯 DRILL: SubSkill UUID for', subSkillText, '→', actualSubSkillId);
          
          const difficulty = parseInt(searchParams.get('difficulty') === 'easy' ? '1' : 
                                   searchParams.get('difficulty') === 'medium' ? '2' : '3');
          
          console.log('🎯 DRILL: Creating/resuming NON-WRITING drill session:', {
            subSkillId: actualSubSkillId,
            difficulty,
            productType: properDisplayName,
            questionCount: questions.length
          });
          
          sessionIdToUse = await DrillSessionService.createOrResumeSession(
            user.id,
            actualSubSkillId,
            properDisplayName,
            difficulty,
            questions.map(q => q.id),
            questions.length
          );
          
          // Check if this is actually resuming an existing drill session
          existingSession = await loadDrillSession(sessionIdToUse);
        } else {
          // For regular sessions (diagnostic/practice) AND writing drills, use TestSessionService
          console.log('🚀 SESSION-CREATE: Using TestSessionService for:', isWritingDrill ? 'WRITING DRILL' : testType.toUpperCase());
          
          // WRITING DRILL FIX: For writing drills, check for existing sessions by sub-skill/difficulty first
          if (isWritingDrill) {
            console.log('🔍 WRITING-DRILL-CHECK: Checking for existing writing drill sessions before creating new one...');
            
            // Query user_test_sessions for existing sessions with same sub-skill
            const { data: existingSessions, error: queryError } = await supabase
              .from('user_test_sessions')
              .select('id, status, section_name, created_at')
              .eq('user_id', user.id)
              .eq('product_type', properDisplayName)
              .eq('test_mode', actualTestMode)
              .eq('section_name', sectionName)
              .order('created_at', { ascending: false });
            
            if (queryError) {
              console.error('🔍 WRITING-DRILL-CHECK: Error querying existing sessions:', queryError);
            } else if (existingSessions && existingSessions.length > 0) {
              const mostRecentSession = existingSessions[0];
              console.log('🔍 WRITING-DRILL-CHECK: Found existing sessions:', existingSessions.map(s => ({
                id: s.id,
                status: s.status,
                created_at: s.created_at
              })));
              console.log('🔍 WRITING-DRILL-CHECK: Using most recent session:', mostRecentSession.id, 'status:', mostRecentSession.status);
              
              sessionIdToUse = mostRecentSession.id;
              
              // If the session is completed, we should go to review mode
              if (mostRecentSession.status === 'completed') {
                console.log('🔍 WRITING-DRILL-CHECK: Most recent session is completed, should go to review mode');
                const currentUrl = new URL(window.location.href);
                currentUrl.searchParams.set('review', 'true');
                setSearchParams(new URLSearchParams(currentUrl.search), { replace: true });
              }
            } else {
              console.log('🔍 WRITING-DRILL-CHECK: No existing sessions found, will create new one');
              sessionIdToUse = await TestSessionService.createOrResumeSession(
                user.id,
                properDisplayName,
                actualTestMode as 'diagnostic' | 'practice' | 'drill',
                sectionName,
                questions.length,
                questions.map(q => q.id)
              );
            }
          } else {
            // Regular diagnostic/practice sessions
            sessionIdToUse = await TestSessionService.createOrResumeSession(
              user.id,
              properDisplayName, // Use mapped product type, not raw selectedProduct
              actualTestMode as 'diagnostic' | 'practice' | 'drill', // Use specific test mode (practice_1, practice_2, etc.)
              sectionName,
              questions.length,
              questions.map(q => q.id)
            );
          }
          
          console.log('✅ SESSION-CREATE: Session ID determined:', sessionIdToUse);
            
            if (!sessionIdToUse) {
              throw new Error('Session creation returned undefined');
            }
          } catch (sessionError) {
            console.error('❌ SESSION-CREATE: Failed to create session:', sessionError);
            console.error('❌ SESSION-CREATE: Error details:', {
              message: sessionError instanceof Error ? sessionError.message : 'Unknown error',
              stack: sessionError instanceof Error ? sessionError.stack : 'No stack trace',
              userId: user.id,
              productType: properDisplayName,
              testMode: actualTestMode,
              sectionName
            });
            throw new Error(`Failed to create test session: ${sessionError instanceof Error ? sessionError.message : 'Unknown error'}`);
          }

          // Check if this is actually resuming an existing session
          existingSession = await SessionService.loadSession(sessionIdToUse);
        }
        
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
            timeLimit: existingSession.timeRemainingSeconds > 0 ? Math.ceil(existingSession.timeRemainingSeconds / 60) : 0,
            currentQuestion: isReviewMode ? 0 : existingSession.currentQuestionIndex, // Start from first question in review mode
            answers,
            textAnswers,
            flaggedQuestions: new Set(existingSession.flaggedQuestions.map(q => parseInt(q))),
            startTime: new Date(existingSession.createdAt),
            status: isReviewMode ? 'review' : (existingSession.status === 'completed' ? 'completed' : 'in-progress'),
            isResumed: true
          };
          
          console.log('🔄 RESUME-CREATE: Final session state - currentQuestion:', resumedSession.currentQuestion, 'totalQuestions:', resumedSession.questions.length, 'isReviewMode:', isReviewMode);

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
          
          // Ensure URL has session ID for future resumes
          if (!searchParams.get('sessionId')) {
            const newSearchParams = new URLSearchParams(searchParams);
            newSearchParams.set('sessionId', sessionIdToUse);
            setSearchParams(newSearchParams, { replace: true });
            console.log('🔗 URL-UPDATE: Added sessionId to resumed session URL via setSearchParams:', sessionIdToUse);
          }
          
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
          timeLimit: timeLimitMinutes || 0,
          currentQuestion: 0,
          answers: {},
          textAnswers: {},
          flaggedQuestions: new Set(),
          startTime: new Date(),
          status: isReviewMode ? 'review' : 'in-progress'
        };

        setSession(newSession);
        setTimeRemaining(timeLimitSeconds || 0);
        console.log('✅ NEW: New session created with', timeLimitMinutes, 'minute time limit (', timeLimitSeconds, 'seconds)');
        
        // Update URL with session ID so it can be resumed
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set('sessionId', sessionIdToUse);
        setSearchParams(newSearchParams, { replace: true });
        console.log('🔗 URL-UPDATE: Added sessionId to URL via setSearchParams:', sessionIdToUse);
        console.log('🔍 DEBUG: New session questions maxPoints:', newSession.questions.map(q => ({ 
          id: q.id, 
          maxPoints: q.maxPoints, 
          subSkill: q.subSkill, 
          topic: q.topic 
        })));

      } catch (err) {
        console.error('Error initializing session:', err);
        console.error('Error details:', {
          message: err instanceof Error ? err.message : 'Unknown error',
          stack: err instanceof Error ? err.stack : 'No stack trace',
          testType,
          subjectId,
          sessionId: actualSessionId,
          selectedProduct,
          sectionName
        });
        setError(err instanceof Error ? err.message : 'Failed to initialize session');
      } finally {
        setLoading(false);
        setInitializing(false);
        initializingRef.current = false;
      }
    };

    initializeSession();
  }, [testType, subjectId, actualSessionId, searchParams, selectedProduct, user]);

  // Auto-save progress
  const saveProgress = async (overrideSession?: TestSessionState) => {
    const sessionToUse = overrideSession || session;
    
    if (!sessionToUse || !user) {
      console.log('🚫 SAVE: Skipping save - no session or user');
      return;
    }

    console.log('💾 SAVE: Starting saveProgress for current state:', {
      sessionId: sessionToUse.id,
      currentQuestion: sessionToUse.currentQuestion,
      answersInState: Object.keys(sessionToUse.answers).length,
      textAnswersInState: Object.keys(sessionToUse.textAnswers).length,
      timeRemaining
    });

    try {
      // Convert answers to string format
      const stringAnswers: Record<string, string> = {};
      Object.entries(sessionToUse.answers).forEach(([qIndex, answerIndex]) => {
        const question = sessionToUse.questions[parseInt(qIndex)];
        if (question && question.options && question.options[answerIndex]) {
          stringAnswers[qIndex] = question.options[answerIndex];
          console.log('💾 SAVE: Converting answer for question', qIndex, ':', answerIndex, '->', question.options[answerIndex]);
        }
      });
      
      console.log('💾 SAVE: Total answers to save:', Object.keys(stringAnswers).length);
      console.log('💾 SAVE: Answers object:', stringAnswers);

      // Convert text answers to string format
      const stringTextAnswers: Record<string, string> = {};
      Object.entries(sessionToUse.textAnswers).forEach(([qIndex, textAnswer]) => {
        if (textAnswer && textAnswer.trim().length > 0) {
          stringTextAnswers[qIndex] = textAnswer;
          console.log('💾 SAVE: Converting text answer for question', qIndex, ':', textAnswer.substring(0, 50) + '...');
        }
      });

      const flaggedQuestions = Array.from(sessionToUse.flaggedQuestions).map(q => q.toString());

      // Use different save logic for drill vs regular sessions
      // EXCEPTION: Writing drills use TestSessionService like diagnostic/practice tests
      const isWritingDrill = sessionToUse.type === 'drill' && (
        sessionToUse.sectionName.toLowerCase().includes('writing') ||
        sessionToUse.sectionName.toLowerCase().includes('written') ||
        sessionToUse.sectionName.toLowerCase().includes('expression') ||
        sessionToUse.questions.some(q => q.format === 'Written Response' || q.format === 'extended_response')
      );
      
      if (sessionToUse.type === 'drill' && !isWritingDrill) {
        // For NON-WRITING drill sessions, use DrillSessionService
        const questionsAnswered = Object.keys(stringAnswers).length + Object.keys(stringTextAnswers).length;
        const questionsCorrect = Object.values(stringAnswers).filter((answer, index) => {
          const question = sessionToUse.questions[parseInt(Object.keys(stringAnswers)[index])];
          if (!question || !answer) return false;
          const answerIndex = answer.charCodeAt(0) - 65; // Convert A,B,C,D to 0,1,2,3
          return answerIndex === question.correctAnswer;
        }).length;
        
        console.log('💾 DRILL-SAVE: Updating drill session progress:');
        console.log('💾 DRILL-SAVE: - Session ID:', sessionToUse.id);
        console.log('💾 DRILL-SAVE: - Questions Answered:', questionsAnswered);
        console.log('💾 DRILL-SAVE: - Questions Correct:', questionsCorrect);
        console.log('💾 DRILL-SAVE: - Answers:', stringAnswers);
        console.log('💾 DRILL-SAVE: - Text Answers:', stringTextAnswers);

        await DrillSessionService.updateProgress(
          sessionToUse.id,
          questionsAnswered,
          questionsCorrect,
          stringAnswers,
          stringTextAnswers
        );
      } else {
        // For regular sessions (diagnostic/practice) AND writing drills, use SessionService
        console.log('💾 SAVE: About to save with SessionService.saveProgress:');
        console.log('💾 SAVE: - Session ID:', sessionToUse.id);
        console.log('💾 SAVE: - Current Question:', sessionToUse.currentQuestion);
        console.log('💾 SAVE: - String Answers:', stringAnswers);
        console.log('💾 SAVE: - String Text Answers:', stringTextAnswers);
        console.log('💾 SAVE: - Flagged Questions:', flaggedQuestions);
        console.log('💾 SAVE: - Time Remaining:', timeRemaining);

        await SessionService.saveProgress(
          sessionToUse.id,
          sessionToUse.currentQuestion,
          stringAnswers,
          flaggedQuestions,
          timeRemaining,
          stringTextAnswers
        );
      }

      console.log('✅ SAVE COMPLETE: Progress saved successfully');
    } catch (error) {
      console.error('❌ SAVE FAILED:', error);
    }
  };

  // Save strategy:
  // - Multiple choice: Save immediately after selection
  // - Written response: Save on next/exit only

  // Timer countdown - only for test modes that have timers
  useEffect(() => {
    if (!session || session.status !== 'in-progress') return;
    
    // Check if this test mode should have a timer
    if (!shouldHaveTimer(actualTestMode)) {
      console.log('⏰ TIMER: Skipping timer for drill mode');
      return;
    }

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
  }, [session?.status, actualTestMode]);

  // Page unload protection - save text answers before leaving
  useEffect(() => {
    const handleBeforeUnload = async (event: BeforeUnloadEvent) => {
      if (!session) return;
      
      // Check if there are unsaved text answers
      const hasUnsavedText = Object.values(session.textAnswers).some(text => 
        text && text.trim().length > 0
      );
      
      if (hasUnsavedText) {
        console.log('🚨 PAGE-UNLOAD: Saving text answers before page unload');
        
        // Clear any pending auto-save timeout
        if (textAutoSaveTimeoutRef.current) {
          clearTimeout(textAutoSaveTimeoutRef.current);
        }
        
        try {
          // Force immediate save
          await saveProgress(session);
          console.log('✅ PAGE-UNLOAD: Text answers saved successfully');
        } catch (error) {
          console.error('❌ PAGE-UNLOAD: Failed to save text answers:', error);
          // Show browser warning
          event.preventDefault();
          event.returnValue = 'You have unsaved writing. Are you sure you want to leave?';
          return 'You have unsaved writing. Are you sure you want to leave?';
        }
      }
    };

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden' && session) {
        // Page is being hidden (tab switch, minimized, etc.)
        const hasUnsavedText = Object.values(session.textAnswers).some(text => 
          text && text.trim().length > 0
        );
        
        if (hasUnsavedText) {
          console.log('👁️ VISIBILITY: Page hidden, saving text answers');
          
          // Clear any pending auto-save timeout
          if (textAutoSaveTimeoutRef.current) {
            clearTimeout(textAutoSaveTimeoutRef.current);
          }
          
          try {
            await saveProgress(session);
            console.log('✅ VISIBILITY: Text answers saved successfully');
          } catch (error) {
            console.error('❌ VISIBILITY: Failed to save text answers:', error);
          }
        }
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Clear any pending timeout and periodic interval
      if (textAutoSaveTimeoutRef.current) {
        clearTimeout(textAutoSaveTimeoutRef.current);
      }
      if (periodicSaveIntervalRef.current) {
        clearInterval(periodicSaveIntervalRef.current);
      }
    };
  }, [session]);

  const handleAnswer = (answerIndex: number) => {
    console.log('🎯 HANDLEANSWER: Function called with answerIndex:', answerIndex);
    
    if (!session) {
      console.log('🎯 HANDLEANSWER: No session, returning early');
      return;
    }
    
    console.log('📝 ANSWER: User selected answer', answerIndex, 'for question', session.currentQuestion);
    
    // Create the updated session state first
    const newAnswers = { ...session.answers };
    newAnswers[session.currentQuestion] = answerIndex;
    
    // Update the question's userAnswer
    const updatedQuestions = [...session.questions];
    updatedQuestions[session.currentQuestion].userAnswer = answerIndex;
    
    console.log('📝 ANSWER: Updated answers state:', newAnswers);
    console.log('📝 ANSWER: Updated question', session.currentQuestion, 'userAnswer to:', answerIndex);
    
    const updatedSession = {
      ...session,
      answers: newAnswers,
      questions: updatedQuestions
    };
    
    setSession(updatedSession);
    
    // Save immediately after multiple choice answer using the updated state
    console.log('💾 IMMEDIATE-SAVE: Starting immediate save for question', session.currentQuestion, 'answer', answerIndex);
    console.log('💾 IMMEDIATE-SAVE: Session ID:', updatedSession.id);
    console.log('💾 IMMEDIATE-SAVE: Session status:', updatedSession.status);
    console.log('💾 IMMEDIATE-SAVE: Is review mode?', isReviewMode);
    console.log('💾 IMMEDIATE-SAVE: New answers state:', newAnswers);
    console.log('💾 IMMEDIATE-SAVE: Updated session answers:', updatedSession.answers);
    
    // Don't save in review mode
    if (updatedSession.status === 'review' || isReviewMode) {
      console.log('💾 IMMEDIATE-SAVE: Skipping save in review mode');
      return;
    }
    
    // Use immediate async execution instead of setTimeout
    (async () => {
      try {
        console.log('💾 IMMEDIATE-SAVE: About to save immediately...');
        
        // Convert answers to string format using the updated state
        const stringAnswers: Record<string, string> = {};
        Object.entries(newAnswers).forEach(([qIndex, answerIdx]) => {
          const question = updatedSession.questions[parseInt(qIndex)];
          if (question && question.options && question.options[answerIdx]) {
            stringAnswers[qIndex] = question.options[answerIdx];
            console.log('💾 IMMEDIATE-SAVE: Converting answer for question', qIndex, ':', answerIdx, '->', question.options[answerIdx]);
          } else {
            console.warn('💾 IMMEDIATE-SAVE: Failed to convert answer for question', qIndex, 'answerIdx:', answerIdx, 'question exists:', !!question, 'has options:', !!(question?.options));
          }
        });
        
        console.log('💾 IMMEDIATE-SAVE: Total answers to save:', Object.keys(stringAnswers).length);
        console.log('💾 IMMEDIATE-SAVE: Answers object:', stringAnswers);

        if (Object.keys(stringAnswers).length === 0) {
          console.error('💾 IMMEDIATE-SAVE: ❌ NO ANSWERS TO SAVE! This is the problem.');
          console.error('💾 IMMEDIATE-SAVE: newAnswers:', newAnswers);
          console.error('💾 IMMEDIATE-SAVE: updatedSession.questions.length:', updatedSession.questions.length);
          return;
        }

        // Convert text answers to string format
        const stringTextAnswers: Record<string, string> = {};
        Object.entries(updatedSession.textAnswers).forEach(([qIndex, textAnswer]) => {
          if (textAnswer && textAnswer.trim().length > 0) {
            stringTextAnswers[qIndex] = textAnswer;
          }
        });

        const flaggedQuestions = Array.from(updatedSession.flaggedQuestions).map(q => q.toString());

        console.log('💾 IMMEDIATE-SAVE: About to call SessionService.saveProgress with:', {
          sessionId: updatedSession.id,
          currentQuestion: updatedSession.currentQuestion,
          stringAnswers,
          flaggedQuestions,
          timeRemaining,
          stringTextAnswers
        });

        // Use different save logic for drill vs regular sessions
        // EXCEPTION: Writing drills use TestSessionService like diagnostic/practice tests
        const isWritingDrill = updatedSession.type === 'drill' && (
          updatedSession.sectionName.toLowerCase().includes('writing') ||
          updatedSession.sectionName.toLowerCase().includes('written') ||
          updatedSession.sectionName.toLowerCase().includes('expression') ||
          updatedSession.questions.some(q => q.format === 'Written Response' || q.format === 'extended_response')
        );
        
        if (updatedSession.type === 'drill' && !isWritingDrill) {
          // For NON-WRITING drill sessions, update drill-specific progress
          const questionsAnswered = Object.keys(stringAnswers).length + Object.keys(stringTextAnswers).length;
          const questionsCorrect = Object.values(stringAnswers).filter((answer, index) => {
            const question = updatedSession.questions[parseInt(Object.keys(stringAnswers)[index])];
            const answerIndex = answer.charCodeAt(0) - 65; // Convert A,B,C,D to 0,1,2,3
            return answerIndex === question.correctAnswer;
          }).length;
          
          console.log('💾 DRILL-SAVE: Updating drill session progress:', {
            sessionId: updatedSession.id,
            questionsAnswered,
            questionsCorrect,
            answers: stringAnswers,
            textAnswers: stringTextAnswers
          });
          
          await DrillSessionService.updateProgress(
            updatedSession.id,
            questionsAnswered,
            questionsCorrect,
            stringAnswers,
            stringTextAnswers
          );
        } else {
          // For regular sessions (diagnostic/practice) AND writing drills, use existing logic
          await SessionService.saveProgress(
            updatedSession.id,
            updatedSession.currentQuestion,
            stringAnswers,
            flaggedQuestions,
            timeRemaining,
            stringTextAnswers
          );
        }

        console.log('✅ IMMEDIATE-SAVE COMPLETE: Progress saved successfully');
        
        // NOTE: Individual question attempts will be recorded during session completion
        // using the DeveloperToolsReplicaService to ensure insights compatibility
      } catch (error) {
        console.error('❌ IMMEDIATE-SAVE FAILED:', error);
        console.error('❌ IMMEDIATE-SAVE FAILED: Error details:', JSON.stringify(error, null, 2));
      }
    })(); // Immediate execution
  };

  const handleTextAnswer = useCallback((text: string) => {
    if (!session) return;
    
    console.log('📝 TEXT: User entered text for question', session.currentQuestion, ':', text.substring(0, 50) + '...');
    
    // Update last change time for periodic saving
    lastTextChangeTimeRef.current = Date.now();
    
    setSession(prev => {
      if (!prev) return prev;
      
      const newTextAnswers = { ...prev.textAnswers };
      newTextAnswers[prev.currentQuestion] = text;
      
      // Update the question's userTextAnswer
      const updatedQuestions = [...prev.questions];
      updatedQuestions[prev.currentQuestion].userTextAnswer = text;
      
      console.log('📝 TEXT: Updated text answers state:', newTextAnswers);
      
      const updatedSession = {
        ...prev,
        textAnswers: newTextAnswers,
        questions: updatedQuestions
      };
      
      // Clear existing timeout
      if (textAutoSaveTimeoutRef.current) {
        clearTimeout(textAutoSaveTimeoutRef.current);
      }
      
      // Set new debounced auto-save (save after 1 second of no typing)
      textAutoSaveTimeoutRef.current = setTimeout(async () => {
        console.log('💾 TEXT-AUTO-SAVE: Debounced save triggered for text answer');
        try {
          await saveProgress(updatedSession);
          console.log('✅ TEXT-AUTO-SAVE: Text answer saved successfully');
        } catch (error) {
          console.error('❌ TEXT-AUTO-SAVE: Failed to save text answer:', error);
        }
      }, 1000);
      
      // Start periodic saving if not already running
      if (!periodicSaveIntervalRef.current) {
        periodicSaveIntervalRef.current = setInterval(async () => {
          // Only save if there were recent changes (within last 6 seconds)
          const timeSinceLastChange = Date.now() - lastTextChangeTimeRef.current;
          if (timeSinceLastChange < 6000 && timeSinceLastChange > 1000) {
            console.log('💾 TEXT-PERIODIC-SAVE: Periodic save triggered');
            try {
              // Get current session state for periodic save
              setSession(currentSession => {
                if (currentSession) {
                  saveProgress(currentSession).then(() => {
                    console.log('✅ TEXT-PERIODIC-SAVE: Periodic save successful');
                  }).catch(error => {
                    console.error('❌ TEXT-PERIODIC-SAVE: Periodic save failed:', error);
                  });
                }
                return currentSession; // No state change
              });
            } catch (error) {
              console.error('❌ TEXT-PERIODIC-SAVE: Periodic save failed:', error);
            }
          }
        }, 5000); // Every 5 seconds
      }
      
      return updatedSession;
    });
  }, [session, saveProgress]);
  
  // Handle textarea blur event for immediate save
  const handleTextBlur = useCallback(async () => {
    if (!session) return;
    
    console.log('💾 TEXT-BLUR-SAVE: Textarea lost focus, saving immediately');
    
    // Clear any pending auto-save timeout since we're saving now
    if (textAutoSaveTimeoutRef.current) {
      clearTimeout(textAutoSaveTimeoutRef.current);
      textAutoSaveTimeoutRef.current = null;
    }
    
    try {
      await saveProgress(session);
      console.log('✅ TEXT-BLUR-SAVE: Text saved on blur successfully');
    } catch (error) {
      console.error('❌ TEXT-BLUR-SAVE: Failed to save text on blur:', error);
    }
  }, [session, saveProgress]);

  const handleNext = async () => {
    if (!session) return;
    
    // Check if current question is a written response - if so, save before moving
    const currentQuestion = session.questions[session.currentQuestion];
    const isWrittenResponse = currentQuestion?.format === 'Written Response';
    
    if (isWrittenResponse) {
      console.log('💾 NEXT-SAVE: Saving written response before moving to next question');
      await saveProgress(session); // Use current session state
      
      // ADDITIONALLY: Record individual written response attempt for insights (practice tests and drills)
      if (user && (session.type === 'practice' || session.type === 'drill')) {
        try {
          const textAnswer = session.textAnswers[session.currentQuestion];
          if (textAnswer && textAnswer.trim().length > 0) {
            console.log('📊 WRITTEN-ATTEMPT: Recording written response attempt for insights:', {
              questionId: currentQuestion.id,
              sessionId: session.id,
              textLength: textAnswer.length,
              subSkill: currentQuestion.subSkill,
              topic: currentQuestion.topic
            });
            
            // Record written response attempt to question_attempt_history table
            const { error: attemptError } = await supabase.rpc('save_question_attempt', {
              p_user_id: user.id,
              p_question_id: currentQuestion.id,
              p_session_id: session.id,
              p_user_answer: textAnswer.substring(0, 500), // Truncate if too long
              p_is_correct: false, // Will be determined by writing assessment later
              p_is_flagged: session.flaggedQuestions.has(session.currentQuestion),
              p_is_skipped: false,
              p_time_spent_seconds: 60
            });
            
            if (attemptError) {
              console.error('❌ WRITTEN-ATTEMPT: Error recording written response attempt:', attemptError);
            } else {
              console.log('✅ WRITTEN-ATTEMPT: Written response attempt recorded successfully');
            }
          }
        } catch (writtenAttemptError) {
          console.error('❌ WRITTEN-ATTEMPT: Failed to record written response attempt:', writtenAttemptError);
        }
      }
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
    
    console.log('🚩 FLAG: Flagging/unflagging question', questionIndex);
    
    setSession(prev => {
      if (!prev) return prev;
      const newFlagged = new Set(prev.flaggedQuestions);
      const updatedQuestions = [...prev.questions];
      
      if (newFlagged.has(questionIndex)) {
        newFlagged.delete(questionIndex);
        updatedQuestions[questionIndex].flagged = false;
        console.log('🚩 FLAG: Unflagged question', questionIndex);
      } else {
        newFlagged.add(questionIndex);
        updatedQuestions[questionIndex].flagged = true;
        console.log('🚩 FLAG: Flagged question', questionIndex);
      }
      
      const updatedSession = {
        ...prev,
        flaggedQuestions: newFlagged,
        questions: updatedQuestions
      };
      
      // Save progress after flagging to persist flag changes
      console.log('🚩 FLAG: Saving progress after flag change');
      setTimeout(async () => {
        try {
          await saveProgress(updatedSession);
          console.log('🚩 FLAG: Flag change saved successfully');
        } catch (error) {
          console.error('🚩 FLAG: Failed to save flag change:', error);
        }
      }, 100);
      
      return updatedSession;
    });
  };

  const handleFinish = () => {
    if (!session) return;
    
    // Show confirmation dialog
    setShowSubmitConfirm(true);
  };

  const handleConfirmSubmit = async () => {
    if (!session) return;

    try {
      console.log('🏁 FINISH: Saving final progress and completing session');
      setShowSubmitConfirm(false);
      
      // Save final progress with all latest responses
      await saveProgress(session); // Use current session state
      
      // Process any writing questions for assessment
      setIsProcessingWriting(true);
      setWritingProcessingStatus('Reviewing your writing responses...');
      await processWritingAssessments();
      
      // Mark as completed - use different logic for drill vs regular sessions
      // EXCEPTION: Writing drills use TestSessionService like diagnostic/practice tests
      setWritingProcessingStatus('Finalizing your results...');
      
      const isWritingDrill = session.type === 'drill' && (
        session.sectionName.toLowerCase().includes('writing') ||
        session.sectionName.toLowerCase().includes('written') ||
        session.sectionName.toLowerCase().includes('expression') ||
        session.questions.some(q => q.format === 'Written Response' || q.format === 'extended_response')
      );
      
      if (session.type === 'drill' && !isWritingDrill) {
        // For NON-WRITING drill sessions, complete using DrillSessionService
        const questionsAnswered = Object.keys(session.answers).length + 
          Object.values(session.textAnswers).filter(answer => answer && answer.trim().length > 0).length;
        
        // Count correct answers - need to handle writing questions differently
        let questionsCorrect = 0;
        
        // Count correct multiple choice answers
        questionsCorrect += Object.values(session.answers).filter((answer, index) => {
          const question = session.questions[parseInt(Object.keys(session.answers)[index])];
          // Handle both number and string answer formats
          let answerIndex: number;
          if (typeof answer === 'string') {
            answerIndex = answer.charCodeAt(0) - 65; // Convert A,B,C,D to 0,1,2,3
          } else {
            answerIndex = Number(answer); // Use numeric answer directly
          }
          return answerIndex === question.correctAnswer;
        }).length;
        
        // For writing questions, ALL attempted questions count as "correct" for drill progress
        // Progress tracking is about completion, not scoring
        const writingQuestionsAttempted = Object.values(session.textAnswers).filter(answer => answer && answer.trim().length > 0).length;
        questionsCorrect += writingQuestionsAttempted;
        
        console.log('🏁 DRILL-COMPLETE: Completing drill session:', {
          sessionId: session.id,
          questionsAnswered,
          questionsCorrect,
          textAnswersCount: Object.keys(session.textAnswers).length
        });
        
        // Convert answers to string format for database storage  
        const stringAnswers: Record<string, string> = {};
        Object.entries(session.answers).forEach(([qIndex, answerIndex]) => {
          const question = session.questions[parseInt(qIndex)];
          if (question && question.options && question.options[answerIndex]) {
            stringAnswers[qIndex] = question.options[answerIndex];
          }
        });
        
        // Convert textAnswers to string format for database storage
        const stringTextAnswers: Record<string, string> = {};
        Object.entries(session.textAnswers).forEach(([index, answer]) => {
          if (answer && answer.trim().length > 0) {
            stringTextAnswers[index] = answer;
          }
        });
        
        await DrillSessionService.completeSession(
          session.id,
          questionsAnswered,
          questionsCorrect,
          stringAnswers, // Use converted string answers
          stringTextAnswers
        );
      } else {
        // For regular sessions (diagnostic/practice) AND writing drills, use developer tools replica approach
        console.log('🎯 DEV-REPLICA: Using developer tools completion approach for insights compatibility');
        
        // Create the session structure in the exact format the replica service expects
        const sessionForReplica = {
          id: session.id,
          userId: user.id,
          productType: session.productType,
          testMode: actualTestMode, // diagnostic, practice_1, practice_2, etc.
          sectionName: session.sectionName,
          questions: session.questions,
          answers: session.answers,
          textAnswers: session.textAnswers,
          flaggedQuestions: session.flaggedQuestions
        };
        
        await DeveloperToolsReplicaService.completeSessionLikeDeveloperTools(sessionForReplica);
        
        // BRIDGE: For writing drills, also create a drill_sessions entry for progress tracking
        if (isWritingDrill) {
          console.log('🌉 WRITING-DRILL-BRIDGE: Creating drill_sessions entry for progress tracking');
          
          try {
            // Calculate drill-specific metrics
            const questionsAnswered = Object.keys(session.answers).length + 
              Object.values(session.textAnswers).filter(answer => answer && answer.trim().length > 0).length;
            
            // Get the difficulty level from URL params
            const difficulty = parseInt(searchParams.get('difficulty') === 'easy' ? '1' : 
                                     searchParams.get('difficulty') === 'medium' ? '2' : '3');
            
            // Get or create UUID for sub-skill
            const subSkillText = session.questions[0]?.subSkill || session.sectionName;
            const firstQuestionWithUUID = session.questions.find(q => q.subSkillId && q.subSkillId.trim() !== '');
            const actualSubSkillId = getOrCreateSubSkillUUID(subSkillText, firstQuestionWithUUID?.subSkillId);
            
            // Convert answers to string format for drill_sessions
            const stringAnswers: Record<string, string> = {};
            Object.entries(session.answers).forEach(([qIndex, answerIndex]) => {
              const question = session.questions[parseInt(qIndex)];
              if (question && question.options && question.options[answerIndex]) {
                stringAnswers[qIndex] = question.options[answerIndex];
              }
            });
            
            const stringTextAnswers: Record<string, string> = {};
            Object.entries(session.textAnswers).forEach(([index, answer]) => {
              if (answer && answer.trim().length > 0) {
                stringTextAnswers[index] = answer;
              }
            });
            
            // For writing drills, treat all attempted questions as "correct" for progress tracking
            // The actual scoring is handled separately via writing assessments
            const questionsCorrect = questionsAnswered;
            
            // BRIDGE FIX: Instead of creating a new drill session, we'll skip the bridge
            // The writing drill should complete in user_test_sessions only
            // The drill progress loading already handles user_test_sessions properly
            console.log('🌉 WRITING-DRILL-BRIDGE: Skipping drill_sessions bridge - using user_test_sessions only');
            console.log('🌉 WRITING-DRILL-BRIDGE: Main session completed in user_test_sessions:', session.id);
            console.log('✅ WRITING-DRILL-BRIDGE: Bridge skipped - progress will be tracked via user_test_sessions only');
            
            // PROGRESS REFRESH: Trigger drill progress refresh by setting a flag in localStorage
            // This will be picked up by the drill page visibility change handler
            localStorage.setItem('drill_progress_refresh_needed', 'true');
            console.log('🔄 WRITING-DRILL-REFRESH: Set drill progress refresh flag for drill page');
          } catch (bridgeError) {
            console.error('❌ WRITING-DRILL-BRIDGE: Error in bridge logic:', bridgeError);
            // Don't throw - this was just supplementary logic
          }
        }
      }
      
      // Calculate final score using ScoringService
      setWritingProcessingStatus('Calculating final scores...');
      const finalScore = await ScoringService.calculateTestScore(
        session.questions,
        session.answers,
        session.textAnswers,
        session.id
      );
      setTestScore(finalScore);
      
      setIsProcessingWriting(false);
      setSession(prev => prev ? { ...prev, status: 'completed' } : prev);
      console.log('🏁 FINISH: Session completed successfully with score:', finalScore);
    } catch (error) {
      console.error('Failed to finish session:', error);
      setIsProcessingWriting(false);
      setShowSubmitConfirm(false);
    }
  };

  // Process writing assessments for all writing questions in the session
  const processWritingAssessments = async () => {
    if (!session || !user) return;

    console.log('✍️ WRITING: Starting writing assessment processing for session', session.id);
    
    const writingQuestions = session.questions.filter((question, index) => {
      const isWritingQuestion = question.format === 'Written Response' || 
                               question.response_type === 'extended_response' ||
                               question.subSkill?.toLowerCase().includes('writing') ||
                               question.subSkill?.toLowerCase().includes('written') ||
                               question.topic?.toLowerCase().includes('writing') ||
                               question.topic?.toLowerCase().includes('written');
      
      const hasResponse = session.textAnswers[index] && session.textAnswers[index].trim().length > 0;
      
      console.log(`✍️ WRITING: Question ${index} (${question.id}) - isWriting:${isWritingQuestion}, hasResponse:${hasResponse}, subSkill:${question.subSkill}`);
      
      return isWritingQuestion && hasResponse;
    });

    if (writingQuestions.length === 0) {
      console.log('✍️ WRITING: No writing questions with responses found');
      return;
    }

    console.log(`✍️ WRITING: Found ${writingQuestions.length} writing questions to assess`);
    
    // Get the correct product type
    const productType = PRODUCT_DISPLAY_NAMES[selectedProduct] || selectedProduct;
    
    // Process each writing question
    for (let i = 0; i < writingQuestions.length; i++) {
      const question = writingQuestions[i];
      const questionIndex = session.questions.findIndex(q => q.id === question.id);
      const userResponse = session.textAnswers[questionIndex];
      
      if (!userResponse || userResponse.trim().length === 0) {
        console.log(`✍️ WRITING: Skipping question ${questionIndex} - no response`);
        continue;
      }

      try {
        setWritingProcessingStatus(`Reviewing writing response ${i + 1} of ${writingQuestions.length}...`);
        console.log(`✍️ WRITING: Assessing question ${questionIndex} (${question.id}) for product ${productType}`);
        
        const assessment = await WritingAssessmentService.assessWriting(
          userResponse,
          question.id,
          productType,
          session.id,
          user.id
        );
        
        console.log(`✍️ WRITING: Assessment completed for question ${questionIndex}:`, {
          totalScore: assessment.totalScore,
          maxScore: assessment.maxPossibleScore,
          percentage: assessment.percentageScore
        });
        
      } catch (error) {
        console.error(`✍️ WRITING: Failed to assess question ${questionIndex}:`, error);
        // Continue with other questions even if one fails
      }
    }
    
    console.log('✍️ WRITING: Writing assessment processing completed');
  };

  const handleExit = async () => {
    console.log('🚪 EXIT: User exiting test, saving any unsaved responses');
    console.log('🚪 EXIT: Current session status:', session?.status);
    console.log('🚪 EXIT: Session ID:', session?.id);
    
    // Only save progress if not in review mode (review mode should be read-only)
    if (session?.status !== 'review' && session) {
      await saveProgress(session); // Use current session state
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

  const handleBackToDashboard = async () => {
    console.log('🏠 DASHBOARD: Navigating back to dashboard from:', session?.status);
    console.log('🏠 DASHBOARD: Session ID:', session?.id);
    
    // If coming from a completed session, ensure it's marked as completed
    if (session?.status === 'completed' && session.id) {
      try {
        console.log('🏁 DASHBOARD: Ensuring session is marked as completed before navigation');
        await SessionService.completeSession(session.id);
        console.log('🏁 DASHBOARD: Session completion verified');
      } catch (error) {
        console.error('🏁 DASHBOARD: Error ensuring session completion:', error);
      }
    }
    
    // Navigate to the correct page based on test type with refresh parameter
    const refreshParam = session?.status === 'completed' ? '?refresh=true' : '';
    
    if (testType === 'diagnostic') {
      navigate(`/dashboard/diagnostic${refreshParam}`);
    } else if (testType === 'practice') {
      navigate(`/dashboard/practice-tests${refreshParam}`);
    } else if (testType === 'drill') {
      navigate(`/dashboard/drill${refreshParam}`);
    } else {
      // Fallback to general dashboard
      navigate(`/dashboard${refreshParam}`);
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
    // Use calculated test score if available, otherwise fallback to simple calculation
    let totalQuestions, answeredQuestions, score, percentage, totalPoints, earnedPoints;
    
    if (testScore) {
      // Use weighted scoring from ScoringService
      totalQuestions = testScore.totalQuestions;
      answeredQuestions = testScore.answeredQuestions;
      earnedPoints = testScore.totalEarnedPoints;
      totalPoints = testScore.totalMaxPoints;
      percentage = testScore.percentageScore;
      score = `${earnedPoints}/${totalPoints}`;
    } else {
      // Fallback to simple question count (backward compatibility)
      totalQuestions = session.questions.length;
      answeredQuestions = Object.keys(session.answers).length;
      const correctCount = Object.entries(session.answers).reduce((correct, [qIndex, answer]) => {
        return session.questions[parseInt(qIndex)].correctAnswer === answer ? correct + 1 : correct;
      }, 0);
      score = `${correctCount}/${totalQuestions}`;
      percentage = Math.round((correctCount / totalQuestions) * 100);
    }

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
                  <div className="text-3xl font-bold text-edu-teal">{score}</div>
                  <div className="text-sm text-gray-600">Total Score</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-edu-coral">{percentage}%</div>
                  <div className="text-sm text-gray-600">Percentage</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-edu-navy">{answeredQuestions}</div>
                  <div className="text-sm text-gray-600">Questions Answered</div>
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
        onTextBlur={handleTextBlur}
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
        sessionId={session.id}
        testScore={testScore}
        calculatingScore={calculatingScore}
        productType={PRODUCT_DISPLAY_NAMES[selectedProduct] || selectedProduct}
      />
    );
  }

  // Main test interface
  return (
    <>
      <EnhancedTestInterface
        questions={session.questions}
        currentQuestionIndex={session.currentQuestion}
        timeRemaining={shouldHaveTimer(actualTestMode) ? timeRemaining : undefined}
        onAnswer={handleAnswer}
        onTextAnswer={handleTextAnswer}
        onTextBlur={handleTextBlur}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onJumpToQuestion={handleJumpToQuestion}
        onFlag={handleFlag}
        answers={session.answers}
        textAnswers={session.textAnswers}
        flaggedQuestions={session.flaggedQuestions}
        showFeedback={shouldShowImmediateAnswerFeedback(actualTestMode)}
        isReviewMode={false}
        testTitle={session.sectionName}
        onFinish={handleFinish}
        onExit={handleExit}
        sessionId={session.id}
      />

      {/* Submit Confirmation Dialog */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="text-green-600" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-edu-navy">Submit Test?</h3>
                <p className="text-sm text-gray-600">Are you ready to submit your test?</p>
              </div>
            </div>
            
            <div className="mb-6">
              <div className="bg-edu-light-blue/30 border border-edu-teal/20 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertCircle size={16} className="text-edu-teal mt-0.5 shrink-0" />
                  <div className="text-sm text-edu-navy">
                    <p className="font-medium mb-1">Once submitted, you cannot make changes</p>
                    <p>• Your answers will be saved and scored</p>
                    <p>• You can review your results afterward</p>
                    <p>• Make sure you've answered all questions you want to complete</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowSubmitConfirm(false)}
                className="flex-1 border-gray-300 hover:border-edu-teal hover:text-edu-teal"
              >
                Continue Test
              </Button>
              <Button
                onClick={handleConfirmSubmit}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle size={16} className="mr-2" />
                Submit Test
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Writing Assessment Processing Modal */}
      {isProcessingWriting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-edu-light-blue/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-edu-teal"></div>
              </div>
              
              <h3 className="text-xl font-semibold text-edu-navy mb-3">
                Finalising Your Results
              </h3>
              
              <p className="text-sm text-gray-600 mb-4">
                {writingProcessingStatus || 'Reviewing your responses...'}
              </p>
              
              <div className="bg-edu-light-blue/10 border border-edu-teal/20 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertCircle size={16} className="text-edu-teal mt-0.5 shrink-0" />
                  <div className="text-sm text-edu-navy text-left">
                    <p className="font-medium mb-1">Please wait while we:</p>
                    <p>• Review your writing responses</p>
                    <p>• Calculate your final scores</p>
                    <p>• Prepare detailed feedback</p>
                  </div>
                </div>
              </div>
              
              <p className="text-xs text-gray-500 mt-4">
                This may take a few moments. Please don't close this window.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TestTaking;