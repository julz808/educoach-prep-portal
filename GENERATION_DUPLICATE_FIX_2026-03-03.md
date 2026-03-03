# Generation Duplicate Issue - Fixed 2026-03-03

## Problem

The VIC Selective "Number Grids & Matrices" generation was repeatedly failing with duplicate detection errors:

```
❌ Validation failed: Duplicate detected: Exact duplicate - identical question text word-for-word
❌ Validation failed: Duplicate detected: Duplicate - same numbers (56, 58, 60, 62...) used in similar calculation
```

### Root Causes

1. **Example Saturation** - Only 4 curriculum examples for 102+ existing questions (25.5 questions per example template)
2. **Pattern Exhaustion** - AI was repeating number combinations and question structures
3. **Insufficient Creative Guidance** - The AI was treating examples as templates to follow closely rather than style guides

## Solution Implemented

### 1. Expanded Curriculum Examples (4 → 8 examples)

Added 4 new diverse pattern types to `src/data/curriculumData_v2/vic-selective.ts`:

- **Multiplication pattern**: Each row multiplies by constant (3 × 3 = 9, 9 × 3 = 27)
- **Division pattern**: Each row divides by 2, working backwards to find missing value
- **Independent column patterns**: Each column has different increment (+2, +5, +11)
- **Row-sum relationship**: Third column = sum of first two (7 + 8 = 15)

**Result**: Doubled the variety of pattern types available to the AI

### 2. Enhanced Prompt Builder - Creative Freedom Emphasis

Modified `src/engines/questionGeneration/v2/promptBuilder.ts`:

#### Main Prompt Changes (lines 100-121)
```typescript
🎯 EXAMPLES — These show STYLE, FORMAT, and DIFFICULTY LEVEL only:

⚠️ IMPORTANT: Examples are GUIDES, not templates to copy!
- DO NOT replicate the numbers, patterns, or specific mathematical relationships from examples
- DO NOT reuse similar scenarios or contexts
- DO feel free to create MORE CHALLENGING patterns (as long as they're logically solvable)
- DO use completely different number ranges, operations, and mathematical relationships
- The examples show the PRESENTATION STYLE and ANSWER FORMAT — your mathematical content must be original

CREATIVE FREEDOM: With {N} existing questions in this sub-skill, you MUST innovate:
- Use fresh number combinations never seen in existing questions
- Experiment with different mathematical operations and relationships
- Try more complex (but solvable) patterns that Year 9 students can figure out
- Vary the position of the missing value
- Challenge students while keeping problems logically discoverable
```

#### Grid-Specific Guidance (lines 763-819)
```typescript
🎨 GRID PATTERN GUIDANCE - CREATIVE FREEDOM WITH LOGICAL RIGOR:

⚠️ CRITICAL: The examples above are STYLE GUIDES ONLY, showing format and difficulty level.
DO NOT feel constrained to use similar patterns or number ranges to the examples!

PATTERN VARIETY (choose different patterns from examples):
- Addition patterns: constant increment per row/column (e.g., +3, +5, +7)
- Subtraction patterns: decreasing sequences
- Multiplication patterns: each cell = previous × constant (e.g., ×2, ×3)
- Division patterns: each cell = previous ÷ constant (e.g., ÷2)
- Row/column relationships: third column = sum of first two (e.g., 7 + 8 = 15)
- Mixed operations: rows use addition, columns use different increment
- Varying increments: +2, +4, +6 progression or -5, -3, -1 pattern
- Cross-grid patterns: diagonals follow different rules than rows/columns

NUMBER RANGE VARIETY:
- Use DIFFERENT number ranges from the examples: 1-20, 20-50, 50-100, or even 100-200
- Mix odd and even numbers creatively
- Try prime numbers, multiples of specific numbers, or square numbers
- Don't avoid larger numbers - Year 9 students can handle 2-digit and 3-digit arithmetic

COMPLEXITY LEVELS (all must be logically solvable):
- Simple: One consistent operation across all rows/columns
- Moderate: Different operations in rows vs columns (rows: +3, columns: ×2)
- Advanced: Varying increments or alternating patterns (first row +2, second row +3, third row +4)
- Challenge: Relationships between cells (cell = sum/product of adjacent cells)

MANDATORY REQUIREMENTS:
✓ The pattern MUST be discoverable from the given information
✓ Only ONE answer should be correct - test this by working through your solution
✓ The solution must show clear, logical steps to reach the answer
✓ Avoid ambiguous patterns where multiple rules could apply
✓ The grid should have sufficient complete rows/columns to establish the pattern (at least 2)
```

## Results

### Before Fix
- **Success Rate**: ~0% (failing after 3 attempts with duplicates)
- **Error Pattern**: Identical question text or same number combinations
- **Temperature Escalation**: Had to increase to 0.9 and 1.0, still failed

### After Fix
- **Success Rate**: 100% (3/3 questions generated on first attempt)
- **Quality Scores**: 100/100 on all questions
- **Average Cost**: $0.02 per question
- **Average Time**: 9.6 seconds per question

### Example Generated Question

**Before**: Would generate variations like "14, 16, 18 / 16, 18, 20 / 18, 20, ?" (exact duplicate)

**After**: Generated this unique question:
```
72    66    60
68    62    56
64    ?     52
```
- Uses larger number range (52-72)
- Dual pattern (rows -6, columns -4)
- Different missing value position
- More complex but logically solvable

## Key Insights

1. **Examples as Templates vs Guides**: The AI was treating curriculum examples as strict templates. Explicitly stating they are "style guides only" with permission to innovate was crucial.

2. **Creative Permission**: Adding "DO feel free to create MORE CHALLENGING patterns (as long as they're logically solvable)" gave the AI license to explore beyond the examples.

3. **Saturation Detection**: With 100+ existing questions, showing the count (`With {N} existing questions...`) made the AI aware it needed extra creativity.

4. **Pattern Variety List**: Providing explicit alternative pattern types (multiplication, division, row-sums, etc.) gave the AI concrete alternatives to explore.

5. **Number Range Freedom**: Explicitly stating "use DIFFERENT number ranges" and "don't avoid larger numbers" freed the AI from clustering around small numbers.

## Application to Other Subskills

This fix pattern can be applied to any subskill experiencing duplicate issues:

1. **Expand curriculum examples** with diverse pattern types
2. **Add creative freedom guidance** emphasizing examples are style guides
3. **List alternative approaches** explicitly (pattern types, number ranges, positions)
4. **Include saturation awareness** (show count of existing questions)
5. **Emphasize logical solvability** while encouraging complexity

## Files Modified

1. `src/data/curriculumData_v2/vic-selective.ts` - Added 4 new examples (lines 235-314)
2. `src/engines/questionGeneration/v2/promptBuilder.ts` - Enhanced creative guidance (lines 100-121, 763-819)

## Verification

```bash
# Test generation - all completed successfully
npx tsx scripts/generation/generate-section-all-modes.ts \
  --test="VIC Selective Entry (Year 9 Entry)" \
  --section="General Ability - Quantitative" \
  --modes="practice_3,practice_4,diagnostic"

# Results: 3/3 questions generated (100% success rate, 100/100 quality)
```
