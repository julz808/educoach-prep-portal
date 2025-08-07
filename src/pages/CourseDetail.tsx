import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  CheckCircle, 
  BookOpen, 
  FileText, 
  Target, 
  BarChart3, 
  TrendingUp,
  ArrowRight,
  Clock,
  Users,
  Award,
  Zap,
  ChevronDown,
  Menu,
  X,
  User,
  MessageSquare,
  PenTool,
  Calculator,
  Brain,
  Search,
  Globe,
  Activity,
  Lightbulb,
  ChartBar,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { courses, faqs } from '@/data/courses';
import { TEST_STRUCTURES, SECTION_TO_SUB_SKILLS, UNIFIED_SUB_SKILLS } from '@/data/curriculumData';
import { Course } from '@/types';
import { toast } from '@/components/ui/use-toast';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import Lenis from 'lenis';
import { redirectToCheckout } from '@/services/stripeService';

// Map course slugs to Stripe Payment Links
const COURSE_TO_PAYMENT_LINK_MAP: { [key: string]: string } = {
  'year-5-naplan': 'https://buy.stripe.com/YOUR_PAYMENT_LINK_HERE', // Replace with actual payment link
  'year-7-naplan': 'https://buy.stripe.com/YOUR_PAYMENT_LINK_HERE', // Replace with actual payment link
  'edutest-scholarship': 'https://buy.stripe.com/YOUR_PAYMENT_LINK_HERE', // Replace with actual payment link
  'acer-scholarship': 'https://buy.stripe.com/YOUR_PAYMENT_LINK_HERE', // Replace with actual payment link
  'nsw-selective': 'https://buy.stripe.com/YOUR_PAYMENT_LINK_HERE', // Replace with actual payment link
  'vic-selective': 'https://buy.stripe.com/YOUR_PAYMENT_LINK_HERE' // Replace with actual payment link
};

