import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, Clock, Target, Brain, Play, CheckCircle, 
  AlertCircle, BarChart3, ArrowRight, Info
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
  description: string;
  questions: number;
  timeLimit: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  status: 'not-started' | 'in-progress' | 'completed';
  score?: number;
  subSkills: string[];
  sampleQuestions?: {
    id: number;
    text: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  }[];
}

const DiagnosticTests: React.FC = () => {
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

  // Transform Supabase data to component format - find diagnostic test mode
  const diagnosticTestMode = testData?.testModes.find(mode => mode.type === 'diagnostic');
  
  const transformedSections: TestSection[] = diagnosticTestMode ? diagnosticTestMode.sections.map(section => {
    // Extract unique sub-skills from questions
    const subSkills = Array.from(new Set(section.questions.map(q => q.subSkill)));
    
    return {
      id: section.id,
      name: section.name,
      description: `Assessment covering ${subSkills.length} key skills`,
      questions: section.totalQuestions,
      timeLimit: section.timeLimit || Math.ceil(section.totalQuestions * 1.5),
      difficulty: 'Medium' as const,
      status: section.status,
      score: section.score,
      subSkills,
      // Convert first few questions to sample format for preview
      sampleQuestions: section.questions.slice(0, 2).map((q, index) => ({
        id: index + 1,
        text: q.text,
        options: q.options,
        correctAnswer: q.options[q.correctAnswer] || 'A',
        explanation: q.explanation,
      }))
    };
  }) : [];

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="text-green-600" size={20} />;
      case 'in-progress':
        return <Clock className="text-orange-600" size={20} />;
      case 'not-started':
        return <Brain className="text-gray-400" size={20} />;
      default:
        return <Brain className="text-gray-400" size={20} />;
    }
  };

  const handleStartSection = (sectionId: string) => {
    const section = transformedSections.find(s => s.id === sectionId);
    
    if (section && section.questions > 0) {
      navigate(`/test/diagnostic/${sectionId}?sectionName=${encodeURIComponent(section.name)}`);
    }
  };

  const totalQuestions = transformedSections.reduce((sum, section) => sum + section.questions, 0);
  const completedSections = transformedSections.filter(s => s.status === 'completed').length;
  const averageScore = transformedSections
    .filter(s => s.score)
    .reduce((acc, s) => acc + (s.score || 0), 0) / 
    transformedSections.filter(s => s.score).length || 0;

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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-2xl p-8 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="mb-6 lg:mb-0">
            <div className="flex items-center space-x-3 mb-4">
              <Brain size={40} />
              <h1 className="text-3xl lg:text-4xl font-bold">
                Diagnostic Assessment
              </h1>
            </div>
            <p className="text-lg opacity-90 mb-4">
              Identify your strengths and areas for improvement with our comprehensive diagnostic tests
            </p>
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <BookOpen size={16} />
                <span>{totalQuestions} questions</span>
              </div>
              <div className="flex items-center space-x-2">
                <Target size={16} />
                <span>{transformedSections.length} sections</span>
              </div>
            </div>
            {totalQuestions === 0 && (
              <div className="mt-4 p-3 bg-yellow-500/20 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle size={16} />
                  <span className="text-sm">Diagnostic questions coming soon...</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="text-center">
            {completedSections > 0 && (
              <>
                <div className="text-4xl font-bold mb-2">{Math.round(averageScore)}%</div>
                <div className="text-sm opacity-80">Average Score</div>
                <div className="text-xs opacity-70 mt-1">
                  {completedSections}/{transformedSections.length} sections completed
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Brain className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{transformedSections.length}</p>
                <p className="text-sm text-muted-foreground">Test Sections</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedSections}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {isNaN(averageScore) ? '0' : Math.round(averageScore)}%
                </p>
                <p className="text-sm text-muted-foreground">Average Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Sections */}
      <div>
        <h2 className="text-2xl font-bold mb-6">
          {testData?.name ? `${testData.name} - Diagnostic Sections` : 'Diagnostic Sections'}
        </h2>
        
        {transformedSections.length === 0 ? (
          <Card className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Diagnostic Test Available</h3>
            <p className="text-gray-600">Diagnostic questions for this test type are coming soon.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {transformedSections.map((section) => (
              <Card 
                key={section.id} 
                className={cn(
                  "transition-all duration-200",
                  section.questions > 0 ? "hover:shadow-lg" : "opacity-60",
                  getStatusColor(section.status)
                )}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(section.status)}
                      <div>
                        <CardTitle className="text-xl">{section.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{section.description}</p>
                      </div>
                    </div>
                    <Badge className={getDifficultyColor(section.difficulty)}>
                      {section.difficulty}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <BookOpen size={14} />
                          <span>{section.questions} questions</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock size={14} />
                          <span>{section.timeLimit} min</span>
                        </div>
                      </div>
                      {section.score && (
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          {section.score}%
                        </Badge>
                      )}
                    </div>

                    {/* Sub-skills */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Skills Assessed:</p>
                      <div className="flex flex-wrap gap-1">
                        {section.subSkills.slice(0, 4).map((skill, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {section.subSkills.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{section.subSkills.length - 4} more
                          </Badge>
                        )}
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
                          onClick={() => handleStartSection(section.id)}
                        >
                          <Play size={16} className="mr-2" />
                          {section.status === 'not-started' ? 'Start Assessment' : 
                           section.status === 'in-progress' ? 'Continue' : 'Review Results'}
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Information Section */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Info className="text-blue-600" size={24} />
            <CardTitle className="text-blue-900">How Diagnostic Tests Work</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-blue-800">
            <div>
              <h4 className="font-semibold mb-2">📊 Assessment</h4>
              <p>Our diagnostic tests evaluate your current knowledge and identify areas where you need more practice.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">🎯 Personalized</h4>
              <p>Based on your results, we'll create a personalized study plan focusing on your weakest areas.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">📈 Progress Tracking</h4>
              <p>Monitor your improvement over time as you work through targeted practice questions.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">🏆 Adaptive Learning</h4>
              <p>Our system adapts to your learning pace and adjusts difficulty based on your performance.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DiagnosticTests;
