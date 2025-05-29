import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { 
  calculateQuestionRequirements, 
  calculateAllProductRequirements,
  generateBulkQuestionBank,
  type BulkGenerationPlan,
  type BulkGenerationProgress,
  type BulkGenerationResult
} from '../services/bulkQuestionGeneration';
import { TEST_STRUCTURES } from '../data/curriculumData';

const BulkQuestionGenerationDashboard: React.FC = () => {
  const [allRequirements, setAllRequirements] = useState<Record<string, BulkGenerationPlan>>({});
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationProgress, setGenerationProgress] = useState<BulkGenerationProgress | null>(null);
  const [generationResult, setGenerationResult] = useState<BulkGenerationResult | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Calculate requirements for all products on load
    const requirements = calculateAllProductRequirements();
    setAllRequirements(requirements);
  }, []);

  const handleStartBulkGeneration = async (productType: string) => {
    setIsGenerating(true);
    setError('');
    setGenerationResult(null);
    setSelectedProduct(productType);

    try {
      const result = await generateBulkQuestionBank(
        productType,
        (progress) => setGenerationProgress(progress)
      );
      setGenerationResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
      setGenerationProgress(null);
    }
  };

  const products = Object.keys(TEST_STRUCTURES);
  const totalAcrossAllProducts = Object.values(allRequirements)
    .reduce((sum, req) => sum + req.grandTotal, 0);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bulk Question Generation</h1>
          <p className="text-gray-600">Generate complete question banks for all test products</p>
        </div>
      </div>

      {/* Overall Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Generation Overview</CardTitle>
          <CardDescription>Total questions needed across all products</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{totalAcrossAllProducts}</div>
              <div className="text-sm text-gray-600">Total Questions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{products.length}</div>
              <div className="text-sm text-gray-600">Test Products</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {Object.values(allRequirements).reduce((sum, req) => 
                  sum + Object.keys(req.drillQuestions.subSkillBreakdown).length, 0
                )}
              </div>
              <div className="text-sm text-gray-600">Unique Sub-Skills</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {Object.values(allRequirements).reduce((sum, req) => sum + 6, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Tests</div>
              <div className="text-xs text-gray-500">(1 diagnostic + 5 practice per product)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product-by-Product Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {products.map(product => {
          const requirements = allRequirements[product];
          if (!requirements) return null;

          const isCurrentlyGenerating = isGenerating && selectedProduct === product;

          return (
            <Card key={product} className={isCurrentlyGenerating ? 'ring-2 ring-blue-500' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{product.replace(/_/g, ' ')}</CardTitle>
                    <CardDescription>
                      {Object.keys(requirements.practiceTests.sectionBreakdown).length} sections
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {requirements.grandTotal}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Question Type Breakdown */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="font-semibold text-blue-700">{requirements.drillQuestions.totalQuestions}</div>
                    <div className="text-xs text-blue-600">Drill Questions</div>
                    <div className="text-xs text-gray-500">
                      {Object.keys(requirements.drillQuestions.subSkillBreakdown).length} sub-skills
                    </div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="font-semibold text-green-700">{requirements.diagnosticTest.totalQuestions}</div>
                    <div className="text-xs text-green-600">Diagnostic Test</div>
                    <div className="text-xs text-gray-500">Full coverage</div>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="font-semibold text-purple-700">{requirements.practiceTests.totalQuestions}</div>
                    <div className="text-xs text-purple-600">Practice Tests</div>
                    <div className="text-xs text-gray-500">5 full tests</div>
                  </div>
                </div>

                {/* Section Breakdown */}
                <div className="space-y-2">
                  <div className="text-sm font-medium">Sections:</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(requirements.practiceTests.sectionBreakdown).map(([section, count]) => (
                      <div key={section} className="flex justify-between p-2 bg-gray-50 rounded">
                        <span>{section.replace(/_/g, ' ')}</span>
                        <span className="font-medium">{count}q</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Generation Progress */}
                {isCurrentlyGenerating && generationProgress && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Phase: {generationProgress.phase}</span>
                      <span>{generationProgress.percentage}%</span>
                    </div>
                    <Progress value={generationProgress.percentage} className="h-2" />
                    <div className="text-xs text-gray-600">
                      {generationProgress.currentStep}
                    </div>
                  </div>
                )}

                {/* Generation Button */}
                <Button
                  onClick={() => handleStartBulkGeneration(product)}
                  disabled={isGenerating}
                  className="w-full"
                  variant={isCurrentlyGenerating ? "secondary" : "default"}
                >
                  {isCurrentlyGenerating ? (
                    'Generating...'
                  ) : (
                    `Generate ${requirements.grandTotal} Questions`
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Generation Result */}
      {generationResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-green-700">
              ✅ Generation Complete: {generationResult.productType.replace(/_/g, ' ')}
            </CardTitle>
            <CardDescription>
              Successfully generated {generationResult.totalGenerated} questions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-700">
                  {generationResult.drillQuestions.generated}
                </div>
                <div className="text-sm text-blue-600">Drill Questions</div>
                <div className="text-xs text-gray-500">
                  {generationResult.drillQuestions.questionIds.length} IDs
                </div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-700">
                  {generationResult.diagnosticTest.generated}
                </div>
                <div className="text-sm text-green-600">Diagnostic Test</div>
                <div className="text-xs text-gray-500">
                  {generationResult.diagnosticTest.questionIds.length} IDs
                </div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-700">
                  {generationResult.practiceTests.totalQuestions}
                </div>
                <div className="text-sm text-purple-600">Practice Tests</div>
                <div className="text-xs text-gray-500">
                  {generationResult.practiceTests.testsGenerated} tests
                </div>
              </div>
            </div>

            {/* Errors */}
            {generationResult.errors.length > 0 && (
              <div className="mt-4">
                <Alert variant="destructive">
                  <AlertDescription>
                    <div className="space-y-1">
                      <div className="font-medium">Generation Errors:</div>
                      {generationResult.errors.map((error, index) => (
                        <div key={index} className="text-sm">{error}</div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Detailed Requirements Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Question Requirements</CardTitle>
          <CardDescription>Complete breakdown by product and question type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Product</th>
                  <th className="text-right p-2">Drill Questions</th>
                  <th className="text-right p-2">Diagnostic Test</th>
                  <th className="text-right p-2">Practice Tests</th>
                  <th className="text-right p-2 font-bold">Total</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(allRequirements).map(([product, req]) => (
                  <tr key={product} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{product.replace(/_/g, ' ')}</td>
                    <td className="text-right p-2">{req.drillQuestions.totalQuestions}</td>
                    <td className="text-right p-2">{req.diagnosticTest.totalQuestions}</td>
                    <td className="text-right p-2">{req.practiceTests.totalQuestions}</td>
                    <td className="text-right p-2 font-bold">{req.grandTotal}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-gray-300 font-bold">
                  <td className="p-2">TOTAL</td>
                  <td className="text-right p-2">
                    {Object.values(allRequirements).reduce((sum, req) => sum + req.drillQuestions.totalQuestions, 0)}
                  </td>
                  <td className="text-right p-2">
                    {Object.values(allRequirements).reduce((sum, req) => sum + req.diagnosticTest.totalQuestions, 0)}
                  </td>
                  <td className="text-right p-2">
                    {Object.values(allRequirements).reduce((sum, req) => sum + req.practiceTests.totalQuestions, 0)}
                  </td>
                  <td className="text-right p-2 text-lg">{totalAcrossAllProducts}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BulkQuestionGenerationDashboard; 