import { supabase } from '@/integrations/supabase/client';
import { TestSessionService } from './testSessionService';

export interface PersistedTestSession {
  id: string;
  userId: string;
  productType: string;
  testType: 'diagnostic' | 'practice' | 'drill';
  sectionName: string;
  currentQuestionIndex: number;
  answers: Record<number, string>;
  flaggedQuestions: number[];
  timeRemaining: number; // in seconds
  totalQuestions: number;
  startedAt: string;
  lastUpdatedAt: string;
  status: 'in-progress' | 'completed' | 'paused';
  sessionData?: Record<string, any>;
}

export interface SectionProgress {
  sectionName: string;
  status: 'not-started' | 'in-progress' | 'completed';
  questionsCompleted: number;
  totalQuestions: number;
  lastUpdated: string;
  sessionId?: string;
}

export class SessionPersistenceService {
  /**
   * Save test session progress using the new update_session_progress function
   */
  static async saveSession(session: PersistedTestSession): Promise<void> {
    try {
      console.log('💾 Starting session save process...', {
        sessionId: session.id,
        userId: session.userId,
        sectionName: session.sectionName,
        status: session.status
      });

      // Use the new TestSessionService method for updating progress
      await TestSessionService.updateSessionProgress(
        session.id,
        session.currentQuestionIndex,
        session.answers,
        session.flaggedQuestions,
        session.timeRemaining
      );

      // Keep localStorage as backup for immediate access
      const sessionData = {
        currentQuestionIndex: session.currentQuestionIndex,
        answers: session.answers,
        flaggedQuestions: session.flaggedQuestions,
        timeRemaining: session.timeRemaining,
        status: session.status,
        lastActivity: new Date().toISOString(),
        questionsAnswered: Object.keys(session.answers).length,
        ...(session.sessionData || {})
      };

      localStorage.setItem(`session_${session.id}`, JSON.stringify(sessionData));

      console.log('✅ Session saved:', session.id);
      console.log('📊 Session details:', {
        sectionName: session.sectionName,
        status: session.status,
        questionsAnswered: Object.keys(session.answers).length,
        currentQuestionIndex: session.currentQuestionIndex,
        timeRemaining: session.timeRemaining
      });
    } catch (error) {
      console.error('❌ Failed to save session:', error);
      throw new Error('Failed to save session progress');
    }
  }

  /**
   * Load test session by ID using the new get_session_for_resume function
   */
  static async loadSession(sessionId: string): Promise<PersistedTestSession | null> {
    try {
      // Use the new TestSessionService method for loading session data
      const sessionData = await TestSessionService.getSessionForResume(sessionId);
      
      if (!sessionData) {
        // Try loading from localStorage backup
        return this.loadSessionFromStorage(sessionId);
      }

      // Convert the database format to our interface format
      const answers: Record<number, string> = {};
      if (sessionData.sessionData?.answers) {
        Object.entries(sessionData.sessionData.answers).forEach(([key, value]) => {
          const index = parseInt(key);
          if (!isNaN(index)) {
            answers[index] = value as string;
          }
        });
      }

      return {
        id: sessionData.sessionId,
        userId: sessionData.userId,
        productType: sessionData.productType,
        testType: sessionData.testMode as 'diagnostic' | 'practice' | 'drill',
        sectionName: sessionData.sectionName,
        currentQuestionIndex: sessionData.currentQuestionIndex,
        answers,
        flaggedQuestions: sessionData.sessionData?.flaggedQuestions || [],
        timeRemaining: sessionData.sessionData?.timeRemainingSeconds || 3600,
        totalQuestions: sessionData.totalQuestions,
        startedAt: sessionData.startedAt,
        lastUpdatedAt: sessionData.sessionData?.lastUpdated || sessionData.startedAt,
        status: sessionData.status as 'in-progress' | 'completed' | 'paused',
        sessionData: sessionData.sessionData
      };
    } catch (error) {
      console.error('Failed to load session:', error);
      return this.loadSessionFromStorage(sessionId);
    }
  }

  /**
   * Get user's active session for a specific section
   */
  static async getActiveSessionForSection(
    userId: string,
    productType: string,
    sectionName: string
  ): Promise<PersistedTestSession | null> {
    try {
      // Create or resume session - this will return existing session if one exists
      const sessionId = await TestSessionService.createOrResumeSession(
        userId,
        productType,
        'diagnostic',
        sectionName
      );

      // Load the session data
      return await this.loadSession(sessionId);
    } catch (error) {
      console.error('Failed to get active session:', error);
      return null;
    }
  }

  /**
   * Get all section progress for a user's diagnostic test using the new function
   */
  static async getDiagnosticProgress(
    userId: string,
    productType: string
  ): Promise<Record<string, SectionProgress>> {
    try {
      console.log('🔍 getDiagnosticProgress called with:', { userId, productType });
      
      // Use the new database function
      const progressData = await TestSessionService.getDiagnosticProgress(userId, productType);
      
      const progressMap: Record<string, SectionProgress> = {};
      
      progressData.forEach((section: any) => {
        progressMap[section.section_name] = {
          sectionName: section.section_name,
          status: section.status,
          questionsCompleted: section.questions_completed,
          totalQuestions: section.total_questions,
          lastUpdated: section.last_updated,
          sessionId: section.session_id
        };
      });

      console.log('📊 Diagnostic progress loaded:', progressMap);
      return progressMap;
    } catch (error) {
      console.error('❌ Failed to get diagnostic progress:', error);
      return {};
    }
  }

