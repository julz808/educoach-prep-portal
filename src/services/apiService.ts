// API Service Layer - Connecting Frontend to Enhanced Database Functions
// Provides type-safe methods for all database operations using the new RPC functions

import { supabase } from '../integrations/supabase/client';
import { Database, Tables, TablesInsert, TablesUpdate } from '../integrations/supabase/types';

// =====================================
// TYPE DEFINITIONS
// =====================================

export interface UserMasteryOverview {
  sub_skill: string;
  mastery_level: number;
  questions_attempted: number;
  questions_correct: number;
  last_practiced: string | null;
  accuracy_percentage: number;
  improvement_trend: 'excellent' | 'good' | 'improving' | 'developing' | 'needs_focus';
}

export interface DiagnosticQuestion {
  question_id: string;
  sub_skill: string;
  difficulty: number;
  mastery_level: number;
  question_text: string;
  answer_options: any;
  has_visual: boolean;
}

export interface RecommendedQuestion {
  question_id: string;
  sub_skill: string;
  difficulty: number;
  mastery_level: number;
  priority_score: number;
}

export interface TestSectionQuestion {
  question_id: string;
  question_text: string;
  sub_skill: string;
  difficulty: number;
  answer_options: any;
  correct_answer: string;
  has_visual: boolean;
  visual_data: any;
  passage_id: string | null;
}

export interface TestComplianceReport {
  section_name: string;
  target_questions: number;
  available_questions: number;
  compliance_percentage: number;
  missing_sub_skills: string[];
}

export interface UserAnalytics {
  total_questions_attempted: number;
  total_correct: number;
  overall_accuracy: number;
  total_time_spent: number;
  avg_time_per_question: number;
  tests_completed: number;
  strongest_sub_skill: string | null;
  weakest_sub_skill: string | null;
  daily_activity: Array<{
    date: string;
    questions: number;
    correct: number;
  }>;
}

export interface TestAttempt {
  id: string;
  user_id: string;
  product_type: string;
  test_mode: 'diagnostic' | 'practice' | 'drill' | 'practice_1' | 'practice_2' | 'practice_3';
  section_name?: string;
  test_number?: number;
  started_at: string;
  completed_at?: string;
  total_questions?: number;
  correct_answers?: number;
  time_spent_minutes?: number;
}

export interface QuestionResponse {
  attempt_id: string;
  question_id: string;
  user_answer: string;
  is_correct: boolean;
  time_spent_seconds: number;
}

// =====================================
// PROGRESS TRACKING API
// =====================================

export class ProgressAPI {
  /**
   * Update user progress for a specific sub-skill
   */
  static async updateProgress(
    userId: string,
    productType: string,
    subSkill: string,
    isCorrect: boolean
  ): Promise<void> {
    const { error } = await supabase.rpc('update_user_progress', {
      p_user_id: userId,
      p_product_type: productType,
      p_sub_skill: subSkill,
      p_is_correct: isCorrect
    });

    if (error) {
      throw new Error(`Failed to update progress: ${error.message}`);
    }
  }

