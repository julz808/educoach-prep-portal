import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { courses } from '@/data/courses';
import { motion, useInView } from 'framer-motion';
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
  X
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
                className="h-44"
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
                          className="block px-4 py-2 text-sm text-[#3B4F6B] hover:bg-[#E6F7F5] rounded-lg transition-colors"
                        >
                          {course.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
                <Link 
                  to="/insights" 
                  className="text-[#3B4F6B] hover:text-[#4ECDC4] transition-colors font-semibold"
                >
                  Insights
                </Link>
                
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
                      className="block px-4 py-2 text-sm text-[#6B7280] hover:bg-[#E6F7F5] rounded-lg transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {course.title}
                    </Link>
                  ))}
                </div>
                <Link 
                  to="/insights" 
                  className="block text-[#3B4F6B] hover:text-[#4ECDC4] transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Insights
                </Link>
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
      <section className="pt-32 pb-20 bg-gradient-to-b from-[#E6F7F5] to-white relative overflow-hidden">
        <div className="container mx-auto px-4 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <motion.div 
              className="space-y-10"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="space-y-8">
                <AnimatedText 
                  text="We're here to help you ace your next test!"
                  className="text-4xl lg:text-5xl font-bold text-[#2C3E50] leading-tight"
                  delay={0.2}
                />
                <motion.p 
                  className="text-xl text-[#4B5563] leading-relaxed max-w-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.2 }}
                >
                  Australia's best test prep platform for <span className="font-bold">scholarship</span>, <span className="font-bold">selective entry</span> and <span className="font-bold">NAPLAN</span> tests.
                </motion.p>
              </div>

              {/* Key Points */}
              <motion.div 
                className="space-y-4"
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
                    className="flex items-center space-x-3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 2 + index * 0.1 }}
                  >
                    <CheckCircle className="h-6 w-6 text-[#4ECDC4] flex-shrink-0" />
                    <span className="text-lg text-[#3B4F6B]">{point}</span>
                  </motion.div>
                ))}
              </motion.div>

              {/* CTA */}
              <motion.div 
                className="flex justify-center sm:justify-start"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 2.5 }}
              >
                <Button 
                  size="lg" 
                  className="bg-[#6366F1] hover:bg-[#5B5BD6] text-white px-8 py-4 text-lg group"
                  asChild
                >
                  <Link to="#products">
                    Find Your Test
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </motion.div>
            </motion.div>

            {/* Hero Images - Overlapping Screenshots */}
            <div className="relative h-96">
              {/* Background Screenshot */}
              <motion.div 
                className="absolute top-0 right-0 w-80 h-52 bg-white rounded-xl shadow-2xl p-3 transform rotate-3 hover:rotate-1 hover:scale-105 transition-all duration-500 z-10"
                initial={{ opacity: 0, y: 50, rotate: 10 }}
                animate={{ opacity: 1, y: 0, rotate: 3 }}
                transition={{ duration: 0.8, delay: 0.5, type: "spring", stiffness: 100 }}
              >
                <div className="w-full h-full bg-gradient-to-br from-[#4ECDC4] to-[#6366F1] rounded-lg flex items-center justify-center">
                  <div className="text-white text-center">
                    <Target className="h-8 w-8 mx-auto mb-1" />
                    <p className="text-xs font-semibold">Diagnostic Dashboard</p>
                  </div>
                </div>
              </motion.div>
              
              {/* Middle Screenshot */}
              <motion.div 
                className="absolute top-16 left-8 w-80 h-52 bg-white rounded-xl shadow-2xl p-3 transform -rotate-2 hover:rotate-0 hover:scale-105 transition-all duration-500 z-20"
                initial={{ opacity: 0, y: 50, rotate: -10 }}
                animate={{ opacity: 1, y: 0, rotate: -2 }}
                transition={{ duration: 0.8, delay: 0.8, type: "spring", stiffness: 100 }}
              >
                <div className="w-full h-full bg-gradient-to-br from-[#6366F1] to-[#FF6B6B] rounded-lg flex items-center justify-center">
                  <div className="text-white text-center">
                    <BookOpen className="h-8 w-8 mx-auto mb-1" />
                    <p className="text-xs font-semibold">Practice Test Interface</p>
                  </div>
                </div>
              </motion.div>
              
              {/* Front Screenshot - Adjusted position */}
              <motion.div 
                className="absolute top-48 right-12 w-80 h-52 bg-white rounded-xl shadow-2xl p-3 transform rotate-1 hover:rotate-0 hover:scale-105 transition-all duration-500 z-30"
                initial={{ opacity: 0, y: 50, rotate: 8 }}
                animate={{ opacity: 1, y: 0, rotate: 1 }}
                transition={{ duration: 0.8, delay: 1.1, type: "spring", stiffness: 100 }}
              >
                <div className="w-full h-full bg-gradient-to-br from-[#FF6B6B] to-[#4ECDC4] rounded-lg flex items-center justify-center">
                  <div className="text-white text-center">
                    <BarChart3 className="h-8 w-8 mx-auto mb-1" />
                    <p className="text-xs font-semibold">Performance Analytics</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Test Products Section */}
      <section id="products" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 scroll-animate">
            <AnimatedText 
              text="Choose Your Test Preparation Package"
              className="text-4xl font-bold text-[#2C3E50] mb-4 justify-center"
            />
            <motion.p 
              className="text-xl text-[#6B7280] max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              viewport={{ once: true }}
            >
              Each package includes diagnostic tests, targeted drills, and full-length practice exams
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.6, 
                  delay: index * 0.1,
                  type: "spring",
                  stiffness: 100
                }}
                viewport={{ once: true }}
              >
                <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-[#4ECDC4] flex flex-col h-full"
                >
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#4ECDC4] to-[#6366F1] rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl text-[#2C3E50]">{course.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col flex-grow space-y-6">
                  <p className="text-[#6B7280] text-center">{course.shortDescription}</p>

                  {/* Price */}
                  <div className="text-center">
                    <span className="text-3xl font-bold text-[#FF6B6B]">${course.price}</span>
                  </div>

                  {/* CTA - Pushed to bottom */}
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
            ))}
          </div>
        </div>
      </section>

      {/* Methodology Section */}
      <section id="methodology" className="py-20 bg-[#F8F9FA]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 scroll-animate">
            <AnimatedText 
              text="Our Proven 3-Step Methodology"
              className="text-4xl font-bold text-[#2C3E50] mb-4 justify-center"
            />
            <motion.p 
              className="text-xl text-[#6B7280] max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              viewport={{ once: true }}
            >
              From identifying gaps to mastering skills - every step designed for success
            </motion.p>
          </div>

          <div className="space-y-24">
            {[
              {
                step: '01',
                prefix: 'Diagnostic:',
                title: 'Uncover Strengths & Gaps',
                description: 'Start with our comprehensive diagnostic test. Get detailed insights into your child\'s current performance across all sub-skills and question types.',
                icon: <Target className="h-12 w-12" />,
                image: 'Diagnostic results dashboard showing performance breakdown'
              },
              {
                step: '02',
                prefix: 'Skill Drills:',
                title: 'Targeted Skill Building',
                description: 'Access 500+ questions designed to strengthen specific sub-skills. Our platform identifies exactly what your child needs to practice most.',
                icon: <Brain className="h-12 w-12" />,
                image: 'Drill interface showing question types and progress tracking'
              },
              {
                step: '03',
                prefix: 'Practice Tests:',
                title: 'Simulate the Real Test',
                description: 'Take full-length practice tests that perfectly simulate the real exam environment. Track improvement with detailed analytics.',
                icon: <Trophy className="h-12 w-12" />,
                image: 'Practice test results with comprehensive performance charts'
              }
            ].map((step, index) => (
              <motion.div 
                key={index} 
                className={`grid lg:grid-cols-2 gap-16 items-center ${
                  index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                }`}
                initial={{ opacity: 0, y: 100 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.8,
                  delay: 0.2,
                  type: "spring",
                  stiffness: 100,
                  damping: 20
                }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <motion.div 
                  className={`space-y-8 ${index % 2 === 1 ? 'lg:order-2' : ''}`}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ 
                    duration: 0.7,
                    delay: 0.4,
                    type: "spring",
                    stiffness: 120
                  }}
                  viewport={{ once: true }}
                >
                  <motion.div 
                    className="flex items-center space-x-6"
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ 
                      duration: 0.6,
                      delay: 0.6,
                      type: "spring",
                      stiffness: 150
                    }}
                    viewport={{ once: true }}
                  >
                    <motion.div 
                      className="w-20 h-20 bg-gradient-to-br from-[#4ECDC4] to-[#6366F1] rounded-full flex items-center justify-center text-white shadow-xl"
                      whileHover={{ 
                        scale: 1.1, 
                        rotate: 5,
                        boxShadow: "0 20px 40px rgba(78, 205, 196, 0.3)"
                      }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      {step.icon}
                    </motion.div>
                    <motion.div 
                      className="text-5xl font-bold text-[#4ECDC4]"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ 
                        duration: 0.5,
                        delay: 0.8,
                        type: "spring",
                        stiffness: 200
                      }}
                      viewport={{ once: true }}
                    >
                      {step.step}
                    </motion.div>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ 
                      duration: 0.6,
                      delay: 1.0,
                      type: "spring",
                      stiffness: 100
                    }}
                    viewport={{ once: true }}
                  >
                    <h3 className="text-4xl font-bold text-[#2C3E50] leading-tight">
                      <span className="text-[#FF6B6B]">{step.prefix}</span> {step.title}
                    </h3>
                  </motion.div>
                  
                  <motion.p 
                    className="text-xl text-[#6B7280] leading-relaxed"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ 
                      duration: 0.6,
                      delay: 1.2,
                      type: "spring",
                      stiffness: 100
                    }}
                    viewport={{ once: true }}
                  >
                    {step.description}
                  </motion.p>
                </motion.div>
                
                <motion.div 
                  className={`${index % 2 === 1 ? 'lg:order-1' : ''}`}
                  initial={{ opacity: 0, x: index % 2 === 0 ? 50 : -50, rotate: index % 2 === 0 ? 5 : -5 }}
                  whileInView={{ opacity: 1, x: 0, rotate: 0 }}
                  transition={{ 
                    duration: 0.8,
                    delay: 0.5,
                    type: "spring",
                    stiffness: 80,
                    damping: 20
                  }}
                  viewport={{ once: true }}
                >
                  <motion.div 
                    className="bg-white rounded-3xl shadow-2xl p-8 group"
                    whileHover={{ 
                      scale: 1.05, 
                      rotate: index % 2 === 0 ? 2 : -2,
                      boxShadow: "0 25px 50px rgba(0, 0, 0, 0.15)"
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <motion.div 
                      className="aspect-video bg-gradient-to-br from-[#4ECDC4] to-[#6366F1] rounded-2xl flex items-center justify-center overflow-hidden"
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <motion.div 
                        className="text-white text-center"
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ 
                          duration: 0.6,
                          delay: 0.8,
                          type: "spring",
                          stiffness: 200
                        }}
                        viewport={{ once: true }}
                      >
                        <motion.div
                          whileHover={{ rotate: 360, scale: 1.2 }}
                          transition={{ duration: 0.6, type: "spring", stiffness: 200 }}
                        >
                          <BarChart3 className="h-16 w-16 mx-auto mb-3" />
                        </motion.div>
                        <p className="text-lg font-medium">{step.image}</p>
                      </motion.div>
                    </motion.div>
                  </motion.div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Features Showcase */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 scroll-animate">
            <AnimatedText 
              text="Best-in-Class Test Platform & Analytics"
              className="text-4xl font-bold text-[#2C3E50] mb-4 justify-center"
            />
            <motion.p 
              className="text-xl text-[#6B7280] max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              viewport={{ once: true }}
            >
              See exactly how your child is performing - not just overall, but at the sub-skill level
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="text-center space-y-4 scroll-animate group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-16 h-16 bg-gradient-to-br from-[#4ECDC4] to-[#6366F1] rounded-full flex items-center justify-center mx-auto text-white group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-[#2C3E50]">{feature.title}</h3>
                <p className="text-[#6B7280]">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Platform Screenshot */}
          <div className="scroll-animate">
            <div className="bg-gradient-to-br from-[#4ECDC4] to-[#6366F1] rounded-2xl p-8 transform hover:scale-105 hover:rotate-1 transition-all duration-500">
              <div className="bg-white rounded-xl shadow-2xl aspect-video flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="h-20 w-20 mx-auto mb-4 text-[#4ECDC4]" />
                  <p className="text-xl font-semibold text-[#2C3E50]">Platform Analytics Dashboard</p>
                  <p className="text-[#6B7280]">Real-time performance tracking and insights</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* School Logos Placeholder Section */}
      <section className="py-16 bg-[#F8F9FA]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 scroll-animate">
            <h2 className="text-3xl font-bold text-[#2C3E50] mb-4">
              Trusted by Students Entering Australia's Top Schools
            </h2>
          </div>
          {/* School logos carousel - to be implemented later */}
          <div className="flex justify-center items-center space-x-8 overflow-hidden">
            {[...Array(8)].map((_, index) => (
              <div 
                key={index}
                className="w-[120px] h-[60px] bg-gray-200 rounded-lg flex items-center justify-center"
              >
                <span className="text-gray-400 text-xs">School Logo</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 scroll-animate">
            <h2 className="text-4xl font-bold text-[#2C3E50] mb-4">
              What Parents Are Saying
            </h2>
            <p className="text-xl text-[#6B7280]">
              Real results from real families across Australia
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative bg-white rounded-2xl shadow-xl p-8 scroll-animate">
              <div className="text-center space-y-6">
                <div className="flex justify-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-6 w-6 fill-[#FF6B6B] text-[#FF6B6B]" />
                  ))}
                </div>
                <blockquote className="text-xl text-[#2C3E50] italic leading-relaxed">
                  "{testimonials[activeTestimonial].quote}"
                </blockquote>
                <div className="space-y-1">
                  <p className="font-semibold text-[#2C3E50]">{testimonials[activeTestimonial].name}</p>
                  <p className="text-[#6B7280]">{testimonials[activeTestimonial].details}</p>
                </div>
              </div>

              {/* Testimonial Navigation */}
              <div className="flex justify-center space-x-2 mt-8">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveTestimonial(index)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === activeTestimonial ? 'bg-[#4ECDC4]' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mailing List Placeholder Section */}
      <section className="py-16 bg-[#4ECDC4]">
        <div className="container mx-auto px-4">
          <div className="text-center scroll-animate">
            <h2 className="text-3xl font-bold text-white mb-4">
              Stay Updated on Your Child's Test Prep Journey
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Get expert tips, practice questions, and exam updates delivered to your inbox
            </p>
            {/* Typeform mailing list embed - to be added later */}
            <div className="max-w-md mx-auto bg-white/20 rounded-xl p-8">
              <p className="text-white">Typeform mailing list integration - to be implemented</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="bg-[#2C3E50] text-white py-16">
        <div className="container mx-auto px-4">
          {/* Final CTA */}
          <div className="text-center mb-16 scroll-animate">
            <h2 className="text-4xl font-bold mb-4">Ready to Help Your Child Succeed?</h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join 1000+ families who trust EduCourse for test preparation
            </p>
            <Button 
              size="lg" 
              className="bg-[#FF6B6B] hover:bg-[#E55A5A] text-white px-8 py-4 text-lg"
              asChild
            >
              <Link to="/auth">
                Get Started Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>

          {/* Footer Links */}
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold text-[#4ECDC4] mb-4">EduCourse</h3>
              <p className="text-gray-300">
                Australia's premier test preparation platform for competitive entrance exams.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <div className="space-y-2">
                <Link to="/insights" className="block text-gray-300 hover:text-[#4ECDC4] transition-colors">
                  Insights
                </Link>
                <Link to="/auth" className="block text-gray-300 hover:text-[#4ECDC4] transition-colors">
                  Sign Up
                </Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Products</h4>
              <div className="space-y-2">
                {courses.slice(0, 3).map((course) => (
                  <Link
                    key={course.id}
                    to={`/course/${course.slug}`}
                    className="block text-gray-300 hover:text-[#4ECDC4] transition-colors"
                  >
                    {course.title}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <div className="space-y-2 text-gray-300">
                <p>support@educourse.com.au</p>
                <p>1800 EDU COURSE</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-600 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 EduCourse. All rights reserved. | Privacy Policy | Terms of Service</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;