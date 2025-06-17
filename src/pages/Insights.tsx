import React, { useState, useEffect } from 'react';
import { BarChart3, Target, BookOpen, Activity, AlertCircle, TrendingUp, TrendingDown, Clock, Award, CheckCircle, XCircle, Flag, Star, Info } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useProduct } from '@/context/ProductContext';
import { 
  AnalyticsService, 
  type OverallPerformance, 
  type DiagnosticResults, 
  type PracticeTestResults, 
  type DrillResults 
} from '@/services/analyticsService';
import { UNIFIED_SUB_SKILLS } from '@/data/curriculumData';

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
            <div className="text-xs font-medium text-slate-700 leading-tight">
              {item.label.split('\n').map((line, idx) => (
                <div key={idx}>{line}</div>
              ))}
            </div>
            <div className={`text-sm font-bold mt-1 ${
              item.value >= 80 ? 'text-green-600' : 
              item.value >= 60 ? 'text-orange-600' : 
              'text-red-600'
            }`}>
              {item.value}%
            </div>
          </div>
        );
      })}
      
      <style jsx>{`
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
      `}</style>
    </div>
  );
};

const PerformanceDashboard = () => {
  const { user } = useAuth();
  const { selectedProduct } = useProduct();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPracticeTest, setSelectedPracticeTest] = useState(2);
  const [practiceFilter, setPracticeFilter] = useState('all');
  const [drillFilter, setDrillFilter] = useState('all');
  const [sectionView, setSectionView] = useState<'score' | 'accuracy'>('score');
  const [subSkillView, setSubSkillView] = useState<'score' | 'accuracy'>('score');
  const [isLoading, setIsLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    overall: null,
    diagnostic: null,
    practice: null,
    drills: null,
  });

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
      } catch (error) {
        console.error('❌ Error loading performance data:', error);
        setDataError('Failed to load performance data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadPerformanceData();
  }, [user, selectedProduct]);

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
          <p className="text-slate-600 text-lg font-medium">{selectedProduct}</p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-2 bg-white p-2 rounded-2xl shadow-lg border border-slate-200">
            {[
              { id: 'overview', label: 'Overall', icon: <BarChart3 size={18} /> },
              { id: 'diagnostic', label: 'Diagnostic', icon: <Target size={18} /> },
              { id: 'practice', label: 'Practice Tests', icon: <BookOpen size={18} /> },
              { id: 'drills', label: 'Drills', icon: <Activity size={18} /> }
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
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Overall Performance</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="p-6 bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl border border-teal-200">
                  <h3 className="text-sm font-semibold text-teal-900 mb-2">Questions Completed</h3>
                  <div className="text-3xl font-black text-teal-600">{performanceData.overall?.questionsCompleted || 0}</div>
                  <p className="text-xs text-teal-700">of {performanceData.overall?.questionsAttempted || 0} attempted</p>
                </div>
                
                <div className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200">
                  <h3 className="text-sm font-semibold text-orange-900 mb-2">Overall Accuracy</h3>
                  <div className="text-3xl font-black text-orange-600">{performanceData.overall?.overallAccuracy || 0}%</div>
                  <p className="text-xs text-orange-700">{performanceData.overall?.questionsCorrect || 0} correct answers</p>
                </div>
                
                <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                  <h3 className="text-sm font-semibold text-blue-900 mb-2">Average Test Score</h3>
                  <div className="text-3xl font-black text-blue-600">
                    {performanceData.overall?.averageTestScore !== null ? `${performanceData.overall?.averageTestScore}%` : '-'}
                  </div>
                  <p className="text-xs text-blue-700">diagnostic + practice tests</p>
                </div>
                
                <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                  <h3 className="text-sm font-semibold text-purple-900 mb-2">Study Time</h3>
                  <div className="text-3xl font-black text-purple-600">{formatStudyTime(performanceData.overall?.studyTimeHours || 0)}</div>
                  <p className="text-xs text-purple-700">total time spent</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 bg-slate-50 rounded-xl">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Test Completion Status</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-700">Diagnostic Test</span>
                      {getStatusBadge(performanceData.overall?.diagnosticCompleted ? 'completed' : 'not-started')}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-700">Practice Tests</span>
                      <span className="text-slate-600">{performanceData.overall?.practiceTestsCompleted?.length || 0}/5 completed</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 bg-slate-50 rounded-xl">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h3>
                  <div className="space-y-2">
                    <button className="w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
                      Continue Learning
                    </button>
                    <button className="w-full px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
                      Download Report
                    </button>
                  </div>
                </div>
              </div>
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
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">No Diagnostic Results</h3>
                  <p className="text-slate-600 mb-8 max-w-md mx-auto">Complete your diagnostic test to see detailed performance insights and identify your strengths and areas for improvement.</p>
                  <button className="px-8 py-4 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                    Start Diagnostic Test
                  </button>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 gap-6">
                    {/* Overall Score */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative group">
                      <div className="text-center">
                        <div className="text-sm font-medium text-slate-600 mb-2 flex items-center justify-center gap-1">
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
                        <div className="text-4xl font-bold text-slate-900 mb-2">78<span className="text-2xl text-slate-600">/100</span></div>
                        <div className={`text-lg font-semibold ${
                          78 >= 80 ? 'text-green-600' : 
                          78 >= 60 ? 'text-orange-600' : 
                          'text-red-600'
                        }`}>78%</div>
                      </div>
                    </div>

                    {/* Overall Accuracy */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative group">
                      <div className="text-center">
                        <div className="text-sm font-medium text-slate-600 mb-2 flex items-center justify-center gap-1">
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
                        <div className="text-4xl font-bold text-slate-900 mb-2">74<span className="text-2xl text-slate-600">/95</span></div>
                        <div className={`text-lg font-semibold ${
                          78 >= 80 ? 'text-green-600' : 
                          78 >= 60 ? 'text-orange-600' : 
                          'text-red-600'
                        }`}>78%</div>
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
                          data={[
                            { section: 'Verbal Reasoning', score: 17, total: 20, answered: 19, accuracy: 89 },
                            { section: 'Reading Reasoning', score: 16, total: 20, answered: 18, accuracy: 89 },
                            { section: 'Writing', score: 16, total: 20, answered: 18, accuracy: 89 },
                            { section: 'Quantitative Reasoning', score: 15, total: 20, answered: 17, accuracy: 88 },
                            { section: 'Mathematical Reasoning', score: 14, total: 20, answered: 16, accuracy: 88 }
                          ].map(section => ({
                            label: section.section.replace(' Reasoning', '\nReasoning'),
                            value: sectionView === 'score' ? Math.round((section.score / section.total) * 100) : section.accuracy,
                            maxValue: 100
                          }))}
                          size={320}
                          animate={true}
                        />
                      </div>
                      
                      {/* Section List - Right Side */}
                      <div className="w-1/2 divide-y divide-slate-100">
                        {[
                          { section: 'Verbal Reasoning', score: 17, total: 20, answered: 19, accuracy: 89 },
                          { section: 'Reading Reasoning', score: 16, total: 20, answered: 18, accuracy: 89 },
                          { section: 'Writing', score: 16, total: 20, answered: 18, accuracy: 89 },
                          { section: 'Quantitative Reasoning', score: 15, total: 20, answered: 17, accuracy: 88 },
                          { section: 'Mathematical Reasoning', score: 14, total: 20, answered: 16, accuracy: 88 }
                        ]
                          .sort((a, b) => {
                            const aValue = sectionView === 'score' ? (a.score / a.total * 100) : a.accuracy;
                            const bValue = sectionView === 'score' ? (b.score / b.total * 100) : b.accuracy;
                            return bValue - aValue;
                          })
                          .map((section, index) => {
                          const performance = Math.round((section.score / section.total) * 100);
                          return (
                            <div key={index} className="px-4 py-3 hover:bg-slate-50 transition-colors">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <h4 className="font-medium text-slate-900 text-sm">{section.section}</h4>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <div className={`text-base font-semibold ${
                                    sectionView === 'score'
                                      ? (performance >= 80 ? 'text-green-600' : performance >= 60 ? 'text-orange-600' : 'text-red-600')
                                      : (section.accuracy >= 80 ? 'text-green-600' : section.accuracy >= 60 ? 'text-orange-600' : 'text-red-600')
                                  }`}>
                                    {sectionView === 'score' ? performance : section.accuracy}%
                                  </div>
                                  <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full growToRight ${
                                        sectionView === 'score'
                                          ? (performance >= 80 ? 'bg-green-500' : performance >= 60 ? 'bg-orange-500' : 'bg-red-500')
                                          : (section.accuracy >= 80 ? 'bg-green-500' : section.accuracy >= 60 ? 'bg-orange-500' : 'bg-red-500')
                                      }`}
                                      style={{ 
                                        width: `${sectionView === 'score' ? performance : section.accuracy}%`,
                                        animationDelay: `${index * 150}ms`
                                      }}
                                    />
                                  </div>
                                  <div className="text-xs text-slate-600">
                                    {sectionView === 'score' 
                                      ? <span>{section.score}/{section.total}</span>
                                      : <span>{section.score}/{section.answered}</span>
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
                          { id: 'reading', label: 'Reading' },
                          { id: 'mathematical', label: 'Mathematical' },
                          { id: 'verbal', label: 'Verbal' },
                          { id: 'quantitative', label: 'Quantitative' },
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
                      {[
                        { skill: 'Reading comprehension', section: 'Reading Reasoning', score: 8, total: 8, answered: 8, performancePercent: 100, accuracyPercent: 100, category: 'reading' },
                        { skill: 'Critical interpretation', section: 'Reading Reasoning', score: 7, total: 8, answered: 7, performancePercent: 88, accuracyPercent: 100, category: 'reading' },
                        { skill: 'Verbal analogies', section: 'Verbal Reasoning', score: 7, total: 8, answered: 8, performancePercent: 88, accuracyPercent: 88, category: 'verbal' },
                        { skill: 'Text analysis', section: 'Reading Reasoning', score: 6, total: 8, answered: 7, performancePercent: 75, accuracyPercent: 86, category: 'reading' },
                        { skill: 'Written expression', section: 'Writing', score: 6, total: 8, answered: 8, performancePercent: 75, accuracyPercent: 75, category: 'writing' },
                        { skill: 'Mathematical application', section: 'Mathematical Reasoning', score: 5, total: 8, answered: 6, performancePercent: 63, accuracyPercent: 83, category: 'mathematical' },
                        { skill: 'Logical reasoning', section: 'Verbal Reasoning', score: 5, total: 8, answered: 7, performancePercent: 63, accuracyPercent: 71, category: 'verbal' },
                        { skill: 'Number patterns', section: 'Quantitative Reasoning', score: 5, total: 8, answered: 8, performancePercent: 63, accuracyPercent: 63, category: 'quantitative' },
                        { skill: 'Data interpretation', section: 'Mathematical Reasoning', score: 4, total: 8, answered: 6, performancePercent: 50, accuracyPercent: 67, category: 'mathematical' },
                        { skill: 'Multi-step reasoning', section: 'Quantitative Reasoning', score: 3, total: 8, answered: 7, performancePercent: 38, accuracyPercent: 43, category: 'quantitative' }
                      ]
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
                                {subSkillView === 'score' ? skill.performancePercent : skill.accuracyPercent}%
                              </div>
                              <div className="w-32 bg-slate-100 rounded-full h-2 overflow-hidden">
                                <div 
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
                              <div className="text-sm text-slate-600">
                                {subSkillView === 'score' 
                                  ? <span>{skill.score}/{skill.total}</span>
                                  : <span>{skill.score}/{skill.answered}</span>
                                }
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Practice Tests Tab */}
          {activeTab === 'practice' && (
            <div className="space-y-10">
              {/* Header */}
              <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Practice Test Results</h2>
                <p className="text-sm text-slate-600">Select a test to view detailed performance analysis</p>
              </div>
              
              {/* Test Selection Cards */}
              <div className="grid grid-cols-5 gap-3 mb-8">
                {[
                  { testNumber: 1, score: 78, status: 'completed', completedAt: '2024-01-15' },
                  { testNumber: 2, score: 72, status: 'completed', completedAt: '2024-01-22' },
                  { testNumber: 3, score: 85, status: 'completed', completedAt: '2024-01-29' },
                  { testNumber: 4, score: null, status: 'in-progress', completedAt: null },
                  { testNumber: 5, score: null, status: 'not-started', completedAt: null }
                ].map((test, index) => (
                  <div 
                    key={index} 
                    onClick={() => test.status === 'completed' && setSelectedPracticeTest(test.testNumber)}
                    className={`
                      relative p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer transform hover:scale-105 hover:shadow-lg
                      ${
                        selectedPracticeTest === test.testNumber ? 'ring-4 ring-teal-200 scale-105' : ''
                      } ${
                        test.status === 'completed' && test.score !== null && test.score >= 70 
                          ? 'border-teal-300 bg-gradient-to-br from-teal-50 to-emerald-50' 
                          : test.status === 'completed' 
                          ? 'border-orange-300 bg-gradient-to-br from-orange-50 to-yellow-50' 
                          : test.status === 'in-progress' 
                          ? 'border-blue-300 bg-gradient-to-br from-blue-50 to-sky-50' 
                          : 'border-gray-300 bg-gradient-to-br from-gray-50 to-slate-50'
                      }
                    `}
                  >
                    <div className="text-center">
                      <h3 className="text-lg font-bold text-slate-900 mb-2">Test {test.testNumber}</h3>
                      {test.score !== null ? (
                        <div className={`text-2xl font-black mb-2 ${
                          test.score >= 70 ? 'text-teal-600' : 'text-orange-600'
                        }`}>
                          {test.score}%
                        </div>
                      ) : (
                        <div className={`text-sm font-semibold mb-2 ${
                          test.status === 'in-progress' ? 'text-blue-600' : 'text-slate-500'
                        }`}>
                          {test.status === 'in-progress' ? 'In Progress' : 'Not Started'}
                        </div>
                      )}
                      {test.completedAt && (
                        <p className="text-xs text-slate-600 font-medium">
                          {new Date(test.completedAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Overall Performance and Accuracy Cards - Same styling as diagnostic */}
              <div className="grid grid-cols-2 gap-6">
                {/* Overall Performance Card */}
                <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-6 border border-teal-200 shadow-md">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-teal-100 rounded-xl">
                      <Target className="w-6 h-6 text-teal-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Overall Performance</h3>
                      <p className="text-sm text-slate-600">Score out of total questions</p>
                    </div>
                    <div className="relative group ml-auto">
                      <Info size={16} className="text-slate-400 cursor-help" />
                      <div className="absolute top-full right-0 mt-2 w-64 p-3 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                        <div className="font-semibold mb-1">Overall Performance</div>
                        <div>Shows correct answers out of total questions in the test</div>
                        <div className="absolute top-0 right-4 transform -translate-y-1/2 rotate-45 w-2 h-2 bg-slate-900"></div>
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-black text-teal-600 mb-2">
                      {selectedPracticeTest === 1 ? '78' : selectedPracticeTest === 2 ? '72' : '85'}%
                    </div>
                    <div className="text-slate-600 font-medium">
                      {selectedPracticeTest === 1 ? '78/100' : selectedPracticeTest === 2 ? '72/100' : '85/100'} questions correct
                    </div>
                  </div>
                </div>

                {/* Overall Accuracy Card */}
                <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-6 border border-orange-200 shadow-md">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-orange-100 rounded-xl">
                      <Award className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Overall Accuracy</h3>
                      <p className="text-sm text-slate-600">Score out of attempted questions</p>
                    </div>
                    <div className="relative group ml-auto">
                      <Info size={16} className="text-slate-400 cursor-help" />
                      <div className="absolute top-full right-0 mt-2 w-64 p-3 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                        <div className="font-semibold mb-1">Overall Accuracy</div>
                        <div>Shows correct answers out of questions actually attempted (excludes skipped)</div>
                        <div className="absolute top-0 right-4 transform -translate-y-1/2 rotate-45 w-2 h-2 bg-slate-900"></div>
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-black text-orange-600 mb-2">
                      {selectedPracticeTest === 1 ? '82' : selectedPracticeTest === 2 ? '75' : '89'}%
                    </div>
                    <div className="text-slate-600 font-medium">
                      {selectedPracticeTest === 1 ? '78/95' : selectedPracticeTest === 2 ? '72/96' : '85/95'} attempted correct
                    </div>
                  </div>
                </div>
              </div>

              {/* Only show if a test is selected */}
              {selectedPracticeTest && (
                <div className="space-y-8">

                  {/* Section Results */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-md">
                <div className="px-6 py-4 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-900">Section Results</h3>
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
                </div>
                
                <div className="flex">
                  {/* Spider Chart - Left Side */}
                  <div className="w-1/2 p-6 flex items-center justify-center border-r border-slate-200">
                    <SpiderChart 
                      key={`${selectedPracticeTest}-${sectionView}`}
                      data={[
                        { section: 'Verbal Reasoning', score: selectedPracticeTest === 1 ? 16 : selectedPracticeTest === 2 ? 14 : 18, total: 20, answered: selectedPracticeTest === 1 ? 19 : selectedPracticeTest === 2 ? 18 : 19, accuracy: selectedPracticeTest === 1 ? 84 : selectedPracticeTest === 2 ? 78 : 95 },
                        { section: 'Reading Reasoning', score: selectedPracticeTest === 1 ? 15 : selectedPracticeTest === 2 ? 16 : 17, total: 20, answered: selectedPracticeTest === 1 ? 18 : selectedPracticeTest === 2 ? 19 : 18, accuracy: selectedPracticeTest === 1 ? 83 : selectedPracticeTest === 2 ? 84 : 94 },
                        { section: 'Writing', score: selectedPracticeTest === 1 ? 17 : selectedPracticeTest === 2 ? 13 : 16, total: 20, answered: selectedPracticeTest === 1 ? 18 : selectedPracticeTest === 2 ? 17 : 18, accuracy: selectedPracticeTest === 1 ? 94 : selectedPracticeTest === 2 ? 76 : 89 },
                        { section: 'Quantitative Reasoning', score: selectedPracticeTest === 1 ? 14 : selectedPracticeTest === 2 ? 15 : 18, total: 20, answered: selectedPracticeTest === 1 ? 17 : selectedPracticeTest === 2 ? 19 : 19, accuracy: selectedPracticeTest === 1 ? 82 : selectedPracticeTest === 2 ? 79 : 95 },
                        { section: 'Mathematical Reasoning', score: selectedPracticeTest === 1 ? 16 : selectedPracticeTest === 2 ? 14 : 16, total: 20, answered: selectedPracticeTest === 1 ? 18 : selectedPracticeTest === 2 ? 17 : 17, accuracy: selectedPracticeTest === 1 ? 89 : selectedPracticeTest === 2 ? 82 : 94 }
                      ].map(section => ({
                        label: section.section.replace(' Reasoning', '\nReasoning'),
                        value: sectionView === 'score' ? Math.round((section.score / section.total) * 100) : section.accuracy,
                        maxValue: 100
                      }))}
                      size={320}
                      animate={true}
                    />
                  </div>
                  
                  {/* Section List - Right Side */}
                  <div className="w-1/2 divide-y divide-slate-100">
                    {[
                      { section: 'Verbal Reasoning', score: selectedPracticeTest === 1 ? 16 : selectedPracticeTest === 2 ? 14 : 18, total: 20, answered: selectedPracticeTest === 1 ? 19 : selectedPracticeTest === 2 ? 18 : 19, accuracy: selectedPracticeTest === 1 ? 84 : selectedPracticeTest === 2 ? 78 : 95 },
                      { section: 'Reading Reasoning', score: selectedPracticeTest === 1 ? 15 : selectedPracticeTest === 2 ? 16 : 17, total: 20, answered: selectedPracticeTest === 1 ? 18 : selectedPracticeTest === 2 ? 19 : 18, accuracy: selectedPracticeTest === 1 ? 83 : selectedPracticeTest === 2 ? 84 : 94 },
                      { section: 'Writing', score: selectedPracticeTest === 1 ? 17 : selectedPracticeTest === 2 ? 13 : 16, total: 20, answered: selectedPracticeTest === 1 ? 18 : selectedPracticeTest === 2 ? 17 : 18, accuracy: selectedPracticeTest === 1 ? 94 : selectedPracticeTest === 2 ? 76 : 89 },
                      { section: 'Quantitative Reasoning', score: selectedPracticeTest === 1 ? 14 : selectedPracticeTest === 2 ? 15 : 18, total: 20, answered: selectedPracticeTest === 1 ? 17 : selectedPracticeTest === 2 ? 19 : 19, accuracy: selectedPracticeTest === 1 ? 82 : selectedPracticeTest === 2 ? 79 : 95 },
                      { section: 'Mathematical Reasoning', score: selectedPracticeTest === 1 ? 16 : selectedPracticeTest === 2 ? 14 : 16, total: 20, answered: selectedPracticeTest === 1 ? 18 : selectedPracticeTest === 2 ? 17 : 17, accuracy: selectedPracticeTest === 1 ? 89 : selectedPracticeTest === 2 ? 82 : 94 }
                    ]
                      .sort((a, b) => {
                        const aValue = sectionView === 'score' ? (a.score / a.total * 100) : a.accuracy;
                        const bValue = sectionView === 'score' ? (b.score / b.total * 100) : b.accuracy;
                        return bValue - aValue;
                      })
                      .map((section, index) => {
                      const performance = Math.round((section.score / section.total) * 100);
                      return (
                        <div key={index} className="px-4 py-3 hover:bg-slate-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-slate-900 text-sm">{section.section}</h4>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <div className={`text-base font-semibold ${
                                sectionView === 'score'
                                  ? (performance >= 80 ? 'text-green-600' : performance >= 60 ? 'text-orange-600' : 'text-red-600')
                                  : (section.accuracy >= 80 ? 'text-green-600' : section.accuracy >= 60 ? 'text-orange-600' : 'text-red-600')
                              }`}>
                                {sectionView === 'score' ? performance : section.accuracy}%
                              </div>
                              <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full growToRight ${
                                    sectionView === 'score'
                                      ? (performance >= 80 ? 'bg-green-500' : performance >= 60 ? 'bg-orange-500' : 'bg-red-500')
                                      : (section.accuracy >= 80 ? 'bg-green-500' : section.accuracy >= 60 ? 'bg-orange-500' : 'bg-red-500')
                                  }`}
                                  style={{ 
                                    width: `${sectionView === 'score' ? performance : section.accuracy}%`,
                                    animationDelay: `${index * 150}ms`
                                  }}
                                />
                              </div>
                              <div className="text-xs text-slate-600">
                                {sectionView === 'score' 
                                  ? <span>{section.score}/{section.total}</span>
                                  : <span>{section.score}/{section.answered}</span>
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

              {/* Sub-Skills Performance */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-md">
                <div className="px-6 py-4 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-900">Sub-Skills Performance</h3>
                    <div className="flex items-center gap-4">
                      <div className="flex bg-slate-100 rounded-lg p-1">
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
                  </div>
                </div>

                <div className="px-6 py-4 border-b border-slate-200">
                  {/* Filter tabs */}
                  <div className="flex flex-wrap gap-3">
                    {[
                      { id: 'all', label: 'All' },
                      { id: 'reading', label: 'Reading' },
                      { id: 'mathematical', label: 'Mathematical' },
                      { id: 'verbal', label: 'Verbal' },
                      { id: 'quantitative', label: 'Quantitative' },
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

                {/* Skills List */}
                <div className="divide-y divide-slate-100">
                    {[
                      { skill: 'Reading comprehension', section: 'Reading Reasoning', score: selectedPracticeTest === 1 ? 7 : selectedPracticeTest === 2 ? 6 : 8, total: 8, answered: selectedPracticeTest === 1 ? 8 : selectedPracticeTest === 2 ? 7 : 8, performancePercent: selectedPracticeTest === 1 ? 88 : selectedPracticeTest === 2 ? 75 : 100, accuracyPercent: selectedPracticeTest === 1 ? 88 : selectedPracticeTest === 2 ? 86 : 100, category: 'reading' },
                      { skill: 'Critical interpretation', section: 'Reading Reasoning', score: selectedPracticeTest === 1 ? 6 : selectedPracticeTest === 2 ? 7 : 7, total: 8, answered: selectedPracticeTest === 1 ? 7 : selectedPracticeTest === 2 ? 8 : 7, performancePercent: selectedPracticeTest === 1 ? 75 : selectedPracticeTest === 2 ? 88 : 88, accuracyPercent: selectedPracticeTest === 1 ? 86 : selectedPracticeTest === 2 ? 88 : 100, category: 'reading' },
                      { skill: 'Text analysis', section: 'Reading Reasoning', score: selectedPracticeTest === 1 ? 5 : selectedPracticeTest === 2 ? 5 : 6, total: 8, answered: selectedPracticeTest === 1 ? 6 : selectedPracticeTest === 2 ? 7 : 7, performancePercent: selectedPracticeTest === 1 ? 63 : selectedPracticeTest === 2 ? 63 : 75, accuracyPercent: selectedPracticeTest === 1 ? 83 : selectedPracticeTest === 2 ? 71 : 86, category: 'reading' },
                      { skill: 'Inferential reasoning', section: 'Reading Reasoning', score: selectedPracticeTest === 1 ? 4 : selectedPracticeTest === 2 ? 4 : 5, total: 8, answered: selectedPracticeTest === 1 ? 6 : selectedPracticeTest === 2 ? 6 : 6, performancePercent: selectedPracticeTest === 1 ? 50 : selectedPracticeTest === 2 ? 50 : 63, accuracyPercent: selectedPracticeTest === 1 ? 67 : selectedPracticeTest === 2 ? 67 : 83, category: 'reading' },
                      { skill: 'Mathematical application', section: 'Mathematical Reasoning', score: selectedPracticeTest === 1 ? 6 : selectedPracticeTest === 2 ? 5 : 7, total: 8, answered: selectedPracticeTest === 1 ? 7 : selectedPracticeTest === 2 ? 7 : 8, performancePercent: selectedPracticeTest === 1 ? 75 : selectedPracticeTest === 2 ? 63 : 88, accuracyPercent: selectedPracticeTest === 1 ? 86 : selectedPracticeTest === 2 ? 71 : 88, category: 'mathematical' },
                      { skill: 'Mathematical modelling', section: 'Mathematical Reasoning', score: selectedPracticeTest === 1 ? 5 : selectedPracticeTest === 2 ? 4 : 6, total: 8, answered: selectedPracticeTest === 1 ? 6 : selectedPracticeTest === 2 ? 6 : 7, performancePercent: selectedPracticeTest === 1 ? 63 : selectedPracticeTest === 2 ? 50 : 75, accuracyPercent: selectedPracticeTest === 1 ? 83 : selectedPracticeTest === 2 ? 67 : 86, category: 'mathematical' },
                      { skill: 'Problem solving', section: 'Mathematical Reasoning', score: selectedPracticeTest === 1 ? 4 : selectedPracticeTest === 2 ? 3 : 5, total: 8, answered: selectedPracticeTest === 1 ? 6 : selectedPracticeTest === 2 ? 5 : 6, performancePercent: selectedPracticeTest === 1 ? 50 : selectedPracticeTest === 2 ? 38 : 63, accuracyPercent: selectedPracticeTest === 1 ? 67 : selectedPracticeTest === 2 ? 60 : 83, category: 'mathematical' },
                      { skill: 'Multi-step reasoning', section: 'Mathematical Reasoning', score: selectedPracticeTest === 1 ? 3 : selectedPracticeTest === 2 ? 2 : 4, total: 8, answered: selectedPracticeTest === 1 ? 5 : selectedPracticeTest === 2 ? 4 : 5, performancePercent: selectedPracticeTest === 1 ? 38 : selectedPracticeTest === 2 ? 25 : 50, accuracyPercent: selectedPracticeTest === 1 ? 60 : selectedPracticeTest === 2 ? 50 : 80, category: 'mathematical' }
                    ]
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
                              {subSkillView === 'score' ? skill.performancePercent : skill.accuracyPercent}%
                            </div>
                            <div className="w-32 bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div 
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
                            <div className="text-sm text-slate-600">
                              {subSkillView === 'score' 
                                ? <span>{skill.score}/{skill.total}</span>
                                : <span>{skill.score}/{skill.answered}</span>
                              }
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              )}
            </div>
          )}

          {/* Drills Tab */}
          {activeTab === 'drills' && (
            <div className="space-y-10">
              {/* Header */}
              <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Drill Results</h2>
                <p className="text-sm text-slate-600">Focused practice on specific sub-skills</p>
              </div>

              {/* Overall Stats */}
              <div className="grid grid-cols-3 gap-6">
                {/* Total Questions */}
                <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-2xl p-6 border border-blue-200 shadow-md">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <BookOpen className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Total Questions</h3>
                      <p className="text-sm text-slate-600">Completed across all drills</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-black text-blue-600 mb-2">151</div>
                    <div className="text-slate-600 font-medium">questions completed</div>
                  </div>
                </div>

                {/* Overall Accuracy */}
                <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-6 border border-teal-200 shadow-md">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-teal-100 rounded-xl">
                      <Target className="w-6 h-6 text-teal-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Overall Accuracy</h3>
                      <p className="text-sm text-slate-600">Average across all drills</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-black text-teal-600 mb-2">68%</div>
                    <div className="text-slate-600 font-medium">accuracy rate</div>
                  </div>
                </div>

                {/* Time Spent */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200 shadow-md">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-purple-100 rounded-xl">
                      <Clock className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Time Spent</h3>
                      <p className="text-sm text-slate-600">Total practice time</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-black text-purple-600 mb-2">4.2</div>
                    <div className="text-slate-600 font-medium">hours practicing</div>
                  </div>
                </div>
              </div>

              {/* Sub-Skill Breakdown */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-md">
                <h3 className="text-xl font-bold text-slate-900 mb-6">Sub-Skill Breakdown</h3>
                
                {/* Filter tabs */}
                <div className="flex flex-wrap gap-3 mb-8">
                  {[
                    { id: 'all', label: 'All Skills', count: 10 },
                    { id: 'reading', label: 'Reading', count: 3 },
                    { id: 'mathematical', label: 'Mathematical', count: 3 },
                    { id: 'quantitative', label: 'Quantitative', count: 2 },
                    { id: 'verbal', label: 'Verbal', count: 2 }
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setDrillFilter(filter.id)}
                      className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                        drillFilter === filter.id
                          ? 'bg-teal-600 text-white shadow-lg'
                          : 'bg-gray-100 text-slate-700 hover:bg-gray-200'
                      }`}
                    >
                      {filter.label} {filter.count}
                    </button>
                  ))}
                </div>

                {/* Skills List */}
                <div className="space-y-4">
                  {[
                    { skill: 'Mathematical sequence analysis', section: 'Quantitative Reasoning', questions: 18, accuracy: 62, color: 'orange', category: 'quantitative' },
                    { skill: 'Reading comprehension', section: 'Reading Reasoning', questions: 15, accuracy: 82, color: 'teal', category: 'reading' },
                    { skill: 'Advanced numerical reasoning', section: 'Mathematical Reasoning', questions: 15, accuracy: 65, color: 'orange', category: 'mathematical' },
                    { skill: 'Word problem solving', section: 'Quantitative Reasoning', questions: 15, accuracy: 65, color: 'orange', category: 'quantitative' },
                    { skill: 'Critical interpretation', section: 'Reading Reasoning', questions: 12, accuracy: 78, color: 'orange', category: 'reading' },
                    { skill: 'Verbal analogies', section: 'Verbal Reasoning', questions: 20, accuracy: 45, color: 'orange', category: 'verbal' },
                    { skill: 'Text analysis', section: 'Reading Reasoning', questions: 14, accuracy: 71, color: 'orange', category: 'reading' },
                    { skill: 'Mathematical modeling', section: 'Mathematical Reasoning', questions: 18, accuracy: 58, color: 'orange', category: 'mathematical' },
                    { skill: 'Written expression', section: 'Writing', questions: 8, accuracy: 83, color: 'teal', category: 'written' },
                    { skill: 'Logical reasoning', section: 'Verbal Reasoning', questions: 16, accuracy: 52, color: 'orange', category: 'verbal' },
                  ]
                    .filter(item => drillFilter === 'all' || item.category === drillFilter)
                    .map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-6 bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                      <div className="flex-1">
                        <div className="relative group">
                          <h5 className="text-lg font-semibold text-slate-900 mb-1 cursor-help flex items-center gap-1">
                            {item.skill}
                            <Info size={14} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </h5>
                          {UNIFIED_SUB_SKILLS[item.skill] && (
                            <div className="absolute left-0 top-full mt-2 w-80 p-4 bg-slate-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20 shadow-lg">
                              <div className="font-semibold text-teal-400 mb-2">{item.skill}</div>
                              <div className="text-xs leading-relaxed">{UNIFIED_SUB_SKILLS[item.skill]?.description || 'No description available'}</div>
                              <div className="absolute top-0 left-4 transform -translate-y-1/2 rotate-45 w-2 h-2 bg-slate-900"></div>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-slate-600">{item.section}</p>
                      </div>
                      <div className="text-center mx-6">
                        <p className="text-sm text-slate-500 font-medium">{item.questions} questions</p>
                        <p className="text-sm text-slate-500">completed</p>
                      </div>
                      <div className="flex items-center space-x-6">
                        {/* Progress bar */}
                        <div className="w-48 h-4 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${
                              item.color === 'teal' ? 'bg-teal-500' : 'bg-orange-500'
                            }`}
                            style={{ 
                              width: `${item.accuracy}%`,
                              animationDelay: `${index * 150}ms`
                            }}
                          />
                        </div>
                        <span className={`text-xl font-bold min-w-[60px] text-right ${
                          item.color === 'teal' ? 'text-teal-600' : 'text-orange-600'
                        }`}>
                          {item.accuracy}%
                        </span>
                        <button className="px-4 py-2 bg-slate-700 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors duration-200 min-w-[60px] transform hover:scale-105">
                          Drill
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Drills Tab */}
          {activeTab === 'drills' && (
            <div className="space-y-10">
              {/* Header */}
              <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Drill Results</h2>
                <p className="text-sm text-slate-600">Track your progress across different skill areas</p>
              </div>

              {/* Overall Stats Cards */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-6 border border-teal-200 shadow-md transform hover:scale-105 transition-all duration-300">
                  <h3 className="text-lg font-bold text-teal-900 mb-3">Total Questions Completed</h3>
                  <div className="text-3xl font-black text-teal-600 mb-2">169</div>
                  <p className="text-sm text-teal-700 font-medium">Drill questions only</p>
                </div>
                
                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-200 shadow-md transform hover:scale-105 transition-all duration-300">
                  <h3 className="text-lg font-bold text-slate-900 mb-3">Overall Accuracy</h3>
                  <div className="text-3xl font-black text-orange-600 mb-2">44%</div>
                  <p className="text-sm text-slate-600 font-medium">Drill questions only</p>
                </div>
              </div>

              {/* Drill Sub-Skill Performance */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-md">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Drill Sub-Skill Performance</h3>
                
                {/* Filter tabs */}
                <div className="flex flex-wrap gap-3 mb-8">
                  {[
                    { id: 'all', label: 'All Skills', count: 30 },
                    { id: 'reading', label: 'Reading', count: 7 },
                    { id: 'mathematical', label: 'Mathematical', count: 7 },
                    { id: 'verbal', label: 'Verbal', count: 7 },
                    { id: 'quantitative', label: 'Quantitative', count: 7 },
                    { id: 'written', label: 'Written', count: 2 }
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setDrillFilter(filter.id)}
                      className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                        drillFilter === filter.id
                          ? 'bg-teal-600 text-white shadow-lg'
                          : 'bg-gray-100 text-slate-700 hover:bg-gray-200'
                      }`}
                    >
                      {filter.label} {filter.count}
                    </button>
                  ))}
                </div>

                {/* Skills List */}
                <div className="space-y-4">
                  {[
                    { skill: 'Mathematical sequence analysis', section: 'Quantitative Reasoning', questions: 18, accuracy: 62, color: 'orange', category: 'quantitative' },
                    { skill: 'Reading comprehension', section: 'Reading Reasoning', questions: 15, accuracy: 82, color: 'teal', category: 'reading' },
                    { skill: 'Advanced numerical reasoning', section: 'Mathematical Reasoning', questions: 15, accuracy: 65, color: 'orange', category: 'mathematical' },
                    { skill: 'Word problem solving', section: 'Quantitative Reasoning', questions: 15, accuracy: 65, color: 'orange', category: 'quantitative' },
                    { skill: 'Critical interpretation', section: 'Reading Reasoning', questions: 12, accuracy: 78, color: 'orange', category: 'reading' },
                    { skill: 'Verbal analogies', section: 'Verbal Reasoning', questions: 20, accuracy: 45, color: 'orange', category: 'verbal' },
                    { skill: 'Text analysis', section: 'Reading Reasoning', questions: 14, accuracy: 71, color: 'orange', category: 'reading' },
                    { skill: 'Mathematical modeling', section: 'Mathematical Reasoning', questions: 18, accuracy: 58, color: 'orange', category: 'mathematical' },
                    { skill: 'Written expression', section: 'Writing', questions: 8, accuracy: 83, color: 'teal', category: 'written' },
                    { skill: 'Logical reasoning', section: 'Verbal Reasoning', questions: 16, accuracy: 52, color: 'orange', category: 'verbal' },
                  ]
                    .filter(item => drillFilter === 'all' || item.category === drillFilter)
                    .map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-6 bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                      <div className="flex-1">
                        <div className="relative group">
                          <h5 className="text-lg font-semibold text-slate-900 mb-1 cursor-help flex items-center gap-1">
                            {item.skill}
                            <Info size={14} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </h5>
                          {UNIFIED_SUB_SKILLS[item.skill] && (
                            <div className="absolute left-0 top-full mt-2 w-80 p-4 bg-slate-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20 shadow-lg">
                              <div className="font-semibold text-teal-400 mb-2">{item.skill}</div>
                              <div className="text-xs leading-relaxed">{UNIFIED_SUB_SKILLS[item.skill]?.description || 'No description available'}</div>
                              <div className="absolute top-0 left-4 transform -translate-y-1/2 rotate-45 w-2 h-2 bg-slate-900"></div>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-slate-600">{item.section}</p>
                      </div>
                      <div className="text-center mx-6">
                        <p className="text-sm text-slate-500 font-medium">{item.questions} questions</p>
                        <p className="text-sm text-slate-500">completed</p>
                      </div>
                      <div className="flex items-center space-x-6">
                        {/* Progress bar */}
                        <div className="w-48 h-4 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${
                              item.color === 'teal' ? 'bg-teal-500' : 'bg-orange-500'
                            }`}
                            style={{ 
                              width: `${item.accuracy}%`,
                              animationDelay: `${index * 150}ms`
                            }}
                          />
                        </div>
                        <span className={`text-xl font-bold min-w-[60px] text-right ${
                          item.color === 'teal' ? 'text-teal-600' : 'text-orange-600'
                        }`}>
                          {item.accuracy}%
                        </span>
                        <button className="px-4 py-2 bg-slate-700 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors duration-200 min-w-[60px] transform hover:scale-105">
                          Drill
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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