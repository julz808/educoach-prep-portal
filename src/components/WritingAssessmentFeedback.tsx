import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, FileText, Target, TrendingUp, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WritingAssessment {
  total_score: number;
  max_possible_score: number;
  percentage_score: number;
  criterion_scores: Record<string, {
    score: number;
    maxMarks: number;
    feedback: string;
  }>;
  overall_feedback: string;
  strengths: string[];
  improvements: string[];
  word_count: number;
  writing_genre: string;
}

interface WritingAssessmentFeedbackProps {
  assessment: WritingAssessment | null;
  userResponse: string;
  isLoading?: boolean;
}

export const WritingAssessmentFeedback: React.FC<WritingAssessmentFeedbackProps> = ({
  assessment,
  userResponse,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <div className="mt-8 p-6 bg-gradient-to-r from-edu-light-blue to-white rounded-xl border-l-4 border-edu-teal">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-edu-teal"></div>
          <span className="text-edu-navy font-medium">Processing writing assessment...</span>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="mt-8 p-6 bg-gradient-to-r from-amber-50 to-white rounded-xl border-l-4 border-amber-400">
        <div className="flex items-start space-x-3">
          <AlertCircle size={20} className="text-amber-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-800 mb-2">Assessment Unavailable</h3>
            <p className="text-amber-700">
              Your writing response has been saved, but detailed assessment is not available at this time.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 65) return 'text-blue-600';
    if (percentage >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-50 border-green-200';
    if (percentage >= 65) return 'bg-blue-50 border-blue-200';
    if (percentage >= 50) return 'bg-amber-50 border-amber-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="mt-8 space-y-6">
      {/* Overall Score Card */}
      <Card className={cn("border-l-4 border-edu-teal", getScoreBgColor(assessment.percentage_score))}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-edu-navy">
            <FileText size={20} />
            <span>Writing Assessment Results</span>
            <Badge variant="outline" className="ml-auto">
              {assessment.writing_genre}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Score Summary */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className={cn("text-2xl font-bold", getScoreColor(assessment.percentage_score))}>
                  {assessment.total_score}/{assessment.max_possible_score}
                </div>
                <div className="text-sm text-gray-600">Score</div>
              </div>
              <div className="text-center">
                <div className={cn("text-2xl font-bold", getScoreColor(assessment.percentage_score))}>
                  {assessment.percentage_score}%
                </div>
                <div className="text-sm text-gray-600">Percentage</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-edu-teal">
                  {assessment.word_count}
                </div>
                <div className="text-sm text-gray-600">Words</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {assessment.percentage_score >= 80 && (
                <CheckCircle size={24} className="text-green-600" />
              )}
            </div>
          </div>

          {/* Overall Feedback */}
          <div className="p-4 bg-white rounded-lg border">
            <h4 className="font-semibold text-edu-navy mb-2 flex items-center">
              <Target size={16} className="mr-2" />
              Overall Feedback
            </h4>
            <p className="text-edu-navy/80 leading-relaxed">{assessment.overall_feedback}</p>
          </div>
        </CardContent>
      </Card>

      {/* Criterion Scores */}
      <Card>
        <CardHeader>
          <CardTitle className="text-edu-navy">Detailed Assessment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(assessment.criterion_scores).map(([criterion, data]) => (
            <div key={criterion} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-edu-navy">{criterion}</h4>
                <div className="flex items-center space-x-2">
                  <span className={cn("font-bold", getScoreColor((data.score / data.maxMarks) * 100))}>
                    {data.score}/{data.maxMarks}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {Math.round((data.score / data.maxMarks) * 100)}%
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{data.feedback}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Strengths and Improvements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        {assessment.strengths && assessment.strengths.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-green-700 flex items-center">
                <CheckCircle size={18} className="mr-2" />
                Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {assessment.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 shrink-0"></div>
                    <span className="text-sm text-gray-700 leading-relaxed">{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Areas for Improvement */}
        {assessment.improvements && assessment.improvements.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-amber-700 flex items-center">
                <TrendingUp size={18} className="mr-2" />
                Areas for Improvement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {assessment.improvements.map((improvement, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 shrink-0"></div>
                    <span className="text-sm text-gray-700 leading-relaxed">{improvement}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* User Response Display (collapsed by default) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-edu-navy text-sm">Your Response</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-gray-50 rounded-lg border max-h-40 overflow-y-auto">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {userResponse}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};