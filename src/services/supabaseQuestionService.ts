import { supabase } from '@/integrations/supabase/client';
import { type Database } from '@/integrations/supabase/types';
import { UNIFIED_SUB_SKILLS } from '@/data/curriculumData';

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
  subSkillId?: string; // Add the UUID field
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
  drillModes?: TestMode[];
  diagnosticModes?: TestMode[];
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
    subSkillId: question.sub_skill_id, // Add the UUID field
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
    // Get all test types from our mapping
    const allTestTypes = Object.keys(TEST_TYPE_MAPPING);
    
    // Fetch questions for all test types and modes separately to bypass RLS policy restrictions
    const questionQueries = [];
    
    // For each test type, fetch each mode separately
    for (const testType of allTestTypes) {
      for (const testMode of ['practice_1', 'practice_2', 'practice_3', 'drill', 'diagnostic']) {
        questionQueries.push(
          supabase
            .from('questions')
            .select('*')
            .eq('test_type', testType)
            .eq('test_mode', testMode)
        );
      }
    }
    
    // Execute all question queries and passages query in parallel
    const [questionResults, passagesResult] = await Promise.all([
      Promise.all(questionQueries),
      supabase.from('passages').select('*')
    ]);
    
    // Combine all question results
    const questions: Question[] = [];
    questionResults.forEach(result => {
      if (result.data && result.data.length > 0) {
        questions.push(...result.data);
      }
    });
    
    const passages = passagesResult.data || [];
    
    // Optional: Log question counts by test type (helpful when adding new products)
    if (questions.length > 0) {
      const countsByTestType: Record<string, Record<string, number>> = {};
      questions.forEach(q => {
        const testType = q.test_type;
        const testMode = q.test_mode || 'unknown';
        if (!countsByTestType[testType]) {
          countsByTestType[testType] = {};
        }
        countsByTestType[testType][testMode] = (countsByTestType[testType][testMode] || 0) + 1;
      });
      
      console.log('📊 Questions found by test type:');
      Object.entries(countsByTestType).forEach(([testType, modes]) => {
        const total = Object.values(modes).reduce((sum, count) => sum + count, 0);
        console.log(`  ${testType}: ${total} total`);
        Object.entries(modes).forEach(([mode, count]) => {
          if (count > 0) console.log(`    - ${mode}: ${count}`);
        });
      });
    }
    
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
      // Separate test modes by type
      const practiceTestModes: TestMode[] = [];
      const drillModes: TestMode[] = [];
      const diagnosticModes: TestMode[] = [];

      Object.entries(testModes).forEach(([testModeName, sections]) => {
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

        const testMode: TestMode = {
          id: testModeName,
          name: modeInfo.name,
          type: modeInfo.type,
          sections: sectionEntries,
          totalQuestions,
          estimatedTime: Math.ceil(totalQuestions * 1.5), // 1.5 minutes per question
          difficulty: 'Medium', // Default difficulty
          description: getTestModeDescription(modeInfo.type, sectionEntries.length),
        };

        // Categorize by test mode type
        if (modeInfo.type === 'practice') {
          practiceTestModes.push(testMode);
        } else if (modeInfo.type === 'drill') {
          drillModes.push(testMode);
        } else if (modeInfo.type === 'diagnostic') {
          diagnosticModes.push(testMode);
        }
      });

      const frontendId = TEST_TYPE_MAPPING[testTypeName] || testTypeName.toLowerCase().replace(/\s+/g, '-');

      return {
        id: frontendId,
        name: testTypeName,
        testModes: practiceTestModes, // Only include practice test modes in the main structure
        drillModes: drillModes, // Add separate property for drill modes
        diagnosticModes: diagnosticModes, // Add separate property for diagnostic modes
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

  const name = testTypeNames[testTypeId] || 'Unknown Test Type';

  return {
    id: testTypeId,
    name,
    testModes: [
      {
        id: 'practice_1',
        name: 'Practice Test 1',
        type: 'practice',
        sections: [],
        totalQuestions: 0,
        estimatedTime: 0,
        difficulty: 'Medium',
        description: 'Coming soon',
      }
    ],
    drillModes: [],
    diagnosticModes: [],
  };
}

