# VIC Selective Entry - Reading Reasoning Sub-Skill Examples (FIXED)

**Created:** 2026-02-20
**Purpose:** Fix Issue #3 - 100% failure rate for 4 Reading Reasoning sub-skills
**Target:** Add difficulty-calibrated examples (3 levels) for problematic sub-skills

---

## Issue #3 Summary

**Failed Sub-Skills (100% failure rate):**
1. **Vocabulary (Standalone)**: 36 failures, 0 generated - DOESN'T EXIST YET
2. **Grammar & Punctuation**: 30 failures, 0 generated (called "Grammar & Sentence Structure")
3. **Idioms & Expressions**: 18 failures, 0 generated (called "Idioms & Figurative Language")
4. **Spelling & Word Usage**: 12 failures, 0 generated (called "Spelling & Word Choice")

**Root Cause:**
- Poor/missing examples in curriculumData_v2
- Unclear differentiation from similar sub-skills in other sections
- Only 2 examples per sub-skill at single difficulty level
- LLM cannot infer correct format without clear patterns

---

## Solution: Add 5-7 Examples Per Sub-skill Across 3 Difficulty Levels

Following the EduTest pattern (difficulty 1, 2, 3), I've created comprehensive examples below.

---

## SUB-SKILL 1: Vocabulary (Standalone) - NEW

**Description:** Synonym/antonym identification without passage context OR word definition selection. This tests pure vocabulary knowledge, NOT analogies or passage-based vocabulary.

**Differentiation:**
- NOT "Vocabulary in Context" (passage-based)
- NOT "Vocabulary & Synonyms/Antonyms" in General Ability - Verbal (analogies)
- Pure word knowledge: "Which word means the same as X?"

**Visual Required:** false
**LLM Appropriate:** true
**Difficulty Range:** [1, 2, 3]
**Question Format:** "Which word is most similar/opposite to [TARGET WORD]?" OR "Which word best defines [TARGET WORD]?"

### Examples

#### Difficulty 1 - Basic Vocabulary (2 examples)

```javascript
{
  difficulty: 1,
  question_text: "Which word is most similar to CHEERFUL?",
  answer_options: [
    "A: sad",
    "B: happy",
    "C: angry",
    "D: tired",
    "E: None of these"
  ],
  correct_answer: "B",
  explanation: "Cheerful and happy both mean to be in a good mood or joyful state. Sad and angry are opposite emotions, tired is unrelated.",
  distractor_strategy: "Includes opposite emotions (A, C) and unrelated state (D). Tests basic positive emotion vocabulary.",
  characteristics: [
    "Common everyday vocabulary",
    "Year 7-8 level word",
    "Clear synonym relationship",
    "Standalone question - no passage",
    "5 options including 'None of these'",
    "Single-word answers"
  ]
}
```

```javascript
{
  difficulty: 1,
  question_text: "Which word is opposite to BRIGHT?",
  answer_options: [
    "A: light",
    "B: shiny",
    "C: dim",
    "D: clear",
    "E: None of these"
  ],
  correct_answer: "C",
  explanation: "Bright and dim are antonyms. Bright means having a lot of light, dim means having little light. Options A, B, and D are all synonyms or related to brightness.",
  distractor_strategy: "Includes three synonyms/related words (light, shiny, clear) to test true understanding of antonym",
  characteristics: [
    "Basic antonym question",
    "Adjective vocabulary",
    "Multiple synonym distractors",
    "Standalone question",
    "Year 7 level"
  ]
}
```

#### Difficulty 2 - Intermediate Vocabulary (3 examples)

```javascript
{
  difficulty: 2,
  question_text: "Which word is most similar to METICULOUS?",
  answer_options: [
    "A: careless",
    "B: precise",
    "C: quick",
    "D: metric",
    "E: None of these"
  ],
  correct_answer: "B",
  explanation: "Meticulous and precise both mean showing great attention to detail and accuracy. Careless is the opposite, quick relates to speed not accuracy, and metric is a sound-alike distractor.",
  distractor_strategy: "Includes antonym (careless), unrelated quality (quick), sound-alike word (metric), tests sophisticated vocabulary",
  characteristics: [
    "Advanced Year 9 vocabulary",
    "Academic word choice",
    "Sound-alike distractor (meticulous/metric)",
    "Tests nuanced understanding",
    "Standalone question"
  ]
}
```

```javascript
{
  difficulty: 2,
  question_text: "Which word best defines ADVERSE?",
  answer_options: [
    "A: favorable",
    "B: harmful",
    "C: advertising",
    "D: different",
    "E: None of these"
  ],
  correct_answer: "B",
  explanation: "Adverse means harmful, unfavorable, or creating difficulties. Favorable is the opposite, advertising is a sound-alike, and different is unrelated to the meaning.",
  distractor_strategy: "Uses definition format. Includes antonym (favorable), sound-alike (advertising/advertise), and partial meaning (different - adverse conditions are different but not all different things are adverse)",
  characteristics: [
    "Definition-based question format",
    "Academic/formal vocabulary",
    "Sound-alike distractor",
    "Year 9 level word",
    "Tests precise meaning knowledge"
  ]
}
```

