import { supabase } from '@/lib/supabase';

export interface TestSession {
  id: string;
  userId: string;
  productType: string;
  testMode: 'diagnostic' | 'practice' | 'drill';
  sectionName: string;
  currentQuestionIndex: number;
  answers: Record<string, string>; // questionIndex -> selectedOption
  textAnswers: Record<string, string>; // questionIndex -> text response
  flaggedQuestions: string[];
  timeRemainingSeconds: number;
  totalQuestions: number;
  status: 'active' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface SectionProgress {
  sectionName: string;
  sessionId: string | null;
  status: 'not-started' | 'in-progress' | 'completed';
  questionsAnswered: number;
  totalQuestions: number;
  lastUpdated: string;
}

export class SessionService {
  /**
   * Create a new test session (or resume existing active one)
   */
  static async createSession(
    userId: string,
    productType: string,
    testMode: 'diagnostic' | 'practice' | 'drill',
    sectionName: string,
    totalQuestions: number,
    timeLimitSeconds?: number
  ): Promise<string> {
    // First check if there's already an active session
    const existingSessionId = await this.getActiveSession(userId, productType, sectionName, testMode);
    
    if (existingSessionId) {
      console.log('🔄 Found existing active session:', existingSessionId);
      return existingSessionId;
    }

    // No active session, create a new one
    const { data, error } = await supabase
      .from('user_test_sessions')
      .insert({
        user_id: userId,
        product_type: productType,
        test_mode: testMode,
        section_name: sectionName,
        total_questions: totalQuestions,
        status: 'active',
        current_question_index: 0,
        questions_answered: 0,
        answers_data: {},
        flagged_questions: [],
        time_remaining_seconds: timeLimitSeconds || 3600 // Default to 1 hour if not provided
      })
      .select('id')
      .single();

    if (error) {
      // If it's a duplicate key error, try to get the existing session
      if (error.code === '23505') {
        console.log('⚠️ Duplicate session detected, fetching existing...');
        const existingSessionId = await this.getActiveSession(userId, productType, sectionName, testMode);
        if (existingSessionId) {
          console.log('🔄 Using existing session:', existingSessionId);
          return existingSessionId;
        }
      }
      throw error;
    }
    console.log('✅ Created new session:', data.id);
    return data.id;
  }

  /**
   * Save session progress
   */
  static async saveProgress(
    sessionId: string,
    currentQuestionIndex: number,
    answers: Record<string, string>,
    flaggedQuestions: string[],
    timeRemainingSeconds: number,
    textAnswers?: Record<string, string>
  ): Promise<void> {
    console.log('💾 SAVE: Starting saveProgress for session:', sessionId);
    console.log('💾 SAVE: Current question index:', currentQuestionIndex);
    console.log('💾 SAVE: Answers being saved:', answers);
    console.log('💾 SAVE: Text answers being saved:', textAnswers || {});
    console.log('💾 SAVE: Flagged questions:', flaggedQuestions);
    console.log('💾 SAVE: Time remaining:', timeRemainingSeconds);

    const updateData: any = {
      current_question_index: currentQuestionIndex,
      answers_data: answers,
      flagged_questions: flaggedQuestions,
      questions_answered: Object.keys(answers).length,
      time_remaining_seconds: timeRemainingSeconds,
      updated_at: new Date().toISOString()
    };

    // Add text answers if provided
    if (textAnswers && Object.keys(textAnswers).length > 0) {
      updateData.text_answers_data = textAnswers;
      console.log('💾 SAVE: Adding text answers to update data');
    }

    console.log('💾 SAVE: Final update data:', updateData);

    const { error } = await supabase
      .from('user_test_sessions')
      .update(updateData)
      .eq('id', sessionId);

    if (error) {
      console.error('💾 SAVE ERROR:', error);
      throw error;
    }
    
    console.log('💾 SAVE: Successfully saved progress');
    
    // Verify the save by reading back the data
    const verification = await supabase
      .from('user_test_sessions')
      .select('current_question_index, answers_data, text_answers_data, time_remaining_seconds')
      .eq('id', sessionId)
      .single();
      
    if (verification.data) {
      console.log('💾 VERIFY: Data after save:', verification.data);
    }
  }