export async function fetchDrillModes(testTypeId: string): Promise<TestMode[]> {
  try {
    console.log('🔧 DEBUG: Fetching drill questions for test type:', testTypeId);
    
    // Map frontend testTypeId to database test_type
    const dbTestType = Object.keys(TEST_TYPE_MAPPING).find(
      key => TEST_TYPE_MAPPING[key] === testTypeId
    );
    
    if (!dbTestType) {
      console.warn('🔧 DEBUG: No database test type found for:', testTypeId);
      return [];
    }
    
    console.log('🔧 DEBUG: Mapped to database test type:', dbTestType);
    
    // Fetch all drill questions for this test type
    const { data: drillQuestions, error } = await supabase
      .from('questions')
      .select('*')
      .eq('test_type', dbTestType)
      .eq('test_mode', 'drill');
      
    if (error) {
      console.error('🔧 DEBUG: Error fetching drill questions:', error);
      return [];
    }
    
    if (!drillQuestions || drillQuestions.length === 0) {
      console.log('🔧 DEBUG: No drill questions found for test type:', dbTestType);
      return [];
    }
    
    console.log('🔧 DEBUG: Found', drillQuestions.length, 'drill questions');
    
    // Fetch passages for questions that have passage_id
    const passageIds = drillQuestions
      .filter(q => q.passage_id)
      .map(q => q.passage_id);
      
    let passages: Passage[] = [];
    if (passageIds.length > 0) {
      const { data: passageData } = await supabase
        .from('passages')
        .select('*')
        .in('id', passageIds);
      passages = passageData || [];
    }
    
    const passageMap = new Map(passages.map(p => [p.id, p]));
    
    // Group questions by section_name (skill areas) and then by actual sub_skill from database
    const skillAreaMap = new Map<string, Map<string, Question[]>>();
    
    console.log('🔧 DEBUG: Using actual sub_skill values from Supabase questions table');
    
    // First, let's see what sub_skill values actually exist in the database
    const actualSubSkills = new Map<string, Set<string>>();
    drillQuestions.forEach(question => {
      const sectionName = question.section_name;
      const subSkill = question.sub_skill;
      
      if (!actualSubSkills.has(sectionName)) {
        actualSubSkills.set(sectionName, new Set());
      }
      
      if (subSkill) {
        actualSubSkills.get(sectionName)!.add(subSkill);
      }
    });
    
    console.log('🔧 DEBUG: Actual sub_skill values in database:');
    actualSubSkills.forEach((subSkills, sectionName) => {
      console.log(`🔧 DEBUG: ${sectionName}:`, Array.from(subSkills));
    });
    
    // Group questions by their actual sub_skill values from the database
    drillQuestions.forEach(question => {
      const sectionName = question.section_name;
      const subSkill = question.sub_skill || 'General';
      
      if (!skillAreaMap.has(sectionName)) {
        skillAreaMap.set(sectionName, new Map());
      }
      
      const subSkillMap = skillAreaMap.get(sectionName)!;
      if (!subSkillMap.has(subSkill)) {
        subSkillMap.set(subSkill, []);
      }
      
      subSkillMap.get(subSkill)!.push(question);
    });
    
    console.log('🔧 DEBUG: Questions grouped by actual database sub_skill values:');
    skillAreaMap.forEach((subSkillMap, sectionName) => {
      console.log(`🔧 DEBUG: ${sectionName}:`);
      subSkillMap.forEach((questions, subSkill) => {
        const easyCount = questions.filter(q => q.difficulty === 1).length;
        const mediumCount = questions.filter(q => q.difficulty === 2).length;
        const hardCount = questions.filter(q => q.difficulty === 3).length;
        console.log(`🔧 DEBUG:   • ${subSkill}: ${questions.length} total (Easy: ${easyCount}, Medium: ${mediumCount}, Hard: ${hardCount})`);
      });
    });
    
    console.log('🔧 DEBUG: Grouped into skill areas:', Array.from(skillAreaMap.keys()));
    
    // Transform into TestMode structure
    const drillModes: TestMode[] = Array.from(skillAreaMap.entries()).map(([sectionName, subSkillMap]) => {
      const sections: TestSection[] = Array.from(subSkillMap.entries())
        .filter(([subSkillName, questions]) => questions.length > 0) // Only include sub-skills with questions
        .map(([subSkillName, questions]) => {
          const transformedQuestions = questions.map(q => {
            const passage = q.passage_id ? passageMap.get(q.passage_id) : undefined;
            return transformQuestion(q, passage);
          });
          
          return {
            id: `${sectionName}-${subSkillName}`.toLowerCase().replace(/\s+/g, '-'),
            name: subSkillName,
            questions: transformedQuestions,
            totalQuestions: transformedQuestions.length,
            timeLimit: Math.ceil(transformedQuestions.length * 1.5),
            status: 'not-started' as const,
          };
        });
      
      const totalQuestions = sections.reduce((sum, section) => sum + section.totalQuestions, 0);
      
      console.log('🔧 DEBUG: Skill area:', sectionName, 'has', sections.length, 'sub-skills with', totalQuestions, 'total questions');
      
      return {
        id: sectionName.toLowerCase().replace(/\s+/g, '-'),
        name: sectionName,
        type: 'drill' as const,
        sections,
        totalQuestions,
        estimatedTime: Math.ceil(totalQuestions * 1.5),
        description: `Practice ${sectionName} skills through targeted drill exercises`,
      };
    });
    
    console.log('🔧 DEBUG: Created', drillModes.length, 'drill modes');
    drillModes.forEach(mode => {
      console.log(`🔧 DEBUG: - ${mode.name}: ${mode.sections.length} sub-skills, ${mode.totalQuestions} questions`);
      mode.sections.forEach(section => {
        console.log(`🔧 DEBUG:   • ${section.name}: ${section.totalQuestions} questions`);
      });
    });
    
    return drillModes;
  } catch (error) {
    console.error('🔧 DEBUG: Error in fetchDrillModes:', error);
    return [];
  }
}

