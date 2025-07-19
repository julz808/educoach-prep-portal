import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { HeroBanner } from '@/components/ui/hero-banner';
import { 
  BookOpen, Clock, Target, Trophy, BarChart3, 
  ArrowRight, ChevronLeft, Calendar, User, Award, AlertCircle,
  CheckCircle2, Timer, Users, FileText, ChevronDown, ChevronUp, Play, RotateCcw, Activity,
  Trash2, CheckCircle, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProduct } from '@/context/ProductContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PaywallComponent } from '@/components/PaywallComponent';
import { isPaywallUIEnabled } from '@/config/stripeConfig';
import { 
  fetchDiagnosticModes, 
  type TestMode, 
  type TestSection 
} from '@/services/supabaseQuestionService';
import { TEST_STRUCTURES } from '@/data/curriculumData';
import { SessionService, SectionProgress } from '@/services/sessionService';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { DeveloperTools } from '@/components/DeveloperTools';

interface DiagnosticSection {
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

interface DiagnosticTest {
  id: string;
  name: string;
  description: string;
  sections: DiagnosticSection[];
  totalQuestions: number;
  estimatedTime: number;
  status: 'not-started' | 'in-progress' | 'completed';
  bestScore?: number;
  lastAttempt?: string;
}

const DiagnosticTests: React.FC = () => {
  console.log('🔥 DiagnosticTests component is rendering!');
  
  const { selectedProduct, currentProduct, hasAccessToCurrentProduct } = useProduct();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [diagnosticModes, setDiagnosticModes] = useState<TestMode[]>([]);
  const [sectionProgress, setSectionProgress] = useState<Record<string, SectionProgress>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedTest, setExpandedTest] = useState<string | null>(null);

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

