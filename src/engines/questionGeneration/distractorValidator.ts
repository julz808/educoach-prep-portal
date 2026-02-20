/**
 * DISTRACTOR VALIDATION SYSTEM
 *
 * Verifies that each wrong answer option is:
 * 1. Plausible enough that students might choose it
 * 2. Definitively wrong (no ambiguity)
 * 3. Based on realistic student errors
 *
 * Usage:
 * - Basic validation (free): checks for obvious issues
 * - Expensive validation (costs ~$0.015/question): independently verifies each distractor with Claude API
 */

import { callClaudeAPIWithRetry } from './claudePrompts';

export interface DistractorValidationResult {
  allDistractorsValid: boolean;
  problematicDistractors: {
    optionLetter: string;
    optionText: string;
    issue: string;
  }[];
  validationDetails: {
    optionLetter: string;
    isValid: boolean;
    reasoning: string;
  }[];
}

/**
 * Verify all distractors (wrong answers) are definitively wrong
 *
 * @param questionData - The generated question
 * @param enableExpensiveCheck - If true, verifies ALL distractors independently (slower/costlier)
 *                               If false, only does basic checks
 */
export async function validateDistractors(
  questionData: any,
  enableExpensiveCheck: boolean = false
): Promise<DistractorValidationResult> {
  const { question_text, answer_options, correct_answer } = questionData;

  // Basic validation first (fast, free)
  const basicCheck = performBasicDistractorChecks(questionData);
  if (!basicCheck.allValid) {
    return {
      allDistractorsValid: false,
      problematicDistractors: basicCheck.issues,
      validationDetails: []
    };
  }

  // If expensive check disabled, stop here
  if (!enableExpensiveCheck) {
    return {
      allDistractorsValid: true,
      problematicDistractors: [],
      validationDetails: []
    };
  }

  // Expensive check: Independently verify each distractor
  return await performIndependentDistractorValidation(questionData);
}

/**
 * Basic distractor checks (fast, no API calls)
 */
function performBasicDistractorChecks(questionData: any): {
  allValid: boolean;
  issues: Array<{ optionLetter: string; optionText: string; issue: string }>;
} {
  const { answer_options, correct_answer } = questionData;
  const issues: Array<{ optionLetter: string; optionText: string; issue: string }> = [];

  if (!answer_options || !Array.isArray(answer_options)) {
    return { allValid: true, issues: [] }; // Not a multiple choice question
  }

  // Find correct answer index
  const correctIndex = answer_options.findIndex((opt: string) => {
    const optText = opt.replace(/^[A-D]\)\s*/, '').trim();
    const corrText = correct_answer.replace(/^[A-D]\)\s*/, '').trim();
    return optText === corrText || opt.startsWith(correct_answer);
  });

  if (correctIndex === -1) {
    issues.push({
      optionLetter: 'SYSTEM',
      optionText: correct_answer,
      issue: 'Correct answer not found in options'
    });
    return { allValid: false, issues };
  }

  // Check each distractor
  answer_options.forEach((option: string, index: number) => {
    if (index === correctIndex) return; // Skip correct answer

    const optionLetter = String.fromCharCode(65 + index); // A, B, C, D
    const optionText = option.replace(/^[A-D]\)\s*/, '').trim();

    // Check 1: Is distractor too similar to correct answer?
    const correctText = answer_options[correctIndex].replace(/^[A-D]\)\s*/, '').trim();
    if (optionText.toLowerCase() === correctText.toLowerCase()) {
      issues.push({
        optionLetter,
        optionText,
        issue: 'Distractor identical to correct answer'
      });
    }

    // Check 2: Is distractor empty or too short?
    if (optionText.length < 2) {
      issues.push({
        optionLetter,
        optionText,
        issue: 'Distractor too short or empty'
      });
    }

    // Check 3: Is distractor a placeholder?
    const placeholders = ['todo', 'tbd', 'xxx', '???', 'placeholder', 'example', 'sample'];
    if (placeholders.some(ph => optionText.toLowerCase().includes(ph))) {
      issues.push({
        optionLetter,
        optionText,
        issue: 'Distractor contains placeholder text'
      });
    }

    // Check 4: Are distractors duplicated?
    for (let j = index + 1; j < answer_options.length; j++) {
      const otherText = answer_options[j].replace(/^[A-D]\)\s*/, '').trim();
      if (optionText.toLowerCase() === otherText.toLowerCase()) {
        issues.push({
          optionLetter,
          optionText,
          issue: `Duplicate of option ${String.fromCharCode(65 + j)}`
        });
      }
    }
  });

  return {
    allValid: issues.length === 0,
    issues
  };
}

