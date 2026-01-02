// School logos data with test-specific filtering

export interface SchoolLogo {
  name: string;
  logo: string;
  state: 'VIC' | 'NSW' | 'QLD' | 'SA' | 'WA';
  type: 'selective' | 'private' | 'both';
}

export const allSchoolLogos: SchoolLogo[] = [
  // Victorian Schools
  { name: "Brighton Grammar School", logo: "/images/school logos/vic/brighton-grammar-school.svg", state: "VIC", type: "private" },
  { name: "Camberwell Girls Grammar", logo: "/images/school logos/vic/camberwell-girls-grammar-school.svg", state: "VIC", type: "private" },
  { name: "Camberwell Grammar School", logo: "/images/school logos/vic/camberwell-grammar-school.svg", state: "VIC", type: "private" },
  { name: "Carey Baptist Grammar", logo: "/images/school logos/vic/carey-baptist-grammar-school.svg", state: "VIC", type: "private" },
  { name: "Caulfield Grammar School", logo: "/images/school logos/vic/caulfield-grammar-school.svg", state: "VIC", type: "private" },
  { name: "Firbank Grammar School", logo: "/images/school logos/vic/firbank-grammar-school.svg", state: "VIC", type: "private" },
  { name: "Geelong College", logo: "/images/school logos/vic/geelong-college.svg", state: "VIC", type: "private" },
  { name: "Geelong Grammar School", logo: "/images/school logos/vic/geelong-grammar-school.svg", state: "VIC", type: "private" },
  { name: "Genazzano FCJ College", logo: "/images/school logos/vic/genazzano-fcj-college.svg", state: "VIC", type: "private" },
  { name: "Goulburn Valley Grammar", logo: "/images/school logos/vic/goulburn-valley-grammar-school.svg", state: "VIC", type: "private" },
  { name: "Haileybury College", logo: "/images/school logos/vic/haileybury-college.svg", state: "VIC", type: "private" },
  { name: "Huntingtower School", logo: "/images/school logos/vic/huntingtower-school.svg", state: "VIC", type: "private" },
  { name: "Ivanhoe Girls Grammar", logo: "/images/school logos/vic/ivanhoe-girls-grammar-school.svg", state: "VIC", type: "private" },
  { name: "Ivanhoe Grammar School", logo: "/images/school logos/vic/ivanhoe-grammar-school.svg", state: "VIC", type: "private" },
  { name: "Kilvington Grammar", logo: "/images/school logos/vic/kilvington-grammar-school.svg", state: "VIC", type: "private" },

  // NSW Schools
  { name: "Arden Anglican School", logo: "/images/school logos/nsw/arden_anglican_school.png", state: "NSW", type: "private" },
  { name: "Barker College", logo: "/images/school logos/nsw/barker_college.png", state: "NSW", type: "private" },
  { name: "Our Lady of the Sacred Heart", logo: "/images/school logos/nsw/our_lady_of_the_sacred_heart_college_kensington.png", state: "NSW", type: "private" },
  { name: "Ravenswood School", logo: "/images/school logos/nsw/ravenswood_school_for_girls.png", state: "NSW", type: "private" },
  { name: "Redfield College", logo: "/images/school logos/nsw/redfield_college.png", state: "NSW", type: "private" },
  { name: "St Aloysius College", logo: "/images/school logos/nsw/st_aloysius_college_sydney.png", state: "NSW", type: "private" },
  { name: "St Augustine's College", logo: "/images/school logos/nsw/st_augustines_college_brookvale.png", state: "NSW", type: "private" },
  { name: "St Catherine's School", logo: "/images/school logos/nsw/st_catherines_school_sydney.png", state: "NSW", type: "private" },
  { name: "St Clare's College", logo: "/images/school logos/nsw/st_clares_college_waverley.png", state: "NSW", type: "private" },
  { name: "St Stanislaus College", logo: "/images/school logos/nsw/st_stanislaus_college.png", state: "NSW", type: "private" },
  { name: "Sydney Grammar School", logo: "/images/school logos/nsw/sydney_grammar_school.png", state: "NSW", type: "private" },
  { name: "The King's School", logo: "/images/school logos/nsw/the_kings_school.png", state: "NSW", type: "private" },
  { name: "Trinity Catholic College", logo: "/images/school logos/nsw/trinity_catholic_college_auburn.png", state: "NSW", type: "private" },
  { name: "Trinity Grammar School", logo: "/images/school logos/nsw/trinity_grammar_school_sydney.png", state: "NSW", type: "private" },
  { name: "Waverley College", logo: "/images/school logos/nsw/waverley_college.png", state: "NSW", type: "private" }
];

// Note: For selective schools (Melbourne High, Mac.Rob, James Ruse, etc.), we'll use text placeholders
// since we don't have their logos uploaded yet. These can be replaced with actual logos later.

export const selectiveSchools = {
  vic: [
    { name: "Melbourne High School", state: "VIC" },
    { name: "Mac.Robertson Girls' High School", state: "VIC" },
    { name: "Nossal High School", state: "VIC" },
    { name: "Suzanne Cory High School", state: "VIC" }
  ],
  nsw: [
    { name: "James Ruse Agricultural High School", state: "NSW" },
    { name: "North Sydney Girls High School", state: "NSW" },
    { name: "North Sydney Boys High School", state: "NSW" },
    { name: "Baulkham Hills High School", state: "NSW" },
    { name: "Hornsby Girls High School", state: "NSW" },
    { name: "Fort Street High School", state: "NSW" },
    { name: "Sydney Girls High School", state: "NSW" },
    { name: "Sydney Boys High School", state: "NSW" }
  ]
};

// Filter logos by test type
export const getSchoolLogosForTest = (testSlug: string) => {
  switch (testSlug) {
    case 'edutest-scholarship':
      // Private schools from VIC and NSW
      return allSchoolLogos.filter(school =>
        school.type === 'private' && (school.state === 'VIC' || school.state === 'NSW')
      );

    case 'acer-scholarship':
      // Private schools from all states
      return allSchoolLogos.filter(school => school.type === 'private');

    case 'vic-selective':
      // VIC private schools + VIC selective schools
      return {
        logos: allSchoolLogos.filter(school => school.state === 'VIC'),
        selectiveText: selectiveSchools.vic
      };

    case 'nsw-selective':
      // NSW private schools + NSW selective schools
      return {
        logos: allSchoolLogos.filter(school => school.state === 'NSW'),
        selectiveText: selectiveSchools.nsw
      };

    case 'year-5-naplan':
    case 'year-7-naplan':
      // Mix of all schools
      return allSchoolLogos;

    default:
      return allSchoolLogos;
  }
};
