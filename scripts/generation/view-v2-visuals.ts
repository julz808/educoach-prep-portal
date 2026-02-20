import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function generateVisualViewer() {
  console.log('📊 Fetching visual questions from questions_v2 table...');

  // Fetch all questions that have visual_svg
  const { data: questions, error } = await supabase
    .from('questions_v2')
    .select('*')
    .not('visual_svg', 'is', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching questions:', error);
    return;
  }

  if (!questions || questions.length === 0) {
    console.log('⚠️  No visual questions found in questions_v2 table');
    return;
  }

  console.log(`✅ Found ${questions.length} visual questions`);

  // Generate HTML
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Visual Questions Viewer - All Questions</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
            line-height: 1.6;
        }
        h1 {
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
        }
        .stats {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .stats h2 {
            margin-top: 0;
            color: #3498db;
        }
        .stat-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }
        .stat-item {
            background: #ecf0f1;
            padding: 15px;
            border-radius: 5px;
            text-align: center;
        }
        .stat-value {
            font-size: 2em;
            font-weight: bold;
            color: #2c3e50;
        }
        .stat-label {
            color: #7f8c8d;
            font-size: 0.9em;
            margin-top: 5px;
        }
        .filters {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .filter-group {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            margin-top: 10px;
        }
        .filter-btn {
            padding: 8px 16px;
            border: 2px solid #3498db;
            background: white;
            color: #3498db;
            border-radius: 5px;
            cursor: pointer;
            transition: all 0.3s;
        }
        .filter-btn:hover {
            background: #3498db;
            color: white;
        }
        .filter-btn.active {
            background: #3498db;
            color: white;
        }
        .question-card {
            background: white;
            border-radius: 8px;
            padding: 30px;
            margin: 20px 0;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .question-header {
            background: #ecf0f1;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        .test-type {
            display: inline-block;
            background: #9b59b6;
            color: white;
            padding: 4px 12px;
            border-radius: 15px;
            font-size: 0.85em;
            margin-right: 10px;
        }
        .sub-skill {
            color: #3498db;
            font-weight: bold;
            font-size: 1.1em;
            margin-top: 5px;
        }
        .meta {
            color: #7f8c8d;
            font-size: 0.9em;
            margin-top: 5px;
        }
        .question-text {
            font-size: 1.1em;
            margin: 20px 0;
            color: #2c3e50;
            white-space: pre-wrap;
        }
        .visual-container {
            background: #ffffff;
            border: 2px solid #3498db;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
            overflow-x: auto;
        }
        .visual-label {
            color: #3498db;
            font-weight: bold;
            margin-bottom: 15px;
            text-transform: uppercase;
            font-size: 0.9em;
        }
        .answer-options {
            margin: 20px 0;
        }
        .answer-option {
            padding: 10px;
            margin: 5px 0;
            background: #f8f9fa;
            border-radius: 5px;
            border-left: 3px solid #dee2e6;
        }
        .answer-option.correct {
            background: #d4edda;
            border-left-color: #28a745;
            font-weight: bold;
        }
        .solution {
            background: #e8f4f8;
            padding: 15px;
            border-radius: 5px;
            margin-top: 20px;
            border-left: 4px solid #3498db;
        }
        .solution-title {
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 10px;
        }
        .divider {
            height: 2px;
            background: linear-gradient(to right, #3498db, transparent);
            margin: 40px 0;
        }
        svg {
            max-width: 100%;
            height: auto;
        }
        table {
            margin: 0 auto;
        }
        .hidden {
            display: none;
        }
    </style>
</head>
<body>
    <h1>📊 Visual Questions Viewer</h1>

    <div class="stats">
        <h2>📈 Summary Statistics</h2>
        <div class="stat-grid">
            <div class="stat-item">
                <div class="stat-value">${questions.length}</div>
                <div class="stat-label">Total Visual Questions</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${[...new Set(questions.map(q => q.test_type))].length}</div>
                <div class="stat-label">Test Types</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${[...new Set(questions.map(q => q.visual_type))].length}</div>
                <div class="stat-label">Visual Types</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${new Date().toLocaleDateString()}</div>
                <div class="stat-label">Generated</div>
            </div>
        </div>
    </div>

    <div class="filters">
        <h3>🔍 Filter by Test Type:</h3>
        <div class="filter-group">
            <button class="filter-btn active" onclick="filterByTestType('all')">All (${questions.length})</button>
            ${[...new Set(questions.map(q => q.test_type))].map(testType => `
                <button class="filter-btn" onclick="filterByTestType('${testType}')">
                    ${testType} (${questions.filter(q => q.test_type === testType).length})
                </button>
            `).join('')}
        </div>

        <h3 style="margin-top: 20px;">📊 Filter by Visual Type:</h3>
        <div class="filter-group">
            ${[...new Set(questions.map(q => q.visual_type))].map(visualType => `
                <button class="filter-btn" onclick="filterByVisualType('${visualType}')">
                    ${visualType} (${questions.filter(q => q.visual_type === visualType).length})
                </button>
            `).join('')}
        </div>
    </div>

    <div id="questions-container">
    ${questions.map((q, index) => `
        <div class="question-card" data-test-type="${q.test_type}" data-visual-type="${q.visual_type}">
            <div class="question-header">
                <div>
                    <span class="test-type">${q.test_type}</span>
                    <span class="sub-skill">${index + 1}. ${q.sub_skill || 'No Sub-Skill'}</span>
                </div>
                <div class="meta">
                    Difficulty: ${q.difficulty} |
                    Visual Type: ${q.visual_type} |
                    Section: ${q.section_name || 'N/A'} |
                    Created: ${new Date(q.created_at).toLocaleString()}
                </div>
            </div>

            <div class="question-text">${q.question_text}</div>

            <div class="visual-container">
                <div class="visual-label">📊 Generated Visual (${q.visual_type})</div>
                ${q.visual_svg || 'No SVG content'}
            </div>

            <div class="answer-options">
                <strong>Answer Options:</strong>
                ${q.answer_options.map((opt: string, i: number) => {
                    const optionLetter = String.fromCharCode(65 + i);
                    const isCorrect = q.correct_answer === optionLetter;
                    return `
                    <div class="answer-option ${isCorrect ? 'correct' : ''}">
                        ${opt} ${isCorrect ? '✓' : ''}
                    </div>
                    `;
                }).join('')}
            </div>

            <div class="solution">
                <div class="solution-title">💡 Solution:</div>
                ${q.solution || 'No solution provided'}
            </div>
        </div>

        ${index < questions.length - 1 ? '<div class="divider"></div>' : ''}
    `).join('')}
    </div>

    <footer style="text-align: center; margin-top: 40px; padding: 20px; color: #7f8c8d;">
        <p>Generated from Questions Table - V2 Question Generation Engine</p>
        <p>${new Date().toLocaleString()}</p>
    </footer>

    <script>
        function filterByTestType(testType) {
            const cards = document.querySelectorAll('.question-card');
            const buttons = document.querySelectorAll('.filter-btn');

            // Update button states
            buttons.forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');

            // Filter cards
            cards.forEach(card => {
                if (testType === 'all' || card.dataset.testType === testType) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        }

        function filterByVisualType(visualType) {
            const cards = document.querySelectorAll('.question-card');

            cards.forEach(card => {
                if (card.dataset.visualType === visualType) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        }
    </script>
</body>
</html>
  `;

  // Write to public directory
  const outputPath = path.join(process.cwd(), 'public', 'v2-visual-questions-viewer.html');
  fs.writeFileSync(outputPath, html);

  console.log(`✅ HTML viewer generated: ${outputPath}`);
  console.log('\n📖 To view:');
  console.log('   1. Open the file in your browser, OR');
  console.log('   2. Run your dev server and visit: http://localhost:5173/v2-visual-questions-viewer.html');
  console.log('\n📊 Summary:');
  console.log(`   - Total questions: ${questions.length}`);
  console.log(`   - Test types: ${[...new Set(questions.map(q => q.test_type))].join(', ')}`);
  console.log(`   - Visual types: ${[...new Set(questions.map(q => q.visual_type))].join(', ')}`);
}

generateVisualViewer().catch(console.error);
