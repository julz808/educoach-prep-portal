#!/usr/bin/env node

/**
 * Fix Drill Question Counts
 * 
 * This script fixes the inconsistent drill question counts in the database.
 * Based on the analysis, we need to:
 * 1. Ensure non-writing sections have exactly 10 questions per sub_skill per difficulty
 * 2. Ensure writing sections have exactly 2 questions per sub_skill per difficulty
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
  console.log('🔧 Fixing drill question counts...');
  
  try {
    // First, let's get the current counts
    const { data: drillQuestions, error } = await supabase
      .from('questions')
      .select('id, section_name, sub_skill, sub_skill_id, difficulty')
      .eq('test_type', 'VIC Selective Entry (Year 9 Entry)')
      .eq('test_mode', 'drill');

    if (error) {
      throw error;
    }

    console.log(`📊 Found ${drillQuestions.length} drill questions`);

    // Group by section, sub_skill_id, and difficulty
    const questionGroups = new Map<string, Array<any>>();
    
    drillQuestions.forEach(q => {
      const key = `${q.section_name}|${q.sub_skill_id}|${q.difficulty}`;
      if (!questionGroups.has(key)) {
        questionGroups.set(key, []);
      }
      questionGroups.get(key)!.push(q);
    });

    console.log('\n📈 Current question distribution:');
    
    // Analyze and fix each group
    const groupsToFix = [];
    const questionsToDelete = [];
    
    for (const [groupKey, questions] of questionGroups.entries()) {
      const [sectionName, subSkillId, difficulty] = groupKey.split('|');
      const currentCount = questions.length;
      
      // Determine expected count
      const isWritingSection = sectionName === 'Writing';
      const expectedCount = isWritingSection ? 2 : 10;
      
      console.log(`  ${questions[0].sub_skill} (${sectionName}, Difficulty ${difficulty}): ${currentCount}/${expectedCount}`);
      
      if (currentCount > expectedCount) {
        // Too many questions - mark excess for deletion
        const excess = questions.slice(expectedCount);
        questionsToDelete.push(...excess.map(q => q.id));
        groupsToFix.push({
          group: groupKey,
          action: 'delete_excess',
          currentCount,
          expectedCount,
          excessCount: excess.length
        });
      } else if (currentCount < expectedCount) {
        // Too few questions - would need generation (skip for now)
        groupsToFix.push({
          group: groupKey,
          action: 'need_generation',
          currentCount,
          expectedCount,
          missingCount: expectedCount - currentCount
        });
      }
    }

    // Show what needs to be fixed
    console.log('\n🔧 Issues found:');
    const deleteGroups = groupsToFix.filter(g => g.action === 'delete_excess');
    const generateGroups = groupsToFix.filter(g => g.action === 'need_generation');
    
    console.log(`  📉 ${deleteGroups.length} groups with excess questions (${questionsToDelete.length} questions to delete)`);
    console.log(`  📈 ${generateGroups.length} groups with missing questions (${generateGroups.reduce((sum, g) => sum + g.missingCount, 0)} questions needed)`);

    if (questionsToDelete.length > 0) {
      console.log('\n🗑️  Deleting excess questions...');
      
      // Delete in batches to avoid API limits
      const batchSize = 50;
      for (let i = 0; i < questionsToDelete.length; i += batchSize) {
        const batch = questionsToDelete.slice(i, i + batchSize);
        
        const { error: deleteError } = await supabase
          .from('questions')
          .delete()
          .in('id', batch);

        if (deleteError) {
          console.error(`❌ Error deleting batch ${i / batchSize + 1}:`, deleteError);
        } else {
          console.log(`✅ Deleted batch ${i / batchSize + 1} (${batch.length} questions)`);
        }
      }
      
      console.log(`✅ Deleted ${questionsToDelete.length} excess questions`);
    }

    if (generateGroups.length > 0) {
      console.log('\n⚠️  Groups needing question generation:');
      generateGroups.forEach(g => {
        const [sectionName, subSkillId, difficulty] = g.group.split('|');
        console.log(`  • ${sectionName}, Difficulty ${difficulty}: needs ${g.missingCount} more questions`);
      });
      console.log('\n💡 To fix missing questions, run the full drill generation script.');
    }

    // Verify final counts
    console.log('\n🔍 Verifying final counts...');
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
      const key = `${q.section_name}|${q.sub_skill_id}|${q.difficulty}`;
      finalGroups.set(key, (finalGroups.get(key) || 0) + 1);
    });

    console.log('\n📊 Final question distribution:');
    let allCorrect = true;
    
    for (const [groupKey, count] of finalGroups.entries()) {
      const [sectionName] = groupKey.split('|');
      const isWritingSection = sectionName === 'Writing';
      const expectedCount = isWritingSection ? 2 : 10;
      const status = count === expectedCount ? '✅' : '❌';
      
      if (count !== expectedCount) {
        allCorrect = false;
      }
      
      console.log(`  ${status} ${groupKey.replace(/\|/g, ' - ')}: ${count}/${expectedCount}`);
    }

    if (allCorrect) {
      console.log('\n🎉 All drill question counts are now correct!');
    } else {
      console.log('\n⚠️  Some groups still need manual generation. Run the drill generation script to complete the fix.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main().catch(console.error);