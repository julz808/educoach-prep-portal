import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Target, BookOpen, Activity, AlertCircle, TrendingUp, TrendingDown, Clock, Award, CheckCircle, XCircle, Flag, Star, Info, Zap, FileText, HelpCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useProduct } from '@/context/ProductContext';
import { PaywallComponent } from '@/components/PaywallComponent';
import { isPaywallUIEnabled } from '@/config/stripeConfig';
import { 
  AnalyticsService, 
  type OverallPerformance, 
  type DiagnosticResults, 
  type PracticeTestResults, 
  type DrillResults 
} from '@/services/analyticsService';
import { UNIFIED_SUB_SKILLS, SECTION_TO_SUB_SKILLS, TEST_STRUCTURES } from '@/data/curriculumData';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import Lenis from 'lenis';

// Map frontend product IDs to curriculum product types
const PRODUCT_ID_TO_TYPE: Record<string, string> = {
  'year-5-naplan': 'Year 5 NAPLAN',
  'year-7-naplan': 'Year 7 NAPLAN',
  'acer-year-7': 'ACER Scholarship (Year 7 Entry)',
  'edutest-year-7': 'EduTest Scholarship (Year 7 Entry)',
  'nsw-selective': 'NSW Selective Entry (Year 7 Entry)',
  'vic-selective': 'VIC Selective Entry (Year 9 Entry)',
};

// Helper function to get filter tabs based on product type
const getFilterTabsForProduct = (productId: string) => {
  // Map the product ID to the curriculum product type
  const productType = PRODUCT_ID_TO_TYPE[productId] || productId;
  const sections = Object.keys(TEST_STRUCTURES[productType as keyof typeof TEST_STRUCTURES] || {});
  
  // Create filter tabs from actual sections
  const filterTabs = [{ id: 'all', label: 'All Skills' }];
  
  // Add each section as a filter, using a simplified ID
  sections.forEach(section => {
    let id = 'other';
    const lowerSection = section.toLowerCase();
    
    if (lowerSection.includes('reading')) {
      id = 'reading';
    } else if (lowerSection.includes('verbal')) {
      id = 'verbal';
    } else if (lowerSection.includes('mathematics') || lowerSection.includes('mathematical') || lowerSection.includes('numeracy')) {
      id = 'mathematical';
    } else if (lowerSection.includes('numerical') || lowerSection.includes('quantitative')) {
      id = 'quantitative';
    } else if (lowerSection.includes('writing') || lowerSection.includes('written')) {
      id = 'writing';
    } else if (lowerSection.includes('language')) {
      id = 'language';
    } else if (lowerSection.includes('thinking')) {
      id = 'thinking';
    } else if (lowerSection.includes('humanities')) {
      id = 'humanities';
    }
    
    // Check if this filter ID already exists
    if (!filterTabs.find(tab => tab.id === id)) {
      filterTabs.push({ id, label: section });
    }
  });
  
  return filterTabs;
};

interface PerformanceData {
  overall: OverallPerformance | null;
  diagnostic: DiagnosticResults | null;
  practice: PracticeTestResults | null;
  drills: DrillResults | null;
}

// Spider Chart Component
const SpiderChart = ({ data, size = 320, animate = true }: { 
  data: { label: string; value: number; maxValue: number }[], 
  size?: number, 
  animate?: boolean 
}) => {
  const center = size / 2;
  const radius = size * 0.32; // Increased radius for larger chart
  const angles = data.map((_, i) => (i * 2 * Math.PI) / data.length - Math.PI / 2);
  
  // Calculate points for the data polygon
  const dataPoints = data.map((item, i) => {
    const value = Math.min(item.value / item.maxValue, 1);
    const x = center + Math.cos(angles[i]) * radius * value;
    const y = center + Math.sin(angles[i]) * radius * value;
    return { x, y, value: item.value, label: item.label };
  });
  
  // Grid circles (20%, 40%, 60%, 80%, 100%)
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];
  
  return (
    <div className="relative flex justify-center">
      <div 
        className="transform"
        style={{
          animation: animate ? 'growFromCenter 1.2s ease-out forwards' : 'none',
          transformOrigin: 'center center'
        }}
      >
        <svg width={size} height={size} className="overflow-visible">
          {/* Grid circles */}
          {gridLevels.map((level, i) => (
            <circle
              key={i}
              cx={center}
              cy={center}
              r={radius * level}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="1"
              opacity={0.5}
            />
          ))}
          
          {/* Grid lines from center to each vertex */}
          {angles.map((angle, i) => (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={center + Math.cos(angle) * radius}
              y2={center + Math.sin(angle) * radius}
              stroke="#e2e8f0"
              strokeWidth="1"
              opacity={0.5}
            />
          ))}
          
          {/* Data polygon */}
          <polygon
            points={dataPoints.map(p => `${p.x},${p.y}`).join(' ')}
            fill="rgba(20, 184, 166, 0.15)"
            stroke="rgb(20, 184, 166)"
            strokeWidth="2"
          />
          
          {/* Data points */}
          {dataPoints.map((point, i) => (
            <circle
              key={i}
              cx={point.x}
              cy={point.y}
              r="6"
              fill="rgb(20, 184, 166)"
              stroke="white"
              strokeWidth="2"
            />
          ))}
        </svg>
      </div>
      
      {/* Labels outside the chart */}
      {data.map((item, i) => {
        const angle = angles[i];
        const labelRadius = radius * 1.35; // Much closer to chart perimeter
        const x = center + Math.cos(angle) * labelRadius;
        const y = center + Math.sin(angle) * labelRadius;
        
        return (
          <div
            key={i}
            className="absolute text-center max-w-[70px]"
            style={{ 
              left: x,
              top: y,
              transform: 'translate(-50%, -50%)',
              animation: animate ? `fadeInSlideUp 1s ease-out ${i * 0.1 + 0.8}s both` : 'none'
            }}
          >
            <div className="text-base font-medium text-slate-700 leading-tight">
              {item.label.split('\n').map((line, idx) => (
                <div key={idx}>{line}</div>
              ))}
            </div>
            <div className={`text-base font-bold mt-1 ${
              item.value >= 80 ? 'text-green-600' : 
              item.value >= 60 ? 'text-orange-600' : 
              'text-red-600'
            }`}>
              {item.value}%
            </div>
          </div>
        );
      })}
    </div>
  );
};