```javascript
{
  difficulty: 2,
  question_text: "Which word is opposite to DELIBERATE?",
  answer_options: [
    "A: intentional",
    "B: purposeful",
    "C: accidental",
    "D: thoughtful",
    "E: None of these"
  ],
  correct_answer: "C",
  explanation: "Deliberate means done consciously and intentionally, so the opposite is accidental (done by chance, not on purpose). Options A, B, and D are all synonyms of deliberate.",
  distractor_strategy: "Three strong synonyms (intentional, purposeful, thoughtful) test whether student truly understands the antonym relationship",
  characteristics: [
    "Antonym question",
    "Multiple synonym distractors",
    "Verb/adjective vocabulary",
    "Tests conceptual understanding",
    "Intermediate difficulty"
  ]
}
```

#### Difficulty 3 - Advanced Vocabulary (2 examples)

```javascript
{
  difficulty: 3,
  question_text: "Which word is most similar to TENACIOUS?",
  answer_options: [
    "A: temporary",
    "B: persistent",
    "C: weak",
    "D: cautious",
    "E: None of these"
  ],
  correct_answer: "B",
  explanation: "Tenacious and persistent both mean showing determination and not giving up easily. Temporary is a sound-alike distractor, weak is an antonym, and cautious is an unrelated personality trait.",
  distractor_strategy: "Sound-alike (tenacious/tenant/temporary), antonym (weak), related but distinct trait (cautious), tests sophisticated vocabulary",
  characteristics: [
    "Advanced Year 9 vocabulary",
    "Character trait word",
    "Sound-alike distractor",
    "Nuanced synonym",
    "Standalone question"
  ]
}
```

```javascript
{
  difficulty: 3,
  question_text: "Which word best defines AMBIGUOUS?",
  answer_options: [
    "A: clear",
    "B: uncertain",
    "C: ambitious",
    "D: direct",
    "E: None of these"
  ],
  correct_answer: "B",
  explanation: "Ambiguous means unclear, open to more than one interpretation, or uncertain in meaning. Clear and direct are antonyms. Ambitious is a sound-alike distractor with completely different meaning.",
  distractor_strategy: "Strong sound-alike (ambiguous/ambitious), two antonyms (clear, direct), tests ability to distinguish similar-sounding academic words",
  characteristics: [
    "High-level academic vocabulary",
    "Common SAT/selective test word",
    "Sound-alike distractor crucial",
    "Definition format",
    "Year 9 advanced level"
  ]
}
```

---

## SUB-SKILL 2: Grammar & Sentence Structure - IMPROVED

**Current Status:** Has 2 examples, but 100% failure (30 failures, 0 generated)

**Problem:** Examples exist but may not be clear enough or diverse enough

**Description:** Identifying and correcting grammatical errors in standalone sentences; understanding subject-verb agreement, verb tenses, pronoun usage, and sentence structure. These are standalone questions WITHOUT passages.

**Differentiation:**
- Standalone error identification (not passages)
- Format: "Which sentence is correct?" not "Fix this passage"
- Covers: subject-verb agreement, pronouns, verb tenses, modifiers, fragments/run-ons

**Visual Required:** false
**LLM Appropriate:** true
**Difficulty Range:** [1, 2, 3]
**Question Format:** "Which sentence is grammatically correct?" OR "Which sentence contains a grammatical error?"

### Additional Examples (Add to Existing 2)

#### Difficulty 1 - Basic Grammar (2 examples)

```javascript
{
  difficulty: 1,
  question_text: "Which sentence is grammatically correct?",
  answer_options: [
    "A: The dog and cat is sleeping.",
    "B: The dog and cat are sleeping.",
    "C: The dog and cat be sleeping.",
    "D: The dog and cat was sleeping.",
    "E: None of these"
  ],
  correct_answer: "B",
  explanation: "The compound subject 'dog and cat' is plural, so it requires the plural verb 'are', not the singular 'is' or 'was'. Option C uses incorrect verb form 'be'.",
  distractor_strategy: "Tests basic subject-verb agreement with compound subject. Options A and D use singular verbs, C uses infinitive incorrectly.",
  characteristics: [
    "Compound subject",
    "Subject-verb agreement",
    "Year 7-8 grammar",
    "Standalone sentence",
    "5 options"
  ]
}
```

```javascript
{
  difficulty: 1,
  question_text: "Which sentence is grammatically correct?",
  answer_options: [
    "A: She don't like vegetables.",
    "B: She doesn't likes vegetables.",
    "C: She doesn't like vegetables.",
    "D: She do not like vegetables.",
    "E: None of these"
  ],
  correct_answer: "C",
  explanation: "The singular subject 'she' requires 'doesn't' (does not), not 'don't' (do not). The base form 'like' follows 'doesn't', not 'likes'.",
  distractor_strategy: "Common spoken errors (A: don't instead of doesn't, B: doesn't likes double-marking, D: do not instead of does not)",
  characteristics: [
    "Subject-verb agreement with negatives",
    "Common speech vs writing errors",
    "Third person singular",
    "Basic verb forms",
    "Year 7 level"
  ]
}
```

