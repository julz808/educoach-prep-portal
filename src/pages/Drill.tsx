
import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Flag, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useUser } from "../context/UserContext";
import { useTestType } from "../context/TestTypeContext";
import { drillCategories, drillQuestions } from "../data/dummyData";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const Drill = () => {
  const navigate = useNavigate();
  const { updateAfterDrill } = useUser();
  const { testType } = useTestType();
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [subSkill, setSubSkill] = useState('');
  const [showQuestion, setShowQuestion] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [immediateFeedback, setImmediateFeedback] = useState(true);
  const [timeLeft, setTimeLeft] = useState(60); // 60 seconds per question
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  
  // Reset states when test type changes
  useEffect(() => {
    setSubject('');
    setTopic('');
    setSubSkill('');
    setShowQuestion(false);
  }, [testType]);
  
  // Reset timer when starting a drill or moving to a new question
  useEffect(() => {
    if (showQuestion) {
      setTimeLeft(60);
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [showQuestion, currentQuestionIndex]);
  
  const handleStartDrill = () => {
    if (subject && topic && subSkill) {
      setShowQuestion(true);
      setCurrentQuestionIndex(0);
      setCorrectAnswers(0);
      setStartTime(new Date());
    }
  };
  
  const handleOptionSelect = (index: number) => {
    setSelectedOption(index);
    if (immediateFeedback) {
      setShowFeedback(true);
      
      // Check if answer is correct
      if (currentQuestions && currentQuestions[currentQuestionIndex]) {
        const currentQuestion = currentQuestions[currentQuestionIndex];
        if (index === currentQuestion.correctAnswer) {
          setCorrectAnswers(prev => prev + 1);
        }
      }
    }
  };
  
  const handleSubmit = () => {
    if (!immediateFeedback && selectedOption !== null) {
      setShowFeedback(true);
      
      // Check if answer is correct
      if (currentQuestions && currentQuestions[currentQuestionIndex]) {
        const currentQuestion = currentQuestions[currentQuestionIndex];
        if (selectedOption === currentQuestion.correctAnswer) {
          setCorrectAnswers(prev => prev + 1);
        }
      }
    }
  };
  
  const handleNext = () => {
    setSelectedOption(null);
    setShowFeedback(false);
    
    if (currentQuestionIndex < currentQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Drill is complete
      finishDrill();
    }
  };
  
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setSelectedOption(null);
      setShowFeedback(false);
    }
  };
  
  const finishDrill = () => {
    if (!startTime) return;
    
    // Calculate time spent
    const endTime = new Date();
    const timeSpentMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
    
    // Update user performance
    updateAfterDrill(
      topic,
      subSkill,
      correctAnswers,
      currentQuestions.length,
      timeSpentMinutes
    );
    
    // Show toast and reset state
    const score = Math.round((correctAnswers / currentQuestions.length) * 100);
    toast({
      title: "Drill Completed!",
      description: `You scored ${score}% on the ${subSkill} drill. Great job!`,
    });
    
    // Reset state
    setShowQuestion(false);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setShowFeedback(false);
    setCorrectAnswers(0);
    
    // Navigate to dashboard
    navigate("/dashboard");
  };
  
  // Filter drill categories based on test type
  const filteredDrillCategories = drillCategories.filter(cat => {
    if (testType === 'NAPLAN') return ['Mathematics', 'English'].includes(cat.subject);
    if (testType === 'Selective Entry') return true; // All categories apply
    if (testType === 'ACER Scholarship') return true; // All categories apply
    if (testType === 'EduTest') return ['Mathematics', 'English', 'Science'].includes(cat.subject);
    return true;
  });
  
  // Get available topics for selected subject
  const availableTopics = subject ? 
    filteredDrillCategories.find(cat => cat.subject === subject)?.topics || {} : {};
  
  // Get available subskills for selected topic
  const availableSubSkills = topic && subject ? 
    availableTopics[topic] || [] : [];
  
  // Get questions for selected topic and subskill
  const currentQuestions = topic && subSkill && drillQuestions[topic] && drillQuestions[topic][subSkill] ? 
    drillQuestions[topic][subSkill] : [];
  
  // Current question
  const currentQuestion = showQuestion && currentQuestions.length > 0 ? 
    currentQuestions[currentQuestionIndex] : null;

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-edu-navy mb-1">Drill Practice</h1>
        <p className="text-edu-navy/70">Select a subject and topic to practice specific skills</p>
      </div>
      
      {!showQuestion ? (
        <Card className="edu-card max-w-3xl mx-auto">
          <h2 className="text-xl font-semibold mb-6">Select your drill</h2>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select onValueChange={setSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {filteredDrillCategories.map((cat) => (
                    <SelectItem key={cat.subject} value={cat.subject}>{cat.subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {subject && (
              <div className="space-y-2">
                <Label>Topic</Label>
                <Select onValueChange={setTopic}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select topic" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(availableTopics).map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {topic && (
              <div className="space-y-2">
                <Label>Sub-skill</Label>
                <Select onValueChange={setSubSkill}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sub-skill" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSubSkills.map((skill) => (
                      <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <Button 
              onClick={handleStartDrill}
              disabled={!subject || !topic || !subSkill || !currentQuestions.length}
              className={`w-full btn-primary mt-4 ${(!subject || !topic || !subSkill || !currentQuestions.length) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Start Practice
            </Button>
            
            {subSkill && !currentQuestions.length && (
              <p className="text-sm text-red-500 text-center mt-2">
                No questions available for this skill. Please select another sub-skill.
              </p>
            )}
          </div>
        </Card>
      ) : currentQuestion ? (
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-edu-navy/70">
              <span>{subject}</span>
              <ChevronRight size={16} />
              <span>{topic}</span>
              <ChevronRight size={16} />
              <span>{subSkill}</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="immediate-feedback"
                  checked={immediateFeedback}
                  onCheckedChange={setImmediateFeedback}
                />
                <Label htmlFor="immediate-feedback" className="text-sm">
                  Immediate Feedback
                </Label>
              </div>
              
              <div className="bg-edu-navy/10 px-3 py-1 rounded-full flex items-center gap-1">
                <Clock size={14} />
                <span className="text-sm">{timeLeft}s</span>
              </div>
            </div>
          </div>
          
          <Card className="edu-card">
            <div className="flex justify-between mb-6">
              <span className="text-sm text-edu-navy/70">Question {currentQuestionIndex + 1} of {currentQuestions.length}</span>
              <button className="text-edu-navy/70 hover:text-edu-navy flex items-center gap-1">
                <Flag size={16} />
                <span className="text-sm">Flag</span>
              </button>
            </div>
            
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">{currentQuestion.text}</h2>
              {/* If there was an image for the question, it would go here */}
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
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className="btn-secondary bg-white border border-edu-teal/50 text-edu-navy hover:bg-edu-light-blue"
              >
                <ChevronLeft size={16} className="mr-1" />
                Previous
              </Button>
              
              {!showFeedback ? (
                <Button 
                  onClick={handleSubmit}
                  disabled={selectedOption === null}
                  className={`btn-primary ${selectedOption === null ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Submit
                </Button>
              ) : (
                <Button onClick={handleNext} className="btn-primary">
                  {currentQuestionIndex < currentQuestions.length - 1 ? 'Next' : 'Finish'}
                  <ChevronRight size={16} className="ml-1" />
                </Button>
              )}
            </div>
          </Card>
        </div>
      ) : (
        <div className="text-center py-10">
          <p>No questions available for this drill.</p>
          <Button 
            className="mt-4"
            onClick={() => setShowQuestion(false)}
          >
            Back to Drills
          </Button>
        </div>
      )}
    </div>
  );
};

export default Drill;
