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
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      user_products: {
        Row: {
          id: string
          user_id: string
          product_type: string
          purchased_at: string
          is_active: boolean
          stripe_subscription_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_type: string
          purchased_at?: string
          is_active?: boolean
          stripe_subscription_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_type?: string
          purchased_at?: string
          is_active?: boolean
          stripe_subscription_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_products_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      passages: {
        Row: {
          id: string
          test_type: string
          year_level: number
          section_name: string
          title: string
          content: string
          passage_type: string
          word_count: number | null
          australian_context: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          test_type: string
          year_level: number
          section_name: string
          title: string
          content: string
          passage_type: string
          word_count?: number | null
          australian_context?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          test_type?: string
          year_level?: number
          section_name?: string
          title?: string
          content?: string
          passage_type?: string
          word_count?: number | null
          australian_context?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          id: string
          test_type: string
          year_level: number
          section_name: string
          sub_skill: string
          difficulty: number
          passage_id: string | null
          question_sequence: number | null
          question_text: string
          has_visual: boolean
          visual_type: string | null
          visual_data: Json | null
          response_type: string
          answer_options: Json | null
          correct_answer: string | null
          solution: string
          curriculum_aligned: boolean
          generated_by: string
          reviewed: boolean
          performance_data: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          test_type: string
          year_level: number
          section_name: string
          sub_skill: string
          difficulty: number
          passage_id?: string | null
          question_sequence?: number | null
          question_text: string
          has_visual?: boolean
          visual_type?: string | null
          visual_data?: Json | null
          response_type: string
          answer_options?: Json | null
          correct_answer?: string | null
          solution: string
          curriculum_aligned?: boolean
          generated_by?: string
          reviewed?: boolean
          performance_data?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          test_type?: string
          year_level?: number
          section_name?: string
          sub_skill?: string
          difficulty?: number
          passage_id?: string | null
          question_sequence?: number | null
          question_text?: string
          has_visual?: boolean
          visual_type?: string | null
          visual_data?: Json | null
          response_type?: string
          answer_options?: Json | null
          correct_answer?: string | null
          solution?: string
          curriculum_aligned?: boolean
          generated_by?: string
          reviewed?: boolean
          performance_data?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_passage_id_fkey"
            columns: ["passage_id"]
            isOneToOne: false
            referencedRelation: "passages"
            referencedColumns: ["id"]
          }
        ]
      }
      test_attempts: {
        Row: {
          id: string
          user_id: string
          product_type: string
          test_mode: string
          section_name: string | null
          test_number: number | null
          started_at: string
          completed_at: string | null
          total_questions: number | null
          correct_answers: number | null
          time_spent_minutes: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_type: string
          test_mode: string
          section_name?: string | null
          test_number?: number | null
          started_at?: string
          completed_at?: string | null
          total_questions?: number | null
          correct_answers?: number | null
          time_spent_minutes?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_type?: string
          test_mode?: string
          section_name?: string | null
          test_number?: number | null
          started_at?: string
          completed_at?: string | null
          total_questions?: number | null
          correct_answers?: number | null
          time_spent_minutes?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      question_responses: {
        Row: {
          id: string
          attempt_id: string
          question_id: string
          user_answer: string | null
          is_correct: boolean | null
          time_spent_seconds: number | null
          created_at: string
        }
        Insert: {
          id?: string
          attempt_id: string
          question_id: string
          user_answer?: string | null
          is_correct?: boolean | null
          time_spent_seconds?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          attempt_id?: string
          question_id?: string
          user_answer?: string | null
          is_correct?: boolean | null
          time_spent_seconds?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_responses_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "test_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          }
        ]
      }
      user_sub_skill_progress: {
        Row: {
          id: string
          user_id: string
          product_type: string
          sub_skill: string
          questions_attempted: number
          questions_correct: number
          last_practiced: string | null
          mastery_level: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_type: string
          sub_skill: string
          questions_attempted?: number
          questions_correct?: number
          last_practiced?: string | null
          mastery_level?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_type?: string
          sub_skill?: string
          questions_attempted?: number
          questions_correct?: number
          last_practiced?: string | null
          mastery_level?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sub_skill_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      test_structure_compliance: {
        Row: {
          id: string
          test_type: string
          section_name: string
          target_questions: number | null
          generated_questions: number
          time_allocation: number | null
          answer_format: string | null
          compliance_percentage: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          test_type: string
          section_name: string
          target_questions?: number | null
          generated_questions?: number
          time_allocation?: number | null
          answer_format?: string | null
          compliance_percentage?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          test_type?: string
          section_name?: string
          target_questions?: number | null
          generated_questions?: number
          time_allocation?: number | null
          answer_format?: string | null
          compliance_percentage?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
