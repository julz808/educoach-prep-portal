import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Clock, BookOpen, Target, AlertCircle, ArrowRight, ArrowLeft,
  FileText, Timer, CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TestInstructionsProps {
  testType: 'diagnostic' | 'practice' | 'drill';
  sectionName: string;
  productType: string;
  questionCount: number;
  timeLimit: number; // in minutes
  format: 'Multiple Choice' | 'Written Response';
  onStart: () => void;
  onBack: () => void;
  isResume?: boolean;
}

export const TestInstructions: React.FC<TestInstructionsProps> = ({
  testType,
  sectionName,
  productType,
  questionCount,
  timeLimit,
  format,
  onStart,
  onBack,
  isResume = false
}) => {
  const getTestTypeDisplayName = (type: string) => {
    switch (type) {
      case 'diagnostic': return 'Diagnostic Test';
      case 'practice': return 'Practice Test';
      case 'drill': return 'Skill Drill';
      default: return 'Test';
    }
  };

  const getInstructions = () => {
    return [
      `This is a ${getTestTypeDisplayName(testType)} for ${sectionName}`,
      `You have ${timeLimit} minutes to complete ${questionCount} questions`,
      `The test format is ${format}`,
    ];
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full shadow-xl border-0">
        <CardHeader className="pb-6 bg-gradient-to-r from-edu-teal to-edu-navy text-white rounded-t-lg">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-white/20 rounded-full">
              <FileText size={24} />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">
                {isResume ? 'Resume Test' : 'Test Instructions'}
              </CardTitle>
              <p className="text-edu-light-blue font-medium">
                {productType} • {sectionName}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8 space-y-6">
          {/* Test Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3 p-4 bg-edu-light-blue/30 rounded-lg">
              <Clock className="text-edu-teal" size={20} />
              <div>
                <div className="font-semibold text-edu-navy">{timeLimit} Minutes</div>
                <div className="text-sm text-gray-600">Time Limit</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-4 bg-edu-light-blue/30 rounded-lg">
              <BookOpen className="text-edu-teal" size={20} />
              <div>
                <div className="font-semibold text-edu-navy">{questionCount} Questions</div>
                <div className="text-sm text-gray-600">Total Questions</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-4 bg-edu-light-blue/30 rounded-lg">
              <Target className="text-edu-teal" size={20} />
              <div>
                <div className="font-semibold text-edu-navy">{format}</div>
                <div className="text-sm text-gray-600">Question Type</div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-edu-navy flex items-center space-x-2">
              <AlertCircle size={20} className="text-edu-teal" />
              <span>Instructions</span>
            </h3>
            
            <div className="space-y-3">
              {getInstructions().map((instruction, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-edu-teal/20 rounded-full flex items-center justify-center mt-0.5 shrink-0">
                    <span className="text-xs font-bold text-edu-teal">{index + 1}</span>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{instruction}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Resume Info */}
          {isResume && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Timer className="text-amber-600 mt-0.5" size={20} />
                <div>
                  <h4 className="font-semibold text-amber-800 mb-1">Resuming Test</h4>
                  <p className="text-amber-700 text-sm">
                    You are continuing where you left off. Your previous answers and remaining time have been restored.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-4">
            <Button
              variant="outline"
              onClick={onBack}
              className="flex-1 border-2 border-gray-300 hover:border-edu-teal hover:text-edu-teal"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back
            </Button>
            
            <Button
              onClick={onStart}
              className={cn(
                "flex-1 text-white font-semibold py-3",
                isResume 
                  ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
                  : "bg-gradient-to-r from-edu-teal to-edu-navy hover:from-edu-teal/90 hover:to-edu-navy/90"
              )}
            >
              <ArrowRight size={16} className="mr-2" />
              {isResume ? 'Resume Test' : 'Start Test'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};