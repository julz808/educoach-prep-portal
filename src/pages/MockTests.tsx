
import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { 
  Clock, Search, BookOpen, Flag, ChevronLeft, ChevronRight, 
  Maximize2, AlertTriangle, Check, X
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from "@/components/ui/alert-dialog";

// Mock test data
const mockTests = [
  {
    id: 1,
    title: "Year 9 NAPLAN Reading",
    category: "Reading",
    questions: 40,
    duration: 65, // minutes
    difficulty: "Medium"
  },
  {
    id: 2,
    title: "Year 9 NAPLAN Numeracy",
    category: "Mathematics",
    questions: 48,
    duration: 65, // minutes
    difficulty: "Hard"
  },
  {
    id: 3,
    title: "Selective School Practice Test",
    category: "Mixed",
    questions: 60,
    duration: 90, // minutes
    difficulty: "Hard"
  },
  {
    id: 4,
    title: "Scholarship Test Sample",
    category: "Mixed",
    questions: 50,
    duration: 75, // minutes
    difficulty: "Very Hard"
  }
];

// Mock question for test environment
const mockTestQuestions = [
  { id: 1, text: "In the passage, what is the main theme discussed by the author?", flagged: false },
  { id: 2, text: "Calculate the value of x in the equation: 3x + 7 = 22", flagged: false },
  { id: 3, text: "Which of the following correctly describes the relationship between A and B?", flagged: false }
];

const MockTests = () => {
  const [activeTest, setActiveTest] = useState<number | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(65 * 60); // 65 minutes in seconds
  const [showDialog, setShowDialog] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState<number[]>([]);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleStartTest = (testId: number) => {
    setActiveTest(testId);
    // In a real app, you'd fetch the test questions
  };
  
  const handleNextQuestion = () => {
    if (currentQuestion < mockTestQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };
  
  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };
  
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullScreen(false);
      }
    }
  };
  
  const toggleFlagged = (questionId: number) => {
    if (flaggedQuestions.includes(questionId)) {
      setFlaggedQuestions(flaggedQuestions.filter(id => id !== questionId));
    } else {
      setFlaggedQuestions([...flaggedQuestions, questionId]);
    }
  };
  
  const handleSubmitTest = () => {
    setShowAlert(true);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-edu-navy mb-1">Mock Tests</h1>
        <p className="text-edu-navy/70">Full-length exam simulations to test your knowledge</p>
      </div>
      
      {!activeTest ? (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Available Tests</h2>
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-edu-navy/50" />
              <input 
                type="text"
                placeholder="Search tests..."
                className="pl-10 pr-4 py-2 rounded-full border border-edu-teal/20 focus:outline-none focus:ring-2 focus:ring-edu-teal/20 bg-white"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockTests.map((test) => (
              <Card key={test.id} className="edu-card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">{test.title}</h3>
                    <div className="text-sm text-edu-navy/70">{test.category}</div>
                  </div>
                  <div>
                    <span className={`px-3 py-1 rounded-full text-xs ${
                      test.difficulty === "Hard" || test.difficulty === "Very Hard"
                        ? 'bg-edu-coral/20 text-edu-coral'
                        : 'bg-edu-teal/20 text-edu-teal'
                    }`}>
                      {test.difficulty}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-4 mb-6">
                  <div className="text-sm">
                    <div className="text-edu-navy/70">Questions</div>
                    <div className="font-medium">{test.questions}</div>
                  </div>
                  
                  <div className="text-sm">
                    <div className="text-edu-navy/70">Time</div>
                    <div className="font-medium">{test.duration} minutes</div>
                  </div>
                </div>
                
                <button 
                  onClick={() => handleStartTest(test.id)}
                  className="btn-primary w-full"
                >
                  Start Test
                </button>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <div className="max-w-4xl mx-auto">
          {/* Test Header */}
          <div className="flex justify-between items-center bg-white rounded-lg p-4 mb-4 border border-edu-teal/10 sticky top-0 z-10">
            <div>
              <h2 className="font-semibold">Year 9 NAPLAN Reading</h2>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="bg-edu-light-blue px-4 py-1.5 rounded-full flex items-center gap-1">
                <Clock size={16} className="text-edu-navy/70" />
                <span>{formatTime(timeRemaining)}</span>
              </div>
              
              <button 
                onClick={toggleFullScreen}
                className="text-edu-navy/70 hover:text-edu-navy"
                aria-label="Toggle fullscreen"
              >
                <Maximize2 size={18} />
              </button>
            </div>
          </div>
          
          {/* Question Navigation */}
          <div className="bg-white rounded-lg p-4 mb-6 flex flex-wrap gap-2 border border-edu-teal/10">
            {Array.from({ length: 10 }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestion(index)}
                className={`h-10 w-10 rounded-full flex items-center justify-center text-sm ${
                  currentQuestion === index 
                    ? 'bg-edu-teal text-white' 
                    : flaggedQuestions.includes(index)
                    ? 'bg-edu-coral/20 text-edu-coral border border-edu-coral'
                    : 'bg-edu-light-blue text-edu-navy hover:bg-edu-teal/20'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
          
          {/* Question Content */}
          <Card className="edu-card mb-6">
            <div className="flex justify-between mb-6">
              <span className="text-sm text-edu-navy/70">Question {currentQuestion + 1} of 10</span>
              <button 
                className={`flex items-center gap-1 ${
                  flaggedQuestions.includes(currentQuestion)
                    ? 'text-edu-coral'
                    : 'text-edu-navy/70 hover:text-edu-navy'
                }`}
                onClick={() => toggleFlagged(currentQuestion)}
              >
                <Flag size={16} />
                <span className="text-sm">{flaggedQuestions.includes(currentQuestion) ? 'Flagged' : 'Flag'}</span>
              </button>
            </div>
            
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">
                {mockTestQuestions[currentQuestion]?.text || "Sample question text?"}
              </h2>
              
              <div className="prose max-w-none mb-6">
                <p>
                  This is a sample passage for the question. In a real test, this would contain relevant text for
                  the student to read and analyze to answer the question above.
                </p>
              </div>
            </div>
            
            <div className="space-y-3 mb-8">
              {['A', 'B', 'C', 'D'].map((option, index) => (
                <button
                  key={index}
                  className="w-full p-4 text-left rounded-lg border border-gray-200 hover:border-edu-teal/50 transition-colors"
                >
                  <span className="font-medium">{option}.</span> Sample answer option {index + 1}
                </button>
              ))}
            </div>
            
            <div className="flex justify-between">
              <button 
                onClick={handlePreviousQuestion}
                disabled={currentQuestion === 0}
                className={`btn-secondary bg-white border border-edu-teal/50 text-edu-navy hover:bg-edu-light-blue ${
                  currentQuestion === 0 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <ChevronLeft size={16} className="mr-1" />
                Previous
              </button>
              
              <button onClick={() => setShowDialog(true)} className="btn-primary bg-edu-coral">
                Submit Test
              </button>
              
              <button 
                onClick={handleNextQuestion}
                disabled={currentQuestion === mockTestQuestions.length - 1}
                className={`btn-secondary bg-white border border-edu-teal/50 text-edu-navy hover:bg-edu-light-blue ${
                  currentQuestion === mockTestQuestions.length - 1 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Next
                <ChevronRight size={16} className="ml-1" />
              </button>
            </div>
          </Card>
        </div>
      )}
      
      {/* Modal to confirm submission */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Summary</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center justify-between mb-4">
              <span>Total Questions</span>
              <span className="font-medium">10</span>
            </div>
            <div className="flex items-center justify-between mb-4">
              <span>Answered</span>
              <span className="font-medium">7</span>
            </div>
            <div className="flex items-center justify-between mb-4">
              <span>Unanswered</span>
              <span className="font-medium text-edu-coral">3</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Flagged</span>
              <span className="font-medium">{flaggedQuestions.length}</span>
            </div>
          </div>
          <DialogFooter>
            <button 
              className="btn-secondary bg-white border border-edu-teal/50 text-edu-navy hover:bg-edu-light-blue"
              onClick={() => setShowDialog(false)}
            >
              Return to Test
            </button>
            <button className="btn-primary" onClick={handleSubmitTest}>
              Submit Test
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Alert to confirm final submission */}
      <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Your Test?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to submit your test? This action cannot be undone.
              You have 3 unanswered questions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="btn-secondary bg-white border border-edu-teal/50 text-edu-navy hover:bg-edu-light-blue">
              No, Return to Test
            </AlertDialogCancel>
            <AlertDialogAction className="btn-primary">
              Yes, Submit Test
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MockTests;
