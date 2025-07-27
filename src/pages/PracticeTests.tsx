import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { HeroBanner } from '@/components/ui/hero-banner';
import { 
  BookOpen, Clock, Target, Trophy, BarChart3, 
  ArrowRight, ChevronLeft, Calendar, User, Award, AlertCircle,
  CheckCircle2, Timer, Users, FileText, ChevronDown, ChevronUp, Play, RotateCcw,
  Trash2, CheckCircle, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProduct } from '@/context/ProductContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  fetchQuestionsFromSupabase, 
  getPlaceholderTestStructure,
  type TestType,
  type TestMode,
  type TestSection as SupabaseTestSection
} from '@/services/supabaseQuestionService';
import { supabase } from '@/integrations/supabase/client';
import { TEST_STRUCTURES } from '@/data/curriculumData';
import { SessionService, SectionProgress } from '@/services/sessionService';
import { useAuth } from '@/context/AuthContext';
import { DeveloperTools } from '@/components/DeveloperTools';
import { PaywallComponent } from '@/components/PaywallComponent';
import { isPaywallUIEnabled } from '@/config/stripeConfig';

// Map frontend product IDs to database product_type values (same as Dashboard)
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

interface TestSection {
  id: string;
  name: string;
  questions: number;
  timeLimit: number;
  status: 'not-started' | 'in-progress' | 'completed';
  score?: number;
  sampleQuestions?: {
    id: number;
    text: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  }[];
}

interface PracticeTest {
  id: string;
  name: string;
  description: string;
  sections: TestSection[];
  totalQuestions: number;
  estimatedTime: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  status: 'not-started' | 'in-progress' | 'completed';
  bestScore?: number;
  lastAttempt?: string;
  type: 'practice' | 'drill' | 'diagnostic';
}