// Test section descriptions mapping - focused on the test itself, not platform features
const TEST_SECTION_DESCRIPTIONS: { [key: string]: { [key: string]: string } } = {
  "Year 5 NAPLAN": {
    "Writing": "Students write a narrative or persuasive piece in response to a given prompt, demonstrating their ability to structure ideas coherently and use appropriate language features for their year level.",
    "Reading": "This section tests comprehension skills across fiction, non-fiction, and mixed text types. Students must demonstrate understanding, analysis, and interpretation of various written materials.",
    "Language Conventions": "This test focuses on spelling, grammar, and punctuation. Students must demonstrate their understanding of standard Australian English conventions including parts of speech, sentence structure, and orthographic patterns.",
    "Numeracy No Calculator": "This section tests mental mathematics, number sense, basic operations, and fundamental mathematical reasoning skills without calculator assistance.",
    "Numeracy Calculator": "This section focuses on more complex calculations, multi-step problems, and mathematical applications that benefit from technological support."
  },
  "Year 7 NAPLAN": {
    "Writing": "Students write a narrative or persuasive text in response to a stimulus. The assessment focuses on sophisticated vocabulary, complex sentence structures, and advanced organisational skills appropriate for Year 7 level.",
    "Reading": "This section tests advanced comprehension skills including analysis, inference, and critical evaluation across diverse text types. Students must demonstrate deeper understanding and interpretation abilities.",
    "Language Conventions": "This section covers advanced spelling patterns, complex grammatical structures, sophisticated punctuation usage, and nuanced language mechanics appropriate for Year 7 level.",
    "Numeracy No Calculator": "This section requires mental calculation strategies, algebraic thinking, geometric reasoning, and advanced number sense without technological assistance.",
    "Numeracy Calculator": "This section emphasises complex problem-solving, statistical analysis, advanced measurement applications, and mathematical modelling with calculator support."
  },
  "ACER Scholarship": {
    "Written Expression": "Students complete a writing task demonstrating their ability to express ideas clearly and persuasively under time pressure. The task requires sophisticated vocabulary, logical argument structure, and mature writing techniques.",
    "Mathematics": "This section covers advanced mathematical concepts including algebra, geometry, statistics, and problem-solving. Questions require higher-order thinking and mathematical reasoning beyond standard curriculum level.",
    "Humanities": "This section tests reading comprehension, source analysis, historical interpretation, and critical thinking skills across humanities subjects through various question formats."
  },
  "EduTest Scholarship": {
    "Reading Comprehension": "This fast-paced section tests rapid comprehension, inference skills, and the ability to synthesise information quickly through various text-based questions.",
    "Verbal Reasoning": "This section tests analogical reasoning, vocabulary knowledge, word relationships, and logical verbal connections. Students must demonstrate sophisticated language processing skills.",
    "Numerical Reasoning": "This section focuses on number patterns, mathematical sequences, proportional reasoning, and logical problem-solving with numbers, without requiring advanced mathematical knowledge.",
    "Mathematics": "This section covers both curriculum mathematics and extension problems. Topics span arithmetic, algebra, geometry, measurement, statistics, and applied mathematics.",
    "Written Expression": "Students complete writing tasks including both creative and analytical components. This section tests the ability to write effectively under time constraints while demonstrating sophisticated language use."
  },
  "NSW Selective Entry": {
    "Reading": "This test emphasises advanced comprehension skills, inference, textual analysis, and critical evaluation across various text types appropriate for selective school entry.",
    "Mathematical Reasoning": "This section tests advanced problem-solving, pattern recognition, mathematical logic, and reasoning skills that extend beyond standard Year 6 curriculum expectations.",
    "Thinking Skills": "This section focuses on abstract reasoning, logical sequences, pattern identification, and systematic problem-solving across verbal, numerical, and spatial domains.",
    "Writing": "Students write a persuasive text demonstrating sophisticated argument construction, evidence integration, advanced vocabulary, and mature writing techniques appropriate for selective school entry."
  },
  "VIC Selective Entry": {
    "Reading Reasoning": "This section tests critical analysis, textual comparison, author analysis, and sophisticated literary interpretation skills required for selective school entry.",
    "Mathematics Reasoning": "This section covers advanced mathematical concepts, problem-solving methods, mathematical logic, and abstract thinking well beyond standard Year 8 curriculum.",
    "General Ability - Verbal": "This section tests verbal analogies, word relationships, linguistic patterns, and vocabulary reasoning at an advanced level suitable for selective entry.",
    "General Ability - Quantitative": "This section focuses on numerical patterns, quantitative relationships, data interpretation, and abstract mathematical reasoning skills.",
    "Writing": "Students complete multiple writing tasks including creative narrative and analytical response. This format tests versatility, time management, and sophisticated expression across different writing modes."
  }
};

// Get sub-skills from CurriculumData.ts based on test structure key and section
const getSubSkillsForSection = (testStructureKey: string, sectionName: string): string[] => {
  const sectionKey = `${testStructureKey} - ${sectionName}`;
  const subSkills = SECTION_TO_SUB_SKILLS[sectionKey as keyof typeof SECTION_TO_SUB_SKILLS];
  
  if (!subSkills || subSkills.length === 0) {
    // Fallback to generic sub-skills if none found
    return [
      "Critical thinking and analysis",
      "Problem-solving strategies", 
      "Time management skills",
      "Test-taking techniques"
    ];
  }
  
  return subSkills.map(skill => {
    const skillDescription = UNIFIED_SUB_SKILLS[skill as keyof typeof UNIFIED_SUB_SKILLS];
    return skillDescription?.description || skill;
  });
};

