import { useState, useEffect, createContext, useContext } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

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

interface TutorialComponentProps {
  initialShow?: boolean;
  onClose?: () => void;
}

function TutorialComponent({ initialShow = false, onClose }: TutorialComponentProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showTutorial, setShowTutorial] = useState(initialShow);
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

  // Update tutorial state when props change
  useEffect(() => {
    if (initialShow !== undefined) {
      setShowTutorial(initialShow);
    }
  }, [initialShow]);

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
    if (onClose) {
      onClose();
    }
  };

  if (!showTutorial) return null;
  
  // For debugging: show tutorial even if targetRect is null
  console.log("Tutorial - showTutorial:", showTutorial, "targetRect:", targetRect);

  const step = tutorialSteps[currentStep];
  const isLastStep = currentStep === tutorialSteps.length - 1;
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calculate position - use center for mobile, calculated position for desktop
  let style: React.CSSProperties = {
    position: "fixed",
    zIndex: 9999,
  };

  if (isMobile || step.position === "center" || !targetRect) {
    // Center position for mobile, welcome message, or fallback
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
      
      {/* Highlight box - only show if we have a target and not mobile */}
      {targetRect && !isMobile && (
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
        className={cn(
          "shadow-xl relative",
          isMobile 
            ? "w-[90vw] max-w-sm p-4 mx-4" 
            : "w-96 p-6"
        )}
        style={style}
      >
        <button
          onClick={handleClose}
          className="absolute right-2 top-2 p-1 rounded-lg hover:bg-gray-100 z-10"
        >
          <X className={cn("w-4 h-4", isMobile && "w-5 h-5")} />
        </button>

        {/* Mobile carousel mode */}
        {isMobile ? (
          <div className="text-center">
            <div className="mb-4">
              <div className="flex justify-center mb-2">
                <div className="flex gap-1">
                  {tutorialSteps.map((_, index) => (
                    <div
                      key={index}
                      className={cn(
                        "w-2 h-2 rounded-full transition-colors",
                        index === currentStep ? "bg-edu-teal" : "bg-gray-300"
                      )}
                    />
                  ))}
                </div>
              </div>
              <span className="text-xs text-gray-500">
                Step {currentStep + 1} of {tutorialSteps.length}
              </span>
            </div>
            
            <h3 className="text-lg font-semibold mb-3">{step.title}</h3>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">{step.content}</p>
            
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep(currentStep - 1)}
                disabled={currentStep === 0}
                className="w-20"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                <span className="hidden xs:inline">Prev</span>
              </Button>
              
              <Button
                size="sm"
                onClick={handleNext}
                className="w-20"
              >
                <span className="hidden xs:inline">{isLastStep ? "Finish" : "Next"}</span>
                <span className="xs:hidden">{isLastStep ? "Done" : "Next"}</span>
                {!isLastStep && <ChevronRight className="w-4 h-4 ml-1" />}
              </Button>
            </div>
          </div>
        ) : (
          /* Desktop mode */
          <>
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
          </>
        )}
      </Card>
    </>
  );
}

// Tutorial Provider Component
export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const [showTutorial, setShowTutorial] = useState(false);

  const startTutorial = () => {
    console.log("Tutorial - Starting tutorial");
    setShowTutorial(true);
  };

  return (
    <TutorialContext.Provider value={{ startTutorial }}>
      {children}
      {showTutorial && (
        <TutorialWrapper 
          showTutorial={showTutorial} 
          setShowTutorial={setShowTutorial} 
        />
      )}
    </TutorialContext.Provider>
  );
}

// Wrapper component to handle tutorial state
function TutorialWrapper({ showTutorial, setShowTutorial }: { 
  showTutorial: boolean; 
  setShowTutorial: (show: boolean) => void; 
}) {
  return <TutorialComponent initialShow={showTutorial} onClose={() => setShowTutorial(false)} />;
}

// Export Tutorial for backward compatibility
export const Tutorial = TutorialProvider;