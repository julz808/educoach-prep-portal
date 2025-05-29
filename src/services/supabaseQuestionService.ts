import { supabase } from '@/integrations/supabase/client';
import { type Database } from '@/integrations/supabase/types';

type Question = Database['public']['Tables']['questions']['Row'];
type Passage = Database['public']['Tables']['passages']['Row'];

export interface OrganizedQuestion {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  type: string;
  topic: string;
  subSkill: string;
  difficulty: number;
  hasVisual: boolean;
  visualData?: any;
  visualSvg?: string;
  visualUrl?: string;
  passageContent?: string;
}

export interface TestSection {
  id: string;
  name: string;
  questions: OrganizedQuestion[];
  totalQuestions: number;
  timeLimit?: number;
  status: 'not-started' | 'in-progress' | 'completed';
  score?: number;
}

export interface TestMode {
  id: string;
  name: string;
  type: 'practice' | 'drill' | 'diagnostic';
  sections: TestSection[];
  totalQuestions: number;
  estimatedTime: number;
  difficulty?: string;
  description?: string;
}

export interface TestType {
  id: string;
  name: string;
  testModes: TestMode[];
}

export interface OrganizedTestData {
  testTypes: TestType[];
}

// Map Supabase test_type to frontend course IDs
const TEST_TYPE_MAPPING: Record<string, string> = {
  'Year 5 NAPLAN': 'year-5-naplan',
  'Year 7 NAPLAN': 'year-7-naplan',
  'ACER Scholarship (Year 7 Entry)': 'acer-scholarship',
  'EduTest Scholarship (Year 7 Entry)': 'edutest-scholarship',
  'VIC Selective Entry (Year 9 Entry)': 'vic-selective',
  'NSW Selective Entry (Year 7 Entry)': 'nsw-selective',
};

// Map test_mode to display names
const TEST_MODE_MAPPING: Record<string, { name: string; type: 'practice' | 'drill' | 'diagnostic' }> = {
  'practice_1': { name: 'Practice Test 1', type: 'practice' },
  'practice_2': { name: 'Practice Test 2', type: 'practice' },
  'practice_3': { name: 'Practice Test 3', type: 'practice' },
  'drill': { name: 'Skill Drills', type: 'drill' },
  'diagnostic': { name: 'Diagnostic Test', type: 'diagnostic' },
};

function parseAnswerOptions(answerOptions: any): string[] {
  if (!answerOptions) return [];
  
  if (Array.isArray(answerOptions)) {
    return answerOptions;
  }
  
  if (typeof answerOptions === 'object') {
    // Handle object format like { "A": "option1", "B": "option2", ... }
    const keys = Object.keys(answerOptions).sort();
    return keys.map(key => answerOptions[key]);
  }
  
  return [];
}

function findCorrectAnswerIndex(answerOptions: any, correctAnswer: string): number {
  const options = parseAnswerOptions(answerOptions);
  
  if (!correctAnswer) return 0;
  
  // If correctAnswer is a letter (A, B, C, D), convert to index
  if (correctAnswer.length === 1 && /[A-Z]/.test(correctAnswer)) {
    return correctAnswer.charCodeAt(0) - 'A'.charCodeAt(0);
  }
  
  // If correctAnswer is the actual text, find its index
  const index = options.indexOf(correctAnswer);
  return index >= 0 ? index : 0;
}

function transformQuestion(question: Question, passage?: Passage): OrganizedQuestion {
  const options = parseAnswerOptions(question.answer_options);
  const correctAnswerIndex = findCorrectAnswerIndex(question.answer_options, question.correct_answer || '');
  
  return {
    id: question.id,
    text: question.question_text,
    options,
    correctAnswer: correctAnswerIndex,
    explanation: question.solution || 'No explanation provided',
    type: question.response_type || 'mcq',
    topic: question.section_name,
    subSkill: question.sub_skill,
    difficulty: question.difficulty,
    hasVisual: question.has_visual || false,
    visualData: question.visual_data,
    visualSvg: question.visual_svg || undefined,
    visualUrl: question.visual_url || undefined,
    passageContent: passage?.content,
  };
}

