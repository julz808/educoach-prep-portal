import express from 'express';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3456;

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// API endpoint to fetch questions with visuals
app.get('/api/questions', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('questions_v2')
      .select('*')
      .eq('has_visual', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching questions:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ questions: data || [] });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API endpoint to get question count
app.get('/api/stats', async (req, res) => {
  try {
    const { count, error } = await supabase
      .from('questions_v2')
      .select('*', { count: 'exact', head: true })
      .eq('has_visual', true);

    if (error) {
      console.error('Error fetching stats:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ total: count || 0 });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve the main HTML page
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Visual Questions Viewer - EduCourse</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #E6F7F5 0%, #F8F9FA 100%);
      color: #2C3E50;
      line-height: 1.6;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 40px 20px;
    }

    .header {
      background: white;
      border-radius: 12px;
      padding: 30px;
      margin-bottom: 30px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .header h1 {
      color: #3B4F6B;
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 10px;
    }

    .header p {
      color: #6B7280;
      font-size: 16px;
    }

    .stats {
      display: flex;
      gap: 20px;
      margin-top: 20px;
    }

    .stat-card {
      background: linear-gradient(135deg, #4ECDC4 0%, #3BABA3 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      flex: 1;
    }

    .stat-card h3 {
      font-size: 14px;
      font-weight: 500;
      opacity: 0.9;
      margin-bottom: 8px;
    }

    .stat-card p {
      font-size: 32px;
      font-weight: 700;
    }

    .filters {
      background: white;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 30px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .filter-group {
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
      align-items: center;
    }

    .filter-group label {
      font-weight: 600;
      color: #3B4F6B;
      font-size: 14px;
    }

    .filter-group select, .filter-group input {
      padding: 10px 15px;
      border: 2px solid #E5E7EB;
      border-radius: 8px;
      font-size: 14px;
      background: white;
      transition: all 0.3s;
    }

    .filter-group select:focus, .filter-group input:focus {
      outline: none;
      border-color: #4ECDC4;
    }

    .loading {
      text-align: center;
      padding: 60px 20px;
      font-size: 18px;
      color: #6B7280;
    }

    .questions-grid {
      display: grid;
      gap: 30px;
    }

    .question-card {
      background: white;
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: transform 0.3s, box-shadow 0.3s;
    }

    .question-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    }

    .question-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 20px;
      gap: 20px;
    }

    .question-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
    }

    .badge-test {
      background: #EEF2FF;
      color: #6366F1;
    }

    .badge-section {
      background: #DBEAFE;
      color: #3B82F6;
    }

    .badge-mode {
      background: #DCFCE7;
      color: #16A34A;
    }

    .badge-difficulty {
      background: #FEE2E2;
      color: #DC2626;
    }

    .badge-visual {
      background: #FEF3C7;
      color: #D97706;
    }

    .question-id {
      font-size: 12px;
      color: #9CA3AF;
      font-family: 'Courier New', monospace;
    }

    .question-content {
      margin-bottom: 25px;
    }

    .question-content h3 {
      color: #3B4F6B;
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 15px;
    }

    .question-text {
      color: #2C3E50;
      font-size: 16px;
      margin-bottom: 20px;
      line-height: 1.8;
    }

    .visual-container {
      background: #F9FAFB;
      border: 2px solid #E5E7EB;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }

    .visual-container h4 {
      color: #6B7280;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 15px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .visual-svg {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 200px;
      background: white;
      border-radius: 6px;
      padding: 20px;
    }

    .visual-description {
      margin-top: 15px;
      padding: 15px;
      background: white;
      border-radius: 6px;
      color: #4B5563;
      font-size: 14px;
      line-height: 1.6;
    }

    .answer-options {
      margin: 20px 0;
    }

    .answer-options h4 {
      color: #3B4F6B;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 12px;
    }

    .option {
      padding: 12px 16px;
      margin-bottom: 8px;
      border-radius: 8px;
      background: #F9FAFB;
      border: 2px solid #E5E7EB;
      transition: all 0.2s;
    }

    .option.correct {
      background: #DCFCE7;
      border-color: #4ECDC4;
      font-weight: 600;
    }

    .solution {
      background: #EFF6FF;
      border-left: 4px solid #3B82F6;
      padding: 20px;
      border-radius: 8px;
      margin-top: 20px;
    }

    .solution h4 {
      color: #1E40AF;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 12px;
    }

    .solution-text {
      color: #1E3A8A;
      font-size: 14px;
      line-height: 1.8;
    }

    .sub-skill-info {
      display: flex;
      gap: 20px;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #E5E7EB;
      font-size: 14px;
    }

    .sub-skill-info div {
      flex: 1;
    }

    .sub-skill-info strong {
      color: #3B4F6B;
      display: block;
      margin-bottom: 4px;
    }

    .sub-skill-info span {
      color: #6B7280;
    }

    .no-questions {
      text-align: center;
      padding: 60px 20px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .no-questions h3 {
      color: #3B4F6B;
      font-size: 24px;
      margin-bottom: 10px;
    }

    .no-questions p {
      color: #6B7280;
      font-size: 16px;
    }

    @media (max-width: 768px) {
      .header h1 {
        font-size: 24px;
      }

      .stats {
        flex-direction: column;
      }

      .filter-group {
        flex-direction: column;
        align-items: stretch;
      }

      .question-header {
        flex-direction: column;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Visual Questions Viewer</h1>
      <p>Browse all questions with visual components (charts, diagrams, SVG graphics)</p>
      <div class="stats">
        <div class="stat-card">
          <h3>Total Visual Questions</h3>
          <p id="total-count">Loading...</p>
        </div>
        <div class="stat-card" style="background: linear-gradient(135deg, #FF6B6B 0%, #E85A5A 100%);">
          <h3>Currently Displayed</h3>
          <p id="displayed-count">0</p>
        </div>
      </div>
    </div>

    <div class="filters">
      <div class="filter-group">
        <label>Test Type:</label>
        <select id="test-filter">
          <option value="">All Tests</option>
        </select>

        <label>Section:</label>
        <select id="section-filter">
          <option value="">All Sections</option>
        </select>

        <label>Visual Type:</label>
        <select id="visual-filter">
          <option value="">All Types</option>
          <option value="SVG">SVG</option>
          <option value="HTML">HTML</option>
          <option value="Image Generation">Image Generation</option>
        </select>

        <label>Search:</label>
        <input type="text" id="search-input" placeholder="Search question text...">
      </div>
    </div>

    <div id="loading" class="loading">
      <p>🔄 Loading visual questions...</p>
    </div>

    <div id="questions-container" class="questions-grid" style="display: none;"></div>
  </div>

  <script>
    let allQuestions = [];
    let filteredQuestions = [];

    async function loadQuestions() {
      try {
        const response = await fetch('/api/questions');
        const data = await response.json();
        allQuestions = data.questions || [];

        populateFilters();
        applyFilters();

        document.getElementById('loading').style.display = 'none';
        document.getElementById('questions-container').style.display = 'grid';
      } catch (error) {
        console.error('Error loading questions:', error);
        document.getElementById('loading').innerHTML = '<p style="color: #DC2626;">❌ Error loading questions. Check console for details.</p>';
      }
    }

    async function loadStats() {
      try {
        const response = await fetch('/api/stats');
        const data = await response.json();
        document.getElementById('total-count').textContent = data.total || 0;
      } catch (error) {
        console.error('Error loading stats:', error);
        document.getElementById('total-count').textContent = 'Error';
      }
    }

    function populateFilters() {
      const testTypes = [...new Set(allQuestions.map(q => q.test_type))].sort();
      const sections = [...new Set(allQuestions.map(q => q.section_name))].sort();

      const testFilter = document.getElementById('test-filter');
      testTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        testFilter.appendChild(option);
      });

      const sectionFilter = document.getElementById('section-filter');
      sections.forEach(section => {
        const option = document.createElement('option');
        option.value = section;
        option.textContent = section;
        sectionFilter.appendChild(option);
      });
    }

    function applyFilters() {
      const testFilter = document.getElementById('test-filter').value;
      const sectionFilter = document.getElementById('section-filter').value;
      const visualFilter = document.getElementById('visual-filter').value;
      const searchText = document.getElementById('search-input').value.toLowerCase();

      filteredQuestions = allQuestions.filter(q => {
        if (testFilter && q.test_type !== testFilter) return false;
        if (sectionFilter && q.section_name !== sectionFilter) return false;
        if (visualFilter && q.visual_type !== visualFilter) return false;
        if (searchText && !q.question_text.toLowerCase().includes(searchText)) return false;
        return true;
      });

      renderQuestions();
    }

    function renderQuestions() {
      const container = document.getElementById('questions-container');
      document.getElementById('displayed-count').textContent = filteredQuestions.length;

      if (filteredQuestions.length === 0) {
        container.innerHTML = \`
          <div class="no-questions">
            <h3>No Questions Found</h3>
            <p>Try adjusting your filters or search criteria.</p>
          </div>
        \`;
        return;
      }

      container.innerHTML = filteredQuestions.map(q => {
        const visualDescription = q.visual_data?.description || 'No description available';
        const altText = q.visual_data?.altText || '';

        let answerOptionsHTML = '';
        if (q.response_type === 'multiple_choice' && q.answer_options) {
          answerOptionsHTML = \`
            <div class="answer-options">
              <h4>Answer Options:</h4>
              \${q.answer_options.map((option, index) => \`
                <div class="option \${option === q.correct_answer ? 'correct' : ''}">
                  <strong>\${String.fromCharCode(65 + index)}.</strong> \${option}
                  \${option === q.correct_answer ? ' ✓' : ''}
                </div>
              \`).join('')}
            </div>
          \`;
        }

        return \`
          <div class="question-card">
            <div class="question-header">
              <div class="question-meta">
                <span class="badge badge-test">\${q.test_type}</span>
                <span class="badge badge-section">\${q.section_name}</span>
                <span class="badge badge-mode">\${q.test_mode}</span>
                <span class="badge badge-difficulty">Difficulty: \${q.difficulty}/6</span>
                \${q.visual_type ? \`<span class="badge badge-visual">\${q.visual_type}</span>\` : ''}
              </div>
              <div class="question-id">ID: \${q.id}</div>
            </div>

            <div class="question-content">
              <h3>Question:</h3>
              <div class="question-text">\${q.question_text}</div>

              \${q.visual_svg ? \`
                <div class="visual-container">
                  <h4>📊 Visual Component</h4>
                  <div class="visual-svg">
                    \${q.visual_svg}
                  </div>
                  \${visualDescription ? \`
                    <div class="visual-description">
                      <strong>Description:</strong> \${visualDescription}
                    </div>
                  \` : ''}
                </div>
              \` : ''}

              \${answerOptionsHTML}

              <div class="solution">
                <h4>💡 Solution:</h4>
                <div class="solution-text">\${q.solution}</div>
              </div>

              <div class="sub-skill-info">
                <div>
                  <strong>Sub-skill:</strong>
                  <span>\${q.sub_skill}</span>
                </div>
                <div>
                  <strong>Year Level:</strong>
                  <span>Year \${q.year_level}</span>
                </div>
                <div>
                  <strong>Max Points:</strong>
                  <span>\${q.max_points}</span>
                </div>
                \${q.quality_score ? \`
                  <div>
                    <strong>Quality Score:</strong>
                    <span>\${q.quality_score}/100</span>
                  </div>
                \` : ''}
              </div>
            </div>
          </div>
        \`;
      }).join('');
    }

    // Event listeners
    document.getElementById('test-filter').addEventListener('change', applyFilters);
    document.getElementById('section-filter').addEventListener('change', applyFilters);
    document.getElementById('visual-filter').addEventListener('change', applyFilters);
    document.getElementById('search-input').addEventListener('input', applyFilters);

    // Initialize
    loadQuestions();
    loadStats();
  </script>
</body>
</html>
  `);
});

// Start server
app.listen(PORT, () => {
  console.log(`\n✅ Visual Questions Viewer is running!`);
  console.log(`\n🌐 Open your browser to: http://localhost:${PORT}`);
  console.log(`\n📊 This viewer shows all questions with visual components (SVG, charts, diagrams)`);
  console.log(`\nPress Ctrl+C to stop the server\n`);
});
