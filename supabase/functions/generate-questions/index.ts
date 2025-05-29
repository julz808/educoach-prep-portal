// Supabase Edge Function - Question Generation API
// Provides secure server-side question generation with Claude 4 integration

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QuestionGenerationRequest {
  testType: string;
  yearLevel: string;
  sectionName: string;
  subSkill: string;
  difficulty: number;
  questionCount: number;
  passageId?: string;
  visualRequired?: boolean;
  australianContext?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify the user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    // Parse request body
    const requestData: QuestionGenerationRequest = await req.json();

    // Validate request
    if (!requestData.testType || !requestData.sectionName || !requestData.subSkill) {
      throw new Error('Missing required fields: testType, sectionName, subSkill');
    }

    // Claude 4 API configuration
    const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
    const CLAUDE_API_KEY = Deno.env.get('CLAUDE_API_KEY');

    if (!CLAUDE_API_KEY) {
      throw new Error('Claude API key not configured');
    }

    // Generate Australian context prompt based on sub-skill
    const australianContext = requestData.australianContext ? `
      IMPORTANT: Use Australian context, terminology, and examples:
      - Use Australian currency (AUD, cents, dollars)
      - Reference Australian geography (states, cities, landmarks)
      - Include Australian cultural references and scenarios
      - Use Australian spelling (colour, favourite, realise, etc.)
      - Reference Australian school system and age-appropriate activities
    ` : '';

    // Generate visual specification if required
    const visualSpec = requestData.visualRequired ? `
      VISUAL REQUIREMENT: This question MUST include a visual component.
      Generate the visual data in this exact JSON structure:
      "visualData": {
        "type": "geometry|chart|pattern|diagram",
        "data": {
          // For geometry: shapes array with type, properties, coordinates
          // For charts: chartType, chartData array, axes
          // For patterns: sequence array, rules
          // For diagrams: elements array with id, type, properties
        },
        "renderingSpecs": {
          "width": number,
          "height": number,
          "interactive": boolean,
          "style": {}
        },
        "description": "Accessibility description"
      }
    ` : '';

    // Generate questions using Claude
    const prompt = `Generate ${requestData.questionCount} multiple-choice questions for Australian ${requestData.testType} assessment.

Requirements:
- Test Type: ${requestData.testType}
- Year Level: ${requestData.yearLevel}
- Section: ${requestData.sectionName}
- Sub-skill: ${requestData.subSkill}
- Difficulty Level: ${requestData.difficulty}/3 (1=Easy, 2=Medium, 3=Hard)
- Australian curriculum aligned
- Age-appropriate content
- Include visual elements if specified

Question Format:
- Multiple choice with 4 options (A, B, C, D)
- Clear, unambiguous questions
- Detailed explanations for correct answers
- Australian context and examples where relevant

Difficulty Guidelines:
- Level 1 (Easy): Basic concepts, simple language, straightforward problems
- Level 2 (Medium): Moderate complexity, some multi-step thinking required
- Level 3 (Hard): Complex problems, advanced reasoning, multiple concepts combined

Return as JSON array with this structure:
[{
  "questionText": "Question text here",
  "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
  "correctAnswer": "A",
  "explanation": "Detailed explanation of why this is correct",
  "difficulty": ${requestData.difficulty},
  "subSkill": "${requestData.subSkill}",
  "hasVisual": false
}]`;

    // Call Claude 4 Sonnet API (latest model)
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514', // Updated to latest Claude 4 Sonnet
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      throw new Error(`Claude API error: ${claudeResponse.status} - ${errorText}`);
    }

    const claudeData = await claudeResponse.json();
    
    if (!claudeData.content || !claudeData.content[0] || !claudeData.content[0].text) {
      throw new Error('Invalid response from Claude API');
    }

    // Parse Claude's response
    let generatedContent;
    try {
      generatedContent = JSON.parse(claudeData.content[0].text);
    } catch (parseError) {
      throw new Error(`Failed to parse Claude response: ${parseError.message}`);
    }

    // Save questions to database if this is a production request
    const questionIds: string[] = [];
    
    for (const question of generatedContent.questions) {
      const answerOptions = question.options.map((opt: string, i: number) => ({
        id: String.fromCharCode(65 + i),
        content: opt
      }));

      const { data: savedQuestion, error: saveError } = await supabase
        .from('questions')
        .insert({
          test_type: requestData.testType,
          year_level: parseInt(requestData.yearLevel.match(/\d+/)?.[0] || '5'),
          section_name: requestData.sectionName,
          sub_skill: requestData.subSkill,
          difficulty: requestData.difficulty,
          passage_id: requestData.passageId || null,
          question_text: question.questionText,
          has_visual: question.hasVisual || false,
          visual_type: question.visualType || null,
          visual_data: question.visualData || null,
          response_type: 'multiple_choice',
          answer_options: answerOptions,
          correct_answer: question.correctAnswer,
          solution: question.explanation,
          curriculum_aligned: true,
          generated_by: 'claude',
          reviewed: true
        })
        .select()
        .single();

      if (saveError) {
        console.error('Error saving question:', saveError);
        throw new Error(`Failed to save question: ${saveError.message}`);
      }

      questionIds.push(savedQuestion.id);
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          ...generatedContent,
          savedQuestionIds: questionIds
        }
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred'
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
}); 