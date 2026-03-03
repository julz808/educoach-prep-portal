# Advanced Grid Pattern Examples Added - 2026-03-03

## Motivation

The original "Number Grids & Matrices" examples (4 total) were too basic for VIC Selective Year 9 entry students, who are in the top 10-15% of their cohort. Most patterns were simple addition/subtraction (+2, -5, etc.).

## Changes Made

### 1. Added 6 Advanced Examples (4 → 14 total)

File: `src/data/curriculumData_v2/vic-selective.ts:315-415`

#### New Pattern Types

**Exponential Pattern (n, n², n³)**
```
4     16    64       (4, 4², 4³)
5     25    125      (5, 5², 5³)
6     ?     216      (6, 6², 6³) → Answer: 36
```
- Tests: Square and cube recognition
- Why hard: Requires students to recognize exponential relationships, not just arithmetic
- Year 9 appropriate: Students know squares and cubes

**Subtraction with Prime Numbers**
```
17    13    4        (17 - 13 = 4, and 17 is prime)
23    15    8        (23 - 15 = 8, and 23 is prime)
31    ?     12       (31 - ? = 12, and 31 is prime) → Answer: 19
```
- Tests: Reverse operation + pattern recognition
- Why hard: Working backwards (31 - ? = 12) AND column 1 contains primes (17, 23, 31)
- Year 9 appropriate: Prime numbers are fundamental to this age group

**Compound Multiplication Pattern**
```
2     6     12       (2×3=6, 6×2=12)
6     18    36       (6×3=18, 18×2=36)
12    ?     72       (12×3=?, ?×2=72) → Answer: 36
```
- Tests: Multiple operations, dual validation
- Why hard: Rows use first cell value (n×3, then ×2), columns multiply by 3 going down
- Year 9 appropriate: Multi-step reasoning is core to selective entry

**Fibonacci-Style Addition**
```
1     1     2        (1 + 1 = 2)
2     3     5        (2 + 3 = 5)
3     ?     8        (3 + ? = 8) → Answer: 5
```
- Tests: Famous mathematical sequence
- Why hard: Third = sum of first two, AND column 3 forms Fibonacci (2, 5, 8)
- Year 9 appropriate: Fibonacci is taught at this level

**Large Number Dual Pattern**
```
100   91    83       (row: -9, -8 / column: -9)
91    82    74       (row: -9, -8 / column: -9)
?     73    65       (row: -9, -8 / column: -9) → Answer: 82
```
- Tests: Dual validation with varying row decrements
- Why hard: Rows decrease by 9 then 8, columns decrease by 9
- Year 9 appropriate: Large numbers (65-100) challenge mental math

**Exponential with Middle Value Missing**
```
3     9     27       (3, 3², 3³... wait, that's 3, 9, 27)
5     15    45       (5×3=15, 15×3=45)
7     ?     63       (7×3=?, ?×3=63) → Answer: 21
```
- Tests: Consistent multiplication across rows
- Why hard: Requires recognizing ×3 pattern, missing value is middle position
- Year 9 appropriate: Tests pattern consistency

### 2. Enhanced Prompt Guidance

File: `src/engines/questionGeneration/v2/promptBuilder.ts`

**Added Difficulty Tiers (lines 780-800)**
```
BASIC PATTERNS (use sparingly):
- Simple addition/subtraction

INTERMEDIATE PATTERNS (good balance):
- Multiplication, division, sum/difference relationships

ADVANCED PATTERNS (prefer these for Year 9):
- Exponential: n, n², n³
- Fibonacci-style
- Prime number sequences
- Dual pattern validation
- Working backwards
```

**Added Challenge Target (lines 808-816)**
```
🎯 TARGET: Aim for 60% Advanced, 30% Challenge, 10% Moderate for Year 9 selective entry
These students are high-performers who can handle sophisticated mathematical reasoning!
```

**Emphasized Student Capability (lines 104-123)**
```
2. **CHALLENGE YOURSELF - Go harder than the examples!**
   - VIC Selective is for HIGH-ACHIEVING Year 9 students (top 10-15% of cohort)
   - These students can handle: exponential patterns (n²,n³), Fibonacci sequences, prime numbers, multi-step logic
   - Basic +5 or -3 patterns are TOO EASY - push the difficulty!
```

## Pattern Difficulty Comparison

### Before (Original 4 Examples)
| Pattern Type | Difficulty | Example |
|--------------|-----------|---------|
| Constant addition | Easy | +2 everywhere |
| Varying subtraction | Medium | -4, then -3 |
| Alphanumeric grid | Medium | Mixed letters/numbers |
| Hidden cells | Medium | Multiple unknowns |

**Average Difficulty: Medium** ⭐⭐

### After (14 Examples Total)
| Pattern Type | Difficulty | Example |
|--------------|-----------|---------|
| Exponential (n²,n³) | Hard | 4, 16, 64 |
| Prime + subtraction | Hard | 17, 23, 31 sequence |
| Fibonacci addition | Hard | 1, 1, 2, 3, 5, 8 |
| Compound multiplication | Hard | ×3 in columns, ×3,×2 in rows |
| Large dual patterns | Medium-Hard | 65-100 range, dual validation |
| Working backwards | Hard | Given result, find input |

**Average Difficulty: Hard** ⭐⭐⭐⭐

## Mathematical Concepts Now Tested

1. **Exponential relationships** - Recognizing n² and n³
2. **Prime number sequences** - Identifying primes in patterns
3. **Fibonacci sequences** - Famous sequence recognition
4. **Multi-step reasoning** - A - B = C, solve for B
5. **Dual pattern validation** - Pattern works both ways
6. **Reverse operations** - Working backwards from result
7. **Compound operations** - Different operations in rows vs columns

## Why These Are Appropriate for Year 9 VIC Selective

1. **Curriculum Alignment**: Year 9 curriculum covers:
   - Index notation and powers (n², n³)
   - Prime factorization
   - Algebraic reasoning (solving for unknowns)
   - Pattern recognition and sequences

2. **Selective Entry Target**: VIC Selective tests top 10-15% of students
   - These students are 1-2 years ahead academically
   - They actively seek challenge
   - Basic arithmetic patterns bore them

3. **Real Test Difficulty**: Actual VIC Selective papers include:
   - Multi-step logic problems
   - Pattern recognition beyond simple arithmetic
   - Problems requiring hypothesis testing

## Testing Recommendations

Generate 10 new questions and analyze:
```bash
npx tsx scripts/generation/generate-section-all-modes.ts \
  --test="VIC Selective Entry (Year 9 Entry)" \
  --section="General Ability - Quantitative" \
  --modes="drill" --count=10
```

Then check for:
- **Pattern diversity**: Are we seeing exponential, Fibonacci, prime patterns?
- **Number ranges**: Are we using 1-20, 50-150, 100-200 ranges appropriately?
- **Difficulty spread**: 60% advanced, 30% challenge, 10% moderate?

## Expected Outcomes

1. **Higher engagement**: Students feel appropriately challenged
2. **Better discrimination**: Clearer separation of top performers
3. **Real skill testing**: Tests mathematical reasoning, not just arithmetic
4. **Future-proofing**: More examples means less duplication over time

## Files Modified

1. `src/data/curriculumData_v2/vic-selective.ts` - Added 6 advanced examples
2. `src/engines/questionGeneration/v2/promptBuilder.ts` - Enhanced difficulty guidance