const PerformanceDashboard = () => {
  const { user } = useAuth();
  const { selectedProduct, currentProduct, hasAccessToCurrentProduct } = useProduct();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('diagnostic');
  const [selectedPracticeTest, setSelectedPracticeTest] = useState<number | null>(null);
  const [practiceFilter, setPracticeFilter] = useState('all');
  const [drillFilter, setDrillFilter] = useState('all');
  const [sectionView, setSectionView] = useState<'score' | 'accuracy'>('score');
  const [subSkillView, setSubSkillView] = useState<'score' | 'accuracy'>('score');
  const [topBottomView, setTopBottomView] = useState<'score' | 'accuracy'>('score');
  const [drillView, setDrillView] = useState<'accuracy' | 'level'>('accuracy');
  const [isLoading, setIsLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    overall: null,
    diagnostic: null,
    practice: null,
    drills: null,
  });
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set());
  const [tabLoadingStates, setTabLoadingStates] = useState<Record<string, boolean>>({});
  
  // Animation states
  const [animatedOverallScore, setAnimatedOverallScore] = useState(0);
  const [animatedOverallAccuracy, setAnimatedOverallAccuracy] = useState(0);
  const [animateSpiderChart, setAnimateSpiderChart] = useState(true);
  const [animatedSectionScores, setAnimatedSectionScores] = useState<Record<string, number>>({});
  const [animatedSubSkillScores, setAnimatedSubSkillScores] = useState<Record<string, number>>({});
  const [animatedPracticeScore, setAnimatedPracticeScore] = useState(0);
  const [animatedPracticeAccuracy, setAnimatedPracticeAccuracy] = useState(0);
  const [animatedTopSkillScores, setAnimatedTopSkillScores] = useState<Record<string, number>>({});
  const [animatedBottomSkillScores, setAnimatedBottomSkillScores] = useState<Record<string, number>>({});
  
  // User profile state
  const [userProfile, setUserProfile] = useState<any>(null);

  // Intersection observer hooks for viewport-triggered animations (only for progress bars)
  const sectionScoresObserver = useIntersectionObserver({ threshold: 0.1, rootMargin: '50px' });
  const spiderChartObserver = useIntersectionObserver({ threshold: 0.1, rootMargin: '50px' });
  const topBottomSkillsObserver = useIntersectionObserver({ threshold: 0.1, rootMargin: '50px' });

  // Initialize Lenis smooth scrolling
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.1,
      wheelMultiplier: 0.8,
      gestureOrientation: 'vertical',
      normalizeWheel: false,
      smoothTouch: false
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  // Load essential data first (user profile and overall performance)
  useEffect(() => {
    const loadEssentialData = async () => {
      if (!user || !selectedProduct) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setDataError(null);
      
      try {
        // Load user profile and overall performance in parallel (fastest queries)
        const [profileResult, overallResult] = await Promise.allSettled([
          supabase.from('user_profiles').select('*').eq('user_id', user.id).single(),
          AnalyticsService.getOverallPerformance(user.id, selectedProduct)
        ]);
        
        // Set user profile
        if (profileResult.status === 'fulfilled' && profileResult.value.data) {
          setUserProfile(profileResult.value.data);
        }
        
        // Set overall performance
        const overall = overallResult.status === 'fulfilled' ? overallResult.value : null;
        setPerformanceData(prev => ({
          ...prev,
          overall
        }));
        
        // Load default tab data (diagnostic)
        await loadTabData('diagnostic');
        
      } catch (error) {
        console.error('❌ Error loading essential data:', error);
        setDataError('Failed to load performance data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadEssentialData();
  }, [user, selectedProduct]);

  // Function to load data for a specific tab
  const loadTabData = async (tabName: string) => {
    if (!user || !selectedProduct || loadedTabs.has(tabName)) {
      return; // Already loaded or no user/product
    }

    // Set loading state for this tab
    setTabLoadingStates(prev => ({ ...prev, [tabName]: true }));

    try {
      let data = null;
      switch (tabName) {
        case 'diagnostic':
          data = await AnalyticsService.getDiagnosticResults(user.id, selectedProduct);
          setPerformanceData(prev => ({ ...prev, diagnostic: data }));
          break;
        case 'practice':
          data = await AnalyticsService.getPracticeTestResults(user.id, selectedProduct);
          setPerformanceData(prev => ({ ...prev, practice: data }));
          
          // Auto-select the latest completed practice test
          if (data?.tests && data.tests.length > 0) {
            const completedTests = data.tests.filter(test => test.status === 'completed');
            if (completedTests.length > 0) {
              const latestCompleted = completedTests.reduce((latest, current) => 
                current.testNumber > latest.testNumber ? current : latest
              );
              setSelectedPracticeTest(latestCompleted.testNumber);
              } else {
              setSelectedPracticeTest(1);
              }
          }
          break;
        case 'drills':
          data = await AnalyticsService.getDrillResults(user.id, selectedProduct);
          setPerformanceData(prev => ({ ...prev, drills: data }));
          break;
      }
      
      // Mark tab as loaded
      setLoadedTabs(prev => new Set([...prev, tabName]));
      } catch (error) {
      console.error(`❌ Error loading ${tabName} data:`, error);
      // Don't show error for individual tab failures
    } finally {
      // Clear loading state for this tab
      setTabLoadingStates(prev => ({ ...prev, [tabName]: false }));
    }
  };

  // Load tab data when switching tabs
  useEffect(() => {
    loadTabData(activeTab);
  }, [activeTab, user, selectedProduct]);
  
  // Set static values for overall score and accuracy (no animation for headline cards)
  useEffect(() => {
    if (!performanceData.diagnostic) return;
    
    const targetScore = performanceData.diagnostic?.overallScore || 0;
    const targetAccuracy = performanceData.diagnostic?.overallAccuracy || 0;
    
    // Set values directly without animation for headline cards
    setAnimatedOverallScore(targetScore);
    setAnimatedOverallAccuracy(targetAccuracy);
  }, [performanceData.diagnostic]);
  
  // Trigger spider chart animation on viewport entry and view toggle
  useEffect(() => {
    if (!spiderChartObserver.isIntersecting) return;
    
    setAnimateSpiderChart(false);
    const timer = setTimeout(() => setAnimateSpiderChart(true), 50);
    return () => clearTimeout(timer);
  }, [sectionView, spiderChartObserver.isIntersecting]);
  
  // Set static values for section scores (no percentage animation, only progress bars animate)
  useEffect(() => {
    if (!performanceData.diagnostic?.sectionBreakdown) return;
    
    const newScores: Record<string, number> = {};
    performanceData.diagnostic.sectionBreakdown.forEach((section) => {
      const targetValue = sectionView === 'score' ? section.score : section.accuracy;
      newScores[section.sectionName] = targetValue;
    });
    
    setAnimatedSectionScores(newScores);
  }, [performanceData.diagnostic, sectionView]);
  
  // Set static values for sub-skill scores (no percentage animation, only progress bars animate)
  useEffect(() => {
    if (!performanceData.diagnostic?.allSubSkills) return;
    
    const newScores: Record<string, number> = {};
    performanceData.diagnostic.allSubSkills.forEach((skill) => {
      const targetValue = subSkillView === 'score' 
        ? (skill.questionsTotal > 0 ? Math.round((skill.questionsCorrect / skill.questionsTotal) * 100) : 0)
        : (skill.questionsAttempted > 0 ? Math.round((skill.questionsCorrect / skill.questionsAttempted) * 100) : 0);
      newScores[skill.subSkill] = targetValue;
    });
    
    setAnimatedSubSkillScores(newScores);
  }, [performanceData.diagnostic, subSkillView]);
  
  // Set static values for practice test scores (no animation for headline cards)
  useEffect(() => {
    if (!performanceData.practice?.tests) return;
    
    const selectedTest = performanceData.practice.tests.find(t => t.testNumber === selectedPracticeTest);
    if (!selectedTest || selectedTest.status !== 'completed') return;
    
    const targetScore = selectedTest.score || 0;
    const targetAccuracy = selectedTest.overallAccuracy || 0;
    
    // Set values directly without animation for headline cards
    setAnimatedPracticeScore(targetScore);
    setAnimatedPracticeAccuracy(targetAccuracy);
  }, [performanceData.practice, selectedPracticeTest]);

  // Set static values for top and bottom skills (no percentage animation, only progress bars animate)
  useEffect(() => {
    if (!performanceData.diagnostic?.allSubSkills) return;
    
    const allSubSkills = performanceData.diagnostic.allSubSkills;
    const topSkills = topBottomView === 'score' 
      ? [...allSubSkills].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 5)
      : [...allSubSkills].sort((a, b) => (b.accuracy || 0) - (a.accuracy || 0)).slice(0, 5);
    
    const bottomSkills = topBottomView === 'score' 
      ? [...allSubSkills].sort((a, b) => (a.score || 0) - (b.score || 0)).slice(0, 5)
      : [...allSubSkills].sort((a, b) => (a.accuracy || 0) - (b.accuracy || 0)).slice(0, 5);

    const newTopScores: Record<string, number> = {};
    const newBottomScores: Record<string, number> = {};
    
    // Set static values for top skills
    topSkills.forEach((skill) => {
      const targetValue = topBottomView === 'score' ? (skill.score || 0) : (skill.accuracy || 0);
      newTopScores[skill.subSkill] = targetValue;
    });

    // Set static values for bottom skills
    bottomSkills.forEach((skill) => {
      const targetValue = topBottomView === 'score' ? (skill.score || 0) : (skill.accuracy || 0);
      newBottomScores[skill.subSkill] = targetValue;
    });
    
    setAnimatedTopSkillScores(newTopScores);
    setAnimatedBottomSkillScores(newBottomScores);
  }, [performanceData.diagnostic, topBottomView]);

  // Helper function to format time
  const formatStudyTime = (hours: number): string => {
    if (hours === 0) return '0h';
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    return `${hours}h`;
  };

  // Helper function to get status badge
  const getStatusBadge = (status: string) => {
    const badges = {
      'completed': <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle size={12} className="mr-1" />Completed</span>,
      'in-progress': <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Clock size={12} className="mr-1" />In Progress</span>,
      'not-started': <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Not Started</span>,
    };
    return badges[status as keyof typeof badges] || badges['not-started'];
  };

  // Helper function to get trend icon
  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp size={16} className="text-green-500" />;
    if (trend < 0) return <TrendingDown size={16} className="text-red-500" />;
    return null;
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading Performance Insights...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (dataError) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-red-900 mb-2">Error Loading Data</h3>
          <p className="text-red-700 mb-4">{dataError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show no user state
  if (!user || !selectedProduct) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900 mb-2">Authentication Required</h3>
          <p className="text-slate-600 mb-4">Please sign in to view your performance insights.</p>
          <button 
            onClick={() => window.location.href = '/auth'} 
            className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  // Access control - show paywall if user doesn't have access to current product
  if (isPaywallUIEnabled() && !hasAccessToCurrentProduct && currentProduct) {
    return (
      <div className="min-h-screen bg-white">
        <PaywallComponent 
          product={currentProduct} 
          className="min-h-screen"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-black text-slate-900 mb-3 bg-gradient-to-r from-teal-600 to-teal-500 bg-clip-text text-transparent">
            Performance Insights
          </h1>
          <p className="text-slate-600 text-lg font-medium">
            {userProfile ? `${userProfile.student_first_name} ${userProfile.student_last_name}` : 'Loading...'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-6 sm:mb-8 px-2 sm:px-0">
          <div className="flex flex-col xs:flex-row gap-2 xs:gap-0 xs:space-x-2 bg-white p-2 rounded-xl sm:rounded-2xl shadow-lg border border-slate-200 w-full xs:w-auto max-w-sm xs:max-w-none">
            {[
              { id: 'diagnostic', label: 'Diagnostic', icon: <Activity size={16} className="xs:w-4 xs:h-4 sm:w-5 sm:h-5" /> },
              { id: 'practice', label: 'Practice Tests', icon: <FileText size={16} className="xs:w-4 xs:h-4 sm:w-5 sm:h-5" /> },
              { id: 'drills', label: 'Drills', icon: <Target size={16} className="xs:w-4 xs:h-4 sm:w-5 sm:h-5" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 xs:flex-none px-3 xs:px-4 sm:px-6 md:px-8 py-2.5 xs:py-3 sm:py-4 rounded-lg xs:rounded-xl font-semibold xs:font-bold transition-all duration-200 ease-out text-sm xs:text-base sm:hover:scale-105",
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                )}
              >
                <div className="flex items-center justify-center xs:justify-start gap-1.5 xs:gap-2">
                  {tab.icon}
                  <span className="truncate">{tab.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-lg p-3 sm:p-6 md:p-8 mx-2 sm:mx-0">

          {/* Diagnostic Tab */}
          {activeTab === 'diagnostic' && (
            <div className="space-y-8">
              {!loadedTabs.has('diagnostic') ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-edu-teal"></div>
                  <span className="ml-3 text-edu-navy/70">Loading diagnostic insights...</span>
                </div>
              ) : !performanceData.diagnostic ? (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-24 h-24 bg-teal-50 rounded-full mb-6">
                    <Target className="h-12 w-12 text-teal-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">Complete Your Diagnostic First</h3>
                  <p className="text-slate-600 mb-8 max-w-md mx-auto">You need to complete <strong>all sections</strong> of the diagnostic test to see your detailed performance insights, strengths, and areas for improvement.</p>
                  <button 
                    onClick={() => navigate('/diagnostic')}
                    className="px-8 py-4 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                  >
                    Start Diagnostic Test
                  </button>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Summary Cards - Mobile-optimized responsive grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                    {/* Overall Score */}
                    <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 md:p-6 shadow-sm relative group">
                      <div className="text-center">
                        <div className="text-sm sm:text-base font-medium text-slate-600 mb-2 flex items-center justify-center gap-1">
                          <span className="truncate">Overall Score</span>
                          <div className="relative inline-block flex-shrink-0">
                            <Info size={12} className="sm:w-3.5 sm:h-3.5 text-slate-400 cursor-help" />
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 sm:w-64 p-2 sm:p-3 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                              <div className="font-semibold mb-1">Score</div>
                              <div>Measures your performance against the total number of questions in the test, including unanswered questions.</div>
                              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-slate-900"></div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
                          <div className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900">
                            {performanceData.diagnostic.totalQuestionsCorrect}
                            <span className="text-slate-600">/{performanceData.diagnostic.totalQuestions}</span>
                          </div>
                          <div className="hidden sm:block h-6 md:h-10 w-px bg-slate-200"></div>
                          <div className={`text-xl sm:text-2xl md:text-3xl font-bold ${
                            performanceData.diagnostic.overallScore >= 80 ? 'text-green-600' : 
                            performanceData.diagnostic.overallScore >= 60 ? 'text-orange-600' : 
                            'text-red-600'
                          }`}>{animatedOverallScore}%</div>
                        </div>
                      </div>
                    </div>

                    {/* Simple Average Score */}
                    <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 md:p-6 shadow-sm relative group">
                      <div className="text-center">
                        <div className="text-sm sm:text-base font-medium text-slate-600 mb-2 flex items-center justify-center gap-1">
                          <span className="truncate">Average Score</span>
                          <div className="relative inline-block flex-shrink-0">
                            <Info size={12} className="sm:w-3.5 sm:h-3.5 text-slate-400 cursor-help" />
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 sm:w-64 p-2 sm:p-3 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                              <div className="font-semibold mb-1">Average Score</div>
                              <div>Simple average percentage across all test sections.</div>
                              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-slate-900"></div>
                            </div>
                          </div>
                        </div>
                        <div className={`text-xl sm:text-2xl md:text-3xl font-bold ${
                          (() => {
                            // Calculate simple average across all sections
                            const sectionScores = performanceData.diagnostic.sectionBreakdown.map(s => s.score);
                            const averageScore = sectionScores.length > 0 
                              ? Math.round(sectionScores.reduce((sum, score) => sum + score, 0) / sectionScores.length)
                              : 0;
                            return averageScore >= 80 ? 'text-green-600' : 
                                   averageScore >= 60 ? 'text-orange-600' : 
                                   'text-red-600';
                          })()
                        }`}>
                          {(() => {
                            const sectionScores = performanceData.diagnostic.sectionBreakdown.map(s => s.score);
                            return sectionScores.length > 0 
                              ? Math.round(sectionScores.reduce((sum, score) => sum + score, 0) / sectionScores.length)
                              : 0;
                          })()}%
                        </div>
                      </div>
                    </div>

                    {/* Overall Accuracy */}
                    <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 md:p-6 shadow-sm relative group">
                      <div className="text-center">
                        <div className="text-sm sm:text-base font-medium text-slate-600 mb-2 flex items-center justify-center gap-1">
                          <span className="truncate">Overall Accuracy</span>
                          <div className="relative inline-block flex-shrink-0">
                            <Info size={12} className="sm:w-3.5 sm:h-3.5 text-slate-400 cursor-help" />
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 sm:w-64 p-2 sm:p-3 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                              <div className="font-semibold mb-1">Accuracy</div>
                              <div>Shows how well you performed on questions you actually attempted, excluding skipped or timed-out questions.</div>
                              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-slate-900"></div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
                          <div className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900">
                            {performanceData.diagnostic.totalQuestionsCorrect}
                            <span className="text-slate-600">/{performanceData.diagnostic.totalQuestionsAttempted}</span>
                          </div>
                          <div className="hidden sm:block h-6 md:h-10 w-px bg-slate-200"></div>
                          <div className={`text-xl sm:text-2xl md:text-3xl font-bold ${
                            performanceData.diagnostic.overallAccuracy >= 80 ? 'text-green-600' : 
                            performanceData.diagnostic.overallAccuracy >= 60 ? 'text-orange-600' : 
                            'text-red-600'
                          }`}>{animatedOverallAccuracy}%</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section Results */}
                  <div ref={sectionScoresObserver.ref} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-slate-900">Section Results</h3>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                          <button
                            onClick={() => setSectionView('score')}
                            className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                              sectionView === 'score' 
                                ? 'bg-white text-slate-900 shadow-sm' 
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Total
                          </button>
                          <button
                            onClick={() => setSectionView('accuracy')}
                            className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                              sectionView === 'accuracy' 
                                ? 'bg-white text-slate-900 shadow-sm' 
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Attempted
                          </button>
                        </div>
                        <div className="relative group">
                          <Info size={16} className="text-slate-400 cursor-help" />
                          <div className="absolute top-full right-0 mt-2 w-72 p-4 bg-slate-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                            <div className="space-y-3">
                              <div>
                                <div className="font-semibold text-teal-400 mb-1">Total View</div>
                                <div className="text-xs">Shows correct answers out of total questions (e.g., 16/20 = 80%)</div>
                              </div>
                              <div>
                                <div className="font-semibold text-orange-400 mb-1">Attempted View</div>
                                <div className="text-xs">Shows correct answers out of questions attempted (e.g., 16/18 = 89%)</div>
                              </div>
                            </div>
                            <div className="absolute top-0 right-4 transform -translate-y-1/2 rotate-45 w-2 h-2 bg-slate-900"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col lg:flex-row">
                      {/* Spider Chart - Top on mobile, Left on desktop */}
                      <div ref={spiderChartObserver.ref} className="w-full lg:w-1/2 p-3 sm:p-6 flex items-center justify-center border-b lg:border-b-0 lg:border-r border-slate-200">
                        <SpiderChart 
                          data={performanceData.diagnostic.sectionBreakdown.map(section => ({
                            label: section.sectionName.replace('General Ability - ', 'GA - ').replace(' Reasoning', '\nReasoning'),
                            value: sectionView === 'score' ? section.score : section.accuracy,
                            maxValue: 100
                          }))}
                          size={280}
                          animate={animateSpiderChart}
                        />
                      </div>
                      
                      {/* Section List - Bottom on mobile, Right on desktop */}
                      <div className="w-full lg:w-1/2 divide-y divide-slate-100">
                        {performanceData.diagnostic.sectionBreakdown
                          .sort((a, b) => {
                            const aValue = sectionView === 'score' ? a.score : a.accuracy;
                            const bValue = sectionView === 'score' ? b.score : b.accuracy;
                            return bValue - aValue;
                          })
                          .map((section, index) => {
                          // Use actual scores for all sections including writing
                          const displayScore = section.score;
                          const displayAccuracy = section.accuracy;
                          
                          return (
                            <div key={index} className="px-4 py-3 hover:bg-slate-50 transition-colors">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <h4 className="font-medium text-slate-900 text-base">{section.sectionName}</h4>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <div className={`text-base font-semibold ${
                                    sectionView === 'score'
                                      ? (displayScore >= 80 ? 'text-green-600' : displayScore >= 60 ? 'text-orange-600' : 'text-red-600')
                                      : (displayAccuracy >= 80 ? 'text-green-600' : displayAccuracy >= 60 ? 'text-orange-600' : 'text-red-600')
                                  }`}>
                                    {animatedSectionScores[section.sectionName] !== undefined ? animatedSectionScores[section.sectionName] : (sectionView === 'score' ? displayScore : displayAccuracy)}%
                                  </div>
                                  <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                    <div 
                                      key={`${section.sectionName}-${sectionView}`} // Force re-render on toggle
                                      className={`h-full rounded-full growToRight ${
                                        sectionView === 'score'
                                          ? (displayScore >= 80 ? 'bg-green-500' : displayScore >= 60 ? 'bg-orange-500' : 'bg-red-500')
                                          : (displayAccuracy >= 80 ? 'bg-green-500' : displayAccuracy >= 60 ? 'bg-orange-500' : 'bg-red-500')
                                      }`}
                                      style={{ 
                                        width: `${sectionView === 'score' ? displayScore : displayAccuracy}%`,
                                        animationDelay: `${index * 150}ms`
                                      }}
                                    />
                                  </div>
                                  <div 
                                    key={`${section.sectionName}-fraction-${sectionView}`}
                                    className="text-sm text-slate-600 fadeIn"
                                    style={{ animationDelay: `${index * 150 + 600}ms` }}
                                  >
                                    {sectionView === 'score' 
                                      ? <span>{section.questionsCorrect}/{section.questionsTotal}</span>
                                      : (section.sectionName.toLowerCase().includes('written expression') || section.sectionName.toLowerCase().includes('writing'))
                                        ? <span>{section.questionsCorrect}/{section.questionsTotal}</span>
                                        : <span>{section.questionsCorrect}/{section.questionsAttempted}</span>
                                    }
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Sub-Skill Overview */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {/* Top 5 Strengths */}
                    <div ref={topBottomSkillsObserver.ref} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                      <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-slate-200">
                        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 xs:gap-0">
                          <h3 className="text-base sm:text-lg font-semibold text-slate-900 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                            Top 5 Sub-Skills
                          </h3>
                          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 text-xs sm:text-sm">
                            <button
                              onClick={() => setTopBottomView('score')}
                              className={`px-2 xs:px-3 py-1 text-xs xs:text-sm font-medium rounded transition-colors ${
                                topBottomView === 'score' 
                                  ? 'bg-white text-slate-900 shadow-sm' 
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Total
                            </button>
                            <button
                              onClick={() => setTopBottomView('accuracy')}
                              className={`px-2 xs:px-3 py-1 text-xs xs:text-sm font-medium rounded transition-colors ${
                                topBottomView === 'accuracy' 
                                  ? 'bg-white text-slate-900 shadow-sm' 
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Attempted
                            </button>
                            <div className="relative group">
                              <HelpCircle className="w-4 h-4 text-slate-400 cursor-help" />
                              <div className="absolute top-full right-0 mt-2 w-72 p-4 bg-slate-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                                <div className="space-y-3">
                                  <div>
                                    <div className="font-semibold text-teal-400 mb-1">Total View</div>
                                    <div className="text-xs">Shows correct answers out of total questions (e.g., 16/20 = 80%)</div>
                                  </div>
                                  <div>
                                    <div className="font-semibold text-orange-400 mb-1">Attempted View</div>
                                    <div className="text-xs">Shows correct answers out of questions attempted (e.g., 16/18 = 89%)</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="space-y-4">
                          {(() => {
                            const allSubSkills = performanceData.diagnostic?.allSubSkills || [];
                            const sortedSkills = topBottomView === 'score' 
                              ? [...allSubSkills].sort((a, b) => (b.score || 0) - (a.score || 0))
                              : [...allSubSkills].sort((a, b) => (b.accuracy || 0) - (a.accuracy || 0));
                            return sortedSkills.slice(0, 5).map((item, index) => (
                            <div key={index} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-b-0">
                              <div className="flex-1">
                                <h5 className="text-base font-medium text-slate-900 mb-1">{item.subSkill}</h5>
                                <p className="text-sm text-slate-600">{item.sectionName}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-lg font-semibold text-green-600">
                                  {animatedTopSkillScores[item.subSkill] !== undefined ? animatedTopSkillScores[item.subSkill] : (topBottomView === 'score' ? (item.score || 0) : (item.accuracy || 0))}%
                                </div>
                                <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                                  <div 
                                    key={`${item.subSkill}-${topBottomView}`}
                                    className="h-full rounded-full bg-green-500 growToRight"
                                    style={{ 
                                      width: `${topBottomView === 'score' ? (item.score || 0) : (item.accuracy || 0)}%`,
                                      animationDelay: `${index * 150}ms`
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                            ));
                          })()}
                          {(!performanceData.diagnostic?.allSubSkills || performanceData.diagnostic.allSubSkills.length === 0) && (
                            <div className="text-center py-8 text-slate-500">
                              <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              Complete more questions to see your top sub-skills
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Top 5 Areas for Improvement */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                      <div className="px-6 py-4 border-b border-slate-200">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                            <XCircle className="w-5 h-5 text-red-600" />
                            Bottom 5 Sub-Skills
                          </h3>
                          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                            <button
                              onClick={() => setTopBottomView('score')}
                              className={`px-2 xs:px-3 py-1 text-xs xs:text-sm font-medium rounded transition-colors ${
                                topBottomView === 'score' 
                                  ? 'bg-white text-slate-900 shadow-sm' 
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Total
                            </button>
                            <button
                              onClick={() => setTopBottomView('accuracy')}
                              className={`px-2 xs:px-3 py-1 text-xs xs:text-sm font-medium rounded transition-colors ${
                                topBottomView === 'accuracy' 
                                  ? 'bg-white text-slate-900 shadow-sm' 
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Attempted
                            </button>
                            <div className="relative group">
                              <HelpCircle className="w-4 h-4 text-slate-400 cursor-help" />
                              <div className="absolute top-full right-0 mt-2 w-72 p-4 bg-slate-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                                <div className="space-y-3">
                                  <div>
                                    <div className="font-semibold text-teal-400 mb-1">Total View</div>
                                    <div className="text-xs">Shows correct answers out of total questions (e.g., 16/20 = 80%)</div>
                                  </div>
                                  <div>
                                    <div className="font-semibold text-orange-400 mb-1">Attempted View</div>
                                    <div className="text-xs">Shows correct answers out of questions attempted (e.g., 16/18 = 89%)</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="space-y-4">
                          {(() => {
                            const allSubSkills = performanceData.diagnostic?.allSubSkills || [];
                            const sortedSkills = topBottomView === 'score' 
                              ? [...allSubSkills].sort((a, b) => (a.score || 0) - (b.score || 0))
                              : [...allSubSkills].sort((a, b) => (a.accuracy || 0) - (b.accuracy || 0));
                            return sortedSkills.slice(0, 5).map((item, index) => (
                            <div key={index} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-b-0">
                              <div className="flex-1">
                                <h5 className="text-base font-medium text-slate-900 mb-1">{item.subSkill}</h5>
                                <p className="text-sm text-slate-600">{item.sectionName}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className={`text-lg font-semibold ${
                                  (topBottomView === 'score' ? (item.score || 0) : (item.accuracy || 0)) >= 60 ? 'text-orange-600' : 'text-red-600'
                                }`}>{animatedBottomSkillScores[item.subSkill] !== undefined ? animatedBottomSkillScores[item.subSkill] : (topBottomView === 'score' ? (item.score || 0) : (item.accuracy || 0))}%</div>
                                <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                                  <div 
                                    key={`${item.subSkill}-${topBottomView}`}
                                    className={`h-full rounded-full growToRight ${
                                      (topBottomView === 'score' ? (item.score || 0) : (item.accuracy || 0)) >= 60 ? 'bg-orange-500' : 'bg-red-500'
                                    }`}
                                    style={{ 
                                      width: `${topBottomView === 'score' ? (item.score || 0) : (item.accuracy || 0)}%`,
                                      animationDelay: `${index * 150}ms`
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                            ));
                          })()}
                          {(!performanceData.diagnostic?.allSubSkills || performanceData.diagnostic.allSubSkills.length === 0) && (
                            <div className="text-center py-8 text-slate-500">
                              <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              Complete more questions to see your bottom sub-skills
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Sub-Skills Performance */}
                  <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-slate-900">Detailed Sub-Skills Performance</h3>
                        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                          <button
                            onClick={() => setSubSkillView('score')}
                            className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                              subSkillView === 'score' 
                                ? 'bg-white text-slate-900 shadow-sm' 
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Total
                          </button>
                          <button
                            onClick={() => setSubSkillView('accuracy')}
                            className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                              subSkillView === 'accuracy' 
                                ? 'bg-white text-slate-900 shadow-sm' 
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Attempted
                          </button>
                          <div className="relative group">
                            <HelpCircle className="w-4 h-4 text-slate-400 cursor-help" />
                            <div className="absolute top-full right-0 mt-2 w-72 p-4 bg-slate-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                              <div className="space-y-3">
                                <div>
                                  <div className="font-semibold text-teal-400 mb-1">Total View</div>
                                  <div className="text-xs">Shows correct answers out of total questions (e.g., 16/20 = 80%)</div>
                                </div>
                                <div>
                                  <div className="font-semibold text-orange-400 mb-1">Attempted View</div>
                                  <div className="text-xs">Shows correct answers out of questions attempted (e.g., 16/18 = 89%)</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Filter Tabs - Better responsive wrapping */}
                      <div className="flex flex-wrap gap-2 mb-2">
                        {getFilterTabsForProduct(selectedProduct).map((filter) => (
                          <button
                            key={filter.id}
                            onClick={() => setPracticeFilter(filter.id)}
                            className={`px-3 py-1.5 text-xs md:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                              practiceFilter === filter.id
                                ? 'bg-slate-900 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {filter.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="divide-y divide-slate-100">
                      {/* Use all sub-skills from analytics service */}
                      {(function() {
                        const allSkills = performanceData.diagnostic?.allSubSkills || [];
                        
                        // Map to consistent format using actual section names
                        const mappedSkills = allSkills.map(skill => {
                          const sectionName = skill.sectionName || 'Unknown Section';
                          
                          // Map section names to filter categories (all test types)
                          let category = 'all';
                          const lowerSectionName = sectionName.toLowerCase();
                          
                          // Reading categories
                          if (lowerSectionName.includes('reading')) {
                            category = 'reading';
                          }
                          // Mathematics categories  
                          else if (lowerSectionName.includes('mathematics') || lowerSectionName.includes('mathematical') || lowerSectionName.includes('numeracy')) {
                            category = 'mathematical';
                          }
                          // Verbal/Language categories
                          else if (lowerSectionName.includes('verbal') || lowerSectionName.includes('language') || lowerSectionName.includes('thinking skills')) {
                            category = 'verbal';
                          }
                          // Quantitative/Numerical categories
                          else if (lowerSectionName.includes('quantitative') || lowerSectionName.includes('numerical')) {
                            category = 'quantitative';
                          }
                          // Writing categories
                          else if (lowerSectionName.includes('writing') || lowerSectionName.includes('written expression')) {
                            category = 'writing';
                          }
                          // Language categories
                          else if (lowerSectionName.includes('language')) {
                            category = 'language';
                          }
                          // Thinking categories
                          else if (lowerSectionName.includes('thinking')) {
                            category = 'thinking';
                          }
                          // Humanities categories
                          else if (lowerSectionName.includes('humanities')) {
                            category = 'humanities';
                          }
                          
                          return {
                            skill: skill.subSkill,
                            section: sectionName,
                            score: skill.questionsCorrect,
                            total: skill.questionsTotal,
                            answered: skill.questionsAttempted,
                            performancePercent: skill.questionsTotal > 0 ? Math.round((skill.questionsCorrect / skill.questionsTotal) * 100) : 0,
                            accuracyPercent: skill.questionsAttempted > 0 ? Math.round((skill.questionsCorrect / skill.questionsAttempted) * 100) : 0,
                            category
                          };
                        });
                        
                        return mappedSkills
                          .filter(item => {
                            // Filter by score/accuracy tab: 
                            // Score tab: show ALL sub-skills (including unattempted)
                            // Accuracy tab: show ONLY attempted sub-skills
                            if (subSkillView === 'accuracy' && item.answered === 0) {
                              return false;
                            }
                            
                            return practiceFilter === 'all' || item.category === practiceFilter;
                          })
                          .sort((a, b) => {
                            const aValue = subSkillView === 'score' ? a.performancePercent : a.accuracyPercent;
                            const bValue = subSkillView === 'score' ? b.performancePercent : b.accuracyPercent;
                            return bValue - aValue;
                          })
                          .map((skill, index) => (
                            <div key={index} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="relative group">
                                    <h5 className="font-medium text-slate-900 cursor-help flex items-center gap-1">
                                      {skill.skill}
                                      <Info size={14} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </h5>
                                    {UNIFIED_SUB_SKILLS[skill.skill] && (
                                      <div className="absolute left-0 top-full mt-2 w-80 p-4 bg-slate-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20 shadow-lg">
                                        <div className="font-semibold text-teal-400 mb-2">{skill.skill}</div>
                                        <div className="text-xs leading-relaxed">{UNIFIED_SUB_SKILLS[skill.skill]?.description || 'No description available'}</div>
                                        <div className="absolute top-0 left-4 transform -translate-y-1/2 rotate-45 w-2 h-2 bg-slate-900"></div>
                                      </div>
                                    )}
                                  </div>
                                  <p className="text-sm text-slate-500">{skill.section}</p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <div className={`text-lg font-semibold ${
                                    subSkillView === 'score'
                                      ? (skill.performancePercent >= 80 ? 'text-green-600' : skill.performancePercent >= 60 ? 'text-orange-600' : 'text-red-600')
                                      : (skill.accuracyPercent >= 80 ? 'text-green-600' : skill.accuracyPercent >= 60 ? 'text-orange-600' : 'text-red-600')
                                  }`}>
                                    {animatedSubSkillScores[skill.skill] || 0}%
                                  </div>
                                  <div className="w-32 bg-slate-100 rounded-full h-2 overflow-hidden">
                                    <div 
                                      key={`${skill.skill}-${subSkillView}`} // Force re-render on toggle
                                      className={`h-full rounded-full growToRight ${
                                        subSkillView === 'score'
                                          ? (skill.performancePercent >= 80 ? 'bg-green-500' : skill.performancePercent >= 60 ? 'bg-orange-500' : 'bg-red-500')
                                          : (skill.accuracyPercent >= 80 ? 'bg-green-500' : skill.accuracyPercent >= 60 ? 'bg-orange-500' : 'bg-red-500')
                                      }`}
                                      style={{ 
                                        width: `${subSkillView === 'score' ? skill.performancePercent : skill.accuracyPercent}%`,
                                        animationDelay: `${index * 120}ms`
                                      }}
                                    />
                                  </div>
                                  <div 
                                    key={`${skill.skill}-fraction-${subSkillView}`}
                                    className="text-sm text-slate-600 fadeIn"
                                    style={{ animationDelay: `${index * 120 + 600}ms` }}
                                  >
                                    {subSkillView === 'score' 
                                      ? <span>{skill.score}/{skill.total}</span>
                                      : (skill.section.toLowerCase().includes('written expression') || skill.section.toLowerCase().includes('writing'))
                                        ? <span>{skill.score}/{skill.total}</span>
                                        : <span>{skill.score}/{skill.answered}</span>
                                    }
                                  </div>
                                </div>
                              </div>
                            </div>
                          ));
                      })()}
                      {(() => {
                        if (!performanceData.diagnostic?.allSubSkills?.length) {
                          return (
                            <div className="text-center py-8 text-slate-500">
                              <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              Complete the diagnostic test to see detailed sub-skill performance
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Practice Tests Tab */}
          {activeTab === 'practice' && (
            <div className="space-y-8">
              {!loadedTabs.has('practice') ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-edu-teal"></div>
                  <span className="ml-3 text-edu-navy/70">Loading practice test insights...</span>
                </div>
              ) : !performanceData.practice?.tests?.some(test => test.status === 'completed') ? (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-24 h-24 bg-teal-50 rounded-full mb-6">
                    <FileText className="h-12 w-12 text-teal-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">Complete Your First Practice Test</h3>
                  <p className="text-slate-600 mb-8 max-w-md mx-auto">You need to complete <strong>at least one practice test</strong> to see your detailed performance insights, progress tracking, and improvement recommendations.</p>
                  <button 
                    onClick={() => navigate('/practice')}
                    className="px-8 py-4 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                  >
                    Start Practice Test
                  </button>
                </div>
              ) : (
                <div className="space-y-8">
              {/* Test Selection Cards */}
              <div className="grid grid-cols-5 gap-4">
                {(performanceData.practice?.tests || []).map((test, index) => (
                  <div 
                    key={index} 
                    onClick={() => test.status === 'completed' && setSelectedPracticeTest(test.testNumber)}
                    className={`relative p-4 rounded-xl border ${
                      selectedPracticeTest === test.testNumber
                        ? 'bg-white border-2 border-teal-500 shadow-lg scale-105 transform'
                        : test.status === 'completed'
                        ? 'bg-white border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-105 transform'
                        : 'bg-white border-slate-200 shadow-sm opacity-60'
                    }`}
                  >
                    <div className="text-center">
                      <h3 className={`text-lg font-bold mb-2 ${
                        selectedPracticeTest === test.testNumber ? 'text-teal-700' : 'text-slate-900'
                      }`}>
                        Test {test.testNumber}
                      </h3>
                      {test.status === 'completed' && test.score !== null ? (
                        <>
                          <div className={`text-2xl font-bold mb-1 ${
                            test.score >= 80 ? 'text-green-600' : test.score >= 60 ? 'text-orange-600' : 'text-red-600'
                          }`}>
                            {test.score}%
                          </div>
                          <p className={`text-sm font-medium ${
                            selectedPracticeTest === test.testNumber ? 'text-teal-600' : 'text-slate-600'
                          }`}>
                            {new Date(test.completedAt).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </p>
                        </>
                      ) : (
                        <div className="text-lg font-semibold text-slate-600">
                          {test.status === 'in-progress' ? 'In Progress' : 'Not Started'}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {/* Fill remaining slots if less than 5 tests */}
                {Array.from({ length: Math.max(0, 5 - (performanceData.practice?.tests?.length || 0)) }, (_, i) => {
                  const testNumber = (performanceData.practice?.tests?.length || 0) + i + 1;
                  return (
                    <div 
                      key={`empty-${i}`} 
                      className="relative p-4 rounded-xl border bg-white border-slate-200 shadow-sm opacity-50"
                    >
                      <div className="text-center">
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Test {testNumber}</h3>
                        <div className="text-lg font-semibold mb-2 text-slate-600">
                          Not Started
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {(() => {
                // Debug: log all practice tests to see their structure
                // First try to find completed test, then fall back to any test with that number
                let selectedTest = performanceData.practice?.tests?.find(t => t.testNumber === selectedPracticeTest && t.status === 'completed');
                
                if (!selectedTest) {
                  // If no completed test found, try to find any test with that number
                  selectedTest = performanceData.practice?.tests?.find(t => t.testNumber === selectedPracticeTest);
                  }
                
                if (!selectedTest) {
                  return (
                    <div className="text-center py-16">
                      <div className="inline-flex items-center justify-center w-24 h-24 bg-teal-50 rounded-full mb-6">
                        <FileText className="h-12 w-12 text-teal-500" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900 mb-3">Select a Completed Test</h3>
                      <p className="text-slate-600 mb-8 max-w-md mx-auto">Choose a completed practice test above to view detailed performance analysis.</p>
                    </div>
                  );
                }
                
                // Use ONLY real data from the database
                // For practice tests, use the backend-calculated values that account for max points
                const totalQuestions = selectedTest.totalQuestions || 0;
                const questionsAttempted = selectedTest.questionsAttempted || 0;
                const questionsCorrect = selectedTest.questionsCorrect || 0;
                const overallScore = selectedTest.score || 0;
                const overallAccuracy = selectedTest.overallAccuracy || 0;
                
                return (
                  <div className="space-y-8">
                    {/* Overall Performance Cards - Mobile-optimized responsive grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                      {/* Overall Score */}
                      <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 md:p-6 shadow-sm relative group">
                        <div className="text-center">
                          <div className="text-sm sm:text-base font-medium text-slate-600 mb-2 flex items-center justify-center gap-1">
                            <span className="truncate">Overall Score</span>
                            <div className="relative inline-block flex-shrink-0">
                              <Info size={12} className="sm:w-3.5 sm:h-3.5 text-slate-400 cursor-help" />
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 sm:w-64 p-2 sm:p-3 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                                <div className="font-semibold mb-1">Score</div>
                                <div>Measures your performance against the total number of questions in the test, including unanswered questions.</div>
                                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-slate-900"></div>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
                            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900">
                              {questionsCorrect}
                              <span className="text-slate-600">/{totalQuestions || questionsAttempted}</span>
                            </div>
                            <div className="hidden sm:block h-6 md:h-10 w-px bg-slate-200"></div>
                            <div className={`text-xl sm:text-2xl md:text-3xl font-bold ${
                              overallScore >= 80 ? 'text-green-600' : 
                              overallScore >= 60 ? 'text-orange-600' : 
                              'text-red-600'
                            }`}>{overallScore}%</div>
                          </div>
                        </div>
                      </div>

                      {/* Average Score */}
                      <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 md:p-6 shadow-sm relative group">
                        <div className="text-center">
                          <div className="text-sm sm:text-base font-medium text-slate-600 mb-2 flex items-center justify-center gap-1">
                            <span className="truncate">Average Score</span>
                            <div className="relative inline-block flex-shrink-0">
                              <Info size={12} className="sm:w-3.5 sm:h-3.5 text-slate-400 cursor-help" />
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 sm:w-64 p-2 sm:p-3 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                                <div className="font-semibold mb-1">Average Score</div>
                                <div>Simple average percentage across all test sections.</div>
                                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-slate-900"></div>
                              </div>
                            </div>
                          </div>
                          <div className={`text-xl sm:text-2xl md:text-3xl font-bold ${
                            (() => {
                              // Calculate simple average across all sections
                              const sectionScores = selectedTest.sectionBreakdown?.map(s => s.score) || [];
                              const averageScore = sectionScores.length > 0
                                ? Math.round(sectionScores.reduce((sum, score) => sum + score, 0) / sectionScores.length)
                                : 0;
                              
                              return averageScore >= 80 ? 'text-green-600' : 
                                     averageScore >= 60 ? 'text-orange-600' : 
                                     'text-red-600';
                            })()
                          }`}>
                            {(() => {
                              const sectionScores = selectedTest.sectionBreakdown?.map(s => s.score) || [];
                              return sectionScores.length > 0
                                ? Math.round(sectionScores.reduce((sum, score) => sum + score, 0) / sectionScores.length)
                                : 0;
                            })()}%
                          </div>
                        </div>
                      </div>

                      {/* Overall Accuracy */}
                      <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 md:p-6 shadow-sm relative group">
                        <div className="text-center">
                          <div className="text-sm sm:text-base font-medium text-slate-600 mb-2 flex items-center justify-center gap-1">
                            <span className="truncate">Overall Accuracy</span>
                            <div className="relative inline-block flex-shrink-0">
                              <Info size={12} className="sm:w-3.5 sm:h-3.5 text-slate-400 cursor-help" />
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 sm:w-64 p-2 sm:p-3 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                                <div className="font-semibold mb-1">Accuracy</div>
                                <div>Shows how well you performed on questions you actually attempted, excluding skipped or timed-out questions.</div>
                                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-slate-900"></div>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
                            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900">
                              {questionsCorrect}
                              <span className="text-slate-600">/{questionsAttempted}</span>
                            </div>
                            <div className="hidden sm:block h-6 md:h-10 w-px bg-slate-200"></div>
                            <div className={`text-xl sm:text-2xl md:text-3xl font-bold ${
                              overallAccuracy >= 80 ? 'text-green-600' : 
                              overallAccuracy >= 60 ? 'text-orange-600' : 
                              'text-red-600'
                            }`}>{overallAccuracy}%</div>
                          </div>
                        </div>
                      </div>
                    </div>

                  {/* Section Results */}
                  <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-slate-900">Section Results</h3>
                      <div className="flex items-center gap-4">
                        <div className="flex bg-slate-100 rounded-lg p-1">
                          <button
                            onClick={() => setSectionView('score')}
                            className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                              sectionView === 'score' 
                                ? 'bg-white text-slate-900 shadow-sm' 
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Total
                          </button>
                          <button
                            onClick={() => setSectionView('accuracy')}
                            className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                              sectionView === 'accuracy' 
                                ? 'bg-white text-slate-900 shadow-sm' 
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Attempted
                          </button>
                        </div>
                        <div className="relative group">
                          <Info size={16} className="text-slate-400 cursor-help" />
                          <div className="absolute top-full right-0 mt-2 w-72 p-4 bg-slate-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                            <div className="space-y-3">
                              <div>
                                <div className="font-semibold text-teal-400 mb-1">Total View</div>
                                <div className="text-xs">Shows correct answers out of total questions (e.g., 16/20 = 80%)</div>
                              </div>
                              <div>
                                <div className="font-semibold text-orange-400 mb-1">Attempted View</div>
                                <div className="text-xs">Shows correct answers out of questions attempted (e.g., 16/18 = 89%)</div>
                              </div>
                            </div>
                            <div className="absolute top-0 right-4 transform -translate-y-1/2 rotate-45 w-2 h-2 bg-slate-900"></div>
                          </div>
                        </div>
                      </div>
                    </div>
              
                    <div className="flex flex-col lg:flex-row">
                      {/* Spider Chart - Top on mobile, Left on desktop */}
                      <div className="w-full lg:w-1/2 p-3 sm:p-6 flex items-center justify-center border-b lg:border-b-0 lg:border-r border-slate-200">
                        <SpiderChart 
                          data={(selectedTest.sectionBreakdown || []).map((section) => ({
                            label: section.sectionName.replace('General Ability - ', 'GA - ').replace(' Reasoning', '\nReasoning'),
                            value: sectionView === 'score' ? section.score : section.accuracy,
                            maxValue: 100
                          }))}
                          size={280}
                          animate={animateSpiderChart}
                        />
                      </div>
                      
                      {/* Section List - Bottom on mobile, Right on desktop */}
                      <div className="w-full lg:w-1/2 divide-y divide-slate-100">
                        {selectedTest.sectionBreakdown && selectedTest.sectionBreakdown.length > 0 ? (
                          selectedTest.sectionBreakdown.map((section, index) => {
                            const displayScore = section.score;
                            const displayAccuracy = section.accuracy;
                            
                            return (
                              <div key={index} className="px-4 py-3 hover:bg-slate-50 transition-colors">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <h4 className="font-medium text-slate-900 text-base">{section.sectionName}</h4>
                                  </div>
                                  <div className="flex flex-col items-end gap-2">
                                    <div className={`text-base font-semibold ${
                                      sectionView === 'score'
                                        ? (displayScore >= 80 ? 'text-green-600' : displayScore >= 60 ? 'text-orange-600' : 'text-red-600')
                                        : (displayAccuracy >= 80 ? 'text-green-600' : displayAccuracy >= 60 ? 'text-orange-600' : 'text-red-600')
                                    }`}>
                                      {sectionView === 'score' ? displayScore : displayAccuracy}%
                                    </div>
                                    <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                      <div 
                                        key={`${section.sectionName}-${sectionView}`}
                                        className={`h-full rounded-full growToRight ${
                                          sectionView === 'score'
                                            ? (displayScore >= 80 ? 'bg-green-500' : displayScore >= 60 ? 'bg-orange-500' : 'bg-red-500')
                                            : (displayAccuracy >= 80 ? 'bg-green-500' : displayAccuracy >= 60 ? 'bg-orange-500' : 'bg-red-500')
                                        }`}
                                        style={{ 
                                          width: `${sectionView === 'score' ? displayScore : displayAccuracy}%`,
                                          animationDelay: `${index * 150}ms`
                                        }}
                                      />
                                    </div>
                                    <div 
                                      key={`${section.sectionName}-fraction-${sectionView}`}
                                      className="text-sm text-slate-600 fadeIn"
                                      style={{ animationDelay: `${index * 150 + 600}ms` }}
                                    >
                                      {sectionView === 'score' 
                                        ? <span>{section.questionsCorrect}/{section.questionsTotal}</span>
                                        : (section.sectionName.toLowerCase().includes('written expression') || section.sectionName.toLowerCase().includes('writing'))
                                          ? <span>{section.questionsCorrect}/{section.questionsTotal}</span>
                                          : <span>{section.questionsCorrect}/{section.questionsAttempted}</span>
                                      }
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="p-8 text-center text-slate-500">
                            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>Loading section data...</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Sub-Skills Performance */}
                  <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-slate-900">Detailed Sub-Skills Performance</h3>
                        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                          <button
                            onClick={() => setSubSkillView('score')}
                            className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                              subSkillView === 'score' 
                                ? 'bg-white text-slate-900 shadow-sm' 
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Total
                          </button>
                          <button
                            onClick={() => setSubSkillView('accuracy')}
                            className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                              subSkillView === 'accuracy' 
                                ? 'bg-white text-slate-900 shadow-sm' 
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Attempted
                          </button>
                          <div className="relative group">
                            <HelpCircle className="w-4 h-4 text-slate-400 cursor-help" />
                            <div className="absolute top-full right-0 mt-2 w-72 p-4 bg-slate-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                              <div className="space-y-3">
                                <div>
                                  <div className="font-semibold text-teal-400 mb-1">Total View</div>
                                  <div className="text-xs">Shows correct answers out of total questions (e.g., 16/20 = 80%)</div>
                                </div>
                                <div>
                                  <div className="font-semibold text-orange-400 mb-1">Attempted View</div>
                                  <div className="text-xs">Shows correct answers out of questions attempted (e.g., 16/18 = 89%)</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Filter Tabs - Better responsive wrapping */}
                      <div className="flex flex-wrap gap-2 mb-2">
                        {getFilterTabsForProduct(selectedProduct).map((filter) => (
                          <button
                            key={filter.id}
                            onClick={() => setPracticeFilter(filter.id)}
                            className={`px-3 py-1.5 text-xs md:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                              practiceFilter === filter.id
                                ? 'bg-slate-900 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {filter.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Sub-Skills List for Practice Tests */}
                    <div className="divide-y divide-slate-100">
                      {(selectedTest.subSkillBreakdown || [])
                        .filter(subSkill => {
                          // Filter by score/accuracy tab: 
                          // Score tab: show ALL sub-skills (including unattempted)
                          // Accuracy tab: show ONLY attempted sub-skills
                          if (subSkillView === 'accuracy' && subSkill.questionsAttempted === 0) {
                            return false;
                          }
                          
                          if (practiceFilter === 'all') return true;
                          
                          const lowerSectionName = subSkill.sectionName.toLowerCase();
                          
                          // Universal section filtering for all test types
                          if (practiceFilter === 'reading') {
                            return lowerSectionName.includes('reading');
                          }
                          if (practiceFilter === 'mathematical') {
                            return lowerSectionName.includes('mathematics') || 
                                   lowerSectionName.includes('mathematical') || 
                                   lowerSectionName.includes('numeracy');
                          }
                          if (practiceFilter === 'verbal') {
                            return lowerSectionName.includes('verbal') || 
                                   lowerSectionName.includes('language') || 
                                   lowerSectionName.includes('thinking skills');
                          }
                          if (practiceFilter === 'quantitative') {
                            return lowerSectionName.includes('quantitative') || 
                                   lowerSectionName.includes('numerical');
                          }
                          if (practiceFilter === 'writing') {
                            return lowerSectionName.includes('writing') || 
                                   lowerSectionName.includes('written expression');
                          }
                          if (practiceFilter === 'language') {
                            return lowerSectionName.includes('language');
                          }
                          if (practiceFilter === 'thinking') {
                            return lowerSectionName.includes('thinking');
                          }
                          if (practiceFilter === 'humanities') {
                            return lowerSectionName.includes('humanities');
                          }
                          
                          return true;
                        })
                        .sort((a, b) => {
                          // Sort by score/accuracy depending on current view (best to worst)
                          const aValue = subSkillView === 'score' ? a.score : a.accuracy;
                          const bValue = subSkillView === 'score' ? b.score : b.accuracy;
                          return bValue - aValue; // Highest to lowest (best first)
                        })
                        .map((subSkill, index) => {
                          const displayScore = subSkill.score;
                          const displayAccuracy = subSkill.accuracy;
                          
                          return (
                            <div key={index} className="px-4 py-3 hover:bg-slate-50 transition-colors">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="relative group">
                                    <h5 className="font-medium text-slate-900 cursor-help flex items-center gap-1">
                                      {subSkill.subSkillName}
                                      <Info size={14} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </h5>
                                    {UNIFIED_SUB_SKILLS[subSkill.subSkillName] && (
                                      <div className="absolute left-0 top-full mt-2 w-80 p-4 bg-slate-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20 shadow-lg">
                                        <div className="font-semibold text-teal-400 mb-2">{subSkill.subSkillName}</div>
                                        <div className="text-xs leading-relaxed">{UNIFIED_SUB_SKILLS[subSkill.subSkillName]?.description || 'No description available'}</div>
                                        <div className="absolute bottom-0 left-6 transform translate-y-1/2 rotate-45 w-2 h-2 bg-slate-900"></div>
                                      </div>
                                    )}
                                  </div>
                                  <p className="text-sm text-slate-500">{subSkill.sectionName}</p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <div className={`text-lg font-semibold ${
                                    subSkillView === 'score'
                                      ? (displayScore >= 80 ? 'text-green-600' : displayScore >= 60 ? 'text-orange-600' : 'text-red-600')
                                      : (displayAccuracy >= 80 ? 'text-green-600' : displayAccuracy >= 60 ? 'text-orange-600' : 'text-red-600')
                                  }`}>
                                    {subSkillView === 'score' ? displayScore : displayAccuracy}%
                                  </div>
                                  <div className="w-32 bg-slate-100 rounded-full h-2 overflow-hidden">
                                    <div 
                                      key={`${subSkill.subSkillName}-${subSkillView}`}
                                      className={`h-full rounded-full growToRight ${
                                        subSkillView === 'score'
                                          ? (displayScore >= 80 ? 'bg-green-500' : displayScore >= 60 ? 'bg-orange-500' : 'bg-red-500')
                                          : (displayAccuracy >= 80 ? 'bg-green-500' : displayAccuracy >= 60 ? 'bg-orange-500' : 'bg-red-500')
                                      }`}
                                      style={{ 
                                        width: `${subSkillView === 'score' ? displayScore : displayAccuracy}%`,
                                        animationDelay: `${index * 120}ms`
                                      }}
                                    />
                                  </div>
                                  <div 
                                    key={`${subSkill.subSkillName}-fraction-${subSkillView}`}
                                    className="text-sm text-slate-600 fadeIn"
                                    style={{ animationDelay: `${index * 120 + 600}ms` }}
                                  >
                                    {subSkillView === 'score' 
                                      ? <span>{subSkill.questionsCorrect}/{subSkill.questionsTotal}</span>
                                      : (subSkill.sectionName.toLowerCase().includes('written expression') || subSkill.sectionName.toLowerCase().includes('writing'))
                                        ? <span>{subSkill.questionsCorrect}/{subSkill.questionsTotal}</span>
                                        : <span>{subSkill.questionsCorrect}/{subSkill.questionsAttempted}</span>
                                    }
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                    
                    {selectedTest.subSkillBreakdown && selectedTest.subSkillBreakdown.length === 0 && (
                      <div className="text-center py-8 text-slate-500">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        No sub-skill data available for this practice test.
                      </div>
                    )}
                  </div>
                </div>
              );
              })()}
                </div>
              )}
            </div>
          )}

          {/* Drills Tab */}
          {activeTab === 'drills' && (
            <div className="space-y-8">
              {!loadedTabs.has('drills') ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-edu-teal"></div>
                  <span className="ml-3 text-edu-navy/70">Loading drill insights...</span>
                </div>
              ) : !performanceData.drills?.subSkillBreakdown?.some(section =>
                section.subSkills.some(skill => skill.questionsCompleted > 0)
              ) ? (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-24 h-24 bg-teal-50 rounded-full mb-6">
                    <Target className="h-12 w-12 text-teal-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">Practice Some Skills First</h3>
                  <p className="text-slate-600 mb-8 max-w-md mx-auto">You need to complete <strong>at least one drill question</strong> in any sub-skill to see your drill performance insights and progress tracking.</p>
                  <button className="px-8 py-4 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                    Start Skill Practice
                  </button>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Overall Drill Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                      <div className="text-center">
                        <div className="text-base font-medium text-slate-600 mb-2">Total Questions Drilled</div>
                        <div className="text-3xl font-bold text-slate-900">{performanceData.drills?.totalQuestions || 0}</div>
                      </div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                      <div className="text-center">
                        <div className="text-base font-medium text-slate-600 mb-2">Overall Accuracy</div>
                        <div className={`text-3xl font-bold ${
                          (() => {
                            // Calculate actual accuracy from the displayed sub-skills (same logic as Total Score)
                            let totalNumerator = 0;
                            let totalDenominator = 0;
                            
                            // Get all sub-skills from all sections
                            const allSubSkills = (performanceData.drills?.subSkillBreakdown || [])
                              .flatMap(section => section.subSkills);
                            
                            allSubSkills.forEach(subSkill => {
                              // For skills with maxPoints (writing assessments), use maxPoints instead of questions
                              const hasMaxPoints = (subSkill as any).difficulty1MaxPoints || (subSkill as any).difficulty2MaxPoints || (subSkill as any).difficulty3MaxPoints;
                              
                              if (hasMaxPoints) {
                                if (subSkill.difficulty1Questions > 0 && (subSkill as any).difficulty1MaxPoints > 0) {
                                  totalNumerator += subSkill.difficulty1Correct || 0;
                                  totalDenominator += (subSkill as any).difficulty1MaxPoints || 0;
                                }
                                if (subSkill.difficulty2Questions > 0 && (subSkill as any).difficulty2MaxPoints > 0) {
                                  totalNumerator += subSkill.difficulty2Correct || 0;
                                  totalDenominator += (subSkill as any).difficulty2MaxPoints || 0;
                                }
                                if (subSkill.difficulty3Questions > 0 && (subSkill as any).difficulty3MaxPoints > 0) {
                                  totalNumerator += subSkill.difficulty3Correct || 0;
                                  totalDenominator += (subSkill as any).difficulty3MaxPoints || 0;
                                }
                              } else {
                                // For regular skills, count each difficulty level with questions
                                if (subSkill.difficulty1Questions > 0) {
                                  totalNumerator += subSkill.difficulty1Correct || 0;
                                  totalDenominator += subSkill.difficulty1Questions || 0;
                                }
                                if (subSkill.difficulty2Questions > 0) {
                                  totalNumerator += subSkill.difficulty2Correct || 0;
                                  totalDenominator += subSkill.difficulty2Questions || 0;
                                }
                                if (subSkill.difficulty3Questions > 0) {
                                  totalNumerator += subSkill.difficulty3Correct || 0;
                                  totalDenominator += subSkill.difficulty3Questions || 0;
                                }
                              }
                            });
                            
                            const accuracy = totalDenominator > 0 ? Math.round((totalNumerator / totalDenominator) * 100) : 0;
                            return accuracy >= 80 ? 'text-green-600' : accuracy >= 60 ? 'text-orange-600' : 'text-red-600';
                          })()
                        }`}>
                          {(() => {
                            // Calculate actual accuracy percentage from the displayed sub-skills (same logic as Total Score)
                            let totalNumerator = 0;
                            let totalDenominator = 0;
                            
                            // Get all sub-skills from all sections
                            const allSubSkills = (performanceData.drills?.subSkillBreakdown || [])
                              .flatMap(section => section.subSkills);
                            
                            allSubSkills.forEach(subSkill => {
                              // For skills with maxPoints (writing assessments), use maxPoints instead of questions
                              const hasMaxPoints = (subSkill as any).difficulty1MaxPoints || (subSkill as any).difficulty2MaxPoints || (subSkill as any).difficulty3MaxPoints;
                              
                              if (hasMaxPoints) {
                                if (subSkill.difficulty1Questions > 0 && (subSkill as any).difficulty1MaxPoints > 0) {
                                  totalNumerator += subSkill.difficulty1Correct || 0;
                                  totalDenominator += (subSkill as any).difficulty1MaxPoints || 0;
                                }
                                if (subSkill.difficulty2Questions > 0 && (subSkill as any).difficulty2MaxPoints > 0) {
                                  totalNumerator += subSkill.difficulty2Correct || 0;
                                  totalDenominator += (subSkill as any).difficulty2MaxPoints || 0;
                                }
                                if (subSkill.difficulty3Questions > 0 && (subSkill as any).difficulty3MaxPoints > 0) {
                                  totalNumerator += subSkill.difficulty3Correct || 0;
                                  totalDenominator += (subSkill as any).difficulty3MaxPoints || 0;
                                }
                              } else {
                                // For regular skills, count each difficulty level with questions
                                if (subSkill.difficulty1Questions > 0) {
                                  totalNumerator += subSkill.difficulty1Correct || 0;
                                  totalDenominator += subSkill.difficulty1Questions || 0;
                                }
                                if (subSkill.difficulty2Questions > 0) {
                                  totalNumerator += subSkill.difficulty2Correct || 0;
                                  totalDenominator += subSkill.difficulty2Questions || 0;
                                }
                                if (subSkill.difficulty3Questions > 0) {
                                  totalNumerator += subSkill.difficulty3Correct || 0;
                                  totalDenominator += subSkill.difficulty3Questions || 0;
                                }
                              }
                            });
                            
                            const accuracy = totalDenominator > 0 ? Math.round((totalNumerator / totalDenominator) * 100) : 0;
                            return `${accuracy}%`;
                          })()}
                        </div>
                      </div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                      <div className="text-center">
                        <div className="text-base font-medium text-slate-600 mb-2">Total Score</div>
                        <div className={`text-3xl font-bold ${
                          performanceData.drills?.overallAccuracy && performanceData.drills.overallAccuracy >= 80 ? 'text-green-600' : 
                          performanceData.drills?.overallAccuracy && performanceData.drills.overallAccuracy >= 60 ? 'text-orange-600' : 
                          'text-red-600'
                        }`}>
                          {(() => {
                            // Calculate actual totals from the displayed sub-skills
                            let totalNumerator = 0;
                            let totalDenominator = 0;
                            
                            // Get all sub-skills from all sections and apply the same grouping logic as the display
                            const allSubSkills = (performanceData.drills?.subSkillBreakdown || [])
                              .flatMap(section => section.subSkills);
                            
                            // Apply the same grouping logic for writing skills as used in display
                            const groupedSubSkills = new Map();
                            
                            allSubSkills.forEach(subSkill => {
                              const sectionName = subSkill.sectionName || '';
                              const isWritingSkill = sectionName.toLowerCase().includes('writing') || 
                                                   sectionName.toLowerCase().includes('written expression');
                              
                              if (isWritingSkill) {
                                // Extract base name without "- Essay X" part
                                const baseName = subSkill.subSkillName.replace(/ - Essay \d+$/, '');
                                const essayMatch = subSkill.subSkillName.match(/ - Essay (\d+)$/);
                                const essayNumber = essayMatch ? parseInt(essayMatch[1]) : 1;
                                
                                if (!groupedSubSkills.has(baseName)) {
                                  groupedSubSkills.set(baseName, {
                                    ...subSkill,
                                    subSkillName: baseName,
                                    isGroupedWriting: true,
                                    essays: {}
                                  });
                                }
                                
                                const grouped = groupedSubSkills.get(baseName);
                                
                                // Determine which difficulty this essay corresponds to
                                let correct, maxPoints;
                                if (essayNumber === 1) {
                                  correct = subSkill.difficulty1Correct || 0;
                                  maxPoints = (subSkill as any).difficulty1MaxPoints || 15;
                                } else if (essayNumber === 2) {
                                  correct = subSkill.difficulty2Correct || 0;
                                  maxPoints = (subSkill as any).difficulty2MaxPoints || 15;
                                } else if (essayNumber === 3) {
                                  correct = subSkill.difficulty3Correct || 0;
                                  maxPoints = (subSkill as any).difficulty3MaxPoints || 15;
                                }
                                
                                grouped.essays[essayNumber] = {
                                  correct,
                                  maxPoints,
                                  attempted: maxPoints > 0
                                };
                              } else {
                                // Non-writing skills: keep as-is
                                groupedSubSkills.set(subSkill.subSkillName, subSkill);
                              }
                            });
                            
                            // Now calculate totals from grouped data
                            Array.from(groupedSubSkills.values()).forEach(subSkill => {
                              if ((subSkill as any).isGroupedWriting) {
                                // For writing skills, sum up all attempted essays
                                const essays = (subSkill as any).essays || {};
                                Object.values(essays).forEach((essay: any) => {
                                  if (essay.attempted) {
                                    totalNumerator += essay.correct || 0;
                                    totalDenominator += essay.maxPoints || 0;
                                  }
                                });
                              } else {
                                // For skills with maxPoints (writing assessments), use maxPoints instead of questions
                                const hasMaxPoints = (subSkill as any).difficulty1MaxPoints || (subSkill as any).difficulty2MaxPoints || (subSkill as any).difficulty3MaxPoints;
                                
                                if (hasMaxPoints) {
                                  if (subSkill.difficulty1Questions > 0 && (subSkill as any).difficulty1MaxPoints > 0) {
                                    totalNumerator += subSkill.difficulty1Correct || 0;
                                    totalDenominator += (subSkill as any).difficulty1MaxPoints || 0;
                                  }
                                  if (subSkill.difficulty2Questions > 0 && (subSkill as any).difficulty2MaxPoints > 0) {
                                    totalNumerator += subSkill.difficulty2Correct || 0;
                                    totalDenominator += (subSkill as any).difficulty2MaxPoints || 0;
                                  }
                                  if (subSkill.difficulty3Questions > 0 && (subSkill as any).difficulty3MaxPoints > 0) {
                                    totalNumerator += subSkill.difficulty3Correct || 0;
                                    totalDenominator += (subSkill as any).difficulty3MaxPoints || 0;
                                  }
                                } else {
                                  // For regular skills, count each difficulty level with questions
                                  if (subSkill.difficulty1Questions > 0) {
                                    totalNumerator += subSkill.difficulty1Correct || 0;
                                    totalDenominator += subSkill.difficulty1Questions || 0;
                                  }
                                  if (subSkill.difficulty2Questions > 0) {
                                    totalNumerator += subSkill.difficulty2Correct || 0;
                                    totalDenominator += subSkill.difficulty2Questions || 0;
                                  }
                                  if (subSkill.difficulty3Questions > 0) {
                                    totalNumerator += subSkill.difficulty3Correct || 0;
                                    totalDenominator += subSkill.difficulty3Questions || 0;
                                  }
                                }
                              }
                            });
                            
                            return `${totalNumerator}/${totalDenominator}`;
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sub-Skills Performance */}
                  <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200">
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-slate-900">Detailed Sub-Skills Performance</h3>
                      </div>
                      
                      {/* Filter Tabs - Better responsive wrapping */}
                      <div className="flex flex-wrap gap-2 mb-2">
                        {getFilterTabsForProduct(selectedProduct).map((filter) => (
                          <button
                            key={filter.id}
                            onClick={() => setDrillFilter(filter.id)}
                            className={`px-3 py-1.5 text-xs md:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                              drillFilter === filter.id
                                ? 'bg-slate-900 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {filter.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Sub-Skills List for Drills */}
                    <div className="divide-y divide-slate-100">
                      {(() => {
                        // Flatten all sub-skills from all sections into one list
                        const allSubSkills = (performanceData.drills?.subSkillBreakdown || [])
                          .flatMap(section => 
                            section.subSkills.map(skill => ({
                              ...skill,
                              sectionName: section.sectionName
                            }))
                          )
                          .filter(subSkill => {
                            if (drillFilter === 'all') return true;
                            
                            const lowerSectionName = subSkill.sectionName.toLowerCase();
                            
                            // Universal section filtering for all test types
                            if (drillFilter === 'reading') {
                              return lowerSectionName.includes('reading');
                            }
                            if (drillFilter === 'mathematical') {
                              return lowerSectionName.includes('mathematics') || 
                                     lowerSectionName.includes('mathematical') || 
                                     lowerSectionName.includes('numeracy');
                            }
                            if (drillFilter === 'verbal') {
                              return lowerSectionName.includes('verbal') || 
                                     lowerSectionName.includes('language') || 
                                     lowerSectionName.includes('thinking skills');
                            }
                            if (drillFilter === 'quantitative') {
                              return lowerSectionName.includes('quantitative') || 
                                     lowerSectionName.includes('numerical');
                            }
                            if (drillFilter === 'writing') {
                              return lowerSectionName.includes('writing') || 
                                     lowerSectionName.includes('written expression');
                            }
                            if (drillFilter === 'language') {
                              return lowerSectionName.includes('language');
                            }
                            if (drillFilter === 'thinking') {
                              return lowerSectionName.includes('thinking');
                            }
                            if (drillFilter === 'humanities') {
                              return lowerSectionName.includes('humanities');
                            }
                            
                            return true;
                          });

                        // Group writing sub-skills by base name (consolidate essays)
                        const groupedSubSkills = new Map();
                        
                        allSubSkills.forEach(subSkill => {
                          const isWritingSkill = subSkill.sectionName.toLowerCase().includes('writing') || 
                                               subSkill.sectionName.toLowerCase().includes('written expression');
                          
                          if (isWritingSkill) {
                            // Extract base name without "- Essay X" part
                            const baseName = subSkill.subSkillName.replace(/ - Essay \d+$/, '');
                            const essayMatch = subSkill.subSkillName.match(/ - Essay (\d+)$/);
                            const essayNumber = essayMatch ? parseInt(essayMatch[1]) : 1;
                            
                            if (!groupedSubSkills.has(baseName)) {
                              groupedSubSkills.set(baseName, {
                                ...subSkill,
                                subSkillName: baseName,
                                isGroupedWriting: true,
                                essays: {}
                              });
                            }
                            
                            const grouped = groupedSubSkills.get(baseName);
                            
                            // For writing drills, the scores are in different difficulty levels based on essay number
                            let correct = 0;
                            let maxPoints = 15;
                            let accuracy = 0;
                            
                            if (essayNumber === 1) {
                              correct = subSkill.difficulty1Correct || 0;
                              maxPoints = (subSkill as any).difficulty1MaxPoints || 15;
                              accuracy = subSkill.difficulty1Accuracy || 0;
                            } else if (essayNumber === 2) {
                              correct = subSkill.difficulty2Correct || 0;
                              maxPoints = (subSkill as any).difficulty2MaxPoints || 15;
                              accuracy = subSkill.difficulty2Accuracy || 0;
                            } else if (essayNumber === 3) {
                              correct = subSkill.difficulty3Correct || 0;
                              maxPoints = (subSkill as any).difficulty3MaxPoints || 15;
                              accuracy = subSkill.difficulty3Accuracy || 0;
                            }
                            
                            // Debug: Log essay scores for writing drills
                            if (isWritingSkill) {
                              }
                            
                            grouped.essays[essayNumber] = {
                              correct,
                              maxPoints,
                              accuracy,
                              // For writing drills, if maxPoints > 0, it means the essay was attempted (even if score is 0)
                              attempted: maxPoints > 0
                            };
                            
                            // Update overall accuracy as average of ALL attempted essays (including 0-point ones)
                            const attemptedEssays = Object.values(grouped.essays).filter((essay: any) => essay.attempted);
                            if (attemptedEssays.length > 0) {
                              // Calculate accuracy as simple average: (correct1/max1 + correct2/max2 + correct3/max3) / numAttempted * 100
                              const totalPercentage = attemptedEssays.reduce((sum: number, essay: any) => {
                                const essayPercentage = essay.maxPoints > 0 ? (essay.correct / essay.maxPoints) * 100 : 0;
                                return sum + essayPercentage;
                              }, 0);
                              grouped.accuracy = Math.round(totalPercentage / attemptedEssays.length);
                              
                              // Update questionsCompleted to reflect actual number of essays attempted
                              grouped.questionsCompleted = attemptedEssays.length;
                            }
                          } else {
                            // Non-writing skills: keep as-is
                            groupedSubSkills.set(subSkill.subSkillName, subSkill);
                          }
                        });

                        // Convert back to array and sort
                        const finalSubSkills = Array.from(groupedSubSkills.values())
                          .sort((a, b) => {
                            // Sort by accuracy (best to worst) for drill results
                            return (b.accuracy || 0) - (a.accuracy || 0); // Highest to lowest (best first)
                          });

                        return finalSubSkills.map((subSkill, index) => {
                          // Debug: Log each sub-skill data to see what properties it has
                          if ((subSkill as any).isWritingDrill) {
                            }
                          
                          return (
                            <div key={index} className="px-4 py-3 hover:bg-slate-50 transition-colors">
                              <div className="flex items-center gap-6">
                                {/* Left Section: Sub-skill Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="relative group">
                                    <h5 className="font-medium text-slate-900 cursor-help flex items-center gap-1">
                                      {subSkill.subSkillName}
                                      <Info size={14} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </h5>
                                    {UNIFIED_SUB_SKILLS[subSkill.subSkillName] && (
                                      <div className="absolute left-0 top-full mt-2 w-80 p-4 bg-slate-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20 shadow-lg">
                                        <div className="font-semibold text-teal-400 mb-2">{subSkill.subSkillName}</div>
                                        <div className="text-xs leading-relaxed">{UNIFIED_SUB_SKILLS[subSkill.subSkillName]?.description || 'No description available'}</div>
                                        <div className="absolute bottom-0 left-6 transform translate-y-1/2 rotate-45 w-2 h-2 bg-slate-900"></div>
                                      </div>
                                    )}
                                  </div>
                                  <p className="text-sm text-slate-500">
                                    {(subSkill as any).isGroupedWriting ? 'Written Expression' : subSkill.sectionName}
                                  </p>
                                </div>

                                {/* Overall Stats */}
                                <div className="flex items-center gap-3 flex-shrink-0">
                                  <div className={`text-lg font-semibold ${
                                    subSkill.accuracy >= 80 ? 'text-green-600' : 
                                    subSkill.accuracy >= 60 ? 'text-orange-600' : 
                                    'text-red-600'
                                  }`}>
                                    {subSkill.accuracy}%
                                  </div>
                                  
                                  <div className="w-32 bg-slate-100 rounded-full h-2 overflow-hidden">
                                    <div 
                                      key={`${subSkill.subSkillName}-accuracy`}
                                      className={`h-full rounded-full growToRight ${
                                        subSkill.accuracy >= 80 ? 'bg-green-500' : 
                                        subSkill.accuracy >= 60 ? 'bg-orange-500' : 
                                        'bg-red-500'
                                      }`}
                                      style={{ 
                                        width: `${subSkill.accuracy}%`,
                                        animationDelay: `${index * 120}ms`
                                      }}
                                    />
                                  </div>
                                  
                                  <div className="text-sm text-slate-600 whitespace-nowrap fadeIn" style={{ animationDelay: `${index * 120 + 600}ms` }}>
                                    {subSkill.questionsCompleted} questions
                                  </div>
                                </div>

                                {/* Vertical Separator */}
                                <div className="w-px h-8 bg-slate-200 flex-shrink-0"></div>

                                {/* Right Section: Difficulty Breakdown */}
                                <div className="grid grid-cols-3 gap-8 flex-shrink-0">
                                  {(subSkill as any).isGroupedWriting ? (
                                    // For grouped writing skills, show Essay 1, 2, 3 from consolidated data
                                    <>
                                      <div className="text-center">
                                        <div className="text-xs text-slate-500 mb-2">Essay 1</div>
                                        <div className="text-sm font-medium text-slate-700">
                                          {(subSkill as any).essays[1]?.attempted ? 
                                            `${(subSkill as any).essays[1].correct}/${(subSkill as any).essays[1].maxPoints}` : 
                                            '—'
                                          }
                                        </div>
                                      </div>
                                      <div className="text-center">
                                        <div className="text-xs text-slate-500 mb-2">Essay 2</div>
                                        <div className="text-sm font-medium text-slate-700">
                                          {(subSkill as any).essays[2]?.attempted ? 
                                            `${(subSkill as any).essays[2].correct}/${(subSkill as any).essays[2].maxPoints}` : 
                                            '—'
                                          }
                                        </div>
                                      </div>
                                      <div className="text-center">
                                        <div className="text-xs text-slate-500 mb-2">Essay 3</div>
                                        <div className="text-sm font-medium text-slate-700">
                                          {(subSkill as any).essays[3]?.attempted ? 
                                            `${(subSkill as any).essays[3].correct}/${(subSkill as any).essays[3].maxPoints}` : 
                                            '—'
                                          }
                                        </div>
                                      </div>
                                    </>
                                  ) : (
                                    // For regular skills, show Easy/Medium/Hard
                                    <>
                                      <div className="text-center">
                                        <div className="text-xs text-slate-500 mb-2">Easy</div>
                                        <div className="text-sm font-medium text-slate-700">
                                          {(subSkill.difficulty1Questions > 0) ? 
                                            `${subSkill.difficulty1Correct || 0}/${subSkill.difficulty1Questions}` : 
                                            '—'
                                          }
                                        </div>
                                      </div>
                                      <div className="text-center">
                                        <div className="text-xs text-slate-500 mb-2">Medium</div>
                                        <div className="text-sm font-medium text-slate-700">
                                          {(subSkill.difficulty2Questions > 0) ? 
                                            `${subSkill.difficulty2Correct || 0}/${subSkill.difficulty2Questions}` : 
                                            '—'
                                          }
                                        </div>
                                      </div>
                                      <div className="text-center">
                                        <div className="text-xs text-slate-500 mb-2">Hard</div>
                                        <div className="text-sm font-medium text-slate-700">
                                          {(subSkill.difficulty3Questions > 0) ? 
                                            `${subSkill.difficulty3Correct || 0}/${subSkill.difficulty3Questions}` : 
                                            '—'
                                          }
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>

                    {(() => {
                      const hasFilteredResults = (performanceData.drills?.subSkillBreakdown || [])
                        .flatMap(section => section.subSkills.map(skill => ({ ...skill, sectionName: section.sectionName })))
                        .filter(subSkill => {
                          if (drillFilter === 'all') return true;
                          
                          const lowerSectionName = subSkill.sectionName.toLowerCase();
                          
                          // Universal section filtering for all test types
                          if (drillFilter === 'reading') {
                            return lowerSectionName.includes('reading');
                          }
                          if (drillFilter === 'mathematical') {
                            return lowerSectionName.includes('mathematics') || 
                                   lowerSectionName.includes('mathematical') || 
                                   lowerSectionName.includes('numeracy');
                          }
                          if (drillFilter === 'verbal') {
                            return lowerSectionName.includes('verbal') || 
                                   lowerSectionName.includes('language') || 
                                   lowerSectionName.includes('thinking skills');
                          }
                          if (drillFilter === 'quantitative') {
                            return lowerSectionName.includes('quantitative') || 
                                   lowerSectionName.includes('numerical');
                          }
                          if (drillFilter === 'writing') {
                            return lowerSectionName.includes('writing') || 
                                   lowerSectionName.includes('written expression');
                          }
                          
                          return true;
                        }).length > 0;

                      return !hasFilteredResults && (
                        <div className="text-center py-8 text-slate-500">
                          <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          No sub-skill data available for this filter.
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Add the CSS animation styles
const globalStyles = `
  .growToRight {
    animation: growToRight 1.2s ease-out forwards;
    transform-origin: left center;
  }
  
  @keyframes growToRight {
    0% {
      transform: scaleX(0);
    }
    70% {
      transform: scaleX(1.02);
    }
    100% {
      transform: scaleX(1);
    }
  }
  
  .fadeIn {
    animation: fadeIn 0.5s ease-out forwards;
    opacity: 0;
  }
  
  @keyframes fadeIn {
    to {
      opacity: 1;
    }
  }
  
  @keyframes growFromCenter {
    0% {
      transform: scale(0);
      opacity: 0;
    }
    60% {
      transform: scale(1.05);
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }
  
  @keyframes fadeInSlideUp {
    0% {
      opacity: 0;
      transform: translate(-50%, -50%) translateY(15px) scale(0.8);
    }
    100% {
      opacity: 1;
      transform: translate(-50%, -50%) translateY(0) scale(1);
    }
  }
`;

// Inject styles into document head
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = globalStyles;
  if (!document.head.querySelector('style[data-component="insights-animations"]')) {
    styleElement.setAttribute('data-component', 'insights-animations');
    document.head.appendChild(styleElement);
  }
}

export default PerformanceDashboard;