#### Difficulty 2 - Intermediate Grammar (2 examples - Already have 2, add these for variety)

```javascript
{
  difficulty: 2,
  question_text: "Which sentence is grammatically correct?",
  answer_options: [
    "A: Each of the students have completed their homework.",
    "B: Each of the students has completed their homework.",
    "C: Each of the students have completed his homework.",
    "D: Each of the students are completing their homework.",
    "E: None of these"
  ],
  correct_answer: "B",
  explanation: "'Each' is singular, so it requires the singular verb 'has', not the plural 'have' or 'are'. The pronoun 'their' is acceptable in modern English for indefinite gender-neutral singular reference.",
  distractor_strategy: "Tests tricky subject-verb agreement where 'of the students' (plural) appears between subject 'each' (singular) and verb. Modern pronoun usage accepted.",
  characteristics: [
    "Indefinite pronoun as subject",
    "Intervening prepositional phrase",
    "Singular 'each' with plural appearance",
    "Year 9 grammar complexity",
    "Modern pronoun usage"
  ]
}
```

```javascript
{
  difficulty: 2,
  question_text: "Which sentence is grammatically correct?",
  answer_options: [
    "A: Between you and I, this is the best option.",
    "B: Between you and me, this is the best option.",
    "C: Between yourself and I, this is the best option.",
    "D: Between you and myself, this is the best option.",
    "E: None of these"
  ],
  correct_answer: "B",
  explanation: "After the preposition 'between', we need the objective case pronoun 'me', not the subjective 'I'. 'Myself' and 'yourself' are reflexive pronouns and incorrect here.",
  distractor_strategy: "Very common error (between you and I). Tests objective vs subjective pronouns and inappropriate reflexive pronoun use.",
  characteristics: [
    "Pronoun case after preposition",
    "Common hypercorrection error",
    "Objective case required",
    "Reflexive pronoun misuse",
    "Year 9 level"
  ]
}
```

#### Difficulty 3 - Advanced Grammar (3 examples)

```javascript
{
  difficulty: 3,
  question_text: "Which sentence is grammatically correct?",
  answer_options: [
    "A: The committee have made their decision.",
    "B: The committee has made its decision.",
    "C: The committee has made their decision.",
    "D: The committee were making its decision.",
    "E: None of these"
  ],
  correct_answer: "B",
  explanation: "In Australian/British English, collective nouns can be singular or plural, but verb and pronoun must agree. Using 'has' (singular) requires 'its' (singular). Both parts must match.",
  distractor_strategy: "Tests collective noun agreement and pronoun consistency. Options mix singular/plural incorrectly (C: has...their, D: were...its). A uses plural throughout (acceptable in British English but B is clearer).",
  characteristics: [
    "Collective noun subject",
    "Verb-pronoun consistency",
    "Australian English conventions",
    "Advanced agreement rules",
    "Year 9 advanced"
  ]
}
```

```javascript
{
  difficulty: 3,
  question_text: "Which sentence is grammatically correct?",
  answer_options: [
    "A: Walking down the street, the trees looked beautiful.",
    "B: Walking down the street, I saw the trees looked beautiful.",
    "C: Walking down the street, I saw that the trees looked beautiful.",
    "D: Walking down the street, the beautiful trees were seen.",
    "E: None of these"
  ],
  correct_answer: "C",
  explanation: "Option A has a dangling modifier (the trees weren't walking). Options B and D have awkward constructions. Option C correctly places the modifier next to 'I' and uses proper subordinate clause structure.",
  distractor_strategy: "Tests dangling modifiers and sentence clarity. A is classic dangling modifier, B is run-on/unclear, D uses passive voice awkwardly.",
  characteristics: [
    "Dangling modifier",
    "Participial phrase",
    "Logical subject placement",
    "Complex sentence structure",
    "Year 9 advanced writing"
  ]
}
```

```javascript
{
  difficulty: 3,
  question_text: "Which sentence is grammatically correct?",
  answer_options: [
    "A: If I was you, I would study harder.",
    "B: If I were you, I would study harder.",
    "C: If I am you, I would study harder.",
    "D: If I would be you, I would study harder.",
    "E: None of these"
  ],
  correct_answer: "B",
  explanation: "This is the subjunctive mood, used for hypothetical or contrary-to-fact conditions. The correct form is 'if I were' (not 'was', 'am', or 'would be') for conditions that are not real.",
  distractor_strategy: "Tests subjunctive mood (advanced grammar). Most students will use indicative 'was' (A) in speech. C and D show other common errors.",
  characteristics: [
    "Subjunctive mood",
    "Hypothetical condition",
    "Contrary-to-fact statement",
    "Formal grammar rule",
    "Year 9 advanced - often in selective tests"
  ]
}
```

---

## SUB-SKILL 3: Punctuation & Mechanics - IMPROVED

**Current Status:** Has 2 examples, but 100% failure (12 failures, 0 generated)

**Problem:** Need more diverse punctuation types

**Description:** Identifying correct punctuation usage including commas, apostrophes, quotation marks, semicolons, and end punctuation. Standalone questions testing punctuation rules.

