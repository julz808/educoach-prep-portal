# Question Flagging & Tagging System Plan

## Overview

This document outlines the system for flagging, tagging, and managing questions that require visual support or need editing based on the comprehensive visual dependency audit.

**Audit Results:**
- **107 questions (31.1%)** need visual support and must be flagged
- These questions cannot be answered without their visual components based on current text

---

## Part 1: Database Schema for Flagging System

### 1.1 Add Quality Flags to questions_v2 Table

**Migration:** `supabase/migrations/YYYYMMDD_add_quality_flags.sql`

```sql
-- Add quality flag fields
ALTER TABLE questions_v2
ADD COLUMN IF NOT EXISTS requires_visual_support BOOLEAN DEFAULT NULL,
ADD COLUMN IF NOT EXISTS visual_issue_type TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS visual_issue_description TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS flagged_at TIMESTAMP DEFAULT NULL,
ADD COLUMN IF NOT EXISTS flagged_by TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS resolution_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP DEFAULT NULL,
ADD COLUMN IF NOT EXISTS resolved_by TEXT DEFAULT NULL;

-- Add constraints
ALTER TABLE questions_v2
ADD CONSTRAINT visual_issue_type_check
CHECK (visual_issue_type IS NULL OR visual_issue_type IN (
  'missing_table_data',
  'missing_grid_data',
  'missing_measurements',
  'vague_description',
  'chart_needs_visual',
  'diagram_needs_visual',
  'other'
));

ALTER TABLE questions_v2
ADD CONSTRAINT resolution_status_check
CHECK (resolution_status IN (
  'pending',
  'in_review',
  'fixed',
  'wont_fix',
  'keep_visual'
));

-- Add indexes for filtering
CREATE INDEX IF NOT EXISTS idx_questions_v2_requires_visual
ON questions_v2(requires_visual_support)
WHERE requires_visual_support = true;

CREATE INDEX IF NOT EXISTS idx_questions_v2_resolution_status
ON questions_v2(resolution_status)
WHERE resolution_status != 'fixed';

-- Add comments
COMMENT ON COLUMN questions_v2.requires_visual_support IS
'TRUE if question cannot be answered without visual based on current text';

COMMENT ON COLUMN questions_v2.visual_issue_type IS
'Category of visual dependency issue';

COMMENT ON COLUMN questions_v2.visual_issue_description IS
'Detailed description of what needs to be fixed';

COMMENT ON COLUMN questions_v2.resolution_status IS
'Current status: pending, in_review, fixed, wont_fix, keep_visual';
```

### 1.2 Create Question Issue Log Table

**Purpose:** Track history of issues and resolutions

```sql
-- Create issue log table
CREATE TABLE IF NOT EXISTS question_issues_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES questions_v2(id) ON DELETE CASCADE,
  issue_type TEXT NOT NULL,
  issue_description TEXT,
  reported_by TEXT NOT NULL,
  reported_at TIMESTAMP NOT NULL DEFAULT NOW(),
  severity TEXT NOT NULL DEFAULT 'medium',
  resolution_notes TEXT,
  resolved_by TEXT,
  resolved_at TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT issue_type_check CHECK (issue_type IN (
    'visual_dependency',
    'incorrect_answer',
    'typo',
    'unclear_wording',
    'missing_data',
    'other'
  )),

  CONSTRAINT severity_check CHECK (severity IN (
    'low',
    'medium',
    'high',
    'critical'
  )),

  CONSTRAINT status_check CHECK (status IN (
    'open',
    'in_progress',
    'resolved',
    'closed',
    'wont_fix'
  ))
);

-- Add indexes
CREATE INDEX idx_question_issues_question_id ON question_issues_log(question_id);
CREATE INDEX idx_question_issues_status ON question_issues_log(status) WHERE status != 'closed';
CREATE INDEX idx_question_issues_severity ON question_issues_log(severity);

-- Enable RLS
ALTER TABLE question_issues_log ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to view
CREATE POLICY question_issues_select ON question_issues_log
FOR SELECT TO authenticated
USING (true);

-- Create policy for service role to manage
CREATE POLICY question_issues_all ON question_issues_log
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_question_issues_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER question_issues_updated_at
BEFORE UPDATE ON question_issues_log
FOR EACH ROW
EXECUTE FUNCTION update_question_issues_updated_at();
```

