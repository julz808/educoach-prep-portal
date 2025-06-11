import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { HeroBanner } from '@/components/ui/hero-banner';
import { MetricsCards } from '@/components/ui/metrics-cards';
import { 
  BookOpen, Clock, Target, TrendingUp, Play, BarChart3, 
  Award, Zap, Calendar, Users, ArrowRight, Star,
  ChevronRight, Brain, AlertCircle, X, CheckCircle,
  Target as TargetIcon, FileText, Sparkles, Activity
} from 'lucide-react';
import { CelebrationModal, createCelebration } from '@/components/CelebrationModal';
import { InteractiveInsightsDashboard } from '@/components/InteractiveInsightsDashboard';
import { QuestionInterface } from '@/components/QuestionInterface';
import { useProduct } from '@/context/ProductContext';
import { useNavigate } from 'react-router-dom';
import { 
  fetchQuestionsFromSupabase, 
  getPlaceholderTestStructure,
  fetchDrillModes,
  fetchDiagnosticModes,
  type TestType,
  type TestMode,
  type TestSection,
  type OrganizedQuestion
} from '@/services/supabaseQuestionService';
import { SECTION_TO_SUB_SKILLS, TEST_STRUCTURES } from '../data/curriculumData';

// Mock data for demonstration
const mockUserPerformance = {
  testResults: [
    {
      id: 1,
      date: '2024-01-15',
      testType: 'practice',
      score: 85,
      timeSpentMinutes: 45,
      topicResults: {
        'Mathematics': 85,
        'Algebra': 90,
        'Geometry': 80
      },
      subSkillResults: {
        'Linear Equations': 90,
        'Quadratic Functions': 85,
        'Circle Geometry': 80,
        'Triangle Properties': 75
      }
    },
    {
      id: 2,
      date: '2024-01-14',
      testType: 'mock',
      score: 78,
      timeSpentMinutes: 52,
      topicResults: {
        'Science': 78,
        'Physics': 75,
        'Chemistry': 80
      },
      subSkillResults: {
        'Mechanics': 75,
        'Thermodynamics': 70,
        'Chemical Reactions': 80,
        'Atomic Structure': 85
      }
    }
  ],
  subSkillMastery: {
    'Linear Equations': 90,
    'Quadratic Functions': 85,
    'Circle Geometry': 80,
    'Triangle Properties': 75,
    'Mechanics': 75,
    'Thermodynamics': 70,
    'Chemical Reactions': 80,
    'Atomic Structure': 85
  },
  topicMastery: {
    'Mathematics': 85,
    'Science': 78,
    'Reading': 82,
    'Writing': 75
  },
  totalStudyTimeMinutes: 300
};

// Mock user progress data - showing different states for demonstration
const mockUserProgress = {
  diagnostic: {
    isComplete: false,
    sectionsCompleted: 2,
    totalSections: 4,
    results: null // Will have results when complete
  },
  drills: {
    questionsCompleted: 150,
    totalQuestions: 500, // Added to track completion
    subSkillsDrilled: 3, // Number of sub-skills with >0 questions completed
    totalSubSkills: 8, // Total available sub-skills
    skillAreasProgress: 5,
    currentFocus: null
  },
  practiceTests: {
    testsCompleted: 3,
    totalTests: 5, // Changed from 3 to 5 to show incomplete state
    averageScore: 0,
    lastTest: null
  }
};

// Example with different completion states for demo
const mockUserProgressVaried = {
  diagnostic: {
    isComplete: true,
    sectionsCompleted: 4,
    totalSections: 4,
    results: {
      strongest: { area: 'Mathematics', score: 92 },
      weakest: { area: 'Reading Comprehension', score: 68 }
    }
  },
  drills: {
    questionsCompleted: 0,
    totalQuestions: 500,
    subSkillsDrilled: 8, // All sub-skills completed
    totalSubSkills: 8,
    skillAreasProgress: 0,
    currentFocus: null
  },
  practiceTests: {
    testsCompleted: 1,
    totalTests: 5,
    averageScore: 82,
    lastTest: { name: 'Mathematics Practice Test 1', score: 85 }
  }
};

