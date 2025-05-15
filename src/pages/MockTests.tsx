
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flag, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { practiceTests } from "../data/dummyData";
import { useUser } from "../context/UserContext";
import { useTestType } from "../context/TestTypeContext";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { TestResult } from "../types";

const PracticeTests = () => {
  const navigate = useNavigate();
  const { updateAfterTest } = useUser();
  const { testType } = useTestType();
  const [activeTestId, setActiveTestId] = useState<number | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  
  // Filter tests based on current test type
  const filteredTests = practiceTests.filter(test => {
    if (testType === 'NAPLAN') return test.title.includes('NAPLAN');
    if (testType === 'Selective Entry') return test.title.includes('Selective');
    if (testType === 'ACER Scholarship') return test.title.includes('ACER');
    if (testType === 'EduTest') return test.title.includes('EduTest');
    return true;
  });
  
  // Reset active test when test type changes
  useEffect(() => {
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    
    setActiveTestId(null);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setShowFeedback(false);
  }, [testType]);
  
  const handleStartTest = (testId: number) => {
    const test = practiceTests.find(t => t.id === testId);
    if (!test || !test.questionsList.length) return;
    
    setActiveTestId(testId);
    setCurrentQuestionIndex(0);
    setCorrectAnswers(0);
    setSelectedOption(null);
    setShowFeedback(false);
    
    // Start timer
    setTimeLeft(test.durationMinutes * 60); // Convert minutes to seconds
    setStartTime(new Date());
    
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    setTimerInterval(interval);
  };
  
  const handleOptionSelect = (index: number) => {
    setSelectedOption(index);
    
    const activeTest = practiceTests.find(t => t.id === activeTestId);
    if (!activeTest || !activeTest.questionsList[currentQuestionIndex]) return;
    
    const isCorrect = index === activeTest.questionsList[currentQuestionIndex].correctAnswer;
    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
    }
    
    setShowFeedback(true);
  };
  
  const handleNext = () => {
    const activeTest = practiceTests.find(t => t.id === activeTestId);
    if (!activeTest) return;
    
    setSelectedOption(null);
    setShowFeedback(false);
    
    if (currentQuestionIndex < activeTest.questionsList.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Test is complete
      finishTest();
    }
  };
  
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setSelectedOption(null);
      setShowFeedback(false);
    }
  };
  
  const finishTest = () => {
    // Clean up timer
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    
    const activeTest = practiceTests.find(t => t.id === activeTestId);
    if (!activeTest || !startTime) return;
    
    // Calculate time spent
    const endTime = new Date();
    const timeSpentMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
    
    // Calculate score
    const totalQuestions = activeTest.questionsList.length;
    const score = Math.round((correctAnswers / totalQuestions) * 100);
    
    // Create topic and subskill results
    const topicResults: { [key: string]: number } = {};
    const subSkillResults: { [key: string]: number } = {};
    
    // Track results by topic and subskill
    const topicCounts: { [key: string]: { correct: number, total: number } } = {};
    const subSkillCounts: { [key: string]: { correct: number, total: number } } = {};
    
    activeTest.questionsList.forEach((question, index) => {
      // For simplicity, let's assume the user answered correctly based on correctAnswers count
      // In a real app, you'd track which specific questions were answered correctly
      const isCorrect = index < correctAnswers;
      
      // Update topic counts
      if (!topicCounts[question.topic]) {
        topicCounts[question.topic] = { correct: 0, total: 0 };
      }
      topicCounts[question.topic].total++;
      if (isCorrect) {
        topicCounts[question.topic].correct++;
      }
      
      // Update subskill counts
      if (!subSkillCounts[question.subSkill]) {
        subSkillCounts[question.subSkill] = { correct: 0, total: 0 };
      }
      subSkillCounts[question.subSkill].total++;
      if (isCorrect) {
        subSkillCounts[question.subSkill].correct++;
      }
    });
    
    // Calculate percentages
    Object.entries(topicCounts).forEach(([topic, counts]) => {
      topicResults[topic] = Math.round((counts.correct / counts.total) * 100);
    });
    
    Object.entries(subSkillCounts).forEach(([subSkill, counts]) => {
      subSkillResults[subSkill] = Math.round((counts.correct / counts.total) * 100);
    });
    
    // Create test result
    const testResult: TestResult = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      testType: testType,
      testId: activeTest.id,
      testName: activeTest.title,
      score,
      totalQuestions,
      timeSpentMinutes,
      topicResults,
      subSkillResults
    };
    
    // Update user performance
    updateAfterTest(testResult);
    
    // Show toast
    toast({
      title: "Practice Test Completed!",
      description: `You scored ${score}% on ${activeTest.title}. Great job!`,
    });
    
    // Reset state
    setActiveTestId(null);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setShowFeedback(false);
    
    // Navigate to insights
    navigate("/dashboard/insights");
  };
  
  const activeTest = practiceTests.find(t => t.id === activeTestId);
  const currentQuestion = activeTest?.questionsList[currentQuestionIndex];
  
  // Format time remaining
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-edu-navy mb-2">Practice Tests</h1>
        <p className="text-edu-navy/70">
          Full-length simulated exams to help you prepare for your real tests.
        </p>
      </div>

      {!activeTestId ? (
        // List of practice tests
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTests.map((test) => (
            <Card key={test.id} className="border border-edu-teal/10 hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-edu-navy">{test.title}</CardTitle>
                <CardDescription>{test.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-edu-navy/60">Questions</p>
                    <p className="font-medium">{test.questions}</p>
                  </div>
                  <div>
                    <p className="text-edu-navy/60">Duration</p>
                    <p className="font-medium">{test.duration}</p>
                  </div>
                  <div>
                    <p className="text-edu-navy/60">Difficulty</p>
                    <p className="font-medium">{test.difficulty}</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full bg-edu-teal hover:bg-edu-teal/90"
                  onClick={() => handleStartTest(test.id)}
                  disabled={!test.questionsList.length}
                >
                  Start Test
                </Button>
              </CardFooter>
            </Card>
          ))}
          
          {filteredTests.length === 0 && (
            <div className="col-span-full text-center py-10">
              <p>No practice tests available for the selected test type.</p>
            </div>
          )}
        </div>
      ) : currentQuestion ? (
        // Active test view
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-edu-navy/70">
              <span>{activeTest?.title}</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="bg-edu-navy/10 px-3 py-1 rounded-full flex items-center gap-1">
                <Clock size={14} />
                <span className="text-sm">
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>
          </div>
          
          <Card className="edu-card">
            <div className="flex justify-between mb-6">
              <span className="text-sm text-edu-navy/70">
                Question {currentQuestionIndex + 1} of {activeTest?.questionsList.length}
              </span>
              <button className="text-edu-navy/70 hover:text-edu-navy flex items-center gap-1">
                <Flag size={16} />
                <span className="text-sm">Flag</span>
              </button>
            </div>
            
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">{currentQuestion.text}</h2>
            </div>
            
            {currentQuestion.options && (
              <div className="space-y-3 mb-8">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => !showFeedback && handleOptionSelect(index)}
                    disabled={showFeedback}
                    className={`w-full p-4 text-left rounded-lg border transition-colors ${
                      selectedOption === index
                        ? 'border-edu-teal bg-edu-teal/10'
                        : 'border-gray-200 hover:border-edu-teal/50'
                    } ${
                      showFeedback && index === currentQuestion.correctAnswer
                        ? 'border-green-500 bg-green-50'
                        : ''
                    } ${
                      showFeedback && selectedOption === index && index !== currentQuestion.correctAnswer
                        ? 'border-red-500 bg-red-50'
                        : ''
                    }`}
                  >
                    <span className="font-medium">{String.fromCharCode(65 + index)}.</span> {option}
                  </button>
                ))}
              </div>
            )}
            
            {showFeedback && (
              <div className="mb-6 p-4 bg-edu-light-blue rounded-lg">
                <h3 className="font-semibold mb-2">Explanation</h3>
                <p>{currentQuestion.explanation}</p>
              </div>
            )}
            
            <div className="flex justify-between">
              <Button
                variant="outline"
                disabled={currentQuestionIndex === 0}
                onClick={handlePrevious}
                className="bg-white border border-edu-teal/50 text-edu-navy hover:bg-edu-light-blue"
              >
                <ChevronLeft size={16} className="mr-1" />
                Previous
              </Button>
              
              {!showFeedback ? (
                <Button
                  onClick={() => handleOptionSelect(0)}
                  disabled={selectedOption !== null}
                  className="bg-edu-teal hover:bg-edu-teal/90"
                >
                  Submit
                </Button>
              ) : (
                <Button onClick={handleNext} className="bg-edu-teal hover:bg-edu-teal/90">
                  {currentQuestionIndex < (activeTest?.questionsList.length || 0) - 1 ? 'Next' : 'Finish'}
                  <ChevronRight size={16} className="ml-1" />
                </Button>
              )}
            </div>
          </Card>
        </div>
      ) : (
        <div className="text-center py-10">
          <p>No questions available for this test.</p>
          <Button 
            className="mt-4 bg-edu-teal hover:bg-edu-teal/90"
            onClick={() => setActiveTestId(null)}
          >
            Back to Tests
          </Button>
        </div>
      )}
    </div>
  );
};

export default PracticeTests;
