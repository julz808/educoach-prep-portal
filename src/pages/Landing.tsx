
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { BookOpen, BarChart2, PenTool, Award, ArrowRight } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user && !isLoading) {
      navigate('/dashboard');
    }
  }, [user, isLoading, navigate]);

  return (
    <div className="min-h-screen bg-edu-light-blue">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">Prepare for Success with EduCourse</h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-8">
            The comprehensive platform for mastering standardized tests through personalized practice and analytics.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild>
              <Link to="/auth">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose EduCourse?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<BookOpen className="h-10 w-10" />}
              title="Comprehensive Content"
              description="Access thousands of practice questions across all test subjects and topics."
            />
            <FeatureCard
              icon={<BarChart2 className="h-10 w-10" />}
              title="Detailed Analytics"
              description="Track your progress with detailed performance metrics and insights."
            />
            <FeatureCard
              icon={<PenTool className="h-10 w-10" />}
              title="Personalized Practice"
              description="Focus on your weak areas with adaptive learning technology."
            />
            <FeatureCard
              icon={<Award className="h-10 w-10" />}
              title="Proven Results"
              description="Join thousands of successful students who improved their scores."
            />
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold mb-6">Ready to boost your test scores?</h2>
        <p className="text-xl text-gray-700 max-w-2xl mx-auto mb-8">
          Join EduCourse today and start your journey to academic success.
        </p>
        <Button size="lg" asChild>
          <Link to="/auth">Sign Up Now</Link>
        </Button>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => {
  return (
    <div className="bg-gray-50 rounded-lg p-6 shadow-sm hover:shadow-md transition-all">
      <div className="text-primary mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

export default Landing;
