import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables!');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Set' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findUserWritingAssessment() {
  const email = 'owoicy@gmail.com';

  console.log('🔍 Looking up user:', email);

  // Find user
  const { data: userData, error: userError } = await supabase.auth.admin.listUsers();

  if (userError) {
    console.error('Error fetching users:', userError);
    return;
  }

  const user = userData.users.find(u => u.email === email);

  if (!user) {
    console.log('❌ User not found');
    return;
  }

  console.log('✅ User found:', {
    id: user.id,
    email: user.email,
    created_at: user.created_at
  });

  // Find writing assessments
  const { data: assessments, error: assessmentError } = await supabase
    .from('writing_assessments')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (assessmentError) {
    console.error('Error fetching writing assessments:', assessmentError);
    return;
  }

  console.log(`\n📝 Found ${assessments?.length || 0} writing assessments`);

  if (assessments && assessments.length > 0) {
    console.log('\nWriting Assessments:');
    assessments.forEach((assessment, index) => {
      console.log(`\n--- Assessment ${index + 1} ---`);
      console.log('ID:', assessment.id);
      console.log('Product Type:', assessment.product_type);
      console.log('Writing Genre:', assessment.writing_genre);
      console.log('Created:', assessment.created_at);
      console.log('User Response:', assessment.user_response ?
        assessment.user_response.substring(0, 200) + '...' : 'None');
      console.log('Word Count:', assessment.word_count);
      console.log('Overall Feedback:', assessment.overall_feedback ? 'Available ✅' : 'UNAVAILABLE ❌');
      console.log('Total Score:', assessment.total_score);
      console.log('Max Score:', assessment.max_possible_score);
      console.log('Percentage:', assessment.percentage_score);
      console.log('Question ID:', assessment.question_id);
      console.log('Session ID:', assessment.session_id);
    });

    // Create markdown file with essays
    let markdown = `# Writing Assessment Essays for ${email}\n\n`;
    markdown += `User ID: ${user.id}\n`;
    markdown += `Total Assessments: ${assessments.length}\n\n`;
    markdown += `---\n\n`;

    assessments.forEach((assessment, index) => {
      markdown += `## Assessment ${index + 1}\n\n`;
      markdown += `**Assessment ID:** ${assessment.id}\n`;
      markdown += `**Product Type:** ${assessment.product_type || 'N/A'}\n`;
      markdown += `**Writing Genre:** ${assessment.writing_genre || 'N/A'}\n`;
      markdown += `**Date:** ${new Date(assessment.created_at).toLocaleString()}\n`;
      markdown += `**Question ID:** ${assessment.question_id}\n`;
      markdown += `**Session ID:** ${assessment.session_id}\n`;
      markdown += `**Word Count:** ${assessment.word_count || 0}\n\n`;

      markdown += `### Student's Essay Response\n\n`;
      markdown += `${assessment.user_response || 'No response recorded'}\n\n`;

      markdown += `### Assessment Results\n\n`;
      if (assessment.overall_feedback) {
        markdown += `**Total Score:** ${assessment.total_score || 0} / ${assessment.max_possible_score || 0} (${assessment.percentage_score || 0}%)\n\n`;

        markdown += `**Overall Feedback:**\n${assessment.overall_feedback}\n\n`;

        if (assessment.criterion_scores) {
          markdown += `**Criterion Scores:**\n\n`;
          const criteria = typeof assessment.criterion_scores === 'string'
            ? JSON.parse(assessment.criterion_scores)
            : assessment.criterion_scores;

          Object.entries(criteria).forEach(([criterion, details]: [string, any]) => {
            markdown += `- **${criterion}:** ${details.score}/${details.maxMarks}\n`;
            markdown += `  - ${details.feedback}\n\n`;
          });
        }

        if (assessment.strengths) {
          const strengths = typeof assessment.strengths === 'string'
            ? JSON.parse(assessment.strengths)
            : assessment.strengths;
          if (strengths && strengths.length > 0) {
            markdown += `**Strengths:**\n`;
            strengths.forEach((strength: string) => markdown += `- ${strength}\n`);
            markdown += `\n`;
          }
        }

        if (assessment.improvements) {
          const improvements = typeof assessment.improvements === 'string'
            ? JSON.parse(assessment.improvements)
            : assessment.improvements;
          if (improvements && improvements.length > 0) {
            markdown += `**Areas for Improvement:**\n`;
            improvements.forEach((improvement: string) => markdown += `- ${improvement}\n`);
            markdown += `\n`;
          }
        }
      } else {
        markdown += `**Feedback:** ❌ UNAVAILABLE (This is the issue reported)\n`;
        markdown += `**Total Score:** ${assessment.total_score || 'N/A'}\n`;
      }

      markdown += `\n---\n\n`;
    });

    // Write to file
    const { writeFileSync } = await import('fs');
    const filePath = `/Users/julz88/Documents/educoach-prep-portal-2/writing-assessment-${user.id}.md`;
    writeFileSync(filePath, markdown);
    console.log(`\n✅ Markdown file created: ${filePath}`);
  } else {
    console.log('No writing assessments found for this user.');
  }
}

findUserWritingAssessment();
