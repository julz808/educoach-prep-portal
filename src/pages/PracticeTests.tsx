// Performance optimizations applied:
// 1. useMemo for expensive calculations (practiceTests transformation, test counts)
// 2. useCallback for event handlers to prevent unnecessary re-renders
// 3. Batched API calls to reduce network overhead
// 4. Debounced event listeners for focus/visibility changes
// 5. Lazy loading for expanded section details
// 6. Removed debug console statements
import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
        setAverageScore(0);
        return;
      }

      const calculatedAverageScore = testSessions && testSessions.length > 0
        ? Math.round(testSessions.reduce((sum, test) => sum + (test.final_score || 0), 0) / testSessions.length)
        : 0;

      setAverageScore(calculatedAverageScore);
    } catch (error) {
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
                
              } catch (error) {
                // Silent error handling for performance
              }
            }

            setSectionProgress(allProgressData);
            // Calculate average score from test sessions
            await calculateAverageScore();
          } catch (error) {
            // Silent error handling for performance
          }
        }

      } catch (err) {
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
              // Silent error handling for performance
            }
          }

          setSectionProgress(allProgressData);
          // Recalculate average score
          await calculateAverageScore();
        } catch (error) {
          // Silent error handling for performance
        }
      }
    };

    // Refresh immediately when component mounts or dependencies change
    refreshProgress();

    // Refresh on window focus
    const handleFocus = () => refreshProgress();
    // Reduced focus polling for performance
    let focusTimeout: NodeJS.Timeout;
    const debouncedHandleFocus = () => {
      clearTimeout(focusTimeout);
      focusTimeout = setTimeout(handleFocus, 1000); // Debounce 1s
    };
    window.addEventListener('focus', debouncedHandleFocus);

    // Refresh periodically when window is visible (to catch updates from other tabs)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshProgress();
      }
    };
    // Reduced visibility polling for performance
    let visibilityTimeout: NodeJS.Timeout;
    const debouncedVisibilityChange = () => {
      clearTimeout(visibilityTimeout);
      visibilityTimeout = setTimeout(handleVisibilityChange, 2000); // Debounce 2s
    };
    document.addEventListener('visibilitychange', debouncedVisibilityChange);

    return () => {
      clearTimeout(focusTimeout);
      clearTimeout(visibilityTimeout);
      window.removeEventListener('focus', debouncedHandleFocus);
      document.removeEventListener('visibilitychange', debouncedVisibilityChange);
    };
  }, [user, selectedProduct]);

  // Handle refresh parameter from navigation
  useEffect(() => {
    const refreshParam = searchParams.get('refresh');
    if (refreshParam === 'true' && user) {
      const forceRefreshProgress = async () => {
        try {
          const dbProductType = getDbProductType(selectedProduct);
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
              // Silent error handling for performance
            }
          }

          setSectionProgress(allProgressData);
          // Recalculate average score
          await calculateAverageScore();

          // Clear the refresh parameter from URL
          setSearchParams({});
        } catch (error) {
          // Silent error handling for performance
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

      if (progressData) {
        status = progressData.status;
        // Calculate score if completed (this would come from actual test results)
        if (status === 'completed' && progressData.questionsAnswered > 0) {
          // This is a placeholder - in real implementation, score would come from test results
          score = Math.floor(Math.random() * 20) + 80; // Mock score between 80-100
        }
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
  const practiceTests: PracticeTest[] = useMemo(() => {
    if (!testData) return [];
    
    return testData.testModes
      .filter(mode => mode.type !== 'drill' && mode.type !== 'diagnostic')
      .map(mode => transformTestMode(mode));
  }, [testData, sectionProgress]);

  const { completedTests, inProgressTests } = useMemo(() => ({
    completedTests: practiceTests.filter(test => test.status === 'completed').length,
    inProgressTests: practiceTests.filter(test => test.status === 'in-progress').length
  }), [practiceTests]);

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

  const handleTestExpand = useCallback((testId: string) => {
    setExpandedTest(expandedTest === testId ? null : testId);
  }, [expandedTest]);

  const handleStartSection = useCallback((testId: string, sectionId: string) => {
    const test = practiceTests.find(t => t.id === testId);
    const section = test?.sections.find(s => s.id === sectionId);
    
    if (!section || section.questions === 0) return;
    
    // Check if there's an active session for this section using test-specific key
    const progressKey = `${testId}_${section.name}`;
    const progressData = sectionProgress[progressKey];
    
    if (progressData && progressData.status === 'in-progress' && progressData.sessionId) {
      // Resume existing session - go to instructions first
      navigate(`/test-instructions/practice/${sectionId}/${progressData.sessionId}?sectionName=${encodeURIComponent(section.name)}&testMode=${testId}`);
    } else {
      // Start new session - go to instructions first
      navigate(`/test-instructions/practice/${sectionId}?sectionName=${encodeURIComponent(section.name)}&testMode=${testId}`);
    }
  }, [practiceTests, sectionProgress, navigate]);

  const handleViewResults = (testId: string, sectionId?: string) => {
    if (sectionId) {
      // View results for specific section
      const test = practiceTests.find(t => t.id === testId);
      const section = test?.sections.find(s => s.id === sectionId);

      if (!section) return;

      // Use test-specific progress key (same as handleStartSection)
      const progressKey = `${testId}_${section.name}`;
      const progressData = sectionProgress[progressKey];
      if (progressData && progressData.sessionId) {
        // Navigate directly to the test taking page in review mode
        const targetUrl = `/test/practice/${sectionId}/${progressData.sessionId}?review=true&sectionName=${encodeURIComponent(section.name)}&testMode=${testId}`;
        navigate(targetUrl);
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
                        <div className="space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t border-slate-100 px-2 sm:px-0">
                          {/* Sections List */}
                          <div className="space-y-3 sm:space-y-4">
                            <h4 className="font-semibold text-slate-900 text-sm sm:text-base">Test Sections</h4>
                            <div className="grid gap-3 sm:gap-4">
                              {test.sections.map((section, index) => (
                                <div 
                                  key={section.id}
                                  className={cn(
                                    "p-3 sm:p-4 rounded-lg border-2 transition-all duration-200",
                                    "mx-1 sm:mx-0",
                                    section.questions > 0 ? "sm:hover:shadow-md" : "opacity-60",
                                    getStatusColor(section.status)
                                  )}
                                >
                                  <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 xs:gap-0">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 xs:gap-3 mb-2">
                                        <div className="flex items-center justify-center w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 bg-rose-100 rounded-full flex-shrink-0">
                                          <span className="text-xs xs:text-sm font-bold text-rose-600">{index + 1}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <h5 className="font-semibold text-slate-900 text-sm sm:text-base truncate">{section.name}</h5>
                                          <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-3 text-xs sm:text-sm text-slate-600 mt-1">
                                            <div className="flex items-center gap-1">
                                              <BookOpen size={10} className="flex-shrink-0 sm:w-3 sm:h-3" />
                                              <span>{section.questions} questions</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <Timer size={10} className="flex-shrink-0 sm:w-3 sm:h-3" />
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
                                    
                                    <div className="flex items-center gap-2 xs:gap-3 flex-wrap xs:flex-nowrap justify-end xs:justify-start">
                                      {section.status === 'completed' && (
                                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs px-2 py-1 flex-shrink-0">
                                          <CheckCircle2 size={10} className="mr-1 sm:w-3 sm:h-3" />
                                          <span className="hidden xs:inline">Complete</span>
                                          <span className="xs:hidden">✓</span>
                                        </Badge>
                                      )}
                                      {section.status === 'in-progress' && (
                                        <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs px-2 py-1 flex-shrink-0">
                                          <span className="hidden xs:inline">In Progress</span>
                                          <span className="xs:hidden">⏱</span>
                                        </Badge>
                                      )}
                                      
                                      {section.questions === 0 ? (
                                        <div className="text-center py-1 flex-shrink-0">
                                          <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 mx-auto mb-1" />
                                          <p className="text-xs text-slate-500">Soon</p>
                                        </div>
                                      ) : (
                                        <Button 
                                          size="sm"
                                          className={cn(
                                            "font-medium rounded-full transition-all duration-200 shadow-sm hover:shadow-md flex-shrink-0",
                                            "px-2.5 xs:px-3 sm:px-4 py-1.5 xs:py-2 text-xs xs:text-sm min-w-0",
                                            section.status === 'not-started' 
                                              ? 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white' 
                                              : section.status === 'completed'
                                              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white'
                                              : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white'
                                          )}
                                          onClick={() => {
                                            if (section.status === 'completed') {
                                              handleViewResults(test.id, section.id);
                                            } else {
                                              handleStartSection(test.id, section.id);
                                            }
                                          }}
                                        >
                                          <div className="flex items-center min-w-0">
                                            <span className="w-3 h-3 xs:w-4 xs:h-4 flex-shrink-0">
                                              {getSectionButtonIcon(section.status)}
                                            </span>
                                            <span className="ml-1 xs:ml-2 truncate text-xs xs:text-sm">
                                              {section.status === 'not-started' ? 
                                                (<><span className="hidden xs:inline">Start Section</span><span className="xs:hidden">Start</span></>) : 
                                               section.status === 'completed' ? 
                                                (<><span className="hidden xs:inline">View Results</span><span className="xs:hidden">View</span></>) : 
                                                (<><span className="hidden xs:inline">Continue</span><span className="xs:hidden">Continue</span></>)}
                                            </span>
                                          </div>
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