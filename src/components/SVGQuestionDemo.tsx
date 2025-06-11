import React, { useState, useEffect } from 'react';
import { useQuestionsWithSVG } from '../hooks/useQuestionWithSVG';
import SVGRenderer from './SVGRenderer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, ArrowRight, ArrowLeft, Play, RotateCcw, Check, X } from 'lucide-react';
import { formatQuestionText, cleanOptionText } from '@/utils/textFormatting';

interface SVGQuestionDemoProps {
  testType?: string;
  limit?: number;
}

const SVGQuestionDemo: React.FC<SVGQuestionDemoProps> = ({ 
  testType = 'VIC Selective Entry (Year 9 Entry)', 
  limit = 5 
}) => {
  // Try multiple query variations to debug
  const allQuestions = useQuestionsWithSVG({ testType, limit: 10 });
  const questionsWithVisuals = useQuestionsWithSVG({ 
    testType, 
    hasVisual: true, 
    limit 
  });
  const anyQuestions = useQuestionsWithSVG({ limit: 5 });

  const { questions, loading, error } = questionsWithVisuals;

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold">Error Loading Questions</h3>
          <p className="text-red-600 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-900">
          SVG Visual Questions Demo
        </h2>
        <p className="text-gray-600 mt-1">
          Showing {questions.length} questions with SVG visuals from {testType}
        </p>
      </div>

      {/* Debug Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-blue-800 font-semibold mb-2">Debug Information</h3>
        <div className="text-sm text-blue-700 space-y-1">
          <p><strong>Target Test Type:</strong> {testType}</p>
          <p><strong>Questions with target test type:</strong> {allQuestions.questions.length}</p>
          <p><strong>Questions with target test type + visuals:</strong> {questions.length}</p>
          <p><strong>Any questions in database:</strong> {anyQuestions.questions.length}</p>
          
          {allQuestions.questions.length > 0 && (
            <div className="mt-3">
              <p><strong>Sample test types found:</strong></p>
              <ul className="list-disc list-inside ml-2">
                {[...new Set(allQuestions.questions.map(q => q.test_type))].slice(0, 5).map(type => (
                  <li key={type} className="text-xs">{type}</li>
                ))}
              </ul>
            </div>
          )}
          
          {anyQuestions.questions.length > 0 && (
            <div className="mt-3">
              <p><strong>Sample questions found:</strong></p>
              <ul className="list-disc list-inside ml-2">
                {anyQuestions.questions.slice(0, 3).map(q => (
                  <li key={q.id} className="text-xs">
                    {q.test_type} - {q.question_text.substring(0, 50)}... 
                    {q.visual_svg ? ' (has SVG)' : ' (no SVG)'}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {questions.length === 0 ? (
        <div className="text-center py-12">
          <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <div className="text-gray-600 text-lg font-medium mb-2">Question Preview</div>
          <p className="text-gray-600">
            No questions with SVG visuals found for {testType}.
            <br />
            Check the debug information above to see what's available in your database.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {questions.map((question, index) => (
            <div key={question.id} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Question Header */}
              <div className="bg-gray-50 px-6 py-4 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-blue-600">
                      Question {index + 1}
                    </span>
                    <span className="text-sm text-gray-500">
                      {question.section_name} • {question.sub_skill}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Difficulty {question.difficulty}/3
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    Year {question.year_level}
                  </span>
                </div>
              </div>

              {/* Question Content */}
              <div className="p-6">
                <div className="mb-6">
                  <p className="text-gray-900 text-lg leading-relaxed">
                    {formatQuestionText(question.question_text)}
                  </p>
                </div>

                {/* SVG Visual */}
                {question.visual_svg && (
                  <div className="mb-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="text-sm font-medium text-gray-700 mb-3">
                        Visual Component:
                      </div>
                      <SVGRenderer 
                        svgContent={question.visual_svg}
                        className="mx-auto"
                        style={{ maxWidth: '100%' }}
                      />
                    </div>
                  </div>
                )}

                {/* Answer Options */}
                {question.response_type === 'multiple_choice' && question.answer_options && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      Answer Options:
                    </div>
                    <div className="grid gap-2">
                      {Array.isArray(question.answer_options) 
                        ? question.answer_options.map((option, optionIndex) => (
                            <div 
                              key={optionIndex}
                              className={`p-3 border rounded-lg ${
                                option.includes(question.correct_answer) 
                                  ? 'bg-green-50 border-green-200' 
                                  : 'bg-gray-50 border-gray-200'
                              }`}
                            >
                              <span className="text-gray-900">{cleanOptionText(option)}</span>
                              {option.includes(question.correct_answer) && (
                                <span className="text-green-600 text-sm ml-2">✓ Correct</span>
                              )}
                            </div>
                          ))
                        : (
                          <div className="text-gray-500 italic">
                            Answer options format not recognized
                          </div>
                        )
                      }
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SVGQuestionDemo; 