**Differentiation:**
- Standalone sentences (not error correction in passages)
- Tests specific punctuation rules
- Format: "Which sentence uses punctuation correctly?"

**Visual Required:** false
**LLM Appropriate:** true
**Difficulty Range:** [1, 2, 3]
**Question Format:** "Which sentence uses punctuation correctly?"

### Additional Examples (Add to Existing 2)

#### Difficulty 1 - Basic Punctuation (2 examples)

```javascript
{
  difficulty: 1,
  question_text: "Which sentence uses punctuation correctly?",
  answer_options: [
    "A: The students books are on the desk.",
    "B: The student's books are on the desk.",
    "C: The students book's are on the desk.",
    "D: The students' book's are on the desk.",
    "E: None of these"
  ],
  correct_answer: "B",
  explanation: "'Student's' shows possession (the books belonging to one student). The plural 'books' doesn't need an apostrophe. Options A, C, and D have incorrect apostrophe placement.",
  distractor_strategy: "Tests singular possessive. Common errors: no apostrophe (A), apostrophe on plural noun (C), apostrophes in wrong places (D).",
  characteristics: [
    "Singular possessive apostrophe",
    "Distinguishing possessive from plural",
    "Common apostrophe errors",
    "Year 7-8 level",
    "Standalone sentence"
  ]
}
```

```javascript
{
  difficulty: 1,
  question_text: "Which sentence uses punctuation correctly?",
  answer_options: [
    "A: I went to the shops and I bought milk bread and eggs.",
    "B: I went to the shops, and I bought milk, bread, and eggs.",
    "C: I went to the shops and I bought milk, bread, and, eggs.",
    "D: I went to the shops, and, I bought milk bread and eggs.",
    "E: None of these"
  ],
  correct_answer: "B",
  explanation: "Commas separate items in a list (milk, bread, and eggs) and appear before 'and' joining two independent clauses. Option A lacks commas, C and D have incorrect comma placement.",
  distractor_strategy: "Tests comma in series and comma before coordinating conjunction. Shows missing commas (A) and excess/misplaced commas (C, D).",
  characteristics: [
    "Comma in series",
    "Comma before coordinating conjunction",
    "Compound sentence",
    "Year 7-8 punctuation",
    "Oxford comma used (Australian standard)"
  ]
}
```

#### Difficulty 2 - Intermediate Punctuation (2 examples - Already have 2, add for variety)

```javascript
{
  difficulty: 2,
  question_text: "Which sentence uses punctuation correctly?",
  answer_options: [
    "A: \"Where are you going?\" asked Sarah.",
    "B: \"Where are you going\" asked Sarah?",
    "C: \"Where are you going\" asked Sarah.",
    "D: Where are you going? asked Sarah.",
    "E: None of these"
  ],
  correct_answer: "A",
  explanation: "The question mark goes inside the quotation marks because it's part of the quoted question. The dialogue tag 'asked Sarah' comes after with a comma (already implied by question mark) and lowercase 'a'.",
  distractor_strategy: "Tests dialogue punctuation. B has question mark outside quotes, C missing question mark, D missing quotation marks entirely.",
  characteristics: [
    "Direct quotation",
    "Question mark placement",
    "Dialogue tag punctuation",
    "Year 8-9 level",
    "Quotation mark rules"
  ]
}
```

```javascript
{
  difficulty: 2,
  question_text: "Which sentence uses punctuation correctly?",
  answer_options: [
    "A: The girls' team won the championship their coach was very proud.",
    "B: The girls' team won the championship; their coach was very proud.",
    "C: The girls' team won the championship, their coach was very proud.",
    "D: The girls' team won the championship their coach; was very proud.",
    "E: None of these"
  ],
  correct_answer: "B",
  explanation: "A semicolon correctly joins two closely related independent clauses. Option A is a run-on sentence, C is a comma splice, and D has the semicolon in the wrong place. Also note 'girls'' is correctly plural possessive.",
  distractor_strategy: "Tests semicolon use and plural possessive apostrophe. A is run-on, C is comma splice (common error), D misplaces semicolon.",
  characteristics: [
    "Semicolon between independent clauses",
    "Avoiding comma splice",
    "Plural possessive apostrophe",
    "Year 9 level",
    "Two related complete thoughts"
  ]
}
```

#### Difficulty 3 - Advanced Punctuation (3 examples)

```javascript
{
  difficulty: 3,
  question_text: "Which sentence uses punctuation correctly?",
  answer_options: [
    "A: My sister – who lives in Sydney – is visiting next week.",
    "B: My sister, who lives in Sydney, is visiting next week.",
    "C: My sister who lives in Sydney, is visiting next week.",
    "D: My sister (who lives in Sydney) is visiting next week.",
    "E: None of these"
  ],
  correct_answer: "B",
  explanation: "The clause 'who lives in Sydney' is non-restrictive (additional information, not essential), so it requires commas. Em dashes (A) are too emphatic here, parentheses (D) downplay the information too much. Option C has only one comma.",
  distractor_strategy: "Tests restrictive vs non-restrictive clauses and punctuation choices. A and D use correct but less appropriate punctuation, C is missing second comma.",
  characteristics: [
    "Non-restrictive clause",
    "Comma pairs for parenthetical info",
    "Relative clause punctuation",
    "Nuanced punctuation choices",
    "Year 9 advanced"
  ]
}
```

