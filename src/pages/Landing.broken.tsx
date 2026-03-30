import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/card';
import { courses } from '@/data/courses';
import { motion, useScroll, useTransform } from 'framer-motion';
import { SEOHead } from '@/components/SEOHead';
import { useSEOMetadata } from '@/hooks/useSEOMetadata';
import {
  CheckCircle,
  ArrowRight,
  Target,
  BarChart3,
  Zap,
  Trophy,
  Menu,
  X,
  ChevronDown
} from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const seoMetadata = useSEOMetadata('/');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 150]);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-charcoal font-sans">
      <SEOHead {...seoMetadata} />

      {/* Bold Navigation */}
      <nav className="fixed top-0 w-full bg-charcoal/95 backdrop-blur-sm border-b border-charcoal-lighter z-50">
        <div className="container mx-auto px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan to-orange rounded-lg flex items-center justify-center transform group-hover:scale-110 transition-transform">
                <span className="text-charcoal font-display font-bold text-xl">E</span>
              </div>
              <span className="text-off-white font-display font-bold text-xl tracking-tight">
                EduCourse
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center space-x-8">
              <Link to="/auth" className="text-light-gray hover:text-cyan transition-colors font-medium">
                Login
              </Link>
              <Button
                className="bg-cyan hover:bg-cyan-light text-charcoal font-bold px-6 py-2 rounded-lg shadow-lg hover:shadow-cyan/50 transition-all"
                onClick={() => navigate('/auth')}
              >
                Get Started
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden text-off-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-charcoal-lighter bg-charcoal-light"
          >
            <div className="container mx-auto px-4 py-4 space-y-4">
              <Link
                to="/auth"
                className="block text-light-gray hover:text-cyan transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
              <Button
                className="w-full bg-cyan hover:bg-cyan-light text-charcoal font-bold"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/auth');
                }}
              >
                Get Started
              </Button>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero Section - Asymmetric Split */}
      <section className="pt-32 pb-20 lg:pt-40 lg:pb-32 relative overflow-hidden">
        {/* Gradient Orb Background */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-cyan/20 to-orange/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Content - 7 columns */}
            <motion.div
              className="lg:col-span-7 space-y-8"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Eyebrow */}
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-charcoal-light border border-cyan/30 rounded-full">
                <Zap className="w-4 h-4 text-cyan" />
                <span className="text-cyan text-sm font-mono font-bold">AUSTRALIA'S #1 TEST PREP</span>
              </div>

              {/* Headline - Sharp & Bold */}
              <h1 className="text-5xl lg:text-7xl font-display font-bold text-off-white leading-[1.1] tracking-tight">
                Australia's Leading{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan to-orange">
                  Test Preparation
                </span>{' '}
                Platform
              </h1>

              {/* Subheadline */}
              <p className="text-xl lg:text-2xl text-light-gray leading-relaxed max-w-2xl">
                Give your child the edge they need with Australia's most comprehensive test prep platform for{' '}
                <span className="text-cyan font-semibold">NAPLAN</span>,{' '}
                <span className="text-cyan font-semibold">selective entry</span>, and{' '}
                <span className="text-cyan font-semibold">scholarship</span> exams.
              </p>

              {/* Key Points - Data Style */}
              <div className="space-y-4">
                {[
                  'Designed by expert teachers and instructors',
                  '1000+ practice questions, with full-length practice tests',
                  'Detailed performance feedback and insights'
                ].map((point, index) => (
                  <motion.div
                    key={index}
                    className="flex items-start space-x-4"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
                  >
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-success/20 flex items-center justify-center mt-1">
                      <CheckCircle className="w-4 h-4 text-success" />
                    </div>
                    <span className="text-lg text-light-gray">{point}</span>
                  </motion.div>
                ))}
              </div>

              {/* CTAs - Bold Stacked */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-cyan to-cyan-light hover:from-cyan-light hover:to-cyan text-charcoal font-bold px-8 py-6 text-lg rounded-xl shadow-2xl shadow-cyan/50 hover:shadow-cyan/70 transform hover:-translate-y-1 transition-all group"
                  onClick={() => {
                    const productsSection = document.getElementById('products');
                    if (productsSection) {
                      productsSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  Find Your Test
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-light-gray text-off-white hover:bg-off-white hover:text-charcoal px-8 py-6 text-lg rounded-xl font-semibold transition-all"
                  onClick={() => {
                    const methodologySection = document.getElementById('methodology');
                    if (methodologySection) {
                      methodologySection.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  See How It Works
                </Button>
              </div>
            </motion.div>

            {/* Screenshots - 5 columns, Diagonal Grid */}
            <motion.div
              className="lg:col-span-5 relative h-[400px] lg:h-[600px]"
              style={{ y: heroY }}
            >
              {/* Background screenshot - rotated */}
              <motion.div
                className="absolute top-0 right-0 w-[85%] h-[45%] bg-white rounded-2xl shadow-2xl overflow-hidden transform rotate-3 hover:rotate-1 hover:scale-105 transition-all duration-500 z-10"
                initial={{ opacity: 0, y: 50, rotate: 6 }}
                animate={{ opacity: 1, y: 0, rotate: 3 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                <img
                  src="/images/dashboard view.png"
                  alt="EduCourse Dashboard"
                  className="w-full h-full object-contain"
                  loading="eager"
                />
              </motion.div>

              {/* Middle screenshot */}
              <motion.div
                className="absolute bottom-20 left-0 w-[85%] h-[45%] bg-white rounded-2xl shadow-2xl overflow-hidden transform -rotate-2 hover:rotate-0 hover:scale-105 transition-all duration-500 z-20"
                initial={{ opacity: 0, y: 50, rotate: -6 }}
                animate={{ opacity: 1, y: 0, rotate: -2 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                <img
                  src="/images/reading simulation.png"
                  alt="Reading Simulation"
                  className="w-full h-full object-contain"
                  loading="eager"
                />
              </motion.div>

              {/* Front screenshot - pop out */}
              <motion.div
                className="absolute bottom-0 right-[10%] w-[75%] h-[45%] bg-white rounded-2xl shadow-2xl overflow-hidden border-4 border-cyan z-30"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.7, type: "spring" }}
              >
                <img
                  src="/images/insights 5.png"
                  alt="Performance Analytics"
                  className="w-full h-full object-contain"
                  loading="eager"
                />
              </motion.div>

              {/* Floating accent elements */}
              <motion.div
                className="absolute top-10 left-10 w-20 h-20 bg-orange/20 rounded-full blur-xl"
                animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <ChevronDown className="w-6 h-6 text-mid-gray animate-bounce" />
        </motion.div>
      </section>

      {/* Stats Bar - Full Width, Data-Focused */}
      <section className="py-12 bg-charcoal-light border-y border-charcoal-lighter">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { label: 'Practice Questions', value: '1000+', icon: Target },
              { label: 'Student Success Rate', value: '92%', icon: Trophy },
              { label: 'Average Score Improvement', value: '+18%', icon: BarChart3 },
              { label: 'Hours of Content', value: '50+', icon: Zap }
            ].map((stat, index) => (
              <motion.div
                key={index}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <stat.icon className="w-8 h-8 text-cyan mx-auto mb-2" />
                <div className="text-3xl lg:text-4xl font-display font-bold text-off-white mb-1 font-mono">
                  {stat.value}
                </div>
                <div className="text-sm text-mid-gray uppercase tracking-wider">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Section - keep original but style differently */}
      <section id="products" className="py-20 lg:py-32 bg-charcoal">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            className="text-center max-w-3xl mx-auto mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl lg:text-6xl font-display font-bold text-off-white mb-6">
              Choose Your{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan to-orange">
                Test Pathway
              </span>
            </h2>
            <p className="text-xl text-light-gray">
              Comprehensive preparation for every major Australian academic exam
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-charcoal-light border-2 border-charcoal-lighter hover:border-cyan transition-all duration-300 group cursor-pointer h-full">
                  <Link to={`/course/${course.id}`} className="block p-6 h-full flex flex-col">
                    {/* Icon */}
                    <div className="w-14 h-14 bg-gradient-to-br from-cyan/20 to-orange/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Trophy className="w-7 h-7 text-cyan" />
                    </div>

                    {/* Title */}
                    <h3 className="text-2xl font-display font-bold text-off-white mb-3 group-hover:text-cyan transition-colors">
                      {course.title}
                    </h3>

                    {/* Description */}
                    <p className="text-light-gray mb-6 flex-grow">
                      {course.description}
                    </p>

                    {/* CTA */}
                    <div className="flex items-center text-cyan font-semibold group-hover:translate-x-2 transition-transform">
                      View Details
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </div>
                  </Link>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer - Minimal */}
      <footer className="py-12 bg-charcoal-light border-t border-charcoal-lighter">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-mid-gray text-sm mb-4 md:mb-0">
              © {new Date().getFullYear()} EduCourse. All rights reserved.
            </div>
            <div className="flex items-center space-x-6">
              <Link to="/privacy" className="text-mid-gray hover:text-cyan transition-colors text-sm">
                Privacy
              </Link>
              <Link to="/terms" className="text-mid-gray hover:text-cyan transition-colors text-sm">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
