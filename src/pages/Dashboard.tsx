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

// Map frontend product IDs to database product_type values
const getDbProductType = (productId: string): string => {
  const productMap: Record<string, string> = {
    'vic-selective': 'VIC Selective Entry (Year 9 Entry)',
    'nsw-selective': 'NSW Selective Entry (Year 7 Entry)',
    'year-5-naplan': 'Year 5 NAPLAN',
    'year-7-naplan': 'Year 7 NAPLAN',
    'edutest-year-7': 'EduTest Scholarship (Year 7 Entry)',
    'acer-year-7': 'ACER Scholarship (Year 7 Entry)'
  };
  return productMap[productId] || productId;
};

const Dashboard: React.FC = () => {
  const { selectedProduct } = useProduct();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [realUserStats, setRealUserStats] = useState({
    totalQuestionsCompleted: 0,
    totalStudyTimeHours: 0,
    currentStreak: 0,
    averageScore: '-'
  });
  const [heroMetrics, setHeroMetrics] = useState({
    streak: 0,
    questionsAvailable: 0,
  });
  const [diagnosticProgress, setDiagnosticProgress] = useState({
    sectionsCompleted: 0,
    totalSections: 0,
    hasActiveSession: false,
    activeSessionId: null as string | null,
    resumeProgress: null as any
  });
  const [drillProgress, setDrillProgress] = useState({
    subSkillsDrilled: 0,
    totalSubSkills: 0,
    hasActiveSession: false,
    activeSessionId: null as string | null,
    resumeProgress: null as any
  });
  const [practiceProgress, setPracticeProgress] = useState({
    testsCompleted: 0,
    totalTests: 5,
    hasActiveSession: false,
    activeSessionId: null as string | null,
    resumeProgress: null as any
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!selectedProduct || !user) return;
      setLoading(true);
      
      try {
        const dbProductType = getDbProductType(selectedProduct);
        
        // 1. Basic user progress and metrics
        const { data: userProgress } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('product_type', dbProductType)
          .single();
        
        setRealUserStats({
          totalQuestionsCompleted: userProgress?.total_questions_completed ?? 0,
          totalStudyTimeHours: Math.round((userProgress?.total_study_time_seconds || 0) / 3600 * 2) / 2,
          currentStreak: userProgress?.streak_days ?? 0,
          averageScore: '-'
        });
        
        setHeroMetrics({
          streak: userProgress?.streak_days ?? 0,
          questionsAvailable: 0,
        });
        
        // 2. Diagnostic Progress: Count unique completed sections
        const { data: diagnosticSections } = await supabase
          .from('test_sections')
          .select('section_name')
          .eq('product_type', dbProductType);
        
        const { data: completedDiagnosticSessions } = await supabase
          .from('user_test_sessions')
          .select('section_name')
          .eq('user_id', user.id)
          .eq('product_type', selectedProduct)
          .eq('test_mode', 'diagnostic')
          .eq('status', 'completed');
        
        const uniqueCompletedSections = [...new Set(completedDiagnosticSessions?.map(s => s.section_name) || [])];
        
        setDiagnosticProgress({
          sectionsCompleted: uniqueCompletedSections.length,
          totalSections: diagnosticSections?.length || 0,
          hasActiveSession: false,
          activeSessionId: null,
          resumeProgress: null
        });
        
        // 3. Practice Tests Progress: Count complete test sets (5 sections = 1 test)
        const { data: practiceTestSessions } = await supabase
          .from('user_test_sessions')
          .select('section_name, created_at')
          .eq('user_id', user.id)
          .eq('product_type', selectedProduct)
          .eq('test_mode', 'practice')
          .eq('status', 'completed')
          .order('created_at');
        
        // Group by day and count complete tests
        const requiredSections = ['General Ability - Verbal', 'General Ability - Quantitative', 'Writing', 'Mathematics Reasoning', 'Reading Reasoning'];
        const sectionsByDay = {};
        
        practiceTestSessions?.forEach(session => {
          const day = session.created_at.split('T')[0];
          if (!sectionsByDay[day]) sectionsByDay[day] = new Set();
          sectionsByDay[day].add(session.section_name);
        });
        
        const completedPracticeTests = Object.values(sectionsByDay).filter(
          (sections: Set<string>) => requiredSections.every(req => sections.has(req))
        ).length;
        
        setPracticeProgress({
          testsCompleted: completedPracticeTests,
          totalTests: 5,
          hasActiveSession: false,
          activeSessionId: null,
          resumeProgress: null
        });
        
        // 4. Skill Drills Progress: For now set to 0 until we identify the data source
        const { data: subSkills } = await supabase
          .from('sub_skills')
          .select('id')
          .eq('product_type', dbProductType);
        
        setDrillProgress({
          subSkillsDrilled: 0, // Will fix this once we identify the correct data source
          totalSubSkills: subSkills?.length || 0,
          hasActiveSession: false,
          activeSessionId: null,
          resumeProgress: null
        });
        
      } catch (err) {
        console.error('Dashboard load error:', err);
        // Set defaults on error
        setDiagnosticProgress({ sectionsCompleted: 0, totalSections: 0, hasActiveSession: false, activeSessionId: null, resumeProgress: null });
        setPracticeProgress({ testsCompleted: 0, totalTests: 5, hasActiveSession: false, activeSessionId: null, resumeProgress: null });
        setDrillProgress({ subSkillsDrilled: 0, totalSubSkills: 0, hasActiveSession: false, activeSessionId: null, resumeProgress: null });
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [selectedProduct, user]);

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
        label: `${heroMetrics.questionsAvailable} questions available`,
        value: ""
      }
    ]
  };

  // Metrics cards configuration
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
      {/* Hero Banner */}
      <HeroBanner {...heroBannerProps} />

      {/* Metrics Cards */}
      <MetricsCards metrics={metricsConfig} />

      {/* Main Content - Three Card Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* 1. Diagnostic Assessment Card */}
        <Card className={`${diagnosticProgress.sectionsCompleted === diagnosticProgress.totalSections && diagnosticProgress.totalSections > 0 
          ? 'bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-green-200 shadow-xl shadow-green-100' 
          : 'bg-gradient-to-br from-purple-50 via-violet-50 to-fuchsia-50 border-slate-200 shadow-xl shadow-purple-100'}`}>
          <CardHeader className="pb-4 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className={`p-4 rounded-2xl shadow-lg ${
                diagnosticProgress.sectionsCompleted === diagnosticProgress.totalSections && diagnosticProgress.totalSections > 0
                  ? 'bg-green-500' 
                  : 'bg-purple-500'
              }`}>
                <Activity size={32} className="text-white" />
              </div>
              <div>
                <CardTitle className={`text-2xl font-bold ${
                  diagnosticProgress.sectionsCompleted === diagnosticProgress.totalSections && diagnosticProgress.totalSections > 0
                    ? 'text-green-900' 
                    : 'text-purple-900'
                }`}>Diagnostic Assessment</CardTitle>
                <p className={`text-sm mt-2 ${
                  diagnosticProgress.sectionsCompleted === diagnosticProgress.totalSections && diagnosticProgress.totalSections > 0
                    ? 'text-green-700' 
                    : 'text-purple-700'
                }`}>Identify your strengths and areas for improvement</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 px-8 pb-8">
            <div className="text-center space-y-4">
              <div className={`p-4 rounded-xl ${diagnosticProgress.sectionsCompleted === diagnosticProgress.totalSections && diagnosticProgress.totalSections > 0 ? 'bg-green-100 border border-green-200' : 'bg-white/60'}`}>
                <div className={`text-sm mb-1 ${diagnosticProgress.sectionsCompleted === diagnosticProgress.totalSections && diagnosticProgress.totalSections > 0 ? 'text-green-600' : 'text-purple-600'}`}>Sections Completed</div>
                <div className={`text-xl font-bold ${diagnosticProgress.sectionsCompleted === diagnosticProgress.totalSections && diagnosticProgress.totalSections > 0 ? 'text-green-700' : 'text-purple-900'}`}>
                  {diagnosticProgress.sectionsCompleted}/{diagnosticProgress.totalSections}
                </div>
              </div>
            </div>
            <Button 
              onClick={() => navigate('/dashboard/diagnostic')}
              className={`w-full h-12 text-base shadow-lg transform hover:scale-105 transition-all duration-200 ${
                diagnosticProgress.sectionsCompleted === diagnosticProgress.totalSections && diagnosticProgress.totalSections > 0
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-green-200'
                  : 'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 shadow-purple-200'
              }`}
            >
              <Sparkles size={18} className="mr-2" />
              {diagnosticProgress.sectionsCompleted === diagnosticProgress.totalSections && diagnosticProgress.totalSections > 0
                ? 'View Results' 
                : diagnosticProgress.sectionsCompleted === 0 
                  ? 'Start Diagnostic' 
                  : 'Continue Diagnostic'}
            </Button>
          </CardContent>
        </Card>

        {/* 2. Skill Drills Card */}
        <Card className={`${drillProgress.subSkillsDrilled === drillProgress.totalSubSkills && drillProgress.totalSubSkills > 0 
          ? 'bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-green-200 shadow-xl shadow-green-100' 
          : 'bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 border-slate-200 shadow-xl shadow-orange-100'}`}>
          <CardHeader className="pb-4 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className={`p-4 rounded-2xl shadow-lg ${
                drillProgress.subSkillsDrilled === drillProgress.totalSubSkills && drillProgress.totalSubSkills > 0
                  ? 'bg-green-500' 
                  : 'bg-orange-500'
              }`}>
                <TargetIcon size={32} className="text-white" />
              </div>
              <div>
                <CardTitle className={`text-2xl font-bold ${
                  drillProgress.subSkillsDrilled === drillProgress.totalSubSkills && drillProgress.totalSubSkills > 0
                    ? 'text-green-900' 
                    : 'text-orange-900'
                }`}>Skill Drills</CardTitle>
                <p className={`text-sm mt-2 ${
                  drillProgress.subSkillsDrilled === drillProgress.totalSubSkills && drillProgress.totalSubSkills > 0
                    ? 'text-green-700' 
                    : 'text-orange-700'
                }`}>Master specific skills through targeted practice</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 px-8 pb-8">
            <div className="text-center space-y-4">
              <div className={`p-4 rounded-xl ${drillProgress.subSkillsDrilled === drillProgress.totalSubSkills && drillProgress.totalSubSkills > 0 ? 'bg-green-100 border border-green-200' : 'bg-white/60'}`}>
                <div className={`text-sm mb-1 ${drillProgress.subSkillsDrilled === drillProgress.totalSubSkills && drillProgress.totalSubSkills > 0 ? 'text-green-600' : 'text-orange-600'}`}>Sub-Skills Drilled</div>
                <div className={`text-xl font-bold ${drillProgress.subSkillsDrilled === drillProgress.totalSubSkills && drillProgress.totalSubSkills > 0 ? 'text-green-700' : 'text-orange-900'}`}>
                  {drillProgress.subSkillsDrilled}/{drillProgress.totalSubSkills}
                </div>
              </div>
            </div>
            <Button 
              onClick={() => navigate('/dashboard/drill')}
              className={`w-full h-12 text-base shadow-lg transform hover:scale-105 transition-all duration-200 ${
                drillProgress.subSkillsDrilled === drillProgress.totalSubSkills && drillProgress.totalSubSkills > 0
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-green-200'
                  : 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-orange-200'
              }`}
            >
              <Zap size={18} className="mr-2" />
              {drillProgress.subSkillsDrilled === drillProgress.totalSubSkills && drillProgress.totalSubSkills > 0
                ? 'View Results' 
                : drillProgress.subSkillsDrilled === 0 
                  ? 'Start Drilling' 
                  : 'Continue Drilling'}
            </Button>
          </CardContent>
        </Card>

        {/* 3. Practice Tests Card */}
        <Card className={`${practiceProgress.testsCompleted === practiceProgress.totalTests 
          ? 'bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-green-200 shadow-xl shadow-green-100' 
          : 'bg-gradient-to-br from-rose-50 via-pink-50 to-red-50 border-slate-200 shadow-xl shadow-rose-100'}`}>
          <CardHeader className="pb-4 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className={`p-4 rounded-2xl shadow-lg ${
                practiceProgress.testsCompleted === practiceProgress.totalTests
                  ? 'bg-green-500' 
                  : 'bg-rose-500'
              }`}>
                <FileText size={32} className="text-white" />
              </div>
              <div>
                <CardTitle className={`text-2xl font-bold ${
                  practiceProgress.testsCompleted === practiceProgress.totalTests
                    ? 'text-green-900' 
                    : 'text-rose-900'
                }`}>Practice Tests</CardTitle>
                <p className={`text-sm mt-2 ${
                  practiceProgress.testsCompleted === practiceProgress.totalTests
                    ? 'text-green-700' 
                    : 'text-rose-700'
                }`}>Take full-length practice tests to track progress</p>
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
            <Button 
              onClick={() => navigate('/dashboard/practice-tests')}
              className={`w-full h-12 text-base shadow-lg transform hover:scale-105 transition-all duration-200 ${
                practiceProgress.testsCompleted === practiceProgress.totalTests
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-green-200'
                  : 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 shadow-rose-200'
              }`}
            >
              <Play size={18} className="mr-2" />
              {practiceProgress.testsCompleted === practiceProgress.totalTests
                ? 'View Results' 
                : practiceProgress.testsCompleted === 0 
                  ? 'Start Practice Test' 
                  : 'Continue Practice Tests'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;