```javascript
{
  difficulty: 3,
  question_text: "Which sentence uses punctuation correctly?",
  answer_options: [
    "A: The following items are required: pencils, pens, and erasers.",
    "B: The following items are required, pencils, pens, and erasers.",
    "C: The following items are required; pencils, pens, and erasers.",
    "D: The following items are required pencils, pens, and erasers.",
    "E: None of these"
  ],
  correct_answer: "A",
  explanation: "A colon introduces a list when preceded by a complete independent clause. 'The following items are required' can stand alone, so a colon is correct. Commas (B), semicolons (C), or no punctuation (D) are incorrect here.",
  distractor_strategy: "Tests colon before list. Students often use comma (B), semicolon (C), or no punctuation (D) incorrectly.",
  characteristics: [
    "Colon introducing list",
    "Complete clause before colon",
    "Formal writing punctuation",
    "Year 9 level",
    "List punctuation"
  ]
}
```

```javascript
{
  difficulty: 3,
  question_text: "Which sentence uses punctuation correctly?",
  answer_options: [
    "A: She said, \"I can't believe it's already 5 o'clock!\"",
    "B: She said, \"I cant believe its already 5 oclock\"!",
    "C: She said \"I can't believe its already 5 o'clock!\"",
    "D: She said, \"I can't believe it's already 5 o'clock!\".",
    "E: None of these"
  ],
  correct_answer: "A",
  explanation: "Multiple punctuation rules: comma before quote, 'can't' and 'it's' need apostrophes for contractions, 'o'clock' needs apostrophe, exclamation mark goes inside closing quote. Option D has period after exclamation mark (incorrect).",
  distractor_strategy: "Tests multiple apostrophes in one sentence plus quotation punctuation. B has all apostrophes removed and punctuation outside quotes, C missing comma before quote and wrong its, D has double end punctuation.",
  characteristics: [
    "Multiple apostrophes",
    "Contractions (can't, it's, o'clock)",
    "Quotation with exclamation",
    "Comma before quote",
    "Complex punctuation combination",
    "Year 9 advanced"
  ]
}
```

---

## SUB-SKILL 4: Spelling & Word Choice - IMPROVED

**Current Status:** Has 2 examples, but 100% failure (12 failures, 0 generated)

**Problem:** Need more commonly confused words and spelling patterns

**Description:** Identifying correctly spelled words and choosing appropriate words for context. Standalone spelling and vocabulary precision questions.

**Differentiation:**
- Standalone questions (not in passage context)
- Tests common misspellings and homophones
- Format: "Which word is spelled correctly?" OR "Which word fits best?"

**Visual Required:** false
**LLM Appropriate:** true
**Difficulty Range:** [1, 2, 3]
**Question Format:** "Which word is spelled correctly?" OR "Which word best completes the sentence?"

### Additional Examples (Add to Existing 2)

#### Difficulty 1 - Common Words (2 examples)

```javascript
{
  difficulty: 1,
  question_text: "Which sentence uses the correct word?",
  answer_options: [
    "A: Their going to the beach tomorrow.",
    "B: They're going to the beach tomorrow.",
    "C: There going to the beach tomorrow.",
    "D: Thier going to the beach tomorrow.",
    "E: None of these"
  ],
  correct_answer: "B",
  explanation: "'They're' is the contraction of 'they are'. 'Their' is possessive, 'there' indicates location, and 'thier' is a common misspelling of 'their'.",
  distractor_strategy: "Classic homophone test: their/they're/there. Includes common misspelling (thier). Tests Year 7-8 fundamental spelling.",
  characteristics: [
    "Homophone discrimination",
    "Their/they're/there",
    "Contraction vs possessive vs location",
    "Common misspelling included",
    "Year 7-8 level"
  ]
}
```

```javascript
{
  difficulty: 1,
  question_text: "Which word is spelled correctly?",
  answer_options: [
    "A: recieve",
    "B: recive",
    "C: receive",
    "D: receeve",
    "E: None of these"
  ],
  correct_answer: "C",
  explanation: "'Receive' follows the spelling rule 'i before e except after c'. The correct spelling is R-E-C-E-I-V-E.",
  distractor_strategy: "Common spelling error: 'i before e' rule. Shows multiple variations of common misspelling.",
  characteristics: [
    "I before E rule (exception)",
    "Common misspelling",
    "Year 7-8 spelling word",
    "Pattern-based spelling",
    "Multiple phonetic variants"
  ]
}
```

#### Difficulty 2 - Intermediate Words (2 examples - Already have 2, add for variety)

