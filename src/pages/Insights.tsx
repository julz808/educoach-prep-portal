import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Target, Clock, Award, BookOpen, Brain, Calculator, 
  ChevronRight, TrendingUp, Calendar, Zap, AlertTriangle,
  CheckCircle2, ArrowRight, Play, BarChart3, Trophy,
  Timer, Star, Users, Flame
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProduct } from '@/context/ProductContext';

// Enhanced type definitions for diagnostic-driven data
interface SkillGap {
  skill: string;
  subject: string;
  currentLevel: number;
  targetLevel: number;
  priority: 'Critical' | 'High' | 'Medium';
  estimatedWeeks: number;
  lastTested: string;
  practiceCount: number;
}

interface TestReadiness {
  overall: number;
  sections: {
    [key: string]: {
      score: number;
      ready: boolean;
      skillsCount: number;
      masteredSkills: number;
    };
  };
  nextTest: {
    name: string;
    recommendedDate: string;
    confidence: number;
  };
}

interface StudyGoal {
  skill: string;
  subject: string;
  target: number;
  current: number;
  dueDate: string;
  sessionsCompleted: number;
  totalSessions: number;
}

interface DiagnosticData {
  skillGaps: SkillGap[];
  testReadiness: TestReadiness;
  currentGoal: StudyGoal;
  studyStreak: number;
  weeklyProgress: {
    week: string;
    skillsImproved: number;
    practiceMinutes: number;
    testsCompleted: number;
  }[];
  subjectBreakdown: {
    [key: string]: {
      mastery: number;
      skillsTotal: number;
      skillsMastered: number;
      recentImprovement: number;
      weakestSkills: string[];
    };
  };
}

// Diagnostic-focused performance data
const diagnosticData: { [key: string]: DiagnosticData } = {
  'edutest-year-7': {
    skillGaps: [
      {
        skill: 'Vocabulary in Context',
        subject: 'English',
        currentLevel: 68,
        targetLevel: 85,
        priority: 'Critical',
        estimatedWeeks: 3,
        lastTested: '2024-01-18',
        practiceCount: 4
      },
      {
        skill: 'Pattern Recognition',
        subject: 'General Ability',
        currentLevel: 72,
        targetLevel: 85,
        priority: 'High',
        estimatedWeeks: 2,
        lastTested: '2024-01-17',
        practiceCount: 2
      },
      {
        skill: 'Word Problems',
        subject: 'Mathematics',
        currentLevel: 76,
        targetLevel: 85,
        priority: 'High',
        estimatedWeeks: 2,
        lastTested: '2024-01-16',
        practiceCount: 3
      }
    ],
    testReadiness: {
      overall: 78,
      sections: {
        English: { score: 75, ready: false, skillsCount: 12, masteredSkills: 9 },
        Mathematics: { score: 82, ready: true, skillsCount: 10, masteredSkills: 8 },
        'General Ability': { score: 77, ready: false, skillsCount: 8, masteredSkills: 6 }
      },
      nextTest: {
        name: 'EduTest Practice Test 3',
        recommendedDate: '2024-01-25',
        confidence: 78
      }
    },
    currentGoal: {
      skill: 'Vocabulary in Context',
      subject: 'English',
      target: 85,
      current: 68,
      dueDate: '2024-02-08',
      sessionsCompleted: 4,
      totalSessions: 12
    },
    studyStreak: 5,
    weeklyProgress: [
      { week: 'Week 1', skillsImproved: 2, practiceMinutes: 180, testsCompleted: 1 },
      { week: 'Week 2', skillsImproved: 3, practiceMinutes: 240, testsCompleted: 2 },
      { week: 'Week 3', skillsImproved: 1, practiceMinutes: 210, testsCompleted: 1 },
      { week: 'Week 4', skillsImproved: 2, practiceMinutes: 195, testsCompleted: 1 }
    ],
    subjectBreakdown: {
      English: {
        mastery: 75,
        skillsTotal: 12,
        skillsMastered: 9,
        recentImprovement: 5,
        weakestSkills: ['Vocabulary in Context', 'Reading Inference', 'Grammar Rules']
      },
      Mathematics: {
        mastery: 82,
        skillsTotal: 10,
        skillsMastered: 8,
        recentImprovement: 3,
        weakestSkills: ['Word Problems', 'Geometry Concepts']
      },
      'General Ability': {
        mastery: 77,
        skillsTotal: 8,
        skillsMastered: 6,
        recentImprovement: 2,
        weakestSkills: ['Pattern Recognition', 'Spatial Reasoning']
      }
    }
  },
  'year-7-naplan': {
    skillGaps: [
      {
        skill: 'Reading Inference',
        subject: 'Reading',
        currentLevel: 70,
        targetLevel: 80,
        priority: 'Critical',
        estimatedWeeks: 2,
        lastTested: '2024-01-18',
        practiceCount: 3
      },
      {
        skill: 'Fraction Operations',
        subject: 'Numeracy',
        currentLevel: 74,
        targetLevel: 82,
        priority: 'High',
        estimatedWeeks: 2,
        lastTested: '2024-01-17',
        practiceCount: 2
      }
    ],
    testReadiness: {
      overall: 76,
      sections: {
        Reading: { score: 73, ready: false, skillsCount: 8, masteredSkills: 6 },
        Writing: { score: 78, ready: true, skillsCount: 6, masteredSkills: 5 },
        Numeracy: { score: 77, ready: false, skillsCount: 10, masteredSkills: 7 }
      },
      nextTest: {
        name: 'NAPLAN Practice Test 2',
        recommendedDate: '2024-01-26',
        confidence: 76
      }
    },
    currentGoal: {
      skill: 'Reading Inference',
      subject: 'Reading',
      target: 80,
      current: 70,
      dueDate: '2024-02-01',
      sessionsCompleted: 3,
      totalSessions: 8
    },
    studyStreak: 3,
    weeklyProgress: [
      { week: 'Week 1', skillsImproved: 1, practiceMinutes: 120, testsCompleted: 1 },
      { week: 'Week 2', skillsImproved: 2, practiceMinutes: 180, testsCompleted: 1 },
      { week: 'Week 3', skillsImproved: 2, practiceMinutes: 160, testsCompleted: 2 },
      { week: 'Week 4', skillsImproved: 1, practiceMinutes: 140, testsCompleted: 1 }
    ],
    subjectBreakdown: {
      Reading: {
        mastery: 73,
        skillsTotal: 8,
        skillsMastered: 6,
        recentImprovement: 4,
        weakestSkills: ['Reading Inference', 'Main Ideas', 'Vocabulary']
      },
      Writing: {
        mastery: 78,
        skillsTotal: 6,
        skillsMastered: 5,
        recentImprovement: 2,
        weakestSkills: ['Text Structure']
      },
      Numeracy: {
        mastery: 77,
        skillsTotal: 10,
        skillsMastered: 7,
        recentImprovement: 3,
        weakestSkills: ['Fraction Operations', 'Percentage Problems', 'Algebra']
      }
    }
  }
};

