#!/bin/bash

# Generate all remaining questions for VIC Selective Entry (Year 9 Entry)
# This script runs section by section and reports progress

echo "════════════════════════════════════════════════════════════════════"
echo " GENERATING ALL REMAINING QUESTIONS - VIC SELECTIVE ENTRY (YEAR 9)"
echo "════════════════════════════════════════════════════════════════════"
echo ""

# Gap analysis based on current status:
# - Reading Reasoning: 69 needed (BIGGEST GAP)
# - Mathematics Reasoning: 9 needed
# - General Ability - Verbal: 13 needed
# - General Ability - Quantitative: 7 needed
# - Writing: Complete (over-generated)

MODES="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"

echo "Section 1/4: Reading Reasoning (69 questions needed)"
echo "────────────────────────────────────────────────────────────────────"
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="VIC Selective Entry (Year 9 Entry)" \
  --section="Reading Reasoning" \
  --modes="$MODES"

echo ""
echo "Section 2/4: Mathematics Reasoning (9 questions needed)"
echo "────────────────────────────────────────────────────────────────────"
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="VIC Selective Entry (Year 9 Entry)" \
  --section="Mathematics Reasoning" \
  --modes="$MODES"

echo ""
echo "Section 3/4: General Ability - Verbal (13 questions needed)"
echo "────────────────────────────────────────────────────────────────────"
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="VIC Selective Entry (Year 9 Entry)" \
  --section="General Ability - Verbal" \
  --modes="$MODES"

echo ""
echo "Section 4/4: General Ability - Quantitative (7 questions needed)"
echo "────────────────────────────────────────────────────────────────────"
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="VIC Selective Entry (Year 9 Entry)" \
  --section="General Ability - Quantitative" \
  --modes="$MODES"

echo ""
echo "════════════════════════════════════════════════════════════════════"
echo " VIC SELECTIVE GENERATION COMPLETE!"
echo "════════════════════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "1. Check generation reports in docs/generation-reports/"
echo "2. Review any failures and re-run if needed"
echo "3. Generate drills once practice tests are complete"
echo ""
