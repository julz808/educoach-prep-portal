#!/bin/bash

# Generate all remaining questions for ACER Scholarship (Year 7 Entry)
# This script runs section by section and reports progress

echo "════════════════════════════════════════════════════════════════════"
echo " GENERATING ALL REMAINING QUESTIONS - ACER SCHOLARSHIP (YEAR 7)"
echo "════════════════════════════════════════════════════════════════════"
echo ""

# Gap analysis based on current status:
# - Humanities: 25 needed
# - Mathematics: 5 needed
# - Written Expression: Complete (over-generated)

MODES="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"

echo "Section 1/2: Humanities (25 questions needed)"
echo "────────────────────────────────────────────────────────────────────"
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="ACER Scholarship (Year 7 Entry)" \
  --section="Humanities" \
  --modes="$MODES"

echo ""
echo "Section 2/2: Mathematics (5 questions needed)"
echo "────────────────────────────────────────────────────────────────────"
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="ACER Scholarship (Year 7 Entry)" \
  --section="Mathematics" \
  --modes="$MODES"

echo ""
echo "════════════════════════════════════════════════════════════════════"
echo " ACER SCHOLARSHIP GENERATION COMPLETE!"
echo "════════════════════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "1. Check generation reports in docs/generation-reports/"
echo "2. Review any failures and re-run if needed"
echo "3. Generate drills once practice tests are complete"
echo ""
