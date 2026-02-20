import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Flag, ChevronLeft, ChevronRight, ChevronRight as ChevronRightIcon, ChevronDown, CheckCircle, AlertCircle, X, LogOut, ArrowLeft, ArrowRight, List, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatQuestionText, cleanOptionText, formatPassageText, formatExplanationText } from '@/utils/textFormatting';
import { WritingAssessmentFeedback } from './WritingAssessmentFeedback';
import { WritingAssessmentService } from '@/services/writingAssessmentService';
import SVGRenderer from './SVGRenderer';

interface Question {
  id: string;
  text: string;
  options?: string[];
  correctAnswer: number;
  explanation?: string;
  topic: string;
  subSkill: string;
  difficulty: number;
  passageContent?: string;
  visualSvg?: string; // SVG or HTML markup for visual questions
  format?: 'Multiple Choice' | 'Written Response';
  userTextAnswer?: string; // For written responses
  maxPoints: number; // Maximum points for this question (1 for MC, varies for writing)
}

interface EnhancedTestInterfaceProps {
  questions: Question[];
  currentQuestionIndex: number;
  timeRemaining?: number;
  onAnswer: (answerIndex: number) => void;
  onTextAnswer?: (text: string) => void; // For written responses
  onTextBlur?: () => void; // For immediate save on text blur
  onNext: () => void;
  onPrevious: () => void;
  onJumpToQuestion: (questionIndex: number) => void;
  onFlag: (questionIndex: number) => void;
  answers: Record<number, number>;
  textAnswers?: Record<number, string>; // For written responses
  flaggedQuestions: Set<number>;
  showFeedback?: boolean;
  isReviewMode?: boolean;
  onFinish?: () => void;
  onExit?: () => void;
  testTitle?: string;
  sessionId?: string; // For loading writing assessments
  testScore?: any; // For displaying weighted scores in review mode
  calculatingScore?: boolean; // For showing loading state during score calculation
  productType?: string; // For passing to writing assessment feedback
}

