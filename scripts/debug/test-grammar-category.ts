// Quick test to verify Language Conventions is categorized as 'grammar'

const SECTION_CATEGORIES: Record<string, string> = {
  'Language Conventions': 'grammar',
};

function getSectionCategory(sectionName: string): string {
  if (SECTION_CATEGORIES[sectionName]) return SECTION_CATEGORIES[sectionName];
  const lower = sectionName.toLowerCase();
  if (lower.includes('language conventions') || lower.includes('grammar') || lower.includes('punctuation')) return 'grammar';
  if (lower.includes('verbal') || lower.includes('thinking')) return 'verbal';
  return 'verbal';
}

console.log('\n📋 Testing Section Category Assignment');
console.log('━'.repeat(60));

const testSections = [
  'Language Conventions',
  'Year 5 NAPLAN - Language Conventions',
  'Year 7 NAPLAN - Language Conventions'
];

testSections.forEach(section => {
  const category = getSectionCategory(section);
  const emoji = category === 'grammar' ? '✅' : '❌';
  console.log(`${emoji} "${section}" → ${category}`);
});

console.log('');
console.log('Expected: All should be "grammar" category');
console.log('━'.repeat(60));
console.log('');