```javascript
{
  difficulty: 2,
  question_text: "Which sentence uses the correct word?",
  answer_options: [
    "A: The new policy will effect all students.",
    "B: The new policy will affect all students.",
    "C: The new policy will afect all students.",
    "D: The new policy will efect all students.",
    "E: None of these"
  ],
  correct_answer: "B",
  explanation: "'Affect' is the verb meaning to influence or change. 'Effect' is usually a noun meaning result. In this sentence, we need the verb 'affect'. Options C and D are misspellings.",
  distractor_strategy: "Affect/effect confusion - extremely common error. Includes misspellings to also test basic spelling knowledge.",
  characteristics: [
    "Affect vs effect (verb vs noun)",
    "Common word choice error",
    "Context-based selection",
    "Year 8-9 level",
    "Homophone precision"
  ]
}
```

```javascript
{
  difficulty: 2,
  question_text: "Which word is spelled correctly?",
  answer_options: [
    "A: definately",
    "B: definatly",
    "C: definitely",
    "D: definitly",
    "E: None of these"
  ],
  correct_answer: "C",
  explanation: "'Definitely' is one of the most commonly misspelled words. The correct spelling comes from 'definite' + 'ly'. Note the 'i' in the middle, not 'a'.",
  distractor_strategy: "One of the most misspelled words in English. Shows common errors: 'a' instead of 'i', missing middle 'e'. Tests Year 8-9 spelling.",
  characteristics: [
    "Frequently misspelled word",
    "Multiple common variants",
    "Adverb from adjective (definite)",
    "Year 8-9 level",
    "Spelling pattern recognition"
  ]
}
```

#### Difficulty 3 - Advanced Words (3 examples)

```javascript
{
  difficulty: 3,
  question_text: "Which sentence uses the correct word?",
  answer_options: [
    "A: The school principle addressed the assembly.",
    "B: The school principal addressed the assembly.",
    "C: The school princible addressed the assembly.",
    "D: The school principel addressed the assembly.",
    "E: None of these"
  ],
  correct_answer: "B",
  explanation: "'Principal' (with 'pal') means the head of a school. 'Principle' means a rule or belief. Memory trick: the principal is your 'pal'. Options C and D are misspellings.",
  distractor_strategy: "Principal/principle homophone (very common error). Includes misspellings. Tests both word choice and spelling precision.",
  characteristics: [
    "Principal vs principle",
    "Homophone with different meanings",
    "Professional vocabulary",
    "Memory trick applicable",
    "Year 9 level"
  ]
}
```

```javascript
{
  difficulty: 3,
  question_text: "Which word is spelled correctly?",
  answer_options: [
    "A: occassion",
    "B: ocasion",
    "C: occasion",
    "D: occassionn",
    "E: None of these"
  ],
  correct_answer: "C",
  explanation: "'Occasion' has two c's but only one s. This is a commonly misspelled word because the double c pronunciation isn't obvious.",
  distractor_strategy: "Tricky spelling: double C, single S. Students often reverse this (A) or omit letters (B) or add extras (D).",
  characteristics: [
    "Challenging spelling pattern",
    "Double vs single consonants",
    "Year 9 level word",
    "Not phonetically obvious",
    "Multiple plausible-looking variants"
  ]
}
```

```javascript
{
  difficulty: 3,
  question_text: "Which sentence uses the correct word?",
  answer_options: [
    "A: We studied the complement angles in mathematics.",
    "B: We studied the compliment angles in mathematics.",
    "C: We studied the complementary angles in mathematics.",
    "D: We studied the complimentary angles in mathematics.",
    "E: None of these"
  ],
  correct_answer: "C",
  explanation: "'Complementary' (with 'e') means completing or going together, used in mathematics for angles that add to 90°. 'Complimentary' (with 'i') means free or expressing praise.",
  distractor_strategy: "Complement/compliment confusion in academic context. Tests precise word knowledge and spelling. Options A and B use base words instead of adjectives.",
  characteristics: [
    "Complement vs compliment",
    "Technical mathematical term",
    "Homophone distinction",
    "Context-based discrimination",
    "Year 9 advanced vocabulary and spelling"
  ]
}
```

---

## SUB-SKILL 5: Idioms & Figurative Language - IMPROVED

**Current Status:** Has 2 examples, but 100% failure (18 failures, 0 generated)

**Problem:** Need more Australian idioms and clearer format consistency

**Description:** Understanding the meaning of common idioms, expressions, and figurative language. Standalone questions asking for the meaning of phrases.

**Differentiation:**
- Standalone idiom questions (not in passage context)
- Tests non-literal meaning
- Format: "What does [idiom] mean?"
- Include Australian idioms where appropriate

**Visual Required:** false
**LLM Appropriate:** true
**Difficulty Range:** [1, 2, 3]
**Question Format:** "What does the idiom/phrase mean?" OR "What is the meaning of this expression?"

### Additional Examples (Add to Existing 2)

#### Difficulty 1 - Common Everyday Idioms (2 examples)

```javascript
{
  difficulty: 1,
  question_text: "What does the idiom 'break the ice' mean?",
  answer_options: [
    "A: To break something made of ice",
    "B: To make people feel more comfortable in a social situation",
    "C: To start skating",
    "D: To destroy property",
    "E: None of these"
  ],
  correct_answer: "B",
  explanation: "'Break the ice' is an idiom meaning to make people feel more comfortable or to start a conversation in a social situation. It has nothing to do with actual ice.",
  distractor_strategy: "A is literal interpretation, C and D are unrelated meanings. Tests basic understanding of non-literal language.",
  characteristics: [
    "Very common English idiom",
    "Social interaction context",
    "Clear non-literal meaning",
    "Year 7-8 level",
    "Standalone question"
  ]
}
```

