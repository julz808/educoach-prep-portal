
import { ArrowRight, BookOpen, CheckCircle, Clock, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const Dashboard = () => {
  // Mock data - would come from API in a real app
  const stats = {
    questionsAnswered: 342,
    accuracy: 76,
    lastTestScore: 82,
    streak: 5,
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-edu-navy mb-1">Welcome back, Julian!</h1>
        <p className="text-edu-navy/70">Continue your test preparation journey</p>
      </div>
      
      {/* Continue where you left off */}
      <Card className="edu-card bg-gradient-to-br from-edu-teal/10 to-edu-light-blue border-none">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-2">Continue where you left off</h2>
            <p className="text-edu-navy/70 mb-4">Year 9 NAPLAN Reading - Section 2</p>
            <div className="flex gap-2 mb-4">
              <span className="bg-edu-teal/20 px-3 py-1 rounded-full text-xs text-edu-teal">
                <Clock size={12} className="inline mr-1" /> 15 questions left
              </span>
              <span className="bg-edu-light-blue px-3 py-1 rounded-full text-xs text-edu-navy/70">
                <TrendingUp size={12} className="inline mr-1" /> 65% complete
              </span>
            </div>
            <button className="btn-primary flex items-center gap-2">
              <span>Resume</span>
              <ArrowRight size={16} />
            </button>
          </div>
          <div className="hidden lg:block">
            <BookOpen size={120} className="text-edu-teal/20" />
          </div>
        </div>
      </Card>
      
      {/* Stats Cards */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Your progress</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="edu-card">
            <h3 className="text-sm text-edu-navy/70 mb-1">Questions Answered</h3>
            <p className="text-3xl font-bold text-edu-navy">{stats.questionsAnswered}</p>
            <span className="text-xs text-edu-teal">+24 this week</span>
          </Card>
          
          <Card className="edu-card">
            <h3 className="text-sm text-edu-navy/70 mb-1">Average Accuracy</h3>
            <p className="text-3xl font-bold text-edu-navy">{stats.accuracy}%</p>
            <div className="mt-2">
              <Progress value={stats.accuracy} className="h-1.5" />
            </div>
          </Card>
          
          <Card className="edu-card">
            <h3 className="text-sm text-edu-navy/70 mb-1">Last Test Score</h3>
            <p className="text-3xl font-bold text-edu-navy">{stats.lastTestScore}%</p>
            <span className="text-xs text-edu-teal">+5% from previous</span>
          </Card>
          
          <Card className="edu-card">
            <h3 className="text-sm text-edu-navy/70 mb-1">Daily Streak</h3>
            <p className="text-3xl font-bold text-edu-navy">{stats.streak} days</p>
            <span className="text-xs text-edu-teal">Keep it up!</span>
          </Card>
        </div>
      </div>
      
      {/* Suggested next drill */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="edu-card col-span-2">
          <h2 className="text-xl font-semibold mb-4">Recommended for you</h2>
          <div className="space-y-4">
            <div className="bg-edu-light-blue rounded-lg p-4 flex items-center justify-between">
              <div>
                <h3 className="font-medium">Fractions & Decimals Drill</h3>
                <p className="text-sm text-edu-navy/70">15 questions • ~20 minutes</p>
              </div>
              <button className="btn-secondary">Start</button>
            </div>
            
            <div className="bg-edu-light-blue rounded-lg p-4 flex items-center justify-between">
              <div>
                <h3 className="font-medium">Vocabulary Builder</h3>
                <p className="text-sm text-edu-navy/70">20 questions • ~25 minutes</p>
              </div>
              <button className="btn-secondary">Start</button>
            </div>
          </div>
        </Card>
        
        <Card className="edu-card">
          <h2 className="text-xl font-semibold mb-4">Skills breakdown</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">Reading Comprehension</span>
                <span className="text-sm text-edu-teal">85%</span>
              </div>
              <Progress value={85} className="h-1.5" />
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">Numerical Reasoning</span>
                <span className="text-sm text-edu-teal">72%</span>
              </div>
              <Progress value={72} className="h-1.5" />
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">Writing</span>
                <span className="text-sm text-edu-coral">58%</span>
              </div>
              <Progress value={58} className="h-1.5" />
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">Grammar & Spelling</span>
                <span className="text-sm text-edu-teal">92%</span>
              </div>
              <Progress value={92} className="h-1.5" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
