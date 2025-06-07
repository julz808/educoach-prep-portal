import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import VisualRenderer from './VisualRenderer';
import { 
  TEST_STRUCTURES, 
  UNIFIED_SUB_SKILLS
} from '../data/curriculumData';
import { Badge } from './ui/badge';
import { Brain } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { AlertCircle } from 'lucide-react';
import { CheckCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const QuestionGenerationAdmin: React.FC = () => {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Brain className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold">Question Generation Admin</h1>
        <Badge variant="secondary" className="ml-2">
          Feature Removed
        </Badge>
      </div>

      {/* Feature Unavailable Notice */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Admin Feature Currently Unavailable
          </CardTitle>
          <CardDescription>
            The question generation administration system has been temporarily removed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              The question generation admin features are currently unavailable. This functionality has been removed as part of recent updates to the application. This includes:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Claude API connection testing</li>
                <li>Question generation for individual sub-skills</li>
                <li>Bulk section generation</li>
                <li>Generation statistics and analytics</li>
                <li>Database saving functionality</li>
              </ul>
            </AlertDescription>
          </Alert>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              disabled
              size="lg"
              className="opacity-50 cursor-not-allowed"
            >
              Test Claude Connection (Unavailable)
            </Button>
            
            <Button 
              disabled
              size="lg"
              className="opacity-50 cursor-not-allowed"
            >
              Generate Questions (Unavailable)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Structure Information (Read-only) */}
      <Card>
        <CardHeader>
          <CardTitle>Available Test Structures</CardTitle>
          <CardDescription>
            Reference information for supported test types and sections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(TEST_STRUCTURES).map(([testType, sections]) => (
              <div key={testType} className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">{testType.replace(/_/g, ' ')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {Object.keys(sections).map(section => (
                    <div key={section} className="text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded">
                      {section.replace(/_/g, ' ')}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuestionGenerationAdmin; 