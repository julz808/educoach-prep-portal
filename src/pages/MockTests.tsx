import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { HeroBanner } from '@/components/ui/hero-banner';
import { MetricsCards } from '@/components/ui/metrics-cards';
import { 
  BookOpen, Clock, Target, Play, Trophy, BarChart3, 
  ArrowRight, ChevronLeft, Calendar, User, Award, AlertCircle
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
  const [selectedTest, setSelectedTest] = useState<string | null>(null);
  const [testData, setTestData] = useState<TestType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { selectedProduct } = useProduct();
  const navigate = useNavigate();

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
    const sections: TestSection[] = testMode.sections.map(section => ({
      id: section.id,
      name: section.name,
      questions: section.totalQuestions,
      timeLimit: section.timeLimit || Math.ceil(section.totalQuestions * 1.5),
      status: section.status,
      score: section.score,
      // Convert first few questions to sample format for preview
      sampleQuestions: section.questions.slice(0, 3).map((q, index) => ({
        id: index + 1,
        text: q.text,
        options: q.options,
        correctAnswer: q.options[q.correctAnswer] || 'A',
        explanation: q.explanation,
      }))
    }));

    return {
      id: testMode.id,
      name: testMode.name,
      description: testMode.description || 'Test preparation material',
      sections,
      totalQuestions: testMode.totalQuestions,
      estimatedTime: testMode.estimatedTime,
      difficulty: (testMode.difficulty as 'Easy' | 'Medium' | 'Hard') || 'Medium',
      status: sections.length > 0 && sections.some(s => s.questions > 0) ? 'not-started' : 'not-started',
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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-green-100 text-green-700';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'Hard':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'in-progress':
        return 'border-orange-200 bg-orange-50';
      case 'not-started':
        return 'border-gray-200 bg-white';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  const getTestTypeIcon = (type: 'practice' | 'drill' | 'diagnostic') => {
    switch (type) {
      case 'practice':
        return <Play size={20} className="text-blue-600" />;
      case 'drill':
        return <Target size={20} className="text-orange-600" />;
      case 'diagnostic':
        return <BarChart3 size={20} className="text-purple-600" />;
      default:
        return <BookOpen size={20} className="text-gray-600" />;
    }
  };

  const handleTestSelect = (testId: string) => {
    const test = practiceTests.find(t => t.id === testId);
    if (test && test.totalQuestions > 0) {
      setSelectedTest(testId);
    }
  };

  const handleStartSection = (testId: string, sectionId: string) => {
    const test = practiceTests.find(t => t.id === testId);
    const section = test?.sections.find(s => s.id === sectionId);
    
    if (section && section.questions > 0) {
      navigate(`/test/practice/${sectionId}?sectionName=${encodeURIComponent(section.name)}`);
    }
  };

  const selectedTestData = practiceTests.find(test => test.id === selectedTest);

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
          <Play className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Practice Tests Available</h3>
          <p className="text-gray-600">Practice tests for this test type are coming soon.</p>
          <div className="mt-4 text-sm text-gray-500">
            Note: Drill exercises and diagnostic tests are available in their dedicated sections.
          </div>
        </Card>
      </div>
    );
  }

  if (selectedTest && selectedTestData) {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={() => setSelectedTest(null)}
            className="flex items-center space-x-2"
          >
            <ChevronLeft size={16} />
            <span>Back to Practice Tests</span>
          </Button>
        </div>

        {/* Test Overview */}
        <div className="bg-gradient-to-r from-edu-teal to-edu-navy rounded-2xl p-8 text-white">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <div className="flex items-center space-x-3 mb-2">
                {getTestTypeIcon(selectedTestData.type)}
                <h1 className="text-3xl lg:text-4xl font-bold">
                  {selectedTestData.name}
                </h1>
              </div>
              <p className="text-lg opacity-90 mb-4">
                {selectedTestData.description}
              </p>
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <BookOpen size={16} />
                  <span>{selectedTestData.totalQuestions} questions</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock size={16} />
                  <span>{selectedTestData.estimatedTime} minutes</span>
                </div>
              </div>
              {selectedTestData.totalQuestions === 0 && (
                <div className="mt-4 p-3 bg-yellow-500/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertCircle size={16} />
                    <span className="text-sm">Questions coming soon...</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="text-center">
              {selectedTestData.bestScore && (
                <>
                  <div className="text-4xl font-bold mb-2">{selectedTestData.bestScore}%</div>
                  <div className="text-sm opacity-80">Best Score</div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Test Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {selectedTestData.sections.map((section) => (
            <Card 
              key={section.id} 
              className={cn(
                "transition-all duration-200",
                section.questions > 0 ? "hover:shadow-lg cursor-pointer" : "opacity-60",
                getStatusColor(section.status)
              )}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{section.name}</CardTitle>
                  {section.score && (
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      {section.score}%
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <BookOpen size={14} />
                      <span>{section.questions} questions</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock size={14} />
                      <span>{section.timeLimit} min</span>
                    </div>
                  </div>

                  {section.questions === 0 ? (
                    <div className="text-center py-4">
                      <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Questions coming soon</p>
                    </div>
                  ) : (
                    <>
                      {section.status === 'completed' && section.score && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Score: {section.score}%</span>
                          </div>
                          <Progress value={section.score} className="h-2" />
                        </div>
                      )}

                      <Button 
                        className="w-full" 
                        variant={section.status === 'not-started' ? 'default' : 'outline'}
                        onClick={() => handleStartSection(selectedTestData.id, section.id)}
                      >
                        <Play size={16} className="mr-2" />
                        {section.status === 'not-started' ? 'Start Section' : 
                         section.status === 'in-progress' ? 'Continue' : 'Review'}
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Sample Questions Preview */}
        {selectedTestData.sections.some(s => s.sampleQuestions && s.sampleQuestions.length > 0) && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Sample Questions</h2>
            {selectedTestData.sections.map((section) => (
              section.sampleQuestions && section.sampleQuestions.length > 0 && (
                <div key={section.id} className="space-y-4">
                  <h3 className="text-xl font-semibold">{section.name}</h3>
                  {section.sampleQuestions.map((question) => (
                    <Card key={question.id} className="p-6">
                      <div className="space-y-4">
                        <p className="font-medium">{question.text}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {question.options.map((option, index) => (
                            <div 
                              key={index} 
                              className={cn(
                                "p-3 rounded-lg border",
                                option === question.correctAnswer 
                                  ? "bg-green-100 border-green-300 text-green-800"
                                  : "bg-gray-50 border-gray-200"
                              )}
                            >
                              {option}
                            </div>
                          ))}
                        </div>
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <strong>Explanation:</strong> {question.explanation}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <HeroBanner 
        title="Practice Tests 📝"
        subtitle="Take full-length practice tests to simulate the real exam experience"
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
        actions={practiceTests.length > 0 && practiceTests.some(t => t.totalQuestions > 0) ? [
          {
            label: "Start Practice Test",
            icon: <Play size={20} className="mr-2" />,
            onClick: () => {
              const firstAvailableTest = practiceTests.find(t => t.totalQuestions > 0);
              if (firstAvailableTest) {
                handleTestSelect(firstAvailableTest.id);
              }
            }
          }
        ] : []}
        {...(practiceTests.length === 0 || !practiceTests.some(t => t.totalQuestions > 0)) && {
          warning: {
            icon: <AlertCircle size={16} />,
            message: "Practice tests for this test type are coming soon..."
          }
        }}
      />

      {/* Metrics Cards */}
      <MetricsCards 
        metrics={[
          {
            title: "Tests Completed",
            value: completedTests.toString(),
            icon: <Trophy className="text-white" size={24} />,
            badge: { text: "Finished", variant: "success" as const },
            color: {
              bg: "bg-gradient-to-br from-green-50 to-green-100 border-green-200",
              iconBg: "bg-green-500",
              text: "text-green-900"
            }
          },
          {
            title: "In Progress",
            value: inProgressTests.toString(),
            icon: <Clock className="text-white" size={24} />,
            badge: { text: "Active", variant: "warning" as const },
            color: {
              bg: "bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200",
              iconBg: "bg-orange-500",
              text: "text-orange-900"
            }
          },
          {
            title: "Average Score",
            value: isNaN(averageScore) ? '0%' : `${Math.round(averageScore)}%`,
            icon: <BarChart3 className="text-white" size={24} />,
            badge: { text: "Performance", variant: "secondary" as const },
            color: {
              bg: "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200",
              iconBg: "bg-blue-500",
              text: "text-blue-900"
            }
          },
          {
            title: "Available Tests",
            value: practiceTests.length.toString(),
            icon: <BookOpen className="text-white" size={24} />,
            badge: { text: "Ready", variant: "default" as const },
            color: {
              bg: "bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200",
              iconBg: "bg-purple-500",
              text: "text-purple-900"
            }
          }
        ]}
      />

      {/* Practice Tests Grid */}
      <div>
        <h2 className="text-2xl font-bold mb-6">
          {testData?.name || 'Practice Tests'}
        </h2>
        
        {practiceTests.length === 0 ? (
          <Card className="p-8 text-center bg-white">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Tests Available</h3>
            <p className="text-gray-600">Questions for this test type are coming soon.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {practiceTests.map((test) => (
              <Card 
                key={test.id} 
                className={cn(
                  "transition-all duration-200 bg-white",
                  test.totalQuestions > 0 ? "hover:shadow-lg cursor-pointer" : "opacity-60",
                  getStatusColor(test.status)
                )}
                onClick={() => handleTestSelect(test.id)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getTestTypeIcon(test.type)}
                      <div>
                        <CardTitle className="text-xl">{test.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{test.description}</p>
                      </div>
                    </div>
                    <Badge className={getDifficultyColor(test.difficulty)}>
                      {test.difficulty}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <BookOpen size={14} />
                          <span>{test.totalQuestions} questions</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock size={14} />
                          <span>{test.estimatedTime} min</span>
                        </div>
                      </div>
                      {test.bestScore && (
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          Best: {test.bestScore}%
                        </Badge>
                      )}
                    </div>

                    {test.totalQuestions === 0 ? (
                      <div className="text-center py-4">
                        <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Questions coming soon</p>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          {test.sections.map((section) => (
                            <div 
                              key={section.id} 
                              className={cn(
                                "p-2 rounded text-center",
                                section.status === 'completed' ? 'bg-green-100 text-green-700' :
                                section.status === 'in-progress' ? 'bg-orange-100 text-orange-700' :
                                'bg-gray-100 text-gray-600'
                              )}
                            >
                              {section.name}
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">
                            {test.lastAttempt && (
                              <div className="flex items-center space-x-1">
                                <Calendar size={12} />
                                <span>Last: {test.lastAttempt}</span>
                              </div>
                            )}
                          </div>
                          <ArrowRight size={16} className="text-muted-foreground" />
                        </div>
                      </>
                    )}
                  </div>
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
