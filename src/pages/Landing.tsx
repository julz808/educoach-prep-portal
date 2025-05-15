import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { BookOpen, Target, BarChart3, GraduationCap, Users, Check } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();
  
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };
  
  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  return (
    <div className="min-h-screen bg-edu-light-blue font-sans">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-edu-coral text-2xl font-bold">Edu</span>
            <span className="text-edu-teal text-2xl font-bold">Course</span>
          </div>
          <Button 
            variant="outline"
            className="border-edu-teal text-edu-teal hover:bg-edu-teal/10"
            onClick={() => navigate('/dashboard')}
          >
            Student Login
          </Button>
        </div>
      </nav>

      {/* Hero Section - Centered */}
      <section className="container mx-auto px-6 pt-20 pb-24 lg:pt-32 lg:pb-32">
        <motion.div 
          className="flex flex-col items-center text-center max-w-3xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.3
              }
            }
          }}
        >
          <motion.h1 
            className="text-4xl lg:text-5xl font-bold text-edu-navy mb-6"
            variants={fadeIn}
          >
            We're here to help you ace your next test!
          </motion.h1>
          <motion.p 
            className="text-lg lg:text-xl text-edu-navy/70 mb-8 max-w-2xl"
            variants={fadeIn}
          >
            Australia's best-in-class test preparation platform designed to help students excel in standardized tests with personalized learning paths.
          </motion.p>
          <motion.div variants={fadeIn}>
            <Button 
              className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white px-8 py-6 rounded-full text-lg"
              onClick={() => document.getElementById('supported-tests')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Find your test
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Supported Tests */}
      <section id="supported-tests" className="bg-white py-20">
        <div className="container mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-edu-navy mb-4">Supported Tests</h2>
            <p className="text-lg text-edu-navy/70 max-w-2xl mx-auto">
              Comprehensive preparation for Australia's major standardized tests
            </p>
          </motion.div>
          
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {[
              { name: "NAPLAN", icon: <BookOpen className="h-10 w-10 text-edu-teal mb-4" /> },
              { name: "Selective Entry", icon: <GraduationCap className="h-10 w-10 text-edu-coral mb-4" /> },
              { name: "EduTest", icon: <Target className="h-10 w-10 text-edu-teal mb-4" /> },
              { name: "ACER", icon: <BarChart3 className="h-10 w-10 text-edu-coral mb-4" /> }
            ].map((test, index) => (
              <motion.div
                key={test.name}
                className="bg-edu-light-blue rounded-xl p-8 text-center shadow-sm hover:shadow-md transition-shadow"
                variants={fadeIn}
              >
                <div className="flex justify-center">{test.icon}</div>
                <h3 className="font-bold text-xl text-edu-navy">{test.name}</h3>
                <p className="text-edu-navy/70 mt-2">Comprehensive preparation</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-edu-light-blue">
        <div className="container mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-edu-navy mb-4">How It Works</h2>
            <p className="text-lg text-edu-navy/70 max-w-2xl mx-auto">
              Our three-step approach to mastering standardized tests
            </p>
          </motion.div>
          
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {[
              { 
                title: "Take a smart diagnostic test", 
                icon: <TestTube className="h-12 w-12 text-edu-teal mb-4" />,
                description: "Identify your strengths and areas for improvement with our adaptive diagnostic test"
              },
              { 
                title: "Practise with targeted drills", 
                icon: <Target className="h-12 w-12 text-edu-coral mb-4" />,
                description: "Focus your study time on the specific areas where you need the most improvement"
              },
              { 
                title: "Track your progress", 
                icon: <BarChart3 className="h-12 w-12 text-edu-teal mb-4" />,
                description: "Monitor your improvement with detailed analytics and personalized insights"
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-xl p-8 text-center shadow-sm relative"
                variants={fadeIn}
              >
                <div className="flex justify-center">{step.icon}</div>
                <div className="absolute top-4 left-4 bg-edu-teal text-white h-8 w-8 rounded-full flex items-center justify-center font-bold">
                  {index + 1}
                </div>
                <h3 className="font-bold text-xl text-edu-navy mb-3">{step.title}</h3>
                <p className="text-edu-navy/70">{step.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Who We Are */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <motion.div 
              className="lg:w-1/3 flex justify-center"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="bg-edu-light-blue p-8 rounded-full">
                <Users className="h-24 w-24 text-edu-teal" />
              </div>
            </motion.div>
            <motion.div 
              className="lg:w-2/3"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-edu-navy mb-6">Who We Are</h2>
              <p className="text-lg text-edu-navy/70 mb-4">
                We are a team of passionate teachers and instructors with vast experience in test preparation across all major Australian standardized tests. With decades of combined teaching experience, we understand what students need to succeed.
              </p>
              <p className="text-lg text-edu-navy/70">
                Our approach combines tried-and-tested teaching methods with cutting-edge technology to create a learning experience that's both effective and engaging for students of all ages and learning styles.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How We Help */}
      <section className="py-20 bg-edu-light-blue">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row-reverse items-center gap-12">
            <motion.div 
              className="lg:w-1/3 flex justify-center"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="bg-white p-8 rounded-full">
                <BookOpen className="h-24 w-24 text-edu-coral" />
              </div>
            </motion.div>
            <motion.div 
              className="lg:w-2/3"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-edu-navy mb-6">How We Help</h2>
              <p className="text-lg text-edu-navy/70 mb-4">
                We offer individual and all-in-one packages that prepare you for every section of your test. Our platform adapts to your learning style and pace, focusing on areas where you need the most improvement.
              </p>
              <p className="text-lg text-edu-navy/70">
                Through personalized learning paths, targeted practice drills, and comprehensive mock exams, we ensure you're fully prepared and confident when test day arrives.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-edu-navy mb-4">Student Testimonials</h2>
            <p className="text-lg text-edu-navy/70 max-w-2xl mx-auto">
              Hear from students who have achieved their goals with EduCourse
            </p>
          </motion.div>
          
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {[
              {
                name: "Emily S.",
                image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily",
                text: "The NAPLAN prep program helped me improve my score by over 25%. The practice tests were spot-on with what appeared on the actual exam.",
                test: "NAPLAN Year 9"
              },
              {
                name: "Liam K.",
                image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Liam",
                text: "I was struggling with math until I started using EduCourse. The targeted drills helped me focus on my weak areas and I got into my first-choice selective school!",
                test: "Selective Entry"
              },
              {
                name: "Sarah P.",
                image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
                text: "As a parent, I found EduCourse incredibly helpful. The detailed analytics showed exactly where my daughter needed help, and the results speak for themselves.",
                test: "ACER Scholarship"
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                className="bg-edu-light-blue rounded-xl p-8 shadow-sm"
                variants={fadeIn}
              >
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 rounded-full overflow-hidden mr-4">
                    <img 
                      src={testimonial.image} 
                      alt={testimonial.name} 
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-edu-navy">{testimonial.name}</h3>
                    <p className="text-sm text-edu-navy/70">{testimonial.test}</p>
                  </div>
                </div>
                <p className="text-edu-navy/80 italic">"{testimonial.text}"</p>
                <div className="flex mt-4">
                  {[...Array(5)].map((_, i) => (
                    <motion.span 
                      key={i}
                      className="text-edu-coral"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 * i }}
                    >★</motion.span>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-edu-navy text-white py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-8 md:mb-0">
              <div className="flex items-center mb-4">
                <span className="text-edu-coral text-2xl font-bold">Edu</span>
                <span className="text-edu-teal text-2xl font-bold">Course</span>
              </div>
              <p className="text-white/70 max-w-sm">
                Helping Australian students excel in standardized tests since 2018.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h3 className="font-bold mb-4 text-edu-teal">Tests</h3>
                <ul className="space-y-2 text-white/70">
                  <li>NAPLAN</li>
                  <li>Selective Entry</li>
                  <li>EduTest</li>
                  <li>ACER</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold mb-4 text-edu-teal">Resources</h3>
                <ul className="space-y-2 text-white/70">
                  <li>Practice Tests</li>
                  <li>Drills</li>
                  <li>Diagnostics</li>
                  <li>Study Guides</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold mb-4 text-edu-teal">Company</h3>
                <ul className="space-y-2 text-white/70">
                  <li>About Us</li>
                  <li>Contact</li>
                  <li>Privacy Policy</li>
                  <li>Terms of Service</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 mt-12 pt-6 text-center text-white/50 text-sm">
            <p>© 2025 EduCourse. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

const TestTube = ({ className }: { className?: string }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M14.5 2v10.5c0 2.5-2 4.5-4.5 4.5s-4.5-2-4.5-4.5V2"></path>
      <path d="M8.5 2h6"></path>
      <path d="M6.5 7.5v5c0 1.66 1.34 3 3 3s3-1.34 3-3v-5"></path>
    </svg>
  );
};