const mockQuestion = {
  id: '1',
  text: 'What is the derivative of x²?',
  options: ['2x', 'x²', '2', 'x'],
  correctAnswer: 0,
  explanation: 'The derivative of x² is 2x using the power rule.',
  topic: 'Mathematics',
  subSkill: 'Calculus',
  difficulty: 3
};

const mockQuestions = [
  {
    id: '1',
    question: 'What is the derivative of x²?',
    options: ['2x', 'x²', '2', 'x'],
    correctAnswer: 0,
    explanation: 'The derivative of x² is 2x using the power rule.',
    subject: 'Mathematics',
    difficulty: 'medium' as const
  },
  {
    id: '2',
    question: 'Which element has the chemical symbol "Au"?',
    options: ['Silver', 'Gold', 'Aluminum', 'Argon'],
    correctAnswer: 1,
    explanation: 'Au is the chemical symbol for Gold, derived from the Latin word "aurum".',
    subject: 'Chemistry',
    difficulty: 'easy' as const
  }
];

// Animated Progress Bar Component
const AnimatedProgressBar = ({ value, className = "", delay = 0 }) => {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValue(value);
    }, delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  const getBarColor = (score) => {
    if (score >= 75) return 'bg-gradient-to-r from-emerald-500 to-teal-500';
    if (score >= 65) return 'bg-gradient-to-r from-blue-500 to-indigo-500';
    return 'bg-gradient-to-r from-amber-500 to-orange-500';
  };

  return (
    <div className={`bg-slate-200 rounded-full h-2 relative overflow-hidden ${className}`}>
      <div 
        className={`h-2 rounded-full transition-all duration-1000 ease-out ${getBarColor(value)}`}
        style={{ width: `${animatedValue}%` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
      </div>
    </div>
  );
};

// Enhanced Card Component
const EnhancedCard = ({ children, className = "", hover = true, glow = false, delay = 0 }) => (
  <div 
    className={`
      bg-white rounded-2xl border border-slate-200 shadow-lg
      ${hover ? 'hover:shadow-xl hover:-translate-y-1' : ''}
      ${glow ? 'shadow-teal-100' : ''}
      transition-all duration-500 ease-out
      ${className}
    `}
    style={{ animationDelay: `${delay}ms` }}
  >
    {children}
  </div>
);

const Dashboard: React.FC = () => {
  const [showQuestionDemo, setShowQuestionDemo] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [showCelebration, setCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState(createCelebration.testComplete(85, 5));
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [testData, setTestData] = useState<TestType | null>(null);
  const [recentQuestions, setRecentQuestions] = useState<OrganizedQuestion[]>([]);
  const [userProgress, setUserProgress] = useState(mockUserProgress);
  const [animationKey, setAnimationKey] = useState(0);
  
  const { selectedProduct } = useProduct();
  const navigate = useNavigate();

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      
      try {
        // Fetch questions from Supabase
        const organizedData = await fetchQuestionsFromSupabase();
        
        // Also fetch drill and diagnostic modes separately for accurate counts
        const [drillModes, diagnosticModes] = await Promise.all([
          fetchDrillModes(selectedProduct),
          fetchDiagnosticModes(selectedProduct)
        ]);
        
        // Find the test type for the selected product
        const currentTestType = organizedData.testTypes.find(
          testType => testType.id === selectedProduct
        );

        if (currentTestType || drillModes.length > 0 || diagnosticModes.length > 0) {
          // Add the separately fetched modes to the test type
          if (currentTestType) {
            currentTestType.drillModes = drillModes;
            currentTestType.diagnosticModes = diagnosticModes;
            setTestData(currentTestType);
          } else {
            // Create a basic test type if none exists but we have drill/diagnostic data
            const basicTestType: TestType = {
              id: selectedProduct,
              name: selectedProduct,
              testModes: [],
              drillModes: drillModes,
              diagnosticModes: diagnosticModes
            };
            setTestData(basicTestType);
          }
          
          // Get recent questions from different test modes for preview
          const allQuestions: OrganizedQuestion[] = [];
          const testTypeToUse = currentTestType || {
            id: selectedProduct,
            name: selectedProduct,
            testModes: [],
            drillModes: drillModes,
            diagnosticModes: diagnosticModes
          };
          
          // Add questions from practice test modes
          testTypeToUse.testModes.forEach(mode => {
            mode.sections.forEach(section => {
              allQuestions.push(...section.questions);
            });
          });
          
          // Add questions from drill modes
          if (testTypeToUse.drillModes) {
            testTypeToUse.drillModes.forEach(mode => {
              mode.sections.forEach(section => {
                allQuestions.push(...section.questions);
              });
            });
          }
          
          // Add questions from diagnostic modes
          if (testTypeToUse.diagnosticModes) {
            testTypeToUse.diagnosticModes.forEach(mode => {
              mode.sections.forEach(section => {
                allQuestions.push(...section.questions);
              });
            });
          }
          
          // Take first 5 questions for preview
          setRecentQuestions(allQuestions.slice(0, 5));
          
          // Calculate totals from Supabase data structure
          let diagnosticSections = 0;
          let totalSubSkills = 0;
          let totalPracticeTests = 0;
          
          console.log('🔧 DEBUG: Current test type:', testTypeToUse.id);
          console.log('🔧 DEBUG: Practice test modes:', testTypeToUse.testModes.map(m => ({ name: m.name, sections: m.sections.length })));
          console.log('🔧 DEBUG: Drill modes:', testTypeToUse.drillModes?.map(m => ({ name: m.name, sections: m.sections.length })) || 'None');
          console.log('🔧 DEBUG: Diagnostic modes:', testTypeToUse.diagnosticModes?.map(m => ({ name: m.name, sections: m.sections.length })) || 'None');
          
          // Count diagnostic sections from diagnosticModes
          if (testTypeToUse.diagnosticModes) {
            testTypeToUse.diagnosticModes.forEach(mode => {
              diagnosticSections += mode.sections.length;
              console.log(`🔧 DEBUG: Found diagnostic mode "${mode.name}" with ${mode.sections.length} sections`);
            });
          }
          
          // Count sub-skills from drillModes (each section in drill mode = one sub-skill)
          if (testTypeToUse.drillModes) {
            testTypeToUse.drillModes.forEach(mode => {
              totalSubSkills += mode.sections.length;
              console.log(`🔧 DEBUG: Found drill mode "${mode.name}" with ${mode.sections.length} sub-skills`);
            });
          }
          
          // Count practice tests from testModes (each testMode = 1 practice test)
          totalPracticeTests = testTypeToUse.testModes.length;
          console.log(`🔧 DEBUG: Found ${testTypeToUse.testModes.length} practice test modes`);
          testTypeToUse.testModes.forEach(mode => {
            console.log(`🔧 DEBUG: - Practice test: "${mode.name}" with ${mode.sections.length} sections`);
          });
          
          console.log('🔧 DEBUG: Final totals:', { diagnosticSections, totalSubSkills, totalPracticeTests });
          
          // Use mock progress but real totals
          const updatedProgress = {
            diagnostic: {
              isComplete: false,
              sectionsCompleted: Math.floor(Math.random() * (diagnosticSections + 1)), // Mock progress
              totalSections: diagnosticSections, // Real total from Supabase
              results: null
            },
            drills: {
              questionsCompleted: 150,
              totalQuestions: 500,
              subSkillsDrilled: Math.floor(Math.random() * (totalSubSkills + 1)), // Mock progress
              totalSubSkills: totalSubSkills, // Real total from Supabase
              skillAreasProgress: 5,
              currentFocus: null
            },
            practiceTests: {
              testsCompleted: Math.floor(Math.random() * (totalPracticeTests + 1)), // Mock progress
              totalTests: totalPracticeTests, // Real total from Supabase
              averageScore: 0,
              lastTest: null
            }
          };
          
          console.log('🔧 DEBUG: Updated progress:', updatedProgress);
          setUserProgress(updatedProgress);
        } else {
          // Use placeholder structure if no questions found
          const placeholder = getPlaceholderTestStructure(selectedProduct);
          setTestData(placeholder);
          setRecentQuestions([]);
          
          // Set default values when no data available
          setUserProgress({
            diagnostic: {
              isComplete: false,
              sectionsCompleted: 0,
              totalSections: 4, // Fallback
              results: null
            },
            drills: {
              questionsCompleted: 0,
              totalQuestions: 500,
              subSkillsDrilled: 0,
              totalSubSkills: 8, // Fallback
              skillAreasProgress: 0,
              currentFocus: null
            },
            practiceTests: {
              testsCompleted: 0,
              totalTests: 5, // Fallback
              averageScore: 0,
              lastTest: null
            }
          });
        }
        
        // Trigger animation
        setAnimationKey(prev => prev + 1);
        
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        // Fallback to placeholder
        const placeholder = getPlaceholderTestStructure(selectedProduct);
        setTestData(placeholder);
        setRecentQuestions([]);
        
        // Set default values when no data available
        setUserProgress({
          diagnostic: {
            isComplete: false,
            sectionsCompleted: 0,
            totalSections: 4, // Fallback
            results: null
          },
          drills: {
            questionsCompleted: 0,
            totalQuestions: 500,
            subSkillsDrilled: 0,
            totalSubSkills: 8, // Fallback
            skillAreasProgress: 0,
            currentFocus: null
          },
          practiceTests: {
            testsCompleted: 0,
            totalTests: 5, // Fallback
            averageScore: 0,
            lastTest: null
          }
        });
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [selectedProduct]);

  // Transform Supabase questions for QuestionInterface component
  const transformedQuestions = recentQuestions.map((q, index) => ({
    id: String(index + 1),
    text: q.text,
    options: q.options,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
    topic: q.subSkill,
    subSkill: q.subSkill,
    difficulty: 2 // Set as number (1-3 scale)
  }));

  const handleStartTest = (testId: string) => {
    if (recentQuestions.length > 0) {
      setCurrentQuestionIndex(0);
      setShowQuestionDemo(true);
    } else {
      // Navigate to test selection if no questions available
      navigate('/mock-tests');
    }
  };

  const handleShowCelebration = (type: 'test' | 'improvement' | 'milestone' | 'streak') => {
    let celebration;
    switch (type) {
      case 'test':
        celebration = createCelebration.testComplete(85, 5);
        break;
      case 'improvement':
        celebration = createCelebration.improvement(8, 85);
        break;
      case 'milestone':
        celebration = createCelebration.milestone('Completed 10 Tests', 85);
        break;
      case 'streak':
        celebration = createCelebration.streak(7);
        break;
    }
    setCelebrationData(celebration);
    setCelebration(true);
  };

  const handleAnswer = (answerIndex: number, confidence: number) => {
    console.log('Answer selected:', answerIndex, 'Confidence:', confidence);
  };

  const handleNext = () => {
    if (currentQuestionIndex < transformedQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setShowQuestionDemo(false);
      handleShowCelebration('test');
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleFlag = () => {
    console.log('Question flagged');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-edu-teal mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const totalQuestions = testData ? testData.testModes.reduce((sum, mode) => 
    sum + mode.sections.reduce((sectionSum, section) => sectionSum + section.totalQuestions, 0), 0) : 0;

  // Hero banner configuration
  const heroBannerProps = {
    title: "Welcome back, Student!",
    subtitle: "Ready to continue your learning journey? You're doing great!",
    metrics: [
      {
        icon: <Target size={16} />,
        label: "7-day streak",
        value: ""
      },
      {
        icon: <TrendingUp size={16} />,
        label: "+5% improvement",
        value: ""
      },
      {
        icon: <Award size={16} />,
        label: `${totalQuestions} questions available`,
        value: ""
      }
    ],
    ...(totalQuestions === 0 && {
      warning: {
        icon: <AlertCircle size={16} />,
        message: `Questions for ${testData?.name || 'this test type'} are coming soon...`
      }
    })
  };

  // Metrics cards configuration
  const metricsConfig = [
    {
      title: 'Questions Completed',
      value: '247',
      icon: <BookOpen className="text-white" size={24} />,
      color: {
        bg: 'bg-gradient-to-br from-teal-50 to-cyan-100 border-teal-200',
        iconBg: 'bg-teal-500',
        text: 'text-teal-900'
      }
    },
    {
      title: 'Overall Average Score',
      value: '85%',
      icon: <Target className="text-white" size={24} />,
      color: {
        bg: 'bg-gradient-to-br from-teal-50 to-cyan-100 border-teal-200',
        iconBg: 'bg-teal-500',
        text: 'text-teal-900'
      }
    },
    {
      title: 'Total Study Time',
      value: '24.8h',
      icon: <Clock className="text-white" size={24} />,
      color: {
        bg: 'bg-gradient-to-br from-teal-50 to-cyan-100 border-teal-200',
        iconBg: 'bg-teal-500',
        text: 'text-teal-900'
      }
    },
    {
      title: 'Day Streak',
      value: '7',
      icon: <TrendingUp className="text-white" size={24} />,
      color: {
        bg: 'bg-gradient-to-br from-teal-50 to-cyan-100 border-teal-200',
        iconBg: 'bg-teal-500',
        text: 'text-teal-900'
      }
    }
  ];

  return (
    <div className="space-y-8">
      {/* Standardized Hero Banner */}
      <HeroBanner {...heroBannerProps} />

      {/* Standardized Metrics Cards */}
      <MetricsCards metrics={metricsConfig} />

      {/* Main Content - Enhanced Three Card Horizontal Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10" key={`dashboard-${animationKey}`}>
        {/* 1. Diagnostic Assessment Card */}
        <EnhancedCard 
          className="bg-gradient-to-br from-purple-50 via-violet-50 to-fuchsia-50 border-slate-200 shadow-xl shadow-purple-100" 
          glow
          delay={0}
        >
          <CardHeader className="pb-4 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-purple-500 rounded-2xl shadow-lg">
                <Activity size={32} className="text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-purple-900">Diagnostic Assessment</CardTitle>
                <p className="text-purple-700 text-sm mt-2">Identify your strengths and areas for improvement</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 px-8 pb-8">
            <div className="text-center space-y-4">
              <div className={`p-4 rounded-xl ${userProgress.diagnostic.sectionsCompleted === userProgress.diagnostic.totalSections ? 'bg-green-100 border border-green-200' : 'bg-white/60'}`}>
                <div className={`text-sm mb-1 ${userProgress.diagnostic.sectionsCompleted === userProgress.diagnostic.totalSections ? 'text-green-600' : 'text-purple-600'}`}>Sections Completed</div>
                <div className={`text-xl font-bold ${userProgress.diagnostic.sectionsCompleted === userProgress.diagnostic.totalSections ? 'text-green-700' : 'text-purple-900'}`}>
                  {userProgress.diagnostic.sectionsCompleted}/{userProgress.diagnostic.totalSections}
                </div>
              </div>
            </div>
            <Button 
              onClick={() => {
                if (userProgress.diagnostic.sectionsCompleted === userProgress.diagnostic.totalSections) {
                  navigate('/dashboard/insights');
                } else {
                  navigate('/dashboard/diagnostic');
                }
              }}
              className="w-full h-12 text-base bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 shadow-lg shadow-purple-200 transform hover:scale-105 transition-all duration-200"
            >
              <Sparkles size={18} className="mr-2" />
              {userProgress.diagnostic.sectionsCompleted === 0 
                ? 'Start Diagnostic' 
                : userProgress.diagnostic.sectionsCompleted === userProgress.diagnostic.totalSections 
                  ? 'View Results' 
                  : 'Continue Diagnostic'}
            </Button>
          </CardContent>
        </EnhancedCard>

        {/* 2. Skill Drills Card */}
        <EnhancedCard 
          className="bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 border-slate-200 shadow-xl shadow-orange-100" 
          glow
          delay={200}
        >
          <CardHeader className="pb-4 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-orange-500 rounded-2xl shadow-lg">
                <TargetIcon size={32} className="text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-orange-900">Skill Drills</CardTitle>
                <p className="text-orange-700 text-sm mt-2">Master specific skills through targeted practice</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 px-8 pb-8">
            <div className="text-center space-y-4">
              <div className={`p-4 rounded-xl ${userProgress.drills.subSkillsDrilled === userProgress.drills.totalSubSkills ? 'bg-green-100 border border-green-200' : 'bg-white/60'}`}>
                <div className={`text-sm mb-1 ${userProgress.drills.subSkillsDrilled === userProgress.drills.totalSubSkills ? 'text-green-600' : 'text-orange-600'}`}>Sub-Skills Drilled</div>
                <div className={`text-xl font-bold ${userProgress.drills.subSkillsDrilled === userProgress.drills.totalSubSkills ? 'text-green-700' : 'text-orange-900'}`}>
                  {userProgress.drills.subSkillsDrilled}/{userProgress.drills.totalSubSkills}
                </div>
              </div>
            </div>
            <Button 
              onClick={() => {
                if (userProgress.drills.subSkillsDrilled === userProgress.drills.totalSubSkills) {
                  navigate('/dashboard/insights');
                } else {
                  navigate('/dashboard/drill');
                }
              }}
              className="w-full h-12 text-base bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-lg shadow-orange-200 transform hover:scale-105 transition-all duration-200"
            >
              <Zap size={18} className="mr-2" />
              {userProgress.drills.subSkillsDrilled === 0 
                ? 'Start Drilling' 
                : userProgress.drills.subSkillsDrilled === userProgress.drills.totalSubSkills 
                  ? 'View Results' 
                  : 'Continue Drilling'}
            </Button>
          </CardContent>
        </EnhancedCard>

        {/* 3. Practice Tests Card */}
        <EnhancedCard 
          className="bg-gradient-to-br from-rose-50 via-pink-50 to-red-50 border-slate-200 shadow-xl shadow-rose-100" 
          glow
          delay={400}
        >
          <CardHeader className="pb-4 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-rose-500 rounded-2xl shadow-lg">
                <FileText size={32} className="text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-rose-900">Practice Tests</CardTitle>
                <p className="text-rose-700 text-sm mt-2">Take full-length practice tests to track progress</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 px-8 pb-8">
            <div className="text-center space-y-4">
              <div className={`p-4 rounded-xl ${userProgress.practiceTests.testsCompleted === userProgress.practiceTests.totalTests ? 'bg-green-100 border border-green-200' : 'bg-white/60'}`}>
                <div className={`text-sm mb-1 ${userProgress.practiceTests.testsCompleted === userProgress.practiceTests.totalTests ? 'text-green-600' : 'text-rose-600'}`}>Tests Completed</div>
                <div className={`text-xl font-bold ${userProgress.practiceTests.testsCompleted === userProgress.practiceTests.totalTests ? 'text-green-700' : 'text-rose-900'}`}>
                  {userProgress.practiceTests.testsCompleted}/{userProgress.practiceTests.totalTests}
                </div>
              </div>
            </div>
            <Button 
              onClick={() => {
                if (userProgress.practiceTests.testsCompleted === userProgress.practiceTests.totalTests) {
                  navigate('/dashboard/insights');
                } else {
                  navigate('/dashboard/practice-tests');
                }
              }}
              className="w-full h-12 text-base bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 shadow-lg shadow-rose-200 transform hover:scale-105 transition-all duration-200"
            >
              <Play size={18} className="mr-2" />
              {userProgress.practiceTests.testsCompleted === 0 
                ? 'Start Practice Test' 
                : userProgress.practiceTests.testsCompleted === userProgress.practiceTests.totalTests 
                  ? 'View Results' 
                  : 'Continue Practice Test'}
            </Button>
          </CardContent>
        </EnhancedCard>
      </div>

      {/* Demo Question Interface */}
      {showQuestionDemo && transformedQuestions.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-edu-navy">Practice Test Demo</h2>
                <Button variant="ghost" onClick={() => setShowQuestionDemo(false)}>
                  <X size={20} />
                </Button>
              </div>
              <QuestionInterface
                question={transformedQuestions[currentQuestionIndex]}
                questionNumber={currentQuestionIndex + 1}
                totalQuestions={transformedQuestions.length}
                timeRemaining={300}
                onAnswer={handleAnswer}
                onNext={handleNext}
                onPrevious={handlePrevious}
                onFlag={handleFlag}
                canGoBack={currentQuestionIndex > 0}
                canGoNext={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Performance Insights Modal */}
      {showInsights && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-edu-navy">Performance Insights</h2>
                <Button variant="ghost" onClick={() => setShowInsights(false)}>
                  <X size={20} />
                </Button>
              </div>
              <InteractiveInsightsDashboard 
                userPerformance={mockUserPerformance} 
                testType="practice"
              />
            </div>
          </div>
        </div>
      )}

      {/* Celebration Modal */}
      <CelebrationModal
        isOpen={showCelebration}
        onClose={() => setCelebration(false)}
        celebration={celebrationData}
        onContinue={() => setCelebration(false)}
      />
    </div>
  );
};

export default Dashboard;
