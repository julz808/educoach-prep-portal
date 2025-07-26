import { supabase } from '@/lib/supabase';

export interface SimpleDiagnosticProgress {
  sectionName: string;
  status: 'not-started' | 'in-progress' | 'completed';
  questionsCompleted: number;
  totalQuestions: number;
  sessionId?: string;
  lastUpdated: string;
}

export class SimpleDiagnosticService {
  /**
   * Get diagnostic progress using direct table queries - no complex functions
   */
  static async getDiagnosticProgress(
    userId: string,
    productType: string
  ): Promise<Record<string, SimpleDiagnosticProgress>> {
    try {
      console.log('🔍 Getting diagnostic progress with direct query:', { userId, productType });

      // Direct query to user_test_sessions table
      const { data: sessions, error } = await supabase
        .from('user_test_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('product_type', productType)
        .eq('test_mode', 'diagnostic')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error querying sessions:', error);
        return {};
      }

      console.log('📊 Found sessions:', sessions);

      const progressMap: Record<string, SimpleDiagnosticProgress> = {};

      // Process each session to build progress map
      sessions?.forEach(session => {
        if (!session.section_name) return;

        const progress: SimpleDiagnosticProgress = {
          sectionName: session.section_name,
          status: session.status === 'completed' ? 'completed' : 
                 session.status === 'active' || session.status === 'paused' ? 'in-progress' : 
                 'not-started',
          questionsCompleted: session.questions_answered || 0,
          totalQuestions: session.total_questions || 0,
          sessionId: session.id,
          lastUpdated: session.updated_at || session.created_at
        };

        console.log(`🔍 Processing session for ${session.section_name}:`, {
          sessionId: session.id,
          status: session.status,
          lastUpdated: progress.lastUpdated,
          isMoreRecent: !progressMap[session.section_name] || 
            new Date(progress.lastUpdated) > new Date(progressMap[session.section_name].lastUpdated)
        });

        // Keep the most recent session for each section
        if (!progressMap[session.section_name] || 
            new Date(progress.lastUpdated) > new Date(progressMap[session.section_name].lastUpdated)) {
          console.log(`✅ Using session ${session.id} for ${session.section_name} (most recent)`);
          progressMap[session.section_name] = progress;
        } else {
          console.log(`⏭️ Skipping session ${session.id} for ${session.section_name} (older than current)`);
        }
      });

      console.log('✅ Diagnostic progress built:', progressMap);
      return progressMap;
    } catch (error) {
      console.error('Error getting diagnostic progress:', error);
      return {};
    }
  }

  /**
   * Create or resume a session using direct inserts/updates
   */
  static async createOrResumeSession(
    userId: string,
    productType: string,
    sectionName: string,
    totalQuestions: number
  ): Promise<string> {
    try {
      console.log('🚀 Creating/resuming session:', { userId, productType, sectionName, totalQuestions });

      // Check for existing active session
      const { data: existingSessions, error: queryError } = await supabase
        .from('user_test_sessions')
        .select('id, status')
        .eq('user_id', userId)
        .eq('product_type', productType)
        .eq('test_mode', 'diagnostic')
        .eq('section_name', sectionName)
        .in('status', ['active', 'paused'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (queryError) {
        console.error('Error checking existing sessions:', queryError);
      }

      // If active session exists, resume it
      if (existingSessions && existingSessions.length > 0) {
        const sessionId = existingSessions[0].id;
        console.log('🔄 Resuming existing session:', sessionId);

        // Update status to active
        await supabase
          .from('user_test_sessions')
          .update({ status: 'active', updated_at: new Date().toISOString() })
          .eq('id', sessionId);

        return sessionId;
      }

      // Create new session
      const { data: newSession, error: insertError } = await supabase
        .from('user_test_sessions')
        .insert({
          user_id: userId,
          product_type: productType,
          test_mode: 'diagnostic',
          section_name: sectionName,
          total_questions: totalQuestions,
          status: 'active',
          current_question_index: 0,
          questions_answered: 0,
          answers_data: {},
          flagged_questions: []
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('Error creating session:', insertError);
        throw insertError;
      }

      console.log('✅ Created new session:', newSession.id);
      return newSession.id;
    } catch (error) {
      console.error('Error creating/resuming session:', error);
      throw error;
    }
  }

  /**
   * Save session progress with direct updates
   */
  static async saveSessionProgress(
    sessionId: string,
    currentQuestionIndex: number,
    answers: Record<number, string>,
    flaggedQuestions: number[],
    timeRemaining: number
  ): Promise<void> {
    try {
      console.log('💾 Saving session progress:', { sessionId, currentQuestionIndex, answersCount: Object.keys(answers).length });

      console.log('💾 About to save answers to database:', answers);
      
      // Direct update to user_test_sessions
      const { error } = await supabase
        .from('user_test_sessions')
        .update({
          current_question_index: currentQuestionIndex,
          answers_data: answers,
          flagged_questions: flaggedQuestions,
          questions_answered: Object.keys(answers).length,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) {
        console.error('Error saving session progress:', error);
        throw error;
      }

      console.log('✅ Session progress saved successfully with answers:', Object.keys(answers));
    } catch (error) {
      console.error('Error saving session progress:', error);
      throw error;
    }
  }

  /**
   * Complete a session
   */
  static async completeSession(sessionId: string): Promise<void> {
    try {
      console.log('🏁 Completing session:', sessionId);

      const { error } = await supabase
        .from('user_test_sessions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) {
        console.error('Error completing session:', error);
        throw error;
      }

      console.log('✅ Session completed successfully');
    } catch (error) {
      console.error('Error completing session:', error);
      throw error;
    }
  }

  /**
   * Get session data for resuming with proper format
   */
  static async getSessionForResume(sessionId: string): Promise<any> {
    try {
      console.log('🔄 RESUME-DEBUG: Getting session for resume:', sessionId);

      const { data: session, error } = await supabase
        .from('user_test_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) {
        console.error('❌ RESUME-DEBUG: Error getting session:', error);
        console.error('❌ RESUME-DEBUG: Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          sessionId
        });
        return null;
      }

      if (!session) {
        console.error('❌ RESUME-DEBUG: No session found for ID:', sessionId);
        return null;
      }

      console.log('✅ Session data retrieved for resume:', session);
      console.log('🔍 Raw answers_data from database:', session.answers_data);

      // Format the session data for the frontend
      const formattedData = {
        sessionId: session.id,
        userId: session.user_id,
        productType: session.product_type,
        testMode: session.test_mode,
        sectionName: session.section_name,
        totalQuestions: session.total_questions,
        currentQuestionIndex: session.current_question_index || 0,
        status: session.status,
        startedAt: session.created_at,
        sessionData: {
          answers: session.answers_data || {},
          textAnswers: session.text_answers_data || {},
          flaggedQuestions: session.flagged_questions || [],
          timeRemainingSeconds: 3600, // Default time - could be stored in session
          lastUpdated: session.updated_at
        },
        questionOrder: session.question_order || [],
        questionResponses: {},
        sectionStates: []
      };

      console.log('🔍 Formatted session data answers:', formattedData.sessionData.answers);
      return formattedData;
    } catch (error) {
      console.error('Error getting session for resume:', error);
      return null;
    }
  }
}