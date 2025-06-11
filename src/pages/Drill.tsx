import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { HeroBanner } from '@/components/ui/hero-banner';
import { MetricsCards } from '@/components/ui/metrics-cards';
import { 
  BookOpen, Clock, Target, Play, Trophy, BarChart3, 
  ArrowRight, ChevronLeft, ChevronDown, ChevronRight, ChevronUp,
  CheckCircle, CheckCircle2, AlertCircle, Brain, Star, Zap, Flag,
  RotateCcw, ArrowLeft, Award, TrendingUp, Users, Timer,
  Home, MessageSquare, Calculator, PieChart, 
  PenTool, Palette
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
  icon: React.ReactNode;
  color: string;
  subSkills: SubSkill[];
  totalQuestions: number;
  completedQuestions: number;
  isExpanded: boolean;
}

const Drill: React.FC = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'skill-area' | 'sub-skill'>('dashboard');
  const [skillAreas, setSkillAreas] = useState<SkillArea[]>([]);
  const [selectedSkillArea, setSelectedSkillArea] = useState<SkillArea | null>(null);
  const [selectedSubSkill, setSelectedSubSkill] = useState<SubSkill | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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
            
            // Count actual questions by difficulty level
            const totalQuestions = section.questions.length;
            const easyQuestions = section.questions.filter(q => q.difficulty === 1);
            const mediumQuestions = section.questions.filter(q => q.difficulty === 2);
            const hardQuestions = section.questions.filter(q => q.difficulty === 3);
            
            const easyTotal = easyQuestions.length;
            const mediumTotal = mediumQuestions.length;
            const hardTotal = hardQuestions.length;
            
            console.log(`🔧 DEBUG: Question distribution for ${subSkillName}:`, {
              easy: easyTotal,
              medium: mediumTotal, 
              hard: hardTotal,
              total: totalQuestions
            });
            
            // Mock progress data (in real app, fetch from user progress API)
            const easyCompleted = Math.floor(Math.random() * (easyTotal + 1));
            const mediumCompleted = Math.floor(Math.random() * (mediumTotal + 1));
            const hardCompleted = Math.floor(Math.random() * (hardTotal + 1));
            
            // Create varied completion states for demonstration
            let finalEasyCompleted, finalMediumCompleted, finalHardCompleted;
            const randomState = Math.random();
            
            if (randomState < 0.3) {
              // Not started (30% chance)
              finalEasyCompleted = 0;
              finalMediumCompleted = 0;
              finalHardCompleted = 0;
            } else if (randomState < 0.7) {
              // In progress (40% chance)
              finalEasyCompleted = Math.floor(easyTotal * 0.3);
              finalMediumCompleted = Math.floor(mediumTotal * 0.2);
              finalHardCompleted = Math.floor(hardTotal * 0.1);
            } else {
              // Completed (30% chance)
              finalEasyCompleted = easyTotal;
              finalMediumCompleted = mediumTotal;
              finalHardCompleted = hardTotal;
            }
            
            const subSkill: SubSkill = {
              id: section.id,
              name: subSkillName,
              description: `Master ${subSkillName.toLowerCase()} through targeted practice`,
              questions: section.questions,
              progress: {
                easy: { 
                  completed: finalEasyCompleted, 
                  total: easyTotal,
                  bestScore: finalEasyCompleted > 0 ? Math.floor(Math.random() * 40) + 60 : undefined
                },
                medium: { 
                  completed: finalMediumCompleted, 
                  total: mediumTotal,
                  bestScore: finalMediumCompleted > 0 ? Math.floor(Math.random() * 30) + 70 : undefined
                },
                hard: { 
                  completed: finalHardCompleted, 
                  total: hardTotal,
                  bestScore: finalHardCompleted > 0 ? Math.floor(Math.random() * 20) + 80 : undefined
                }
              },
              isRecommended: Math.random() > 0.7, // Mock recommendation (30% chance)
              totalQuestions: totalQuestions,
              completedQuestions: finalEasyCompleted + finalMediumCompleted + finalHardCompleted
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

  const getSkillAreaIcon = (skillAreaName: string): React.ReactNode => {
    const name = skillAreaName.toLowerCase();
    if (name.includes('verbal')) return <MessageSquare size={20} className="text-white" />;
    if (name.includes('reading')) return <BookOpen size={20} className="text-white" />;
    if (name.includes('mathematical')) return <Calculator size={20} className="text-white" />;
    if (name.includes('quantitative')) return <PieChart size={20} className="text-white" />;
    if (name.includes('written') || name.includes('expression')) return <PenTool size={20} className="text-white" />;
    if (name.includes('numerical')) return <PieChart size={20} className="text-white" />;
    if (name.includes('abstract')) return <Palette size={20} className="text-white" />;
    return <Brain size={20} className="text-white" />;
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
    
    // Map difficulty names to numeric values
    const difficultyMap = { easy: 1, medium: 2, hard: 3 };
    const targetDifficulty = difficultyMap[difficulty];
    
    // Filter questions by actual difficulty level from database
    const availableQuestions = questions.filter(q => q.difficulty === targetDifficulty);
    
    console.log(`🔧 DEBUG: Filtering ${difficulty} questions (difficulty=${targetDifficulty}):`, availableQuestions.length, 'found out of', questions.length, 'total');
    
    if (availableQuestions.length > 0) {
      // Navigate to the test-taking route for full-screen mode
      const skillId = selectedSubSkill.id;
      const skillName = selectedSubSkill.name;
      navigate(`/test/drill/${skillId}?skill=${skillName}&difficulty=${difficulty}&skillArea=${selectedSkillArea.name}`);
    } else {
      console.warn(`No ${difficulty} questions available for ${selectedSubSkill.name}`);
      // Could show a message to the user here
    }
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
    ...(totalQuestions === 0 && {
      warning: {
        icon: <AlertCircle size={16} />,
        message: "No drill questions available for this test type yet."
      }
    }),
    className: "bg-gradient-to-r from-orange-500 to-orange-700"
  };

  const getStatusColor = (completedQuestions: number, totalQuestions: number) => {
    if (completedQuestions === totalQuestions && totalQuestions > 0) {
      return 'border-emerald-200 bg-emerald-50/30';
    } else if (completedQuestions > 0) {
      return 'border-amber-200 bg-amber-50/30';
    }
    return 'border-slate-200 bg-white';
  };

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <HeroBanner {...heroBannerProps} />

      {/* Skill Areas - Single Column */}
      <div>
        <h2 className="text-2xl font-bold mb-6 text-slate-900">
          Skill Areas
        </h2>
        
        {skillAreas.length === 0 ? (
          <Card className="p-12 text-center bg-white border border-slate-200">
            <AlertCircle className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-slate-700">No Skill Areas Available</h3>
            <p className="text-slate-600">Drill questions for this test type are coming soon.</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {skillAreas.map((skillArea) => (
              <Card 
                key={skillArea.id} 
                className={cn(
                  "transition-all duration-300 bg-white border border-slate-200/60 hover:shadow-xl hover:shadow-slate-200/50 rounded-2xl overflow-hidden",
                  skillArea.totalQuestions > 0 ? "hover:border-orange-300 hover:-translate-y-1" : "opacity-60",
                  getStatusColor(skillArea.completedQuestions, skillArea.totalQuestions)
                )}
              >
                <CardHeader className="pb-4 bg-gradient-to-r from-slate-50/30 to-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div>
                        <CardTitle className="text-xl font-bold text-slate-900">{skillArea.name}</CardTitle>
                        <div className="flex items-center space-x-3 mt-2">
                          <div className="flex items-center space-x-2 text-edu-navy bg-edu-teal/10 rounded-full px-3 py-1">
                            <Users size={14} />
                            <span className="font-medium text-xs">{skillArea.subSkills.length} sub-skills</span>
                          </div>
                          <div className="flex items-center space-x-2 text-edu-navy bg-edu-teal/10 rounded-full px-3 py-1">
                            <CheckCircle2 size={14} />
                            <span className="font-medium text-xs">{skillArea.totalQuestions} questions available</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {skillArea.completedQuestions === skillArea.totalQuestions && skillArea.totalQuestions > 0 && (
                        <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0 rounded-full">
                          <CheckCircle2 size={12} className="mr-1" />
                          Completed
                        </Badge>
                      )}
                      {skillArea.completedQuestions > 0 && skillArea.completedQuestions < skillArea.totalQuestions && (
                        <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white border-0 rounded-full">
                          <Timer size={12} className="mr-1" />
                          In Progress
                        </Badge>
                      )}
                      {skillArea.completedQuestions === 0 && (
                        <Badge className="bg-gradient-to-r from-slate-400 to-slate-500 text-white border-0 rounded-full">
                          Not Started
                        </Badge>
                      )}
                      {skillArea.totalQuestions > 0 && (
                        <Button 
                          size="sm"
                          variant="ghost"
                          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSkillArea(skillArea);
                          }}
                        >
                          {skillArea.isExpanded ? 
                            <ChevronUp size={20} className="text-slate-600" /> : 
                            <ChevronDown size={20} className="text-slate-600" />
                          }
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="bg-white">
                  {skillArea.totalQuestions === 0 ? (
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                      <p className="text-slate-500 font-medium">Questions coming soon</p>
                    </div>
                  ) : (
                    <>
                      {/* Collapsed View - Summary */}
                      {!skillArea.isExpanded && (
                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                          <div className="text-sm text-slate-600">
                            <span>Progress: {getProgressPercentage(skillArea.completedQuestions, skillArea.totalQuestions)}% complete</span>
                          </div>
                        </div>
                      )}

                      {/* Expanded View - Sub-Skills */}
                      {skillArea.isExpanded && (
                        <div className="space-y-4 pt-4 border-t border-slate-100">
                          <div className="space-y-4">
                            <h4 className="font-semibold text-slate-900">Sub-Skills</h4>
                            <div className="grid gap-4">
                              {skillArea.subSkills.map((subSkill, index) => (
                                <div 
                                  key={subSkill.id}
                                  className={cn(
                                    "p-4 rounded-lg border-2 transition-all duration-200 relative",
                                    subSkill.totalQuestions > 0 ? "hover:shadow-md cursor-pointer" : "opacity-60",
                                    subSkill.completedQuestions === subSkill.totalQuestions && subSkill.totalQuestions > 0
                                      ? "border-emerald-200 bg-emerald-50/30"
                                      : subSkill.completedQuestions > 0
                                      ? "border-amber-200 bg-amber-50/30"
                                      : "border-slate-200 bg-white"
                                  )}
                                  onClick={() => selectSubSkill(skillArea, subSkill)}
                                >
                                  {subSkill.isRecommended && (
                                    <Badge className="absolute top-2 left-2 bg-rose-100 text-rose-700 border-rose-200 text-xs">
                                      Recommended
                                    </Badge>
                                  )}
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <div className={cn("mb-2", subSkill.isRecommended && "mt-8")}>
                                        <div>
                                          <h5 className="font-semibold text-slate-900">{subSkill.name}</h5>
                                          <div className="flex items-center space-x-2 text-sm text-slate-600">
                                            <CheckCircle2 size={12} className="text-emerald-500" />
                                            <span>{subSkill.completedQuestions} of {subSkill.totalQuestions} questions completed</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="ml-4 flex items-center space-x-3">
                                      {subSkill.completedQuestions === subSkill.totalQuestions && subSkill.totalQuestions > 0 && (
                                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                                          <CheckCircle2 size={12} className="mr-1" />
                                          Complete
                                        </Badge>
                                      )}
                                      {subSkill.completedQuestions > 0 && subSkill.completedQuestions < subSkill.totalQuestions && (
                                        <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                                          In Progress
                                        </Badge>
                                      )}
                                      
                                      {subSkill.totalQuestions === 0 ? (
                                        <div className="text-center py-2">
                                          <AlertCircle className="h-5 w-5 text-slate-400 mx-auto mb-1" />
                                          <p className="text-xs text-slate-500">Coming soon</p>
                                        </div>
                                      ) : (
                                        <Button 
                                          size="sm"
                                          className={cn(
                                            "font-medium rounded-full px-4 py-2 transition-all duration-200 shadow-sm hover:shadow-md",
                                            subSkill.completedQuestions === 0 
                                              ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white' 
                                              : subSkill.completedQuestions < subSkill.totalQuestions
                                              ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white'
                                              : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white'
                                          )}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            selectSubSkill(skillArea, subSkill);
                                          }}
                                        >
                                          <Play size={14} className="mr-1" />
                                          {subSkill.completedQuestions === 0 ? 'Start Practice' : 
                                           subSkill.completedQuestions < subSkill.totalQuestions ? 'Resume Practice' : 'Review'}
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Drill;