  // Helper function to calculate total time from curriculum data
  const calculateTotalTime = (testType: string, sections: DiagnosticSection[]): number => {
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

  // Load diagnostic data and user progress
  useEffect(() => {
    const loadDiagnosticData = async () => {
      console.log('🚀 loadDiagnosticData called with:', { selectedProduct, user: user ? { id: user.id, email: user.email } : null });
      
      setLoading(true);
      setError(null);
      
      try {
        const modes = await fetchDiagnosticModes(selectedProduct);
        setDiagnosticModes(modes);
        console.log('📋 Diagnostic modes loaded:', modes.length, 'modes');
        
        // Load user progress if authenticated
        console.log('👤 User authentication check:', { 
          userExists: !!user, 
          userId: user?.id, 
          userEmail: user?.email,
          selectedProduct 
        });
        
        if (user) {
          console.log('👤 User is authenticated, loading progress for:', user.id, 'product:', selectedProduct);
          
          // Add debugging for product type mapping
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
          
          const dbProductType = getDbProductType(selectedProduct);
          console.log('🔍 DIAGNOSTIC: Query will use productType:', dbProductType, '(from selectedProduct:', selectedProduct, ')');
          
          try {
            console.log('🔍 DIAGNOSTIC: About to call getUserProgress with:', {
              userId: user.id,
              productType: dbProductType,
              testMode: 'diagnostic'
            });
            
            const progressData = await SessionService.getUserProgress(
              user.id, 
              dbProductType,
              'diagnostic'
            );
            
            console.log('📊 Progress data loaded successfully:', progressData);
            console.log('📊 Progress data type:', typeof progressData);
            console.log('📊 Progress data keys:', Object.keys(progressData));
            console.log('📊 Progress data values:', Object.values(progressData));
            
            setSectionProgress(progressData);
          } catch (error) {
            console.error('❌ Error loading diagnostic progress:', error);
          }
        } else {
          console.log('❌ No user found, skipping progress load');
        }
        
        // Set the diagnostic card to be expanded by default if there's data
        if (modes.length > 0 && modes[0].sections.length > 0) {
          setExpandedTest(modes[0].id);
        }
      } catch (err) {
        console.error('Error loading diagnostic data:', err);
        setError('Failed to load diagnostic data');
      } finally {
        setLoading(false);
      }
    };

    loadDiagnosticData();
  }, [selectedProduct, user]);
  
  // Reload progress when returning to page
  useEffect(() => {
    const refreshProgress = async () => {
      if (user) {
        try {
          console.log('🔄 REFRESH: Refreshing progress data...');
          
          // Use the same product mapping as the main load
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
          
          const dbProductType = getDbProductType(selectedProduct);
          console.log('🔄 REFRESH: Using productType:', dbProductType, '(from selectedProduct:', selectedProduct, ')');
          
          const progressData = await SessionService.getUserProgress(user.id, dbProductType, 'diagnostic');
          setSectionProgress(progressData);
          console.log('🔄 REFRESH: Progress refreshed with data:', progressData);
          
          // Log status of each section for debugging
          Object.entries(progressData).forEach(([sectionName, progress]) => {
            console.log(`🔄 REFRESH: Section "${sectionName}" - Status: ${progress.status}, SessionID: ${progress.sessionId}`);
          });
        } catch (error) {
          console.error('Error refreshing progress:', error);
        }
      }
    };

    // Refresh on window focus
    const handleFocus = () => {
      console.log('🔄 REFRESH: Window focused, refreshing progress...');
      refreshProgress();
    };
    window.addEventListener('focus', handleFocus);
    
    return () => window.removeEventListener('focus', handleFocus);
  }, [user, selectedProduct]);

  // Add manual refresh function for debugging
  const manualRefresh = async () => {
    console.log('🔄 MANUAL REFRESH: Starting manual refresh...');
    if (user) {
      try {
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
        
        const dbProductType = getDbProductType(selectedProduct);
        console.log('🔄 MANUAL REFRESH: Using productType:', dbProductType);
        
        const progressData = await SessionService.getUserProgress(user.id, dbProductType, 'diagnostic');
        setSectionProgress(progressData);
        console.log('🔄 MANUAL REFRESH: Fresh progress data:', progressData);
      } catch (error) {
        console.error('🔄 MANUAL REFRESH: Error:', error);
      }
    } else {
      console.log('🔄 MANUAL REFRESH: No user found');
    }
  };

  // Handle refresh parameter from navigation
  useEffect(() => {
    const refreshParam = searchParams.get('refresh');
    if (refreshParam === 'true' && user) {
      console.log('🔄 FORCE REFRESH: Detected refresh parameter, forcing progress reload...');
      
      const forceRefreshProgress = async () => {
        try {
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
          
          const dbProductType = getDbProductType(selectedProduct);
          console.log('🔄 FORCE REFRESH: Loading fresh progress data for:', dbProductType);
          
          const progressData = await SessionService.getUserProgress(user.id, dbProductType, 'diagnostic');
          setSectionProgress(progressData);
          console.log('🔄 FORCE REFRESH: Fresh progress data loaded:', progressData);
          
          // Clear the refresh parameter from URL
          setSearchParams({});
          console.log('🔄 FORCE REFRESH: Cleared refresh parameter from URL');
        } catch (error) {
          console.error('🔄 FORCE REFRESH: Error loading fresh progress:', error);
        }
      };
      
      forceRefreshProgress();
    }
  }, [searchParams, user, selectedProduct, setSearchParams]);

  // Transform diagnostic modes to match our new structure with real progress data
  const transformDiagnosticMode = (mode: TestMode, progressData: Record<string, SectionProgress> = {}): DiagnosticTest => {
    console.log('🔍 Transform diagnostic mode called with:', {
      mode: mode.name,
      sections: mode.sections.map(s => ({ id: s.id, name: s.name })),
      progressData: Object.keys(progressData),
      progressDetails: progressData
    });

    const sections: DiagnosticSection[] = mode.sections.map((section) => {
      // Get real progress data for this section with improved matching
      let sectionProgressData = progressData[section.name] || progressData[section.id];
      
      // If no exact match, only try exact ID match - remove partial matching to prevent cross-section contamination
      if (!sectionProgressData) {
        console.log(`❌ No exact progress match found for "${section.name}" (id: ${section.id})`);
        console.log(`🔍 Available progress keys:`, Object.keys(progressData));
      }
      
      console.log(`🔍 Section "${section.name}" (id: ${section.id}):`, {
        progressByName: progressData[section.name],
        progressById: progressData[section.id],
        finalProgressData: sectionProgressData,
        availableProgressKeys: Object.keys(progressData)
      });
      
      let status: 'not-started' | 'in-progress' | 'completed' = 'not-started';
      let score: number | undefined = undefined;
      
      if (sectionProgressData) {
        status = sectionProgressData.status;
        console.log(`✅ Found progress for "${section.name}": ${status} (sessionId: ${sectionProgressData.sessionId})`);
        console.log(`🔍 Progress details:`, {
          status: sectionProgressData.status,
          questionsAnswered: sectionProgressData.questionsAnswered,
          totalQuestions: sectionProgressData.totalQuestions,
          sessionId: sectionProgressData.sessionId
        });
        // Calculate score if completed (this would come from actual test results)
        if (status === 'completed' && sectionProgressData.questionsCompleted > 0) {
          // This is a placeholder - in real implementation, score would come from test results
          score = Math.floor(Math.random() * 20) + 80; // Mock score between 80-100
        }
      } else {
        console.log(`❌ No progress found for "${section.name}"`);
        console.log(`🔍 Available progress keys:`, Object.keys(progressData));
        console.log(`🔍 Full progress data:`, progressData);
      }

      return {
        id: section.id,
        name: section.name,
        questions: section.totalQuestions,
        timeLimit: getSectionTimeLimit(selectedProduct, section.name),
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
    const calculatedTime = calculateTotalTime(selectedProduct, sections);
    const finalTime = calculatedTime > 0 ? calculatedTime : mode.estimatedTime;

    // Determine overall test status and best score based on sections
    let testStatus: 'not-started' | 'in-progress' | 'completed' = 'not-started';
    let bestScore: number | undefined = undefined;
    let lastAttempt: string | undefined = undefined;

    const completedSections = sections.filter(s => s.status === 'completed');
    const inProgressSections = sections.filter(s => s.status === 'in-progress');
    
    if (completedSections.length === sections.length && sections.length > 0) {
      testStatus = 'completed';
      const scoresWithValues = completedSections.filter(s => s.score).map(s => s.score!);
      if (scoresWithValues.length > 0) {
        bestScore = Math.round(scoresWithValues.reduce((a, b) => a + b, 0) / scoresWithValues.length);
      }
    } else if (completedSections.length > 0 || inProgressSections.length > 0) {
      testStatus = 'in-progress';
      const scoresWithValues = completedSections.filter(s => s.score).map(s => s.score!);
      if (scoresWithValues.length > 0) {
        bestScore = Math.round(scoresWithValues.reduce((a, b) => a + b, 0) / scoresWithValues.length);
      }
    }

    // Add real last attempt date if there's progress
    if (testStatus !== 'not-started' && Object.keys(progressData).length > 0) {
      const latestProgress = Object.values(progressData).reduce((latest, current) => {
        return new Date(current.lastUpdated) > new Date(latest.lastUpdated) ? current : latest;
      });
      lastAttempt = new Date(latestProgress.lastUpdated).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }

    return {
      id: mode.id,
      name: 'Diagnostic Assessment',
      description: mode.description || 'Comprehensive diagnostic test to identify strengths and areas for improvement',
      sections,
      totalQuestions: mode.totalQuestions,
      estimatedTime: finalTime,
      status: testStatus,
      bestScore,
      lastAttempt,
    };
  };

  const diagnosticTests: DiagnosticTest[] = diagnosticModes.map(mode => transformDiagnosticMode(mode, sectionProgress));
  const diagnosticTest = diagnosticTests.length > 0 ? diagnosticTests[0] : null; // Single test

  const completedSections = diagnosticTest ? diagnosticTest.sections.filter(s => s.status === 'completed').length : 0;
  const inProgressSections = diagnosticTest ? diagnosticTest.sections.filter(s => s.status === 'in-progress').length : 0;
  const averageScore = diagnosticTest && diagnosticTest.bestScore ? diagnosticTest.bestScore : 0;

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

  const handleTestExpand = () => {
    if (diagnosticTest) {
      setExpandedTest(expandedTest === diagnosticTest.id ? null : diagnosticTest.id);
    }
  };

  const handleStartSection = (sectionId: string, sectionName: string) => {
    const section = diagnosticTest?.sections.find(s => s.id === sectionId);
    
    if (!section || section.questions === 0) return;
    
    // Check if there's an active session for this section
    const progressData = sectionProgress[sectionName];
    
    if (progressData && progressData.status === 'in-progress' && progressData.sessionId) {
      // Resume existing session - go to instructions first
      console.log('🔄 Resuming session:', progressData.sessionId);
      navigate(`/test-instructions/diagnostic/${sectionId}/${progressData.sessionId}?sectionName=${encodeURIComponent(sectionName)}`);
    } else {
      // Start new session - go to instructions first
      console.log('🆕 Starting new session for:', sectionName);
      navigate(`/test-instructions/diagnostic/${sectionId}?sectionName=${encodeURIComponent(sectionName)}`);
    }
  };

  const handleViewResults = (sectionId?: string) => {
    console.log('🔍 handleViewResults called with sectionId:', sectionId);
    console.log('🔍 Available sectionProgress:', sectionProgress);
    
    if (sectionId) {
      // View results for specific section
      const section = diagnosticTest?.sections.find(s => s.id === sectionId);
      console.log('🔍 Found section:', section);
      
      if (!section) {
        console.log('❌ No section found for id:', sectionId);
        return;
      }
      
      const progressData = sectionProgress[section.name];
      console.log('🔍 Progress data for section', section.name, ':', progressData);
      
      if (progressData && progressData.sessionId) {
        // Navigate directly to the test taking page in review mode
        console.log('📊 Viewing results for section:', section.name, 'sessionId:', progressData.sessionId);
        navigate(`/test/diagnostic/${sectionId}/${progressData.sessionId}?review=true&sectionName=${encodeURIComponent(section.name)}`);
      } else {
        console.log('❌ No session ID found in progress data');
        // Try to find a completed session directly from the database
        findCompletedSession(section.name, sectionId);
      }
    } else {
      // View results for entire test (all completed sections)
      if (!diagnosticTest) {
        console.log('❌ No diagnostic test available');
        return;
      }
      
      // Find the first completed section to show results
      const completedSection = diagnosticTest.sections.find(s => s.status === 'completed');
      if (completedSection) {
        const progressData = sectionProgress[completedSection.name];
        if (progressData && progressData.sessionId) {
          console.log('📊 Viewing results for test:', diagnosticTest.name, 'starting with section:', completedSection.name);
          navigate(`/test/diagnostic/${completedSection.id}/${progressData.sessionId}?review=true&sectionName=${encodeURIComponent(completedSection.name)}`);
        } else {
          console.log('❌ No session ID found for completed section');
          findCompletedSession(completedSection.name, completedSection.id);
        }
      }
    }
  };

  // Helper function to find completed session from database
  const findCompletedSession = async (sectionName: string, sectionId: string) => {
    console.log('🔍 Searching for completed session for:', sectionName);
    
    // Use the same product mapping function
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
    
    const dbProductType = getDbProductType(selectedProduct);
    console.log('🔍 Using dbProductType for session search:', dbProductType, '(from selectedProduct:', selectedProduct, ')');
    
    try {
      const { data: sessions, error } = await supabase
        .from('user_test_sessions')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_type', dbProductType)
        .eq('test_mode', 'diagnostic')
        .eq('section_name', sectionName)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (sessions && sessions.length > 0) {
        const sessionId = sessions[0].id;
        console.log('✅ Found completed session:', sessionId);
        navigate(`/test/diagnostic/${sectionId}/${sessionId}?review=true&sectionName=${encodeURIComponent(sectionName)}`);
      } else {
        console.log('❌ No completed session found in database');
      }
    } catch (error) {
      console.error('Error finding completed session:', error);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-edu-teal mx-auto mb-4"></div>
          <p className="text-gray-600">Loading diagnostic test...</p>
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

  // Check if paywall should be shown
  if (isPaywallUIEnabled() && !hasAccessToCurrentProduct && currentProduct) {
    return (
      <div className="min-h-screen bg-edu-light-blue">
        <PaywallComponent 
          product={currentProduct} 
          className="min-h-screen"
        />
      </div>
    );
  }

  if (!diagnosticTest || diagnosticTest.sections.length === 0) {
    return (
      <div className="space-y-8">
        <HeroBanner 
          title="Diagnostic Assessment"
          subtitle="Comprehensive diagnostic test to identify your strengths and areas for improvement"
          metrics={[
            {
              icon: <Target size={16} />,
              label: "Sections Completed",
              value: "0"
            },
            {
              icon: <Clock size={16} />,
              label: "In Progress",
              value: "0"
            },
            {
              icon: <BarChart3 size={16} />,
              label: "Average Score",
              value: "0%"
            }
          ]}
          warning={{
            icon: <AlertCircle size={16} />,
            message: "Diagnostic test for this test type is coming soon..."
          }}
          className="bg-gradient-to-r from-purple-500 to-purple-700"
        />
        
        <Card className="p-12 text-center bg-white border border-slate-200">
          <Activity className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-slate-700">No Diagnostic Test Available</h3>
          <p className="text-slate-600">Diagnostic test for this test type is coming soon.</p>
        </Card>
      </div>
    );
  }

  // Development utility functions
  const handleClearProgress = async () => {
    if (!user || import.meta.env.PROD) return;
    
    if (confirm('🚨 DEV: Clear all diagnostic progress? This cannot be undone.')) {
      try {
        // Use the same product mapping function as the progress loading
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
        
        const dbProductType = getDbProductType(selectedProduct);
        console.log('🚨 DEV: Clearing progress for dbProductType:', dbProductType, '(from selectedProduct:', selectedProduct, ')');
        
        // Clear all user_test_sessions for this user/product/mode
        const { error: sessionsError } = await supabase
          .from('user_test_sessions')
          .delete()
          .eq('user_id', user.id)
          .eq('product_type', dbProductType)
          .eq('test_mode', 'diagnostic');

        if (sessionsError) throw sessionsError;

        // Clear all test_section_states for this user/product
        const { error: statesError } = await supabase
          .from('test_section_states')
          .delete()
          .eq('user_id', user.id)
          .eq('product_type', dbProductType);

        if (statesError) throw statesError;

        console.log('✅ DEV: Cleared all diagnostic progress');
        
        // Refresh the page data
        window.location.reload();
      } catch (error) {
        console.error('Failed to clear progress:', error);
        alert('Failed to clear progress. Check console for details.');
      }
    }
  };

  const handleHalfComplete = async () => {
    if (!user || import.meta.env.PROD) return;
    
    if (confirm('🚨 DEV: Set half-complete state with mock data?')) {
      try {
        const sections = diagnosticTest?.sections || [];
        
        // Use the same product mapping function as the progress loading
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
        
        const dbProductType = getDbProductType(selectedProduct);
        console.log('🚨 DEV: Creating mock sessions with dbProductType:', dbProductType, '(from selectedProduct:', selectedProduct, ')');
        
        for (let i = 0; i < sections.length; i++) {
          const section = sections[i];
          
          // Create different states: completed, in-progress, or not-started
          let sessionData;
          if (i < Math.floor(sections.length * 0.3)) {
            // 30% completed
            const mockScore = Math.floor(Math.random() * 30) + 70;
            sessionData = {
              user_id: user.id,
              product_type: dbProductType,
              test_mode: 'diagnostic',
              section_name: section.name,
              status: 'completed',
              current_question_index: section.questions,
              total_questions: section.questions,
              final_score: mockScore,
              session_data: {
                answers: {},
                timeRemaining: 0,
                flaggedQuestions: []
              }
            };
          } else if (i < Math.floor(sections.length * 0.6)) {
            // 30% in-progress
            const partialProgress = Math.floor(section.questions * 0.4) + 1; // 40-60% through
            sessionData = {
              user_id: user.id,
              product_type: dbProductType,
              test_mode: 'diagnostic',
              section_name: section.name,
              status: 'active',
              current_question_index: partialProgress,
              total_questions: section.questions,
              final_score: null,
              session_data: {
                answers: {},
                timeRemaining: Math.floor(section.timeLimit * 60 * 0.6), // 60% time remaining
                flaggedQuestions: []
              }
            };
          }
          // 40% remain not-started (no session created)
          
          if (sessionData) {
            const { error: sessionError } = await supabase
              .from('user_test_sessions')
              .insert(sessionData);

            if (sessionError) throw sessionError;
            
            console.log(`✅ DEV: Created mock ${sessionData.status} session for ${section.name}`);
          }
        }
        
        // Refresh the page data
        setTimeout(() => window.location.reload(), 500);
      } catch (error) {
        console.error('Failed to set half-complete state:', error);
        alert('Failed to set half-complete state. Check console for details.');
      }
    }
  };

  const handleFinishAll = async () => {
    if (!user || import.meta.env.PROD) return;
    
    if (confirm('🚨 DEV: Complete all sections with mock data?')) {
      try {
        const sections = diagnosticTest?.sections || [];
        
        // Use the same product mapping function as the progress loading
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
        
        const dbProductType = getDbProductType(selectedProduct);
        console.log('🚨 DEV: Creating all completed sessions with dbProductType:', dbProductType, '(from selectedProduct:', selectedProduct, ')');
        
        for (let i = 0; i < sections.length; i++) {
          const section = sections[i];
          const mockScore = Math.floor(Math.random() * 30) + 70; // 70-100%
          
          // Create mock completed session (let Supabase generate the UUID)
          const { error: sessionError } = await supabase
            .from('user_test_sessions')
            .insert({
              user_id: user.id,
              product_type: dbProductType,
              test_mode: 'diagnostic',
              section_name: section.name,
              status: 'completed',
              current_question_index: section.questions,
              total_questions: section.questions,
              final_score: mockScore,
              session_data: {
                answers: {},
                timeRemaining: 0,
                flaggedQuestions: []
              }
            });

          if (sessionError) throw sessionError;
          
          console.log(`✅ DEV: Created mock session for ${section.name}`);
        }
        
        // Refresh the page data
        setTimeout(() => window.location.reload(), 500);
      } catch (error) {
        console.error('Failed to complete all sections:', error);
        alert('Failed to complete all sections. Check console for details.');
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <HeroBanner 
        title="Diagnostic Assessment"
        subtitle="Comprehensive diagnostic test to identify your strengths and areas for improvement"
        metrics={[
          {
            icon: <Target size={16} />,
            label: "Sections Completed",
            value: completedSections.toString()
          },
          {
            icon: <Clock size={16} />,
            label: "In Progress",
            value: inProgressSections.toString()
          },
          {
            icon: <BarChart3 size={16} />,
            label: "Average Score",
            value: isNaN(averageScore) ? '0%' : `${Math.round(averageScore)}%`
          }
        ]}
        {...(!diagnosticTest.totalQuestions && {
          warning: {
            icon: <AlertCircle size={16} />,
            message: "Diagnostic test for this test type is coming soon..."
          }
        })}
        className="bg-gradient-to-r from-purple-400 to-purple-900"
      />

      {/* Development Tools */}
      <DeveloperTools 
        testType="diagnostic" 
        selectedProduct={selectedProduct} 
        onDataChanged={() => window.location.reload()}
      />
      
      {/* Debug Refresh Button */}
      {!import.meta.env.PROD && (
        <div className="p-4 bg-yellow-100 border border-yellow-300 rounded-lg mb-6">
          <p className="text-sm text-yellow-800 mb-2">🐛 Debug: Click to manually refresh progress data</p>
          <Button onClick={manualRefresh} className="bg-yellow-500 hover:bg-yellow-600">
            Manual Refresh Progress
          </Button>
        </div>
      )}

      {/* Diagnostic Test - Single Column */}
      <div>
        <h2 className="text-2xl font-bold mb-6 text-slate-900">
          Diagnostic Assessment
        </h2>
        
        <div className="space-y-6">
          <Card 
            className={cn(
              "transition-all duration-300 bg-white border border-slate-200/60 hover:shadow-xl hover:shadow-slate-200/50 rounded-2xl overflow-hidden",
              diagnosticTest.totalQuestions > 0 ? "hover:border-edu-teal/30 hover:-translate-y-1" : "opacity-60"
            )}
          >
            <CardHeader className="pb-4 bg-gradient-to-r from-slate-50/30 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg">
                    <Activity size={28} className="text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-slate-900">{diagnosticTest.name}</CardTitle>
                    <div className="flex items-center space-x-3 mt-2">
                      <div className="flex items-center space-x-2 text-edu-navy bg-edu-teal/10 rounded-full px-3 py-1">
                        <Users size={14} />
                        <span className="font-medium text-xs">{diagnosticTest.sections.length} sections</span>
                      </div>
                      <div className="flex items-center space-x-2 text-edu-navy bg-edu-teal/10 rounded-full px-3 py-1">
                        <Clock size={14} />
                        <span className="font-medium text-xs">{formatTimeToHours(diagnosticTest.estimatedTime)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {diagnosticTest.status === 'completed' && (
                    <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0 rounded-full">
                      <CheckCircle2 size={12} className="mr-1" />
                      Completed
                    </Badge>
                  )}
                  {diagnosticTest.status === 'in-progress' && (
                    <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white border-0 rounded-full">
                      <Timer size={12} className="mr-1" />
                      In Progress
                    </Badge>
                  )}
                  {diagnosticTest.status === 'not-started' && (
                    <Badge className="bg-gradient-to-r from-slate-400 to-slate-500 text-white border-0 rounded-full">
                      Not Started
                    </Badge>
                  )}
                  {diagnosticTest.totalQuestions > 0 && (
                    <Button 
                      size="sm"
                      variant="ghost"
                      className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTestExpand();
                      }}
                    >
                      {expandedTest === diagnosticTest.id ? 
                        <ChevronUp size={20} className="text-slate-600" /> : 
                        <ChevronDown size={20} className="text-slate-600" />
                      }
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="bg-white">
              {diagnosticTest.totalQuestions === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">Questions coming soon</p>
                </div>
              ) : (
                <>
                  {/* Collapsed View - Summary */}
                  {expandedTest !== diagnosticTest.id && (
                    <div className="pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-slate-600">
                          {diagnosticTest.lastAttempt ? (
                            <div className="flex items-center space-x-2">
                              <Calendar size={12} />
                              <span>Last attempt: {diagnosticTest.lastAttempt}</span>
                            </div>
                          ) : (
                            <span>Ready to start</span>
                          )}
                        </div>
                        <div>
                          {/* Show View Results if ANY section is completed, not just when all are completed */}
                          {diagnosticTest.sections.some(s => s.status === 'completed') && (
                            <Button 
                              size="sm"
                              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium rounded-full px-4 py-2 transition-all duration-200 shadow-sm hover:shadow-md"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('🔥 View Results button clicked!');
                                console.log('🔥 diagnosticTest.status:', diagnosticTest.status);
                                handleViewResults();
                              }}
                            >
                              <BarChart3 size={14} className="mr-1" />
                              View Results
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Expanded View - Sections */}
                  {expandedTest === diagnosticTest.id && (
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      {/* Sections List */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-slate-900">Assessment Sections</h4>
                        <div className="grid gap-4">
                          {diagnosticTest.sections.map((section, index) => (
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
                                    <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full">
                                      <span className="text-sm font-bold text-purple-600">{index + 1}</span>
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
                                        "font-medium rounded-full px-4 py-2 transition-all duration-200 shadow-sm hover:shadow-md relative z-10",
                                        section.status === 'completed' 
                                          ? "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white cursor-pointer" 
                                          : section.status === 'in-progress'
                                          ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
                                          : "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
                                      )}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        console.log('🔥 Section button clicked!', section.name, 'status:', section.status);
                                        if (section.status === 'completed') {
                                          console.log('🔥 Calling handleViewResults for section:', section.id);
                                          handleViewResults(section.id);
                                        } else {
                                          console.log('🔥 Calling handleStartSection for section:', section.id);
                                          handleStartSection(section.id, section.name);
                                        }
                                      }}
                                    >
                                      {(() => {
                                        console.log(`🔘 BUTTON: Rendering button for "${section.name}" with status: "${section.status}"`);
                                        console.log(`🔘 BUTTON: Button text will be: "${getSectionButtonText(section.status)}"`);
                                        return (
                                          <>
                                            {getSectionButtonIcon(section.status)}
                                            <span className="ml-1">{getSectionButtonText(section.status)}</span>
                                          </>
                                        );
                                      })()}
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
        </div>
      </div>
    </div>
  );
};

export default DiagnosticTests;
