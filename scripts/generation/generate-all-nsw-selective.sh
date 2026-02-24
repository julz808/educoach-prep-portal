#!/bin/bash

# Generate all remaining questions for NSW Selective Entry (Year 7 Entry)
# This script runs section by section and reports progress

echo "════════════════════════════════════════════════════════════════════"
echo " GENERATING ALL REMAINING QUESTIONS - NSW SELECTIVE ENTRY (YEAR 7)"
echo "════════════════════════════════════════════════════════════════════"
echo ""

# Gap analysis based on current status:
# - Reading: 1 needed (nearly complete!)
# - Mathematical Reasoning: 2 needed
# - Thinking Skills: 5 needed
# - Writing: Complete (over-generated)

MODES="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"

echo "Section 1/3: Reading (1 question needed)"
echo "────────────────────────────────────────────────────────────────────"
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="NSW Selective Entry (Year 7 Entry)" \
  --section="Reading" \
  --modes="$MODES"

echo ""
echo "Section 2/3: Mathematical Reasoning (2 questions needed)"
echo "────────────────────────────────────────────────────────────────────"
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="NSW Selective Entry (Year 7 Entry)" \
  --section="Mathematical Reasoning" \
  --modes="$MODES"

echo ""
echo "Section 3/3: Thinking Skills (5 questions needed)"
echo "────────────────────────────────────────────────────────────────────"
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="NSW Selective Entry (Year 7 Entry)" \
  --section="Thinking Skills" \
  --modes="$MODES"

echo ""
echo "════════════════════════════════════════════════════════════════════"
echo " NSW SELECTIVE GENERATION COMPLETE!"
echo "════════════════════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "1. Check generation reports in docs/generation-reports/"
echo "2. Review any failures and re-run if needed"
echo "3. Generate drills once practice tests are complete"
echo ""
