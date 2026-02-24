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
import { PaywallComponent } from '@/components/PaywallComponent';
import AccessDebugger from '@/components/AccessDebugger';
import { isPaywallUIEnabled } from '@/config/stripeConfig';
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
import { fetchDashboardMetrics, type DashboardMetrics } from '@/services/dashboardService';

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
  const { selectedProduct, currentProduct, hasAccessToCurrentProduct, productAccess } = useProduct();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!selectedProduct || !user) return;
      setLoading(true);
      
      try {
        console.log('📊 DASHBOARD: Loading metrics for product:', selectedProduct, 'user:', user.id);
        
        // Load both metrics and user profile in parallel
        const [metrics, profileResult] = await Promise.all([
          fetchDashboardMetrics(user.id, selectedProduct),
          supabase.from('user_profiles').select('*').eq('user_id', user.id)
        ]);
        
        setDashboardMetrics(metrics);
        
        if (profileResult.data && profileResult.data.length > 0) {
          setUserProfile(profileResult.data[0]);
        }
        
        console.log('📊 DASHBOARD: Data loaded successfully:', { metrics, profile: profileResult.data });
      } catch (err) {
        console.error('📊 DASHBOARD: Error loading metrics:', err);
        // Set default metrics on error
        setDashboardMetrics({
          totalQuestionsCompleted: 0,
          totalStudyTimeHours: 0,
          currentStreak: 0,
          averageScore: '-',
          overallAccuracy: '-',
          questionsAvailable: 0,
          lastActivityDate: null,
          diagnostic: { sectionsCompleted: 0, totalSections: 0, hasActiveSession: false, activeSessionId: null },
          practice: { testsCompleted: 0, totalTests: 5, hasActiveSession: false, activeSessionId: null },
          drill: { subSkillsCompleted: 0, totalSubSkills: 0, hasActiveSession: false, activeSessionId: null }
        });
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [selectedProduct, user]);

  if (loading || !dashboardMetrics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-edu-teal mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Debug component - REMOVE IN PRODUCTION
  const showDebugger = process.env.NODE_ENV === 'development';
  
  // Check if paywall should be shown
  if (isPaywallUIEnabled() && !hasAccessToCurrentProduct && currentProduct) {
    return (
      <div className="min-h-screen bg-edu-light-blue space-y-4 p-4">
        {showDebugger && <AccessDebugger />}
        <PaywallComponent 
          product={currentProduct} 
          className="min-h-screen"
        />
      </div>
    );
  }

  // Hero banner configuration
  const getWelcomeTitle = () => {
    if (userProfile?.student_first_name) {
      return `Welcome back, ${userProfile.student_first_name}!`;
    }
    return "Welcome back!";
  };

  const heroBannerProps = {
    title: getWelcomeTitle(),
    subtitle: "Ready to continue your learning journey? You're doing great!",
    metrics: []
  };

  // Metrics cards configuration
  const metricsConfig = [
    {
      title: 'Questions Completed',
      value: dashboardMetrics.totalQuestionsCompleted.toString(),
      icon: <BookOpen className="text-white" size={24} />,
      color: {
        bg: 'bg-gradient-to-br from-teal-50 to-cyan-100 border-teal-200',
        iconBg: 'bg-teal-500',
        text: 'text-teal-900'
      }
    },
    {
      title: 'Overall Average Score',
      value: `${dashboardMetrics.averageScore}${dashboardMetrics.averageScore !== '-' ? '%' : ''}`,
      icon: <Target className="text-white" size={24} />,
      color: {
        bg: 'bg-gradient-to-br from-teal-50 to-cyan-100 border-teal-200',
        iconBg: 'bg-teal-500',
        text: 'text-teal-900'
      }
    },
    {
      title: 'Overall Accuracy',
      value: `${dashboardMetrics.overallAccuracy}${dashboardMetrics.overallAccuracy !== '-' ? '%' : ''}`,
      icon: <TrendingUp className="text-white" size={24} />,
      color: {
        bg: 'bg-gradient-to-br from-teal-50 to-cyan-100 border-teal-200',
        iconBg: 'bg-teal-500',
        text: 'text-teal-900'
      }
    },
    {
      title: 'Total Study Time',
      value: (() => {
        const totalHours = dashboardMetrics.totalStudyTimeHours;
        const hours = Math.floor(totalHours);
        const minutes = Math.round((totalHours % 1) * 60);
        if (hours === 0 && minutes === 0) return '0m';
        if (hours === 0) return `${minutes}m`;
        if (minutes === 0) return `${hours}h`;
        return `${hours}h ${minutes}m`;
      })(),
      icon: <Clock className="text-white" size={24} />,
      color: {
        bg: 'bg-gradient-to-br from-teal-50 to-cyan-100 border-teal-200',
        iconBg: 'bg-teal-500',
        text: 'text-teal-900'
      }
    }
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Debug Component - REMOVE IN PRODUCTION */}
      {showDebugger && <AccessDebugger />}
      
      {/* Hero Banner */}
      <HeroBanner {...heroBannerProps} />

      {/* Metrics Cards */}
      <MetricsCards metrics={metricsConfig} />

      {/* Main Content - Three Card Layout - Optimized for tablets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {/* 1. Diagnostic Assessment Card */}
        <Card className={`relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 flex flex-col h-full ${dashboardMetrics.diagnostic.sectionsCompleted === dashboardMetrics.diagnostic.totalSections && dashboardMetrics.diagnostic.totalSections > 0
          ? 'bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-2 border-green-200/50 shadow-xl shadow-green-200/30'
          : 'bg-gradient-to-br from-purple-50 via-violet-50 to-fuchsia-50 border-2 border-purple-200/50 shadow-xl shadow-purple-200/30'}`}>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-lg flex-shrink-0 transition-all duration-300 hover:scale-110 ${
                dashboardMetrics.diagnostic.sectionsCompleted === dashboardMetrics.diagnostic.totalSections && dashboardMetrics.diagnostic.totalSections > 0
                  ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/40'
                  : 'bg-gradient-to-br from-purple-500 to-purple-600 shadow-purple-500/40'
              }`}>
                <Activity className="text-white w-6 h-6 sm:w-8 sm:h-8 transition-transform duration-300 hover:rotate-12" />
              </div>
              <div className="text-center sm:text-left flex-1">
                <CardTitle className={`text-xl sm:text-2xl font-bold mb-1 ${
                  dashboardMetrics.diagnostic.sectionsCompleted === dashboardMetrics.diagnostic.totalSections && dashboardMetrics.diagnostic.totalSections > 0
                    ? 'text-green-900' 
                    : 'text-purple-900'
                }`}>Diagnostic Assessment</CardTitle>
                <p className={`text-sm leading-tight ${
                  dashboardMetrics.diagnostic.sectionsCompleted === dashboardMetrics.diagnostic.totalSections && dashboardMetrics.diagnostic.totalSections > 0
                    ? 'text-green-700' 
                    : 'text-purple-700'
                }`}>Identify your strengths and weaknesses</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col flex-1 pb-6 px-4 sm:px-6">
            <div className="flex-1 flex items-center justify-center mb-6">
              <div className={`w-full max-w-[200px] p-4 rounded-xl text-center ${dashboardMetrics.diagnostic.sectionsCompleted === dashboardMetrics.diagnostic.totalSections && dashboardMetrics.diagnostic.totalSections > 0 ? 'bg-green-100 border border-green-200' : 'bg-white/60'}`}>
                <div className={`text-xs sm:text-sm mb-1 font-medium ${dashboardMetrics.diagnostic.sectionsCompleted === dashboardMetrics.diagnostic.totalSections && dashboardMetrics.diagnostic.totalSections > 0 ? 'text-green-600' : 'text-purple-600'}`}>Sections Completed</div>
                <div className={`text-2xl sm:text-3xl font-bold ${dashboardMetrics.diagnostic.sectionsCompleted === dashboardMetrics.diagnostic.totalSections && dashboardMetrics.diagnostic.totalSections > 0 ? 'text-green-700' : 'text-purple-900'}`}>
                  {dashboardMetrics.diagnostic.sectionsCompleted}/{dashboardMetrics.diagnostic.totalSections}
                </div>
              </div>
            </div>
            <Button 
              onClick={() => navigate('/dashboard/diagnostic')}
              className={`w-full h-12 sm:h-14 text-sm sm:text-base font-medium shadow-lg transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 ${
                dashboardMetrics.diagnostic.sectionsCompleted === dashboardMetrics.diagnostic.totalSections && dashboardMetrics.diagnostic.totalSections > 0
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-green-200'
                  : 'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 shadow-purple-200'
              }`}
            >
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>{dashboardMetrics.diagnostic.sectionsCompleted === dashboardMetrics.diagnostic.totalSections && dashboardMetrics.diagnostic.totalSections > 0
                ? 'View Results' 
                : dashboardMetrics.diagnostic.sectionsCompleted === 0 
                  ? 'Start Diagnostic' 
                  : 'Continue Diagnostic'}</span>
            </Button>
          </CardContent>
        </Card>

        {/* 2. Skill Drills Card */}
        <Card className={`relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 flex flex-col h-full ${dashboardMetrics.drill.subSkillsCompleted === dashboardMetrics.drill.totalSubSkills && dashboardMetrics.drill.totalSubSkills > 0
          ? 'bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-2 border-green-200/50 shadow-xl shadow-green-200/30'
          : 'bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 border-2 border-orange-200/50 shadow-xl shadow-orange-200/30'}`}>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-lg flex-shrink-0 transition-all duration-300 hover:scale-110 ${
                dashboardMetrics.drill.subSkillsCompleted === dashboardMetrics.drill.totalSubSkills && dashboardMetrics.drill.totalSubSkills > 0
                  ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/40'
                  : 'bg-gradient-to-br from-orange-500 to-orange-600 shadow-orange-500/40'
              }`}>
                <TargetIcon className="text-white w-6 h-6 sm:w-8 sm:h-8 transition-transform duration-300 hover:rotate-12" />
              </div>
              <div className="text-center sm:text-left flex-1">
                <CardTitle className={`text-xl sm:text-2xl font-bold mb-1 ${
                  dashboardMetrics.drill.subSkillsCompleted === dashboardMetrics.drill.totalSubSkills && dashboardMetrics.drill.totalSubSkills > 0
                    ? 'text-green-900' 
                    : 'text-orange-900'
                }`}>Skill Drills</CardTitle>
                <p className={`text-sm leading-tight ${
                  dashboardMetrics.drill.subSkillsCompleted === dashboardMetrics.drill.totalSubSkills && dashboardMetrics.drill.totalSubSkills > 0
                    ? 'text-green-700' 
                    : 'text-orange-700'
                }`}>Master specific skills through targeted practice</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col flex-1 pb-6 px-4 sm:px-6">
            <div className="flex-1 flex items-center justify-center mb-6">
              <div className={`w-full max-w-[200px] p-4 rounded-xl text-center ${dashboardMetrics.drill.subSkillsCompleted === dashboardMetrics.drill.totalSubSkills && dashboardMetrics.drill.totalSubSkills > 0 ? 'bg-green-100 border border-green-200' : 'bg-white/60'}`}>
                <div className={`text-xs sm:text-sm mb-1 font-medium ${dashboardMetrics.drill.subSkillsCompleted === dashboardMetrics.drill.totalSubSkills && dashboardMetrics.drill.totalSubSkills > 0 ? 'text-green-600' : 'text-orange-600'}`}>Sub-Skills Attempted</div>
                <div className={`text-2xl sm:text-3xl font-bold ${dashboardMetrics.drill.subSkillsCompleted === dashboardMetrics.drill.totalSubSkills && dashboardMetrics.drill.totalSubSkills > 0 ? 'text-green-700' : 'text-orange-900'}`}>
                  {dashboardMetrics.drill.subSkillsCompleted}/{dashboardMetrics.drill.totalSubSkills}
                </div>
              </div>
            </div>
            <Button 
              onClick={() => navigate('/dashboard/drill')}
              className={`w-full h-12 sm:h-14 text-sm sm:text-base font-medium shadow-lg transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 ${
                dashboardMetrics.drill.subSkillsCompleted === dashboardMetrics.drill.totalSubSkills && dashboardMetrics.drill.totalSubSkills > 0
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-green-200'
                  : 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-orange-200'
              }`}
            >
              <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>{dashboardMetrics.drill.subSkillsCompleted === dashboardMetrics.drill.totalSubSkills && dashboardMetrics.drill.totalSubSkills > 0
                ? 'View Results' 
                : dashboardMetrics.drill.subSkillsCompleted === 0 
                  ? 'Start Drilling' 
                  : 'Continue Drilling'}</span>
            </Button>
          </CardContent>
        </Card>

        {/* 3. Practice Tests Card - Spans columns appropriately */}
        <Card className={`lg:col-span-2 xl:col-span-1 relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 flex flex-col h-full ${dashboardMetrics.practice.testsCompleted === dashboardMetrics.practice.totalTests
          ? 'bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-2 border-green-200/50 shadow-xl shadow-green-200/30'
          : 'bg-gradient-to-br from-rose-50 via-pink-50 to-red-50 border-2 border-rose-200/50 shadow-xl shadow-rose-200/30'}`}>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-lg flex-shrink-0 transition-all duration-300 hover:scale-110 ${
                dashboardMetrics.practice.testsCompleted === dashboardMetrics.practice.totalTests
                  ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/40'
                  : 'bg-gradient-to-br from-rose-500 to-rose-600 shadow-rose-500/40'
              }`}>
                <FileText className="text-white w-6 h-6 sm:w-8 sm:h-8 transition-transform duration-300 hover:rotate-12" />
              </div>
              <div className="text-center sm:text-left flex-1">
                <CardTitle className={`text-xl sm:text-2xl font-bold mb-1 ${
                  dashboardMetrics.practice.testsCompleted === dashboardMetrics.practice.totalTests
                    ? 'text-green-900' 
                    : 'text-rose-900'
                }`}>Practice Tests</CardTitle>
                <p className={`text-sm leading-tight ${
                  dashboardMetrics.practice.testsCompleted === dashboardMetrics.practice.totalTests
                    ? 'text-green-700' 
                    : 'text-rose-700'
                }`}>Take full-length practice tests to track progress</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col flex-1 pb-6 px-4 sm:px-6">
            <div className="flex-1 flex items-center justify-center mb-6">
              <div className={`w-full max-w-[200px] p-4 rounded-xl text-center ${dashboardMetrics.practice.testsCompleted === dashboardMetrics.practice.totalTests ? 'bg-green-100 border border-green-200' : 'bg-white/60'}`}>
                <div className={`text-xs sm:text-sm mb-1 font-medium ${dashboardMetrics.practice.testsCompleted === dashboardMetrics.practice.totalTests ? 'text-green-600' : 'text-rose-600'}`}>Tests Completed</div>
                <div className={`text-2xl sm:text-3xl font-bold ${dashboardMetrics.practice.testsCompleted === dashboardMetrics.practice.totalTests ? 'text-green-700' : 'text-rose-900'}`}>
                  {dashboardMetrics.practice.testsCompleted}/{dashboardMetrics.practice.totalTests}
                </div>
              </div>
            </div>
            <Button 
              onClick={() => navigate('/dashboard/practice-tests')}
              className={`w-full h-12 sm:h-14 text-sm sm:text-base font-medium shadow-lg transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 ${
                dashboardMetrics.practice.testsCompleted === dashboardMetrics.practice.totalTests
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-green-200'
                  : 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 shadow-rose-200'
              }`}
            >
              <Play className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>{dashboardMetrics.practice.testsCompleted === dashboardMetrics.practice.totalTests
                ? 'View Results' 
                : dashboardMetrics.practice.testsCompleted === 0 
                  ? 'Start Practice Test' 
                  : 'Continue Practice Tests'}</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;