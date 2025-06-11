import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
  const exactMatch = (testStructure as any)[sectionName];
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
    const matchedSection = (testStructure as any)[partialMatch];
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
  const { testType, subjectId, sectionId } = useParams<{ 
    testType: string; 
    subjectId: string; 
    sectionId?: string; 
  }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { selectedProduct } = useProduct();
  const [session, setSession] = useState<TestSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  // Initialize test session
  useEffect(() => {
    const loadQuestions = async () => {
      if (!subjectId || !testType) {
        setError('Missing test parameters');
        setLoading(false);
        return;
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
          return;
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
          
          if (foundQuestions.length > 0) {
            // Filter by difficulty level
            const difficultyMap = { easy: 1, medium: 2, hard: 3 };
            const targetDifficulty = difficultyMap[difficulty as keyof typeof difficultyMap] || 1;
            
            const filteredQuestions = foundQuestions.filter(q => q.difficulty === targetDifficulty);
            console.log(`🔧 Filtered ${difficulty} questions:`, filteredQuestions.length, 'out of', foundQuestions.length);
            
            questions = filteredQuestions;
          }
        }

        // Transform OrganizedQuestion[] to Question[] with formatted text
        const transformedQuestions: Question[] = questions.map((q, index) => ({
          id: q.id || `question-${index}`,
          text: q.text,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          topic: q.topic || 'General',
          subSkill: q.subSkill || 'General',
          difficulty: q.difficulty || 1,
          passageContent: q.passageContent
        }));

        console.log('🔧 Transformed questions:', transformedQuestions.length);

        if (transformedQuestions.length === 0) {
          setError(`No questions found for this ${testType} section. Questions may be coming soon.`);
          setLoading(false);
          return;
        }

        // Randomize questions (with special handling for reading comprehension)
        const randomizedQuestions = randomizeQuestions(transformedQuestions, sectionName || subjectId);

        // Get actual time limit from curriculum data
        let actualTimeLimit: number;
        if (testType === 'drill') {
          // For drill tests, use a shorter time limit (1.5 minutes per question)
          actualTimeLimit = Math.max(transformedQuestions.length * 1.5, 5); // Minimum 5 minutes
          console.log('🔧 Drill time limit calculated:', actualTimeLimit, 'minutes for', transformedQuestions.length, 'questions');
        } else {
          actualTimeLimit = getTimeLimit(dbTestType, sectionName || subjectId);
          console.log('🔧 Time limit from curriculum data:', actualTimeLimit, 'minutes for section:', sectionName || subjectId);
        }

        const newSession: TestSession = {
          type: testType as 'diagnostic' | 'practice' | 'drill',
          subjectId,
          subjectName: dbTestType,
          sectionId,
          sectionName: sectionName || subjectId,
          skillId,
          skillName: skillId,
          questions: randomizedQuestions,
          timeLimit: actualTimeLimit,
          currentQuestion: 0,
          answers: {},
          flaggedQuestions: new Set(),
          startTime: new Date(),
          status: 'in-progress'
        };

        setSession(newSession);
        setTimeRemaining(newSession.timeLimit * 60); // Convert to seconds
        
        console.log('🔧 Test session created:', {
          type: newSession.type,
          subject: newSession.subjectName,
          section: newSession.sectionName,
          questionCount: newSession.questions.length,
          timeLimit: newSession.timeLimit
        });
        
      } catch (err) {
        console.error('Error loading test:', err);
        setError('Failed to load test questions. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadQuestions();
  }, [subjectId, testType, sectionId, searchParams, selectedProduct]);

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

  const handleAnswer = (questionIndex: number, answerIndex: number) => {
    if (!session) return;
    
    setSession(prev => prev ? ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionIndex]: answerIndex
      }
    }) : prev);
  };

  const handleNext = () => {
    if (!session) return;
    
    if (session.currentQuestion < session.questions.length - 1) {
      setSession(prev => prev ? ({
        ...prev,
        currentQuestion: prev.currentQuestion + 1
      }) : prev);
    }
  };

  const handlePrevious = () => {
    if (!session) return;
    
    if (session.currentQuestion > 0) {
      setSession(prev => prev ? ({
        ...prev,
        currentQuestion: prev.currentQuestion - 1
      }) : prev);
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

  const handleFinish = () => {
    if (!session) return;
    
    setSession(prev => prev ? ({ ...prev, status: 'completed' }) : prev);
  };

  const handleExit = () => {
    if (!session) return;
    
    console.log('🚪 Exiting test - saving progress with', timeRemaining, 'seconds remaining');
    
    // Save current state and pause the test
    setSession(prev => prev ? ({ 
      ...prev, 
      status: 'paused',
      pausedTime: timeRemaining
    }) : prev);
    
    // Navigate back to appropriate dashboard
    const basePath = session.type === 'diagnostic' ? '/dashboard/diagnostic' :
                    session.type === 'practice' ? '/dashboard/practice-tests' :
                    session.type === 'drill' ? '/dashboard/drill' :
                    '/dashboard';
    navigate(basePath);
  };

  const handleTimeUp = () => {
    if (!session) return;
    
    setSession(prev => prev ? ({ ...prev, status: 'completed' }) : prev);
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
  );
};

export default TestTaking; 