export const EnhancedTestInterface: React.FC<EnhancedTestInterfaceProps> = ({
  questions,
  currentQuestionIndex,
  timeRemaining,
  onAnswer,
  onTextAnswer,
  onTextBlur,
  onNext,
  onPrevious,
  onJumpToQuestion,
  onFlag,
  answers,
  textAnswers = {},
  flaggedQuestions,
  showFeedback = false,
  isReviewMode = false,
  onFinish,
  onExit,
  testTitle = "Test",
  sessionId,
  testScore,
  calculatingScore = false,
  productType
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [textAnswer, setTextAnswer] = useState<string>('');
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [questionTransition, setQuestionTransition] = useState(false);
  const [showTimeWarning, setShowTimeWarning] = useState<string | null>(null);
  const [warningsShown, setWarningsShown] = useState<Set<number>>(new Set());
  const [writingAssessment, setWritingAssessment] = useState<any>(null);
  const [loadingAssessment, setLoadingAssessment] = useState(false);
  const [showDrillFeedback, setShowDrillFeedback] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  
  // Check if this is drill mode (only drill mode has showFeedback but not review mode)
  const isDrillMode = showFeedback && !isReviewMode;
  
  
  // Check if all questions in this test are writing questions
  const isWritingSection = questions.length > 0 && questions.every(q => 
    q.format === 'Written Response' || 
    q.topic?.toLowerCase().includes('writing') ||
    q.topic?.toLowerCase().includes('written') ||
    q.subSkill?.toLowerCase().includes('writing') ||
    q.subSkill?.toLowerCase().includes('written')
  );
  
  // Guard clause: if no current question, return loading state
  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-edu-teal mx-auto mb-4"></div>
          <p className="text-gray-600">Loading question...</p>
        </div>
      </div>
    );
  }
  
  const hasPassage = currentQuestion?.passageContent && currentQuestion.passageContent.trim().length > 0;
  
  // Check if this is a written response question
  const isWrittenResponse = currentQuestion?.format === 'Written Response' || 
                          currentQuestion?.topic?.toLowerCase().includes('writing') ||
                          currentQuestion?.topic?.toLowerCase().includes('written') ||
                          currentQuestion?.subSkill?.toLowerCase().includes('writing') ||
                          currentQuestion?.subSkill?.toLowerCase().includes('written') ||
                          !currentQuestion?.options || 
                          currentQuestion?.options.length === 0;

  // Update selected answer/text when question changes
  useEffect(() => {
    setSelectedAnswer(answers[currentQuestionIndex] ?? null);
    setTextAnswer(textAnswers[currentQuestionIndex] ?? '');
    // Reset drill feedback when question changes
    setShowDrillFeedback(false);
  }, [currentQuestionIndex, answers, textAnswers]);

  // Load writing assessment for current question in review mode
  useEffect(() => {
    const loadWritingAssessment = async () => {
      if (!isReviewMode || !sessionId || !currentQuestion) return;
      
      // Check if this is a writing question
      const isWritingQuestion = isWrittenResponse;
      if (!isWritingQuestion) {
        setWritingAssessment(null);
        return;
      }

      setLoadingAssessment(true);
      try {
        const assessment = await WritingAssessmentService.getWritingAssessment(
          currentQuestion.id,
          sessionId
        );
        setWritingAssessment(assessment);
      } catch (error) {
        console.error('Failed to load writing assessment:', error);
        setWritingAssessment(null);
      } finally {
        setLoadingAssessment(false);
      }
    };

    loadWritingAssessment();
  }, [currentQuestionIndex, isReviewMode, sessionId, currentQuestion?.id, isWrittenResponse]);

  // Question transition animation
  useEffect(() => {
    setQuestionTransition(true);
    const timer = setTimeout(() => setQuestionTransition(false), 300);
    return () => clearTimeout(timer);
  }, [currentQuestionIndex]);

  // Time warnings effect
  useEffect(() => {
    if (!timeRemaining) return;

    // 5 minute warning (300 seconds)
    if (timeRemaining === 300 && !warningsShown.has(300)) {
      setShowTimeWarning("5 minutes remaining!");
      setWarningsShown(prev => new Set(prev).add(300));
      
      // Hide warning after 5 seconds
      const timer = setTimeout(() => setShowTimeWarning(null), 5000);
      return () => clearTimeout(timer);
    }

    // 1 minute warning (60 seconds)
    if (timeRemaining === 60 && !warningsShown.has(60)) {
      setShowTimeWarning("1 minute remaining!");
      setWarningsShown(prev => new Set(prev).add(60));
      
      // Hide warning after 5 seconds
      const timer = setTimeout(() => setShowTimeWarning(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [timeRemaining, warningsShown]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (answerIndex: number) => {
    // Don't allow selection in review mode or when drill feedback is being shown
    if (isReviewMode || (isDrillMode && showDrillFeedback)) return;
    setSelectedAnswer(answerIndex);
    onAnswer(answerIndex);
  };

  const handleTextAnswerChange = (text: string) => {
    setTextAnswer(text);
    if (onTextAnswer) {
      onTextAnswer(text);
    }
  };

  const handleNextQuestion = () => {
    // For drill mode, show feedback when user clicks next (after they've answered)
    if (isDrillMode && selectedAnswer !== null && !showDrillFeedback) {
      setShowDrillFeedback(true);
      return; // Don't advance to next question yet, just show feedback
    }
    
    // For non-drill modes or when feedback is already shown, proceed to next question
    onNext();
  };

  const getQuestionStatus = (questionIndex: number) => {
    const question = questions[questionIndex];
    const isWrittenResponseQuestion = question?.format === 'Written Response' || 
                                    !question?.options || 
                                    question?.options.length === 0;
    
    const isAnswered = isWrittenResponseQuestion 
      ? (textAnswers[questionIndex] && textAnswers[questionIndex].trim().length > 0)
      : answers[questionIndex] !== undefined;
    
    const isFlagged = flaggedQuestions.has(questionIndex);
    
    // In review mode, show correct/incorrect status if answered
    if (isReviewMode) {
      // For writing sections, show answered/not answered instead of correct/incorrect
      if (isWritingSection) {
        return {
          primary: isAnswered ? 'correct' : 'incorrect', // Using 'correct' for green, 'incorrect' for red
          flagged: isFlagged
        };
      } else if (isAnswered) {
        // For non-writing sections, show correct/incorrect
        const isCorrect = answers[questionIndex] === questions[questionIndex].correctAnswer;
        return {
          primary: isCorrect ? 'correct' : 'incorrect',
          flagged: isFlagged
        };
      } else {
        // Not answered in review mode
        return {
          primary: 'unanswered',
          flagged: isFlagged
        };
      }
    }
    
    // In regular mode
    if (isAnswered) {
      return {
        primary: 'answered',
        flagged: isFlagged
      };
    }
    
    if (isFlagged) {
      return {
        primary: 'flagged',
        flagged: true
      };
    }
    
    return {
      primary: 'unanswered',
      flagged: false
    };
  };

  const getQuestionCircleClass = (questionIndex: number, status: any) => {
    const baseClass = "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200 cursor-pointer hover:scale-105";
    
    if (questionIndex === currentQuestionIndex) {
      const ringClass = status.flagged ? "ring-2 ring-edu-coral ring-offset-1" : "ring-2 ring-edu-teal ring-offset-2";
      return cn(baseClass, "bg-edu-navy text-white", ringClass);
    }
    
    let fillClass = "";
    const outlineClass = status.flagged ? "border-2 border-edu-coral" : "";
    
    switch (status.primary) {
      case 'correct':
        fillClass = "bg-green-500 text-white hover:bg-green-600";
        break;
      case 'incorrect':
        fillClass = "bg-red-500 text-white hover:bg-red-600";
        break;
      case 'answered':
        fillClass = "bg-edu-teal text-white hover:bg-edu-teal/90";
        break;
      case 'flagged':
        fillClass = "text-edu-coral bg-white hover:bg-edu-coral/10";
        break;
      default:
        fillClass = "bg-gray-200 text-gray-700 hover:bg-gray-300";
    }
    
    return cn(baseClass, fillClass, outlineClass);
  };

  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;

  const getOptionClassName = (index: number) => {
    const baseClass = "w-full p-4 text-left rounded-xl border-2 transition-all duration-200 group hover:border-edu-teal/60";
    
    // For drill mode, use showDrillFeedback state; for review mode, use showFeedback prop
    const shouldShowAnswerFeedback = isDrillMode ? showDrillFeedback : showFeedback;
    
    if (shouldShowAnswerFeedback) {
      if (index === currentQuestion?.correctAnswer) {
        return cn(baseClass, "border-green-500 bg-green-50 hover:border-green-500");
      }
      if (selectedAnswer === index && index !== currentQuestion?.correctAnswer) {
        return cn(baseClass, "border-red-500 bg-red-50 hover:border-red-500");
      }
      return cn(baseClass, "border-gray-200 bg-gray-50");
    }
    
    if (selectedAnswer === index) {
      return cn(baseClass, "border-edu-teal bg-edu-teal/10 shadow-sm");
    }
    
    return cn(baseClass, "border-gray-200 hover:border-edu-teal/40 hover:bg-edu-teal/5");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-x-hidden">
      {/* Main Content Area */}
      <div className={cn(
        "flex-1 transition-all duration-300 ease-in-out",
        sidebarCollapsed ? "mr-12 sm:mr-16" : "mr-64 sm:mr-80"
      )}>
        <div className="p-2 sm:p-4 md:p-6 max-w-none">
          {/* Header */}
          <div className="bg-white rounded-xl p-3 sm:p-4 md:p-6 shadow-sm border mb-3 sm:mb-4 md:mb-6 mx-2 sm:mx-0">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-edu-navy">{testTitle}</h1>
                <p className="text-edu-navy/70 font-medium">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                {timeRemaining && (
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "flex items-center space-x-2 px-4 py-2 rounded-full text-base font-semibold",
                      "bg-gray-100 text-gray-700"
                    )}>
                      <Clock size={16} className="text-gray-600" />
                      <span className="text-gray-800 font-semibold">{formatTime(timeRemaining)}</span>
                    </div>
                    {showTimeWarning && (
                      <div className="mt-1 text-sm font-semibold text-red-600 animate-pulse">
                        {showTimeWarning}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content Area - Dual Panel for Reading Questions */}
          {hasPassage ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
              {/* Reading Passage Panel */}
              <Card className="border-0 shadow-lg mx-2 sm:mx-0">
                <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-6 pt-3 sm:pt-6">
                  <CardTitle className="text-base sm:text-lg text-edu-navy">Reading Passage</CardTitle>
                </CardHeader>
                <CardContent className="max-h-[400px] sm:max-h-[600px] overflow-y-auto rounded-xl px-3 sm:px-6 pb-3 sm:pb-6">
                  <div className={cn(
                    "prose prose-gray max-w-none text-base leading-relaxed transition-all duration-300 ease-out",
                    questionTransition ? "opacity-0 transform translate-x-4" : "opacity-100 transform translate-x-0"
                  )}>
                    {currentQuestion?.passageContent?.split('\n').map((paragraph, index) => (
                      <p key={index} className="mb-4 text-gray-800">
                        {formatPassageText(paragraph)}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Question Panel */}
              <Card className="border-0 shadow-lg rounded-xl relative mx-2 sm:mx-0">
                <CardContent className="p-3 sm:p-6 md:p-8">
                  <div className={cn(
                    "space-y-6 transition-all duration-300 ease-out",
                    questionTransition ? "opacity-0 transform translate-x-4" : "opacity-100 transform translate-x-0"
                  )}>
                    {/* Navigation Controls Header */}
                    <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-gray-100">
                      <div className="text-xs sm:text-sm text-gray-500">
                        Question {currentQuestionIndex + 1} of {questions.length}
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3">
                        {/* Flag Button */}
                        {!isReviewMode && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onFlag(currentQuestionIndex)}
                            className={cn(
                              "w-7 h-7 sm:w-8 sm:h-8 p-0 hover:bg-transparent",
                              flaggedQuestions.has(currentQuestionIndex) 
                                ? "text-red-500 hover:text-red-600" 
                                : "text-gray-500 hover:text-red-500"
                            )}
                          >
                            <Flag size={16} className="sm:w-5 sm:h-5" />
                          </Button>
                        )}
                        
                        {/* Navigation Controls */}
                        <div className="flex items-center gap-2 sm:gap-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={onPrevious}
                            disabled={isFirstQuestion}
                            className="w-8 h-8 sm:w-10 sm:h-10 p-0 rounded-full border-2 hover:border-edu-teal hover:text-edu-teal transition-colors"
                          >
                            <ArrowLeft size={14} className="sm:w-4 sm:h-4" />
                          </Button>
                          
                          {isLastQuestion ? (
                            isReviewMode ? (
                              <Button
                                onClick={onFinish}
                                className="bg-edu-teal hover:bg-edu-teal/90 text-white rounded-full px-3 sm:px-4 h-8 sm:h-10 font-medium text-xs sm:text-sm"
                              >
                                <CheckCircle size={12} className="mr-1 sm:mr-1.5 sm:w-3.5 sm:h-3.5" />
                                <span className="hidden xs:inline">Exit Review</span>
                                <span className="xs:hidden">Exit</span>
                              </Button>
                            ) : (
                              <Button
                                onClick={onFinish}
                                className="bg-green-600 hover:bg-green-700 text-white rounded-full px-3 sm:px-4 h-8 sm:h-10 font-medium text-xs sm:text-sm"
                              >
                                <CheckCircle size={12} className="mr-1 sm:mr-1.5 sm:w-3.5 sm:h-3.5" />
                                <span className="hidden xs:inline">Finish</span>
                                <span className="xs:hidden">Done</span>
                              </Button>
                            )
                          ) : (
                            <Button
                              size="sm"
                              onClick={handleNextQuestion}
                              className={cn(
                                "rounded-full bg-edu-teal hover:bg-edu-teal/90 text-white transition-colors",
                                isDrillMode && selectedAnswer !== null && !showDrillFeedback 
                                  ? "px-3 sm:px-4 h-8 sm:h-10 font-medium text-xs sm:text-sm" 
                                  : "w-8 h-8 sm:w-10 sm:h-10 p-0"
                              )}
                            >
                              {isDrillMode && selectedAnswer !== null && !showDrillFeedback ? (
                                <>
                                  <ArrowRight size={12} className="mr-1 sm:mr-1.5 sm:w-3.5 sm:h-3.5" />
                                  <span className="hidden xs:inline">Show Answer</span>
                                  <span className="xs:hidden">Show</span>
                                </>
                              ) : (
                                <ArrowRight size={14} className="sm:w-4 sm:h-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Question Text */}
                    <div>
                      <h2 className="text-lg font-bold leading-relaxed text-edu-navy mb-6 whitespace-pre-line">
                        {formatQuestionText(currentQuestion?.text || '')}
                      </h2>
                      {/* Visual (SVG diagram or HTML table) */}
                      {currentQuestion?.visualSvg && (
                        <div className="mb-6">
                          <SVGRenderer
                            svgContent={currentQuestion.visualSvg}
                            className="max-w-full rounded-lg border border-gray-200 bg-white p-3"
                          />
                        </div>
                      )}
                    </div>

                    {/* Answer Options - Multiple Choice or Written Response */}
                    {isWrittenResponse ? (
                      <div className="space-y-4">
                        <div className="bg-gradient-to-r from-edu-light-blue/30 to-white rounded-lg p-4 border border-edu-teal/20">
                          <p className="text-sm text-edu-navy font-medium mb-2">
                            📝 Written Response Required
                          </p>
                          <p className="text-xs text-edu-navy/70">
                            Please type your answer in the text area below. Take your time to craft a thoughtful response.
                          </p>
                        </div>
                        <textarea
                          value={textAnswer}
                          onChange={(e) => handleTextAnswerChange(e.target.value)}
                          onBlur={onTextBlur}
                          placeholder="Type your answer here..."
                          disabled={isReviewMode || (isDrillMode && showDrillFeedback)}
                          className={cn(
                            "w-full min-h-[250px] p-4 border-2 rounded-xl text-base leading-relaxed",
                            "focus:outline-none focus:ring-2 focus:ring-edu-teal focus:border-edu-teal",
                            "resize-vertical transition-colors duration-200",
                            "pointer-events-auto z-10 relative",
                            textAnswer.trim().length > 0 
                              ? "border-edu-teal bg-edu-teal/5" 
                              : "border-gray-200 hover:border-edu-teal/40"
                          )}
                        />
                        <div className="flex justify-between items-center text-sm text-gray-600">
                          <span>Character count: {textAnswer.length}</span>
                          <span>Word count: {textAnswer.trim().split(/\s+/).filter(word => word.length > 0).length}</span>
                        </div>
                      </div>
                    ) : currentQuestion?.options && (
                      <div className="space-y-4">
                        {currentQuestion?.options.map((option, index) => (
                          <button
                            key={index}
                            onClick={() => handleAnswerSelect(index)}
                            disabled={isReviewMode || (isDrillMode && showDrillFeedback)}
                            className={cn(getOptionClassName(index), "min-h-[60px]")}
                          >
                            <div className="flex items-center space-x-3 h-full">
                              <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0",
                                selectedAnswer === index 
                                  ? "bg-edu-teal text-white" 
                                  : "bg-gray-100 text-gray-600 group-hover:bg-edu-teal/20"
                              )}>
                                {String.fromCharCode(65 + index)}
                              </div>
                              <div className="text-left leading-relaxed flex items-center">{cleanOptionText(option)}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Single Panel for Non-Reading Questions */
            <Card className="border-0 shadow-lg mb-6 relative">
              <CardContent className="p-8">
                <div className={cn(
                  "space-y-8 transition-all duration-300 ease-out",
                  questionTransition ? "opacity-0 transform translate-x-4" : "opacity-100 transform translate-x-0"
                )}>
                  {/* Question Metadata */}
                  <div className="flex items-center justify-between pb-6 border-b border-gray-100">
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="bg-edu-teal/10 text-edu-teal px-3 py-1 rounded-full font-medium">
                        {currentQuestion?.topic || 'General'}
                      </span>
                      <span className="bg-edu-coral/10 text-edu-coral px-3 py-1 rounded-full font-medium">
                        {currentQuestion?.subSkill || 'General'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      {/* Flag Button */}
                      {!isReviewMode && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onFlag(currentQuestionIndex)}
                          className={cn(
                            "w-8 h-8 p-0 hover:bg-transparent",
                            flaggedQuestions.has(currentQuestionIndex) 
                              ? "text-red-500 hover:text-red-600" 
                              : "text-gray-500 hover:text-red-500"
                          )}
                        >
                          <Flag size={20} />
                        </Button>
                      )}
                      
                      {/* Navigation Controls */}
                      <div className="flex items-center space-x-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={onPrevious}
                          disabled={isFirstQuestion}
                          className="w-10 h-10 p-0 rounded-full border-2 hover:border-edu-teal hover:text-edu-teal transition-colors"
                        >
                          <ArrowLeft size={16} />
                        </Button>
                        
                        {isLastQuestion ? (
                          isReviewMode ? (
                            <Button
                              onClick={onFinish}
                              className="bg-edu-teal hover:bg-edu-teal/90 text-white rounded-full px-4 h-10 font-medium text-sm"
                            >
                              <CheckCircle size={14} className="mr-1.5" />
                              Exit Review
                            </Button>
                          ) : (
                            <Button
                              onClick={onFinish}
                              className="bg-green-600 hover:bg-green-700 text-white rounded-full px-4 h-10 font-medium text-sm"
                            >
                              <CheckCircle size={14} className="mr-1.5" />
                              Finish
                            </Button>
                          )
                        ) : (
                          <Button
                            size="sm"
                            onClick={handleNextQuestion}
                            className={cn(
                              "rounded-full bg-edu-teal hover:bg-edu-teal/90 text-white transition-colors",
                              isDrillMode && selectedAnswer !== null && !showDrillFeedback 
                                ? "px-4 h-10 font-medium text-sm" 
                                : "w-10 h-10 p-0"
                            )}
                          >
                            {isDrillMode && selectedAnswer !== null && !showDrillFeedback ? (
                              <>
                                <ArrowRight size={14} className="mr-1.5" />
                                Show Answer
                              </>
                            ) : (
                              <ArrowRight size={16} />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Question Text */}
                  <div>
                    <h2 className="text-lg font-bold leading-relaxed text-edu-navy mb-6 whitespace-pre-line">
                      {formatQuestionText(currentQuestion?.text || '')}
                    </h2>
                    {/* Visual (SVG diagram or HTML table) */}
                    {currentQuestion?.visualSvg && (
                      <div className="mb-6">
                        <SVGRenderer
                          svgContent={currentQuestion.visualSvg}
                          className="max-w-full rounded-lg border border-gray-200 bg-white p-3"
                        />
                      </div>
                    )}
                  </div>

                  {/* Answer Options - Multiple Choice or Written Response */}
                  {isWrittenResponse ? (
                    <div className="space-y-4">
                      <textarea
                        value={textAnswer}
                        onChange={(e) => handleTextAnswerChange(e.target.value)}
                        onBlur={onTextBlur}
                        placeholder="Type your answer here..."
                        disabled={isReviewMode || (isDrillMode && showDrillFeedback)}
                        className={cn(
                          "w-full min-h-[300px] p-4 border-2 rounded-xl text-base leading-relaxed",
                          "focus:outline-none focus:ring-2 focus:ring-edu-teal focus:border-edu-teal",
                          "resize-vertical transition-colors duration-200",
                          textAnswer.trim().length > 0 
                            ? "border-edu-teal bg-edu-teal/5" 
                            : "border-gray-200 hover:border-edu-teal/40"
                        )}
                      />
                      <div className="flex justify-between items-center text-sm text-gray-600">
                        <span>Character count: {textAnswer.length}</span>
                        <span>Word count: {textAnswer.trim().split(/\s+/).filter(word => word.length > 0).length}</span>
                      </div>
                    </div>
                  ) : currentQuestion?.options && (
                    <div className="space-y-5">
                      {currentQuestion?.options.map((option, index) => (
                        <button
                          key={index}
                          onClick={() => handleAnswerSelect(index)}
                          disabled={isReviewMode || (isDrillMode && showDrillFeedback)}
                          className={cn(getOptionClassName(index), "min-h-[68px]")}
                        >
                          <div className="flex items-center space-x-4 h-full">
                            <div className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0",
                              selectedAnswer === index 
                                ? "bg-edu-teal text-white" 
                                : "bg-gray-100 text-gray-600 group-hover:bg-edu-teal/20"
                            )}>
                              {String.fromCharCode(65 + index)}
                            </div>
                            <div className="text-left leading-relaxed flex-1 flex items-center">{cleanOptionText(option)}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Feedback Section */}
                  {((isDrillMode && showDrillFeedback) || (!isDrillMode && showFeedback)) && (
                    <>
                      {/* Multiple Choice Feedback */}
                      {!isWrittenResponse && currentQuestion?.explanation && (
                        <div className="mt-8 p-6 bg-gradient-to-r from-edu-light-blue to-white rounded-xl border-l-4 border-edu-teal">
                          <div className="flex items-start space-x-3">
                            <div className="shrink-0 mt-0.5">
                              {selectedAnswer === currentQuestion?.correctAnswer ? (
                                <CheckCircle size={20} className="text-green-600" />
                              ) : (
                                <AlertCircle size={20} className="text-red-600" />
                              )}
                            </div>
                            <div>
                              <h3 className="font-semibold text-edu-navy mb-2">
                                {selectedAnswer === currentQuestion?.correctAnswer ? "Correct!" : "Not quite right"}
                              </h3>
                              <div className="text-edu-navy/80 leading-relaxed whitespace-pre-line">
                                {formatExplanationText(currentQuestion?.explanation)
                                  .split(/(\*\*(?:Correct Answer:|Why Other Options Are Wrong:|Tips for Similar Questions:)[^*]*\*\*)/)
                                  .map((part, index) => {
                                    // Only make section headers bold, not random text
                                    if (part.match(/^\*\*(?:Correct Answer:|Why Other Options Are Wrong:|Tips for Similar Questions:)/)) {
                                      return (
                                        <strong key={index} className="font-semibold text-edu-navy">
                                          {part.replace(/\*\*/g, '')}
                                        </strong>
                                      );
                                    }
                                    return part;
                                  })}
                              </div>
                              {/* For drill mode, show a button to continue to next question */}
                              {isDrillMode && showDrillFeedback && (
                                <div className="mt-4">
                                  <Button
                                    onClick={onNext}
                                    className="bg-edu-teal hover:bg-edu-teal/90 text-white px-4 py-2 rounded-lg"
                                  >
                                    <ArrowRight size={16} className="mr-2" />
                                    Continue to Next Question
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Writing Assessment Feedback */}
                      {isWrittenResponse && isReviewMode && (
                        <WritingAssessmentFeedback
                          assessment={writingAssessment}
                          userResponse={textAnswer}
                          isLoading={loadingAssessment}
                          productType={productType}
                        />
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Exit Button - Top Left */}
          {onExit && (
            <div className="absolute top-6 left-6 z-20">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowExitConfirm(true)}
                className="w-8 h-8 p-0 text-gray-500 hover:text-red-500 hover:bg-transparent transition-colors"
              >
                <ArrowLeft size={18} />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Progress Sidebar */}
      <div className={cn(
        "fixed right-0 top-0 h-full bg-white border-l shadow-lg transition-all duration-300 ease-in-out z-30",
        sidebarCollapsed ? "w-12 sm:w-16" : "w-64 sm:w-80"
      )}>
        <div className="p-2 sm:p-4 h-full flex flex-col">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between mb-6">
            {!sidebarCollapsed && (
              <h3 className="text-lg font-semibold text-edu-navy">Progress</h3>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="rounded-full w-8 h-8 p-0"
            >
              <ChevronRightIcon 
                size={16} 
                className={cn(
                  "transition-transform duration-200",
                  sidebarCollapsed ? "rotate-180" : ""
                )}
              />
            </Button>
          </div>

          {/* Question Grid */}
          {!sidebarCollapsed && (
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-5 xs:grid-cols-6 sm:grid-cols-6 gap-1.5 sm:gap-2 mb-4 sm:mb-6 p-2">
                {questions.map((_, questionIndex) => {
                  const status = getQuestionStatus(questionIndex);
                  return (
                    <button
                      key={questionIndex}
                      onClick={() => onJumpToQuestion(questionIndex)}
                      className={getQuestionCircleClass(questionIndex, status)}
                      title={`Question ${questionIndex + 1} - ${status.primary}`}
                    >
                      {questionIndex + 1}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="space-y-3 text-sm mb-6">
                {isReviewMode ? (
                  isWritingSection ? (
                    // Writing section in review mode - show answered/not answered
                    <>
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 rounded-full bg-green-500"></div>
                        <span className="text-gray-600">Answered</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 rounded-full bg-red-500"></div>
                        <span className="text-gray-600">Not Answered</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 rounded-full border-2 border-edu-coral bg-white"></div>
                        <span className="text-gray-600">Flagged</span>
                      </div>
                    </>
                  ) : (
                    // Non-writing section in review mode - show correct/incorrect
                    <>
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 rounded-full bg-green-500"></div>
                        <span className="text-gray-600">Correct</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 rounded-full bg-red-500"></div>
                        <span className="text-gray-600">Incorrect</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 rounded-full border-2 border-edu-coral bg-white"></div>
                        <span className="text-gray-600">Flagged</span>
                      </div>
                    </>
                  )
                ) : (
                  <>
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 rounded-full bg-edu-teal"></div>
                      <span className="text-gray-600">Answered</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 rounded-full bg-gray-200"></div>
                      <span className="text-gray-600">Unanswered</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 rounded-full border-2 border-edu-coral bg-white"></div>
                      <span className="text-gray-600">Flagged</span>
                    </div>
                  </>
                )}
              </div>

              {/* Statistics */}
              <div className="pt-6 border-t space-y-2 text-sm">
                {isReviewMode ? (
                  <>
                    <div className="mb-4 p-3 bg-edu-light-blue/20 rounded-lg">
                      <h4 className="font-semibold text-edu-navy mb-2 text-center">Test Results</h4>
                      <div className="space-y-2">
                        {calculatingScore ? (
                          <div className="text-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-edu-teal mx-auto mb-2"></div>
                            <span className="text-sm text-gray-600">Calculating scores...</span>
                          </div>
                        ) : testScore ? (
                          // Use weighted scoring when available
                          <>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Total Score:</span>
                              <span className="font-semibold text-edu-navy">
                                {testScore.totalEarnedPoints}/{testScore.totalMaxPoints}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Percentage Score:</span>
                              <span className="font-semibold text-edu-navy">
                                {testScore.percentageScore}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Questions Answered:</span>
                              <span className="font-semibold text-edu-navy">
                                {testScore.answeredQuestions}/{testScore.totalQuestions}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Accuracy:</span>
                              <span className="font-semibold text-edu-navy">
                                {testScore.correctAnswers}/{testScore.answeredQuestions}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Accuracy %:</span>
                              <span className="font-semibold text-edu-navy">
                                {testScore.answeredQuestions > 0 ? Math.round((testScore.correctAnswers / testScore.answeredQuestions) * 100) : 0}%
                              </span>
                            </div>
                          </>
                        ) : (
                          // Fallback to simple question count
                          <>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Total Score:</span>
                              <span className="font-semibold text-edu-navy">
                                {questions.filter((q, index) => answers[index] === q.correctAnswer).length}/{questions.length}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Percentage Score:</span>
                              <span className="font-semibold text-edu-navy">
                                {Math.round((questions.filter((q, index) => answers[index] === q.correctAnswer).length / questions.length) * 100)}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Accuracy:</span>
                              <span className="font-semibold text-edu-navy">
                                {questions.filter((q, index) => answers[index] === q.correctAnswer).length}/{Object.keys(answers).length}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Accuracy %:</span>
                              <span className="font-semibold text-edu-navy">
                                {Object.keys(answers).length > 0 ? Math.round((questions.filter((q, index) => answers[index] === q.correctAnswer).length / Object.keys(answers).length) * 100) : 0}%
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Answered:</span>
                      <span className="font-semibold text-edu-navy">
                        {questions.filter((_, index) => {
                          const question = questions[index];
                          const isWrittenResponseQuestion = question?.format === 'Written Response' || 
                                                          !question?.options || 
                                                          question?.options.length === 0;
                          
                          return isWrittenResponseQuestion 
                            ? (textAnswers[index] && textAnswers[index].trim().length > 0)
                            : answers[index] !== undefined;
                        }).length}/{questions.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Flagged:</span>
                      <span className="font-semibold text-edu-coral">
                        {flaggedQuestions.size}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Answered:</span>
                      <span className="font-semibold text-edu-navy">
                        {questions.filter((_, index) => {
                          const question = questions[index];
                          const isWrittenResponseQuestion = question?.format === 'Written Response' || 
                                                          !question?.options || 
                                                          question?.options.length === 0;
                          
                          return isWrittenResponseQuestion 
                            ? (textAnswers[index] && textAnswers[index].trim().length > 0)
                            : answers[index] !== undefined;
                        }).length}/{questions.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Flagged:</span>
                      <span className="font-semibold text-edu-coral">
                        {flaggedQuestions.size}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Collapsed State - Simple indicators */}
          {sidebarCollapsed && (
            <div className="flex-1 flex flex-col items-center space-y-2 overflow-y-auto p-2">
              {questions.map((_, questionIndex) => {
                const status = getQuestionStatus(questionIndex);
                let bgClass = "bg-gray-200";
                let borderClass = "";
                
                if (questionIndex === currentQuestionIndex) {
                  bgClass = "bg-edu-navy";
                  borderClass = status.flagged ? "border-2 border-edu-coral" : "";
                } else {
                  switch (status.primary) {
                    case 'correct':
                      bgClass = "bg-green-500";
                      break;
                    case 'incorrect':
                      bgClass = "bg-red-500";
                      break;
                    case 'answered':
                      bgClass = "bg-edu-teal";
                      break;
                    case 'flagged':
                      bgClass = "bg-white";
                      borderClass = "border-2 border-edu-coral";
                      break;
                    default:
                      bgClass = "bg-gray-200";
                  }
                  
                  // Add red border if flagged (for answered+flagged combinations)
                  if (status.flagged && status.primary !== 'flagged') {
                    borderClass = "border-2 border-edu-coral";
                  }
                }
                
                return (
                  <button
                    key={questionIndex}
                    onClick={() => onJumpToQuestion(questionIndex)}
                    className={cn(
                      "w-6 h-2 rounded-full transition-all duration-200",
                      bgClass,
                      borderClass
                    )}
                    title={`Question ${questionIndex + 1}`}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Exit Confirmation Dialog */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-edu-coral/10 rounded-full flex items-center justify-center">
                <LogOut size={20} className="text-edu-coral" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-edu-navy">
                  {isReviewMode ? "Exit Review?" : "Exit Test?"}
                </h3>
                <p className="text-sm text-gray-600">
                  {isReviewMode 
                    ? "Are you sure you want to exit the review?" 
                    : "Are you sure you want to exit this test?"
                  }
                </p>
              </div>
            </div>
            
            {!isReviewMode && (
              <div className="mb-6">
                <div className="bg-edu-light-blue/30 border border-edu-teal/20 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <AlertCircle size={16} className="text-edu-teal mt-0.5 shrink-0" />
                    <div className="text-sm text-edu-navy">
                      <p className="font-medium mb-1">Your progress will be saved</p>
                      <p>• All your answers will be saved</p>
                      <p>• The timer will be paused</p>
                      <p>• You can resume exactly where you left off</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 bg-edu-teal hover:bg-edu-teal/90 text-white border-edu-teal"
              >
                {isReviewMode ? "Continue Review" : "Continue Test"}
              </Button>
              <Button
                onClick={() => {
                  setShowExitConfirm(false);
                  onExit?.();
                }}
                className="flex-1 bg-edu-coral hover:bg-edu-coral/90 text-white"
              >
                {isReviewMode ? "Exit Review" : "Exit & Save"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 