
import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Flag, Clock, ChevronLeft, ChevronRight, Bookmark } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Mock question data
const subjects = ['Mathematics', 'English', 'Science'];
const topics = {
  'Mathematics': ['Numbers', 'Algebra', 'Geometry', 'Statistics'],
  'English': ['Reading', 'Writing', 'Grammar', 'Vocabulary'],
  'Science': ['Biology', 'Chemistry', 'Physics', 'Earth Science']
};
const subSkills = {
  'Numbers': ['Fractions', 'Decimals', 'Percentages', 'Ratios'],
  'Reading': ['Comprehension', 'Analysis', 'Inference', 'Main Idea'],
  'Biology': ['Cells', 'Systems', 'Ecology', 'Genetics']
};

// Mock question
const mockQuestion = {
  id: 1,
  text: "What is 3/4 of 28?",
  options: ["18", "21", "24", "27"],
  correctAnswer: 1,
  explanation: "To find 3/4 of 28, multiply 3/4 × 28 = 3 × 7 = 21."
};

const Drill = () => {
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [subSkill, setSubSkill] = useState('');
  const [showQuestion, setShowQuestion] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [immediateFeedback, setImmediateFeedback] = useState(true);
  const [timeLeft, setTimeLeft] = useState(60); // 60 seconds per question
  
  const handleStartDrill = () => {
    if (subject && topic && subSkill) {
      setShowQuestion(true);
    }
  };
  
  const handleOptionSelect = (index: number) => {
    setSelectedOption(index);
    if (immediateFeedback) {
      setShowFeedback(true);
    }
  };
  
  const handleSubmit = () => {
    if (!immediateFeedback && selectedOption !== null) {
      setShowFeedback(true);
    }
  };
  
  const handleNext = () => {
    setSelectedOption(null);
    setShowFeedback(false);
    // In a real app, you'd fetch the next question
  };

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
                  {subjects.map((sub) => (
                    <SelectItem key={sub} value={sub}>{sub}</SelectItem>
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
                    {topics[subject as keyof typeof topics]?.map((t) => (
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
                    {subSkills[topic as keyof typeof subSkills]?.map((skill) => (
                      <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <button 
              onClick={handleStartDrill}
              disabled={!subject || !topic || !subSkill}
              className={`w-full btn-primary mt-4 ${(!subject || !topic || !subSkill) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Start Practice
            </button>
          </div>
        </Card>
      ) : (
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
              <span className="text-sm text-edu-navy/70">Question 1 of 10</span>
              <button className="text-edu-navy/70 hover:text-edu-navy flex items-center gap-1">
                <Flag size={16} />
                <span className="text-sm">Flag</span>
              </button>
            </div>
            
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">{mockQuestion.text}</h2>
              {/* If there was an image for the question, it would go here */}
            </div>
            
            <div className="space-y-3 mb-8">
              {mockQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleOptionSelect(index)}
                  className={`w-full p-4 text-left rounded-lg border transition-colors ${
                    selectedOption === index
                      ? 'border-edu-teal bg-edu-teal/10'
                      : 'border-gray-200 hover:border-edu-teal/50'
                  } ${
                    showFeedback && index === mockQuestion.correctAnswer
                      ? 'border-green-500 bg-green-50'
                      : ''
                  } ${
                    showFeedback && selectedOption === index && index !== mockQuestion.correctAnswer
                      ? 'border-red-500 bg-red-50'
                      : ''
                  }`}
                >
                  <span className="font-medium">{String.fromCharCode(65 + index)}.</span> {option}
                </button>
              ))}
            </div>
            
            {showFeedback && (
              <div className="mb-6 p-4 bg-edu-light-blue rounded-lg">
                <h3 className="font-semibold mb-2">Explanation</h3>
                <p>{mockQuestion.explanation}</p>
              </div>
            )}
            
            <div className="flex justify-between">
              <button className="btn-secondary bg-white border border-edu-teal/50 text-edu-navy hover:bg-edu-light-blue">
                <ChevronLeft size={16} className="mr-1" />
                Skip
              </button>
              
              {!showFeedback ? (
                <button 
                  onClick={handleSubmit}
                  disabled={selectedOption === null}
                  className={`btn-primary ${selectedOption === null ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Submit
                </button>
              ) : (
                <button onClick={handleNext} className="btn-primary">
                  Next
                  <ChevronRight size={16} className="ml-1" />
                </button>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Drill;
