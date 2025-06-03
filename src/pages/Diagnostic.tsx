import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { HeroBanner } from '@/components/ui/hero-banner';
import { MetricsCards } from '@/components/ui/metrics-cards';
import { 
  BookOpen, Clock, Target, Brain, Play, CheckCircle, 
  AlertCircle, BarChart3, ArrowRight, Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProduct } from '@/context/ProductContext';
import { useNavigate } from 'react-router-dom';
import { 
  fetchDiagnosticModes, 
  type TestMode, 
  type TestSection 
} from '@/services/supabaseQuestionService';

const DiagnosticTests: React.FC = () => {
  const [diagnosticModes, setDiagnosticModes] = useState<TestMode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { selectedProduct } = useProduct();
  const navigate = useNavigate();

  useEffect(() => {
    const loadDiagnosticData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const modes = await fetchDiagnosticModes(selectedProduct);
        setDiagnosticModes(modes);
      } catch (err) {
        console.error('Error loading diagnostic data:', err);
        setError('Failed to load diagnostic data');
      } finally {
        setLoading(false);
      }
    };

    loadDiagnosticData();
  }, [selectedProduct]);

  // Get all sections from all diagnostic modes
  const allSections: TestSection[] = [];
  diagnosticModes.forEach(mode => {
    allSections.push(...mode.sections);
  });

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

  const handleStartSection = (sectionId: string, sectionName: string) => {
    const section = allSections.find(s => s.id === sectionId);
    
    if (section && section.totalQuestions > 0) {
      navigate(`/test/diagnostic/${sectionId}?sectionName=${encodeURIComponent(sectionName)}`);
    }
  };

  const totalQuestions = allSections.reduce((sum, section) => sum + section.totalQuestions, 0);
  const completedSections = allSections.filter(s => s.status === 'completed').length;
  const averageScore = allSections
    .filter(s => s.score)
    .reduce((acc, s) => acc + (s.score || 0), 0) / 
    allSections.filter(s => s.score).length || 0;

  // Hero banner configuration
  const heroBannerProps = {
    title: "Diagnostic Assessment 🎯",
    subtitle: "Identify your strengths and areas for improvement with comprehensive diagnostic tests",
    metrics: [
      {
        icon: <Target size={16} />,
        label: `${completedSections}/${allSections.length} sections completed`,
        value: ""
      },
      {
        icon: <BarChart3 size={16} />,
        label: isNaN(averageScore) ? 'No scores yet' : `${Math.round(averageScore)}% average`,
        value: ""
      },
      {
        icon: <Brain size={16} />,
        label: `${allSections.length} assessment areas`,
        value: ""
      }
    ],
    actions: [
      {
        label: 'Start Assessment',
        icon: <Play size={20} className="mr-2" />,
        onClick: () => {
          const firstIncomplete = allSections.find(s => s.status !== 'completed' && s.totalQuestions > 0);
          if (firstIncomplete) {
            handleStartSection(firstIncomplete.id, firstIncomplete.name);
          }
        },
        disabled: !allSections.some(s => s.totalQuestions > 0)
      }
    ]
  };

  // Metrics cards configuration
  const metricsConfig = [
    {
      title: 'Assessment Areas',
      value: allSections.length.toString(),
      icon: <Brain className="text-white" size={24} />,
      badge: { text: 'Available', variant: 'default' as const },
      color: {
        bg: 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200',
        iconBg: 'bg-blue-500',
        text: 'text-blue-900'
      }
    },
    {
      title: 'Total Questions',
      value: totalQuestions.toString(),
      icon: <BookOpen className="text-white" size={24} />,
      badge: { text: 'Ready', variant: 'secondary' as const },
      color: {
        bg: 'bg-gradient-to-br from-green-50 to-green-100 border-green-200',
        iconBg: 'bg-green-500',
        text: 'text-green-900'
      }
    },
    {
      title: 'Completed',
      value: completedSections.toString(),
      icon: <CheckCircle className="text-white" size={24} />,
      badge: { text: 'Done', variant: 'success' as const },
      color: {
        bg: 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200',
        iconBg: 'bg-purple-500',
        text: 'text-purple-900'
      }
    },
    {
      title: 'Average Score',
      value: isNaN(averageScore) ? '--' : `${Math.round(averageScore)}%`,
      icon: <Target className="text-white" size={24} />,
      badge: { text: 'Score', variant: 'warning' as const },
      color: {
        bg: 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200',
        iconBg: 'bg-orange-500',
        text: 'text-orange-900'
      }
    }
  ];

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

  if (diagnosticModes.length === 0) {
    return (
      <div className="space-y-8">
        <HeroBanner 
          title="Diagnostic Assessment 🎯"
          subtitle="Diagnostic tests for this test type are coming soon."
          metrics={[]}
          warning={{
            icon: <AlertCircle size={16} />,
            message: "No diagnostic tests available yet."
          }}
        />
        
        <Card className="p-8 text-center bg-white">
          <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Diagnostic Tests Available</h3>
          <p className="text-gray-600">Diagnostic tests for this test type are coming soon.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Standardized Hero Banner */}
      <HeroBanner {...heroBannerProps} />

      {/* Standardized Metrics Cards */}
      <MetricsCards metrics={metricsConfig} />

      {/* Diagnostic Modes - White Background */}
      <div className="space-y-6">
        {diagnosticModes.map((mode) => (
          <Card key={mode.id} className="bg-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Brain size={20} />
                    <span>{mode.name}</span>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{mode.description}</p>
                </div>
                <Badge className="bg-purple-100 text-purple-700">
                  {mode.sections.length} areas
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {mode.sections.map((section) => (
                  <Card 
                    key={section.id} 
                    className={cn(
                      "transition-all duration-200 hover:shadow-md bg-white",
                      getStatusColor(section.status),
                      section.totalQuestions > 0 ? "cursor-pointer hover:border-purple-300" : "opacity-60"
                    )}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(section.status)}
                          <div>
                            <CardTitle className="text-base">{section.name}</CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {section.totalQuestions} questions
                            </p>
                          </div>
                        </div>
                        <ArrowRight size={16} className="text-gray-400" />
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {/* Progress if completed */}
                        {section.status === 'completed' && section.score && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">Score</span>
                              <span className="text-sm font-bold">{section.score}%</span>
                            </div>
                            <Progress value={section.score} className="h-2" />
                          </div>
                        )}

                        {/* Time and Question info */}
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>{section.totalQuestions} questions</span>
                          {section.timeLimit && (
                            <span>{section.timeLimit} min</span>
                          )}
                        </div>

                        {/* Sample questions preview */}
                        {section.questions.length > 0 && (
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="text-sm font-medium mb-2">Sample topics:</div>
                            <div className="text-xs text-gray-600">
                              {section.questions.slice(0, 2).map((q, idx) => (
                                <div key={idx} className="truncate">{q.text.substring(0, 80)}...</div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <Button 
                          className="w-full"
                          onClick={() => handleStartSection(section.id, section.name)}
                          disabled={section.totalQuestions === 0}
                        >
                          <Play size={14} className="mr-2" />
                          {section.status === 'completed' ? 'Retake Assessment' :
                           section.status === 'in-progress' ? 'Continue Assessment' :
                           section.totalQuestions > 0 ? 'Start Assessment' : 'Coming Soon'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info Box - White Background */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start space-x-3">
            <Info className="text-blue-600 mt-0.5" size={20} />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">How Diagnostic Tests Work</h3>
              <p className="text-blue-800 text-sm">
                These assessments help identify your current skill level and knowledge gaps. 
                Complete all sections to get a comprehensive understanding of your strengths and areas for improvement.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DiagnosticTests;
