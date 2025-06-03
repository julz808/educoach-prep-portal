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
import { 
  fetchQuestionsForTest, 
  type OrganizedQuestion 
} from '@/services/supabaseQuestionService';

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
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
  status: 'in-progress' | 'completed' | 'review';
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

const TestTaking: React.FC = () => {
  const { testType, subjectId, sectionId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { selectedProduct } = useProduct();
  
  const skillId = searchParams.get('skillId');
  const skillName = searchParams.get('skillName');
  const sectionName = searchParams.get('sectionName');
  
  const [session, setSession] = useState<TestSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Load questions from Supabase
  useEffect(() => {
    const loadQuestions = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Map frontend test type to Supabase test type
        const supabaseTestType = TEST_TYPE_MAPPING[selectedProduct] || selectedProduct;
        
        // Map test mode
        let testMode = 'practice_1'; // default
        if (testType === 'diagnostic') {
          testMode = 'diagnostic';
        } else if (testType === 'drill') {
          testMode = 'drill';
        } else if (testType === 'practice') {
          testMode = 'practice_1';
        }

        // Fetch questions for the specific test and section
        const questions = await fetchQuestionsForTest(
          supabaseTestType, 
          testMode, 
          sectionName || undefined
        );

        if (questions.length === 0) {
          setError(`No questions found for ${sectionName || 'this section'}. Questions may not be available yet.`);
          return;
        }

        // Transform questions to match component interface
        const transformedQuestions: Question[] = questions.map(q => ({
          id: q.id,
          text: q.text,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          passageContent: q.passageContent,
        }));

        // Calculate time limit based on number of questions
        const timeLimit = Math.max(Math.ceil(questions.length * 1.5), 10); // minimum 10 minutes

        const newSession: TestSession = {
          type: (testType as 'diagnostic' | 'practice' | 'drill') || 'practice',
          subjectId: subjectId || '',
          subjectName: sectionName || subjectId || '',
          sectionId: sectionId,
          sectionName: sectionName || '',
          skillId: skillId,
          skillName: skillName || '',
          questions: transformedQuestions,
          timeLimit: timeLimit,
          currentQuestion: 0,
          answers: {},
          flaggedQuestions: new Set(),
          startTime: new Date(),
          status: 'in-progress'
        };

        setSession(newSession);
        setTimeRemaining(timeLimit * 60); // convert to seconds
      } catch (err) {
        console.error('Error loading questions:', err);
        setError('Failed to load questions. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadQuestions();
  }, [selectedProduct, testType, subjectId, sectionId, sectionName]);

  // Timer effect
  useEffect(() => {
    if (session?.status === 'in-progress' && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [session?.status, timeRemaining]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-edu-teal mx-auto mb-4"></div>
          <p className="text-gray-600">Loading questions...</p>
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
          <Button onClick={() => navigate('/mock-tests')}>
            Back to Tests
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = session.questions[session.currentQuestion];
  const progress = ((session.currentQuestion + 1) / session.questions.length) * 100;
  const answeredQuestions = Object.keys(session.answers).length;

  const handleAnswer = (answerIndex: number) => {
    setSession(prev => prev ? ({
      ...prev,
      answers: {
        ...prev.answers,
        [prev.currentQuestion]: answerIndex
      }
    }) : prev);
  };

  const handleNext = () => {
    if (session.currentQuestion < session.questions.length - 1) {
      setSession(prev => prev ? ({
        ...prev,
        currentQuestion: prev.currentQuestion + 1
      }) : prev);
    }
  };

  const handlePrevious = () => {
    if (session.currentQuestion > 0) {
      setSession(prev => prev ? ({
        ...prev,
        currentQuestion: prev.currentQuestion - 1
      }) : prev);
    }
  };

  const handleFlag = () => {
    setSession(prev => {
      if (!prev) return prev;
      const newFlagged = new Set(prev.flaggedQuestions);
      if (newFlagged.has(prev.currentQuestion)) {
        newFlagged.delete(prev.currentQuestion);
      } else {
        newFlagged.add(prev.currentQuestion);
      }
      return {
        ...prev,
        flaggedQuestions: newFlagged
      };
    });
  };

  const handleFinish = () => {
    setSession(prev => prev ? ({ ...prev, status: 'completed' }) : prev);
  };

  const handleTimeUp = () => {
    setSession(prev => prev ? ({ ...prev, status: 'completed' }) : prev);
  };

  const handleReview = () => {
    setSession(prev => prev ? ({ ...prev, status: 'review' }) : prev);
  };

  const handleBackToDashboard = () => {
    const basePath = session.type === 'diagnostic' ? '/diagnostic' :
                    session.type === 'practice' ? '/mock-tests' :
                    '/dashboard';
    navigate(basePath);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTestTitle = () => {
    if (session.type === 'drill') {
      return `${session.subjectName} - ${session.skillName}`;
    } else if (session.type === 'practice') {
      return `Practice Test - ${session.subjectName}`;
    } else {
      return `Diagnostic - ${session.subjectName}`;
    }
  };

  // Results view
  if (session.status === 'completed') {
    const score = Math.round((answeredQuestions / session.questions.length) * 100);
    const correctAnswers = session.questions.filter((q, index) => 
      session.answers[index] === q.correctAnswer
    ).length;
    const accuracy = Math.round((correctAnswers / answeredQuestions) * 100);

    return (
      <div className="min-h-screen bg-white p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Results Header */}
          <Card className="bg-gradient-to-r from-green-500 to-blue-600 text-white">
            <CardContent className="p-8">
              <div className="text-center">
                <CheckCircle size={64} className="mx-auto mb-4" />
                <h1 className="text-3xl font-bold mb-2">Test Completed!</h1>
                <p className="text-lg opacity-90">{getTestTitle()}</p>
              </div>
            </CardContent>
          </Card>

          {/* Score Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">{score}%</div>
                <div className="text-sm text-muted-foreground">Completion Rate</div>
                <div className="text-xs mt-1">{answeredQuestions}/{session.questions.length} questions answered</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">{accuracy}%</div>
                <div className="text-sm text-muted-foreground">Accuracy</div>
                <div className="text-xs mt-1">{correctAnswers} correct answers</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-4xl font-bold text-purple-600 mb-2">
                  {formatTime((session.timeLimit * 60) - timeRemaining)}
                </div>
                <div className="text-sm text-muted-foreground">Time Taken</div>
                <div className="text-xs mt-1">out of {session.timeLimit} minutes</div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            <Button onClick={handleReview} variant="outline" size="lg">
              <BookOpen size={20} className="mr-2" />
              Review Answers
            </Button>
            <Button onClick={handleBackToDashboard} size="lg">
              <ArrowLeft size={20} className="mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Review mode
  if (session.status === 'review') {
    const question = session.questions[session.currentQuestion];
    const userAnswer = session.answers[session.currentQuestion];
    const isCorrect = userAnswer === question.correctAnswer;

    return (
      <div className="min-h-screen bg-white p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Review Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">{getTestTitle()} - Review</h1>
                  <p className="text-muted-foreground">Question {session.currentQuestion + 1} of {session.questions.length}</p>
                </div>
                <Button onClick={handleBackToDashboard} variant="outline">
                  <ArrowLeft size={16} className="mr-2" />
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Question Review */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Question {session.currentQuestion + 1}</CardTitle>
                <Badge className={isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                  {isCorrect ? 'Correct' : 'Incorrect'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-lg leading-relaxed whitespace-pre-line">
                {question.text}
              </div>

              <div className="space-y-3">
                {question.options.map((option, index) => {
                  const letter = String.fromCharCode(65 + index);
                  const isUserChoice = userAnswer === index;
                  const isCorrectChoice = question.correctAnswer === index;
                  
                  return (
                    <div
                      key={index}
                      className={cn(
                        "p-4 rounded-lg border-2 transition-all",
                        isCorrectChoice ? 'border-green-500 bg-green-50' :
                        isUserChoice && !isCorrectChoice ? 'border-red-500 bg-red-50' :
                        'border-gray-200 bg-gray-50'
                      )}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                          isCorrectChoice ? 'bg-green-500 text-white' :
                          isUserChoice && !isCorrectChoice ? 'bg-red-500 text-white' :
                          'bg-gray-300 text-gray-700'
                        )}>
                          {letter}
                        </div>
                        <span className="flex-1">{option}</span>
                        {isUserChoice && (
                          <Badge variant="outline">Your Answer</Badge>
                        )}
                        {isCorrectChoice && (
                          <Badge className="bg-green-100 text-green-700">Correct</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Explanation */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Explanation:</h4>
                  <p className="text-blue-800">{question.explanation}</p>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button 
              onClick={handlePrevious} 
              disabled={session.currentQuestion === 0}
              variant="outline"
            >
              <ArrowLeft size={16} className="mr-2" />
              Previous
            </Button>
            
            <Button 
              onClick={handleNext} 
              disabled={session.currentQuestion === session.questions.length - 1}
            >
              Next
              <ArrowRight size={16} className="ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Test taking interface
  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Test Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">{getTestTitle()}</h1>
                <p className="text-muted-foreground">Question {session.currentQuestion + 1} of {session.questions.length}</p>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className={cn(
                  "flex items-center space-x-2 px-3 py-2 rounded-lg",
                  timeRemaining < 300 ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                )}>
                  <Clock size={16} />
                  <span className="font-mono">{formatTime(timeRemaining)}</span>
                </div>
                
                <Button onClick={handleFlag} variant="outline" size="sm">
                  <Flag 
                    size={16} 
                    className={session.flaggedQuestions.has(session.currentQuestion) ? 'fill-current text-red-500' : ''} 
                  />
                </Button>
              </div>
            </div>
            
            <div className="mt-4">
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{answeredQuestions} answered</span>
                <span>{session.flaggedQuestions.size} flagged</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Question */}
        <Card>
          <CardHeader>
            <CardTitle>Question {session.currentQuestion + 1}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-lg leading-relaxed whitespace-pre-line">
              {currentQuestion.text}
            </div>

            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => {
                const letter = String.fromCharCode(65 + index);
                const isSelected = session.answers[session.currentQuestion] === index;
                
                return (
                  <button
                    key={index}
                    onClick={() => handleAnswer(index)}
                    className={cn(
                      "w-full p-4 rounded-lg border-2 text-left transition-all hover:border-edu-teal",
                      isSelected 
                        ? 'border-edu-teal bg-edu-light-blue/30' 
                        : 'border-gray-200 bg-white'
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                        isSelected ? 'bg-edu-teal text-white' : 'bg-gray-200 text-gray-700'
                      )}>
                        {letter}
                      </div>
                      <span className="flex-1">{option}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button 
            onClick={handlePrevious} 
            disabled={session.currentQuestion === 0}
            variant="outline"
          >
            <ArrowLeft size={16} className="mr-2" />
            Previous
          </Button>
          
          <div className="space-x-3">
            {session.currentQuestion === session.questions.length - 1 ? (
              <Button onClick={handleFinish} className="bg-green-600 hover:bg-green-700">
                <CheckCircle size={16} className="mr-2" />
                Finish Test
              </Button>
            ) : (
              <Button onClick={handleNext}>
                Next
                <ArrowRight size={16} className="ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestTaking; 