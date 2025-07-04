#!/usr/bin/env node

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseDrillIssues() {
  console.log('🔍 DRILL DIAGNOSTIC TOOL');
  console.log('========================');
  
  try {
    // Check drill questions for EduTest
    const { data: drillQuestions, error } = await supabase
      .from('questions')
      .select('*')
      .eq('test_type', 'EduTest Scholarship (Year 7 Entry)')
      .eq('test_mode', 'drill');
    
    if (error) {
      console.error('❌ Error fetching drill questions:', error);
      return;
    }
    
    console.log(`📊 Total drill questions: ${drillQuestions.length}`);
    
    // Group by section and sub-skill
    const sections = {};
    const problemQuestions = [];
    
    drillQuestions.forEach(q => {
      const section = q.section_name;
      const subSkill = q.sub_skill;
      
      if (!sections[section]) {
        sections[section] = {};
      }
      if (!sections[section][subSkill]) {
        sections[section][subSkill] = [];
      }
      sections[section][subSkill].push(q);
      
      // Check for potential issues
      if (!q.question_text) {
        problemQuestions.push({ id: q.id, issue: 'Missing question_text', section, subSkill });
      }
      if (q.response_type === 'multiple_choice' && !q.answer_options) {
        problemQuestions.push({ id: q.id, issue: 'Missing answer_options', section, subSkill });
      }
      if (!q.correct_answer) {
        problemQuestions.push({ id: q.id, issue: 'Missing correct_answer', section, subSkill });
      }
    });
    
    console.log('\n📋 SECTIONS BREAKDOWN:');
    Object.entries(sections).forEach(([section, subSkills]) => {
      console.log(`\n🎯 ${section}:`);
      Object.entries(subSkills).forEach(([subSkill, questions]) => {
        console.log(`   ${subSkill}: ${questions.length} questions`);
        
        // Check if any sub-skill has 0 questions
        if (questions.length === 0) {
          console.log(`   ❌ WARNING: ${subSkill} has NO questions`);
        } else if (questions.length < 30) {
          console.log(`   ⚠️  WARNING: ${subSkill} has only ${questions.length} questions (expected 30)`);
        }
      });
    });
    
    if (problemQuestions.length > 0) {
      console.log('\n❌ PROBLEMATIC QUESTIONS:');
      problemQuestions.forEach(issue => {
        console.log(`   ${issue.id}: ${issue.issue} (${issue.section} - ${issue.subSkill})`);
      });
    }
    
    // Check passage issues
    const questionsWithPassages = drillQuestions.filter(q => q.passage_id);
    console.log(`\n📖 Questions with passages: ${questionsWithPassages.length}`);
    
    if (questionsWithPassages.length > 0) {
      const passageIds = [...new Set(questionsWithPassages.map(q => q.passage_id))];
      const { data: passages, error: passageError } = await supabase
        .from('passages')
        .select('*')
        .in('id', passageIds);
      
      if (passageError) {
        console.error('❌ Error fetching passages:', passageError);
      } else {
        console.log(`📖 Found passages: ${passages.length}/${passageIds.length}`);
        
        const missingPassages = passageIds.filter(id => !passages.find(p => p.id === id));
        if (missingPassages.length > 0) {
          console.log(`❌ Missing passages: ${missingPassages.length}`);
          missingPassages.forEach(id => console.log(`   Missing: ${id}`));
        }
        
        // Check for empty passages
        const emptyPassages = passages.filter(p => !p.content || p.content.trim().length === 0);
        if (emptyPassages.length > 0) {
          console.log(`❌ Empty passages: ${emptyPassages.length}`);
        }
      }
    }
    
    // Summary
    console.log('\n🎯 SUMMARY:');
    console.log(`✅ Total questions: ${drillQuestions.length}`);
    console.log(`⚠️  Problem questions: ${problemQuestions.length}`);
    console.log(`📖 Questions with passages: ${questionsWithPassages.length}`);
    
    if (problemQuestions.length === 0) {
      console.log('🎉 No obvious data issues found!');
      console.log('💡 Loading issue might be frontend-related');
    } else {
      console.log('❌ Data integrity issues found - these may cause loading problems');
    }
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
  }
}

diagnoseDrillIssues();