```javascript
{
  difficulty: 1,
  question_text: "What does the expression 'piece of cake' mean?",
  answer_options: [
    "A: A slice of dessert",
    "B: Something very easy",
    "C: Something delicious",
    "D: A birthday celebration",
    "E: None of these"
  ],
  correct_answer: "B",
  explanation: "'Piece of cake' is an idiom meaning something that is very easy to do. While cake is a dessert, the expression isn't about food—it's about difficulty level.",
  distractor_strategy: "A is literal interpretation, C and D are related to actual cake but wrong. Tests common everyday idiom understanding.",
  characteristics: [
    "Common idiom",
    "Difficulty/ease context",
    "Completely non-literal",
    "Year 7 level",
    "Informal expression"
  ]
}
```

#### Difficulty 2 - Intermediate Idioms (2 examples - Already have 2, add for variety including Australian)

```javascript
{
  difficulty: 2,
  question_text: "What does the idiom 'let the cat out of the bag' mean?",
  answer_options: [
    "A: To release a pet",
    "B: To reveal a secret accidentally",
    "C: To make a mess",
    "D: To be careless",
    "E: None of these"
  ],
  correct_answer: "B",
  explanation: "'Let the cat out of the bag' means to reveal a secret, usually by accident. It has nothing to do with actual cats or bags.",
  distractor_strategy: "A is literal, C and D are negative actions but not the idiom meaning. Tests medium-difficulty idiom comprehension.",
  characteristics: [
    "Common English idiom",
    "Secret/revelation context",
    "Year 8-9 level",
    "Non-literal animal reference",
    "Standalone question"
  ]
}
```

```javascript
{
  difficulty: 2,
  question_text: "What does the Australian expression 'flat out like a lizard drinking' mean?",
  answer_options: [
    "A: Very lazy",
    "B: Lying flat on the ground",
    "C: Extremely busy",
    "D: Moving very slowly",
    "E: None of these"
  ],
  correct_answer: "C",
  explanation: "This Australian idiom means extremely busy or working very hard. Despite sounding like it means lazy or slow, it actually means the opposite—being fully occupied with work.",
  distractor_strategy: "A and D are what it sounds like it might mean (lizard imagery suggests slowness). B is literal interpretation. Tests Australian cultural idiom knowledge.",
  characteristics: [
    "Australian idiom",
    "Counter-intuitive meaning",
    "Cultural expression",
    "Year 8-9 level",
    "Requires Australian context knowledge"
  ]
}
```

#### Difficulty 3 - Advanced/Literary Figurative Language (3 examples)

```javascript
{
  difficulty: 3,
  question_text: "What does the idiom 'burn the midnight oil' mean?",
  answer_options: [
    "A: To waste resources",
    "B: To work late into the night",
    "C: To start a fire",
    "D: To use old-fashioned lighting",
    "E: None of these"
  ],
  correct_answer: "B",
  explanation: "'Burn the midnight oil' means to work late into the night. It originated from the days when people used oil lamps for light. If you worked past midnight, you'd need to keep burning oil for light.",
  distractor_strategy: "A relates to burning/waste, C is literal fire, D is historical reference but wrong meaning. Tests idiom with historical origin.",
  characteristics: [
    "Historical origin idiom",
    "Work/study context",
    "Academic expression",
    "Year 9 level",
    "Figurative language"
  ]
}
```

```javascript
{
  difficulty: 3,
  question_text: "What does the expression 'devil's advocate' mean?",
  answer_options: [
    "A: An evil lawyer",
    "B: Someone who argues against an idea to test its strength",
    "C: A person who defends bad behavior",
    "D: Someone who worships evil",
    "E: None of these"
  ],
  correct_answer: "B",
  explanation: "Playing 'devil's advocate' means arguing against an idea or position—even if you don't necessarily disagree with it—in order to test how strong the argument is or to encourage debate.",
  distractor_strategy: "A is literal interpretation of words, C is partial meaning (defending something), D is literal devil reference. Tests sophisticated idiom.",
  characteristics: [
    "Sophisticated idiom",
    "Debate/argument context",
    "Latin origin (advocatus diaboli)",
    "Year 9 advanced",
    "Academic/intellectual expression"
  ]
}
```

```javascript
{
  difficulty: 3,
  question_text: "What does the Australian expression 'tall poppy syndrome' mean?",
  answer_options: [
    "A: A disease affecting flowers",
    "B: The tendency to criticize successful people",
    "C: Being very tall",
    "D: Growing plants in difficult conditions",
    "E: None of these"
  ],
  correct_answer: "B",
  explanation: "'Tall poppy syndrome' is a distinctly Australian/New Zealand cultural term referring to the tendency to criticize, resent, or cut down people who are successful or stand out. It comes from the idea of cutting down tall poppies to make all flowers the same height.",
  distractor_strategy: "A is literal plant interpretation, C relates to 'tall', D relates to plants but wrong meaning. Tests sophisticated Australian cultural idiom.",
  characteristics: [
    "Australian cultural idiom",
    "Social/cultural criticism",
    "Metaphorical expression",
    "Year 9 advanced",
    "Requires cultural knowledge",
    "Not used outside Australia/NZ"
  ]
}
```

