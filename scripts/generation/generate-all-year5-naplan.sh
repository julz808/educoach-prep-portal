#!/bin/bash

# Generate all remaining questions for Year 5 NAPLAN
# This script runs section by section and reports progress

echo "════════════════════════════════════════════════════════════════════"
echo " GENERATING ALL REMAINING QUESTIONS - YEAR 5 NAPLAN"
echo "════════════════════════════════════════════════════════════════════"
echo ""

# Gap analysis based on current status:
# - Reading: 18 needed
# - Language Conventions: 15 needed
# - Numeracy: Complete
# - Writing: Complete (over-generated)

MODES="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"

echo "Section 1/2: Reading (18 questions needed)"
echo "────────────────────────────────────────────────────────────────────"
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="Year 5 NAPLAN" \
  --section="Reading" \
  --modes="$MODES"

echo ""
echo "Section 2/2: Language Conventions (15 questions needed) - WITH FIXES!"
echo "────────────────────────────────────────────────────────────────────"
echo "NOTE: Punctuation sub-skill now has improved examples and guidance"
echo ""
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="Year 5 NAPLAN" \
  --section="Language Conventions" \
  --modes="$MODES"

echo ""
echo "════════════════════════════════════════════════════════════════════"
echo " YEAR 5 NAPLAN GENERATION COMPLETE!"
echo "════════════════════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "1. Check generation reports in docs/generation-reports/"
echo "2. Review any failures and re-run if needed"
echo "3. Generate drills once practice tests are complete"
echo ""