export async function fetchQuestionsFromSupabase(): Promise<OrganizedTestData> {
  try {
    // Fetch all questions and passages
    const [questionsResult, passagesResult] = await Promise.all([
      supabase.from('questions').select('*'),
      supabase.from('passages').select('*')
    ]);

    if (questionsResult.error) {
      console.error('Error fetching questions:', questionsResult.error);
      return { testTypes: [] };
    }

    if (passagesResult.error) {
      console.error('Error fetching passages:', passagesResult.error);
    }

    const questions = questionsResult.data || [];
    const passages = passagesResult.data || [];
    
    // Create a map of passages by ID for quick lookup
    const passageMap = new Map(passages.map(p => [p.id, p]));

    // Group questions by test_type, test_mode, and section_name
    const groupedData: Record<string, Record<string, Record<string, Question[]>>> = {};

    questions.forEach(question => {
      const testType = question.test_type;
      const testMode = question.test_mode || 'practice_1';
      const sectionName = question.section_name;

      if (!groupedData[testType]) {
        groupedData[testType] = {};
      }
      if (!groupedData[testType][testMode]) {
        groupedData[testType][testMode] = {};
      }
      if (!groupedData[testType][testMode][sectionName]) {
        groupedData[testType][testMode][sectionName] = [];
      }

      groupedData[testType][testMode][sectionName].push(question);
    });

    // Transform grouped data into the frontend structure
    const testTypes: TestType[] = Object.entries(groupedData).map(([testTypeName, testModes]) => {
      const testModeEntries: TestMode[] = Object.entries(testModes).map(([testModeName, sections]) => {
        const sectionEntries: TestSection[] = Object.entries(sections).map(([sectionName, sectionQuestions]) => {
          const transformedQuestions = sectionQuestions.map(q => {
            const passage = q.passage_id ? passageMap.get(q.passage_id) : undefined;
            return transformQuestion(q, passage);
          });

          return {
            id: sectionName.toLowerCase().replace(/\s+/g, '-'),
            name: sectionName,
            questions: transformedQuestions,
            totalQuestions: transformedQuestions.length,
            timeLimit: Math.ceil(transformedQuestions.length * 1.5), // Rough estimate: 1.5 min per question
            status: 'not-started' as const,
          };
        });

        const modeInfo = TEST_MODE_MAPPING[testModeName] || { name: testModeName, type: 'practice' as const };
        const totalQuestions = sectionEntries.reduce((sum, section) => sum + section.totalQuestions, 0);

        return {
          id: testModeName,
          name: modeInfo.name,
          type: modeInfo.type,
          sections: sectionEntries,
          totalQuestions,
          estimatedTime: Math.ceil(totalQuestions * 1.5), // 1.5 minutes per question
          difficulty: 'Medium', // Default difficulty
          description: getTestModeDescription(modeInfo.type, sectionEntries.length),
        };
      });

      const frontendId = TEST_TYPE_MAPPING[testTypeName] || testTypeName.toLowerCase().replace(/\s+/g, '-');

      return {
        id: frontendId,
        name: testTypeName,
        testModes: testModeEntries,
      };
    });

    return { testTypes };
  } catch (error) {
    console.error('Error fetching questions from Supabase:', error);
    return { testTypes: [] };
  }
}

function getTestModeDescription(type: 'practice' | 'drill' | 'diagnostic', sectionCount: number): string {
  switch (type) {
    case 'practice':
      return `Full-length practice test with ${sectionCount} section${sectionCount > 1 ? 's' : ''}.`;
    case 'drill':
      return `Targeted skill practice with ${sectionCount} skill area${sectionCount > 1 ? 's' : ''}.`;
    case 'diagnostic':
      return `Comprehensive assessment covering ${sectionCount} area${sectionCount > 1 ? 's' : ''}.`;
    default:
      return 'Test preparation materials.';
  }
}

