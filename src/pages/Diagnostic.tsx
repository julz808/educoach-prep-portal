import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { HeroBanner } from '@/components/ui/hero-banner';
import { 
  BookOpen, Clock, Target, Trophy, BarChart3, 
  ArrowRight, ChevronLeft, Calendar, User, Award, AlertCircle,
  CheckCircle2, Timer, Users, FileText, ChevronDown, ChevronUp, Play, RotateCcw, Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProduct } from '@/context/ProductContext';
import { useNavigate } from 'react-router-dom';
import { 
  fetchDiagnosticModes, 
  type TestMode, 
  type TestSection 
} from '@/services/supabaseQuestionService';
import { TEST_STRUCTURES } from '@/data/curriculumData';
import { SessionPersistenceService, SectionProgress } from '@/services/sessionPersistenceService';
import { useAuth } from '@/context/AuthContext';

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
  
  const { selectedProduct } = useProduct();
  const navigate = useNavigate();
  const { user } = useAuth();
  
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
        if (user) {
          console.log('👤 User is authenticated, loading progress for:', user.id);
          const progressData = await SessionPersistenceService.getDiagnosticProgress(
            user.id, 
            selectedProduct
          );
          setSectionProgress(progressData);
          console.log('📊 Progress data loaded:', progressData);
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
      
      // If no exact match, try partial matching for section names
      if (!sectionProgressData) {
        const progressKeys = Object.keys(progressData);
        
        // Look for partial matches (case-insensitive)
        const partialMatch = progressKeys.find(key => {
          const keyLower = key.toLowerCase();
          const sectionLower = section.name.toLowerCase();
          
          // Check if either contains the other (for cases like "General Ability - Quantitative" vs "General Ability")
          return keyLower.includes(sectionLower) || 
                 sectionLower.includes(keyLower) ||
                 // Check for common words (but exclude very short words)
                 keyLower.split(/[\s-]+/).some(word => 
                   word.length > 3 && sectionLower.includes(word)
                 ) ||
                 sectionLower.split(/[\s-]+/).some(word => 
                   word.length > 3 && keyLower.includes(word)
                 );
        });
        
        if (partialMatch) {
          sectionProgressData = progressData[partialMatch];
          console.log(`🔄 Found partial match for "${section.name}": using progress from "${partialMatch}"`);
        }
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
        console.log(`✅ Found progress for "${section.name}": ${status}`);
        // Calculate score if completed (this would come from actual test results)
        if (status === 'completed' && sectionProgressData.questionsCompleted > 0) {
          // This is a placeholder - in real implementation, score would come from test results
          score = Math.floor(Math.random() * 20) + 80; // Mock score between 80-100
        }
      } else {
        console.log(`❌ No progress found for "${section.name}"`);
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
    
    console.log('🎯 handleStartSection called:', {
      sectionId,
      sectionName,
      section: section ? { id: section.id, name: section.name, status: section.status } : null,
      availableProgress: Object.keys(sectionProgress),
      sectionProgressDetails: sectionProgress
    });
    
    if (section && section.questions > 0) {
      // Check if this section has an in-progress session with improved matching
      let sectionProgressData = sectionProgress[section.name] || sectionProgress[section.id];
      
      // If no exact match, try partial matching for section names
      if (!sectionProgressData) {
        const progressKeys = Object.keys(sectionProgress);
        
        // Look for partial matches (case-insensitive)
        const partialMatch = progressKeys.find(key => {
          const keyLower = key.toLowerCase();
          const sectionLower = section.name.toLowerCase();
          
          // Check if either contains the other (for cases like "General Ability - Quantitative" vs "General Ability")
          return keyLower.includes(sectionLower) || 
                 sectionLower.includes(keyLower) ||
                 // Check for common words (but exclude very short words)
                 keyLower.split(/[\s-]+/).some(word => 
                   word.length > 3 && sectionLower.includes(word)
                 ) ||
                 sectionLower.split(/[\s-]+/).some(word => 
                   word.length > 3 && keyLower.includes(word)
                 );
        });
        
        if (partialMatch) {
          sectionProgressData = sectionProgress[partialMatch];
          console.log(`🔄 Found partial match for "${section.name}": using progress from "${partialMatch}"`);
        }
      }
      
      console.log('🔍 Section progress lookup:', {
        sectionName: section.name,
        sectionId: section.id,
        progressByName: sectionProgress[section.name],
        progressById: sectionProgress[section.id],
        finalProgressData: sectionProgressData,
        availableProgressKeys: Object.keys(sectionProgress),
        sessionIdFromProgress: sectionProgressData?.sessionId,
        statusFromProgress: sectionProgressData?.status,
        hasSessionId: !!sectionProgressData?.sessionId,
        sessionIdType: typeof sectionProgressData?.sessionId,
        fullSectionProgress: sectionProgress,
        sectionProgressDataStructure: sectionProgressData ? Object.keys(sectionProgressData) : 'No data'
      });
      
      if (sectionProgressData && sectionProgressData.status === 'in-progress' && sectionProgressData.sessionId) {
        // Resume existing session
        console.log('🔄 Resuming session:', {
          sessionId: sectionProgressData.sessionId,
          sectionName: section.name,
          navigateUrl: `/test/diagnostic/${sectionId}/${sectionProgressData.sessionId}?sectionName=${encodeURIComponent(section.name)}`
        });
        navigate(`/test/diagnostic/${sectionId}/${sectionProgressData.sessionId}?sectionName=${encodeURIComponent(section.name)}`);
      } else {
        // Start new session
        console.log('🆕 Starting new session for section:', {
          sectionName: section.name,
          reason: !sectionProgressData ? 'No progress data' : 
                  sectionProgressData.status !== 'in-progress' ? `Status is ${sectionProgressData.status}` :
                  !sectionProgressData.sessionId ? 'No session ID' : 'Unknown',
          progressData: sectionProgressData,
          navigateUrl: `/test/diagnostic/${sectionId}?sectionName=${encodeURIComponent(section.name)}`
        });
        navigate(`/test/diagnostic/${sectionId}?sectionName=${encodeURIComponent(section.name)}`);
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
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
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
                      {diagnosticTest.status === 'completed' && (
                        <Button 
                          size="sm"
                          className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium rounded-full px-4 py-2 transition-all duration-200 shadow-sm hover:shadow-md"
                          onClick={() => {
                            // Navigate to results page - you can implement this
                            console.log('View Results clicked for diagnostic test');
                          }}
                        >
                          <BarChart3 size={14} className="mr-1" />
                          View Results
                        </Button>
                      )}
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
                                        "font-medium rounded-full px-4 py-2 transition-all duration-200 shadow-sm hover:shadow-md",
                                        section.status === 'completed' 
                                          ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300" 
                                          : section.status === 'in-progress'
                                          ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
                                          : "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
                                      )}
                                      onClick={() => handleStartSection(section.id, section.name)}
                                    >
                                      {getSectionButtonIcon(section.status)}
                                      <span className="ml-1">{getSectionButtonText(section.status)}</span>
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