  /**
   * Create or resume a test session using the new database function
   */
  static async createOrResumeSession(
    userId: string,
    productType: string,
    testMode: 'diagnostic' | 'practice' | 'drill',
    sectionName: string,
    totalQuestions?: number
  ): Promise<string> {
    try {
      console.log('🚀 Creating or resuming session:', {
        userId,
        productType,
        testMode,
        sectionName,
        totalQuestions
      });

      // Use the new TestSessionService method
      const sessionId = await TestSessionService.createOrResumeSession(
        userId,
        productType,
        testMode,
        sectionName,
        totalQuestions
      );

      console.log('✅ Session created/resumed:', sessionId);
      return sessionId;
    } catch (error) {
      console.error('❌ Failed to create/resume session:', error);
      throw new Error('Failed to create or resume session');
    }
  }

  /**
   * Complete a test session using the new database function
   */
  static async completeSession(
    sessionId: string, 
    userId: string,
    productType: string,
    testMode: string,
    sectionScores?: Record<string, any>
  ): Promise<void> {
    try {
      console.log('🏁 Completing session:', sessionId);

      // Get session data to calculate completion metrics
      const sessionData = await TestSessionService.getSessionForResume(sessionId);
      if (!sessionData) {
        throw new Error('Session not found');
      }

      // Calculate completion metrics
      const totalQuestions = sessionData.totalQuestions;
      const correctAnswers = Object.keys(sessionData.questionResponses).filter(
        questionId => sessionData.questionResponses[questionId].is_correct
      ).length;
      const totalTimeSeconds = Math.round((Date.now() - new Date(sessionData.startedAt).getTime()) / 1000);

      // Use the new TestSessionService method with proper interface
      await TestSessionService.completeSession({
        sessionId,
        userId,
        productType,
        testMode,
        totalQuestions,
        correctAnswers,
        totalTimeSeconds,
        sectionScores: sectionScores || {
          section_name: sessionData.sectionName,
          total_questions: totalQuestions,
          correct_answers: correctAnswers,
          accuracy_percentage: totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0,
          time_spent_seconds: totalTimeSeconds
        }
      });

      // Clean up localStorage
      localStorage.removeItem(`session_${sessionId}`);

      console.log('✅ Session completed successfully:', sessionId);
    } catch (error) {
      console.error('❌ Failed to complete session:', error);
      throw new Error('Failed to complete session');
    }
  }

  /**
   * Delete a test session - simplified to avoid type issues
   */
  static async deleteSession(sessionId: string): Promise<void> {
    try {
      // For now, just clean up localStorage until we add the delete function
      localStorage.removeItem(`session_${sessionId}`);
      console.log('✅ Session deleted from localStorage:', sessionId);
    } catch (error) {
      console.error('❌ Failed to delete session:', error);
      throw new Error('Failed to delete session');
    }
  }

  /**
   * Get user session statistics - simplified version
   */
  static async getUserSessionStats(
    userId: string,
    productType: string
  ): Promise<{
    totalSessions: number;
    completedSessions: number;
    inProgressSessions: number;
    averageCompletionTime: number;
  }> {
    try {
      // Use diagnostic progress to get basic stats
      const progressData = await TestSessionService.getDiagnosticProgress(userId, productType);
      
      const totalSessions = progressData.length;
      const completedSessions = progressData.filter(s => s.status === 'completed').length;
      const inProgressSessions = progressData.filter(s => s.status === 'in-progress').length;

      return {
        totalSessions,
        completedSessions,
        inProgressSessions,
        averageCompletionTime: 0 // Will implement later when we have more data
      };
    } catch (error) {
      console.error('Failed to get user session stats:', error);
      return {
        totalSessions: 0,
        completedSessions: 0,
        inProgressSessions: 0,
        averageCompletionTime: 0
      };
    }
  }

  /**
   * Get session metadata from localStorage
   */
  private static getSessionMetadataFromStorage(sessionId: string): any {
    try {
      const stored = localStorage.getItem(`session_${sessionId}`);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to get session metadata from storage:', error);
      return null;
    }
  }

  /**
   * Load session from localStorage backup
   */
  private static loadSessionFromStorage(sessionId: string): PersistedTestSession | null {
    try {
      const sessionData = this.getSessionMetadataFromStorage(sessionId);
      if (!sessionData) return null;

      return {
        id: sessionId,
        userId: sessionData.userId || '',
        productType: sessionData.productType || '',
        testType: sessionData.testType || 'diagnostic',
        sectionName: sessionData.sectionName || '',
        currentQuestionIndex: sessionData.currentQuestionIndex || 0,
        answers: sessionData.answers || {},
        flaggedQuestions: sessionData.flaggedQuestions || [],
        timeRemaining: sessionData.timeRemaining || 3600,
        totalQuestions: sessionData.totalQuestions || 0,
        startedAt: sessionData.startedAt || new Date().toISOString(),
        lastUpdatedAt: sessionData.lastActivity || new Date().toISOString(),
        status: sessionData.status || 'in-progress',
        sessionData: sessionData
      };
    } catch (error) {
      console.error('Failed to load session from storage:', error);
      return null;
    }
  }

  /**
   * Clean up old sessions from localStorage
   */
  static async cleanupOldSessions(daysOld: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('session_')) {
          const sessionData = this.getSessionMetadataFromStorage(key.replace('session_', ''));
          if (sessionData?.lastActivity) {
            const lastActivity = new Date(sessionData.lastActivity);
            if (lastActivity < cutoffDate) {
              keysToRemove.push(key);
            }
          }
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log(`🧹 Cleaned up ${keysToRemove.length} old sessions`);
    } catch (error) {
      console.error('Failed to cleanup old sessions:', error);
    }
  }
} 