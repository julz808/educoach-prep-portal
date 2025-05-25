import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Progress } from '../components/ui/progress';
import { 
  generateTestSection, 
  saveGeneratedQuestions,
  type QuestionGenerationResponse 
} from '../services/questionGenerationService';

// EduTest Year 6 Complete Test Structure
const EDUTEST_YEAR_6_SECTIONS = {
  "Reading_Comprehension": { questions: 35, time: 30, format: "MC, short answer" },
  "Mathematics": { questions: 35, time: 30, format: "MC, short answer" },
  "Written_Expression": { questions: 2, time: 25, format: "Extended response" },
  "Verbal_Reasoning": { questions: 30, time: 30, format: "MC" },
  "Non_verbal_Reasoning": { questions: 30, time: 30, format: "MC" }
};

interface SectionResult {
  sectionName: string;
  totalQuestions: number;
  visualQuestions: number;
  subSkillsCovered: string[];
  timeAllotted: number;
  format: string;
  savedQuestionIds: string[];
  savedPassageIds: string[];
  questionsBySubSkill: Record<string, any>;
  error?: string;
}

const EduTestGenerator: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentSection, setCurrentSection] = useState('');
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{
    totalQuestions: number;
    totalVisualQuestions: number;
    sections: Record<string, SectionResult>;
    generatedAt?: string;
  } | null>(null);
  const [error, setError] = useState('');

  const generateFullTest = async () => {
    setIsGenerating(true);
    setError('');
    setProgress(0);
    
    const testResults = {
      testType: 'EduTest_Year_6',
      totalQuestions: 0,
      totalVisualQuestions: 0,
      sections: {} as Record<string, SectionResult>,
      generatedAt: new Date().toISOString()
    };

    const sectionNames = Object.keys(EDUTEST_YEAR_6_SECTIONS);
    const totalSections = sectionNames.length;

    try {
      for (let i = 0; i < sectionNames.length; i++) {
        const sectionName = sectionNames[i];
        const config = EDUTEST_YEAR_6_SECTIONS[sectionName as keyof typeof EDUTEST_YEAR_6_SECTIONS];
        
        setCurrentSection(sectionName);
        setProgress((i / totalSections) * 100);

        try {
          // Generate questions for this section
          const sectionResponses = await generateTestSection('EduTest_Year_6', sectionName, config.questions);
          
          // Calculate section statistics
          const sectionStats: SectionResult = {
            sectionName,
            totalQuestions: sectionResponses.reduce((sum, r) => sum + r.questions.length, 0),
            visualQuestions: sectionResponses.reduce((sum, r) => 
              sum + r.questions.filter(q => q.hasVisual).length, 0),
            subSkillsCovered: sectionResponses.map(r => r.metadata.subSkill),
            timeAllotted: config.time,
            format: config.format,
            savedQuestionIds: [],
            savedPassageIds: [],
            questionsBySubSkill: {}
          };

          // Organize questions by sub-skill
          sectionResponses.forEach(response => {
            const subSkill = response.metadata.subSkill;
            sectionStats.questionsBySubSkill[subSkill] = {
              count: response.questions.length,
              difficulty: response.metadata.difficulty,
              hasVisuals: response.questions.some(q => q.hasVisual),
              visualTypes: response.questions
                .filter(q => q.hasVisual)
                .map(q => q.visualType)
                .filter((type, index, arr) => arr.indexOf(type) === index)
            };
          });

          // Save to database
          const savedResults = [];
          for (const response of sectionResponses) {
            const saved = await saveGeneratedQuestions(response);
            savedResults.push(saved);
          }

          sectionStats.savedQuestionIds = savedResults.flatMap(r => r.questionIds);
          sectionStats.savedPassageIds = savedResults.map(r => r.passageId).filter(Boolean);

          testResults.sections[sectionName] = sectionStats;
          testResults.totalQuestions += sectionStats.totalQuestions;
          testResults.totalVisualQuestions += sectionStats.visualQuestions;

        } catch (sectionError) {
          testResults.sections[sectionName] = {
            sectionName,
            error: sectionError instanceof Error ? sectionError.message : 'Unknown error',
            totalQuestions: 0,
            visualQuestions: 0,
            subSkillsCovered: [],
            timeAllotted: config.time,
            format: config.format,
            savedQuestionIds: [],
            savedPassageIds: [],
            questionsBySubSkill: {}
          };
        }
      }

      setProgress(100);
      setResults(testResults);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate test');
    } finally {
      setIsGenerating(false);
      setCurrentSection('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">EduTest Year 6 Practice Test Generator</h1>
          <p className="text-gray-600">Generate a complete 132-question practice test across all 5 sections</p>
        </div>

        {/* Test Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Test Structure</CardTitle>
            <CardDescription>Official EduTest Year 6 format with visual question support</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {Object.entries(EDUTEST_YEAR_6_SECTIONS).map(([section, config]) => (
                <div key={section} className="p-4 border rounded-lg">
                  <h3 className="font-medium text-sm mb-2">{section.replace(/_/g, ' ')}</h3>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>{config.questions} questions</div>
                    <div>{config.time} minutes</div>
                    <div>{config.format}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <div className="text-lg font-semibold">Total: 132 Questions | 145 Minutes</div>
            </div>
          </CardContent>
        </Card>

        {/* Generation Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Generate Practice Test</CardTitle>
            <CardDescription>
              This will generate questions using your current AI system with proper visual support
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={generateFullTest} 
              disabled={isGenerating}
              size="lg"
              className="w-full"
            >
              {isGenerating ? 'Generating Test...' : 'Generate Complete EduTest Year 6'}
            </Button>

            {isGenerating && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Current Section: {currentSection.replace(/_/g, ' ')}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Results Display */}
        {results && (
          <Card>
            <CardHeader>
              <CardTitle>✅ Test Generation Complete!</CardTitle>
              <CardDescription>
                Generated at: {new Date(results.generatedAt!).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{results.totalQuestions}</div>
                  <div className="text-sm text-blue-800">Total Questions</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{results.totalVisualQuestions}</div>
                  <div className="text-sm text-green-800">Visual Questions</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {Object.keys(results.sections).length}
                  </div>
                  <div className="text-sm text-purple-800">Sections</div>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {Math.round((results.totalVisualQuestions / results.totalQuestions) * 100)}%
                  </div>
                  <div className="text-sm text-orange-800">Visual Content</div>
                </div>
              </div>

              {/* Section Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Section Breakdown</h3>
                {Object.entries(results.sections).map(([sectionName, section]) => (
                  <div key={sectionName} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-medium">{sectionName.replace(/_/g, ' ')}</h4>
                      <div className="text-sm text-gray-600">
                        {section.timeAllotted} min | {section.format}
                      </div>
                    </div>
                    
                    {section.error ? (
                      <div className="text-red-600 text-sm">❌ {section.error}</div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Questions:</span> {section.totalQuestions}
                        </div>
                        <div>
                          <span className="font-medium">Visual:</span> {section.visualQuestions}
                        </div>
                        <div>
                          <span className="font-medium">Sub-skills:</span> {section.subSkillsCovered.length}
                        </div>
                        <div>
                          <span className="font-medium">Saved:</span> {section.savedQuestionIds.length}
                        </div>
                      </div>
                    )}

                    {!section.error && Object.keys(section.questionsBySubSkill).length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="text-xs text-gray-600">
                          <strong>Sub-skills covered:</strong> {Object.keys(section.questionsBySubSkill).join(', ')}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Database Status */}
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-medium text-green-800 mb-2">🗄️ Database Storage</h3>
                <div className="text-sm text-green-700">
                  <div>Questions saved to Supabase: {
                    Object.values(results.sections)
                      .filter(s => !s.error)
                      .reduce((sum, s) => sum + s.savedQuestionIds.length, 0)
                  }</div>
                  <div>Passages saved: {
                    Object.values(results.sections)
                      .filter(s => !s.error)
                      .reduce((sum, s) => sum + s.savedPassageIds.length, 0)
                  }</div>
                  <div className="mt-2 font-medium">✅ Ready for student practice tests!</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default EduTestGenerator; 