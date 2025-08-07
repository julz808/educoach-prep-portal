import { useEffect, useState, useLayoutEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { courses } from '@/data/courses';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useRef } from 'react';
import Lenis from 'lenis';
import { 
  ChevronDown, 
  User, 
  Target, 
  TrendingUp, 
  Award, 
  BookOpen, 
  BarChart3, 
  Clock, 
  CheckCircle, 
  Play,
  ArrowRight,
  Star,
  Sparkles,
  Zap,
  Eye,
  Brain,
  Trophy,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Activity,
  FileText
} from 'lucide-react';

// Animated Text Component for letter-by-letter reveals
const AnimatedText = ({ text, className = "", delay = 0 }: { text: string, className?: string, delay?: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const letters = text.split("");

  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.03, delayChildren: delay * i },
    }),
  };

  const child = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.9,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 500,
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      style={{ overflow: "hidden", display: "flex", flexWrap: "wrap" }}
      variants={container}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className={className}
    >
      {letters.map((letter, index) => (
        <motion.span
          variants={child}
          key={index}
          style={{ display: "inline-block" }}
        >
          {letter === " " ? "\u00A0" : letter}
        </motion.span>
      ))}
    </motion.div>
  );
};

const Landing = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const [scrollY, setScrollY] = useState(0);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0); // Start with first slide
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [logoCarouselIndex, setLogoCarouselIndex] = useState(0);

  // Handle carousel navigation with smooth infinite scroll
  const handleSlideChange = (direction: 'next' | 'prev' | number) => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    
    if (direction === 'next') {
      setCurrentSlide((prev) => (prev + 1) % courses.length);
    } else if (direction === 'prev') {
      setCurrentSlide((prev) => (prev - 1 + courses.length) % courses.length);
    } else {
      setCurrentSlide(direction);
    }
    
    setTimeout(() => setIsTransitioning(false), 600);
  };

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user && !isLoading) {
      navigate('/dashboard');
    }
  }, [user, isLoading, navigate]);

  // Scroll effect for parallax and nav transparency
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrollY(currentScrollY);
      setIsScrolled(currentScrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in');
          }
        });
      },
      { threshold: 0.2 }
    );

    const animatedElements = document.querySelectorAll('.scroll-animate');
    animatedElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  // Testimonials rotation
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // School logos continuous rotation - removed for CSS animation approach

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

  // School logos array with actual uploaded logos
  const schoolLogos = [
    // Victorian Schools
    { name: "Brighton Grammar School", logo: "/images/school logos/vic/brighton-grammar-school.svg" },
    { name: "Camberwell Girls Grammar", logo: "/images/school logos/vic/camberwell-girls-grammar-school.svg" },
    { name: "Camberwell Grammar School", logo: "/images/school logos/vic/camberwell-grammar-school.svg" },
    { name: "Carey Baptist Grammar", logo: "/images/school logos/vic/carey-baptist-grammar-school.svg" },
    { name: "Caulfield Grammar School", logo: "/images/school logos/vic/caulfield-grammar-school.svg" },
    { name: "Firbank Grammar School", logo: "/images/school logos/vic/firbank-grammar-school.svg" },
    { name: "Geelong College", logo: "/images/school logos/vic/geelong-college.svg" },
    { name: "Geelong Grammar School", logo: "/images/school logos/vic/geelong-grammar-school.svg" },
    { name: "Genazzano FCJ College", logo: "/images/school logos/vic/genazzano-fcj-college.svg" },
    { name: "Goulburn Valley Grammar", logo: "/images/school logos/vic/goulburn-valley-grammar-school.svg" },
    { name: "Haileybury College", logo: "/images/school logos/vic/haileybury-college.svg" },
    { name: "Huntingtower School", logo: "/images/school logos/vic/huntingtower-school.svg" },
    { name: "Ivanhoe Girls Grammar", logo: "/images/school logos/vic/ivanhoe-girls-grammar-school.svg" },
    { name: "Ivanhoe Grammar School", logo: "/images/school logos/vic/ivanhoe-grammar-school.svg" },
    { name: "Kilvington Grammar", logo: "/images/school logos/vic/kilvington-grammar-school.svg" },
    
    // NSW Schools
    { name: "Arden Anglican School", logo: "/images/school logos/nsw/arden_anglican_school.png" },
    { name: "Barker College", logo: "/images/school logos/nsw/barker_college.png" },
    { name: "Our Lady of the Sacred Heart", logo: "/images/school logos/nsw/our_lady_of_the_sacred_heart_college_kensington.png" },
    { name: "Ravenswood School", logo: "/images/school logos/nsw/ravenswood_school_for_girls.png" },
    { name: "Redfield College", logo: "/images/school logos/nsw/redfield_college.png" },
    { name: "St Aloysius College", logo: "/images/school logos/nsw/st_aloysius_college_sydney.png" },
    { name: "St Augustine's College", logo: "/images/school logos/nsw/st_augustines_college_brookvale.png" },
    { name: "St Catherine's School", logo: "/images/school logos/nsw/st_catherines_school_sydney.png" },
    { name: "St Clare's College", logo: "/images/school logos/nsw/st_clares_college_waverley.png" },
    { name: "St Stanislaus College", logo: "/images/school logos/nsw/st_stanislaus_college.png" },
    { name: "Sydney Grammar School", logo: "/images/school logos/nsw/sydney_grammar_school.png" },
    { name: "The King's School", logo: "/images/school logos/nsw/the_kings_school.png" },
    { name: "Trinity Catholic College", logo: "/images/school logos/nsw/trinity_catholic_college_auburn.png" },
    { name: "Trinity Grammar School", logo: "/images/school logos/nsw/trinity_grammar_school_sydney.png" },
    { name: "Waverley College", logo: "/images/school logos/nsw/waverley_college.png" }
  ];

  const testimonials = [
    {
      quote: "The sub-skill analytics were a game-changer. We could see exactly where Sarah needed improvement and track her progress week by week. She went from 60th percentile to 90th percentile in just 8 weeks.",
      name: "Michelle K.",
      details: "Parent of Year 6 student",
      stars: 5
    },
    {
      quote: "Finally, a platform that actually prepares kids for the real test environment. The questions are spot-on, and the detailed feedback helped Tom understand his mistakes.",
      name: "David R.",
      details: "Parent of Year 9 student",
      stars: 5
    },
    {
      quote: "Worth every dollar. The diagnostic test revealed gaps we didn't even know existed. The targeted drilling really works.",
      name: "Sarah L.",
      details: "Parent of Year 7 student",
      stars: 5
    },
    {
      quote: "The writing feedback was incredibly detailed. Emma improved her narrative writing score by 40% after following the specific suggestions. She's now confident for her selective entry test.",
      name: "James M.",
      details: "Parent of Year 5 student",
      stars: 5
    },
    {
      quote: "I love how the platform tracks progress in real-time. We could see Alex's numeracy improving week by week. He went from struggling with basic concepts to scoring in the top 10%.",
      name: "Lisa T.",
      details: "Parent of Year 8 student",
      stars: 5
    },
    {
      quote: "The diagnostic test was eye-opening. We thought our daughter was ready, but it showed specific areas that needed work. Three months later, she aced her scholarship exam.",
      name: "Robert C.",
      details: "Parent of Year 6 student",
      stars: 5
    },
    {
      quote: "Best investment we made for our son's education. The practice tests perfectly simulated the real exam conditions. He felt completely prepared on test day.",
      name: "Amanda H.",
      details: "Parent of Year 7 student",
      stars: 5
    },
    {
      quote: "The instant feedback feature is brilliant. Instead of waiting for results, our child could learn from mistakes immediately. Her reading comprehension scores improved dramatically.",
      name: "Michael D.",
      details: "Parent of Year 9 student",
      stars: 5
    }
  ];

  const features = [
    {
      icon: <Eye className="h-8 w-8" />,
      title: "Real Test Simulation",
      description: "Authentic test environment that mirrors the actual exam conditions and timing"
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "Sub-Skill Analytics",
      description: "Performance tracking beyond test sections - see progress in specific question types"
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Instant Feedback",
      description: "Detailed explanations for every question with improvement suggestions"
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: "Progress Tracking",
      description: "Visual dashboards showing improvement over time with actionable insights"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
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
                      {courses.map((course) => (
                        <Link
                          key={course.id}
                          to={`/course/${course.slug}`}
                          className="block px-4 py-2 text-base font-semibold text-[#3B4F6B] hover:bg-[#E6F7F5] rounded-lg transition-colors"
                        >
                          {course.title}
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
                  {courses.map((course) => (
                    <Link
                      key={course.id}
                      to={`/course/${course.slug}`}
                      className="block px-4 py-2 text-base font-semibold text-[#6B7280] hover:bg-[#E6F7F5] rounded-lg transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {course.title}
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

      {/* Hero Section */}
      <section className="pt-24 md:pt-32 pb-16 md:pb-20 bg-gradient-to-b from-[#E6F7F5] to-white relative overflow-hidden">
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
                  We're here to help you <span className="text-[#4ECDC4] underline">ace</span> your next test!
                </motion.h1>
                <motion.p 
                  className="text-lg sm:text-xl text-[#4B5563] leading-relaxed max-w-lg mx-auto lg:mx-0"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.2 }}
                >
                  Australia's best test preparation platform for <span className="font-bold">scholarship</span>, <span className="font-bold">selective entry</span> and <span className="font-bold">NAPLAN</span> tests.
                </motion.p>
              </div>

              {/* Key Points */}
              <motion.div 
                className="space-y-3 md:space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 1.8 }}
              >
                {[
                  'Designed by expert teachers and instructors',
                  '1000+ practice questions, with full-length practice tests',
                  'Detailed performance feedback and insights'
                ].map((point, index) => (
                  <motion.div 
                    key={index} 
                    className="flex items-start lg:items-center space-x-3 text-left"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 2 + index * 0.1 }}
                  >
                    <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-[#4ECDC4] flex-shrink-0 mt-0.5 lg:mt-0" />
                    <span className="text-base md:text-lg text-[#3B4F6B] leading-relaxed">{point}</span>
                  </motion.div>
                ))}
              </motion.div>

              {/* CTA */}
              <motion.div 
                className="flex justify-center lg:justify-start pt-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 2.5 }}
              >
                <Button 
                  size="lg" 
                  className="bg-[#6366F1] hover:bg-[#5B5BD6] text-white px-6 md:px-8 py-3 md:py-4 text-base md:text-lg group w-full sm:w-auto"
                  onClick={() => {
                    const methodologySection = document.getElementById('methodology');
                    if (methodologySection) {
                      methodologySection.scrollIntoView({ 
                        behavior: 'smooth',
                        block: 'start'
                      });
                    }
                  }}
                >
                  See how it works
                  <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
            </motion.div>

            {/* Hero Images - Responsive Screenshots */}
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

      {/* Test Products Section */}
      <section id="products" className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16 scroll-animate">
            <AnimatedText 
              text="Choose Your Test Preparation Package"
              className="text-xl sm:text-2xl md:text-4xl font-bold text-[#2C3E50] mb-4 justify-center px-2"
            />
            <motion.p 
              className="text-lg md:text-xl text-[#6B7280] max-w-3xl mx-auto px-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              viewport={{ once: true }}
            >
              Each package includes diagnostic tests, targeted drills, and full-length practice exams
            </motion.p>
          </div>

          {/* Mobile: Horizontal Scrollable, Tablet+: Grid/Carousel */}
          <div className="block sm:hidden">
            {/* Mobile Horizontal Scroll Layout */}
            <div className="overflow-x-auto pb-4">
              <div className="flex space-x-4 px-4" style={{ width: 'max-content' }}>
                {courses.map((course) => (
                  <Card key={course.id} className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-[#4ECDC4] flex flex-col w-72 flex-shrink-0">
                    <CardHeader className="text-center pb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#4ECDC4] to-[#6366F1] rounded-full flex items-center justify-center mx-auto mb-3">
                        <BookOpen className="h-6 w-6 text-white" />
                      </div>
                      <CardTitle className="text-xl text-[#2C3E50]">{course.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col h-full pt-0">
                      <div className="text-center flex-grow">
                        <div className="text-sm text-[#6B7280] mb-6">
                          {course.title === "Year 5 NAPLAN" && "Writing, Reading, Language Conventions, Numeracy"}
                          {course.title === "Year 7 NAPLAN" && "Writing, Reading, Language Conventions, Numeracy"}
                          {course.title === "Year 9 NAPLAN" && "Writing, Reading, Language Conventions, Numeracy"}
                          {course.title === "ACER Scholarship" && "Written Expression, Mathematics, Humanities"}
                          {course.title === "EduTest Scholarship" && "Reading, Verbal Reasoning, Numerical Reasoning, Mathematics, Written Expression"}
                          {course.title === "NSW Selective Entry" && "Reading, Mathematical Reasoning, Thinking Skills, Writing"}
                          {course.title === "VIC Selective Entry" && "Reading Reasoning, Mathematics Reasoning, General Ability - Verbal, General Ability - Quantitative, Writing"}
                          {course.title === "CogAT" && "Verbal Battery, Quantitative Battery, Nonverbal Battery"}
                        </div>
                      </div>
                      
                      <div className="mt-auto">
                        <div className="text-center mb-4">
                          <span className="text-2xl font-bold text-[#3B4F6B]">$199</span>
                        </div>
                        <Button 
                          asChild 
                          className="w-full bg-[#6366F1] hover:bg-[#5B5BD6] text-white group"
                        >
                          <Link to={`/course/${course.slug}`}>
                            Start Preparation
                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Tablet: Simple Grid */}
          <div className="hidden sm:block md:hidden">
            <div className="grid grid-cols-2 gap-6 max-w-2xl mx-auto">
              {courses.map((course) => (
                <Card key={course.id} className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-[#4ECDC4] flex flex-col h-full">
                  <CardHeader className="text-center pb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#4ECDC4] to-[#6366F1] rounded-full flex items-center justify-center mx-auto mb-3">
                      <BookOpen className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-lg text-[#2C3E50]">{course.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col h-full pt-0">
                    <div className="text-center flex-grow">
                      <div className="text-sm text-[#6B7280] mb-4">
                        {course.title === "Year 5 NAPLAN" && "Writing, Reading, Language Conventions, Numeracy"}
                        {course.title === "Year 7 NAPLAN" && "Writing, Reading, Language Conventions, Numeracy"}
                        {course.title === "Year 9 NAPLAN" && "Writing, Reading, Language Conventions, Numeracy"}
                        {course.title === "ACER Scholarship" && "Written Expression, Mathematics, Humanities"}
                        {course.title === "EduTest Scholarship" && "Reading, Verbal Reasoning, Numerical Reasoning, Mathematics, Written Expression"}
                        {course.title === "NSW Selective Entry" && "Reading, Mathematical Reasoning, Thinking Skills, Writing"}
                        {course.title === "VIC Selective Entry" && "Reading Reasoning, Mathematics Reasoning, General Ability - Verbal, General Ability - Quantitative, Writing"}
                        {course.title === "CogAT" && "Verbal Battery, Quantitative Battery, Nonverbal Battery"}
                      </div>
                      
                      <div className="space-y-2 mb-6">
                        {['500+ practice questions', 'Detailed performance analytics', 'Sub-skill level insights'].map((feature, idx) => (
                          <div key={idx} className="flex items-center text-sm text-[#6B7280]">
                            <CheckCircle className="h-4 w-4 text-[#4ECDC4] mr-2 flex-shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mt-auto">
                      <div className="text-center mb-4">
                        <span className="text-2xl font-bold text-[#3B4F6B]">$199</span>
                      </div>
                      <Button 
                        asChild 
                        className="w-full bg-[#6366F1] hover:bg-[#5B5BD6] text-white group"
                      >
                        <Link to={`/course/${course.slug}`}>
                          Start Preparation
                          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Desktop: Carousel */}
          <div className="hidden md:block relative max-w-7xl mx-auto">
            {/* Left Arrow */}
            <button
              onClick={() => handleSlideChange('prev')}
              disabled={isTransitioning}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-white/90 hover:bg-white shadow-lg rounded-full p-3 transition-all duration-200 hover:scale-110 disabled:opacity-50"
            >
              <ChevronLeft className="h-6 w-6 text-[#2C3E50]" />
            </button>

            {/* Right Arrow */}
            <button
              onClick={() => handleSlideChange('next')}
              disabled={isTransitioning}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-white/90 hover:bg-white shadow-lg rounded-full p-3 transition-all duration-200 hover:scale-110 disabled:opacity-50"
            >
              <ChevronRight className="h-6 w-6 text-[#2C3E50]" />
            </button>

            {/* Carousel Track */}
            <div className="overflow-hidden px-20 py-8">
              <div className="relative h-[450px] flex items-center justify-center">
                {/* Show 3 cards: previous, current, next */}
                <AnimatePresence mode="popLayout">
                  {[-1, 0, 1].map((offset) => {
                    const slideIndex = (currentSlide + offset + courses.length) % courses.length;
                    const course = courses[slideIndex];
                    const isCenter = offset === 0;
                    
                    return (
                      <motion.div
                        key={`${slideIndex}-${currentSlide}-${offset}`}
                        className="absolute w-96"
                        initial={{ 
                          x: offset * 420,
                          scale: isCenter ? 1.1 : 0.9,
                          opacity: isCenter ? 1 : 0.7
                        }}
                        animate={{
                          x: offset * 420,
                          scale: isCenter ? 1.1 : 0.9,
                          opacity: isCenter ? 1 : 0.7,
                          zIndex: isCenter ? 20 : 10
                        }}
                        exit={{
                          x: offset * 420,
                          scale: 0.8,
                          opacity: 0
                        }}
                        transition={{
                          x: { type: "spring", stiffness: 300, damping: 30 },
                          scale: { duration: 0.3 },
                          opacity: { duration: 0.3 }
                        }}
                      >
                      <Card className={`group hover:shadow-xl transition-all duration-300 border-2 hover:border-[#4ECDC4] flex flex-col h-full ${
                        isCenter ? 'border-[#4ECDC4] shadow-2xl' : ''
                      }`}>
                        <CardHeader className="text-center">
                          <div className="w-16 h-16 bg-gradient-to-br from-[#4ECDC4] to-[#6366F1] rounded-full flex items-center justify-center mx-auto mb-4">
                            <BookOpen className="h-8 w-8 text-white" />
                          </div>
                          <CardTitle className="text-xl text-[#2C3E50]">{course.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col h-full">
                          {/* Test Features - Fixed height container */}
                          <div className="text-center flex-grow">
                            <div className="text-sm text-[#6B7280] min-h-[60px] flex items-center justify-center">
                              {course.title === "Year 5 NAPLAN" && (
                                <div>Writing, Reading, Language Conventions, Numeracy No Calculator, Numeracy Calculator</div>
                              )}
                              {course.title === "Year 7 NAPLAN" && (
                                <div>Writing, Reading, Language Conventions, Numeracy No Calculator, Numeracy Calculator</div>
                              )}
                              {course.title === "ACER Scholarship" && (
                                <div>Written Expression, Mathematics, Humanities</div>
                              )}
                              {course.title === "EduTest Scholarship" && (
                                <div>Reading Comprehension, Verbal Reasoning, Numerical Reasoning, Mathematics, Written Expression</div>
                              )}
                              {course.title === "NSW Selective Entry" && (
                                <div>Reading, Mathematical Reasoning, Thinking Skills, Writing</div>
                              )}
                              {course.title === "VIC Selective Entry" && (
                                <div>Reading Reasoning, Mathematics Reasoning, General Ability - Verbal, General Ability - Quantitative, Writing</div>
                              )}
                            </div>
                          </div>

                          {/* Price - Fixed position */}
                          <div className="text-center py-4">
                            <span className="text-lg font-bold text-[#3B4F6B]">${course.price}</span>
                          </div>

                          {/* CTA - Fixed position at bottom */}
                          <div className="mt-auto">
                            <Button 
                              className="w-full bg-[#6366F1] hover:bg-[#5B5BD6] text-white group-hover:scale-105 transition-transform"
                              asChild
                            >
                              <Link to={`/course/${course.slug}`}>
                                See what's included
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
            
            {/* Slide Indicators */}
            <div className="flex justify-center mt-8 space-x-2">
              {courses.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleSlideChange(index)}
                  disabled={isTransitioning}
                  className={`w-3 h-3 rounded-full transition-colors disabled:opacity-50 ${
                    index === currentSlide ? 'bg-[#4ECDC4]' : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Methodology Section */}
      <section id="methodology" className="py-16 md:py-20 bg-[#F8F9FA]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16 scroll-animate">
            <AnimatedText 
              text="Confidently Prepare at Home in 3 Steps"
              className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#2C3E50] mb-4 justify-center"
            />
            <motion.p 
              className="text-lg md:text-xl text-[#6B7280] max-w-3xl mx-auto px-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              viewport={{ once: true }}
            >
              From identifying gaps to mastering skills - every step designed for success
            </motion.p>
          </div>

          <div className="space-y-16 md:space-y-24">
            {[
              {
                step: '01',
                prefix: 'Diagnostic:',
                title: 'Uncover Strengths & Gaps',
                description: 'Start with our comprehensive diagnostic test. Get detailed insights into your child\'s current performance across all sub-skills and question types.',
                icon: <Activity className="h-8 w-8 md:h-12 md:w-12" />,
                image: 'diagnostic home 3.png'
              },
              {
                step: '02',
                prefix: 'Skill Drills:',
                title: 'Targeted Skill Building',
                description: 'Access 500+ questions designed to strengthen specific sub-skills. Our platform identifies exactly what your child needs to practice most.',
                icon: <Target className="h-8 w-8 md:h-12 md:w-12" />,
                image: 'writing feedback 3.png'
              },
              {
                step: '03',
                prefix: 'Practice Tests:',
                title: 'Simulate the Real Test',
                description: 'Take full-length practice tests that perfectly simulate the real exam environment. Track improvement with detailed analytics.',
                icon: <FileText className="h-8 w-8 md:h-12 md:w-12" />,
                image: 'test taking maths 2.png'
              }
            ].map((step, index) => (
              <motion.div 
                key={index} 
                className="grid lg:grid-cols-2 gap-8 md:gap-16 items-center"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.6,
                  delay: 0.2,
                  type: "spring",
                  stiffness: 100,
                  damping: 20
                }}
                viewport={{ once: true, margin: "-50px" }}
              >
                {/* Content - Always first on mobile, alternating on desktop */}
                <motion.div 
                  className={`space-y-6 md:space-y-8 text-center lg:text-left ${index % 2 === 1 ? 'lg:order-2' : ''}`}
                  initial={{ opacity: 0, x: 0 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ 
                    duration: 0.6,
                    delay: 0.3,
                    type: "spring",
                    stiffness: 120
                  }}
                  viewport={{ once: true }}
                >
                  {/* Step indicator */}
                  <motion.div 
                    className="flex items-center justify-center lg:justify-start space-x-4 md:space-x-6"
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ 
                      duration: 0.5,
                      delay: 0.4,
                      type: "spring",
                      stiffness: 150
                    }}
                    viewport={{ once: true }}
                  >
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-[#4ECDC4] to-[#6366F1] rounded-full flex items-center justify-center text-white shadow-xl">
                      {step.icon}
                    </div>
                    <div className="text-3xl md:text-5xl font-bold text-[#4ECDC4]">
                      {step.step}
                    </div>
                  </motion.div>
                  
                  {/* Title */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ 
                      duration: 0.5,
                      delay: 0.5,
                      type: "spring",
                      stiffness: 100
                    }}
                    viewport={{ once: true }}
                  >
                    <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#2C3E50] leading-tight">
                      <span className="text-[#FF6B6B]">{step.prefix}</span> {step.title}
                    </h3>
                  </motion.div>
                  
                  {/* Description */}
                  <motion.p 
                    className="text-base md:text-xl text-[#6B7280] leading-relaxed max-w-lg mx-auto lg:mx-0"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ 
                      duration: 0.5,
                      delay: 0.6,
                      type: "spring",
                      stiffness: 100
                    }}
                    viewport={{ once: true }}
                  >
                    {step.description}
                  </motion.p>
                </motion.div>
                
                {/* Screenshot */}
                <motion.div 
                  className={`${index % 2 === 1 ? 'lg:order-1' : ''}`}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.6,
                    delay: 0.4,
                    type: "spring",
                    stiffness: 80,
                    damping: 20
                  }}
                  viewport={{ once: true }}
                >
                  <motion.div 
                    className="bg-white rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden max-w-md mx-auto lg:max-w-none group"
                    whileHover={{ 
                      scale: 1.02,
                      rotate: index % 2 === 0 ? 1 : -1,
                      boxShadow: "0 25px 50px rgba(0, 0, 0, 0.15)"
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <motion.div 
                      className="aspect-video overflow-hidden"
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <img 
                        src={`/images/${step.image}`}
                        alt={`Step ${step.step} - ${step.title}`}
                        className="w-full h-full object-contain bg-gray-50"
                        loading="eager"
                      />
                    </motion.div>
                  </motion.div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Features Showcase */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16 scroll-animate">
            <AnimatedText 
              text="Best-in-Class Performance & Progress Insights"
              className="text-xl sm:text-2xl md:text-4xl font-bold text-[#2C3E50] mb-4 justify-center px-2"
            />
            <motion.p 
              className="text-lg md:text-xl text-[#6B7280] max-w-3xl mx-auto px-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              viewport={{ once: true }}
            >
              See exactly how your child is performing - not just overall, but at the sub-skill level
            </motion.p>
          </div>

          {/* Mobile: Stacked Layout, Desktop: Side-by-side */}
          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12 items-center">
            {/* Features - Top on mobile, left on desktop */}
            <div className="lg:col-span-1 order-2 lg:order-1">
              <div className="space-y-6 md:space-y-8">
                {/* Progress Tracking */}
                <div className="flex items-start gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-[#4ECDC4] to-[#6366F1] rounded-full flex items-center justify-center text-white flex-shrink-0">
                    <TrendingUp className="h-5 w-5 md:h-6 md:w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-semibold text-[#2C3E50] mb-2">Progress Tracking</h3>
                    <p className="text-sm md:text-base text-[#6B7280] leading-relaxed">Visual dashboards showing improvement over time with actionable insights</p>
                  </div>
                </div>

                {/* Sub-Skill Analytics */}
                <div className="flex items-start gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-[#4ECDC4] to-[#6366F1] rounded-full flex items-center justify-center text-white flex-shrink-0">
                    <BarChart3 className="h-5 w-5 md:h-6 md:w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-semibold text-[#2C3E50] mb-2">Sub-Skill Analytics</h3>
                    <p className="text-sm md:text-base text-[#6B7280] leading-relaxed">Performance tracking beyond test sections - see progress in specific question types</p>
                  </div>
                </div>

                {/* Instant Feedback */}
                <div className="flex items-start gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-[#4ECDC4] to-[#6366F1] rounded-full flex items-center justify-center text-white flex-shrink-0">
                    <Zap className="h-5 w-5 md:h-6 md:w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-semibold text-[#2C3E50] mb-2">Instant Feedback</h3>
                    <p className="text-sm md:text-base text-[#6B7280] leading-relaxed">Detailed explanations for every question with improvement suggestions</p>
                  </div>
                </div>
              </div>
            </div>

            {/* GIF Demo - Top on mobile, right on desktop */}
            <div className="lg:col-span-2 order-1 lg:order-2 scroll-animate">
              <div className="bg-gradient-to-br from-[#4ECDC4] to-[#6366F1] rounded-xl md:rounded-2xl p-4 md:p-6">
                <div className="bg-white rounded-lg md:rounded-xl shadow-2xl overflow-hidden">
                  <div className="aspect-video flex items-center justify-center">
                    <img 
                      src="/images/CleanShot 2025-07-28 at 19.48.04.gif" 
                      alt="Platform Analytics Demo"
                      className="w-full h-full object-contain"
                      loading="eager"
                      style={{ imageRendering: 'crisp-edges' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* School Logos Section */}
      <section className="py-12 md:py-16 bg-[#F8F9FA]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-12 scroll-animate">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#2C3E50] mb-4">
              Trusted by Students Entering Australia's Top Schools
            </h2>
          </div>
          {/* School logos continuous scrolling carousel */}
          <div className="relative overflow-hidden">
            <motion.div 
              className="flex items-center space-x-6 md:space-x-8"
              animate={{ 
                x: [0, -schoolLogos.length * 140]
              }}
              transition={{ 
                duration: 70, // 70 seconds for full cycle (slower)
                ease: "linear",
                repeat: Infinity
              }}
            >
              {/* Render logos twice for seamless infinite scroll */}
              {[...schoolLogos, ...schoolLogos].map((school, index) => (
                <div 
                  key={`${school.name}-${index}`}
                  className="flex-shrink-0 w-[120px] h-[60px] md:w-[150px] md:h-[80px] flex items-center justify-center"
                >
                  <img 
                    src={school.logo} 
                    alt={`${school.name} logo`}
                    className="max-w-full max-h-full object-contain grayscale hover:grayscale-0 transition-all duration-300"
                    onError={(e) => {
                      // Fallback to text if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `<span class="text-gray-600 text-xs font-medium text-center px-2">${school.name}</span>`;
                      }
                    }}
                  />
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16 scroll-animate">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#2C3E50] mb-4">
              What Parents Are Saying
            </h2>
            <p className="text-lg md:text-xl text-[#6B7280]">
              Real results from real families across Australia
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative bg-white rounded-xl md:rounded-2xl shadow-xl p-6 md:p-8 scroll-animate">
              <div className="text-center space-y-4 md:space-y-6">
                <div className="flex justify-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 md:h-6 md:w-6 fill-[#FF6B6B] text-[#FF6B6B]" />
                  ))}
                </div>
                <blockquote className="text-lg md:text-xl text-[#2C3E50] italic leading-relaxed px-4">
                  "{testimonials[activeTestimonial].quote}"
                </blockquote>
                <div className="space-y-1">
                  <p className="font-semibold text-[#2C3E50] text-base md:text-lg">{testimonials[activeTestimonial].name}</p>
                  <p className="text-[#6B7280] text-sm md:text-base">{testimonials[activeTestimonial].details}</p>
                </div>
              </div>

              {/* Testimonial Navigation */}
              <div className="flex justify-center space-x-2 mt-6 md:mt-8">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveTestimonial(index)}
                    className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full transition-colors ${
                      index === activeTestimonial ? 'bg-[#4ECDC4]' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Footer Section */}
      <footer className="bg-[#2C3E50] text-white py-12 md:py-16">
        <div className="container mx-auto px-4">
          {/* Final CTA */}
          <div className="text-center mb-12 md:mb-16 scroll-animate">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">Ready to Help Your Child Succeed?</h2>
            <p className="text-lg md:text-xl text-gray-300 mb-6 md:mb-8 max-w-2xl mx-auto px-4">
              Join 1000+ families who trust EduCourse for test preparation
            </p>
            <Button 
              size="lg" 
              className="bg-[#FF6B6B] hover:bg-[#E55A5A] text-white px-6 md:px-8 py-3 md:py-4 text-base md:text-lg w-full sm:w-auto"
              onClick={() => {
                const productsSection = document.getElementById('products');
                if (productsSection) {
                  productsSection.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                  });
                }
              }}
            >
              Get Started Today
              <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
            </Button>
          </div>

          {/* Footer Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
            <div className="text-center sm:text-left">
              <h3 className="text-xl md:text-2xl font-bold text-[#4ECDC4] mb-3 md:mb-4">EduCourse</h3>
              <p className="text-gray-300 text-sm md:text-base">
                Australia's premier test preparation platform for competitive entrance exams.
              </p>
            </div>
            <div className="text-center sm:text-left">
              <h4 className="font-semibold mb-3 md:mb-4">Products</h4>
              <div className="space-y-2">
                {courses.map((course) => (
                  <Link
                    key={course.id}
                    to={`/course/${course.slug}`}
                    className="block text-gray-300 hover:text-[#4ECDC4] transition-colors text-sm md:text-base"
                  >
                    {course.title}
                  </Link>
                ))}
              </div>
            </div>
            <div className="text-center sm:text-left">
              <h4 className="font-semibold mb-3 md:mb-4">Contact</h4>
              <div className="space-y-2 text-gray-300 text-sm md:text-base">
                <p>learning@educourse.com.au</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-600 mt-8 md:mt-12 pt-6 md:pt-8 text-center text-gray-400">
            <p className="text-xs md:text-sm">&copy; 2024 EduCourse. All rights reserved. | Privacy Policy | Terms of Service</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;