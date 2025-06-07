import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Progress } from '../components/ui/progress';

// EduTest Year 6 Complete Test Structure
const EDUTEST_YEAR_6_SECTIONS = {
  "Reading_Comprehension": { questions: 35, time: 30, format: "MC, short answer" },
  "Mathematics": { questions: 35, time: 30, format: "MC, short answer" },
  "Written_Expression": { questions: 2, time: 25, format: "Extended response" },
  "Verbal_Reasoning": { questions: 30, time: 30, format: "MC" },
  "Non_verbal_Reasoning": { questions: 30, time: 30, format: "MC" }
};

const EduTestGenerator: React.FC = () => {
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

        {/* Feature Unavailable Notice */}
        <Card>
          <CardHeader>
            <CardTitle>Feature Currently Unavailable</CardTitle>
            <CardDescription>
              The test generation service has been temporarily removed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                The question generation feature is currently unavailable. This functionality has been removed as part of recent updates to the application.
              </AlertDescription>
            </Alert>
            
            <Button 
              disabled
              size="lg"
              className="w-full opacity-50 cursor-not-allowed"
            >
              Generate Complete EduTest Year 6 (Unavailable)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EduTestGenerator; 