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
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

// Removed mock data - now using real database integration

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
  // Removed userProgress state - now using real progress states
  const [realUserStats, setRealUserStats] = useState({
    totalQuestionsCompleted: 0,
    totalStudyTimeHours: 0,
    currentStreak: 0,
    averageScore: '-'
  });
  const [animationKey, setAnimationKey] = useState(0);
  const [heroMetrics, setHeroMetrics] = useState({
    streak: 0,
    questionsAvailable: 0,
  });
  const [diagnosticProgress, setDiagnosticProgress] = useState({
    sectionsCompleted: 0,
    totalSections: 0,
    hasActiveSession: false,
    activeSessionId: null as string | null,
    resumeProgress: null as {
      currentQuestion: number;
      totalQuestions: number;
      timeRemaining: number;
      answersCount: number;
    } | null
  });
  const [drillProgress, setDrillProgress] = useState({
    subSkillsDrilled: 0,
    totalSubSkills: 0,
    hasActiveSession: false,
    activeSessionId: null as string | null,
    resumeProgress: null as {
      currentQuestion: number;
      totalQuestions: number;
      timeRemaining: number;
      answersCount: number;
    } | null
  });
  const [practiceProgress, setPracticeProgress] = useState({
    testsCompleted: 0,
    totalTests: 5,
    hasActiveSession: false,
    activeSessionId: null as string | null,
    resumeProgress: null as {
      currentQuestion: number;
      totalQuestions: number;
      timeRemaining: number;
      answersCount: number;
    } | null
  });
  
  const { selectedProduct } = useProduct();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!selectedProduct || !user) return;
      setLoading(true);
      try {
        // 1. Fetch user_progress for selected product
        const { data: userProgress, error: userProgressError } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('product_type', selectedProduct)
          .single();
        if (userProgressError) throw userProgressError;

        // 2. Fetch average score from user_test_sessions
        const { data: avgScoreData, error: avgScoreError } = await supabase
          .from('user_test_sessions')
          .select('final_score')
          .eq('user_id', user.id)
          .eq('product_type', selectedProduct)
          .in('status', ['completed'])
          .in('test_mode', ['diagnostic', 'practice']);
        if (avgScoreError) throw avgScoreError;
        let averageScore: string = '-';
        if (avgScoreData && avgScoreData.length > 0) {
          const scores = avgScoreData
            .map((row: { final_score: number | null }) => row.final_score)
            .filter((s: number | null): s is number => typeof s === 'number');
          if (scores.length > 0) {
            averageScore = Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length).toString();
          }
        }

        // 3. Calculate study hours
        let studyHours = 0;
        if (userProgress?.total_study_time_seconds != null) {
          studyHours = Math.round((userProgress.total_study_time_seconds / 3600) * 2) / 2;
        }

        // 4. Set metrics state
        setRealUserStats({
          totalQuestionsCompleted: userProgress?.total_questions_completed ?? 0,
          totalStudyTimeHours: studyHours,
          currentStreak: userProgress?.streak_days ?? 0,
          averageScore: averageScore
        });

        // 5. Hero banner metrics
        // a. Streak
        const streak = userProgress?.streak_days ?? 0;
        // b. Questions available
        const { count: questionsAvailable } = await supabase
          .from('questions')
          .eq('test_type', selectedProduct)
          .select('id', { count: 'exact', head: true });
        setHeroMetrics({
          streak,
          questionsAvailable: questionsAvailable || 0,
        });

        // 6. Diagnostic progress
        // a. Sections completed
        const { data: diagnosticSections } = await supabase
          .from('test_sections')
          .select('section_name')
          .eq('product_type', selectedProduct);
        const totalSections = diagnosticSections ? diagnosticSections.length : 0;
        // b. Completed sections (from user_test_sessions with test_mode 'diagnostic' and status 'completed')
        const { data: completedDiagnosticSections } = await supabase
          .from('user_test_sessions')
          .select('section_name')
          .eq('user_id', user.id)
          .eq('product_type', selectedProduct)
          .eq('test_mode', 'diagnostic')
          .eq('status', 'completed');
        const sectionsCompleted = completedDiagnosticSections ? completedDiagnosticSections.length : 0;
        setDiagnosticProgress({
          sectionsCompleted,
          totalSections,
          hasActiveSession: diagnosticResumeState.canResume,
          activeSessionId: diagnosticResumeState.sessionId || null,
          resumeProgress: diagnosticResumeState.progress || null
        });

        // 7. Skill Drills progress
        // a. Total sub-skills
        const { data: subSkills } = await supabase
          .from('sub_skills')
          .select('id')
          .eq('product_type', selectedProduct);
        const totalSubSkills = subSkills ? subSkills.length : 0;
        // b. Sub-skills drilled (from user_sub_skill_performance with questions_attempted > 0)
        const { data: drilledSubSkills } = await supabase
          .from('user_sub_skill_performance')
          .select('sub_skill_id, questions_attempted')
          .eq('user_id', user.id)
          .eq('product_type', selectedProduct)
          .gt('questions_attempted', 0);
        const subSkillsDrilled = drilledSubSkills ? drilledSubSkills.length : 0;
        setDrillProgress({
          subSkillsDrilled,
          totalSubSkills,
          hasActiveSession: drillResumeState.canResume,
          activeSessionId: drillResumeState.sessionId || null,
          resumeProgress: drillResumeState.progress || null
        });
        
        setPracticeProgress({
          testsCompleted: practiceTestsCompleted,
          totalTests: 5,
          hasActiveSession: practiceResumeState.canResume,
          activeSessionId: practiceResumeState.sessionId || null,
          resumeProgress: practiceResumeState.progress || null
        });

        // 8. Practice Tests progress
        // a. Tests completed (user_test_sessions with test_mode 'practice' and status 'completed')
        const { data: completedPracticeTests } = await supabase
          .from('user_test_sessions')
          .select('id')
          .eq('user_id', user.id)
          .eq('product_type', selectedProduct)
          .eq('test_mode', 'practice')
          .eq('status', 'completed');
        const practiceTestsCompleted = completedPracticeTests ? completedPracticeTests.length : 0;
        
        // Check for active sessions for each test mode
        const { SessionPersistenceService } = await import('@/services/sessionPersistenceService');
        
        // Check diagnostic session state
        const diagnosticResumeState = await SessionPersistenceService.getSessionResumeState(
          user.id,
          selectedProduct,
          'diagnostic'
        );
        
        // Check practice session state  
        const practiceResumeState = await SessionPersistenceService.getSessionResumeState(
          user.id,
          selectedProduct,
          'practice'
        );
        
        // Check drill session state
        const drillResumeState = await SessionPersistenceService.getSessionResumeState(
          user.id,
          selectedProduct,
          'drill'
        );

        // Fetch questions for recent questions display (unchanged)
        const { data: questions } = await supabase
          .from('questions')
          .select('id, question_text, answer_options, correct_answer, solution, sub_skill, section_name, difficulty, passage_id')
          .eq('test_type', selectedProduct)
          .limit(10);
        const transformedQuestions: OrganizedQuestion[] = (questions || []).map(q => ({
          id: q.id,
          text: q.question_text,
          options: Array.isArray(q.answer_options) ? q.answer_options as string[] : [],
          correctAnswer: 0, // Index of correct answer, defaulting to 0
          explanation: q.solution || '',
          subSkill: q.sub_skill,
          section: q.section_name,
          difficulty: q.difficulty,
          passageContent: '',
          type: 'multiple-choice',
          topic: q.section_name,
          hasVisual: false
        }));
        setRecentQuestions(transformedQuestions);

        // Create test structure from questions
        const testStructure = createBasicTestStructure(questions || [], selectedProduct);
        setTestData(testStructure);
        
        setAnimationKey(prev => prev + 1);
        
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setRealUserStats({
          totalQuestionsCompleted: 0,
          totalStudyTimeHours: 0,
          currentStreak: 0,
          averageScore: '-'
        });
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [selectedProduct, user]);

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

  // Metrics cards configuration - NOW USING REAL DATA
  const metricsConfig = [
    {
      title: 'Questions Completed',
      value: realUserStats.totalQuestionsCompleted.toString(),
      icon: <BookOpen className="text-white" size={24} />,
      color: {
        bg: 'bg-gradient-to-br from-teal-50 to-cyan-100 border-teal-200',
        iconBg: 'bg-teal-500',
        text: 'text-teal-900'
      }
    },
    {
      title: 'Overall Average Score',
      value: `${realUserStats.averageScore}`,
      icon: <Target className="text-white" size={24} />,
      color: {
        bg: 'bg-gradient-to-br from-teal-50 to-cyan-100 border-teal-200',
        iconBg: 'bg-teal-500',
        text: 'text-teal-900'
      }
    },
    {
      title: 'Total Study Time',
      value: `${realUserStats.totalStudyTimeHours}h`,
      icon: <Clock className="text-white" size={24} />,
      color: {
        bg: 'bg-gradient-to-br from-teal-50 to-cyan-100 border-teal-200',
        iconBg: 'bg-teal-500',
        text: 'text-teal-900'
      }
    },
    {
      title: 'Day Streak',
      value: realUserStats.currentStreak.toString(),
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
              <div className={`p-4 rounded-xl ${diagnosticProgress.sectionsCompleted === diagnosticProgress.totalSections ? 'bg-green-100 border border-green-200' : 'bg-white/60'}`}>
                <div className={`text-sm mb-1 ${diagnosticProgress.sectionsCompleted === diagnosticProgress.totalSections ? 'text-green-600' : 'text-purple-600'}`}>Sections Completed</div>
                <div className={`text-xl font-bold ${diagnosticProgress.sectionsCompleted === diagnosticProgress.totalSections ? 'text-green-700' : 'text-purple-900'}`}>
                  {diagnosticProgress.sectionsCompleted}/{diagnosticProgress.totalSections}
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {diagnosticProgress.hasActiveSession && diagnosticProgress.resumeProgress && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                  <div className="flex items-center justify-between text-blue-800">
                    <span className="font-medium">Session in Progress</span>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      Q{diagnosticProgress.resumeProgress.currentQuestion}/{diagnosticProgress.resumeProgress.totalQuestions}
                    </Badge>
                  </div>
                  <div className="text-blue-600 mt-1">
                    {diagnosticProgress.resumeProgress.answersCount} answers • {Math.floor(diagnosticProgress.resumeProgress.timeRemaining / 60)}min remaining
                  </div>
                </div>
              )}
              <Button 
                onClick={() => {
                  if (diagnosticProgress.hasActiveSession && diagnosticProgress.activeSessionId) {
                    navigate(`/test-taking/diagnostic/section/${diagnosticProgress.activeSessionId}`);
                  } else if (diagnosticProgress.sectionsCompleted === diagnosticProgress.totalSections) {
                    navigate('/dashboard/insights');
                  } else {
                    navigate('/dashboard/diagnostic');
                  }
                }}
                className="w-full h-12 text-base bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 shadow-lg shadow-purple-200 transform hover:scale-105 transition-all duration-200"
              >
                <Sparkles size={18} className="mr-2" />
                {diagnosticProgress.hasActiveSession
                  ? 'Resume Diagnostic'
                  : diagnosticProgress.sectionsCompleted === 0 
                    ? 'Start Diagnostic' 
                    : diagnosticProgress.sectionsCompleted === diagnosticProgress.totalSections 
                      ? 'View Results' 
                      : 'Continue Diagnostic'}
              </Button>
            </div>
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
              <div className={`p-4 rounded-xl ${drillProgress.subSkillsDrilled === drillProgress.totalSubSkills ? 'bg-green-100 border border-green-200' : 'bg-white/60'}`}>
                <div className={`text-sm mb-1 ${drillProgress.subSkillsDrilled === drillProgress.totalSubSkills ? 'text-green-600' : 'text-orange-600'}`}>Sub-Skills Drilled</div>
                <div className={`text-xl font-bold ${drillProgress.subSkillsDrilled === drillProgress.totalSubSkills ? 'text-green-700' : 'text-orange-900'}`}>
                  {drillProgress.subSkillsDrilled}/{drillProgress.totalSubSkills}
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {drillProgress.hasActiveSession && drillProgress.resumeProgress && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm">
                  <div className="flex items-center justify-between text-orange-800">
                    <span className="font-medium">Drill in Progress</span>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                      Q{drillProgress.resumeProgress.currentQuestion}/{drillProgress.resumeProgress.totalQuestions}
                    </Badge>
                  </div>
                  <div className="text-orange-600 mt-1">
                    {drillProgress.resumeProgress.answersCount} answers completed
                  </div>
                </div>
              )}
              <Button 
                onClick={() => {
                  if (drillProgress.hasActiveSession && drillProgress.activeSessionId) {
                    navigate(`/test-taking/drill/section/${drillProgress.activeSessionId}`);
                  } else if (drillProgress.subSkillsDrilled === drillProgress.totalSubSkills) {
                    navigate('/dashboard/insights');
                  } else {
                    navigate('/dashboard/drill');
                  }
                }}
                className="w-full h-12 text-base bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-lg shadow-orange-200 transform hover:scale-105 transition-all duration-200"
              >
                <Zap size={18} className="mr-2" />
                {drillProgress.hasActiveSession
                  ? 'Resume Drill'
                  : drillProgress.subSkillsDrilled === 0 
                    ? 'Start Drilling' 
                    : drillProgress.subSkillsDrilled === drillProgress.totalSubSkills 
                      ? 'View Results' 
                      : 'Continue Drilling'}
              </Button>
            </div>
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
              <div className={`p-4 rounded-xl ${practiceProgress.testsCompleted === practiceProgress.totalTests ? 'bg-green-100 border border-green-200' : 'bg-white/60'}`}>
                <div className={`text-sm mb-1 ${practiceProgress.testsCompleted === practiceProgress.totalTests ? 'text-green-600' : 'text-rose-600'}`}>Tests Completed</div>
                <div className={`text-xl font-bold ${practiceProgress.testsCompleted === practiceProgress.totalTests ? 'text-green-700' : 'text-rose-900'}`}>
                  {practiceProgress.testsCompleted}/{practiceProgress.totalTests}
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {practiceProgress.hasActiveSession && practiceProgress.resumeProgress && (
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-sm">
                  <div className="flex items-center justify-between text-rose-800">
                    <span className="font-medium">Practice Test in Progress</span>
                    <Badge variant="secondary" className="bg-rose-100 text-rose-800">
                      Q{practiceProgress.resumeProgress.currentQuestion}/{practiceProgress.resumeProgress.totalQuestions}
                    </Badge>
                  </div>
                  <div className="text-rose-600 mt-1">
                    {practiceProgress.resumeProgress.answersCount} answers • {Math.floor(practiceProgress.resumeProgress.timeRemaining / 60)}min remaining
                  </div>
                </div>
              )}
              <Button 
                onClick={() => {
                  if (practiceProgress.hasActiveSession && practiceProgress.activeSessionId) {
                    navigate(`/test-taking/practice/section/${practiceProgress.activeSessionId}`);
                  } else if (practiceProgress.testsCompleted === practiceProgress.totalTests) {
                    navigate('/dashboard/insights');
                  } else {
                    navigate('/dashboard/practice-tests');
                  }
                }}
                className="w-full h-12 text-base bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 shadow-lg shadow-rose-200 transform hover:scale-105 transition-all duration-200"
              >
                <Play size={18} className="mr-2" />
                {practiceProgress.hasActiveSession
                  ? 'Resume Practice Test'
                  : practiceProgress.testsCompleted === 0 
                    ? 'Start Practice Test' 
                    : practiceProgress.testsCompleted === practiceProgress.totalTests 
                      ? 'View Results' 
                      : 'Continue Practice Test'}
              </Button>
            </div>
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
              <div className="p-6 text-center text-gray-500">
                <p>Performance insights will be available once you complete some tests.</p>
                <Button onClick={() => setShowInsights(false)} className="mt-4">
                  Start Taking Tests
                </Button>
              </div>
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

