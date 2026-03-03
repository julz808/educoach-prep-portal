#!/bin/bash

# Script to migrate all services to use questions_v2 table consistently

echo "🔧 Migrating all services to use QUESTIONS_TABLE variable"

# List of service files to update
files=(
  "src/services/writingAssessmentService.ts"
  "src/services/drillRecommendationService.ts"
  "src/services/dashboardService.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "📝 Processing $file"

    # Check if file already has QUESTIONS_TABLE constant
    if grep -q "const QUESTIONS_TABLE" "$file"; then
      echo "   ✓ Already has QUESTIONS_TABLE constant"
    else
      # Add the constant after the first import statement
      sed -i '' "1a\\
\\
// CRITICAL: Use the same questions table as test loading\\
const USE_V2_QUESTIONS = import.meta.env.VITE_USE_V2_QUESTIONS === 'true';\\
const QUESTIONS_TABLE = USE_V2_QUESTIONS ? 'questions_v2' : 'questions';
" "$file"
      echo "   ✓ Added QUESTIONS_TABLE constant"
    fi

    # Replace .from('questions') with .from(QUESTIONS_TABLE)
    count=$(grep -c "\.from('questions')" "$file" || echo "0")
    if [ "$count" -gt 0 ]; then
      sed -i '' "s/.from('questions')/.from(QUESTIONS_TABLE)/g" "$file"
      echo "   ✓ Replaced $count occurrences"
    else
      echo "   ✓ No replacements needed"
    fi
  else
    echo "   ⚠️  File not found: $file"
  fi
done

echo ""
echo "✅ Migration complete!"
