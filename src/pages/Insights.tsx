import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Target, BookOpen, Activity, AlertCircle, TrendingUp, TrendingDown, Clock, Award, CheckCircle, XCircle, Flag, Star, Info, Zap, FileText } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useProduct } from '@/context/ProductContext';
import { 
  AnalyticsService, 
  type OverallPerformance, 
  type DiagnosticResults, 
  type PracticeTestResults, 
  type DrillResults 
} from '@/services/analyticsService';
import { UNIFIED_SUB_SKILLS, SECTION_TO_SUB_SKILLS, TEST_STRUCTURES } from '@/data/curriculumData';
import { supabase } from '@/integrations/supabase/client';

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
  const { selectedProduct } = useProduct();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPracticeTest, setSelectedPracticeTest] = useState(2);
  const [practiceFilter, setPracticeFilter] = useState('all');
  const [drillFilter, setDrillFilter] = useState('all');
  const [sectionView, setSectionView] = useState<'score' | 'accuracy'>('score');
  const [subSkillView, setSubSkillView] = useState<'score' | 'accuracy'>('score');
  const [drillView, setDrillView] = useState<'accuracy' | 'level'>('accuracy');
  const [isLoading, setIsLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    overall: null,
    diagnostic: null,
    practice: null,
    drills: null,
  });
  
  // Animation states
  const [animatedOverallScore, setAnimatedOverallScore] = useState(0);
  const [animatedOverallAccuracy, setAnimatedOverallAccuracy] = useState(0);
  const [animateSpiderChart, setAnimateSpiderChart] = useState(true);
  const [animatedSectionScores, setAnimatedSectionScores] = useState<Record<string, number>>({});
  const [animatedSubSkillScores, setAnimatedSubSkillScores] = useState<Record<string, number>>({});
  const [animatedPracticeScore, setAnimatedPracticeScore] = useState(0);
  const [animatedPracticeAccuracy, setAnimatedPracticeAccuracy] = useState(0);
  
  // User profile state
  const [userProfile, setUserProfile] = useState<any>(null);

  // Load real performance data
  useEffect(() => {
    const loadPerformanceData = async () => {
      if (!user || !selectedProduct) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setDataError(null);
      
      try {
        console.log('📊 Loading performance data for:', user.id, selectedProduct);
        
        // Load user profile
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (profile) {
          setUserProfile(profile);
        }
        
        // Load data with individual error handling for each section
        const results = await Promise.allSettled([
          AnalyticsService.getOverallPerformance(user.id, selectedProduct),
          AnalyticsService.getDiagnosticResults(user.id, selectedProduct),
          AnalyticsService.getPracticeTestResults(user.id, selectedProduct),
          AnalyticsService.getDrillResults(user.id, selectedProduct),
        ]);

        const [overallResult, diagnosticResult, practiceResult, drillsResult] = results;

        // Extract successful results or null for failed ones
        const overall = overallResult.status === 'fulfilled' ? overallResult.value : null;
        const diagnostic = diagnosticResult.status === 'fulfilled' ? diagnosticResult.value : null;
        const practice = practiceResult.status === 'fulfilled' ? practiceResult.value : null;
        const drills = drillsResult.status === 'fulfilled' ? drillsResult.value : null;
        
        // Debug drill data
        console.log('🔧 Drill result status:', drillsResult.status);
        if (drillsResult.status === 'rejected') {
          console.error('🔧 Drill result error:', drillsResult.reason);
        } else {
          console.log('🔧 Drill data:', drills);
          console.log('🔧 Drill subSkillBreakdown:', drills?.subSkillBreakdown);
        }

        // Log any failures but don't fail the entire load
        results.forEach((result, index) => {
          const sections = ['Overall', 'Diagnostic', 'Practice', 'Drills'];
          if (result.status === 'rejected') {
            console.warn(`⚠️ Failed to load ${sections[index]} data:`, result.reason);
          }
        });

        setPerformanceData({
          overall,
          diagnostic,
          practice,
          drills,
        });

        console.log('✅ Performance data loaded successfully');
        console.log('🔍 Practice data received:', practice);
      } catch (error) {
        console.error('❌ Error loading performance data:', error);
        setDataError('Failed to load performance data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadPerformanceData();
  }, [user, selectedProduct]);
  
  // Counting animation for overall score and accuracy
  useEffect(() => {
    const targetScore = performanceData.diagnostic?.overallScore || 0;
    const targetAccuracy = performanceData.diagnostic?.overallAccuracy || 0;
    
    // Reset and animate
    setAnimatedOverallScore(0);
    setAnimatedOverallAccuracy(0);
    
    const duration = 1500; // 1.5 seconds
    const steps = 30;
    const stepDuration = duration / steps;
    
    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      
      setAnimatedOverallScore(Math.round(targetScore * progress));
      setAnimatedOverallAccuracy(Math.round(targetAccuracy * progress));
      
      if (currentStep >= steps) {
        clearInterval(timer);
      }
    }, stepDuration);
    
    return () => clearInterval(timer);
  }, [performanceData.diagnostic]);
  
  // Trigger spider chart animation on view toggle
  useEffect(() => {
    setAnimateSpiderChart(false);
    const timer = setTimeout(() => setAnimateSpiderChart(true), 50);
    return () => clearTimeout(timer);
  }, [sectionView]);
  
  // Animate section scores when view changes or data loads
  useEffect(() => {
    if (!performanceData.diagnostic?.sectionBreakdown) return;
    
    const newScores: Record<string, number> = {};
    const duration = 1200; // Match the growToRight animation duration
    const steps = 24;
    const stepDuration = duration / steps;
    
    performanceData.diagnostic.sectionBreakdown.forEach((section, index) => {
      const targetValue = sectionView === 'score' ? section.score : section.accuracy;
      const delay = index * 150; // Match the animation delay
      
      // Start at 0
      newScores[section.sectionName] = 0;
      
      setTimeout(() => {
        let currentStep = 0;
        const timer = setInterval(() => {
          currentStep++;
          const progress = currentStep / steps;
          newScores[section.sectionName] = Math.round(targetValue * progress);
          setAnimatedSectionScores({...newScores});
          
          if (currentStep >= steps) {
            clearInterval(timer);
          }
        }, stepDuration);
      }, delay);
    });
    
    setAnimatedSectionScores(newScores);
  }, [performanceData.diagnostic, sectionView]);
  
  // Animate sub-skill scores when view changes or data loads
  useEffect(() => {
    if (!performanceData.diagnostic?.allSubSkills) return;
    
    const newScores: Record<string, number> = {};
    const duration = 1200; // Match the growToRight animation duration
    const steps = 24;
    const stepDuration = duration / steps;
    
    performanceData.diagnostic.allSubSkills.forEach((skill, index) => {
      const targetValue = subSkillView === 'score' 
        ? (skill.questionsTotal > 0 ? Math.round((skill.questionsCorrect / skill.questionsTotal) * 100) : 0)
        : (skill.questionsAttempted > 0 ? Math.round((skill.questionsCorrect / skill.questionsAttempted) * 100) : 0);
      const delay = index * 120; // Match the animation delay
      
      // Start at 0
      newScores[skill.subSkill] = 0;
      
      setTimeout(() => {
        let currentStep = 0;
        const timer = setInterval(() => {
          currentStep++;
          const progress = currentStep / steps;
          newScores[skill.subSkill] = Math.round(targetValue * progress);
          setAnimatedSubSkillScores({...newScores});
          
          if (currentStep >= steps) {
            clearInterval(timer);
          }
        }, stepDuration);
      }, delay);
    });
    
    setAnimatedSubSkillScores(newScores);
  }, [performanceData.diagnostic, subSkillView]);
  
  // Animate practice test scores
  useEffect(() => {
    if (!performanceData.practice?.tests) return;
    
    const selectedTest = performanceData.practice.tests.find(t => t.testNumber === selectedPracticeTest);
    if (!selectedTest || selectedTest.status !== 'completed') return;
    
    const targetScore = selectedTest.score || 0;
    const targetAccuracy = selectedTest.score || 0; // Will calculate proper accuracy later
    
    // Reset and animate
    setAnimatedPracticeScore(0);
    setAnimatedPracticeAccuracy(0);
    
    const duration = 1500; // 1.5 seconds
    const steps = 30;
    const stepDuration = duration / steps;
    
    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      
      setAnimatedPracticeScore(Math.round(targetScore * progress));
      setAnimatedPracticeAccuracy(Math.round(targetAccuracy * progress));
      
      if (currentStep >= steps) {
        clearInterval(timer);
      }
    }, stepDuration);
    
    return () => clearInterval(timer);
  }, [performanceData.practice, selectedPracticeTest]);

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
        <div className="flex justify-center mb-8">
          <div className="flex space-x-2 bg-white p-2 rounded-2xl shadow-lg border border-slate-200">
            {[
              { id: 'overview', label: 'Overall', icon: <BarChart3 size={18} /> },
              { id: 'diagnostic', label: 'Diagnostic', icon: <Activity size={18} /> },
              { id: 'practice', label: 'Practice Tests', icon: <FileText size={18} /> },
              { id: 'drills', label: 'Drills', icon: <Target size={18} /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-8 py-4 rounded-xl font-bold transition-all duration-200 ease-out transform hover:scale-105 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-2">
                  {tab.icon}
                  <span>{tab.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8">
          {/* Overall Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {(() => {
                const hasOverallData = performanceData.overall?.questionsCompleted > 0;
                const hasDiagnosticData = performanceData.diagnostic;
                const hasPracticeData = performanceData.practice?.tests?.some(test => test.status === 'completed');
                const hasDrillData = performanceData.drills?.subSkillBreakdown?.some(section => 
                  section.subSkills.some(skill => skill.questionsCompleted > 0)
                );
                
                const hasAnyData = hasOverallData || hasDiagnosticData || hasPracticeData || hasDrillData;
                
                return !hasAnyData ? (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-24 h-24 bg-teal-50 rounded-full mb-6">
                    <BarChart3 className="h-12 w-12 text-teal-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">Start Your Learning Journey</h3>
                  <p className="text-slate-600 mb-8 max-w-md mx-auto">Complete some activities to see your overall performance insights. Your progress across all test modes will be summarized here.</p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 max-w-md mx-auto">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-800">
                        <div className="font-semibold mb-1">To see overall insights:</div>
                        <div>• Complete diagnostic sections, OR</div>
                        <div>• Complete a practice test, OR</div>
                        <div>• Answer drill questions</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 justify-center">
                    <button className="px-6 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-all duration-200 font-semibold">
                      Start Diagnostic
                    </button>
                    <button className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all duration-200 font-semibold">
                      Practice Skills
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">Overall Performance</h2>
              
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative group">
                  <div className="text-center">
                    <div className="text-sm font-medium text-slate-600 mb-2 flex items-center justify-center gap-1">
                      Questions Completed
                      <div className="relative inline-block">
                        <Info size={14} className="text-slate-400 cursor-help" />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                          <div className="font-semibold mb-1">Questions Completed</div>
                          <div>Total number of questions you have completed across all tests and drills.</div>
                          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-slate-900"></div>
                        </div>
                      </div>
                    </div>
                    <div className="text-4xl font-bold text-slate-900 mb-2">{performanceData.overall?.questionsCompleted || 0}</div>
                  </div>
                </div>
                
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative group">
                  <div className="text-center">
                    <div className="text-sm font-medium text-slate-600 mb-2 flex items-center justify-center gap-1">
                      Overall Accuracy
                      <div className="relative inline-block">
                        <Info size={14} className="text-slate-400 cursor-help" />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                          <div className="font-semibold mb-1">Overall Accuracy</div>
                          <div>Average percentage of questions answered correctly across all tests and drills.</div>
                          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-slate-900"></div>
                        </div>
                      </div>
                    </div>
                    <div className="text-4xl font-bold text-slate-900 mb-2">{performanceData.overall?.overallAccuracy || 0}%</div>
                  </div>
                </div>
                
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative group">
                  <div className="text-center">
                    <div className="text-sm font-medium text-slate-600 mb-2 flex items-center justify-center gap-1">
                      Average Test Score
                      <div className="relative inline-block">
                        <Info size={14} className="text-slate-400 cursor-help" />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                          <div className="font-semibold mb-1">Average Test Score</div>
                          <div>Average score across diagnostic and practice tests.</div>
                          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-slate-900"></div>
                        </div>
                      </div>
                    </div>
                    <div className="text-4xl font-bold text-slate-900 mb-2">{performanceData.overall?.averageTestScore || '-'}%</div>
                  </div>
                </div>
                
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative group">
                  <div className="text-center">
                    <div className="text-sm font-medium text-slate-600 mb-2 flex items-center justify-center gap-1">
                      Study Time
                      <div className="relative inline-block">
                        <Info size={14} className="text-slate-400 cursor-help" />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                          <div className="font-semibold mb-1">Study Time</div>
                          <div>Total time spent studying across all activities.</div>
                          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-slate-900"></div>
                        </div>
                      </div>
                    </div>
                    <div className="text-4xl font-bold text-slate-900 mb-2">{performanceData.overall?.studyTimeHours || 0}h</div>
                  </div>
                </div>
              </div>

              {/* Strengths and Weaknesses */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Top 5 Strengths */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      Top 5 Strengths
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {(performanceData.diagnostic?.strengths || []).slice(0, 5).map((item, index) => (
                        <div key={index} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-b-0">
                          <div className="flex-1">
                            <h5 className="text-base font-medium text-slate-900 mb-1">{item.subSkill}</h5>
                            <p className="text-sm text-slate-600">{item.questionsAttempted} questions</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-lg font-semibold text-green-600">{Math.round(item.accuracy)}%</div>
                            <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div 
                                className="h-full rounded-full bg-green-500"
                                style={{ width: `${item.accuracy}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Top 5 Weaknesses */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-red-600" />
                      Top 5 Areas for Improvement
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {(performanceData.diagnostic?.weaknesses || []).slice(0, 5).map((item, index) => (
                        <div key={index} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-b-0">
                          <div className="flex-1">
                            <h5 className="text-base font-medium text-slate-900 mb-1">{item.subSkill}</h5>
                            <p className="text-sm text-slate-600">{item.questionsAttempted} questions</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className={`text-lg font-semibold ${
                              item.accuracy >= 60 ? 'text-orange-600' : 'text-red-600'
                            }`}>{Math.round(item.accuracy)}%</div>
                            <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  item.accuracy >= 60 ? 'bg-orange-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${item.accuracy}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      {(!performanceData.diagnostic?.weaknesses || performanceData.diagnostic.weaknesses.length === 0) && (
                        <div className="text-center py-8 text-slate-500">
                          <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          Complete more questions to see areas for improvement
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Diagnostic Tab */}
          {activeTab === 'diagnostic' && (
            <div className="space-y-8">
              {!performanceData.diagnostic ? (
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
                  {/* Summary Cards */}
                  <div className="grid grid-cols-3 gap-6">
                    {/* Overall Score */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative group">
                      <div className="text-center">
                        <div className="text-base font-medium text-slate-600 mb-2 flex items-center justify-center gap-1">
                          Overall Score
                          <div className="relative inline-block">
                            <Info size={14} className="text-slate-400 cursor-help" />
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                              <div className="font-semibold mb-1">Score</div>
                              <div>Measures your performance against the total number of questions in the test, including unanswered questions.</div>
                              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-slate-900"></div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-center gap-4">
                          <div className="text-3xl font-bold text-slate-900">
                            {performanceData.diagnostic.totalQuestionsCorrect}
                            <span className="text-slate-600">/{performanceData.diagnostic.totalQuestions}</span>
                          </div>
                          <div className="h-10 w-px bg-slate-200"></div>
                          <div className={`text-3xl font-bold ${
                            performanceData.diagnostic.overallScore >= 80 ? 'text-green-600' : 
                            performanceData.diagnostic.overallScore >= 60 ? 'text-orange-600' : 
                            'text-red-600'
                          }`}>{animatedOverallScore}%</div>
                        </div>
                      </div>
                    </div>

                    {/* Simple Average Score */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative group">
                      <div className="text-center">
                        <div className="text-base font-medium text-slate-600 mb-2 flex items-center justify-center gap-1">
                          Average Score
                          <div className="relative inline-block">
                            <Info size={14} className="text-slate-400 cursor-help" />
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                              <div className="font-semibold mb-1">Average Score</div>
                              <div>Simple average percentage across all test sections.</div>
                              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-slate-900"></div>
                            </div>
                          </div>
                        </div>
                        <div className={`text-3xl font-bold ${
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
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative group">
                      <div className="text-center">
                        <div className="text-base font-medium text-slate-600 mb-2 flex items-center justify-center gap-1">
                          Overall Accuracy
                          <div className="relative inline-block">
                            <Info size={14} className="text-slate-400 cursor-help" />
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                              <div className="font-semibold mb-1">Accuracy</div>
                              <div>Shows how well you performed on questions you actually attempted, excluding skipped or timed-out questions.</div>
                              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-slate-900"></div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-center gap-4">
                          <div className="text-3xl font-bold text-slate-900">
                            {performanceData.diagnostic.totalQuestionsCorrect}
                            <span className="text-slate-600">/{performanceData.diagnostic.totalQuestionsAttempted}</span>
                          </div>
                          <div className="h-10 w-px bg-slate-200"></div>
                          <div className={`text-3xl font-bold ${
                            performanceData.diagnostic.overallAccuracy >= 80 ? 'text-green-600' : 
                            performanceData.diagnostic.overallAccuracy >= 60 ? 'text-orange-600' : 
                            'text-red-600'
                          }`}>{animatedOverallAccuracy}%</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section Results */}
                  <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
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
                            Score
                          </button>
                          <button
                            onClick={() => setSectionView('accuracy')}
                            className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                              sectionView === 'accuracy' 
                                ? 'bg-white text-slate-900 shadow-sm' 
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Accuracy
                          </button>
                        </div>
                        <div className="relative group">
                          <Info size={16} className="text-slate-400 cursor-help" />
                          <div className="absolute top-full right-0 mt-2 w-72 p-4 bg-slate-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                            <div className="space-y-3">
                              <div>
                                <div className="font-semibold text-teal-400 mb-1">Score View</div>
                                <div className="text-xs">Shows correct answers out of total questions (e.g., 16/20 = 80%)</div>
                              </div>
                              <div>
                                <div className="font-semibold text-orange-400 mb-1">Accuracy View</div>
                                <div className="text-xs">Shows correct answers out of questions attempted (e.g., 16/18 = 89%)</div>
                              </div>
                            </div>
                            <div className="absolute top-0 right-4 transform -translate-y-1/2 rotate-45 w-2 h-2 bg-slate-900"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex">
                      {/* Spider Chart - Left Side */}
                      <div className="w-1/2 p-6 flex items-center justify-center border-r border-slate-200">
                        <SpiderChart 
                          data={performanceData.diagnostic.sectionBreakdown.map(section => ({
                            label: section.sectionName.replace('General Ability - ', 'GA - ').replace(' Reasoning', '\nReasoning'),
                            value: sectionView === 'score' ? section.score : section.accuracy,
                            maxValue: 100
                          }))}
                          size={320}
                          animate={animateSpiderChart}
                        />
                      </div>
                      
                      {/* Section List - Right Side */}
                      <div className="w-1/2 divide-y divide-slate-100">
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
                                    className="text-xs text-slate-600 fadeIn"
                                    style={{ animationDelay: `${index * 150 + 600}ms` }}
                                  >
                                    {sectionView === 'score' 
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
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Top 5 Strengths */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                      <div className="px-6 py-4 border-b border-slate-200">
                        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          Top 5 Sub-Skills
                        </h3>
                      </div>
                      <div className="p-6">
                        <div className="space-y-4">
                          {(performanceData.diagnostic?.strengths || []).slice(0, 5).map((item, index) => (
                            <div key={index} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-b-0">
                              <div className="flex-1">
                                <h5 className="text-base font-medium text-slate-900 mb-1">{item.subSkill}</h5>
                                <p className="text-sm text-slate-600">{item.sectionName}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-lg font-semibold text-green-600">{Math.round(item.accuracy)}%</div>
                                <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                                  <div 
                                    className="h-full rounded-full bg-green-500"
                                    style={{ width: `${item.accuracy}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                          {(!performanceData.diagnostic?.strengths || performanceData.diagnostic.strengths.length === 0) && (
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
                        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                          <XCircle className="w-5 h-5 text-red-600" />
                          Bottom 5 Sub-Skills
                        </h3>
                      </div>
                      <div className="p-6">
                        <div className="space-y-4">
                          {(performanceData.diagnostic?.weaknesses || []).slice(0, 5).map((item, index) => (
                            <div key={index} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-b-0">
                              <div className="flex-1">
                                <h5 className="text-base font-medium text-slate-900 mb-1">{item.subSkill}</h5>
                                <p className="text-sm text-slate-600">{item.sectionName}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className={`text-lg font-semibold ${
                                  item.accuracy >= 60 ? 'text-orange-600' : 'text-red-600'
                                }`}>{Math.round(item.accuracy)}%</div>
                                <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${
                                      item.accuracy >= 60 ? 'bg-orange-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${item.accuracy}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                          {(!performanceData.diagnostic?.weaknesses || performanceData.diagnostic.weaknesses.length === 0) && (
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
                            Score
                          </button>
                          <button
                            onClick={() => setSubSkillView('accuracy')}
                            className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                              subSkillView === 'accuracy' 
                                ? 'bg-white text-slate-900 shadow-sm' 
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Accuracy
                          </button>
                        </div>
                      </div>
                      
                      {/* Filter Tabs */}
                      <div className="flex flex-wrap gap-2">
                        {[
                          { id: 'all', label: 'All Skills' },
                          { id: 'reading', label: 'Reading Reasoning' },
                          { id: 'mathematical', label: 'Mathematics Reasoning' },
                          { id: 'verbal', label: 'General Ability - Verbal' },
                          { id: 'quantitative', label: 'General Ability - Quantitative' },
                          { id: 'writing', label: 'Writing' }
                        ].map((filter) => (
                          <button
                            key={filter.id}
                            onClick={() => setPracticeFilter(filter.id)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
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
                          
                          // Map section names to filter categories
                          let category = 'all';
                          if (sectionName === 'Reading Reasoning') {
                            category = 'reading';
                          } else if (sectionName === 'Mathematics Reasoning') {
                            category = 'mathematical';
                          } else if (sectionName === 'General Ability - Verbal') {
                            category = 'verbal';
                          } else if (sectionName === 'General Ability - Quantitative') {
                            category = 'quantitative';
                          } else if (sectionName === 'Writing') {
                            category = 'writing';
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
                          .filter(item => practiceFilter === 'all' || item.category === practiceFilter)
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
                                      : <span>{skill.score}/{skill.answered}</span>
                                    }
                                  </div>
                                </div>
                              </div>
                            </div>
                          ));
                      })()}
                      {(() => {
                        console.log('🔍 INSIGHTS: Diagnostic data debug:', {
                          strengthsLength: performanceData.diagnostic?.strengths?.length || 0,
                          weaknessesLength: performanceData.diagnostic?.weaknesses?.length || 0,
                          strengths: performanceData.diagnostic?.strengths,
                          weaknesses: performanceData.diagnostic?.weaknesses,
                          allDiagnosticData: performanceData.diagnostic
                        });
                        
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
              {/* Check if user has completed at least one practice test */}
              {!performanceData.practice?.tests?.some(test => test.status === 'completed') ? (
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
                        ? 'bg-gradient-to-br from-teal-500 to-teal-600 text-white border-transparent shadow-lg scale-105 transform'
                        : test.status === 'completed'
                        ? 'bg-white border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-105 transform'
                        : 'bg-white border-slate-200 shadow-sm opacity-60'
                    }`}
                  >
                    <div className="text-center">
                      <h3 className={`text-lg font-bold mb-2 ${
                        selectedPracticeTest === test.testNumber ? 'text-white' : 'text-slate-900'
                      }`}>
                        Test {test.testNumber}
                      </h3>
                      {test.status === 'completed' && test.score !== null ? (
                        <>
                          <div className={`text-2xl font-bold mb-1 ${
                            selectedPracticeTest === test.testNumber 
                              ? 'text-white' 
                              : test.score >= 80 ? 'text-green-600' : test.score >= 60 ? 'text-orange-600' : 'text-red-600'
                          }`}>
                            {test.score}%
                          </div>
                          <p className={`text-sm font-medium ${
                            selectedPracticeTest === test.testNumber ? 'text-white/90' : 'text-slate-600'
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
                console.log('🔍 All practice tests:', performanceData.practice?.tests);
                console.log('🔍 Looking for test number:', selectedPracticeTest);
                
                // First try to find completed test, then fall back to any test with that number
                let selectedTest = performanceData.practice?.tests?.find(t => t.testNumber === selectedPracticeTest && t.status === 'completed');
                
                if (!selectedTest) {
                  // If no completed test found, try to find any test with that number
                  selectedTest = performanceData.practice?.tests?.find(t => t.testNumber === selectedPracticeTest);
                  console.log('🔍 Fallback: found test with any status:', selectedTest);
                }
                
                console.log('🔍 Final selected test:', selectedTest);
                
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
                const totalQuestions = selectedTest.totalQuestions || 0;
                const questionsAttempted = selectedTest.questionsAttempted || 0;
                const questionsCorrect = selectedTest.questionsCorrect || 0;
                const overallScore = selectedTest.score || 0;
                const overallAccuracy = questionsAttempted > 0 
                  ? Math.round((questionsCorrect / questionsAttempted) * 100) 
                  : 0;
                
                console.log('🔍 Selected test details:', {
                  testNumber: selectedTest.testNumber,
                  score: selectedTest.score,
                  totalQuestions,
                  questionsAttempted,
                  questionsCorrect,
                  overallScore,
                  overallAccuracy,
                  hasRealData: selectedTest.totalQuestions ? 'Yes' : 'No',
                  rawTest: selectedTest
                });
                
                return (
                  <div className="space-y-8">
                    {/* Overall Performance Cards */}
                    <div className="grid grid-cols-3 gap-6">
                      {/* Overall Score */}
                      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative group">
                        <div className="text-center">
                          <div className="text-base font-medium text-slate-600 mb-2 flex items-center justify-center gap-1">
                            Overall Score
                            <div className="relative inline-block">
                              <Info size={14} className="text-slate-400 cursor-help" />
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                                <div className="font-semibold mb-1">Score</div>
                                <div>Measures your performance against the total number of questions in the test, including unanswered questions.</div>
                                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-slate-900"></div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-center gap-4">
                            <div className="text-3xl font-bold text-slate-900">
                              {questionsCorrect}
                              <span className="text-slate-600">/{totalQuestions || questionsAttempted}</span>
                            </div>
                            <div className="h-10 w-px bg-slate-200"></div>
                            <div className={`text-3xl font-bold ${
                              overallScore >= 80 ? 'text-green-600' : 
                              overallScore >= 60 ? 'text-orange-600' : 
                              'text-red-600'
                            }`}>{overallScore}%</div>
                          </div>
                        </div>
                      </div>

                      {/* Average Score */}
                      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative group">
                        <div className="text-center">
                          <div className="text-base font-medium text-slate-600 mb-2 flex items-center justify-center gap-1">
                            Average Score
                            <div className="relative inline-block">
                              <Info size={14} className="text-slate-400 cursor-help" />
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                                <div className="font-semibold mb-1">Average Score</div>
                                <div>Simple average percentage across all test sections.</div>
                                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-slate-900"></div>
                              </div>
                            </div>
                          </div>
                          <div className={`text-3xl font-bold ${
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
                      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative group">
                        <div className="text-center">
                          <div className="text-base font-medium text-slate-600 mb-2 flex items-center justify-center gap-1">
                            Overall Accuracy
                            <div className="relative inline-block">
                              <Info size={14} className="text-slate-400 cursor-help" />
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                                <div className="font-semibold mb-1">Accuracy</div>
                                <div>Shows how well you performed on questions you actually attempted, excluding skipped or timed-out questions.</div>
                                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-slate-900"></div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-center gap-4">
                            <div className="text-3xl font-bold text-slate-900">
                              {questionsCorrect}
                              <span className="text-slate-600">/{questionsAttempted}</span>
                            </div>
                            <div className="h-10 w-px bg-slate-200"></div>
                            <div className={`text-3xl font-bold ${
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
                            Score
                          </button>
                          <button
                            onClick={() => setSectionView('accuracy')}
                            className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                              sectionView === 'accuracy' 
                                ? 'bg-white text-slate-900 shadow-sm' 
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Accuracy
                          </button>
                        </div>
                        <div className="relative group">
                          <Info size={16} className="text-slate-400 cursor-help" />
                          <div className="absolute top-full right-0 mt-2 w-72 p-4 bg-slate-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                            <div className="space-y-3">
                              <div>
                                <div className="font-semibold text-teal-400 mb-1">Score View</div>
                                <div className="text-xs">Shows correct answers out of total questions (e.g., 16/20 = 80%)</div>
                              </div>
                              <div>
                                <div className="font-semibold text-orange-400 mb-1">Accuracy View</div>
                                <div className="text-xs">Shows correct answers out of questions attempted (e.g., 16/18 = 89%)</div>
                              </div>
                            </div>
                            <div className="absolute top-0 right-4 transform -translate-y-1/2 rotate-45 w-2 h-2 bg-slate-900"></div>
                          </div>
                        </div>
                      </div>
                    </div>
              
                    <div className="flex">
                      {/* Spider Chart - Left Side */}
                      <div className="w-1/2 p-6 flex items-center justify-center border-r border-slate-200">
                        <SpiderChart 
                          data={(selectedTest.sectionBreakdown || []).map((section) => ({
                            label: section.sectionName.replace('General Ability - ', 'GA - ').replace(' Reasoning', '\nReasoning'),
                            value: sectionView === 'score' ? section.score : section.accuracy,
                            maxValue: 100
                          }))}
                          size={320}
                          animate={animateSpiderChart}
                        />
                      </div>
                      
                      {/* Section List - Right Side */}
                      <div className="w-1/2 divide-y divide-slate-100">
                        {selectedTest.sectionBreakdown && selectedTest.sectionBreakdown.length > 0 ? (
                          selectedTest.sectionBreakdown.map((section, index) => {
                            const displayScore = section.score;
                            const displayAccuracy = section.accuracy;
                            
                            return (
                              <div key={index} className="px-4 py-3 hover:bg-slate-50 transition-colors">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <h4 className="font-medium text-slate-900 text-sm">{section.sectionName}</h4>
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
                                      className="text-xs text-slate-600 fadeIn"
                                      style={{ animationDelay: `${index * 150 + 600}ms` }}
                                    >
                                      {sectionView === 'score' 
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
                        <h3 className="text-lg font-semibold text-slate-900">Sub-Skills Performance</h3>
                        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                          <button
                            onClick={() => setSubSkillView('score')}
                            className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                              subSkillView === 'score' 
                                ? 'bg-white text-slate-900 shadow-sm' 
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Score
                          </button>
                          <button
                            onClick={() => setSubSkillView('accuracy')}
                            className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                              subSkillView === 'accuracy' 
                                ? 'bg-white text-slate-900 shadow-sm' 
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Accuracy
                          </button>
                        </div>
                      </div>
                      
                      {/* Filter Tabs */}
                      <div className="flex flex-wrap gap-2">
                        {[
                          { id: 'all', label: 'All Skills' },
                          { id: 'reading', label: 'Reading Reasoning' },
                          { id: 'mathematical', label: 'Mathematics Reasoning' },
                          { id: 'verbal', label: 'General Ability - Verbal' },
                          { id: 'quantitative', label: 'General Ability - Quantitative' },
                          { id: 'writing', label: 'Writing' }
                        ].map((filter) => (
                          <button
                            key={filter.id}
                            onClick={() => setPracticeFilter(filter.id)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
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
                          if (practiceFilter === 'all') return true;
                          if (practiceFilter === 'reading') return subSkill.sectionName.toLowerCase().includes('reading');
                          if (practiceFilter === 'mathematical') return subSkill.sectionName.toLowerCase().includes('mathematics');
                          if (practiceFilter === 'verbal') return subSkill.sectionName.toLowerCase().includes('verbal');
                          if (practiceFilter === 'quantitative') return subSkill.sectionName.toLowerCase().includes('quantitative');
                          if (practiceFilter === 'writing') return subSkill.sectionName.toLowerCase().includes('writing');
                          return true;
                        })
                        .map((subSkill, index) => {
                          const displayScore = subSkill.score;
                          const displayAccuracy = subSkill.accuracy;
                          
                          return (
                            <div key={index} className="px-4 py-3 hover:bg-slate-50 transition-colors">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <h4 className="font-medium text-slate-900 text-sm">{subSkill.subSkillName}</h4>
                                  <p className="text-xs text-slate-500 mt-1">{subSkill.sectionName}</p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <div className={`text-base font-semibold ${
                                    subSkillView === 'score'
                                      ? (displayScore >= 80 ? 'text-green-600' : displayScore >= 60 ? 'text-orange-600' : 'text-red-600')
                                      : (displayAccuracy >= 80 ? 'text-green-600' : displayAccuracy >= 60 ? 'text-orange-600' : 'text-red-600')
                                  }`}>
                                    {subSkillView === 'score' ? displayScore : displayAccuracy}%
                                  </div>
                                  <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                    <div 
                                      key={`${subSkill.subSkillName}-${subSkillView}`}
                                      className={`h-full rounded-full growToRight ${
                                        subSkillView === 'score'
                                          ? (displayScore >= 80 ? 'bg-green-500' : displayScore >= 60 ? 'bg-orange-500' : 'bg-red-500')
                                          : (displayAccuracy >= 80 ? 'bg-green-500' : displayAccuracy >= 60 ? 'bg-orange-500' : 'bg-red-500')
                                      }`}
                                      style={{ 
                                        width: `${subSkillView === 'score' ? displayScore : displayAccuracy}%`,
                                        animationDelay: `${index * 100}ms`
                                      }}
                                    />
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    {subSkillView === 'score' 
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
              {!performanceData.drills?.subSkillBreakdown?.some(section =>
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
                  <div className="grid grid-cols-2 gap-6">
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
                          (performanceData.drills?.overallAccuracy || 0) >= 80 ? 'text-green-600' : 
                          (performanceData.drills?.overallAccuracy || 0) >= 60 ? 'text-orange-600' : 
                          'text-red-600'
                        }`}>{performanceData.drills?.overallAccuracy || 0}%</div>
                      </div>
                    </div>
                  </div>

                  {/* Sub-Skills Performance */}
                  <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200">
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-slate-900">Sub-Skills Performance</h3>
                      </div>
                      
                      {/* Filter Tabs */}
                      <div className="flex flex-wrap gap-2">
                        {[
                          { id: 'all', label: 'All Skills' },
                          { id: 'reading', label: 'Reading Reasoning' },
                          { id: 'mathematical', label: 'Mathematics Reasoning' },
                          { id: 'verbal', label: 'General Ability - Verbal' },
                          { id: 'quantitative', label: 'General Ability - Quantitative' },
                          { id: 'writing', label: 'Writing' }
                        ].map((filter) => (
                          <button
                            key={filter.id}
                            onClick={() => setDrillFilter(filter.id)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
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
                            if (drillFilter === 'reading') return subSkill.sectionName.toLowerCase().includes('reading');
                            if (drillFilter === 'mathematical') return subSkill.sectionName.toLowerCase().includes('mathematics');
                            if (drillFilter === 'verbal') return subSkill.sectionName.toLowerCase().includes('verbal');
                            if (drillFilter === 'quantitative') return subSkill.sectionName.toLowerCase().includes('quantitative');
                            if (drillFilter === 'writing') return subSkill.sectionName.toLowerCase().includes('writing');
                            return true;
                          });

                        return allSubSkills.map((subSkill, index) => {
                          return (
                            <div key={index} className="px-4 py-3 hover:bg-slate-50 transition-colors">
                              <div className="flex items-center gap-6">
                                {/* Left Section: Sub-skill Info */}
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-slate-900 text-sm">{subSkill.subSkillName}</h4>
                                  <p className="text-xs text-slate-500 mt-1">{subSkill.sectionName}</p>
                                </div>

                                {/* Overall Stats */}
                                <div className="flex items-center gap-3 flex-shrink-0">
                                  <div className={`text-base font-semibold ${
                                    subSkill.accuracy >= 80 ? 'text-green-600' : 
                                    subSkill.accuracy >= 60 ? 'text-orange-600' : 
                                    'text-red-600'
                                  }`}>
                                    {subSkill.accuracy}%
                                  </div>
                                  
                                  <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                    <div 
                                      key={`${subSkill.subSkillName}-accuracy`}
                                      className={`h-full rounded-full growToRight ${
                                        subSkill.accuracy >= 80 ? 'bg-green-500' : 
                                        subSkill.accuracy >= 60 ? 'bg-orange-500' : 
                                        'bg-red-500'
                                      }`}
                                      style={{ 
                                        width: `${subSkill.accuracy}%`,
                                        animationDelay: `${index * 100}ms`
                                      }}
                                    />
                                  </div>
                                  
                                  <div className="text-xs text-slate-500 whitespace-nowrap">
                                    {subSkill.questionsCompleted} questions
                                  </div>
                                </div>

                                {/* Vertical Separator */}
                                <div className="w-px h-8 bg-slate-200 flex-shrink-0"></div>

                                {/* Right Section: Difficulty Breakdown */}
                                <div className="grid grid-cols-3 gap-8 flex-shrink-0">
                                  {/* Easy (Level 1) */}
                                  <div className="text-center">
                                    <div className="text-xs text-slate-500 mb-2">Easy</div>
                                    <div className="text-sm font-medium text-slate-700">
                                      {subSkill.difficulty1Correct || 0}/{subSkill.difficulty1Questions || 0}
                                    </div>
                                  </div>

                                  {/* Medium (Level 2) */}
                                  <div className="text-center">
                                    <div className="text-xs text-slate-500 mb-2">Medium</div>
                                    <div className="text-sm font-medium text-slate-700">
                                      {subSkill.difficulty2Correct || 0}/{subSkill.difficulty2Questions || 0}
                                    </div>
                                  </div>

                                  {/* Hard (Level 3) */}
                                  <div className="text-center">
                                    <div className="text-xs text-slate-500 mb-2">Hard</div>
                                    <div className="text-sm font-medium text-slate-700">
                                      {subSkill.difficulty3Correct || 0}/{subSkill.difficulty3Questions || 0}
                                    </div>
                                  </div>
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
                          if (drillFilter === 'reading') return subSkill.sectionName.toLowerCase().includes('reading');
                          if (drillFilter === 'mathematical') return subSkill.sectionName.toLowerCase().includes('mathematics');
                          if (drillFilter === 'verbal') return subSkill.sectionName.toLowerCase().includes('verbal');
                          if (drillFilter === 'quantitative') return subSkill.sectionName.toLowerCase().includes('quantitative');
                          if (drillFilter === 'writing') return subSkill.sectionName.toLowerCase().includes('writing');
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
