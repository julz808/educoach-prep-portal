import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';

export interface QuestionWithSVG {
  id: string;
  question_text: string;
  visual_svg: string | null;
  test_type: string;
  section_name: string;
  sub_skill: string;
  difficulty: number;
  year_level: string;
  answer_options: string[];
  correct_answer: string;
  response_type: string;
}

export const useQuestionWithSVG = (questionId?: string) => {
  const [question, setQuestion] = useState<QuestionWithSVG | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!questionId) return;

    const fetchQuestion = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('questions')
          .select(`
            id,
            question_text,
            visual_svg,
            test_type,
            section_name,
            sub_skill,
            difficulty,
            year_level,
            answer_options,
            correct_answer,
            response_type
          `)
          .eq('id', questionId)
          .single();

        if (fetchError) {
          throw fetchError;
        }

        setQuestion(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch question');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestion();
  }, [questionId]);

  return { question, loading, error };
};

export const useQuestionsWithSVG = (filters?: {
  testType?: string;
  sectionName?: string;
  subSkill?: string;
  hasVisual?: boolean;
  limit?: number;
}) => {
  const [questions, setQuestions] = useState<QuestionWithSVG[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      setError(null);

      try {
        let query = supabase
          .from('questions')
          .select(`
            id,
            question_text,
            visual_svg,
            test_type,
            section_name,
            sub_skill,
            difficulty,
            year_level,
            answer_options,
            correct_answer,
            response_type
          `);

        // Apply filters
        if (filters?.testType) {
          query = query.eq('test_type', filters.testType);
        }
        if (filters?.sectionName) {
          query = query.eq('section_name', filters.sectionName);
        }
        if (filters?.subSkill) {
          query = query.eq('sub_skill', filters.subSkill);
        }
        if (filters?.hasVisual) {
          query = query.not('visual_svg', 'is', null);
        }
        if (filters?.limit) {
          query = query.limit(filters.limit);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) {
          throw fetchError;
        }

        setQuestions(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch questions');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [filters?.testType, filters?.sectionName, filters?.subSkill, filters?.hasVisual, filters?.limit]);

  return { questions, loading, error };
}; 