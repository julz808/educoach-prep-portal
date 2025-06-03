import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { HeroBanner } from '@/components/ui/hero-banner';
import { MetricsCards } from '@/components/ui/metrics-cards';
import { 
  BookOpen, Clock, Target, Play, Trophy, BarChart3, 
  ArrowRight, ChevronLeft, ChevronDown, ChevronRight,
  CheckCircle, AlertCircle, Brain, Star, Zap, Flag,
  RotateCcw, ArrowLeft, Award, TrendingUp, Users,
  Home
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProduct } from '@/context/ProductContext';
import { useNavigate } from 'react-router-dom';
import { 
  fetchDrillModes, 
  type TestMode, 
  type TestSection,
  type OrganizedQuestion
} from '@/services/supabaseQuestionService';

interface SubSkillProgress {
  easy: { completed: number; total: number; bestScore?: number };
  medium: { completed: number; total: number; bestScore?: number };
  hard: { completed: number; total: number; bestScore?: number };
}

interface SubSkill {
  id: string;
  name: string;
  description?: string;
  questions: OrganizedQuestion[];
  progress: SubSkillProgress;
  isRecommended?: boolean;
  totalQuestions: number;
  completedQuestions: number;
}

interface SkillArea {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  subSkills: SubSkill[];
  totalQuestions: number;
  completedQuestions: number;
  isExpanded: boolean;
}

interface QuestionState {
  question: OrganizedQuestion;
  skillAreaId: string;
  skillAreaName: string;
  subSkillId: string;
  subSkillName: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionNumber: number;
  totalInDifficulty: number;
}

