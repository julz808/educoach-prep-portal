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
  AlertCircle,
  Calendar,
  MapPin,
  Users,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { courses } from '@/data/courses';
import { getSchoolBySlug } from '@/data/programmaticSEO/schoolsDatabase';
import { getTestSections, getTestTotals } from '@/data/programmaticSEO/testDetails';
import { getTestimonialsForTest } from '@/data/testimonials';
import { getPackageDetails } from '@/data/packageDetails';
import { TEST_STRUCTURES, SECTION_TO_SUB_SKILLS, UNIFIED_SUB_SKILLS } from '@/data/curriculumData';
import { toast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { redirectToCheckout } from '@/services/stripeService';
import { SEOHead } from '@/components/SEOHead';

// Test section descriptions mapping
const TEST_SECTION_DESCRIPTIONS: { [key: string]: { [key: string]: string } } = {
  "VIC Selective Entry": {
    "Numerical Reasoning": "Tests mathematical problem-solving, number patterns, algebraic thinking, and geometric reasoning. Questions assess students' ability to work with numbers, identify patterns, and apply mathematical logic at an advanced level.",
    "Reading Comprehension": "Assesses interpretive comprehension, inferential reasoning, vocabulary in context, text structure analysis, and the ability to critically analyze fiction and non-fiction passages.",
    "Verbal Reasoning": "Tests analogical reasoning, word relationships, vocabulary knowledge, and logical verbal connections. Students must demonstrate sophisticated language processing and pattern recognition skills.",
    "Quantitative Reasoning": "Focuses on number sense, pattern recognition, proportional reasoning, and abstract quantitative thinking without requiring advanced mathematical knowledge.",
    "Writing": "Students complete both a creative narrative (15 minutes) and a persuasive/analytical piece (30 minutes). This tests versatility, vocabulary, structural organization, and ability to write effectively under time pressure."
  }
};

// Icon mapping for test sections
const SECTION_ICONS: { [key: string]: React.ReactNode } = {
  "Writing": <PenTool className="h-6 w-6" />,
  "Numerical Reasoning": <Calculator className="h-6 w-6" />,
  "Reading Comprehension": <BookOpen className="h-6 w-6" />,
  "Verbal Reasoning": <MessageSquare className="h-6 w-6" />,
  "Quantitative Reasoning": <Brain className="h-6 w-6" />
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

// Get the test name key for TEST_STRUCTURES
const getTestStructureKey = (testType: string): string => {
  const mappings: { [key: string]: string } = {
    "vic-selective": "VIC Selective Entry (Year 9 Entry)",
    "nsw-selective": "NSW Selective Entry (Year 7 Entry)",
    "acer-scholarship": "ACER Scholarship (Year 7 Entry)",
    "edutest-scholarship": "EduTest Scholarship (Year 7 Entry)"
  };
  return mappings[testType] || testType;
};

// Helper to format dates
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-AU', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatDateLong = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-AU', { month: 'long', day: 'numeric', year: 'numeric' });
};