/**
 * Independent verification of each distractor using Claude API
 * EXPENSIVE: Makes 1 API call per distractor (3-4 calls per question)
 * Cost: ~$0.004 per distractor = ~$0.015 per question
 */
async function performIndependentDistractorValidation(
  questionData: any
): Promise<DistractorValidationResult> {
  const { question_text, answer_options, correct_answer } = questionData;

  // Find correct answer index
  const correctIndex = answer_options.findIndex((opt: string) => {
    const optText = opt.replace(/^[A-D]\)\s*/, '').trim();
    return opt.startsWith(correct_answer) || optText === correct_answer;
  });

  if (correctIndex === -1) {
    return {
      allDistractorsValid: false,
      problematicDistractors: [{
        optionLetter: 'SYSTEM',
        optionText: correct_answer,
        issue: 'Correct answer not found in options'
      }],
      validationDetails: []
    };
  }

  const validationDetails: Array<{
    optionLetter: string;
    isValid: boolean;
    reasoning: string;
  }> = [];

  const problematicDistractors: Array<{
    optionLetter: string;
    optionText: string;
    issue: string;
  }> = [];

  // Check each distractor independently
  for (let i = 0; i < answer_options.length; i++) {
    if (i === correctIndex) continue; // Skip correct answer

    const optionLetter = String.fromCharCode(65 + i);
    const optionText = answer_options[i].replace(/^[A-D]\)\s*/, '').trim();

    // Build verification prompt
    const verificationPrompt = `You are analyzing whether an answer option is ambiguous or problematic.

QUESTION: ${question_text}

ALL OPTIONS:
${answer_options.map((opt: string, idx: number) => `${String.fromCharCode(65 + idx)}) ${opt.replace(/^[A-D]\)\s*/, '')}`).join('\n')}

STATED CORRECT ANSWER: ${correct_answer}

OPTION TO CHECK: ${optionLetter}) ${optionText}

YOUR TASK:
Determine if option ${optionLetter} could be defended as potentially correct or partially correct by a knowledgeable person.

CONSIDER:
1. Is it definitively wrong, or could it be correct under some interpretation?
2. Could a reasonable student defend this answer with valid reasoning?
3. Is it wrong only due to very specific wording in the question?
4. Does it represent a common but clearly incorrect student misconception?

IMPORTANT: We want distractors that are:
- Plausible (students might choose them)
- But definitively wrong (no valid interpretation makes them correct)
- Based on realistic student errors

RETURN ONLY THIS JSON:
{
  "is_ambiguous": true/false,
  "reasoning": "One clear sentence explaining your assessment",
  "severity": "critical/moderate/minor/none"
}

SEVERITY DEFINITIONS:
- critical: This option could legitimately be considered correct (REJECT QUESTION)
- moderate: A knowledgeable person could argue for this with effort (REJECT QUESTION)
- minor: Only very confused students might think this is correct (OK)
- none: This is clearly and definitively wrong, represents common error (GOOD)`;

    try {
      const response = await callClaudeAPIWithRetry(verificationPrompt);
      const textContent = response.content?.[0]?.text || '';
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);

        validationDetails.push({
          optionLetter,
          isValid: !result.is_ambiguous && !['critical', 'moderate'].includes(result.severity),
          reasoning: result.reasoning
        });

        // If ambiguous or critical/moderate severity, mark as problematic
        if (result.is_ambiguous === true || ['critical', 'moderate'].includes(result.severity)) {
          problematicDistractors.push({
            optionLetter,
            optionText,
            issue: `${result.severity}: ${result.reasoning}`
          });
        }
      } else {
        console.error(`Could not parse distractor validation response for ${optionLetter}`);
        // Couldn't parse - mark as problematic to be safe
        problematicDistractors.push({
          optionLetter,
          optionText,
          issue: 'Validation failed - could not parse response'
        });
      }
    } catch (error) {
      console.error(`Error validating distractor ${optionLetter}:`, error);
      // On error, mark as problematic to be safe
      problematicDistractors.push({
        optionLetter,
        optionText,
        issue: `Validation error: ${error instanceof Error ? error.message : 'Unknown'}`
      });
    }

    // Small delay between API calls to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return {
    allDistractorsValid: problematicDistractors.length === 0,
    problematicDistractors,
    validationDetails
  };
}