---

## Part 2: Bulk Flagging Script

### 2.1 Flag All Questions from Audit Report

**File:** `scripts/migration/flag-visual-dependency-questions.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface FlaggedQuestion {
  id: string;
  visual_issue_type: string;
  visual_issue_description: string;
  actionNeeded: string;
}

async function flagQuestionsFromAudit() {
  console.log('\n🚩 Flagging Questions from Visual Dependency Audit\n');
  console.log('═════════════════════════════════════════════════════\n');

  // Load audit report
  const report = JSON.parse(
    fs.readFileSync('REPORT-questions-needing-visual-support.json', 'utf-8')
  );

  const questionsToFlag: FlaggedQuestion[] = report.questionsNeedingFlag.map((q: any) => {
    // Map category to issue type
    let issueType = 'other';
    if (q.category === 'Table') {
      issueType = 'missing_table_data';
    } else if (q.category === 'Grid/Pattern') {
      issueType = 'missing_grid_data';
    } else if (q.category === 'Geometry') {
      issueType = 'missing_measurements';
    } else if (q.category === 'Chart/Graph') {
      issueType = 'chart_needs_visual';
    } else if (q.category === 'Diagram/Other') {
      issueType = q.reason.includes('vague') ? 'vague_description' : 'diagram_needs_visual';
    }

    return {
      id: q.id,
      visual_issue_type: issueType,
      visual_issue_description: `${q.reason}. ${q.actionNeeded}`,
      actionNeeded: q.actionNeeded
    };
  });

  console.log(`Total questions to flag: ${questionsToFlag.length}\n`);

  // Flag in batches of 50
  const batchSize = 50;
  let flagged = 0;
  let errors = 0;

  for (let i = 0; i < questionsToFlag.length; i += batchSize) {
    const batch = questionsToFlag.slice(i, i + batchSize);

    for (const q of batch) {
      try {
        // Update question with flag
        const { error: updateError } = await supabase
          .from('questions_v2')
          .update({
            requires_visual_support: true,
            visual_issue_type: q.visual_issue_type,
            visual_issue_description: q.visual_issue_description,
            flagged_at: new Date().toISOString(),
            flagged_by: 'system_audit',
            resolution_status: 'pending'
          })
          .eq('id', q.id);

        if (updateError) throw updateError;

        // Create issue log entry
        const { error: logError } = await supabase
          .from('question_issues_log')
          .insert({
            question_id: q.id,
            issue_type: 'visual_dependency',
            issue_description: q.visual_issue_description,
            reported_by: 'system_audit',
            severity: 'high',
            status: 'open'
          });

        if (logError) throw logError;

        flagged++;
        console.log(`✓ Flagged: ${q.id}`);
      } catch (error) {
        errors++;
        console.error(`✗ Error flagging ${q.id}:`, error);
      }
    }

    // Progress update
    console.log(`\nProgress: ${Math.min(i + batchSize, questionsToFlag.length)}/${questionsToFlag.length}`);
  }

  console.log('\n═════════════════════════════════════════════════════\n');
  console.log(`✅ Successfully flagged: ${flagged} questions`);
  console.log(`❌ Errors: ${errors} questions`);
  console.log('\n');

  // Generate summary by issue type
  const summary = questionsToFlag.reduce((acc: any, q) => {
    acc[q.visual_issue_type] = (acc[q.visual_issue_type] || 0) + 1;
    return acc;
  }, {});

  console.log('📊 Flagged Questions by Issue Type:\n');
  Object.entries(summary).forEach(([type, count]) => {
    console.log(`   ${type}: ${count}`);
  });
  console.log('\n');
}

flagQuestionsFromAudit().catch(console.error);
```