// Helper function to create basic test structure
const createBasicTestStructure = (questions: { section_name: string; test_mode: string }[], productType: string): TestType => {
  const sections = [...new Set(questions.map(q => q.section_name))];
  const testModes = [...new Set(questions.map(q => q.test_mode))];
  
  return {
    id: productType,
    name: productType,
    testModes: testModes.map(mode => ({
      id: mode,
      name: mode,
      type: mode,
      totalQuestions: questions.filter(q => q.section_name === mode).length,
      estimatedTime: 60, // Default 60 minutes
      sections: sections.map(section => ({
        id: section,
        name: section,
        totalQuestions: questions.filter(q => q.section_name === section && q.test_mode === mode).length,
        status: 'not-started' as const,
        questions: []
      }))
    })),
    drillModes: [{
      id: 'drill',
      name: 'Skill Drills',
      type: 'drill',
      totalQuestions: questions.length,
      estimatedTime: 30,
      sections: sections.map(section => ({
        id: section,
        name: section,
        totalQuestions: questions.filter(q => q.section_name === section).length,
        status: 'not-started' as const,
        questions: []
      }))
    }],
    diagnosticModes: [{
      id: 'diagnostic',
      name: 'Diagnostic Test',
      type: 'diagnostic',
      totalQuestions: questions.filter(q => q.test_mode === 'diagnostic').length,
      estimatedTime: 90,
      sections: sections.map(section => ({
        id: section,
        name: section,
        totalQuestions: questions.filter(q => q.section_name === section && q.test_mode === 'diagnostic').length,
        status: 'not-started' as const,
        questions: []
      }))
    }]
  };
};

export default Dashboard;
