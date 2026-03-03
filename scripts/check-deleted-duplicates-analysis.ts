import * as fs from 'fs';

// This analyzes what was deleted based on the fix script output
// Looking at the groups that were identified

const deletedGroups = [
  { key: "what_does_mean:meticulous:null", count: 2, note: "null passage_id" },
  { key: "what_does_mean:improvise:null", count: 2, note: "null passage_id" },
  { key: "what_does_mean:treacherous:null", count: 2, note: "null passage_id" },
  { key: "what_does_mean:unobtrusive:null", count: 2, note: "null passage_id" },
  { key: "what_does_mean:ethereal:2fe31c2b-9ac3-4054-92ba-90b93d02ac23", count: 2, note: "SAME passage" },
  { key: "what_does_mean:modest:66496cb3-e75b-4845-a3d1-abe59bdf962a", count: 2, note: "SAME passage" },
  { key: "which sentence best combines...", count: 3, note: "grammar question" },
  { key: "what_does_mean:obsolete:658dfac8-2294-4119-92b4-f9a907cce37c", count: 2, note: "SAME passage" },
  { key: "what_does_mean:pliable:a76ac350-b431-418c-ba1a-3d2a321646ad", count: 2, note: "SAME passage" },
  { key: "what_does_mean:meticulous:d653eded-2d52-4b5c-8d16-652dfeb831ee", count: 2, note: "SAME passage" },
  { key: "what_does_mean:ephemeral:9d00c861-cef4-4978-9df7-2f15a9b035df", count: 2, note: "SAME passage" },
  { key: "what_does_mean:meticulous:2eec30bd-a872-43ba-9a1b-f223b2717cec", count: 2, note: "SAME passage" },
  { key: "what_does_mean:obsolete:cf1ec217-39cd-45c2-a8da-1383abd79570", count: 2, note: "SAME passage" },
  { key: "what_does_mean:undeterred:c720acc1-6316-40c4-8e97-261e917f230c", count: 2, note: "SAME passage" },
  { key: "what_does_mean:diminished:ddc1977a-8d05-4f90-abdf-531a8545778b", count: 2, note: "SAME passage" },
  { key: "what_does_mean:subtle:72b2c407-02b4-4503-be7e-3885ac853cc0", count: 2, note: "SAME passage" },
  { key: "which sentence uses verb tenses correctly?", count: 3, note: "grammar question" },
  { key: "which sentence uses modifiers correctly?", count: 3, note: "grammar question" },
  { key: "which sentence is grammatically correct?", count: 7, note: "grammar question" },
  { key: "which sentence has correct subject-verb agreement?", count: 2, note: "grammar question" },
  { key: "which sentence uses punctuation correctly?", count: 7, note: "grammar question" },
  { key: "what does the idiom 'to throw in the towel' mean?", count: 4, note: "idiom question" },
  { key: "what_does_mean:tenacity:null", count: 3, note: "null passage_id" },
  { key: "what_does_mean:audacious:null", count: 2, note: "null passage_id" },
  { key: "what_does_mean:radical:null", count: 2, note: "null passage_id" },
  { key: "which sentence uses quotation marks correctly?", count: 2, note: "grammar question" },
  { key: "which sentence uses the correct verb tense?", count: 3, note: "grammar question" },
  { key: "which sentence uses commas correctly?", count: 2, note: "grammar question" },
  { key: "what is the main idea of this passage?", count: 36, note: "DIFFERENT passages - PROBLEM!" },
  { key: "which sentence uses quotation marks and commas correctly?", count: 4, note: "grammar question" },
  { key: "which sentence uses apostrophes correctly?", count: 4, note: "grammar question" },
  { key: "which sentence demonstrates correct subject-verb agreement?", count: 2, note: "grammar question" },
  { key: "what does the idiom 'to cost an arm and a leg' mean?", count: 4, note: "idiom question" },
  { key: "choose the correct word to complete the sentence...", count: 2, note: "vocab question" },
  { key: "what does the idiom 'to burn the midnight oil' mean?", count: 2, note: "idiom question" },
  { key: "which sentence demonstrates correct use of semicolons and commas?", count: 4, note: "grammar question" },
  { key: "which sentence correctly uses apostrophes to show possession?", count: 2, note: "grammar question" },
  { key: "which sentence contains an error in subject-verb agreement?", count: 2, note: "grammar question" },
  { key: "which sentence uses pronouns correctly?", count: 2, note: "grammar question" },
  { key: "which word is spelled correctly?", count: 2, note: "spelling question" },
  { key: "what is the main purpose of this passage?", count: 5, note: "DIFFERENT passages - PROBLEM!" },
  { key: "what is the central theme of this passage?", count: 5, note: "DIFFERENT passages - PROBLEM!" },
  { key: "which detail from the passage supports the idea that the waggle dance...", count: 2, note: "SAME passage" },
  { key: "what_does_mean:tenaciously:06c7b6b7-ae7d-4166-9de0-8a27ee470056", count: 2, note: "SAME passage" }
];

console.log('ANALYSIS OF DELETED DUPLICATES\n');
console.log('═══════════════════════════════════════════════════════════\n');

let samePassageDuplicates = 0;
let nullPassageDuplicates = 0;
let grammarDuplicates = 0;
let possibleWrongDeletions = 0;

for (const group of deletedGroups) {
  if (group.note === "SAME passage") {
    samePassageDuplicates += group.count - 1;
  } else if (group.note === "null passage_id") {
    nullPassageDuplicates += group.count - 1;
  } else if (group.note.includes("grammar") || group.note.includes("idiom") || group.note.includes("vocab") || group.note.includes("spelling")) {
    grammarDuplicates += group.count - 1;
  } else if (group.note === "DIFFERENT passages - PROBLEM!") {
    possibleWrongDeletions += group.count - 1;
    console.log(`⚠️  CONCERN: "${group.key}"`);
    console.log(`   Deleted ${group.count - 1} copies (kept 1)`);
    console.log(`   These questions had DIFFERENT passage IDs!`);
    console.log(`   This is VALID - same question about different passages is OK\n`);
  }
}

console.log('\n═══════════════════════════════════════════════════════════');
console.log('SUMMARY\n');
console.log(`✅ Correct deletions (same passage, same question): ${samePassageDuplicates}`);
console.log(`✅ Correct deletions (null passage_id malformed): ${nullPassageDuplicates}`);
console.log(`✅ Correct deletions (grammar/idiom questions): ${grammarDuplicates}`);
console.log(`❌ INCORRECT deletions (different passages): ${possibleWrongDeletions}\n`);

console.log('═══════════════════════════════════════════════════════════');
console.log('ISSUE IDENTIFIED:\n');
console.log('The duplicate detection INCORRECTLY deleted questions like:');
console.log('- "What is the main idea of this passage?" (36 copies deleted)');
console.log('- "What is the main purpose of this passage?" (5 copies deleted)');
console.log('- "What is the central theme of this passage?" (5 copies deleted)');
console.log('\nThese questions were about DIFFERENT passages, so they should NOT');
console.log('have been considered duplicates. Each passage can have a "main idea"');
console.log('question - that\'s perfectly valid!\n');
console.log(`Total incorrectly deleted: ${possibleWrongDeletions} questions`);
