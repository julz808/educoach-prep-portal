#!/bin/bash

# Generate all remaining questions for EduTest Scholarship (Year 7 Entry)
# This script runs section by section and reports progress

echo "════════════════════════════════════════════════════════════════════"
echo " GENERATING ALL REMAINING QUESTIONS - EDUTEST SCHOLARSHIP (YEAR 7)"
echo "════════════════════════════════════════════════════════════════════"
echo ""

# Gap analysis based on current status:
# - Verbal Reasoning: 4 needed (nearly complete!)
# - Numerical Reasoning: 2 needed (nearly complete!)
# - Mathematics: Complete
# - Reading Comprehension: Complete
# - Written Expression: Complete

MODES="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"

echo "Section 1/2: Verbal Reasoning (4 questions needed)"
echo "────────────────────────────────────────────────────────────────────"
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="EduTest Scholarship (Year 7 Entry)" \
  --section="Verbal Reasoning" \
  --modes="$MODES"

echo ""
echo "Section 2/2: Numerical Reasoning (2 questions needed) - WITH FIXES!"
echo "────────────────────────────────────────────────────────────────────"
echo "NOTE: Number Series sub-skill now shows 3 examples with guidance"
echo ""
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="EduTest Scholarship (Year 7 Entry)" \
  --section="Numerical Reasoning" \
  --modes="$MODES"

echo ""
echo "════════════════════════════════════════════════════════════════════"
echo " EDUTEST SCHOLARSHIP GENERATION COMPLETE!"
echo "════════════════════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "1. Check generation reports in docs/generation-reports/"
echo "2. Review any failures and re-run if needed"
echo "3. Generate drills once practice tests are complete"
echo ""
