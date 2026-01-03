import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CheckCircle,
  BookOpen,
  FileText,
  Target,
  BarChart3,
  TrendingUp,
  ArrowRight,
  Clock,
  Zap,
  ChevronDown,
  Menu,
  X,
  User,
  MessageSquare,
  PenTool,
  Calculator,
  Brain,
  Globe,
  Activity,
  ChartBar,
  Eye,
  Star,
  Shield,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { courses, faqs } from '@/data/courses';
import { getTestimonialsForTest } from '@/data/testimonials';
import { getHeroContent } from '@/data/productContent';
import { getSchoolLogosForTest, allSchoolLogos } from '@/data/schoolLogos';
import { TEST_STRUCTURES, SECTION_TO_SUB_SKILLS, UNIFIED_SUB_SKILLS } from '@/data/curriculumData';
import { Course } from '@/types';
import { toast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import Lenis from 'lenis';
import { redirectToCheckout } from '@/services/stripeService';
import { SEOHead } from '@/components/SEOHead';
import { CourseSchema } from '@/components/CourseSchema';
import { FAQSchema } from '@/components/FAQSchema';
import { useSEOMetadata } from '@/hooks/useSEOMetadata';

// Test section descriptions mapping
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
  const [course, setCourse] = useState<Course | undefined>(undefined);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTestSection, setActiveTestSection] = useState<string>("");
  const [activeFeature, setActiveFeature] = useState<string>("diagnostic");
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  // Get SEO metadata for this course
  const seoMetadata = useSEOMetadata(`/course/${slug}`);

  // Get test-specific content
  const heroContent = slug ? getHeroContent(slug) : null;
  const testimonials = slug ? getTestimonialsForTest(slug) : [];

  useEffect(() => {
    const foundCourse = courses.find(c => c.slug === slug);

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
    }
  }, [slug]);

  // Scroll effect for nav transparency
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
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

  // Testimonials rotation
  useEffect(() => {
    if (testimonials.length > 0) {
      const timer = setInterval(() => {
        setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
      }, 6000);
      return () => clearInterval(timer);
    }
  }, [testimonials]);

  const handlePurchase = async () => {
    if (!course?.slug) {
      toast({
        title: "Error",
        description: "Course not found. Please refresh the page and try again.",
        variant: "destructive"
      });
      return;
    }

    try {
      toast({
        title: "Redirecting to checkout...",
        description: "You'll be redirected to our secure payment page.",
      });

      localStorage.setItem('purchasedCourse', course.slug);
      await redirectToCheckout(course.slug);
    } catch (error) {
      console.error('Purchase error:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (!course || !heroContent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4ECDC4] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading course details...</p>
        </div>
      </div>
    );
  }

  const testKey = getTestStructureKey(course.title);
  const testSections = TEST_STRUCTURES[testKey as keyof typeof TEST_STRUCTURES] || {};
  const sectionDescriptions = TEST_SECTION_DESCRIPTIONS[course.title] || {};

  // How it Works data
  const howItWorksData = [
    {
      id: "diagnostic",
      title: "Diagnostic Test",
      description: "Comprehensive initial assessment to identify strengths and areas for improvement",
      icon: <Activity className="h-5 w-5" />,
      screenshot: "/images/diagnostic home 3.png"
    },
    {
      id: "drills",
      title: "Targeted Drills",
      description: "Focused practice exercises to strengthen specific sub-skills identified by diagnostic",
      icon: <Target className="h-5 w-5" />,
      screenshot: "/images/writing feedback 3.png"
    },
    {
      id: "practice",
      title: "Practice Tests",
      description: "Full-length timed tests that perfectly simulate real exam conditions",
      icon: <FileText className="h-5 w-5" />,
      screenshot: "/images/test taking maths.png"
    },
    {
      id: "analytics",
      title: "Performance Analytics",
      description: "Detailed insights and progress tracking at the sub-skill level with visual dashboards",
      icon: <ChartBar className="h-5 w-5" />,
      screenshot: "/images/insights 5.png"
    }
  ];

  return (
    <>
      <SEOHead metadata={seoMetadata} />
      {course && <CourseSchema course={course} />}
      {course && faqs.length > 0 && (
        <FAQSchema
          faqs={faqs}
          pageUrl={`https://educourse.com.au/course/${slug}`}
        />
      )}
      <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-sm shadow-sm'
          : 'bg-transparent'
      }`}>
        <div className="container mx-auto px-4 h-16">
          <div className="flex items-center justify-between h-full">
            <Link to="/" className="flex items-center">
              <img
                src="/images/educourse-logo v2.png"
                alt="EduCourse"
                className="h-[140px] md:h-52"
              />
            </Link>

            <div className="flex items-center space-x-6">
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

                <a
                  href="https://insights.educourse.com.au/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#3B4F6B] hover:text-[#4ECDC4] transition-colors font-semibold"
                >
                  Insights
                </a>

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
                <a
                  href="https://insights.educourse.com.au/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-4 py-2 text-base font-semibold text-[#3B4F6B] hover:bg-[#E6F7F5] rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Insights
                </a>
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

      {/* SECTION 1: Hero Section - Test-Specific */}
      <section className="pt-24 md:pt-32 pb-16 md:pb-20 bg-gradient-to-b from-[#E6F7F5] to-white relative overflow-hidden">
        <div className="container mx-auto px-4 relative">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <motion.div
              className="space-y-8 md:space-y-10 text-center lg:text-left"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              {/* Trust Badge */}
              <motion.div
                className="inline-block"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <div className="inline-flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-sm border border-[#4ECDC4]/20">
                  <Shield className="h-4 w-4 text-[#4ECDC4]" />
                  <span className="text-sm font-medium text-[#3B4F6B]">{heroContent.socialProofStat}</span>
                </div>
              </motion.div>

              <div className="space-y-6 md:space-y-8">
                <motion.h1
                  className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#2C3E50] leading-tight"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  {heroContent.headline}
                </motion.h1>
                <motion.p
                  className="text-lg sm:text-xl text-[#4B5563] leading-relaxed max-w-lg mx-auto lg:mx-0"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  {heroContent.subheadline}
                </motion.p>
              </div>

              {/* Benefit Bullets */}
              <motion.div
                className="space-y-3 md:space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                {heroContent.bullets.map((bullet, index) => (
                  <motion.div
                    key={index}
                    className="flex items-start lg:items-center space-x-3 text-left"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
                  >
                    <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-[#4ECDC4] flex-shrink-0 mt-0.5 lg:mt-0" />
                    <span className="text-base md:text-lg text-[#3B4F6B] leading-relaxed">{bullet}</span>
                  </motion.div>
                ))}
              </motion.div>

              {/* CTA */}
              <motion.div
                className="space-y-4 pt-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.0 }}
              >
                <Button
                  size="lg"
                  className="bg-[#FF6B6B] hover:bg-[#FF5252] text-white px-6 md:px-8 py-6 md:py-7 text-base md:text-lg group w-full sm:w-auto shadow-xl hover:shadow-2xl transition-all"
                  onClick={handlePurchase}
                >
                  <div className="flex flex-col items-start">
                    <span className="font-bold">Start Improving Today - $199</span>
                    <span className="text-xs font-normal opacity-90 flex items-center">
                      <Shield className="h-3 w-3 mr-1" />
                      7-Day Money-Back Guarantee
                    </span>
                  </div>
                  <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>

                {/* Trust Signals */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 md:gap-6 text-sm text-[#6B7280]">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-[#4ECDC4]" />
                    <span>Instant Access</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-[#4ECDC4]" />
                    <span>12 Months Access</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-[#4ECDC4]" />
                    <span>All Devices</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Hero Images */}
            <div className="relative h-[300px] sm:h-[400px] lg:h-[500px] mt-8 lg:mt-0">
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

              <div className="hidden lg:block">
                <motion.div
                  className="absolute top-0 right-0 w-[400px] h-[240px] bg-white rounded-xl shadow-2xl overflow-hidden transform rotate-3 hover:rotate-1 hover:scale-105 transition-all duration-500 z-10"
                  initial={{ opacity: 0, y: 50, rotate: 10 }}
                  animate={{ opacity: 1, y: 0, rotate: 3 }}
                  transition={{ duration: 0.8, delay: 0.5, type: "spring", stiffness: 100 }}
                >
                  <img
                    src="/images/dashboard view.png"
                    alt="EduCourse Dashboard"
                    className="w-full h-full object-contain"
                    loading="eager"
                  />
                </motion.div>

                <motion.div
                  className="absolute top-16 left-8 w-[400px] h-[240px] bg-white rounded-xl shadow-2xl overflow-hidden transform -rotate-2 hover:rotate-0 hover:scale-105 transition-all duration-500 z-20"
                  initial={{ opacity: 0, y: 50, rotate: -10 }}
                  animate={{ opacity: 1, y: 0, rotate: -2 }}
                  transition={{ duration: 0.8, delay: 0.8, type: "spring", stiffness: 100 }}
                >
                  <img
                    src="/images/reading simulation.png"
                    alt="Reading Simulation"
                    className="w-full h-full object-contain"
                    loading="eager"
                  />
                </motion.div>

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

      {/* SECTION 2: Social Proof - Test-Specific Testimonials */}
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
              What Parents Are Saying About {course.title} Prep
            </h2>
            <p className="text-lg md:text-xl text-[#6B7280]">
              Real results from real families who used EduCourse
            </p>
          </motion.div>

          <div className="max-w-5xl mx-auto">
            <div className="relative bg-white rounded-2xl shadow-xl p-6 md:p-10 border-2 border-[#E6F7F5]">
              <div className="text-center space-y-6">
                <div className="flex justify-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-6 w-6 md:h-7 md:w-7 fill-[#FF6B6B] text-[#FF6B6B]" />
                  ))}
                </div>
                <AnimatePresence mode="wait">
                  <motion.blockquote
                    key={activeTestimonial}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                    className="text-lg md:text-xl text-[#2C3E50] leading-relaxed px-4"
                  >
                    "{testimonials[activeTestimonial]?.quote}"
                  </motion.blockquote>
                </AnimatePresence>
                <div className="space-y-1">
                  <p className="font-bold text-[#2C3E50] text-lg">{testimonials[activeTestimonial]?.name}</p>
                  <p className="text-[#6B7280]">{testimonials[activeTestimonial]?.details}</p>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-center items-center space-x-4 mt-8">
                <button
                  onClick={() => setActiveTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
                  className="p-2 rounded-full hover:bg-[#E6F7F5] transition-colors"
                  aria-label="Previous testimonial"
                >
                  <ChevronLeft className="h-5 w-5 text-[#4ECDC4]" />
                </button>
                <div className="flex space-x-2">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveTestimonial(index)}
                      className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                        index === activeTestimonial ? 'bg-[#4ECDC4] w-8' : 'bg-gray-300'
                      }`}
                      aria-label={`Go to testimonial ${index + 1}`}
                    />
                  ))}
                </div>
                <button
                  onClick={() => setActiveTestimonial((prev) => (prev + 1) % testimonials.length)}
                  className="p-2 rounded-full hover:bg-[#E6F7F5] transition-colors"
                  aria-label="Next testimonial"
                >
                  <ChevronRight className="h-5 w-5 text-[#4ECDC4]" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CTA after Testimonials */}
        <motion.div
          className="container mx-auto px-4 mt-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-lg text-[#6B7280] mb-6">
              Ready to join these successful families?
            </p>
            <Button
              size="lg"
              className="bg-[#FF6B6B] hover:bg-[#FF5252] text-white px-8 md:px-10 py-6 md:py-7 text-base md:text-lg shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
              onClick={handlePurchase}
            >
              <div className="flex flex-col items-start mr-3">
                <span className="font-bold">Start Your Preparation Today - $199</span>
                <span className="text-xs font-normal opacity-90">7-Day Money-Back Guarantee • Instant Access</span>
              </div>
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </motion.div>
      </section>

      {/* SECTION 3: Why Choose EduCourse? - Comparison Table */}
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
              Why Choose EduCourse?
            </h2>
            <p className="text-lg md:text-xl text-[#6B7280] max-w-3xl mx-auto">
              Compare us to traditional test prep options
            </p>
          </motion.div>

          {/* Comparison Table */}
          <motion.div
            className="max-w-5xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="bg-white rounded-xl shadow-xl overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-2">
                <div className="py-4 px-6 md:py-6 md:px-8 bg-[#6B7280]">
                  <h3 className="text-lg md:text-xl font-bold text-white">Traditional Approaches</h3>
                  <p className="text-sm text-white/90 mt-1">Tutors, Workbooks, Generic Platforms</p>
                </div>
                <div className="py-4 px-6 md:py-6 md:px-8 bg-[#4ECDC4]">
                  <h3 className="text-lg md:text-xl font-bold text-white">EduCourse</h3>
                  <p className="text-sm text-white/90 mt-1">Comprehensive Test Preparation</p>
                </div>
              </div>

              {/* Practice Questions Comparison */}
              <div className="grid grid-cols-2 border-b border-gray-200">
                <div className="py-6 px-6 md:px-8 bg-[#FEF2F2]">
                  <div className="flex items-start space-x-3">
                    <X className="h-5 w-5 text-[#DC2626] flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-[#2C3E50] mb-2">Practice Questions</h4>
                      <p className="text-[#6B7280] text-sm md:text-base leading-relaxed">
                        Tutors: <strong className="text-[#DC2626]">Limited to session time</strong> (maybe 20-30 questions per hour)
                      </p>
                      <p className="text-[#6B7280] text-sm md:text-base leading-relaxed mt-2">
                        Workbooks: <strong className="text-[#DC2626]">200-400 questions</strong> then you're done
                      </p>
                      <p className="text-[#6B7280] text-sm md:text-base leading-relaxed mt-2">
                        Generic platforms: Questions don't match your specific test format
                      </p>
                    </div>
                  </div>
                </div>
                <div className="py-6 px-6 md:px-8 bg-[#E6F7F5]">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-[#4ECDC4] flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-[#2C3E50] mb-2">Practice Questions</h4>
                      <p className="text-[#3B4F6B] text-sm md:text-base leading-relaxed">
                        <strong className="text-[#047857]">1000+ questions</strong> calibrated to your specific test
                      </p>
                      <p className="text-[#3B4F6B] text-sm md:text-base leading-relaxed mt-2">
                        <strong className="text-[#047857]">5 full practice tests</strong> with real-time conditions to simulate the real exam
                      </p>
                      <p className="text-[#3B4F6B] text-sm md:text-base leading-relaxed mt-2">
                        <strong className="text-[#047857]">Covers all sections</strong> of your specific test
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Insights Comparison */}
              <div className="grid grid-cols-2 border-b border-gray-200">
                <div className="py-6 px-6 md:px-8 bg-[#FEF2F2]">
                  <div className="flex items-start space-x-3">
                    <X className="h-5 w-5 text-[#DC2626] flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-[#2C3E50] mb-2">Performance Insights</h4>
                      <p className="text-[#6B7280] text-sm md:text-base leading-relaxed">
                        Tutors: <strong className="text-[#DC2626]">General feedback</strong> - "needs work on reading"
                      </p>
                      <p className="text-[#6B7280] text-sm md:text-base leading-relaxed mt-2">
                        Workbooks: <strong className="text-[#DC2626]">Answer key only</strong> - no insights on patterns
                      </p>
                      <p className="text-[#6B7280] text-sm md:text-base leading-relaxed mt-2">
                        You guess where to focus - wasting time on already-strong areas
                      </p>
                    </div>
                  </div>
                </div>
                <div className="py-6 px-6 md:px-8 bg-[#E6F7F5]">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-[#4ECDC4] flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-[#2C3E50] mb-2">Performance Insights</h4>
                      <p className="text-[#3B4F6B] text-sm md:text-base leading-relaxed">
                        <strong className="text-[#047857]">Sub-skill level analytics</strong> across 50+ specific skills
                      </p>
                      <p className="text-[#3B4F6B] text-sm md:text-base leading-relaxed mt-2">
                        <strong className="text-[#047857]">Detailed feedback and walkthroughs</strong> for every question
                      </p>
                      <p className="text-[#3B4F6B] text-sm md:text-base leading-relaxed mt-2">
                        <strong className="text-[#047857]">Diagnostic-driven</strong> practice focused on your gaps
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cost Comparison */}
              <div className="grid grid-cols-2">
                <div className="py-6 px-6 md:px-8 bg-[#FEF2F2]">
                  <div className="flex items-start space-x-3">
                    <X className="h-5 w-5 text-[#DC2626] flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-[#2C3E50] mb-2">Cost</h4>
                      <p className="text-[#6B7280] text-sm md:text-base leading-relaxed">
                        <strong className="text-[#DC2626]">$800-1,500+</strong> for private tutoring (8-12 sessions at $80-150/hour)
                      </p>
                      <p className="text-[#6B7280] text-sm md:text-base leading-relaxed mt-2">
                        <strong className="text-[#DC2626]">$80-150</strong> for workbooks with limited questions
                      </p>
                    </div>
                  </div>
                </div>
                <div className="py-6 px-6 md:px-8 bg-[#E6F7F5]">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-[#4ECDC4] flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-[#2C3E50] mb-2">Cost</h4>
                      <p className="text-[#3B4F6B] text-sm md:text-base leading-relaxed">
                        <strong className="text-[#047857]">Only $199</strong> for 12 months unlimited access
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* CTA after comparison */}
          <motion.div
            className="text-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <div className="max-w-3xl mx-auto">
              <p className="text-lg text-[#3B4F6B] mb-6 font-medium">
                Get more for less - with our 7-day money-back guarantee
              </p>
              <Button
                size="lg"
                className="bg-gradient-to-r from-[#4ECDC4] to-[#6366F1] hover:from-[#45B8AF] hover:to-[#5B5BD6] text-white px-8 md:px-10 py-6 md:py-7 text-base md:text-lg shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
                onClick={handlePurchase}
              >
                <div className="flex items-center">
                  <div className="flex flex-col items-start mr-3">
                    <span className="font-bold">Get Started Now - Only $199</span>
                    <span className="text-xs font-normal opacity-95 flex items-center">
                      <Shield className="h-3 w-3 mr-1" />
                      100% Money-Back Guarantee
                    </span>
                  </div>
                  <ArrowRight className="h-5 w-5 ml-2" />
                </div>
              </Button>
              <p className="text-sm text-[#6B7280] mt-4">
                Join {heroContent.socialProofStat.replace('Join ', '').toLowerCase()}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 4: What's Included - Enhanced */}
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
              Everything You Need for Success
            </h2>
            <p className="text-lg md:text-xl text-[#6B7280] max-w-3xl mx-auto">
              Comprehensive preparation that covers every aspect of the {course.title} test
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                title: "1000+ Practice Questions",
                description: "Expert-crafted questions calibrated to match the exact difficulty and format of the real test - 3x more practice than leading competitors"
              },
              {
                title: "5 Full-Length Practice Tests",
                description: "Complete timed exams that perfectly replicate the real test experience. Students report feeling 'like I'd already done this before' on exam day"
              },
              {
                title: "Unlimited AI Writing Feedback",
                description: "Get instant, detailed feedback on every writing task - worth $500+ in tutor fees. Improve structure, vocabulary, and persuasive power in seconds, not days"
              },
              {
                title: "Sub-Skill Level Analytics",
                description: "Laser-focused insights showing performance across 50+ sub-skills. No wasted time on what's already mastered - rapid improvement where it matters most"
              },
              {
                title: "Visual Progress Dashboards",
                description: "Track improvement week by week with detailed charts and graphs. See exactly where your child stands vs test requirements and watch percentile gains in real-time"
              },
              {
                title: "Multi-Device Access",
                description: "Practice at their pace, on their schedule. Works perfectly on iPad, laptop, or desktop - progress syncs automatically across all devices"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="flex items-start space-x-4 bg-[#F8F9FA] p-6 rounded-xl hover:shadow-lg transition-all duration-300"
              >
                <CheckCircle className="h-6 w-6 text-[#22C55E] flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-[#2C3E50] mb-2">{feature.title}</h3>
                  <p className="text-sm md:text-base text-[#6B7280] leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Outcome Stat */}
          <motion.div
            className="text-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="inline-block bg-gradient-to-r from-[#4ECDC4] to-[#6366F1] text-white px-8 py-4 rounded-full shadow-lg">
              <p className="text-lg font-semibold">
                Average improvement: 20+ percentile points in 8-12 weeks
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 5: How Platform Works - Methodology */}
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
              Our Proven Learning Platform
            </h2>
            <p className="text-lg md:text-xl text-[#6B7280] max-w-3xl mx-auto">
              From diagnostic to mastery - see exactly how our platform works
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
                      className={`w-full text-left p-6 rounded-xl transition-all duration-300 ${
                        activeFeature === feature.id
                          ? 'bg-white shadow-xl border-2 border-[#6366F1]'
                          : 'bg-white/50 hover:bg-white border-2 border-transparent hover:shadow-lg'
                      }`}
                    >
                      <div className="flex items-start space-x-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                          activeFeature === feature.id
                            ? 'bg-gradient-to-br from-[#4ECDC4] to-[#6366F1] text-white scale-110'
                            : 'bg-gray-100 text-[#6B7280]'
                        }`}>
                          {feature.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className={`text-xl font-bold mb-2 transition-colors ${
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
                        <img
                          src={howItWorksData.find(f => f.id === activeFeature)?.screenshot}
                          alt={`${howItWorksData.find(f => f.id === activeFeature)?.title} Interface`}
                          className="w-full h-full object-contain"
                          loading="lazy"
                        />
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Platform Demo GIF */}
            <motion.div
              className="mt-16"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <div className="text-center mb-8">
                <h3 className="text-2xl md:text-3xl font-bold text-[#2C3E50] mb-3">
                  See Your Child's Progress in Real-Time
                </h3>
                <p className="text-lg text-[#6B7280]">
                  Track improvement across 50+ sub-skills with visual dashboards
                </p>
              </div>
              <div className="bg-gradient-to-br from-[#4ECDC4] to-[#6366F1] rounded-2xl p-6 max-w-4xl mx-auto">
                <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
                  <div className="aspect-video flex items-center justify-center">
                    <img
                      src="/images/CleanShot 2025-07-28 at 19.48.04.gif"
                      alt="Platform Analytics Demo"
                      className="w-full h-full object-contain"
                      loading="lazy"
                      style={{ imageRendering: 'crisp-edges' }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECTION 6: School Logos & Outcomes */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#2C3E50] mb-4">
              Students Using EduCourse Are Attending These Schools
            </h2>
            <p className="text-lg md:text-xl text-[#6B7280]">
              Join families whose children gained entry to Australia's top schools
            </p>
          </motion.div>

          {/* School Logos Carousel */}
          <div className="relative overflow-hidden mb-12">
            <motion.div
              className="flex items-center space-x-8"
              animate={{
                x: [0, -allSchoolLogos.length * 140]
              }}
              transition={{
                duration: 70,
                ease: "linear",
                repeat: Infinity
              }}
            >
              {[...allSchoolLogos, ...allSchoolLogos].map((school, index) => (
                <div
                  key={`${school.name}-${index}`}
                  className="flex-shrink-0 w-[120px] h-[60px] md:w-[150px] md:h-[80px] flex items-center justify-center"
                >
                  <img
                    src={school.logo}
                    alt={`${school.name} logo`}
                    className="max-w-full max-h-full object-contain grayscale hover:grayscale-0 transition-all duration-300"
                  />
                </div>
              ))}
            </motion.div>
          </div>

          {/* Outcome Stat */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <div className="inline-block bg-[#F8F9FA] px-10 py-6 rounded-2xl border-2 border-[#4ECDC4]/20">
              <p className="text-xl md:text-2xl font-bold text-[#2C3E50] mb-2">
                92% of EduCourse families would recommend us
              </p>
              <p className="text-[#6B7280]">
                Based on post-purchase surveys from 500+ families
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 7: Test Details - About the Test (Moved Down) */}
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
              Understanding the {course.title} Test
            </h2>
            <p className="text-lg md:text-xl text-[#6B7280] max-w-3xl mx-auto">
              Detailed breakdown of test sections, timing, and sub-skills assessed
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
                  className="bg-white rounded-xl border-2 border-gray-100 p-6 md:p-8 shadow-lg"
                >
                  <div className="flex items-start space-x-4 mb-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#4ECDC4] to-[#6366F1] rounded-full flex items-center justify-center text-white flex-shrink-0">
                      {SECTION_ICONS[activeTestSection] || <BookOpen className="h-7 w-7" />}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl md:text-2xl font-bold text-[#2C3E50] mb-2">
                        {activeTestSection}
                      </h3>
                      <p className="text-[#6B7280] mb-4 leading-relaxed">
                        {sectionDescriptions[activeTestSection] || "Master key concepts and strategies for this section"}
                      </p>

                      <div className="flex items-center space-x-6 mb-4">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-[#6366F1]" />
                          <span className="text-sm font-medium text-[#2C3E50]">
                            {(testSections[activeTestSection] as any)?.questions || 0} questions
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
                  <div>
                    <h4 className="text-lg font-semibold text-[#2C3E50] mb-4">Sub-skills We Practice:</h4>
                    <div className="grid md:grid-cols-2 gap-3">
                      {getSubSkillsForSection(testKey, activeTestSection).map((skill, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <CheckCircle className="h-4 w-4 text-[#4ECDC4] flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-[#6B7280] leading-relaxed">{skill}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* SECTION 8: How It Works - 5 Steps */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-[#2C3E50] mb-6">
              Getting Started Is Simple
            </h2>
            <p className="text-xl text-[#6B7280] max-w-2xl mx-auto">
              Five easy steps from purchase to improvement
            </p>
          </motion.div>

          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-4">
              {[
                {
                  step: 1,
                  title: "Purchase",
                  description: "Choose your test package and complete secure checkout"
                },
                {
                  step: 2,
                  title: "Access",
                  description: "Get instant login credentials via email within minutes"
                },
                {
                  step: 3,
                  title: "Diagnose",
                  description: "Take diagnostic test to identify strengths and gaps"
                },
                {
                  step: 4,
                  title: "Practice",
                  description: "Complete targeted drills personalised to diagnostic results"
                },
                {
                  step: 5,
                  title: "Improve",
                  description: "Track progress weekly and watch percentile scores rise"
                }
              ].map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="relative text-center group"
                >
                  {index < 4 && (
                    <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-[#4ECDC4] to-transparent z-0" />
                  )}

                  <div className="relative bg-white p-8 rounded-2xl shadow-lg group-hover:shadow-2xl transition-all duration-300 border-2 border-transparent group-hover:border-[#4ECDC4]/30 z-10 h-full min-h-[280px] flex flex-col">
                    <div className="inline-flex items-center justify-center w-16 h-16 mb-6 bg-gradient-to-br from-[#4ECDC4] to-[#6366F1] text-white rounded-full font-bold text-lg group-hover:scale-110 transition-transform duration-300 mx-auto">
                      {step.step}
                    </div>

                    <h3 className="text-xl font-semibold text-[#2C3E50] mb-3 group-hover:text-[#6366F1] transition-colors duration-300">
                      {step.title}
                    </h3>
                    <p className="text-[#6B7280] leading-relaxed flex-grow">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            className="text-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            viewport={{ once: true }}
          >
            <p className="text-lg text-[#6B7280] mb-6">
              Most families see measurable improvement within 3-4 weeks of starting
            </p>
            <Button
              size="lg"
              className="bg-[#6366F1] hover:bg-[#5B5BD6] text-white px-8 py-4 text-lg shadow-xl hover:shadow-2xl transition-all duration-300"
              onClick={handlePurchase}
            >
              Start Your Journey Today - $199
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* SECTION 9: FAQ */}
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
              Questions? We've Got Answers
            </h2>
            <p className="text-lg md:text-xl text-[#6B7280]">
              Everything you need to know about EduCourse test preparation
            </p>
          </motion.div>

          <motion.div
            className="max-w-3xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <Accordion type="single" collapsible className="w-full bg-white rounded-xl shadow-sm">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border-b border-gray-200 last:border-0 px-6">
                  <AccordionTrigger className="text-lg font-medium text-[#2C3E50] hover:text-[#4ECDC4] transition-colors py-6 text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-[#6B7280] pb-6 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>

          <motion.div
            className="text-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <p className="text-lg text-[#6B7280] mb-6">
              Still have questions? We're here to help!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-[#6366F1] text-[#6366F1] hover:bg-[#6366F1] hover:text-white"
                asChild
              >
                <a href="mailto:learning@educourse.com.au">Contact Us</a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 10: Final CTA */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-[#4ECDC4] to-[#6366F1] relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="text-center max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            {/* Urgency Message */}
            <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full mb-8">
              <Clock className="h-5 w-5 text-white" />
              <p className="text-white font-medium">
                Most families start preparation 8-12 weeks before the test date
              </p>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Help Your Child Succeed?
            </h2>
            <p className="text-lg md:text-xl text-white/95 mb-8 leading-relaxed">
              Join {heroContent.socialProofStat.replace('Join ', '').toLowerCase()} who've seen an average 20+ percentile improvement with EduCourse
            </p>

            {/* Guarantee Badge */}
            <div className="inline-flex items-center justify-center w-32 h-32 bg-white rounded-full mb-8 shadow-2xl">
              <div className="text-center">
                <Shield className="h-12 w-12 text-[#4ECDC4] mx-auto mb-1" />
                <p className="text-xs font-bold text-[#2C3E50]">7-Day</p>
                <p className="text-xs font-bold text-[#2C3E50]">Guarantee</p>
              </div>
            </div>

            <Button
              size="lg"
              className="bg-[#FF6B6B] hover:bg-[#FF5252] text-white px-10 py-7 text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105"
              onClick={handlePurchase}
            >
              <div className="flex flex-col items-start mr-3">
                <span className="font-bold text-xl">Start Risk-Free Today - $199</span>
                <span className="text-sm font-normal opacity-95">7-Day Money-Back Guarantee • Instant Access</span>
              </div>
              <ArrowRight className="h-6 w-6" />
            </Button>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-white/95">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5" />
                <span>Instant access to all content</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5" />
                <span>12 months unlimited practice</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5" />
                <span>Works on all devices</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>100% money-back guarantee</span>
              </div>
            </div>

            {/* Final Social Proof */}
            <motion.div
              className="mt-12 bg-white/10 backdrop-blur-sm rounded-2xl p-6 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <div className="flex justify-center space-x-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-white text-white" />
                ))}
              </div>
              <p className="text-white italic leading-relaxed">
                "Best decision we made for our child's test preparation. The platform is comprehensive, the feedback is instant, and the results speak for themselves."
              </p>
              <p className="text-white/80 text-sm mt-3">- Verified EduCourse Parent</p>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
    </>
  );
};

export default CourseDetail;
