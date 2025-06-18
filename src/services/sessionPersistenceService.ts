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
  sessionData?: Record<string, unknown>;
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
   * Real-time session state persistence - always saves to backend immediately
   */
  static async saveSessionRealtime(session: PersistedTestSession): Promise<void> {
    try {
      console.log('💾 Real-time session save process:', {
        sessionId: session.id,
        userId: session.userId,
        sectionName: session.sectionName,
        status: session.status,
        currentQuestion: session.currentQuestionIndex,
        timeRemaining: session.timeRemaining
      });

      // Extract question order from session data if available
      const questionOrder = session.sessionData?.questionIds || 
                           session.sessionData?.questions || 
                           [];

      // Save to both tables immediately with real-time updates
      await Promise.all([
        // Update main session progress
        TestSessionService.autoSaveSessionProgress(
          session.id,
          session.currentQuestionIndex,
          session.answers,
          session.flaggedQuestions,
          session.timeRemaining,
          questionOrder,
          session.sectionName
        ),
        // Update timer state in real-time
        TestSessionService.updateTimerRealtime(
          session.id,
          session.sectionName,
          session.timeRemaining
        )
      ]);

      console.log('✅ Real-time session state persisted to backend');
    } catch (error) {
      console.error('❌ Real-time session save failed:', error);
      throw error;
    }
  }

  /**
   * Enhanced auto-save session progress using the new auto-save functionality
   */
  static async saveSession(session: PersistedTestSession): Promise<void> {
    try {
      console.log('💾 Starting enhanced session save process...', {
        sessionId: session.id,
        userId: session.userId,
        sectionName: session.sectionName,
        status: session.status
      });

      // Extract question order from session data if available
      const questionOrder = session.sessionData?.questionIds || 
                           session.sessionData?.questions || 
                           [];

      // Use the new enhanced auto-save method that saves to both tables
      await TestSessionService.autoSaveSessionProgress(
        session.id,
        session.currentQuestionIndex,
        session.answers,
        session.flaggedQuestions,
        session.timeRemaining,
        questionOrder,
        session.sectionName
      );

      // Remove localStorage dependency - all state now comes from backend
      // No local storage needed as backend is the single source of truth

      console.log('✅ Session saved:', session.id);
      console.log('📊 Session details:', {
        sectionName: session.sectionName,
        status: session.status,
        questionsAnswered: Object.keys(session.answers).length,
        currentQuestionIndex: session.currentQuestionIndex,
        timeRemaining: session.timeRemaining,
        questionOrderLength: questionOrder.length
      });
    } catch (error) {
      console.error('❌ Failed to save session:', error);
      throw new Error('Failed to save session progress');
    }
  }

  /**
   * Load complete session state from backend - no local fallbacks
   */
  static async loadSession(sessionId: string): Promise<PersistedTestSession | null> {
    try {
      console.log('🔄 Loading session state from backend:', sessionId);
      
      // Use simple direct loading for diagnostic sessions
      const { SimpleDiagnosticService } = await import('./simpleDiagnosticService');
      const sessionData = await SimpleDiagnosticService.getSessionForResume(sessionId);
      
      if (!sessionData) {
        console.log('⚠️ No session found in backend:', sessionId);
        return null;
      }

      // Convert answers from object to Record<number, string> format
      const answers: Record<number, string> = {};
      
      console.log('🔍 Converting answers from sessionData:', sessionData.sessionData?.answers);
      
      if (sessionData.sessionData?.answers) {
        Object.entries(sessionData.sessionData.answers).forEach(([key, value]) => {
          const index = parseInt(key);
          if (!isNaN(index)) {
            answers[index] = value as string;
            console.log(`🔍 Converted answer ${key} -> ${index}: ${value}`);
          }
        });
        console.log('✅ Loaded answers from session data:', Object.keys(answers).length);
        console.log('✅ Final answers object:', answers);
      } else {
        console.log('⚠️ No answers found in sessionData');
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
        sessionData: {
          ...sessionData.sessionData,
          questionIds: sessionData.questionOrder,
          questionResponses: sessionData.questionResponses,
          sectionStates: sessionData.sectionStates
        }
      };
    } catch (error) {
      console.error('Failed to load session from backend:', error);
      return null;
    }
  }

  /**
   * Get user's active session for a specific section with enhanced state checking
   */
  static async getActiveSessionForSection(
    userId: string,
    productType: string,
    sectionName: string,
    testMode: 'diagnostic' | 'practice' | 'drill' = 'diagnostic'
  ): Promise<PersistedTestSession | null> {
    try {
      // First check if there's an active session
      const sessionState = await TestSessionService.getSessionState(
        userId,
        productType,
        testMode,
        sectionName
      );

      if (sessionState.hasActiveSession && sessionState.sessionId) {
        console.log('🔄 Found active session, loading...', sessionState.sessionId);
        return await this.loadSession(sessionState.sessionId);
      }

      // No active session found
      console.log('ℹ️ No active session found for section:', sectionName);
      return null;
    } catch (error) {
      console.error('Failed to get active session:', error);
      return null;
    }
  }

  /**
   * Check session resume state for dashboard display
   */
  static async getSessionResumeState(
    userId: string,
    productType: string,
    testMode: 'diagnostic' | 'practice' | 'drill',
    sectionName?: string
  ): Promise<{
    canResume: boolean;
    sessionId?: string;
    progress?: {
      currentQuestion: number;
      totalQuestions: number;
      timeRemaining: number;
      answersCount: number;
    };
  }> {
    try {
      const sessionState = await TestSessionService.getSessionState(
        userId,
        productType,
        testMode,
        sectionName
      );

      if (sessionState.hasActiveSession && sessionState.sessionId) {
        const session = await this.loadSession(sessionState.sessionId);
        if (session) {
          return {
            canResume: true,
            sessionId: session.id,
            progress: {
              currentQuestion: session.currentQuestionIndex + 1,
              totalQuestions: session.totalQuestions,
              timeRemaining: session.timeRemaining,
              answersCount: Object.keys(session.answers).length
            }
          };
        }
      }

      return { canResume: false };
    } catch (error) {
      console.error('Failed to get session resume state:', error);
      return { canResume: false };
    }
  }

  /**
   * Get all section progress for a user's diagnostic test using simple direct queries
   */
  static async getDiagnosticProgress(
    userId: string,
    productType: string
  ): Promise<Record<string, SectionProgress>> {
    try {
      console.log('🔍 getDiagnosticProgress called with:', { userId, productType });
      
      // Use simple direct database queries instead of complex functions
      const { SimpleDiagnosticService } = await import('./simpleDiagnosticService');
      const progressData = await SimpleDiagnosticService.getDiagnosticProgress(userId, productType);
      
      const progressMap: Record<string, SectionProgress> = {};
      
      // Convert simple progress to our interface
      Object.values(progressData).forEach(section => {
        progressMap[section.sectionName] = {
          sectionName: section.sectionName,
          status: section.status,
          questionsCompleted: section.questionsCompleted,
          totalQuestions: section.totalQuestions,
          lastUpdated: section.lastUpdated,
          sessionId: section.sessionId
        };
      });

      console.log('📊 Diagnostic progress processed:', progressMap);
      return progressMap;
    } catch (error) {
      console.error('❌ Failed to get diagnostic progress:', error);
      console.error('❌ Error details:', error.message, error.stack);
      return {};
    }
  }

  /**
   * Create or resume a test session using simple direct operations
   */
  static async createOrResumeSession(
    userId: string,
    productType: string,
    testMode: 'diagnostic' | 'practice' | 'drill',
    sectionName: string,
    totalQuestions?: number,
    questionIds?: string[] // Add question IDs parameter
  ): Promise<string> {
    try {
      console.log('🚀 Creating or resuming session:', {
        userId,
        productType,
        testMode,
        sectionName,
        totalQuestions,
        questionIdsLength: questionIds?.length || 0
      });

      // Use simple direct database operations for diagnostics
      if (testMode === 'diagnostic') {
        const { SimpleDiagnosticService } = await import('./simpleDiagnosticService');
        const sessionId = await SimpleDiagnosticService.createOrResumeSession(
          userId,
          productType,
          sectionName,
          totalQuestions || 0
        );
        console.log('✅ Session created/resumed:', sessionId);
        return sessionId;
      }

      // Fallback for other test modes (keeping original logic for now)
      const sessionId = await TestSessionService.createOrResumeSession(
        userId,
        productType,
        testMode,
        sectionName,
        totalQuestions,
        questionIds
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
    sectionScores?: Record<string, unknown>
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
   * Setup auto-save with window exit handlers
   */
  static setupAutoSave(
    session: PersistedTestSession,
    saveCallback: () => Promise<void>
  ): {
    intervalId: number;
    cleanupHandlers: () => void;
  } {
    // Setup periodic auto-save (every 30 seconds)
    const intervalId = TestSessionService.startAutoSaveInterval(
      session.id,
      saveCallback,
      30000
    );

    // Setup window exit handlers
    const cleanupHandlers = TestSessionService.setupWindowExitHandlers(
      session.id,
      saveCallback
    );

    return { intervalId, cleanupHandlers };
  }

  /**
   * Stop auto-save and cleanup handlers
   */
  static stopAutoSave(intervalId: number, cleanupHandlers: () => void): void {
    TestSessionService.stopAutoSaveInterval(intervalId);
    cleanupHandlers();
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