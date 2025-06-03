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
  ChevronRight, Brain, AlertCircle, X
} from 'lucide-react';
import { CelebrationModal, createCelebration } from '@/components/CelebrationModal';
import { InteractiveInsightsDashboard } from '@/components/InteractiveInsightsDashboard';
import { QuestionInterface } from '@/components/QuestionInterface';
import { useProduct } from '@/context/ProductContext';
import { useNavigate } from 'react-router-dom';
import { 
  fetchQuestionsFromSupabase, 
  getPlaceholderTestStructure,
  type TestType,
  type TestMode,
  type TestSection,
  type OrganizedQuestion
} from '@/services/supabaseQuestionService';

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

const upcomingTests = [
  {
    id: '1',
    title: 'Mathematics Mock Exam',
    subject: 'Mathematics',
    date: '2024-01-20',
    duration: 90,
    questions: 30,
    difficulty: 'Advanced'
  },
  {
    id: '2',
    title: 'Science Practice Test',
    subject: 'Science',
    date: '2024-01-22',
    duration: 60,
    questions: 25,
    difficulty: 'Intermediate'
  },
  {
    id: '3',
    title: 'English Comprehension',
    subject: 'English',
    date: '2024-01-25',
    duration: 45,
    questions: 20,
    difficulty: 'Intermediate'
  }
];

const recentAchievements = [
  {
    title: 'Math Master',
    description: 'Scored 85% or higher on 3 consecutive math tests',
    icon: <Award className="text-yellow-500" size={20} />,
    date: '2 days ago'
  },
  {
    title: 'Study Streak',
    description: '7 days of consistent practice',
    icon: <Zap className="text-orange-500" size={20} />,
    date: '1 day ago'
  },
  {
    title: 'Quick Learner',
    description: 'Completed test in under 30 minutes',
    icon: <Clock className="text-blue-500" size={20} />,
    date: '3 days ago'
  }
];