---

## Implementation Instructions

### Step 1: Update VIC Selective Curriculum File

**File:** `src/data/curriculumData_v2/vic-selective.ts`

**Actions:**

1. **ADD NEW SUB-SKILL:** Create "Vocabulary (Standalone)" with all 7 examples above
   - Place it BEFORE "Vocabulary in Context" (around line 2255)
   - Use difficulty_range: [1, 2, 3]
   - Include all metadata and characteristics

2. **UPDATE "Grammar & Sentence Structure"** (lines 2548-2647)
   - Keep existing 2 examples (difficulty 2)
   - Add 5 new examples (2 at difficulty 1, 2 more at difficulty 2, 3 at difficulty 3)
   - Update difficulty_range to [1, 2, 3]
   - Total: 7 examples across 3 difficulty levels

3. **UPDATE "Punctuation & Mechanics"** (lines 2649-2749)
   - Keep existing 2 examples (difficulty 2)
   - Add 5 new examples (2 at difficulty 1, 2 more at difficulty 2, 3 at difficulty 3)
   - Update difficulty_range to [1, 2, 3]
   - Total: 7 examples across 3 difficulty levels

4. **UPDATE "Spelling & Word Choice"** (lines 2751-2850)
   - Keep existing 2 examples (difficulty 2)
   - Add 5 new examples (2 at difficulty 1, 2 more at difficulty 2, 3 at difficulty 3)
   - Update difficulty_range to [1, 2, 3]
   - Total: 7 examples across 3 difficulty levels

5. **UPDATE "Idioms & Figurative Language"** (lines 2852-2950)
   - Keep existing 2 examples (difficulty 2)
   - Add 5 new examples (2 at difficulty 1, 2 more at difficulty 2, 3 at difficulty 3)
   - Update difficulty_range to [1, 2, 3]
   - Include Australian idioms for cultural relevance
   - Total: 7 examples across 3 difficulty levels

### Step 2: Test Generation

After updating the curriculum file:

```bash
# Test each sub-skill individually (10 questions each)
npx tsx scripts/generation/generate-section-all-modes.ts \
  --test="VIC Selective Entry (Year 9 Entry)" \
  --section="Reading Reasoning" \
  --limit=10

# Monitor success rate for each sub-skill
# Target: >80% success rate (vs current 0%)
```

### Step 3: Full Generation

Once test generation succeeds:

```bash
# Generate all 380 missing Reading Reasoning questions
npx tsx scripts/generation/generate-section-all-modes.ts \
  --test="VIC Selective Entry (Year 9 Entry)" \
  --section="Reading Reasoning" \
  --modes="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"
```

### Step 4: Verify

```bash
# Check completion
npx tsx scripts/audit/comprehensive-v2-audit.ts | grep "Reading Reasoning"

# Expected output:
# VIC Reading Reasoning: 444/444 (100%)
# Sub-skills: All 10 sub-skills with >0 questions
```

---

## Expected Outcomes

### Before Fix
- Vocabulary (Standalone): 0 generated, 36 failures (0% success)
- Grammar & Punctuation: 0 generated, 30 failures (0% success)
- Idioms & Expressions: 0 generated, 18 failures (0% success)
- Spelling & Word Usage: 0 generated, 12 failures (0% success)
- **Total: 0 / 96 attempts successful**

### After Fix
- Vocabulary (Standalone): Should generate successfully (new sub-skill)
- Grammar & Sentence Structure: >80% success rate
- Punctuation & Mechanics: >80% success rate
- Spelling & Word Choice: >80% success rate
- Idioms & Figurative Language: >80% success rate
- **Target: 380 questions generated successfully**

---

## Key Success Factors

1. **Clear Differentiation:** Each sub-skill now clearly distinguished from similar ones
2. **Diverse Examples:** 5-7 examples per sub-skill showing clear patterns
3. **Difficulty Progression:** 3 levels (1-2-3) following EduTest model
4. **Australian Context:** Idioms include Australian expressions for cultural relevance
5. **Characteristics:** Each example lists specific characteristics for LLM to learn from
6. **Distractor Strategy:** Clear explanation of how wrong answers are constructed

---

## Notes

- VIC Selective traditionally doesn't use difficulty ratings, but adding them helps the LLM understand progression
- The difficulty levels (1-3) can all be mapped to VIC's standard difficulty marker of 2 during generation
- Australian idioms added for cultural authenticity (flat out like a lizard drinking, tall poppy syndrome)
- Grammar examples include modern usage (singular they) while maintaining grammatical correctness
- All examples follow the 5-option format (A-E) including "None of these" as standard VIC pattern

---

**Status:** Ready for Implementation
**Priority:** P1 (High) - Unblocks 380 questions (28% of VIC Selective total)
**Estimated Impact:** Increase VIC Selective completion from 60.3% to 86.1%
