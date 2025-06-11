import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { HeroBanner } from '@/components/ui/hero-banner';
import { 
  BookOpen, Clock, Target, Trophy, BarChart3, 
  ArrowRight, ChevronLeft, Calendar, User, Award, AlertCircle,
  CheckCircle2, Timer, Users, FileText, ChevronDown, ChevronUp, Play, RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProduct } from '@/context/ProductContext';
import { useNavigate } from 'react-router-dom';
import { 
  fetchQuestionsFromSupabase, 
  getPlaceholderTestStructure,
  type TestType,
  type TestMode,
  type TestSection as SupabaseTestSection
} from '@/services/supabaseQuestionService';
import { supabase } from '@/integrations/supabase/client';
import { TEST_STRUCTURES } from '@/data/curriculumData';

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
  const [testData, setTestData] = useState<TestType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedTest, setExpandedTest] = useState<string | null>(null);
  const { selectedProduct } = useProduct();

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
        // DEBUG: Test direct query from component
        console.log('🔧 DEBUG: Testing direct query from component...');
        const { data: directTest, error: directError } = await supabase
          .from('questions')
          .select('id, test_mode, test_type, section_name')
          .eq('test_type', 'VIC Selective Entry (Year 9 Entry)')
          .eq('test_mode', 'practice_2')
          .limit(3);
        
        console.log('🔧 DEBUG: Direct component query result:', directTest?.length, directError);
        
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
  }, [selectedProduct]);

  // Transform Supabase data to component format - exclude drill and diagnostic modes
  const transformTestMode = (testMode: TestMode): PracticeTest => {
    const sections: TestSection[] = testMode.sections.map((section, index) => {
      // Add mock completion data for some sections
      let mockStatus: 'not-started' | 'in-progress' | 'completed' = 'not-started';
      let mockScore: number | undefined = undefined;
      
      // Mock data pattern based on test mode and section index
      if (testMode.name.includes('Practice Test 1')) {
        if (index === 0) {
          mockStatus = 'completed';
          mockScore = 85;
        } else if (index === 1) {
          mockStatus = 'in-progress';
        }
      } else if (testMode.name.includes('Practice Test 2')) {
        if (index === 0) {
          mockStatus = 'completed';
          mockScore = 92;
        } else if (index === 1) {
          mockStatus = 'completed';
          mockScore = 78;
        } else if (index === 2) {
          mockStatus = 'in-progress';
        }
      } else if (testMode.name.includes('Practice Test 3')) {
        // Fully completed test
        mockStatus = 'completed';
        mockScore = [88, 91, 85, 79, 92][index] || 88;
      }

      return {
        id: section.id,
        name: section.name,
        questions: section.totalQuestions,
        timeLimit: getSectionTimeLimit(testData?.name || '', section.name),
        status: mockStatus,
        score: mockScore,
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

    // Add mock last attempt dates for tests with progress
    if (testStatus !== 'not-started') {
      const dates = ['Dec 15, 2024', 'Dec 12, 2024', 'Dec 10, 2024'];
      lastAttempt = dates[Math.floor(Math.random() * dates.length)];
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
      .map(transformTestMode) : [];

  const completedTests = practiceTests.filter(test => test.status === 'completed').length;
  const inProgressTests = practiceTests.filter(test => test.status === 'in-progress').length;
  const averageScore = practiceTests
    .filter(test => test.bestScore)
    .reduce((acc, test) => acc + (test.bestScore || 0), 0) / 
    practiceTests.filter(test => test.bestScore).length || 0;

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
    
    if (section && section.questions > 0) {
      navigate(`/test/practice/${sectionId}?sectionName=${encodeURIComponent(section.name)}`);
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
                  "transition-all duration-300 bg-white border border-slate-200/60 hover:shadow-xl hover:shadow-slate-200/50 rounded-2xl overflow-hidden",
                  test.totalQuestions > 0 ? "hover:border-edu-teal/30 hover:-translate-y-1" : "opacity-60",
                  getStatusColor(test.status)
                )}
              >
                <CardHeader 
                  className="pb-4 bg-gradient-to-r from-slate-50/30 to-white"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-4 bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl shadow-lg">
                        <FileText size={28} className="text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold text-slate-900">{test.name}</CardTitle>
                        <div className="flex items-center space-x-3 mt-2">
                          <div className="flex items-center space-x-2 text-edu-navy bg-edu-teal/10 rounded-full px-3 py-1">
                            <Users size={14} />
                            <span className="font-medium text-xs">{test.sections.length} sections</span>
                          </div>
                          <div className="flex items-center space-x-2 text-edu-navy bg-edu-teal/10 rounded-full px-3 py-1">
                            <Clock size={14} />
                            <span className="font-medium text-xs">{formatTimeToHours(test.estimatedTime)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {test.status === 'completed' && (
                        <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0 rounded-full">
                          <CheckCircle2 size={12} className="mr-1" />
                          Completed
                        </Badge>
                      )}
                      {test.status === 'in-progress' && (
                        <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white border-0 rounded-full">
                          <Timer size={12} className="mr-1" />
                          In Progress
                        </Badge>
                      )}
                      {test.status === 'not-started' && (
                        <Badge className="bg-gradient-to-r from-slate-400 to-slate-500 text-white border-0 rounded-full">
                          Not Started
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
                
                <CardContent className="bg-white">
                  {test.totalQuestions === 0 ? (
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                      <p className="text-slate-500 font-medium">Questions coming soon</p>
                    </div>
                  ) : (
                    <>
                      {/* Collapsed View - Summary */}
                      {expandedTest !== test.id && (
                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                          <div className="text-sm text-slate-600">
                            {test.lastAttempt ? (
                              <div className="flex items-center space-x-2">
                                <Calendar size={12} />
                                <span>Last attempt: {test.lastAttempt}</span>
                              </div>
                            ) : (
                              <span>Ready to start</span>
                            )}
                          </div>
                          {test.status === 'completed' && (
                            <Button 
                              size="sm"
                              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium rounded-full px-4 py-2 transition-all duration-200 shadow-sm hover:shadow-md"
                              onClick={() => {
                                // Navigate to results page - you can implement this
                                console.log('View Results clicked for practice test:', test.id);
                              }}
                            >
                              <BarChart3 size={14} className="mr-1" />
                              View Results
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
                                          onClick={() => handleStartSection(test.id, section.id)}
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