  /**
   * Get comprehensive mastery overview for a user
   */
  static async getMasteryOverview(
    userId: string,
    productType: string
  ): Promise<UserMasteryOverview[]> {
    const { data, error } = await supabase.rpc('get_user_mastery_overview', {
      p_user_id: userId,
      p_product_type: productType
    });

    if (error) {
      throw new Error(`Failed to get mastery overview: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get user analytics and performance metrics
   */
  static async getUserAnalytics(
    userId: string,
    productType: string,
    daysBack: number = 30
  ): Promise<UserAnalytics | null> {
    const { data, error } = await supabase.rpc('get_user_analytics', {
      p_user_id: userId,
      p_product_type: productType,
      p_days_back: daysBack
    });

    if (error) {
      throw new Error(`Failed to get user analytics: ${error.message}`);
    }

    return data?.[0] || null;
  }
}

// =====================================
// TEST GENERATION API
// =====================================

export class TestAPI {
  /**
   * Generate a diagnostic test (1 question per sub-skill)
   */
  static async generateDiagnosticTest(
    userId: string,
    productType: string
  ): Promise<DiagnosticQuestion[]> {
    const { data, error } = await supabase.rpc('generate_diagnostic_test', {
      p_user_id: userId,
      p_product_type: productType
    });

    if (error) {
      throw new Error(`Failed to generate diagnostic test: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get recommended practice questions based on mastery levels
   */
  static async getRecommendedPractice(
    userId: string,
    productType: string,
    targetCount: number = 10
  ): Promise<RecommendedQuestion[]> {
    const { data, error } = await supabase.rpc('get_recommended_practice', {
      p_user_id: userId,
      p_product_type: productType,
      p_target_count: targetCount
    });

    if (error) {
      throw new Error(`Failed to get recommended practice: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get questions for a specific test section
   */
  static async getTestSectionQuestions(
    testType: string,
    sectionName: string,
    targetCount: number = 10,
    difficultyFilter?: number
  ): Promise<TestSectionQuestion[]> {
    const { data, error } = await supabase.rpc('get_test_section_questions', {
      p_test_type: testType,
      p_section_name: sectionName,
      p_target_count: targetCount,
      p_difficulty_filter: difficultyFilter
    });

    if (error) {
      throw new Error(`Failed to get test section questions: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Check test structure compliance
   */
  static async checkTestCompliance(
    testType: string
  ): Promise<TestComplianceReport[]> {
    const { data, error } = await supabase.rpc('check_test_structure_compliance', {
      p_test_type: testType
    });

    if (error) {
      throw new Error(`Failed to check test compliance: ${error.message}`);
    }

    return data || [];
  }
}

// =====================================
// TEST ATTEMPT MANAGEMENT API
// =====================================

export class TestAttemptAPI {
  /**
   * Create a new test attempt
   */
  static async createTestAttempt(
    testAttempt: TablesInsert<'test_attempts'>
  ): Promise<TestAttempt> {
    const { data, error } = await supabase
      .from('test_attempts')
      .insert(testAttempt)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create test attempt: ${error.message}`);
    }

    return data;
  }

  /**
   * Update test attempt (e.g., mark as completed)
   */
  static async updateTestAttempt(
    attemptId: string,
    updates: TablesUpdate<'test_attempts'>
  ): Promise<TestAttempt> {
    const { data, error } = await supabase
      .from('test_attempts')
      .update(updates)
      .eq('id', attemptId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update test attempt: ${error.message}`);
    }

    return data;
  }

  /**
   * Get user's test attempts
   */
  static async getUserTestAttempts(
    userId: string,
    productType?: string,
    testMode?: 'diagnostic' | 'practice' | 'drill'
  ): Promise<TestAttempt[]> {
    let query = supabase
      .from('test_attempts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (productType) {
      query = query.eq('product_type', productType);
    }

    if (testMode) {
      query = query.eq('test_mode', testMode);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get test attempts: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Submit a question response
   */
  static async submitQuestionResponse(
    response: TablesInsert<'question_responses'>
  ): Promise<void> {
    const { error } = await supabase
      .from('question_responses')
      .insert(response);

    if (error) {
      throw new Error(`Failed to submit question response: ${error.message}`);
    }
  }

  /**
   * Get responses for a test attempt
   */
  static async getTestAttemptResponses(
    attemptId: string
  ): Promise<Tables<'question_responses'>[]> {
    const { data, error } = await supabase
      .from('question_responses')
      .select('*')
      .eq('attempt_id', attemptId)
      .order('created_at');

    if (error) {
      throw new Error(`Failed to get test responses: ${error.message}`);
    }

    return data || [];
  }
}

// =====================================
// QUESTION MANAGEMENT API
// =====================================

export class QuestionAPI {
  /**
   * Get a specific question with all details
   */
  static async getQuestion(questionId: string): Promise<Tables<'questions'> | null> {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('id', questionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Question not found
      }
      throw new Error(`Failed to get question: ${error.message}`);
    }

    return data;
  }

  /**
   * Get questions with optional filtering
   */
  static async getQuestions(filters: {
    testType?: string;
    sectionName?: string;
    subSkill?: string;
    difficulty?: number;
    hasVisual?: boolean;
    testMode?: string;
    limit?: number;
  } = {}): Promise<Tables<'questions'>[]> {
    let query = supabase
      .from('questions')
      .select('*')
      .eq('reviewed', true);

    if (filters.testType) {
      query = query.eq('test_type', filters.testType);
    }
    if (filters.sectionName) {
      query = query.eq('section_name', filters.sectionName);
    }
    if (filters.subSkill) {
      query = query.eq('sub_skill', filters.subSkill);
    }
    if (filters.difficulty) {
      query = query.eq('difficulty', filters.difficulty);
    }
    if (filters.hasVisual !== undefined) {
      query = query.eq('has_visual', filters.hasVisual);
    }
    if (filters.testMode) {
      query = query.eq('test_mode', filters.testMode);
    }
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get questions: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Save a generated question
   */
  static async saveQuestion(
    question: TablesInsert<'questions'>
  ): Promise<Tables<'questions'>> {
    const { data, error } = await supabase
      .from('questions')
      .insert(question)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save question: ${error.message}`);
    }

    return data;
  }
}

// =====================================
// PASSAGE MANAGEMENT API
// =====================================

export class PassageAPI {
  /**
   * Get a specific passage
   */
  static async getPassage(passageId: string): Promise<Tables<'passages'> | null> {
    const { data, error } = await supabase
      .from('passages')
      .select('*')
      .eq('id', passageId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Passage not found
      }
      throw new Error(`Failed to get passage: ${error.message}`);
    }

    return data;
  }

  /**
   * Get passages with filtering
   */
  static async getPassages(filters: {
    testType?: string;
    yearLevel?: number;
    sectionName?: string;
    passageType?: string;
    australianContext?: boolean;
    limit?: number;
  } = {}): Promise<Tables<'passages'>[]> {
    let query = supabase
      .from('passages')
      .select('*');

    if (filters.testType) {
      query = query.eq('test_type', filters.testType);
    }
    if (filters.yearLevel) {
      query = query.eq('year_level', filters.yearLevel);
    }
    if (filters.sectionName) {
      query = query.eq('section_name', filters.sectionName);
    }
    if (filters.passageType) {
      query = query.eq('passage_type', filters.passageType);
    }
    if (filters.australianContext !== undefined) {
      query = query.eq('australian_context', filters.australianContext);
    }
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get passages: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Save a generated passage
   */
  static async savePassage(
    passage: TablesInsert<'passages'>
  ): Promise<Tables<'passages'>> {
    const { data, error } = await supabase
      .from('passages')
      .insert(passage)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save passage: ${error.message}`);
    }

    return data;
  }
}

// =====================================
// USER PRODUCT ACCESS API
// =====================================

export class UserProductAPI {
  /**
   * Check if user has access to a product
   */
  static async hasProductAccess(
    userId: string,
    productType: string
  ): Promise<boolean> {
    const { data, error } = await supabase
      .from('user_products')
      .select('id')
      .eq('user_id', userId)
      .eq('product_type', productType)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to check product access: ${error.message}`);
    }

    return !!data;
  }

  /**
   * Get user's active products
   */
  static async getUserProducts(userId: string): Promise<Tables<'user_products'>[]> {
    const { data, error } = await supabase
      .from('user_products')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('purchased_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get user products: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Grant product access to user (after purchase)
   */
  static async grantProductAccess(
    userId: string,
    productType: string,
    stripeSubscriptionId?: string
  ): Promise<Tables<'user_products'>> {
    const { data, error } = await supabase
      .from('user_products')
      .insert({
        user_id: userId,
        product_type: productType,
        stripe_subscription_id: stripeSubscriptionId,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to grant product access: ${error.message}`);
    }

    return data;
  }
}

// =====================================
// COMBINED API CLASS
// =====================================

export class EduCourseAPI {
  static Progress = ProgressAPI;
  static Test = TestAPI;
  static TestAttempt = TestAttemptAPI;
  static Question = QuestionAPI;
  static Passage = PassageAPI;
  static UserProduct = UserProductAPI;
}

export default EduCourseAPI; 