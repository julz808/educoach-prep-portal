#!/bin/bash

# Generate all remaining questions for Year 7 NAPLAN
# This script runs section by section and reports progress

echo "════════════════════════════════════════════════════════════════════"
echo " GENERATING ALL REMAINING QUESTIONS - YEAR 7 NAPLAN"
echo "════════════════════════════════════════════════════════════════════"
echo ""

# Gap analysis based on current status:
# - Reading: 43 needed
# - Language Conventions: 5 needed
# - Numeracy Calculator: 5 needed
# - Numeracy No Calculator: Complete
# - Writing: Complete (over-generated)

MODES="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"

echo "Section 1/3: Reading (43 questions needed)"
echo "────────────────────────────────────────────────────────────────────"
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="Year 7 NAPLAN" \
  --section="Reading" \
  --modes="$MODES"

echo ""
echo "Section 2/3: Language Conventions (5 questions needed)"
echo "────────────────────────────────────────────────────────────────────"
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="Year 7 NAPLAN" \
  --section="Language Conventions" \
  --modes="$MODES"

echo ""
echo "Section 3/3: Numeracy Calculator (5 questions needed)"
echo "────────────────────────────────────────────────────────────────────"
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="Year 7 NAPLAN" \
  --section="Numeracy Calculator" \
  --modes="$MODES"

echo ""
echo "════════════════════════════════════════════════════════════════════"
echo " YEAR 7 NAPLAN GENERATION COMPLETE!"
echo "════════════════════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "1. Check generation reports in docs/generation-reports/"
echo "2. Review any failures and re-run if needed"
echo "3. Generate drills once practice tests are complete"
echo ""
