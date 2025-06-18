#!/usr/bin/env node

/**
 * Direct Fix for Drill Question Counts
 * 
 * This script directly fixes the drill question counts by:
 * 1. Keeping exactly 10 questions per sub_skill per difficulty for non-writing sections
 * 2. Keeping exactly 2 questions per sub_skill per difficulty for writing sections
 * 3. Deleting excess questions immediately
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🔧 Direct fix for drill question counts...');
  
  try {
    // Get all drill questions
    const { data: drillQuestions, error } = await supabase
      .from('questions')
      .select('id, section_name, sub_skill, sub_skill_id, difficulty')
      .eq('test_type', 'VIC Selective Entry (Year 9 Entry)')
      .eq('test_mode', 'drill')
      .order('sub_skill_id')
      .order('difficulty')
      .order('created_at'); // Keep earliest questions, delete latest

    if (error) {
      throw error;
    }

    console.log(`📊 Found ${drillQuestions.length} total drill questions`);

    // Group by sub_skill_id and difficulty
    const groups = new Map<string, Array<any>>();
    
    drillQuestions.forEach(q => {
      const key = `${q.sub_skill_id}|${q.difficulty}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(q);
    });

    console.log(`📈 Found ${groups.size} unique sub_skill + difficulty combinations`);

    let totalToDelete = 0;
    const idsToDelete = [];

    // Process each group
    for (const [groupKey, questions] of groups.entries()) {
      const [subSkillId, difficulty] = groupKey.split('|');
      const firstQuestion = questions[0];
      const sectionName = firstQuestion.section_name;
      const subSkillName = firstQuestion.sub_skill;
      
      // Determine expected count
      const isWritingSection = sectionName === 'Writing';
      const expectedCount = isWritingSection ? 2 : 10;
      const currentCount = questions.length;
      
      if (currentCount > expectedCount) {
        // Mark excess questions for deletion (keep first N, delete the rest)
        const excessQuestions = questions.slice(expectedCount);
        const excessIds = excessQuestions.map(q => q.id);
        idsToDelete.push(...excessIds);
        totalToDelete += excessIds.length;
        
        console.log(`❌ ${subSkillName} (Difficulty ${difficulty}): ${currentCount}/${expectedCount} → deleting ${excessIds.length} excess`);
      } else if (currentCount < expectedCount) {
        console.log(`⚠️  ${subSkillName} (Difficulty ${difficulty}): ${currentCount}/${expectedCount} → needs ${expectedCount - currentCount} more`);
      } else {
        console.log(`✅ ${subSkillName} (Difficulty ${difficulty}): ${currentCount}/${expectedCount} → correct`);
      }
    }

    console.log(`\n🗑️  Total questions to delete: ${totalToDelete}`);

    if (totalToDelete > 0) {
      console.log('Deleting excess questions...');
      
      // Delete in batches
      const batchSize = 50;
      let deletedCount = 0;
      
      for (let i = 0; i < idsToDelete.length; i += batchSize) {
        const batch = idsToDelete.slice(i, i + batchSize);
        
        const { error: deleteError, count } = await supabase
          .from('questions')
          .delete({ count: 'exact' })
          .in('id', batch);

        if (deleteError) {
          console.error(`❌ Error deleting batch:`, deleteError);
          break;
        } else {
          deletedCount += count || 0;
          console.log(`✅ Deleted batch ${Math.floor(i / batchSize) + 1}: ${count} questions (total: ${deletedCount})`);
        }
      }
      
      console.log(`✅ Successfully deleted ${deletedCount} excess questions`);
    }

    // Final verification
    console.log('\n🔍 Final verification...');
    
    const { data: finalQuestions, error: finalError } = await supabase
      .from('questions')
      .select('section_name, sub_skill, sub_skill_id, difficulty')
      .eq('test_type', 'VIC Selective Entry (Year 9 Entry)')
      .eq('test_mode', 'drill');

    if (finalError) {
      throw finalError;
    }

    const finalGroups = new Map<string, number>();
    finalQuestions.forEach(q => {
      const key = `${q.sub_skill_id}|${q.difficulty}`;
      finalGroups.set(key, (finalGroups.get(key) || 0) + 1);
    });

    console.log(`\n📊 Final counts (${finalQuestions.length} total questions):`);
    
    let allCorrect = true;
    const problemGroups = [];
    
    for (const [groupKey, count] of finalGroups.entries()) {
      const [subSkillId, difficulty] = groupKey.split('|');
      const question = finalQuestions.find(q => q.sub_skill_id === subSkillId && q.difficulty == difficulty);
      const sectionName = question?.section_name || 'Unknown';
      const subSkillName = question?.sub_skill || 'Unknown';
      
      const isWritingSection = sectionName === 'Writing';
      const expectedCount = isWritingSection ? 2 : 10;
      
      if (count !== expectedCount) {
        allCorrect = false;
        problemGroups.push({
          subSkillName,
          sectionName,
          difficulty,
          current: count,
          expected: expectedCount
        });
      }
      
      const status = count === expectedCount ? '✅' : '❌';
      console.log(`  ${status} ${subSkillName} (${sectionName}, Difficulty ${difficulty}): ${count}/${expectedCount}`);
    }

    if (allCorrect) {
      console.log('\n🎉 All drill question counts are now correct!');
      console.log('The drill developer tools should now work properly.');
    } else {
      console.log(`\n⚠️  ${problemGroups.length} groups still need fixing:`);
      problemGroups.forEach(g => {
        if (g.current < g.expected) {
          console.log(`   ${g.subSkillName} (Difficulty ${g.difficulty}): needs ${g.expected - g.current} more questions`);
        } else {
          console.log(`   ${g.subSkillName} (Difficulty ${g.difficulty}): still has ${g.current - g.expected} excess questions`);
        }
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main().catch(console.error);