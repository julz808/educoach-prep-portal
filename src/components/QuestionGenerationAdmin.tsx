import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import VisualRenderer from './VisualRenderer';
import { 
  generateQuestions, 
  generateTestSection, 
  saveGeneratedQuestions, 
  getGenerationStats,
  type QuestionGenerationRequest,
  type QuestionGenerationResponse,
  testClaudeConnection
} from '../services/questionGenerationService';
import { 
  TEST_STRUCTURES, 
  UNIFIED_SUB_SKILLS, 
  getCurriculumDifficulty,
  getSubSkillsForSection 
} from '../data/curriculumData';
import { Badge } from './ui/badge';
import { Brain } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { AlertCircle } from 'lucide-react';
import { CheckCircle } from 'lucide-react';

const QuestionGenerationAdmin: React.FC = () => {
  const [selectedTestType, setSelectedTestType] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedSubSkill, setSelectedSubSkill] = useState<string>('');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<QuestionGenerationResponse | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    success: boolean;
    model: string;
    error?: string;
  } | null>(null);
  const [generationResult, setGenerationResult] = useState<any>(null);

  // Load generation statistics on component mount
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const statsData = await getGenerationStats();
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const handleTestTypeChange = (testType: string) => {
    setSelectedTestType(testType);
    setSelectedSection('');
    setSelectedSubSkill('');
  };

  const handleSectionChange = (section: string) => {
    setSelectedSection(section);
    setSelectedSubSkill('');
  };

  const handleGenerateQuestions = async () => {
    if (!selectedTestType || !selectedSection || !selectedSubSkill) {
      setError('Please select test type, section, and sub-skill');
      return;
    }

    setIsGenerating(true);
    setError('');
    setSuccess('');

    try {
      const yearLevel = selectedTestType.includes('Year_5') ? 'Year 5' : 
                       selectedTestType.includes('Year_7') ? 'Year 7' :
                       selectedTestType.includes('Year_6') ? 'Year 6' : 'Year 8';

      const difficulty = getCurriculumDifficulty(selectedTestType, selectedSubSkill);

      const request: QuestionGenerationRequest = {
        testType: selectedTestType,
        yearLevel,
        sectionName: selectedSection,
        subSkill: selectedSubSkill,
        difficulty,
        questionCount,
        australianContext: true
      };

      const response = await generateQuestions(request);
      setGeneratedQuestions(response);
      setSuccess(`Successfully generated ${response.questions.length} questions!`);
      
      // Refresh stats
      await loadStats();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate questions');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateSection = async () => {
    if (!selectedTestType || !selectedSection) {
      setError('Please select test type and section');
      return;
    }

    setIsGenerating(true);
    setError('');
    setSuccess('');

    try {
      const responses = await generateTestSection(selectedTestType, selectedSection);
      const totalQuestions = responses.reduce((sum, r) => sum + r.questions.length, 0);
      setSuccess(`Successfully generated ${totalQuestions} questions across ${responses.length} sub-skills!`);
      
      // Show the first response as an example
      if (responses.length > 0) {
        setGeneratedQuestions(responses[0]);
      }
      
      // Refresh stats
      await loadStats();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate section');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveQuestions = async () => {
    if (!generatedQuestions) return;

    try {
      const result = await saveGeneratedQuestions(generatedQuestions);
      setSuccess(`Questions saved! Generated ${result.questionIds.length} question IDs.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save questions');
    }
  };

  const testConnection = async () => {
    setIsTestingConnection(true);
    try {
      const result = await testClaudeConnection();
      setConnectionStatus(result);
    } catch (error) {
      setConnectionStatus({
        success: false,
        model: 'claude-4-sonnet-20241218',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const generateSampleQuestions = async () => {
    setIsGenerating(true);
    try {
      const request: QuestionGenerationRequest = {
        testType: 'Year_5_NAPLAN',
        yearLevel: 'Year 5',
        sectionName: 'Numeracy',
        subSkill: 'Number and Place Value',
        difficulty: 2,
        questionCount: 2,
        australianContext: true
      };

      const result = await generateQuestions(request);
      setGenerationResult(result);
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const testTypes = Object.keys(TEST_STRUCTURES);
  const sections = selectedTestType ? Object.keys(TEST_STRUCTURES[selectedTestType as keyof typeof TEST_STRUCTURES]) : [];
  const subSkills = selectedSection ? getSubSkillsForSection(selectedSection) : [];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Brain className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold">Question Generation Admin</h1>
        <Badge variant="secondary" className="ml-2">
          Claude 4 Sonnet
        </Badge>
      </div>

      {/* Claude API Connection Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Claude 4 Sonnet API Connection
          </CardTitle>
          <CardDescription>
            Test connection to Claude 4 Sonnet (model: claude-4-sonnet-20241218)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={testConnection} 
            disabled={isTestingConnection}
            className="flex items-center gap-2"
          >
            {isTestingConnection ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            Test Claude Connection
          </Button>

          {connectionStatus && (
            <Alert className={connectionStatus.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              <div className="flex items-start gap-2">
                {connectionStatus.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                )}
                <div>
                  <div className="font-medium">
                    {connectionStatus.success ? 'Connected Successfully!' : 'Connection Failed'}
                  </div>
                  <AlertDescription className="mt-1">
                    <div>Model: <code className="text-sm bg-gray-100 px-1 rounded">{connectionStatus.model}</code></div>
                    {connectionStatus.error && (
                      <div className="mt-2 text-red-700">{connectionStatus.error}</div>
                    )}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Sample Question Generation */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Sample Questions</CardTitle>
          <CardDescription>
            Test question generation with Claude 4 Sonnet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={generateSampleQuestions} 
            disabled={isGenerating}
            className="flex items-center gap-2"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Brain className="h-4 w-4" />
            )}
            Generate Sample Questions
          </Button>

          {generationResult && (
            <div className="space-y-4">
              <Alert className="border-blue-200 bg-blue-50">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription>
                  Successfully generated {generationResult.questions.length} questions using Claude 4 Sonnet!
                </AlertDescription>
              </Alert>
              
              <div className="space-y-3">
                {generationResult.questions.map((question: any, index: number) => (
                  <Card key={index} className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <div className="font-medium">Question {index + 1}:</div>
                        <div className="text-sm text-gray-700">{question.questionText}</div>
                        <div className="text-xs text-gray-500">
                          Sub-skill: {question.subSkill} | Difficulty: {question.difficulty}/3
                          {question.hasVisual && " | Has Visual Component"}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics Dashboard */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalQuestions}</div>
              <p className="text-xs text-gray-600">
                {stats.aiGenerated} AI generated
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Recent Generation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recentGeneration}</div>
              <p className="text-xs text-gray-600">Last 7 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Test Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(stats.byTestType).length}</div>
              <p className="text-xs text-gray-600">Active test types</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Sub-Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(stats.bySubSkill).length}</div>
              <p className="text-xs text-gray-600">Covered sub-skills</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Question Generation Form */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Questions</CardTitle>
          <CardDescription>
            Create curriculum-aligned questions for Australian standardized tests
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Test Type Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Test Type</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {testTypes.map(testType => (
                <Button
                  key={testType}
                  variant={selectedTestType === testType ? "default" : "outline"}
                  onClick={() => handleTestTypeChange(testType)}
                  className="text-left justify-start"
                >
                  {testType.replace(/_/g, ' ')}
                </Button>
              ))}
            </div>
          </div>

          {/* Section Selection */}
          {selectedTestType && (
            <div>
              <label className="block text-sm font-medium mb-2">Section</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {sections.map(section => (
                  <Button
                    key={section}
                    variant={selectedSection === section ? "default" : "outline"}
                    onClick={() => handleSectionChange(section)}
                    className="text-left justify-start"
                  >
                    {section.replace(/_/g, ' ')}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Sub-Skill Selection */}
          {selectedSection && (
            <div>
              <label className="block text-sm font-medium mb-2">Sub-Skill</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {subSkills.map(subSkill => {
                  const difficulty = getCurriculumDifficulty(selectedTestType, subSkill);
                  const skillInfo = UNIFIED_SUB_SKILLS[subSkill as keyof typeof UNIFIED_SUB_SKILLS];
                  
                  return (
                    <Button
                      key={subSkill}
                      variant={selectedSubSkill === subSkill ? "default" : "outline"}
                      onClick={() => setSelectedSubSkill(subSkill)}
                      className="text-left justify-start h-auto p-3"
                    >
                      <div>
                        <div className="font-medium">{subSkill}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {skillInfo?.description}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                            Difficulty {difficulty}/3
                          </span>
                          {skillInfo?.visual_required && (
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                              Visual Required
                            </span>
                          )}
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Question Count */}
          {selectedSubSkill && (
            <div>
              <label className="block text-sm font-medium mb-2">Number of Questions</label>
              <div className="flex gap-2">
                {[1, 3, 5, 10].map(count => (
                  <Button
                    key={count}
                    variant={questionCount === count ? "default" : "outline"}
                    onClick={() => setQuestionCount(count)}
                  >
                    {count}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleGenerateQuestions}
              disabled={!selectedSubSkill || isGenerating}
              className="flex-1"
            >
              {isGenerating ? 'Generating...' : `Generate ${questionCount} Questions`}
            </Button>
            
            <Button
              onClick={handleGenerateSection}
              disabled={!selectedSection || isGenerating}
              variant="outline"
            >
              {isGenerating ? 'Generating...' : 'Generate Full Section'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error/Success Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Generated Questions Preview */}
      {generatedQuestions && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Generated Questions</CardTitle>
                <CardDescription>
                  {generatedQuestions.metadata.testType} - {generatedQuestions.metadata.sectionName} - {generatedQuestions.metadata.subSkill}
                </CardDescription>
              </div>
              <Button onClick={handleSaveQuestions} variant="outline">
                Save to Database
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Passage Preview */}
            {generatedQuestions.passageGenerated && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">{generatedQuestions.passageGenerated.title}</h4>
                <p className="text-sm text-gray-700 mb-2">{generatedQuestions.passageGenerated.content}</p>
                <div className="flex gap-2">
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                    {generatedQuestions.passageGenerated.passageType}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                    {generatedQuestions.passageGenerated.wordCount} words
                  </span>
                </div>
              </div>
            )}

            {/* Questions List */}
            <div className="space-y-4">
              {generatedQuestions.questions.map((question, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium">Question {index + 1}</h4>
                    <div className="flex gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Difficulty:</span>
                        <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {question.difficulty}/3
                        </span>
                      </div>
                      {question.hasVisual && (
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                          Visual
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <p className="mb-3">{question.questionText}</p>
                  
                  {/* Visual Component - PRD Implementation */}
                  {question.hasVisual && question.visualData && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Visual Component:</span>
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                          {question.visualType}
                        </span>
                      </div>
                      <VisualRenderer 
                        visualData={question.visualData} 
                        className="mx-auto"
                      />
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                    {question.options.map((option, optIndex) => (
                      <div
                        key={optIndex}
                        className={`p-2 rounded border ${
                          option.startsWith(question.correctAnswer) 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-gray-50'
                        }`}
                      >
                        {option}
                      </div>
                    ))}
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <strong>Explanation:</strong> {question.explanation}
                  </div>
                  
                  {/* Remove old text-only visual description */}
                  {question.hasVisual && (
                    <div className="mt-2 text-xs text-blue-600">
                      <strong>Accessibility:</strong> {question.visualData?.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QuestionGenerationAdmin; 