const PerformanceInsights: React.FC = () => {
  const { selectedProduct } = useProduct();
  const data = diagnosticData[selectedProduct] || diagnosticData['edutest-year-7'];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-500';
      case 'High':
        return 'bg-orange-500';
      case 'Medium':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getSubjectIcon = (subject: string) => {
    switch (subject.toLowerCase()) {
      case 'english':
      case 'reading':
      case 'writing':
        return <BookOpen size={20} />;
      case 'mathematics':
      case 'numeracy':
        return <Calculator size={20} />;
      case 'general ability':
        return <Brain size={20} />;
      default:
        return <BookOpen size={20} />;
    }
  };

  const getReadinessStatus = (score: number) => {
    if (score >= 85) return { label: 'Excellent', color: 'text-green-600', bg: 'bg-green-50' };
    if (score >= 75) return { label: 'Good', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (score >= 65) return { label: 'Developing', color: 'text-orange-600', bg: 'bg-orange-50' };
    return { label: 'Needs Work', color: 'text-red-600', bg: 'bg-red-50' };
  };

  const readinessStatus = getReadinessStatus(data.testReadiness.overall);

  return (
    <div className="space-y-6">
      {/* Streamlined Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-6 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold mb-2">
              Your Performance Dashboard
            </h1>
            <p className="text-lg opacity-90">
              Focus on what matters most for your test success
            </p>
          </div>
          <div className="mt-4 lg:mt-0 text-center">
            <div className="text-3xl font-bold mb-1">{data.testReadiness.overall}%</div>
            <div className={cn("text-sm px-3 py-1 rounded-full", readinessStatus.bg, readinessStatus.color)}>
              {readinessStatus.label}
            </div>
          </div>
        </div>
      </div>

      {/* Three Focused Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Test Readiness Card */}
        <Card className="border-l-4 border-l-indigo-500 bg-gradient-to-br from-indigo-50 to-indigo-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-indigo-500 rounded-lg">
                <Target className="text-white" size={24} />
              </div>
              <Badge className="bg-indigo-100 text-indigo-700">
                {data.testReadiness.nextTest.recommendedDate}
              </Badge>
            </div>
            <h3 className="text-2xl font-bold text-indigo-900 mb-1">{data.testReadiness.overall}%</h3>
            <p className="text-indigo-700 text-sm mb-2">Test Ready</p>
            <p className="text-xs text-indigo-600">Next: {data.testReadiness.nextTest.name}</p>
          </CardContent>
        </Card>

        {/* Current Goal Progress */}
        <Card className="border-l-4 border-l-emerald-500 bg-gradient-to-br from-emerald-50 to-emerald-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-emerald-500 rounded-lg">
                <Trophy className="text-white" size={24} />
              </div>
              <Badge className="bg-emerald-100 text-emerald-700">
                {data.currentGoal.sessionsCompleted}/{data.currentGoal.totalSessions}
              </Badge>
            </div>
            <h3 className="text-lg font-bold text-emerald-900 mb-1">{data.currentGoal.skill}</h3>
            <Progress 
              value={(data.currentGoal.sessionsCompleted / data.currentGoal.totalSessions) * 100} 
              className="h-2 mb-2" 
            />
            <p className="text-xs text-emerald-600">Due: {data.currentGoal.dueDate}</p>
          </CardContent>
        </Card>

        {/* Study Streak */}
        <Card className="border-l-4 border-l-orange-500 bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-500 rounded-lg">
                <Flame className="text-white" size={24} />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-orange-900 mb-1">{data.studyStreak}</h3>
            <p className="text-orange-700 text-sm mb-2">Day Streak</p>
            <div className="flex items-center space-x-1 text-xs text-orange-600">
              <Zap size={12} />
              <span>Keep it going!</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Redesigned Tab Structure */}
      <Tabs defaultValue="focus" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="focus" className="flex items-center space-x-2">
            <Target size={16} />
            <span>Focus Areas</span>
          </TabsTrigger>
          <TabsTrigger value="sections" className="flex items-center space-x-2">
            <BarChart3 size={16} />
            <span>Test Sections</span>
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center space-x-2">
            <TrendingUp size={16} />
            <span>Progress History</span>
          </TabsTrigger>
        </TabsList>

        {/* Focus Areas Tab - PRIMARY */}
        <TabsContent value="focus" className="space-y-6">
          {/* Priority Skills Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center space-x-2">
                <AlertTriangle className="text-orange-500" size={24} />
                <span>Priority Skills to Practice</span>
              </h2>
              <Badge variant="outline" className="text-sm">
                Based on recent diagnostics
              </Badge>
            </div>
            
            <div className="grid gap-4">
              {data.skillGaps.slice(0, 3).map((gap, index) => (
                <Card key={gap.skill} className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <div className={cn("w-3 h-3 rounded-full", getPriorityColor(gap.priority))}></div>
                          <span className="text-sm font-medium text-gray-600">{gap.priority} Priority</span>
                        </div>
                        {getSubjectIcon(gap.subject)}
                        <div>
                          <h3 className="font-bold text-lg">{gap.skill}</h3>
                          <p className="text-sm text-gray-600">{gap.subject}</p>
                        </div>
                      </div>
                      <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                        <Play size={16} className="mr-2" />
                        Start Practice
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span>Current Level</span>
                        <span className="font-medium">{gap.currentLevel}% → {gap.targetLevel}%</span>
                      </div>
                      <Progress value={gap.currentLevel} className="h-2" />
                      
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>📅 ~{gap.estimatedWeeks} weeks to improve</span>
                        <span>🎯 {gap.practiceCount} practice sessions completed</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap size={20} />
                <span>Recommended Next Steps</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" size="lg" className="h-auto p-4 justify-start">
                  <div className="flex items-center space-x-3">
                    <Target className="text-orange-500" size={20} />
                    <div className="text-left">
                      <div className="font-medium">Continue Current Goal</div>
                      <div className="text-sm text-gray-600">{data.currentGoal.skill}</div>
                    </div>
                  </div>
                  <ChevronRight className="ml-auto" size={16} />
                </Button>
                
                <Button variant="outline" size="lg" className="h-auto p-4 justify-start">
                  <div className="flex items-center space-x-3">
                    <Clock className="text-blue-500" size={20} />
                    <div className="text-left">
                      <div className="font-medium">Take Practice Test</div>
                      <div className="text-sm text-gray-600">{data.testReadiness.nextTest.name}</div>
                    </div>
                  </div>
                  <ChevronRight className="ml-auto" size={16} />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Test Sections Tab - SECONDARY */}
        <TabsContent value="sections" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {Object.entries(data.subjectBreakdown).map(([subject, breakdown]) => (
              <Card key={subject} className="transition-all hover:shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getSubjectIcon(subject)}
                      <CardTitle className="text-lg">{subject}</CardTitle>
                    </div>
                    <Badge className={breakdown.mastery >= 80 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}>
                      {breakdown.mastery}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Skills Mastered</span>
                        <span>{breakdown.skillsMastered}/{breakdown.skillsTotal}</span>
                      </div>
                      <Progress value={(breakdown.skillsMastered / breakdown.skillsTotal) * 100} className="h-2" />
                    </div>

                    <div className="space-y-2">
                      <h5 className="font-medium text-sm">Needs Attention</h5>
                      {breakdown.weakestSkills.slice(0, 3).map((skill) => (
                        <div key={skill} className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">{skill}</span>
                          <Button size="sm" variant="ghost" className="h-6 px-2 text-xs">
                            Practice
                            <ArrowRight size={12} className="ml-1" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Progress History Tab - TERTIARY */}
        <TabsContent value="progress" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Progress Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.weeklyProgress.map((week, index) => (
                  <div key={week.week} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-16 text-sm font-medium">{week.week}</div>
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Skills Improved: {week.skillsImproved}</span>
                        <span>Practice: {week.practiceMinutes}min</span>
                      </div>
                      <Progress value={(week.skillsImproved / 4) * 100} className="h-2" />
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {week.testsCompleted} test{week.testsCompleted !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PerformanceInsights;