  /**
   * Load session data
   */
  static async loadSession(sessionId: string): Promise<TestSession | null> {
    console.log('📥 LOAD: Loading session:', sessionId);
    
    const { data, error } = await supabase
      .from('user_test_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) {
      console.error('📥 LOAD ERROR:', error);
      return null;
    }
    
    if (!data) {
      console.log('📥 LOAD: No data found for session:', sessionId);
      return null;
    }

    console.log('📥 LOAD: Raw data from database:', {
      id: data.id,
      current_question_index: data.current_question_index,
      answers_data: data.answers_data,
      text_answers_data: data.text_answers_data,
      flagged_questions: data.flagged_questions,
      time_remaining_seconds: data.time_remaining_seconds,
      status: data.status,
      updated_at: data.updated_at
    });

    const session = {
      id: data.id,
      userId: data.user_id,
      productType: data.product_type,
      testMode: data.test_mode,
      sectionName: data.section_name,
      currentQuestionIndex: data.current_question_index || 0,
      answers: data.answers_data || {},
      textAnswers: data.text_answers_data || {},
      flaggedQuestions: data.flagged_questions || [],
      timeRemainingSeconds: data.time_remaining_seconds || 3600,
      totalQuestions: data.total_questions,
      status: data.status === 'completed' ? 'completed' : 'active',
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
    
    console.log('📥 LOAD: Transformed session data:', {
      id: session.id,
      currentQuestionIndex: session.currentQuestionIndex,
      answers: session.answers,
      textAnswers: session.textAnswers,
      answersCount: Object.keys(session.answers).length,
      textAnswersCount: Object.keys(session.textAnswers).length,
      timeRemaining: session.timeRemainingSeconds
    });

    return session;
  }

  /**
   * Complete a session
   */
  static async completeSession(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from('user_test_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (error) throw error;
  }

  /**
   * Get user's progress for a product
   */
  static async getUserProgress(
    userId: string,
    productType: string,
    testMode: 'diagnostic' | 'practice' | 'drill' = 'diagnostic'
  ): Promise<Record<string, SectionProgress>> {
    console.log('📊 PROGRESS: Loading user progress for:', { userId, productType, testMode });
    
    const { data, error } = await supabase
      .from('user_test_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('product_type', productType)
      .eq('test_mode', testMode)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error loading user progress:', error);
      return {};
    }

    console.log('📊 PROGRESS: Raw session data from database:', data?.map(s => ({
      id: s.id.substring(0, 8) + '...',
      section_name: s.section_name,
      status: s.status,
      created_at: s.created_at?.substring(0, 16),
      updated_at: s.updated_at?.substring(0, 16)
    })));
    const progressMap: Record<string, SectionProgress> = {};

    // Keep only the most recent session for each section
    data?.forEach(session => {
      if (!session.section_name) return;
      
      console.log(`📊 PROGRESS: Processing session for "${session.section_name}":`, {
        id: session.id,
        status: session.status,
        updated_at: session.updated_at
      });
      
      const existing = progressMap[session.section_name];
      if (!existing || new Date(session.updated_at) > new Date(existing.lastUpdated)) {
        const mappedStatus = session.status === 'completed' ? 'completed' : 
                           session.status === 'active' ? 'in-progress' : 'not-started';
        
        console.log(`📊 PROGRESS: Mapping "${session.section_name}" status from "${session.status}" to "${mappedStatus}"`);
        
        progressMap[session.section_name] = {
          sectionName: session.section_name,
          sessionId: session.id, // Always include session ID for both active and completed sessions
          status: mappedStatus,
          questionsAnswered: session.questions_answered || 0,
          totalQuestions: session.total_questions || 0,
          lastUpdated: session.updated_at
        };
      }
    });

    console.log('📊 PROGRESS: Final progress map:', progressMap);
    return progressMap;
  }

  /**
   * Get active session for a section
   */
  static async getActiveSession(
    userId: string,
    productType: string,
    sectionName: string,
    testMode: 'diagnostic' | 'practice' | 'drill' = 'diagnostic'
  ): Promise<string | null> {
    const { data, error } = await supabase
      .from('user_test_sessions')
      .select('id')
      .eq('user_id', userId)
      .eq('product_type', productType)
      .eq('test_mode', testMode)
      .eq('section_name', sectionName)
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) return null;
    return data[0].id;
  }
}