const PracticeTests: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [testData, setTestData] = useState<TestType | null>(null);
  const [sectionProgress, setSectionProgress] = useState<Record<string, SectionProgress>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedTest, setExpandedTest] = useState<string | null>(null);
  const [averageScore, setAverageScore] = useState<number>(0);
  const { selectedProduct, currentProduct, hasAccessToCurrentProduct } = useProduct();

  // Helper function to calculate total time from curriculum data
  const calculateTotalTime = (testType: string, sections: TestSection[]): number => {
    const testStructure = TEST_STRUCTURES[testType as keyof typeof TEST_STRUCTURES];
    if (!testStructure) return 0;

    let totalMinutes = 0;
    sections.forEach(section => {
      const sectionStructure = testStructure[section.name as keyof typeof testStructure] as any;
      if (sectionStructure && typeof sectionStructure === 'object' && sectionStructure.time) {
        totalMinutes += sectionStructure.time;
      }
    });

    return totalMinutes;
  };

  // Helper function to round time to nearest 0.5 hours
  const formatTimeToHours = (minutes: number): string => {
    const hours = minutes / 60;
    const roundedHours = Math.round(hours * 2) / 2; // Round to nearest 0.5
    
    if (roundedHours < 1) {
      return `${minutes} min`;
    } else if (roundedHours === 1) {
      return '1 hour';
    } else if (roundedHours % 1 === 0) {
      return `${roundedHours} hours`;
    } else {
      return `${roundedHours} hours`;
    }
  };

  // Calculate average score from actual test sessions (same logic as insights)
  const calculateAverageScore = async () => {
    if (!user) {
      setAverageScore(0);
      return;
    }

    try {
      const dbProductType = getDbProductType(selectedProduct);
      
      // Get all completed practice test sessions (same query as insights)
      const { data: testSessions, error: testError } = await supabase
        .from('user_test_sessions')
        .select('final_score')
        .eq('user_id', user.id)
        .eq('product_type', dbProductType)
        .eq('status', 'completed')
        .like('test_mode', 'practice_%'); // Only practice tests

      if (testError) {
        console.error('❌ Error fetching practice test sessions for average score:', testError);
        setAverageScore(0);
        return;
      }

      const calculatedAverageScore = testSessions && testSessions.length > 0
        ? Math.round(testSessions.reduce((sum, test) => sum + (test.final_score || 0), 0) / testSessions.length)
        : 0;

      console.log('📊 PRACTICE: Calculated average score from test sessions:', calculatedAverageScore, '(from', testSessions.length, 'completed sessions)');
      setAverageScore(calculatedAverageScore);
    } catch (error) {
      console.error('Error calculating average score:', error);
      setAverageScore(0);
    }
  };

  // Helper function to get individual section time from curriculum data
  const getSectionTimeLimit = (testType: string, sectionName: string): number => {
    const testStructure = TEST_STRUCTURES[testType as keyof typeof TEST_STRUCTURES];
    if (!testStructure) return 30; // Default fallback

    // Try exact match first
    const exactMatch = (testStructure as any)[sectionName];
    if (exactMatch && typeof exactMatch === 'object' && exactMatch.time) {
      return exactMatch.time;
    }

    // Try partial match (case-insensitive)
    const sectionKeys = Object.keys(testStructure);
    const partialMatch = sectionKeys.find(key => 
      key.toLowerCase().includes(sectionName.toLowerCase()) ||
      sectionName.toLowerCase().includes(key.toLowerCase())
    );

    if (partialMatch) {
      const matchedSection = (testStructure as any)[partialMatch];
      if (matchedSection && typeof matchedSection === 'object' && matchedSection.time) {
        return matchedSection.time;
      }
    }

    return 30; // Default fallback
  };

  useEffect(() => {
    const loadTestData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch questions from Supabase
        const organizedData = await fetchQuestionsFromSupabase();
        
        // Find the test type for the selected product
        const currentTestType = organizedData.testTypes.find(
          testType => testType.id === selectedProduct
        );

        if (currentTestType && currentTestType.testModes.length > 0) {
          // Use real data from Supabase
          setTestData(currentTestType);
        } else {
          // Use placeholder structure if no questions found
          const placeholder = getPlaceholderTestStructure(selectedProduct);
          setTestData(placeholder);
        }

        // Load user progress for practice tests if authenticated
        if (user) {
          try {
            const dbProductType = getDbProductType(selectedProduct);
            console.log('🔍 PRACTICE: Query will use productType:', dbProductType, '(from selectedProduct:', selectedProduct, ')');
            
            // Load progress for all practice test modes
            const practiceTestModes = ['practice_1', 'practice_2', 'practice_3', 'practice_4', 'practice_5'];
            const allProgressData: Record<string, any> = {};
            
            for (const testMode of practiceTestModes) {
              try {
                const progressData = await SessionService.getUserProgress(
                  user.id, 
                  dbProductType,
                  testMode
                );
                
                // Prefix section names with test mode to avoid conflicts
                Object.entries(progressData).forEach(([sectionName, progress]) => {
                  allProgressData[`${testMode}_${sectionName}`] = {
                    ...progress,
                    testMode // Add test mode for lookup
                  };
                });
                
                console.log(`📊 Practice progress loaded for ${testMode}:`, Object.keys(progressData));
              } catch (error) {
                console.error(`Error loading progress for ${testMode}:`, error);
              }
            }
            
            setSectionProgress(allProgressData);
            console.log('📊 All practice progress loaded:', allProgressData);

            // Calculate average score from test sessions
            await calculateAverageScore();
          } catch (error) {
            console.error('Error loading practice progress:', error);
          }
        }

      } catch (err) {
        console.error('Error loading test data:', err);
        setError('Failed to load test data');
        // Fallback to placeholder
        const placeholder = getPlaceholderTestStructure(selectedProduct);
        setTestData(placeholder);
      } finally {
        setLoading(false);
      }
    };

    loadTestData();
  }, [selectedProduct, user]);

  // Reload progress when returning to page
  useEffect(() => {
    const refreshProgress = async () => {
      if (user) {
        try {
          const dbProductType = getDbProductType(selectedProduct);
          console.log('🔄 PRACTICE: Refreshing with productType:', dbProductType, '(from selectedProduct:', selectedProduct, ')');
          
          // Load progress for all practice test modes
          const practiceTestModes = ['practice_1', 'practice_2', 'practice_3', 'practice_4', 'practice_5'];
          const allProgressData: Record<string, any> = {};
          
          for (const testMode of practiceTestModes) {
            try {
              const progressData = await SessionService.getUserProgress(user.id, dbProductType, testMode);
              
              // Prefix section names with test mode to avoid conflicts
              Object.entries(progressData).forEach(([sectionName, progress]) => {
                allProgressData[`${testMode}_${sectionName}`] = {
                  ...progress,
                  testMode
                };
              });
            } catch (error) {
              console.error(`🔄 PRACTICE: Error refreshing progress for ${testMode}:`, error);
            }
          }
          
          setSectionProgress(allProgressData);
          console.log('🔄 Practice progress refreshed on focus/mount');

          // Recalculate average score
          await calculateAverageScore();
        } catch (error) {
          console.error('Error refreshing practice progress:', error);
        }
      }
    };

    // Refresh immediately when component mounts or dependencies change
    refreshProgress();

    // Refresh on window focus
    const handleFocus = () => refreshProgress();
    window.addEventListener('focus', handleFocus);
    
    // Refresh periodically when window is visible (to catch updates from other tabs)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 Page became visible, refreshing progress...');
        refreshProgress();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, selectedProduct]);

  // Handle refresh parameter from navigation
  useEffect(() => {
    const refreshParam = searchParams.get('refresh');
    if (refreshParam === 'true' && user) {
      console.log('🔄 FORCE REFRESH: Detected refresh parameter, forcing practice progress reload...');
      
      const forceRefreshProgress = async () => {
        try {
          const dbProductType = getDbProductType(selectedProduct);
          console.log('🔄 FORCE REFRESH: Loading fresh practice progress data for:', dbProductType);
          
          // Load progress for all practice test modes
          const practiceTestModes = ['practice_1', 'practice_2', 'practice_3', 'practice_4', 'practice_5'];
          const allProgressData: Record<string, any> = {};
          
          for (const testMode of practiceTestModes) {
            try {
              const progressData = await SessionService.getUserProgress(user.id, dbProductType, testMode);
              
              // Prefix section names with test mode to avoid conflicts
              Object.entries(progressData).forEach(([sectionName, progress]) => {
                allProgressData[`${testMode}_${sectionName}`] = {
                  ...progress,
                  testMode
                };
              });
            } catch (error) {
              console.error(`🔄 FORCE REFRESH: Error loading progress for ${testMode}:`, error);
            }
          }
          
          setSectionProgress(allProgressData);
          console.log('🔄 FORCE REFRESH: Fresh practice progress data loaded:', allProgressData);

          // Recalculate average score
          await calculateAverageScore();
          
          // Clear the refresh parameter from URL
          setSearchParams({});
          console.log('🔄 FORCE REFRESH: Cleared refresh parameter from URL');
        } catch (error) {
          console.error('🔄 FORCE REFRESH: Error loading fresh practice progress:', error);
        }
      };
      
      forceRefreshProgress();
    }
  }, [searchParams, user, selectedProduct, setSearchParams]);

  // Transform Supabase data to component format - exclude drill and diagnostic modes
  const transformTestMode = (testMode: TestMode): PracticeTest => {
    const sections: TestSection[] = testMode.sections.map((section, index) => {
      // Get real progress data for this section using test-specific key
      const progressKey = `${testMode.id}_${section.name}`;
      const progressData = sectionProgress[progressKey];
      let status: 'not-started' | 'in-progress' | 'completed' = 'not-started';
      let score: number | undefined = undefined;
      
      console.log(`📊 TRANSFORM: Section "${section.name}" (testMode: ${testMode.id}) progress key: "${progressKey}":`, progressData);
      
      if (progressData) {
        status = progressData.status;
        console.log(`📊 TRANSFORM: Section "${section.name}" status mapped to:`, status);
        // Calculate score if completed (this would come from actual test results)
        if (status === 'completed' && progressData.questionsAnswered > 0) {
          // This is a placeholder - in real implementation, score would come from test results
          score = Math.floor(Math.random() * 20) + 80; // Mock score between 80-100
        }
      } else {
        console.log(`📊 TRANSFORM: No progress data found for section "${section.name}"`);
      }

      return {
        id: section.id,
        name: section.name,
        questions: section.totalQuestions,
        timeLimit: getSectionTimeLimit(testData?.name || '', section.name),
        status,
        score,
        // Convert first few questions to sample format for preview
        sampleQuestions: section.questions.slice(0, 3).map((q, index) => ({
          id: index + 1,
          text: q.text,
          options: q.options,
          correctAnswer: q.options[q.correctAnswer] || 'A',
          explanation: q.explanation,
        }))
      };
    });

    // Calculate proper timing from curriculum data
    const calculatedTime = calculateTotalTime(testData?.name || '', sections);
    const finalTime = calculatedTime > 0 ? calculatedTime : testMode.estimatedTime;

    // Determine overall test status and best score based on sections
    let testStatus: 'not-started' | 'in-progress' | 'completed' = 'not-started';
    let bestScore: number | undefined = undefined;
    let lastAttempt: string | undefined = undefined;

    const completedSections = sections.filter(s => s.status === 'completed');
    const inProgressSections = sections.filter(s => s.status === 'in-progress');
    
    if (completedSections.length === sections.length && sections.length > 0) {
      testStatus = 'completed';
      // Calculate average score from completed sections
      const scoresWithValues = completedSections.filter(s => s.score).map(s => s.score!);
      if (scoresWithValues.length > 0) {
        bestScore = Math.round(scoresWithValues.reduce((a, b) => a + b, 0) / scoresWithValues.length);
      }
    } else if (completedSections.length > 0 || inProgressSections.length > 0) {
      testStatus = 'in-progress';
      // Calculate current best score from completed sections
      const scoresWithValues = completedSections.filter(s => s.score).map(s => s.score!);
      if (scoresWithValues.length > 0) {
        bestScore = Math.round(scoresWithValues.reduce((a, b) => a + b, 0) / scoresWithValues.length);
      }
    }

    // Add real last attempt date if there's progress
    if (testStatus !== 'not-started' && Object.keys(sectionProgress).length > 0) {
      const latestProgress = Object.values(sectionProgress).reduce((latest, current) => {
        return new Date(current.lastUpdated) > new Date(latest.lastUpdated) ? current : latest;
      });
      lastAttempt = new Date(latestProgress.lastUpdated).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }

    return {
      id: testMode.id,
      name: testMode.name,
      description: testMode.description || 'Test preparation material',
      sections,
      totalQuestions: testMode.totalQuestions,
      estimatedTime: finalTime,
      difficulty: (testMode.difficulty as 'Easy' | 'Medium' | 'Hard') || 'Medium',
      status: testStatus,
      bestScore,
      lastAttempt,
      type: testMode.type,
    };
  };

  // Filter out drill and diagnostic modes since they have their own dedicated pages
  const practiceTests: PracticeTest[] = testData ? 
    testData.testModes
      .filter(mode => mode.type !== 'drill' && mode.type !== 'diagnostic')
      .map(mode => {
        console.log('🔍 PRACTICE: Processing test mode:', {
          id: mode.id,
          name: mode.name,
          type: mode.type
        });
        return transformTestMode(mode);
      }) : [];

  const completedTests = practiceTests.filter(test => test.status === 'completed').length;
  const inProgressTests = practiceTests.filter(test => test.status === 'in-progress').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-emerald-200 bg-emerald-50/30';
      case 'in-progress':
        return 'border-amber-200 bg-amber-50/30';
      case 'not-started':
        return 'border-slate-200 bg-white';
      default:
        return 'border-slate-200 bg-white';
    }
  };

  const handleTestExpand = (testId: string) => {
    setExpandedTest(expandedTest === testId ? null : testId);
  };

  const handleStartSection = (testId: string, sectionId: string) => {
    const test = practiceTests.find(t => t.id === testId);
    const section = test?.sections.find(s => s.id === sectionId);
    
    if (!section || section.questions === 0) return;
    
    // Check if there's an active session for this section using test-specific key
    const progressKey = `${testId}_${section.name}`;
    const progressData = sectionProgress[progressKey];
    
    console.log('🔍 PRACTICE: handleStartSection called with:', {
      testId,
      sectionId,
      sectionName: section.name,
      progressKey,
      progressData,
      allProgressKeys: Object.keys(sectionProgress)
    });
    
    if (progressData && progressData.status === 'in-progress' && progressData.sessionId) {
      // Resume existing session - go to instructions first
      console.log('🔄 Resuming practice session:', progressData.sessionId);
      navigate(`/test-instructions/practice/${sectionId}/${progressData.sessionId}?sectionName=${encodeURIComponent(section.name)}&testMode=${testId}`);
    } else {
      // Start new session - go to instructions first
      console.log('🆕 Starting new practice session for:', section.name, 'testMode:', testId);
      navigate(`/test-instructions/practice/${sectionId}?sectionName=${encodeURIComponent(section.name)}&testMode=${testId}`);
    }
  };

  const handleViewResults = (testId: string, sectionId?: string) => {
    console.log('📊 VIEW RESULTS: Called with testId:', testId, 'sectionId:', sectionId);
    
    if (sectionId) {
      // View results for specific section
      const test = practiceTests.find(t => t.id === testId);
      const section = test?.sections.find(s => s.id === sectionId);
      
      console.log('📊 VIEW RESULTS: Found test:', !!test, 'section:', !!section, 'section name:', section?.name);
      
      if (!section) return;
      
      // Use test-specific progress key (same as handleStartSection)
      const progressKey = `${testId}_${section.name}`;
      const progressData = sectionProgress[progressKey];
      console.log('📊 VIEW RESULTS: Using progress key:', progressKey);
      console.log('📊 VIEW RESULTS: Section progress data:', progressData);
      
      if (progressData && progressData.sessionId) {
        // Navigate directly to the test taking page in review mode
        console.log('📊 Viewing results for section:', section.name, 'sessionId:', progressData.sessionId);
        const targetUrl = `/test/practice/${sectionId}/${progressData.sessionId}?review=true&sectionName=${encodeURIComponent(section.name)}&testMode=${testId}`;
        console.log('📊 VIEW RESULTS: Navigating to URL:', targetUrl);
        console.log('📊 VIEW RESULTS: URL breakdown:', {
          testType: 'practice',
          sectionId: sectionId,
          sessionId: progressData.sessionId,
          sectionName: section.name,
          review: true
        });
        navigate(targetUrl);
      } else {
        console.error('📊 VIEW RESULTS: No progress data or session ID found!');
        console.error('📊 VIEW RESULTS: progressData:', progressData);
        console.error('📊 VIEW RESULTS: progressData.sessionId:', progressData?.sessionId);
      }
    } else {
      // View results for entire test (all completed sections)
      const test = practiceTests.find(t => t.id === testId);
      if (!test) return;
      
      // Find the first completed section to show results
      const completedSection = test.sections.find(s => s.status === 'completed');
      if (completedSection) {
        const progressData = sectionProgress[completedSection.name];
        if (progressData && progressData.sessionId) {
          console.log('📊 Viewing results for test:', test.name, 'starting with section:', completedSection.name);
          navigate(`/test/practice/${completedSection.id}/${progressData.sessionId}?review=true&sectionName=${encodeURIComponent(completedSection.name)}`);
        }
      }
    }
  };

  const getSectionButtonText = (status: string) => {
    switch (status) {
      case 'not-started':
        return 'Start Section';
      case 'in-progress':
        return 'Resume Section';
      case 'completed':
        return 'View Results';
      default:
        return 'Start Section';
    }
  };

  const getSectionButtonIcon = (status: string) => {
    switch (status) {
      case 'not-started':
        return <Play size={14} className="mr-1" />;
      case 'in-progress':
        return <ArrowRight size={14} className="mr-1" />;
      case 'completed':
        return <RotateCcw size={14} className="mr-1" />;
      default:
        return <Play size={14} className="mr-1" />;
    }
  };

  // Access control - show paywall if user doesn't have access to current product
  if (isPaywallUIEnabled() && !hasAccessToCurrentProduct && currentProduct) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-edu-light-blue via-white to-edu-light-blue/50">
        <PaywallComponent 
          product={currentProduct} 
          className="min-h-screen"
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-edu-teal mx-auto mb-4"></div>
          <p className="text-gray-600">Loading test data...</p>
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

  if (practiceTests.length === 0) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-6">Practice Tests</h2>
        </div>
        
        <Card className="p-8 text-center">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Practice Tests Available</h3>
          <p className="text-gray-600">Practice tests for this test type are coming soon.</p>
          <div className="mt-4 text-sm text-gray-500">
            Note: Drill exercises and diagnostic tests are available in their dedicated sections.
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <HeroBanner 
        title="Practice Tests"
        subtitle="Take comprehensive practice tests to simulate the real exam experience"
        metrics={[
          {
            icon: <Trophy size={16} />,
            label: "Tests Completed",
            value: completedTests.toString()
          },
          {
            icon: <Clock size={16} />,
            label: "In Progress",
            value: inProgressTests.toString()
          },
          {
            icon: <BarChart3 size={16} />,
            label: "Average Score",
            value: isNaN(averageScore) ? '0%' : `${Math.round(averageScore)}%`
          }
        ]}
        {...(practiceTests.length === 0 || !practiceTests.some(t => t.totalQuestions > 0)) && {
          warning: {
            icon: <AlertCircle size={16} />,
            message: "Practice tests for this test type are coming soon..."
          }
        }}
        className="bg-gradient-to-r from-rose-500 to-rose-800"
      />

      {/* Development Tools */}
      <DeveloperTools 
        testType="practice" 
        selectedProduct={selectedProduct} 
        onDataChanged={() => window.location.reload()}
      />

      {/* Practice Tests List - Single Column */}
      <div>
        <h2 className="text-2xl font-bold mb-6 text-slate-900">
          Full-Length Practice Tests
        </h2>
        
        {practiceTests.length === 0 ? (
          <Card className="p-12 text-center bg-white border border-slate-200">
            <AlertCircle className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-slate-700">No Tests Available</h3>
            <p className="text-slate-600">Questions for this test type are coming soon.</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {practiceTests.map((test) => (
              <Card 
                key={test.id} 
                className={cn(
                  "transition-all duration-300 bg-white border border-slate-200/60 hover:shadow-xl hover:shadow-slate-200/50 rounded-xl sm:rounded-2xl overflow-hidden",
                  "mx-2 sm:mx-0",
                  test.totalQuestions > 0 ? "hover:border-edu-teal/30 sm:hover:-translate-y-1" : "opacity-60",
                  getStatusColor(test.status)
                )}
              >
                <CardHeader 
                  className="pb-3 sm:pb-4 bg-gradient-to-r from-slate-50/30 to-white p-3 sm:p-4 md:p-6"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                    <div className="flex items-center space-x-3 sm:space-x-4 w-full sm:w-auto">
                      <div className="p-3 sm:p-4 bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl sm:rounded-2xl shadow-lg flex-shrink-0">
                        <FileText className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg sm:text-xl font-bold text-slate-900 truncate">{test.name}</CardTitle>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1 sm:mt-2">
                          <div className="flex items-center space-x-1 sm:space-x-2 text-edu-navy bg-edu-teal/10 rounded-full px-2 sm:px-3 py-1">
                            <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            <span className="font-medium text-xs">{test.sections.length} sections</span>
                          </div>
                          <div className="flex items-center space-x-1 sm:space-x-2 text-edu-navy bg-edu-teal/10 rounded-full px-2 sm:px-3 py-1">
                            <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            <span className="font-medium text-xs">{formatTimeToHours(test.estimatedTime)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto justify-end sm:justify-start">
                      {test.status === 'completed' && (
                        <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0 rounded-full text-xs px-2 py-1">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          <span className="hidden xs:inline">Completed</span>
                          <span className="xs:hidden">✓</span>
                        </Badge>
                      )}
                      {test.status === 'in-progress' && (
                        <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white border-0 rounded-full text-xs px-2 py-1">
                          <Timer className="w-3 h-3 mr-1" />
                          <span className="hidden xs:inline">In Progress</span>
                          <span className="xs:hidden">⏱</span>
                        </Badge>
                      )}
                      {test.status === 'not-started' && (
                        <Badge className="bg-gradient-to-r from-slate-400 to-slate-500 text-white border-0 rounded-full text-xs px-2 py-1">
                          <span className="hidden xs:inline">Not Started</span>
                          <span className="xs:hidden">○</span>
                        </Badge>
                      )}
                      {test.totalQuestions > 0 && (
                        <Button 
                          size="sm"
                          variant="ghost"
                          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTestExpand(test.id);
                          }}
                        >
                          {expandedTest === test.id ? 
                            <ChevronUp size={20} className="text-slate-600" /> : 
                            <ChevronDown size={20} className="text-slate-600" />
                          }
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="bg-white p-3 sm:p-4 md:p-6">
                  {test.totalQuestions === 0 ? (
                    <div className="text-center py-6 sm:py-8">
                      <AlertCircle className="h-8 w-8 sm:h-12 sm:w-12 text-slate-400 mx-auto mb-3" />
                      <p className="text-slate-500 font-medium text-sm sm:text-base">Questions coming soon</p>
                    </div>
                  ) : (
                    <>
                      {/* Collapsed View - Summary */}
                      {expandedTest !== test.id && (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 pt-3 sm:pt-4 border-t border-slate-100">
                          <div className="text-xs sm:text-sm text-slate-600 w-full sm:w-auto">
                            {test.lastAttempt ? (
                              <div className="flex items-center space-x-1 sm:space-x-2">
                                <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                                <span className="truncate">Last attempt: {test.lastAttempt}</span>
                              </div>
                            ) : (
                              <span>Ready to start</span>
                            )}
                          </div>
                          {test.status === 'completed' && (
                            <Button 
                              size="sm"
                              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium rounded-full px-3 sm:px-4 py-1.5 sm:py-2 transition-all duration-200 shadow-sm hover:shadow-md text-xs sm:text-sm w-full sm:w-auto"
                              onClick={() => setExpandedTest(expandedTest === test.id ? null : test.id)}
                            >
                              <BarChart3 className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-2" />
                              <span className="hidden xs:inline">View Results</span>
                              <span className="xs:hidden">Results</span>
                            </Button>
                          )}
                        </div>
                      )}

                      {/* Expanded View - Sections */}
                      {expandedTest === test.id && (
                        <div className="space-y-4 pt-4 border-t border-slate-100">
                          {/* Sections List */}
                          <div className="space-y-4">
                            <h4 className="font-semibold text-slate-900">Test Sections</h4>
                            <div className="grid gap-4">
                              {test.sections.map((section, index) => (
                                <div 
                                  key={section.id}
                                  className={cn(
                                    "p-4 rounded-lg border-2 transition-all duration-200",
                                    section.questions > 0 ? "hover:shadow-md" : "opacity-60",
                                    getStatusColor(section.status)
                                  )}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-3 mb-2">
                                        <div className="flex items-center justify-center w-8 h-8 bg-rose-100 rounded-full">
                                          <span className="text-sm font-bold text-rose-600">{index + 1}</span>
                                        </div>
                                        <div>
                                          <h5 className="font-semibold text-slate-900">{section.name}</h5>
                                          <div className="flex items-center space-x-3 text-sm text-slate-600">
                                            <div className="flex items-center space-x-1">
                                              <BookOpen size={12} />
                                              <span>{section.questions} questions</span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                              <Timer size={12} />
                                              <span>{section.timeLimit} min</span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {section.score && (
                                        <div className="mt-2">
                                          {/* Removed tick and 'section completed' text */}
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="ml-4 flex items-center space-x-3">
                                      {section.status === 'completed' && (
                                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                                          <CheckCircle2 size={12} className="mr-1" />
                                          Complete
                                        </Badge>
                                      )}
                                      {section.status === 'in-progress' && (
                                        <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                                          In Progress
                                        </Badge>
                                      )}
                                      
                                      {section.questions === 0 ? (
                                        <div className="text-center py-2">
                                          <AlertCircle className="h-5 w-5 text-slate-400 mx-auto mb-1" />
                                          <p className="text-xs text-slate-500">Coming soon</p>
                                        </div>
                                      ) : (
                                        <Button 
                                          size="sm"
                                          className={cn(
                                            "font-medium rounded-full px-4 py-2 transition-all duration-200 shadow-sm hover:shadow-md",
                                            section.status === 'not-started' 
                                              ? 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white' 
                                              : section.status === 'completed'
                                              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white'
                                              : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white'
                                          )}
                                          onClick={() => {
                                            console.log(`🔘 BUTTON CLICK: Section "${section.name}" status: "${section.status}"`);
                                            console.log(`🔘 BUTTON CLICK: test.id: "${test.id}", section.id: "${section.id}"`);
                                            
                                            if (section.status === 'completed') {
                                              console.log('🔘 BUTTON CLICK: Calling handleViewResults');
                                              handleViewResults(test.id, section.id);
                                            } else {
                                              console.log('🔘 BUTTON CLICK: Calling handleStartSection');
                                              handleStartSection(test.id, section.id);
                                            }
                                          }}
                                        >
                                          {getSectionButtonIcon(section.status)}
                                          {getSectionButtonText(section.status)}
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

export default PracticeTests; 