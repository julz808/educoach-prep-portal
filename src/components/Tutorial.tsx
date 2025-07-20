import { useState, useEffect, createContext, useContext } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";

interface TutorialStep {
  target: string | null;
  title: string;
  content: string;
  position: "top" | "bottom" | "left" | "right" | "center";
}

const tutorialSteps: TutorialStep[] = [
  {
    target: null, // No target for welcome message
    title: "Welcome to EduCourse!",
    content: "We're excited to help you ace your next test! Let's take a quick tour of the platform to get you started.",
    position: "center"
  },
  {
    target: '[data-nav-id="diagnostic"]',
    title: "Diagnostic Test",
    content: "Start here! Take a comprehensive test to identify your strengths and areas for improvement. This helps us personalize your learning experience.",
    position: "right"
  },
  {
    target: '[data-nav-id="drills"]',
    title: "Skill Drills",
    content: "Practice specific skills with targeted exercises. Get instant feedback and improve weak areas identified in your diagnostic and practice tests.",
    position: "right"
  },
  {
    target: '[data-nav-id="practice"]',
    title: "Practice Tests",
    content: "Full-length practice exams that simulate real test conditions. Perfect for exam preparation and tracking your progress!",
    position: "right"
  },
  {
    target: '[data-nav-id="insights"]',
    title: "Performance Insights",
    content: "Track your progress with detailed analytics. See how you're improving across different test sections and sub-skills.",
    position: "right"
  }
];

// Tutorial Context
interface TutorialContextType {
  startTutorial: () => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
};

function TutorialComponent() {
  const [currentStep, setCurrentStep] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const { user } = useAuth();

  // Check if this is the user's first time
  const checkFirstTimeUser = () => {
    if (!user) return false;
    
    const tutorialShownKey = `tutorial_shown_${user.id}`;
    const hasSeenTutorial = localStorage.getItem(tutorialShownKey);
    
    return !hasSeenTutorial;
  };

  // Mark tutorial as seen
  const markTutorialAsSeen = () => {
    if (user) {
      const tutorialShownKey = `tutorial_shown_${user.id}`;
      localStorage.setItem(tutorialShownKey, 'true');
    }
  };

  // Start tutorial function (can be called manually)
  const startTutorial = () => {
    setCurrentStep(0);
    setShowTutorial(true);
  };

  // Removed auto-show on first visit - tutorial only shows when manually triggered

  useEffect(() => {
    if (showTutorial && tutorialSteps[currentStep]) {
      const step = tutorialSteps[currentStep];
      console.log("Tutorial - Looking for element:", step.target);
      
      if (step.target) {
        const element = document.querySelector(step.target);
        console.log("Tutorial - Found element:", element);
        if (element) {
          const rect = element.getBoundingClientRect();
          setTargetRect(rect);
          
          // Add highlight class
          element.classList.add("tutorial-highlight");
          
          return () => {
            element.classList.remove("tutorial-highlight");
          };
        }
      } else {
        // No target (welcome message), clear targetRect
        setTargetRect(null);
      }
    }
  }, [currentStep, showTutorial]);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setShowTutorial(false);
    markTutorialAsSeen(); // Mark as seen when closed
    setCurrentStep(0);
  };

  if (!showTutorial) return null;
  
  // For debugging: show tutorial even if targetRect is null
  console.log("Tutorial - showTutorial:", showTutorial, "targetRect:", targetRect);

  const step = tutorialSteps[currentStep];
  const isLastStep = currentStep === tutorialSteps.length - 1;

  // Calculate position
  let style: React.CSSProperties = {
    position: "fixed",
    zIndex: 9999,
  };

  if (step.position === "center" || !targetRect) {
    // Center position for welcome message or fallback
    style.left = "50%";
    style.top = "50%";
    style.transform = "translate(-50%, -50%)";
  } else if (targetRect && step.position === "right") {
    style.left = targetRect.right + 20;
    style.top = targetRect.top + (targetRect.height / 2) - 75;
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-[9998]"
        onClick={handleClose}
      />
      
      {/* Highlight box - only show if we have a target */}
      {targetRect && (
        <div
          className="fixed border-2 border-primary rounded-lg z-[9998]"
          style={{
            left: targetRect.left - 4,
            top: targetRect.top - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
          }}
        />
      )}

      {/* Tutorial card */}
      <Card 
        className="w-96 p-6 shadow-xl"
        style={style}
      >
        <button
          onClick={handleClose}
          className="absolute right-2 top-2 p-1 rounded-lg hover:bg-gray-100"
        >
          <X className="h-4 w-4" />
        </button>

        <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
        <p className="text-base text-gray-600 mb-4">{step.content}</p>
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Step {currentStep + 1} of {tutorialSteps.length}
          </span>
          
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep(currentStep - 1)}
              >
                Previous
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleNext}
            >
              {isLastStep ? "Finish" : "Next"}
            </Button>
          </div>
        </div>
      </Card>
    </>
  );
}

// Tutorial Provider Component
export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const [tutorialTrigger, setTutorialTrigger] = useState(0);

  const startTutorial = () => {
    setTutorialTrigger(prev => prev + 1);
  };

  return (
    <TutorialContext.Provider value={{ startTutorial }}>
      {children}
      <TutorialComponent key={tutorialTrigger} />
    </TutorialContext.Provider>
  );
}

// Export Tutorial for backward compatibility
export const Tutorial = TutorialProvider;