// Icon mapping for test sections
const SECTION_ICONS: { [key: string]: React.ReactNode } = {
  "Writing": <PenTool className="h-6 w-6" />,
  "Written Expression": <PenTool className="h-6 w-6" />,
  "Reading": <BookOpen className="h-6 w-6" />,
  "Reading Comprehension": <BookOpen className="h-6 w-6" />,
  "Reading Reasoning": <BookOpen className="h-6 w-6" />,
  "Language Conventions": <MessageSquare className="h-6 w-6" />,
  "Numeracy No Calculator": <Brain className="h-6 w-6" />,
  "Numeracy Calculator": <Calculator className="h-6 w-6" />,
  "Mathematics": <Calculator className="h-6 w-6" />,
  "Mathematics Reasoning": <Calculator className="h-6 w-6" />,
  "Mathematical Reasoning": <Calculator className="h-6 w-6" />,
  "Humanities": <Globe className="h-6 w-6" />,
  "Verbal Reasoning": <MessageSquare className="h-6 w-6" />,
  "Numerical Reasoning": <Brain className="h-6 w-6" />,
  "Thinking Skills": <Brain className="h-6 w-6" />,
  "General Ability - Verbal": <MessageSquare className="h-6 w-6" />,
  "General Ability - Quantitative": <Brain className="h-6 w-6" />
};

// Get the test name key for TEST_STRUCTURES
const getTestStructureKey = (courseTitle: string): string => {
  const mappings: { [key: string]: string } = {
    "Year 5 NAPLAN": "Year 5 NAPLAN",
    "Year 7 NAPLAN": "Year 7 NAPLAN",
    "ACER Scholarship": "ACER Scholarship (Year 7 Entry)",
    "EduTest Scholarship": "EduTest Scholarship (Year 7 Entry)",
    "NSW Selective Entry": "NSW Selective Entry (Year 7 Entry)",
    "VIC Selective Entry": "VIC Selective Entry (Year 9 Entry)"
  };
  return mappings[courseTitle] || courseTitle;
};

const CourseDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | undefined>(undefined);
  const [scrollY, setScrollY] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTestSection, setActiveTestSection] = useState<string>("");
  const [activeFeature, setActiveFeature] = useState<string>("diagnostic");

  useEffect(() => {
    console.log('CourseDetail: Looking for slug:', slug);
    console.log('CourseDetail: Available courses:', courses.map(c => c.slug));
    
    const foundCourse = courses.find(c => c.slug === slug);
    console.log('CourseDetail: Found course:', foundCourse?.title || 'NOT FOUND');
    
    if (foundCourse) {
      setCourse(foundCourse);
      document.title = `${foundCourse.title} | EduCourse`;
      window.scrollTo(0, 0);
      
      // Set first test section as active
      const testKey = getTestStructureKey(foundCourse.title);
      const testSections = TEST_STRUCTURES[testKey as keyof typeof TEST_STRUCTURES] || {};
      const firstSection = Object.keys(testSections)[0];
      if (firstSection) {
        setActiveTestSection(firstSection);
      }
    } else {
      console.error('CourseDetail: Course not found for slug:', slug);
    }
  }, [slug]);

  // Scroll effect for nav transparency
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrollY(currentScrollY);
      setIsScrolled(currentScrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  // Initialize Lenis smooth scrolling
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.1,
      wheelMultiplier: 0.8,
      gestureOrientation: 'vertical',
      normalizeWheel: false,
      smoothTouch: false
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  const handlePurchase = async () => {
    if (!course?.slug) {
      toast({
        title: "Error",
        description: "Course not found. Please refresh the page and try again.",
        variant: "destructive"
      });
      return;
    }

    const paymentLink = COURSE_TO_PAYMENT_LINK_MAP[course.slug];
    
    if (!paymentLink || paymentLink.includes('YOUR_PAYMENT_LINK_HERE')) {
      toast({
        title: "Error", 
        description: "Payment link not configured. Please contact support.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Redirecting to checkout...",
      description: "You'll be redirected to our secure payment page.",
    });

    // Direct redirect to Stripe Payment Link
    window.location.href = paymentLink;
  };

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4ECDC4] mx-auto mb-4"></div>
          <p className="text-gray-600 mb-2">Loading course details...</p>
          <p className="text-sm text-gray-500">Slug: {slug}</p>
          <p className="text-xs text-gray-400 mt-4">
            Available courses: {courses.map(c => c.slug).join(', ')}
          </p>
        </div>
      </div>
    );
  }

  const testKey = getTestStructureKey(course.title);
  const testSections = TEST_STRUCTURES[testKey as keyof typeof TEST_STRUCTURES] || {};
  const sectionDescriptions = TEST_SECTION_DESCRIPTIONS[course.title] || {};

  // Calculate total questions and total time
  const totalQuestions = Object.values(testSections).reduce((sum, section: any) => {
    return sum + (section.questions || 0);
  }, 0);
  
  const totalTime = Object.values(testSections).reduce((sum, section: any) => {
    return sum + (section.time || 0);
  }, 0);

  // How it Works data (renamed from Features)
  const howItWorksData = [
    {
      id: "diagnostic",
      title: "Diagnostic",
      description: "Comprehensive initial assessment to identify strengths and areas for improvement",
      icon: <Activity className="h-5 w-5" />,
      screenshot: "/images/diagnostic home 3.png"
    },
    {
      id: "drills",
      title: "Skill Drills",
      description: "Targeted practice exercises to strengthen specific sub-skills and concepts",
      icon: <Target className="h-5 w-5" />,
      screenshot: "/images/writing feedback 3.png"
    },
    {
      id: "practice",
      title: "Practice Tests",
      description: "Full-length timed tests that simulate real exam conditions",
      icon: <FileText className="h-5 w-5" />,
      screenshot: "/images/test taking maths 2.png"
    },
    {
      id: "analytics",
      title: "Performance Analytics",
      description: "Detailed insights and progress tracking at the sub-skill level",
      icon: <ChartBar className="h-5 w-5" />,
      screenshot: "/images/insights 5.png"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar - Same as Landing page */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-sm shadow-sm' 
          : 'bg-transparent'
      }`}>
        <div className="container mx-auto px-4 h-16">
          <div className="flex items-center justify-between h-full">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <img 
                src="/images/educourse-logo v2.png" 
                alt="EduCourse" 
                className="h-[140px] md:h-52"
              />
            </Link>

            {/* Right Side Menu Items */}
            <div className="flex items-center space-x-6">
              {/* Desktop Menu */}
              <div className="hidden md:flex items-center space-x-6">
                <div className="relative group">
                  <button className="flex items-center space-x-1 text-[#3B4F6B] hover:text-[#4ECDC4] transition-colors font-semibold">
                    <span>Learning Products</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="p-2">
                      {courses.map((c) => (
                        <Link
                          key={c.id}
                          to={`/course/${c.slug}`}
                          className="block px-4 py-2 text-base font-semibold text-[#3B4F6B] hover:bg-[#E6F7F5] rounded-lg transition-colors"
                        >
                          {c.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Login Button */}
                <Button
                  variant="outline"
                  asChild
                  className="border-[#4ECDC4] text-[#4ECDC4] hover:bg-[#4ECDC4] hover:text-white transition-colors"
                >
                  <Link to="/auth">
                    <User className="h-4 w-4 mr-2" />
                    Login
                  </Link>
                </Button>
              </div>

              {/* Mobile Menu Button */}
              <div className="md:hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="text-[#3B4F6B]"
                >
                  {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-lg border-t">
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <p className="font-semibold text-[#3B4F6B]">Learning Products</p>
                  {courses.map((c) => (
                    <Link
                      key={c.id}
                      to={`/course/${c.slug}`}
                      className="block px-4 py-2 text-base font-semibold text-[#6B7280] hover:bg-[#E6F7F5] rounded-lg transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {c.title}
                    </Link>
                  ))}
                </div>
                <Button
                  asChild
                  className="w-full bg-[#4ECDC4] hover:bg-[#4ECDC4]/90 text-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Link to="/auth">
                    <User className="h-4 w-4 mr-2" />
                    Login
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section with Split Design */}
      <section className="pt-24 md:pt-32 pb-16 md:pb-20 bg-gradient-to-b from-[#FFE8E8] to-white relative overflow-hidden">
        <div className="container mx-auto px-4 relative">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Content */}
            <motion.div 
              className="space-y-8 md:space-y-10 text-center lg:text-left"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="space-y-6 md:space-y-8">
                <motion.h1 
                  className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#2C3E50] leading-tight"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  {course.title}<br />
                  <span className="text-[#4ECDC4]">Test Prep</span>
                </motion.h1>
                <motion.p 
                  className="text-lg sm:text-xl text-[#4B5563] leading-relaxed max-w-lg mx-auto lg:mx-0"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  {course.shortDescription}
                </motion.p>
              </div>

              {/* Key Points */}
              <motion.div 
                className="space-y-3 md:space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                {[
                  course.title === 'ACER Scholarship' || course.title === 'EduTest Scholarship' 
                    ? 'Designed for Students in Year 5/6 applying for Year 7 Entry'
                    : `Designed for ${course.target}`,
                  'Expert-crafted questions aligned to test format',
                  'Instant feedback with detailed explanations'
                ].map((point, index) => (
                  <motion.div 
                    key={index} 
                    className="flex items-start lg:items-center space-x-3 text-left"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                  >
                    <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-[#4ECDC4] flex-shrink-0 mt-0.5 lg:mt-0" />
                    <span className="text-base md:text-lg text-[#3B4F6B] leading-relaxed">{point}</span>
                  </motion.div>
                ))}
              </motion.div>

              {/* CTA */}
              <motion.div 
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.2 }}
              >
                <Button 
                  size="lg" 
                  className="bg-[#FF6B6B] hover:bg-[#FF5252] text-white px-6 md:px-8 py-3 md:py-4 text-base md:text-lg group"
                  onClick={handlePurchase}
                >
                  Purchase for $199
                  <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
            </motion.div>

            {/* Hero Images - Same style as landing page */}
            <div className="relative h-[300px] sm:h-[400px] lg:h-[500px] mt-8 lg:mt-0">
              {/* Mobile: Single centered image */}
              <div className="block lg:hidden">
                <motion.div 
                  className="w-full max-w-sm mx-auto h-[280px] bg-white rounded-xl shadow-2xl overflow-hidden"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                >
                  <img 
                    src="/images/insights 5.png" 
                    alt="Performance Analytics" 
                    className="w-full h-full object-contain"
                    loading="eager"
                  />
                </motion.div>
              </div>
              
              {/* Desktop: Overlapping Screenshots */}
              <div className="hidden lg:block">
                {/* Background Screenshot */}
                <motion.div 
                  className="absolute top-0 right-0 w-[400px] h-[240px] bg-white rounded-xl shadow-2xl overflow-hidden transform rotate-3 hover:rotate-1 hover:scale-105 transition-all duration-500 z-10"
                  initial={{ opacity: 0, y: 50, rotate: 10 }}
                  animate={{ opacity: 1, y: 0, rotate: 3 }}
                  transition={{ duration: 0.8, delay: 0.5, type: "spring", stiffness: 100 }}
                >
                  <img 
                    src="/images/dashboard view 2.png" 
                    alt="EduCourse Dashboard" 
                    className="w-full h-full object-contain"
                    loading="eager"
                  />
                </motion.div>
                
                {/* Middle Screenshot */}
                <motion.div 
                  className="absolute top-16 left-8 w-[400px] h-[240px] bg-white rounded-xl shadow-2xl overflow-hidden transform -rotate-2 hover:rotate-0 hover:scale-105 transition-all duration-500 z-20"
                  initial={{ opacity: 0, y: 50, rotate: -10 }}
                  animate={{ opacity: 1, y: 0, rotate: -2 }}
                  transition={{ duration: 0.8, delay: 0.8, type: "spring", stiffness: 100 }}
                >
                  <img 
                    src="/images/reading simulation 2.png" 
                    alt="Reading Simulation" 
                    className="w-full h-full object-contain"
                    loading="eager"
                  />
                </motion.div>
                
                {/* Front Screenshot */}
                <motion.div 
                  className="absolute top-48 right-12 w-[400px] h-[240px] bg-white rounded-xl shadow-2xl overflow-hidden transform rotate-1 hover:rotate-0 hover:scale-105 transition-all duration-500 z-30"
                  initial={{ opacity: 0, y: 50, rotate: 8 }}
                  animate={{ opacity: 1, y: 0, rotate: 1 }}
                  transition={{ duration: 0.8, delay: 1.1, type: "spring", stiffness: 100 }}
                >
                  <img 
                    src="/images/insights 5.png" 
                    alt="Performance Analytics" 
                    className="w-full h-full object-contain"
                    loading="eager"
                  />
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About the Test Section - Tabbed Design */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-12 md:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#2C3E50] mb-4">
              About the {course.title} Test
            </h2>
            <p className="text-lg md:text-xl text-[#6B7280] max-w-3xl mx-auto">
              Understand exactly what's tested in each section of the {course.title} examination
            </p>
          </motion.div>

          {/* Tabs Navigation */}
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-wrap justify-center gap-2 mb-8 border-b border-gray-200">
              {Object.keys(testSections).map((sectionName) => (
                <button
                  key={sectionName}
                  onClick={() => setActiveTestSection(sectionName)}
                  className={`px-4 py-3 text-sm md:text-base font-medium transition-all duration-200 border-b-2 -mb-[1px] ${
                    activeTestSection === sectionName
                      ? 'text-[#6366F1] border-[#6366F1]'
                      : 'text-[#6B7280] border-transparent hover:text-[#4ECDC4]'
                  }`}
                >
                  {sectionName}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {activeTestSection && (
                <motion.div
                  key={activeTestSection}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-xl border-2 border-gray-100 p-6 md:p-8"
                >
                  {/* Section Header */}
                  <div className="flex items-start space-x-4 mb-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#4ECDC4] to-[#6366F1] rounded-full flex items-center justify-center text-white flex-shrink-0">
                      {SECTION_ICONS[activeTestSection] || <BookOpen className="h-7 w-7" />}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl md:text-2xl font-bold text-[#2C3E50] mb-2">
                        {activeTestSection}
                      </h3>
                      <p className="text-[#6B7280] mb-4">
                        {sectionDescriptions[activeTestSection] || "Master key concepts and strategies for this section"}
                      </p>
                      
                      {/* Test Details - moved above Sub-skills */}
                      <div className="flex items-center space-x-6 mb-2">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-[#6366F1]" />
                          <span className="text-sm font-medium text-[#2C3E50]">
                            {(testSections[activeTestSection] as any)?.questions || 0} {
                              ((testSections[activeTestSection] as any)?.questions || 0) === 1 ? 'question' : 'questions'
                            }
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-[#6366F1]" />
                          <span className="text-sm font-medium text-[#2C3E50]">
                            {(testSections[activeTestSection] as any)?.time || 0} minutes
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sub-skills */}
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-[#2C3E50] mb-4">Sub-skills Tested:</h4>
                    <div className="grid md:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2">
                      {(() => {
                        try {
                          const skills = getSubSkillsForSection(testKey, activeTestSection);
                          return skills.map((skill, index) => (
                            <div key={index} className="flex items-start space-x-2">
                              <CheckCircle className="h-4 w-4 text-[#4ECDC4] flex-shrink-0 mt-0.5" />
                              <span className="text-sm text-[#6B7280] leading-relaxed">{skill}</span>
                            </div>
                          ));
                        } catch (error) {
                          console.error('Error getting sub-skills:', error);
                          return [
                            "Critical thinking and analysis",
                            "Problem-solving strategies", 
                            "Time management skills",
                            "Test-taking techniques"
                          ].map((skill, index) => (
                            <div key={index} className="flex items-start space-x-2">
                              <CheckCircle className="h-4 w-4 text-[#4ECDC4] flex-shrink-0 mt-0.5" />
                              <span className="text-sm text-[#6B7280] leading-relaxed">{skill}</span>
                            </div>
                          ));
                        }
                      })()}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* How it Works Section (renamed from Our Features) */}
      <section className="py-16 md:py-20 bg-[#F8F9FA]">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-12 md:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#2C3E50] mb-4">
              Our Learning Platform
            </h2>
            <p className="text-lg md:text-xl text-[#6B7280] max-w-3xl mx-auto">
              Our proven approach to test preparation success
            </p>
          </motion.div>

          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              {/* Features Toggle List */}
              <div className="space-y-4">
                {howItWorksData.map((feature, index) => (
                  <motion.div
                    key={feature.id}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <button
                      onClick={() => setActiveFeature(feature.id)}
                      className={`w-full text-left p-4 md:p-6 rounded-xl transition-all duration-300 ${
                        activeFeature === feature.id
                          ? 'bg-white shadow-lg border-2 border-[#6366F1]'
                          : 'bg-white/50 hover:bg-white border-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-start space-x-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                          activeFeature === feature.id
                            ? 'bg-gradient-to-br from-[#4ECDC4] to-[#6366F1] text-white'
                            : 'bg-gray-100 text-[#6B7280]'
                        }`}>
                          {feature.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className={`text-xl font-semibold mb-2 transition-colors ${
                            activeFeature === feature.id ? 'text-[#2C3E50]' : 'text-[#6B7280]'
                          }`}>
                            {feature.title}
                          </h3>
                          <p className={`text-base transition-colors ${
                            activeFeature === feature.id ? 'text-[#6B7280]' : 'text-[#9CA3AF]'
                          }`}>
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  </motion.div>
                ))}
              </div>

              {/* Feature Screenshot */}
              <motion.div
                className="relative"
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <div className="bg-gradient-to-br from-[#4ECDC4] to-[#6366F1] rounded-2xl p-1">
                  <div className="bg-white rounded-xl overflow-hidden">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeFeature}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="aspect-video bg-gray-50 flex items-center justify-center"
                      >
                        {/* Actual screenshots */}
                        <div className="w-full h-full">
                          <img 
                            src={howItWorksData.find(f => f.id === activeFeature)?.screenshot} 
                            alt={`${howItWorksData.find(f => f.id === activeFeature)?.title} Interface`}
                            className="w-full h-full object-contain"
                            loading="lazy"
                          />
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>

                {/* Decorative elements */}
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-[#4ECDC4]/10 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-[#6366F1]/10 rounded-full blur-2xl"></div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - 6 features with green ticks in 3x2 grid */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-12 md:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#2C3E50] mb-4">
              What's Included
            </h2>
            <p className="text-lg md:text-xl text-[#6B7280] max-w-3xl mx-auto">
              Everything you need to prepare for success
            </p>
          </motion.div>

          {/* 3x2 Grid of Features */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                title: "500+ Questions",
                description: "Comprehensive question bank covering all test sections and difficulty levels"
              },
              {
                title: "5 Full-Length Tests",
                description: "Complete practice exams that simulate real test conditions and timing"
              },
              {
                title: "AI-Powered Writing Practice",
                description: "Instant feedback on your writing with detailed suggestions for improvement"
              },
              {
                title: "Sub-skill Level Practice",
                description: "Targeted exercises focusing on specific areas identified by diagnostic results"
              },
              {
                title: "Detailed Analytics",
                description: "Detailed insights and progress tracking at the sub-skill level with visual dashboards"
              },
              {
                title: "Practice anywhere",
                description: "Tablet and desktop friendly platform - practice at home, school, or anywhere with internet access"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="flex items-start space-x-4"
              >
                <div className="flex-shrink-0">
                  <CheckCircle className="h-6 w-6 text-[#22C55E] mt-1" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[#2C3E50] mb-2">{feature.title}</h3>
                  <p className="text-base text-[#6B7280] leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section - Sleek Step Design */}
      <section className="py-16 md:py-20 bg-[#F8F9FA]">
        <div className="container mx-auto px-4">
          {/* Section Header */}
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-[#2C3E50] mb-6">
              How it Works
            </h2>
            <p className="text-xl text-[#6B7280] max-w-2xl mx-auto">
              Five simple steps to exam success
            </p>
          </motion.div>

          {/* Steps Grid */}
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-4">
              {[
                {
                  step: 1,
                  title: "Purchase",
                  description: "Choose your test package",
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.68-1.68M7 13l2.32 2.32M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                    </svg>
                  )
                },
                {
                  step: 2,
                  title: "Access",
                  description: "Get instant platform access",
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  )
                },
                {
                  step: 3,
                  title: "Diagnose",
                  description: "Take your first practice test",
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  )
                },
                {
                  step: 4,
                  title: "Practice",
                  description: "Focus on targeted drills",
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  )
                },
                {
                  step: 5,
                  title: "Progress",
                  description: "Track improvement over time",
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  )
                }
              ].map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                  viewport={{ once: true }}
                  className="relative text-center group"
                >
                  {/* Connecting Line (hidden on mobile) */}
                  {index < 4 && (
                    <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-[#4ECDC4] to-transparent z-0" />
                  )}
                  
                  {/* Step Card */}
                  <div className="relative bg-white p-8 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300 border border-gray-100 group-hover:border-[#4ECDC4]/30 z-10">
                    {/* Step Number */}
                    <div className="inline-flex items-center justify-center w-16 h-16 mb-6 bg-gradient-to-br from-[#4ECDC4] to-[#6366F1] text-white rounded-full font-bold text-lg group-hover:scale-110 transition-transform duration-300">
                      {step.step}
                    </div>
                    
                    {/* Content */}
                    <h3 className="text-xl font-semibold text-[#2C3E50] mb-3 group-hover:text-[#6366F1] transition-colors duration-300">
                      {step.title}
                    </h3>
                    <p className="text-[#6B7280] leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Bottom CTA */}
          <motion.div
            className="text-center mt-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            viewport={{ once: true }}
          >
            <p className="text-lg text-[#6B7280] mb-6">
              Ready to help your child succeed?
            </p>
            <Button 
              size="lg" 
              className="bg-[#FF6B6B] hover:bg-[#FF5252] text-white px-8 py-4 text-lg shadow-xl hover:shadow-2xl transition-all duration-300"
              onClick={handlePurchase}
            >
              Get Started Today
            </Button>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-12 md:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#2C3E50] mb-4">
              Frequently Asked Questions
            </h2>
          </motion.div>

          <motion.div 
            className="max-w-3xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border-b border-gray-200">
                  <AccordionTrigger className="text-lg font-medium text-[#2C3E50] hover:text-[#4ECDC4] transition-colors py-6">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-[#6B7280] pb-6">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-[#4ECDC4] to-[#6366F1]">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Start Your Test Prep Journey?
            </h2>
            <p className="text-lg md:text-xl text-white/90 mb-8">
              Join thousands of students who've achieved their goals with EduCourse
            </p>
            <Button 
              size="lg" 
              className="bg-[#FF6B6B] hover:bg-[#FF5252] text-white px-8 py-4 text-lg"
              onClick={handlePurchase}
            >
              Get Started for $199
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <p className="mt-6 text-sm text-white/80">
              7-day money-back guarantee • Instant access • Works on all devices
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default CourseDetail;