const Dashboard: React.FC = () => {
  const [showQuestionDemo, setShowQuestionDemo] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [showCelebration, setCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState(createCelebration.testComplete(85, 5));
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [testData, setTestData] = useState<TestType | null>(null);
  const [recentQuestions, setRecentQuestions] = useState<OrganizedQuestion[]>([]);
  
  const { selectedProduct } = useProduct();
  const navigate = useNavigate();

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      
      try {
        // Fetch questions from Supabase
        const organizedData = await fetchQuestionsFromSupabase();
        
        // Find the test type for the selected product
        const currentTestType = organizedData.testTypes.find(
          testType => testType.id === selectedProduct
        );

        if (currentTestType && currentTestType.testModes.length > 0) {
          setTestData(currentTestType);
          
          // Get recent questions from different test modes for preview
          const allQuestions: OrganizedQuestion[] = [];
          currentTestType.testModes.forEach(mode => {
            mode.sections.forEach(section => {
              allQuestions.push(...section.questions);
            });
          });
          
          // Take first 5 questions for preview
          setRecentQuestions(allQuestions.slice(0, 5));
        } else {
          // Use placeholder structure if no questions found
          const placeholder = getPlaceholderTestStructure(selectedProduct);
          setTestData(placeholder);
          setRecentQuestions([]);
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        // Fallback to placeholder
        const placeholder = getPlaceholderTestStructure(selectedProduct);
        setTestData(placeholder);
        setRecentQuestions([]);
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

  // Get upcoming tests from test modes
  const upcomingTests = testData ? testData.testModes.map((mode, index) => ({
    id: String(index + 1),
    title: `${testData.name} - ${mode.name}`,
    subject: testData.name,
    date: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    duration: mode.sections.reduce((sum, section) => sum + (section.timeLimit || 0), 0),
    questions: mode.sections.reduce((sum, section) => sum + section.totalQuestions, 0),
    difficulty: mode.type === 'diagnostic' ? 'Assessment' : 
                mode.type.includes('practice') ? 'Beginner' :
                mode.type === 'drill' ? 'Intermediate' : 'Advanced'
  })) : [];

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
    title: "Welcome back, Student! 👋",
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
    actions: [
      {
        label: totalQuestions > 0 ? 'Start Practice' : 'Coming Soon',
        icon: <Play size={20} className="mr-2" />,
        onClick: () => handleStartTest('1'),
        disabled: totalQuestions === 0
      },
      {
        label: 'View Insights',
        icon: <BarChart3 size={20} className="mr-2" />,
        onClick: () => setShowInsights(true),
        variant: 'outline' as const
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
      title: 'Total Questions',
      value: totalQuestions.toString(),
      icon: <BookOpen className="text-white" size={24} />,
      badge: { text: 'Available', variant: 'default' as const },
      color: {
        bg: 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200',
        iconBg: 'bg-blue-500',
        text: 'text-blue-900'
      }
    },
    {
      title: 'Average Score',
      value: '85%',
      icon: <Target className="text-white" size={24} />,
      badge: { text: '+15%', variant: 'success' as const },
      color: {
        bg: 'bg-gradient-to-br from-green-50 to-green-100 border-green-200',
        iconBg: 'bg-green-500',
        text: 'text-green-900'
      }
    },
    {
      title: 'Study Time',
      value: '4.2h',
      icon: <Clock className="text-white" size={24} />,
      badge: { text: 'This week', variant: 'secondary' as const },
      color: {
        bg: 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200',
        iconBg: 'bg-purple-500',
        text: 'text-purple-900'
      }
    },
    {
      title: 'Day Streak',
      value: '7',
      icon: <TrendingUp className="text-white" size={24} />,
      badge: { text: '7 days', variant: 'warning' as const },
      color: {
        bg: 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200',
        iconBg: 'bg-orange-500',
        text: 'text-orange-900'
      }
    }
  ];

  return (
    <div className="space-y-8">
      {/* Standardized Hero Banner */}
      <HeroBanner {...heroBannerProps} />

      {/* Standardized Metrics Cards */}
      <MetricsCards metrics={metricsConfig} />

      {/* Main Content Grid - White Background */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity & Quick Practice */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Practice Section */}
          <Card className="bg-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Brain size={20} />
                  <span>Quick Practice</span>
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/dashboard/practice-tests')}
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {totalQuestions > 0 ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Jump into practice with questions from {testData?.name}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {testData?.testModes.slice(0, 2).map((mode, index) => (
                      <div key={mode.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <h4 className="font-medium text-sm mb-2">{mode.name}</h4>
                        <p className="text-xs text-muted-foreground mb-3">
                          {mode.sections.reduce((sum, section) => sum + section.totalQuestions, 0)} questions
                        </p>
                        <Button 
                          size="sm" 
                          className="w-full"
                          onClick={() => navigate(`/test/${mode.type}/start`)}
                        >
                          <Play size={14} className="mr-1" />
                          Start
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Practice Questions Coming Soon</h3>
                  <p className="text-gray-600 mb-4">
                    We're preparing practice questions for {testData?.name || 'this test type'}.
                  </p>
                  <Button variant="outline" onClick={() => navigate('/dashboard/practice-tests')}>
                    Explore Other Tests
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Tests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar size={20} />
                <span>Available Test Modes</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingTests.length > 0 ? upcomingTests.slice(0, 3).map((test) => (
                  <div key={test.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{test.title}</h4>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center space-x-1">
                          <BookOpen size={12} />
                          <span>{test.questions} questions</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock size={12} />
                          <span>{test.duration}m</span>
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {test.difficulty}
                        </Badge>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => navigate('/mock-tests')}
                      disabled={test.questions === 0}
                    >
                      <ArrowRight size={14} />
                    </Button>
                  </div>
                )) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500">No test modes available yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recent Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award size={20} />
                <span>Recent Achievements</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentAchievements.map((achievement, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {achievement.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{achievement.title}</h4>
                      <p className="text-xs text-muted-foreground">{achievement.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{achievement.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => navigate('/diagnostic')}
                >
                  <Brain size={16} className="mr-2" />
                  Take Diagnostic Test
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => navigate('/mock-tests')}
                >
                  <BookOpen size={16} className="mr-2" />
                  Browse Practice Tests
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => setShowInsights(true)}
                >
                  <BarChart3 size={16} className="mr-2" />
                  View Progress
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
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