const Drill: React.FC = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'skill-area' | 'sub-skill' | 'question'>('dashboard');
  const [skillAreas, setSkillAreas] = useState<SkillArea[]>([]);
  const [selectedSkillArea, setSelectedSkillArea] = useState<SkillArea | null>(null);
  const [selectedSubSkill, setSelectedSubSkill] = useState<SubSkill | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionState | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { selectedProduct } = useProduct();
  const navigate = useNavigate();

  useEffect(() => {
    const loadDrillData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('🔧 DEBUG: Fetching drill modes for product:', selectedProduct);
        const modes = await fetchDrillModes(selectedProduct);
        console.log('🔧 DEBUG: Received drill modes:', modes);
        console.log('🔧 DEBUG: Number of modes:', modes?.length);
        
        // Detailed logging of the data structure
        if (modes && modes.length > 0) {
          modes.forEach((mode, modeIndex) => {
            console.log(`🔧 DEBUG: Mode ${modeIndex}:`, {
              name: mode.name,
              sections: mode.sections?.length || 0,
              sectionNames: mode.sections?.map(s => s.name) || []
            });
            
            if (mode.sections) {
              mode.sections.forEach((section, sectionIndex) => {
                console.log(`🔧 DEBUG: Mode "${mode.name}" -> Section ${sectionIndex}:`, {
                  name: section.name,
                  questionsCount: section.questions?.length || 0
                });
              });
            }
          });
        }
        
        // Check if we have real data from the database
        if (!modes || modes.length === 0) {
          console.log('🔧 DEBUG: No drill modes found, using fallback message');
          setSkillAreas([]);
          return;
        }
        
        // Transform real Supabase data into hierarchical structure
        const skillAreasMap = new Map<string, SkillArea>();
        
        modes.forEach(mode => {
          console.log('🔧 DEBUG: Processing mode:', mode.name, 'with sections:', mode.sections);
          
          // Each mode represents a skill area (section_name from database)
          const skillAreaName = mode.name;
          
          if (!skillAreasMap.has(skillAreaName)) {
            skillAreasMap.set(skillAreaName, {
              id: skillAreaName.toLowerCase().replace(/\s+/g, '-'),
              name: skillAreaName,
              description: mode.description || `Practice ${skillAreaName.toLowerCase()} skills`,
              icon: getSkillAreaIcon(skillAreaName),
              color: getSkillAreaColor(skillAreaName),
              subSkills: [],
              totalQuestions: 0,
              completedQuestions: 0,
              isExpanded: false
            });
          }

          const skillArea = skillAreasMap.get(skillAreaName)!;
          
          // Each section within the mode represents a sub-skill
          mode.sections.forEach(section => {
            const subSkillName = section.name;
            
            console.log('🔧 DEBUG: Processing sub-skill:', subSkillName, 'in skill area:', skillAreaName);
            
            // Calculate questions per difficulty (distribute evenly with some randomness for demo)
            const totalQuestions = section.questions.length;
            const questionsPerDifficulty = Math.floor(totalQuestions / 3);
            const remainder = totalQuestions % 3;
            
            const easyTotal = questionsPerDifficulty + (remainder > 0 ? 1 : 0);
            const mediumTotal = questionsPerDifficulty + (remainder > 1 ? 1 : 0);
            const hardTotal = questionsPerDifficulty;
            
            // Mock progress data (in real app, fetch from user progress API)
            const easyCompleted = Math.floor(Math.random() * (easyTotal + 1));
            const mediumCompleted = Math.floor(Math.random() * (mediumTotal + 1));
            const hardCompleted = Math.floor(Math.random() * (hardTotal + 1));
            
            const subSkill: SubSkill = {
              id: section.id,
              name: subSkillName,
              description: `Master ${subSkillName.toLowerCase()} through targeted practice`,
              questions: section.questions,
              progress: {
                easy: { 
                  completed: easyCompleted, 
                  total: easyTotal,
                  bestScore: easyCompleted > 0 ? Math.floor(Math.random() * 40) + 60 : undefined
                },
                medium: { 
                  completed: mediumCompleted, 
                  total: mediumTotal,
                  bestScore: mediumCompleted > 0 ? Math.floor(Math.random() * 30) + 70 : undefined
                },
                hard: { 
                  completed: hardCompleted, 
                  total: hardTotal,
                  bestScore: hardCompleted > 0 ? Math.floor(Math.random() * 20) + 80 : undefined
                }
              },
              isRecommended: Math.random() > 0.7, // Mock recommendation (30% chance)
              totalQuestions: totalQuestions,
              completedQuestions: easyCompleted + mediumCompleted + hardCompleted
            };

            skillArea.subSkills.push(subSkill);
            skillArea.totalQuestions += totalQuestions;
            skillArea.completedQuestions += subSkill.completedQuestions;
            
            console.log('🔧 DEBUG: Added sub-skill:', subSkillName, 'to skill area:', skillAreaName, 'with', totalQuestions, 'questions');
          });
        });
        
        const finalSkillAreas = Array.from(skillAreasMap.values());
        console.log('🔧 DEBUG: Final skill areas:', finalSkillAreas.map(sa => ({
          name: sa.name,
          subSkills: sa.subSkills.length,
          totalQuestions: sa.totalQuestions
        })));
        setSkillAreas(finalSkillAreas);
      } catch (err) {
        console.error('Error loading drill data:', err);
        setError('Failed to load drill data');
      } finally {
        setLoading(false);
      }
    };

    loadDrillData();
  }, [selectedProduct]);

  const getSkillAreaIcon = (skillAreaName: string): string => {
    const name = skillAreaName.toLowerCase();
    if (name.includes('verbal')) return '💬';
    if (name.includes('reading')) return '📖';
    if (name.includes('mathematical')) return '🔢';
    if (name.includes('quantitative')) return '📊';
    if (name.includes('written') || name.includes('expression')) return '✍️';
    if (name.includes('numerical')) return '📊';
    if (name.includes('abstract')) return '🎨';
    return '🧠';
  };

  const getSkillAreaColor = (skillAreaName: string): string => {
    const name = skillAreaName.toLowerCase();
    if (name.includes('verbal')) return 'from-blue-500 to-blue-600';
    if (name.includes('reading')) return 'from-green-500 to-green-600';
    if (name.includes('mathematical')) return 'from-purple-500 to-purple-600';
    if (name.includes('quantitative')) return 'from-orange-500 to-orange-600';
    if (name.includes('written') || name.includes('expression')) return 'from-pink-500 to-pink-600';
    if (name.includes('numerical')) return 'from-orange-500 to-orange-600';
    if (name.includes('abstract')) return 'from-pink-500 to-pink-600';
    return 'from-gray-500 to-gray-600';
  };

  const toggleSkillArea = (skillArea: SkillArea) => {
    setSkillAreas(prev => prev.map(sa => 
      sa.id === skillArea.id 
        ? { ...sa, isExpanded: !sa.isExpanded }
        : sa
    ));
  };

  const selectSubSkill = (skillArea: SkillArea, subSkill: SubSkill) => {
    setSelectedSkillArea(skillArea);
    setSelectedSubSkill(subSkill);
    setCurrentView('sub-skill');
  };

  const startDrill = (difficulty: 'easy' | 'medium' | 'hard') => {
    if (!selectedSubSkill || !selectedSkillArea) return;
    
    const questions = selectedSubSkill.questions;
    if (questions.length === 0) return;
    
    // In real app, filter questions by difficulty
    const availableQuestions = questions.slice(0, 10); // Mock: use first 10 questions
    
    if (availableQuestions.length > 0) {
      const questionState: QuestionState = {
        question: availableQuestions[0],
        skillAreaId: selectedSkillArea.id,
        skillAreaName: selectedSkillArea.name,
        subSkillId: selectedSubSkill.id,
        subSkillName: selectedSubSkill.name,
        difficulty,
        questionNumber: 1,
        totalInDifficulty: Math.min(10, availableQuestions.length)
      };
      
      setCurrentQuestion(questionState);
      setCurrentView('question');
      setSelectedAnswer(null);
      setShowFeedback(false);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (!showFeedback) {
      setSelectedAnswer(answerIndex);
    }
  };

  const submitAnswer = async () => {
    if (selectedAnswer === null || !currentQuestion) return;
    
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setShowFeedback(true);
    setIsSubmitting(false);
  };

  const nextQuestion = () => {
    setCurrentView('sub-skill'); // For demo, go back to sub-skill view
  };

  const getDifficultyConfig = (difficulty: 'easy' | 'medium' | 'hard') => {
    switch (difficulty) {
      case 'easy':
        return {
          color: 'green',
          bgClass: 'bg-green-50 border-green-200 hover:bg-green-100',
          textClass: 'text-green-700',
          buttonClass: 'bg-green-500 hover:bg-green-600 text-white',
          badgeClass: 'bg-green-100 text-green-700'
        };
      case 'medium':
        return {
          color: 'amber',
          bgClass: 'bg-amber-50 border-amber-200 hover:bg-amber-100',
          textClass: 'text-amber-700',
          buttonClass: 'bg-amber-500 hover:bg-amber-600 text-white',
          badgeClass: 'bg-amber-100 text-amber-700'
        };
      case 'hard':
        return {
          color: 'red',
          bgClass: 'bg-red-50 border-red-200 hover:bg-red-100',
          textClass: 'text-red-700',
          buttonClass: 'bg-red-500 hover:bg-red-600 text-white',
          badgeClass: 'bg-red-100 text-red-700'
        };
    }
  };

  const getProgressPercentage = (completed: number, total: number) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const getTotalCompleted = () => {
    return skillAreas.reduce((sum, area) => sum + area.completedQuestions, 0);
  };

  const getTotalQuestions = () => {
    return skillAreas.reduce((sum, area) => sum + area.totalQuestions, 0);
  };

  const getRecommendedSubSkills = () => {
    const recommended: { skillArea: SkillArea; subSkill: SubSkill }[] = [];
    skillAreas.forEach(skillArea => {
      skillArea.subSkills.forEach(subSkill => {
        if (subSkill.isRecommended) {
          recommended.push({ skillArea, subSkill });
        }
      });
    });
    return recommended.slice(0, 3);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-edu-teal mx-auto mb-4"></div>
          <p className="text-gray-600">Loading skill drills...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  // Question View
  if (currentView === 'question' && currentQuestion) {
    const difficultyConfig = getDifficultyConfig(currentQuestion.difficulty);
    const isCorrect = selectedAnswer === currentQuestion.question.correctAnswer;

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Enhanced Header with Breadcrumb */}
        <div className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  onClick={() => setCurrentView('sub-skill')}
                  className="flex items-center text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft size={18} className="mr-2" />
                  Back
                </Button>
                <div className="hidden sm:block text-sm text-gray-500">
                  <span className="flex items-center">
                    <Home size={14} className="mr-1" />
                    {currentQuestion.skillAreaName}
                    <ChevronRight size={14} className="mx-2" />
                    {currentQuestion.subSkillName}
                    <ChevronRight size={14} className="mx-2" />
                    {currentQuestion.difficulty.charAt(0).toUpperCase() + currentQuestion.difficulty.slice(1)}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Badge className={difficultyConfig.badgeClass}>
                  {currentQuestion.difficulty.charAt(0).toUpperCase() + currentQuestion.difficulty.slice(1)}
                </Badge>
                <div className="text-sm text-gray-600 hidden sm:block">
                  Question {currentQuestion.questionNumber} of {currentQuestion.totalInDifficulty}
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500">Progress</span>
                <span className="text-xs font-medium text-gray-500">
                  {Math.round((currentQuestion.questionNumber / currentQuestion.totalInDifficulty) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-edu-teal to-edu-teal/80 h-2 rounded-full transition-all duration-500 ease-out" 
                  style={{ width: `${(currentQuestion.questionNumber / currentQuestion.totalInDifficulty) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Question Content */}
        <div className="max-w-4xl mx-auto px-6 py-8">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Question {currentQuestion.questionNumber}
                  </h2>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {currentQuestion.question.topic}
                    </Badge>
                  </div>
                </div>
                <p className="text-gray-800 leading-relaxed text-lg">
                  {currentQuestion.question.text}
                </p>
              </div>

              <div className="space-y-3 mb-8">
                {currentQuestion.question.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    disabled={showFeedback}
                    className={cn(
                      "w-full p-4 text-left border-2 rounded-xl transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99]",
                      selectedAnswer === index 
                        ? "border-edu-teal bg-edu-teal/5 shadow-md" 
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50",
                      showFeedback && index === currentQuestion.question.correctAnswer && "border-green-500 bg-green-50 shadow-md",
                      showFeedback && selectedAnswer === index && index !== currentQuestion.question.correctAnswer && "border-red-500 bg-red-50"
                    )}
                  >
                    <div className="flex items-center">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-medium text-gray-700 mr-4">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="flex-1">{option}</span>
                      {showFeedback && index === currentQuestion.question.correctAnswer && (
                        <CheckCircle className="text-green-600 ml-2" size={20} />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {!showFeedback ? (
                <div className="flex justify-between items-center">
                  <Button variant="outline" className="flex items-center">
                    <Flag size={16} className="mr-2" />
                    Flag for Review
                  </Button>
                  <Button
                    onClick={submitAnswer}
                    disabled={selectedAnswer === null || isSubmitting}
                    className="px-8 py-3 bg-edu-teal hover:bg-edu-teal/90 text-white disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Answer'
                    )}
                  </Button>
                </div>
              ) : (
                <div className="border-t pt-6 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="mb-6">
                    <div className="flex items-center mb-3">
                      {isCorrect ? (
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="mr-2" size={24} />
                          <span className="font-semibold text-lg">Excellent!</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-red-600">
                          <AlertCircle className="mr-2" size={24} />
                          <span className="font-semibold text-lg">Not quite right</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <p className="text-gray-700 mb-3 font-medium">Explanation:</p>
                      <p className="text-gray-600 leading-relaxed">{currentQuestion.question.explanation}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex space-x-3">
                      <Button variant="outline" size="sm">
                        <Flag size={16} className="mr-2" />
                        Still Confused
                      </Button>
                      <Button variant="outline" size="sm">
                        <RotateCcw size={16} className="mr-2" />
                        More Like This
                      </Button>
                    </div>
                    <div className="flex space-x-3">
                      <Button variant="outline" onClick={() => setCurrentView('sub-skill')}>
                        Switch Difficulty
                      </Button>
                      <Button onClick={nextQuestion} className="bg-edu-teal hover:bg-edu-teal/90 text-white">
                        <ArrowRight size={16} className="mr-2" />
                        Next Question
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Sub-Skill View (Difficulty Selection)
  if (currentView === 'sub-skill' && selectedSubSkill && selectedSkillArea) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Button
              variant="outline"
              onClick={() => setCurrentView('dashboard')}
              className="flex items-center"
            >
              <ChevronLeft size={16} className="mr-2" />
              Back to Skills
            </Button>
            <div className="text-sm text-gray-500">
              {selectedSkillArea.name} → {selectedSubSkill.name}
            </div>
          </div>

          {/* Sub-Skill Overview */}
          <div className={cn("bg-gradient-to-r rounded-2xl p-8 text-white mb-8", selectedSkillArea.color)}>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="mb-6 lg:mb-0">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-3xl">{selectedSkillArea.icon}</span>
                  <h1 className="text-3xl lg:text-4xl font-bold">
                    {selectedSubSkill.name}
                  </h1>
                </div>
                <p className="text-lg opacity-90 mb-4">
                  {selectedSubSkill.description}
                </p>
                <div className="flex items-center space-x-6 text-sm">
                  <div className="flex items-center space-x-2">
                    <BookOpen size={16} />
                    <span>{selectedSubSkill.totalQuestions} total questions</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle size={16} />
                    <span>{selectedSubSkill.completedQuestions} completed</span>
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">
                  {getProgressPercentage(selectedSubSkill.completedQuestions, selectedSubSkill.totalQuestions)}%
                </div>
                <div className="text-sm opacity-80">Complete</div>
              </div>
            </div>
          </div>

          {/* Difficulty Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { level: 'easy' as const, data: selectedSubSkill.progress.easy },
              { level: 'medium' as const, data: selectedSubSkill.progress.medium },
              { level: 'hard' as const, data: selectedSubSkill.progress.hard }
            ].map(({ level, data }) => {
              const config = getDifficultyConfig(level);
              
              return (
                <Card key={level} className={cn("transition-all duration-200 hover:shadow-lg cursor-pointer", config.bgClass)}
                      onClick={() => startDrill(level)}>
                  <CardContent className="p-8 text-center">
                    <div className="mb-6">
                      <h3 className="text-2xl font-bold capitalize mb-2">{level}</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        {data.completed}/{data.total} questions completed
                      </p>
                      
                      {/* Progress Circle */}
                      <div className="relative w-24 h-24 mx-auto mb-4">
                        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="stroke-current text-gray-200"
                            strokeWidth="3"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className={`stroke-current text-${config.color}-500`}
                            strokeWidth="3"
                            strokeDasharray={`${getProgressPercentage(data.completed, data.total)}, 100`}
                            strokeLinecap="round"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xl font-bold">
                            {getProgressPercentage(data.completed, data.total)}%
                          </span>
                        </div>
                      </div>

                      {data.bestScore && (
                        <Badge variant="outline" className="mb-4">
                          Best Score: {data.bestScore}%
                        </Badge>
                      )}
                    </div>
                    
                    <Button
                      className={cn("w-full", config.buttonClass)}
                      disabled={data.total === 0}
                    >
                      <Play size={16} className="mr-2" />
                      {data.completed === 0 ? 'Start Practice' : 
                       data.completed < data.total ? 'Continue Practice' : 'Review Questions'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Dashboard View
  const recommendedSubSkills = getRecommendedSubSkills();

  // Calculate metrics for hero banner and metrics cards
  const totalSkillAreas = skillAreas.length;
  const totalCompleted = getTotalCompleted();
  const totalQuestions = getTotalQuestions();
  const totalSubSkills = skillAreas.reduce((sum, area) => sum + area.subSkills.length, 0);
  const overallProgress = Math.round((totalCompleted / totalQuestions) * 100) || 0;

  const heroBannerProps = {
    title: "Skill Drills",
    subtitle: "Master specific skills through targeted practice",
    metrics: [
      { 
        icon: <Target size={16} />,
        label: "Skill Areas", 
        value: totalSkillAreas.toString() 
      },
      { 
        icon: <CheckCircle size={16} />,
        label: "Questions Completed", 
        value: totalCompleted.toString() 
      },
      { 
        icon: <TrendingUp size={16} />,
        label: "Overall Progress", 
        value: `${overallProgress}%` 
      }
    ],
    actions: totalQuestions > 0 ? [
      {
        label: "Continue Practice",
        icon: <Play size={20} className="mr-2" />,
        onClick: () => {
          if (recommendedSubSkills.length > 0) {
            const { skillArea, subSkill } = recommendedSubSkills[0];
            selectSubSkill(skillArea, subSkill);
          }
        }
      }
    ] : [],
    ...(totalQuestions === 0 && {
      warning: {
        icon: <AlertCircle size={16} />,
        message: "No drill questions available for this test type yet."
      }
    })
  };

  const metricsConfig = [
    {
      title: "Skill Areas",
      value: totalSkillAreas.toString(),
      icon: <Target className="text-white" size={24} />,
      badge: { text: "Available", variant: "default" as const },
      color: {
        bg: "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200",
        iconBg: "bg-blue-500",
        text: "text-blue-900"
      }
    },
    {
      title: "Questions Completed",
      value: totalCompleted.toString(),
      icon: <CheckCircle className="text-white" size={24} />,
      badge: { text: "Progress", variant: "success" as const },
      color: {
        bg: "bg-gradient-to-br from-green-50 to-green-100 border-green-200",
        iconBg: "bg-green-500",
        text: "text-green-900"
      }
    },
    {
      title: "Sub-Skills",
      value: totalSubSkills.toString(),
      icon: <Brain className="text-white" size={24} />,
      badge: { text: "Topics", variant: "secondary" as const },
      color: {
        bg: "bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200",
        iconBg: "bg-purple-500",
        text: "text-purple-900"
      }
    },
    {
      title: "Overall Progress",
      value: `${overallProgress}%`,
      icon: <TrendingUp className="text-white" size={24} />,
      badge: { text: "Complete", variant: "warning" as const },
      color: {
        bg: "bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200",
        iconBg: "bg-orange-500",
        text: "text-orange-900"
      }
    }
  ];

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <HeroBanner {...heroBannerProps} />

      {/* Metrics Cards */}
      <MetricsCards metrics={metricsConfig} />

      {/* Recommendations */}
      {recommendedSubSkills.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white mr-3 px-3 py-1">
              <Star size={14} className="mr-1" />
              Recommended
            </Badge>
            Based on your diagnostic results
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommendedSubSkills.map(({ skillArea, subSkill }) => (
              <Card key={subSkill.id} className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all duration-200 cursor-pointer"
                    onClick={() => selectSubSkill(skillArea, subSkill)}>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-3 mb-4">
                    <span className="text-2xl">{skillArea.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{subSkill.name}</h3>
                      <p className="text-sm text-gray-600">{skillArea.name}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Progress</span>
                      <span>{getProgressPercentage(subSkill.completedQuestions, subSkill.totalQuestions)}%</span>
                    </div>
                    <Progress value={getProgressPercentage(subSkill.completedQuestions, subSkill.totalQuestions)} className="h-2" />
                  </div>
                  <Button size="sm" className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white">
                    <Play size={14} className="mr-2" />
                    Practice Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Skill Areas with Sub-Skills */}
      <div className="space-y-6">
        {skillAreas.map((skillArea) => (
          <Card key={skillArea.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
            <div 
              className="p-6 cursor-pointer hover:bg-gray-50/50 transition-colors duration-200"
              onClick={() => toggleSkillArea(skillArea)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={cn("w-14 h-14 bg-gradient-to-br rounded-xl flex items-center justify-center text-white text-xl mr-6 shadow-md", skillArea.color)}>
                    <span className="text-2xl">{skillArea.icon}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">{skillArea.name}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <CheckCircle size={14} className="mr-1 text-green-500" />
                        {skillArea.completedQuestions} of {skillArea.totalQuestions} questions completed
                      </span>
                      <span>•</span>
                      <span className="flex items-center">
                        <Users size={14} className="mr-1 text-blue-500" />
                        {skillArea.subSkills.length} sub-skills
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-700">
                      {getProgressPercentage(skillArea.completedQuestions, skillArea.totalQuestions)}%
                    </div>
                    <div className="w-24 bg-gray-200 rounded-full h-2 mt-1 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-edu-teal to-edu-teal/80 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${getProgressPercentage(skillArea.completedQuestions, skillArea.totalQuestions)}%` }}
                      />
                    </div>
                  </div>
                  <div className="transition-transform duration-200">
                    {skillArea.isExpanded ? 
                      <ChevronDown size={20} className="text-gray-500" /> : 
                      <ChevronRight size={20} className="text-gray-500" />
                    }
                  </div>
                </div>
              </div>
            </div>

            {skillArea.isExpanded && (
              <div className="px-6 pb-6 bg-gradient-to-br from-gray-50/50 to-gray-100/30 animate-in slide-in-from-top-2 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                  {skillArea.subSkills.map((subSkill) => (
                    <Card key={subSkill.id} className="border shadow-sm hover:shadow-md transition-all duration-200 bg-white cursor-pointer"
                          onClick={() => selectSubSkill(skillArea, subSkill)}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="font-semibold text-gray-900">{subSkill.name}</h4>
                              {subSkill.isRecommended && (
                                <Badge className="bg-orange-100 text-orange-700 text-xs">
                                  <Star size={12} className="mr-1" />
                                  Recommended
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-3">
                              {subSkill.completedQuestions} of {subSkill.totalQuestions} questions completed
                            </p>
                          </div>
                        </div>
                        
                        {/* Mini Progress Bars for Each Difficulty */}
                        <div className="space-y-2 mb-4">
                          {[
                            { level: 'Easy', data: subSkill.progress.easy, color: 'green' },
                            { level: 'Medium', data: subSkill.progress.medium, color: 'amber' },
                            { level: 'Hard', data: subSkill.progress.hard, color: 'red' }
                          ].map(({ level, data, color }) => (
                            <div key={level} className="flex items-center justify-between text-xs">
                              <span className="text-gray-600 w-16">{level}</span>
                              <div className="flex-1 mx-2">
                                <div className="w-full bg-gray-200 rounded-full h-1">
                                  <div 
                                    className={`bg-${color}-500 h-1 rounded-full transition-all duration-300`}
                                    style={{ width: `${getProgressPercentage(data.completed, data.total)}%` }}
                                  />
                                </div>
                              </div>
                              <span className="text-gray-500 w-12 text-right">{data.completed}/{data.total}</span>
                            </div>
                          ))}
                        </div>
                        
                        <Button size="sm" className="w-full bg-edu-teal hover:bg-edu-teal/90 text-white">
                          <Play size={14} className="mr-2" />
                          Practice
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {skillAreas.length === 0 && (
        <Card className="p-12 text-center bg-white/80 backdrop-blur-sm shadow-lg">
          <Target className="h-16 w-16 text-gray-400 mx-auto mb-6" />
          <h3 className="text-xl font-semibold mb-3">No Drill Questions Available</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Drill questions for this test type are coming soon. Check back later for targeted skill practice.
          </p>
        </Card>
      )}
    </div>
  );
};

export default Drill;
