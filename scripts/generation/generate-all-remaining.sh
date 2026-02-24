#!/bin/bash

# Master script to generate ALL remaining questions for ALL tests
# Total: 228 questions needed across all tests

echo "════════════════════════════════════════════════════════════════════"
echo " MASTER GENERATION SCRIPT - ALL REMAINING QUESTIONS"
echo "════════════════════════════════════════════════════════════════════"
echo ""
echo "This will generate all 228 remaining questions across 6 test products:"
echo ""
echo "  1. EduTest Scholarship (Year 7 Entry)      - 6 questions"
echo "  2. NSW Selective Entry (Year 7 Entry)      - 8 questions"
echo "  3. ACER Scholarship (Year 7 Entry)         - 30 questions"
echo "  4. Year 5 NAPLAN                           - 33 questions"
echo "  5. Year 7 NAPLAN                           - 53 questions"
echo "  6. VIC Selective Entry (Year 9 Entry)      - 98 questions"
echo ""
echo "  TOTAL:                                       228 questions"
echo ""
echo "════════════════════════════════════════════════════════════════════"
echo ""

# Ask for confirmation
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Cancelled."
    exit 1
fi

echo ""
echo "Starting generation in order of smallest to largest gaps..."
echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo ""

# 1. EduTest - smallest gap (6 questions)
echo "1/6: EduTest Scholarship (Year 7 Entry)"
echo "───────────────────────────────────────────────────────────────────"
bash scripts/generation/generate-all-edutest-scholarship.sh

# 2. NSW Selective - small gap (8 questions)
echo ""
echo "2/6: NSW Selective Entry (Year 7 Entry)"
echo "───────────────────────────────────────────────────────────────────"
bash scripts/generation/generate-all-nsw-selective.sh

# 3. ACER - medium gap (30 questions)
echo ""
echo "3/6: ACER Scholarship (Year 7 Entry)"
echo "───────────────────────────────────────────────────────────────────"
bash scripts/generation/generate-all-acer-scholarship.sh

# 4. Year 5 NAPLAN - medium gap (33 questions)
echo ""
echo "4/6: Year 5 NAPLAN"
echo "───────────────────────────────────────────────────────────────────"
bash scripts/generation/generate-all-year5-naplan.sh

# 5. Year 7 NAPLAN - large gap (53 questions)
echo ""
echo "5/6: Year 7 NAPLAN"
echo "───────────────────────────────────────────────────────────────────"
bash scripts/generation/generate-all-year7-naplan.sh

# 6. VIC Selective - largest gap (98 questions)
echo ""
echo "6/6: VIC Selective Entry (Year 9 Entry)"
echo "───────────────────────────────────────────────────────────────────"
bash scripts/generation/generate-all-vic-selective.sh

echo ""
echo "════════════════════════════════════════════════════════════════════"
echo " ALL GENERATION COMPLETE!"
echo "════════════════════════════════════════════════════════════════════"
echo ""
echo "📊 Summary:"
echo "   - Check docs/generation-reports/ for detailed reports"
echo "   - Run gap analysis to verify completion"
echo "   - Review any failures and re-run specific sections if needed"
echo ""
echo "Next steps:"
echo "   1. Verify completion with gap analysis:"
echo "      npx tsx scripts/audit/detailed-gap-analysis.ts"
echo ""
echo "   2. Generate drills once satisfied with practice tests"
echo ""
echo "════════════════════════════════════════════════════════════════════"