### 2.2 Run Flagging Script

```bash
# Run the migration first
npx supabase db push

# Then run flagging script
npx tsx scripts/migration/flag-visual-dependency-questions.ts
```

---

## Part 3: Admin Interface for Managing Flagged Questions

### 3.1 Create Admin Dashboard Component

**File:** `src/components/admin/FlaggedQuestionsManager.tsx`

```tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface FlaggedQuestion {
  id: string;
  test_type: string;
  section_name: string;
  sub_skill: string;
  question_text: string;
  visual_issue_type: string;
  visual_issue_description: string;
  resolution_status: string;
  flagged_at: string;
}

export const FlaggedQuestionsManager: React.FC = () => {
  const [questions, setQuestions] = useState<FlaggedQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('pending');

  useEffect(() => {
    loadFlaggedQuestions();
  }, [filter]);

  const loadFlaggedQuestions = async () => {
    setLoading(true);

    let query = supabase
      .from('questions_v2')
      .select('*')
      .eq('requires_visual_support', true)
      .order('flagged_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('resolution_status', filter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading flagged questions:', error);
    } else {
      setQuestions(data || []);
    }

    setLoading(false);
  };

  const updateResolutionStatus = async (
    questionId: string,
    status: string,
    notes?: string
  ) => {
    const { error } = await supabase
      .from('questions_v2')
      .update({
        resolution_status: status,
        resolved_at: status === 'fixed' ? new Date().toISOString() : null,
        resolved_by: status === 'fixed' ? 'admin' : null
      })
      .eq('id', questionId);

    if (error) {
      console.error('Error updating status:', error);
      alert('Error updating status');
    } else {
      // Log the resolution
      await supabase
        .from('question_issues_log')
        .update({
          status: status === 'fixed' ? 'resolved' : 'closed',
          resolution_notes: notes,
          resolved_by: 'admin',
          resolved_at: new Date().toISOString()
        })
        .eq('question_id', questionId)
        .eq('issue_type', 'visual_dependency')
        .eq('status', 'open');

      loadFlaggedQuestions();
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Flagged Questions Manager
      </h1>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="pending">Pending</option>
          <option value="in_review">In Review</option>
          <option value="fixed">Fixed</option>
          <option value="wont_fix">Won't Fix</option>
          <option value="keep_visual">Keep Visual</option>
          <option value="all">All</option>
        </select>

        <div className="flex-1 text-right text-gray-600">
          {questions.length} questions
        </div>
      </div>

      {/* Questions List */}
      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="space-y-4">
          {questions.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              onUpdateStatus={updateResolutionStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface QuestionCardProps {
  question: FlaggedQuestion;
  onUpdateStatus: (id: string, status: string, notes?: string) => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  onUpdateStatus
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [notes, setNotes] = useState('');

  const issueTypeColors: Record<string, string> = {
    missing_table_data: 'bg-blue-100 text-blue-800',
    missing_grid_data: 'bg-purple-100 text-purple-800',
    missing_measurements: 'bg-yellow-100 text-yellow-800',
    vague_description: 'bg-orange-100 text-orange-800',
    chart_needs_visual: 'bg-red-100 text-red-800',
    diagram_needs_visual: 'bg-pink-100 text-pink-800',
    other: 'bg-gray-100 text-gray-800'
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                issueTypeColors[question.visual_issue_type] || 'bg-gray-100'
              }`}
            >
              {question.visual_issue_type.replace(/_/g, ' ').toUpperCase()}
            </span>
            <span className="text-sm text-gray-500">
              {question.test_type} - {question.section_name}
            </span>
          </div>

          <h3 className="font-semibold text-gray-900 mb-2">
            {question.sub_skill}
          </h3>

          <p className="text-sm text-gray-600 mb-3">
            {question.visual_issue_description}
          </p>
        </div>

        <button
          onClick={() => setShowDetails(!showDetails)}
          className="ml-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          {showDetails ? 'Hide' : 'Show'} Details
        </button>
      </div>

      {/* Expanded Details */}
      {showDetails && (
        <div className="border-t border-gray-200 pt-4 mb-4">
          <h4 className="font-semibold text-sm text-gray-700 mb-2">
            Question Text:
          </h4>
          <p className="text-sm text-gray-600 whitespace-pre-wrap mb-4">
            {question.question_text}
          </p>

          <div className="text-xs text-gray-500">
            <p>ID: {question.id}</p>
            <p>
              Flagged: {new Date(question.flagged_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Resolution notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />

        <button
          onClick={() => onUpdateStatus(question.id, 'in_review', notes)}
          className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-sm font-medium"
        >
          In Review
        </button>

        <button
          onClick={() => onUpdateStatus(question.id, 'fixed', notes)}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm font-medium"
        >
          Fixed
        </button>

        <button
          onClick={() => onUpdateStatus(question.id, 'keep_visual', notes)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium"
        >
          Keep Visual
        </button>

        <button
          onClick={() => onUpdateStatus(question.id, 'wont_fix', notes)}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm font-medium"
        >
          Won't Fix
        </button>
      </div>
    </div>
  );
};
```

### 3.2 Add Route to Admin Panel

**File:** `src/App.tsx` or routing configuration

```tsx
import { FlaggedQuestionsManager } from '@/components/admin/FlaggedQuestionsManager';

// Add route
<Route path="/admin/flagged-questions" element={<FlaggedQuestionsManager />} />
```

---

## Part 4: API Endpoints for Bulk Operations

### 4.1 Create Supabase Edge Function

**File:** `supabase/functions/manage-flagged-questions/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const { action, questionIds, status, notes } = await req.json();

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    switch (action) {
      case 'bulk_update_status':
        await supabase
          .from('questions_v2')
          .update({
            resolution_status: status,
            resolved_at: status === 'fixed' ? new Date().toISOString() : null,
            resolved_by: 'admin'
          })
          .in('id', questionIds);

        return new Response(
          JSON.stringify({ success: true, updated: questionIds.length }),
          { headers: { 'Content-Type': 'application/json' } }
        );

      case 'export_flagged':
        const { data } = await supabase
          .from('questions_v2')
          .select('*')
          .eq('requires_visual_support', true)
          .eq('resolution_status', status || 'pending');

        return new Response(JSON.stringify({ data }), {
          headers: { 'Content-Type': 'application/json' }
        });

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
```

---

## Part 5: Reporting & Analytics

### 5.1 Generate Progress Reports

**File:** `scripts/reporting/flagged-questions-progress.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function generateProgressReport() {
  console.log('\n📊 FLAGGED QUESTIONS PROGRESS REPORT\n');
  console.log('═══════════════════════════════════════════════════\n');

  // Get counts by status
  const { data: questions } = await supabase
    .from('questions_v2')
    .select('resolution_status, visual_issue_type')
    .eq('requires_visual_support', true);

  const statusCounts = questions?.reduce((acc: any, q) => {
    acc[q.resolution_status] = (acc[q.resolution_status] || 0) + 1;
    return acc;
  }, {});

  const typeCounts = questions?.reduce((acc: any, q) => {
    acc[q.visual_issue_type] = (acc[q.visual_issue_type] || 0) + 1;
    return acc;
  }, {});

  console.log('Status Breakdown:');
  Object.entries(statusCounts || {}).forEach(([status, count]) => {
    const percent = ((count as number) / (questions?.length || 1)) * 100;
    console.log(`  ${status.padEnd(15)} ${count} (${percent.toFixed(1)}%)`);
  });

  console.log('\n\nIssue Type Breakdown:');
  Object.entries(typeCounts || {}).forEach(([type, count]) => {
    console.log(`  ${type.padEnd(25)} ${count}`);
  });

  const fixed = statusCounts?.fixed || 0;
  const total = questions?.length || 0;
  const progress = (fixed / total) * 100;

  console.log('\n\n📈 Overall Progress:');
  console.log(`  Fixed: ${fixed}/${total} (${progress.toFixed(1)}%)`);
  console.log(`  Remaining: ${total - fixed}`);

  console.log('\n');
}

generateProgressReport();
```

---

## Part 6: Workflow for Resolving Flagged Questions

### Step-by-Step Process

1. **Review Flagged Question**
   - Access admin dashboard
   - Filter by issue type or test type
   - Review question details and issue description

2. **Choose Resolution Path**

   **Path A: Add Missing Data to Text**
   - Edit question_text to include missing table/grid/measurements
   - Update question in database
   - Mark as "Fixed"

   **Path B: Keep Visual**
   - Determine visual is necessary for question
   - Verify SVG is accurate
   - Mark as "Keep Visual"
   - Set `render_visual_as = 'svg'`

   **Path C: Remove Question**
   - Question quality is poor
   - Mark as "Won't Fix"
   - Consider deleting or marking inactive

3. **Verify Fix**
   - Preview question in test interface
   - Ensure it can be answered without visual (if fixed)
   - Check data accuracy

4. **Update Status**
   - Mark resolution status
   - Add notes explaining decision
   - Log completion date

---

## Part 7: Automation & Continuous Monitoring

### 7.1 Scheduled Quality Checks

**File:** `scripts/cron/check-question-quality.ts`

```typescript
// Run weekly to check for new issues
import { createClient } from '@supabase/supabase-js';

async function weeklyQualityCheck() {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Check recently added questions
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const { data: newQuestions } = await supabase
    .from('questions_v2')
    .select('*')
    .eq('has_visual', true)
    .gte('created_at', weekAgo.toISOString());

  // Run visual dependency analysis on new questions
  // Flag if issues detected
  // Send report to admin

  console.log(`Checked ${newQuestions?.length} new questions`);
}

weeklyQualityCheck();
```

---

## Success Metrics

### Key Performance Indicators

1. **Resolution Rate**
   - Target: 90% of flagged questions resolved within 30 days
   - Measure: Track resolution_status changes

2. **Question Quality**
   - Target: <5% of new questions require visual support
   - Measure: Automated analysis on new questions

3. **User Impact**
   - Target: No student reports of unanswerable questions
   - Measure: Support ticket tracking

4. **Admin Efficiency**
   - Target: <10 minutes per question resolution
   - Measure: Time tracking in admin interface

---

## Rollout Timeline

### Week 1: Database Setup
- [ ] Create migration for flag fields
- [ ] Create issue log table
- [ ] Run migrations on staging

### Week 2: Bulk Flagging
- [ ] Run flagging script on 107 questions
- [ ] Verify all questions flagged correctly
- [ ] Generate initial reports

### Week 3: Admin Interface
- [ ] Build FlaggedQuestionsManager component
- [ ] Add to admin panel
- [ ] Test on staging

### Week 4: Workflow Implementation
- [ ] Train content team on workflow
- [ ] Begin resolving flagged questions
- [ ] Monitor progress

### Ongoing: Maintenance
- [ ] Weekly progress reports
- [ ] Monthly quality audits
- [ ] Continuous improvement

---

## Conclusion

This flagging system provides a comprehensive approach to identifying, tracking, and resolving questions that require visual support. With 107 questions flagged from the audit, the system enables systematic resolution while maintaining question quality and student experience.

**Next Steps:**
1. Run database migrations
2. Execute flagging script
3. Build admin interface
4. Begin systematic resolution

**Estimated Effort:**
- Setup: 1 week
- Flagging: 1 day
- Admin Interface: 1 week
- Resolution: 4-6 weeks (depending on team size)
