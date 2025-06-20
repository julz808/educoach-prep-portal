#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PROXY_PORT || 3002;

// Enable CORS for all routes
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://127.0.0.1:3000', 
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'http://localhost:5173',
    'http://127.0.0.1:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    claudeApiKey: process.env.CLAUDE_API_KEY ? 'configured' : 'missing'
  });
});

// Writing assessment endpoint
app.post('/api/assess-writing', async (req, res) => {
  console.log('📝 Received writing assessment request');
  
  try {
    const { userResponse, writingPrompt, rubric, yearLevel } = req.body;

    // Validate required fields
    if (!userResponse || !writingPrompt || !rubric || !yearLevel) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['userResponse', 'writingPrompt', 'rubric', 'yearLevel']
      });
    }

    // Get Claude API key
    const claudeApiKey = process.env.CLAUDE_API_KEY;
    if (!claudeApiKey) {
      console.log('❌ Claude API key not configured');
      throw new Error('Claude API key not configured');
    }

    console.log('🤖 Calling Claude API...');
    console.log('📋 Rubric:', rubric.testName, '-', rubric.genre);
    console.log('📝 Response length:', userResponse.length, 'characters');

    // Generate assessment prompt
    const criteriaList = rubric.criteria.map(criterion => 
      `- ${criterion.name} (${criterion.maxMarks} marks): ${criterion.description}`
    ).join('\n');

    const prompt = `You are an experienced Australian educator assessing ${rubric.genre.toLowerCase()} for ${rubric.testName}.

CONTEXT:
- Year Level: ${yearLevel}
- Time Allocated: ${rubric.timeMinutes} minutes
- Writing Genre: ${rubric.genre}
- Total Possible Score: ${rubric.totalMarks} marks

WRITING PROMPT:
"${writingPrompt}"

STUDENT RESPONSE:
"${userResponse}"

ASSESSMENT CRITERIA (Total: ${rubric.totalMarks} marks):
${criteriaList}

ASSESSMENT GUIDELINES:
- Apply realistic scoring for ${yearLevel} students under ${rubric.timeMinutes}-minute time pressure
- Consider age-appropriate expectations for vocabulary, complexity, and technical accuracy
- Be fair but maintain Australian educational standards
- Provide constructive, specific feedback for improvement
- Score whole numbers only (no decimals)
- Consider the time constraints when evaluating - don't expect perfection in short timeframes

REQUIRED JSON RESPONSE:
{
  "totalScore": <number 0-${rubric.totalMarks}>,
  "criterionScores": {
    ${rubric.criteria.map(c => `"${c.name}": {"score": <0-${c.maxMarks}>, "feedback": "<specific 1-2 sentence feedback>"}`).join(',\n    ')}
  },
  "overallFeedback": "<2-3 sentences overall assessment>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"]
}`;

    // Call Claude API
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        temperature: 0.1,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!claudeResponse.ok) {
      const errorData = await claudeResponse.text();
      console.log('❌ Claude API error:', claudeResponse.status, errorData);
      throw new Error(`Claude API error (${claudeResponse.status}): ${errorData}`);
    }

    const claudeData = await claudeResponse.json();
    const content = claudeData.content?.[0]?.text;

    if (!content) {
      throw new Error('No content in Claude API response');
    }

    console.log('✅ Received Claude response, processing...');

    // Parse JSON response
    let parsedResponse;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        parsedResponse = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('❌ Error parsing Claude response:', content);
      throw new Error('Invalid JSON response from Claude API');
    }

    // Validate and clean response
    const totalScore = Math.max(0, Math.min(parsedResponse.totalScore || 0, rubric.totalMarks));
    const criterionScores = {};
    
    for (const criterion of rubric.criteria) {
      const criterionResponse = parsedResponse.criterionScores?.[criterion.name];
      const score = Math.max(0, Math.min(criterionResponse?.score || 0, criterion.maxMarks));
      
      criterionScores[criterion.name] = {
        score,
        maxMarks: criterion.maxMarks,
        feedback: criterionResponse?.feedback || 'No specific feedback provided.'
      };
    }

    const percentageScore = rubric.totalMarks > 0 ? Math.round((totalScore / rubric.totalMarks) * 100) : 0;

    const assessment = {
      totalScore,
      maxPossibleScore: rubric.totalMarks,
      percentageScore,
      criterionScores,
      overallFeedback: parsedResponse.overallFeedback || 'Assessment completed.',
      strengths: Array.isArray(parsedResponse.strengths) ? parsedResponse.strengths.slice(0, 5) : [],
      improvements: Array.isArray(parsedResponse.improvements) ? parsedResponse.improvements.slice(0, 5) : [],
      processingMetadata: {
        modelVersion: 'claude-sonnet-4-20250514',
        processingTimeMs: 0,
        promptTokens: claudeData.usage?.input_tokens,
        responseTokens: claudeData.usage?.output_tokens
      }
    };

    console.log('✅ Assessment completed:', {
      totalScore: assessment.totalScore,
      percentage: assessment.percentageScore,
      criteriaCount: Object.keys(assessment.criterionScores).length
    });

    res.json(assessment);

  } catch (error) {
    console.error('❌ Error in writing assessment:', error.message);
    res.status(500).json({ 
      error: 'Assessment failed', 
      message: error.message 
    });
  }
});

// Error handling
app.use((error, req, res, next) => {
  console.error('❌ Express error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Writing Assessment Proxy running on port ${PORT}`);
  console.log(`📝 Endpoint: http://localhost:${PORT}/api/assess-writing`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`🔑 Claude API key: ${process.env.CLAUDE_API_KEY ? 'configured' : 'MISSING'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n👋 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

export default app;