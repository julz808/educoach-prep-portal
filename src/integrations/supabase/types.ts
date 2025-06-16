export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      passages: {
        Row: {
          australian_context: boolean | null
          content: string
          created_at: string | null
          difficulty: number
          id: string
          passage_type: string
          section_name: string
          test_type: string
          title: string
          updated_at: string | null
          word_count: number | null
          year_level: number
        }
        Insert: {
          australian_context?: boolean | null
          content: string
          created_at?: string | null
          difficulty?: number
          id?: string
          passage_type: string
          section_name: string
          test_type: string
          title: string
          updated_at?: string | null
          word_count?: number | null
          year_level: number
        }
        Update: {
          australian_context?: boolean | null
          content?: string
          created_at?: string | null
          difficulty?: number
          id?: string
          passage_type?: string
          section_name?: string
          test_type?: string
          title?: string
          updated_at?: string | null
          word_count?: number | null
          year_level?: number
        }
        Relationships: []
      }
      question_responses: {
        Row: {
          attempt_id: string | null
          created_at: string | null
          id: string
          is_correct: boolean | null
          question_id: string | null
          time_spent_seconds: number | null
          user_answer: string | null
        }
        Insert: {
          attempt_id?: string | null
          created_at?: string | null
          id?: string
          is_correct?: boolean | null
          question_id?: string | null
          time_spent_seconds?: number | null
          user_answer?: string | null
        }
        Update: {
          attempt_id?: string | null
          created_at?: string | null
          id?: string
          is_correct?: boolean | null
          question_id?: string | null
          time_spent_seconds?: number | null
          user_answer?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "question_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          answer_options: Json | null
          correct_answer: string | null
          created_at: string | null
          curriculum_aligned: boolean | null
          difficulty: number
          explanation: string | null
          generated_by: string | null
          has_visual: boolean | null
          id: string
          passage_id: string | null
          performance_data: Json | null
          product_type: string | null
          question_order: number | null
          question_sequence: number | null
          question_text: string
          response_type: string
          reviewed: boolean | null
          section_name: string
          solution: string
          sub_skill: string
          sub_skill_id: string | null
          test_mode: string
          test_type: string
          time_estimate_seconds: number | null
          updated_at: string | null
          visual_data: Json | null
          visual_svg: string | null
          visual_type: string | null
          visual_url: string | null
          year_level: number
        }
        Insert: {
          answer_options?: Json | null
          correct_answer?: string | null
          created_at?: string | null
          curriculum_aligned?: boolean | null
          difficulty: number
          explanation?: string | null
          generated_by?: string | null
          has_visual?: boolean | null
          id?: string
          passage_id?: string | null
          performance_data?: Json | null
          product_type?: string | null
          question_order?: number | null
          question_sequence?: number | null
          question_text: string
          response_type: string
          reviewed?: boolean | null
          section_name: string
          solution: string
          sub_skill: string
          sub_skill_id?: string | null
          test_mode?: string
          test_type: string
          time_estimate_seconds?: number | null
          updated_at?: string | null
          visual_data?: Json | null
          visual_svg?: string | null
          visual_type?: string | null
          visual_url?: string | null
          year_level: number
        }
        Update: {
          answer_options?: Json | null
          correct_answer?: string | null
          created_at?: string | null
          curriculum_aligned?: boolean | null
          difficulty?: number
          explanation?: string | null
          generated_by?: string | null
          has_visual?: boolean | null
          id?: string
          passage_id?: string | null
          performance_data?: Json | null
          product_type?: string | null
          question_order?: number | null
          question_sequence?: number | null
          question_text?: string
          response_type?: string
          reviewed?: boolean | null
          section_name?: string
          solution?: string
          sub_skill?: string
          sub_skill_id?: string | null
          test_mode?: string
          test_type?: string
          time_estimate_seconds?: number | null
          updated_at?: string | null
          visual_data?: Json | null
          visual_svg?: string | null
          visual_type?: string | null
          visual_url?: string | null
          year_level?: number
        }
        Relationships: [
          {
            foreignKeyName: "questions_passage_id_fkey"
            columns: ["passage_id"]
            isOneToOne: false
            referencedRelation: "passages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_sub_skill_id_fkey"
            columns: ["sub_skill_id"]
            isOneToOne: false
            referencedRelation: "sub_skills"
            referencedColumns: ["id"]
          },
        ]
      }
      questions_backup: {
        Row: {
          id: string | null
          product_type: string | null
          section_name: string | null
          sub_skill: string | null
        }
        Insert: {
          id?: string | null
          product_type?: string | null
          section_name?: string | null
          sub_skill?: string | null
        }
        Update: {
          id?: string | null
          product_type?: string | null
          section_name?: string | null
          sub_skill?: string | null
        }
        Relationships: []
      }
      schema_migrations: {
        Row: {
          applied_at: string | null
          id: number
          migration_name: string
        }
        Insert: {
          applied_at?: string | null
          id?: number
          migration_name: string
        }
        Update: {
          applied_at?: string | null
          id?: number
          migration_name?: string
        }
        Relationships: []
      }
      sub_skills: {
        Row: {
          created_at: string | null
          id: string
          name: string
          product_type: string
          section_id: string | null
          skill_category: string | null
          visual_required: boolean | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          product_type: string
          section_id?: string | null
          skill_category?: string | null
          visual_required?: boolean | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          product_type?: string
          section_id?: string | null
          skill_category?: string | null
          visual_required?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "sub_skills_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "test_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      test_sections: {
        Row: {
          created_at: string | null
          id: string
          product_type: string
          question_count: number | null
          section_name: string
          section_order: number
          time_limit_minutes: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_type: string
          question_count?: number | null
          section_name: string
          section_order: number
          time_limit_minutes?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          product_type?: string
          question_count?: number | null
          section_name?: string
          section_order?: number
          time_limit_minutes?: number | null
        }
        Relationships: []
      }
      test_structure_compliance: {
        Row: {
          answer_format: string | null
          compliance_percentage: number | null
          created_at: string | null
          generated_questions: number | null
          id: string
          section_name: string
          target_questions: number | null
          test_type: string
          time_allocation: number | null
          updated_at: string | null
        }
        Insert: {
          answer_format?: string | null
          compliance_percentage?: number | null
          created_at?: string | null
          generated_questions?: number | null
          id?: string
          section_name: string
          target_questions?: number | null
          test_type: string
          time_allocation?: number | null
          updated_at?: string | null
        }
        Update: {
          answer_format?: string | null
          compliance_percentage?: number | null
          created_at?: string | null
          generated_questions?: number | null
          id?: string
          section_name?: string
          target_questions?: number | null
          test_type?: string
          time_allocation?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      test_templates: {
        Row: {
          created_at: string | null
          id: string
          product_type: string
          sections: Json | null
          test_mode: string
          test_name: string | null
          test_number: number | null
          time_limit_minutes: number | null
          total_questions: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_type: string
          sections?: Json | null
          test_mode: string
          test_name?: string | null
          test_number?: number | null
          time_limit_minutes?: number | null
          total_questions?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          product_type?: string
          sections?: Json | null
          test_mode?: string
          test_name?: string | null
          test_number?: number | null
          time_limit_minutes?: number | null
          total_questions?: number | null
        }
        Relationships: []
      }
      user_products: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          product_type: string
          purchased_at: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          product_type: string
          purchased_at?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          product_type?: string
          purchased_at?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          created_at: string | null
          diagnostic_completed: boolean | null
          diagnostic_score: number | null
          id: string
          last_activity_at: string | null
          practice_tests_completed: number[] | null
          product_type: string
          streak_days: number | null
          total_questions_completed: number | null
          total_study_time_seconds: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          diagnostic_completed?: boolean | null
          diagnostic_score?: number | null
          id?: string
          last_activity_at?: string | null
          practice_tests_completed?: number[] | null
          product_type: string
          streak_days?: number | null
          total_questions_completed?: number | null
          total_study_time_seconds?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          diagnostic_completed?: boolean | null
          diagnostic_score?: number | null
          id?: string
          last_activity_at?: string | null
          practice_tests_completed?: number[] | null
          product_type?: string
          streak_days?: number | null
          total_questions_completed?: number | null
          total_study_time_seconds?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_question_responses: {
        Row: {
          attempt_number: number | null
          created_at: string | null
          id: string
          is_correct: boolean
          is_flagged: boolean | null
          is_skipped: boolean | null
          product_type: string
          question_id: string
          test_session_id: string | null
          time_spent_seconds: number | null
          user_answer: string | null
          user_id: string
        }
        Insert: {
          attempt_number?: number | null
          created_at?: string | null
          id?: string
          is_correct: boolean
          is_flagged?: boolean | null
          is_skipped?: boolean | null
          product_type: string
          question_id: string
          test_session_id?: string | null
          time_spent_seconds?: number | null
          user_answer?: string | null
          user_id: string
        }
        Update: {
          attempt_number?: number | null
          created_at?: string | null
          id?: string
          is_correct?: boolean
          is_flagged?: boolean | null
          is_skipped?: boolean | null
          product_type?: string
          question_id?: string
          test_session_id?: string | null
          time_spent_seconds?: number | null
          user_answer?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_question_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_question_responses_test_session_id_fkey"
            columns: ["test_session_id"]
            isOneToOne: false
            referencedRelation: "user_test_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sub_skill_performance: {
        Row: {
          accuracy_percentage: number | null
          id: string
          last_updated: string | null
          product_type: string
          questions_attempted: number | null
          questions_correct: number | null
          sub_skill_id: string
          user_id: string
        }
        Insert: {
          accuracy_percentage?: number | null
          id?: string
          last_updated?: string | null
          product_type: string
          questions_attempted?: number | null
          questions_correct?: number | null
          sub_skill_id: string
          user_id: string
        }
        Update: {
          accuracy_percentage?: number | null
          id?: string
          last_updated?: string | null
          product_type?: string
          questions_attempted?: number | null
          questions_correct?: number | null
          sub_skill_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sub_skill_performance_sub_skill_id_fkey"
            columns: ["sub_skill_id"]
            isOneToOne: false
            referencedRelation: "sub_skills"
            referencedColumns: ["id"]
          },
        ]
      }
      user_test_sessions: {
        Row: {
          answers_data: Json | null
          completed_at: string | null
          correct_answers: number | null
          created_at: string | null
          current_question_index: number | null
          final_score: number | null
          flagged_questions: Json | null
          id: string
          paused_at: string | null
          product_type: string
          question_order: string[] | null
          questions_answered: number | null
          section_name: string | null
          section_scores: Json | null
          session_data: Json | null
          started_at: string | null
          status: string | null
          sub_skill_performance: Json | null
          test_mode: string
          test_number: number | null
          test_template_id: string | null
          time_spent_seconds: number | null
          total_questions: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          answers_data?: Json | null
          completed_at?: string | null
          correct_answers?: number | null
          created_at?: string | null
          current_question_index?: number | null
          final_score?: number | null
          flagged_questions?: Json | null
          id?: string
          paused_at?: string | null
          product_type: string
          question_order?: string[] | null
          questions_answered?: number | null
          section_name?: string | null
          section_scores?: Json | null
          session_data?: Json | null
          started_at?: string | null
          status?: string | null
          sub_skill_performance?: Json | null
          test_mode: string
          test_number?: number | null
          test_template_id?: string | null
          time_spent_seconds?: number | null
          total_questions?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          answers_data?: Json | null
          completed_at?: string | null
          correct_answers?: number | null
          created_at?: string | null
          current_question_index?: number | null
          final_score?: number | null
          flagged_questions?: Json | null
          id?: string
          paused_at?: string | null
          product_type?: string
          question_order?: string[] | null
          questions_answered?: number | null
          section_name?: string | null
          section_scores?: Json | null
          session_data?: Json | null
          started_at?: string | null
          status?: string | null
          sub_skill_performance?: Json | null
          test_mode?: string
          test_number?: number | null
          test_template_id?: string | null
          time_spent_seconds?: number | null
          total_questions?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_test_sessions_test_template_id_fkey"
            columns: ["test_template_id"]
            isOneToOne: false
            referencedRelation: "test_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          id: string
          user_id: string
          display_name: string | null
          student_first_name: string
          student_last_name: string
          parent_first_name: string
          parent_last_name: string
          school_name: string
          year_level: number
          timezone: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          display_name?: string | null
          student_first_name: string
          student_last_name: string
          parent_first_name: string
          parent_last_name: string
          school_name: string
          year_level: number
          timezone?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          display_name?: string | null
          student_first_name?: string
          student_last_name?: string
          parent_first_name?: string
          parent_last_name?: string
          school_name?: string
          year_level?: number
          timezone?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_test_session: {
        Args:
          | { p_session_id: string }
          | {
              p_session_id: string
              p_user_id: string
              p_product_type: string
              p_test_mode: string
              p_section_scores?: Json
            }
          | {
              p_session_id: string
              p_user_id: string
              p_product_type: string
              p_test_mode: string
              p_section_scores?: Json
            }
        Returns: Json
      }
      create_or_resume_test_session: {
        Args: {
          p_user_id: string
          p_product_type: string
          p_test_mode: string
          p_section_name: string
          p_total_questions?: number
          p_question_order?: string[]
        }
        Returns: string
      }
      generate_user_recommendations: {
        Args: { p_user_id: string; p_product_type: string }
        Returns: undefined
      }
      get_diagnostic_progress: {
        Args: { p_user_id: string; p_product_type: string }
        Returns: {
          section_name: string
          status: string
          questions_completed: number
          total_questions: number
          session_id: string
          last_updated: string
        }[]
      }
      get_section_performance: {
        Args: { p_user_id: string; p_product_type: string }
        Returns: {
          section_name: string
          questions_attempted: number
          questions_correct: number
          accuracy_percentage: number
        }[]
      }
      get_session_for_resume: {
        Args: { p_session_id: string }
        Returns: {
          session_id: string
          user_id: string
          product_type: string
          test_mode: string
          section_name: string
          total_questions: number
          current_question_index: number
          status: string
          session_data: Json
          question_order: string[]
          started_at: string
          question_responses: Json
        }[]
      }
      get_session_question_order: {
        Args: { p_session_id: string }
        Returns: string[]
      }
      get_sub_skill_performance: {
        Args: { p_user_id: string; p_product_type: string }
        Returns: {
          skill_name: string
          section_name: string
          questions_attempted: number
          questions_correct: number
          accuracy_percentage: number
          visual_required: boolean
        }[]
      }
      get_user_dashboard_data: {
        Args: { p_user_id: string; p_product_type: string }
        Returns: {
          diagnostic_completed: boolean
          diagnostic_sections_completed: number
          diagnostic_total_sections: number
          diagnostic_score: number
          practice_tests_completed: number
          practice_total_tests: number
          practice_avg_score: number
          practice_best_score: number
          drill_sessions_completed: number
          drill_questions_completed: number
          drill_avg_accuracy: number
          drill_sub_skills_practiced: number
          total_study_time_minutes: number
          last_activity_date: string
          current_streak: number
          has_active_session: boolean
          active_session_type: string
          active_session_progress: number
        }[]
      }
      get_user_dashboard_stats: {
        Args: { p_user_id: string; p_product_type: string }
        Returns: Json
      }
      get_user_performance_insights: {
        Args: { p_user_id: string; p_product_type: string }
        Returns: {
          overall_score: number
          overall_mastery: number
          total_questions_attempted: number
          total_questions_correct: number
          section_name: string
          section_score: number
          section_mastery: number
          section_questions_attempted: number
          section_questions_correct: number
          sub_skill: string
          sub_skill_mastery: number
          sub_skill_accuracy: number
          sub_skill_questions_attempted: number
          sub_skill_questions_correct: number
          sub_skill_trend: string
          avg_time_per_question: number
          total_study_time: number
          strength_areas: string[]
          weakness_areas: string[]
        }[]
      }
      initialize_user_progress: {
        Args: { p_user_id: string; p_product_type: string }
        Returns: undefined
      }
      normalize_section_name: {
        Args: { section_name: string }
        Returns: string
      }
      rebuild_session_answers: {
        Args: { p_session_id: string }
        Returns: Json
      }
      record_question_response: {
        Args:
          | {
              p_user_id: string
              p_question_id: string
              p_session_id: string
              p_product_type: string
              p_answer: string
              p_is_correct: boolean
              p_time_spent: number
            }
          | {
              p_user_id: string
              p_question_id: string
              p_test_session_id: string
              p_product_type: string
              p_user_answer: string
              p_is_correct: boolean
              p_time_spent_seconds?: number
              p_is_flagged?: boolean
              p_is_skipped?: boolean
            }
          | {
              p_user_id: string
              p_question_id: string
              p_test_session_id: string
              p_product_type: string
              p_user_answer: string
              p_is_correct: boolean
              p_time_spent_seconds?: number
              p_is_flagged?: boolean
              p_is_skipped?: boolean
            }
        Returns: undefined
      }
      start_test_session: {
        Args: {
          p_user_id: string
          p_product_type: string
          p_test_mode: string
          p_section_name?: string
          p_test_number?: number
        }
        Returns: string
      }
      test_column_exists: {
        Args: { table_name: string; column_name: string }
        Returns: boolean
      }
      update_session_progress: {
        Args:
          | {
              p_session_id: string
              p_current_question_index: number
              p_answers?: Json
              p_flagged_questions?: number[]
              p_time_remaining_seconds?: number
              p_question_order?: string[]
            }
          | {
              p_session_id: string
              p_current_question_index: number
              p_answers?: Json
              p_flagged_questions?: number[]
              p_time_remaining_seconds?: number
              p_question_order?: string[]
            }
          | {
              p_session_id: string
              p_question_index: number
              p_answer_data: Json
              p_correct_answers: number
              p_time_spent: number
            }
        Returns: undefined
      }
      update_user_streak: {
        Args: { p_user_id: string; p_product_type: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