const SchoolPrepPage = () => {
  const { productSlug, schoolSlug } = useParams();
  const [school, setSchool] = useState<any>(undefined);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTestSection, setActiveTestSection] = useState<string>("");
  const [activeFeature, setActiveFeature] = useState<string>("diagnostic");
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  // Get test-specific content
  const testimonials = productSlug ? getTestimonialsForTest(productSlug) : [];
  const packageDetails = productSlug ? getPackageDetails(productSlug) : null;

  useEffect(() => {
    if (productSlug && schoolSlug) {
      const foundSchool = getSchoolBySlug(productSlug, schoolSlug);

      if (foundSchool) {
        setSchool(foundSchool);
        document.title = `${foundSchool.name} Preparation 2027 | EduCourse`;
        window.scrollTo(0, 0);

        // Set first test section as active
        const testSections = getTestSections(foundSchool.testType);
        if (testSections.length > 0) {
          setActiveTestSection(testSections[0].name);
        }
      }
    }
  }, [productSlug, schoolSlug]);

  // Scroll effect for nav transparency
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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
    if (!productSlug) {
      toast({
        title: "Error",
        description: "Product not found. Please refresh the page and try again.",
        variant: "destructive"
      });
      return;
    }

    try {
      toast({
        title: "Redirecting to checkout...",
        description: "You'll be redirected to our secure payment page.",
      });

      localStorage.setItem('purchasedCourse', productSlug);
      await redirectToCheckout(productSlug);
    } catch (error) {
      console.error('Purchase error:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (!school) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4ECDC4] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading school details...</p>
        </div>
      </div>
    );
  }

  const testSections = getTestSections(school.testType);
  const testTotals = getTestTotals(testSections);
  const sectionDescriptions = TEST_SECTION_DESCRIPTIONS["VIC Selective Entry"] || {};

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
      <SEOHead metadata={{
        title: school.metaTitle,
        description: school.metaDescription,
        canonical: school.canonicalUrl,
        ogTitle: school.metaTitle,
        ogDescription: school.metaDescription,
        ogImage: "https://educourse.com.au/images/og-image.png"
      }} />
      <div className="min-h-screen bg-white">
      {/* Navigation Bar - IDENTICAL TO COURSEDETAIL */}
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

      {/* SECTION 1: Hero Section - PRODUCT-FOCUSED */}
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
                  <span className="text-sm font-medium text-[#3B4F6B]">Join 2,000+ families using EduCourse</span>
                </div>
              </motion.div>

              <div className="space-y-6 md:space-y-8">
                <motion.h1
                  className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#2C3E50] leading-tight"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  {school.name} Selective Entry Prep 2027
                </motion.h1>
                <motion.p
                  className="text-lg sm:text-xl text-[#4B5563] leading-relaxed max-w-lg mx-auto lg:mx-0"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  Master the VIC Selective Entry Test with 1000+ practice questions, diagnostic assessments, and personalised learning paths
                </motion.p>
              </div>

              {/* Benefit Bullets - PRODUCT-FOCUSED */}
              <motion.div
                className="space-y-3 md:space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                {[
                  '1000+ practice questions calibrated to the VIC Selective Entry Test',
                  '5 full-length practice tests with real exam conditions',
                  'Diagnostic assessment to identify strengths and gaps',
                  'Personalised drills targeting your weak areas',
                  'Detailed performance analytics at the sub-skill level'
                ].map((bullet, index) => (
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

            {/* Hero Images - IDENTICAL TO COURSEDETAIL */}
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

      {/* SECTION 2: School Key Test Facts & Dates */}
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
              {school.name} - Key Test Dates 2026
            </h2>
            <p className="text-lg md:text-xl text-[#6B7280]">
              Important dates and test information for {school.name} selective entry
            </p>
          </motion.div>

          <div className="max-w-5xl mx-auto">
            {/* Test Dates Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <motion.div
                className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
              >
                <div className="flex items-center space-x-3 mb-3">
                  <Calendar className="h-6 w-6 text-[#4ECDC4]" />
                  <h3 className="font-bold text-[#2C3E50]">Applications Open</h3>
                </div>
                <p className="text-2xl font-bold text-[#6366F1]">
                  {formatDateLong(school.testDates.applicationOpen)}
                </p>
              </motion.div>

              <motion.div
                className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <div className="flex items-center space-x-3 mb-3">
                  <Clock className="h-6 w-6 text-[#FF6B6B]" />
                  <h3 className="font-bold text-[#2C3E50]">Test Date</h3>
                </div>
                <p className="text-2xl font-bold text-[#6366F1]">
                  {formatDateLong(school.testDates.testDate)}
                </p>
              </motion.div>

              <motion.div
                className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                viewport={{ once: true }}
              >
                <div className="flex items-center space-x-3 mb-3">
                  <Award className="h-6 w-6 text-[#6366F1]" />
                  <h3 className="font-bold text-[#2C3E50]">Results Released</h3>
                </div>
                <p className="text-2xl font-bold text-[#6366F1]">
                  {formatDateLong(school.testDates.resultsDate)}
                </p>
              </motion.div>
            </div>

            {/* Understanding the VIC Selective Entry Test */}
            <motion.div
              className="bg-white rounded-xl p-8 shadow-lg mb-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <div className="text-center mb-8">
                <h3 className="text-2xl md:text-3xl font-bold text-[#2C3E50] mb-3">Understanding the VIC Selective Entry Test</h3>
                <p className="text-base md:text-lg text-[#6B7280]">Detailed breakdown of test sections, timing, and sub-skills assessed</p>
              </div>

              {/* Tab Navigation */}
              <div className="flex flex-wrap justify-center gap-3 mb-8 border-b border-gray-200 pb-4">
                {testSections.map((section, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveTestSection(section.name)}
                    className={`px-4 py-2 text-sm md:text-base font-medium transition-all rounded-t-lg ${
                      activeTestSection === section.name
                        ? 'text-[#6366F1] border-b-2 border-[#6366F1] -mb-[17px]'
                        : 'text-[#6B7280] hover:text-[#6366F1]'
                    }`}
                  >
                    {section.name}
                  </button>
                ))}
              </div>

              {/* Active Section Content */}
              <AnimatePresence mode="wait">
                {activeTestSection && (
                  <motion.div
                    key={activeTestSection}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="bg-gray-50 rounded-xl p-6 md:p-8"
                  >
                    {(() => {
                      const section = testSections.find(s => s.name === activeTestSection);
                      if (!section) return null;

                      return (
                        <div>
                          <div className="flex items-start space-x-4 mb-6">
                            <div className="w-14 h-14 bg-[#6366F1] rounded-full flex items-center justify-center text-white flex-shrink-0">
                              {SECTION_ICONS[section.name] || <BookOpen className="h-7 w-7" />}
                            </div>
                            <div className="flex-1">
                              <h4 className="text-xl md:text-2xl font-bold text-[#2C3E50] mb-3">{section.name}</h4>
                              <p className="text-[#6B7280] leading-relaxed mb-4">
                                {sectionDescriptions[section.name] || section.skillsTested[0]}
                              </p>
                              <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm">
                                <div className="flex items-center space-x-2">
                                  <FileText className="h-4 w-4 text-[#6366F1]" />
                                  <span className="font-medium text-[#2C3E50]">
                                    <strong>{section.questions}</strong> questions
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Clock className="h-4 w-4 text-[#6366F1]" />
                                  <span className="font-medium text-[#2C3E50]">
                                    <strong>{section.timeMinutes}</strong> minutes
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Sub-skills */}
                          <div>
                            <h5 className="text-lg font-semibold text-[#2C3E50] mb-4">Sub-skills We Practice:</h5>
                            <div className="grid md:grid-cols-2 gap-3">
                              {section.skillsTested.map((skill, index) => (
                                <div key={index} className="flex items-start space-x-2">
                                  <CheckCircle className="h-5 w-5 text-[#4ECDC4] flex-shrink-0 mt-0.5" />
                                  <span className="text-sm md:text-base text-[#6B7280] leading-relaxed">{skill}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* School-Specific Information */}
            <motion.div
              className="bg-white rounded-xl border-2 border-gray-100 p-8 shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-bold text-[#2C3E50] mb-6 text-center">About {school.name}</h3>
              <p className="text-[#6B7280] text-center mb-6 max-w-3xl mx-auto leading-relaxed text-base">
                {school.id === 'melbourne-high-school' ? (
                  <>
                    Established in 1905 as Victoria's first state secondary school, Melbourne High School stands as the state's premier boys' selective entry high school. Located in South Yarra, the school has built an exceptional academic tradition over more than a century, consistently ranking among Victoria's top-performing schools. Each year, over 1,400 students compete for approximately 250 Year 9 places, entering through a rigorous selective entry examination. With a median ATAR consistently above 95 and over 99% of graduates pursuing tertiary education, Melbourne High produces some of the state's highest achieving students who go on to leading universities including the University of Melbourne and Monash University.
                  </>
                ) : school.id === 'mac-robertson-girls-high-school' ? (
                  <>
                    Mac.Robertson Girls' High School, established in 1905, is Victoria's only government selective entry high school exclusively for girls. Located in Melbourne's CBD, "Mac.Rob" has built a distinguished reputation as one of Australia's premier academic institutions for young women. Each year, approximately 6,000 girls compete for just 250 Year 9 places through the highly competitive ACER Selective Entry Test. With consistently exceptional VCE results and a median ATAR regularly exceeding 95, the school maintains its position as Victoria's top-ranked girls' school. Students benefit from strong programs across STEM, humanities, and the arts, with the vast majority pursuing tertiary education at leading Australian universities.
                  </>
                ) : school.id === 'nossal-high-school' ? (
                  <>
                    Named after Nobel laureate Professor Gustav Nossal, Nossal High School opened in 2010 as Victoria's third government selective entry high school. Located in Berwick in Melbourne's south-eastern suburbs, this co-educational school has rapidly established itself as a powerhouse of academic excellence. Approximately 180 Year 9 students are selected annually from a pool of thousands of applicants through the ACER Selective Entry Test. With a strong focus on science and research, complemented by robust programs in humanities and the arts, Nossal consistently delivers outstanding VCE results. The school's modern facilities and culture of innovation provide students with exceptional pathways to elite universities and careers in research, medicine, engineering, and beyond.
                  </>
                ) : school.id === 'suzanne-cory-high-school' ? (
                  <>
                    Named after Nobel laureate Professor Suzanne Cory, Suzanne Cory High School opened in 2011 to serve Melbourne's western region. This co-educational selective entry school in Werribee has quickly built a strong reputation for academic excellence and innovation. Each year, approximately 180 Year 9 students are selected through the rigorous ACER Selective Entry Test from thousands of applicants across western Melbourne and beyond. With a particular emphasis on STEM education and 21st-century learning, the school consistently achieves impressive VCE results. Students benefit from state-of-the-art facilities, a culture of curiosity and innovation, and strong pathways to top Australian universities in fields ranging from science and engineering to humanities and the arts.
                  </>
                ) : (
                  school.keyFacts.slice(0, 3).join('. ') + '.'
                )}
              </p>

              {/* School Stats Grid */}
              <div className="grid md:grid-cols-4 gap-6">
                <div className="text-center">
                  <TrendingUp className="h-8 w-8 text-[#4ECDC4] mx-auto mb-2" />
                  <p className="text-sm text-[#6B7280] mb-1">Median ATAR</p>
                  <p className="text-2xl font-bold text-[#2C3E50]">
                    {school.id === 'melbourne-high-school' || school.id === 'mac-robertson-girls-high-school' ? '95+' : '94+'}
                  </p>
                </div>

                <div className="text-center">
                  <TrendingUp className="h-8 w-8 text-[#4ECDC4] mx-auto mb-2" />
                  <p className="text-sm text-[#6B7280] mb-1">ICSEA Score</p>
                  <p className="text-2xl font-bold text-[#2C3E50]">{school.icsea}</p>
                  <p className="text-xs text-[#6B7280]">(National avg: 1000)</p>
                </div>

                <div className="text-center">
                  <Users className="h-8 w-8 text-[#4ECDC4] mx-auto mb-2" />
                  <p className="text-sm text-[#6B7280] mb-1">Total Students</p>
                  <p className="text-2xl font-bold text-[#2C3E50]">{school.totalEnrollment?.toLocaleString()}</p>
                </div>

                <div className="text-center">
                  <Target className="h-8 w-8 text-[#4ECDC4] mx-auto mb-2" />
                  <p className="text-sm text-[#6B7280] mb-1">School Type</p>
                  <p className="text-lg font-bold text-[#2C3E50] capitalize">
                    {school.gender === 'boys' ? 'Boys Only' : school.gender === 'girls' ? 'Girls Only' : 'Co-Educational'}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECTION 2: Pricing Card - IDENTICAL TO COURSEDETAIL */}
      {packageDetails && (
        <section className="py-16 md:py-20 bg-[#F8F9FA]">
          <div className="container mx-auto px-4">
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#2C3E50] mb-4">
                Everything You Need for Success
              </h2>
              <p className="text-lg md:text-xl text-[#6B7280]">
                Complete preparation package with unlimited access
              </p>
            </motion.div>

            <motion.div
              className="max-w-lg mx-auto"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              {/* Pricing Card */}
              <div className="bg-white rounded-2xl shadow-2xl border-4 border-[#4ECDC4] overflow-hidden">
                {/* Logo/Icon at top */}
                <div className="flex justify-center pt-8 pb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#4ECDC4] to-[#6366F1] rounded-full flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-white" />
                  </div>
                </div>

                {/* Title */}
                <div className="text-center px-6 pb-6">
                  <h2 className="text-2xl md:text-3xl font-bold text-[#6366F1] mb-2">
                    VIC Selective Entry Preparation Package
                  </h2>
                  <p className="text-[#6B7280] text-sm">
                    Now includes {packageDetails.roundedQuestions.toLocaleString()}+ questions
                  </p>
                </div>

                {/* Price */}
                <div className="text-center pb-6">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <span className="text-3xl md:text-4xl font-bold text-[#047857]">$199</span>
                    <span className="text-2xl text-[#DC2626] line-through">$249</span>
                  </div>
                  <p className="text-[#6B7280] text-sm">Valid for 365 days</p>
                </div>

                {/* What's Included List */}
                <div className="px-8 pb-8">
                  <div className="space-y-3">
                    {packageDetails.items.map((item, index) => (
                      <div key={index}>
                        {/* Main Item */}
                        <div className="flex items-start space-x-3">
                          <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5 text-[#22C55E]" />
                          <span className={`text-[#2C3E50] ${item.highlight ? 'font-semibold' : ''}`}>
                            {item.count === 1 && !item.highlight ? (
                              item.label
                            ) : (
                              <>
                                {item.count.toLocaleString()}+ {item.label}
                              </>
                            )}
                          </span>
                        </div>

                        {/* Sub Items */}
                        {item.subItems && item.subItems.length > 0 && (
                          <div className="ml-8 mt-2 space-y-2">
                            {item.subItems.map((subItem, subIndex) => (
                              <div key={subIndex} className="flex items-start space-x-2">
                                <span className="text-[#22C55E] text-sm">•</span>
                                <span className="text-[#2C3E50] text-sm">
                                  {subItem.count} x {subItem.label}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA Button */}
                <div className="px-8 pb-8">
                  <Button
                    size="lg"
                    className="w-full bg-gradient-to-r from-[#4ECDC4] to-[#6366F1] hover:from-[#45B8AF] hover:to-[#5B5BD6] text-white py-6 text-lg font-bold shadow-xl hover:shadow-2xl transition-all"
                    onClick={handlePurchase}
                  >
                    Get VIC Selective Entry - $199
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* SECTION 3: Social Proof - Testimonials - IDENTICAL TO COURSEDETAIL */}
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
              What Parents Are Saying About VIC Selective Entry Prep
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

      {/* SECTION 4: Why Choose EduCourse? - Comparison Table - IDENTICAL TO COURSEDETAIL */}
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
                        <strong className="text-[#047857]">1000+ questions</strong> calibrated to VIC Selective Entry
                      </p>
                      <p className="text-[#3B4F6B] text-sm md:text-base leading-relaxed mt-2">
                        <strong className="text-[#047857]">5 full practice tests</strong> with real-time conditions
                      </p>
                      <p className="text-[#3B4F6B] text-sm md:text-base leading-relaxed mt-2">
                        <strong className="text-[#047857]">Covers all sections</strong> of the VIC test
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
                        <strong className="text-[#047857]">Detailed feedback</strong> for every question
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
            </div>
          </motion.div>
        </div>
      </section>


      {/* SECTION 6: How Platform Works - IDENTICAL TO COURSEDETAIL */}
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

      {/* SECTION 7: How It Works - 5 Steps - IDENTICAL TO COURSEDETAIL */}
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

      {/* SECTION 8: FAQ - SCHOOL-SPECIFIC */}
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
              Everything you need to know about {school.name} and EduCourse preparation
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
              {school.faqs.map((faq: any, index: number) => (
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

      {/* SECTION 9: Final CTA - IDENTICAL TO COURSEDETAIL */}
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
              Join 2,000+ families who've seen an average 20+ percentile improvement with EduCourse
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

export default SchoolPrepPage;
