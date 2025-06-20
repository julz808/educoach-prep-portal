-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.drill_sessions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  sub_skill_id uuid,
  product_type character varying NOT NULL,
  difficulty integer CHECK (difficulty = ANY (ARRAY[1, 2, 3])),
  status character varying DEFAULT 'active'::character varying CHECK (status::text = ANY (ARRAY['active'::character varying, 'completed'::character varying, 'abandoned'::character varying]::text[])),
  questions_total integer NOT NULL,
  questions_answered integer DEFAULT 0,
  questions_correct integer DEFAULT 0,
  question_ids ARRAY DEFAULT '{}'::uuid[],
  answers_data jsonb DEFAULT '{}'::jsonb,
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  time_spent_seconds integer DEFAULT 0 CHECK (time_spent_seconds >= 0),
  CONSTRAINT drill_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT drill_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT drill_sessions_sub_skill_id_fkey FOREIGN KEY (sub_skill_id) REFERENCES public.sub_skills(id)
);
CREATE TABLE public.passages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  test_type character varying NOT NULL,
  year_level integer NOT NULL,
  section_name character varying NOT NULL,
  title character varying NOT NULL,
  content text NOT NULL,
  passage_type character varying NOT NULL,
  word_count integer,
  australian_context boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  difficulty integer NOT NULL DEFAULT 2 CHECK (difficulty >= 1 AND difficulty <= 3),
  CONSTRAINT passages_pkey PRIMARY KEY (id)
);
CREATE TABLE public.question_attempt_history (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  question_id uuid,
  session_id uuid,
  session_type character varying CHECK (session_type::text = ANY (ARRAY['diagnostic'::character varying, 'practice'::character varying, 'drill'::character varying]::text[])),
  user_answer character varying,
  is_correct boolean,
  is_flagged boolean DEFAULT false,
  is_skipped boolean DEFAULT false,
  time_spent_seconds integer CHECK (time_spent_seconds >= 0),
  attempted_at timestamp with time zone DEFAULT now(),
  CONSTRAINT question_attempt_history_pkey PRIMARY KEY (id),
  CONSTRAINT question_attempt_history_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id),
  CONSTRAINT question_attempt_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.questions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  test_type character varying NOT NULL,
  year_level integer NOT NULL,
  section_name character varying NOT NULL,
  difficulty integer NOT NULL CHECK (difficulty >= 1 AND difficulty <= 3),
  passage_id uuid,
  question_sequence integer,
  question_text text NOT NULL,
  has_visual boolean DEFAULT false,
  visual_type character varying,
  visual_data jsonb,
  response_type character varying NOT NULL CHECK (response_type::text = ANY (ARRAY['multiple_choice'::character varying, 'extended_response'::character varying, 'short_answer'::character varying]::text[])),
  answer_options jsonb,
  correct_answer character varying,
  solution text NOT NULL,
  curriculum_aligned boolean DEFAULT true,
  generated_by character varying DEFAULT 'claude'::character varying,
  reviewed boolean DEFAULT false,
  performance_data jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  visual_url text,
  test_mode character varying NOT NULL DEFAULT 'practice_1'::character varying CHECK (test_mode::text = ANY (ARRAY['diagnostic'::character varying, 'drill'::character varying, 'practice_1'::character varying, 'practice_2'::character varying, 'practice_3'::character varying, 'practice_4'::character varying, 'practice_5'::character varying]::text[])),
  visual_svg text,
  sub_skill_id uuid,
  product_type character varying,
  question_order integer,
  explanation text,
  time_estimate_seconds integer DEFAULT 60,
  CONSTRAINT questions_pkey PRIMARY KEY (id),
  CONSTRAINT questions_passage_id_fkey FOREIGN KEY (passage_id) REFERENCES public.passages(id),
  CONSTRAINT questions_sub_skill_id_fkey FOREIGN KEY (sub_skill_id) REFERENCES public.sub_skills(id)
);
CREATE TABLE public.schema_migrations (
  id integer NOT NULL DEFAULT nextval('schema_migrations_id_seq'::regclass),
  migration_name character varying NOT NULL UNIQUE,
  applied_at timestamp with time zone DEFAULT now(),
  CONSTRAINT schema_migrations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.sub_skills (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name character varying NOT NULL,
  section_id uuid,
  product_type character varying NOT NULL,
  skill_category character varying,
  visual_required boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT sub_skills_pkey PRIMARY KEY (id),
  CONSTRAINT sub_skills_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.test_sections(id)
);
CREATE TABLE public.test_section_states (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  test_session_id uuid,
  section_name character varying NOT NULL,
  status character varying DEFAULT 'not_started'::character varying CHECK (status::text = ANY (ARRAY['not_started'::character varying, 'in_progress'::character varying, 'completed'::character varying]::text[])),
  current_question_index integer DEFAULT 0,
  time_remaining_seconds integer CHECK (time_remaining_seconds >= 0),
  flagged_questions ARRAY DEFAULT '{}'::integer[],
  answers jsonb DEFAULT '{}'::jsonb,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  last_updated timestamp with time zone DEFAULT now(),
  CONSTRAINT test_section_states_pkey PRIMARY KEY (id),
  CONSTRAINT test_section_states_test_session_id_fkey FOREIGN KEY (test_session_id) REFERENCES public.user_test_sessions(id)
);
CREATE TABLE public.test_sections (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  product_type character varying NOT NULL CHECK (product_type::text = ANY (ARRAY['VIC Selective Entry (Year 9 Entry)'::character varying::text, 'NSW Selective Entry (Year 7 Entry)'::character varying::text, 'Year 5 NAPLAN'::character varying::text, 'Year 7 NAPLAN'::character varying::text, 'EduTest Scholarship (Year 7 Entry)'::character varying::text, 'ACER Scholarship (Year 7 Entry)'::character varying::text])),
  section_name character varying NOT NULL,
  section_order integer NOT NULL,
  time_limit_minutes integer,
  question_count integer,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT test_sections_pkey PRIMARY KEY (id)
);
CREATE TABLE public.test_structure_compliance (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  test_type character varying NOT NULL,
  section_name character varying NOT NULL,
  target_questions integer,
  generated_questions integer DEFAULT 0,
  time_allocation integer,
  answer_format character varying,
  compliance_percentage numeric,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT test_structure_compliance_pkey PRIMARY KEY (id)
);
CREATE TABLE public.test_templates (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  product_type character varying NOT NULL,
  test_mode character varying NOT NULL CHECK (test_mode::text = ANY (ARRAY['diagnostic'::character varying, 'practice'::character varying, 'drill'::character varying]::text[])),
  test_number integer,
  test_name character varying,
  sections jsonb,
  total_questions integer,
  time_limit_minutes integer,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT test_templates_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_products (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  product_type character varying NOT NULL,
  purchased_at timestamp with time zone DEFAULT now(),
  is_active boolean DEFAULT true,
  stripe_subscription_id character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_products_pkey PRIMARY KEY (id),
  CONSTRAINT user_products_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_profiles (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid UNIQUE,
  display_name character varying,
  timezone character varying DEFAULT 'Australia/Melbourne'::character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  student_first_name character varying NOT NULL DEFAULT ''::character varying,
  student_last_name character varying NOT NULL DEFAULT ''::character varying,
  parent_first_name character varying NOT NULL DEFAULT ''::character varying,
  parent_last_name character varying NOT NULL DEFAULT ''::character varying,
  school_name character varying NOT NULL DEFAULT ''::character varying,
  year_level integer CHECK (year_level >= 5 AND year_level <= 10),
  CONSTRAINT user_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_progress (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  product_type character varying NOT NULL,
  diagnostic_completed boolean DEFAULT false,
  diagnostic_score numeric,
  practice_tests_completed ARRAY DEFAULT '{}'::integer[],
  total_questions_completed integer DEFAULT 0,
  total_study_time_seconds integer DEFAULT 0,
  streak_days integer DEFAULT 0,
  last_activity_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  total_questions_attempted integer DEFAULT 0,
  total_questions_correct integer DEFAULT 0,
  overall_accuracy numeric DEFAULT 0 CHECK (overall_accuracy >= 0::numeric AND overall_accuracy <= 100::numeric),
  CONSTRAINT user_progress_pkey PRIMARY KEY (id),
  CONSTRAINT user_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_sub_skill_performance (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  sub_skill_id uuid NOT NULL,
  product_type character varying NOT NULL,
  questions_attempted integer DEFAULT 0,
  questions_correct integer DEFAULT 0,
  accuracy_percentage numeric,
  last_updated timestamp with time zone DEFAULT now(),
  CONSTRAINT user_sub_skill_performance_pkey PRIMARY KEY (id),
  CONSTRAINT user_sub_skill_performance_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT user_sub_skill_performance_sub_skill_id_fkey FOREIGN KEY (sub_skill_id) REFERENCES public.sub_skills(id)
);
CREATE TABLE public.user_test_sessions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  product_type character varying NOT NULL,
  test_mode character varying NOT NULL CHECK (test_mode::text = ANY (ARRAY['diagnostic'::character varying, 'practice'::character varying, 'drill'::character varying]::text[])),
  section_name character varying,
  test_number integer,
  status character varying DEFAULT 'active'::character varying CHECK (status::text = ANY (ARRAY['active'::character varying, 'paused'::character varying, 'completed'::character varying, 'abandoned'::character varying]::text[])),
  current_question_index integer DEFAULT 0,
  total_questions integer,
  questions_answered integer DEFAULT 0,
  correct_answers integer DEFAULT 0,
  flagged_questions jsonb DEFAULT '[]'::jsonb,
  answers_data jsonb DEFAULT '{}'::jsonb,
  started_at timestamp with time zone DEFAULT now(),
  paused_at timestamp with time zone,
  completed_at timestamp with time zone,
  time_spent_seconds integer DEFAULT 0,
  final_score numeric CHECK (final_score >= 0::numeric AND final_score <= 100::numeric),
  section_scores jsonb,
  sub_skill_performance jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  test_template_id uuid,
  session_data jsonb DEFAULT '{}'::jsonb,
  question_order ARRAY DEFAULT '{}'::uuid[],
  time_remaining_seconds integer,
  section_start_time timestamp with time zone,
  is_section_complete boolean DEFAULT false,
  current_section character varying,
  section_states jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT user_test_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT user_test_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT user_test_sessions_test_template_id_fkey FOREIGN KEY (test_template_id) REFERENCES public.test_templates(id)
); 