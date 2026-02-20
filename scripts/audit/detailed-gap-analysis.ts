import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { SUB_SKILL_EXAMPLES, getSectionConfig } from '../../src/data/curriculumData_v2';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

interface TestConfig {
  name: string;
  sections: string[];
  modesNeeded: string[];
  questionsPerMode: Record<string, number>;
}

const TEST_CONFIGS: TestConfig[] = [
  {
    name: 'ACER Scholarship (Year 7 Entry)',
    sections: ['Humanities', 'Mathematics', 'Written Expression'],
    modesNeeded: ['practice_1', 'practice_2', 'practice_3', 'practice_4', 'practice_5', 'diagnostic'],
    questionsPerMode: {
      'Humanities': 35,
      'Mathematics': 35,
      'Written Expression': 1
    }
  },
  {
    name: 'EduTest Scholarship (Year 7 Entry)',
    sections: ['Verbal Reasoning', 'Numerical Reasoning', 'Mathematics', 'Reading Comprehension', 'Written Expression'],
    modesNeeded: ['practice_1', 'practice_2', 'practice_3', 'practice_4', 'practice_5', 'diagnostic'],
    questionsPerMode: {
      'Verbal Reasoning': 60,
      'Numerical Reasoning': 50,
      'Mathematics': 60,
      'Reading Comprehension': 50,
      'Written Expression': 2
    }
  },
  {
    name: 'NSW Selective Entry (Year 7 Entry)',
    sections: ['Reading', 'Mathematical Reasoning', 'Thinking Skills', 'Writing'],
    modesNeeded: ['practice_1', 'practice_2', 'practice_3', 'practice_4', 'practice_5', 'diagnostic'],
    questionsPerMode: {
      'Reading': 30,
      'Mathematical Reasoning': 35,
      'Thinking Skills': 40,
      'Writing': 1
    }
  },
  {
    name: 'VIC Selective Entry (Year 9 Entry)',
    sections: ['Reading Reasoning', 'Mathematics Reasoning', 'General Ability - Verbal', 'General Ability - Quantitative', 'Writing'],
    modesNeeded: ['practice_1', 'practice_2', 'practice_3', 'practice_4', 'practice_5', 'diagnostic'],
    questionsPerMode: {
      'Reading Reasoning': 50,
      'Mathematics Reasoning': 60,
      'General Ability - Verbal': 60,
      'General Ability - Quantitative': 50,
      'Writing': 2
    }
  },
  {
    name: 'Year 5 NAPLAN',
    sections: ['Reading', 'Language Conventions', 'Numeracy', 'Writing'],
    modesNeeded: ['practice_1', 'practice_2', 'practice_3', 'practice_4', 'practice_5', 'diagnostic'],
    questionsPerMode: {
      'Reading': 40,
      'Language Conventions': 40,
      'Numeracy': 50,
      'Writing': 1
    }
  },
  {
    name: 'Year 7 NAPLAN',
    sections: ['Reading', 'Language Conventions', 'Numeracy No Calculator', 'Numeracy Calculator', 'Writing'],
    modesNeeded: ['practice_1', 'practice_2', 'practice_3', 'practice_4', 'practice_5', 'diagnostic'],
    questionsPerMode: {
      'Reading': 50,
      'Language Conventions': 45,
      'Numeracy No Calculator': 30,
      'Numeracy Calculator': 35,
      'Writing': 1
    }
  }
];

async function getQuestionCounts(testType: string, section: string, mode: string) {
  const { data } = await supabase
    .from('questions_v2')
    .select('sub_skill')
    .eq('test_type', testType)
    .eq('section_name', section)
    .eq('test_mode', mode);

  const counts: Record<string, number> = {};
  data?.forEach(q => {
    counts[q.sub_skill] = (counts[q.sub_skill] || 0) + 1;
  });

  return { total: data?.length || 0, bySubSkill: counts };
}

(async () => {
  console.log('\n═════════════════════════════════════════════════════════════════════════');
  console.log(' DETAILED GAP ANALYSIS - V2 GENERATION SYSTEM');
  console.log('═════════════════════════════════════════════════════════════════════════\n');

  let grandTotalNeeded = 0;
  let grandTotalExists = 0;

  for (const testConfig of TEST_CONFIGS) {
    console.log(`\n${'━'.repeat(77)}`);
    console.log(`📝 ${testConfig.name}`);
    console.log(`${'━'.repeat(77)}\n`);

    let testTotalNeeded = 0;
    let testTotalExists = 0;

    for (const section of testConfig.sections) {
      console.log(`📂 ${section}`);

      const targetPerMode = testConfig.questionsPerMode[section] || 0;

      // Get sub-skills from curriculum
      const sectionKey = `${testConfig.name} - ${section}`;
      const subSkills = SUB_SKILL_EXAMPLES[sectionKey];
      const subSkillNames = subSkills ? Object.keys(subSkills) : [];

      console.log(`   Sub-skills defined: ${subSkillNames.length}`);
      console.log(`   Target per mode: ${targetPerMode} questions\n`);

      for (const mode of testConfig.modesNeeded) {
        const { total, bySubSkill } = await getQuestionCounts(testConfig.name, section, mode);
        const needed = Math.max(0, targetPerMode - total);

        const status = needed === 0 ? '✅' : total === 0 ? '❌' : '⚠️';
        console.log(`   ${status} ${mode}: ${total}/${targetPerMode} (${needed === 0 ? 'complete' : `need ${needed}`})`);

        testTotalNeeded += needed;
        testTotalExists += total;
        grandTotalNeeded += needed;
        grandTotalExists += total;

        // Show sub-skill breakdown if incomplete
        if (needed > 0 && subSkillNames.length > 0) {
          const missingSubSkills = subSkillNames.filter(s => !bySubSkill[s] || bySubSkill[s] === 0);
          if (missingSubSkills.length > 0 && missingSubSkills.length <= 5) {
            console.log(`      Missing sub-skills: ${missingSubSkills.join(', ')}`);
          } else if (missingSubSkills.length > 5) {
            console.log(`      Missing sub-skills: ${missingSubSkills.length} sub-skills need questions`);
          }
        }
      }

      console.log();
    }

    console.log(`   Test Total: ${testTotalExists} exists, ${testTotalNeeded} needed`);
  }

  console.log(`\n${'═'.repeat(77)}`);
  console.log(` GRAND TOTAL`);
  console.log(`${'═'.repeat(77)}`);
  console.log(`   Existing Questions: ${grandTotalExists}`);
  console.log(`   Questions Needed: ${grandTotalNeeded}`);
  console.log(`   Completion: ${((grandTotalExists / (grandTotalExists + grandTotalNeeded)) * 100).toFixed(1)}%`);
  console.log(`${'═'.repeat(77)}\n`);

  // Check passages
  console.log(`${'═'.repeat(77)}`);
  console.log(` PASSAGE COUNTS`);
  console.log(`${'═'.repeat(77)}\n`);

  for (const testConfig of TEST_CONFIGS) {
    const readingSections = testConfig.sections.filter(s =>
      s.includes('Reading') || s.includes('Humanities')
    );

    for (const section of readingSections) {
      const { count } = await supabase
        .from('passages_v2')
        .select('*', { count: 'exact', head: true })
        .eq('test_type', testConfig.name)
        .eq('section_name', section);

      if (count && count > 0) {
        console.log(`   ${testConfig.name} - ${section}: ${count} passages`);
      }
    }
  }

  console.log(`\n${'═'.repeat(77)}\n`);
})();
