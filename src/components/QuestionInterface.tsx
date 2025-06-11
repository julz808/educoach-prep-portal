import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Clock, Flag, CheckCircle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatQuestionText, cleanOptionText, formatExplanationText } from '@/utils/textFormatting';

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
}

interface QuestionInterfaceProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  timeRemaining?: number;
  onAnswer: (answerIndex: number, confidence?: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  onFlag: () => void;
  showFeedback?: boolean;
  canGoBack?: boolean;
  canGoNext?: boolean;
  isReviewMode?: boolean;
}

export const QuestionInterface: React.FC<QuestionInterfaceProps> = ({
  question,
  questionNumber,
  totalQuestions,
  timeRemaining,
  onAnswer,
  onNext,
  onPrevious,
  onFlag,
  showFeedback = false,
  canGoBack = true,
  canGoNext = false,
  isReviewMode = false
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [confidence, setConfidence] = useState<number>(3);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const progressPercentage = (questionNumber / totalQuestions) * 100;
  const hasPassage = question?.passageContent && question.passageContent.trim().length > 0;

  const handleOptionSelect = (index: number) => {
    if (showFeedback && !isReviewMode) return;
    
    setSelectedAnswer(index);
    setIsConfirmed(false);
    setShowConfirmation(false);
    
    // For backward compatibility, immediately call onAnswer
    onAnswer(index, confidence);
  };

  const handleConfirmAnswer = () => {
    if (selectedAnswer === null) return;
    
    setIsConfirmed(true);
    onAnswer(selectedAnswer, confidence);
  };

  const handleSubmitWithConfidence = () => {
    setShowConfirmation(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getOptionClassName = (index: number) => {
    const baseClass = "w-full p-4 text-left rounded-xl border-2 transition-all duration-200 group hover:border-edu-teal/60";
    
    if (showFeedback) {
      if (index === question.correctAnswer) {
        return cn(baseClass, "border-green-500 bg-green-50 hover:border-green-500");
      }
      if (selectedAnswer === index && index !== question.correctAnswer) {
        return cn(baseClass, "border-red-500 bg-red-50 hover:border-red-500");
      }
      return cn(baseClass, "border-gray-200 bg-gray-50");
    }
    
    if (selectedAnswer === index) {
      return cn(baseClass, "border-edu-teal bg-edu-teal/10 shadow-sm");
    }
    
    return cn(baseClass, "border-gray-200 hover:border-edu-teal/40 hover:bg-edu-teal/5");
  };

  // Dual panel layout for reading questions
  if (hasPassage) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Progress and Time */}
        <div className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center space-x-4">
            <div className="text-sm font-medium text-edu-navy">
              Question {questionNumber} of {totalQuestions}
            </div>
            <div className="w-48">
              <Progress value={progressPercentage} className="h-2" />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {timeRemaining && (
              <div className={cn(
                "flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium",
                timeRemaining < 30 ? "bg-red-100 text-red-700" : "bg-edu-light-blue text-edu-navy"
              )}>
                <Clock size={16} />
                <span>{formatTime(timeRemaining)}</span>
              </div>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={onFlag}
              className="flex items-center space-x-1"
            >
              <Flag size={16} />
              <span>Flag</span>
            </Button>
          </div>
        </div>

        {/* Dual Panel Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Reading Passage Panel */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-edu-navy mb-4">Reading Passage</h3>
              <div className="max-h-[500px] overflow-y-auto prose prose-gray max-w-none text-sm leading-relaxed">
                {question.passageContent?.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-4 text-gray-800">
                    {paragraph}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Question Panel */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Question Metadata */}
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                  <div className="flex items-center space-x-4 text-sm text-edu-navy/70">
                    <span className="bg-edu-teal/10 px-3 py-1 rounded-full">{question.topic}</span>
                    <span className="bg-edu-coral/10 px-3 py-1 rounded-full">{question.subSkill}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-sm text-edu-navy/70">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "w-2 h-2 rounded-full",
                          i < question.difficulty ? "bg-edu-coral" : "bg-gray-200"
                        )}
                      />
                    ))}
                  </div>
                </div>

                {/* Question Text */}
                <div>
                  <h2 className="text-xl font-semibold leading-relaxed text-edu-navy mb-4 whitespace-pre-line">
                    {formatQuestionText(question.text)}
                  </h2>
                </div>

                {/* Answer Options */}
                {question.options && (
                  <div className="space-y-3">
                    {question.options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handleOptionSelect(index)}
                        disabled={showFeedback && !isReviewMode}
                        className={getOptionClassName(index)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 mt-0.5",
                            selectedAnswer === index 
                              ? "bg-edu-teal text-white" 
                              : "bg-gray-100 text-gray-600 group-hover:bg-edu-teal/20"
                          )}>
                            {String.fromCharCode(65 + index)}
                          </div>
                          <div className="text-left leading-relaxed">{cleanOptionText(option)}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Feedback Section */}
                {showFeedback && question.explanation && (
                  <div className="p-6 bg-gradient-to-r from-edu-light-blue to-white rounded-xl border-l-4 border-edu-teal">
                    <div className="flex items-start space-x-3">
                      <div className="shrink-0 mt-0.5">
                        {selectedAnswer === question.correctAnswer ? (
                          <CheckCircle size={20} className="text-green-600" />
                        ) : (
                          <AlertCircle size={20} className="text-red-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-edu-navy mb-2">
                          {selectedAnswer === question.correctAnswer ? "Correct!" : "Not quite right"}
                        </h3>
                        <p className="text-edu-navy/80 leading-relaxed">{formatExplanationText(question.explanation)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={onPrevious}
            disabled={!canGoBack}
            className="flex items-center space-x-2 px-6 py-2"
          >
            <ChevronLeft size={18} />
            <span>Previous</span>
          </Button>

          <div className="flex items-center space-x-3">
            {(isConfirmed || showFeedback || selectedAnswer !== null) && (
              <Button
                onClick={onNext}
                disabled={!canGoNext}
                className="bg-edu-coral hover:bg-edu-coral/90 text-white px-8 py-2 flex items-center space-x-2"
              >
                <span>{questionNumber === totalQuestions ? "Finish" : "Next"}</span>
                <ChevronRight size={18} />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Single panel layout for non-reading questions
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header with Progress and Time */}
      <div className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm border">
        <div className="flex items-center space-x-4">
          <div className="text-sm font-medium text-edu-navy">
            Question {questionNumber} of {totalQuestions}
          </div>
          <div className="w-48">
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {timeRemaining && (
            <div className={cn(
              "flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium",
              timeRemaining < 30 ? "bg-red-100 text-red-700" : "bg-edu-light-blue text-edu-navy"
            )}>
              <Clock size={16} />
              <span>{formatTime(timeRemaining)}</span>
            </div>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={onFlag}
            className="flex items-center space-x-1"
          >
            <Flag size={16} />
            <span>Flag</span>
          </Button>
        </div>
      </div>

      {/* Question Content */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-8">
          {/* Question Metadata */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
            <div className="flex items-center space-x-4 text-sm text-edu-navy/70">
              <span className="bg-edu-teal/10 px-3 py-1 rounded-full">{question.topic}</span>
              <span className="bg-edu-coral/10 px-3 py-1 rounded-full">{question.subSkill}</span>
            </div>
            <div className="flex items-center space-x-1 text-sm text-edu-navy/70">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-2 h-2 rounded-full",
                    i < question.difficulty ? "bg-edu-coral" : "bg-gray-200"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Question Text */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold leading-relaxed text-edu-navy mb-4 whitespace-pre-line">
              {formatQuestionText(question.text)}
            </h2>
          </div>

          {/* Answer Options */}
          {question.options && (
            <div className="space-y-3 mb-8">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleOptionSelect(index)}
                  disabled={showFeedback && !isReviewMode}
                  className={getOptionClassName(index)}
                >
                  <div className="flex items-start space-x-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 mt-0.5",
                      selectedAnswer === index 
                        ? "bg-edu-teal text-white" 
                        : "bg-gray-100 text-gray-600 group-hover:bg-edu-teal/20"
                    )}>
                      {String.fromCharCode(65 + index)}
                    </div>
                    <div className="text-left leading-relaxed">{cleanOptionText(option)}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Confidence Selector (only when answer selected but not confirmed) */}
          {selectedAnswer !== null && !isConfirmed && !showFeedback && (
            <div className="mb-6 p-4 bg-edu-light-blue rounded-xl">
              <div className="mb-3">
                <label className="text-sm font-medium text-edu-navy">
                  How confident are you in this answer?
                </label>
              </div>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    onClick={() => setConfidence(level)}
                    className={cn(
                      "w-10 h-10 rounded-full text-sm font-semibold transition-all",
                      confidence === level
                        ? "bg-edu-teal text-white shadow-md"
                        : "bg-white text-edu-navy hover:bg-edu-teal/10"
                    )}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <div className="text-xs text-edu-navy/70 mt-2">
                1 = Not confident, 5 = Very confident
              </div>
            </div>
          )}

          {/* Feedback Section */}
          {showFeedback && question.explanation && (
            <div className="mb-6 p-6 bg-gradient-to-r from-edu-light-blue to-white rounded-xl border-l-4 border-edu-teal">
              <div className="flex items-start space-x-3">
                <div className="shrink-0 mt-0.5">
                  {selectedAnswer === question.correctAnswer ? (
                    <CheckCircle size={20} className="text-green-600" />
                  ) : (
                    <AlertCircle size={20} className="text-red-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-edu-navy mb-2">
                    {selectedAnswer === question.correctAnswer ? "Correct!" : "Not quite right"}
                  </h3>
                  <p className="text-edu-navy/80 leading-relaxed">{formatExplanationText(question.explanation)}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={!canGoBack}
          className="flex items-center space-x-2 px-6 py-2"
        >
          <ChevronLeft size={18} />
          <span>Previous</span>
        </Button>

        <div className="flex items-center space-x-3">
          {!isConfirmed && !showFeedback && selectedAnswer !== null && (
            <Button
              onClick={handleConfirmAnswer}
              className="bg-edu-teal hover:bg-edu-teal/90 text-white px-8 py-2"
            >
              Confirm Answer
            </Button>
          )}
          
          {(isConfirmed || showFeedback) && (
            <Button
              onClick={onNext}
              disabled={!canGoNext}
              className="bg-edu-coral hover:bg-edu-coral/90 text-white px-8 py-2 flex items-center space-x-2"
            >
              <span>{questionNumber === totalQuestions ? "Finish" : "Next"}</span>
              <ChevronRight size={18} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}; 