export async function fetchDiagnosticModes(testTypeId: string): Promise<TestMode[]> {
  try {
    console.log('🔧 DEBUG: Fetching diagnostic modes for test type:', testTypeId);
    
    // Map frontend testTypeId to database test_type
    const dbTestType = Object.keys(TEST_TYPE_MAPPING).find(
      key => TEST_TYPE_MAPPING[key] === testTypeId
    );
    
    if (!dbTestType) {
      console.warn('🔧 DEBUG: No database test type found for:', testTypeId);
      return [];
    }
    
    console.log('🔧 DEBUG: Mapped to database test type:', dbTestType);
    
    // Fetch all diagnostic questions for this test type
    const { data: diagnosticQuestions, error } = await supabase
      .from('questions')
      .select('*')
      .eq('test_type', dbTestType)
      .eq('test_mode', 'diagnostic')
      .order('question_order');
      
    if (error) {
      console.error('🔧 DEBUG: Error fetching diagnostic questions:', error);
      return [];
    }
    
    if (!diagnosticQuestions || diagnosticQuestions.length === 0) {
      console.log('🔧 DEBUG: No diagnostic questions found for test type:', dbTestType);
      return [];
    }
    
    console.log('🔧 DEBUG: Found', diagnosticQuestions.length, 'diagnostic questions');
    
    // Fetch passages for questions that have passage_id
    const passageIds = diagnosticQuestions
      .filter(q => q.passage_id)
      .map(q => q.passage_id);
      
    let passages: Passage[] = [];
    if (passageIds.length > 0) {
      const { data: passageData } = await supabase
        .from('passages')
        .select('*')
        .in('id', passageIds);
      passages = passageData || [];
    }
    
    const passageMap = new Map(passages.map(p => [p.id, p]));
    
    // Group questions by section_name
    const sectionMap = new Map<string, Question[]>();
    
    diagnosticQuestions.forEach(question => {
      const sectionName = question.section_name;
      
      if (!sectionMap.has(sectionName)) {
        sectionMap.set(sectionName, []);
      }
      
      sectionMap.get(sectionName)!.push(question);
    });
    
    console.log('🔧 DEBUG: Grouped into sections:', Array.from(sectionMap.keys()));
    
    // Transform into TestSection structure
    const diagnosticSections: TestSection[] = Array.from(sectionMap.entries()).map(([sectionName, questions]) => {
      const transformedQuestions = questions.map(q => {
        const passage = q.passage_id ? passageMap.get(q.passage_id) : undefined;
        return transformQuestion(q, passage);
      });
      
      return {
        id: sectionName.toLowerCase().replace(/\s+/g, '-'),
        name: sectionName,
        questions: transformedQuestions,
        totalQuestions: transformedQuestions.length,
        timeLimit: Math.ceil(transformedQuestions.length * 1.5),
        status: 'not-started' as const,
      };
    });
    
    const totalQuestions = diagnosticSections.reduce((sum, section) => sum + section.totalQuestions, 0);
    
    console.log('🔧 DEBUG: Created diagnostic sections:');
    diagnosticSections.forEach(section => {
      console.log(`🔧 DEBUG: - ${section.name}: ${section.totalQuestions} questions`);
    });
    
    return [{
      id: 'diagnostic',
      name: 'Diagnostic Test',
      type: 'diagnostic' as const,
      sections: diagnosticSections,
      totalQuestions,
      estimatedTime: Math.ceil(totalQuestions * 1.5),
      difficulty: 'Medium',
      description: `Comprehensive assessment covering ${diagnosticSections.length} areas with ${totalQuestions} questions to identify your strengths and areas for improvement.`
    }];
    
  } catch (error) {
    console.error('Error fetching diagnostic modes:', error);
    return [];
  }
} 