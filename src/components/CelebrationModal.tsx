import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { 
  CheckCircle, Award, TrendingUp, Target, Star, 
  ArrowRight, Clock, BookOpen, Zap 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CelebrationData {
  type: 'test_complete' | 'improvement' | 'milestone' | 'streak';
  title: string;
  message: string;
  score?: number;
  improvement?: number;
  milestone?: string;
  nextGoal?: string;
  streak?: number;
}

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  celebration: CelebrationData;
  onContinue?: () => void;
}

export const CelebrationModal: React.FC<CelebrationModalProps> = ({
  isOpen,
  onClose,
  celebration,
  onContinue
}) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      setAnimationStep(0);
      
      // Animate elements in sequence
      const timer1 = setTimeout(() => setAnimationStep(1), 200);
      const timer2 = setTimeout(() => setAnimationStep(2), 600);
      const timer3 = setTimeout(() => setAnimationStep(3), 1000);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [isOpen]);

  const getCelebrationIcon = () => {
    switch (celebration.type) {
      case 'test_complete':
        return <CheckCircle size={64} className="text-green-500" />;
      case 'improvement':
        return <TrendingUp size={64} className="text-edu-teal" />;
      case 'milestone':
        return <Award size={64} className="text-edu-coral" />;
      case 'streak':
        return <Zap size={64} className="text-yellow-500" />;
      default:
        return <Star size={64} className="text-edu-teal" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-600";
    if (score >= 70) return "text-edu-teal";
    if (score >= 50) return "text-orange-500";
    return "text-red-500";
  };

  const getEncouragementMessage = (score: number): string => {
    if (score >= 90) return "Outstanding work!";
    if (score >= 80) return "Great job! Keep it up!";
    if (score >= 70) return "Well done! You're improving!";
    if (score >= 60) return "Good effort! Keep practicing!";
    return "Every step counts! Keep going!";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-0 shadow-2xl bg-gradient-to-br from-white via-edu-light-blue/20 to-white">
        <div className="text-center space-y-6">
          {/* Animated Icon */}
          <div className={cn(
            "flex justify-center transition-all duration-500",
            animationStep >= 1 ? "scale-100 opacity-100" : "scale-50 opacity-0"
          )}>
            <div className="relative">
              {getCelebrationIcon()}
              {showConfetti && (
                <div className="absolute inset-0 pointer-events-none">
                  {/* Simple confetti effect using CSS animations */}
                  <div className="absolute -top-2 -left-2 w-2 h-2 bg-edu-teal rounded-full animate-bounce" 
                       style={{ animationDelay: '0.1s', animationDuration: '1.5s' }} />
                  <div className="absolute -top-4 right-0 w-2 h-2 bg-edu-coral rounded-full animate-bounce" 
                       style={{ animationDelay: '0.3s', animationDuration: '1.8s' }} />
                  <div className="absolute top-0 -right-4 w-2 h-2 bg-yellow-400 rounded-full animate-bounce" 
                       style={{ animationDelay: '0.5s', animationDuration: '1.2s' }} />
                  <div className="absolute -bottom-2 -left-4 w-2 h-2 bg-green-400 rounded-full animate-bounce" 
                       style={{ animationDelay: '0.7s', animationDuration: '1.6s' }} />
                  <div className="absolute -bottom-4 right-2 w-2 h-2 bg-purple-400 rounded-full animate-bounce" 
                       style={{ animationDelay: '0.9s', animationDuration: '1.4s' }} />
                </div>
              )}
            </div>
          </div>

          {/* Title and Message */}
          <div className={cn(
            "space-y-2 transition-all duration-500 delay-200",
            animationStep >= 2 ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          )}>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-edu-navy">
                {celebration.title}
              </DialogTitle>
              <DialogDescription className="text-lg text-edu-navy/80">
                {celebration.message}
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Score Display */}
          {celebration.score !== undefined && (
            <div className={cn(
              "transition-all duration-500 delay-400",
              animationStep >= 3 ? "scale-100 opacity-100" : "scale-90 opacity-0"
            )}>
              <Card className="bg-gradient-to-r from-edu-light-blue to-white border-edu-teal/20">
                <CardContent className="p-6">
                  <div className="text-center space-y-3">
                    <div className={cn("text-4xl font-bold", getScoreColor(celebration.score))}>
                      {celebration.score}%
                    </div>
                    <div className="text-sm font-medium text-edu-navy/70">
                      {getEncouragementMessage(celebration.score)}
                    </div>
                    {celebration.improvement && (
                      <div className="flex items-center justify-center space-x-1 text-green-600">
                        <TrendingUp size={16} />
                        <span className="text-sm font-medium">
                          +{celebration.improvement}% improvement
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Milestone/Streak Info */}
          {celebration.milestone && (
            <div className={cn(
              "transition-all duration-500 delay-400",
              animationStep >= 3 ? "scale-100 opacity-100" : "scale-90 opacity-0"
            )}>
              <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-center space-x-2">
                    <Award size={20} className="text-orange-500" />
                    <span className="font-medium text-orange-700">
                      {celebration.milestone}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {celebration.streak && (
            <div className={cn(
              "transition-all duration-500 delay-400",
              animationStep >= 3 ? "scale-100 opacity-100" : "scale-90 opacity-0"
            )}>
              <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
                <CardContent className="p-4">
                  <div className="text-center space-y-2">
                    <div className="flex items-center justify-center space-x-2">
                      <Zap size={20} className="text-yellow-500" />
                      <span className="font-bold text-xl text-yellow-700">
                        {celebration.streak} Day Streak!
                      </span>
                    </div>
                    <p className="text-sm text-yellow-600">
                      Consistency is the key to success
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Next Goal */}
          {celebration.nextGoal && (
            <div className={cn(
              "text-center space-y-2 transition-all duration-500 delay-600",
              animationStep >= 3 ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            )}>
              <div className="flex items-center justify-center space-x-2 text-edu-navy/70">
                <Target size={16} />
                <span className="text-sm font-medium">Next Goal:</span>
              </div>
              <p className="text-sm text-edu-navy/80">{celebration.nextGoal}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className={cn(
            "flex flex-col space-y-3 pt-4 transition-all duration-500 delay-700",
            animationStep >= 3 ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          )}>
            {onContinue && (
              <Button 
                onClick={onContinue}
                className="w-full bg-edu-teal hover:bg-edu-teal/90 text-white"
              >
                Continue Learning
                <ArrowRight size={16} className="ml-2" />
              </Button>
            )}
            
            <Button 
              variant="outline" 
              onClick={onClose}
              className="w-full"
            >
              {celebration.type === 'test_complete' ? 'View Results' : 'Got it!'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Helper function to create celebration data
export const createCelebration = {
  testComplete: (score: number, improvement?: number): CelebrationData => ({
    type: 'test_complete',
    title: 'Test Completed!',
    message: 'Great work finishing your test',
    score,
    improvement,
    nextGoal: score >= 85 ? 'Keep up the excellent work!' : 'Try to improve by 5% on your next test'
  }),

  improvement: (improvement: number, newScore: number): CelebrationData => ({
    type: 'improvement',
    title: 'Excellent Progress!',
    message: `You've improved your performance`,
    score: newScore,
    improvement,
    nextGoal: 'Keep practicing to maintain this momentum'
  }),

  milestone: (milestone: string, score?: number): CelebrationData => ({
    type: 'milestone',
    title: 'Milestone Achieved!',
    message: 'You\'ve reached an important learning goal',
    milestone,
    score,
    nextGoal: 'Ready for the next challenge?'
  }),

  streak: (days: number): CelebrationData => ({
    type: 'streak',
    title: 'Amazing Consistency!',
    message: 'You\'re building great study habits',
    streak: days,
    nextGoal: `Can you make it to ${days + 1} days?`
  })
}; 