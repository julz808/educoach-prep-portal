/**
 * Session Resume Modal
 *
 * Displays when user has an active session to confirm whether they want to:
 * - Resume the existing session
 * - Start a new session (abandoning the old one)
 *
 * This prevents user confusion about "progress disappearing"
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, Play, RotateCcw } from 'lucide-react';

export interface SessionResumeInfo {
  sessionId: string;
  testName: string;
  sectionName: string;
  currentQuestion: number;
  totalQuestions: number;
  timeRemaining?: number; // in seconds
}

interface SessionResumeModalProps {
  sessionInfo: SessionResumeInfo;
  onResume: () => void;
  onStartNew: () => void;
}

export const SessionResumeModal: React.FC<SessionResumeModalProps> = ({
  sessionInfo,
  onResume,
  onStartNew
}) => {
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const progress = Math.round((sessionInfo.currentQuestion / sessionInfo.totalQuestions) * 100);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="bg-edu-teal text-white p-6 rounded-t-xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <AlertCircle size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold">Resume Your Test?</h3>
              <p className="text-edu-light-blue/80 text-sm">You have an in-progress test</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Test Info */}
          <div className="bg-edu-light-blue/10 border border-edu-teal/20 rounded-lg p-4">
            <div className="space-y-2">
              <div>
                <div className="text-sm text-gray-600">Test</div>
                <div className="font-semibold text-edu-navy">{sessionInfo.testName}</div>
              </div>

              <div>
                <div className="text-sm text-gray-600">Section</div>
                <div className="font-semibold text-edu-navy">{sessionInfo.sectionName}</div>
              </div>

              <div>
                <div className="text-sm text-gray-600">Progress</div>
                <div className="flex items-center space-x-3">
                  <div className="font-semibold text-edu-navy">
                    Question {sessionInfo.currentQuestion + 1} of {sessionInfo.totalQuestions}
                  </div>
                  <div className="text-sm text-gray-500">({progress}%)</div>
                </div>
                <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-edu-teal transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {sessionInfo.timeRemaining !== undefined && sessionInfo.timeRemaining > 0 && (
                <div>
                  <div className="text-sm text-gray-600">Time Remaining</div>
                  <div className="font-semibold text-edu-coral">
                    {formatTime(sessionInfo.timeRemaining)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Info Message */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <AlertCircle size={16} className="text-amber-600 mt-0.5 shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Choose an option:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Resume:</strong> Continue from where you left off</li>
                  <li><strong>Start New:</strong> Your progress will be saved, but you'll start a fresh test</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 pt-0 flex space-x-3">
          <Button
            variant="outline"
            onClick={onStartNew}
            className="flex-1 border-gray-300 hover:border-edu-teal hover:text-edu-teal"
          >
            <RotateCcw size={16} className="mr-2" />
            Start New Test
          </Button>
          <Button
            onClick={onResume}
            className="flex-1 bg-edu-teal hover:bg-edu-teal/90 text-white"
          >
            <Play size={16} className="mr-2" />
            Resume Test
          </Button>
        </div>
      </div>
    </div>
  );
};
