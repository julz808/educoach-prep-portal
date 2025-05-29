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
          generated_by: string | null
          has_visual: boolean | null
          id: string
          passage_id: string | null
          performance_data: Json | null
          question_sequence: number | null
          question_text: string
          response_type: string
          reviewed: boolean | null
          section_name: string
          solution: string
          sub_skill: string
          test_mode: string
          test_type: string
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
          generated_by?: string | null
          has_visual?: boolean | null
          id?: string
          passage_id?: string | null
          performance_data?: Json | null
          question_sequence?: number | null
          question_text: string
          response_type: string
          reviewed?: boolean | null
          section_name: string
          solution: string
          sub_skill: string
          test_mode?: string
          test_type: string
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
          generated_by?: string | null
          has_visual?: boolean | null
          id?: string
          passage_id?: string | null
          performance_data?: Json | null
          question_sequence?: number | null
          question_text?: string
          response_type?: string
          reviewed?: boolean | null
          section_name?: string
          solution?: string
          sub_skill?: string
          test_mode?: string
          test_type?: string
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
        ]
      }
      test_attempts: {
        Row: {
          completed_at: string | null
          correct_answers: number | null
          created_at: string | null
          id: string
          product_type: string
          section_name: string | null
          started_at: string | null
          test_mode: string
          test_number: number | null
          time_spent_minutes: number | null
          total_questions: number | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          correct_answers?: number | null
          created_at?: string | null
          id?: string
          product_type: string
          section_name?: string | null
          started_at?: string | null
          test_mode: string
          test_number?: number | null
          time_spent_minutes?: number | null
          total_questions?: number | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          correct_answers?: number | null
          created_at?: string | null
          id?: string
          product_type?: string
          section_name?: string | null
          started_at?: string | null
          test_mode?: string
          test_number?: number | null
          time_spent_minutes?: number | null
          total_questions?: number | null
          user_id?: string | null
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
      user_sub_skill_progress: {
        Row: {
          created_at: string | null
          id: string
          last_practiced: string | null
          mastery_level: number | null
          product_type: string
          questions_attempted: number | null
          questions_correct: number | null
          sub_skill: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_practiced?: string | null
          mastery_level?: number | null
          product_type: string
          questions_attempted?: number | null
          questions_correct?: number | null
          sub_skill: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_practiced?: string | null
          mastery_level?: number | null
          product_type?: string
          questions_attempted?: number | null
          questions_correct?: number | null
          sub_skill?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      test_column_exists: {
        Args: { table_name: string; column_name: string }
        Returns: boolean
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