export async function fetchQuestionsForTest(testType: string, testMode: string, sectionName?: string): Promise<OrganizedQuestion[]> {
  try {
    let query = supabase
      .from('questions')
      .select(`
        *,
        passages (*)
      `)
      .eq('test_type', testType)
      .eq('test_mode', testMode);

    if (sectionName) {
      query = query.eq('section_name', sectionName);
    }

    const { data: questions, error } = await query;

    if (error) {
      console.error('Error fetching questions:', error);
      return [];
    }

    return questions?.map(q => {
      const passage = Array.isArray(q.passages) ? q.passages[0] : q.passages;
      return transformQuestion(q, passage);
    }) || [];
  } catch (error) {
    console.error('Error fetching questions:', error);
    return [];
  }
}

// Get placeholder test structure for test types without questions
export function getPlaceholderTestStructure(testTypeId: string): TestType {
  const testTypeNames: Record<string, string> = {
    'year-5-naplan': 'Year 5 NAPLAN',
    'year-7-naplan': 'Year 7 NAPLAN',
    'acer-scholarship': 'ACER Scholarship (Year 7 Entry)',
    'edutest-scholarship': 'EduTest Scholarship (Year 7 Entry)',
    'vic-selective': 'VIC Selective Entry (Year 9 Entry)',
    'nsw-selective': 'NSW Selective Entry (Year 7 Entry)',
  };

  const placeholderSections: Record<string, string[]> = {
    'year-5-naplan': ['Reading', 'Writing', 'Language Conventions', 'Numeracy'],
    'year-7-naplan': ['Reading', 'Writing', 'Language Conventions', 'Numeracy'],
    'acer-scholarship': ['Reading Comprehension', 'Mathematics', 'Written Expression', 'Thinking Skills'],
    'edutest-scholarship': ['Reading Comprehension', 'Mathematics', 'Verbal Reasoning', 'Numerical Reasoning', 'Written Expression'],
    'vic-selective': ['Reading Reasoning', 'Mathematical Reasoning', 'Verbal Reasoning', 'Quantitative Reasoning', 'Written Expression'],
    'nsw-selective': ['Reading', 'Mathematical Reasoning', 'Thinking Skills', 'Writing'],
  };

  const sections = placeholderSections[testTypeId] || ['Section 1'];
  
  const placeholderTestModes: TestMode[] = [
    {
      id: 'diagnostic',
      name: 'Diagnostic Test',
      type: 'diagnostic',
      sections: sections.map(sectionName => ({
        id: sectionName.toLowerCase().replace(/\s+/g, '-'),
        name: sectionName,
        questions: [],
        totalQuestions: 0,
        status: 'not-started' as const,
      })),
      totalQuestions: 0,
      estimatedTime: 0,
      description: 'Questions coming soon...',
    },
    {
      id: 'practice_1',
      name: 'Practice Test 1',
      type: 'practice',
      sections: sections.map(sectionName => ({
        id: sectionName.toLowerCase().replace(/\s+/g, '-'),
        name: sectionName,
        questions: [],
        totalQuestions: 0,
        status: 'not-started' as const,
      })),
      totalQuestions: 0,
      estimatedTime: 0,
      description: 'Questions coming soon...',
    },
    {
      id: 'drill',
      name: 'Skill Drills',
      type: 'drill',
      sections: sections.map(sectionName => ({
        id: sectionName.toLowerCase().replace(/\s+/g, '-'),
        name: sectionName,
        questions: [],
        totalQuestions: 0,
        status: 'not-started' as const,
      })),
      totalQuestions: 0,
      estimatedTime: 0,
      description: 'Questions coming soon...',
    },
  ];

  return {
    id: testTypeId,
    name: testTypeNames[testTypeId] || testTypeId,
    testModes: placeholderTestModes,
  };
} 